import { Module } from '@nestjs/common';
import { SaintsService } from './saints.service';
import { SaintsController } from './saints.controller';

@Module({
  controllers: [SaintsController],
  providers: [SaintsService],
})
export class SaintsModule {}
