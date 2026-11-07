# G7 Q21 LIFF real bundle integration / immutable asset strategy

Date 2026-10-29. **DRAFT, no merge, no GitHub Pages publication or Production deployment.**

- Actual Backend HTML `nooneknows70/abis-ess-backend/src/Index.html` loads the UI bundle from the LIFF repo GitHub Pages. LIFF root `index.html` is LINE identity redirect only. Both matter to scope review.
- Historical published bundle `assets/ess-20261007-rc13-hf8/abis-ess.bundle.js` is **preserved byte-identical to LIFF main**; history has not been rewritten. Existing label-only adapter `assets/ess-20261027-leave-approval-label-rc1/leave-approval-label.js` is unchanged.
- Q21 new immutable draft bundle: `assets/ess-20261029-g7-q21-candidate/abis-ess.bundle.js`. It adds a hard-disabled `ABIS_G7_LIFF_FORMAL_FENCE_` before `call(action,payload)`: incoming leave-related Backend results are screened by the eventual **server-authoritative** read projection when the release mode is activated. `approveAction` gets a fail-closed top approval guard for an incomplete atomic server writer.
- New candidate does not change any account or LINE authentication, has no call to the real transaction provider and cannot by itself authorize a group approval. Client envelope boolean fields are **not sufficient security evidence**; only Backend can enforce visibility.
- Source + test are covered by `.github/workflows/g7-q21-liff-gate.yml`, **9/9 local synthetic tests PASS**, including actual ~500kB V8 bundle parse and historical asset immutability.
- Active Backend `src/Index.html` stays pinned to the old asset to preserve frozen V169 label CI. New bundle is not currently published or loaded by formal users.
- Future Release Flow V2 requires (i) actual server-side G7 ledger/read-after-commit and entire side effect safe transaction, (ii) independent multi-user Stage tests, (iii) first publish the versioned LIFF asset, then pin Backend HTML to new URL via separately approved release, (iv) readback/rollback. Neither repo Draft may be merged without those gates.
- Backend central handoff: https://github.com/nooneknows70/abis-ess-backend/blob/draft/g7-q20-synthetic-contract-20261029/docs/leave/ABIS_G7_Q21_FORMAL_BACKEND_LIFF_INTEGRATION_HANDOFF_20261029.md

Gate: `G7_Q21_LIFF_REAL_BUNDLE_GUARD_CI_9_9_PASS__IMMUTABLE_ASSET_READY_DRAFT__NOT_PUBLISHED__REAL_SERVER_READ_BARRIER_HOLD`.
