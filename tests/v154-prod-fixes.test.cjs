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

test('P2-A: OFFICE_DAY reads as the SHIFT_RULE master name in zh', () => {
  hf9Context.currentLang = 'ZH';
  assert.equal(ui.humanize('OFFICE_DAY'), '辦公室固定日班');
  assert.equal(ui.shiftLabel({ shiftCode: 'OFFICE_DAY', shiftName: 'OFFICE_DAY' }), '辦公室固定日班');
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
  assert.equal(ui.authoritativeShiftName({ shiftCode: 'OFFICE_DAY', shiftName: 'OFFICE_DAY' }), '');
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

  window.__hf9NotificationSummary = null;
  window.eval('notificationCache = null');
  const loadingNotices = window.fhNoticesHtml_(2);
  assert.equal(loadingNotices.includes('目前沒有新通知'), false);
  assert.match(loadingNotices, /載入中|hf9-skel/);

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
