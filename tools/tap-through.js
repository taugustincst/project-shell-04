'use strict';
// Emulator tap-through: Keep the Light driven with real Android touch input
// (adb shell input) on a debug build of the Play edition. Play's 3 Nov 2026
// review of Bubble Pop's first upload listed "Unresponsive UI elements, such
// as buttons or icons"; this test, built the same way as Bubble Pop's, fails
// unless each control visibly does its job when a finger taps it: hauling oil,
// the store's readout, buying an upgrade, an event's choice, the four tabs,
// the logbook's order, a setting, Back, a relaunch that keeps the year, and
// 1930, where the free century ends and the rest of it is offered (the
// emulator has no Play Store, so the sheet must say so and let the light keep
// earning).
//
// The page's layout and state are read over WebView DevTools (enabled only in
// debuggable builds, see MainActivity), so every tap lands on the element's
// measured centre and every step is checked against the game's own state.
// Taps themselves never go through DevTools: they are real touches.
//
//   node tools/tap-through.js <debug-apk> [package]
// Screenshots and a log go to $TAP_THROUGH_OUT (default tap-through/).

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APK = process.argv[2];
const PKG = process.argv[3] || 'com.taugustincst.keepthelight';
const OUT = process.env.TAP_THROUGH_OUT || 'tap-through';
const PORT = 9333;
if (!APK) { console.error('usage: node tools/tap-through.js <debug-apk> [package]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const adb = (...a) => execFileSync('adb', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20 }).trim();
let shotN = 0;
const shot = name => {
  const f = path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png');
  try { fs.writeFileSync(f, execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 })); } catch (e) { /* best effort */ }
};
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
  if (!ok) failures++;
  return ok;
};
const fatal = msg => { console.log('FAIL ' + msg); finish(true); };

// ---------------------------------------------------------------- DevTools
let ws = null, msgId = 0;
const pending = new Map();
const pageErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('DevTools timeout: ' + method)); } }, 15000);
  });
}
async function js(expression) {
  const m = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (m.error) throw new Error('DevTools: ' + m.error.message);
  if (m.result.exceptionDetails) {
    const d = m.result.exceptionDetails;
    throw new Error('page: ' + ((d.exception && d.exception.description) || d.text));
  }
  return m.result.result.value;
}
async function connect() {
  // A freshly booted CI emulator can take well over a minute to bring up the
  // first WebView, so wait longer, and open the app again once in case its
  // first launch was lost while the phone was still settling.
  // A first launch whose WebView renderer died while the emulator's graphics
  // were still starting never comes back, so every 30 tries the app is stopped
  // and opened fresh, with the screen woken and unlocked first.
  let seen = 'nothing yet';
  for (let i = 0; i < 150; i++) {
    if (i > 0 && i % 30 === 0) {
      for (const cmd of [['input', 'keyevent', 'KEYCODE_WAKEUP'], ['wm', 'dismiss-keyguard'], ['am', 'force-stop', PKG], ['monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1']]) {
        try { adb('shell', ...cmd); } catch (e) { /* try on */ }
      }
    }
    let pid = '';
    try { pid = adb('shell', 'pidof', PKG); } catch (e) { /* not up yet */ }
    if (pid) {
      try {
        adb('forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid.split(/\s+/)[0]}`);
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        const page = list.find(t => t.type === 'page' && /appassets\.androidplatform\.net/.test(t.url));
        seen = `pid ${pid}, DevTools pages: ${JSON.stringify(list.map(t => [t.type, t.url]))}`;
        if (page) {
          ws = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
          ws.onmessage = e => {
            const m = JSON.parse(e.data);
            if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
            if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
          };
          await send('Runtime.enable');
          if (await js('!!(window.__keepthelight)')) return;
          ws.close(); ws = null;
        }
      } catch (e) { seen = `pid ${pid}, ${e.message || e}`; /* the page or its DevTools socket is not ready yet */ }
    } else seen = 'the app is not running';
    await sleep(1000);
  }
  let top = '';
  try { top = adb('shell', 'dumpsys', 'activity', 'activities').split('\n').filter(l => /mResumedActivity|topResumedActivity/.test(l)).join(' ').trim(); } catch (e) { /* none */ }
  fatal(`could not reach the game page over WebView DevTools (is this a debug build?). Last seen: ${seen}. Top activity: ${top || 'unknown'}`);
}

// ----------------------------------------------------------------- geometry
let dpr = 1, offX = 0, offY = 0, screenW = 0, screenH = 0;
// Measure an element (scrolled into view programmatically if it sits in a
// scrolling panel) and make sure it is the topmost thing at its centre, so a
// tap there reaches it and nothing covers it.
async function measure(sel) {
  return js(`(function(){
    var el=document.querySelector(${JSON.stringify(sel)});
    if(!el) return {missing:true};
    el.scrollIntoView({block:'center',inline:'center'});
    var r=el.getBoundingClientRect();
    var cx=r.left+r.width/2, cy=r.top+r.height/2;
    var top=document.elementFromPoint(cx,cy);
    var visible=r.width>0&&r.height>0&&cx>=0&&cy>=0&&cx<=innerWidth&&cy<=innerHeight;
    var vv=window.visualViewport||{scale:1,offsetLeft:0,offsetTop:0};
    return {cx:cx,cy:cy,w:r.width,h:r.height,visible:visible,onTop:!!top&&(top===el||el.contains(top)),vs:vv.scale,vx:vv.offsetLeft,vy:vv.offsetTop};
  })()`);
}
// Page coordinates are layout-viewport ones; if the WebView has zoomed or panned the
// visual viewport (it can after a text-size change), map through it.
const toScreen = (cx, cy, m) => { const vs = (m && m.vs) || 1, vx = (m && m.vx) || 0, vy = (m && m.vy) || 0; return [Math.round((cx - vx) * vs * dpr + offX), Math.round((cy - vy) * vs * dpr + offY)]; };
// Wait for the layout to settle (the soft keyboard opening or closing
// resizes the page), so the tap lands where the element really is.
async function measureSettled(sel) {
  let m = await measure(sel);
  for (let i = 0; i < 12 && !m.missing; i++) {
    await sleep(250);
    const n = await measure(sel);
    if (n.missing || (Math.abs(n.cx - m.cx) < 1 && Math.abs(n.cy - m.cy) < 1)) return n;
    m = n;
  }
  return m;
}
// Two taps close together in time and place read as a double tap, and the
// WebView swallows the second one (CI saw a setting toggled on and the next
// tap on it lost), so a tap near the last one waits until it cannot be.
let lastTap = { t: 0, x: -1e9, y: -1e9 };
async function tap(sel, label) {
  await sleep(150);
  const m = await measureSettled(sel);
  if (m.missing) return check(`${label}: on screen`, false, `${sel} not in the page`);
  if (!check(`${label}: visible and not covered`, m.visible && m.onTop, JSON.stringify(m))) return false;
  const [x, y] = toScreen(m.cx, m.cy, m);
  const gap = Date.now() - lastTap.t;
  if (gap < 900 && Math.hypot(x - lastTap.x, y - lastTap.y) < 300 * dpr) await sleep(900 - gap);
  adb('shell', 'input', 'tap', String(x), String(y));
  lastTap = { t: Date.now(), x, y };
  return true;
}
// A setting toggle can lose a tap to the WebView (it read two taps on the
// same spot as a double tap in CI), so a toggle whose page state did not
// change is tapped once more after a pause.
async function tapToggle(sel, label, cond) {
  await tap(sel, label);
  if (await waitFor(cond, 2500)) return true;
  await sleep(1200);
  // once more on the setting's whole label row, a bigger target than the box
  await tap(`label:has(> ${sel})`, label + ' (on its label)');
  return waitFor(cond);
}
async function longPress(sel, ms) {
  const m = await measureSettled(sel);
  const [x, y] = toScreen(m.cx, m.cy, m);
  adb('shell', 'input', 'swipe', String(x), String(y), String(x), String(y), String(ms));
}
async function waitFor(expr, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    let v = false;
    try { v = await js(expr); } catch (e) { /* page busy */ }
    if (v) return true;
    if (Date.now() > end) return false;
    await sleep(150);
  }
}
const hidden = id => `document.getElementById(${JSON.stringify(id)}).hidden`;
const shown = id => `!document.getElementById(${JSON.stringify(id)}).hidden`;
function alive() { try { return adb('shell', 'pidof', PKG) !== ''; } catch (e) { return false; } }

// -------------------------------------------------------------------- run
let finished = false;
function finish(stop) {
  if (finished) return; finished = true;
  try { fs.writeFileSync(path.join(OUT, 'logcat.txt'), adb('logcat', '-d')); } catch (e) { /* best effort */ }
  if (stop) failures = failures || 1;
  console.log(failures ? `tap-through: ${failures} FAILED` : 'tap-through: every screen and control responded');
  try { if (ws) ws.close(); } catch (e) { /* closing */ }
  process.exit(failures ? 1 : 0);
}
const K = 'window.__keepthelight';
const S = `${K}.state`;
// Events can open between taps (that is the game); this answers any with its first choice so the next tap lands where it was aimed.
const settle = () => js(`(function(){var k=${K};while(k.state.pendingEvent)k.E.resolveEvent(k.state,0);k.state.lastEventDay=k.state.dayIndex;var m=document.getElementById('modal-event');if(m)m.hidden=true;k.render()})();1`);
const tabOpen = t => `document.getElementById('tab-${t}').classList.contains('active')`;

(async () => {
  adb('wait-for-device');
  adb('install', '-r', APK);
  try { adb('shell', 'pm', 'clear', PKG); } catch (e) { /* fresh install */ }
  adb('logcat', '-c');
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  [screenW, screenH] = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/).slice(1).map(Number);
  dpr = await js('devicePixelRatio');
  await sleep(1500);
  shot('1890');

  // 1. The century opens in 1890 at Carrow Point. Calibrate on the title (no handler).
  check('the century opens in 1890 at Carrow Point', await waitFor(`${S}.year===1890&&/Carrow Point/.test(document.getElementById('hdr-date').textContent)&&!${S}.unlocked`));
  await settle();
  await js(`window.__tt=[];addEventListener('pointerdown',function(e){__tt.push([e.clientX,e.clientY])},true);1`);
  {
    const m = await measure('.brand h1');
    const sx = Math.round(m.cx * dpr), sy = Math.round(m.cy * dpr);
    adb('shell', 'input', 'tap', String(sx), String(sy));
    if (!(await waitFor('__tt.length>0'))) fatal('a tap on the screen never reached the page (touch input is not getting through)');
    const [px, py] = await js('__tt[__tt.length-1]');
    offX = sx - px * dpr; offY = sy - py * dpr;
    console.log(`geometry: screen ${screenW}x${screenH}, devicePixelRatio ${dpr}, page offset ${offX.toFixed(1)},${offY.toFixed(1)}`);
    check('touch reaches the page where it was aimed', Math.abs(offX) < screenW && Math.abs(offY) < screenH);
  }

  // 2. Haul oil up the stair.
  const c0 = await js(`${S}.stats.clicks`);
  await js(`(function(){${S}.fuel=0;${K}.render()})();1`);
  await tap('#btn-click', 'Haul oil');
  check('hauling oil counts and fills the store', await waitFor(`${S}.stats.clicks===${c0 + 1}`));
  await tap('#res-fuel', 'the oil readout');
  check('the oil readout explains the store', await waitFor(`!document.getElementById('toast').hidden&&/in store/.test(document.getElementById('toast').textContent)`));

  // 3. Buy an upgrade.
  await settle();
  await js(`(function(){${K}.give({funds:500})})();1`);
  await sleep(300);
  await tap('[data-buy="wick"]', 'buy Trimmed wicks');
  check('buying an upgrade marks it owned', await waitFor(`${S}.bought.wick===1`));
  shot('bought');

  // 4. An event's choice.
  await js(`${K}.forceEvent('storm')`);
  check('an event opens its sheet', await waitFor(shown('modal-event')));
  shot('event');
  await tap('#event-choices .choice', 'the event\'s first choice');
  check('the choice resolves into the logbook', await waitFor(`!${S}.pendingEvent&&${hidden('modal-event')}&&${S}.log.some(function(l){return l.k==='event'})`));
  await settle();

  // 5. The tabs, and the logbook's order.
  for (const t of ['log', 'village', 'more', 'station']) {
    await settle();
    await tap(`.tab[data-tab="${t}"]`, `${t} tab`);
    check(`the ${t} tab opens`, await waitFor(tabOpen(t)));
  }
  await tap('.tab[data-tab="log"]', 'log tab');
  check('Read from the start turns on', await tapToggle('#log-order', 'Read from the start', `${K}.state&&document.getElementById('log-order').checked&&/^Took charge/.test(document.querySelector('#logbook li .lt').textContent)`));
  shot('logbook');

  // 6. More: the rest-of-the-century card and a setting.
  await settle();
  await tap('.tab[data-tab="more"]', 'more tab');
  check('More offers the rest of the century', await waitFor(`/1930 is free/.test(document.getElementById('unlock-card').textContent)`));
  check('Large text turns on', await tapToggle('#opt-large', 'Large text', `document.documentElement.classList.contains('large')`));
  check('Large text turns off', await tapToggle('#opt-large', 'Large text again', `!document.documentElement.classList.contains('large')`));
  await settle();
  await tap('.tab[data-tab="station"]', 'station tab');

  // 7. Back leaves without a crash, and the year is there on relaunch.
  await settle();
  const kept = await js(`(function(){var s=${S};${K}.save();return {year:s.year,wick:s.bought.wick|0}})()`);
  adb('shell', 'input', 'keyevent', '4');
  await sleep(1500);
  const log1 = adb('logcat', '-d');
  check('Back leaves without a crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log1));
  try { ws.close(); } catch (e) { /* reconnecting */ } ws = null;
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  await sleep(1000);
  check('the year and the purchases are kept on relaunch', await waitFor(`(function(){var s=${S};return s.year>=${kept.year}&&(s.bought.wick|0)===${kept.wick}})()`));
  shot('relaunch');

  // 8. 1930: the free century ends on the first bulb, the sheet offers the rest, and the light keeps earning.
  await js(`(function(){var k=${K};var m=document.getElementById('modal-away');if(m)m.hidden=true;k.setYear(1929,362);k.give({fuel:500,funds:1000});k.ff(6);while(k.state.pendingEvent)k.E.resolveEvent(k.state,0);k.render()})();1`);
  check('1930 holds the calendar and opens the rest-of-the-century sheet', await waitFor(`${S}.gated&&${S}.year===1930&&${shown('modal-unlock')}`, 6000));
  check('without a Play Store the sheet says so', await waitFor(`/Google Play/.test(document.getElementById('u-note').textContent)`, 8000), await js(`document.getElementById('u-note').textContent`));
  shot('1930');
  if (await js(`!document.getElementById('u-buy').disabled`)) {
    await tap('#u-buy', 'Keep the rest of the century');
    check('the buy button answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
  }
  if (await js(`!document.getElementById('u-restore').disabled`)) {
    await tap('#u-restore', 'Restore purchase');
    check('Restore answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
  }
  check('nothing unlocked without Play', await js(`!${K}.billing.state.owned&&!${S}.unlocked&&${S}.gated`));
  await tap('#u-later', 'Not now');
  const held = await js(`({d:${S}.dayIndex,f:${S}.funds})`);
  await sleep(2000);
  check('Not now goes back to the light, which keeps earning while the calendar waits', await js(`${hidden('modal-unlock')}&&${S}.dayIndex===${held.d}&&${S}.funds>${held.f}`));
  await tap('#btn-held', 'See the rest of the century');
  check('the notice opens the sheet again', await waitFor(shown('modal-unlock')));
  await tap('#u-later', 'Not now');

  const log = adb('logcat', '-d');
  check('no crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log));
  check(`no "app not responding"`, !log.includes(`ANR in ${PKG}`));
  check('no errors in the page', pageErrors.length === 0, pageErrors.join(' | '));
  check('the app is still running', alive());
  finish(false);
})().catch(e => { console.log('FAIL tap-through stopped: ' + (e && e.stack || e)); finish(true); });
