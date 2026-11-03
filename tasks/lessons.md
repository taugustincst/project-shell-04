# Lessons — Keep the Light (and the roster)

Patterns recorded after corrections. Read at session start.

- **Local ports are denied in the cloud sandbox.** Drive Playwright over `file://`; keep smoke tests `file://`-capable (service worker simply does not register there). CI can still use a server.
- **CSS `transform` animations override the SVG `transform` attribute.** Position with a wrapping `<g transform>` and animate the child.
- **`pagehide` saves overwrite a planted corrupt save.** Plant test saves with `addInitScript` in a fresh browser context, not by `localStorage.setItem` followed by reload.
- **GitHub Pages cannot be created by the workflow token.** `actions/configure-pages` with `enablement: true` fails with "Resource not accessible by integration" on a repo that has never had Pages enabled, and the session's GitHub proxy blocks the Pages REST path. Tj enables it once per repo in Settings → Pages → Source: GitHub Actions; then re-run the deploy.
- **Use `gh` only for search here**; GitHub MCP tools for everything else. The MCP has no Pages tool.
- **Balance from sims, not vibes.** First sim showed every strategy converging on the same ending with millions unspent: fix was era cost scaling, standing requirements on civic upgrades, a lower standing-per-ship rate, and a scripted decision event (the 1979 letter) so endings depend on choices.
- **Offline progress must not skip story.** Freeze the calendar while away; let only the economy run.
- **Plan in `tasks/todo.md`, verify before done, log corrections here.** (Tj's build guidelines, 2026-11-03.)
