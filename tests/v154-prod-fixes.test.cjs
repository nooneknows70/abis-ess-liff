'use strict';

// V154 production acceptance fixes (P2-A, P2-C, P3). Pure checks run in a vm;
// the DOM checks need jsdom (same as p1-hf9-index-harness) and are skipped
// when it is not installed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/ess-20261118-p1-hf9/abis-ess.css'), 'utf8');
const bundle = fs.readFileSync(path.join(root, 'assets/ess-20261118-p1-hf9/abis-ess.bundle.js'), 'utf8');
const sccSource = fs.readFileSync(path.join(root, 'assets/ess-20261118-supervisor-correction-confirm/supervisor-correction-confirm.js'), 'utf8');
const start = bundle.indexOf('/* HF9_UI_ROUND_START');
const end = bundle.indexOf('/* HF9_UI_ROUND_END */');
const hf9Context = { currentLang: 'ZH', console };
vm.createContext(hf9Context);
vm.runInContext(bundle.slice(start, end + '/* HF9_UI_ROUND_END */'.length), hf9Context);
const ui = hf9Context.HF9_UI_ROUND;

function scc(lang) {
  const context = { console, document: undefined, currentLang: lang };
  vm.createContext(context);
  vm.runInContext(sccSource, context, { filename: 'supervisor-correction-confirm.js' });
  return context.ABIS_SUPERVISOR_CORRECTION_CONFIRM;
}

const INTERNAL_NOTE = '當日 3 筆出勤事件（含核准人工調整，如有）；目前以首筆/末筆計算；該日期已有有效 Punch Import Batch 或員工據點設備覆蓋證明；確認排班但整個工作時段無有效打卡';

test('P3: mark-all button and notification tabs fit a 320px viewport', () => {
  const rule = css.slice(css.lastIndexOf('@media(max-width:360px)'));
  assert.match(rule, /\.notification-mark-all/);
  assert.match(rule, /max-width:100%/);
  assert.match(rule, /white-space:normal/);
  assert.match(rule, /\.notification-tabs\{[^}]*flex-wrap:wrap/);
});

test('P2-A: OFFICE_DAY reads as the SHIFT_RULE master name in zh', () => {
  hf9Context.currentLang = 'ZH';
  assert.equal(ui.humanize('OFFICE_DAY'), '辦公室固定日班');
  assert.equal(ui.shiftLabel({ shiftCode: 'OFFICE_DAY', shiftName: 'OFFICE_DAY' }), '辦公室日班');
  assert.equal(ui.shiftLabel({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室固定日班' }), '辦公室日班');
  assert.equal(ui.shiftLabel({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室日班' }), '辦公室日班');
  assert.equal(ui.authoritativeShiftName({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室固定日班' }), '辦公室日班');
  assert.equal(ui.authoritativeShiftName({ shiftName: '工廠日班D1' }), '工廠日班D1');
});

test('P2-C: Punch Import Batch and other engineering terms are translated in zh/vi/th', () => {
  const cases = { ZH: '打卡紀錄匯入', VI: 'Bản ghi chấm công được nhập', TH: 'บันทึกเวลาที่นำเข้า' };
  for (const [lang, label] of Object.entries(cases)) {
    hf9Context.currentLang = lang;
    const out = ui.humanize('該日期已有有效 Punch Import Batch 或 device coverage pending、COVERAGE_PROOF、OVERTIME_FACT、Payroll');
    assert.ok(out.includes(label), lang + ': ' + out);
    assert.equal(ui.humanize('PUNCH_IMPORT_BATCH'), label);
    assert.doesNotMatch(out, /Punch Import Batch|device coverage pending|COVERAGE_PROOF|OVERTIME_FACT|Payroll/, lang);
    assert.equal(ui.humanize('Temporary PIN'), ui.pack().tempPin);
  }
  hf9Context.currentLang = 'EN';
  assert.match(ui.humanize('Punch Import Batch'), /Punch Import Batch/);
  hf9Context.currentLang = 'ZH';
  assert.match(ui.humanize('來源已失效｜原 Punch/Leave/排班'), /最新結果/);
});

test('P2-C: zh code after a CJK word has no gap (員工未打卡, not 員工 未打卡)', () => {
  hf9Context.currentLang = 'ZH';
  assert.equal(ui.humanize('員工 未打卡'), '未打卡');
  assert.equal(ui.humanize('員工未打卡'), '未打卡');
  assert.equal(ui.humanize('不判定員工 NO_PUNCH'), '不判定員工未打卡');
  assert.equal(ui.humanize('員工 MISSING_OUT'), '員工缺下班卡');
  assert.equal(ui.humanize('NO_PUNCH'), '未打卡');
  assert.equal(ui.humanize('上班 08:00'), '上班 08:00');
  hf9Context.currentLang = 'VI';
  assert.equal(ui.humanize('A NO_PUNCH'), 'A Chưa chấm công');
  hf9Context.currentLang = 'ZH';
});

test('P2-C: approval card anomaly uses a plain label instead of the internal note', () => {
  const snap = { anomalyCode: 'NO_PUNCH', anomalyDescription: INTERNAL_NOTE, missingIn: true, missingOut: true };
  const zh = scc('ZH');
  assert.equal(zh.anomalyText({ systemSnapshot: snap }), '已排班但全日無打卡');
  const vi = scc('VI');
  assert.equal(vi.anomalyText({ systemSnapshot: snap }), 'Có ca nhưng cả ngày không chấm công');
  const th = scc('TH');
  assert.equal(th.anomalyText({ systemSnapshot: snap }), 'มีกะแต่ไม่มีการลงเวลาทั้งวัน');
  for (const ui2 of [zh, vi, th]) {
    const html = ui2.cardHtml({ correctionRequestId: 'C1', date: '2026-11-02', employeeId: 'B1', requestType: 'MISSING_IN', systemSnapshot: snap }, {});
    assert.doesNotMatch(html, /Punch Import Batch|首筆\/末筆|出勤事件|NO_PUNCH|員工 未打卡/);
  }
});

test('P2-C: several codes, plain zh notes, and fallbacks', () => {
  const zh = scc('ZH');
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyCode: 'NO_PUNCH;SOURCE_COVERAGE_PENDING', anomalyDescription: INTERNAL_NOTE } }), '已排班但全日無打卡、打卡來源待確認');
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyDescription: '員工 未打卡' } }), '未打卡');
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyCode: 'PUNCH_IMPORT_BATCH', anomalyDescription: INTERNAL_NOTE } }), zh.texts.ZH.anomalyGeneric);
  assert.equal(zh.anomalyText({ systemSnapshot: { reasonCodes: ['PUNCH_IMPORT_BATCH'], anomalyCode: 'NO_PUNCH', anomalyDescription: INTERNAL_NOTE, attendanceStatus: '無打卡' } }), '已排班但全日無打卡');
  assert.equal(zh.anomalyText({ systemSnapshot: { reasonCodes: ['PUNCH_IMPORT_BATCH'], anomalyCode: 'SOURCE_COVERAGE_GAP', anomalyDescription: '該日期未落在任何有效 Punch Import Batch 涵蓋期間；屬來源資料缺口，不判定員工 NO_PUNCH' } }), '打卡來源有缺口，不判定員工未打卡');
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyDescription: '該日期已有有效 Punch Import Batch', attendanceStatus: '無打卡' } }), '無打卡');
  const gapHtml = zh.cardHtml({ correctionRequestId: 'C8', date: '2026-11-01', employeeId: 'B1', requestType: 'OTHER', systemSnapshot: { reasonCodes: ['PUNCH_IMPORT_BATCH'], anomalyCode: 'SOURCE_COVERAGE_GAP', anomalyDescription: INTERNAL_NOTE } }, {});
  assert.match(gapHtml, /打卡來源有缺口，不判定員工未打卡/);
  assert.doesNotMatch(gapHtml, /打卡紀錄匯入|Punch Import Batch/);
  const spaced = zh.cardHtml({ correctionRequestId: 'C9', date: '2026-11-02', employeeId: 'B1', employeeName: '員工', requestType: 'MISSING_IN', systemSnapshot: { attendanceStatus: '無打卡', anomalyCode: 'NO_PUNCH', missingIn: true, missingOut: true } }, {});
  assert.doesNotMatch(spaced, /員工 未打卡|員工 無打卡/);
  // a short plain zh note stays as written
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyCode: 'EARLY_LEAVE', anomalyDescription: '實際早退 298 分鐘' } }), '實際早退 298 分鐘');
  // vi never shows the zh-only note
  const vi = scc('VI');
  assert.equal(vi.anomalyText({ systemSnapshot: { anomalyCode: 'EARLY_LEAVE', anomalyDescription: '實際早退 298 分鐘' } }), 'Về sớm');
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyCode: 'SOMETHING_NEW', anomalyDescription: INTERNAL_NOTE } }), zh.texts.ZH.anomalyGeneric);
  assert.equal(vi.anomalyText({ systemSnapshot: { anomalyDescription: INTERNAL_NOTE } }), vi.texts.VI.anomalyGeneric);
  // an internal note with no known phrase stays generic
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyCode: 'SOMETHING_NEW', anomalyDescription: '目前以首筆/末筆計算' } }), zh.texts.ZH.anomalyGeneric);
  // missing flags still work without code or note
  assert.equal(vi.anomalyText({ systemSnapshot: { missingOut: true } }), vi.texts.VI.typeMissingOut);
  assert.equal(zh.anomalyText({ systemSnapshot: {} }), '');
  // every code label exists in all four languages
  for (const [code, labels] of Object.entries(zh.anomalyLabels)) {
    for (const lang of ['ZH', 'VI', 'TH', 'EN']) assert.ok(labels[lang], code + ' ' + lang);
  }
});

test('P2-A: home shift uses the attendance name, not the OFFICE_DAY placeholder', () => {
  hf9Context.currentLang = 'ZH';
  assert.equal(ui.authoritativeShiftName({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室日班' }), '辦公室日班');
  assert.equal(ui.authoritativeShiftName({ shiftCode: 'OFFICE_DAY', shiftName: 'OFFICE_DAY' }), '辦公室日班');
  assert.equal(ui.authoritativeShiftName({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室固定日班' }), '辦公室日班');
  assert.equal(ui.authoritativeShiftName({
    shiftCode: 'OFFICE_DAY',
    shiftName: '辦公室固定日班',
    shiftLabels: { ZH: '辦公室日班' }
  }), '辦公室日班');
  assert.equal(ui.authoritativeShiftName({
    shiftCode: 'D1',
    shiftName: '工廠日班D1',
    shiftLabels: { zh: '自訂日班' }
  }), '自訂日班');
  assert.equal(ui.authoritativeShiftName({
    shiftCode: 'OFFICE_DAY',
    shiftName: 'OFFICE_DAY',
    shiftLabels: { ZH: '辦公室日班', VI: 'Ca văn phòng', TH: 'กะออฟฟิศ' }
  }, 'ZH'), '辦公室日班');
  assert.equal(ui.humanize('OFFICE_DAY'), '辦公室固定日班');
  const key = new Date();
  const today = key.getFullYear() + '-' + String(key.getMonth() + 1).padStart(2, '0') + '-' + String(key.getDate()).padStart(2, '0');
  const row = { date: today, shiftCode: 'OFFICE_DAY', shiftName: '辦公室日班', firstIn: '', lastOut: '' };
  assert.equal(ui.confirmedHomeToday({ __perf3: true, todayAttendance: row }).shiftName, '辦公室日班');
  assert.equal(ui.confirmedHomeToday({ __fast4Partial: true, todayAttendance: row }), null);
  assert.equal(ui.confirmedHomeToday({ __perf3: true, today: { shiftCode: 'OFFICE_DAY' } }), null);
  assert.equal(ui.confirmedHomeToday({ __perf3: true }), null);
  assert.equal(ui.confirmedHomeToday({ todayAttendance: { date: '2020-01-01', shiftName: '辦公室日班', firstIn: '08:12', lastOut: '18:17' } }), null);
  assert.equal(ui.confirmedHomeToday({ todayAttendance: { shiftName: '辦公室日班', firstIn: '08:12', lastOut: '18:17' } }), null);
  hf9Context.currentLang = 'VI';
  assert.equal(ui.authoritativeShiftName({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室日班' }, 'VI'), 'Ca văn phòng ban ngày');
  assert.equal(ui.authoritativeShiftName({ shiftName: '辦公室日班', firstIn: '08:12' }, 'VI'), '');
  assert.equal(ui.shiftLabel({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室日班' }, 'VI'), 'Ca văn phòng ban ngày');
  assert.equal(ui.shiftLabel({ shiftName: '辦公室日班', firstIn: '08:12' }, 'TH'), '');
  hf9Context.currentLang = 'TH';
  assert.equal(ui.authoritativeShiftName({ shiftCode: 'OFFICE_DAY', shiftName: '辦公室日班' }, 'TH'), 'กะออฟฟิศกลางวัน');
  const factoryD1 = {
    shiftCode: 'D1',
    shiftName: '工廠日班D1',
    shiftLabels: { 'zh-TW': '工廠日班D1', vi: 'Ca nhà máy D1', th: 'กะโรงงาน D1' }
  };
  assert.equal(ui.authoritativeShiftName(factoryD1, 'VI'), 'Ca nhà máy D1');
  assert.equal(ui.shiftLabel(factoryD1, 'VI'), 'Ca nhà máy D1');
  assert.equal(ui.authoritativeShiftName(factoryD1, 'TH'), 'กะโรงงาน D1');
  assert.equal(ui.shiftLabel(factoryD1, 'TH'), 'กะโรงงาน D1');
  assert.equal(ui.authoritativeShiftName(factoryD1, 'ZH'), '工廠日班D1');
  assert.equal(ui.shiftLabel({
    shiftCode: 'D1',
    shiftName: '工廠日班D1',
    shiftLabels: { ZH: '工廠日班D1', VI: 'Ca nhà máy D1', TH: 'กะโรงงาน D1' }
  }, 'VI'), 'Ca nhà máy D1');
  hf9Context.currentLang = 'ZH';
});

test('P2-B: pending counts depend on taskSummary and ignore another employee cache', () => {
  const contract = ui.pendingCountContract;
  assert.equal(contract.primaryAction, 'pendingCounts');
  assert.equal(contract.fallbackAction, 'taskSummary');
  assert.equal(contract.primaryPayload.join(','), 'sessionToken');
  assert.match(contract.primaryResponse, /pendingCounts/);
  const fast = ui.normalizePendingCounts({
    fastMode: true, source: 'FAST_CACHE', cached: true,
    pendingCounts: { total: 4, returnedLeave: 1, attendanceException: 2, approval: 3, supplement: 0 }
  });
  assert.equal(fast.approval, 3);
  assert.equal(fast.source, 'FAST_CACHE');
  assert.equal(fast.fastMode, true);
  const legacy = ui.normalizePendingCounts({
    taskSummary: { total: 1, returnedLeave: 0, attendanceException: 0, approval: 1, supplement: 0 }
  });
  assert.equal(legacy.approval, 1);
  assert.equal(legacy.fastMode, undefined);
  assert.equal(ui.normalizePendingCounts({ pendingCounts: { total: 1 } }), null);
  assert.match(contract.alsoOverwritesFrom, /taskInbox/);
  assert.match(bundle, /action === 'home' \|\| action === 'homeBootstrap'/);
  assert.match(bundle, /singleFlightCounts_/);
  assert.match(bundle, /api\.startTaskSummaryNow/);
  const same = ui.parseStoredCounts(ui.serializeCounts('A09906', {
    total: 4, returnedLeave: 1, attendanceException: 2, approval: 3, supplement: 0
  }), 'a09906');
  assert.equal(same.returnedLeave, 1);
  assert.equal(same.__hf9Stale, true);
  assert.equal(ui.parseStoredCounts(ui.serializeCounts('A09906', {
    total: 4, returnedLeave: 1, attendanceException: 2, approval: 3, supplement: 0
  }), 'A09701'), null);
  assert.equal(ui.parseStoredCounts('{"employeeId":"A09906","counts":{"total":1}}', 'A09906'), null);
});

test('P3: unread badge stays blank until ready and caps at 99+', () => {
  assert.equal(ui.unreadBadgeText(2, false), '');
  assert.equal(ui.unreadBadgeText(100, false), '');
  assert.equal(ui.unreadBadgeText(2, true), '2');
  assert.equal(ui.unreadBadgeText(100, true), '100');
  assert.equal(ui.unreadBadgeText(130, true), '130');
  assert.equal(ui.unreadBadgeText(0, true), '');
});

test('P3: home title and Temporary PIN no longer mix languages', () => {
  assert.match(bundle, /viaWeb:'WEB 登入',dashboard:'總覽'/);
  assert.match(bundle, /homeTitle:'首頁'/);
  assert.match(bundle, /homeTitle:'Trang chủ'/);
  assert.match(bundle, /homeTitle:'หน้าแรก'/);
  assert.match(bundle, /home-dashboard-title"><strong>\$\{escapeHtml\(fht_\('homeTitle'\)\)\}<\/strong><\/div>/);
  assert.doesNotMatch(bundle, /home-dashboard-title"><strong>\$\{escapeHtml\(tr\('home'\)\)\}<\/strong><span>/);
  assert.doesNotMatch(bundle, /function noteRpc_/);
  assert.match(bundle, /dashboard:'Tổng quan'/);
  assert.match(bundle, /dashboard:'ภาพรวม'/);
  const dialog = fs.readFileSync(path.join(root, 'assets/ess-20261118-p1-hf9/ess-dialog-hf4.js'), 'utf8');
  assert.doesNotMatch(dialog, /Temporary PIN/);
  const hrLine = bundle.split('\n').find((line) => line.includes('const confirmText=currentLang===')) || '';
  assert.doesNotMatch(hrLine, /Temporary PIN/);
  assert.match(hrLine, /臨時 PIN/);
  assert.match(hrLine, /PIN tạm thời/);
  assert.match(hrLine, /PIN ชั่วคราว/);
});

let JSDOM = null;
try { ({ JSDOM } = require('jsdom')); } catch (ignore) { JSDOM = null; }

test('P2-A/P3 in a page: clock rows, duplicate warning, unread count, login header', { skip: !JSDOM && 'jsdom not installed', timeout: 30000 }, async () => {
  const fixture = path.join(__dirname, 'fixtures', 'index-r5.html');
  const dom = await JSDOM.fromFile(fixture, {
    contentType: 'text/html; charset=utf-8',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.HF9_BOOT_RETRY_DELAYS = [0, 0, 0, 0];
      window.__hf9Handle = () => ({ ok: true, data: {} });
      window.__hf9Seed = { session: '', lang: 'ZH' };
    }
  });
  const window = dom.window;
  await new Promise((resolve) => {
    if (window.document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve());
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
  const doc = window.document;

  // P2-A: bootstrap / __perf3 is not confirmation. Loading says 載入中.
  // 尚未打卡 only after myAttendance includes today with an empty punch.
  // The shift cell does not keep the bootstrap name 辦公室固定日班.
  const home = doc.getElementById('home');
  const row = '<div class="fh-status-row"><span class="fh-status-label">上班時間</span><span class="fh-status-value">—</span></div>' +
    '<div class="fh-status-row"><span class="fh-status-label">今日班別</span><span class="fh-status-value">辦公室固定日班</span></div>';
  window.eval('attendanceCache = null; homeData = { employee: { id: "A1", shift: "辦公室固定日班" }, __perf3: true, today: { shiftCode: "OFFICE_DAY" } }');
  window.__hf9AttendanceLoading = false;
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[0].textContent, '—');
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '—');
  window.__hf9AttendanceLoading = true;
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[0].textContent, '載入中');
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '載入中');
  window.__hf9AttendanceLoading = false;
  const today = new Date();
  const key = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  window.eval('attendanceCache = { days: [{ date: ' + JSON.stringify(key) + ', firstIn: "", lastOut: "", shiftCode: "OFFICE_DAY", shiftName: "辦公室日班" }] }');
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[0].textContent, '尚未打卡');
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '辦公室日班');
  window.eval('attendanceCache = { days: [{ date: ' + JSON.stringify(key) + ', firstIn: "", lastOut: "", shiftCode: "OFFICE_DAY", shiftName: "辦公室固定日班" }] }');
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '辦公室日班');
  window.eval('attendanceCache = { days: [{ date: ' + JSON.stringify(key) + ', firstIn: "", lastOut: "", shiftCode: "D1", shiftName: "工廠日班D1" }] }');
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '工廠日班D1');
  window.eval('attendanceCache = { days: [{ date: ' + JSON.stringify(key) + ', firstIn: "", lastOut: "", shiftCode: "OFFICE_DAY", shiftName: "辦公室固定日班", shiftLabels: { zh: "自訂班" } }] }');
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '自訂班');
  const labeled = {
    date: key,
    shiftCode: 'OFFICE_DAY',
    shiftName: '辦公室固定日班',
    shiftLabels: { 'zh-TW': '辦公室日班', vi: 'Ca van phong', th: 'กะออฟฟิศ' }
  };
  window.eval('attendanceCache = null; homeData = ' + JSON.stringify({
    todayAttendance: labeled,
    cards: { today: labeled }
  }));
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '辦公室日班');
  window.setLanguage('VI', false);
  window.__hf9RefreshHomeClock(window.document.getElementById('home'));
  const viValues = [...window.document.querySelectorAll('.fh-status-value')].map((node) => node.textContent);
  assert.ok(viValues.includes('Ca van phong'), viValues.join(' | '));
  window.setLanguage('ZH', false);
  window.eval('attendanceCache = null; homeData = ' + JSON.stringify({
    todayAttendance: { date: key, shiftCode: 'OFFICE_DAY', shiftName: '辦公室固定日班' },
    cards: { today: { date: key, shiftCode: 'OFFICE_DAY', shiftName: '辦公室固定日班' } }
  }));
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '辦公室日班');
  const staleRow = '<div class="fh-status-row"><span class="fh-status-label">上班時間</span><span class="fh-status-value">08:12</span></div>' +
    '<div class="fh-status-row"><span class="fh-status-label">今日班別</span><span class="fh-status-value">辦公室日班</span></div>' +
    '<div class="fh-status-row"><span class="fh-status-label">今日狀態</span><span class="fh-status-pill">正常</span></div>';
  window.eval('attendanceCache = null; homeData = { __perf3: true, todayAttendance: { shiftName: "辦公室日班", firstIn: "08:12", lastOut: "18:17" } }');
  home.innerHTML = staleRow;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[0].textContent, '—');
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '—');
  assert.equal(home.querySelector('.fh-status-pill').textContent, '—');
  window.eval('attendanceCache = null; homeData = { __fast4Partial: true, todayAttendance: { date: ' + JSON.stringify(key) + ', shiftName: "辦公室日班", shiftCode: "OFFICE_DAY", firstIn: "", lastOut: "" } }');
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[0].textContent, '—');
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '—');
  window.eval('homeData = { __perf3: true, todayAttendance: { date: ' + JSON.stringify(key) + ', shiftName: "辦公室日班", shiftCode: "OFFICE_DAY", firstIn: "", lastOut: "" } }');
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.fh-status-value')[0].textContent, '尚未打卡');
  assert.equal(home.querySelectorAll('.fh-status-value')[1].textContent, '辦公室日班');

  // P2-B: same-employee cached counts are applied immediately and marked stale.
  const memory = new Map();
  const storage = {
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(String(key), String(value)); },
    removeItem(key) { memory.delete(String(key)); }
  };
  Object.defineProperty(window, 'sessionStorage', { configurable: true, get: () => storage });
  storage.setItem('abis_hf9_task_counts_v1', window.HF9_UI_ROUND.serializeCounts('A09906', {
    total: 4, returnedLeave: 1, attendanceException: 2, approval: 3, supplement: 0
  }));
  window.eval('sessionToken = "synthetic-session"; rememberedEmployeeId = "A09906"; homeData = { employee: { id: "A09906" } }; taskSummaryCache = null;');
  window.__hf9CountsKicked = false;
  window.HF9_UI_ROUND.startTaskSummaryNow();
  assert.equal(window.eval('taskSummaryCache && taskSummaryCache.__hf9Stale'), true);
  assert.equal(window.eval('taskSummaryCache.returnedLeave'), 1);
  assert.equal(window.eval('taskSummaryCache.approval'), 3);

  // The count request is queued before homeBootstrap's own request.
  const order = [];
  window.google.script.run = {
    withSuccessHandler(ok) {
      return { withFailureHandler() {
        return { api(action, payload) {
          order.push(action);
          if (action === 'homeBootstrap') order.deferred = !!(payload && payload.deferTaskSummary);
          const counts = { total: 1, returnedLeave: 1, attendanceException: 0, approval: 0, supplement: 0 };
          const data = action === 'pendingCounts'
            ? { pendingCounts: counts, taskSummary: counts, fastMode: false, source: 'LEGACY', cached: false }
            : (action === 'taskSummary'
              ? { taskSummary: counts }
              : { code: 'HOME_BOOTSTRAP_OK', status: 'READY', home: { employee: { id: 'A09906', preferredLanguage: 'zh-TW' } }, canSubmitLeave: false });
          ok({ ok: true, data: data });
        } };
      } };
    }
  };
  window.__hf9CountsKicked = false;
  await window.call('homeBootstrap', { sessionToken: 'synthetic-session' });
  assert.ok(order.indexOf('pendingCounts') >= 0, 'pendingCounts was not called: ' + order.join(','));
  assert.ok(order.indexOf('homeBootstrap') >= 0, order.join(','));
  assert.ok(order.indexOf('pendingCounts') < order.indexOf('homeBootstrap'), order.join(' then '));
  assert.equal(order.indexOf('taskSummary'), -1, 'taskSummary ran even though pendingCounts succeeded: ' + order.join(','));
  assert.equal(order.deferred, true);
  window.__hf9CountsInflight = null;
  window.google.script.run = {
    withSuccessHandler(ok) {
      return { withFailureHandler() {
        return { api(action) {
          order.push('fail:' + action);
          ok({ ok: false, error: '系統忙碌' });
        } };
      } };
    }
  };
  const kept = await window.call('taskSummary', { sessionToken: 'synthetic-session' });
  assert.equal(kept.taskSummary.returnedLeave, 1);
  assert.equal(kept.taskSummary.total, 1);
  assert.equal(Number(window.eval('taskSummaryCache.returnedLeave')), 1);
  assert.equal(Number(window.eval('taskSummaryCache.total')), 1);

  async function countLogin(handler) {
    const seen = [];
    window.__hf9CountsInflight = null;
    window.__hf9CountsFinal = false;
    window.__hf9CountsSnapshot = null;
    window.__hf9CountFlight = null;
    window.__hf9CountsFailed = null;
    window.__hf9CountsKicked = false;
    window.google.script.run = {
      withSuccessHandler(ok) {
        return { withFailureHandler() {
          return { api(action, payload) {
            seen.push(action);
            handler(action, payload, ok);
          } };
        } };
      }
    };
    window.eval('sessionToken = "synthetic-session"; homeData = { employee: { id: "A09906" } }; taskSummaryCache = null;');
    window.HF9_UI_ROUND.startTaskSummaryNow();
    await window.call('pendingCounts', { sessionToken: 'synthetic-session' });
    await window.call('homeBootstrap', { sessionToken: 'synthetic-session' });
    await window.call('taskSummary', { sessionToken: 'synthetic-session' });
    return seen;
  }
  const counts = { total: 4, returnedLeave: 1, attendanceException: 2, approval: 4, supplement: 0 };
  const okPath = await countLogin((action, payload, ok) => {
    if (action === 'pendingCounts') {
      ok({ ok: true, data: { pendingCounts: counts, taskSummary: counts, fastMode: false, source: 'LEGACY', cached: false } });
      return;
    }
    ok({ ok: true, data: { code: 'HOME_BOOTSTRAP_OK', status: 'READY', home: { employee: { id: 'A09906' } }, deferTaskSummary: !!(payload && payload.deferTaskSummary) } });
  });
  assert.equal(okPath.filter((action) => action === 'pendingCounts').length, 1, okPath.join(','));
  assert.equal(okPath.filter((action) => action === 'taskSummary').length, 0, okPath.join(','));
  const missingPath = await countLogin((action, payload, ok) => {
    if (action === 'pendingCounts') {
      ok({ ok: false, error: '不支援的操作' });
      return;
    }
    if (action === 'taskSummary') {
      ok({ ok: true, data: { taskSummary: counts } });
      return;
    }
    ok({ ok: true, data: { code: 'HOME_BOOTSTRAP_OK', status: 'READY', home: { employee: { id: 'A09906' } } } });
  });
  assert.equal(missingPath.filter((action) => action === 'pendingCounts').length, 1, missingPath.join(','));
  assert.equal(missingPath.filter((action) => action === 'taskSummary').length, 1, missingPath.join(','));
  const flagOff = await countLogin((action, payload, ok) => {
    if (action === 'pendingCounts') {
      ok({ ok: true, data: { pendingCounts: counts, taskSummary: counts, fastMode: false, source: 'LEGACY', cached: false } });
      return;
    }
    ok({ ok: true, data: {} });
  });
  assert.equal(flagOff.filter((action) => action === 'pendingCounts').length, 1, flagOff.join(','));
  assert.equal(flagOff.filter((action) => action === 'taskSummary').length, 0, flagOff.join(','));
  window.__hf9CountsInflight = null;
  window.__hf9CountsFinal = false;
  window.__hf9CountsSnapshot = null;
  window.__hf9CountFlight = null;
  window.__hf9CountsFailed = null;
  window.__hf9CountsKicked = false;
  window.eval('taskSummaryCache = null');
  window.google.script.run = {
    withSuccessHandler(ok) {
      return { withFailureHandler() {
        return { api() { ok({ ok: false, error: '系統忙碌' }); } };
      } };
    }
  };
  await window.call('pendingCounts', { sessionToken: 'synthetic-session' }).catch(() => null);
  assert.equal(window.eval('taskSummaryCache'), null);

  const early = [];
  window.__hf9CountsInflight = null;
  window.__hf9CountsFinal = false;
  window.__hf9CountsSnapshot = null;
  window.__hf9CountFlight = null;
  window.__hf9CountsFailed = null;
  window.__hf9CountsKicked = false;
  window.google.script.run = {
    withSuccessHandler(ok) {
      return { withFailureHandler() {
        return { api(action) {
          early.push(action);
          if (action === 'pendingCounts') {
            ok({ ok: true, data: { pendingCounts: counts, taskSummary: counts, fastMode: false, source: 'LEGACY', cached: false } });
            return;
          }
          ok({ ok: true, data: {} });
        } };
      } };
    }
  };
  window.eval('sessionToken = "synthetic-session"; homeData = { employee: { id: "A09906", preferredLanguage: "zh-TW" }, __fast4Partial: true, todayAttendance: { shiftName: "辦公室日班", firstIn: "08:12" } }; taskSummaryCache = null;');
  window.enterApp();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(early[0], 'pendingCounts', early.join(','));
  assert.equal(early.includes('homeBootstrap'), false, early.join(','));

  function resetCountState() {
    window.__hf9CountsInflight = null;
    window.__hf9CountsFinal = false;
    window.__hf9CountsSnapshot = null;
    window.__hf9CountFlight = null;
    window.__hf9CountsFailed = null;
    window.__hf9CountsKicked = false;
    window.__hf9CountsKey = '';
  }
  async function countWhileIdArrives(start, respond) {
    const seen = [];
    let release = null;
    const gate = new Promise((resolve) => { release = resolve; });
    resetCountState();
    window.google.script.run = {
      withSuccessHandler(ok) {
        return { withFailureHandler() {
          return { api(action, payload) {
            seen.push(action);
            const finish = () => respond(action, payload, ok);
            if (action === 'pendingCounts' || action === 'taskSummary') gate.then(finish);
            else finish();
          } };
        } };
      }
    };
    window.eval('sessionToken = "synthetic-session"; rememberedEmployeeId = ""; homeData = null; taskSummaryCache = null;');
    const started = start();
    await new Promise((resolve) => setTimeout(resolve, 30));
    window.eval('homeData = { employee: { id: "A09906" } };');
    const again = Promise.all([
      window.call('pendingCounts', { sessionToken: 'synthetic-session' }),
      window.call('taskSummary', { sessionToken: 'synthetic-session' }),
      window.call('homeBootstrap', { sessionToken: 'synthetic-session' })
    ]);
    release();
    await Promise.all([started, again]);
    return seen;
  }
  const countOk = (action, payload, ok) => {
    if (action === 'pendingCounts') {
      ok({ ok: true, data: { pendingCounts: counts, taskSummary: counts, fastMode: false, source: 'LEGACY', cached: false } });
      return;
    }
    ok({ ok: true, data: { code: 'HOME_BOOTSTRAP_OK', status: 'READY', home: { employee: { id: 'A09906' } }, deferTaskSummary: !!(payload && payload.deferTaskSummary) } });
  };
  const loginNoHome = await countWhileIdArrives(
    () => window.call('home', { sessionToken: 'synthetic-session' }),
    countOk
  );
  assert.equal(loginNoHome.filter((action) => action === 'pendingCounts').length, 1, loginNoHome.join(','));
  assert.equal(loginNoHome.filter((action) => action === 'taskSummary').length, 0, loginNoHome.join(','));
  storage.setItem('abis_hf9_task_counts_v1', window.HF9_UI_ROUND.serializeCounts('B09701', {
    total: 9, returnedLeave: 9, attendanceException: 0, approval: 0, supplement: 0
  }));
  const reopen = await countWhileIdArrives(
    () => window.call('homeBootstrap', { sessionToken: 'synthetic-session' }),
    countOk
  );
  assert.equal(reopen.filter((action) => action === 'pendingCounts').length, 1, reopen.join(','));
  assert.equal(reopen.filter((action) => action === 'taskSummary').length, 0, reopen.join(','));
  assert.equal(Number(window.eval('taskSummaryCache.returnedLeave')), 1);
  const fallbackSeen = [];
  let releaseFallback = null;
  const fallbackGate = new Promise((resolve) => { releaseFallback = resolve; });
  resetCountState();
  window.google.script.run = {
    withSuccessHandler(ok) {
      return { withFailureHandler() {
        return { api(action) {
          fallbackSeen.push(action);
          if (action === 'pendingCounts') {
            ok({ ok: false, error: '不支援的操作' });
            return;
          }
          if (action === 'taskSummary') {
            fallbackGate.then(() => ok({ ok: true, data: { taskSummary: counts } }));
            return;
          }
          ok({ ok: true, data: { code: 'HOME_BOOTSTRAP_OK', status: 'READY', home: { employee: { id: 'A09906' } } } });
        } };
      } };
    }
  };
  window.eval('sessionToken = "synthetic-session"; rememberedEmployeeId = ""; homeData = null; taskSummaryCache = null;');
  const fallbackFirst = window.call('pendingCounts', { sessionToken: 'synthetic-session' });
  await new Promise((resolve) => setTimeout(resolve, 30));
  window.eval('homeData = { employee: { id: "A09906" } };');
  const fallbackAgain = Promise.all([
    window.call('pendingCounts', { sessionToken: 'synthetic-session' }),
    window.call('taskSummary', { sessionToken: 'synthetic-session' }),
    window.call('homeBootstrap', { sessionToken: 'synthetic-session' })
  ]);
  releaseFallback();
  await fallbackFirst;
  await fallbackAgain;
  assert.equal(fallbackSeen.filter((action) => action === 'pendingCounts').length, 1, fallbackSeen.join(','));
  assert.equal(fallbackSeen.filter((action) => action === 'taskSummary').length, 1, fallbackSeen.join(','));

  window.__hf9NotificationSummary = null;
  window.eval('notificationCache = null');
  const loadingNotices = window.fhNoticesHtml_(2);
  assert.equal(loadingNotices.includes('目前沒有新通知'), false);
  assert.match(loadingNotices, /載入中|hf9-skel/);

  window.a2t = (key) => ({
    late: '遲到', normal: '正常', anomaly: '異常', rest: '休', leaveDay: '請假',
    summary: 'summary', readOnly: 'readOnly', pilot: 'pilot', coverageGap: 'coverageGap'
  }[key] || key);
  const graceDays = Array.from({ length: 11 }, (_, index) => ({
    date: '2026-11-' + String(index + 1).padStart(2, '0'),
    expectedHours: 8,
    actualHours: 8,
    firstIn: '08:05',
    lastOut: '17:30',
    lateMinutes: index + 1
  }));
  graceDays.forEach((day) => {
    assert.equal(window.p5a2AttendanceStatus_(day).text, '正常');
    assert.equal(window.rc2AttCalendarSymbols_(day).some((mark) => mark.glyph === '▲'), false);
  });
  const graceLate = window.p5a2CountedLate_(graceDays);
  assert.equal(graceLate.lateCount, 0);
  assert.equal(graceLate.lateMinutes, 0);
  const lateDay = { date: '2026-11-12', expectedHours: 8, actualHours: 8, firstIn: '08:16', lastOut: '17:30', lateMinutes: 16 };
  assert.equal(window.p5a2AttendanceStatus_(lateDay).text, '異常');
  assert.equal(window.rc2AttCalendarSymbols_(lateDay).some((mark) => mark.glyph === '▲'), true);
  const oneLate = window.p5a2CountedLate_(graceDays.concat([lateDay]));
  assert.equal(oneLate.lateCount, 1);
  assert.equal(oneLate.lateMinutes, 16);
  const summaryHtml = window.p5a2AttendanceSummaryHtml_({ summary: { lateCount: 11, lateMinutes: 25 }, days: graceDays });
  assert.match(summaryHtml, />0 \/ 0</);

  window.__hf9NoticeListState = 'error';
  window.__hf9NotificationSummary = { unread: 60, generalUnread: 60, __hf9FromHome: true };
  window.eval('activeNotificationFilter = "ALL"; activeNotificationData = null; notificationCache = null;');
  window.renderNotificationCenter_();
  const failedNotes = doc.getElementById('notificationCenterList').textContent;
  assert.equal(failedNotes.includes('目前沒有通知'), false);
  assert.match(failedNotes, /通知暫時無法載入/);
  window.__hf9NoticeListState = 'ready';
  window.eval('activeNotificationData = { items: [] }; notificationCache = { items: [], summary: { unread: 60, generalUnread: 60 } };');
  window.renderNotificationCenter_();
  const emptyNotes = doc.getElementById('notificationCenterList').textContent;
  assert.equal(emptyNotes.includes('目前沒有通知'), false);
  assert.match(emptyNotes, /60/);

  if (typeof window.I18N === 'undefined') window.I18N = { ZH: { loading: '載入中...' }, VI: {}, TH: {}, EN: {} };
  if (typeof window.p4a14t !== 'function') window.p4a14t = () => '';
  window.eval('myLeavesCache = null;');
  window.__hf9LeaveTimeoutMs = 5000;
  window.google.script.run = {
    withSuccessHandler() {
      return {
        withFailureHandler(fail) {
          return { api(action) { if (action === 'myLeaves') fail(new Error('busy')); } };
        }
      };
    }
  };
  const fastLeave = window.refreshLeaves();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(await fastLeave, null);
  const fastText = doc.getElementById('leaveList').textContent;
  assert.match(fastText, /假單載入失敗/);
  assert.match(fastText, /重新載入/);
  assert.equal(fastText.includes('載入中'), false);

  window.__hf9LeaveTimeoutMs = 60000;
  window.eval('myLeavesCache = null;');
  window.PERF3_INFLIGHT_ = {};
  const reenterClears = [];
  window.perf3ClearInflight_ = (section) => {
    reenterClears.push(section);
    Object.keys(window.PERF3_INFLIGHT_).forEach((flightKey) => {
      if (flightKey === section || flightKey.indexOf(section + '\n') === 0) delete window.PERF3_INFLIGHT_[flightKey];
    });
  };
  let reenterCalls = 0;
  let finishSlow;
  const rawCallForReenter = window.call;
  window.call = function (action, payload) {
    if (action === 'myLeaves' && window.PERF3_INFLIGHT_) {
      const heldKey = Object.keys(window.PERF3_INFLIGHT_).find((name) => name === 'leaves' || name.indexOf('leaves\n') === 0);
      if (heldKey) return window.PERF3_INFLIGHT_[heldKey];
    }
    return rawCallForReenter.call(window, action, payload);
  };
  window.google.script.run = {
    withSuccessHandler(ok) {
      return {
        withFailureHandler() {
          return {
            api(action) {
              if (action !== 'myLeaves') return;
              reenterCalls += 1;
              if (reenterCalls === 1) {
                window.PERF3_INFLIGHT_['leaves\nslow\n1'] = new Promise(() => {});
                finishSlow = () => ok({ ok: true, data: [] });
                return;
              }
              ok({ ok: true, data: [] });
            }
          };
        }
      };
    }
  };
  const slowEntry = window.refreshLeaves();
  await new Promise((resolve) => setTimeout(resolve, 30));
  const duringSlow = window.refreshLeaves();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(reenterCalls, 1);
  assert.equal(reenterClears.length, 0);
  finishSlow();
  await slowEntry;
  await duringSlow;
  if (typeof window.abisPerf2Invalidate_ === 'function') window.abisPerf2Invalidate_('leaves');
  window.eval('myLeavesCache = null;');
  delete window.PERF3_INFLIGHT_['leaves\nslow\n1'];
  window.call = rawCallForReenter;
  if (typeof window.clearOperationTimers_ === 'function') window.clearOperationTimers_();

  window.__hf9LeaveTimeoutMs = 40;
  window.eval('myLeavesCache = null;');
  window.PERF3_INFLIGHT_ = {};
  const clearCalls = [];
  window.perf3ClearInflight_ = (section) => {
    clearCalls.push(section);
    Object.keys(window.PERF3_INFLIGHT_).forEach((flightKey) => {
      if (flightKey === section || flightKey.indexOf(section + '\n') === 0) delete window.PERF3_INFLIGHT_[flightKey];
    });
  };
  let myLeavesCalls = 0;
  const rawCall = window.call;
  function heldLeaveFlight() {
    const bag = window.PERF3_INFLIGHT_ || {};
    const flightKey = Object.keys(bag).find((name) => name === 'leaves' || name.indexOf('leaves\n') === 0 || name === 'myLeaves');
    return flightKey ? bag[flightKey] : null;
  }
  window.call = function (action, payload) {
    if (action === 'myLeaves') {
      const held = heldLeaveFlight();
      if (held) return held;
    }
    return rawCall.call(window, action, payload);
  };
  window.google.script.run = {
    withSuccessHandler(ok) {
      return {
        withFailureHandler() {
          return {
            api(action) {
              if (action !== 'myLeaves') return;
              myLeavesCalls += 1;
              if (myLeavesCalls === 1) {
                window.PERF3_INFLIGHT_['leaves\ntok\n1'] = new Promise(() => {});
                return;
              }
              ok({ ok: true, data: [] });
            }
          };
        }
      };
    }
  };
  const op = doc.getElementById('opStatus');
  op.classList.remove('hide');
  op.textContent = '網路較慢，仍在等待伺服器回應…';
  const leaveResult = window.refreshLeaves();
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(await leaveResult, null);
  const leaveText = doc.getElementById('leaveList').textContent;
  assert.match(leaveText, /假單載入失敗/);
  assert.match(leaveText, /重新載入/);
  assert.equal(window.PERF3_INFLIGHT_['leaves\ntok\n1'], undefined);
  assert.ok(clearCalls.includes('leaves'));
  assert.equal(op.classList.contains('hide'), true);
  assert.equal(op.textContent, '');
  const retryButton = doc.getElementById('leaveList').querySelector('button');
  assert.match(retryButton.getAttribute('onclick'), /hf9RetryLeaves_\(\)/);
  window.PERF3_INFLIGHT_['leaves\ntok\n1'] = new Promise(() => {});
  const beforeRetry = myLeavesCalls;
  const clearsBeforeRetry = clearCalls.length;
  retryButton.click();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(myLeavesCalls - beforeRetry, 1);
  assert.ok(clearCalls.length > clearsBeforeRetry);
  assert.equal(clearCalls[clearsBeforeRetry], 'leaves');
  delete window.perf3ClearInflight_;
  if (typeof window.abisPerf2Invalidate_ === 'function') window.abisPerf2Invalidate_('leaves');
  window.eval('myLeavesCache = null;');
  window.PERF3_INFLIGHT_['leaves\nold\n1'] = new Promise(() => {});
  const beforeFallback = myLeavesCalls;
  const fallback = window.hf9RetryLeaves_();
  await new Promise((resolve) => setTimeout(resolve, 30));
  await fallback;
  assert.equal(myLeavesCalls - beforeFallback, 1);
  assert.equal(window.PERF3_INFLIGHT_['leaves\nold\n1'], undefined);
  window.call = rawCall;
  if (typeof window.clearOperationTimers_ === 'function') window.clearOperationTimers_();

  window.setLanguage('ZH', false);
  const detail = window.p5a2AttendanceDetailHtml_({ days: [
    { date: '2026-11-12', anomalyCode: 'LATE', lateMinutes: 16, exceptions: [{ code: 'LATE' }] },
    { date: '2026-11-13', anomalyCode: 'LATE_OVER_30', lateMinutes: 31, exceptions: [{ code: 'LATE_OVER_30' }] }
  ] });
  assert.doesNotMatch(detail, /LATE/);
  assert.match(detail, /遲到超過 30 分/);
  assert.match(detail, /｜遲到/);
  window.setLanguage('VI', false);
  const viDetail = window.p5a2AttendanceDetailHtml_({ days: [
    { date: '2026-11-13', anomalyCode: 'LATE_OVER_30', attendanceStatus: '異常' },
    { date: '2026-11-14', attendanceStatus: '正常' }
  ] });
  assert.match(viDetail, /Đi muộn trên 30 phút/);
  assert.match(viDetail, /Kết luận hệ thống<\/b>：Bất thường/);
  assert.match(viDetail, /Kết luận hệ thống<\/b>：Bình thường/);
  assert.equal(viDetail.includes('系統判定'), false);
  window.setLanguage('TH', false);
  const thDetail = window.p5a2AttendanceDetailHtml_({ days: [
    { date: '2026-11-12', anomalyCode: 'LATE', attendanceStatus: '正常' },
    { date: '2026-11-13', attendanceStatus: '異常' }
  ] });
  assert.match(thDetail, /｜มาสาย/);
  assert.match(thDetail, /ผลตัดสินของระบบ<\/b>：ปกติ/);
  assert.match(thDetail, /ผลตัดสินของระบบ<\/b>：ผิดปกติ/);
  assert.equal(thDetail.includes('系統判定'), false);
  window.setLanguage('ZH', false);
  assert.match(window.p5a2AttendanceDetailHtml_({ days: [{ date: '2026-11-12', attendanceStatus: '正常', expectedHours: 8, actualHours: 8 }] }), /系統判定<\/b>：正常/);

  const exempt = '<div class="fh-status-row"><span class="fh-status-label">今日狀態</span><span class="fh-status-pill">—</span></div>';
  window.eval('homeData = { employee: { id: "A09701", punchExempt: "Y", attendanceType: "EXEMPT" } }; attendanceCache = null;');
  home.innerHTML = exempt;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelector('.fh-status-pill').textContent, '免打卡');
  window.eval('homeData = { employee: { id: "A09701", punchExempt: "N", attendanceType: "EXTERNAL" } };');
  home.innerHTML = exempt;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelector('.fh-status-pill').textContent, '免打卡');
  window.__hf9NotificationSummary = null;
  window.__hf9NoticeListState = 'unknown';

  // P3: one line per affected range. (a2t is inlined by the backend, not the fixture.)
  if (typeof window.a2t !== 'function') window.a2t = (key) => key;
  const html = window.p5a2AttendanceWarningsHtml_({ month: '2026-11', days: [], coverageWarnings: [
    { firstAffectedDate: '2026-11-01', lastAffectedDate: '2026-11-17' },
    { firstAffectedDate: '2026-11-01', lastAffectedDate: '2026-11-17' },
    { firstAffectedDate: '2026-11-20', lastAffectedDate: '2026-11-21' }
  ] });
  assert.equal((html.match(/2026-11-01 ~ 2026-11-17/g) || []).length, 1);
  assert.equal((html.match(/2026-11-20 ~ 2026-11-21/g) || []).length, 1);

  // P3: the list (capped at 100 items) does not override the server count.
  const items = Array.from({ length: 100 }, (_, i) => ({ notificationId: 'N' + i, unread: true, isActionable: false }));
  window.eval('notificationCache = ' + JSON.stringify({ items: [], summary: { unread: 2, generalUnread: 2 } }));
  assert.equal(window.p5a1Rc2GeneralUnreadCount_(), 2);
  window.eval('notificationCache = ' + JSON.stringify({ items, summary: { unread: 2, generalUnread: 2, __hf9FromList: true } }));
  assert.equal(window.p5a1Rc2GeneralUnreadCount_(), 2);
  window.eval('notificationCache = ' + JSON.stringify({ items, summary: { unread: 130, generalUnread: 130, __hf9FromList: true } }));
  assert.equal(window.p5a1Rc2GeneralUnreadCount_(), 130);

  // P3: switching language on the login page redraws the header.
  if (typeof window.I18N === 'undefined') window.I18N = { ZH: {}, VI: {}, TH: {}, EN: {} };
  window.setLanguage('TH', false);
  assert.equal(doc.querySelector('.company-title').textContent, 'ABIS บริการพนักงาน');
  assert.equal(doc.querySelector('[data-home-i18n="tagline"]').textContent, 'ทำงานง่ายขึ้น · ทุกวันดีขึ้น');
  window.setLanguage('VI', false);
  assert.equal(doc.querySelector('.company-title').textContent, 'ABIS Dịch vụ nhân viên');
  window.setLanguage('ZH', false);
  assert.equal(doc.querySelector('.company-title').textContent, 'ABIS 員工服務');
  await new Promise((resolve) => setTimeout(resolve, 100));
  window.close();
});
