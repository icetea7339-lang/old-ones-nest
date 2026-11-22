// 둥지 전투 화면 시험 (온전한 판: 세 막 x 다섯 라운드)
// 제목 → 새 판 → 사기 · 세우기 · 끌어 옮기기 · 합치기 · 창들(권속, 적, 본체, 진액, 판, 조사자, 메뉴) · 방 깔기 → 싸움(공포 판정의 주사위) → 결과 → 신화 단계(LF 가 저절로 고른다)
// → 나갔다가 이어하기 → 둘째 싸움은 「보통」 빠르기를 잰다 → 정예 켜기 → 열다섯째 라운드까지 → 판 끝 화면 → 다시 한 판 → 팔기 → 나가기
// 고르는 화면(보상, 신화 단계, 조우)은 lairflow.js 의 몫이라 여기서는 window.__lf.auto 를 켜고 지나간다.
// node tests/lairui.js [기기: 비우면 PC | "iPhone 14" | a360]
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'lairui_' + tag + (FZM.FZ ? '_fz' + FZM.FZ : '')); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0;
  const snap = async label => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); };
  const shot = async (label, noclip) => { await p.waitForTimeout(200); await snap(label); if (noclip) return; const cl = await p.evaluate(FZM.clipScript); cl.forEach(s => bad.push(label + ': ' + s));
    const off = await p.evaluate(() => { const o = [], W = innerWidth, H = innerHeight; document.querySelectorAll('#lr button, #lr .lr-slot, #lr-cv').forEach(e => { if (!e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1)) o.push((e.id || e.className || e.tagName) + ' 화면 밖 ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
      const bar = document.getElementById('lr-bar'); if (bar && bar.scrollWidth > bar.clientWidth + 1) o.push('위 줄이 넘친다 ' + bar.scrollWidth + '>' + bar.clientWidth); return o; }); off.forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(100); };
  const tapCell = async c => { const pt = await p.evaluate(c => __lair.pt(c), c); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(100); };
  const ev = (f, a) => p.evaluate(f, a);
  const closeSheet = async () => { if (await p.$('#lr-sheet:not([hidden]) [data-l="close"]')) await tap('#lr-sheet [data-l="close"]'); };
  await shot('title', true);
  if (!(await p.$('[data-a="start"]'))) throw new Error('제목에 「시작」이 없다');
  await ev(() => { window.__lairCoach = 1; if (window.__lf) window.__lf.auto = true; });
  await tap('[data-a="start"]'); await ev(() => __lair.fresh(7)); await p.waitForTimeout(300); await shot('prep');
  if (!(await ev(() => !document.getElementById('lr-coach').hidden))) bad.push('첫 판인데 길잡이가 없다');
  if ((await ev(() => __lair.R.rounds)) !== 15 || (await ev(() => __lair.R.mode)) !== 'full') bad.push('온전한 판이 아니다');
  const sc = await ev(() => __lair.U.scale); if (dev && sc * 64 < 50) bad.push('폰에서 칸이 너무 작다 ' + Math.round(sc * 64));
  // 위 줄: 진액, 레벨, 목숨, 공포와 깨어남, 메뉴 / 열다섯 칸 (우두머리 셋, 신화 단계 셋, 지금 하나)
  { const d = await ev(() => { const q = s => document.querySelectorAll(s).length; return { gold: q('#lr-bar .lr-gold'), lv: q('#lr-bar .lr-lv'), hp: q('#lr-bar .lr-hp'), fear: q('#lr-bar .lr-fear .lr-pips i'), menu: q('#lr-bar .lr-menu'), tc: q('#lr-bar .lr-tc'), boss: q('#lr-bar .lr-tc.boss'), my: q('#lr-bar .lr-tc.my'), cur: q('#lr-bar .lr-tc.cur'), h: document.getElementById('lr-bar').offsetHeight }; });
    if (d.gold !== 1 || d.lv !== 1 || d.hp !== 1 || d.fear !== 3 || d.menu !== 1) bad.push('위 줄에 빠진 것이 있다 ' + JSON.stringify(d)); if (d.tc !== 15 || d.boss !== 3 || d.my !== 3 || d.cur !== 1) bad.push('라운드 줄이 맞지 않는다 ' + JSON.stringify(d)); if (d.h > 96) bad.push('위 줄이 두 줄을 넘는다 ' + d.h); }
  // 상점 카드마다 역할 표지와 닿는 칸 글이 있다. 적 미리보기에도 표지가 있다
  { const c = await ev(() => Array.from(document.querySelectorAll('#lr-shop .lr-card:not(.empty)')).map(e => ({ role: !!e.querySelector('.lr-role[data-role]'), reach: (e.querySelector('.lr-reach') || {}).textContent || '', cost: /\bc[1-5]\b/.test(e.className) }))); if (!c.length || c.some(q => !q.role || !q.cost || !/^(근접|원거리) \d칸$/.test(q.reach))) bad.push('상점 카드에 역할이나 닿는 칸, 값 테가 없다 ' + JSON.stringify(c));
    const d = await ev(() => ({ b: __lair.dbg().badges, e: __lair.L.curEnemy(__lair.R).length })); if (d.b !== d.e || !d.e) bad.push('적 미리보기의 역할 표지 ' + d.b + '/' + d.e); }
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
  { const d = await ev(() => { const R = __lair.R, u = R.unit[R.board[21]], i = __lair.L.unitInfo(u.kind, u.star), g = __lair.dbg(); return { range: g.range, want: Array.from({ length: 36 }, (_, c) => c).filter(c => c !== 21 && __lair.L.cheb(21, c) <= i.range), badges: g.badges, units: Object.keys(R.board).length + __lair.L.curEnemy(R).length, top: !!document.querySelector('#lr-top .lr-selinfo .lr-role') }; });
    if (!d.range.length || d.range.join() !== d.want.join()) bad.push('고른 권속의 닿는 칸이 맞지 않는다 ' + JSON.stringify(d)); if (d.badges !== d.units) bad.push('판 위 역할 표지 ' + d.badges + '/' + d.units); if (!d.top) bad.push('고른 권속의 이름 줄에 역할이 없다'); }
  await shot('unit_sel');
  await tap('#lr-top .lr-selinfo'); await p.waitForTimeout(700); await shot('sheet_unit'); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('권속 창에 스킬이 없다'); if (!(await p.$('#lr-sheet .lr-rolename'))) bad.push('권속 창에 역할이 없다'); await closeSheet();
  await tapCell(21);
  // 적을 누르면 바로 창 (의지가 보인다)
  { const c = await ev(() => __lair.L.curEnemy(__lair.R)[0].cell); await tapCell(c); await p.waitForTimeout(300); await shot('sheet_enemy'); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('적을 눌렀는데 창이 없다'); else { if (!(await p.$('#lr-sheet .lr-rolename'))) bad.push('적 창에 역할이 없다'); if (!/의지/.test(await ev(() => document.querySelector('#lr-sheet .lr-stats').textContent))) bad.push('적 창에 의지가 없다'); } await closeSheet(); }
  // 본체: 깨어남과 공포
  { await tapCell(32); await p.waitForTimeout(300); await shot('sheet_core'); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('본체를 눌렀는데 창이 없다'); if (!(await p.$('#lr-sheet .lr-fearbar'))) bad.push('본체 창에 공포 눈금이 없다'); if ((await p.$$('#lr-sheet .lr-tiers p')).length !== 3) bad.push('본체 창에 공포의 세 문턱이 없다'); await closeSheet();
    await tap('#lr-bar .lr-fear'); await p.waitForTimeout(200); if (!(await p.$('#lr-sheet .lr-fearbar'))) bad.push('공포 단추가 본체 창을 열지 않는다'); await closeSheet(); }
  // 합치기: 같은 것 셋을 산다
  await ev(() => { const R = __lair.R; R.gold = 30; R.shop = ['gazer', 'gazer', 'gazer', 'hood', 'heap']; __lair.redraw(); });
  for (let i = 0; i < 3; i++) { await tap(`#lr-shop .lr-card[data-i="${i}"]`); await tap('#lr-top [data-l="buy"]'); if (i === 2) await snap('merge'); }
  if (!(await ev(() => Object.values(__lair.R.unit).some(u => u.kind === 'gazer' && u.star === 2)))) bad.push('셋을 샀는데 별이 오르지 않았다');
  await p.waitForTimeout(1700);
  await tap('#lr-bench .lr-slot.has'); await tapCell(27);
  await tap('#lr-shop .lr-card[data-i="3"]'); await tap('#lr-top [data-l="buy"]'); await tap('#lr-bench .lr-slot.has'); await tapCell(28); await p.waitForTimeout(80); { const d = await ev(() => ({ b: __lair.dbg().badges, n: Object.keys(__lair.R.board).length + __lair.L.curEnemy(__lair.R).length })); if (d.b !== d.n) bad.push('판 위 역할 표지 ' + d.b + '/' + d.n); } await shot('board');
  // 시너지
  if (await p.$('#lr-top [data-l="syn"]')) { await tap('#lr-top [data-l="syn"]'); await p.waitForTimeout(250); await shot('sheet_syn'); if (!(await p.$('#lr-sheet .lr-tiers'))) bad.push('시너지 창에 단계가 없다'); await closeSheet(); } else bad.push('권속을 넷 세웠는데 시너지 칩이 없다');
  // 진액 창: 이기면/지면, 레벨별 상점 확률
  { await tap('#lr-bar .lr-gold'); await p.waitForTimeout(250); await shot('sheet_econ'); const d = await ev(() => ({ tb: document.querySelectorAll('#lr-sheet .lr-tb').length, on: (document.querySelector('#lr-sheet .lr-tb.odds tr.on th') || {}).textContent, lv: String(__lair.R.level), win: (document.querySelector('#lr-sheet .lr-tb tr.w td b') || {}).textContent, want: '+' + __lair.view().econ.ifWin.total })); if (d.tb !== 2 || d.on !== d.lv || d.win !== d.want) bad.push('진액 창이 맞지 않는다 ' + JSON.stringify(d)); await closeSheet(); }
  // 판 창: 세 막, 조사자 셋 → 조사자 창
  { await tap('#lr-bar .lr-trackb'); await p.waitForTimeout(250); await shot('sheet_run'); if ((await p.$$('#lr-sheet .lr-acts2 > div')).length !== 3) bad.push('판 창에 세 막이 없다'); if ((await p.$$('#lr-sheet [data-l="cast"]')).length !== 3) bad.push('판 창에 조사자 셋이 없다');
    else { await tap('#lr-sheet [data-l="cast"]'); await p.waitForTimeout(600); await shot('sheet_cast'); const d = await ev(() => ({ nar: (document.querySelector('#lr-sheet .lr-nar') || {}).textContent || '', st: (document.querySelector('#lr-sheet .lr-stats') || {}).textContent || '', sk: !!document.querySelector('#lr-sheet .lr-skill') })); if (d.nar.length < 8 || !/의지/.test(d.st) || !d.sk) bad.push('조사자 창이 비었다 ' + JSON.stringify(d)); } await closeSheet(); }
  // 판 안의 메뉴: 소리, 음악, 흔들림, 빠르기, 나가기
  { await tap('#lr-bar .lr-menu'); await p.waitForTimeout(250); await shot('sheet_menu'); const s0 = await ev(() => __shell.meta.sound); await tap('#lr-sheet [data-l="tog"][data-v="sound"]'); if ((await ev(() => __shell.meta.sound)) === s0) bad.push('메뉴에서 효과음이 바뀌지 않는다'); await tap('#lr-sheet [data-l="tog"][data-v="sound"]');
    await tap('#lr-sheet [data-l="speed"][data-v="2"]'); if ((await ev(() => __lair.U.speed)) !== 2) bad.push('메뉴에서 빠르기가 바뀌지 않는다'); await tap('#lr-sheet [data-l="speed"][data-v="1"]'); if (!(await p.$('#lr-sheet [data-l="exit"]'))) bad.push('메뉴에 나가기가 없다'); await closeSheet(); }
  // 방: 첫 라운드에는 없다. 보상으로 얻은 방을 들고 있다가 놓는다
  if (await p.$('#lr-bench [data-l="room"]:not([disabled])')) bad.push('방이 없는데 방 단추가 켜져 있다');
  await ev(() => { const R = __lair.R; R.roomOffer.push('pool', 'bone'); __lair.redraw(); });
  await tap('#lr-bench [data-l="room"]'); await p.waitForTimeout(250); await shot('sheet_rooms'); if ((await p.$$('#lr-sheet [data-l="pickroom"]')).length !== 2) bad.push('든 방이 둘이 아니다');
  await tap('#lr-sheet [data-l="pickroom"][data-i="0"]'); await shot('room_spots');
  { const spot = await ev(() => __lair.view().roomOffer[__lair.U.roomPick].spots[0]); await tapCell(spot); if ((await ev(() => __lair.R.rooms.length)) !== 1 || (await ev(() => __lair.R.roomOffer.length)) !== 1) bad.push('방을 깔지 못했다'); await shot('room_placed'); }
  // 싸움
  const seenAll = {}, tot = { checks: 0, big: 0, boons: 0, fights: 0 };
  // mode: 'fast' = 빨리 감는다, 'pace' = 「보통」 빠르기로 얼마간 재고 나서 감는다
  const fight = async (label, mode, want) => {
    const boss = await ev(() => !!__lair.view().boss);
    await tap('#lr-top [data-l="fight"]'); await p.waitForTimeout(500); if (mode !== 'quick') await shot(label + '_intro', true);
    { const d = await ev(() => ({ T: __lair.F.T, intro: __lair.F.intro, sp: __lair.U.speed, boss: !!document.querySelector('.lr-intro.boss'), on: Array.from(document.querySelectorAll('#lr-fight [data-l="speed"]')).map(b => b.textContent + (b.classList.contains('on') ? '*' : '')).join(' ') })); if (d.T !== 0 || d.intro <= 0) bad.push(label + ': 시작하자마자 움직인다 ' + JSON.stringify(d)); if (label === 'f1' && (d.sp !== 1 || d.on !== '느리게 보통* 빠르게')) bad.push('처음 빠르기가 보통이 아니다 ' + JSON.stringify(d)); if (boss !== d.boss) bad.push(label + ': 우두머리 알림이 맞지 않는다 ' + boss + '/' + d.boss); if (boss && !seenAll.bossintro) { seenAll.bossintro = 1; await snap(label + '_bossintro'); } }
    if (mode === 'pace') {
      await tap('#lr-fight [data-l="speed"][data-v="1"]'); if ((await ev(() => __lair.U.speed)) !== 1) bad.push('보통이 안 눌린다');
      await p.waitForFunction(() => __lair.F && __lair.F.intro <= 0 && __lair.F.T > 0.2, null, { timeout: 8000 }); const a = await ev(() => ({ T: __lair.F.T, t: performance.now() })); await p.waitForTimeout(8000); const z = await ev(() => ({ T: __lair.F.T, t: performance.now(), done: __lair.F.done })); const rate = (z.T - a.T) / ((z.t - a.t) / 1000);
      if (!z.done && !(rate >= 0.55 && rate <= 1.08)) bad.push('「보통」 빠르기가 맞지 않는다: 1초에 ' + rate.toFixed(2)); tot.rate = +rate.toFixed(2); await shot(label + '_mid');
      // 싸우는 중에 적을 누르면 창이 뜨고 싸움이 멎는다
      const c = await ev(() => { const F = __lair.F, e = Object.values(F.ents).find(q => q.side === 'inv' && !q.dead && !q.summon), r = document.getElementById('lr-cv').getBoundingClientRect(); return e ? { x: r.left + e.x * __lair.U.scale, y: r.top + (e.y - 8) * __lair.U.scale } : null; });
      if (c) { await p.mouse.click(c.x, c.y); await p.waitForTimeout(250); if (!(await p.$('#lr-sheet .lr-skill'))) bad.push('싸우는 중에 적을 눌렀는데 창이 없다'); else { const t1 = await ev(() => __lair.F.T); await p.waitForTimeout(300); if ((await ev(() => __lair.F.T)) !== t1) bad.push('창이 떠 있는데 싸움이 흐른다'); await shot(label + '_tapinfo'); await closeSheet(); } }
      // 싸우는 중에도 메뉴가 열린다
      await tap('#lr-bar .lr-menu'); await p.waitForTimeout(150); if (!(await p.$('#lr-sheet [data-l="tog"]'))) bad.push('싸우는 중에 메뉴가 열리지 않는다'); await closeSheet();
    }
    if (mode === 'fast') { await tap('#lr-fight [data-l="speed"][data-v="2"]'); if ((await ev(() => __lair.U.speed)) !== 2) bad.push('빠르게가 안 눌린다'); }
    await ev(s => { __lair.U.speed = s; }, mode === 'quick' ? 14 : 6);
    const seen = {}; let last = -1, stuck = 0, fin = null;
    for (let k = 0; k < 900; k++) {
      const st = await ev(() => { const s = __lair.stats(), F = __lair.F; if (!s) return null; const E = F.ents; s.cast = Object.values(E).some(e => e.anim === 'cast' && !e.core); s.core = E.core && E.core.anim === 'cast'; s.fx = F.fx.length; s.sheet = !document.getElementById('lr-sheet').hidden; s.badges = __lair.dbg().badges; s.drawn = __lair.dbg().dice; return s; });
      if (!st) break; fin = st;
      if (!st.sheet && !st.done && st.badges !== st.alive) bad.push(label + ': 역할 표지 ' + st.badges + '/' + st.alive + ' T=' + st.T.toFixed(1));
      if (st.drawn > 0) { seen.dice = 1; if (!seenAll.dice) { seenAll.dice = 1; await snap(label + '_dice'); } }
      if (st.bigChecks && st.drawn > 0 && !seenAll.bigdice) { seenAll.bigdice = 1; await snap(label + '_bigdice'); }
      if (st.boons && !seenAll.boon) { seenAll.boon = 1; await snap(label + '_boon'); }
      for (const key of ['cast', 'core']) if (st[key] && !seen[key] && st.fx >= 1) { seen[key] = 1; if (mode !== 'quick') await snap(label + '_' + key); }
      if (st.mads && !seen.mad) { seen.mad = 1; if (!seenAll.mad) { seenAll.mad = 1; await snap(label + '_mad'); } }
      if (st.T > 6 && !seen.mid) { seen.mid = 1; if (mode === 'fast') await shot(label + '_mid'); }
      if (st.sheet) { if (st.i !== st.n) bad.push(label + ': 사건을 다 보여 주지 않았다 ' + st.i + '/' + st.n); if (st.late) bad.push(label + ': 늦은 타격이 남았다 ' + st.late); break; }
      if (st.i === last) { if (++stuck > 160) { bad.push(label + ': 싸움이 멈췄다 ' + JSON.stringify(st)); break; } } else { stuck = 0; last = st.i; }
      await p.waitForTimeout(mode === 'quick' ? 40 : 60);
    }
    (want || []).forEach(w => { if (!seen[w]) bad.push(label + ': ' + w + ' 장면을 못 봤다'); });
    if (fin) { tot.checks += fin.checks; tot.big += fin.bigChecks; tot.boons += fin.boons; tot.fights++; const want = await ev(() => __lair.U.res.fight.checks); if (fin.checks !== want) bad.push(label + ': 공포 판정을 다 보여 주지 않았다 ' + fin.checks + '/' + want); }
    await p.waitForTimeout(mode === 'quick' ? 250 : 800);
    const r = await ev(() => { const q = s => document.querySelector('#lr-sheet ' + s), res = __lair.U.res; return { row: !!q('.lr-row'), eco: (q('.lr-eco2') || {}).textContent || '', sum: (q('.lr-sum') || {}).textContent || '', income: res.income, over: __lair.R.phase === 'over', castRows: document.querySelectorAll('#lr-sheet .lr-castrow').length, cast: (res.cast || []).length, world: (q('.lr-world') || {}).textContent || '', boss: res.boss, win: res.win, next: (q('[data-l="next"]') || {}).textContent || '', nx: res.next }; });
    if (mode !== 'quick' || (r.castRows && !seenAll.castres) || (r.boss && !seenAll.bossres) || r.over) { if (r.castRows) seenAll.castres = 1; if (r.boss) seenAll.bossres = 1; await shot(label + '_result'); }
    if (!r.over) { if (!r.row) bad.push(label + ': 결과에 기여 줄이 없다'); if (!/기본 \d/.test(r.eco) || r.sum.indexOf('진액 +' + r.income) < 0) bad.push(label + ': 결과에 진액 내역이 없다 ' + JSON.stringify(r)); if (r.castRows !== r.cast) bad.push(label + ': 조사자의 끝이 ' + r.castRows + '/' + r.cast); if (r.boss && !r.win && !/다시 온다/.test(r.world)) bad.push(label + ': 우두머리에게 졌는데 다시 온다는 말이 없다');
      const wantNext = { mythos: '신화 단계', choice: '보상', encounter: '조우' }[r.nx]; if (wantNext && r.next !== wantNext) bad.push(label + ': 다음 단추가 ' + r.next + ' (' + r.nx + ')'); }
    return r;
  };
  const next = async () => { await tap('#lr-sheet [data-l="next"]'); await p.waitForTimeout(150); const d = await ev(() => ({ ph: __lair.R.phase, flow: __lair.U.flow, up: __lair.U.phase })); if (d.ph !== 'prep' || d.flow || d.up !== 'prep') bad.push('결과 뒤에 준비로 돌아오지 않았다 ' + JSON.stringify(d)); };
  const r1 = await fight('f1', 'fast', ['cast', 'mid', 'dice']);
  if (r1.win && r1.nx !== 'choice') bad.push('이긴 첫 싸움 뒤에 고를 것이 없다 ' + r1.nx);
  await next();
  // 둘째 라운드의 준비 앞에 신화 단계가 지나갔다: 본체가 한 단계 깨어났다
  { const d = await ev(() => ({ round: __lair.R.round, awake: __lair.R.awake, picked: __lair.R.mythos.picked.length, form: __lair.R.form, myd: document.querySelectorAll('#lr-bar .lr-tc.myd').length, pips: document.querySelectorAll('#lr-bar .lr-pips i.on').length, picks: __lair.R.picks.map(q => q.kind).join() })); if (d.round !== 2) bad.push('둘째 라운드로 넘어가지 않았다'); if (d.awake !== 1 || d.picked !== 1 || d.myd !== 1 || d.pips !== 1 || d.form === 'drop') bad.push('신화 단계 뒤에 본체가 깨어나지 않았다 ' + JSON.stringify(d)); }
  await shot('prep2');
  { await tapCell(32); await p.waitForTimeout(300); await shot('sheet_core2'); if ((await p.$$('#lr-sheet .lr-mc')).length !== 1) bad.push('본체 창에 고른 신화가 없다'); await closeSheet(); }
  // 나갔다가 이어하기: 같은 판이 그대로 열린다
  { const a = await ev(() => JSON.stringify([__lair.R.round, __lair.R.gold, Object.keys(__lair.R.unit).length, __lair.R.rooms.length, __lair.R.mythos.picked]));
    await tap('#lr-bar .lr-menu'); await tap('#lr-sheet [data-l="exit"]'); await p.waitForTimeout(300); if (await ev(() => !document.getElementById('lr').hidden)) bad.push('메뉴의 나가기가 안 된다');
    if (!(await p.$('[data-a="cont"]'))) bad.push('나갔는데 제목에 이어하기가 없다'); else { await shot('title_cont', true); await tap('[data-a="cont"]'); await p.waitForTimeout(400); const z = await ev(() => JSON.stringify([__lair.R.round, __lair.R.gold, Object.keys(__lair.R.unit).length, __lair.R.rooms.length, __lair.R.mythos.picked])); if (a !== z) bad.push('이어한 판이 다르다 ' + a + ' / ' + z); if (typeof (await ev(() => localStorage.getItem('oldnest.lairrun'))) !== 'string') bad.push('저장이 없다'); await shot('continued'); } }
  // 힘센 둥지로 바꾼다 (화면은 그대로 따라온다): 끝까지 가 보기 위해서
  const power = () => ev(() => { const L = __lair.L, R = __lair.R, g = __lair.give; R.level = 8; R.hp = R.hpMax; if (!R.__pow) { R.__pow = 1; Object.keys(R.board).forEach(c => { delete R.unit[R.board[c]]; delete R.board[c]; }); [['maw', 20], ['bell', 21], ['shell', 19], ['hollow', 22], ['rift', 27], ['ink', 26], ['queen', 28], ['orbit', 25]].forEach(q => g(q[0], 3, q[1])); }
    while (R.roomOffer.length) { const o = L.view(R).roomOffer[0]; if (!o.spots.length) break; L.placeRoom(R, 0, o.spots[o.spots.length - 1]); } __lair.redraw(); });
  await power(); await p.waitForTimeout(600); await shot('prep2_full');
  { const d = await ev(() => ({ b: __lair.dbg().badges, n: Object.keys(__lair.R.board).length + __lair.L.curEnemy(__lair.R).length })); if (d.b !== d.n) bad.push('가득 찬 판의 역할 표지 ' + d.b + '/' + d.n); }
  await fight('f2', 'pace', ['cast']); await next();
  // 셋째 라운드: 정예를 부른다
  { if ((await ev(() => __lair.R.round)) !== 3) bad.push('셋째 라운드가 아니다'); await power(); if (!(await p.$('#lr-top [data-l="elite"]'))) bad.push('셋째 라운드에 정예 단추가 없다'); else { const n0 = await ev(() => __lair.L.curEnemy(__lair.R).length); await tap('#lr-top [data-l="elite"]'); await p.waitForTimeout(250); await shot('sheet_elite'); if (!/이기면/.test(await ev(() => document.querySelector('#lr-sheet .lr-skill').textContent))) bad.push('정예 창에 보상이 없다'); await tap('#lr-sheet [data-l="eliteset"]'); await p.waitForTimeout(200); const d = await ev(() => ({ on: __lair.R.elite, n: __lair.L.curEnemy(__lair.R).length, chip: !!document.querySelector('#lr-top .lr-elite.on'), b: __lair.dbg().badges, u: Object.keys(__lair.R.board).length })); if (!d.on || d.n <= n0 || !d.chip) bad.push('정예가 켜지지 않았다 ' + JSON.stringify(d) + ' ' + n0); await p.waitForTimeout(150); const g = await ev(() => ({ b: __lair.dbg().badges, n: Object.keys(__lair.R.board).length + __lair.L.curEnemy(__lair.R).length })); if (g.b !== g.n) bad.push('정예 무리의 역할 표지 ' + g.b + '/' + g.n); await shot('elite_on'); } }
  // 끝까지: 라운드마다 싸우고 넘어간다. 조사자가 오면 이름표와 초상이 보인다
  let end = null;
  for (let k = 0; k < 22 && !end; k++) {
    await power(); const d = await ev(() => { const v = __lair.view(); return { round: v.round, boss: v.boss, here: v.cast.filter(c => c.here).length, tags: document.querySelectorAll('#lr-ov .lr-tag').length, chips: document.querySelectorAll('#lr-bar .lr-castb').length, zeal: v.zealots, zchip: document.querySelectorAll('#lr-bar .lr-note2.z').length }; });
    if (d.here !== d.tags || d.here !== d.chips) bad.push(d.round + '라운드: 조사자 표시가 맞지 않는다 ' + JSON.stringify(d)); if (!!d.zeal !== !!d.zchip) bad.push(d.round + '라운드: 광신도 표시가 맞지 않는다 ' + JSON.stringify(d));
    if (d.here && !seenAll.castprep) { seenAll.castprep = 1; await p.waitForTimeout(300); await shot('prep_cast'); await tap('#lr-bar .lr-castb'); await p.waitForTimeout(500); if (!(await p.$('#lr-sheet .lr-nar'))) bad.push('조사자 초상을 눌렀는데 창이 없다'); await shot('sheet_cast_here'); await closeSheet(); }
    if ((d.round === 6 || d.round === 11) && !seenAll['p' + d.round]) { seenAll['p' + d.round] = 1; await shot('prep' + d.round); }
    const r = await fight('r' + d.round + (k ? '' : 'e'), 'quick'); if (r.over) { end = r; break; } await next();
  }
  // 판 끝 화면
  { const d = await ev(() => { const R = __lair.R, q = s => document.querySelector('#lr-sheet ' + s); return { over: R.over, end: !!q('.lr-end'), again: !!q('[data-l="again"]'), exit: !!q('[data-l="exit"]'), my: document.querySelectorAll('#lr-sheet .lr-sum .t1, #lr-sheet .lr-sum .t2, #lr-sheet .lr-sum .t3').length, picked: R.mythos.picked.length, tc: document.querySelectorAll('#lr-sheet .lr-track.end .lr-tc').length, best: document.querySelectorAll('#lr-sheet .lr-ki').length, saved: localStorage.getItem('oldnest.lairrun'), last: (__shell.meta.last || []).slice(-1)[0] }; });
    if (!end || !d.over) bad.push('판이 끝나지 않았다'); else { if (d.over.round !== 15 || !d.over.win) bad.push('열다섯째 라운드를 이기지 못했다 ' + JSON.stringify(d.over)); if (!d.end || !d.again || !d.exit) bad.push('판 끝 화면에 빠진 것이 있다 ' + JSON.stringify(d)); if (d.picked !== 3 || d.my !== 3) bad.push('판 끝 화면에 고른 신화 셋이 없다 ' + d.my + '/' + d.picked); if (d.tc !== 15) bad.push('판 끝 화면의 라운드 줄 ' + d.tc); if (!d.best) bad.push('판 끝 화면에 가장 많이 한 권속이 없다'); if (d.saved) bad.push('끝난 판의 저장이 남았다'); if (!d.last || d.last.rounds !== 15 || d.last.step !== 3 || !Array.isArray(d.last.mythos)) bad.push('지난 판 기록이 맞지 않는다 ' + JSON.stringify(d.last)); } }
  if (!seenAll.dice) bad.push('공포 판정의 주사위를 한 번도 못 봤다'); if (!tot.checks) bad.push('공포 판정이 없었다'); if (!seenAll.bossintro) bad.push('우두머리 알림을 못 봤다'); if (!seenAll.castres) bad.push('결과에서 조사자의 끝을 못 봤다');
  if (await p.$('#lr-sheet [data-l="again"]')) { await tap('#lr-sheet [data-l="again"]'); await p.waitForTimeout(200); if ((await ev(() => __lair.R.round)) !== 1 || (await ev(() => __lair.U.phase)) !== 'prep') bad.push('다시 한 판이 처음으로 돌아가지 않았다'); await shot('again');
    // 팔기: 사서 고르고 판다 · 대기석에서 상점으로 끌어도 팔린다
    { await tap('#lr-shop .lr-card[data-i="0"]'); await tap('#lr-top [data-l="buy"]'); const g0 = await ev(() => __lair.R.gold); await tap('#lr-bench .lr-slot.has'); await tap('#lr-top [data-l="sell"]'); if ((await ev(() => Object.keys(__lair.R.unit).length)) !== 0 || (await ev(() => __lair.R.gold)) <= g0) bad.push('팔기가 안 된다');
      await tap('#lr-shop .lr-card[data-i="1"]'); await tap('#lr-top [data-l="buy"]'); const s = await p.$('#lr-bench .lr-slot.has'), r = await s.boundingBox(), sh = await (await p.$('#lr-shop .lr-card[data-i="3"]')).boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.mouse.move(r.x + r.width / 2 + 20, r.y + 30, { steps: 4 }); await p.mouse.move(sh.x + sh.width / 2, sh.y + sh.height / 2, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(120); if ((await ev(() => Object.keys(__lair.R.unit).length)) !== 0) bad.push('상점으로 끌어서 팔지 못했다'); await shot('sold'); }
    await tap('#lr-bar .lr-menu'); await tap('#lr-sheet [data-l="exit"]'); if (await ev(() => !document.getElementById('lr').hidden)) bad.push('나가기가 안 된다'); }
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, tot, seen: Object.keys(seenAll), end: end && { over: end.over }, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1);
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
