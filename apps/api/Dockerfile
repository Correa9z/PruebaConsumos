# Build (Debian/slim para Prisma; Alpine da problemas con OpenSSL y el engine)
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL requerido por Prisma (schema engine / migrate)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --ignore-scripts

COPY . .
RUN npx prisma generate && npm run build

# Run
FROM node:20-slim AS runner

WORKDIR /app

# OpenSSL requerido por Prisma en runtime (migrate deploy + queries)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm install tsx --no-save

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Migraciones, seed (productos iniciales) y arranque de la API
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/main"]
