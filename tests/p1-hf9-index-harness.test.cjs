'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'index-r5.html');
const { JSDOM, VirtualConsole } = require('jsdom');

function readyHome() {
  return {
    ok: true,
    data: {
      code: 'HOME_BOOTSTRAP_OK',
      status: 'READY',
      home: { employee: { id: 'A09701', name: '測試員', preferredLanguage: 'zh-TW' }, canSubmitLeave: true },
      notificationSummary: { unread: 2, generalUnread: 1 }
    }
  };
}

function retrying() {
  return { ok: true, data: { code: 'HOME_BOOTSTRAP_RETRY', status: 'PENDING', retryable: true } };
}

async function openHarness(handle, extra) {
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on('jsdomError', (error) => errors.push(String(error && error.message || error)));
  const started = Date.now();
  const dom = await JSDOM.fromFile(fixture, {
    // GAS serves Index.html as UTF-8; the fixture has no <meta charset>, so tests
    // that compare zh text inside the bundle ask jsdom for UTF-8 explicitly.
    ...(extra && extra.utf8 ? { contentType: 'text/html; charset=utf-8' } : {}),
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.HF9_BOOT_RETRY_DELAYS = [0, 0, 0, 0];
      window.__hf9Handle = handle;
      window.__hf9Seed = { session: 'synthetic-session', lang: (extra && extra.lang) || 'ZH' };
      const memory = new Map();
      function storage() {
        return {
          getItem(key) { return memory.has(key) ? memory.get(key) : null; },
          setItem(key, value) { memory.set(String(key), String(value)); },
          removeItem(key) { memory.delete(String(key)); },
          clear() { memory.clear(); },
          key(index) { return Array.from(memory.keys())[index] || null; },
          get length() { return memory.size; }
        };
      }
      const local = storage();
      local.setItem('abis_session', 'synthetic-session');
      local.setItem('abis_lang', (extra && extra.lang) || 'ZH');
      try {
        Object.defineProperty(window, 'localStorage', { configurable: true, get: () => local });
      } catch (ignore) {
        if (window.localStorage) {
          window.localStorage.setItem('abis_session', 'synthetic-session');
          window.localStorage.setItem('abis_lang', (extra && extra.lang) || 'ZH');
        }
      }
      window.addEventListener('DOMContentLoaded', () => {
        window.__hf9Dcl = Date.now();
      });
      if (extra && extra.beforeParse) extra.beforeParse(window);
    }
  });
  return { dom, errors, started };
}

async function settle(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function afterLoad(dom, extraMs) {
  const start = Date.now();
  while (!dom.window.__hf9Dcl) {
    if (Date.now() - start > 15000) throw new Error('DOMContentLoaded did not fire');
    await settle(30);
  }
  await settle(extraMs == null ? 1200 : extraMs);
}

test('faithful Index.html reaches DOMContentLoaded without a month-label observer loop', { timeout: 20000 }, async () => {
  const { dom, errors } = await openHarness(() => readyHome());
  await afterLoad(dom, 50);
  const window = dom.window;
  assert.ok(window.__hf9Dcl, 'DOMContentLoaded did not fire');
  assert.equal(window.__hf9ObserverLoop, false);
  assert.ok(window.__hf9ObserverCalls < 40, 'observer callbacks ' + window.__hf9ObserverCalls);
  assert.equal(window.document.getElementById('attendanceMonth').value, '2026-11');
  assert.equal(window.document.getElementById('dashboardMonth').value, '2026-11');
  assert.ok(window.document.querySelectorAll('.hf9-month-label').length >= 2);
  const fatal = errors.filter((line) => /observer loop|Maximum call stack/i.test(line));
  assert.deepEqual(fatal, []);
  dom.window.close();
});

test('HOME_BOOTSTRAP_RETRY keeps the session, shows the skeleton, then finishes', { timeout: 20000 }, async () => {
  let tries = 0;
  const { dom } = await openHarness((action) => {
    if (action !== 'homeBootstrap' && action !== 'home') return { ok: true, data: {} };
    tries += 1;
    return tries < 3 ? retrying() : readyHome();
  });
  await afterLoad(dom);
  const window = dom.window;
  assert.ok(tries >= 3, 'expected retries, saw ' + tries);
  assert.equal(window.localStorage.getItem('abis_session'), 'synthetic-session');
  assert.equal(window.HF9_UI_ROUND.sessionToken(), 'synthetic-session');
  assert.equal(window.document.getElementById('login').classList.contains('hide'), true);
  assert.equal(window.document.getElementById('hf9BootRetry'), null);
  dom.window.close();
});

test('exhausted HOME_BOOTSTRAP_RETRY shows HF9_LOGIN_BOOT and a retry button', { timeout: 20000 }, async () => {
  const { dom } = await openHarness((action) => {
    if (action === 'homeBootstrap' || action === 'home') return retrying();
    return { ok: true, data: {} };
  });
  await afterLoad(dom);
  const window = dom.window;
  const home = window.document.getElementById('home');
  assert.equal(window.localStorage.getItem('abis_session'), 'synthetic-session');
  assert.equal(window.HF9_UI_ROUND.sessionToken(), 'synthetic-session');
  assert.equal(window.document.getElementById('login').classList.contains('hide'), true);
  assert.equal(home.querySelector('.hf9-skel'), null);
  assert.equal(home.querySelectorAll('#hf9BootRetryNote').length, 1);
  assert.equal((home.textContent.match(/HF9_LOGIN_BOOT/g) || []).length, 1);
  assert.equal((window.document.body.textContent.match(/HF9_LOGIN_BOOT/g) || []).length, 1);
  assert.ok(window.document.getElementById('hf9BootRetry'));
  assert.equal(/HOME_BOOTSTRAP_RETRY/.test(home.textContent), false);
  dom.window.close();
});

test('home summary uses notificationSummary and does not claim there are no notices', { timeout: 20000 }, async () => {
  const { dom } = await openHarness((action) => {
    if (action === 'homeBootstrap' || action === 'home') return readyHome();
    return { ok: true, data: {} };
  });
  await afterLoad(dom);
  const window = dom.window;
  window.__hf9NotificationSummary = { unread: 2, generalUnread: 1 };
  if (typeof window.fhNoticesHtml_ === 'function') {
    const html = window.fhNoticesHtml_(2);
    assert.equal(html.includes('目前沒有新通知'), false);
    assert.match(html, /1/);
  }
  assert.ok(window.p5a1Rc2GeneralUnreadCount_() >= 1);
  dom.window.close();
});

function chromeBin() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  return candidates.find((file) => fs.existsSync(file)) || '';
}

function serveRoot() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('missing');
      return;
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

async function cdp(ws, method, params, sessionId) {
  const id = cdp.next = (cdp.next || 0) + 1;
  const payload = { id, method, params: params || {} };
  if (sessionId) payload.sessionId = sessionId;
  ws.send(JSON.stringify(payload));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('cdp timeout ' + method)), 8000);
    function onMessage(event) {
      const data = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
      if (data.id !== id) return;
      clearTimeout(timer);
      ws.removeEventListener('message', onMessage);
      if (data.error) reject(new Error(method + ' ' + JSON.stringify(data.error)));
      else resolve(data.result || {});
    }
    ws.addEventListener('message', onMessage);
  });
}

async function withChrome(run) {
  const bin = chromeBin();
  if (!bin) {
    if (process.env.HF9_REQUIRE_CHROME === '1') assert.fail('Chrome is required for computed layout');
    return;
  }
  const server = serveRoot();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const profile = fs.mkdtempSync(path.join('/tmp', 'hf9-chrome-'));
  const chrome = spawn(bin, [
    '--headless=new',
    '--remote-debugging-port=0',
    '--user-data-dir=' + profile,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let debugPort = 0;
  let chromeLog = '';
  try {
    debugPort = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('chrome did not open a debug port: ' + chromeLog.slice(-500))), 20000);
      function look(buf) {
        chromeLog += String(buf);
        const match = chromeLog.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
        if (match) {
          clearTimeout(timer);
          resolve(Number(match[1]));
        }
      }
      chrome.stderr.on('data', look);
      chrome.stdout.on('data', look);
      chrome.on('exit', (code) => {
        clearTimeout(timer);
        reject(new Error('chrome exited ' + code + ': ' + chromeLog.slice(-500)));
      });
    });
    const version = await fetch('http://127.0.0.1:' + debugPort + '/json/version').then((res) => res.json());
    const browser = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      browser.addEventListener('open', resolve);
      browser.addEventListener('error', reject);
    });
    const target = await cdp(browser, 'Target.createTarget', { url: 'about:blank' });
    const attached = await cdp(browser, 'Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    async function send(method, params) {
      return cdp(browser, method, params, sessionId);
    }
    await send('Page.enable');
    await send('Runtime.enable');
    await run({ send, origin: 'http://127.0.0.1:' + port });
    browser.close();
  } finally {
    try { chrome.kill('SIGKILL'); } catch (ignore) {}
    server.close();
    await settle(200);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch (ignore) {}
  }
}

function layoutScript(lang, name) {
  return `(async () => {
    document.documentElement.lang = ${JSON.stringify(lang)};
    try { localStorage.setItem('abis_lang', ${JSON.stringify(lang)}); } catch (e) {}
    if (typeof currentLang !== 'undefined') currentLang = ${JSON.stringify(lang)};
    const user = document.getElementById('headerUserName');
    user.textContent = ${JSON.stringify(name)};
    document.body.classList.add('home-view');
    document.body.classList.remove('inner-view');
    const box = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        w: rect.width, h: rect.height, right: rect.right, display: style.display,
        bg: style.backgroundColor, cls: el.className,
        text: (el.textContent || '').trim()
      };
    };
    const headerButtons = ['#homeBellBtn', '#homeUserBtn'].map((selector) => box(document.querySelector(selector)));
    const userClient = user.clientWidth;
    const userScroll = user.scrollWidth;
    document.body.classList.add('inner-view');
    document.body.classList.remove('home-view');
    const app = document.getElementById('app');
    const inbox = document.getElementById('inbox');
    if (app) app.classList.remove('hide');
    if (inbox) inbox.classList.remove('hide');
    const host = document.getElementById('inboxList');
    host.innerHTML = [
      '<button type="button" class="scc-agree">同意</button>',
      '<button type="button" class="scc-batch">全部同意</button>',
      '<button type="button" class="scc-edit">修改</button>',
      '<button type="button" class="scc-return">退回</button>',
      '<button type="button" class="hf9-primary-action">採認</button>',
      '<button type="button" class="hf9-primary-action">核准申請</button>',
      '<button type="button" class="hf9-primary-action">補登並核准</button>',
      '<button type="button" class="hf9-primary-action">送出補正申請</button>',
      '<button type="button" class="hf9-secondary-action">不採認</button>',
      '<button type="button" class="hf9-primary-action">確認</button>',
      '<button type="button" class="hf9-primary-action">正式重新送出</button>',
      '<button type="button" class="fh-head-action">查看全部</button>'
    ].join('');
    if (window.HF9_UI_ROUND && typeof window.HF9_UI_ROUND.buttonRole === 'function') {
      host.querySelectorAll('button').forEach((btn) => {
        const role = window.HF9_UI_ROUND.buttonRole(btn.textContent);
        if (role === 'primary') btn.classList.add('hf9-primary-action');
        if (role === 'secondary') btn.classList.add('hf9-secondary-action');
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 40));
    const buttons = headerButtons.concat(Array.from(host.querySelectorAll('button')).map(box));
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      dcl: !!window.__hf9Dcl || document.readyState !== 'loading',
      dclMs: nav ? nav.domContentLoadedEventEnd : 0,
      clientWidth: document.documentElement.clientWidth,
      loop: !!window.__hf9ObserverLoop,
      calls: window.__hf9ObserverCalls || 0,
      buttons,
      userClient,
      userScroll,
      nameText: user.textContent,
      viewport: window.innerWidth
    };
  })()`;
}

test('computed colors and 48px boxes at 360 and 390', { timeout: 30000 }, async () => {
  await withChrome(async ({ send, origin }) => {
    const cases = [
      [360, 'ZH', '范氏青千'],
      [390, 'ZH', '王小明'],
      [360, 'VI', 'Nguyễn Thị Minh Châu'],
      [390, 'VI', 'Nguyễn Thị Minh Châu'],
      [360, 'TH', 'สมชาย ใจดีมาก'],
      [390, 'TH', 'สมชาย ใจดีมาก']
    ];
    for (const [width, lang, name] of cases) {
      await send('Page.navigate', { url: origin + '/tests/fixtures/index-r5.html' });
      await send('Emulation.setDeviceMetricsOverride', {
        width, height: 780, deviceScaleFactor: 1, mobile: true
      });
      const ready = await send('Runtime.evaluate', {
        expression: 'new Promise(function(resolve){var n=0;var t=setInterval(function(){n++;var bell=document.getElementById("homeBellBtn");var h=bell?getComputedStyle(bell).height:"";if((document.querySelector(".hf9-month-label")&&h&&h!=="auto"&&h!=="0px")||n>40){clearInterval(t);resolve(h||document.readyState)}},50)})',
        awaitPromise: true,
        returnByValue: true
      });
      assert.ok(ready);
      const evaluated = await send('Runtime.evaluate', {
        expression: layoutScript(lang, name),
        awaitPromise: true,
        returnByValue: true
      });
      const value = evaluated.result && evaluated.result.value;
      assert.ok(value, lang + ' ' + width + ' ' + JSON.stringify(evaluated));
      assert.equal(value.loop, false, lang + ' ' + width);
      assert.ok(value.calls < 40, lang + ' ' + width + ' callbacks ' + value.calls);
      assert.ok(value.dclMs < 2000, lang + ' ' + width + ' DOMContentLoaded ' + value.dclMs + 'ms');
      const primary = new Set(['同意', '全部同意', '採認', '核准申請', '補登並核准', '送出補正申請', '確認', '正式重新送出']);
      const secondary = new Set(['修改', '退回', '不採認']);
      for (const button of value.buttons) {
        if (button.display === 'none') continue;
        assert.ok(button.h >= 48 && button.w >= 48, lang + ' ' + width + ' ' + JSON.stringify(button));
        if (button.text === '查看全部' || button.text === '') continue;
        if (primary.has(button.text)) assert.match(button.bg, /rgb\(11,\s*143,\s*90\)/, button.text + ' ' + button.bg + ' ' + button.cls);
        if (secondary.has(button.text)) assert.match(button.bg, /rgb\(255,\s*255,\s*255\)/, button.text + ' ' + button.bg);
      }
      const user = value.buttons.find((button) => String(button.cls).indexOf('frozen-user-chip') >= 0);
      assert.ok(user, lang + ' missing user chip');
      assert.ok(user.right <= width + 1, lang + ' ' + width + ' user button ends at ' + user.right);
      if (name === '范氏青千') {
        assert.equal(value.nameText, name);
        assert.ok(value.userClient >= 48, 'short name was squeezed to ' + value.userClient + 'px');
      }
    }
  });
});

function headerScript(lang, name, sourceText) {
  return `(async () => {
    document.documentElement.lang = ${JSON.stringify(lang)};
    if (typeof currentLang !== 'undefined') currentLang = ${JSON.stringify(lang)};
    document.body.classList.add('home-view');
    document.body.classList.remove('inner-view');
    document.getElementById('headerUserName').textContent = ${JSON.stringify(name)};
    const source = document.getElementById('entrySourceText');
    source.textContent = ${JSON.stringify(sourceText)};
    await new Promise((resolve) => setTimeout(resolve, 60));
    const r = (el) => el.getBoundingClientRect();
    const box = r(document.getElementById('entrySource'));
    const text = r(source);
    const bell = r(document.getElementById('homeBellBtn'));
    const user = r(document.getElementById('homeUserBtn'));
    const style = getComputedStyle(source);
    return {
      boxRight: box.right, textRight: text.right, textWidth: text.width, bellLeft: bell.left,
      userRight: user.right, overflow: style.overflow, ellipsis: style.textOverflow,
      truncated: source.scrollWidth > source.clientWidth + 1,
      scrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  })()`;
}

test('entry source text never runs under the bell at 360 and 390 (R7 N3)', { timeout: 30000 }, async () => {
  await withChrome(async ({ send, origin }) => {
    const cases = [
      ['ZH', '范氏青千', 'WEB 登入'],
      ['ZH', '由 LINE 進入很長的入口名稱', 'WEB 登入'],
      ['VI', 'Nguyễn Thị Minh Châu', 'Đăng nhập WEB'],
      ['TH', 'สมชาย ใจดีมาก', 'เข้าสู่ระบบ WEB']
    ];
    for (const width of [360, 390]) {
      for (const [lang, name, sourceText] of cases) {
        await send('Page.navigate', { url: origin + '/tests/fixtures/index-r5.html' });
        await send('Emulation.setDeviceMetricsOverride', { width, height: 780, deviceScaleFactor: 1, mobile: true });
        await send('Runtime.evaluate', {
          expression: 'new Promise(function(resolve){var n=0;var t=setInterval(function(){n++;var bell=document.getElementById("homeBellBtn");var h=bell?getComputedStyle(bell).height:"";if((document.querySelector(".hf9-month-label")&&h&&h!=="auto"&&h!=="0px")||n>40){clearInterval(t);resolve(h||document.readyState)}},50)})',
          awaitPromise: true,
          returnByValue: true
        });
        const evaluated = await send('Runtime.evaluate', { expression: headerScript(lang, name, sourceText), awaitPromise: true, returnByValue: true });
        const v = evaluated.result && evaluated.result.value;
        const label = lang + ' ' + width + ' ' + JSON.stringify(v);
        assert.ok(v, label);
        assert.ok(v.textRight <= v.bellLeft + 0.5, 'entry text overlaps bell: ' + label);
        assert.ok(v.boxRight <= v.bellLeft + 0.5, 'entry box overlaps bell: ' + label);
        assert.ok(v.userRight <= width + 1, 'user chip overflows: ' + label);
        assert.ok(v.scrollX <= 0, 'horizontal scroll: ' + label);
        if (v.truncated) assert.equal(v.ellipsis, 'ellipsis', 'clipped entry text needs an ellipsis: ' + label);
      }
    }
  });
});

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function delayAttendance(window, ms, outcome) {
  const base = window.__hf9Handle;
  window.google.script.run = {
    withSuccessHandler(ok) {
      return { withFailureHandler(fail) {
        return { api(action, payload) {
          if (action !== 'myAttendance') {
            try { ok(base(action, payload)); } catch (err) { ok({ ok: false, error: String(err && err.message || err) }); }
            return;
          }
          setTimeout(() => {
            if (outcome === 'fail') ok({ ok: false, error: 'synthetic attendance failure' });
            else ok({ ok: true, data: { month: payload.month, days: [{ date: todayKey(), firstIn: '08:55', lastOut: '' }], summary: {} } });
          }, ms);
        } };
      } };
    }
  };
}

function clockRows(window) {
  return Array.from(window.document.querySelectorAll('#home .fh-status-row')).filter((row) => {
    const label = row.querySelector('.fh-status-label');
    return label && /上班時間|下班時間/.test(label.textContent);
  }).map((row) => ({
    skel: !!row.querySelector('.hf9-skel'),
    text: (row.querySelector('.fh-status-value') || {}).textContent || ''
  }));
}

function errorCodes(window) {
  const text = window.document.body.textContent || '';
  return (text.match(/HF9_039|HF9_OP_002/g) || []).length;
}

// The fixture has no backend-inlined I18N, so the real renderHome cannot draw here.
// This stand-in draws the same two clock rows from attendanceCache and then runs the
// hf9 clock pass, which is what the wrapped renderHome does in production.
function stubHome(window) {
  const state = { draws: 0 };
  window.renderHome = function () {
    state.draws += 1;
    const cache = window.eval('typeof attendanceCache === "undefined" ? null : attendanceCache');
    const days = cache && Array.isArray(cache.days) ? cache.days : [];
    const today = days.find((day) => day.date === todayKey()) || null;
    const cell = (value) => (value ? value : '—');
    window.document.getElementById('home').innerHTML =
      '<div class="fh-status-row"><span class="fh-status-label">上班時間</span><span class="fh-status-value">' + cell(today && today.firstIn) + '</span></div>' +
      '<div class="fh-status-row"><span class="fh-status-label">下班時間</span><span class="fh-status-value">' + cell(today && today.lastOut) + '</span></div>';
    window.__hf9RefreshHomeClock(window.document.getElementById('home'));
  };
  window.showHome = function () {
    window.document.querySelectorAll('#app > section, #app > div').forEach(() => {});
    const attendance = window.document.getElementById('attendance');
    if (attendance) attendance.classList.add('hide');
    window.document.getElementById('home').classList.remove('hide');
    window.renderHome();
  };
  return state;
}

for (const outcome of ['ok', 'fail']) {
  test('home clock rows refresh when myAttendance settles while home is shown (' + outcome + ', R7 N1)', { timeout: 20000 }, async () => {
    const { dom } = await openHarness((action) => {
      if (action === 'homeBootstrap' || action === 'home') return readyHome();
      return { ok: true, data: {} };
    }, { utf8: true });
    await afterLoad(dom, 300);
    const window = dom.window;
    window.eval('attendanceCache = null');
    // a2t is inlined by the backend (PERF1_JS_CORE_PRE) and is not part of the fixture.
    if (typeof window.a2t !== 'function') window.a2t = (key) => ({ loadingAttendance: '出勤資料載入中', loadDone: '出勤資料載入完成' })[key] || key;
    assert.equal(typeof window.__hf9RefreshHomeClock, 'function');
    const state = stubHome(window);
    delayAttendance(window, 250, outcome);
    const pending = window.refreshMyAttendance();
    await settle(20);
    window.showHome();
    await settle(20);
    assert.equal(window.__hf9AttendanceLoading, true);
    const during = clockRows(window);
    assert.equal(during.length, 2, JSON.stringify(during));
    assert.deepEqual(during.map((row) => row.skel), [true, true], 'expected loading skeletons ' + JSON.stringify(during));
    const drawsBefore = state.draws;
    await pending;
    await settle(60);
    assert.equal(window.__hf9AttendanceLoading, false);
    assert.ok(state.draws > drawsBefore, 'home was not redrawn after myAttendance settled');
    const after = clockRows(window);
    assert.equal(after.filter((row) => row.skel).length, 0, 'skeleton left after ' + outcome + ' ' + JSON.stringify(after));
    if (outcome === 'ok') {
      assert.deepEqual(after.map((row) => row.text), ['08:55', '尚未打卡']);
    } else {
      // V154-P2A: a failed load leaves today unknown, so the rows keep "—"
      // instead of claiming 尚未打卡.
      assert.deepEqual(after.map((row) => row.text), ['—', '—']);
      assert.ok(errorCodes(window) <= 1, 'more than one error shown: ' + errorCodes(window));
    }
    dom.window.close();
  });
}

test('the clock pass also clears a skeleton when home cannot be redrawn (R7 N1)', { timeout: 20000 }, async () => {
  const { dom } = await openHarness((action) => {
    if (action === 'homeBootstrap' || action === 'home') return readyHome();
    return { ok: true, data: {} };
  }, { utf8: true });
  await afterLoad(dom, 300);
  const window = dom.window;
  if (typeof window.a2t !== 'function') window.a2t = (key) => ({ loadingAttendance: '出勤資料載入中', loadDone: '出勤資料載入完成' })[key] || key;
  window.renderHome = function () { throw new Error('synthetic redraw failure'); };
  const home = window.document.getElementById('home');
  home.classList.remove('hide');
  home.innerHTML = '<div class="fh-status-row"><span class="fh-status-label">上班時間</span><span class="fh-status-value"><span class="hf9-skel"></span></span></div>';
  delayAttendance(window, 30, 'fail');
  await window.refreshMyAttendance().catch(() => null);
  window.document.getElementById('home').classList.remove('hide');
  home.innerHTML = '<div class="fh-status-row"><span class="fh-status-label">上班時間</span><span class="fh-status-value"><span class="hf9-skel"></span></span></div>';
  window.__hf9AttendanceLoading = false;
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.hf9-skel').length, 0);
  // V154-P2A: today is still unknown (no attendance, home not from homeBootstrap).
  assert.equal(clockRows(window)[0].text, '—');
  // Once homeBootstrap has delivered today's state, an empty clock is a fact.
  window.eval('attendanceCache = null; homeData = Object.assign({}, homeData || {}, { __perf3: true })');
  home.innerHTML = '<div class="fh-status-row"><span class="fh-status-label">上班時間</span><span class="fh-status-value"><span class="hf9-skel"></span></span></div>';
  window.__hf9RefreshHomeClock(home);
  assert.equal(home.querySelectorAll('.hf9-skel').length, 0);
  assert.equal(clockRows(window)[0].text, '尚未打卡');
  dom.window.close();
});

test('a failed myAttendance load shows one error, not HF9_039 and HF9_OP_002 together (R7 N1)', { timeout: 20000 }, async () => {
  const { dom } = await openHarness((action) => {
    if (action === 'homeBootstrap' || action === 'home') return readyHome();
    return { ok: true, data: {} };
  }, { utf8: true });
  await afterLoad(dom, 300);
  const window = dom.window;
  window.eval('attendanceCache = null');
  if (typeof window.a2t !== 'function') window.a2t = (key) => ({ loadingAttendance: '出勤資料載入中', loadDone: '出勤資料載入完成' })[key] || key;
  delayAttendance(window, 30, 'fail');
  await window.refreshMyAttendance();
  await settle(60);
  const text = window.document.body.textContent || '';
  assert.equal(errorCodes(window), 1, 'error codes on screen: ' + (text.match(/HF9_039|HF9_OP_002/g) || []).join(','));
  assert.match(text, /HF9_039/);
  dom.window.close();
});

function hf9RoundBlock() {
  const bundle = fs.readFileSync(path.join(root, 'assets/ess-20261118-p1-hf9/abis-ess.bundle.js'), 'utf8');
  const start = bundle.lastIndexOf('/* HF9_UI_ROUND_START');
  const endMark = '/* HF9_UI_ROUND_END */';
  const end = bundle.indexOf(endMark, start);
  return bundle.slice(start, end + endMark.length);
}

function buttonColorScript(lang, labels) {
  return `(async () => {
    document.documentElement.lang = ${JSON.stringify(lang)};
    if (typeof currentLang !== 'undefined') currentLang = ${JSON.stringify(lang)};
    document.body.classList.add('inner-view');
    document.body.classList.remove('home-view');
    const app = document.getElementById('app');
    const inbox = document.getElementById('inbox');
    if (app) app.classList.remove('hide');
    if (inbox) inbox.classList.remove('hide');
    const host = document.getElementById('inboxList');
    const labels = ${JSON.stringify(labels)};
    host.innerHTML = labels.primary.map((t) => '<button type="button">' + t + '</button>').join('') +
      labels.secondary.map((t) => '<button type="button">' + t + '</button>').join('') +
      '<button type="button" data-role="primary">x-declared</button>';
    window.HF9_UI_ROUND.classifyButtons(host);
    await new Promise((resolve) => setTimeout(resolve, 60));
    return Array.from(host.querySelectorAll('button')).map((btn) => ({
      text: btn.textContent.trim(), bg: getComputedStyle(btn).backgroundColor, cls: btn.className
    }));
  })()`;
}

test('vi and th primary buttons are green and secondary are white (R7 N2)', { timeout: 30000 }, async () => {
  await withChrome(async ({ send, origin }) => {
    const sets = {
      ZH: { primary: ['採認', '確認', '正式重新送出'], secondary: ['不採認', '退回'] },
      VI: { primary: ['Chấp nhận', 'Xác nhận', 'Gửi lại chính thức', 'Quản lý phê duyệt', 'Gửi đơn'], secondary: ['Không chấp nhận', 'Trả lại'] },
      TH: { primary: ['รับรอง', 'ยืนยัน', 'ส่งใหม่อย่างเป็นทางการ', 'ผู้บังคับบัญชาอนุมัติ', 'ส่งคำขอลา'], secondary: ['ไม่รับรอง', 'ส่งคืน'] }
    };
    for (const lang of ['ZH', 'VI', 'TH']) {
      await send('Page.navigate', { url: origin + '/tests/fixtures/index-r5.html' });
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 1, mobile: true });
      await send('Runtime.evaluate', {
        expression: 'new Promise(function(resolve){var n=0;var t=setInterval(function(){n++;var bell=document.getElementById("homeBellBtn");var h=bell?getComputedStyle(bell).height:"";if((document.querySelector(".hf9-month-label")&&h&&h!=="auto"&&h!=="0px")||n>40){clearInterval(t);resolve(h||document.readyState)}},50)})',
        awaitPromise: true,
        returnByValue: true
      });
      // The fixture has no backend-inlined core, so the bundle stops before the hf9
      // round block in Chrome. Load just that block, as p1-hf9-round.test.cjs does.
      const loaded = await send('Runtime.evaluate', { expression: 'try{' + hf9RoundBlock() + '}catch(e){};typeof window.HF9_UI_ROUND', returnByValue: true });
      assert.equal(loaded.result && loaded.result.value, 'object', lang + ' ' + JSON.stringify(loaded));
      const evaluated = await send('Runtime.evaluate', { expression: buttonColorScript(lang, sets[lang]), awaitPromise: true, returnByValue: true });
      const buttons = evaluated.result && evaluated.result.value;
      assert.ok(Array.isArray(buttons), lang + ' ' + JSON.stringify(evaluated));
      for (const button of buttons) {
        if (sets[lang].primary.includes(button.text) || button.text === 'x-declared') {
          assert.match(button.bg, /rgb\(11,\s*143,\s*90\)/, lang + ' primary ' + JSON.stringify(button));
        } else if (sets[lang].secondary.includes(button.text)) {
          assert.match(button.bg, /rgb\(255,\s*255,\s*255\)/, lang + ' secondary ' + JSON.stringify(button));
        }
      }
    }
  });
});
