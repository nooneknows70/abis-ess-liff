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


// RC1 real bundle-render integration fixtures: synthetic data only.
const baseBundle = fs.readFileSync(
  path.resolve(__dirname, '../assets/ess-20261007-rc13-hf8/abis-ess.bundle.js'),
  'utf8'
);
const baseRenderStart = baseBundle.indexOf('function renderLeaveInbox_(list)');
const baseRenderEnd = baseBundle.indexOf('function managerProxyChanged(leaveId)', baseRenderStart);
assert.ok(baseRenderStart > 0 && baseRenderEnd > baseRenderStart, 'Original renderLeaveInbox_ still exists');

const actualBaseRendererSource = baseBundle.slice(baseRenderStart, baseRenderEnd);

function renderWithRealBase(items, language = 'ZH') {
  const box = {
    _html: '',
    buttons: [],
    set innerHTML(html) {
      this._html = String(html);
      // A browser constructs all button nodes when .innerHTML is assigned,
      // even if the label adapter later chooses not to query the container.
      const pattern = /<button\b[^>]*onclick="([^"]+)"[^>]*>([^<]*)<\/button>/g;
      const matches = Array.from(this._html.matchAll(pattern))
        .filter(m => m[1].includes('ASSIGN_PROXY'));
      this.buttons = matches.map(m => {
        const action = m[1];
        return {
          textContent: m[2],
          getAttribute(name) { return name === 'onclick' ? action : null; }
        };
      });
    },
    get innerHTML() { return this._html; },
    querySelectorAll(selector) {
      assert.equal(selector, 'button[onclick*="ASSIGN_PROXY"]');
      return this.buttons;
    }
  };
  const dict = {
    ZH: { assignProxy: '指派代理', managerApprove: '核准申請', changeProxy: '變更代理', reject: '退回修改' },
    VI: { assignProxy: 'Chỉ định người thay', managerApprove: 'Duyệt đơn', changeProxy: 'Đổi người thay', reject: 'Trả lại' }
  };
  const context = {
    rc2NewestFirst_: xs => xs,
    escapeHtml: value => String(value == null ? '' : value),
    roleLabel: value => value,
    leaveTypeLabel: value => value.leaveType || '特休',
    renderProxyArrangement: () => '',
    sourceLabel: value => value,
    currentLang: language,
    tr(key) { return (dict[language] || dict.ZH)[key] || key; },
    $(id) { return id === 'inboxList' ? box : null; },
    document: { getElementById(id) { return id === 'inboxList' ? box : null; } }
  };
  vm.runInNewContext(actualBaseRendererSource + '\n' + source, context, { timeout: 1200 });
  const result = context.renderLeaveInbox_(items);
  return { html: box.innerHTML, buttons: box.buttons, result };
}

function realItem(id, role = 'MANAGER_ASSIGN', finalizes = true) {
  return {
    leaveId: id, role, assignProxyFinalizesLeave: finalizes,
    employeeName: 'Synthetic worker', leaveType: '特休',
    startDate: '2026-10-27', hours: 8, proxyCandidates: []
  };
}

test('real LIFF renderer: eligible manager button becomes 核准申請 and keeps ASSIGN_PROXY', () => {
  const out = renderWithRealBase([realItem('LV_SYNTH_REAL')]);
  assert.match(out.html, /approveAction\('LV_SYNTH_REAL','ASSIGN_PROXY',this\)/);
  assert.equal(out.buttons.length, 1);
  assert.equal(out.buttons[0].textContent, '核准申請');
  assert.equal(out.buttons[0].getAttribute('onclick'), "approveAction('LV_SYNTH_REAL','ASSIGN_PROXY',this)");
});

test('real LIFF renderer: non-final approval remains 指派代理', () => {
  const out = renderWithRealBase([realItem('LV_SYNTH_LONG', 'MANAGER_ASSIGN', false)]);
  assert.equal(out.buttons.length, 1);
  assert.equal(out.buttons[0].textContent, '指派代理');
});

test('real LIFF renderer: only the eligible synthetic LeaveID gets new label', () => {
  const out = renderWithRealBase([realItem('LV_SYNTH_YES'), realItem('LV_SYNTH_NO', 'MANAGER_ASSIGN', false)]);
  assert.equal(out.buttons.length, 2);
  assert.deepEqual(out.buttons.map(x => x.textContent), ['核准申請', '指派代理']);
});

test('real LIFF renderer: MANAGER change-proxy button is not relabelled', () => {
  const out = renderWithRealBase([realItem('LV_SYNTH_MANAGER', 'MANAGER')]);
  assert.equal(out.buttons.length, 1);
  assert.equal(out.buttons[0].textContent, '變更代理');
});

test('real LIFF renderer: Vietnamese manager button retains localized approval label', () => {
  const out = renderWithRealBase([realItem('LV_SYNTH_VI')], 'VI');
  assert.equal(out.buttons.length, 1);
  assert.equal(out.buttons[0].textContent, 'Duyệt đơn');
});
