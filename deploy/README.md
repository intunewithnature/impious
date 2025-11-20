### Impious deploy directory

This folder is copied as-is to `/opt/impious/deploy/deploy` on every server. The repository root is `/opt/impious/deploy`, so deployments run commands from this directory:

```sh
cd /opt/impious/deploy/deploy
```

Relative paths inside the compose files resolve against this location:

- `./Caddyfile*` → `/opt/impious/deploy/deploy/Caddyfile*`
- `../site/public` → `/opt/impious/deploy/site/public`

### Stack separation

- **Production (vps host)** uses `docker-compose.yml` together with `Caddyfile`. Those files reference the real domains (`impious.io`, etc.) and allow Caddy to obtain certificates automatically.
- **Staging / dev (test-server)** uses `docker-compose.dev.yml` together with `Caddyfile.dev`. That Caddyfile disables automatic HTTPS and serves everything over HTTP so the staging stack never interferes with the production certificates.
- Both stacks mount the same `../site/public` build output, so be sure to run `npm run build` in `site/` before updating either environment.

### Production stack (vps)

- Compose file: `docker-compose.yml`
- Service: `caddy-prod` proxy + static site with automatic HTTPS
- Volumes: `caddy_data` / `caddy_config` for cert state, plus the read-only `../site/public` mount
- Network: `impious-net`
- Typical refresh:

  ```sh
  docker compose pull
  docker compose up -d --remove-orphans
  ```

### Staging / dev stack (test-server)

- Compose file: `docker-compose.dev.yml`
- Service: `caddy-staging` serving the same static assets via HTTP on ports 80/443
- Caddy config: `Caddyfile.dev` with `auto_https off` and an optional commented block for future staging domains
- Volumes: `caddy_data_dev` / `caddy_config_dev` keep staging state separate from production
- NixOS `caddy-stack` on `test-server` is configured with `services.caddyStack.composeFile = "docker-compose.dev.yml"`, so running the service uses this dev compose file automatically.
- Manual run/refresh (works locally too):

  ```sh
  docker compose -f docker-compose.dev.yml pull
  docker compose -f docker-compose.dev.yml up -d --remove-orphans
  ```

You can confirm that you are hitting the dev stack by curling for the HTML marker:

```sh
curl -s http://localhost/ | grep DEV-STAGING-MARKER
```

### Quick reference

| Scenario | Command |
| --- | --- |
| Prod refresh (vps) | `cd deploy && docker compose up -d --remove-orphans` |
| Staging refresh (test-server) | `cd deploy && docker compose -f docker-compose.dev.yml up -d --remove-orphans` |

Keep all config changes in git so the servers can `git pull` plus the appropriate compose command to receive updates.
