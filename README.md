# Keep the Light

**A lighthouse-keeper incremental with an ending.** One rock, one light, one hundred years, 1890 to 1990. Burn oil, automate, electrify; manage storms and keepers; watch a village grow because your light exists. Then decommission the light, or become a legend.

Free on Google Play: 1890 to the first bulb in 1930 is free and complete, and one in-app purchase ($4.99, `full_unlock`) opens the rest of the century, the three endings and three more headlands. No ads, no consumables, fully offline.

Status: **v1.1.0** (free with one unlock, offline earnings capped by nights), not yet submitted. Build brief and the living log are in [HANDOFF.md](HANDOFF.md). Repo rename at ship time (Tj's call).

Owner: Tj (Taylor Augustin) / AugustInnovations LLC.

## The game

- **Three eras** that change the economy's shape: The Oil Years (1890–1914, oil hauled up the stair), Flame to Filament (1914–1945, paraffin, generators, war), The Electric Coast (1945–1990, mains, radar, helicopters, the automation letter).
- **65 upgrades** across Lamp, Stores, Keepers, Signals, Station and Village. Some need standing with the Board, not just money.
- **41 events** with real trade-offs, including scheduled story events (Admiralty orders in 1914 and 1939, the 1926 strike, the winter of 1947, the 1953 surge, the 1974 spill, and the 1979 letter that decides the ending).
- **A logbook** of 85 authored story entries across four generations of the Rook family, plus milestone and event entries. The story is the content.
- **Three endings** in 1990: *Legend* (the light stays manned), *The Light Keeps Itself* (you helped automate it), *The Last Keeper* (you fought and lost). Then **prestige**: carry one heirloom upgrade to a new headland (Skerra Head, Pulau Api, Cap Fer), each with its own weather and economy, with a permanent pace bonus per completed century.
- **Offline**: the light keeps earning while you are away, up to 90 nights (one night for every five minutes or so, eight hours at most), however fast the calendar runs. The calendar and the story only move while you are watching.
- Portrait, one-handed, large-text, high-contrast and reduce-motion options. Typography is the art.

## Code

No build step, no dependencies at runtime.

| File | What it is |
| --- | --- |
| `js/data.js` | All content: eras, headlands, upgrades, events, logbook, endings. Pure data. |
| `js/engine.js` | The numbers engine: deterministic (seeded RNG), no DOM. Runs in Node and the browser. |
| `js/game.js` | UI, save, game loop, offline handling, prestige, test API. |
| `sim/sim.js` | Headless century simulator: `node sim/sim.js all [seed]` plays five strategies and the three other headlands and reports era timings, economy and endings. |
| `tests/engine.test.js` | Engine unit tests (determinism, the 1930 gate and the unlock, endings, the offline cap and its magnitude, save sanitizer, every event choice on every headland). |
| `tests/smoke.js` | Playwright smoke test of the real page (works over `file://`, no server needed). |
| `tools/make-icons.js` | Renders icons and the staged store screenshot with Chromium. |

```bash
node tests/engine.test.js      # unit tests
node sim/sim.js all 7          # balance report
node sim/sim.js check 7        # the balance gates CI holds the game to
npm install && node tests/smoke.js   # browser smoke test (needs Playwright's Chromium)
```

### Test API

`window.__keepthelight` exposes `state`, `setYear(y, day)`, `give({fuel, funds, standing, village})`, `buyAll()`, `forceEvent(id)`, `ff(days)`, `finish()`, `save()`, `reset()`, `setTab(name)`, plus `billing`, `unlockShown()` and `showUnlock(reason)`.

### Saves

`localStorage` key `keepthelight.v1`: `{ run, meta, settings, lastSeen }`. Every field is sanitized and clamped on load; each save first copies the last good save to `keepthelight.v1.backup`; a save that cannot be parsed is set aside and the backup loads instead, or the game starts fresh rather than crashing. A save never carries the unlock: Google Play's answer does. Away-time uses elapsed-time deltas clamped to `[0, 8h]`, so clock changes can neither break nor exploit the save.

## Balance (from `node sim/sim.js check 7`, 1.1.0)

Active play only moves the calendar; a session of twenty minutes is a few game-years early on and a decade or more late.

| Player | To 1930 (free) | Whole century | Last purchase | Ending |
| --- | --- | --- | --- | --- |
| Taps every day, buys the cheapest thing | ~3.2 h | ~5.5 h | 1988 | legend |
| Lamp first, then the rest | ~3.2 h | ~5.5 h | 1988 | legend |
| Village and civic works first | ~3.2 h | ~5.5 h | 1989 | legend |
| Checks in every 15 minutes | ~3.5 h | ~6.0 h | 1981 | automated |
| Buys nothing, never taps | ~6 h | ~15 h, almost every night dark | | automated |
| Second century with an heirloom and the +25% pace | | ~4.4 h | | |

Eight hours away on day one earns about £119 over 90 nights, against an oil-years tree of about £6,700. Parish works, a longer village endowment and the lamp-room museum keep era 3 buying to the end.

## Publishing to Google Play

Free on Google Play with the whole game packed inside it and one in-app purchase (`android/play`, see `PLAY.md`). Pages deploys only the store page from `main` (`site/index.html`, the privacy policy `privacy.html` and the store graphics), not the playable game. Store copy: `store/listing.md`.

