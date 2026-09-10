import type { Request } from 'express';
import { DeviceType } from '@faro/types';

export function extractDeviceInfo(req: Request) {
  const headerType = (req.headers['x-device-type'] as string | undefined)?.toUpperCase();
  const deviceType =
    headerType === 'IOS' || headerType === 'ANDROID' || headerType === 'WEB'
      ? (headerType as DeviceType)
      : undefined;

  return {
    deviceType,
    deviceName: req.headers['x-device-name'] as string | undefined,
    pushToken: req.headers['x-push-token'] as string | undefined,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  };
}
