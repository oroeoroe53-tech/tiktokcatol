import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createPrayerIntentionSchema, type CreatePrayerIntentionInput } from '@faro/validation';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PrayerService } from './prayer.service';

@ApiTags('prayer')
@Controller('prayers')
export class PrayerController {
  constructor(private readonly prayerService: PrayerService) {}

  @OptionalAuth()
  @Get()
  list(
    @Query('category') category?: string,
    @Query('language') language = 'es',
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.prayerService.list(category, language, user?.id);
  }

  @OptionalAuth()
  @Get('daily')
  daily(@Query('language') language = 'es', @CurrentUser() user?: AuthenticatedUser) {
    return this.prayerService.getDaily(language, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.prayerService.history(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  favorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prayerService.favorite(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  unfavorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prayerService.unfavorite(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prayerService.logSession(user.id, id);
  }

  @OptionalAuth()
  @Get('intentions')
  listIntentions(@Query('cursor') cursor?: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.prayerService.listIntentions(user?.id, cursor);
  }

  @UseGuards(JwtAuthGuard)
  @Post('intentions')
  createIntention(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createPrayerIntentionSchema)) input: CreatePrayerIntentionInput,
  ) {
    return this.prayerService.createIntention(user.id, input);
  }

  @UseGuards(JwtAuthGuard)
  @Post('intentions/:id/pray')
  support(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prayerService.support(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('intentions/:id/pray')
  unsupport(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.prayerService.unsupport(user.id, id);
  }
}
