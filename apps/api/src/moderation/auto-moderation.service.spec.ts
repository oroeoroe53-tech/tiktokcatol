import { ModerationStatus } from '@faro/types';
import { AutoModerationService } from './auto-moderation.service';

describe('AutoModerationService', () => {
  const service = new AutoModerationService();

  it('marca como PENDING el texto normal (requiere revisión, no lo rechaza)', () => {
    expect(service.evaluateText('Hoy reflexionamos sobre el Evangelio de San Juan.')).toBe(
      ModerationStatus.PENDING,
    );
  });

  it('marca como FLAGGED el texto con patrones evidentes de spam', () => {
    expect(service.evaluateText('Compra viagra barata aquí')).toBe(ModerationStatus.FLAGGED);
  });

  it('marca como FLAGGED texto con muchos enlaces (posible spam)', () => {
    const text = 'Visita http://a.com http://b.com http://c.com';
    expect(service.evaluateText(text)).toBe(ModerationStatus.FLAGGED);
  });

  it('trata el texto vacío como PENDING sin lanzar errores', () => {
    expect(service.evaluateText('')).toBe(ModerationStatus.PENDING);
  });
});
