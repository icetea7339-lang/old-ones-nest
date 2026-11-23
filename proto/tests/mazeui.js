// 굴 짓기 화면 시험: 첫 화면 → 시작 → 파기 · 메우기(막는 메우기는 까닭과 함께 거부) → 권속 방 · 방 종류 · 함정
// → 권속을 사서 고르면 판 통로 · 자리 남은 방 · 본체 방이 밝아진다 → 바위·함정은 까닭과 함께 거부 → 누르기-누르기로 통로에(진짜 터치) → 끌어서 본체 방에
// → 셋이 하나로(별) → 침입 재생 끝까지(빠르게: 걷기, 어둠, 방 싸움 확대, 출구 밑 굴 → 본체 방 싸움 → 알의 방) → 결과
// → 저장 · 새로 고침 · 이어하기 → 넷째 침입까지 → 판 끝 → 다시 한 판 → (안내를 켠 새 판) 상점 → 세우기 → 파기 → 침입이 본체 방 → 알로
// 상점은 대기석 위로 올라오는 서랍(카드를 한 번 누르면 고르고 다시 누르면 산다), 방의 권속 아무나 끈다, 헤매는 일행(되돌아감), 방 싸움은 쓰는 칸만 크게, 막으면 무료 하나
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
  const tapAt = async c => { const pt = await p.evaluate(c => __maze.pt(c), c); if (touch) await p.touchscreen.tap(pt.x, pt.y); else await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200); };
  const toast = () => ev(() => document.getElementById('mz-toast').textContent || '');
  const tapCell = async c => { const pt = await p.evaluate(c => __maze.pt(c), c); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(150); };
  const ev = (f, a) => p.evaluate(f, a);
  // 상점 서랍에서 산다: 서랍을 열고, 카드를 한 번 누르면 고르고, 다시 누르면 산다. 사면 서랍이 닫힌다
  const buy = async i => { if (await ev(() => document.getElementById('mz-shop').hidden)) await tap('#mz-bench [data-m="shopt"]'); await tap(`#mz-shop [data-m="shop"][data-i="${i}"]`); await tap(`#mz-shop [data-m="shop"][data-i="${i}"]`); if (!(await ev(() => document.getElementById('mz-shop').hidden))) bad.push('사고 나서 서랍이 닫히지 않았다'); };
  const close = async () => { if (await p.$('#mz-sheet:not([hidden]) [data-m="close"]')) await tap('#mz-sheet [data-m="close"]'); };
  // 첫 화면
  await shot('title');
  if (!(await p.$('#title #mz-tcv'))) bad.push('첫 화면에 굴 그림이 없다');
  { const d = await ev(() => Array.from(document.querySelectorAll('#menu button')).map(b => b.textContent)); if (!d.some(t => /시작/.test(t)) || !d.some(t => /도움말/.test(t)) || !d.some(t => /소리/.test(t))) bad.push('첫 화면 단추가 맞지 않는다 ' + JSON.stringify(d)); }
  await tap('[data-z="help"]'); await shot('help'); if ((await p.$$('#modal .sh-tab')).length !== 3) bad.push('도움말이 세 쪽이 아니다'); await tap('#modal .sh-tab[data-i="1"]'); await tap('#modal [data-z="mclose"]');
  { const s0 = await ev(() => __maze.meta.sound !== false); await tap('[data-z="sound"]'); if ((await ev(() => __maze.meta.sound !== false)) === s0) bad.push('소리 단추가 안 된다'); await tap('[data-z="sound"]'); }
  await tap('[data-z="start"]'); await p.waitForTimeout(400);
  { const d = await ev(() => ({ shown: !document.getElementById('mz').hidden, raid: __maze.M.raid, path: __maze.dbg().path, bar: document.getElementById('mz-bar').textContent, k: __maze.Z.k, vw: innerWidth, vh: innerHeight })); if (!d.shown || d.raid !== 1 || !d.path) bad.push('지도가 열리지 않았다 ' + JSON.stringify(d)); if (!/침입 1\/4/.test(d.bar) || !/20/.test(d.bar)) bad.push('위 띠가 맞지 않는다 ' + d.bar); if (dev && d.k * 64 < 52) bad.push('칸이 너무 작다 ' + Math.round(d.k * 64)); if (d.vw >= 390 && d.vh >= 780 && d.k * 64 < 64) bad.push('390x780 에서 칸이 64 보다 작다 ' + Math.round(d.k * 64)); }
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
  await tap('#mz-bench [data-m="shopt"]'); await shot('drawer'); await tap('#mz-shop [data-m="shop"][data-i="0"]'); if (!(await p.$('#mz-shop .mz-sinfo'))) bad.push('카드를 골랐는데 서랍 위 줄에 이름이 없다'); await shot('drawer_sel');
  await tap('#mz-shop [data-m="shopinfo"]'); if (!(await p.$('#mz-sheet .mz-skill'))) bad.push('고른 카드의 자세히가 없다'); await shot('sheet_shop'); await close(); await tap('#mz-shop [data-m="shop"][data-i="0"]');
  if ((await ev(() => Object.keys(__maze.M.unit).length)) !== 1) bad.push('사지 못했다');
  // 고르면 놓을 수 있는 곳이 모두 밝아진다: 판 통로(입구·출구·함정 빼고), 자리가 남은 권속 방, 본체 방
  const rock = await ev(() => __maze.view().grid.find(g => !g.dug && g.r > 1).cell);
  await tap('#mz-bench .mz-slot.has'); await p.waitForTimeout(150);
  { const d = await ev(() => __maze.dbg().lit); for (const c of [12, 17, 22, 27, 32, dig, 'core']) if (!d.includes(c)) bad.push('고른 권속을 놓을 곳 ' + c + ' 이 밝지 않다 ' + JSON.stringify(d)); for (const c of [2, 37, 7, rock]) if (d.includes(c)) bad.push(c + ' 은 놓을 수 없는데 밝다'); } await shot('lift');
  // 바위 · 함정은 까닭과 함께 거부하고, 고른 것은 그대로 둔다
  await tapAt(rock); { const d = { t: await toast(), sel: await ev(() => !!(__maze.Z.sel && __maze.Z.sel.uid)) }; if (!/바위다\. 먼저 판다/.test(d.t) || !d.sel) bad.push('바위를 누르면 까닭이 떠야 한다 ' + JSON.stringify(d)); } await shot('rock_why');
  await tapAt(7); { const t = await toast(); if (!/함정 칸이다/.test(t)) bad.push('함정 칸 거부 글이 없다 ' + t); }
  // 누르기-누르기로 판 통로에 세운다 (폰이면 진짜 터치로): 그 칸은 권속 방이 된다
  await tapAt(22); { const d = await ev(() => ({ b: __maze.M.board[22] || [], use: __maze.M.grid[22].use, sel: __maze.Z.sel })); if (d.b.length !== 1 || d.use !== 'kin' || d.sel) bad.push('누르기-누르기로 통로에 세우지 못했다 ' + JSON.stringify(d)); }
  // 끌기: 폰이면 진짜 터치로, PC 면 마우스로 → 본체 방
  await buy(4);
  { const s = await (await p.$('#mz-bench .mz-slot.has')).boundingBox(), to = await ev(() => __maze.pt('core')), a = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    if (touch) { const cdp = await ctx.newCDPSession(p), T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); await T('touchStart', a.x, a.y); for (let k = 1; k <= 8; k++) { await T('touchMove', a.x + (to.x - a.x) * k / 8, a.y + (to.y - a.y) * k / 8); await p.waitForTimeout(16); } await snap('drag'); await T('touchEnd'); }
    else { await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y - 30, { steps: 4 }); await p.mouse.move(to.x, to.y, { steps: 6 }); await snap('drag'); await p.mouse.up(); }
    await p.waitForTimeout(200); const d = await ev(() => ({ core: __maze.M.board.core || [], view: __maze.view().core.units.length })); if (d.core.length !== 1 || d.view !== 1) bad.push('끌어서 본체 방에 세우지 못했다 ' + JSON.stringify(d)); }
  await shot('core_room');
  // 본체 방을 누르면 본체 방 창
  await tapAt('core'); { const d = await ev(() => ({ h: (document.querySelector('#mz-sheet h3') || {}).textContent || '', n: document.querySelectorAll('#mz-sheet .mz-urow').length })); if (!/본체 방/.test(d.h) || d.n !== 1) bad.push('본체 방 창이 맞지 않는다 ' + JSON.stringify(d)); await shot('sheet_core'); } await close();
  // 셋이 하나로
  for (const i of [1, 2, 3]) { await buy(i); if (i === 3) await snap('merge'); }
  { const d = await ev(() => ({ st: Object.values(__maze.M.unit).filter(u => u.kind === 'gazer').map(u => u.star), merges: __maze.Z.merges || 0, toast: document.getElementById('mz-toast').textContent })); if (d.st.join() !== '2' || !d.merges || !/★★/.test(d.toast)) bad.push('셋이 하나가 되지 않았다 ' + JSON.stringify(d)); }
  await tap('#mz-bench .mz-slot.has'); await tapCell(22);
  { const d = await ev(() => ({ units: __maze.dbg().units, board: Object.keys(__maze.M.board).length })); if (d.units < 3) bad.push('지도에 권속이 그려지지 않았다 ' + JSON.stringify(d)); } await shot('map_full');
  // 방의 권속 창
  await tapCell(22); if ((await p.$$('#mz-sheet .mz-urow')).length !== 2) bad.push('방의 권속 창이 맞지 않는다'); await shot('sheet_kin'); await close();
  // 방의 첫째 권속을 끌어 대기석으로, 다시 누르기-누르기로 방에
  { const first = await ev(() => __maze.M.board[22][0]), a = await ev(() => __maze.spot(22, 0)), s = await (await p.$('#mz-bench .mz-slot:not(.has)')).boundingBox();
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y + 30, { steps: 4 }); await p.mouse.move(s.x + s.width / 2, s.y + s.height / 2, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
    const d = await ev(f => ({ on: (__maze.M.board[22] || []).includes(f), bench: __maze.M.bench.includes(f) }), first); if (d.on || !d.bench) bad.push('방의 첫째 권속을 끌어내지 못했다 ' + JSON.stringify(d));
    await tap(`#mz-bench .mz-slot[data-u="${first}"]`); await tapCell(22); if (!(await ev(f => (__maze.M.board[22] || []).includes(f), first))) bad.push('끌어낸 권속을 다시 세우지 못했다'); }
  // 침입: 빠르게 끝까지
  const raid = async (label, full) => {
    await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(300);
    if (!full) { await ev(() => __maze.skip()); await p.waitForTimeout(300); return ev(() => ({ res: __maze.P && __maze.P.res.result, over: __maze.M.phase === 'over' })); }
    await tap('#mz-raid [data-m="spd"][data-v="2"]'); if ((await ev(() => window.__lair.U.speed)) !== 2) bad.push(label + ': 빠르게가 안 눌린다');
    const seen = {}; const t0 = Date.now();
    for (let k = 0; k < 1200; k++) {
      const st = await ev(() => { const P = __maze.P, L = window.__lair, s = L && L.F ? L.stats() : null; return { back: !!(P && P.back), crop: !!(L && L.U.crop), sc: L ? L.U.scale : 0, tags: __maze.dbg().tags || 0, done: P && P.done, type: P && P.cur && P.cur.type, party: __maze.dbg().party, dark: __maze.dbg().dark, rp: !!(s && s.replay), lr: !document.getElementById('lr') || !document.getElementById('lr').hidden, egg: P && P.egg, i: P && P.i, cell: P && P.cur && P.cur.cell }; });
      if (st.type === 'walk' && st.party && !seen.walk) { seen.walk = 1; await snap(label + '_walk'); }
      if (st.type === 'travel' && !seen.travel) { seen.travel = 1; await snap(label + '_tunnel'); }
      if (st.rp && st.cell === 'core' && !seen.core) { seen.core = 1; seen.coreCrop = st.crop; await p.waitForTimeout(700); await shot(label + '_corefight'); }
      if (st.type === 'egg' && seen.core) seen.eggAfter = 1;
      if (st.rp && !seen.fight) { seen.fight = 1; seen.crop = st.crop; seen.sc = st.sc; await p.waitForTimeout(700); await shot(label + '_fight'); }
      if (st.back && !seen.back) { seen.back = 1; await snap(label + '_back'); }
      if (st.type === 'egg' && !seen.egg) { seen.egg = 1; await snap(label + '_egg'); }
      if (st.dark) seen.dark = 1;
      if (st.done) break; await p.waitForTimeout(60);
    }
    seen.secs = Math.round((Date.now() - t0) / 1000); await p.waitForTimeout(150); seen.tags = await ev(() => __maze.dbg().tags || 0);
    await p.waitForTimeout(400); const r = await ev(() => ({ res: __maze.P && __maze.P.res.result, over: __maze.M.phase === 'over', sheet: !document.getElementById('mz-sheet').hidden, title: (document.querySelector('#mz-sheet h3') || {}).textContent || '', kinds: __maze.P ? __maze.P.res.steps.map(s => s.type === 'fight' ? (s.core ? 'core' : 'room') : s.type).filter(k => k !== 'walk') : [], next: !!document.querySelector('#mz-sheet [data-m="next"]'), lrHidden: !document.getElementById('lr') || document.getElementById('lr').hidden }));
    if (!r.sheet || !r.lrHidden) bad.push(label + ': 침입 뒤에 결과가 없다 ' + JSON.stringify(r)); if (!r.over && !r.next) bad.push(label + ': 결과에 「준비」가 없다');
    if (r.res && !r.over && (r.res.win ? !/막아 냈다/.test(r.title) : !/알이 깎였다/.test(r.title))) bad.push(label + ': 결과 제목이 맞지 않는다 ' + r.title);
    if (r.kinds.includes('core') && (!seen.travel || !seen.core)) bad.push(label + ': 출구 밑 굴 → 본체 방 싸움을 못 봤다 ' + JSON.stringify(seen)); if (r.kinds.includes('core') && r.kinds.includes('egg') && !seen.eggAfter) bad.push(label + ': 본체 방 뒤에 알의 방이 오지 않았다'); if (seen.core && !seen.coreCrop) bad.push(label + ': 본체 방 싸움이 잘리지 않았다');
    await shot(label + '_result'); return Object.assign(r, { seen });
  };
  const r1 = await raid('r1', true);
  if (!r1.seen.walk) bad.push('일행이 걷는 것을 못 봤다'); if (!r1.seen.fight) bad.push('방 싸움을 못 봤다'); if (!r1.seen.dark) bad.push('굴 속의 어둠이 정신을 깎는 것을 못 봤다'); if (r1.seen.secs > 120) bad.push('빠르게로 침입이 ' + r1.seen.secs + '초 걸렸다'); if (r1.seen.fight && !r1.seen.crop) bad.push('방 싸움이 쓰는 칸만 잘리지 않았다'); if (r1.seen.fight && dev && !(r1.seen.sc > 1.05)) bad.push('방 싸움이 커지지 않았다 ' + r1.seen.sc); if (!r1.seen.tags) bad.push('침입 뒤 방의 꼬리표가 없다');
  await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(300);
  // 막았으면 무료 하나 (방 종류 또는 함정)
  if (r1.res && r1.res.win) { if (!(await p.$('#mz-sheet [data-m="reward"]'))) bad.push('막았는데 보상 창이 없다'); else { await shot('reward'); const o = await ev(() => __maze.view().reward.opts[0]); await tap('#mz-sheet [data-m="reward"][data-i="0"]');
      const d = await ev(id => ({ free: __maze.view().free.map(q => q.id), id }), o.id); if (!d.free.includes(o.id)) bad.push('보상을 골랐는데 무료가 없다 ' + JSON.stringify(d));
      await tapCell(17); await tap(`#mz-sheet [data-m="use"][data-u="${o.type === 'room' ? 'kin' : 'trap'}"]`); const lab = await ev(id => (document.querySelector(`#mz-sheet [data-id="${id}"] b`) || {}).textContent || '', o.id); if (!/· 0/.test(lab)) bad.push('무료인 것이 값 0 으로 보이지 않는다 ' + lab); await shot('free'); if (o.type !== 'room') await tap('#mz-sheet [data-m="use"][data-u="kin"]'); await close(); } }
  { const d = await ev(() => ({ raid: __maze.M.raid, phase: __maze.Z.phase, bench: !document.getElementById('mz-bench').hidden, path: __maze.dbg().path })); if (d.raid !== 2 || d.phase !== 'prep' || !d.bench || !d.path) bad.push('결과 뒤에 준비로 돌아오지 않았다 ' + JSON.stringify(d)); }
  await shot('prep2');
  // 저장 · 새로 고침 · 이어하기
  { const a = await ev(() => JSON.stringify([__maze.M.raid, __maze.M.gold, __maze.M.egg, __maze.M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join(), __maze.M.board]));
    await p.reload(); await p.waitForTimeout(500); if (!(await p.$('[data-z="cont"]'))) bad.push('새로 고침 뒤에 이어하기가 없다'); else { await shot('title_cont', true); await tap('[data-z="cont"]'); await p.waitForTimeout(400);
      const z = await ev(() => JSON.stringify([__maze.M.raid, __maze.M.gold, __maze.M.egg, __maze.M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join(), __maze.M.board])); if (a !== z) bad.push('이어한 판이 다르다'); }
    if (await ev(() => !!localStorage.getItem('oldnest.lairrun'))) bad.push('굴 짓기가 둥지 전투의 저장을 건드렸다'); }
  // 넷째까지 (넘기기)
  let last = null; for (let k = 0; k < 6; k++) { await ev(() => { const M = __maze.M; M.gold = Math.max(M.gold, 10); }); last = await raid('r' + (k + 2), false); if (last.over) break; await shot('r' + (k + 2) + '_result', true); await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(200); await close(); }
  await p.waitForTimeout(300); await shot('over');
  { const d = await ev(() => ({ over: __maze.M.over, again: !!document.querySelector('#mz-sheet [data-m="again"]'), home: !!document.querySelector('#mz-sheet [data-m="home"]'), saved: localStorage.getItem('nestmaze.maze') || localStorage.getItem('oldnest.maze') })); if (!d.over || !d.again || !d.home) bad.push('판 끝 화면이 맞지 않는다 ' + JSON.stringify(d)); if (d.saved) bad.push('끝난 판의 저장이 남았다'); }
  await tap('#mz-sheet [data-m="again"]'); await p.waitForTimeout(300); if ((await ev(() => __maze.M.raid)) !== 1) bad.push('다시 한 판이 처음이 아니다');
  await tap('#mz-bar [data-m="menu"]'); await shot('menu'); await tap('#mz-sheet [data-m="home"]'); if (await ev(() => document.getElementById('title').hidden)) bad.push('처음으로가 안 된다');
  // 안내를 켠 새 판: 상점 → 고르면 빛나는 통로 → 세우기 → 파기 → 침입이 출구 밑 굴로 본체 방 → 알의 방
  let r9 = null;
  { const c2 = await FZM.context(b, dev), q = await c2.newPage(); q.setDefaultTimeout(9000); q.on('pageerror', e => errs.push('2: ' + e.message));
    await q.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await q.route(/fonts\./, r => r.abort()); await q.addInitScript(() => { window.__mazeCoach = 1; }); if (FZM.FZ) await q.addInitScript(FZM.initScript(FZM.FZ));
    await q.goto('http://nest.test/'); await q.waitForTimeout(400); await q.click('[data-z="start"]'); await q.waitForTimeout(400);
    const e2 = (f, a) => q.evaluate(f, a), coach = () => e2(() => { const c = document.getElementById('mz-coach'); return c && !c.hidden ? c.textContent : ''; }), qt = async c => { const pt = await e2(c => __maze.pt(c), c); if (touch) await q.touchscreen.tap(pt.x, pt.y); else await q.mouse.click(pt.x, pt.y); await q.waitForTimeout(200); };
    if (!/상점/.test(await coach())) bad.push('안내의 첫 걸음이 상점이 아니다 ' + (await coach()));
    await q.screenshot({ path: path.join(out, '90_tut_shop.png') });
    await e2(() => { __maze.M.shop = ['hood', 'shell', 'shell', 'shell', 'shell']; __maze.redraw(); });
    await q.click('#mz-bench [data-m="shopt"]'); await q.click('#mz-shop [data-m="shop"][data-i="0"]'); await q.click('#mz-shop [data-m="shop"][data-i="0"]'); await q.waitForTimeout(150);
    if (!/빛나는 통로/.test(await coach())) bad.push('사고 나서 세우기 안내가 없다 ' + (await coach()));
    await q.click('#mz-bench .mz-slot.has'); await q.waitForTimeout(200);
    { const d = await e2(() => { const c = document.getElementById('mz-coach').getBoundingClientRect(), lit = __maze.dbg().lit.filter(x => typeof x === 'number'); return { lit, cy: c.top + c.height / 2, n: lit.length }; }); if (d.n < 5) bad.push('안내 중 고른 권속의 통로가 밝지 않다 ' + JSON.stringify(d)); }
    await q.screenshot({ path: path.join(out, '91_tut_place.png') });
    await qt(17); if ((await e2(() => (__maze.M.board[17] || []).length)) !== 1) bad.push('안내대로 통로에 세우지 못했다');
    if (!/바위/.test(await coach())) bad.push('세운 뒤 파기 안내가 없다 ' + (await coach()));
    { const c = await e2(() => __maze.view().grid.find(g => g.canDig).cell); await qt(c); await q.click('#mz-sheet [data-m="dig"]'); await q.click('#mz-sheet [data-m="close"]'); await q.waitForTimeout(150); }
    if (!/침입/.test(await coach())) bad.push('판 뒤 침입 안내가 없다 ' + (await coach()));
    await q.click('#mz-bench [data-m="raid"]'); await q.waitForTimeout(200); await q.click('#mz-raid [data-m="spd"][data-v="2"]');
    const seen = {}; for (let k = 0; k < 1500; k++) { const st = await e2(() => { const P = __maze.P, L = window.__lair; return { type: P && P.cur && P.cur.type, rp: !!(L && L.U.replay), cell: P && P.cur && P.cur.cell, done: P && P.done, pos: P && P.pos, at: P && P.at }; });
      if (st.type === 'travel' && !seen.travel) { seen.travel = 1; await q.waitForTimeout(120); await q.screenshot({ path: path.join(out, '92_tunnel.png') }); }
      if (st.rp && st.cell === 'core' && !seen.core) { seen.core = 1; await q.waitForTimeout(800); await q.screenshot({ path: path.join(out, '93_corefight.png') }); }
      if (st.type === 'egg' && !seen.egg) { seen.egg = seen.core ? 2 : 1; seen.eggPos = st.pos; await q.waitForTimeout(150); await q.screenshot({ path: path.join(out, '94_egg.png') }); }
      if (st.done) break; await q.waitForTimeout(50); }
    const kinds = await e2(() => __maze.P.res.steps.map(s => s.type === 'fight' ? (s.core ? 'core' : 'room') : s.type).filter(k => k !== 'walk')); r9 = { seen, kinds };
    if (!kinds.includes('core')) bad.push('본체 방 싸움이 없다(일행이 그 전에 다 쓰러짐) ' + JSON.stringify(kinds)); else if (!seen.travel || !seen.core) bad.push('침입이 출구 밑 굴로 본체 방에 가지 않았다 ' + JSON.stringify(seen));
    if (kinds.includes('egg') && seen.egg !== 2) bad.push('알의 방이 본체 방 뒤에 오지 않았다 ' + JSON.stringify(seen));
    const ep = await e2(() => __maze.pt('egg')), cr = await e2(() => document.getElementById('mz-cv').getBoundingClientRect().bottom); if (ep.y > cr) bad.push('알의 방이 지도 밖으로 나갔다');
    await c2.close(); }
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, r1: r1.seen, r9, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1);
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
