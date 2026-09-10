import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminAuditAction, UserStatus } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(status: UserStatus | undefined, query: string | undefined, cursor?: string, limit = 30) {
    const users = await this.prisma.user.findMany({
      where: {
        status,
        ...(query
          ? { OR: [{ email: { contains: query, mode: 'insensitive' } }, { username: { contains: query, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = users.length > limit;
    const page = hasMore ? users.slice(0, limit) : users;
    return { items: page, nextCursor: hasMore ? page[page.length - 1]!.id : null };
  }

  async suspend(adminId: string, userId: string, reason: string) {
    await this.ensureNotSelf(adminId, userId);
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED } });
    await this.auditLog.record(adminId, AdminAuditAction.USER_SUSPENDED, 'User', userId, { reason });
  }

  async ban(adminId: string, userId: string, reason: string) {
    await this.ensureNotSelf(adminId, userId);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.BANNED } }),
      this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.auditLog.record(adminId, AdminAuditAction.USER_BANNED, 'User', userId, { reason });
  }

  async reinstate(adminId: string, userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE } });
    await this.auditLog.record(adminId, AdminAuditAction.USER_REINSTATED, 'User', userId);
  }

  private async ensureNotSelf(adminId: string, targetUserId: string) {
    if (adminId === targetUserId) {
      throw new BadRequestException('No puedes aplicar esta acción sobre tu propia cuenta');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
  }
}
