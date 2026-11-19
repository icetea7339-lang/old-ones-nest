// 새 판 시험 화면: 시작, 1분, 허물, 4분, 뚫린 뒤를 찍는다.  node bwshot.js [기기]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-BURROW.html', 'utf8'); const devName = process.argv[2] || '', tag = devName ? 'm' : 'pc';
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://bw.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://bw.test/'); await p.waitForTimeout(500); const shot = n => p.screenshot({ path: path.join(__dirname, 'bw_' + tag + '_' + n + '.png') });
  await p.evaluate(() => { __bw.start(7); }); await shot('intro'); await p.locator('[data-a="close"]').click(); await p.waitForTimeout(300);
  await p.evaluate(() => { __bw.V.paused = true; });
  const run = sec => p.evaluate(sec => { const S = __bw.S, B = __bw.B; for (let i = 0; i < sec * 10 && !S.over; i++) { B.tick(S); if (S.molt) return 'molt'; } return 'ok'; }, sec);
  const pickMolt = async () => { await p.waitForTimeout(500); if (await p.locator('[data-a="molt"]').count()) await p.locator('[data-a="molt"]').first().click(); };
  await run(4); await p.waitForTimeout(300); await shot('t4');
  let r = await run(45); await p.waitForTimeout(400); await shot('t50'); let guard = 0;
  while (r !== 'molt' && guard++ < 12) r = await run(15); await p.waitForTimeout(700); await shot('molt'); await pickMolt();
  for (let k = 0; k < 14; k++) { r = await run(15); if (r === 'molt') await pickMolt(); }
  await p.evaluate(() => { __bw.V.z = 2; }); await p.waitForTimeout(500); await shot('t4min');
  await p.evaluate(() => { __bw.B.openUp(__bw.S); });
  for (let k = 0; k < 50; k++) { r = await run(15); if (r === 'molt') await pickMolt(); if (await p.evaluate(() => __bw.S.foes.length) > 0) { await run(6); break; } }
  await p.evaluate(() => { __bw.V.z = 1; __bw.V.cy = 330; }); await p.waitForTimeout(500); await shot('surface');
  const ov = await p.evaluate(() => ({ page: document.scrollingElement.scrollHeight - innerHeight, ctlOver: Math.round(Math.max(...[...document.querySelectorAll('#bw-ctl > *, #bw-hud > *')].map(e => e.getBoundingClientRect().right)) - innerWidth), t: Math.round(__bw.S.t), stage: __bw.S.hero.stage, kin: __bw.S.kin.length, dug: __bw.S.dug, wave: __bw.S.wave }));
  console.log(tag, JSON.stringify(ov), errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
