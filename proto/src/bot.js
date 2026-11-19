// 자동 플레이어. 규칙을 바꾸면 반드시 돌린다.
//   node src/bot.js 300            기본 전략 300판
//   node src/bot.js 300 all        전략 비교표
//   node src/bot.js 1 trace        한 판을 날짜별로 출력
const S = require('./logic.js');
const N = +process.argv[2] || 200, MODE = process.argv[3] || 'mix';

const STRATS = {
  mix: { captive: 'mix', raid: 1, spend: 1 },        // 사람이 할 법한 평범한 운영
  ransom: { captive: 'ransom', raid: 1, spend: 1 },  // 포로는 전부 몸값
  sacrifice: { captive: 'sacrifice', raid: 1, spend: 1 },
  convert: { captive: 'convert', raid: 1, spend: 1 },
  raider: { captive: 'mix', raid: 3, spend: 1 },     // 매일 습격
  peace: { captive: 'mix', raid: 0, spend: 1 },      // 습격 안 함
  hoard: { captive: 'ransom', raid: 0, spend: 0.4 }, // 재물을 쌓아 둔다
  idle: { captive: 'none', raid: 0, spend: 0 },      // 아무것도 안 한다
  tspike: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'spike' },   // 권속 없이 함정만
  tmist: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'mist' },
  trock: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'rock' },
  tacid: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'acid+spike' },
  tmix: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'mist+spike' },
  nohand: { captive: 'mix', raid: 1, spend: 1, nohand: true },
  nocalm: { captive: 'mix', raid: 1, spend: 1, nocalm: true },
};

function play(seed, st, diff, trace, force) {
  const asp = S.ASPECTS[seed % 5], G = S.newGame(seed, asp, { diff: diff || 1, forceOmen: force || null, origin: process.env.ORIGIN || 'drop', star: process.env.STAR || 'none' });
  const info = { reps: [], digs: 0 };
  let guard = 0;
  while (!G.over && guard++ < 60) {
    const c = S.cm(G), reserve = () => st.spend >= 1 ? 30 * c : 400 * c;
    const can = x => G.gold - x >= reserve();
    // 사건
    if (G.event) { const o = S.eventOptions(G); let pickI = o.findIndex(x => !x.why && x.cost <= G.gold - 20 * c); if (pickI < 0) pickI = o.length - 1; if (st.spend === 0) pickI = o.length - 1; S.resolveEvent(G, pickI); if (G.event) G.event = null; }
    if (st.spend > 0 && !st.nocalm && G.omen && G.omen.tier !== 'boon' && !G.omen.calmed && G.faith >= S.CALM_COST + 8) S.calm(G);
    if (G.guest) { const o = S.guestOptions(G); let k = st.spend > 0 ? o.findIndex(x => !x.why && x.cost <= G.gold - 40 * c) : -1; if (k < 0) k = o.length - 1; S.resolveGuest(G, k); if (G.guest) G.guest = null; }
    if (st.spend > 0) {
      // 포로
      for (let i = G.prison.length - 1; i >= 0; i--) {
        const p = G.prison[i]; let how = st.captive;
        if (how === 'mix') how = G.gold < 80 * c ? 'ransom' : (S.essTotal(G) < S.K.thresh[Math.min(4, G.slime.stage + 1)] ? 'sacrifice' : (S.freeSlot(G, 'cultist') !== null && S.convertChance(G, p.kind) > 0.5 ? 'convert' : 'ransom'));
        if (how !== 'none') S.dispose(G, i, how);
      }
      const path = S.paths(G)[0], onPath = i => path.includes(i);
      // 지원자
      for (let i = G.applicants.length - 1; i >= 0; i--) { const a = G.applicants[i]; if (!st.trapOnly && S.freeSlot(G, a.kind) !== null && G.gold >= S.acceptCost(G, a) + 10 * c && G.kin.length < 14) S.accept(G, i); }
      // 방어 시설: 길 위 빈 칸을 채운다
      const want = st.trapOnly ? ['trap'] : ['post', 'trap', 'hall', 'ambush', 'hall', 'trap'];
      let wi = G.cells.filter((x, i) => x.dug && onPath(i) && x.type !== 'empty' && i !== S.CORE).length;
      for (const i of path) { const x = G.cells[i]; if (i === S.CORE || x.type !== 'empty') continue; const t = want[wi % want.length], cost = S.buildCost(G, i, t); if (!S.canBuild(G, i, t) && can(cost)) { if (S.build(G, i, t).ok) wi++; } }
      // 함정 채우기
      G.cells.forEach((x, i) => { const cap = S.ROOM[x.type].traps || 0; while (x.dug && x.traps.length < cap) { const tk = st.trapOnly ? st.trapOnly.split('+') : null, k = tk ? tk[x.traps.length % tk.length] : G.slime.main === 'dusk' ? 'mist' : (x.traps.some(t => t.kind === 'spike') ? 'acid' : 'spike'); if (!can(S.TRAP[k].cost * c) || !S.addTrap(G, i, k).ok) break; } });
      // 실험: GIVE=조합 이름 → 6일째에 그 조합의 합체 권속 하나를 쥐여 준다 (NORCP=1 이면 같은 몸에 조합 효과만 끈다)
      if (process.env.GIVE && G.day === +(process.env.GIVEDAY || 6) && !G._given) { G._given = 1; const pr = S.RECIPE[process.env.GIVE].pair, mk = pr[1] === null ? 'goblin' : pr[0], pk2 = pr[1] === null ? pr[0] : pr[1], host = G.kin.filter(m => m.loc !== null && m.kind !== 'spawn').sort((x, y) => y.lv - x.lv)[0];
        G.kin.push({ id: G.nextId++, name: '시험', kind: mk, lv: 3, exp: 0, loc: host ? host.loc : 'core', hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold', parts: [{ kind: pk2, lv: 3, name: '재료' }] }); }
      // 대기 중인 권속 배치
      G.kin.forEach(m => { if (m.loc === null) { const f = S.freeSlot(G, m.kind); if (f !== null) S.moveKin(G, m.id, f); } });
      // 합체: 자리가 없어 서성이는 권속을 싸우는 권속에게 붙인다
      if (!process.env.NOFUSE) G.kin.filter(m => m.loc === null && m.kind !== 'spawn' && !(m.parts && m.parts.length)).forEach(b => { if (S.freeSlot(G, b.kind) !== null) return; const hosts = G.kin.filter(m => m.loc !== null && m.kind !== 'spawn' && (m.parts || []).length < S.K.fuse.max).sort((x, y) => y.lv - x.lv); if (hosts.length && can(S.fuseCost(G) + 40 * c) && S.fuseKin(G, hosts[0].id, b.id).ok) info.fuses = (info.fuses || 0) + 1; });
      if (process.env.AGGFUSE) { let guard2 = 0; while (guard2++ < 6) { const ks = G.kin.filter(m => m.kind !== 'spawn'), mats = ks.filter(m => !(m.parts && m.parts.length)).sort((x, y) => x.lv - y.lv), hosts = ks.filter(m => m.loc !== null && (m.parts || []).length < S.K.fuse.max).sort((x, y) => y.lv - x.lv); if (ks.length <= +process.env.AGGFUSE || !hosts.length || !mats.length || mats[0] === hosts[0] || !can(S.fuseCost(G) + 40 * c) || !S.fuseKin(G, hosts[0].id, mats[0].id).ok) break; } }
      // 곁방: 감옥, 예배당, 징조 시설
      if (G.day >= 3 && G.ap > 0) {
        const sides = S.sideRooms(G), empt = sides.filter(i => G.cells[i].type === 'empty');
        const wantSide = ['prison', 'chapel'].concat(G.slime.main ? Object.keys(S.ROOM).filter(k => S.ROOM[k].asp === G.slime.main && S.ROOM[k].side) : []).concat(['altar', 'ritual', 'persuade']).filter(t => !G.cells.some(x => x.dug && x.type === t));
        if (wantSide.length && sides.length < 2 + S.actOf(G) * 2) {
          if (!empt.length) { const cand = []; for (let i = 0; i < S.N; i++) if (!S.canDig(G, i) && !S.nbrs(i).includes(S.ENT)) cand.push(i); const keep = cand.filter(i => { G.cells[i].dug = true; const same = S.paths(G).length === 1 && S.paths(G)[0].length === path.length && !S.paths(G)[0].includes(i); G.cells[i].dug = false; return same; }); if (keep.length && can(40 * c)) { if (S.dig(G, keep[seed % keep.length]).ok) info.digs++; } }
          const e2 = S.sideRooms(G).filter(i => G.cells[i].type === 'empty');
          if (e2.length) { const t = wantSide.find(t => !S.canBuild(G, e2[0], t)); if (t && can(S.buildCost(G, e2[0], t))) S.build(G, e2[0], t); }
        }
      }
      // 영역
      if (G.slime.main && G.ap > 0) { const i = path.find(i => !G.cells[i].zone && S.ROOM[G.cells[i].type].def); if (i != null && can(30 * c + 60 * c)) S.setZone(G, i); }
      // 길목
      if (G.day >= 4 && G.plots[0] === 'none' && can(40 * c + 80 * c)) S.setPlot(G, 0, 'garden');
      // 탐식: 남는 재물로 목숨, 호위석, 별 가리기, 삼키기
      if (st.spend !== 0 && !process.env.NOHOARD) for (const k of (process.env.ONLY ? process.env.ONLY.split(',') : ['life', 'seat', 'veil', 'gulp'])) { let n = 0; while (n++ < 4 && !S.hoardWhy(G, k) && G.gold - S.hoardCost(G, k) >= Math.max(reserve(), 250 * c)) { if (!S.hoardBuy(G, k).ok) break; info.hoard = (info.hoard || 0) + 1; } }
      // 본체
      const ss = S.slimeStats(G);
      if (G.slime.hp < ss.hp * 0.5 || G.kin.filter(m => m.hurt).length >= 2) S.rest(G);
      if (G.corpses.length >= 3 || (S.isSettle(G) === false && G.corpses.length >= S.corpseCap(G) - 1)) S.eat(G);
      // 습격
      if (st.raid && S.actOf(G) >= 2 && G.ap > 0) { let n = st.raid >= 3 ? 2 : (G.day % 2 === 0 ? 1 : 0); for (const v of S.VIDS) { if (n <= 0 || G.ap <= 0) break; const s = G.vill[v]; if (s.razed) continue; if (S.raid(G, v, st.raid >= 3 ? 1 : (s.tribute ? 1 : 0)).ok) n--; } }
      // 지상에 나타난 것
      if (G.spot && G.ap > 0 && G.day % 3 !== 0) S.resolveSpot(G, G.spot.type === 'cart' && G.fear > 60 ? 1 : 0);
      // 권속 진화
      G.kin.forEach(m => { if (!m.evo && m.lv >= 5 && S.EVO[m.kind] && can(S.evoCost(G) + 60 * c)) S.evolveKin(G, m.id); });
      // 훈련
      if (G.day >= 4 && G.ap > 0 && G.kin.length) { const locs = [...new Set(G.kin.map(m => m.loc).filter(l => l !== null))], amt = Math.floor(Math.min(G.gold - reserve() - 40 * c, 60 * c)); if (amt >= 20 * c && locs.length) S.train(G, locs[G.day % locs.length], amt); }
      // 함정 강화
      if (G.ap > 0 || G.d.buildOps > 0) G.cells.forEach((x, i) => x.traps.forEach((t, j) => { if (t.lv < 3 && can(S.trapUpCost(G, t) + 100 * c)) S.upTrap(G, i, j); }));
    }
    const day = G.day, gold0 = G.gold;
    const r = S.endDay(G, ctx => { if (st.nohand || st.spend === 0) return { k: 'none' }; const big = ctx.enemies >= 4 || ctx.cell === 'core'; if (ctx.spell && ctx.spell.ok && big) return { k: 'spell' }; if (ctx.cell === 'core' && ctx.from.length) return { k: 'move', from: ctx.from[0] }; return big ? { k: 'whip' } : { k: 'none' }; });
    if (r.battle) info.reps.push(Object.assign({ day }, r.battle));
    if (trace) console.log(`${String(day).padStart(2)}일 재물 ${Math.round(gold0)}→${Math.round(G.gold)} 공포 ${Math.round(G.fear)} 신앙 ${G.faith} 정수 ${S.essTotal(G)} 권속 ${G.kin.length} 포로 ${G.prison.length} | ${r.battle ? `${S.VILL[r.battle.vill].name} ${r.battle.gname} ${r.battle.count}명 → ${r.battle.result} 처치 ${r.battle.kills} 포로 ${r.battle.captives.length} 도주 ${r.battle.fled}` : '조용한 밤'}${r.settle.evolved ? ' ★진화 ' + S.formName(G) : ''}${r.settle.notes.length ? ' ! ' + r.settle.notes.join('; ') : ''}`);
  }
  return { G, info };
}

function run(name, n, diff, force) {
  const st = STRATS[name]; const o = { win: 0, dieDay: {}, why: {}, gold: 0, score: 0, grades: {}, stage: [0, 0, 0, 0, 0], forms: {}, inc: {}, kills: 0, caps: 0, conv: 0, battles: 0, repel: 0, stolen: 0, fear: 0, dug: 0, kin: 0, muts: 0, err: 0, evoDay: { 6: 0, 12: 0, 18: 0 } };
  for (let s = 1; s <= n; s++) {
    let r; try { r = play(s * 7919 + 13, st, diff, false, force); } catch (e) { o.err++; if (o.err <= 2) console.log('오류 seed', s, e.stack.split('\n').slice(0, 4).join('\n')); continue; }
    const G = r.G, sc = S.score(G);
    if (G.over && G.over.win) o.win++; else { o.dieDay[G.day] = (o.dieDay[G.day] || 0) + 1; const w = G.over ? G.over.why : '끝나지 않음'; o.why[w] = (o.why[w] || 0) + 1; }
    o.gold += G.gold; o.score += sc.total; o.grades[sc.grade] = (o.grades[sc.grade] || 0) + 1; o.stage[G.slime.stage]++; o.forms[S.formName(G)] = 1;
    for (const k in G.stats.income) o.inc[k] = (o.inc[k] || 0) + G.stats.income[k];
    o.kills += G.stats.kills; o.caps += G.stats.captives; o.conv += G.stats.converts; o.battles += G.stats.battles; o.repel += G.stats.repels; o.stolen += G.stats.stolen; o.falls = (o.falls || 0) + (G.falls || 0); o.fz = (o.fz || 0) + (G.stats.fuses || 0); o.bd = o.bd || {}; o.bdw = o.bdw || {}; { const bk = G.slime.body || (G.slime.main ? '평범' : '허물 전'); o.bd[bk] = (o.bd[bk] || 0) + 1; if (G.over && G.over.win) o.bdw[bk] = (o.bdw[bk] || 0) + 1; } o.tr = o.tr || {}; o.tr[G.origin || 'drop'] = (o.tr[G.origin || 'drop'] || 0) + 1; o.trw = o.trw || {}; if (G.over && G.over.win) o.trw[G.origin || 'drop'] = (o.trw[G.origin || 'drop'] || 0) + 1; o.fellRuns = (o.fellRuns || 0) + (G.falls ? 1 : 0); o.fear += G.fear; o.dug += G.cells.filter(c => c.dug).length; o.kin += G.kin.length; o.muts += G.slime.muts.length;
  }
  return o;
}
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0) + '%';
function report(name, n, diff) {
  const o = run(name, n, diff), m = n - o.err, tot = Object.values(o.inc).reduce((a, b) => a + b, 0);
  const inv = (o.inc['소지금'] || 0) + (o.inc['몸값'] || 0);
  console.log(`\n== ${name} (난이도 ${diff || 1}, ${n}판) 오류 ${o.err}`);
  console.log(`클리어 ${pct(o.win, m)} | 평균 재물 ${Math.round(o.gold / m)} 점수 ${Math.round(o.score / m)} 공포 ${Math.round(o.fear / m)} | 등급 ${Object.entries(o.grades).map(e => e.join(':')).join(' ')}`);
  console.log(`진화 단계 0/1/2/3/4: ${o.stage.map(x => pct(x, m)).join(' / ')} | 본 형태 ${Object.keys(o.forms).length}종 | 변이 ${(o.muts / m).toFixed(1)}`);
  console.log(`수입 비중: ${Object.entries(o.inc).sort((a, b) => b[1] - a[1]).map(e => e[0] + ' ' + pct(e[1], tot)).join(', ')} | 침입자 몫 ${pct(inv, tot)}`);
  console.log('판당 합체 ' + ((o.fz || 0) / m).toFixed(1) + '회');
  console.log('본체: ' + Object.keys(o.bd || {}).map(k => k + ' ' + o.bd[k] + '판(클리어 ' + Math.round(((o.bdw || {})[k] || 0) / o.bd[k] * 100) + '%)').join(', '));
  console.log('형질: ' + Object.keys(o.tr || {}).map(k => k + ' ' + o.tr[k] + '판(클리어 ' + Math.round(((o.trw || {})[k] || 0) / o.tr[k] * 100) + '%)').join(', '));
  console.log(`판당 전투 ${(o.battles / m).toFixed(1)} 격퇴 ${(o.repel / m).toFixed(1)} 처치 ${(o.kills / m).toFixed(1)} 포로 ${(o.caps / m).toFixed(1)} 개종 ${(o.conv / m).toFixed(1)} 털림 ${Math.round(o.stolen / m)}G 쓰러짐 ${((o.falls || 0) / m).toFixed(2)}회 (쓰러진 판 ${Math.round((o.fellRuns || 0) / m * 100)}%) | 판 칸 ${(o.dug / m).toFixed(1)} 권속 ${(o.kin / m).toFixed(1)}`);
  if (m - o.win) console.log(`패배: ${Object.entries(o.why).map(e => e.join(' ')).join(', ')} | 날짜 ${Object.entries(o.dieDay).map(e => e[0] + '일:' + e[1]).join(' ')}`);
  return o;
}
if (MODE === 'trace') { const r = play(N * 7919 + 13, STRATS[process.argv[4] || 'mix'], 1, true); console.log(r.G.over, S.score(r.G).total, S.score(r.G).grade, S.formName(r.G)); }
else if (MODE === 'omens') { const b = run('nocalm', N, 1, null); console.log('징조별 클리어율 (그 징조만 매일 나올 때, 달래지 않음). 기준 ' + pct(b.win, N)); for (const id of S.OMEN_IDS) { const o = run('nocalm', N, 1, id); console.log(('  ' + S.OMEN[id].name).padEnd(10) + pct(o.win, N - o.err).padStart(5) + '  오류 ' + o.err); } }
else if (MODE === 'all') { for (const k in STRATS) report(k, N, 1); report('mix', N, 2); report('mix', N, 3); }
else report(MODE in STRATS ? MODE : 'mix', N, +process.argv[4] || 1);
