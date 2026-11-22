// 싸움의 움직임을 이어 붙인 그림으로 본다: node tests/lairfilm.js [시작 초] [간격 ms] [배속]
const pw = require('playwright'), fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const t0 = +(process.argv[2] || 2), gap = +(process.argv[3] || 70), spd = +(process.argv[4] || 1), crop = (process.argv[5] || '').split(',').map(Number), out = path.join(__dirname, 'lairfilm'); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 1 }), p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.click('[data-a="trend"]');
  await p.evaluate(() => { __lair.fresh(7); const g = __lair.give; __lair.R.level = 6; g('shell', 2, 20); g('gnaw', 1, 21); g('gazer', 2, 27); g('hood', 1, 28); g('tangle', 1, 19); g('biter', 1, 22); g('brood', 1, 25); __lair.redraw(); });
  await p.waitForTimeout(1500); await p.click('#lr-top [data-l="fight"]'); await p.evaluate(s => { __lair.U.speed = s; }, spd);
  await p.waitForFunction(t => __lair.F && __lair.F.T >= t, t0, { timeout: 60000 });
  const url = await p.evaluate(([gap, crop]) => new Promise(res => { const cv = document.getElementById('lr-cv'), zoom = crop.length === 4 ? 2 : 1, cx = crop.length === 4 ? crop[0] : 0, cy = crop.length === 4 ? crop[1] : 0, cw = crop.length === 4 ? crop[2] : cv.width, ch = crop.length === 4 ? crop[3] : cv.height, W = cw * zoom, H = ch * zoom, s = document.createElement('canvas'); s.width = W * 4; s.height = H * 2; const x = s.getContext('2d'); x.imageSmoothingEnabled = false; let k = 0; const iv = setInterval(() => { x.drawImage(cv, cx, cy, cw, ch, (k % 4) * W, Math.floor(k / 4) * H, W, H); k++; if (k >= 8) { clearInterval(iv); res(s.toDataURL('image/png')); } }, gap); }), [gap, crop]);
  fs.writeFileSync(path.join(out, `film_${t0}_${gap}_${spd}${crop.length === 4 ? '_z' : ''}.png`), Buffer.from(url.split(',')[1], 'base64'));
  console.log(await p.evaluate(() => JSON.stringify(__lair.stats()))); await b.close();
})();
