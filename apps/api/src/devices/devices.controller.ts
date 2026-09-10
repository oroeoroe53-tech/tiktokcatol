import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DevicesService } from './devices.service';

@ApiTags('devices')
@UseGuards(JwtAuthGuard)
@Controller('users/me/sessions')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.devicesService.listSessions(user.id);
  }

  @Delete(':sessionId')
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.devicesService.revokeSession(user.id, sessionId);
  }
}
