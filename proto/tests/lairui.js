// 둥지 전투 (시험) 화면 시험: 제목 → 새 판 → 사기 · 세우기 · 끌어 옮기기 · 합치기 · 방 깔기 → 싸움 (첫째·셋째는 빨리 감고, 둘째는 「보통」 그대로 길이를 잰다) → 결과 → 세 판 → 다시 한 판
// 역할: 카드 · 대기석 · 판 위 · 창에 표지가 있고, 권속을 집으면 세울 줄과 닿는 칸이 보인다
// node tests/lairui.js [기기: 비우면 PC | "iPhone 14" | a360]
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'lairui_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0;
  const shot = async (label, noclip) => { await p.waitForTimeout(200); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); if (noclip) return; const cl = await p.evaluate(FZM.clipScript); cl.forEach(s => bad.push(label + ': ' + s));
    const off = await p.evaluate(() => { const o = [], W = innerWidth, H = innerHeight; document.querySelectorAll('#lr button, #lr .lr-slot, #lr-cv').forEach(e => { if (!e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1)) o.push((e.id || e.className || e.tagName) + ' 화면 밖 ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }); return o; }); off.forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(100); };
  const tapCell = async c => { const pt = await p.evaluate(c => __lair.pt(c), c); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(100); };
  const ev = f => p.evaluate(f);
  await shot('title', true);
  if (!(await p.$('[data-a="trend"]'))) throw new Error('제목에 「새 판 (시험)」이 없다');
  await p.evaluate(() => { window.__lairCoach = 1; });
  await tap('[data-a="trend"]'); await ev(() => __lair.fresh(7)); await p.waitForTimeout(300); await shot('prep');
  if (!(await ev(() => !document.getElementById('lr-coach').hidden))) bad.push('첫 판인데 길잡이가 없다');
  const sc = await ev(() => __lair.U.scale); if (dev && sc * 64 < 52) bad.push('폰에서 칸이 너무 작다 ' + Math.round(sc * 64));
  // 상점 카드마다 역할 표지와 닿는 칸 글이 있다. 적 미리보기에도 표지가 있다
  { const c = await ev(() => Array.from(document.querySelectorAll('#lr-shop .lr-card:not(.empty)')).map(e => ({ role: !!e.querySelector('.lr-role[data-role]'), reach: (e.querySelector('.lr-reach') || {}).textContent || '' }))); if (!c.length || c.some(q => !q.role || !/^(근접|원거리) \d칸$/.test(q.reach))) bad.push('상점 카드에 역할이나 닿는 칸이 없다 ' + JSON.stringify(c));
    const d = await ev(() => ({ b: __lair.dbg().badges, e: __lair.R.enemy.length })); if (d.b !== d.e || !d.e) bad.push('적 미리보기의 역할 표지 ' + d.b + '/' + d.e); }
  // 사기: 한 번 누르면 고르고, 다시 누르면 산다
  await tap('#lr-shop .lr-card[data-i="0"]'); await shot('shop_sel');
  if (!(await p.$('#lr-top [data-l="buy"]'))) bad.push('상점 카드를 골랐는데 「산다」가 없다');
  await tap('#lr-shop .lr-card[data-i="0"]');
  if ((await ev(() => Object.keys(__lair.R.unit).length)) !== 1) bad.push('두 번 눌렀는데 사지 못했다');
  await shot('bought');
  // 세우기: 대기석을 누르고 둥지 칸을 누른다
  if (!(await p.$('#lr-bench .lr-slot.has .lr-role'))) bad.push('대기석 권속에 역할 표지가 없다');
  await tap('#lr-bench .lr-slot.has'); await p.waitForTimeout(120);
  { const d = await ev(() => { const U = __lair.U, u = __lair.R.unit[U.sel.uid], i = __lair.L.unitInfo(u.kind, u.star), t = document.getElementById('lr-toast'); return { rows: __lair.dbg().rows, row: i.row, tip: t.hidden ? '' : t.textContent }; });
    if (d.row !== 'any' && (d.rows.length < 4 || d.rows.some(c => Math.floor(c / 6) !== (d.row === 'front' ? 3 : 5)))) bad.push('집은 권속의 세울 줄이 빛나지 않는다 ' + JSON.stringify(d));
    if (!/앞줄/.test(d.tip)) bad.push('처음 집었는데 줄 안내가 없다'); }
  await shot('lift'); await tapCell(21);
  if (!(await ev(() => __lair.R.board[21]))) bad.push('권속을 세우지 못했다');
  // 끌어 옮기기: 하나 더 사서 대기석에서 판으로 끈다
  await tap('#lr-shop .lr-card[data-i="1"]'); await tap('#lr-top [data-l="buy"]');
  { const s = await p.$('#lr-bench .lr-slot.has'); if (!s) bad.push('둘째를 사지 못했다'); else { const r = await s.boundingBox(), to = await ev(() => __lair.pt(26)); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.mouse.move(r.x + r.width / 2, r.y - 30, { steps: 4 }); await p.mouse.move(to.x, to.y, { steps: 6 }); await p.waitForTimeout(80); { const d = await ev(() => __lair.dbg().range); if (!d.length) bad.push('끄는 중에 닿는 칸이 보이지 않는다'); } await shot('drag', true); await p.mouse.up(); await p.waitForTimeout(100); if (!(await ev(() => __lair.R.board[26]))) bad.push('끌어서 세우지 못했다'); } }
  // 판의 권속을 누르면 이름 줄이 뜨고, 그 줄을 누르면 자세히
  await tapCell(21); if (!(await p.$('#lr-top [data-l="sell"]'))) bad.push('권속을 눌렀는데 팔기 단추가 없다'); await p.waitForTimeout(80);
  { const d = await ev(() => { const R = __lair.R, u = R.unit[R.board[21]], i = __lair.L.unitInfo(u.kind, u.star), g = __lair.dbg(); return { range: g.range, want: Array.from({ length: 36 }, (_, c) => c).filter(c => c !== 21 && __lair.L.cheb(21, c) <= i.range), badges: g.badges, units: Object.keys(R.board).length + R.enemy.length, top: !!document.querySelector('#lr-top .lr-selinfo .lr-role') }; });
    if (!d.range.length || d.range.join() !== d.want.join()) bad.push('고른 권속의 닿는 칸이 맞지 않는다 ' + JSON.stringify(d)); if (d.badges !== d.units) bad.push('판 위 역할 표지 ' + d.badges + '/' + d.units); if (!d.top) bad.push('고른 권속의 이름 줄에 역할이 없다'); }
  await shot('unit_sel');
  await tap('#lr-top .lr-selinfo'); await p.waitForTimeout(700); await shot('sheet_unit'); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('권속 창에 스킬이 없다'); if (!(await p.$('#lr-sheet .lr-rolename'))) bad.push('권속 창에 역할이 없다'); await tap('#lr-sheet [data-l="close"]');
  await tapCell(21);
  // 적을 누르면 바로 창
  { const c = await ev(() => __lair.R.enemy[0].cell); await tapCell(c); await p.waitForTimeout(300); await shot('sheet_enemy'); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('적을 눌렀는데 창이 없다'); else if (!(await p.$('#lr-sheet .lr-rolename'))) bad.push('적 창에 역할이 없다'); if (await p.$('#lr-sheet [data-l="close"]')) await tap('#lr-sheet [data-l="close"]'); }
  { const c = 32; await tapCell(c); await p.waitForTimeout(300); await shot('sheet_core'); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('본체를 눌렀는데 창이 없다'); else await tap('#lr-sheet [data-l="close"]'); }
  // 합치기: 같은 것 셋을 산다
  await ev(() => { const R = __lair.R; R.gold = 30; R.shop = ['gazer', 'gazer', 'gazer', 'hood', 'heap']; __lair.redraw(); });
  for (let i = 0; i < 3; i++) { await tap(`#lr-shop .lr-card[data-i="${i}"]`); await tap('#lr-top [data-l="buy"]'); if (i === 2) { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_merge.png') }); } }
  if (!(await ev(() => Object.values(__lair.R.unit).some(u => u.kind === 'gazer' && u.star === 2)))) bad.push('셋을 샀는데 별이 오르지 않았다');
  await p.waitForTimeout(1700);
  await tap('#lr-bench .lr-slot.has'); await tapCell(27);
  await tap('#lr-shop .lr-card[data-i="3"]'); await tap('#lr-top [data-l="buy"]'); await tap('#lr-bench .lr-slot.has'); await tapCell(28); await p.waitForTimeout(80); { const d = await ev(() => ({ b: __lair.dbg().badges, n: Object.keys(__lair.R.board).length + __lair.R.enemy.length })); if (d.b !== d.n) bad.push('판 위 역할 표지 ' + d.b + '/' + d.n); } await shot('board');
  // 시너지
  if (await p.$('#lr-top [data-l="syn"]')) { await tap('#lr-top [data-l="syn"]'); await p.waitForTimeout(250); await shot('sheet_syn'); if (!(await p.$('#lr-sheet .lr-tiers'))) bad.push('시너지 창에 단계가 없다'); await tap('#lr-sheet [data-l="close"]'); } else bad.push('권속을 넷 세웠는데 시너지 칩이 없다');
  // 방
  await tap('#lr-bench [data-l="room"]'); await p.waitForTimeout(250); await shot('sheet_rooms'); if ((await p.$$('#lr-sheet [data-l="pickroom"]')).length !== 3) bad.push('방이 셋이 아니다');
  await tap('#lr-sheet [data-l="pickroom"][data-i="0"]'); await shot('room_spots');
  { const spot = await ev(() => __lair.view().roomOffer[__lair.U.roomPick].spots[0]); await tapCell(spot); if ((await ev(() => __lair.R.rooms.length)) !== 1) bad.push('방을 깔지 못했다'); await shot('room_placed'); }
  // 싸움
  const times = {};
  const fight = async (label, want) => {
    const slow = label === 'f2';
    await tap('#lr-top [data-l="fight"]'); await p.waitForTimeout(700); await shot(label + '_intro', true);
    { const d = await ev(() => ({ T: __lair.F.T, intro: __lair.F.intro, sp: __lair.U.speed, on: Array.from(document.querySelectorAll('#lr-fight [data-l="speed"]')).map(b => b.textContent + (b.classList.contains('on') ? '*' : '')).join(' ') })); if (d.T !== 0 || d.intro <= 0) bad.push(label + ': 시작하자마자 움직인다 ' + JSON.stringify(d)); if (label === 'f1' && (d.sp !== 1 || d.on !== '느리게 보통* 빠르게')) bad.push('처음 빠르기가 보통이 아니다 ' + JSON.stringify(d)); }
    if (!slow) { await tap('#lr-fight [data-l="speed"][data-v="2"]'); if ((await ev(() => __lair.U.speed)) !== 2) bad.push('빠르게가 안 눌린다'); await ev(() => { __lair.U.speed = 5; }); } else { await tap('#lr-fight [data-l="speed"][data-v="1"]'); if ((await ev(() => __lair.U.speed)) !== 1) bad.push('보통이 안 눌린다'); }
    const seen = {}; let last = -1, stuck = 0, fin = null;
    for (let k = 0; k < (slow ? 2400 : 500); k++) {
      const st = await ev(() => { const s = __lair.stats(), F = __lair.F; if (!s) return null; const E = F.ents; s.cast = Object.values(E).some(e => e.anim === 'cast' && !e.core); s.core = E.core && E.core.anim === 'cast'; s.boss = Object.values(E).some(e => e.boss && e.anim === 'cast'); s.fx = F.fx.length; s.sheet = !document.getElementById('lr-sheet').hidden; s.badges = __lair.dbg().badges; return s; });
      if (!st) break; fin = st;
      if (!st.sheet && !st.done && st.badges !== st.alive) bad.push(label + ': 역할 표지 ' + st.badges + '/' + st.alive + ' T=' + st.T.toFixed(1));
      for (const key of ['shots', 'blocks', 'taunts', 'slows']) if (slow && st[key] && !seen[key]) { seen[key] = 1; n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '_' + key + '.png') }); }
      for (const key of ['cast', 'core', 'boss']) if (st[key] && !seen[key] && st.fx >= 1) { seen[key] = 1; n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '_' + key + '.png') }); }
      if (st.mads && !seen.mad) { seen.mad = 1; n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '_mad.png') }); }
      if (st.T > 6 && !seen.mid) { seen.mid = 1; await shot(label + '_mid'); }
      if (st.T > 3 && !seen.tap && label === 'f2') { seen.tap = 1; const c = await ev(() => { const F = __lair.F, e = Object.values(F.ents).find(q => q.side === 'inv' && !q.dead), r = document.getElementById('lr-cv').getBoundingClientRect(); return { x: r.left + e.x * __lair.U.scale, y: r.top + (e.y - 8) * __lair.U.scale }; }); await p.mouse.click(c.x, c.y); await p.waitForTimeout(250); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('싸우는 중에 적을 눌렀는데 창이 없다'); else { const t1 = await ev(() => __lair.F.T); await p.waitForTimeout(300); if ((await ev(() => __lair.F.T)) !== t1) bad.push('창이 떠 있는데 싸움이 흐른다'); await shot(label + '_tapinfo'); await tap('#lr-sheet [data-l="close"]'); } continue; }
      if (st.sheet) { if (st.i !== st.n) bad.push(label + ': 사건을 다 보여 주지 않았다 ' + st.i + '/' + st.n); if (st.late) bad.push(label + ': 늦은 타격이 남았다 ' + st.late); break; }
      if (st.i === last) { if (++stuck > 140) { bad.push(label + ': 싸움이 멈췄다 ' + JSON.stringify(st)); break; } } else { stuck = 0; last = st.i; }
      await p.waitForTimeout(60);
    }
    (want || []).forEach(w => { if (!seen[w]) bad.push(label + ': ' + w + ' 장면을 못 봤다'); });
    if (slow && fin) { times.f2 = { real: +fin.real.toFixed(1), game: +fin.T.toFixed(1), slows: fin.slows, blocks: fin.blocks, shots: fin.shots, taunts: fin.taunts }; if (!(fin.real >= 45 && fin.real <= 75)) bad.push('둘째 싸움이 보통 빠르기로 ' + fin.real.toFixed(1) + '초다 (45~75)'); if (!fin.shots) bad.push('쏘는 공격이 없었다'); if (!fin.blocks) bad.push('탱커가 막은 표시가 없었다'); }
    await p.waitForTimeout(900); await shot(label + '_result'); if (!(await p.$('#lr-sheet .lr-row'))) bad.push(label + ': 결과에 기여 줄이 없다');
  };
  await fight('f1', ['cast', 'mid']);
  await tap('#lr-sheet [data-l="next"]'); if ((await ev(() => __lair.R.round)) !== 2) bad.push('둘째 싸움으로 넘어가지 않았다'); await shot('prep2');
  // 둘째 판: 규칙을 직접 불러 판을 채운다 (화면은 그대로 따라온다)
  await ev(() => { const L = __lair.L, R = __lair.R; R.level = 5; __lair.give('heap', 2, 22); __lair.give('shell', 2, 20); __lair.give('tangle', 1, 23); R.gold = 20; __lair.redraw(); });
  if (await p.$('#lr-bench [data-l="room"]:not([disabled])')) { await tap('#lr-bench [data-l="room"]'); await tap('#lr-sheet [data-l="pickroom"][data-i="1"]'); const spot = await ev(() => __lair.view().roomOffer[__lair.U.roomPick].spots.slice(-1)[0]); await tapCell(spot); }
  await shot('prep2_full');
  await fight('f2', ['cast', 'mid']);
  await tap('#lr-sheet [data-l="next"]'); await shot('prep3');
  await ev(() => { const R = __lair.R; R.level = 6; __lair.give('maw', 2, 19); __lair.give('mother', 1, 34); __lair.redraw(); });
  await fight('f3', ['cast', 'mid']);
  if (!(await p.$('#lr-sheet [data-l="again"]'))) bad.push('세 판 뒤에 「다시 한 판」이 없다');
  await tap('#lr-sheet [data-l="again"]'); if ((await ev(() => __lair.R.round)) !== 1 || (await ev(() => __lair.U.phase)) !== 'prep') bad.push('다시 한 판이 처음으로 돌아가지 않았다'); if ((await ev(() => __lair.U.speed)) !== 2) bad.push('고른 빠르기를 기억하지 않는다 ' + (await ev(() => __lair.U.speed))); await shot('again');
  // 팔기: 사서 고르고 판다 · 대기석에서 상점으로 끌어도 팔린다
  { await tap('#lr-shop .lr-card[data-i="0"]'); await tap('#lr-top [data-l="buy"]'); const g0 = await ev(() => __lair.R.gold); await tap('#lr-bench .lr-slot.has'); await tap('#lr-top [data-l="sell"]'); if ((await ev(() => Object.keys(__lair.R.unit).length)) !== 0 || (await ev(() => __lair.R.gold)) <= g0) bad.push('팔기가 안 된다');
    await tap('#lr-shop .lr-card[data-i="1"]'); await tap('#lr-top [data-l="buy"]'); const s = await p.$('#lr-bench .lr-slot.has'), r = await s.boundingBox(), sh = await (await p.$('#lr-shop .lr-card[data-i="3"]')).boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.mouse.move(r.x + r.width / 2 + 20, r.y + 30, { steps: 4 }); await p.mouse.move(sh.x + sh.width / 2, sh.y + sh.height / 2, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(120); if ((await ev(() => Object.keys(__lair.R.unit).length)) !== 0) bad.push('상점으로 끌어서 팔지 못했다'); await shot('sold'); }
  await tap('#lr-bar [data-l="exit"]'); if (await ev(() => !document.getElementById('lr').hidden)) bad.push('나가기가 안 된다');
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, times, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1);
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
