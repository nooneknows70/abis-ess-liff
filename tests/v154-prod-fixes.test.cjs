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
  const cases = { ZH: '打卡匯入批次', VI: 'đợt nhập dữ liệu chấm công', TH: 'ชุดนำเข้าข้อมูลลงเวลา' };
  for (const [lang, label] of Object.entries(cases)) {
    hf9Context.currentLang = lang;
    const out = ui.humanize('該日期已有有效 Punch Import Batch 或 device coverage pending、COVERAGE_PROOF、OVERTIME_FACT、Payroll');
    assert.ok(out.includes(label), lang + ': ' + out);
    assert.doesNotMatch(out, /Punch Import Batch|device coverage pending|COVERAGE_PROOF|OVERTIME_FACT|Payroll/, lang);
  }
  hf9Context.currentLang = 'EN';
  assert.match(ui.humanize('Punch Import Batch'), /Punch Import Batch/);
  hf9Context.currentLang = 'ZH';
  assert.match(ui.humanize('來源已失效｜原 Punch/Leave/排班'), /最新結果/);
});

test('P2-C: zh code after a CJK word has no gap (員工未打卡, not 員工 未打卡)', () => {
  hf9Context.currentLang = 'ZH';
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
  // a short plain zh note stays as written
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyCode: 'EARLY_LEAVE', anomalyDescription: '實際早退 298 分鐘' } }), '實際早退 298 分鐘');
  // vi never shows the zh-only note
  const vi = scc('VI');
  assert.equal(vi.anomalyText({ systemSnapshot: { anomalyCode: 'EARLY_LEAVE', anomalyDescription: '實際早退 298 分鐘' } }), 'Về sớm');
  // internal note and an unknown code: generic wording, never the raw text
  assert.equal(zh.anomalyText({ systemSnapshot: { anomalyCode: 'SOMETHING_NEW', anomalyDescription: INTERNAL_NOTE } }), zh.texts.ZH.anomalyGeneric);
  assert.equal(vi.anomalyText({ systemSnapshot: { anomalyDescription: INTERNAL_NOTE } }), vi.texts.VI.anomalyGeneric);
  // missing flags still work without code or note
  assert.equal(vi.anomalyText({ systemSnapshot: { missingOut: true } }), vi.texts.VI.typeMissingOut);
  assert.equal(zh.anomalyText({ systemSnapshot: {} }), '');
  // every code label exists in all four languages
  for (const [code, labels] of Object.entries(zh.anomalyLabels)) {
    for (const lang of ['ZH', 'VI', 'TH', 'EN']) assert.ok(labels[lang], code + ' ' + lang);
  }
});

test('P3: home title and Temporary PIN no longer mix languages', () => {
  assert.match(bundle, /viaWeb:'WEB 登入',dashboard:'總覽'/);
  assert.match(bundle, /dashboard:'Tổng quan'/);
  assert.match(bundle, /dashboard:'ภาพรวม'/);
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

  // P2-A: unknown today keeps "—"; known (bootstrap applied) shows 尚未打卡.
  const home = doc.getElementById('home');
  const row = '<div class="fh-status-row"><span class="fh-status-label">上班時間</span><span class="fh-status-value">—</span></div>';
  window.eval('attendanceCache = null; homeData = { employee: { id: "A1", shift: "OFFICE_DAY" } }');
  window.__hf9AttendanceLoading = false;
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelector('.fh-status-value').textContent, '—');
  window.__hf9AttendanceLoading = true;
  home.innerHTML = row;
  window.__hf9RefreshHomeClock(home);
  assert.ok(home.querySelector('.hf9-skel'), 'loading keeps the skeleton');
  window.__hf9AttendanceLoading = false;
  window.eval('homeData.__perf3 = true');
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelector('.fh-status-value').textContent, '尚未打卡');

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
