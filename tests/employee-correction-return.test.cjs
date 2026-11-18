'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const sourcePath = path.resolve(
  __dirname,
  '../assets/ess-20261118-employee-correction-return/employee-correction-return.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');

function load(extra) {
  const context = Object.assign({ console, document: undefined }, extra || {});
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'employee-correction-return.js' });
  return context;
}

const ui = load().ABIS_EMPLOYEE_CORRECTION_RETURN;

test('zh en vi th cover the same keys', () => {
  const keys = Object.keys(ui.texts.ZH);
  ['EN', 'VI', 'TH'].forEach((lang) => {
    assert.deepEqual(Object.keys(ui.texts[lang]).sort(), keys.slice().sort());
    keys.forEach((key) => assert.ok(ui.texts[lang][key]));
  });
});

test('a manager return shows the note, not only the status', () => {
  const html = ui.renderPreview(ui.fixtureRejected('plain'));
  assert.match(html, /主管未採認/);
  assert.match(html, /退回理由/);
  assert.match(html, /下班時間和打卡對不上/);
  assert.doesNotMatch(html, /data-ecr-leave/);
  assert.match(html, /提出出勤補正/);
  assert.match(html, /提出異議/);
});

test('a leave-request return links to the leave page with the date and hides the marker', () => {
  const day = ui.fixtureRejected('leave');
  const html = ui.renderPreview(day);
  assert.match(html, /去申請假單/);
  assert.match(html, /data-ecr-leave="2026-11-02"/);
  assert.match(html, /請改申請假單/);
  assert.doesNotMatch(html, /ABIS:LEAVE_REQUEST/);
  assert.equal(ui.displayNote(day.correctionRequests[0].managerNote).includes('ABIS:LEAVE_REQUEST'), false);
  assert.equal(ui.isLeaveReturn('只是普通退回'), false);
});

test('opening leave writes the correction date into the existing form', () => {
  const values = {};
  const context = load({
    document: {
      getElementById(id) {
        return { value: '', id: id };
      }
    },
    showLeaveForm(keep, skipDraft) {
      context.called = [keep, skipDraft];
    }
  });
  const api = context.ABIS_EMPLOYEE_CORRECTION_RETURN;
  const start = { value: '' };
  const end = { value: '' };
  context.document.getElementById = function (id) {
    return id === 'startDate' ? start : end;
  };
  const result = api.openLeaveForDate('2026-11-02');
  assert.deepEqual(context.called, [false, true]);
  assert.equal(start.value, '2026-11-02');
  assert.equal(end.value, '2026-11-02');
  assert.equal(result.opened, true);
  assert.equal(values.unused, undefined);
});

test('correction and appeal buttons are at least 48px', () => {
  const css = ui.styles();
  assert.match(css, /body\.inner-view \.att-correction-actions button,\.ecr-actions button,\.ecr-leave\{min-height:48px !important\}/);
  assert.doesNotMatch(css, /min-height:46px/);
});

test('submit failures hide the raw message and keep a code', () => {
  const err = new Error('sheet lock raw detail');
  err.code = 'LOCK_CONTENTION';
  const text = ui.publicError(err, 'ECR_SUBMIT_FAILED');
  assert.match(text, /LOCK_CONTENTION/);
  assert.match(text, /沒有送出/);
  assert.doesNotMatch(text, /sheet lock|raw detail/);
  const bare = ui.publicError(new Error('secret'), 'ECR_APPEAL_FAILED');
  assert.match(bare, /ECR_APPEAL_FAILED/);
  assert.doesNotMatch(bare, /secret/);
});

test('install adds the note onto the existing state and sanitizes submit failures', async () => {
  const seen = { failed: '', message: '' };
  const context = load({
    document: undefined,
    p5a202CorrectionStateHtml_() {
      return '<div class="att-correction-state reject">主管未採認</div>';
    },
    call() {
      const error = new Error('backend exploded');
      error.code = 'ROW_LOCKED';
      throw error;
    },
    beginOperation_() { return 'op'; },
    finishOperationFailure_(id, error) { seen.failed = error && error.message; },
    message(text) { seen.message = text; },
    c2t(key) { return key; },
    nt(key) { return key; },
    $(id) {
      return {
        attCorrType: { value: 'MISSING_OUT' },
        attCorrReason: { value: '忘記打卡' },
        attCorrFirstIn: { value: '' },
        attCorrLastOut: { value: '2026-11-02T17:00' }
      }[id];
    }
  });
  context.ABIS_EMPLOYEE_CORRECTION_RETURN.install();
  const html = context.p5a202CorrectionStateHtml_({
    date: '2026-11-02',
    correctionRequests: [{
      status: 'MANAGER_REJECTED',
      managerNote: '請改假單\nABIS:LEAVE_REQUEST'
    }]
  });
  assert.match(html, /主管未採認/);
  assert.match(html, /請改假單/);
  assert.match(html, /data-ecr-leave="2026-11-02"/);
  assert.doesNotMatch(html, /ABIS:LEAVE_REQUEST/);
  await context.submitAttendanceCorrectionUi_({ attendanceKey: '2026-11-02|B09502' }, null);
  assert.match(seen.failed, /ROW_LOCKED/);
  assert.match(seen.message, /ROW_LOCKED/);
  assert.doesNotMatch(seen.failed + seen.message, /backend exploded/);
});
