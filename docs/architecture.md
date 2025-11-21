# Architecture

Impious is a mono-repo that bundles the static marketing site, container images, and deployment assets that live on Nix-hosted servers. The repository root is cloned to `/opt/impious/deploy` on every host; all Docker commands run from `/opt/impious/deploy/deploy`.

## Repository map

- `site/` – Vite + TypeScript source for the lore site. `npm run build` outputs to `site/public/`, which is committed so servers can deploy without a toolchain.
- `deploy/` – Runtime configuration (Caddyfiles, docker-compose manifests, Dockerfile for the bundled site image).
- `.github/workflows/` – GitHub Actions for CI validation, publishing images, and automated code review.
- `game-api/` – Not yet present; compose/Caddy placeholders reserve the service name (`game-api`) and port (`3000`) for when the multiplayer API ships.

## Runtime services

### Caddy (`caddy` service)
- Defined in `deploy/docker-compose.yml`.
- Runs the upstream `caddy:2-alpine` image with `/srv/site` bind-mounted from `../site/public`.
- Mounts production config/PKI volumes (`caddy_data`, `caddy_config`) plus the canonical `deploy/Caddyfile`.
- Exposes `80/tcp`, `443/tcp`, and `443/udp` (HTTP/3) to the host and joins the shared `impious-net` Docker network so future services can be reverse-proxied.

### Static site assets
- Purely static output living in `site/public`.
- Served read-only via the bind mount in both prod and dev compose files, or baked into the `deploy/Dockerfile.caddy` image for GHCR deployments.

### Future `game-api`
- Reserved service name in compose/Caddy comments.
- Target container port `3000`; will be reverse-proxied through Caddy at `game.impious.io` / `game.impious.test`.
- Until implemented, Caddy’s dev file responds with a stub so DNS and routing can be validated without a backend.

## Networking and ports

| Service | Environment | Host ports | Container ports | TLS behavior |
| --- | --- | --- | --- | --- |
| `caddy` | Production (`docker-compose.yml`) | `80`, `443`, `443/udp` | `80`, `443` | Automatic HTTPS via Let’s Encrypt for `impious.io` + `www.impious.io`. |
| `caddy` | Dev/Staging (`docker-compose.dev.yml`) | `8080`, `8443`, `8443/udp` | `80`, `443` | `auto_https` disabled globally; individual sites call `tls internal` for loopback domains to avoid hitting Let’s Encrypt. |
| `game-api` (future) | Any | Not exposed directly | `3000` | Only reachable behind Caddy on `impious-net`. |

All services attach to the user-defined `impious-net` so that future containers (game servers, APIs, admin tooling) can communicate without publishing extra host ports.

## Caddy routing

- `deploy/Caddyfile` (production):
  - `impious.io` serves `/srv/site`.
  - `www.impious.io` permanently redirects to the apex domain.
  - Commented `game.impious.io` block documents the reverse proxy that will come online once the `game-api` container exists.
- `deploy/Caddyfile.dev` (dev/staging):
  - Reuses the same site snippet for `impious.test`, `www.impious.test`, `localhost`, and optional `staging.impious.io`.
  - Adds a `/healthz` endpoint and an `X-Impious-Env: dev` response header so automation can spot the dev stack.
  - Includes a `game.impious.test` stub that will turn into `reverse_proxy game-api:3000` during backend development.

## Environments

- **Production (VPS):**
  - Compose file: `deploy/docker-compose.yml`.
  - Runs the `caddy-prod` container, binds `../site/public`, and stores ACME state in named volumes.
  - Intended to be driven manually (SSH → `git pull` → `docker compose up -d --remove-orphans`) or by future orchestration.
- **Staging / Dev server:**
  - Compose file: `deploy/docker-compose.dev.yml`.
  - Same static files, but host ports shift to `8080/8443` and TLS relies on `tls internal`.
  - Optional staging hostnames (`staging.impious.io`, `stage.impious.io`) remain HTTP-only so they never contend with the production certificates.
- **Local development:**
  - `npm run dev` in `site/` spins up the Vite dev server on port `5173`.
  - To mirror production, run `npm run build` followed by `docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml up` to reuse the same containers with local overrides.
