import { Injectable } from '@nestjs/common';
import { AdminAuditAction, NotificationType } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from './audit-log.service';

interface CreateChallengeInput {
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  durationDays: number;
  days: { dayNumber: number; title: string; description: string; videoId?: string; prayerId?: string }[];
}

@Injectable()
export class AdminContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { order: 'asc' } });
  }

  async updateCategory(
    adminId: string,
    key: string,
    data: { labelEs?: string; labelEn?: string; icon?: string; order?: number; active?: boolean },
  ) {
    const category = await this.prisma.category.update({ where: { key: key as any }, data });
    await this.auditLog.record(adminId, AdminAuditAction.CATEGORY_UPDATED, 'Category', key, data);
    return category;
  }

  async createChallenge(adminId: string, input: CreateChallengeInput) {
    const challenge = await this.prisma.challenge.create({
      data: {
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        category: input.category as any,
        durationDays: input.durationDays,
        days: { create: input.days },
      },
      include: { days: true },
    });
    await this.auditLog.record(adminId, AdminAuditAction.CHALLENGE_CREATED, 'Challenge', challenge.id);
    return challenge;
  }

  async setChallengeActive(adminId: string, challengeId: string, active: boolean) {
    return this.prisma.challenge.update({ where: { id: challengeId }, data: { active } });
  }

  async broadcastNotification(
    adminId: string,
    input: { title: string; body: string; audience: 'ALL' | 'ACTIVE_7D' },
  ) {
    const users = await this.prisma.user.findMany({
      where:
        input.audience === 'ACTIVE_7D'
          ? { lastActiveAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
          : {},
      select: { id: true },
      take: 5000,
    });
    await this.notifications.broadcast(
      users.map((u) => u.id),
      { type: NotificationType.SYSTEM, title: input.title, body: input.body },
    );
    await this.auditLog.record(adminId, AdminAuditAction.NOTIFICATION_BROADCAST, 'Notification', 'broadcast', {
      audience: input.audience,
      recipientCount: users.length,
    });
    return { recipientCount: users.length };
  }
}
