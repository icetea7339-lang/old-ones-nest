// 둥지 전투의 그리기 속도: 양쪽 14 이상이 선 셋째 싸움을 CPU 4배 느리게 하여 초당 그림 수를 잰다. 확인: 30 이상.
// node tests/lairperf.js [기기: 비우면 PC | "iPhone 14"]   환경: RATE=4 WANT=30 SPEED=1
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', RATE = +(process.env.RATE || 4), WANT = +(process.env.WANT || 30), SPEED = +(process.env.SPEED || 1);
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = []; p.setDefaultTimeout(20000);
  p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400); await p.click('[data-a="start"]');
  await p.evaluate(() => { __lair.fresh(11); const R = __lair.R, L = __lair.L, g = __lair.give; R.round = 3; R.level = 6; R.enemy = L.enemyOf(R, 3); g('shell', 2, 20); g('gnaw', 2, 21); g('gazer', 2, 27); g('hood', 2, 28); g('tangle', 1, 19); g('brood', 2, 25); g('mother', 1, 34); __lair.redraw(); });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await p.waitForTimeout(2500);
  const t0 = Date.now(); await p.click('#lr-top [data-l="fight"]'); await p.evaluate(s => { __lair.U.speed = s; }, SPEED);
  const meas = ms => p.evaluate(ms => new Promise(res => { let n = 0, worst = 0, last = performance.now(), slow = 0; const t0 = last; const f = t => { n++; const d = t - last; worst = Math.max(worst, d); if (d > 50) slow++; last = t; if (t - t0 < ms) requestAnimationFrame(f); else res({ fps: Math.round(n * 10000 / (t - t0)) / 10, worst: Math.round(worst), slow }); }; requestAnimationFrame(f); }), ms);
  const first = await meas(2500), ents0 = await p.evaluate(() => __lair.stats().ents);
  await p.waitForFunction(() => __lair.F.T > 4, null, { timeout: 60000 });
  const mid = await meas(5000), st = await p.evaluate(() => __lair.stats());
  await b.close();
  const res = { tag: dev || 'pc', rate: RATE, speed: SPEED, units: ents0, first, mid, ents: st.ents, T: Math.round(st.T), errs };
  console.log(JSON.stringify(res)); if (errs.length || mid.fps < WANT || first.fps < WANT * 0.8) process.exit(1);
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
