import { Injectable } from '@nestjs/common';
import { ModerationStatus } from '@faro/types';

/**
 * Moderación automática de texto (fase 1): lista de bloqueo simple para spam,
 * insultos graves y patrones evidentes de contenido no deseado.
 *
 * Esto es deliberadamente simple y NO sustituye revisión humana — solo filtra
 * los casos más obvios para no sobrecargar la cola de moderadores, tal como
 * pide el brief ("los sistemas automáticos deben servir de ayuda, no sustituir
 * la revisión humana"). Contenido no bloqueado automáticamente queda en estado
 * PENDING hasta que se aprueba, salvo el contenido editorial/semilla marcado
 * como aprobado de antemano.
 */
@Injectable()
export class AutoModerationService {
  private readonly blockedPatterns: RegExp[] = [
    /\bviagra\b/i,
    /\bfree\s*money\b/i,
    /\bclick\s*here\b/i,
    /\bhate\s*speech\b/i,
    // patrones de URLs de spam masivo (muchos enlaces en un mismo texto)
  ];

  evaluateText(text: string): ModerationStatus {
    if (!text) return ModerationStatus.PENDING;
    const linkCount = (text.match(/https?:\/\//gi) ?? []).length;
    if (linkCount >= 3) return ModerationStatus.FLAGGED;
    if (this.blockedPatterns.some((pattern) => pattern.test(text))) {
      return ModerationStatus.FLAGGED;
    }
    return ModerationStatus.PENDING;
  }
}
