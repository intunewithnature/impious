# NixHQ Integration

Impious runs on NixOS hosts that NixHQ provisions. Docker itself is managed by Nix, but applications are shipped by cloning this repository to a fixed path and invoking compose. This document captures the assumptions Nix modules must satisfy so the stack works consistently across machines.

## Filesystem layout

- Repository root: `/opt/impious/deploy`
- Runtime directory: `/opt/impious/deploy/deploy`
  - `deploy/docker-compose.yml` (production stack)
  - `deploy/docker-compose.dev.yml` (dev/staging overrides)
  - `deploy/Caddyfile` (production TLS + routing)
  - `deploy/Caddyfile.dev` (dev/staging TLS + routing)
  - `../site/public` (resolved to `/opt/impious/deploy/site/public`)
- State volumes (Docker named volumes on each host):
  - Production: `caddy_data`, `caddy_config`
  - Dev/Staging: `caddy_data_dev`, `caddy_config_dev`

## Service hooks for Nix

- Expose a systemd unit (e.g., `caddy-stack.service`) whose `ExecStart` runs `docker compose` from `/opt/impious/deploy/deploy`.
- On staging/test machines, point the unit at `docker-compose.dev.yml` by default:

  ```nix
  services.caddyStack = {
    composeFile = "docker-compose.dev.yml";
    workingDir = "/opt/impious/deploy/deploy";
  };
  ```

- Production units omit the `composeFile` override so they use `docker-compose.yml`.
- Grant the service user read access to `/opt/impious/deploy/site/public` (read-only bind mount).

## Environment variables & secrets

- The stack currently relies only on filesystem configuration—no `.env` file or secrets are required to boot.
- Optional: set `CADDY_EMAIL` or similar if you prefer templating the `email` address in `Caddyfile`. Right now the value is hard-coded and should be edited directly in git to avoid drift.
- GitHub Actions require `CURSOR_API_KEY` (for reviews) and the default `GITHUB_TOKEN`, but those stay in GitHub and are not needed on Nix hosts.

## Compose selection

- **Production hosts:** run `docker compose up -d` (implicitly uses `docker-compose.yml`).
- **Dev / staging hosts:** run `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` so overrides take effect (ports, TLS, optional hostnames). On Nix, the `composeFile = "docker-compose.dev.yml"` shortcut achieves the same result.
- Both environments share the `impious-net` Docker network name to simplify cross-host parity.

## TLS behavior

- Production (`deploy/Caddyfile`):
  - Automatic HTTP→HTTPS with real certificates via Let’s Encrypt.
  - `www.impious.io` redirects to the apex domain.
- Dev/Staging (`deploy/Caddyfile.dev`):
  - Global `auto_https off` so staging never attempts Let’s Encrypt.
  - Loopback domains (`impious.test`, `www.impious.test`, `game.impious.test`, `localhost`) call `tls internal`, generating self-signed certs trusted by Caddy only.
  - Optional `http://staging.impious.io` / `http://stage.impious.io` hosts ride plain HTTP to avoid cert conflicts.
  - `/healthz` endpoint and `X-Impious-Env: dev` header make it simple for Nix healthchecks to verify the stack.

## Production vs staging summary

| Aspect | Production | Staging / Dev |
| --- | --- | --- |
| Compose file | `deploy/docker-compose.yml` | `deploy/docker-compose.yml` + `deploy/docker-compose.dev.yml` (or Nix `composeFile = "docker-compose.dev.yml"`). |
| Host ports | `80`, `443`, `443/udp` | `8080`, `8443`, `8443/udp`. |
| TLS | Let’s Encrypt certificates, automatic renewal. | Self-signed via `tls internal`; `auto_https` disabled globally. |
| Domains | `impious.io`, `www.impious.io`, reserved `game.impious.io`. | `impious.test`, `www.impious.test`, `game.impious.test`, optional `staging.impious.io`. |
| Volumes | `caddy_data`, `caddy_config`. | `caddy_data_dev`, `caddy_config_dev`. |
| Game/API routing | Commented stub waiting for containerization. | `game.impious.test` responds with a stub string until `game-api` is online. |

Keep these differences encoded in git; avoid manual edits on Nix hosts so a simple `git pull && systemctl restart caddy-stack` fully reconciles drift.
