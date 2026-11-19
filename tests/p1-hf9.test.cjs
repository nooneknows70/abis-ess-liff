'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
const { test } = require('node:test');

const dir = path.resolve(__dirname, '../assets/ess-20261118-p1-hf9');
const css = fs.readFileSync(path.join(dir, 'abis-ess.css'), 'utf8');
const bundle = fs.readFileSync(path.join(dir, 'abis-ess.bundle.js'), 'utf8');
const jsFiles = fs.readdirSync(dir).filter((name) => name.endsWith('.js'));

test('hf9 CSS has no style tags or HTML comments', () => {
  assert.equal(/<style\b/i.test(css), false);
  assert.equal(/<\/style>/i.test(css), false);
  assert.equal(/<!--/.test(css), false);
  assert.match(css, /button\.abis-async-busy/);
  assert.match(css, /--abis-ui-text-strong/);
});

test('.card is border-box and cannot exceed its container', () => {
  assert.match(css, /\.card\{box-sizing:border-box;max-width:100%/);
  assert.match(css, /#notifications\.card/);
  assert.match(css, /body\.inner-view \.notification-row/);
});

test('home quick actions are a column with a two-line title', () => {
  assert.match(css, /\.fh-quick,\s*body\.home-view \.fh-quick\{\s*display:flex!important;\s*flex-direction:column!important/);
  assert.match(css, /-webkit-line-clamp:2!important/);
  assert.match(css, /4 quick actions \+ recent/);
  assert.equal(/tasks \+ recent \+ 4 quick actions/.test(css), false);
});

test('quick-action titles keep CJK words intact and shrink slightly at 360px', () => {
  assert.match(
    css,
    /\.fh-quick-copy b,\s*body\.home-view \.fh-quick-copy b\{[^}]*word-break:keep-all!important/
  );
  const narrow = css.slice(css.lastIndexOf('@media (max-width:360px)'));
  assert.match(narrow, /\.fh-quick-copy b/);
  assert.match(narrow, /font-size:26px!important/);
  assert.match(narrow, /letter-spacing:-0\.03em!important/);
});

test('renderHome paints quick actions before recent records', () => {
  const start = bundle.indexOf('function renderHome()');
  const end = bundle.indexOf('function fillLeaveTypes()');
  assert.ok(start > 0 && end > start);
  const body = bundle.slice(start, end);
  const quick = body.indexOf("fht_('quick')");
  const recent = body.indexOf("fht_('recent')");
  assert.ok(quick > 0 && recent > quick);
});

test('hf9 JavaScript has no native confirm()', () => {
  for (const name of jsFiles) {
    const source = fs.readFileSync(path.join(dir, name), 'utf8');
    assert.equal(/\bconfirm\s*\(/.test(source), false, name);
  }
});

test('hf9 JavaScript does not render raw e.message into the DOM', () => {
  const forbidden = [
    /e&&e\.message\?e\.message:String\(e\)/,
    /e && e\.message \?/,
    /error&&error\.message\?error\.message/,
    /msg_\(\s*e\.message/,
    /message\(\s*e\.message/,
    /escapeHtml\(\s*[^)]{0,80}\.message/,
    /esc_\(\s*[^)]{0,80}\.message/,
    /ShowError_\([^;\n]{0,220}\.message/,
    /\.error\s*=\s*[^;\n]{0,80}\.message/,
    /error:\s*e&&e\.message/
  ];
  for (const name of jsFiles) {
    const source = fs.readFileSync(path.join(dir, name), 'utf8');
    for (const pattern of forbidden) {
      assert.equal(pattern.test(source), false, name + ' ' + pattern);
    }
  }
});

test('friendly errors are localized and the raw error stays on console.error', () => {
  const block = bundle.slice(
    bundle.indexOf('/* HF9_PUBLIC_ERROR_START */'),
    bundle.indexOf('/* HF9_PUBLIC_ERROR_END */')
  );
  const logs = [];
  const context = {
    console: { error() { logs.push(Array.from(arguments)); } },
    currentLang: 'ZH'
  };
  vm.createContext(context);
  vm.runInContext(block + '\nthis.hf9PublicError_ = hf9PublicError_;', context);
  const raw = new Error('SQL timeout at /exec sheet row 14');
  raw.code = 'HF9_OP_001';
  context.currentLang = 'ZH';
  const zh = context.hf9PublicError_(raw, 'HF9_OP_001');
  assert.match(zh, /操作沒有完成/);
  assert.match(zh, /HF9_OP_001/);
  assert.equal(zh.includes('SQL timeout'), false);
  context.currentLang = 'EN';
  assert.match(context.hf9PublicError_(raw, 'HF9_OP_001'), /Something went wrong/);
  context.currentLang = 'VI';
  assert.match(context.hf9PublicError_(raw, 'HF9_OP_001'), /Chưa hoàn tất/);
  context.currentLang = 'TH';
  assert.match(context.hf9PublicError_(raw, 'HF9_OP_001'), /ยังทำไม่สำเร็จ/);
  assert.equal(logs.length, 4);
  assert.equal(logs[0][1], raw);
});

test('hf9 patch copies exist and the production hf8 files are not this directory', () => {
  for (const name of ['punch-exempt-admin.js', 'ess-dialog-hf4.js', 'leave-submit-hf3r1.js', 'preview.html', 'manifest.json']) {
    assert.equal(fs.existsSync(path.join(dir, name)), true, name);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.production, false);
  assert.equal(manifest.baseAsset, 'assets/ess-20261007-rc13-hf8');
});

test('hf9 JavaScript parses', () => {
  for (const name of jsFiles) {
    const result = spawnSync(process.execPath, ['--check', path.join(dir, name)], { encoding: 'utf8' });
    assert.equal(result.status, 0, name + '\n' + result.stderr);
  }
});
