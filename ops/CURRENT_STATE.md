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

## Office OT S0 — creation-only new Stage authorization (2026-10-26)

- Source Owner A authorizes one new blank Office OT synthetic standalone Apps Script **creation only**, name `ABIS_ESS_OT_STAGE_SYNTHETIC_ONLY_20261026`. No new project created yet: connected Google Drive tool only creates Docs/Sheets/Slides, not Apps Script `projects.create`.
- Accessible Script-name search has zero matches; next owner step is Apps Script UI **new blank project** creation then return Script ID for read-only inventory.
- No LIFF source/assets, Release Manifest, LINE route/menu, auth Session, Stage Script code, Sheet, Trigger or Deployment writes permitted.
- RC5 stays barred for Office OT remote execution; source authority V153 independent from Backend V163 Manifest / observed @164 reconciliation.

## RC1.35 H1D-B Q11 B — cropped 4-scope screenshot, project not identified (2026-10-26)

- Owner answered Q11 **B** and supplied a cropped Apps Script OAuth panel with **four requested scopes**: `script.scriptapp`, `script.external_request`, full `drive`, full `spreadsheets`. UI evidence only; does not establish granted scopes, project execution or runtime identity.
- The image does not display the Apps Script project name/Script ID. Prior central SSOT already observed **the same exact four scopes** in unrelated `ABIS_ESS_POLICY_A_STAGE_RC5`. Therefore **do not assign screenshot to RC1.35** without Source Owner project-title confirmation; RC1.35 Stage effective scopes remain `UNVERIFIED`.
- No real LINE User ID read, login, LINE API, Token or other Stage/Production mutation. Q1–Q10 frozen unchanged; Q10 LIFF Endpoint/`openid` remains `PASS_OWNER_ATTESTED`.
- Next single operator **Q12 project attribution**: `A = ABIS_RC135_DEDICATED_SYNTHETIC_STAGE`, `B = ABIS_ESS_POLICY_A_STAGE_RC5`, `C = UNKNOWN`. Never ask for Script ID, token, property values or screenshot containing employee data.
- H1D-B real identity, scopes, local ACL, Channel credential and live Push remain **HOLD**. LIFF release authority V153 unchanged; Backend REST33/V164/V165 and Office OT remain independent.
- Central SSOT recording: https://github.com/nooneknows70/abis-release-control/commit/2cdc5191fb98373006beb67d49454ae45f52fa96.

## RC1.35 Q11 — user-caption project attribution correction (2026-10-26)

- Source Owner's Q11 submission was **A**, but screenshot visibly contains four requested OAuth scopes, so A (zero scopes) does not pass. The screenshot is explicitly described in the owner's caption as **`ABIS_POLICY_A_STAGE`**, not the RC1.35 dedicated synthetic Stage. Image crop does not show a name/Script ID; this is `OWNER_DECLARED_PROJECT` evidence only.
- Scope classification for captioned Policy A Stage is **B / FOUR_REQUESTED_SCOPES**: script.scriptapp, script.external_request, full Drive, full Sheets. Same scope names were previously recorded for `ABIS_ESS_POLICY_A_STAGE_RC5` under Office OT, without new independent Script ID proof. Do not alter Office OT's release/scope decisions.
- RC1.35's separate `ABIS_RC135_DEDICATED_SYNTHETIC_STAGE` OAuth scopes remain **UNVERIFIED**. Earlier Q12 project attribution question is already answered by the caption; **do not ask Q12 again**.
- Next single operator read-only check is the correct RC1.35 Stage **Overview → Project OAuth Scopes** with project title visible, while hiding Script ID and all credentials. No LINE User ID, Token, login, script execution, API, Stage writes, deployment or Production change.
- Q1–Q10 and LIFF Manifest V153 unaffected; Q9 `ops/`-only SSOT scope.

## Office OT S0 new Stage identity readback

- Owner-created Office OT synthetic Stage identity verified by authenticated Google Drive metadata on 2026-10-26. Project name: `ABIS_ESS_OT_STAGE_SYNTHETIC_ONLY_20261026`; native Google Apps Script file, owner-only metadata.
- Creation gate: PASS. Zero-state source/Deployments/Triggers/Properties/OAuth: UNVERIFIED; S0 remains HOLD pending new project read-only screenshots.
- No LIFF code, Manifest, LINE, Stage source, Trigger, Deployment or Production changes. Existing RC5 is not approved for Office OT testing; Q1-Q30 policy unchanged.

## RC1.35 H1D-B Q11 — dedicated synthetic Stage 0 requested OAuth scopes confirmed by owner (2026-10-26)

- **Q11 A:** Source Owner explicitly confirms the `ABIS_RC135_DEDICATED_SYNTHETIC_STAGE` Apps Script Overview lists **0 requested Project OAuth Scopes**. This is a **PASS_OWNER_ATTESTED** target-project observation, NOT API-verified effective runtime OAuth authorization.
- Uploaded picture depicting four scopes was explicitly for a different project, `ABIS_POLICY_A_STAGE`, **not** the RC1.35 Stage. Earlier Q11 invalidation / uncertain attribution in this LIFF SSOT is **superseded** by Source Owner's target-specific statement. Do not re-ask Q11 or screenshot attribution.
- Existing original RC1.35 synthetic Stage project is only for isolated synthetic translation/notification preview, not a real identity runner. Prior owner-submitted two .gs source files, V8 manifest and 0 Trigger/0 Deployment UI evidence remain historical; they do not prove all runtime permissions/ACLs.
- **Q12 next one read-only manual node:** in same RC135 Stage Apps Script, open Project Settings > Script Properties; report only **zero/nonzero/unknown entry count**. Never read/copy property values or credentials, run scripts, change OAuth, deploy or trigger.
- `Q11_PASS_OWNER_ATTESTED_ZERO_REQUESTED_SCOPES / Q12_SCRIPT_PROPERTIES_PENDING / REAL_UID_HOLD / INDEPENDENT_OAUTH_ACL_HOLD / LINE_SEND_HOLD / PRODUCTION_HOLD`. Frontend LIFF Manifest V153 unchanged, independent Backend V165 release untouched.
- Central Q11 correction handoff: https://github.com/nooneknows70/abis-release-control/commit/38702d8a6fdf221b7252a23e9e1d143a9c246840.

## RC1.35 H1D-B — Q12 owner confirms no Script Properties in dedicated synthetic Stage (2026-10-26)

- Q12 **A** (source-owner attested, correct project): existing `ABIS_RC135_DEDICATED_SYNTHETIC_STAGE` Apps Script **Script Properties list has 0 entries**; no property values, secrets, Tokens or real User IDs accessed.
- Independently authenticated **Google Drive file metadata** returns a native Apps Script file with `shared=false`, exactly one returned permission role `owner`. Scope: Drive sharing metadata only, NOT Apps Script runtime OAuth, source HEAD/immutable parity or local process ACL.
- Prior Q11 owner-observed requested OAuth Scopes 0, historical owner screenshots of 0 Triggers and 0 active/archived Deployments, two owner-submitted synthetic scripts. This dedicated Stage is **synthetic-only**; it must not be treated as a real identity runner or live notification environment.
- Q1–Q12 frozen; next **Q13** one Mac local runner availability check (`uname -s`, `node --version` if installed, `umask`). No file/network modification, no credentials, no LINE actions or Production.
- Holds `REAL_UID_NOT_READ / MAC_RUNNER_OS_ACL_HOLD / REAL_IDENTITY_NOT_VERIFIED / TOKEN_TO_CHANNEL_HOLD / LIVE_RICH_MENU_URI_HOLD / SEND_HOLD / PRODUCTION_HOLD`. Frontend LIFF Manifest remains independent V153; Backend V165 not changed; existing Q9 GitHub `ops/` record scope only.
- Central Q12 record: https://github.com/nooneknows70/abis-release-control/commit/f5c14b8b5a733516633a2b9e11d347e2d48b89a6

## Office OT S0 — owner screenshots of new Stage zero-state, source pending (2026-10-26)

- Four screenshots show Office OT-dedicated Apps Script project: 0 triggers, 0 active/archived deployments, no visible Script Properties, 0 7-day executions, no OAuth scopes requested in dashboard. **PASS_OWNER_UI_PARTIAL** only. Google Drive authenticated project ID/name metadata was previously PASS.
- Missing actual Code Editor file/source/Services/Libraries and `appsscript.json` content, so no Production data connections or future OAuth access cannot be verified. **S0 gate `HOLD_NEW_STAGE_SOURCE_MANIFEST_AND_DATA_TARGET_ISOLATION_UNVERIFIED`**.
- Next single human read-only evidence packet: Code Editor file list plus `Code.gs` contents, and opened `appsscript.json`. Do not execute code, add scopes/services/properties/triggers/deployments, send LINE, or write Stage/Production.
- Backend independently reached V165 PROD_CURRENT, but LIFF independent Release Manifest V153 must remain unchanged; Office OT S0 is not a release authorization. Source report `ABIS_ESS_OT_S0_NEW_STAGE_UI_EVIDENCE_20261026.md`, SHA256 `8be14f80d5c9fd14d657396a2cc3e209efd3245526949290c022b59e6793798f`; raw images not in GitHub.

## Office OT S0 dedicated Stage Code.gs/manifest UI baseline PASS (2026-10-26)

- Source Owner supplied Code Editor screenshot of dedicated Office OT Stage: only `程式碼.gs` and `appsscript.json` listed, Libraries/Services empty. Default `myFunction` empty (no observable side-effect); image SHA256 `10eda827b5cdeb32736582c277bf17c2f4f752b184031d8e6d5854daba2d338c`.
- Owner-pasted manifest: V8, Asia/Taipei, empty `dependencies`, STACKDRIVER, no explicit `oauthScopes`. Visible source/manifest has no Production IDs, endpoints or LINE calls. Prior dedicated Stage UI showed zero Triggers/Deployments/Script Properties. **`PASS_OWNER_UI_STATIC_STAGE_BASELINE`**.
- Source Owner evidence is screenshot + pasted JSON, NOT authenticated Apps Script getContent/runtime. Scope inference, future code, runtime, network and cross-system parity remain untested. No source import, Stage execution or business-data write authorized by creation-only permission.
- Next Gate: local/offline synthetic Code.gs validation, then separate bounded source-upload-only authorization. Any actual Stage execution, Trigger, Deployment, LINE, Payroll and Production remain independent controls. LIFF Manifest remains V153, Backend independent manifest V165; Q1–Q30 frozen.

## RC1.35 H1D-B — Q13 owner macOS Node.js env, private umask gate (2026-10-26)

- Owner Q13 Terminal read-only text: macOS `Darwin`, `Node v24.21.0`, default shell `umask 022`. Available environment `PASS_OWNER_ATTESTED`; **private-identity runner still HOLD**, because newly created files/directories under 022 can be 0644/0755 by default.
- For any future real-identity data use, require isolated child-process `umask 077`, `0700` private workspace and `0600` private files. No system-wide setting changed. The prior 68/68 synthetic test pack has **not** been tested on this owner's Node v24 Mac.
- Next **Q14** is safe read-only subprocess check: Node sees 077 inside the subshell, original parent umask remains 022. No file creation, network, OAuth, LINE API, User ID, Token, Apps Script/Stage operations or Production writes.
- `REAL_UID_HOLD / LOCAL_RUNNER_OS_ACL_HOLD / TOKEN_CHANNEL_HOLD / SEND_HOLD / PRODUCTION_HOLD` unchanged. Backend V165/LIFF V153 release authorities independent; this is Q9-approved `ops/` only. Central handoff https://github.com/nooneknows70/abis-release-control/commit/42049c7959a3f30763b4e428b691b1c88c7c9ca6.

## RC1.35 H1D-B — Q14 owner macOS child umask 077 PASS (2026-10-26)

- Source Owner Terminal returned `PARENT_BEFORE=022`, `CHILD_NODE_UMASK=077`, `PARENT_AFTER=022`. This is `PASS_OWNER_TERMINAL_CHILD_NODE_077_PARENT_UNCHANGED`: isolated Node child inherited restrictive umask without modifying parent. It does **not** verify existing file ACL, environment isolation, external network restrictions or real identity suitability.
- No filesystem changes, real User ID or Token, LINE API, login, Stage test run or Production changes. Earlier Q5 synthetic 68/68 was not performed on owner's Node v24.21.0 Mac.
- Next **Q15 read-only** locate previously created Q5 hermetic synthetic ZIP in Downloads/Desktop, inspect file presence, symlink exclusion, current user owner match and mode; no extraction, execution or full path logging. If absent, `ARCHIVE_FOUND=NO`, next action is acquire correct synthetic ZIP, not use real data.
- `REAL_UID_HOLD / MAC_FILESYSTEM_ACL_AND_PROCESS_ISOLATION_HOLD / TOKEN_CHANNEL_HOLD / LIVE_LINE_SEND_HOLD / PRODUCTION_HOLD` remains. Q9-authorized GitHub `ops/` documentation only. LIFF frontend authority V153 and Backend V165 remain independent. Central Q14 handoff: https://github.com/nooneknows70/abis-release-control/commit/688a3d4501a784bc3f4165d92c1ddc75d7239e59.
