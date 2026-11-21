// 옛 것의 둥지 — 카드로 짓는 판 (규칙). 화면이 없다(node 에서도 돈다).
// 낮: 아침마다 덱에서 다섯 장을 받아 지도에 놓는다. 굴 카드로만 둥지가 넓어진다. 기술 카드는 손에 쥔 채 밤으로 간다.
// 밤: logic.js 의 싸움이 그대로 저절로 돈다. 무리가 방에 들면 멈추고, 쥔 기술 카드를 쓸 수 있다(신앙).
// 밤이 끝나면: 쓴 기술은 버린 더미로, 손은 둘까지 남기고 버린다. 보상 셋 중 하나, 상점, 강화, 빼기, 바늘 점.
const CARDMODE = (function () {
  const N = typeof NEST !== 'undefined' ? NEST : require('./logic.js');
  const CD = typeof CARDS2 !== 'undefined' ? CARDS2 : require('./cards2.js');
  const ASPS = CD.ASPS;
  const K = {
    draw: 5, retain: 2, retainMax: 4, handMax: 10, startGold: 170, reward: 3, reroll: 12, upEss: 45, rmEss: 35,
    rarW: { c: 60, u: 32, r: 8 }, pity: 3, shopN: 4, shopPrice: { c: 34, u: 58, r: 96 }, unlockCap: 8, words: 3,
    needleDig: 0.05, infMax: 3, burn: 15, ease: [0.7, 0.85], easeDays: 6, maxRows: 8, leaveMax: 2, drawLate: (typeof process !== 'undefined' && process.env && process.env.DRAWLATE != null ? +process.env.DRAWLATE : 1),
    // 빛깔마다 처음 진액이 조금 다르다: 기아는 굶은 채로, 황혼은 사람들이 바친 것을 들고 온다
    goldBy: (typeof process !== 'undefined' && process.env && process.env.GOLDBY ? JSON.parse(process.env.GOLDBY) : { hunger: -35, dusk: 55 }),
  };
  // ---- 씨앗 ----
  const rnd = R => { let t = (R.rs = (R.rs + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (R, a) => a[Math.floor(rnd(R) * a.length)];
  const shuffle = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(R) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ok = (msg, x) => Object.assign({ ok: true, msg }, x || {}), fail = msg => ({ ok: false, msg });
  // 게놈(genome.js)은 나중에 읽힌다: 다시 쓴 카드(gx_/gc_)는 id 로부터 그때 만든다
  const GEN = () => (typeof GENOME !== 'undefined' ? GENOME : (typeof require !== 'undefined' ? require('./genome.js') : null));
  // 이야기(campaign.js): 장마다 덱·보상·밤이 정해진 판. R.camp 가 있을 때만 부른다
  const CMP = () => (typeof CAMPAIGN !== 'undefined' ? CAMPAIGN : (typeof require !== 'undefined' ? require('./campaign.js') : null));
  const def = c => CD.BY[c.id] || (GEN() && GEN().ensure(c.id));
  const card = (R, uid) => R.deck.find(c => c.uid === uid);
  const cmG = R => N.cm(R.G);

  // ---- 말 배우기: 처음엔 낯선 이름, 같은 것을 K.words 번 넘긴 밤이 쌓이면 사람 말로 ----
  const ALIEN = { villager: '따뜻한 것', fisher: '젖은 손', militia: '막대기 든 것', captain: '소리치는 것', detective: '냄새 맡는 것', apprentice: '중얼거리는 작은 것', warrior: '쇠를 입은 것', smuggler: '그림자 손', priest: '빛을 두른 것', scholar: '글을 품은 것', herbalist: '풀 냄새 나는 것', soldier: '쇠를 두른 벽', chaplain: '빛을 든 쇠', sealer: '꿰매는 것', hound: '네 발 이빨', handler: '줄 쥔 것', sapper: '땅 긁는 것', torch: '불 든 것', firemage: '불을 부르는 것', banner: '천을 든 것', master: '고요한 것', shadow: '소리 없는 것', crowd: '몰려오는 것들', lightcrew: '빛 무리', sentry: '차가운 것', shielder: '빛으로 된 벽', seeker: '책을 든 것', seeker0: '책을 든 것', seeker1: '책을 든 것', seeker2: '책을 든 것' };
  const realName = (world, kind) => String(kind).indexOf('seeker') === 0 ? '책을 쫓는 자' : ((N.WORLD[world] && N.WORLD[world].inv && N.WORLD[world].inv[kind]) || (N.INV[kind] && N.INV[kind].name) || kind);
  function knownName(meta, world, kind) { return meta && ((meta.known && meta.known[kind]) || (meta.words && (meta.words[kind] || 0) >= K.words)) ? realName(world, kind) : (ALIEN[kind] || '낯선 것'); }

  // ---- 판 ----
  function newMeta() { return { runs: 0, actBy: {}, winBy: {}, words: {}, worlds: {}, unlocked: {}, parts: {}, tot: {}, queue: [] }; }
  function newRun(seed, o) {
    o = o || {}; const ps = o.proSeed || null, aspect = ASPS.includes(o.aspect) ? o.aspect : ps && ASPS.includes(ps.aspect) ? ps.aspect : ASPS[seed % 5], meta = o.meta || newMeta();
    if (ps && !o.look && ps.look) o.look = ps.look;
    const pr = Object.assign(N.proResult(aspect, 'avg'), { kin: [], skipped: true });
    const G = N.newGame(seed, aspect, { cards: true, diff: o.diff || 1, world: o.world || undefined, prologue: pr });
    if (o.look) G.slime.look = String(o.look);
    N.openTrail(G); N.breach(G); G.gold = K.startGold + (K.goldBy[aspect] || 0);
    // 처음 하는 사람은 첫 판·둘째 판의 앞 여섯 밤이 조금 순하다 (o.ease 로 정할 수 있다; 이야기 장은 1)
    const ease = o.ease != null ? o.ease : (meta.runs | 0) === 0 ? K.ease[0] : (meta.runs | 0) === 1 ? K.ease[1] : 1;
    const R = { seed, rs: (seed ^ 0x5bd1e995) >>> 0, G, meta, aspect, ease, camp: o.camp ? { ch: o.camp.ch } : null, deck: [], drawP: [], hand: [], disc: [], nextUid: 1, retain: K.retain, phase: 'day', offer: null, shop: null, needle: null, needleOffer: false, needlePity: 0, pity: 0, learned: [], log: [], over: null,
      st: { kills: 0, swallow: 0, infRise: 0, spawned: 0, skills: 0, nightsWon: 0, captives: 0, kinEvo: 0, secrets: 0, digs: 0, shapes: 0, organs: 0, traps: 0, digestEss: 0, needleWins: 0, needleBig: 0, blocks: 0, bossWon: 0, limbKills: 0, curses: 0, maxGold: K.startGold } };
    CD.START[aspect].forEach(id => addCard(R, id));
    // 한 방울에서 단 부위: 기억해 두고(팔다리 카드가 열린다), 가장 높은 둘은 처음 덱에 팔다리 카드로 든다
    if (ps) { R.proSeed = ps; const parts = (ps.parts || []).filter(p => p && p.id); rememberParts(meta, parts.map(p => p.id)); parts.slice().sort((a, b) => (b.lv || 1) - (a.lv || 1)).slice(0, 2).forEach(p => { if (CD.BY['lb_' + p.id]) addCard(R, 'lb_' + p.id); }); }
    if (GEN()) GEN().start(R, o.egg || null);
    R.drawP = shuffle(R, R.deck.map(c => c.uid));
    // 첫 아침에는 권속 둘과 굴 하나가 먼저 온다
    const first = R.deck.filter(c => def(c).type === 'kin').concat(R.deck.filter(c => def(c).type === 'shape').slice(0, 1)).map(c => c.uid); R.drawP = first.concat(R.drawP.filter(u => !first.includes(u)));
    morning(R);
    return R;
  }
  function addCard(R, id, up) { const c = { uid: R.nextUid++, id, up: up ? 1 : 0 }; R.deck.push(c); return c; }

  // ---- 카드 값 ----
  function costOf(R, c) { const d = def(c); if (d.type === 'skill' || d.type === 'curse') return d.type === 'curse' ? Math.round((d.burn || K.burn) * cmG(R)) : 0; return Math.round(d.cost * cmG(R) * (c.up && d.type !== 'kin' ? 0.75 : 1)); }
  function view(R, c) {
    const d = def(c), tg = targetKind(d);
    return { uid: c.uid, id: d.id, name: d.name + (c.up ? '+' : ''), type: d.type, typeName: CD.TYPEN[d.type], asp: d.asp, aspName: CD.ASPN[d.asp], rar: d.rar, rarName: CD.RARN[d.rar], cost: costOf(R, c), text: d.face || d.text, face: d.face || d.text, more: d.more, up: c.up, target: tg, gene: d.gene || null, from: d.from || null, combo: d.combo || null, cells: d.cells || null, spell: d.spell || null, kin: d.kin || null, room: d.room || null, trap: d.trap || null };
  }
  const targetKind = d => d.type === 'shape' ? (d.op ? 'cell' : 'shape') : d.type === 'organ' || d.type === 'trap' ? 'cell' : d.type === 'boon' && (d.fx.copy || d.fx.trapUp) ? 'none' : 'none';

  // ---- 덱 → 손 ----
  function draw(R, n) {
    const got = [];
    for (let i = 0; i < n; i++) {
      if (R.hand.length >= K.handMax) break;
      if (!R.drawP.length) { if (!R.disc.length) break; R.drawP = shuffle(R, R.disc.splice(0)); }
      const uid = R.drawP.shift(); R.hand.push(uid); got.push(uid); onDraw(R, card(R, uid));
    }
    return got;
  }
  // 받는 순간 일이 생기는 저주
  function onDraw(R, c) {
    const d = def(c), G = R.G; if (d.type !== 'curse') return;
    if (d.fx.cavein) { const cs = G.cells.map((x, i) => i).filter(i => G.cells[i].dug && i !== G.core && i !== G.ent && G.cells[i].type !== 'empty'); if (cs.length) { const i = pick(R, cs); G.cells[i].type = 'empty'; G.cells[i].casp = null; R.log.push('무너짐: ' + i + '번 칸의 기관이 무너졌다'); } }
    if (d.fx.hurt) { const ks = G.kin.filter(m => m.kind !== 'spawn' && !m.hurt); if (ks.length) { pick(R, ks).hurt = 2; R.log.push('썩은 살: 권속 하나가 다쳤다'); } }
  }
  // 3막에서는 굴이 깊어 손이 하나 는다 (판이 꽉 찬 뒤에도 할 일이 남게)
  const drawN = R => K.draw + (R.G && R.G.day > 2 * N.K.act ? K.drawLate : 0);
  const inHand = (R, pred) => R.hand.map(u => card(R, u)).filter(c => pred(def(c), c));
  function morning(R) {
    const G = R.G; if (G.over) return; R.sinkN = {};
    // 붙잡아 둔 것들은 아침에 삼킨다 (카드 판에는 몸값·개종이 없다)
    if (G.prison && G.prison.length) { let e = 0; const n = G.prison.length; G.prison.splice(0).forEach(p => { e += Math.round(((N.INV[p.kind] || {}).gold || 10) * 0.5 * cmG(R)); }); G.stats.eaten = (G.stats.eaten || 0) + n; if (e) { G.gold += e; G.stats.income['삼킨 것'] = (G.stats.income['삼킨 것'] || 0) + e; } R.log.push('붙잡아 둔 것들을 삼켰다 (' + n + ')' + (e ? ' · 진액 +' + e : '')); }
    if (R.camp && CMP()) CMP().morning(R);
    // 감염체가 일어난다
    const ni = Math.min(K.infMax, G.cardInf || 0); for (let i = 0; i < ni; i++) N.cardKin(G, 'licker', { name: '감염체', infected: true }); if (ni) { R.st.infRise += ni; G.stats.risen = (G.stats.risen || 0) + ni; R.log.push('감염체 ' + ni + '이(가) 일어났다'); } G.cardInf = 0;
    // 손에 든 저주
    inHand(R, d => d.type === 'curse').forEach(c => { const f = def(c).fx; if (f.tax) G.gold -= Math.round(f.tax * cmG(R)); if (f.faithTax) G.faith = Math.max(0, G.faith - f.faithTax); });
    const less = inHand(R, d => d.type === 'curse' && d.fx.drawLess).length;
    draw(R, Math.max(1, drawN(R) + (G.cardDrawBonus || 0) - less)); G.cardDrawBonus = 0;
    R.shop = shopOffer(R); syncHeld(R);
    R.st.curses = inHand(R, d => d.type === 'curse').length;
  }
  // 덱을 바꾼 뒤 아침을 다시 받는다 (이야기 장의 처음 덱)
  function reMorning(R) { if (R.camp && CMP()) CMP().morning(R); draw(R, drawN(R)); R.shop = shopOffer(R); syncHeld(R); }
  // 손에 쥔 기술 카드 = 밤에 쓸 수 있는 것
  function syncHeld(R) {
    const tax = inHand(R, d => d.type === 'curse' && d.fx.skillTax).length * 0.5;
    R.G.cardHeld = inHand(R, d => d.type === 'skill').map(c => { const d = def(c); return { uid: c.uid, spell: d.spell, pow: d.pow * (c.up ? 1.3 : 1), cost: d.cmul * (c.up ? 0.8 : 1) + tax, x: d.x || null, used: false }; });
  }

  // ---- 굴 모양 놓기 ----
  const rot = (p, r) => { let [x, y] = p; for (let k = 0; k < r; k++) [x, y] = [-y, x]; return [x, y]; };
  function shapePlacements(R, d) {
    const G = R.G, C = G.cols, Rw = G.rows, out = [], seen = new Set();
    const dug = i => G.cells[i].dug;
    for (let a = 0; a < G.cells.length; a++) {
      const ax = a % C, ay = Math.floor(a / C);
      for (let r = 0; r < 4; r++) {
        const cells = []; let bad = false;
        for (const p of d.cells) { const [dx, dy] = rot(p, r), x = ax + dx, y = ay + dy; if (x < 0 || y < 0 || x >= C || y >= Rw) { bad = true; break; } const i = y * C + x; if (dug(i)) { bad = true; break; } cells.push(i); }
        if (bad) continue;
        const key = cells.slice().sort((p, q) => p - q).join(','); if (seen.has(key)) continue;
        const touch = cells.some(i => N.nbrs(G, i).some(j => dug(j) && !cells.includes(j)));
        if (!touch) continue;
        if (d.bridge && N.nbrs(G, cells[0]).filter(dug).length < 2) continue;
        seen.add(key); out.push({ cells, anchor: cells[0], rot: r });
      }
    }
    return out;
  }
  // 칸을 고르는 카드가 놓일 수 있는 칸
  function cellsFor(R, c) {
    const d = def(c), G = R.G, ids = G.cells.map((x, i) => i);
    if (d.type === 'shape' && d.op === 'block') return ids.filter(i => G.cells[i].dug && !G.cells[i].block && i !== G.core && i !== G.ent && (() => { G.cells[i].block = true; const okp = N.paths(G).length > 0; G.cells[i].block = false; return okp; })());
    if (d.type === 'shape' && d.op === 'unblock') return ids.filter(i => G.cells[i].block);
    if (d.type === 'shape' && d.op === 'deepen') return ids.filter(i => G.cells[i].dug && i !== G.core && (G.cells[i].lv || 1) < 3);
    if (d.type === 'organ') return ids.filter(i => G.cells[i].dug && i !== G.core && !G.cells[i].block && (G.cells[i].type !== d.room || (G.cells[i].lv || 1) < 3));
    if (d.type === 'trap') return ids.filter(i => G.cells[i].dug && i !== G.core && !G.cells[i].block && (G.cells[i].traps.length < N.cardTrapCap(G.cells[i]) || G.cells[i].traps.some(t => (t.lv || 1) < 3)));
    return [];
  }
  function canPlay(R, uid) {
    if (R.phase !== 'day') return '낮에만 놓는다'; const c = card(R, uid); if (!c || !R.hand.includes(uid)) return '손에 없는 카드다';
    const d = def(c); if (d.type === 'skill') return '밤에 무리가 방에 들 때 쓴다';
    if (R.G.gold < costOf(R, c)) return '진액이 모자란다';
    if (d.type === 'shape' && !d.op && !shapePlacements(R, d).length) return '놓을 자리가 없다';
    if (targetKind(d) === 'cell' && !cellsFor(R, c).length) return '놓을 칸이 없다';
    return null;
  }
  // 카드를 낸다. tgt: 모양이면 { cells }, 칸이면 { cell }
  function play(R, uid, tgt) {
    const why = canPlay(R, uid); if (why) return fail(why);
    const c = card(R, uid), d = def(c), G = R.G, cost = costOf(R, c); tgt = tgt || {}; let res = null;
    if (d.type === 'curse') { G.gold -= cost; discard(R, uid); return ok(d.name + '을(를) 태워 버렸다'); }
    if (d.type === 'shape' && !d.op) {
      const opts = shapePlacements(R, d), key = (tgt.cells || []).slice().sort((p, q) => p - q).join(','), o = opts.find(p => p.cells.slice().sort((x, y) => x - y).join(',') === key) || (tgt.cells ? null : opts[0]);
      if (!o) return fail('그 자리에는 놓을 수 없다');
      const found = []; o.cells.forEach(i => { const r = N.cardDig(G, i); if (r.found) found.push(r.msg); R.st.digs++; if (rnd(R) < K.needleDig) R.needleOffer = true; });
      if (d.gift) N.cardTrap(G, o.cells[0], { kind: d.gift, lv: 1, pow: 1, asp: d.asp, name: N.TRAP[d.gift].name, cid: d.id });
      R.st.shapes++; res = ok(d.name + ': ' + o.cells.length + '칸을 팠다' + (found.length ? ' · ' + found.join(' · ') : ''), { cells: o.cells, found });
    } else if (targetKind(d) === 'cell') {
      const cs = cellsFor(R, c), i = tgt.cell != null ? +tgt.cell : cs[0]; if (!cs.includes(i)) return fail('그 칸에는 놓을 수 없다');
      if (d.op === 'block') { G.cells[i].block = true; G.kin.forEach(m => { if (m.loc === i) m.loc = null; }); N.autoPlace(G); R.st.blocks++; res = ok('흙벽: 길이 돌아간다'); }
      else if (d.op === 'unblock') { G.cells[i].block = false; res = ok('틈을 냈다'); }
      else if (d.op === 'deepen') { G.cells[i].lv = Math.min(3, (G.cells[i].lv || 1) + 1); res = ok('굴이 깊어졌다 (레벨 ' + G.cells[i].lv + ')'); }
      else if (d.type === 'organ' && G.cells[i].type === d.room) { G.cells[i].lv = Math.min(3, (G.cells[i].lv || 1) + 1 + (c.up ? 1 : 0)); G.stats.organsGrown = (G.stats.organsGrown || 0) + 1; R.st.organs++; res = ok(d.name + '이(가) 자랐다 · 레벨 ' + G.cells[i].lv); }
      else if (d.type === 'organ') { const r = N.cardBuild(G, i, d.room, d.asp === 'none' ? null : d.asp); if (!r.ok) return r; if (c.up || d.lv2) G.cells[i].lv = Math.max(G.cells[i].lv || 1, 2); if (d.reveal) { const cs = N.nbrs(G, i).filter(j => !G.cells[j].dug); if (cs.length) { N.cardDig(G, pick(R, cs)); R.st.digs++; } } R.st.organs++; res = ok(d.name + '이(가) 돋았다'); }
      else if (d.type === 'trap' && G.cells[i].traps.length >= N.cardTrapCap(G.cells[i])) { const t = G.cells[i].traps.slice().sort((a, b) => (a.lv || 1) - (b.lv || 1))[0]; t.lv = Math.min(3, (t.lv || 1) + 1); t.pow = Math.max(t.pow || 1, d.pow || 1); if (d.also) t.also = [...new Set([].concat(t.also || [], d.also))].filter(k => k !== t.kind); G.stats.trapsGrown = (G.stats.trapsGrown || 0) + 1; R.st.traps++; res = ok(t.name + '이(가) 굳어졌다 · 레벨 ' + t.lv); }
      else if (d.type === 'trap') { const r = N.cardTrap(G, i, { kind: d.trap, lv: Math.min(3, (d.lv || 1) + (c.up ? 1 : 0)), pow: d.pow || 1, asp: d.asp === 'none' ? null : d.asp, name: d.name, cid: d.id, also: d.also || null }); if (!r.ok) return r; R.st.traps++; res = r; }
    } else if (d.type === 'kin') {
      const n = d.n || 1, got = []; for (let k = 0; k < n; k++) { const r = N.cardKin(G, d.kin, { lv: (d.lv || 0) + (c.up ? 2 : 0), rare: !!d.rare }); if (r.ok) got.push(r.kin); }
      for (let k = 0; k < (d.plus || 0); k++) { const r = N.cardKin(G, 'spawn'); if (r.ok) got.push(r.kin); }
      res = ok(got.map(m => CD.kname ? CD.kname(m.kind) : N.KIN[m.kind].name).join(', ') + ' 들어왔다');
    } else if (d.type === 'boon') { res = boon(R, c, d.fx, tgt); if (!res.ok) return res; }
    R.playN = R.playN || {}; R.playN[G.day] = (R.playN[G.day] || 0) + 1;
    G.gold -= cost; R.st.maxGold = Math.max(R.st.maxGold, G.gold);
    gs(G, 'cardsBy', d.type); gs(G, 'cardsAsp', d.asp); if (d.type !== 'shape') (d.tags || []).forEach(t => gs(G, 'cardTags', t)); if (d.type === 'shape') G.stats.shapesPlaced = (G.stats.shapesPlaced || 0) + 1; if (d.type === 'organ') G.stats.organsPlaced = (G.stats.organsPlaced || 0) + 1; if (d.type === 'trap') G.stats.trapsPlaced = (G.stats.trapsPlaced || 0) + 1;
    if (d.type === 'kin') exhaust(R, uid); else discard(R, uid); syncHeld(R);
    return res;
  }
  // 권속 카드는 내면 덱을 떠난다: 카드가 둥지에 사는 권속이 된다
  function exhaust(R, uid) { const k = R.hand.indexOf(uid); if (k >= 0) R.hand.splice(k, 1); const c = card(R, uid); if (c) { R.deck.splice(R.deck.indexOf(c), 1); R.gone = (R.gone || []).concat([c.id]); } }
  // 몸의 버릇을 세는 수 (게놈 단계가 읽는다): G.stats[group][key]++
  function gs(G, group, key, n) { G.stats[group] = G.stats[group] || {}; G.stats[group][key] = (G.stats[group][key] || 0) + (n == null ? 1 : n); }
  function discard(R, uid) { const k = R.hand.indexOf(uid); if (k >= 0) R.hand.splice(k, 1); if (card(R, uid)) R.disc.push(uid); }
  function boon(R, c, fx, tgt) {
    const G = R.G, max = N.slimeStats(G).hp, msgs = [];
    if (fx.draw) { discard(R, c.uid); draw(R, fx.draw); R.hand.push(c.uid); R.disc.splice(R.disc.indexOf(c.uid), 1); msgs.push(fx.draw + '장 더'); }
    if (fx.ess) { G.gold += Math.round(fx.ess * cmG(R) * (c.up ? 1.5 : 1)); msgs.push('진액'); }
    if (fx.faith) { G.faith = Math.min(N.faithCap(G), G.faith + fx.faith * (c.up ? 1.5 : 1)); msgs.push('신앙'); }
    if (fx.heal) { G.slime.hp = Math.min(max, G.slime.hp + max * fx.heal); msgs.push('본체가 아문다'); }
    if (fx.retain) { R.retain = Math.min(K.retainMax, R.retain + fx.retain); msgs.push('남기는 카드 ' + R.retain); }
    if (fx.reroll) { const others = R.hand.filter(u => u !== c.uid); others.forEach(u => discard(R, u)); draw(R, others.length); msgs.push('손을 갈았다'); }
    if (fx.kinHeal) { G.kin.forEach(m => { m.hurt = 0; }); msgs.push('권속이 나았다'); }
    if (fx.kinExp) { G.kin.forEach(m => N.giveExp(m, fx.kinExp)); msgs.push('권속이 꿈을 나눠 받았다'); }
    if (fx.essAsp) { const a = G.slime.main || G.startAsp; G.slime.ess[a] += fx.essAsp; msgs.push('빛깔'); }
    if (fx.reveal) { const cs = G.cells.map((x, i) => i).filter(i => !G.cells[i].dug && N.nbrs(G, i).some(j => G.cells[j].dug)); if (cs.length) { const i = pick(R, cs); const r = N.cardDig(G, i); R.st.digs++; msgs.push(r.msg); } }
    if (fx.copy) { const others = R.hand.filter(u => u !== c.uid && def(card(R, u)).type !== 'curse'); const u = tgt.uid && others.includes(tgt.uid) ? tgt.uid : others[0]; if (!u) return fail('복사할 카드가 없다'); const cc = addCard(R, card(R, u).id, card(R, u).up); R.disc.push(cc.uid); msgs.push(def(cc).name + ' 복사'); }
    if (fx.trapUp) { const ts = []; G.cells.forEach((x, i) => x.traps.forEach(t => { if (t.lv < 3) ts.push(t); })); if (!ts.length) return fail('키울 함정이 없다'); ts.sort((a, b) => a.lv - b.lv)[0].lv++; msgs.push('함정이 자랐다'); }
    if (fx.needle) { R.needleOffer = true; msgs.push('바늘 냄새'); }
    return ok(def(c).name + ': ' + msgs.join(' · '));
  }

  // ---- 밤 ----
  // decide 는 logic.js 의 밤 물음을 받는 함수 (steward.decide 와 같다). keep = 손에 남길 카드 uid (R.retain 장까지)
  // 밤은 셋으로 나뉜다: 밤 앞(nightBegin) → 원래 게임의 밤(N.beginNight 또는 N.endDay) → 밤 뒤(nightEnd).
  // 화면은 밤 앞·뒤를 이 함수로 부르고 가운데만 보여 주며 돈다. 규칙이 밤을 한 번만 돌리므로 화면과 규칙이 어긋날 수 없다.
  // 카드 판의 허물은 달력(정산일 정수)이 아니라 한 일의 양으로 온다: 밤 동안 정수를 잠시 비워 원래 게임의 허물을 막는다.
  function nightBegin(R) {
    if (R.phase !== 'day') return fail('낮이 아니다');
    const G = R.G; while (R.moltQ && GEN()) GEN().molt(R); syncHeld(R);
    const cmb = N.cardCombos(G), mt = G.march.tonight; cmb.forEach(x => { R.st['cmb_' + x.id] = (R.st['cmb_' + x.id] || 0) + 1; gs(G, 'cmb', x.id); }); G.stats.combos = (G.stats.combos || 0) + cmb.length;
    if (mt && G.kin.filter(m => m.kind !== 'spawn' && m.loc !== null).length <= 1) G.stats.nightsAlone = (G.stats.nightsAlone || 0) + 1;
    const curse = inHand(R, d => d.type === 'curse');
    if (mt && curse.some(c => def(c).fx.angry)) mt.angry = true;
    curse.forEach(c => { if (def(c).fx.nightTax) G.gold = Math.max(0, G.gold - Math.round(def(c).fx.nightTax * cmG(R))); });
    const ess = Object.assign({}, G.slime.ess); Object.keys(G.slime.ess).forEach(a => { G.slime.ess[a] = 0; });
    if (easeOn(R)) { R.easeD = { b: G.detBonus, a: G.detBonus * R.ease }; G.detBonus = R.easeD.a; }
    R.night0 = { kin0: G.kin.filter(m => m.kind !== 'spawn').map(m => m.id), hp0: G.slime.hp, st0: G.slime.stage, ess };
    return ok('밤');
  }
  const easeOn = R => R.ease != null && R.ease < 1 && R.G.day <= K.easeDays && !!R.G.march.tonight && !R.G.march.tonight.kinds;
  function nightEnd(R, r, keep) {
    if (R.easeD) { if (Math.abs(R.G.detBonus - R.easeD.a) < 1e-9) R.G.detBonus = R.easeD.b; R.easeD = null; }
    const G = R.G, n0 = R.night0 || { kin0: [], hp0: G.slime.hp, st0: G.slime.stage, ess: {} }; R.night0 = null; r = r || { battle: null, settle: null }; if (G.gold < 0) G.gold = 0;
    Object.keys(n0.ess || {}).forEach(a => { G.slime.ess[a] = (n0.ess[a] || 0) + (G.slime.ess[a] || 0); });
    if (G.slime.stage > n0.st0) R.moltQ = (R.moltQ || 0) + (G.slime.stage - n0.st0);
    (G.cardUsed || []).forEach(uid => { const c = R.deck.find(x => x.uid === uid), d = c && def(c); if (d) (d.tags || []).forEach(t => gs(G, 'cardTags', t)); discard(R, uid); }); G.cardUsed = []; G.cardHeld = [];
    { const now = new Set(G.kin.map(m => m.id)), lost = n0.kin0.filter(id => !now.has(id)).length; if (lost) G.stats.kinLost = (G.stats.kinLost || 0) + lost; if (r.battle) G.stats.coreDamage = (G.stats.coreDamage || 0) + Math.max(0, Math.round(n0.hp0 - G.slime.hp)); }
    if (r.battle) { G.stats.routs = (G.stats.routs || 0) + (r.battle.fled || 0); if (!G.over && !r.battle.party.some(u => ['torch', 'lightcrew'].includes(u.kind) || (N.INV[u.kind] && N.INV[u.kind].flood))) G.stats.nightsDark = (G.stats.nightsDark || 0) + 1; }
    syncCounters(R); if (GEN() && R.genome) { GEN().feed(R, behaviour(R)); if (!G.over && GEN().ripe) GEN().ripe(R); }
    R.st.skills = G.stats.skills || 0;
    // 손은 R.retain 장까지 남긴다 (고르지 않았으면 기술 먼저)
    const want = (keep || R.hand.slice().sort((a, b) => (def(card(R, b)).type === 'skill') - (def(card(R, a)).type === 'skill'))).filter(u => R.hand.includes(u) && def(card(R, u)).type !== 'curse').slice(0, R.retain);
    R.hand.slice().forEach(u => { if (!want.includes(u) && def(card(R, u)).type !== 'curse') discard(R, u); });
    if (r.battle) {
      if (!G.over) R.st.nightsWon++;
      const kinds = [...new Set(r.battle.party.map(u => u.kind))], boss = kinds.some(k => N.INV[k] && N.INV[k].boss);
      if (!G.over) { R.meta.words = R.meta.words || {}; kinds.forEach(k => { const need = R.wordsNeed || K.words; R.meta.known = R.meta.known || {}; const was = !!R.meta.known[k] || (R.meta.words[k] || 0) >= K.words; R.meta.words[k] = (R.meta.words[k] || 0) + 1; if (!was && R.meta.words[k] >= need) { R.meta.known[k] = 1; R.learned.push({ kind: k, from: ALIEN[k] || '낯선 것', to: realName(G.world, k) }); G.stats.wordsLearned = (G.stats.wordsLearned || 0) + 1; } }); }
      if (boss && !G.over) { R.st.bossWon++; G.stats.bossKills = (G.stats.bossKills || 0) + 1; R.needleOffer = true; }
      if (!G.over) { R.offer = rewardOffer(R, boss); R.phase = 'reward'; }
    }
    if (R.camp && CMP()) CMP().afterNight(R, r);
    if (G.world) { R.meta.worlds = R.meta.worlds || {}; R.meta.worlds[G.world] = 1; }
    if (G.over) { endRun(R); return Object.assign({ ok: true }, { night: r }); }
    if (R.phase === 'day') morning(R);
    return { ok: true, night: r };
  }
  function endDay(R, decide, keep) {
    const b = nightBegin(R); if (!b.ok) return b;
    const r = N.endDay(R.G, decide || (() => ({ k: 'none' })));
    return nightEnd(R, r, keep);
  }
  // 오늘 밤을 미리 굴려 본다 (판을 건드리지 않는다): 손을 쓰지 않으면 어떻게 끝나나
  function foresee(R) {
    const G0 = R.G; if (!G0.march.tonight || R.phase !== 'day') return null;
    let G; try { G = JSON.parse(JSON.stringify(G0)); } catch (e) { return null; }
    G.cardHeld = []; const hp0 = G.slime.hp, falls0 = G.falls || 0; if (easeOn(R)) G.detBonus *= R.ease;
    Object.keys(G.slime.ess).forEach(a => { G.slime.ess[a] = 0; });
    let r; try { r = N.endDay(G, () => ({ k: 'none' })); } catch (e) { return null; }
    const b = r && r.battle; if (!b) return null;
    const n = b.party.length || b.count || 0, stopped = Math.min(n, (b.kills || 0) + (b.fled || 0) + ((b.captives || []).length)), fell = !!b.fell || (G.falls || 0) > falls0 || !!G.over;
    const lost = Math.max(0, hp0 - G.slime.hp) / Math.max(1, hp0);
    const level = fell ? 'fatal' : (b.result === 'repel' && lost < 0.15 ? 'safe' : 'risk');
    const cnt = {}; b.party.forEach(u => { cnt[u.kind] = (cnt[u.kind] || 0) + 1; });
    return { n, stopped, fell, lost: +lost.toFixed(2), level, result: b.result, kinds: Object.keys(cnt), count: cnt };
  }

  // ---- 보상: 셋 중 하나 ----
  const openPool = R => CD.LIST.filter(d => d.type !== 'curse' && (R.camp && CMP() ? CMP().poolOk(R, d) : CD.isOpen(d, R.meta)));
  function rollRar(R, boost) { const w = Object.assign({}, K.rarW); if (boost) { w.u += 20; w.r += 12; } const t = w.c + w.u + w.r; let x = rnd(R) * t; return x < w.c ? 'c' : (x -= w.c) < w.u ? 'u' : 'r'; }
  function rollCard(R, boost, used) {
    const pool = openPool(R), mine = d => d.asp === R.aspect || d.asp === 'none';
    for (let tries = 0; tries < 20; tries++) {
      const rar = rollRar(R, boost), cand = pool.filter(d => (d.rar === rar || (rar === 'c' && d.rar === 's')) && !used.includes(d.id)), own = cand.filter(mine), list = own.length && rnd(R) < 0.7 ? own : cand;
      if (list.length) return pick(R, list);
    }
    return pick(R, pool);
  }
  function rewardOffer(R, boss) {
    const used = []; for (let i = 0; i < K.reward; i++) used.push(rollCard(R, boss, used).id);
    if (!used.some(id => CD.BY[id].rar !== 'c')) { R.pity++; if (R.pity >= K.pity) { const up = openPool(R).filter(d => d.rar === 'u' && !used.includes(d.id)); if (up.length) used[0] = pick(R, up).id; R.pity = 0; } } else R.pity = 0;
    return { cards: used, boss: !!boss };
  }
  function takeReward(R, i) { if (R.phase !== 'reward' || !R.offer) return fail('고를 것이 없다'); const id = R.offer.cards[i]; if (!id) return fail('없는 카드다'); const c = addCard(R, id); R.disc.push(c.uid); R.offer = null; R.phase = 'day'; morning(R); return ok(CD.BY[id].name + '을(를) 덱에 넣었다', { card: c }); }
  function skipReward(R) { if (R.phase !== 'reward') return fail('고를 것이 없다'); R.offer = null; R.phase = 'day'; morning(R); return ok('받지 않았다'); }
  function rerollReward(R) { if (R.phase !== 'reward') return fail('고를 것이 없다'); const c = Math.round(K.reroll * cmG(R)); if (R.G.gold < c) return fail('진액이 모자란다'); R.G.gold -= c; R.offer = rewardOffer(R, R.offer.boss); return ok('다시 뽑았다'); }

  // ---- 상점·강화·빼기 (낮에 진액으로) ----
  function shopOffer(R) { const used = []; for (let i = 0; i < K.shopN; i++) used.push(rollCard(R, false, used).id); return used.map(id => ({ id, price: Math.round(K.shopPrice[CD.BY[id].rar === 's' ? 'c' : CD.BY[id].rar] * cmG(R)), sold: false })); }
  function shopBuy(R, i) { const s = R.shop && R.shop[i]; if (!s || s.sold) return fail('없는 물건이다'); if (R.G.gold < s.price) return fail('진액이 모자란다'); R.G.gold -= s.price; s.sold = true; const c = addCard(R, s.id); R.disc.push(c.uid); return ok(CD.BY[s.id].name + '을(를) 샀다'); }
  const upCost = R => Math.round(K.upEss * cmG(R)), rmCost = R => Math.round(K.rmEss * cmG(R));
  // ---- 진액을 쓸 곳: 같은 날 거듭할수록 값이 오른다 ----
  const SINK = { redraw: { name: '손을 다시 받는다', base: 22, step: 14 }, draw: { name: '한 장 더 받는다', base: 28, step: 18 }, feed: { name: '권속을 먹인다', base: 45, step: 25 }, hurry: { name: '허물을 재촉한다', base: 70, step: 40 }, delve: { name: '한 층 더 판다', base: 110, step: 90 } };
  const freeEdge = G => G.cells.some((x, i) => !x.dug && N.nbrs(G, i).some(j => G.cells[j].dug));
  const delveOk = G => G.rows < K.maxRows && (!freeEdge(G) || G.cells.filter(x => x.dug).length >= G.cells.length * 0.75);
  function sinkCost(R, id) { const n = (R.sinkN && R.sinkN[id]) || 0; return Math.round((SINK[id].base + SINK[id].step * n) * cmG(R)); }
  function sinkWhy(R, id) {
    const G = R.G; if (!SINK[id]) return '없는 것이다'; if (R.phase !== 'day' || G.over) return '낮이 아니다'; if (G.gold < sinkCost(R, id)) return '진액이 모자란다';
    if (id === 'feed' && !G.kin.some(m => m.kind !== 'spawn')) return '먹일 권속이 없다';
    if (id === 'hurry') { const b = evoBar(R); if (!b || b.done) return '더 벗을 허물이 없다'; if (R.moltQ) return '허물이 이미 차올랐다'; }
    if (id === 'draw' && R.hand.length >= K.handMax) return '손이 가득 찼다';
    if (id === 'delve' && G.rows >= K.maxRows) return '더 내려갈 곳이 없다';
    if (id === 'delve' && !delveOk(G)) return '아직 팔 자리가 남았다';
    if ((id === 'draw' || id === 'redraw') && !R.drawP.length && !R.disc.length) return '덱에 남은 카드가 없다';
    return null;
  }
  function sinkOptions(R) { return Object.keys(SINK).map(id => { const why = sinkWhy(R, id); return { id, name: SINK[id].name, cost: sinkCost(R, id), ok: !why, why }; }); }
  function buySink(R, id) {
    const why = sinkWhy(R, id); if (why) return fail(why); const G = R.G, c = sinkCost(R, id);
    G.gold -= c; R.sinkN = R.sinkN || {}; R.sinkN[id] = (R.sinkN[id] || 0) + 1; R.st.sunk = (R.st.sunk || 0) + c; gs(G, 'spent', id, c);
    if (id === 'redraw') { R.hand.slice().forEach(u => { const cc = card(R, u); if (cc && def(cc).type !== 'curse') discard(R, u); }); draw(R, drawN(R)); syncHeld(R); return ok('손을 다시 받았다'); }
    if (id === 'draw') { draw(R, 1); syncHeld(R); return ok('한 장을 더 받았다'); }
    if (id === 'feed') { const ks = G.kin.filter(m => m.kind !== 'spawn'), each = 8 + 2.5 * G.day; let ups = 0; ks.forEach(m => { ups += N.giveExp(m, each) || 0; }); return ok('권속들이 살점을 받았다' + (ups ? ' · ' + ups + '번 자랐다' : '')); }
    if (id === 'delve') { for (let k = 0; k < G.cols; k++) G.cells.push({ dug: false, soft: false, block: false, type: 'empty', lv: 1, exp: 0, traps: [], zone: false }); G.rows++; G.stats.delves = (G.stats.delves || 0) + 1; return ok('흙 아래에 한 층이 더 있었다'); }
    if (id === 'hurry') { const b = evoBar(R), g = R.genome; g.evo = (g.evo || 0) + Math.max(0.05, (b.need - (b.prev || 0)) * 0.3); if (GEN() && GEN().ripe) GEN().ripe(R); return ok(R.moltQ ? '허물이 차올랐다. 오늘 밤 몸이 바뀐다' : '허물이 조금 더 차올랐다'); }
    return fail('없는 것이다');
  }
  function upgrade(R, uid) { const c = card(R, uid); if (!c) return fail('없는 카드다'); if (c.up) return fail('이미 강화했다'); if (def(c).type === 'curse') return fail('저주는 강화할 수 없다'); const k = upCost(R); if (R.G.gold < k) return fail('진액이 모자란다'); R.G.gold -= k; c.up = 1; syncHeld(R); return ok(def(c).name + '+'); }
  function removeCard(R, uid) { const c = card(R, uid); if (!c) return fail('없는 카드다'); const k = rmCost(R); if (R.G.gold < k) return fail('진액이 모자란다'); R.G.gold -= k; ['drawP', 'hand', 'disc'].forEach(p => { const j = R[p].indexOf(uid); if (j >= 0) R[p].splice(j, 1); }); R.deck.splice(R.deck.indexOf(c), 1); syncHeld(R); return ok(def(c).name + '을(를) 덱에서 뺐다'); }

  // ---- 바늘 점 (곁 도박): 별 다섯을 셋·하나·하나로 열고, 덮인 바늘 둘과 합쳐 일곱 장 중 다섯으로 본다 ----
  const SIGNS = ['물결', '눈', '알', '가면', '이빨', '문', '바늘', '탑', '뿌리', '혀', '종', '고리', '날개'];
  const NHANDS = [
    { id: 'none', name: '흩어진 별', pay: 0 }, { id: 'pair', name: '짝별', pay: 0.4 }, { id: 'twopair', name: '두 짝별', pay: 0.9 }, { id: 'three', name: '세 바늘', pay: 1.8 },
    { id: 'line', name: '이어진 별', pay: 3 }, { id: 'colour', name: '한 빛깔 하늘', pay: 6, extra: 'rare' }, { id: 'full', name: '깨어나는 살', pay: 4, extra: 'molt' },
    { id: 'four', name: '네 바늘', pay: 10, extra: 'molt+rare' }, { id: 'turn', name: '바늘이 돌아섬', pay: 40, extra: 'molt2' },
  ];
  const NHBY = Object.fromEntries(NHANDS.map(h => [h.id, h]));
  function needleStart(R) {
    if (!R.needleOffer || R.needle) return fail('바늘 점이 없다'); R.needleOffer = false;
    const stars = []; ASPS.forEach(a => SIGNS.forEach((s, i) => stars.push({ asp: a, sign: i }))); shuffle(R, stars);
    const needles = shuffle(R, SIGNS.map((s, i) => ({ asp: 'none', sign: i }))); let hole = needles.slice(0, 2);
    if (R.needlePity >= 3) hole = [needles[0], { asp: 'none', sign: stars[0].sign }];
    R.needle = { stars: stars.slice(0, 5), hole, shown: 0, stake: { ess: 0, faith: 0, cards: [] }, step: 0, done: false, result: null };
    return ok('바늘 점', { needle: needlePublic(R) });
  }
  const stakeValue = s => s.ess + s.faith * 4 + s.cards.length * 30 * 1;
  function needlePublic(R) { const n = R.needle; if (!n) return null; return { step: n.step, stars: n.stars.slice(0, n.shown), hole: n.done ? n.hole : [null, null], stake: Object.assign({}, n.stake, { value: stakeValue(n.stake) }), done: n.done, result: n.result }; }
  function needleBet(R, what) {
    const n = R.needle, G = R.G; if (!n || n.done) return fail('바늘 점이 없다');
    if (what.kind === 'ess') { const v = Math.min(Math.round((what.n || 10) * cmG(R)), G.gold); if (v <= 0) return fail('진액이 없다'); G.gold -= v; n.stake.ess += v; }
    else if (what.kind === 'faith') { const v = Math.min(what.n || 3, G.faith); if (v <= 0) return fail('신앙이 없다'); G.faith -= v; n.stake.faith += v; }
    else if (what.kind === 'card') { const c = R.deck.find(x => x.uid === what.uid && def(x).type === 'kin'); if (!c) return fail('걸 권속 카드가 없다'); ['drawP', 'hand', 'disc'].forEach(p => { const j = R[p].indexOf(c.uid); if (j >= 0) R[p].splice(j, 1); }); R.deck.splice(R.deck.indexOf(c), 1); n.stake.cards.push(c); }
    return ok('걸었다', { needle: needlePublic(R) });
  }
  function needleReveal(R) { const n = R.needle; if (!n || n.done) return fail('바늘 점이 없다'); if (stakeValue(n.stake) <= 0) return fail('먼저 건다'); n.step++; n.shown = n.step === 1 ? 3 : n.step === 2 ? 4 : 5; if (n.step >= 3) return needleResult(R); return ok('별이 열렸다', { needle: needlePublic(R) }); }
  function needleFold(R) {
    const n = R.needle; if (!n || n.done) return fail('바늘 점이 없다'); const back = n.step === 0 ? 1 : 0.5;
    R.G.gold += Math.floor(n.stake.ess * back); if (back === 1) { R.G.faith += n.stake.faith; n.stake.cards.forEach(c => { R.deck.push(c); R.disc.push(c.uid); }); }
    R.needle = null; return ok('접었다');
  }
  function needleBest(cards) {
    const idx = cards.map((c, i) => i), combos = [], rec = (s, acc) => { if (acc.length === 5) { combos.push(acc.slice()); return; } for (let i = s; i < idx.length; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); } };
    rec(0, []); let best = NHANDS[0];
    for (const cb of combos) { const h = needleEval(cb.map(i => cards[i])); if (NHANDS.indexOf(h) > NHANDS.indexOf(best)) best = h; }
    return best;
  }
  function needleEval(five) {
    const cnt = {}; five.forEach(c => { cnt[c.sign] = (cnt[c.sign] || 0) + 1; }); const vs = Object.values(cnt).sort((a, b) => b - a);
    const colour = five.every(c => c.asp !== 'none' && c.asp === five[0].asp), signs = [...new Set(five.map(c => c.sign))].sort((a, b) => a - b), line = signs.length === 5 && (signs[4] - signs[0] === 4 || (signs[0] === 0 && signs[1] === 9 && signs[4] === 12));
    if (line && colour) return NHBY.turn; if (vs[0] >= 4) return NHBY.four; if (vs[0] === 3 && vs[1] >= 2) return NHBY.full; if (colour) return NHBY.colour; if (line) return NHBY.line;
    if (vs[0] === 3) return NHBY.three; if (vs[0] === 2 && vs[1] === 2) return NHBY.twopair; if (vs[0] === 2) return NHBY.pair; return NHBY.none;
  }
  function needleResult(R) {
    const n = R.needle, G = R.G; n.done = true; n.shown = 5;
    const h = needleBest(n.stars.concat(n.hole)), v = stakeValue(n.stake), res = { hand: h.id, name: h.name, pay: 0, gifts: [] };
    if (h.pay > 0) {
      res.pay = Math.floor(v * h.pay); G.gold += res.pay; R.needlePity = 0; if (h.pay >= 1) R.st.needleWins++; if (h.pay >= 7) R.st.needleBig++;
      if (h.pay >= 1) { G.faith += n.stake.faith; n.stake.cards.forEach(c => { c.up = 1; R.deck.push(c); R.disc.push(c.uid); }); }
      if (h.extra === 'rare' || h.extra === 'molt+rare') { const rc = openPool(R).filter(d => d.rar === 'r'); if (rc.length) { const d = pick(R, rc); const c = addCard(R, d.id); R.disc.push(c.uid); res.gifts.push(d.id); } }
      if (h.extra && h.extra.indexOf('molt') === 0) { const a = G.slime.main || G.startAsp, k = h.extra === 'molt2' ? 2 : 1; G.slime.ess[a] += 12 * k; res.gifts.push('ess:' + a + ':' + 12 * k); }
    } else { R.needlePity++; if (v >= 40 || n.stake.cards.length) { const cu = pick(R, CD.LIST.filter(d => d.type === 'curse')); const c = addCard(R, cu.id); R.disc.push(c.uid); res.curse = cu.id; } }
    n.result = res; const pub = needlePublic(R); R.needle = null; if (R.camp && CMP()) CMP().onNeedle(R, res); return ok(h.name, { needle: pub, result: res });
  }

  // ---- 판 끝 ----
  const actOfDay = d => Math.min(5, Math.floor((d - 1) / 8) + 1);
  function endRun(R) {
    const G = R.G, win = !!(G.over && G.over.win), m = R.meta, a = R.aspect;
    syncCounters(R); Object.assign(R.st, { kills: G.stats.kills || 0, swallow: G.stats.swallows || 0, spawned: G.stats.spawns || 0, skills: G.stats.skills || 0, captives: G.stats.captives || 0, kinEvo: G.stats.kinEvo || 0, secrets: G.stats.secrets || 0, digestEss: (G.stats.income || {})['소화'] || 0, limbKills: G.stats.limbKills || 0, win, day: G.day, deckN: R.deck.length, curses: R.deck.filter(c => def(c).type === 'curse').length });
    R.phase = 'over';
    m.runs = (m.runs || 0) + 1; m.actBy = m.actBy || {}; m.winBy = m.winBy || {};
    m.actBy[a] = Math.max(m.actBy[a] || 0, win ? 5 : actOfDay(G.day)); if (win) m.winBy[a] = (m.winBy[a] || 0) + 1;
    m.tot = m.tot || {}; for (const k in R.st) if (typeof R.st[k] === 'number' && !['day', 'deckN', 'maxGold', 'curses'].includes(k)) m.tot[k] = (m.tot[k] || 0) + R.st[k];
    const sc = N.score(G);
    const egg = GEN() && R.genome ? GEN().layEgg(R) : null;
    R.over = { win, day: G.day, why: G.over ? G.over.why : '', score: sc.total, grade: sc.grade, unlocks: releaseUnlocks(m, checkUnlocks(m, R.st)), learned: R.learned.slice(), egg, body: R.genome ? genomeSummary(R) : null };
    if (R.camp && CMP()) R.over.camp = CMP().onEnd(R);
  }
  function checkUnlocks(meta, st) {
    meta.unlocked = meta.unlocked || {}; const out = [];
    for (const id in CD.UNLOCK) { if (meta.unlocked[id] || (meta.queue || []).includes(id)) continue; let okk = false; try { okk = !!CD.UNLOCK[id].check(st || {}, meta); } catch (e) { okk = false; } if (okk) out.push(id); }
    return out;
  }
  // 한 판에 여는 것은 K.unlockCap 까지. 나머지는 줄을 서서 다음 판에 열린다
  function releaseUnlocks(meta, fresh) {
    meta.queue = meta.queue || []; fresh.forEach(id => { if (!meta.queue.includes(id)) meta.queue.push(id); });
    const cap = Math.min(K.unlockCap, 3 + (meta.runs || 1)), out = []; while (meta.queue.length && out.length < cap) { const id = meta.queue.shift(); meta.unlocked[id] = 1; out.push({ cond: id, text: CD.UNLOCK[id].text, hard: CD.UNLOCK[id].hard, cards: CD.LIST.filter(d => d.unlock === id).map(d => d.id) }); }
    return out;
  }
  function rememberParts(meta, partIds) { meta.parts = meta.parts || {}; (partIds || []).forEach(p => { meta.parts[p] = 1; }); return meta; }

  // ---- 변이 갈고리 (덱 = 유전자) ----
  // registerMutator(fn): fn(card, def, R, ctx) 이 새 카드 id 를 돌려주면 그 카드가 바뀐다 (c.from 에 옛 id).
  // mutateDeck(R, ctx) 는 아무도 부르지 않는다: 허물 때 게놈 단계가 부른다. 바뀐 목록을 돌려준다.
  const MUTATORS = [];
  function registerMutator(fn) { if (typeof fn === 'function') MUTATORS.push(fn); return MUTATORS.length; }
  function clearMutators() { MUTATORS.length = 0; }
  function mutateDeck(R, ctx) {
    const changed = [];
    R.deck.forEach(c => { for (const fn of MUTATORS) { let to = null; try { to = fn(c, def(c), R, ctx || {}); } catch (e) { to = null; } if (to && CD.BY[to] && to !== c.id) { changed.push({ uid: c.uid, from: c.id, to }); c.from = c.from || c.id; c.id = to; break; } } });
    if (changed.length) syncHeld(R);
    return changed;
  }
  // 몸 생성기(traits.js TRAITS.COUNTERS)와 같은 이름으로 G.stats 를 채운다. 따로 세지 않는 것은 여기서 옮긴다
  const COUNTERS = ['trapKills', 'kinKills', 'coreKills', 'swallows', 'infections', 'risen', 'captives', 'converts', 'eaten', 'kinLost', 'nightsAlone', 'kinMade', 'spawns', 'skillsUsed', 'wordsLearned', 'coreDamage', 'digestKills', 'waterKills', 'pulled', 'madness', 'routs', 'shapesPlaced', 'organsPlaced', 'trapsPlaced', 'combos', 'nightsDark', 'bossKills', 'ess_abyss', 'ess_nebula', 'ess_brood', 'ess_dusk', 'ess_hunger'];
  function syncCounters(R) {
    const s = R.G.stats; s.eaten = s.eats || 0; s.skillsUsed = s.skills || 0; ASPS.forEach(a => { s['ess_' + a] = R.G.slime.ess[a] || 0; });
    COUNTERS.forEach(k => { if (typeof s[k] !== 'number') s[k] = 0; });
  }
  // 이번 판에 쌓인 몸의 버릇 (게놈 단계가 꼬리표로 바꾼다)
  function behaviour(R) { syncCounters(R); const s = R.G.stats, o = {}; COUNTERS.forEach(k => { o[k] = s[k] || 0; }); return Object.assign(o, { trapKillBy: s.trapKillBy || {}, spells: s.spells || {}, cardsBy: s.cardsBy || {}, cardsAsp: s.cardsAsp || {}, cardTags: s.cardTags || {}, cmb: s.cmb || {}, limbKills: s.limbKills || 0, ransoms: s.ransoms || 0, sacrifices: R.G.sacrifices || 0 }); }

  // ---- 몸(게놈): 화면이 부르는 것 ----
  const genome = R => R.genome || null;
  const moltPending = R => !!(R.moltQ && R.genome);
  const molt = R => (GEN() ? GEN().molt(R) : null);
  const layEgg = R => (GEN() ? GEN().layEgg(R) : null);
  const evoBar = R => (GEN() && GEN().evoBar ? GEN().evoBar(R) : null);
  // 허물까지 얼마나 남았나: frac 0..1, near = 다음 밤이나 그다음 밤이면 벗는다, reason = 짧은 한 줄 (UI 는 near 일 때 「허물이 가깝다」를 띄운다)
  function moltProgress(R) {
    if (!R || !R.genome) return null; if (R.moltQ) return { frac: 1, near: true, ready: true, reason: '허물이 차올랐다' };
    const b = evoBar(R); if (!b) return null; if (b.done) return { frac: 1, done: true, near: false, reason: '더 벗을 허물이 없다' };
    const g = R.genome, per = Math.max(0.5, R.evoPerNight || 1), left = Math.max(0, b.need - b.cur), nights = Math.ceil(left / per);
    return { frac: b.frac, near: b.frac >= 0.7 || nights <= 1, nights, reason: b.frac >= 0.7 || nights <= 1 ? '허물이 가깝다' : '몸이 익어 간다', top: (typeof TRAITS !== 'undefined' ? TRAITS : require('./traits.js')).topTags(g, 1)[0] || null };
  }
  const codex = meta => (GEN() ? GEN().codex(meta) : { found: 0, list: [], landmarksFound: 0, landmarks: [], total: 30 });
  // 내일 아침 끼니와 굴 유지를 치를 수 있나: 모자라면 떠날 권속의 이름 (둘까지)
  function upkeepWarn(R) {
    const G = R.G; if (!G || G.over) return { short: 0, leaving: [], days: 99, perDay: 0 };
    const up = N.upkeep(G), ks = G.kin.filter(m => m.kind !== 'spawn'), per = up + ks.reduce((a, m) => a + N.salary(G, m), 0);
    let g = Math.max(0, G.gold) - up; const unpaid = []; G.kin.forEach(m => { const s = N.salary(G, m); if (!s) return; if (g >= s) g -= s; else unpaid.push(m); });
    const leaving = unpaid.filter(m => (m.unpaid || 0) >= 2).slice(0, K.leaveMax).map(m => m.name);
    return { short: Math.max(0, Math.round(per - Math.max(0, G.gold))), leaving, hungry: unpaid.length, days: per > 0 ? Math.floor(Math.max(0, G.gold) / per) : 99, perDay: Math.round(per) };
  }
  function genomeSummary(R) { const T = typeof TRAITS !== 'undefined' ? TRAITS : require('./traits.js'); return R.genome ? T.summary(R.genome) : null; }

  // ---- 화면에 줄 것 ----
  // 저장본 다듬기: 덱에 없는 카드 번호, 모르는 카드, 겹친 번호를 버린다 (이어하기가 멈추지 않게)
  function repair(R) {
    if (!R || !Array.isArray(R.deck)) return R; let fixed = 0;
    R.deck = R.deck.filter(c => { const okc = c && c.uid != null && typeof c.id === 'string' && !!def(c); if (!okc) fixed++; return okc; });
    const have = new Set(R.deck.map(c => c.uid)), seen = new Set();
    ['hand', 'drawP', 'disc'].forEach(k => { R[k] = (Array.isArray(R[k]) ? R[k] : []).filter(u => { const okc = have.has(u) && !seen.has(u); if (okc) seen.add(u); else fixed++; return okc; }); });
    R.deck.forEach(c => { if (!seen.has(c.uid)) R.drawP.push(c.uid); });
    R.nextUid = Math.max(R.nextUid || 1, ...R.deck.map(c => +c.uid + 1 || 1));
    if (R.G && Array.isArray(R.G.cardHeld)) R.G.cardHeld = R.G.cardHeld.filter(h => h && have.has(h.uid));
    R.repaired = fixed; return R;
  }
  function handView(R) { return R.hand.map(u => { const c = card(R, u), v = view(R, c), why = canPlay(R, u); return Object.assign(v, { can: !why, why, cellsCan: v.target === 'cell' ? cellsFor(R, c) : null, places: v.target === 'shape' ? shapePlacements(R, def(c)).map(p => p.cells) : null }); }); }
  function deckView(R) { return R.deck.map(c => Object.assign(view(R, c), { where: R.hand.includes(c.uid) ? 'hand' : R.drawP.includes(c.uid) ? 'draw' : 'disc' })); }
  function dayView(R) { return { day: R.G.day, phase: R.phase, gold: R.G.gold, faith: R.G.faith, hand: handView(R), drawN: R.drawP.length, discN: R.disc.length, deckN: R.deck.length, retain: R.retain, combos: N.cardCombos(R.G), shop: (R.shop || []).map((s, i) => Object.assign({ i }, s, { card: view(R, { uid: 0, id: s.id, up: 0 }) })), offer: R.offer ? R.offer.cards.map(id => view(R, { uid: 0, id, up: 0 })) : null, needleOffer: R.needleOffer, upCost: upCost(R), rmCost: rmCost(R), log: R.log.splice(0), learned: R.learned.slice() }; }

  return { upkeepWarn, K, ALIEN, SIGNS, NHANDS, newMeta, newRun, addCard, costOf, view, canPlay, play, cellsFor, shapePlacements, endDay, nightBegin, nightEnd, foresee, evoBar, moltProgress, morning, syncHeld, draw,
    takeReward, skipReward, rerollReward, shopOffer, shopBuy, upgrade, removeCard, upCost, rmCost, SINK, sinkCost, sinkOptions, buySink,
    needleStart, needleBet, needleReveal, needleFold, needlePublic, needleEval, needleBest,
    registerMutator, clearMutators, mutateDeck, behaviour, syncCounters, COUNTERS,
    genome, moltPending, molt, layEgg, codex, genomeSummary, def, reMorning, repair,
    endRun, checkUnlocks, releaseUnlocks, rememberParts, knownName, realName, handView, deckView, dayView, openPool };
})();
if (typeof module !== 'undefined') module.exports = CARDMODE;
