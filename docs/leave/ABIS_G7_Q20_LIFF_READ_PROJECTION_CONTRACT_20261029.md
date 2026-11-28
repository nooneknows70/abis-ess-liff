# ABIS ESS LIFF G7 Q20 — Client projection safety contract (DRAFT)

Date: 2026-10-29 (Asia/Taipei). Source Owner G7 Q20=A.

This is a design/QA candidate ONLY. It is NOT executable frontend deployment and does not modify any LIFF asset, manifest, or Production release V153.

## Verified external boundary
- Backend V169 `src/Main.js` currently updates multi-member `TOP_APPROVE` sequentially and has direct LEAVES readers. G7 Q18 single-row Journal-only Provider E2E passed, but never proved the multi-member visibility or side effects.
- Q19 Draft Backend PR #123 documented the incomplete reader/commit-marker barrier.
- Q20 local synthetic development package (in conversation artifact, not committed here) includes `src/q20_frontend_projection_guard.cjs` (SHA256 `3a6017d110ad41cc0b842ca33b4f0ac97bc574fecf1f8838957ce4526ec5cb13`) and shared Node regression, **238/238 PASS** (82 Q19 + 156 Q20).

## Mandatory client integration changes before any Stage/Production QA
1. The browser must consume an *authoritative Backend server projection*, never raw `假單` rows, direct Google Sheet reads, client-computed `COMMITTED` flags or a cached partial group.
2. Server API must enforce stable SourceEpoch, RequestID, actor, two-member snapshot, durable receipt, complete before/after hashes and valid Commit Marker. Client-visible `serverValidated` is NOT a security control; the backend alone decides.
3. Until full commit/readback is proved, all UI readers must display the full Before Image or fail closed. Never let one of two leaves show `已核准` early.
4. Disallow fallback to existing unprotected endpoints while the transaction is `PREPARED`, unknown, timed out or pending manual reconciliation.
5. No notifications, LINE dispatch or any side effects from the LIFF app. Q20 outbox is suppressed.
6. Verify employee leaves, manager inbox, HR detail, leave dashboard, task center, LINE deep link, report pages and all additional LIFF consumers; missing any real reader is a blocking gate.

## Q20 new separate synthetic workbook
- `ABIS_LLEX_G7_Q20_SYNTHETIC_STAGING_20261029` / `1Zrvf38a6a6xBS1RCPUT39muGHpghqCxq31ITwoKPxpU`.
- Private, exactly nine synthetic sheets with fixed ids; Journal A2:Z100 blank, two fake leaves are pending, seven faults NOT_RUN. It is not an Apps Script Stage project and has not run a multi-member Provider test.
- Do not reuse Q18 consumed Script/Sheet or import into Production.

## Gate
`G7_Q20_LOCAL_238_238_PASS__BACKEND_LIFF_RUNTIME_UNMODIFIED__MULTIMEMBER_PROVIDER_E2E_HOLD`.

DO NOT MERGE, DO NOT DEPLOY, DO NOT RUN WITH REAL EMPLOYEE DATA. Next review requires independently verified Backend+LIFF reader inventory, synthetic Google transaction Stage, failure injection and one separate Release Flow V2 authorization.
