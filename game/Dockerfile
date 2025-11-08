ARG COMMIT_SHA=dev

FROM node:20-alpine AS build
ARG COMMIT_SHA
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN npm run build

FROM node:20-alpine
ARG COMMIT_SHA
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --prefer-offline
ENV PORT=8080
ENV COMMIT_SHA=${COMMIT_SHA}
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
CMD ["node", "dist/server.js"]
