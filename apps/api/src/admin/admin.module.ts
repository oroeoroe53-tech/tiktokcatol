import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogService } from './audit-log.service';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminModerationService } from './admin-moderation.service';
import { AdminModerationController } from './admin-moderation.controller';
import { AdminVerificationService } from './admin-verification.service';
import { AdminVerificationController } from './admin-verification.controller';
import { AdminContentService } from './admin-content.service';
import { AdminContentController } from './admin-content.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [
    AdminUsersController,
    AdminModerationController,
    AdminVerificationController,
    AdminContentController,
    AdminDashboardController,
  ],
  providers: [
    AuditLogService,
    AdminUsersService,
    AdminModerationService,
    AdminVerificationService,
    AdminContentService,
    AdminDashboardService,
  ],
})
export class AdminModule {}
