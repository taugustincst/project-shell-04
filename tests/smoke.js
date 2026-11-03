// Headless smoke test: node tests/smoke.js [url]   (defaults to the repo's index.html over file://)
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn) => p.evaluate(fn);
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  p.on('dialog', d => d.accept());
  await p.goto(base); await p.waitForSelector('#app:not([hidden])');
  check('starts in 1890 at Carrow Point', (await p.textContent('#hdr-date')).includes('Carrow Point · 1890'));
  check('the logbook opens with the first entry', (await T(p, () => window.__keepthelight.state.log[0].t)).startsWith('Took charge of Carrow Point'));
  const fuel0 = await T(p, () => window.__keepthelight.state.fuel); await p.click('#btn-click');
  check('hauling oil fills the store', (await T(p, () => window.__keepthelight.state.fuel)) > fuel0);
  await T(p, () => window.__keepthelight.give({ funds: 500 }));
  await p.waitForSelector('[data-buy="wick"]:not([disabled])'); await p.click('[data-buy="wick"]');
  check('buying an upgrade marks it owned', await T(p, () => window.__keepthelight.state.bought.wick === 1));
  check('the calendar advances with the page open', await p.waitForFunction(() => window.__keepthelight.state.dayIndex > 0, null, { timeout: 8000 }).then(() => true).catch(() => false));
  await T(p, () => window.__keepthelight.forceEvent('storm')); await p.waitForSelector('#modal-event:not([hidden])');
  check('an event opens a sheet with choices', (await p.locator('#event-choices .choice').count()) >= 2);
  await p.click('#event-choices .choice'); await p.waitForTimeout(100);
  check('choosing resolves the event into the logbook', await T(p, () => !window.__keepthelight.state.pendingEvent && window.__keepthelight.state.log.some(l => l.k === 'event')));
  // the gate
  await T(p, () => { const K = window.__keepthelight; K.setYear(1929, 362); K.give({ fuel: 500, funds: 1000 }); K.ff(6); });
  await p.waitForSelector('#modal-gate:not([hidden])', { timeout: 5000 });
  check('the free century stops at 1930 with the unlock sheet', await T(p, () => window.__keepthelight.state.gated && window.__keepthelight.state.year === 1930));
  await p.click('#btn-gate-later'); await p.waitForTimeout(100);
  await p.click('.tab[data-tab="more"]'); await p.click('#btn-unlock'); await p.waitForTimeout(200);
  check('without Play Billing, unlock explains itself and stays locked', await T(p, () => !window.__keepthelight.state.unlocked && !document.getElementById('toast').hidden));
  await T(p, () => window.__keepthelight.unlock());
  check('unlock resumes the calendar', await T(p, () => window.__keepthelight.state.unlocked && !window.__keepthelight.state.gated));
  // save, reload, continue
  const before = await T(p, () => { const K = window.__keepthelight; K.save(); return { y: K.state.year, w: K.state.bought.wick, f: Math.round(K.state.funds) }; });
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  const after = await T(p, () => { const K = window.__keepthelight; return { y: K.state.year, w: K.state.bought.wick, f: Math.round(K.state.funds), u: K.state.unlocked }; });
  check('the save restores year, purchases and the unlock', after.y === before.y && after.w === before.w && after.u === true, JSON.stringify(after));
  // corrupt saves are fail-soft (planted before the page's scripts run, in a fresh context)
  for (const [label, junk] of [['truncated JSON', '{"run":{"year":"zzz","funds":"1e999","bought":{"x":1}},"meta":{"unlocked":"yes"}'], ['wrong types', '{"v":1,"run":{"year":"zzz","funds":"1e999","bought":{"x":1},"log":"no"},"meta":{"unlocked":"yes"},"lastSeen":"soon"}'], ['not an object', '42']]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = [];
    q.on('pageerror', e => qerrs.push(e.message));
    await q.addInitScript(j => { try { localStorage.setItem('keepthelight.v1', j); } catch (e) { } }, junk);
    await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a mangled save still loads: ' + label, qerrs.length === 0 && await T(q, () => { const s = window.__keepthelight.state; return s.year >= 1890 && isFinite(s.funds) && s.unlocked === false; }), qerrs.join(' | '));
    await ctx.close();
  }
  // the ending and a new headland
  await T(p, () => { const K = window.__keepthelight; K.unlock(); K.setYear(1989, 363); K.give({ fuel: 500, funds: 1e6, standing: 900 }); K.state.flags.fight = true; K.state.legendBonus = 12; K.ff(5); });
  await p.waitForSelector('#modal-ending:not([hidden])', { timeout: 5000 });
  check('1990 ends the century as a legend', (await p.textContent('#ending-title')).includes('Legend'));
  check('new headlands unlock after a completion', (await p.locator('#sel-headland option').count()) === 4);
  await p.selectOption('#sel-headland', 'skerra'); await p.click('#btn-prestige'); await p.waitForTimeout(200);
  check('taking charge of a new light starts 1890 again, faster', await T(p, () => { const K = window.__keepthelight; return K.state.year === 1890 && K.state.headland === 'skerra' && K.state.speedBonus > 0; }));
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
