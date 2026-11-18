/**
 * Supervisor attendance-correction confirm (主管出勤補正確認).
 *
 * Presentation only. The front-end Release Set stays V153. This file is not
 * registered as a release and does not claim one.
 *
 * Reads the existing attendanceInbox payload. Writes go one at a time through
 * attendanceCorrectionManagerAction so each item keeps its own audit.
 * Never calls homeBootstrap. Never edits raw punches.
 */
(function (global) {
  'use strict';

  var TYPE_LABEL = {
    MISSING_IN: '缺上班卡',
    MISSING_OUT: '缺下班卡',
    MISSING_BOTH: '上下班都缺卡',
    WRONG_IN: '上班時間不正確',
    WRONG_OUT: '下班時間不正確',
    SHIFT_SCHEDULE: '班別不正確',
    MULTI: '多項補正',
    OTHER: '其他'
  };

  var LEAVE_RETURN_NOTE = '這筆看起來是請假，請改申請假單。出勤補正先退回。';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hm(value) {
    var m = String(value || '').match(/(\d{2}):(\d{2})/);
    return m ? m[1] + ':' + m[2] : '';
  }

  function shortDate(iso) {
    var m = String(iso || '').match(/^\d{4}-(\d{2})-(\d{2})$/);
    return m ? m[1] + '/' + m[2] : String(iso || '');
  }

  function dtLocal(value, date) {
    var s = String(value || '').trim().replace(' ', 'T');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    var clock = hm(value);
    if (clock && /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return date + 'T' + clock;
    return '';
  }

  function snapshotOf(row) {
    if (!row || typeof row !== 'object') return null;
    if (row.systemSnapshot && typeof row.systemSnapshot === 'object') return row.systemSnapshot;
    if (row.context && typeof row.context === 'object') return row.context;
    return null;
  }

  function shiftName(code, row, options) {
    var list = options || (row && row.shiftOptions) || [];
    var found = list.filter(function (item) { return item && String(item.code) === String(code || ''); })[0];
    if (found && found.name) return found.name;
    var snap = snapshotOf(row);
    if (snap && String(snap.shiftCode || '') === String(code || '') && snap.shiftName) return snap.shiftName;
    return code ? String(code) : '';
  }

  function analyzeReason(reason) {
    var text = String(reason || '');
    var leaveType = text.match(/請\s*(特休|事假|病假)/);
    var hours = text.match(/(\d+(?:\.\d+)?)\s*(?:小時|時|hr|HR)/i);
    var leave = !!(leaveType && hours);
    var restDay = text.indexOf('休假日') >= 0;
    return {
      leave: leave,
      leaveType: leave ? leaveType[1] : '',
      hours: leave ? hours[1] : '',
      restDay: restDay,
      warning: leave || restDay
    };
  }

  function leaveReturnNote(reason) {
    var hint = analyzeReason(reason);
    if (!hint.leave) return LEAVE_RETURN_NOTE;
    return '這筆看起來是請' + hint.leaveType + ' ' + hint.hours + ' 小時，請改申請假單。出勤補正先退回。';
  }

function rawPunchLines(row) {
  var snap = snapshotOf(row);
  var list = row && Array.isArray(row.rawPunches) ? row.rawPunches : null;
  if (!list && snap && Array.isArray(snap.rawPunches)) list = snap.rawPunches;
  if (list && list.length) {
    var lines = [];
    var hasIn = false;
    var hasOut = false;
    list.forEach(function (punch) {
      var out = String(punch && punch.direction || '').toUpperCase() === 'OUT';
      if (out) hasOut = true;
      else hasIn = true;
      lines.push((out ? '下班 ' : '上班 ') + (hm(punch && punch.at) || '未打卡'));
    });
    if (snap && snap.missingIn && !hasIn) lines.unshift('上班 未打卡');
    if (snap && snap.missingOut && !hasOut) lines.push('下班 未打卡');
    return lines;
  }
    if (!snap) return null;
    var hasPunch = snap.firstIn || snap.lastOut || snap.missingIn != null || snap.missingOut != null;
    if (!hasPunch) return null;
    var inn = snap.missingIn || !hm(snap.firstIn) ? '未打卡' : hm(snap.firstIn);
    var out = snap.missingOut || !hm(snap.lastOut) ? '未打卡' : hm(snap.lastOut);
    return ['上班 ' + inn, '下班 ' + out];
  }

  function scheduleText(row) {
    var snap = snapshotOf(row);
    if (!snap) return '';
    if (!snap.shiftName && !snap.shiftCode && !snap.expectedStart && !snap.expectedEnd) return '';
    var name = snap.shiftName || shiftName(snap.shiftCode, row) || '班別未提供';
    var start = hm(snap.expectedStart);
    var end = hm(snap.expectedEnd);
    if (start && end) return name + ' ' + start + '–' + end;
    if (start || end) return name + ' ' + (start || end);
    return name;
  }

  function anomalyText(row) {
    var snap = snapshotOf(row);
    if (!snap) return '';
    if (snap.anomalyDescription) return String(snap.anomalyDescription);
    if (snap.missingIn && snap.missingOut) return '上下班都缺卡';
    if (snap.missingOut) return '缺下班卡';
    if (snap.missingIn) return '缺上班卡';
    if (snap.anomalyCode) return String(snap.anomalyCode);
    return '';
  }

  function requestClockText(row) {
    var bits = [];
    if (row && row.requestedFirstIn) bits.push('上班 ' + (hm(row.requestedFirstIn) || row.requestedFirstIn));
    if (row && row.requestedLastOut) bits.push('下班 ' + (hm(row.requestedLastOut) || row.requestedLastOut));
    if (row && row.requestedShiftCode) bits.push('班別 ' + (shiftName(row.requestedShiftCode, row) || row.requestedShiftCode));
    return bits.join('、');
  }

  function buildSuggestion(row) {
    var snap = snapshotOf(row) || {};
    var given = row && row.suggestion && typeof row.suggestion === 'object' ? row.suggestion : {};
    var firstIn = given.firstIn || (row && row.requestedFirstIn) || snap.firstIn || '';
    var lastOut = given.lastOut || (row && row.requestedLastOut) || snap.lastOut || '';
    var shiftCode = given.shiftCode || snap.shiftCode || (row && row.requestedShiftCode) || '';
    var pay = String(given.payrollImpact || (row && row.suggestedPayrollImpact) || '').toUpperCase();
    var payrollSource = 'suggestion';
    if (pay !== 'Y' && pay !== 'N') {
      var stored = String(row && row.payrollImpact || '').toUpperCase();
      if (stored === 'Y' || stored === 'N') {
        pay = stored;
        payrollSource = 'stored';
      } else {
        pay = 'N';
        payrollSource = 'fallback';
      }
    }
    return {
      firstIn: firstIn,
      lastOut: lastOut,
      shiftCode: shiftCode,
      payrollImpact: pay,
      payrollSource: payrollSource
    };
  }

function suggestionSentence(row) {
  var sug = buildSuggestion(row);
  var inn = hm(sug.firstIn);
  var out = hm(sug.lastOut);
  var shift = shiftName(sug.shiftCode, row) || '';
  var pay = sug.payrollImpact === 'Y' ? '影響薪資' : '不影響薪資';
  var text = inn || out
    ? '建議採認上班 ' + (inn || '未填') + '、下班 ' + (out || '未填') + '，' + (shift || '班別未填') + '，' + pay + '。'
    : '建議採認' + (shift ? shift : '這一天') + '，' + pay + '。';
    if (sug.payrollSource === 'fallback') {
      text += '系統還沒標是否影響薪資，先依不影響。要改再按修改。';
    }
    return text;
  }

  function batchIds(rows, picked) {
    return (rows || []).filter(function (row) {
      if (!row || !row.correctionRequestId) return false;
      if (analyzeReason(row.reason).warning) return false;
      if (picked && !picked[row.correctionRequestId]) return false;
      return true;
    }).map(function (row) { return row.correctionRequestId; });
  }

  function defaultRequestId(action) {
    return 'A2-MANAGER-' + action + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  function buildPayload(row, action, values, note, opts) {
    var nextId = opts && typeof opts.nextRequestId === 'function' ? opts.nextRequestId : defaultRequestId;
    var payload = {
      sessionToken: opts && opts.sessionToken ? opts.sessionToken : '',
      correctionRequestId: row.correctionRequestId,
      action: action,
      firstIn: dtLocal(values && values.firstIn, row.date),
      lastOut: dtLocal(values && values.lastOut, row.date),
      shiftCode: values && values.shiftCode ? String(values.shiftCode) : '',
      note: String(note || '').trim(),
      requestId: nextId(action)
    };
    if (action === 'APPROVE') payload.payrollImpact = values && values.payrollImpact === 'Y' ? 'Y' : 'N';
    return payload;
  }

  function validateReject(note) {
    return String(note || '').trim() ? '' : '退回要寫原因，員工才知道要改什麼。';
  }

  function fact(label, body) {
    if (!body) return '';
    return '<div><dt>' + esc(label) + '</dt><dd>' + body + '</dd></div>';
  }

  function shiftOptionsHtml(row, selected) {
    var list = (row && row.shiftOptions) || [];
    var seen = {};
    var html = '';
    list.forEach(function (item) {
      if (!item || !item.code || seen[item.code]) return;
      seen[item.code] = true;
      html += '<option value="' + esc(item.code) + '"' + (String(item.code) === String(selected) ? ' selected' : '') + '>' +
        esc(item.name || item.code) + '</option>';
    });
    if (selected && !seen[selected]) {
      html = '<option value="' + esc(selected) + '" selected>' + esc(shiftName(selected, row) || selected) + '</option>' + html;
    }
    if (!html) html = '<option value="">班別未提供</option>';
    return html;
  }

  function cardHtml(row, options) {
    options = options || {};
    var id = String(row.correctionRequestId || '');
    var hint = analyzeReason(row.reason);
    var sug = buildSuggestion(row);
    var punches = rawPunchLines(row);
    var schedule = scheduleText(row);
    var anomaly = anomalyText(row);
    var requestClock = requestClockText(row);
    var typeLabel = TYPE_LABEL[String(row.requestType || '').toUpperCase()] || '';
    var chip = anomaly || typeLabel;
    var openEdit = !!options.openEdit;
    var openReturn = !!options.openReturn;
    var returnNote = options.returnNote || '';
    var checked = !hint.warning && options.picked !== false;
    var showPick = !!options.showPick && !hint.warning;

    var facts = '';
    facts += fact('排班', schedule ? esc(schedule) : '');
    if (punches) {
      facts += fact('原始打卡', punches.map(esc).join('<br>') + '<span class="scc-lock">不能改</span>');
    }
    facts += fact('異常', anomaly ? esc(anomaly) : '');
    var requestBody = '';
    if (requestClock) requestBody += esc(requestClock);
    if (row.reason) requestBody += (requestBody ? '<br>' : '') + esc(row.reason);
    facts += fact('員工申請', requestBody);

    var hints = '';
    if (hint.leave) {
      hints += '<div class="scc-hint scc-hint-leave" role="note"><p>原因像是請假（' + esc(hint.leaveType) + ' ' + esc(hint.hours) + ' 小時）。這筆應走請假，不是出勤補正。</p>' +
        '<button type="button" class="scc-quiet" data-scc-leave-return="' + esc(id) + '">退回並請員工改申請假單</button></div>';
    }
    if (hint.restDay) {
      hints += '<div class="scc-hint scc-hint-rest" role="note"><p>原因提到休假日。先對一下當天班表，再決定要不要同意。</p></div>';
    }

    var pick = showPick
      ? '<label class="scc-check"><input type="checkbox" data-scc-pick="' + esc(id) + '"' + (checked ? ' checked' : '') + '><span class="scc-date">' + esc(shortDate(row.date)) + '</span></label>'
      : '<span class="scc-date">' + esc(shortDate(row.date)) + '</span>';

    return '<article class="scc-card' + (hint.warning ? ' is-warn' : '') + '" data-scc-id="' + esc(id) + '" data-scc-warn="' + (hint.warning ? '1' : '0') + '">' +
      '<div class="scc-card-top">' + pick + (chip ? '<span class="scc-chip">' + esc(chip) + '</span>' : '') + '</div>' +
      (facts ? '<dl class="scc-facts">' + facts + '</dl>' : '') +
      '<p class="scc-suggest">' + esc(suggestionSentence(row)) + '</p>' +
      '<button type="button" class="scc-edit" data-scc-edit="' + esc(id) + '" aria-expanded="' + (openEdit ? 'true' : 'false') + '">' + (openEdit ? '收合' : '修改') + '</button>' +
      '<div class="scc-form"' + (openEdit ? '' : ' hidden') + '>' +
        '<label>採認上班<input type="datetime-local" data-scc-in="' + esc(id) + '" value="' + esc(dtLocal(sug.firstIn, row.date)) + '"></label>' +
        '<label>採認下班<input type="datetime-local" data-scc-out="' + esc(id) + '" value="' + esc(dtLocal(sug.lastOut, row.date)) + '"></label>' +
        '<label>採認班別<select data-scc-shift="' + esc(id) + '">' + shiftOptionsHtml(row, sug.shiftCode) + '</select></label>' +
        '<label>是否影響薪資<select data-scc-pay="' + esc(id) + '">' +
          '<option value="N"' + (sug.payrollImpact !== 'Y' ? ' selected' : '') + '>不影響薪資</option>' +
          '<option value="Y"' + (sug.payrollImpact === 'Y' ? ' selected' : '') + '>影響薪資</option>' +
        '</select></label>' +
      '</div>' +
      hints +
      '<div class="scc-actions">' +
        '<button type="button" class="scc-agree" data-scc-agree="' + esc(id) + '">同意</button>' +
        '<button type="button" class="scc-return" data-scc-return="' + esc(id) + '">退回</button>' +
      '</div>' +
      '<div class="scc-return-box"' + (openReturn ? '' : ' hidden') + ' data-scc-return-box="' + esc(id) + '">' +
        '<label>退回原因<textarea data-scc-note="' + esc(id) + '" maxlength="500" placeholder="跟員工說為什麼退回">' + esc(returnNote) + '</textarea></label>' +
        '<p class="scc-help">只有退回要寫原因。同意不用。</p>' +
        '<p class="scc-error" data-scc-error="' + esc(id) + '" hidden></p>' +
        '<button type="button" class="scc-return-send" data-scc-return-send="' + esc(id) + '">送出退回</button>' +
      '</div>' +
    '</article>';
  }

  function groupRows(rows) {
    var groups = [];
    var index = {};
    (rows || []).forEach(function (row) {
      var key = String(row && row.employeeId || '');
      if (!index[key]) {
        index[key] = {
          employeeId: key,
          employeeName: row && row.employeeName || '',
          rows: []
        };
        groups.push(index[key]);
      }
      index[key].rows.push(row);
    });
    return groups;
  }

  function renderManagerHtml(attendance, options) {
    options = options || {};
    var rows = attendance && Array.isArray(attendance.managerCorrections) ? attendance.managerCorrections.slice() : [];
    if (!rows.length) return '';
    rows.forEach(function (row) {
      row.shiftOptions = row.shiftOptions || (attendance && attendance.shiftOptions) || [];
    });
    if (typeof options.filter === 'function') rows = rows.filter(options.filter);
    if (!rows.length) return '';
    var groups = groupRows(rows);
    return '<section class="scc" data-scc-root="1"><h2 class="scc-title">主管出勤補正確認</h2>' +
      groups.map(function (group) { return groupHtml(group, options); }).join('') +
      '</section>';
  }

  function groupHtml(group, options) {
    var clean = batchIds(group.rows, null);
    var showBatch = group.rows.length > 1 && clean.length > 0 && !options.hideBatch;
    var person = (group.employeeName || '員工') + (group.employeeId ? ' · ' + group.employeeId : '');
    var batch = showBatch
      ? '<button type="button" class="scc-batch" data-scc-batch="' + esc(group.employeeId) + '">全部同意（' + clean.length + '）</button>' +
        '<p class="scc-batch-note">只同意沒有提醒的日期。有提醒的請單獨看。</p>'
      : '';
    return '<section class="scc-person" data-scc-employee="' + esc(group.employeeId) + '">' +
      '<header class="scc-person-head"><p class="scc-name">' + esc(person) + '</p><p class="scc-count">' + group.rows.length + ' 筆待確認</p>' + batch + '</header>' +
      group.rows.map(function (row) {
        var cardOptions = {
          openEdit: options.openEditId && options.openEditId === row.correctionRequestId,
          openReturn: options.openReturnId && options.openReturnId === row.correctionRequestId,
          returnNote: options.openReturnId === row.correctionRequestId ? (options.returnNote || '') : '',
          showPick: group.rows.length > 1
        };
        return cardHtml(row, cardOptions);
      }).join('') +
      '</section>';
  }

  function readValues(row, root) {
    var sug = buildSuggestion(row);
    if (!root) return sug;
    var inn = root.querySelector('[data-scc-in]');
    var out = root.querySelector('[data-scc-out]');
    var shift = root.querySelector('[data-scc-shift]');
    var pay = root.querySelector('[data-scc-pay]');
    return {
      firstIn: inn ? inn.value : sug.firstIn,
      lastOut: out ? out.value : sug.lastOut,
      shiftCode: shift ? shift.value : sug.shiftCode,
      payrollImpact: pay ? pay.value : sug.payrollImpact,
      payrollSource: sug.payrollSource
    };
  }

  function readNote(root) {
    var note = root && root.querySelector('[data-scc-note]');
    return note ? note.value : '';
  }

  async function approveSequential(rows, opts) {
    opts = opts || {};
    var ids = opts.ids || batchIds(rows, opts.picked || null);
    var byId = {};
    (rows || []).forEach(function (row) { if (row && row.correctionRequestId) byId[row.correctionRequestId] = row; });
    var payloads = [];
    var inFlight = 0;
    var maxInFlight = 0;
    for (var i = 0; i < ids.length; i++) {
      var row = byId[ids[i]];
      if (!row) continue;
      if (analyzeReason(row.reason).warning && !opts.allowWarning) continue;
      var values = typeof opts.values === 'function' ? opts.values(row) : buildSuggestion(row);
      var payload = buildPayload(row, 'APPROVE', values, '', opts);
      payloads.push(payload);
      inFlight += 1;
      if (inFlight > maxInFlight) maxInFlight = inFlight;
      if (typeof opts.call !== 'function') throw new Error('無法送出');
      await opts.call('attendanceCorrectionManagerAction', payload);
      inFlight -= 1;
    }
    return { payloads: payloads, maxInFlight: maxInFlight };
  }

  function styles() {
    return [
      '.scc{font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;color:#1f2937}',
      '.scc-title{margin:4px 0 10px;font-size:20px;line-height:1.3}',
      '.scc-person{margin:0 0 16px}',
      '.scc-person-head{margin:0 0 8px}',
      '.scc-name{margin:0;font-size:17px;font-weight:800}',
      '.scc-count{margin:2px 0 8px;color:#6b7280;font-size:13px}',
      '.scc-batch{width:100%;border:0;border-radius:12px;background:#157a45;color:#fff;font-weight:800;font-size:16px;min-height:48px;padding:12px 14px}',
      '.scc-batch-note{margin:6px 0 0;color:#6b7280;font-size:12px;line-height:1.5}',
      '.scc-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin:10px 0;box-shadow:0 1px 2px rgba(17,24,39,.04)}',
      '.scc-card.is-warn{border-color:#fdba74}',
      '.scc-card-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}',
      '.scc-check{display:flex;align-items:center;gap:8px;font-weight:800}',
      '.scc-check input{width:22px;height:22px;margin:0}',
      '.scc-date{font-size:18px;font-weight:800}',
      '.scc-chip{margin-left:auto;background:#fff7ed;color:#9a3412;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:700}',
      '.scc-facts{margin:0;display:grid;gap:8px}',
      '.scc-facts div{display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px;align-items:start}',
      '.scc-facts dt{color:#6b7280;font-size:13px}',
      '.scc-facts dd{margin:0;font-size:15px;line-height:1.45;font-weight:650}',
      '.scc-lock{display:block;margin-top:2px;color:#6b7280;font-size:12px;font-weight:500}',
      '.scc-suggest{margin:10px 0 0;background:#f0fdf4;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.5}',
      '.scc-edit,.scc-quiet,.scc-return,.scc-return-send{background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:12px;min-height:44px;font-weight:700}',
      '.scc-edit,.scc-quiet{width:auto;padding:8px 12px;margin-top:8px}',
      '.scc-form{display:grid;gap:8px;margin-top:8px}',
      '.scc-form[hidden],.scc-return-box[hidden],.scc-error[hidden]{display:none !important}',
      '.scc-form label,.scc-return-box label{font-size:13px;color:#374151;font-weight:700}',
      '.scc-form input,.scc-form select,.scc-return-box textarea{width:100%;box-sizing:border-box;margin-top:4px;padding:10px;border:1px solid #d1d5db;border-radius:10px;font:inherit;background:#fff}',
      '.scc-hint{margin-top:10px;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.5}',
      '.scc-hint p{margin:0}',
      '.scc-hint-leave{background:#fff7ed;border:1px solid #fdba74}',
      '.scc-hint-rest{background:#eff6ff;border:1px solid #bfdbfe}',
      '.scc-actions{display:grid;gap:8px;margin-top:12px}',
      '.scc-agree{border:0;border-radius:12px;background:#157a45;color:#fff;font-weight:800;font-size:16px;min-height:48px}',
      '.scc-return,.scc-return-send{width:100%}',
      '.scc-return-box{margin-top:8px}',
      '.scc-help{margin:6px 0;color:#6b7280;font-size:12px}',
      '.scc-error{margin:0 0 8px;color:#9f1239;font-size:13px}',
      '.scc button:disabled{opacity:.5}',
      '@media (max-width:420px){.scc-facts div{grid-template-columns:56px minmax(0,1fr)}}'
    ].join('');
  }

  function ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('scc-styles')) return;
    var node = document.createElement('style');
    node.id = 'scc-styles';
    node.textContent = styles();
    document.head.appendChild(node);
  }

  var model = { attendance: null, deps: null, busy: false };

  function cardRoot(id) {
    return document.querySelector('.scc-card[data-scc-id="' + String(id).replace(/"/g, '') + '"]');
  }

  function rowById(id) {
    var rows = model.attendance && model.attendance.managerCorrections || [];
    for (var i = 0; i < rows.length; i++) if (rows[i] && String(rows[i].correctionRequestId) === String(id)) return rows[i];
    return null;
  }

  function setError(id, text) {
    var node = document.querySelector('[data-scc-error="' + String(id).replace(/"/g, '') + '"]');
    if (!node) return;
    node.textContent = text || '';
    node.hidden = !text;
  }

  function showStatus(text) {
    if (model.deps && typeof model.deps.message === 'function') model.deps.message(text);
  }

  async function sendOne(row, action, values, note) {
    if (!model.deps || typeof model.deps.call !== 'function') throw new Error('目前無法送出');
    var payload = buildPayload(row, action, values, note, {
      sessionToken: model.deps.sessionToken ? model.deps.sessionToken() : '',
      nextRequestId: model.deps.nextRequestId
    });
    await model.deps.call('attendanceCorrectionManagerAction', payload);
    return payload;
  }

  async function agreeOne(id, button) {
    if (model.busy) return;
    var row = rowById(id);
    if (!row) return;
    model.busy = true;
    if (button) button.disabled = true;
    try {
      await sendOne(row, 'APPROVE', readValues(row, cardRoot(id)), '');
      showStatus('已同意 ' + shortDate(row.date));
      if (model.deps.refresh) await model.deps.refresh();
    } catch (err) {
      showStatus(err && err.message ? err.message : '沒有送出');
    } finally {
      model.busy = false;
      if (button) button.disabled = false;
    }
  }

  async function agreeEmployee(employeeId, button) {
    if (model.busy) return;
    var rows = (model.attendance && model.attendance.managerCorrections || []).filter(function (row) {
      return String(row.employeeId || '') === String(employeeId || '');
    });
    var picked = {};
    rows.forEach(function (row) {
      var box = document.querySelector('[data-scc-pick="' + String(row.correctionRequestId).replace(/"/g, '') + '"]');
      if (box && box.checked) picked[row.correctionRequestId] = true;
    });
    var ids = batchIds(rows, picked);
    if (!ids.length) {
      showStatus('沒有可一次同意的日期');
      return;
    }
    model.busy = true;
    if (button) button.disabled = true;
    var done = 0;
    try {
      for (var i = 0; i < ids.length; i++) {
        if (button) button.textContent = '正在同意 ' + (i + 1) + '/' + ids.length;
        var row = rowById(ids[i]);
        await sendOne(row, 'APPROVE', readValues(row, cardRoot(ids[i])), '');
        done += 1;
      }
      showStatus('已同意 ' + done + ' 筆');
      if (model.deps.refresh) await model.deps.refresh();
    } catch (err) {
      showStatus((done ? '已同意 ' + done + ' 筆，後面停下。' : '') + (err && err.message ? err.message : '沒有送出'));
    } finally {
      model.busy = false;
      if (button) {
        button.disabled = false;
        button.textContent = '全部同意（' + ids.length + '）';
      }
    }
  }

  async function rejectOne(id) {
    if (model.busy) return;
    var row = rowById(id);
    var root = cardRoot(id);
    if (!row || !root) return;
    var note = readNote(root);
    var problem = validateReject(note);
    if (problem) {
      setError(id, problem);
      var field = root.querySelector('[data-scc-note]');
      if (field) field.focus();
      return;
    }
    setError(id, '');
    model.busy = true;
    try {
      await sendOne(row, 'REJECT', readValues(row, root), note);
      showStatus('已退回 ' + shortDate(row.date));
      if (model.deps.refresh) await model.deps.refresh();
    } catch (err) {
      setError(id, err && err.message ? err.message : '沒有送出');
    } finally {
      model.busy = false;
    }
  }

  function toggleEdit(id, button) {
    var root = cardRoot(id);
    if (!root) return;
    var form = root.querySelector('.scc-form');
    var open = form.hidden;
    form.hidden = !open;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.textContent = open ? '收合' : '修改';
  }

  function openReturn(id, note) {
    var root = cardRoot(id);
    if (!root) return;
    var box = root.querySelector('[data-scc-return-box]');
    if (box) box.hidden = false;
    var field = root.querySelector('[data-scc-note]');
    if (field && note) field.value = note;
    if (field) field.focus();
  }

  function onClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var edit = target.closest('[data-scc-edit]');
    if (edit) { toggleEdit(edit.getAttribute('data-scc-edit'), edit); return; }
    var agree = target.closest('[data-scc-agree]');
    if (agree) { agreeOne(agree.getAttribute('data-scc-agree'), agree); return; }
    var batch = target.closest('[data-scc-batch]');
    if (batch) { agreeEmployee(batch.getAttribute('data-scc-batch'), batch); return; }
    var ret = target.closest('[data-scc-return]');
    if (ret && !target.closest('[data-scc-return-send]')) { openReturn(ret.getAttribute('data-scc-return'), ''); return; }
    var leave = target.closest('[data-scc-leave-return]');
    if (leave) {
      var leaveId = leave.getAttribute('data-scc-leave-return');
      var leaveRow = rowById(leaveId);
      openReturn(leaveId, leaveReturnNote(leaveRow && leaveRow.reason));
      return;
    }
    var send = target.closest('[data-scc-return-send]');
    if (send) rejectOne(send.getAttribute('data-scc-return-send'));
  }

  function bind() {
    if (typeof document === 'undefined' || document.__sccBound) return;
    document.addEventListener('click', onClick);
    document.__sccBound = true;
  }

  function mount(target, attendance, options) {
    ensureStyles();
    bind();
    model.attendance = attendance;
    model.deps = options && options.deps || {};
    var html = renderManagerHtml(attendance, options || {});
    if (typeof target === 'string') target = document.querySelector(target);
    if (target) target.innerHTML = html;
    return html;
  }

  function hostDeps() {
    return {
      sessionToken: function () {
        return typeof sessionToken === 'undefined' ? '' : sessionToken;
      },
      call: typeof call === 'function' ? call : null,
      refresh: async function () {
        if (typeof refreshLegacyInbox_ === 'function') return refreshLegacyInbox_('');
      },
      message: typeof message === 'function' ? message : function () {},
      nextRequestId: function (action) {
        var uuid = typeof p4a13Uuid_ === 'function' ? p4a13Uuid_() : Math.random().toString(36).slice(2, 10);
        return 'A2-MANAGER-' + action + '-' + Date.now() + '-' + uuid;
      }
    };
  }

  function install() {
    if (typeof p5a2rc1AttendanceInboxHtml_ !== 'function' || p5a2rc1AttendanceInboxHtml_.__scc) return false;
    if (typeof p5a2rc1CorrectionCard_ !== 'function') return false;
    var original = p5a2rc1AttendanceInboxHtml_;
    var originalCard = p5a2rc1CorrectionCard_;
    function wrapped(attendance) {
      if (!attendance) return '';
      model.deps = hostDeps();
      model.attendance = attendance;
      ensureStyles();
      bind();
      var manager = renderManagerHtml(attendance, {});
      var restSource = {};
      Object.keys(attendance).forEach(function (key) { restSource[key] = attendance[key]; });
      restSource.managerCorrections = [];
      var rest = '';
      try { rest = originalCard ? original(restSource) : ''; } catch (ignore) { rest = ''; }
      if (!manager) return rest;
      if (rest.indexOf('<div class="att-work-section">') === 0) {
        return '<div class="att-work-section">' + manager + rest.slice('<div class="att-work-section">'.length);
      }
      return manager + rest;
    }
    wrapped.__scc = true;
    p5a2rc1AttendanceInboxHtml_ = wrapped;
    return true;
  }

  function day(partial) {
    return partial;
  }

  function fixtureB09502() {
    var shifts = [
      { code: 'D1', name: '日班' },
      { code: 'N1', name: '夜班' },
      { code: 'OFF', name: '休假' }
    ];
    return {
      shiftOptions: shifts,
      managerCorrections: [
        day({
          correctionRequestId: 'ACR-B09502-1014',
          employeeId: 'B09502',
          employeeName: '潘淑華',
          date: '2026-10-14',
          requestType: 'MISSING_OUT',
          reason: '忘記打下班卡',
          requestedFirstIn: '',
          requestedLastOut: '2026-10-14 17:10',
          requestedShiftCode: '',
          payrollImpact: '',
          shiftOptions: shifts,
          systemSnapshot: {
            shiftCode: 'D1', shiftName: '日班', expectedStart: '08:00', expectedEnd: '17:00',
            firstIn: '2026-10-14 08:03', lastOut: '', missingIn: false, missingOut: true,
            anomalyDescription: '缺下班卡'
          },
          rawPunches: [{ direction: 'IN', at: '2026-10-14 08:03' }],
          suggestion: { firstIn: '2026-10-14 08:03', lastOut: '2026-10-14 17:10', shiftCode: 'D1', payrollImpact: 'N' }
        }),
        day({
          correctionRequestId: 'ACR-B09502-1101',
          employeeId: 'B09502',
          employeeName: '潘淑華',
          date: '2026-11-01',
          requestType: 'MISSING_IN',
          reason: '早上趕車，忘了打上班卡',
          requestedFirstIn: '2026-11-01 08:00',
          requestedLastOut: '',
          requestedShiftCode: '',
          payrollImpact: '',
          shiftOptions: shifts,
          systemSnapshot: {
            shiftCode: 'D1', shiftName: '日班', expectedStart: '08:00', expectedEnd: '17:00',
            firstIn: '', lastOut: '2026-11-01 17:05', missingIn: true, missingOut: false,
            anomalyDescription: '缺上班卡'
          },
          rawPunches: [{ direction: 'OUT', at: '2026-11-01 17:05' }],
          suggestion: { firstIn: '2026-11-01 08:00', lastOut: '2026-11-01 17:05', shiftCode: 'D1', payrollImpact: 'N' }
        }),
        day({
          correctionRequestId: 'ACR-B09502-1102',
          employeeId: 'B09502',
          employeeName: '潘淑華',
          date: '2026-11-02',
          requestType: 'MISSING_BOTH',
          reason: '請特休 8 小時',
          requestedFirstIn: '2026-11-02 08:00',
          requestedLastOut: '2026-11-02 17:00',
          requestedShiftCode: '',
          payrollImpact: '',
          shiftOptions: shifts,
          systemSnapshot: {
            shiftCode: 'D1', shiftName: '日班', expectedStart: '08:00', expectedEnd: '17:00',
            firstIn: '', lastOut: '', missingIn: true, missingOut: true,
            anomalyDescription: '缺勤'
          },
          rawPunches: [],
          suggestion: { firstIn: '2026-11-02 08:00', lastOut: '2026-11-02 17:00', shiftCode: 'D1', payrollImpact: 'N' }
        }),
        day({
          correctionRequestId: 'ACR-B09502-1103',
          employeeId: 'B09502',
          employeeName: '潘淑華',
          date: '2026-11-03',
          requestType: 'OTHER',
          reason: '這天是休假日，不是缺卡',
          requestedFirstIn: '',
          requestedLastOut: '',
          requestedShiftCode: 'OFF',
          payrollImpact: '',
          shiftOptions: shifts,
          systemSnapshot: {
            shiftCode: 'OFF', shiftName: '休假', expectedStart: '', expectedEnd: '',
            firstIn: '', lastOut: '', missingIn: true, missingOut: true,
            anomalyDescription: '排休日出勤異常'
          },
          rawPunches: [],
          suggestion: { firstIn: '', lastOut: '', shiftCode: 'OFF', payrollImpact: 'N' }
        })
      ]
    };
  }

  var api = {
    analyzeReason: analyzeReason,
    buildSuggestion: buildSuggestion,
    rawPunchLines: rawPunchLines,
    scheduleText: scheduleText,
    anomalyText: anomalyText,
    suggestionSentence: suggestionSentence,
    batchIds: batchIds,
    buildPayload: buildPayload,
    validateReject: validateReject,
    leaveReturnNote: leaveReturnNote,
    renderManagerHtml: renderManagerHtml,
    approveSequential: approveSequential,
    cardHtml: cardHtml,
    fixtureB09502: fixtureB09502,
    install: install,
    mount: mount,
    styles: styles
  };

  global.ABIS_SUPERVISOR_CORRECTION_CONFIRM = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
