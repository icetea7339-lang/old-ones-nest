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
    task('파 올라가기', A => { let n = 0; while (G.sealed && !S.paths(G).length && n++ < 8) { const i = S.START.slice().reverse().find(j => !G.cells[j].dug && !S.canDig(G, j)); if (i == null || !A(S.dig(G, i), i).ok) break; } });
    if (!(st.spend > 0)) return T;
    let path = null; const onPath = i => path.includes(i), ban = opt.ban || [];
    task('포로', A => {
      for (let i = G.prison.length - 1; i >= 0; i--) {
        const p = G.prison[i]; let how = st.captive;
        if (how === 'mix') how = G.gold < 80 * c ? 'ransom' : (S.essTotal(G) < S.K.thresh[Math.min(4, G.slime.stage + 1)] ? 'sacrifice' : (S.freeSlot(G, 'cultist') !== null && S.convertChance(G, p.kind) > 0.5 ? 'convert' : 'ransom'));
        if (how !== 'none' && starving()) how = 'sacrifice';
        if (how !== 'none') A(S.dispose(G, i, how));
      }
      path = S.paths(G)[0] || [];
    });
    task('돋는 것', A => { for (let i = G.applicants.length - 1; i >= 0; i--) { const a = G.applicants[i]; if (!st.trapOnly && (S.freeSlot(G, a.kind) !== null || st.acceptAll) && G.gold >= S.acceptCost(G, a) + 10 * c && G.kin.length < 14) A(S.accept(G, i)); } });
    task('짓기', A => {
      const want = st.trapOnly ? ['trap'] : ['post', 'trap', 'hall', 'ambush', 'hall', 'trap'];
      let wi = G.cells.filter((x, i) => x.dug && onPath(i) && x.type !== 'empty' && i !== S.CORE).length;
      const forceP = opt.force && !S.ROOM[opt.force].side && !G.cells.some(x => x.dug && x.type === opt.force) ? opt.force : null;
      for (const i of path) { const x = G.cells[i]; if (i === S.CORE || x.type !== 'empty') continue; let t = want[wi % want.length]; { const ap = !st.trapOnly && G.slime.main && wi >= 2 ? Object.keys(S.ROOM).find(k => S.ROOM[k].asp === G.slime.main && !S.ROOM[k].side && !S.canBuild(G, i, k) && !G.cells.some(q => q.dug && q.type === k)) : null; if (ap) t = ap; } if (forceP && !S.canBuild(G, i, forceP) && !G.cells.some(q => q.dug && q.type === forceP)) t = forceP; if (ban.includes(t)) t = ban.includes('post') ? 'trap' : 'post'; if (ban.includes(t)) { wi++; continue; } const cost = S.buildCost(G, i, t); if (!S.canBuild(G, i, t) && can(cost)) { if (A(S.build(G, i, t), i).ok) wi++; } }
    });
    task('함정', A => { G.cells.forEach((x, i) => { const cap = S.ROOM[x.type].traps || 0; while (x.dug && x.traps.length < cap) { const tk = st.trapOnly ? st.trapOnly.split('+') : null, k = tk ? tk[x.traps.length % tk.length] : G.slime.main === 'dusk' ? 'mist' : (x.traps.some(t => t.kind === 'spike') ? 'acid' : 'spike'); if (!can(S.TRAP[k].cost * c) || !A(S.addTrap(G, i, k), i).ok) break; } }); });
    task('배치', A => { S.autoPlace(G); if (opt.pin && !G.sealed) { const ks = G.kin.filter(m => m.kind !== 'spawn' && !m.pin && m.loc !== null && !m.hurt).sort((x, y) => S.kinStats(G, y).hp - S.kinStats(G, x).hp); for (const m of ks) { if (S.pinned(G) >= S.pinCap(G)) break; A(S.guard(G, m.id, m.loc), m.loc); } } });   // 권속은 제 자리를 제가 찾는다
    task('합체', A => {
      if (!opt.nofuse) G.kin.filter(m => m.loc === null && m.kind !== 'spawn' && !(m.parts && m.parts.length)).forEach(b => { if (S.freeSlot(G, b.kind) !== null) return; const hosts = G.kin.filter(m => m.loc !== null && m.kind !== 'spawn' && (m.parts || []).length < S.K.fuse.max).sort((x, y) => y.lv - x.lv); if (hosts.length && can(S.fuseCost(G) + 40 * c) && A(S.fuseKin(G, hosts[0].id, b.id), hosts[0].loc).ok) opt.onFuse && opt.onFuse(); });
      if (opt.aggfuse) { let guard2 = 0; while (guard2++ < 6) { const ks = G.kin.filter(m => m.kind !== 'spawn'), mats = ks.filter(m => !(m.parts && m.parts.length)).sort((x, y) => x.lv - y.lv), hosts = ks.filter(m => m.loc !== null && (m.parts || []).length < S.K.fuse.max).sort((x, y) => y.lv - x.lv); if (ks.length <= +opt.aggfuse || !hosts.length || !mats.length || mats[0] === hosts[0] || !can(S.fuseCost(G) + 40 * c) || !A(S.fuseKin(G, hosts[0].id, mats[0].id)).ok) break; } }
    });
    task('곁방', A => {
      if (!(G.day >= 3 && G.ap > 0)) return;
      const sides = S.sideRooms(G), empt = sides.filter(i => G.cells[i].type === 'empty');
      const wantSide = (opt.force && S.ROOM[opt.force].side ? [opt.force] : []).concat(['prison', 'chapel']).concat(G.slime.main ? Object.keys(S.ROOM).filter(k => S.ROOM[k].asp === G.slime.main && S.ROOM[k].side) : []).concat(['altar']).filter(t => !ban.includes(t) && !G.cells.some(x => x.dug && x.type === t));
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
  // 밤의 개입: 무리가 방에 들어설 때마다 묻는다. 큰 싸움과 본체 방에서만 손을 쓰고, 그 자리에 맞는 주문을 고른다
  const decide = st => ctx => {
    if (st.nohand || st.spend === 0) return { k: 'none' };
    const o = {}; (ctx.opts || []).forEach(x => { if (x.ok && !(st.banSp && st.banSp.includes(x.id))) o[x.id] = x; });
    const n = ctx.enemies, core = ctx.cell === 'core', def = ctx.def > 0, big = core || (n >= 4 && (def || ctx.traps > 0)) || (n >= 3 && def && ctx.hands >= 2);
    if (st.only) return o[st.only] && (big || st.only === 'mark') ? { k: st.only, u: ctx.tough, from: ctx.from[0] } : { k: 'none' };
    if (!big) return o.cocoon && n >= 2 ? { k: 'cocoon', u: o.cocoon.targets[0] } : { k: 'none' };
    const strong = () => (ctx.units || []).slice().sort((a, b) => b.atk - a.atk)[0];
    if (o.guard && n >= 5 && def && !core) return { k: 'guard' };
    if (o.bite) return { k: 'bite', u: ctx.tough };
    if (o.phantom) return { k: 'phantom' };
    if (o.halo && (def || core)) return { k: 'halo' };
    if (o.call) return { k: 'call' };
    if (o.flip && n >= 3) return { k: 'flip' };
    if (o.scream && ctx.weak >= 2) return { k: 'scream' };
    if (o.cocoon) return { k: 'cocoon', u: o.cocoon.targets[0] };
    if (o.rift && n >= 4) return { k: 'rift' };
    if (o.wave && ctx.prevTraps > 0) return { k: 'wave' };
    if (o.star && ctx.traps > 0) return { k: 'star' };
    if (o.hatch) return { k: 'hatch' };
    if (o.rise && (def || core)) return { k: 'rise' };
    if (o.flesh && n >= 3) return { k: 'flesh' };
    if (o.tide && ctx.hurt >= 2) return { k: 'tide' };
    if (o.eclipse && (def || core)) return { k: 'eclipse' };
    if (o.charm && n >= 3) return { k: 'charm', u: strong().uid };
    if (o.grip && (def || core)) return { k: 'grip' };
    if (o.rock && n >= 3) return { k: 'rock' };
    if (core && o.move) return { k: 'move', from: o.move.targets[0] };
    if (o.mark && ctx.faith >= 12 && (def || core)) return { k: 'mark', u: ctx.tough };
    if (o.guard && n >= 5 && !o.whip) return { k: 'guard' };
    return o.whip ? { k: 'whip' } : o.guard ? { k: 'guard' } : { k: 'none' };
  };
  return { tasks, decide };
})();
if (typeof module !== 'undefined') module.exports = STEWARD;
