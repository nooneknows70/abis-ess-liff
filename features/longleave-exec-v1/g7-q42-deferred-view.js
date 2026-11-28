/* ABIS ESS G7 Q42=A new-case only internal-approval/external-deferred view.
 * SOURCE CANDIDATE ONLY; deliberately separate from frozen G7 V1 approval-panel.js.
 * Pure escaping/formatting. Never grants HR ACL or approves a leave.
 * No Google, LINE, OAuth, session token, fetch, or external write.
 */
(function(root){
'use strict';
var MODE='DRAFT_DISABLED';
var WORDS={
 ZH:{internal:'長假已核准（內部生效）',pending:'出勤／薪資／LINE 尚未同步，HR 待對帳',unknown:'核准交易仍待查核，不能視為已完成',list:'HR 長假外部待對帳清單',empty:'沒有符合條件的待對帳案件',leave:'假單 ID',group:'群組 ID',employee:'員工 ID',period:'請假期間',hours:'核准時數',receipt:'交易憑證'},
 VI:{internal:'Nghỉ dài ngày đã được phê duyệt nội bộ',pending:'Chấm công, lương và LINE chưa đồng bộ; HR cần đối soát',unknown:'Giao dịch phê duyệt chưa được xác minh',list:'HR - danh sách chờ đối soát',empty:'Không có hồ sơ cần đối soát',leave:'Mã đơn nghỉ',group:'Mã nhóm',employee:'Mã nhân viên',period:'Thời gian nghỉ',hours:'Số giờ được duyệt',receipt:'Mã giao dịch'},
 TH:{internal:'อนุมัติการลาระยะยาวภายในแล้ว',pending:'ข้อมูลเวลา เงินเดือน และ LINE ยังไม่ซิงก์ รอ HR ตรวจสอบ',unknown:'ธุรกรรมอนุมัติยังไม่ผ่านการตรวจสอบ',list:'รายการรอ HR ตรวจสอบ',empty:'ไม่มีรายการรอตรวจสอบ',leave:'รหัสใบลา',group:'รหัสกลุ่ม',employee:'รหัสพนักงาน',period:'ช่วงวันลา',hours:'ชั่วโมงที่อนุมัติ',receipt:'หลักฐานธุรกรรม'}
};
function words(lang){var k=String(lang||'').toLowerCase();return k==='vi'||k==='vi-vn'?WORDS.VI:k==='th'||k==='th-th'?WORDS.TH:WORDS.ZH;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function line(label,value){return '<div class="llex-q42-row"><strong>'+esc(label)+'</strong> '+esc(value)+'</div>';}
function q42Verified(envelope){
 var r=envelope||{},c=r.case||{},receipt=r.transactionReceipt||{},ext=r.externalSync||{};
 if(r.backendRouteBound!==true||r.g7ServerProjection!=='AUTHORITATIVE_COMMIT_AWARE'||
    r.serverScopeApplied!==true||r.readTier!=='FORMAL_PROVIDER_VERIFIED'||
    r.g7Visibility!=='FULL_COMMITTED'||!c.leaveId||!c.groupId||!c.sourceEpoch||
    ['APPROVED','已核准'].indexOf(c.status)<0)return false;
 var groups=Array.isArray(r.groups)?r.groups.filter(function(g){return g&&g.groupId===c.groupId&&g.sourceEpoch===c.sourceEpoch;}):[];
 if(groups.length!==1)return false;
 var g=groups[0];
 if(g.phase!=='COMMITTED'||g.visibility!=='FULL_COMMITTED'||!g.requestId||
    !Number.isInteger(g.memberCount)||g.memberCount<1||
    (g.memberCount===1&&g.singleLeavePolicyVerified!==true)||
    receipt.phase!=='COMMITTED'||receipt.requestId!==g.requestId||
    receipt.outboxReleased!==false||!/^[0-9a-f]{64}$/.test(String(receipt.eventHash||'')))return false;
 if(ext.status!=='SUPPRESSED_PENDING_EXTERNAL_RECONCILIATION'||
    ext.hrReconciliationRequired!==true||!ext.domains)return false;
 return ['ATTENDANCE','PAYROLL','LINE'].every(function(k){return ext.domains[k]==='PENDING_HR_RECONCILIATION';});
}
function deferredNoticeHtml(envelope,lang){
 if(!q42Verified(envelope))return '';
 var t=words(lang);
 return '<section class="llex-q42-deferred" role="status" data-llex-q42="external-pending"><strong>'+esc(t.internal)+'</strong><p>'+esc(t.pending)+'</p></section>';
}
/* Old cases without a G7 envelope retain frozen UI output. For a G7
 * new-case "APPROVED" envelope, unknown/mismatched proof NEVER renders success. */
function decorateEmployeeHtml(original,caseData,envelope,lang){
 var base=String(original||''),c=caseData||{};
 if(!envelope||['APPROVED','已核准'].indexOf(c.status)<0)return base;
 if(envelope.case&&envelope.case.leaveId===c.leaveId&&q42Verified(envelope))
   return base+deferredNoticeHtml(envelope,lang);
 return '<section role="status" class="llex-q42-unverified">'+esc(words(lang).unknown)+'</section>';
}
function hrWorklistHtml(envelope,lang){
 var r=envelope||{},identity=r.identity||{},t=words(lang);
 if(r.backendRouteBound!==true||r.g7ServerProjection!=='AUTHORITATIVE_COMMIT_AWARE'||
    r.serverScopeApplied!==true||r.readTier!=='FORMAL_PROVIDER_VERIFIED'||
    identity.serverVerified!==true||identity.role!=='HR'||identity.hrReconciliationAllowed!==true||
    !Array.isArray(r.items)||r.items.length>1000)throw Error('G7_Q42_HR_SERVER_SCOPE_REQUIRED');
 var seen={};
 var items=r.items.map(function(item){
   if(!q42Verified(item))throw Error('G7_Q42_HR_UNVERIFIED_COMMIT');
   var c=item.case,key=String(c.leaveId);
   if(seen[key])throw Error('G7_Q42_HR_DUPLICATE_LEAVE');
   seen[key]=true;
   if(!c.employeeId||!c.leaveStartDate||!c.leaveEndDate||
      !Number.isFinite(c.systemHours)||c.systemHours<=0)
     throw Error('G7_Q42_HR_CASE_DETAILS_UNVERIFIED');
   return '<li>'+line(t.leave,key)+line(t.employee,c.employeeId)+
     line(t.period,String(c.leaveStartDate)+' ~ '+String(c.leaveEndDate))+
     line(t.hours,String(c.systemHours))+line(t.group,c.groupId)+
     line(t.receipt,item.transactionReceipt.requestId)+
     '<strong>'+esc(t.pending)+'</strong></li>';
 });
 return '<section class="llex-q42-hr-readonly" data-llex-q42="hr-readonly"><h3>'+esc(t.list)+
    '</h3>'+(items.length?'<ul>'+items.join('')+'</ul>':'<p>'+esc(t.empty)+'</p>')+'</section>';
}
var api={mode:MODE,q42Verified:q42Verified,deferredNoticeHtml:deferredNoticeHtml,
 decorateEmployeeHtml:decorateEmployeeHtml,hrWorklistHtml:hrWorklistHtml};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.ABIS_G7_Q42_DEFERRED_VIEW_=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{}));
