// 굴 짓기 자동 플레이어: 균형을 재는 데 쓴다.
//   node src/mazebot.js [판 수] [전략...]   전략: straight (파지 않고 권속만) maze (길게 판다) mixed (적당히) random, 그리고 mixed 에 성향을 더한 abyss nebula brood dusk hunger
//   환경: V=1 판마다 한 줄, MSET='{"hpMul":0.9}' 로 MAZE.MK 를 바꿔 보기
const MZ = require('./maze.js'), L = require('./lair.js');
if (process.env.MSET) Object.assign(MZ.MK, JSON.parse(process.env.MSET));
const C = (r, c) => MZ.idx(r, c);
function mk(seed) { const S = { s: seed | 0 }; return () => L.rnd(S); }
// 지도의 꼴: 이 칸들을 판 칸으로 두고, 나머지 곧은 굴은 메운다 (순서대로 판다)
const SNAKE = [C(0, 3), C(0, 4), C(1, 4), C(2, 4), C(2, 3), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(4, 1), C(4, 3), C(4, 4), C(5, 4), C(6, 4), C(6, 3)];
const SNAKE_KEEP = [C(0, 2), C(2, 2), C(4, 2)].concat(SNAKE);
const BEND = [C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(4, 1)];
const BEND_KEEP = [C(0, 2), C(1, 2), C(2, 2), C(4, 2), C(5, 2)].concat(BEND);
const STRAT = {
  straight: { per: 3, core: 2 },
  maze: { dig: SNAKE, keep: SNAKE_KEEP, per: 1, core: 1 },
  mixed: { dig: BEND, keep: BEND_KEEP, per: 2, core: 1, traps: 2, roomType: true },
  random: { random: true },
  abyss: { dig: BEND, keep: BEND_KEEP, per: 2, core: 1, traps: 2, roomType: true, focus: 'abyss' }, nebula: { dig: BEND, keep: BEND_KEEP, per: 2, core: 1, traps: 2, roomType: true, focus: 'nebula' },
  brood: { dig: BEND, keep: BEND_KEEP, per: 2, core: 1, traps: 2, roomType: true, focus: 'brood' }, dusk: { dig: BEND, keep: BEND_KEEP, per: 2, core: 1, traps: 2, roomType: true, focus: 'dusk' },
  hunger: { dig: BEND, keep: BEND_KEEP, per: 2, core: 1, traps: 2, roomType: true, focus: 'hunger' },
};
const owned = M => Object.keys(M.unit).map(id => M.unit[id]);
const count = (M, kind, star) => owned(M).filter(u => u.kind === kind && u.star === (star || 1)).length;
const SV = [0, 1, 1.9, 3.6], val = (u, st) => (1 + 0.8 * L.KIN[u.kind].cost) * SV[u.star] * (st.focus && L.KIN[u.kind].asp === st.focus ? 1.3 : 1);
function focusOf(M, st) { if (st.focus) return st.focus; const c = {}; owned(M).forEach(u => { const a = L.KIN[u.kind].asp; c[a] = (c[a] || 0) + u.star * L.KIN[u.kind].cost; }); let b = null, bn = 0; for (const a in c) if (c[a] > bn) { bn = c[a]; b = a; } return b; }
function score(M, kind, st) { const d = L.KIN[kind], n = count(M, kind, 1), fo = focusOf(M, st); let s = 1 + 0.6 * d.cost; if (n === 2) s += 3; else if (n === 1) s += 1.2; if (fo && d.asp === fo) s += st.focus ? 3 : 1; else if (st.focus) s -= 0.6; return s; }
// 굴을 판다: 꼴의 칸을 순서대로, 그리고 꼴 밖의 곧은 굴을 메운다
function build(M, st, keepGold) {
  if (!st.dig) return;
  for (const c of st.dig) { if (M.gold - MZ.digCost(c) < keepGold) break; if (!M.grid[c].dug) MZ.dig(M, c); }
  for (let k = 0; k < 3; k++) for (let c = 0; c < MZ.N; c++) if (M.grid[c].dug && !st.keep.includes(c) && c !== MZ.CORE && c !== MZ.EGG && !(M.board[c] || []).length) MZ.fill(M, c);
}
function shop(M, st, rng, keep) {
  for (let guard = 0; guard < 40; guard++) {
    const total = owned(M).length, cap = M.level; let best = -1, bs = 0;
    M.shop.forEach((k, i) => { if (!k || L.KIN[k].cost > M.gold - keep) return; const s = score(M, k, st); if (s > bs) { bs = s; best = i; } });
    const need = total < cap ? 0.5 : total < cap + 2 ? 2.2 : 3.5;
    if (best >= 0 && bs >= need) { if (!MZ.buy(M, best).ok) break; continue; }
    if (M.raid >= 2 && total >= cap && M.level < MZ.MK.maxLv && M.gold - MZ.MK.xpCost >= keep) { MZ.buyXp(M); continue; }
    if (M.gold - MZ.MK.reroll >= keep + 2 && M.raid < 4) { MZ.reroll(M); continue; }
    break;
  }
}
// 방을 정하고 권속을 세운다: 길 위의 칸을 고르게 나누어 권속 방으로, 같은 성향끼리 한 방에
const ROOMFOR = { abyss: 'pool', nebula: 'eye', brood: 'spore', dusk: 'eye', hunger: 'shade' };
function arrange(M, st, rng) {
  Object.keys(M.board).forEach(c => { M.board[c].slice().forEach(uid => MZ.move(M, uid, { bench: null })); });
  const us = owned(M).sort((a, b) => val(b, st) - val(a, st) || a.uid - b.uid).slice(0, M.level), P = MZ.pathOf(M, M.raid);
  const coreN = Math.min(st.core || 0, us.length), coreUs = us.slice(0, coreN), rest = us.slice(coreN);
  const nRooms = Math.ceil(rest.length / (st.per || 2)), mids = P.cells.filter(c => c !== MZ.ENT && c !== MZ.CORE && c !== MZ.EGG && M.grid[c].use !== 'trap');
  const rooms = []; for (let k = 0; k < nRooms && mids.length; k++) rooms.push(mids[Math.min(mids.length - 1, Math.floor((k + 0.5) * mids.length / nRooms))]);
  // 쓰지 않는 권속 방은 통로로 돌린다
  for (let c = 0; c < MZ.N; c++) if (M.grid[c].use === 'kin' && !rooms.includes(c)) MZ.setUse(M, c, 'path');
  rest.sort((a, b) => L.KIN[a.kind].asp.localeCompare(L.KIN[b.kind].asp) || val(b, st) - val(a, st));
  rooms.forEach((c, k) => {
    const grp = rest.slice(k * (st.per || 2), (k + 1) * (st.per || 2)), asp = grp.length ? L.KIN[grp[0].kind].asp : null, want = st.roomType && asp ? (grp.some(u => L.KIN[u.kind].role === 'tank') ? 'bone' : ROOMFOR[asp]) : null;
    MZ.setUse(M, c, 'kin', want && M.grid[c].room !== want && M.gold >= MZ.MK.roomCost + 2 ? want : undefined);
    grp.forEach(u => MZ.move(M, u.uid, { cell: c }));
  });
  coreUs.forEach(u => MZ.move(M, u.uid, { cell: MZ.CORE }));
  // 대기석이 차면 짝 없는 값싼 것부터 판다
  while (M.bench.filter(x => x != null).length > 4) { const b = M.bench.filter(x => x != null).map(id => M.unit[id]).sort((a, b2) => count(M, a.kind, a.star) - count(M, b2.kind, b2.star) || val(a, st) - val(b2, st))[0]; MZ.sell(M, b.uid); }
}
function traps(M, st) {
  if (!st.traps) return; const P = MZ.pathOf(M, M.raid), free = P.cells.filter(c => c !== MZ.ENT && M.grid[c].use === 'path' && c !== MZ.CORE && c !== MZ.EGG);
  let have = M.grid.filter(g => g.use === 'trap').length; const ids = ['tr_whisper', 'tr_teeth', 'tr_spore', 'tr_slime'];
  for (const c of free) { if (have >= st.traps || M.gold < MZ.MK.trapCost + 3) break; if (MZ.setUse(M, c, 'trap', ids[have % ids.length]).ok) have++; }
}
function randomTurn(M, rng) {
  for (let k = 0; k < 20; k++) {
    const x = rng(), c = Math.floor(rng() * MZ.N);
    if (x < 0.2) MZ.dig(M, c); else if (x < 0.3) MZ.fill(M, c); else if (x < 0.45) MZ.setUse(M, c, ['path', 'kin', 'trap'][Math.floor(rng() * 3)], rng() < 0.5 ? L.ROOM_IDS[Math.floor(rng() * 8)] : MZ.TRAP_IDS[Math.floor(rng() * 4)]);
    else if (x < 0.75) MZ.buy(M, Math.floor(rng() * 5)); else if (x < 0.8) MZ.reroll(M);
    else { const us = owned(M); if (us.length) { const u = us[Math.floor(rng() * us.length)], ks = M.grid.map((g, i) => i).filter(i => M.grid[i].use === 'kin' || M.grid[i].use === 'core'); if (ks.length) MZ.move(M, u.uid, { cell: ks[Math.floor(rng() * ks.length)] }); } }
  }
}
function playRun(seed, name) {
  const st = STRAT[name], rng = mk(seed * 31 + 7), M = MZ.newRun(seed), log = [];
  while (M.phase === 'prep') {
    if (st.random) randomTurn(M, rng);
    else { build(M, st, M.raid === 1 ? 6 : 4); traps(M, st); shop(M, st, rng, 0); arrange(M, st, rng); }
    const P = MZ.pathOf(M, M.raid), base = MZ.pathOf(M, ['militia']), r = MZ.raid(M), fs = r.steps.filter(s => s.type === 'fight');
    log.push({ raid: r.result && M.hist[M.hist.length - 1].raid, win: r.result.win, eggLost: r.result.eggLost, len: P.len, avoided: P.avoided, broke: P.breaks.length > 0, changed: P.cells.join() !== base.cells.join(), fights: fs.length, times: fs.map(f => f.fight.time), traps: r.steps.filter(s => s.type === 'trap').length, mads: r.result.mads, kinds: Object.keys(M.board).reduce((a, c) => a.concat(M.board[c].map(id => M.unit[id] && M.unit[id].kind)), []) });
  }
  return { M, log };
}
const pc = (a, b) => (b ? Math.round(100 * a / b) : '-');
function report(name, n) {
  const o = { n, win: 0, perfect: 0, egg: 0, rw: [0, 0, 0, 0], rn: [0, 0, 0, 0], ft: [], sum: [], len: [0, 0, 0, 0], avoid: [0, 0, 0, 0], brk: [0, 0, 0, 0], chg: [0, 0, 0, 0], traps: 0, mads: 0 };
  for (let s = 1; s <= n; s++) {
    const { M, log } = playRun(s * 7919 + 13, name); if (M.over && M.over.win) o.win++; if (log.length === 4 && log.every(f => f.win)) o.perfect++; o.egg += M.egg;
    log.forEach((f, i) => { o.rn[i]++; if (f.win) o.rw[i]++; o.len[i] += f.len; if (f.avoided) o.avoid[i]++; if (f.broke) o.brk[i]++; if (f.changed) o.chg[i]++; f.times.forEach(t => o.ft.push(t)); o.sum.push(f.times.reduce((a, b) => a + b, 0)); o.traps += f.traps; o.mads += f.mads; });
    if (process.env.V) console.log(s, M.over.win ? '승' : '패', 'egg' + M.egg, log.map(f => (f.win ? 'o' : 'x') + f.len + '/' + f.fights + '/' + Math.round(f.times.reduce((a, b) => a + b, 0))).join(' '));
  }
  const avg = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-'), q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(p * (b.length - 1))].toFixed(0) : '-'; };
  console.log(`${name.padEnd(8)} 알이 버팀 ${pc(o.win, n)}% | 넷 다 막음 ${pc(o.perfect, n)}% | 남은 알 ${(o.egg / n).toFixed(1)} | 침입마다 막음 ${o.rw.map((w, i) => pc(w, o.rn[i])).join('/')}% | 길 ${o.len.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(1) : '-')).join('/')}`);
  console.log(`         한 방 싸움 ${avg(o.ft)}초 (10%~90% ${q(o.ft, 0.1)}~${q(o.ft, 0.9)}) | 한 침입의 싸움 합 ${avg(o.sum)}초 (${q(o.sum, 0.1)}~${q(o.sum, 0.9)}) | 함정 ${(o.traps / Math.max(1, o.rn.reduce((a, b) => a + b, 0))).toFixed(1)}/침입 | 미친 자 ${(o.mads / Math.max(1, o.rn.reduce((a, b) => a + b, 0))).toFixed(1)}/침입 | 길이 바뀜(돌아감/부숨) ${o.chg.map((x, i) => pc(x, o.rn[i])).join('/')}% (${o.avoid.map((x, i) => pc(x, o.rn[i])).join('/')} / ${o.brk.map((x, i) => pc(x, o.rn[i])).join('/')})`);
  return o;
}
if (require.main === module) { const n = +(process.argv[2] || 100), names = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(STRAT); names.forEach(nm => report(nm, n)); }
module.exports = { playRun, report, STRAT, build, shop, arrange, traps };
