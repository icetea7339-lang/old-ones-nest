// 현황판이 큰 숫자에서도 한 줄에 드는가 (PC 너비별)
const pw = require('playwright'); const fs = require('fs');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
(async () => { const b = await pw.chromium.launch();
  for (const w of [800, 1024, 1180, 1280, 1366, 1440, 1600]) { const ctx = await b.newContext({ viewport: { width: w, height: 720 } }); const p = await ctx.newPage(); p.setDefaultTimeout(7000);
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(250); await p.evaluate(() => { __nest.META.auto = false; }); await p.evaluate(() => { __nest.META.tutDone = true; });
    const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(160); };
    await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(200); await click('[data-a="sceneskip"]'); await p.waitForTimeout(200); if (await p.locator('#modal [data-a="close"]').count()) await click('#modal [data-a="close"]');
    await p.evaluate(() => { const G = __nest.G; G.day = 40; G.gold = 88888; G.faith = 60; G.fear = 300; ['abyss','nebula','brood','dusk','hunger'].forEach(a => G.slime.ess[a] = 700); G.falls = 1; }); await click('[data-a="core"]');
    const r = await p.evaluate(() => { const h = document.getElementById('hud'); const last = [...h.querySelectorAll('button')].pop().getBoundingClientRect(); return { over: h.scrollWidth - h.clientWidth, lastRight: Math.round(last.right), w: innerWidth }; });
    console.log(w, JSON.stringify(r), r.over > 1 || r.lastRight > r.w ? '넘침' : 'ok'); if (w === 1280) await p.screenshot({ path: __dirname + '/hud1280.png', clip: { x: 0, y: 0, width: 1280, height: 60 } }); await ctx.close(); }
  await b.close(); })();
