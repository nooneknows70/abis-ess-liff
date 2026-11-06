/**
 * HRLB V1.1.2 paired UI validation, modal lifecycle and status-only recovery.
 * Extends the existing renderer; never replaces the legacy bundle or other tools.
 */
(function () {
  'use strict';
  if (window.ABIS_HRLB_UI_ENTRY_V1_1_2) return;
  if (typeof rc2ManagementToolsHtml_ !== 'function' ||
      typeof rc2AccountPanelHtml_ !== 'function' ||
      typeof rc2OpenAccountPanel_ !== 'function' ||
      typeof rc2InnerTitleForSection_ !== 'function' ||
      typeof rc2InnerBack_ !== 'function' ||
      typeof abisEssM2HasHrTools_ !== 'function' ||
      typeof abisEssM2ToolButton_ !== 'function' ||
      typeof abisEssM7xt_ !== 'function' ||
      typeof renderMyAccount_ !== 'function' || typeof escapeHtml !== 'function' ||
      typeof $ !== 'function' || typeof call !== 'function' ||
      typeof homeData === 'undefined' || typeof sessionToken === 'undefined' ||
      typeof accountPanel_ === 'undefined') return;

const ABIS_ESS_HRLB_UI_={busy:false,requestId:'',preview:null,modal:null,intent:null,result:null,error:'',fieldErrors:{},diagnostic:null,submitted:false,operation:'',form:{employeeId:'',date:'',leaveTypeCode:'PERSONAL',applicationType:'FULL',startTime:'',endTime:'',reason:'',evidenceType:'SOURCE_OWNER_DECISION',evidenceRef:''}};
function abisEssHrlbAllowed_(){return typeof abisEssM2HasHrTools_==='function'&&abisEssM2HasHrTools_();}
function abisEssHrlbRequestId_(){const id=typeof crypto!=='undefined'&&crypto&&typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2,12);return 'HRB-'+id;}
function abisEssHrlbValues_(){const s=ABIS_ESS_HRLB_UI_,next={};['employeeId','date','leaveTypeCode','applicationType','startTime','endTime','reason','evidenceType','evidenceRef'].forEach(function(k){const el=$('abisHrlb_'+k);next[k]=el?String(el.value||'').trim():s.form[k];});return next;}
function abisEssHrlbReadForm_(){const s=ABIS_ESS_HRLB_UI_,next=abisEssHrlbValues_();if(JSON.stringify(next)!==JSON.stringify(s.form)){s.preview=null;s.requestId='';s.modal=null;s.intent=null;}s.form=next;}
function abisEssHrlbLocked_(){const s=ABIS_ESS_HRLB_UI_;return s.busy||!!s.modal||s.submitted||!!s.result;}
function abisEssHrlbErrorSlot_(key){return '<div id="abisHrlb_error_'+key+'" class="status-inline-fail" hidden></div>';}
function abisEssHrlbChoice_(id,items,value){return '<select id="abisHrlb_'+id+'" aria-describedby="abisHrlb_error_'+id+'">'+items.map(function(x){return '<option value="'+escapeHtml(x[0])+'"'+(value===x[0]?' selected':'')+'>'+escapeHtml(x[1])+'</option>';}).join('')+'</select>'+abisEssHrlbErrorSlot_(id);}
function abisEssHrlbField_(key,label,type){const value=ABIS_ESS_HRLB_UI_.form[key]||'';return '<label for="abisHrlb_'+key+'">'+escapeHtml(label)+'</label>'+(type==='textarea'?'<textarea id="abisHrlb_'+key+'" rows="2" maxlength="500" aria-describedby="abisHrlb_error_'+key+'">'+escapeHtml(value)+'</textarea>':'<input id="abisHrlb_'+key+'" type="'+(type||'text')+'" value="'+escapeHtml(value)+'" aria-describedby="abisHrlb_error_'+key+'">')+abisEssHrlbErrorSlot_(key);}
function abisEssHrlbRules_(){return [['PERSONAL','事假'],['SICK','普通傷病假'],['MENSTRUAL','生理假'],['FAMILY_CARE','家庭照顧假'],['FAMILY_PERSONAL','家庭照顧事假'],['MARRIAGE','婚假'],['BEREAVEMENT','喪假'],['MATERNITY','產假'],['PRENATAL','產檢假'],['PATERNITY','陪產檢及陪產假'],['PREGNANCY_REST','安胎休養'],['OFFICIAL','公假']];}
function abisEssHrlbValidate_(){const s=ABIS_ESS_HRLB_UI_,p=s.form,e={};if(!/^[A-Z]\d{5}$/.test(p.employeeId.toUpperCase()))e.employeeId='請填寫正確的員工編號';if(!p.date)e.date='請選擇補登日期';if(p.reason.length<8)e.reason='請填寫至少 8 個字的補登及核准原因';if(p.evidenceRef.length<6)e.evidenceRef='請填寫來源／證據參照（至少 6 個字）';if(p.applicationType==='HOURLY'){if(!p.startTime)e.startTime='請填寫開始時間';if(!p.endTime||p.endTime<=p.startTime)e.endTime='請填寫晚於開始時間的結束時間';}s.fieldErrors=e;return Object.keys(e).length===0;}
function abisEssHrlbHumanError_(out){
  const s=ABIS_ESS_HRLB_UI_,raw=(out&&out.issues||[]).join(',')+','+String(out&&out.gate||out&&out.message||'');
  s.diagnostic={kind:'PREVIEW_HOLD',detail:raw};
  const mappings={AUDIT_REASON_REQUIRED:['reason','請填寫至少 8 個字的補登及核准原因'],EVIDENCE_SOURCE_REFERENCE_REQUIRED:['evidenceRef','請填寫來源／證據參照（至少 6 個字）'],EMPLOYEE_ID_INVALID:['employeeId','請填寫正確的員工編號'],SELF_APPROVAL_FORBIDDEN:['employeeId','不可替自己核准請假，請由另一位 HR／Admin 處理'],BACKFILL_MUST_BE_PREVIOUS_PRODUCTION_DAY:['date','只能補登已發生的歷史日期'],BEFORE_HIRE_DATE:['date','補登日期不可早於到職日'],AFTER_TERMINATION_DATE:['date','補登日期不可晚於離職日'],SUPPORTING_EVIDENCE_NOT_VERIFIED:['evidenceRef','請先確認此假別所需的證明文件']};
  Object.keys(mappings).forEach(function(k){if(raw.includes(k)){const m=mappings[k];s.fieldErrors[m[0]]=m[1];}});
  if(Object.keys(s.fieldErrors).length)return;
  const messages={EXISTING_PENDING_OR_APPROVED_LEAVE_OVERLAP:'此日期已有請假紀錄，請先查核，勿重複補登。',CLOSED_OR_UNVERIFIED_ATTENDANCE_MONTH:'此出勤月份尚未開放補登，請聯絡系統管理員。',EXISTING_LONG_LEAVE_TOP_APPROVAL_GATE_NOT_OVERRIDDEN:'此筆涉及長假核准規則，請循既有最高主管核准流程。',LEAVE_QUOTA_GATE_NOT_PASSED:'此筆請假額度未通過檢查，請先由 HR 查核。',BACKFILL_PRODUCTION_MODE_DISABLED:'目前尚未開放歷史補登，請聯絡系統管理員。',HR_BACKFILL_JOURNAL_SCHEMA_REQUIRED:'補登紀錄服務尚未就緒，請聯絡系統管理員。'};
  s.error=Object.keys(messages).filter(function(k){return raw.includes(k);}).map(function(k){return messages[k];}).join(' ')||'目前無法完成補登，請重新檢查資料或聯絡系統管理員。';
}
function abisEssHrlbFocusError_(){const key=Object.keys(ABIS_ESS_HRLB_UI_.fieldErrors)[0],el=key&&$('abisHrlb_'+key);if(el)el.focus();}
function abisEssHrlbResultText_(){const r=ABIS_ESS_HRLB_UI_.result;if(!r)return '';return {COMPLETE:'補登並核准完成，出勤已讀回。',APPROVED_PENDING:'這筆請假已核准，但出勤同步尚未完成。請勿重複補登。',NOT_FOUND:'目前查不到這筆補登紀錄。請勿重新送出，請由系統管理員查核原申請編號。',RECEIPT_MISMATCH:'查詢到的資料與原補登內容不一致，已停止後續操作。請勿重複送出。',UNAVAILABLE:'目前無法確認處理結果。系統已保留同一筆申請編號，請稍後查詢，不要重新補登。'}[r.category]||'目前無法完成補登，請重新檢查資料或聯絡系統管理員。';}
function abisEssHrlbButtonsHtml_(){const s=ABIS_ESS_HRLB_UI_,r=s.result;return (!s.submitted?'<button id="abisHrlb_primary" type="button" class="abis-m71-primary" '+(abisEssHrlbLocked_()?'disabled ':'')+'onclick="abisEssHrlbStart_()">'+(s.busy?'<span class="op-spinner" aria-hidden="true"></span> 正在檢查…':'補登並核准')+'</button>':'')+(r&&r.category!=='COMPLETE'&&r.category!=='RECEIPT_MISMATCH'?'<button id="abisHrlb_status" type="button" class="secondary" '+(s.busy?'disabled ':'')+'onclick="abisEssHrlbRecover_()">'+(s.busy?'<span class="op-spinner" aria-hidden="true"></span> 正在查詢…':'查詢同一筆結果')+'</button>':'')+(r&&r.category==='COMPLETE'?'<button type="button" class="secondary" onclick="abisEssHrlbReset_()">新增另一筆</button>':'');}
function abisEssHrlbPanelHtml_(){
  if(!abisEssHrlbAllowed_())return '<div class="abis-m7x-error">本功能僅開放 Admin／HR</div>';
  const s=ABIS_ESS_HRLB_UI_,evidence=[['SOURCE_OWNER_DECISION','負責人已確認'],['MANAGER_CONFIRMATION','主管已確認'],['EMPLOYEE_ATTESTATION','員工申述'],['PAPER_RECORD','紙本證明／紀錄'],['ATTENDANCE_RECORD','出勤來源紀錄'],['OTHER','其他已核對來源']];
  return '<section id="abisHrlb_panel" class="abis-m7x-panel"><div class="abis-m7x-title"><h3>歷史請假補登核定</h3><span class="abis-m7x-pill">Admin / HR</span></div><div class="abis-m7x-note">僅補登已發生的單日請假，由目前登入的 HR／Admin 核准，不得替自己核准。特休、長假及特殊證明假別依既有規則處理。</div><div class="abis-m7x-controls" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+
    '<div>'+abisEssHrlbField_('employeeId','員工編號','text')+'</div><div>'+abisEssHrlbField_('date','補登日期','date')+'</div><div><label for="abisHrlb_leaveTypeCode">假別</label>'+abisEssHrlbChoice_('leaveTypeCode',abisEssHrlbRules_(),s.form.leaveTypeCode)+'</div><div><label for="abisHrlb_applicationType">申請型態</label>'+abisEssHrlbChoice_('applicationType',[['FULL','全天'],['HOURLY','指定時段']],s.form.applicationType)+'</div><div>'+abisEssHrlbField_('startTime','開始時間（指定時段用）','time')+'</div><div>'+abisEssHrlbField_('endTime','結束時間（指定時段用）','time')+'</div><div style="grid-column:1/-1">'+abisEssHrlbField_('reason','補登及核准原因','textarea')+'</div><div><label for="abisHrlb_evidenceType">依據類型</label>'+abisEssHrlbChoice_('evidenceType',evidence,s.form.evidenceType)+'</div><div>'+abisEssHrlbField_('evidenceRef','來源／證據參照','text')+'</div></div><div id="abisHrlb_summary" class="status-inline-fail" role="alert" hidden></div><div id="abisHrlb_result" class="abis-m7x-note" role="status" hidden></div><div id="abisHrlb_actions">'+abisEssHrlbButtonsHtml_()+'</div></section>';
}
function abisEssHrlbModalHtml_(){
  const s=ABIS_ESS_HRLB_UI_,p=s.intent,v=s.preview;if(!s.modal||!p||!v)return '';
  const rule=abisEssHrlbRules_().find(function(x){return x[0]===p.leaveTypeCode;}),actor=homeData&&homeData.employee||{},actorId=String(actor.employeeId||actor.id||''),signer=(actorId===v.actorId&&actor.name?actor.name+' · ':'')+v.actorId+'（'+v.role+'）',time=p.applicationType==='HOURLY'?'指定時段 HOURLY · '+p.startTime+'–'+p.endTime+' · '+v.hours+' 小時':'全天 FULL · '+v.hours+' 小時';
  return '<section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="abisHrlb_modalTitle" onkeydown="abisEssHrlbModalKey_(event)"><h2 id="abisHrlb_modalTitle">確認補登並核准</h2><dl>'+[['員工',v.employeeId],['日期',v.date],['假別',rule?rule[1]:v.leaveTypeCode],['時數／時段',time],['目前核定人',signer]].map(function(x){return '<dt>'+escapeHtml(x[0])+'</dt><dd>'+escapeHtml(x[1])+'</dd>';}).join('')+'</dl><div class="confirm-actions"><button id="abisHrlb_modalCancel" type="button" class="secondary" onclick="abisEssHrlbCancel_()">返回修改</button><button id="abisHrlb_modalConfirm" type="button" class="abis-m71-primary" onclick="abisEssHrlbConfirm_()">確認補登並核准</button></div></section>';
}
function abisEssHrlbCloseModal_(){const el=$('abisHrlb_overlay');if(el)el.remove();}
function abisEssHrlbRender_(){
  const s=ABIS_ESS_HRLB_UI_;if(accountPanel_!=='historicalLeaveBackfill'||!abisEssHrlbAllowed_()){abisEssHrlbCloseModal_();return;}
  if(!$('abisHrlb_panel'))renderMyAccount_();
  const panel=$('abisHrlb_panel');if(!panel)return;
  panel.setAttribute('aria-busy',s.busy?'true':'false');
  Object.keys(s.form).forEach(function(k){const el=$('abisHrlb_'+k),error=$('abisHrlb_error_'+k),text=s.fieldErrors[k]||'';if(el){el.disabled=!!abisEssHrlbLocked_();el.setAttribute('aria-invalid',text?'true':'false');el.style.borderColor=text?'#b91c1c':'';}if(error){error.textContent=text;error.hidden=!text;}});
  const summary=$('abisHrlb_summary'),n=Object.keys(s.fieldErrors).length;if(summary){summary.textContent=n?'請完成 '+n+' 個必填項目後再送出。':s.error;summary.hidden=!summary.textContent;}
  const result=$('abisHrlb_result');if(result){result.textContent=abisEssHrlbResultText_()+(s.result&&s.requestId?' 申請編號：'+s.requestId:'');result.hidden=!s.result;}
  const actions=$('abisHrlb_actions');if(actions)actions.innerHTML=abisEssHrlbButtonsHtml_();
  if(!s.modal){abisEssHrlbCloseModal_();return;}
  let overlay=$('abisHrlb_overlay'),created=false;
  if(!overlay){overlay=document.createElement('div');overlay.id='abisHrlb_overlay';overlay.className='confirm-backdrop';overlay.innerHTML=abisEssHrlbModalHtml_();document.body.appendChild(overlay);created=true;}
  const cancel=$('abisHrlb_modalCancel'),confirm=$('abisHrlb_modalConfirm');if(cancel)cancel.disabled=s.busy;if(confirm){confirm.disabled=s.busy;confirm.setAttribute('aria-busy',s.busy?'true':'false');confirm.innerHTML=s.busy?'<span class="op-spinner" aria-hidden="true"></span> 正在補登並核准…':'確認補登並核准';if(created)confirm.focus();}
}
function abisEssHrlbCancel_(){const s=ABIS_ESS_HRLB_UI_;if(s.busy||s.submitted)return;s.modal=null;s.preview=null;s.intent=null;abisEssHrlbRender_();const button=$('abisHrlb_primary');if(button)button.focus();}
function abisEssHrlbModalKey_(event){if(event.key==='Escape'){event.preventDefault();abisEssHrlbCancel_();}if(event.key==='Tab'){const first=$('abisHrlb_modalCancel'),last=$('abisHrlb_modalConfirm');if(event.shiftKey&&event.target===first){event.preventDefault();if(last)last.focus();}else if(!event.shiftKey&&event.target===last){event.preventDefault();if(first)first.focus();}}}
function abisEssHrlbReset_(){const s=ABIS_ESS_HRLB_UI_;if(s.busy||s.modal||!s.result||s.result.category!=='COMPLETE')return;Object.assign(s,{requestId:'',preview:null,modal:null,intent:null,result:null,error:'',fieldErrors:{},diagnostic:null,submitted:false,operation:'',form:{employeeId:'',date:'',leaveTypeCode:'PERSONAL',applicationType:'FULL',startTime:'',endTime:'',reason:'',evidenceType:'SOURCE_OWNER_DECISION',evidenceRef:''}});Object.keys(s.form).forEach(function(k){const el=$('abisHrlb_'+k);if(el)el.value=s.form[k];});abisEssHrlbRender_();}
async function abisEssHrlbStart_(){
  const s=ABIS_ESS_HRLB_UI_;if(!abisEssHrlbAllowed_()||s.busy||s.modal||s.submitted||s.result)return;
  abisEssHrlbReadForm_();s.fieldErrors={};s.error='';if(!abisEssHrlbValidate_()){abisEssHrlbRender_();abisEssHrlbFocusError_();return;}
  if(!s.requestId)s.requestId=abisEssHrlbRequestId_();s.intent=Object.assign({},s.form);s.busy=true;s.preview=null;s.operation='正在檢查';abisEssHrlbRender_();
  try{const out=await call('hrLeaveBackfillPreview',Object.assign({sessionToken,requestId:s.requestId},s.intent));if(!out||out.ok!==true){abisEssHrlbHumanError_(out);return;}
    if(out.mode!=='READ_ONLY_BACKFILL_PREVIEW'||!out.previewHash||!Number.isFinite(Number(out.hours))||out.requestId!==s.requestId||out.employeeId!==s.intent.employeeId.toUpperCase()||out.date!==s.intent.date||out.leaveTypeCode!==s.intent.leaveTypeCode||!out.actorId||!['HR','ADMIN'].includes(out.role)||!(Number(out.hours)>0))throw Error('PREVIEW_RECEIPT_MISMATCH');
    const actor=homeData&&homeData.employee||{},actorId=String(actor.employeeId||actor.id||'');if(actorId&&actorId!==out.actorId)throw Error('PREVIEW_ACTOR_MISMATCH');s.preview=out;s.modal={requestId:s.requestId,previewHash:out.previewHash};
  }catch(e){abisEssHrlbHumanError_({message:e&&e.message});}finally{s.busy=false;abisEssHrlbRender_();abisEssHrlbFocusError_();}
}
function abisEssHrlbMismatch_(){const s=ABIS_ESS_HRLB_UI_;s.result={known:false,completed:false,category:'RECEIPT_MISMATCH'};s.diagnostic={kind:'RECEIPT_MISMATCH'};}
function abisEssHrlbKnownResult_(out){
  const s=ABIS_ESS_HRLB_UI_;if(!out||!out.leaveId)return false;
  const mismatch=(out.requestId&&out.requestId!==s.requestId)||(out.employeeId&&out.employeeId!==s.intent.employeeId.toUpperCase())||(out.date&&out.date!==s.intent.date)||(out.approvedBy&&out.approvedBy!==s.preview.actorId)||(out.leaveTypeCode&&out.leaveTypeCode!==s.intent.leaveTypeCode)||(out.leaveType&&out.leaveType!==s.intent.leaveTypeCode)||(s.result&&s.result.leaveId&&out.leaveId!==s.result.leaveId);
  if(mismatch){abisEssHrlbMismatch_();return false;}
  const completed=out.completed===true||out.ok===true&&out.factVerified===true&&out.dailyVerified===true;
  const approved=out.approved===true||['APPROVED_SYNC_HOLD','APPROVED_PROJECTION_HOLD','FACT_VERIFIED','COMPLETE'].includes(out.state);
  if(!completed&&!approved)return false;
  s.result=Object.assign({},out,{known:true,approved:approved,completed:completed,category:completed?'COMPLETE':'APPROVED_PENDING'});return true;
}
async function abisEssHrlbReadStatus_(){
  const s=ABIS_ESS_HRLB_UI_;if(s.result&&s.result.category==='RECEIPT_MISMATCH')return;
  try{const out=await call('hrLeaveBackfillStatus',{sessionToken,requestId:s.requestId});if(!out||out.found!==true){if(out&&out.found===false){if(!s.result||!s.result.approved)s.result={known:false,completed:false,category:'NOT_FOUND'};}else if(!s.result||!s.result.approved)s.result={known:false,completed:false,category:'UNAVAILABLE'};return;}
    if(out.requestId!==s.requestId||out.employeeId!==s.intent.employeeId.toUpperCase()||out.date!==s.intent.date||out.leaveType!==s.intent.leaveTypeCode||out.approvedBy!==s.preview.actorId||!out.leaveId){abisEssHrlbMismatch_();return;}
    if(!abisEssHrlbKnownResult_(out)&&(!s.result||s.result.category!=='RECEIPT_MISMATCH'))s.result={known:false,completed:false,category:'UNAVAILABLE'};
  }catch(e){s.diagnostic={kind:'STATUS_UNAVAILABLE',detail:String(e&&e.message||e)};if(!s.result||!s.result.approved)s.result={known:false,completed:false,category:'UNAVAILABLE'};}
}
async function abisEssHrlbSubmit_(mode){
  const s=ABIS_ESS_HRLB_UI_;if(mode!=='CONFIRMED'||!abisEssHrlbAllowed_()||s.busy||s.submitted||!s.preview||!s.intent||!s.requestId||!s.modal)return;
  s.busy=true;s.submitted=true;s.operation='正在補登、核准並讀回';abisEssHrlbRender_();
  try{const out=await call('hrLeaveBackfillOneClick',Object.assign({sessionToken,requestId:s.requestId,confirm:true,previewHash:s.preview.previewHash},s.intent));if(!abisEssHrlbKnownResult_(out)&&(!s.result||s.result.category!=='RECEIPT_MISMATCH')){s.result={known:false,completed:false,category:'UNAVAILABLE'};await abisEssHrlbReadStatus_();}}
  catch(e){s.diagnostic={kind:'ONECLICK_TRANSPORT_UNKNOWN',detail:String(e&&e.message||e)};s.result={known:false,completed:false,category:'UNAVAILABLE'};await abisEssHrlbReadStatus_();}
  finally{s.busy=false;s.modal=null;abisEssHrlbRender_();}
}
async function abisEssHrlbConfirm_(){const s=ABIS_ESS_HRLB_UI_;if(!abisEssHrlbAllowed_()||s.busy||s.submitted||!s.modal||!s.preview)return;if(JSON.stringify(abisEssHrlbValues_())!==JSON.stringify(s.intent)||s.modal.requestId!==s.requestId||s.modal.previewHash!==s.preview.previewHash){s.modal=null;s.preview=null;s.intent=null;s.error='資料已變更，請再次按補登並核准；尚未提交';abisEssHrlbRender_();return;}await abisEssHrlbSubmit_('CONFIRMED');}
async function abisEssHrlbRecover_(){const s=ABIS_ESS_HRLB_UI_;if(!abisEssHrlbAllowed_()||s.busy||!s.submitted||!s.result||s.result.completed||s.result.category==='RECEIPT_MISMATCH')return;s.busy=true;s.operation='正在查詢同一筆結果';abisEssHrlbRender_();try{await abisEssHrlbReadStatus_();}finally{s.busy=false;abisEssHrlbRender_();}}
// Recovery is status-only. A second OneClick is never sent by this UI.
async function abisEssHrlbResume_(){await abisEssHrlbRecover_();}

  const originalTools = rc2ManagementToolsHtml_;
  const originalPanel = rc2AccountPanelHtml_;
  const originalOpen = rc2OpenAccountPanel_;
  const originalTitle = rc2InnerTitleForSection_;
  const originalBack = rc2InnerBack_;
  const panelName = 'historicalLeaveBackfill';
  const label = '歷史請假補登核定';

  rc2ManagementToolsHtml_ = function () {
    const html = originalTools.apply(this, arguments);
    try {
      if (!abisEssHrlbAllowed_() || typeof html !== 'string') return html;
      const button = abisEssM2ToolButton_(label, "rc2OpenAccountPanel_('historicalLeaveBackfill')");
      const anchor = abisEssM2ToolButton_(abisEssM7xt_('managementReports'), "rc2OpenAccountPanel_('managementReports')");
      // Require the exact existing anchor once; unexpected layout stays intact.
      if (html.includes("rc2OpenAccountPanel_('historicalLeaveBackfill')") ||
          html.split(anchor).length !== 2) return html;
      return html.replace(anchor, button + anchor);
    } catch (ignore) { return html; }
  };
  rc2AccountPanelHtml_ = function (panel) {
    if (String(panel || '') !== panelName) return originalPanel.apply(this, arguments);
    try { return '<div class="rc2-account-panel abis-m7x-root">' + abisEssHrlbPanelHtml_() + '</div>'; }
    catch (ignore) { return '<div role="alert">補登畫面暫時無法載入，請返回管理工具。</div>'; }
  };
  rc2OpenAccountPanel_ = function (panel) {
    if (String(panel || '') === panelName && !abisEssHrlbAllowed_()) return;
    if (String(panel || '') !== panelName) abisEssHrlbCloseModal_();
    const result = originalOpen.apply(this, arguments);
    if (String(panel || '') === panelName) abisEssHrlbRender_();
    return result;
  };
  rc2InnerTitleForSection_ = function (id) {
    if (id === 'account' && accountPanel_ === panelName && abisEssHrlbAllowed_()) return label;
    return originalTitle.apply(this, arguments);
  };
  rc2InnerBack_ = function () {
    if (typeof rc2VisibleInnerSection_ === 'function' &&
        rc2VisibleInnerSection_() === 'account' && accountPanel_ === panelName) {
      abisEssHrlbCloseModal_();
      accountPanel_ = 'management';
      renderMyAccount_();
      if (typeof rc2UpdateInnerBar_ === 'function') rc2UpdateInnerBar_();
      return;
    }
    return originalBack.apply(this, arguments);
  };

  Object.assign(window, {ABIS_ESS_HRLB_UI_, abisEssHrlbAllowed_, abisEssHrlbRequestId_, abisEssHrlbValues_, abisEssHrlbReadForm_, abisEssHrlbLocked_, abisEssHrlbErrorSlot_, abisEssHrlbChoice_, abisEssHrlbField_, abisEssHrlbRules_, abisEssHrlbValidate_, abisEssHrlbHumanError_, abisEssHrlbFocusError_, abisEssHrlbResultText_, abisEssHrlbButtonsHtml_, abisEssHrlbPanelHtml_, abisEssHrlbModalHtml_, abisEssHrlbCloseModal_, abisEssHrlbRender_, abisEssHrlbCancel_, abisEssHrlbModalKey_, abisEssHrlbReset_, abisEssHrlbStart_, abisEssHrlbMismatch_, abisEssHrlbKnownResult_, abisEssHrlbReadStatus_, abisEssHrlbSubmit_, abisEssHrlbConfirm_, abisEssHrlbRecover_, abisEssHrlbResume_});
  window.ABIS_HRLB_UI_ENTRY_V1_1_2 = Object.freeze({version:'HRLB_V1_1_2_20261106'});
})();
