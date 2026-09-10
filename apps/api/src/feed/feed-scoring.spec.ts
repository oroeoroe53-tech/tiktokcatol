import { diversify, scoreVideo, type ScorableVideo } from './feed-scoring';

function makeVideo(overrides: Partial<ScorableVideo> = {}): ScorableVideo {
  return {
    id: overrides.id ?? 'video-1',
    category: overrides.category ?? 'PRAYER',
    language: overrides.language ?? 'es',
    creatorId: overrides.creatorId ?? 'creator-1',
    publishedAt: overrides.publishedAt ?? new Date(),
    likeCount: overrides.likeCount ?? 0,
    commentCount: overrides.commentCount ?? 0,
    saveCount: overrides.saveCount ?? 0,
    viewCount: overrides.viewCount ?? 0,
    completedViewCount: overrides.completedViewCount ?? 0,
  };
}

describe('scoreVideo', () => {
  const now = Date.parse('2026-01-01T12:00:00Z');

  it('otorga puntos por coincidencia de interés', () => {
    const video = makeVideo({ category: 'PRAYER' });
    const withInterest = scoreVideo(video, {
      now,
      interests: new Set(['prayer']),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
    });
    const withoutInterest = scoreVideo(video, {
      now,
      interests: new Set(['bible']),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
    });
    expect(withInterest).toBeGreaterThan(withoutInterest);
    expect(withInterest - withoutInterest).toBeCloseTo(30);
  });

  it('premia seguir al creador', () => {
    const video = makeVideo({ creatorId: 'creator-x' });
    const following = scoreVideo(video, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(['creator-x']),
      hasOpenReport: false,
    });
    const notFollowing = scoreVideo(video, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
    });
    expect(following - notFollowing).toBeCloseTo(20);
  });

  it('penaliza fuertemente el contenido con denuncias abiertas', () => {
    const video = makeVideo();
    const reported = scoreVideo(video, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(),
      hasOpenReport: true,
    });
    const clean = scoreVideo(video, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
    });
    expect(clean - reported).toBeCloseTo(50);
  });

  it('reduce la puntuación de vídeos ya vistos recientemente', () => {
    const video = makeVideo();
    const base = scoreVideo(video, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
    });
    const alreadyCompleted = scoreVideo(video, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
      recentView: { completed: true, watchTimeSeconds: 30 },
    });
    expect(alreadyCompleted).toBeLessThan(base);
  });

  it('la frescura decae con el tiempo desde la publicación', () => {
    const fresh = makeVideo({ publishedAt: new Date(now) });
    const old = makeVideo({ publishedAt: new Date(now - 48 * 3_600_000) });
    const freshScore = scoreVideo(fresh, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
    });
    const oldScore = scoreVideo(old, {
      now,
      interests: new Set(),
      followingCreatorIds: new Set(),
      hasOpenReport: false,
    });
    expect(freshScore).toBeGreaterThan(oldScore);
  });
});

describe('diversify', () => {
  it('evita repetir la misma categoría más de dos veces seguidas cuando hay alternativas', () => {
    const scored = [
      { video: { category: 'PRAYER' }, score: 100 },
      { video: { category: 'PRAYER' }, score: 99 },
      { video: { category: 'PRAYER' }, score: 98 },
      { video: { category: 'BIBLE' }, score: 50 },
    ];
    const result = diversify(scored, 4);
    const categories = result.map((r) => r.video.category);
    expect(categories[0]).toBe('PRAYER');
    expect(categories[1]).toBe('PRAYER');
    // El tercer puesto debería preferir diversificar frente a repetir PRAYER una tercera vez,
    // ya que BIBLE (50) supera a PRAYER (98) menos la penalización de repetición (8) => 90.
    expect(categories[2]).toBe('PRAYER');
    expect(categories).toContain('BIBLE');
  });

  it('respeta el límite solicitado', () => {
    const scored = Array.from({ length: 10 }, (_, i) => ({
      video: { category: `CAT_${i}` },
      score: i,
    }));
    expect(diversify(scored, 3)).toHaveLength(3);
  });
});
