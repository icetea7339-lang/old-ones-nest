// 처음 받은 몸이 둥지까지 이어지는가: 새 판 → 땅속(이번 몸 창) → 자리를 잡음 → 둥지의 본체가 같은 몸.  node tests/seednest.js [판 수=3]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..'), html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8'), N = +(process.argv[2] || 3);
(async () => {
  const b = await pw.chromium.launch(); let bad = 0;
  for (let run = 0; run < N; run++) {
    const dev = Object.assign({}, pw.devices['iPhone 14']); delete dev.defaultBrowserType;
    const ctx = await b.newContext(dev), p = await ctx.newPage(), errs = []; p.setDefaultTimeout(8000); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__forcePro = true; __nest.META.tutDone = true; });
    const tap = async s => { await p.locator(s).locator('visible=true').first().tap(); await p.waitForTimeout(350); };
    await tap('[data-a="new"]'); await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(700);
    const a = await p.evaluate(() => ({ on: !!document.getElementById('pro') && !!window.__pro, intro: window.__pro && __pro.intro, look: window.__pro && __pro.look, name: (document.querySelector('.pro-seed h2') || {}).textContent }));
    await p.screenshot({ path: path.join(ROOT, 'seednest_' + run + '_card.png') });
    await p.locator('#pro-in-go').tap(); await p.waitForTimeout(250);
    // 잠깐 먹고 자리를 잡는다
    await p.evaluate(() => { const P = window.__pro, s = P.sim; P.manual = true; for (let k = 0; k < 500 && !s.S.ended; k++) { let best = null, bd = 1e9; for (const f of s.S.food) { if (!f.alive) continue; const d = Math.hypot(f.x - s.P.x, f.y - s.P.y); if (d < bd) { bd = d; best = f; } } if (best) P.aim(best.x, best.y); P.step(3); } P.end('settle'); });
    await p.waitForTimeout(500); const line = await p.evaluate(() => (document.querySelector('.pro-seedline') || {}).textContent);
    await p.getByText('둥지를 튼다').first().tap(); await p.waitForTimeout(700);
    for (let i = 0; i < 12 && await p.locator('[data-a="sceneskip"]').locator('visible=true').count(); i++) await tap('[data-a="sceneskip"]');
    await p.waitForTimeout(500); if (await p.locator('#modal [data-a="close"]').locator('visible=true').count()) await tap('#modal [data-a="close"]');
    await p.waitForTimeout(600);
    const st = await p.evaluate(() => { const sl = __nest.G.slime, plain = Object.assign({}, sl, { look: '' }), u = __nest.slimeCanvas(sl, 0).toDataURL(), v = __nest.slimeCanvas(plain, 0).toDataURL();
      return { pro: !!document.getElementById('pro'), look: sl.look, stage: sl.stage, differs: u !== v, scroll: document.scrollingElement.scrollHeight - innerHeight, over: document.documentElement.scrollWidth - innerWidth }; });
    await p.screenshot({ path: path.join(ROOT, 'seednest_' + run + '_nest.png') });
    const ok = a.on && a.intro && st.look === a.look && !st.pro && (a.look === 'drop' || st.differs) && !errs.length; if (!ok) bad++;
    console.log(run, ok ? 'ok' : '어긋남', '| 땅속의 몸', a.look, a.name, '| 끝 창:', line, '| 둥지', JSON.stringify(st), errs.length ? '오류 ' + errs.join(' / ') : 'no errors'); await ctx.close();
  }
  console.log(bad ? '어긋난 판 ' + bad : '모두 이어짐'); await b.close();
})();
