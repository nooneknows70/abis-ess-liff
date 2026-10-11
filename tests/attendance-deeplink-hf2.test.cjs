'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/ess-20261009-attendance-deeplink-hf2/attendance-deeplink-hf2.js'), 'utf8');

function build(options = {}) {
  const elements = new Map();
  const events = [];
  const timers = new Map();
  let nextTimer = 1;
  let callShouldFail = !!options.fail;
  let releaseHeldCall = null;
  let bootApplied = false;
  let homeFallbacks = 0;
  let backgroundPrefetchCalls = 0;
  const kind = options.kind || 'MANAGEMENT_SITE_DAY';

  function element(tag) {
    const item = {
      tagName: tag, id: '', textContent: '', children: [], style: {},
      handlers: {}, hidden: false,
      classList: { contains(name) { return name === 'hide' && !!item.hidden; } },
      setAttribute() {},
      addEventListener(name, fn) { this.handlers[name] = fn; },
      appendChild(child) {
        this.children.push(child);
        if (child.id) elements.set(child.id, child);
      },
      replaceChildren() { this.children = []; },
      remove() { if (this.id) elements.delete(this.id); }
    };
    return item;
  }
  const body = element('body');
  const document = {
    body,
    createElement: element,
    getElementById(id) { return elements.get(id) || null; }
  };
  const ctx = options.noContext ? null : {
    routeKind: kind, scopeType: 'SITE', scopeValue: 'XINDIAN',
    date: '2026-10-09', sourceEventKey: 'SOURCE_EVENT_TEST',
    subjectEmployeeId: 'A09701'
  };

  const sandbox = {
    document, window: {},
    ABIS_SERVER_BOOT: { routeContext: ctx },
    setTimeout(fn, delay) { const id = nextTimer++; timers.set(id, {fn, delay}); return id; },
    clearTimeout(id) { timers.delete(id); },
    async call(action, payload) {
      events.push({ action, payload });
      if (options.holdRpc) await new Promise(resolve => { releaseHeldCall = resolve; });
      if (callShouldFail) throw new Error('sensitive token=secret-not-for-UI');
      return { rows: [] };
    },
    async p5a25R29ApplyBootRouteContext_() {
      if (kind === 'MANAGEMENT_CASE') {
        const el = element('section'); el.id = 'inbox'; body.appendChild(el);
        return true;
      }
      if (kind === 'EMPLOYEE_CORRECTION') {
        const el = element('section'); el.id = 'attendance'; body.appendChild(el);
        return true;
      }
      const action = kind === 'EMPLOYEE_FOLLOWUP'
        ? 'attendanceUnifiedMyFollowupR2Live'
        : 'attendanceUnifiedSiteDetail';
      const params = action === 'attendanceUnifiedSiteDetail'
        ? { sessionToken: 'SESSION_STUB', date: ctx.date, scopeCode: ctx.scopeValue }
        : { sessionToken: 'SESSION_STUB' };
      try {
        await sandbox.call(action, params);
        const el = element('section');
        el.id = kind === 'EMPLOYEE_FOLLOWUP' ? 'r2FollowupOverlay' : 'r2SiteDetailOverlay';
        body.appendChild(el);
        return true;
      } catch (err) {
        return false;
      }
    },
    showHome() { homeFallbacks++; },
    prefetchSecondaryData() { backgroundPrefetchCalls++; return Promise.resolve(true); },
    p5rmApplyBootRoute_() {
      if (bootApplied) { sandbox.showHome(); return; }
      bootApplied = true;
      if (ctx) sandbox.p5a25R29ApplyBootRouteContext_();
    },
    enterApp() { sandbox.p5rmApplyBootRoute_(); }
  };
  vm.runInNewContext(source, sandbox, { filename: 'attendance-deeplink-hf2.js' });

  return {
    sandbox, events, elements, timers,
    setFailure(value) { callShouldFail = !!value; },
    releaseRpc() { if (!releaseHeldCall) throw new Error('No RPC pending'); const done=releaseHeldCall; releaseHeldCall=null; done(); },
    tickTimer(delay) { for(const [id,t] of timers){if(t.delay===delay){timers.delete(id);t.fn();return true;}}return false; },
    scheduledDelays() {return Array.from(timers.values()).map(t=>t.delay).sort((a,b)=>a-b);},
    getFallbacks() { return homeFallbacks; },
    getPrefetchCalls() { return backgroundPrefetchCalls; },
    status() { return sandbox.window.ABIS_ATTENDANCE_DEEPLINK_HF2.status(); }
  };
}
async function settle() {
  await new Promise(resolve => setImmediate(resolve));
}

test('WAITING is not interpreted as an in-flight request, and site route executes once', async () => {
  const t = build();
  assert.equal(t.status().phase, 'WAITING');
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.status().phase, 'DONE');
  assert.equal(t.status().attempts, 1);
  assert.equal(t.events.length, 1);
  assert.equal(t.events[0].action, 'attendanceUnifiedSiteDetail');
  assert.equal(t.events[0].payload.sourceEventKey, 'SOURCE_EVENT_TEST');
  assert.equal(t.elements.has('abisDeeplinkGateHF2'), false);
});

test('API rejection becomes a durable failure code; bounded retry succeeds', async () => {
  const t = build({ fail: true });
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.status().phase, 'FAILED');
  assert.equal(t.status().failureCode, 'API_FAILED');
  assert.equal(t.status().apiStatus, 'FAILED');
  const panel = t.elements.get('abisDeeplinkGateHF2');
  assert.ok(panel);
  const visibleText = (panel.children || []).map(c => c.textContent || '').join(' ');
  assert.ok(!visibleText.includes('secret-not-for-UI'));
  t.setFailure(false);
  await t.sandbox.p5a25R29ApplyBootRouteContext_();
  assert.equal(t.status().phase, 'DONE');
  assert.equal(t.status().attempts, 2);
});

test('repeated enterApp never resets an authorized target to HOME', async () => {
  const t = build();
  t.sandbox.enterApp();
  await settle();
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.getFallbacks(), 0);
  assert.equal(t.status().phase, 'DONE');
  assert.equal(t.status().attempts, 1);
});

test('employee follow-up route reads the correct API and opens its overlay', async () => {
  const t = build({ kind: 'EMPLOYEE_FOLLOWUP' });
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.events[0].action, 'attendanceUnifiedMyFollowupR2Live');
  assert.equal(t.status().phase, 'DONE');
});

test('management case resolves to the inbox, not to a false failure', async () => {
  const t = build({ kind: 'MANAGEMENT_CASE' });
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.status().phase, 'DONE');
  assert.equal(t.events.length, 0);
});

test('never installs instrumentation on a regular HOME without routeContext', () => {
  const t = build({ noContext: true });
  assert.equal(t.sandbox.window.ABIS_ATTENDANCE_DEEPLINK_HF2, undefined);
  t.sandbox.enterApp();
  assert.equal(t.getFallbacks(), 0);
});

test('permanent failure is bounded to three attempts', async () => {
  const t = build({ fail: true });
  t.sandbox.enterApp();
  await settle();
  await t.sandbox.p5a25R29ApplyBootRouteContext_();
  await t.sandbox.p5a25R29ApplyBootRouteContext_();
  assert.equal(t.status().attempts, 3);
  await t.sandbox.p5a25R29ApplyBootRouteContext_();
  assert.equal(t.status().failureCode, 'MAX_RETRIES');
  assert.equal(t.status().attempts, 3);
  assert.equal(t.events.length, 3);
});


test('long 56s read: 30-second notice does not cause a false 45s failure or duplicate RPC', async () => {
  const t=build({holdRpc:true});
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.events.length,1);
  assert.deepEqual(t.scheduledDelays(),[30000,90000]);
  assert.equal(t.status().inFlight,true);
  assert.equal(t.tickTimer(30000),true);
  assert.equal(t.status().phase,'SLOW');
  assert.equal(t.status().inFlight,true);
  assert.equal(t.status().attempts,1);
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.getFallbacks(),0);
  assert.equal(t.events.length,1);
  assert.equal(t.status().attempts,1);
  t.releaseRpc();
  await settle();
  assert.equal(t.status().phase,'DONE');
  assert.equal(t.status().inFlight,false);
  assert.equal(t.timers.size,0);
});

test('90-second delayed-read notice never cancels the original RPC or opens Retry', async()=>{
  const t=build({holdRpc:true});
  t.sandbox.enterApp();
  await settle();
  assert.equal(t.tickTimer(90000),true);
  assert.equal(t.status().phase,'DELAYED');
  assert.equal(t.status().inFlight,true);
  const panel=t.elements.get('abisDeeplinkGateHF2');
  assert.ok(panel);
  assert.equal(panel.children.some(c=>c.tagName==='button'),false);
  const stillPending=t.sandbox.p5a25R29ApplyBootRouteContext_();
  assert.equal(t.events.length,1);
  assert.equal(t.status().attempts,1);
  t.releaseRpc();
  await stillPending;
  await settle();
  assert.equal(t.status().phase,'DONE');
  assert.equal(t.status().inFlight,false);
  assert.equal(t.timers.size,0);
});

test('delayed API rejection becomes visible failure only after the actual RPC settles',async()=>{
  const t=build({holdRpc:true,fail:true});
  t.sandbox.enterApp();
  await settle();
  t.tickTimer(30000);
  t.tickTimer(90000);
  assert.equal(t.status().phase,'DELAYED');
  assert.equal(t.status().apiStatus,'PENDING');
  t.releaseRpc();
  await settle();
  assert.equal(t.status().phase,'FAILED');
  assert.equal(t.status().failureCode,'API_FAILED');
  assert.equal(t.status().inFlight,false);
  const panel=t.elements.get('abisDeeplinkGateHF2');
  assert.ok(panel.children.some(c=>c.tagName==='button'));
  const text=panel.children.map(x=>x.textContent||'').join(' ');
  assert.ok(!text.includes('secret-not-for-UI'));
});


test('authorized site link delays background RPC prefetch until long site request settles', async()=>{
 const t=build({holdRpc:true});
 t.sandbox.enterApp();
 await settle();
 assert.equal(t.events.length,1);
 const prefetched=t.sandbox.prefetchSecondaryData();
 await prefetched;
 assert.equal(t.getPrefetchCalls(),0,'must not contend with live site-detail read');
 assert.equal(t.tickTimer(30000),true);
 assert.equal(t.tickTimer(90000),true);
 assert.equal(t.status().inFlight,true);
 assert.equal(t.getPrefetchCalls(),0);
 t.releaseRpc();
 await settle();
 assert.equal(t.status().phase,'DONE');
 assert.equal(t.getPrefetchCalls(),1,'background fetch resumes exactly once');
});

test('failed site link releases delayed background tasks after failure, not during request',async()=>{
 const t=build({holdRpc:true,fail:true});
 t.sandbox.enterApp();
 await settle();
 await t.sandbox.prefetchSecondaryData();
 assert.equal(t.getPrefetchCalls(),0);
 t.releaseRpc();
 await settle();
 assert.equal(t.status().phase,'FAILED');
 assert.equal(t.getPrefetchCalls(),1);
});

test('normal HOME without route context does not intercept background work',()=>{
 const t=build({noContext:true});
 t.sandbox.prefetchSecondaryData();
 assert.equal(t.getPrefetchCalls(),1);
});
