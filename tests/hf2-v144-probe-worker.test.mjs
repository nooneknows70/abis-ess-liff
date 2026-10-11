import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import probe,{
  parseIntent,mergeIntents,launcherHtml,bridgeHtml,PROBE_VERSION,
  OFFICIAL_LIFF_ID,TEST_LIFF_ID,OFFICIAL_BACKEND_URL
} from '../staging/hf2/v144-a09701-probe-worker.mjs';

const site='https://abis-hf2-a09701-v144-probe.mike-3eb.workers.dev/hf2/';
const token='1'.repeat(64);
const direct='?route=attendance&rt='+token;
const wrap=(state)=>'?liff.state='+encodeURIComponent(state);
const parsed=(search)=>parseIntent(search,site+search);

test('real route contract accepts official raw R2 opaque token without decoding it',()=>{
 const a=parsed(direct);
 assert.deepEqual(a,{valid:true,code:'OK',rt:token,route:'attendance'});
 assert.equal(OFFICIAL_LIFF_ID,'2011584842-AmO1bbHY');
 assert.equal(TEST_LIFF_ID,'2011584842-qk2mOOxp');
 assert.match(OFFICIAL_BACKEND_URL,/^https:\/\/script\.google\.com\/macros\/s\/AKfycbxWY.*\/exec$/);
 assert.ok(OFFICIAL_BACKEND_URL.includes('H-EU331X0kiweR'));
});

test('LINE liff.state wrapper transports route and rt even if top-level query has none',()=>{
 assert.equal(parsed(wrap('/?route=attendance&rt='+token)).rt,token);
 assert.equal(parsed(wrap('/hf2/?rt='+token+'&route=attendance')).route,'attendance');
 assert.equal(parsed(wrap('?rt='+token+'&route=attendance')).rt,token);
});

test('reject duplicate, conflicting, invalid and blank raw route tokens',()=>{
 const samples=[
  '?route=attendance&rt=', '?route=attendance&rt=bad%20token',
  '?route=attendance&rt='+token+'&rt='+token,
  direct+'&liff.state='+encodeURIComponent('/?rt=2'.repeat(1)+'&route=attendance'),
  '?route=attendance&rt='+('x'.repeat(257)),
  '?route=home&rt='+token
 ];
 for(const s of samples) assert.equal(parsed(s).valid,false,s.slice(0,65));
 assert.equal(parsed('?route=attendance&rt='+token+'&route=home').valid,false);
});

test('reject unsafe, cross-site, malformed or protocol-relative state',()=>{
 const states=[
  '//evil.example/?route=attendance&rt='+token,
  'https://evil.example/?route=attendance&rt='+token,
  '/\\evil.example/?rt='+token,
  'javascript:alert(1)',
  ''
 ];
 for(const state of states) assert.equal(parsed(wrap(state)).valid,false);
});

test('initial valid route survives LIFF SDK clearing query but not conflicting token swap',()=>{
 const first=parsed(direct);
 const second=parsed('');
 assert.deepEqual(mergeIntents(first,second),first);
 assert.equal(mergeIntents(first,parsed('?route=attendance&rt='+('2'.repeat(64)))).code,'ROUTE_CHANGED');
});

test('Worker only serves static launcher / bridge / health; never proxies or accepts POST',async()=>{
 const req=(pathname,method='GET')=>new Request('https://worker.example'+pathname,{method});
 const health=await probe.fetch(req('/healthz'));const h=await health.json();
 assert.equal(health.status,200);assert.equal(h.ok,true);
 assert.equal(h.usesPhase2aSyntheticBackend,false);
 assert.equal(h.ownsOrReadsProductionData,false);
 assert.equal(h.storesCredentialsOrTokens,false);
 assert.equal(h.firstPartyProductionChangesPerformed,false);
 assert.equal(h.officialBackendVersion,144);
 assert.equal(h.version,PROBE_VERSION);
 assert.equal((await probe.fetch(req('/'))).status,200);
 assert.equal((await probe.fetch(req('/hf2/'))).status,200);
 assert.equal((await probe.fetch(req('/bad/path'))).status,404);
 assert.equal((await probe.fetch(req('/hf2/','POST'))).status,405);
});

test('Worker responses avoid cache, referrer and token echo in health response',async()=>{
 const resp=await probe.fetch(new Request('https://worker.example/healthz?rt='+token));
 assert.equal(resp.headers.get('Referrer-Policy'),'no-referrer');
 assert.match(resp.headers.get('Cache-Control'),/no-store/);
 assert.match(resp.headers.get('X-Robots-Tag'),/noindex/);
 assert.ok(!(await resp.text()).includes(token));
});

test('manual launch page transforms only original LIFF links locally, without backend form',()=>{
 const s=launcherHtml();
 assert.match(s,/sourceLink/);
 assert.match(s,/liff\.line\.me/);
 assert.ok(s.includes(OFFICIAL_LIFF_ID));
 assert.ok(s.includes(TEST_LIFF_ID));
 assert.ok(!s.includes(OFFICIAL_BACKEND_URL));
 assert.ok(!s.includes('fetch('));
 assert.ok(!s.includes('localStorage.'));
});

test('bridge references exact official immutable @144 and includes no synthetic Phase2A endpoint',()=>{
 const s=bridgeHtml();
 assert.ok(s.includes(OFFICIAL_BACKEND_URL));
 assert.ok(!s.includes('AKfycbzvWV5n4ouINYgN5oLAau-uetJQJqVkVJ3lf1u-Ibz33A1AbIVUkaj029JFDpOLlyUA'));
 assert.match(s,/routeToken:ctx\.rt/);
 assert.match(s,/form\.method="POST"/);
 assert.match(s,/form\.action=BACKEND/);
 assert.match(s,/bootRoute:"attendance"/);
 assert.match(s,/mode:"liffauth"/);
 assert.ok(!s.includes('console.log('));
 assert.ok(!s.includes('fetch(idToken'));
});

function dom(tag){
 return {
   tagName:tag, children:[], appendChild(item){this.children.push(item);},
   setAttribute(){},
   value:'', name:'', type:'',
 };
}
function runBridge(query,options={}){
 const full=site+query;
 let loc={search:query,href:full,origin:new URL(full).origin,pathname:'/hf2/'};
 const forms=[];const redirects=[];
 const status={textContent:'',className:''};
 const document={
  body:{appendChild:element=>{forms.push(element)}},
  getElementById:id=>id==='status'?status:null,
  createElement:tag=>{
    const el=dom(tag);
    if(tag==='form')el.submit=()=>{el.submitted=true};
    return el;
  }
 };
 const html=bridgeHtml();
 const script=html.match(/<script id="bridge-main">([\s\S]*?)<\/script>/)[1];
 const liff={
   async init(){if(options.clearQueryAfterInit){loc.search='';loc.href=site}},
   isLoggedIn:()=>options.loggedIn!==false,
   login:({redirectUri})=>redirects.push(redirectUri),
   getIDToken:()=>options.noIdToken?'':'FAKE_ID_TOKEN_ONLY',
   getAccessToken:()=> 'FAKE_ACCESS_TOKEN_ONLY'
 };
 const sandbox=vm.createContext({document,liff,URL,URLSearchParams,location:loc,console:{log(){throw new Error('No logging')}},window:{location:{assign(){}}}});
 new vm.Script(script).runInContext(sandbox,{timeout:1000});
 return {status,forms,redirects};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('real bridge calls official liffauth with original opaque rt, never homepage',async()=>{
 const h=runBridge(direct,{clearQueryAfterInit:true});
 await flush();
 assert.equal(h.forms.length,1);
 const f=h.forms[0];assert.equal(f.action,OFFICIAL_BACKEND_URL);assert.equal(f.submitted,true);
 const vals=Object.fromEntries(f.children.map(c=>[c.name,c.value]));
 assert.equal(vals.mode,'liffauth');
 assert.equal(vals.bootRoute,'attendance');
 assert.equal(vals.routeToken,token);
 assert.equal(vals.idToken,'FAKE_ID_TOKEN_ONLY');
 assert.equal(vals.bridgeVersion,'HF2_A09701_V144_PROBE_RC1');
 assert.equal(h.redirects.length,0);
});

test('unauthenticated test-LIFF login redirects to same host and preserves validated rt',async()=>{
 const h=runBridge(direct,{loggedIn:false});
 await flush();
 assert.equal(h.forms.length,0);
 assert.equal(h.redirects.length,1);
 const target=new URL(h.redirects[0]);
 assert.equal(target.origin,new URL(site).origin);
 assert.equal(target.pathname,'/hf2/');
 assert.equal(target.searchParams.get('rt'),token);
});

test('bridge missing raw rt shows durable error instead of making a homepage POST',async()=>{
 const h=runBridge('?route=attendance');
 await flush();
 assert.equal(h.forms.length,0);
 assert.match(h.status.textContent,/連結無法驗證/);
 assert.equal(h.redirects.length,0);
});
