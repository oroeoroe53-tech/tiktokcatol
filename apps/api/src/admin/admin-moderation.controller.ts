import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ReportStatus, UserRole } from '@faro/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AdminModerationService } from './admin-moderation.service';

const resolveSchema = z.object({ resolution: z.string().min(1).max(1000), dismiss: z.boolean().default(false) });
type ResolveInput = z.infer<typeof resolveSchema>;
const removeSchema = z.object({ reason: z.string().min(1).max(500) });
type RemoveInput = z.infer<typeof removeSchema>;

@ApiTags('admin-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR)
@Controller('admin/moderation')
export class AdminModerationController {
  constructor(private readonly moderationService: AdminModerationService) {}

  @Get('reports')
  listReports(@Query('status') status: ReportStatus = ReportStatus.OPEN) {
    return this.moderationService.listReports(status);
  }

  @Get('flagged')
  listFlagged() {
    return this.moderationService.listFlaggedContent();
  }

  @Get('pending-videos')
  listPendingVideos() {
    return this.moderationService.listPendingVideos();
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resolveSchema)) input: ResolveInput,
  ) {
    return this.moderationService.resolveReport(admin.id, id, input.resolution, input.dismiss);
  }

  @Patch('videos/:id/remove')
  removeVideo(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(removeSchema)) input: RemoveInput,
  ) {
    return this.moderationService.removeVideo(admin.id, id, input.reason);
  }

  @Patch('videos/:id/restore')
  restoreVideo(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.moderationService.restoreVideo(admin.id, id);
  }

  @Patch('comments/:id/approve')
  approveComment(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.moderationService.approveComment(admin.id, id);
  }

  @Patch('comments/:id/reject')
  rejectComment(@Param('id') id: string) {
    return this.moderationService.rejectComment(id);
  }
}
