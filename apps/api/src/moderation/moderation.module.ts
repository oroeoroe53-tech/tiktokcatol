import { Global, Module } from '@nestjs/common';
import { AutoModerationService } from './auto-moderation.service';

@Global()
@Module({
  providers: [AutoModerationService],
  exports: [AutoModerationService],
})
export class ModerationCoreModule {}
