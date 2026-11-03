// Renders the app icons and a staged store screenshot with the pre-installed Chromium. node tools/make-icons.js [baseUrl]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0b1220"/>
<g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
<circle cx="256" cy="120" r="150" fill="#ffd977" opacity="0.12"/><circle cx="256" cy="120" r="90" fill="#ffd977" opacity="0.18"/>
<path d="M60 150 L256 95 L256 145 Z" fill="#ffd977" opacity="0.55"/><path d="M452 150 L256 95 L256 145 Z" fill="#ffd977" opacity="0.55"/>
<rect x="0" y="380" width="512" height="132" fill="#16304a"/>
<path d="M150 512 L150 400 Q256 350 362 400 L362 512 Z" fill="#2a2f36"/>
<path d="M214 400 L298 400 L284 170 L228 170 Z" fill="#e8e2d4"/>
<rect x="228" y="250" width="56" height="30" fill="#b7342b"/><rect x="228" y="320" width="56" height="30" fill="#b7342b"/>
<rect x="220" y="150" width="72" height="22" fill="#3b3f46"/><rect x="232" y="105" width="48" height="46" fill="#1a1f29"/>
<circle cx="256" cy="128" r="18" fill="#ffd977"/><path d="M226 105 L286 105 L256 75 Z" fill="#3b3f46"/>
</g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  const out = path.join(__dirname, '..', 'icons'); fs.mkdirSync(out, { recursive: true });
  for (const [name, pad, size] of [['icon-512.png', 0, 512], ['icon-192.png', 0, 192], ['maskable-512.png', 70, 512]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:#0b1220">${svg(pad).replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`)}</body></html>`);
    await p.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } });
  }
  const base = process.argv[2];
  if (base) {
    const q = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
    await q.goto(base + '?dev=1'); await q.waitForSelector('#app:not([hidden])');
    await q.evaluate(() => { const T = window.__keepthelight; T.setYear(1907, 80); T.give({ fuel: 120, funds: 420, standing: 60, village: 130 }); ['wick', 'store', 'contract', 'argand', 'fresnel4', 'cottage', 'assistant', 'bell'].forEach(id => T.state.bought[id] = 1); T.setTab('log'); T.render(); });
    await q.waitForTimeout(400); await q.screenshot({ path: path.join(out, 'screenshot-portrait.png') });
  }
  await b.close(); console.log('icons written');
})();
