'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mod=require('../features/longleave-exec-v1/g7-v174-release-client.js');
const ui=require('../features/longleave-exec-v1/approval-panel.js');
function createMock(opts={}){
 const calls=[],busy={},value=opts.caseData||{
  leaveId:'G7-SYNTH-LEAVE-001',actorRole:'SUPERVISOR',
  groupId:'G7-SYNTH-GRP-001',sourceEpoch:'G7-SYNTH-EPOCH-001',version:2,
  handoverVerified:true,authorityEligible:true,status:'PENDING_SUPERVISOR'};
 const rpc=async (action,data)=>{
  calls.push({action,data});
  if(action==='longLeaveExecV1Status')return opts.disabled?{
   policy:'V1',featureEnabled:false,providerBound:false,
   release:{mode:'DRAFT_DISABLED'}}:{
   policy:'V1',featureEnabled:true,providerBound:true,
   release:{mode:'AUTHORIZED_RELEASE'}};
  if(action==='longLeaveExecV1Read')return {
   g7ServerProjection:'AUTHORITATIVE_COMMIT_AWARE',
   g7Visibility:'FULL_BEFORE',serverScopeApplied:true,
   readTier:'FORMAL_PROVIDER_VERIFIED',case:value,
   groups:opts.omitGroups?[]:[Object.assign({
    groupId:value.groupId,requestId:'G7-SYNTH-REQUEST-PRIOR-001',
    sourceEpoch:value.sourceEpoch,memberCount:2,phase:'PREPARED',
    visibility:'FULL_BEFORE',singleLeavePolicyVerified:false
   },opts.groupReceipt||{})]};
  if(action==='longLeaveExecV1Action'){
   if(opts.unknownAck)throw Error('ACK_LOST');
   return {transactionReceipt:{phase:'COMMITTED',requestId:data.idempotencyKey,
    outboxReleased:false}};
  }
  throw Error('UNEXPECTED_RPC');
 };
 rpc.__g7MockOnly=true;
 let id=0;
 const a=mod.createAdapter({syntheticOnly:true,rpc,ui,
  getSession:()=> 'SYNTHETIC-TOKEN-NOT_REAL',
  idFactory:()=> 'G7-SYNTH-REQUEST-'+(++id)+'-20261101'});
 return {a,calls,value,rpc};
}
test('official client mode OFF, V153 active asset not changed',()=>{
 assert.equal(mod.mode,'DRAFT_DISABLED');
 assert.equal(ui.ACTIVE,false);
 const b=fs.readFileSync('assets/ess-20261007-rc13-hf8/abis-ess.bundle.js','utf8');
 assert.ok(!b.includes('G7_V174_LIFF_RELEASE_CANDIDATE_INLINE_START'));
});
test('real client cannot be created while Draft remains disabled',()=>{
 assert.throws(()=>mod.createAdapter({rpc:async()=>{},ui,getSession:()=>''}),
  /OFFICIAL_BUNDLE_NOT_RELEASED/);
});
test('auth Status must precede server-scoped Read; no client role authority',async()=>{
 const m=createMock(),data=await m.a.read(m.value.leaveId);
 assert.equal(data.case.actorRole,'SUPERVISOR');
 assert.deepEqual(m.calls.map(x=>x.action),['longLeaveExecV1Status','longLeaveExecV1Read']);
});
test('server feature disabled will not call Read or Action',async()=>{
 const m=createMock({disabled:true});
 await assert.rejects(m.a.read(m.value.leaveId),/BACKEND_FEATURE_NOT_ACTIVE/);
 assert.equal(m.calls.filter(x=>x.action==='longLeaveExecV1Read').length,0);
});
test('supervisor must confirm handover and cannot execute final approval',async()=>{
 const m=createMock();await m.a.read(m.value.leaveId);
 await assert.rejects(m.a.submit('SUPERVISOR_SUBMIT',{
  handoverConfirmed:false,handoverNote:'text'}),/SUPERVISOR_HANDOVER_REQUIRED/);
 await assert.rejects(m.a.submit('EXECUTIVE_APPROVE',{}),/SERVER_ACTOR_ROLE_MISMATCH/);
 assert.equal(m.calls.filter(x=>x.action==='longLeaveExecV1Action').length,0);
});
test('Supervisor submit includes source epoch/version and idempotency proof',async()=>{
 const m=createMock();await m.a.read(m.value.leaveId);
 const out=await m.a.submit('SUPERVISOR_SUBMIT',{
  handoverConfirmed:true,handoverNote:'安排交接'});
 assert.equal(out.transactionReceipt.phase,'COMMITTED');
 const called=m.calls.find(x=>x.action==='longLeaveExecV1Action');
 assert.equal(called.data.expectedVersion,2);
 assert.equal(called.data.groupId,m.value.groupId);
 assert.equal(called.data.sourceEpoch,m.value.sourceEpoch);
 assert.ok(called.data.idempotencyKey.length>=12);
});
test('executive return and rejection require reasons',async()=>{
 const m=createMock({caseData:{leaveId:'G7-SYNTH-LEAVE-001',
  actorRole:'EXECUTIVE',groupId:'G7-SYNTH-GRP-001',
  sourceEpoch:'G7-SYNTH-EPOCH-001',version:2,
  handoverVerified:true,authorityEligible:true}});
 await m.a.read(m.value.leaveId);
 await assert.rejects(m.a.submit('EXECUTIVE_RETURN',{reason:''}),/EXECUTIVE_REASON_REQUIRED/);
 await assert.rejects(m.a.submit('EXECUTIVE_REJECT',{}),/EXECUTIVE_REASON_REQUIRED/);
 const r=await m.a.submit('EXECUTIVE_APPROVE',{reason:''});
 assert.equal(r.transactionReceipt.phase,'COMMITTED');
});
test('unknown ACK permanently locks client from auto-resend',async()=>{
 const m=createMock({unknownAck:true});await m.a.read(m.value.leaveId);
 await assert.rejects(m.a.submit('SUPERVISOR_SUBMIT',{
  handoverConfirmed:true,handoverNote:'已安排'}),/ACK_LOST/);
 await assert.rejects(m.a.submit('SUPERVISOR_SUBMIT',{
  handoverConfirmed:true,handoverNote:'已安排'}),/UNKNOWN_ACK_NO_RETRY/);
 assert.equal(m.calls.filter(x=>x.action==='longLeaveExecV1Action').length,1);
 assert.equal(m.a.inspect().uncertain,true);
});
test('candidate bundle contains UI and bridge; official index unchanged',()=>{
 const b=fs.readFileSync('assets/ess-20261029-g7-q21-candidate/abis-ess.bundle.js','utf8');
 const i=fs.readFileSync('index.html','utf8');
 assert.match(b,/G7_V174_LIFF_RELEASE_CANDIDATE_INLINE_START/);
 assert.match(b,/abisG7V174MountCandidate_\(/);
 assert.ok(!i.includes('ess-20261029-g7-q21-candidate'));
});
test('no real LINE API calls or token storage introduced',()=>{
 const s=fs.readFileSync('features/longleave-exec-v1/g7-v174-release-client.js','utf8');
 assert.doesNotMatch(s,/UrlFetchApp|SpreadsheetApp|localStorage|fetch\s*\(/);
});

test('Q35 formal single LeaveID requires Backend verified three-workday receipt',async()=>{
 const m=createMock({groupReceipt:{memberCount:1}});
 await assert.rejects(m.a.read(m.value.leaveId),/SINGLE_LEAVE_POLICY_NOT_VERIFIED/);
 const good=createMock({groupReceipt:{memberCount:1,singleLeavePolicyVerified:true}});
 const result=await good.a.read(good.value.leaveId);
 assert.equal(result.groups[0].singleLeavePolicyVerified,true);
});
test('Q35 stale group source epoch, forged group or missing receipt prevents action',async()=>{
 for(const opts of [
  {groupReceipt:{sourceEpoch:'OLD-EPOCH'}},
  {groupReceipt:{groupId:'WRONG-GROUP'}},
  {groupReceipt:{memberCount:0}},
  {groupReceipt:{visibility:'HIDDEN'}},
  {omitGroups:true}
 ]){
  const m=createMock(opts);
  await assert.rejects(m.a.read(m.value.leaveId),/G7_V174_LIFF_HOLD_/);
  assert.equal(m.calls.filter(x=>x.action==='longLeaveExecV1Action').length,0);
 }
});
