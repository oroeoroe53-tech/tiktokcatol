import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
