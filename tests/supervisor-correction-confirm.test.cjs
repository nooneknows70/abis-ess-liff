'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const sourcePath = path.resolve(
  __dirname,
  '../assets/ess-20261118-supervisor-correction-confirm/supervisor-correction-confirm.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');

function load() {
  const context = { console, document: undefined };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'supervisor-correction-confirm.js' });
  return context.ABIS_SUPERVISOR_CORRECTION_CONFIRM;
}

const ui = load();
const fixture = ui.fixtureB09502();
const cards = fixture.managerCorrections;

test('B09502 fixture is four days with one leave reason and one rest-day reason', () => {
  assert.equal(cards.length, 4);
  assert.equal(JSON.stringify(cards.map((row) => row.date)), JSON.stringify([
    '2026-10-14', '2026-11-01', '2026-11-02', '2026-11-03'
  ]));
  assert.equal(cards.every((row) => row.employeeId === 'B09502' && row.employeeName === '潘淑華'), true);
  assert.equal(ui.analyzeReason(cards[2].reason).leave, true);
  assert.equal(ui.analyzeReason(cards[3].reason).restDay, true);
});

test('leave hint needs both a leave type and hours', () => {
  assert.equal(ui.analyzeReason('請特休 8 小時').warning, true);
  assert.equal(ui.analyzeReason('請事假4小時').leaveType, '事假');
  assert.equal(ui.analyzeReason('請病假 8HR').hours, '8');
  assert.equal(ui.analyzeReason('請特休，時數還沒算').warning, false);
  assert.equal(ui.analyzeReason('忘記打下班卡').warning, false);
});

test('suggestion merges the punch with the requested time and keeps the scheduled shift', () => {
  const first = ui.buildSuggestion(cards[0]);
  assert.equal(first.firstIn, '2026-10-14 08:03');
  assert.equal(first.lastOut, '2026-10-14 17:10');
  assert.equal(first.shiftCode, 'D1');
  assert.equal(first.payrollImpact, 'N');
  const second = ui.buildSuggestion(cards[1]);
  assert.equal(second.firstIn, '2026-11-01 08:00');
  assert.equal(second.lastOut, '2026-11-01 17:05');
});

test('client merge still prefers the request, then the punch, when suggestion is absent', () => {
  const row = Object.assign({}, cards[0], { suggestion: undefined });
  const sug = ui.buildSuggestion(row);
  assert.equal(sug.firstIn, '2026-10-14 08:03');
  assert.equal(sug.lastOut, '2026-10-14 17:10');
  assert.equal(sug.shiftCode, 'D1');
});

test('missing punch context is omitted instead of breaking', () => {
  const row = {
    correctionRequestId: 'ACR-BARE',
    employeeId: 'B09502',
    employeeName: '潘淑華',
    date: '2026-11-04',
    requestType: 'MISSING_OUT',
    reason: '忘記打卡',
    requestedLastOut: '2026-11-04 17:00'
  };
  assert.equal(ui.rawPunchLines(row), null);
  assert.equal(ui.scheduleText(row), '');
  assert.equal(ui.anomalyText(row), '');
  const html = ui.cardHtml(row, {});
  assert.match(html, /忘記打卡/);
  assert.doesNotMatch(html, /原始打卡/);
  assert.doesNotMatch(html, /排班/);
  assert.equal(ui.buildSuggestion(row).payrollImpact, 'N');
  assert.equal(ui.buildSuggestion(row).payrollSource, 'fallback');
  assert.match(ui.cardHtml(row, {}), /預設：不影響（系統無建議）/);
  assert.doesNotMatch(ui.cardHtml(cards[0], {}), /預設：/);
  assert.doesNotMatch(ui.suggestionSentence(cards[0]), /預設：/);
  assert.match(ui.texts.EN.payDefault, /Default: no payroll impact/);
  assert.match(ui.texts.VI.payDefault, /Mặc định/);
  assert.match(ui.texts.TH.payDefault, /ค่าเริ่มต้น/);
  const stored = Object.assign({}, row, { payrollImpact: 'Y' });
  assert.equal(ui.buildSuggestion(stored).payrollSource, 'stored');
  assert.equal(ui.buildSuggestion(stored).payrollImpact, 'Y');
  assert.doesNotMatch(ui.cardHtml(stored, {}), /預設：|Default:|Mặc định|ค่าเริ่มต้น/);
});

test('raw punches render as text and are not inputs', () => {
  const html = ui.cardHtml(cards[0], {});
  assert.match(html, /原始打卡/);
  assert.match(html, /上班 08:03<br>下班 未打卡/);
  assert.match(html, /不能改/);
  assert.doesNotMatch(html, /data-scc-punch/);
});

test('grouped page names the person once and offers batch only for cards without warnings', () => {
  const html = ui.renderManagerHtml(fixture, {});
  assert.equal((html.match(/潘淑華 · B09502/g) || []).length, 1);
  assert.equal((html.match(/data-scc-id=/g) || []).length, 4);
  assert.match(html, /全部同意（2）/);
  assert.equal(JSON.stringify(ui.batchIds(cards, null)), JSON.stringify(['ACR-B09502-1014', 'ACR-B09502-1101']));
  const picked = { 'ACR-B09502-1014': true, 'ACR-B09502-1102': true };
  assert.equal(JSON.stringify(ui.batchIds(cards, picked)), JSON.stringify(['ACR-B09502-1014']));
});

test('a single card does not add a batch step', () => {
  const html = ui.renderManagerHtml({
    shiftOptions: fixture.shiftOptions,
    managerCorrections: [cards[0]]
  }, {});
  assert.match(html, /同意/);
  assert.doesNotMatch(html, /全部同意/);
  assert.doesNotMatch(html, /data-scc-pick/);
  assert.match(ui.cardHtml(cards[0], {}), /class="scc-form" hidden/);
  assert.match(ui.styles(), /\[hidden\]\{display:none !important\}/);
});

test('agree and return use the existing per-item action, one call at a time', async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const seen = [];
  const result = await ui.approveSequential(cards, {
    sessionToken: 'sess',
    nextRequestId: (action) => action + '-' + (seen.length + 1),
    async call(name, payload) {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      seen.push({ name, payload });
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
    }
  });
  assert.equal(result.maxInFlight, 1);
  assert.equal(maxInFlight, 1);
  assert.equal(seen.length, 2);
  assert.deepEqual(seen.map((item) => item.payload.correctionRequestId), [
    'ACR-B09502-1014', 'ACR-B09502-1101'
  ]);
  assert.equal(seen.every((item) => item.name === 'attendanceCorrectionManagerAction'), true);
  assert.equal(seen.every((item) => item.payload.action === 'APPROVE'), true);
  assert.deepEqual(seen.map((item) => item.payload.requestId), ['APPROVE-1', 'APPROVE-2']);
  assert.equal(seen[0].payload.firstIn, '2026-10-14T08:03');
  assert.equal(seen[0].payload.payrollImpact, 'N');
  assert.doesNotMatch(source, /homeBootstrap\s*\(/);
  assert.doesNotMatch(source, /['"]homeBootstrap['"]/);
});

test('return requires a reason and the leave action prefills one', () => {
  assert.match(ui.validateReject(''), /退回要寫原因/);
  assert.equal(ui.validateReject('請改申請假單'), '');
  const payload = ui.buildPayload(cards[2], 'REJECT', ui.buildSuggestion(cards[2]), ui.leaveReturnNote(cards[2].reason), {
    nextRequestId: () => 'REJECT-1'
  });
  assert.equal(payload.action, 'REJECT');
  assert.match(payload.note, /請特休 8 小時/);
  assert.match(payload.note, /假單/);
  assert.match(payload.note, /ABIS:LEAVE_REQUEST/);
  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'payrollImpact'), false);
  const html = ui.cardHtml(cards[2], { openReturn: true, returnNote: payload.note });
  assert.match(html, /退回並請員工改申請假單/);
  assert.match(html, /請特休 8 小時/);
  assert.match(html, /請改申請假單/);
});

test('rest-day hint is guidance and stays out of batch agree', () => {
  const html = ui.cardHtml(cards[3], {});
  assert.match(html, /先對一下當天班表/);
  assert.doesNotMatch(html, /data-scc-pick/);
  assert.equal(ui.batchIds([cards[3]], null).length, 0);
});

test('install waits for the existing inbox renderer and does not claim a release', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'supervisor-correction-confirm.js' });
  assert.equal(context.ABIS_SUPERVISOR_CORRECTION_CONFIRM.install(), false);
  context.p5a2rc1CorrectionCard_ = function () { return '<div class="hr">hr</div>'; };
  context.p5a2rc1AttendanceInboxHtml_ = function (attendance) {
    return '<div class="att-work-section"><div class="hr-count">' + attendance.hrCorrections.length + '</div></div>';
  };
  assert.equal(context.ABIS_SUPERVISOR_CORRECTION_CONFIRM.install(), true);
  const html = context.p5a2rc1AttendanceInboxHtml_({
    managerCorrections: [cards[0]],
    hrCorrections: [{ correctionRequestId: 'HR-1' }],
    shiftOptions: fixture.shiftOptions
  });
  assert.match(html, /主管出勤補正確認/);
  assert.match(html, /10\/14/);
  assert.match(html, /hr-count">1/);
  assert.doesNotMatch(source, /releaseSet|PROD_CURRENT/);
});

test('tap targets for return, edit, leave action, and the checkbox are 48px', () => {
  const css = ui.styles();
  assert.match(css, /\.scc-edit,\.scc-quiet,\.scc-return,\.scc-return-send\{[^}]*min-height:48px/);
  assert.match(css, /\.scc-check input\{[^}]*width:48px;height:48px/);
  assert.match(css, /\.scc-check\{[^}]*min-height:48px;min-width:48px/);
  assert.doesNotMatch(css, /width:22px|min-height:44px/);
});

test('vi and th copy cover every zh string', () => {
  const keys = Object.keys(ui.texts.ZH);
  ['VI', 'TH', 'EN'].forEach((lang) => {
    keys.forEach((key) => {
      assert.equal(typeof ui.texts[lang][key], 'string', lang + '.' + key);
      assert.ok(ui.texts[lang][key].length > 0, lang + '.' + key);
    });
    assert.equal(Object.keys(ui.texts[lang]).length, keys.length);
  });
});

test('vietnamese cards use vi labels', () => {
  const context = { console, document: undefined, currentLang: 'VI' };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'supervisor-correction-confirm.js' });
  const html = context.ABIS_SUPERVISOR_CORRECTION_CONFIRM.cardHtml(cards[2], { openReturn: true, returnNote: 'x' });
  assert.match(html, /Đồng ý/);
  assert.match(html, /Sửa/);
  assert.match(html, /Trả lại và bảo nhân viên xin phép/);
  assert.doesNotMatch(html, />同意</);
});

test('missing backend fields cannot be one-tap or batch agreed', () => {
  const row = ui.fixtureMissingFields().managerCorrections[0];
  assert.equal(ui.missingFields(row), true);
  assert.equal(ui.missingFields(cards[0]), false);
  assert.match(ui.suggestionSentence(row), /未填/);
  assert.equal(ui.cardFlags(row).warning, true);
  assert.equal(JSON.stringify(ui.batchIds([row, cards[0]], null)), JSON.stringify(['ACR-B09502-1014']));
  const html = ui.renderManagerHtml(ui.fixtureMissingFields(), {});
  assert.match(html, /這筆還缺欄位/);
  assert.match(html, /data-scc-agree="ACR-B09502-MISSING" disabled/);
  assert.doesNotMatch(html, /data-scc-pick="ACR-B09502-MISSING"/);
  assert.match(html, /全部同意（1）/);
  assert.equal(ui.agreeBlock(row, { querySelector: () => ({ hidden: true }) }), 'SCC_CONFIRM_FIELDS');
  assert.equal(ui.agreeBlock(row, { querySelector: (sel) => sel === '.scc-form' ? { hidden: false } : null }), 'SCC_FIELDS_INCOMPLETE');
  assert.equal(ui.agreeBlock(cards[0], null), '');
});

test('screen errors show a code and keep the raw message off the page', () => {
  const err = new Error('ScriptLock timeout raw detail');
  err.code = 'LOCK_CONTENTION';
  const coded = ui.publicError(err, 'SCC_AGREE_FAILED');
  assert.match(coded, /LOCK_CONTENTION/);
  assert.match(coded, /沒有送出/);
  assert.doesNotMatch(coded, /ScriptLock|raw detail/);
  const bare = ui.publicError(new Error('secret detail'), 'SCC_REJECT_FAILED');
  assert.match(bare, /SCC_REJECT_FAILED/);
  assert.doesNotMatch(bare, /secret/);
  assert.doesNotMatch(source, /err\.message/);
  const fields = ui.publicError(null, 'SCC_FIELDS_INCOMPLETE');
  assert.match(fields, /SCC_FIELDS_INCOMPLETE/);
  assert.match(fields, /修改/);
  assert.doesNotMatch(fields, /請稍後再試/);
  const confirm = ui.publicError(null, 'SCC_CONFIRM_FIELDS');
  assert.doesNotMatch(confirm, /請稍後再試/);
});

test('anomaly fallback is translated and a different requested shift is only displayed', () => {
  const context = { console, document: undefined, currentLang: 'VI' };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'supervisor-correction-confirm.js' });
  const vi = context.ABIS_SUPERVISOR_CORRECTION_CONFIRM;
  const snap = { missingOut: true, missingIn: false };
  assert.equal(vi.anomalyText({ systemSnapshot: snap }), vi.texts.VI.typeMissingOut);
  assert.notEqual(vi.anomalyText({ systemSnapshot: snap }), '缺下班卡');
  const different = Object.assign({}, cards[0], { requestedShiftCode: 'N1' });
  assert.equal(ui.cardFlags(different).warning, false);
  assert.equal(ui.missingFields(different), false);
  const html = ui.cardHtml(different, {});
  assert.match(html, /夜班/);
  assert.doesNotMatch(html, /data-scc-warn="1"/);
});
