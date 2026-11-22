// 지상 화면을 세계마다 찍는다.  node surfshot.js [기기] [세계들] [night]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2] || '', worlds = (process.argv[3] || 'fantasy,wuxia,modern,future').split(','), night = process.argv[4] === 'night', out = path.join(__dirname, '..', '..');
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400); await p.evaluate(() => { __nest.META.tutDone = true; });
  const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(200); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
  for (const w of worlds) {
    await p.evaluate(([w, night, PLOTS, RAZED, SPOT]) => { const G = __nest.G, S = __nest.NEST, ST = __nest.ST; if (G.sealed) { G.forceWorld = w; S.openTrail(G); S.breach(G); } G.world = S.applyWorld(w); G.day = 6; G.plots = PLOTS ? PLOTS.split(',') : ['camp', 'tower', 'garden']; if (RAZED) G.vill[RAZED].razed = true;
      G.march.tonight = { vill: 'field', settle: false }; G.march.tomorrow = { vill: 'fort', settle: false }; G.spot = { type: SPOT || (w === 'wuxia' ? 'camp' : 'cart'), pos: 3, left: 2, vill: 'bell' }; G.vill.bell.trust = 2; G.vill.gaet.host = 40; ST.mode = night ? 'night' : 'day'; }, [w, night, process.env.PLOTS || '', process.env.RAZED || '', process.env.SPOT || '']);
    await click('[data-a="view"][data-v="under"]'); await click('[data-a="view"][data-v="surface"]'); await p.waitForTimeout(700);
    if (devName) { for (const cam of [0, 480]) { await p.evaluate(c => { const S = __nest.ST; S.cam.tx = S.cam.x = Math.max(0, Math.min(960 - S.viewW, c)); }, cam); await p.waitForTimeout(300); await p.screenshot({ path: path.join(out, 'surf_' + w + '_m' + (cam ? 2 : 1) + '.png') }); } }
    else await p.screenshot({ path: path.join(out, 'surf_' + w + (night ? '_night' : '') + '.png') });
  }
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
