/* ABIS ESS HF4 | Unified in-app dialogs, no native browser confirm/prompt */
const ABIS_DIALOG_HF4_VERSION_='ABIS_ESS_DIALOG_HF4_UNIFIED_IN_APP_20261007';
const ABIS_DIALOG_HF4_RELEASE_='P5A1_RM_FAST4_STATIC_ASSET_RC1_3_HF4_DIALOG_UX_20261007';
const ABIS_DIALOG_HF4_STATE_={open:false,resolver:null,opener:null,scrollY:0,bodyStyle:null,htmlOverflow:'',mode:'confirm',required:false,submitting:false};

function abisHf4Text_(key){
  const zh={
    cancel:'取消',keep:'保留',confirm:'確認',sync:'同步最新狀態',loadLatest:'載入最新版',remove:'移除附件',discard:'放棄草稿',resubmit:'重新送出',submitAppeal:'送出申覆',reissue:'重新產生',withdraw:'確認撤回',
    withdrawTitle:'撤回假單',withdrawBody:'請確認是否撤回這張假單。若有需要，可填寫撤回原因。',withdrawLabel:'撤回原因（選填）',withdrawPlaceholder:'例如：日期填寫錯誤、行程取消',
    conflictTitle:'人力重疊提醒',conflictBody:'同部門同時段已有 {names} 請假。此為提醒，不影響本假單送出。',
    discardTitle:'放棄請假草稿？',discardBody:'此草稿尚未送出。放棄後，草稿內容與尚未送出的附件將一併刪除。',
    attachmentTitle:'移除附件？',attachmentBody:'此附件將從目前的請假草稿中移除。',
    latestTitle:'找到較新的草稿',latestBody:'其他裝置或視窗已有較新的草稿版本。載入後，目前畫面會改為最新版本。',
    inactiveTitle:'草稿狀態已變更',inactiveBody:'此草稿已在其他視窗完成、放棄或失效。是否同步最新狀態並清除此畫面的舊草稿？',
    resubmitTitle:'重新送出假單？',resubmitBody:'重新送出後，這張假單將再次進入簽核流程。',
    reissueTitle:'重新產生 Temporary PIN？',reissueBody:'系統將產生新的 Temporary PIN，舊的 Temporary PIN 會立即失效。',
    appealTitle:'提出出勤申覆',appealBody:'請說明需要重新確認的出勤情況。',appealLabel:'申覆原因',appealPlaceholder:'請輸入申覆原因',appealRequired:'請填寫申覆原因。',
    actionUnavailable:'目前無法開啟確認視窗，請重新整理頁面後再試。'
  };
  const vi={
    cancel:'Hủy',keep:'Giữ lại',confirm:'Xác nhận',sync:'Đồng bộ trạng thái mới',loadLatest:'Tải bản mới nhất',remove:'Xóa tệp',discard:'Bỏ bản nháp',resubmit:'Gửi lại',submitAppeal:'Gửi khiếu nại',reissue:'Tạo lại',withdraw:'Xác nhận rút đơn',
    withdrawTitle:'Rút đơn nghỉ',withdrawBody:'Vui lòng xác nhận việc rút đơn này. Nếu cần, bạn có thể ghi lý do.',withdrawLabel:'Lý do rút đơn (không bắt buộc)',withdrawPlaceholder:'Ví dụ: nhập sai ngày, kế hoạch thay đổi',
    conflictTitle:'Nhắc nhở trùng nhân lực',conflictBody:'Trong cùng bộ phận và thời gian đã có {names} xin nghỉ. Đây chỉ là nhắc nhở và không ngăn việc gửi đơn.',
    discardTitle:'Bỏ bản nháp đơn nghỉ?',discardBody:'Bản nháp này chưa được gửi. Khi bỏ, nội dung bản nháp và các tệp đính kèm chưa gửi sẽ bị xóa cùng.',
    attachmentTitle:'Xóa tệp đính kèm?',attachmentBody:'Tệp này sẽ bị xóa khỏi bản nháp đơn nghỉ hiện tại.',
    latestTitle:'Có bản nháp mới hơn',latestBody:'Thiết bị hoặc cửa sổ khác có bản nháp mới hơn. Sau khi tải, màn hình hiện tại sẽ được thay bằng phiên bản mới nhất.',
    inactiveTitle:'Trạng thái bản nháp đã thay đổi',inactiveBody:'Bản nháp này đã được hoàn tất, bỏ hoặc mất hiệu lực ở cửa sổ khác. Đồng bộ trạng thái mới nhất và xóa bản nháp cũ trên màn hình này?',
    resubmitTitle:'Gửi lại đơn nghỉ?',resubmitBody:'Sau khi gửi lại, đơn này sẽ vào lại quy trình phê duyệt.',
    reissueTitle:'Tạo lại Temporary PIN?',reissueBody:'Hệ thống sẽ tạo Temporary PIN mới và PIN cũ sẽ mất hiệu lực ngay.',
    appealTitle:'Khiếu nại chấm công',appealBody:'Vui lòng mô tả tình trạng chấm công cần được kiểm tra lại.',appealLabel:'Lý do khiếu nại',appealPlaceholder:'Nhập lý do khiếu nại',appealRequired:'Vui lòng nhập lý do khiếu nại.',
    actionUnavailable:'Hiện không thể mở hộp xác nhận. Vui lòng tải lại trang rồi thử lại.'
  };
  const th={
    cancel:'ยกเลิก',keep:'เก็บไว้',confirm:'ยืนยัน',sync:'ซิงก์สถานะล่าสุด',loadLatest:'โหลดเวอร์ชันล่าสุด',remove:'ลบไฟล์',discard:'ยกเลิกร่าง',resubmit:'ส่งอีกครั้ง',submitAppeal:'ส่งคำอุทธรณ์',reissue:'สร้างใหม่',withdraw:'ยืนยันถอนใบลา',
    withdrawTitle:'ถอนใบลา',withdrawBody:'โปรดยืนยันการถอนใบลานี้ หากต้องการ สามารถระบุเหตุผลได้',withdrawLabel:'เหตุผลการถอน (ไม่บังคับ)',withdrawPlaceholder:'เช่น กรอกวันที่ผิด หรือแผนงานเปลี่ยน',
    conflictTitle:'แจ้งเตือนกำลังคนซ้ำช่วงเวลา',conflictBody:'ในแผนกและช่วงเวลาเดียวกันมี {names} ลางานอยู่ นี่เป็นเพียงการแจ้งเตือน และไม่ขัดขวางการส่งใบลา',
    discardTitle:'ยกเลิกร่างใบลาหรือไม่?',discardBody:'ร่างนี้ยังไม่ได้ส่ง เมื่อยกเลิก เนื้อหาร่างและไฟล์แนบที่ยังไม่ได้ส่งจะถูกลบด้วย',
    attachmentTitle:'ลบไฟล์แนบหรือไม่?',attachmentBody:'ไฟล์นี้จะถูกลบออกจากร่างใบลาปัจจุบัน',
    latestTitle:'พบร่างที่ใหม่กว่า',latestBody:'อุปกรณ์หรือหน้าต่างอื่นมีร่างเวอร์ชันใหม่กว่า เมื่อโหลด หน้าปัจจุบันจะเปลี่ยนเป็นเวอร์ชันล่าสุด',
    inactiveTitle:'สถานะร่างมีการเปลี่ยนแปลง',inactiveBody:'ร่างนี้ถูกดำเนินการเสร็จ ยกเลิก หรือหมดอายุในหน้าต่างอื่นแล้ว ต้องการซิงก์สถานะล่าสุดและล้างร่างเก่าบนหน้าจอนี้หรือไม่?',
    resubmitTitle:'ส่งใบลาอีกครั้ง?',resubmitBody:'เมื่อส่งอีกครั้ง ใบลานี้จะเข้าสู่กระบวนการอนุมัติอีกครั้ง',
    reissueTitle:'สร้าง Temporary PIN ใหม่?',reissueBody:'ระบบจะสร้าง Temporary PIN ใหม่ และ PIN เดิมจะใช้ไม่ได้ทันที',
    appealTitle:'ยื่นอุทธรณ์เวลาทำงาน',appealBody:'โปรดอธิบายข้อมูลเวลาทำงานที่ต้องการให้ตรวจสอบอีกครั้ง',appealLabel:'เหตุผลการอุทธรณ์',appealPlaceholder:'กรอกเหตุผลการอุทธรณ์',appealRequired:'กรุณากรอกเหตุผลการอุทธรณ์',
    actionUnavailable:'ขณะนี้ไม่สามารถเปิดหน้าต่างยืนยันได้ โปรดรีเฟรชหน้าแล้วลองอีกครั้ง'
  };
  const m=currentLang==='VI'?vi:currentLang==='TH'?th:zh;
  return m[key]||zh[key]||key;
}

function abisHf4Esc_(v){try{return escapeHtml(String(v==null?'':v))}catch(e){return String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}}
function abisHf4EnsureDom_(){
  if($('abisHf4Dialog'))return true;
  try{
    const root=document.createElement('div');root.id='abisHf4Dialog';root.className='abis-hf4-backdrop hide';root.setAttribute('aria-hidden','true');
    root.innerHTML='<div class="abis-hf4-dialog" role="dialog" aria-modal="true" aria-labelledby="abisHf4Title" aria-describedby="abisHf4Body"><div class="abis-hf4-head"><h2 id="abisHf4Title"></h2></div><div id="abisHf4Body" class="abis-hf4-scroll"><div id="abisHf4Message" class="abis-hf4-message"></div><label id="abisHf4InputWrap" class="abis-hf4-input-wrap hide"><span id="abisHf4InputLabel"></span><textarea id="abisHf4Input" rows="4" maxlength="500"></textarea><span id="abisHf4InputError" class="abis-hf4-input-error hide" role="alert"></span></label></div><div class="abis-hf4-actions"><button id="abisHf4Cancel" type="button" class="secondary"></button><button id="abisHf4Ok" type="button"></button></div></div>';
    root.addEventListener('click',e=>{if(e.target===root){e.preventDefault();e.stopPropagation()}});
    document.body.appendChild(root);
    $('abisHf4Cancel').addEventListener('click',()=>abisHf4Resolve_(false));
    $('abisHf4Ok').addEventListener('click',()=>{
      const st=ABIS_DIALOG_HF4_STATE_,input=$('abisHf4Input'),err=$('abisHf4InputError'),value=input?String(input.value||'').trim():'';
      if(st.required&&!value){if(err){err.textContent=abisHf4Text_('appealRequired');err.classList.remove('hide')}if(input)input.focus();return}
      abisHf4Resolve_(true,value);
    });
    const s=document.createElement('style');s.id='abisHf4Style';s.textContent=`
.abis-hf4-backdrop{position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));background:rgba(15,23,42,.56);backdrop-filter:blur(2px);box-sizing:border-box}.abis-hf4-backdrop.hide{display:none!important}.abis-hf4-dialog{width:min(540px,100%);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;border-radius:16px;background:#fff;color:#111827;border:1px solid #e2e8f0;box-shadow:0 24px 70px rgba(0,0,0,.28)}.abis-hf4-head{padding:20px 20px 8px}.abis-hf4-head h2{margin:0;font-size:20px;line-height:1.35}.abis-hf4-scroll{min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:8px 20px 16px}.abis-hf4-message{font-size:15px;line-height:1.65;white-space:pre-wrap;color:#334155}.abis-hf4-input-wrap{display:block;margin-top:16px}.abis-hf4-input-wrap>span:first-child{display:block;font-weight:700;margin-bottom:7px}.abis-hf4-input-wrap textarea{width:100%;box-sizing:border-box;min-height:104px;resize:vertical}.abis-hf4-input-error{display:block;color:#b91c1c;font-size:13px;margin-top:6px}.abis-hf4-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 20px calc(14px + env(safe-area-inset-bottom));border-top:1px solid #e2e8f0;background:#fff}.abis-hf4-actions button{margin:0;min-height:46px}.abis-hf4-actions .danger{background:#b91c1c!important;color:#fff!important;border-color:#b91c1c!important}html[data-theme="dark"] .abis-hf4-dialog{background:#111827;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .abis-hf4-message{color:#e2e8f0}html[data-theme="dark"] .abis-hf4-actions{background:#111827;border-color:#334155}@media(max-width:520px){.abis-hf4-backdrop{padding:12px}.abis-hf4-dialog{max-height:calc(100dvh - 24px);border-radius:18px}.abis-hf4-head{padding:18px 16px 8px}.abis-hf4-scroll{padding:8px 16px 12px}.abis-hf4-actions{padding:12px 16px calc(12px + env(safe-area-inset-bottom))}}
`;
    document.head.appendChild(s);return true;
  }catch(e){return false}
}
function abisHf4Lock_(){const st=ABIS_DIALOG_HF4_STATE_;st.scrollY=window.scrollY||window.pageYOffset||0;st.bodyStyle={position:document.body.style.position,top:document.body.style.top,left:document.body.style.left,right:document.body.style.right,width:document.body.style.width,overflow:document.body.style.overflow};st.htmlOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';document.body.style.position='fixed';document.body.style.top=`-${st.scrollY}px`;document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';document.body.style.overflow='hidden'}
function abisHf4Unlock_(){const st=ABIS_DIALOG_HF4_STATE_;if(st.bodyStyle){Object.assign(document.body.style,st.bodyStyle);st.bodyStyle=null}document.documentElement.style.overflow=st.htmlOverflow||'';try{window.scrollTo(0,st.scrollY||0)}catch(e){}}
function abisHf4Focusables_(){const r=$('abisHf4Dialog');return r?Array.from(r.querySelectorAll('button,textarea,[tabindex]:not([tabindex="-1"])')).filter(x=>!x.disabled&&x.offsetParent!==null):[]}
function abisHf4Resolve_(confirmed,value){const st=ABIS_DIALOG_HF4_STATE_;if(!st.open)return;const root=$('abisHf4Dialog'),resolver=st.resolver,opener=st.opener;st.open=false;st.resolver=null;st.required=false;if(root){root.classList.add('hide');root.setAttribute('aria-hidden','true')}abisHf4Unlock_();if(opener&&opener.isConnected)setTimeout(()=>{try{opener.focus()}catch(e){}},0);if(resolver)resolver({confirmed:!!confirmed,value:String(value||'')})}
function abisHf4Open_(o){
  return new Promise(resolve=>{
    if(!abisHf4EnsureDom_()){message(abisHf4Text_('actionUnavailable'),'warning');resolve({confirmed:false,value:''});return}
    if(ABIS_DIALOG_HF4_STATE_.open)abisHf4Resolve_(false);
    const st=ABIS_DIALOG_HF4_STATE_;st.open=true;st.resolver=resolve;st.opener=o&&o.opener||document.activeElement;st.required=!!(o&&o.required);
    $('abisHf4Title').textContent=String(o&&o.title||'');$('abisHf4Message').textContent=String(o&&o.body||'');
    const wrap=$('abisHf4InputWrap'),input=$('abisHf4Input'),label=$('abisHf4InputLabel'),err=$('abisHf4InputError');
    const hasInput=!!(o&&o.input);wrap.classList.toggle('hide',!hasInput);if(err){err.textContent='';err.classList.add('hide')}
    if(hasInput){label.textContent=String(o.input.label||'');input.value=String(o.input.value||'');input.placeholder=String(o.input.placeholder||'');input.maxLength=Number(o.input.maxLength||500)}
    const cancel=$('abisHf4Cancel'),ok=$('abisHf4Ok');cancel.textContent=String(o&&o.cancelText||abisHf4Text_('cancel'));ok.textContent=String(o&&o.okText||abisHf4Text_('confirm'));ok.classList.toggle('danger',!!(o&&o.danger));
    const root=$('abisHf4Dialog');root.classList.remove('hide');root.setAttribute('aria-hidden','false');abisHf4Lock_();setTimeout(()=>{try{(hasInput?input:ok).focus()}catch(e){}},0);
  })
}
async function abisHf4Confirm_(title,body,okText,cancelText,danger,opener){return (await abisHf4Open_({title,body,okText,cancelText,danger,opener})).confirmed}
async function abisHf4Input_(title,body,label,placeholder,okText,cancelText,required,opener){return abisHf4Open_({title,body,okText,cancelText,required,opener,input:{label,placeholder,maxLength:500}})}

document.addEventListener('keydown',function(e){const st=ABIS_DIALOG_HF4_STATE_;if(!st.open)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();abisHf4Resolve_(false);return}if(e.key!=='Tab')return;const n=abisHf4Focusables_();if(!n.length){e.preventDefault();return}const f=n[0],l=n[n.length-1],a=document.activeElement;if(e.shiftKey&&a===f){e.preventDefault();l.focus()}else if(!e.shiftKey&&a===l){e.preventDefault();f.focus()}else if(!n.includes(a)){e.preventDefault();f.focus()}},true);

/* Existing in-app confirm helper: remove native-browser fallback. */
p4a14Confirm_=function(title,body,confirmText){return abisHf4Confirm_(title,body,confirmText||abisHf4Text_('confirm'),abisHf4Text_('cancel'),false,document.activeElement)};

/* Draft attachment removal. */
p5a109DeleteDraftAttachment_=async function(attachmentId,triggerBtn){if(!attachmentId||p5a109AttachmentBusy||!p5a108DraftId)return;if(!await abisHf4Confirm_(abisHf4Text_('attachmentTitle'),abisHf4Text_('attachmentBody'),abisHf4Text_('remove'),abisHf4Text_('cancel'),true,triggerBtn))return;const op=beginOperation_(p5a109Text_('deleting'),nt('doNotRepeat'),triggerBtn);p5a109AttachmentBusy=true;const list=$('draftAttachmentList');if(list)list.querySelectorAll('button').forEach(btn=>{if(btn!==triggerBtn)btn.disabled=true});try{const r=await call('deleteDraftAttachment',{sessionToken,draftId:p5a108DraftId,attachmentId});p5a109DraftAttachments=Array.isArray(r&&r.files)?r.files:[];finishOperationSuccess_(op,p5a109Text_('deleteDone'),'');message(p5a109Text_('deleteDone'),'success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e),'warning')}finally{p5a109AttachmentBusy=false;p5a109RenderDraftAttachments_()}};

/* Draft save conflict dialogs. */
p5a108SaveDraftNow_=async function(silent){if(returnedEditLeaveId||!p5a108DraftDirty||p5a108DraftInFlight||!sessionToken)return !p5a108DraftConflict;p5a108DraftInFlight=true;clearTimeout(p5a108DraftTimer);p5a108DraftTimer=null;p5a108SetDraftStatus_(p5a108DraftText_('saving'),'');const leave=currentLeaveDraft();try{const r=await call('saveLeaveDraft',{sessionToken,formType:P5A1_LEAVE_DRAFT_FORM_TYPE,draftId:p5a108DraftId,expectedVersion:p5a108DraftVersion,leave});if(r&&r.conflict){p5a108DraftConflict=true;p5a108SetDraftStatus_(p5a108DraftText_('conflict'),'warning');const latest=r.draft||null;if(latest){const latestStatus=String(latest.status||'ACTIVE').toUpperCase();if(latestStatus!=='ACTIVE'){if(await abisHf4Confirm_(abisHf4Text_('inactiveTitle'),abisHf4Text_('inactiveBody'),abisHf4Text_('sync'),abisHf4Text_('keep'),false,document.activeElement)){p5a108DraftLoadSeq++;p5a108ResetDraftState_();p4a142ResetSubmittedLeaveForm_();message(p5a108DraftText_('inactiveSynced'),'success')}return false}if(await abisHf4Confirm_(abisHf4Text_('latestTitle'),abisHf4Text_('latestBody'),abisHf4Text_('loadLatest'),abisHf4Text_('keep'),false,document.activeElement)){p5a108AdoptServerDraft_(latest,true);await p5a109LoadDraftAttachments_();message(p5a108DraftText_('restored'),'success')}}return false}if(r&&r.draft)p5a108AdoptServerDraft_(r.draft,false);p5a108DraftDirty=false;return true}catch(e){p5a108SetDraftStatus_(p5a108DraftText_('saveFail'),'warning');if(!silent&&!p5a1LineReauthStarted)message(e&&e.message?e.message:String(e),'warning');return false}finally{p5a108DraftInFlight=false}};

/* Discard leave draft. */
p5a108DiscardLeaveDraft_=async function(triggerBtn){if(returnedEditLeaveId)return;if(!p5a108DraftId){message(p5a108DraftText_('discardMissing'),'warning');p5a108UpdateDiscardButton_();return}if(mutationBusy){message(nt('busy'),'warning');return}if(p5a108DraftInFlight){message(p5a108DraftText_('saving'),'warning');return}if(p5a108DraftConflict){message(p5a108DraftText_('discardConflict'),'warning');return}if(!await abisHf4Confirm_(abisHf4Text_('discardTitle'),abisHf4Text_('discardBody'),abisHf4Text_('discard'),abisHf4Text_('keep'),true,triggerBtn))return;mutationBusy=true;setAreaBusy_('leaveForm',true);const draftId=p5a108DraftId,expectedVersion=p5a108DraftVersion,op=beginOperation_(p5a108DraftText_('discarding'),nt('doNotRepeat'),triggerBtn);let completed=false;try{const r=await call('discardLeaveDraft',{sessionToken,draftId,expectedVersion:p5a108DraftVersion});if(r&&r.conflict){p5a108DraftConflict=true;p5a108SetDraftStatus_(p5a108DraftText_('conflict'),'warning');if(r.draft&&await abisHf4Confirm_(abisHf4Text_('latestTitle'),abisHf4Text_('latestBody'),abisHf4Text_('loadLatest'),abisHf4Text_('keep'),false,triggerBtn)){p5a108AdoptServerDraft_(r.draft,true);await p5a109LoadDraftAttachments_();message(p5a108DraftText_('restored'),'success')}throw new Error(p5a108DraftText_('discardConflict'))}if(!r||(!r.discarded&&!r.alreadyInactive))throw new Error(p5a108DraftText_('discardMissing'));completed=true}catch(e){const uncertain=!!(e&&e.kind==='TRANSPORT');if(uncertain){updateOperation_(op,nt('checkingResult'),nt('unknownDetail'),'warning');try{const state=await call('getLeaveDraft',{sessionToken,formType:P5A1_LEAVE_DRAFT_FORM_TYPE});const active=state&&state.draft?state.draft:null;if(!active||String(active.draftId||'')!==String(draftId)){completed=true}else if(Number(active.version||0)!==Number(expectedVersion||0)){p5a108AdoptServerDraft_(active,true);await p5a109LoadDraftAttachments_();p5a108DraftConflict=false;throw new Error(p5a108DraftText_('discardConflict'))}}catch(recheck){if(recheck&&recheck.message===p5a108DraftText_('discardConflict'))e=recheck;else{mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationUnknown_(op,nt('stillUnknown'),nt('stillUnknownDetail'),true);return}}}if(!completed){mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e),'warning');return}}if(completed){p5a108DraftLoadSeq++;p5a108ResetDraftState_();p4a142ResetSubmittedLeaveForm_();mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationSuccess_(op,p5a108DraftText_('discardDone'),'');message(p5a108DraftText_('discardDone'),'success')}};

/* Withdraw leave: one in-app dialog replaces prompt + second confirmation. */
withdrawLeave=async function(leaveId,triggerBtn){if(mutationBusy){message(nt('busy'),'warning');return}const ask=await abisHf4Input_(abisHf4Text_('withdrawTitle'),abisHf4Text_('withdrawBody'),abisHf4Text_('withdrawLabel'),abisHf4Text_('withdrawPlaceholder'),abisHf4Text_('withdraw'),abisHf4Text_('cancel'),false,triggerBtn);if(!ask.confirmed)return;const reason=ask.value||'';mutationBusy=true;setAreaBusy_('leaves',true,nt('withdrawSending'));const op=beginOperation_(nt('withdrawSending'),nt('doNotRepeat'),triggerBtn);try{await call('withdrawLeave',{sessionToken,leaveId,reason})}catch(e){if(e&&e.kind==='TRANSPORT'){finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);const synced=await reconcileAfterTransport_('withdraw',op);if(!synced)message(nt('stillUnknown'),'error');return}mutationBusy=false;setAreaBusy_('leaves',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}mutationBusy=false;setAreaBusy_('leaves',false);myLeavesCache=null;inboxCache=null;dashboardCache=null;finishOperationSuccess_(op,nt('withdrawDone'),tr('withdrawn'));message(tr('withdrawn'),'success');try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;renderLeaves(list);homeData=await call('home',{sessionToken});renderHome();setInboxCount(homeData.pendingApprovalCount||0)}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}};

/* Attendance appeal input. */
openAttendanceAppeal_=async function(encodedCorrectionId,encodedAttendanceKey,triggerBtn){const correctionId=decodeURIComponent(String(encodedCorrectionId||'')),attendanceKey=decodeURIComponent(String(encodedAttendanceKey||''));const ask=await abisHf4Input_(abisHf4Text_('appealTitle'),abisHf4Text_('appealBody'),abisHf4Text_('appealLabel'),abisHf4Text_('appealPlaceholder'),abisHf4Text_('submitAppeal'),abisHf4Text_('cancel'),true,triggerBtn);if(!ask.confirmed)return;return submitAttendanceAppealUi_(correctionId,attendanceKey,ask.value,triggerBtn)};

/* HR temporary PIN reissue. */
hrReissueSelectedCredential=async function(triggerBtn){const d=hrCredentialSelected;if(!d||!d.employeeId)return;if(!await abisHf4Confirm_(abisHf4Text_('reissueTitle'),abisHf4Text_('reissueBody'),abisHf4Text_('reissue'),abisHf4Text_('cancel'),true,triggerBtn))return;mutationBusy=true;setAreaBusy_('hrCredentialAdmin',true);const op=beginOperation_(nt('processing'),nt('doNotRepeat'),triggerBtn);try{const r=await call('hrReissueTemporaryPin',{sessionToken,employeeId:d.employeeId,requestId:'HR-REISSUE-'+Date.now()+'-'+p4a13Uuid_()});const fresh=await call('hrCredentialDetail',{sessionToken,employeeId:d.employeeId});hrCredentialSelected=fresh;renderHrCredentialDetail_(fresh);finishOperationSuccess_(op,tr('hrResetDone'),'');if(r.displayOnce&&r.temporaryPin)hrShowOneTimePin_(r);else message(r.deliveryStatus==='LINE_SENT'?tr('hrLineSent'):tr('hrResetDone'),'success')}catch(e){finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e))}finally{mutationBusy=false;setAreaBusy_('hrCredentialAdmin',false)}};

/* Direct returned-leave resubmit. */
resubmitReturnedDirect_=async function(leaveId,triggerBtn){const x=returnedLeaveById_(leaveId);if(!x||x.status!=='RETURNED'){message('此假單目前不是退回修改狀態');return}if(!await abisHf4Confirm_(abisHf4Text_('resubmitTitle'),abisHf4Text_('resubmitBody'),abisHf4Text_('resubmit'),abisHf4Text_('cancel'),false,triggerBtn))return;if(mutationBusy){message(nt('busy'),'warning');return}mutationBusy=true;setAreaBusy_('leaves',true);if(triggerBtn)triggerBtn.textContent=p4a14t('resubmitting');const op=beginOperation_(p4a14t('resubmitting'),nt('doNotRepeat'),triggerBtn);try{await call('resubmitReturned',{sessionToken,leaveId})}catch(e){if(e&&e.kind==='TRANSPORT'){finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);const synced=await reconcileAfterTransport_('submit',op);if(!synced)message(nt('stillUnknown'),'error');return}mutationBusy=false;setAreaBusy_('leaves',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}mutationBusy=false;setAreaBusy_('leaves',false);myLeavesCache=null;inboxCache=null;dashboardCache=null;finishOperationSuccess_(op,p4t('resubmitDone'),'');message(p4t('resubmitDone'),'success');try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;renderLeaves(list);homeData=await call('home',{sessionToken});renderHome();setInboxCount(homeData.pendingApprovalCount||0)}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}};

/* Legacy returned edit resubmit, for any path that still invokes it directly. */
saveAndResubmitReturned_=async function(){if(!returnedEditLeaveId){message('找不到退回假單');return}if(!await abisHf4Confirm_(abisHf4Text_('resubmitTitle'),abisHf4Text_('resubmitBody'),abisHf4Text_('resubmit'),abisHf4Text_('cancel'),false,$('submitLeaveBtn')))return;if(mutationBusy){message(nt('busy'),'warning');return}const leaveId=returnedEditLeaveId;mutationBusy=true;setAreaBusy_('leaveForm',true);const submitBtn=$('submitLeaveBtn');if(submitBtn)submitBtn.textContent=p4a14t('resubmitting');const op=beginOperation_(p4a14t('resubmitting'),nt('doNotRepeat'));try{await call('saveReturnedDraft',{sessionToken,leaveId,leave:currentLeaveDraft()});updateOperation_(op,p4a14t('resubmitting'),nt('doNotRepeat'));await call('resubmitReturned',{sessionToken,leaveId})}catch(e){if(e&&e.kind==='TRANSPORT'){finishOperationUnknown_(op,nt('resultUnknown'),nt('unknownDetail'),false);const synced=await reconcileAfterTransport_('submit',op);if(!synced)message(nt('stillUnknown'),'error');return}mutationBusy=false;setAreaBusy_('leaveForm',false);finishOperationFailure_(op,e);message(e&&e.message?e.message:String(e));return}mutationBusy=false;setAreaBusy_('leaveForm',false);resetReturnedEditUi_();myLeavesCache=null;inboxCache=null;dashboardCache=null;finishOperationSuccess_(op,p4t('resubmitDone'),'');message(p4t('resubmitDone'),'success');try{const list=await call('myLeaves',{sessionToken});myLeavesCache=list;hideAppSections();$('leaves').classList.remove('hide');renderLeaves(list);homeData=await call('home',{sessionToken});renderHome();fillLeaveTypes();fillProxyCandidates();setInboxCount(homeData.pendingApprovalCount||0)}catch(refreshErr){message(nt('refreshAfterSuccessFail'),'warning')}};

window.ABIS_ESS_DIALOG_HF4=Object.freeze({
  ok:true,
  version:ABIS_DIALOG_HF4_VERSION_,
  release:ABIS_DIALOG_HF4_RELEASE_,
  nativeBrowserDialogsSuperseded:true,
  viewportModal:true,
  preferredLanguage:true,
  focusTrap:true,
  backgroundScrollLock:true,
  flows:Object.freeze(['LEAVE_WITHDRAW','LEAVE_CONFLICT','LEAVE_DRAFT_DISCARD','LEAVE_DRAFT_ATTACHMENT_DELETE','LEAVE_DRAFT_CONFLICT','RETURNED_LEAVE_RESUBMIT','ATTENDANCE_APPEAL','HR_TEMP_PIN_REISSUE']),
  businessRulesChanged:false,
  backendChanged:false
});
