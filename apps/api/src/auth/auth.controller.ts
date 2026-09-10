import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  loginSchema,
  oauthLoginSchema,
  refreshSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type LoginInput,
  type OAuthLoginInput,
  type RefreshInput,
  type RegisterInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '@faro/validation';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { extractDeviceInfo } from './device-info.util';
import type { AuthenticatedUser } from './types/authenticated-user';
import { toUserSummary } from '../users/users.mapper';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly socialAuth: SocialAuthService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Req() req: Request,
  ) {
    const { user, ...tokens } = await this.authService.register(input, extractDeviceInfo(req));
    return { user: toUserSummary(user), ...tokens };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() req: Request,
  ) {
    const { user, ...tokens } = await this.authService.login(input, extractDeviceInfo(req));
    return { user: toUserSummary(user), ...tokens };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) input: RefreshInput,
    @Req() req: Request,
  ) {
    return this.authService.refresh(input.refreshToken, extractDeviceInfo(req));
  }

  @Public()
  @Post('google')
  async loginWithGoogle(
    @Body(new ZodValidationPipe(oauthLoginSchema)) input: OAuthLoginInput,
    @Req() req: Request,
  ) {
    const profile = await this.socialAuth.verifyGoogleIdToken(input.idToken);
    const { user, ...tokens } = await this.authService.socialLogin('GOOGLE', profile, {
      ...extractDeviceInfo(req),
      deviceName: input.deviceName,
    });
    return { user: toUserSummary(user), ...tokens };
  }

  @Public()
  @Post('apple')
  async loginWithApple(
    @Body(new ZodValidationPipe(oauthLoginSchema)) input: OAuthLoginInput,
    @Req() req: Request,
  ) {
    const profile = await this.socialAuth.verifyAppleIdToken(input.idToken);
    const { user, ...tokens } = await this.authService.socialLogin('APPLE', profile, {
      ...extractDeviceInfo(req),
      deviceName: input.deviceName,
    });
    return { user: toUserSummary(user), ...tokens };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logoutAllDevices(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('resend-verification')
  async resendVerification(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.authService.findUserById(authUser.id);
    await this.authService.sendVerificationEmail(user.id, user.email);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) input: VerifyEmailInput) {
    await this.authService.verifyEmail(input.token);
    return { success: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('request-password-reset')
  async requestPasswordReset(
    @Body(new ZodValidationPipe(requestPasswordResetSchema)) input: RequestPasswordResetInput,
  ) {
    await this.authService.requestPasswordReset(input.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) input: ResetPasswordInput,
  ) {
    await this.authService.resetPassword(input.token, input.newPassword);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.authService.findUserById(authUser.id);
    return toUserSummary(user);
  }
}
