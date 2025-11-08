# ---- build ----
FROM python:3.12-alpine AS build
WORKDIR /site
RUN apk add --no-cache build-base libffi-dev git
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY mkdocs.yml .
COPY docs ./docs
RUN mkdocs build --clean --site-dir /out

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /out ./
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz.txt || exit 1
