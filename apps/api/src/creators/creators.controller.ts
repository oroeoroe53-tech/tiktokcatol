import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createVerificationRequestSchema,
  type CreateVerificationRequestInput,
} from '@faro/validation';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreatorsService } from './creators.service';

@ApiTags('creators')
@UseGuards(JwtAuthGuard)
@Controller('creators/verification-requests')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post()
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createVerificationRequestSchema)) input: CreateVerificationRequestInput,
  ) {
    return this.creatorsService.submitVerificationRequest(user.id, input);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.creatorsService.myRequests(user.id);
  }
}
