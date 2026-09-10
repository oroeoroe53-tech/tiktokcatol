# Imagen de producción para la API de Faro (NestJS).
# Build multi-stage: instala dependencias del monorepo, compila y deja una imagen mínima.

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @faro/api...

FROM deps AS build
COPY apps/api ./apps/api
RUN pnpm --filter @faro/api prisma:generate
RUN pnpm --filter @faro/api build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api ./apps/api
WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
