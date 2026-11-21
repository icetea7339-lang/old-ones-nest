// 옛 것의 둥지 — 덱으로 하는 판 (규칙). 화면이 없다(node 에서도 돈다).
// 한 판: 3막 × 밤 여섯 + 막 끝 우두머리. 낮에는 행동 둘(파기·카드 고르기·강화·내보내기·장터), 밤에는 카드로 굴을 지킨다.
// 밤: 기운 3, 다섯 장. 카드를 칸에 낸다. 턴을 끝내면 적이 굴을 따라 한 칸씩 내려오고, 칸마다 싸움이 일어난다.
// 같은 턴에 낸 카드가 맞물리면 족보(세계관 족보)가 된다. 제단과 막 끝에는 바늘 점(곁 도박)이 있다.
const DECK = (function () {
  const N = typeof NEST !== 'undefined' ? NEST : require('./logic.js');
  const CD = typeof CARDS !== 'undefined' ? CARDS : require('./cards.js');
  const ASPS = CD.ASPS;
  const K = {
    energy: 3, draw: 5, tempCap: 4, sanMul: 1.25, noHands: false, handMax: 10, hp: 70, atk: 8, kinCap: 2, coreCap: 3, trapsPerCell: 3,
    nights: 6, acts: 3, dayActions: 2, turnCap: 22, dayHeal: 0.2,
    actMul: [0, 1, 1.5, 1.98], budget: [0, 11, 18, 24, 30, 35, 40], budgetAct: 1.0,
    stageMul: [1, 1.5, 2], secretMul: 1.9, kinAct: 0.18,
    rarW: { c: 60, u: 32, r: 8 }, reroll: 10, shopPrice: { c: 30, u: 55, r: 90 }, molt: 140, removeCost: 0,
    organDay: 12, upEss: 50, rmEss: 40, unlockCap: 8, words: 3, swallowExtra: 0,
    dig: [['empty', 0.25], ['bones', 0.2], ['beast', 0.15], ['egg', 0.15], ['cursed', 0.1], ['altar', 0.15]],
  };
  // 빛깔마다 타고난 것 (판 내내)
  const TRAIT = {
    abyss: { name: '깊은 물의 몸', text: '밤마다 첫 턴 막기 12' },
    nebula: { name: '열린 눈', text: '밤마다 첫 턴 한 장 더' },
    brood: { name: '알 품은 살', text: '밤마다 본체 방에 움 둘' },
    dusk: { name: '속삭이는 목', text: '정신이 꺾인 적마다 진액 +3' },
    hunger: { name: '끝없는 배', text: '적을 쓰러뜨릴 때마다 본체 체력 +2' },
  };
  // ---- 씨앗 ----
  const rnd = R => { let t = (R.seed = (R.seed + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (R, a) => a[Math.floor(rnd(R) * a.length)];
  const shuffle = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(R) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---- 적: 세계마다 나오는 것, 막마다 세기 ----
  const ALIEN = { villager: '따뜻한 것', fisher: '젖은 손', militia: '막대기 든 것', captain: '소리치는 것', detective: '냄새 맡는 것', apprentice: '중얼대는 작은 것', warrior: '쇠를 입은 것', smuggler: '그림자 손', priest: '빛을 두른 것', scholar: '글을 품은 것', herbalist: '풀 냄새 나는 것', soldier: '쇠벽', chaplain: '빛을 든 쇠', sealer: '꿰매는 것', hound: '네 발 이빨', handler: '줄 쥔 것', sapper: '땅 긁는 것', torch: '불 든 것', firemage: '불을 부르는 것', banner: '천을 든 것', master: '고요한 것', shadow: '소리 없는 것', crowd: '떼', lightcrew: '빛 무리', sentry: '차가운 것', shielder: '빛벽', seeker: '책을 든 것' };
  const SEEKER = [
    { name: '책을 쫓는 자', hp: 580, atk: 22, df: 4, san: 140, traits: ['ward', 'boss', 'reads'], gold: 60 },
    { name: '책이 붙은 자', hp: 320, atk: 18, df: 6, san: 200, traits: ['ward', 'boss', 'reads', 'heal'], gold: 90 },
    { name: '책이 된 자', hp: 560, atk: 26, df: 8, san: 300, traits: ['ward', 'boss', 'reads', 'twice'], gold: 140 },
  ];
  const WBOSS = { fantasy: ['captain', 'handler', 'sealer'], wuxia: ['captain', 'master', 'sealer'], modern: ['handler', 'sapper', 'sealer'], future: ['sapper', 'shielder', 'sealer'] };
  const realName = (world, kind) => kind === 'seeker' ? '책을 쫓는 자' : ((N.WORLD[world] && N.WORLD[world].inv && N.WORLD[world].inv[kind]) || (N.INV[kind] && N.INV[kind].name) || kind);
  // 말투: 그 종류를 K.words 번 쓰러뜨리거나 붙잡으면 사람 말로 부른다
  function knownName(meta, world, kind) { return meta && meta.words && (meta.words[kind] || 0) >= K.words ? realName(world, kind) : (ALIEN[kind] || '낯선 것'); }
  const poolFor = (world, act) => Object.keys(N.INV).filter(k => { const d = N.INV[k]; if (d.only && d.only !== world) return false; if (d.boss) return false; return act === 1 ? d.g <= 2 : act === 2 ? d.g <= 3 : true; });

  // ---- 판 ----
  function newMeta() { return { runs: 0, actBy: {}, winBy: {}, words: {}, secrets: 0, worlds: {}, seekerKills: 0, unlocked: {}, parts: {}, hands: {} }; }
  function newRun(seed, opts) {
    opts = opts || {};
    const R = { seed: seed >>> 0, seed0: seed >>> 0, aspect: opts.aspect || 'brood', world: opts.world || null, meta: opts.meta || newMeta(), act: 1, night: 1, phase: 'day', over: null,
      hp: K.hp, maxHp: K.hp, atk: K.atk, ess: 40, deck: [], nextUid: 1, molts: [], actions: K.dayActions, offer: null, shop: null, pity: 0, rerolls: 0,
      log: [], needle: null, needlePity: 0, digResult: null,
      st: { swallow: 0, cleanNights: 0, madHits: 0, maxDrawNight: 0, maxInfNight: 0, infRise: 0, spawned: 0, routs: 0, essGot: 0, eaten: 0, bossByTrap: 0, curseAct: 0, thinBoss: 0, fatBoss: 0, organs: 0, digs: 0, altar: 0, fullKin: 0, kills: 0, noKinLossNights: 0, maxPlaysTurn: 0, maxHit: 0, noCurseAct2: 0, seekerFast: 0, maxSpawnNight: 0, holds: 0, pushes: 0, markedKills: 0, healed: 0, blocked: 0, richNight: 0, poorBoss: 0, lowHpNight: 0, maxKinNight: 0, organChain: 0, learned: 0, hands: {}, handTotal: 0, nightsWon: 0, needleWins: 0, needleBig: 0 } };
    if (!R.world) R.world = pick(R, N.WORLD_IDS || ['fantasy', 'wuxia', 'modern', 'future']);
    const G = { seed: R.seed }; N.makeLayout(G, opts.roam); R.seed = G.seed;
    R.cols = G.cols; R.rows = G.rows; R.ent = G.ent; R.core = G.core;
    R.cells = []; for (let i = 0; i < G.cols * G.rows; i++) R.cells.push({ dug: false, organ: null, traps: [], corpses: 0 });
    [G.ent, G.core].concat(G.start || []).forEach(i => { R.cells[i].dug = true; });
    ensurePath(R);
    (CD.START[R.aspect] || CD.START.brood).forEach(id => addCard(R, id));
    // 한 방울 때 단 부위가 뻗어 온다 (둘까지)
    (opts.body || []).slice(0, 2).forEach(pid => { if (CD.BY['l_' + pid]) addCard(R, 'l_' + pid); });
    R.meta.worlds = R.meta.worlds || {}; R.meta.worlds[R.world] = 1;
    return R;
  }
  const addCard = (R, id, up) => { const c = { uid: R.nextUid++, id, up: up || 0, secret: null, pairNights: 0 }; R.deck.push(c); return c; };
  const def = c => CD.BY[c.id];
  // 카드의 지금 모습(강화 반영)
  function view(c) {
    const d = def(c); if (!d) return null; const up = c.up > 0;
    const v = { uid: c.uid, id: c.id, name: d.name, type: d.type, asp: d.asp, rar: d.rar, tgt: d.tgt, cost: up ? d.upd.cost : d.cost, ops: up ? d.upd.ops : d.ops, charges: up ? d.upd.charges : d.charges, hooks: up ? d.upd.hooks : d.hooks, cap: up ? d.upd.cap : d.cap, kw: up ? d.upd.kw : d.kw, text: up ? d.textUp : d.text, more: d.more, up: c.up, kin: d.kin, n: d.n };
    if (d.type === 'kin') {
      const k = d.kin, st = Math.min(2, c.up);
      v.name = c.secret ? (N.SECRET[k] ? N.SECRET[k][2] : d.name) : st === 2 ? ((N.EVO2 && N.EVO2[k]) || d.name + '++') : st === 1 ? ((N.EVO && N.EVO[k]) || d.name + '+') : d.name;
      if (d.n > 1 && st > 0 && !c.secret) v.name += ' ' + d.n;
      v.ops = d.ops; v.cost = d.cost + (st === 2 ? 1 : 0); v.stage = st;
      v.text = CD.kinN(k) + (d.n > 1 ? ' ' + d.n : '') + ' 세움' + (st ? ' · 단계 ' + (st + 1) : '') + (c.secret ? ' · ' + ((N.RECIPE[c.secret] && N.RECIPE[c.secret].name) || '') : '');
    } else if (c.up && !/\+$/.test(v.name)) v.name += '+';
    return v;
  }

  // ---- 지도: 판 칸, 본체 방까지 거리 ----
  const nb = (R, i) => { const C = R.cols, c = i % C, r = Math.floor(i / C), o = []; if (c > 0) o.push(i - 1); if (c < C - 1) o.push(i + 1); if (r > 0) o.push(i - C); if (r < R.rows - 1) o.push(i + C); return o; };
  function distMap(R) { const d = new Array(R.cells.length).fill(-1); d[R.core] = 0; const q = [R.core]; while (q.length) { const u = q.shift(); for (const v of nb(R, u)) if (d[v] < 0 && R.cells[v].dug) { d[v] = d[u] + 1; q.push(v); } } return d; }
  function ensurePath(R) { let d = distMap(R), guard = 0; while (d[R.ent] < 0 && guard++ < 40) { const cand = R.cells.map((c, i) => i).filter(i => !R.cells[i].dug && nb(R, i).some(j => R.cells[j].dug && d[j] >= 0)); const best = cand.sort((a, b) => manh(R, a, R.ent) - manh(R, b, R.ent))[0]; if (best == null) break; R.cells[best].dug = true; d = distMap(R); } }
  const manh = (R, a, b) => Math.abs(a % R.cols - b % R.cols) + Math.abs(Math.floor(a / R.cols) - Math.floor(b / R.cols));
  // 적이 지나갈 길(입구에서 본체 방까지 가장 짧은 칸들)
  function pathCells(R) { const d = distMap(R), out = []; let u = R.ent; if (d[u] < 0) return out; out.push(u); let g = 0; while (u !== R.core && g++ < 60) { const nx = nb(R, u).filter(v => d[v] === d[u] - 1)[0]; if (nx == null) break; u = nx; out.push(u); } return out; }
  const digOptions = R => R.cells.map((c, i) => i).filter(i => !R.cells[i].dug && nb(R, i).some(j => R.cells[j].dug));

  // ================= 족보 =================
  // 같은 턴에 낸 카드(순서대로)로 본다. 저주를 일부러 내면 아무 빛깔이나 된다(불경한 짝).
  const HANDS = [
    { id: 'rite', name: '한 빛깔의 의식', text: '같은 빛깔 넷, 종류 셋 이상: 그 빛깔은 이 턴 두 배', tier: 2 },
    { id: 'body', name: '한 몸', text: '기관이 있는 칸 하나에 부위와 권속을 같이: 다음 턴 기운 +1 (밤마다 한 번)', tier: 1 },
    { id: 'echo', name: '메아리', text: '같은 이름 두 장(처음 덱 카드 빼고): 둘째 장 기운 −1', tier: 1 },
    { id: 'awaken', name: '깨어나는 살', text: '같은 빛깔 셋 + 같은 종류 둘: 이 밤 본체가 깨어난다', tier: 3 },
    { id: 'rainbow', name: '무지개 아가리', text: '다섯 빛깔 모두(무색 한 장은 아무 빛깔): 모든 적 15 피해, 정신 −15', tier: 4 },
    { id: 'profane', name: '불경한 짝', text: '저주를 바쳐 족보를 채움: 그 저주가 사라지고 모든 적 6 피해', tier: 2 },
    { id: 'swarm', name: '떼의 노래', text: '권속 세 장: 이 밤 권속 공격 +3', tier: 2 },
    { id: 'trapline', name: '이어진 덫', text: '서로 닿은 칸에 부위 셋: 그 부위들 +1번', tier: 2 },
    { id: 'ladder', name: '네 걸음', text: '기운 0·1·2·3 카드를 한 장씩: 두 장 뽑기', tier: 2 },
  ];
  const HBY = Object.fromEntries(HANDS.map(h => [h.id, h]));
  // played: [{ asp, type, id, cost, cell, curse }]
  function evalHands(played) {
    const out = [], P = played || [], cs = P.filter(p => p.curse).length, real = P.filter(p => !p.curse);
    const byAsp = {}, aspTypes = {}; real.forEach(p => { if (p.asp && p.asp !== 'none') { byAsp[p.asp] = (byAsp[p.asp] || 0) + 1; (aspTypes[p.asp] = aspTypes[p.asp] || new Set()).add(p.type); } });
    const topAsp = Object.keys(byAsp).sort((a, b) => byAsp[b] - byAsp[a])[0], top = topAsp ? byAsp[topAsp] : 0;
    let usedCurse = false;
    // 의식: 같은 빛깔 셋 (저주가 모자란 만큼 채운다)
    const riteOk = topAsp && aspTypes[topAsp].size >= 3;
    if (riteOk && top >= 4) out.push({ id: 'rite', asp: topAsp });
    else if (riteOk && top >= 3 && top + cs >= 4) { out.push({ id: 'rite', asp: topAsp }); usedCurse = true; }
    // 한 몸: 기관이 있는 칸 하나에 부위와 권속을 같이 (그 턴에 놓은 기관도 친다)
    { const oc = new Set((P.organCells || []).concat(real.filter(p => p.type === 'organ').map(p => p.cell))); const hit = [...oc].some(c => real.some(p => p.type === 'trap' && p.cell === c) && real.some(p => p.type === 'kin' && p.cell === c)); if (hit) out.push({ id: 'body' }); }
    // 메아리: 같은 이름 둘
    { const ids = {}; for (const p of real) { if (!p.starter) ids[p.id] = (ids[p.id] || 0) + 1; } if (Object.values(ids).some(v => v >= 2)) out.push({ id: 'echo' }); }
    // 깨어나는 살: 한 빛깔 셋 + 그 밖의 카드 중 같은 종류 둘
    if (topAsp && top + cs >= 3 && aspTypes[topAsp].size >= 2) { const rest = real.filter(p => p.asp !== topAsp), byT = {}; rest.forEach(p => { byT[p.type] = (byT[p.type] || 0) + 1; }); const spare = cs - Math.max(0, 3 - top); if (Object.values(byT).some(v => v >= 2) || (spare >= 1 && Object.values(byT).some(v => v >= 1))) { out.push({ id: 'awaken', asp: topAsp }); if (top < 3 || !Object.values(byT).some(v => v >= 2)) usedCurse = true; } }
    // 무지개 아가리: 다섯 빛깔
    { const have = ASPS.filter(a => byAsp[a]).length, wild = real.some(p => p.asp === 'none') ? 1 : 0; if (have + cs + wild >= 5 && have >= 3) { out.push({ id: 'rainbow' }); if (have + wild < 5) usedCurse = true; } }
    // 떼의 노래: 권속 셋
    if (real.filter(p => p.type === 'kin').length >= 3) out.push({ id: 'swarm' });
    // 이어진 덫: 부위 셋이 서로 닿은 칸
    { const tc = real.filter(p => p.type === 'trap' && p.cell != null).map(p => p.cell); if (tc.length >= 3 && P.cols) { const adj = (a, b) => Math.abs(a % P.cols - b % P.cols) + Math.abs(Math.floor(a / P.cols) - Math.floor(b / P.cols)) <= 1; for (let i = 0; i < tc.length; i++) for (let j = 0; j < tc.length; j++) for (let k = 0; k < tc.length; k++) if (i !== j && j !== k && i !== k && adj(tc[i], tc[j]) && adj(tc[j], tc[k]) && !out.some(o => o.id === 'trapline')) out.push({ id: 'trapline', cells: [tc[i], tc[j], tc[k]] }); } }
    // 네 걸음: 기운 0·1·2·3
    if ([0, 1, 2, 3].every(c => real.some(p => p.cost === c))) out.push({ id: 'ladder' });
    if (usedCurse && cs) out.push({ id: 'profane' });
    return out.map(h => Object.assign({}, h, { name: HBY[h.id].name, text: HBY[h.id].text, tier: HBY[h.id].tier }));
  }

  // ================= 밤 =================
  function enemyOf(R, kind, act, boss) {
    let d;
    if (kind === 'seeker') d = Object.assign({}, SEEKER[act - 1]);
    else { const b = N.INV[kind]; d = { name: b.name, hp: b.hp, atk: b.atk, df: b.df, san: b.san, gold: b.gold, traits: Object.keys(b).filter(k => !['name', 'g', 'b', 'hp', 'atk', 'df', 'san', 'gold', 'asp', 'only', 'tip'].includes(k) && b[k] && !(K.offTraits || []).includes(k)) }; }
    const m = kind === 'seeker' ? 1 : K.actMul[act] * (1 + 0.04 * (R.night - 1));
    const e = { uid: 'e' + (R.nextUid++), kind, name: knownName(R.meta, R.world, kind), hp: Math.round(d.hp * m), mhp: Math.round(d.hp * m), atk: Math.round(d.atk * m), df: d.df, san: Math.round(d.san * (kind === 'seeker' ? 1 : K.sanMul * (1 + 0.3 * (act - 1)))), gold: d.gold, traits: new Set(d.traits || []), cell: R.ent, inf: 0, mark: 0, hold: 0, mad: 0, revive: (d.traits || []).includes('revive') ? 1 : 0, shield: (d.traits || []).includes('shield') ? 10 : 0, boss: !!boss || (d.traits || []).includes('boss'), warded: false, lastSrc: null, routed: false };
    e.ward = kind === 'seeker' ? 0.3 : (N.INV[kind] && typeof N.INV[kind].ward === 'number' ? N.INV[kind].ward : 0);
    e.msan = e.san; return e;
  }
  function makeWave(R) {
    const act = R.act, n = R.night, boss = n > K.nights, pool = poolFor(R.world, act), out = [];
    let budget = Math.round((K.budget[Math.min(n, 6)] || 29) * (1 + K.budgetAct * 0.35 * (act - 1)));
    if (boss) { out.push({ kind: 'seeker', boss: true }); const wb = (WBOSS[R.world] || WBOSS.fantasy)[act - 1]; if (N.INV[wb]) out.push({ kind: wb, boss: true }); budget = Math.round(budget * 0.7); }
    let g = 0; while (budget > 0 && g++ < 60) { const k = pick(R, pool), cost = N.INV[k].g * 2; out.push({ kind: k }); budget -= cost; }
    // 우두머리는 맨 끝에 온다
    return out.filter(w => !w.boss).concat(out.filter(w => w.boss));
  }
  function startNight(R) {
    const Nn = { turn: 0, energy: K.energy, hand: [], draw: shuffle(R, R.deck.filter(c => !(def(c).type === 'organ' && c.placed)).map(c => c.uid)), discard: [], exhaust: [], enemies: [], kin: [], queue: makeWave(R), played: [], hands: [], rite: {}, nextEnergy: 0, awaken: false, swarm: 0, block: 0, events: [], kinPlayed: {}, drawn: 0, infRise: 0, spawned: 0, hurtCore: 0, kinLost: 0, hpStart: R.hp, maxKin: 0, plays: 0, bossKilledTurn: 0 };
    R.N = Nn; R.phase = 'night';
    R.cells.forEach(c => { c.traps = c.traps.filter(t => t.perm); c.corpses = 0; });
    if (R.ess >= 250) R.st.richNight = 1;
    // 기관: 밤마다
    R.cells.forEach((c, i) => { if (c.organ) runHook(R, c.organ, 'night', i); });
    moltFx(R, 'nightSpawn') && spawnKin(R, R.core, 'spawn', moltFx(R, 'nightSpawn'));
    if (R.aspect === 'brood') spawnKin(R, R.core, 'spawn', 2, true);
    if (R.aspect === 'nebula') Nn.firstDraw = 1;
    beginTurn(R, true);
    if (R.aspect === 'abyss') { Nn.block += 12; R.N.kin.forEach(k => { k.hp += 0; }); }
    return Nn;
  }
  const moltFx = (R, k) => R.molts.reduce((s, m) => s + ((CD.MOLT[m] && CD.MOLT[m].fx[k]) || 0), 0);
  function beginTurn(R, first) {
    const Nn = R.N; Nn.turn++; Nn.energy = K.energy + moltFx(R, 'energy') + Nn.nextEnergy + (first ? Nn.firstEnergy || 0 : 0); Nn.nextEnergy = 0; Nn.firstEnergy = 0;
    Nn.played = []; Nn.rite = {}; Nn.hands = []; Nn.block = 0;
    drawCards(R, K.draw + moltFx(R, 'draw') + (first ? moltFx(R, 'firstDraw') + (Nn.firstDraw || 0) : 0));
    Nn.sealed = []; const sealers = Math.min(1, alive(R).filter(e => e.traits.has('seal')).length); for (let k = 0; k < sealers && Nn.hand.length > Nn.sealed.length + 2; k++) { const free = Nn.hand.filter(u => !Nn.sealed.includes(u)); Nn.sealed.push(pick(R, free)); }
    // 적이 들어온다
    spawnEnemies(R, first);
  }
  function drawCards(R, n) {
    const Nn = R.N;
    for (let k = 0; k < n; k++) {
      if (Nn.hand.length >= K.handMax + (moltFx(R, 'firstDraw') ? 2 : 0)) break;
      if (!Nn.draw.length) { if (!Nn.discard.length) break; Nn.draw = shuffle(R, Nn.discard); Nn.discard = []; }
      const uid = Nn.draw.pop(); Nn.hand.push(uid); Nn.drawn++;
      const c = R.deck.find(x => x.uid === uid), v = c && view(c); if (v && v.type === 'curse' && v.hooks && v.hooks.draw) runOps(R, v.hooks.draw, { cell: R.core, card: v });
    }
    R.st.maxDrawNight = Math.max(R.st.maxDrawNight, Nn.drawn);
  }
  function spawnEnemies(R, first) {
    const Nn = R.N; if (!Nn.queue.length) return;
    const n = first ? Math.min(2, Nn.queue.length) : Math.min(Nn.queue.length, Math.max(1, Math.ceil(Nn.queue.length / 3)), 3);
    for (let k = 0; k < n; k++) { const w = Nn.queue.shift(); const e = enemyOf(R, w.kind, R.act, w.boss); Nn.enemies.push(e); enterCell(R, e, R.ent); }
  }
  const alive = R => R.N.enemies.filter(e => e.hp > 0 && !e.routed);
  const inCell = (R, i) => alive(R).filter(e => e.cell === i);
  const kinIn = (R, i) => R.N.kin.filter(k => k.hp > 0 && k.cell === i);
  const capOf = (R, i) => (i === R.core ? K.coreCap : K.kinCap) + (R.cells[i].organ ? (view(R.cells[i].organ).cap || 0) : 0);
  const frontOf = (R, i) => { const d = distMap(R); const es = i == null ? alive(R) : inCell(R, i); return es.sort((a, b) => (d[a.cell] - d[b.cell]) || (a.hp - b.hp))[0] || null; };

  // ---- 적에게 ----
  function hurt(R, e, n, src, ctx) {
    if (!e || e.hp <= 0 || e.routed) return 0;
    let x = n * (1 + e.mark / 100);
    if (src === 'trap' && e.traits.has('trapHalf')) x *= 0.5;
    if (src === 'kin') x = Math.max(1, x - e.df * 0.5);
    if (e.shield > 0) { const s = Math.min(e.shield, x); e.shield -= s; x -= s; }
    x = Math.round(x); if (x <= 0) return 0;
    e.hp -= x; e.lastSrc = src; R.st.dmgBy = R.st.dmgBy || {}; R.st.dmgBy[src] = (R.st.dmgBy[src] || 0) + x; if (x > R.st.maxHit) R.st.maxHit = x;
    if (e.hp <= 0) die(R, e, src, ctx);
    return x;
  }
  function die(R, e, src, ctx) {
    if (e.revive > 0) { e.revive--; e.hp = Math.round(e.mhp * 0.5); return; }
    const c = R.cells[e.cell]; c.corpses++; R.st.kills++; if (e.mark > 0) R.st.markedKills++;
    if (R.aspect === 'hunger' && R.hp > 0) { const h = Math.min(2, R.maxHp - R.hp); R.hp += h; R.st.healed += h; }
    gainEss(R, Math.round(e.gold / 3));
    learn(R, e.kind);
    if (e.boss) { if (src === 'trap') R.st.bossByTrap++; if (e.kind === 'seeker') { R.meta.seekerKills = (R.meta.seekerKills || 0) + 1; if (R.N.turn <= 8) R.st.seekerFast = 1; } }
    if (c.organ) runHook(R, c.organ, 'kill', e.cell);
    kinOnKill(R, e, ctx);
    if (e.inf > 0) { spawnKin(R, e.cell, 'infected', 1, true); R.st.infRise++; R.N.infRise++; R.st.maxInfNight = Math.max(R.st.maxInfNight, R.N.infRise); }
    R.N.events.push({ t: 'die', uid: e.uid, cell: e.cell });
  }
  function mind(R, e, n) {
    if (!e || e.hp <= 0 || e.routed) return;
    let x = n * (1 + moltFx(R, 'mindMul'));
    if (e.traits.has('nomind') || e.boss) { hurt(R, e, x * 0.8, 'mind'); if (e.traits.has('nomind')) return; } if (e.ward) x *= 1 - e.ward;
    e.san -= Math.round(x);
    if (e.san <= 0 && !e.boss) { e.routed = true; R.st.routs++; gainEss(R, Math.round(e.gold / 5) + (R.aspect === 'dusk' ? 3 : 0)); learn(R, e.kind); R.N.events.push({ t: 'rout', uid: e.uid, cell: e.cell }); if (R.N.convert > 0) { R.N.convert--; spawnKin(R, e.cell === R.core ? R.core : e.cell, 'cultist', 1, true); } }
  }
  function learn(R, kind) { const w = R.meta.words = R.meta.words || {}; const before = w[kind] || 0; w[kind] = before + 1; if (before + 1 === K.words) { R.st.learned++; R.N && R.N.events.push({ t: 'learn', kind, name: realName(R.world, kind) }); } }
  const gainEss = (R, n) => { R.ess += n; if (n > 0) R.st.essGot += n; };

  // ---- 권속 ----
  // 덱 판의 권속 세기: 카드 한 장 값에 맞춘다 (둥지 판의 KIN 은 값이 진액이라 그대로 쓰면 고르지 않다)
  const DK = { goblin: [26, 8, 0, 1], skeleton: [40, 5, 0, 5], cultist: [22, 3, 6, 1], scale: [40, 7, 0, 6], scribe: [32, 3, 9, 2], spawn: [15, 5, 0, 0], mask: [30, 2, 8, 2], hunger: [44, 8, 0, 3], netter: [28, 5, 0, 2], warden: [36, 5, 0, 4], turncoat: [54, 10, 0, 5], fallen: [34, 2, 4, 3], digger: [22, 4, 0, 1], clerk: [16, 2, 0, 1], licker: [28, 4, 0, 2], spitter: [22, 7, 0, 1], eyeheap: [36, 2, 8, 2], tangle: [46, 8, 0, 4], infected: [18, 6, 0, 1] };
  function spawnKin(R, cell, kind, n, temp, card) {
    const out = [];
    for (let k = 0; k < n; k++) {
      if (!temp && kinIn(R, cell).filter(u => !u.temp).length >= capOf(R, cell)) break;
      if (temp && kinIn(R, cell).filter(u => u.temp).length >= K.tempCap) break;
      const dk = DK[kind]; if (!dk) continue;
      const base = { name: kind === 'infected' ? '감염체' : (N.KIN[kind] ? N.KIN[kind].name : kind), hp: dk[0], atk: dk[1], satk: dk[2], df: dk[3] };
      const st = card ? Math.min(2, card.up) : 0, mul = (card && card.secret ? K.secretMul : K.stageMul[st]) * (1 + K.kinAct * (R.act - 1)) * (1 + moltFx(R, 'kinHp') * 0) ;
      const hpm = mul * (1 + moltFx(R, 'kinHp'));
      const u = { uid: 'k' + (R.nextUid++), kind, name: kind === 'infected' ? '감염체' : kind === 'spawn' ? '움' : base.name, hp: Math.round(base.hp * hpm), mhp: Math.round(base.hp * hpm), atk: Math.round(base.atk * mul), df: base.df || 0, satk: Math.round((base.satk || 0) * mul), cell, temp: !!temp, card: card ? card.uid : null, secret: card ? card.secret : null, revive: card && card.secret === 'pray' ? 1 : 0, buff: 0 };
      if (kind === 'spawn') { u.temp = true; R.st.spawned++; R.N.spawned++; R.st.maxSpawnNight = Math.max(R.st.maxSpawnNight, R.N.spawned); }
      R.N.kin.push(u); out.push(u);
    }
    R.st.maxKinNight = Math.max(R.st.maxKinNight, R.N.kin.filter(k => k.hp > 0).length);
    return out;
  }
  function kinOnKill(R, e, ctx) {
    const killer = ctx && ctx.kin; if (!killer) return;
    if (killer.secret === 'fist') killer.hp = Math.min(killer.mhp, killer.hp + Math.round(killer.mhp * 0.25));
    if (killer.secret === 'bind') gainEss(R, 10);
    if (killer.secret === 'twice') { kinIn(R, killer.cell).forEach(k => { k.hp = Math.min(k.mhp, k.hp + 4); }); alive(R).forEach(x => mind(R, x, 4)); }
  }

  // ---- 효과 낱말 풀이 ----
  const NUM = new Set(['dmg', 'mind', 'inf', 'heal', 'healKin', 'block', 'ess', 'swallow', 'dmgPer', 'mindPer', 'mark', 'eat', 'buff']);
  function targets(R, area, ctx) {
    const cell = ctx.cell;
    if (area === 'enter') return ctx.enemy ? [ctx.enemy] : [];
    if (area === 'one' || area === 'front') { const f = ctx.enemy && ctx.enemy.hp > 0 ? ctx.enemy : frontOf(R, cell); return f ? [f] : []; }
    if (area === 'cell') return inCell(R, cell);
    if (area === 'all') return alive(R);
    if (area === 'core') return inCell(R, R.core);
    if (area === 'rand') { const a = alive(R); return a.length ? [pick(R, a)] : []; }
    return inCell(R, cell);
  }
  function runOps(R, ops, ctx) {
    const mul = ctx.mul || 1, src = ctx.src || 'spell';
    for (const o of ops || []) {
      const [k, a0, b, c2] = o, a = NUM.has(k) && typeof a0 === 'number' ? Math.round(a0 * mul) : a0;
      switch (k) {
        case 'dmg': targets(R, b, ctx).forEach(e => hurt(R, e, a, src, ctx)); break;
        case 'mind': targets(R, b, ctx).forEach(e => mind(R, e, a)); break;
        case 'inf': targets(R, b, ctx).forEach(e => { e.inf += a * (1 + moltFx(R, 'infMul')); }); break;
        case 'mark': targets(R, b, ctx).forEach(e => { e.mark += a; }); break;
        case 'hold': targets(R, b, ctx).forEach(e => { e.hold = Math.max(e.hold, a); R.st.holds++; }); break;
        case 'mad': targets(R, b, ctx).forEach(e => { if (!e.boss) e.mad = Math.max(e.mad, a); }); break;
        case 'push': targets(R, b, ctx).forEach(e => { if (e.boss && e.kind === 'seeker') return; for (let s = 0; s < a; s++) { const d = distMap(R), back = nb(R, e.cell).filter(v => R.cells[v].dug && d[v] === d[e.cell] + 1); if (!back.length) break; e.cell = back[0]; R.st.pushes++; } }); break;
        case 'pull': targets(R, b, ctx).forEach(e => { for (let s = 0; s < a; s++) { const d = distMap(R), fw = nb(R, e.cell).filter(v => R.cells[v].dug && d[v] === d[e.cell] - 1); if (!fw.length) break; enterCell(R, e, fw[0]); } }); break;
        case 'swallow': { const thr = (a + moltFx(R, 'swallow')) * K.actMul[R.act]; const es = targets(R, b === 'cell' ? 'cell' : b, ctx).filter(e => e.hp <= thr && !(e.boss && e.kind === 'seeker')).sort((x, y) => y.hp - x.hp); const e = es[0]; if (e) { e.hp = 0; e.routed = false; R.st.swallow++; R.st.kills++; gainEss(R, Math.round(e.gold / 3)); learn(R, e.kind); R.N.events.push({ t: 'swallow', uid: e.uid, cell: e.cell }); } break; }
        case 'spawn': spawnKin(R, ctx.cell == null ? R.core : ctx.cell, 'spawn', a, true); break;
        case 'kin': { const us = spawnKin(R, ctx.cell == null ? R.core : ctx.cell, a, b || 1, false, ctx.card && ctx.card.uid ? R.deck.find(x => x.uid === ctx.card.uid) : null); if (ctx.card && ctx.card.uid && us.length) R.N.kinPlayed[ctx.card.uid] = (R.N.kinPlayed[ctx.card.uid] || []).concat(us.map(u => u.uid)); break; }
        case 'heal': { const h = Math.min(a, R.maxHp - R.hp); R.hp += h; R.st.healed += h; break; }
        case 'healKin': (b === 'all' ? R.N.kin : kinIn(R, ctx.cell)).forEach(k => { if (k.hp > 0) k.hp = Math.min(k.mhp, k.hp + a); }); break;
        case 'buff': (c2 === 'all' ? R.N.kin : kinIn(R, ctx.cell)).forEach(k => { if (k.hp > 0) { k.atk += a; if (b) { k.hp += b; k.mhp += b; } } }); break;
        case 'block': R.N.block += a; R.st.blocked += a; break;
        case 'draw': drawCards(R, a); R.N.extraDraw = (R.N.extraDraw || 0) + a; R.st.maxExtraDraw = Math.max(R.st.maxExtraDraw || 0, R.N.extraDraw); break;
        case 'energy': R.N.energy = Math.max(0, R.N.energy + a); break;
        case 'ess': if (a >= 0) gainEss(R, a); else R.ess = Math.max(0, R.ess + a); break;
        case 'eat': { const cl = R.cells[ctx.cell == null ? R.core : ctx.cell]; const n = cl.corpses; if (n) { gainEss(R, n * a); R.st.eaten += n; cl.corpses = 0; } break; }
        case 'rise': { const cl = R.cells[ctx.cell == null ? R.core : ctx.cell]; const n = Math.min(a, cl.corpses); if (n) { spawnKin(R, ctx.cell, 'infected', n, true); cl.corpses -= n; } break; }
        case 'dmgPer': { const cnt = countOf(R, b, ctx); targets(R, c2, ctx).forEach(e => hurt(R, e, a * cnt, src, ctx)); break; }
        case 'mindPer': { const cnt = countOf(R, b, ctx); targets(R, c2, ctx).forEach(e => mind(R, e, a * cnt)); break; }
        case 'self': R.hp -= a; R.st.selfDmg = (R.st.selfDmg || 0) + a; break;
        case 'curse': addCard(R, a); break;
        case 'thin': { const h = R.N.hand.filter(u => u !== (ctx.card && ctx.card.uid)); for (let s = 0; s < a && h.length; s++) { const u = h.shift(); R.N.hand.splice(R.N.hand.indexOf(u), 1); R.N.discard.push(u); } break; }
        case 'charge': R.cells.forEach(c => c.traps.forEach(t => { t.charges += a; })); break;
        case 'infect2': alive(R).forEach(e => { if (e.inf > 0) e.inf *= 2; }); break;
        case 'convert': R.N.convert = (R.N.convert || 0) + 2; break;
        case 'cap': break;
        default: break;
      }
    }
  }
  function countOf(R, what, ctx) {
    if (what === 'corpse') return R.cells[ctx.cell == null ? R.core : ctx.cell].corpses;
    if (what === 'inf') { const f = frontOf(R, ctx.cell); return f ? f.inf : 0; }
    if (what === 'organ') return R.cells.filter(c => c.organ).length;
    if (what === 'kin') return R.N.kin.filter(k => k.hp > 0).length;
    if (what === 'enemy') return inCell(R, ctx.cell).length;
    if (what === 'hand') return R.N.hand.length;
    if (what === 'curse') return R.deck.filter(c => def(c).type === 'curse').length;
    if (what === 'ess10') return Math.floor(R.ess / 10);
    if (what === 'handN') return R.N.handsNight || 0;
    return 0;
  }
  function runHook(R, organCard, hook, cell, enemy) { const v = view(organCard); if (v && v.hooks && v.hooks[hook]) runOps(R, v.hooks[hook], { cell, enemy, card: v, src: hook === 'enter' ? 'trap' : 'organ' }); }
  // 적이 칸에 들어설 때: 그 칸의 부위와 기관이 터진다
  function enterCell(R, e, i) {
    e.cell = i; const c = R.cells[i];
    if (c.organ) runHook(R, c.organ, 'enter', i, e);
    if (e.traits.has('lightfoot')) return;
    for (const t of c.traps) { if (t.charges <= 0 || e.hp <= 0 || e.routed) continue; if (e.traits.has('disarm') && rnd(R) < 0.3) { t.charges--; continue; } t.charges--; runOps(R, t.ops, { cell: i, enemy: e, src: 'trap', mul: t.mul || 1 }); }
    c.traps = c.traps.filter(t => t.charges > 0 || t.perm);
  }

  // ---- 카드 내기 ----
  const organCells = R => R.cells.map((c, i) => c.organ ? i : -1).filter(i => i >= 0);
  const handViews = R => R.N.hand.map(u => view(R.deck.find(c => c.uid === u)));
  function costOf(R, v) {
    if (v.type === 'curse') return 1;
    if (v.type === 'organ') return v.cost + 1;
    if (v.rar !== 's' && R.N.played.some(p => p.id === v.id)) return Math.max(0, v.cost - 1);
    return v.cost;
  }
  // 낼 수 있는 칸들 (빈 배열 = 칸이 필요 없는 카드면 [null])
  function cellsFor(R, v) {
    if (v.type === 'curse') return [null];
    if (v.type === 'organ') return R.cells.map((c, i) => i).filter(i => R.cells[i].dug && !R.cells[i].organ && i !== R.core);
    if (v.type === 'trap') return R.cells.map((c, i) => i).filter(i => R.cells[i].dug && i !== R.core && R.cells[i].traps.length < K.trapsPerCell);
    if (v.type === 'kin') return R.cells.map((c, i) => i).filter(i => R.cells[i].dug && kinIn(R, i).filter(u => !u.temp).length < capOf(R, i));
    if (v.tgt === 'cell' || v.tgt === 'room') return R.cells.map((c, i) => i).filter(i => R.cells[i].dug);
    return [null];
  }
  function canPlay(R, uid) { const c = R.deck.find(x => x.uid === uid); if (!c || !R.N || R.phase !== 'night' || !R.N.hand.includes(uid) || (R.N.sealed || []).includes(uid)) return false; const v = view(c); return R.N.energy >= costOf(R, v) && cellsFor(R, v).length > 0; }
  function play(R, uid, cell) {
    if (!canPlay(R, uid)) return { ok: false, msg: '낼 수 없다' };
    const c = R.deck.find(x => x.uid === uid), v = view(c), cost = costOf(R, v), cl = cellsFor(R, v);
    if (cl[0] !== null && !cl.includes(cell)) return { ok: false, msg: '그 칸에는 낼 수 없다' };
    R.N.energy -= cost; R.N.hand.splice(R.N.hand.indexOf(uid), 1); R.N.plays++;
    const mul = v.asp !== 'none' && R.N.rite[v.asp] ? 2 : 1;
    const ctx = { cell: cell == null ? R.core : cell, card: v, mul, src: v.type === 'trap' ? 'trap' : v.type === 'kin' ? 'kin' : 'spell' };
    if (v.type === 'organ') { R.cells[cell].organ = c; c.placed = true; R.st.organs++; R.N.exhaust.push(uid); runHook(R, c, 'night', cell); }
    else if (v.type === 'trap') { R.cells[cell].traps.push({ uid, id: v.id, name: v.name, ops: v.ops, charges: v.charges + moltFx(R, 'charges'), mul }); R.N.discard.push(uid); }
    else if (v.type === 'kin') { runOps(R, v.ops, ctx); R.N.exhaust.push(uid); }
    else if (v.type === 'curse') { R.N.discard.push(uid); }
    else { runOps(R, v.ops, ctx); (v.kw && v.kw.exhaust ? R.N.exhaust : R.N.discard).push(uid); }
    R.N.played.push({ uid, id: v.id, asp: v.asp, type: v.type, cost: v.type === 'curse' ? null : v.cost, cell, curse: v.type === 'curse', starter: v.rar === 's' });
    R.st.maxPlaysTurn = Math.max(R.st.maxPlaysTurn, R.N.played.length);
    applyHands(R);
    R.N.events.push({ t: 'play', uid, id: v.id, cell });
    checkNight(R);
    return { ok: true };
  }
  // 족보가 새로 맞으면 그 자리에서 효과
  function applyHands(R) {
    if (K.noHands) return;
    const P = R.N.played.slice(); P.cols = R.cols; P.organCells = organCells(R); const hs = evalHands(P), had = new Set(R.N.hands.map(h => h.id));
    for (const h of hs) {
      if (had.has(h.id)) continue; R.N.hands.push(h); R.st.hands[h.id] = (R.st.hands[h.id] || 0) + 1; R.st.handTotal++; R.meta.hands = R.meta.hands || {}; R.meta.hands[h.id] = (R.meta.hands[h.id] || 0) + 1;
      R.N.events.push({ t: 'hand', id: h.id, name: h.name }); R.N.handsNight = (R.N.handsNight || 0) + 1;
      if (h.id === 'rite') { R.N.rite[h.asp] = true; const last = [...R.N.played].reverse().find(p => p.asp === h.asp && !p.curse); if (last) { const v = view(R.deck.find(c => c.uid === last.uid)); if (v && v.type === 'spell') runOps(R, v.ops, { cell: last.cell == null ? R.core : last.cell, card: v }); else if (v && v.type === 'trap') { const t = R.cells[last.cell].traps.find(t2 => t2.uid === last.uid); if (t) t.mul = 2; } } }
      if (h.id === 'body') { if (!R.N.bodyDone) { R.N.bodyDone = true; R.N.nextEnergy += 1; } }
      if (h.id === 'awaken') { if (!R.N.awaken) { R.N.awaken = true; R.hp = Math.min(R.maxHp, R.hp + 10); } }
      if (h.id === 'rainbow') { alive(R).forEach(e => { hurt(R, e, 15, 'spell'); mind(R, e, 15); }); }
      if (h.id === 'profane') { const cu = [...R.N.played].reverse().find(p => p.curse); if (cu) { ['discard', 'draw', 'hand', 'exhaust'].forEach(k => { const i = R.N[k].indexOf(cu.uid); if (i >= 0) R.N[k].splice(i, 1); }); R.deck = R.deck.filter(c => c.uid !== cu.uid); } alive(R).forEach(e => hurt(R, e, 6, 'spell')); }
      if (h.id === 'swarm') { R.N.swarm += 3; R.N.kin.forEach(k => { k.atk += 3; }); }
      if (h.id === 'trapline') (h.cells || []).forEach(i => R.cells[i].traps.forEach(t => { t.charges += 1; }));
      if (h.id === 'ladder') drawCards(R, 2);
      // 족보를 아끼는 기관: 족보가 나오면
      R.cells.forEach((c, i) => { if (c.organ) runHook(R, c.organ, 'hand', i); });
    }
  }
  // 한 장 더면 맞는 족보 (손에 있는 카드로)
  function handPreview(R) {
    if (!R.N) return [];
    const now = new Set(evalHands(Object.assign(R.N.played.slice(), { cols: R.cols, organCells: organCells(R) })).map(h => h.id)), out = [];
    for (const uid of R.N.hand) {
      const v = view(R.deck.find(c => c.uid === uid)); if (!v || R.N.energy < costOf(R, v)) continue;
      const oc = organCells(R), cs = cellsFor(R, v), cell = v.type === 'trap' || v.type === 'kin' ? (cs.find(c => oc.includes(c) && R.N.played.some(p => p.cell === c)) ?? cs.find(c => oc.includes(c)) ?? cs[0]) : null;
      const P = R.N.played.concat([{ uid, id: v.id, asp: v.asp, type: v.type, cost: v.type === 'curse' ? null : v.cost, cell, curse: v.type === 'curse', starter: v.rar === 's' }]); P.cols = R.cols; P.organCells = oc;
      evalHands(P).filter(h => !now.has(h.id)).forEach(h => { if (!out.some(o => o.id === h.id)) out.push({ id: h.id, name: h.name, uid, card: v.name, cell }); });
    }
    return out;
  }

  // ---- 턴 끝 ----
  function endTurn(R) {
    const Nn = R.N; if (!Nn || R.phase !== 'night') return;
    // 손에 남은 저주
    handViews(R).forEach(v => { if (v && v.type === 'curse' && v.hooks && v.hooks.end) runOps(R, v.hooks.end, { cell: R.core, card: v }); });
    // 기관: 매 턴
    R.cells.forEach((c, i) => { if (c.organ) runHook(R, c.organ, 'turn', i); });
    // 세상마다 다른 적의 재주
    worldTraits(R);
    // 칸마다 싸움
    for (let i = 0; i < R.cells.length; i++) fightCell(R, i);
    // 감염이 썩힌다
    alive(R).forEach(e => { if (e.inf > 0) { hurt(R, e, Math.ceil(e.inf), 'inf'); e.inf = Math.max(0, Math.floor(e.inf - Math.max(1, e.inf / 3))); } });
    // 걷는다
    moveEnemies(R);
    // 본체 방
    coreFight(R);
    // 상태가 줄어든다
    alive(R).forEach(e => { if (e.hold > 0) e.hold--; if (e.mad > 0) e.mad--; e.warded = false; if (e.traits.has('shield')) e.shield = 10; });
    // 손을 버린다
    const keep = []; Nn.hand.forEach(u => { const v = view(R.deck.find(c => c.uid === u)); if (v && v.kw && v.kw.retain) keep.push(u); else Nn.discard.push(u); }); Nn.hand = keep;
    if (checkNight(R)) return;
    if (Nn.turn >= K.turnCap) { alive(R).forEach(e => { R.hp -= 10; e.routed = true; }); checkNight(R); return; }
    beginTurn(R, false);
    checkNight(R);
  }
  function worldTraits(R) {
    for (const e of alive(R)) {
      if (e.hold > 0) continue;
      // 포격: 두 칸 안의 권속 하나를 친다
      if (e.traits.has('bombard')) { const near = R.N.kin.filter(k => k.hp > 0 && manh(R, k.cell, e.cell) <= 2); if (near.length) { const k = pick(R, near); k.hp -= Math.round(e.atk * 0.6); if (k.hp <= 0) { R.N.kinLost += k.temp ? 0 : 1; R.N.events.push({ t: 'kindie', uid: k.uid, cell: k.cell }); } } }
      if (e.traits.has('reads')) { [e.cell].concat(nb(R, e.cell)).forEach(i => { const t = R.cells[i].traps.find(x => !x.perm && x.charges > 0); if (t) t.charges--; }); }
      // 조명: 그 칸의 부위가 한 번씩 닳는다
      if (e.traits.has('flood')) { const c = R.cells[e.cell]; c.traps.forEach(t => { if (!t.perm) t.charges = Math.max(0, t.charges - 1); }); c.traps = c.traps.filter(t => t.charges > 0 || t.perm); }
      // 공병: 기관이 있는 칸에 두 턴 머물면 그 기관을 뜯어낸다 (카드는 덱으로 돌아온다)
      if (e.traits.has('sap')) { const c = R.cells[e.cell]; if (c.organ) { e.sapT = (e.sapCell === e.cell ? (e.sapT || 0) : 0) + 1; e.sapCell = e.cell; if (e.sapT >= 2) { c.organ.placed = false; c.organ = null; e.sapT = 0; R.N.events.push({ t: 'sap', cell: e.cell }); } } }
    }
  }
  function fightCell(R, i) {
    const ks = kinIn(R, i), es = inCell(R, i); if (!ks.length || !es.length) return;
    const wall = ks.some(k => k.secret === 'wall') ? 0.7 : 1;
    for (const k of ks) {
      if (k.hp <= 0) continue; const tg = inCell(R, i); if (!tg.length) break;
      const t = tg.sort((a, b) => a.hp - b.hp)[0], ctx = { kin: k, cell: i };
      const bites = (k.kind === 'hunger' ? 2 : 1) + (k.secret === 'brawl' ? 1 : 0);
      for (let b = 0; b < bites; b++) { const tt = b === 0 ? t : (inCell(R, i)[0]); if (tt) hurt(R, tt, k.atk * (k.secret === 'fist' ? 1.15 : 1), 'kin', ctx); }
      if (k.satk > 0) { const ms = k.secret === 'read' || k.secret === 'record' || k.kind === 'eyeheap' || k.kind === 'mask' || k.kind === 'scribe' ? inCell(R, i) : [inCell(R, i)[0]].filter(Boolean); ms.forEach(e => mind(R, e, k.satk * (k.secret === 'choir' ? 1.5 : 1) * (k.secret === 'read' ? 0.65 : 1))); }
      if (k.kind === 'spitter') { const adj = nb(R, i).flatMap(j => inCell(R, j)); if (adj.length) hurt(R, adj[0], Math.round(k.atk * 0.6), 'kin', ctx); }
      if ((k.kind === 'tangle' || k.kind === 'netter' || k.kind === 'warden') && rnd(R) < 0.4) { const f = inCell(R, i)[0]; if (f) { f.hold = Math.max(f.hold, 1); R.st.holds++; } }
      if (k.kind === 'scale' || k.kind === 'licker' || k.kind === 'fallen') { const w = kinIn(R, i).sort((a, b) => a.hp / a.mhp - b.hp / b.mhp)[0]; if (w) w.hp = Math.min(w.mhp, w.hp + (k.kind === 'fallen' ? 5 : 3)); }
      if (k.secret === 'briar') inCell(R, i).slice(0, 2).forEach(e => { hurt(R, e, 4, 'kin', ctx); e.hold = Math.max(e.hold, 1); });
      if (k.kind === 'digger' || k.kind === 'clerk' || k.secret === 'ledger') gainEss(R, k.secret === 'ledger' ? 3 : 1);
    }
    for (const e of inCell(R, i)) {
      if (e.hold > 0) continue;
      if (e.mad > 0) { const other = inCell(R, i).filter(x => x !== e)[0] || alive(R).filter(x => x !== e)[0]; if (other) { hurt(R, other, e.atk, 'mad'); R.st.madHits++; } continue; }
      if (e.traits.has('heal')) inCell(R, i).forEach(x => { x.hp = Math.min(x.mhp, x.hp + 4); });
      const duel = e.traits.has('duel'), tk = kinIn(R, i).sort((a, b) => duel ? b.hp - a.hp : b.df - a.df)[0]; if (!tk) break;
      const hits = e.traits.has('twice') ? 2 : 1, others = inCell(R, i).filter(x => x !== e);
      const bonus = 2 * others.filter(x => x.traits.has('rally')).length + (e.traits.has('mob') ? others.filter(x => x.traits.has('mob')).length : 0);
      for (let h = 0; h < hits; h++) { const dmg = Math.max(1, Math.round((e.atk + bonus - tk.df * 0.5) * wall * (duel ? 1.5 : 1))); tk.hp -= dmg; if (tk.hp <= 0) { if (tk.revive > 0) { tk.revive--; tk.hp = Math.round(tk.mhp * 0.8); } else { R.N.kinLost += tk.temp ? 0 : 1; R.N.events.push({ t: 'kindie', uid: tk.uid, cell: i }); break; } } }
    }
  }
  function moveEnemies(R) {
    const d = distMap(R);
    const es = alive(R).sort((a, b) => d[a.cell] - d[b.cell]);
    for (const e of es) {
      if (e.hp <= 0 || e.routed || e.hold > 0 || e.cell === R.core) continue;
      if (kinIn(R, e.cell).length && !(e.traits.has('breach') && rnd(R) < 0.5)) continue;
      const steps = e.traits.has('fast') ? 2 : 1;
      for (let s = 0; s < steps; s++) {
        if ((s > 0 && kinIn(R, e.cell).length) || e.cell === R.core || e.hp <= 0 || e.routed) break;
        const opts = nb(R, e.cell).filter(v => R.cells[v].dug && d[v] === d[e.cell] - 1); if (!opts.length) break;
        enterCell(R, e, opts.length > 1 ? pick(R, opts) : opts[0]);
      }
    }
  }
  function coreFight(R) {
    const es = inCell(R, R.core); if (!es.length) return;
    const ks = kinIn(R, R.core); if (ks.length) return;
    const armor = moltFx(R, 'armor'), awake = R.N.awaken;
    for (const e of es) {
      if (e.hold > 0) continue;
      if (e.mad > 0) { const o = es.find(x => x !== e && x.hp > 0); if (o) { hurt(R, o, e.atk, 'mad'); R.st.madHits++; } continue; }
      let dmg = Math.max(1, e.atk * (e.traits.has('twice') ? 2 : 1) - armor - (awake ? 3 : 0)); const b = Math.min(R.N.block, dmg); R.N.block -= b; dmg -= b;
      R.hp -= dmg; R.N.hurtCore += dmg; R.st.coreDmg = (R.st.coreDmg || 0) + dmg; if (moltFx(R, 'thorns')) hurt(R, e, moltFx(R, 'thorns'), 'spell');
    }
    const t = inCell(R, R.core).sort((a, b) => a.hp - b.hp)[0]; if (t) hurt(R, t, (R.atk + moltFx(R, 'atk')) * (awake ? 2.2 : 1), 'core');
  }
  // 밤이 끝났나
  function checkNight(R) {
    const Nn = R.N; if (!Nn || R.phase !== 'night') return true;
    if (R.hp <= 0) { R.hp = 0; endRun(R, false); return true; }
    if (!Nn.queue.length && !alive(R).length) { nightWon(R); return true; }
    return false;
  }
  function nightWon(R) {
    const Nn = R.N, boss = R.night > K.nights;
    R.st.nightsWon++;
    if (Nn.hurtCore === 0) { R.st.cleanNights++; if (R.act >= 3) R.st.cleanLate = (R.st.cleanLate || 0) + 1; }
    if (Nn.kinLost === 0 && R.act >= 2) R.st.noKinLossNights++;
    if (R.hp <= 10) R.st.lowHpNight = 1;
    { const oc = organCells(R); let best = 0; const seen = new Set(); for (const s0 of oc) { if (seen.has(s0)) continue; let n = 0; const q = [s0]; seen.add(s0); while (q.length) { const u = q.shift(); n++; nb(R, u).forEach(v => { if (oc.includes(v) && !seen.has(v)) { seen.add(v); q.push(v); } }); } best = Math.max(best, n); } R.st.organChain = Math.max(R.st.organChain, best); }
    // 짝과 같은 칸에 섰던 권속 카드: 비밀 갈래에 한 밤
    for (const uid in Nn.kinPlayed) { const c = R.deck.find(x => x.uid === +uid); if (!c) continue; const kind = def(c).kin, sec = N.SECRET[kind]; if (!sec) continue; const mine = Nn.kin.filter(u => Nn.kinPlayed[uid].includes(u.uid)); if (mine.some(u => Nn.kin.some(o => o !== u && o.kind === sec[1] && o.cell === u.cell && !o.temp))) c.pairNights = (c.pairNights || 0) + 1; }
    const curses = R.deck.filter(c => def(c).type === 'curse').length;
    if (boss) {
      if (R.deck.length <= 15) R.st.thinBoss = 1; if (R.deck.length >= 32) R.st.fatBoss = 1; if (R.ess <= 50) R.st.poorBoss = 1;
      R.st.curseAct = Math.max(R.st.curseAct, curses); if (R.act === 2 && curses === 0) R.st.noCurseAct2 = 1;
      R.meta.actBy[R.aspect] = Math.max(R.meta.actBy[R.aspect] || 0, R.act + 1);
    }
    R.cells.forEach(c => { c.traps = c.traps.filter(t => t.perm); });
    R.hp = Math.min(R.maxHp, R.hp + moltFx(R, 'nightHeal'));
    gainEss(R, 12 + 4 * R.act + (boss ? 40 : 0));
    R.N = null;
    if (boss && R.act >= K.acts) { endRun(R, true); return; }
    // 보상
    R.reward = { cards: offerCards(R, boss ? 'boss' : 'night'), molts: boss ? moltOffer(R) : null };
    if (boss) { R.act++; R.night = 1; R.needleOffer = true; } else R.night++;
    R.phase = 'reward';
  }
  function takeReward(R, idx, moltId) {
    if (R.phase !== 'reward') return { ok: false };
    if (idx != null && R.reward.cards[idx]) { addCard(R, R.reward.cards[idx].id, R.reward.cards[idx].up || 0); }
    if (moltId && R.reward.molts && R.reward.molts.includes(moltId)) addMolt(R, moltId);
    R.reward = null; startDay(R); return { ok: true };
  }
  const addMolt = (R, id) => { R.molts.push(id); const fx = CD.MOLT[id].fx; if (fx.maxHp) { R.maxHp += fx.maxHp; R.hp += fx.maxHp; } };
  const moltOffer = R => shuffle(R, Object.keys(CD.MOLT).filter(m => !R.molts.includes(m))).slice(0, 3);

  // ================= 카드 셋 중 하나 =================
  function openPool(R) { return CD.LIST.filter(d => d.rar !== 's' && d.rar !== 'x' && d.type !== 'curse' && CD.isOpen(d, R.meta)); }
  function offerCards(R, why) {
    const pool = openPool(R), out = [];
    const w = why === 'boss' ? { c: 20, u: 50, r: 30 } : K.rarW;
    let tries = 0;
    while (out.length < 3 && tries++ < 200) {
      const roll = rnd(R), colour = roll < 0.6 ? R.aspect : roll < 0.85 ? 'none' : pick(R, ASPS);
      let rr = rnd(R) * (w.c + w.u + w.r); let rar = rr < w.c ? 'c' : rr < w.c + w.u ? 'u' : 'r';
      if (R.pity >= 3 && out.length === 0) rar = rnd(R) < 0.7 ? 'u' : 'r';
      let cand = pool.filter(d => d.asp === colour && d.rar === rar && !out.some(o => o.id === d.id));
      if (!cand.length) cand = pool.filter(d => d.rar === rar && !out.some(o => o.id === d.id));
      if (!cand.length) continue;
      out.push({ id: pick(R, cand).id, up: 0 });
    }
    const good = out.some(o => CD.BY[o.id].rar !== 'c'); R.pity = good ? 0 : R.pity + 1;
    return out;
  }

  // ================= 낮 =================
  function startDay(R) {
    R.phase = 'day'; R.actions = K.dayActions; R.paid = 0; R.offer = null; R.shop = null; R.digResult = null; R.rerolls = 0;
    R.hp = Math.min(R.maxHp, R.hp + Math.round(R.maxHp * K.dayHeal));
    gainEss(R, moltFx(R, 'dayEss'));
    R.cells.forEach((c, i) => { if (c.organ) { const v = view(c.organ); if (v.hooks && v.hooks.day) runOps(R, v.hooks.day, { cell: i, card: v }); } });
  }
  const spend = R => { R.actions--; };
  function dayOptions(R) {
    if (R.phase !== 'day') return [];
    const a = R.actions > 0, o = [];
    if (a && digOptions(R).length) o.push('dig');
    if (a) o.push('draft', 'upgrade', 'remove', 'shop');
    if (R.needleOffer) o.push('needle');
    o.push('night');
    return o;
  }
  function dig(R, cell) {
    if (R.phase !== 'day' || R.actions <= 0 || !digOptions(R).includes(cell)) return { ok: false };
    spend(R); R.cells[cell].dug = true; R.st.digs++;
    let x = rnd(R), kind = 'empty'; for (const [k, p] of K.dig) { if (x < p) { kind = k; break; } x -= p; }
    const res = { kind, cell };
    if (kind === 'empty') gainEss(R, 5);
    if (kind === 'bones') { R.offer = { why: 'bones', cards: offerCards(R, 'night') }; }
    if (kind === 'beast') { const lose = 4 + Math.floor(rnd(R) * 5); R.hp = Math.max(1, R.hp - lose); gainEss(R, 25); res.lose = lose; }
    if (kind === 'egg') { const kc = openPool(R).filter(d => d.type === 'kin' && (d.asp === R.aspect || d.asp === 'none')); if (kc.length) { const d = pick(R, kc); addCard(R, d.id); res.card = d.id; } }
    if (kind === 'cursed') { const rc = openPool(R).filter(d => d.rar === 'r'); if (rc.length) { const d = pick(R, rc); addCard(R, d.id); res.card = d.id; } const cu = pick(R, CD.LIST.filter(d => d.type === 'curse')); addCard(R, cu.id); res.curse = cu.id; }
    if (kind === 'altar') { R.needleOffer = true; R.st.altar++; }
    R.digResult = res; return Object.assign({ ok: true }, res);
  }
  function draft(R) { if (R.phase !== 'day' || R.actions <= 0) return { ok: false }; spend(R); R.offer = { why: 'draft', cards: offerCards(R, 'night') }; return { ok: true, cards: R.offer.cards }; }
  function reroll(R) { if (!R.offer) return { ok: false }; const price = K.reroll * (R.rerolls + 1); if (R.ess < price) return { ok: false, msg: '진액이 모자란다' }; R.ess -= price; R.rerolls++; R.offer.cards = offerCards(R, 'night'); return { ok: true, cards: R.offer.cards }; }
  function takeOffer(R, idx) { if (!R.offer) return { ok: false }; const o = R.offer.cards[idx]; if (o) addCard(R, o.id, o.up); R.offer = null; return { ok: true }; }
  function skipOffer(R) { R.offer = null; return { ok: true }; }
  // 강화: 권속은 세 단계, 셋째 단계에서 짝과 사흘 섰으면 비밀 갈래
  function upgradeOptions(R) { return R.deck.filter(c => { const d = def(c); if (d.type === 'curse' || c.placed) return false; return d.type === 'kin' ? c.up < 2 && !c.secret : c.up < 1; }).map(c => ({ uid: c.uid, name: view(c).name, secret: secretReady(c) })); }
  const secretReady = c => { const d = def(c); return d.type === 'kin' && c.up === 1 && !!N.SECRET[d.kin] && (c.pairNights || 0) >= 3; };
  function upgrade(R, uid, secret) {
    if (R.phase !== 'day' || R.actions <= 0) return { ok: false };
    const c = R.deck.find(x => x.uid === uid); if (!c || !upgradeOptions(R).some(o => o.uid === uid)) return { ok: false };
    spend(R); const d = def(c);
    if (secret && secretReady(c)) { c.up = 2; c.secret = N.SECRET[d.kin][0]; R.meta.secrets = (R.meta.secrets || 0) + 1; }
    else c.up++;
    if (d.type === 'kin' && c.up === 2) R.st.fullKin++;
    return { ok: true, card: view(c) };
  }
  // 진액으로 하는 것 (행동이 들지 않는다): 강화, 내보내기. 하루에 할수록 비싸진다
  const essPrice = (R, k) => (k === 'up' ? K.upEss : K.rmEss) + 15 * (R.paid || 0);
  function buyUpgrade(R, uid, secret) { if (R.phase !== 'day') return { ok: false }; const p = essPrice(R, 'up'); if (R.ess < p) return { ok: false, msg: '진액이 모자란다' }; const a = R.actions; R.actions = 1; const r = upgrade(R, uid, secret); R.actions = a; if (r.ok) { R.ess -= p; R.paid = (R.paid || 0) + 1; } return r; }
  function buyRemove(R, uid) { if (R.phase !== 'day') return { ok: false }; const p = essPrice(R, 'rm'); if (R.ess < p) return { ok: false, msg: '진액이 모자란다' }; const a = R.actions; R.actions = 1; const r = removeCard(R, uid); R.actions = a; if (r.ok) { R.ess -= p; R.paid = (R.paid || 0) + 1; } return r; }
  function removeCard(R, uid) { if (R.phase !== 'day' || R.actions <= 0) return { ok: false }; const i = R.deck.findIndex(c => c.uid === uid && !c.placed); if (i < 0) return { ok: false }; spend(R); R.deck.splice(i, 1); return { ok: true }; }
  function openShop(R) {
    if (R.phase !== 'day' || R.actions <= 0) return { ok: false }; spend(R);
    const pool = openPool(R), items = [];
    for (let k = 0; k < 5; k++) { const rar = k < 2 ? 'c' : k < 4 ? 'u' : 'r'; const cand = pool.filter(d => d.rar === rar && !items.some(x => x.id === d.id) && (rnd(R) < 0.6 ? d.asp === R.aspect : true)); const d = cand.length ? pick(R, cand) : pick(R, pool); items.push({ id: d.id, price: K.shopPrice[d.rar] || 40, sold: false }); }
    const m = moltOffer(R)[0]; R.shop = { items, molt: m ? { id: m, price: K.molt, sold: false } : null }; return { ok: true, shop: R.shop };
  }
  function shopBuy(R, idx) { const s = R.shop; if (!s) return { ok: false }; const it = idx === 'molt' ? s.molt : s.items[idx]; if (!it || it.sold || R.ess < it.price) return { ok: false }; R.ess -= it.price; it.sold = true; if (idx === 'molt') addMolt(R, it.id); else addCard(R, it.id); return { ok: true }; }
  // 낮에 기관 놓기: 진액으로 (행동은 들지 않는다)
  function placeOrgan(R, uid, cell) { if (R.phase !== 'day') return { ok: false }; const c = R.deck.find(x => x.uid === uid); if (!c || def(c).type !== 'organ' || c.placed) return { ok: false }; const price = K.organDay * view(c).cost; if (R.ess < price || !R.cells[cell] || !R.cells[cell].dug || R.cells[cell].organ || cell === R.core) return { ok: false, msg: '놓을 수 없다' }; R.ess -= price; R.cells[cell].organ = c; c.placed = true; R.st.organs++; return { ok: true }; }
  function goNight(R) { if (R.phase !== 'day') return { ok: false }; R.offer = null; R.shop = null; return { ok: true, night: startNight(R) }; }

  // ================= 바늘 점 (곁 도박) =================
  // 별 카드: 빛깔 다섯 × 별자리 일곱. 바늘 카드: 빛깔 없는(아무 빛깔이 되는) 별자리 일곱 중 둘, 끝까지 덮여 있다.
  const SIGNS = ['물결', '눈', '알', '가면', '이빨', '문', '바늘', '탑', '뿌리', '혀', '종', '고리', '날개'];
  const NHANDS = [
    { id: 'none', name: '흩어진 별', pay: 0 },
    { id: 'pair', name: '짝별', pay: 0.4 },
    { id: 'twopair', name: '두 짝별', pay: 0.9 },
    { id: 'three', name: '세 바늘', pay: 1.8 },
    { id: 'line', name: '이어진 별', pay: 3 },
    { id: 'colour', name: '한 빛깔 하늘', pay: 6, extra: 'rarUp' },
    { id: 'full', name: '깨어나는 살', pay: 4, extra: 'molt' },
    { id: 'four', name: '네 바늘', pay: 10, extra: 'molt+rare' },
    { id: 'turn', name: '바늘이 돌아섬', pay: 40, extra: 'molt2' },
  ];
  const NHBY = Object.fromEntries(NHANDS.map(h => [h.id, h]));
  function needleStart(R, why) {
    if (!R.needleOffer || R.needle) return { ok: false };
    R.needleOffer = false;
    const stars = []; ASPS.forEach(a => SIGNS.forEach((s, i) => stars.push({ asp: a, sign: i }))); shuffle(R, stars);
    const needles = shuffle(R, SIGNS.map((s, i) => ({ asp: 'none', sign: i })));
    let hole = needles.slice(0, 2);
    // 셋을 내리 잃으면 다음은 짝 하나가 보장된다
    if (R.needlePity >= 3) { hole = [Object.assign({}, needles[0]), { asp: 'none', sign: stars[0].sign }]; }
    R.needle = { why: why || 'altar', stars: stars.slice(0, 5), hole, shown: 0, stake: { ess: 0, hp: 0, cards: [] }, step: 0, done: false, result: null };
    return { ok: true, needle: needlePublic(R) };
  }
  const stakeValue = s => s.ess + s.hp * 5 + s.cards.length * 30;
  function needlePublic(R) { const n = R.needle; if (!n) return null; return { step: n.step, stars: n.stars.slice(0, n.shown), hole: n.done ? n.hole : [null, null], stake: Object.assign({}, n.stake, { value: stakeValue(n.stake) }), done: n.done, result: n.result }; }
  function needleBet(R, what) {
    const n = R.needle; if (!n || n.done) return { ok: false };
    if (what.kind === 'ess') { const v = Math.min(what.n || 10, R.ess); if (v <= 0) return { ok: false }; R.ess -= v; n.stake.ess += v; }
    else if (what.kind === 'hp') { const v = Math.min(what.n || 5, R.maxHp - 20); if (v <= 0) return { ok: false }; R.maxHp -= v; R.hp = Math.min(R.hp, R.maxHp); n.stake.hp += v; }
    else if (what.kind === 'card') { const i = R.deck.findIndex(c => c.uid === what.uid && def(c).type === 'kin'); if (i < 0) return { ok: false }; n.stake.cards.push(R.deck.splice(i, 1)[0]); }
    return { ok: true, needle: needlePublic(R) };
  }
  // 걸고 나면 별을 연다: 셋 → 하나 → 하나. 다 열리면 결과
  function needleReveal(R) {
    const n = R.needle; if (!n || n.done) return { ok: false };
    if (stakeValue(n.stake) <= 0) return { ok: false, msg: '먼저 건다' };
    n.step++; n.shown = n.step === 1 ? 3 : n.step === 2 ? 4 : 5;
    if (n.step >= 3) return needleResult(R);
    return { ok: true, needle: needlePublic(R) };
  }
  function needleFold(R) {
    const n = R.needle; if (!n || n.done) return { ok: false };
    // 접으면 건 것의 절반만 돌려받는다 (첫 별을 열기 전이면 다 돌려받는다)
    const back = n.step === 0 ? 1 : 0.5; R.ess += Math.floor(n.stake.ess * back); if (back === 1) { R.maxHp += n.stake.hp; n.stake.cards.forEach(c => R.deck.push(c)); }
    n.done = true; n.result = { folded: true, hand: null }; R.needle = null; return { ok: true };
  }
  // 일곱 장 중 다섯으로 가장 좋은 것
  function needleBest(cards) {
    const combos = []; const idx = [0, 1, 2, 3, 4, 5, 6].slice(0, cards.length);
    const rec = (s, acc) => { if (acc.length === 5) { combos.push(acc.slice()); return; } for (let i = s; i < idx.length; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); } };
    rec(0, []);
    let best = NHANDS[0];
    for (const cb of combos) { const h = needleEval(cb.map(i => cards[i])); if (NHANDS.indexOf(h) > NHANDS.indexOf(best)) best = h; }
    return best;
  }
  function needleEval(five) {
    const cnt = {}; five.forEach(c => { cnt[c.sign] = (cnt[c.sign] || 0) + 1; });
    const vs = Object.values(cnt).sort((a, b) => b - a);
    const colour = five.every(c => c.asp !== 'none' && c.asp === five[0].asp);
    const signs = [...new Set(five.map(c => c.sign))].sort((a, b) => a - b), line = signs.length === 5 && (signs[4] - signs[0] === 4 || (signs[0] === 0 && signs[1] === 9 && signs[4] === 12));
    if (line && colour) return NHBY.turn;
    if (vs[0] >= 4) return NHBY.four;
    if (vs[0] === 3 && vs[1] >= 2) return NHBY.full;
    if (colour) return NHBY.colour;
    if (line) return NHBY.line;
    if (vs[0] === 3) return NHBY.three;
    if (vs[0] === 2 && vs[1] === 2) return NHBY.twopair;
    if (vs[0] === 2) return NHBY.pair;
    return NHBY.none;
  }
  function needleResult(R) {
    const n = R.needle; if (!n) return { ok: false };
    n.done = true; n.shown = 5;
    const h = needleBest(n.stars.concat(n.hole)), v = stakeValue(n.stake), res = { hand: h.id, name: h.name, pay: 0, gifts: [] };
    if (h.pay > 0) {
      res.pay = Math.floor(v * h.pay); gainEss(R, res.pay); if (h.pay >= 1) R.st.needleWins++;
      if (h.pay >= 1 && n.stake.hp) { R.maxHp += n.stake.hp; }
      R.needlePity = 0;
      if (h.pay >= 1) n.stake.cards.forEach(c => { if (def(c).type === 'kin' && c.up < 2) c.up++; R.deck.push(c); });
      if (h.extra === 'rarUp' || h.extra === 'molt+rare') { const rc = openPool(R).filter(d => d.rar === 'r'); if (rc.length) { const d = pick(R, rc); addCard(R, d.id); res.gifts.push(d.id); } }
      if (h.extra && h.extra.indexOf('molt') === 0) { const m = moltOffer(R); const k = h.extra === 'molt2' ? 2 : 1; m.slice(0, k).forEach(id => { addMolt(R, id); res.gifts.push(id); }); }
      if (h.pay >= 7) R.st.needleBig++;
    } else {
      R.needlePity++;
      if (v >= 40 || n.stake.cards.length) { const cu = pick(R, CD.LIST.filter(d => d.type === 'curse')); addCard(R, cu.id); res.curse = cu.id; }
    }
    n.result = res; const pub = needlePublic(R); R.needle = null; return { ok: true, needle: pub, result: res };
  }

  // ================= 판 끝 =================
  function endRun(R, win) {
    R.over = { win, act: R.act, night: R.night, score: score(R, win) }; R.phase = 'over';
    const m = R.meta; m.runs = (m.runs || 0) + 1;
    if (win) { m.winBy[R.aspect] = (m.winBy[R.aspect] || 0) + 1; m.actBy[R.aspect] = Math.max(m.actBy[R.aspect] || 0, 4); }
    m.actBy[R.aspect] = Math.max(m.actBy[R.aspect] || 0, R.act);
    // 판을 넘어 쌓는다
    m.tot = m.tot || {}; ['swallow', 'madHits', 'infRise', 'spawned', 'routs', 'essGot', 'eaten', 'digs', 'altar', 'holds', 'pushes', 'markedKills', 'healed', 'blocked', 'handTotal', 'kills', 'needleWins', 'needleBig'].forEach(k => { m.tot[k] = (m.tot[k] || 0) + (R.st[k] || 0); });
    R.over.unlocks = releaseUnlocks(m, checkUnlocks(m, R.st));
  }
  function score(R, win) { return R.st.nightsWon * 100 + R.st.kills * 3 + Math.floor(R.st.essGot / 2) + (R.act - 1) * 400 + (win ? 2000 : 0) + Object.values(R.st.hands).reduce((a, b) => a + b, 0) * 5; }
  function checkUnlocks(meta, st) {
    meta.unlocked = meta.unlocked || {}; const out = [];
    for (const id in CD.UNLOCK) { if (meta.unlocked[id] || (meta.queue || []).includes(id)) continue; let okk = false; try { okk = !!CD.UNLOCK[id].check(st || {}, meta); } catch (e) { okk = false; } if (okk) { meta.unlocked[id] = 1; out.push({ cond: id, text: CD.UNLOCK[id].text, cards: CD.LIST.filter(d => d.unlock === id).map(d => d.id) }); } }
    return out;
  }
  // 한 판에 보여 주는 새 해금은 K.unlockCap 까지. 나머지는 줄을 서서 다음 판에 열린다 (줄 선 것은 아직 잠겨 있다)
  function releaseUnlocks(meta, fresh) {
    meta.queue = meta.queue || []; fresh.forEach(u => { delete meta.unlocked[u.cond]; meta.queue.push(u.cond); });
    const out = [];
    while (meta.queue.length && out.length < K.unlockCap) { const id = meta.queue.shift(); meta.unlocked[id] = 1; out.push({ cond: id, text: CD.UNLOCK[id].text, cards: CD.LIST.filter(d => d.unlock === id).map(d => d.id) }); }
    return out;
  }
  // 한 방울에서 단 부위를 기억한다 (뻗어 온 부위 카드가 열린다)
  function rememberParts(meta, partIds) { meta.parts = meta.parts || {}; (partIds || []).forEach(p => { meta.parts[p] = 1; }); return meta; }

  // ---- 화면에 줄 것 ----
  function nightView(R) {
    const Nn = R.N; if (!Nn) return null;
    return { turn: Nn.turn, energy: Nn.energy, block: Nn.block, hand: handViews(R).map(v => Object.assign({}, v, { costNow: costOf(R, v), cells: cellsFor(R, v), sealed: (Nn.sealed || []).includes(v.uid), can: Nn.energy >= costOf(R, v) && !(Nn.sealed || []).includes(v.uid) })), drawN: Nn.draw.length, discardN: Nn.discard.length, queue: Nn.queue.length, enemies: alive(R).map(e => ({ uid: e.uid, kind: e.kind, name: e.name, hp: e.hp, mhp: e.mhp, san: e.san, msan: e.msan, cell: e.cell, inf: e.inf, mark: e.mark, hold: e.hold, mad: e.mad, boss: e.boss })), kin: Nn.kin.filter(k => k.hp > 0).map(k => ({ uid: k.uid, kind: k.kind, name: k.name, hp: k.hp, mhp: k.mhp, atk: k.atk, cell: k.cell, temp: k.temp, secret: k.secret })), hands: Nn.hands.slice(), preview: handPreview(R), awaken: Nn.awaken, path: pathCells(R) };
  }
  function mapView(R) { return R.cells.map((c, i) => ({ i, dug: c.dug, organ: c.organ ? view(c.organ) : null, traps: c.traps.map(t => ({ id: t.id, name: t.name, charges: t.charges })), corpses: c.corpses, ent: i === R.ent, core: i === R.core, canDig: R.phase === 'day' && digOptions(R).includes(i) })); }
  function deckView(R) { return R.deck.map(view); }

  return { K, TRAIT, HANDS, NHANDS, SIGNS, ALIEN, SEEKER, newMeta, newRun, view, deckView, mapView, nightView, pathCells, digOptions, distMap,
    evalHands, handPreview, startNight, canPlay, cellsFor, costOf, play, endTurn, takeReward,
    dayOptions, dig, draft, reroll, takeOffer, skipOffer, upgradeOptions, upgrade, secretReady, removeCard, buyUpgrade, buyRemove, essPrice, openShop, shopBuy, placeOrgan, goNight, startDay,
    needleStart, needleBet, needleReveal, needleFold, needleResult, needleBest, needleEval,
    knownName, realName, checkUnlocks, releaseUnlocks, rememberParts, score, rnd };
})();
if (typeof module !== 'undefined') module.exports = DECK;
