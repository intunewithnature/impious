### Impious deploy directory

This folder is copied as-is to `/opt/impious/deploy/deploy` on every server. The repository root is `/opt/impious/deploy`, so deployments run commands from this directory:

```sh
cd /opt/impious/deploy/deploy
```

Relative paths inside the compose files resolve against this location:

- `./Caddyfile*` → `/opt/impious/deploy/deploy/Caddyfile*`
- Docker builds use the repo root (`..`) as context when compiling the site.

### Stack separation

- **Production (vps host)** uses `docker-compose.yml` + `Caddyfile`. The Caddy container serves bundled assets that are baked into the multi-stage image, so no bind-mount to `site/public` is required.
- **Dev / staging** overlays `docker-compose.dev.yml` + `Caddyfile.dev`. This variant listens on `impious.test` domains with `tls internal`, maps ports `8080/8443`, and bind-mounts `../site/public` so you can iterate without rebuilding the image.

### Production stack (vps)

- Compose file: `docker-compose.yml`
- Service: `caddy` (image `ghcr.io/intunewithnature/impious-site:${IMAGE_TAG:-dev}`)
- Ports: `80`, `443`, `443/udp` (HTTP/3)
- Volumes: `caddy_data` / `caddy_config` for TLS state + `codex_payload` mounted at `/srv/codex` (ready for lore drops or codex microsites)
- Network: `edge`
- Optional `game-api` service ships with `profiles: ['game']` — enable via `docker compose --profile game ...` once the service exists.
- Typical refresh:

  ```sh
  IMAGE_TAG=main docker compose up -d --build --remove-orphans
  ```

### Staging / dev stack (test-server or local)

- Compose invocation: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
- Ports: `8080` (HTTP) and `8443` (HTTPS + HTTP/3)
- TLS: `Caddyfile.dev` enables `tls internal` so browsers see a locally-trusted cert once you trust the CA.
- Volumes: `caddy_data_dev` / `caddy_config_dev` keep staging certs distinct.
- `../site/public` is bind-mounted, so remember to run `npm run build` inside `site/` before starting the stack.

### Quick reference

| Scenario | Command |
| --- | --- |
| Prod refresh (vps) | `cd deploy && IMAGE_TAG=main docker compose up -d --build --remove-orphans` |
| Dev/staging refresh | `cd deploy && docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build` |
| Enable game profile | Append `--profile game` to either command |

Keep all config changes in git so the servers can `git pull` plus the appropriate compose command to receive updates.
