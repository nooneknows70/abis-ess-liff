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
- Status: `PROD_CURRENT`
- Release Set: `ABIS_ESS_R2180_PROD_20261009_V143`
- Apps Script Production: `@143`
- Backend deployed source: `e2ddf2312b6bc6ccd1066005ba331d1521173b67`
- LIFF RC1.2.2 source: `b3427432864aeb3832e1088230c7e6de94818e5c`

### Production verification

1. RC1.2.2 Summary API preflight: **PASS**
2. READ_ONLY Summary runtime: **PASS**, writes observed `0`
3. HEAD Web smoke: **PASS**
4. Immutable candidate V143 ↔ Git source: **PASS 50/50**
5. Final Pre-Deployment Gate: **PASS**
6. Production cutover `@142 → @143`: **PASS**
7. Production Web smoke: **PASS**
8. Production LIFF smoke: **PASS**
9. Release evidence: `release/PROD_CURRENT_V143_20261009.json`

### Frozen RC1.2 production scope

1. Auto-load `ACTIVE_NOW` and `UPCOMING` periods when entering the admin page.
2. 2×2 status summary counts: active now / upcoming / ended / cancelled.
3. `ENDED` and `CANCELLED` history lazy-loaded and collapsed by default.
4. Employee search retained for new employees and targeted lookup.
5. HR/Admin-only READ_ONLY summary API.
6. No fake application/approval states.
7. Persisted SSOT status values remain unchanged.
8. Manage-assignment navigation automatically brings the selected employee management area into view.

## Next implementation gate

R2180-D RC1.2 is complete in PROD_CURRENT V143. Any further functional change must start as a new NEXT change from this frozen release set; do not overwrite V143 metadata or reuse the immutable RC1.2.2 asset path.

