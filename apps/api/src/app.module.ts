import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { ModerationCoreModule } from './moderation/moderation.module';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { FollowsModule } from './follows/follows.module';
import { SafetyModule } from './safety/safety.module';
import { VideosModule } from './videos/videos.module';
import { LikesModule } from './likes/likes.module';
import { SavesModule } from './saves/saves.module';
import { CommentsModule } from './comments/comments.module';
import { FeedModule } from './feed/feed.module';
import { PrayerModule } from './prayer/prayer.module';
import { BibleModule } from './bible/bible.module';
import { SaintsModule } from './saints/saints.module';
import { ChallengesModule } from './challenges/challenges.module';
import { FaithPathModule } from './faith-path/faith-path.module';
import { ReportsModule } from './reports/reports.module';
import { CreatorsModule } from './creators/creators.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    PrismaModule,
    MailModule,
    StorageModule,
    QueueModule,
    ModerationCoreModule,

    AuthModule,
    UsersModule,
    DevicesModule,
    FollowsModule,
    SafetyModule,
    VideosModule,
    LikesModule,
    SavesModule,
    CommentsModule,
    FeedModule,
    PrayerModule,
    BibleModule,
    SaintsModule,
    ChallengesModule,
    FaithPathModule,
    ReportsModule,
    CreatorsModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
