# ABIS ESS Current State

> 本文件提供人員閱讀的目前狀態摘要，不是版本 SSOT。  
> 正式版本權威為 `ABIS_ESS_RELEASE_MANIFEST.json`。

## PROD_CURRENT

- Release Set: `ABIS_ESS_R2180_PROD_20261008_V142`
- Release status: `PROD_CURRENT`
- Production deployment: `@142 - R2180D RC1.1 UI FIX git7427577f`
- Deployment ID: `AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR`
- Backend deployed source: `nooneknows70/abis-ess-backend@7427577f8db2fca30b150025de0d76b39e1028a3`
- LIFF deployed source: `nooneknows70/abis-ess-liff@29aa02d08221694305cc6bc4197208a66b2359fb`
- Backend release evidence: `release/PROD_CURRENT_V142_20261008.json`

## Release verification

| Gate | Result |
| --- | --- |
| Git → Apps Script HEAD | PASS 49/49 |
| Git → immutable V142 / Production | PASS 49/49 |
| R2174 Runtime | PASS / LIVE |
| R2180-A | PASS |
| R2180-B | PASS / LIVE |
| R2180-C Compact Gate | PASS |
| Final Pre-Deployment Gate | PASS |
| Web smoke | PASS |
| LINE/LIFF smoke | PASS |

No V143 was created for this metadata convergence. Production remains `@142`.

## R2180 current production behavior

- Persistent Punch Exempt Period status remains only `ACTIVE` / `CANCELLED`.
- UI derives `UPCOMING`, `ACTIVE_NOW`, `ENDED`, `CANCELLED` from status + effective dates.
- R2180-B is LIVE and performs bounded DAILY_ATTENDANCE recalculation for affected dates.
- Raw punch evidence is preserved.
- R2180-C punch-derived exception/notification suppression gate is verified.
- R2180-D RC1.1 production UI notice is active.

## Current work

- Module: `R2180`
- Name: `PUNCH_EXEMPT_PERIOD`
- Stage: `R2180-D-RC1.2`
- Status: `IN_PROGRESS`

### Frozen RC1.2 scope

1. Auto-load `ACTIVE_NOW` and `UPCOMING` employees when entering the admin page.
2. Add 2×2 status summary counts: active now / upcoming / ended / cancelled.
3. Keep `ENDED` and `CANCELLED` history collapsed by default.
4. Retain employee search for new employees and targeted lookup.
5. Add one HR/Admin-only READ_ONLY summary API to avoid N+1 requests.
6. Do not add fake application/approval states.
7. Do not change persisted SSOT status values.

## Next implementation gate

Current RC1.2.2 gate:

1. Keep `ABIS_ESS_R2180_PROD_20261008_V142` / Apps Script `@142` frozen as PROD_CURRENT until an explicit Production cutover.
2. READ_ONLY summary API preflight and runtime verification are PASS with zero writes.
3. RC1.2.2 HEAD Web smoke is PASS.
4. Immutable Apps Script candidate `V143` has been created from the verified NEXT HEAD.
5. V143 candidate source alignment is PASS: Git authority `50` files ↔ V143 `50` files, no missing/extra/mismatch.
6. Final Pre-Deployment Gate is PASS with no business mutation, no LINE send, no deployment mutation, and LINE delivery row count unchanged `241 → 241`.
7. Next gate: explicit Production cutover decision for the existing Production deployment `@142 → @143`. Do not create another Apps Script version unless V143 changes.


## RC1.2 source progress

- LIFF immutable RC1.2.2 asset merged: `b3427432864aeb3832e1088230c7e6de94818e5c`
- LIFF asset: `assets/ess-20261009-r2180d-rc1_2_2/punch-exempt-admin.js`
- Backend summary API + RC1.2.2 Index reference merged: `e2ddf2312b6bc6ccd1066005ba331d1521173b67`
- Backend summary source: `src/P5A2_5_ATTENDANCE_PUNCH_EXEMPT_R2180D_RC1_2_SUMMARY.js`
- HEAD smoke: **PASS**
- Immutable Apps Script candidate: **V143**
- V143 description: `R2180D RC1.2.2 CANDIDATE git e2ddf231`
- V143 ↔ Git authority: **PASS 50/50**, missing `0`, extra `0`, mismatch `0`
- Final Pre-Deployment Gate: **PASS**
- Final gate writes: attendance `0`, exception `0`, payroll `0`, LINE `0`
- LINE delivery rows unchanged: `241 → 241`
- Production deployment: **not yet updated**
- Current PROD_CURRENT remains `ABIS_ESS_R2180_PROD_20261008_V142` / Apps Script `@142`
