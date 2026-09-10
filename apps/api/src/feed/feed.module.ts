import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';

@Module({
  imports: [VideosModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
