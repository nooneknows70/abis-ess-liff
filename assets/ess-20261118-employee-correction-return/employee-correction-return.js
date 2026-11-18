/**
 * Employee attendance-correction return reason.
 *
 * Presentation only. Does not change the release manifest or claim a release.
 * Shows managerNote from the existing correction payload. A leave-form button
 * appears only when the note contains the marker the supervisor page writes
 * (ABIS:LEAVE_REQUEST). Without that marker the reason still shows and the
 * button stays hidden.
 */
(function (global) {
  'use strict';

  var LEAVE_REQUEST_MARK = 'ABIS:LEAVE_REQUEST';

  var UI = {
    ZH: {
      title: '出勤補正',
      status: '主管未採認',
      history: '申請紀錄',
      returnReason: '退回理由',
      goLeave: '去申請假單',
      request: '提出出勤補正',
      appeal: '提出異議',
      errorFriendly: '沒有送出，請稍後再試（{code}）',
      noLeave: '目前無法開啟請假頁（ECR_LEAVE_UNAVAILABLE）'
    },
    EN: {
      title: 'Attendance correction',
      status: 'Supervisor did not accept',
      history: 'Request',
      returnReason: 'Return reason',
      goLeave: 'Request leave',
      request: 'Submit a correction',
      appeal: 'Raise an appeal',
      errorFriendly: 'Could not send. Please try again ({code})',
      noLeave: 'The leave page cannot be opened (ECR_LEAVE_UNAVAILABLE)'
    },
    VI: {
      title: 'Điều chỉnh chấm công',
      status: 'Quản lý không chấp nhận',
      history: 'Đơn đã gửi',
      returnReason: 'Lý do trả lại',
      goLeave: 'Xin nghỉ',
      request: 'Gửi điều chỉnh',
      appeal: 'Khiếu nại',
      errorFriendly: 'Chưa gửi được, vui lòng thử lại ({code})',
      noLeave: 'Không mở được trang xin nghỉ (ECR_LEAVE_UNAVAILABLE)'
    },
    TH: {
      title: 'การแก้ไขเวลาทำงาน',
      status: 'หัวหน้าไม่รับรอง',
      history: 'คำขอ',
      returnReason: 'เหตุผลที่ส่งกลับ',
      goLeave: 'ไปยื่นใบลา',
      request: 'ส่งคำขอแก้ไข',
      appeal: 'ยื่นคำคัดค้าน',
      errorFriendly: 'ยังส่งไม่สำเร็จ โปรดลองอีกครั้ง ({code})',
      noLeave: 'เปิดหน้าใบลาไม่ได้ (ECR_LEAVE_UNAVAILABLE)'
    }
  };

  function langCode() {
    var lang = typeof currentLang === 'string' ? currentLang.toUpperCase() : 'ZH';
    return UI[lang] ? lang : 'ZH';
  }

  function t(key) {
    var pack = UI[langCode()] || UI.ZH;
    return (pack && pack[key]) || UI.ZH[key] || key;
  }

  function fill(key, map) {
    var text = t(key);
    Object.keys(map || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(map[name] == null ? '' : String(map[name]));
    });
    return text;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function shortDate(iso) {
    var match = String(iso || '').match(/^\d{4}-(\d{2})-(\d{2})$/);
    return match ? match[1] + '/' + match[2] : String(iso || '');
  }

  function latestCorrection(day) {
    if (!day) return null;
    if (day.activeCorrection) return day.activeCorrection;
    var items = Array.isArray(day.correctionRequests) ? day.correctionRequests : [];
    return items.length ? items[0] : null;
  }

  function isLeaveReturn(note) {
    return String(note || '').indexOf(LEAVE_REQUEST_MARK) >= 0;
  }

  function displayNote(note) {
    return String(note || '').split(LEAVE_REQUEST_MARK).join('').replace(/\n{2,}/g, '\n').trim();
  }

  function publicError(err, fallbackCode) {
    var code = String(fallbackCode || 'ECR_FAILED');
    if (err) {
      try { console.error(err); } catch (ignore) {}
      if (err.code || err.errorCode) code = String(err.code || err.errorCode);
    }
    return fill('errorFriendly', { code: code });
  }

  function noteBlock(correction, date) {
    var status = String(correction && correction.status || '').toUpperCase();
    if (status !== 'MANAGER_REJECTED') return '';
    var raw = correction.managerNote || '';
    var shown = displayNote(raw);
    if (!shown && !isLeaveReturn(raw)) return '';
    var leave = isLeaveReturn(raw)
      ? '<button type="button" class="ecr-leave" data-ecr-leave="' + esc(date || '') + '">' + esc(t('goLeave')) + '</button>'
      : '';
    return '<div class="ecr-note"><b>' + esc(t('returnReason')) + '</b>' +
      (shown ? '<p>' + esc(shown) + '</p>' : '') + leave + '</div>';
  }

  function actionButtons() {
    return '<div class="att-correction-actions ecr-actions">' +
      '<button type="button" class="secondary">' + esc(t('appeal')) + '</button>' +
      '<button type="button" class="secondary">' + esc(t('request')) + '</button>' +
      '</div>';
  }

  function renderPreview(day) {
    var correction = latestCorrection(day) || {};
    var status = String(correction.status || '').toUpperCase();
    var rejected = status === 'MANAGER_REJECTED';
    return '<section class="ecr"><h2>' + esc(t('title')) + '</h2>' +
      '<article class="ecr-card"><div class="ecr-date">' + esc(shortDate(day && day.date)) + '</div>' +
      '<div class="att-correction-state' + (rejected ? ' reject' : '') + '"><b>' + esc(t('history')) + '：</b>' + esc(rejected ? t('status') : status) + '</div>' +
      noteBlock(correction, day && day.date) +
      actionButtons() +
      '</article></section>';
  }

  function openLeaveForDate(date) {
    var opened = false;
    if (typeof showLeaveForm === 'function') {
      showLeaveForm(false, true);
      opened = true;
    }
    var start = typeof document !== 'undefined' && document.getElementById ? document.getElementById('startDate') : null;
    var end = typeof document !== 'undefined' && document.getElementById ? document.getElementById('endDate') : null;
    if (start) start.value = date || '';
    if (end) end.value = date || '';
    return { date: date || '', opened: opened };
  }

  function styles() {
    return [
      '.ecr{font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;color:#1f2937}',
      '.ecr h2{margin:0 0 12px;font-size:20px}',
      '.ecr-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px}',
      '.ecr-date{font-size:18px;font-weight:800;margin-bottom:8px}',
      '.att-correction-state.reject{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;border-radius:10px;padding:8px 10px}',
      '.ecr-note{margin-top:10px;background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:10px 12px;line-height:1.5}',
      '.ecr-note p{margin:6px 0 0;white-space:pre-wrap}',
      '.ecr-leave,.att-correction-actions button,.ecr-actions button{display:block;width:100%;box-sizing:border-box;margin-top:8px;border-radius:12px;font-weight:700}',
      'body.inner-view .att-correction-actions button,.ecr-actions button,.ecr-leave{min-height:48px !important}',
      '.ecr-leave{background:#157a45;color:#fff;border:0}',
      '.ecr-actions button{background:#fff;color:#1f2937;border:1px solid #d1d5db}'
    ].join('');
  }

  function ensureStyles() {
    if (typeof document === 'undefined' || document.getElementById('ecr-styles')) return;
    var node = document.createElement('style');
    node.id = 'ecr-styles';
    node.textContent = styles();
    document.head.appendChild(node);
  }

  function onClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-ecr-leave]') : null;
    if (!target) return;
    var result = openLeaveForDate(target.getAttribute('data-ecr-leave') || '');
    if (!result.opened && typeof message === 'function') message(t('noLeave'), 'warning');
  }

  function bind() {
    if (typeof document === 'undefined' || document.__ecrBound) return;
    document.addEventListener('click', onClick);
    document.__ecrBound = true;
  }

  function setBusy(value) {
    try { mutationBusy = value; } catch (ignore) {}
  }

  function isBusy() {
    try { return !!mutationBusy; } catch (ignore) { return false; }
  }

  function byId(id) {
    if (typeof $ === 'function') return $(id);
    return typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null;
  }

  function say(text, kind) {
    if (typeof message === 'function') message(text, kind);
  }

  function reportFailure(op, err, code) {
    var text = publicError(err, code);
    if (typeof finishOperationFailure_ === 'function') finishOperationFailure_(op, new Error(text));
    say(text, 'warning');
  }

  async function submitCorrection(day, triggerBtn) {
    if (isBusy()) { say(typeof nt === 'function' ? nt('busy') : t('errorFriendly'), 'warning'); return; }
    var typeEl = byId('attCorrType');
    var reasonEl = byId('attCorrReason');
    var inEl = byId('attCorrFirstIn');
    var outEl = byId('attCorrLastOut');
    var type = typeEl ? typeEl.value : '';
    var reason = reasonEl ? String(reasonEl.value || '').trim() : '';
    var requestedFirstIn = inEl ? inEl.value || '' : '';
    var requestedLastOut = outEl ? outEl.value || '' : '';
    if (!type) { say(typeof c2t === 'function' ? c2t('selectType') : type, 'warning'); return; }
    if (!reason) { say(typeof c2t === 'function' ? c2t('reasonRequired') : reason, 'warning'); return; }
    var needIn = ['MISSING_IN', 'MISSING_BOTH', 'WRONG_IN'].indexOf(type) >= 0;
    var needOut = ['MISSING_OUT', 'MISSING_BOTH', 'WRONG_OUT'].indexOf(type) >= 0;
    if ((needIn && !requestedFirstIn) || (needOut && !requestedLastOut)) {
      say(typeof c2t === 'function' ? c2t('timeRequired') : 'time', 'warning');
      return;
    }
    var requestId = 'ATT-CORR-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    setBusy(true);
    var op = typeof beginOperation_ === 'function' ? beginOperation_(typeof c2t === 'function' ? c2t('submitting') : '', typeof nt === 'function' ? nt('doNotRepeat') : '', triggerBtn) : 0;
    var success = false;
    try {
      await call('submitAttendanceCorrection', {
        sessionToken: typeof sessionToken === 'undefined' ? '' : sessionToken,
        attendanceKey: day.attendanceKey,
        requestType: type,
        requestedFirstIn: needIn ? requestedFirstIn : '',
        requestedLastOut: needOut ? requestedLastOut : '',
        reason: reason,
        requestId: requestId
      });
      success = true;
    } catch (err) {
      if (err && err.kind === 'TRANSPORT') {
        try {
          var status = await call('attendanceCorrectionStatus', { sessionToken: sessionToken, requestId: requestId });
          if (status && status.found) success = true;
        } catch (ignore) {}
        if (!success) {
          setBusy(false);
          if (typeof finishOperationUnknown_ === 'function') finishOperationUnknown_(op, typeof nt === 'function' ? nt('resultUnknown') : '', typeof nt === 'function' ? nt('unknownDetail') : '', false);
          return;
        }
      } else {
        setBusy(false);
        reportFailure(op, err, 'ECR_SUBMIT_FAILED');
        return;
      }
    }
    if (success) {
      if (typeof closeAttendanceCorrection_ === 'function') closeAttendanceCorrection_();
      try {
        var data = await call('myAttendance', { sessionToken: sessionToken, month: typeof p5a2AttendanceMonthValue_ === 'function' ? p5a2AttendanceMonthValue_() : '' });
        try { attendanceCache = data; } catch (ignore) {}
        try { attendanceViewMode = 'detail'; } catch (ignore) {}
        if (typeof renderMyAttendance_ === 'function') renderMyAttendance_(data);
        if (typeof finishOperationSuccess_ === 'function') finishOperationSuccess_(op, typeof c2t === 'function' ? c2t('submitted') : '', '');
        say(typeof c2t === 'function' ? c2t('submitted') : '', 'success');
      } catch (refreshErr) {
        if (typeof finishOperationSuccess_ === 'function') finishOperationSuccess_(op, typeof c2t === 'function' ? c2t('submitted') : '', typeof nt === 'function' ? nt('refreshAfterSuccessFail') : '');
        say(typeof nt === 'function' ? nt('refreshAfterSuccessFail') : '', 'warning');
      }
    }
    setBusy(false);
  }

  async function submitAppeal(correctionRequestId, attendanceKey, reason, triggerBtn) {
    var op = typeof beginOperation_ === 'function' ? beginOperation_(typeof a2rct === 'function' ? a2rct('processing') : '', typeof nt === 'function' ? nt('doNotRepeat') : '', triggerBtn) : 0;
    var requestId = 'A2-APPEAL-' + Date.now() + '-' + (typeof p4a13Uuid_ === 'function' ? p4a13Uuid_() : Math.random().toString(36).slice(2, 8));
    var ok = false;
    try {
      await call('submitAttendanceAppeal', { sessionToken: typeof sessionToken === 'undefined' ? '' : sessionToken, correctionRequestId: correctionRequestId, reason: reason, requestId: requestId });
      ok = true;
    } catch (err) {
      if (err && err.kind === 'TRANSPORT') {
        try {
          var status = await call('attendanceAppealStatus', { sessionToken: sessionToken, requestId: requestId });
          if (status && status.found) ok = true;
        } catch (ignore) {}
      }
      if (!ok) {
        reportFailure(op, err, 'ECR_APPEAL_FAILED');
        return;
      }
    }
    try {
      var data = await call('myAttendance', { sessionToken: sessionToken, month: typeof p5a2AttendanceMonthValue_ === 'function' ? p5a2AttendanceMonthValue_() : '' });
      try { attendanceCache = data; } catch (ignore) {}
      try { attendanceViewMode = 'detail'; } catch (ignore) {}
      if (typeof renderMyAttendance_ === 'function') renderMyAttendance_(data);
      if (typeof finishOperationSuccess_ === 'function') finishOperationSuccess_(op, typeof a2rct === 'function' ? a2rct('appealSubmitted') : '', '');
      say(typeof a2rct === 'function' ? a2rct('appealSubmitted') : '', 'success');
    } catch (ignore) {
      if (typeof finishOperationSuccess_ === 'function') finishOperationSuccess_(op, typeof a2rct === 'function' ? a2rct('appealSubmitted') : '', typeof nt === 'function' ? nt('refreshAfterSuccessFail') : '');
    }
  }

  function install() {
    ensureStyles();
    bind();
    if (typeof p5a202CorrectionStateHtml_ === 'function' && !p5a202CorrectionStateHtml_.__ecr) {
      var original = p5a202CorrectionStateHtml_;
      var wrapped = function (day) {
        return original(day) + noteBlock(latestCorrection(day), day && day.date);
      };
      wrapped.__ecr = true;
      p5a202CorrectionStateHtml_ = wrapped;
    }
    if (typeof call === 'function') {
      global.submitAttendanceCorrectionUi_ = submitCorrection;
      global.submitAttendanceAppealUi_ = submitAppeal;
    }
    return true;
  }

  function fixtureRejected(kind) {
    var leave = kind === 'leave';
    return {
      date: '2026-11-02',
      attendanceKey: '2026-11-02|B09502',
      correctionEnabled: true,
      correctionRequests: [{
        correctionRequestId: 'ACR-B09502-1102',
        status: 'MANAGER_REJECTED',
        requestType: 'MISSING_BOTH',
        managerNote: leave
          ? '這筆看起來是請特休 8 小時，請改申請假單。出勤補正先退回。\n' + LEAVE_REQUEST_MARK
          : '下班時間和打卡對不上，請再確認後重送。'
      }]
    };
  }

  function mount(target, day) {
    ensureStyles();
    bind();
    var html = renderPreview(day);
    if (typeof target === 'string') target = document.querySelector(target);
    if (target) target.innerHTML = html;
    return html;
  }

  global.ABIS_EMPLOYEE_CORRECTION_RETURN = {
    texts: UI,
    t: t,
    displayNote: displayNote,
    isLeaveReturn: isLeaveReturn,
    publicError: publicError,
    noteBlock: noteBlock,
    renderPreview: renderPreview,
    openLeaveForDate: openLeaveForDate,
    styles: styles,
    fixtureRejected: fixtureRejected,
    leaveRequestMark: LEAVE_REQUEST_MARK,
    install: install,
    mount: mount
  };

  if (typeof document !== 'undefined' && document && typeof document.createElement === 'function' && document.head) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
