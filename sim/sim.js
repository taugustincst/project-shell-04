/* Headless century simulator: node sim/sim.js [strategy|all] [seed]
   Plays Keep the Light with scripted strategies and reports era timings, economy, and the ending.
   Real time assumes the player is present for every calendar day (active play only advances the calendar). */
const E = require('../js/engine.js');
const D = E.D;

const STRATEGIES = {
  // Buys the cheapest thing it can afford, taps the fuel button every tick. The "always on" player.
  greedy: { tick: 0.5, click: s => true, pick: (s, v) => v.sort((a, b) => E.upgradeCost(s, a) - E.upgradeCost(s, b))[0] },
  // Prefers light and signal upgrades, then everything else; taps when the store is under half.
  lamp: { tick: 1, click: s => s.fuel < E.derive(s).store * 0.5, pick: (s, v) => { const pri = { Lamp: 0, Signals: 1, Stores: 2, Keepers: 3, Station: 4, Village: 5 }; return v.sort((a, b) => (pri[a.cat] - pri[b.cat]) || (E.upgradeCost(s, a) - E.upgradeCost(s, b)))[0]; } },
  // Village and legend path, saving for the big civic purchases; never taps after era 1.
  village: { tick: 1, click: s => E.eraFor(s.year).id === 1 && s.fuel < 10, pick: (s, v) => { const pri = { Village: 0, Stores: 1, Keepers: 2, Lamp: 3, Signals: 4, Station: 5 }; return v.sort((a, b) => (pri[a.cat] - pri[b.cat]) || (E.upgradeCost(s, b) - E.upgradeCost(s, a)))[0]; } },
  // Checks in once a "session" (every 15 real minutes), buys what it can, taps a few times. The casual player.
  casual: { tick: 1, session: 900, click: s => s.fuel < E.derive(s).store * 0.8, pick: (s, v) => v.sort((a, b) => E.upgradeCost(s, a) - E.upgradeCost(s, b))[0] },
  // Buys nothing, never taps. What does neglect look like?
  neglect: { tick: 2, click: s => false, pick: () => null }
};

function run(name, seed, opts) {
  opts = opts || {};
  const S = STRATEGIES[name];
  const s = E.newState({ seed, unlocked: true, headland: opts.headland || 'carrow', heirloom: opts.heirloom, speedBonus: opts.speedBonus || 0 });
  let t = 0, era = 1; const eraAt = { 1: 0 }, yearAt = {};
  const eventsByChoice = {}; let lastBuy = D.START_YEAR, allBoughtAt = null;
  let nextSession = 0;
  while (!s.ended && t < 200 * 3600) {
    E.advance(s, S.tick, true); t += S.tick;
    if (s.pendingEvent) { const ev = E.eventById[s.pendingEvent]; const ch = E.eventChoices(s, ev); const i = Math.floor(E.rand(s) * ch.length); eventsByChoice[ev.id] = (eventsByChoice[ev.id] | 0) + 1; E.resolveEvent(s, i); }
    const present = !S.session || t >= nextSession;
    if (present) {
      if (S.session) nextSession = t + S.session;
      if (S.click(s)) for (let k = 0; k < (S.session ? 10 : 1); k++) E.click(s);
      for (let k = 0; k < 5; k++) { const v = E.visibleUpgrades(s).filter(u => E.canBuy(s, u.id)); const u = v.length ? S.pick(s, v) : null; if (!u) break; if (E.buy(s, u.id)) lastBuy = s.year; }
      if (!allBoughtAt && D.UPGRADES.every(u => (s.bought[u.id] | 0) >= (u.max || 1))) allBoughtAt = s.year;
    }
    const e = E.eraFor(s.year).id; if (e !== era) { era = e; eraAt[e] = t; }
    if (!yearAt[s.year]) yearAt[s.year] = t;
  }
  const d = E.derive(s);
  return { name, seed, ended: s.ended, hours: t / 3600, eraHours: { e1: ((eraAt[2] || t) / 3600), e2: (((eraAt[3] || t) - (eraAt[2] || t)) / 3600), e3: ((t - (eraAt[3] || t)) / 3600) }, gateHours: (yearAt[1930] || t) / 3600,
    lastBuy, allBoughtAt, funds: s.funds, income: d.incomePerDay, standing: s.standing, village: s.village, legend: d.legend, auto: d.auto, bought: Object.keys(s.bought).length, stats: s.stats, log: s.log.length, events: Object.keys(eventsByChoice).length, speed: d.speed };
}

const f = (n, p) => (+n).toFixed(p === undefined ? 1 : p);
// The first completion speeds the next century by 25%, each later one by 15% (game.js, capped at +150%).
const prestigeSpeed = n => Math.min(1.5, n <= 0 ? 0 : 0.25 + 0.15 * (n - 1));

if (process.argv[2] === 'check') {
  // node sim/sim.js check [seed]: the balance gates CI holds the game to
  const seed = +(process.argv[3] || 7); const R = {}; for (const n of Object.keys(STRATEGIES)) R[n] = run(n, seed);
  const p2 = run('greedy', seed, { heirloom: 'routine', speedBonus: prestigeSpeed(1) });
  const E1 = require('../js/engine.js'); const fresh = E1.newState({ seed }); const away = E1.offline(fresh, 8 * 3600);
  const era1Tree = D.UPGRADES.filter(u => u.era === 1).reduce((a, u) => { let c = 0; for (let k = 0; k < (u.max || 1); k++) c += Math.round(u.cost * Math.pow(u.costMult || 1, k)); return a + c; }, 0);
  for (const n in R) console.log(`${n.padEnd(8)} ${R[n].ended} ${f(R[n].hours)}h gate ${f(R[n].gateHours)}h last buy ${R[n].lastBuy} all ${R[n].allBoughtAt || '-'} funds £${f(R[n].funds, 0)}`);
  console.log(`prestige2 ${f(p2.hours)}h; a day-one save away 8h earns £${f(away.funds, 0)} over ${away.nights} nights (era-1 tree £${era1Tree})`);
  const active = ['greedy', 'lamp', 'village'];
  const gates = [
    ['8 hours away on day one earns under a tenth of the era-1 tree', away.funds < era1Tree * 0.1 && away.nights <= E1.OFFLINE_NIGHTS, `£${f(away.funds, 0)} of £${era1Tree}`],
    ['the free century (to 1930) is 35 to 65% of a first run', active.every(n => R[n].gateHours / R[n].hours >= 0.35 && R[n].gateHours / R[n].hours <= 0.65), active.map(n => f(R[n].gateHours / R[n].hours, 2)).join(' ')],
    ['active players are still buying in the 1980s', active.every(n => R[n].lastBuy >= 1980), active.map(n => R[n].lastBuy).join(' ')],
    ['era 3 is not bought out early', active.every(n => !R[n].allBoughtAt || R[n].allBoughtAt >= 1975), active.map(n => R[n].allBoughtAt || '-').join(' ')],
    ['a first run takes 4 to 9 hours of play', active.every(n => R[n].hours >= 4 && R[n].hours <= 9), active.map(n => f(R[n].hours)).join(' ')],
    ['the second century is at least 15% faster', p2.hours <= R.greedy.hours * 0.85, `${f(p2.hours)}h vs ${f(R.greedy.hours)}h`],
    ['greedy play ends the century with only low thousands unspent', R.greedy.funds < 10000, `£${f(R.greedy.funds, 0)}`],
    ['no active player ends with more than £15k unspent', active.every(n => R[n].funds < 15000), active.map(n => '£' + f(R[n].funds, 0)).join(' ')],
    ['neglect never reaches a manned light', R.neglect.ended !== 'legend', R.neglect.ended]
  ];
  let bad = 0; for (const [n, ok, why] of gates) { console.log((ok ? 'PASS ' : 'FAIL ') + n + '  ' + why); if (!ok) bad++; }
  process.exit(bad ? 2 : 0);
}

const which = process.argv[2] || 'all', seed = +(process.argv[3] || 7);
const names = which === 'all' ? Object.keys(STRATEGIES) : [which];
for (const n of names) {
  const r = run(n, seed);
  console.log(`${n.padEnd(8)} ending=${r.ended.padEnd(9)} total=${f(r.hours)}h  era1=${f(r.eraHours.e1)}h gate(1930)=${f(r.gateHours)}h era2=${f(r.eraHours.e2)}h era3=${f(r.eraHours.e3)}h  speed=${f(r.speed, 2)}x`);
  console.log(`         last purchase ${r.lastBuy}, everything bought ${r.allBoughtAt || 'never'}`);
  console.log(`         funds=£${f(r.funds, 0)} income/day=£${f(r.income)} standing=${f(r.standing, 0)} village=${f(r.village, 0)} legend=${r.legend} auto=${r.auto} bought=${r.bought}/${D.UPGRADES.length} ships=${r.stats.shipsSaved} wrecks=${r.stats.wrecks} rescues=${r.stats.rescues} dark=${r.stats.darkNights} keepers=${r.stats.keepersRaised} events=${r.stats.eventsResolved}(${r.events} kinds) log=${r.log}`);
}
if (which === 'all') {
  const p = run('greedy', seed, { heirloom: 'routine', speedBonus: prestigeSpeed(1) });
  console.log(`prestige2 (greedy + routine heirloom + 25% speed): total=${f(p.hours)}h ending=${p.ended}`);
  for (const h of ['skerra', 'api', 'fer']) { const r = run('lamp', seed, { headland: h }); console.log(`${h.padEnd(8)} lamp: ending=${r.ended} total=${f(r.hours)}h funds=£${f(r.funds, 0)} standing=${f(r.standing, 0)} wrecks=${r.stats.wrecks} rescues=${r.stats.rescues} dark=${r.stats.darkNights}`); }
}
