import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const RAW_VIDEO_VIEW_RETENTION_DAYS = 30;
const RAW_ANALYTICS_EVENT_RETENTION_DAYS = 90;

/**
 * Estrategia de retención de datos de comportamiento (ver docs/PLANNING.md §8):
 * los eventos crudos de visualización se agregan a VideoDailyStats y después se
 * purgan; los eventos de analítica genéricos también caducan tras un tiempo.
 * Evita almacenar indefinidamente el historial de comportamiento por usuario.
 */
@Injectable()
export class RetentionTask {
  private readonly logger = new Logger(RetentionTask.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async aggregateAndPurge() {
    await this.aggregateVideoViews();
    await this.purgeOldRawData();
  }

  private async aggregateVideoViews() {
    const cutoff = new Date(Date.now() - RAW_VIDEO_VIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const views = await this.prisma.videoView.findMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (views.length === 0) return;

    const byVideoAndDay = new Map<string, { videoId: string; date: Date; views: number; completions: number; watchTime: number }>();
    for (const view of views) {
      const date = new Date(view.createdAt);
      date.setHours(0, 0, 0, 0);
      const key = `${view.videoId}_${date.toISOString()}`;
      const entry = byVideoAndDay.get(key) ?? { videoId: view.videoId, date, views: 0, completions: 0, watchTime: 0 };
      entry.views += 1;
      entry.completions += view.completed ? 1 : 0;
      entry.watchTime += view.watchTimeSeconds;
      byVideoAndDay.set(key, entry);
    }

    for (const entry of byVideoAndDay.values()) {
      await this.prisma.videoDailyStats.upsert({
        where: { videoId_date: { videoId: entry.videoId, date: entry.date } },
        create: {
          videoId: entry.videoId,
          date: entry.date,
          views: entry.views,
          completions: entry.completions,
          watchTimeSeconds: BigInt(entry.watchTime),
        },
        update: {
          views: { increment: entry.views },
          completions: { increment: entry.completions },
          watchTimeSeconds: { increment: BigInt(entry.watchTime) },
        },
      });
    }

    this.logger.log(`Agregados ${views.length} eventos VideoView antiguos en VideoDailyStats`);
  }

  private async purgeOldRawData() {
    const viewCutoff = new Date(Date.now() - RAW_VIDEO_VIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const eventCutoff = new Date(Date.now() - RAW_ANALYTICS_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const [views, events] = await Promise.all([
      this.prisma.videoView.deleteMany({ where: { createdAt: { lt: viewCutoff } } }),
      this.prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: eventCutoff } } }),
    ]);
    this.logger.log(`Purgados ${views.count} VideoView y ${events.count} AnalyticsEvent antiguos`);
  }
}
