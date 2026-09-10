import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async like(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Vídeo no encontrado');

    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (existing) return { liked: true };

    await this.prisma.$transaction([
      this.prisma.like.create({ data: { userId, videoId } }),
      this.prisma.video.update({ where: { id: videoId }, data: { likeCount: { increment: 1 } } }),
    ]);

    if (video.creatorId !== userId) {
      await this.notifications.create(video.creatorId, {
        type: NotificationType.VIDEO_LIKED,
        title: 'A alguien le ha gustado tu vídeo',
        body: video.title,
        data: { videoId },
      });
    }

    return { liked: true };
  }

  async unlike(userId: string, videoId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (!existing) return { liked: false };

    await this.prisma.$transaction([
      this.prisma.like.delete({ where: { userId_videoId: { userId, videoId } } }),
      this.prisma.video.update({ where: { id: videoId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return { liked: false };
  }
}
