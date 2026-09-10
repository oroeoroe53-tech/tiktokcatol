import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { SavesService } from './saves.service';
import { SavesController } from './saves.controller';

@Module({
  imports: [VideosModule],
  controllers: [SavesController],
  providers: [SavesService],
})
export class SavesModule {}
