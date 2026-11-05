'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const bundlePath='assets/ess-20261007-rc13-hf8/abis-ess.bundle.js';
const adapterPath='assets/ess-20261106-hrlb-v1-1-ui-entry/abis-hrlb-ui-entry.js';
const bundle=fs.readFileSync(path.join(root,bundlePath),'utf8');
const adapter=fs.readFileSync(path.join(root,adapterPath),'utf8');
const defaultForm={employeeId:'T90001',date:'2026-10-02',leaveTypeCode:'PERSONAL',applicationType:'FULL',startTime:'',endTime:'',reason:'合成歷史補登來源核對測試',evidenceType:'SOURCE_OWNER_DECISION',evidenceRef:'SYNTHETIC-REFERENCE'};
function harness({role='HR',handler,install=true,supervisor=true,planner=true}={}){
  const elements=new Map(),requests=[],timers=[],focus=[];let seq=0;
  function element(id){return {id,innerHTML:'',value:'',disabled:false,style:{setProperty(){}},dataset:{},classList:{contains:()=>false,add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},appendChild(){},addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,focus(){focus.push(id);}};}
  const document={getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>element(''),addEventListener(){},documentElement:element('html'),head:element('head'),body:element('body')};
  const ctx={console,document,ABIS_SERVER_BOOT:{},localStorage:{getItem:()=>null,setItem(){}},location:{href:'https://synthetic.invalid',search:'',hash:''},navigator:{userAgent:'synthetic',maxTouchPoints:0},performance:{now:()=>0},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},setInterval:()=>1,clearInterval(){},URL,URLSearchParams,MutationObserver:class{observe(){}},escapeHtml:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),tr:s=>s,crypto:{randomUUID:()=>`SYNTHETIC-REQUEST-${++seq}`},fetch:()=>{throw Error('REAL_NETWORK_FORBIDDEN');},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){}};
  ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
  vm.runInContext(bundle,ctx,{timeout:1500,filename:bundlePath});
  const home={employee:{id:'T90002',name:'合成HR',approvalPermission:role},leaveDashboard:{canView:supervisor,directReportCount:supervisor?1:0},scheduleManagement:{canManage:planner}};
  vm.runInContext('homeData='+JSON.stringify(home)+";sessionToken='SYNTHETIC_SESSION';currentLang='ZH';",ctx);
  const preview=p=>({ok:true,mode:'READ_ONLY_BACKFILL_PREVIEW',previewHash:'SYNTHETIC-HASH',requestId:p.requestId,employeeId:p.employeeId.toUpperCase(),date:p.date,leaveTypeCode:p.leaveTypeCode,actorId:'T90002',role,hours:p.applicationType==='HOURLY'?4:8});
  ctx.call=async(action,payload)=>{if(!['hrLeaveBackfillPreview','hrLeaveBackfillOneClick','hrLeaveBackfillStatus'].includes(action))throw Error('UNRELATED_API_FORBIDDEN:'+action);requests.push({action,payload:JSON.parse(JSON.stringify(payload))});return handler?handler(action,payload):preview(payload);};
  const originalTools=ctx.rc2ManagementToolsHtml_(),oldFunctions=Object.fromEntries(['submitLeave','approveAction','openHrCredentialAdmin','openFactoryWeeklyRestManagement_','abisEssM7LeavePanelHtml_','abisEssM7TeamPanelHtml_','abisEssM7ReportsPanelHtml_'].map(n=>[n,ctx[n]]));
  const load=()=>vm.runInContext(adapter,ctx,{timeout:1500,filename:adapterPath});if(install)load();
  function fill(form={}){for(const [k,v] of Object.entries({...defaultForm,...form}))document.getElementById('abisHrlb_'+k).value=v;}
  const render=()=>{ctx.renderMyAccount_();return document.getElementById('accountContent').innerHTML;};
  const open=()=>ctx.rc2OpenAccountPanel_('historicalLeaveBackfill');
  const run=code=>vm.runInContext(code,ctx);
  return {ctx,requests,elements,timers,focus,preview,load,fill,render,open,run,originalTools,oldFunctions,state:()=>ctx.ABIS_ESS_HRLB_UI_,html:()=>document.getElementById('accountContent').innerHTML};
}
const complete=p=>({ok:true,requestId:p.requestId,leaveId:'SYNTHETIC-LEAVE-1',approved:true,factVerified:true,dailyVerified:true});
const status=p=>({found:true,requestId:p.requestId,leaveId:'SYNTHETIC-LEAVE-1',employeeId:'T90001',date:'2026-10-02',leaveType:'PERSONAL',approvedBy:'T90002',completed:true,state:'COMPLETE'});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
module.exports={harness,complete,status,deferred,bundle,adapter,bundlePath,adapterPath,defaultForm};
