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
  const eventsByChoice = {};
  let nextSession = 0;
  while (!s.ended && t < 200 * 3600) {
    E.advance(s, S.tick, true); t += S.tick;
    if (s.pendingEvent) { const ev = E.eventById[s.pendingEvent]; const ch = E.eventChoices(s, ev); const i = Math.floor(E.rand(s) * ch.length); eventsByChoice[ev.id] = (eventsByChoice[ev.id] | 0) + 1; E.resolveEvent(s, i); }
    const present = !S.session || t >= nextSession;
    if (present) {
      if (S.session) nextSession = t + S.session;
      if (S.click(s)) for (let k = 0; k < (S.session ? 10 : 1); k++) E.click(s);
      for (let k = 0; k < 5; k++) { const v = E.visibleUpgrades(s).filter(u => E.canBuy(s, u.id)); const u = v.length ? S.pick(s, v) : null; if (!u) break; E.buy(s, u.id); }
    }
    const e = E.eraFor(s.year).id; if (e !== era) { era = e; eraAt[e] = t; }
    if (s.day === 0 && !yearAt[s.year]) yearAt[s.year] = t;
  }
  const d = E.derive(s);
  return { name, seed, ended: s.ended, hours: t / 3600, eraHours: { e1: ((eraAt[2] || t) / 3600), e2: (((eraAt[3] || t) - (eraAt[2] || t)) / 3600), e3: ((t - (eraAt[3] || t)) / 3600) }, gateHours: (yearAt[1930] || t) / 3600,
    funds: s.funds, income: d.incomePerDay, standing: s.standing, village: s.village, legend: d.legend, auto: d.auto, bought: Object.keys(s.bought).length, stats: s.stats, log: s.log.length, events: Object.keys(eventsByChoice).length, speed: d.speed };
}

const which = process.argv[2] || 'all', seed = +(process.argv[3] || 7);
const names = which === 'all' ? Object.keys(STRATEGIES) : [which];
const f = (n, p) => (+n).toFixed(p === undefined ? 1 : p);
for (const n of names) {
  const r = run(n, seed);
  console.log(`${n.padEnd(8)} ending=${r.ended.padEnd(9)} total=${f(r.hours)}h  era1=${f(r.eraHours.e1)}h gate(1930)=${f(r.gateHours)}h era2=${f(r.eraHours.e2)}h era3=${f(r.eraHours.e3)}h  speed=${f(r.speed, 2)}x`);
  console.log(`         funds=£${f(r.funds, 0)} income/day=£${f(r.income)} standing=${f(r.standing, 0)} village=${f(r.village, 0)} legend=${r.legend} auto=${r.auto} bought=${r.bought}/${D.UPGRADES.length} ships=${r.stats.shipsSaved} wrecks=${r.stats.wrecks} rescues=${r.stats.rescues} dark=${r.stats.darkNights} keepers=${r.stats.keepersRaised} events=${r.stats.eventsResolved}(${r.events} kinds) log=${r.log}`);
}
if (which === 'all') {
  const p = run('greedy', seed, { heirloom: 'routine', speedBonus: 0.1 });
  console.log(`prestige2 (greedy + routine heirloom + 10% speed): total=${f(p.hours)}h ending=${p.ended}`);
  for (const h of ['skerra', 'api', 'fer']) { const r = run('lamp', seed, { headland: h }); console.log(`${h.padEnd(8)} lamp: ending=${r.ended} total=${f(r.hours)}h funds=£${f(r.funds, 0)} standing=${f(r.standing, 0)} wrecks=${r.stats.wrecks} rescues=${r.stats.rescues} dark=${r.stats.darkNights}`); }
}
