import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  onboardingObjectivesSchema,
  updatePreferencesSchema,
  type OnboardingObjectivesInput,
  type UpdatePreferencesInput,
} from '@faro/validation';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UsersService } from './users.service';

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
});
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

@ApiTags('users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) input: UpdateProfileInput,
  ) {
    return this.usersService.updateMe(user.id, input);
  }

  @Get('me/preferences')
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getPreferences(user.id);
  }

  @Patch('me/preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updatePreferencesSchema)) input: UpdatePreferencesInput,
  ) {
    return this.usersService.updatePreferences(user.id, input);
  }

  @Patch('me/onboarding/objective')
  setObjective(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(onboardingObjectivesSchema)) input: OnboardingObjectivesInput,
  ) {
    return this.usersService.completeOnboardingObjective(user.id, input.objective);
  }

  @Patch('me/onboarding/complete')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.completeOnboarding(user.id);
  }

  @Get(':username')
  getByUsername(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }
}
