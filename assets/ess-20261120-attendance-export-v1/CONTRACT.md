# Attendance Export V1 engineering and source contract

Rule: ABIS_ESS_ATTENDANCE_EXPORT_FROZEN_V1_20261120. Candidate only.
Central policy: `nooneknows70/abis-release-control/docs/attendance-export/ATTENDANCE_EXPORT_FROZEN_V1_20261120.md`.

## Boundaries

`AttendanceExportFrozenV1.build(input)` is pure. `AttendanceExportDailySync.run(env)` composes source-read/verification, shared lock, journal and atomic publication ports. `AttendanceExportAccess.execute` reuses existing server actor authority. `AttendanceExportXlsx.parts/encode` serializes identical cells. No client calculation of leave, annual or OT.

Production integration is explicitly INCOMPLETE: `attendanceExportEnvironment_().readSnapshot` throws VERIFIED_SNAPSHOT_STORAGE_BINDING_REQUIRED; `attendanceExportDailySync()` returns DISABLED. A callable candidate API is not a deployed or enabled feature. Do not remove these guards simply to make a runtime demonstration pass.

## Source identity and verified fields

| Domain | Pinned resource | Fields / precedence |
|---|---|---|
| Export | 1SCJ_300JdXaJZ8Er7Hh2yeGT71VAG4hMmIogmbmnWiI | Exact visible tabs 2026年 9月 / 10月 / 11月; 3 frozen rows, 2 columns |
| Attendance | 1w2gavSFoIDpvcg-WE-kfUxrMgPENHmNgHE_XeZ_cYi8 | LEAVE_FACT_請假事實, DAILY_ATTENDANCE_每日出勤, ATTENDANCE_AUTHORITY_來源優先序 |
| Leave | 16_fQq5_SGrYz_WdzNUABRhCYdsmhfZj7ZQCC61m5cpM | 特休台帳; employee/leave authority remains separate |

IDs are identifiers, not credentials. Runtime must resolve existing config and verify equality before reads; no silent fallback ID.

LEAVE_FACT headers read back: LeaveFactKey, LeaveID, 員工ID, Date, 假別代碼, 假別名稱, 開始時間, 結束時間, 核准HR, LedgerStatus, SourceLeaveStatus, SourceHash, Environment, SyncNote, Locked, 申請型態. Normalize only PROD/ACTIVE/已核准. `LeaveFactKey` is a projection identity, not evidence that different LeaveIDs are equivalent. Unknown manual/electronic overlap => HOLD until formal witness is available.

Ledger headers: 台帳ID, 員工ID, 週期開始, 週期結束, 已核准使用HR, 待核准預占HR, 可再申請HR, Opening來源, 其他調整HR, HR確認. Never recompute available from H. Historical asOf requires captured/reconstructed evidence; current row alone does not establish historical balance.

DAILY fields: AttendanceKey, Date, 員工ID, 班別代碼/名稱, 應上班/下班, 第一筆上班, 最後一筆下班, 原始跨度HR, 實際出勤HR, 缺上/下班卡, 出勤狀態, 異常代碼, 人工調整Flag, 月結狀態, 計算版本, 最後計算時間, SourceHash, Locked. **Do not map these directly into final A-track facts without checking schedule/verified authority/night-window/approved correction/day policy and source completeness.** In particular `核准加班HR` is not the export's default A-track OT.

ATTENDANCE_AUTHORITY contains September site-specific verified sources marked STAGED_PENDING_INTEGRATION. No guessed promotion to formal authority. The new source normalizer is an unresolved engineering item, not an authorization to overwrite existing September exports.

## Normalized schema

Snapshot: schemaVersion=1, ruleVersion, month YYYY-MM, snapshotVersion immutable attempt ID, cutoff ISO timestamp, lastSuccessfulSync ISO timestamp, status, anomalyCount, headers[3][9+4*days], columns[], merges[{r1,c1,r2,c2}] zero-based inclusive, rowHeights, frozenRows=3, frozenColumns=2, rows[][cells]. Cell: value (number or literal string), bg/color #RRGGBB, bold boolean, note string. Formula-looking text is inlineStr in XLSX, never executable formula.

Build input has employees unique by employeeId and employment start/end dates; days unique by employee/date; leaves; annual; formalLeaveMonthComplete; previousByEmployee; weekdayContract; template. Every required source domain has readable=true, complete=true, hash, version and cutoff >= batch cutoff. source asOf timestamps must be coherent, not latest wall-clock claims.

Day fact includes authorityHash, assignmentVerified, employmentVerified, nightWindowVerified, actualIn/out, windowStart/end timestamps including cross-day offsets, formalSchedule, dayType, shift, hoursComplete, otHours. Approved exemption/correction/full-day leave coverage must be demonstrated by source adapter, never trusted client flags. Rest checks explicitly attest employment/schedule/leave/exempt/night/correction/hours. No raw punch pairing in this module.

Leave fact: employeeId,date,leaveId,type,start,end,hours,environment,status,approval,sourceIdentity,sourceHash; optional canonicalLeaveId requires formal equivalence witness retained by binding/audit. Nonoverlap same-day intervals remain distinct. Annual: employeeId,cycleStart/end,asOf,availableHours,environment,status,sourceHash,hrConfirmed. Missing facts display pending or HOLD; no default zero. previous annual: approved/asOf/value/note; previous leave: approved/value. reviewNotes indexed by zero-based column, separately certified by binder; sync does not accumulate prior generated notes.

`nextTemplate(month,seed)` changes dates, weekdays and day-block merge geometry only. Verified seed includes authorityHash, header cells, widths and merges. invariantHeaderNotes is an explicit reviewed allowlist; prior month generated notes do not carry over. Full real column-width/merge/font parity is not verified in this round; current serializer supports value/background/foreground/bold/notes, Arial11/center/borders/wrap. Other original font/number/row properties require capture and parity work before acceptance.

## API / access

Main actions: attendanceExportQuery and attendanceExportDownload. Payload sessionToken, startMonth/endMonth, ruleVersion; download additionally versions[month]. Existing `p5a1HrlbActor_` validates token hash, expiry, revocation, credential session version, LINE binding/idle and active employee HR/ADMIN. No new identity system. p4a10AuditEvent_ is the existing audit writer; invocation is only after deployment, never in offline tests. Failure to append audit fails closed. Responses omit raw source identities and employee anomaly arrays. Both endpoints independently authorize; download requires a version for every selected month. Range cap 24 months; server must additionally size-bound production responses before enabling large staff sets.

Query returns safe snapshot cells; download returns fileName/mimeType/base64. No raw Google URL, shared file, audit worksheet or unselected month. XLSX uses native Utilities ZIP; no new service or scope configuration. Effective existing grants still require readback, not inferred from manifest.

## Sync / persistence ports

env: mode AUTHORIZED (only internal), schedulerApproved, now/uuid/hash, lock=shared ScriptLock, readSources, verifySources, store. Never supplied by API payload. readSources returns coherent months[], cutoff, sourceVersions. closedMonth revisions require authorization + previousVersion + diffHash. The public entrypoint remains unconditionally disabled until reviewed binding exists.

Store: append-only journal; success(key); commit(key,snapshots,receipt) atomic; readSnapshot(month,version). Candidate Drive-backed store receives an already approved folder and binding hash, never creates a folder. Immutable JSON files/receipt precede ONE ScriptProperty index update under same shared lock. Orphan files are unpublished. Full previous versions retained, content hash verified on read, duplicate success rejected. 8KB safe index ceiling => explicit storage migration HOLD, never truncate historical successes. No provisioning or real store calls performed this round. Storage/services production wrapper remains pending.

Journal records attempt and result with safe error code; no token/punch/payroll detail. Success receipt includes started/completed/cutoff, sourceVersions/hash, row/anomaly counts. Failure keeps LKG. Unknown commit outcome reads success index before retry.

## Scheduler

08:40 Asia/Taipei every day; scheduler HOLD, DISABLED. Existing source includes R2174 canonical 5-minute trigger and 08:40/20:40 notification dispatcher. Historical seven-trigger receipt is historical, not current inventory. Do not install competing recalc. Read current actual triggers, Collector ingress watermark and source locks before selecting precise scheduler or accepting Apps Script ±15-minute tolerance. No installer and no paid service in candidate. Google nearMinute contract: https://developers.google.com/apps-script/reference/script/clock-trigger-builder#nearMinute(Integer).

## Release Flow V2 / rollback (plan only)

1. Independent ChatGPT QA: inspect exact commits, unresolved items, fixtures, API/DOM/XLSX evidence. Candidate QA_PENDING is not PASS.
2. Finish source/storage/template binding and real read-only authority reconciliation; no business source writes. Obtain scheduler precision decision and bounded production authorization only when exact reviewable candidate exists.
3. RELEASE later: verify unchanged baseline/CI/source diff, publish versioned LIFF via approved merge, verify HTTP/hash, bounded Apps Script carrier including Main/Index/PERF7/new modules, immutable readback, existing deployment ID only. No full current-main push over separately deployed carrier.
4. GO-LIVE later: verify sources, ACL/effective scopes, trigger cardinality, store config/rollback; perform authorized bounded snapshot publication; only then install/enable specifically authorized scheduler. Any new OAuth/Drive scope => stop and separate gate.
5. FINAL VERIFY later: first real cycle, no duplicate success/trigger, actual XLSX/UI parity and access audit. Only then PROD_CURRENT.

Rollback before release: discard candidate branch, no production rollback needed. After separately authorized future release: return existing deployment pointer to captured actual pre-release immutable, revert versioned Index/PERF7 URL to exact baseline, disable only newly authorized export scheduler, keep original source/ledger/raw records and immutable snapshots/audit. Restore export LKG index from captured pre-batch value under lock if explicitly authorized; never delete history or rerun one-shot backfill. No assumption that @175 is today's rollback: capture live authority first.


2026-11-20 本輪實際唯讀更新：clasp deployments 確認原 Production pointer @187（bc18df7 PR#221 backfill capped at Taipei today），部署總數4。clasp clone immutable @187 及 HEAD，各100檔，與 origin/main bc18df75d0e5751e4ec28c81ae3cb60fc94734ce 全部100/100 SHA-256一致，零缺／多／異檔。此讀回只修正本候選 evidence，不改歷史 Manifest、不授權發布。中央 @175／子系統舊 @176 為摘要落後；即時 Trigger 與 effective OAuth 仍 HOLD。
