/* ABIS Attendance Deep Link HF2 candidate - SHADOW ONLY, not loaded by PROD.
   Works with HF8 immutable bundle and existing server-authorized routeContext.
   Does not read opaque rt token or send/write attendance, LINE or payroll. */
(function(){
'use strict';
var BOOT=typeof ABIS_SERVER_BOOT==='object'&&ABIS_SERVER_BOOT||{};
var ctx=BOOT.routeContext;
if(!ctx||!ctx.routeKind)return;
var valid={EMPLOYEE_CORRECTION:true,EMPLOYEE_FOLLOWUP:true,MANAGEMENT_SITE_DAY:true,MANAGEMENT_CASE:true};
var kind=String(ctx.routeKind||'').toUpperCase();
if(!valid[kind])return;
var state={phase:'WAITING',attempts:0,error:'',kind:kind};
var lastFailure='';
function status(phase,detail){
 state.phase=phase;state.error=String(detail||'').slice(0,240);
 var el=document.getElementById('abisDeeplinkGateHF2');
 if(!el){el=document.createElement('section');el.id='abisDeeplinkGateHF2';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.style.cssText='position:fixed;inset:auto 12px 16px;z-index:10010;max-width:560px;margin:auto;padding:18px;border:1px solid #bcd1e4;border-radius:16px;background:#fff;color:#17324d;box-shadow:0 12px 40px #16283d35;font:15px/1.55 system-ui,sans-serif';document.body.appendChild(el);}
 el.replaceChildren();
 var title=document.createElement('strong');title.textContent=phase==='LOADING'?'正在開啟出勤頁面':phase==='FAILED'?'出勤連結無法開啟':'出勤頁面已開啟';el.appendChild(title);
 var p=document.createElement('p');p.style.margin='8px 0';p.textContent=phase==='FAILED'?(state.error||'請稍後重試；目前停留在首頁。'):'正在透過原有權限驗證及出勤 API 讀取資料。';el.appendChild(p);
 if(phase==='FAILED'){
  var b=document.createElement('button');b.type='button';b.textContent='重試開啟';b.onclick=function(){launch(true)};b.style.cssText='padding:8px 15px;border-radius:9px;border:0;background:#165baf;color:#fff';el.appendChild(b);
  var id=document.createElement('small');id.style.display='block';id.style.marginTop='7px';id.textContent='診斷：'+kind+' / '+state.attempts+' / '+(lastFailure||'UNKNOWN');el.appendChild(id);
 }
 if(phase==='DONE'){el.remove();}
}
function safeError(e){
 var s=String(e&&e.message||e||'UNKNOWN').replace(/(?:rt|token|sessionToken|authorization)=?[^\s,&]+/ig,'[REDACTED]');
 return s.slice(0,160);
}
function hasTarget(){return !!(document.getElementById('r2SiteDetailOverlay')||document.getElementById('r2FollowupOverlay')||((document.getElementById('attendance')||{}).classList&&!document.getElementById('attendance').classList.contains('hide')));}
var oldCall=typeof call==='function'?call:null;
if(oldCall){call=function(action,payload){
  if(action==='attendanceUnifiedSiteDetail'&&kind==='MANAGEMENT_SITE_DAY'&&ctx.sourceEventKey&&payload&&payload.scopeCode===ctx.scopeValue){
   payload=Object.assign({},payload,{sourceEventKey:String(ctx.sourceEventKey)});
  }
  return oldCall(action,payload);
};}
function launch(force){
 if(state.phase==='LOADING'&&!force)return;
 if(state.attempts>=3){lastFailure='MAX_RETRY';status('FAILED','重試次數已達上限，請聯絡管理員。');return;}
 state.attempts++;status('LOADING','');
 var fn=typeof p5a25R29ApplyBootRouteContext_==='function'?p5a25R29ApplyBootRouteContext_:null;
 if(!fn){lastFailure='MISSING_ROUTE_HANDLER';status('FAILED','前端缺少出勤導頁函式。');return;}
 var promise;
 try{promise=fn();}catch(e){lastFailure='ROUTE_SYNC_EXCEPTION';status('FAILED',safeError(e));return;}
 Promise.resolve(promise).then(function(ok){
  if(ok===false||!hasTarget()){
   lastFailure='NO_TARGET_AFTER_ROUTE';status('FAILED','出勤頁面沒有開啟；請重試或聯絡管理員。');
  }else{lastFailure='';status('DONE','');}
 }).catch(function(e){lastFailure='ROUTE_API_EXCEPTION';status('FAILED',safeError(e));});
}
var oldRoute=typeof p5rmApplyBootRoute_==='function'?p5rmApplyBootRoute_:null;
if(oldRoute){p5rmApplyBootRoute_=function(){
  if(state.attempts>0)return;
  try{launch(false)}catch(e){lastFailure='BOOT_ROUTE_EXCEPTION';status('FAILED',safeError(e));}
};}
var oldEnter=typeof enterApp==='function'?enterApp:null;
if(oldEnter){enterApp=function(){
 try{oldEnter.apply(this,arguments);}
 catch(e){lastFailure='ENTER_APP_EXCEPTION';status('FAILED','初始化中斷：'+safeError(e));}
 if(state.attempts===0){launch(false);}
};}
window.ABIS_ATTENDANCE_DEEPLINK_HF2={version:'HF2_CANDIDATE_20261009',status:function(){return {phase:state.phase,kind:kind,attempts:state.attempts,lastFailure:lastFailure};}};
status('LOADING','');
})();
