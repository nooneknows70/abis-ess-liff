/* ABIS ESS LLEX G5: browser/server transport envelope contract for offline fixtures only.
 * No DOM, HTTP, LINE, token, live adapter, or feature activation.
 */
var ABIS_LLEX_G5_LIFF_CONTRACT_OFFLINE = (function () {
  'use strict';
  var ACTIONS = Object.freeze(['SUPERVISOR_SUBMIT','SUPERVISOR_SUPPLEMENT','EXECUTIVE_APPROVE','EXECUTIVE_RETURN','EXECUTIVE_REJECT','EMPLOYEE_CANCEL','EMPLOYEE_AMEND']);
  function deny(code) {throw new Error(code);}
  function required(x,code){if(typeof x!=='string'||!x.trim())deny(code);return x.trim();}
  function allowStatus(status) {return !!status&&status.policyVersion==='LLEX_V1'&&status.featureEnabled===true&&status.providerBound===true&&status.authorized===true;}
  function offlineUnavailable(status) {return Object.freeze({active:false,showLegacyOnly:!allowStatus(status),reason:'LLEX_G5_OFFLINE_CANDIDATE_NOT_DEPLOYABLE'});}
  function makeActionFixture(action,payload,readModel,nonce) {
    var name=required(action,'ACTION_REQUIRED');
    if(ACTIONS.indexOf(name)<0)deny('ACTION_NOT_ALLOWED');
    if(!readModel||readModel.fixtureOnly!==true||readModel.providerBound!==false)deny('LIVE_PROVIDER_INPUT_HOLD');
    if(!Array.isArray(readModel.allowedActions)||readModel.allowedActions.indexOf(name)<0)deny('ACTION_NOT_IN_SERVER_ALLOWED_SET');
    var requestId=required(nonce,'REQUEST_ID_REQUIRED');
    if(!/^G5-SYNTH-[A-Za-z0-9_-]{8,80}$/.test(requestId))deny('NON_SYNTHETIC_REQUEST_ID_HOLD');
    if(!Number.isSafeInteger(readModel.expectedVersion)||readModel.expectedVersion<1)deny('EXPECTED_VERSION_REQUIRED');
    var p={};
    if(name==='SUPERVISOR_SUBMIT'||name==='SUPERVISOR_SUPPLEMENT'){
      if(payload?.handoverConfirmed!==true||typeof payload.handoverNote!=='string'||!payload.handoverNote.trim())deny('HANDOVER_REQUIRED');
      p={handoverConfirmed:true,handoverNote:payload.handoverNote.trim()};
    } else if(name==='EXECUTIVE_RETURN'||name==='EXECUTIVE_REJECT') {
      if(typeof payload?.reason!=='string'||!payload.reason.trim())deny('REASON_REQUIRED');p={reason:payload.reason.trim()};
    } else if(name==='EXECUTIVE_APPROVE') {p={reason:typeof payload?.reason==='string'?payload.reason.trim():''};}
    else if(name==='EMPLOYEE_CANCEL') {p={reason:typeof payload?.reason==='string'?payload.reason.trim():''};}
    else deny('AMENDMENT_REQUIRES_SERVER_VALIDATED_SNAPSHOT_HOLD');
    return Object.freeze({fixtureOnly:true,providerBound:false,action:name,payload:Object.freeze(p),requestId:requestId,leaveId:required(readModel.leaveId,'LEAVE_ID_REQUIRED'),expectedVersion:readModel.expectedVersion,groupId:required(readModel.groupId,'GROUP_ID_REQUIRED'),sourceEpoch:required(readModel.sourceEpoch,'SOURCE_EPOCH_REQUIRED'),groupHash:required(readModel.groupHash,'GROUP_HASH_REQUIRED'),readyForProviderMutation:false});
  }
  function roleView(snapshot,role) {
    if(!snapshot||snapshot.fixtureOnly!==true)deny('SYNTHETIC_VIEW_REQUIRED');
    if(role==='employee')return Object.freeze({status:snapshot.status,effectiveApprovalExists:snapshot.effectiveApprovalExists===true,amendmentOutcome:snapshot.amendmentOutcome||null});
    if(role==='supervisor'||role==='executive'){
      if(snapshot.viewRole!==role||snapshot.authorized!==true)deny('VIEW_SCOPE_DENIED');
      return Object.freeze({status:snapshot.status,originalReason:snapshot.originalReason||'',handoverNote:snapshot.handoverNote||'',proxyStatus:snapshot.proxyStatus||'',history:Array.isArray(snapshot.history)?snapshot.history.map(e=>({type:e.type,at:e.at,to:e.to})):[]});
    }
    deny('UNKNOWN_ROLE');
  }
  return Object.freeze({VERSION:'ABIS_LLEX_G5_LIFF_OFFLINE_V1',offlineUnavailable:offlineUnavailable,makeActionFixture:makeActionFixture,roleView:roleView});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ABIS_LLEX_G5_LIFF_CONTRACT_OFFLINE;
