import { Injectable } from '@nestjs/common';
import type { AdminAuditAction } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    adminId: string,
    action: AdminAuditAction,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.adminAuditLog.create({
      data: { adminId, action, targetType, targetId, metadata: metadata as any },
    });
  }

  async list(limit = 50) {
    return this.prisma.adminAuditLog.findMany({
      include: { admin: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
