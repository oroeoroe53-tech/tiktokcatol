/**
 * Lógica de puntuación del feed extraída como funciones puras para poder
 * testearla sin necesidad de una base de datos (ver feed.service.spec.ts).
 */

export interface ScorableVideo {
  id: string;
  category: string;
  language: string;
  creatorId: string;
  publishedAt: Date | null;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  viewCount: number;
  completedViewCount: number;
}

export interface ScoringContext {
  now: number;
  interests: Set<string>;
  followingCreatorIds: Set<string>;
  preferredLanguage?: string;
  recentView?: { completed: boolean; watchTimeSeconds: number };
  hasOpenReport: boolean;
}

export function scoreVideo(video: ScorableVideo, ctx: ScoringContext): number {
  let score = 0;

  if (ctx.interests.has(video.category.toLowerCase())) score += 30;
  if (ctx.followingCreatorIds.has(video.creatorId)) score += 20;
  if (ctx.preferredLanguage && video.language === ctx.preferredLanguage) score += 5;

  const hoursSincePublish = video.publishedAt ? (ctx.now - video.publishedAt.getTime()) / 3_600_000 : 999;
  score += Math.max(0, 20 - hoursSincePublish / 6);

  const engagement =
    video.likeCount + video.commentCount * 2 + video.saveCount * 3 + video.viewCount * 0.1;
  score += Math.log10(1 + engagement) * 5;

  const completionRate = video.viewCount > 0 ? video.completedViewCount / video.viewCount : 0;
  score += completionRate * 10;

  if (ctx.recentView) {
    score -= ctx.recentView.completed ? 25 : 10;
    if (!ctx.recentView.completed && ctx.recentView.watchTimeSeconds < 2) score -= 10;
  }

  if (ctx.hasOpenReport) score -= 50;

  return score;
}

/** Reordena aplicando una pequeña penalización cuando se repite categoría consecutiva. */
export function diversify<T extends { video: { category: string }; score: number }>(
  scored: T[],
  count: number,
): T[] {
  const pool = [...scored];
  const result: T[] = [];
  const recentCategories: string[] = [];

  while (pool.length > 0 && result.length < count) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;
    for (let i = 0; i < pool.length; i += 1) {
      const item = pool[i]!;
      const repeatPenalty = recentCategories.slice(-2).includes(item.video.category) ? 8 : 0;
      const adjusted = item.score - repeatPenalty;
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = i;
      }
    }
    const [picked] = pool.splice(bestIndex, 1);
    result.push(picked!);
    recentCategories.push(picked!.video.category);
  }

  return result;
}
