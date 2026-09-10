import type { Video, VideoHashtag, Hashtag, User } from '@prisma/client';
import type { VideoSummary } from '@faro/types';
import { toUserSummary } from '../users/users.mapper';

type VideoWithRelations = Video & {
  creator: User;
  hashtags: (VideoHashtag & { hashtag: Hashtag })[];
};

interface ViewerFlags {
  hasLiked: boolean;
  hasSaved: boolean;
  isFollowingCreator: boolean;
}

export function toVideoSummary(video: VideoWithRelations, viewer: ViewerFlags): VideoSummary {
  return {
    id: video.id,
    creator: toUserSummary(video.creator),
    title: video.title,
    description: video.description,
    videoUrl: video.videoUrl ?? '',
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    category: video.category as VideoSummary['category'],
    language: video.language,
    hashtags: video.hashtags.map((h) => h.hashtag.tag),
    status: video.status as VideoSummary['status'],
    visibility: video.visibility as VideoSummary['visibility'],
    moderationStatus: video.moderationStatus as VideoSummary['moderationStatus'],
    isDemoContent: video.isDemoContent,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    saveCount: video.saveCount,
    shareCount: video.shareCount,
    viewCount: video.viewCount,
    viewerHasLiked: viewer.hasLiked,
    viewerHasSaved: viewer.hasSaved,
    viewerIsFollowingCreator: viewer.isFollowingCreator,
    createdAt: video.createdAt.toISOString(),
    publishedAt: video.publishedAt ? video.publishedAt.toISOString() : null,
  };
}

export const videoWithRelationsInclude = {
  creator: true,
  hashtags: { include: { hashtag: true } },
} as const;
