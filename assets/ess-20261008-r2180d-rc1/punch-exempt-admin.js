/* =============================================================================
 * ABIS ESS - R2180-D Temporary Punch Exemption Admin UI
 * Version: P5A2_5_ATTENDANCE_PUNCH_EXEMPT_PERIOD_R1_R2180D_UI_RC1_20261008
 *
 * Scope
 * - HR/Admin only.
 * - Mount inside existing hrCredentialAdmin section.
 * - Reuse current ESS sessionToken and existing HR employee search.
 * - Directly call R2180-A server functions (all server-side auth remains authoritative).
 * - CREATE / UPDATE / CANCEL automatically replay the same RequestID once
 *   to verify idempotency.
 *
 * Safety
 * - No DAILY_ATTENDANCE mutation here.
 * - No exception / LINE / payroll / trigger mutation.
 * - No manual Sheet editing.
 * ============================================================================= */

(function(){
  'use strict';

  const VERSION='P5A2_5_ATTENDANCE_PUNCH_EXEMPT_PERIOD_R1_R2180D_UI_RC1_20261008';
  const ROOT_ID='p5a2180dAdminRoot';
  const STYLE_ID='p5a2180dAdminStyle';

  let selectedEmployee=null;
  let periods=[];
  let editingId='';
  let cancelTargetId='';

  function esc_(v){
    if(typeof escapeHtml==='function') return escapeHtml(v);
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function text_(v){ return v==null?'':String(v).trim(); }

  function canUse_(){
    try{
      if(typeof canManageCredentials_==='function') return !!canManageCredentials_();
    }catch(e){}
    const p=String(window.homeData&&homeData.employee&&homeData.employee.approvalPermission||'').toUpperCase();
    return p==='HR'||p==='ADMIN';
  }

  function msg_(m,type){
    if(typeof message==='function') message(m,type||'success');
  }

  function requestId_(kind,id){
    let uuid='';
    try{
      if(window.crypto&&crypto.randomUUID) uuid=crypto.randomUUID();
    }catch(e){}
    if(!uuid) uuid=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
    return 'R2180D-'+String(kind||'MUT').toUpperCase()+'-'+String(id||'NEW')+'-'+uuid;
  }

  function runner_(){
    return google.script.run
      .withFailureHandler(function(){});
  }

  function rpc_(method,payload){
    return new Promise(function(resolve,reject){
      const ok=function(r){ resolve(r); };
      const fail=function(e){
        const err=(typeof apiError_==='function')?apiError_(e,'TRANSPORT'):new Error(e&&e.message?e.message:String(e||'RPC failed'));
        try{ if(typeof p5a1StartLineReauth_==='function') p5a1StartLineReauth_(err); }catch(ignore){}
        reject(err);
      };
      const r=google.script.run.withSuccessHandler(ok).withFailureHandler(fail);
      if(method==='list') return r.attendancePunchExemptPeriods(sessionToken,payload||{});
      if(method==='create') return r.attendanceCreatePunchExemptPeriod(sessionToken,payload||{});
      if(method==='update') return r.attendanceUpdatePunchExemptPeriod(sessionToken,payload||{});
      if(method==='cancel') return r.attendanceCancelPunchExemptPeriod(sessionToken,payload||{});
      reject(new Error('Unsupported R2180-D RPC method'));
    });
  }

  async function mutationWithReplay_(method,payload){
    const first=await rpc_(method,payload);
    if(!first||first.ok!==true) throw new Error('第一次 mutation 未回傳成功');
    const second=await rpc_(method,payload);
    if(!second||second.ok!==true||second.replayed!==true){
      throw new Error('RequestID replay 驗證失敗');
    }
    return {first:first,second:second,replayVerified:true};
  }

  function busyStart_(label,btn){
    try{
      if(typeof beginOperation_==='function') return beginOperation_(label||'系統處理中…',typeof nt==='function'?nt('doNotRepeat'):'請勿重複操作。',btn);
    }catch(e){}
    if(btn) btn.disabled=true;
    return null;
  }

  function busyOk_(op,label,detail){
    try{
      if(typeof finishOperationSuccess_==='function') return finishOperationSuccess_(op,label||'完成',detail||'');
    }catch(e){}
  }

  function busyFail_(op,e){
    try{
      if(typeof finishOperationFailure_==='function') return finishOperationFailure_(op,e);
    }catch(ignore){}
  }

  function style_(){
    if(document.getElementById(STYLE_ID)) return;
    const el=document.createElement('style');
    el.id=STYLE_ID;
    el.textContent=
      '#'+ROOT_ID+'{margin-top:24px;border-top:1px solid #dbe4ee;padding-top:20px}'+
      '#'+ROOT_ID+' .r2180-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}'+
      '#'+ROOT_ID+' .r2180-note{font-size:13px;line-height:1.55;color:#586574;margin-top:4px}'+
      '#'+ROOT_ID+' .r2180-search{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:14px}'+
      '#'+ROOT_ID+' .r2180-search>div{flex:1 1 220px}'+
      '#'+ROOT_ID+' .r2180-results{margin-top:10px;display:grid;gap:8px}'+
      '#'+ROOT_ID+' .r2180-employee,#'+ROOT_ID+' .r2180-period{border:1px solid #dbe4ee;border-radius:12px;padding:12px;background:#fff}'+
      '#'+ROOT_ID+' .r2180-selected{margin-top:14px;padding:12px;border-radius:12px;background:#f5f8fb;border:1px solid #dbe4ee}'+
      '#'+ROOT_ID+' .r2180-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}'+
      '#'+ROOT_ID+' .r2180-grid .full{grid-column:1/-1}'+
      '#'+ROOT_ID+' label{display:block;font-size:13px;margin-bottom:4px}'+
      '#'+ROOT_ID+' input,#'+ROOT_ID+' textarea{width:100%;box-sizing:border-box}'+
      '#'+ROOT_ID+' .r2180-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}'+
      '#'+ROOT_ID+' .r2180-list{display:grid;gap:10px;margin-top:12px}'+
      '#'+ROOT_ID+' .r2180-meta{font-size:13px;color:#586574;line-height:1.5}'+
      '#'+ROOT_ID+' .r2180-status{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;background:#eef3f8}'+
      '#'+ROOT_ID+' .r2180-status.active{background:#e9f7ef}'+
      '#'+ROOT_ID+' .r2180-status.cancelled{background:#f2f2f2}'+
      '#'+ROOT_ID+' .r2180-cancelbox{margin-top:10px;padding:10px;border-radius:10px;background:#fff7f7;border:1px solid #eed3d3}'+
      '#'+ROOT_ID+' .r2180-empty{padding:12px;color:#6c7885;background:#f8fafc;border-radius:10px}'+
      '@media(max-width:640px){#'+ROOT_ID+' .r2180-grid{grid-template-columns:1fr}}';
    document.head.appendChild(el);
  }

  function mount_(){
    if(!canUse_()) return;
    const host=document.getElementById('hrCredentialAdmin');
    if(!host) return;
    style_();
    let root=document.getElementById(ROOT_ID);
    if(root) return root;
    root=document.createElement('section');
    root.id=ROOT_ID;
    root.innerHTML=
      '<div class="r2180-head">'+
        '<div><h2 style="margin:0">派駐免打卡期間</h2>'+
        '<div class="r2180-note">HR／Admin 管理臨時派駐且現場無法打卡的期間。結束日必填；不會改成永久免打卡。</div></div>'+
        '<span class="pill">R2180</span>'+
      '</div>'+
      '<div class="notice tiny" style="margin-top:10px">目前此頁只管理派駐期間 SSOT。建立／修改／取消後，仍先以 R2180-B Shadow 驗證，不會由此頁直接改寫 DAILY_ATTENDANCE。</div>'+
      '<div class="r2180-search">'+
        '<div><label for="p5a2180dSearch">搜尋員工</label><input id="p5a2180dSearch" placeholder="員工編號／姓名／部門／地點"></div>'+
        '<button type="button" class="secondary" id="p5a2180dSearchBtn">搜尋</button>'+
      '</div>'+
      '<div id="p5a2180dResults" class="r2180-results"></div>'+
      '<div id="p5a2180dSelected"></div>';
    host.appendChild(root);

    const input=document.getElementById('p5a2180dSearch');
    const btn=document.getElementById('p5a2180dSearchBtn');
    if(btn) btn.addEventListener('click',search_);
    if(input) input.addEventListener('keydown',function(e){ if(e.key==='Enter'){e.preventDefault();search_();} });
    return root;
  }

  async function search_(){
    if(!canUse_()) return msg_('無權限','warning');
    const q=text_(document.getElementById('p5a2180dSearch')&&document.getElementById('p5a2180dSearch').value);
    if(!q) return msg_('請輸入員工編號或姓名','warning');
    const btn=document.getElementById('p5a2180dSearchBtn');
    const op=busyStart_('正在搜尋員工…',btn);
    try{
      const list=await call('hrCredentialSearch',{sessionToken:sessionToken,query:q});
      renderSearch_(Array.isArray(list)?list:[]);
      busyOk_(op,'搜尋完成','');
    }catch(e){
      busyFail_(op,e); msg_(e&&e.message?e.message:String(e),'warning');
    }
  }

  function renderSearch_(list){
    const box=document.getElementById('p5a2180dResults');
    if(!box) return;
    if(!list.length){
      box.innerHTML='<div class="r2180-empty">找不到符合的在職員工。</div>';
      return;
    }
    box.innerHTML=list.map(function(x){
      const id=esc_(x.employeeId||'');
      return '<div class="r2180-employee">'+
        '<b>'+esc_(x.name||'')+' <span class="pill">'+id+'</span></b>'+
        '<div class="r2180-meta">'+esc_(x.department||'')+(x.location?' · '+esc_(x.location):'')+'</div>'+
        '<div class="r2180-actions"><button type="button" class="secondary small" data-r2180-employee="'+id+'">管理派駐期間</button></div>'+
      '</div>';
    }).join('');
    box.querySelectorAll('[data-r2180-employee]').forEach(function(btn){
      btn.addEventListener('click',function(){
        selectEmployee_({
          employeeId:this.getAttribute('data-r2180-employee'),
          name:(list.find(function(x){return String(x.employeeId||'')===btn.getAttribute('data-r2180-employee');})||{}).name||'',
          department:(list.find(function(x){return String(x.employeeId||'')===btn.getAttribute('data-r2180-employee');})||{}).department||'',
          location:(list.find(function(x){return String(x.employeeId||'')===btn.getAttribute('data-r2180-employee');})||{}).location||''
        });
      });
    });
  }

  async function selectEmployee_(emp){
    selectedEmployee=emp||null;
    editingId='';
    cancelTargetId='';
    if(!selectedEmployee||!selectedEmployee.employeeId) return;
    renderSelected_();
    await loadPeriods_();
  }

  function renderSelected_(){
    const box=document.getElementById('p5a2180dSelected');
    if(!box||!selectedEmployee) return;
    box.innerHTML=
      '<div class="r2180-selected">'+
        '<b>'+esc_(selectedEmployee.name||'')+' <span class="pill">'+esc_(selectedEmployee.employeeId||'')+'</span></b>'+
        '<div class="r2180-meta">'+esc_(selectedEmployee.department||'')+(selectedEmployee.location?' · '+esc_(selectedEmployee.location):'')+'</div>'+
      '</div>'+
      '<div id="p5a2180dForm"></div>'+
      '<div style="margin-top:18px"><h3 style="margin-bottom:4px">期間紀錄</h3><div class="r2180-note">ACTIVE 期間不可重疊；相鄰日期可接受。取消後保留稽核歷程，不刪除資料。</div><div id="p5a2180dPeriodList" class="r2180-list"></div></div>';
    renderForm_();
    renderPeriods_();
  }

  function editingPeriod_(){
    return periods.find(function(p){return p.exemptPeriodId===editingId;})||null;
  }

  function renderForm_(){
    const box=document.getElementById('p5a2180dForm');
    if(!box||!selectedEmployee) return;
    const e=editingPeriod_();
    box.innerHTML=
      '<div class="hr-action-box" style="margin-top:14px">'+
        '<h3 style="margin-top:0">'+(e?'修改派駐免打卡期間':'新增派駐免打卡期間')+'</h3>'+
        '<div class="r2180-grid">'+
          '<div><label>開始日期</label><input type="date" id="p5a2180dStart" value="'+esc_(e&&e.startDate||'')+'"></div>'+
          '<div><label>結束日期</label><input type="date" id="p5a2180dEnd" value="'+esc_(e&&e.endDate||'')+'"></div>'+
          '<div class="full"><label>派駐地點</label><input id="p5a2180dLocation" maxlength="100" placeholder="例如：大溪廠" value="'+esc_(e&&e.assignmentLocation||'')+'"></div>'+
          '<div class="full"><label>備註</label><textarea id="p5a2180dNote" rows="3" maxlength="500" placeholder="派駐原因或補充說明">'+esc_(e&&e.reasonNote||'')+'</textarea></div>'+
        '</div>'+
        '<div class="r2180-actions">'+
          '<button type="button" id="p5a2180dSaveBtn">'+(e?'儲存修改':'建立期間')+'</button>'+
          (e?'<button type="button" class="secondary" id="p5a2180dEditCancelBtn">取消修改</button>':'')+
        '</div>'+
      '</div>';
    const save=document.getElementById('p5a2180dSaveBtn');
    if(save) save.addEventListener('click',save_);
    const cancel=document.getElementById('p5a2180dEditCancelBtn');
    if(cancel) cancel.addEventListener('click',function(){editingId='';renderForm_();});
  }

  function formPayload_(){
    const start=text_(document.getElementById('p5a2180dStart')&&document.getElementById('p5a2180dStart').value);
    const end=text_(document.getElementById('p5a2180dEnd')&&document.getElementById('p5a2180dEnd').value);
    const location=text_(document.getElementById('p5a2180dLocation')&&document.getElementById('p5a2180dLocation').value);
    const reasonNote=text_(document.getElementById('p5a2180dNote')&&document.getElementById('p5a2180dNote').value);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('請選擇開始日期');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(end)) throw new Error('請選擇結束日期');
    if(end<start) throw new Error('結束日期不可早於開始日期');
    if(!location) throw new Error('請填寫派駐地點');
    return {startDate:start,endDate:end,assignmentLocation:location,reasonNote:reasonNote};
  }

  async function save_(){
    if(!selectedEmployee) return;
    const btn=document.getElementById('p5a2180dSaveBtn');
    let body;
    try{ body=formPayload_(); }catch(e){ return msg_(e.message,'warning'); }
    const isUpdate=!!editingId;
    const rid=requestId_(isUpdate?'UPDATE':'CREATE',editingId||selectedEmployee.employeeId);
    const payload=Object.assign({},body,{requestId:rid});
    if(isUpdate) payload.exemptPeriodId=editingId;
    else payload.employeeId=selectedEmployee.employeeId;

    const op=busyStart_(isUpdate?'正在修改派駐期間…':'正在建立派駐期間…',btn);
    try{
      const result=await mutationWithReplay_(isUpdate?'update':'create',payload);
      editingId='';
      await loadPeriods_();
      busyOk_(op,isUpdate?'修改完成':'建立完成','RequestID replay PASS');
      msg_((isUpdate?'派駐期間已修改':'派駐期間已建立')+'；RequestID replay PASS','success');
      return result;
    }catch(e){
      busyFail_(op,e);
      msg_(e&&e.message?e.message:String(e),'warning');
    }
  }

  async function loadPeriods_(){
    if(!selectedEmployee||!selectedEmployee.employeeId) return;
    const listBox=document.getElementById('p5a2180dPeriodList');
    if(listBox) listBox.innerHTML='<div class="r2180-empty">讀取中…</div>';
    try{
      const r=await rpc_('list',{employeeId:selectedEmployee.employeeId});
      periods=Array.isArray(r&&r.periods)?r.periods:[];
      renderPeriods_();
      renderForm_();
    }catch(e){
      periods=[];
      if(listBox) listBox.innerHTML='<div class="r2180-empty">'+esc_(e&&e.message?e.message:String(e))+'</div>';
    }
  }

  function renderPeriods_(){
    const box=document.getElementById('p5a2180dPeriodList');
    if(!box) return;
    if(!periods.length){
      box.innerHTML='<div class="r2180-empty">目前沒有派駐免打卡期間。</div>';
      return;
    }
    box.innerHTML=periods.map(function(p){
      const active=String(p.status||'').toUpperCase()==='ACTIVE';
      const id=esc_(p.exemptPeriodId||'');
      const cancelOpen=cancelTargetId===p.exemptPeriodId;
      return '<div class="r2180-period">'+
        '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">'+
          '<b>'+esc_(p.startDate||'')+' ～ '+esc_(p.endDate||'')+'</b>'+
          '<span class="r2180-status '+(active?'active':'cancelled')+'">'+(active?'ACTIVE':'CANCELLED')+'</span>'+
        '</div>'+
        '<div class="r2180-meta" style="margin-top:6px">派駐地點：'+esc_(p.assignmentLocation||'-')+'</div>'+
        (p.reasonNote?'<div class="r2180-meta">備註：'+esc_(p.reasonNote)+'</div>':'')+
        '<div class="r2180-meta">ExemptPeriodID：'+id+'</div>'+
        (active?
          '<div class="r2180-actions">'+
            '<button type="button" class="secondary small" data-r2180-edit="'+id+'">修改</button>'+
            '<button type="button" class="danger small" data-r2180-cancel="'+id+'">取消期間</button>'+
          '</div>':'')+
        (active&&cancelOpen?
          '<div class="r2180-cancelbox">'+
            '<label>取消原因</label>'+
            '<textarea rows="2" id="p5a2180dCancelReason" maxlength="500" placeholder="請填寫取消原因"></textarea>'+
            '<div class="r2180-actions">'+
              '<button type="button" class="danger small" id="p5a2180dCancelConfirm">確認取消</button>'+
              '<button type="button" class="secondary small" id="p5a2180dCancelBack">返回</button>'+
            '</div>'+
          '</div>':'')+
      '</div>';
    }).join('');

    box.querySelectorAll('[data-r2180-edit]').forEach(function(btn){
      btn.addEventListener('click',function(){
        editingId=this.getAttribute('data-r2180-edit')||'';
        cancelTargetId='';
        renderForm_();
        renderPeriods_();
        const f=document.getElementById('p5a2180dForm');
        if(f) f.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    box.querySelectorAll('[data-r2180-cancel]').forEach(function(btn){
      btn.addEventListener('click',function(){
        cancelTargetId=this.getAttribute('data-r2180-cancel')||'';
        editingId='';
        renderForm_();
        renderPeriods_();
      });
    });

    const confirmBtn=document.getElementById('p5a2180dCancelConfirm');
    if(confirmBtn) confirmBtn.addEventListener('click',cancel_);
    const back=document.getElementById('p5a2180dCancelBack');
    if(back) back.addEventListener('click',function(){cancelTargetId='';renderPeriods_();});
  }

  async function cancel_(){
    if(!cancelTargetId) return;
    const reason=text_(document.getElementById('p5a2180dCancelReason')&&document.getElementById('p5a2180dCancelReason').value);
    if(!reason) return msg_('請填寫取消原因','warning');
    const btn=document.getElementById('p5a2180dCancelConfirm');
    const rid=requestId_('CANCEL',cancelTargetId);
    const payload={exemptPeriodId:cancelTargetId,reason:reason,requestId:rid};
    const op=busyStart_('正在取消派駐期間…',btn);
    try{
      await mutationWithReplay_('cancel',payload);
      cancelTargetId='';
      await loadPeriods_();
      busyOk_(op,'已取消派駐期間','RequestID replay PASS');
      msg_('派駐期間已取消；RequestID replay PASS','success');
    }catch(e){
      busyFail_(op,e);
      msg_(e&&e.message?e.message:String(e),'warning');
    }
  }

  function installOpenHook_(){
    if(window.__P5A2180D_OPEN_HOOK__) return;
    window.__P5A2180D_OPEN_HOOK__=true;
    const old=window.openHrCredentialAdmin;
    if(typeof old==='function'){
      window.openHrCredentialAdmin=function(){
        const r=old.apply(this,arguments);
        try{mount_();}catch(e){console.error('R2180-D mount failed',e);}
        return r;
      };
    }
  }

  function boot_(){
    if(!canUse_()) return;
    mount_();
    installOpenHook_();
  }

  window.p5a2180dAdminStatus=function(){
    return {
      version:VERSION,
      mounted:!!document.getElementById(ROOT_ID),
      canUse:canUse_(),
      selectedEmployee:selectedEmployee&&selectedEmployee.employeeId||'',
      periodCount:periods.length,
      editingId:editingId,
      cancelTargetId:cancelTargetId
    };
  };

  installOpenHook_();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot_);
  else setTimeout(boot_,0);
})();
