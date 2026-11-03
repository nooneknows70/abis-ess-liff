# abis-ess-liff Cross-Window Bootstrap

## Mandatory read order

1. Frozen policy: `nooneknows70/abis-release-control/ABIS_MULTI_REPO_CROSS_WINDOW_SSOT_POLICY_FROZEN.md`
2. Central registry: `nooneknows70/abis-release-control/ops/ABIS_MULTI_REPO_SSOT.json`
3. This repo: `ops/CURRENT_STATE.md`
4. This repo: `ops/PROJECT_STATE.json`
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


## 2026-11-03｜三方治理 V1 — Source Owner 決策已凍結

- Policy ID: `ABIS_3PARTY_GOVERNANCE_V1_20261103`；Version: `V1`；Effective: `2026-11-03 Asia/Taipei`。
- 唯一政策全文：[中央三方治理政策](https://github.com/nooneknows70/abis-release-control/blob/670fc90d5b25fcf327e056d9028f9c6c0afc6ff1/ABIS_3PARTY_GOVERNANCE_V1_FROZEN.md)。此連結固定至中央政策 Commit `670fc90d5b25fcf327e056d9028f9c6c0afc6ff1`，尚未合併 main；子系統只引用，不複製政策全文。
- `GOVERNANCE=FROZEN_BY_SOURCE_OWNER`；`ENGINEERING_EXECUTOR=CODEX`；`CHATGPT=SPEC_AND_ACCEPTANCE`；`OWNER=POLICY_AND_MANAGEMENT_AUTHORIZATION`；`DEFAULT_TEST_MODE=ONE_SHOT`。
- Codex 負責工程、測試、Branch／Commit／Draft PR 與中央／子系統 SSOT；ChatGPT 唯讀獨立驗收；只有實質管理政策、必要正式寫入或上線權限由 Source Owner 裁決。一般技術問題不逐項請示。
- 與 `ABIS_MULTI_REPO_CROSS_WINDOW_SSOT_V1_20261026`、`ABIS_RELEASE_FLOW_V2_FROZEN` 並行；`RELEASE → GO-LIVE → FINAL VERIFY`、既有 authority、資料權責、隔離、HOLD 與禁止重跑均保留。歷史有效驗收沿用證據。
- 本批次限治理文件／SSOT／handoff／必要文件驗證程式。產品、正式資料、LINE、OAuth、ACL、Script Properties、Trigger、Deployment 零變更；不合併 main，不執行 Production。既有子系統 Gate 不提升。
- 管理決策 `FROZEN`；GitHub 候選狀態 `DRAFT_BRANCH_CANDIDATE`；main `NOT_MERGED`；ChatGPT 獨立驗收 `NOT_VERIFIED`；Production `OUT_OF_SCOPE`。同步讀回與 PR／Commit 證據以中央 `ops/governance/2026-11-03-sync-evidence.json` 及當日 handoff 為索引，不提前宣稱全系統完成。

新工作開始前須連同既有跨 Repo 政策及 Release Flow V2 讀取此政策，再檢查最新 main、相關 Draft PR 與同步證據；若 authority 漂移則 HOLD。未來新增 ABIS Repo 亦適用。
