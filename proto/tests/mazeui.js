// 굴 짓기 화면 시험: 첫 화면 → 시작 → 파기 · 메우기(막는 메우기는 까닭과 함께 거부) → 권속 방 · 방 종류 · 함정
// → 권속을 사서 방에 세우기(누르기-누르기, 진짜 터치로 끌기 하나) → 셋이 하나로(별) → 침입 재생 끝까지(빠르게: 걷기, 어둠, 방 싸움 확대) → 결과
// → 저장 · 새로 고침 · 이어하기 → 넷째 침입까지 → 판 끝 → 다시 한 판
// (창이 길면 창 안에서 굴러 닿으므로, 굴러가는 상자 안의 단추는 화면 밖이어도 괜찮다)
// node tests/mazeui.js [기기: 비우면 PC | "iPhone 14" | a360]   (큰 글씨: FZ=1.3)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-MAZE.html'), 'utf8');
const dev = process.argv[2] || '', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'mazeui_' + tag + (FZM.FZ ? '_fz' + FZM.FZ : '')); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const touch = await p.evaluate(() => navigator.maxTouchPoints > 0);
  let n = 0;
  const snap = async label => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); };
  const shot = async (label, noclip) => { await p.waitForTimeout(200); await snap(label); if (noclip) return; const cl = await p.evaluate(FZM.clipScript); cl.forEach(s => bad.push(label + ': ' + s));
    const off = await p.evaluate(() => { const o = [], W = innerWidth, H = innerHeight; const scrolls = e => { for (let q = e.parentElement; q; q = q.parentElement) { const st = getComputedStyle(q); if (/auto|scroll/.test(st.overflowY) && q.scrollHeight > q.clientHeight + 1) return true; } return false; };
    document.querySelectorAll('#mz button, #mz .mz-slot, #mz-cv, #title button').forEach(e => { if (!e.offsetParent || scrolls(e)) return; const r = e.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1)) o.push((e.id || e.className || e.tagName) + ' 화면 밖 ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }); if (document.documentElement.scrollWidth > W + 1) o.push('가로로 넘친다 ' + document.documentElement.scrollWidth); return o; }); off.forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(120); };
  const tapCell = async c => { const pt = await p.evaluate(c => __maze.pt(c), c); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(150); };
  const ev = (f, a) => p.evaluate(f, a);
  const close = async () => { if (await p.$('#mz-sheet:not([hidden]) [data-m="close"]')) await tap('#mz-sheet [data-m="close"]'); };
  // 첫 화면
  await shot('title');
  { const d = await ev(() => Array.from(document.querySelectorAll('#menu button')).map(b => b.textContent)); if (!d.some(t => /시작/.test(t)) || !d.some(t => /도움말/.test(t)) || !d.some(t => /소리/.test(t))) bad.push('첫 화면 단추가 맞지 않는다 ' + JSON.stringify(d)); }
  await tap('[data-z="help"]'); await shot('help'); if ((await p.$$('#modal .sh-tab')).length !== 3) bad.push('도움말이 세 쪽이 아니다'); await tap('#modal .sh-tab[data-i="1"]'); await tap('#modal [data-z="mclose"]');
  { const s0 = await ev(() => __maze.meta.sound !== false); await tap('[data-z="sound"]'); if ((await ev(() => __maze.meta.sound !== false)) === s0) bad.push('소리 단추가 안 된다'); await tap('[data-z="sound"]'); }
  await tap('[data-z="start"]'); await p.waitForTimeout(400);
  { const d = await ev(() => ({ shown: !document.getElementById('mz').hidden, raid: __maze.M.raid, path: __maze.dbg().path, bar: document.getElementById('mz-bar').textContent, k: __maze.Z.k })); if (!d.shown || d.raid !== 1 || !d.path) bad.push('지도가 열리지 않았다 ' + JSON.stringify(d)); if (!/침입 1\/4/.test(d.bar) || !/20/.test(d.bar)) bad.push('위 띠가 맞지 않는다 ' + d.bar); if (dev && d.k * 64 < 46) bad.push('칸이 너무 작다 ' + Math.round(d.k * 64)); }
  await shot('map');
  // 파기: 길에 붙은 바위
  const dig = await ev(() => __maze.view().grid.find(g => g.canDig && g.r === 2).cell);
  await tapCell(dig); await shot('sheet_rock'); { const d = await ev(() => ({ btn: (document.querySelector('#mz-sheet [data-m="dig"]') || {}).textContent || '' })); if (!/파기 \d/.test(d.btn)) bad.push('바위를 눌렀는데 「파기 n」이 없다 ' + d.btn); }
  { const g0 = await ev(() => __maze.M.gold); await tap('#mz-sheet [data-m="dig"]'); const d = await ev(c => ({ dug: __maze.M.grid[c].dug, gold: __maze.M.gold }), dig); if (!d.dug || d.gold >= g0) bad.push('파지 못했다 ' + JSON.stringify(d)); }
  await shot('sheet_dug');
  // 판 칸을 메운다 (길에서 떨어진 칸) · 길을 끊는 메우기는 까닭과 함께 거부
  await tap('#mz-sheet [data-m="fill"]'); if (await ev(c => __maze.M.grid[c].dug, dig)) bad.push('메우지 못했다'); await close();
  await tapCell(12); { const d = await ev(() => ({ dis: !!document.querySelector('#mz-sheet [data-m="fill"][disabled]'), why: (document.querySelector('#mz-sheet .mz-why') || {}).textContent || '' })); if (!d.dis || !/끊긴다/.test(d.why)) bad.push('길을 끊는 메우기가 거부되지 않았다 ' + JSON.stringify(d)); await shot('sheet_fillwhy'); } await close();
  // 다시 파서 권속 방으로 (길 곁), 길 위 칸 하나는 권속 방, 하나는 함정
  await tapCell(dig); await tap('#mz-sheet [data-m="dig"]'); await tap('#mz-sheet [data-m="use"][data-u="kin"]'); await tap('#mz-sheet [data-m="room"][data-id="pool"]'); await shot('sheet_room');
  { const d = await ev(c => __maze.M.grid[c], dig); if (d.use !== 'kin' || d.room !== 'pool') bad.push('권속 방이 되지 않았다 ' + JSON.stringify(d)); } await close();
  await tapCell(17); await tap('#mz-sheet [data-m="use"][data-u="kin"]'); await close();
  await tapCell(7); await tap('#mz-sheet [data-m="use"][data-u="trap"]'); await tap('#mz-sheet [data-m="trap"][data-id="tr_whisper"]'); await shot('sheet_trap');
  { const d = await ev(() => __maze.M.grid[7]); if (d.use !== 'trap' || d.trap !== 'tr_whisper') bad.push('함정이 깔리지 않았다 ' + JSON.stringify(d)); } await close();
  // 권속을 산다 (카드 → 창 → 「산다」) · 누르기-누르기로 방에 세운다
  await ev(() => { const M = __maze.M; M.gold = 60; M.shop = ['shell', 'gazer', 'gazer', 'gazer', 'hood']; __maze.redraw(); });
  await tap('#mz-shop [data-m="shop"][data-i="0"]'); await shot('sheet_shop'); await tap('#mz-sheet [data-m="buy"]');
  if ((await ev(() => Object.keys(__maze.M.unit).length)) !== 1) bad.push('사지 못했다');
  await tap('#mz-bench .mz-slot.has'); await p.waitForTimeout(120); { const d = await ev(() => __maze.dbg().lit); if (!d.includes(17) || !d.includes(32)) bad.push('고른 권속을 세울 방이 밝지 않다 ' + JSON.stringify(d)); } await shot('lift');
  await tapCell(17); { const d = await ev(() => __maze.M.board[17] || []); if (d.length !== 1) bad.push('누르기-누르기로 세우지 못했다 ' + JSON.stringify(d)); }
  // 끌기: 폰이면 진짜 터치로, PC 면 마우스로
  await tap('#mz-shop [data-m="shop"][data-i="4"]'); await tap('#mz-sheet [data-m="buy"]');
  { const s = await (await p.$('#mz-bench .mz-slot.has')).boundingBox(), to = await ev(() => __maze.pt(32)), a = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    if (touch) { const cdp = await ctx.newCDPSession(p), T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); await T('touchStart', a.x, a.y); for (let k = 1; k <= 8; k++) { await T('touchMove', a.x + (to.x - a.x) * k / 8, a.y + (to.y - a.y) * k / 8); await p.waitForTimeout(16); } await snap('drag'); await T('touchEnd'); }
    else { await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y - 30, { steps: 4 }); await p.mouse.move(to.x, to.y, { steps: 6 }); await snap('drag'); await p.mouse.up(); }
    await p.waitForTimeout(200); const d = await ev(() => __maze.M.board[32] || []); if (d.length !== 1) bad.push('끌어서 본체 방에 세우지 못했다 ' + JSON.stringify(d)); }
  // 셋이 하나로
  for (const i of [1, 2, 3]) { await tap(`#mz-shop [data-m="shop"][data-i="${i}"]`); await tap('#mz-sheet [data-m="buy"]'); if (i === 3) await snap('merge'); }
  { const d = await ev(() => ({ st: Object.values(__maze.M.unit).filter(u => u.kind === 'gazer').map(u => u.star), merges: __maze.Z.merges || 0, toast: document.getElementById('mz-toast').textContent })); if (d.st.join() !== '2' || !d.merges || !/★★/.test(d.toast)) bad.push('셋이 하나가 되지 않았다 ' + JSON.stringify(d)); }
  await tap('#mz-bench .mz-slot.has'); await tapCell(17);
  { const d = await ev(() => ({ units: __maze.dbg().units, board: Object.keys(__maze.M.board).length })); if (d.units < 3) bad.push('지도에 권속이 그려지지 않았다 ' + JSON.stringify(d)); } await shot('map_full');
  // 방의 권속 창
  await tapCell(17); if ((await p.$$('#mz-sheet .mz-urow')).length !== 2) bad.push('방의 권속 창이 맞지 않는다'); await shot('sheet_kin'); await close();
  // 침입: 빠르게 끝까지
  const raid = async (label, full) => {
    await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(300);
    if (!full) { await ev(() => __maze.skip()); await p.waitForTimeout(300); return ev(() => ({ res: __maze.P && __maze.P.res.result, over: __maze.M.phase === 'over' })); }
    await tap('#mz-raid [data-m="spd"][data-v="2"]'); if ((await ev(() => window.__lair.U.speed)) !== 2) bad.push(label + ': 빠르게가 안 눌린다');
    const seen = {}; const t0 = Date.now();
    for (let k = 0; k < 1200; k++) {
      const st = await ev(() => { const P = __maze.P, L = window.__lair, s = L && L.F ? L.stats() : null; return { done: P && P.done, type: P && P.cur && P.cur.type, party: __maze.dbg().party, dark: __maze.dbg().dark, rp: !!(s && s.replay), lr: !document.getElementById('lr') || !document.getElementById('lr').hidden, egg: P && P.egg, i: P && P.i }; });
      if (st.type === 'walk' && st.party && !seen.walk) { seen.walk = 1; await snap(label + '_walk'); }
      if (st.rp && !seen.fight) { seen.fight = 1; await p.waitForTimeout(700); await shot(label + '_fight'); }
      if (st.type === 'egg' && !seen.egg) { seen.egg = 1; await snap(label + '_egg'); }
      if (st.dark) seen.dark = 1;
      if (st.done) break; await p.waitForTimeout(60);
    }
    seen.secs = Math.round((Date.now() - t0) / 1000);
    await p.waitForTimeout(400); const r = await ev(() => ({ res: __maze.P && __maze.P.res.result, over: __maze.M.phase === 'over', sheet: !document.getElementById('mz-sheet').hidden, title: (document.querySelector('#mz-sheet h3') || {}).textContent || '', next: !!document.querySelector('#mz-sheet [data-m="next"]'), lrHidden: !document.getElementById('lr') || document.getElementById('lr').hidden }));
    if (!r.sheet || !r.lrHidden) bad.push(label + ': 침입 뒤에 결과가 없다 ' + JSON.stringify(r)); if (!r.over && !r.next) bad.push(label + ': 결과에 「준비」가 없다');
    if (r.res && !r.over && (r.res.win ? !/막아 냈다/.test(r.title) : !/알이 깎였다/.test(r.title))) bad.push(label + ': 결과 제목이 맞지 않는다 ' + r.title);
    await shot(label + '_result'); return Object.assign(r, { seen });
  };
  const r1 = await raid('r1', true);
  if (!r1.seen.walk) bad.push('일행이 걷는 것을 못 봤다'); if (!r1.seen.fight) bad.push('방 싸움을 못 봤다'); if (!r1.seen.dark) bad.push('굴 속의 어둠이 정신을 깎는 것을 못 봤다'); if (r1.seen.secs > 120) bad.push('빠르게로 침입이 ' + r1.seen.secs + '초 걸렸다');
  await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(300);
  { const d = await ev(() => ({ raid: __maze.M.raid, phase: __maze.Z.phase, bench: !document.getElementById('mz-bench').hidden, path: __maze.dbg().path })); if (d.raid !== 2 || d.phase !== 'prep' || !d.bench || !d.path) bad.push('결과 뒤에 준비로 돌아오지 않았다 ' + JSON.stringify(d)); }
  await shot('prep2');
  // 저장 · 새로 고침 · 이어하기
  { const a = await ev(() => JSON.stringify([__maze.M.raid, __maze.M.gold, __maze.M.egg, __maze.M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join(), __maze.M.board]));
    await p.reload(); await p.waitForTimeout(500); if (!(await p.$('[data-z="cont"]'))) bad.push('새로 고침 뒤에 이어하기가 없다'); else { await shot('title_cont', true); await tap('[data-z="cont"]'); await p.waitForTimeout(400);
      const z = await ev(() => JSON.stringify([__maze.M.raid, __maze.M.gold, __maze.M.egg, __maze.M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join(), __maze.M.board])); if (a !== z) bad.push('이어한 판이 다르다'); }
    if (await ev(() => !!localStorage.getItem('oldnest.lairrun'))) bad.push('굴 짓기가 둥지 전투의 저장을 건드렸다'); }
  // 넷째까지 (넘기기)
  let last = null; for (let k = 0; k < 6; k++) { await ev(() => { const M = __maze.M; M.gold = Math.max(M.gold, 10); }); last = await raid('r' + (k + 2), false); if (last.over) break; await shot('r' + (k + 2) + '_result', true); await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(200); }
  await p.waitForTimeout(300); await shot('over');
  { const d = await ev(() => ({ over: __maze.M.over, again: !!document.querySelector('#mz-sheet [data-m="again"]'), home: !!document.querySelector('#mz-sheet [data-m="home"]'), saved: localStorage.getItem('nestmaze.maze') || localStorage.getItem('oldnest.maze') })); if (!d.over || !d.again || !d.home) bad.push('판 끝 화면이 맞지 않는다 ' + JSON.stringify(d)); if (d.saved) bad.push('끝난 판의 저장이 남았다'); }
  await tap('#mz-sheet [data-m="again"]'); await p.waitForTimeout(300); if ((await ev(() => __maze.M.raid)) !== 1) bad.push('다시 한 판이 처음이 아니다');
  await tap('#mz-bar [data-m="menu"]'); await shot('menu'); await tap('#mz-sheet [data-m="home"]'); if (await ev(() => document.getElementById('title').hidden)) bad.push('처음으로가 안 된다');
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, r1: r1.seen, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1);
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
