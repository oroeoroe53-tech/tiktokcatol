import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createUploadUrlSchema,
  createVideoSchema,
  recordViewSchema,
  updateVideoSchema,
  type CreateUploadUrlInput,
  type CreateVideoInput,
  type RecordViewInput,
  type UpdateVideoInput,
} from '@faro/validation';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { VideosService } from './videos.service';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload-url')
  createUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createUploadUrlSchema)) input: CreateUploadUrlInput,
  ) {
    return this.videosService.createUploadUrl(user.id, input);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createVideoSchema)) input: CreateVideoInput,
  ) {
    return this.videosService.createVideo(user.id, input);
  }

  @OptionalAuth()
  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.videosService.getById(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVideoSchema)) input: UpdateVideoInput,
  ) {
    return this.videosService.updateVideo(user.id, id, input);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.videosService.deleteVideo(user.id, id);
  }

  @OptionalAuth()
  @Post(':id/view')
  recordView(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordViewSchema)) input: RecordViewInput,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.videosService.recordView(id, user?.id, input);
  }

  @OptionalAuth()
  @Get('by/:creatorId')
  listByCreator(
    @Param('creatorId') creatorId: string,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.videosService.listByCreator(creatorId, user?.id, cursor);
  }
}
