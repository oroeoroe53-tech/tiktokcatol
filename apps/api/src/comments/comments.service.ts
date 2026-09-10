import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ModerationStatus, NotificationType } from '@faro/types';
import type { CreateCommentInput } from '@faro/validation';
import { PrismaService } from '../prisma/prisma.service';
import { AutoModerationService } from '../moderation/auto-moderation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { toUserSummary } from '../users/users.mapper';
import type { CommentSummary } from '@faro/types';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoModeration: AutoModerationService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, videoId: string, input: CreateCommentInput): Promise<CommentSummary> {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Vídeo no encontrado');

    if (input.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.videoId !== videoId) {
        throw new NotFoundException('Comentario padre no encontrado');
      }
    }

    const status = this.autoModeration.evaluateText(input.text);
    const visibleStatus = status === ModerationStatus.FLAGGED ? ModerationStatus.FLAGGED : ModerationStatus.APPROVED;

    const comment = await this.prisma.comment.create({
      data: {
        userId,
        videoId,
        parentId: input.parentId,
        text: input.text,
        status: visibleStatus,
      },
      include: { user: true },
    });

    if (visibleStatus === ModerationStatus.APPROVED) {
      await this.prisma.video.update({
        where: { id: videoId },
        data: { commentCount: { increment: 1 } },
      });
    }

    const notifyUserId = input.parentId
      ? (await this.prisma.comment.findUnique({ where: { id: input.parentId } }))?.userId
      : video.creatorId;
    if (notifyUserId && notifyUserId !== userId) {
      await this.notifications.create(notifyUserId, {
        type: input.parentId ? NotificationType.COMMENT_REPLY : NotificationType.SYSTEM,
        title: input.parentId ? 'Nueva respuesta a tu comentario' : 'Nuevo comentario en tu vídeo',
        body: input.text.slice(0, 100),
        data: { videoId, commentId: comment.id },
      });
    }

    return this.toSummary(comment);
  }

  async listForVideo(videoId: string, cursor?: string, limit = 20) {
    const comments = await this.prisma.comment.findMany({
      where: { videoId, parentId: null, status: ModerationStatus.APPROVED },
      include: { user: true, replies: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = comments.length > limit;
    const page = hasMore ? comments.slice(0, limit) : comments;
    return {
      items: page.map((c) => this.toSummary(c, c.replies.length)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async listReplies(commentId: string) {
    const replies = await this.prisma.comment.findMany({
      where: { parentId: commentId, status: ModerationStatus.APPROVED },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return replies.map((r) => this.toSummary(r));
  }

  async delete(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comentario no encontrado');
    if (comment.userId !== userId) throw new ForbiddenException('No puedes eliminar este comentario');

    await this.prisma.comment.delete({ where: { id: commentId } });
    if (comment.status === ModerationStatus.APPROVED) {
      await this.prisma.video.update({
        where: { id: comment.videoId },
        data: { commentCount: { decrement: 1 } },
      });
    }
  }

  private toSummary(
    comment: { id: string; userId: string; videoId: string; parentId: string | null; text: string; createdAt: Date; user: any },
    replyCount = 0,
  ): CommentSummary {
    return {
      id: comment.id,
      author: toUserSummary(comment.user),
      videoId: comment.videoId,
      parentId: comment.parentId,
      text: comment.text,
      replyCount,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
