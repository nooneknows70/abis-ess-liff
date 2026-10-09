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

Current RC1.2.1 gate:

1. Keep `ABIS_ESS_R2180_PROD_20261008_V142` / Apps Script `@142` frozen as PROD_CURRENT.
2. READ_ONLY summary API is merged and its preflight has passed.
3. Immutable RC1.2 UI is merged; RC1.2.1 follow-up fixes the visible Manage-assignment interaction by scrolling the selected employee editor into view.
4. Backend `Index.html` now points to the immutable RC1.2.1 asset.
5. Apps Script editable HEAD is the NEXT source surface; RC1.2.1 Manage-assignment HEAD smoke has passed.
6. Complete remaining READ_ONLY Web/LIFF smoke before creating an immutable V143 candidate.
7. Create the next Production deployment only after all RC1.2 gates PASS.


## RC1.2 source progress

- LIFF immutable RC1.2.1 asset merged: `7472e564cdea0566477e8581b65afe62e64843b3`
- LIFF asset: `assets/ess-20261008-r2180d-rc1_2_1/punch-exempt-admin.js`
- Backend summary API + RC1.2.1 Index reference merged: `894cb1108e7c7dd4e321152b2f7bbe693f01babe`
- Backend summary source: `src/P5A2_5_ATTENDANCE_PUNCH_EXEMPT_R2180D_RC1_2_SUMMARY.js`
- Production deployment: **not yet created**
- Current PROD_CURRENT remains `ABIS_ESS_R2180_PROD_20261008_V142` / Apps Script `@142`
