## Impious dev workflow

The `dev` branch mirrors production (`/opt/impious/deploy`) while adding a few quality-of-life options for local iteration.

### Prerequisites

- Docker + Docker Compose plugin
- Node.js 20.x (for `site/`)
- Hostname overrides so `.test` domains resolve to loopback:

```
127.0.0.1 imperiumsolis.test www.imperiumsolis.test impious.test www.impious.test \
codex.impious.test codex.imperiumsolis.test game.impious.test game.imperiumsolis.test
```

### Landing page loop

1. Install deps:

   ```sh
   cd site
   npm ci
   ```

2. Develop with `npm run dev` (Vite @ 5173).

3. When you change `site/src`, rebuild and keep the committed bundle in sync:

   ```sh
   npm run build            # production env
   npm run build:staging    # optional: renders the staging banner locally
   npm run verify:bundle    # fails if public/ differs from what git tracks
   ```

4. Bring up the TLS-terminated stack from `deploy/` (site/public is already tracked, so no extra prep is required beyond the rebuild):

   ```sh
   cd deploy
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

- Caddy terminates HTTPS on both `:443` and `:8443`, serves `../site/public`, and exposes the codex SPA once you drop artifacts under `../codex-payload-dev`. Use the high ports (`8080/8443`) when you don’t want to bind privileged ports on your workstation.
- A bright banner appears on every non-production build so you can’t confuse staging/test bundles with prod.

### Game / API profile

- Compose already defines `game-api` with `profiles: ['game']`.
  - Base manifest expects an image at `${GAME_API_IMAGE}`.
  - Dev override swaps in a `hashicorp/http-echo` stub so `game.impious.test` / `game.imperiumsolis.test` resolve even without the real backend. It also sets `GAME_API_ENABLED=1` so Caddy forwards to that stub automatically; production keeps the JSON placeholder unless you set the variable yourself.
- To exercise the future backend:

  ```sh
  docker compose --profile game -f docker-compose.yml -f docker-compose.dev.yml up
  ```

  Override the `game-api` service via an additional compose file (mount your source, run `npm run dev`, etc.).

### Hot reload suggestions

- Mount `../game-api:/app` and set `working_dir: /app`.
- Use `env_file` for secrets/config.
- Publish `3000:3000` only in dev; production stays behind Caddy.

### Cleaning up

```sh
cd deploy
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Local TLS material persists in `caddy_data_dev` / `caddy_config_dev`. Remove the volumes if you need a clean CA (`docker volume rm caddy_data_dev caddy_config_dev`).
