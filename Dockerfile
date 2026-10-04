FROM node:24-bookworm-slim AS builder
WORKDIR /app
RUN npm install --global npm@11.16.0
COPY . .
RUN npm ci --ignore-scripts --no-audit --no-fund
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PAINTER_RUNTIME=convex
COPY --from=builder --chown=node:node /app /app
USER node
EXPOSE 3000
CMD ["npm","run","start","--workspace","web","--","--hostname","0.0.0.0","--port","3000"]
