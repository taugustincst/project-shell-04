// Headless smoke test: node tests/smoke.js [url]   (defaults to the repo's index.html over file://)
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn, a) => p.evaluate(fn, a);
const fakePlay = owned => {
  const say = m => setTimeout(() => window.__billingEvent(JSON.stringify(m)), 30);
  window.__buys = 0;
  window.AndroidBilling = {
    start(id) { const had = owned || localStorage.getItem('fakeplay.bought') === '1'; say({ type: 'ready', product: id }); say({ type: 'price', product: id, price: '$4.99' }); say({ type: 'owned', product: id, owned: had }); },
    buy(id) { window.__buys++; localStorage.setItem('fakeplay.bought', '1'); say({ type: 'purchased', product: id }); },
    restore(id) { say({ type: 'owned', product: id, owned: localStorage.getItem('fakeplay.bought') === '1' }); }
  };
};
const fresh = async (b, init, arg, junk) => { const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true }); const q = await ctx.newPage(); const qe = []; q.on('pageerror', e => qe.push(e.message)); q.on('console', m => { if (m.type() === 'error') qe.push(m.text()); }); q.on('response', r => { if (r.status() >= 400) qe.push(r.status() + ' ' + r.url()); }); q.on('dialog', d => d.accept()); if (junk) await q.addInitScript(j => { try { localStorage.setItem('keepthelight.v1', j); } catch (e) { } }, junk); if (init) await q.addInitScript(init, arg); await q.goto(base); await q.waitForSelector('#app:not([hidden])'); return { ctx, q, qe }; };
const toGate = q => T(q, () => { const K = window.__keepthelight; K.setYear(1929, 362); K.give({ fuel: 500, funds: 1000 }); K.ff(6); });
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
  // the free century ends on the first bulb in 1930 (website edition: no Play store)
  await toGate(p); await p.waitForTimeout(100);
  if (await p.isVisible('#modal-event')) { await p.click('#event-choices .choice'); await p.waitForTimeout(100); }
  await p.waitForSelector('#modal-unlock:not([hidden])', { timeout: 5000 }).catch(() => {});
  check('1930 holds the calendar and opens the rest-of-the-century sheet', await T(p, () => { const s = window.__keepthelight.state; return s.gated && s.year === 1930 && s.day === 0 && window.__keepthelight.unlockShown(); }));
  check('outside the Play app the sheet says where the unlock is, with buying off', (await p.textContent('#u-note')).includes('Google Play edition') && await p.isDisabled('#u-buy'));
  check('the sheet never talks about restoring removed features', !/restor(e|ing) (the|removed)|removed features|locked features/i.test(await p.textContent('#modal-unlock')));
  await p.click('#u-later'); await p.waitForTimeout(150);
  const held = await T(p, () => ({ d: window.__keepthelight.state.dayIndex, f: window.__keepthelight.state.funds }));
  await p.waitForTimeout(1200);
  check('at the gate the light keeps earning and the calendar waits', await T(p, h => { const s = window.__keepthelight.state; return s.dayIndex === h.d && s.funds > h.f; }, held));
  check('a notice offers the rest of the century', await p.isVisible('#notice #btn-held'));
  await p.click('#btn-held'); await p.waitForSelector('#modal-unlock:not([hidden])'); await p.click('#u-later');
  await p.click('.tab[data-tab="more"]');
  check('More carries the rest-of-the-century card', (await p.textContent('#unlock-card')).includes('1930 is free'));
  await p.click('.tab[data-tab="station"]');
  // save, reload, still held
  const before = await T(p, () => { const K = window.__keepthelight; K.save(); return { y: K.state.year, w: K.state.bought.wick, f: Math.round(K.state.funds) }; });
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  const after = await T(p, () => { const K = window.__keepthelight; return { y: K.state.year, w: K.state.bought.wick, f: K.state.funds, g: K.state.gated, u: K.state.unlocked }; });
  check('the save restores year and purchases, still waiting at 1930', after.y === before.y && after.w === before.w && after.f >= before.f && after.g === true && after.u === false, JSON.stringify(after));
  check('a reload at the gate shows the sheet again', await T(p, () => window.__keepthelight.unlockShown())); await p.click('#u-later');
  // the Play edition: Play's price, buying carries the same century on
  { const { ctx, q, qe } = await fresh(b, fakePlay, false);
    await toGate(q); await q.waitForTimeout(100); if (await q.isVisible('#modal-event')) { await q.click('#event-choices .choice'); }
    await q.waitForSelector('#modal-unlock:not([hidden])'); await q.waitForTimeout(150);
    check('in the Play app the sheet shows Play\'s price', (await q.textContent('#u-buy')).includes('$4.99') && !(await q.isDisabled('#u-buy')));
    const w = await T(q, () => ({ f: window.__keepthelight.state.funds, b: Object.keys(window.__keepthelight.state.bought).length }));
    await q.click('#u-buy'); await q.waitForSelector('#modal-unlock', { state: 'hidden' }); await q.waitForTimeout(300);
    check('buying carries the same century past 1930', await T(q, w => { const s = window.__keepthelight.state; return window.__buys === 1 && s.unlocked && !s.gated && Object.keys(s.bought).length === w.b && s.funds >= w.f; }, w) && await q.isHidden('#notice'));
    await T(q, () => { const K = window.__keepthelight; K.ff(400); while (K.state.pendingEvent) K.E.resolveEvent(K.state, 0); K.ff(400); });
    check('1931 arrives', await T(q, () => window.__keepthelight.state.year >= 1931));
    await q.click('.tab[data-tab="more"]'); check('the card says thank you', (await q.textContent('#unlock-card')).includes('yours'));
    check('no errors in the Play edition run', qe.length === 0, qe.join(' | ')); await ctx.close(); }
  { // a reinstall that Play says owns the unlock, with a save waiting at 1930
    const junk = JSON.stringify({ v: 1, run: { year: 1930, day: 0, gated: true, funds: 88, unlocked: false } });
    const { ctx, q, qe } = await fresh(b, fakePlay, true, junk); await q.waitForTimeout(400);
    check('a reinstall that Play says owns the unlock carries 1930 on', await T(q, () => { const s = window.__keepthelight.state; return s.unlocked && !s.gated && s.funds >= 88; }) && await q.isHidden('#modal-unlock'), qe.join(' | '));
    await ctx.close(); }
  // corrupt and doctored saves are fail-soft, and none carries the unlock
  for (const [label, junk] of [['truncated JSON', '{"run":{"year":"zzz","funds":"1e999","bought":{"x":1}},"meta":{"unlocked":"yes"}'], ['wrong types', '{"v":1,"run":{"year":"zzz","funds":"1e999","bought":{"x":1},"log":"no"},"meta":{"unlocked":"yes"},"lastSeen":"soon"}'], ['not an object', '42'], ['a save that claims the unlock', '{"v":1,"run":{"year":1962,"day":4,"funds":10,"unlocked":true}}']]) {
    const { ctx, q, qe } = await fresh(b, null, null, junk);
    check('a mangled or doctored save loads without the unlock: ' + label, qe.length === 0 && await T(q, () => { const s = window.__keepthelight.state; return s.year >= 1890 && isFinite(s.funds) && s.unlocked === false && (s.year < 1930 || s.gated); }), qe.join(' | '));
    await ctx.close();
  }
  { // a corrupt save falls back to the last good copy
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qe = []; q.on('pageerror', e => qe.push(e.message));
    await q.addInitScript(() => { try { if (!sessionStorage.getItem('planted')) { sessionStorage.setItem('planted', '1'); localStorage.setItem('keepthelight.v1.backup', JSON.stringify({ v: 1, run: { year: 1911, day: 5, funds: 321 } })); localStorage.setItem('keepthelight.v1', '{"run":'); } } catch (e) { } });
    await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a save that will not parse falls back to the backup', qe.length === 0 && await T(q, () => window.__keepthelight.state.year === 1911), qe.join(' | '));
    await ctx.close(); }
  { // a pasted save code never carries the unlock
    const { ctx, q, qe } = await fresh(b, null, null, null);
    const code = Buffer.from(JSON.stringify({ run: { year: 1950, day: 2, funds: 50, unlocked: true }, meta: { completions: 0 } })).toString('base64');
    q.removeAllListeners('dialog'); q.on('dialog', d => d.type() === 'prompt' ? d.accept(code) : d.accept());
    await q.click('.tab[data-tab="more"]'); await q.click('#btn-import'); await q.waitForTimeout(200);
    check('a save code past 1930 imports and waits at the gate', qe.length === 0 && await T(q, () => { const s = window.__keepthelight.state; return s.year === 1950 && s.unlocked === false && s.gated; }), qe.join(' | '));
    await ctx.close(); }
  // offline: an 8-hour absence on day one is a modest purse, not the oil years
  { const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qe = []; q.on('pageerror', e => qe.push(e.message));
    await q.addInitScript(() => { try { if (!sessionStorage.getItem('planted')) { sessionStorage.setItem('planted', '1'); localStorage.setItem('keepthelight.v1', JSON.stringify({ v: 1, run: { year: 1890, day: 3, funds: 20, fuel: 30 }, lastSeen: Date.now() - 8 * 3600 * 1000 })); } } catch (e) { } });
    await q.goto(base); await q.waitForSelector('#modal-away:not([hidden])');
    const away = await q.textContent('#away-text');
    check('8 hours away says hours, and earns a modest purse', /^8 hours\./.test(away) && await T(q, () => window.__keepthelight.state.funds < 700), away);
    await ctx.close(); }
  // the ending and a new headland (the whole century, owned in the Play edition)
  { const { ctx, q, qe } = await fresh(b, fakePlay, true); await q.waitForTimeout(300);
    await T(q, () => { const K = window.__keepthelight; K.setYear(1989, 363); K.give({ fuel: 500, funds: 1e6, standing: 900 }); K.state.flags.fight = true; K.state.legendBonus = 12; K.ff(5); });
    await q.waitForSelector('#modal-ending:not([hidden])', { timeout: 5000 });
    check('1990 ends the century as a legend', (await q.textContent('#ending-title')).includes('Legend'));
    check('new headlands unlock after a completion', (await q.locator('#sel-headland option').count()) === 4);
    await q.selectOption('#sel-headland', 'skerra'); await q.click('#btn-prestige'); await q.waitForTimeout(200);
    check('taking charge of a new light starts 1890 again, a quarter faster', await T(q, () => { const K = window.__keepthelight; return K.state.year === 1890 && K.state.headland === 'skerra' && Math.abs(K.state.speedBonus - 0.25) < 1e-9 && K.state.unlocked; }));
    check('no errors in the ending run', qe.length === 0, qe.join(' | ')); await ctx.close(); }
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
