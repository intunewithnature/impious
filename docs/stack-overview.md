## Impious Stack Snapshot (dev branch · 2025-11-20)

This note captures the “before” state so we can track what changed as the stack becomes production-grade.

### Current reality
- **Compose services**
  - `deploy/docker-compose.yml` builds a bespoke Caddy image that bakes the Vite site during `docker build`, persists TLS state via `caddy_data`/`caddy_config`, and pre-creates a `codex_payload` volume (unused today). A `game-api` service exists only as an optional profile with no build context wired by default.
  - `deploy/docker-compose.dev.yml` reuses the same Dockerfile but swaps in `Caddyfile.dev`, publishes `8080/8443`, and bind-mounts `../site/public`. Local dev therefore relies on a manually refreshed build folder even though production ignores it.
- **Caddy routing**
  - Production `Caddyfile` serves `impious.io`, redirects `www.impious.io`, and blindly reverse-proxies `game.impious.io` to `game-api:3000` even though that container/profile is optional. `codex.imperiumsolis.com` is only referenced via a comment.
  - `Caddyfile.dev` already uses `.test` domains with `tls internal`, but likewise lacks an explicit codex block or any documentation about placeholder expectations.
- **Static assets and build flow**
  - `site/` is a Vite/Three.js SPA. Builds emit to `site/public/`, which is **gitignored** despite README language implying the bundle is committed. Docker images compile the site internally, so there is no guardrail preventing stale `site/public` output when compose dev binds it.
- **Integration assumptions**
  - Docs say servers clone the repo into `/opt/impious/deploy` and run compose from `/opt/impious/deploy/deploy`. No `.env` surfaces or secret expectations are documented. Codex + future game services are expected but not actually wired.

### Expected vs actual (gaps to fix)
| Expectation | Reality today | Notes |
| --- | --- | --- |
| All customer domains (impious, www, game, codex) defined & documented | Codex missing, game reverse proxy always on with no service | Need explicit site blocks with comments + placeholders |
| Stacks use bind-mounted artifacts so NixHQ can audit builds | Production bakes the site inside the image; dev relies on gitignored `site/public` | Make `site/public` canonical and enforce via CI |
| Clean integration points for codex/game | Only `codex_payload` volume stub; no path or docs | Define `/srv/codex` mount + document future artifacts |
| CI ensures builds + configs stay valid | Dev workflow validates compose/caddy and builds image, but no stale-build detection or Caddy syntax gating for codex | Add build verification, config checks, deploy script |
| Secrets/env contracts documented | None | Add `.env.example` & compose references |
| Easy non-prod awareness | No staging banner/version marker | Add Vite flag + DOM indicator |

This baseline should stay alongside future remediation so teams understand what changed and why.

---

## Remediated state (dev branch · 2025-11-20)

- **Routing**
  - Caddyfiles now explicitly cover `impious.io`, `www.impious.io`, `codex.imperiumsolis.com`, and `game.impious.io` (proxy placeholder) plus `.test` equivalents with `tls internal`.
  - Codex assets mount from `/srv/codex` with documented bind-mounts (`deploy/.env.example` + `codex-payload*` folders).
- **Compose**
  - Production compose uses stock `caddy:2.8-alpine`, bind-mounts committed `site/public`, and requires `CADDY_ADMIN_EMAIL`. Dev override mirrors ports, mounts, and ships a `hashicorp/http-echo` stub for `--profile game`.
  - Health checks ping the Caddy admin API; TLS data/config volumes remain identical to prod.
- **Site build pipeline**
  - `site/public` is tracked in git; `npm run verify:bundle` rebuilds + checks for diffs.
  - Builds inject `VITE_BUILD_VERSION` (git sha fallback) + `VITE_ENV` so staging banners render automatically.
- **CI & deploy workflow**
  - `dev-ci` / `main-build` now install Node, run `npm run verify:bundle`, type-check, and validate compose/Caddy before building images.
  - `scripts/deploy-example.sh` codifies the human/automation deploy order (git pull → verify bundle → compose pull/up).
- **Docs & env**
  - Root README + `deploy/.env.example` describe all integration points, domain ownership, environment knobs, and expectations for NixHQ placements.
