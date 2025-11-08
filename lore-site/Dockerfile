# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts eslint.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS runtime
ARG COMMIT_SHA=unknown
LABEL org.opencontainers.image.source="https://impious.io" \
      org.opencontainers.image.title="impious-lore" \
      org.opencontainers.image.revision=$COMMIT_SHA

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz.txt || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
