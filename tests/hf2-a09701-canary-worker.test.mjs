import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../staging/hf2/canary-liff-worker.mjs';

const url='https://abis-hf2-real-canary.example.workers.dev/hf2/';
const prod='https://script.google.com/macros/s/AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR/exec';
const p2a='https://script.google.com/macros/s/AKfycbzvWV5n4ouINYgN5oLAau-uetJQJqVkVJ3lf1u-Ibz33A1AbIVUkaj029JFDpOLlyUA/exec';
const candidate='https://script.google.com/macros/s/AKfycbCANARY_NOT_REAL_12345678/exec';

test('canary is 503 by default and does not serve unconfigured LINE login',async()=>{
 const r=await worker.fetch(new Request(url),{});
 assert.equal(r.status,503);
 assert.match(await r.text(),/CANARY NOT CONFIGURED/);
});

test('worker blocks frozen V143 and Phase 2A synthetic endpoint',async()=>{
 for(const endpoint of [prod,p2a]){
  const r=await worker.fetch(new Request(url),{HF2_CANARY_BACKEND_EXEC_URL:endpoint});
  assert.equal(r.status,503);
 }
});

test('worker only accepts direct https script.google.com /exec endpoint',async()=>{
 for(const endpoint of [
  'http://script.google.com/macros/s/AA/exec',
  'https://evil.example/macros/s/AA/exec',
  'https://script.google.com/macros/s/AA/dev',
  'https://script.google.com/macros/s/AA/exec?mode=employee',
  ''
 ]){
  const r=await worker.fetch(new Request(url),{HF2_CANARY_BACKEND_EXEC_URL:endpoint});
  assert.equal(r.status,503);
 }
});

test('correct distinct canary web app route only serves isolated LIFF for A09701',async()=>{
 const r=await worker.fetch(new Request(url),{HF2_CANARY_BACKEND_EXEC_URL:candidate});
 assert.equal(r.status,200);
 assert.equal(r.headers.get('cache-control'),'no-store');
 const html=await r.text();
 assert.match(html,/2011584842-qk2mOOxp/);
 assert.ok(html.includes(candidate));
 assert.ok(!html.includes('__HF2_CANARY_BACKEND_URL__'));
 assert.match(html,/mode:'liffauth'/);
 assert.match(html,/routeToken:rt/);
 assert.match(html,/bootRoute:'attendance'/);
 assert.ok(html.includes('^[0-9a-f]{64}$'));
});

test('worker exposes no broad proxied endpoint',async()=>{
 const env={HF2_CANARY_BACKEND_EXEC_URL:candidate};
 assert.equal((await worker.fetch(new Request('https://abis-hf2-real-canary.example.workers.dev/'),env)).status,404);
 assert.equal((await worker.fetch(new Request(url,{method:'POST'}),env)).status,404);
});

test('client never sends session, RT, LINE token to worker or logs',()=>{
 const html=fs.readFileSync(path.join(import.meta.dirname,'../staging/hf2/canary-liff-entry.html'),'utf8');
 assert.ok(html.includes("form.action=BACKEND"));
 assert.ok(!html.includes('console.log'));
 assert.ok(!html.includes('localStorage'));
 assert.ok(!html.includes('getDecodedIDToken'));
 assert.ok(!html.includes('getProfile'));
 assert.ok(!html.includes('google.script.run'));
});
