// 굴 짓기 자동 플레이어: 균형을 재는 데 쓴다.
//   node src/mazebot.js [판 수] [전략...]   전략: straight (파지 않고 권속만) maze (길게 판다) mixed (적당히) random, 그리고 mixed 에 성향을 더한 abyss nebula brood dusk hunger
//   node src/mazebot.js story [판 수] [전략:밤의성향...]   이야기 모드 (성향: raid sly skip any), RETRY=2 면 알이 깨진 장을 두 번까지 다시
//   환경: V=1 판마다 한 줄, MSET='{"hpMul":0.9}' 로 MAZE.MK 를 바꿔 보기
const MZ = require('./maze.js'), L = require('./lair.js');
if (process.env.MSET) Object.assign(MZ.MK, JSON.parse(process.env.MSET));
// TSET='{"tr_teeth":{"hp":0.25}}' 로 함정 수치를, SSET='{"mixed":{"traps":4}}' 로 전략을 바꿔 보기
if (process.env.TSET) { const t = JSON.parse(process.env.TSET); for (const k in t) Object.assign(MZ.TRAP[k], t[k]); }
const C = (r, c) => MZ.idx(r, c);
function mk(seed) { const S = { s: seed | 0 }; return () => L.rnd(S); }
// 지도의 꼴: dig 의 칸을 순서대로 파고, keep 밖의 판 칸은 메운다.
//   DEAD1 (적당히): 가운데 굴을 4행에서 끊어 막다른 굴로 두고, 오른쪽으로 돌아 출구 위 칸(6행 가운데)으로 간다
//   DEAD2 (미로): 2행에서 오른쪽으로 돌고, 가운데 막다른 굴 + 두 번째 침입부터 왼쪽 막다른 굴, 위로 난 오른쪽 막다른 굴을 더한다
const MID = [C(0, 2), C(1, 2), C(2, 2), C(3, 2), C(4, 2), C(6, 2)];
const DEAD1 = [C(3, 3), C(3, 4), C(4, 4), C(5, 4), C(6, 4), C(6, 3)], DEAD1_KEEP = MID.concat(DEAD1);
const DEAD2 = [C(2, 3), C(2, 4), C(3, 4), C(4, 4), C(5, 4), C(6, 4), C(6, 3), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(1, 4), C(0, 4)], DEAD2_KEEP = MID.concat(DEAD2);
// 미로 봇의 미로 함정: 두 막다른 곳 끝에 미끼 불빛, 왼쪽 막다른 굴에 삼키는 구멍, 오른쪽 갈림길 앞에 헛갈림 벽 (위로 난 막다른 굴로 보낸다). 막다른 굴에는 보통 함정을 두지 않는다 (도적이 들어오게)
const MAZE_TRAPS = [[C(4, 2), 'tr_lure'], [C(4, 0), 'tr_lure'], [C(3, 0), 'tr_maw'], [C(2, 3), 'tr_mirror']], DEAD_ENDS = [C(3, 2), C(4, 2), C(2, 1), C(2, 0), C(3, 0), C(4, 0), C(1, 4), C(0, 4)];
// 추적자 먼저: 입구 바로 아래 외길 칸에 속삭이는 벽 (추적자도 피할 수 없다) + 미로 함정
const SF_TRAPS = [[C(1, 2), 'tr_whisper']].concat(MAZE_TRAPS);
const MIX = { dig: DEAD1, keep: DEAD1_KEEP, per: 1, core: 1, traps: 9, roomType: true };
const STRAT = {
  straight: { per: 3, core: 2 },
  mixed: MIX,
  maze: { dig: DEAD2, keep: DEAD2_KEEP, per: 1, core: 2, traps: 9, roomType: true, twice: true, plan: MAZE_TRAPS, roomAt: [C(3, 2), C(2, 1), C(2, 0)], noTrap: DEAD_ENDS },
  // 길잡이 먼저: 미로와 같은 굴. 입구 바로 아래 외길의 속삭이는 벽으로 추적자를 먼저 흔들고, 침입 3 에는 코어의 권속 하나를 빼어 셋을 입구 쪽 방에 세운다
  scoutfirst: { dig: DEAD2, keep: DEAD2_KEEP, per: 1, core: 2, traps: 9, roomType: true, twice: true, plan: SF_TRAPS, roomAt: [C(3, 2), C(2, 1), C(2, 0)], noTrap: DEAD_ENDS, front: [3], frontCore: 1, frontN: 3 },
  random: { random: true },
  abyss: Object.assign({}, MIX, { focus: 'abyss' }), nebula: Object.assign({}, MIX, { focus: 'nebula' }), brood: Object.assign({}, MIX, { focus: 'brood' }), dusk: Object.assign({}, MIX, { focus: 'dusk' }), hunger: Object.assign({}, MIX, { focus: 'hunger' }),
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
  for (let k = 0; k < 3; k++) for (let c = 0; c < MZ.N; c++) if (M.grid[c].dug && !st.keep.includes(c) && c !== MZ.EXIT && !(M.board[c] || []).length) MZ.fill(M, c);
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
  const per = st.per || 2, front = st.front && P.scout && (st.front === true || st.front.includes(M.raid)), fN = front ? st.frontN || per : per;
  const coreN = Math.min(front && st.frontCore != null ? st.frontCore : st.core || 0, us.length), coreUs = us.slice(0, coreN), rest = us.slice(coreN);
  const nRooms = rest.length ? 1 + Math.ceil(Math.max(0, rest.length - fN) / per) : 0, okc = c => c !== MZ.ENT && c !== MZ.EXIT && M.grid[c].use !== 'trap' && !(st.plan || []).some(x => x[0] === c), pass = {};
  P.cells.forEach(c => { if (okc(c)) pass[c] = (pass[c] || 0) + 1; });
  const byPass = Object.keys(pass).map(Number).sort((a, b) => pass[b] - pass[a] || P.cells.indexOf(a) - P.cells.indexOf(b)), rooms = [];
  if (front && nRooms) { const f = P.scoutPath.find(c => okc(c)); if (f != null) rooms.push(f); }
  // 먼저 쓸 방 자리 (roomAt: 막다른 굴의 통로 등). 길잡이가 오는 침입에는 쓰지 않는다 (지름길로 오므로)
  if (!P.scout) for (const c of st.roomAt || []) { if (rooms.length >= nRooms) break; if (M.grid[c].dug && okc(c) && !rooms.includes(c)) rooms.push(c); }
  // 길 위에 고르게 (twice 면 여러 번 지나는 칸부터)
  const even = [...new Set(P.cells)].filter(okc); if (st.twice) for (const c of byPass) { if (rooms.length >= nRooms) break; if (pass[c] > 1 && !rooms.includes(c)) rooms.push(c); }
  for (let k = 0; rooms.length < nRooms && k < even.length; k++) { const c = st.tail ? even[even.length - 1 - k] : even[Math.min(even.length - 1, Math.floor((k + 0.5) * even.length / Math.max(1, nRooms)))]; if (!rooms.includes(c)) rooms.push(c); }
  // 쓰지 않는 권속 방은 통로로 돌린다
  for (let c = 0; c < MZ.N; c++) if (M.grid[c].use === 'kin' && !rooms.includes(c)) MZ.setUse(M, c, 'path');
  // 길잡이 먼저: 입구 쪽 방에는 뒷줄에 닿는 것 (뛰어드는 사냥꾼, 멀리 쏘는 것)을 먼저
  const reach = u => { const d = L.KIN[u.kind]; return (d.cls === 'hunter' ? 2 : 0) + (d.range >= 3 ? 1.5 : 0) + val(u, st) / 10; };
  rest.sort((a, b) => (front ? reach(b) - reach(a) : 0) || L.KIN[a.kind].asp.localeCompare(L.KIN[b.kind].asp) || val(b, st) - val(a, st));
  rooms.forEach((c, k) => {
    const lo = k ? fN + (k - 1) * per : 0, grp = rest.slice(lo, k ? lo + per : fN), asp = grp.length ? L.KIN[grp[0].kind].asp : null, want = st.roomType && asp ? (grp.some(u => L.KIN[u.kind].role === 'tank') ? 'bone' : ROOMFOR[asp]) : null;
    MZ.setUse(M, c, 'kin', want && M.grid[c].room !== want && M.gold >= MZ.MK.roomCost + 2 ? want : undefined);
    grp.forEach(u => MZ.move(M, u.uid, { cell: c }));
  });
  coreUs.forEach(u => MZ.move(M, u.uid, { core: true }));
  // 대기석이 차면 짝 없는 값싼 것부터 판다
  while (M.bench.filter(x => x != null).length > 4) { const b = M.bench.filter(x => x != null).map(id => M.unit[id]).sort((a, b2) => count(M, a.kind, a.star) - count(M, b2.kind, b2.star) || val(a, st) - val(b2, st))[0]; MZ.sell(M, b.uid); }
}
function traps(M, st) {
  if (!st.traps) return;
  // 정해 둔 미로 함정 자리 (plan: [[칸, 함정], ...]) 부터: 판 통로이고 권속이 없을 때
  for (const [c, id] of st.plan || []) { const g = M.grid[c]; if (!g.dug || g.use !== 'path' || (M.board[c] || []).length || M.gold < (MZ.TRAP[id].cost || MZ.MK.trapCost) + 1) continue; MZ.setUse(M, c, 'trap', id); }
  const P = MZ.pathOf(M, M.raid), free = [...new Set(P.cells)].filter(c => c !== MZ.ENT && c !== MZ.EXIT && M.grid[c].use === 'path' && !(st.noTrap || []).includes(c));
  let have = M.grid.filter((g, i) => g.use === 'trap' && !(st.plan || []).some(x => x[0] === i)).length; const ids = ['tr_whisper', 'tr_teeth', 'tr_spore', 'tr_slime'];
  const lim = st.traps + (st.trapGrow || 0) * (M.raid - 1);
  for (const c of free) { if (have >= lim || M.gold < MZ.MK.trapCost) break; if (MZ.setUse(M, c, 'trap', ids[have % ids.length]).ok) have++; }
}
function randomTurn(M, rng) {
  for (let k = 0; k < 20; k++) {
    const x = rng(), c = Math.floor(rng() * MZ.N);
    if (x < 0.2) MZ.dig(M, c); else if (x < 0.3) MZ.fill(M, c); else if (x < 0.45) MZ.setUse(M, c, ['path', 'kin', 'trap'][Math.floor(rng() * 3)], rng() < 0.5 ? L.ROOM_IDS[Math.floor(rng() * 8)] : MZ.TRAP_IDS[Math.floor(rng() * 4)]);
    else if (x < 0.75) MZ.buy(M, Math.floor(rng() * 5)); else if (x < 0.8) MZ.reroll(M);
    else { const us = owned(M); if (us.length) { const u = us[Math.floor(rng() * us.length)], ks = M.grid.map((g, i) => i).filter(i => M.grid[i].dug).concat([MZ.CORE]); if (ks.length) MZ.move(M, u.uid, { cell: ks[Math.floor(rng() * ks.length)] }); } }
  }
}
function playRun(seed, name) {
  const st = STRAT[name], rng = mk(seed * 31 + 7), M = MZ.newRun(seed), log = [];
  while (M.phase === 'prep') {
    if (st.random) randomTurn(M, rng);
    else { build(M, st, st.digKeep != null ? st.digKeep : M.raid === 1 ? 6 : 4); shop(M, st, rng, st.traps ? st.trapGold || 4 : 0); arrange(M, st, rng); traps(M, st); }
    const P = MZ.pathOf(M, M.raid), base = MZ.pathOf(M, ['militia']), r = MZ.raid(M), fs = r.steps.filter(s => s.type === 'fight');
    log.push({ raid: r.result && M.hist[M.hist.length - 1].raid, win: r.result.win, eggLost: r.result.eggLost, len: r.result.walked, lostScout: r.result.lost, avoided: P.avoided, broke: P.breaks.length > 0, changed: P.cells.join() !== base.cells.join(), fights: fs.length, times: fs.map(f => f.fight.time), traps: r.steps.filter(s => s.type === 'trap').length, mads: r.result.mads, kinds: Object.keys(M.board).reduce((a, c) => a.concat(M.board[c].map(id => M.unit[id] && M.unit[id].kind)), []) });
  }
  return { M, log };
}
const pc = (a, b) => (b ? Math.round(100 * a / b) : '-');
function report(name, n) {
  const o = { n, win: 0, perfect: 0, egg: 0, rw: [0, 0, 0, 0], rn: [0, 0, 0, 0], ft: [], sum: [], len: [0, 0, 0, 0], nf: [0, 0, 0, 0], lostScout: [0, 0, 0, 0], avoid: [0, 0, 0, 0], brk: [0, 0, 0, 0], chg: [0, 0, 0, 0], traps: 0, mads: 0 };
  for (let s = 1; s <= n; s++) {
    const { M, log } = playRun(s * 7919 + 13, name); if (M.over && M.over.win) o.win++; if (log.length === 4 && log.every(f => f.win)) o.perfect++; o.egg += M.egg;
    log.forEach((f, i) => { o.rn[i]++; if (f.win) o.rw[i]++; o.len[i] += f.len; o.nf[i] += f.fights; if (f.lostScout) o.lostScout[i]++; if (f.avoided) o.avoid[i]++; if (f.broke) o.brk[i]++; if (f.changed) o.chg[i]++; f.times.forEach(t => o.ft.push(t)); o.sum.push(f.times.reduce((a, b) => a + b, 0)); o.traps += f.traps; o.mads += f.mads; });
    if (process.env.V) console.log(s, M.over.win ? '승' : '패', 'egg' + M.egg, log.map(f => (f.win ? 'o' : 'x') + f.len + '/' + f.fights + '/' + Math.round(f.times.reduce((a, b) => a + b, 0))).join(' '));
  }
  const avg = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-'), q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(p * (b.length - 1))].toFixed(0) : '-'; };
  console.log(`${name.padEnd(8)} 알이 버팀 ${pc(o.win, n)}% | 넷 다 막음 ${pc(o.perfect, n)}% | 남은 알 ${(o.egg / n).toFixed(1)} | 침입마다 막음 ${o.rw.map((w, i) => pc(w, o.rn[i])).join('/')}% | 걸은 칸 ${o.len.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(1) : '-')).join('/')} | 싸움 ${o.nf.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(1) : '-')).join('/')} | 길잡이를 잃음 ${o.lostScout.map((x, i) => pc(x, o.rn[i])).join('/')}%`);
  console.log(`         한 방 싸움 ${avg(o.ft)}초 (10%~90% ${q(o.ft, 0.1)}~${q(o.ft, 0.9)}) | 한 침입의 싸움 합 ${avg(o.sum)}초 (${q(o.sum, 0.1)}~${q(o.sum, 0.9)}) | 함정 ${(o.traps / Math.max(1, o.rn.reduce((a, b) => a + b, 0))).toFixed(1)}/침입 | 미친 자 ${(o.mads / Math.max(1, o.rn.reduce((a, b) => a + b, 0))).toFixed(1)}/침입 | 길이 바뀜(돌아감/부숨) ${o.chg.map((x, i) => pc(x, o.rn[i])).join('/')}% (${o.avoid.map((x, i) => pc(x, o.rn[i])).join('/')} / ${o.brk.map((x, i) => pc(x, o.rn[i])).join('/')})`);
  return o;
}
// ───── 이야기 모드 봇 ─────
// 밤의 한 수 성향: raid (습격·사냥만), sly (속삭임·거래만), skip (고르지 않음), any (아무거나)
const NIGHT = { raid: ['raid', 'hunt'], sly: ['whisper', 'trade'], skip: [], any: ['raid', 'hunt', 'whisper', 'trade'] };
function nightTurn(M, pol, rng) {
  const v = MZ.view(M).night, acts = NIGHT[pol] || [], ok = v.offer.filter(c => acts.includes(c.act) && c.can);
  const pick = ok.length ? ok[Math.floor(rng() * ok.length)].i : -1; return MZ.nightPick(M, pick);
}
// retry: 알이 깨지면 그 장을 몇 번까지 다시 하나
function playStory(seed, name, pol, retry) {
  const st = STRAT[name], rng = mk(seed * 37 + 11), M = MZ.newStory(seed), log = []; let tries = 0;
  for (let guard = 0; guard < 400; guard++) {
    if (M.phase === 'over') { if (M.over.retry && tries < (retry || 0)) { tries++; MZ.retryChapter(M); continue; } break; }
    if (M.phase === 'chapterEnd') { MZ.nextChapter(M); continue; }
    if (M.night) { nightTurn(M, pol, rng); continue; }
    if (st.random) randomTurn(M, rng); else { build(M, st, st.digKeep != null ? st.digKeep : M.raid === 1 ? 6 : 4); shop(M, st, rng, st.traps ? st.trapGold || 4 : 0); arrange(M, st, rng); traps(M, st); }
    const ch = M.chapter, r = MZ.raid(M); if (!r.ok) break; log.push({ ch, id: r.raidId, win: r.result.win, egg: M.egg, len: r.result.walked });
  }
  return { M, log, tries, end: M.phase === 'over' && (M.over.win || M.over.chapter === 6), ending: M.phase === 'over' ? M.over.ending : null };
}
function reportStory(name, pol, n, retry) {
  const o = { end: 0, reach: [0, 0, 0, 0, 0, 0, 0], ends: { A: 0, B: 0, C: 0, D: 0, E: 0 }, broke: { A: 0, B: 0, C: 0 }, eggs: 0, alert: 0, win: {}, rn: {}, len: [0, 0, 0, 0, 0, 0, 0], ln: [0, 0, 0, 0, 0, 0, 0], tries: 0 };
  for (let s = 1; s <= n; s++) {
    const r = playStory(s * 7919 + 13, name, pol, retry); if (r.end) o.end++; if (r.ending) o.ends[r.ending]++; if (r.end) { const X = JSON.parse(JSON.stringify(r.M)); X.egg = 0; o.broke[MZ.endingOf(X)]++; } o.tries += r.tries; o.alert += r.M.alert;
    for (let c = 0; c <= 6; c++) if (r.M.chapter >= c || r.end) o.reach[c]++;
    r.log.forEach(f => { o.rn[f.ch] = (o.rn[f.ch] || 0) + 1; if (f.win) o.win[f.ch] = (o.win[f.ch] || 0) + 1; o.len[f.ch] += f.len; o.ln[f.ch]++; });
  }
  const ends = Object.keys(o.ends).map(k => k + pc(o.ends[k], n)).join(' ') + ' (알이 깨졌다면 ' + Object.keys(o.broke).map(k => k + pc(o.broke[k], o.end)).join(' ') + ')';
  console.log(`${(name + ':' + pol).padEnd(16)} 끝까지 ${pc(o.end, n)}% | 결말 ${ends} | 장마다 막음 ${[0, 1, 2, 3, 4, 5, 6].map(c => pc(o.win[c] || 0, o.rn[c] || 0)).join('/')}% | 걸은 칸 ${[1, 2, 3, 4, 5, 6].map(c => (o.ln[c] ? (o.len[c] / o.ln[c]).toFixed(0) : '-')).join('/')} | 다시 ${(o.tries / n).toFixed(1)} | 경계 ${(o.alert / n).toFixed(1)} | 장을 넘김 ${[0, 1, 2, 3, 4, 5].map(c => pc(o.reach[c + 1], n)).join('/')}/${pc(o.end, n)}%`);
  return o;
}
if (process.env.SSET) { const t = JSON.parse(process.env.SSET); for (const k in t) Object.assign(STRAT[k], t[k]); }
if (require.main === module && process.argv[2] === 'story') { const n = +(process.argv[3] || 100), retry = +(process.env.RETRY || 0); (process.argv.slice(4).length ? process.argv.slice(4) : ['mixed:any']).forEach(x => { const [a, b] = x.split(':'); reportStory(a, b || 'any', n, retry); }); }
else if (require.main === module) { const n = +(process.argv[2] || 100), names = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(STRAT); names.forEach(nm => report(nm, n)); }
module.exports = { playRun, report, playStory, reportStory, STRAT, build, shop, arrange, traps };
