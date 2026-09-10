import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RetentionTask } from './retention.task';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RetentionTask],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
