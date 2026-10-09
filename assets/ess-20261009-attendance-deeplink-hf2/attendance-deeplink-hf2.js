/* ABIS ESS Attendance Deep Link HF2 - isolated candidate; not published.
 * Preserves the HF8 boot sequence, server-authorized routeContext, existing
 * Session validation and read-only attendance APIs. No token/PII logging.
 */
(function () {
  'use strict';

  var boot = typeof ABIS_SERVER_BOOT === 'object' && ABIS_SERVER_BOOT || {};
  var ctx = boot.routeContext;
  if (!ctx || !ctx.routeKind) return;

  var kind = String(ctx.routeKind || '').toUpperCase();
  var kinds = {
    EMPLOYEE_CORRECTION: true,
    EMPLOYEE_FOLLOWUP: true,
    MANAGEMENT_SITE_DAY: true,
    MANAGEMENT_CASE: true
  };
  if (!kinds[kind]) return;

  var originalApply = typeof p5a25R29ApplyBootRouteContext_ === 'function'
    ? p5a25R29ApplyBootRouteContext_ : null;
  var originalCall = typeof call === 'function' ? call : null;
  var originalEnter = typeof enterApp === 'function' ? enterApp : null;
  var originalBootRoute = typeof p5rmApplyBootRoute_ === 'function'
    ? p5rmApplyBootRoute_ : null;

  var state = {
    phase: 'WAITING', kind: kind, attempts: 0, generation: 0,
    inFlight: false, apiStatus: 'NOT_STARTED', apiErrorCode: '',
    failureCode: '', activePromise: null
  };
  var timer = 0;

  function targetVisible() {
    var id = kind === 'MANAGEMENT_SITE_DAY' ? 'r2SiteDetailOverlay'
      : kind === 'EMPLOYEE_FOLLOWUP' ? 'r2FollowupOverlay'
      : kind === 'MANAGEMENT_CASE' ? 'inbox' : 'attendance';
    var el = document.getElementById(id);
    return !!(el && (!el.classList || !el.classList.contains('hide')));
  }

  function classifyError(err) {
    var msg = String(err && err.message || err || '');
    if (/登入已逾時|session.*expir|登入已失效|LINE 綁定已失效/i.test(msg)) return 'SESSION_EXPIRED';
    if (/無權限|not authorized|permission|forbidden/i.test(msg)) return 'PERMISSION_DENIED';
    if (/timeout|network|transport|failed to fetch/i.test(msg)) return 'TRANSPORT';
    return 'API_ERROR';
  }

  function panel(phase) {
    state.phase = phase;
    if (!document.body) return;
    var el = document.getElementById('abisDeeplinkGateHF2');
    if (phase === 'DONE') {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('section');
      el.id = 'abisDeeplinkGateHF2';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText =
        'position:fixed;inset:auto 12px 16px;z-index:10010;max-width:560px;' +
        'margin:auto;padding:18px;border:1px solid #bcd1e4;border-radius:16px;' +
        'background:#fff;color:#17324d;box-shadow:0 12px 40px #16283d35;' +
        'font:15px/1.55 system-ui,sans-serif';
      document.body.appendChild(el);
    }
    el.replaceChildren();
    var title = document.createElement('strong');
    title.textContent = phase === 'FAILED' ? '出勤連結無法開啟'
      : phase === 'WAITING' ? '準備開啟出勤頁面' : '正在開啟出勤頁面';
    el.appendChild(title);
    var message = document.createElement('p');
    message.style.margin = '8px 0';
    message.textContent = phase === 'FAILED'
      ? '未能開啟指定出勤畫面。可重新嘗試；若持續失敗，請提供下方診斷代碼給管理員。'
      : '正在透過既有登入授權與出勤 API 載入內容。';
    el.appendChild(message);
    if (phase === 'FAILED') {
      var info = document.createElement('small');
      info.style.display = 'block';
      info.textContent = '診斷：' + kind + ' / ' + state.failureCode +
        ' / API=' + state.apiStatus +
        (state.apiErrorCode ? ':' + state.apiErrorCode : '');
      el.appendChild(info);
      if (state.attempts < 3 && originalApply) {
        var retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = '重新嘗試';
        retry.style.cssText =
          'display:block;margin-top:10px;padding:8px 16px;' +
          'border:0;border-radius:8px;background:#165baf;color:#fff';
        retry.addEventListener('click', function () { applyRoute(); });
        el.appendChild(retry);
      }
    }
  }

  function finish(gen, result) {
    if (gen !== state.generation || !state.inFlight) return;
    if (timer) { clearTimeout(timer); timer = 0; }
    state.inFlight = false;
    state.activePromise = null;
    if (result === true && targetVisible()) {
      state.failureCode = '';
      panel('DONE');
      return;
    }
    state.failureCode = state.apiStatus === 'FAILED' ? 'API_FAILED'
      : state.apiStatus === 'NOT_STARTED' ? 'ROUTE_NOT_DISPATCHED'
      : result === true ? 'TARGET_NOT_VISIBLE' : 'ROUTE_FAILED';
    panel('FAILED');
  }

  function applyRoute() {
    if (state.inFlight) return state.activePromise;
    if (!originalApply) {
      state.failureCode = 'MISSING_ROUTE_HANDLER';
      panel('FAILED');
      return Promise.resolve(false);
    }
    if (state.attempts >= 3) {
      state.failureCode = 'MAX_RETRIES';
      panel('FAILED');
      return Promise.resolve(false);
    }
    state.attempts++;
    state.generation++;
    state.inFlight = true;
    state.apiStatus = 'NOT_STARTED';
    state.apiErrorCode = '';
    state.failureCode = '';
    var gen = state.generation;
    panel('LOADING');
    timer = setTimeout(function () {
      if (gen !== state.generation || !state.inFlight) return;
      state.inFlight = false;
      state.activePromise = null;
      state.failureCode = 'ROUTE_TIMEOUT';
      panel('FAILED');
    }, 45000);
    var args = arguments;
    state.activePromise = Promise.resolve()
      .then(function () { return originalApply.apply(null, args); })
      .then(function (result) { finish(gen, result); return result; })
      .catch(function (err) {
        state.apiErrorCode = classifyError(err);
        finish(gen, false);
        return false;
      });
    return state.activePromise;
  }

  // Observe only read-only deep-link RPCs and preserve the original call behavior.
  // Forward server-authorized SourceEventKey to the XINDIAN site detail API.
  if (originalCall) {
    call = function (action, payload) {
      var tracked =
        (kind === 'MANAGEMENT_SITE_DAY' && action === 'attendanceUnifiedSiteDetail') ||
        (kind === 'EMPLOYEE_FOLLOWUP' && action === 'attendanceUnifiedMyFollowupR2Live');
      if (!tracked) return originalCall(action, payload);
      var request = payload || {};
      if (kind === 'MANAGEMENT_SITE_DAY' && ctx.sourceEventKey &&
          String(request.scopeCode || '') === String(ctx.scopeValue || '') &&
          String(request.date || '') === String(ctx.date || '')) {
        request = Object.assign({}, request, {
          sourceEventKey: String(ctx.sourceEventKey)
        });
      }
      state.apiStatus = 'PENDING';
      try {
        return Promise.resolve(originalCall(action, request)).then(
          function (data) { state.apiStatus = 'SUCCESS'; return data; },
          function (err) {
            state.apiStatus = 'FAILED';
            state.apiErrorCode = classifyError(err);
            throw err;
          }
        );
      } catch (err) {
        state.apiStatus = 'FAILED';
        state.apiErrorCode = classifyError(err);
        throw err;
      }
    };
  }

  // In HF8, invoking p5rmApplyBootRoute_ a second time unconditionally calls
  // showHome(). A repeated enterApp must not erase an authorized deep link.
  // Normal non-deep-link routes are not touched by this candidate.
  if (originalBootRoute) {
    p5rmApplyBootRoute_ = function () {
      if (state.attempts > 0) return;
      return originalBootRoute.apply(this, arguments);
    };
  }

  // HF8 boot remains authoritative: only instrument the existing context route.
  if (originalApply) {
    p5a25R29ApplyBootRouteContext_ = function () {
      return applyRoute.apply(this, arguments);
    };
  }
  if (originalEnter) {
    enterApp = function () {
      var result;
      try {
        result = originalEnter.apply(this, arguments);
      } catch (err) {
        state.failureCode = 'ENTER_APP_EXCEPTION';
        panel('FAILED');
        throw err;
      }
      if (state.attempts === 0) {
        state.failureCode = 'BOOT_ROUTE_SKIPPED';
        panel('FAILED');
      }
      return result;
    };
  }

  window.ABIS_ATTENDANCE_DEEPLINK_HF2 = {
    version: 'HF2_CANDIDATE_20261009_RC2',
    status: function () {
      return {
        phase: state.phase, kind: state.kind, attempts: state.attempts,
        apiStatus: state.apiStatus, apiErrorCode: state.apiErrorCode,
        failureCode: state.failureCode
      };
    }
  };
  panel('WAITING');
})();
