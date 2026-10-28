# ABIS ESS LLEX V1 — G3 LIFF contract/interface design (READ_ONLY, 2026-10-28)

Gate: **`G3_LIFF_CONTRACT_STATIC_DESIGN_PASS__PROVIDER_UI_MOUNT_HOLD`**. Source Owner Q1=A permits reading existing GitHub sources/docs and writing isolated Draft documentation **only**. No LIFF publishing, code or UI activation, real login, token, employee record, LINE or Production changes.

## Source and current state

- Draft candidate: `features/longleave-exec-v1/approval-panel.js` Git Blob `a4d92d7ad40f1a9e301462023bd5c17d96add191`; language labels zh-TW / vi-VN / th-TH, `ACTIVE=false`, no bound network transport, not mounted in released index.
- Backend Draft: `src/ABIS_LONG_LEAVE_EXEC_V1.js` policy; `src/ABIS_LONG_LEAVE_EXEC_V1_MAPPING.js` legacy mapping; `src/ABIS_LONG_LEAVE_EXEC_V1_GROUP_PLAN.js` pure planner, `readyForProviderMutation=false`.
- Backend `longLeaveExecV1Action` remains `LLEX_V1_PROVIDER_NOT_BOUND_HOLD`; do not call legacy `approvalAction` from the proposed UI because the business semantics differ.
- G2 pure Stage runtime operator-attested 22/22 PASS but **not Provider E2E**. See stacked G2 docs `ops/handoff/2026-10-28.md`.
- Backend Production @169 is separate approved button label `核准申請` with existing action `ASSIGN_PROXY`; LIFF manifest remains its own V153 source authority. Neither authorizes this new long-leave panel.

## Verified current UI implementation

| Observed source behavior | Design implication |
|---|---|
| `mount(el,kind,data,lang,transport)` supports `employee`, `supervisor`, `executive` but throws `LLEX_FEATURE_HOLD` while `ACTIVE=false` | Do not flip the flag or attach to live route |
| Supervisor form checks `handoverConfirmed` checkbox and nonempty note before submitting `SUPERVISOR_SUBMIT` or `SUPERVISOR_SUPPLEMENT` | Backend must independently validate and record authorized supervisor + trusted handover |
| Executive supports `EXECUTIVE_APPROVE`, `EXECUTIVE_RETURN`, `EXECUTIVE_REJECT`; return/reject reason required in panel | Backend validates authority, state, reason, version and trusted scope |
| Employee view shows effective-approval-pending-amendment and rejected-amendment labels | Backend must send role-sanitized effective snapshot and amendment outcome without leaking history |
| Transport called as `transport(action,payload)` | Existing UI does **not** yet carry `requestId`, `expectedVersion`, `sourceEpoch`, `groupId`, `groupHash`, authoritative role, structured receipt; must **design a separate adapter** before mount |
| History HTML reads `event.type/at/actorId/to` | History visibility must depend on authorized role; employee should never receive raw internal events |
| UI uses escaped HTML in fields and renders status text | Continue escaping and never interpolate opaque credentials into visible errors/logs |

## Proposed contract (not implemented)

1. **Feature negotiation**: `longLeaveExecV1Status` currently returns `featureEnabled=false`, `providerBound=false`. Show unavailable/legacy UI until server attests both flags and correct policy version. Client flag cannot override server decision.
2. **Read model**: `loadLongLeaveView(leaveId)` is hypothetical. Server-authenticated, role-sanitized response `{policyVersion, caseId, groupId, sourceEpoch, groupHash, revision, expectedVersion, status, effectiveApprovalExists, amendmentOutcome, allowedActions, roleView}`. No private session data or third-party notes are sent beyond role necessity.
3. **Command binding**: Future UI adapter takes `action,payload`, adds unique stable `requestId`, `expectedVersion`, trusted server-issued snapshot token/epoch, then sends one server transaction. It must not let browser-provided `actorId`, `executiveScopeAllowed`, `currentSupervisorId`, `delegations`, `lowerStagesReady` or equivalent days override Backend authority.
4. **Replay handling**: On uncertain response, query a future scoped receipt endpoint; stale scope or actor mismatch should return HOLD without internal history. Never blindly repeat approval.
5. **Group state**: UI must distinguish a row-level action from the whole group action; show count/summary only if server grants scope, and stop if membership/version changed.
6. **Legal workflow clarity**: **Supervisor submits/forwards with handover**; **executive makes final decision**; proxies only receive notifications unless separately authorized. Keep prior manager UI text-only V169 scope separate from actual LLEX approve action.
7. **Amend / cancel**: Material changes restart supervisor handover and executive evaluation; rejected amendment preserves original effective approval; cancellation post-payroll/attendance reconciliation remains a separate HOLD workflow.
8. **Accessibility/locales**: Use server-provided canonical enums, translate using zh/vi/th dictionaries, never derive policy from labels. Explicit display for `HISTORICAL_NOT_PROVIDED`, `POLICY_CLASSIFICATION_CHANGE_HOLD`, version conflict and insufficient authority.

### Proposed synthetic fixture acceptance matrix (not executed)

| ID | Mock UI assertion |
|---|---|
| UI-G3-01–03 | feature off/unbound means no mount and no transport |
| UI-G3-04–06 | three locales equivalent for supervisor handover, executive action and employee status |
| UI-G3-07–09 | no unauthorized action; executive reason required; current supervisor replacement rejects stale receipt |
| UI-G3-10–12 | member/version/source-epoch drift HOLD, stable idempotency request, post-error receipt check |
| UI-G3-13–15 | role redaction, historical evidence missing label, amended approval remains effective on revision rejection |
| UI-G3-16–18 | HTML escaping, no credential exposure, no network/LINE/Production side effects |

**Tests designed: 18; tests executed in G3: 0.** G2 22/22 remains separate.

## Blocking G4+ gate

- Exact live Sheet headers/types and server-side authority semantics unverified (A for G3 forbids live reads).
- Dedicated Backend Provider must prove atomic group persistence or formally fail closed; legacy `ScriptLock` alone is not transaction atomicity.
- LIFF UI component not mounted, transport not bound, user identity/role read model not independently tested.
- No existing Production/LIFF V153 assets, git main, Manifest, Trigger, Deployment, OAuth, Script Properties, Payroll/Attendance or LINE may be changed under G3 authorization.

**Next:** a separately approved metadata-only Provider Schema Gate, if safe, followed by independently authorized synthetic Adapter design/implementation. No manual user test of LIFF is required at this stage.
