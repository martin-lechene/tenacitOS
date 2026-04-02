# syntax=docker/dockerfile:1
# TenacitOS (Next.js) — production image
FROM node:22-bookworm-slim AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_AGENT_NAME=Mission Control
ARG NEXT_PUBLIC_AGENT_EMOJI="🤖"
ARG NEXT_PUBLIC_AGENT_DESCRIPTION="OpenClaw Mission Control"
ARG NEXT_PUBLIC_APP_TITLE=Mission Control
ENV NEXT_PUBLIC_AGENT_NAME=$NEXT_PUBLIC_AGENT_NAME
ENV NEXT_PUBLIC_AGENT_EMOJI=$NEXT_PUBLIC_AGENT_EMOJI
ENV NEXT_PUBLIC_AGENT_DESCRIPTION=$NEXT_PUBLIC_AGENT_DESCRIPTION
ENV NEXT_PUBLIC_APP_TITLE=$NEXT_PUBLIC_APP_TITLE

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/data /opt/tenacitos-data-examples

COPY docker/tenacitos-entrypoint.sh /tenacitos-entrypoint.sh
RUN chmod +x /tenacitos-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["/tenacitos-entrypoint.sh"]
CMD ["node", "server.js"]
