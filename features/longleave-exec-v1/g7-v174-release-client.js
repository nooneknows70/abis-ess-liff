/* ABIS ESS G7 v174 source-only client transport bridge (not in official LIFF V153). */
(function(root){
 'use strict';
 var RELEASE_MODE='DRAFT_DISABLED';
 var ACTIONS=['SUPERVISOR_SUBMIT','SUPERVISOR_SUPPLEMENT',
   'EXECUTIVE_APPROVE','EXECUTIVE_RETURN','EXECUTIVE_REJECT',
   'EMPLOYEE_AMEND','EMPLOYEE_CANCEL'];
 var roleFor={SUPERVISOR_SUBMIT:'SUPERVISOR',SUPERVISOR_SUPPLEMENT:'SUPERVISOR',
   EXECUTIVE_APPROVE:'EXECUTIVE',EXECUTIVE_RETURN:'EXECUTIVE',
   EXECUTIVE_REJECT:'EXECUTIVE',EMPLOYEE_AMEND:'EMPLOYEE',EMPLOYEE_CANCEL:'EMPLOYEE'};
 function hold(code){throw Error('G7_V174_LIFF_HOLD_'+code);}
 function need(v,code){if(!v)hold(code);}
 function trim(s){return String(s==null?'':s).trim();}
 function createAdapter(opts){
   need(opts&&typeof opts.rpc==='function'&&typeof opts.getSession==='function',
     'AUTHENTICATED_RPC_AND_SESSION_REQUIRED');
   if(RELEASE_MODE!=='AUTHORIZED_RELEASE'){
     need(opts.syntheticOnly===true&&opts.rpc.__g7MockOnly===true,
       'OFFICIAL_BUNDLE_NOT_RELEASED');
   }
   var clock=opts.idFactory;
   need(typeof clock==='function','IDEMPOTENCY_FACTORY_REQUIRED');
   var ui=opts.ui;
   need(ui&&typeof ui.employeeHtml==='function'&&
     typeof ui.executiveHtml==='function'&&typeof ui.supervisorHtml==='function',
     'UI_RENDERER_REQUIRED');
   var active=false,uncertain=false,lastCase=null,gate=null,lastRequestId='';
   function rpc(action,payload){
     return opts.rpc(action,Object.assign({sessionToken:opts.getSession()},payload||{}));
   }
   async function status(){
     var r=await rpc('longLeaveExecV1Status',{});
     need(r&&r.policy&&r.release,'UNTRUSTED_FEATURE_STATUS');
     gate=r;
     return {featureEnabled:r.featureEnabled===true,
       providerBound:r.providerBound===true,
       releaseMode:r.release.mode||'DRAFT_DISABLED',policy:r.policy};
   }
   function assertActive(){
     need(gate&&gate.featureEnabled===true&&gate.providerBound===true&&
       gate.release&&gate.release.mode==='AUTHORIZED_RELEASE','BACKEND_FEATURE_NOT_ACTIVE');
   }
   async function read(leaveId){
     need(!active,'DOUBLE_SUBMIT_LOCKED');
     var st=await status();
     need(st.featureEnabled&&st.providerBound,'BACKEND_FEATURE_NOT_ACTIVE');
     assertActive();
     var id=trim(leaveId);need(id,'LEAVE_ID_REQUIRED');
     var r=await rpc('longLeaveExecV1Read',{leaveId:id});
     need(r&&r.g7ServerProjection==='AUTHORITATIVE_COMMIT_AWARE'&&
       r.serverScopeApplied===true&&
       ['FULL_BEFORE','FULL_COMMITTED'].indexOf(r.g7Visibility)>=0&&
       r.readTier==='FORMAL_PROVIDER_VERIFIED','UNVERIFIED_GROUP_READER');
     need(r.case&&r.case.leaveId===id&&
       ['SUPERVISOR','EXECUTIVE','EMPLOYEE'].indexOf(r.case.actorRole)>=0,
       'SERVER_CASE_ROLE_REQUIRED');
     need(Array.isArray(r.groups)&&r.groups.length>0,
       'SERVER_GROUP_RECEIPT_REQUIRED');
     var matching=r.groups.filter(function(g){return g&&g.groupId===r.case.groupId;});
     need(matching.length===1,'CASE_GROUP_SCOPE_NOT_UNIQUE');
     var group=matching[0];
     need(Number.isInteger(group.memberCount)&&group.memberCount>=1&&
       !!trim(group.requestId)&&
       group.sourceEpoch===r.case.sourceEpoch&&
       ((group.phase==='PREPARED'&&group.visibility==='FULL_BEFORE')||
        (group.phase==='COMMITTED'&&group.visibility==='FULL_COMMITTED')),
       'AUTHORITATIVE_GROUP_RECEIPT_INVALID');
     if(group.memberCount===1)
       need(group.singleLeavePolicyVerified===true,'SINGLE_LEAVE_POLICY_NOT_VERIFIED');
     lastCase=r.case;
     return r;
   }
   function validateAction(action,data){
     need(ACTIONS.indexOf(action)>=0,'ACTION_NOT_SUPPORTED');
     need(lastCase&&lastCase.actorRole===roleFor[action],
       'SERVER_ACTOR_ROLE_MISMATCH');
     if(action==='SUPERVISOR_SUBMIT'||action==='SUPERVISOR_SUPPLEMENT')
       need(data&&data.handoverConfirmed===true&&!!trim(data.handoverNote),
         'SUPERVISOR_HANDOVER_REQUIRED');
     if(action==='EXECUTIVE_RETURN'||action==='EXECUTIVE_REJECT')
       need(data&&!!trim(data.reason),'EXECUTIVE_REASON_REQUIRED');
     if(action==='EXECUTIVE_APPROVE')
       need(lastCase.authorityEligible===true&&lastCase.handoverVerified===true,
         'EXECUTIVE_AUTHORITY_NOT_CERTIFIED');
     need(Number.isInteger(lastCase.version)&&lastCase.version>=1,
       'CASE_EXPECTED_VERSION_REQUIRED');
     need(!!trim(lastCase.groupId)&&!!trim(lastCase.sourceEpoch),
       'GROUP_SOURCE_EPOCH_REQUIRED');
   }
   async function submit(action,data){
     need(!active,'DOUBLE_SUBMIT_LOCKED');need(!uncertain,'UNKNOWN_ACK_NO_RETRY');
     validateAction(action,data||{});
     active=true;
     var key=trim(clock());need(key&&key.length>=12,'IDEMPOTENCY_KEY');
     lastRequestId=key;
     try{
       assertActive();
       var result=await rpc('longLeaveExecV1Action',{
         leaveId:lastCase.leaveId,action:action,
         expectedVersion:lastCase.version,groupId:lastCase.groupId,
         sourceEpoch:lastCase.sourceEpoch,idempotencyKey:key,
         payload:data||{}
       });
       need(result&&result.transactionReceipt&&
         result.transactionReceipt.phase==='COMMITTED'&&
         result.transactionReceipt.outboxReleased===false&&
         result.transactionReceipt.requestId===key,
         'INCOMPLETE_COMMIT_RECEIPT');
       return result;
     }catch(e){
       uncertain=true; // Never auto-retry unknown API acknowledgements.
       throw e;
     }finally{active=false;}
   }
   function render(el,r,lang){
     need(el&&typeof el.innerHTML==='string','MOUNT_TARGET_REQUIRED');
     var c=r.case,role=c.actorRole;
     if(role==='EMPLOYEE')el.innerHTML=ui.employeeHtml(Object.assign({},c,{g7Envelope:r}),lang);
     else if(role==='SUPERVISOR')el.innerHTML=ui.supervisorHtml(c,lang);
     else el.innerHTML=ui.executiveHtml(c,lang);
     if(role==='EMPLOYEE')return;
     var buttons=Array.from(el.querySelectorAll('[data-llex-action]'));
     buttons.forEach(function(b){
       b.addEventListener('click',async function(){
         var action=b.getAttribute('data-llex-action');
         var note=el.querySelector('[data-llex="handoverNote"]'),
           box=el.querySelector('[data-llex="handover"]'),
           reason=el.querySelector('[data-llex="executiveReason"]'),
           state=el.querySelector('[data-llex="status"]');
         var payload=role==='SUPERVISOR'?
           {handoverConfirmed:!!(box&&box.checked),handoverNote:note?note.value:''}:
           {reason:reason?reason.value:''};
         // Prevent repeated client-side clicks until real server receipt.
         if(active||uncertain)return;
         buttons.forEach(x=>x.disabled=true);
         if(state)state.textContent='處理中…';
         try{await submit(action,payload);
           if(state)state.textContent='已取得交易憑證';
         }catch(e){
           if(state)state.textContent='處理結果待查核，請勿重複送出：'+lastRequestId;
         }finally{
           if(!uncertain)buttons.forEach(x=>x.disabled=false);
         }
       });
     });
   }
   async function mount(el,leaveId,lang){
     if(RELEASE_MODE!=='AUTHORIZED_RELEASE'&&opts.syntheticOnly!==true)
       hold('OFFICIAL_LIFF_V153_NOT_MOUNTED');
     var r=await read(leaveId);
     render(el,r,lang);
     return {mounted:true,caseId:trim(leaveId),role:r.case.actorRole};
   }
   // Q42=A HR worklist is read-only and is never registered as a live V153 route.
   // Server must enforce HR role, session and exact COMMITTED-readback scope.
   async function readHrWorklist(){
     need(!active&&!uncertain,'HR_WORKLIST_NOT_AVAILABLE_DURING_UNCERTAIN_TX');
     var st=await status();
     need(st.featureEnabled&&st.providerBound,'BACKEND_FEATURE_NOT_ACTIVE');
     assertActive();
     var r=await rpc('longLeaveExecV1HrPendingRead',{});
     need(r&&r.g7ServerProjection==='AUTHORITATIVE_COMMIT_AWARE'&&
       r.serverScopeApplied===true&&r.readTier==='FORMAL_PROVIDER_VERIFIED'&&
       r.identity&&r.identity.serverVerified===true&&
       r.identity.role==='HR'&&r.identity.hrReconciliationAllowed===true&&
       Array.isArray(r.items),'HR_WORKLIST_NOT_SERVER_AUTHORIZED');
     need(typeof ui.q42Verified==='function'&&
       r.items.every(function(e){return ui.q42Verified(e);}),
       'HR_WORKLIST_HAS_UNVERIFIED_COMMIT');
     return r;
   }
   async function mountHrWorklist(el,lang){
     if(RELEASE_MODE!=='AUTHORIZED_RELEASE'&&opts.syntheticOnly!==true)
       hold('OFFICIAL_LIFF_V153_NOT_MOUNTED');
     need(el&&typeof el.innerHTML==='string','MOUNT_TARGET_REQUIRED');
     need(typeof ui.hrWorklistHtml==='function','HR_WORKLIST_UI_NOT_BOUND');
     var r=await readHrWorklist();
     el.innerHTML=ui.hrWorklistHtml(r,lang); // No action buttons or external dispatch.
     return {mounted:true,role:'HR',count:r.items.length,readonly:true};
   }
   return {status:status,read:read,submit:submit,mount:mount,readHrWorklist:readHrWorklist,mountHrWorklist:mountHrWorklist,
     inspect:function(){return {mode:RELEASE_MODE,active:active,
       uncertain:uncertain,lastRequestId:lastRequestId};}};
 }
 var api={mode:RELEASE_MODE,createAdapter:createAdapter,actions:ACTIONS.slice()};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ABIS_G7_V174_RELEASE_CLIENT_=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{}));