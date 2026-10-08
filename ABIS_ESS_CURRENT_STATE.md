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

Before RC1.2 source mutation:

1. Bootstrap from this `PROD_CURRENT` Release Set.
2. Branch from current source authority.
3. Implement READ_ONLY summary API first.
4. Run read-only contract/preflight.
5. Implement immutable RC1.2 UI asset and update backend Index reference.
6. Run Git → HEAD alignment, runtime gate, Web/LIFF smoke.
7. Create the next Production deployment only after all gates PASS.


## RC1.2 source progress

- LIFF immutable asset merged: `e0f59278df2ded20534c0dc727826407beabeac0`
- Backend summary API + Index reference merged: `b026e9add3f6ba78286d961d7b5d3fa3a662ced5`
- Production deployment: **not yet created**
- Current PROD_CURRENT remains `ABIS_ESS_R2180_PROD_20261008_V142` / Apps Script `@142`
