// 실제 흐름: 새 판 → 땅속의 한 방울 → (봇이 잠깐 하고 자리를 잡음 / 건너뜀) → 둥지
const pw = require('playwright'); const fs = require('fs');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
(async () => { const b = await pw.chromium.launch();
  for (const mode of ['skip', 'play']) { const dev = Object.assign({}, pw.devices['iPhone 14']); delete dev.defaultBrowserType; const ctx = await b.newContext(dev), p = await ctx.newPage(), errs = []; p.setDefaultTimeout(8000); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__forcePro = true; __nest.META.tutDone = true; });
    const tap = async s => { await p.locator(s).locator('visible=true').first().tap(); await p.waitForTimeout(350); };
    await tap('[data-a="new"]'); await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(600);
    const on = await p.evaluate(() => !!document.getElementById('pro') && !!window.__pro); 
    if (mode === 'skip') await p.getByText('건너뛴다').first().tap();
    else { await p.evaluate(() => { const P = window.__pro; for (let k = 0; k < 900 && P.splits < 1; k++) { let best = null, bd = 1e9; for (const m of P.motes) { const d = Math.hypot(m.x - P.player.x, m.y - P.player.y); if (d < bd) { bd = d; best = m; } } if (best) P.aim(best.x, best.y); P.step(3); } P.end('settle'); }); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/proflow_result.png' }); await p.getByText('둥지를 튼다').first().tap(); }
    await p.waitForTimeout(700); const scene1 = await p.evaluate(() => (document.getElementById('scene').innerText || '').replace(/\s+/g, ' ').slice(0, 90));
    for (let i = 0; i < 12 && await p.locator('[data-a="sceneskip"]').locator('visible=true').count(); i++) await tap('[data-a="sceneskip"]');
    await p.waitForTimeout(500); if (await p.locator('#modal [data-a="close"]').locator('visible=true').count()) await tap('#modal [data-a="close"]');
    const st = await p.evaluate(() => ({ pro: !!document.getElementById('pro'), ess: __nest.G.slime.ess, kin: __nest.G.kin.map(m => m.kind + '@' + m.loc), gold: __nest.G.gold, path: __nest.NEST.paths(__nest.G).length, sealed: __nest.G.sealed, runs: __nest.META.runs, G_pro: __nest.G.pro, scroll: document.scrollingElement.scrollHeight - innerHeight }));
    await p.screenshot({ path: __dirname + '/proflow_' + mode + '.png' });
    console.log(mode, '덮개 뜸', on, '| 첫 장면:', scene1, '|', JSON.stringify(st), errs.length ? '오류 ' + errs.join(' / ') : 'no errors'); await ctx.close(); }
  await b.close(); })();
