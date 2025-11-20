## Impious stack

Impious runs as a static-first lore site (`impious.io`) with headroom for a multiplayer Werewolf experience on `game.impious.io`. Everything — landing code, infra manifests, and Docker build rules — lives in this repository so GitOps stays source-of-truth.

### Repository layout

- `site/`: Vite + TypeScript + Three.js landing page (componentized under `src/components/`, motion logic in `src/modules/`, and themeable styles in `src/styles/`). Build artifacts land in `site/public/` but are ignored by git.
- `deploy/`: Docker + Caddy stack with production compose file, dev override, and the multi-stage `Dockerfile.caddy`.

### Landing page workflow (`site/`)

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dep lock cleanly (Node 20+) |
| `npm run dev` | Vite dev server (port 5173) with hot reload + WebGL scene |
| `npm run build` | Generate static assets inside `site/public/` (gitignored) |
| `npm run preview` | Preview the production bundle locally |
| `npm run check` | TypeScript type/lint pass (no emit) |

Highlights:

- Components render at runtime via `src/components/sections.ts`, keeping hero/lore/game content as structured data in `src/components/content.ts`.
- Parallax, glitch, and WebGL “chrome” effects all respect `prefers-reduced-motion` via the motion module.
- `site/public/` is generated every build. Docker images now build the bundle internally, so you only need the folder when mounting into the dev compose stack.

### Docker + deployment

- `deploy/docker-compose.yml` is the production truth. The `caddy` service either builds or pulls `ghcr.io/intunewithnature/impious-site:${IMAGE_TAG:-dev}` (multi-stage Node → Caddy). TLS state persists in the `caddy_data`/`caddy_config` volumes, and `/srv/codex` is pre-mounted via `codex_payload` for future lore drops.
- `game-api` is scaffolded with `profiles: ['game']` so it only launches when you pass `--profile game`. Expect it to run on `game-api:3000` behind Caddy.
- `deploy/docker-compose.dev.yml` overlays dev-only tweaks: ports `8080/8443`, local `Caddyfile.dev`, and a bind mount to `../site/public` for quick iterations. It also carries the same `game-api` profile.

Typical commands (run from `deploy/`):

```sh
# production refresh
IMAGE_TAG=dev docker compose up -d --build --remove-orphans

# dev stack after npm run build
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Domains & routing

| Domain | Behavior |
| --- | --- |
| `impious.io` | Serves the static SPA bundle from `/srv/site` |
| `www.impious.io` | Redirects to `https://impious.io` |
| `game.impious.io` | Reverse proxies `game-api:3000` (profile gated until real service ships) |
| `impious.test` | Dev/staging mirror with `tls internal` certificates |

Both Caddyfiles carry a codex hook comment: `# Add codex service here, route codex.imperiumsolis.com { root * /srv/codex }`. Mount `/srv/codex` (via `codex_payload` or a bind) before enabling that vhost.

### Frontend + infra invariants

- All ingress terminates inside the Caddy container. No service should publish host ports directly.
- Runtime config lives in git. Servers run `git pull` + `docker compose up -d --remove-orphans` — no snowflakes.
- Repo lives at `/opt/impious/deploy`; compose commands run inside `/opt/impious/deploy/deploy`.
- `site/public/` must be up to date before bringing up the dev stack, but production builds no longer depend on a pre-built folder thanks to the multi-stage Dockerfile.
- The `dev` branch can ship experiments, but `main` remains the production build line.

Read `README-dev.md` for the hands-on dev loop (Vite + compose) and `deploy/README.md` for ops notes specific to that directory.
