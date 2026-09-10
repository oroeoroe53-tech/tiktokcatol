import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createCommentSchema, type CreateCommentInput } from '@faro/validation';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('videos/:id/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get()
  list(@Param('id') videoId: string, @Query('cursor') cursor?: string) {
    return this.commentsService.listForVideo(videoId, cursor);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') videoId: string,
    @Body(new ZodValidationPipe(createCommentSchema)) input: CreateCommentInput,
  ) {
    return this.commentsService.create(user.id, videoId, input);
  }

  @Public()
  @Get(':commentId/replies')
  listReplies(@Param('commentId') commentId: string) {
    return this.commentsService.listReplies(commentId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('commentId') commentId: string) {
    return this.commentsService.delete(user.id, commentId);
  }
}
