# Frontend

The Impious landing page lives entirely under `site/` and ships as a static bundle that Caddy can serve directly. Vite handles development ergonomics (HMR, TypeScript transpilation) while the final output is a pre-rendered SPA in `site/public/`.

## Stack overview

- **Tooling:** Vite 5, TypeScript 5.4, Three.js 0.161.
- **Entry point:** `src/main.ts` wires together motion controls, parallax, the intersection observer, and the Three.js laurel scene.
- **Styling:** Modular CSS split across `src/styles/` (`base`, `components`, `layout`, `theme`, `animations`, `main`). The generated CSS lives in `public/assets/`.
- **Accessibility:** `modules/motion.ts` respects `prefers-reduced-motion` and toggles the heavier effects accordingly. Observer/parallax modules degrade gracefully when APIs are missing.

## Project structure

- `site/index.html` – Source HTML consumed by Vite during builds (includes module script pointing at `src/main.ts`).
- `site/src/`
  - `modules/` – Feature-level scripts (motion, parallax, `IntersectionObserver` reveal logic, `laurelScene` Three.js renderer).
  - `styles/` – Layered CSS imported from `src/main.ts`.
- `site/static/` – Copied verbatim into the final bundle (favicons, etc.).
- `site/public/` – Build output committed to git so servers and Docker builds do not need Node/NPM.
- `site/tsconfig.json` – Strict TS settings targeting modern browsers (ES2020 + DOM libs).
- `site/vite.config.ts` – Configures `static/` as the `publicDir`, outputs to `public/`, places hashed assets under `public/assets/`, and emits sourcemaps during `vite build --mode development`.

## Build & asset pipeline

1. Install dependencies once:

   ```sh
   cd site
   npm install
   ```

2. Run `npm run dev` for the Vite HMR server (defaults to `http://localhost:5173`). This path bypasses Docker entirely and is ideal for rapid iteration.

3. Run `npm run build` before deploying. Vite will:
   - Clean `site/public/` (`emptyOutDir: true`).
   - Copy `site/static/` into the root of `public/`.
   - Emit hashed JS/CSS assets under `public/assets/`.
   - Preserve the HTML marker `<!-- DEV-STAGING-MARKER: ... -->` so staging curl checks keep working.

4. Optionally run `npm run preview` to serve the optimized bundle locally for QA.

## Deployment and hosting flow

- `deploy/docker-compose*.yml` mount `../site/public` read-only into the Caddy container at `/srv/site`.
- `deploy/Dockerfile.caddy` bakes both the production `Caddyfile` and the `site/public` output into an image (`ghcr.io/<owner>/impious-caddy`) for environments that prefer image pulls to bind mounts.
- CI (`main-build.yml`) always builds from the committed `site/public`, so remember to include the latest build artifacts in your commits or the deployed site will lag behind source.
- Dev stacks expose `http://localhost:8080` and `https://impious.test:8443` (self-signed via `tls internal`). Production lives at `https://impious.io`.

## Testing checklist before pushing

- [ ] `npm run build` succeeds with no TypeScript errors (`npm run check`).
- [ ] Open `site/public/index.html` in a browser or `npm run preview` and ensure animations, parallax, and CTA form behaviors look correct.
- [ ] Run `docker compose -f deploy/docker-compose.yml config` and `docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml config` to catch accidental compose regressions touching the frontend mount paths.
