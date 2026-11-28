# Long Leave Executive Approval V1 — LIFF UI candidate

Q1-Q17 Source Owner policy frozen 2026-10-27. This is an unmounted, feature-OFF candidate on a new development branch of the **existing** LIFF repository; no new app/project.

Files:
- \`features/longleave-exec-v1/approval-panel.js\`: supervisor handover checkbox and note, executive original reason and lower-stage review, return/reject/approve, timeline and employee-restricted status views. zh-TW/vi/th fallbacks and HTML escaping.
- \`tests/test-longleave-ui-v1.cjs\`: eight offline checks with fake data, 8/8 local PASS; not provider E2E.
- \`contracts/longleave-exec-v1.json\`: exact Backend counterpart contract blob.

The frontend is **not loaded by \`index.html\`**, does not call LINE/network, cannot submit real leave, and fails closed with \`ACTIVE=false\`. \`mount\` takes a future authenticated transport; the real backend provider and group-atomic Sheet adapter have NOT been authorized or built. Do not interpret the mock strings as proof of UI integration.

Existing deployed frontend release Manifest V153 remains unchanged. Do not attach this asset to a live/static loader or enable the feature until Source Owner authorizes separate bounded provider and release gates. Continue following frozen Q1-Q17 policy and the cross-repo SSOT.


## 2026-10-27 updated independent V8 source acceptance

This updates (does not erase) historical 8 UI tests: U01-U16 **16/16 V8 replay PASS**; Backend policy 36, mapping 6, boundary 20, group 18, combined **96/96 V8 replay PASS**. The actual Node single-batch runner in Backend \`tests/run-longleave-all.cjs\` is prepared **but not executed**; no GitHub CI / Apps Script / Provider Stage E2E PASS.

LIFF UI now distinguishes SUPERVISOR_SUPPLEMENT from SUPERVISOR_SUBMIT, displays approved-original versus pending/rejected amendment outcomes, supports zh-TW/vi-VN/th-TH language tags and refuses unknown mount roles. Still \`ACTIVE=false\` and **not mounted to any Production UI**. Cross-Repo \`contracts/longleave-exec-v1.json\` exact blob parity reverified after the 96-case update.

RC5 Stage \`G0_STAGE_REUSE_HOLD\`; no import, code execution, token access, LINE or deployment. Provider design and proposed safe isolated Stage next Gate documented in Backend \`docs/leave/ABIS_LLEX_V1_PROVIDER_STAGE_G0_MATRIX_20261027.md\`. Neither new formal ESS project nor new LIFF repo is required.
