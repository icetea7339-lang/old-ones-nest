// 둥지 전투 자동 플레이어: 균형을 재는 데 쓴다.
//   node src/lairbot.js [판 수] [전략...]      전략: decent random blob abyss nebula brood dusk hunger
//   환경: V=1 판마다 한 줄, KSET='{"roundHp":[2.2,1.2,1.05],"roundAtk":[1.3,1.7,1.6]}' 로 수치 바꿔 보기
const L = require('./lair.js');
if (process.env.KSET) Object.assign(L.K, JSON.parse(process.env.KSET));
const FRONT = [20, 21, 19, 22, 18, 23], MID = [26, 27, 25, 28, 24, 29], BACK = [31, 34, 30, 35];
const FRONT_ROOMS = ['pool', 'spore', 'eye', 'bone', 'digest', 'nursery', 'shade'];
function mk(seed) { const S = { s: seed | 0 }; return () => L.rnd(S); }
const owned = R => Object.keys(R.unit).map(id => R.unit[id]);
const count = (R, kind, star) => owned(R).filter(u => u.kind === kind && u.star === (star || 1)).length;
function focusOf(R, st) { if (L.ASPN[st.focus]) return st.focus; const c = {}; owned(R).forEach(u => { const a = L.KIN[u.kind].asp; c[a] = (c[a] || 0) + u.star * L.KIN[u.kind].cost; }); let b = null, bn = 0; for (const a in c) if (c[a] > bn) { bn = c[a]; b = a; } return b; }
function score(R, kind, st) {
  const d = L.KIN[kind], n = count(R, kind, 1), fo = focusOf(R, st); let s = 1 + 0.6 * d.cost;
  if (n === 2) s += 3; else if (n === 1) s += 1.2;
  if (fo && d.asp === fo) s += st.focus ? 3 : 1;
  else if (st.focus) s -= 0.6;
  const cls = owned(R).filter(u => L.KIN[u.kind].cls === d.cls && u.kind !== kind).map(u => u.kind); if (new Set(cls).size === 1 && n === 0) s += 0.5;
  if (st.only && !st.only.includes(kind)) s = -9;
  return s;
}
function shopping(R, st, rng) {
  if (st.random) { for (let k = 0; k < 12; k++) { const i = Math.floor(rng() * 5); if (R.shop[i]) L.buy(R, i); if (rng() < 0.15) L.reroll(R); } return; }
  const last = R.round >= R.rounds;
  for (let guard = 0; guard < 30; guard++) {
    const total = owned(R).length, capN = L.cap(R); let best = -1, bs = 0;
    R.shop.forEach((k, i) => { if (!k || L.KIN[k].cost > R.gold) return; const s = score(R, k, st); if (s > bs) { bs = s; best = i; } });
    const need = total < capN ? 0.5 : total < capN + 2 ? 2.2 : 3.5;
    if (best >= 0 && bs >= need) { if (!L.buy(R, best).ok) break; continue; }
    if (!st.noxp && R.round >= 2 && total > capN && R.level < L.K.maxLv && R.gold >= L.K.xpCost + (last ? 0 : 2)) { L.buyXp(R); continue; }
    const keep = last ? 0 : 2; if (R.gold >= L.K.reroll + keep + 1) { L.reroll(R); continue; }
    break;
  }
}
function pickRoom(R, st, rng) {
  const v = L.view(R); if (!v.roomOffer.length) return;
  if (st.random) { const o = v.roomOffer[Math.floor(rng() * v.roomOffer.length)]; if (o.spots.length) L.placeRoom(R, o.i, o.spots[Math.floor(rng() * o.spots.length)]); return; }
  if (st.noroom) return;
  const us = owned(R), n = f => us.filter(f).length, K = L.KIN;
  const val = { bone: 1.5 + n(u => K[u.kind].cls === 'guard'), altar: 0.5 + 1.2 * n(u => K[u.kind].cls === 'caller'), pool: 1.6 + 0.8 * n(u => K[u.kind].asp === 'abyss'), spore: 2 + 0.6 * n(u => K[u.kind].asp === 'brood'), eye: 1.2 + 0.9 * n(u => K[u.kind].asp === 'nebula' || K[u.kind].asp === 'dusk'), digest: 1.4, nursery: 1.3 + 0.5 * n(u => K[u.kind].range === 1), shade: 0.3 + 1.1 * n(u => K[u.kind].cls === 'hunter') };
  const o = v.roomOffer.slice().sort((a, b) => val[b.id] - val[a.id])[0]; if (!o.spots.length) return;
  const want = o.id === 'altar' ? MID : FRONT, sc = c => { const cs = L.roomCells(o.id, c); return cs.reduce((a, x) => a + (want.indexOf(x) >= 0 ? 6 - want.indexOf(x) : -2), 0); };
  L.placeRoom(R, o.i, o.spots.slice().sort((a, b) => sc(b) - sc(a))[0]);
}
function arrange(R, st, rng) {
  const us = owned(R).slice().sort((a, b) => b.star * 10 + L.KIN[b.kind].cost - (a.star * 10 + L.KIN[a.kind].cost)), capN = L.cap(R);
  // 전부 대기석으로 내렸다가 다시 올린다
  Object.keys(R.board).forEach(c => { const id = R.board[c], b = R.bench.indexOf(null); if (b >= 0) L.move(R, id, { bench: b }); });
  const onBoard = () => Object.keys(R.board).length, free = c => !R.board[c];
  if (st.random) { const cells = FRONT.concat(MID, BACK); us.forEach(u => { if (onBoard() >= capN || !L.whereOf(R, u.uid)) return; const fs = cells.filter(free); if (fs.length) L.move(R, u.uid, { cell: fs[Math.floor(rng() * fs.length)] }); }); return; }
  const roomCellsOf = id => { const r = R.rooms.find(x => x.id === id); return r ? r.cells : []; };
  for (const u of us) {
    if (onBoard() >= capN) break; if (!L.whereOf(R, u.uid) || L.whereOf(R, u.uid).cell != null) continue;
    const d = L.KIN[u.kind]; let pref = [];
    if (d.cls === 'caller') pref = roomCellsOf('altar'); else if (d.cls === 'hunter') pref = roomCellsOf('shade'); if (d.cls === 'guard') pref = pref.concat(roomCellsOf('bone')); if (d.asp === 'abyss') pref = pref.concat(roomCellsOf('pool')); if (d.range === 1) pref = pref.concat(roomCellsOf('nursery'));
    const order = pref.concat(d.range >= 3 ? MID.concat(BACK, FRONT) : d.range === 2 ? MID.concat(FRONT, BACK) : d.cls === 'guard' ? FRONT.concat(MID, BACK) : [19, 22, 18, 23, 20, 21].concat(MID, BACK));
    const c = order.find(free); if (c != null) L.move(R, u.uid, { cell: c });
  }
  if (R.round >= R.rounds) return;
  // 대기석이 차면 가장 값싼 짝 없는 것부터 판다
  while (R.bench.filter(x => x).length > 5) { const b = R.bench.filter(x => x).map(id => R.unit[id]).sort((a, b2) => count(R, a.kind, a.star) - count(R, b2.kind, b2.star) || L.sellValue(a) - L.sellValue(b2))[0]; L.sell(R, b.uid); }
}
const STRAT = { decent: {}, random: { random: true }, blob: { only: ['biter', 'gnaw', 'shell'], noroom: true, noxp: true }, abyss: { focus: 'abyss' }, nebula: { focus: 'nebula' }, brood: { focus: 'brood' }, dusk: { focus: 'dusk' }, hunger: { focus: 'hunger' } };
function playRun(seed, name) {
  const st = STRAT[name], rng = mk(seed * 31 + 7), R = L.newRun(seed), log = [];
  while (R.phase === 'prep') {
    shopping(R, st, rng); pickRoom(R, st, rng); arrange(R, st, rng);
    if (!st.random && R.round >= R.rounds) { shopping(R, st, rng); arrange(R, st, rng); }
    const kinds = Object.keys(R.board).map(c => R.unit[R.board[c]]), round = R.round, r = L.ready(R);
    log.push({ round, win: r.win, time: r.fight.time, conv: r.fight.converted, kinds: kinds.map(u => u.kind), stars: kinds.map(u => u.star), bd: r.fight.breakdown, core: r.fight.coreHp / r.fight.coreMhp });
  }
  return { R, log };
}
function report(name, n) {
  const o = { win: 0, rw: [0, 0, 0], rn: [0, 0, 0], time: [0, 0, 0], conv: [0, 0, 0], pick: {}, pwin: {}, casts: {}, stars: 0, units: 0, tmin: 99, tmax: 0 };
  for (let s = 1; s <= n; s++) {
    const { R, log } = playRun(s * 7919 + 13, name); if (R.over && R.over.win) o.win++;
    log.forEach(f => { const i = f.round - 1; o.rn[i]++; if (f.win) o.rw[i]++; o.time[i] += f.time; o.conv[i] += f.conv; o.tmin = Math.min(o.tmin, f.time); o.tmax = Math.max(o.tmax, f.time);
      [...new Set(f.kinds)].forEach(k => { o.pick[k] = (o.pick[k] || 0) + 1; if (f.win) o.pwin[k] = (o.pwin[k] || 0) + 1; }); f.stars.forEach(x => { o.stars += x; o.units++; });
      f.bd.forEach(b => { if (b.casts) o.casts[b.kind] = (o.casts[b.kind] || 0) + b.casts; }); });
    if (process.env.V) console.log(s, R.over.win ? '승' : '패', log.map(f => (f.win ? 'o' : 'x') + f.time + 's/' + f.conv + ' [' + f.kinds.map((k, j) => k + f.stars[j]).join(',') + ']').join(' | '));
  }
  const pc = (a, b) => (b ? Math.round(100 * a / b) : 0);
  console.log(`${name.padEnd(7)} 판 승률 ${pc(o.win, n)}% | 라운드 승 ${o.rw.map((w, i) => pc(w, o.rn[i])).join('/')}% | 싸움 길이 ${o.time.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(0) : '-')).join('/')}초 (${o.tmin}~${o.tmax}) | 미친 적 ${o.conv.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(1) : '-')).join('/')} | 평균 별 ${(o.stars / Math.max(1, o.units)).toFixed(2)}`);
  return o;
}
if (require.main === module) {
  const n = +(process.argv[2] || 200), names = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(STRAT), all = { pick: {}, pwin: {}, casts: {}, fights: 0 };
  names.forEach(nm => { const o = report(nm, n); if (nm !== 'random' && nm !== 'blob') { for (const k in o.pick) { all.pick[k] = (all.pick[k] || 0) + o.pick[k]; all.pwin[k] = (all.pwin[k] || 0) + (o.pwin[k] || 0); } all.fights += o.rn.reduce((a, b) => a + b, 0); } for (const k in o.casts) all.casts[k] = (all.casts[k] || 0) + o.casts[k]; });
  console.log('권속: 나온 싸움 비율 / 그 싸움 승률  ' + L.KIN_IDS.map(k => `${L.KIN[k].name} ${Math.round(100 * (all.pick[k] || 0) / Math.max(1, all.fights))}%/${all.pick[k] ? Math.round(100 * all.pwin[k] / all.pick[k]) : 0}%`).join(' · '));
  console.log('스킬 쓴 횟수  ' + Object.keys(all.casts).sort((a, b) => all.casts[b] - all.casts[a]).map(k => ((L.KIN[k] || L.INV[k] || { name: k }).name) + ' ' + all.casts[k]).join(' · '));
}
module.exports = { playRun, report, STRAT, shopping, arrange, pickRoom };
