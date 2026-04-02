# 基础镜像：默认 node:20-alpine（来自 Docker Hub）。
#
# 「阿里云源」的推荐做法：在 Docker Desktop → Settings → Docker Engine 里配置 registry-mirrors，
# 使用控制台「容器镜像服务 → 镜像工具 → 镜像加速器」里给你的专属地址；构建时仍写 node:20-alpine，
# 由守护进程走加速器拉取，无需改 BASE_IMAGE。（见阿里云文档：配置官方镜像加速器）
#
# 若必须写死仓库地址（例如已在 ACR「制品订阅」同步了 library/node），再设置：
#   docker compose build --build-arg BASE_IMAGE=registry.cn-<地域>.aliyuncs.com/<命名空间>/node:20-alpine
ARG BASE_IMAGE=node:20-alpine
FROM ${BASE_IMAGE} AS base

# 国内构建时 npm 默认源很慢，易表现为 RUN npm ci 长时间无输出（非死锁）。
# 海外构建可改为: docker build --build-arg NPM_REGISTRY=https://registry.npmjs.org .
ARG NPM_REGISTRY=https://registry.npmmirror.com
# sharp 的 libvips 预编译包默认从 GitHub 下载，国内走 npmmirror 镜像
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY} \
    NPM_CONFIG_FETCH_TIMEOUT=600000 \
    NPM_CONFIG_FETCH_RETRIES=8 \
    npm_config_sharp_binary_host=https://npmmirror.com/mirrors/sharp \
    npm_config_sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --loglevel=warn

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --loglevel=warn
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Production ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9000

ENV PORT=9000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
