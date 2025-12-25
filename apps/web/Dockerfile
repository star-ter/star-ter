# 1. Base stage
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Pruner stage
FROM base AS pruner
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune web --docker

# 3. Installer stage
FROM base AS installer
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# 4. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=web

# 5. Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Standalone 모드 결과물 복사
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Next.js standalone은 root에 server.js를 생성하며 내부적으로 apps/web 경로를 인지함
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]