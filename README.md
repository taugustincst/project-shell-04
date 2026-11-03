# Keep the Light

**A lighthouse-keeper incremental with an ending.** One rock, one light, one hundred years, 1890 to 1990. Burn oil, automate, electrify; manage storms and keepers; watch a village grow because your light exists. Then decommission the light, or become a legend.

Free on Google Play (through electrification, 1890–1930) with a one-time $4.99 unlock for the rest of the century. No ads, no consumables, fully offline.

Status: **v1.0.0 draft built 2026-11-03**, not yet submitted. Build brief and the living log are in [HANDOFF.md](HANDOFF.md). Repo rename at ship time (Tj's call).

Owner: Tj (Taylor Augustin) / AugustInnovations LLC.

## The game

- **Three eras** that change the economy's shape: The Oil Years (1890–1914, oil hauled up the stair), Flame to Filament (1914–1945, paraffin, generators, war), The Electric Coast (1945–1990, mains, radar, helicopters, the automation letter).
- **63 upgrades** across Lamp, Stores, Keepers, Signals, Station and Village. Some need standing with the Board, not just money.
- **41 events** with real trade-offs, including scheduled story events (Admiralty orders in 1914 and 1939, the 1926 strike, the winter of 1947, the 1953 surge, the 1974 spill, and the 1979 letter that decides the ending).
- **A logbook** of 58 authored story entries across four generations of the Rook family, plus milestone and event entries. The story is the content.
- **Three endings** in 1990: *Legend* (the light stays manned), *The Light Keeps Itself* (you helped automate it), *The Last Keeper* (you fought and lost). Then **prestige**: carry one heirloom upgrade to a new headland (Skerra Head, Pulau Api, Cap Fer), each with its own weather and economy, with a permanent pace bonus per completed century.
- **Offline**: the light keeps earning while you are away (capped at eight hours). The calendar and the story only move while you are watching.
- Portrait, one-handed, large-text, high-contrast and reduce-motion options. Typography is the art.

## Code

No build step, no dependencies at runtime.

| File | What it is |
| --- | --- |
| `js/data.js` | All content: eras, headlands, upgrades, events, logbook, endings. Pure data. |
| `js/engine.js` | The numbers engine: deterministic (seeded RNG), no DOM. Runs in Node and the browser. |
| `js/game.js` | UI, save, game loop, offline handling, prestige, test API. |
| `js/billing.js` | Google Play Billing via the Digital Goods API (TWA). One non-consumable, `full_unlock`. |
| `sim/sim.js` | Headless century simulator: `node sim/sim.js all [seed]` plays five strategies and the three other headlands and reports era timings, economy and endings. |
| `tests/engine.test.js` | Engine unit tests (determinism, gate, endings, offline cap, save sanitizer, every event choice on every headland). |
| `tests/smoke.js` | Playwright smoke test of the real page (works over `file://`, no server needed). |
| `tools/make-icons.js` | Renders icons and the staged store screenshot with Chromium. |

```bash
node tests/engine.test.js      # unit tests
node sim/sim.js all 7          # balance report
npm install && node tests/smoke.js   # browser smoke test (needs Playwright's Chromium)
```

### Test API

`window.__keepthelight` exposes `state`, `setYear(y, day)`, `give({fuel, funds, standing, village})`, `buyAll()`, `forceEvent(id)`, `ff(days)`, `unlock()`, `finish()`, `save()`, `reset()`, `setTab(name)`. Opening the page with `?dev=1` makes the unlock button free (test builds only).

### Saves

`localStorage` key `keepthelight.v1`: `{ run, meta, settings, lastSeen }`. Every field is sanitized and clamped on load; a save that cannot be parsed is copied to `keepthelight.v1.backup` and the game starts fresh rather than crashing. Away-time uses elapsed-time deltas clamped to `[0, 8h]`, so clock changes can neither break nor exploit the save.

## Balance (from `sim/sim.js`, seed 7, before week-3 tuning)

Active play only moves the calendar; a session of twenty minutes is a few game-years early on and a decade or more late.

| Player | To the 1930 gate | Whole century | Ending |
| --- | --- | --- | --- |
| Taps every day, buys the cheapest thing | ~3.2 h | ~5.5 h | depends on the 1979 choice |
| Checks in every 15 minutes | ~3.5 h | ~6.0 h | automated (fewer civic works) |
| Buys nothing, never taps | ~6 h | ~15 h, almost every night dark | automated |
| Second century with an heirloom and the pace bonus | | ~5.0 h | |

## Publishing to Google Play

Ships as a Trusted Web Activity, the Ironhold pattern: a small Android app that opens the PWA full-screen. The Android project is not in this repository yet (see HANDOFF.md, next steps). Package name, keystore and the Play product (`full_unlock`, non-consumable, $4.99) are Tj's calls; the game expects the product id `full_unlock` and acknowledges the purchase by completing the PaymentRequest.

Pages deploys from `main` via `.github/workflows/pages.yml`; the privacy policy is `privacy.html` on that site. Store copy draft: `store/listing.md`.
