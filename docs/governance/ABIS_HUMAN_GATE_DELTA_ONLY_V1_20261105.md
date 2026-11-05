# ABIS Human Gate Delta-Only Policy V1

- Policy ID: `ABIS_HUMAN_GATE_DELTA_ONLY_V1_20261105`
- Status: **FROZEN / SOURCE_OWNER_APPROVED**
- Effective date: 2026-11-05
- Authority: `nooneknows70/abis-release-control`
- Scope: ABIS five-repo employee-system governance and all ESS / HRLB release, verification, Stage, Production, Payroll and Attendance workflows.

## Decision

Human confirmation is **delta-only**. A fact that has already been verified by accepted evidence must not be asked again unless a dependency that can invalidate that fact has changed. Facts that can be verified by machine-readable evidence, Git, provider readback, JSON, hashes, manifests, ACL metadata or existing immutable evidence must be verified automatically and must not be converted into repetitive human prompts.

One-shot execution is the default: reuse unaffected valid PASS evidence, run the remaining READ_ONLY / offline / synthetic / static checks together, and stop only at the next genuinely new human authorization boundary.

## Carry-forward rule

Use `CARRY_FORWARD_PASS` when all of the following are true:

1. The prior evidence is accepted and traceable.
2. The relevant Script / repository / commit / source / manifest / resource identity is unchanged.
3. No dependency that materially affects the verified fact has drifted.
4. The prior result was not explicitly scoped as one-time, transient, expired, or superseded.
5. No new privilege or mutation is being authorized.

Elapsed time by itself is **not** sufficient reason to re-ask a human. Freshness must be tied to an actual time-sensitive dependency.

Previously verified facts are not re-entered manually merely to satisfy a runner prompt. The runner must consume the evidence or perform a machine readback.

## Machine-first verification

When a fact can be checked automatically, the runner must prefer machine verification over human transcription. Examples include:

- Git branch, commit, tree and blob identity.
- Manifest and source hash parity.
- Script ID, spreadsheet ID and resource identity.
- Existing deployment pointer and immutable-version metadata.
- Trigger inventory and OAuth/ACL metadata when the provider exposes them read-only.
- Existing evidence JSON fields and accepted prior PASS results.
- Known absence/presence of configuration properties when a trustworthy readback exists and no related drift occurred.

A terminal prompt must not require the operator to manually retype a known machine-verifiable fact.

## Human Gate required only for new risk

A new human decision or authorization is required when at least one of the following applies:

1. New Production business-data write.
2. New Payroll, Attendance, Leave, Exception, Raw Punch or other formal data mutation.
3. Production deployment pointer change, immutable version creation, or production source push not already covered by an explicit bounded authorization.
4. OAuth scope expansion, new privilege, ACL/sharing expansion, or new credential use.
5. Trigger creation, deletion or modification.
6. First formal external LINE / Email / notification send or a materially changed send scope.
7. Merge / release scope exceeds the previously authorized boundary.
8. Machine verification detects material drift or conflicting evidence.
9. The previous evidence explicitly states that it is one-time, transient, expired, superseded or not reusable.
10. Runtime outcome is unknown after a possible mutation, so safe replay cannot be proven.

## Drift that invalidates carry-forward

Material drift includes, as applicable:

- source/blob/tree/commit hash change;
- manifest change;
- Script / Spreadsheet / resource ID change;
- deployment pointer or deployment inventory change;
- operator/runtime principal change where principal matters;
- ACL/OAuth/Trigger change;
- configuration property state change;
- changed business rule or management policy;
- evidence conflict, corruption, missing provenance or explicit supersession.

Unrelated changes do not invalidate unrelated PASS evidence.

## Pre-mutation input HOLD and retry

If a run stops only because of malformed, blank, mistyped or missing operator input **before any mutation is unlocked or attempted**, classify it as `PRE_MUTATION_INPUT_HOLD`, not as a business-state failure.

A safe fresh attempt may be issued without repeating upstream PASS evidence when all relevant counters/readbacks prove:

- `mutationUnlocked=false`
- `releaseContinued=false`
- Production writes = 0
- source writes = 0
- schema writes = 0
- version/deployment writes = 0
- property/trigger writes = 0
- business/Payroll/Raw Punch writes = 0
- external sends = 0

The new attempt must use a fresh attempt ID / nonce. Do not erase or falsify an existing spent ledger. If mutation state is unknown, replay remains HOLD.

## Prohibited behavior

- Do not re-ask a fact solely because a new chat/window/runner started.
- Do not require screenshots or manual transcription when accepted machine evidence already proves the same unchanged fact.
- Do not split one approved read-only/offline verification scope into multiple artificial human gates.
- Do not rerun closed one-shot transactions merely to refresh evidence.
- Do not treat `CARRY_FORWARD_PASS` as Production GO-LIVE or as authorization for new mutation.
- Do not bypass fail-closed gates when actual drift, new privilege, new mutation, or unknown post-mutation state exists.

## Precedence

This policy reduces redundant confirmation; it does **not** weaken Release Flow V2, fail-closed behavior, bounded Source Owner authorization, or formal Production mutation controls.

When policies conflict, the stricter rule applies only to the genuinely changed or higher-risk boundary. Unchanged verified facts remain carry-forward eligible.

## Frozen governance outcome

`REPEATED_MANUAL_CONFIRMATION=FORBIDDEN`

`MACHINE_VERIFIABLE_FACT=NO_HUMAN_PROMPT`

`UNCHANGED_ACCEPTED_EVIDENCE=CARRY_FORWARD_PASS`

`ONE_SHOT_READONLY_OFFLINE_SYNTHETIC=DEFAULT`

`PRE_MUTATION_INPUT_HOLD=SAFE_FRESH_RETRY_IF_ZERO_MUTATION_PROVEN`

`NEW_PRIVILEGE_OR_FORMAL_MUTATION=HUMAN_GATE_REQUIRED`

`MATERIAL_DRIFT=HUMAN_REVIEW_REQUIRED`
