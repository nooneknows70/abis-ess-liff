'use strict';
/* Q42 pure UI/HR worklist contract. Offline only; no network/LINE/Apps Script. */
const test=require('node:test');
const assert=require('node:assert/strict');
const ui=require('../features/longleave-exec-v1/approval-panel.js');
const view=require('../features/longleave-exec-v1/g7-q42-deferred-view.js');
const L='G7-Q42-SYNTH-LEAVE-001',G='G7-Q42-SYNTH-GRP-001';
const R='G7-Q42-SYNTH-REQUEST-001',E='G7-Q42-SYNTH-EPOCH-001';
const H='a'.repeat(64);
function item(){
 return {backendRouteBound:true,
  g7ServerProjection:'AUTHORITATIVE_COMMIT_AWARE',
  serverScopeApplied:true,readTier:'FORMAL_PROVIDER_VERIFIED',
  g7Visibility:'FULL_COMMITTED',
  case:{leaveId:L,groupId:G,sourceEpoch:E,status:'APPROVED',
    employeeId:'SYNTH-EMP',leaveStartDate:'2026-11-04',
    leaveEndDate:'2026-11-06',systemHours:24},
  groups:[{groupId:G,requestId:R,sourceEpoch:E,
    memberCount:1,phase:'COMMITTED',
    visibility:'FULL_COMMITTED',singleLeavePolicyVerified:true}],
  transactionReceipt:{phase:'COMMITTED',requestId:R,eventHash:H,outboxReleased:false},
  externalSync:{status:'SUPPRESSED_PENDING_EXTERNAL_RECONCILIATION',
    hrReconciliationRequired:true,
    domains:{ATTENDANCE:'PENDING_HR_RECONCILIATION',
      PAYROLL:'PENDING_HR_RECONCILIATION',LINE:'PENDING_HR_RECONCILIATION'}}
 };
}
function worklist(){
 return {backendRouteBound:true,g7ServerProjection:'AUTHORITATIVE_COMMIT_AWARE',
  serverScopeApplied:true,readTier:'FORMAL_PROVIDER_VERIFIED',
  identity:{serverVerified:true,role:'HR',hrReconciliationAllowed:true},
  items:[item()]};
}
test('Q42 employee notice only after all verified COMMITTED/internal-deferred gates',()=>{
 const r=item();
 assert.equal(ui.ACTIVE,false);
 assert.equal(view.q42Verified(r),true);
 assert.match(view.deferredNoticeHtml(r,'zh'),/HR 待對帳/);
 assert.match(view.deferredNoticeHtml(r,'vi'),/HR cần đối soát/);
 assert.match(view.deferredNoticeHtml(r,'th'),/รอ HR ตรวจสอบ/);
 const html=view.decorateEmployeeHtml(ui.employeeHtml(r.case,'zh'),r.case,r,'zh');
 assert.match(html,/長假已核准/);
 assert.match(html,/出勤／薪資／LINE 尚未同步/);
 assert.doesNotMatch(html,/核准交易仍待查核/);
});
test('Q42 legacy approved leave retains its original UI display',()=>{
 const c={leaveId:'OLD-CASE',status:'APPROVED'};
 const legacy=view.decorateEmployeeHtml(ui.employeeHtml(c,'zh'),c,null,'zh');
 assert.match(legacy,/已核准/);
 assert.doesNotMatch(legacy,/核准交易仍待查核/);
 assert.doesNotMatch(legacy,/HR 待對帳/);
});
test('Q42 unverified G7 approval never renders as completed approval',()=>{
 const r=item();r.backendRouteBound=false;
 assert.equal(view.q42Verified(r),false);
 const html=view.decorateEmployeeHtml(ui.employeeHtml(r.case,'zh'),r.case,r,'zh');
 assert.match(html,/核准交易仍待查核/);
 assert.doesNotMatch(html,/長假已核准（內部生效）/);
});
test('Q42 missing epoch, COMMITTED receipt, hash, or external suppression fails closed',()=>{
 const mutations=[
  r=>r.backendRouteBound=false,
  r=>r.g7Visibility='FULL_BEFORE',
  r=>r.groups[0].phase='PREPARED',
  r=>r.groups[0].sourceEpoch='OTHER',
  r=>r.groups[0].groupId='OTHER',
  r=>r.transactionReceipt.eventHash='UNVERIFIED',
  r=>r.transactionReceipt.outboxReleased=true,
  r=>r.transactionReceipt.requestId='OTHER',
  r=>r.externalSync.domains.PAYROLL='ACKED',
  r=>r.externalSync.hrReconciliationRequired=false
 ];
 for(const change of mutations){
  const r=item();change(r);
  assert.equal(view.q42Verified(r),false);
  assert.equal(view.deferredNoticeHtml(r,'zh'),'');
 }
});
test('Q42 HR worklist requires authenticated server role and per-item evidence',()=>{
 const r=worklist(),html=view.hrWorklistHtml(r,'zh');
 assert.match(html,/HR 長假外部待對帳清單/);
 assert.match(html,/SYNTH-EMP/);
 assert.match(html,/2026-11-04/);
 assert.match(html,/2026-11-06/);
 assert.match(html,/24/);
 assert.match(html,/G7-Q42-SYNTH-REQUEST-001/);
 assert.doesNotMatch(html,/data-llex-action/);
 for(const change of [
  q=>q.identity.role='EMPLOYEE',
  q=>q.identity.serverVerified=false,
  q=>q.identity.hrReconciliationAllowed=false,
  q=>q.backendRouteBound=false,
  q=>q.items[0].transactionReceipt.eventHash='INVALID',
  q=>q.items[0].case.systemHours=0,
  q=>q.items.push(item())
 ]){
  const q=worklist();change(q);
  assert.throws(()=>view.hrWorklistHtml(q,'zh'),/G7_Q42_HR_/);
 }
});
test('Q42 HR worklist never embeds unescaped staff data',()=>{
 const q=worklist();q.items[0].case.employeeId='<script>alert(1)</script>';
 const html=view.hrWorklistHtml(q,'zh');
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
});
