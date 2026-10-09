/* ABIS HF2 P2A — optional isolated Cloudflare Worker (NOT deployed).
 * No ABIS session, attendance, payroll, production URL or LINE secrets.
 * Environment variables are non-secret staging LIFF ID and staging /exec.
 */
const HTML_TEMPLATE = "<!doctype html>\n<html lang=\"zh-Hant\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<meta name=\"referrer\" content=\"no-referrer\">\n<meta http-equiv=\"Cache-Control\" content=\"no-store\">\n<title>ABIS HF2｜LINE 隔離驗證</title>\n<style>\nbody{font:16px/1.6 system-ui,sans-serif;background:#eef4fa;color:#172e44;margin:0;padding:25px}\nmain{max-width:490px;margin:32px auto;padding:22px;border-radius:16px;background:#fff;border:1px solid #c9dae8}\nsmall{color:#667c8e}#status{white-space:pre-wrap}button{padding:11px 16px;border:0;border-radius:10px;color:white;background:#1764ac}\n</style>\n<script src=\"https://static.line-scdn.net/liff/edge/2/sdk.js\"></script>\n</head>\n<body>\n<main>\n<h2>ABIS HF2｜LINE 隔離測試</h2>\n<p>此站僅驗證 LINE 身分及測試連結，不讀取正式員工、出勤或薪資資料。</p>\n<p id=\"status\" role=\"status\" aria-live=\"polite\">準備 LINE 測試驗證…</p>\n<small>請勿輸入正式帳號密碼；本測試只讀取 LINE 核發的 ID Token，直接送至獨立測試 Backend 進行驗證，不顯示或儲存 Token。</small>\n</main>\n<script>\n(function(){\n'use strict';\n// Configure only for a NEW staging LIFF app + NEW isolated Apps Script /exec.\n// These are invalid placeholders until explicitly set during staging deployment.\nconst cfg=Object.freeze({\n  liffId:'__HF2_TEST_LIFF_ID__',\n  stageBackendUrl:'__HF2_TEST_BACKEND_EXEC_URL__',\n  version:'HF2_P2A_TEST_LIFF_ENTRY_20261010'\n});\nconst PROD_LIFF_ID='2011584842-AmO1bbHY';\nconst PROD_BACKEND_DEPLOYMENT='AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR';\nfunction fail(code){\n const e=document.getElementById('status');\n e.textContent='測試入口停止：'+code+'。請檢查測試 LIFF 與測試 Backend 設定。';\n e.style.color='#9b1c32';\n}\nfunction validConfig(){\n const url=new URL(cfg.stageBackendUrl);\n const appId=/^[0-9]{8,14}-[A-Za-z0-9]+$/.test(cfg.liffId);\n const correctHost=url.protocol==='https:'&&url.hostname==='script.google.com';\n const validPath=/^\\/(?:macros\\/s|a\\/macros\\/[^/]+\\/s)\\/[A-Za-z0-9_-]+\\/exec$/.test(url.pathname);\n return appId && cfg.liffId!==PROD_LIFF_ID && correctHost && validPath &&\n   url.pathname.indexOf(PROD_BACKEND_DEPLOYMENT)<0 && !url.search && !url.hash;\n}\nfunction readRouteToken(){\n const top=new URLSearchParams(location.search);\n const raw=top.get('liff.state')||'';\n // LINE redirects may retain a route query inside liff.state.\n const state=raw.includes('?')?raw.slice(raw.indexOf('?')+1):raw.replace(/^\\//,'').replace(/^\\?/,'');\n const inner=new URLSearchParams(state);\n const candidate=String(top.get('rt')||inner.get('rt')||'').trim();\n return /^[0-9a-f]{32}$/i.test(candidate)?candidate.toLowerCase():'';\n}\nfunction submitToIsolatedBackend(idToken,routeToken){\n const form=document.createElement('form');\n form.method='POST';form.target='_self';form.action=cfg.stageBackendUrl;\n form.acceptCharset='UTF-8';form.style.display='none';\n const payload={mode:'hf2p2auth',idToken:idToken,routeToken:routeToken,\n   bridgeVersion:cfg.version};\n Object.keys(payload).forEach(function(k){\n   const field=document.createElement('input');field.type='hidden';\n   field.name=k;field.value=payload[k];form.appendChild(field);\n });\n document.body.appendChild(form);\n document.getElementById('status').textContent='LINE 已完成初始化，正在由獨立測試 Backend 驗證…';\n form.submit();\n}\nasync function main(){\n try {\n   if(!validConfig())return fail('STAGING_CONFIG_INVALID');\n   if(typeof liff==='undefined')return fail('LIFF_SDK_UNAVAILABLE');\n   await liff.init({liffId:cfg.liffId,withLoginOnExternalBrowser:true});\n   if(!liff.isLoggedIn()){liff.login({redirectUri:location.href});return;}\n   const idToken=liff.getIDToken();\n   if(!idToken)return fail('LINE_ID_TOKEN_UNAVAILABLE');\n   // In first-time enrollment, the operator may use a staging LIFF URL without rt.\n   const rt=readRouteToken();\n   submitToIsolatedBackend(idToken,rt);\n } catch(ignore) {\n   fail('LIFF_INITIALIZATION_FAILED');\n }\n}\nmain();\n})();\n</script>\n</body>\n</html>\n";
const PROD_LIFF = "2011584842-AmO1bbHY";
const PROD_BACKEND = "AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR";
function validStageConfig(liffId, backend){
 if (!/^[0-9]{8,14}-[A-Za-z0-9]+$/.test(liffId) ||
     liffId===PROD_LIFF || liffId.split("-")[0]===PROD_LIFF.split("-")[0]) return false;
 try {
  const u=new URL(backend);
  return u.protocol==="https:"&&u.hostname==="script.google.com"&&!u.search&&!u.hash &&
    /^\/(?:macros\/s|a\/macros\/[^/]+\/s)\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname) &&
    !u.pathname.includes(PROD_BACKEND);
 }catch(ignore){return false;}
}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(request.method!=="GET"||u.pathname!=="/hf2/")return new Response("Not Found",{status:404});
  const id=String(env?.HF2_STAGE_LIFF_ID||"").trim();
  const backend=String(env?.HF2_STAGE_BACKEND_EXEC_URL||"").trim();
  if(!validStageConfig(id,backend))return new Response("HF2 STAGING NOT CONFIGURED",
    {status:503,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  const rendered=HTML_TEMPLATE.replaceAll("__HF2_TEST_LIFF_ID__",id)
    .replaceAll("__HF2_TEST_BACKEND_EXEC_URL__",backend);
  return new Response(rendered,{status:200,headers:{
   "Content-Type":"text/html; charset=utf-8",
   "Cache-Control":"no-store",
   "Referrer-Policy":"no-referrer",
   "X-Content-Type-Options":"nosniff"
  }});
 }
};
