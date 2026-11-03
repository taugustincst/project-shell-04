/* Keep the Light — numbers engine. Pure functions over a plain state object; no DOM, no timers.
   Runs in the browser (window.KTL) and in Node (sim/sim.js) so the century can be simulated headlessly. */
(function (root) {
'use strict';
const D = (typeof KTL_DATA !== 'undefined') ? KTL_DATA : require('./data.js');

const DAY_BASE = 1.5;              // real seconds per game day at speed 1
const DAYS_PER_YEAR = 365;
const OFFLINE_CAP = 8 * 3600;      // seconds of away-time that still earn
const EVENT_GAP = 75;              // minimum days between events
const EVENT_CHANCE = 1 / 100;       // per day, once the gap has passed
const LOG_CAP = 600;
const LEGEND_POINTS = 10, LEGEND_STANDING = 500;

const upgradeById = {}; D.UPGRADES.forEach(u => { upgradeById[u.id] = u; });
const eventById = {}; D.EVENTS.forEach(e => { eventById[e.id] = e; });

/* ---------- deterministic RNG (mulberry32 over state.seed) ---------- */
function rand(s) {
  s.seed = (s.seed + 0x6D2B79F5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/* ---------- state ---------- */
function newState(opts) {
  opts = opts || {};
  const headland = D.HEADLANDS[opts.headland] ? opts.headland : 'carrow';
  const s = {
    v: 1, headland, prestige: opts.prestige | 0, speedBonus: +opts.speedBonus || 0,
    seed: (opts.seed | 0) || ((Date.now() ^ (Math.random() * 1e9)) | 0),
    year: D.START_YEAR, day: 0, dayIndex: 0, acc: 0,
    fuel: 20, funds: 20, standing: 10, village: 40,
    bought: {}, flags: {}, mods: [], eventsSeen: {}, lastEventDay: -999, pendingEvent: null,
    darkDays: 0, shipAcc: 0, salaryBonus: 0, legendBonus: 0, autoBonus: 0,
    stats: { shipsSaved: 0, wrecks: 0, rescues: 0, keepersRaised: 0, darkNights: 0, litNights: 0, fundsEarned: 0, eventsResolved: 0, clicks: 0 },
    log: [], logFired: {}, milestones: {},
    unlocked: true, ended: null, heirloom: null
  };
  if (opts.heirloom && upgradeById[opts.heirloom] && upgradeById[opts.heirloom].heirloom) { s.bought[opts.heirloom] = 1; s.heirloom = opts.heirloom; }
  fireLogbook(s);
  return s;
}

function eraFor(year) { for (let i = D.ERAS.length - 1; i >= 0; i--) if (year >= D.ERAS[i].from) return D.ERAS[i]; return D.ERAS[0]; }
function isWar(s) { const h = D.HEADLANDS[s.headland]; if (h.mods.alwaysWar) return true; return (s.year >= 1914 && s.year <= 1918) || (s.year >= 1939 && s.year <= 1945); }
function hName(s) { return D.HEADLANDS[s.headland].name; }
function fmtDate(s) { return `${s.year} · day ${s.day + 1}`; }

/* ---------- derived numbers: everything the day step needs, from upgrades + headland + temporary mods ---------- */
function derive(s) {
  const e = { fuelEff: 1, range: 1, supply: 0, store: 30, clickMult: 1, salaryAdd: 0, speed: 1, villageGrowth: 1, villageCap: 120, wreck: 1, dues: 1, standingRate: 1, trade: 1, stormShield: 1, warShield: 1, rescue: false, standby: false, mains: false, electrified: false, legend: 0, auto: 0, keepers: 1 };
  for (const id in s.bought) {
    const u = upgradeById[id]; const n = s.bought[id] | 0; if (!u || n <= 0) continue;
    const f = u.eff;
    for (const k in f) {
      const v = f[k];
      if (k === 'supplyAdd') e.supply += v * n; else if (k === 'storeAdd') e.store += v * n; else if (k === 'salaryAdd') e.salaryAdd += v * n;
      else if (k === 'villageCapAdd') e.villageCap += v * n; else if (k === 'keepers') e.keepers += v * n;
      else if (k === 'legend' || k === 'auto') e[k] += v * n;
      else if (typeof v === 'boolean') e[k] = e[k] || v;
      else e[k] *= Math.pow(v, n);
    }
  }
  const h = D.HEADLANDS[s.headland].mods, era = eraFor(s.year), war = isWar(s);
  for (const m of s.mods) if (m.until > s.dayIndex) { if (m.key === 'range') e.range *= m.mult; else if (m.key === 'supply') e.supply *= m.mult; else if (m.key === 'speed') e.speed *= m.mult; }
  const d = {};
  d.era = era; d.war = war; d.eff = e;
  d.speed = e.speed * (1 + s.speedBonus);
  d.dayLen = DAY_BASE / d.speed;
  d.fuelUse = 1.0 * e.fuelEff * (h.fuelUse || 1);
  d.fuelPrice = era.fuelPrice * (h.fuelPrice || 1);
  d.store = e.store;
  d.supply = e.supply;
  d.mains = e.mains; d.standby = e.standby; d.rescue = e.rescue; d.electrified = e.electrified;
  d.click = era.clickFuel * e.clickMult;
  const t = (s.year - D.START_YEAR) / 100;
  const harbour = 1 + 0.18 * Math.log2(Math.max(40, s.village) / 40);
  d.traffic = (1.5 + 3.5 * Math.pow(t, 1.2)) * (h.traffic || 1) * (war ? 1.35 : 1) * harbour;
  d.dues = 0.5 * e.dues * Math.pow(e.range, 0.4) * (h.dues || 1);
  d.standingPerShip = 0.006 * e.standingRate * (h.standingRate || 1);
  d.wreckChance = Math.min(0.6, 0.08 * e.wreck * (h.wreck || 1) * (war ? 1.6 * e.warShield : 1));
  d.salary = (1.0 + e.salaryAdd + s.salaryBonus) * (h.salary || 1);
  d.trade = s.village * 0.004 * e.trade;
  d.villageGrowth = 0.03 * e.villageGrowth * (h.villageGrowth || 1) * Math.pow(Math.max(40, s.village) / 40, 0.5);
  d.villageCap = e.villageCap;
  d.legend = e.legend + s.legendBonus; d.auto = e.auto + s.autoBonus;
  d.keepers = e.keepers;
  d.incomePerDay = d.salary + d.trade + d.traffic * d.dues; // if lit
  d.fuelCostPerDay = d.mains ? d.fuelUse * d.fuelPrice : Math.min(d.supply, d.fuelUse) * d.fuelPrice;
  return d;
}

/* ---------- logbook ---------- */
function pushLog(s, text, kind) {
  s.log.push({ y: s.year, d: s.day, t: text.replace(/\{headland\}/g, hName(s)), k: kind || 'story' });
  if (s.log.length > LOG_CAP) s.log.splice(0, s.log.length - LOG_CAP);
}
function fireLogbook(s) {
  for (let i = 0; i < D.LOGBOOK.length; i++) {
    const L = D.LOGBOOK[i];
    if (L.y !== s.year || (L.d || 0) !== s.day) continue;
    if (L.headland && L.headland !== s.headland) continue;
    if (!L.headland && s.headland !== 'carrow' && L.y === D.START_YEAR && (L.d || 0) === 0) continue; // other headlands have their own first entry
    if (s.logFired[i]) continue;
    s.logFired[i] = 1; pushLog(s, L.t, 'story');
  }
}
function milestone(s, key, vars) {
  if (s.milestones[key]) return; s.milestones[key] = 1;
  let t = D.MILESTONES[key]; if (!t) return;
  if (vars) for (const k in vars) t = t.replace('{' + k + '}', vars[k]);
  pushLog(s, t, 'milestone');
}

/* ---------- one day ---------- */
function stepDay(s, d, active) {
  s.dayIndex++; s.day++;
  if (s.day >= DAYS_PER_YEAR) {
    s.day = 0; s.year++;
    const era = eraFor(s.year);
    if (era.id === 2) milestone(s, 'era2'); if (era.id === 3) milestone(s, 'era3');
    if (s.year >= D.END_YEAR) { s.year = D.END_YEAR; finishRun(s); return; }
    d = derive(s);
  }
  if (s.mods.length) s.mods = s.mods.filter(m => m.until > s.dayIndex);
  economyDay(s, d, true, active);
  fireLogbook(s);
  if (!s.pendingEvent) for (const e of D.EVENTS) if (e.at && e.at.y === s.year && e.at.d === s.day && !s.eventsSeen[e.id] && (!e.headland || e.headland === s.headland)) { s.pendingEvent = e.id; s.lastEventDay = s.dayIndex; break; }
  if (active && !s.pendingEvent && s.dayIndex - s.lastEventDay >= EVENT_GAP && rand(s) < EVENT_CHANCE) {
    const ev = pickEvent(s); if (ev) { s.pendingEvent = ev.id; s.lastEventDay = s.dayIndex; }
  }
}

/* The economy of one night. calendar=false is used for offline earning: no story, no wrecks, no village. */
function economyDay(s, d, calendar, active) {
  // supply
  if (d.mains) { s.fuel = d.store; }
  else {
    const want = Math.max(0, Math.min(d.supply, d.store - s.fuel));
    const buy = Math.min(want, d.fuelPrice > 0 ? s.funds / d.fuelPrice : want);
    if (buy > 0) { s.fuel += buy; s.funds -= buy * d.fuelPrice; }
  }
  // the light
  let lit;
  if (s.darkDays > 0) { s.darkDays--; lit = false; }
  else if (s.fuel >= d.fuelUse) { s.fuel -= d.fuelUse; lit = true; if (d.mains) s.funds -= d.fuelUse * d.fuelPrice; }
  else if (d.standby) { lit = true; s.funds -= d.fuelUse * d.fuelPrice * 3; }
  else lit = false;
  if (s.funds < 0) s.funds = 0;
  // ships
  s.shipAcc += d.traffic; const n = Math.floor(s.shipAcc); s.shipAcc -= n;
  if (lit) {
    s.stats.shipsSaved += n; s.stats.litNights++;
    const earned = n * d.dues; s.funds += earned; s.stats.fundsEarned += earned;
    s.standing += n * d.standingPerShip;
  } else {
    s.stats.darkNights++;
    if (calendar) {
      milestone(s, 'firstDark');
      for (let i = 0; i < n; i++) if (rand(s) < d.wreckChance) {
        const ship = D.SHIP_NAMES[Math.floor(rand(s) * D.SHIP_NAMES.length)];
        if (d.rescue) { s.stats.rescues++; s.standing -= 0.5; milestone(s, 'firstRescue', { ship }); }
        else { s.stats.wrecks++; s.standing -= 3; s.funds = Math.max(0, s.funds - 10); milestone(s, 'firstWreck', { ship }); }
      }
    }
  }
  if (s.standing < 0) s.standing = 0;
  const base = d.salary + d.trade; s.funds += base; s.stats.fundsEarned += base;
  // village
  if (calendar) {
    const g = d.villageGrowth * (lit ? 1 : 0.1);
    if (s.village < d.villageCap) s.village = Math.min(d.villageCap, s.village + g);
    if (s.village >= 100) milestone(s, 'village100'); if (s.village >= 500) milestone(s, 'village500'); if (s.village >= 2000) milestone(s, 'village2000');
    if (s.stats.shipsSaved >= 1000) milestone(s, 'ships1000'); if (s.stats.shipsSaved >= 10000) milestone(s, 'ships10000'); if (s.stats.shipsSaved >= 50000) milestone(s, 'ships50000');
  }
  return lit;
}

/* Advance real seconds of active play. Returns days stepped. Calendar stops for a pending event or the ending. */
function advance(s, dt, active) {
  if (!(dt > 0)) return 0;
  if (s.ended) return 0;
  if (s.pendingEvent) return 0;
  let d = derive(s);
  s.acc += dt;
  let stepped = 0;
  while (s.acc >= d.dayLen) {
    s.acc -= d.dayLen; stepDay(s, d, active); stepped++;
    if (s.ended || s.pendingEvent) { s.acc = 0; break; }
    if (stepped % 10 === 0) d = derive(s);
  }
  return stepped;
}

/* Offline: the light keeps working while you are away; the calendar and the story wait for you. */
function offline(s, elapsedSeconds) {
  const secs = Math.max(0, Math.min(OFFLINE_CAP, +elapsedSeconds || 0));
  if (s.ended || secs < 30) return null;
  const d = derive(s);
  const nights = Math.floor(secs / d.dayLen);
  if (nights < 1) return null;
  const before = { ships: s.stats.shipsSaved, funds: s.funds, dark: s.stats.darkNights };
  let dryAfter = -1;
  for (let i = 0; i < nights; i++) { const lit = economyDay(s, d, false, false); if (!lit && dryAfter < 0) dryAfter = i; }
  const sum = { nights, ships: s.stats.shipsSaved - before.ships, funds: s.funds - before.funds, dryAfter };
  const t = dryAfter < 0 ? `Away ${nights} nights. The light kept: ${sum.ships} ships guided, £${sum.funds.toFixed(0)} to the purse.`
    : `Away ${nights} nights. The store ran dry after ${dryAfter}; the light was dark the rest. ${sum.ships} ships guided, £${sum.funds.toFixed(0)} to the purse.`;
  pushLog(s, t, 'away');
  return sum;
}

/* ---------- actions ---------- */
function click(s) { if (s.ended) return 0; const d = derive(s); const add = Math.min(d.click, Math.max(0, d.store - s.fuel)); s.fuel += add; s.stats.clicks++; return add; }

function upgradeCost(s, u) { const n = s.bought[u.id] | 0; const era = D.ERAS[u.era - 1]; return Math.round(u.cost * (era.costScale || 1) * Math.pow(u.costMult || 1, n)); }
function upgradeAvailable(s, u) {
  const era = eraFor(s.year).id;
  if (u.era > era) return false;
  if (u.year && s.year < u.year) return false;
  if ((s.bought[u.id] | 0) >= (u.max || 1)) return false;
  if (u.req) for (const r of u.req) if (!(s.bought[r] | 0)) return false;
  return true;
}
function standingOk(s, u) { return !u.needStanding || s.standing >= u.needStanding; }
function visibleUpgrades(s) { return D.UPGRADES.filter(u => upgradeAvailable(s, u)); }
function canBuy(s, id) { const u = upgradeById[id]; return !!u && !s.ended && upgradeAvailable(s, u) && standingOk(s, u) && s.funds >= upgradeCost(s, u); }
function buy(s, id) {
  if (!canBuy(s, id)) return false;
  const u = upgradeById[id]; s.funds -= upgradeCost(s, u); s.bought[id] = (s.bought[id] | 0) + 1;
  if (u.eff.electrified) milestone(s, 'electrified');
  return true;
}

/* ---------- events ---------- */
function condOk(s, c) {
  if (!c) return true;
  if (c[0] === '!') return !condOk(s, c.slice(1));
  if (c === 'fuelHigh') return s.fuel >= derive(s).store * 0.5;
  if (c === 'lifeboat') return !!s.bought.lifeboat;
  if (c === 'keepers2') return derive(s).keepers >= 2;
  if (c.startsWith('village:')) return s.village >= +c.slice(8);
  if (c.startsWith('flag:')) return !!s.flags[c.slice(5)];
  if (c.startsWith('has:')) return (s.bought[c.slice(4)] | 0) > 0;
  return true;
}
function pickEvent(s) {
  const h = D.HEADLANDS[s.headland].mods; const war = isWar(s);
  const pool = [];
  for (const e of D.EVENTS) {
    if (s.year < e.window[0] || s.year > e.window[1]) continue;
    if (e.at) continue;
    if (e.headland && e.headland !== s.headland) continue;
    if (e.once && s.eventsSeen[e.id]) continue;
    if (!condOk(s, e.cond)) continue;
    if (e.tags && e.tags.includes('war') && !war) continue;
    let w = e.weight;
    if (e.tags) { if (e.tags.includes('storm') && h.stormWeight) w *= h.stormWeight; if (e.tags.includes('fog') && h.fogWeight) w *= h.fogWeight; if (e.tags.includes('war') && h.warWeight) w *= h.warWeight; }
    if (s.eventsSeen[e.id]) w *= 0.5;
    pool.push([e, w]);
  }
  if (!pool.length) return null;
  let total = 0; for (const p of pool) total += p[1];
  let r = rand(s) * total;
  for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; }
  return pool[pool.length - 1][0];
}
function eventChoices(s, ev) { return ev.choices.filter(c => condOk(s, c.cond)); }
function applyEffects(s, f, evName) {
  if (!f) return;
  if (f.chance) { const c = f.chance; const ok = c.cond ? condOk(s, c.cond) : rand(s) < c.p; applyEffects(s, ok ? c.then : c.else, evName); }
  if (f.fuel) s.fuel = Math.max(0, Math.min(derive(s).store, s.fuel + f.fuel));
  if (f.funds) s.funds = Math.max(0, s.funds + f.funds);
  if (f.standing) s.standing = Math.max(0, s.standing + f.standing);
  if (f.village) s.village = Math.max(10, s.village + f.village);
  if (f.shipsSaved) s.stats.shipsSaved += f.shipsSaved;
  if (f.keepersRaised) s.stats.keepersRaised += f.keepersRaised;
  if (f.dark) s.darkDays += f.dark;
  if (f.mod) s.mods.push({ key: f.mod.key, mult: f.mod.mult, until: s.dayIndex + f.mod.days });
  if (f.flag) s.flags[f.flag] = true;
  if (f.grant && upgradeById[f.grant]) s.bought[f.grant] = Math.max(1, s.bought[f.grant] | 0);
  if (f.salaryAdd) s.salaryBonus += f.salaryAdd;
  if (f.legend) s.legendBonus += f.legend;
  if (f.auto) s.autoBonus += f.auto;
  if (f.log) pushLog(s, f.log, 'event');
}
function resolveEvent(s, choiceIndex) {
  const ev = eventById[s.pendingEvent]; if (!ev) { s.pendingEvent = null; return false; }
  const choices = eventChoices(s, ev); const c = choices[choiceIndex] || choices[0]; if (!c) { s.pendingEvent = null; return false; }
  s.eventsSeen[ev.id] = (s.eventsSeen[ev.id] | 0) + 1; s.stats.eventsResolved++;
  s.pendingEvent = null; s.lastEventDay = s.dayIndex;
  applyEffects(s, c.eff, ev.name);
  return true;
}
function forceEvent(s, id) { if (!eventById[id] || s.ended) return false; s.pendingEvent = id; return true; }

/* ---------- ending & prestige ---------- */
function legendReady(s) { const d = derive(s); return d.legend >= LEGEND_POINTS && s.standing >= LEGEND_STANDING; }
function endingFor(s) { if (s.flags.prepare) return 'automated'; if (s.flags.fight) return legendReady(s) ? 'legend' : 'overruled'; return legendReady(s) ? 'legend' : 'automated'; }
function finishRun(s) {
  if (s.ended) return;
  const id = endingFor(s); s.ended = id; s.pendingEvent = null;
  pushLog(s, D.ENDINGS[id].log, 'ending');
}
function score(s) { const st = s.stats; return Math.max(0, Math.round(st.shipsSaved + st.rescues * 10 - st.wrecks * 25 + st.keepersRaised * 50 + s.village + s.standing)); }
function heirloomOptions(s) { return D.UPGRADES.filter(u => u.heirloom && (s.bought[u.id] | 0) > 0); }
function headlandOptions(meta) {
  meta = meta || {};
  return Object.values(D.HEADLANDS).filter(h => !h.unlockedBy || (h.unlockedBy === 'any' && meta.completions > 0) || (h.unlockedBy === 'legend' && meta.legends > 0));
}

/* ---------- save hygiene ---------- */
// Older builds wrote a 1930 stop line to the logbook; saves from them load without it.
const RETIRED_LOG = 'Here the free part of the century ends';
const num = (v, def, lo, hi) => { v = +v; if (!isFinite(v)) v = def; if (lo !== undefined && v < lo) v = lo; if (hi !== undefined && v > hi) v = hi; return v; };
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const s = newState({ headland: raw.headland, prestige: raw.prestige, speedBonus: raw.speedBonus, seed: raw.seed });
  s.log = []; s.logFired = {}; s.heirloom = typeof raw.heirloom === 'string' && upgradeById[raw.heirloom] ? raw.heirloom : null; s.bought = {};
  s.year = Math.round(num(raw.year, D.START_YEAR, D.START_YEAR, D.END_YEAR)); s.day = Math.round(num(raw.day, 0, 0, DAYS_PER_YEAR - 1));
  s.dayIndex = Math.round(num(raw.dayIndex, (s.year - D.START_YEAR) * DAYS_PER_YEAR + s.day, 0, 1e7)); s.acc = 0;
  s.fuel = num(raw.fuel, 0, 0, 1e7); s.funds = num(raw.funds, 0, 0, 1e12); s.standing = num(raw.standing, 0, 0, 1e7); s.village = num(raw.village, 40, 10, 1e7);
  if (raw.bought && typeof raw.bought === 'object') for (const id in raw.bought) if (upgradeById[id]) { const n = Math.round(num(raw.bought[id], 0, 0, upgradeById[id].max || 1)); if (n > 0) s.bought[id] = n; }
  if (raw.flags && typeof raw.flags === 'object') for (const k in raw.flags) if (raw.flags[k]) s.flags[String(k).slice(0, 40)] = true;
  if (Array.isArray(raw.mods)) s.mods = raw.mods.filter(m => m && typeof m.key === 'string' && isFinite(+m.mult) && isFinite(+m.until)).slice(0, 20).map(m => ({ key: m.key, mult: num(m.mult, 1, 0.1, 10), until: Math.round(+m.until) }));
  if (raw.eventsSeen && typeof raw.eventsSeen === 'object') for (const k in raw.eventsSeen) if (eventById[k]) s.eventsSeen[k] = Math.round(num(raw.eventsSeen[k], 1, 0, 1000));
  s.lastEventDay = Math.round(num(raw.lastEventDay, -999, -999, 1e7));
  s.pendingEvent = typeof raw.pendingEvent === 'string' && eventById[raw.pendingEvent] ? raw.pendingEvent : null;
  s.darkDays = Math.round(num(raw.darkDays, 0, 0, 60)); s.shipAcc = num(raw.shipAcc, 0, 0, 1);
  s.salaryBonus = num(raw.salaryBonus, 0, 0, 100); s.legendBonus = num(raw.legendBonus, 0, 0, 100); s.autoBonus = num(raw.autoBonus, 0, 0, 100);
  if (raw.stats && typeof raw.stats === 'object') for (const k in s.stats) s.stats[k] = Math.round(num(raw.stats[k], 0, 0, 1e9));
  if (Array.isArray(raw.log)) s.log = raw.log.filter(l => l && typeof l.t === 'string' && !l.t.startsWith(RETIRED_LOG)).slice(-LOG_CAP).map(l => ({ y: Math.round(num(l.y, s.year)), d: Math.round(num(l.d, 0, 0, 364)), t: String(l.t).slice(0, 600), k: typeof l.k === 'string' ? l.k.slice(0, 12) : 'story' }));
  if (raw.logFired && typeof raw.logFired === 'object') for (const k in raw.logFired) if (+k >= 0 && +k < D.LOGBOOK.length) s.logFired[k] = 1;
  if (raw.milestones && typeof raw.milestones === 'object') for (const k in raw.milestones) if (D.MILESTONES[k]) s.milestones[k] = 1;
  s.unlocked = true; // every save and save code, old or new, opens the whole century
  s.ended = (raw.ended === 'legend' || raw.ended === 'automated' || raw.ended === 'overruled') ? raw.ended : null;
  if (!s.log.length) fireLogbook(s);
  return s;
}

const ENGINE = { D, DAY_BASE, DAYS_PER_YEAR, OFFLINE_CAP, LEGEND_POINTS, LEGEND_STANDING, upgradeById, eventById, newState, derive, eraFor, isWar, hName, fmtDate, advance, offline, click, upgradeCost, upgradeAvailable, standingOk, visibleUpgrades, legendReady, canBuy, buy, pickEvent, eventChoices, resolveEvent, forceEvent, endingFor, finishRun, score, heirloomOptions, headlandOptions, sanitize, pushLog, rand };
if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE; else root.KTL = ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
