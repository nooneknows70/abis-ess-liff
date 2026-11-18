'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const manifest = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../ABIS_ESS_RELEASE_MANIFEST.json'),
  'utf8'
));

const PROD = 'ABIS_ESS_PHASE1A_RC1_33_PROD_20261018_V153';
const patches = [
  'assets/ess-20261027-leave-approval-label-rc1/leave-approval-label.js',
  'assets/ess-20261007-rc13-hf81/attendance-hold-hf81.js',
  'assets/ess-20261007-rc13-hf2/leave-submit-hf2.js',
  'assets/ess-20261007-rc13-hf3r1/leave-submit-hf3r1.js',
  'assets/ess-20261007-rc13-hf4/ess-dialog-hf4.js',
  'assets/ess-20261009-r2180d-rc1_2_2/punch-exempt-admin.js',
  'assets/ess-20261106-hrlb-v1-1-2-ui-recovery/abis-hrlb-ui-recovery.js'
];

test('production release set stays V153', () => {
  assert.equal(manifest.prodCurrentReleaseSet, PROD);
  assert.equal(manifest.releaseSet, PROD);
  assert.equal(manifest.releaseStatus, 'PROD_CURRENT');
  assert.equal(manifest.prodCurrent.releaseSet, PROD);
});

test('V154 is a candidate and does not replace production', () => {
  const candidate = manifest.candidateReleaseSet;
  assert.equal(candidate.id, 'ABIS_ESS_PHASE1A_RC1_34_CANDIDATE_20261118_V154');
  assert.equal(candidate.status, 'CANDIDATE');
  assert.equal(candidate.notProduction, true);
  assert.equal(candidate.prodCurrentReleaseSet, PROD);
  assert.equal(candidate.doesNotReplace, PROD);
  assert.equal(candidate.backendDependency.issue, 199);
  assert.match(candidate.backendDependency.mainCommit, /^5ec7de8/);
  assert.match(candidate.followUp, /ess-20261118-p1-hf9/);
  assert.equal(candidate.components.some((item) => item.path.includes('ess-20261118-p1-hf9')), false);
});

test('candidate components load the bundle, seven patches, then #43 and #44', () => {
  const components = manifest.candidateReleaseSet.components;
  assert.deepEqual(components.map((item) => item.order), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(components[1].role, 'MAIN_BUNDLE');
  assert.equal(components[1].path, 'assets/ess-20261007-rc13-hf8/abis-ess.bundle.js');
  assert.deepEqual(components.slice(2, 9).map((item) => item.path), patches);
  assert.equal(components[9].issue, 43);
  assert.equal(components[9].wraps, 'p5a2rc1AttendanceInboxHtml_');
  assert.equal(components[10].issue, 44);
  assert.equal(components[10].wraps, 'p5a202CorrectionStateHtml_');
  assert.ok(components[9].order > components[8].order);
  assert.ok(components[10].order > components[1].order);
});

test('the two feature scripts install after the bundle by wrapping those functions', () => {
  const root = path.resolve(__dirname, '..');
  const supervisor = fs.readFileSync(
    path.join(root, 'assets/ess-20261118-supervisor-correction-confirm/supervisor-correction-confirm.js'),
    'utf8'
  );
  const employee = fs.readFileSync(
    path.join(root, 'assets/ess-20261118-employee-correction-return/employee-correction-return.js'),
    'utf8'
  );
  assert.match(supervisor, /function install\(/);
  assert.match(supervisor, /p5a2rc1AttendanceInboxHtml_/);
  assert.match(employee, /function install\(/);
  assert.match(employee, /p5a202CorrectionStateHtml_/);
});
