import { Injectable, NotFoundException } from '@nestjs/common';
import { ModerationStatus } from '@faro/types';
import type { CreatePrayerIntentionInput } from '@faro/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AutoModerationService } from '../moderation/auto-moderation.service';
import { toUserSummary } from '../users/users.mapper';
import type { PrayerIntentionSummary, PrayerSummary } from '@faro/types';

@Injectable()
export class PrayerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoModeration: AutoModerationService,
  ) {}

  async list(category: string | undefined, language: string, userId?: string): Promise<PrayerSummary[]> {
    const prayers = await this.prisma.prayer.findMany({
      where: { language, ...(category ? { category: category as any } : {}) },
      orderBy: { title: 'asc' },
    });
    const favoriteIds = userId ? await this.getFavoriteIds(userId) : new Set<string>();
    return prayers.map((p) => this.toSummary(p, favoriteIds.has(p.id)));
  }

  async getDaily(language: string, userId?: string): Promise<PrayerSummary> {
    const prayers = await this.prisma.prayer.findMany({
      where: { language },
      orderBy: { id: 'asc' },
    });
    if (prayers.length === 0) throw new NotFoundException('No hay oraciones disponibles');
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    const prayer = prayers[dayOfYear % prayers.length]!;
    const favoriteIds = userId ? await this.getFavoriteIds(userId) : new Set<string>();
    return this.toSummary(prayer, favoriteIds.has(prayer.id));
  }

  async favorite(userId: string, prayerId: string) {
    const prayer = await this.prisma.prayer.findUnique({ where: { id: prayerId } });
    if (!prayer) throw new NotFoundException('Oración no encontrada');
    await this.prisma.prayerFavorite.upsert({
      where: { userId_prayerId: { userId, prayerId } },
      create: { userId, prayerId },
      update: {},
    });
    return { favorite: true };
  }

  async unfavorite(userId: string, prayerId: string) {
    await this.prisma.prayerFavorite.deleteMany({ where: { userId, prayerId } });
    return { favorite: false };
  }

  async logSession(userId: string, prayerId: string) {
    const prayer = await this.prisma.prayer.findUnique({ where: { id: prayerId } });
    if (!prayer) throw new NotFoundException('Oración no encontrada');
    return this.prisma.prayerSessionLog.create({ data: { userId, prayerId } });
  }

  async history(userId: string, limit = 30) {
    return this.prisma.prayerSessionLog.findMany({
      where: { userId },
      include: { prayer: true },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  }

  // ── Intenciones de oración ────────────────────────────────────────────

  async createIntention(userId: string, input: CreatePrayerIntentionInput): Promise<PrayerIntentionSummary> {
    const moderationStatus = this.autoModeration.evaluateText(input.text);
    const intention = await this.prisma.prayerIntention.create({
      data: {
        authorId: userId,
        text: input.text,
        isAnonymous: input.isAnonymous,
        moderationStatus: moderationStatus === ModerationStatus.FLAGGED ? ModerationStatus.FLAGGED : ModerationStatus.APPROVED,
      },
      include: { author: true },
    });
    return this.toIntentionSummary(intention, 0, false);
  }

  async listIntentions(userId: string | undefined, cursor?: string, limit = 20) {
    const excludedIds = userId ? await this.getBlockedCreatorIds(userId) : [];
    const intentions = await this.prisma.prayerIntention.findMany({
      where: {
        moderationStatus: ModerationStatus.APPROVED,
        authorId: excludedIds.length > 0 ? { notIn: excludedIds } : undefined,
      },
      include: { author: true, supports: userId ? { where: { userId } } : false, _count: { select: { supports: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = intentions.length > limit;
    const page = hasMore ? intentions.slice(0, limit) : intentions;
    return {
      items: page.map((i: any) => this.toIntentionSummary(i, i._count.supports, (i.supports?.length ?? 0) > 0)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async support(userId: string, intentionId: string) {
    const intention = await this.prisma.prayerIntention.findUnique({ where: { id: intentionId } });
    if (!intention) throw new NotFoundException('Intención no encontrada');
    await this.prisma.prayerIntentionSupport.upsert({
      where: { userId_intentionId: { userId, intentionId } },
      create: { userId, intentionId },
      update: {},
    });
    return { praying: true };
  }

  async unsupport(userId: string, intentionId: string) {
    await this.prisma.prayerIntentionSupport.deleteMany({ where: { userId, intentionId } });
    return { praying: false };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async getFavoriteIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.prayerFavorite.findMany({ where: { userId }, select: { prayerId: true } });
    return new Set(rows.map((r) => r.prayerId));
  }

  private async getBlockedCreatorIds(userId: string): Promise<string[]> {
    const [blocked, blocking] = await Promise.all([
      this.prisma.block.findMany({ where: { blockingId: userId }, select: { blockedId: true } }),
      this.prisma.block.findMany({ where: { blockedId: userId }, select: { blockingId: true } }),
    ]);
    return [...blocked.map((b) => b.blockedId), ...blocking.map((b) => b.blockingId)];
  }

  private toSummary(prayer: any, isFavorite: boolean): PrayerSummary {
    return {
      id: prayer.id,
      title: prayer.title,
      content: prayer.content,
      category: prayer.category,
      durationSeconds: prayer.durationSeconds,
      language: prayer.language,
      audioUrl: prayer.audioUrl,
      isFavorite,
    };
  }

  private toIntentionSummary(intention: any, prayingForCount: number, viewerIsPrayingFor: boolean): PrayerIntentionSummary {
    return {
      id: intention.id,
      author: intention.isAnonymous ? null : toUserSummary(intention.author),
      text: intention.text,
      isAnonymous: intention.isAnonymous,
      prayingForCount,
      viewerIsPrayingFor,
      createdAt: intention.createdAt.toISOString(),
    };
  }
}
