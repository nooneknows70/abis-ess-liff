'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname;
const gate=fs.readFileSync(path.join(root,'feature-gate.js'),'utf8');
const fragment=fs.readFileSync(path.join(root,'ABIS_OFFICE_OT_PHASE1_UI.html'),'utf8');
const entry=fs.readFileSync(path.resolve(root,'../../index.html'),'utf8');

test('Q33 feature gate never auto-mounts',()=>{
 const sandbox={};vm.runInNewContext(gate,sandbox,{timeout:1000});
 const api=sandbox.ABISOfficeOTPhase1DraftGate;
 assert.equal(api.config.enabled,false);
 assert.equal(api.config.productionReleaseApproved,false);
 const result=api.tryMount(null,null,null);
 assert.equal(result.ok,false);
 assert.equal(result.mounted,false);
 assert.equal(result.lineSent,false);
});
test('Q33 LIFF current index stays untouched / UI not loaded',()=>{
 assert.doesNotMatch(entry,/office-ot-phase1|ABISOfficeOTPhase1UI|feature-gate\.js/);
});
test('Q33 candidate exposes mount only on explicit call',()=>{
 assert.match(fragment,/var ABISOfficeOTPhase1UI=\(function/);
 assert.match(fragment,/function mount\(target,client,ctx\)/);
 assert.match(fragment,/ctx\.canSubmitOfficeOt!==true/);
});
test('Q33 UI never directly invokes LINE or raw network services',()=>{
 assert.doesNotMatch(fragment,/\b(?:liff\.login|fetch|XMLHttpRequest|UrlFetchApp|localStorage)\s*\(/);
 assert.doesNotMatch(gate,/SpreadsheetApp\s*\.|UrlFetchApp\s*\.|liff\.login\s*\(/);
});
