import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavesService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Vídeo no encontrado');

    const existing = await this.prisma.save.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (existing) return { saved: true };

    await this.prisma.$transaction([
      this.prisma.save.create({ data: { userId, videoId } }),
      this.prisma.video.update({ where: { id: videoId }, data: { saveCount: { increment: 1 } } }),
    ]);
    return { saved: true };
  }

  async unsave(userId: string, videoId: string) {
    const existing = await this.prisma.save.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (!existing) return { saved: false };

    await this.prisma.$transaction([
      this.prisma.save.delete({ where: { userId_videoId: { userId, videoId } } }),
      this.prisma.video.update({ where: { id: videoId }, data: { saveCount: { decrement: 1 } } }),
    ]);
    return { saved: false };
  }

  async listSaved(userId: string, cursor?: string, limit = 20) {
    const rows = await this.prisma.save.findMany({
      where: { userId },
      include: { video: { include: { creator: true, hashtags: { include: { hashtag: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { rows: page, hasMore };
  }
}
