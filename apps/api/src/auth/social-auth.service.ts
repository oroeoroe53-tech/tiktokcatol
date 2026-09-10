import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { EnvConfig } from '../config/env.validation';

export interface SocialProfile {
  providerId: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
}

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';

/**
 * Verificación de tokens de identidad de Google / Apple Sign In (flujo nativo móvil).
 * Ambos proveedores requieren credenciales reales de desarrollador que no existen en
 * este entorno; si no están configuradas, el endpoint correspondiente responde 501
 * en vez de fallar de forma confusa o simular una verificación falsa.
 */
@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private googleClient: OAuth2Client | null = null;
  private appleJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    const googleClientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    if (googleClientId) {
      this.googleClient = new OAuth2Client(googleClientId);
    } else {
      this.logger.warn('GOOGLE_CLIENT_ID no configurado: login con Google deshabilitado');
    }

    if (this.config.get('APPLE_CLIENT_ID', { infer: true })) {
      this.appleJwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL));
    } else {
      this.logger.warn('APPLE_CLIENT_ID no configurado: login con Apple deshabilitado');
    }
  }

  isGoogleEnabled(): boolean {
    return this.googleClient !== null;
  }

  isAppleEnabled(): boolean {
    return this.appleJwks !== null;
  }

  async verifyGoogleIdToken(idToken: string): Promise<SocialProfile> {
    if (!this.googleClient) {
      throw new ServiceUnavailableException(
        'El login con Google no está configurado en este entorno (falta GOOGLE_CLIENT_ID)',
      );
    }
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get('GOOGLE_CLIENT_ID', { infer: true }),
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException('Token de Google inválido');
      }
      return {
        providerId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
        displayName: payload.name,
      };
    } catch {
      throw new UnauthorizedException('No se pudo verificar el token de Google');
    }
  }

  async verifyAppleIdToken(idToken: string): Promise<SocialProfile> {
    if (!this.appleJwks) {
      throw new ServiceUnavailableException(
        'El login con Apple no está configurado en este entorno (falta APPLE_CLIENT_ID)',
      );
    }
    try {
      const { payload } = await jwtVerify(idToken, this.appleJwks, {
        issuer: APPLE_ISSUER,
        audience: this.config.get('APPLE_CLIENT_ID', { infer: true }),
      });
      if (!payload.sub || typeof payload.email !== 'string') {
        throw new UnauthorizedException('Token de Apple inválido');
      }
      return {
        providerId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      };
    } catch {
      throw new UnauthorizedException('No se pudo verificar el token de Apple');
    }
  }
}
