// 굴 짓기 규칙 검사.  node tests/mazerules.js
const MZ = require('../src/maze.js'), L = require('../src/lair.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const C = (r, c) => MZ.idx(r, c), clone = o => JSON.parse(JSON.stringify(o));
const TYPES = ['move', 'attack', 'hit', 'cast', 'skillfx', 'status', 'mad', 'cleanse', 'die', 'spawn', 'roomfx', 'synergy', 'heal', 'sanity', 'frenzy', 'sudden', 'win', 'boon', 'check'];
// 권속을 곧바로 사서 세운다 (검사용)
function give(M, kind, star, cell) { const uid = M.nextUid++; M.unit[uid] = { uid, kind, star: star || 1 }; if (cell != null) M.board[cell] = (M.board[cell] || []).concat([uid]); else M.bench[M.bench.indexOf(null)] = uid; return uid; }
function checkFight(f, tag) {
  const ids = new Set(f.units.map(u => u.id)); let last = -1, wins = 0;
  f.timeline.forEach((e, i) => { ok(TYPES.includes(e.type), tag + ': 모르는 사건 ' + e.type); ok(e.t >= last - 1e-9, tag + ': 시간이 거꾸로'); last = e.t; if (e.type === 'spawn') ids.add(e.u); ['u', 'by', 'tg'].forEach(k => { if (e[k] != null && e.type !== 'spawn') ok(ids.has(e[k]), tag + ': 없는 유닛 ' + e.type + '.' + k + '=' + e[k]); }); if (e.type === 'win') { wins++; ok(i === f.timeline.length - 1, tag + ': 끝 사건이 마지막이 아니다'); } });
  ok(wins === 1 && f.time <= MZ.MK.clock.end + 0.01 && ['win', 'loss'].includes(f.result), tag + ': 싸움의 모양');
  ok(f.units.every(u => u.hp != null && u.hp > 0 && u.hp <= u.mhp), tag + ': 시작 체력이 없다');
}

// 1. 새 판의 모양
{
  const M = MZ.newRun(7), v = MZ.view(M);
  ok(v.cols === 5 && v.rows === 8 && v.grid.length === 40 && v.coreCell === 'core' && v.eggCell === 'egg' && MZ.CORE === 'core' && MZ.EGG === 'egg' && MZ.EXIT === C(7, 2) && v.entrance.cell === C(0, 2) && v.entrance.r === -1 && v.exit.cell === C(7, 2), '지도: 본체 방과 알의 방은 격자 밖');
  ok([0, 1, 2, 3, 4, 5, 6, 7].every(r => v.grid[C(r, 2)].dug && v.grid[C(r, 2)].use === 'path') && v.grid.filter(g => g.dug).length === 8 && v.grid.every(g => g.use !== 'core' && g.use !== 'egg') && v.grid[C(0, 2)].fixed && v.grid[C(7, 2)].fixed && v.grid.filter(g => g.fixed).length === 2, '처음에는 입구에서 출구까지 곧은 굴');
  ok(v.core && Array.isArray(v.core.units) && !v.core.units.length && v.core.max === 2 && v.core.form === 'drop' && v.core.step === 0, '본체 방의 보기');
  ok(v.raid === 1 && v.raids === 4 && v.egg.hp === MZ.MK.egg && v.gold === MZ.MK.gold && v.cap === MZ.MK.level && v.shop.length === 5 && v.bench.length === 6 && v.next.name === MZ.RAIDS[0].name && v.next.party.length === 4 && v.next.path.join() === [2, 7, 12, 17, 22, 27, 32, 37].join(), '새 판의 보기');
  ok(v.grid.every(g => 'r' in g && 'c' in g && 'dug' in g && 'use' in g && 'room' in g && 'trap' in g && Array.isArray(g.units) && 'canDig' in g && 'digCost' in g && 'canFill' in g && 'fillGold' in g), '칸마다의 보기');
  ok(v.rooms.length === 8 && v.traps.length === 4 && v.traps.every(t => t.name && t.short && t.short.length <= 16 && t.more), '방과 함정 보기');
}
// 2. 파기와 메우기: 길은 늘 이어진다
{
  const M = MZ.newRun(8); M.gold = 99;
  ok(!MZ.fill(M, C(1, 2)).ok && !MZ.fill(M, C(7, 2)).ok && !MZ.fill(M, C(0, 2)).ok && !MZ.fill(M, 'core').ok, '곧은 굴의 칸과 입구·출구는 메울 수 없다');
  { const X = MZ.newRun(8); X.gold = 99; [C(5, 3), C(6, 3), C(7, 3)].forEach(c => MZ.dig(X, c)); ok(MZ.fill(X, C(6, 2)).ok && !MZ.fill(X, C(7, 2)).ok && MZ.canFill(X, C(7, 2)) === '메울 수 없는 칸이다', '돌아가는 길이 있어도 출구는 메울 수 없다'); }
  ok(MZ.dig(clone(M), C(7, 1)).ok && !MZ.dig(M, C(4, 0)).ok && !MZ.dig(M, C(1, 2)).ok && !MZ.dig(M, 'egg').ok, '맨 아래 줄도 판다, 떨어진 칸·판 칸·알의 방은 팔 수 없다');
  const g0 = M.gold, d = MZ.dig(M, C(1, 3)); ok(d.ok && M.gold === g0 - MZ.digCost(C(1, 3)) && MZ.view(M).grid[C(1, 3)].dug, '파기');
  ok(MZ.digCost(C(6, 0)) > MZ.digCost(C(0, 0)), '깊을수록 비싸다');
  MZ.dig(M, C(2, 3)); MZ.dig(M, C(3, 3)); ok(MZ.fill(M, C(2, 2)).ok && MZ.pathOf(M, 1).cells.includes(C(2, 3)), '돌아가는 길이 있으면 메울 수 있다'); ok(!MZ.fill(M, C(2, 3)).ok, '길을 끊는 메우기는 거부');
  ok(!MZ.fill(M, C(1, 3)).ok, '떨어지는 칸이 생기는 메우기는 거부');
  const Q = MZ.newRun(9); Q.gold = 999; let dug = 0; for (const c of [C(0, 1), C(0, 0), C(1, 0), C(2, 0), C(3, 0), C(4, 0), C(5, 0), C(6, 0), C(0, 3), C(0, 4), C(1, 4), C(2, 4), C(3, 4)]) if (MZ.dig(Q, c).ok) dug++; ok(MZ.dugCount(Q) === MZ.dugCap(Q) && !MZ.dig(Q, C(4, 4)).ok, '파는 칸의 상한 ' + MZ.dugCap(Q));
  for (let s = 1; s <= 30; s++) { const R = MZ.newRun(s), rng = (() => { let x = s; return () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })(); R.gold = 999; for (let k = 0; k < 40; k++) { const c = Math.floor(rng() * 40); if (rng() < 0.6) MZ.dig(R, c); else MZ.fill(R, c); } ok(MZ.connected(R, c => R.grid[c].dug) && MZ.pathOf(R, 1), '아무렇게 파고 메워도 길이 이어진다 ' + s); }
}
// 3. 쓰임: 권속 방 · 함정 · 통로
{
  const M = MZ.newRun(10); M.gold = 99;
  ok(MZ.setUse(M, C(2, 2), 'kin', 'bone').ok && M.grid[C(2, 2)].room === 'bone' && M.gold === 99 - MZ.MK.roomCost, '권속 방 + 방 종류'); ok(!MZ.setUse(M, C(2, 2), 'kin', 'nope').ok && !MZ.setUse(M, C(7, 2), 'kin').ok && !MZ.setUse(M, C(1, 1), 'kin').ok, '없는 방, 고정 칸, 안 판 칸');
  const u = give(M, 'shell', 1); ok(MZ.move(M, u, { cell: C(2, 2) }).ok && M.board[C(2, 2)].includes(u), '방에 세운다');
  const u1 = give(M, 'heap', 1), g1 = M.gold; ok(MZ.move(M, u1, { cell: C(1, 2) }).ok && M.grid[C(1, 2)].use === 'kin' && M.board[C(1, 2)].includes(u1) && M.gold === g1 && M.grid[C(1, 2)].room === null, '판 통로에 놓으면 값 없이 권속 방이 된다');
  ok(MZ.move(M, u1, { bench: null }).ok && M.grid[C(1, 2)].use === 'kin' && M.grid[C(2, 2)].room === 'bone', '권속이 다 떠나도 권속 방은 그대로');
  { const X = MZ.newRun(10); X.gold = 99; MZ.setUse(X, C(3, 2), 'trap', 'tr_teeth'); const w = give(X, 'shell'); const r1 = MZ.move(X, w, { cell: C(1, 1) }), r2 = MZ.move(X, w, { cell: C(3, 2) }), r3 = MZ.move(X, w, { cell: C(0, 2) }), r4 = MZ.move(X, w, { cell: C(7, 2) });
    ok(!r1.ok && r1.msg === '바위다. 먼저 판다' && !r2.ok && r2.msg === '함정 칸이다' && !r3.ok && !r4.ok && X.grid[C(1, 1)].use === null && X.grid[C(3, 2)].use === 'trap', '바위·함정·입구·출구에는 못 세운다');
    const vg = MZ.view(X).grid; ok(vg[C(1, 2)].canPlace && !vg[C(1, 1)].canPlace && vg[C(1, 1)].placeWhy === '바위다. 먼저 판다' && !vg[C(3, 2)].canPlace && !vg[C(7, 2)].canPlace, '보기: 세울 수 있는 칸'); }
  ok(MZ.setUse(M, C(2, 2), 'trap', 'tr_teeth').ok && !M.board[C(2, 2)] && M.bench.includes(u) && M.grid[C(2, 2)].trap === 'tr_teeth', '함정으로 바꾸면 권속은 대기석으로');
  ok(!MZ.setUse(M, C(3, 2), 'trap', 'nope').ok && MZ.setUse(M, C(3, 2), 'path').ok, '없는 함정');
  MZ.setUse(M, C(4, 2), 'kin'); for (let k = 0; k < 3; k++) { const x = give(M, 'biter'); MZ.move(M, x, { cell: C(4, 2) }); } ok(M.board[C(4, 2)].length === MZ.MK.roomMax, '방에는 셋까지');
  const y = give(M, 'gnaw'), full = MZ.move(M, y, { cell: C(4, 2) }); ok(!full.ok && full.msg === '방이 찼다', '찬 방에는 못 세운다');
  M.level = 3; ok(!MZ.move(M, y, { core: true }).ok, '세울 수 있는 수는 레벨만큼');
  const Q = MZ.newRun(11); const a = give(Q, 'shell'), b = give(Q, 'heap'), c = give(Q, 'maw'); Q.level = 6; ok(MZ.move(Q, a, { core: true }).ok && MZ.move(Q, b, { cell: 'core' }).ok && MZ.move(Q, c, { core: true }).msg === '방이 찼다' && Q.board.core.length === 2 && MZ.whereOf(Q, a).core && MZ.view(Q).core.units.length === 2, '본체 방에는 둘까지');
  ok(MZ.move(Q, a, { bench: null }).ok && Q.bench.includes(a), '대기석으로');
}
// 4. 사기 · 팔기 · 셋이면 별 오름
{
  const M = MZ.newRun(12); M.gold = 30; M.shop = ['biter', 'biter', 'biter', 'shell', 'gazer'];
  ok(MZ.buy(M, 0).ok && MZ.buy(M, 1).ok, '사기'); const m = MZ.buy(M, 2), us = Object.keys(M.unit).map(i => M.unit[i]); ok(m.ok && m.merged.length === 1 && us.length === 1 && us[0].star === 2, '같은 권속 셋이면 2성');
  MZ.setUse(M, C(2, 2), 'kin'); MZ.move(M, us[0].uid, { cell: C(2, 2) });
  for (let k = 0; k < 2; k++) { M.shop = ['biter', 'biter', 'biter', null, null]; M.gold = 9; MZ.buy(M, 0); MZ.buy(M, 1); MZ.buy(M, 2); }
  const u3 = Object.keys(M.unit).map(i => M.unit[i]); ok(u3.length === 1 && u3[0].star === 3 && M.board[C(2, 2)].includes(u3[0].uid), '2성 셋이면 3성, 판 위의 것이 남는다');
  const g = M.gold; ok(MZ.sell(M, u3[0].uid).ok && M.gold === g + 9 && !M.board[C(2, 2)], '팔기'); M.gold = 1; ok(!MZ.reroll(M).ok, '진액이 없으면 다시 못 뽑는다');
  M.gold = 30; const lv = M.level; MZ.buyXp(M); MZ.buyXp(M); ok(M.level === lv + 1, '레벨');
}
// 5. 길: 미리보기 = 실제, 도적이 함정을 피한다, 무거운 자가 바위를 부순다
{
  const M = MZ.newRun(13); M.gold = 99; [C(1, 3), C(2, 3), C(3, 3)].forEach(c => MZ.dig(M, c)); MZ.setUse(M, C(2, 2), 'trap', 'tr_teeth');
  const p1 = MZ.pathOf(M, 1), p2 = MZ.pathOf(M, 2); ok(p1.cells.includes(C(2, 2)) && !p1.avoided, '마을 사람들은 함정으로 간다'); ok(!p2.cells.includes(C(2, 2)) && p2.avoided && p2.len <= p1.len + MZ.MK.avoid, '도적이 함정을 돌아간다');
  const far = MZ.newRun(14); far.gold = 99; MZ.setUse(far, C(2, 2), 'trap', 'tr_teeth'); ok(MZ.pathOf(far, 2).cells.includes(C(2, 2)) && !MZ.pathOf(far, 2).avoided, '돌아갈 길이 없으면 함정을 밟는다');
  M.raid = 2; const pv = MZ.view(M).next.path, r = MZ.raid(M), walked = r.steps.filter(s => s.type === 'walk').reduce((a, s) => a.concat(s.cells), []);
  ok(r.ok && pv.join() === r.path.cells.join() && pv.slice(0, walked.length).join() === walked.join() && !r.steps.some(s => s.type === 'trap'), '미리보기의 길 = 실제 길 (도적)');
  // 바위 부수기: 길게 둘러 가면 3막의 무거운 자가 지름길을 낸다
  const B = MZ.newRun(15); B.gold = 99; B.raid = 4; const SN = [C(0, 3), C(0, 4), C(1, 4), C(2, 4), C(2, 3), C(2, 2), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(4, 1), C(4, 2), C(4, 3), C(4, 4), C(5, 4), C(6, 4), C(6, 3), C(6, 2)];
  B.grid.forEach((g, i) => { if (g.use === 'path' && i !== MZ.ENT && i !== MZ.EXIT) Object.assign(g, { dug: false, use: null }); }); SN.forEach(c => Object.assign(B.grid[c], { dug: true, use: 'path' })); ok(MZ.connected(B, c => B.grid[c].dug), '뱀 굴');
  const pb = MZ.pathOf(B, 4), pm = MZ.pathOf(B, 1); ok(pm.len > MZ.MK.breakAt && !pm.breaks.length && pb.breaks.length === 1 && pb.len <= pm.len - MZ.MK.breakMin && !B.grid[pb.breaks[0]].dug, '무거운 자가 바위를 부순다 ' + pm.len + '→' + pb.len);
  const vb = MZ.view(B).next; ok(vb.breaks.join() === pb.breaks.join() && vb.path.join() === pb.cells.join(), '미리보기에 부술 바위가 보인다');
  const rb = MZ.raid(B); ok(rb.steps.some(s => s.type === 'break' && s.cell === pb.breaks[0]) && B.grid[pb.breaks[0]].dug && MZ.pathOf(B, 1).len === pb.len, '부순 바위는 판 칸으로 남는다');
  const S = MZ.newRun(16); const rs = MZ.raid(S), wk = rs.steps.filter(s => s.type === 'walk').reduce((a, s) => a.concat(s.cells), []); ok(wk.join() === rs.path.cells.join() && rs.steps.some(s => s.type === 'egg'), '아무도 없으면 알까지 곧장');
}
// 6. 싸움: 체력·정신이 방 사이로 이어지고, 쓰러진 권속은 침입 뒤 돌아온다
{
  let carried = false, died = false, back = false, seenFight = 0;
  for (let s = 1; s <= 12; s++) {
    const M = MZ.newRun(100 + s); M.level = 6; [C(1, 2), C(3, 2)].forEach(c => MZ.setUse(M, c, 'kin')); give(M, 'gazer', 1, C(1, 2)); give(M, 'hood', 1, C(1, 2)); give(M, 'biter', 1, C(3, 2)); give(M, 'gnaw', 1, C(3, 2));
    const r = MZ.raid(M), fs = r.steps.filter(x => x.type === 'fight'); fs.forEach((x, i) => { seenFight++; checkFight(x.fight, 'maze#' + s + '.' + i); ok(x.fight.time > 0 && x.fight.time <= MZ.MK.clock.end + 0.01, '싸움 길이'); });
    if (fs.length >= 2) { const a = fs[0].after.inv, b = fs[1].before.inv; ok(a.every((p, i) => p.hp === b[i].hp && p.alive === b[i].alive && b[i].san <= p.san && (p.mad ? b[i].mad : true)), '앞 방의 결과가 다음 방의 시작 (걷는 동안 정신만 깎인다)'); const e = fs[1].fight.units.filter(u => /^e/.test(u.id)); if (a.some(p => p.alive && p.hp < p.mhp) && e.every(u => { const p = b.find(q => q.alive && q.kind === u.kind && q.hp === u.hp); return !!p; })) carried = true; }
    fs.forEach(x => { if (x.after.kin.some(k => !k.alive)) died = true; });
    if (died && !back && M.phase === 'prep') { const v = MZ.view(M); if (v.grid[C(1, 2)].units.length === 2 && v.grid[C(3, 2)].units.length === 2) { const r2 = MZ.raid(M), f2 = r2.steps.find(x => x.type === 'fight'); if (f2 && f2.before.kin.every(k => k.alive && k.hp == null)) back = true; } }
  }
  ok(seenFight >= 12, '싸움이 난다 ' + seenFight); ok(carried, '일행의 체력이 방 사이로 이어진다'); ok(died && back, '쓰러진 권속이 침입 뒤 돌아온다');
}
// 6-2. 굴 속의 어둠: 걸은 칸마다 정신이 깎인다
{
  const M = MZ.newRun(17), r = MZ.raid(M), w = r.steps.filter(s => s.type === 'walk'), cells = w.reduce((a, s) => a + s.cells.length, 0), eggStep = r.steps.find(s => s.type === 'egg');
  ok(w.every(s => typeof s.san === 'number' && Array.isArray(s.mad)) && Math.abs(w.reduce((a, s) => a + s.san, 0) - (cells * MZ.MK.darkSan + MZ.MK.darkGrow * cells * (cells - 1) / 2)) < 1e-6, '걷는 구간마다 깎인 정신이 실린다 (걸을수록 더 깎인다)');
  const Q = MZ.newRun(18); Q.gold = 99; Q.raid = 4; [C(0, 1), C(0, 0), C(1, 0), C(2, 0), C(3, 0), C(4, 0), C(5, 0), C(6, 0), C(6, 1)].forEach(c => MZ.dig(Q, c)); [C(1, 2), C(2, 2), C(3, 2), C(4, 2), C(5, 2)].forEach(c => MZ.fill(Q, c)); Q.grid.forEach(g => { if (g.use === 'path') g.use = 'path'; });
  const long = MZ.pathOf(Q, 1); ok(long.len > 8, '긴 굴 ' + long.len);
}
// 7. 함정: 체력 · 정신 (미침) · 느려짐 · 감염
{
  const T0 = MZ.newRun(19); T0.gold = 99; MZ.setUse(T0, C(1, 2), 'trap', 'tr_teeth'); const t0 = MZ.raid(T0).steps.find(s => s.type === 'trap');
  ok(t0 && t0.id === 'tr_teeth' && t0.after.every((p, i) => p.hp === Math.max(1, Math.round(t0.before[i].hp - p.mhp * MZ.TRAP.tr_teeth.hp)) && p.hp < p.mhp), '이빨 구덩이: 체력');
  const M = MZ.newRun(20); M.gold = 99; M.raid = 2; MZ.setUse(M, C(1, 2), 'trap', 'tr_whisper'); MZ.setUse(M, C(2, 2), 'trap', 'tr_whisper'); MZ.setUse(M, C(3, 2), 'trap', 'tr_whisper'); MZ.setUse(M, C(4, 2), 'trap', 'tr_slime'); MZ.setUse(M, C(5, 2), 'trap', 'tr_spore');
  give(M, 'shell', 2, C(6, 2));
  const r = MZ.raid(M), tr = r.steps.filter(s => s.type === 'trap'); ok(tr.map(s => s.id).join() === 'tr_whisper,tr_whisper,tr_whisper,tr_slime,tr_spore' && tr.every(s => s.fx && s.before && s.after), '함정 다섯을 밟는다');
  ok(tr[0].after.every((p, i) => p.san < tr[0].before[i].san) && tr[2].after.some(p => p.mad) && tr[2].after.some(p => !p.mad) && tr[2].after.every((p, i) => p.mad === (p.san <= 0)), '속삭이는 벽: 정신을 깎고, 바닥난 자는 미친다');
  { const S4 = MZ.newRun(22); S4.raid = 4; S4.gold = 99; [1, 2, 3, 4, 5].forEach(r => MZ.setUse(S4, C(r, 2), 'trap', 'tr_whisper')); const t4 = MZ.raid(S4).steps.filter(s => s.type === 'trap'); ok(t4.length && !t4[t4.length - 1].after.find(p => p.kind === 'seeker').mad, '책을 쫓는 자는 미치지 않는다'); }
  const W3 = MZ.newRun(21); W3.gold = 99; [1, 2, 3].forEach(r => MZ.setUse(W3, C(r, 2), 'trap', 'tr_whisper')); const r3 = MZ.raid(W3); ok(r3.result.mads === 4 && !r3.steps.some(s => s.type === 'egg') && r3.result.win, '모두 미치면 일행이 굴 속으로 흩어진다');
  const f = r.steps.find(s => s.type === 'fight'); ok(f && f.fight.timeline.some(e => e.type === 'mad' && e.t === 0) && f.fight.timeline.some(e => e.type === 'status' && e.st === 'slow' && e.t === 0) && f.fight.timeline.some(e => e.type === 'status' && e.st === 'infected' && e.t === 0), '미친 자는 다음 싸움에서 둥지 편, 늪은 둔하게, 포자는 감염');
  ok(f.fight.units.filter(u => u.mad).length === tr[2].after.filter(p => p.mad).length, '미친 채 시작하는 자가 보기에 실린다');
}
// 8. 알과 판의 끝
{
  const M = MZ.newRun(30), r = MZ.raid(M), egg = r.steps.find(s => s.type === 'egg'), dmg = MZ.RAIDS[0].units.reduce((a, k) => a + (L.INV[k].tier || 1) + (L.INV[k].boss ? 2 : 0), 0);
  ok(egg && egg.dmg === dmg && M.egg === MZ.MK.egg - dmg && !r.result.win && r.result.eggLost === dmg && r.result.survivors === 4 && r.next === 'prep' && M.raid === 2, '알에 닿은 침입자마다 알이 깎인다 (' + dmg + ')');
  ok(M.gold === MZ.MK.gold + MZ.MK.income && M.xp === MZ.MK.xpRaid, '침입 뒤 진액과 경험');
  M.egg = 1; const r2 = MZ.raid(M); ok(r2.next === 'over' && M.phase === 'over' && M.over && !M.over.win && !MZ.raid(M).ok, '알이 깨지면 진다');
  const W = MZ.newRun(31); W.level = 6; ['shell', 'maw', 'heap', 'famine', 'mother', 'tangle'].forEach((k, i) => { const c = [C(1, 2), C(3, 2)][i % 2]; MZ.setUse(W, c, 'kin'); give(W, k, 3, c); });
  let last = null; for (let k = 0; k < 4 && W.phase === 'prep'; k++) last = MZ.raid(W); ok(W.phase === 'over' && W.over.win && W.over.raid === 4 && last.next === 'over' && last.result.win, '넷을 막으면 이긴다');
}
// 9. 저장 · 불러오기 · 같은 씨앗
{
  const play = seed => { const M = MZ.newRun(seed); M.gold = 40; MZ.dig(M, C(1, 3)); MZ.setUse(M, C(2, 2), 'kin', 'pool'); MZ.buy(M, 0); MZ.buy(M, 1); Object.keys(M.unit).forEach(uid => MZ.move(M, +uid, { cell: C(2, 2) })); return M; };
  const A = play(41), B = play(41); ok(JSON.stringify(A) === JSON.stringify(B), '같은 씨앗의 준비');
  const js = MZ.save(A), A2 = MZ.load(js); ok(A2 && JSON.stringify(A2) === JSON.stringify(A) && JSON.stringify(MZ.view(A2)) === JSON.stringify(MZ.view(A)), '저장과 불러오기');
  const ra = MZ.raid(A), ra2 = MZ.raid(A2), rb = MZ.raid(B); ok(JSON.stringify(ra) === JSON.stringify(rb) && JSON.stringify(ra) === JSON.stringify(ra2) && JSON.stringify(A) === JSON.stringify(A2), '같은 씨앗 같은 침입, 불러온 판도 같다');
  ok(MZ.load('{') === null && MZ.load(JSON.stringify(Object.assign({}, A, { v: 0 }))) === null && MZ.load(JSON.stringify(Object.assign({}, A, { v: 1 }))) === null && MZ.V === A.v && MZ.V === 2, '못 읽는 저장 (옛 판 번호는 새 판)');
  ok(JSON.stringify(MZ.raid(play(42))) !== JSON.stringify(ra), '씨앗이 다르면 다르다');
}
// 10. 실패의 글은 담백하게
{
  const M = MZ.newRun(50), errs = [MZ.dig(M, 0), MZ.fill(M, 7), MZ.setUse(M, 0, 'trap', 'x'), MZ.buy(M, 9), MZ.sell(M, 99), MZ.move(M, 99, { cell: 7 })];
  ok(errs.every(e => !e.ok && typeof e.msg === 'string' && e.msg.length > 0 && e.msg.length <= 20 && !/!|\?/.test(e.msg)), '실패의 글');
}
// 11. 헤매는 일행 · 길잡이 · 보상
{
  // 막다른 굴: 가운데를 4행에서 끊고 오른쪽으로 돌아간다
  const dead = seed => { const M = MZ.newRun(seed); M.gold = 99; [C(2, 3), C(2, 4), C(3, 4), C(4, 4), C(5, 4), C(6, 4), C(6, 3)].forEach(c => MZ.dig(M, c)); MZ.fill(M, C(5, 2)); return M; };
  const M = dead(60), p1 = MZ.pathOf(M, 1), p1b = MZ.pathOf(clone(M), 1);
  ok(JSON.stringify(p1) === JSON.stringify(p1b) && JSON.stringify(MZ.pathOf(M, 1)) === JSON.stringify(p1), '헤매는 길은 정해져 있다 (같은 굴 같은 길)');
  ok(!p1.scout && p1.cells.join() === [2, 7, 12, 17, 22, 17, 12, 13, 14, 19, 24, 29, 34, 33, 32, 37].join() && p1.back.map(b => (b ? 1 : 0)).join('') === '0000011000000000' && p1.len === 16, '더 깊은 쪽으로 가다가 막다르면 되돌아간다 ' + p1.cells.join(','));
  const p2 = MZ.pathOf(M, 2); ok(p2.scout && p2.cells.join() === p2.scoutPath.join() && p2.scoutPath.join() === [2, 7, 12, 13, 14, 19, 24, 29, 34, 33, 32, 37].join() && p2.back.every(b => !b), '길잡이가 있으면 가장 짧은 길로 온다');
  const v = MZ.view(M).next; ok(v.path.join() === p1.cells.join() && v.back.join() === p1.back.join() && v.scout === false && Array.isArray(v.scoutPath) && Array.isArray(v.lostAt), '미리보기에 되돌아감과 길잡이의 길');
  // 걷는 이: 길잡이를 잃으면 그 자리부터 헤맨다
  const W = MZ.walker(M, MZ.RAIDS[1].units), seen = []; for (let k = 0; k < 3; k++) seen.push(W.next().cell); W.lose(); for (let k = 0; k < 4; k++) seen.push(W.next().cell);
  ok(seen.join() === [2, 7, 12, 17, 22, 17, 12].join() && W.mode === 'lost', '길잡이를 잃으면 갈림길에서 더 깊은 막다른 굴로 간다 ' + seen.join(','));
  // 실제 침입: 앞쪽 방에서 길잡이가 쓰러지면 헤맨다
  let downLost = false, same = false;
  const KS = ['biter', 'gnaw', 'mask', 'tangle', 'famine', 'hood', 'gazer'];
  for (let s = 1; s <= 40 && !(downLost && same); s++) {
    const Q = dead(70 + s); Q.raid = 2; Q.level = 6; MZ.setUse(Q, C(1, 2), 'kin'); give(Q, KS[s % 7], 1 + (s % 2), C(1, 2)); give(Q, 'shell', 2, C(6, 2));
    const pv = MZ.pathOf(Q, 2), r = MZ.raid(Q), fs = r.steps.filter(x => x.type === 'fight'), walked = r.steps.filter(x => x.type === 'walk').reduce((a, x) => a.concat(x.cells), []);
    r.steps.filter(x => x.type === 'walk').forEach(x => ok(Array.isArray(x.back) && x.back.length === x.cells.length && typeof x.lost === 'boolean', '걷기 단계의 되돌아감'));
    if (fs[0] && fs[0].scoutDown && fs[0].after.inv.some(p => p.alive && !p.mad)) { const i = r.steps.indexOf(fs[0]), w = r.steps[i + 1]; if (w && w.type === 'walk' && w.lost && walked.includes(C(4, 2)) && r.steps.some(x => x.type === 'walk' && x.back.some(b => b))) downLost = true; }
    if (fs[0] && !fs[0].after.inv.some(p => MZ.SCOUTS.includes(p.kind) && !p.alive) && r.result.survivors > 0 && walked.join() === pv.cells.join()) same = true;
  }
  ok(downLost, '앞쪽 방에서 길잡이가 쓰러지면 그 자리부터 헤맨다'); ok(same, '길잡이가 살아 있으면 미리보기 = 실제 길');
  // 되돌아 지나는 방: 남은 권속과 다시 싸운다
  let again = false; for (let s = 1; s <= 36 && !again; s++) { const Q = dead(100 + s); Q.level = 6; MZ.setUse(Q, C(3, 2), 'kin'); for (let j = 0; j < 1 + (s % 2); j++) give(Q, ['shell', 'heap', 'maw'][(s + j) % 3], 1 + (Math.floor(s / 2) % 3), C(3, 2)); const r = MZ.raid(Q), at = r.steps.filter(x => x.type === 'fight' && x.cell === C(3, 2)); if (at.length === 2 && at[1].back && at[1].before.kin.every(k => k.alive)) again = true; }
  ok(again, '되돌아 지나는 방에서 남은 권속과 다시 싸운다');
  // 무거운 자: 오래 헤매면 바위를 부수고 알 쪽으로
  const B = MZ.newRun(15); B.raid = 4; [C(0, 3), C(0, 4), C(1, 4), C(2, 4), C(2, 3), C(2, 2), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(4, 1), C(4, 2), C(4, 3), C(4, 4), C(5, 4), C(6, 4), C(6, 3)].forEach(c => Object.assign(B.grid[c], { dug: true, use: 'path' })); [C(1, 2), C(3, 2), C(5, 2)].forEach(c => Object.assign(B.grid[c], { dug: false, use: null }));
  const h4 = MZ.pathOf(B, 4), h1 = MZ.pathOf(B, 1); ok(h4.breaks.length === 1 && h4.len <= h1.len - MZ.MK.breakMin && h1.breaks.length === 0 && h4.cells.indexOf(h4.breaks[0]) > MZ.MK.lostBreak, '헤매던 무거운 자가 바위를 부순다 ' + h1.len + '→' + h4.len);
  // 보상: 막으면 방 하나 / 함정 하나 무료
  const R = MZ.newRun(31); R.level = 6; [C(1, 2), C(3, 2)].forEach((c, i) => { MZ.setUse(R, c, 'kin'); give(R, ['shell', 'maw', 'heap'][i], 3, c); give(R, 'famine', 3, c); }); const rr = MZ.raid(R), rv = MZ.view(R).reward;
  ok(rr.result.win && rv && rv.opts.length === 2 && rv.opts[0].type === 'room' && rv.opts[1].type === 'trap' && rv.opts.every(o => o.name && o.short && o.id), '막으면 보상: 방 종류 / 함정');
  const g0 = R.gold, id = rv.opts[1].id; ok(MZ.takeReward(R, 1).ok && !MZ.view(R).reward && MZ.view(R).free.length === 1 && MZ.view(R).free[0].id === id && !MZ.takeReward(R, 0).ok, '보상을 받는다');
  ok(MZ.setUse(R, C(4, 2), 'trap', id).ok && R.gold === g0 && !R.free.length && MZ.setUse(R, C(5, 2), 'trap', id).ok && R.gold === g0 - MZ.MK.trapCost, '받은 함정은 한 번 무료');
  const L2 = MZ.newRun(32); const r2 = MZ.raid(L2); ok(!r2.result.win && !MZ.view(L2).reward, '못 막으면 보상이 없다');
  const R3 = clone(R); R3.reward = { opts: [{ type: 'room', id: 'pool' }, { type: 'trap', id: 'tr_teeth' }] }; MZ.raid(R3); ok(!R3.reward || R3.reward !== null && R3.hist.length === 2, '받지 않은 보상은 다음 침입이 오면 사라진다');
}
// 12. 본체 방과 알의 방은 출구 뒤에 붙은 방이다
{
  const M = MZ.newRun(40); M.level = 6; const a = give(M, 'shell', 2); MZ.move(M, a, { core: true });
  const P = MZ.pathOf(M, 1); ok(P.cells[P.cells.length - 1] === MZ.EXIT && !P.cells.includes('core') && !P.cells.includes('egg'), '길은 출구에서 끝난다');
  const D = MZ.newRun(41); D.gold = 99; [C(2, 3), C(3, 3), C(4, 3), C(5, 3), C(6, 3), C(7, 3)].forEach(c => MZ.dig(D, c)); MZ.fill(D, C(6, 2)); MZ.fill(D, C(5, 2));
  const PD = MZ.pathOf(D, 1); ok(PD.cells[PD.cells.length - 1] === MZ.EXIT && PD.cells.includes(C(7, 3)), '돌아 들어와도 길은 출구에서 끝난다');
  const r = MZ.raid(M), types = r.steps.map(x => x.type), cf = r.steps.find(x => x.type === 'fight' && x.core), eg = r.steps.find(x => x.type === 'egg'), walked = r.steps.filter(x => x.type === 'walk').reduce((q, x) => q.concat(x.cells), []);
  ok(cf && cf.cell === 'core' && cf.core === true && cf.room === null && cf.before.kin.length === 1 && cf.before.kin[0].uid === a, '본체 방 싸움: cell = core');
  ok(walked[walked.length - 1] === MZ.EXIT && walked.every(c => Number.isInteger(c)) && types.indexOf('fight') > types.lastIndexOf('walk'), '출구에서 본체 방으로 가는 걸음은 walk 에 없다');
  ok(!eg || (eg.cell === 'egg' && types.indexOf('egg') > types.indexOf('fight')), '알 단계: cell = egg, 본체 방 다음');
  const E = MZ.newRun(42), re = MZ.raid(E), ee = re.steps.find(x => x.type === 'egg'), ce = re.steps.find(x => x.type === 'fight');
  ok(ce && ce.cell === 'core' && ee && ee.cell === 'egg' && ee.egg === E.egg && re.steps[re.steps.length - 1] === ee, '권속이 없어도 본체가 싸우고, 남은 자는 알에 닿는다');
  const S = MZ.newRun(43); S.level = 6; MZ.move(S, give(S, 'heap'), { core: true }); MZ.move(S, give(S, 'maw'), { cell: C(3, 2) }); const S2 = MZ.load(MZ.save(S));
  ok(S2 && S2.board.core.length === 1 && S2.grid[C(3, 2)].use === 'kin' && JSON.stringify(MZ.view(S2)) === JSON.stringify(MZ.view(S)), '저장·불러오기: 본체 방과 통로에 세운 권속');
}
console.log(bad ? '실패 ' + bad : '굴 짓기 규칙: 모두 맞음'); process.exitCode = bad ? 1 : 0;
