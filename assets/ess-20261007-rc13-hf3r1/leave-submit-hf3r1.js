/* ABIS ESS Leave Submit Hotfix HF3 | viewport modal confirmation */
const ABIS_LEAVE_SUBMIT_HF3_VERSION_='ABIS_LEAVE_SUBMIT_HOTFIX_HF3_R1_VIEWPORT_MODAL_20261007';
const ABIS_LEAVE_SUBMIT_HF3_RELEASE_='P5A1_RM_FAST4_STATIC_ASSET_RC1_3_HF3_R1_LEAVE_SUBMIT_MODAL_20261007';

const ABIS_LEAVE_SUBMIT_HF3_STATE_={
  open:false,
  submitting:false,
  context:null,
  opener:null,
  scrollY:0,
  bodyStyle:null,
  htmlOverflow:'',
  historyPushed:false,
  historyNonce:'',
  ignoreNextPop:false
};

function p5a1LeaveSubmitHf3Text_(key){
  const zh={
    title:'確認送出假單？',
    resubmitTitle:'確認重新送出假單？',
    intro:'請確認以下請假資料正確。送出後將進入簽核流程。',
    resubmitIntro:'請確認以下請假資料正確。重新送出後將再次進入簽核流程。',
    leaveType:'假別',applicationType:'申請型態',date:'日期',time:'時間',proxy:'代理人',handover:'代理工作說明',reason:'申請原因',emergency:'緊急請假',attachments:'附件',attachmentUnit:'個',yes:'是',none:'—',
    conflictTitle:'人力重疊提醒',conflictPrefix:'同部門同時段已有',conflictSuffix:'請假。',conflictHint:'此為提醒，不影響本假單送出。',
    cancel:'取消',confirm:'確認送出',confirmResubmit:'確認重新送出',submitting:'送出中…',checking:'檢查中…',
    failedTitle:'送出失敗',failedDetail:'系統目前無法完成送出，請確認訊息後重試，或取消後修正假單。',
    unknownTitle:'結果仍未確認',unknownDetail:'系統已使用同一個 RequestID 回查，但目前仍無法確認結果。若內容未變再次送出，系統會沿用同一 RequestID，不會建立第二張假單。',
    recoveredTitle:'假單已送出',recoveredDetail:'系統已確認這筆假單成功建立，正在前往「我的假單」。'
  };
  const vi={
    title:'Xác nhận gửi đơn nghỉ?',
    resubmitTitle:'Xác nhận gửi lại đơn nghỉ?',
    intro:'Vui lòng kiểm tra thông tin nghỉ phép bên dưới. Sau khi gửi, đơn sẽ vào quy trình phê duyệt.',
    resubmitIntro:'Vui lòng kiểm tra thông tin nghỉ phép bên dưới. Sau khi gửi lại, đơn sẽ vào lại quy trình phê duyệt.',
    leaveType:'Loại nghỉ',applicationType:'Hình thức đăng ký',date:'Ngày',time:'Thời gian',proxy:'Người thay thế',handover:'Nội dung bàn giao',reason:'Lý do',emergency:'Nghỉ khẩn cấp',attachments:'Tệp đính kèm',attachmentUnit:'tệp',yes:'Có',none:'—',
    conflictTitle:'Nhắc nhở trùng nhân lực',conflictPrefix:'Trong cùng bộ phận và thời gian đã có',conflictSuffix:'xin nghỉ.',conflictHint:'Đây chỉ là nhắc nhở và không ngăn việc gửi đơn.',
    cancel:'Hủy',confirm:'Xác nhận gửi',confirmResubmit:'Xác nhận gửi lại',submitting:'Đang gửi…',checking:'Đang kiểm tra…',
    failedTitle:'Gửi không thành công',failedDetail:'Hệ thống hiện chưa thể hoàn tất việc gửi. Hãy kiểm tra thông báo rồi thử lại, hoặc hủy để sửa đơn.',
    unknownTitle:'Chưa xác nhận được kết quả',unknownDetail:'Hệ thống đã kiểm tra bằng cùng RequestID nhưng vẫn chưa xác nhận được kết quả. Nếu nội dung không đổi, lần gửi lại sẽ dùng cùng RequestID và không tạo đơn thứ hai.',
    recoveredTitle:'Đơn đã được gửi',recoveredDetail:'Hệ thống đã xác nhận đơn được tạo thành công và đang mở “Đơn của tôi”.'
  };
  const th={
    title:'ยืนยันการส่งใบลา?',
    resubmitTitle:'ยืนยันการส่งใบลาอีกครั้ง?',
    intro:'โปรดตรวจสอบข้อมูลการลาด้านล่าง เมื่อส่งแล้วใบลาจะเข้าสู่กระบวนการอนุมัติ',
    resubmitIntro:'โปรดตรวจสอบข้อมูลการลาด้านล่าง เมื่อส่งอีกครั้งใบลาจะเข้าสู่กระบวนการอนุมัติอีกครั้ง',
    leaveType:'ประเภทการลา',applicationType:'รูปแบบการลา',date:'วันที่',time:'เวลา',proxy:'ผู้แทน',handover:'รายละเอียดการส่งมอบงาน',reason:'เหตุผล',emergency:'ลาฉุกเฉิน',attachments:'ไฟล์แนบ',attachmentUnit:'ไฟล์',yes:'ใช่',none:'—',
    conflictTitle:'แจ้งเตือนกำลังคนซ้ำช่วงเวลา',conflictPrefix:'ในแผนกและช่วงเวลาเดียวกันมี',conflictSuffix:'ลางานอยู่',conflictHint:'นี่เป็นเพียงการแจ้งเตือน และไม่ขัดขวางการส่งใบลา',
    cancel:'ยกเลิก',confirm:'ยืนยันส่ง',confirmResubmit:'ยืนยันส่งอีกครั้ง',submitting:'กำลังส่ง…',checking:'กำลังตรวจสอบ…',
    failedTitle:'ส่งไม่สำเร็จ',failedDetail:'ขณะนี้ระบบยังไม่สามารถส่งให้เสร็จได้ โปรดตรวจสอบข้อความแล้วลองอีกครั้ง หรือยกเลิกเพื่อแก้ไขใบลา',
    unknownTitle:'ยังยืนยันผลไม่ได้',unknownDetail:'ระบบตรวจสอบด้วย RequestID เดิมแล้ว แต่ยังยืนยันผลไม่ได้ หากข้อมูลไม่เปลี่ยน การส่งอีกครั้งจะใช้ RequestID เดิมและจะไม่สร้างใบลาซ้ำ',
    recoveredTitle:'ส่งใบลาแล้ว',recoveredDetail:'ระบบยืนยันแล้วว่าใบลาถูกสร้างสำเร็จ และกำลังเปิด “ใบลาของฉัน”'
  };
  const map=currentLang==='VI'?vi:currentLang==='TH'?th:zh;
  return map[key]||zh[key]||key;
}

function p5a1LeaveSubmitHf3Escape_(value){
  try{return escapeHtml(String(value==null?'':value))}catch(e){
    return String(value==null?'':value).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]})
  }
}

function p5a1LeaveSubmitHf3SelectedText_(id){
  const el=$(id);if(!el)return '';
  const opt=el.options&&el.selectedIndex>=0?el.options[el.selectedIndex]:null;
  return String(opt&&opt.textContent||el.value||'').trim();
}

function p5a1LeaveSubmitHf3ProxyText_(){
  const raw=p5a1LeaveSubmitHf3SelectedText_('proxyId');
  if(!raw)return '';
  return raw.split('（')[0].split('(')[0].trim();
}

function p5a1LeaveSubmitHf3AttachmentCount_(){
  try{if(Array.isArray(p5a109DraftAttachments))return p5a109DraftAttachments.length}catch(ignore){}
  const input=$('draftAttachmentFiles');
  return input&&input.files?input.files.length:0;
}

function p5a1LeaveSubmitHf3FormatDate_(value){
  return String(value||'').replace(/-/g,'/');
}

function p5a1LeaveSubmitHf3SummaryRows_(leave){
  const rows=[];
  const push=(label,value)=>rows.push(`<div class="abis-hf3-summary-row"><dt>${p5a1LeaveSubmitHf3Escape_(label)}</dt><dd>${p5a1LeaveSubmitHf3Escape_(value||p5a1LeaveSubmitHf3Text_('none'))}</dd></div>`);
  push(p5a1LeaveSubmitHf3Text_('leaveType'),p5a1LeaveSubmitHf3SelectedText_('leaveType'));
  push(p5a1LeaveSubmitHf3Text_('applicationType'),p5a1LeaveSubmitHf3SelectedText_('applicationType'));
  const sd=p5a1LeaveSubmitHf3FormatDate_(leave&&leave.startDate),ed=p5a1LeaveSubmitHf3FormatDate_(leave&&leave.endDate||leave&&leave.startDate);
  push(p5a1LeaveSubmitHf3Text_('date'),sd&&ed&&sd!==ed?`${sd} ～ ${ed}`:(sd||ed));
  const tf=$('timeFields'),showTime=!!((leave&&leave.startTime)||(leave&&leave.endTime))&&(!tf||!tf.classList.contains('hide'));
  if(showTime)push(p5a1LeaveSubmitHf3Text_('time'),`${leave.startTime||'--:--'} ～ ${leave.endTime||'--:--'}`);
  const proxy=p5a1LeaveSubmitHf3ProxyText_();if(proxy)push(p5a1LeaveSubmitHf3Text_('proxy'),proxy);
  if(String(leave&&leave.handover||'').trim())push(p5a1LeaveSubmitHf3Text_('handover'),String(leave.handover).trim());
  push(p5a1LeaveSubmitHf3Text_('reason'),String(leave&&leave.reason||'').trim()||p5a1LeaveSubmitHf3Text_('none'));
  if(leave&&leave.emergency)push(p5a1LeaveSubmitHf3Text_('emergency'),p5a1LeaveSubmitHf3Text_('yes'));
  const count=p5a1LeaveSubmitHf3AttachmentCount_();if(count)push(p5a1LeaveSubmitHf3Text_('attachments'),`${count} ${p5a1LeaveSubmitHf3Text_('attachmentUnit')}`);
  return rows.join('');
}

function p5a1LeaveSubmitHf3ConflictHtml_(conflicts){
  const list=Array.isArray(conflicts)?conflicts:[];if(!list.length)return '';
  const names=[...new Set(list.map(x=>String(x&&x.employeeName||x&&x.employeeId||'').trim()).filter(Boolean))].join('、');
  return `<div class="abis-hf3-warning" role="note"><div class="abis-hf3-warning-title">${p5a1LeaveSubmitHf3Escape_(p5a1LeaveSubmitHf3Text_('conflictTitle'))}</div><div>${p5a1LeaveSubmitHf3Escape_(p5a1LeaveSubmitHf3Text_('conflictPrefix'))} <b>${p5a1LeaveSubmitHf3Escape_(names)}</b> ${p5a1LeaveSubmitHf3Escape_(p5a1LeaveSubmitHf3Text_('conflictSuffix'))}</div><div class="abis-hf3-warning-hint">${p5a1LeaveSubmitHf3Escape_(p5a1LeaveSubmitHf3Text_('conflictHint'))}</div></div>`;
}

function p5a1LeaveSubmitHf3EnsureDom_(){
  if($('abisLeaveSubmitHf3Modal'))return;
  const wrap=document.createElement('div');
  wrap.id='abisLeaveSubmitHf3Modal';
  wrap.className='abis-hf3-backdrop hide';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML=`<div class="abis-hf3-dialog" role="dialog" aria-modal="true" aria-labelledby="abisLeaveSubmitHf3Title" aria-describedby="abisLeaveSubmitHf3Body"><div class="abis-hf3-head"><h2 id="abisLeaveSubmitHf3Title"></h2></div><div id="abisLeaveSubmitHf3Body" class="abis-hf3-scroll"><div id="abisLeaveSubmitHf3Intro" class="abis-hf3-intro"></div><dl id="abisLeaveSubmitHf3Summary" class="abis-hf3-summary"></dl><div id="abisLeaveSubmitHf3Conflict"></div><div id="abisLeaveSubmitHf3Error" class="abis-hf3-error hide" role="alert" aria-live="assertive"></div></div><div class="abis-hf3-actions"><button id="abisLeaveSubmitHf3Cancel" type="button" class="secondary"></button><button id="abisLeaveSubmitHf3Confirm" type="button"></button></div></div>`;
  wrap.addEventListener('click',function(e){if(e.target===wrap){e.preventDefault();e.stopPropagation()}});
  document.body.appendChild(wrap);
  $('abisLeaveSubmitHf3Cancel').addEventListener('click',function(){p5a1LeaveSubmitHf3Cancel_('button')});
  $('abisLeaveSubmitHf3Confirm').addEventListener('click',function(){p5a1LeaveSubmitHf3Commit_()});
}

function p5a1LeaveSubmitHf3Focusables_(){
  const root=$('abisLeaveSubmitHf3Modal');if(!root)return [];
  return Array.from(root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el=>!el.disabled&&el.offsetParent!==null);
}

function p5a1LeaveSubmitHf3LockBody_(){
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;st.scrollY=window.scrollY||window.pageYOffset||0;
  st.bodyStyle={position:document.body.style.position,top:document.body.style.top,left:document.body.style.left,right:document.body.style.right,width:document.body.style.width,overflow:document.body.style.overflow};
  st.htmlOverflow=document.documentElement.style.overflow;
  document.documentElement.style.overflow='hidden';
  document.body.style.position='fixed';document.body.style.top=`-${st.scrollY}px`;document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';document.body.style.overflow='hidden';
}

function p5a1LeaveSubmitHf3UnlockBody_(){
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_,s=st.bodyStyle||{};
  document.documentElement.style.overflow=st.htmlOverflow||'';
  document.body.style.position=s.position||'';document.body.style.top=s.top||'';document.body.style.left=s.left||'';document.body.style.right=s.right||'';document.body.style.width=s.width||'';document.body.style.overflow=s.overflow||'';
  try{window.scrollTo(0,st.scrollY||0)}catch(ignore){}
  st.bodyStyle=null;
}

function p5a1LeaveSubmitHf3PushHistory_(){
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;if(st.historyPushed)return;
  try{
    st.historyNonce=`hf3-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const base=(history.state&&typeof history.state==='object')?Object.assign({},history.state):{};
    base.abisLeaveSubmitHf3Modal=st.historyNonce;
    history.pushState(base,'',location.href);st.historyPushed=true;
  }catch(ignore){st.historyPushed=false}
}

function p5a1LeaveSubmitHf3RemoveHistory_(skipHistory){
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;if(!st.historyPushed)return;
  st.historyPushed=false;
  if(skipHistory)return;
  try{st.ignoreNextPop=true;history.back()}catch(ignore){st.ignoreNextPop=false}
}

function p5a1LeaveSubmitHf3HideOperation_(){
  try{clearOperationTimers_()}catch(ignore){}
  const el=$('opStatus');if(el)el.classList.add('hide');
}

function p5a1LeaveSubmitHf3Open_(context){
  p5a1LeaveSubmitHf3EnsureDom_();
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;st.open=true;st.submitting=false;st.context=context||{};st.opener=$('submitLeaveBtn')||document.activeElement;
  const isResubmit=!!(context&&context.resubmit);
  $('abisLeaveSubmitHf3Title').textContent=p5a1LeaveSubmitHf3Text_(isResubmit?'resubmitTitle':'title');
  $('abisLeaveSubmitHf3Intro').textContent=p5a1LeaveSubmitHf3Text_(isResubmit?'resubmitIntro':'intro');
  $('abisLeaveSubmitHf3Summary').innerHTML=p5a1LeaveSubmitHf3SummaryRows_(context&&context.leave||{});
  $('abisLeaveSubmitHf3Conflict').innerHTML=p5a1LeaveSubmitHf3ConflictHtml_(context&&context.conflicts||[]);
  $('abisLeaveSubmitHf3Error').innerHTML='';$('abisLeaveSubmitHf3Error').classList.add('hide');
  $('abisLeaveSubmitHf3Cancel').textContent=p5a1LeaveSubmitHf3Text_('cancel');
  $('abisLeaveSubmitHf3Confirm').textContent=p5a1LeaveSubmitHf3Text_(isResubmit?'confirmResubmit':'confirm');
  $('abisLeaveSubmitHf3Cancel').disabled=false;$('abisLeaveSubmitHf3Confirm').disabled=false;$('abisLeaveSubmitHf3Confirm').removeAttribute('aria-busy');
  const root=$('abisLeaveSubmitHf3Modal');root.classList.remove('hide');root.setAttribute('aria-hidden','false');
  p5a1LeaveSubmitHf3HideOperation_();p5a1LeaveSubmitHf3LockBody_();p5a1LeaveSubmitHf3PushHistory_();
  requestAnimationFrame(()=>{try{$('abisLeaveSubmitHf3Confirm').focus({preventScroll:true})}catch(e){$('abisLeaveSubmitHf3Confirm').focus()}});
}

function p5a1LeaveSubmitHf3Close_(opts){
  opts=opts||{};const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;if(!st.open)return;
  const opener=st.opener;st.open=false;st.submitting=false;
  const root=$('abisLeaveSubmitHf3Modal');if(root){root.classList.add('hide');root.setAttribute('aria-hidden','true')}
  p5a1LeaveSubmitHf3RemoveHistory_(!!opts.skipHistory);p5a1LeaveSubmitHf3UnlockBody_();
  st.context=null;st.opener=null;
  if(opts.restoreFocus!==false&&opener&&opener.isConnected&&!opener.disabled){requestAnimationFrame(()=>{try{opener.focus({preventScroll:true})}catch(e){try{opener.focus()}catch(ignore){}}})}
}

function p5a1LeaveSubmitHf3SetSubmitting_(busy){
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;st.submitting=!!busy;
  const cancel=$('abisLeaveSubmitHf3Cancel'),confirmBtn=$('abisLeaveSubmitHf3Confirm');if(!cancel||!confirmBtn)return;
  cancel.disabled=!!busy;confirmBtn.disabled=!!busy;
  if(busy){confirmBtn.textContent=p5a1LeaveSubmitHf3Text_('submitting');confirmBtn.setAttribute('aria-busy','true')}
  else{confirmBtn.textContent=p5a1LeaveSubmitHf3Text_(st.context&&st.context.resubmit?'confirmResubmit':'confirm');confirmBtn.removeAttribute('aria-busy')}
}

function p5a1LeaveSubmitHf3ShowError_(title,detail,raw){
  const box=$('abisLeaveSubmitHf3Error');if(!box)return;
  box.innerHTML=`<div class="abis-hf3-error-title">${p5a1LeaveSubmitHf3Escape_(title||p5a1LeaveSubmitHf3Text_('failedTitle'))}</div><div>${p5a1LeaveSubmitHf3Escape_(detail||p5a1LeaveSubmitHf3Text_('failedDetail'))}</div>${raw?`<div class="abis-hf3-error-raw">${p5a1LeaveSubmitHf3Escape_(raw)}</div>`:''}`;
  box.classList.remove('hide');
  const scroll=$('abisLeaveSubmitHf3Body');if(scroll)scroll.scrollTop=scroll.scrollHeight;
}

function p5a1LeaveSubmitHf3RenderConflictOnForm_(conflicts){
  if(!Array.isArray(conflicts)||!conflicts.length)return;
  const el=$('departmentConflictWarning');if(!el)return;
  try{el.innerHTML=renderDepartmentConflictWarning(conflicts,false)}catch(e){el.textContent=p5a1LeaveSubmitHf3Text_('conflictHint')}
  el.classList.remove('hide');
}

function p5a1LeaveSubmitHf3Cancel_(source){
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;if(!st.open||st.submitting)return;
  if(st.context&&st.context.conflicts)p5a1LeaveSubmitHf3RenderConflictOnForm_(st.context.conflicts);
  p5a1LeaveSubmitHf3HideOperation_();mutationBusy=false;
  p5a1LeaveSubmitHf3Close_({skipHistory:source==='back',restoreFocus:true});
}

function p5a1LeaveSubmitHf3PrepBusy_(busy){
  try{ABIS_LEAVE_SUBMIT_HF2_ACTIVE_=!!busy}catch(ignore){}
  try{if(busy)p5a1LeaveSubmitHf2ClearCapture_()}catch(ignore){}
  try{setAreaBusy_('leaveForm',!!busy,busy?p5a1LeaveSubmitHf3Text_('checking'):'')}catch(ignore){}
  if(busy){const btn=$('submitLeaveBtn');if(btn)btn.textContent=p5a1LeaveSubmitHf3Text_('checking')}
  else{
    try{p5a1LeaveSubmitHf2PlainAreaBusy_(false);p5a1LeaveSubmitHf2ClearCapture_()}catch(ignore){}
    try{ABIS_LEAVE_SUBMIT_HF2_ACTIVE_=false}catch(ignore){}
  }
}

async function p5a1LeaveSubmitHf3PrepareNew_(){
  if(ABIS_LEAVE_SUBMIT_HF3_STATE_.open){try{$('abisLeaveSubmitHf3Confirm').focus()}catch(ignore){}return}
  if(mutationBusy){message(nt('busy'),'warning');return}
  mutationBusy=true;p5a1LeaveSubmitHf3PrepBusy_(true);
  const op=beginOperation_(nt('transmitting'),nt('doNotRepeat'));
  let leave=currentLeaveDraft();
  try{
    const draftReady=await p5a108FlushDraft_();
    if(!draftReady){mutationBusy=false;p5a1LeaveSubmitHf3PrepBusy_(false);finishOperationFailure_(op,new Error(p5a108DraftText_('conflict')));return}
    leave=currentLeaveDraft();
    if(leave.proxyEmployeeId&&!leave.emergency){
      updateOperation_(op,nt('checkingProxy'),nt('doNotRepeat'));
      const pr=await call('proxyAvailability',{sessionToken,leave,proxyEmployeeId:leave.proxyEmployeeId});
      if(pr&&pr.available===false){
        const s=$('proxyId'),pn=(s.options[s.selectedIndex]&&s.options[s.selectedIndex].textContent)||leave.proxyEmployeeId,el=$('proxyAvailabilityWarning');
        el.innerHTML=renderProxyAvailabilityWarning(pr,pn);el.classList.remove('hide');s.value='';
        mutationBusy=false;p5a1LeaveSubmitHf3PrepBusy_(false);p5a1LeaveSubmitHf3HideOperation_();return
      }
    }
    updateOperation_(op,nt('checkingConflict'),nt('doNotRepeat'));
    const conflicts=await call('departmentLeaveConflicts',{sessionToken,leave});
    currentDepartmentConflicts=Array.isArray(conflicts)?conflicts:[];
    mutationBusy=false;p5a1LeaveSubmitHf3PrepBusy_(false);
    p5a1LeaveSubmitHf3Open_({resubmit:false,leave:leave,conflicts:currentDepartmentConflicts,op:op,requestId:''});
  }catch(e){
    mutationBusy=false;p5a1LeaveSubmitHf3PrepBusy_(false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e),'warning');
  }
}

async function p5a1LeaveSubmitHf3PrepareReturned_(){
  if(ABIS_LEAVE_SUBMIT_HF3_STATE_.open){try{$('abisLeaveSubmitHf3Confirm').focus()}catch(ignore){}return}
  if(mutationBusy){message(nt('busy'),'warning');return}
  const leaveId=returnedEditLeaveId;if(!leaveId){message('找不到退回假單');return}
  p5a1LeaveSubmitHf3Open_({resubmit:true,leaveId:leaveId,leave:currentLeaveDraft(),conflicts:[],op:null,requestId:''});
}

function p5a1LeaveSubmitHf3FocusSuccess_(leaveId){
  if(!leaveId)return;
  try{
    if(Array.isArray(myLeavesCache)){
      const idx=myLeavesCache.findIndex(x=>String(x&&x.leaveId||'')===String(leaveId));
      if(idx>0){const copy=myLeavesCache.slice(),hit=copy.splice(idx,1)[0];copy.unshift(hit);renderLeaves(copy)}
    }
  }catch(ignore){}
  requestAnimationFrame(()=>{
    const id='leave-detail-'+rc2SafeDomId_(leaveId),el=$(id);if(!el)return;
    el.classList.add('abis-hf3-leave-success-highlight');el.setAttribute('tabindex','-1');
    try{el.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){try{el.scrollIntoView()}catch(ignore){}}
    try{el.focus({preventScroll:true})}catch(ignore){}
    setTimeout(()=>{if(el&&el.isConnected){el.classList.remove('abis-hf3-leave-success-highlight');el.removeAttribute('tabindex')}},3000);
  });
}

async function p5a1LeaveSubmitHf3FinishSuccess_(r,op,requestId,recovered){
  const leaveId=r&&r.leaveId||'';
  if(recovered){p5a1LeaveSubmitHf3ShowError_(p5a1LeaveSubmitHf3Text_('recoveredTitle'),p5a1LeaveSubmitHf3Text_('recoveredDetail'),'')}
  p5a1LeaveSubmitHf3Close_({restoreFocus:false});
  await p4a13FinishSubmitSuccess_(r,op,requestId,!!recovered);
  p5a1LeaveSubmitHf3FocusSuccess_(leaveId);
}

async function p5a1LeaveSubmitHf3CommitNew_(ctx){
  const leave=ctx.leave;let requestId=ctx.requestId||'';let r=null;
  try{
    requestId=requestId||p4a13RequestIdForLeave_(leave);ctx.requestId=requestId;
    updateOperation_(ctx.op,nt('submittingLeave'),nt('doNotRepeat'));
    r=await call('submitLeave',{sessionToken,leave,requestId,draftId:p5a108DraftId,draftVersion:p5a108DraftVersion});
  }catch(e){
    if(requestId){
      updateOperation_(ctx.op,nt('checkingResult'),nt('unknownDetail'),'warning');
      const recovered=await p4a13ConfirmSubmitResult_(requestId,ctx.op);
      if(recovered){await p5a1LeaveSubmitHf3FinishSuccess_(recovered,ctx.op,requestId,true);return}
      const uncertain=(e&&e.kind==='TRANSPORT')||String(e&&e.message||'').includes('系統未回傳成功狀態');
      if(uncertain){
        mutationBusy=false;p5a1LeaveSubmitHf3SetSubmitting_(false);
        finishOperationUnknown_(ctx.op,nt('stillUnknown'),p5a1LeaveSubmitHf3Text_('unknownDetail'),true);
        p5a1LeaveSubmitHf3ShowError_(p5a1LeaveSubmitHf3Text_('unknownTitle'),p5a1LeaveSubmitHf3Text_('unknownDetail'),'');return
      }
    }
    mutationBusy=false;p5a1LeaveSubmitHf3SetSubmitting_(false);finishOperationFailure_(ctx.op,e);
    p5a1LeaveSubmitHf3ShowError_(p5a1LeaveSubmitHf3Text_('failedTitle'),p5a1LeaveSubmitHf3Text_('failedDetail'),e&&e.message?e.message:String(e));return
  }
  await p5a1LeaveSubmitHf3FinishSuccess_(r,ctx.op,requestId,false);
}

async function p5a1LeaveSubmitHf3CommitReturned_(ctx){
  const leaveId=ctx.leaveId;if(!leaveId){mutationBusy=false;p5a1LeaveSubmitHf3SetSubmitting_(false);p5a1LeaveSubmitHf3ShowError_(p5a1LeaveSubmitHf3Text_('failedTitle'),p5a1LeaveSubmitHf3Text_('failedDetail'),'找不到退回假單');return}
  const op=beginOperation_(p4a14t('resubmitting'),nt('doNotRepeat'));
  try{
    await call('saveReturnedDraft',{sessionToken,leaveId:leaveId,leave:ctx.leave});
    updateOperation_(op,p4a14t('resubmitting'),nt('doNotRepeat'));
    await call('resubmitReturned',{sessionToken,leaveId:leaveId});
  }catch(e){
    if(e&&e.kind==='TRANSPORT'){
      finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);
      const synced=await reconcileAfterTransport_('submit',op);
      const current=Array.isArray(myLeavesCache)?myLeavesCache.find(x=>String(x&&x.leaveId||'')===String(leaveId)):null;
      const confirmed=synced&&current&&String(current.status||'').toUpperCase()!=='RETURNED';
      if(confirmed){
        p5a1LeaveSubmitHf3Close_({restoreFocus:false});mutationBusy=false;hideAppSections();$('leaves').classList.remove('hide');renderLeaves(myLeavesCache);p5a1LeaveSubmitHf3FocusSuccess_(leaveId);return
      }
      mutationBusy=false;p5a1LeaveSubmitHf3SetSubmitting_(false);p5a1LeaveSubmitHf3ShowError_(p5a1LeaveSubmitHf3Text_('unknownTitle'),nt('unknownDetail'),'');return
    }
    mutationBusy=false;p5a1LeaveSubmitHf3SetSubmitting_(false);finishOperationFailure_(op,e);p5a1LeaveSubmitHf3ShowError_(p5a1LeaveSubmitHf3Text_('failedTitle'),p5a1LeaveSubmitHf3Text_('failedDetail'),e&&e.message?e.message:String(e));return
  }
  mutationBusy=false;resetReturnedEditUi_();myLeavesCache=null;inboxCache=null;dashboardCache=null;finishOperationSuccess_(op,p4t('resubmitDone'),'');message(p4t('resubmitDone'),'success');
  p5a1LeaveSubmitHf3Close_({restoreFocus:false});
  try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;hideAppSections();$('leaves').classList.remove('hide');renderLeaves(list);homeData=await call('home',{sessionToken});renderHome();fillLeaveTypes();fillProxyCandidates();setInboxCount(homeData.pendingApprovalCount||0);p5a1LeaveSubmitHf3FocusSuccess_(leaveId)}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}
}

async function p5a1LeaveSubmitHf3Commit_(){
  const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;if(!st.open||st.submitting||!st.context)return;if(mutationBusy)return;
  mutationBusy=true;p5a1LeaveSubmitHf3SetSubmitting_(true);
  const err=$('abisLeaveSubmitHf3Error');if(err){err.innerHTML='';err.classList.add('hide')}
  if(st.context.resubmit)await p5a1LeaveSubmitHf3CommitReturned_(st.context);else await p5a1LeaveSubmitHf3CommitNew_(st.context);
}

submitLeave=async function(){
  if(returnedEditLeaveId)return p5a1LeaveSubmitHf3PrepareReturned_();
  return p5a1LeaveSubmitHf3PrepareNew_();
};

(function p5a1LeaveSubmitHf3Install_(){
  p5a1LeaveSubmitHf3EnsureDom_();
  document.addEventListener('keydown',function(e){
    const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;if(!st.open)return;
    if(e.key==='Escape'){
      e.preventDefault();e.stopPropagation();if(!st.submitting)p5a1LeaveSubmitHf3Cancel_('escape');return
    }
    if(e.key!=='Tab')return;
    const nodes=p5a1LeaveSubmitHf3Focusables_();if(!nodes.length){e.preventDefault();return}
    const first=nodes[0],last=nodes[nodes.length-1],active=document.activeElement;
    if(e.shiftKey&&active===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&active===last){e.preventDefault();first.focus()}else if(!nodes.includes(active)){e.preventDefault();first.focus()}
  },true);
  window.addEventListener('popstate',function(){
    const st=ABIS_LEAVE_SUBMIT_HF3_STATE_;
    if(st.ignoreNextPop){st.ignoreNextPop=false;return}
    if(!st.open)return;
    st.historyPushed=false;
    if(st.submitting){p5a1LeaveSubmitHf3PushHistory_();return}
    p5a1LeaveSubmitHf3Cancel_('back');
  });
  if(!document.getElementById('abisLeaveSubmitHf3Style')){
    const s=document.createElement('style');s.id='abisLeaveSubmitHf3Style';
    s.textContent=`
.abis-hf3-backdrop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));background:rgba(15,23,42,.55);backdrop-filter:blur(2px);box-sizing:border-box}
.abis-hf3-backdrop.hide{display:none!important}
.abis-hf3-dialog{width:min(560px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;border-radius:16px;background:#fff;color:#111827;box-shadow:0 24px 70px rgba(0,0,0,.28);border:1px solid rgba(148,163,184,.35)}
.abis-hf3-head{padding:20px 20px 8px;flex:0 0 auto}.abis-hf3-head h2{margin:0;font-size:20px;line-height:1.35}
.abis-hf3-scroll{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:8px 20px 16px}
.abis-hf3-intro{font-size:14px;line-height:1.6;color:#475569;margin-bottom:14px}
.abis-hf3-summary{margin:0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#f8fafc}
.abis-hf3-summary-row{display:grid;grid-template-columns:minmax(96px,34%) 1fr;gap:12px;padding:10px 12px;border-bottom:1px solid #e2e8f0}.abis-hf3-summary-row:last-child{border-bottom:0}.abis-hf3-summary dt{font-weight:700;color:#475569}.abis-hf3-summary dd{margin:0;overflow-wrap:anywhere;white-space:pre-wrap}
.abis-hf3-warning{margin-top:14px;padding:12px 14px;border-radius:12px;border:1px solid #f59e0b;background:#fffbeb;color:#78350f;font-size:14px;line-height:1.55}.abis-hf3-warning-title{font-weight:800;margin-bottom:4px}.abis-hf3-warning-hint{margin-top:4px;font-weight:700}
.abis-hf3-error{margin-top:14px;padding:12px 14px;border-radius:12px;border:1px solid #ef4444;background:#fef2f2;color:#7f1d1d;font-size:14px;line-height:1.55}.abis-hf3-error-title{font-weight:800;margin-bottom:4px}.abis-hf3-error-raw{margin-top:6px;font-size:12px;opacity:.9;overflow-wrap:anywhere}
.abis-hf3-actions{position:sticky;bottom:0;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 20px calc(14px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #e2e8f0;box-shadow:0 -8px 18px rgba(15,23,42,.04)}
.abis-hf3-actions button{margin:0;min-height:46px}.abis-hf3-actions button:focus-visible{outline:3px solid rgba(37,99,235,.35);outline-offset:2px}
.abis-hf3-leave-success-highlight{animation:abisHf3SuccessPulse 3s ease-out!important;outline:2px solid #22c55e!important;outline-offset:2px}
@keyframes abisHf3SuccessPulse{0%,45%{background:#ecfdf5;box-shadow:0 0 0 4px rgba(34,197,94,.12)}100%{background:inherit;box-shadow:none}}
html[data-theme="dark"] .abis-hf3-dialog{background:#111827;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .abis-hf3-intro{color:#cbd5e1}html[data-theme="dark"] .abis-hf3-summary{background:#0f172a;border-color:#334155}html[data-theme="dark"] .abis-hf3-summary-row{border-color:#334155}html[data-theme="dark"] .abis-hf3-summary dt{color:#cbd5e1}html[data-theme="dark"] .abis-hf3-actions{background:#111827;border-color:#334155}html[data-theme="dark"] .abis-hf3-warning{background:#422006;color:#fef3c7;border-color:#d97706}html[data-theme="dark"] .abis-hf3-error{background:#450a0a;color:#fee2e2;border-color:#dc2626}
@media(max-width:520px){.abis-hf3-backdrop{align-items:center;padding:12px max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}.abis-hf3-dialog{width:100%;max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);border-radius:18px}.abis-hf3-head{padding:18px 16px 8px}.abis-hf3-scroll{padding:8px 16px 12px}.abis-hf3-actions{padding:12px 16px calc(12px + env(safe-area-inset-bottom))}.abis-hf3-summary-row{grid-template-columns:94px 1fr;gap:8px;padding:9px 10px}}
`;
    document.head.appendChild(s);
  }
})();

window.ABIS_LEAVE_SUBMIT_HOTFIX_HF3=Object.freeze({
  ok:true,
  version:ABIS_LEAVE_SUBMIT_HF3_VERSION_,
  release:ABIS_LEAVE_SUBMIT_HF3_RELEASE_,
  viewportModal:true,
  nativeConflictConfirmRemoved:true,
  summary:true,
  conditionalConflictWarning:true,
  modalLocalSubmitting:true,
  timeoutRequestIdRecovery:true,
  focusTrap:true,
  bodyScrollLock:true,
  mobileBackHandling:true,
  successNavigateAndHighlightMs:3000,
  businessRulesChanged:false,
  backendChanged:false
});
