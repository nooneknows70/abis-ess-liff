'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('features/longleave-exec-v1/g7-v173-client-projection.js','utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(source,ctx);
const api=ctx.ABIS_G7_V173_CLIENT_,f=api.createOfflineHarness();
const bundle=fs.readFileSync('assets/ess-20261029-g7-q21-candidate/abis-ess.bundle.js','utf8');
const read=Array.from(api.readerActions);
const mk=(phase='COMMITTED')=>({
 g7ServerProjection:'AUTHORITATIVE_COMMIT_AWARE',
 readTier:'OFFLINE_SYNTHETIC_SERVER_PROJECTION_ONLY',serverScopeApplied:true,
 g7Visibility:phase==='PREPARED'?'FULL_BEFORE':'FULL_COMMITTED',
 groups:[{groupId:'G7-SYNTH-GRP-A',requestId:'G7-SYNTH-REQ-A',
  memberCount:2,phase,visibility:phase==='PREPARED'?'FULL_BEFORE':'FULL_COMMITTED'}],
 rows:[{'假單ID':'G7-SYNTH-LEAVE-1','員工ID':'G7-SYNTH-EMP','目前狀態':'待最高主管'}]
});
const opts={syntheticOnly:true,testMode:'ACTIVE',role:'EMPLOYEE',employeeId:'G7-SYNTH-EMP'};
test('candidate does not mount or modify real V153 historical assets',()=>{
 assert.equal(api.ACTIVE,false);
 assert.ok(!fs.readFileSync('index.html','utf8').includes('g7-v173-client-projection'));
 assert.ok(!fs.readFileSync('assets/ess-20261007-rc13-hf8/abis-ess.bundle.js','utf8').includes('G7_V173'));
});
test('all 21 Backend G7 API reader routes have LIFF candidate fence',()=>{
 assert.equal(read.length,21);
 const old=bundle.indexOf('// G7 Q21 formal transaction UI seam.');
 const end=bundle.indexOf('function call(action,payload){',old);
 const part=bundle.slice(old,end);
 for(const name of read)assert.ok(part.includes("'"+name+"'"),name);
});
test('single verified PREPARED shows only full BEFORE; COMMITTED full result',()=>{
 assert.equal(f.screen('myLeaves',mk('PREPARED'),opts).g7Visibility,'FULL_BEFORE');
 assert.equal(f.screen('hrLeaveDetail',mk('COMMITTED'),opts).g7Visibility,'FULL_COMMITTED');
});
test('role-specific view refuses employee internal supervisor notes and foreign employee ID',()=>{
 const a=mk();a.rows[0].internalNote='private';
 assert.throws(()=>f.screen('myLeaves',a,opts),/INTERNAL_FIELD_internalNote/);
 const b=mk();b.rows[0]['員工ID']='OTHER';
 assert.throws(()=>f.screen('myLeaves',b,opts),/EMPLOYEE_SCOPE/);
});
test('missing, forged, partial and unknown server projection are never accepted',()=>{
 for(const mutate of [
  x=>x.g7ServerProjection='CLIENT_COMMIT_AWARE',
  x=>x.readTier='PRODUCTION_PRETEND_PASS',
  x=>x.g7Visibility='PARTIAL',
  x=>x.serverScopeApplied=false,
  x=>x.groups[0].phase='UNCERTAIN',
  x=>x.groups[0].memberCount=1,
  x=>x.groups[0].visibility='HIDDEN',
  x=>x.groups.push(x.groups[0])
 ]){
  const x=mk();mutate(x);assert.throws(()=>f.screen('inbox',x,opts),/G7_V173_UI_HOLD_/);
 }
});
test('PREPARED member cannot be mistakenly shown as final COMMITTED',()=>{
 const x=mk('PREPARED');x.g7Visibility='FULL_COMMITTED';
 assert.throws(()=>f.screen('myLeaves',x,opts),/PREPARED_VISIBLE/);
});
test('every declared read action works only with offline trusted envelope',()=>{
 for(const a of read)assert.equal(f.screen(a,mk(),opts).serverScopeApplied,true,a);
 assert.throws(()=>f.screen('unknownLeaveReader',mk(),opts),/UNINVENTORIED_READ/);
 assert.throws(()=>f.screen('myLeaves',mk(),{...opts,syntheticOnly:false}),/OFFLINE_ONLY/);
});
test('all mutation actions blocked until real Backend writer separately authorized',()=>{
 for(const a of api.mutationActions)assert.throws(()=>f.guardMutation(a),/UNVERIFIED_SERVER_WRITER/,a);
});
test('new candidate does not fake browser login, send LINE or read token',()=>{
 for(const s of ['UrlFetchApp.','SpreadsheetApp.','fetch(', 'liff.sendMessages']){
  assert.ok(!source.includes(s),s);
 }
});

test('Q35 one-member group accepted only with verified three-workday server receipt',()=>{
 const a=mk();a.groups[0].memberCount=1;
 assert.throws(()=>f.screen('myLeaves',a,opts),/SINGLE_LEAVE_POLICY_NOT_VERIFIED/);
 a.groups[0].singleLeavePolicyVerified=false;
 assert.throws(()=>f.screen('myLeaves',a,opts),/SINGLE_LEAVE_POLICY_NOT_VERIFIED/);
 a.groups[0].singleLeavePolicyVerified=true;
 assert.equal(f.screen('myLeaves',a,opts).groups[0].memberCount,1);
});
