import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../staging/hf2/phase2-liff-worker.mjs';

const endpoint='https://hf2-stage.example.workers.dev/hf2/';
const stage={
  HF2_STAGE_LIFF_ID:'1234567890-TestStage',
  HF2_STAGE_BACKEND_EXEC_URL:'https://script.google.com/macros/s/AKfycbStage9876543210/exec'
};
test('Worker refuses to serve LIFF until both staging config fields are set',async()=>{
 const r=await worker.fetch(new Request(endpoint),{});
 assert.equal(r.status,503);
 assert.match(await r.text(),/STAGING NOT CONFIGURED/);
});
test('Worker renders only stage LIFF and stage Apps Script with no-store headers',async()=>{
 const r=await worker.fetch(new Request(endpoint),stage);
 assert.equal(r.status,200);
 const html=await r.text();
 assert.ok(html.includes(stage.HF2_STAGE_LIFF_ID));
 assert.ok(html.includes(stage.HF2_STAGE_BACKEND_EXEC_URL));
 assert.ok(!html.includes('__HF2_TEST_LIFF_ID__'));
 assert.equal(r.headers.get('cache-control'),'no-store');
});
test('Worker blocks production LINE Channel ID and production deployment',async()=>{
 const candidates=[
 {...stage,HF2_STAGE_LIFF_ID:'2011584842-AmO1bbHY'},
 {...stage,HF2_STAGE_BACKEND_EXEC_URL:'https://script.google.com/macros/s/AKfycbxWYmfVQB4DOlnz0rKPqN45IMwtIEdZ-t4GnhiS8PuxmnPX-Z46yiH-EU331X0kiweR/exec'}
 ];
 for(const env of candidates)assert.equal((await worker.fetch(new Request(endpoint),env)).status,503);
});
test('same LINE Login Channel but different test LIFF App is accepted',async()=>{
 const r=await worker.fetch(new Request(endpoint),{
  ...stage,HF2_STAGE_LIFF_ID:'2011584842-qk2mOOxp'
 });
 assert.equal(r.status,200);
 const html=await r.text();
 assert.ok(html.includes("2011584842-qk2mOOxp"));
 assert.ok(!html.includes("__HF2_TEST_LIFF_ID__"));
});
test('Worker never becomes a reverse proxy or exposes unrelated routes',async()=>{
 assert.equal((await worker.fetch(new Request('https://hf2-stage.example.workers.dev/'),stage)).status,404);
 assert.equal((await worker.fetch(new Request(endpoint,{method:'POST'}),stage)).status,404);
});
