/* G7 V173 LIFF display-only projection verifier, not installed in official V153. */
var ABIS_G7_V173_CLIENT_=(function(){
 'use strict';
 const ACTIVE=false;
 const READ_ACTIONS=['home','myLeaves','inbox','leaveDashboard','hrLeaveManagement',
  'hrLeaveDetail','teamManagement','managementReports','managementReportDetail',
  'managementReportsV2','managementReportDetailV2','managementReportExport',
  'managementReportSnapshots','taskSummary','taskInbox','notifications',
  'approvalActionStatus','departmentLeaveConflicts','proxyAvailability',
  'proxyAssignments','longLeaveExecV1Status'];
 const MUTATIONS=['ASSIGN_PROXY','PROXY_ACCEPT','MANAGER_APPROVE','TOP_APPROVE','REJECT',
  'EXECUTIVE_APPROVE','EXECUTIVE_RETURN','EXECUTIVE_REJECT',
  'SUPERVISOR_SUBMIT','SUPERVISOR_SUPPLEMENT','EMPLOYEE_AMEND','EMPLOYEE_CANCEL'];
 const INTRUSIVE=['主管ID快照','備註','代理工作說明','退回補充說明',
  '內部審查意見','交接說明','主管交接說明','handoverNote',
  'internalNote','internalReview','approvalAuditTrail','LineUserID','sessionToken'];
 function hold(x){throw Error('G7_V173_UI_HOLD_'+x);}
 function need(x,why){if(!x)hold(why);}
 function screen(action,data,options){
  need(options&&options.syntheticOnly===true&&options.testMode==='ACTIVE',
    'OFFLINE_ONLY');
  need(READ_ACTIONS.indexOf(action)>=0,'UNINVENTORIED_READ');
  need(data&&typeof data==='object'&&
    data.g7ServerProjection==='AUTHORITATIVE_COMMIT_AWARE'&&
    data.serverScopeApplied===true&&
    data.readTier==='OFFLINE_SYNTHETIC_SERVER_PROJECTION_ONLY',
    'SERVER_AUTHORITY_REQUIRED');
  need(['FULL_BEFORE','FULL_COMMITTED'].includes(data.g7Visibility),
    'INCOMPLETE_GROUP_VISIBILITY');
  need(Array.isArray(data.groups)&&Array.isArray(data.rows),'GROUP_ENVELOPE');
  const ids=new Set();
  let prepared=false;
  data.groups.forEach(g=>{
   need(g&&typeof g.groupId==='string'&&g.groupId&&
     !ids.has(g.groupId)&&typeof g.requestId==='string'&&g.requestId&&
     Number.isInteger(g.memberCount)&&g.memberCount>=2,'GROUP_RECEIPT');
   ids.add(g.groupId);
   need((g.phase==='PREPARED'&&g.visibility==='FULL_BEFORE')||
     (g.phase==='COMMITTED'&&g.visibility==='FULL_COMMITTED'),'GROUP_STATE');
   if(g.phase==='PREPARED')prepared=true;
  });
  need(!prepared||data.g7Visibility==='FULL_BEFORE','PREPARED_VISIBLE');
  need(prepared||data.g7Visibility==='FULL_COMMITTED','WRONG_VISIBILITY');
  need(options.role==='EMPLOYEE'||options.role==='MANAGER'||
    options.role==='TOP_MANAGER'||options.role==='HR'||options.role==='SYSTEM',
    'ROLE');
  data.rows.forEach(row=>{
   need(row&&typeof row==='object'&&typeof row['假單ID']==='string',
     'ROW_SHAPE');
   if(options.role==='EMPLOYEE'){
    need(typeof options.employeeId==='string'&&options.employeeId&&
      row['員工ID']===options.employeeId,'EMPLOYEE_SCOPE');
    INTRUSIVE.forEach(k=>need(!Object.prototype.hasOwnProperty.call(row,k),
      'INTERNAL_FIELD_'+k));
   }
  });
  return data;
 }
 function guardMutation(action){
  if(MUTATIONS.includes(action))hold('UNVERIFIED_SERVER_WRITER');
  hold('UNKNOWN_MUTATION');
 }
 function createOfflineHarness(){return {screen:screen,guardMutation:guardMutation};}
 function liveScreen(_action,data){return data;} // not mounted; does not authorize anything
 return {ACTIVE:ACTIVE,readerActions:READ_ACTIONS.slice(),
  mutationActions:MUTATIONS.slice(),liveScreen:liveScreen,
  createOfflineHarness:createOfflineHarness};
})();