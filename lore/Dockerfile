# Build stage: render single-file TiddlyWiki
FROM node:20-alpine AS build
WORKDIR /src
RUN npm install -g tiddlywiki
COPY lore-wiki/ /src/
RUN tiddlywiki /src --rendertiddler $:/core/save/all /out/index.html text/plain

# Runtime stage: static hosting via nginx
FROM nginx:1.27-alpine
COPY --from=build /out/index.html /usr/share/nginx/html/index.html
RUN printf 'server { \
  listen 80; \
  add_header Cache-Control "public,max-age=600"; \
  location / { try_files $uri $uri/ /index.html; } \
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/index.html >/dev/null || exit 1
