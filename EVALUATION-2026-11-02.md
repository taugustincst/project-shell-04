# Evaluation — Keep the Light (project-shell-04)

**Evaluator:** Folder (expert review, 2026-11-02) · **Build evaluated:** `main` @ `cb686d7` (v1.0.0 draft, game merged to main)
**Role in roster:** Free + $4.99 one-time-unlock **funnel test** — its conversion numbers gate the monetization model for shells 01 and 03. Generosity and pacing evidence weighted accordingly.

## Scores

| Dimension | Score |
|---|---|
| Brief compliance | 8/10 |
| Gameplay / design | 7/10 |
| Pacing & balance evidence | 5/10 |
| Writing quality | 9/10 |
| UX / accessibility | 8/10 |
| Technical quality | 8/10 |
| Store readiness | 6/10 |
| **Overall** | **7/10 — ship after fixes** |

## Test & sim results (verbatim)

**Engine tests** (`node tests/engine.test.js`): **ALL 11 PASSED** — determinism (same seed, same century), gate behaviour, ending + closing log line, ending selection logic, offline cap/calendar freeze, sanitize garbage/clamping, save round-trip, every event choice applies on every headland, every upgrade reachable, scheduled events fire, heirlooms/headlands.
**Smoke test** (`tests/smoke.js`, part of `npm test`): could not run in this sandbox — `Cannot find module 'playwright'` (devDependency not installed here). Not a code failure, but the browser-level test is **unverified locally**; it must pass in CI before submission.
**Century sim** (`node sim/sim.js all`, exit 0):

```
greedy   ending=legend    total=5.5h  era1=2.2h gate(1930)=3.2h era2=1.8h era3=1.5h  speed=5.93x
         funds=£53546 income/day=£253.3 village=2931 bought=63/63 ships=220843 wrecks=2 events=237(37 kinds) log=299
casual   ending=automated total=6.0h  era1=2.5h ... bought=60/63 ships=206098 wrecks=80
neglect  ending=automated total=15.3h ... bought=0/63 wrecks=13953 dark=36419
prestige2 (greedy + heirloom + 10% speed): total=5.0h
skerra lamp: 5.6h automated · api lamp: 5.5h legend · fer lamp: 5.5h automated
```

## Content vs brief floors

| Floor | Brief | Actual | Verdict |
|---|---|---|---|
| Eras | 3 (1890–1914 / 1914–1945 / 1945–1990) | 3, each with distinct fuel, click verb, cost scale, traffic economy | ✅ |
| Upgrades | ~60 | **63** (24 / 19 / 20 per era) | ✅ |
| Logbook entries | ~80 authored | **58 authored** (+ ~14 milestone lines, event/ending/away lines; a full run's log holds ~299 lines) | ⚠️ 73% of floor |
| Events | ~40 with real trade-offs | **42** (7 scheduled story beats incl. the 1979 automation letter); 86 choices, **43 carry a mechanical cost**, 43 are cost-free (flags/story/chance) | ✅ count, ⚠️ "never just bonuses" half-honoured |
| Endings | Both outcomes real + final score | **3 endings** (Legend / automated / "The Last Keeper" overruled), driven by the 1979 fight-vs-prepare choice + legend points ≥10 & standing ≥500; score formula shipped | ✅ |
| Prestige | New headlands, different rules, one heirloom | 4 headlands (base + ice/storm Skerra, monsoon/fog Pulau Api, always-war Cap Fer) with real economy mods; heirloom carry-over; +15% speed/completion in game (sim models +10%) | ✅ structure, ⚠️ speed-up thin |

## Funnel-test audit (the part that matters most)

**Generosity — good, and honestly framed.** The free tier is the full 40 years 1890–1930 (era 1 complete + 16 years of era 2, including WWI and the electrification path opening) = the brief's ~40%. The 1930 gate is a true **soft wall**: the calendar stops, the economy keeps running, the gate modal offers unlock / restore / "later" with no punishment copy. The unlock is labelled "The rest of the century" in billing and listing alike — the brief's Melvor rule is honoured in code and copy. Billing is a clean Digital Goods API implementation: one non-consumable `full_unlock`, restore supported, graceful "available in the Google Play version" degradation in a plain browser.

**Pacing — the evidence cuts both ways.**
- The sim is real, deterministic, and strategy-varied (greedy/lamp/village/casual/neglect + prestige + per-headland). A greedy run reaches the gate in **3.2 h of active play** and finishes in **5.5 h**; casual 6.0 h. Against the brief's "days of real time across sessions, not weeks": active play is the only calendar driver (offline freezes the calendar by design), so a 20-min-a-day player takes ~2–3 weeks to finish — longer than intended for light players, acceptable for the genre's core audience. Era pacing is **inverted**: era 3 spans 45 years but plays fastest (1.5 h vs era 1's 2.2 h) because speed upgrades compound — the longest era is the least decision-dense.
- **The offline system breaks era 1.** See Defect 1.

## Defects

### 1. CRITICAL — Offline earnings are uncapped in effect and gut the early economy
The 8-hour cap is on *seconds*, but offline nights = elapsed ÷ dayLength, and salary+trade accrue every night regardless of the light. Probed directly against the shipped engine:
- Brand-new save, 8 h away → **19,200 "nights", £22,307** (start: £20). The entire era-1 upgrade tree costs **£5,590** — one overnight absence buys it 4× over.
- 1 h away on day 1 → £2,819 and 2,400 nights, while the calendar still reads 1890.
- At max game speed (dayLen 0.253 s), 8 h away = **113,881 nights ≈ 312 game-years of economy**.

Consequences: first-session progression collapses for exactly the returning players the funnel test needs to measure; the away summary ("Away 19,200 nights") is incoherent against a frozen calendar; unlock-conversion data would be poisoned (free tier feels broken, not generous). **Fix:** cap offline *nights* (e.g. 30–90) or grant a flat per-hour rate independent of dayLen, and don't accrue salary/trade for nights beyond the cap. The engine test asserts the seconds cap, not the effect — add a magnitude assertion.

### 2. MAJOR — Late-game economy saturates; era 3 has no sink
Sim end-states: £35k (lamp) to **£661k (casual)** unspent, income £253/day, all 63 upgrades bought well before 1990 by active strategies. The builder's own handoff flags "late-era surplus still generous" as a pending week-3 item — it is still open. Combined with era 3 playing fastest, the final act is a victory lap of watching numbers grow. **Fix:** era-3 sinks (endowment, heritage works, village projects) or steeper era-3 cost scaling; re-run sims until end funds land in the low thousands for greedy play.

### 3. MODERATE — Logbook volume below floor; prestige speed-up weak
58 authored entries vs the ~80 floor. Quality is high (below), so this is a volume gap, not a filler problem — ~20 more entries, concentrated in era 3 (1945–1990 currently thins out), closes it. Separately, prestige run 2 is only ~9% faster in sim (5.0 h vs 5.5 h); the brief asked for "meaningfully faster." The +15%/completion meta bonus (cap +150%) fixes this by run 3–4, but run 2 should feel the difference — consider +25% for the first completion.

### Minor notes
- Backup save key is written when the main save fails to parse, but `load()` never reads it back — corrupt-save recovery is stash-only. Fail-soft still holds (fresh start, no crash).
- `?dev=1` makes the unlock free in the shipped web build. It's a deliberate, handoff-flagged FOR TJ decision (web gate vs open web build) — must be decided before the TWA ships, not silently inherited.
- Half of event choices carry no mechanical cost. The consequential half (dark days, standing, ending flags) does the work, and narrative flags pay off at the ending — but the brief's "never just bonuses" is only half-met.
- Sim models prestige speed at +10% while the game grants +15% — sim/game drift to reconcile in the week-3 balance pass.

## Writing quality — the standout

This is a real century story, not filler. Four generations of the Rook family keep the log in a consistent, dry, period voice: the 1914 Admiralty letter ("I have read the letter three times and it says the same thing each time"), 1962's automation letter "filed under weather," 1945's keeper who "went straight up to the lantern and stood there until dark," and a 1989 storm that deliberately mirrors 1890's, closing on the computer keeping the light "and I watched the computer, which is a kind of keeping." Village growth is woven in as observation, not exposition ("They say it is because of the light. I say it is because of the herring, but I wrote it down anyway"). Milestone and event writing matches the register. Average entry ~129 chars — fragments, as briefed. This is the game's marketing asset and the main reason the free tier should convert: players will want the rest of this logbook.

## Technical & UX audit

- **Save hardening:** versioned key `keepthelight.v1`; sanitizer clamps/validates every field (unknown upgrade/event ids dropped, log entries truncated, numeric ranges enforced); corrupt JSON → fresh state, no crash. Export/import save codes included. ✅
- **Clock safety:** rAF dt clamped to [0, 1] s; offline elapsed clamped to [0, 8 h]; negative and NaN elapsed return null (verified by probe and test). The *magnitude* flaw in Defect 1 is an economy bug, not a clock exploit — a tampered clock gains no more than an honest 8 h. ✅ with Defect 1 caveat.
- **Offline/no-network/no-analytics:** grep clean — the only URLs are the Play Billing method (TWA-only) and the service worker's same-origin cache fetch. SW precaches the full app shell; the game is genuinely offline after first load. ✅
- **Test API:** `window.__keepthelight` exposes state, setYear, give, buyAll, forceEvent, fast-forward, unlock, finish, save/reset — everything the brief asked for staged screenshots and sims. ✅
- **Size:** 416 KB total including icons and the screenshot asset; ~250 KB of code/data — far under the 2 MB budget. ✅
- **UX/accessibility:** portrait tabs, one-handed; large-text, high-contrast, and reduce-motion settings; log order toggle; light state conveyed by text ("Light lit" / "DARK — no oil"), never colour alone; events pause the calendar while deciding; unread-log badge. Presentation is a clean SVG scene (beam, ships, dark state) with era-specific fuel/click verbs ("Haul oil up the stair" → "Walk the gallery"). One scene serves all eras/headlands — tasteful but static across a century. ✅

## Store readiness

`store/listing.md` is a strong, rule-compliant draft: title within limits, short description (79 chars) is features-only with zero price/promo wording, captions state content, declarations pre-written (IARC, 13+ audience, Data safety none, privacy policy = repo `privacy.html`, contact elderon@augustinnovations.io, `full_unlock` $4.99 spec). **Missing:** staged era screenshots (only 1 portrait asset exists), the Android TWA project, and the Play Console app/product creation (all correctly parked as FOR TJ items in the handoff). The game is on `main` and live on Pages.

## Verdict

**Ship after fixes — Overall 7/10.** The architecture, writing, save/clock hygiene, and funnel *structure* are right, and this is the most shippable draft shape a funnel test could have. But Defect 1 must be fixed before launch: as built, the offline system hands a day-one player four times the era-1 economy for closing the app overnight, which would corrupt the very conversion evidence this title exists to produce. Fix the offline magnitude cap, give era 3 a money sink, add ~20 logbook entries (era 3 first), and reconcile the prestige speed between sim and game — then it is ready for the week-3 expert pass and Tj's submission call.
