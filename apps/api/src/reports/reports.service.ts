import { BadRequestException, Injectable } from '@nestjs/common';
import { ReportTargetType } from '@faro/types';
import type { CreateReportInput } from '@faro/validation';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, input: CreateReportInput) {
    await this.assertTargetExists(input.targetType, input.targetId);

    const data: Record<string, unknown> = {
      reporterId,
      targetType: input.targetType,
      reason: input.reason,
      description: input.description,
    };
    switch (input.targetType) {
      case ReportTargetType.VIDEO:
        data.targetVideoId = input.targetId;
        break;
      case ReportTargetType.COMMENT:
        data.targetCommentId = input.targetId;
        break;
      case ReportTargetType.USER:
        data.targetUserId = input.targetId;
        break;
      case ReportTargetType.PRAYER_INTENTION:
        data.targetIntentionId = input.targetId;
        break;
    }

    return this.prisma.report.create({ data: data as any });
  }

  private async assertTargetExists(targetType: ReportTargetType, targetId: string) {
    const exists = await {
      [ReportTargetType.VIDEO]: () => this.prisma.video.findUnique({ where: { id: targetId } }),
      [ReportTargetType.COMMENT]: () => this.prisma.comment.findUnique({ where: { id: targetId } }),
      [ReportTargetType.USER]: () => this.prisma.user.findUnique({ where: { id: targetId } }),
      [ReportTargetType.PRAYER_INTENTION]: () =>
        this.prisma.prayerIntention.findUnique({ where: { id: targetId } }),
    }[targetType]();
    if (!exists) throw new BadRequestException('El contenido reportado no existe');
  }

  async listMine(reporterId: string) {
    return this.prisma.report.findMany({ where: { reporterId }, orderBy: { createdAt: 'desc' } });
  }
}
