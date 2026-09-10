import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ChallengesService } from './challenges.service';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @OptionalAuth()
  @Get()
  list(@Query('all') all?: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.challengesService.list(user?.id, all !== 'true');
  }

  @OptionalAuth()
  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.challengesService.getById(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  start(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.challengesService.start(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.challengesService.completeToday(user.id, id);
  }
}
