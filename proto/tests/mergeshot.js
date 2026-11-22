// 합친 판의 실제 흐름을 폰 크기로 찍는다 (시험이 아니라 눈으로 볼 그림)
// node tests/mergeshot.js <찍을 폴더>
const pw = require('playwright'), fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8'), out = process.argv[2];
(async () => {
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.setDefaultTimeout(15000);
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const shot = async l => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + l + '.png') }); };
  const tap = async s => { const e = await p.$(s); if (!e) { console.log('없음', s); return false; } await e.click(); await p.waitForTimeout(150); return true; };
  await tap('[data-a="start"]'); await p.evaluate(() => { __lair.fresh(11); __lf.auto = false; }); await p.waitForTimeout(300);
  await p.evaluate(() => { __lair.give('shell', 1, 20); __lair.give('gazer', 1, 26); __lair.give('biter', 1, 21); __lair.redraw(); });
  await shot('r1_prep');
  await tap('#lr [data-l="fight"]'); await p.waitForTimeout(2500); await shot('r1_fight_a'); await p.waitForTimeout(5000); await shot('r1_fight_b');
  await p.evaluate(() => { __lair.U.speed = 30; }); await p.waitForSelector('#lr-sheet .lr-sbody.res', { timeout: 40000 }); await p.waitForTimeout(400); await shot('r1_result');
  await tap('#lr-sheet [data-l="next"]'); await p.waitForTimeout(600); await shot('after_r1');
  for (let k = 0; k < 8; k++) {
    const s = await p.evaluate(() => ({ open: __lf.open, scr: __lf.screen, phase: __lair.R.phase })); if (!s.open) break; await shot('lf_' + s.scr.replace(/\s+/g, '_'));
    if (s.scr.indexOf('awake') >= 0) { await p.waitForTimeout(1600); await shot('lf_awake_done'); await tap('#lf .lf-foot button'); }
    else if (s.scr.indexOf('choice') >= 0) { await tap('#lf .lf-opt[data-i="1"]'); await tap('#lf [data-f="cpick"]'); }
    else if (s.scr.indexOf('myth') >= 0) { await tap('#lf .lf-card'); await shot('lf_myth_sel'); const bs = await p.$$('#lf .lf-foot button'); await bs[bs.length - 1].click(); await p.waitForTimeout(300); }
    else { const bs = await p.$$('#lf .lf-opt'); if (bs.length) { await bs[0].click(); await p.waitForTimeout(200); } const f = await p.$$('#lf .lf-foot button'); if (f.length) { await f[f.length - 1].click(); await p.waitForTimeout(1200); } }
    await p.waitForTimeout(300);
  }
  await shot('r2_prep');
  await p.evaluate(() => { const R = __lair.R; __lf.auto = true; R.level = 8; R.gold = 60; ['gulp', 'bell', 'hollow', 'orbit', 'ink', 'preach', 'rift', 'queen'].forEach((k, i) => __lair.give(k, i < 3 ? 2 : 1, [18, 19, 22, 24, 25, 27, 28, 29][i])); __lair.redraw(); });
  for (let k = 0; k < 14; k++) {
    const r = await p.evaluate(() => __lair.R.round); if (r >= 13) break;
    await p.evaluate(() => { const R = __lair.R; if (__lf.pending(R)) __lf.run(R, () => __lair.redraw()); }); await p.waitForTimeout(150);
    const see = r === 7 || r === 10 || r === 12;
    if (see) await shot('r' + r + '_prep');
    if (!(await tap('#lr [data-l="fight"]'))) break;
    if (see) { await p.waitForTimeout(3500); await shot('r' + r + '_fight_a'); await p.waitForTimeout(4500); await shot('r' + r + '_fight_b'); await p.waitForTimeout(5000); await shot('r' + r + '_fight_c'); }
    await p.evaluate(() => { __lair.U.speed = 60; }); await p.waitForSelector('#lr-sheet .lr-sbody.res', { timeout: 40000 }); await p.waitForTimeout(200);
    if (r === 10) await shot('r10_result');
    if (await p.evaluate(() => __lair.R.phase === 'over')) { await shot('over'); break; }
    await tap('#lr-sheet [data-l="next"]'); await p.evaluate(() => { __lair.U.speed = 1; }); await p.waitForTimeout(300);
  }
  await p.evaluate(() => { const R = __lair.R; if (__lf.pending(R)) __lf.run(R, () => __lair.redraw()); }); await p.waitForTimeout(200); await shot('late_prep');
  await p.evaluate(() => __lair.sheet('core')); await p.waitForTimeout(300); await shot('sheet_core');
  console.log(JSON.stringify({ errs, n, round: await p.evaluate(() => __lair.R.round), awake: await p.evaluate(() => __lair.R.awake) })); await b.close();
})();
