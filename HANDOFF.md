# HANDOFF — project-shell-04 — KEEP THE LIGHT

## Status: ASSIGNED 2026-11-02 — BUILD FIRST in the roster sequence (the funnel test)

Roster assignment by Folder at Tj's direction, from the 2026-11-02 Google Play niche research. This file is the build brief AND the living handoff. Keep it updated.

## 1. THE GAME — exactly what to make

**Fantasy:** You keep a lighthouse from 1890 to 1990. A text incremental where a century of story is told through a keeper's logbook — and the game ENDS. Finishing it is the feature.

**Why this game, and why FIRST:** Premium text incrementals on Android are basically Kittens Game (2017, $2.99, 50k+ installs, 4.5 stars, still praised for "no ads, no microtransactions") and imports — the thoughtful, FINITE incremental has no current Android champion. This is also the cheapest build on the roster (2–3 weeks, numbers and text, almost no art), which makes it the designated experiment: it tests whether the free + one-time-unlock funnel converts for THIS developer before the bigger titles (shell-01, shell-03) bet their monetization on it.

**Core loop:**
1. Tend the light: keep it lit through each night/season. Output = ships passed safely + supplies earned.
2. Spend on the upgrade tree: better lamps, automation, extra keepers, stores, a boat, a fog bell. Each era changes the economy, not just the numbers.
3. Weather and events interrupt: storms, wrecks-that-almost-were, wars, inspectors, keepers' families growing up. Events are choices with trade-offs, never just bonuses.
4. The village grows BECAUSE the light exists — population, a harbour, a lifeboat station — visible in stats and logbook.
5. ENDING (1990): the light is automated/decommissioned, or your century of service makes it a legend that stays manned. Both endings are real endings with a closing logbook entry and a final score (ships saved, wrecks, keepers raised).
6. Prestige: start a new headland with different weather/economy rules (e.g. ice, monsoon, war coast), carrying one chosen heirloom upgrade.

**Content targets (v1.0):**
- 3 eras (oil 1890–1914 / coal-electric transition 1914–1945 / electric 1945–1990), ~60 upgrades total.
- ~80 logbook entries (the story IS the content; write them like a novel in fragments).
- Event deck of ~40 events with real trade-offs.
- Offline progress: the light keeps working while away, capped generously (this is an incremental; offline earnings are expected — but NO ads to boost them, ever).

## 2. BUILD SPEC

- Vanilla HTML5/CSS/JS, no framework, no build step. Static files, GitHub Pages deploy from this repo (pattern: taugustincst/bubblepop, taugustincst/ironhold).
- Fully offline. Zero network calls, zero analytics, zero ads, zero accounts.
- Numbers engine must be deterministic and testable: a headless sim script that plays a full century at various strategies and reports era timings — a first full run should take days of real time across sessions, not weeks, and prestige run 2 must be meaningfully faster.
- Saves: localStorage, versioned key, sanitizer on load, fail-soft (Ironhold lesson). Clock handling: use elapsed-time deltas, clamp absurd values (clock changes must never break or exploit the save).
- Expose a `window.__keepthelight` test API (set era/resources, force event, fast-forward) for staged screenshots and sims.
- Portrait, one-handed, large-text option, colourblind-safe. One header illustration + icons; typography is the art. Under 2 MB.

## 3. MONETIZATION — exact

- Google Play: FREE app. Free content = era 1 and into electrification (~40% of the century) — a satisfying, complete-feeling first act. One non-consumable `full_unlock` at **$4.99** opens the rest of the century, endings, and prestige headlands. Restore purchases supported.
- HARD RULE (Melvor lesson): the free part must feel complete. Never describe the unlock as restoring removed features; it is "the rest of the century." Melvor Idle sits at 3.7 stars largely because its gating feels stingy.
- No ads, no consumables, no "watch to speed up." Ever.

## 4. HOW IT SUCCEEDS — the launch playbook

- This title's real job: FUNNEL DATA. Its Play Console numbers (installs, unlock conversion, rating) decide whether shells 01/03 keep the free+unlock model. Report them in this handoff the moment they exist.
- Store copy: lead with "an incremental that ends" + "100 years, one lighthouse." Short description: features only, NEVER price/promo wording (Play flags it — Ironhold lesson).
- Screenshots: real staged eras via the test API (oil-era logbook, storm event, electric era). Captions state content ("1890–1990 · a story in a logbook"), not price claims.
- Declarations: IARC; audience 13-15 / 16-17 / 18+; Data safety = none collected/shared; privacy policy at this repo's Pages site (privacy.html); contact elderon@augustinnovations.io.
- Process: internal draft → declarations → production → Folder expert review → submission only on Tj's explicit approval.
- Post-launch: reply to every review for 30 days (roster-wide promise from Ironhold's listing).
- SUCCESS TARGETS (60 days): 10,000 free installs; unlock conversion at or above 2.5% = funnel PROVEN for the roster; rating at or above 4.3 stars.
- DECISION RULE: if conversion lands below 1.5% while rating holds 4.3+, the funnel — not the games — is the problem. Mark FOR TJ and report before shell-01's monetization is finalized.

## 5. BUILD ORDER (2–3 weeks)

- Week 1: Numbers engine + era 1 complete + save/clock hardening + sim script.
- Week 2: Eras 2–3, events, endings, prestige, ~80 logbook entries.
- Week 3: Balance from sims, staged store pack, expert review, submission prep.

## 6. COORDINATION RULES

- Tj decides scope, names, spending, submissions, and anything irreversible. Everything else, the working agent owns end to end.
- Log entries dated and appended below, newest last. Items needing Tj are marked FOR TJ.
- Verify live state before asserting. No prices on marketing websites. Passwords/signing keys are Tj's alone, secure forms only, Elderon-pattern keystore handling.

## Log

- **2026-10-28** — Shell created (README.md + this HANDOFF.md). Awaiting project assignment from Tj.
- **2026-11-02** — ASSIGNED: Keep the Light (roster #4 concept, build FIRST). Full build brief installed above by Folder. Its conversion numbers gate the monetization decisions for shells 01 and 03.
- **2026-11-03** — **v1.0.0 DRAFT BUILT** (branch `ccr-89815447-wojzds`, not yet on `main`). Full playable game: three eras, 63 upgrades, 41 events (7 of them scheduled story beats incl. the 1979 automation letter that sets the ending), 58 authored logbook entries plus milestone/event lines, three endings (Legend / The Light Keeps Itself / The Last Keeper), prestige with heirlooms and three extra headlands, offline earning (calendar frozen while away, capped 8 h), free gate at 1930 with a soft wall (economy keeps running, calendar waits), Play Billing via Digital Goods API (`full_unlock`), versioned sanitized fail-soft save, `window.__keepthelight` test API, PWA (manifest, service worker, icons), privacy.html, CI (engine tests + sims + Playwright smoke test), Pages workflow, store copy draft (`store/listing.md`). Headless sim (`node sim/sim.js all`): greedy player reaches the 1930 gate in ~3.2 h of active play and finishes the century in ~5.5 h; neglect takes ~15 h with the light dark; prestige run ~10% faster plus heirloom. Everything in the brief's weeks 1–2 is in; week 3 (balance passes, expert review, store pack) remains.
  - **FOR TJ:** (1) Merge `ccr-89815447-wojzds` → `main` to deploy Pages (workflow enables Pages on first run); URL will be `https://taugustincst.github.io/project-shell-04/` until the repo is renamed. (2) Web version gating: as built, the browser version is gated at 1930 like Play (unlock shows "available in the Google Play version"); `?dev=1` makes the unlock free for testing. Decide: keep the web gate, or make the web build fully open like Ironhold/Bubble Pop. (3) Play Console: create the app, the in-app product `full_unlock` (non-consumable, $4.99), package name (suggest `com.taugustincst.keepthelight`), upload keystore (Elderon-pattern handling, Tj only). (4) Contact email in privacy.html is elderon@augustinnovations.io per the brief; confirm.
  - **Next (agent-owned):** Android TWA project (copy `android/` from Ironhold, swap package/name/host, add `assetlinks.json` entry on taugustincst.github.io once the Play signing fingerprint exists), week-3 balance pass from sims (late-era surplus still generous; consider steeper endowment costs), playtest night-1 feel on a phone, staged store screenshots via the test API, Folder expert review, then submission prep. Post-launch funnel numbers go in this log.
- **2026-11-02** — GitHub Pages ENABLED (workflow deploy, standard static workflow added at .github/workflows/pages.yml). Site: https://taugustincst.github.io/project-shell-04/ — until the game is built, this serves the repo files (README/HANDOFF); the shipped game + privacy.html deploy from this same root.
- **2026-11-03** — Roster-level handoff for Folder (all eight games, decisions, open items, lessons): https://github.com/taugustincst/taugustincst.github.io/blob/main/ROSTER-HANDOFF.md
- **2026-11-02 — FOR CLAUDE: EVALUATION FIX LIST (Folder's expert review, 2026-11-02). Overall 7/10 — ship after fixes. Full report filed in this repo at EVALUATION-2026-11-02.md. This title is the roster's funnel test: P1-1 gates everything downstream. Work in this priority order and log closures here.**
  - P1-1 CRITICAL — CAP OFFLINE EARNINGS BY MAGNITUDE, NOT SECONDS: the 8h cap is on elapsed seconds, but offline nights = elapsed / dayLength and salary+trade accrue nightly. Evaluator probe: a brand-new save left 8h returns 22,307 pounds against a 5,590-pound era-1 upgrade tree (4x the whole era); at max game speed it is 113,881 nights (~312 game-years). Fix: cap offline NIGHTS (suggested 30–90) or grant a flat per-hour rate independent of dayLength; stop salary/trade accrual beyond the cap. Add an engine test asserting the magnitude (the current test only asserts the seconds cap). DO NOT SHIP before this fix — it corrupts the conversion data this title exists to produce.
  - P1-2 ERA-3 MONEY SINK: sim end funds run 35k–661k unspent with all 63 upgrades bought well before 1990, and era 3 (45 years) plays fastest (1.5h vs era 1's 2.2h). Add era-3 sinks (endowment, heritage works, village projects) or steeper era-3 cost scaling; re-run sims until greedy end funds land in the low thousands.
  - P2-3 LOGBOOK VOLUME: 58 authored entries vs the ~80 floor (73%). Add ~20, era 3 (1945–1990) first — quality is 9/10, this is volume only.
  - P2-4 PRESTIGE SPEED: run 2 is only ~9–10% faster in sim; the brief asked for meaningfully faster. Raise the first-completion bonus (suggested ~+25%) and reconcile the drift: the game grants +15%/completion, the sim models +10%.
  - P2-5 EVENT TEETH: half of the 42 events' choices carry no mechanical cost; the brief said events are choices with trade-offs, "never just bonuses." Give more choices real costs or record the deviation as decided here.
  - P3-6 BACKUP RECOVERY: load() writes the .backup key on parse failure but never reads it back — recovery is stash-only. Attempt backup restore before falling back to a fresh start.
  - FOR TJ (already flagged, restated): the ?dev=1 free unlock in the shipped web build must be decided before the TWA ships; staged era screenshots + TWA + Console setup remain Tj's steps.
