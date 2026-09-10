import { Module } from '@nestjs/common';
import { FaithPathService } from './faith-path.service';
import { FaithPathController } from './faith-path.controller';

@Module({
  controllers: [FaithPathController],
  providers: [FaithPathService],
})
export class FaithPathModule {}
