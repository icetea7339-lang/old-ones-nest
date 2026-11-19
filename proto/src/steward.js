// 옛 것의 둥지 — 권속들의 판단. 본체가 일일이 시키지 않아도 둥지가 굴러가게 하는 머리.
// 자동 플레이어(bot.js)와 게임의 "맡김" 방식이 같은 코드를 쓴다. 그래서 자동 플레이어로 잰 숫자가 곧 맡겼을 때의 숫자다.
//   STEWARD.tasks(S, G, st, opt) → 하루치 할 일의 목록. 하나씩 부르면 그 일이 실제로 일어나고, 한 일을 말로 돌려준다.
//   st: 성향 { captive, raid, spend, trapOnly, expand, restMore, trainMore, acceptAll }   opt: 실험용 스위치
const STEWARD = (function () {
  function tasks(S, G, st, opt) {
    opt = opt || {}; const seed = opt.seed || G.seed || 1, c = S.cm(G), reserve = () => st.spend >= 1 ? 30 * c : 400 * c, can = x => G.gold - x >= reserve();
    // 허물이 걸린 밤이 코앞인데 정수가 모자라면, 뜻보다 허물이 먼저다: 잡은 것은 바치고 먹이는 남기지 않는다
    const act = S.K.act, dTo = (act - (G.day % act)) % act, starving = () => G.slime.stage < 4 && (G.slime.stage === 0 || dTo <= 2) && S.essTotal(G) < S.K.thresh[Math.min(4, G.slime.stage + 1)];   // 첫 허물 전에는 내내
    const T = [], task = (name, fn) => T.push(() => { const out = []; const A = (r, cell) => { if (r && r.ok && r.msg) out.push({ msg: r.msg, cell: cell == null ? null : cell }); return r; }; fn(A); return { name, did: out }; });
    task('사건', A => {
      if (G.event) { const o = S.eventOptions(G); let pickI = o.findIndex(x => !x.why && x.cost <= G.gold - 20 * c); if (pickI < 0) pickI = o.length - 1; if (st.spend === 0) pickI = o.length - 1; A(S.resolveEvent(G, pickI)); if (G.event) G.event = null; }
      if (st.spend > 0 && !st.nocalm && G.omen && G.omen.tier !== 'boon' && !G.omen.calmed && G.faith >= S.CALM_COST + 8) A(S.calm(G));
      if (G.guest) { const o = S.guestOptions(G); let k = st.spend > 0 ? o.findIndex(x => !x.why && x.cost <= G.gold - 40 * c) : -1; if (k < 0) k = o.length - 1; A(S.resolveGuest(G, k)); if (G.guest) G.guest = null; }
    });
    if (!(st.spend > 0)) return T;
    let path = null; const onPath = i => path.includes(i);
    task('포로', A => {
      for (let i = G.prison.length - 1; i >= 0; i--) {
        const p = G.prison[i]; let how = st.captive;
        if (how === 'mix') how = G.gold < 80 * c ? 'ransom' : (S.essTotal(G) < S.K.thresh[Math.min(4, G.slime.stage + 1)] ? 'sacrifice' : (S.freeSlot(G, 'cultist') !== null && S.convertChance(G, p.kind) > 0.5 ? 'convert' : 'ransom'));
        if (how !== 'none' && starving()) how = 'sacrifice';
        if (how !== 'none') A(S.dispose(G, i, how));
      }
      path = S.paths(G)[0];
    });
    task('지원자', A => { for (let i = G.applicants.length - 1; i >= 0; i--) { const a = G.applicants[i]; if (!st.trapOnly && (S.freeSlot(G, a.kind) !== null || st.acceptAll) && G.gold >= S.acceptCost(G, a) + 10 * c && G.kin.length < 14) A(S.accept(G, i)); } });
    task('짓기', A => {
      const want = st.trapOnly ? ['trap'] : ['post', 'trap', 'hall', 'ambush', 'hall', 'trap'];
      let wi = G.cells.filter((x, i) => x.dug && onPath(i) && x.type !== 'empty' && i !== S.CORE).length;
      for (const i of path) { const x = G.cells[i]; if (i === S.CORE || x.type !== 'empty') continue; const t = want[wi % want.length], cost = S.buildCost(G, i, t); if (!S.canBuild(G, i, t) && can(cost)) { if (A(S.build(G, i, t), i).ok) wi++; } }
    });
    task('함정', A => { G.cells.forEach((x, i) => { const cap = S.ROOM[x.type].traps || 0; while (x.dug && x.traps.length < cap) { const tk = st.trapOnly ? st.trapOnly.split('+') : null, k = tk ? tk[x.traps.length % tk.length] : G.slime.main === 'dusk' ? 'mist' : (x.traps.some(t => t.kind === 'spike') ? 'acid' : 'spike'); if (!can(S.TRAP[k].cost * c) || !A(S.addTrap(G, i, k), i).ok) break; } }); });
    task('배치', A => { G.kin.forEach(m => { if (m.loc === null) { const f = S.freeSlot(G, m.kind); if (f !== null) A(S.moveKin(G, m.id, f), f); } }); });
    task('합체', A => {
      if (!opt.nofuse) G.kin.filter(m => m.loc === null && m.kind !== 'spawn' && !(m.parts && m.parts.length)).forEach(b => { if (S.freeSlot(G, b.kind) !== null) return; const hosts = G.kin.filter(m => m.loc !== null && m.kind !== 'spawn' && (m.parts || []).length < S.K.fuse.max).sort((x, y) => y.lv - x.lv); if (hosts.length && can(S.fuseCost(G) + 40 * c) && A(S.fuseKin(G, hosts[0].id, b.id), hosts[0].loc).ok) opt.onFuse && opt.onFuse(); });
      if (opt.aggfuse) { let guard2 = 0; while (guard2++ < 6) { const ks = G.kin.filter(m => m.kind !== 'spawn'), mats = ks.filter(m => !(m.parts && m.parts.length)).sort((x, y) => x.lv - y.lv), hosts = ks.filter(m => m.loc !== null && (m.parts || []).length < S.K.fuse.max).sort((x, y) => y.lv - x.lv); if (ks.length <= +opt.aggfuse || !hosts.length || !mats.length || mats[0] === hosts[0] || !can(S.fuseCost(G) + 40 * c) || !A(S.fuseKin(G, hosts[0].id, mats[0].id)).ok) break; } }
    });
    task('곁방', A => {
      if (!(G.day >= 3 && G.ap > 0)) return;
      const sides = S.sideRooms(G), empt = sides.filter(i => G.cells[i].type === 'empty');
      const wantSide = ['prison', 'chapel'].concat(G.slime.main ? Object.keys(S.ROOM).filter(k => S.ROOM[k].asp === G.slime.main && S.ROOM[k].side) : []).concat(['altar', 'ritual', 'persuade']).filter(t => !G.cells.some(x => x.dug && x.type === t));
      if (wantSide.length && sides.length < 2 + S.actOf(G) * 2 + (st.expand ? 2 : 0)) {
        if (!empt.length) { const cand = []; for (let i = 0; i < S.N; i++) if (!S.canDig(G, i) && !S.nbrs(i).includes(S.ENT)) cand.push(i); const keep = cand.filter(i => { G.cells[i].dug = true; const same = S.paths(G).length === 1 && S.paths(G)[0].length === path.length && !S.paths(G)[0].includes(i); G.cells[i].dug = false; return same; }); if (keep.length && can(40 * c)) { const ci = keep[seed % keep.length]; if (A(S.dig(G, ci), ci).ok) opt.onDig && opt.onDig(); } }
        const e2 = S.sideRooms(G).filter(i => G.cells[i].type === 'empty');
        if (e2.length) { const t = wantSide.find(t => !S.canBuild(G, e2[0], t)); if (t && can(S.buildCost(G, e2[0], t))) A(S.build(G, e2[0], t), e2[0]); }
      }
    });
    task('영역과 길목', A => {
      if (G.slime.main && G.ap > 0) { const i = path.find(i => !G.cells[i].zone && S.ROOM[G.cells[i].type].def); if (i != null && can(30 * c + 60 * c)) A(S.setZone(G, i), i); }
      if (G.day >= 4 && G.plots[0] === 'none' && can(40 * c + 80 * c)) A(S.setPlot(G, 0, 'garden'));
    });
    task('탐식', A => { if (st.spend !== 0 && !opt.nohoard) for (const k of (opt.hoardOnly || ['life', 'seat', 'veil', 'gulp'])) { let n = 0; while (n++ < 4 && !S.hoardWhy(G, k) && G.gold - S.hoardCost(G, k) >= Math.max(reserve(), 250 * c)) { if (!A(S.hoardBuy(G, k)).ok) break; opt.onHoard && opt.onHoard(); } } });
    task('본체', A => {
      const ss = S.slimeStats(G);
      if (G.slime.hp < ss.hp * (st.restMore ? 0.75 : 0.5) || G.kin.filter(m => m.hurt).length >= 2) A(S.rest(G), S.CORE);
      if (G.corpses.length >= 3 || (S.isSettle(G) === false && G.corpses.length >= S.corpseCap(G) - 1) || ((st.eatMore || starving()) && G.corpses.length >= 1)) A(S.eat(G), S.CORE);
    });
    task('지상', A => {
      if (st.raid && S.actOf(G) >= 2 && G.ap > 0) { let n = st.raid >= 3 ? 2 : (G.day % 2 === 0 ? 1 : 0); for (const v of S.VIDS) { if (n <= 0 || G.ap <= 0) break; const s = G.vill[v]; if (s.razed) continue; if (A(S.raid(G, v, st.raidKind != null ? st.raidKind : st.raid >= 3 ? 1 : (s.tribute ? 1 : 0))).ok) n--; } }
      if (G.spot && G.ap > 0 && G.day % 3 !== 0) A(S.resolveSpot(G, G.spot.type === 'cart' && G.fear > 60 ? 1 : 0));
    });
    task('단련', A => {
      G.kin.forEach(m => { if (!m.evo && m.lv >= 5 && S.EVO[m.kind] && can(S.evoCost(G) + 60 * c)) A(S.evolveKin(G, m.id), m.loc); });
      if (G.day >= 4 && G.ap > 0 && G.kin.length) { const locs = [...new Set(G.kin.map(m => m.loc).filter(l => l !== null))], amt = Math.floor(Math.min(G.gold - reserve() - 40 * c, (st.trainMore ? 120 : 60) * c)); if (amt >= 20 * c && locs.length) A(S.train(G, locs[G.day % locs.length], amt), locs[G.day % locs.length]); }
      if (G.ap > 0 || G.d.buildOps > 0) G.cells.forEach((x, i) => x.traps.forEach((t, j) => { if (t.lv < 3 && can(S.trapUpCost(G, t) + 100 * c)) A(S.upTrap(G, i, j), i); }));
    });
    return T;
  }
  // 밤의 개입: 큰 싸움이면 주문, 본체 방이면 호위를 부르고, 아니면 채찍
  const decide = st => ctx => { if (st.nohand || st.spend === 0) return { k: 'none' }; const big = ctx.enemies >= 4 || ctx.cell === 'core'; if (ctx.spell && ctx.spell.ok && big) return { k: 'spell' }; if (ctx.cell === 'core' && ctx.from.length) return { k: 'move', from: ctx.from[0] }; return big ? { k: 'whip' } : { k: 'none' }; };
  return { tasks, decide };
})();
if (typeof module !== 'undefined') module.exports = STEWARD;
