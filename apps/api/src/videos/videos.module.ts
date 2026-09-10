import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';

@Module({
  imports: [QueueModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
