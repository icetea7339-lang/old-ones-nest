// 옛 것의 둥지 — 카드 판의 유전자 (화면이 없다, node 에서도 돈다)
// 본체의 몸 = 게놈(traits.js). 밤마다 한 일이 형질의 무게로 쌓이고, 허물을 벗을 때 몸이 바뀐다.
// 덱 = 유전자: 허물 때 위쪽 형질이 덱의 카드를 다시 쓴다(포자가 크면 함정이 포자 함정이 되는 식). 짝 형질은 카드 한 장을 특별한 것으로 바꾼다.
// 몸의 형질은 본체의 싸움도 바꾼다(부위 레벨과 변이로 logic.js 의 싸움에 들어간다).
// 판이 끝나면 알을 남기고, 다음 판이 그 알에서 시작하면 형질 일부를 물려받는다. 본 몸은 도감(meta.codex.forms)에 남는다.
const GENOME = (function () {
  const N = typeof NEST !== 'undefined' ? NEST : require('./logic.js');
  const T = typeof TRAITS !== 'undefined' ? TRAITS : require('./traits.js');
  const CD = typeof CARDS2 !== 'undefined' ? CARDS2 : require('./cards2.js');
  const r2 = x => Math.round(x * 100) / 100;

  // ---- 형질이 카드를 다시 쓰는 법: on = 바꿀 수 있는 카드 종류, pre = 이름 앞에 붙는 말, t = 카드 얼굴의 짧은 말 ----
  const RW = {
    maw: { on: 'trap', pre: '아가리 돋은', t: '약한 적을 통째로 삼킨다', ch: d => ({ trap: 'maw', pow: r2((d.pow || 1) * 1.1) }) },
    spore: { on: 'trap', pre: '포자 핀', t: '쓰러진 적이 감염체로 선다', ch: d => ({ trap: 'spore', pow: r2((d.pow || 1) * 1.2) }) },
    eye: { on: 'skill', pre: '눈 뜬', t: '신앙이 30% 덜 든다', ch: d => ({ cmul: r2((d.cmul || 1) * 0.7) }) },
    water: { on: 'shape', pre: '물 고인', t: '파면 첫 칸에 물이 찬다', when: d => !d.op && !d.bridge && !d.gift, ch: d => ({ gift: 'drown', cost: (d.cost || 0) + 2 }) },
    bone: { on: 'kin', pre: '뼈 두른', t: '레벨 +2로 든다', ch: d => ({ lv: (d.lv || 0) + 2 }) },
    tent: { on: 'trap', pre: '촉수 뻗은', t: '가장 센 적을 휘감아 친다', ch: d => ({ trap: 'limb', pow: r2((d.pow || 1) * 1.2) }) },
    egg: { on: 'kin', pre: '알 품은', t: '움 둘이 함께 돋는다', when: d => d.kin !== 'spawn', ch: d => ({ plus: (d.plus || 0) + 2 }) },
    spike: { on: 'trap', pre: '가시 돋은', t: '함정 힘 ×1.3', ch: d => ({ pow: r2((d.pow || 1) * 1.3) }) },
    face: { on: 'skill', pre: '얼굴 쓴', t: '신앙 덜 들고 신앙 +2', ch: d => ({ cmul: r2((d.cmul || 1) * 0.85), x: d.x || { faith: 2 } }) },
    gut: { on: 'trap', pre: '위액 찬', t: '거기서 죽으면 곧 진액', ch: d => ({ trap: 'digest', pow: r2((d.pow || 1) * 1.1) }) },
    shadow: { on: 'trap', pre: '그림자 진', t: '적을 입구로 돌려보낸다', ch: d => ({ trap: 'whisper', pow: r2((d.pow || 1) * 1.1) }) },
    star: { on: 'skill', pre: '별빛', t: '기술 힘 ×1.35', ch: d => ({ pow: r2((d.pow || 1) * 1.35) }) },
    trap: { on: 'trap', pre: '덫 굳은', t: '함정 레벨 +1', when: d => (d.lv || 1) < 3, ch: d => ({ lv: Math.min(3, (d.lv || 1) + 1) }) },
    alone: { on: 'kin', pre: '등 돌린', t: '본체가 홀로 서서 비싸진다', ch: d => ({ cost: Math.round((d.cost || 0) * 1.4) }) },
    swarm: { on: 'kin', pre: '떼 지은', t: '둘이 함께 든다', when: d => d.kin !== 'spawn' || (d.n || 1) < 6, ch: d => ({ n: (d.n || 1) * 2, cost: Math.round((d.cost || 0) * 1.3) }) },
    shell: { on: 'organ', pre: '껍질 덮인', t: '방 레벨 2로 돋는다', ch: () => ({ lv2: true }) },
    wing: { on: 'shape', pre: '날개막', t: '반값에 판다', when: d => !d.op && (d.cost || 0) > 1, ch: d => ({ cost: Math.max(1, Math.round((d.cost || 0) * 0.5)) }) },
    glow: { on: 'organ', pre: '빛 도는', t: '돋으며 곁의 칸 하나를 판다', ch: () => ({ reveal: 1 }) },
    root: { on: 'organ', pre: '뿌리 내린', t: '값 −25%', ch: d => ({ cost: Math.round((d.cost || 0) * 0.75) }) },
    mirror: { on: 'trap', pre: '거울 비친', t: '미친 적이 제 편을 친다', ch: d => ({ trap: 'eye', pow: r2((d.pow || 1) * 1.15) }) },
    tongue: { on: 'shape', pre: '혀 내민', t: '파면 끌어당기는 벽이 돋는다', when: d => !d.op && !d.bridge && !d.gift, ch: () => ({ gift: 'whisper' }) },
    horn: { on: 'kin', pre: '뿔 난', t: '희귀하게, 레벨 +1', ch: d => ({ lv: (d.lv || 0) + 1, rare: true }) },
  };
  // ---- 형질이 본체의 몸을 바꾸는 법: leg/skin = 공격·체력 %, mouth/eye/core = 그 부위 레벨, mut = 변이 ----
  const BB = {
    maw: { leg: 6, mouth: 2, mut: 'mouth' }, spore: { skin: 4, mut: 'spore' }, eye: { eye: 3, mut: 'thirdeye' }, water: { skin: 8, mut: 'gills' },
    bone: { skin: 14 }, tent: { leg: 5, mut: 'tentacle' }, egg: { core: 2, skin: 4 }, spike: { leg: 12, mut: 'teeth' }, face: { mut: 'maskm' },
    gut: { mouth: 2, mut: 'steelgut' }, shadow: { leg: 4, mut: 'whisper' }, star: { mut: 'ring' }, trap: { core: 1, skin: 4 }, alone: { leg: 34, skin: 34, mut: 'teeth' },
    swarm: { core: 1 }, shell: { skin: 22, mut: 'gills' }, wing: { leg: 6 }, glow: { eye: 2, mut: 'thirdeye' }, root: { skin: 10, core: 2 }, mirror: { mut: 'maskm' },
    tongue: { mouth: 1, mut: 'whisper' }, horn: { leg: 16 },
  };
  const rwText = t => RW[t] ? CD.TYPEN[RW[t].on] + ' → ' + RW[t].pre + ': ' + RW[t].t : '';

  // ---- 다시 쓴 카드: id 로부터 언제든 다시 만든다 (저장한 판을 불러와도 같은 카드) ----
  //   gx_<형질>__<본디 id> : 형질 하나가 다시 쓴 카드.  gc_<짝 id>__<본디 id> : 짝 형질이 바꾼 특별한 카드
  const GENE = [];
  const base = d => d.baseName || d.name;
  function ensure(id) {
    if (!id || CD.BY[id]) return CD.BY[id] || null;
    const k = id.indexOf('__'); if (k < 0) return null;
    const head = id.slice(0, k), srcId = id.slice(k + 2), src = ensure(srcId); if (!src) return null;
    let d = null;
    if (head.indexOf('gx_') === 0) {
      const tag = head.slice(3), rw = RW[tag]; if (!rw || src.type !== rw.on) return null;
      d = Object.assign({}, src, rw.ch(src), { id, name: rw.pre + ' ' + base(src), baseName: base(src), text: rw.t, more: rw.pre + ' ' + base(src) + ': ' + rw.t + ' · 본디 「' + base(src) + '」: ' + (src.more || src.text) });
      d.gene = (src.gene || []).concat([tag]);
    } else if (head.indexOf('gc_') === 0) {
      const cid = head.slice(3), cmb = T.COMBOS.find(c => c.id === cid); if (!cmb) return null;
      const rws = cmb.tags.map(t => RW[t]).filter(rw => rw && rw.on === src.type); if (!rws.length) return null;
      let ch = {}; rws.forEach(rw => { ch = Object.assign(ch, rw.ch(Object.assign({}, src, ch))); });
      if (src.type === 'trap') ch.pow = r2((ch.pow || src.pow || 1) * 1.2); else if (src.type === 'kin') ch.lv = (ch.lv || src.lv || 0) + 1; else if (src.type === 'skill') ch.pow = r2((ch.pow || src.pow || 1) * 1.2); else if (src.type === 'organ') ch.lv2 = true; else if (src.type === 'shape') ch.cost = Math.max(1, Math.round((ch.cost != null ? ch.cost : src.cost || 0) * 0.7));
      d = Object.assign({}, src, ch, { id, name: cmb.name, baseName: base(src), text: cmb.text.length > 20 ? cmb.text.slice(0, 19) + '…' : cmb.text, more: cmb.name + ': ' + cmb.text + ' · ' + rws.map(rw => rw.t).join(' · ') + ' · 본디 「' + base(src) + '」' });
      d.gene = (src.gene || []).concat(cmb.tags); d.combo = cid; if (d.rar === 'c' || d.rar === 's') d.rar = 'u'; else if (d.rar === 'u') d.rar = 'r';
    }
    if (!d) return null;
    if (d.rar === 's') d.rar = 'c';
    d.unlock = 'gene'; d.tags = [...new Set((src.tags || []).concat(d.gene.filter(t => T.TAG_IDS.includes(t))))]; d.from = src.id;
    CD.BY[id] = d; GENE.push(d); return d;
  }
  const canRewrite = (tag, d) => { const rw = RW[tag]; return !!(rw && d && d.type === rw.on && !(d.gene || []).includes(tag) && (!rw.when || rw.when(d)) && (d.gene || []).length < 3); };
  const canCombo = (cmb, d) => d && !(d.combo) && cmb.tags.some(t => RW[t] && RW[t].on === d.type) && (d.gene || []).length < 3;

  // ---- 판의 게놈 ----
  const snap = g => JSON.parse(JSON.stringify(g));
  function start(R, egg) {
    const G = R.G, ps = R.proSeed || null, pro = {}; if (ps && ps.tags) { const tw = Object.values(ps.tags).reduce((a, b) => a + b, 0) || 1, k = 1 + 0.5 * Math.min(1, (ps.stage || 1) / 3); for (const t in ps.tags) if (T.TAGS[t]) pro[t] = +(ps.tags[t] * k * Math.max(1, 6 / tw)).toFixed(3); }
    const g = T.newGenome({ norm: true, aspect: R.aspect, sub: ps && ps.sub || null, seed: (R.seed ^ 0x2c1b3c6d) >>> 0, stage: 1, lineage: egg ? [egg] : [], look: G.slime.look || null, pro: Object.keys(pro).length ? pro : null });
    T.addBehaviour(g, {}); if (egg) R.egg = egg; g.evo = 0;
    R.genome = g; R.geneLast = {}; R.moltQ = 0; R.molts = [];
    R.st.molts = 0; R.st.landmarks = 0; R.st.forms = 0; R.st.eggRun = egg ? 1 : 0; R.st.geneCards = 0;
    // 물려받은 형질 가운데 가장 큰 것이 처음 덱의 두 장을 다시 쓴다
    if (egg) { const top = T.topTags(g, 1)[0]; if (top) { const picks = pickFor(R, top, 2, {}); applyPicks(R, picks); } }
    applyBody(R);
  }
  // 밤마다: 이번 판에 쌓인 셈의 늘어난 만큼만 넣는다
  function feed(R, behaviour) {
    const g = R.genome; if (!g) return; const now = {}, d = {}; let any = false;
    for (const k in T.COUNTERS) { now[k] = +(behaviour[k] || 0); const x = now[k] - (R.geneLast[k] || 0); if (x > 0) { d[k] = x; any = true; } }
    const ct = behaviour.cardTags || {}; T.TAG_IDS.forEach(t => { const k = 'tag:' + t; now[k] = +(ct[t] || 0); const x = now[k] - (R.geneLast[k] || 0); if (x > 0) { d[k] = x; any = true; } });
    const s0 = Object.values(g.tags).reduce((a, b) => a + b, 0);
    R.geneLast = now; if (any) T.addBehaviour(g, d);
    // 진화의 정수: 하룻밤 사이 형질이 자란 만큼 (늘 조금은 차오른다). 문턱을 넘으면 허물이 익는다(ripe)
    const s1 = Object.values(g.tags).reduce((a, b) => a + b, 0); g.evo = +((g.evo || 0) + (EVO.asp[g.aspect] || 1) * (EVO.base + EVO.k * Math.max(0, s1 - s0))).toFixed(3);
    // 덱 = 유전자: 밤마다 덱에 어떤 꼬리표가 얼마나 들었는지 쌓는다 (일부러 한 갈래를 모았는지 보는 잣대)
    const dt = {}; let dn = 0; R.deck.forEach(c => { const dd = CD.BY[c.id] || (typeof ensure === 'function' ? ensure(c.id) : null); if (!dd || dd.type === 'shape' || dd.type === 'curse') return; dn++; (dd.tags || []).forEach(t => { dt[t] = (dt[t] || 0) + 1; }); });
    g.deckN = (g.deckN || 0) + dn; g.deckT = g.deckT || {}; for (const t in dt) g.deckT[t] = (g.deckT[t] || 0) + dt[t];
  }
  const rngOf = (R, s) => T.rng(T.hash(R.seed + ':' + s));
  function pickFor(R, tag, n, taken) {
    const r = rngOf(R, 'pick' + tag + (R.genome.stage) + R.molts.length), cands = R.deck.filter(c => !taken[c.uid] && canRewrite(tag, CD.BY[c.id]));
    cands.sort((a, b) => ((CD.BY[a.id].gene || []).length - (CD.BY[b.id].gene || []).length) || (r() - 0.5));
    const out = {}; cands.slice(0, n).forEach(c => { out[c.uid] = 'gx_' + tag + '__' + c.id; taken[c.uid] = 1; }); return out;
  }
  function applyPicks(R, picks) { if (!Object.keys(picks).length) return []; const CM = typeof CARDMODE !== 'undefined' ? CARDMODE : require('./cardmode.js'); registerOnce(CM); const ch = CM.mutateDeck(R, { picks }); R.st.geneCards = (R.st.geneCards || 0) + ch.length; return ch; }
  let registered = false;
  function registerOnce(CM) { if (registered) return; registered = true; CM.registerMutator((c, d, R, ctx) => { const to = ctx && ctx.picks && ctx.picks[c.uid]; if (!to) return null; return ensure(to) ? to : null; }); }

  // ---- 몸의 형질이 본체를 바꾼다 (부위 레벨 + 변이). 몇 번 불러도 같은 결과 ----
  function bodyFx(g) {
    const top = T.topTags(g, 4), fx = { leg: 0, skin: 0, mouth: 0, eye: 0, core: 0, muts: [] }, s = Object.values(g.tags).reduce((a, b) => a + b, 0) || 1;
    top.forEach((t, k) => { const b = BB[t]; if (!b) return; const e = Math.min(1, (g.tags[t] / s) * 2.5) * (0.6 + 0.2 * g.stage); ['leg', 'skin', 'mouth', 'eye', 'core'].forEach(q => { if (b[q]) fx[q] += b[q] * e; }); if (b.mut && k < 2 && g.stage >= 2) fx.muts.push(b.mut); });
    if (T.landmarkOf(g)) { fx.leg += 10; fx.skin += 10; }
    ['leg', 'skin'].forEach(q => { fx[q] = Math.round(fx[q]); }); ['mouth', 'eye', 'core'].forEach(q => { fx[q] = Math.min(3, Math.round(fx[q])); });
    fx.muts = [...new Set(fx.muts)]; return fx;
  }
  function applyBody(R) {
    const G = R.G, g = R.genome; if (!g) return null; const fx = bodyFx(g);
    G.body = (G.body || []).filter(p => !p.gene).map(p => { if (p.base != null) p.lv = p.base; return p; });
    ['leg', 'skin', 'mouth', 'eye', 'core'].forEach(slot => { if (!fx[slot]) return; const p = G.body.find(x => x.slot === slot); if (p) { if (p.base == null) p.base = p.lv; p.lv = p.base + fx[slot]; } else G.body.push({ slot, asp: g.aspect, lv: fx[slot], id: 'gene_' + slot, gene: true }); });
    G.slime.muts = (G.slime.muts || []).filter(m => !(G.slime.geneMuts || []).includes(m)); fx.muts.forEach(m => { if (!G.slime.muts.includes(m) && N.MUT[m]) G.slime.muts.push(m); }); G.slime.geneMuts = fx.muts.filter(m => N.MUT[m]);
    // 얼굴이 크면 사람 말을 더 빨리 배운다
    R.wordsNeed = T.topTags(g, 3).includes('face') ? 2 : null;
    return fx;
  }

  // ---- 허물이 익는다: 달력이 아니라 한 일의 양으로 ----
  // need = 허물마다 넘어야 할 진화의 정수(쌓인 값). 본체(원래 게임의 몸)도 함께 한 단계 큰다: 첫 허물에 바탕 징조, 둘째에 섞인 징조
  const envN = (k, d) => (typeof process !== 'undefined' && process.env && process.env[k] != null ? +process.env[k] : d);
  // 빛깔마다 몸이 바뀌는 빠르기가 다르다 (성운은 별처럼 빨리 일그러지고, 심연은 느리게 가라앉는다)
  const EVO = { asp: (typeof process !== 'undefined' && process.env && process.env.EVOA ? JSON.parse(process.env.EVOA) : { abyss: 0.78, nebula: 1.3, brood: 1.25, dusk: 0.95, hunger: 1.1 }), base: envN('EVOB', 1), k: envN('EVOK', 0.5), need: (typeof process !== 'undefined' && process.env && process.env.EVON ? process.env.EVON.split(',').map(Number) : [70, 430, 720, 1000]) };
  function moltNeed(R) { return EVO.need[(R.molts || []).length + (R.moltQ || 0)]; }
  function protMolt(G) {
    if (G.slime.stage >= 4) return false; const order = N.moltOrder(G);
    if (G.slime.stage === 0) { G.slime.main = order[0]; const b = N.bodyOf ? N.bodyOf(G) : null; if (b) { G.slime.body = b; G.stats.body = b; } }
    if (G.slime.stage === 1) G.slime.sub = order.filter(a => a !== G.slime.main)[0];
    const f = G.slime.hp / Math.max(1, N.slimeStats(G).hp); G.slime.stage++; G.slime.hp = Math.round(N.slimeStats(G).hp * Math.min(1, f + 0.15)); return true;
  }
  function ripe(R) {
    const g = R.genome, G = R.G; if (!g || G.over) return false; const need = moltNeed(R);
    if (need == null || (g.evo || 0) < need || G.slime.stage >= 4) return false;
    if (!protMolt(G)) return false; R.moltQ = (R.moltQ || 0) + 1; return true;
  }
  const evoBar = R => { const g = R.genome; if (!g) return null; const need = moltNeed(R), prev = (R.molts || []).length + (R.moltQ || 0) ? EVO.need[(R.molts || []).length + (R.moltQ || 0) - 1] || 0 : 0; return need == null || R.G.slime.stage >= 4 ? { done: true } : { cur: +(g.evo || 0).toFixed(2), need, prev, frac: Math.max(0, Math.min(1, ((g.evo || 0) - prev) / Math.max(0.01, need - prev))) }; };

  // ---- 허물: 몸이 한 단계 크고, 형질이 덱을 다시 쓴다 ----
  function molt(R) {
    if (!R.genome || !R.moltQ) return null;
    R.moltQ--; const g = R.genome, G = R.G, before = snap(g);
    g.stage = Math.min(5, Math.max(g.stage + 1, (G.slime.stage || 0) + 1)); g.aspect = G.slime.main || g.aspect; g.sub = G.slime.sub || g.sub || null;
    T.addBehaviour(g, {});
    const topB = T.topTags(before, 3), topA = T.topTags(g, 3), gained = topA.filter(t => !topB.includes(t));
    // 위쪽 형질 둘이 카드를 다시 쓴다 (첫째 셋, 둘째 둘), 짝 형질은 한 장씩 (둘까지)
    const taken = {}, picks = {}; T.topTags(g, 2).forEach((t, k) => Object.assign(picks, pickFor(R, t, k ? 2 : 3, taken)));
    const combos = T.combosOf(g); combos.slice(0, 2).forEach(cmb => { const c = R.deck.find(x => !taken[x.uid] && canCombo(cmb, CD.BY[x.id])); if (c) { picks[c.uid] = 'gc_' + cmb.id + '__' + c.id; taken[c.uid] = 1; } });
    const mutated = R.noGene ? [] : applyPicks(R, picks);
    const fx = R.noGene ? null : applyBody(R), lm = T.landmarkOf(g), nm = T.nameOf(g);
    R.st.molts = (R.st.molts || 0) + 1; if (lm) R.st.landmarks = (R.st.landmarks || 0) + 1;
    record(R, g);
    const res = { before, after: g, lines: T.narrate ? T.narrate(g) : T.describe(g), nums: T.describe(g), gained, combos: combos.map(c => ({ id: c.id, name: c.name, text: c.text })), landmark: lm ? { id: lm.id, name: lm.name, title: lm.title || lm.text || '' } : null, name: nm, mutated, body: fx, stage: g.stage };
    R.molts.push({ stage: g.stage, name: nm.name, landmark: res.landmark ? res.landmark.id : null }); R.lastMolt = res;
    return res;
  }

  // ---- 도감 ----
  const formKey = g => { const c = T.classOf(g); return g.aspect + ':' + c.loco + ':' + T.topTags(g, 3).join('+'); };
  function record(R, g) {
    const m = R.meta; if (!m) return; m.codex = m.codex || {}; m.codex.forms = m.codex.forms || {}; m.codex.landmarks = m.codex.landmarks || {};
    const k = formKey(g), nm = T.nameOf(g), lm = T.landmarkOf(g);
    if (!m.codex.forms[k]) { m.codex.forms[k] = { name: nm.name, title: nm.title || '', aspect: g.aspect, stage: g.stage, tags: T.topTags(g, 3), seen: 0, landmark: lm ? lm.id : null, seed: g.seed }; R.st.forms = (R.st.forms || 0) + 1; }
    const f = m.codex.forms[k]; f.seen++; f.stage = Math.max(f.stage, g.stage); if (lm) { m.codex.landmarks[lm.id] = (m.codex.landmarks[lm.id] || 0) + 1; f.landmark = lm.id; }
  }
  function codex(meta) {
    const c = (meta && meta.codex) || {}, forms = c.forms || {}, lms = c.landmarks || {};
    return { found: Object.keys(forms).length, list: Object.keys(forms).map(k => Object.assign({ key: k }, forms[k])).sort((a, b) => b.stage - a.stage || b.seen - a.seen), landmarksFound: Object.keys(lms).length, landmarks: T.LANDMARKS.map(l => ({ id: l.id, name: l.name, found: !!lms[l.id] })), total: T.LANDMARKS.length };
  }
  // ---- 알: 판이 끝나면 몸의 위쪽 형질을 남긴다 (여섯 개까지) ----
  function layEgg(R) {
    const g = R.genome, m = R.meta; if (!g || !m || R.eggLaid) return R.eggLaid || null;
    const inh = T.inherit(g), egg = Object.assign(inh, { stage: g.stage, seed: g.seed, day: R.G.day, win: !!(R.G.over && R.G.over.win), landmark: (T.landmarkOf(g) || {}).id || null, t: (m.runs || 0) });
    m.eggs = (m.eggs || []).concat([egg]).slice(-6); R.eggLaid = egg; record(R, g); return egg;
  }
  return { EVO, ripe, evoBar, moltNeed, RW, BB, ensure, start, feed, molt, applyBody, bodyFx, codex, layEgg, formKey, rwText, GENE, canRewrite };
})();
if (typeof module !== 'undefined') module.exports = GENOME;
