# Keep the Light — todo

Plan for v1.0 per HANDOFF.md. Tick as done; review at the bottom.

## Week 1 — engine, era 1, save, sim
- [x] Deterministic numbers engine (seeded RNG, Node + browser), era 1 economy
- [x] Save: versioned key, sanitizer, fail-soft, elapsed-time clamping
- [x] Headless sim with five strategies and the three other headlands
- [x] `window.__keepthelight` test API
## Week 2 — content, endings, prestige
- [x] Eras 2–3, 63 upgrades, 41 events (7 scheduled story beats), 58 logbook entries
- [x] Three endings driven by the 1979 letter, legend points and standing
- [x] Prestige: heirlooms, three headlands, pace bonus
- [x] Offline earning (calendar frozen, 8 h cap)
- [x] ~~Paid download (2026-11-03)~~ superseded 2026-11-10: free to 1930, $4.99 `full_unlock` for the rest (Play Billing 8, restore, held saves)
- [x] Offline cap by nights (90 max, 320 s each), P1-1 closed and gated in tests, smoke and sim
- [x] Era-3 sinks (Parish works, Lamp-room museum, endowment to 10), 27 more logbook entries (85), prestige +25%, backup save read
## Week 3 — ship prep
- [x] PWA: manifest, service worker, icons, staged screenshot
- [x] Engine unit tests (11) and Playwright smoke test (19 checks), CI + Pages workflows
- [x] privacy.html, store/listing.md draft, README, HANDOFF log
- [ ] FOR TJ: enable GitHub Pages (Settings → Pages → Source: GitHub Actions), then re-run deploy
- [x] Android WebView edition (`android/play`) with billing; emulator launch test and tap-through in CI
- [ ] FOR TAYLOR: Play Console steps in PLAY.md; upload-key secrets
- [x] Week-3 balance pass from sims (`node sim/sim.js check`)
- [x] Screenshots and feature graphic redone for 1.1 (`tools/make-store-art.js`)
- [x] Event teeth (P2-5): every gaining choice costs or risks something, held by an engine test
- [ ] Phone playtest of 1890–1930
- [ ] Folder expert review; submission only on Tj's approval

## Review (2026-11-03)
Built and verified: engine tests 11/11, smoke test 19/19, sims for all strategies and headlands, CI green on GitHub Actions for the branch and for main. Pages deploy blocked on repo setting (see FOR TJ). Not yet done: TWA wrapper, final balance pass, expert review.

## Review (2026-11-10)
1.1.0 on `play/free-unlock-v1.1`: engine tests 13/13, smoke all pass, sim check passes on seeds 7 and 1000, tap-through passes on the emulator stand-in. Open: event teeth (P2-5), store art, phone playtest, Taylor's Console steps.

## Review (2026-11-10, later)
Event teeth and store art on `play/event-teeth`: engine tests 14/14, smoke all pass, sim check passes on seeds 7 and 1000. Open: phone playtest, Taylor's Console steps.
