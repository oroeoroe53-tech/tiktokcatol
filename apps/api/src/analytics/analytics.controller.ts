import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AnalyticsService } from './analytics.service';

const trackEventsSchema = z.object({
  events: z
    .array(z.object({ name: z.string().min(1).max(60), properties: z.record(z.unknown()).optional() }))
    .min(1)
    .max(50),
});
type TrackEventsInput = z.infer<typeof trackEventsSchema>;

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @OptionalAuth()
  @Post('events')
  track(
    @Body(new ZodValidationPipe(trackEventsSchema)) input: TrackEventsInput,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.analyticsService.trackBatch(user?.id, input.events);
  }
}
