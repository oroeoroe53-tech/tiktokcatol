import { Injectable } from '@nestjs/common';
import { ModerationStatus, ReportStatus, VideoStatus, VideoVisibility } from '@faro/types';
import { PrismaService } from '../prisma/prisma.service';
import { toVideoSummary, videoWithRelationsInclude } from '../videos/video.mapper';
import { VideosService } from '../videos/videos.service';
import { diversify, scoreVideo } from './feed-scoring';
import type { FeedResponse } from '@faro/types';

const CANDIDATE_POOL_SIZE = 200;
const PAGE_SIZE = 10;

/**
 * Algoritmo de recomendación — Fase 1 (ver docs/PLANNING.md §12).
 * Puntuación explicable basada en reglas, sin ML (la lógica de puntuación pura
 * vive en feed-scoring.ts y se testea sin base de datos). Se recalcula en cada
 * petición sobre una ventana de candidatos recientes; la paginación usa un
 * cursor de desplazamiento (simplificación aceptable a la escala del MVP,
 * documentada como limitación a resolver en fase 2 con ranking precomputado).
 */
@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videosService: VideosService,
  ) {}

  async getFeed(userId: string | undefined, cursor: string | undefined, limit = PAGE_SIZE): Promise<FeedResponse> {
    const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;

    const [blockedIds, blockingIds, preferences, followingIds, reportedVideoIds] = await Promise.all([
      userId ? this.prisma.block.findMany({ where: { blockingId: userId }, select: { blockedId: true } }) : [],
      userId ? this.prisma.block.findMany({ where: { blockedId: userId }, select: { blockingId: true } }) : [],
      userId ? this.prisma.userPreferences.findUnique({ where: { userId } }) : null,
      userId ? this.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }) : [],
      this.prisma.report.findMany({
        where: { targetType: 'VIDEO', status: ReportStatus.OPEN },
        select: { targetVideoId: true },
        distinct: ['targetVideoId'],
      }),
    ]);

    const excludedCreatorIds = new Set([
      ...blockedIds.map((b) => b.blockedId),
      ...blockingIds.map((b) => b.blockingId),
    ]);
    const followingSet = new Set(followingIds.map((f) => f.followingId));
    const reportedSet = new Set(reportedVideoIds.map((r) => r.targetVideoId).filter(Boolean) as string[]);

    const candidates = await this.prisma.video.findMany({
      where: {
        status: VideoStatus.READY,
        visibility: VideoVisibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        creatorId: excludedCreatorIds.size > 0 ? { notIn: [...excludedCreatorIds] } : undefined,
      },
      include: videoWithRelationsInclude,
      orderBy: { publishedAt: 'desc' },
      take: CANDIDATE_POOL_SIZE,
    });

    const recentViews = userId
      ? await this.prisma.videoView.findMany({
          where: {
            userId,
            createdAt: { gt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            videoId: { in: candidates.map((c) => c.id) },
          },
          select: { videoId: true, completed: true, watchTimeSeconds: true },
        })
      : [];
    const recentViewByVideo = new Map(recentViews.map((v) => [v.videoId, v]));

    const now = Date.now();
    const interests = new Set((preferences?.interests ?? []).map((i) => i.toLowerCase()));

    const scored = candidates.map((video) => ({
      video,
      score: scoreVideo(video, {
        now,
        interests,
        followingCreatorIds: followingSet,
        preferredLanguage: preferences?.language,
        recentView: recentViewByVideo.get(video.id),
        hasOpenReport: reportedSet.has(video.id),
      }),
    }));

    scored.sort((a, b) => b.score - a.score);
    const diversified = diversify(scored, Math.max(offset + limit, scored.length));

    const page = diversified.slice(offset, offset + limit);
    const flags = await this.videosService.getViewerFlags(
      userId,
      page.map((p) => ({ id: p.video.id, creatorId: p.video.creatorId })),
    );

    return {
      items: page.map((p) => toVideoSummary(p.video, flags.get(p.video.id)!)),
      nextCursor: offset + limit < diversified.length ? String(offset + limit) : null,
    };
  }

  async markNotInterested(userId: string, videoId: string) {
    await this.prisma.videoView.create({
      data: { userId, videoId, watchTimeSeconds: 0, completed: false },
    });
  }
}
