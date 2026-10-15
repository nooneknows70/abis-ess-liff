(function(){
  'use strict';

  const VERSION='P5A2_5_PHASE1A_SIMPLE_SCHEDULE_UI_R2_10_V151_20261015';
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
      .p1a-wrap{display:flex;flex-direction:column;gap:14px;min-width:0;max-width:100%}
      .p1a-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:end;min-width:0}
      .p1a-toolbar .field{display:flex;flex-direction:column;gap:4px;min-width:145px}
      .p1a-toolbar label{font-size:12px;color:#667085}
      .p1a-toolbar button{width:auto}
      .p1a-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .p1a-metric{border:1px solid #dbe4ee;border-radius:12px;padding:12px;background:#fff}
      .p1a-metric b{display:block;font-size:22px;margin-top:4px}
      .p1a-metric.alert{border-color:#f4b6b6;background:#fff7f7}
      #rc208fScheduleRestPanel{width:100%;max-width:100%;min-width:0;overflow:hidden}
      .p1a-table-wrap{width:100%;max-width:100%;min-width:0;overflow-x:auto;overflow-y:visible;border:1px solid #dbe4ee;border-radius:12px;overscroll-behavior-x:contain}
      .p1a-hscroll{display:none;position:fixed;left:16px;bottom:10px;z-index:2147482400;width:calc(100vw - 32px);max-width:calc(100vw - 32px);height:18px;overflow-x:scroll;overflow-y:hidden;box-sizing:border-box;background:transparent}
      .p1a-hscroll.is-visible{display:block}
      @media(min-width:768px) and (max-width:1215px){.p1a-hscroll{display:block}}
      .p1a-hscroll-track{height:1px;width:1220px;pointer-events:none}
      .p1a-toast{position:fixed;left:50%;bottom:calc(72px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483200;min-width:min(360px,calc(100vw - 32px));max-width:min(620px,calc(100vw - 32px));padding:12px 16px;border-radius:12px;background:#0f5132;color:#fff;font-weight:800;line-height:1.45;box-shadow:0 12px 32px rgba(15,23,42,.28);text-align:center}
      .p1a-toast.error{background:#991b1b}
      .p1a-toast.warning{background:#92400e}
      @media(max-width:767px){.p1a-hscroll{display:none!important}}
      .p1a-table{border-collapse:separate;border-spacing:0;table-layout:fixed;width:1220px;min-width:1220px;max-width:1220px;background:#fff}
      .p1a-table th,.p1a-table td{width:150px;min-width:150px;max-width:150px;border-right:1px solid #e6edf4;border-bottom:1px solid #e6edf4;padding:8px;vertical-align:top;box-sizing:border-box}
      .p1a-table th{position:sticky;top:0;background:#f7f9fc;z-index:1;font-size:12px}
      .p1a-table th:first-child,.p1a-table td:first-child{position:sticky;left:0;background:#fff;z-index:30;width:170px;min-width:170px;max-width:170px;overflow:hidden;box-shadow:5px 0 8px -7px rgba(15,23,42,.45)}
      .p1a-table th:first-child{z-index:35;background:#f7f9fc}
      .p1a-table td:first-child .p1a-employee{position:relative;z-index:1;background:#fff}
      .p1a-frozen-head{display:none;position:fixed;top:0;z-index:2147482200;height:46px;grid-template-columns:170px minmax(0,1fr);overflow:hidden;background:#f7f9fc;border:1px solid #dbe4ee;border-radius:0 0 10px 10px;box-shadow:0 5px 16px rgba(15,23,42,.16);box-sizing:border-box}
      .p1a-frozen-head.is-visible{display:grid}
      .p1a-frozen-employee{display:flex;align-items:center;justify-content:center;width:170px;min-width:170px;max-width:170px;background:#f7f9fc;border-right:1px solid #e6edf4;font-size:12px;font-weight:800;position:relative;z-index:2}
      .p1a-frozen-dates-viewport{min-width:0;overflow:hidden}
      .p1a-frozen-dates-track{display:grid;grid-template-columns:repeat(7,150px);width:1050px;height:100%;will-change:transform}
      .p1a-frozen-date{display:flex;align-items:center;justify-content:center;width:150px;min-width:150px;max-width:150px;border-right:1px solid #e6edf4;font-size:12px;font-weight:800;background:#f7f9fc;box-sizing:border-box}
      .p1a-cell{width:100%;max-width:100%;min-width:0;min-height:94px;text-align:left;border:1px solid #dbe4ee;background:#fff;border-radius:10px;padding:8px;overflow:hidden}
      .p1a-cell.rest{background:#f8fafc}
      .p1a-cell.ot{background:#fff9ee}
      .p1a-cell.missing{background:#fff2f2;border-color:#ef9a9a}
      .p1a-cell.draft{box-shadow:inset 0 0 0 2px #a7c7ff}
      .p1a-cell .nature{font-size:12px;font-weight:700}
      .p1a-cell .shift{font-size:12px;margin-top:4px}
      .p1a-cell .sub{font-size:11px;color:#667085;margin-top:4px;overflow-wrap:anywhere}
      .p1a-employee b{display:block}.p1a-employee span{font-size:12px;color:#667085}
      .p1a-tabs{display:flex;gap:8px}.p1a-tabs button{width:auto}
      .p1a-analysis-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .p1a-editor-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px}
      .p1a-editor{width:min(94vw,640px);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.22)}
      .p1a-editor .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .p1a-editor textarea{min-height:110px}
      .p1a-editor .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
      .p1a-editor .actions button{width:auto}
      .p1a-note{font-size:12px;color:#667085}
      #rc208fScheduleRestPanel.p1a-refreshing{cursor:progress}
      #rc208fScheduleRestPanel.p1a-refreshing .p1a-cell,
      #rc208fScheduleRestPanel.p1a-refreshing .p1a-toolbar button,
      #rc208fScheduleRestPanel.p1a-refreshing .p1a-toolbar select,
      #rc208fScheduleRestPanel.p1a-refreshing .p1a-toolbar input{pointer-events:none!important}
      @media(max-width:900px){.p1a-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(s);
  }

  function panel(){
    return el('rc208fScheduleRestPanel');
  }

  const diag={lastEvent:'INIT',lastEmployeeId:'',lastDate:'',lastResult:'',lastError:''};

  function setDiag(eventName,employeeId,date,result,error){
    diag.lastEvent=txt(eventName);
    diag.lastEmployeeId=txt(employeeId);
    diag.lastDate=txt(date);
    diag.lastResult=txt(result);
    diag.lastError=txt(error);
    const d=el('p1aShadowDiag');
    if(d){
      d.textContent=
        'Phase1A '+VERSION+'｜'+
        (diag.lastEvent||'-')+'｜'+
        (diag.lastEmployeeId||'-')+'｜'+
        (diag.lastDate||'-')+'｜'+
        (diag.lastResult||'-')+
        (diag.lastError?'｜'+diag.lastError:'');
    }
  }

  let toastTimer_=null;

  function showToast_(text,type){
    let toast=el('p1aViewportToast');
    if(!toast){
      toast=document.createElement('div');
      toast.id='p1aViewportToast';
      toast.setAttribute('role','status');
      toast.setAttribute('aria-live','polite');
      document.body.appendChild(toast);
    }
    toast.className='p1a-toast'+(type?' '+type:'');
    toast.textContent=txt(text);
    toast.hidden=false;
    if(toastTimer_)clearTimeout(toastTimer_);
    toastTimer_=setTimeout(function(){
      if(toast)toast.hidden=true;
    },5000);
  }

  function showErr(e){
    const msg=e&&e.message?e.message:String(e);
    showToast_(msg,'error');
    if(typeof message==='function') message(msg,'error');
  }
  function showOk(t){
    showToast_(t,'');
    if(typeof message==='function') message(t,'success');
  }

  function clearGlobalAsyncCapture_(){
    try{
      if(typeof ABIS_ASYNC_RECENT_CLICK_!=='undefined') ABIS_ASYNC_RECENT_CLICK_=null;
    }catch(ignore){}
    try{
      if(typeof p5a114LastClickedButton_!=='undefined') p5a114LastClickedButton_=null;
    }catch(ignore){}
  }

  async function p1aCall(action,payload){
    clearGlobalAsyncCapture_();
    return call(action,payload);
  }

  function captureView_(box){
    const table=box&&box.querySelector?box.querySelector('.p1a-table-wrap'):null;
    return {
      windowY:Number(window.scrollY||0),
      tableLeft:table?Number(table.scrollLeft||0):0,
      tableTop:table?Number(table.scrollTop||0):0
    };
  }

  function restoreView_(box,view){
    if(!view)return;
    const run=function(){
      const table=box&&box.querySelector?box.querySelector('.p1a-table-wrap'):null;
      if(table){
        table.scrollLeft=Number(view.tableLeft||0);
        table.scrollTop=Number(view.tableTop||0);
      }
      try{window.scrollTo(0,Number(view.windowY||0));}catch(ignore){}
      try{
        if(typeof window.__ABIS_P1A_UPDATE_HSCROLL__==='function')window.__ABIS_P1A_UPDATE_HSCROLL__();
      }catch(ignore){}
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);
    else setTimeout(run,0);
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

  async function load(options){
    const opts=options||{};
    const box=panel(); if(!box||state.loading)return;
    state.loading=true; ensureStyle();

    const preserve=opts.preserveView===true && !!state.data && !!box.querySelector('.p1a-wrap');
    const view=preserve?captureView_(box):null;

    if(preserve){
      box.classList.add('p1a-refreshing');
      box.setAttribute('aria-busy','true');
      setDiag('REFRESHING','','',txt(opts.reason)||'SYNC','');
    }else{
      box.innerHTML='<div class="muted">載入週排班…</div>';
    }

    try{
      const data=await p1aCall('phase1ScheduleWeek',{
        sessionToken:sessionToken,
        weekStart:state.weekStart||'',
        site:state.site||''
      });
      state.data=data||{};
      state.weekStart=txt(data&&data.week&&data.week.weekStart)||monday('');
      if(!state.site) state.site=txt(data&&data.site)||txt((data&&data.availableSites||[])[0]);
      render();
      if(preserve)restoreView_(panel(),view);
      setDiag('REFRESH_DONE','','',txt(opts.reason)||'LOAD','');
    }catch(e){
      if(preserve){
        showErr(e);
        setDiag('REFRESH_ERROR','','',txt(opts.reason)||'SYNC',e&&e.message?e.message:String(e));
      }else{
        box.innerHTML='<div class="notice error">'+esc(e&&e.message?e.message:String(e))+'</div>';
      }
    }finally{
      state.loading=false;
      const current=panel();
      if(current){
        current.classList.remove('p1a-refreshing');
        current.removeAttribute('aria-busy');
      }
    }
  }

  function topHtml(){
    const d=state.data||{},w=d.week||{},auth=d.authorization||{};
    const sites=Array.isArray(d.availableSites)?d.availableSites:[];
    const siteSelect=auth.scope==='COMPANY'
      ? '<div class="field"><label>廠區</label><select id="p1aSite">'+sites.map(function(s){return '<option value="'+esc(s)+'" '+(s===state.site?'selected':'')+'>'+esc(s)+'</option>';}).join('')+'</select></div>'
      : '<div class="field"><label>廠區</label><div><b>'+esc(auth.site||state.site||'')+'</b></div></div>';
    return '<div id="p1aShadowDiag" class="p1a-note" style="margin:0 0 8px;padding:8px 10px;border:1px dashed #94a3b8;border-radius:8px;background:#f8fafc">Phase1A '+esc(VERSION)+'｜READY</div>'+
      '<div class="p1a-tabs">'+
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
      '<div class="p1a-note">週檢視固定為星期一～星期日。休息日出勤與排休分開；Punch 不反推班表。預計加班僅供規劃，不會直接寫入 OVERTIME_FACT／Payroll。</div>';
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
    return '<button type="button" class="'+cls.join(' ')+'" data-p1a-employee-id="'+esc(emp.employeeId)+'" data-p1a-date="'+esc(cell.date)+'">'+
      '<div class="nature">'+esc(cell.missing?'未排班':workNatureLabel(cell.workNature))+'</div>'+
      '<div class="shift">'+esc(shiftLabel(cell))+'</div>'+
      (sub.length?'<div class="sub">'+esc(sub.join('｜'))+'</div>':'')+
      '</button>';
  }

  function tableHtml(){
    const w=(state.data&&state.data.week)||{},rows=Array.isArray(w.employees)?w.employees:[];
    const dates=Array.isArray(w.dates)?w.dates:[];
    const visible=state.missingOnly?rows.filter(function(r){return r.analysis&&r.analysis.missingDates&&r.analysis.missingDates.length;}):rows;
    const frozenDates=dates.map(function(d){const o=dateObj(d);const wk=['日','一','二','三','四','五','六'][o.getDay()];return '<div class="p1a-frozen-date">'+esc(wk+' '+fmt(d))+'</div>';}).join('');
    return '<div class="p1a-frozen-head" id="p1aFrozenHead"><div class="p1a-frozen-employee">員工</div><div class="p1a-frozen-dates-viewport"><div class="p1a-frozen-dates-track" id="p1aFrozenDatesTrack">'+frozenDates+'</div></div></div>'+
      '<div class="p1a-table-wrap"><table class="p1a-table"><thead><tr><th>員工</th>'+
      dates.map(function(d){const o=dateObj(d);const wk=['日','一','二','三','四','五','六'][o.getDay()];return '<th>'+esc(wk+' '+fmt(d))+'</th>';}).join('')+
      '</tr></thead><tbody>'+
      visible.map(function(emp){
        return '<tr><td><div class="p1a-employee"><b>'+esc(emp.name)+'</b><span>'+esc(emp.employeeId)+'｜'+esc(emp.site)+'</span><span>本週OT '+esc((emp.analysis&&emp.analysis.plannedOvertimeHours)||0)+'h</span></div></td>'+
          (emp.cells||[]).map(function(c){return '<td>'+cellHtml(emp,c)+'</td>';}).join('')+'</tr>';
      }).join('')+
      '</tbody></table></div>'+
      '<div class="p1a-hscroll" id="p1aHScroll" aria-label="班表水平捲動"><div class="p1a-hscroll-track" id="p1aHScrollTrack"></div></div>';
  }

  function render(){
    const box=panel(); if(!box)return; ensureStyle();
    box.innerHTML='<div class="p1a-wrap">'+topHtml()+metricsHtml()+tableHtml()+'</div>';
    const site=el('p1aSite');
    if(site)site.onchange=function(){state.site=this.value;load();};
    const wk=el('p1aWeekStart');
    if(wk)wk.onchange=function(){state.weekStart=monday(this.value);load();};
    const tableWrap=box.querySelector('.p1a-table-wrap');
    const tableEl=box.querySelector('.p1a-table');
    const tableHead=box.querySelector('.p1a-table thead');
    const frozenHead=el('p1aFrozenHead');
    const frozenTrack=el('p1aFrozenDatesTrack');
    const hScroll=el('p1aHScroll');
    const hTrack=el('p1aHScrollTrack');

    function updateFrozenHead(){
      if(!tableWrap||!tableHead||!frozenHead||!frozenTrack)return;
      const viewportWidth=Number(document.documentElement&&document.documentElement.clientWidth||0)||Number(window.innerWidth||0);
      const viewportHeight=Number(window.innerHeight||0);
      const tableRect=tableWrap.getBoundingClientRect();
      const headRect=tableHead.getBoundingClientRect();
      const left=Math.max(12,Number(tableRect.left||0));
      const availableWidth=Math.max(320,Math.min(1220,viewportWidth-left-12));
      frozenHead.style.left=left+'px';
      frozenHead.style.width=availableWidth+'px';
      frozenHead.style.maxWidth=availableWidth+'px';
      frozenTrack.style.transform='translateX('+(-Number(tableWrap.scrollLeft||0))+'px)';
      const inSchedule=typeof accountPanel_==='undefined'||String(accountPanel_||'')==='scheduleRest';
      const visible=inSchedule&&viewportWidth>=768&&headRect.bottom<=0&&tableRect.bottom>46&&tableRect.top<viewportHeight;
      frozenHead.classList.toggle('is-visible',visible);
    }

    function updateHScroll(){
      if(!tableWrap||!tableEl||!hScroll||!hTrack)return;

      const viewportWidth=
        Number(document.documentElement&&document.documentElement.clientWidth||0) ||
        Number(window.innerWidth||0);

      const rect=tableWrap.getBoundingClientRect();
      const left=Math.max(12,Number(rect.left||0));
      const availableWidth=Math.max(
        320,
        Math.min(
          1220,
          viewportWidth-left-12
        )
      );

      tableWrap.style.width=availableWidth+'px';
      tableWrap.style.maxWidth=availableWidth+'px';
      tableWrap.style.minWidth='0';

      hScroll.style.left=left+'px';
      hScroll.style.width=availableWidth+'px';
      hScroll.style.maxWidth=availableWidth+'px';

      const max=Math.max(0,1220-availableWidth);
      const inSchedule=
        typeof accountPanel_==='undefined' ||
        String(accountPanel_||'')==='scheduleRest';

      hScroll.classList.toggle(
        'is-visible',
        inSchedule &&
        viewportWidth>=768 &&
        max>4
      );

      hScroll.scrollLeft=Math.min(
        max,
        Math.max(0,Number(tableWrap.scrollLeft||0))
      );

      setDiag(
        'HSCROLL_READY',
        '',
        '',
        'VW='+viewportWidth+',LEFT='+Math.round(left)+',VIEW='+Math.round(availableWidth)+',MAX='+Math.round(max),
        ''
      );
    }

    if(tableWrap&&tableEl&&hScroll&&hTrack){
      let syncing=false;

      tableWrap.addEventListener('scroll',function(){
        if(syncing)return;
        syncing=true;
        hScroll.scrollLeft=tableWrap.scrollLeft;
        if(frozenTrack)frozenTrack.style.transform='translateX('+(-Number(tableWrap.scrollLeft||0))+'px)';
        syncing=false;
      },{passive:true});

      hScroll.addEventListener('scroll',function(){
        if(syncing)return;
        syncing=true;
        tableWrap.scrollLeft=hScroll.scrollLeft;
        syncing=false;
      },{passive:true});

      updateHScroll();
      setTimeout(updateHScroll,0);
    }

    window.__ABIS_P1A_UPDATE_HSCROLL__=updateHScroll;
    window.__ABIS_P1A_UPDATE_FROZEN_HEAD__=updateFrozenHead;
    updateFrozenHead();

    if(!window.__ABIS_P1A_FROZEN_HEAD_WINDOW_BOUND__){
      window.__ABIS_P1A_FROZEN_HEAD_WINDOW_BOUND__=true;
      window.addEventListener('scroll',function(){
        try{if(typeof window.__ABIS_P1A_UPDATE_FROZEN_HEAD__==='function')window.__ABIS_P1A_UPDATE_FROZEN_HEAD__();}catch(ignore){}
      },{passive:true});
      window.addEventListener('resize',function(){
        try{if(typeof window.__ABIS_P1A_UPDATE_FROZEN_HEAD__==='function')window.__ABIS_P1A_UPDATE_FROZEN_HEAD__();}catch(ignore){}
      },{passive:true});
    }

    if(!window.__ABIS_P1A_HSCROLL_WINDOW_BOUND__){
      window.__ABIS_P1A_HSCROLL_WINDOW_BOUND__=true;
      window.addEventListener('resize',function(){
        try{
          if(typeof window.__ABIS_P1A_UPDATE_HSCROLL__==='function'){
            window.__ABIS_P1A_UPDATE_HSCROLL__();
          }
        }catch(ignore){}
      },{passive:true});
    }

    const cellButtons=box.querySelectorAll('.p1a-cell[data-p1a-employee-id][data-p1a-date]');
    cellButtons.forEach(function(btn){
      btn.disabled=false;
      btn.removeAttribute('aria-busy');
      btn.classList.remove('is-busy','abis-async-busy','abis-async-structured');
      btn.style.pointerEvents='auto';
      btn.style.position='relative';
      btn.style.zIndex='0';
    });
    setDiag('RENDER','','','CELLS='+cellButtons.length,'');
  }

  function findCell(employeeId,date){
    const employeeKey=txt(employeeId);
    const dateKey=txt(date);
    const rows=(state.data&&state.data.week&&state.data.week.employees)||[];
    const emp=rows.find(function(x){return txt(x&&x.employeeId)===employeeKey;});
    const cell=emp&&(emp.cells||[]).find(function(x){return txt(x&&x.date)===dateKey;});
    return {emp:emp,cell:cell,employeeKey:employeeKey,dateKey:dateKey};
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
    setDiag('EDIT_ENTER',employeeId,date,'LOOKUP','');
    const x=findCell(employeeId,date);
    if(!x.emp||!x.cell){
      const rows=(state.data&&state.data.week&&state.data.week.employees)||[];
      const detail='EMP='+(x.emp?'Y':'N')+',CELL='+(x.cell?'Y':'N')+',ROWS='+rows.length;
      setDiag('EDIT_LOOKUP_FAIL',employeeId,date,detail,'');
      if(typeof message==='function') message('排班格資料比對失敗：'+detail,'warning');
      return;
    }
    const c=x.cell,emp=x.emp;
    setDiag('EDIT_LOOKUP_OK',employeeId,date,'MODAL_BUILD','');
    const old=el('p1aEditor'); if(old)old.remove();
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
    setDiag('EDIT_MODAL_ATTACHED',employeeId,date,document.getElementById('p1aEditor')?'OK':'MISSING','');
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
      const btn=this;
      const originalText=btn.textContent;
      btn.disabled=true;
      btn.textContent='儲存中…';
      try{
        await p1aCall('phase1ScheduleSaveDraft',{
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
        b.remove();
        showOk('排班草稿已儲存');
        await load({preserveView:true,reason:'SAVE_DRAFT'});
      }catch(e){
        showErr(e);
        if(btn&&btn.isConnected){
          btn.disabled=false;
          btn.textContent=originalText;
        }
      }
    };
  }

  function restOrShift(nature,shift){
    return nature==='REST'?'FACTORY_REST':shift;
  }

  async function copy(mode){
    const label=mode==='PREVIOUS_WEEK'?'上週':'上月';
    const ok=await confirmBox('沿用'+label+'排班','會把來源週畫面中的班別／排休／預計加班同步到目前週。若目前週已有草稿，會更新核心排班欄位；本週已填的工作安排會保留。','同步草稿');
    if(!ok)return;
    try{
      const r=await p1aCall('phase1ScheduleCopy',{sessionToken:sessionToken,weekStart:state.weekStart,site:state.site,mode:mode,includeWorkItems:false});
      showOk('已同步 '+Number(r.draftWrites||0)+' 筆草稿（新增 '+Number(r.draftInserts||0)+'／更新 '+Number(r.draftUpdates||0)+'）'); await load({preserveView:true,reason:'COPY'});
    }catch(e){showErr(e);}
  }

  async function publish(){
    const a=(state.data&&state.data.week&&state.data.week.analysis)||{};
    if(Number(a.missingDayCount||0)>0){showErr(new Error('仍有 '+a.missingDayCount+' 天漏排，請先補齊'));return;}
    const ok=await confirmBox('確認發布班表','發布後會成為正式 DAILY_SCHEDULE，並對有異動的員工發送自己的班表與工作安排。LINE 失敗不會回滾正式班表。','確認發布');
    if(!ok)return;
    try{
      const r=await p1aCall('phase1SchedulePublish',{sessionToken:sessionToken,weekStart:state.weekStart,site:state.site});
      const releaseId=txt(r&&r.releaseId);
      const lineText=r&&r.notificationSuppressedBySandbox
        ? 'Sandbox 測試：LINE 已安全抑制，沒有外送'
        : 'LINE '+Number(r&&r.notificationSentCount||0)+' 成功 / '+Number(r&&r.notificationFailedCount||0)+' 未送達';
      showOk('發布完成：'+Number(r&&r.scheduleWrites||0)+' 筆；'+lineText+(releaseId?'；Release '+releaseId:''));
      setDiag('PUBLISH_OK','','',releaseId||'NO_RELEASE_ID','');
      await load({preserveView:true,reason:'PUBLISH'});
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
    if(
      typeof abisEssMobileSchedulingAllowed_==='function' &&
      !abisEssMobileSchedulingAllowed_()
    ){
      if(typeof message==='function'){
        const text=typeof abisEssMobileSchedulingUnavailableText_==='function'
          ? abisEssMobileSchedulingUnavailableText_()
          : '班表管理目前請使用桌機版。';
        message(text,'warning');
      }
      return;
    }
    if(typeof accountPanel_!=='undefined') accountPanel_='scheduleRest';
    if(typeof renderMyAccount_==='function') renderMyAccount_();
    if(typeof rc2UpdateInnerBar_==='function') rc2UpdateInnerBar_();
    await load();
  }

  function installStableViewportGate_(){
    if(window.__ABIS_P1A_STABLE_VIEWPORT_GATE__)return;
    if(typeof abisEssM1ApplyFeatureGate_!=='function')return;

    const legacy=abisEssM1ApplyFeatureGate_;
    try{window.removeEventListener('resize',legacy,false);}catch(ignore){}
    try{window.removeEventListener('orientationchange',legacy,false);}catch(ignore){}

    const stable=function(){
      const inSchedule=typeof accountPanel_!=='undefined' && String(accountPanel_||'')==='scheduleRest';
      const schedulingAllowed=
        typeof abisEssMobileSchedulingAllowed_!=='function' ||
        abisEssMobileSchedulingAllowed_();

      if(inSchedule&&schedulingAllowed){
        if(typeof rc208ForceViewport_==='function')rc208ForceViewport_();
        try{
          if(typeof window.__ABIS_P1A_UPDATE_HSCROLL__==='function')window.__ABIS_P1A_UPDATE_HSCROLL__();
          if(typeof window.__ABIS_P1A_UPDATE_FROZEN_HEAD__==='function')window.__ABIS_P1A_UPDATE_FROZEN_HEAD__();
        }catch(ignore){}
        setDiag('VIEWPORT_STABLE','','','WIDTH='+Number(window.innerWidth||0),'');
        return;
      }

      legacy();
    };

    window.addEventListener('resize',stable,{passive:true});
    window.addEventListener('orientationchange',stable,{passive:true});
    window.__ABIS_P1A_STABLE_VIEWPORT_GATE__={
      legacy:legacy,
      handler:stable
    };
  }

  installStableViewportGate_();

  function moveWeek(delta){ state.weekStart=addDays(state.weekStart||monday(''),Number(delta||0)*7); load(); }
  function thisWeek(){ state.weekStart=monday(''); load(); }
  function toggleMissing(v){ state.missingOnly=!!v; render(); }

  if(!window.__ABIS_P1A_CELL_CAPTURE_BOUND__){
    window.__ABIS_P1A_CELL_CAPTURE_BOUND__=true;
    window.addEventListener('click',function(ev){
      const raw=ev&&ev.target;
      const btn=raw&&raw.closest?raw.closest('.p1a-cell[data-p1a-employee-id][data-p1a-date]'):null;
      if(!btn)return;
      const root=panel();
      if(!root||!root.contains(btn))return;
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof ev.stopImmediatePropagation==='function')ev.stopImmediatePropagation();
      const employeeId=btn.getAttribute('data-p1a-employee-id')||'';
      const date=btn.getAttribute('data-p1a-date')||'';
      setDiag('CELL_CLICK_CAPTURE',employeeId,date,'DISPATCH_EDIT','');
      try{
        edit(employeeId,date);
      }catch(e){
        const msg=e&&e.message?e.message:String(e);
        setDiag('EDIT_THROW',employeeId,date,'ERROR',msg);
        if(typeof message==='function')message('排班編輯器錯誤：'+msg,'warning');
      }
    },true);
  }

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