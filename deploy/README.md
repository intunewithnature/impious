### Impious deploy directory

This folder is mirrored to `/opt/impious/deploy/deploy` on each server. Repository root remains `/opt/impious/deploy`, so all commands assume:

```sh
cd /opt/impious/deploy/deploy
```

Key paths relative to this directory:

- `./Caddyfile*` → mounted directly into the Caddy container.
- `../site/public` → committed static bundle bound to `/srv/site`.
- `../codex-payload*` → drop-in folders for codex builds (override via `.env` if needed).

### Environment & bootstrap

1. Copy `deploy/.env.example` to `deploy/.env`.
2. Fill in `CADDY_ADMIN_EMAIL` with a deliverable address before running production compose. Dev/staging can keep the placeholder `admin@impious.test`.
3. Optional overrides (paths + game API image) can stay commented unless your server layout differs.

| Context | Minimum env to edit | Notes |
| --- | --- | --- |
| Dev / staging | none | Defaults keep everything relative to the repo. |
| Production | `CADDY_ADMIN_EMAIL` | Required so ACME can reach you. Override the path variables if the repo layout changes. |

Run `deploy/bootstrap-server.sh` on fresh servers to:

- ensure the repo really lives at `/opt/impious`,
- seed `deploy/.env` from the example if it’s missing, and
- pre-create `codex-payload*` directories so bind mounts never fail.

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
| Dev/staging stack | `cd deploy && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` |
| Dev/staging + game stub | `cd deploy && docker compose --profile game -f docker-compose.yml -f docker-compose.dev.yml up -d` |

> Tip: use `scripts/deploy-example.sh` from repo root for the full “git pull → verify bundle → compose up” flow.

### Expectations

- Never edit configs on the server. Apply changes in git, then `git pull && docker compose up -d --remove-orphans`.
- Keep `site/public` up to date with `site/src` (`npm run verify:bundle` handles the guardrail and CI enforces it).
- Drop codex artifacts into `${CODEX_PAYLOAD_HOST_PATH}` before enabling/announcing the domain.

### Deploy ergonomics

- `.env.example` is tracked with documented defaults so new clones never guess required variables.
- `deploy/bootstrap-server.sh` creates codex payload directories and seeds environment files non-destructively.
- `docker-compose.yml` now tolerates missing `CADDY_ADMIN_EMAIL` during dev/staging while still encouraging production overrides.