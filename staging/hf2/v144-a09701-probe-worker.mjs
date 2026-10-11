/**
 * ABIS HF2 A09701 @144 real-line canary: ISOLATED LIFF HOST ONLY.
 *
 * This Cloudflare Worker does not proxy production, touch official
 * credentials, read attendance or collect ID Tokens. All token verification,
 * session binding, R2 audience and site permissions remain inside official
 * immutable Apps Script @144. Never change the official LIFF or Rich Menu.
 *
 * STAGING-only endpoint must be registered as the *test* LIFF app endpoint.
 * Do NOT use the earlier Phase 2A synthetic test GAS token.
 */
export const PROBE_VERSION = 'ABIS_HF2_A09701_REAL_LINE_V144_PROBE_RC1_20261011';
export const TEST_LIFF_ID = '2011584842-qk2mOOxp';
export const OFFICIAL_LIFF_ID = '2011584842-AmO1bbHY';
export const OFFICIAL_BACKEND_DEPLOYMENT = 'AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR';
export const OFFICIAL_BACKEND_URL = 'https://script.google.com/macros/s/' + OFFICIAL_BACKEND_DEPLOYMENT + '/exec';

export function parseIntent(search, href) {
  const outer = new URLSearchParams(String(search || ''));
  if (outer.getAll('liff.state').length > 1) return {valid:false, code:'STATE_DUPLICATED'};
  let inner = null;
  if (outer.has('liff.state')) {
    const state = String(outer.get('liff.state') || '');
    if (!(/^(?:\/(?!\/)|\?)/.test(state)) || state.includes('\\')) {
      return {valid:false, code:'STATE_UNSAFE'};
    }
    try {
      const base = new URL(String(href));
      const stateURL = new URL(state, base.origin + base.pathname);
      if (stateURL.origin !== base.origin) return {valid:false, code:'STATE_CROSS_ORIGIN'};
      inner = stateURL.searchParams;
    } catch (ignore) {
      return {valid:false, code:'STATE_INVALID'};
    }
  }
  for (const field of ['rt','route']) {
    const o = outer.getAll(field), i = inner ? inner.getAll(field) : [];
    if (o.length>1 || i.length>1 || (o.length && i.length && o[0]!==i[0])) {
      return {valid:false, code:'ROUTE_CONFLICT'};
    }
  }
  const r = outer.has('rt')?outer.get('rt'):inner?inner.get('rt'):'';
  const route = outer.has('route')?outer.get('route'):inner?inner.get('route'):'';
  if (!/^[A-Za-z0-9._~-]{1,256}$/.test(String(r || ''))) {
    return {valid:false, code:'RT_MISSING_OR_INVALID'};
  }
  if (String(route||'').toLowerCase()!=='attendance') {
    return {valid:false, code:'ROUTE_NOT_ATTENDANCE'};
  }
  return {valid:true, code:'OK', rt:String(r), route:'attendance'};
}

export function mergeIntents(initial,current) {
  if (initial.valid && current.valid && initial.rt!==current.rt) {
    return {valid:false,code:'ROUTE_CHANGED'};
  }
  if (initial.valid) return initial;
  if (current.valid) return current;
  // Malformed original intent must never turn into a successful HOME session.
  return current.code==='RT_MISSING_OR_INVALID'?initial:current;
}

function htmlShell(title,content,script='') {
  return '<!doctype html><html lang="zh-Hant"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<meta name="referrer" content="no-referrer">' +
    '<title>'+title+'</title>' +
    '<style>*{box-sizing:border-box}body{font:16px/1.55 system-ui,"Noto Sans TC",sans-serif;background:#f2f5f9;color:#213247;margin:0;padding:20px}main{max-width:500px;margin:28px auto;padding:25px;background:#fff;border:1px solid #dae3ec;border-radius:14px}h1{font-size:21px;margin:0 0 12px}.hint{color:#526778;font-size:14px}label{display:block;margin:16px 0 7px;font-weight:600}textarea{width:100%;min-height:94px;border:1px solid #97a9b9;border-radius:9px;padding:11px;resize:vertical}button{border:0;border-radius:9px;padding:12px 16px;background:#1b528a;color:#fff;font-size:15px}button:disabled{opacity:.5}#status{margin-top:16px;white-space:pre-wrap;color:#354b61}#status.error{color:#9c2330}small{color:#607284}</style>' +
    '</head><body><main>'+content+'</main>'+
    (script?'<script id="bridge-main">'+script+'</script>':'')+'</body></html>';
}

export function launcherHtml() {
  const content='<h1>ABIS HF2｜A09701 正式資料導頁測試</h1>' +
    '<p class="hint">此測試入口只轉換 LINE 深層連結，不傳送或儲存輸入內容。正式登入與出勤權限仍由 Apps Script @144 驗證。</p>' +
    '<label for="sourceLink">貼上 A09701 收到的原始 LINE 出勤通知連結</label>' +
    '<textarea id="sourceLink" autocomplete="off" spellcheck="false" placeholder="https://liff.line.me/..."></textarea>' +
    '<p><button type="button" id="launchBtn">在測試 LIFF 開啟</button></p>' +
    '<div id="status" role="status" aria-live="polite"></div>' +
    '<small>不要在 ChatGPT、GitHub 或截圖中提供含 rt 的網址。僅允許既有正式 LIFF 通知網址，不能使用 Phase 2A 合成 Token。</small>';
  const js='(function(){ "use strict";'+
    'const tid='+JSON.stringify(TEST_LIFF_ID)+';const oid='+JSON.stringify(OFFICIAL_LIFF_ID)+';'+
    'const btn=document.getElementById("launchBtn"),out=document.getElementById("status");'+
    'btn.addEventListener("click",()=>{try{const original=new URL(document.getElementById("sourceLink").value.trim());'+
    'if(original.protocol!=="https:"||original.hostname!=="liff.line.me"||'+
    'original.pathname.replace(/\\/+$/,"")!=="/"+oid)throw Error("SOURCE_LINK_NOT_OFFICIAL_LIFF");'+
    'if(original.searchParams.getAll("rt").length!==1||original.searchParams.getAll("route").length!==1)throw Error("SOURCE_LINK_FIELDS_REQUIRED");'+
    'const token=original.searchParams.get("rt"),route=original.searchParams.get("route");'+
    'if(!/^[A-Za-z0-9._~-]{1,256}$/.test(token)||route!=="attendance")throw Error("SOURCE_LINK_NOT_ATTENDANCE");'+
    'const url=new URL("https://liff.line.me/"+tid+"/");url.searchParams.set("route","attendance");url.searchParams.set("rt",token);'+
    'document.getElementById("sourceLink").value="";out.textContent="正在開啟獨立測試 LIFF…";'+
    'window.location.assign(url.toString());'+
    '}catch(ignore){out.className="error";out.textContent="連結不符合正式出勤通知格式；請從 LINE 複製完整原始連結。";}});'+
    '})();';
  return htmlShell('ABIS A09701 HF2 測試連結轉換器',content,js);
}

export function bridgeHtml() {
  const content='<h1>ABIS HF2｜A09701 出勤實測</h1>' +
    '<p class="hint">獨立測試 LIFF → 正式 @144 驗證 → 正式出勤明細。此測試不修改正式 LIFF、Rich Menu 或 Apps Script。</p>' +
    '<p id="status" role="status" aria-live="polite">正在檢查 LINE 登入與出勤連結…</p>' +
    '<small>不記錄 ID Token、Session Token、Route Token 或員工資料。若連結無效，會顯示錯誤，不自動回到首頁。</small>';
  const script='(async function(){ "use strict";' +
    'const parseIntent='+parseIntent.toString()+';' +
    'const mergeIntents='+mergeIntents.toString()+';' +
    'const LIFF_ID='+JSON.stringify(TEST_LIFF_ID)+';' +
    'const BACKEND='+JSON.stringify(OFFICIAL_BACKEND_URL)+';' +
    'const status=document.getElementById("status");' +
    'function fail(code){status.className="error";status.textContent="連結無法驗證（"+code+"）。請重新從 LINE 通知開啟，不會轉回首頁。";}' +
    'const first=parseIntent(location.search,location.href);' +
    'try{' +
    'if(typeof liff==="undefined"){fail("LIFF_SDK_UNAVAILABLE");return;}' +
    'await liff.init({liffId:LIFF_ID,withLoginOnExternalBrowser:true});' +
    'const now=parseIntent(location.search,location.href);const ctx=mergeIntents(first,now);' +
    'if(!ctx.valid){fail(ctx.code);return;}' +
    'if(!liff.isLoggedIn()){' +
    'const target=new URL("/hf2/",location.origin);target.searchParams.set("route","attendance");target.searchParams.set("rt",ctx.rt);' +
    'status.textContent="正在重新驗證 LINE 身分…";liff.login({redirectUri:target.toString()});return;' +
    '}' +
    'const idToken=liff.getIDToken();if(!idToken){fail("ID_TOKEN_UNAVAILABLE");return;}' +
    'const form=document.createElement("form");form.method="POST";form.target="_self";form.action=BACKEND;' +
    'const fields={mode:"liffauth",idToken:idToken,accessToken:liff.getAccessToken()||"",routeToken:ctx.rt,bootRoute:"attendance",forceFullAuth:"1",bridgeVersion:"HF2_A09701_V144_PROBE_RC1"};' +
    'for(const key of Object.keys(fields)){const field=document.createElement("input");field.type="hidden";field.name=key;field.value=fields[key];form.appendChild(field);}' +
    'document.body.appendChild(form);status.textContent="LINE 身分驗證完成，正在開啟正式出勤明細…";form.submit();' +
    '}catch(ignore){fail("LINE_OR_BRIDGE_FAILED");}' +
    '})();';
  const sdk='<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>';
  return bridgeHtmlWithSdk_(htmlShell('ABIS HF2 真實出勤 A09701 驗證',content,script),sdk);
}

function bridgeHtmlWithSdk_(html,sdk) { return html.replace('</head>',sdk+'</head>'); }

function standardHeaders(contentType){
  return {
    'Content-Type':contentType,
    'Cache-Control':'no-store, max-age=0',
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'X-Robots-Tag':'noindex, nofollow, noarchive',
    'Content-Security-Policy':
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://static.line-scdn.net; " +
      "connect-src https://*.line.me https://*.line-scdn.net https://api.line.me; " +
      "form-action https://script.google.com; base-uri 'none'; object-src 'none'"
  };
}

export default {
  async fetch(request){
    const url=new URL(request.url);
    if(request.method!=='GET') return new Response('Method Not Allowed',{status:405,headers:standardHeaders('text/plain; charset=utf-8')});
    if(url.pathname==='/healthz') {
      return new Response(JSON.stringify({
        ok:true,version:PROBE_VERSION,workerMode:'STATIC_LIFF_REAL_V144_BRIDGE',
        officialBackendVersion:144,officialBackendDeploymentSuffix:'331X0kiweR',
        usesPhase2aSyntheticBackend:false,ownsOrReadsProductionData:false,
        storesCredentialsOrTokens:false,firstPartyProductionChangesPerformed:false
      }),{status:200,headers:standardHeaders('application/json; charset=utf-8')});
    }
    if(url.pathname==='/')return new Response(launcherHtml(),{status:200,headers:standardHeaders('text/html; charset=utf-8')});
    if(url.pathname==='/hf2/'||url.pathname==='/hf2')return new Response(bridgeHtml(),{status:200,headers:standardHeaders('text/html; charset=utf-8')});
    return new Response('Not Found',{status:404,headers:standardHeaders('text/plain; charset=utf-8')});
  }
};
