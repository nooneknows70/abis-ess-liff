# ABIS ESS LLEX G5 — Offline LIFF contract candidate (2026-10-28)

**Gate:** `G5_LIFF_SYNTHETIC_CONTRACT_SOURCE_PASS__MOUNT_AND_PROVIDER_HOLD`.

Source Owner Q1=A authorized only separate isolated development branches, offline module, one batch synthetic Node tests and Draft PR review. G5 `features/longleave-exec-v1/ABIS_LLEX_G5_LIFF_CONTRACT_OFFLINE.js` Git Blob `388801ac43788e0a836a579ede61d1f02fbd1ef1`, SHA256 `718d123bf1212c5a65eeae11d82ea2fa83b6291164a5f85657271b25668765ec`. Read back byte-identical to locally tested source. Original `features/longleave-exec-v1/approval-panel.js` blob `a4d92d7ad40f1a9e301462023bd5c17d96add191` is **UNCHANGED**, retains `ACTIVE=false`, not mounted or network-bound.

## Contract

- `offlineUnavailable(status)`: always returns `active=false`. This file is **not** an activation mechanism.
- `makeActionFixture(action,payload,readModel,nonce)`: refuses non-fixture and provider-bound input; command requires a SYNTHETIC-only nonce, expected version, groupId, sourceEpoch, groupHash and an action already listed in mock server allowedActions; supervisor handover and executive reasons are checked locally for test cases only. Amendments cannot be sent: `AMENDMENT_REQUIRES_SERVER_VALIDATED_SNAPSHOT_HOLD`.
- `roleView(snapshot,role)`: synthetic role-sensitive redaction of history and fields; never treated as real server authorization. Employee history/private reason not surfaced.
- No actual LIFF mount, Google Sheets / Apps Script / LINE / HTTP, DOM operations, Provider user/role lookup or Production changes.

## Cross-Repo synthetic evidence

Backend `nooneknows70/abis-ess-backend`, feature branch `feature/llex-g5-offline-adapter-20261028`, contains copy of **this exact blob** under `tests/fixtures/ABIS_LLEX_G5_LIFF_CONTRACT_OFFLINE.js` and an actual local Node 22.16.0 `node --test tests/test-g5-offline.test.cjs` run with **83 PASS / 83 total / 0 fail**. The 83 includes Backend and LIFF fixture scenarios; separate Provider integration and released UI E2E were **not executed**. All published G5 code + test blobs independently compared to local tested blobs. Details in Backend `docs/leave/ABIS_LLEX_G5_OFFLINE_ADAPTER_ONE_BATCH_20261028.md`.

## Status and next gate

`G5_SYNTHETIC_CLOSED_PASS__G6_POLICY_COMPAT_DESIGN_HOLD` for the **offline candidate only**. G2 CLOSED PASS is a separate 22/22 Apps Script Stage synthetic runtime test and may not be conflated with G5 83/83 Node. Frozen G3/G4 schemas and source-only docs remain intact. Backend Production @169 and LIFF released V153 unchanged. Cross-repo central/LIFF machine-state sync previously blocked, `SSOT_SYNC_PARTIAL_HOLD`; no bypass or retry of blocked state operation. No main merge or Provider binding authorized.
