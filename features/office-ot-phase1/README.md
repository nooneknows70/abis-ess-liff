# ABIS ESS Office OT — Q33 LIFF Draft-only integration

Status: **DRAFT / FEATURE OFF / NO RUNTIME MOUNT / NO LINE CALL / NO PRODUCTION WRITE**.

- Source authority: Backend Issue #62 Q1–Q30 frozen, effective policy date 2026-11-01 (not deployment approval).
- Baseline: LIFF \`main\` at \`99e03dc975c43de1ba0cf06dd8a471ca0b370404\`; immutable Production LIFF V153 remains unchanged.
- The file \`ABIS_OFFICE_OT_PHASE1_UI.html\` is the complete local synthetic candidate fragment from the checked RC1 batch; it is **not loaded** by \`index.html\` or any existing versioned static asset.
- \`feature-gate.js\` unconditionally returns \`OFFICE_OT_P1_Q33_DRAFT_ONLY\`; there is no dependency on real LINE identity, token or runtime Google Script session.
- The Backend Draft branch implements explicit \`officeOt*\` API actions behind an unconditional HOLD guard. Existing UI is unchanged.
- No real identity, effective employment/Payroll eligibility, manager proxy, HR, workday calendar, authenticated deep-link or storage adapter is connected.
- When separately authorized for Stage, a future release must connect this component to the existing “我的出勤” UI and manager “待我處理” using the already registered app session and server-generated eligibility flag; mere client flags do not authorize actions.
- Q8 LINE notifications exist as **intent previews only**; no LINE API invocation or actual User ID/token fetch.
- Q30 Phase 2 comp-time/payroll/leave integration remains locked.

This Q33 PR is a source-review candidate, **not Phase 1 implementation acceptance**. No merge or deployment without separate Source Owner authorization and Release Flow V2 gates.
