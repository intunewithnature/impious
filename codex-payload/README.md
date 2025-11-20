# Codex payload drop

`deploy/docker-compose.yml` bind-mounts this directory into `/srv/codex` so Caddy can serve
`codex.imperiumsolis.com`. Leave the folder empty in git; CI/NixHQ pipelines can populate it
with the static export of the codex/codex-imperium repo prior to running `docker compose up`.

Expected shape (example, not enforced):

```
codex-payload/
└── index.html
└── assets/
    └── ...
```

If you do not have codex assets yet, the domain will still respond but only with directory
listings. Fill this folder (or override `CODEX_PAYLOAD_HOST_PATH` in `deploy/.env`) during deploys.
