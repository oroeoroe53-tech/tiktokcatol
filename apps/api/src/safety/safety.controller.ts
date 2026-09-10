import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { SafetyService } from './safety.service';

@ApiTags('safety')
@UseGuards(JwtAuthGuard)
@Controller()
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('users/:id/block')
  block(@CurrentUser() user: AuthenticatedUser, @Param('id') targetId: string) {
    return this.safetyService.block(user.id, targetId);
  }

  @Delete('users/:id/block')
  unblock(@CurrentUser() user: AuthenticatedUser, @Param('id') targetId: string) {
    return this.safetyService.unblock(user.id, targetId);
  }

  @Get('users/me/blocked')
  listBlocked(@CurrentUser() user: AuthenticatedUser) {
    return this.safetyService.listBlocked(user.id);
  }

  @Post('users/:id/mute')
  mute(@CurrentUser() user: AuthenticatedUser, @Param('id') targetId: string) {
    return this.safetyService.mute(user.id, targetId);
  }

  @Delete('users/:id/mute')
  unmute(@CurrentUser() user: AuthenticatedUser, @Param('id') targetId: string) {
    return this.safetyService.unmute(user.id, targetId);
  }
}
