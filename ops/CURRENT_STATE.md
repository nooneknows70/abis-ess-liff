# ABIS ESS LIFF — Current State

## ABIS_LEAVE_LABEL_V168_VERSION_COLLISION_20261027 — V168 belongs to Oct23 typhoon; old label runner DO NOT APPLY

- **Fresh Source Owner Mac evidence:** existing Production Deployment ID points to immutable **@168**, description `ABIS V168 Oct23 typhoon bounded backfill source-only Release Flow V2 2026-10-27`; `clasp versions` confirms @168 is occupied.
- **Backend manifest/PROD_CURRENT evidence:** @168 typhoon release has source authority `72417dd1e13d1d932d7c80da9122ad30e6e8a359`, source tree `cd2c50882e28e25390aaf30000689a01ed0eb25d`, **79/79** source parity and rollback @167. New typhoon file is `P5A2_5_ATTENDANCE_20261023_TYPHOON_BACKFILL_RC1.js`. This is not the leave-label source release.
- **Critical safety hold:** `tools/abis-v168-leave-approval-label-production-release.mjs --apply` is **FORBIDDEN**. The old runner pins @167 prior, 78 files, new immutable @168 and rollback @167. Do not reuse, override flags, renumber without a new source/rollback gate, or roll back typhoon @168.
- **Typhoon dependency:** published runtime preview `release/V168_OCT23_TYPHOON_EXACT50_RUNTIME_PREVIEW_20261027.json` PASS, 50 planned updates, 0 writes and 0 blockers. `SOURCE_OWNER_AUTH_REQUIRED_TO_ARM_PLAN`, business-data Apply separately gated. Leave-label A authorization does NOT authorize this typhoon plan.
- **Leave-label work already staged:** Backend PR #95 and LIFF PR #28 merged to main; LIFF GitHub Pages exact-source readback PASS, synthetic CI 46/46 PASS. Backend main now contains 2 label-only source modifications not present at typhoon immutable @168; Production label-change deployment and final UI smoke have **not** occurred.
- **Next technical direction:** prepare an isolated **read-only** release preflight candidate against actual immutable @168 / 79 sources. Version after @168 (e.g., @169) must be discovered as available and separately guarded; no allocation/push/deploy now. A valid Production release must preserve typhoon source and avoid interfering with 50-key pending plan.
- **SSOT:** central and Backend production authority now synced to @168, 79 files, and rollback @167; LIFF Manifest remains V153. No Production writes by this leave-label window.


## ABIS_LEAVE_APPROVAL_LABEL_RC1_V168_STAGED_MAIN_20261027 — paired Git main PASS / Production @167 unchanged

- **Decision:** existing Source Owner A release authorization. Scope remains only factory manager `MANAGER_ASSIGN` display label `指派代理` → `核准申請` with original `ASSIGN_PROXY`, manager ID snapshot ACL, proxy eligibility and long-leave route unchanged.
- **LIFF PR #28:** merged to `main` as `ac14794aa33912b657f075eec5259bc564a83e6f`; new published adapter Git blob `3e8126d03864c4824e19efe0b280e0a8ae60ee20`. Original `abis-ess.bundle.js` blob `24c579dd495ec9d9a8c39e078c2ed07ebc61fd5b` unchanged; frontend release manifest remains V153.
- **Independent GitHub Pages HTTP confirmation:** validation-only PR #29 created and CLOSED/UNMERGED after Actions run `40454443510` completed `success`, output `GITHUB_PAGES_LABEL_ASSET=PASS` and `OBSERVED_GIT_BLOB=3e8126d03864c4824e19efe0b280e0a8ae60ee20` for public Pages URL. Zero secrets; no formal data or provider mutations.
- **Backend PR #95:** merged to `main` as `9ce2d879bf8335c8bfb60c192400185ce247bf01`, `src/Main.js` blob `9beec9502fe2a5f63924b862502958755c861a1e`, `src/Index.html` blob `e897ebbeb2dc2f559260dc567263ba6d455451fc`; exactly 2 Apps Script `src/` modifications. Includes bounded V168 runner `tools/abis-v168-leave-approval-label-production-release.mjs` (Git blob `45a6f0f77d0a827e52c8baa93d41c8aecb24bfba`). No merged source beyond authorized label and required integration.
- **CI evidence:** Backend Actions `40454008339` completed success with eligibility 17/17 + release-runner fail-closed checks 12/12. LIFF Actions `40453636717` success with 17/17 actual-renderer-inclusive tests. Total **PASS_46_46**.
- **Production status / intentional staging:** immutable Production Apps Script @167 remains current (R2174 LIVE), current frontend manifest V153. No Apps Script source push, new immutable @168, deployment pointer update, Trigger, Leave/Attendance/Payroll or LINE writes. Git main and Production @167 are now deliberately different in exactly 2 source files pending authorized release; the old read-only `abis-release-verify.mjs` will report source drift and MUST NOT be used to declare a new release blocked without considering this staged delta.
- **Next HUMAN OPERATOR execution (no repeat policy decision):** on authenticated owner Mac in Backend repo, `git switch main && git pull --ff-only origin main && node tools/abis-v168-leave-approval-label-production-release.mjs --apply`. Runner hard-gates clean/fresh Git main, 78 source files, two exact changed blobs, prior @167 immutable/deploy source, GitHub Pages exact SHA readback, no occupied @168 immutable version, and postdeploy parity. Any drift => HOLD; after deployment verification failure => attempt pointer rollback to @167. The runner produces RELEASE source evidence but explicitly holds PROD_CURRENT for GO-LIVE UI smoke / FINAL VERIFY.
- **Boundary:** only planned future source HEAD push, one immutable Version @168, and reuse existing Deployment ID permitted within A. All formal business-data writes, LINE, Trigger and unrelated changes forbidden; no user action on a formal leave request required for verification. If tool reports HOLD, do not bypass.


## ABIS_LEAVE_APPROVAL_LABEL_RC1_CI_GATE_20261027 — CI PASS 29/29, cross-repo static PASS 12/12, Production release HOLD

- **Source Owner decision:** Existing A approval for scoped label-only change `指派代理` → `核准申請` where factory `MANAGER_ASSIGN` can finalize. Backend ASSIGN_PROXY, manager snapshot ACL, proxy eligibility, special long-leave route and all business data unchanged.
- **Backend Draft PR #95:** source and synthetic tests + restricted CI; head `475d104ccb7fc47506cf02fc813b16822e647d9d`; actual GitHub Actions run `40451675750`, job `success`, Node syntax PASS, **17/17 tests PASS**.
- **LIFF Draft PR #28:** label adapter/test + restricted CI; head `f753ab602931ea4a3ee609df67e652df6942b655`; actual GitHub Actions run `40451660402`, job `success`, Node syntax PASS, **12/12 tests PASS**.
- **Independent cross-repo static contract:** 12/12 PASS: `assignProxyFinalizesLeave` interface consistent, original ASSIGN_PROXY ACL and button handler unchanged, original V153 bundle unmodified, adapter load after bundle, CI has contents: read and no Production secrets.
- **Git/source drift:** both PRs diverged by unrelated main commits since branch base; current main source files `Main.js`, `Index.html`, original LIFF bundle and Release Manifests match expected authority blobs. PR diffs limited to candidate UI code and CI/tests; no other business logic edits.
- **Release HOLD:** Both PRs stay DRAFT/UNMERGED. No live GitHub Pages asset readback, authenticated Apps Script Production source push/version/deploy capability or paired Release Flow V2 FINAL VERIFY available in chat. Do not independently merge/deploy either PR. No Git main source, Production, Trigger, Leave, Attendance, Payroll, or LINE writes.
- **Production authority unchanged:** Backend Apps Script V167, rollback V166, frontend Manifest V153. Owner-Mac prior read-only result 78/78 HEAD + deployment source match, with helper `STALE` formatting false positive; not new label release evidence.
- **Next action:** One bounded owner-Mac paired release once deployment runner and fresh provider parity are available: recheck both head hashes + CI PASS, safely publish and read back LIFF asset, merge backend source, push only Git authority to Apps Script, immutable version / existing deployment pointer verify, smoke check UI/role and rollback preservation, then FINAL VERIFY. HOLD on any mismatch. A approval need not be repeated.


## ABIS_LEAVE_APPROVAL_LABEL_RC1_20261027 — @167 release parity PASS, verifier format mismatch, UI release HOLD

- **Source Owner authorization:** A remains valid for a scoped button-label release under Release Flow V2; no repeat policy confirmation needed.
- **Owner-Mac read-only result:** Git authority `501c88c26fb955db8bbdc4226d0010316966bfb3`; `Git -> HEAD SOURCE_ALIGNMENT_PASS 78/78`, `Git -> Production @167 DEPLOYMENT_ALIGNMENT_PASS 78/78` with 0 missing/extra/mismatch.
- **`Manifest STALE` root cause:** helper compares literal `manifest.verification.deploymentAlignment="PASS_78_78"` to `gitVsDeployment.status="PASS"` and produces a false `STALE` despite matching version @167 and matching source hashes. Do not edit Production Manifest just to satisfy an old helper.
- **`MANUAL_PENDING`** is a hard-coded output of `tools/abis-release-verify.mjs`, not a newly observed runtime error. Existing independent @167 runtime evidence is preserved; new leave-label post-release smoke has not occurred.
- **Exact-blob local tests:** LIFF adapter/test Git blobs `3e8126d03864c4824e19efe0b280e0a8ae60ee20` and `50b4a67e5a35143448a89af61e11060ac74c1768` both match; real Node 22.16.0 `node --test` yields 12/12 PASS.
- **Remaining blocker:** no GitHub CI status checks/workflow runs for Backend Draft PR #95 or LIFF Draft PR #28. Both OPEN/DRAFT/UNMERGED. No Production deployment, new immutable version, LINE, or leave/business-data write took place.
- **Next:** get independently checkable CI PASS and paired Release Flow V2 preflight/rollout capability. Do not merge only one repo; keep Backend @167 / LIFF V153 and rollback @166 untouched while HOLD.


## ABIS_LEAVE_APPROVAL_LABEL_RC1_20261027 — Source Owner A, Release preflight HOLD (2026-10-27)

- **Approved intent:** Replace eligible factory manager MANAGER_ASSIGN button text `指派代理` with `核准申請`, preserving the existing `ASSIGN_PROXY` operation and all approval/authorization rules.
- **Draft candidates:** Backend PR #95 (branch `fix/leave-assign-button-label-20261027`), LIFF PR #28 (same branch), both open/draft/unmerged; paired release required.
- **Local verification:** exact Git blob parity for LIFF adapter/test, Node.js 22.16.0 test run PASS 12/12. No GitHub status checks or PR workflow runs found for either head; authenticated Apps Script HEAD/immutable Deployment live readback unavailable.
- **Gate:** `RELEASE_PREFLIGHT_HOLD`; release prerequisites not verified. No main merge, Apps Script deployment/version/source, LINE, or formal Leave/Attendance/Payroll writes. Backend remains Production V167 (rollback V166), LIFF Manifest V153.
- **Next:** Existing owner Mac with authenticated clasp runs fresh read-only `node tools/abis-release-verify.mjs`; obtain CI PASS, then use paired Release Flow V2 only if all gates pass. Fail closed on mismatch.


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

## RC1.35 H1D-B Q15 — synthetic Mac ZIP present 0644, owner-match missing (2026-10-26)

- Source Owner Mac Terminal Q15 returned `ARCHIVE_FOUND=YES` and `ARCHIVE_MODE=-rw-r--r--` (`0644`). Prior command guards against symlink; **archive owner match was not included** in returned output. Classify `Q15_PARTIAL_PASS_OWNER_MATCH_PENDING`, not full PASS.
- Mode 0644 can allow other local users to read when directory ACL permits. This is a synthetic-only Q5 ZIP; do not change its permissions based only on mode and **never treat this as approved storage for real LINE User IDs/credentials**. ZIP integrity and Node v24 owner-Mac tests not yet performed.
- Q15b next single human read-only output: `ARCHIVE_OWNER_MATCH=YES/NO` from comparing ZIP owner's numeric UID with current user, without printing either value or full path. Do not unzip or run scripts, call network, read token, or mutate Production.
- All existing Q1–Q14 decisions remain frozen. `PRIVATE_RUNNER_ACL_HOLD / REAL_IDENTITY_HOLD / TOKEN_CHANNEL_HOLD / LIVE_LINE_SEND_HOLD / PRODUCTION_HOLD` unaffected. Q9 permits `ops/` SSOT-only; Backend Manifest V165/LIFF Manifest V153 remain separate.
- Central SSOT Q15 handoff: https://github.com/nooneknows70/abis-release-control/commit/8ad1285d5c713cc5dc7a4bd9166c03cdd7b99833.

## RC1.35 H1D-B — Q15b owner match YES; Q16 verify original synthetic ZIP hash (2026-10-26)

- Source Owner Q15b terminal returned `ARCHIVE_OWNER_MATCH=YES` for the **same existing synthetic-only Q5 ZIP**, following Q15 `ARCHIVE_FOUND=YES` / `ARCHIVE_MODE=-rw-r--r--` (`0644`). Thus Q15+Q15b file presence, type, non-symlink, and UID owner match are `PASS_OWNER_TERMINAL_METADATA`; no filesystem permissions changed and `0644` is not approved for future real identity data.
- The assistant's original packaged ZIP was successfully found and checked in its original container (not the owner's Mac): SHA-256 `b55852ef717272bc3f6cea0351e373c198c5eae391eba45f4a110830a3b90c75`; `unzip -tqq` PASS. Use this as **reference-only**; owner Mac archive hash, ZIP CRC and Node v24 execution remain **UNVERIFIED**.
- Next **Q16**: one read-only check of the downloaded Mac Q5 synthetic archive, print only `ARCHIVE_SHA256_MATCH=YES/NO` and `ARCHIVE_ZIP_CRC=PASS/FAIL`; do not unzip/extract, execute any file, pass real LINE IDs, read Tokens or connect to Google/LINE/Production.
- Unchanged HOLD: `REAL_UID_NOT_READ / OWNER_IDENTITY_MATCH_UNVERIFIED / LOCAL_PRIVATE_RUNNER_ACL_NOT_VERIFIED / TOKEN_TO_CHANNEL_HOLD / LIVE_LINE_SEND_HOLD / PRODUCTION_HOLD`. Prior 68/68 is not Mac Node v24 provenance. Q9 authorized `ops/` documentation only. Backend V165/LIFF V153 Release Manifests and other workstreams untouched.
- Central Q15b: https://github.com/nooneknows70/abis-release-control/commit/0437f29870e4d36faef884884dc05ef26e3b8efa

## Office OT S0 — pin-bound Code.gs Stage upload approved, awaiting owner UI (2026-10-26)

- Source Owner approved **one specific source-only import** of locally verified `Code.gs` SHA256 `7aa2be058c94a16fc1cce70cc72bcaef66acaf035451e2cd1f8e364cd2dd6acd` into dedicated Office OT synthetic Stage Script ID `1R96DqSE7DxHsyj1lsXf-WaGgTuuTNA2FWR7jJKN_cZx0z9nusHbmO2ud`. `appsscript.json` must not change.
- ZIP SHA256 `a110bb7961d434ebef11c17b57f53890abe5f4bcb1a3471ee64e513c0f34095e`, extracted candidate exact SHA matches; local Node `node --test` 16/16 PASS. No Stage code has actually been uploaded; available connector has no Apps Script `updateContent` capability. Do not substitute Google Drive raw file upload.
- Approved human next action: replace only default Stage `程式碼.gs` content with exact pinned candidate and save; then provide read-only saved source list, code and manifest screenshot. New project creation already done, do not create another project or second .gs.
- No Apps Script execution, Trigger, Deployment, Script Properties, new Sheet, OAuth grant, real identities, LINE send or Production change authorized. Hold `HOLD_REMOTE_SOURCE_IMPORT_NOT_OBSERVED_AND_RUNTIME_UNAUTHORIZED`.
- LIFF separate V153 release authority, Backend V165 release authority and RC1.35/REST33 unrelated workstreams unaffected. Q1–Q30 unchanged.

## RC1.35 H1D-B — Q16 Q5 ZIP SHA256/CRC owner Mac PASS, Q17 Node v24 synthetic next (2026-10-26)

- Owner Mac Q16 command printed `ARCHIVE_SHA256_MATCH=YES` and `ARCHIVE_ZIP_CRC=PASS`. Pinned original Q5 synthetic ZIP SHA-256 `b55852ef717272bc3f6cea0351e373c198c5eae391eba45f4a110830a3b90c75`; original container ZIP has 19 members, no symlink/path traversal and unzip CRC PASS. Q15b owner-match YES; **synthetic archive integrity PASS_OWNER_TERMINAL**, but **not** a Mac Node v24 test yet.
- Next **Q17** run only fixed Q5 synthetic Node v24 tests in a disposable private `umask 077` directory after rechecking archive SHA; require exactly 68/68 PASS and fake CLI `SIMULATED_PASS_NOT_REAL_IDENTITY_PROOF`; delete disposable workspace afterwards. No installation, live User ID, Token, LINE API, OAuth, messaging, Apps Script/Stage or Production data access.
- Holds `NODE24_SYNTHETIC_PENDING / REAL_OWNER_IDENTITY_NOT_VERIFIED / PRIVATE_REAL_ID_RUNNER_ACL_HOLD / TOKEN_CHANNEL_HOLD / LINE_SEND_HOLD / PRODUCTION_HOLD`. Q9 GitHub `ops/` only; Backend V165, LIFF V153 and unrelated operations remain separate.
- Central Q16 authority https://github.com/nooneknows70/abis-release-control/commit/3ce7fb8756a40a60f396f437a895a5ff5f448e9c

## Office OT S0 — owner reports Stage Code.gs pasted, remote SHA readback pending (2026-10-26)

- Source Owner confirmed the approved pinned Code.gs was **pasted** into dedicated Office OT Stage; Google Drive direct ID metadata shows project modified `2026-10-26T06:16:19.954Z`, originally `2026-10-26T03:53:02.548Z`. This is an owner operation attestation + modification evidence, NOT source SHA256 readback.
- Local pin remains `7aa2be058c94a16fc1cce70cc72bcaef66acaf035451e2cd1f8e364cd2dd6acd`. The native Script Drive media fetch failed 403; no Apps Script getContent connector. `HOLD_REMOTE_SOURCE_SHA256_AND_MANIFEST_READBACK_RUNTIME_UNAUTHORIZED` until remote content and appsscript manifest are read back.
- Next evidence: local `clasp pull` in a private disposable directory to hash remote one .gs/.js file and semantically compare manifest to baseline (or owner paste of full saved source+manifest). No `push`, no `run`, no deployment, no new OAuth, no Production, LINE or data writes.
- Q1–Q30 frozen. Backend V165 and LIFF V153 release authorities are separate; RC1.35/REST33 unaffected.

## RC1.35 H1D-B — Q17 owner Mac Node24 synthetic suite 68/68 CLOSED_PASS (2026-10-26)

- Owner Q17 Mac Terminal reported `Q17_TESTS=68/68_PASS`; `Q17_FAKE_CLI=PASS_NOT_REAL_IDENTITY`; `Q17_NODE_VERSION=v24.21.0`; `Q17_CHILD_UMASK=077`. `PASS_OWNER_TERMINAL` synthetic-only. Q16 owner Mac ZIP SHA256 matched original `b55852ef717272bc3f6cea0351e373c198c5eae391eba45f4a110830a3b90c75` and CRC passed, Q15b archive-owner equality confirmed. This closes the previously pending Node24 compatibility tests; it is not independent audit of Mac filesystem cleanup/ACL or real-person identity.
- **Q5 local synthetic verifier CLOSED_PASS**, distinct from RC1.35 dedicated Apps Script synthetic Stage, the LIFF frontend and Production. No real User ID, live Token, LINE API, Google data, OAuth login, Push, Stage or Production mutation under this workstream.
- H1D-B future Q4 permission remains **conditional** on separately proven isolated real-data runner, runtime identity/Provider and OAuth/ACL; Draft PR #76 fake simulator cannot send. Next phase is **H1DB-3 READ_ONLY** architectural/security static review only; no new management decisions unless credentials/live OAuth/LINE Send/Production are actually needed.
- Still `REAL_UID_NOT_READ / OWNER_IDENTITY_NOT_INDEPENDENTLY_VERIFIED / LOCAL_REAL_UID_RUNNER_HOLD / TOKEN_CHANNEL_HOLD / LIVE_SEND_HOLD / PRODUCTION_HOLD`. LIFF V153 and separate Backend V165 release authorities remain untouched; Q9 GitHub `ops/` SSOT-only update.
- Central handoff https://github.com/nooneknows70/abis-release-control/commit/c873335ad4612bd31b2d316f733f2daa437d5a4c

## Office OT S0 — clasp source and manifest parity owner PASS, execution not authorized (2026-10-26)

- Source Owner reported read-only local `clasp pull` verification: `STAGE_SOURCE_FILES=1`, `STAGE_SOURCE_SHA256_MATCH=YES`, `STAGE_MANIFEST_BASELINE_MATCH=YES` in dedicated Office OT Stage. Pin `7aa2be058c94a16fc1cce70cc72bcaef66acaf035451e2cd1f8e364cd2dd6acd`. **Source parity PASS_OWNER_TERMINAL_ATTESTED**; not independent Apps Script API runtime readback.
- Previous manual upload was approved for this exact source; source readback now clears the upload verification Gate. **No Stage Run/execution has occurred or been authorized.** Next sole human authorization: one invocation of existing pure `abisOtS0SyntheticExample_` fake-only function if selectable without new source changes or OAuth scopes. Abort on function unavailable, OAuth prompt or any real data access requirement.
- Keep all Stage Sheet/Trigger/Deployment/Script Properties, LIFF/LINE, Payroll and Production writes blocked. Q1–Q30 frozen. Backend V165 and LIFF V153 Release Manifests unchanged.

## RC1.35 H1D-B H1DB-3 — LIFF/OAuth static side-effect gate and Q18 Business ID link (2026-10-26)

- Static Git `main` LIFF `index.html` blob equals independently pinned **V153 LIFF source**. Existing bridge calls `liff.getIDToken()` and `liff.getAccessToken()`, then submits both to Backend `mode=liffauth` automatically; Backend V165 Main.js (source pin parity PASS) can update LINE_BIND, create LINE Session/audit and run binding setup. Existing live LIFF entry is **NOT** READ_ONLY and cannot be used as an H1DB-3 test.
- Existing Backend OAuth callback can upsert LINE binding and invoke a LINE test Push, so live OAuth login remains BLOCKED. No actual LINE User ID, OAuth token, LINE API or Production mutation was performed in this audit.
- LINE official docs (https://developers.line.biz/en/docs/line-login/getting-started/) say a Linked LINE Official Account under LINE Login can only be from the **same Provider**. Q7 owner attested `ABIS 內部員工服務` as Linked Official Account and Q2 matched its Messaging API Channel UI. That supports provider compatibility **at OWNER_ATTESTED level only**, not an authenticated Provider/runtime or credential-to-channel proof.
- Per official documentation (https://developers.line.biz/en/docs/line-developers-console/managing-roles/), `Your user ID` can be displayed for a developer linked to a personal LINE through Business ID; it is a **future independent identity candidate**, not something to open/copy now. First do **Q18** READ_ONLY: existing Business ID Profile LINE account link status must match Q1 Source Owner's own personal LINE phone account. No linked account creation/deletion, new login, private data, screenshots, User ID, Secret or OAuth. Fail closed if unclear.
- Future isolated real-data verifier must not import the PR #76 fake module that embeds recipient ID in `mockBody.to`, and must have separately reviewed ACL/no logging/independent identity before any single UID read. Q17 68/68 synthetic-only is CLOSED_PASS, not real identity authorization.
- `H1DB3_STATIC_PASS / Q18_BUSINESS_ID_LINK_PENDING / REAL_UID_HOLD / RUNNER_ACL_HOLD / TOKEN_CHANNEL_HOLD / SEND_HOLD / PRODUCTION_HOLD`. Q9 permits GitHub `ops/` notes only; existing LIFF Manifest V153 and Backend V165 independent. Central https://github.com/nooneknows70/abis-release-control/commit/01d681dca57412c684b392cb1aaaacf92c8c4dc0

## Office OT S0 — single synthetic execution approved, private function selector preflight HOLD (2026-10-26)

- Source Owner expressly authorized only a single synthetic invocation of existing `abisOtS0SyntheticExample_()` with fake fixture `SYN-OT-001` on dedicated Office OT Stage Script ID `1R96DqSE7DxHsyj1lsXf-WaGgTuuTNA2FWR7jJKN_cZx0z9nusHbmO2ud`; prior source/manifest 3/3 Owner clasp PASS remains valid. No run performed.
- Google Apps Script treats functions whose names end `_` as private and hides them from the editor Run selection dropdown. Google official: https://googleappsscript.blogspot.com/2010/06/hiding-helper-functions.html . The pinned `Code.gs` declares only trailing-underscore functions, confirmed by local static inspection. Neither an Apps Script editor connector nor native execution connector exists.
- Owner condition **if exact existing function not directly selectable, immediately HOLD; do not modify code or add wrapper**. Therefore `HOLD_STAGE_PRIVATE_TRAILING_UNDERSCORE_ENTRYPOINT_NOT_SELECTABLE_EXPECTED_UI_CHECK_PENDING` until owner inspects dropdown (no screenshot/owner UI answer yet). Ask only for `FUNCTION_SELECTABLE=YES/NO` for exact function; if NO, do not click Run, Debug, rename or switch functions. Count 0/1, conditional permission unconsumed.
- No LINE/LIFF, OAuth escalation, Script Properties, Trigger, Deployment, Stage business data, Payroll or Production changes. Backend V165 and frontend V153 separate release authorities; Q1–Q30 frozen and RC1.35 other workstream unaffected.

## Office OT S0 — owner FUNCTION_SELECTABLE=NO, keep Stage runtime HOLD (2026-10-26)

- Source Owner directly reports `FUNCTION_SELECTABLE=NO` for the authorized Stage `abisOtS0SyntheticExample_()`, whose trailing underscore makes it a private entrypoint hidden from the Apps Script editor Run selector. Prior Code.gs source/manifest owner clasp 3/3 parity PASS remains intact.
- Fail closed per explicit owner requirement: `HOLD_PRIVATE_FUNCTION_ENTRYPOINT_CONFIRMED_UNSELECTABLE_BY_SOURCE_OWNER`. The **one-time synthetic run authorization remains unconsumed (0/1)**; no alternate execution function or path may be substituted, and no Run/Debug was performed by this workstream. Do not change `Code.gs`, `appsscript.json`, OAuth, Properties, Triggers, Deployments, LINE or Production.
- No additional operator inspection is required for dropdown visibility. If Source Owner later requests S0 execution to resume, that would require a **separately authorized** minimal public synthetic entrypoint source change, a fresh source SHA256/retest/readback, and separate invocation authorization. No such modification is approved by this message.
- This update modifies GitHub `ops/` evidence only. Backend V165 and LIFF V153 Release Manifests, RC1.35, REST33 and Office OT Q1–Q30 policy remain unchanged.

## Office OT S0 | screenshot confirms trailing-underscore private entrypoint HOLD (2026-10-26)

- Source Owner submitted a Code Editor screenshot showing `沒有函式` in the Run dropdown and line 57 `function abisOtS0SyntheticExample_() {`. Image SHA256 `55fdd767a467dc3aa3ab4d2b821fe3196fdfdaf293d3e294811b937a4ddc428e`; no raw screenshot or code was committed to GitHub.
- Official Google Apps Script behavior: functions ending in `_` are private and absent from the editor Run dropdown. https://googleappsscript.blogspot.com/2010/06/hiding-helper-functions.html and https://developers.google.com/apps-script/guides/html/communication .
- The prior `FUNCTION_SELECTABLE=NO` HOLD is now also **supported by a supplied screenshot**; the source hash/manifest operator clasp 3/3 PASS stays valid. Existing authorized synthetic single invocation remains unconsumed (0/1), Stage Run/Debug 0.
- Potential minimal solution, **NOT AUTHORIZED**: remove the final underscore from the example function name only, keep `abisOtS0SyntheticPreview_` private; would require separate Source Owner source-delta authorization, new offline tests/hash, Stage readback and separate function invocation authorization. The Owner has NOT requested or authorized the edit, therefore retain HOLD.
- No Code.gs, appsscript.json, OAuth, Properties, Trigger, Deployment, Stage data, LINE, Payroll, Raw Punch or Production changes. Backend V165 and LIFF V153 release authority and frozen Q1-Q30 policy stay unchanged.


## RC1.35 H1D-B Q18 — Business ID personal LINE linkage (2026-10-26)

- Source Owner Q18=A: existing LINE Developers Console Business ID Profile links to the SAME personal handset LINE account designated in Q1. Evidence `PASS_SOURCE_OWNER_ATTESTED_UI_ONLY`; no independent platform User ID equality verification, real User ID read, credential read or LINE API.
- Q17 Node24 68/68 synthetic CLOSED_PASS remains unchanged; existing live LIFF/OAuth paths blocked due to binding/session/audit/potential push side effects. Draft PR #76 fake-only module is not a real UID verifier.
- Next Q19: read-only local Mac FileVault status `fdesetup status` without sudo, report ON/OFF/UNKNOWN. This is a single OS disk-encryption prerequisite only, not full runner or real UID clearance. Do not access identifiers, run login/OAuth, modify settings, send LINE or touch Production.
- Gate `H1DB3_Q18_OWNER_BUSINESS_ID_LINK_PASS__Q19_MACOS_FILEVAULT_READ_ONLY_PENDING`; Q9 authorizes ops/ SSOT documentation only. Backend V165 and LIFF V153 manifest authorities remain unchanged. All UID/ACL/OAuth/token/channel/sending/Production HOLD maintained.

## RC1.35 H1D-B Q19 — FileVault owner-attested ON; Q20 private-temp metadata READ_ONLY (2026-10-26)

- **Q19=A**: Source Owner confirms FileVault is ON on the existing Mac. Gate `FILEVAULT_ON_OWNER_ATTESTED`, evidence is direct Source Owner choice **without attached `fdesetup status` terminal readback** or independently authenticated OS metadata. This is at-rest encryption confirmation only, not full isolated-runner approval.
- **Q20 next single safe metadata gate**: read (not change) the existing macOS Node `os.tmpdir()` final-directory `lstat` metadata, and report directory type, non-symlink final entry, ownership equals current process UID, and exact mode `0700`, all as YES/NO only. Do not print real path, owner ID, username, token, personal data, filesystem contents or environment variables. No mkdir, chmod, write, network, LINE API or OAuth.
- Q20 success will be `PASS_OWNER_TERMINAL_METADATA_ONLY`; it will **not** prove ancestor directory permissions, macOS extended ACLs, runtime network isolation, actual UID/Provider proof, Token-to-Channel, or secure sender capability. If any item fails or is unavailable, fail closed and retain private-runner HOLD. Q17 synthetic Node24 68/68 remains CLOSED_PASS; Q18 Business-ID linkage remains owner-attested PASS.
- All real LINE User ID, credentials, LINE send, Apps Script/Stage/Production gates remain HOLD; live LIFF/OAuth auth routes cannot be used as READ_ONLY probes due to known business-data/session/audit/push side effects. PR #76 remains Draft; independent Backend V165 and LIFF V153 release manifests unchanged. Q9 documentation writes only to central/Backend/LIFF `ops/` SSOT.
- **Current gate:** `H1DB3_Q19_FILEVAULT_ON_OWNER_ATTESTED__Q20_PRIVATE_TMPDIR_METADATA_READ_ONLY_PENDING`; nextAction: Q20 READ_ONLY Mac: inspect os.tmpdir() final-directory metadata with local Node built-ins only; report IS_DIRECTORY, NOT_SYMLINK, OWNER_MATCH, MODE_0700 as YES/NO, without printing path/UID or creating files. No real User ID, token, OAuth, LINE API or Production. Directory ACL/ancestor chain/network isolation remain separate HOLD.

## RC1.35 H1D-B Q20 — temp-directory final metadata owner PASS; Q21 ACL READ_ONLY pending (2026-10-26)

- Q20=A: Source Owner reports Q20_IS_DIRECTORY=YES, Q20_NOT_SYMLINK=YES, Q20_OWNER_MATCH=YES and Q20_MODE_0700=YES on the same Mac used in Q17. **Evidence** `PASS_SOURCE_OWNER_ATTESTED_NO_RAW_TERMINAL_OUTPUT`; no independently authenticated macOS result. This closes the **final os.tmpdir() directory** basic-metadata check, NOT full filesystem ACL/ancestry/process/network isolation.
- Q19 FileVault ON and Q18 Business ID personal LINE link remain Source Owner attested. Q17 68/68 synthetic remains CLOSED_PASS; Draft PR #76 remains OPEN/DRAFT/unmerged.
- Next one READ_ONLY Q21: Inspect macOS ACL for current Node os.tmpdir() directory with local macOS `/bin/ls -lde` from Node child process. Programmatically classify **ACL absent YES/NO/UNKNOWN**; do **not** output or store actual path, account names, UID, ACL entries or personal data, do not change permissions, open files, create temp files, run login/OAuth or call LINE API. Presence of ACL, execution failure, or ambiguous result => HOLD and manual security review; absence alone does not approve actual identity/runner.
- Security basis: macOS `ls -le` can display ACL metadata even when POSIX 0700 is set; `+` / enumerated ACL entries signal further ACL review. A final-directory ACL absence does NOT establish parent-directory access, other macOS extended attributes, remote/logging behavior, identity or Provider correctness, or Token-to-Channel proof.
- Still `REAL_UID_NOT_READ / TOKEN_HOLD / INDEPENDENT_OWNER_UID_MATCH_HOLD / LOCAL_RUNNER_OAUTH_ACL_NETWORK_HOLD / LIVE_LIFF_BLOCKED / LINE_SEND_HOLD / PRODUCTION_HOLD`. Backend V165 and LIFF V153 release manifests unchanged; Q9 authorizes only `ops/` documentation writes across central/Backend/LIFF.
- **Gate:** `H1DB3_Q20_PRIVATE_TMPDIR_METADATA_PASS_OWNER_ATTESTED__Q21_TMPDIR_ACL_READ_ONLY_PENDING`. **Next:** Q21 READ_ONLY on the same existing Mac: inspect ONLY os.tmpdir() directory ACL metadata using Node spawnSync('/bin/ls',['-lde',os.tmpdir()]) with stdout suppressed from reporting; return Q21_ACL_INSPECTION=PASS/HOLD and Q21_ACL_ABSENT=YES/NO/UNKNOWN. No path, usernames, UID, ACL body, credentials, files, network, login, LINE API or edits. Other ancestor, xattrs, process, network and independent real identity checks remain HOLD.

## RC1.35 H1D-B Q21 — temporary-directory ACL absence owner-attested; Q22 canonical ancestor metadata READ_ONLY (2026-10-26)

- **Decision Q21=A**: Source Owner reports the exact two safe local terminal result categories `Q21_ACL_INSPECTION=PASS` and `Q21_ACL_ABSENT=YES`. This is `PASS_SOURCE_OWNER_ATTESTED`, **not independently authenticated macOS terminal readback**. It applies only to the current Node `os.tmpdir()` final directory ACL metadata; no ACL body, owner identity, path, name or sensitive value was supplied.
- **Cumulative frozen gates:** Q17 68/68 offline synthetic CLOSED_PASS; Q18 same personal handset LINE account linked to Developers Business ID owner-attested; Q19 FileVault ON owner-attested; Q20 final tmpdir directory/non-symlink/owner match/0700 four checks owner-attested; Q21 final tmpdir ACL absent owner-attested. No actual real LINE User ID or tokens were collected and no platform identity check has been performed.
- **Next Q22:** On the same Mac, inspect only **canonical path ancestors** (parents of `fs.realpathSync(os.tmpdir())`) via Node's local, read-only `fs.lstatSync` metadata. A canonical ancestor must be a directory owned by root or the local running user; group/world-writable ancestors are disallowed unless root-owned and sticky-protected. Output classification only, no printed path, OS UID or ACL text, no files created or permissions modified. If any violation output NO, and if execution/inspection cannot complete output UNKNOWN; both remain HOLD. Success cannot prove lexical symlink chain, ancestor ACL, extended attributes, race freedom or local runner/network/credential safety.
- **Release authority refreshed:** Backend GitHub Release Manifest now V166 PROD_CURRENT and rollback V165, per separate R2174 canonical-seed workstream; LIFF Release Manifest V153 PROD_CURRENT. RC1.35 PR #76 remains open/draft/unmerged. This Q21 action does not change source, manifest, deployment, Stage, LINE, business SSOT or Production.
- **Holds:** real UID / independent owner-binding match / credentials / Token-to-Channel / current Rich Menu runtime / local OS/network/OAuth/ACL runner / LIVE push / Production. Q9 permits GitHub `ops/` bookkeeping only.
- **Current gate:** `H1DB3_Q21_TMPDIR_ACL_ABSENT_PASS_OWNER_ATTESTED__Q22_TMPDIR_CANONICAL_ANCESTORS_READ_ONLY_PENDING`.
- **Next action:** Q22 READ_ONLY on same Mac: inspect canonicalized existing os.tmpdir() ancestor directory metadata using Node fs.realpathSync/lstatSync; report only Q22_ANCESTOR_CHECK=PASS/HOLD and Q22_ANCESTOR_SAFE=YES/NO/UNKNOWN. Require each canonical ancestor root-owned or current macOS user-owned and no group/other write except root-owned sticky directories. Do not print paths, Unix UID, names, file contents, ACL body or any LINE data; no mkdir/chmod/login/LINE API/Production writes. Other lexical symlink, ancestor ACL, process/network/credential gates remain HOLD.

## RC1.35 H1D-B Q22/Q23 — Reconcile Q22 and owner-attested ancestor ACL PASS (2026-10-26)

- **Previous cross-Repo difference resolved by scoped GitHub `ops/` repair:** Previous LIFF `ops/PROJECT_STATE.json` stopped at Q22 pending while central and Backend had already recorded Q22=A. The Q22 evidence was read from the current central SSOT and copied into LIFF; the Source Owner's current Q23=A was recorded at the same time. This is an `ops/` record repair, not a source/Release/LINE/Production change. Previous safety-blocked write was not deemed successful.
- **Q22=A owner evidence:** `Q22_ANCESTOR_CHECK=PASS`, `Q22_ANCESTOR_SAFE=YES`, canonical os.tmpdir() ancestor owner and POSIX write/sticky check. `PASS_SOURCE_OWNER_ATTESTED`, no independent Mac terminal readback.
- **Q23=A owner evidence:** `Q23_ANCESTOR_ACL_CHECK=PASS`, `Q23_ANCESTOR_ACL_ABSENT=YES`; canonical ancestor ACL metadata check reports no ACL. This is `PASS_SOURCE_OWNER_ATTESTED_NO_INDEPENDENT_TERMINAL_READBACK`; not an independent filesystem or runtime security certification.
- **Q24 next READ_ONLY technical gate:** Inspect os.tmpdir() *lexical* path components' symbolic links (macOS system paths can include symlinks), including symlink ownership and containing parent access protection; allow root-owned trusted system symlink under a protected parent. Output classifications only; no path, user name, numeric UID, ACL text, real LINE User ID, token/secret, or data access; no file creation, chmod, OAuth, login, LINE API, sender or Production.
- **HOLD unchanged:** lexical route only partly known; process/network/credential/ACL runner, independent LINE identity, token-to-channel, real LINE push and Production remain unapproved. Q17 68/68 hermetic and Q18-Q23 attested results do not authorize real identity collection. Backend V166 PROD_CURRENT and LIFF V153 PROD_CURRENT Release Manifests remain independent; RC1.35 PR #76 Draft/unmerged.
- **Gate:** `H1DB3_Q23_CANONICAL_ANCESTOR_ACL_ABSENT_PASS_OWNER_ATTESTED__Q24_LEXICAL_SYMLINK_CHAIN_READ_ONLY_PENDING`.

## RC1.35 H1D-B Q24 — owner-attested lexical symlink preflight (2026-10-26)

- Q24=A: local lexical temp-path link check PASS/YES as reported by Source Owner. Evidence tier PASS_OWNER_ATTESTED; no independent Mac readback. No real LINE User ID, token or login has been read or executed.
- Q25=A was reported afterward; separate process run-as gate, owner-attested only. Production, messaging and independent identity verification remain HOLD. Backend V166 and LIFF V153 manifests untouched.

## RC1.35 H1D-B Q25 — owner-attested Node non-root check (2026-10-26)

- Q25=A: Source Owner reports four checks YES (Darwin, non-root Node, real/effective Unix UID match and GID match) with overall PASS. Evidence PASS_OWNER_ATTESTED; not an independently authenticated Mac terminal result. This is a local Unix process classification, not LINE identity verification.
- Q24 was reconciled on all three SSOTs. Q26 is READ_ONLY local Node debug/preload status, without accessing ID/token or making a network call. No actual runner, LINE API, OAuth or Production authorization; Backend V166 and LIFF V153 manifests unchanged.
- Gate: `H1DB3_Q25_LOCAL_NODE_NONROOT_PROCESS_IDENTITY_PASS_OWNER_ATTESTED__Q26_NODE_DEBUG_PRELOAD_READ_ONLY_PENDING`.

## RC1.35 H1D-B Q26 — local Node debugger/preload owner PASS; Q27 executable metadata READ_ONLY (2026-10-26)

- **Q26=A Source Owner**: Mac Node diagnostic reports `Q26_INSPECTOR_INACTIVE=YES`, `Q26_DEBUG_PRELOAD_FLAGS_ABSENT=YES`, `Q26_NODE_OPTIONS_UNSET=YES`, `Q26_STATUS=PASS`. Evidence `PASS_SOURCE_OWNER_ATTESTED_NO_INDEPENDENT_MAC_TERMINAL_READBACK`; these results apply **only to the transient Node process used for Q26**.
- Q25 Darwin/non-root/real-effective UID-GID match remains Source Owner attested. Q17 synthetic 68/68 CLOSED_PASS, Q18–Q26 identity/OS gates do not imply independent LINE identity, Production privilege, isolated future runner, credential or network security certification.
- **Next Q27 (READ_ONLY):** inspect the canonical target of currently running Node executable using local `fs.realpathSync(process.execPath)` and `fs.lstatSync()` metadata; require regular file, root/current Unix-owner, no group/other writable bits, no setuid/setgid bits. Output boolean categories only; do not output binary path, UID, account name, env value, file content or hashes. No filesystem modifications, login/OAuth, real LINE User ID/Token, network or LINE call. Passing does not verify code signature, dependency integrity, symlink races, or future runner environment.
- All real identity/Token-to-Channel/LINE API/send and Production hold gates remain. Backend Release Manifest V166 PROD_CURRENT, LIFF Release Manifest V153 PROD_CURRENT; RC1.35 feature PR #76 remains Draft/unmerged. Changes are confined to previously authorized GitHub `ops/` documentation.
- **Gate:** `H1DB3_Q26_LOCAL_NODE_DEBUG_PRELOAD_PASS_OWNER_ATTESTED__Q27_NODE_EXECUTABLE_TRUST_READ_ONLY_PENDING`.
- **NextAction:** Q27 READ_ONLY same Source Owner Mac: inspect current Node executable canonical target metadata via Node fs.realpathSync/lstatSync only. Report Q27_BINARY_REGULAR_FILE, Q27_BINARY_OWNER_TRUSTED (root/current local Unix user), Q27_BINARY_NO_GROUP_OTHER_WRITE, Q27_BINARY_NO_SETID and Q27_STATUS as YES/NO/PASS/HOLD only. Do not print binary paths, usernames, Unix IDs, file contents/hash, environment values or credentials. No sudo, writes, network, LINE User ID/Token, login, LINE API or Production. A PASS does not establish code signing, dependency integrity, or future runner safety.

## RC1.35 H1D-B Q27 — Node executable owner/mode PASS; Q28 binary ancestor directories READ_ONLY (2026-10-26)

- **Q27=A Source Owner**: current Mac Node executable canonical file checks `REGULAR_FILE=YES`, `OWNER_TRUSTED=YES`, `NO_GROUP_OTHER_WRITE=YES`, `NO_SETID=YES`, `STATUS=PASS`. Evidence `PASS_OWNER_ATTESTED` without independent terminal readback; this does not certify code signing, binary integrity or executable parent directories.
- **Next Q28**: inspect only ancestor directories of canonical Node executable via fs.realpathSync/lstatSync, checking directories, root/local owner and protected write/sticky bits, returning classification only. Never print paths, IDs, environment or content; no filesystem changes, login, LINE API, token, real LINE user identity, sending or Production.
- Latest GitHub release manifest read-only: Backend **V167 PROD_CURRENT** from separate R2174 scoped source epoch (rollback V166), LIFF **V153 PROD_CURRENT**. RC1.35 PR #76 OPEN DRAFT, not merged. No Release/Source/Apps Script mutation in this Q27 work.
- Still HOLD: actual real UID and independent LINE provider identity, token-to-channel, LIFF write-capable login/OAuth, secure future runner ACL/process/network/dependency/credentials, actual LINE send and Production.
- Gate `H1DB3_Q27_NODE_BINARY_METADATA_PASS_OWNER_ATTESTED__Q28_BINARY_PARENT_DIRS_READ_ONLY_PENDING`.
- NextAction: Q28 READ_ONLY same Mac: inspect ancestor directories of fs.realpathSync(process.execPath), including executable parent to filesystem root, using local Node lstat metadata. Require directory, trusted owner (root or current Unix user), and no group/other write except root-owned sticky directory. Report Q28_BINARY_PARENT_CHECK=PASS/HOLD and Q28_BINARY_PARENT_SAFE=YES/NO/UNKNOWN only; never print paths, IDs, environment or file contents. No file/network/LINE/OAuth/Production changes. Passing does not prove ACL, lexical symlink chain, code signature, deps, or future runner isolation.

## RC1.35 H1D-B Q28 — Node binary canonical ancestor metadata owner PASS; Q29 ACL READ_ONLY (2026-10-26)

- **Q28=A Source Owner report:** `Q28_BINARY_PARENT_CHECK=PASS` and `Q28_BINARY_PARENT_SAFE=YES`. Source Owner attestation only, **no independently authenticated Mac terminal readback**. This covers Node executable canonical parent-chain directory type, root/current local Unix ownership, group/other write and root-sticky exception, not ACLs.
- **Q29 next READ_ONLY:** inspect only canonical Node binary ancestor ACL via macOS `/bin/ls -lde`; return PASS/YES, PASS/NO or HOLD/UNKNOWN classifications, no path, Unix ID, account name or ACL entries printed. ACL present/ambiguous => stay HOLD for review; do not change permissions. Subsequent lexical-symlink, code-signing, dependency/runner, process/network, OAuth/credentials and actual identity verification still HOLD.
- **Fresh authority:** Backend Release Manifest V167 `PROD_CURRENT` with rollback V166, LIFF Release Manifest V153 `PROD_CURRENT` (independent); RC1.35 PR #76 remains OPEN/DRAFT/unmerged. No release, source, manifest, LINE or Production change within this RC1.35 step.
- **Holds remain:** real LINE User ID unread, Token/Secret unread, independent Owner/provider identity not proven, active LINE/LIFF login and send not authorized, secure real-data runner and Production not authorized.
- **Gate:** `H1DB3_Q28_BINARY_PARENT_METADATA_PASS_OWNER_ATTESTED__Q29_BINARY_PARENT_ACL_READ_ONLY_PENDING`.
- **Next action:** Q29 READ_ONLY same Source Owner Mac: inspect ACL metadata on canonical ancestor directories of fs.realpathSync(process.execPath) via macOS /bin/ls -lde, up to filesystem root; classify Q29_BINARY_PARENT_ACL_CHECK=PASS/HOLD and Q29_BINARY_PARENT_ACL_ABSENT=YES/NO/UNKNOWN. Do not print paths, names, Unix IDs, ACL entries, file contents or credentials. No file/network changes, LINE User ID/Token, OAuth/login, LINE API/send or Production. PASS remains owner-reported and does not establish code signing, race safety or full runner isolation.

## RC1.35 H1D-B Q29 — Node executable ancestor ACL Owner PASS; Q30 lexical symlink READ_ONLY (2026-10-26)

- **Q29=A, Source Owner attestation:** `Q29_BINARY_PARENT_ACL_CHECK=PASS` and `Q29_BINARY_PARENT_ACL_ABSENT=YES`. This verifies only the reported **absence of extra ACL** on canonical Node executable ancestor directories. Evidence `PASS_SOURCE_OWNER_ATTESTED_NO_INDEPENDENT_MAC_TERMINAL_READBACK`; no raw terminal output or independent OS attestation obtained.
- **Q28 and prior:** Q17 synthetic 68/68 CLOSED_PASS; Q18–Q29 Source Owner preflight results are owner-attested, not independent real LINE identity or isolated real-data runner certification.
- **Q30 next READ_ONLY:** inspect the lexical `process.execPath` path components (as distinct from canonical realpath already checked in Q27–Q29), parent directory ownership/write/sticky protection and any symlink entry owner, allowing root/current-user-owned links under protected parents. Return only categorical PASS/YES, PASS/NO or HOLD/UNKNOWN without printing path, UID, symlink target, ACL or contents. Do not change files, log in, access real LINE data, call LINE API or modify Production. Success does not prove time-of-check/time-of-use race freedom or code-signing/dependency integrity.
- **Authority (GitHub manifest, READ_ONLY):** Backend V167 PROD_CURRENT rollback V166, LIFF V153 PROD_CURRENT; RC1.35 feature PR #76 OPEN/DRAFT/unmerged. No Source/Release/Apps Script/Stage/business data mutation.
- **Unchanged holds:** real LINE User ID and credentials remain unread, independent same-Provider identity match, Token-to-Channel, real LIFF/OAuth (write side effects), runner network/credentials/ACL, LINE send and Production all HOLD.
- **Gate:** `H1DB3_Q29_BINARY_PARENT_ACL_ABSENT_PASS_OWNER_ATTESTED__Q30_BINARY_LEXICAL_SYMLINK_READ_ONLY_PENDING`.
- **Next action:** Q30 READ_ONLY same Mac: examine lexical process.execPath path components, containing-parent ownership and mode, and any symlink entry ownership, using Node fs metadata. Return Q30_BINARY_LEXICAL_LINK_CHECK=PASS/HOLD and Q30_BINARY_LEXICAL_LINK_SAFE=YES/NO/UNKNOWN only. Permit root/current-user-owned links under protected parents; require final resolved entry regular file. Do not print paths, IDs, link targets, env, contents or sensitive data. No file modifications, login, LINE API, push or Production. PASS does not prove race freedom or code signing.

## RC1.35 H1D-B Q30 — Node executable lexical symlink Owner PASS; Q31 offline codesign READ_ONLY (2026-10-26)

- **Q30=A**: Source Owner attests `Q30_BINARY_LEXICAL_LINK_CHECK=PASS` and `Q30_BINARY_LEXICAL_LINK_SAFE=YES` for the Node `process.execPath` lexical components. This is **owner-attested output only**, with no independently authenticated terminal proof, path, Unix identifier, symlink target, credential or real LINE User ID captured. Canonical Node binary target, ancestors and ACL preflight Q27–Q29 were also Source Owner attested.
- **Scope limits:** lexical ownership and containing-parent protection are preliminary; they do not prove TOCTOU/symlink-swap freedom, binary signature trust, package/dependency integrity, runtime network isolation, future Runner ACL/credential controls or LINE identity.
- **Next Q31 (READ_ONLY):** verify code-signature seal and distinguish ad-hoc from a non-ad-hoc signer using local macOS `codesign` on `fs.realpathSync(process.execPath)`. Suppress paths, signer name/TeamIdentifier and raw tool output; print only categorical tool/verification/non-ad-hoc outcomes. An ad-hoc, unsigned, unverifiable or indeterminate signature keeps the corresponding gate HOLD, with no automatic modifications. Even PASS does not independently prove the publisher's trust chain, notarization or safe dependency graph.
- **Current GitHub release authority:** Backend V167 PROD_CURRENT (rollback V166), LIFF V153 PROD_CURRENT; unrelated R2174 release, no modification by RC1.35. PR #76 remains OPEN/DRAFT/unmerged. Q17 hermetic 68/68 CLOSED_PASS; Q18–Q30 relevant Owner-only PASS results preserved.
- **Explicit HARD HOLD:** no real LINE User ID, Token/Secret or LINE API read; no login/OAuth, real LINE push, Production change, or private real-data runner authorization. GitHub writes only in frozen Q9 approved central/Backend/LIFF `ops/` SSOT scope.
- **Gate:** `H1DB3_Q30_BINARY_LEXICAL_LINK_PASS_OWNER_ATTESTED__Q31_NODE_CODESIGN_READ_ONLY_PENDING`.
- **NextAction:** Q31 READ_ONLY same Mac Node executable macOS code-signature seal and non-ad-hoc provenance preflight via /usr/bin/codesign --verify --strict --verbose=0 and --display --verbose=4 against fs.realpathSync(process.execPath), local-only. Report Q31_CODESIGN_TOOL_OK, Q31_SIGNATURE_SEAL_VALID, Q31_SIGNER_NON_ADHOC YES/NO and Q31_STATUS PASS/HOLD/UNKNOWN; do not print paths, signer names, TeamIdentifier, executable contents, environment or secrets; no network, login, LINE API, send or Production. This is local code-signing metadata only, not full notarization/trust, dependency integrity or independent real-identity runner authorization.

## RC1.35 H1D-B Q31 — codesign Owner PASS; stop per-step tests and switch to one-shot offline batch (2026-10-26)

- **Source Owner Q31=A**: reports `Q31_CODESIGN_TOOL_OK=YES`, `Q31_SIGNATURE_SEAL_VALID=YES`, `Q31_SIGNER_NON_ADHOC=YES`, overall `Q31_STATUS=PASS`. Evidence **`PASS_SOURCE_OWNER_ATTESTED_NO_INDEPENDENT_MAC_TERMINAL_READBACK`**; does not independently verify Apple publisher trust chain, notarization or executable dependencies.
- **New Owner workflow decision:** discontinue Q32/Q33/... individual Mac test prompts. Prepare/check all remaining allowed offline synthetic and static evidence first, then execute **one single batch**, reviewing one consolidated PASS/HOLD. Do not infer authorization for Source edits or Stage/LINE/Production from this test-process change.
- **Offline READ_ONLY Mac bundle PREPARED (not run on Source Owner Mac):** `ABIS_RC135_H1DB_READONLY_BATCH_20261026.zip` contains `ABIS_RC135_H1DB_LOCAL_READONLY_BATCH.cjs`, one-run 23-check local preflight and README. JS SHA256 `a302e16511e7fa1c6b74495a3f389218908ff330980e6e22998869facb83ae25`. Non-Mac isolated environment passed JS syntax check; non-Mac execution unsurprisingly HOLD and is NOT a Mac PASS. Package provided as current ChatGPT conversation attachment; not committed to GitHub source.
- **Consolidated offline acceptance components:** 23 local host metadata/signed-binary checks; fresh PR #76 static source and hermetic fixture review; revalidate Q17 historical synthetic `68/68_PASS` against pinned source when possible; 3-Repo registry/manifests parity and release drift review. `68/68` is historical Owner evidence until current commit rerun. Results should have a **single** ACCEPTANCE PASS/HOLD summary, not 23 conversations.
- **Freeze authority:** PR #76 remains OPEN/DRAFT/unmerged, Backend release manifest V167 PROD_CURRENT rollback V166, LIFF V153 PROD_CURRENT. The batch artifact is local and optional; **feature completion, new CI, source implementation, Apps Script changes and actual external service testing have not been authorized or performed**. Batch preflight cannot prove network isolation, credentials or real provider identity.
- **Hard holds:** REAL_LINE_UID_NOT_READ, TOKEN_SECRET_NOT_READ, TOKEN_TO_CHANNEL_UNVERIFIED, REAL_LIFF_AUTH_NOT_READ_ONLY, ISOLATED_RUNNER_PROCESS_NETWORK_CREDENTIALS_UNVERIFIED, LINE_API_SEND_HOLD, PRODUCTION_HOLD. No real LINE User ID, Token, OAuth/login, LINE API, actual push or Production modifications.
- **Write scope:** existing Q9 approval permits only central/Backend/LIFF GitHub `ops/` SSOT update. Do not touch source, Release Manifest, PR contents/status, CI, Apps Script, Stage, LINE or Production.
- **Gate:** `H1DB3_Q31_CODESIGN_PASS_OWNER_ATTESTED__ONE_SHOT_READ_ONLY_BATCH_PREPARED_LIVE_HOLD`.
- **NextAction:** Stop issuing numbered Q32+ local OS micro-tests. Prepare/review RC1.35 PR#76 static hermetic coverage, Q17 68/68 historical baseline and 3 Repo SSOT/release parity as one READ_ONLY acceptance plan. Mac single-run 23-check preflight bundle is ready but NOT executed on owner's Mac. Present one consolidated PASS/HOLD after final batch; no new source/CI/Stage/LINE/Production writes. Any source implementation or live LINE/User ID/Token/OAuth test requires separately scoped Source Owner authorization.

## RC1.35 H1D-B one-shot offline test-bundle V2 and static PR#76 CI readback (2026-10-26)

- The Source Owner's Q31=A and request to stop step-by-step Q32+ OS tests were already recorded in all three Repos as `ONE_SHOT_BATCH_INSTEAD_OF_SEQUENTIAL_MICRO_GATES`. Do not create further one-question-at-a-time micro Gates.
- Alternate V2 conversation-local ZIP `ABIS_RC135_H1DB_ONE_SHOT_READONLY_V2_20261026.zip` (SHA256 `9125c238bac4bff54326e3a90b620afe64701c8e68acf4cbd23cf89096bef0a3`) contains 23 read-only macOS host checks and acceptance matrix. Script SHA256 `fda5ae092b64f3af261fab20f5906d73c797811d6ef35c83b5f3e23b72d6fc6f`. It passed Node syntax and ZIP integrity checks in the assistant container. Linux/non-Mac execution yielded expected HOLD and is **NOT** a Mac PASS. Source Owner Mac execution **NOT DONE**. It is distinct from the GitHub-referenced earlier ZIP and does NOT replace that older SHA.
- Fresh GitHub PR#76 `OPEN DRAFT UNMERGED` HEAD `906c9bd2e24583be97930eb7e7611cebfb12e7c9`, 40 changed files; workflow `Phase1A RC1.35 offline safe checks` run `40225574085` at this HEAD had one hermetic job completed `SUCCESS`. It uses synthetic/stubbed tests; no real LINE ID/Token/API call. Q17 68/68 synthetic PASS remains historical Owner-attested, **not a fresh rerun** at this HEAD.
- GitHub Release Manifests remain Backend V167 `PROD_CURRENT` and LIFF V153 `PROD_CURRENT`, independent of unmerged RC1.35 feature. Read-only SSOT parity and CI evidence must be checked at final batch acceptance against fresh SHAs. Current evidence is not production-ready.
- **Frozen boundary:** no GitHub source, PR, CI, release manifest, Apps Script, OAuth, Stage, LINE or Production writes. Only `ops/` SSOT notes within prior Q9 authorization. Actual LINE User ID/Token, provider credential mapping, isolated real-data runner and real push remain HOLD pending independent human authorization.
- **Gate unchanged:** `H1DB3_Q31_CODESIGN_PASS_OWNER_ATTESTED__ONE_SHOT_READ_ONLY_BATCH_PREPARED_LIVE_HOLD`. Next meaningful output: a **single consolidated offline PASS/HOLD**, not 23 sequential user questions.

## Office OT Phase 1 — offline integrated batch RC1 111/111 PASS; Q33 Draft source branch authorization HOLD (2026-10-26)

- **Frozen authority:** GitHub Backend Issue #62 confirms Office OT Q1–Q30; effective policy date 2026-11-01 is **not** an automatic deployment date. Q30 specifies two phases. Phase 1 request + manager three-way approval/proxy + my OT/calendar plan interval + READ_ONLY punch comparison + HR exception + LINE notification integration. Phase 2 comp-time/payroll choices, split/ledger/leave-reserve/expiry/payment requires **separate Stage/HR/Payroll gates**.
- **Offline artifact:** `ABIS_Office_OT_Phase1_Offline_Batch_RC1_20261026.zip` SHA256 `a386360f5f2966c61712945f885449384ad836a608a4ef9ae6984735d58bb3b0`, locally generated ChatGPT artifact (not uploaded into GitHub/Drive). Bundle includes pure synthetic GAS V8 Phase1 core and event reducer, notification-intent-only multilingual helpers, Phase2 locked contract, fail-closed backend adapter contract, employee/manager HTML candidate, self-contained synthetic demo, consolidated tests, Q1–Q30 traceability and integration/handoff docs.
- **Batch acceptance:** local synthetic Node tests **111/111 PASS**; syntax static checks on GAS/HTML and runnable demo **PASS**; code source ZIP integrity `unzip -t` **PASS**. No external API call, no real LINE User ID or token, no real staff/Attendance/Payroll data. Candidate not integrated into `src/Main.js` action dispatcher or existing UI `src/PERF1_JS_CORE_POST.html`, and no DB/Sheets/Stage/Production/Payroll or LINE writes occurred. Preview UI not independently visually validated in browser; syntax and contract tests alone are not runtime/UI acceptance.
- **Known backend architecture:** Git `main` `src/Main.js` `api(action,payload)`, `requireSession_`, `employeeObj_`, `getMyAttendance_`, `getAttendanceInbox_`; existing `attendanceOvertimeGroups_` reads `OVERTIME_FACT_加班事實` and must never receive manager-only approval as factual paid OT. LIFF frontend independent V153. Live identity/effective OT eligibility, manager/HR proxy authority, legal hours and holiday classification, persistent idempotency/append-only transaction, attendance reconciliation, actual LINE sender and real UI integration all still **HOLD** pending future scoped source/release and live-authority gates.
- **S0 Q31/Q32 evidence:** Source Owner Q32G editor-text single public-entrypoint missing `_` reconstruction has EXACT historical SHA match (owner UI text tier), not Apps Script API source parity. Q32H owner screenshot of existing standalone Stage executions shows exactly **one** visible Editor execution `abisOtS0SyntheticExample` at 2026-10-26 17:58:24 +08:00, duration 0.261s, Completed, 7-day count 1, no other visible runs, Cloud log lines unavailable. This is `PASS_OWNER_UI_HISTORY_ONLY`; no return object, independently verified external side-effect absence or retroactive authorization for renamed entrypoint. Dedicated Stage remains **HOLD**, no new execution.
- **Current gate:** `OFFICE_OT_P1_OFFLINE_BATCH_RC1_PASS__Q33_DRAFT_SOURCE_AUTH_HOLD`. **Next ONE Source Owner decision Q33:** A (recommended) separately authorize *only* isolated Backend/LIFF development branches + Draft PR source-only review based on frozen latest main heads, flags OFF, no merge, no new CI/Stage/Production/Properties/OAuth/Trigger/Deployment/LINE/business data; B retain ZIP local only. No existing S0 Stage source write approval is expanded. After A, one bundled static/unit acceptance gate; any later Stage source/data, LINE sender or Production deployment requires separately scoped owner authorization.
- Separate release authority freshly verified Backend **V167 PROD_CURRENT**, source 78/78 PASS, R2174 SHADOW, rollback V166; LIFF **V153 PROD_CURRENT**. No source main/manifest/release edit in this batch. This turn's GitHub mutations limited to central/Backend/LIFF `ops/` SSOT documentation. No private source/identity or token in SSOT.

## ABIS ESS RC1.35 H1D-B Q32 — Source Owner A, bounded feature code and one-shot CI acceptance (2026-10-27)

- **Authorized:** RC1.35 PR #76 development branch only for full candidate source/hermetic fixture preparation. No PR merge, Release Manifest, Apps Script/Stage, LINE API, Production, or business-data mutation.
- **Current candidate:** `c9ad633ae9cd51078bc5c086ffb1ec6375a675d3` on `feat/phase1a-line-delta-i18n-rc1-35-v159`; PR #76 **OPEN/DRAFT/UNMERGED**. Q32 original test commit `66482bbf3dba98a10c61d9360dd77bb5eedc2140` remained successful for its own code. This session's bounded source/UI/tests hardened work JSON fail-closed behavior, post-publish release audit, partial HTTP acceptance and device-unverified accounting.
- **CI:** Final offline GitHub Actions run [40358559711](https://github.com/nooneknows70/abis-ess-backend/actions/runs/40358559711) **SUCCESS** on current candidate HEAD, synthetic Node VM only. Prior CI failures `40357436554`, `40357979944`, `40358121137`, `40358259976`, `40358389765` were retained as intermediate negative evidence; all were fixed before final complete rerun.
- **Important H1C safety:** H1C historical Stage installer SHA pins were NOT modified. The approved helper Git blob `8321bc5cd1b42aa7c28e9fc0791a63abb6666dfb` is validated from original Git ancestry; the *new* candidate is expected to return HOLD if offered to frozen H1C install tools. Historical H1C self-tests PASS. This preserves frozen H1C Stage integrity and does **not** constitute approval to update Stage.
- **Release authority (read-only GitHub manifests):** Backend V167 PROD_CURRENT; LIFF V153 PROD_CURRENT. PR #76 is independent; no main source or manifest edits, no Apps Script/Stage/Production change, no real LINE ID, Token, OAuth, API or actual push.
- **Outstanding:** Mac 23-check single-run batch NOT EXECUTED on Source Owner's Mac; Q17 68/68 is historical owner-attested, not a fresh replay; actual LINE provider identity/token-to-channel/recipient ownership/device receipt and runtime scopes are all HOLD. CI PASS is not a live send or production readiness attestation.
- **Next Gate:** Receive one consolidated owner Mac offline check summary and verify fresh feature HEAD, CI and cross-Repo SSOT parity. Genuine LINE or Production remains a separate Source Owner authorization. Do not create Q33+ OS micro-Gates.
- **Gate:** `RC135_Q32_FEATURE_BRANCH_HERMETIC_INTEGRATION_PASS__MAC_OWNER_BATCH_PENDING__REAL_LINE_PRODUCTION_HOLD`.

## Office OT Phase 1 Q33 — 2 isolated Draft PRs created; source/static synthetic PASS, Stage & live HOLD (2026-10-27)

- **Source Owner decision:** Q33=A, bounded to isolated Backend+LIFF GitHub development branches, source integration and Draft PRs. **No merge/main source**, Apps Script S0 Stage edits or Run/Debug, Manifest, OAuth, Trigger, Deployment, real LINE identity/token/send, formal Raw Punch, Payroll or Production writes authorized. Existing Office OT Issue #62 Q1–Q30 policies frozen; Q29 policy effective date 2026-11-01 is NOT an implicit deployment release.
- **Branches:** `feature/office-ot-p1-q33-isolated-20261027` in both repos. Backend created from `main@78735c2caf171cbe944f0d13a6cbf48abab6e4e6`; LIFF from `main@99e03dc975c43de1ba0cf06dd8a471ca0b370404`. Since branch creation, both mains advanced by 2 **ops-only** commits. Checked that no source, `index.html`, `appsscript.json`, Release Manifest or immutable assets drifted. No force-push, reset/rebase/merge.
- **Backend [Draft PR #93](https://github.com/nooneknows70/abis-ess-backend/pull/93):** OPEN/DRAFT/UNMERGED, head `d317a150430765f700b0c05b71052a79ecd4a262`, 8 changed files, no prohibited paths. Imported exactly 4 pure source candidates (Core, Notice, Phase2 locked, Adapter) with Git blobs matching original RC1 ZIP; added Q33 HOLD gate, isolated test and handoff document. `src/Main.js` differs from its branch base ONLY by 651 characters registering 15 `officeOt*` actions; **all 15 throw `OFFICE_OT_P1_Q33_HOLD_NO_LIVE_ADAPTER`**. No auth, persistence, LINE or business data connection. `appsscript.json` and Backend Release Manifest unchanged.
- **LIFF [Draft PR #26](https://github.com/nooneknows70/abis-ess-liff/pull/26):** OPEN/DRAFT/UNMERGED, head `34684ee34da0d06ae4467309b4864ce0dd28da86`, 4 feature files, no prohibited paths. UI fragment Git blob `66a4bd06bc86263d4fcc47f990057aaf1cf9d0c7` EXACT matches local RC1 candidate. Hard-HOLD feature gate `enabled=false`, never mounts/sends. Original `index.html`, deployed V153 assets and LIFF Manifest unchanged.
- **Consolidated synthetic/static evidence:** original offline ZIP `ABIS_Office_OT_Phase1_Offline_Batch_RC1_20261026.zip` SHA256 `a386360f5f2966c61712945f885449384ad836a608a4ef9ae6984735d58bb3b0`; original local Node `111/111 PASS`; remote Draft source-only V8 sandbox `12/12 PASS`; remote LIFF gate `5/5 PASS`; Main.js syntax, guard-only source diff, source blob parity, no Manifest/Production asset change all PASS. New test files syntax checked; **actual Node test run from a GitHub branch checkout or GitHub CI NOT performed**.
- **Independently separate Release authority:** Backend manifest `V167 PROD_CURRENT`, R2174 **LIVE** as current central registry; LIFF `V153 PROD_CURRENT`. This Q33 turn did NOT change any Production pointer/runtime. Do not overwrite current unrelated R2174 state from older handoff snapshots.
- **Unresolved hard HOLD:** previous S0 Q31 public-entrypoint one run was outside original private-function-only authorization. Q32G source editor text parity and Q32H one completed UI execution are Source Owner UI evidence only; independent Apps Script source hash, complete runtime return and negative external side-effect proof not established; prior Q32H GitHub sync partial HOLD not silently repaired. Phase1 live Backend eligibility/manager/proxy/calendar/transaction adapters absent, no OT request store or notification dispatch. Phase2 comp-time/wages/leave/Payroll writes locked.
- **Current Gate:** `OFFICE_OT_P1_Q33_DRAFT_PRS_SOURCE_AND_STATIC_PASS__Q34_STAGE_AUTH_HOLD`. **Next one Source Owner choice Q34:** authorize only a separately bounded **new isolated Phase1 synthetic Stage source + synthetic fixture import** after exact Script project/manifest/auth-isolation preflight, with NO function execution, no real employee/HR/Payroll/Punch/LINE data, no OAuth scope escalation, no triggers/deployments, or keep both PRs Draft/HOLD. Future Run and any Production/LINE/Payroll writes need separate Release Flow V2 authority.

## Office OT Q34=A — new dedicated synthetic Stage import package ready, project identity HOLD (2026-10-27)

- **Source Owner authorization Q34=A:** allow creation of a **new** private standalone Office OT Phase1 synthetic Apps Script project and bounded import of approved source + synthetic-only fixtures after exact target identity/metadata/manifest zero-scope preflight. Does **not** authorize Apps Script Run/Debug, OAuth re-login or escalation, Script Properties, Trigger, Deployment, LINE API/user IDs/tokens, real Sheets/Attendance/Payroll/Raw Punch/business-data writes, Production change, GitHub main merge or modifications to old S0 Stage.
- **Original source provenance:** immutable original RC1 ZIP `ABIS_Office_OT_Phase1_Offline_Batch_RC1_20261026.zip` SHA256 `a386360f5f2966c61712945f885449384ad836a608a4ef9ae6984735d58bb3b0`; Q33 Backend Draft [PR #93](https://github.com/nooneknows70/abis-ess-backend/pull/93) and LIFF Draft [PR #26](https://github.com/nooneknows70/abis-ess-liff/pull/26), both OPEN/DRAFT/UNMERGED and feature OFF. Five exact source/UI Git blobs compared to original ZIP and match.
- **New local sealed Q34 package:** `ABIS_Office_OT_Phase1_Q34_Stage_Import_ONLY_20261027.zip` SHA256 `3b8c3ab200cccef8a1ce07d6a1bf0bc7082be3f9b939d21d16f65dadebd153ed`. `source/` contains four exact candidate .gs modules, one inert .html candidate, one fake-only fixture .gs, an inert default `Code.gs` comment, and minimal `appsscript.json`. Exact 8 source files in `Q34_SOURCE_LOCK.json`, manifest `timeZone=Asia/Taipei`, `runtimeVersion=V8`, `exceptionLogging=STACKDRIVER`, `dependencies={}`, `oauthScopes=[]`. No executable public top-level function and no privileged Google/LINE API calls; source is not wired into real ESS adapter, payroll or notification sender.
- **Local synthetic/static batch:** 123/123 PASS = original 111 tests + Q34 isolated import security checks 12/12. Local ZIP `unzip -t` PASS. This is **not** Google Apps Script Stage source-readback, provider runtime E2E, HR/Payroll authority or proof of zero external effects.
- **Connector boundary verified:** connected Google Drive `create_file` only supports native Docs/Sheets/Slides; no accessible native Apps Script `projects.create` or `projects.updateContent` action, and generic Drive upload is not a safe substitute. Prior old S0 Stage direct metadata read-only matched separate historical standalone project; it was NOT copied, opened for execution or changed.
- **Next ONE human evidence node Q34-1:** Source Owner creates a **new blank private standalone Apps Script project** with exact title `ABIS_ESS_OFFICE_OT_P1_SYNTHETIC_STAGE_20261027` using existing logged-in Apps Script UI, then returns the **new project URL/ID only**. No code import yet. We will independently verify ID distinct from old S0 and Production, Google Drive MIME `application/vnd.google-apps.script`, exact title, creation timestamp and not-shared visibility **before** any code import. If login or OAuth/permission prompt, STOP/HOLD.
- **Status:** `OFFICE_OT_P1_Q34_A_IMPORT_PACKAGE_123_PASS__NEW_STAGE_IDENTITY_PENDING_HOLD`; stageCreated=FALSE, Stage sourceImported=FALSE, no new Apps Script execution, OAuth, Trigger, Deployment, LINE or business-data writes. Backend V167 PROD_CURRENT R2174 LIVE and LIFF V153 PROD_CURRENT are independent and unchanged. Old S0 Q31 execution/source evidence HOLD remains unchanged; Office OT Q1-Q30 frozen.

## Office OT Q34-1 — new isolated Stage identity PASS; Q34-2 guarded single import pending HOLD (2026-10-27)

- **Source Owner supplied new standalone Apps Script Script ID** `1Sd9VdA1n-Mdgkw6Dsvot2YvQqwfVI2ZA8zLrCS7XgwBgxRyAZSDu_mbw`. Independently verified via Google Drive metadata `files.get`: exact title `ABIS_ESS_OFFICE_OT_P1_SYNTHETIC_STAGE_20261027`, native `application/vnd.google-apps.script`, created `2026-10-27T00:55:54.187Z` (local Taipei 08:55:54), modified same instant, `shared=false`, visibility permission metadata present and only user Owner returned. **Q34-1 exact identity/private metadata PASS**. This new ID is different from old S0 `1R96DqSE7DxHsyj1lsXf-WaGgTuuTNA2FWR7jJKN_cZx0z9nusHbmO2ud` and the Backend production `productionSource.scriptProjectId`. Neither existing project was modified.
- Metadata alone does **NOT** verify empty Apps Script source, manifest/OAuth scope, libraries, triggers, deployments or property inventory. Existing Provider Drive connector has no native `projects.getContent/updateContent` or `projects.create`, so no remote source import was performed by ChatGPT. No Apps Script code was executed.
- Original Q34 **sealed** import package `ABIS_Office_OT_Phase1_Q34_Stage_Import_ONLY_20261027.zip`, SHA256 `3b8c3ab200cccef8a1ce07d6a1bf0bc7082be3f9b939d21d16f65dadebd153ed`, re-verified on local working filesystem; all 8 `source/` bytes and SHA256 match `Q34_SOURCE_LOCK.json`. Synthetic/static test baseline from Q34 remains **123/123 PASS local only**.
- New user-facing **helper bundle** `ABIS_Office_OT_Q34_OneShot_Importer_20261027.zip`, SHA256 `7d753e2031b8ed338a1740f35173d42a484b715b48fcfd64841323db4d7f8edf`. Contains original sealed ZIP unchanged, readable script `Q34_IMPORT_ONCE.sh`, README. Script uses only Source Owner's existing Mac/local offline-installed `npx --offline --no-install @google/clasp`, existing global clasp authorization copied into temporary private file, exact hard-pinned new Stage Script ID, and distinct local temp directories. It verifies all hashes+minimal OAuthScopes=[] manifest, performs **one read-only pull first**, stops without remote write if pull fails or source is not default-blank, then **one bounded source push only** and **one read-only source/manifest parity pull**. No Apps Script function Run/Debug, OAuth re-login, trigger/deployment/properties, LINE, Payroll, Attendance, Raw Punch or Production interactions in helper.
- Local fake-clasp Stage harness: success readback, failed preflight (zero write), unexpected nonempty Stage (zero write), and simulated failed push (remote status unknown, stop) all PASS as categorical mock tests. **These are local simulations, not a Google provider source readback**. Prior unrelated S0 clasp pull failed; if this new-Stage read-only preflight fails, **HOLD and do not retry/bypass**, never run `push`.
- Current Gate `OFFICE_OT_P1_Q34_1_NEW_STAGE_IDENTITY_PASS__Q34_2_IMPORT_ONESHOT_HOLD`; **next ONE operator evidence step**: download helper ZIP, unzip, from Mac Terminal run `bash .../Q34_IMPORT_ONCE.sh`, return only `Q34_` status lines. No new management authorization needed for the already approved bounded Q34-A import. `Q34_STATUS=PASS_SOURCE_IMPORT_READBACK` is the only package-level source-parity success label; post-push errors require HOLD and no automatic retry/rollback. Native runtime, independent trigger/properties absence and real ESS adapters remain separate HOLD even if source-import PASS.
- Backend Draft PR #93 and LIFF Draft PR #26 remain OPEN/DRAFT/UNMERGED, feature OFF. Production remains Backend V167 R2174 LIVE and LIFF V153, release manifests/main unchanged. Old Office OT S0 Q31/Q32 historical authorization/evidence HOLD unchanged. Frozen Q1-Q30 company policies unchanged.

## Long-leave executive approval V1.0 — frozen Q1-Q17 (2026-10-27)
- Source Owner approved Q1-Q17 company management decisions; canonical design artifact: `ABIS_ESS_Long_Leave_Executive_Approval_V1_FROZEN_20261027.md`. Detailed decisions in `ops/handoff/2026-10-27.md`.
- Core: existing >=3 equivalent work-day executive route, supervisor mandatory handover checkbox+note and FORWARD ONLY (no final approval); executive/formally delegated executive final approve, return to supervisor for supplement, or reject-and-close. Other frozen decisions cover privacy-scoped history, reassignment, revisions/cancellation, legacy split and immutable audit.
- Gate: `POLICY_FROZEN__SOURCE_MAPPING_PARTIAL__DEVELOPMENT_AUTH_HOLD`; 36 planned synthetic scenarios, none run; not deployed or functionally verified. Next: explicit Source Owner approval for isolated Backend+LIFF dev branches/Draft PR after READ_ONLY source mapping.
- Safety: no source code/main, Release Manifest, Apps Script/Stage, LINE, Production, trigger, deployment, Payroll or business data modifications authorized; retain existing Backend V167 and LIFF V153 release authorities and unrelated workstream HOLD/PASS.

## Long Leave Executive Approval V1 — source branches & Draft PRs (2026-10-27)

- Frozen company policy: Q1-Q17 finalized; no further routine management questions. Supervisor REVIEW/HANDOVER/FORWARD only, executive or formally authorized scoped delegate final decision; existing >=3 equivalent workday route; legacy requests do not automatically migrate.
- Existing repos, not new projects: Backend [Draft PR #94](https://github.com/nooneknows70/abis-ess-backend/pull/94), LIFF [Draft PR #27](https://github.com/nooneknows70/abis-ess-liff/pull/27), both OPEN/DRAFT/UNMERGED on \`feature/leave-exec-v1-q1-q17-20261027\`. New source is isolated, provider not bound, UI unmounted, feature OFF. \`src/Main.js\` branch guard prevents V1 rows entering legacy approval; current main source untouched by this PR.
- Offline one-shot synthetic 50/50 PASS (policy 36, mapping 6, UI 8). Six GitHub file blobs match local executed files; no actual CI/Apps Script/Google Sheets/LINE E2E. Exact evidence and existing-source conflict analysis: \`ops/handoff/2026-10-27.md\`.
- Gate: \`LONG_LEAVE_V1_POLICY_FROZEN_SOURCE_CANDIDATE_50_50_LOCAL_PASS__STAGE_PROVIDER_AUTH_HOLD\`. Need separately authorized read-only **existing** Stage identity/manifest/schema and isolation preflight; do not automatically import, run, merge or deploy.
- Existing Production and other workstreams remain unchanged: Backend V167 R2174 LIVE, LIFF V153. No Payroll/Attendance/Leave transaction, provider, Manifest, OAuth, Trigger, deployment or LINE mutation.

## ABIS ESS RC1.35 H1D-B — Owner Mac 23/23 single-run result (2026-10-27)

- Source Owner supplied local output: `ABIS_RC135_H1DB_LOCAL_BATCH=V2_READ_ONLY`, `CHECK_COUNT=23`, `PASS_COUNT=23`, `HOLD_COUNT=0`, `UNKNOWN_COUNT=0`, `FAILED_CHECK_IDS=NONE`, `LOCAL_BATCH_STATUS=PASS` (all 23 check IDs PASS).
- Owner independently reported ZIP SHA256 `9125c238bac4bff54326e3a90b620afe64701c8e68acf4cbd23cf89096bef0a3`, ZIP CRC PASS and embedded script SHA256 `fda5ae092b64f3af261fab20f5906d73c797811d6ef35c83b5f3e23b72d6fc6f`. Stored as **OWNER_ATTESTED_LOCAL_OUTPUT**, not independently observed or verified on Mac by GitHub.
- Script identity: `abis_rc135_one_shot_v2/ABIS_RC135_H1DB_ONE_SHOT_READONLY.cjs` in V2 conversation-local ZIP, *not* the earlier distinct GitHub-referenced H1DB archive.
- Fresh GitHub read-only verification (separate from Mac script): PR #76 remains OPEN/DRAFT/UNMERGED, feature head `c9ad633ae9cd51078bc5c086ffb1ec6375a675d3`, hermetic workflow [40358559711](https://github.com/nooneknows70/abis-ess-backend/actions/runs/40358559711) completed SUCCESS on exact head. Backend main Release Manifest V167 PROD_CURRENT and LIFF main V153 PROD_CURRENT; cross-Repo Q32 original records matched before Mac update.
- Mac run explicitly reports `HISTORICAL_Q17_68_68=NOT_RERUN` and `GITHUB_PR76_HERMETIC=NOT_RERUN_BY_THIS_SCRIPT`. Q17 68/68 remains only historical Owner evidence; do not claim fresh reexecution.
- 23 local host preflight checks DO NOT prove publisher trust, notarization, dependencies, network isolation, credential provenance, runtime actor identity, LINE delivery or real-device receipt. No real ID/Token accessed or LINE API called by this chat; owner Mac classification states `REAL_ID_TOKEN_LINE_API_PRODUCTION=HOLD`.
- **Scope remains:** PR unmerged, no Release Manifest/Apps Script/Stage/LINE/Production/business data mutations. This local batch closes only the Q32 Mac preflight. Next separate Source Owner Gate must cover scope-limited credential/channel/recipient and isolated runner READ_ONLY evidence before considering any real LINE synthetic test; no automatic send.
- **Gate:** `RC135_Q32_CI_PASS_MAC23_OWNER_ATTESTED__REAL_LINE_STAGE_PRODUCTION_HOLD`.

## Long Leave V1 — existing RC5 Stage READ_ONLY source preflight (2026-10-27)

- **Gate:** `G0_STAGE_REUSE_HOLD`. Existing `ABIS_ESS_POLICY_A_STAGE_RC5` Google Drive identity distinct from Production; Stage Source Owner-Mac `clasp clone` identity and 6-file listing PASS (operator-reported), but not independent Apps Script source/runtime readback. `RC5_EXPLICIT_OAUTH=UNDECLARED` is **not** zero scopes.
- **Local static regex scan:** `RC5_FILE_SET=PASS`, source aggregate SHA256 `1ad9e355612d36479dd2d705be43f7a2092d64eb0b3d59945036af086941794b`; HTTP/Trigger/WRITE_LIKE present in file 1, Sheets/WRITE_LIKE/PROD_TEXT present in files 2 and 5; PROD_TEXT in files 4 and 6; keywords are **possible** risk indicators, not executed-call or production-access evidence. Prior RC5 screenshot recorded 4 broad OAuth requested scopes, 5 Script Properties, zero deployment and trigger counts; historical owner-attested, not fresh provider verification.
- **Stage fixture metadata** main 5 tabs / attendance 2 tabs and both `America/New_York` timezone; cannot treat as validated Taipei leave time handling. No Stage source imports or executions, credential/employee-data reads, business-data writes or deployments.
- **Decision:** do not reuse RC5 for long-leave runtime/integration tests under existing A authorization; preserve Backend Draft PR #94 and LIFF Draft PR #27 OPEN/DRAFT/UNMERGED. Continue candidate offline only; any real provider testing or new Stage requires separate Source Owner action. Full details in `ops/handoff/2026-10-27.md`.

## ABIS ESS RC1.35 H1D-B Q33 — Local controlled synthetic runner authorized (2026-10-27)

- Owner Q33=A authorizes separate controlled local synthetic verifier environment plus minimum-privilege preflight, not real LINE User ID/Token, OAuth, Google employee reads, LINE send, Stage, Production, Release Manifest or main feature code writes.
- Draft PR #76 feature SHA `00c427f825e6f7e887a71ea1ab0a0ec0b8be20c7`; standalone Mac-only synthetic runner `tools/abis-rc135-h1db-local-runner-preflight.cjs` at Git blob `5004d83d6ba672d1c2feb391cc1af326e98e48ca`. GitHub hermetic CI [40451262485](https://github.com/nooneknows70/abis-ess-backend/actions/runs/40451262485) SUCCESS at this SHA: 24/24 fixture checks, 15 synthetic self-tests, no real external service calls.
- New Mac 13 host checks + ephemeral 0700 directory/ACL + one sanitized synthetic child **NOT YET RUN on Owner Mac**. Earlier Q32 23/23 owner-attested V2 checks are distinct; historical Q17 68/68 not re-run.
- OS network isolation and actual read-only OAuth/ACL/data scope remain NOT_VERIFIED. Real User ID, Token-to-Channel identity, independent owner proof, LINE API push, Stage and Production remain HOLD.
- Backend manifest V167, LIFF V153 PROD_CURRENT verified read-only. H1C frozen Stage SHA not changed. Next: one exact-pinned Mac synthetic runner preflight without sudo, then one results classification.
- Gate: `RC135_Q33_HERMETIC_24_PASS__OWNER_MAC_LOCAL_RUNNER_PENDING__REAL_UID_TOKEN_LINE_STAGE_PROD_HOLD`.


## ESS Long Leave Q1–Q17 — offline source hardening complete, provider HOLD (2026-10-27)

- Policy frozen Q1–Q17. Backend [Draft PR #94](https://github.com/nooneknows70/abis-ess-backend/pull/94) at `8e154b0fe8cd342e435fba138801ee7d93d0e8b1`, LIFF [Draft PR #27](https://github.com/nooneknows70/abis-ess-liff/pull/27) at `fbe14c5232fe6a523492493d409caa09c8f36d0a`; OPEN/DRAFT/UNMERGED. Existing ESS projects; no new Production project.
- Latest independent **V8 isolated replay 96/96 PASS**: policy 36, mapping 6, security/revision 20, group planner 18, UI 16. **Not a real Node test run, CI, Google Stage or Production E2E.** One-shot local Node runner prepared, not executed. Cross-repo contract blob identical `1e86b7f77195a818f76fd18aebbb4c658426213b`.
- Feature remains OFF; Backend `longLeaveExecV1Action` HARD HOLD, LIFF UI unmounted. Pure group-plan `readyForProviderMutation=false`. Provider adapters, durable audit event storage, real Stage isolation and formal data schema are NOT ready.
- Existing RC5 Stage remains `G0_STAGE_REUSE_HOLD` due unproven runtime isolation, mixed-purpose source indicators, historical broad OAuth and `America/New_York` fixtures. Do not import/run/write there. Full matrix: Backend feature-branch `docs/leave/ABIS_LLEX_V1_PROVIDER_STAGE_G0_MATRIX_20261027.md`. Do not imply RC5 actually wrote Production.
- **Next one Source Owner gate:** create/identify a *private synthetic-only long-leave Stage testing resource* (not a new ESS production system); permission only for initial resource setup/metadata READ_ONLY if granted. Stage source import, function execution, real data, LINE, OAuth elevation, Trigger/Deployment and Production require separate approval. Backend V167 and LIFF V153 official release authorities preserved.

## LLEX V1 dedicated synthetic Stage — identity confirmed, runtime HOLD (2026-10-27)

- Source Owner A authorized private blank TEST resource create and READ_ONLY metadata check. Authenticated Drive metadata confirms `ABIS_ESS_LLEX_V1_SYNTHETIC_STAGE_20261027` (`application/vnd.google-apps.script`), `shared=false`, visible owner-only permission and ID distinct from Production Backend V167. No second project needed.
- **G0 PARTIAL:** `LLEX_STAGE_G0_IDENTITY_METADATA_PASS__SOURCE_MANIFEST_RUNTIME_HOLD`. Apps Script source/Manifest/Scopes/Triggers/Deployments/Properties/Services/runtime isolation have NOT been independently verified. No source import or execution authorized. RC5 remains `G0_STAGE_REUSE_HOLD`.
- Backend Draft PR #94 / LIFF Draft PR #27 unchanged; 96/96 V8 synthetic tests and provider-feature OFF. Next: one read-only new-Stage source and UI inventory. Full evidence in `ops/handoff/2026-10-27.md`.


## LLEX dedicated Stage G0 source static evidence — 2026-10-27

- Source Owner local `clasp clone`: ID MATCH, one default source `程式碼.js`, provider API keyword refs NONE_DETECTED, Manifest FOUND, Asia/Taipei TZ, dependencies EMPTY, explicit oauthScopes UNDECLARED. **OWNER_ATTESTED_SOURCE_STATIC_PASS**, not independent Apps Script source/runtime readback. No source hash captured.
- Drive metadata: distinct dedicated Apps Script project, `shared=false`, visible owner-only permission. **Gate: `LLEX_STAGE_G0_IDENTITY_AND_OWNER_SOURCE_STATIC_PASS__RUNTIME_SETTINGS_HOLD`**; OAuth effective/requested scopes, Trigger, Deployment, Script Properties, Services, Libraries and runtime target inventory are not yet verified.
- RC5 remains reuse HOLD. No Stage code import or function run, no OAuth/Trigger/Deployment, LINE, Production/Payroll/Attendance/leave mutation. Draft PR #94/#27 remain unmerged; 96/96 synthetic V8 tier only. Read-only UI inventory is the next one human checkpoint; no new management decision at this stage.

## ABIS ESS RC1.35 H1D-B Q33 — Mac CF metadata diagnosis and bounded fix (2026-10-27)

- **Original Mac evidence (owner-reported, preserved HOLD):** verified runner from PR #76 commit `00c427f825e6f7e887a71ea1ab0a0ec0b8be20c7`, Git blob `5004d83d6ba672d1c2feb391cc1af326e98e48ca`; `RUNNER_SOURCE=PASS`, 13 host checks, `FAILED_CHECK_IDS=NONE`, but `RUNNER_GATE=SANITIZED_SYNTHETIC_CHILD_HOLD` and exit 2. No reclassification to PASS.
- **Safe name-only Mac diagnostic:** `DIAG_NODE=PASS`, `MACOS_CF_ENV=PRESENT`, `OTHER_EXTRA_ENV_COUNT=0`, `SYNTHETIC_FLAGS=PASS`. This strongly supports conflict with original strict child environment-name whitelist; no real environment values were collected. The old runner aggregated child failure reasons, so the exact internal failure branch remains unobserved.
- **Bounded fix:** New RC1.35 Draft PR #76 head `139c9da25233050b88649991019e83258b0112fe`, corrected runner Git blob `c09f651555e4b7293c73e6be7868e4319b5bcd3e`. Only the exact `__CF_USER_TEXT_ENCODING` environment **name** is permitted on Darwin; all seven original required keys remain mandatory, and any other extra, credential, loader/injection key or missing key remains fail-closed. No value read/log, no privilege relaxation, no actual provider integration.
- **CI:** GitHub Actions [40454490529](https://github.com/nooneknows70/abis-ess-backend/actions/runs/40454490529) completed SUCCESS at the exact new head: 31/31 hermetic regression checks PASS including Mac CF allow/reject cases. Linux CI does NOT constitute owner Mac revalidation. Q32 earlier Mac 23/23 remains separate historical owner evidence.
- **Next step:** Source Owner pins new head and Git blob locally, then executes corrected `--prepare-local` synthetic-only once; return only classification lines. No retry of old failed runner. Do not read real LINE User ID, tokens, OAuth, LINE API, Stage or Production. `NETWORK_ISOLATION=NOT_VERIFIED`, `OAUTH_ACL_SCOPE=NOT_VERIFIED`, `REAL_UID_TOKEN_LINE_API=HOLD`, `STAGE_PRODUCTION=HOLD` remain.
- **Gate:** `RC135_Q33_MAC_CF_FIX_CI31_PASS__OWNER_MAC_REVALIDATION_PENDING__REAL_UID_TOKEN_LINE_STAGE_PRODUCTION_HOLD`.


## LLEX G0 owner UI zero-settings PASS; G1 pure source import authorization HOLD (2026-10-27)

- Dedicated private LLEX Stage: Source Owner 1–5=0 UI check means OAuth requested scopes 0; Script Properties 0; Triggers 0; active/archived Deployments 0/0; Services/Libraries 0/0. `OWNER_UI_ATTESTED`, **not** Apps Script REST or effective runtime permission proof.
- Together with previously verified Drive project ID/owner metadata, Mac `clasp` one-default-source static check, `Asia/Taipei` Manifest and no provider refs, **`LLEX_G0_PREIMPORT_STATIC_OWNER_UI_PASS__G1_SOURCE_IMPORT_AUTH_HOLD`**. No Stage import or execution authorized by these results.
- Three pure Backend candidate files pinned in Backend Draft branch `docs/leave/ABIS_LLEX_V1_G0_UI_ZERO_AND_G1_IMPORT_AUTH_GATE_20261027.md`. Stage import of these three files, even without function run, requires a separate explicit Source Owner G1 authorization. After any future import, redo identity/source/Manifest/OAuth/Triggers/Deployments/Properties preflight; do not infer zero scopes from current empty project.
- Backend PR #94 and LIFF PR #27 remain DRAFT/UNMERGED; feature OFF, adapter unbound, Node one-shot runner NOT_EXECUTED; V8 96/96 synthetic result only. RC5 HOLD; Production V167/V153 unchanged.

## ABIS ESS RC1.35 H1D-B Q33 — Corrected Mac synthetic local runner 13/13 owner PASS (2026-10-27)

- **Source Owner Mac evidence:** verified feature commit `139c9da25233050b88649991019e83258b0112fe` and runner Git blob `c09f651555e4b7293c73e6be7868e4319b5bcd3e` (`GIT_REMOTE=PASS`, `RC135_COMMIT=PASS`, `RC135_RUNNER_BLOB=PASS`, `RUNNER_SOURCE=PASS`). Corrected **synthetic-only** runner returned `LOCAL_RUNNER_PREFLIGHT=PASS`, `CHECK_COUNT=13`, `FAILED_CHECK_IDS=NONE`, `RUNNER_GATE=LOCAL_SYNTHETIC_RUNNER_PREPARED_AND_CLEANED`, `RUNNER_EXIT_CODE=0`. Evidence is **OWNER_ATTESTED_TERMINAL_OUTPUT**, not an independent machine observation.
- Original Q33 Mac trial remains recorded as child **HOLD**; this successful run used the new bounded Darwin-only `__CF_USER_TEXT_ENCODING` name compatibility fix. The separate Q32 V2 Mac 23/23 PASS was not rerun.
- PR #76 remains OPEN/DRAFT/UNMERGED, CI [40454490529](https://github.com/nooneknows70/abis-ess-backend/actions/runs/40454490529) completed SUCCESS at exact head with **31/31 offline hermetic checks**. The Mac script did not rerun GitHub CI or historical Q17 68/68.
- **Explicit outstanding gates:** `NETWORK_ISOLATION=NOT_VERIFIED`, `OAUTH_ACL_SCOPE=NOT_VERIFIED`, `REAL_UID_TOKEN_LINE_API=HOLD`, `STAGE_PRODUCTION=HOLD`. A synthetic process and child environment allowlist do not establish OS-level egress denial, source ACL/column-level controls, independent actual LINE owner identity, Token-to-Channel proof, real send permission or a Production release.
- Release metadata read-only check: Backend main is **V168 PROD_CURRENT** (updated independently by another workstream); LIFF main remains **V153 PROD_CURRENT**. No release manifest, Apps Script, business data, OAuth, LINE or Production changed in this Q33 verification.
- **Gate:** `RC135_Q33_MAC13_OWNER_ATTESTED_CI31_PASS__NETWORK_OAUTH_UID_TOKEN_LINE_STAGE_PRODUCTION_HOLD`. Next work: separately scoped READ_ONLY OS network isolation and OAuth/ACL and independent identity-source suitability preflight. No real private UID read, API or send under this record.
