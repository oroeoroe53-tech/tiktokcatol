import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const KNOWN_EVENTS = new Set([
  'app_opened',
  'video_impression',
  'video_started',
  'video_completed',
  'like',
  'save',
  'share',
  'follow',
  'comment',
  'search',
  'prayer_started',
  'prayer_completed',
  'challenge_started',
  'challenge_completed',
  'faith_path_progress',
  'report_submitted',
]);

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(userId: string | undefined, name: string, properties?: Record<string, unknown>) {
    if (!KNOWN_EVENTS.has(name)) {
      this.logger.warn(`Evento de analítica desconocido ignorado: ${name}`);
      return;
    }
    await this.prisma.analyticsEvent.create({ data: { userId, name, properties: properties as any } });
  }

  async trackBatch(userId: string | undefined, events: { name: string; properties?: Record<string, unknown> }[]) {
    const valid = events.filter((e) => KNOWN_EVENTS.has(e.name));
    if (valid.length === 0) return;
    await this.prisma.analyticsEvent.createMany({
      data: valid.map((e) => ({ userId, name: e.name, properties: e.properties as any })),
    });
  }
}
