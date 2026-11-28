# G7 Q35 — Backend/LIFF source-only single long leave and role scope
Date 2026-11-01. Paired Backend Draft PR #153, LIFF Draft PR #35.

Backend verified formal group receipt now exposes sourceEpoch and an immutable server-derived `singleLeavePolicyVerified` boolean **only after verifying the hashed PREPARED longLeavePolicyProof**. The Backend groups returned by its read projection are scoped to the authenticated caller's allowed Leave IDs; unrelated PREPARED groups do not affect the caller's own FULL_COMMITTED visibility.

LIFF Draft candidate now accepts a single-member group only with `singleLeavePolicyVerified===true`, requires the case's groupId and sourceEpoch to match exactly one authenticated backend group receipt, and rejects missing/malformed/forged group receipts before displaying or dispatching any candidate action. The source-only V173 guard was updated consistently. The 519 KB candidate bundle reuses the exact new bridge, while official V153 index and active bundle remain byte-identical.

All candidate modes still `DRAFT_DISABLED` and no real RPC login, LINE, Stage or Production call was executed. This is not authenticated browser or GO-LIVE acceptance.