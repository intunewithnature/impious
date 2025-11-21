# Deployment

Impious servers run Docker directly on NixOS hosts managed by NixHQ. The git checkout at `/opt/impious/deploy` contains this repository, and the `deploy/` subdirectory is mirrored to `/opt/impious/deploy/deploy` for compose execution. Keep runtime changes in git so every host can `git pull` + `docker compose up -d` to converge.

## Build the site artifacts

1. Install dependencies if needed:

   ```sh
   cd site
   npm install
   ```

2. Build the production bundle:

   ```sh
   npm run build
   ```

   - Output lands in `site/public/` (committed to git).
   - Re-run whenever `site/src/` or `site/static/` changes. CI and Docker builds assume `public/` is up to date.

3. Commit the updated `site/public/**` files alongside the source changes so servers can deploy without Node.

## Refreshing environments

### Production (VPS running impious.io)

```sh
cd /opt/impious/deploy
git pull origin main
cd deploy
docker compose up -d --remove-orphans
```

- Uses `deploy/docker-compose.yml`.
- Publishes ports `80/443/443-udp` on the host.
- Caddy issues/renews certificates for `impious.io` and `www.impious.io` automatically.

### Staging / Dev server (test-server)

```sh
cd /opt/impious/deploy
git pull origin main   # or dev, depending on the workflow
cd deploy
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --remove-orphans
```

- Layers `docker-compose.dev.yml` on top of production defaults so only the overrides (ports, TLS, staging hostnames) apply.
- Exposes HTTP on `localhost:8080` and HTTPS on `impious.test:8443` (`tls internal`).
- `curl -k https://impious.test:8443/healthz` returns `impious-dev-ok` and the HTML response includes `DEV-STAGING-MARKER` for sanity checks.

### Local parity checks

1. `npm run build` to refresh `site/public`.
2. `docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml up`.
3. Browse `https://impious.test:8443` after adding `impious.test` host entries (`README-dev.md`).

## Interaction with NixHQ

- Servers are provisioned so that `/opt/impious/deploy/deploy` is copied verbatim from git. Relative mounts inside compose (e.g., `../site/public`) resolve against this directory.
- NixOS modules (e.g., `caddy-stack` unit on the test server) point at `deploy/docker-compose.dev.yml`, so restarting the service automatically uses the dev overrides.
- Keep volume names stable (`caddy_data`, `caddy_config`) so Nix-managed backups and secrets stay valid across compose refreshes.

## Troubleshooting Caddy & compose

- Validate configs before pushing:

  ```sh
  docker compose -f deploy/docker-compose.yml config
  docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml config
  docker run --rm -v "$PWD/deploy:/work" -w /work caddy:2-alpine caddy validate --config /work/Caddyfile
  docker run --rm -v "$PWD/deploy:/work" -w /work caddy:2-alpine caddy validate --config /work/Caddyfile.dev
  ```

- Inspect runtime state:

  ```sh
  cd deploy
  docker compose ps
  docker compose logs -f caddy
  ```

- Force a config reload without recreating the container:

  ```sh
  docker exec caddy-prod caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  ```

- If certificates fail on staging, confirm you are hitting the dev stack (look for the `X-Impious-Env: dev` header) and that `Caddyfile.dev` still has `tls internal` for the affected hostnames.
