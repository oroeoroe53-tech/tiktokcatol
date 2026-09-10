# Faro

Red social católica de vídeo corto — oración, Biblia, formación y Camino de Fe.

> Antes de programar se hizo un análisis completo del proyecto (nombre de marca, identidad visual, arquitectura, esquema de datos, alcance del MVP). Léelo primero en **[`docs/PLANNING.md`](docs/PLANNING.md)**.

## Qué hay implementado en este MVP

- **Backend (`apps/api`)** — NestJS + PostgreSQL/Prisma + Redis/BullMQ. Auth completa (email/password, refresh tokens, verificación de email, recuperación de contraseña, Google/Apple con interfaz real), usuarios, dispositivos/sesiones, vídeos con subida a almacenamiento S3-compatible + transcodificación real con ffmpeg, feed con algoritmo de puntuación (fase 1), likes/comentarios/guardados/seguimientos, oración (biblioteca + diaria + intenciones), Biblia (lector + evangelio del día), santos, retos, Camino de Fe, reportes/bloqueos/silencios, panel de moderación con RBAC, verificación de creadores, notificaciones (Expo push), analítica de eventos con retención/agregación programada, Swagger en `/docs`.
- **App móvil (`apps/mobile`)** — Expo Router + TypeScript. Onboarding (5 pantallas), login/registro, feed vertical con reproducción de vídeo y acciones (like/comentar/guardar/compartir/seguir/reportar/no me interesa), Descubrir, Crear (subida real), Camino de Fe, Perfil, Oración, Biblia, Santo del día, verificación de creador.
- **Panel de administración (`apps/admin`)** — Next.js. Login, dashboard con métricas, gestión de usuarios (suspender/banear/reactivar), cola de moderación de denuncias, revisión de verificaciones de creadores, gestión de categorías y notificaciones editoriales, registro de auditoría.
- **`packages/`** — tipos y validaciones (Zod) compartidos entre backend y frontends, sistema de diseño (`@faro/ui`) con tokens de marca y componentes React Native.

Lo que queda fuera de esta entrega está documentado en `docs/PLANNING.md` (§7) y en el checklist de producción más abajo.

## Estructura del monorepo

```text
faro/
├── apps/
│   ├── mobile/   Expo Router (React Native + TypeScript)
│   ├── admin/    Next.js (Pages Router)
│   └── api/      NestJS + Prisma
├── packages/
│   ├── ui/            Design system (tokens + componentes RN)
│   ├── types/          Tipos compartidos
│   ├── validation/      Esquemas Zod compartidos
│   ├── config/           tsconfig base compartido
│   └── eslint-config/
├── docs/PLANNING.md   Análisis, arquitectura, esquema, fases
├── docker-compose.yml  Postgres + Redis + MinIO (infraestructura local)
└── .env.example
```

## Requisitos

- Node.js ≥ 20, pnpm ≥ 10 (`corepack enable` es suficiente)
- Docker (para Postgres/Redis/MinIO) — o instalaciones locales equivalentes
- Para la app móvil: Expo Go en tu teléfono, o un simulador iOS/Android

## Puesta en marcha (backend + admin)

```bash
git clone <repo>
cd faro
pnpm install

# 1. Infraestructura local (Postgres, Redis, MinIO — sin credenciales de nube)
docker compose up -d

# 2. Variables de entorno de la API
cp .env.example apps/api/.env
# los valores por defecto ya coinciden con docker-compose.yml

# 3. Paquetes compartidos (deben compilarse antes que la API)
pnpm --filter @faro/types build
pnpm --filter @faro/validation build

# 4. Base de datos: migración + datos de demostración
pnpm --filter @faro/api prisma:generate
pnpm --filter @faro/api prisma:migrate
pnpm --filter @faro/api prisma:seed

# 5. Levantar la API (http://localhost:3000/api/v1, docs en /docs)
pnpm dev:api

# 6. (opcional) Worker de transcodificación de vídeo, en otra terminal
pnpm --filter @faro/api worker:video

# 7. Panel de administración (http://localhost:3001)
pnpm dev:admin
```

Usuarios de demostración tras el seed: `demo.user0@faro.app` … `demo.user19@faro.app`, contraseña `Demo1234`. `demo.user0` es `SUPER_ADMIN` y `demo.user1` es `MODERATOR` — úsalos para entrar en el panel de administración.

## App móvil

```bash
pnpm dev:mobile
```

Escanea el QR con Expo Go, o pulsa `i`/`a` para simulador iOS/Android. Por defecto apunta a `http://localhost:3000/api/v1` (`apps/mobile/app.json` → `expo.extra.apiUrl`); si pruebas desde un dispositivo físico en la misma red, cámbialo a la IP de tu máquina.

## Tests

```bash
pnpm --filter @faro/api test        # unitarios: auth, algoritmo de feed, auto-moderación
pnpm --filter @faro/api typecheck
pnpm --filter @faro/mobile typecheck
pnpm --filter @faro/admin typecheck
pnpm --filter @faro/admin build
```

## Variables de entorno

Ver `.env.example` (raíz, cópialo a `apps/api/.env`) para la lista completa con explicación de cada una. Resumen de lo que es opcional en desarrollo:

| Variable | Si falta… |
|---|---|
| `SMTP_*` | Los emails se escriben en `apps/api/storage/dev-outbox/` y en consola en vez de enviarse |
| `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` | `/auth/google` y `/auth/apple` responden `501 Not Implemented` |
| `EXPO_ACCESS_TOKEN` | Las notificaciones se guardan en base de datos pero no se envían como push |

## CI/CD

`.github/workflows/ci.yml` compila los paquetes compartidos y luego, en paralelo: lint + typecheck + tests + build de la API (con Postgres/Redis de servicio), typecheck de la app móvil, y typecheck + build del panel de administración.

## Checklist de producción

**No se afirma que este MVP esté listo para producción.** Antes de lanzar:

- [ ] Revisión legal de nombre de marca (`docs/PLANNING.md` §2) y registro de dominio/marca
- [ ] Licencia de una traducción bíblica moderna (el contenido de ejemplo usa Douay-Rheims, dominio público, como placeholder)
- [ ] Credenciales OAuth reales de Google y Apple
- [ ] Proveedor SMTP transaccional real
- [ ] Proveedor de almacenamiento de objetos + CDN de producción (AWS S3/R2/B2 en vez de MinIO)
- [ ] Revisión de cumplimiento de protección de menores por jurisdicción (la edad mínima varía por país)
- [ ] Política de privacidad y términos de uso redactados por un abogado
- [ ] Proceso real de verificación de identidad para sacerdotes/organizaciones (hoy es una cola de revisión manual por un moderador, sin verificación documental automatizada)
- [ ] Pentest de seguridad y revisión de dependencias
- [ ] Presupuesto de infraestructura validado con tráfico real estimado (el coste de vídeo/CDN es el principal driver)
- [ ] Streaming adaptativo multi-bitrate (HLS) — hoy se sirve un único MP4 720p
- [ ] Preparación para publicación en App Store / Google Play (assets de marca reales — los actuales son placeholders de color sólido, capturas, descripciones, cumplimiento de políticas de cada tienda)
- [ ] Sistema de recomendación de fase 2/3 (ML) — el actual es un sistema de puntuación por reglas, documentado como decisión intencional para el MVP

## Licencia y contenido de demostración

El contenido de vídeo de la semilla de demostración usa clips de muestra Creative Commons (Blender Foundation / Google) únicamente como placeholders reproducibles — **no son contenido católico real** y están marcados `isDemoContent: true` en la base de datos (la app muestra una insignia "DEMO"). Sustitúyelos por contenido real licenciado antes de cualquier lanzamiento público.
