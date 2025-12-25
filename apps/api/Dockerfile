# 1. Base stage (pnpm 설치 및 공통 환경 설정)
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Pruner stage (Turborepo를 이용해 필요한 파일만 추출)
FROM base AS pruner
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune api --docker

# 3. Installer stage (의존성 설치)
FROM base AS installer
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# 4. Builder stage (애플리케이션 빌드)
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
# Prisma client generation (NestJS에서 사용하는 경우 필수)
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN pnpm turbo run build --filter=api

# 5. Runner stage (실행 환경 최적화)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# 빌드 결과물과 필요한 의존성 파일들을 원본 구조와 동일하게 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 4000
# Debug: List files to verify structure
RUN ls -R /app/apps/api/dist

# prisma.config.ts가 src 외부에 있어 dist/src/main.js 위치에 파일이 생성됨
CMD ["node", "/app/apps/api/dist/src/main.js"]