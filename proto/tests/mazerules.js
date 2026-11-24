// 굴 짓기 규칙 검사.  node tests/mazerules.js
const MZ = require('../src/maze.js'), L = require('../src/lair.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const C = (r, c) => MZ.idx(r, c), clone = o => JSON.parse(JSON.stringify(o));
// 침입 (깨어남이 열려 있으면 첫 갈래를 고르고)
const rd = M => { if (M.awaken) MZ.awaken(M, 0); return MZ.raid(M); };
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
  ok(v.core && Array.isArray(v.core.units) && !v.core.units.length && v.core.max === MZ.MK.coreMax && MZ.MK.coreMax === 3 && v.core.form === 'drop' && v.core.step === 0, '본체 방의 보기');
  ok(v.raid === 1 && v.raids === null && v.endless && v.score.raids === 0 && v.daily === null && v.egg.hp === MZ.MK.egg && v.gold === MZ.MK.gold && v.cap === MZ.MK.level + MZ.MK.capPlus && v.cap === 5 && v.shop.length === 5 && v.bench.length === 6 && v.next.name === MZ.RAIDS[0].name && v.next.party.length === 4 && v.next.path.join() === [2, 7, 12, 17, 22, 27, 32, 37].join(), '새 판의 보기');
  ok(v.grid.every(g => 'r' in g && 'c' in g && 'dug' in g && 'use' in g && 'room' in g && 'trap' in g && Array.isArray(g.units) && 'canDig' in g && 'digCost' in g && 'canFill' in g && 'fillGold' in g), '칸마다의 보기');
  ok(v.rooms.length === 8 && v.traps.length === 7 && v.traps.filter(t => t.maze).length === 3 && v.traps.every(t => t.cost >= 2 && t.cost <= 3) && v.traps.every(t => t.name && t.short && t.short.length <= 16 && t.more), '방과 함정 보기');
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
  MZ.setUse(M, C(4, 2), 'kin'); M.level = 9; for (let k = 0; k < MZ.MK.roomMax; k++) { const x = give(M, 'biter'); MZ.move(M, x, { cell: C(4, 2) }); } ok(M.board[C(4, 2)].length === MZ.MK.roomMax && MZ.MK.roomMax === 4, '방에는 넷까지');
  const y = give(M, 'gnaw'), full = MZ.move(M, y, { cell: C(4, 2) }); ok(!full.ok && full.msg === '방이 찼다', '찬 방에는 못 세운다');
  { const Z = MZ.newRun(12); let placed = 0; for (let k = 0; k < 7; k++) { const x = give(Z, 'shell'); if (MZ.move(Z, x, { cell: k < 4 ? C(2, 2) : 'core' }).ok) placed++; } ok(Z.level === 3 && placed === 5 && MZ.view(Z).cap === 5 && MZ.view(Z).placed === 5, '세울 수: 처음 5, 레벨마다 +1'); Z.level = 9; ok(MZ.view(Z).cap === 11, '레벨 9 면 11'); }
  const Q = MZ.newRun(11); const a = give(Q, 'shell'), b = give(Q, 'heap'), c = give(Q, 'maw'); Q.level = 6; const d4 = give(Q, 'biter'); ok(MZ.move(Q, a, { core: true }).ok && MZ.move(Q, b, { cell: 'core' }).ok && MZ.move(Q, c, { core: true }).ok && MZ.move(Q, d4, { core: true }).msg === '방이 찼다' && Q.board.core.length === 3 && MZ.whereOf(Q, a).core && MZ.view(Q).core.units.length === 3, '본체 방에는 셋까지 (깨어나면 넷)');
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
  const p1 = MZ.pathOf(M, 1), p2 = MZ.pathOf(M, 2); ok(p1.cells.includes(C(2, 2)) && !p1.avoided, '마을 사람들은 함정으로 간다'); ok(!p2.cells.includes(C(2, 2)) && p2.avoided && !p2.scout, '도적이 함정을 돌아간다 (길잡이는 아니다)');
  const far = MZ.newRun(14); far.gold = 99; MZ.setUse(far, C(2, 2), 'trap', 'tr_teeth'); ok(MZ.pathOf(far, 2).cells.includes(C(2, 2)) && !MZ.pathOf(far, 2).avoided, '돌아갈 길이 없으면 함정을 밟는다');
  M.raid = 2; const pv = MZ.view(M).next.path, r = rd(M), walked = r.steps.filter(s => s.type === 'walk').reduce((a, s) => a.concat(s.cells), []);
  ok(r.ok && pv.join() === r.path.cells.join() && pv.slice(0, walked.length).join() === walked.join() && !r.steps.some(s => s.type === 'trap'), '미리보기의 길 = 실제 길 (도적)');
  // 바위 부수기: 길게 둘러 가면 3막의 무거운 자가 지름길을 낸다
  const B = MZ.newRun(15); B.gold = 99; B.raid = 4; const SN = [C(0, 3), C(0, 4), C(1, 4), C(2, 4), C(2, 3), C(2, 2), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(4, 1), C(4, 2), C(4, 3), C(4, 4), C(5, 4), C(6, 4), C(6, 3), C(6, 2)];
  B.grid.forEach((g, i) => { if (g.use === 'path' && i !== MZ.ENT && i !== MZ.EXIT) Object.assign(g, { dug: false, use: null }); }); SN.forEach(c => Object.assign(B.grid[c], { dug: true, use: 'path' })); ok(MZ.connected(B, c => B.grid[c].dug), '뱀 굴');
  const pb = MZ.pathOf(B, 4), pm = MZ.pathOf(B, 1); ok(pm.len > MZ.MK.breakAt && !pm.breaks.length && pb.breaks.length === 1 && pb.len <= pm.len - MZ.MK.breakMin && !B.grid[pb.breaks[0]].dug, '무거운 자가 바위를 부순다 ' + pm.len + '→' + pb.len);
  const vb = MZ.view(B).next; ok(vb.breaks.join() === pb.breaks.join() && vb.path.join() === pb.cells.join(), '미리보기에 부술 바위가 보인다');
  const rb = rd(B); ok(rb.steps.some(s => s.type === 'break' && s.cell === pb.breaks[0]) && B.grid[pb.breaks[0]].dug && MZ.pathOf(B, 3).len === pb.len, '부순 바위는 판 칸으로 남는다');
  const S = MZ.newRun(16); const rs = rd(S), wk = rs.steps.filter(s => s.type === 'walk').reduce((a, s) => a.concat(s.cells), []); ok(wk.join() === rs.path.cells.join() && rs.steps.some(s => s.type === 'egg'), '아무도 없으면 알까지 곧장');
}
// 6. 싸움: 체력·정신이 방 사이로 이어지고, 쓰러진 권속은 침입 뒤 돌아온다
{
  let carried = false, died = false, back = false, seenFight = 0;
  for (let s = 1; s <= 12; s++) {
    const M = MZ.newRun(100 + s); M.level = 6; [C(1, 2), C(3, 2)].forEach(c => MZ.setUse(M, c, 'kin')); give(M, 'gazer', 1, C(1, 2)); give(M, 'hood', 1, C(1, 2)); give(M, 'biter', 1, C(3, 2)); give(M, 'gnaw', 1, C(3, 2));
    const r = rd(M), fs = r.steps.filter(x => x.type === 'fight'); fs.forEach((x, i) => { seenFight++; checkFight(x.fight, 'maze#' + s + '.' + i); ok(x.fight.time > 0 && x.fight.time <= MZ.MK.clock.end + 0.01, '싸움 길이'); });
    if (fs.length >= 2) { const a = fs[0].after.inv, b = fs[1].before.inv; ok(a.every((p, i) => p.hp === b[i].hp && p.alive === b[i].alive && b[i].san <= p.san && (p.mad ? b[i].mad : true)), '앞 방의 결과가 다음 방의 시작 (걷는 동안 정신만 깎인다)'); const e = fs[1].fight.units.filter(u => /^e/.test(u.id)); if (a.some(p => p.alive && p.hp < p.mhp) && e.every(u => { const p = b.find(q => q.alive && q.kind === u.kind && q.hp === u.hp); return !!p; })) carried = true; }
    fs.forEach(x => { if (x.after.kin.some(k => !k.alive)) died = true; });
    if (died && !back && M.phase === 'prep') { const v = MZ.view(M); if (v.grid[C(1, 2)].units.length === 2 && v.grid[C(3, 2)].units.length === 2) { const r2 = rd(M), f2 = r2.steps.find(x => x.type === 'fight'); if (f2 && f2.before.kin.every(k => k.alive && k.hp == null)) back = true; } }
  }
  ok(seenFight >= 12, '싸움이 난다 ' + seenFight); ok(carried, '일행의 체력이 방 사이로 이어진다'); ok(died && back, '쓰러진 권속이 침입 뒤 돌아온다');
}
// 6-2. 굴 속의 어둠: 걸은 칸마다 정신이 깎인다
{
  const M = MZ.newRun(17), r = rd(M), w = r.steps.filter(s => s.type === 'walk'), cells = w.reduce((a, s) => a + s.cells.length, 0), eggStep = r.steps.find(s => s.type === 'egg');
  ok(w.every(s => typeof s.san === 'number' && Array.isArray(s.mad)) && Math.abs(w.reduce((a, s) => a + s.san, 0) - (cells * MZ.MK.darkSan + MZ.MK.darkGrow * cells * (cells - 1) / 2)) < 1e-6, '걷는 구간마다 깎인 정신이 실린다 (걸을수록 더 깎인다)');
  const Q = MZ.newRun(18); Q.gold = 99; Q.raid = 4; [C(0, 1), C(0, 0), C(1, 0), C(2, 0), C(3, 0), C(4, 0), C(5, 0), C(6, 0), C(6, 1)].forEach(c => MZ.dig(Q, c)); [C(1, 2), C(2, 2), C(3, 2), C(4, 2), C(5, 2)].forEach(c => MZ.fill(Q, c)); Q.grid.forEach(g => { if (g.use === 'path') g.use = 'path'; });
  const long = MZ.pathOf(Q, 1); ok(long.len > 8, '긴 굴 ' + long.len);
}
// 7. 함정: 체력 · 정신 (미침) · 느려짐 · 감염
{
  const T0 = MZ.newRun(19); T0.gold = 99; MZ.setUse(T0, C(1, 2), 'trap', 'tr_teeth'); const t0 = rd(T0).steps.find(s => s.type === 'trap');
  ok(t0 && t0.id === 'tr_teeth' && t0.after.every((p, i) => p.hp === Math.max(1, Math.round(t0.before[i].hp - p.mhp * MZ.TRAP.tr_teeth.hp)) && p.hp < p.mhp), '이빨 구덩이: 체력');
  // 정신 배수를 낮춰 미치는 것을 본다 (검사용)
  const keepSan = MZ.MK.sanMul; MZ.MK.sanMul = 1.2;
  const M = MZ.newRun(20); M.gold = 99; M.raid = 2; MZ.setUse(M, C(1, 2), 'trap', 'tr_whisper'); MZ.setUse(M, C(2, 2), 'trap', 'tr_whisper'); MZ.setUse(M, C(3, 2), 'trap', 'tr_whisper'); MZ.setUse(M, C(4, 2), 'trap', 'tr_slime'); MZ.setUse(M, C(5, 2), 'trap', 'tr_spore');
  give(M, 'shell', 2, 'core');
  const r = rd(M), tr = r.steps.filter(s => s.type === 'trap'); ok(tr.map(s => s.id).join() === 'tr_whisper,tr_whisper,tr_whisper,tr_slime,tr_spore' && tr.every(s => s.fx && s.before && s.after), '함정 다섯을 밟는다');
  ok(tr[0].after.every((p, i) => p.san < tr[0].before[i].san) && tr[2].after.some(p => p.mad) && tr[2].after.some(p => !p.mad) && tr[2].after.every((p, i) => p.mad === (p.san <= 0)), '속삭이는 벽: 정신을 깎고, 바닥난 자는 미친다');
  const lost = (t, i) => t.before[i].san - t.after[i].san, live = tr[2].before.map((p, i) => i).filter(i => tr[2].before[i].san > 30 && tr[0].before[i].san > 45);
  ok(live.length && live.every(i => Math.abs(lost(tr[0], i) - 45) <= 1 && Math.abs(lost(tr[1], i) - 22.5) <= 1 && Math.abs(lost(tr[2], i) - 11.25) <= 1), '같은 침입의 정신 함정: 두 번째는 절반, 세 번째부터 4분의 1');
  { const S4 = MZ.newRun(22); S4.raid = 4; S4.gold = 99; [1, 2, 3, 4, 5].forEach(r => MZ.setUse(S4, C(r, 2), 'trap', 'tr_whisper')); const t4 = rd(S4).steps.filter(s => s.type === 'trap'); ok(t4.length && !t4[t4.length - 1].after.find(p => p.kind === 'seeker').mad, '책을 쫓는 자는 미치지 않는다'); }
  const W3 = MZ.newRun(21); W3.gold = 99; [1, 2, 3].forEach(r => MZ.setUse(W3, C(r, 2), 'trap', 'tr_whisper')); const r3 = rd(W3); ok(r3.result.mads === 4 && !r3.steps.some(s => s.type === 'egg') && r3.result.win, '모두 미치면 일행이 굴 속으로 흩어진다');
  const f = r.steps.find(s => s.type === 'fight'); ok(f && f.fight.timeline.some(e => e.type === 'mad' && e.t === 0) && f.fight.timeline.some(e => e.type === 'status' && e.st === 'slow' && e.t === 0) && f.fight.timeline.some(e => e.type === 'status' && e.st === 'infected' && e.t === 0), '미친 자는 다음 싸움에서 둥지 편, 늪은 둔하게, 포자는 감염');
  MZ.MK.sanMul = keepSan;
  ok(f.fight.units.filter(u => u.mad).length === f.before.inv.filter(p => p.mad && p.alive).length && f.before.inv.some(p => p.mad), '미친 채 시작하는 자가 보기에 실린다');
}
// 8. 알과 판의 끝
{
  const M = MZ.newRun(30), r = rd(M), egg = r.steps.find(s => s.type === 'egg'), dmg = MZ.RAIDS[0].units.reduce((a, k) => a + (L.INV[k].tier || 1) + (L.INV[k].boss ? 2 : 0), 0);
  ok(egg && egg.dmg === dmg && M.egg === MZ.MK.egg - dmg && !r.result.win && r.result.eggLost === dmg && r.result.survivors === 4 && r.next === 'prep' && M.raid === 2, '알에 닿은 침입자마다 알이 깎인다 (' + dmg + ')');
  ok(M.gold === MZ.MK.gold + MZ.MK.income && M.xp === MZ.MK.xpRaid, '침입 뒤 진액과 경험');
  M.egg = 1; const r2 = rd(M); ok(r2.next === 'over' && M.phase === 'over' && M.over && !M.over.win && !rd(M).ok, '알이 깨지면 진다');
  const W = MZ.newRun(31); W.level = 6; ['shell', 'maw', 'heap', 'famine', 'mother', 'tangle'].forEach((k, i) => { const c = [C(1, 2), C(3, 2)][i % 2]; MZ.setUse(W, c, 'kin'); give(W, k, 3, c); });
  let last = null; for (let k = 0; k < 4 && W.phase === 'prep'; k++) last = rd(W); ok(W.phase === 'prep' && W.raid === 5 && last.next === 'prep' && last.result.win && W.score.raids === 4, '넷을 막아도 끝나지 않는다 (끝없는 자유)');
}
// 9. 저장 · 불러오기 · 같은 씨앗
{
  const play = seed => { const M = MZ.newRun(seed); M.gold = 40; MZ.dig(M, C(1, 3)); MZ.setUse(M, C(2, 2), 'kin', 'pool'); MZ.buy(M, 0); MZ.buy(M, 1); Object.keys(M.unit).forEach(uid => MZ.move(M, +uid, { cell: C(2, 2) })); return M; };
  const A = play(41), B = play(41); ok(JSON.stringify(A) === JSON.stringify(B), '같은 씨앗의 준비');
  const js = MZ.save(A), A2 = MZ.load(js); ok(A2 && JSON.stringify(A2) === JSON.stringify(A) && JSON.stringify(MZ.view(A2)) === JSON.stringify(MZ.view(A)), '저장과 불러오기');
  const ra = rd(A), ra2 = rd(A2), rb = rd(B); ok(JSON.stringify(ra) === JSON.stringify(rb) && JSON.stringify(ra) === JSON.stringify(ra2) && JSON.stringify(A) === JSON.stringify(A2), '같은 씨앗 같은 침입, 불러온 판도 같다');
  ok(MZ.load('{') === null && MZ.load(JSON.stringify(Object.assign({}, A, { v: 0 }))) === null && MZ.load(JSON.stringify(Object.assign({}, A, { v: 1 }))) === null && MZ.V === A.v && MZ.V === 2, '못 읽는 저장 (옛 판 번호는 새 판)');
  ok(JSON.stringify(rd(play(42))) !== JSON.stringify(ra), '씨앗이 다르면 다르다');
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
  // 씨앗마다 갈림길의 고르기가 다르다: 막다른 곳에 들어갔다가 되돌아 나오는 판, 곧장 가는 판이 둘 다 나온다
  const ways = new Set(); let deadBack = null;
  for (let s = 60; s < 100; s++) { const D = dead(s), q = MZ.pathOf(D, 1); ways.add(q.cells.join()); ok(q.cells[q.cells.length - 1] === MZ.EXIT && q.cells.every((c, i) => !i || q.warp[i] || MZ.rc(c)[0] === MZ.rc(q.cells[i - 1])[0] && Math.abs(c - q.cells[i - 1]) === 1 || Math.abs(c - q.cells[i - 1]) === MZ.COLS), '헤매는 길은 이웃 칸으로만 ' + s); if (!deadBack && q.cells.includes(C(4, 2)) && q.back.some(b => b)) deadBack = q; }
  ok(ways.size >= 2, '다른 씨앗이면 다른 길이 나온다 ' + ways.size); ok(deadBack && deadBack.back[deadBack.cells.indexOf(C(4, 2)) + 1] === true, '막다르면 되돌아간다');
  ok(MZ.SCOUTS.join() === 'tracker,c_tov' && MZ.AVOIDERS.includes('rogue') && !MZ.pathOf(M, 2).scout && !MZ.pathOf(M, 1).scout && !MZ.pathOf(M, 4).scout, '길잡이는 추적자뿐 (이야기의 토브 카인도)');
  const p2 = MZ.pathOf(M, 3); ok(p2.scout && p2.cells.join() === p2.scoutPath.join() && p2.scoutPath.join() === [2, 7, 12, 13, 14, 19, 24, 29, 34, 33, 32, 37].join() && p2.back.every(b => !b), '길잡이(추적자)가 있으면 가장 짧은 길로 온다');
  const v = MZ.view(M).next; ok(v.path.join() === p1.cells.join() && v.back.join() === p1.back.join() && v.scout === false && Array.isArray(v.scoutPath) && Array.isArray(v.lostAt), '미리보기에 되돌아감과 길잡이의 길');
  // 걷는 이: 길잡이를 잃으면 그 자리부터 헤맨다
  const W = MZ.walker(M, MZ.RAIDS[2].units, 3), seen = []; for (let k = 0; k < 3; k++) seen.push(W.next().cell); W.lose(); for (let k = 0; k < 12; k++) { const x = W.next(); if (!x) break; seen.push(x.cell); }
  ok(seen.slice(0, 3).join() === [2, 7, 12].join() && W.mode !== 'scout' && seen[seen.length - 1] === MZ.EXIT, '길잡이를 잃으면 그 자리부터 헤맨다 ' + seen.join(','));
  // 실제 침입: 앞쪽 방에서 길잡이가 쓰러지면 헤맨다
  let downLost = false, same = false;
  const KS = ['biter', 'gnaw', 'tangle', 'mask', 'famine'];
  // 검사용 일행: 추적자 + 앞줄 기사 둘 (뒷줄의 길잡이만 쓰러지는 판을 찾는다)
  const keepMul = MZ.MK.raidMul.slice(), keepUnits = MZ.RAIDS[2].units; MZ.MK.raidMul[2] = 0.5; MZ.RAIDS[2].units = ['tracker', 'knight', 'knight'];
  for (let s = 1; s <= 40 && !(downLost && same); s++) {
    const Q = dead(70 + s); Q.raid = 3; Q.level = 6; MZ.setUse(Q, C(1, 2), 'kin'); give(Q, KS[s % 5], 2 + (s % 2), C(1, 2)); give(Q, 'shell', 2, 'core');
    const pv = MZ.pathOf(Q, 3), r = rd(Q), fs = r.steps.filter(x => x.type === 'fight'), walked = r.steps.filter(x => x.type === 'walk').reduce((a, x) => a.concat(x.cells), []);
    r.steps.filter(x => x.type === 'walk').forEach(x => ok(Array.isArray(x.back) && x.back.length === x.cells.length && typeof x.lost === 'boolean', '걷기 단계의 되돌아감'));
    if (fs[0] && fs[0].scoutDown && fs[0].after.inv.some(p => p.alive && !p.mad)) { const i = r.steps.indexOf(fs[0]), w = r.steps[i + 1]; if (w && w.type === 'walk' && w.lost && r.result.lost) downLost = true; }
    if (fs[0] && !fs[0].after.inv.some(p => MZ.SCOUTS.includes(p.kind) && !p.alive) && r.result.survivors > 0 && walked.join() === pv.cells.join()) same = true;
  }
  MZ.MK.raidMul = keepMul; MZ.RAIDS[2].units = keepUnits; ok(downLost, '앞쪽 방에서 길잡이가 쓰러지면 그 자리부터 헤맨다'); ok(same, '길잡이가 살아 있으면 미리보기 = 실제 길');
  // 되돌아 지나는 방: 남은 권속과 다시 싸운다
  let again = false; for (let s = 1; s <= 36 && !again; s++) { const Q = dead(100 + s); Q.level = 6; MZ.setUse(Q, C(3, 2), 'kin'); for (let j = 0; j < 1 + (s % 2); j++) give(Q, ['shell', 'heap', 'maw'][(s + j) % 3], 1 + (Math.floor(s / 2) % 3), C(3, 2)); const r = rd(Q), at = r.steps.filter(x => x.type === 'fight' && x.cell === C(3, 2)); if (at.length === 2 && at[1].back && at[1].before.kin.every(k => k.alive)) again = true; }
  ok(again, '되돌아 지나는 방에서 남은 권속과 다시 싸운다');
  // 무거운 자: 오래 헤매면 바위를 부수고 알 쪽으로
  const B = MZ.newRun(15); B.raid = 4; [C(0, 3), C(0, 4), C(1, 4), C(2, 4), C(2, 3), C(2, 2), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(4, 1), C(4, 2), C(4, 3), C(4, 4), C(5, 4), C(6, 4), C(6, 3)].forEach(c => Object.assign(B.grid[c], { dug: true, use: 'path' })); [C(1, 2), C(3, 2), C(5, 2)].forEach(c => Object.assign(B.grid[c], { dug: false, use: null }));
  const h4 = MZ.pathOf(B, 4), h1 = MZ.pathOf(B, 1); ok(h4.breaks.length === 1 && h4.len <= h1.len - MZ.MK.breakMin && h1.breaks.length === 0 && h4.cells.indexOf(h4.breaks[0]) > MZ.MK.lostBreak, '헤매던 무거운 자가 바위를 부순다 ' + h1.len + '→' + h4.len);
  // 보상: 막으면 방 하나 / 함정 하나 무료
  const R = MZ.newRun(31); R.level = 6; [C(1, 2), C(3, 2)].forEach((c, i) => { MZ.setUse(R, c, 'kin'); give(R, ['shell', 'maw', 'heap'][i], 3, c); give(R, 'famine', 3, c); }); const rr = rd(R), rv = MZ.view(R).reward;
  ok(rr.result.win && rv && rv.opts.length === 2 && rv.opts[0].type === 'room' && rv.opts[1].type === 'trap' && rv.opts.every(o => o.name && o.short && o.id), '막으면 보상: 방 종류 / 함정');
  const g0 = R.gold, id = rv.opts[1].id; ok(MZ.takeReward(R, 1).ok && !MZ.view(R).reward && MZ.view(R).free.length === 1 && MZ.view(R).free[0].id === id && !MZ.takeReward(R, 0).ok, '보상을 받는다');
  ok(MZ.setUse(R, C(4, 2), 'trap', id).ok && R.gold === g0 && !R.free.length && MZ.setUse(R, C(5, 2), 'trap', id).ok && R.gold === g0 - MZ.MK.trapCost, '받은 함정은 한 번 무료');
  const L2 = MZ.newRun(32); const r2 = rd(L2); ok(!r2.result.win && !MZ.view(L2).reward, '못 막으면 보상이 없다');
  const R3 = clone(R); R3.reward = { opts: [{ type: 'room', id: 'pool' }, { type: 'trap', id: 'tr_teeth' }] }; rd(R3); ok(!R3.reward || R3.reward !== null && R3.hist.length === 2, '받지 않은 보상은 다음 침입이 오면 사라진다');
}
// 12. 본체 방과 알의 방은 출구 뒤에 붙은 방이다
{
  const M = MZ.newRun(40); M.level = 6; const a = give(M, 'shell', 2); MZ.move(M, a, { core: true });
  const P = MZ.pathOf(M, 1); ok(P.cells[P.cells.length - 1] === MZ.EXIT && !P.cells.includes('core') && !P.cells.includes('egg'), '길은 출구에서 끝난다');
  const D = MZ.newRun(41); D.gold = 99; [C(2, 3), C(3, 3), C(4, 3), C(5, 3), C(6, 3), C(7, 3)].forEach(c => MZ.dig(D, c)); MZ.fill(D, C(6, 2)); MZ.fill(D, C(5, 2));
  const PD = MZ.pathOf(D, 1); ok(PD.cells[PD.cells.length - 1] === MZ.EXIT && PD.cells.includes(C(7, 3)), '돌아 들어와도 길은 출구에서 끝난다');
  const r = rd(M), types = r.steps.map(x => x.type), cf = r.steps.find(x => x.type === 'fight' && x.core), eg = r.steps.find(x => x.type === 'egg'), walked = r.steps.filter(x => x.type === 'walk').reduce((q, x) => q.concat(x.cells), []);
  ok(cf && cf.cell === 'core' && cf.core === true && cf.room === null && cf.before.kin.length === 1 && cf.before.kin[0].uid === a, '본체 방 싸움: cell = core');
  ok(walked[walked.length - 1] === MZ.EXIT && walked.every(c => Number.isInteger(c)) && types.indexOf('fight') > types.lastIndexOf('walk'), '출구에서 본체 방으로 가는 걸음은 walk 에 없다');
  ok(!eg || (eg.cell === 'egg' && types.indexOf('egg') > types.indexOf('fight')), '알 단계: cell = egg, 본체 방 다음');
  const E = MZ.newRun(42), re = rd(E), ee = re.steps.find(x => x.type === 'egg'), ce = re.steps.find(x => x.type === 'fight');
  ok(ce && ce.cell === 'core' && ee && ee.cell === 'egg' && ee.egg === E.egg && re.steps[re.steps.length - 1] === ee, '권속이 없어도 본체가 싸우고, 남은 자는 알에 닿는다');
  const S = MZ.newRun(43); S.level = 6; MZ.move(S, give(S, 'heap'), { core: true }); MZ.move(S, give(S, 'maw'), { cell: C(3, 2) }); const S2 = MZ.load(MZ.save(S));
  ok(S2 && S2.board.core.length === 1 && S2.grid[C(3, 2)].use === 'kin' && JSON.stringify(MZ.view(S2)) === JSON.stringify(MZ.view(S)), '저장·불러오기: 본체 방과 통로에 세운 권속');
}
// 13. 미로 함정: 미끼 불빛 · 삼키는 구멍 · 헛갈림 벽
{
  const dead = seed => { const M = MZ.newRun(seed); M.gold = 99; [C(2, 3), C(2, 4), C(3, 4), C(4, 4), C(5, 4), C(6, 4), C(6, 3)].forEach(c => MZ.dig(M, c)); MZ.fill(M, C(5, 2)); return M; };
  const wk = r => r.steps.filter(x => x.type === 'walk').reduce((a, x) => a.concat(x.cells), []);
  // 미끼: 갈림길 (2,2) 에서 막다른 곳 (4,2) 의 불빛 쪽으로
  let pulled = 0, plain = 0, offOnce = true;
  for (let s = 60; s < 80; s++) {
    const A = dead(s), B = dead(s), g0 = B.gold; ok(MZ.setUse(B, C(4, 2), 'trap', 'tr_lure').ok && B.gold === g0 - 2, '미끼 불빛의 값');
    const pa = MZ.pathOf(A, 1), pb = MZ.pathOf(B, 1); if (pa.cells[3] !== C(3, 2)) plain++;
    if (pb.cells[3] === C(3, 2) && pb.cells[4] === C(4, 2) && pb.lured.includes(C(2, 2))) pulled++; if (pb.lured.length !== 1) offOnce = false;
  }
  ok(pulled === 20 && plain > 0, '미끼에 끌린다 (불빛이 없으면 곧장 가는 판도 있다) ' + pulled + '/' + plain); ok(offOnce, '닿은 미끼는 꺼진다');
  const L1 = dead(61); MZ.setUse(L1, C(4, 2), 'trap', 'tr_lure'); const lv = MZ.view(L1).next, lr = rd(L1);
  ok(lv.lured.join() === lr.result.lured.join() && wk(lr).join() === lv.path.slice(0, wk(lr).length).join(), '미끼: 미리보기 = 실제');
  // 삼키는 구멍: 입구 바로 아래로 뱉고, 구멍마다 한 번
  const X1 = dead(62), xr = MZ.setUse(X1, C(3, 4), 'trap', 'tr_maw'); ok(!xr.ok && xr.msg === '외길에는 놓을 수 없다', '삼키는 구멍은 외길에 놓을 수 없다');
  { const Y = dead(62); Y.raid = 4; MZ.dig(Y, C(3, 3)); MZ.dig(Y, C(4, 3)); MZ.dig(Y, C(5, 3)); MZ.dig(Y, C(6, 3)); ok(MZ.setUse(Y, C(4, 4), 'trap', 'tr_maw').ok && MZ.canFill(Y, C(4, 3)) === '삼키는 구멍이 외길이 된다', '구멍을 외길로 만드는 메우기는 거부'); }
  let W1 = null, g1 = 0; for (let s = 60; s < 100 && !W1; s++) { const D = dead(s); D.raid = 4; const g = D.gold; if (MZ.setUse(D, C(4, 2), 'trap', 'tr_maw').ok && MZ.pathOf(D, 4).warps.length) { W1 = D; g1 = g; } }
  ok(W1 && W1.gold === g1 - 3, '삼키는 구멍의 값 (막다른 곳)'); const pw = MZ.pathOf(W1, 4), wi = pw.cells.indexOf(C(4, 2));
  ok(pw.warps.length === 1 && pw.warps[0].from === C(4, 2) && pw.warps[0].to === MZ.ENT && pw.cells[wi + 1] === MZ.ENT && pw.warp[wi + 1] && pw.cells[pw.cells.length - 1] === MZ.EXIT && pw.cells.filter((c, i) => pw.warp[i]).length === 1, '삼키는 구멍: 입구로 순간 이동, 한 번만');
  const rw = rd(W1), ws = rw.steps.find(x => x.type === 'warp'), ts = rw.steps.filter(x => x.type === 'trap' && x.id === 'tr_maw');
  ok(ws && ws.from === C(4, 2) && ws.to === MZ.ENT && rw.steps[rw.steps.indexOf(ws) - 1].type === 'trap' && ts.length === 1 && ts[0].after.every((p, i) => p.san === Math.max(0, Math.round(ts[0].before[i].san - 10))), '침입: 구멍 → warp 단계, 정신 −10');
  ok(wk(rw).join() === pw.cells.slice(0, wk(rw).length).join(), '삼키는 구멍: 미리보기 = 실제');
  // 길잡이는 돌아갈 길이 있으면 구멍을 피한다
  const T1 = MZ.newRun(63); T1.gold = 99; [C(2, 3), C(3, 3), C(4, 3), C(5, 3)].forEach(c => MZ.dig(T1, c)); MZ.setUse(T1, C(3, 2), 'trap', 'tr_maw'); const pt = MZ.pathOf(T1, 3);
  ok(pt.scout && !pt.cells.includes(C(3, 2)) && !pt.warps.length, '길잡이는 구멍을 돌아간다');
  // 헛갈림 벽: 다음 갈림길에서 가장 얕은 쪽
  let conf = 0; for (let s = 1; s <= 10; s++) { const H = MZ.newRun(s); H.gold = 99; MZ.dig(H, C(2, 1)); MZ.setUse(H, C(1, 2), 'trap', 'tr_mirror'); const ph = MZ.pathOf(H, 1); if (ph.confused[0] === C(2, 2) && ph.cells[ph.cells.indexOf(C(2, 2)) + 1] === C(2, 1)) conf++; }
  ok(conf === 10, '헛갈리면 다음 갈림길에서 출구에서 먼 쪽(막다른 곳)으로 ' + conf);
  const H = MZ.newRun(3); H.gold = 99; MZ.dig(H, C(2, 1)); MZ.setUse(H, C(1, 2), 'trap', 'tr_mirror'); const ph3 = MZ.pathOf(H, 1), rh = rd(H), th = rh.steps.find(x => x.type === 'trap');
  ok(th && th.id === 'tr_mirror' && th.after.every((p, i) => p.san === Math.max(0, Math.round(th.before[i].san - 15))) && ph3.confused.length === 1 && rh.result.confused.join() === ph3.confused.join(), '헛갈림 벽: 정신 −15, 미리보기 = 실제');
  // 도적: 함정만 피하고 길은 모른다
  const R = dead(64); MZ.setUse(R, C(2, 3), 'trap', 'tr_teeth'); const pr = MZ.pathOf(R, 2);
  ok(!pr.scout && !pr.cells.includes(C(2, 3)) || pr.cells.indexOf(C(2, 3)) > pr.cells.lastIndexOf(C(4, 2)), '도적은 함정을 피하고, 다른 길이 다 막혔을 때만 밟는다');
}
// 14. 이야기 모드
{
  const F = MZ.newRun(5), fv = MZ.view(F); ok(F.mode === 'free' && fv.mode === 'free' && MZ.LOCKS.every(k => fv.locks[k]) && !fv.story && !fv.night && !fv.chapterEnd && MZ.endingOf(F) === null, '자유 모드: 모두 열림, 이야기 칸 없음');
  const M = MZ.newStory(7), v = MZ.view(M);
  ok(M.mode === 'story' && M.chapter === 0 && M.raids === 1 && v.story.chapter === 0 && v.story.raidIds.join() === 'c0_beast' && v.next.id === 'c0_beast' && v.egg.hp === MZ.MK.story.egg, '이야기: 장 0, 침입 하나');
  ok(v.locks.place && !v.locks.dig && !v.locks.rooms && !v.locks.traps && !v.locks.night && !v.rooms.length && !v.traps.length, '장 0 에서는 세우기만 열린다');
  ok(MZ.dig(M, C(1, 1)).msg === '아직 팔 수 없다' && MZ.canFill(M, C(1, 2)) === '아직 메울 수 없다', '잠긴 파기·메우기');
  const u = give(M, 'shell', 1); ok(MZ.move(M, u, { cell: C(3, 2) }).ok && M.grid[C(3, 2)].use === 'kin', '장 0: 통로에 세운다');
  ok(MZ.setUse(M, C(3, 2), 'kin', 'bone').msg === '아직 방 종류를 깔 수 없다' && MZ.setUse(M, C(4, 2), 'trap', 'tr_teeth').msg === '아직 쓸 수 없는 함정이다', '잠긴 방 종류·함정');
  const r0 = rd(M); ok(r0.ok && r0.raidId === 'c0_beast' && (r0.next === 'chapterEnd' || r0.next === 'over'), '장 0 의 침입 ' + r0.next);
  if (M.phase === 'chapterEnd') {
    ok(MZ.view(M).chapterEnd && MZ.view(M).chapterEnd.next === 1 && !MZ.view(M).next && !rd(M).ok, '장의 끝: 다음 장을 기다린다');
    const g0 = M.gold, grid0 = JSON.stringify(M.grid), board0 = JSON.stringify(M.board), bench0 = JSON.stringify(M.bench), lv0 = M.level, n = MZ.nextChapter(M), w = MZ.view(M);
    ok(n.ok && M.chapter === 1 && w.locks.dig && !w.locks.rooms && M.phase === 'prep' && M.raid === 1 && M.raids === 3 && n.raids.join() === 'c1_torch,c1_mob,c1_hounds', '다음 장: 침입 셋, 파기가 열린다');
    ok(JSON.stringify(M.grid) === grid0 && JSON.stringify(M.board) === board0 && JSON.stringify(M.bench) === bench0 && M.level === lv0 && M.board[C(3, 2)].includes(u) && M.gold === Math.floor(g0 * MZ.MK.story.keepGold) + MZ.MK.story.chapterGold && n.refund === undefined, '장을 넘겨도 굴·배치·대기석·레벨이 그대로');
    ok(MZ.dugCap(M) > MZ.MK.story.dugCap[0] && MZ.view(M).maxLv === MZ.MK.story.maxLv[1], '장마다 판 칸·레벨 상한이 는다');
    // 헤매기가 열리기 전에는 모두 길을 안다 (막다른 곳에 들어가지 않는다)
    M.gold = 99; [C(2, 3), C(3, 3), C(4, 3), C(5, 3), C(6, 3)].forEach(c => MZ.dig(M, c)); MZ.fill(M, C(5, 2)); const p1 = MZ.pathOf(M, 1);
    ok(p1.cells.join() === MZ.scoutPath(M, ['militia']).cells.join() && p1.back.every(b => !b), '장 1: 일행은 길을 안다');
  }
  // 장 3: 밤의 한 수
  const S = MZ.newStory(11); S.chapter = 3; S.raids = 3; S.gold = 30; const r1 = rd(S);
  ok(r1.ok && (r1.next === 'night' || r1.next === 'over') && (r1.next !== 'night' || (MZ.view(S).night.offer.length === 3 && new Set(S.night.offer).size === 3)), '장 3: 침입 사이에 카드 셋');
  if (S.night) {
    ok(rd(S).msg === '밤의 한 수를 먼저 고른다', '밤의 한 수가 먼저');
    S.night.offer = ['c_bell', 'e_page', 'i_water']; const a0 = S.alert = 0, g1 = S.gold, nb = MZ.nightPick(S, 0);
    ok(nb.ok && nb.id === 'c_bell' && S.gold === g1 + 9 && S.alert === 3 - MZ.MK.story.alertDecay && S.eyes.church === 2 && S.flags.churchEarly && !S.night && S.picks.raid === 1, '종탑: 진액, 경계, 교회의 눈');
  }
  const T = MZ.newStory(12); T.chapter = 4; T.raids = 4; T.night = { offer: ['x_scout', 'e_page', 'i_water'] };
  ok(MZ.raidOf(T).units.includes('tracker') && MZ.nightPick(T, 0).ok && !MZ.raidOf(T).units.some(k => MZ.SCOUTS.includes(k)) && !MZ.pathOf(T).scout, '앞선 길잡이: 다음 일행의 길잡이가 없다');
  T.night = { offer: ['e_page', 'x_scout', 'i_water'] }; T.gold = 0; const ew = T.edaWhispers; ok(MZ.nightPick(T, 2).msg === '진액이 모자란다' && MZ.nightPick(T, 0).ok && T.edaWhispers === ew + 1 && T.eyes.eda === 1 && MZ.raidOf(T).confused, '비어 있는 쪽: 에다의 눈, 다음 일행이 헛갈린다');
  T.night = { offer: ['v_sheep', 'e_book', 'p_dream'] }; const g2 = T.gold; ok(MZ.nightPick(T, -1).ok && T.gold === g2 && T.nights[T.nights.length - 1].id === null, '고르지 않을 수도 있다');
  // 경계 문턱
  const A = MZ.newStory(13); A.chapter = 3; A.raids = 3; const n0 = MZ.raidOf(A).units.length; A.alert = 3; ok(MZ.raidOf(A).units.length === n0 + 1, '경계 3: 하나 더');
  A.alert = 6; ok(!MZ.raidOf(A).units.includes('tracker'), '경계 6: 길잡이가 열리기 전에는 붙지 않는다'); A.chapter = 5; ok(MZ.raidOf(A).units.includes('tracker'), '경계 6: 길잡이가 붙는다');
  A.chapter = 3; A.alert = 9; A.phase = 'chapterEnd'; MZ.nextChapter(A); ok(A.chapter === 4 && A.raids === 5 && MZ.view(A).story.extra, '경계 9: 다음 장의 침입이 하나 는다');
  // 결말
  const E = MZ.newStory(14); E.chapter = 6; E.egg = 3; ok(MZ.endingOf(E) === 'D', '알이 남으면 D'); E.edaWhispers = 2; ok(MZ.endingOf(E) === 'E', '에다에게 둘 + 바스코를 사냥하지 않음: E'); E.flags.vascoHunted = true; ok(MZ.endingOf(E) === 'D', '바스코를 노렸으면 E 는 없다');
  E.egg = 0; ok(MZ.endingOf(E) === 'A', '눈이 같으면 예언자 A'); E.eyes.church = 2; ok(MZ.endingOf(E) === 'B', '교회 B'); E.eyes.isel = 3; ok(MZ.endingOf(E) === 'C', '이셀 C'); E.eyes = { village: 0, eda: 0, isel: 1, church: 1, prophet: 3 }; ok(MZ.endingOf(E) === 'A', '예언자 A'); E.flags.towerDown = true; ok(MZ.endingOf(E) === 'B', '탑의 주인을 쓰러뜨리면 A 는 없다');
  // 사냥: 성공·실패가 정해져 있다 (같은 씨앗 같은 결과)
  const H1 = MZ.newStory(15), H2 = MZ.newStory(15); [H1, H2].forEach(X => { X.chapter = 4; X.night = { offer: ['v_lamp', 'p_hunt', 'x_scout'] }; }); const h1 = MZ.nightPick(H1, 1), h2 = MZ.nightPick(H2, 1);
  ok(h1.ok && typeof h1.success === 'boolean' && h1.success === h2.success && (h1.success ? H1.flags.towerDown : H1.eyes.prophet === 2), '탑의 주인: 성공이면 표시, 실패면 예언자의 눈 +2');
  // 마지막 장: 끝나면 결말
  const Z = MZ.newStory(16); Z.chapter = 6; Z.raids = 3; Z.raid = 3; Z.egg = 1; Z.level = 6; const zr = rd(Z);
  ok(zr.ok && Z.phase === 'over' && Z.over.ending && 'ABCDE'.includes(Z.over.ending) && MZ.view(Z).ending === Z.over.ending && !Z.over.retry, '장 6 이 끝나면 결말 ' + Z.over.ending);
  // 알이 깨지면 그 장을 다시
  const R = MZ.newStory(17); R.chapter = 2; R.raids = 3; R.egg = 1; R.snap = JSON.stringify(R); const rr = rd(R);
  ok(rr.ok && R.phase === 'over' && R.over.retry && MZ.retryChapter(R).ok && R.phase === 'prep' && R.chapter === 2 && R.egg === 1 && R.retries === 1, '알이 깨지면 그 장을 처음부터');
  // 저장
  const Sv = MZ.newStory(18); Sv.alert = 4; Sv.eyes.isel = 2; const L1 = MZ.load(MZ.save(Sv)); ok(L1 && L1.mode === 'story' && L1.alert === 4 && L1.eyes.isel === 2 && JSON.stringify(MZ.view(L1)) === JSON.stringify(MZ.view(Sv)), '저장·불러오기: 이야기');
  const old = JSON.parse(MZ.save(MZ.newRun(3))); delete old.mode; const L2 = MZ.load(JSON.stringify(old)); ok(L2 && L2.mode === 'free', '모드 칸이 없는 저장은 자유');
  ok(MZ.CHAPTERS.length === 7 && MZ.CHAPTERS.every((c, i) => c.id === 'c' + i && c.raids.length >= (i ? 3 : 1) && c.raids.length <= 4 && c.raids.every(r => r.units.every(k => L.INV[k]))) && MZ.CARDS.length === 15, '장 일곱, 카드 열다섯');
}
// 15. 본체의 깨어남
{
  const M = MZ.newRun(21); ok(MZ.bodyOf(M).form === 'drop' && MZ.view(M).core.step === 0 && !MZ.view(M).awaken, '처음은 0단계 (옛 것)');
  MZ.raid(M); const v = MZ.view(M), o = v.awaken;
  ok(o && o.step === 1 && o.offer.length === 3 && new Set(o.offer.map(x => x.form)).size === 3 && o.offer.every(x => MZ.FORMS[x.form] && x.name && x.skill && x.gift && x.room.length === 1 && x.shop[0].share === MZ.MK.awaken.share[1]), '침입 1 뒤: 모습 셋');
  ok(MZ.raid(M).msg === '깨어남을 먼저 고른다', '깨어남이 먼저');
  const f1 = o.offer[1].form, e0 = M.egg, a1 = MZ.awaken(M, 1), w = MZ.view(M);
  ok(a1.ok && a1.form === f1 && a1.step === 1 && M.body.form === f1 && w.awakened === 1 && w.core.form === f1 && w.core.step === 1 && w.core.max === MZ.MK.coreMax + 1 && M.egg === Math.min(M.eggMax, e0 + MZ.MK.awaken.egg), '1단계: 모습, 본체 방 자리, 알');
  ok(Object.values(M.unit).some(u => u.kind === MZ.FORMS[f1].gift), '깨어날 때 그 성향 신도 하나');
  M.gold = 50; const g0 = M.gold; ok(MZ.setUse(M, C(2, 2), 'kin', MZ.FORMS[f1].room).ok && M.gold === g0, '모습의 방 종류는 값이 없다');
  // 상점: 그 성향 몫
  let hit = 0, tot = 0; for (let k = 0; k < 200; k++) { M.gold = 99; MZ.reroll(M); M.shop.forEach(id => { tot++; if (L.KIN[id].asp === MZ.FORMS[f1].asp) hit++; }); }
  ok(hit / tot > 0.4, '상점에 그 성향이 많이 나온다 ' + Math.round(100 * hit / tot) + '%');
  M.egg = M.eggMax = 99; rd(M); const r2 = rd(M); ok((M.awaken && M.awaken.step === 2 && M.awaken.offer[0] === f1 && MZ.view(M).awaken.offer[0].keep && !MZ.view(M).awaken.offer[1].keep), '침입 3 뒤: 2단계, 첫째는 지금 모습');
  if (M.awaken) {
    const K = clone(M), X = clone(M); MZ.awaken(K, 0); MZ.awaken(X, 1); const bk = MZ.bodyOf(K), bx = MZ.bodyOf(X);
    ok(bk.step === 2 && bk.t2 && bk.lv === MZ.MK.awaken.lv[2] && bk.lv === 3 && !bk.mixed && bk.kin.length >= 1 && bx.mixed && bx.prev === f1 && !bx.t2 && bx.lv === MZ.MK.awaken.lv[1] && bx.slots <= bk.slots && bx.share.length === 2, '그대로 키우면 강하게, 갈아타면 섞인 몸');
    const rk = rd(K), cf = rk.steps.find(x => x.type === 'fight' && x.core); ok(!cf || cf.fight.units.find(u => u.kind === 'core').name === L.FORM[bk.form].name, '본체 방 싸움의 본체가 그 모습');
  }
  // 갈래의 몫: 둥지에 많은 성향이 나오기 쉽고, 하나는 늘 적은 성향
  let seen = 0, low = 0; for (let s2 = 1; s2 <= 20; s2++) { const Q = MZ.newRun(100 + s2); for (let k = 0; k < 4; k++) give(Q, 'shell', 1); MZ.raid(Q); if (!Q.awaken) continue; if (Q.awaken.offer.includes('abyss')) seen++; if (Q.awaken.offer[2] !== 'abyss') low++; }
  ok(seen >= 17 && low === 20, '심연 권속이 많으면 심연이 나온다 ' + seen + '/20, 셋째는 다른 것');
  // 이야기: 장 2 끝과 장 4 끝
  const S = MZ.newStory(22); S.chapter = 2; S.raids = 3; S.raid = 3; S.level = 6; for (let k = 0; k < 2; k++) { const u = give(S, 'heap', 3); MZ.move(S, u, { cell: C(1, 2) }); }
  const sr = MZ.raid(S); if (S.phase === 'chapterEnd') { ok(S.awaken && S.awaken.step === 1 && MZ.nextChapter(S).msg === '깨어남을 먼저 고른다', '이야기 장 2 끝에 깨어남'); MZ.awaken(S, 0); ok(MZ.nextChapter(S).ok && S.chapter === 3 && S.body.step === 1, '깨어난 몸은 다음 장으로 이어진다'); }
  const Z = MZ.newStory(23); Z.chapter = 6; Z.raids = 3; Z.raid = 3; ok(MZ.view(Z).core.step === 3 && MZ.view(Z).core.realStep === 0, '장 6 마지막 침입 앞: 그림은 3단계');
}
// 16. 끝없는 자유 · 오늘의 판
{
  const M = MZ.newRun(41), d5 = MZ.raidOf(M, 5), d6 = MZ.raidOf(M, 6), d10 = MZ.raidOf(M, 10), d2 = MZ.raidOf(M, 2), d20 = MZ.raidOf(M, 20);
  const tot = D => D.units.reduce((a, k) => a + L.INV[k].hp, 0) * D.scale.hp;
  ok(d5.boss && d10.boss && !d5.units.includes('seeker') && d5.units.includes('paladin') && d10.units.includes('seeker') && MZ.raidOf(M, 20).units.includes('seekerm') && !d6.boss && d20.units.length > d6.units.length && tot(d20) > tot(d10), '침입 n: 5마다 우두머리 (10마다 책을 쫓는 자), 갈수록 세지고 머릿수가 는다');
  let smooth = true; for (let k = 6; k <= 24; k++) { const a = MZ.raidOf(M, k - 1), b = MZ.raidOf(M, k); if (!a.boss && !b.boss && Math.abs(tot(b) - tot(a)) > MZ.MK.endless.hpStep * 1.01) smooth = false; } ok(smooth, '무리 전체의 체력은 곡선을 따른다 (튀지 않는다)');
  ok(MZ.raidOf(M, 8).name === '교회의 무리' && MZ.raidOf(M, 12).name === '조사자들' && JSON.stringify(MZ.raidOf(M, 9)) === JSON.stringify(MZ.raidOf(clone(M), 9)), '고비에 새 무리, 같은 판이면 같은 무리');
  const H = clone(M); H.raid = 13; ok(MZ.dugCap(H) > MZ.MK.dugCap[3] && MZ.view(H).maxLv > MZ.MK.maxLv, '판 칸·레벨 상한이 오른다');
  // 알이 깨질 때까지 간다, 점수
  const P = MZ.newRun(42); P.level = 6; [C(1, 2), C(3, 2)].forEach((c, i) => { MZ.setUse(P, c, 'kin'); give(P, ['shell', 'maw'][i], 3, c); give(P, 'famine', 3, c); });
  let n = 0; while (P.phase === 'prep' && n < 60) { rd(P); n++; }
  ok(P.phase === 'over' && P.egg <= 0 && P.over.score && P.over.score.raids === P.raid - 1 && P.over.score.raids >= 1 && P.over.score.total === P.over.score.raids * 10000 + P.over.score.egg * 100 + P.over.score.kills && P.score.kills > 0, '알이 깨지면 끝, 점수 ' + P.over.score.raids);
  const V = MZ.view(P); ok(V.score.raids === P.over.score.raids && V.over.score.total === V.score.total, '점수 보기');
  // 저장·불러오기
  const S = MZ.newRun(43); rd(S); const L1 = MZ.load(MZ.save(S)); ok(L1 && L1.endless && L1.score.raids === S.score.raids && JSON.stringify(MZ.view(L1)) === JSON.stringify(MZ.view(S)), '저장·불러오기: 끝없는 판');
  // 오늘의 판
  const A = MZ.newDaily('2026-11-23'), B = MZ.newDaily('2026-11-23'), D = MZ.newDaily('2026-11-24');
  ok(A.daily === '2026-11-23' && MZ.view(A).daily === '2026-11-23' && A.seed === B.seed && A.seed !== D.seed && A.shop.join() === B.shop.join() && A.endless, '오늘의 판: 같은 날 같은 씨앗·상점');
  const play = X => { const out = []; for (let k = 0; k < 4 && X.phase === 'prep'; k++) { if (X.awaken) MZ.awaken(X, 1); X.gold += 0; const r = MZ.raid(X); out.push(JSON.stringify([r.result, X.shop, X.awaken && X.awaken.offer])); } return out.join('|'); };
  ok(play(A) === play(B), '오늘의 판: 같은 선택이면 같은 결과'); ok(MZ.newDaily('nope').daily === new Date().toISOString().slice(0, 10), '날짜가 틀리면 오늘');
  ok(JSON.stringify(MZ.newDaily('2026-11-23').shop) !== JSON.stringify(MZ.newDaily('2026-11-25').shop) || MZ.newDaily('2026-11-23').seed !== MZ.newDaily('2026-11-25').seed, '다른 날은 다른 판');
}
// 17. 굴 나누기 (글자 코드) · 들이치기
{
  const M = MZ.newRun(51); M.gold = 99; M.level = 6; [C(2, 3), C(3, 3), C(4, 3), C(2, 1)].forEach(c => MZ.dig(M, c)); MZ.setUse(M, C(2, 2), 'kin', 'bone'); MZ.setUse(M, C(3, 3), 'trap', 'tr_whisper'); MZ.setUse(M, C(2, 1), 'trap', 'tr_maw');
  give(M, 'maw', 2, C(2, 2)); give(M, 'shell', 3, C(2, 2)); give(M, 'gazer', 1, 'core'); M.body = { form: 'abyss', step: 2, prev: null }; M.score.raids = 7;
  const code = MZ.exportNest(M), im = MZ.importNest(code);
  ok(/^NEST1-[0-9A-Za-z]+$/.test(code) && code.length <= 120, '코드: 영숫자, 120자 안 (' + code.length + '자)');
  ok(im.ok && im.nest.level === 6 && im.nest.raids === 7 && im.nest.body.form === 'abyss' && im.nest.body.step === 2 && im.nest.grid.every((g, i) => g.dug === M.grid[i].dug && g.use === M.grid[i].use && (g.room || null) === (M.grid[i].room || null) && (g.trap || null) === (M.grid[i].trap || null)) && im.nest.units.length === 3 && im.nest.units.some(u => u.cell === 'core' && u.kind === 'gazer') && im.nest.units.some(u => u.cell === C(2, 2) && u.kind === 'shell' && u.star === 3), '코드 왕복: 내보낸 굴 = 가져온 굴');
  ok(MZ.exportNest(MZ.newAttack(code, 1)) === code, '받은 굴을 다시 내보내도 같은 코드');
  const flip = code.slice(0, 12) + (code[12] === 'a' ? 'b' : 'a') + code.slice(13);
  ok(!MZ.importNest(flip).ok && MZ.importNest(flip).msg === '깨진 코드다' && MZ.importNest('NEST1-abc!').msg === '코드에 쓸 수 없는 글자가 있다' && MZ.importNest('hello').msg === '굴 코드가 아니다' && !MZ.importNest(code.slice(0, -2)).ok && !MZ.importNest(code + 'x').ok && MZ.newAttack(flip, 1) === null, '고친 코드·깨진 코드는 거부');
  // 들이치기
  const A = MZ.newAttack(code, 9), v = MZ.view(A);
  ok(A.mode === 'attack' && v.attack.budget === MZ.MK.attack.budget + Math.min(MZ.MK.attack.bonusMax, Math.floor(7 / MZ.MK.attack.perRaids)) && v.attack.gold === v.attack.budget && v.roster.length === MZ.ROSTER.length && v.roster.every(r => r.cost >= 1 && r.cost <= 6 && r.name) && v.roster.some(r => r.scout) && v.roster.some(r => r.breaker), '들이치기: 진액과 명단');
  ok(MZ.dig(A, C(1, 1)).msg === '받은 굴은 고칠 수 없다' && MZ.setUse(A, C(2, 2), 'path').msg === '받은 굴은 고칠 수 없다' && MZ.buy(A, 0).msg === '받은 굴은 고칠 수 없다', '받은 굴은 고칠 수 없다');
  ok(MZ.attack(A).msg === '일행이 없다', '일행 없이는 못 들이친다');
  ['tracker', 'paladin', 'militia', 'hound', 'torch'].forEach(k => MZ.hire(A, k)); ok(A.attack.party.length === 5 && MZ.hire(A, 'militia').msg === '일행이 찼다' && MZ.unhire(A, 4).ok && A.attack.party.length === 4, '고용과 내보내기, 다섯까지');
  const tot = A.attack.party.reduce((a, k) => a + MZ.ROSTER.find(r => r[0] === k)[1], 0), g0 = A.attack.gold; A.attack.gold = 2; ok(g0 === A.attack.budget - tot && MZ.hire(A, 'c_tov').msg === '진액이 모자란다', '진액이 모자라면 못 데려간다'); A.attack.gold = g0;
  const B = JSON.parse(JSON.stringify(A)), r1 = MZ.attack(A), r2 = MZ.attack(B);
  ok(r1.ok && JSON.stringify(r1.result) === JSON.stringify(r2.result) && JSON.stringify(r1.steps.map(x => x.type)) === JSON.stringify(r2.steps.map(x => x.type)), '같은 코드·같은 일행·같은 씨앗이면 같은 결과');
  ok(r1.steps.every(x => ['walk', 'trap', 'fight', 'egg', 'warp', 'break'].includes(x.type)) && r1.result.eggDmg >= 0 && r1.result.eggDmg <= 15 && r1.result.score === r1.result.eggDmg * 100 + Math.max(0, 99 - r1.result.walked) && A.egg === A.eggMax, '결과: 알을 깎은 양, 알은 다시 찬다');
  MZ.attack(A); const r3 = MZ.attack(A); ok(r3.ok && A.attack.tries === 3 && MZ.attack(A).msg === '더 해 볼 수 없다' && MZ.hire(A, 'militia').msg !== undefined && A.attack.best.score === Math.max(...A.attack.results.map(x => x.score)), '세 번까지, 가장 좋은 것이 기록');
  const t = MZ.attackResultText(A); ok(/^받은 굴 들이치기 · 알 \d+\/15 깎음 · 일행 \d\n3번 가운데 가장 좋은 것 · 걸은 칸 \d+/.test(t) && MZ.view(A).attack.text === t, '결과 글');
  const S = MZ.load(MZ.save(A)); ok(S && S.mode === 'attack' && JSON.stringify(MZ.view(S).attack) === JSON.stringify(MZ.view(A).attack), '저장·불러오기: 들이치기');
}
// 18. 이어 짓는 이야기 굴, 다시 하기, 본체의 사거리
{
  const M = MZ.newStory(61); M.chapter = 2; M.raids = 3; M.raid = 3; M.level = 6; M.gold = 99; [C(2, 3), C(3, 3), C(4, 3)].forEach(c => MZ.dig(M, c)); MZ.setUse(M, C(2, 2), 'kin', 'bone');
  for (let k = 0; k < 4; k++) { const u = give(M, 'heap', 3); MZ.move(M, u, { cell: C(2, 2) }); } give(M, 'shell', 2, 'core'); M.egg = 99; M.eggMax = 99;
  const r = MZ.raid(M); if (M.awaken) MZ.awaken(M, 0);
  if (M.phase === 'chapterEnd') {
    const before = JSON.stringify([M.grid, M.board, M.bench, M.level]); ok(MZ.nextChapter(M).ok && JSON.stringify([M.grid, M.board, M.bench, M.level]) === before && M.chapter === 3, '장 2 → 3: 굴이 이어진다');
    const snap0 = JSON.stringify([M.grid, M.board, M.bench, M.level, M.gold]); MZ.dig(M, C(5, 3)); MZ.setUse(M, C(3, 3), 'trap', 'tr_teeth'); Object.keys(M.board).forEach(c => M.board[c].slice().forEach(uid => MZ.move(M, uid, { bench: null }))); M.egg = 1; M.raid = M.raids; const hm = MZ.MK.story.hpMul; MZ.MK.story.hpMul = 30; const rr = MZ.raid(M); MZ.MK.story.hpMul = hm;
    ok(rr.ok && M.phase === 'over' && M.over.retry && MZ.retryChapter(M).ok && JSON.stringify([M.grid, M.board, M.bench, M.level, M.gold]) === snap0 && M.chapter === 3 && M.raid === 1, '다시 하기: 그 장을 시작할 때의 굴로');
  } else ok(false, '장 2 가 끝나지 않았다 ' + M.phase);
  // 본체: 판 전체를 덮는 사거리, 한 방울도 스킬을 쓴다
  const F = MZ.newRun(62); F.level = 6; const rf = MZ.raid(F), cf = rf.steps.find(x => x.type === 'fight' && x.core), core = cf && cf.fight.units.find(u => u.kind === 'core');
  ok(core && core.range >= 4 && cf.fight.timeline.some(e => e.type === 'skillfx' && e.u === core.id && e.sk === MZ.MK.coreFight.dropSkill), '본체 방: 사거리 4 이상, 깨어나기 전에도 스킬 ' + (core && core.range));
}
console.log(bad ? '실패 ' + bad : '굴 짓기 규칙: 모두 맞음'); process.exitCode = bad ? 1 : 0;
