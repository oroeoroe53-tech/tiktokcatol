import { Module } from '@nestjs/common';
import { PrayerService } from './prayer.service';
import { PrayerController } from './prayer.controller';

@Module({
  controllers: [PrayerController],
  providers: [PrayerService],
})
export class PrayerModule {}
