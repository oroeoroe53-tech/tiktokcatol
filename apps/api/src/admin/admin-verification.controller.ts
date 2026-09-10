import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { UserRole, VerificationStatus } from '@faro/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AdminVerificationService } from './admin-verification.service';

const reviewSchema = z.object({ reviewNotes: z.string().max(1000).optional() });
type ReviewInput = z.infer<typeof reviewSchema>;
const rejectSchema = z.object({ reviewNotes: z.string().min(1).max(1000) });
type RejectInput = z.infer<typeof rejectSchema>;

@ApiTags('admin-verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.EDITOR)
@Controller('admin/verification-requests')
export class AdminVerificationController {
  constructor(private readonly verificationService: AdminVerificationService) {}

  @Get()
  list(@Query('status') status: VerificationStatus = VerificationStatus.PENDING) {
    return this.verificationService.list(status);
  }

  @Patch(':id/approve')
  approve(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviewSchema)) input: ReviewInput,
  ) {
    return this.verificationService.approve(admin.id, id, input.reviewNotes);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectSchema)) input: RejectInput,
  ) {
    return this.verificationService.reject(admin.id, id, input.reviewNotes);
  }
}
