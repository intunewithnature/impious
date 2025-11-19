## Impious stack

This repository contains the application stack for the Impious project. It currently serves the static lore site on `impious.io` and prepares the ground for a future browser-based Werewolf-style game hosted at `game.impious.io`.

### Services

- **Caddy (`caddy` service in `deploy/docker-compose.yml`)**
  - Reverse proxy + static file server
  - Serves `impious.io` and redirects `www.impious.io`
  - Mounts `deploy/Caddyfile` and `site/public/`
  - Exposes ports 80/443/UDP for TLS + HTTP/3
- **Game/API placeholder (`game-api`)**
  - Commented scaffolding in both compose files
  - Intended to live in `game-api/` with internal port `3000`
  - Routed via Caddy once implemented (`game.impious.io`)

### Paths & deployment layout

- Production host expectation: repository lives at `/opt/impious/deploy`
- Commands run from `/opt/impious/deploy/deploy`
- Relative mounts resolve as:
  - `./Caddyfile` → `/opt/impious/deploy/deploy/Caddyfile`
  - `../site/public` → `/opt/impious/deploy/site/public`
- Static assets remain bind-mounted for now; CI also publishes a self-contained Caddy image (`deploy/Dockerfile.caddy`) to GHCR.

### Domains & routing

| Domain | Behavior |
| --- | --- |
| `impious.io` | Static lore/marketing site served by Caddy |
| `www.impious.io` | Redirects to `https://impious.io` |
| `game.impious.io` | Reserved for future game/API; reverse proxy stub documented in Caddyfile |

Local dev uses `impious.test` / `game.impious.test` with `tls internal` certificates (see `deploy/Caddyfile.dev` and `/etc/hosts` instructions in `README-dev.md`).

### Environments

- **Production**: `deploy/docker-compose.yml` (run `docker compose pull && docker compose up -d --remove-orphans` from `deploy/`).
- **Development**: Compose override `deploy/docker-compose.dev.yml` maps host ports to `8080/8443`, uses `Caddyfile.dev`, and includes commented instructions for a hot-reloadable `game-api`. Follow `README-dev.md` for the detailed workflow.

### CI/CD

- `dev` branch: `.github/workflows/dev-ci.yml` validates compose configs, both Caddyfiles, and ensures the Caddy/site image builds.
- `main` branch & tags: `.github/workflows/main-build.yml` builds and pushes `ghcr.io/<owner>/impious-caddy` plus (conditionally) `impious-game-api` when a `game-api/Dockerfile` exists.
- Deployment to servers is currently manual (SSH + `docker compose`). Once secrets are provisioned, the workflows can be extended to trigger remote updates.

### Invariants

- All HTTP/S traffic terminates inside the Caddy container; no service bypasses it.
- Runtime configuration (compose, Caddyfile) lives in git; no “special” server-only changes.
- Repo location on servers is fixed: `/opt/impious/deploy`, with compose executed from the `deploy/` subdirectory.
- `impious.io` must always serve the static lore site from `site/public`.
- `game.impious.io` is reserved for the future game/API and must route through Docker networks (`game-api:3000`) via Caddy—never by exposing host ports directly.
- `dev` branch is non-production:
  - Uses alternate domains (`*.test`) and higher host ports.
  - May include stub services or experimental configs.
  - `main` is the canonical production branch for builds/pushes.

Refer to `README-dev.md` for detailed local iteration steps and future `game-api` scaffolding.
