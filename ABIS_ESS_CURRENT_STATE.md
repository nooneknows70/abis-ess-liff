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

1. Keep `ABIS_ESS_R2180_PROD_20261008_V142` / Apps Script `@142` frozen as PROD_CURRENT.
2. READ_ONLY summary API preflight is PASS and direct READ_ONLY runtime call is PASS with zero writes.
3. Immutable RC1.2.2 UI is merged and fixes summary initialization/recovery plus ENDED/CANCELLED history navigation.
4. Backend `Index.html` points to the immutable RC1.2.2 asset.
5. Apps Script editable HEAD is the NEXT source surface.
6. RC1.2.2 HEAD Web smoke is PASS: summary auto-load, ACTIVE_NOW/UPCOMING default list, ENDED lazy-load, CANCELLED lazy-load, and Manage-assignment navigation.
7. Next gate: create an immutable Apps Script candidate version from the verified NEXT HEAD, then verify candidate source alignment before any Production cutover.


## RC1.2 source progress

- LIFF immutable RC1.2.2 asset merged: `b3427432864aeb3832e1088230c7e6de94818e5c`
- LIFF asset: `assets/ess-20261009-r2180d-rc1_2_2/punch-exempt-admin.js`
- Backend summary API + RC1.2.2 Index reference merged: `e2ddf2312b6bc6ccd1066005ba331d1521173b67`
- Backend summary source: `src/P5A2_5_ATTENDANCE_PUNCH_EXEMPT_R2180D_RC1_2_SUMMARY.js`
- HEAD smoke: **PASS**
- HEAD smoke UI version: `P5A2_5_ATTENDANCE_PUNCH_EXEMPT_PERIOD_R1_R2180D_UI_RC1_2_2_20261009`
- READ_ONLY summary runtime: **PASS**, writes observed: `0`
- Production deployment: **not yet created**
- Current PROD_CURRENT remains `ABIS_ESS_R2180_PROD_20261008_V142` / Apps Script `@142`
