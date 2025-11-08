# Impious Infrastructure

Containerised services for the impious stack:

- `lore-site`: Vite/React static site served over HTTP on port 80.
- `wiki`: MkDocs static site served over HTTP on port 80.
- `game`: Fastify websocket/API server on port 8080.
- `caddy`: Front proxy that terminates TLS and routes traffic to the services above.

## Local Build & Run

- Build images locally (tags are arbitrary for local use):
  - `docker build -t impious/lore:dev lore-site`
  - `docker build -t impious/wiki:dev wiki`
  - `docker build -t impious/game:dev --build-arg COMMIT_SHA=$(git rev-parse HEAD) game`
- To run the stack locally, copy `deploy/.env.example` to `deploy/.env`, adjust values, then:
  - `cd deploy && docker compose --env-file .env up -d`
  - `docker compose ps` should show all services healthy before caddy starts proxying.

The official `caddy:2-alpine` image runs as root so it can bind ports 80/443; the application containers run as non-root.

## Environment Configuration

`deploy/.env` controls runtime configuration:

- `CADDY_EMAIL`: Email for ACME registration.
- `LORE_DOMAIN`, `WIKI_DOMAIN`, `GAME_DOMAIN`: Public hostnames; defaults cover `impious.io`.
- `IMAGE_PREFIX`: Image registry path (defaults to `ghcr.io/intunewithnature/impious`).
- `TAG`: Image tag to deploy. CI sets this to the triggering commit SHA; override for manual rollbacks.

## Health Endpoints

- Lore site: `https://impious.io/healthz.txt`
- Wiki: `https://wiki.impious.io/healthz.txt`
- Game: `https://game.impious.io/health` and `https://game.impious.io/healthz`

The game server also enables CORS for `https://impious.io` and any `*.impious.io` subdomain so the frontend can call REST endpoints.

## CI/CD & Deployments

- GitHub Actions builds and pushes `lore`, `wiki`, and `game` images to GHCR on every `main` push with tags `${{ github.sha }}` and `latest`.
- The deploy job uploads the contents of `deploy/` to the target host, logs into GHCR, and runs `docker compose up -d`.
- Automated runs deploy the freshly built `${{ github.sha }}` tag by default.

## Rollback Procedure

To redeploy a previously published image:

1. Navigate to **Actions → build-and-deploy → Run workflow**.
2. Provide the desired image tag (commit SHA or other tag) in the `deploy_tag` input.
3. Start the workflow; the deploy job will pull and run the requested tag without rebuilding images.

Alternatively, set `TAG=<desired-tag>` in `deploy/.env` and rerun `docker compose up -d` on the host.

## Production Checks

- Lore image builds, serves the Vite `dist`, and `/healthz.txt` returns HTTP 200.
- Wiki image builds, serves the MkDocs site, and `/healthz.txt` returns HTTP 200.
- Game service responds 200 on `/health` and `/healthz`, with WebSocket support and CORS enabled for `impious.io`.
- `deploy/docker-compose.yml` references the GHCR images, exposes only 80/443 via caddy, and waits for healthy backends.
- `deploy/Caddyfile` routes `impious.io`, `wiki.impious.io`, and `game.impious.io` (with WebSocket upgrade headers).
- GitHub Actions builds/pushes all three images with `:${sha}` and `:latest` tags and accepts an optional `deploy_tag`.
- `deploy/.env.example` documents the required environment and illustrates how to override `TAG` for rollbacks.
