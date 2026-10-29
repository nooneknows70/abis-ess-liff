'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path='assets/ess-20261007-rc13-hf8/abis-ess.bundle.js';
const bundle=fs.readFileSync(path,'utf8');
const head=bundle.indexOf("// G7 Q21 formal transaction UI seam.");
const tail=bundle.indexOf("function call(action,payload){",head);
assert.ok(head>0&&tail>head,'G7 UI gate must precede actual RPC call');
const ctx={};
vm.createContext(ctx);
vm.runInContext(bundle.slice(head,tail)+"\nthis.__fence = ABIS_G7_LIFF_FORMAL_FENCE_;",ctx);
const fence=ctx.__fence;
test('V153 LIFF runtime stays disabled until new formal release',()=>assert.equal(fence.mode,'DRAFT_DISABLED'));
test('disabled LIFF projection leaves existing login and leaves API untouched',()=>{
 const r=[{leaveId:'L1',status:'已核准'}];
 assert.equal(fence.screenResponse('myLeaves',r),r);
 assert.equal(fence.screenResponse('inbox',r),r);
 assert.doesNotThrow(()=>fence.guardApproval('TOP_APPROVE'));
});
test('ACTIVE rejects an unprotected leave read',()=>{
 const g=fence.createTestHarness('ACTIVE');
 for(const action of ['myLeaves','inbox','hrLeaveManagement','leaveDashboard','managementReports','taskInbox'])
  assert.throws(()=>g.screenResponse(action,[{status:'已核准'}]),/G7_UI_HOLD_INCOMPLETE_SERVER_PROJECTION/);
});
test('ACTIVE only accepts server-delivered stable full BEFORE or COMMITTED response envelope',()=>{
 const g=fence.createTestHarness('ACTIVE');
 for(const visibility of ['FULL_BEFORE','FULL_COMMITTED']){
  const r={g7ServerProjection:'AUTHORITATIVE_COMMIT_AWARE',g7Visibility:visibility,rows:[]};
  assert.equal(g.screenResponse('myLeaves',r),r);
 }
 for(const visibility of ['PARTIAL','PREPARED','UNCERTAIN','']){
  assert.throws(()=>g.screenResponse('myLeaves',{g7ServerProjection:'AUTHORITATIVE_COMMIT_AWARE',g7Visibility:visibility}),/G7_UI_HOLD_INCOMPLETE_SERVER_PROJECTION/);
 }
});
test('ACTIVE never permits client to bypass unverified TOP_APPROVE writer',()=>{
 const g=fence.createTestHarness('ACTIVE');
 assert.throws(()=>g.guardApproval('TOP_APPROVE'),/G7_UI_HOLD_FORMAL_ATOMIC_WRITER_NOT_VERIFIED/);
 assert.doesNotThrow(()=>g.guardApproval('MANAGER_APPROVE'));
});
test('RPC response is screened before resolve, and action guard before mutation',()=>{
 assert.ok(bundle.includes('resolve(ABIS_G7_LIFF_FORMAL_FENCE_.screenResponse(action,r.data))'));
 assert.ok(bundle.includes("ABIS_G7_LIFF_FORMAL_FENCE_.guardApproval(action);"));
 assert.ok(bundle.indexOf("ABIS_G7_LIFF_FORMAL_FENCE_.guardApproval(action);")>bundle.indexOf("async function approveAction("));
});
test('LIFF root login is still a backend redirect, not leave data authority',()=>{
 const login=fs.readFileSync('index.html','utf8');
 assert.ok(login.includes('submitToBackend('));
 assert.ok(login.includes('liff.init('));
 assert.ok(!login.includes('function approveAction('));
});
test('syntax of existing LIFF assets remains valid under V8',()=>new vm.Script(bundle));
