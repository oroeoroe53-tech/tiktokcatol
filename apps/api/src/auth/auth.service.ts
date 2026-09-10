import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { nanoid } from 'nanoid';
import { AuthProvider, DeviceType, UserRole, UserStatus } from '@faro/types';
import type { LoginInput, RegisterInput } from '@faro/validation';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { resetPasswordTemplate, verifyEmailTemplate } from '../mail/templates';
import type { EnvConfig } from '../config/env.validation';
import type { AccessTokenPayload } from './types/authenticated-user';

const REFRESH_TOKEN_BYTES = 48;
const SALT_ROUNDS = 12;

interface DeviceInfo {
  deviceName?: string;
  deviceType?: DeviceType;
  userAgent?: string;
  ipAddress?: string;
  pushToken?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async register(input: RegisterInput, device: DeviceInfo) {
    const minAge = this.config.get('MIN_AGE', { infer: true });
    const age = this.computeAge(new Date(input.dateOfBirth));
    if (age < minAge) {
      throw new BadRequestException(
        `Debes tener al menos ${minAge} años para crear una cuenta en Faro`,
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email o nombre de usuario');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash,
        dateOfBirth: new Date(input.dateOfBirth),
        authProvider: AuthProvider.EMAIL,
        preferences: {
          create: { language: input.locale },
        },
      },
    });

    await this.sendVerificationEmail(user.id, user.email);
    const tokens = await this.issueTokenPair(user.id, user.email, user.role as UserRole, device);
    return { user, ...tokens };
  }

  async login(input: LoginInput, device: DeviceInfo) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Esta cuenta no está activa. Contacta con soporte.');
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user.id, user.email, user.role as UserRole, {
      ...device,
      deviceName: input.deviceName ?? device.deviceName,
    });
    return { user, ...tokens };
  }

  async refresh(rawRefreshToken: string, device: DeviceInfo) {
    const [sessionId, secret] = rawRefreshToken.split('.', 2);
    if (!sessionId || !secret) {
      throw new UnauthorizedException('Token de refresco inválido');
    }
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión inválida o caducada');
    }
    if (session.refreshTokenHash !== hashToken(secret)) {
      // Posible robo/reutilización de token: se revoca la sesión por seguridad.
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token de refresco inválido');
    }
    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Esta cuenta no está activa');
    }

    const refreshDays = this.config.get('JWT_REFRESH_EXPIRES_IN_DAYS', { infer: true });
    const newSecret = nanoid(REFRESH_TOKEN_BYTES);
    const newExpiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: hashToken(newSecret),
        expiresAt: newExpiresAt,
        userAgent: device.userAgent ?? session.userAgent,
        ipAddress: device.ipAddress ?? session.ipAddress,
      },
    });

    const accessToken = this.signAccessToken({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role as UserRole,
      sessionId,
    });

    return {
      accessToken,
      refreshToken: `${sessionId}.${newSecret}`,
      expiresIn: this.accessTokenTtlSeconds(),
    };
  }

  async logout(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async sendVerificationEmail(userId: string, email: string) {
    const token = nanoid(32);
    await this.prisma.verificationToken.create({
      data: {
        userId,
        type: 'EMAIL_VERIFY',
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const link = `${this.config.get('APP_URL', { infer: true })}/auth/verify-email?token=${token}`;
    await this.mail.send({
      to: email,
      subject: 'Confirma tu correo en Faro',
      html: verifyEmailTemplate(link),
    });
  }

  async verifyEmail(rawToken: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!record || record.type !== 'EMAIL_VERIFY' || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('El enlace de verificación no es válido o ha caducado');
    }
    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // No revelamos si el email existe o no (evita enumeración de cuentas).
    if (!user) return;

    const token = nanoid(32);
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const link = `${this.config.get('MOBILE_DEEP_LINK_BASE', { infer: true })}reset-password?token=${token}`;
    await this.mail.send({
      to: user.email,
      subject: 'Recupera tu contraseña de Faro',
      html: resetPasswordTemplate(link),
    });
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (
      !record ||
      record.type !== 'PASSWORD_RESET' ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException('El enlace de recuperación no es válido o ha caducado');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async socialLogin(
    provider: 'GOOGLE' | 'APPLE',
    profile: { providerId: string; email: string; emailVerified: boolean; displayName?: string },
    device: DeviceInfo,
  ) {
    const idField = provider === 'GOOGLE' ? 'googleId' : 'appleId';
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ [idField]: profile.providerId }, { email: profile.email }] },
    });

    if (!user) {
      const username = await this.generateUniqueUsername(profile.email, profile.displayName);
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username,
          displayName: profile.displayName ?? username,
          dateOfBirth: new Date(0), // pendiente de completar en onboarding
          authProvider: provider === 'GOOGLE' ? AuthProvider.GOOGLE : AuthProvider.APPLE,
          emailVerifiedAt: profile.emailVerified ? new Date() : null,
          [idField]: profile.providerId,
          preferences: { create: {} },
        },
      });
    } else if (!(user as any)[idField]) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { [idField]: profile.providerId },
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Esta cuenta no está activa. Contacta con soporte.');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role as UserRole, device);
    return { user, ...tokens };
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async issueTokenPair(
    userId: string,
    email: string,
    role: UserRole,
    device: DeviceInfo,
  ): Promise<TokenPair> {
    const refreshDays = this.config.get('JWT_REFRESH_EXPIRES_IN_DAYS', { infer: true });

    let deviceRecord = null;
    if (device.deviceType) {
      deviceRecord = await this.prisma.device.create({
        data: {
          userId,
          type: device.deviceType,
          name: device.deviceName,
          pushToken: device.pushToken,
        },
      });
    }

    const secret = nanoid(REFRESH_TOKEN_BYTES);
    const session = await this.prisma.session.create({
      data: {
        userId,
        deviceId: deviceRecord?.id,
        refreshTokenHash: hashToken(secret),
        userAgent: device.userAgent,
        ipAddress: device.ipAddress,
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.signAccessToken({ sub: userId, email, role, sessionId: session.id });

    return {
      accessToken,
      refreshToken: `${session.id}.${secret}`,
      expiresIn: this.accessTokenTtlSeconds(),
    };
  }

  private signAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
    });
  }

  private accessTokenTtlSeconds(): number {
    const raw = this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2] ?? 'm';
    const multiplier = ({ s: 1, m: 60, h: 3600, d: 86400 } as Record<string, number>)[unit] ?? 60;
    return value * multiplier;
  }

  private async generateUniqueUsername(email: string, displayName?: string): Promise<string> {
    const base = (displayName ?? email.split('@')[0] ?? 'creyente')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16) || 'creyente';
    let candidate = base;
    let suffix = 0;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      suffix += 1;
      candidate = `${base}${suffix}`;
    }
    return candidate;
  }

  private computeAge(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = now.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
      age -= 1;
    }
    return age;
  }
}
