// 새 판 (시험) 자동 플레이어. node src/trendbot.js [판 수] [smart|random|plain|spore|maw|egg]
// smart: 보상을 고르고, 굴을 막아 길을 늘리고, 부위가 길 칸을 많이 덮게 놓고, 기술을 쓴다.
// plain: 보상과 기술은 쓰되 굴을 바꾸지 않고 '알아서 놓기'만 한다. random: 아무렇게나.
const T = typeof TREND !== 'undefined' ? TREND : require('./trend.js');
const cover = (R, cell, id) => { const F = { R }, p = { cell, d: T.P[id] }; return T.reach(F, p).filter(c => R.bd.path.includes(c) && c !== R.bd.core); };
// 길을 가장 길게 만드는 굴 바꾸기 (세 번까지 모두 살펴본다: 파서 돌아가는 길을 만들고 지름길을 막는다)
function bend(R) {
  const bd = R.bd, dug = bd.dug.slice(); let best = { len: bd.path.length, seq: [] };
  const go = (left, seq) => {
    const p = T.pathOf(bd); if (!p) return; if (p.length > best.len) best = { len: p.length, seq: seq.slice() };
    if (!left) return;
    for (let c = 0; c < T.N; c++) { if (c === bd.ent || c === bd.core) continue; if (!bd.dug[c] && !T.nbrs(c).some(j => bd.dug[j])) continue; if (seq.length && c < seq[seq.length - 1] && bd.dug[c] === dug[c]) continue; bd.dug[c] = !bd.dug[c]; seq.push(c); go(left - 1, seq); seq.pop(); bd.dug[c] = !bd.dug[c]; }
  };
  go(bd.edits, []); bd.dug = dug; bd.path = T.pathOf(bd);
  best.seq.forEach(c => T.toggle(R, c));
}
function arrange(R) {
  for (const c in R.board) for (const s in R.board[c]) T.unplace(R, R.board[c][s]);
  const path = R.bd.path, core = R.bd.core, used = {}, ps = T.bench(R);
  const w = c => { const i = path.indexOf(c); return i < 0 ? 0 : 1 + i / path.length; };
  // 권속: 길 끝 쪽(본체 앞). 적이 거기 멈추므로 부위는 그 칸을 덮게 한다
  const kin = ps.filter(p => T.P[p.id].kind === 'kin').sort((a, b) => T.P[b.id].hp - T.P[a.id].hp), hold = [];
  kin.forEach((p, i) => { const c = path[path.length - 2 - i * 2]; if (c != null && c !== core && T.place(R, p.uid, c)) hold.push(c); });
  ps.filter(p => T.P[p.id].kind === 'trap').sort((a, b) => T.P[b.id].rar - T.P[a.id].rar).forEach(p => {
    let best = null, bs = -1;
    for (let c = 0; c < T.N; c++) {
      if (used[c] || !T.canPlace(R, p.uid, c)) continue; const cv = cover(R, c, p.id);
      let s = cv.reduce((a, x) => a + w(x) + (hold.includes(x) ? 1.5 : 0), 0);
      if (T.P[p.id].spawn) s = cv.length ? 2 + w(cv[cv.length - 1]) : 0;
      if (s > bs) { bs = s; best = c; }
    }
    if (best != null) { T.place(R, p.uid, best); used[best] = 1; }
  });
  ps.filter(p => T.P[p.id].kind === 'organ').forEach(p => {
    let best = null, bs = -1;
    for (let c = 0; c < T.N; c++) { if (!T.canPlace(R, p.uid, c)) continue; const s = T.nbrs(c).filter(j => R.board[j] && (R.board[j].trap || R.board[j].kin)).length; if (s > bs) { bs = s; best = c; } }
    if (best != null) T.place(R, p.uid, best);
  });
}
function useSkills(F) {
  const R = F.R, L = T.alive(F); if (!L.length) return;
  F.charges.forEach((c, ci) => {
    if (c.used) return; const by = {}; L.forEach(u => { const k = T.cellOf(F, u); by[k] = (by[k] || 0) + 1; });
    const best = +Object.keys(by).sort((a, b) => by[b] - by[a])[0], elite = L.find(u => T.E[u.id].elite);
    if (c.id === 'burst' && L.reduce((a, u) => a + u.spore, 0) >= 30) T.useSkill(F, ci, best);
    else if (c.id === 'gulp' && elite) T.useSkill(F, ci, T.cellOf(F, elite));
    else if ((c.id === 'wave' || c.id === 'call') && (by[best] >= 3 || R.hp < 60)) T.useSkill(F, ci, best);
    else if (c.id === 'phantom' && (L.length >= 5 || R.hp < 60)) T.useSkill(F, ci, best);
  });
}
function play(seed, style, arch) {
  const R = T.newRun(seed, { arch });
  const pref = R.offer.map((id, i) => i).sort((a, b) => (T.P[R.offer[b]].tags.includes(R.arch) ? 5 : 0) + T.P[R.offer[b]].rar - (T.P[R.offer[a]].tags.includes(R.arch) ? 5 : 0) - T.P[R.offer[a]].rar)[0];
  T.take(R, style === 'random' ? Math.floor(R.rs() * 3) : pref);
  if (style === 'smart') { bend(R); arrange(R); } else T.autoPlace(R, style === 'random');
  const F = T.startFight(R); let g = 0;
  while (!F.over && g++ < 2000) { T.step(F); if (style !== 'random') useSkills(F); F.ev.length = 0; }
  const sp = F.allies.filter(a => a.spawn).length, res = T.endFight(R);
  const body = res.dmg.body || 0, tot = Object.values(res.dmg).reduce((a, b) => a + b, 0) || 1;
  return { win: res.win, t: res.t, hp: res.hp, chain: res.chainMax, sw: res.swallows, sp, body: body / tot, arch: R.arch, plen: R.bd.path.length, bodyKind: F.body };
}
if (typeof module !== 'undefined') module.exports = { play, arrange, bend };
if (typeof require !== 'undefined' && require.main === module) {
  const n = +(process.argv[2] || 300), a = process.argv[3] || 'smart', arch = T.ARCH[a] ? a : null, style = arch ? (process.argv[4] || 'smart') : a;
  let w = 0, L = [], ch = 0, sw = 0, sp = 0, bd = 0, hp = 0, pl = 0; const bk = {};
  for (let s = 1; s <= n; s++) { const r = play(s * 7919 + 13, style, arch); w += r.win; L.push(r.t); ch += r.chain; sw += r.sw; sp += r.sp; bd += r.body; hp += r.win ? r.hp : 0; pl += r.plen; bk[r.bodyKind] = (bk[r.bodyKind] || 0) + 1; }
  L.sort((x, y) => x - y);
  console.log(`${a}${arch ? '/' + style : ''}: 승 ${Math.round(100 * w / n)}% · 길이 ${L[n >> 1].toFixed(1)}초 (10% ${L[Math.floor(n * 0.1)].toFixed(1)} · 90% ${L[Math.floor(n * 0.9)].toFixed(1)}) · 연쇄 ${(ch / n).toFixed(1)} · 삼킴 ${(sw / n).toFixed(1)} · 움 ${(sp / n).toFixed(1)} · 본체 몫 ${Math.round(100 * bd / n)}% · 남은 체력 ${w ? Math.round(hp / w) : 0} · 길 ${(pl / n).toFixed(1)} · 몸 ${JSON.stringify(bk)}`);
}
