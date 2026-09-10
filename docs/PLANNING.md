# Faro — Plan de producto y arquitectura

> Documento de análisis previo exigido antes de escribir código (ver instrucción final del brief). Cubre: análisis del proyecto, nombre de marca, identidad visual, decisiones de arquitectura, esquema de datos, estructura de monorepo, alcance exacto del MVP y fases de desarrollo.

## 1. Análisis del proyecto

**Qué es**: una app de vídeo corto vertical con identidad católica propia, cuyo objetivo de negocio no es maximizar tiempo de pantalla sino convertir consumo en acción espiritual (vídeo → reflexión → oración → reto → comunidad). Combina 6 dominios de producto que normalmente son apps separadas: red social de vídeo, Biblia, oración, formación, retos/gamificación y comunidad/moderación.

**Riesgos técnicos principales identificados**:

1. **Vídeo a escala** es el mayor riesgo de coste/arquitectura. Subir/transcodificar/servir vídeo no puede vivir en el servidor de la API — necesita almacenamiento de objetos + cola de procesamiento + CDN. Sin esto bien resuelto desde el día 1, migrar después es muy costoso.
2. **Licencias de contenido religioso**. La Biblia católica en traducciones modernas (Biblia de Jerusalén, NAB, RSV-CE, Nácar-Colunga, etc.) está protegida por derechos de autor. No se puede importar un texto bíblico completo sin licencia. Se usa una traducción de dominio público como placeholder (ver §8) y se deja el modelo de datos preparado para sustituir por una traducción licenciada en producción.
3. **Menores de edad**. Es una red social abierta a todas las edades; requiere age-gating, controles de privacidad reforzados y cumplimiento variable por país (no existe una única política válida globalmente).
4. **Moderación de contenido generado por usuarios** a escala internacional multilingüe. El MVP no puede depender solo de revisión humana ni solo de automatización.
5. **Autenticación social (Google/Apple)** requiere credenciales de desarrollador reales (Google Cloud OAuth client, Apple Developer Program) que no existen en este entorno. Se implementa el código real de las estrategias OAuth, deshabilitadas de forma segura si faltan credenciales, en vez de dejarlas como pseudocódigo.
6. **Coste de infraestructura** crece rápido con vídeo (storage + egress CDN). Se diseña para object storage compatible S3 (AWS S3, Cloudflare R2, Backblaze B2) para poder elegir el proveedor más barato sin cambiar código.

## 2. Nombre y marca

Se generaron 20 candidatos y se contrastó cada finalista contra app stores y buscadores para detectar colisiones reales (no se asume disponibilidad). Resultado de la criba:

| Nombre | Estado tras búsqueda |
|---|---|
| Lumen | ❌ Alta colisión: "Lumen: Bible & Daily Readings", "Lumen Dei", "Lumen Christi" (varias apps católicas activas) |
| Kairos | ❌ Alta colisión: "Kairos Chat", "Kairos: Daily Devotional", Kairos Media (Jesus Youth) |
| Selah | ❌ Alta colisión: al menos 5 apps cristianas/católicas activas llamadas Selah |
| Credo | ❌ Colisión: "Credo Chat", "Credo: Catholic Latin Learning", plataforma de streaming Credo |
| Peregrino/Peregrina | ❌ Colisión fuerte: mayor plataforma de audiolibros católicos de Brasil ya se llama así |
| Verbum | ❌ Colisión directa con el software bíblico católico Verbum (Faithlife/Logos) |
| Vero | ❌ Colisión con la red social "Vero — True Social" |
| Fiat | ❌ Colisión con la marca de automóviles Fiat |
| Vivo | ❌ Colisión con la marca de móviles Vivo |
| Luce | ⚠️ Conflicto de imagen: Luce es la mascota oficial del Vaticano para el Jubileo 2025-2026 |
| Amén | ⚠️ Colisión: existe ya la app católica "Amen" (Augustine Institute) |
| Ignis | ⚠️ Colisión media: "Ignis Verbi" (app de lecturas católicas), grupo de oración Ignis |
| Senda | ⚠️ Colisión menor/regional: "Senda Católica" (app brasileña de devocionales) |
| Koinonia | ⚠️ Difícil de pronunciar fuera de círculos cristianos angloparlantes |
| Emaús / Emmaus | ⚠️ Colisión menor: usado por parroquias y recursos catequéticos puntuales, ninguno es una red social de vídeo global |
| Adsum | ✅ Sin colisión relevante encontrada |
| Betania | ✅ Sin colisión relevante como app (solo negocios/parroquias con ese nombre) |
| Fontana | ✅ Sin colisión relevante como app |
| Manantial | ✅ Sin colisión relevante como app |
| **Faro** | ✅ Sin colisión relevante en el espacio de apps católicas/cristianas (existe la empresa industrial FARO Technologies, sector distinto: medición 3D — riesgo de marca bajo pero a revisar con un abogado antes de registrar) |

**Top 3 finalistas:**

1. **Faro** (elegido) — "faro" funciona en español, italiano y portugués, y se entiende visualmente en cualquier idioma (icono de faro/luz guía en la oscuridad). Es corto (4 letras), fácil de pronunciar, funciona como verbo de marca ("enciende tu Faro"), y no colisiona con ninguna app católica existente. Metáfora directa con "luz del mundo" sin sonar a app de oración genérica.
2. **Betania** — nombre con más carga narrativa (la casa de Marta, María y Lázaro: hospitalidad, amistad con Jesús), encaja muy bien con el pilar de "comunidad". Requiere más pedagogía de marca para quien no conoce la referencia bíblica.
3. **Emaús** — la metáfora más potente para la tesis del producto (contenido que "enciende el corazón" como en el camino a Emaús, Lucas 24), pero tiene más colisiones menores existentes y es más largo de escribir/pronunciar en mercados no hispanos.

**Decisión de trabajo**: se usa **Faro** como nombre de marca en el código (bundle id `com.faro.app`, paquetes `@faro/*`). Es una decisión reversible (find-and-replace); confírmalo o cámbialo antes de reservar dominio/redes/marca — una búsqueda por buscador no sustituye una búsqueda de marca registrada real ante la OEPM/USPTO/EUIPO ni la comprobación de disponibilidad de dominio en un registrador.

## 3. Identidad visual

**Concepto**: "amanecer" — de la noche (índigo profundo) a la luz (ámbar cálido). Fe como luz que rompe la oscuridad, sin caer en la estética dorada/marrón de "iglesia antigua" ni en el pastel "app de mindfulness genérica".

**Paleta** (definida como design tokens en `packages/ui`):

- Ink `#14132B` — fondo modo oscuro, texto sobre superficies claras
- Primary (Vespertine Indigo) `#4338CA` / dark `#2E2570`
- Accent (Amber Dawn) `#F5A623` / soft `#FFE3B3` — CTAs, rachas, progreso, "encender"
- Success (Sage) `#4CAF7D` — progreso espiritual completado
- Danger `#E5484D` — errores, reportes
- Background claro `#FAF9FF`, superficie `#FFFFFF`
- Texto primario `#1A1830`, texto secundario `#6B6790`
- Gradiente de marca: `linear-gradient(135deg, #14132B 0%, #4338CA 55%, #F5A623 100%)` — splash, anillos de racha, cabeceras de Camino de Fe

**Tipografía**: `Manrope` (UI, cuerpo, alto soporte de idiomas incl. polaco/alemán, OFL gratuita) + `Fraunces` (titulares, citas bíblicas — serif cálida, no institucional, OFL gratuita).

**Iconografía**: set de línea redondeada propio (llama, paloma, ancla, libro abierto, trigo/vid, amanecer, huella/camino, corazón). Sin imágenes religiosas fotorrealistas en la UI del sistema.

**Componentes**: botones píldora con sombra cálida sutil, tarjetas con radio 20-24px, avatar circular con anillo degradado (indica racha/verificación), tab bar inferior con el botón "Crear" elevado central, animaciones con Reanimated (spring suave, sin parpadeos agresivos).

Todo esto se implementa como tokens reales (no solo descripción) en `packages/ui/src/theme`.

## 4. Decisiones de arquitectura (con justificación)

| Decisión | Elección | Motivo |
|---|---|---|
| Monorepo | pnpm workspaces (sin Turborepo/Nx en MVP) | Menos piezas móviles; se puede añadir Turborepo después sin reestructurar |
| Backend | NestJS + TypeScript, monolito modular | Pedido explícitamente; evolutiva a servicios separados sin reescritura si cada módulo mantiene sus límites |
| Base de datos | PostgreSQL + Prisma | Pedido explícitamente; buen soporte de migraciones y tipado end-to-end |
| Cola de trabajos | Redis + BullMQ | Necesaria para transcodificación de vídeo y envío de notificaciones sin bloquear la API |
| Almacenamiento de vídeo | Interfaz `StorageService` compatible S3 (AWS SDK v3), backend local de desarrollo = **MinIO** vía Docker Compose | Mismo código sirve para MinIO en local y S3/R2/B2 en producción; cumple "no almacenar vídeo en el servidor de API" sin requerir credenciales de nube para poder ejecutar el proyecto |
| Transcodificación | Worker BullMQ + `ffmpeg` (fluent-ffmpeg) real, genera MP4 comprimido + thumbnail | Evita quedarnos en pseudocódigo; streaming adaptativo (HLS multi-bitrate) se deja documentado para fase 2/3 por complejidad de infraestructura |
| Auth social | Passport (Google OAuth2, Apple Sign In) implementado de verdad, pero el endpoint responde 501 si faltan `GOOGLE_CLIENT_ID`/`APPLE_*` en el entorno | No se puede probar sin credenciales reales; así el resto de la app funciona igualmente en local |
| Email transaccional | Nodemailer con transporte SMTP configurable; si no hay SMTP configurado, usa un transporte de desarrollo que escribe el email a `storage/dev-outbox/` y a consola | Permite probar registro/verificación/recuperación de contraseña de extremo a extremo sin credenciales |
| Admin web | Next.js 14 (App Router) + TypeScript + Tailwind | Rapidez de desarrollo, mismo lenguaje que el resto del monorepo |
| Traducción bíblica (seed) | Douay-Rheims (dominio público, católica, incluye deuterocanónicos) para el contenido de ejemplo en inglés; aviso explícito de que producción requiere licencia de una traducción moderna | Cumple "no usar contenido con derechos sin autorización" |
| Retención de datos de interacción | Eventos crudos (`VideoView`) con purga programada + agregados diarios (`VideoStats`) | Evita almacenamiento indefinido de eventos de comportamiento por usuario |
| RBAC admin | Enum de roles + guards de NestJS (`SUPER_ADMIN`, `MODERATOR`, `EDITOR`, `SUPPORT`, `ANALYST`) + audit log | Pedido explícitamente en §24 |

## 5. Esquema de base de datos

Ver `apps/api/prisma/schema.prisma` (fuente de verdad). Resumen de entidades del MVP: `User`, `UserPreferences`, `Session`, `Device`, `Video`, `VideoView` (crudo) + `VideoStats` (agregado), `Like`, `Save`, `Follow`, `Comment`, `Hashtag`, `Category`, `Notification`, `Prayer`, `PrayerCategory`, `PrayerSession`, `PrayerIntention`, `Saint`, `BibleBook`, `BibleChapter`, `BibleVerse`, `Challenge`, `ChallengeDay`, `ChallengeProgress`, `FaithPath`, `FaithPathStep`, `FaithPathProgress`, `Report`, `Block`, `Mute`, `CreatorVerification`, `AdminAuditLog`, `Consent`.

## 6. Estructura del monorepo

```text
faro/
├── apps/
│   ├── mobile/   (Expo Router + TS)
│   ├── admin/    (Next.js + TS)
│   └── api/      (NestJS + TS + Prisma)
├── packages/
│   ├── ui/               (design tokens + componentes RN)
│   ├── types/             (tipos compartidos)
│   ├── validation/        (esquemas Zod compartidos)
│   ├── config/             (eslint/tsconfig base compartidos)
│   └── eslint-config/
├── infrastructure/
├── docs/
├── scripts/
├── docker-compose.yml
└── .env.example
```

## 7. MVP exacto (alcance de esta entrega)

**Dentro de alcance** (implementado con código funcional real): autenticación email/password + refresh tokens + verificación de email + recuperación de contraseña + gestión de dispositivos/sesiones (Google/Apple con interfaz real, deshabilitados sin credenciales); onboarding (objetivo, intereses, idioma, notificaciones); perfiles; subida de vídeo con almacenamiento real en MinIO/S3 y transcodificación real con ffmpeg; feed vertical con algoritmo de puntuación fase 1; likes, comentarios, guardados, seguimientos; oración (biblioteca + oración diaria + intenciones); Biblia (lector + evangelio del día, contenido demo limitado por licencia); Camino de Fe (objetivo + progreso + actividades diarias); retos; reportes/bloqueos/silencios + panel de moderación básico; panel de administración con RBAC; seed data de demostración.

**Fuera de alcance de esta entrega** (documentado, no implementado): streaming adaptativo multi-bitrate, machine learning de recomendación (fase 2/3), directos, mensajería privada, verificación de creadores con proceso humano real (se deja el modelo de datos y el flujo de estados, sin integración con un proveedor de verificación de identidad), pagos/suscripciones, app store submission.

## 8. Fases de desarrollo

Se sigue el orden pedido en el brief (§47): 1) monorepo/config/design system/DB/backend/auth → 2) onboarding/usuarios/perfiles → 3) vídeos/storage/feed → 4) social → 5) oración/Biblia → 6) Camino de Fe/retos → 7) moderación → 8) admin → 9) analítica → 10) optimización/testing/seguridad.

## 9. Checklist de producción (honesto)

No se afirma que el MVP esté listo para producción. Antes de lanzar hace falta, como mínimo: revisión legal de nombre de marca/dominio, licencia real de traducción bíblica, credenciales OAuth reales de Google/Apple, proveedor SMTP real, proveedor de object storage/CDN de producción, revisión de cumplimiento de protección de menores por país (edad mínima varía por jurisdicción), política de privacidad y términos de uso redactados por un abogado, proceso real de verificación de identidad para sacerdotes/organizaciones, pentest de seguridad, y presupuesto de infraestructura validado con tráfico real estimado.
