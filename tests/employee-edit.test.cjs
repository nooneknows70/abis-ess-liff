'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const sourcePath = path.resolve(
  __dirname,
  '../assets/ess-20261119-employee-edit/employee-edit.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');

function load(extra) {
  const context = Object.assign({
    console: {
      log: function () { throw new Error('console'); },
      info: function () { throw new Error('console'); },
      debug: function () { throw new Error('console'); },
      warn: function () { throw new Error('console'); },
      error: function () { throw new Error('console'); }
    }
  }, extra || {});
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'employee-edit.js' });
  return context;
}

function ui(extra) {
  return load(extra).ABIS_EMPLOYEE_EDIT;
}

const PIN = '482913';

function filledForm(over) {
  const api = ui();
  return api.suggestDefaults(Object.assign({
    idLetter: 'B',
    'V2員工ID': 'B11513',
    '姓名': '王小明',
    '人員類別': '廠務',
    '到職日': '2026-12-01',
    '部門': '廠務部',
    '工作地點': '新店廠',
    '直屬主管ID': 'A00001',
    '正式班別': '日班',
    '打卡號': '31511'
  }, over || {}));
}

test('install is a no-op unless the mode is on and the user is HR or ADMIN', async () => {
  const page = ui();
  assert.equal(page.canInstall({ permission: 'HR', mode: 'OFF' }), false);
  assert.equal(page.canInstall({ permission: 'HR', mode: 'off' }), false);
  assert.equal(page.canInstall({ permission: 'HR', mode: '' }), false);
  assert.equal(page.canInstall({ permission: 'HR', mode: 'NOPE' }), false);
  assert.equal(page.canInstall({ permission: '', mode: 'LIVE' }), false);
  assert.equal(page.canInstall({ permission: 'MANAGER', mode: 'LIVE' }), false);
  assert.equal(page.canInstall({ permission: 'HR', mode: 'LIVE' }), true);
  assert.equal(page.canInstall({ permission: 'admin', mode: 'SHADOW' }), true);

  const blocked = [];
  assert.equal(await page.install({
    permission: 'EMPLOYEE',
    call: async function (action) { blocked.push(action); return { ok: true, mode: 'LIVE' }; }
  }), false);
  assert.deepEqual(blocked, []);

  const off = [];
  assert.equal(await page.install({
    permission: 'HR',
    call: async function (action) { off.push(action); return { ok: false, code: 'FEATURE_OFF' }; }
  }), false);
  assert.deepEqual(off, ['hrEmployeeValidate']);
  assert.equal(page.snapshot().active, false);

  const ctx = load({
    rc2AccountPanelHtml_: function (panel) { return 'old:' + panel; }
  });
  const hooked = ctx.ABIS_EMPLOYEE_EDIT;
  assert.equal(await hooked.install({ permission: 'HR', mode: 'OFF' }), false);
  assert.equal(ctx.rc2AccountPanelHtml_('employeeManagement'), 'old:employeeManagement');
  assert.equal(await hooked.install({ permission: 'ADMIN', mode: 'LIVE' }), true);
  assert.match(ctx.rc2AccountPanelHtml_('employeeManagement'), /新增員工/);
  assert.match(ctx.rc2AccountPanelHtml_('employeeManagement'), /data-ee-screen="list"/);
  assert.equal(ctx.rc2AccountPanelHtml_('language'), 'old:language');
  assert.doesNotMatch(source, /prodCurrentReleaseSet|ABIS_ESS_RELEASE_MANIFEST|hrEmployeeEditDetail|hrEmployeeEditOptions|hrSetPreferredLanguage|待報到/);
});

test('a failed options probe does not install', async () => {
  const page = ui();
  assert.equal(await page.install({
    permission: 'HR',
    call: async function () { throw new Error('FEATURE_OFF'); }
  }), false);
  assert.equal(page.snapshot().active, false);
});

test('360px layout uses one column, 48px targets, and a blue primary', () => {
  const page = ui();
  const css = page.styles();
  assert.match(css, /@media \(max-width:767px\)/);
  assert.match(css, /width:100%/);
  assert.match(css, /padding:12px 16px/);
  assert.match(css, /min-height:48px !important/);
  assert.match(css, /\.ee-primary\{[^}]*background:#1565C0/);
  assert.match(css, /min-width:0/);
  assert.match(css, /max-width:100%/);
  assert.match(css, /flex-wrap:wrap/);
  assert.match(css, /@media \(max-width:360px\)/);
  assert.match(css, /font-size:clamp\(16px,4\.8vw,22px\)/);
  assert.match(css, /\.ee-pin\{[^}]*white-space:nowrap/);
  assert.match(css, /@media \(min-width:768px\)/);
  assert.match(css, /grid-template-columns:minmax\(280px,380px\)/);
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis/);
  const html = page.renderScreen('list', {
    rows: [{ employeeId: 'B11401', name: 'Nguyễn Thị Minh Châu', department: '廠務部', location: '新店廠', employmentStatus: '在職' }],
    chip: 'all',
    limit: 20
  });
  assert.match(html, /Nguyễn Thị Minh Châu/);
  assert.match(html, /data-ee-screen="list"/);
  assert.equal((html.match(/ee-primary/g) || []).length, 1);
  assert.doesNotMatch(html, /<table/);
  assert.match(html, /＋ 新增員工/);
});

test('names are not clipped and technical codes stay off the screen', () => {
  const page = ui();
  const detail = page.renderScreen('detail', {
    employeeId: 'B11401',
    fields: {
      '姓名': '范氏金香花',
      'V2員工ID': 'B11401',
      '在職狀態': '在職',
      '到職日': '2026-11-01',
      '登入帳號狀態': 'TEMP_PIN_REQUIRED',
      '部門': '廠務部'
    },
    audit: [{
      field: '姓名',
      before: '范氏',
      after: '范氏金香花',
      reason: '更正',
      RequestID: 'REQ-SECRET',
      BeforeStateHash: 'abc123hash',
      at: '2026-11-19T01:00:00.000Z'
    }, {
      field: 'PINHash',
      before: 'hidden-hash',
      after: 'hidden-hash-2'
    }, {
      field: '手機',
      before: '0912000111',
      after: '0912000222',
      reason: '更新'
    }],
    rows: []
  });
  assert.match(detail, /范氏金香花/);
  assert.match(detail, /尚未完成首次登入/);
  assert.doesNotMatch(detail, /TEMP_PIN_REQUIRED|PINHash|hidden-hash|REQ-SECRET|abc123hash|0912000111|0912000222/);
  assert.match(detail, /已變更…222/);
  assert.equal(page.publicError({ ok: false, code: 'ROW_VERSION_MISMATCH', errors: [{ code: 'ROW_VERSION_MISMATCH', message: PIN }] }), '資料已被他人更新，請重新載入');
  assert.doesNotMatch(page.publicError({ ok: false, code: 'SYSTEM_BUSY' }), /SYSTEM_BUSY/);
  assert.equal(page.publicError({ ok: false, code: 'CONFIRM_TOKEN_MISMATCH', message: 'CONFIRM_TOKEN_MISMATCH' }), '差異確認已過期，請重新檢視變更');
  assert.equal(page.publicError({ ok: false, code: 'HR_CONFIRM_REQUIRED' }), '此員工已有出勤、特休或薪資資料，請再確認到職日');
  assert.equal(page.publicError({ ok: false, code: 'FEATURE_OFF' }), '此功能尚未開放');
  assert.doesNotMatch(page.publicError({ ok: false, code: 'CONFIRM_TOKEN_REQUIRED', messageKey: 'employeeEdit.CONFIRM_TOKEN_REQUIRED' }), /CONFIRM_TOKEN|employeeEdit/);
  const audit = page.renderScreen('audit', {
    rows: [{ time: '2026-11-19 13:20', actorId: 'A00001', action: 'EMPLOYEE_FIELD_CHANGE', field: '姓名', before: '王', after: '王小明', reason: '更正' }]
  });
  assert.match(audit, /變更欄位/);
  assert.match(audit, /王小明/);
  assert.doesNotMatch(audit, /EMPLOYEE_FIELD_CHANGE/);
});

test('nobody can edit their own sign-off permission', () => {
  const page = ui();
  const selfHtml = page.renderScreen('edit', {
    actorId: 'a11511',
    employeeId: 'A11511',
    form: { '簽核權限': 'HR', '姓名': '范氏金香花' },
    baseline: { '簽核權限': 'HR', '姓名': '范氏金香花' },
    rows: []
  });
  assert.match(selfHtml, /不能修改自己的簽核權限/);
  assert.match(selfHtml, /data-ee-field="簽核權限"[^>]*disabled/);
  const other = page.renderScreen('edit', {
    actorId: 'A11511',
    employeeId: 'B11401',
    permission: 'HR',
    form: { '簽核權限': 'NONE', '姓名': '王小明' },
    baseline: { '簽核權限': 'NONE', '姓名': '王小明' },
    rows: []
  });
  assert.doesNotMatch(other, /data-ee-field="簽核權限"[^>]*disabled/);
  assert.match(other, /人資/);
  assert.match(other, /管理者/);
  const admin = page.renderScreen('edit', {
    actorId: 'A00001',
    employeeId: 'B11401',
    permission: 'ADMIN',
    form: { '簽核權限': 'NONE' },
    baseline: { '簽核權限': 'NONE' },
    rows: []
  });
  assert.match(admin, /無簽核權限/);
  assert.match(admin, /可簽核/);
  const changes = page.buildChanges(
    { '簽核權限': 'HR', '姓名': '范氏金香花' },
    { '簽核權限': 'ADMIN', '姓名': '王小明' },
    { actorId: 'A11511', employeeId: 'A11511', mode: 'UPDATE' }
  );
  assert.equal(changes['簽核權限'], undefined);
  assert.equal(changes['姓名'], '王小明');
  const otherChanges = page.buildChanges(
    { '簽核權限': 'NONE' },
    { '簽核權限': 'HR' },
    { actorId: 'A11511', employeeId: 'B11401', mode: 'UPDATE' }
  );
  assert.equal(otherChanges['簽核權限'], 'HR');
});

test('edit review shows the diff, requires a reason, and keeps the same request when busy', async () => {
  const page = ui();
  const preview = page.renderScreen('diff', {
    name: '王小明',
    employeeId: 'B11401',
    baseline: { '部門': '廠務部', '到職日': '2026-11-09' },
    changes: { '部門': '業務部', '到職日': '2026-11-10' },
    diff: [
      { field: '部門', before: '廠務部', after: '業務部' },
      { field: '到職日', before: '2026-11-09', after: '2026-11-10' }
    ],
    reason: { code: '', note: '' },
    warnings: [page.t('downstreamNote')]
  });
  assert.match(preview, /變更前/);
  assert.match(preview, /變更後/);
  assert.match(preview, /業務部/);
  assert.match(preview, /到職日當天不計遲到、缺卡/);
  assert.match(preview, /data-ee-action="save"[^>]*disabled/);
  assert.doesNotMatch(preview, /<table/);
  const ready = page.renderScreen('diff', {
    name: '王小明',
    employeeId: 'B11401',
    changes: { '部門': '業務部' },
    diff: [{ field: '部門', before: '廠務部', after: '業務部' }],
    reason: { code: 'CORRECTION', note: '' }
  });
  assert.doesNotMatch(ready, /data-ee-action="save"[^>]*disabled/);

  page.reset({
    mode: 'LIVE',
    actorId: 'A00001',
    employeeId: 'B11401',
    rowVersion: 'version-1',
    baseline: { '姓名': '王', 'PreferredLanguage': 'zh-TW', '簽核權限': 'NONE' },
    form: { '姓名': '王小明', 'PreferredLanguage': 'vi-VN', '簽核權限': 'NONE' },
    reason: { code: 'CORRECTION', note: '' },
    screen: 'diff'
  });
  const seen = [];
  let writes = 0;
  function respond(name, payload) {
    seen.push({ name: name, payload: payload });
    if (name === 'hrEmployeeValidate') {
      return { ok: true, confirmToken: 'tok-1', rowVersion: 'version-1', mode: 'LIVE', diff: [{ field: '姓名', before: '王', after: '王小明' }] };
    }
    writes += 1;
    if (writes === 1) return { ok: false, code: 'SYSTEM_BUSY' };
    return { ok: true, rowVersion: 'version-2' };
  }
  const first = await page.submitUpdate({ sessionToken: 'sess', call: respond });
  assert.equal(first.ok, false);
  assert.match(page.renderCurrent(), /系統忙碌，請稍後再試/);
  assert.doesNotMatch(page.renderCurrent(), /SYSTEM_BUSY/);
  const requestId = page.snapshot().requestId;
  assert.match(requestId, /^EE-/);
  const second = await page.submitUpdate({ sessionToken: 'sess', call: respond });
  assert.equal(second.ok, true);
  const updates = seen.filter(function (item) { return item.name === 'hrEmployeeUpdate'; });
  assert.equal(updates.length, 2);
  assert.equal(updates[0].payload.requestId, requestId);
  assert.equal(updates[1].payload.requestId, requestId);
  assert.equal(updates[1].payload.confirmToken, 'tok-1');
  assert.equal(updates[1].payload.expectedRowVersion, 'version-1');
  assert.equal(updates[1].payload.changes['姓名'], '王小明');
  assert.equal(updates[1].payload.changes.PreferredLanguage, 'vi-VN');
  assert.equal(seen.some(function (item) { return item.name === 'hrSetPreferredLanguage'; }), false);
});

test('language edits travel in the same employee update', async () => {
  const page = ui();
  page.reset({
    actorId: 'A00001',
    employeeId: 'B11401',
    rowVersion: 'version-9',
    baseline: { '姓名': '王', PreferredLanguage: 'zh-TW' },
    form: { '姓名': '王', PreferredLanguage: 'vi-VN' },
    reason: { code: 'CORRECTION', note: '' },
    screen: 'edit'
  });
  const seen = [];
  const result = await page.submitUpdate({
    sessionToken: 'sess',
    call: async function (name, payload) {
      seen.push({ name: name, payload: payload });
      if (name === 'hrEmployeeValidate') {
        return { ok: true, confirmToken: 'lang-tok', rowVersion: 'version-9', mode: 'LIVE', diff: [{ field: 'PreferredLanguage', before: 'zh-TW', after: 'vi-VN' }] };
      }
      return { ok: true, rowVersion: 'version-10' };
    }
  });
  assert.equal(result.ok, true);
  assert.deepEqual(seen.map(function (item) { return item.name; }), ['hrEmployeeValidate', 'hrEmployeeUpdate']);
  assert.equal(seen[1].payload.changes.PreferredLanguage, 'vi-VN');
  assert.equal(seen[1].payload.confirmToken, 'lang-tok');
  assert.equal(seen[1].payload.reason.code, 'CORRECTION');
  assert.equal(Object.prototype.hasOwnProperty.call(seen[1].payload, 'expectedRowVersion'), true);
});

test('create sends the master fields and shows the one-time PIN from google.script.run', async () => {
  const seen = [];
  const runner = {
    withSuccessHandler: function (fn) { this._ok = fn; return this; },
    withFailureHandler: function () { return this; },
    api: function (action, payload) {
      seen.push({ action: action, payload: payload });
      if (action === 'hrEmployeeValidate') {
        this._ok({
          ok: true,
          writesPerformed: 0,
          mode: 'LIVE',
          confirmToken: 'create-tok',
          rowVersion: '',
          diff: [{ field: '姓名', label: { ZH: '姓名', VI: 'Họ tên', TH: 'ชื่อ', EN: 'Name' }, before: '', after: '王小明' }],
          fields: [{ field: '簽核權限', editable: true, needsReason: true, confirm: true, readOnlyReason: '' }]
        });
        return;
      }
      this._ok({
        ok: true,
        employeeId: 'B11513',
        writesPerformed: 2,
        credential: {
          created: true,
          state: 'TEMP_PIN_REQUIRED',
          tempPin: PIN,
          tempPinEventId: 'TPIN-9F2C41A7B3D0',
          expiresAt: '2026-11-26T05:20:00.000Z',
          expiresDays: 7,
          deliveryStatus: 'HR_ONE_TIME_DISPLAY',
          displayOnce: true
        }
      });
    }
  };
  const ctx = load();
  ctx.google = { script: { run: runner } };
  ctx.sessionToken = 'sess';
  const page = ctx.ABIS_EMPLOYEE_EDIT;
  page.reset({
    mode: 'LIVE',
    screen: 'add',
    punchConfirmed: true,
    form: filledForm()
  });
  const created = await page.submitCreate();
  assert.equal(created.ok, true);
  assert.equal(seen[0].action, 'hrEmployeeValidate');
  assert.equal(seen[1].action, 'hrEmployeeCreate');
  assert.equal(seen[1].payload.sessionToken, 'sess');
  assert.equal(seen[1].payload.employeeId, 'B11513');
  assert.equal(seen[1].payload.confirmToken, 'create-tok');
  assert.equal(seen[1].payload.reason.code, 'NEW_HIRE');
  assert.equal(seen[1].payload.changes['姓名'], '王小明');
  assert.equal(seen[1].payload.changes.PreferredLanguage, 'zh-TW');
  assert.equal(seen[1].payload.changes.tempPin, undefined);
  assert.equal(seen[1].payload.changes.PINHash, undefined);
  assert.equal(seen[1].payload.changes['在職狀態'], undefined);
  assert.equal(seen[1].payload.changes['HR確認'], undefined);
  assert.equal(page.pinValue(), PIN);
  const html = page.renderCurrent();
  assert.match(html, /4 8 2 9 1 3/);
  assert.match(html, /已抄寫/);
  assert.match(html, /2026-11-26 13:20/);
  assert.match(html, /臨時 PIN（只顯示一次）/);
  assert.equal((html.match(/class="ee-primary"/g) || []).length, 1);
  assert.doesNotMatch(html, /TEMP_PIN_REQUIRED|複製|clipboard|HR_ONE_TIME_DISPLAY/);
  assert.equal(JSON.stringify(page.snapshot()).indexOf(PIN), -1);
  assert.match(source, /google\.script\.run/);
  assert.match(source, /\.api\(action, payload \|\| \{\}\)/);
});

test('已抄寫 acknowledges delivery, then the PIN is gone', async () => {
  const page = ui();
  const calls = [];
  page.reset({ mode: 'LIVE', screen: 'add', punchConfirmed: true, form: filledForm() });
  await page.submitCreate({
    sessionToken: 'sess',
    call: async function (name) {
      if (name === 'hrEmployeeValidate') return { ok: true, confirmToken: 'create-tok', mode: 'LIVE', diff: [] };
      return {
        ok: true,
        employeeId: 'B11513',
        writesPerformed: 2,
        credential: {
          tempPin: PIN,
          tempPinEventId: 'TPIN-9F2C41A7B3D0',
          expiresAt: '2026-11-26T05:20:00.000Z',
          displayOnce: true
        }
      };
    }
  });
  assert.match(page.renderCurrent(), new RegExp(PIN.split('').join(' ')));
  const result = await page.confirmWritten({
    sessionToken: 'sess',
    call: async function (name, payload) {
      calls.push({ name: name, payload: payload });
      return { ok: true };
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.cleared, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'hrAcknowledgeTemporaryPinDelivery');
  assert.equal(calls[0].payload.employeeId, 'B11513');
  assert.equal(calls[0].payload.tempPinEventId, 'TPIN-9F2C41A7B3D0');
  assert.equal(calls[0].payload.sessionToken, 'sess');
  assert.equal(Object.prototype.hasOwnProperty.call(calls[0].payload, 'tempPin'), false);
  assert.equal(JSON.stringify(calls[0].payload).indexOf(PIN), -1);
  assert.equal(page.pinValue(), '');
  const after = page.renderCurrent();
  assert.doesNotMatch(after, new RegExp(PIN));
  assert.doesNotMatch(after, /4 8 2 9 1 3/);
  assert.equal(page.snapshot().screen === 'pin', false);
});

test('a failed acknowledgement still clears the PIN and never shows it again', async () => {
  const page = ui();
  page.holdPin(PIN, { employeeId: 'B11513', tempPinEventId: 'TPIN-9F2C41A7B3D0' });
  page.reset({
    mode: 'LIVE',
    screen: 'pin',
    employeeId: 'B11513',
    created: { name: '王小明', employeeId: 'B11513', hireDate: '2026-12-01', punch: '31511' }
  });
  page.holdPin(PIN, { employeeId: 'B11513', tempPinEventId: 'TPIN-9F2C41A7B3D0' });
  const leaked = new Error('transport ' + PIN);
  const calls = [];
  const result = await page.confirmWritten({
    sessionToken: 'sess',
    call: async function (name, payload) {
      calls.push({ name: name, payload: payload });
      throw leaked;
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.cleared, true);
  assert.equal(page.pinValue(), '');
  const html = page.renderCurrent();
  assert.match(html, /已關閉。這筆記錄沒有更新，請到帳號管理確認，或稍後再試。/);
  assert.match(html, /再試一次/);
  assert.doesNotMatch(html, new RegExp(PIN));
  assert.doesNotMatch(html, /4 8 2 9 1 3/);
  assert.doesNotMatch(html, /transport|TPIN-|SCHEMA|FEATURE_OFF/);
  const again = await page.confirmWritten({
    sessionToken: 'sess',
    call: async function (name, payload) {
      calls.push({ name: name, payload: payload });
      return { ok: false, code: 'SYSTEM_BUSY', message: PIN };
    }
  });
  assert.equal(again.ok, false);
  assert.equal(page.pinValue(), '');
  assert.doesNotMatch(page.renderCurrent(), new RegExp(PIN));
  assert.equal(calls[1].payload.employeeId, 'B11513');
  assert.equal(JSON.stringify(calls[1].payload).indexOf(PIN), -1);
  assert.equal(page.snapshot().screen, 'ack-hint');
});

test('leaving the PIN screen uses an in-app dialog and does not call confirm or alert', () => {
  const page = ui();
  page.holdPin(PIN, { employeeId: 'B11513', tempPinEventId: 'TPIN-1' });
  const guard = page.requestClosePin();
  assert.equal(guard.blocked, true);
  const html = page.renderCurrent();
  assert.match(html, /role="dialog"/);
  assert.match(html, /PIN 關閉後無法再查看，確定已抄寫嗎？/);
  assert.match(html, /回去抄寫/);
  assert.match(html, /我已抄寫，關閉/);
  assert.match(html, /data-ee-action="written-close"/);
  assert.doesNotMatch(source, /(?<![.\w])confirm\s*\(/);
  assert.doesNotMatch(source, /(?<![.\w])alert\s*\(/);
  assert.doesNotMatch(html, /複製/);
  assert.equal(page.pinValue(), PIN);
});

test('the PIN is not written to storage or the console', async () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|indexedDB/);
  assert.doesNotMatch(source, /console\.(log|info|debug|warn|error)/);
  assert.doesNotMatch(source, /clipboard|execCommand|writeText/);
  const writes = [];
  const storage = {
    setItem: function (key, value) { writes.push(['set', key, value]); },
    getItem: function () { return null; },
    removeItem: function (key) { writes.push(['remove', key]); }
  };
  const ctx = load({
    localStorage: storage,
    sessionStorage: storage
  });
  const page = ctx.ABIS_EMPLOYEE_EDIT;
  page.reset({ mode: 'LIVE', screen: 'add', punchConfirmed: true, form: filledForm() });
  await page.submitCreate({
    sessionToken: 'sess',
    call: async function (name) {
      if (name === 'hrEmployeeValidate') return { ok: true, confirmToken: 'create-tok', mode: 'LIVE' };
      return {
        ok: true,
        employeeId: 'B11513',
        writesPerformed: 2,
        credential: { tempPin: PIN, tempPinEventId: 'TPIN-1', expiresAt: '2026-11-26T05:20:00.000Z', displayOnce: true }
      };
    }
  });
  await page.confirmWritten({
    sessionToken: 'sess',
    call: async function () { return { ok: false, code: 'SYSTEM_BUSY' }; }
  });
  assert.equal(page.pinValue(), '');
  assert.deepEqual(writes, []);
  assert.equal(JSON.stringify(page.snapshot()).indexOf(PIN), -1);
});

test('shadow mode and a replay do not show a PIN', async () => {
  const page = ui();
  page.reset({ mode: 'SHADOW', screen: 'add', punchConfirmed: true, form: filledForm() });
  const shadow = await page.submitCreate({
    sessionToken: 'sess',
    call: async function (name, payload) {
      if (name === 'hrEmployeeValidate') return { ok: true, confirmToken: 'shadow-tok', mode: 'SHADOW', diff: [] };
      assert.equal(payload.changes.tempPin, undefined);
      assert.equal(payload.confirmToken, 'shadow-tok');
      return { ok: true, mode: 'SHADOW', writesPerformed: 0, credential: { wouldCreate: true, tempPin: PIN } };
    }
  });
  assert.equal(shadow.shadow, true);
  assert.equal(page.pinValue(), '');
  assert.match(page.renderCurrent(), /預演完成：未寫入任何資料/);
  assert.doesNotMatch(page.renderCurrent(), new RegExp(PIN));

  page.reset({ mode: 'LIVE', screen: 'add', punchConfirmed: true, form: filledForm() });
  await page.submitCreate({
    sessionToken: 'sess',
    call: async function (name) {
      if (name === 'hrEmployeeValidate') return { ok: true, confirmToken: 'replay-tok', mode: 'LIVE' };
      return { ok: true, replayed: true, writesPerformed: 0, credential: { created: true, displayOnce: false, tempPin: null } };
    }
  });
  assert.equal(page.pinValue(), '');
  assert.match(page.renderCurrent(), /PIN 已無法再查看/);
  assert.doesNotMatch(page.renderCurrent(), /ee-pin/);
});

test('ZH, VI, and TH are exposed; EN is prepared and not shown', () => {
  const ctx = load();
  const page = ctx.ABIS_EMPLOYEE_EDIT;
  assert.equal(Array.from(page.exposedLangs).join(','), 'ZH,VI,TH');
  const keys = Object.keys(page.texts.ZH);
  ['VI', 'TH', 'EN'].forEach(function (lang) {
    keys.forEach(function (key) {
      assert.equal(typeof page.texts[lang][key], 'string', lang + '.' + key);
      assert.ok(page.texts[lang][key].length > 0, lang + '.' + key);
    });
    assert.equal(Object.keys(page.texts[lang]).length, keys.length);
  });
  assert.equal(page.texts.VI.employeeManagement, 'Quản lý nhân viên');
  assert.equal(page.texts.TH.employeeManagement, 'จัดการพนักงาน');
  assert.equal(page.texts.VI.punchNumber, 'Mã máy chấm công');
  assert.equal(page.texts.TH.location, 'สถานที่ทำงาน');
  assert.ok(page.draftNativeReview.keys.indexOf('addEmployee') >= 0);
  assert.equal(page.draftNativeReview.keys.indexOf('employeeManagement'), -1);
  assert.equal(Array.from(page.draftNativeReview.langs).join(','), 'VI,TH');
  assert.match(source, /DRAFT_NATIVE_REVIEW/);
  assert.match(page.draftNativeReview.note, /native speaker/);
  ctx.currentLang = 'VI';
  assert.match(page.renderScreen('list', { rows: [], limit: 20 }), /Thêm nhân viên/);
  assert.doesNotMatch(page.renderScreen('list', { rows: [], limit: 20 }), /新增員工/);
  ctx.currentLang = 'EN';
  assert.match(page.renderScreen('list', { rows: [], limit: 20 }), /新增員工/);
  assert.doesNotMatch(page.renderScreen('list', { rows: [], limit: 20 }), /Add employee/);
  ctx.currentLang = 'TH';
  assert.match(page.renderScreen('list', { rows: [], limit: 20 }), /เพิ่มพนักงาน/);
});

test('create defaults do not wipe typed values and hire-date warnings stay human', () => {
  const page = ui();
  const typed = page.suggestDefaults({ '姓名': '阮氏清梅', '人員類別': '廠務', '工作地點': '新店廠', '部門': '已填部門' });
  assert.equal(typed['姓名'], '阮氏清梅');
  assert.equal(typed['部門'], '已填部門');
  assert.equal(typed['簽核路由群組'], 'FACTORY');
  assert.equal(typed['組織設定確認'], '待確認');
  assert.equal(typed['簽核權限'], 'NONE');
  assert.equal(page.pinExpiresBeforeHire('2026-12-20', 7, '2026-11-19'), true);
  assert.equal(page.pinExpiresBeforeHire('2026-11-20', 7, '2026-11-19'), false);
  const html = page.renderScreen('add', {
    mode: 'LIVE',
    form: typed,
    punchConfirmed: false,
    today: '2026-11-19',
    tempPinDays: 7,
    rows: []
  });
  assert.match(html, /到職日當天不計遲到、缺卡/);
  assert.match(html, /新增後會產生一組臨時 PIN/);
  assert.match(html, /新增後為在職，身分確認為待確認/);
  assert.doesNotMatch(html, /待報到/);
  assert.match(html, /aria-pressed="false"/);
  const changes = page.createChanges(Object.assign({}, typed, { PINHash: 'nope', tempPin: PIN, '例外備註': 'secret note' }));
  assert.equal(changes.PINHash, undefined);
  assert.equal(changes.tempPin, undefined);
  assert.equal(changes['例外備註'], undefined);
  assert.equal(changes['姓名'], '阮氏清梅');
});

test('add form splits basic and collapsed advanced, and detail separates label from value', () => {
  const page = ui();
  const html = page.renderScreen('add', {
    mode: 'LIVE',
    form: page.suggestDefaults({ '姓名': '阮氏清梅很長的姓名不會被切掉', '人員類別': '廠務', '到職日': '2026-12-01', '部門': '創新法人部門名稱很長' }),
    rows: [],
    today: '2026-11-19'
  });
  assert.match(html, /基本/);
  assert.match(html, /進階/);
  assert.match(html, /data-ee-field="姓名"/);
  assert.match(html, /data-ee-field="到職日"/);
  assert.match(html, /data-ee-field="直屬主管ID"/);
  assert.match(html, /<textarea class="ee-grow"[^>]*data-ee-field="姓名"/);
  assert.match(html, /<textarea class="ee-grow"[^>]*data-ee-field="部門"/);
  assert.doesNotMatch(html, /data-ee-field="正式班別"/);
  const open = page.renderScreen('add', {
    mode: 'LIVE',
    advancedOpen: true,
    form: page.suggestDefaults({}),
    rows: []
  });
  assert.match(open, /data-ee-field="正式班別"/);
  const detail = page.renderScreen('detail', {
    employeeId: 'B11520',
    fields: {
      '姓名': '新人',
      'V2員工ID': 'B11520',
      '在職狀態': '在職',
      '到職日': '2026-11-16',
      'HR確認': '待確認',
      '部門': '廠務部'
    },
    audit: [{
      field: 'LINE綁定狀態',
      before: false,
      after: 'LINE false',
      reason: 'NEW_EMPLOYEE',
      action: 'NEW_EMPLOYEE'
    }, {
      field: '部門',
      before: '廠務部',
      after: '管理部',
      reason: 'REORG'
    }, {
      field: '帳號',
      before: '',
      after: 'CREDENTIAL_INSERT_FAILED',
      reason: 'CREDENTIAL_INSERT_FAILED'
    }, {
      field: '原因',
      before: '',
      after: 'NEW_HIRE',
      reason: 'NEW_HIRE'
    }],
    rows: []
  });
  assert.match(detail, /class="ee-label"/);
  assert.match(detail, /class="ee-value"/);
  assert.match(detail, /HR確認/);
  assert.match(detail, /待確認/);
  assert.match(detail, /ee-status/);
  assert.match(detail, /否/);
  assert.match(detail, /新增員工/);
  assert.match(detail, /組織調整/);
  assert.match(detail, /帳號建立未完成/);
  assert.doesNotMatch(detail, /NEW_EMPLOYEE|NEW_HIRE|CREDENTIAL_INSERT_FAILED|REORG|LINE false/);
});

test('search chips use real row fields and drop filters the rows do not carry', () => {
  const page = ui();
  const real = [
    { employeeId: 'A09700', name: '甲一', company: 'ABIS', location: '新店廠', department: '廠務部', employmentStatus: '在職', personType: '廠務' },
    { employeeId: 'B11520', name: '新人', company: 'ABIS', location: '新店廠', department: '廠務部', employmentStatus: '在職', personType: '廠務', hireDate: '2026-11-16' }
  ];
  const plain = page.renderScreen('list', { rows: real.slice(0, 1), chip: 'manager', limit: 20 });
  assert.doesNotMatch(plain, /新進人員|主管/);
  assert.match(plain, /甲一/);
  const withHire = page.renderScreen('list', { rows: real, chip: 'new', limit: 20, today: '2026-11-19' });
  assert.match(withHire, /新進人員/);
  assert.match(withHire, /新人/);
  assert.doesNotMatch(withHire, />主管</);
  const managers = page.renderScreen('list', {
    rows: [
      { employeeId: 'A09700', name: '主管甲', isManager: 'Y', employmentStatus: '在職' },
      { employeeId: 'B09905', name: '員工乙', isManager: 'N', employmentStatus: '在職' }
    ],
    chip: 'manager',
    limit: 20
  });
  assert.match(managers, /主管/);
  assert.match(managers, /主管甲/);
  assert.doesNotMatch(managers, /員工乙/);
});

test('typing enables the review button without waiting for a host redraw', () => {
  const root = { innerHTML: '' };
  const ctx = load({
    document: {
      readyState: 'complete',
      __eeBound: true,
      addEventListener: function () {},
      getElementById: function () { return { textContent: '' }; },
      createElement: function () { return {}; },
      querySelector: function (sel) { return sel === '[data-ee-root]' ? root : null; },
      head: { appendChild: function () {} },
      activeElement: null
    }
  });
  const page = ctx.ABIS_EMPLOYEE_EDIT;
  page.reset({
    active: true,
    mode: 'LIVE',
    screen: 'edit',
    operation: 'UPDATE',
    actorId: 'A00001',
    employeeId: 'B11401',
    baseline: { '部門': '廠務部', '姓名': '王小明' },
    form: { '部門': '廠務部', '姓名': '王小明' }
  });
  page.renderCurrent();
  const before = page.renderScreen('edit', {
    actorId: 'A00001',
    employeeId: 'B11401',
    form: { '部門': '廠務部', '姓名': '王小明' },
    baseline: { '部門': '廠務部', '姓名': '王小明' },
    rows: []
  });
  assert.match(before, /data-ee-action="review"[^>]*disabled/);
  ctx.document.querySelector = function (sel) {
    if (sel === '[data-ee-root]') return root;
    return null;
  };
  page.onInput({
    target: {
      value: '業務部',
      tagName: 'INPUT',
      getAttribute: function (name) { return name === 'data-ee-field' ? '部門' : null; }
    }
  });
  assert.match(root.innerHTML || page.renderCurrent(), /data-ee-action="review"/);
  assert.doesNotMatch(page.renderCurrent(), /data-ee-action="review"[^>]*disabled/);
});

test('opening add clears the previous employee, and an unchanged hire date drops hire warnings', async () => {
  const page = ui();
  page.reset({
    active: true,
    mode: 'LIVE',
    screen: 'detail',
    employeeId: 'B11401',
    errorKey: 'required',
    fieldCatalog: [{ field: 'V2員工ID', editable: false }],
    form: { 'V2員工ID': 'B11401', '姓名': '舊人' },
    baseline: { 'V2員工ID': 'B11401', '姓名': '舊人' }
  });
  await page.handleAction('add', {}, {});
  assert.equal(page.snapshot().employeeId, '');
  const html = page.renderCurrent();
  assert.match(html, /新增員工/);
  assert.doesNotMatch(html, /data-ee-field="V2員工ID"[^>]*disabled/);
  assert.doesNotMatch(html, /舊人/);

  page.reset({
    active: true,
    mode: 'LIVE',
    screen: 'edit',
    operation: 'UPDATE',
    actorId: 'A00001',
    employeeId: 'B11401',
    rowVersion: 'v1',
    baseline: { '部門': '廠務部', '到職日': '2026-11-01', '姓名': '王小明' },
    form: { '部門': '業務部', '到職日': '2026-11-01', '姓名': '王小明' },
    reason: { code: 'REORG', note: '' }
  });
  await page.handleAction('review', {}, {
    sessionToken: 'sess',
    call: async function () {
      return {
        ok: true,
        mode: 'LIVE',
        confirmToken: 'tok',
        diff: [{ field: '部門', before: '廠務部', after: '業務部' }],
        warnings: [
          { code: 'HIRE_DATE_BEFORE_TODAY' },
          { code: 'HIRE_DATE_AFFECTS_ATTENDANCE' }
        ],
        requires: { hrConfirmStep: false }
      };
    }
  });
  const diff = page.renderCurrent();
  assert.match(diff, /業務部/);
  assert.doesNotMatch(diff, /到職日早於今天/);
  assert.doesNotMatch(diff, /已經算過的出勤不會自動重算/);
  assert.doesNotMatch(diff, /role="dialog"/);
  assert.doesNotMatch(diff, /data-ee-impact/);
});

test('the diff page submits directly and still sends the confirm token', async () => {
  const page = ui();
  page.reset({
    mode: 'LIVE',
    screen: 'diff',
    operation: 'UPDATE',
    actorId: 'A00001',
    employeeId: 'B11401',
    rowVersion: 'version-1',
    baseline: { '部門': '廠務部', '到職日': '2026-11-09' },
    form: { '部門': '業務部', '到職日': '2026-11-10' },
    reason: { code: 'CORRECTION', note: '' },
    requires: { hrConfirmStep: true }
  });
  const preview = page.renderCurrent();
  assert.match(preview, /data-ee-action="save"/);
  assert.doesNotMatch(preview, /data-ee-action="save"[^>]*disabled/);
  assert.doesNotMatch(preview, /role="dialog"/);
  assert.match(preview, /此員工已有出勤、特休或薪資資料/);
  const seen = [];
  const saved = await page.submitUpdate({
    sessionToken: 'sess',
    call: async function (name, payload) {
      seen.push({ name: name, payload: payload });
      if (name === 'hrEmployeeValidate') return { ok: true, confirmToken: 'diff-tok', mode: 'LIVE', diff: [] };
      return { ok: true, rowVersion: 'version-2' };
    }
  });
  assert.equal(saved.ok, true);
  assert.equal(seen[1].payload.confirmToken, 'diff-tok');
  assert.equal(seen[1].payload.hrConfirmedImpact, true);
  assert.equal(seen[1].payload.reason.code, 'CORRECTION');
  assert.match(page.renderCurrent(), /已儲存/);
});

test('manager, shift, and edit transport errors use specific wording', () => {
  const page = ui();
  assert.equal(page.publicError({ ok: false, code: 'MANAGER_NOT_FOUND' }), '找不到這位主管，或主管目前不是在職');
  assert.equal(page.publicError({ ok: false, code: 'MANAGER_SELF' }), '主管不可為本人');
  assert.equal(page.publicError({ ok: false, code: 'MANAGER_CYCLE' }), '主管設定會互相循環，請改選別人');
  assert.equal(page.publicError({ ok: false, code: 'SHIFT_INVALID' }), '正式班別須為有效且已確認的班別');
  assert.match(page.publicError({ ok: false, code: 'PUNCH_SUGGESTION_CHANGED' }), /建議打卡號已變更/);
  assert.doesNotMatch(page.publicError({ ok: false, code: 'MANAGER_NOT_FOUND' }), /這是必填欄位|MANAGER_NOT_FOUND/);
  page.reset({
    mode: 'LIVE',
    screen: 'diff',
    operation: 'UPDATE',
    employeeId: 'B11401',
    baseline: { '部門': '廠務部' },
    form: { '部門': '業務部' },
    reason: { code: 'CORRECTION', note: '' },
    rowVersion: 'v1'
  });
  return page.submitUpdate({
    sessionToken: 'sess',
    call: async function () { throw new Error('transport'); }
  }).then(function () {
    const html = page.renderCurrent();
    assert.match(html, /結果不明。請重新載入這位員工後再試/);
    assert.doesNotMatch(html, /若已建立但沒看到 PIN/);
  });
});

test('detail reads work, workflow, and organization confirmation from the backend shape', async () => {
  const page = ui();
  page.reset({ active: true, mode: 'LIVE', screen: 'list' });
  const result = await page.handleAction('open', { id: 'B11520' }, {
    sessionToken: 'sess',
    call: async function (name) {
      if (name === 'hrEmployeeDetail') {
        return {
          ok: true,
          employee: {
            employeeId: 'B11520',
            name: '新人',
            employment: { employmentStatus: '在職', hireDate: '2026-11-16', department: '廠務部' },
            work: { location: '新店廠', personType: '廠務', shiftConfirmed: '待確認', formalShift: '日班' },
            organization: { organizationConfirmed: '待確認', manager1: 'A09700', isManager: 'N' },
            workflow: { hrConfirm: '待確認' },
            system: { lineBound: false, credentialState: 'TEMP_PIN_REQUIRED' }
          }
        };
      }
      if (name === 'hrEmployeeAuditList') return { ok: true, rows: [] };
      if (name === 'hrEmployeeValidate') return { ok: true, mode: 'LIVE', fields: [], rowVersion: 'rv' };
      return { ok: true };
    }
  });
  assert.equal(result.ok, true);
  const html = page.renderCurrent();
  assert.match(html, /新店廠/);
  assert.match(html, /廠務/);
  assert.match(html, /待確認/);
  assert.match(html, /HR確認/);
  assert.match(html, /否/);
  assert.doesNotMatch(html, /TEMP_PIN_REQUIRED|false/);
});

test('host reads lexical session data and installs only after login', async () => {
  const calls = [];
  let entered = 0;
  const ctx = load({
    document: {
      readyState: 'complete',
      addEventListener: function () {},
      getElementById: function () { return null; },
      createElement: function () { return {}; },
      querySelector: function () { return null; },
      head: { appendChild: function () {} }
    },
    google: {
      script: {
        run: {
          withSuccessHandler: function (fn) { this._ok = fn; return this; },
          withFailureHandler: function () { return this; },
          api: function (action) {
            calls.push(action);
            this._ok({ ok: false, code: 'FEATURE_OFF' });
          }
        }
      }
    },
    enterApp: function () { entered += 1; }
  });
  assert.deepEqual(calls, []);
  ctx.sessionToken = 'sess';
  ctx.homeData = { employee: { id: 'A09701', approvalPermission: 'HR' } };
  ctx.enterApp();
  await new Promise(function (resolve) { setTimeout(resolve, 0); });
  assert.equal(entered, 1);
  assert.deepEqual(calls, ['hrEmployeeValidate']);
  assert.equal(ctx.ABIS_EMPLOYEE_EDIT.snapshot().active, false);
});

test('in-app navigation, back, and logout go through the PIN leave guard', async () => {
  let loggedOut = 0;
  let wentHome = 0;
  let backed = 0;
  const pops = [];
  const ctx = load({
    document: {
      readyState: 'complete',
      addEventListener: function () {},
      getElementById: function () { return null; },
      createElement: function () { return {}; },
      querySelector: function () { return null; },
      head: { appendChild: function () {} }
    },
    logout: function () { loggedOut += 1; },
    showHome: function () { wentHome += 1; },
    history: {
      pushState: function () {},
      back: function () { backed += 1; }
    },
    addEventListener: function (name, fn) { if (name === 'popstate') pops.push(fn); }
  });
  const page = ctx.ABIS_EMPLOYEE_EDIT;
  page.holdPin(PIN, { employeeId: 'B11513', tempPinEventId: 'TPIN-1' });
  ctx.showHome();
  assert.equal(wentHome, 0);
  assert.equal(page.snapshot().leaveGuard, true);
  assert.match(page.renderCurrent(), /role="dialog"/);
  assert.match(page.renderCurrent(), /回去抄寫/);
  await page.handleAction('stay', {}, {});
  assert.equal(page.snapshot().leaveGuard, false);
  assert.equal(page.pinValue(), PIN);
  assert.equal(wentHome, 0);
  ctx.history.back();
  assert.equal(backed, 0);
  assert.equal(page.snapshot().leaveGuard, true);
  await page.handleAction('stay', {}, {});
  if (pops[0]) pops[0]();
  assert.equal(page.snapshot().pinHeld, true);
  assert.equal(page.snapshot().leaveGuard, true);
  await page.handleAction('stay', {}, {});
  ctx.logout();
  assert.equal(loggedOut, 0);
  assert.equal(page.snapshot().pinHeld, true);
  await page.confirmWritten({
    sessionToken: 'sess',
    call: async function () { return { ok: true }; }
  });
  assert.equal(page.snapshot().pinHeld, false);
  assert.equal(page.pinValue(), '');
  assert.equal(loggedOut, 1);
  ctx.logout();
  assert.equal(loggedOut, 2);
  assert.equal(page.snapshot().pinHeld, false);
  assert.match(source, /typeof homeData !== 'undefined'/);
  assert.match(source, /typeof sessionToken !== 'undefined'/);
  assert.match(source, /typeof currentLang !== 'undefined'/);
  assert.match(source, /typeof accountPanel_ !== 'undefined'/);
});
