// 둥지 전투 자동 플레이어: 균형을 재는 데 쓴다.
//   node src/lairbot.js [판 수] [전략...]      온전한 판 (3막 x 5라운드). 전략: decent random abyss nebula brood dusk hunger noecon greedy noelite allelite goldpick roompick
//   TASTE=1 node src/lairbot.js [판 수] [전략...]  맛보기 판 (3라운드). 전략: decent random blob abyss nebula brood dusk hunger
//   환경: V=1 판마다 한 줄, CARDS=1 신화마다의 표, SOFF=1000 씨앗 밀기, KSET='{"roundHp":[2.2,1.2,1.05]}' 로 K 를, FSET='{"life":24}' 로 K.full 을 바꿔 보기
const L = require('./lair.js');
if (process.env.KSET) Object.assign(L.K, JSON.parse(process.env.KSET));
if (process.env.FSET) Object.assign(L.K.full, JSON.parse(process.env.FSET));
// NOPRICE=1 신화의 대가를 없애고, NOPOWER=1 권능을 없애고 돌려 본다 (대가와 권능이 실제로 무게가 있는지 보려고)
if (process.env.NOPRICE) L.MYTHOS_IDS.forEach(id => { L.MYTHOS[id].pr = {}; });
if (process.env.NOPOWER) L.MYTHOS_IDS.forEach(id => { L.MYTHOS[id].pw = {}; });
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
function playTaste(seed, name) {
  const st = STRAT[name], rng = mk(seed * 31 + 7), R = L.newRun(seed, { taste: true }), log = [];
  while (R.phase === 'prep') {
    shopping(R, st, rng); pickRoom(R, st, rng); arrange(R, st, rng);
    if (!st.random && R.round >= R.rounds) { shopping(R, st, rng); arrange(R, st, rng); }
    const kinds = Object.keys(R.board).map(c => R.unit[R.board[c]]), round = R.round, r = L.ready(R);
    log.push({ round, win: r.win, time: r.fight.time, conv: r.fight.converted, kinds: kinds.map(u => u.kind), stars: kinds.map(u => u.star), bd: r.fight.breakdown, core: r.fight.coreHp / r.fight.coreMhp });
  }
  return { R, log };
}
// ───────── 온전한 판 ─────────
//   decent 는 정예를 가려 받는다: 다른 씨앗으로 정예 싸움을 두 번 미리 돌려 보아 둘 다 이기고, 목숨이 6 이상일 때만
//   noecon: 이자도 레벨도 안 챙긴다 (들어오는 대로 다 쓴다). greedy: 진액 50 을 깔고 간다. noelite/allelite: 정예를 안 고른다/늘 고른다. goldpick/roompick: 라운드 사이에 진액/방을 먼저 고른다
const FSTRAT = { decent: {}, random: { random: true }, abyss: { focus: 'abyss' }, nebula: { focus: 'nebula' }, brood: { focus: 'brood' }, dusk: { focus: 'dusk' }, hunger: { focus: 'hunger' },
  noecon: { noecon: true, noxp: true }, greedy: { floor: 50 }, noelite: { elite: 'never' }, allelite: { elite: 'always' }, goldpick: { pick: 'gold' }, roompick: { pick: 'room' },
  // 조우: encpick 늘 조우를 고른다, encskip 안 고른다, encsafe 판정 없는 갈래만, enctest 판정 있는 갈래만
  encpick: { pick: 'encounter' }, encskip: { enc: 'skip' }, encsafe: { enc: 'safe' }, enctest: { enc: 'test' } };
const SOFF = +(process.env.SOFF || 0);
const LVT = [3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8], SV = [0, 1, 1.9, 3.6];
const valOf = (R, u, st) => (1 + 0.8 * L.KIN[u.kind].cost) * SV[u.star] * (st.focus && L.KIN[u.kind].asp === st.focus ? 1.25 : 1);
function scoreF(R, kind, st) {
  const d = L.KIN[kind], n1 = count(R, kind, 1), n2 = count(R, kind, 2), fo = focusOf(R, st); let s = 1 + 0.7 * d.cost;
  if (n1 === 2) s += 3; else if (n1 === 1) s += 1.2;
  if (n2 >= 1) s += 0.5;
  if (fo && d.asp === fo) s += st.focus ? 3 : 1;
  else if (st.focus) s -= 0.6;
  return s;
}
function floorOf(R, st) {
  if (st.noecon || st.random) return 0;
  if (R.act === 3 && R.rin >= 4) return 0;
  if (st.floor != null) return st.floor;
  if (R.hp <= 6 || R.round <= 2) return 0;
  if (R.rin >= 5) return 10;
  return R.act === 1 ? 10 : 20;
}
const benchUnits = R => R.bench.filter(x => x).map(id => R.unit[id]);
function sellWorst(R, st) { const b = benchUnits(R).sort((a, b2) => count(R, a.kind, a.star) - count(R, b2.kind, b2.star) || valOf(R, a, st) - valOf(R, b2, st))[0]; return !!b && L.sell(R, b.uid).ok; }
function shopFull(R, st, rng) {
  if (st.random) { for (let k = 0; k < 14; k++) { const i = Math.floor(rng() * 5); if (R.shop[i]) L.buy(R, i); if (rng() < 0.15) L.reroll(R); if (rng() < 0.06) L.buyXp(R); } return; }
  const fl = floorOf(R, st), maxLv = L.K.full.maxLv;
  for (let guard = 0; guard < 80; guard++) {
    const total = owned(R).length, capN = L.cap(R); let best = -1, bs = 0;
    R.shop.forEach((k, i) => { if (!k || L.KIN[k].cost > R.gold) return; if (R.gold - L.KIN[k].cost < fl && count(R, k, 1) < 1 && total >= capN) return; const s = scoreF(R, k, st); if (s > bs) { bs = s; best = i; } });
    const need = total < capN ? 0.5 : total < capN + 2 ? 2.2 : 3.5;
    if (best >= 0 && bs >= need) { if (!L.buy(R, best).ok && !sellWorst(R, st)) break; continue; }
    if (!st.noxp && R.level < maxLv && R.level < LVT[Math.min(14, R.round - 1)] + (R.gold >= fl + 24 ? 1 : 0) && R.gold - L.K.xpCost >= fl) { L.buyXp(R); continue; }
    if (R.freeRoll || R.gold - L.K.reroll >= fl + (st.noecon ? 0 : 2)) { L.reroll(R); continue; }
    break;
  }
}
function placeRooms(R, st, rng) {
  for (let guard = 0; guard < 6 && R.roomOffer.length; guard++) {
    const o = L.view(R).roomOffer[0]; if (!o.spots.length) break;
    if (st.random) { L.placeRoom(R, 0, o.spots[Math.floor(rng() * o.spots.length)]); continue; }
    const want = o.id === 'altar' ? MID : FRONT, sc = c => L.roomCells(o.id, c).reduce((a, x) => a + (want.indexOf(x) >= 0 ? 6 - want.indexOf(x) : -2), 0);
    L.placeRoom(R, 0, o.spots.slice().sort((a, b) => sc(b) - sc(a))[0]);
  }
}
function arrangeFull(R, st, rng) {
  const capN = L.cap(R), us = owned(R).slice().sort((a, b) => valOf(R, b, st) - valOf(R, a, st) || a.uid - b.uid);
  if (st.random) {
    Object.keys(R.board).forEach(c => { const b = R.bench.indexOf(null); if (b >= 0) L.move(R, R.board[c], { bench: b }); });
    const cells = FRONT.concat(MID, BACK); us.forEach(u => { const w = L.whereOf(R, u.uid); if (!w || w.cell != null || Object.keys(R.board).length >= capN) return; const fs = cells.filter(c => !R.board[c]); if (fs.length) L.move(R, u.uid, { cell: fs[Math.floor(rng() * fs.length)] }); });
    while (benchUnits(R).length > 5) sellWorst(R, st);
    return;
  }
  const want = us.slice(0, capN), keep = new Set(want.map(u => u.uid));
  Object.keys(R.board).forEach(c => { const id = R.board[c]; if (keep.has(id)) return; const b = R.bench.indexOf(null); if (b >= 0) L.move(R, id, { bench: b }); });
  const roomCellsOf = id => { const r = R.rooms.find(x => x.id === id); return r ? r.cells : []; }, taken = {}, target = {};
  for (const u of want) {
    const d = L.KIN[u.kind]; let pref = [];
    if (d.cls === 'caller') pref = roomCellsOf('altar'); else if (d.cls === 'hunter') pref = roomCellsOf('shade'); if (d.cls === 'guard') pref = pref.concat(roomCellsOf('bone')); if (d.asp === 'abyss' && d.range === 1) pref = pref.concat(roomCellsOf('pool')); if (d.range === 1) pref = pref.concat(roomCellsOf('nursery'));
    const order = pref.concat(d.range >= 3 ? MID.concat(BACK, FRONT) : d.range === 2 ? MID.concat(FRONT, BACK) : d.role === 'tank' ? FRONT.concat(MID, BACK) : [19, 22, 18, 23, 20, 21].concat(MID, BACK));
    const c = order.find(x => !taken[x]); if (c != null) { taken[c] = 1; target[u.uid] = c; }
  }
  for (const u of want) {
    const c = target[u.uid], w = L.whereOf(R, u.uid); if (c == null || !w || w.cell === c) continue;
    if (!L.move(R, u.uid, { cell: c }).ok) { const out = Object.keys(R.board).find(x => !keep.has(R.board[x])); if (out != null && L.move(R, u.uid, { cell: +out }).ok) L.move(R, u.uid, { cell: c }); }
  }
  if (R.act === 3 && R.rin >= 5) return;
  // 대기석: 짝이 없는 것은 넷까지만 두고 판다. 뒤로 갈수록 값싼 1성 홑것도 판다
  const lone = u => count(R, u.kind, u.star) < 2;
  while (benchUnits(R).length > 4 && benchUnits(R).some(lone)) sellWorst(R, st);
  if (R.round >= 7) benchUnits(R).filter(u => lone(u) && u.star === 1 && L.KIN[u.kind].cost <= 2 && !(st.focus && L.KIN[u.kind].asp === st.focus)).forEach(u => L.sell(R, u.uid));
}
// 라운드 사이: 방 / 진액 / 조우, 정예 뒤 (권속 / 진액 / 방), 우두머리 뒤 (방 / 권속)
function pickChoice(R, st, rng) {
  const v = L.view(R).choice, n = v.opts.length, at = t => v.opts.findIndex(o => o.type === t);
  if (st.random) { for (let k = 0; k < 12; k++) if (L.choose(R, Math.floor(rng() * n)).ok) return; }
  const few = R.rooms.length + R.roomOffer.length < 3;
  const pref = v.kind === 'reward' ? (st.pick ? [st.pick] : []).concat(st.enc === 'skip' ? ['room', 'gold'] : few ? ['room', 'encounter', 'gold'] : ['encounter', 'gold', 'room']) : ['unit', 'room', 'gold'];
  pref.map(at).filter(i => i >= 0).concat([0, 1, 2]).some(i => L.choose(R, i).ok);
}
// 신화: 단계(tier)는 셋이 같으니, 성향이 맞는 쪽 + 조금의 흔들림으로 고른다 (흔들림이 있어야 카드마다 표가 모인다)
function pickMythos(R, st, rng) {
  const fo = focusOf(R, st), fit = c => (fo && c.asp === fo ? (st.focus ? 2 : 0.8) : 0) + (st.card === c.id ? 9 : 0), val = c => fit(c) + rng() * (st.random ? 9 : 1.2);
  let offer = L.view(R).mythos.offer;
  if (R.mythos.rerollLeft > 0 && (st.random ? rng() < 0.3 : !st.card ? !offer.some(c => fo && c.asp === fo) : !offer.some(c => c.id === st.card))) { L.mythosReroll(R); offer = L.view(R).mythos.offer; }
  let best = 0, bv = -1; offer.forEach((c, i) => { const x = val(c); if (x > bv) { bv = x; best = i; } }); L.mythosPick(R, best);
}
// 조우: 얻는 것의 어림값과 성공할 확률로 고른다. 실패하면 진액이 넉넉할 때 두 번까지 다시 굴린다
// 얻는 것의 진액 환산 (어림): 경험 1, 목숨 4, 공포 −1, 권속 = 값 x 들어간 수, 방 6, 저주 −3~−6, 광신도(판 끝까지) 5, 징조·다음 싸움 광신도 1.5
const CURSEV = { watched: 6, hungry: 5, sealed: 3, debt: 4 };
const GV = g => (g.gold || 0) + (g.xp || 0) + 4 * (g.life || 0) - (g.fear || 0) + (g.unit ? g.unit[0] * Math.pow(3, g.unit[1] - 1) : 0) + 6 * (g.room || 0) - (g.curse ? CURSEV[g.curse] : 0) + 5 * (g.cult || 0) + 1.5 * (g.omen || 0) + 1.5 * (g.zeal || 0);
// 조우의 득실 표: 갈래마다 주사위 2/3/4/5 일 때의 성공 확률 (다시 굴리기 없이) 과 진액 환산 기대값 (이득이면 세 번까지 다시 굴린다고 보고).
// 표시: 늘정답 = 제 주사위가 2 여도 남의 5 보다 낫다, 버림 = 제 주사위가 5 여도 남의 2 보다 못하다, 손해 = 주사위 5 에서도 기대값이 음수
function encEV(c, n) {
  if (!c.stat) return GV(c.ok[1]) - (c.cost || 0);
  const ok = GV(c.ok[1]), no = GV(c.no[1]), base = L.K.full.rerollBase, C = (a, b) => { let r = 1; for (let i = 0; i < b; i++) r = r * (a - i) / (i + 1); return r; }, P = (m, j) => C(m, j) * Math.pow(1 / 3, j) * Math.pow(2 / 3, m - j);
  const V = (k, r) => { if (k >= c.need) return ok; let best = no; if (r < 3) { let x = -(base + r); for (let j = 0; j <= n - k; j++) x += P(n - k, j) * V(k + j, r + 1); best = Math.max(best, x); } return best; };
  let e = 0; for (let k = 0; k <= n; k++) e += P(n, k) * V(k, 0); return e;
}
function encTable() {
  const out = [], DN = [2, 3, 4, 5];
  L.ENC_IDS.forEach(id => {
    const d = L.ENC[id], ev = d.ch.map(c => DN.map(n => encEV(c, n)));
    d.ch.forEach((c, i) => { const oth = d.ch.map((x, j) => j).filter(j => j !== i), flag = oth.every(j => ev[i][0] > ev[j][3] + 0.5) ? '늘정답' : oth.some(j => ev[j][0] >= ev[i][3] + 0.5) ? '버림' : ev[i][3] < 0 ? '손해' : '';
      out.push({ id, title: d.title, label: c.label, test: c.stat ? L.STAT[c.stat] + ' ' + c.need : c.cost ? '진액 ' + c.cost : '-', p: c.stat ? DN.map(n => Math.round(100 * pOk(n, c.need))) : null, ok: GV(c.ok[1]) - (c.cost || 0), no: c.no ? GV(c.no[1]) : null, ev: ev[i].map(x => Math.round(x * 10) / 10), flag }); });
  });
  return out;
}
function pOk(n, need) { let p = 0; const C = (a, b) => { let r = 1; for (let i = 0; i < b; i++) r = r * (a - i) / (i + 1); return r; }; for (let k = need; k <= n; k++) p += C(n, k) * Math.pow(1 / 3, k) * Math.pow(2 / 3, n - k); return p; }
function playEncounter(R, st, rng) {
  const v = L.view(R).encounter, d = L.ENC[v.id]; let best = v.choices[0].id, bv = -99;
  v.choices.forEach((c, i) => { if (!c.can) return; const x = d.ch[i], p = c.test ? pOk(c.test.dice, c.test.need) : 1, ev = st.random ? rng() : st.enc === 'safe' ? (c.test ? -50 + p : 0) : st.enc === 'test' ? (c.test ? p : -1) : encEV(x, c.test ? c.test.dice : 0); if (ev > bv) { bv = ev; best = c.id; } });
  let r = L.encounterChoose(R, best);
  for (let k = 0; k < 2 && r.ok && r.canReroll && !st.random && !st.noecon && R.gold >= r.rerollCost + 10; k++) r = L.encounterReroll(R);
  return L.encounterResolve(R);
}
// 정예를 받을 만한 판인가: 다른 씨앗으로 정예 싸움을 두 번 미리 돌려 보아 둘 다 이길 때만 (사람이 무리를 보고 가늠하는 것을 흉내 낸다. 실제 싸움의 씨앗은 쓰지 않는다)
function eliteLooksGood(R) {
  if (!R.alt || !L.setElite(R, true).ok) return false;
  let ok = true; for (let k = 1; k <= 2 && ok; k++) ok = L.simulate(L.setupOf(R, (R.seed + 7717 * k + R.round * 131) | 0)).result === 'win';
  L.setElite(R, false); return ok;
}
function playFull(seed, name) {
  const st = FSTRAT[name] || { card: name.replace(/^card:/, '') }, rng = mk(seed * 31 + 7), R = L.newRun(seed), log = []; let strong = false;
  for (let guard = 0; guard < 300 && R.phase !== 'over'; guard++) {
    if (R.phase === 'choice') { pickChoice(R, st, rng); continue; }
    if (R.phase === 'mythos') { pickMythos(R, st, rng); continue; }
    if (R.phase === 'encounter') { playEncounter(R, st, rng); continue; }
    placeRooms(R, st, rng); shopFull(R, st, rng); arrangeFull(R, st, rng);
    if (R.alt) L.setElite(R, st.random ? rng() < 0.5 : st.elite === 'always' ? true : st.elite === 'never' ? false : R.hp >= 6 && eliteLooksGood(R));
    const kinds = Object.keys(R.board).map(c => R.unit[R.board[c]]), r = L.ready(R);
    strong = r.win && r.fight.lostKin <= 1 && r.fight.coreHp >= r.fight.coreMhp * 0.8;
    log.push({ round: r.round, act: r.act, rin: r.rin, boss: r.boss, elite: r.elite, win: r.win, time: r.fight.time, conv: r.fight.converted, checks: r.fight.checks, lost: r.lost, level: R.level, fear: R.fear, kinds: kinds.map(u => u.kind), stars: kinds.map(u => u.star), bd: r.fight.breakdown, core: r.fight.coreHp / r.fight.coreMhp });
  }
  return { R, log };
}
const playRun = (seed, name, opts) => (opts && opts.taste ? playTaste(seed, name) : playFull(seed, name));
const pc = (a, b) => (b ? Math.round(100 * a / b) : 0);
function report(name, n) {
  const o = { win: 0, rw: [0, 0, 0], rn: [0, 0, 0], time: [0, 0, 0], conv: [0, 0, 0], pick: {}, pwin: {}, casts: {}, stars: 0, units: 0, tmin: 99, tmax: 0 };
  for (let s = 1; s <= n; s++) {
    const { R, log } = playTaste(s * 7919 + 13, name); if (R.over && R.over.win) o.win++;
    log.forEach(f => { const i = f.round - 1; o.rn[i]++; if (f.win) o.rw[i]++; o.time[i] += f.time; o.conv[i] += f.conv; o.tmin = Math.min(o.tmin, f.time); o.tmax = Math.max(o.tmax, f.time);
      [...new Set(f.kinds)].forEach(k => { o.pick[k] = (o.pick[k] || 0) + 1; if (f.win) o.pwin[k] = (o.pwin[k] || 0) + 1; }); f.stars.forEach(x => { o.stars += x; o.units++; });
      f.bd.forEach(b => { if (b.casts) o.casts[b.kind] = (o.casts[b.kind] || 0) + b.casts; }); });
    if (process.env.V) console.log(s, R.over.win ? '승' : '패', log.map(f => (f.win ? 'o' : 'x') + f.time + 's/' + f.conv + ' [' + f.kinds.map((k, j) => k + f.stars[j]).join(',') + ']').join(' | '));
  }
  console.log(`${name.padEnd(7)} 판 승률 ${pc(o.win, n)}% | 라운드 승 ${o.rw.map((w, i) => pc(w, o.rn[i])).join('/')}% | 싸움 길이 ${o.time.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(0) : '-')).join('/')}초 (${o.tmin}~${o.tmax}) | 미친 적 ${o.conv.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(1) : '-')).join('/')} | 평균 별 ${(o.stars / Math.max(1, o.units)).toFixed(2)}`);
  return o;
}
// 온전한 판의 표: 끝까지 간 비율, 1막과 2막을 넘긴 비율, 라운드 1~15 의 승률과 싸움 길이
function reportFull(name, n, quiet) {
  const Z = () => new Array(15).fill(0), o = { n, win: 0, a1: 0, a2: 0, rw: Z(), rn: Z(), time: Z(), pick: {}, pwin: {}, casts: {}, lvl: 0, fear: 0, world: 0, checks: 0, enc: 0, hp: 0, fights: 0, elite: 0, ewin: 0, rounds: 0, stars: 0, units: 0, card: {}, cardWin: {}, tier: [0, 0, 0, 0], form: {} };
  for (let s = 1; s <= n; s++) {
    const { R, log } = playFull((s + SOFF) * 7919 + 13, name); if (R.over && R.over.win) { o.win++; o.hp += R.hp; }
    if (log.some(f => f.act === 1 && f.boss && f.win)) o.a1++; if (log.some(f => f.act === 2 && f.boss && f.win)) o.a2++;
    o.lvl += R.level; o.fear += R.fear; o.world += R.world; o.rounds += R.round; o.enc += R.encSeen.length; o.form[R.form] = (o.form[R.form] || 0) + 1;
    R.mythos.picked.forEach(id => { o.card[id] = (o.card[id] || 0) + 1; if (R.over && R.over.win) o.cardWin[id] = (o.cardWin[id] || 0) + 1; o.tier[L.MYTHOS[id].tier]++; });
    log.forEach(f => { const i = f.round - 1; o.rn[i]++; o.fights++; o.checks += f.checks; if (f.win) o.rw[i]++; o.time[i] += f.time; if (f.elite) { o.elite++; if (f.win) o.ewin++; }
      [...new Set(f.kinds)].forEach(k => { o.pick[k] = (o.pick[k] || 0) + 1; if (f.win) o.pwin[k] = (o.pwin[k] || 0) + 1; }); f.stars.forEach(x => { o.stars += x; o.units++; });
      f.bd.forEach(b => { if (b.casts) o.casts[b.kind] = (o.casts[b.kind] || 0) + b.casts; }); });
    if (process.env.V) console.log(s, R.over.win ? '승' : '패', 'hp' + R.hp, 'lv' + R.level, R.form + R.awake, 'f' + R.fear, log.map(f => (f.boss ? 'B' : f.elite ? 'E' : '') + (f.win ? 'o' : 'x') + Math.round(f.time)).join(' '), '[' + log[log.length - 1].kinds.map((k, j) => k + log[log.length - 1].stars[j]).join(',') + ']', R.mythos.picked.join(','));
  }
  if (!quiet) {
    console.log(`${name.padEnd(8)} 끝까지 ${pc(o.win, n)}% | 1막 ${pc(o.a1, n)}% | 2막 ${pc(o.a2, n)}% | 끝난 라운드 ${(o.rounds / n).toFixed(1)} | 레벨 ${(o.lvl / n).toFixed(1)} | 공포 ${(o.fear / n).toFixed(1)} (세상 ${(o.world / n).toFixed(1)}) | 조우 ${(o.enc / n).toFixed(1)} | 판정 ${(o.checks / Math.max(1, o.fights)).toFixed(1)}/싸움 | 신화 속삭임/징조/현현 ${o.tier.slice(1).join('/')} | 평균 별 ${(o.stars / Math.max(1, o.units)).toFixed(2)} | 정예 ${o.elite}번 중 ${pc(o.ewin, o.elite)}% | 이긴 판의 남은 목숨 ${o.win ? (o.hp / o.win).toFixed(1) : '-'}`);
    console.log('         마지막 우두머리 ' + o.rw[14] + '/' + o.rn[14] + ' | 라운드 승률 ' + o.rw.map((w, i) => (o.rn[i] ? pc(w, o.rn[i]) : '-')).join(' ') + ' | 싸움 길이 ' + o.time.map((x, i) => (o.rn[i] ? (x / o.rn[i]).toFixed(0) : '-')).join(' '));
  }
  if (process.env.CARDJSON) console.log('CARDJSON ' + JSON.stringify({ n, win: o.win, card: o.card, cardWin: o.cardWin }));
  if (process.env.CARDS) { const base = pc(o.win, n); console.log('신화: 고른 판 수 / 그 판이 끝까지 간 비율 (전체 ' + base + '%)'); [1, 2, 3].forEach(t => console.log('  ' + L.TIERN[t] + ': ' + L.MYTHOS_IDS.filter(id => L.MYTHOS[id].tier === t).map(id => `${L.MYTHOS[id].name} ${o.card[id] || 0}/${o.card[id] ? pc(o.cardWin[id] || 0, o.card[id]) : '-'}%`).join(' · '))); }
  return o;
}
if (require.main === module && process.env.ENC) { encTable().forEach(r => console.log([r.title, r.label, r.test, r.p ? r.p.join('/') + '%' : '-', r.ok, r.no == null ? '-' : r.no, r.ev.join('/'), r.flag].join(' | '))); }
else if (require.main === module) {
  const taste = !!process.env.TASTE, n = +(process.argv[2] || 200), table = taste ? STRAT : FSTRAT, names = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(table), all = { pick: {}, pwin: {}, casts: {}, fights: 0 };
  names.forEach(nm => { const o = taste ? report(nm, n) : reportFull(nm, n); if (nm !== 'random' && nm !== 'blob') { for (const k in o.pick) { all.pick[k] = (all.pick[k] || 0) + o.pick[k]; all.pwin[k] = (all.pwin[k] || 0) + (o.pwin[k] || 0); } all.fights += o.rn.reduce((a, b) => a + b, 0); } for (const k in o.casts) all.casts[k] = (all.casts[k] || 0) + o.casts[k]; });
  console.log('권속: 나온 싸움 비율 / 그 싸움 승률  ' + L.KIN_IDS.filter(k => !taste || !L.KIN[k].gen).map(k => `${L.KIN[k].name} ${Math.round(100 * (all.pick[k] || 0) / Math.max(1, all.fights))}%/${all.pick[k] ? Math.round(100 * all.pwin[k] / all.pick[k]) : 0}%`).join(' · '));
  console.log('스킬 쓴 횟수  ' + Object.keys(all.casts).sort((a, b) => all.casts[b] - all.casts[a]).map(k => ((L.KIN[k] || L.INV[k] || { name: k }).name) + ' ' + all.casts[k]).join(' · '));
}
module.exports = { encTable, encEV, GV, pOk, playRun, playTaste, playFull, report, reportFull, STRAT, FSTRAT, shopping, arrange, pickRoom, shopFull, arrangeFull, placeRooms, pickChoice, pickMythos, playEncounter };
