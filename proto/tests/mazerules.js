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
  ok(v.cols === 5 && v.rows === 8 && v.grid.length === 40 && v.coreCell === C(6, 2) && v.eggCell === C(7, 2) && v.entrance.cell === C(0, 2) && v.entrance.r === -1, '지도');
  ok([0, 1, 2, 3, 4, 5].every(r => v.grid[C(r, 2)].dug && v.grid[C(r, 2)].use === 'path') && v.grid[C(6, 2)].use === 'core' && v.grid[C(7, 2)].use === 'egg' && v.grid.filter(g => g.dug).length === 8, '처음에는 곧은 굴');
  ok(v.raid === 1 && v.raids === 4 && v.egg.hp === MZ.MK.egg && v.gold === MZ.MK.gold && v.cap === MZ.MK.level && v.shop.length === 5 && v.bench.length === 6 && v.next.name === MZ.RAIDS[0].name && v.next.party.length === 4 && v.next.path.join() === [2, 7, 12, 17, 22, 27, 32, 37].join(), '새 판의 보기');
  ok(v.grid.every(g => 'r' in g && 'c' in g && 'dug' in g && 'use' in g && 'room' in g && 'trap' in g && Array.isArray(g.units) && 'canDig' in g && 'digCost' in g && 'canFill' in g && 'fillGold' in g), '칸마다의 보기');
  ok(v.rooms.length === 8 && v.traps.length === 4 && v.traps.every(t => t.name && t.short && t.short.length <= 16 && t.more), '방과 함정 보기');
}
// 2. 파기와 메우기: 길은 늘 이어진다
{
  const M = MZ.newRun(8); M.gold = 99;
  ok(!MZ.fill(M, C(1, 2)).ok && !MZ.fill(M, C(6, 2)).ok && !MZ.fill(M, C(0, 2)).ok, '곧은 굴의 칸과 본체 방·입구는 메울 수 없다');
  ok(!MZ.dig(M, C(7, 1)).ok && !MZ.dig(M, C(4, 0)).ok && !MZ.dig(M, C(1, 2)).ok, '알의 줄, 떨어진 칸, 판 칸은 팔 수 없다');
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
  ok(MZ.setUse(M, C(2, 2), 'kin', 'bone').ok && M.grid[C(2, 2)].room === 'bone' && M.gold === 99 - MZ.MK.roomCost, '권속 방 + 방 종류'); ok(!MZ.setUse(M, C(2, 2), 'kin', 'nope').ok && !MZ.setUse(M, C(6, 2), 'path').ok && !MZ.setUse(M, C(1, 1), 'kin').ok, '없는 방, 고정 칸, 안 판 칸');
  const u = give(M, 'shell', 1); ok(MZ.move(M, u, { cell: C(2, 2) }).ok && M.board[C(2, 2)].includes(u), '방에 세운다');
  ok(!MZ.move(M, u, { cell: C(1, 2) }).ok, '통로에는 못 세운다');
  ok(MZ.setUse(M, C(2, 2), 'trap', 'tr_teeth').ok && !M.board[C(2, 2)] && M.bench.includes(u) && M.grid[C(2, 2)].trap === 'tr_teeth', '함정으로 바꾸면 권속은 대기석으로');
  ok(!MZ.setUse(M, C(3, 2), 'trap', 'nope').ok && MZ.setUse(M, C(3, 2), 'path').ok, '없는 함정');
  MZ.setUse(M, C(4, 2), 'kin'); for (let k = 0; k < 3; k++) { const x = give(M, 'biter'); MZ.move(M, x, { cell: C(4, 2) }); } ok(M.board[C(4, 2)].length === MZ.MK.roomMax, '방에는 셋까지');
  const y = give(M, 'gnaw'); ok(!MZ.move(M, y, { cell: C(4, 2) }).ok, '찬 방에는 못 세운다');
  M.level = 3; ok(!MZ.move(M, y, { cell: C(6, 2) }).ok, '세울 수 있는 수는 레벨만큼');
  const Q = MZ.newRun(11); const a = give(Q, 'shell'), b = give(Q, 'heap'), c = give(Q, 'maw'); Q.level = 6; ok(MZ.move(Q, a, { cell: C(6, 2) }).ok && MZ.move(Q, b, { cell: C(6, 2) }).ok && !MZ.move(Q, c, { cell: C(6, 2) }).ok, '본체 방에는 둘까지');
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
  const B = MZ.newRun(15); B.gold = 99; B.raid = 4; const SN = [C(0, 3), C(0, 4), C(1, 4), C(2, 4), C(2, 3), C(2, 2), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(4, 1), C(4, 2), C(4, 3), C(4, 4), C(5, 4), C(6, 4), C(6, 3)];
  B.grid.forEach((g, i) => { if (g.use === 'path' && i !== MZ.ENT) Object.assign(g, { dug: false, use: null }); }); SN.forEach(c => Object.assign(B.grid[c], { dug: true, use: 'path' })); ok(MZ.connected(B, c => B.grid[c].dug), '뱀 굴');
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
  ok(w.every(s => typeof s.san === 'number' && Array.isArray(s.mad)) && w.reduce((a, s) => a + s.san, 0) === (cells - 1) * MZ.MK.darkSan, '걷는 구간마다 깎인 정신이 실린다');
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
  ok(MZ.load('{') === null && MZ.load(JSON.stringify(Object.assign({}, A, { v: 0 }))) === null && MZ.V === A.v, '못 읽는 저장');
  ok(JSON.stringify(MZ.raid(play(42))) !== JSON.stringify(ra), '씨앗이 다르면 다르다');
}
// 10. 실패의 글은 담백하게
{
  const M = MZ.newRun(50), errs = [MZ.dig(M, 0), MZ.fill(M, 7), MZ.setUse(M, 0, 'trap', 'x'), MZ.buy(M, 9), MZ.sell(M, 99), MZ.move(M, 99, { cell: 7 })];
  ok(errs.every(e => !e.ok && typeof e.msg === 'string' && e.msg.length > 0 && e.msg.length <= 20 && !/!|\?/.test(e.msg)), '실패의 글');
}
console.log(bad ? '실패 ' + bad : '굴 짓기 규칙: 모두 맞음'); process.exitCode = bad ? 1 : 0;
