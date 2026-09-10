import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import type { EnvConfig } from '../config/env.validation';

/**
 * Envío de push notifications vía Expo Push Service. Funciona sin credenciales
 * adicionales de Apple/Google (Expo gestiona APNs/FCM), aunque para volúmenes
 * altos en producción se recomienda un EXPO_ACCESS_TOKEN dedicado.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo: Expo;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {
    this.expo = new Expo({ accessToken: this.config.get('EXPO_ACCESS_TOKEN', { infer: true }) });
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const devices = await this.prisma.device.findMany({
      where: { userId, pushToken: { not: null } },
    });

    const messages: ExpoPushMessage[] = devices
      .filter((device) => device.pushToken && Expo.isExpoPushToken(device.pushToken))
      .map((device) => ({ to: device.pushToken as string, sound: 'default', title, body, data }));

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        this.logger.error('Error enviando push notifications', error as Error);
      }
    }
  }
}
