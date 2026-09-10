import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { SavesService } from './saves.service';
import { toVideoSummary } from '../videos/video.mapper';
import { VideosService } from '../videos/videos.service';

@ApiTags('saves')
@UseGuards(JwtAuthGuard)
@Controller()
export class SavesController {
  constructor(
    private readonly savesService: SavesService,
    private readonly videosService: VideosService,
  ) {}

  @Post('videos/:id/save')
  save(@CurrentUser() user: AuthenticatedUser, @Param('id') videoId: string) {
    return this.savesService.save(user.id, videoId);
  }

  @Delete('videos/:id/save')
  unsave(@CurrentUser() user: AuthenticatedUser, @Param('id') videoId: string) {
    return this.savesService.unsave(user.id, videoId);
  }

  @Get('users/me/saved')
  async listSaved(@CurrentUser() user: AuthenticatedUser, @Query('cursor') cursor?: string) {
    const { rows, hasMore } = await this.savesService.listSaved(user.id, cursor);
    const flags = await this.videosService.getViewerFlags(
      user.id,
      rows.map((r) => ({ id: r.video.id, creatorId: r.video.creatorId })),
    );
    return {
      items: rows.map((r) => toVideoSummary(r.video, flags.get(r.video.id)!)),
      nextCursor: hasMore ? rows[rows.length - 1]!.id : null,
    };
  }
}
