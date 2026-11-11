// Renders the four Play phone screenshots (1080x1920) and the feature graphic (1024x500) from the
// current build, staged through the window.__keepthelight test API. Needs the pre-installed Chromium.
//   python3 -m http.server 8765 &   then   node tools/make-store-art.js http://localhost:8765/
// End-of-run numbers on screen 4 are a casual century from `node sim/sim.js all 7`.
// Screens 2 to 4 are past 1930, so they stage the unlocked state: the listing says one purchase opens them.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const base = process.argv[2] || 'http://localhost:8765/';
const out = path.join(__dirname, '..', 'store');
const SHOTS = [
  ['screenshot-01-logbook.png', T => { T.setYear(1890, 4); T.give({ fuel: 26, funds: 508, standing: 10, village: 40 }); T.setTab('log'); }],
  ['screenshot-02-lighthouse.png', T => { T.state.unlocked = true; T.setYear(1916, 40); T.give({ fuel: 140, funds: 2400, standing: 55, village: 180 });
    ['wick', 'store', 'contract', 'argand', 'fresnel4', 'cottage', 'assistant', 'bell', 'barometer', 'landing'].forEach(id => T.state.bought[id] = 1);
    T.setTab('log'); T.forceEvent('fog'); }],
  ['screenshot-03-station.png', T => { T.state.unlocked = true; T.setYear(1929, 300); T.give({ funds: 1e6, standing: 400, village: 600 }); T.buyAll(); T.buyAll(); T.buyAll();
    T.setYear(1951, 120); T.give({ fuel: 900, funds: 9400, standing: 140, village: 640 }); T.setTab('station'); }],
  ['screenshot-04-village.png', T => { T.state.unlocked = true; T.setYear(1989, 360); T.give({ fuel: 2000, funds: 90000, standing: 3045, village: 3150 }); T.buyAll(); T.buyAll(); T.buyAll();
    Object.assign(T.state.stats, { shipsSaved: 205871, wrecks: 80, rescues: 5, keepersRaised: 7 }); T.finish(); }],
];
(async () => {
  const b = await chromium.launch();
  for (const [name, stage] of SHOTS) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    const q = await ctx.newPage();
    await q.goto(base + '?dev=1'); await q.waitForSelector('#app:not([hidden])');
    await q.evaluate(`(${stage.toString()})(window.__keepthelight); window.__keepthelight.render();`);
    await q.waitForTimeout(600); await q.screenshot({ path: path.join(out, name) });
    await ctx.close(); console.log('wrote store/' + name);
  }
  const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'icons', 'icon-512.png')).toString('base64');
  const shot = 'data:image/png;base64,' + fs.readFileSync(path.join(out, 'screenshot-01-logbook.png')).toString('base64');
  const g = await b.newPage({ viewport: { width: 1024, height: 500 } });
  await g.setContent(`<html><body style="margin:0;width:1024px;height:500px;background:#0b1220;overflow:hidden;position:relative;font-family:Georgia,serif">
    <img src="${icon}" style="position:absolute;left:64px;top:108px;width:132px;height:132px;border-radius:28px">
    <div style="position:absolute;left:64px;top:252px;color:#f3ecdc;font-size:58px;font-weight:bold">Keep the Light</div>
    <div style="position:absolute;left:64px;top:328px;width:520px;color:#aab3c2;font:24px/1.35 sans-serif">An incremental that ends. One lighthouse, 1890 to 1990, a century in a logbook.</div>
    <div style="position:absolute;left:672px;top:44px;width:292px;height:600px;border-radius:36px;background:#2a2f36;padding:8px;box-sizing:border-box">
      <img src="${shot}" style="width:276px;border-radius:28px;display:block"></div></body></html>`);
  await g.waitForTimeout(300); await g.screenshot({ path: path.join(out, 'feature-graphic-1024x500.png') });
  console.log('wrote store/feature-graphic-1024x500.png');
  await b.close();
})();
