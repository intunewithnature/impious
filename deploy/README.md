## Deploy directory

This folder mirrors `/opt/impious/deploy` on the production VPS. Paths inside the compose file resolve relative to that directory, so:

- `./Caddyfile` → `/opt/impious/deploy/Caddyfile`
- `../site/public` → `/opt/impious/site/public` (built ahead of time on the host)

## Services in production

- **caddy** (`caddy-prod` container)  
  Serves `impious.io` from `/srv/site`, terminates TLS with ACME, applies SPA fallback, and proxies `/enlist*` plus `/healthz` to the API.

- **enlist-api** (`deploy-enlist-api-1`)  
  Node/Express email capture API with a SQLite datastore mounted at `enlist_data:/data`. Health endpoint lives at `/healthz`.

Both services run on the shared `impious-net` network and cap container logs via the json-file driver to keep `/var/lib/docker` under control.

## Configuration (.env)

`docker compose` in this directory loads `.env` automatically. We pin the API image with `ENLIST_API_TAG`, which matches a Git commit SHA (or a manual override) and maps to `ghcr.io/intunewithnature/impious-enlist-api:<tag>`.

```
ENLIST_API_TAG=REPLACE_WITH_SHA_OR_VERSION
```

Copy `deploy/.env.example` to `.env` and fill in the desired tag before running compose locally or on the VPS.

## Deployment workflow

- **Manual steps**
  1. `cd /opt/impious/deploy`
  2. Update the git working tree (or copy the repo) so that Caddy, compose, and site assets match the desired revision.
  3. Edit `.env` so `ENLIST_API_TAG` points to the image you want (`git rev-parse HEAD` works well).
  4. Run:
     ```sh
     docker compose pull
     docker compose up -d --remove-orphans
     ```

- **GitHub Actions (`.github/workflows/main-build.yml`)**
  - Builds `email-api/Dockerfile` on every push to `main`.
  - Pushes the image to `ghcr.io/intunewithnature/impious-enlist-api` tagged with the commit SHA (and `latest`).
  - SSHes into the VPS using `PROD_SSH_HOST/USER/KEY` secrets, writes `/opt/impious/deploy/.env` with `ENLIST_API_TAG=${{ github.sha }}`, then runs `docker compose pull && docker compose up -d`.

This keeps production tied to an immutable image per commit and gives us an audit trail of what is running.

## Rollbacks

1. Decide which image tag (previous commit SHA) you want.
2. Update `/opt/impious/deploy/.env` to that value:
   ```sh
   echo "ENLIST_API_TAG=<old-sha>" | sudo tee /opt/impious/deploy/.env
   ```
3. Re-run `docker compose pull && docker compose up -d` in `/opt/impious/deploy`.

Because images live in GHCR, the rollback is instant and does not require rebuilding.

## Dev / staging notes

`docker-compose.dev.yml` + `Caddyfile.dev` remain available for local/staging previews of the static site only. They intentionally omit the enlist API and do **not** consume `.env`. Keeping this separation prevents accidental interference with production certificates. If you use the dev stack, build the site (`npm run build` in `site/`) beforehand so that `../site/public` contains the latest assets.
