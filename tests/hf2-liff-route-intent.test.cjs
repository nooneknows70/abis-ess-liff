'use strict';
// HF2 only: hermetic tests for the official LIFF entry code in the Draft branch.
// No real LINE token, production session, attendance API, or deployment access.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const parserStart = html.indexOf('    function readLiffRouteIntent_(');
const parserEnd = html.indexOf('    const REAUTH_FLAG =', parserStart);
assert.ok(parserStart >= 0 && parserEnd > parserStart, 'LIFF route parser must exist');
const parsers = html.slice(parserStart, parserEnd);
const reauthStart = html.indexOf('    function reauthRedirectUri() {', parserEnd);
const reauthEnd = html.indexOf('    function reauthAlreadyAttempted() {', reauthStart);
assert.ok(reauthStart >= 0 && reauthEnd > reauthStart, 'reauth preservation must exist');
const reauthFunction = html.slice(reauthStart, reauthEnd);
const origin = 'https://nooneknows70.github.io';
const pathname = '/abis-ess-liff/';

function harness(search) {
  const location = { origin, pathname, search, href: origin + pathname + search };
  const ctx = { URL, URLSearchParams, location };
  vm.runInNewContext(
    "const ALLOWED_BOOT_ROUTES = new Set(['home','leave','leaves','attendance','payroll','inbox','account']);\n" +
    parsers +
    "const REAUTH_FLAG='__abisReauth';\n" +
    reauthFunction +
    "this.routeApi={read:readLiffRouteIntent_,current:currentLiffRouteIntent_,reauth:reauthRedirectUri};",
    ctx, { timeout: 1000 }
  );
  return { location, api: ctx.routeApi };
}
function params(raw) { return new URLSearchParams(raw).toString(); }

test('direct valid rt is forwarded with the attendance route', () => {
  const t = harness('?rt=synthetic-token.1&route=attendance');
  const r = t.api.current();
  assert.equal(r.invalid, false);
  assert.equal(r.routeToken, 'synthetic-token.1');
  assert.equal(r.bootRoute, 'attendance');
  assert.equal(r.hadRouteToken, true);
});

test('LINE liff.state wrapper recovers the original opaque rt', () => {
  const wrapped = '?' + params('liff.state=/?rt=synthetic-token.2&route=attendance');
  const t = harness(wrapped);
  assert.equal(t.api.current().routeToken, 'synthetic-token.2');
  assert.equal(t.api.current().bootRoute, 'attendance');
});

test('SDK rewriting the URL after liff.init never drops the original rt', () => {
  const t = harness('?rt=synthetic-before-init&route=attendance');
  t.location.search = '';
  t.location.href = origin + pathname;
  const r = t.api.current();
  assert.equal(r.invalid, false);
  assert.equal(r.routeToken, 'synthetic-before-init');
  assert.equal(r.bootRoute, 'attendance');
});

test('re-authentication preserves the validated rt instead of discarding liff.state', () => {
  const nested = encodeURIComponent('/?rt=synthetic-reauth-1&route=attendance');
  const t = harness('?liff.state=' + nested);
  const u = new URL(t.api.reauth());
  assert.equal(u.origin, origin);
  assert.equal(u.pathname, pathname);
  assert.equal(u.searchParams.get('rt'), 'synthetic-reauth-1');
  assert.equal(u.searchParams.get('route'), 'attendance');
  assert.equal(u.searchParams.get('__abisReauth'), '1');
  assert.equal(u.searchParams.has('liff.state'), false);
});

test('nested and direct conflicting rt values fail closed', () => {
  const wrapped = encodeURIComponent('/?rt=synthetic-b&route=attendance');
  const t = harness('?rt=synthetic-a&liff.state=' + wrapped);
  assert.equal(t.api.current().invalid, true);
  assert.equal(t.api.current().reason, 'ROUTE_TOKEN_CONFLICT');
  assert.throws(() => t.api.reauth(), /出勤連結參數無效/);
});

test('duplicate, blank, malformed tokens fail closed instead of ordinary HOME', () => {
  const samples = [
    '?rt=synthetic-a&rt=synthetic-b',
    '?rt=',
    '?rt=bad%20token',
    '?liff.state=' + encodeURIComponent('/?rt=x&rt=y')
  ];
  for (const sample of samples) {
    const t = harness(sample);
    assert.equal(t.api.current().invalid, true, sample);
  }
});

test('external, protocol-relative and backslash LIFF states cannot override the origin', () => {
  const samples = [
    'https://untrusted.invalid/?rt=synthetic',
    '//untrusted.invalid/?rt=synthetic',
    '/\\untrusted.invalid/?rt=synthetic'
  ];
  for (const s of samples) {
    const t = harness('?liff.state=' + encodeURIComponent(s));
    assert.equal(t.api.current().invalid, true);
    assert.equal(t.api.current().reason, 'UNSAFE_LIFF_STATE');
  }
});

test('normal Web/LIFF HOME and Rich Menu attendance without rt remain valid', () => {
  const home = harness('');
  assert.equal(home.api.current().routeToken, '');
  assert.equal(home.api.current().bootRoute, 'home');
  assert.equal(home.api.current().invalid, false);
  const attendance = harness('?route=attendance');
  assert.equal(attendance.api.current().bootRoute, 'attendance');
  assert.equal(attendance.api.current().invalid, false);
});

test('LIFF bridge uses recovered intent and checks invalid state before POST', () => {
  assert.match(html, /routeToken: intent\.routeToken/);
  assert.match(html, /bootRoute: intent\.bootRoute/);
  assert.match(html, /forceFullAuth: intent\.forceFullAuth/);
  assert.ok(html.indexOf('currentLiffRouteIntent_().invalid') < html.indexOf('if (!liff.isLoggedIn())'));
  assert.ok(!html.includes('console.log(intent.routeToken)'));
  assert.ok(!html.includes('sessionStorage.setItem("rt"'));
});
