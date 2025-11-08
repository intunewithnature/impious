#!/usr/bin/env bash
set -euo pipefail

# Change these if your GitHub name/repo differ
GH_USER="intunewithnature"
REPO="impious"
IMAGE_PREFIX="ghcr.io/${GH_USER}/${REPO}"

mkdir -p site lore-site game deploy .github/workflows

# --- Static site (served by Caddy)
cat > lore-site/Dockerfile <<'EOF'
FROM caddy:2-alpine
# Build context will be repository ROOT, so "site" is available here
COPY site /usr/share/caddy
EOF

cat > site/index.html <<'EOF'
<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Impious • Hello, web</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;display:grid;place-items:center;height:100vh;margin:0}
  .card{padding:2rem;border:1px solid #ddd;border-radius:14px;box-shadow:0 2px 20px rgba(0,0,0,.06);text-align:center}
  h1{margin:0 0 .5rem 0} code{padding:.2rem .4rem;background:#f5f5f5;border-radius:6px}
</style>
</head><body>
  <div class="card">
    <h1>Impious is alive.</h1>
    <p>CI/CD works if you can read this on <code>impious.io</code>.</p>
    <p>API check: <code>curl -s https://game.impious.io/health</code></p>
  </div>
</body></html>
EOF

# --- Super-tiny API (no deps)
cat > game/Dockerfile <<'EOF'
FROM node:20-alpine
WORKDIR /app
COPY server.js .
EXPOSE 8080
CMD ["node","server.js"]
EOF

cat > game/server.js <<'EOF'
const http = require('http');
const port = process.env.PORT || 8080;
http.createServer((req,res)=>{
  if (req.url === '/health') {
    res.writeHead(200, {'content-type':'application/json'});
    return res.end(JSON.stringify({ ok:true, ts: Date.now() }));
  }
  res.writeHead(200, {'content-type':'text/plain'});
  res.end('Impious API says hi.\n');
}).listen(port, ()=> console.log('API up on', port));
EOF

# --- Compose + Caddy proxy on the server
cat > deploy/docker-compose.yml <<'EOF'
version: "3.9"
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ["80:80","443:443"]
    environment:
      - CADDY_EMAIL=${CADDY_EMAIL}
      - LORE_DOMAIN=${LORE_DOMAIN}
      - GAME_DOMAIN=${GAME_DOMAIN}
      - WIKI_DOMAIN=${WIKI_DOMAIN}
    volumes:
      - caddy_data:/data
      - caddy_config:/config
      - ./Caddyfile:/etc/caddy/Caddyfile:ro

  lore:
    image: ${IMAGE_PREFIX}/lore-site:${TAG:-latest}
    restart: unless-stopped

  game:
    image: ${IMAGE_PREFIX}/game:${TAG:-latest}
    restart: unless-stopped
    expose: ["8080"]

volumes:
  caddy_data:
  caddy_config:
EOF

cat > deploy/Caddyfile <<'EOF'
{
  email {env.CADDY_EMAIL}
}

{env.LORE_DOMAIN} {
  encode zstd gzip
  reverse_proxy lore:80
}

{env.GAME_DOMAIN} {
  encode zstd gzip
  reverse_proxy game:8080
}
EOF

cat > deploy/.env.example <<'EOF'
# Copy this to /opt/impious/deploy/.env on the server
CADDY_EMAIL=you@example.com
LORE_DOMAIN=impious.io
GAME_DOMAIN=game.impious.io
WIKI_DOMAIN=wiki.impious.io
EOF

# --- GitHub Actions: build images to GHCR and deploy via SSH
cat > .github/workflows/build-and-deploy.yml <<'EOF'
name: build-and-deploy
on:
  push:
    branches: [ main ]
  workflow_dispatch:

# Dynamic prefix; resolves to ghcr.io/owner/repo
env:
  IMAGE_PREFIX: ghcr.io/${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      TAG: ${{ steps.settag.outputs.TAG }}
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ secrets.GHCR_USERNAME }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Build & push lore-site (context is repo root)
        run: |
          docker build -f lore-site/Dockerfile -t $IMAGE_PREFIX/lore-site:${{ github.sha }} .
          docker push $IMAGE_PREFIX/lore-site:${{ github.sha }}
          docker tag  $IMAGE_PREFIX/lore-site:${{ github.sha }} $IMAGE_PREFIX/lore-site:latest
          docker push $IMAGE_PREFIX/lore-site:latest

      - name: Build & push game
        run: |
          docker build -t $IMAGE_PREFIX/game:${{ github.sha }} ./game
          docker push $IMAGE_PREFIX/game:${{ github.sha }}
          docker tag  $IMAGE_PREFIX/game:${{ github.sha }} $IMAGE_PREFIX/game:latest
          docker push $IMAGE_PREFIX/game:latest

      - id: settag
        run: echo "TAG=${GITHUB_SHA}" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Upload deploy files
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          source: "deploy/*"
          target: "${{ secrets.DEPLOY_PATH }}"
          overwrite: true

      - name: Compose up on server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            set -euo pipefail
            cd "${{ secrets.DEPLOY_PATH }}"
            [ -f .env ] || { echo "Missing .env in $PWD"; exit 1; }
            export IMAGE_PREFIX="${{ env.IMAGE_PREFIX }}"
            export TAG="${{ needs.build.outputs.TAG }}"
            docker compose pull || true
            docker compose up -d --remove-orphans
            docker system prune -f || true
EOF

# --- .gitignore
cat > .gitignore <<'EOF'
node_modules
npm-debug.log*
yarn.lock
pnpm-lock.yaml
.DS_Store
.env
EOF

echo "[*] Scaffold created."


