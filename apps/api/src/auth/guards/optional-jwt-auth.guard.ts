import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Igual que JwtAuthGuard pero nunca lanza si no hay token o es inválido:
 * simplemente deja `req.user` sin definir. Útil en endpoints públicos que
 * enriquecen la respuesta (p. ej. "viewerHasLiked") cuando el visitante
 * está autenticado.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
