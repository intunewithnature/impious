## Impious stack

The `impious` repo is the single source of truth for:

- The Vite/Three.js marketing site that ultimately ships as static files.
- Production/staging Docker + Caddy stacks consumed by NixHQ.
- Integration points for future `game.imperiumsolis.org` and `codex.imperiumsolis.com` properties.

If it affects imperiumsolis.org routing or deployment, it lives here.

### Repository layout

- `site/` – Vite + TypeScript + Three.js SPA. The deterministic, committed bundle lives in `site/public`.
- `deploy/` – Production compose file, dev override, Caddyfiles, Dockerfile, and `.env.example`.
- `codex-payload/` + `codex-payload-dev/` – Empty by default; drop codex build artifacts here (or override their paths) so Caddy can serve `codex.imperiumsolis.com` and `codex.impious.test`.
- `scripts/` – Operator helpers such as `deploy-example.sh`.
- `docs/` – Living notes (`docs/stack-overview.md`) that describe current/expected topology.

### Static site workflow (`site/`)

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked deps (Node 20+) |
| `npm run dev` | Vite dev server (5173) |
| `npm run build` | Production bundle → `site/public` (includes build version metadata) |
| `npm run build:staging` | Same bundle but with `VITE_ENV=staging` to exercise the staging banner |
| `npm run verify:bundle` | Rebuild + `git diff --exit-code public` so CI can fail on stale artifacts |
| `npm run preview` | Preview the committed bundle |
| `npm run check` | TypeScript validation |

Build invariants:

- `site/public` is tracked in git. Every PR must keep it in sync with `site/src` (CI runs `npm run verify:bundle`).
- `VITE_BUILD_VERSION` defaults to `git rev-parse --short HEAD` and is embedded in `index.html` and a staging banner (`VITE_ENV != production`).
- Dev/staging builds scream “STAGING BUILD” via the banner so it’s obvious when you are not on prod.

### Domains & routing

| Domain | Owner | Behaviour |
| --- | --- | --- |
| `imperiumsolis.org` | this repo | Serves `site/public` via Caddy (`/srv/site`) |
| `www.imperiumsolis.org` | this repo | 301 redirect to `https://imperiumsolis.org{uri}` |
| `game.imperiumsolis.org` | future game repo | Reverse-proxy stub to `game-api:3000` (compose `--profile game`) |
| `codex.imperiumsolis.com` | codex repo | Static file server rooted at `/srv/codex` (bind mount `CODEX_PAYLOAD_HOST_PATH`) |

Local/staging equivalents live in `Caddyfile.dev` using `.test` domains (`imperiumsolis.test`, `www.imperiumsolis.test`, `impious.test`, `www.impious.test`, `codex.impious.test`, `codex.imperiumsolis.test`, `game.imperiumsolis.test`, `game.impious.test`) with `tls internal`.

### Docker + deployment

- `deploy/docker-compose.yml` is the production manifest.
  - `caddy`: stock `caddy:2.8-alpine`, binds `./Caddyfile`, `../site/public`, and `${CODEX_PAYLOAD_HOST_PATH:-../codex-payload}`. TLS state persists in `caddy_data`/`caddy_config`. Requires `deploy/.env` with `CADDY_ADMIN_EMAIL`.
  - `game-api`: disabled unless you pass `--profile game`. Override `GAME_API_IMAGE` once the backend exists.
- `deploy/docker-compose.dev.yml` overlays local defaults: binds `Caddyfile.dev`, exposes `8080/8443`, and provides a `hashicorp/http-echo` placeholder for `--profile game`.
- `deploy/.env.example` documents every env knob (admin email, site bundle path, codex payload paths, optional game image).
- `scripts/deploy-example.sh` describes the human/bot deployment order: update git, `npm run verify:bundle`, `docker compose pull`, `docker compose up -d --remove-orphans [--profile game]`.

NixHQ assumptions:

- Repo lives at `/opt/impious/deploy`.
- All compose commands run inside `/opt/impious/deploy/deploy`.
- Codex artifacts are placed under `/opt/impious/codex-dist` (or whatever `CODEX_PAYLOAD_HOST_PATH` points to) before starting the stack.

### CI expectations

- `.github/workflows/dev-ci.yml` (dev branch + PRs):
  - Installs Node 20, runs `npm run verify:bundle`, `npm run check`, validates both compose variants (`CADDY_ADMIN_EMAIL` injected), validates both Caddyfiles, and ensures the Caddy Dockerfile still builds.
- `.github/workflows/main-build.yml` (main/tags):
  - Runs the same static-bundle verification before building/pushing the `deploy/Dockerfile.caddy` image to GHCR.
  - Optionally builds the future game API image if `game-api/Dockerfile` exists.

### Additional docs

- `README-dev.md` – local dev + staging instructions (`/etc/hosts`, compose profiles, etc.).
- `deploy/README.md` – ops-focused notes for running the stack on servers.
- `docs/stack-overview.md` – current/expected topology snapshot (kept up to date as infra evolves).
