import { Injectable } from '@nestjs/common';
import { NotificationType } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as any,
      },
    });

    const preferences = await this.prisma.userPreferences.findUnique({ where: { userId } });
    if (preferences?.pushNotificationsEnabled ?? true) {
      await this.push.sendToUser(userId, input.title, input.body, input.data);
    }

    return notification;
  }

  async listForUser(userId: string, cursor?: string, limit = 20) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1]!.id : null };
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async broadcast(userIds: string[], input: CreateNotificationInput) {
    await Promise.all(userIds.map((userId) => this.create(userId, input)));
  }
}
