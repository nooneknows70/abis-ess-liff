'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.resolve(__dirname, '../assets/ess-20261027-leave-approval-label-rc1/leave-approval-label.js'),
  'utf8'
);

function button(leaveId, action, label = '指派代理') {
  const originalAction = "approveAction('" + leaveId + "','" + action + "',this)";
  return {
    textContent: label,
    originalAction,
    getAttribute(name) { return name === 'onclick' ? originalAction : null; }
  };
}

function render(items, buttons, language = 'ZH') {
  let originalCalled = 0;
  const context = {
    renderLeaveInbox_() { originalCalled++; return 'BASE_RENDER_OK'; },
    document: {
      getElementById(id) {
        assert.equal(id, 'inboxList');
        return { querySelectorAll() { return buttons; } };
      }
    },
    currentLang: language,
    tr(key) { return key === 'managerApprove' ? 'Approve leave' : key; }
  };
  vm.runInNewContext(source, context, { timeout: 500 });
  const result = context.renderLeaveInbox_(items);
  return { buttons, originalCalled, result };
}

test('factory manager: qualifying ASSIGN_PROXY button says 核准申請', () => {
  const b = button('LV-001', 'ASSIGN_PROXY');
  const r = render([{ leaveId: 'LV-001', role: 'MANAGER_ASSIGN', assignProxyFinalizesLeave: true }], [b]);
  assert.equal(b.textContent, '核准申請');
  assert.equal(b.getAttribute('onclick'), b.originalAction);
  assert.equal(r.originalCalled, 1);
  assert.equal(r.result, 'BASE_RENDER_OK');
});

test('long leave or non-final routing stays 指派代理', () => {
  const b = button('LV-002', 'ASSIGN_PROXY');
  render([{ leaveId: 'LV-002', role: 'MANAGER_ASSIGN', assignProxyFinalizesLeave: false }], [b]);
  assert.equal(b.textContent, '指派代理');
});

test('missing backend hint stays 指派代理 (fail closed)', () => {
  const b = button('LV-003', 'ASSIGN_PROXY');
  render([{ leaveId: 'LV-003', role: 'MANAGER_ASSIGN' }], [b]);
  assert.equal(b.textContent, '指派代理');
});

test('PROXY role cannot receive approval label', () => {
  const b = button('LV-004', 'ASSIGN_PROXY');
  render([{ leaveId: 'LV-004', role: 'PROXY', assignProxyFinalizesLeave: true }], [b]);
  assert.equal(b.textContent, '指派代理');
});

test('MANAGER role change-proxy control keeps its text', () => {
  const b = button('LV-005', 'ASSIGN_PROXY', '變更代理');
  render([{ leaveId: 'LV-005', role: 'MANAGER', assignProxyFinalizesLeave: true }], [b]);
  assert.equal(b.textContent, '變更代理');
});

test('only the matching LeaveID is renamed', () => {
  const yes = button('LV-006', 'ASSIGN_PROXY');
  const no = button('LV-007', 'ASSIGN_PROXY');
  render([{ leaveId: 'LV-006', role: 'MANAGER_ASSIGN', assignProxyFinalizesLeave: true }], [yes, no]);
  assert.equal(yes.textContent, '核准申請');
  assert.equal(no.textContent, '指派代理');
});

test('other actions remain unchanged', () => {
  const b = button('LV-008', 'REJECT', '退回修改');
  render([{ leaveId: 'LV-008', role: 'MANAGER_ASSIGN', assignProxyFinalizesLeave: true }], [b]);
  assert.equal(b.textContent, '退回修改');
});

test('non-Chinese uses existing managerApprove translation', () => {
  const b = button('LV-009', 'ASSIGN_PROXY');
  render([{ leaveId: 'LV-009', role: 'MANAGER_ASSIGN', assignProxyFinalizesLeave: true }], [b], 'VI');
  assert.equal(b.textContent, 'Approve leave');
});

test('empty list leaves controls untouched', () => {
  const b = button('LV-010', 'ASSIGN_PROXY');
  render([], [b]);
  assert.equal(b.textContent, '指派代理');
});

test('non-array list leaves controls untouched', () => {
  const b = button('LV-011', 'ASSIGN_PROXY');
  render(null, [b]);
  assert.equal(b.textContent, '指派代理');
});

test('no base renderer means no crash and no mutation', () => {
  const context = { document: { getElementById() { throw new Error('must not run'); } } };
  vm.runInNewContext(source, context, { timeout: 500 });
  assert.equal(typeof context.renderLeaveInbox_, 'undefined');
});

test('no container means no crash and preserves base renderer', () => {
  let calls = 0;
  const context = {
    renderLeaveInbox_() { calls++; return 17; },
    document: { getElementById() { return null; } },
    currentLang: 'ZH'
  };
  vm.runInNewContext(source, context, { timeout: 500 });
  assert.equal(context.renderLeaveInbox_([{ leaveId: 'LV-012', role: 'MANAGER_ASSIGN', assignProxyFinalizesLeave: true }]), 17);
  assert.equal(calls, 1);
});
