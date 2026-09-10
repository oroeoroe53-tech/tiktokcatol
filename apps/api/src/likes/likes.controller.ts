import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { LikesService } from './likes.service';

@ApiTags('likes')
@UseGuards(JwtAuthGuard)
@Controller('videos/:id/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  like(@CurrentUser() user: AuthenticatedUser, @Param('id') videoId: string) {
    return this.likesService.like(user.id, videoId);
  }

  @Delete()
  unlike(@CurrentUser() user: AuthenticatedUser, @Param('id') videoId: string) {
    return this.likesService.unlike(user.id, videoId);
  }
}
