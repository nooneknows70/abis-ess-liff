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

  var TYPE_KEY = {
    MISSING_IN: 'typeMissingIn',
    MISSING_OUT: 'typeMissingOut',
    MISSING_BOTH: 'typeMissingBoth',
    WRONG_IN: 'typeWrongIn',
    WRONG_OUT: 'typeWrongOut',
    SHIFT_SCHEDULE: 'typeShift',
    MULTI: 'typeMulti',
    OTHER: 'typeOther'
  };

  var SCC_UI = {
    ZH: {
      title: '主管出勤補正確認',
      employee: '員工',
      pending: '{n} 筆待確認',
      batch: '全部同意（{n}）',
      batchNote: '只同意沒有提醒的日期。有提醒的請單獨看。',
      schedule: '排班',
      rawPunch: '原始打卡',
      anomaly: '異常',
      request: '員工申請',
      locked: '不能改',
      noPunch: '未打卡',
      inWord: '上班',
      outWord: '下班',
      shiftWord: '班別',
      blank: '未填',
      shiftBlank: '班別未填',
      shiftMissing: '班別未提供',
      thisDay: '這一天',
      payNo: '不影響薪資',
      payYes: '影響薪資',
      payDefault: '預設：不影響（系統無建議）',
      suggestClocks: '建議採認上班 {in}、下班 {out}，{shift}，{pay}。',
      suggestDay: '建議採認{shift}，{pay}。',
      edit: '修改',
      collapse: '收合',
      labelIn: '採認上班',
      labelOut: '採認下班',
      labelShift: '採認班別',
      labelPay: '是否影響薪資',
      leaveHint: '原因像是請假（{type} {hours} 小時）。這筆應走請假，不是出勤補正。',
      leaveAction: '退回並請員工改申請假單',
      restHint: '原因提到休假日。先對一下當天班表，再決定要不要同意。',
      missingHint: '這筆還缺欄位，請先按修改確認後，再單筆同意。',
      agree: '同意',
      return: '退回',
      returnLabel: '退回原因',
      returnPlaceholder: '跟員工說為什麼退回',
      returnHelp: '只有退回要寫原因。同意不用。',
      returnSend: '送出退回',
      returnNeed: '退回要寫原因，員工才知道要改什麼。',
      leaveNote: '這筆看起來是請{type} {hours} 小時，請改申請假單。出勤補正先退回。',
      leaveNoteGeneric: '這筆看起來是請假，請改申請假單。出勤補正先退回。',
      agreedDay: '已同意 {date}',
      agreedCount: '已同意 {n} 筆',
      agreedPartial: '已同意 {n} 筆，後面停下。',
      noneToBatch: '沒有可一次同意的日期',
      approving: '正在同意 {i}/{n}',
      returnedDay: '已退回 {date}',
      errorFriendly: '沒有送出，請稍後再試（{code}）',
      errorFields: '請先按修改，把還沒填的欄位補上（{code}）',
      annual: '特休',
      personal: '事假',
      sick: '病假',
      typeMissingIn: '缺上班卡',
      typeMissingOut: '缺下班卡',
      typeMissingBoth: '上下班都缺卡',
      typeWrongIn: '上班時間不正確',
      typeWrongOut: '下班時間不正確',
      typeShift: '班別不正確',
      typeMulti: '多項補正',
      typeOther: '其他'
    },
    VI: {
      title: 'Xác nhận điều chỉnh chấm công',
      employee: 'Nhân viên',
      pending: '{n} mục cần xác nhận',
      batch: 'Đồng ý tất cả ({n})',
      batchNote: 'Chỉ đồng ý những ngày không có nhắc. Ngày có nhắc hãy xem riêng.',
      schedule: 'Ca',
      rawPunch: 'Chấm công gốc',
      anomaly: 'Bất thường',
      request: 'Nhân viên xin',
      locked: 'Không sửa được',
      noPunch: 'Chưa chấm',
      inWord: 'Vào',
      outWord: 'Ra',
      shiftWord: 'Ca',
      blank: 'Chưa có',
      shiftBlank: 'Chưa có ca',
      shiftMissing: 'Chưa có ca',
      thisDay: 'ngày này',
      payNo: 'Không ảnh hưởng lương',
      payYes: 'Có ảnh hưởng lương',
      payDefault: 'Mặc định: không ảnh hưởng (hệ thống không đề xuất)',
      suggestClocks: 'Đề nghị nhận vào {in}, ra {out}, {shift}, {pay}.',
      suggestDay: 'Đề nghị nhận {shift}, {pay}.',
      edit: 'Sửa',
      collapse: 'Thu gọn',
      labelIn: 'Giờ vào xác nhận',
      labelOut: 'Giờ ra xác nhận',
      labelShift: 'Ca xác nhận',
      labelPay: 'Ảnh hưởng lương',
      leaveHint: 'Lý do giống đơn nghỉ ({type} {hours} giờ). Nên xin nghỉ, không dùng điều chỉnh chấm công.',
      leaveAction: 'Trả lại và bảo nhân viên xin phép',
      restHint: 'Lý do nói đến ngày nghỉ. Hãy đối chiếu ca làm trước khi đồng ý.',
      missingHint: 'Thiếu dữ liệu. Hãy bấm Sửa để kiểm tra, rồi đồng ý từng mục.',
      agree: 'Đồng ý',
      return: 'Trả lại',
      returnLabel: 'Lý do trả lại',
      returnPlaceholder: 'Nói với nhân viên vì sao trả lại',
      returnHelp: 'Chỉ khi trả lại mới cần lý do.',
      returnSend: 'Gửi trả lại',
      returnNeed: 'Hãy viết lý do trả lại để nhân viên biết cần sửa gì.',
      leaveNote: 'Mục này giống nghỉ {type} {hours} giờ. Hãy xin phép. Điều chỉnh chấm công được trả lại.',
      leaveNoteGeneric: 'Mục này giống đơn nghỉ. Hãy xin phép. Điều chỉnh chấm công được trả lại.',
      agreedDay: 'Đã đồng ý {date}',
      agreedCount: 'Đã đồng ý {n} mục',
      agreedPartial: 'Đã đồng ý {n} mục, các mục sau dừng lại.',
      noneToBatch: 'Không có ngày nào để đồng ý một lần',
      approving: 'Đang đồng ý {i}/{n}',
      returnedDay: 'Đã trả lại {date}',
      errorFriendly: 'Chưa gửi được, vui lòng thử lại ({code})',
      errorFields: 'Hãy bấm Sửa và điền chỗ còn thiếu ({code})',
      annual: 'phép năm',
      personal: 'việc riêng',
      sick: 'ốm',
      typeMissingIn: 'Thiếu giờ vào',
      typeMissingOut: 'Thiếu giờ ra',
      typeMissingBoth: 'Thiếu cả giờ vào và ra',
      typeWrongIn: 'Giờ vào không đúng',
      typeWrongOut: 'Giờ ra không đúng',
      typeShift: 'Ca không đúng',
      typeMulti: 'Nhiều mục',
      typeOther: 'Khác'
    },
    TH: {
      title: 'ยืนยันการแก้ไขเวลาทำงาน',
      employee: 'พนักงาน',
      pending: '{n} รายการรอยืนยัน',
      batch: 'เห็นด้วยทั้งหมด ({n})',
      batchNote: 'เห็นด้วยเฉพาะวันที่ไม่มีการเตือน วันที่เตือนให้ดูทีละรายการ',
      schedule: 'กะ',
      rawPunch: 'เวลาตอกบัตรเดิม',
      anomaly: 'ผิดปกติ',
      request: 'พนักงานขอ',
      locked: 'แก้ไม่ได้',
      noPunch: 'ไม่ได้ตอก',
      inWord: 'เข้า',
      outWord: 'ออก',
      shiftWord: 'กะ',
      blank: 'ยังไม่มี',
      shiftBlank: 'ยังไม่มีกะ',
      shiftMissing: 'ยังไม่มีกะ',
      thisDay: 'วันนี้',
      payNo: 'ไม่กระทบเงินเดือน',
      payYes: 'กระทบเงินเดือน',
      payDefault: 'ค่าเริ่มต้น: ไม่กระทบ (ระบบไม่มีคำแนะนำ)',
      suggestClocks: 'แนะนำให้รับรองเข้า {in} ออก {out} กะ {shift} {pay}',
      suggestDay: 'แนะนำให้รับรอง{shift} {pay}',
      edit: 'แก้ไข',
      collapse: 'ย่อ',
      labelIn: 'เวลาเข้าที่รับรอง',
      labelOut: 'เวลาออกที่รับรอง',
      labelShift: 'กะที่รับรอง',
      labelPay: 'ผลต่อเงินเดือน',
      leaveHint: 'เหตุผลคล้ายการลา ({type} {hours} ชั่วโมง) ควรยื่นใบลา ไม่ใช่แก้เวลาทำงาน',
      leaveAction: 'ส่งกลับและให้พนักงานยื่นใบลา',
      restHint: 'เหตุผลพูดถึงวันหยุด ตรวจกะของวันนั้นก่อนตัดสินใจ',
      missingHint: 'ข้อมูลยังไม่ครบ กดแก้ไขเพื่อตรวจ แล้วค่อยเห็นด้วยทีละรายการ',
      agree: 'เห็นด้วย',
      return: 'ส่งกลับ',
      returnLabel: 'เหตุผลที่ส่งกลับ',
      returnPlaceholder: 'บอกพนักงานว่าต้องแก้อะไร',
      returnHelp: 'ต้องเขียนเหตุผลเฉพาะตอนส่งกลับ',
      returnSend: 'ยืนยันส่งกลับ',
      returnNeed: 'กรุณาเขียนเหตุผลที่ส่งกลับ เพื่อให้พนักงานรู้ว่าต้องแก้อะไร',
      leaveNote: 'รายการนี้คล้ายลา{type} {hours} ชั่วโมง กรุณายื่นใบลา การแก้เวลาถูกส่งกลับ',
      leaveNoteGeneric: 'รายการนี้คล้ายการลา กรุณายื่นใบลา การแก้เวลาถูกส่งกลับ',
      agreedDay: 'เห็นด้วยแล้ว {date}',
      agreedCount: 'เห็นด้วยแล้ว {n} รายการ',
      agreedPartial: 'เห็นด้วยแล้ว {n} รายการ รายการถัดไปหยุดไว้',
      noneToBatch: 'ไม่มีวันที่เห็นด้วยพร้อมกันได้',
      approving: 'กำลังเห็นด้วย {i}/{n}',
      returnedDay: 'ส่งกลับแล้ว {date}',
      errorFriendly: 'ยังส่งไม่สำเร็จ โปรดลองอีกครั้ง ({code})',
      errorFields: 'กดแก้ไขแล้วเติมช่องที่ยังว่าง ({code})',
      annual: 'ลาพักร้อน',
      personal: 'ลากิจ',
      sick: 'ลาป่วย',
      typeMissingIn: 'ขาดเวลาเข้า',
      typeMissingOut: 'ขาดเวลาออก',
      typeMissingBoth: 'ขาดทั้งเวลาเข้าและออก',
      typeWrongIn: 'เวลาเข้าไม่ถูกต้อง',
      typeWrongOut: 'เวลาออกไม่ถูกต้อง',
      typeShift: 'กะไม่ถูกต้อง',
      typeMulti: 'หลายรายการ',
      typeOther: 'อื่นๆ'
    },
    EN: {
      title: 'Confirm attendance correction',
      employee: 'Employee',
      pending: '{n} to confirm',
      batch: 'Agree all ({n})',
      batchNote: 'Agree only covers days with no hint. Review hinted days one by one.',
      schedule: 'Shift',
      rawPunch: 'Raw punches',
      anomaly: 'Anomaly',
      request: 'Employee asked',
      locked: 'Cannot change',
      noPunch: 'No punch',
      inWord: 'In',
      outWord: 'Out',
      shiftWord: 'Shift',
      blank: 'Missing',
      shiftBlank: 'Shift missing',
      shiftMissing: 'No shift',
      thisDay: 'this day',
      payNo: 'No payroll impact',
      payYes: 'Affects payroll',
      payDefault: 'Default: no payroll impact (no system suggestion)',
      suggestClocks: 'Suggested in {in}, out {out}, {shift}, {pay}.',
      suggestDay: 'Suggested {shift}, {pay}.',
      edit: 'Edit',
      collapse: 'Hide',
      labelIn: 'Confirmed in',
      labelOut: 'Confirmed out',
      labelShift: 'Confirmed shift',
      labelPay: 'Payroll impact',
      leaveHint: 'This reason looks like leave ({type}, {hours} hours). It should be a leave request, not an attendance correction.',
      leaveAction: 'Return and ask for a leave request',
      restHint: 'The reason mentions a rest day. Check the schedule before agreeing.',
      missingHint: 'Some fields are missing. Open Edit, confirm them, then agree this day only.',
      agree: 'Agree',
      return: 'Return',
      returnLabel: 'Return reason',
      returnPlaceholder: 'Tell the employee what to change',
      returnHelp: 'A reason is required only when you return this.',
      returnSend: 'Send return',
      returnNeed: 'Write a return reason so the employee knows what to change.',
      leaveNote: 'This looks like {type} leave for {hours} hours. Please submit a leave request. This correction is returned.',
      leaveNoteGeneric: 'This looks like leave. Please submit a leave request. This correction is returned.',
      agreedDay: 'Agreed {date}',
      agreedCount: 'Agreed {n}',
      agreedPartial: 'Agreed {n}, then stopped.',
      noneToBatch: 'No days can be agreed together',
      approving: 'Agreeing {i}/{n}',
      returnedDay: 'Returned {date}',
      errorFriendly: 'Could not send. Please try again ({code})',
      errorFields: 'Open Edit and fill the missing fields ({code})',
      annual: 'annual leave',
      personal: 'personal leave',
      sick: 'sick leave',
      typeMissingIn: 'Missing in punch',
      typeMissingOut: 'Missing out punch',
      typeMissingBoth: 'Missing both punches',
      typeWrongIn: 'In time is wrong',
      typeWrongOut: 'Out time is wrong',
      typeShift: 'Shift is wrong',
      typeMulti: 'Several items',
      typeOther: 'Other'
    }
  };

  function langCode() {
    var lang = typeof currentLang === 'string' ? currentLang.toUpperCase() : 'ZH';
    return SCC_UI[lang] ? lang : 'ZH';
  }

  function sccT(key) {
    var pack = SCC_UI[langCode()] || SCC_UI.ZH;
    var value = pack && pack[key];
    return value || (SCC_UI.ZH[key] || key);
  }

  function fill(key, map) {
    var text = sccT(key);
    Object.keys(map || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(map[name] == null ? '' : String(map[name]));
    });
    return text;
  }

  function leaveTypeName(name) {
    if (name === '特休') return sccT('annual');
    if (name === '事假') return sccT('personal');
    if (name === '病假') return sccT('sick');
    return name || '';
  }

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

  var LEAVE_REQUEST_MARK = 'ABIS:LEAVE_REQUEST';

  function leaveReturnNote(reason) {
    var hint = analyzeReason(reason);
    var text = !hint.leave ? sccT('leaveNoteGeneric') : fill('leaveNote', { type: leaveTypeName(hint.leaveType), hours: hint.hours });
    return text + '\n' + LEAVE_REQUEST_MARK;
  }

  function missingFields(row) {
    var sug = buildSuggestion(row);
    var inn = hm(sug.firstIn);
    var out = hm(sug.lastOut);
    var shift = String(sug.shiftCode || '');
    return !!((inn || out) && (!inn || !out || !shift));
  }

  function cardFlags(row) {
    var hint = analyzeReason(row && row.reason);
    var missing = missingFields(row);
    return {
      leave: hint.leave,
      leaveType: hint.leaveType,
      hours: hint.hours,
      restDay: hint.restDay,
      missing: missing,
      warning: !!(hint.warning || missing)
    };
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
      lines.push((out ? sccT('outWord') : sccT('inWord')) + ' ' + (hm(punch && punch.at) || sccT('noPunch')));
    });
    if (snap && snap.missingIn && !hasIn) lines.unshift(sccT('inWord') + ' ' + sccT('noPunch'));
    if (snap && snap.missingOut && !hasOut) lines.push(sccT('outWord') + ' ' + sccT('noPunch'));
    return lines;
  }
    if (!snap) return null;
    var hasPunch = snap.firstIn || snap.lastOut || snap.missingIn != null || snap.missingOut != null;
    if (!hasPunch) return null;
    var inn = snap.missingIn || !hm(snap.firstIn) ? sccT('noPunch') : hm(snap.firstIn);
    var out = snap.missingOut || !hm(snap.lastOut) ? sccT('noPunch') : hm(snap.lastOut);
    return [sccT('inWord') + ' ' + inn, sccT('outWord') + ' ' + out];
  }

  function scheduleText(row) {
    var snap = snapshotOf(row);
    if (!snap) return '';
    if (!snap.shiftName && !snap.shiftCode && !snap.expectedStart && !snap.expectedEnd) return '';
    var name = snap.shiftName || shiftName(snap.shiftCode, row) || sccT('shiftMissing');
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
    if (snap.missingIn && snap.missingOut) return sccT('typeMissingBoth');
    if (snap.missingOut) return sccT('typeMissingOut');
    if (snap.missingIn) return sccT('typeMissingIn');
    var code = String(snap.anomalyCode || '');
    var key = TYPE_KEY[code];
    return key ? sccT(key) : code;
  }

  function requestClockText(row) {
    var bits = [];
    if (row && row.requestedFirstIn) bits.push(sccT('inWord') + ' ' + (hm(row.requestedFirstIn) || row.requestedFirstIn));
    if (row && row.requestedLastOut) bits.push(sccT('outWord') + ' ' + (hm(row.requestedLastOut) || row.requestedLastOut));
    if (row && row.requestedShiftCode) bits.push(sccT('shiftWord') + ' ' + (shiftName(row.requestedShiftCode, row) || row.requestedShiftCode));
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
    var pay = sug.payrollImpact === 'Y' ? sccT('payYes') : sccT('payNo');
    var text = inn || out
      ? fill('suggestClocks', { in: inn || sccT('blank'), out: out || sccT('blank'), shift: shift || sccT('shiftBlank'), pay: pay })
      : fill('suggestDay', { shift: shift || sccT('thisDay'), pay: pay });
    return text;
  }

  function batchIds(rows, picked) {
    return (rows || []).filter(function (row) {
      if (!row || !row.correctionRequestId) return false;
      if (cardFlags(row).warning) return false;
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
    return String(note || '').trim() ? '' : sccT('returnNeed');
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
    if (!html) html = '<option value="">' + esc(sccT('shiftMissing')) + '</option>';
    return html;
  }

  function cardHtml(row, options) {
    options = options || {};
    var id = String(row.correctionRequestId || '');
    var hint = cardFlags(row);
    var sug = buildSuggestion(row);
    var punches = rawPunchLines(row);
    var schedule = scheduleText(row);
    var anomaly = anomalyText(row);
    var requestClock = requestClockText(row);
    var typeKey = TYPE_KEY[String(row.requestType || '').toUpperCase()];
    var typeLabel = typeKey ? sccT(typeKey) : '';
    var chip = anomaly || typeLabel;
    var openEdit = !!options.openEdit;
    var openReturn = !!options.openReturn;
    var returnNote = options.returnNote || '';
    var checked = !hint.warning && options.picked !== false;
    var showPick = !!options.showPick && !hint.warning;

    var facts = '';
    facts += fact(sccT('schedule'), schedule ? esc(schedule) : '');
    if (punches) {
      facts += fact(sccT('rawPunch'), punches.map(esc).join('<br>') + '<span class="scc-lock">' + esc(sccT('locked')) + '</span>');
    }
    facts += fact(sccT('anomaly'), anomaly ? esc(anomaly) : '');
    var requestBody = '';
    if (requestClock) requestBody += esc(requestClock);
    if (row.reason) requestBody += (requestBody ? '<br>' : '') + esc(row.reason);
    facts += fact(sccT('request'), requestBody);

    var hints = '';
    if (hint.leave) {
      hints += '<div class="scc-hint scc-hint-leave" role="note"><p>' + esc(fill('leaveHint', { type: leaveTypeName(hint.leaveType), hours: hint.hours })) + '</p>' +
        '<button type="button" class="scc-quiet" data-scc-leave-return="' + esc(id) + '">' + esc(sccT('leaveAction')) + '</button></div>';
    }
    if (hint.restDay) {
      hints += '<div class="scc-hint scc-hint-rest" role="note"><p>' + esc(sccT('restHint')) + '</p></div>';
    }
    if (hint.missing) {
      hints += '<div class="scc-hint scc-hint-missing" role="note"><p>' + esc(sccT('missingHint')) + '</p></div>';
    }

    var pick = showPick
      ? '<label class="scc-check"><input type="checkbox" data-scc-pick="' + esc(id) + '"' + (checked ? ' checked' : '') + '><span class="scc-date">' + esc(shortDate(row.date)) + '</span></label>'
      : '<span class="scc-date">' + esc(shortDate(row.date)) + '</span>';

    return '<article class="scc-card' + (hint.warning ? ' is-warn' : '') + '" data-scc-id="' + esc(id) + '" data-scc-warn="' + (hint.warning ? '1' : '0') + '">' +
      '<div class="scc-card-top">' + pick + (chip ? '<span class="scc-chip">' + esc(chip) + '</span>' : '') + '</div>' +
      (facts ? '<dl class="scc-facts">' + facts + '</dl>' : '') +
      '<p class="scc-suggest">' + esc(suggestionSentence(row)) + '</p>' +
      (sug.payrollSource === 'fallback' ? '<p class="scc-default">' + esc(sccT('payDefault')) + '</p>' : '') +
      '<button type="button" class="scc-edit" data-scc-edit="' + esc(id) + '" aria-expanded="' + (openEdit ? 'true' : 'false') + '">' + esc(openEdit ? sccT('collapse') : sccT('edit')) + '</button>' +
      '<div class="scc-form"' + (openEdit ? '' : ' hidden') + '>' +
        '<label>' + esc(sccT('labelIn')) + '<input type="datetime-local" data-scc-in="' + esc(id) + '" value="' + esc(dtLocal(sug.firstIn, row.date)) + '"></label>' +
        '<label>' + esc(sccT('labelOut')) + '<input type="datetime-local" data-scc-out="' + esc(id) + '" value="' + esc(dtLocal(sug.lastOut, row.date)) + '"></label>' +
        '<label>' + esc(sccT('labelShift')) + '<select data-scc-shift="' + esc(id) + '">' + shiftOptionsHtml(row, sug.shiftCode) + '</select></label>' +
        '<label>' + esc(sccT('labelPay')) + '<select data-scc-pay="' + esc(id) + '">' +
          '<option value="N"' + (sug.payrollImpact !== 'Y' ? ' selected' : '') + '>' + esc(sccT('payNo')) + '</option>' +
          '<option value="Y"' + (sug.payrollImpact === 'Y' ? ' selected' : '') + '>' + esc(sccT('payYes')) + '</option>' +
        '</select></label>' +
      '</div>' +
      hints +
      '<div class="scc-actions">' +
        '<button type="button" class="scc-agree" data-scc-agree="' + esc(id) + '"' + (hint.missing && !openEdit ? ' disabled' : '') + '>' + esc(sccT('agree')) + '</button>' +
        '<button type="button" class="scc-return" data-scc-return="' + esc(id) + '">' + esc(sccT('return')) + '</button>' +
      '</div>' +
      '<div class="scc-return-box"' + (openReturn ? '' : ' hidden') + ' data-scc-return-box="' + esc(id) + '">' +
        '<label>' + esc(sccT('returnLabel')) + '<textarea data-scc-note="' + esc(id) + '" maxlength="500" placeholder="' + esc(sccT('returnPlaceholder')) + '">' + esc(returnNote) + '</textarea></label>' +
        '<p class="scc-help">' + esc(sccT('returnHelp')) + '</p>' +
        '<p class="scc-error" data-scc-error="' + esc(id) + '" hidden></p>' +
        '<button type="button" class="scc-return-send" data-scc-return-send="' + esc(id) + '">' + esc(sccT('returnSend')) + '</button>' +
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
    return '<section class="scc" data-scc-root="1"><h2 class="scc-title">' + esc(sccT('title')) + '</h2>' +
      groups.map(function (group) { return groupHtml(group, options); }).join('') +
      '</section>';
  }

  function groupHtml(group, options) {
    var clean = batchIds(group.rows, null);
    var showBatch = group.rows.length > 1 && clean.length > 0 && !options.hideBatch;
    var person = (group.employeeName || sccT('employee')) + (group.employeeId ? ' · ' + group.employeeId : '');
    var batch = showBatch
      ? '<button type="button" class="scc-batch" data-scc-batch="' + esc(group.employeeId) + '">' + esc(fill('batch', { n: clean.length })) + '</button>' +
        '<p class="scc-batch-note">' + esc(sccT('batchNote')) + '</p>'
      : '';
    return '<section class="scc-person" data-scc-employee="' + esc(group.employeeId) + '">' +
      '<header class="scc-person-head"><p class="scc-name">' + esc(person) + '</p><p class="scc-count">' + esc(fill('pending', { n: group.rows.length })) + '</p>' + batch + '</header>' +
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
      if (cardFlags(row).warning && !opts.allowWarning) continue;
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
      '.scc-check{display:flex;align-items:center;gap:8px;font-weight:800;min-height:48px;min-width:48px}',
      '.scc-check input{width:48px;height:48px;min-width:48px;min-height:48px;margin:0;flex:0 0 48px}',
      '.scc-date{font-size:18px;font-weight:800}',
      '.scc-chip{margin-left:auto;background:#fff7ed;color:#9a3412;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:700}',
      '.scc-facts{margin:0;display:grid;gap:8px}',
      '.scc-facts div{display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px;align-items:start}',
      '.scc-facts dt{color:#6b7280;font-size:13px}',
      '.scc-facts dd{margin:0;font-size:15px;line-height:1.45;font-weight:650}',
      '.scc-lock{display:block;margin-top:2px;color:#6b7280;font-size:12px;font-weight:500}',
      '.scc-suggest{margin:10px 0 0;background:#f0fdf4;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.5}',
      '.scc-default{margin:8px 0 0;color:#92400e;font-size:13px;font-weight:700;line-height:1.4}',
      '.scc-edit,.scc-quiet,.scc-return,.scc-return-send{background:#fff;color:#1f2937;border:1px solid #d1d5db;border-radius:12px;min-height:48px;font-weight:700}',
      '.scc-edit,.scc-quiet{width:auto;padding:8px 12px;margin-top:8px}',
      '.scc-form{display:grid;gap:8px;margin-top:8px}',
      '.scc-form[hidden],.scc-return-box[hidden],.scc-error[hidden]{display:none !important}',
      '.scc-form label,.scc-return-box label{font-size:13px;color:#374151;font-weight:700}',
      '.scc-form input,.scc-form select,.scc-return-box textarea{width:100%;box-sizing:border-box;margin-top:4px;padding:10px;border:1px solid #d1d5db;border-radius:10px;font:inherit;background:#fff}',
      '.scc-hint{margin-top:10px;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.5}',
      '.scc-hint p{margin:0}',
      '.scc-hint-leave{background:#fff7ed;border:1px solid #fdba74}',
      '.scc-hint-rest{background:#eff6ff;border:1px solid #bfdbfe}',
      '.scc-hint-missing{background:#fff7ed;border:1px solid #fdba74}',
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

  function publicError(err, fallbackCode) {
    var code = String(fallbackCode || 'SCC_FAILED');
    if (err) {
      try { console.error(err); } catch (ignore) {}
      if (err.code || err.errorCode) code = String(err.code || err.errorCode);
    }
    var tone = (code === 'SCC_CONFIRM_FIELDS' || code === 'SCC_FIELDS_INCOMPLETE') ? 'errorFields' : 'errorFriendly';
    return fill(tone, { code: code });
  }

  function agreeBlock(row, root) {
    if (!missingFields(row)) return '';
    var form = root && root.querySelector ? root.querySelector('.scc-form') : null;
    if (!form || form.hidden) return 'SCC_CONFIRM_FIELDS';
    var values = readValues(row, root);
    if (!hm(values.firstIn) || !hm(values.lastOut) || !values.shiftCode) return 'SCC_FIELDS_INCOMPLETE';
    return '';
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
    var root = cardRoot(id);
    var block = agreeBlock(row, root);
    if (block) {
      showStatus(publicError(null, block));
      return;
    }
    model.busy = true;
    if (button) button.disabled = true;
    try {
      await sendOne(row, 'APPROVE', readValues(row, root), '');
      showStatus(fill('agreedDay', { date: shortDate(row.date) }));
      if (model.deps.refresh) await model.deps.refresh();
    } catch (err) {
      showStatus(publicError(err, 'SCC_AGREE_FAILED'));
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
      showStatus(sccT('noneToBatch'));
      return;
    }
    model.busy = true;
    if (button) button.disabled = true;
    var done = 0;
    try {
      for (var i = 0; i < ids.length; i++) {
        if (button) button.textContent = fill('approving', { i: i + 1, n: ids.length });
        var row = rowById(ids[i]);
        await sendOne(row, 'APPROVE', readValues(row, cardRoot(ids[i])), '');
        done += 1;
      }
      showStatus(fill('agreedCount', { n: done }));
      if (model.deps.refresh) await model.deps.refresh();
    } catch (err) {
      showStatus((done ? fill('agreedPartial', { n: done }) : '') + publicError(err, 'SCC_BATCH_FAILED'));
    } finally {
      model.busy = false;
      if (button) {
        button.disabled = false;
        button.textContent = fill('batch', { n: ids.length });
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
      showStatus(fill('returnedDay', { date: shortDate(row.date) }));
      if (model.deps.refresh) await model.deps.refresh();
    } catch (err) {
      setError(id, publicError(err, 'SCC_REJECT_FAILED'));
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
    button.textContent = open ? sccT('collapse') : sccT('edit');
    var agree = root.querySelector('.scc-agree');
    if (agree && missingFields(rowById(id))) agree.disabled = !open;
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

  function fixtureMissingFields() {
    var base = fixtureB09502();
    var shifts = base.shiftOptions;
    return {
      shiftOptions: shifts,
      managerCorrections: [
        {
          correctionRequestId: 'ACR-B09502-MISSING',
          employeeId: 'B09502',
          employeeName: '潘淑華',
          date: '2026-11-04',
          requestType: 'MISSING_OUT',
          reason: '只記得下班時間',
          requestedFirstIn: '',
          requestedLastOut: '2026-11-04 17:20',
          requestedShiftCode: '',
          payrollImpact: '',
          shiftOptions: shifts
        },
        base.managerCorrections[0]
      ]
    };
  }

  var api = {
    analyzeReason: analyzeReason,
    missingFields: missingFields,
    cardFlags: cardFlags,
    agreeBlock: agreeBlock,
    publicError: publicError,
    sccT: sccT,
    texts: SCC_UI,
    buildSuggestion: buildSuggestion,
    rawPunchLines: rawPunchLines,
    scheduleText: scheduleText,
    anomalyText: anomalyText,
    suggestionSentence: suggestionSentence,
    batchIds: batchIds,
    buildPayload: buildPayload,
    validateReject: validateReject,
    leaveReturnNote: leaveReturnNote,
    leaveRequestMark: LEAVE_REQUEST_MARK,
    renderManagerHtml: renderManagerHtml,
    approveSequential: approveSequential,
    cardHtml: cardHtml,
    fixtureB09502: fixtureB09502,
    fixtureMissingFields: fixtureMissingFields,
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
