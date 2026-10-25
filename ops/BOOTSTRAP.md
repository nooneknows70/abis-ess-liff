# abis-ess-liff Cross-Window Bootstrap

## Mandatory read order

1. Central registry: `nooneknows70/abis-release-control/ops/ABIS_MULTI_REPO_SSOT.json`
2. This repo: `ops/CURRENT_STATE.md`
3. This repo: `ops/PROJECT_STATE.json`
4. newest `ops/handoff/YYYY-MM-DD.md`
5. `ABIS_ESS_RELEASE_MANIFEST.json`
6. central `ABIS_RELEASE_FLOW_V2_FROZEN.md`

## Authority

- Git `main` is source authority for this repository.
- `ABIS_ESS_RELEASE_MANIFEST.json` is this subsystem's release authority.
- Central release-control records cross-repo state but does not override this subsystem manifest.
- Chat transcripts are context, not authority.
- Do not store secrets, tokens, credentials, or employee personal data in `ops/`.

## Update triggers

Update local SSOT after:
- release / rollback;
- PASS/HOLD that changes next action;
- policy/authority change;
- source/deployment drift;
- business-data mutation owned by this subsystem;
- cross-repo compatibility change.
