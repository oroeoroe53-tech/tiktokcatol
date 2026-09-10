import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ChallengeSummary } from '@faro/types';

const STREAK_GRACE_HOURS = 36; // margen para no romper la racha por husos horarios / uso nocturno

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string | undefined, activeOnly = true): Promise<ChallengeSummary[]> {
    const challenges = await this.prisma.challenge.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: {
        _count: { select: { progress: true } },
        progress: userId ? { where: { userId } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });
    return challenges.map((c: any) => this.toSummary(c, c.progress?.[0] ?? null));
  }

  async getById(id: string, userId?: string): Promise<ChallengeSummary> {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { progress: true } },
        progress: userId ? { where: { userId } } : false,
        days: { orderBy: { dayNumber: 'asc' } },
      },
    });
    if (!challenge) throw new NotFoundException('Reto no encontrado');
    return this.toSummary(challenge, (challenge as any).progress?.[0] ?? null);
  }

  async start(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Reto no encontrado');

    return this.prisma.challengeProgress.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      create: { userId, challengeId },
      update: {},
    });
  }

  async completeToday(userId: string, challengeId: string) {
    const [challenge, progress] = await Promise.all([
      this.prisma.challenge.findUnique({ where: { id: challengeId } }),
      this.prisma.challengeProgress.findUnique({ where: { userId_challengeId: { userId, challengeId } } }),
    ]);
    if (!challenge) throw new NotFoundException('Reto no encontrado');
    if (!progress) throw new BadRequestException('Debes iniciar el reto antes de completar un día');
    if (progress.completed) return progress;

    const hoursSinceLastActivity = (Date.now() - progress.lastActivityAt.getTime()) / 3_600_000;
    const streak = hoursSinceLastActivity <= STREAK_GRACE_HOURS ? progress.streak + 1 : 1;
    const nextDay = progress.currentDay + 1;
    const completed = nextDay > challenge.durationDays;

    return this.prisma.challengeProgress.update({
      where: { userId_challengeId: { userId, challengeId } },
      data: {
        currentDay: completed ? challenge.durationDays : nextDay,
        streak,
        completed,
        completedAt: completed ? new Date() : null,
        lastActivityAt: new Date(),
      },
    });
  }

  private toSummary(challenge: any, progress: any | null): ChallengeSummary {
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      imageUrl: challenge.imageUrl,
      category: challenge.category,
      durationDays: challenge.durationDays,
      active: challenge.active,
      participantCount: challenge._count?.progress ?? 0,
      viewerProgress: progress
        ? { currentDay: progress.currentDay, completed: progress.completed, streak: progress.streak }
        : null,
    };
  }
}
