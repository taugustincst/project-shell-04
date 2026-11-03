/* Keep the Light — UI, save, loop. Everything that touches the DOM lives here; the numbers live in engine.js. */
(function () {
'use strict';
const E = window.KTL, D = E.D;
const VERSION = '1.0.0';
const SAVE_KEY = 'keepthelight.v1', BACKUP_KEY = 'keepthelight.v1.backup';
const $ = id => document.getElementById(id);

/* ---------- persistent profile: the run + meta progress + settings ---------- */
let profile = null; let S = null; // S is the live run state
function freshMeta() { return { completions: 0, legends: 0, speedBonus: 0, headlands: {} }; }
function sanitizeMeta(m) {
  m = (m && typeof m === 'object') ? m : {};
  const n = (v, lo, hi) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo; };
  const out = freshMeta();
  out.completions = Math.round(n(m.completions, 0, 1000)); out.legends = Math.round(n(m.legends, 0, 1000)); out.speedBonus = n(m.speedBonus, 0, 3);
  if (m.headlands && typeof m.headlands === 'object') for (const k in m.headlands) if (D.HEADLANDS[k]) out.headlands[k] = String(m.headlands[k]).slice(0, 12);
  return out;
}
function sanitizeSettings(x) { x = (x && typeof x === 'object') ? x : {}; return { large: x.large === true, motion: x.motion === true, contrast: x.contrast === true, logOrder: x.logOrder === true, seenAway: true }; }
function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { raw = null; try { localStorage.setItem(BACKUP_KEY, localStorage.getItem(SAVE_KEY) || ''); } catch (e2) { } }
  profile = { v: 1, meta: sanitizeMeta(raw && raw.meta), settings: sanitizeSettings(raw && raw.settings), lastSeen: raw && isFinite(+raw.lastSeen) ? +raw.lastSeen : 0 };
  S = (raw && raw.run) ? E.sanitize(raw.run) : null;
  if (!S) S = E.newState({ speedBonus: profile.meta.speedBonus });
}
function save() {
  if (!S) return;
  profile.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, run: S, meta: profile.meta, settings: profile.settings, lastSeen: profile.lastSeen })); } catch (e) { }
}

/* ---------- formatting ---------- */
const fmtN = n => { n = +n || 0; if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'; if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + 'k'; if (Math.abs(n) >= 100) return Math.round(n).toLocaleString(); return (Math.round(n * 10) / 10).toLocaleString(); };
const fmtMoney = n => '£' + fmtN(n);
const effText = u => {
  const f = u.eff, out = [];
  const pct = (v, up) => Math.round(Math.abs(1 - v) * 100) + '%';
  if (f.fuelEff) out.push('−' + pct(f.fuelEff) + ' fuel'); if (f.range) out.push('+' + pct(f.range) + ' light'); if (f.supplyAdd) out.push('+' + f.supplyAdd + ' fuel/day delivered');
  if (f.storeAdd) out.push('+' + f.storeAdd + ' store'); if (f.salaryAdd) out.push('+£' + f.salaryAdd + '/day'); if (f.speed) out.push('years pass ' + pct(f.speed) + ' faster');
  if (f.villageGrowth) out.push('+' + pct(f.villageGrowth) + ' village growth'); if (f.villageCapAdd) out.push('room for ' + f.villageCapAdd + ' more'); if (f.wreck) out.push('−' + pct(f.wreck) + ' wrecks');
  if (f.dues) out.push('+' + pct(f.dues) + ' dues'); if (f.standingRate) out.push('+' + pct(f.standingRate) + ' standing'); if (f.trade) out.push('+' + pct(f.trade) + ' village trade');
  if (f.stormShield) out.push('storms cost less'); if (f.warShield) out.push('safer in wartime'); if (f.rescue) out.push('wrecks become rescues'); if (f.standby) out.push('the light is never dark');
  if (f.mains) out.push('power bought automatically'); if (f.electrified) out.push('electrification'); if (f.legend) out.push('+' + f.legend + ' toward a manned light'); if (f.auto) out.push('+' + f.auto + ' toward automation');
  if (f.keepers) out.push('+1 keeper');
  return out.join(' · ');
};

/* ---------- rendering ---------- */
let activeTab = 'station', dirtyUpgrades = true, lastLogCount = 0, unreadLog = 0, lastRender = 0;
function setTab(t) { activeTab = t; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + t)); if (t === 'log') { unreadLog = 0; $('log-badge').hidden = true; renderLog(); } if (t === 'station') dirtyUpgrades = true; if (t === 'village') renderVillage(); render(true); }

function render(force) {
  const now = performance.now(); if (!force && now - lastRender < 200) return; lastRender = now;
  const d = E.derive(S), era = d.era, h = D.HEADLANDS[S.headland];
  $('hdr-date').textContent = `${h.name} · ${S.year} · day ${S.day + 1}`;
  $('hdr-era').textContent = era.name;
  const lit = S.darkDays === 0 && (S.fuel >= d.fuelUse || d.standby);
  $('scene').classList.toggle('dark', !lit);
  $('scene-light').textContent = S.darkDays > 0 ? 'Light out by order' : lit ? 'Light lit' : (d.mains ? 'Light lit' : 'DARK — no ' + era.fuelName.toLowerCase());
  $('scene-weather').textContent = d.war ? 'wartime' : (S.year >= 1945 ? 'fair' : 'clear');
  $('res-fuel-label').textContent = era.fuelName;
  $('res-fuel-val').textContent = d.mains ? '∞' : fmtN(S.fuel);
  $('res-fuel-sub').textContent = d.mains ? 'from the mains' : `/ ${fmtN(d.store)} ${era.fuelUnit} · ${fmtN(d.fuelUse)}/night`;
  $('res-fuel').classList.toggle('low', !d.mains && S.fuel < d.fuelUse * 3);
  $('res-funds-val').textContent = fmtMoney(S.funds);
  $('res-funds-sub').textContent = `+${fmtMoney(d.incomePerDay - d.fuelCostPerDay)} / day`;
  $('res-standing-val').textContent = fmtN(S.standing);
  $('res-village-val').textContent = fmtN(S.village);
  $('res-village-sub').textContent = S.village >= 2000 ? 'a town' : S.village >= 500 ? 'a port' : S.village >= 100 ? 'a village' : 'souls';
  $('btn-click-label').textContent = era.clickLabel;
  const full = !d.mains && S.fuel >= d.store - 0.01;
  $('btn-click-sub').textContent = d.mains ? 'The light looks after itself. Walk anyway.' : full ? 'Store full' : `+${fmtN(d.click)} ${era.fuelUnit}`;
  $('btn-click').classList.toggle('full', full || d.mains);
  // ships at sea
  const ships = $('ships'); const want = Math.min(6, Math.max(1, Math.round(d.traffic / 2)));
  if (ships.childElementCount !== want) { ships.innerHTML = ''; for (let i = 0; i < want; i++) { const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('transform', `translate(0 ${112 + (i * 7) % 30})`); const sh = document.createElementNS('http://www.w3.org/2000/svg', 'path'); sh.setAttribute('class', 'ship'); sh.setAttribute('d', 'M0 0 h14 l-3 4 h-9 z M6 0 v-5 h1 v5 z'); sh.style.animationDelay = (-i * 28 / want) + 's'; g.appendChild(sh); ships.appendChild(g); } }
  if (S.log.length !== lastLogCount) { if (activeTab !== 'log') { unreadLog += S.log.length - lastLogCount; $('log-badge').textContent = unreadLog; $('log-badge').hidden = unreadLog <= 0; } else renderLog(); lastLogCount = S.log.length; }
  if (activeTab === 'station') renderUpgrades(d);
  if (activeTab === 'village' && force) renderVillage();
}

let upgradeCards = {};
function renderUpgrades(d) {
  const vis = E.visibleUpgrades(S);
  const key = vis.map(u => u.id + ':' + (S.bought[u.id] | 0)).join(',');
  const box = $('upgrades');
  if (dirtyUpgrades || box.dataset.key !== key) {
    dirtyUpgrades = false; box.dataset.key = key; box.innerHTML = ''; upgradeCards = {};
    const cats = ['Lamp', 'Stores', 'Keepers', 'Signals', 'Station', 'Village'];
    if (!vis.length) { box.innerHTML = '<div class="empty">Nothing more the station can buy this year. The years will bring more.</div>'; return; }
    for (const c of cats) {
      const list = vis.filter(u => u.cat === c); if (!list.length) continue;
      const hdr = document.createElement('div'); hdr.className = 'cat'; hdr.textContent = c; box.appendChild(hdr);
      for (const u of list) {
        const n = S.bought[u.id] | 0, cost = E.upgradeCost(S, u);
        const el = document.createElement('div'); el.className = 'upg' + (n ? ' owned' : ''); el.dataset.id = u.id;
        el.innerHTML = `<div class="upg-name"></div><button class="btn" data-buy="${u.id}"></button><div class="upg-desc"></div><div class="upg-eff"></div><div class="upg-need" hidden></div>`;
        el.querySelector('.upg-name').textContent = u.name + (u.max > 1 ? ` (${n}/${u.max})` : '');
        el.querySelector('.upg-desc').textContent = u.desc; el.querySelector('.upg-eff').textContent = effText(u);
        el.querySelector('button').textContent = fmtMoney(cost);
        if (u.needStanding) { const nd = el.querySelector('.upg-need'); nd.textContent = `Needs standing ${u.needStanding}`; nd.hidden = S.standing >= u.needStanding; }
        box.appendChild(el); upgradeCards[u.id] = el;
      }
    }
  }
  for (const id in upgradeCards) { const el = upgradeCards[id]; const u = E.upgradeById[id]; const ok = E.canBuy(S, id); el.querySelector('button').disabled = !ok; const nd = el.querySelector('.upg-need'); if (u.needStanding) nd.hidden = S.standing >= u.needStanding; }
}
function renderLog() {
  const ol = $('logbook'); ol.innerHTML = '';
  const entries = profile.settings.logOrder ? S.log : S.log.slice().reverse();
  const frag = document.createDocumentFragment();
  for (const l of entries) { const li = document.createElement('li'); li.className = l.k || 'story'; li.innerHTML = `<div class="ld"></div><div class="lt"></div>`; li.querySelector('.ld').textContent = `${l.y} · day ${l.d + 1}`; li.querySelector('.lt').textContent = l.t; frag.appendChild(li); }
  ol.appendChild(frag);
}
function statsHtml(pairs) { return pairs.map(p => `<div class="stat"><b>${p[1]}</b><span>${p[0]}</span></div>`).join(''); }
function renderVillage() {
  const d = E.derive(S), st = S.stats;
  $('village-stats').innerHTML = statsHtml([['ships guided', fmtN(st.shipsSaved)], ['wrecks', fmtN(st.wrecks)], ['rescues', fmtN(st.rescues)], ['keepers raised', fmtN(st.keepersRaised)], ['nights lit', fmtN(st.litNights)], ['nights dark', fmtN(st.darkNights)], ['ships tonight', d.traffic.toFixed(1)], ['dues per ship', fmtMoney(d.dues)], ['calendar', `${fmtN(d.speed)}× pace`], ['keepers', d.keepers]]);
  $('era-card').innerHTML = `<h2>${d.era.name} · ${d.era.from}–${d.era.to}</h2><p class="muted">${d.era.blurb}</p><p class="muted small">${D.HEADLANDS[S.headland].desc}</p>`;
  const lp = Math.min(1, d.legend / E.LEGEND_POINTS), sp = Math.min(1, S.standing / E.LEGEND_STANDING);
  let verdict = S.year < 1962 ? 'The Board has not yet used the word "automation". It will.' : S.flags.prepare ? 'The station is preparing for automation in 1990.' : S.flags.fight ? (E.legendReady(S) ? 'The case for a manned light is made. Hold it to 1990.' : 'You are fighting for a manned light. The case is not yet made.') : (E.legendReady(S) ? 'A manned light is defensible. The Board\'s letter will come in 1979.' : 'Automation is coming. Build the case for keepers, or prepare for it.');
  $('board-card').innerHTML = `<h2>The Board's view</h2><p class="muted small">A manned light after 1990 needs ${E.LEGEND_POINTS} points of case (civic works, lifeboats, a listed tower) and standing of ${E.LEGEND_STANDING}.</p><div class="small">Case for keepers: ${d.legend} / ${E.LEGEND_POINTS}</div><div class="meter"><i style="width:${lp * 100}%"></i></div><div class="small">Standing: ${fmtN(S.standing)} / ${E.LEGEND_STANDING}</div><div class="meter"><i style="width:${sp * 100}%"></i></div><p>${verdict}</p>`;
}

/* ---------- modals ---------- */
function show(id) { $(id).hidden = false; } function hide(id) { $(id).hidden = true; }
let shownEvent = null;
function maybeShowEvent() {
  if (!S.pendingEvent) { if (shownEvent) { hide('modal-event'); shownEvent = null; } return; }
  if (shownEvent === S.pendingEvent) return;
  const ev = E.eventById[S.pendingEvent]; if (!ev) { S.pendingEvent = null; return; }
  shownEvent = ev.id;
  $('event-date').textContent = `${D.HEADLANDS[S.headland].name} · ${S.year} · day ${S.day + 1}`; $('event-title').textContent = ev.name; $('event-text').textContent = ev.text;
  const box = $('event-choices'); box.innerHTML = '';
  E.eventChoices(S, ev).forEach((c, i) => { const b = document.createElement('button'); b.className = 'btn choice'; b.textContent = c.label; b.onclick = () => { E.resolveEvent(S, i); shownEvent = null; hide('modal-event'); dirtyUpgrades = true; save(); render(true); }; box.appendChild(b); });
  show('modal-event');
}
let endingShown = false;
function maybeShowEnding() {
  if (!S.ended || endingShown) return; endingShown = true;
  const meta = profile.meta;
  if (!S.flags.counted) { S.flags.counted = true; meta.completions++; if (S.ended === 'legend') meta.legends++; meta.headlands[S.headland] = S.ended; meta.speedBonus = Math.min(1.5, meta.speedBonus + 0.15); save(); }
  const en = D.ENDINGS[S.ended], hn = D.HEADLANDS[S.headland].name;
  $('ending-title').textContent = en.title.replace(/\{headland\}/g, hn); $('ending-text').textContent = en.text.replace(/\{headland\}/g, hn);
  const st = S.stats;
  $('ending-stats').innerHTML = statsHtml([['ships guided', fmtN(st.shipsSaved)], ['wrecks', fmtN(st.wrecks)], ['rescues', fmtN(st.rescues)], ['keepers raised', fmtN(st.keepersRaised)], ['village in 1990', fmtN(S.village)], ['score', fmtN(E.score(S))]]);
  const hs = $('sel-heirloom'); hs.innerHTML = '<option value="">None</option>'; E.heirloomOptions(S).forEach(u => { const o = document.createElement('option'); o.value = u.id; o.textContent = u.name; hs.appendChild(o); });
  const hl = $('sel-headland'); hl.innerHTML = ''; E.headlandOptions(meta).forEach(h => { const o = document.createElement('option'); o.value = h.id; o.textContent = `${h.name} · ${h.region}` + (meta.headlands[h.id] ? ' (kept)' : ''); hl.appendChild(o); });
  const other = E.headlandOptions(meta).find(h => !meta.headlands[h.id]); if (other) hl.value = other.id;
  const descH = () => { const h = D.HEADLANDS[hl.value]; $('headland-desc').textContent = h ? h.desc : ''; }; hl.onchange = descH; descH();
  show('modal-ending');
}
function prestige() {
  const heirloom = $('sel-heirloom').value || null, headland = $('sel-headland').value || 'carrow';
  S = E.newState({ headland, heirloom, prestige: profile.meta.completions, speedBonus: profile.meta.speedBonus });
  endingShown = false; dirtyUpgrades = true; lastLogCount = 0; hide('modal-ending'); save(); setTab('log'); render(true);
  toast(`A new century at ${D.HEADLANDS[headland].name}.`);
}
let toastTimer = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); }

/* ---------- loop ---------- */
let last = 0, saveAt = 0, hiddenAt = 0;
function frame(now) {
  if (!last) last = now;
  let dt = (now - last) / 1000; last = now;
  if (dt > 1) dt = 1; if (dt < 0) dt = 0;
  if (document.visibilityState === 'visible') { const before = S.log.length; E.advance(S, dt, true); }
  maybeShowEvent(); maybeShowEnding();
  render(false);
  if (now - saveAt > 10000) { saveAt = now; save(); }
  requestAnimationFrame(frame);
}
function applyOffline(elapsedMs) {
  const secs = elapsedMs / 1000; if (!(secs > 60)) return;
  const sum = E.offline(S, secs); if (!sum) return;
  $('away-text').textContent = (sum.dryAfter < 0 ? `${sum.nights} nights. The light kept: ${fmtN(sum.ships)} ships guided and ${fmtMoney(sum.funds)} to the purse.` : `${sum.nights} nights. The store ran dry after ${sum.dryAfter}; the light was dark the rest. ${fmtN(sum.ships)} ships guided, ${fmtMoney(sum.funds)} to the purse.`) + (secs > E.OFFLINE_CAP ? ' (The station earns for up to eight hours away.)' : '');
  show('modal-away'); save();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); save(); }
  else { last = 0; if (hiddenAt) { applyOffline(Date.now() - hiddenAt); hiddenAt = 0; } }
});
window.addEventListener('pagehide', save);

/* ---------- settings ---------- */
function applySettings() { const s = profile.settings; document.documentElement.classList.toggle('large', s.large); document.documentElement.classList.toggle('motion', s.motion); document.documentElement.classList.toggle('contrast', s.contrast); $('opt-large').checked = s.large; $('opt-motion').checked = s.motion; $('opt-contrast').checked = s.contrast; $('log-order').checked = s.logOrder; }

/* ---------- wiring ---------- */
function init() {
  load(); applySettings();
  $('about-version').textContent = VERSION;
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('btn-click').addEventListener('click', () => { const got = E.click(S); if (got > 0) render(true); });
  $('res-fuel').addEventListener('click', () => { const d = E.derive(S); toast(d.mains ? 'Power comes from the mains now.' : `${fmtN(S.fuel)} of ${fmtN(d.store)} ${d.era.fuelUnit} in store. The lamp burns ${fmtN(d.fuelUse)} a night; ${fmtN(d.supply)} a day is delivered.`); });
  $('upgrades').addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (!b) return; const u = E.upgradeById[b.dataset.buy]; if (E.buy(S, u.id)) { save(); toast(`${u.name} — bought.`); render(true); } });
  $('log-order').addEventListener('change', e => { profile.settings.logOrder = e.target.checked; save(); renderLog(); });
  for (const k of ['large', 'motion', 'contrast']) $('opt-' + k).addEventListener('change', e => { profile.settings[k] = e.target.checked; applySettings(); save(); });
  $('btn-away-ok').addEventListener('click', () => hide('modal-away'));
  $('btn-prestige').addEventListener('click', prestige);
  $('btn-ending-stay').addEventListener('click', () => { hide('modal-ending'); setTab('log'); });
  $('btn-export').addEventListener('click', async () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify({ run: S, meta: profile.meta })))); try { await navigator.clipboard.writeText(code); toast('Save code copied.'); } catch (e) { prompt('Your save code:', code); } });
  $('btn-import').addEventListener('click', () => { const code = prompt('Paste a save code:'); if (!code) return; try { const o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); const run = E.sanitize(o.run); if (!run) throw 0; S = run; profile.meta = sanitizeMeta(o.meta); dirtyUpgrades = true; endingShown = false; lastLogCount = 0; save(); render(true); toast('Save loaded.'); } catch (e) { toast('That code could not be read.'); } });
  $('btn-reset').addEventListener('click', () => { if (!confirm('Start the century again from 1890? Your headlands stay; this run does not.')) return; S = E.newState({ speedBonus: profile.meta.speedBonus }); dirtyUpgrades = true; endingShown = false; lastLogCount = 0; save(); setTab('log'); render(true); });
  if (profile.lastSeen) applyOffline(Date.now() - profile.lastSeen);
  $('app').hidden = false; render(true); renderLog(); lastLogCount = S.log.length;
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
  // Android back button in a TWA: close any open sheet instead of leaving
  window.addEventListener('popstate', () => { ['modal-away'].forEach(hide); });
  requestAnimationFrame(frame);
}

/* Test API for sims, screenshots and the smoke test. */
window.__keepthelight = {
  get state() { return S; }, E, D, VERSION,
  setYear(y, d) { S.year = Math.max(D.START_YEAR, Math.min(D.END_YEAR - 1, y | 0)); S.day = Math.max(0, Math.min(364, d | 0)); S.dayIndex = (S.year - D.START_YEAR) * 365 + S.day; S.ended = null; dirtyUpgrades = true; render(true); },
  give(o) { for (const k of ['fuel', 'funds', 'standing', 'village']) if (o[k] != null) S[k] = +o[k]; render(true); },
  buyAll() { let n = 0; for (const u of D.UPGRADES) if (E.upgradeAvailable(S, u)) { S.bought[u.id] = u.max || 1; n++; } dirtyUpgrades = true; render(true); return n; },
  forceEvent(id) { const ok = E.forceEvent(S, id); maybeShowEvent(); return ok; },
  ff(days) { let n = 0; const d = E.derive(S); n = E.advance(S, days * d.dayLen, false); maybeShowEvent(); maybeShowEnding(); render(true); return n; },
  finish() { E.finishRun(S); maybeShowEnding(); render(true); },
  save, reset() { localStorage.removeItem(SAVE_KEY); location.reload(); }, render: () => render(true), setTab
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
