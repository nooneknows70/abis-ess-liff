# Attendance Export V1 candidate QA evidence

Gate: `ABIS_ESS_ATTENDANCE_EXPORT_V1_CANDIDATE_QA_PENDING`.
**Engineering and integrated acceptance: HOLD. This is an incomplete candidate, not a production-ready release.**

46 new offline tests PASS / 0 FAIL / 0 SKIP. Independent Python ZIP/XML parser PASS for synthetic two-month XLSX (133/129 columns, 3 headers, CRC/XML validity and frozen panes). Real Excel rendering, exact official formatting and production source parity of business data are NOT verified. Actual legacy LIFF + existing HRLB + new adapter exercised in synthetic parsed DOM; this is not a browser or mobile-device test.

Public daily sync is DISABLED. API storage binding deliberately returns HOLD; therefore a production HR cannot yet use this feature. No trigger installer exists. Candidate-only durable store and orchestrator contracts are tested, but source normalizer / production storage services / full template properties remain unimplemented. No successful official snapshot is claimed.

Coverage: September STAGED H preservation; B10601 Oct2 personal8; B09502 canonical duplicate4.5 and distinct intervals; historical Oct31 annual; A09906 new cycle; A11510 zero pending; A11511 unknown; rest correction/WORK conflict; one-sided punch; cross-date night; exemption/leave/correction; morning ongoing/future blank; weekday OT HOLD; color/notes; idempotency/overlap/retry/source failure/LKG; durable partial failure/tamper/CAS; HR/ADMIN/denied/expired; versioned download; XML text safety and selected months; Index/PERF7/legacy source integrity.

Formal-source metadata and header sentinels were read with existing Oscar connection. First Mike read returned403; no permission change; Oscar succeeded. Three ACL metadata responses show shared=false and one owner entry. This does not prove runtime OAuth grants. No personal punch/payroll rows were exported to GitHub.

New live readback found @187, four existing deployments. Immutable @187 and HEAD each match current Backend main 100/100 SHA256. Central @175 and HRLB @176 summaries are stale. Preserve historical scoped evidence instead of rewriting PROD_CURRENT. Collector/Payroll source manifests remain UNVERIFIED; do not infer current Trigger identity or source coverage.

Next work: reconcile the stale summaries using captured provider evidence; finish verified source/storage/template bindings and bounds; complete targeted live read-only Trigger/Collector/scope inspection; then independent ChatGPT QA. Scheduler precision and production enablement remain separate owner decisions. No fresh employee backfill/recovery transaction, old Stage test or historical release was executed.
