# ---- deps: cài toàn bộ deps (kể cả dev) để build
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# toolchain cho better-sqlite3 nếu không có prebuilt binary
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: next build (production)
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- prod-deps: chỉ deps runtime
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runner: image cuối, một process duy nhất (HTTP + WS + SQLite)
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY package.json tsconfig.json next.config.ts ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY server ./server
COPY public ./public

# SQLite data dir — mount volume vào đây để giữ dữ liệu
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "server/index.ts"]
