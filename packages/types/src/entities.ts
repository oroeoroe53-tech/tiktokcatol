import type {
  ContentCategory,
  FaithPathObjective,
  ModerationStatus,
  NotificationType,
  PrayerCategoryKey,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  Testament,
  UserRole,
  UserStatus,
  VerificationStatus,
  VerificationType,
  VideoStatus,
  VideoVisibility,
} from './enums';

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  verified: boolean;
}

export interface UserProfile extends UserSummary {
  email: string;
  bio: string | null;
  status: UserStatus;
  followerCount: number;
  followingCount: number;
  videoCount: number;
  createdAt: string;
}

export interface VideoSummary {
  id: string;
  creator: UserSummary;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  category: ContentCategory;
  language: string;
  hashtags: string[];
  status: VideoStatus;
  visibility: VideoVisibility;
  moderationStatus: ModerationStatus;
  isDemoContent: boolean;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  viewCount: number;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  viewerIsFollowingCreator: boolean;
  createdAt: string;
  publishedAt: string | null;
}

export interface CommentSummary {
  id: string;
  author: UserSummary;
  videoId: string;
  parentId: string | null;
  text: string;
  replyCount: number;
  createdAt: string;
}

export interface FeedResponse {
  items: VideoSummary[];
  nextCursor: string | null;
}

export interface PrayerSummary {
  id: string;
  title: string;
  content: string;
  category: PrayerCategoryKey;
  durationSeconds: number;
  language: string;
  audioUrl: string | null;
  isFavorite: boolean;
}

export interface PrayerIntentionSummary {
  id: string;
  author: UserSummary | null;
  text: string;
  isAnonymous: boolean;
  prayingForCount: number;
  viewerIsPrayingFor: boolean;
  createdAt: string;
}

export interface SaintSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  feastMonth: number;
  feastDay: number;
  shortBio: string;
  biography: string;
  virtues: string[];
  relatedPrayerId: string | null;
  language: string;
}

export interface BibleBookSummary {
  id: string;
  name: string;
  testament: Testament;
  order: number;
  chapterCount: number;
}

export interface BibleVerseSummary {
  id: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  text: string;
  translation: string;
}

export interface ChallengeSummary {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: ContentCategory;
  durationDays: number;
  active: boolean;
  participantCount: number;
  viewerProgress: {
    currentDay: number;
    completed: boolean;
    streak: number;
  } | null;
}

export interface FaithPathStepSummary {
  id: string;
  order: number;
  title: string;
  description: string;
  videoId: string | null;
  prayerId: string | null;
  bibleVerseId: string | null;
  saintId: string | null;
  completed: boolean;
}

export interface FaithPathSummary {
  id: string;
  objective: FaithPathObjective;
  currentStepOrder: number;
  totalSteps: number;
  progressPercent: number;
  steps: FaithPathStepSummary[];
}

export interface NotificationSummary {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: Record<string, string> | null;
}

export interface ReportSummary {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  moderatorId: string | null;
  resolution: string | null;
  createdAt: string;
}

export interface CreatorVerificationSummary {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}
