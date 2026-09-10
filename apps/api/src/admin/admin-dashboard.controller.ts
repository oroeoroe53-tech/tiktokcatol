import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@faro/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminDashboardService } from './admin-dashboard.service';
import { AuditLogService } from './audit-log.service';

@ApiTags('admin-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ANALYST, UserRole.MODERATOR, UserRole.EDITOR, UserRole.SUPPORT)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('overview')
  overview() {
    return this.dashboardService.getOverview();
  }

  @Get('retention')
  retention(@Query('days') days: '1' | '7' | '30' = '7') {
    return this.dashboardService.getRetentionCohort(Number(days) as 1 | 7 | 30);
  }

  @Get('audit-log')
  auditLogList() {
    return this.auditLog.list();
  }
}
