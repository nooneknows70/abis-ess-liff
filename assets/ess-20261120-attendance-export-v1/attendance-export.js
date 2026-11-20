/** Versioned adapter. Existing identity, transport, navigation and management renderer. */
(function(){
  'use strict';
  if(window.ABIS_ATTENDANCE_EXPORT_V1)return;
  if(typeof rc2ManagementToolsHtml_!=='function'||typeof rc2AccountPanelHtml_!=='function'||typeof rc2OpenAccountPanel_!=='function'||typeof abisEssM2HasHrTools_!=='function'||typeof abisEssM2ToolButton_!=='function'||typeof abisEssM7xt_!=='function'||typeof renderMyAccount_!=='function'||typeof call!=='function'||typeof sessionToken==='undefined')return;
  const VERSION='ABIS_ESS_ATTENDANCE_EXPORT_FROZEN_V1_20261120',panel='attendanceExport';
  const state={busy:false,snapshots:[],selected:'',error:'',owner:'',sequence:0};
  function allowed(){return !!sessionToken&&abisEssM2HasHrTools_();}
  function clear(){state.snapshots=[];state.selected='';state.owner='';state.error='';state.sequence++;}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function html(){
    if(!allowed()){clear();return '<div role="alert">僅限有效 HR／ADMIN Session</div>';}
    if(state.owner&&state.owner!==sessionToken)clear();
    return '<section id="ae-panel"><h3>出勤匯出</h3><div class="ae-controls"><label>開始月份 <input id="ae-start" type="month" aria-label="開始月份"></label><label>結束月份 <input id="ae-end" type="month" aria-label="結束月份"></label><button id="ae-query" type="button" class="abis-m71-primary">查詢</button><label>月份切換 <select id="ae-month" aria-label="月份切換"></select></label><button id="ae-download" type="button">下載 Excel（.xlsx）</button></div><p id="ae-status" role="status"></p><div id="ae-error" role="alert"></div><div id="ae-table" class="ae-scroll" tabindex="0" aria-label="出勤表，可橫向捲動"></div></section>';
  }
  function color(v,fallback){return /^#[0-9A-Fa-f]{6}$/.test(v)?v:fallback;}
  function paint(){
    if(!allowed()||state.owner&&state.owner!==sessionToken){clear();const t=document.getElementById('ae-table');if(t)t.textContent='';return;}
    const s=state.snapshots.find(function(s){return s.month===state.selected;}),select=document.getElementById('ae-month');if(!select)return;
    select.innerHTML=state.snapshots.map(function(x){return '<option value="'+esc(x.month)+'"'+(x.month===state.selected?' selected':'')+'>'+esc(x.month)+'</option>';}).join('');
    document.getElementById('ae-query').disabled=state.busy;document.getElementById('ae-download').disabled=state.busy||!s;
    document.getElementById('ae-error').textContent=state.error;
    document.getElementById('ae-status').textContent=state.busy?'處理中…':s?'最後成功同步：'+s.lastSuccessfulSync+'｜資料截止：'+s.cutoff+'｜狀態：'+s.status+'｜來源待確認 '+s.rows.reduce(function(n,r){return n+r.filter(function(c){return c.value==='來源待確認';}).length;},0)+' 格':'尚無查詢結果';
    const target=document.getElementById('ae-table');if(!s){target.textContent='';return;}
    const starts={},hidden={};(s.merges||[]).forEach(function(m){starts[m.r1+','+m.c1]=m;for(let r=m.r1;r<=m.r2;r++)for(let c=m.c1;c<=m.c2;c++)if(r!==m.r1||c!==m.c1)hidden[r+','+c]=true;});
    function row(cells,r,head){return '<tr>'+cells.map(function(c,i){if(hidden[r+','+i])return '';const m=starts[r+','+i],tag=head?'th':'td';return '<'+tag+' data-ae-col="'+i+'"'+(head?' scope="col"':'')+(m?' colspan="'+(m.c2-m.c1+1)+'" rowspan="'+(m.r2-m.r1+1)+'"':'')+' title="'+esc(c.note)+'" style="background:'+color(c.bg,'#FFFFFF')+';color:'+color(c.color,'#000000')+';font-weight:'+(c.bold?'700':'400')+'">'+esc(c.value)+'</'+tag+'>';}).join('')+'</tr>';}
    target.innerHTML='<table class="ae-grid"><colgroup>'+s.columns.map(function(w){return '<col style="width:'+Math.max(40,Math.min(400,Number(w)*7))+'px">';}).join('')+'</colgroup><thead>'+s.headers.map(function(c,r){return row(c,r,true);}).join('')+'</thead><tbody>'+s.rows.map(function(c,r){return row(c,r+3,false);}).join('')+'</tbody></table>';
    const first=Math.max(40,Math.min(400,Number(s.columns[0])*7));target.style.setProperty('--ae-first',first+'px');
  }
  function validMonth(m){return /^\d{4}-(0[1-9]|1[0-2])$/.test(m);}
  async function request(download){
    if(!allowed()||state.busy)return;
    const start=document.getElementById('ae-start').value,end=document.getElementById('ae-end').value;
    if(!validMonth(start)||!validMonth(end)||start>end){state.error='請輸入有效的開始及結束月份。';paint();return;}
    const token=sessionToken;
    if(state.owner&&state.owner!==token)clear();const seq=++state.sequence;state.owner=token;state.error='';state.busy=true;paint();
    try{
      const payload={sessionToken:token,startMonth:start,endMonth:end,ruleVersion:VERSION};
      if(download){payload.versions={};state.snapshots.forEach(function(s){payload.versions[s.month]=s.snapshotVersion;});}
      const out=await call(download?'attendanceExportDownload':'attendanceExportQuery',payload);
      if(seq!==state.sequence||token!==sessionToken||!allowed())return;
      if(!out||out.ok===false)throw Error('SERVICE_HOLD');
      if(download){if(!out.base64||out.mimeType!=='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')throw Error('RECEIPT');const raw=atob(out.base64),bytes=Uint8Array.from(raw,function(c){return c.charCodeAt(0);}),url=URL.createObjectURL(new Blob([bytes],{type:out.mimeType})),a=document.createElement('a');a.href=url;a.download=out.fileName;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
      else{if(out.ruleVersion!==VERSION||!Array.isArray(out.snapshots))throw Error('RECEIPT');state.snapshots=out.snapshots;state.selected=out.snapshots[0]?out.snapshots[0].month:'';}
    }catch(e){if(token===sessionToken&&seq===state.sequence){if(!download)state.snapshots=[];state.error='目前無法取得已驗證快照，請由管理員確認來源與同步狀態。';}}
    finally{state.busy=false;paint();}
  }
  function mount(){if(!allowed())return;const q=document.getElementById('ae-query');if(!q)return;q.onclick=function(){request(false);};document.getElementById('ae-download').onclick=function(){request(true);};document.getElementById('ae-month').onchange=function(e){state.selected=e.target.value;paint();};paint();}
  const tools=rc2ManagementToolsHtml_,body=rc2AccountPanelHtml_,open=rc2OpenAccountPanel_;
  rc2ManagementToolsHtml_=function(){const h=tools.apply(this,arguments);if(!allowed()||typeof h!=='string'||h.includes("rc2OpenAccountPanel_('attendanceExport')"))return h;const anchor=abisEssM2ToolButton_(abisEssM7xt_('managementReports'),"rc2OpenAccountPanel_('managementReports')");return h.split(anchor).length===2?h.replace(anchor,abisEssM2ToolButton_('出勤匯出',"rc2OpenAccountPanel_('attendanceExport')")+anchor):h;};
  rc2AccountPanelHtml_=function(p){return p===panel?html():body.apply(this,arguments);};
  rc2OpenAccountPanel_=function(p){if(p===panel&&!allowed())return;if(p!==panel)clear();const result=open.apply(this,arguments);if(p===panel)mount();return result;};
  const css=document.createElement('style');css.textContent='.ae-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.ae-controls label{display:flex;flex-direction:column}.ae-scroll{overflow:auto;max-height:70vh;isolation:isolate}.ae-grid{border-collapse:separate;border-spacing:0;table-layout:fixed;width:max-content}.ae-grid th,.ae-grid td{border:1px solid #bbb;padding:4px;min-width:70px;height:24px;white-space:pre-wrap;text-align:center}.ae-grid thead{position:sticky;top:0;z-index:3}.ae-grid [data-ae-col="0"]{position:sticky;left:0;z-index:2;width:var(--ae-first)}.ae-grid [data-ae-col="1"]{position:sticky;left:var(--ae-first);z-index:2}.ae-grid thead [data-ae-col="0"],.ae-grid thead [data-ae-col="1"]{z-index:4}';document.head.appendChild(css);
  window.ABIS_ATTENDANCE_EXPORT_V1=Object.freeze({version:VERSION,html:html,mount:mount,request:request,clear:clear,paint:paint});
})();
