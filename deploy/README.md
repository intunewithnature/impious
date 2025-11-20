### Impious deploy directory

This folder is mirrored to `/opt/impious/deploy/deploy` on each server. Repository root remains `/opt/impious/deploy`, so all commands assume:

```sh
cd /opt/impious/deploy/deploy
```

Key paths relative to this directory:

- `./Caddyfile*` → mounted directly into the Caddy container.
- `../site/public` → committed static bundle bound to `/srv/site`.
- `../codex-payload*` → drop-in folders for codex builds (override via `.env` if needed).

### Environment + secrets

- Copy `deploy/.env.example` to `deploy/.env` before running compose.
- Required variables:
  - `CADDY_ADMIN_EMAIL` — ACME contact for impious.io certificates.
  - `SITE_BUNDLE_PATH` — path to the tracked static bundle (default `../site/public`).
  - `CODEX_PAYLOAD_HOST_PATH` / `CODEX_PAYLOAD_DEV_PATH` — host directories that contain `codex.imperiumsolis.com` assets (defaults point at `../codex-payload*`).
  - `GAME_API_IMAGE` — optional override for the future multiplayer backend.

### Stack separation

- **Production** (`docker-compose.yml`)
  - `caddy` service uses stock `caddy:2.8-alpine`, mounts the repo Caddyfile, committed static bundle, codex payload, and TLS state volumes (`caddy_data`, `caddy_config`).
  - Health check hits the admin API (`http://127.0.0.1:2019/config/`).
  - `game-api` service exists behind `profiles: ['game']`; enable when the backend is real.
- **Dev / staging** (`docker-compose.yml` + `docker-compose.dev.yml`)
  - Reuses the same bind mounts but swaps in `Caddyfile.dev`, exposes `8080/8443`, and keeps TLS data in `caddy_data_dev` / `caddy_config_dev`.
  - Provides a `hashicorp/http-echo` stub for `game-api` so `game.impious.test` resolves without a backend.

### Typical commands

| Scenario | Command |
| --- | --- |
| Prod refresh | `cd deploy && docker compose up -d --remove-orphans` |
| Prod refresh with game profile | `cd deploy && docker compose --profile game up -d --remove-orphans` |
| Dev/staging stack | `cd deploy && docker compose -f docker-compose.yml -f docker-compose.dev.yml up` |
| Dev/staging + game stub | `cd deploy && docker compose --profile game -f docker-compose.yml -f docker-compose.dev.yml up` |

> Tip: use `scripts/deploy-example.sh` from repo root for the full “git pull → verify bundle → compose up” flow.

### Expectations

- Never edit configs on the server. Apply changes in git, then `git pull && docker compose up -d --remove-orphans`.
- Keep `site/public` up to date with `site/src` (`npm run verify:bundle` handles the guardrail and CI enforces it).
- Drop codex artifacts into `${CODEX_PAYLOAD_HOST_PATH}` before enabling/announcing the domain.