# Codex dev payload drop

This directory mirrors `codex-payload/` but is scoped to local/staging use. The dev compose file
mounts `${CODEX_PAYLOAD_DEV_PATH:-../codex-payload-dev}` into `/srv/codex` whenever you want to
preview codex assets on `codex.impious.test`.

Safe defaults:
- Keep placeholder HTML or a stub `index.html` if you simply need the domain to respond.
- Point `CODEX_PAYLOAD_DEV_PATH` at a different folder if you already have a separate codex checkout.
