/* ABIS ESS long-leave executive approval V1 UI candidate.
 * Isolated: not imported by deployed index.html, no LINE or network calls.
 * Integrator must supply authenticated transport after separate Stage authorization.
 */
(function(root){
'use strict';
var ACTIVE=false; // HARD HOLD until separately authorized release/provider Gate.
var WORDS={
 ZH:{review:'主管交接審查',confirm:'我已安排請假期間的工作交接',note:'交接安排說明（必填）',send:'完成審查並送最高主管',employeeReason:'員工請假原因',reviewHistory:'審批及補件歷程',proxy:'代理安排',approved:'核准',return:'退回主管補件',rejected:'駁回',reason:'審批意見／原因',pending:'審批中',supplement:'主管補件中',done:'已核准',failed:'已駁回',cancelled:'已取消',missing:'歷史資料未提供',loading:'處理中',error:'操作失敗',requestId:'RequestID'},
 VI:{review:'Xem xét bàn giao',confirm:'Tôi đã sắp xếp bàn giao công việc',note:'Ghi chú bàn giao (bắt buộc)',send:'Gửi lãnh đạo phê duyệt',employeeReason:'Lý do nghỉ phép',reviewHistory:'Lịch sử xét duyệt',proxy:'Người thay thế',approved:'Phê duyệt',return:'Trả lại quản lý bổ sung',rejected:'Từ chối',reason:'Ý kiến / lý do',pending:'Đang xét duyệt',supplement:'Quản lý bổ sung',done:'Đã phê duyệt',failed:'Đã từ chối',cancelled:'Đã hủy',missing:'Không có dữ liệu lịch sử',loading:'Đang xử lý',error:'Thao tác thất bại',requestId:'RequestID'},
 TH:{review:'ตรวจสอบการส่งมอบงาน',confirm:'ฉันได้จัดเตรียมการส่งมอบงานแล้ว',note:'รายละเอียดการส่งมอบงาน (จำเป็น)',send:'ส่งให้ผู้บริหารอนุมัติ',employeeReason:'เหตุผลการลา',reviewHistory:'ประวัติการพิจารณา',proxy:'ผู้ปฏิบัติงานแทน',approved:'อนุมัติ',return:'ส่งกลับให้หัวหน้างานเพิ่มเติม',rejected:'ปฏิเสธ',reason:'ความคิดเห็น / เหตุผล',pending:'รอการอนุมัติ',supplement:'หัวหน้างานเพิ่มเติมข้อมูล',done:'อนุมัติแล้ว',failed:'ปฏิเสธแล้ว',cancelled:'ยกเลิกแล้ว',missing:'ไม่มีข้อมูลย้อนหลัง',loading:'กำลังดำเนินการ',error:'ดำเนินการไม่สำเร็จ',requestId:'RequestID'}
};
function esc(s){return String(s===null||s===undefined?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function w(lang){return WORDS[lang]||WORDS.ZH;}
function line(label,value){return '<div class="llex-v1-line"><strong>'+esc(label)+'</strong> '+esc(value||'')+'</div>';}
function historyHtml(records,lang){var t=w(lang);return '<section class="llex-v1-history" aria-label="'+esc(t.reviewHistory)+'"><h3>'+esc(t.reviewHistory)+'</h3>'+
 (records||[]).map(function(e){return '<article class="llex-v1-event">'+line('Event',e.type)+line('At',e.at)+line('Actor',e.actorId)+line('Status',e.to)+'</article>';}).join('')+'</section>';}
function supervisorHtml(data,lang){var t=w(lang),d=data||{};return '<section class="llex-v1-panel" role="group"><h3>'+esc(t.review)+'</h3>'+line(t.employeeReason,d.originalReason)+line(t.proxy,d.proxyStatus||t.missing)+
 '<label><input type="checkbox" data-llex="handover" /> '+esc(t.confirm)+'</label><label>'+esc(t.note)+'<textarea data-llex="handoverNote" required></textarea></label>'+historyHtml(d.history,lang)+
 '<button type="button" data-llex-action="SUPERVISOR_SUBMIT">'+esc(t.send)+'</button><p role="status" data-llex="status"></p></section>';}
function executiveHtml(data,lang){var t=w(lang),d=data||{};return '<section class="llex-v1-panel" role="group"><h3>'+esc(t.reviewHistory)+'</h3>'+line(t.employeeReason,d.originalReason)+
 line(t.review,d.supervisorReviewStatus||t.missing)+line(t.note,d.handoverNote||t.missing)+line(t.proxy,d.proxyStatus||t.missing)+historyHtml(d.history,lang)+
 '<label>'+esc(t.reason)+'<textarea data-llex="executiveReason"></textarea></label><div class="llex-v1-actions"><button type="button" data-llex-action="EXECUTIVE_RETURN">'+esc(t.return)+'</button><button type="button" data-llex-action="EXECUTIVE_REJECT">'+esc(t.rejected)+'</button><button type="button" data-llex-action="EXECUTIVE_APPROVE">'+esc(t.approved)+'</button></div><p role="status" data-llex="status"></p></section>';}
function employeeHtml(data,lang){var t=w(lang),d=data||{},labels={PENDING_SUPERVISOR:t.pending,PENDING_EXECUTIVE:t.pending,PENDING_SUPERVISOR_SUPPLEMENT:t.supplement,APPROVED:t.done,REJECTED:t.failed,CANCELLED:t.cancelled,CANCELLED_RECONCILIATION:t.cancelled};
 return '<section class="llex-v1-employee" role="status">'+line('Status',labels[d.status]||t.pending)+(d.status==='REJECTED'?line(t.reason,d.rejectionReason):'')+'</section>';}
function mount(el,kind,data,lang,transport){if(!el||typeof el.innerHTML!=='string')throw new Error('LLEX_MOUNT_REQUIRED');if(!ACTIVE)throw new Error('LLEX_FEATURE_HOLD');
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
var api={ACTIVE:ACTIVE,escape:esc,words:w,historyHtml:historyHtml,supervisorHtml:supervisorHtml,executiveHtml:executiveHtml,employeeHtml:employeeHtml,mount:mount};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.ABIS_LONG_LEAVE_EXEC_V1_UI=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{}));
