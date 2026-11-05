# ABIS Human Gate Delta-Only Policy V1.1

- Policy ID: `ABIS_HUMAN_GATE_DELTA_ONLY_V1_1_20261105`
- Status: **FROZEN / SOURCE_OWNER_APPROVED**
- Effective date: 2026-11-05
- Supersedes: `ABIS_HUMAN_GATE_DELTA_ONLY_V1_20261105`
- Authority: `nooneknows70/abis-release-control`
- Registered governance scope: six repositories:
  1. `nooneknows70/abis-release-control`
  2. `nooneknows70/abis-ess-backend`
  3. `nooneknows70/abis-ess-liff`
  4. `nooneknows70/abis-payroll`
  5. `nooneknows70/abis-attendance-collector`
  6. `nooneknows70/ABIS_CRM`

## 1. Delta-only human confirmation

Human confirmation is **delta-only**. A previously accepted fact must not be asked again unless a dependency capable of invalidating that fact has materially changed.

Machine-verifiable facts must be checked automatically through Git, JSON, hash, manifest, provider readback, ACL metadata, resource identity, immutable evidence, or another existing trusted source. They must not be converted into repetitive human transcription.

One-shot execution is the default: reuse unaffected valid PASS evidence, run remaining READ_ONLY / offline / synthetic / static checks together, and stop only at the next genuinely new human authorization boundary.

## 2. Carry-forward

Use `CARRY_FORWARD_PASS` when:

1. prior evidence is accepted and traceable;
2. the relevant resource/source identity has not materially drifted;
3. the verified fact is not explicitly one-time, expired, transient, or superseded;
4. no new privilege or formal mutation is being authorized.

Elapsed time, a new chat, a new runner, a new terminal window, or a new package **does not by itself invalidate evidence**.

## 3. Isolation testing is capability-based, not account-based

Isolation strength is selected by the capability of the test. Do **not** automatically require a new Google account, new Apps Script project, new workbook, or new sandbox for every test.

### I0 — OFFLINE / STATIC

Use for documentation, linting, unit tests, synthetic in-memory tests, static analysis, schema parsing, source diffing, hermetic CI, and other tests with no live provider or formal-data access.

- Separate account: **not required**
- Separate cloud project/resource: **not required**
- Human gate: **not required**
- Reuse prior PASS: **required when unaffected**

### I1 — BOUNDED READ_ONLY

Use when live provider/resource access is required but the operation is provably read-only.

Requirements:
- exact target resource ID or bounded allowlist;
- no write-capable function invoked;
- no new OAuth scope/consent;
- no trigger/deployment/property/business-data mutation;
- read-only scope or equivalent code-path proof where available.

Separate test account is **not mandatory** solely because the target is Production. An existing authorized operator account may be used for a bounded READ_ONLY check when the tool/function is fail-closed read-only and the target identity is pinned.

Previously verified identity, ACL, Script ID, Workbook ID, scope, trigger inventory, or property state is carried forward until a relevant drift is detected.

### I2 — SYNTHETIC WRITE / STAGE RESOURCE

Use when a test must write data but the write can be confined to synthetic or Stage resources.

Requirements:
- writes target only pinned synthetic/Stage resource IDs;
- formal Production resource IDs are denied or excluded;
- no formal business data is copied into the synthetic resource unless separately approved;
- no Production deployment pointer, trigger, payroll, attendance, leave, raw punch, CRM formal record, or external-send mutation.

A **previously approved synthetic account / Script / workbook / Stage may be reused**. Do not create a new account/project/workbook for each attempt.

A separate test account is mandatory only when technical controls cannot reliably prevent the test from reaching formal resources. If exact resource allowlists plus fail-closed Production denylists prove the boundary, account-level isolation is optional.

### I3 — FORMAL MUTATION / EXTERNAL EFFECT

Use for:
- Production business-data writes;
- Production source push, immutable create, or deployment pointer update;
- OAuth/ACL privilege expansion;
- trigger creation/deletion/change;
- real LINE/Email/external notification send;
- formal Payroll, Attendance, Leave, Raw Punch, CRM record, or other irreversible/externally visible mutation.

This tier requires the applicable Source Owner / management authorization and the existing Release Flow V2 fail-closed controls. Prior read-only or synthetic PASS does not authorize I3.

## 4. Isolation evidence carry-forward

Do not repeatedly re-verify isolation when all relevant isolation dependencies remain unchanged.

Carry-forward examples:
- previously approved test principal;
- previously verified absence of formal-data access;
- pinned synthetic Script/Workbook/Stage IDs;
- unchanged OAuth scopes;
- unchanged ACL/sharing boundary;
- unchanged Production denylist and synthetic allowlist;
- unchanged runner/source hash governing resource selection.

Re-check only the dependency that drifted. Do not rebuild the entire isolation chain because one unrelated field changed.

## 5. Input-only HOLD and retry

If a run stops because of malformed, blank, mistyped, or missing operator input **before any mutation is unlocked or attempted**, classify it as `PRE_MUTATION_INPUT_HOLD`, not as a failed isolation or business-state test.

A fresh attempt with a fresh nonce may resume from the last unaffected PASS when zero mutation is proven:

- `mutationUnlocked=false`
- `releaseContinued=false`
- Production/source/schema/version/deployment/property/trigger/business/Payroll/Attendance/Leave/Raw Punch/CRM writes = 0
- external sends = 0

Do not erase or falsify spent ledgers. Do not rebuild synthetic resources solely because an input-only attempt was spent.

## 6. Human gate required only for new risk

A new human decision is required only when at least one of these applies:

1. new formal business-data mutation;
2. new Production source/deployment/version mutation beyond an already bounded authorization;
3. OAuth, ACL, sharing, credential, or privilege expansion;
4. trigger mutation;
5. first or materially changed formal external send;
6. authorization scope expands;
7. material drift conflicts with accepted evidence;
8. runtime outcome is unknown after possible mutation;
9. previous evidence explicitly expired or was superseded;
10. the test boundary cannot be proven technically and therefore requires stronger identity/resource isolation.

## 7. Prohibited process waste

- Do not ask again because a new chat/runner/window started.
- Do not require screenshots/manual retyping when accepted machine evidence proves the same unchanged fact.
- Do not create a fresh test account/project/workbook merely to satisfy a procedural habit.
- Do not split a single approved READ_ONLY/offline/synthetic scope into multiple artificial human gates.
- Do not rerun closed one-shot transactions merely to refresh evidence.
- Do not treat a read-only operator with Production visibility as unsafe solely because of account identity when the code path is provably read-only and target-pinned.
- Do not weaken fail-closed behavior when write capability, privilege expansion, or unknown mutation state actually exists.

## 8. Precedence

This policy removes redundant confirmation and unnecessary isolation overhead. It does not weaken Release Flow V2, bounded Source Owner authorization, mutation fail-closed controls, or formal-data protection.

The strictest control applies only to the **changed or higher-risk capability**. Unchanged verified facts and unchanged isolation evidence remain carry-forward eligible.

## Frozen outcomes

`REGISTERED_REPO_COUNT=6`

`ABIS_CRM_INCLUDED=true`

`REPEATED_MANUAL_CONFIRMATION=FORBIDDEN`

`MACHINE_VERIFIABLE_FACT=NO_HUMAN_PROMPT`

`UNCHANGED_ACCEPTED_EVIDENCE=CARRY_FORWARD_PASS`

`ISOLATION_MODEL=CAPABILITY_BASED`

`READ_ONLY_SEPARATE_ACCOUNT=NOT_REQUIRED_IF_FAIL_CLOSED_AND_TARGET_PINNED`

`SYNTHETIC_STAGE_RESOURCE_REUSE=ALLOWED`

`NEW_TEST_ACCOUNT_OR_PROJECT_PER_ATTEMPT=FORBIDDEN_UNLESS_RISK_REQUIRES_IT`

`PRE_MUTATION_INPUT_HOLD=SAFE_FRESH_RETRY_IF_ZERO_MUTATION_PROVEN`

`FORMAL_MUTATION_OR_PRIVILEGE_EXPANSION=HUMAN_GATE_REQUIRED`

`MATERIAL_DRIFT=TARGETED_RECHECK_ONLY`
