// 새 판 (시험): 둥지 판에 부위를 놓고 굴을 비틀어 길을 만든 뒤, 밤은 저절로 싸운다.
// 부위마다 쿨다운이 차면 발동한다. 같은 태그를 모으면 세트 보너스가 열리고, 본체는 판에 놓은 것을 닮아 가며 그 방식으로 싸운다.
// 공간 규칙: 포자는 위아래옆 칸으로 번지고, 아가리는 제 칸과 길 다음 칸을 물고, 알은 곁의 길 칸으로 깨어나고, 기관은 곁 칸에 기운을 준다.
// 화면 없이 돈다 (node 로 시험한다). 화면은 trendui.js.
const TREND = (function () {
  const COLS = 5, ROWS = 4, N = COLS * ROWS, DT = 0.1;
  const rngOf = s => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const env = k => (typeof process !== 'undefined' && process.env && process.env[k]) || null;

  // 태그: 세트 보너스 단계 (이름 · 숫자, 뜻은 눌렀을 때)
  const TAG = {
    spore: { name: '포자', steps: [2, 4], text: ['포자 피해 ×1.5', '포자 낀 적이 죽으면 곁 칸으로 터진다'] },
    maw: { name: '아가리', steps: [2, 4], text: ['삼킴 한계 ×1.8', '삼킬 때마다 본체 체력 +4'] },
    egg: { name: '알', steps: [2, 4], text: ['움 +1', '움 체력·공격 ×1.6'] },
    water: { name: '물', steps: [2], text: ['물 피해 ×2'] },
    eye: { name: '눈', steps: [2], text: ['치명 30% (×2.5)'] },
    bone: { name: '뼈', steps: [2], text: ['권속 체력 ×1.8'] },
  };
  const TAGS = Object.keys(TAG);

  // 부위. kind: trap(굴 칸) / kin(길 칸, 막는다) / organ(길 아닌 칸, 곁에 기운) / skill(싸움 중 직접)
  const P = {
    teeth: { name: '이빨 바닥', kind: 'trap', tags: ['maw'], rar: 1, cd: 1.5, dmg: 32, face: '32 · 제 칸과 다음 칸', fx: 'maw' },
    maw: { name: '바닥 아가리', kind: 'trap', tags: ['maw'], rar: 1, cd: 2.5, swallow: 70, dmg: 40, face: '70 이하 삼킴 · 아니면 40', fx: 'swallow' },
    sporebag: { name: '포자 주머니', kind: 'trap', tags: ['spore'], rar: 1, cd: 3, spore: 2, face: '포자 2 · 곁 칸까지', fx: 'spore' },
    vine: { name: '감염 덩굴', kind: 'trap', tags: ['spore'], rar: 1, cd: 3.5, spore: 4, slow: 1.5, one: true, face: '한 적에 포자 4 · 느려짐', fx: 'spore' },
    eggsac: { name: '알주머니', kind: 'trap', tags: ['egg'], rar: 1, cd: 7, spawn: 2, face: '움 2 · 곁 길 칸에', fx: 'egg' },
    tide: { name: '차오르는 물', kind: 'trap', tags: ['water'], rar: 1, cd: 3.5, dmg: 9, slow: 1, face: '칸 안 모두 9 · 느려짐', fx: 'water' },
    eyewall: { name: '벽의 눈', kind: 'trap', tags: ['eye'], rar: 1, cd: 2.6, dmg: 16, reach: 2, face: '두 칸 앞까지 16', fx: 'eye' },
    gut: { name: '소화액 웅덩이', kind: 'trap', tags: ['maw', 'water'], rar: 1, cd: 3, dmg: 7, face: '칸 안 모두 7', fx: 'gut' },
    ribs: { name: '뼈 창살', kind: 'trap', tags: ['bone'], rar: 1, cd: 5, stun: 1.6, face: '칸 안 모두 1.6초 묶음', fx: 'bone' },
    sporemaw: { name: '포자 아가리', kind: 'trap', tags: ['spore', 'maw'], rar: 2, cd: 4, swallow: 55, dmg: 26, burst: 2, face: '55 이하 삼킴 · 포자 두 배로 터짐', fx: 'swallow' },
    brood: { name: '끝없는 산란', kind: 'trap', tags: ['egg'], rar: 2, cd: 6, spawn: 4, face: '움 4 · 곁 길 칸에', fx: 'egg' },
    bloom: { name: '역병 꽃', kind: 'trap', tags: ['spore', 'water'], rar: 2, cd: 4, spore: 4, dmg: 6, face: '포자 4와 6 · 곁 칸까지', fx: 'spore' },
    stare: { name: '천의 눈', kind: 'trap', tags: ['eye'], rar: 2, cd: 3.2, dmg: 12, reach: 3, all: true, face: '세 칸 앞까지 모두 12', fx: 'eye' },
    abyss: { name: '바닥 없는 아가리', kind: 'trap', tags: ['maw'], rar: 3, cd: 3.5, swallow: 110, dmg: 40, grow: 0.12, face: '110 이하 삼킴 · 삼킬수록 세짐', fx: 'swallow' },
    plague: { name: '역병 어미', kind: 'trap', tags: ['spore', 'egg'], rar: 3, cd: 5, spore: 6, spawnOnSpore: true, face: '포자 6 · 포자 낀 적이 죽으면 움', fx: 'spore' },
    hive: { name: '알의 탑', kind: 'trap', tags: ['egg'], rar: 3, cd: 7, spawn: 3, swarm: true, face: '움 3 · 움이 넷 넘으면 움 공격 ×2', fx: 'egg' },
    biter: { name: '깨물이', kind: 'kin', tags: ['maw'], rar: 1, hp: 60, atk: 9, art: 'goblin', face: '60 · 9' },
    shell: { name: '뼈껍질', kind: 'kin', tags: ['bone'], rar: 1, hp: 150, atk: 4, art: 'skeleton', face: '150 · 4' },
    licker: { name: '핥는 것', kind: 'kin', tags: ['spore'], rar: 1, hp: 55, atk: 5, sporeHit: 2, art: 'licker', face: '55 · 5 · 칠 때 포자 2' },
    tangle: { name: '촉수 뭉치', kind: 'kin', tags: ['water'], rar: 1, hp: 90, atk: 6, slowHit: 0.8, art: 'tangle', face: '90 · 6 · 느려짐' },
    hood: { name: '두건 쓴 것', kind: 'kin', tags: ['eye'], rar: 1, hp: 45, atk: 3, heal: 5, art: 'cultist', face: '45 · 곁 권속 초당 5' },
    mother: { name: '움 어미', kind: 'kin', tags: ['egg', 'bone'], rar: 2, hp: 110, atk: 5, spawnEvery: 6, art: 'spawn', face: '110 · 6초마다 움' },
    hunger: { name: '허기', kind: 'kin', tags: ['maw'], rar: 2, hp: 80, atk: 16, lifesteal: 0.5, art: 'hunger', face: '80 · 16 · 피를 마심' },
    wombs: { name: '알집', kind: 'organ', tags: ['egg'], rar: 1, aura: { spawn: 1 }, face: '곁 칸 알 +1' },
    sporesac: { name: '포자낭', kind: 'organ', tags: ['spore'], rar: 1, aura: { spore: 1 }, face: '곁 칸 포자 +1' },
    stomach: { name: '위장', kind: 'organ', tags: ['maw'], rar: 1, aura: { swallow: 0.5 }, face: '곁 칸 삼킴 +50%' },
    eyepost: { name: '눈 기둥', kind: 'organ', tags: ['eye'], rar: 1, aura: { cd: 0.8 }, face: '곁 칸 쿨다운 -20%' },
    marrow: { name: '뼈 받침', kind: 'organ', tags: ['bone'], rar: 1, aura: { hp: 0.5 }, face: '곁 칸 권속 체력 +50%' },
    pool: { name: '고인 웅덩이', kind: 'organ', tags: ['water'], rar: 2, aura: { dmg: 0.4 }, face: '곁 칸 피해 +40%' },
    wave: { name: '해일', kind: 'skill', tags: ['water'], rar: 1, dmg: 30, push: 2, face: '한 칸 모두 30 · 두 칸 밀어냄' },
    burst: { name: '포자 터뜨리기', kind: 'skill', tags: ['spore'], rar: 1, perStack: 7, face: '모든 포자 터짐 · 한 겹 7' },
    call: { name: '부름', kind: 'skill', tags: ['egg'], rar: 1, spawn: 4, face: '고른 칸에 움 4' },
    gulp: { name: '한 입', kind: 'skill', tags: ['maw'], rar: 1, dmg: 80, face: '본체가 한 적을 문다 80' },
    phantom: { name: '환영', kind: 'skill', tags: ['eye'], rar: 2, stun: 2.5, face: '모든 적 2.5초 멈춤' },
  };
  const PIDS = Object.keys(P);
  const KIND = { trap: '부위', kin: '권속', organ: '기관', skill: '기술' };

  // 본체: 판에서 가장 많은 태그를 닮아, 그 방식으로 싸운다
  const BODY = {
    spore: { name: '포자를 뿜는 몸', face: '4초마다 본체 둘레에 포자 4', every: 4 },
    maw: { name: '앞 칸을 무는 몸', face: '3초마다 앞 칸을 문다 · 40 이하 삼킴', every: 3 },
    egg: { name: '알을 낳는 몸', face: '5초마다 앞 칸에 움 2', every: 5 },
    water: { name: '물을 토하는 몸', face: '4초마다 둘레 모두 15', every: 4 },
    eye: { name: '꿰뚫어 보는 몸', face: '3초마다 세 칸 안 가장 먼 적에 30', every: 3 },
    bone: { name: '뼈로 굳은 몸', face: '받는 피해 -40% · 가시 6', every: 0 },
    none: { name: '한 방울', face: '본체 칸의 적에 10', every: 0 },
  };

  const E = {
    villager: { name: '마을 사람', hp: 94, atk: 11, spd: 0.72, gold: 1 },
    militia: { name: '자경단', hp: 198, atk: 18, spd: 0.6, gold: 2 },
    hound: { name: '사냥개', hp: 72, atk: 14, spd: 1.32, gold: 1 },
    priest: { name: '사제', hp: 162, atk: 11, spd: 0.6, gold: 2, healer: 6 },
    captain: { name: '대장', hp: 612, atk: 32, spd: 0.5, gold: 8, elite: true, rally: 3 },
    hunter: { name: '사냥꾼', hp: 576, atk: 25, spd: 0.72, gold: 8, elite: true, breaker: 6 },
  };

  // ---- 둥지 판: 굴 칸(dug)과 그 사이 가장 짧은 길 ----
  const nbrs = i => { const c = i % COLS, rr = Math.floor(i / COLS), o = []; if (c > 0) o.push(i - 1); if (c < COLS - 1) o.push(i + 1); if (rr > 0) o.push(i - COLS); if (rr < ROWS - 1) o.push(i + COLS); return o; };
  function pathOf(bd) {
    const prev = new Array(N).fill(-1), seen = new Array(N).fill(false), q = [bd.ent]; seen[bd.ent] = true;
    while (q.length) { const u = q.shift(); if (u === bd.core) break; for (const v of nbrs(u)) if (!seen[v] && bd.dug[v]) { seen[v] = true; prev[v] = u; q.push(v); } }
    if (!seen[bd.core]) return null; const p = []; for (let v = bd.core; v !== -1; v = prev[v]) p.unshift(v); return p;
  }
  // 굴: 뱀처럼 굽은 굴 하나 (첫 줄 → 한쪽 끝으로 내려감 → 셋째 줄을 가로지름 → 마지막 줄로 본체) + 첫 줄과 셋째 줄을 잇는 지름길 한 칸 + 막다른 곁굴.
  // 처음 길은 지름길과 본체 위 칸으로 짧다. 지름길을 막으면 길이 늘어난다
  function makeBoard(r) {
    const dug = new Array(N).fill(false), ent = Math.floor(r() * COLS), core = (ROWS - 1) * COLS + 2, at = (row, c) => { dug[row * COLS + c] = true; };
    const A = ent <= 2 ? (ent === 2 && r() < 0.5 ? 0 : 4) : 0, B = COLS - 1 - A;
    for (let c = Math.min(ent, A); c <= Math.max(ent, A); c++) at(0, c);
    at(1, A); for (let c = 0; c < COLS; c++) at(2, c); for (let c = Math.min(B, 2); c <= Math.max(B, 2); c++) at(3, c);
    const sc = []; for (let c = Math.min(ent, A); c <= Math.max(ent, A); c++) if (Math.abs(c - A) >= 2) sc.push(c);
    if (sc.length) at(1, pick(r, sc));
    const side = []; for (let i = 0; i < N; i++) if (!dug[i] && i !== core && nbrs(i).filter(j => dug[j]).length === 1) side.push(i);
    if (side.length && r() < 0.7) dug[pick(r, side)] = true;
    const bd = { dug, ent, core, edits: 3, path: null }; bd.path = pathOf(bd); return bd;
  }
  const onPath = (R, c) => R.bd.path.includes(c);
  // 굴 바꾸기: 판 칸을 막거나(길이 남아 있어야 한다), 굴 곁의 흙을 판다
  function canToggle(R, c) {
    const bd = R.bd; if (bd.edits <= 0 || c === bd.ent || c === bd.core) return false;
    if (bd.dug[c]) { bd.dug[c] = false; const ok = !!pathOf(bd); bd.dug[c] = true; return ok; }
    return nbrs(c).some(j => bd.dug[j]);
  }
  function toggle(R, c) {
    if (!canToggle(R, c)) return false; const bd = R.bd; bd.dug[c] = !bd.dug[c]; bd.edits--; bd.path = pathOf(bd);
    for (const k in R.board) for (const s in R.board[k]) { const uid = R.board[k][s]; if (!canPlace(R, uid, +k)) delete R.board[k][s]; }
    return true;
  }

  // ---- 시작 ----
  const ARCH = {
    spore: { traps: ['sporebag', 'vine', 'sporebag'], organ: 'sporesac', kin: ['licker', 'shell'], skills: ['burst', 'wave'], offer: ['sporemaw', 'bloom', 'plague'] },
    maw: { traps: ['teeth', 'maw', 'teeth'], organ: 'stomach', kin: ['biter', 'shell'], skills: ['gulp', 'wave'], offer: ['sporemaw', 'abyss', 'hunger'] },
    egg: { traps: ['eggsac', 'eggsac', 'teeth'], organ: 'wombs', kin: ['mother', 'shell'], skills: ['call', 'phantom'], offer: ['brood', 'hive', 'mother'] },
  };
  function newRun(seed, o) {
    o = o || {}; const r = rngOf(seed || 1), arch = o.arch || pick(r, Object.keys(ARCH)), A = ARCH[arch];
    const R = { seed: seed >>> 0, rs: r, arch, uid: 1, hp: 120, mhp: 120, pieces: [], board: {}, phase: 'offer', fights: 0, stats: {} };
    R.bd = makeBoard(r);
    const extra = pick(r, ['tide', 'eyewall', 'ribs', 'gut']);
    A.traps.concat([extra], A.kin, [A.organ], A.skills).forEach(id => give(R, id));
    const o1 = pick(r, A.offer), o2 = pick(r, PIDS.filter(id => P[id].rar === 2 && !A.offer.includes(id)));
    R.offer = [o1, o2, pick(r, ['tide', 'eyewall', 'ribs', 'gut', 'hood', 'tangle', 'pool', 'eyepost', 'marrow'].filter(id => id !== o2))];
    return R;
  }
  function give(R, id, tier) { const p = { uid: R.uid++, id, tier: tier || 1 }; R.pieces.push(p); return p; }
  function take(R, i) { const id = R.offer && R.offer[i]; R.offer = null; R.phase = 'setup'; return id ? give(R, id) : null; }
  const def = p => P[p.id];
  const slotOf = p => { const k = P[p.id].kind; return k === 'skill' ? null : k; };
  function canPlace(R, uid, cell) {
    const p = R.pieces.find(q => q.uid === uid); if (!p) return false; const s = slotOf(p); if (!s) return false;
    if (cell === R.bd.core) return false;
    if (s === 'organ') return !onPath(R, cell) && nbrs(cell).some(j => onPath(R, j));
    if (s === 'kin') return onPath(R, cell);
    return R.bd.dug[cell];
  }
  function unplace(R, uid) { for (const c in R.board) for (const s in R.board[c]) if (R.board[c][s] === uid) delete R.board[c][s]; }
  function place(R, uid, cell) { if (!canPlace(R, uid, cell)) return false; const p = R.pieces.find(q => q.uid === uid), s = slotOf(p); unplace(R, uid); R.board[cell] = R.board[cell] || {}; R.board[cell][s] = uid; return true; }
  const placedAt = (R, uid) => { for (const c in R.board) for (const s in R.board[c]) if (R.board[c][s] === uid) return +c; return null; };
  const bench = R => R.pieces.filter(p => slotOf(p) && placedAt(R, p.uid) === null);
  const skills = R => R.pieces.filter(p => def(p).kind === 'skill');
  function tagCount(R) {
    const n = {}; TAGS.forEach(t => { n[t] = 0; });
    for (const c in R.board) for (const s in R.board[c]) { const p = R.pieces.find(q => q.uid === R.board[c][s]); if (p) def(p).tags.forEach(t => { n[t]++; }); }
    return n;
  }
  const tagLv = (R, t, n) => { const k = (n || tagCount(R))[t] || 0; return TAG[t].steps.filter(s => k >= s).length; };
  function bodyOf(R, n) { n = n || tagCount(R); const top = TAGS.slice().sort((a, b) => n[b] - n[a])[0]; return n[top] >= 2 ? top : 'none'; }
  // 몸 (BODYGEN 에 넘길 형질): 판에 놓은 것을 닮는다
  function genome(R) {
    const n = tagCount(R), tags = {};
    TAGS.forEach(t => { if (n[t]) tags[t] = n[t] * 12; });
    const b = bodyOf(R, n), asp = { spore: 'brood', egg: 'brood', maw: 'hunger', water: 'abyss', eye: 'nebula', bone: 'dusk', none: R.arch === 'maw' ? 'hunger' : 'brood' }[b];
    const total = TAGS.reduce((a, t) => a + n[t], 0);
    return { norm: false, aspect: asp, sub: null, stage: Math.min(4, 1 + Math.floor(total / 3)), tags, seed: R.seed, lineage: [], feed: {}, seen: {} };
  }
  // 손쉬운 자동 배치 (봇과 '알아서 놓기' 용). rnd 면 아무 데나
  function autoPlace(R, rnd) {
    const path = R.bd.path.filter(c => c !== R.bd.core), r = R.rs;
    bench(R).forEach(p => {
      const s = slotOf(p), cells = []; for (let c = 0; c < N; c++) if (canPlace(R, p.uid, c) && !(R.board[c] && R.board[c][s])) cells.push(c);
      if (!cells.length) return;
      if (rnd) { place(R, p.uid, pick(r, cells)); return; }
      if (s === 'organ') { cells.sort((a, b) => nbrs(b).filter(j => R.board[j] && R.board[j].trap).length - nbrs(a).filter(j => R.board[j] && R.board[j].trap).length); place(R, p.uid, cells[0]); return; }
      const order = path.slice().reverse().filter(c => cells.includes(c)), near = cells.filter(c => nbrs(c).some(j => path.includes(j)));
      place(R, p.uid, order[0] != null ? order[0] : near[0] != null ? near[0] : cells[0]);
    });
  }

  // ---- 싸움 ----
  const WAVES = [{ at: 0.5, list: ['villager', 'hound', 'villager', 'villager', 'hound'] }, { at: 9, list: ['militia', 'villager', 'priest', 'militia', 'villager', 'hound'] }, { at: 18, list: ['captain', 'militia', 'hound', 'hound', 'villager'] }];
  function startFight(R) {
    const n = tagCount(R), path = R.bd.path, sc = +(env('TSC') || 1);
    const F = { t: 0, R, n, ev: [], units: [], allies: [], pieces: [], spawnQ: [], uidN: 1, over: null, chain: 0, chainT: -9, chainMax: 0, dmg: {}, swallows: 0, skillUse: 0, charges: [], waves: WAVES.length, waveAt: WAVES.map(w => w.at), body: bodyOf(R, n), bodyT: 0, coreT: 0, s: sc };
    for (const c in R.board) for (const s in R.board[c]) {
      const p = R.pieces.find(q => q.uid === R.board[c][s]); if (!p) continue; const d = def(p), cell = +c, k = p.tier === 2 ? 2.2 : 1;
      if (d.kind === 'organ') continue;
      const aura = { spawn: 0, spore: 0, swallow: 0, cd: 1, hp: 0, dmg: 0 };
      nbrs(cell).forEach(j => { const o = R.board[j] && R.board[j].organ; if (o == null) return; const op = R.pieces.find(q => q.uid === o); if (!op) return; const a = def(op).aura; for (const x in a) { if (x === 'cd') aura.cd *= a[x]; else aura[x] += a[x]; } });
      if (d.kind === 'trap') F.pieces.push({ uid: p.uid, id: p.id, d, cell, k, aura, cd: d.cd * aura.cd, t: d.cd * aura.cd * 0.4, off: 0, grow: 0, tier: p.tier });
      if (d.kind === 'kin') { const hp = d.hp * k * (1 + aura.hp + (tagLv(R, 'bone', n) >= 1 ? 0.8 : 0)); F.allies.push({ uid: 'k' + p.uid, src: p.uid, id: p.id, d, pi: path.indexOf(cell), hp, mhp: hp, atk: d.atk * k * (1 + aura.dmg), t: 0, se: 0, kin: true }); }
    }
    skills(R).slice(0, 3).forEach(p => F.charges.push({ uid: p.uid, id: p.id, tier: p.tier, used: false }));
    WAVES.forEach(w => w.list.forEach((id, i) => F.spawnQ.push({ at: w.at + i * 0.8, id })));
    F.spawnQ.sort((a, b) => a.at - b.at);
    R.fight = F; R.phase = 'fight';
    return F;
  }
  const alive = F => F.units.filter(u => u.hp > 0);
  const cellOf = (F, u) => F.R.bd.path[Math.min(F.R.bd.path.length - 1, Math.floor(u.pi))];
  const credit = (F, src, v) => { if (src == null) return; F.dmg[src] = (F.dmg[src] || 0) + v; };
  function chainHit(F) { if (F.t - F.chainT < 0.8) F.chain++; else F.chain = 1; F.chainT = F.t; if (F.chain > F.chainMax) F.chainMax = F.chain; if (F.chain >= 2) F.ev.push({ k: 'chain', n: F.chain }); }
  function hurt(F, u, v, src, kind) {
    if (u.hp <= 0) return 0; const R = F.R, n = F.n;
    if (kind !== 'spore' && tagLv(R, 'eye', n) >= 1 && R.rs() < 0.3) { v *= 2.5; F.ev.push({ k: 'crit', u: u.uid }); }
    if (F.chain >= 2 && F.t - F.chainT < 0.8) v *= 1 + 0.15 * Math.min(10, F.chain);
    v = Math.round(v); const real = Math.min(v, u.hp); u.hp -= v; credit(F, src, real); F.ev.push({ k: 'hit', u: u.uid, v, src, kind });
    if (u.hp <= 0) die(F, u, src);
    return real;
  }
  function die(F, u, src) {
    const R = F.R, n = F.n; u.hp = 0; F.ev.push({ k: 'die', u: u.uid, src, cell: cellOf(F, u) });
    chainHit(F);
    if (u.spore > 0 && (tagLv(R, 'spore', n) >= 2 || u.burstK)) {
      const s = u.spore, mult = u.burstK || 1, c0 = cellOf(F, u), cells = [c0].concat(nbrs(c0));
      F.ev.push({ k: 'burst', cell: c0, n: s });
      alive(F).forEach(o => { if (cells.includes(cellOf(F, o))) { o.spore = (o.spore || 0) + Math.ceil(s / 2) * mult; o.sporeSrc = u.sporeSrc; hurt(F, o, 2 * s * mult, u.sporeSrc, 'spore'); } });
    }
    if (u.plague) hatch(F, cellOf(F, u), 1, u.sporeSrc);
  }
  // 알: 곁의 길 칸(가능하면 비어 있는 칸)으로 깨어난다
  function hatch(F, cell, nS, src) {
    const R = F.R, path = R.bd.path, lv = tagLv(R, 'egg', F.n), k = lv >= 2 ? 1.6 : 1;
    let spots = [cell].concat(nbrs(cell)).filter(c => path.includes(c) && c !== R.bd.core);
    if (!spots.length) spots = [path[Math.max(0, path.length - 2)]];
    spots.sort((a, b) => F.allies.filter(x => x.hp > 0 && path[Math.floor(x.pi)] === a).length - F.allies.filter(x => x.hp > 0 && path[Math.floor(x.pi)] === b).length);
    for (let i = 0; i < nS; i++) { const c = spots[i % spots.length], a = { uid: 's' + (F.uidN++), id: 'spawn', d: { name: '움' }, pi: path.indexOf(c), hp: 16 * k, mhp: 16 * k, atk: 10 * k, t: 0, se: 0, spawn: true, src, life: 7 }; F.allies.push(a); F.ev.push({ k: 'spawn', a: a.uid, cell: c, src }); }
  }
  // 부위가 닿는 칸: 아가리는 제 칸과 길 다음 칸, 포자는 제 칸과 위아래옆, 눈은 길 앞쪽 몇 칸, 나머지는 제 칸
  function reach(F, p) {
    const path = F.R.bd.path, d = p.d, i = path.indexOf(p.cell);
    if (d.fx === 'maw' || d.fx === 'swallow') return i >= 0 ? [p.cell, path[i + 1]].filter(c => c != null) : [p.cell].concat(nbrs(p.cell).filter(c => path.includes(c)));
    if (d.fx === 'spore' || d.fx === 'egg') return [p.cell].concat(nbrs(p.cell));
    if (d.fx === 'eye') { if (i < 0) return [p.cell].concat(nbrs(p.cell)); const o = []; for (let j = i; j >= Math.max(0, i - d.reach); j--) o.push(path[j]); return o; }
    return [p.cell];
  }
  function step(F, dt) {
    if (F.over) return; dt = dt || DT; const R = F.R, n = F.n, path = R.bd.path, last = path.length - 1; F.t += dt;
    while (F.spawnQ.length && F.spawnQ[0].at <= F.t) { const q = F.spawnQ.shift(), e = E[q.id]; const u = { uid: 'e' + (F.uidN++), id: q.id, pi: 0, hp: e.hp * F.s, mhp: e.hp * F.s, atk: e.atk * F.s, spd: e.spd, spore: 0, stun: 0, slow: 0, t: 0 }; F.units.push(u); F.ev.push({ k: 'enter', u: u.uid }); }
    const L = alive(F), A = F.allies.filter(a => a.hp > 0);
    L.forEach(u => {
      if (u.stun > 0) { u.stun -= dt; return; }
      if (u.spore > 0) { u.sporeT = (u.sporeT || 0) + dt; if (u.sporeT >= 1) { u.sporeT = 0; hurt(F, u, u.spore * (tagLv(R, 'spore', n) >= 1 ? 1.5 : 1), u.sporeSrc, 'spore'); if (u.hp <= 0) return; } }
      const ci = Math.floor(u.pi), e = E[u.id], blocker = A.find(a => a.hp > 0 && Math.floor(a.pi) === ci);
      if (e.healer) { u.ht = (u.ht || 0) + dt; if (u.ht >= 2) { u.ht = 0; L.filter(o => o !== u && Math.abs(o.pi - u.pi) <= 1).forEach(o => { o.hp = Math.min(o.mhp, o.hp + e.healer); }); F.ev.push({ k: 'heal', u: u.uid }); } }
      if (e.breaker) { u.bt = (u.bt || 0) + dt; if (u.bt >= e.breaker) { u.bt = 0; const p = F.pieces.find(q => Math.abs(path.indexOf(q.cell) - u.pi) <= 2 && q.off <= 0); if (p) { p.off = 3; F.ev.push({ k: 'read', p: p.uid }); } } }
      if (blocker) { u.t += dt; if (u.t >= 1) { u.t = 0; const rally = L.some(o => E[o.id].rally && Math.abs(o.pi - u.pi) <= 1) ? 3 : 0, v = Math.round(u.atk + rally); blocker.hp -= v; F.ev.push({ k: 'ahit', a: blocker.uid, v }); if (blocker.hp <= 0) F.ev.push({ k: 'adie', a: blocker.uid }); } return; }
      if (ci >= last) { u.t += dt; if (u.t >= 1.5) { u.t = 0; const v = Math.round(u.atk * (F.body === 'bone' ? 0.6 : 1)); R.hp -= v; F.ev.push({ k: 'core', v, u: u.uid }); if (F.body === 'bone') hurt(F, u, 6, 'body', 'body'); if (R.hp <= 0) { R.hp = 0; F.over = { win: false }; } } return; }
      const sp = u.spd * (u.slow > 0 ? 0.45 : 1); if (u.slow > 0) u.slow -= dt;
      u.pi = Math.min(last, u.pi + sp * dt);
    });
    if (F.over) return;
    A.forEach(a => {
      if (a.hp <= 0) return; const ci = Math.floor(a.pi), foe = L.filter(u => u.hp > 0 && Math.floor(u.pi) === ci).sort((x, y) => x.hp - y.hp)[0];
      if (a.spawn) { a.life -= dt; if (a.life <= 0) { a.hp = 0; F.ev.push({ k: 'adie', a: a.uid, fade: true }); return; } }
      if (a.d.heal) { a.ht = (a.ht || 0) + dt; if (a.ht >= 1) { a.ht = 0; A.filter(b => b !== a && Math.abs(b.pi - a.pi) <= 1 && b.hp > 0).forEach(b => { b.hp = Math.min(b.mhp, b.hp + a.d.heal); }); } }
      if (a.d.spawnEvery) { a.se += dt; if (a.se >= a.d.spawnEvery) { a.se = 0; hatch(F, path[ci], 1, a.src); } }
            if (!foe) return; a.t += dt; if (a.t >= 1) { a.t = 0; const swarm = a.spawn && F.pieces.some(p => p.d.swarm) && A.filter(x => x.spawn).length > 4 ? 2 : 1; const v = hurt(F, foe, a.atk * swarm, a.src, a.spawn ? 'spawn' : 'kin'); if (a.d.sporeHit) { foe.spore += a.d.sporeHit; foe.sporeSrc = a.src; } if (a.d.slowHit) foe.slow = a.d.slowHit; if (a.d.lifesteal) a.hp = Math.min(a.mhp, a.hp + v * a.d.lifesteal); }
    });
    F.pieces.forEach(p => {
      if (p.off > 0) { p.off -= dt; return; }
      p.t = Math.min(p.cd, p.t + dt); if (p.t < p.cd) return;
      const cells = reach(F, p), here = L.filter(u => u.hp > 0 && cells.includes(cellOf(F, u)));
      if (!here.length) return;
      p.t = 0; fire(F, p, here, cells);
    });
    bodyAct(F, dt, L);
    if (!F.spawnQ.length && !alive(F).length) F.over = { win: true };
    if (F.t > 75) F.over = { win: R.hp > 0 };
  }
  function bodyAct(F, dt, L) {
    const R = F.R, path = R.bd.path, last = path.length - 1, b = BODY[F.body];
    F.coreT += dt; if (F.coreT >= 1) { F.coreT = 0; const f = L.filter(u => u.hp > 0 && Math.floor(u.pi) >= last)[0]; if (f) hurt(F, f, 10, 'body', 'body'); }
    if (!b.every) return; F.bodyT += dt; if (F.bodyT < b.every) return;
    const front = path[Math.max(0, last - 1)], coreNb = [R.bd.core].concat(nbrs(R.bd.core)), at = cs => L.filter(u => u.hp > 0 && cs.includes(cellOf(F, u)));
    let did = false;
    if (F.body === 'spore') { const t = at(coreNb.concat(nbrs(front))); t.forEach(u => { u.spore += 4; u.sporeSrc = 'body'; }); did = t.length > 0; }
    if (F.body === 'maw') { const t = at([front, R.bd.core]).sort((a, c) => a.hp - c.hp)[0]; if (t) { did = true; if (t.hp <= 40 * (tagLv(R, 'maw', F.n) >= 1 ? 1.8 : 1)) { credit(F, 'body', t.hp); F.swallows++; t.hp = 0; die(F, t, 'body'); } else hurt(F, t, 30, 'body', 'body'); } }
    if (F.body === 'egg') { if (L.length) { hatch(F, front, 2, 'body'); did = true; } }
    if (F.body === 'water') { const t = at(coreNb.concat([front])); t.forEach(u => { hurt(F, u, 15 * (tagLv(R, 'water', F.n) >= 1 ? 2 : 1), 'body', 'body'); u.slow = 1.2; }); did = t.length > 0; }
    if (F.body === 'eye') { const t = L.filter(u => u.hp > 0 && u.pi >= last - 3).sort((a, c) => a.pi - c.pi)[0]; if (t) { hurt(F, t, 30, 'body', 'body'); did = true; } }
    if (did) { F.bodyT = 0; F.ev.push({ k: 'body', b: F.body, cell: front }); } else F.bodyT = b.every;
  }
  function fire(F, p, here, cells) {
    const R = F.R, n = F.n, d = p.d, k = p.k * (1 + p.aura.dmg) * (1 + p.grow), ev = { k: 'fire', p: p.uid, fx: d.fx, cell: p.cell, cells, v: 0 };
    if (d.swallow) {
      const lim = d.swallow * k * (1 + p.aura.swallow + (tagLv(R, 'maw', n) >= 1 ? 0.8 : 0)), tgt = here.slice().sort((a, b) => a.hp - b.hp)[0];
      if (tgt && tgt.hp <= lim) { ev.v = Math.round(tgt.hp); ev.swallow = tgt.uid; credit(F, p.uid, tgt.hp); F.swallows++; if (d.burst) tgt.burstK = d.burst; tgt.hp = 0; die(F, tgt, p.uid); if (d.grow) p.grow += d.grow; if (tagLv(R, 'maw', n) >= 2) R.hp = Math.min(R.mhp, R.hp + 4); }
      else if (tgt) ev.v = hurt(F, tgt, d.dmg * k, p.uid, 'trap');
    } else if (d.spawn) {
      const nS = Math.round((d.spawn + p.aura.spawn + (tagLv(R, 'egg', n) >= 1 ? 1 : 0)) * (p.tier === 2 ? 1.5 : 1)); hatch(F, p.cell, nS, p.uid); ev.v = nS;
    } else {
      const tg = d.one || (d.fx === 'eye' && !d.all) ? [here.slice().sort((a, b) => b.pi - a.pi)[0]] : here;
      tg.forEach(u => {
        if (d.spore) { u.spore += Math.round((d.spore + p.aura.spore) * (p.tier === 2 ? 2 : 1)); u.sporeSrc = p.uid; if (d.spawnOnSpore) u.plague = true; }
        if (d.slow) u.slow = d.slow;
        if (d.stun) u.stun = d.stun * (p.tier === 2 ? 1.5 : 1);
        if (d.dmg) ev.v += hurt(F, u, d.dmg * k * ((d.fx === 'water' || d.fx === 'gut') && tagLv(R, 'water', n) >= 1 ? 2 : 1), p.uid, 'trap');
      });
      if (d.spore && !d.dmg) ev.v = tg.length;
    }
    F.ev.push(ev);
  }
  // 기술: 아무 때나 쓴다 (화면은 멈추고 칸을 고르게 한다)
  function useSkill(F, ci, cell) {
    const c = F.charges[ci]; if (!c || c.used || F.over) return false; const d = P[c.id], k = c.tier === 2 ? 1.8 : 1, R = F.R, path = R.bd.path, L = alive(F);
    c.used = true; F.skillUse++; F.ev.push({ k: 'skill', id: c.id, cell });
    if (c.id === 'wave') L.filter(u => cellOf(F, u) === cell).forEach(u => { hurt(F, u, d.dmg * k, c.uid, 'skill'); u.pi = Math.max(0, u.pi - d.push); });
    if (c.id === 'burst') L.filter(u => u.spore > 0).forEach(u => { const s = u.spore; u.spore = 0; hurt(F, u, s * d.perStack * k, c.uid, 'skill'); chainHit(F); });
    if (c.id === 'call') hatch(F, path.includes(cell) ? cell : path[Math.max(0, path.length - 2)], Math.round(d.spawn * k), c.uid);
    if (c.id === 'gulp') { const u = L.filter(x => cellOf(F, x) === cell).sort((a, b) => b.hp - a.hp)[0] || L.slice().sort((a, b) => b.pi - a.pi)[0]; if (u) hurt(F, u, d.dmg * k, c.uid, 'skill'); }
    if (c.id === 'phantom') L.forEach(u => { u.stun = d.stun * k; });
    return true;
  }
  const SKILLCELL = { wave: true, call: true, gulp: true };
  function endFight(R) {
    const F = R.fight; if (!F || !F.over) return null; R.fights++;
    const res = { win: F.over.win, dmg: F.dmg, chainMax: F.chainMax, swallows: F.swallows, t: F.t, hp: R.hp };
    R.phase = 'end'; R.last = res; R.fight = null; return res;
  }
  // 적의 의도: 다음 칸과 본체를 칠 세기
  function intent(F, u) { const e = E[u.id], path = F.R.bd.path, nx = path[Math.min(path.length - 1, Math.floor(u.pi) + 1)]; return { to: nx, atk: Math.round(u.atk), tag: e.elite ? 'elite' : e.healer ? 'heal' : e.breaker ? 'break' : e.spd > 1 ? 'fast' : null }; }
  return { COLS, ROWS, N, DT, TAG, TAGS, P, PIDS, KIND, BODY, E, ARCH, WAVES, SKILLCELL, rngOf, newRun, makeBoard, pathOf, nbrs, canToggle, toggle, give, take, canPlace, place, unplace, placedAt, bench, skills, autoPlace, tagCount, tagLv, bodyOf, genome, startFight, step, useSkill, endFight, intent, alive, cellOf, reach, def };
})();
if (typeof module !== 'undefined') module.exports = TREND;
