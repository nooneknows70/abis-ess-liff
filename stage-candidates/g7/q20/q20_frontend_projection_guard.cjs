'use strict';
/** Q20 LIFF offline guard candidate; server must enforce the barrier. */
const EXPECTED=Object.freeze(['myLeaves','approvalInbox','leaveDashboard','hrLeaveManagement','hrLeaveDetail',
'dailyApprovedLeaveSummary','managementLeaveReport','attendanceLeaveFact','taskCenter','annualBalance','lineApprovalTask','lineDailySummary']);
function receiveServerProjection(message,surface){
 if(!EXPECTED.includes(surface))throw Error('G7_Q20_HOLD_UNKNOWN_SURFACE');
 if(!message||message.mode!=='SERVER_AUTHORITY_PROJECTION_SYNTHETIC'||message.surface!==surface||
 message.serverValidated!==true||message.authoritative!==true||message.rawSheetFieldsExposed!==false||!Array.isArray(message.rows))
 throw Error('G7_Q20_HOLD_UNTRUSTED_CLIENT_PROJECTION');
 return structuredClone(message.rows);
}
function forbiddenRawSheetFallback(){throw Error('G7_Q20_HOLD_RAW_SHEET_FALLBACK_DISABLED');}
module.exports={receiveServerProjection,forbiddenRawSheetFallback,EXPECTED};
