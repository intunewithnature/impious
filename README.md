## Impious stack

Static neon-lore site today, social-deduction game tomorrow. This repository contains the Vite frontend, the Docker/Caddy stack that serves `impious.io`, and the scaffolding for the future `game-api`.

### Documentation

- [`docs/architecture.md`](docs/architecture.md) – services, networks, routing, and how prod/dev stacks differ.
- [`docs/frontend.md`](docs/frontend.md) – Vite pipeline, project layout, and testing checklist.
- [`docs/deployment.md`](docs/deployment.md) – how to build, refresh prod vs staging, and common troubleshooting steps.
- [`docs/ci-cd.md`](docs/ci-cd.md) – workflow triggers, image outputs, and branch expectations.
- [`docs/nixhq-integration.md`](docs/nixhq-integration.md) – assumptions the NixHQ-managed hosts rely on.
- [`README-dev.md`](README-dev.md) – local dev loop and `/etc/hosts` entries.

### TL;DR

- Vite source lives in `site/src/`; run `npm install && npm run dev` for instant feedback and `npm run build` before deploying. The build output (`site/public/`) is committed so servers do not need Node.
- Production Caddy runs from `deploy/docker-compose.yml`, serves `impious.io`, and issues certificates automatically. Dev/staging stacks layer `docker-compose.dev.yml` to shift ports to `8080/8443` and rely on `tls internal`.
- Future backend lives at `game-api/` (reserved service + port). Caddy already has a stub for `game.impious.io` / `game.impious.test`.
- GitHub Actions validate compose/Caddy configs on `dev`, publish a bundled Caddy+site image on `main`/tags, and run Cursor-based code reviews on PRs.

### Quick start

```sh
# Frontend iteration
cd site
npm install
npm run dev

# Production-style sanity check
npm run build
cd ../deploy
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Deployments are currently manual: SSH to the server, `git pull`, and run `docker compose up -d --remove-orphans`. See the docs linked above for the exact commands and health checks.
