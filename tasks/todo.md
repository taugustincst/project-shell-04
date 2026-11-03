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
- [x] Paid download (2026-11-03): the whole century is open from 1890; the 1930 gate, Play Billing and restore were removed
## Week 3 — ship prep
- [x] PWA: manifest, service worker, icons, staged screenshot
- [x] Engine unit tests (11) and Playwright smoke test (19 checks), CI + Pages workflows
- [x] privacy.html, store/listing.md draft, README, HANDOFF log
- [ ] FOR TJ: enable GitHub Pages (Settings → Pages → Source: GitHub Actions), then re-run deploy
- [ ] Android TWA wrapper (Ironhold pattern) once package name and keystore exist
- [ ] Week-3 balance pass from sims (late-era surplus); phone playtest of night 1
- [ ] Folder expert review; submission only on Tj's approval

## Review (2026-11-03)
Built and verified: engine tests 11/11, smoke test 19/19, sims for all strategies and headlands, CI green on GitHub Actions for the branch and for main. Pages deploy blocked on repo setting (see FOR TJ). Not yet done: TWA wrapper, final balance pass, expert review.
