import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { FaithPathService } from './faith-path.service';

@ApiTags('faith-path')
@UseGuards(JwtAuthGuard)
@Controller('faith-path')
export class FaithPathController {
  constructor(private readonly faithPathService: FaithPathService) {}

  @Get()
  getMyPath(@CurrentUser() user: AuthenticatedUser) {
    return this.faithPathService.getMyPath(user.id);
  }

  @Get('progress')
  getProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.faithPathService.getProgressSummary(user.id);
  }

  @Post('steps/:id/complete')
  completeStep(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.faithPathService.completeStep(user.id, id);
  }
}
