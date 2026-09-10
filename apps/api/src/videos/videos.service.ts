import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { ModerationStatus, VideoStatus, VideoVisibility } from '@faro/types';
import type { CreateUploadUrlInput, CreateVideoInput, RecordViewInput, UpdateVideoInput } from '@faro/validation';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AutoModerationService } from '../moderation/auto-moderation.service';
import { VIDEO_PROCESSING_QUEUE, type VideoProcessingJob } from '../queue/queue.constants';
import { toVideoSummary, videoWithRelationsInclude } from './video.mapper';
import { nanoid } from 'nanoid';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly autoModeration: AutoModerationService,
    @InjectQueue(VIDEO_PROCESSING_QUEUE) private readonly videoQueue: Queue<VideoProcessingJob>,
  ) {}

  async createUploadUrl(userId: string, input: CreateUploadUrlInput) {
    const extension = input.fileName.split('.').pop() ?? 'mp4';
    const videoId = nanoid();
    const storageKey = this.storage.buildVideoKey(userId, videoId, extension);
    const uploadUrl = await this.storage.createUploadUrl(storageKey, input.contentType);
    return { videoId, storageKey, uploadUrl };
  }

  async createVideo(userId: string, input: CreateVideoInput) {
    const moderationStatus = this.autoModeration.evaluateText(
      `${input.title} ${input.description ?? ''}`,
    );

    const video = await this.prisma.video.create({
      data: {
        creatorId: userId,
        title: input.title,
        description: input.description,
        storageKey: input.storageKey,
        duration: input.durationSeconds,
        category: input.category,
        language: input.language,
        visibility: input.visibility,
        status: VideoStatus.PROCESSING,
        moderationStatus,
        publishedAt: input.visibility === VideoVisibility.PUBLIC ? new Date() : null,
        hashtags: {
          create: await this.buildHashtagConnections(input.hashtags),
        },
      },
      include: videoWithRelationsInclude,
    });

    await this.videoQueue.add('process', { videoId: video.id }, { attempts: 3, backoff: 5000 });

    return toVideoSummary(video, { hasLiked: false, hasSaved: false, isFollowingCreator: false });
  }

  async getById(videoId: string, viewerId?: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: videoWithRelationsInclude,
    });
    if (!video) throw new NotFoundException('Vídeo no encontrado');
    const flags = await this.getViewerFlags(viewerId, [{ id: video.id, creatorId: video.creatorId }]);
    return toVideoSummary(video, flags.get(video.id)!);
  }

  async listByCreator(creatorId: string, viewerId: string | undefined, cursor?: string, limit = 20) {
    const videos = await this.prisma.video.findMany({
      where: {
        creatorId,
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
      },
      include: videoWithRelationsInclude,
      orderBy: { publishedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = videos.length > limit;
    const page = hasMore ? videos.slice(0, limit) : videos;
    const flags = await this.getViewerFlags(
      viewerId,
      page.map((v) => ({ id: v.id, creatorId })),
    );
    return {
      items: page.map((v) => toVideoSummary(v, flags.get(v.id)!)),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  }

  async updateVideo(userId: string, videoId: string, input: UpdateVideoInput) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Vídeo no encontrado');
    if (video.creatorId !== userId) throw new ForbiddenException('No puedes editar este vídeo');

    const data: Record<string, unknown> = { ...input };
    if (input.hashtags) {
      await this.prisma.videoHashtag.deleteMany({ where: { videoId } });
      data.hashtags = { create: await this.buildHashtagConnections(input.hashtags) };
    }
    if (input.visibility === VideoVisibility.PUBLIC && !video.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await this.prisma.video.update({
      where: { id: videoId },
      data,
      include: videoWithRelationsInclude,
    });
    const flags = await this.getViewerFlags(userId, [{ id: videoId, creatorId: video.creatorId }]);
    return toVideoSummary(updated, flags.get(videoId)!);
  }

  async deleteVideo(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Vídeo no encontrado');
    if (video.creatorId !== userId) throw new ForbiddenException('No puedes eliminar este vídeo');

    await this.prisma.video.delete({ where: { id: videoId } });
    await this.storage.deleteObject(video.storageKey).catch(() => undefined);
  }

  async recordView(videoId: string, userId: string | undefined, input: RecordViewInput) {
    await this.prisma.$transaction([
      this.prisma.videoView.create({
        data: {
          videoId,
          userId,
          watchTimeSeconds: Math.round(input.watchTimeSeconds),
          completed: input.completed,
        },
      }),
      this.prisma.video.update({
        where: { id: videoId },
        data: {
          viewCount: { increment: 1 },
          completedViewCount: input.completed ? { increment: 1 } : undefined,
          totalWatchTimeSeconds: { increment: Math.round(input.watchTimeSeconds) },
        },
      }),
    ]);
  }

  async markReady(videoId: string, videoUrl: string, thumbnailUrl: string) {
    await this.prisma.video.update({
      where: { id: videoId },
      data: { status: VideoStatus.READY, videoUrl, thumbnailUrl },
    });
  }

  async markFailed(videoId: string) {
    await this.prisma.video.update({ where: { id: videoId }, data: { status: VideoStatus.FAILED } });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async buildHashtagConnections(tags: string[]) {
    const normalized = [...new Set(tags.map((t) => t.replace(/^#/, '').toLowerCase().trim()).filter(Boolean))];
    return Promise.all(
      normalized.map(async (tag) => {
        const hashtag = await this.prisma.hashtag.upsert({
          where: { tag },
          create: { tag, useCount: 1 },
          update: { useCount: { increment: 1 } },
        });
        return { hashtagId: hashtag.id };
      }),
    );
  }

  /** `videos` son pares {id, creatorId} — necesarios para resolver isFollowingCreator por vídeo. */
  async getViewerFlags(viewerId: string | undefined, videos: { id: string; creatorId: string }[]) {
    const flags = new Map<string, { hasLiked: boolean; hasSaved: boolean; isFollowingCreator: boolean }>();
    const videoIds = videos.map((v) => v.id);
    if (!viewerId) {
      videoIds.forEach((id) =>
        flags.set(id, { hasLiked: false, hasSaved: false, isFollowingCreator: false }),
      );
      return flags;
    }
    const creatorIds = [...new Set(videos.map((v) => v.creatorId))];
    const [likes, saves, follows] = await Promise.all([
      this.prisma.like.findMany({ where: { userId: viewerId, videoId: { in: videoIds } } }),
      this.prisma.save.findMany({ where: { userId: viewerId, videoId: { in: videoIds } } }),
      this.prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: creatorIds } },
      }),
    ]);
    const likedSet = new Set(likes.map((l) => l.videoId));
    const savedSet = new Set(saves.map((s) => s.videoId));
    const followingSet = new Set(follows.map((f) => f.followingId));

    videos.forEach((v) =>
      flags.set(v.id, {
        hasLiked: likedSet.has(v.id),
        hasSaved: savedSet.has(v.id),
        isFollowingCreator: followingSet.has(v.creatorId),
      }),
    );
    return flags;
  }
}
