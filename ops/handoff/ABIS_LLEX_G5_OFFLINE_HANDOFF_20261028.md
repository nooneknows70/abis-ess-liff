# ABIS ESS Long Leave G5 — handoff, 2026-10-28

## Verified gate
`G5_OFFLINE_CONTRACT_NODE_83_83_PASS__G6_G1_POLICY_COMPAT_HOLD`

Source Owner selected **G5 Q1=A**: build pure offline Backend + LIFF contract and run synthetic tests **in one batch**, using independent feature branches, without any live Provider/production changes. G2 dedicated Apps Script Stage synthetic 22/22 PASS separately. G3 source static design completed; G4 Q1–Q3 verified **168 exact header labels** across five sheets by bounded first-row reads, **no employee/leave data rows**.

## GitHub new isolated code and test pins
- Backend branch `feature/llex-g5-offline-adapter-20261028`, Draft PR **#105**, base `feature/leave-exec-v1-q1-q17-20261027`, DRAFT UNMERGED.
  - `src/ABIS_LLEX_G5_OFFLINE_ADAPTER.js`, blob `1b654b8e2d29d7bbeb311c798090258007cf14f8`.
  - `tests/test-g5-offline.test.cjs`, blob `49b6e5aa7e99c180add7b22e121cbe45883e0dd8`.
  - `tests/fixtures/ABIS_LLEX_G5_LIFF_CONTRACT_OFFLINE.js`, blob `388801ac43788e0a836a579ede61d1f02fbd1ef1`.
  - Details: `docs/leave/ABIS_LLEX_G5_OFFLINE_ADAPTER_ONE_BATCH_20261028.md`.
- LIFF branch `feature/llex-g5-offline-adapter-20261028`, Draft PR **#33**, same long-leave feature base, DRAFT UNMERGED.
  - `features/longleave-exec-v1/ABIS_LLEX_G5_LIFF_CONTRACT_OFFLINE.js`, blob `388801ac43788e0a836a579ede61d1f02fbd1ef1`.
  - Details: `docs/leave/ABIS_LLEX_G5_LIFF_OFFLINE_CONTRACT_20261028.md`.
- Existing G1 policy, mapping and group plan blobs were read back unchanged, original LIFF `approval-panel.js` blob `a4d92d7ad40f1a9e301462023bd5c17d96add191` unchanged, `ACTIVE=false`; no new transport, source entrypoint, deployment or Manifest writes.
- Actual isolated Node `v22.16.0`, `node --test tests/test-g5-offline.test.cjs`: **83 test cases/83 PASS, 0 FAIL, 0 skipped**, local-only. GitHub blobs of code and test files match exact tested local file `git hash-object` results. `tests/fixtures` contains exact LIFF source copy to prevent importing a real UI/Provider.
- Pure code static scan for direct Apps Script, fetch/network and LINE APIs had no hits; source itself never reads real Google Sheets/employee rows, executes Apps Script or creates Provider resource.
- G5 `refuseCommit` always throws; `dryRun` always `readyForProviderMutation=false` and zero intended writes. **No runtime-level external IO independent proof**, not G1 actual integration, not Provider E2E.

## Critical limitations and next gate
- The new adapter uses a synthetic `caseLedger` input to represent `LongLeavePolicyVersion`, `LongLeaveWorkflowVersion`, `LongLeaveHandoverConfirmed`, because G4 showed these fields do **not** exist in live `假單` header. That ledger is **NOT** a real Provider table and may not be trusted for actual authorization.
- Legacy status inverse map is strict; unknown transitions HOLD. Actual stored dates/values, actor/manager/executive delegated scope, group epoch and long-leave durable receipt are unverified.
- Existing group plan has `readyForProviderMutation=false`. `ScriptLock` cannot ensure cross-Sheet atomic rollback. New storage format or transactional recovery design needs separate permission.
- **Next** G6: additional Source Owner authorization for *offline-only G1↔G5 real-policy parity tests + transaction-failure model design*. Not authorized to bind real provider, read rows, modify schemas, publish LIFF, send LINE or modify Production.
- Cross-window SSOT: prior central G3 branch / LIFF machine state writes were safety-blocked; `SSOT_SYNC_PARTIAL_HOLD` remains, **no bypass**. New G5 Drafts do not overwrite main or formal Release Manifest; Backend Production @169 / LIFF V153 unchanged.
