ARG COMMIT_SHA=dev

FROM node:20-alpine AS builder
ARG COMMIT_SHA
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
ARG COMMIT_SHA
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
ENV COMMIT_SHA=${COMMIT_SHA}
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=2s --retries=3 --start-period=15s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "dist/server.js"]
