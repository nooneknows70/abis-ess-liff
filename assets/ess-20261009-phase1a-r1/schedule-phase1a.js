(function(){
  'use strict';

  const VERSION='P5A2_5_PHASE1A_SIMPLE_SCHEDULE_UI_R1_20261009';
  const legacyLoadRest = typeof window.rc208fLoadScheduleRest_ === 'function' ? window.rc208fLoadScheduleRest_ : null;

  const state={
    weekStart:'',
    site:'',
    data:null,
    missingOnly:false,
    loading:false
  };

  function el(id){ return document.getElementById(id); }
  function esc(v){ return typeof escapeHtml==='function' ? escapeHtml(String(v==null?'':v)) : String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function txt(v){ return String(v==null?'':v).trim(); }
  function dateObj(s){ const m=txt(s).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0):null; }
  function addDays(s,n){ const d=dateObj(s); if(!d)return''; d.setDate(d.getDate()+Number(n||0)); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
  function monday(s){ const d=dateObj(s)||new Date(); d.setHours(12,0,0,0); const day=d.getDay(); d.setDate(d.getDate()+(day===0?-6:1-day)); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
  function fmt(s){ const d=dateObj(s); if(!d)return s; return (d.getMonth()+1)+'/'+d.getDate(); }
  function workNatureLabel(n){
    return n==='REST'?'排休':(n==='REST_DAY_OVERTIME'?'休息日加班':'正常上班');
  }
  function shiftLabel(cell){ return txt(cell.shiftName)||txt(cell.shiftCode)||'未排'; }
  function otHours(min){ const n=Number(min||0); return (Math.round(n/6)/10).toFixed(n%60?1:0); }

  function ensureStyle(){
    if(el('abisP1aStyle'))return;
    const s=document.createElement('style');
    s.id='abisP1aStyle';
    s.textContent=`
      .p1a-wrap{display:flex;flex-direction:column;gap:14px}
      .p1a-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:end}
      .p1a-toolbar .field{display:flex;flex-direction:column;gap:4px;min-width:145px}
      .p1a-toolbar label{font-size:12px;color:#667085}
      .p1a-toolbar button{width:auto}
      .p1a-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .p1a-metric{border:1px solid #dbe4ee;border-radius:12px;padding:12px;background:#fff}
      .p1a-metric b{display:block;font-size:22px;margin-top:4px}
      .p1a-metric.alert{border-color:#f4b6b6;background:#fff7f7}
      .p1a-table-wrap{overflow:auto;border:1px solid #dbe4ee;border-radius:12px}
      .p1a-table{border-collapse:separate;border-spacing:0;min-width:1180px;width:100%;background:#fff}
      .p1a-table th,.p1a-table td{border-right:1px solid #e6edf4;border-bottom:1px solid #e6edf4;padding:8px;vertical-align:top}
      .p1a-table th{position:sticky;top:0;background:#f7f9fc;z-index:1;font-size:12px}
      .p1a-table th:first-child,.p1a-table td:first-child{position:sticky;left:0;background:#fff;z-index:2;min-width:150px}
      .p1a-table th:first-child{z-index:3;background:#f7f9fc}
      .p1a-cell{width:100%;min-height:94px;text-align:left;border:1px solid #dbe4ee;background:#fff;border-radius:10px;padding:8px}
      .p1a-cell.rest{background:#f8fafc}
      .p1a-cell.ot{background:#fff9ee}
      .p1a-cell.missing{background:#fff2f2;border-color:#ef9a9a}
      .p1a-cell.draft{box-shadow:inset 0 0 0 2px #a7c7ff}
      .p1a-cell .nature{font-size:12px;font-weight:700}
      .p1a-cell .shift{font-size:12px;margin-top:4px}
      .p1a-cell .sub{font-size:11px;color:#667085;margin-top:4px}
      .p1a-employee b{display:block}.p1a-employee span{font-size:12px;color:#667085}
      .p1a-tabs{display:flex;gap:8px}.p1a-tabs button{width:auto}
      .p1a-analysis-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .p1a-editor-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:9998;display:flex;align-items:center;justify-content:center;padding:18px}
      .p1a-editor{width:min(94vw,640px);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.22)}
      .p1a-editor .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .p1a-editor textarea{min-height:110px}
      .p1a-editor .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
      .p1a-editor .actions button{width:auto}
      .p1a-note{font-size:12px;color:#667085}
      @media(max-width:900px){.p1a-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(s);
  }

  function panel(){
    return el('rc208fScheduleRestPanel');
  }

  function showErr(e){
    if(typeof message==='function') message(e&&e.message?e.message:String(e),'error');
  }
  function showOk(t){
    if(typeof message==='function') message(t,'success');
  }

  function confirmBox(title,body,okText){
    return new Promise(function(resolve){
      const b=document.createElement('div');
      b.className='p1a-editor-backdrop';
      b.innerHTML='<div class="p1a-editor" role="dialog" aria-modal="true">'+
        '<h2 style="margin-top:0">'+esc(title)+'</h2>'+
        '<div style="white-space:pre-line">'+esc(body)+'</div>'+
        '<div class="actions"><button type="button" class="secondary" data-cancel>取消</button><button type="button" data-ok>'+esc(okText||'確定')+'</button></div></div>';
      document.body.appendChild(b);
      const done=function(v){ b.remove(); resolve(v); };
      b.querySelector('[data-cancel]').onclick=function(){done(false);};
      b.querySelector('[data-ok]').onclick=function(){done(true);};
    });
  }

  async function load(){
    const box=panel(); if(!box||state.loading)return;
    state.loading=true; ensureStyle();
    box.innerHTML='<div class="muted">載入週排班…</div>';
    try{
      const data=await call('phase1ScheduleWeek',{
        sessionToken:sessionToken,
        weekStart:state.weekStart||'',
        site:state.site||''
      });
      state.data=data||{};
      state.weekStart=txt(data&&data.week&&data.week.weekStart)||monday('');
      if(!state.site) state.site=txt(data&&data.site)||txt((data&&data.availableSites||[])[0]);
      render();
    }catch(e){
      box.innerHTML='<div class="notice error">'+esc(e&&e.message?e.message:String(e))+'</div>';
    }finally{ state.loading=false; }
  }

  function topHtml(){
    const d=state.data||{},w=d.week||{},auth=d.authorization||{};
    const sites=Array.isArray(d.availableSites)?d.availableSites:[];
    const siteSelect=auth.scope==='COMPANY'
      ? '<div class="field"><label>廠區</label><select id="p1aSite">'+sites.map(function(s){return '<option value="'+esc(s)+'" '+(s===state.site?'selected':'')+'>'+esc(s)+'</option>';}).join('')+'</select></div>'
      : '<div class="field"><label>廠區</label><div><b>'+esc(auth.site||state.site||'')+'</b></div></div>';
    return '<div class="p1a-tabs">'+
      '<button type="button" onclick="ABIS_P1A.loadWeek()">週排班</button>'+
      '<button type="button" class="secondary" onclick="ABIS_P1A.openFixedRest()">固定休息日</button>'+
      '</div>'+
      '<div class="p1a-toolbar">'+siteSelect+
      '<div class="field"><label>週區間（週一開始）</label><input id="p1aWeekStart" type="date" value="'+esc(w.weekStart||state.weekStart||'')+'"></div>'+
      '<button type="button" class="secondary" onclick="ABIS_P1A.moveWeek(-1)">上週</button>'+
      '<button type="button" class="secondary" onclick="ABIS_P1A.thisWeek()">本週</button>'+
      '<button type="button" class="secondary" onclick="ABIS_P1A.moveWeek(1)">下週</button>'+
      '<button type="button" class="secondary" onclick="ABIS_P1A.copy(\'PREVIOUS_WEEK\')">沿用上週</button>'+
      '<button type="button" class="secondary" onclick="ABIS_P1A.copy(\'PREVIOUS_MONTH\')">沿用上月</button>'+
      '<button type="button" onclick="ABIS_P1A.publish()">確認並發布</button>'+
      '</div>'+
      '<div class="p1a-note">週檢視固定為星期一～星期日。休息日加班與排休分開；Punch 不會反推班表。預計加班僅為排班規劃，不會寫入 OVERTIME_FACT／Payroll。</div>';
  }

  function metricsHtml(){
    const a=(state.data&&state.data.week&&state.data.week.analysis)||{};
    return '<div class="p1a-metrics">'+
      '<div class="p1a-metric"><span>本期應排班人數</span><b>'+Number(a.expectedEmployeeCount||0)+'</b></div>'+
      '<div class="p1a-metric"><span>預計加班總時數</span><b>'+Number(a.plannedOvertimeHours||0)+' HR</b></div>'+
      '<div class="p1a-metric '+(Number(a.missingEmployeeCount||0)>0?'alert':'')+'"><span>漏排人數</span><b>'+Number(a.missingEmployeeCount||0)+'</b></div>'+
      '<div class="p1a-metric '+(Number(a.missingDayCount||0)>0?'alert':'')+'"><span>漏排總天數</span><b>'+Number(a.missingDayCount||0)+'</b></div>'+
      '</div>'+
      '<div class="p1a-analysis-row"><label><input id="p1aMissingOnly" type="checkbox" '+(state.missingOnly?'checked':'')+' onchange="ABIS_P1A.toggleMissing(this.checked)" style="width:auto"> 只看漏排</label></div>';
  }

  function cellHtml(emp,cell){
    const cls=['p1a-cell'];
    if(cell.missing)cls.push('missing');
    else if(cell.workNature==='REST')cls.push('rest');
    else if(cell.workNature==='REST_DAY_OVERTIME')cls.push('ot');
    if(cell.isDraft)cls.push('draft');
    const wi=(cell.workItems||[]).slice(0,2).map(function(w){return txt(w.workArea)||txt(w.workText);}).filter(Boolean).join('、');
    const sub=[];
    if(Number(cell.plannedOvertimeMinutes||0)>0)sub.push('預計OT '+otHours(cell.plannedOvertimeMinutes)+'h');
    if(wi)sub.push(wi);
    if(cell.isDraft)sub.push('草稿');
    return '<button type="button" class="'+cls.join(' ')+'" onclick="ABIS_P1A.edit('+JSON.stringify(emp.employeeId)+','+JSON.stringify(cell.date)+')">'+
      '<div class="nature">'+esc(cell.missing?'未排班':workNatureLabel(cell.workNature))+'</div>'+
      '<div class="shift">'+esc(shiftLabel(cell))+'</div>'+
      (sub.length?'<div class="sub">'+esc(sub.join('｜'))+'</div>':'')+
      '</button>';
  }

  function tableHtml(){
    const w=(state.data&&state.data.week)||{},rows=Array.isArray(w.employees)?w.employees:[];
    const dates=Array.isArray(w.dates)?w.dates:[];
    const visible=state.missingOnly?rows.filter(function(r){return r.analysis&&r.analysis.missingDates&&r.analysis.missingDates.length;}):rows;
    return '<div class="p1a-table-wrap"><table class="p1a-table"><thead><tr><th>員工</th>'+
      dates.map(function(d){const o=dateObj(d);const wk=['日','一','二','三','四','五','六'][o.getDay()];return '<th>'+esc(wk+' '+fmt(d))+'</th>';}).join('')+
      '</tr></thead><tbody>'+
      visible.map(function(emp){
        return '<tr><td><div class="p1a-employee"><b>'+esc(emp.name)+'</b><span>'+esc(emp.employeeId)+'｜'+esc(emp.site)+'</span><span>本週OT '+esc((emp.analysis&&emp.analysis.plannedOvertimeHours)||0)+'h</span></div></td>'+
          (emp.cells||[]).map(function(c){return '<td>'+cellHtml(emp,c)+'</td>';}).join('')+'</tr>';
      }).join('')+
      '</tbody></table></div>';
  }

  function render(){
    const box=panel(); if(!box)return; ensureStyle();
    box.innerHTML='<div class="p1a-wrap">'+topHtml()+metricsHtml()+tableHtml()+'</div>';
    const site=el('p1aSite');
    if(site)site.onchange=function(){state.site=this.value;load();};
    const wk=el('p1aWeekStart');
    if(wk)wk.onchange=function(){state.weekStart=monday(this.value);load();};
  }

  function findCell(employeeId,date){
    const rows=(state.data&&state.data.week&&state.data.week.employees)||[];
    const emp=rows.find(function(x){return x.employeeId===employeeId;});
    const cell=emp&&(emp.cells||[]).find(function(x){return x.date===date;});
    return {emp:emp,cell:cell};
  }

  function parseWorkItems(text){
    const out=[];
    String(text||'').split(/\r?\n/).forEach(function(line){
      line=line.trim(); if(!line)return;
      const p=line.split('｜');
      out.push({
        workArea:txt(p[0]),
        workText:txt(p[1]),
        startTime:txt(p[2]),
        endTime:txt(p[3]),
        note:txt(p[4])
      });
    });
    return out;
  }

  function workItemsText(items){
    return (items||[]).map(function(w){
      return [w.workArea||'',w.workText||'',w.startTime||'',w.endTime||'',w.note||''].join('｜').replace(/｜+$/,'');
    }).join('\n');
  }

  function shiftOptions(emp,date,selected){
    const byDate=(state.data&&state.data.shiftOptionsByDate)||{};
    const opts=(byDate&&byDate[date])||(state.data&&state.data.shiftOptions)||[];
    return opts.map(function(x){
      return '<option value="'+esc(x.code)+'" data-default-ot-min="'+esc(Number(x.defaultOvertimeMinutes||0))+'" '+(x.code===selected?'selected':'')+'>'+esc(x.name||x.code)+'</option>';
    }).join('');
  }

  function edit(employeeId,date){
    const x=findCell(employeeId,date); if(!x.emp||!x.cell)return;
    const c=x.cell,emp=x.emp;
    const b=document.createElement('div');
    b.className='p1a-editor-backdrop'; b.id='p1aEditor';
    b.innerHTML='<div class="p1a-editor" role="dialog" aria-modal="true">'+
      '<h2 style="margin-top:0">'+esc(emp.name)+'｜'+esc(date)+'</h2>'+
      '<div class="grid">'+
        '<div><label>出勤性質</label><select id="p1aNature">'+
          '<option value="NORMAL_WORK" '+(c.workNature==='NORMAL_WORK'?'selected':'')+'>正常上班</option>'+
          '<option value="REST_DAY_OVERTIME" '+(c.workNature==='REST_DAY_OVERTIME'?'selected':'')+'>休息日加班</option>'+
          '<option value="REST" '+(c.workNature==='REST'?'selected':'')+'>排休</option>'+
        '</select></div>'+
        '<div><label>班別</label><select id="p1aShift">'+shiftOptions(emp,date,c.shiftCode)+'</select></div>'+
        '<div><label>預計加班（小時）</label><input id="p1aOt" type="number" min="0" max="12" step="0.5" value="'+esc(Number(c.plannedOvertimeMinutes||0)/60)+'"></div>'+
        '<div><label>來源</label><input disabled value="'+esc(c.sourceType||'')+'"></div>'+
      '</div>'+
      '<label>今天工作安排／工段</label>'+
      '<textarea id="p1aWork">'+esc(workItemsText(c.workItems||[]))+'</textarea>'+
      '<div class="p1a-note">每行：工段｜工作內容｜開始時間｜結束時間｜備註。時間可留空。</div>'+
      '<label>排班備註</label><textarea id="p1aNote">'+esc(c.note||'')+'</textarea>'+
      '<div class="p1a-note">自訂上下班時間欄位已保留在後端契約，但在 Attendance resolver Gate 完成前不開放，避免排班畫面與正式出勤計算不一致。</div>'+
      '<div class="actions"><button type="button" class="secondary" id="p1aCancel">取消</button><button type="button" id="p1aSave">儲存草稿</button></div>'+
      '</div>';
    document.body.appendChild(b);
    const nature=el('p1aNature'),shift=el('p1aShift'),ot=el('p1aOt');
    function sync(){
      const rest=nature.value==='REST';
      shift.disabled=rest; ot.disabled=rest;
      if(rest)ot.value='0';
      const d=dateObj(date);
      if(d&&(d.getDay()===0||d.getDay()===6)&&nature.value==='NORMAL_WORK') nature.value='REST_DAY_OVERTIME';
    }
    function applyShiftDefaultOt(){
      if(nature.value==='REST') return;
      const opt=shift.options[shift.selectedIndex];
      const min=opt?Number(opt.getAttribute('data-default-ot-min')||0):0;
      ot.value=String(Math.round(min/6)/10);
    }
    nature.onchange=sync;
    shift.onchange=function(){applyShiftDefaultOt();sync();};
    sync();
    el('p1aCancel').onclick=function(){b.remove();};
    el('p1aSave').onclick=async function(){
      this.disabled=true;
      try{
        await call('phase1ScheduleSaveDraft',{
          sessionToken:sessionToken,
          employeeId:employeeId,
          date:date,
          workNature:nature.value,
          shiftCode:restOrShift(nature.value,shift.value),
          plannedOvertimeMinutes:Math.round(Number(ot.value||0)*60),
          workItems:parseWorkItems(el('p1aWork').value),
          note:el('p1aNote').value,
          baseSourceType:c.sourceType||'',
          baseSourceRef:c.sourceRef||''
        });
        b.remove(); showOk('排班草稿已儲存'); await load();
      }catch(e){showErr(e);this.disabled=false;}
    };
  }

  function restOrShift(nature,shift){
    return nature==='REST'?'FACTORY_REST':shift;
  }

  async function copy(mode){
    const label=mode==='PREVIOUS_WEEK'?'上週':'上月';
    const ok=await confirmBox('沿用'+label+'排班','將班別／排休與預計加班帶入目前週的草稿。工作安排預設不複製。','建立草稿');
    if(!ok)return;
    try{
      const r=await call('phase1ScheduleCopy',{sessionToken:sessionToken,weekStart:state.weekStart,site:state.site,mode:mode,includeWorkItems:false});
      showOk('已建立 '+Number(r.draftWrites||0)+' 筆草稿'); await load();
    }catch(e){showErr(e);}
  }

  async function publish(){
    const a=(state.data&&state.data.week&&state.data.week.analysis)||{};
    if(Number(a.missingDayCount||0)>0){showErr(new Error('仍有 '+a.missingDayCount+' 天漏排，請先補齊'));return;}
    const ok=await confirmBox('確認發布班表','發布後會成為正式 DAILY_SCHEDULE，並對有異動的員工發送自己的班表與工作安排。LINE 失敗不會回滾正式班表。','確認發布');
    if(!ok)return;
    try{
      const r=await call('phase1SchedulePublish',{sessionToken:sessionToken,weekStart:state.weekStart,site:state.site});
      showOk('發布完成：'+Number(r.scheduleWrites||0)+' 筆；LINE '+Number(r.notificationSentCount||0)+' 成功 / '+Number(r.notificationFailedCount||0)+' 未送達');
      await load();
    }catch(e){showErr(e);}
  }

  async function openFixedRest(){
    const box=panel(); if(!box||!legacyLoadRest)return;
    box.innerHTML='<div class="muted">載入固定休息日設定…</div>';
    try{
      await legacyLoadRest();
      const current=panel();
      if(current){
        const bar=document.createElement('div');
        bar.className='p1a-tabs';
        bar.innerHTML='<button type="button" onclick="ABIS_P1A.loadWeek()">返回週排班</button>';
        current.insertBefore(bar,current.firstChild);
      }
    }catch(e){showErr(e);}
  }

  async function open(){
    if(typeof accountPanel_!=='undefined') accountPanel_='scheduleRest';
    if(typeof renderMyAccount_==='function') renderMyAccount_();
    if(typeof rc2UpdateInnerBar_==='function') rc2UpdateInnerBar_();
    await load();
  }

  function moveWeek(delta){ state.weekStart=addDays(state.weekStart||monday(''),Number(delta||0)*7); load(); }
  function thisWeek(){ state.weekStart=monday(''); load(); }
  function toggleMissing(v){ state.missingOnly=!!v; render(); }

  window.ABIS_P1A={
    version:VERSION,
    open:open,
    loadWeek:load,
    openFixedRest:openFixedRest,
    moveWeek:moveWeek,
    thisWeek:thisWeek,
    copy:copy,
    publish:publish,
    edit:edit,
    toggleMissing:toggleMissing
  };

  if(typeof window.openFactoryWeeklyRestManagement_==='function'){
    window.openFactoryWeeklyRestManagement_=open;
  }
})();