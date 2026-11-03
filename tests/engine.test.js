// Engine unit tests: node tests/engine.test.js
const assert = require('assert'); const E = require('../js/engine.js'); const D = E.D;
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('PASS ' + name); } catch (e) { console.log('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; } };

t('same seed, same century', () => {
  const play = () => { const s = E.newState({ seed: 42, unlocked: true }); for (let i = 0; i < 20000; i++) { E.advance(s, 1, true); if (s.pendingEvent) E.resolveEvent(s, 0); E.click(s); const v = E.visibleUpgrades(s).filter(u => E.canBuy(s, u.id)); if (v.length) E.buy(s, v[0].id); } return JSON.stringify([s.year, s.day, s.funds, s.stats, s.log.length]); };
  assert.strictEqual(play(), play());
});
t('the calendar runs straight through 1930 with no gate', () => {
  const s = E.newState({ seed: 1 }); assert.strictEqual(s.unlocked, true); s.bought.contract = 4; s.bought.store = 4; s.funds = 1e6; s.year = 1929; s.day = 360; s.dayIndex = 39 * 365 + 360;
  E.advance(s, 60, false); assert.ok(s.year === 1930 && s.day > 0, 'past 1930 day 0'); assert.ok(!s.gated);
  for (let i = 0; i < 5000 && s.year < 1931; i++) { E.advance(s, 5, false); if (s.pendingEvent) E.resolveEvent(s, 0); }
  assert.ok(s.year >= 1931, 'into 1931'); assert.ok(!s.log.some(l => /free part|the unlock/i.test(l.t)), 'no stop line in the logbook');
});
t('old saves and save codes stopped at 1930 load with the whole century open', () => {
  const r = E.sanitize({ year: 1930, day: 0, funds: 100, fuel: 100, unlocked: false, gated: true, milestones: { gate: 1, era2: 1 }, log: [{ y: 1929, d: 2, t: 'A quiet night.', k: 'story' }, { y: 1930, d: 0, t: 'Here the free part of the century ends: forty years.', k: 'milestone' }] });
  assert.strictEqual(r.unlocked, true); assert.ok(!r.gated); assert.strictEqual(r.log.length, 1); assert.strictEqual(r.milestones.gate, undefined);
  E.advance(r, 60, false); assert.ok(r.year > 1930 || r.day > 0, 'calendar moves');
});
t('the century ends in 1990 with an ending and a closing log line', () => {
  const s = E.newState({ seed: 3, unlocked: true }); s.year = 1989; s.day = 364; s.dayIndex = 99 * 365 + 364; s.funds = 1e6;
  E.advance(s, 10, false); assert.ok(['legend', 'automated', 'overruled'].includes(s.ended), s.ended); assert.ok(s.log[s.log.length - 1].k === 'ending');
  assert.strictEqual(E.advance(s, 100, true), 0);
});
t('fighting with the case made is a legend; preparing is automation', () => {
  const s = E.newState({ seed: 3, unlocked: true }); s.year = 1989; s.standing = 1000; s.flags.fight = true; s.legendBonus = 12; assert.strictEqual(E.endingFor(s), 'legend');
  s.legendBonus = 0; assert.strictEqual(E.endingFor(s), 'overruled'); s.flags.prepare = true; assert.strictEqual(E.endingFor(s), 'automated');
});
t('offline earns but never moves the calendar, and is capped', () => {
  const s = E.newState({ seed: 5, unlocked: true }); s.bought.contract = 4; s.bought.store = 3; s.funds = 500; const y = s.year, d = s.day, f = s.funds;
  const sum = E.offline(s, 3 * 24 * 3600); assert.ok(sum && sum.nights > 0); assert.strictEqual(s.year, y); assert.strictEqual(s.day, d); assert.ok(sum.nights <= Math.floor(E.OFFLINE_CAP / E.derive(s).dayLen) + 1, 'capped');
  assert.ok(s.log[s.log.length - 1].k === 'away');
  assert.strictEqual(E.offline(s, -5000), null, 'clock going backwards earns nothing'); assert.strictEqual(E.offline(s, NaN), null);
});
t('sanitize survives garbage and clamps absurd values', () => {
  assert.strictEqual(E.sanitize(null), null); assert.strictEqual(E.sanitize('x'), null);
  const s = E.sanitize({ year: 2500, day: -4, fuel: 'NaN', funds: Infinity, standing: -9, village: 1e99, bought: { nope: 3, store: 99, wick: '1' }, log: [{ t: 7 }, { t: 'ok', y: 'q' }], pendingEvent: 'nonsense', ended: 'wat', mods: [{ key: 'range', mult: 'x' }, { key: 'range', mult: 0.5, until: 10 }], headland: 'atlantis', stats: { shipsSaved: -3, wrecks: 'many' } });
  assert.strictEqual(s.year, D.END_YEAR); assert.strictEqual(s.day, 0); assert.strictEqual(s.fuel, 0); assert.ok(s.funds <= 1e12); assert.strictEqual(s.standing, 0); assert.strictEqual(s.village, 1e7);
  assert.strictEqual(s.bought.nope, undefined); assert.strictEqual(s.bought.store, 4); assert.strictEqual(s.bought.wick, 1); assert.strictEqual(s.log.length, 1); assert.strictEqual(s.pendingEvent, null); assert.strictEqual(s.ended, null);
  assert.strictEqual(s.mods.length, 1); assert.strictEqual(s.headland, 'carrow'); assert.strictEqual(s.stats.shipsSaved, 0); assert.strictEqual(s.stats.wrecks, 0);
});
t('a sanitized save round-trips', () => {
  const s = E.newState({ seed: 9, unlocked: true }); for (let i = 0; i < 3000; i++) { E.advance(s, 1, true); if (s.pendingEvent) E.resolveEvent(s, 0); E.click(s); }
  const r = E.sanitize(JSON.parse(JSON.stringify(s))); for (const k of ['year', 'day', 'fuel', 'funds', 'standing', 'village', 'seed']) assert.strictEqual(r[k], s[k], k);
  assert.deepStrictEqual(r.bought, s.bought); assert.strictEqual(r.log.length, s.log.length);
});
t('every event choice applies without throwing, on every headland', () => {
  for (const h of Object.keys(D.HEADLANDS)) for (const ev of D.EVENTS) for (let i = 0; i < ev.choices.length; i++) {
    const s = E.newState({ seed: 11, unlocked: true, headland: h }); s.year = ev.window[0]; s.bought.assistant = 1; s.bought.cottage = 1; s.funds = 1000; s.fuel = 50;
    assert.ok(E.forceEvent(s, ev.id)); const ch = E.eventChoices(s, ev); if (i >= ch.length) continue; assert.ok(E.resolveEvent(s, i), ev.id); assert.ok(isFinite(s.funds) && isFinite(s.fuel) && isFinite(s.standing) && isFinite(s.village));
  }
});
t('every upgrade is reachable by 1990 and its requirements exist', () => {
  for (const u of D.UPGRADES) { if (u.req) for (const r of u.req) assert.ok(E.upgradeById[r], u.id + ' requires unknown ' + r); assert.ok(D.ERAS[u.era - 1], u.id); }
  const s = E.newState({ seed: 2, unlocked: true }); s.year = 1989; s.funds = 1e9; s.standing = 1e6; let bought = 0;
  for (let pass = 0; pass < 5; pass++) for (const u of D.UPGRADES) while (E.canBuy(s, u.id)) { E.buy(s, u.id); bought++; }
  assert.strictEqual(Object.keys(s.bought).length, D.UPGRADES.length);
});
t('scheduled story events fire on their day', () => {
  const s = E.newState({ seed: 4, unlocked: true }); s.year = 1979; s.day = 10; s.dayIndex = 89 * 365 + 10; s.fuel = 500; s.bought.mains = 1;
  E.advance(s, 20, true); assert.strictEqual(s.pendingEvent, 'letter1979');
});
t('heirlooms and headlands', () => {
  const s = E.newState({ seed: 1, unlocked: true, headland: 'skerra', heirloom: 'bell' }); assert.strictEqual(s.bought.bell, 1); assert.strictEqual(s.heirloom, 'bell');
  const bad = E.newState({ seed: 1, heirloom: 'mains' }); assert.strictEqual(bad.bought.mains, undefined, 'mains is not an era-1 heirloom'); 
  assert.deepStrictEqual(E.headlandOptions({}).map(h => h.id), ['carrow']); assert.deepStrictEqual(E.headlandOptions({ completions: 1, legends: 0 }).map(h => h.id), ['carrow', 'skerra', 'api']); assert.strictEqual(E.headlandOptions({ completions: 1, legends: 1 }).length, 4);
  assert.ok(s.log[0].t.startsWith('Took charge of Skerra Head'));
});
console.log(process.exitCode ? 'SOME FAILED' : `ALL ${n} PASSED`);
