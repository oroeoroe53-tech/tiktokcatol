import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { UserRole, UserStatus } from '@faro/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AdminUsersService } from './admin-users.service';

const actionSchema = z.object({ reason: z.string().min(1).max(500) });
type ActionInput = z.infer<typeof actionSchema>;

@ApiTags('admin-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Roles(UserRole.MODERATOR, UserRole.SUPPORT, UserRole.ANALYST)
  @Get()
  list(
    @Query('status') status?: UserStatus,
    @Query('q') query?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminUsersService.list(status, query, cursor);
  }

  @Roles(UserRole.MODERATOR)
  @Patch(':id/suspend')
  suspend(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actionSchema)) input: ActionInput,
  ) {
    return this.adminUsersService.suspend(admin.id, id, input.reason);
  }

  @Roles(UserRole.MODERATOR)
  @Patch(':id/ban')
  ban(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actionSchema)) input: ActionInput,
  ) {
    return this.adminUsersService.ban(admin.id, id, input.reason);
  }

  @Roles(UserRole.MODERATOR)
  @Patch(':id/reinstate')
  reinstate(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.adminUsersService.reinstate(admin.id, id);
  }
}
