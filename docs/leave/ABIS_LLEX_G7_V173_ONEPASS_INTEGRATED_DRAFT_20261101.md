# ABIS ESS LLEX G7 — V173-aligned isolated integrated Draft
Date: 2026-11-01 (Asia/Taipei)
Status: DRAFT_ONLY / LIFF_V153_UNCHANGED / NOT_DEPLOYABLE

## Frozen authorities
- LIFF main base: 40c72af42fe7dba80bcd5eb4fd38c63769520640; original index.html and ess-20261007-rc13-hf8 bundle are byte-identical.
- Policy UI source PR #27: fbe14c5232fe6a523492493d409caa09c8f36d0a.
- G7 projection guard/standalone asset PR #34: e5eb137491d6b82aa199b237fa7b6b004e44da8d.
- Backend independent integrated Draft branch: feature/llex-g7-v173-onepass-integrated-20261101; do NOT assume Backend release by merging LIFF.
- Backend operational LIVE Apps Script @173 is separate from fully audited PROD_CURRENT @170.
- Q1-Q17 frozen manager rules, threshold >=3 equivalent working days, supervisor review/handover only, executive final authorization only.

## Activation boundary
- features/longleave-exec-v1/approval-panel.js ACTIVE=false; never mounted by official index.html.
- G7 candidate asset formal guard DRAFT_DISABLED; not referenced by the active LIFF bundle.
- No provider binding, real employee data, OAuth, LINE, Production, Payroll, Trigger, Deployment or manifest updates.
- This code snapshot is a combined review carrier, NOT functional G7 live approval.

## Single-pass offline acceptance
- Workflow llex-g7-v173-onepass.yml runs one combined isolated Node gate; tests policies, zh/vi/th UI safety, G7 read barrier and immutable V153 asset pins.
- Backend combined gate includes cross-Repo byte-exact pinned LIFF fixtures, 96-case policy+UI harness and Q19-Q29 offline G7 guard regression once, not re-executing consumed Google Stage operations.

## Remaining HOLD
Formal multi-group durable atomic writer, authoritative cross-consumer readers, reconciliation of cross-workbook Attendance and LINE outbox, authenticated Backend/LIFF/browser E2E, real fault/concurrency exercises, security review, separate Source Owner Release Flow V2 approval and live readback. Never toggle a draft constant to ACTIVE.