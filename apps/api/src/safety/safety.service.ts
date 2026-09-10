import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async block(blockingId: string, blockedId: string) {
    if (blockingId === blockedId) throw new BadRequestException('No puedes bloquearte a ti mismo');
    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: { blockingId_blockedId: { blockingId, blockedId } },
        create: { blockingId, blockedId },
        update: {},
      }),
      this.prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockingId, followingId: blockedId },
            { followerId: blockedId, followingId: blockingId },
          ],
        },
      }),
    ]);
    return { blocked: true };
  }

  async unblock(blockingId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockingId, blockedId } });
    return { blocked: false };
  }

  async listBlocked(userId: string) {
    const rows = await this.prisma.block.findMany({
      where: { blockingId: userId },
      include: { blockedUser: true },
    });
    return rows.map((r) => r.blockedUser);
  }

  async mute(mutingId: string, mutedId: string) {
    if (mutingId === mutedId) throw new BadRequestException('No puedes silenciarte a ti mismo');
    await this.prisma.mute.upsert({
      where: { mutingId_mutedId: { mutingId, mutedId } },
      create: { mutingId, mutedId },
      update: {},
    });
    return { muted: true };
  }

  async unmute(mutingId: string, mutedId: string) {
    await this.prisma.mute.deleteMany({ where: { mutingId, mutedId } });
    return { muted: false };
  }
}
