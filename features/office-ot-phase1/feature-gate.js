/**
 * ABIS Office OT P1 Q33 Draft-only LIFF candidate gate.
 * Not referenced by index.html, V153 bundles or any Production asset.
 * No LIFF login, browser storage, network, session or LINE operations here.
 */
(function (root) {
  'use strict';
  var GATE = Object.freeze({
    enabled: false,
    backendAdapterVerified: false,
    stageGateApproved: false,
    productionReleaseApproved: false,
    candidate: 'ABIS_ESS_OFFICE_OT_P1_OFFLINE_BATCH_RC1_20261026'
  });
  function tryMount(target, client, trustedBackendContext) {
    // Never mount until a different authorized release actually replaces
    // this hard-HOLD implementation and validates trusted Backend context.
    return {
      ok: false,
      hold: true,
      code: 'OFFICE_OT_P1_Q33_DRAFT_ONLY',
      mounted: false,
      backendConnected: false,
      lineSent: false
    };
  }
  var exposed = Object.freeze({config:GATE,tryMount:tryMount});
  if(root)root.ABISOfficeOTPhase1DraftGate = exposed;
  if(typeof module!=='undefined'&&module.exports)module.exports=exposed;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null));
