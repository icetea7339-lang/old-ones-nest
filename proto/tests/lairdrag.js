// 폰의 손가락 끌기 시험: 대기석의 권속을 판 칸으로 끌어 놓는다. 진짜 터치 사건(CDP)으로 민다.
// 1) 보통 끌기  2) 끌던 중에 브라우저가 끌기를 취소해도(pointercancel) 마지막 자리에 놓이는지  3) 끄는 동안 touchmove 가 막히는지
// node tests/lairdrag.js [기기: 비우면 "iPhone 14" | a360]
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || 'iPhone 14';
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.setDefaultTimeout(9000);
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  await p.click('[data-a="start"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { if (window.__lf) { __lf.auto = true; const R = __lair.R; if (__lf.pending(R)) __lf.run(R, () => __lair.redraw()); } __lair.redraw(); });
  await p.waitForTimeout(200);
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y, id: 1 }] });
  // 대기석 첫 권속을 준비한다
  const give = () => p.evaluate(() => { const R = __lair.R; Object.keys(R.board).forEach(c => { const u = R.board[c]; delete R.board[c]; R.bench[R.bench.indexOf(null)] = u; }); if (!R.bench.some(Boolean)) __lair.give('shell', 1); __lair.redraw(); return R.bench.findIndex(Boolean); });
  const slotPt = i => p.evaluate(i => { const s = document.querySelectorAll('#lr-bench .lr-slot')[i].getBoundingClientRect(); return { x: s.left + s.width / 2, y: s.top + s.height / 2 }; }, i);
  const where = uid => p.evaluate(uid => { const R = __lair.R; const c = Object.keys(R.board).find(c => R.board[c] === uid); return c == null ? null : +c; }, uid);
  const drag = async (i, cell, cancel) => {
    const a = await slotPt(i), t = await p.evaluate(c => __lair.pt(c), cell), uid = await p.evaluate(i => __lair.R.bench[i], i);
    await touch('touchStart', a.x, a.y); const n = 8;
    for (let k = 1; k <= n; k++) { await touch('touchMove', a.x + (t.x - a.x) * k / n, a.y + (t.y - a.y) * k / n); await p.waitForTimeout(16); }
    if (cancel) await p.evaluate(() => document.getElementById('lr').dispatchEvent(new PointerEvent('pointercancel', { bubbles: true })));
    await touch(cancel ? 'touchCancel' : 'touchEnd', t.x, t.y); await p.waitForTimeout(150);
    return { uid, at: await where(uid) };
  };
  { const i = await give(), r = await drag(i, 26, false); if (r.at !== 26) bad.push('손가락으로 끌어 놓지 못했다 ' + JSON.stringify(r)); }
  { const i = await give(), r = await drag(i, 21, true); if (r.at !== 21) bad.push('끌기가 취소되면 마지막 자리에 놓여야 한다 ' + JSON.stringify(r)); }
  // 끄는 동안의 touchmove 는 막혀야 한다(앱이 스크롤로 가져가지 못하게). 끌지 않을 때는 막지 않는다
  { const r = await p.evaluate(() => { const el = document.querySelector('#lr-bench .lr-slot'), mk = () => new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [new Touch({ identifier: 1, target: el, clientX: 10, clientY: 10 })] });
      const U = __lair.U, keep = U.drag; U.drag = { uid: 1 }; const e1 = mk(); el.dispatchEvent(e1); U.drag = null; const e2 = mk(); el.dispatchEvent(e2); U.drag = keep; return [e1.defaultPrevented, e2.defaultPrevented]; });
    if (!r[0] || r[1]) bad.push('끄는 동안에만 touchmove 를 막아야 한다 ' + JSON.stringify(r)); }
  console.log(JSON.stringify({ dev, errs, bad }, null, 1)); await b.close();
  if (errs.length || bad.length) process.exit(1); console.log('끌기 시험 통과');
})();
