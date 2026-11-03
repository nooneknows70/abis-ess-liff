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

## 2026-11-03｜三方分工治理：Source Owner 已核准，GitHub 同步待審查

- 治理識別：`ABIS_TRIPARTITE_DELIVERY_GOVERNANCE_V1_20261103`，適用所有 ABIS 系統專案。ChatGPT 負責需求與獨立驗收；Codex 為主要工程執行者，負責候選程式、分支、Commit、Draft PR、CI 及 SSOT；Source Owner 負責管理政策、敏感存取、正式業務寫入與 Stage／Production 必要授權。
- One-shot 為預設工程方式：集中實作、正常／負面／回復及回歸驗證；沿用未受影響的有效 PASS，不重跑已結案一次性交易。既定範圍內的一般技術決策不逐項重新詢問。
- 中央政策：`nooneknows70/abis-release-control/ABIS_MULTI_REPO_CROSS_WINDOW_SSOT_POLICY_FROZEN.md`；ADR：`docs/adr/0002-tripartite-delivery-governance.md`（中央 Repo）。Authority、Bootstrap、Fail-closed、Release Flow V2 三階段及正式發布權責完整保留；個別對話、子系統 PR 或重構不得自行取消本治理。
- 本次為文件候選：`SOURCE_OWNER_APPROVED / REPO_SYNC_PENDING`；跨 Repo Draft PR 尚未合併，不宣稱全部 GitHub 凍結完成。所有既有 Release Manifest、版本、Deployment、業務與原始資料保持；Production Release／GO-LIVE 未獲本次授權。
