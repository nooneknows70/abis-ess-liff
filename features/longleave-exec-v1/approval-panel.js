/* ABIS ESS long-leave executive approval V1 UI candidate.
 * Isolated: not imported by deployed index.html, no LINE or network calls.
 * Integrator must supply authenticated transport after separate Stage authorization.
 */
(function(root){
'use strict';
var ACTIVE=false; // HARD HOLD until separately authorized release/provider Gate.
var WORDS={
 ZH:{review:'主管交接審查',confirm:'我已安排請假期間的工作交接',note:'交接安排說明（必填）',send:'完成審查並送最高主管',employeeReason:'員工請假原因',reviewHistory:'審批及補件歷程',proxy:'代理安排',approved:'核准',return:'退回主管補件',rejected:'駁回',reason:'審批意見／原因',pending:'審批中',supplement:'主管補件中',done:'已核准',failed:'已駁回',cancelled:'已取消',amendPending:'原核准有效，變更審批中',amendRejected:'變更遭駁回，原核准仍有效',supplementSend:'補件後重新送最高主管',missing:'歷史資料未提供',loading:'處理中',error:'操作失敗',requestId:'RequestID',q42Internal:'長假已核准（內部生效）',q42Pending:'出勤／薪資／LINE 尚未同步，HR 待對帳',q42Unknown:'核准交易仍待查核，不能視為已完成',q42List:'HR 長假外部待對帳清單',q42Empty:'沒有符合條件的待對帳案件',q42Leave:'假單 ID',q42Group:'群組 ID'},
 VI:{review:'Xem xét bàn giao',confirm:'Tôi đã sắp xếp bàn giao công việc',note:'Ghi chú bàn giao (bắt buộc)',send:'Gửi lãnh đạo phê duyệt',employeeReason:'Lý do nghỉ phép',reviewHistory:'Lịch sử xét duyệt',proxy:'Người thay thế',approved:'Phê duyệt',return:'Trả lại quản lý bổ sung',rejected:'Từ chối',reason:'Ý kiến / lý do',pending:'Đang xét duyệt',supplement:'Quản lý bổ sung',done:'Đã phê duyệt',failed:'Đã từ chối',cancelled:'Đã hủy',amendPending:'Phê duyệt cũ vẫn hiệu lực, thay đổi đang chờ',amendRejected:'Thay đổi bị từ chối, phê duyệt cũ vẫn hiệu lực',supplementSend:'Gửi lại sau khi bổ sung',missing:'Không có dữ liệu lịch sử',loading:'Đang xử lý',error:'Thao tác thất bại',requestId:'RequestID',q42Internal:'Nghỉ dài ngày đã được phê duyệt nội bộ',q42Pending:'Chấm công, lương và LINE chưa đồng bộ; HR cần đối soát',q42Unknown:'Giao dịch phê duyệt chưa được xác minh',q42List:'HR - danh sách chờ đối soát',q42Empty:'Không có hồ sơ cần đối soát',q42Leave:'Mã đơn nghỉ',q42Group:'Mã nhóm'},
 TH:{review:'ตรวจสอบการส่งมอบงาน',confirm:'ฉันได้จัดเตรียมการส่งมอบงานแล้ว',note:'รายละเอียดการส่งมอบงาน (จำเป็น)',send:'ส่งให้ผู้บริหารอนุมัติ',employeeReason:'เหตุผลการลา',reviewHistory:'ประวัติการพิจารณา',proxy:'ผู้ปฏิบัติงานแทน',approved:'อนุมัติ',return:'ส่งกลับให้หัวหน้างานเพิ่มเติม',rejected:'ปฏิเสธ',reason:'ความคิดเห็น / เหตุผล',pending:'รอการอนุมัติ',supplement:'หัวหน้างานเพิ่มเติมข้อมูล',done:'อนุมัติแล้ว',failed:'ปฏิเสธแล้ว',cancelled:'ยกเลิกแล้ว',amendPending:'อนุมัติเดิมยังมีผล รอตรวจสอบการแก้ไข',amendRejected:'การแก้ไขถูกปฏิเสธ อนุมัติเดิมยังมีผล',supplementSend:'ส่งใหม่หลังเพิ่มเติมข้อมูล',missing:'ไม่มีข้อมูลย้อนหลัง',loading:'กำลังดำเนินการ',error:'ดำเนินการไม่สำเร็จ',requestId:'RequestID',q42Internal:'อนุมัติการลาระยะยาวภายในแล้ว',q42Pending:'ข้อมูลเวลา เงินเดือน และ LINE ยังไม่ซิงก์ รอ HR ตรวจสอบ',q42Unknown:'ธุรกรรมอนุมัติยังไม่ผ่านการตรวจสอบ',q42List:'รายการรอ HR ตรวจสอบ',q42Empty:'ไม่มีรายการรอตรวจสอบ',q42Leave:'รหัสใบลา',q42Group:'รหัสกลุ่ม'}
};
function esc(s){return String(s===null||s===undefined?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function w(lang){var key=String(lang||'').toLowerCase();if(key==='zh-tw'||key==='zh')return WORDS.ZH;if(key==='vi-vn'||key==='vi')return WORDS.VI;if(key==='th-th'||key==='th')return WORDS.TH;return WORDS[lang]||WORDS.ZH;}
function line(label,value){return '<div class="llex-v1-line"><strong>'+esc(label)+'</strong> '+esc(value||'')+'</div>';}
function historyHtml(records,lang){var t=w(lang);return '<section class="llex-v1-history" aria-label="'+esc(t.reviewHistory)+'"><h3>'+esc(t.reviewHistory)+'</h3>'+
 (Array.isArray(records)?records:[]).map(function(e){return '<article class="llex-v1-event">'+line('Event',e.type)+line('At',e.at)+line('Actor',e.actorId)+line('Status',e.to)+'</article>';}).join('')+'</section>';}
/* Q42=A: presentation only. A real authenticated Backend must construct this envelope.
 * Browser flags cannot authorize leave, HR access, or external reconciliation. */
function q42Verified(envelope){
 var r=envelope||{},c=r.case||{},receipt=r.transactionReceipt||{},ext=r.externalSync||{};
 if(r.g7ServerProjection!=='AUTHORITATIVE_COMMIT_AWARE'||r.serverScopeApplied!==true||
    r.readTier!=='FORMAL_PROVIDER_VERIFIED'||r.g7Visibility!=='FULL_COMMITTED'||
    !c.leaveId||!c.groupId||!c.sourceEpoch||
    ['APPROVED','已核准'].indexOf(c.status)<0)return false;
 var matches=Array.isArray(r.groups)?r.groups.filter(function(g){
   return g&&g.groupId===c.groupId&&g.sourceEpoch===c.sourceEpoch;
 }):[];
 if(matches.length!==1)return false;
 var group=matches[0];
 if(group.phase!=='COMMITTED'||group.visibility!=='FULL_COMMITTED'||
    !group.requestId||receipt.phase!=='COMMITTED'||
    receipt.requestId!==group.requestId||receipt.outboxReleased!==false)return false;
 if(ext.status!=='SUPPRESSED_PENDING_EXTERNAL_RECONCILIATION'||
    ext.hrReconciliationRequired!==true||!ext.domains)return false;
 return ['ATTENDANCE','PAYROLL','LINE'].every(function(k){
   return ext.domains[k]==='PENDING_HR_RECONCILIATION';
 });
}
function deferredNoticeHtml(envelope,lang){
 if(!q42Verified(envelope))return '';
 var t=w(lang);
 return '<section class="llex-v1-q42-deferred" role="status" data-llex-q42="external-pending">'+
   '<strong>'+esc(t.q42Internal)+'</strong><p>'+esc(t.q42Pending)+'</p></section>';
}
/* Read-only HR renderer: caller MUST be an authenticated, role-checked Backend
 * projection. This renderer is not an HR authorization mechanism or sync action. */
function hrWorklistHtml(envelope,lang){
 var r=envelope||{},identity=r.identity||{},t=w(lang);
 if(r.g7ServerProjection!=='AUTHORITATIVE_COMMIT_AWARE'||
    r.serverScopeApplied!==true||r.readTier!=='FORMAL_PROVIDER_VERIFIED'||
    identity.serverVerified!==true||identity.role!=='HR'||
    identity.hrReconciliationAllowed!==true||!Array.isArray(r.items))
   throw Error('G7_Q42_HR_SERVER_SCOPE_REQUIRED');
 var seen={};
 var items=r.items.map(function(item){
   if(!q42Verified(item))throw Error('G7_Q42_HR_UNVERIFIED_COMMIT');
   var c=item.case,key=String(c.leaveId);
   if(seen[key])throw Error('G7_Q42_HR_DUPLICATE_LEAVE');
   seen[key]=true;
   return '<li>'+line(t.q42Leave,key)+line(t.q42Group,c.groupId)+
     '<strong>'+esc(t.q42Pending)+'</strong></li>';
 });
 return '<section class="llex-v1-q42-hr-readonly" data-llex-q42="hr-readonly"><h3>'+
   esc(t.q42List)+'</h3>'+(items.length?'<ul>'+items.join('')+'</ul>':
   '<p>'+esc(t.q42Empty)+'</p>')+'</section>';
}
function supervisorHtml(data,lang){var t=w(lang),d=data||{};return '<section class="llex-v1-panel" role="group"><h3>'+esc(t.review)+'</h3>'+line(t.employeeReason,d.originalReason)+line(t.proxy,d.proxyStatus||t.missing)+
 '<label><input type="checkbox" data-llex="handover" /> '+esc(t.confirm)+'</label><label>'+esc(t.note)+'<textarea data-llex="handoverNote" required></textarea></label>'+historyHtml(d.history,lang)+
 '<button type="button" data-llex-action="'+(d.status==='PENDING_SUPERVISOR_SUPPLEMENT'?'SUPERVISOR_SUPPLEMENT':'SUPERVISOR_SUBMIT')+'">'+esc(d.status==='PENDING_SUPERVISOR_SUPPLEMENT'?t.supplementSend:t.send)+'</button><p role="status" data-llex="status"></p></section>';}
function executiveHtml(data,lang){var t=w(lang),d=data||{};return '<section class="llex-v1-panel" role="group"><h3>'+esc(t.reviewHistory)+'</h3>'+line(t.employeeReason,d.originalReason)+
 line(t.review,d.supervisorReviewStatus||t.missing)+line(t.note,d.handoverNote||t.missing)+line(t.proxy,d.proxyStatus||t.missing)+historyHtml(d.history,lang)+
 '<label>'+esc(t.reason)+'<textarea data-llex="executiveReason"></textarea></label><div class="llex-v1-actions"><button type="button" data-llex-action="EXECUTIVE_RETURN">'+esc(t.return)+'</button><button type="button" data-llex-action="EXECUTIVE_REJECT">'+esc(t.rejected)+'</button><button type="button" data-llex-action="EXECUTIVE_APPROVE">'+esc(t.approved)+'</button></div><p role="status" data-llex="status"></p></section>';}
function employeeHtml(data,lang){var t=w(lang),d=data||{},labels={PENDING_SUPERVISOR:t.pending,PENDING_EXECUTIVE:t.pending,PENDING_SUPERVISOR_SUPPLEMENT:t.supplement,APPROVED:t.done,REJECTED:t.failed,CANCELLED:t.cancelled,CANCELLED_RECONCILIATION:t.cancelled};
 var effective=!!d.effectiveApprovalExists,reviewing=["PENDING_SUPERVISOR","PENDING_EXECUTIVE","PENDING_SUPERVISOR_SUPPLEMENT"].indexOf(d.status)>=0;
 var envelope=d.g7Envelope||null,verified=q42Verified(envelope);
 var status=effective&&reviewing?t.amendPending:(labels[d.status]||t.pending);
 if((d.status==='APPROVED'||d.status==='已核准')&&!verified)status=t.q42Unknown;
 return '<section class="llex-v1-employee" role="status">'+line('Status',status)+(d.status==='REJECTED'?line(t.reason,d.rejectionReason):'')+
   (d.amendmentOutcome==='REJECTED'?line(t.amendRejected,d.amendmentRejectionReason):'')+
   (verified?deferredNoticeHtml(envelope,lang):'')+'</section>';}
function mount(el,kind,data,lang,transport){if(!el||typeof el.innerHTML!=='string')throw new Error('LLEX_MOUNT_REQUIRED');if(!ACTIVE)throw new Error('LLEX_FEATURE_HOLD');
 if(['employee','supervisor','executive'].indexOf(kind)<0)throw new Error('LLEX_ROLE_NOT_SUPPORTED');
 if(kind==='employee'){el.innerHTML=employeeHtml(data,lang);return;}
 if(typeof transport!=='function')throw new Error('LLEX_TRANSPORT_REQUIRED');el.innerHTML=(kind==='supervisor'?supervisorHtml:executiveHtml)(data,lang);
 var buttons=Array.from(el.querySelectorAll('[data-llex-action]'));buttons.forEach(function(btn){btn.addEventListener('click',async function(){
 var action=btn.getAttribute('data-llex-action'),note=el.querySelector('[data-llex="handoverNote"]'),check=el.querySelector('[data-llex="handover"]'),reason=el.querySelector('[data-llex="executiveReason"]');
 if(kind==='supervisor'&&(!check||!check.checked||!note||!note.value.trim()))return;
 if((action==='EXECUTIVE_RETURN'||action==='EXECUTIVE_REJECT')&&(!reason||!reason.value.trim()))return;
 var payload=kind==='supervisor'?{handoverConfirmed:true,handoverNote:note.value}:{reason:reason?reason.value:''};
 var status=el.querySelector('[data-llex="status"]');buttons.forEach(function(b){b.disabled=true});if(status)status.textContent=w(lang).loading;
 try{await transport(action,payload);if(status)status.textContent='OK';}catch(error){if(status)status.textContent=w(lang).error+' '+String(error&&error.requestId||'');}finally{buttons.forEach(function(b){b.disabled=false});}
 });});}
var api={ACTIVE:ACTIVE,escape:esc,words:w,historyHtml:historyHtml,supervisorHtml:supervisorHtml,executiveHtml:executiveHtml,employeeHtml:employeeHtml,mount:mount,q42Verified:q42Verified,deferredNoticeHtml:deferredNoticeHtml,hrWorklistHtml:hrWorklistHtml};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.ABIS_LONG_LEAVE_EXEC_V1_UI=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{}));
