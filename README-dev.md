## Impious dev workflow

This repository models the production stack that runs under `/opt/impious/deploy` on NixOS. The `dev` branch adds a couple of conveniences for local iteration while keeping the same structure.

### Prerequisites

- Docker + Docker Compose plugin
- Update `/etc/hosts` (or platform equivalent) so the local domains resolve to loopback:

```
127.0.0.1 impious.test www.impious.test game.impious.test
```

### Static lore site

The lore/marketing site is plain HTML under `site/public/`. To preview it with the same Caddy stack as production:

```sh
cd deploy
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- Caddy listens on `https://impious.test:8443` (self-signed via `tls internal`).
- The container bind-mounts `../site/public` read-only, so edits to `site/public/*` reload instantly.

### Future game / API service

- Target service name: `game-api`
- Default internal port: `3000`
- Caddy routes `game.impious.io` / `game.impious.test` to this service once it exists.
- Place the backend/frontend code under `game-api/` at the repo root; the compose files already include commented stubs that:
  - Build from `../game-api`
  - Join the same Docker network as Caddy
  - (Dev) bind-mount the directory for hot reload and publish `localhost:3000`

When the service is ready, uncomment the relevant block in `deploy/docker-compose.yml` (prod) and `deploy/docker-compose.dev.yml` (dev). Align the container port with the `game-api:3000` reverse proxy stub in the Caddyfile(s).

### Hot reload suggestions

- For a Node.js implementation, expose a script (e.g., `npm run dev`) that uses nodemon or Vite.
- Mount your source: `../game-api:/app` and set `working_dir: /app`.
- Keep environment variables in `.env` files and reference them via `env_file` to avoid hard-coding secrets.

### Cleaning up

Shut down the stack with:

```sh
cd deploy
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Volumes `caddy_dev_*` persist certificates; run `docker volume rm caddy_dev_data caddy_dev_config` if you want to reset the local trust store.
