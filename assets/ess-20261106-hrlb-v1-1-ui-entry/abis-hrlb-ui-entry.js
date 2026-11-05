/**
 * HRLB V1.1.1 entry adapter. Source semantics: Backend 2f68d706 / PERF1_JS_M7.html.
 * Extends the existing renderer; never replaces the legacy bundle or other tools.
 */
(function () {
  'use strict';
  if (window.ABIS_HRLB_UI_ENTRY_V1_1_1) return;
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

const ABIS_ESS_HRLB_UI_={
  busy:false,requestId:'',preview:null,modal:null,intent:null,result:null,error:'',
  submitted:false,operation:'',
  form:{employeeId:'',date:'',leaveTypeCode:'PERSONAL',applicationType:'FULL',
    startTime:'',endTime:'',reason:'',evidenceType:'SOURCE_OWNER_DECISION',evidenceRef:''}
};
function abisEssHrlbAllowed_(){
  return typeof abisEssM2HasHrTools_==='function'&&abisEssM2HasHrTools_();
}
function abisEssHrlbRequestId_(){
  const id=typeof crypto!=='undefined'&&crypto&&typeof crypto.randomUUID==='function'
    ? crypto.randomUUID() : Date.now()+'-'+Math.random().toString(36).slice(2,12);
  return 'HRB-'+id;
}
function abisEssHrlbValues_(){
  const s=ABIS_ESS_HRLB_UI_,next={};
  ['employeeId','date','leaveTypeCode','applicationType','startTime','endTime',
    'reason','evidenceType','evidenceRef'].forEach(function(k){
    const el=$('abisHrlb_'+k);next[k]=el?String(el.value||'').trim():s.form[k];
  });
  return next;
}
function abisEssHrlbReadForm_(){
  const s=ABIS_ESS_HRLB_UI_,next=abisEssHrlbValues_();
  if(JSON.stringify(next)!==JSON.stringify(s.form)){
    s.preview=null;s.requestId='';s.modal=null;s.intent=null;
  }
  s.form=next;
}
function abisEssHrlbLocked_(){
  const s=ABIS_ESS_HRLB_UI_;return s.busy||!!s.modal||s.submitted||!!s.result;
}
function abisEssHrlbChoice_(id,items,value){
  return '<select id="abisHrlb_'+id+'" '+(abisEssHrlbLocked_()?'disabled ':'')+'>'+items.map(function(x){
    return '<option value="'+escapeHtml(x[0])+'"'+(value===x[0]?' selected':'')+'>'+escapeHtml(x[1])+'</option>';
  }).join('')+'</select>';
}
function abisEssHrlbField_(key,label,type){
  const value=ABIS_ESS_HRLB_UI_.form[key]||'',disabled=abisEssHrlbLocked_()?'disabled ':'';
  return '<label for="abisHrlb_'+key+'">'+escapeHtml(label)+'</label>'+(type==='textarea'
    ? '<textarea id="abisHrlb_'+key+'" '+disabled+'rows="2" maxlength="500">'+escapeHtml(value)+'</textarea>'
    : '<input id="abisHrlb_'+key+'" '+disabled+'type="'+(type||'text')+'" value="'+escapeHtml(value)+'">');
}
function abisEssHrlbRules_(){return [
  ['PERSONAL','事假'],['SICK','普通傷病假'],['MENSTRUAL','生理假'],['FAMILY_CARE','家庭照顧假'],
  ['FAMILY_PERSONAL','家庭照顧事假'],['MARRIAGE','婚假'],['BEREAVEMENT','喪假'],['MATERNITY','產假'],
  ['PRENATAL','產檢假'],['PATERNITY','陪產檢及陪產假'],['PREGNANCY_REST','安胎休養'],['OFFICIAL','公假']
];}
function abisEssHrlbModalHtml_(){
  const s=ABIS_ESS_HRLB_UI_;if(!s.modal)return '';
  const p=s.intent,v=s.preview,rule=abisEssHrlbRules_().find(function(x){return x[0]===p.leaveTypeCode;});
  const actor=homeData&&homeData.employee||{},actorId=String(actor.employeeId||actor.id||'');
  const signer=(actorId===v.actorId&&actor.name?actor.name+' · ':'')+v.actorId+'（'+v.role+'）';
  const time=p.applicationType==='HOURLY'?p.startTime+'–'+p.endTime+' · '+v.hours+' 小時':'全天 · '+v.hours+' 小時';
  return '<div style="position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,.55);display:grid;place-items:center;padding:16px">'+
    '<section role="dialog" aria-modal="true" aria-labelledby="abisHrlb_modalTitle" onkeydown="abisEssHrlbModalKey_(event)" style="width:min(100%,440px);max-height:90vh;overflow:auto;background:#fff;color:#142640;border-radius:18px;padding:20px;box-shadow:0 18px 60px #0004">'+
    '<h3 id="abisHrlb_modalTitle">確認補登並核准</h3><dl>'+[
      ['員工',v.employeeId],['日期',v.date],['假別',rule?rule[1]:v.leaveTypeCode],['時數／時段',time],['目前核定人',signer]
    ].map(function(x){return '<dt style="color:#53677e;margin-top:10px">'+escapeHtml(x[0])+'</dt><dd style="margin:2px 0;font-weight:700">'+escapeHtml(x[1])+'</dd>';}).join('')+
    '</dl><div class="abis-m7x-action-row"><button id="abisHrlb_modalCancel" type="button" class="secondary" onclick="abisEssHrlbCancel_()">返回修改</button>'+
    '<button id="abisHrlb_modalConfirm" type="button" onclick="abisEssHrlbConfirm_()">確認補登並核准</button></div></section></div>';
}
function abisEssHrlbPanelHtml_(){
  if(!abisEssHrlbAllowed_())return '<div class="abis-m7x-error">本功能僅開放 Admin／HR</div>';
  const s=ABIS_ESS_HRLB_UI_,result=s.result;
  const evidence=[['SOURCE_OWNER_DECISION','負責人已確認'],['MANAGER_CONFIRMATION','主管已確認'],
    ['EMPLOYEE_ATTESTATION','員工申述'],['PAPER_RECORD','紙本證明／紀錄'],['ATTENDANCE_RECORD','出勤來源紀錄'],['OTHER','其他已核對來源']];
  return '<section class="abis-m7x-panel" aria-busy="'+(s.busy?'true':'false')+'">'+
    '<div class="abis-m7x-title"><h3>歷史請假補登核定</h3><span class="abis-m7x-pill">Admin / HR</span></div>'+
    '<div class="abis-m7x-note">僅補登已發生的單日請假，由目前登入的 HR／Admin 核准，不得替自己核准。特休、長假及特殊證明假別依既有規則處理。</div>'+
    '<div class="abis-m7x-controls" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+
      '<div>'+abisEssHrlbField_('employeeId','員工編號','text')+'</div><div>'+abisEssHrlbField_('date','補登日期','date')+'</div>'+
      '<div><label for="abisHrlb_leaveTypeCode">假別</label>'+abisEssHrlbChoice_('leaveTypeCode',abisEssHrlbRules_(),s.form.leaveTypeCode)+'</div>'+
      '<div><label for="abisHrlb_applicationType">申請型態</label>'+abisEssHrlbChoice_('applicationType',[['FULL','全天'],['HOURLY','指定時段']],s.form.applicationType)+'</div>'+
      '<div>'+abisEssHrlbField_('startTime','開始時間（指定時段用）','time')+'</div><div>'+abisEssHrlbField_('endTime','結束時間（指定時段用）','time')+'</div>'+
      '<div style="grid-column:1/-1">'+abisEssHrlbField_('reason','補登及核准原因','textarea')+'</div>'+
      '<div><label for="abisHrlb_evidenceType">依據類型</label>'+abisEssHrlbChoice_('evidenceType',evidence,s.form.evidenceType)+'</div>'+
      '<div>'+abisEssHrlbField_('evidenceRef','來源／證據參照','text')+'</div></div>'+
    (s.error?'<div class="abis-m7x-error" role="alert">'+escapeHtml(s.error)+'</div>':'')+
    (result?'<div class="abis-m7x-note" role="status">'+escapeHtml(result.completed?'補登並核准完成，出勤已讀回。':result.known?'已取得本筆結果；請依回執確認尚未完成的步驟。':'結果尚未確認，請查詢同一筆結果，勿重複補登。')+
      (result.leaveId?' · '+escapeHtml(result.leaveId):'')+' · '+escapeHtml(result.gate||result.state||'')+'</div>':'')+
    (!s.submitted&&!result&&!s.modal?'<button id="abisHrlb_primary" type="button" '+(abisEssHrlbLocked_()?'disabled ':'')+'onclick="abisEssHrlbStart_()">'+
      (s.busy?'<span class="op-spinner" aria-hidden="true"></span> 正在檢查…':'補登並核准')+'</button>':'')+
    (s.busy&&s.submitted?'<div role="status"><span class="op-spinner" aria-hidden="true"></span> '+escapeHtml(s.operation)+'</div>':'')+
    (result&&!result.known?'<button type="button" class="secondary" '+(s.busy?'disabled ':'')+'onclick="abisEssHrlbRecover_()">查詢同一筆結果</button>':'')+
    (result&&result.known&&result.approved&&!result.completed&&/HOLD|PENDING|FACT_VERIFIED/.test(result.gate||result.state||'')?
      '<button type="button" class="secondary" '+(s.busy?'disabled ':'')+'onclick="abisEssHrlbResume_()">繼續同一筆出勤讀回</button>':'')+
    (result&&result.known?'<button type="button" class="secondary" '+(s.busy?'disabled ':'')+'onclick="abisEssHrlbReset_()">新增另一筆</button>':'')+
    abisEssHrlbModalHtml_()+'</section>';
}
function abisEssHrlbRender_(){
  if(accountPanel_==='historicalLeaveBackfill'){
    renderMyAccount_();const el=$('abisHrlb_modalConfirm');if(el&&ABIS_ESS_HRLB_UI_.modal)el.focus();
  }
}
function abisEssHrlbCancel_(){
  const s=ABIS_ESS_HRLB_UI_;if(s.busy||s.submitted)return;s.modal=null;s.preview=null;s.intent=null;abisEssHrlbRender_();
  const button=$('abisHrlb_primary');if(button)button.focus();
}
function abisEssHrlbModalKey_(event){
  if(event.key==='Escape'){event.preventDefault();abisEssHrlbCancel_();}
  if(event.key==='Tab'){
    const first=$('abisHrlb_modalCancel'),last=$('abisHrlb_modalConfirm');
    if(event.shiftKey&&event.target===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&event.target===last){event.preventDefault();first.focus();}
  }
}
function abisEssHrlbReset_(){
  const s=ABIS_ESS_HRLB_UI_;if(s.busy||s.modal||!s.result||!s.result.known)return;
  Object.assign(s,{requestId:'',preview:null,modal:null,intent:null,result:null,error:'',submitted:false,operation:'',
    form:{employeeId:'',date:'',leaveTypeCode:'PERSONAL',applicationType:'FULL',startTime:'',endTime:'',reason:'',evidenceType:'SOURCE_OWNER_DECISION',evidenceRef:''}});
  abisEssHrlbRender_();
}
async function abisEssHrlbStart_(){
  const s=ABIS_ESS_HRLB_UI_;if(!abisEssHrlbAllowed_()||s.busy||s.modal||s.submitted||s.result)return;
  abisEssHrlbReadForm_();if(!s.requestId)s.requestId=abisEssHrlbRequestId_();s.intent=Object.assign({},s.form);
  s.busy=true;s.error='';s.preview=null;s.operation='正在檢查';abisEssHrlbRender_();
  try{
    const out=await call('hrLeaveBackfillPreview',Object.assign({sessionToken,requestId:s.requestId},s.intent));
    if(!out||out.ok!==true){s.error=(out&&out.issues||[]).join(' / ')||out&&out.gate||'目前無法補登，請檢查資料';return;}
    if(out.mode!=='READ_ONLY_BACKFILL_PREVIEW'||!out.previewHash||!Number.isFinite(Number(out.hours))||out.requestId!==s.requestId||out.employeeId!==s.intent.employeeId.toUpperCase()||out.date!==s.intent.date||out.leaveTypeCode!==s.intent.leaveTypeCode||!out.actorId||!['HR','ADMIN'].includes(out.role)||!(Number(out.hours)>0))throw Error('預檢回執與本筆資料不一致，尚未提交');
    const actor=homeData&&homeData.employee||{},actorId=String(actor.employeeId||actor.id||'');
    if(actorId&&actorId!==out.actorId)throw Error('登入核定人已變更，尚未提交');
    s.preview=out;s.modal={requestId:s.requestId,previewHash:out.previewHash};
  }catch(e){s.error=e&&e.message?e.message:String(e);}
  finally{s.busy=false;abisEssHrlbRender_();}
}
function abisEssHrlbKnownResult_(out){
  const s=ABIS_ESS_HRLB_UI_;
  if(!out||!out.leaveId)throw Error('結果尚未確認');
  if(out.requestId&&out.requestId!==s.requestId)throw Error('回執 RequestID 不一致');
  s.result=Object.assign({},out,{known:true,completed:out.completed===true||out.ok===true&&out.factVerified===true&&out.dailyVerified===true});
}
async function abisEssHrlbReadStatus_(){
  const s=ABIS_ESS_HRLB_UI_,out=await call('hrLeaveBackfillStatus',{sessionToken,requestId:s.requestId});
  if(!out||out.found!==true)return;
  if(out.requestId!==s.requestId||out.employeeId!==s.intent.employeeId.toUpperCase()||out.date!==s.intent.date||out.leaveType!==s.intent.leaveTypeCode||out.approvedBy!==s.preview.actorId)throw Error('查詢回執與原補登不一致，保留原 RequestID');
  abisEssHrlbKnownResult_(out);
}
async function abisEssHrlbSubmit_(mode){
  const s=ABIS_ESS_HRLB_UI_;
  if(!abisEssHrlbAllowed_()||s.busy||!s.preview||!s.intent||!s.requestId)return;
  if(mode==='CONFIRMED'){if(s.submitted||!s.modal)return;}
  else if(mode==='RESUME'){if(!s.submitted||!s.result||!s.result.known||!s.result.approved||s.result.completed)return;}
  else return;
  s.busy=true;s.submitted=true;s.modal=null;s.operation='正在補登、核准並讀回';abisEssHrlbRender_();
  try{
    const out=await call('hrLeaveBackfillOneClick',Object.assign({sessionToken,requestId:s.requestId,confirm:true,previewHash:s.preview.previewHash},s.intent));
    abisEssHrlbKnownResult_(out);
  }catch(e){
    s.result={known:false,completed:false,gate:'RESULT_UNKNOWN'};s.error=e&&e.message?e.message:String(e);
    try{await abisEssHrlbReadStatus_();}catch(statusError){s.error+='；'+(statusError&&statusError.message?statusError.message:String(statusError));}
  }finally{s.busy=false;abisEssHrlbRender_();}
}
async function abisEssHrlbConfirm_(){
  const s=ABIS_ESS_HRLB_UI_;if(!abisEssHrlbAllowed_()||s.busy||s.submitted||!s.modal||!s.preview)return;
  if(JSON.stringify(abisEssHrlbValues_())!==JSON.stringify(s.intent)||s.modal.requestId!==s.requestId||s.modal.previewHash!==s.preview.previewHash){
    s.modal=null;s.preview=null;s.intent=null;s.error='資料已變更，請再次按補登並核准；尚未提交';abisEssHrlbRender_();return;
  }
  await abisEssHrlbSubmit_('CONFIRMED');
}
async function abisEssHrlbRecover_(){
  const s=ABIS_ESS_HRLB_UI_;if(!abisEssHrlbAllowed_()||s.busy||!s.submitted||!s.result||s.result.known)return;
  s.busy=true;s.operation='正在查詢同一筆結果';abisEssHrlbRender_();
  try{await abisEssHrlbReadStatus_();}catch(e){s.error=e&&e.message?e.message:String(e);}finally{s.busy=false;abisEssHrlbRender_();}
}
async function abisEssHrlbResume_(){
  const s=ABIS_ESS_HRLB_UI_;if(!abisEssHrlbAllowed_()||s.busy||!s.result||!s.result.known||!s.result.approved||s.result.completed||!s.preview)return;
  await abisEssHrlbSubmit_('RESUME');
}


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
    return originalOpen.apply(this, arguments);
  };
  rc2InnerTitleForSection_ = function (id) {
    if (id === 'account' && accountPanel_ === panelName && abisEssHrlbAllowed_()) return label;
    return originalTitle.apply(this, arguments);
  };
  rc2InnerBack_ = function () {
    if (typeof rc2VisibleInnerSection_ === 'function' &&
        rc2VisibleInnerSection_() === 'account' && accountPanel_ === panelName) {
      accountPanel_ = 'management';
      renderMyAccount_();
      if (typeof rc2UpdateInnerBar_ === 'function') rc2UpdateInnerBar_();
      return;
    }
    return originalBack.apply(this, arguments);
  };

  Object.assign(window, {ABIS_ESS_HRLB_UI_, abisEssHrlbAllowed_, abisEssHrlbRequestId_, abisEssHrlbValues_, abisEssHrlbReadForm_, abisEssHrlbLocked_, abisEssHrlbChoice_, abisEssHrlbField_, abisEssHrlbRules_, abisEssHrlbModalHtml_, abisEssHrlbPanelHtml_, abisEssHrlbRender_, abisEssHrlbCancel_, abisEssHrlbModalKey_, abisEssHrlbReset_, abisEssHrlbStart_, abisEssHrlbKnownResult_, abisEssHrlbReadStatus_, abisEssHrlbSubmit_, abisEssHrlbConfirm_, abisEssHrlbRecover_, abisEssHrlbResume_});
  window.ABIS_HRLB_UI_ENTRY_V1_1_1 = Object.freeze({version:'HRLB_V1_1_1_20261106'});
})();
