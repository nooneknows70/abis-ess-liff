# abis-ess-liff Cross-Window Bootstrap

## Mandatory read order

1. Frozen policy: `nooneknows70/abis-release-control/ABIS_MULTI_REPO_CROSS_WINDOW_SSOT_POLICY_FROZEN.md`
2. Central registry: `nooneknows70/abis-release-control/ops/ABIS_MULTI_REPO_SSOT.json`
4. This repo: `ops/CURRENT_STATE.md`
3. This repo: `ops/PROJECT_STATE.json`
5. newest `ops/handoff/YYYY-MM-DD.md`
6. `ABIS_ESS_RELEASE_MANIFEST.json`
7. central `ABIS_RELEASE_FLOW_V2_FROZEN.md`

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


## Frozen policy enforcement

This frozen policy applies to all ABIS employee-system conversations, including topics without a dedicated repository. If local state conflicts with the central frozen policy or registry, stop Production mutation and record a HOLD/drift instead of guessing.
