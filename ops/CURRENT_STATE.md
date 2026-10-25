# ABIS ESS LIFF — Current State

Updated: 2026-10-26 Asia/Taipei

Frozen cross-window policy: `ABIS_MULTI_REPO_CROSS_WINDOW_SSOT_V1_20261026`  
Central policy file: `nooneknows70/abis-release-control/ABIS_MULTI_REPO_CROSS_WINDOW_SSOT_POLICY_FROZEN.md`

## Authority

- Central project SSOT: `nooneknows70/abis-release-control/ops/ABIS_MULTI_REPO_SSOT.json`
- Local source authority: Git `main`
- Local release authority: `ABIS_ESS_RELEASE_MANIFEST.json`
- Release Flow: `ABIS_RELEASE_FLOW_V2`

## Current release evidence

The local Release Manifest records `ABIS_ESS_PHASE1A_RC1_33_PROD_20261018_V153` as PROD_CURRENT for the frontend release set.

`ABIS_ESS_CURRENT_STATE.md` contains older V143 narrative and must not override the Release Manifest.

Cross-repo note:
- frontend/LIFF release evidence is V153;
- backend Apps Script has independently advanced to Production V162;
- do not fabricate alignment by editing this manifest without a formal cross-component release and FINAL VERIFY.

## Current work boundary

- PR #85 / REST33 is backend-only.
- No LIFF code or frontend deployment change is authorized by that release.
- If a future backend change requires frontend compatibility work, record it in this repo and central release-control SSOT before release.
