import { Injectable } from '@nestjs/common';
import { ReportStatus, UserStatus, VerificationStatus } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const [
      totalUsers,
      activeUsers,
      dau,
      wau,
      mau,
      totalVideos,
      totalViews,
      openReports,
      pendingVerifications,
      totalPrayerSessions,
      totalChallengeCompletions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { lastActiveAt: { gt: new Date(now - day) } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gt: new Date(now - 7 * day) } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gt: new Date(now - 30 * day) } } }),
      this.prisma.video.count(),
      this.prisma.video.aggregate({ _sum: { viewCount: true } }),
      this.prisma.report.count({ where: { status: ReportStatus.OPEN } }),
      this.prisma.creatorVerification.count({ where: { status: VerificationStatus.PENDING } }),
      this.prisma.prayerSessionLog.count(),
      this.prisma.challengeProgress.count({ where: { completed: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      dau,
      wau,
      mau,
      totalVideos,
      totalViews: totalViews._sum.viewCount ?? 0,
      openReports,
      pendingVerifications,
      totalPrayerSessions,
      totalChallengeCompletions,
    };
  }

  async getRetentionCohort(daysAgo: 1 | 7 | 30) {
    const day = 24 * 60 * 60 * 1000;
    const cohortStart = new Date(Date.now() - (daysAgo + 1) * day);
    const cohortEnd = new Date(Date.now() - daysAgo * day);

    const cohortUsers = await this.prisma.user.findMany({
      where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
      select: { id: true, lastActiveAt: true },
    });
    if (cohortUsers.length === 0) return { cohortSize: 0, retainedCount: 0, retentionRate: 0 };

    const retained = cohortUsers.filter((u) => u.lastActiveAt.getTime() >= cohortEnd.getTime());
    return {
      cohortSize: cohortUsers.length,
      retainedCount: retained.length,
      retentionRate: Math.round((retained.length / cohortUsers.length) * 100),
    };
  }
}
