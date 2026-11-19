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
  assert.ok(home.querySelector('.hf9-skel'), 'skeleton missing on the retry path');
  assert.ok(window.document.getElementById('hf9BootRetry'));
  assert.match(home.textContent, /HF9_LOGIN_BOOT/);
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
  return `(() => {
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
      '<button type="button" class="fh-head-action">查看全部</button>'
    ].join('');
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
      viewport: window.innerWidth
    };
  })()`;
}

test('computed colors and 48px boxes at 360 and 390', { timeout: 30000 }, async () => {
  await withChrome(async ({ send, origin }) => {
    const cases = [
      [360, 'ZH', '王小明'],
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
        returnByValue: true
      });
      const value = evaluated.result && evaluated.result.value;
      assert.ok(value, lang + ' ' + width + ' ' + JSON.stringify(evaluated));
      assert.equal(value.loop, false, lang + ' ' + width);
      assert.ok(value.calls < 40, lang + ' ' + width + ' callbacks ' + value.calls);
      assert.ok(value.dclMs < 2000, lang + ' ' + width + ' DOMContentLoaded ' + value.dclMs + 'ms');
      const primary = new Set(['同意', '全部同意', '採認', '核准申請', '補登並核准', '送出補正申請']);
      const secondary = new Set(['修改', '退回', '不採認']);
      for (const button of value.buttons) {
        if (button.display === 'none') continue;
        assert.ok(button.h >= 48 && button.w >= 48, lang + ' ' + width + ' ' + JSON.stringify(button));
        if (button.text === '查看全部' || button.text === '') continue;
        if (primary.has(button.text)) assert.match(button.bg, /rgb\(11,\s*143,\s*90\)/, button.text + ' ' + button.bg);
        if (secondary.has(button.text)) assert.match(button.bg, /rgb\(255,\s*255,\s*255\)/, button.text + ' ' + button.bg);
      }
      const user = value.buttons.find((button) => String(button.cls).indexOf('frozen-user-chip') >= 0);
      assert.ok(user, lang + ' missing user chip');
      assert.ok(user.right <= width + 1, lang + ' ' + width + ' user button ends at ' + user.right);
    }
  });
});
