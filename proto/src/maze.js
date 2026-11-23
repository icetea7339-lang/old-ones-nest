// 굴 짓기(미로 둥지) 규칙. DOM 없음. scratchpad/maze_spec.md 참고. LAIR 의 표와 simulate 를 쓴다.
// 지도: 5열 x 8행, 칸 번호 = 행*5+열. 마흔 칸 모두 파는 자리다. 칸 2 (입구 바로 아래)와 칸 37 (맨 아래 가운데 = 출구)은 처음부터 판 통로이고 메울 수 없다.
// 본체 방과 알의 방은 격자 칸이 아니다 (CORE = 'core', EGG = 'egg'). 일행은 입구에서 출구까지 판 칸을 따라 걷고, 출구를 지나 본체 방 → 알의 방으로 간다.
// 함정을 밟으면 발동하고, 권속이 선 방에 닿으면 그 방에서만 짧게 싸운다.
const MAZE = (() => {
  'use strict';
  const L = typeof LAIR !== 'undefined' ? LAIR : require('./lair.js');
  const V = 2, COLS = 5, ROWS = 8, N = COLS * ROWS, ENT = 2, EXIT = 7 * COLS + 2, CORE = 'core', EGG = 'egg';
  const rc = i => [Math.floor(i / COLS), i % COLS], idx = (r, c) => r * COLS + c, inb = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // 수치
  const MK = {
    gold: 20, level: 3, maxLv: 6, xpNeed: { 3: 6, 4: 10, 5: 16 }, xpBuy: 4, xpCost: 4, xpRaid: 2, reroll: 2,
    income: 9, winGold: 3, egg: 15, digBase: 1, digRow: 0.25, fillBack: 0.5, dugCap: [15, 18, 21, 24], roomCost: 3, trapCost: 2, roomMax: 3, coreMax: 2,
    // 싸움을 작게: 전체 체력·정신 배수, 시간 (engage = 둥지 쪽이 기다리지 않고 나선다)
    hpMul: 1, sanMul: 2.0, clock: { engage: 0, frenzy: 10, sudden: 13, end: 16 }, raidMul: [1.3, 1.05, 2.4, 1.27], raidAtk: [1.0, 0.79, 1.8, 1.0], core: { hp: 0.5, atk: 1 },
    // 길: breakAt 보다 길면 무거운 자가 바위 하나를 부순다 (줄어드는 길이 breakMin 이상일 때). avoid = 함정을 돌아가는 데 쓰는 칸 수의 상한
    breakAt: 13, breakMin: 3, avoid: 2,
    // 헤매는 일행: 헤매며 걸은 칸이 lostBreak 를 넘으면 무거운 자가 곁의 바위를 부수고 알 쪽으로 간다 (breakMin 칸 이상 줄어들 때)
    lostBreak: 10,
    // 굴 속의 어둠: 일행이 한 칸 걸을 때마다 잃는 정신 (굴이 길수록 미치기 쉽다)
    darkSan: 3,
    // 어둠이 깊어진다: k 번째로 걷는 칸은 darkSan + darkGrow x (k-1) 을 깎는다 (긴 미로일수록 더 빨리 미친다)
    darkGrow: 0.75,
    // 헤매기: 갈림길에서 고르는 가중치 (아래 · 옆 · 위), 미끼 불빛이 끄는 거리, 이만큼 헤매면 아는 길로 출구에 간다
    wander: { down: 3, side: 2, up: 1 }, lureRange: 6, wanderMax: 30,
    // 정신을 깎는 함정을 한 침입에 여러 번 밟으면: 첫 번째 그대로, 두 번째 절반, 세 번째부터 4분의 1
    trapSanFade: [1, 0.5, 0.25],
  };
  // 침입 넷 (설계서 5장). scale = 침입자 배수
  const RAIDS = [
    { name: '마을 사람들', units: ['militia', 'militia', 'torch', 'hound'], scale: { hp: 1, atk: 1, san: 1 } },
    { name: '모험가 일행', units: ['knight', 'archer', 'priest', 'rogue'], scale: { hp: 1.2, atk: 1.2, san: 1 } },
    { name: '사냥꾼 무리', units: ['tracker', 'crossbow', 'hound', 'alchemist'], scale: { hp: 1.4, atk: 1.4, san: 1.1 } },
    { name: '책을 쫓는 자', units: ['seeker', 'paladin', 'inquis'], scale: { hp: 1.3, atk: 1.5, san: 1.1 } },
  ];
  // 길잡이(추적자): 살아 있으면 일행은 가장 짧은 길로 오고 함정을 피한다. 없거나 쓰러지면 일행은 굴을 모른 채 헤맨다. 도적은 함정을 알아보고 피하지만 길은 모른다
  const AVOIDERS = ['rogue', 'tracker'], SCOUTS = ['tracker'], BREAKERS = ['seeker', 'seekerm', 'paladin'];
  // 함정 넷
  const TRAP = {
    tr_teeth: { name: '이빨 구덩이', hp: 0.15, fx: 'teeth', short: '체력 −15%', more: '바닥이 입을 벌린다. 지나가는 자는 체력의 15%를 잃는다.' },
    tr_whisper: { name: '속삭이는 벽', sanFlat: 45, fx: 'whisper', short: '정신 −45', more: '벽이 이름을 부른다. 지나가는 자는 정신을 45 잃고, 정신이 바닥나면 미친다. 한 침입에 정신을 깎는 함정을 여러 번 밟으면 두 번째는 절반, 세 번째부터 4분의 1만 깎인다.' },
    tr_slime: { name: '점액 늪', slow: 0.5, dur: 5, fx: 'slime', short: '다음 싸움 5초 둔함', more: '발이 빠진다. 다음 싸움의 처음 5초 동안 50% 느리다.' },
    tr_spore: { name: '포자 구덩이', rot: 0.05, fx: 'spore', short: '감염 · 방마다 −5%', more: '포자를 마신다. 그 뒤로 싸움마다 체력의 5%를 잃고, 감염된 채 싸운다.' },
    // 미로 함정: 길을 흐트러뜨린다 (값 cost)
    tr_lure: { name: '미끼 불빛', lure: true, cost: 2, fx: 'lure', short: '헤매는 자를 끈다', more: '굴 속에 불빛이 깜빡인다. 길잡이가 없는 일행은 갈림길에서 6칸 안의 가장 가까운 불빛 쪽으로 간다. 닿으면 그 침입 동안 꺼진다.' },
    tr_maw: { name: '삼키는 구멍', maw: true, sanFlat: 10, cost: 3, fx: 'maw', short: '입구로 뱉음 · 정신 −10', more: '바닥이 일행을 삼켜 입구 바로 아래에 뱉는다. 정신을 10 잃고, 들른 길을 잊는다. 구멍마다 침입에 한 번. 길잡이는 피한다. 외길에는 놓을 수 없다.' },
    tr_mirror: { name: '헛갈림 벽', confuse: true, sanFlat: 15, cost: 2, fx: 'mirror', short: '정신 −15 · 길을 헛갈림', more: '벽이 길을 비춰 뒤집는다. 정신을 15 잃고, 다음 갈림길에서 출구에서 가장 먼 쪽으로 간다.' },
  };
  const TRAP_IDS = Object.keys(TRAP);
  const USES = ['path', 'kin', 'trap'];
  const fail = msg => ({ ok: false, msg }), ok = o => Object.assign({ ok: true }, o || {});
  const SHOP_KIN = L.KIN_IDS.filter(k => !L.KIN[k].gen);

  // ───────── 새 판 ─────────
  function newRun(seed) {
    const M = { v: V, seed: seed >>> 0, rs: { s: (seed | 0) ^ 0x3a7e }, raid: 1, raids: RAIDS.length, phase: 'prep', over: null, gold: MK.gold, level: MK.level, xp: 0, egg: MK.egg, eggMax: MK.egg,
      grid: [], unit: {}, board: {}, bench: [null, null, null, null, null, null], nextUid: 1, shop: [], merges: [], hist: [], last: null, reward: null, free: [] };
    for (let i = 0; i < N; i++) M.grid.push({ dug: false, use: null, room: null, trap: null });
    for (let r = 0; r < ROWS; r++) Object.assign(M.grid[idx(r, 2)], { dug: true, use: 'path' });
    rollShop(M); return M;
  }
  function rollShop(M) { const o = L.K.odds[M.level] || L.K.odds[L.K.maxLv]; M.shop = []; for (let i = 0; i < 5; i++) { const x = L.rnd(M.rs) * 100, c = x < o[0] ? 1 : x < o[0] + o[1] ? 2 : 3, pool = SHOP_KIN.filter(k => L.KIN[k].cost === c); M.shop.push(pool[Math.floor(L.rnd(M.rs) * pool.length)]); } }

  // ───────── 칸 ─────────
  const dugCount = M => M.grid.filter(g => g.dug).length;
  const dugCap = M => MK.dugCap[clamp(M.raid, 1, MK.dugCap.length) - 1];
  const digCost = cell => MK.digBase + Math.floor(rc(cell)[0] * MK.digRow);
  const fillGold = cell => Math.floor(digCost(cell) * MK.fillBack);
  const near = cell => { const p = rc(cell), out = []; [[1, 0], [0, -1], [0, 1], [-1, 0]].forEach(([dr, dc]) => { if (inb(p[0] + dr, p[1] + dc)) out.push(idx(p[0] + dr, p[1] + dc)); }); return out; };
  const fixedCell = cell => cell === ENT || cell === EXIT;
  const diggable = cell => Number.isInteger(cell) && cell >= 0 && cell < N;
  // 가장 짧은 길 (입구 → 출구). dugAt(c) 가 참인 칸만 지난다. 이웃을 보는 순서가 늘 같아 같은 지도면 같은 길이다
  function bfs(dugAt, from, to) {
    const prev = new Array(N).fill(-2), q = [from]; prev[from] = -1;
    for (let h = 0; h < q.length; h++) { const c = q[h]; if (c === to) break; for (const n of near(c)) { if (prev[n] !== -2 || !dugAt(n)) continue; prev[n] = c; q.push(n); } }
    if (prev[to] === -2) return null; const path = []; for (let c = to; c !== -1; c = prev[c]) path.push(c); return path.reverse();
  }
  const isDug = M => c => M.grid[c].dug;
  // 판 칸이 모두 입구에서 닿고, 출구에도 닿는가
  function connected(M, dugAt) { const seen = new Set([ENT]), q = [ENT]; for (let h = 0; h < q.length; h++) for (const n of near(q[h])) if (!seen.has(n) && dugAt(n)) { seen.add(n); q.push(n); } for (let i = 0; i < N; i++) if (dugAt(i) && !seen.has(i)) return false; return seen.has(EXIT); }
  function canDig(M, cell) {
    if (M.phase !== 'prep') return '지금은 팔 수 없다'; if (!diggable(cell)) return '팔 수 없는 칸이다'; if (M.grid[cell].dug) return '이미 판 칸이다';
    if (!near(cell).some(n => M.grid[n].dug)) return '판 칸에 붙어 있어야 한다'; if (dugCount(M) >= dugCap(M)) return '더 팔 수 없다 (' + dugCap(M) + ')'; if (M.gold < digCost(cell)) return '진액이 모자란다';
    return null;
  }
  // 외길 칸: 이 칸을 막으면 입구에서 출구로 못 간다 (삼키는 구멍은 외길에 놓을 수 없다)
  const sole = (M, cell, gone) => !bfs(x => M.grid[x].dug && x !== cell && x !== gone, ENT, EXIT);
  function canFill(M, cell) {
    if (M.phase !== 'prep') return '지금은 메울 수 없다'; const g = M.grid[cell]; if (!g || !g.dug) return '판 칸이 아니다'; if (fixedCell(cell)) return '메울 수 없는 칸이다'; if ((M.board[cell] || []).length) return '권속을 먼저 옮긴다';
    if (!connected(M, c => c !== cell && M.grid[c].dug)) return '길이 끊긴다'; if (M.grid.some((g, i) => i !== cell && g.use === 'trap' && g.trap === 'tr_maw' && sole(M, i, cell))) return '삼키는 구멍이 외길이 된다'; return null;
  }
  function dig(M, cell) { const e = canDig(M, cell); if (e) return fail(e); const cost = digCost(cell); M.gold -= cost; Object.assign(M.grid[cell], { dug: true, use: 'path', room: null, trap: null }); return ok({ cell, cost }); }
  function fill(M, cell) { const e = canFill(M, cell); if (e) return fail(e); const back = fillGold(cell); M.gold += back; Object.assign(M.grid[cell], { dug: false, use: null, room: null, trap: null }); delete M.board[cell]; return ok({ cell, gold: back }); }
  const trapCost = id => (TRAP[id] && TRAP[id].cost) || MK.trapCost;
  // 막은 침입의 보상으로 받은 무료 방·함정 (id 목록)
  const freeTake = (M, id) => (M.free || []).includes(id), freeUse = (M, id) => { M.free.splice(M.free.indexOf(id), 1); };
  // 쓰임: path 통로 / kin 권속 방 (id = 방 종류, 없으면 그대로) / trap 함정 (id = 함정 종류)
  function setUse(M, cell, use, id) {
    if (M.phase !== 'prep') return fail('지금은 바꿀 수 없다'); const g = M.grid[cell]; if (!g || !g.dug) return fail('판 칸이 아니다'); if (fixedCell(cell)) return fail('바꿀 수 없는 칸이다');
    if (!USES.includes(use)) return fail('없는 쓰임이다'); const here = M.board[cell] || [];
    if (use === 'kin') {
      if (id != null && !L.ROOM[id]) return fail('없는 방이다'); const free = id != null && id !== g.room && freeTake(M, id), cost = id != null && id !== g.room && !free ? MK.roomCost : 0; if (M.gold < cost) return fail('진액이 모자란다');
      if (free) freeUse(M, id); M.gold -= cost; g.use = 'kin'; g.trap = null; if (id != null) g.room = id; return ok({ cell, use, id: g.room, cost });
    }
    if (here.length) { if (M.bench.filter(x => x == null).length < here.length) return fail('대기석이 모자란다'); here.forEach(uid => { M.bench[M.bench.indexOf(null)] = uid; }); delete M.board[cell]; }
    if (use === 'trap') { if (!TRAP[id]) return fail('없는 함정이다'); if (TRAP[id].maw && sole(M, cell)) return fail('외길에는 놓을 수 없다'); const free = id !== g.trap && freeTake(M, id), cost = id !== g.trap && !free ? trapCost(id) : 0; if (M.gold < cost) return fail('진액이 모자란다'); if (free) freeUse(M, id); M.gold -= cost; Object.assign(g, { use: 'trap', trap: id, room: null }); return ok({ cell, use, id, cost }); }
    Object.assign(g, { use: 'path', trap: null, room: null }); return ok({ cell, use });
  }

  // ───────── 길 ─────────
  const trapOf = (M, c) => (M.grid[c] && M.grid[c].use === 'trap' ? M.grid[c].trap : null);
  // 길잡이의 길: 가장 짧은 길 + 무거운 자의 지름길 + 함정 피하기 (길잡이가 있을 때만). 삼키는 구멍은 돌아갈 길이 있으면 늘 피한다
  function scoutPath(M, kinds) {
    let path = bfs(isDug(M), ENT, EXIT), breaks = [], avoided = false; if (!path) return null;
    if (kinds.some(k => BREAKERS.includes(k)) && path.length > MK.breakAt) {
      let best = -1, bp = null;
      for (let c = 0; c < N; c++) { if (M.grid[c].dug) continue; const p = bfs(x => x === c || M.grid[x].dug, ENT, EXIT); if (p && path.length - p.length >= MK.breakMin && (!bp || p.length < bp.length)) { best = c; bp = p; } }
      if (bp) { path = bp; breaks = [best]; }
    }
    const open = x => M.grid[x].dug || breaks.includes(x);
    if (kinds.some(k => AVOIDERS.includes(k))) {
      if (path.some(c => trapOf(M, c) === 'tr_maw')) { const p = bfs(x => open(x) && trapOf(M, x) !== 'tr_maw', ENT, EXIT); if (p) { path = p; avoided = true; } }
      if (path.some(c => trapOf(M, c))) { const p = bfs(x => open(x) && !trapOf(M, x), ENT, EXIT); if (p && p.length <= path.length + MK.avoid) { path = p; avoided = true; } }
    }
    return { cells: path, breaks: breaks.filter(c => path.includes(c)), avoided };
  }
  // 갈림길의 고르기: 판 씨앗 + 침입 번호 + 칸 + 그 칸에서 고른 횟수로 정해진다 (같은 굴·같은 침입이면 늘 같은 길)
  const pick01 = (seed, raidN, cell, k) => { let h = (seed ^ Math.imul(raidN + 1, 0x9E3779B1)) | 0; h = Math.imul(h ^ Math.imul(cell + 7, 0x85EBCA6B), 0xC2B2AE35); h ^= h >>> 15; h = Math.imul(h ^ Math.imul(k + 3, 0x27D4EB2F), 0x165667B1); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  // 걷는 이: 한 칸씩 다음 칸을 낸다. 미리보기(pathOf)와 실제 침입(raid)이 같은 걷는 이를 쓴다
  //   scout: 길잡이(추적자)의 길을 따라간다.
  //   lost: 헤맨다 — 안 가 본 이웃 가운데 하나를 고른다 (아래 MK.wander.down · 옆 side · 위 up 의 가중치). 함정을 알아보는 자(도적)가 있으면 함정 칸은 다른 칸이 없을 때만 고른다.
  //         갈림길(고를 칸이 둘 이상)에서: 헛갈렸으면 출구에서 가장 먼 쪽 (굴 길 거리), 아니면 MK.lureRange 칸 안의 가장 가까운 미끼 불빛 쪽, 아니면 가중치.
  //         막다르면 왔던 칸으로 되돌아간다. MK.wanderMax 칸을 헤매거나 다 가 봤으면 아는 길(가장 짧은 길)로 출구에 간다.
  //   direct: 아는 길로 출구에 (오래 헤맨 뒤, 무거운 자가 벽을 부순 뒤).
  //   삼키는 구멍을 밟으면 다음 걸음이 입구 바로 아래 칸으로 순간 이동이다 (warp). 들른 칸 기억을 지운다.
  const WANDER = [COLS, -1, 1, -COLS];
  function walker(M, kinds, raidN) {
    raidN = raidN || M.raid;
    const sp = scoutPath(M, kinds), heavy = kinds.some(k => BREAKERS.includes(k)), avoid = kinds.some(k => AVOIDERS.includes(k)), dug = c => M.grid[c].dug || W.broken.includes(c);
    const W = { mode: kinds.some(k => SCOUTS.includes(k)) ? 'scout' : 'lost', cur: -1, visited: new Set(), stack: [], plan: sp ? sp.cells.slice() : [], broken: [], lostWalk: 0, lostFrom: null, sp,
      used: {}, lureOff: {}, confused: false, warpFrom: null, lured: [], confusedAt: [], warps: [], skipped: 0, tries: {} };
    W.lose = () => { if (W.mode !== 'scout' || W.cur < 0) return; W.mode = 'lost'; W.lostFrom = W.cur; };
    const known = from => { const ok2 = x => dug(x) && !(avoid && trapOf(M, x) && !W.used[x]); return bfs(ok2, from, EXIT) || bfs(dug, from, EXIT) || [from]; };
    // 칸에 닿음: 함정이 처음이면 그 함정의 길 효과
    const arrive = s => {
      const t = trapOf(M, s.cell); if (t && !W.used[s.cell]) { W.used[s.cell] = 1; if (TRAP[t].lure) W.lureOff[s.cell] = 1; if (TRAP[t].confuse) W.confused = true; if (TRAP[t].maw) W.warpFrom = s.cell; }
      return s;
    };
    const go = (c, extra) => { W.stack.push(W.cur); W.cur = c; W.visited.add(c); return arrive(Object.assign({ cell: c, back: false }, extra || {})); };
    const toDirect = () => { W.mode = 'direct'; W.plan = known(W.cur).slice(1); };
    // 가장 가까운 켜진 미끼 (굴 길 거리 lureRange 안). 그 쪽으로 가는 첫 칸
    const lureStep = () => {
      const prev = new Map([[W.cur, -1]]), q = [W.cur], dist = new Map([[W.cur, 0]]);
      for (let h = 0; h < q.length; h++) {
        const c = q[h]; if (c !== W.cur && trapOf(M, c) === 'tr_lure' && !W.lureOff[c]) { let x = c; while (prev.get(x) !== W.cur) x = prev.get(x); return x; }
        if (dist.get(c) >= MK.lureRange) continue; for (const n of near(c)) { if (prev.has(n) || !dug(n)) continue; prev.set(n, c); dist.set(n, dist.get(c) + 1); q.push(n); }
      }
      return null;
    };
    W.next = () => {
      if (W.warpFrom != null) {
        const from = W.warpFrom; W.warpFrom = null; W.cur = ENT; W.visited = new Set([ENT]); W.stack = []; W.warps.push({ from, to: ENT });
        if (W.mode === 'scout') W.plan = sp.cells.slice(1); else if (W.mode === 'direct') W.plan = known(ENT).slice(1);
        return { cell: ENT, back: false, warp: true, from };
      }
      if (W.cur === EXIT) return null;
      if (W.cur < 0) { W.cur = ENT; W.visited.add(ENT); if (W.mode === 'scout') W.plan.shift(); return arrive({ cell: ENT, back: false }); }
      if (W.mode === 'scout' || W.mode === 'direct') {
        const c = W.plan.shift(); if (c == null) return null; const broke = sp.breaks.includes(c) && W.mode === 'scout' && !W.broken.includes(c); if (broke) W.broken.push(c);
        return go(c, broke ? { broke: true } : null);
      }
      // 헤맨다
      if (heavy && !W.broken.length && W.lostWalk >= MK.lostBreak) {
        const d0 = bfs(dug, W.cur, EXIT); let best = -1, bp = null;
        for (const r of near(W.cur)) { if (dug(r)) continue; const p = bfs(x => x === r || dug(x), W.cur, EXIT); if (p && p.includes(r) && d0 && d0.length - p.length >= MK.breakMin && (!bp || p.length < bp.length)) { best = r; bp = p; } }
        if (bp) { W.broken.push(best); W.mode = 'direct'; W.plan = bp.slice(1); return go(W.plan.shift(), { broke: true }); }
      }
      if (W.lostWalk >= MK.wanderMax) { toDirect(); return W.next(); }
      W.lostWalk++;
      let opts = near(W.cur).filter(n => dug(n) && !W.visited.has(n));
      if (avoid) { const safe = opts.filter(n => !trapOf(M, n) || W.used[n]); if (safe.length) { W.skipped += opts.length - safe.length; opts = safe; } }
      if (opts.length) {
        let pick = opts[0];
        if (opts.length >= 2) {
          const lp = W.confused ? null : lureStep();
          if (W.confused) { const far = n => { const p = bfs(x => dug(x) && x !== W.cur, n, EXIT); return p ? p.length : 99; }; pick = opts.slice().sort((a, b) => far(b) - far(a) || WANDER.indexOf(a - W.cur) - WANDER.indexOf(b - W.cur))[0]; W.confused = false; W.confusedAt.push(W.cur); }
          else if (lp != null && opts.includes(lp)) { pick = lp; W.lured.push(W.cur); }
          else {
            const wt = n => (n - W.cur === COLS ? MK.wander.down : n - W.cur === -COLS ? MK.wander.up : MK.wander.side), tot = opts.reduce((a, n) => a + wt(n), 0);
            let x = pick01(M.seed, raidN, W.cur, W.tries[W.cur] = (W.tries[W.cur] || 0) + 1) * tot; for (const n of opts) { x -= wt(n); if (x < 0) { pick = n; break; } }
          }
        }
        return go(pick);
      }
      const prev = W.stack.pop(); if (prev == null || prev < 0) { toDirect(); return W.next(); }
      W.cur = prev; return { cell: prev, back: true };
    };
    return W;
  }
  // party: 침입 번호 (1~4) 또는 침입자 종류 배열. 일행이 다 살아 있다고 보고 걸을 길 전체.
  //   { cells (입구~출구, 되돌아가는 칸·순간 이동한 칸도 나온다), back [칸마다 되돌아감인가], warp [칸마다 순간 이동으로 닿았나], warps [{ from, to }], lured [미끼에 끌린 갈림길], confused [헛갈려 틀린 갈림길],
  //     breaks [칸], avoided, len, scout (길잡이가 있나), scoutPath, lostAt [길잡이가 쓰러질 수 있는 칸: 길잡이의 길 위의 싸움 칸] }
  function pathOf(M, party) {
    const raidN = Array.isArray(party) ? M.raid : clamp(party || M.raid, 1, RAIDS.length), kinds = Array.isArray(party) ? party : RAIDS[raidN - 1].units, W = walker(M, kinds, raidN), cells = [], back = [], warp = [], breaks = [];
    if (!W.sp) return null;
    for (let g = 0; g < 6 * N; g++) { const s = W.next(); if (!s) break; cells.push(s.cell); back.push(s.back); warp.push(!!s.warp); if (s.broke) breaks.push(s.cell); }
    const scout = kinds.some(k => SCOUTS.includes(k));
    return { cells, back, warp, warps: W.warps, lured: W.lured, confused: W.confusedAt, breaks, avoided: scout ? W.sp.avoided : W.skipped > 0 && !cells.some(c => trapOf(M, c)), len: cells.length, scout, scoutPath: W.sp.cells, lostAt: scout ? W.sp.cells.filter(c => M.grid[c].use === 'kin') : [] };
  }

  // ───────── 권속 ─────────
  const owned = M => Object.keys(M.unit).map(id => M.unit[id]);
  const boardUids = M => Object.keys(M.board).reduce((a, c) => a.concat(M.board[c]), []);
  const cap = M => M.level;
  const whereOf = (M, uid) => { const b = M.bench.indexOf(uid); if (b >= 0) return { bench: b }; for (const c in M.board) if (M.board[c].includes(uid)) return c === CORE ? { cell: CORE, core: true } : { cell: +c }; return null; };
  function removeUnit(M, uid) { const w = whereOf(M, uid); if (w && w.bench != null) M.bench[w.bench] = null; else if (w) { M.board[w.cell] = M.board[w.cell].filter(x => x !== uid); if (!M.board[w.cell].length) delete M.board[w.cell]; } delete M.unit[uid]; }
  // 같은 권속 같은 별 셋이면 하나로 합쳐 별이 오른다 (둥지 전투의 규칙): 판 위의 것이 남는다
  function merge(M) {
    const out = [];
    for (let guard = 0; guard < 20; guard++) {
      const groups = {}; owned(M).forEach(u => { if (u.star >= 3) return; (groups[u.kind + ':' + u.star] = groups[u.kind + ':' + u.star] || []).push(u.uid); }); let done = true;
      for (const k in groups) { const g = groups[k]; if (g.length < 3) continue; g.sort((a, b) => (whereOf(M, a).cell != null ? 0 : 1) - (whereOf(M, b).cell != null ? 0 : 1) || a - b); removeUnit(M, g[1]); removeUnit(M, g[2]); M.unit[g[0]].star++; out.push({ uid: g[0], kind: M.unit[g[0]].kind, star: M.unit[g[0]].star, ate: [g[1], g[2]] }); done = false; break; }
      if (done) break;
    }
    if (out.length) M.merges = M.merges.concat(out); return out;
  }
  function buy(M, i) {
    if (M.phase !== 'prep') return fail('지금은 살 수 없다'); const kind = M.shop[i]; if (!kind) return fail('빈 자리다'); const cost = L.KIN[kind].cost; if (M.gold < cost) return fail('진액이 모자란다');
    const slot = M.bench.indexOf(null), same = owned(M).filter(u => u.kind === kind && u.star === 1).length; if (slot < 0 && same < 2) return fail('대기석이 찼다');
    M.gold -= cost; M.shop[i] = null; const uid = M.nextUid++; M.unit[uid] = { uid, kind, star: 1 }; if (slot >= 0) M.bench[slot] = uid; else M.bench.push(uid);
    const merged = merge(M); M.bench = M.bench.slice(0, 6); while (M.bench.length < 6) M.bench.push(null); return ok({ uid, merged });
  }
  const sellValue = u => L.KIN[u.kind].cost * Math.pow(3, u.star - 1);
  function sell(M, uid) { if (M.phase !== 'prep') return fail('지금은 팔 수 없다'); const u = M.unit[uid]; if (!u) return fail('없는 권속이다'); const v = sellValue(u); removeUnit(M, uid); M.gold += v; return ok({ gold: v }); }
  function reroll(M) { if (M.phase !== 'prep') return fail('지금은 안 된다'); if (M.gold < MK.reroll) return fail('진액이 모자란다'); M.gold -= MK.reroll; rollShop(M); return ok(); }
  function levelUp(M) { let up = 0; while (M.level < MK.maxLv && M.xp >= MK.xpNeed[M.level]) { M.xp -= MK.xpNeed[M.level]; M.level++; up++; } if (M.level >= MK.maxLv) M.xp = 0; return up; }
  function buyXp(M) { if (M.phase !== 'prep') return fail('지금은 안 된다'); if (M.level >= MK.maxLv) return fail('더 넓힐 수 없다'); if (M.gold < MK.xpCost) return fail('진액이 모자란다'); M.gold -= MK.xpCost; M.xp += MK.xpBuy; return ok({ up: levelUp(M) }); }
  const roomCap = cell => (cell === CORE ? MK.coreMax : MK.roomMax);
  // 옮기기: to = { core: true } (본체 방) / { cell } (판 통로 칸이면 값 없이 권속 방이 된다, 권속 방이면 그대로) / { bench } (빈 자리, 없으면 아무 빈 자리)
  function placeWhy(M, cell) {
    if (cell === CORE) return null; const g = M.grid[cell]; if (!g) return '없는 칸이다'; if (!g.dug) return '바위다. 먼저 판다'; if (g.use === 'trap') return '함정 칸이다'; if (fixedCell(cell)) return '입구와 출구에는 세울 수 없다'; return null;
  }
  function move(M, uid, to) {
    if (M.phase !== 'prep') return fail('지금은 옮길 수 없다'); if (!M.unit[uid]) return fail('없는 권속이다'); const from = whereOf(M, uid);
    if (to && (to.core || to.cell != null)) {
      const cell = to.core ? CORE : to.cell, e = placeWhy(M, cell); if (e) return fail(e); if (from.cell === cell) return ok({ cell });
      const here = M.board[cell] || []; if (here.length >= roomCap(cell)) return fail('방이 찼다'); if (from.cell == null && boardUids(M).length >= cap(M)) return fail('더 세울 수 없다 (' + cap(M) + ')');
      if (cell !== CORE && M.grid[cell].use !== 'kin') Object.assign(M.grid[cell], { use: 'kin', trap: null });
      if (from.cell != null) { M.board[from.cell] = M.board[from.cell].filter(x => x !== uid); if (!M.board[from.cell].length) delete M.board[from.cell]; } else M.bench[from.bench] = null;
      M.board[cell] = here.concat([uid]); return ok({ cell });
    }
    if (!to) return fail('없는 자리다'); let b = to.bench == null ? M.bench.indexOf(null) : to.bench; if (b < 0 || b > 5) return fail('대기석이 찼다');
    const other = M.bench[b]; if (from.bench === b) return ok(); if (other != null && from.cell != null) return fail('그 자리가 찼다');
    if (from.cell != null) { M.board[from.cell] = M.board[from.cell].filter(x => x !== uid); if (!M.board[from.cell].length) delete M.board[from.cell]; } else M.bench[from.bench] = other;
    M.bench[b] = uid; return ok({ bench: b });
  }

  // ───────── 침입 ─────────
  const ASPS = L.ASPS;
  // 방 안의 시너지: 같은 성향의 서로 다른 권속이 둘이면 1단계, 셋이면 2단계
  function roomSyn(kinds) { const out = {}, set = [...new Set(kinds)]; ASPS.forEach(a => { const n = set.filter(k => L.KIN[k].asp === a).length; if (n >= 3) out[a] = 2; else if (n >= 2) out[a] = 1; }); return out; }
  const FRONT_COLS = [2, 3, 1, 4, 0, 5], KIN_COLS = [2, 3, 1];
  // 침입자 배수 = 침입의 scale x MK.raidMul (체력, 그리고 raidAtk 가 없으면 공격도)
  const scaleOf = raid => { const i = clamp(raid, 1, RAIDS.length) - 1, sc = RAIDS[i].scale, m = MK.raidMul[i] || 1, ma = MK.raidAtk ? MK.raidAtk[i] || 1 : m; return { hp: sc.hp * m, atk: sc.atk * ma, san: sc.san }; };
  const front = role => role === 'tank' || role === 'melee' || role === 'dive';
  // 일행의 한 사람: 체력·정신은 침입 동안 이어진다
  function partyOf(M, raid) {
    const R = RAIDS[clamp(raid || M.raid, 1, RAIDS.length) - 1], sc = scaleOf(raid || M.raid);
    return R.units.map((kind, i) => { const d = L.INV[kind], mhp = Math.round(d.hp * sc.hp * MK.hpMul), msan = d.san ? Math.round(d.san * sc.san * MK.sanMul) : 0; return { i, kind, name: d.name, mhp, msan, hp: mhp, san: msan, alive: true, mad: false, slow: false, rot: false, out: false }; });
  }
  const seedOf = (M, k) => (M.seed ^ Math.imul(M.raid * 97 + k * 13 + 1, 0x9E3779B1)) | 0;
  // 한 방의 싸움: 일행은 위쪽 두 줄, 권속은 아래쪽 두 줄 (본체 방이면 본체가 맨 아래). 길잡이는 뒷줄에 서고 뛰어들지 않는다. 사냥꾼 권속은 적의 뒷줄로 뛰어든다
  function fightAt(M, cell, party, kin, k) {
    const isCore = cell === CORE, g = isCore ? { room: null } : M.grid[cell], inv = [], used = {};
    const place = (row, cols, taken) => { for (const c of cols) { const x = L.idx(row, c); if (!taken[x]) { taken[x] = 1; return x; } } for (let c = 0; c < 6; c++) { const x = L.idx(row, c); if (!taken[x]) { taken[x] = 1; return x; } } return -1; };
    const live = party.filter(p => p.alive && !p.out);
    live.forEach(p => { const d = L.INV[p.kind], st = []; if (p.slow) st.push({ n: 'slow', dur: TRAP.tr_slime.dur, v: TRAP.tr_slime.slow }); if (p.rot) st.push({ n: 'infected', dur: 8, v: 12 }); inv.push({ kind: p.kind, cell: place(front(d.role) && !SCOUTS.includes(p.kind) ? 1 : 0, FRONT_COLS, used), hp: p.hp, san: p.san, mad: p.mad, st, src: p.i, noLeap: SCOUTS.includes(p.kind) }); });
    const nest = kin.map(u => ({ uid: u.uid, kind: u.kind, star: u.star, hp: u.hp, leap: L.KIN[u.kind].cls === 'hunter', cell: place(front(L.KIN[u.kind].role) ? 3 : 4, KIN_COLS, used) }));
    const rooms = g.room ? [{ id: g.room, cells: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29] }] : [];
    const S = { seed: seedOf(M, k), nest, inv, rooms, level: M.level, round: 1, form: isCore ? L.formOf(boardUids(M).map(id => M.unit[id].kind)) : 'drop', syn: roomSyn(kin.map(u => u.kind)), scale: scaleOf(M.raid), hpMul: MK.hpMul, sanMul: MK.sanMul, clock: MK.clock, keep: true };
    if (isCore) S.core = { lv: 1, hp: MK.core.hp, atk: MK.core.atk, manaCut: 0, range: 0, t2: false }; else S.noCore = true;
    return { f: L.simulate(S), inv };
  }
  const snapInv = party => party.map(p => ({ i: p.i, kind: p.kind, hp: p.hp, mhp: p.mhp, san: p.san, msan: p.msan, alive: p.alive, mad: p.mad, out: p.out }));
  const snapKin = kin => kin.map(u => ({ uid: u.uid, kind: u.kind, star: u.star, hp: u.hp, mhp: u.mhp, alive: u.alive }));
  const eggDmg = kind => { const d = L.INV[kind]; return (d.tier || 1) + (d.boss ? 2 : 0); };
  function raid(M) {
    if (M.phase !== 'prep') return fail(M.phase === 'over' ? '이미 끝난 판이다' : '지금은 안 된다');
    M.reward = null;
    const P = pathOf(M), party = partyOf(M), steps = [], kinHp = {}, W = walker(M, party.map(p => p.kind)), trapped = {}, walked = []; let gold = 0, k = 0, walk = [], wback = [], lostNow = false;
    // 권속의 체력은 이 침입 동안 이어진다 (null = 아직 다치지 않음)
    const kinOf = cell => (M.board[cell] || []).map(uid => { const u = M.unit[uid], st = kinHp[uid]; return { uid, kind: u.kind, star: u.star, hp: st ? st.hp : null, mhp: st ? st.mhp : null, alive: !st || st.alive }; });
    let drained = 0, turned = [], dark = 0, sanHits = 0;
    const flush = () => { if (walk.length) steps.push({ type: 'walk', cells: walk, back: wback, lost: lostNow, san: drained, mad: turned }); walk = []; wback = []; drained = 0; turned = []; lostNow = false; };
    const sane = () => party.filter(p => p.alive && !p.mad && !p.out);
    const scouts = () => party.some(p => p.alive && !p.mad && !p.out && SCOUTS.includes(p.kind));
    function fight(cell, back) {
      flush(); party.forEach(p => { if (p.alive && !p.out && p.rot) p.hp = Math.max(1, Math.round(p.hp - p.mhp * TRAP.tr_spore.rot)); });
      const kin = kinOf(cell).filter(u => u.alive), before = { inv: snapInv(party), kin: snapKin(kin) }, fr = fightAt(M, cell, party, kin, k++), f = fr.f;
      f.final.forEach(x => {
        if (x.home === 'inv' && x.src != null) { const p = party[fr.inv[x.src].src]; if (!p) return; p.hp = x.hp; p.mhp = x.mhp; p.san = x.san; p.msan = x.msan; p.alive = x.alive; p.mad = x.alive && x.mad; p.slow = false; }
        if (x.home === 'nest' && x.uid != null) kinHp[x.uid] = { hp: x.hp, mhp: x.mhp, alive: x.alive };
      });
      gold += f.gold || 0; const kinAfter = kinOf(cell).filter(u => kin.some(v => v.uid === u.uid));
      steps.push({ type: 'fight', cell, room: cell === CORE ? null : M.grid[cell].room || null, core: cell === CORE, back, scoutDown: W.mode === 'scout' && !scouts(), fight: f, before, after: { inv: snapInv(party), kin: snapKin(kinAfter) } });
    }
    for (let guard = 0; guard < 4 * N; guard++) {
      if (!sane().length) break;
      if (W.mode === 'scout' && !scouts()) { W.lose(); lostNow = true; }
      const st = W.next(); if (!st) break; const cell = st.cell, back = st.back; walked.push(cell);
      if (st.warp) { flush(); steps.push({ type: 'warp', from: st.from, to: cell }); }
      walk.push(cell); wback.push(back); const g = M.grid[cell];
      if (MK.darkSan || MK.darkGrow) { const ds = MK.darkSan + (MK.darkGrow || 0) * dark++; drained += ds; sane().forEach(p => { if (!p.msan) return; p.san = Math.max(0, p.san - ds); if (p.san <= 0 && !L.INV[p.kind].noMad) { p.mad = true; turned.push(p.i); } }); }
      if (st.broke) { flush(); Object.assign(g, { dug: true, use: 'path', room: null, trap: null }); steps.push({ type: 'break', cell }); }
      if (g.use === 'trap' && TRAP[g.trap] && !trapped[cell]) {
        flush(); trapped[cell] = 1; const T = TRAP[g.trap], before = snapInv(party), sf = (T.san || T.sanFlat) ? MK.trapSanFade[Math.min(sanHits++, MK.trapSanFade.length - 1)] : 1;
        sane().forEach(p => { if (T.hp) p.hp = Math.max(1, Math.round(p.hp - p.mhp * T.hp)); if ((T.san || T.sanFlat) && p.msan) { p.san = Math.max(0, Math.round(p.san - sf * (T.sanFlat || p.msan * T.san))); if (p.san <= 0 && !L.INV[p.kind].noMad) p.mad = true; } if (T.slow) p.slow = true; if (T.rot) p.rot = true; });
        steps.push({ type: 'trap', cell, id: g.trap, fx: T.fx, before, after: snapInv(party) });
      }
      if (g.use === 'kin' && kinOf(cell).some(u => u.alive)) fight(cell, back);
    }
    flush();
    // 출구를 지나면 본체 방 (권속이 없어도 본체가 싸운다), 그리고 알의 방
    if (W.cur === EXIT && sane().length) {
      fight(CORE, false);
      if (sane().length) { const at = sane(); let dmg = 0; at.forEach(p => { dmg += eggDmg(p.kind); p.out = true; }); M.egg = Math.max(0, M.egg - dmg); steps.push({ type: 'egg', cell: EGG, dmg, who: at.map(p => p.kind), egg: M.egg }); }
    }
    const reached = party.filter(p => p.out), eggLost = reached.reduce((a, p) => a + eggDmg(p.kind), 0), win = !reached.length, mads = party.filter(p => p.mad).length;
    const income = MK.income + (win ? MK.winGold : 0) + gold, result = { win, eggLost, gold: income, survivors: reached.length, mads, breaks: W.broken.length, avoided: P.avoided && W.mode === 'scout', walked: walked.length, lost: W.mode !== 'scout' && P.scout, warps: W.warps, lured: W.lured, confused: W.confusedAt };
    M.hist.push({ raid: M.raid, win, eggLost, path: walked.length, fights: steps.filter(s => s.type === 'fight').length, traps: steps.filter(s => s.type === 'trap').length, mads });
    M.last = { raid: M.raid, result, path: walked };
    let next = 'prep';
    if (M.egg <= 0) { M.phase = 'over'; M.over = { win: false, raid: M.raid, why: '알이 깨졌다' }; next = 'over'; }
    else if (M.raid >= M.raids) { M.phase = 'over'; M.over = { win: true, raid: M.raid, why: '네 번을 막았다' }; next = 'over'; }
    else { M.raid++; M.gold += income; M.xp += MK.xpRaid; levelUp(M); M.merges = []; rollShop(M); M.reward = win ? rewardOf(M) : null; }
    return ok({ steps, result, path: P, next });
  }

  // 막은 침입의 보상: 방 종류 하나 무료 / 함정 하나 무료 가운데 하나 (무엇인지는 그때그때)
  function rewardOf(M) { const room = L.ROOM_IDS[Math.floor(L.rnd(M.rs) * L.ROOM_IDS.length)], trap = TRAP_IDS[Math.floor(L.rnd(M.rs) * TRAP_IDS.length)]; return { opts: [{ type: 'room', id: room }, { type: 'trap', id: trap }] }; }
  function takeReward(M, i) { if (M.phase !== 'prep' || !M.reward) return fail('받을 것이 없다'); const o = M.reward.opts[i]; if (!o) return fail('없는 것이다'); M.free = (M.free || []).concat([o.id]); M.reward = null; return ok({ picked: o }); }
  // ───────── 저장 ─────────
  function save(M) { return JSON.stringify(M); }
  function load(json) { let M = null; try { M = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return null; } if (!M || M.v !== V || !Array.isArray(M.grid) || M.grid.length !== N || !M.unit || !M.board || !Array.isArray(M.bench) || !M.rs) return null; return M; }

  // ───────── 화면이 읽는 것 ─────────
  const trapInfo = id => (TRAP[id] ? { id, name: TRAP[id].name, short: TRAP[id].short, more: TRAP[id].more, fx: TRAP[id].fx, cost: trapCost(id), maze: !!(TRAP[id].lure || TRAP[id].maw || TRAP[id].confuse) } : null);
  const unitView = (M, uid) => { const u = M.unit[uid]; if (!u) return null; const w = whereOf(M, uid); return Object.assign({ uid, sell: sellValue(u), at: w }, L.unitInfo(u.kind, u.star)); };
  function partyView(M, raid) { const R = RAIDS[clamp(raid || M.raid, 1, RAIDS.length) - 1], sc = scaleOf(raid || M.raid); return R.units.map(kind => Object.assign(L.invInfo(kind, 1, { hp: sc.hp * MK.hpMul / L.K.hpMul, atk: sc.atk, san: sc.san * MK.sanMul / L.K.sanMul }), { avoid: AVOIDERS.includes(kind), scout: SCOUTS.includes(kind), breaker: BREAKERS.includes(kind), egg: eggDmg(kind) })); }
  // 본체 방: 선 권속과 본체의 꼴 (판 위 권속의 성향으로 정해진다)
  function coreView(M) { const form = L.formOf(boardUids(M).map(id => M.unit[id].kind)); return { units: (M.board[CORE] || []).map(uid => unitView(M, uid)), max: MK.coreMax, form, step: form === 'drop' ? 0 : 1 }; }
  function view(M) {
    const P = M.phase === 'prep' ? pathOf(M) : null, R = RAIDS[clamp(M.raid, 1, RAIDS.length) - 1];
    return { v: M.v, raid: M.raid, raids: M.raids, phase: M.phase, over: M.over, gold: M.gold, level: M.level, maxLv: MK.maxLv, xp: M.xp, xpNeed: MK.xpNeed[M.level] || 0, cap: cap(M), placed: boardUids(M).length,
      egg: { hp: M.egg, max: M.eggMax }, core: coreView(M), cols: COLS, rows: ROWS, entrance: { r: -1, c: 2, cell: ENT }, exit: { r: ROWS - 1, c: 2, cell: EXIT }, coreCell: CORE, eggCell: EGG, dug: dugCount(M), dugCap: dugCap(M),
      grid: M.grid.map((g, i) => { const p = rc(i), e1 = canDig(M, i), e2 = canFill(M, i); return { cell: i, r: p[0], c: p[1], dug: g.dug, use: g.use, room: g.room, roomInfo: g.room ? L.roomInfo(g.room) : null, trap: g.trap, trapInfo: g.trap ? trapInfo(g.trap) : null, units: (M.board[i] || []).map(uid => unitView(M, uid)), max: g.use === 'kin' ? roomCap(i) : 0, canPlace: !placeWhy(M, i), placeWhy: placeWhy(M, i), fixed: fixedCell(i), canDig: !e1, digCost: g.dug ? 0 : digCost(i), digWhy: e1, canFill: !e2, fillGold: g.dug && !fixedCell(i) ? fillGold(i) : 0, fillWhy: e2, onPath: !!P && P.cells.includes(i) }; }),
      shop: M.shop.map((k, i) => (k ? Object.assign({ i, can: M.gold >= L.KIN[k].cost }, L.unitInfo(k, 1)) : null)), bench: M.bench.map(uid => (uid != null ? unitView(M, uid) : null)), merges: M.merges,
      costs: { reroll: MK.reroll, xp: MK.xpCost, room: MK.roomCost, trap: MK.trapCost }, canXp: M.level < MK.maxLv && M.gold >= MK.xpCost, canReroll: M.gold >= MK.reroll,
      next: M.phase === 'over' ? null : { raid: M.raid, name: R.name, party: partyView(M), path: P ? P.cells : [], back: P ? P.back : [], breaks: P ? P.breaks : [], avoided: P ? P.avoided : false, len: P ? P.len : 0, scout: P ? P.scout : false, scoutPath: P ? P.scoutPath : [], lostAt: P ? P.lostAt : [], warp: P ? P.warp : [], warps: P ? P.warps : [], lured: P ? P.lured : [], confused: P ? P.confused : [] },
      rooms: L.ROOM_IDS.map(id => L.roomInfo(id)), traps: TRAP_IDS.map(trapInfo), last: M.last, hist: M.hist,
      reward: M.reward ? { opts: M.reward.opts.map((o, i) => Object.assign({ i, type: o.type }, o.type === 'room' ? L.roomInfo(o.id) : trapInfo(o.id))) } : null, free: (M.free || []).map(id => Object.assign({ type: L.ROOM[id] ? 'room' : 'trap' }, L.ROOM[id] ? L.roomInfo(id) : trapInfo(id))) };
  }
  return { V, COLS, ROWS, N, ENT, EXIT, CORE, EGG, MK, RAIDS, TRAP, TRAP_IDS, AVOIDERS, BREAKERS, rc, idx, newRun, view, dig, fill, setUse, canDig, canFill, digCost, fillGold, pathOf, buy, sell, sellValue, reroll, buyXp, move, merge, whereOf, raid, partyOf, roomSyn, save, load, takeReward, walker, scoutPath, SCOUTS, trapInfo, dugCount, dugCap, connected };
})();
if (typeof module !== 'undefined') module.exports = MAZE;
