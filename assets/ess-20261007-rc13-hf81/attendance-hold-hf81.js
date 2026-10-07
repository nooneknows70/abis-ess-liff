/* ============================================================================
 * ABIS ESS HF8.1 | Backend-driven Attendance Hold State
 * Version: ABIS_ESS_HF81_ATTENDANCE_HOLD_BACKEND_SSOT_20261007
 *
 * Scope:
 * - Frontend only.
 * - Reads authenticated READ_ONLY API: attendanceUnifiedHeldSites.
 * - ABIS_ESS_M72_SCOPES_[].held follows backend SSOT.
 * - Fail closed when hold status cannot be verified.
 * - No attendance / exception / correction / payroll / LINE / property writes.
 * ========================================================================== */
(function(){
  'use strict';

  const VERSION =
    'ABIS_ESS_HF81_ATTENDANCE_HOLD_BACKEND_SSOT_20261007';

  const HOLD_STATE = {
    known:false,
    syncing:false,
    lastSyncAt:'',
    heldScopeCodes:[],
    error:''
  };

  const LOCATION_TO_SCOPE = {
    '彰濱廠':'CHANGBIN',
    '新店廠':'XINDIAN',
    '辦公室':'OFFICE'
  };

  function status_(){
    return {
      ok:HOLD_STATE.known && !HOLD_STATE.error,
      version:VERSION,
      source:'BACKEND_P5A25_ATTENDANCE_BATCH_HELD_SITES',
      known:HOLD_STATE.known,
      syncing:HOLD_STATE.syncing,
      lastSyncAt:HOLD_STATE.lastSyncAt,
      heldScopeCodes:HOLD_STATE.heldScopeCodes.slice(),
      error:HOLD_STATE.error,
      failClosed:true,
      writesPerformed:0
    };
  }

  function setHint_(mode){
    if(typeof ABIS_ESS_M72_I18N_==='undefined')return;

    if(mode==='UNKNOWN'){
      ABIS_ESS_M72_I18N_.ZH.heldHint =
        '目前無法確認各廠區的出勤來源狀態；為避免誤判，已暫停載入出勤管理資料。';
      ABIS_ESS_M72_I18N_.VI.heldHint =
        'Hiện không thể xác nhận trạng thái nguồn chấm công; dữ liệu quản lý chấm công đã tạm dừng để tránh đánh giá sai.';
      ABIS_ESS_M72_I18N_.TH.heldHint =
        'ขณะนี้ไม่สามารถยืนยันสถานะแหล่งข้อมูลการลงเวลาได้ จึงหยุดโหลดข้อมูลการจัดการเวลาชั่วคราวเพื่อป้องกันการประเมินผิด';
      return;
    }

    ABIS_ESS_M72_I18N_.ZH.heldHint =
      '標示「暫停納入」的廠區目前由後端來源狀態控制，暫不納入出勤管理判定。';
    ABIS_ESS_M72_I18N_.VI.heldHint =
      'Các địa điểm được đánh dấu tạm ngưng hiện do trạng thái nguồn phía máy chủ kiểm soát và chưa được đưa vào đánh giá chấm công.';
    ABIS_ESS_M72_I18N_.TH.heldHint =
      'สถานที่ที่แสดงว่า “พักการรวมข้อมูล” ถูกควบคุมจากสถานะแหล่งข้อมูลฝั่งเซิร์ฟเวอร์ และยังไม่นำมาประเมินการลงเวลา';
  }

  function heldCodesFrom_(data){
    if(data && Array.isArray(data.heldScopeCodes)){
      return data.heldScopeCodes
        .map(function(x){return String(x||'').toUpperCase();})
        .filter(Boolean);
    }

    if(data && Array.isArray(data.heldSites)){
      return data.heldSites
        .map(function(x){return LOCATION_TO_SCOPE[String(x||'').trim()]||'';})
        .filter(Boolean);
    }

    return [];
  }

  function applyHeldCodes_(codes){
    if(typeof ABIS_ESS_M72_SCOPES_==='undefined' ||
       !Array.isArray(ABIS_ESS_M72_SCOPES_)){
      throw new Error('Attendance site scope configuration unavailable.');
    }

    const held={};
    (codes||[]).forEach(function(code){
      held[String(code||'').toUpperCase()]=true;
    });

    ABIS_ESS_M72_SCOPES_.forEach(function(scope){
      scope.held=!!held[String(scope.code||'').toUpperCase()];
    });

    HOLD_STATE.known=true;
    HOLD_STATE.error='';
    HOLD_STATE.heldScopeCodes=Object.keys(held).sort();
    HOLD_STATE.lastSyncAt=new Date().toISOString();

    if(typeof ABIS_ESS_M72_STATE_!=='undefined' && ABIS_ESS_M72_STATE_){
      const selected=String(ABIS_ESS_M72_STATE_.site||'ALL').toUpperCase();
      if(selected!=='ALL' && held[selected])ABIS_ESS_M72_STATE_.site='ALL';
    }

    setHint_('KNOWN');
  }

  function failClosed_(err){
    const msg=err&&err.message?err.message:String(err||'Unable to verify attendance hold status.');

    HOLD_STATE.known=false;
    HOLD_STATE.error=msg;
    HOLD_STATE.heldScopeCodes=[];

    if(typeof ABIS_ESS_M72_SCOPES_!=='undefined' &&
       Array.isArray(ABIS_ESS_M72_SCOPES_)){
      ABIS_ESS_M72_SCOPES_.forEach(function(scope){
        scope.held=true;
      });
    }

    setHint_('UNKNOWN');

    if(typeof ABIS_ESS_M72_STATE_!=='undefined' && ABIS_ESS_M72_STATE_){
      ABIS_ESS_M72_STATE_.loading=false;
      ABIS_ESS_M72_STATE_.loaded=true;
      ABIS_ESS_M72_STATE_.site='ALL';
      ABIS_ESS_M72_STATE_.bySite={};
      ABIS_ESS_M72_STATE_.errors=[{
        scopeCode:'HOLD_STATUS',
        scopeLabel:'來源狀態',
        error:'無法確認出勤來源狀態，已停止載入。請重新整理後再試。'
      }];
    }

    try{
      if(typeof message==='function'){
        message('無法確認出勤來源狀態，已停止載入。請重新整理後再試。','warning');
      }
    }catch(ignore){}
  }

  async function syncHeldStatus_(){
    if(HOLD_STATE.syncing)return status_();
    if(typeof call!=='function')throw new Error('ESS API client unavailable.');
    if(typeof sessionToken==='undefined' || !sessionToken){
      throw new Error('NO_SESSION');
    }

    HOLD_STATE.syncing=true;
    try{
      const data=await call('attendanceUnifiedHeldSites',{sessionToken:sessionToken});
      if(!data || data.ok===false){
        throw new Error(
          data && data.error
            ? String(data.error)
            : 'Attendance hold status API returned an invalid result.'
        );
      }

      applyHeldCodes_(heldCodesFrom_(data));
      return data;
    }finally{
      HOLD_STATE.syncing=false;
    }
  }

  if(typeof abisEssM72Load_==='function'){
    const BASE_LOAD=abisEssM72Load_;

    abisEssM72Load_=async function(triggerBtn){
      try{
        await syncHeldStatus_();
      }catch(err){
        failClosed_(err);
        if(triggerBtn && triggerBtn.isConnected && triggerBtn.disabled!==undefined){
          triggerBtn.disabled=false;
        }
        try{
          if(typeof accountPanel_!=='undefined' &&
             accountPanel_==='attendanceManagement' &&
             typeof renderMyAccount_==='function'){
            renderMyAccount_();
          }
        }catch(ignore){}
        return null;
      }

      return BASE_LOAD.apply(this,arguments);
    };
  }

  if(typeof abisEssM72ApiSmoke_==='function'){
    const BASE_SMOKE=abisEssM72ApiSmoke_;

    abisEssM72ApiSmoke_=async function(){
      try{
        await syncHeldStatus_();
      }catch(err){
        failClosed_(err);
        return {
          ok:false,
          version:VERSION,
          error:'HOLD_STATUS_UNAVAILABLE',
          detail:err&&err.message?err.message:String(err),
          holdStatus:status_(),
          writesPerformed:0
        };
      }

      const out=await BASE_SMOKE.apply(this,arguments);
      if(out && typeof out==='object'){
        out.holdStatus=status_();
        out.backendDrivenHold=true;
      }
      return out;
    };
  }

  const BASE_PREFLIGHT =
    typeof abisEssM72Preflight_==='function'
      ? abisEssM72Preflight_
      : null;

  if(BASE_PREFLIGHT){
    abisEssM72Preflight_=function(){
      const out=BASE_PREFLIGHT.apply(this,arguments);
      out.backendDrivenHold=true;
      out.holdStatus=status_();
      out.holdStatusApi='attendanceUnifiedHeldSites';
      out.ok=!!out.ok && HOLD_STATE.known && !HOLD_STATE.error;
      return out;
    };
  }

  /* Fail closed until the first authenticated backend sync completes. */
  if(typeof ABIS_ESS_M72_SCOPES_!=='undefined' &&
     Array.isArray(ABIS_ESS_M72_SCOPES_)){
    ABIS_ESS_M72_SCOPES_.forEach(function(scope){scope.held=true;});
    setHint_('UNKNOWN');
  }

  window.ABIS_ESS_HF81_HOLD = {
    version:VERSION,
    sync:syncHeldStatus_,
    status:status_
  };
})();
