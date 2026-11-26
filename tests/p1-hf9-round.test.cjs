'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const bundle = fs.readFileSync(path.resolve(__dirname, '../assets/ess-20261118-p1-hf9/abis-ess.bundle.js'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../assets/ess-20261118-p1-hf9/abis-ess.css'), 'utf8');
const start = bundle.indexOf('/* HF9_UI_ROUND_START');
const end = bundle.indexOf('/* HF9_UI_ROUND_END */');
assert.ok(start > 0 && end > start);
const context = { currentLang: 'ZH', console };
vm.createContext(context);
vm.runInContext(bundle.slice(start, end + '/* HF9_UI_ROUND_END */'.length), context);
const ui = context.HF9_UI_ROUND;

test('login bootstrap noise stays off the screen until a real failure', () => {
  assert.equal(ui.isBootNoise('homeBootstrap 缺少 home'), true);
  assert.equal(ui.isBootNoise(new Error('homeBootstrap 缺少 home')), true);
  assert.equal(ui.isBootNoise({ code: 'HOME_BOOTSTRAP_RETRY', status: 'PENDING', retryable: true }), true);
  assert.equal(ui.isRetryPayload({ code: 'HOME_BOOTSTRAP_RETRY', status: 'PENDING', retryable: true }), true);
  assert.equal(ui.isRetryPayload({ code: 'HOME_BOOTSTRAP_OK', status: 'READY', home: { employee: { id: 'A1' } } }), false);
  assert.equal(ui.isBootNoise({ employee: { id: 'A1' } }), false);
  assert.match(ui.friendlyBoot(), /HF9_LOGIN_BOOT/);
  assert.equal(ui.friendlyBoot().includes('homeBootstrap'), false);
  context.currentLang = 'EN';
  assert.match(ui.friendlyBoot(), /HF9_LOGIN_BOOT/);
  assert.equal(ui.humanize('homeBootstrap 缺少 home').includes('homeBootstrap'), false);
  context.currentLang = 'ZH';
});

test('internal codes and developer text become friendly labels', () => {
  context.currentLang = 'ZH';
  assert.equal(ui.humanize('OTHER_TEXT'), '其他說明');
  assert.equal(ui.humanize('OPEN'), '處理中');
  assert.equal(ui.humanize('MISSING_OUT'), '缺下班卡');
  assert.equal(ui.humanize('NO_PUNCH'), '未打卡');
  assert.equal(ui.humanize('SOURCE_COVERAGE_GAP'), '這段期間的出勤資料還不完整');
  assert.equal(ui.humanize('缺卡 N'), '無缺卡');
  assert.equal(ui.humanize('缺卡 Y'), '有缺卡');
  assert.match(ui.humanize('來源已失效｜原 Punch/Leave/排班'), /最新結果/);
  assert.equal(ui.humanize('OFFICE_DAY'), '辦公室日班');
  assert.match(ui.humanize('FACTORY_NIGHT_2000_0400'), /20:00/);
  assert.equal(ui.humanize('R2180D'), '出勤規則');
  assert.equal(ui.humanize('Restore First Login'), '恢復首次登入');
  assert.equal(ui.humanize('唯語'), '唯讀');
  assert.equal(ui.humanize('資料來源：ABIS_出勤薪資_正式母表_V1').includes('正式母表'), false);
  assert.match(ui.humanize('LV-20261101-ABCDEF'), /假單 · CDEF/);
  assert.match(ui.humanize('8 HR'), /8 小時/);
  context.currentLang = 'VI';
  assert.match(ui.humanize('8 HR'), /giờ/);
  assert.equal(ui.humanize('OFFICE_DAY'), 'Ca văn phòng ban ngày');
  context.currentLang = 'TH';
  assert.match(ui.humanize('8 HR'), /ชั่วโมง/);
  context.currentLang = 'ZH';
  const jsDate = 'Wed Nov 18 2026 09:12:00 GMT+0800';
  assert.equal(/GMT/.test(ui.humanize(jsDate)), false);
});

test('myAttendance period is top-level, and a one-day gap stays a day', () => {
  const backend208 = {
    month: '2026-11',
    period: { start: '2026-11-01', end: '2026-11-30', type: 'MONTH' },
    days: [{ date: '2026-11-05', shiftName: '辦公室日班' }],
    summary: { attendanceDays: 1 },
    coverageWarnings: [{ firstAffectedDate: '2026-11-05', lastAffectedDate: '2026-11-05' }]
  };
  assert.equal(backend208.attendanceMonth, undefined);
  const top = ui.attendancePeriod(backend208);
  assert.equal(top.start, '2026-11-01');
  assert.equal(top.end, '2026-11-30');
  const nested = ui.attendancePeriod({
    attendanceMonth: { period: { start: '2026-11-01', end: '2026-11-30' } }
  });
  assert.equal(nested.start, '2026-11-01');
  assert.equal(nested.end, '2026-11-30');
  assert.equal(ui.expandRange('2026-11-05 ~ 2026-11-05', '2026-11'), '2026-11-05 ~ 2026-11-05');
  assert.equal(ui.expandRange('2026-11-01 ~ 2026-11-01', '2026-11', {
    monthSummary: true,
    period: backend208.period
  }), '2026-11-01 ~ 2026-11-30');
});

test('the month label follows the value in the month input', () => {
  context.currentLang = 'ZH';
  const october = ui.monthLabelText('2026-10');
  const november = ui.monthLabelText('2026-11');
  assert.notEqual(october, november);
  assert.match(october, /10|十月/);
  assert.match(november, /11|十一月/);
  assert.equal(ui.monthLabelText(''), '');
});

test('home clock cells skeleton only while attendance is loading', () => {
  context.currentLang = 'ZH';
  assert.equal(ui.homeClockText(true, '—'), '');
  assert.equal(ui.homeClockText(false, '—'), '尚未打卡');
  assert.equal(ui.homeClockText(false, '18:02'), '18:02');
  context.currentLang = 'EN';
  assert.equal(ui.homeClockText(false, '—'), 'Not clocked');
  context.currentLang = 'VI';
  assert.equal(ui.homeClockText(false, '-'), 'Chưa chấm công');
  context.currentLang = 'TH';
  assert.equal(ui.homeClockText(false, ''), 'ยังไม่ลงเวลา');
  context.currentLang = 'ZH';
});

test('HR confirm and formal resubmit are primary, not the blue default', () => {
  assert.equal(ui.buttonRole('確認'), 'primary');
  assert.equal(ui.buttonRole('正式重新送出'), 'primary');
  assert.equal(ui.buttonRole('確認送出'), 'primary');
  assert.equal(ui.buttonRole('退回'), 'secondary');
  assert.equal(ui.buttonRole('確認撤回'), '');
});

test('vi and th primary and secondary buttons match the zh roles (R7 N2)', () => {
  const primary = {
    ZH: ['採認', '確認', '正式重新送出', '核准申請', '全部同意'],
    VI: ['Chấp nhận', 'Chấp nhận và gửi', 'Xác nhận', 'Gửi lại chính thức', 'Quản lý phê duyệt', 'Gửi đơn', 'Đồng ý'],
    TH: ['รับรอง', 'ยอมรับและส่ง', 'ยืนยัน', 'ส่งใหม่อย่างเป็นทางการ', 'ผู้บังคับบัญชาอนุมัติ', 'ส่งคำขอลา']
  };
  const secondary = {
    ZH: ['不採認', '退回', '修改'],
    VI: ['Không chấp nhận', 'Trả lại', 'Từ chối', 'Sửa', 'Không đồng ý'],
    TH: ['ไม่รับรอง', 'ไม่ยอมรับ', 'ส่งคืน', 'ปฏิเสธ', 'แก้ไข']
  };
  const neutral = {
    ZH: ['確認撤回', '查看全部'],
    VI: ['Xác nhận rút', 'Xác nhận đặt lại', 'Xem tất cả', 'Gửi đơn nghỉ Xin nghỉ'],
    TH: ['ยืนยันการถอน', 'ดูทั้งหมด']
  };
  for (const lang of ['ZH', 'VI', 'TH']) {
    context.currentLang = lang;
    for (const label of primary[lang]) assert.equal(ui.buttonRole(label), 'primary', lang + ' ' + label);
    for (const label of secondary[lang]) assert.equal(ui.buttonRole(label), 'secondary', lang + ' ' + label);
    for (const label of neutral[lang]) assert.equal(ui.buttonRole(label), '', lang + ' ' + label);
    assert.equal(ui.buttonRole('  ' + primary[lang][0].split('').join('') + '  '), 'primary', lang + ' padded');
  }
  context.currentLang = 'ZH';
});

test('a one-day gap stays a day, and only the month summary uses the period', () => {
  const bounds = ui.monthBounds('2026-11');
  assert.equal(bounds.start, '2026-11-01');
  assert.equal(bounds.end, '2026-11-30');
  assert.equal(ui.expandRange('2026-11-01 ~ 2026-11-01', '2026-11'), '2026-11-01 ~ 2026-11-01');
  assert.equal(ui.expandRange('2026-11-03 ~ 2026-11-18', '2026-11'), '2026-11-03 ~ 2026-11-18');
  assert.equal(ui.expandRange('2026-11-01 ~ 2026-11-01', '2026-11', 'monthSummary'), '2026-11-01 ~ 2026-11-30');
  assert.equal(ui.expandRange('2026-11-01 ~ 2026-11-01', null, {
    monthSummary: true,
    period: { start: '2026-11-01', end: '2026-11-30' }
  }), '2026-11-01 ~ 2026-11-30');
});

test('shift and recent labels follow the active language', () => {
  const day = {
    shiftCode: 'OFFICE_DAY',
    shiftName: '辦公室日班',
    shiftLabels: { ZH: '辦公室日班', VI: 'Ca văn phòng', TH: 'กะออฟฟิศ', EN: 'Office day' },
    recentLabels: { ZH: '出勤', VI: 'Chấm công', TH: 'ลงเวลา', EN: 'Attendance' }
  };
  context.currentLang = 'VI';
  assert.equal(ui.shiftLabel(day), 'Ca văn phòng');
  assert.equal(ui.recentLabel(day), 'Chấm công');
  context.currentLang = 'TH';
  assert.equal(ui.shiftLabel(day), 'กะออฟฟิศ');
  context.currentLang = 'ZH';
  assert.equal(ui.shiftLabel({ shiftCode: 'OFFICE_DAY', shiftName: 'OFFICE_DAY' }), '辦公室日班');
});

test('logout clears the session keys the bundle stores', () => {
  const local = new Map(ui.sessionKeys.map((key) => [key, 'kept']));
  const session = new Map([['abis_session', 'x']]);
  let cleared = false;
  ui.clearStores({
    removeItem(key) { local.delete(key); }
  }, {
    removeItem(key) { session.delete(key); },
    clear() { cleared = true; session.clear(); }
  });
  assert.equal(local.size, 0);
  assert.equal(session.size, 0);
  assert.equal(cleared, true);
});

test('hf9 still declares the functions the correction pages wrap', () => {
  assert.match(bundle, /function p5a2rc1AttendanceInboxHtml_/);
  assert.match(bundle, /function p5a202CorrectionStateHtml_/);
  assert.match(bundle, /\[1000, 2000, 4000, 8000\]/);
  assert.match(css, /button\.hf9-primary-action\{background:#0b8f5a/);
  assert.match(css, /min-height:48px!important/);
  assert.match(css, /\.hf9-skel\{/);
});
