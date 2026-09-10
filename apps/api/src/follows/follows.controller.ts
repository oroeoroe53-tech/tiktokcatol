import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { FollowsService } from './follows.service';

@ApiTags('follows')
@UseGuards(JwtAuthGuard)
@Controller('users/:id/follow')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post()
  follow(@CurrentUser() user: AuthenticatedUser, @Param('id') targetId: string) {
    return this.followsService.follow(user.id, targetId);
  }

  @Delete()
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param('id') targetId: string) {
    return this.followsService.unfollow(user.id, targetId);
  }
}
