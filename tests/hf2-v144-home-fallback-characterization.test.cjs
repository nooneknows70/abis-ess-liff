'use strict';
// Snapshot regression for the CURRENT production-referenced HF8 static bundle.
// These are characterization tests: they prove the precise unsafe fallback
// behavior currently present, NOT that production has been repaired.
// Never test with real LINE / R2 tokens or employee records.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(
  __dirname, '../assets/ess-20261007-rc13-hf8/abis-ess.bundle.js'
), 'utf8');

function getFunction(name) {
  let index = source.indexOf('async function ' + name + '(');
  if (index < 0) index = source.indexOf('function ' + name + '(');
  assert.ok(index >= 0, 'Missing frozen production handler: ' + name);
  const next = source.slice(index + 5).match(/\n(?:async )?function [A-Za-z_$][\w$]*\s*\(/);
  const end = next ? index + 5 + next.index : source.length;
  return source.slice(index, end);
}

test('V144 boot route: valid server context initiates its async handler', () => {
  let applied = 0;
  const sandbox = {
    p5rmBootRouteApplied_: false,
    p5a25R29BootContext_: () => ({routeKind:'MANAGEMENT_SITE_DAY'}),
    p5a25R29ApplyBootRouteContext_: () => {applied++; return Promise.resolve(true);},
    showHome: () => {throw new Error('should not render Home on first boot');}
  };
  vm.runInNewContext(getFunction('p5rmApplyBootRoute_'), sandbox, {timeout:1000});
  sandbox.p5rmApplyBootRoute_();
  assert.equal(applied, 1);
  assert.equal(sandbox.p5rmBootRouteApplied_, true);
});

test('known @144 failure: second boot unconditionally sends even authorized route to HOME', () => {
  let applied = 0, returnedHome = 0;
  const sandbox = {
    p5rmBootRouteApplied_: false,
    p5a25R29BootContext_: () => ({routeKind:'MANAGEMENT_SITE_DAY'}),
    p5a25R29ApplyBootRouteContext_: () => {applied++; return Promise.resolve(true);},
    showHome: () => {returnedHome++;}
  };
  vm.runInNewContext(getFunction('p5rmApplyBootRoute_'),sandbox,{timeout:1000});
  sandbox.p5rmApplyBootRoute_();
  sandbox.p5rmApplyBootRoute_();
  assert.equal(applied,1);
  assert.equal(returnedHome,1);
});

test('known @144 failure: async site-detail failure disappears into warning and returns false',async () => {
  const warnings=[];
  const sandbox={
    p5a25R29BootContext_:()=>({routeKind:'MANAGEMENT_SITE_DAY',scopeValue:'XINDIAN',date:'2026-10-11'}),
    p5a25R29OpenSiteDetail_:async()=>{throw new Error('SYNTHETIC_READ_ERROR');},
    message:(msg,kind)=>warnings.push({msg,kind})
  };
  vm.runInNewContext(getFunction('p5a25R29ApplyBootRouteContext_'),sandbox,{timeout:1000});
  const result=await sandbox.p5a25R29ApplyBootRouteContext_();
  assert.equal(result,false);
  assert.equal(warnings.length,1);
  assert.equal(warnings[0].kind,'warning');
  assert.match(warnings[0].msg,/SYNTHETIC_READ_ERROR/);
  assert.equal(typeof sandbox.document,'undefined');
});

test('V144 site-detail RPC does not forward SourceEventKey from authorized routeContext',()=>{
  const site=getFunction('p5a25R29OpenSiteDetail_');
  assert.match(site,/call\('attendanceUnifiedSiteDetail'/);
  assert.match(site,/scopeCode:ctx\.scopeValue/);
  assert.ok(!site.includes('sourceEventKey'), 'HF1 sourceEventKey not embedded in frozen HF8 bundle');
});

test('V144 index still uses this frozen static HF8 JS asset',()=>{
  // Repository layout keeps the indexed asset independently of the GAS Index.
  // The official @144 Index references this exact GitHub Pages path.
  assert.ok(source.includes('function p5rmApplyBootRoute_()'));
  assert.ok(source.includes('p5a25R29ApplyBootRouteContext_'));
});
