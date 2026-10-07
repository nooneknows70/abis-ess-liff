/* ABIS ESS Leave Submit Hotfix HF2 | plain progress, no form-cover spinner */
const ABIS_LEAVE_SUBMIT_HF2_VERSION_='ABIS_LEAVE_SUBMIT_HOTFIX_HF2_PLAIN_PROGRESS_20261007';
const ABIS_LEAVE_SUBMIT_HF2_BASE_SET_AREA_BUSY_=setAreaBusy_;
const ABIS_LEAVE_SUBMIT_HF2_BASE_BIND_OPERATION_=p5a114BindOperationButton_;
const ABIS_LEAVE_SUBMIT_HF2_BASE_SUBMIT_=submitLeave;
let ABIS_LEAVE_SUBMIT_HF2_ACTIVE_=false;

function p5a1LeaveSubmitHf2ButtonText_(){
  return currentLang==='VI'?'Đang gửi…':currentLang==='TH'?'กำลังส่ง…':'送出中…';
}
function p5a1LeaveSubmitHf2ClearAsync_(btn){
  if(!btn)return;
  try{if(typeof abisAsyncClearButton_==='function')abisAsyncClearButton_(btn)}catch(ignore){}
  try{Array.from(btn.children||[]).forEach(x=>{if(x.classList&&x.classList.contains('abis-async-button-overlay'))x.remove()})}catch(ignore){}
  btn.classList.remove('abis-async-busy','abis-async-structured','is-busy');
  btn.removeAttribute('aria-busy');
}
function p5a1LeaveSubmitHf2PlainAreaBusy_(busy){
  const root=$('leaveForm');if(!root)return;
  root.querySelectorAll('button').forEach(btn=>{
    p5a1LeaveSubmitHf2ClearAsync_(btn);
    if(busy){
      if(btn.dataset.leaveHf2Disabled===undefined)btn.dataset.leaveHf2Disabled=btn.disabled?'Y':'N';
      if(btn.dataset.leaveHf2Text===undefined)btn.dataset.leaveHf2Text=btn.textContent||'';
      btn.disabled=true;
      if(btn.id==='submitLeaveBtn'){
        btn.textContent=p5a1LeaveSubmitHf2ButtonText_();
        btn.setAttribute('aria-busy','true');
        btn.classList.add('leave-submit-hf2-busy');
      }
    }else{
      const wasDisabled=btn.dataset.leaveHf2Disabled==='Y';
      if(btn.dataset.leaveHf2Text!==undefined)btn.textContent=btn.dataset.leaveHf2Text;
      btn.disabled=wasDisabled;
      btn.removeAttribute('aria-busy');
      btn.classList.remove('leave-submit-hf2-busy');
      delete btn.dataset.leaveHf2Disabled;
      delete btn.dataset.leaveHf2Text;
    }
  });
}
function p5a1LeaveSubmitHf2ClearCapture_(){
  try{ABIS_ASYNC_RECENT_CLICK_=null}catch(ignore){}
  try{p5a114LastClickedButton_=null;p5a114LastClickedAt_=0}catch(ignore){}
}

setAreaBusy_=function(areaId,busy,busyText){
  if(ABIS_LEAVE_SUBMIT_HF2_ACTIVE_&&String(areaId)==='leaveForm'){
    p5a1LeaveSubmitHf2PlainAreaBusy_(!!busy);return;
  }
  return ABIS_LEAVE_SUBMIT_HF2_BASE_SET_AREA_BUSY_.apply(this,arguments);
};
p5a114BindOperationButton_=function(id,explicitBtn,busyTitle){
  if(ABIS_LEAVE_SUBMIT_HF2_ACTIVE_&&explicitBtn&&explicitBtn.id==='submitLeaveBtn')return;
  return ABIS_LEAVE_SUBMIT_HF2_BASE_BIND_OPERATION_.apply(this,arguments);
};
submitLeave=async function(){
  p5a1LeaveSubmitHf2ClearCapture_();
  ABIS_LEAVE_SUBMIT_HF2_ACTIVE_=true;
  try{return await ABIS_LEAVE_SUBMIT_HF2_BASE_SUBMIT_.apply(this,arguments)}
  finally{
    ABIS_LEAVE_SUBMIT_HF2_ACTIVE_=false;
    p5a1LeaveSubmitHf2PlainAreaBusy_(false);
    p5a1LeaveSubmitHf2ClearCapture_();
  }
};

(function(){
  if(document.getElementById('abisLeaveSubmitHf2Style'))return;
  const s=document.createElement('style');s.id='abisLeaveSubmitHf2Style';
  s.textContent='body.inner-view #leaveForm #submitLeaveBtn.abis-async-busy>.abis-async-button-overlay{display:none!important}body.inner-view #leaveForm #submitLeaveBtn.leave-submit-hf2-busy{opacity:1!important;cursor:wait!important;pointer-events:none!important}';
  document.head.appendChild(s);
})();
window.ABIS_LEAVE_SUBMIT_HOTFIX_HF2=Object.freeze({ok:true,version:ABIS_LEAVE_SUBMIT_HF2_VERSION_,baseHotfix:ABIS_LEAVE_SUBMIT_HOTFIX_VERSION_,plainProgress:true,formCoverSpinner:false,businessRulesChanged:false,boundedTransport:true,requestIdReplaySafetyPreserved:true});
