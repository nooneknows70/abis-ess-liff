'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../staging/hf2/phase2-liff-entry.html'),'utf8');
const lastScript=html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
assert.ok(lastScript,'entry has a script');

function render({search='?route=attendance&rt='+'a'.repeat(32),liffId='1234567890-TestStage',backUrl='https://script.google.com/macros/s/AKfTestStage123456/exec',loggedIn=true}={}){
 const script=lastScript[1].replace('__HF2_TEST_LIFF_ID__',liffId)
   .replace('__HF2_TEST_BACKEND_EXEC_URL__',backUrl);
 const rendered={submitted:[],status:{textContent:'',style:{}},appended:[],inits:0,logins:0};
 const document={
   body:{appendChild:el=>rendered.appended.push(el)},
   getElementById:id=>id==='status'?rendered.status:null,
   createElement:tag=>{
     const el={tag,children:[],style:{},appendChild(child){this.children.push(child);}};
     if(tag==='form')el.submit=()=>rendered.submitted.push(el);
     return el;
   }
 };
 const sandbox={
   document,location:{search,href:'https://stage.example.test/hf2/'+search},
   URL,URLSearchParams,
   liff:{
     async init({liffId}) {rendered.inits++;assert.ok(liffId);},
     isLoggedIn(){return loggedIn;},
     login(){rendered.logins++;},
     getIDToken(){return 'SYNTHETIC_JWT_ONLY';}
   }
 };
 vm.runInNewContext(script,sandbox);
 return new Promise(resolve=>setImmediate(()=>resolve(rendered)));
}
function dataOf(form){return Object.fromEntries(form.children.map(x=>[x.name,x.value]));}

test('new staging LIFF and staging Apps Script URL submit only to test backend',async()=>{
 const out=await render();
 assert.equal(out.inits,1);
 assert.equal(out.submitted.length,1);
 const form=out.submitted[0];
 assert.equal(form.method,'POST');
 assert.equal(form.action,'https://script.google.com/macros/s/AKfTestStage123456/exec');
 assert.equal(form.target,'_self');
 const fields=dataOf(form);
 assert.equal(fields.mode,'hf2p2auth');
 assert.equal(fields.routeToken,'a'.repeat(32));
 assert.ok(fields.idToken);
 assert.ok(!out.status.textContent.includes(fields.idToken));
});

test('liff.state route token is preserved after LINE redirects',async()=>{
 const state=encodeURIComponent('/?route=attendance&rt='+'c'.repeat(32));
 const out=await render({search:'?liff.state='+state});
 assert.equal(dataOf(out.submitted[0]).routeToken,'c'.repeat(32));
});

test('no test credentials or untrusted backend URL means no POST',async()=>{
 const examples=[
  {liffId:'2011584842-AmO1bbHY'},
  {backUrl:'https://evil.example/api'},
  {backUrl:'https://script.google.com/macros/s/AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR/exec'},
  {backUrl:'http://script.google.com/macros/s/AKfTestStage123456/exec'}
 ];
 for(const props of examples){
  const out=await render(props);
  assert.equal(out.submitted.length,0);
  assert.match(out.status.textContent,/STAGING_CONFIG_INVALID/);
 }
});

test('non-opaque rt is suppressed, never forwarded to test backend',async()=>{
 const out=await render({search:'?route=attendance&rt=INVALID%20VALUE'});
 assert.equal(dataOf(out.submitted[0]).routeToken,'');
});

test('not-yet-authenticated LIFF user triggers login before any form POST',async()=>{
 const out=await render({loggedIn:false});
 assert.equal(out.logins,1);
 assert.equal(out.submitted.length,0);
});

test('static entry never targets production by default or leaks claims to Backend',()=>{
 assert.ok(html.includes('__HF2_TEST_LIFF_ID__'));
 assert.ok(html.includes('__HF2_TEST_BACKEND_EXEC_URL__'));
 assert.ok(!html.includes('liff.getDecodedIDToken'));
 assert.ok(!html.includes('liff.getProfile'));
 assert.ok(!html.includes('localStorage'));
 assert.ok(!html.includes('console.log'));
});
