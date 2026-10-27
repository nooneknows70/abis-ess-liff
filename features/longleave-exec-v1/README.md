# Long Leave Executive Approval V1 — LIFF UI candidate

Q1-Q17 Source Owner policy frozen 2026-10-27. This is an unmounted, feature-OFF candidate on a new development branch of the **existing** LIFF repository; no new app/project.

Files:
- \`features/longleave-exec-v1/approval-panel.js\`: supervisor handover checkbox and note, executive original reason and lower-stage review, return/reject/approve, timeline and employee-restricted status views. zh-TW/vi/th fallbacks and HTML escaping.
- \`tests/test-longleave-ui-v1.cjs\`: eight offline checks with fake data, 8/8 local PASS; not provider E2E.
- \`contracts/longleave-exec-v1.json\`: exact Backend counterpart contract blob.

The frontend is **not loaded by \`index.html\`**, does not call LINE/network, cannot submit real leave, and fails closed with \`ACTIVE=false\`. \`mount\` takes a future authenticated transport; the real backend provider and group-atomic Sheet adapter have NOT been authorized or built. Do not interpret the mock strings as proof of UI integration.

Existing deployed frontend release Manifest V153 remains unchanged. Do not attach this asset to a live/static loader or enable the feature until Source Owner authorizes separate bounded provider and release gates. Continue following frozen Q1-Q17 policy and the cross-repo SSOT.
