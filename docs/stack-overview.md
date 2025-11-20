## Impious Stack Snapshot (dev branch · 2025-11-20)

### Current reality
- **Compose services**
  - `deploy/docker-compose.yml` runs stock `caddy:2.8-alpine`, bind-mounts `site/public` and the codex payload directories, persists TLS state in `caddy_data`/`caddy_config`, and keeps the optional `game-api` service behind `profiles: ['game']`. The Caddy container receives `GAME_API_ENABLED` (default `0`) so the public `game.imperiumsolis.com` host stays on a JSON stub until operators flip the switch.
  - `deploy/docker-compose.dev.yml` layers on the same bind mounts, swaps in `Caddyfile.dev`, keeps 80/443 exposed while adding 8080/8443 for non-privileged local testing, and ships a `hashicorp/http-echo` stub for the `game-api` profile. The override defaults `GAME_API_ENABLED` to `1` so dev traffic exercises the stub automatically.
- **Caddy routing**
  - Production `deploy/Caddyfile` serves `imperiumsolis.org` (site bundle at `/srv/site`), redirects `www` → apex, serves `codex.imperiumsolis.com` from `/srv/codex` with SPA fallback, and keeps `game.imperiumsolis.com` on the JSON stub until `GAME_API_ENABLED=1` + `--profile game` enable the proxy to `game-api:3000`.
  - `deploy/Caddyfile.dev` mirrors each site block for `.test` domains, uses `tls internal`, disables auto-redirects so HTTP curls return content, and matches the same SPA fallback behaviour.
- **Static artifacts**
  - `site/public` is tracked and treated as the deployable artifact. Codex payloads drop into `codex-payload/` (prod) or `codex-payload-dev/` (dev) and are mounted read-only into `/srv/codex`.
  - Game traffic remains stubbed until operators opt in; no hidden assets exist inside the container image.
- **Environment & docs**
  - `deploy/.env.example` documents `CADDY_ADMIN_EMAIL`, path overrides, `GAME_API_IMAGE`, and the new `GAME_API_ENABLED` flag.
  - `README.md`, `README-dev.md`, and `deploy/README.md` cover domain mappings, curl spot-checks (HTTP + HTTPS), and expectations for ACME success.

### Guardrails & automation
- CI workflows install Node 20, run `npm run verify:bundle`, run `npm run check`, validate both compose files, and `caddy validate` both Caddyfiles via the upstream container image.
- `scripts/deploy-example.sh` codifies “git pull → verify bundle → docker compose up -d” so operators don’t drift from the documented process.
- Dev builds embed `VITE_BUILD_VERSION`/`VITE_ENV`, and the staging banner keeps non-prod deployments obvious.

### Future-facing hooks
- Codex SPA fallback works for deep links via `try_files … /index.html`.
- The JSON stub on `game.imperiumsolis.com` ensures the public domain is safe today, while `GAME_API_ENABLED=1` + `--profile game` cleanly bridge to the future multiplayer backend once it is available.
