# build
FROM python:3.12-alpine AS build
WORKDIR /site
RUN apk add --no-cache build-base libffi-dev git
RUN pip install --no-cache-dir mkdocs mkdocs-material mkdocs-git-revision-date-localized-plugin mkdocs-material-extensions
COPY mkdocs.yml ./mkdocs.yml
COPY docs ./docs
RUN mkdocs build --site-dir /out

# serve
FROM nginx:1.27-alpine
COPY --from=build /out /usr/share/nginx/html
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost/ || exit 1
