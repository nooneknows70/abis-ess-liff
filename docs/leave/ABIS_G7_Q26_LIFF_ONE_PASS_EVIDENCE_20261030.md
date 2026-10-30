# ABIS G7 Q26 LIFF integrated candidate — 2026-10-30

**Status: LIFF Draft candidate 13/13 PASS, real browser / backend release HOLD.**

- Source Owner required **one integrated test across Backend, LIFF and synthetic Provider evidence**, no repeated stage-by-stage approvals.
- LIFF PR #34 SHA `e26a43921120fc7461de5fabd17b5916a7918d64`. GitHub Actions `G7 Q21-Q26 Full LIFF Formal Client Gate (offline only)` run `41003520097`: **13/13 PASS**, zero failed.
- Candidate source `assets/ess-20261029-g7-q21-candidate/abis-ess.bundle.js` has a hard-disabled `ABIS_G7_LIFF_FORMAL_FENCE_`. The test ACTIVE harness rejects `ASSIGN_PROXY`, `PROXY_ACCEPT`, `MANAGER_APPROVE`, `TOP_APPROVE`, and `REJECT` before client mutates when the formal atomic server writer is not verified; it rejects partial/forged server-projection envelopes.
- Existing historical LIFF published bundle `assets/ess-20261007-rc13-hf8/abis-ess.bundle.js` has byte-identical SHA in this branch and main. LIFF root login and Backend V169 HTML active script pin remain unchanged. Candidate asset is NOT currently published or loaded by real users.
- Corresponding Backend PR #124 run `41003338236` **316/316 PASS**, using an immutable synthetic Q25R real Google Provider readback fixture with a new Backend `G7FormalGroupAuthority.js` and all five approval route safeguards. Formal Apps Script executor/real Journal reader still unbound and disabled.
- Q25R previous real Google Sheets synthetic-only multi-tab E2E **CLOSED PASS (19/19 independent readback)**; not rerun. Formal Production mother Sheet Journal/Outbox still empty.
- No real browser with authenticated employee/manager/HR identities, LINE delivery, Apps Script Stage function, formal transaction authority, live multi-group concurrency or Production Release Flow V2 has been tested by this CI. Do not merge or deploy based on synthetic PASS.

Main handoff: https://github.com/nooneknows70/abis-ess-backend/blob/draft/g7-q20-synthetic-contract-20261029/docs/leave/ABIS_G7_Q26_ONE_PASS_BACKEND_LIFF_INTEGRATED_ACCEPTANCE_20261030.md

Final gate: `G7_Q26_LIFF_13_13_PASS__BACKEND_316_316_PASS__REAL_STAGE_BROWSER_AND_FORMAL_RUNTIME_HOLD`.
