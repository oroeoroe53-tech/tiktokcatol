import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { FeedService } from './feed.service';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @OptionalAuth()
  @Get()
  getFeed(@Query('cursor') cursor?: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.feedService.getFeed(user?.id, cursor);
  }

  @OptionalAuth()
  @Post(':videoId/not-interested')
  markNotInterested(@Param('videoId') videoId: string, @CurrentUser() user?: AuthenticatedUser) {
    if (!user) return { ok: true };
    return this.feedService.markNotInterested(user.id, videoId);
  }
}
