### Impious deploy directory

This folder is meant to be copied as-is to `/opt/impious/deploy/deploy` on the production host. The repository root is `/opt/impious/deploy`, so any time you run Docker commands you should:

```sh
cd /opt/impious/deploy/deploy
docker compose up -d
```

Relative paths inside the compose files resolve against this directory:

- `./Caddyfile` → `/opt/impious/deploy/deploy/Caddyfile`
- `../site/public` → `/opt/impious/deploy/site/public`

### Production stack

- Compose file: `docker-compose.yml`
- Services: `caddy` (reverse proxy + static lore site)
- Networks: `impious-net` (named to keep future services consistent)
- Volumes:
  - `caddy_data` and `caddy_config` store certificates/state
  - Static site is mounted read-only from `../site/public` (ensure `npm run build` has been executed in `site/` so assets are current)
- Commands:
  - `docker compose pull`
  - `docker compose up -d --remove-orphans`

### Local development stack

- Compose override: `docker-compose.dev.yml`
- Run with `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`
- Differences:
  - Ports map to `8080/8443` on the host to avoid privileged ports
  - Uses `Caddyfile.dev` for domains you control locally
  - Named network `impious-dev-net` keeps it isolated from prod resources

### Quick reference

| Scenario | Command |
| --- | --- |
| Prod refresh | `cd deploy && docker compose pull && docker compose up -d --remove-orphans` |
| Local dev | `cd deploy && docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build` |

Keep all config changes in git so the server can be updated through a simple pull + compose run.
