import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminAuditAction, ModerationStatus, ReportStatus, VideoVisibility } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AdminModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listReports(status: ReportStatus = ReportStatus.OPEN, limit = 30) {
    return this.prisma.report.findMany({
      where: { status },
      include: { reporter: true, targetVideo: true, targetComment: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async resolveReport(adminId: string, reportId: string, resolution: string, dismiss = false) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Denuncia no encontrada');

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dismiss ? ReportStatus.DISMISSED : ReportStatus.RESOLVED,
        moderatorId: adminId,
        resolution,
        resolvedAt: new Date(),
      },
    });
    await this.auditLog.record(adminId, AdminAuditAction.REPORT_RESOLVED, 'Report', reportId, {
      resolution,
      dismissed: dismiss,
    });
  }

  async removeVideo(adminId: string, videoId: string, reason: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Vídeo no encontrado');
    await this.prisma.video.update({
      where: { id: videoId },
      data: { visibility: VideoVisibility.PRIVATE, moderationStatus: ModerationStatus.REJECTED },
    });
    await this.auditLog.record(adminId, AdminAuditAction.VIDEO_REMOVED, 'Video', videoId, { reason });
  }

  async restoreVideo(adminId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Vídeo no encontrado');
    await this.prisma.video.update({
      where: { id: videoId },
      data: { visibility: VideoVisibility.PUBLIC, moderationStatus: ModerationStatus.APPROVED },
    });
    await this.auditLog.record(adminId, AdminAuditAction.VIDEO_RESTORED, 'Video', videoId);
  }

  async listFlaggedContent() {
    const [videos, comments, intentions] = await Promise.all([
      this.prisma.video.findMany({ where: { moderationStatus: ModerationStatus.FLAGGED }, include: { creator: true } }),
      this.prisma.comment.findMany({ where: { status: ModerationStatus.FLAGGED }, include: { user: true } }),
      this.prisma.prayerIntention.findMany({ where: { moderationStatus: ModerationStatus.FLAGGED }, include: { author: true } }),
    ]);
    return { videos, comments, intentions };
  }

  async approveComment(adminId: string, commentId: string) {
    const comment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { status: ModerationStatus.APPROVED },
    });
    await this.prisma.video.update({
      where: { id: comment.videoId },
      data: { commentCount: { increment: 1 } },
    });
  }

  async rejectComment(commentId: string) {
    await this.prisma.comment.update({ where: { id: commentId }, data: { status: ModerationStatus.REJECTED } });
  }
}
