import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdatePreferencesInput } from '@faro/validation';
import { toUserProfile } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const counts = await this.getCounts(userId);
    return toUserProfile(user, counts);
  }

  async getProfileByUsername(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const counts = await this.getCounts(user.id);
    return toUserProfile(user, counts);
  }

  async updateMe(
    userId: string,
    input: { displayName?: string; bio?: string; avatarUrl?: string },
  ) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: input });
    const counts = await this.getCounts(userId);
    return toUserProfile(user, counts);
  }

  async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    return this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
  }

  async completeOnboardingObjective(userId: string, objective: string) {
    return this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, faithPathObjective: objective as any },
      update: { faithPathObjective: objective as any },
    });
  }

  async completeOnboarding(userId: string) {
    return this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, onboardingCompleted: true },
      update: { onboardingCompleted: true },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.userPreferences.findUnique({ where: { userId } });
  }

  private async getCounts(userId: string) {
    const [followerCount, followingCount, videoCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.video.count({ where: { creatorId: userId, status: 'READY' } }),
    ]);
    return { followerCount, followingCount, videoCount };
  }
}
