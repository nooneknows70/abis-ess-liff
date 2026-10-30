'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path='assets/ess-20261029-g7-q21-candidate/abis-ess.bundle.js';
const full=fs.readFileSync(path,'utf8');
const from=full.indexOf('// G7 Q21 formal transaction UI seam.');
const to=full.indexOf('function call(action,payload){',from);
assert.ok(from>=0&&to>from,'candidate Q26 LIFF fence is missing');
const ctx={};vm.createContext(ctx);vm.runInContext(full.slice(from,to)+'\nthis.fence=ABIS_G7_LIFF_FORMAL_FENCE_;',ctx);
const f=ctx.fence;
test('Q26 unverified real group writer blocks every UI mutation in ACTIVE mode',()=>{
 const a=f.createTestHarness('ACTIVE');
 for(const x of ['ASSIGN_PROXY','PROXY_ACCEPT','MANAGER_APPROVE','TOP_APPROVE','REJECT'])
  assert.throws(()=>a.guardApproval(x),/G7_UI_HOLD_FORMAL_ATOMIC_WRITER_NOT_VERIFIED/,x);
});
test('Q26 client cannot be granted authority with simulated approval role or forged server values',()=>{
 const a=f.createTestHarness('ACTIVE');
 assert.throws(()=>a.screenResponse('inbox',{g7ServerProjection:'CLIENT_COMMIT_AWARE',g7Visibility:'FULL_COMMITTED'}),/G7_UI_HOLD_INCOMPLETE_SERVER_PROJECTION/);
 assert.throws(()=>a.screenResponse('myLeaves',{g7ServerProjection:'AUTHORITATIVE_COMMIT_AWARE',g7Visibility:'PARTIAL'}),/G7_UI_HOLD_INCOMPLETE_SERVER_PROJECTION/);
});
test('Q26 frozen LIFF V153 and current candidate remain safe under DRAFT_DISABLED',()=>{
 assert.equal(f.mode,'DRAFT_DISABLED');
 for(const x of ['ASSIGN_PROXY','PROXY_ACCEPT','MANAGER_APPROVE','TOP_APPROVE','REJECT'])
  assert.doesNotThrow(()=>f.guardApproval(x));
 assert.ok(!fs.readFileSync('assets/ess-20261007-rc13-hf8/abis-ess.bundle.js','utf8').includes('ABIS_G7_LIFF_FORMAL_FENCE_'));
});
test('Q26 mutated frontend invokes guard before actual approval RPC',()=>{
 const start=full.indexOf('async function approveAction('),end=full.indexOf('async function ',start+5);
 const action=full.slice(start,end);
 assert.ok(action.includes('ABIS_G7_LIFF_FORMAL_FENCE_.guardApproval(action);'));
 assert.ok(action.indexOf('ABIS_G7_LIFF_FORMAL_FENCE_.guardApproval(action);')<action.indexOf('await call('));
});
