/*
 * ABIS HF2 real attendance CANARY LIFF host (A09701). NO PRODUCTION RELEASE.
 * Remains 503 until explicit, independently-versioned candidate /exec configured.
 */
const TEMPLATE="<!doctype html><html lang=\"zh-Hant\"><head>\n<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<meta name=\"referrer\" content=\"no-referrer\">\n<title>ABIS HF2 A09701 真實 API Canary</title>\n<script src=\"https://static.line-scdn.net/liff/edge/2/sdk.js\"></script>\n<style>\nbody{font:16px/1.6 system-ui;background:#f2f6fb;color:#233c50;padding:20px;margin:0}\nmain{background:#fff;border:1px solid #d7e3ed;border-radius:14px;padding:24px;max-width:540px;margin:40px auto}\nh1{font-size:22px}.small{color:#516e80;font-size:13px}\n</style></head><body><main>\n<h1>ABIS HF2｜A09701 專用測試</h1>\n<p id=\"status\" role=\"status\" aria-live=\"polite\">等待測試 LINE 身分驗證…</p>\n<p class=\"small\">僅供 A09701 使用正式 R2 出勤連結讀取統計；不開放正式 ESS、打卡修改、請假送出或薪資操作。</p>\n</main>\n<script>(function(){\n'use strict';\nconst LIFF_ID='2011584842-qk2mOOxp';\nconst BACKEND='__HF2_CANARY_BACKEND_URL__';\nconst PROD_ID='AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR';\nconst P2A_ID='AKfycbzvWV5n4ouINYgN5oLAau-uetJQJqVkVJ3lf1u-Ibz33A1AbIVUkaj029JFDpOLlyUA';\nfunction status(code){document.getElementById('status').textContent=code;}\nfunction urlOK(){\n try{\n   const u=new URL(BACKEND);\n   return u.protocol==='https:'&&u.hostname==='script.google.com'&&!u.search&&!u.hash&&\n    /^\\/macros\\/s\\/[A-Za-z0-9_-]+\\/exec$/.test(u.pathname)&&\n    !u.pathname.includes(PROD_ID)&&!u.pathname.includes(P2A_ID);\n }catch(ignore){return false;}\n}\nfunction rawToken(){\n const outer=new URLSearchParams(location.search);\n const state=outer.get('liff.state')||'';\n const inner=new URLSearchParams(state.includes('?')?state.slice(state.indexOf('?')+1):state.replace(/^\\/?/,''));\n const rt=String(outer.get('rt')||inner.get('rt')||'').trim();\n return /^[0-9a-f]{64}$/i.test(rt)?rt:'';\n}\nfunction post(idToken,rt){\n const form=document.createElement('form');\n form.method='POST';form.target='_self';form.action=BACKEND;form.style.display='none';\n const fields={mode:'liffauth',idToken:idToken,routeToken:rt,bootRoute:'attendance'};\n Object.keys(fields).forEach(function(k){\n  const field=document.createElement('input');field.name=k;field.type='hidden';field.value=fields[k];\n  form.appendChild(field);\n });\n document.body.appendChild(form);\n status('LINE 已初始化，正在由獨立候選 Backend 驗證 A09701 …');\n form.submit();\n}\nasync function start(){\n try{\n  if(!urlOK())return status('CANARY_BACKEND_NOT_CONFIGURED');\n  const rt=rawToken();\n  if(!rt)return status('CANARY_ROUTE_TOKEN_REQUIRED');\n  if(typeof liff==='undefined')return status('CANARY_LIFF_SDK_UNAVAILABLE');\n  await liff.init({liffId:LIFF_ID,withLoginOnExternalBrowser:true});\n  if(!liff.isLoggedIn()){liff.login({redirectUri:location.href});return;}\n  const id=liff.getIDToken();\n  if(!id)return status('CANARY_ID_TOKEN_UNAVAILABLE');\n  post(id,rt);\n }catch(ignore){status('CANARY_LIFF_LOGIN_FAILED');}\n}\nstart();\n})();</script></body></html>";
const PROD_DEPLOYMENT='AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR';
const P2A_SYNTHETIC='AKfycbzvWV5n4ouINYgN5oLAau-uetJQJqVkVJ3lf1u-Ibz33A1AbIVUkaj029JFDpOLlyUA';
function validBackend(raw){
 try{
  const x=new URL(raw);
  return x.protocol==='https:'&&x.hostname==='script.google.com'&&!x.search&&!x.hash&&
   /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(x.pathname)&&
   !x.pathname.includes(PROD_DEPLOYMENT)&&!x.pathname.includes(P2A_SYNTHETIC);
 }catch(ignore){return false;}
}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(request.method!=='GET'||u.pathname!=='/hf2/')return new Response('Not Found',{status:404});
  const back=String(env&&env.HF2_CANARY_BACKEND_EXEC_URL||'').trim();
  if(!validBackend(back))return new Response('HF2 CANARY NOT CONFIGURED',{status:503,headers:{
   'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store',
   'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'
  }});
  const html=TEMPLATE.replaceAll('__HF2_CANARY_BACKEND_URL__',back);
  return new Response(html,{status:200,headers:{
   'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
   'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'
  }});
 }
};
