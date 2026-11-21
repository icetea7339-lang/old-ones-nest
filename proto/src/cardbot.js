// 카드로 짓는 판을 화면 없이 해 보는 자동 플레이어.
//   node src/cardbot.js 300 <abyss|nebula|brood|dusk|hunger|all> [난이도] [noskill|nocombo|v]
//   판마다 처음 덱만 열린 새 기록(meta)으로 한다. META=keep 이면 판을 넘겨 기록을 이어 간다(해금 속도 재기).
const S = require('./logic.js'), STEWARD = require('./steward.js'), CM = require('./cardmode.js'), CD = require('./cards2.js'), T = require('./traits.js');
const def = id => CD.BY[id] || CM.def({ id });
// 판마다 버릇이 다른 사람: 좋아하는 카드 종류 하나와 꼬리표 둘 (몸이 여러 갈래로 가는지 재려고)
const TYPES = ['trap', 'kin', 'organ', 'skill', 'shape'];
// 일부러 한 갈래를 노리는 사람 (STYLE=이정표 id): 그 형질 꼬리표 카드만 고르고 내고, 홀로 가는 갈래는 권속을 들이지 않는다
const STYLES = { pit: ['maw'], thousandeyes: ['eye'], lantern: ['glow'], veil: ['mirror'], tongue: ['tongue'], swarmone: ['swarm'], queen: ['egg', 'swarm'], shellmind: ['shell'], hedgehog: ['spike', 'shell'], trench: ['water', 'tent'], pitfall: ['trap', 'root'], forest: ['spore', 'root'], gourmand: ['gut', 'maw'], skywound: ['wing', 'star'], constel: ['star', 'glow'], nomad: ['shadow', 'wing'], plague: ['spore'], allfaces: ['face'], lastone: ['alone'], ossuary: ['bone'], crowned: ['horn'], hollow: ['gut', 'alone'], drowned: ['water', 'root', 'spore'], patient: ['maw', 'root'], madlight: ['glow', 'eye', 'mirror'], chorus: ['maw', 'face'], mimic: ['face', 'mirror'], scarred: ['shell', 'spike', 'bone'] };
const NOKIN = { lastone: 1, hollow: 1 };
function styleOf(id) { const tags = STYLES[id]; return tags ? { type: null, tags, skill: 1, style: id, nokin: !!NOKIN[id] } : null; }
function persona(seed) { const r = T.rng(T.hash('p' + seed)); return { type: TYPES[Math.floor(r() * TYPES.length)], tags: [T.TAG_IDS[Math.floor(r() * T.TAG_IDS.length)], T.TAG_IDS[Math.floor(r() * T.TAG_IDS.length)]], skill: 0.55 + 0.45 * r() }; }

function scoreCard(R, id) {
  const d = def(id), G = R.G; let s = { c: 1, s: 1, u: 2, r: 3, x: -9 }[d.rar] || 1;
  if (d.asp === R.aspect) s += 1.5; else if (d.asp !== 'none') s -= 0.5;
  const kin = G.kin.filter(m => m.kind !== 'spawn').length, traps = G.cells.reduce((a, c) => a + c.traps.length, 0), organs = G.cells.filter((c, i) => c.dug && c.type !== 'empty' && i !== G.core).length;
  if (d.type === 'kin') s += kin < 6 ? 1.5 : -0.5; if (d.type === 'trap') s += traps < 6 ? 1 : 0; if (d.type === 'organ') s += organs < 5 ? 1 : 0;
  if (d.type === 'skill') s += R.deck.filter(c => def(c.id).type === 'skill').length < 6 ? 1 : -1;
  if (d.type === 'shape') s += R.deck.filter(c => def(c.id).type === 'shape').length < 5 ? 0.5 : -1;
  // 몸을 아는 사람: 지금 큰 형질의 꼬리표가 붙은 카드를 더 고른다. 버릇이 있으면 그쪽으로
  if (R.genome && !process.env.NOGENEPICK) { const top = T.topTags(R.genome, 2); s += 0.6 * (d.tags || []).filter(t => top.includes(t)).length; }
  if (R.persona) { if (d.type === R.persona.type) s += 1.1; s += (R.persona.style ? 3 : 0.8) * (d.tags || []).filter(t => R.persona.tags.includes(t)).length; if (R.persona.nokin && d.type === 'kin') s -= 4; }
  return s;
}
const pathCells = G => (S.paths(G)[0] || []);
function bestShape(R, h) {
  const G = R.G, onPath = new Set(pathCells(G)), adjPath = i => S.nbrs(G, i).some(j => onPath.has(j));
  let best = null, bs = -1e9; for (const cells of h.places) { let sc = 0; cells.forEach(i => { sc += adjPath(i) ? 3 : 1; }); sc += ((cells[0] * 7) % 5) * 0.1; if (sc > bs) { bs = sc; best = cells; } }
  return best;
}
function bestCell(R, h) {
  const G = R.G, cs = h.cellsCan || [], path = pathCells(G), pos = new Map(path.map((i, k) => [i, k])), side = new Set(S.sideRooms(G)), d = def(h.id);
  if (!cs.length) return null;
  if (d.op === 'block') { const base = path.length; let best = null, bl = base; for (const i of cs) { if (!pos.has(i)) continue; G.cells[i].block = true; const p = S.paths(G)[0]; G.cells[i].block = false; if (p && p.length > bl) { bl = p.length; best = i; } } return best; }
  if (d.op === 'unblock') return null;
  if (d.op === 'deepen') return cs.filter(i => pos.has(i) && S.ROOM[G.cells[i].type].def).sort((a, b) => pos.get(a) - pos.get(b))[0] ?? null;
  if (d.type === 'organ') {
    const R0 = S.ROOM[d.room], empty = cs.filter(i => G.cells[i].type === 'empty');
    if (R0.side) return empty.filter(i => side.has(i))[0] ?? empty.filter(i => !pos.has(i))[0] ?? null;
    return empty.filter(i => pos.has(i) && i !== G.core).sort((a, b) => pos.get(a) - pos.get(b))[0] ?? null;
  }
  if (d.type === 'trap') { const on = cs.filter(i => pos.has(i)); on.sort((a, b) => (G.cells[b].type === 'trap' || G.cells[b].type === 'ambush') - (G.cells[a].type === 'trap' || G.cells[a].type === 'ambush') || pos.get(a) - pos.get(b)); return on[0] ?? null; }
  return cs[0];
}
// 엉터리로 놓는 사람: 놓을 수 있는 카드를 아무 자리에나 놓는다 (배치가 결과를 바꾸는지 보려고)
function dayRandom(R) {
  const G = R.G, r = T.rng(T.hash('rnd' + R.seed + ':' + G.day)); let guard = 0;
  while (guard++ < 14) {
    const hs = CM.dayView(R).hand.filter(h => h.can && h.type !== 'skill' && h.type !== 'curse'); if (!hs.length) break;
    const h = hs[Math.floor(r() * hs.length)]; let tgt = {};
    if (h.target === 'shape') { if (!h.places || !h.places.length) break; tgt = { cells: h.places[Math.floor(r() * h.places.length)] }; }
    if (h.target === 'cell') { const cs = h.cellsCan || []; if (!cs.length) break; tgt = { cell: cs[Math.floor(r() * cs.length)] }; }
    if (!CM.play(R, h.uid, tgt).ok) break;
  }
}
function dayPlay0(R) { return dayPlay(R, true); }
function dayPlay(R, onlyCards) {
  const G = R.G; let guard = 0;
  // 손이 나쁘면(저주가 많거나 놓을 카드가 거의 없으면) 진액으로 다시 받는다
  if (!onlyCards && CM.buySink && !process.env.NOSINK) { const v0 = CM.dayView(R), hv = v0.hand || [], good = hv.filter(h => h.can && def(h.id).type !== 'curse' && def(h.id).type !== 'skill').length, cur = hv.filter(h => def(h.id).type === 'curse').length; const o = CM.sinkOptions(R).find(x => x.id === 'redraw' && x.ok); if (o && (good <= 1 || cur >= 2) && o.cost < G.gold - 60) CM.buySink(R, 'redraw'); }
  while (guard++ < 14) {
    const v = CM.dayView(R), order = { boon: 0, shape: 1, organ: 2, trap: 3, kin: 4, curse: 5 };
    const pr = R.persona, tg = h => pr && pr.style ? (def(h.id).tags || []).filter(t => pr.tags.includes(t)).length : 0;
    const hs = v.hand.filter(h => h.can && h.type !== 'skill').sort((a, b) => (tg(b) - tg(a)) * 10 + order[a.type] - order[b.type]);
    let did = false;
    for (const h of hs) {
      const d = def(h.id);
      if (h.type === 'curse' && G.gold < 80) continue;
      if (h.type === 'kin' && R.persona && R.persona.nokin && G.kin.filter(m => m.kind !== 'spawn').length >= 1) continue;
      if (h.type === 'kin') { const cap = Object.values(S.capacity(G)).reduce((a, b) => a + b, 0), kin = G.kin.filter(m => m.kind !== 'spawn').length; if (G.gold - h.cost < 20 * S.cm(G) || kin >= cap + 1) continue; }
      if (d.fx && d.fx.needle && G.gold < 100) continue;
      let tgt = {};
      if (h.target === 'shape') { const cells = bestShape(R, h); if (!cells) continue; tgt = { cells }; }
      if (h.target === 'cell') { const c = bestCell(R, h); if (c == null) continue; tgt = { cell: c }; }
      const r = CM.play(R, h.uid, tgt); if (r.ok) { did = true; break; }
    }
    if (!did) break;
  }
  if (onlyCards) return;
  // 남는 진액으로 상점·강화·빼기
  const k = S.cm(G);
  if (G.gold > 220 * k && R.shop) { const best = R.shop.map((s, i) => ({ s, i, sc: scoreCard(R, s.id) })).filter(x => !x.s.sold && x.s.price < G.gold - 120 * k).sort((a, b) => b.sc - a.sc)[0]; if (best && best.sc >= 3) CM.shopBuy(R, best.i); }
  if (G.gold > 260 * k) { const c = R.deck.filter(x => !x.up && def(x.id).type !== 'curse').sort((a, b) => scoreCard(R, b.id) - scoreCard(R, a.id))[0]; if (c) CM.upgrade(R, c.uid); }
  if (R.persona && R.persona.style && G.gold > 150 * k && R.deck.length > 10) { const off = R.deck.filter(x => { const d = def(x.id); return d.type !== 'shape' && !(d.tags || []).some(t => R.persona.tags.includes(t)); }).sort((a, b) => scoreCard(R, a.id) - scoreCard(R, b.id))[0]; if (off) CM.removeCard(R, off.uid); }
  // 남은 진액은 쓴다: 허물 재촉 → 권속 먹이기 → 한 장 더 (진액이 쌓이지 않게)
  if (CM.buySink && !process.env.NOSINK) { let g2 = 0; while (g2++ < (G.gold > 400 * k ? 14 : 6)) { const o = CM.sinkOptions(R).filter(x => x.ok && x.cost < G.gold - 90 * k); const pickS = o.find(x => x.id === 'hurry') || o.find(x => x.id === 'feed') || (R.hand.length < 6 ? o.find(x => x.id === 'draw') : null); if (!pickS || !CM.buySink(R, pickS.id).ok) break; if (pickS.id === 'draw') dayPlay0(R); } }
  if (G.gold > 200 * k) { const cu = R.deck.find(x => def(x.id).type === 'curse') || (R.deck.length > 16 ? R.deck.find(x => x.id === 'sh_one') : null); if (cu) CM.removeCard(R, cu.uid); }
}
function needlePlay(R) {
  if (!R.needleOffer) return; if (R.G.gold < 120 * S.cm(R.G)) { R.needleOffer = false; return; }
  CM.needleStart(R); CM.needleBet(R, { kind: 'ess', n: 15 }); for (let k = 0; k < 3 && R.needle; k++) CM.needleReveal(R);
}
// mk(seed, aspect, meta) 를 주면 그 판으로 한다 (이야기 장: tests/campbot.js)
function play(seed, aspect, diff, mode, meta, egg, mk) {
  if (process.env.STYLE && STYLES[process.env.STYLE]) aspect = T.TAGS[STYLES[process.env.STYLE][0]].asp[0];
  const LOOKS = Object.keys(T.LOOKSEED || {}), look = process.env.NOLOOK || !LOOKS.length ? undefined : LOOKS[(seed >>> 3) % LOOKS.length];
  const R = mk ? mk(seed, aspect, meta) : CM.newRun(seed, { aspect, diff, meta, egg: egg || null, look, ease: process.env.EASE ? undefined : 1 }), G = R.G, st = { captive: 'mix', raid: 1, spend: 1 }, base = STEWARD.decide(st);
  if (mode === 'nogene') R.noGene = true; if (!process.env.NOPERSONA) R.persona = (process.env.STYLE && styleOf(process.env.STYLE)) || persona(seed);
  const pr = R.persona, rr0 = T.rng(T.hash('d' + seed));
  const decide = mode === 'nothing' ? () => ({ k: 'none' }) : mode === 'noskill' ? ctx => { const r = base(Object.assign({}, ctx, { opts: (ctx.opts || []).filter(o => S.SPELL[o.id] && S.SPELL[o.id].free) })); return r; } : pr ? ctx => { const r = base(ctx); return r && r.k && r.k !== 'none' && S.SPELL[r.k] && !S.SPELL[r.k].free && rr0() > pr.skill ? { k: 'none' } : r; } : base;
  let guard = 0;
  while (!R.over && guard++ < 90) {
    if (R.phase === 'reward') { const pr = R.persona, on = id => pr && pr.style && (def(id).tags || []).some(t => pr.tags.includes(t)); if (pr && pr.style && !R.offer.cards.some(on) && !R.rrd) { R.rrd = 1; const r = CM.rerollReward(R); if (r && r.ok) continue; } R.rrd = 0; const best = R.offer.cards.map((id, i) => ({ i, sc: scoreCard(R, id) })).sort((a, b) => b.sc - a.sc)[0]; if (best.sc >= 1.5 && (!pr || !pr.style || on(R.offer.cards[best.i]))) CM.takeReward(R, best.i); else CM.skipReward(R); continue; }
    if (G.day === 12 && !R.snap12) R.snap12 = [...new Set(R.deck.map(c => c.id).concat(R.gone || []))];
    if (mode !== 'nothing') STEWARD.tasks(S, G, st, { seed, ban: [] }).forEach(t => t());
    if (mode !== 'nothing') needlePlay(R);
    if (mode === 'random') dayRandom(R); else if (mode !== 'nothing') dayPlay(R);
    if (mode === 'nocombo') { G.cardCombosOff = true; }
    const T = process.env.TRACE ? { d: G.day, kin: G.kin.filter(m => m.kind !== 'spawn').length, sp: G.kin.length, org: G.cells.filter((c, i) => c.dug && c.type !== 'empty' && i !== G.core).map(c => c.type).join('+'), tr: G.cells.reduce((a, c) => a + c.traps.length, 0), g: Math.round(G.gold), hp: Math.round(G.slime.hp), st: G.slime.stage, path: (S.paths(G)[0] || []).length, hand: R.hand.length } : null;
    const g0 = G.gold, rr = CM.endDay(R, decide); { const b = rr.night && rr.night.battle; (R.curve = R.curve || []).push({ d: G.day - (R.phase === 'over' || G.over ? 0 : 1), n: b ? (b.count || b.party.length) : 0, g: Math.round(G.gold), dg: Math.round(G.gold - g0), hp: Math.round(G.slime.hp), fell: b ? !!b.fell : false }); } if (R.genome) (R.evoLog = R.evoLog || []).push([G.day, R.genome.evo || 0]); { const mq = (R.molts || []).length + (R.moltQ || 0); R.moltDays = R.moltDays || []; while (R.moltDays.length < mq) R.moltDays.push(G.day); } while (CM.moltPending(R)) CM.molt(R);
    if (T) { const b = rr.night && rr.night.battle; console.log(JSON.stringify(T) + (b ? ' | 밤 ' + b.count + '명 ' + b.result + ' 처치 ' + b.kills : ' | 조용') + ' → hp ' + Math.round(G.slime.hp) + (G.over ? ' 끝: ' + G.over.why : '')); }
  }
  return R;
}
module.exports = { play, scoreCard, STYLES };

if (require.main === module) {
  const n = +(process.argv[2] || 100), which = process.argv[3] || 'all', diff = +(process.argv[4] || 1), mode = process.argv[5] || '', keep = process.env.META === 'keep';
  const asps = which === 'all' ? CD.ASPS : [which], res = {}, cardWin = {}, cmb = {}; let meta = keep ? CM.newMeta() : null, unlockLog = [];
  const bodies = {}, lms = {}, top1 = {}; let molts = 0, geneCards = 0;
  const moltDay = [[], [], [], []]; let noMolt = 0;
  let snapN = 0, snapW = 0, wins = 0, tot = 0, days = 0, skills = 0, nightsWon = 0, actEnd = [0, 0, 0, 0, 0, 0], kinEnd = 0, cardsEnd = 0;
  for (let s = 1; s <= n; s++) {
    const a = asps[(s - 1) % asps.length], seed = s * 7919 + 13; let R;
    const fresh = () => { const m = CM.newMeta(); if (process.env.ALL) Object.keys(CD.UNLOCK).forEach(id => { m.unlocked[id] = 1; }); return m; };
    try { R = play(seed, a, diff, mode, keep ? meta : fresh()); } catch (e) { console.log('오류 seed', seed, e.stack.split('\n').slice(0, 4).join('\n')); continue; }
    { const g = R.genome; if (g) { const c = T.classOf(g), k = c.loco + '/' + c.post + '/' + c.plan + '/' + c.sym + ':' + T.topTags(g, 3).join('+'); bodies[k] = (bodies[k] || 0) + 1; const l = T.landmarkOf(g); if (l) lms[l.name] = (lms[l.name] || 0) + 1; molts += R.st.molts || 0; geneCards += R.st.geneCards || 0; top1[T.topTags(g, 1)[0]] = (top1[T.topTags(g, 1)[0]] || 0) + 1; } }
    (R.moltDays || []).slice(0, 4).forEach((d, k) => moltDay[k].push(d)); if (!(R.moltDays || []).length) noMolt++;
    const w = !!R.over.win; tot++; wins += w; days += R.G.day; skills += R.st.skills; nightsWon += R.st.nightsWon; kinEnd += R.G.kin.length; cardsEnd += R.deck.length;
    actEnd[w ? 5 : Math.min(5, Math.floor((R.G.day - 1) / 8) + 1)]++;
    res[a] = res[a] || { n: 0, w: 0 }; res[a].n++; res[a].w += w;
    for (const k in R.st) if (k.indexOf('cmb_') === 0) cmb[k] = (cmb[k] || 0) + R.st[k];
    if (R.snap12) { snapN++; snapW += w; R.snap12.forEach(id => { cardWin[id] = cardWin[id] || { n: 0, w: 0 }; cardWin[id].n++; cardWin[id].w += w; }); }
    if (keep) unlockLog.push(R.over.unlocks.length);
  }
  const pc = (a, b) => b ? Math.round(100 * a / b) : 0;
  console.log('카드 판 ' + tot + '판 · 난이도 ' + diff + (mode ? ' · ' + mode : '') + ' · 이김 ' + pc(wins, tot) + '% · 평균 날 ' + (days / tot).toFixed(1) + ' · 기술 ' + (skills / tot).toFixed(1) + '번 · 넘긴 밤 ' + (nightsWon / tot).toFixed(1) + ' · 판 끝 권속 ' + (kinEnd / tot).toFixed(1) + ' · 덱 ' + (cardsEnd / tot).toFixed(1));
  console.log('빛깔: ' + Object.keys(res).map(a => CD.ASPN[a] + ' ' + pc(res[a].w, res[a].n) + '%').join(' · '));
  console.log('끝난 막 (1~4막에서 짐, 5=이김): ' + actEnd.slice(1).join(' / '));
  console.log('족보(판당): ' + Object.keys(cmb).map(k => S.CMB[k.slice(4)].name + ' ' + (cmb[k] / tot).toFixed(1)).join(' · '));
  console.log('몸: 허물 ' + (molts / tot).toFixed(1) + '번 · 다시 쓴 카드 ' + (geneCards / tot).toFixed(1) + '장 · 서로 다른 몸(꼴+위 형질 셋) ' + Object.keys(bodies).length + ' · 이정표 ' + Object.keys(lms).length + '가지: ' + Object.keys(lms).map(k => k + ' ' + lms[k]).join(', '));
  { const med = a => { if (!a.length) return '-'; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; }; console.log('허물 날(가운데 값) 1~4번째: ' + moltDay.map(med).join(' / ') + ' · 첫 허물 4일째까지 ' + pc(moltDay[0].filter(d => d <= 4).length, tot) + '% · 허물 없이 끝 ' + pc(noMolt, tot) + '%'); }
  console.log('가장 큰 형질: ' + Object.keys(top1).sort((a, b) => top1[b] - top1[a]).map(k => T.TAGS[k].name + ' ' + top1[k]).join(' · '));
  if (keep) console.log('판마다 새로 연 조건: ' + unlockLog.join(' '));
  if (process.argv.includes('cards')) { const avg = snapW / Math.max(1, snapN); console.log('12일째까지 산 판 ' + snapN + ' · 그중 이김 ' + pc(snapW, snapN) + '% (카드 값은 12일째 덱 기준)'); rows = Object.keys(cardWin).filter(id => cardWin[id].n >= (+process.env.MINN || 30)).map(id => ({ id, n: cardWin[id].n, d: Math.round(100 * (cardWin[id].w / cardWin[id].n - avg)) })).sort((a, b) => b.d - a.d); console.log('잰 카드 ' + rows.length + '장 (덱 ' + (+process.env.MINN || 30) + '개 이상) · 가장 높은 ' + (rows[0] ? rows[0].d : 0) + ' · 가장 낮은 ' + (rows.length ? rows[rows.length - 1].d : 0)); console.log('덱에 있을 때 승률 차 (높은 것): ' + rows.slice(0, 8).map(r => CD.BY[r.id].name + ' ' + (r.d > 0 ? '+' : '') + r.d + '(' + r.n + ')').join(' · ')); console.log('낮은 것: ' + rows.slice(-8).map(r => CD.BY[r.id].name + ' ' + r.d + '(' + r.n + ')').join(' · ')); }
}
