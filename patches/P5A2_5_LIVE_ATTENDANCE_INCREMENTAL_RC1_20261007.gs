/**
 * ABIS P5A2.5 | Live Attendance Incremental Reconcile RC1
 * 2026-10-07
 *
 * Purpose
 * - Close the gap between DEVICE_RAW/PUNCH_RAW normalization and DAILY_ATTENDANCE.
 * - Reuse the formal Attendance projection (p5a25s8cCaptureProjection_) as SSOT.
 * - Touch only explicit AttendanceKey targets; never rewrite the full table.
 * - Keep Exception / LINE / Payroll as separate downstream concerns.
 *
 * Dependencies already present in the main ABIS Apps Script project:
 *   p5a25s8cCaptureProjection_
 *   p5a25s8cHeaderMap_
 *   p5a25s8eHeaderExactMatch_
 *   p5a25s8eSemanticRowHash_
 *   attendanceSheet_
 *   attendanceObjectRows_
 *   attendanceApplyDailyDisplayFormats_
 *   p5a25d3Detect_
 *   p5a25bGlobalMappingAudit_
 *   p5a25bNormalizeReceived_
 *   P5A25B
 */

const P5A25_LIVE_ATTENDANCE_RC1_VERSION_ =
  'P5A2_5_LIVE_ATTENDANCE_INCREMENTAL_RC1_20261007';
const P5A25_LIVE_ATTENDANCE_HANDLER_ =
  'p5a25bAutoNormalizeTriggerLiveRc1_';
const P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_ =
  'p5a25bAutoNormalizeTrigger_';

function p5a25LiveText_(v) {
  return String(v == null ? '' : v).trim();
}

function p5a25LiveUniqueKeys_(keys) {
  const seen = {};
  return (keys || [])
    .map(p5a25LiveText_)
    .filter(function(k) {
      if (!/^\d{4}-\d{2}-\d{2}\|[^|]+$/.test(k) || seen[k]) return false;
      seen[k] = true;
      return true;
    })
    .sort();
}

function p5a25LiveClosedStatus_(v) {
  const s = p5a25LiveText_(v).toUpperCase();
  return ['CLOSED', 'FINALIZED', 'LOCKED'].indexOf(s) >= 0;
}

function p5a25LiveProjectionMap_() {
  const cap = p5a25s8cCaptureProjection_();
  const headers = cap.headers || [];
  const hi = p5a25s8cHeaderMap_(headers);
  ['AttendanceKey','Date','員工ID','出勤狀態','月結狀態','SourceHash','Locked']
    .forEach(function(h) {
      if (hi[h] == null) throw new Error('Live Attendance projection missing header: ' + h);
    });
  const byKey = {}, dup = {};
  (cap.output || []).forEach(function(row) {
    const k = p5a25LiveText_(row[hi.AttendanceKey]);
    if (!k) return;
    if (byKey[k]) dup[k] = true;
    else byKey[k] = row;
  });
  return {
    capture: cap,
    headers: headers,
    hi: hi,
    byKey: byKey,
    duplicateKeys: Object.keys(dup).sort()
  };
}

function p5a25LiveCurrentMap_(sh) {
  const raw = sh.getDataRange().getValues();
  if (!raw.length) throw new Error('DAILY_ATTENDANCE has no header.');
  const headers = raw[0] || [];
  const hi = p5a25s8cHeaderMap_(headers);
  ['AttendanceKey','月結狀態','SourceHash','Locked'].forEach(function(h) {
    if (hi[h] == null) throw new Error('DAILY_ATTENDANCE missing header: ' + h);
  });
  const byKey = {}, rowNumberByKey = {}, dup = {};
  raw.slice(1).forEach(function(row, i) {
    const k = p5a25LiveText_(row[hi.AttendanceKey]);
    if (!k) return;
    if (byKey[k]) dup[k] = true;
    else {
      byKey[k] = row;
      rowNumberByKey[k] = i + 2;
    }
  });
  return {
    raw: raw,
    headers: headers,
    hi: hi,
    byKey: byKey,
    rowNumberByKey: rowNumberByKey,
    duplicateKeys: Object.keys(dup).sort()
  };
}

function p5a25LiveSemanticHash_(headers, row) {
  if (typeof p5a25s8eSemanticRowHash_ === 'function') {
    return p5a25s8eSemanticRowHash_(headers, row);
  }
  const hi = p5a25s8cHeaderMap_(headers);
  return [
    p5a25LiveText_(row[hi.AttendanceKey]),
    p5a25LiveText_(row[hi['出勤狀態']]),
    p5a25LiveText_(row[hi.SourceHash])
  ].join('|');
}

function p5a25LiveBuildPlan_(keys) {
  keys = p5a25LiveUniqueKeys_(keys);
  const sh = attendanceSheet_('DAILY_ATTENDANCE_每日出勤');
  const current = p5a25LiveCurrentMap_(sh);
  const projection = p5a25LiveProjectionMap_();

  if (!p5a25s8eHeaderExactMatch_(projection.headers, current.headers)) {
    throw new Error('DAILY_ATTENDANCE header differs from formal projection.');
  }

  const currentDup = {};
  current.duplicateKeys.forEach(function(k){ currentDup[k] = true; });
  const projectionDup = {};
  projection.duplicateKeys.forEach(function(k){ projectionDup[k] = true; });

  const actions = [], blockers = [], noop = [];
  keys.forEach(function(k) {
    if (currentDup[k] || projectionDup[k]) {
      blockers.push({attendanceKey:k, reason:'DUPLICATE_KEY'});
      return;
    }
    const expected = projection.byKey[k] || null;
    const existing = current.byKey[k] || null;
    if (!expected) {
      blockers.push({attendanceKey:k, reason:'PROJECTION_MISSING'});
      return;
    }
    const monthStatus = existing
      ? current.byKey[k][current.hi['月結狀態']]
      : expected[projection.hi['月結狀態']];
    if (p5a25LiveClosedStatus_(monthStatus)) {
      blockers.push({attendanceKey:k, reason:'MONTH_CLOSED'});
      return;
    }
    if (p5a25LiveText_(expected[projection.hi.Locked]).toUpperCase() !== 'Y') {
      blockers.push({attendanceKey:k, reason:'PROJECTED_ROW_NOT_LOCKED'});
      return;
    }
    if (!p5a25LiveText_(expected[projection.hi.SourceHash])) {
      blockers.push({attendanceKey:k, reason:'PROJECTED_SOURCE_HASH_BLANK'});
      return;
    }
    if (!existing) {
      actions.push({attendanceKey:k, action:'INSERT', expected:expected, rowNumber:0});
      return;
    }
    const a = p5a25LiveSemanticHash_(current.headers, existing);
    const b = p5a25LiveSemanticHash_(projection.headers, expected);
    if (a === b) {
      noop.push(k);
      return;
    }
    actions.push({
      attendanceKey:k,
      action:'UPDATE',
      expected:expected,
      rowNumber:Number(current.rowNumberByKey[k] || 0)
    });
  });

  return {
    sheet: sh,
    current: current,
    projection: projection,
    requestedKeys: keys,
    actions: actions,
    blockers: blockers,
    noopKeys: noop
  };
}

function p5a25LiveAttendancePreflight_(keys) {
  const plan = p5a25LiveBuildPlan_(keys);
  const out = {
    ok: plan.blockers.length === 0,
    version: P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
    mode: 'READ_ONLY_INCREMENTAL_ATTENDANCE_PREFLIGHT',
    requestedKeys: plan.requestedKeys.length,
    plannedWrites: plan.actions.length,
    plannedInserts: plan.actions.filter(function(x){return x.action === 'INSERT';}).length,
    plannedUpdates: plan.actions.filter(function(x){return x.action === 'UPDATE';}).length,
    noops: plan.noopKeys.length,
    blockers: plan.blockers,
    dailyAttendanceWrites: 0,
    exceptionWrites: 0,
    lineSent: 0,
    payrollWrites: 0
  };
  return out;
}

function p5a25LiveAttendanceRefreshKeys_(keys, source) {
  keys = p5a25LiveUniqueKeys_(keys);
  if (!keys.length) {
    return {
      ok:true,
      version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
      mode:'INCREMENTAL_ATTENDANCE_WRITE',
      source:p5a25LiveText_(source),
      requestedKeys:0,
      updatedRows:0,
      insertedRows:0,
      verifiedRows:0
    };
  }

  const lock = LockService.getScriptLock();
  let locked = false, plan = null, insertedStart = 0, insertedCount = 0;
  const updateSnapshots = [];
  try {
    if (!lock.tryLock(30000)) throw new Error('Could not acquire ScriptLock.');
    locked = true;

    plan = p5a25LiveBuildPlan_(keys);
    if (plan.blockers.length) {
      throw new Error('Incremental Attendance blocked: ' + JSON.stringify(plan.blockers.slice(0,10)));
    }

    // Re-read inside the lock and require action state to remain stable.
    const verifyPlan = p5a25LiveBuildPlan_(keys);
    const actionSig = function(p) {
      return p.actions.map(function(x){
        return x.attendanceKey + ':' + x.action + ':' + String(x.rowNumber || 0);
      }).sort().join('\n');
    };
    if (actionSig(plan) !== actionSig(verifyPlan)) {
      throw new Error('Incremental Attendance target state drifted before write.');
    }
    plan = verifyPlan;

    const sh = plan.sheet;
    const inserts = [], updates = [];
    plan.actions.forEach(function(x){
      if (x.action === 'INSERT') inserts.push(x);
      else updates.push(x);
    });

    updates.forEach(function(x) {
      if (!x.rowNumber) throw new Error('UPDATE row number missing: ' + x.attendanceKey);
      const oldValues = sh.getRange(x.rowNumber, 1, 1, plan.current.headers.length).getValues()[0];
      updateSnapshots.push({rowNumber:x.rowNumber, values:oldValues});
      sh.getRange(x.rowNumber, 1, 1, plan.current.headers.length).setValues([x.expected]);
    });

    if (inserts.length) {
      insertedStart = sh.getLastRow() + 1;
      insertedCount = inserts.length;
      sh.getRange(insertedStart, 1, inserts.length, plan.current.headers.length)
        .setValues(inserts.map(function(x){ return x.expected; }));
    }

    if (plan.actions.length) {
      SpreadsheetApp.flush();
      if (typeof attendanceApplyDailyDisplayFormats_ === 'function') {
        attendanceApplyDailyDisplayFormats_(sh);
      }
    }

    // Readback verification against a fresh formal projection.
    const postCurrent = p5a25LiveCurrentMap_(sh);
    const postProjection = p5a25LiveProjectionMap_();
    let verified = 0;
    plan.actions.forEach(function(x){
      const actual = postCurrent.byKey[x.attendanceKey];
      const expected = postProjection.byKey[x.attendanceKey];
      if (!actual || !expected) {
        throw new Error('Incremental Attendance readback missing: ' + x.attendanceKey);
      }
      if (p5a25LiveSemanticHash_(postCurrent.headers, actual) !==
          p5a25LiveSemanticHash_(postProjection.headers, expected)) {
        throw new Error('Incremental Attendance semantic verify failed: ' + x.attendanceKey);
      }
      verified++;
    });

    return {
      ok:true,
      version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
      mode:'INCREMENTAL_ATTENDANCE_WRITE',
      source:p5a25LiveText_(source),
      requestedKeys:keys.length,
      plannedWrites:plan.actions.length,
      updatedRows:updates.length,
      insertedRows:inserts.length,
      noops:plan.noopKeys.length,
      verifiedRows:verified,
      fullTableRewrite:false,
      exceptionWrites:0,
      lineSent:0,
      payrollWrites:0
    };
  } catch (err) {
    // Best-effort rollback of only rows touched by this execution.
    try {
      if (plan && plan.sheet) {
        for (let i = updateSnapshots.length - 1; i >= 0; i--) {
          const s = updateSnapshots[i];
          plan.sheet.getRange(s.rowNumber,1,1,s.values.length).setValues([s.values]);
        }
        if (insertedStart && insertedCount) {
          plan.sheet.deleteRows(insertedStart, insertedCount);
        }
        SpreadsheetApp.flush();
      }
    } catch (rollbackErr) {
      throw new Error(
        'Incremental Attendance failed and rollback also failed. original=' +
        String(err && err.message ? err.message : err) +
        '; rollback=' +
        String(rollbackErr && rollbackErr.message ? rollbackErr.message : rollbackErr)
      );
    }
    throw err;
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}

function p5a25LiveAttendanceDirtyKeysFromPunch_() {
  if (typeof p5a25d3Detect_ !== 'function') {
    throw new Error('D3 dirty detector is not installed.');
  }
  const d3 = p5a25d3Detect_();
  if (!d3 || !d3.ok || Number(d3.blockedEvents || 0) !== 0) {
    throw new Error('D3 dirty detector did not pass.');
  }
  return {
    d3:d3,
    keys:p5a25LiveUniqueKeys_(
      (d3.dirtyKeys || []).map(function(x){
        return typeof x === 'string' ? x : x && x.attendanceKey;
      })
    )
  };
}

function p5a25LiveAttendanceAfterPunchNormalize_() {
  const dirty = p5a25LiveAttendanceDirtyKeysFromPunch_();
  if (!dirty.keys.length) {
    return {
      ok:true,
      version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
      mode:'POST_NORMALIZE_NO_DIRTY',
      dirtyAttendanceKeys:0,
      attendanceWrites:0
    };
  }
  const write = p5a25LiveAttendanceRefreshKeys_(dirty.keys, 'PUNCH_NORMALIZE');
  write.dirtyAttendanceKeys = dirty.keys.length;
  return write;
}

/**
 * Call this only AFTER the authoritative source transaction succeeds.
 * Supported sources: SCHEDULE / LEAVE / CORRECTION / HR_ADJUSTMENT.
 */
function p5a25LiveAttendanceSourceMutation_(employeeId, dateKey, source) {
  employeeId = p5a25LiveText_(employeeId);
  dateKey = p5a25LiveText_(dateKey);
  if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error('employeeId and yyyy-MM-dd dateKey are required.');
  }
  return p5a25LiveAttendanceRefreshKeys_(
    [dateKey + '|' + employeeId],
    p5a25LiveText_(source) || 'SOURCE_MUTATION'
  );
}

/**
 * New 5-minute normalize handler.
 * It preserves the existing mapping gate, runs the existing normalizer,
 * then reconciles DAILY_ATTENDANCE only when new Punch facts were created.
 */
function p5a25bAutoNormalizeTriggerLiveRc1_() {
  const gate = p5a25bGlobalMappingAudit_();
  if (!gate.readyToCutover) {
    const blocked = {
      ok:false,
      version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
      mode:'AUTO_NORMALIZE_LIVE_BLOCKED',
      reason:'GLOBAL_MAPPING_GATE_FAILED',
      mappingAudit:gate
    };
    console.log(JSON.stringify(blocked));
    return blocked;
  }

  const normalize = p5a25bNormalizeReceived_(P5A25B.MAX_ROWS_PER_RUN);
  let attendance = {
    ok:true,
    mode:'NO_NEW_NORMALIZED_PUNCH',
    attendanceWrites:0
  };

  if (Number(normalize.normalized || 0) > 0) {
    attendance = p5a25LiveAttendanceAfterPunchNormalize_();
  }

  const out = {
    ok:normalize.errors === 0 && attendance.ok !== false,
    version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
    mode:'AUTO_NORMALIZE_5MIN_PLUS_INCREMENTAL_ATTENDANCE',
    normalize:normalize,
    attendance:attendance
  };
  console.log(JSON.stringify(out));
  return out;
}

function adminP5A25LiveAttendanceCutoverPreflight() {
  const triggers = ScriptApp.getProjectTriggers();
  const legacy = triggers.filter(function(t){
    return t.getHandlerFunction() === P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_;
  });
  const live = triggers.filter(function(t){
    return t.getHandlerFunction() === P5A25_LIVE_ATTENDANCE_HANDLER_;
  });
  const dependencies = {
    normalizer:typeof p5a25bNormalizeReceived_ === 'function',
    mappingGate:typeof p5a25bGlobalMappingAudit_ === 'function',
    d3:typeof p5a25d3Detect_ === 'function',
    projection:typeof p5a25s8cCaptureProjection_ === 'function',
    attendanceSheet:typeof attendanceSheet_ === 'function'
  };
  const depsOk = Object.keys(dependencies).every(function(k){return dependencies[k];});
  const out = {
    ok:depsOk && legacy.length === 1 && live.length === 0,
    version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
    mode:'READ_ONLY_LIVE_ATTENDANCE_CUTOVER_PREFLIGHT',
    dependencies:dependencies,
    legacyTriggerCount:legacy.length,
    liveTriggerCount:live.length,
    productionMutationsPerformed:false,
    nextStage:depsOk && legacy.length === 1 && live.length === 0
      ? 'RUN_adminP5A25LiveAttendanceCutover'
      : 'STOP_REVIEW_TRIGGER_OR_DEPENDENCY_STATE'
  };
  console.log(JSON.stringify(out));
  return out;
}

function adminP5A25LiveAttendanceCutover() {
  const pre = adminP5A25LiveAttendanceCutoverPreflight();
  if (!pre.ok) throw new Error('Live Attendance cutover preflight failed.');

  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    if (!lock.tryLock(30000)) throw new Error('Could not acquire ScriptLock for cutover.');
    locked = true;

    ScriptApp.getProjectTriggers().forEach(function(t){
      if (t.getHandlerFunction() === P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_) {
        ScriptApp.deleteTrigger(t);
      }
    });
    ScriptApp.newTrigger(P5A25_LIVE_ATTENDANCE_HANDLER_)
      .timeBased()
      .everyMinutes(5)
      .create();

    const triggers = ScriptApp.getProjectTriggers();
    const legacyCount = triggers.filter(function(t){
      return t.getHandlerFunction() === P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_;
    }).length;
    const liveCount = triggers.filter(function(t){
      return t.getHandlerFunction() === P5A25_LIVE_ATTENDANCE_HANDLER_;
    }).length;

    if (legacyCount !== 0 || liveCount !== 1) {
      throw new Error('Cutover trigger verification failed.');
    }
    return {
      ok:true,
      version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
      mode:'LIVE_ATTENDANCE_TRIGGER_CUTOVER',
      legacyTriggerCount:legacyCount,
      liveTriggerCount:liveCount
    };
  } catch (err) {
    // Roll back trigger topology to the previous known-safe handler.
    ScriptApp.getProjectTriggers().forEach(function(t){
      if (t.getHandlerFunction() === P5A25_LIVE_ATTENDANCE_HANDLER_) {
        ScriptApp.deleteTrigger(t);
      }
    });
    const legacyExists = ScriptApp.getProjectTriggers().some(function(t){
      return t.getHandlerFunction() === P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_;
    });
    if (!legacyExists) {
      ScriptApp.newTrigger(P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_)
        .timeBased()
        .everyMinutes(5)
        .create();
    }
    throw err;
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}

function adminP5A25LiveAttendanceRollbackTrigger() {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    if (!lock.tryLock(30000)) throw new Error('Could not acquire ScriptLock for rollback.');
    locked = true;
    ScriptApp.getProjectTriggers().forEach(function(t){
      const h = t.getHandlerFunction();
      if (h === P5A25_LIVE_ATTENDANCE_HANDLER_ ||
          h === P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_) {
        ScriptApp.deleteTrigger(t);
      }
    });
    ScriptApp.newTrigger(P5A25_LIVE_ATTENDANCE_LEGACY_HANDLER_)
      .timeBased()
      .everyMinutes(5)
      .create();
    return {
      ok:true,
      version:P5A25_LIVE_ATTENDANCE_RC1_VERSION_,
      mode:'ROLLBACK_TO_LEGACY_NORMALIZE_TRIGGER'
    };
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}
