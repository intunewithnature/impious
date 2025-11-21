# CI / CD

GitHub Actions coordinate validation, image publishing, and automated reviews. Nothing deploys automatically yet; servers still pull from git manually, but the workflows guarantee the compose/Caddy configs and Docker builds stay healthy.

## Workflow matrix

| Workflow | File | Trigger | Purpose |
| --- | --- | --- | --- |
| Dev CI | `.github/workflows/dev-ci.yml` | `push` / `pull_request` on `dev` | Fast validation of compose manifests, both Caddyfiles, and the site image build. |
| Main build & publish | `.github/workflows/main-build.yml` | `push` to `main`, any `v*` tag, manual `workflow_dispatch` | Builds and pushes the production-ready Caddy+site image (and, conditionally, the future `game-api` image) to GHCR. |
| Cursor Code Review | `.github/workflows/cursor-code-review.yml` | PR events (opened, sync, reopened, ready) | Runs Cursor’s reviewer bot on non-draft PRs for actionable feedback. |

## dev-ci.yml

Steps executed on every `dev` change:

1. `docker compose -f deploy/docker-compose.yml config` to ensure the production compose file parses.
2. `docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml config` to confirm dev overrides still merge cleanly.
3. Two `caddy validate` invocations inside the upstream `caddy:2-alpine` container (one for `Caddyfile`, one for `Caddyfile.dev`).
4. `docker build -f deploy/Dockerfile.caddy .` to catch regressions in the static-site image.

Artifacts are not pushed; failures block merges into `dev`.

## main-build.yml

Runs on:

- Every `push` to `main`.
- Annotated tags prefixed with `v`.
- Manual `workflow_dispatch`.

Behavior:

1. Builds the `deploy/Dockerfile.caddy` image via Buildx for `linux/amd64`.
2. Pushes the result to GHCR using two tags:
   - `ghcr.io/<owner>/impious-caddy:${{ github.sha }}` (immutable).
   - `ghcr.io/<owner>/impious-caddy:latest`.
3. If `game-api/Dockerfile` exists, a second job builds `ghcr.io/<owner>/impious-game-api` with the same tag scheme.

Secrets required: none beyond the default `GITHUB_TOKEN` for GHCR pushes.

## cursor-code-review.yml

- Fires on qualifying PR events whenever the PR is not a draft.
- Checks out the PR head commit, installs `cursor-agent`, and runs a focused review prompt (“strict but concise” check for outages/security issues).
- Requires `CURSOR_API_KEY` and leverages `GITHUB_TOKEN` for comment posting.

## Branch expectations

- `dev` is for experimentation; CI only verifies configs and buildability.
- `main` is production-bound; merging to `main` immediately publishes the latest static-site container, so ensure `site/public` is rebuilt before merging.
- Tags (`v*`) give you immutable image references that map 1:1 with release notes or deployment playbooks.
