import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminAuditAction, UserRole, VerificationStatus, VerificationType } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

const ROLE_BY_VERIFICATION_TYPE: Partial<Record<VerificationType, UserRole>> = {
  [VerificationType.PRIEST]: UserRole.PRIEST_VERIFIED,
  [VerificationType.RELIGIOUS]: UserRole.PRIEST_VERIFIED,
  [VerificationType.PARISH]: UserRole.ORG_VERIFIED,
  [VerificationType.DIOCESE]: UserRole.ORG_VERIFIED,
  [VerificationType.ORGANIZATION]: UserRole.ORG_VERIFIED,
  [VerificationType.CATECHIST]: UserRole.CREATOR,
  [VerificationType.CREATOR]: UserRole.CREATOR,
};

@Injectable()
export class AdminVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(status: VerificationStatus = VerificationStatus.PENDING) {
    return this.prisma.creatorVerification.findMany({
      where: { status },
      include: { user: true },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async approve(adminId: string, requestId: string, reviewNotes?: string) {
    const request = await this.prisma.creatorVerification.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');

    const grantedRole = ROLE_BY_VERIFICATION_TYPE[request.type] ?? UserRole.CREATOR;

    await this.prisma.$transaction([
      this.prisma.creatorVerification.update({
        where: { id: requestId },
        data: {
          status: VerificationStatus.APPROVED,
          reviewerId: adminId,
          reviewNotes,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.user.update({ where: { id: request.userId }, data: { role: grantedRole } }),
    ]);

    await this.auditLog.record(adminId, AdminAuditAction.CREATOR_VERIFIED, 'CreatorVerification', requestId, {
      grantedRole,
    });
  }

  async reject(adminId: string, requestId: string, reviewNotes: string) {
    const request = await this.prisma.creatorVerification.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');

    await this.prisma.creatorVerification.update({
      where: { id: requestId },
      data: { status: VerificationStatus.REJECTED, reviewerId: adminId, reviewNotes, reviewedAt: new Date() },
    });
    await this.auditLog.record(adminId, AdminAuditAction.CREATOR_REJECTED, 'CreatorVerification', requestId, {
      reviewNotes,
    });
  }
}
