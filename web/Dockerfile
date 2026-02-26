# syntax=docker/dockerfile:1

# --- deps ---
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the lockfile
COPY package.json package-lock.json ./
RUN npm ci

# --- builder ---
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

# NEXT_PUBLIC_* vars are inlined at build time by Next.js.
# Provide a default suitable for local docker-compose (browser can reach localhost:3000).
ARG NEXT_PUBLIC_API_BASE_URL=http://134.209.107.164:3000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js build (standalone output via next.config.ts)
RUN npm run build

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Optional: keep the same value available at runtime for any server-side reads.
ARG NEXT_PUBLIC_API_BASE_URL=http://134.209.107.164:3000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Security: run as non-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy the standalone server and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
