// 폰의 유령 클릭 시험: 권속이 선 방을 손가락으로 누르면 방 창이 뜬다. 손을 뗄 때 따라오는 click 이
// 막 뜬 창의 단추(대기석, 팔기)를 눌러 권속이 내려가면 안 된다. 지도 위·가운데·아래의 방에서 본다.
// node tests/mazetap.js [기기: 비우면 "iPhone 14" | a360]
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-MAZE.html'), 'utf8'), dev = process.argv[2] || 'iPhone 14';
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.setDefaultTimeout(9000);
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  await p.tap('[data-z="start"]'); await p.waitForTimeout(500);
  for (let k = 0; k < 6; k++) { const c = await p.$('#mz-coach [data-m="tutoff"]'); if (c) { await c.tap(); await p.waitForTimeout(120); } }
  for (const cell of [7, 12, 17, 22, 27, 32]) {
    await p.evaluate(c => { const M = __maze.M; M.gold = 50; Object.keys(M.board).forEach(k => delete M.board[k]); M.unit = {}; M.bench = [null, null, null, null, null, null];
      for (const k of [c, c - 5]) if (M.grid[k] && !M.grid[k].dug) M.grid[k].dug = true;
      for (let i = 0; i < 2; i++) { M.shop[i] = M.shop[i] || 'shell'; MAZE.buy(M, i); } M.bench.filter(Boolean).forEach(u => MAZE.move(M, u, { cell: c })); __maze.redraw(); }, cell);
    const before = await p.evaluate(c => (__maze.M.board[c] || []).length, cell);
    const pt = await p.evaluate(c => __maze.pt(c), cell); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(450);
    const after = await p.evaluate(c => ({ n: (__maze.M.board[c] || []).length, bench: __maze.M.bench.filter(Boolean).length, sheet: __maze.Z.sheet && __maze.Z.sheet.kind }), cell);
    if (before !== 2) bad.push(cell + ': 준비가 안 됐다 ' + before);
    if (after.n !== before || after.bench) bad.push(cell + ': 방을 누르자 권속이 내려갔다 ' + JSON.stringify(after));
    if (after.sheet !== 'cell') bad.push(cell + ': 방 창이 뜨지 않았다 ' + JSON.stringify(after));
    const x = await p.$('#mz-sheet [data-m="close"]'); if (x) { await p.waitForTimeout(500); await x.tap(); await p.waitForTimeout(250); }
  }
  // 창이 뜬 뒤 잠시 지나서 누르는 단추는 그대로 들어야 한다
  { const cell = 32, pt = await p.evaluate(c => __maze.pt(c), cell); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(700);
    const btn = await p.$('#mz-sheet [data-m="tobench"]'); if (!btn) bad.push('대기석 단추가 없다'); else { await btn.tap(); await p.waitForTimeout(300); const n = await p.evaluate(() => __maze.M.bench.filter(Boolean).length); if (n !== 1) bad.push('잠시 뒤의 대기석 단추가 듣지 않는다 ' + n); } }
  // 손가락이 닿는 순간부터 쥐는지(앱이 스크롤로 가져가지 못하게), 그리고 진짜 터치로 대기석 -> 통로 끌기
  { await p.evaluate(() => { const c = document.querySelector('#mz-sheet [data-m="close"]'); if (c) c.click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { const M = __maze.M; M.gold = 50; Object.keys(M.board).forEach(k => delete M.board[k]); M.unit = {}; M.bench = [null, null, null, null, null, null]; M.shop[0] = M.shop[0] || 'shell'; MAZE.buy(M, 0); __maze.redraw(); });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const mk = el => { const e = new TouchEvent('touchstart', { cancelable: true, bubbles: true, touches: [new Touch({ identifier: 1, target: el, clientX: 5, clientY: 5 })] }); el.dispatchEvent(e); return e.defaultPrevented; };
      return { slot: mk(document.querySelector('#mz-bench .mz-slot.has')), cv: mk(document.getElementById('mz-cv')), btn: mk(document.querySelector('#mz-bench .mz-shopbtn') || document.body) }; });
    if (!r.slot || !r.cv || r.btn) bad.push('닿는 순간 쥐기가 틀렸다 ' + JSON.stringify(r));
    const cdp = await ctx.newCDPSession(p), T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const sb = await (await p.$('#mz-bench .mz-slot.has')).boundingBox(), a = { x: sb.x + sb.width / 2, y: sb.y + sb.height / 2 }, t = await p.evaluate(() => __maze.pt(17)), uid = await p.evaluate(() => __maze.M.bench.find(Boolean));
    await T('touchStart', a.x, a.y); for (let i = 1; i <= 10; i++) { await T('touchMove', a.x + (t.x - a.x) * i / 10, a.y + (t.y - a.y) * i / 10); await p.waitForTimeout(16); } await T('touchEnd', t.x, t.y); await p.waitForTimeout(300);
    const w = await p.evaluate(u => MAZE.whereOf(__maze.M, u), uid); if (!w || w.cell !== 17) bad.push('진짜 터치로 끌어 놓지 못했다 ' + JSON.stringify(w)); }
  console.log(JSON.stringify({ dev, errs, bad }, null, 1)); await b.close();
  if (errs.length || bad.length) process.exit(1); console.log('유령 클릭 시험 통과');
})();
