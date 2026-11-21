// 짧은 한 방울과 여는 이야기 → 한 방울 → 씨앗.  node tests/proshort.js [기기]
const pw = require('playwright'), fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8'), devName = process.argv[2] || '', tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'proshort_' + tag);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(), errs = []; let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300);
  const shot = async n => { await p.waitForTimeout(250); await p.screenshot({ path: path.join(out, n + '.png') }); };
  const clip = () => p.evaluate(() => { const o = []; document.querySelectorAll('#pro .pro-card *, #pro .pro-hud *').forEach(e => { if (!e.offsetParent || e.children.length) return; if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') o.push(e.textContent.slice(0, 20)); const r = e.getBoundingClientRect(); if (r.right > innerWidth + 1) o.push('밖: ' + e.textContent.slice(0, 20)); }); return o; });
  // 1. 여는 이야기 → 짧은 한 방울 (영상은 건너뛴다)
  await p.evaluate(() => { window.__seed = null; playOpening({ seed: 77, asp: 'brood' }).then(s => { window.__seed = s; }); });
  await p.waitForTimeout(500); ok(await p.evaluate(() => !!document.getElementById('intro')), '여는 이야기가 먼저 뜬다'); await shot('1_film');
  await p.click('.iskip'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!window.__pro && window.__pro.sim.sty && window.__pro.sim.sty.short), '영상 뒤에 짧은 한 방울'); await p.evaluate(() => { __pro.closeIntro(); }); await shot('2_short_start');
  ok(await p.evaluate(() => document.querySelector('#pro .pro-skip, #pro-skip') ? document.getElementById('pro-skip').hidden : true), '처음에는 건너뛰기가 없다');
  // 2. 둘째 몸 → 셋째 몸 (부위 하나 달고)
  await p.evaluate(() => { const s = __pro.sim, S = s.S; S.purse.brood = 20; s.buy('mouth_brood'); S.bio = s.STG[1].need + 1; __pro.step(4); });
  await p.waitForTimeout(400); await shot('3_stage2');
  await p.evaluate(() => { const s = __pro.sim, S = s.S; S.bio = s.STG[2].need + 1; __pro.step(4); });
  await p.waitForTimeout(900); await shot('4_end_card');
  ok(await p.evaluate(() => !!document.querySelector('#pro .pro-end #pro-go')), '셋째 몸에 닿으면 끝 카드'); const c1 = await clip(); ok(!c1.length, '끝 카드 잘림 ' + c1.join('|'));
  await p.click('#pro-go'); await p.waitForTimeout(400);
  const sd = await p.evaluate(() => window.__seed);
  ok(sd && sd.aspect && sd.top && sd.top.length, '씨앗이 돌아온다'); console.log(tag, '씨앗', JSON.stringify(sd && { aspect: sd.aspect, sub: sd.sub, top: sd.top, stage: sd.stage }));
  // 3. 두 번째부터: 건너뛸 수 있다
  await p.evaluate(() => { window.__seed = null; playOpening({ noFilm: true, canSkip: true, seed: 91, asp: 'dusk' }).then(s => { window.__seed = s; }); }); await p.waitForTimeout(500);
  await p.evaluate(() => { __pro.closeIntro(); }); ok(await p.evaluate(() => !document.getElementById('pro-skip').hidden), '두 번째부터 건너뛰기'); await shot('5_skip_shown');
  await p.click('#pro-skip'); await p.waitForTimeout(400); const sd2 = await p.evaluate(() => window.__seed); ok(sd2 && sd2.skipped && sd2.aspect === 'dusk', '건너뛰면 고른 빛깔');
  console.log(tag, errs.length ? errs.join(' | ') : 'no errors', bad ? '실패 ' + bad : '통과'); await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
