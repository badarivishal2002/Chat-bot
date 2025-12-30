# Multi-stage build for Next.js application
FROM node:20-alpine AS base

# Accept environment argument
ARG ENVIRONMENT=dev

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Install ALL dependencies (including devDependencies) needed for build
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
ARG ENVIRONMENT=dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Make sure next.config.js is copied (this is crucial for your build fix)
# The COPY . . above should handle this, but let's be explicit
COPY next.config.js* ./

# Copy environment-specific .env file
COPY config/${ENVIRONMENT}/.env .env

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Clear any existing build cache
RUN rm -rf .next

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public

# You need to update this for standalone mode
# First, make sure your next.config.js has output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]