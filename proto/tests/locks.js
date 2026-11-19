// 해금: 처음 시작한 사람에게 무엇이 잠겨 있고, 해내면 열리는가
const pw = require('playwright'); const fs = require('fs');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
(async () => {
  const b = await pw.chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 768 } }), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; });
  const click = s => p.locator(s).locator('visible=true').first().click();
  await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await click('[data-a="sceneskip"]'); await p.waitForTimeout(300); await click('#modal [data-a="close"]');
  const cellXY = i => p.evaluate(i => { const b = document.getElementById('stage').getBoundingClientRect(), u = b.height / 550, S = __nest.ST; return [b.left + (20 + (i % 5) * 184 + 92 - S.cam.x + S.ox) * u, b.top + (48 + Math.floor(i / 5) * 124 + 62) * u]; }, i);
  const lockedIn = async () => { const o = {}; for (const v of ['fight', 'trick', 'home']) { await click(`[data-a="tab"][data-g="cell"][data-v="${v}"]`); await p.waitForTimeout(100); o[v] = await p.$$eval('#view .opt', es => es.map(e => (e.classList.contains('lockd') ? '🔒' : '') + e.querySelector('b').textContent.replace(/\s*[\d,]+G/, '').trim())); } return o; };
  await p.mouse.click(...await cellXY(1)); await p.waitForTimeout(250);
  const a = await lockedIn(); console.log('처음:'); for (const k in a) console.log('  ' + k + ': ' + a[k].join(', '));
  console.log('  잠긴 시설의 설명:', await p.$eval('#view .opt.lockd span', e => e.textContent).catch(() => '(잠긴 것 없음)'));
  await click('[data-a="tab"][data-g="cell"][data-v="fight"]'); await click('[data-a="build"][data-v="trap"]'); await p.waitForTimeout(200);
  console.log('  함정:', (await p.$$eval('#view [data-a="trap"]', es => es.map(e => (e.classList.contains('lockd') ? '🔒' : '') + e.querySelector('b').textContent.replace(/\s*[\d,]+G/, '').trim()))).join(', '));
  // 첫 밤을 넘기고, 포로를 잡은 것으로 한다
  await p.evaluate(() => { const G = __nest.G; G.stats.repels = 1; G.stats.captives = 1; G.stats.kills = 60; G.gold = 5200; });
  await p.keyboard.press('Escape'); await p.mouse.click(...await cellXY(7)); await p.waitForTimeout(400);
  console.log('알림:', await p.$eval('#toast', e => e.textContent));
  const c = await lockedIn(); console.log('첫 밤·첫 포로·60명·5천G 뒤:'); for (const k in c) console.log('  ' + k + ': ' + c[k].join(', '));
  console.log('흔적 기록:', JSON.stringify(await p.evaluate(() => Object.keys(__nest.META.feats))));
  await p.keyboard.press('Escape'); await click('[data-a="quit"]'); await p.waitForTimeout(200); await click('[data-a="codex"]'); await click('[data-a="tab"][data-g="codex"][data-v="sign"]');
  console.log('도감의 별자리:', (await p.$$eval('#modal .node', es => es.map(e => (e.classList.contains('lockd') ? '🔒' : '') + e.children[1].textContent))).join(', '));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
