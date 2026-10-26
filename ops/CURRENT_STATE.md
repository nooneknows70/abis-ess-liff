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

## Office OT frontend / Issue #62 — S0 gate (2026-10-26)

- Policy 30/30 confirmed; Phase 1 new UI in My Attendance and My Overtime, existing LIFF/ESS behavior preserved.
- Frontend Manifest Release Set **V153** remains authoritative for this component. Backend Manifest records **V163** separately; difference is not automatically drift. Current cross-component runtime compatibility **UNVERIFIED** until fresh contract/readback.
- Git comparison from V153 authority commit to LIFF `main` found only `ops/` additions, not frontend asset/source edits at this S0 check.
- S0 = `HOLD_RUNTIME_AND_STAGE_ISOLATION_EVIDENCE_MISSING` (shared workstream state, not a LIFF release failure). Office OT Stage Apps Script, frontend test route, allowed target IDs and LINE outbound safety have not been proven.
- No LIFF code, assets, Release Manifest, live LINE or deployment mutation authorized. Next: read-only compatibility and Stage isolation checks. Tracking: [Backend Issue #62](https://github.com/nooneknows70/abis-ess-backend/issues/62).

## RC1.35 H1D-B — Q1–Q8 cross-window LINE/LIFF evidence (2026-10-26)

- Owner Q1–Q8 all **A**; Q9 **A** authorizes **only** cross-repo `ops/` SSOT metadata updates, not LIFF code/assets or live Rich Menu.
- Q1: one Source Owner personal LINE test candidate, fixed synthetic message; no group/multi-recipient. Q2: same Messaging API Channel ID on two official UIs, `PASS_OWNER_ATTESTED`, no ID stored. Q3: owner handset follows official account and private binding **status only** was read-only matched; true User ID not read.
- Q4: future isolated one-record ID comparison approved **only after** runner/ACL/OAuth safety gate, not yet executed. Q5: local hermetic verifier approved; 68/68 synthetic tests **previous-conversation reported**, not re-run here.
- Q6: existing LINE Login/LIFF accepted as candidate, static Backend `main` reviewed; invoking existing live login or OAuth callback may write Session/binding or send, so **forbidden** under read-only.
- Q7: Login Linked Official Account matches ABIS internal employee official account by `PASS_OWNER_ATTESTED`; this does not independently prove live token/provider/channel association.
- Q8: Source Owner phone shows frozen six-cell menu, `PASS_OWNER_ATTESTED`. 2026-10-07 FAST4 RC1.3 + RM-10E release handoff is historical PASS. Git `main` LIFF bridge retains the `account` route, and Backend menu contract defines six routes; however current active Rich Menu ID, per-action URI and `LINE_LIFF_APP_URL` Production value remain **UNVERIFIED**.
- Independent release authority: LIFF Manifest remains frontend **V153**; Backend Manifest recorded **V163** at this audit, version difference is not itself drift. Existing unrelated Office OT S0 and REST33 workstreams must stay untouched.
- H1D-B feature PR #76 was observed **DRAFT, NOT MERGED**. No new Rich Menu creation, RM10 Cutover, rollback or LIFF Deployment is authorized.
- Holds: `REAL_UID_NOT_READ / IDENTITY_NOT_VERIFIED / RUNNER_ACL_OAUTH_HOLD / LIVE_MENU_URI_AND_LIFF_RUNTIME_UNVERIFIED / TOKEN_TO_CHANNEL_HOLD / LINE_SEND_HOLD / PRODUCTION_HOLD`.
- Next: read-only LIFF/Provider/static URL and runner isolation checks. No real ID/Token, no live LINE Login/API/Push, no source/Manifest/Production mutation.
- Central SSOT [Q1–Q8 record](https://github.com/nooneknows70/abis-release-control/commit/e40b738a312b78fa0119216e5092999f0257683e).

## Office OT S0 Stage RC5 candidate / 2026-10-26 10:56

- Existing `ABIS_ESS_POLICY_A_STAGE_RC5` was confirmed to be a distinct native Apps Script file via Google Drive metadata; owner-only permission metadata returned. **No current Apps Script project content, deployment/Trigger inventory or OAuth/Script Properties readback** has been obtained.
- Per previous Source Owner constraint, inspect existing Stage first; **no new Stage**, test-data writes, real Token reads, LINE sends, new Deployment/Trigger, or LIFF feature changes authorized.
- Offline local Office OT isolation contract tests 40/40 PASS, but live gate remains `S0_HOLD_RUNTIME_AND_STAGE_ISOLATION_EVIDENCE_MISSING` and cross-repo frontend compatibility remains unverified.
- Backend V164 Release reconciliation is separate: owner observed deployment @164 while Backend Manifest still @163; do not alter LIFF independent V153 Release Manifest.
- Next manual read-only evidence: RC5 editor file list, Manage Deployments, Triggers, OAuth and Script Property **key names/count (no values)**, fixture ID mapping. Tracking: Backend Issue #62.

## RC1.35 H1D-B — static LIFF identity path pre-Q10 (2026-10-26)

- Git LIFF `index.html` app ID equals both Backend `Main.js` fallback LIFF ID and `RM_10_UPGRADE.js` Rich Menu fallback; the six routes map to the Bridge whitelist and Bridge's Backend Deployment ID equals the Backend Manifest. `PASS_STATIC_GIT_ONLY`, not live Channel or current Rich Menu readback.
- Backend existing Login callback writes Sessions/bindings and can trigger test Push. Under H1D-B READ_ONLY, **never open existing live LIFF as a test, invoke OAuth callback, or use any User ID or Token**.
- Q5 local packaged synthetic-only verifier was actually rerun: 68/68 PASS, 12/12 ZIP member SHA256 PASS, CLI extra argument blocked. This is no proof of current employee/device identity or local machine ACL.
- Official `liff.getIDToken()` requires LIFF `openid` scope. `profile` scope is for `liff.getProfile()` and `liff.getFriendship()` and is not a prerequisite for this particular ID-token flow.
- **Q10 next one human check:** visually inspect existing ABIS employee service LIFF settings in LINE Developers Console, compare Endpoint URL with frozen GitHub Pages LIFF Bridge, and verify `openid` checked. Keep all IDs, Token and Secret private. Do not Edit/Save/Login/Run.
- Holds remain `ACTUAL_LIFF_CONSOLE_CONFIG_HOLD / REAL_UID_MATCH_HOLD / OAUTH_ACL_HOLD / TOKEN_TO_CHANNEL_HOLD / SEND_HOLD / PRODUCTION_HOLD`.
- Independent LIFF Manifest V153 not modified; Backend V163 Manifest/current V164 reconciliation HOLD remains separate. Only Q9-authorized `ops/` SSOT documentation updated.
- Central audit handoff: [e6123457](https://github.com/nooneknows70/abis-release-control/commit/e61234572ebf1fd07a69800fb6109ea47f444a1d).

## Office OT S0 — RC5 UI screenshot safety Gate (2026-10-26 11:27)
- Source Owner screenshot inventory: existing `ABIS_ESS_POLICY_A_STAGE_RC5` shows 6 mixed-purpose .gs, 0 active/archived deployments, 0 triggers, 5 Script Properties, and 4 scopes including broad Drive/Sheets, script.scriptapp, script.external_request. This evidence is **OWNER_UI_ATTESTED**, not Apps Script API readback or proof of safe data isolation.
- Office OT S0 pure offline synthetic verifier still 40/40 PASS, while actual evidence is **HOLD / 11 fail-closed codes**. RC5 is not authorized for Office OT integration testing or writes. New dedicated synthetic Stage creation is subject to a separate Source Owner permission (next single manual node), not already approved.
- LIFF frontend authority Manifest remains independently **V153**; do not rewrite it to match Backend Manifest V163 or observed @164. Existing RC1.35 LIFF/LINE testing remains separately governed; no Live LINE, no source/asset/Release change.
- Report: `ABIS_ESS_OT_S0_RC5_UI_GATE_REPORT_20261026.md` (chat artifact), SHA256 `b2114ea79b97c928b3476243a66f1619654917ab5ed2f71e54d44fb5e9904d46`. No screenshot bytes or Script Property values added to GitHub.

## RC1.35 H1D-B — Q10 LIFF Endpoint and openid owner gate (2026-10-26)

- Owner chose **Q10=A** after visually inspecting the existing LINE Developers LIFF App: its **Endpoint URL matches the frozen GitHub Pages bridge** and **Scopes contain `openid`**. Evidence `PASS_OWNER_ATTESTED_CONSOLE_ONLY`; this does not independently verify the console, live OAuth session, token, real Line User ID, Production Script Properties or current Rich Menu URI.
- Q1–Q9 frozen unchanged. Prior Git static verification of bridge/Main/Rich Menu LIFF ID, six routes and Backend URL is still only source evidence. No LIFF app launch, ID-token verification, OAuth callback, LINE Push, Production source/deployment change.
- For the **separate existing RC1.35 synthetic Stage**, previous SSOT already preserves owner-submitted two synthetic .gs sources, V8 `appsscript.json` with no explicit scopes, 0 Trigger and 0 Deployment owner UI observations. However Apps Script can **auto-infer effective OAuth scopes**; absence of a manifest `oauthScopes` entry or visible deployment is not a zero-scope or complete ACL guarantee.
- Next single operator read-only node is **Q11**: within `ABIS_RC135_DEDICATED_SYNTHETIC_STAGE` Apps Script, open **Overview → Project OAuth Scopes** and return `NONE`, `SOME` (scope names only), or `UNKNOWN`. No Script Properties **values**, tokens, employee data, project execution, authorization, edit/save, deploy, triggers or Production operation. This Stage remains **synthetic-only** and is not allowed to become the real-identity runner.
- Current `Q10_PASS_OWNER_ATTESTED / Q11_STAGE_EFFECTIVE_OAUTH_PENDING / REAL_UID_NOT_READ / OWNER_IDENTITY_HOLD / LOCAL_OS_ACL_HOLD / TOKEN_CHANNEL_HOLD / REAL_PUSH_HOLD / PRODUCTION_HOLD`.
- Backend V163 Manifest / separate owner-observed @164 reconciliation, V165, REST33 and Office OT are independent; no release authority rewritten. This is **Q9-approved ops/ documentation only**.
- Central handoff: https://github.com/nooneknows70/abis-release-control/commit/584d8a9123d017051228fc10338ab1556ebdc514.
