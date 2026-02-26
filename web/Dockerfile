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

# 👇 THÊM 2 DÒNG NÀY
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js build (standalone output via next.config.ts)
RUN npm run build

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# (optional) runtime env for visibility/debug; NEXT_PUBLIC_* đã được bake lúc build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy the standalone server and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]