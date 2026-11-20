// 옛 것의 둥지 — 땅속의 한 방울. 둥지를 틀기 전, 빛 없는 흙 속을 돌아다니며 먹고 자라고 몸을 바꾸는 짧은 구간.
//   runPrologue({ asp, seed, tut, speed }) → Promise<{ ess, kin: [], gold, size, time, fell, skipped, parts, mut }>
// 먹은 알갱이는 색마다 따로 모인다. 그것을 써서 부위를 돋우고 올린다(다섯 자리 × 다섯 징조, 세 단계씩).
// 쓰지 않고 남긴 것이 둥지의 첫 정수가 된다. 끝날 때 돋운 부위 하나를 허물에 새기면 둥지에서 그 징조의 변이가 된다.
// 화면은 스스로 만든 덮개(#pro) 하나. 끝나면 지운다. 시험용으로 도는 동안 window.__pro 를 내놓는다.
const PRO = {
  W: 1500, H: 1100, TPS: 30,
  need: [16, 44],                // 몸집: 크기 2, 크기 3
  cost: [3, 5, 8],              // 부위 한 단계의 값 (그 징조의 알갱이)
  open: { mouth: 1, eye: 1, leg: 2, skin: 2, core: 3 },   // 자리가 열리는 크기
  ess: 0.36, essCap: 36, bead: 6, goldCap: 120, regrow: 5,
  maxT: 150, sweepAt: 75,
  speed: [64, 60, 56], rad: [7, 11, 15], scale: [1, 1.5, 2], light: [88, 112, 138],
  css: `#pro { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 15; background: #05040a; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
#pro, #pro * { box-sizing: border-box; }
#pro canvas.pro-cv { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; image-rendering: pixelated; touch-action: none; cursor: crosshair; }
#pro img { image-rendering: pixelated; }
.pro-hud { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 8px); left: max(12px, env(safe-area-inset-left, 0px)); right: max(12px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 5px; pointer-events: none; font-family: var(--display, sans-serif); font-size: 12px; line-height: 1.2; color: #ece6d6; text-shadow: 0 1px 0 #05040a, 0 -1px 0 #05040a, 1px 0 0 #05040a, -1px 0 0 #05040a; }
.pro-row { display: flex; align-items: center; gap: 6px 12px; flex-wrap: nowrap; white-space: nowrap; padding-right: 92px; min-height: 22px; } .pro-row2 { min-height: 16px; }
.pro-pips { display: inline-flex; gap: 3px; align-items: center; } .pro-pips i { display: block; width: 9px; height: 9px; border: 1px solid #05040a; background: #3a3344; } .pro-pips.sz i { border-radius: 50%; } .pro-pips.sz i.on { background: #dff0e0; } .pro-pips.hp i.on { background: #ff5f57; }
.pro-ess { display: inline-flex; gap: 8px; } .pro-ess span { display: inline-flex; align-items: center; gap: 3px; } .pro-ess i { display: block; width: 7px; height: 7px; border: 1px solid #05040a; }
.pro-bar { height: 5px; width: min(100%, 300px); background: #05040a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-bar i { display: block; height: 100%; background: #e8c030; }
.pro-cap { position: absolute; left: 12px; right: 12px; top: 24%; text-align: center; pointer-events: none; font-family: var(--display, sans-serif); font-size: 16px; line-height: 1.35; color: #fff3a0; text-shadow: 0 2px 0 #05040a, 0 -1px 0 #05040a, 1px 0 0 #05040a, -1px 0 0 #05040a; word-break: keep-all; transition: opacity .3s; }
.pro-cap small { display: block; font-family: var(--body, sans-serif); font-size: 13px; color: #ece6d6; margin-top: 3px; }
.pro-skip { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 6px); right: max(10px, env(safe-area-inset-right, 0px)); }
.pro-settle { position: absolute; right: max(12px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); white-space: nowrap; }
.pro-grow { position: absolute; left: max(12px, env(safe-area-inset-left, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); white-space: nowrap; }
.pro-grow.can::after { content: ""; position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; background: #ff5f57; border: 2px solid #05040a; border-radius: 50%; }
.pro-b { font-family: var(--display, sans-serif); font-size: 12px; line-height: 1.3; color: #ece6d6; background: #2a2236; border: 1px solid #07050a; padding: 8px 10px; min-height: 36px; cursor: pointer; box-shadow: inset 0 0 0 1px #4a3c58, inset 0 -4px 0 rgba(0, 0, 0, .3); }
.pro-b.pri { background: #e8c030; color: #0d0a12; padding: 10px 16px; min-height: 44px; font-size: 14px; box-shadow: inset 0 0 0 1px #fff3a0, inset 0 3px 0 #fff3a0, inset 0 -5px 0 #a87e14; }
.pro-b.big { padding: 10px 14px; min-height: 44px; font-size: 14px; }
.pro-b[disabled] { opacity: .5; cursor: default; }
.pro-b:focus-visible, .pro-cell:focus-visible, .pro-keep:focus-visible { outline: 2px solid #ece6d6; outline-offset: 2px; }
@media (min-width: 900px) { .pro-hud { font-size: 15px; } .pro-pips i { width: 12px; height: 12px; } .pro-ess i { width: 9px; height: 9px; } .pro-bar { height: 7px; width: 420px; } .pro-cap { font-size: 20px; } .pro-cap small { font-size: 15px; } .pro-b { font-size: 14px; } }
.pro-end, .pro-shop { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: center; justify-content: center; padding: calc(env(safe-area-inset-top, 0px) + 10px) 12px calc(env(safe-area-inset-bottom, 0px) + 10px); background: rgba(5, 4, 10, .8); }
.pro-shop[hidden] { display: none; }
.pro-card { width: min(100%, 440px); max-height: 100%; background: #1d1826; border: 2px solid #e8c030; box-shadow: inset 0 0 0 2px #07050a; padding: 14px; display: flex; flex-direction: column; gap: 8px; color: #ece6d6; font-family: var(--body, sans-serif); font-size: 14px; line-height: 1.45; word-break: keep-all; }
.pro-card h2 { margin: 0; font-family: var(--display, sans-serif); font-weight: 400; font-size: 20px; line-height: 1.2; } .pro-card h2 small { font-family: var(--body, sans-serif); font-size: 13px; color: #a59cb4; margin-left: 6px; }
.pro-card p { margin: 0; } .pro-mute { color: #a59cb4; font-size: 13px; } .pro-warn { color: #ff9a8a; font-size: 13px; }
.pro-bars { display: grid; grid-template-columns: auto 1fr auto; gap: 3px 8px; align-items: center; font-size: 13px; } .pro-bars span.b { display: block; height: 8px; background: #07050a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-bars span.b i { display: block; height: 100%; }
.pro-say { display: flex; gap: 10px; align-items: flex-start; } .pro-say img { flex: none; }
.pro-card > .pro-b.pri { align-self: flex-end; }
.pro-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pro-grid { display: grid; grid-template-columns: 34px repeat(5, minmax(0, 1fr)); gap: 4px; align-items: stretch; }
.pro-gh { display: flex; align-items: center; justify-content: center; gap: 3px; font-family: var(--display, sans-serif); font-size: 12px; min-height: 20px; } .pro-gh i { display: block; width: 8px; height: 8px; border: 1px solid #07050a; }
.pro-gl { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font-family: var(--display, sans-serif); font-size: 12px; color: #a59cb4; } .pro-gl small { font-family: var(--body, sans-serif); font-size: 10px; color: #ff9a8a; white-space: nowrap; }
.pro-cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 50px; padding: 2px; background: #2a2236; border: 1px solid #07050a; box-shadow: inset 0 0 0 1px #4a3c58; cursor: pointer; }
.pro-cell img { width: 36px; height: 36px; opacity: .55; } .pro-cell.own img, .pro-cell.can img { opacity: 1; }
.pro-cell.own { box-shadow: inset 0 0 0 2px var(--c); background: #332a42; } .pro-cell.sel { outline: 2px solid #e8c030; outline-offset: 0; z-index: 1; }
.pro-cell.lock { opacity: .32; } .pro-cell.can:not(.own)::after { content: ""; position: absolute; top: 2px; right: 2px; width: 6px; height: 6px; background: #e8c030; border-radius: 50%; }
.pro-lv { display: inline-flex; gap: 2px; } .pro-lv i { display: block; width: 7px; height: 4px; background: #07050a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-lv i.on { background: var(--c, #e8c030); box-shadow: none; }
.pro-det { display: flex; flex-direction: column; gap: 4px; min-height: 118px; } .pro-det b { font-family: var(--display, sans-serif); font-weight: 400; font-size: 15px; }
.pro-det .pro-brow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
.pro-parts { display: flex; flex-wrap: wrap; gap: 6px; } .pro-keep { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 3px; font: inherit; font-size: 13px; color: #ece6d6; background: #2a2236; border: 1px solid #07050a; box-shadow: inset 0 0 0 1px #4a3c58; cursor: pointer; } .pro-keep img { width: 28px; height: 28px; }
.pro-keep.on { box-shadow: inset 0 0 0 2px #e8c030; background: #3a3020; }
@media (max-height: 640px) { .pro-cell { min-height: 44px; } .pro-cell img { width: 30px; height: 30px; } .pro-card { padding: 10px; gap: 6px; } .pro-det { min-height: 108px; } }`,
};
function runPrologue(opts) {
  opts = opts || {};
  const ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'], ASPK = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' };
  const home = ASPS.includes(opts.asp) ? opts.asp : 'abyss', TPS = PRO.TPS, W = PRO.W, H = PRO.H;
  let seed = (opts.seed >>> 0) || 1; const rnd = () => { let t = (seed = (seed + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rr = (a, b) => a + rnd() * (b - a), ri = n => Math.floor(rnd() * n), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const say = k => { try { sfx(k); } catch (e) { /* 소리는 없어도 된다 */ } };

  // ---------- 부위: 다섯 자리 × 다섯 징조. 한 자리에는 하나만 돋는다. v 는 단계별 세기 ----------
  const SLOTS = [['mouth', '입'], ['eye', '눈'], ['leg', '발'], ['skin', '겉'], ['core', '속']], SLOTK = { mouth: '입', eye: '눈', leg: '발', skin: '겉', core: '속' };
  const CAT = [
    { id: 'mouth_abyss', name: '빨판', mut: 'tentacle', v: [30, 46, 64], say: v => `둘레 ${v} 안의 알갱이를 빨아들인다` },
    { id: 'mouth_nebula', name: '빛입', mut: 'ring', v: [30, 50, 70], say: v => `알갱이를 먹을 때 ${v}% 로 하나가 더 맺힌다` },
    { id: 'mouth_brood', name: '포자입', mut: 'mouth', v: [30, 45, 60], say: v => `먹을 때 ${v}% 로 곁에 번식 알갱이가 돋는다` },
    { id: 'mouth_dusk', name: '속삭입', mut: 'whisper', v: [1, 2, 3], say: (v, k) => ['꿈틀이가 달아나지 않고 다가온다', '가까운 알갱이도 천천히 끌려온다', '삼킬 수 있는 굴이빨도 달아나지 않는다'][k] },
    { id: 'mouth_hunger', name: '톱니입', mut: 'teeth', v: [0.5, 0.5, 1.5], g: [0, 3, 5], say: (v, k) => ['나보다 한 치 큰 굴이빨도 삼킨다', '한 치 큰 굴이빨도 삼키고, 삼킬 때 3을 더 얻는다', '큰 굴이빨도 삼키고, 삼킬 때 5를 더 얻는다'][k] },
    { id: 'eye_abyss', name: '등불', mut: 'gills', v: [25, 45, 70], say: v => `밝은 둘레가 ${v}% 넓어진다` },
    { id: 'eye_nebula', name: '셋째눈', mut: 'thirdeye', v: [1, 2, 3], say: (v, k) => ['어둠 속의 굴이빨이 보인다', '화면 밖의 굴이빨도 가리킨다', '깊은 것이 오는 길을 훨씬 일찍 안다'][k] },
    { id: 'eye_brood', name: '더듬이', mut: 'spore', v: [1, 2, 3], say: (v, k) => ['먼 알갱이가 또렷하고, 먹이 무더기를 더 많이 가리킨다', '어둠 속의 꿈틀이도 보인다', '진액이 맺힌 곳도 가리킨다'][k] },
    { id: 'eye_dusk', name: '가면눈', mut: 'maskm', v: [20, 35, 50], say: v => `굴이빨이 ${v}% 더 가까이 와야 나를 알아챈다` },
    { id: 'eye_hunger', name: '피눈', mut: 'steelgut', v: [15, 25, 35], say: v => `삼킬 수 있는 것이 가까우면 ${v}% 빨라진다` },
    { id: 'leg_abyss', name: '지느러미', mut: 'gills', v: [15, 28, 40], say: v => `${v}% 더 빨리 미끄러진다` },
    { id: 'leg_nebula', name: '별뜀', mut: 'ring', v: [46, 60, 76], cd: [5, 4, 3], say: (v, k) => `${[5, 4, 3][k]}초마다 가려는 쪽으로 ${v}만큼 건너뛴다` },
    { id: 'leg_brood', name: '뿌리발', mut: 'spore', v: [5, 3.5, 2.5], say: v => `뿌리가 흙에서 ${v}초마다 번식 알갱이를 빨아올린다` },
    { id: 'leg_dusk', name: '실발', mut: 'whisper', v: [0.9, 1.4, 2], say: v => `지나간 자리에 실이 남는다. 밟은 굴이빨은 ${v}초 엉킨다` },
    { id: 'leg_hunger', name: '덮침발', mut: 'teeth', v: [35, 55, 75], say: v => `무엇이든 먹은 뒤 잠깐 ${v}% 빨라진다` },
    { id: 'skin_abyss', name: '비늘', mut: 'tentacle', v: [1, 1, 2], say: (v, k) => ['한 번 더 버틴다', '한 번 더 버티고, 물린 뒤 더 오래 안 물린다', '두 번 더 버티고, 물린 뒤 더 오래 안 물린다'][k] },
    { id: 'skin_nebula', name: '수정껍질', mut: 'ring', v: [2.5, 4, 6], say: v => `나를 문 굴이빨이 ${v}초 굳는다` },
    { id: 'skin_brood', name: '이끼', mut: 'spore', v: [22, 16, 11], say: v => `${v}초마다 상처 하나가 아문다` },
    { id: 'skin_dusk', name: '막', mut: 'maskm', v: [30, 22, 15], say: v => `${v}초마다 한 번, 물려도 흘려보낸다` },
    { id: 'skin_hunger', name: '가시', mut: 'teeth', v: [1, 2, 3], say: (v, k) => ['나를 문 작은 굴이빨이 죽는다', '큰 굴이빨도 물면 쪼그라든다', '물려도 먹은 것을 흘리지 않는다'][k] },
    { id: 'core_abyss', name: '물주머니', mut: 'gills', v: [2, 1, 0], g: [2, 4, 6], say: (v, k) => `물려도 ${v ? v + '개만' : '하나도 안'} 흘린다. 진액 한 방울 +${[2, 4, 6][k]}` },
    { id: 'core_nebula', name: '고리', mut: 'ring', v: [34, 48, 62], cd: [12, 9, 6], say: v => `도는 고리가 둘레 ${v} 안의 알갱이를 긁어 온다` },
    { id: 'core_brood', name: '알주머니', mut: 'mouth', v: [15, 30, 45], say: v => `남긴 것이 ${v}% 더 많은 정수가 된다` },
    { id: 'core_dusk', name: '울림통', mut: 'whisper', v: [14, 11, 8], say: v => `${v}초마다 울려서 가까운 굴이빨을 쫓는다` },
    { id: 'core_hunger', name: '강철위', mut: 'steelgut', v: [4, 3, 2], g: [2, 3, 5], say: (v, k) => `알갱이 ${v}개마다 하나 더, 산 것을 삼키면 +${[2, 3, 5][k]}` },
  ];
  CAT.forEach(c => { const q = c.id.split('_'); c.slot = q[0]; c.asp = q[1]; c.cost = PRO.cost.slice(); });
  const PART = {}; CAT.forEach(c => { PART[c.id] = c; });

  // ---------- 흙 속에 있는 것들 ----------
  const zero = () => ({ abyss: 0, nebula: 0, brood: 0, dusk: 0, hunger: 0 });
  const S = { t: 0, p: { x: 0, y: 0, vx: 0, vy: 0, size: 1, hp: 3, inv: 0, face: 1, blinkAt: 0, pounce: 0, veilAt: 0, mossAt: 0, drumAt: 0, ringAt: 0, still: 0 }, aim: { x: 0, y: 0, on: false }, keys: {}, bio: 0, purse: zero(), spent: 0, gold: 0, nth: 0,
    worn: {}, clusters: [], motes: [], wrig: [], beads: [], roots: [], hunters: [], kin: [], sprouts: [], silk: [], fx: [], cap: null, sweep: { st: 'idle', next: PRO.sweepAt * TPS, n: 0 }, ended: null, grewAt: 0, swallowed: 0, shake: 0, flash: 0, manual: false, shop: false, shopSeen: false, stats: { hits: 0, bought: 0, veiled: 0 } };
  const P = S.p; P.x = rr(W * 0.35, W * 0.65); P.y = rr(H * 0.4, H * 0.7); S.aim.x = P.x; S.aim.y = P.y;
  { // 먹이 무더기: 별자리의 색이 더 많다
    const list = [home, home, home, home, home]; ASPS.filter(a => a !== home).forEach((a, k) => { list.push(a, a); if (k < 2) list.push(a); });
    for (let k = 0; k < list.length; k++) { let c = null, guard = 0; while (guard++ < 300) { c = { x: rr(90, W - 90), y: rr(90, H - 90), asp: list[k], r: rr(34, 48), seed: ri(1e6) }; const near = k < 2 ? 150 : 110; if (dist(c, P) < (k < 2 ? 70 : 150) || (k < 2 && dist(c, P) > near + 90) || S.clusters.some(o => dist(o, c) < 235)) continue; break; } S.clusters.push(c);
      const n = 5 + ri(3); for (let j = 0; j < n; j++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * c.r; S.motes.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * 0.8, asp: c.asp, alive: true, ph: ri(8) }); }
      if (k >= 2 && rnd() < 0.8) S.wrig.push({ x: c.x + rr(-20, 20), y: c.y + rr(-14, 14), vx: 0, vy: 0, asp: c.asp, alive: true, ph: ri(8), a: rnd() * 6.283, hx: c.x, hy: c.y }); }
    for (let k = 0; k < 20; k++) S.motes.push({ x: rr(40, W - 40), y: rr(40, H - 40), asp: rnd() < 0.4 ? home : ASPS[ri(5)], alive: true, ph: ri(8) });   // 흩어진 알갱이
    for (let k = 0; k < 5; k++) S.wrig.push({ x: rr(80, W - 80), y: rr(80, H - 80), vx: 0, vy: 0, asp: ASPS[ri(5)], alive: true, ph: ri(8), a: rnd() * 6.283, hx: 0, hy: 0, free: true });
    // 뿌리와 거기 맺힌 진액
    for (let k = 0; k < 7; k++) { const x0 = rr(80, W - 80), y0 = rr(60, H - 160), pts = []; let x = x0, y = y0; const n = 5 + ri(4); for (let j = 0; j < n; j++) { pts.push([x, y]); x += rr(-26, 26); y += rr(18, 34); } S.roots.push(pts); const m = 2 + ri(2); for (let j = 0; j < m && S.beads.length < 20; j++) { const q = pts[1 + ri(pts.length - 1)]; S.beads.push({ x: q[0] + rr(-3, 3), y: q[1] + 4, alive: true, ph: ri(8) }); } }
    while (S.beads.length < 20) S.beads.push({ x: rr(60, W - 60), y: rr(60, H - 60), alive: true, ph: ri(8) });
    // 굴이빨: 작은 것 넷은 먹이 곁을 지키고, 큰 것 셋은 멀리 있다
    const spots = S.clusters.slice(2).sort((a, b) => dist(a, P) - dist(b, P));
    for (let k = 0; k < 7; k++) { const big = k >= 4; let c, guard = 0; do { const base = spots[(big ? spots.length - 1 - (k - 4) * 2 : 1 + k * 2) % spots.length]; c = { x: clampN(base.x + rr(-60, 60), 60, W - 60), y: clampN(base.y + rr(-50, 50), 60, H - 60) }; } while (guard++ < 40 && dist(c, P) < (big ? 380 : 250));
      S.hunters.push({ x: c.x, y: c.y, vx: 0, vy: 0, hx: c.x, hy: c.y, size: big ? 2.5 : 1.5, r: big ? 13 : 9, asp: ASPS[ri(5)], alive: true, stun: 0, a: rnd() * 6.283, face: 1, mode: 'roam', seen: false }); }
  }
  S.clusters.forEach(c => { c.n0 = S.motes.filter(m => Math.abs(m.x - c.x) < c.r + 2 && Math.abs(m.y - c.y) < c.r + 2).length; c.at = PRO.regrow * TPS + ri(60); });

  const lv = id => { const w = S.worn[PART[id].slot]; return w && w.id === id ? w.lv : 0; }, val = id => { const k = lv(id); return k ? PART[id].v[k - 1] : 0; }, gv = id => { const k = lv(id); return k ? PART[id].g[k - 1] : 0; };
  const maxHp = () => 3 + val('skin_abyss'), reach = () => val('mouth_hunger'), hostile = h => h.size > P.size + reach();
  const top = () => ASPS.slice().sort((a, b) => S.purse[b] - S.purse[a] || (a === home ? -1 : b === home ? 1 : 0))[0];
  const essOf = () => { const e = {}, k0 = PRO.ess * (1 + val('core_brood') / 100); let tot = 0; ASPS.forEach(a => { e[a] = Math.round(S.purse[a] * k0); tot += e[a]; }); if (tot > PRO.essCap) { const k = PRO.essCap / tot; tot = 0; ASPS.forEach(a => { e[a] = Math.floor(e[a] * k); tot += e[a]; }); for (let g = 0; tot < PRO.essCap && g < 9; g++) { e[top()]++; tot++; } } return e; };
  const caption = (s, sub, sec) => { S.cap = { s, sub: sub || '', until: S.t + (sec || 2.6) * TPS }; };
  // 먹는다: 그 색의 주머니에 쌓이고(쓸 수 있다), 몸집이 는다
  const feed = (asp, n, x, y, again) => { S.purse[asp] += n; if (!again) S.bio += n; S.fx.push({ k: 'eat', x, y, t0: S.t, asp }); if (lv('leg_hunger')) P.pounce = S.t + Math.round(1.2 * TPS); };
  const eatMote = m => { m.alive = false; let n = 1; if (!m.re) { if (rnd() * 100 < val('mouth_nebula')) n++; const g = val('core_hunger'); if (g && ++S.nth % g === 0) n++; if (!m.sp && rnd() * 100 < val('mouth_brood')) S.sprouts.push({ x: clampN(P.x + P.face * rr(6, 16), 20, W - 20), y: clampN(P.y + rr(-10, 10), 20, H - 20), asp: 'brood', at: S.t + 8 }); } feed(m.asp, n, m.x, m.y, m.re); };
  function grow() {
    while (P.size < 3 && S.bio >= PRO.need[P.size - 1]) {
      P.size++; P.hp = Math.min(maxHp(), P.hp + 1); S.grewAt = S.t; S.flash = S.t; S.fx.push({ k: 'split', x: P.x, y: P.y, t0: S.t }); say('evo');
      caption(P.size === 2 ? '몸이 커졌다' : '다 자랐다', P.size === 2 ? '발과 겉을 돋울 수 있다. 작은 굴이빨은 이제 먹이다' : '속까지 돋울 수 있다. 큰 굴이빨도 삼킨다', 3.2);
    }
  }
  // ---------- 돋운다: 그 징조의 알갱이를 써서 부위를 돋우거나 한 단계 올린다 ----------
  const priceOf = id => { const d = PART[id], w = S.worn[d.slot]; return w && w.id === id ? (w.lv >= 3 ? null : d.cost[w.lv]) : d.cost[0]; };
  const whyNot = id => { const d = PART[id]; if (!d) return '없는 부위다'; if (P.size < PRO.open[d.slot]) return '크기 ' + PRO.open[d.slot] + '부터 돋는 자리다'; const c = priceOf(id); if (c == null) return '다 올렸다'; if (S.purse[d.asp] < c) return ASPK[d.asp] + ' 알갱이가 ' + (c - S.purse[d.asp]) + '개 모자란다'; return null; };
  const canAny = () => CAT.some(d => !whyNot(d.id) && !(S.worn[d.slot] && S.worn[d.slot].id !== d.id));   // 빈 자리에 새로 돋우거나, 돋운 것을 올릴 수 있나
  function buy(id) {
    if (S.ended || whyNot(id)) return false; const d = PART[id], c = priceOf(id), w = S.worn[d.slot];
    S.purse[d.asp] -= c; S.spent += c; S.stats.bought++;
    if (w && w.id === id) w.lv++; else S.worn[d.slot] = { id, lv: 1 };
    if (id === 'skin_abyss') P.hp = Math.min(maxHp(), P.hp + 1); if (id === 'skin_dusk') P.veilAt = S.t; if (id === 'skin_brood') P.mossAt = S.t + val(id) * TPS; if (id === 'core_dusk') P.drumAt = S.t + 3 * TPS; if (id === 'leg_nebula') P.blinkAt = S.t + TPS;
    S.fx.push({ k: 'split', x: P.x, y: P.y, t0: S.t }); say('evo'); return true;
  }
  function hurt(fromX, fromY) {
    if (P.inv > 0 || S.ended) return false;
    if (lv('skin_dusk') && S.t >= P.veilAt) { P.veilAt = S.t + val('skin_dusk') * TPS; P.inv = Math.round(0.8 * TPS); S.stats.veiled++; S.fx.push({ k: 'veil', x: P.x, y: P.y, t0: S.t }); say('step'); caption('막이 흘려보냈다', '', 1.4); return true; }
    P.hp--; P.inv = Math.round(1.7 * TPS * (lv('skin_abyss') >= 2 ? 1.6 : 1)); S.shake = S.t; S.stats.hits++; say('hit');
    const a = Math.atan2(P.y - fromY, P.x - fromX); P.vx = Math.cos(a) * 150; P.vy = Math.sin(a) * 150;
    const lose = lv('skin_hunger') >= 3 ? 0 : lv('core_abyss') ? val('core_abyss') : 4;   // 흘린 것은 주워 먹을 수 있다
    for (let k = 0; k < lose; k++) { const asp = top(); if (S.purse[asp] <= 0) break; S.purse[asp]--; const b = rnd() * 6.283, d = rr(14, 30); S.motes.push({ x: clampN(P.x + Math.cos(b) * d, 20, W - 20), y: clampN(P.y + Math.sin(b) * d, 20, H - 20), asp, alive: true, ph: ri(8), re: true }); }
    if (P.hp <= 0) end('fell'); else caption(P.hp === 1 ? '한 번 더 물리면 끝이다' : '물렸다', lose ? '먹은 것을 흘렸다' : '', 1.8);
    return true;
  }
  const steer = (o, tx, ty, sp, k) => { const d = Math.hypot(tx - o.x, ty - o.y) || 1; o.vx += ((tx - o.x) / d * sp - o.vx) * (k || 0.2); o.vy += ((ty - o.y) / d * sp - o.vy) * (k || 0.2); };
  const move = (o, m) => { o.x = clampN(o.x + o.vx / TPS, m, W - m); o.y = clampN(o.y + o.vy / TPS, m, H - m); };

  function tick() {
    if (S.ended) return; S.t++; const time = S.t / TPS, pr = PRO.rad[P.size - 1];
    // 한 방울: 손가락이 가는 쪽으로 미끄러진다
    { let dx = (S.keys.right ? 1 : 0) - (S.keys.left ? 1 : 0), dy = (S.keys.down ? 1 : 0) - (S.keys.up ? 1 : 0), sp = PRO.speed[P.size - 1] * (1 + val('leg_abyss') / 100);
      if (S.t < P.pounce) sp *= 1 + val('leg_hunger') / 100;
      if (lv('eye_hunger') && (S.wrig.some(w => w.alive && dist(w, P) < 130) || S.hunters.some(h => h.alive && !hostile(h) && dist(h, P) < 130))) sp *= 1 + val('eye_hunger') / 100;
      if (dx || dy) { const d = Math.hypot(dx, dy); P.vx += (dx / d * sp - P.vx) * 0.25; P.vy += (dy / d * sp - P.vy) * 0.25; S.aim.on = false; }
      else if (S.aim.on && Math.hypot(S.aim.x - P.x, S.aim.y - P.y) > 3) steer(P, S.aim.x, S.aim.y, sp, 0.25); else { P.vx *= 0.8; P.vy *= 0.8; }
      if (P.inv > 0) P.inv--; if (Math.abs(P.vx) > 4) P.face = P.vx > 0 ? 1 : -1; move(P, 14);
      const v = Math.hypot(P.vx, P.vy);
      // 별뜀: 가려는 쪽으로 건너뛴다
      if (lv('leg_nebula') && S.aim.on && S.t >= P.blinkAt) { const d = Math.hypot(S.aim.x - P.x, S.aim.y - P.y); if (d > 64) { const j = Math.min(val('leg_nebula'), d - 8), fx0 = { k: 'blink', x: P.x, y: P.y, t0: S.t }; P.x = clampN(P.x + (S.aim.x - P.x) / d * j, 14, W - 14); P.y = clampN(P.y + (S.aim.y - P.y) / d * j, 14, H - 14); fx0.tx = P.x; fx0.ty = P.y; S.fx.push(fx0); P.blinkAt = S.t + PART.leg_nebula.cd[lv('leg_nebula') - 1] * TPS; say('step'); } }
      // 뿌리발: 흙에서 조금씩 빨아올린다
      if (lv('leg_brood') && ++P.still >= val('leg_brood') * TPS) { P.still = 0; feed('brood', 1, P.x + rr(-10, 10), P.y + 12); }
      // 실발: 지나간 자리에 실
      if (lv('leg_dusk') && v > 20 && S.t % 10 === 0) { S.silk.push({ x: P.x - P.face * 4, y: P.y + 4, until: S.t + 5 * TPS }); if (S.silk.length > 16) S.silk.shift(); }
      if (lv('skin_brood') && S.t >= P.mossAt) { P.mossAt = S.t + val('skin_brood') * TPS; if (P.hp < maxHp()) { P.hp++; S.fx.push({ k: 'heal', x: P.x, y: P.y, t0: S.t }); } } }
    S.silk = S.silk.filter(n => n.until > S.t);
    // 먹는다
    const pull = Math.max(val('mouth_abyss'), lv('mouth_dusk') >= 2 ? 30 : 0), pullSp = lv('mouth_abyss') ? 110 : 45, lure = lv('mouth_dusk');
    for (const m of S.motes) { if (!m.alive) continue; const ax = Math.abs(m.x - P.x), ay = Math.abs(m.y - P.y);
      if (ax < pr + 4 && ay < pr + 4 && dist(m, P) < pr + 3) { eatMote(m); if (S.t % 2 === 0) say('step'); continue; }
      if (pull && ax < pull + pr && ay < pull + pr) { const d = dist(m, P); if (d < pull + pr) { m.x += (P.x - m.x) / d * pullSp / TPS; m.y += (P.y - m.y) / d * pullSp / TPS; } } }
    if (lv('core_nebula') && S.t >= P.ringAt) { P.ringAt = S.t + PART.core_nebula.cd[lv('core_nebula') - 1]; const R = val('core_nebula') + pr; let best = null, bd = R; for (const q of S.motes) if (q.alive) { const dq = dist(q, P); if (dq < bd) { bd = dq; best = q; } } if (best) { S.fx.push({ k: 'nib', x: P.x, y: P.y - pr, tx: best.x, ty: best.y, t0: S.t }); eatMote(best); } }
    for (const b of S.beads) if (b.alive && dist(b, P) < pr + 4) { b.alive = false; S.gold = Math.min(PRO.goldCap, S.gold + PRO.bead + gv('core_abyss')); S.fx.push({ k: 'gold', x: b.x, y: b.y, t0: S.t }); say('coin'); }
    for (const w of S.wrig) { if (!w.alive) continue; const d = dist(w, P);
      if (d < pr + 3) { w.alive = false; feed(w.asp, 2 + gv('core_hunger'), w.x, w.y); say('dig'); continue; }
      if (lure && d < 120) steer(w, P.x, P.y, 40, 0.2); else if (d < 64) steer(w, w.x + (w.x - P.x), w.y + (w.y - P.y), 46, 0.3); else { if (S.t % 40 === w.ph) w.a += rr(-1.2, 1.2); const tx = w.free ? w.x + Math.cos(w.a) * 30 : w.hx + Math.cos(w.a) * 34, ty = w.free ? w.y + Math.sin(w.a) * 30 : w.hy + Math.sin(w.a) * 26; steer(w, tx, ty, 14, 0.1); }
      move(w, 12); if (w.x <= 12 || w.x >= W - 12) w.a = Math.PI - w.a; if (w.y <= 12 || w.y >= H - 12) w.a = -w.a; }
    for (const s of S.sprouts) if (!s.done && S.t >= s.at) { s.done = true; S.motes.push({ x: s.x, y: s.y, asp: s.asp, alive: true, ph: ri(8), sp: true }); S.fx.push({ k: 'heal', x: s.x, y: s.y + 14, t0: S.t }); }
    if (S.t % 30 === 0) { S.sprouts = S.sprouts.filter(s => !s.done); for (const c of S.clusters) if (S.t >= c.at) { c.at = S.t + PRO.regrow * TPS; let n = 0; for (const m of S.motes) if (m.alive && Math.abs(m.x - c.x) < c.r + 2 && Math.abs(m.y - c.y) < c.r + 2) n++; if (n < c.n0) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * c.r; S.motes.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * 0.8, asp: c.asp, alive: true, ph: ri(8) }); } } if (S.motes.length > 400) S.motes = S.motes.filter(m => m.alive);
      if (S.t % (8 * TPS) === 0) { S.wrig = S.wrig.filter(w => w.alive); if (S.wrig.length < 14) { let x, y, g = 0; do { x = rr(60, W - 60); y = rr(60, H - 60); } while (g++ < 20 && Math.hypot(x - P.x, y - P.y) < 200); S.wrig.push({ x, y, vx: 0, vy: 0, asp: ASPS[ri(5)], alive: true, ph: ri(8), a: rnd() * 6.283, hx: 0, hy: 0, free: true }); } } }
    // 울림통: 가까운 굴이빨을 쫓는다
    if (lv('core_dusk') && S.t >= P.drumAt) { const near = S.hunters.filter(h => h.alive && hostile(h) && dist(h, P) < 115); if (near.length) { near.forEach(h => { h.scared = S.t + Math.round(2.6 * TPS); }); P.drumAt = S.t + val('core_dusk') * TPS; S.fx.push({ k: 'pulse', x: P.x, y: P.y, t0: S.t }); say('trap'); } }
    // 굴이빨: 나보다 크면 쫓아오고, 내가 더 크면 달아난다
    const see = 1 - val('eye_dusk') / 100;
    for (const h of S.hunters) { if (!h.alive) continue; const d = dist(h, P), bad = hostile(h);
      if (h.stun > 0) { h.stun--; h.vx *= 0.85; h.vy *= 0.85; move(h, 16); continue; }
      if (bad && !(h.scared > S.t)) {
        if (S.silk.length && !(h.silkImm > S.t)) { const k = S.silk.findIndex(n => Math.abs(n.x - h.x) < 11 && Math.abs(n.y - h.y) < 11); if (k >= 0) { S.silk.splice(k, 1); h.stun = Math.round(val('leg_dusk') * TPS); h.silkImm = S.t + h.stun + 2 * TPS; S.fx.push({ k: 'veil', x: h.x, y: h.y, t0: S.t }); continue; } }
        if (d < (h.mode === 'chase' ? 225 : 160) * see && Math.hypot(h.x - h.hx, h.y - h.hy) < 330) { if (h.mode !== 'chase') { h.mode = 'chase'; if (!h.seen) { h.seen = true; if (S.t > 3 * TPS) caption('굴이빨이다', '너보다 크다. 달아나', 2); } } steer(h, P.x, P.y, h.size > 2 ? 49 : 54, 0.12); }
        else { h.mode = 'roam'; if (S.t % 50 === 0) h.a += rr(-1.5, 1.5); steer(h, h.hx + Math.cos(h.a) * 46, h.hy + Math.sin(h.a) * 36, 16, 0.08); }
        if (d < h.r + pr - 3 && P.inv <= 0) { const veiled = lv('skin_dusk') && S.t >= P.veilAt; if (hurt(h.x, h.y)) { h.stun = Math.round((val('skin_nebula') || 1.1) * TPS); h.vx = -h.vx; h.vy = -h.vy; const th = veiled ? 0 : lv('skin_hunger'); if (th) { if (h.size < 2) { h.alive = false; S.fx.push({ k: 'gone', x: h.x, y: h.y, t0: S.t }); } else if (th >= 2) { h.size = 1.5; h.r = 9; S.fx.push({ k: 'gone', x: h.x, y: h.y, t0: S.t }); } } } }
      } else {
        if (!bad && d < h.r + pr - 2) { h.alive = false; const n = (h.size > 2 ? 9 : 5) + gv('mouth_hunger') + gv('core_hunger'); feed(h.asp, n, h.x, h.y); S.swallowed++; S.fx.push({ k: 'gulp', x: h.x, y: h.y, t0: S.t }); say('trap'); if (S.swallowed === 1) caption('굴이빨을 삼켰다', '쫓던 것이 먹이가 됐다', 2.4); continue; }
        if ((d < 120 && !(lv('mouth_dusk') >= 3 && !bad)) || h.scared > S.t) { h.mode = 'flee'; steer(h, h.x + (h.x - P.x), h.y + (h.y - P.y), h.size > 2 ? 40 : 44, 0.15); } else { h.mode = 'roam'; if (S.t % 50 === 0) h.a += rr(-1.5, 1.5); steer(h, h.x + Math.cos(h.a) * 30, h.y + Math.sin(h.a) * 30, 14, 0.08); }
      }
      if (Math.abs(h.vx) > 3) h.face = h.vx > 0 ? 1 : -1; move(h, 18); }
    // 깊은 것: 먹을 수 없다. 오래 머물면 온다
    { const sw = S.sweep, warn = (2.3 + (lv('eye_nebula') >= 3 ? 1.6 : 0)) * TPS;
      if (sw.st === 'idle' && S.t >= sw.next) { const a = rnd() * 6.283, far = 520; sw.sx = P.x + Math.cos(a) * far; sw.sy = P.y + Math.sin(a) * far; const lead = 0.9; sw.tx = P.x + P.vx * lead; sw.ty = P.y + P.vy * lead; const d = Math.hypot(sw.tx - sw.sx, sw.ty - sw.sy) || 1; sw.dx = (sw.tx - sw.sx) / d; sw.dy = (sw.ty - sw.sy) / d; sw.x = sw.sx; sw.y = sw.sy; sw.st = 'warn'; sw.t0 = S.t; sw.warn = warn; sw.n++; say('down'); caption(sw.n === 1 ? '땅이 울린다' : '또 온다', sw.n === 1 ? '깊은 것이 지나간다. 길에서 비켜라' : '', 2.2); }
      else if (sw.st === 'warn' && S.t - sw.t0 >= sw.warn) { sw.st = 'run'; sw.t0 = S.t; }
      else if (sw.st === 'run') { const sp = 150 + Math.min(40, sw.n * 6); sw.x += sw.dx * sp / TPS; sw.y += sw.dy * sp / TPS; S.shake = S.t;
        if (dist(sw, P) < 24 + pr - 4 && P.inv <= 0) hurt(sw.x - sw.dx * 10, sw.y - sw.dy * 10);
        for (const h of S.hunters) if (h.alive && dist(sw, h) < 26) { h.alive = false; S.fx.push({ k: 'gone', x: h.x, y: h.y, t0: S.t }); }
        if ((S.t - sw.t0) / TPS * sp > 1100) { sw.st = 'idle'; sw.next = S.t + Math.round(Math.max(5.5, 10 - sw.n) * TPS); } } }
    grow();
    if (opts.tut && !S.ended) { if (S.t === 1) caption('손가락이 가는 쪽으로 움직여', '', 3.4); if (S.t === 4 * TPS) caption('색 있는 알갱이를 먹어', '모은 색으로 몸에 부위를 돋운다', 3.4); if (S.t === 9 * TPS) caption('큰 것은 피해', '더 커지면 네가 먹어', 3.4); if (S.t === 14 * TPS && !S.stats.bought) caption('왼쪽 아래 "돋운다"', '알갱이 셋이면 첫 부위가 돋는다', 3.4); }
    else if (S.t === 1) caption('땅속의 한 방울', '먹고, 자라고, 몸을 바꿔라', 3);
    if (S.fx.length > 60) S.fx.splice(0, S.fx.length - 60);
    if (time >= PRO.maxT - 10 && S.t % TPS === 0 && time < PRO.maxT) caption('더는 버틸 수 없다', Math.ceil(PRO.maxT - time) + '초 뒤 자리를 잡는다', 1.1);
    if (time >= PRO.maxT) end('time');
  }

  // ---------- 그림 ----------
  const SP = {}, spr = (key, make) => SP[key] || (SP[key] = make());
  const DROP = { origin: 'drop', stage: 0, main: null, sub: null, muts: [], ess: {} };
  const flip = c => spr('f:' + (c.__id || (c.__id = Object.keys(SP).length + 1)), () => { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f; });
  const hunterSpr = (big, fr) => spr('h' + (big ? 1 : 0) + fr, () => { const N = big ? 30 : 20, K = Sculpt(N), c = N / 2, Pb = big ? ['#120a10', '#5a3c58', '#9a7a98', '#34203a'] : ['#140e0a', '#7a5e44', '#b89a74', '#40301e'], BN = ['#1b1d2a', '#e4dfd0', '#ffffff', '#a8a294'];
    K.L([[c - N * 0.22, c + N * 0.1], [c - N * 0.44, c + N * 0.02 + fr]], N * 0.1, 0.6, Pb);                       // 꼬리
    for (let k = 0; k < (big ? 4 : 3); k++) { const bx = c - N * 0.26 + k * N * 0.14; K.L([[bx, c - N * 0.16], [bx - 1.5, c - N * 0.36 - (k % 2)]], 1.3, 0.5, BN); }   // 등 가시
    K.B(c - N * 0.06, c + N * 0.06, N * 0.33, N * 0.27, Pb);
    K.L([[c - N * 0.2, c + N * 0.3], [c - N * 0.26 - fr, c + N * 0.44]], 1.4, 0.8, Pb); K.L([[c + N * 0.04, c + N * 0.31], [c + N * 0.08 + fr, c + N * 0.44]], 1.4, 0.8, Pb);   // 발
    const jw = N * 0.2, jh = N * 0.13 + fr * (big ? 1.5 : 1), jx = c + N * 0.26, jy = c + N * 0.08;                        // 벌어진 턱
    K.flat(K.el(jx, jy, jw, jh + 1.5), Pb[0]); K.flat(K.el(jx + 1, jy, jw - 1, jh), '#2a0508');
    K.fangs(Math.round(jx - jw + 2), Math.round(jx + jw - 1), Math.round(jy - jh + 0.5), 1, big ? 3 : 2, 2); K.fangs(Math.round(jx - jw + 3), Math.round(jx + jw - 1), Math.round(jy + jh - 0.5), -1, big ? 3 : 2, 2);
    K.px(c + N * 0.1, c - N * 0.1, '#ff5f57'); K.px(c + N * 0.1 + 1, c - N * 0.1, '#ffd0c0'); if (big) { K.px(c - N * 0.02, c - N * 0.14, '#ff5f57'); K.px(c + N * 0.2, c - N * 0.06, '#ff5f57'); }
    return K.canvas(); });
  const wrigSpr = (asp, fr) => spr('w' + asp + fr, () => { const K = Sculpt(10), Pp = PAL[asp] || PAL.base; K.px(1 + fr, 6, Pp[3]); K.px(2, 5 + fr, Pp[1]); K.B(5.5, 5, 3, 2.3, Pp); K.px(7, 4, '#ffffff'); K.px(8, 4, '#0c0812'); K.px(4, 2 - fr, Pp[2]); return K.canvas(); });
  const moteSpr = (asp, fr) => spr('m' + asp + fr, () => { const c = document.createElement('canvas'); c.width = c.height = 9; const x = c.getContext('2d'), col = ASPCOL[asp]; x.fillStyle = col; x.globalAlpha = 0.28; x.fillRect(2, 2, 5, 5); x.fillRect(1, 3, 7, 3); x.fillRect(3, 1, 3, 7); x.globalAlpha = 1; x.fillRect(3, 3, 3, 3); x.fillRect(4, 2, 1, 5); x.fillRect(2, 4, 5, 1); if (fr) { x.globalAlpha = 0.7; x.fillRect(4, 0, 1, 9); x.fillRect(0, 4, 9, 1); x.globalAlpha = 1; } x.fillStyle = '#ffffff'; x.fillRect(4, 4, 1, 1); if (fr) x.fillRect(4, 3, 1, 3); return c; });
  const beadSpr = fr => spr('b' + fr, () => { const c = document.createElement('canvas'); c.width = 7; c.height = 8; const x = c.getContext('2d'), rows = ['...y...', '..yYy..', '.yYYYy.', 'yYwYYdy', 'yYYYddy', '.yYddy.', '..yyy..'], pal = { y: '#8a6a1c', Y: '#e8c030', w: '#fff3a0', d: '#c89a20' }; rows.forEach((r, j) => { for (let i = 0; i < 7; i++) if (pal[r[i]]) { x.fillStyle = pal[r[i]]; x.fillRect(i, j + (fr ? 1 : 0), 1, 1); } }); return c; });
  const sweepSpr = fr => spr('s' + fr, () => { const N = 56, K = Sculpt(N), c = N / 2, Pd = ['#050308', '#2a1a30', '#5a3a5e', '#160c1c'], BN = ['#1b1d2a', '#e4dfd0', '#ffffff', '#a8a294'];
    for (let k = 0; k < 10; k++) { const a = k * 0.628 + fr * 0.2; K.L([[c + Math.cos(a) * 19, c + Math.sin(a) * 19], [c + Math.cos(a) * 26, c + Math.sin(a) * 26]], 2, 0.6, BN); }
    K.B(c, c, 21, 21, Pd); K.flat(K.el(c, c, 13 + fr, 13 + fr), '#3a0810'); K.flat(K.el(c, c, 8, 8), '#0a0206');
    for (let k = 0; k < 12; k++) { const a = k * 0.5236 + fr * 0.26; K.L([[c + Math.cos(a) * 13, c + Math.sin(a) * 13], [c + Math.cos(a) * 8, c + Math.sin(a) * 8]], 1.4, 0.5, BN, null); }
    return K.canvas(); });
  // 흙 무늬 한 장과, 무더기마다 깔리는 바탕 (색을 보고 징조를 읽게)
  const soil = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#231b2b'; x.fillRect(0, 0, 64, 64); let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < 150; k++) { x.fillStyle = ['#2c2336', '#1a1422', '#352b40', '#17111e'][k % 4]; x.fillRect(Math.floor(r() * 64), Math.floor(r() * 64), 1 + Math.floor(r() * 3), 1); } for (let k = 0; k < 9; k++) { x.fillStyle = '#322838'; const px = Math.floor(r() * 60), py = Math.floor(r() * 60); x.fillRect(px, py, 3, 2); x.fillStyle = '#0f0b14'; x.fillRect(px, py + 2, 3, 1); } return c; })();
  const backdrop = c => spr('c' + c.seed, () => { const N = Math.round(c.r * 2 + 30), cv0 = document.createElement('canvas'); cv0.width = N; cv0.height = N; const x = cv0.getContext('2d'), m = N / 2; let s = c.seed + 3; const r = () => { s = (s * 16807 + 11) % 2147483647; return s / 2147483647; }, R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const blob = (rx, ry, col) => { x.fillStyle = col; for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry))) + (r() * 3 - 1)); x.fillRect(m - w, m + j, w * 2, 1); } };
    if (c.asp === 'abyss') { blob(c.r, Math.round(c.r * 0.7), '#0c1c2a'); blob(c.r * 0.72, Math.round(c.r * 0.45), '#10304a'); for (let k = 0; k < 6; k++) R(m - c.r * 0.5 + r() * c.r, m - c.r * 0.25 + r() * c.r * 0.5, 4 + r() * 6, 1, '#1f6a8a'); for (let k = 0; k < 5; k++) R(m - c.r + r() * c.r * 2, m - c.r * 0.7 + r() * 6, 1, 3, '#2a8aa8'); }
    if (c.asp === 'nebula') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#1a1430'); for (let k = 0; k < 7; k++) { const bx = m - c.r * 0.8 + r() * c.r * 1.6, by = m - c.r * 0.5 + r() * c.r, hh = 6 + r() * 10; x.fillStyle = '#3a2a70'; for (let j = 0; j < hh; j++) x.fillRect(Math.round(bx - (hh - j) * 0.22), Math.round(by - j), Math.max(1, Math.round((hh - j) * 0.44)), 1); R(bx - 1, by - hh * 0.8, 1, hh * 0.6, '#6a4ac0'); } }
    if (c.asp === 'brood') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#141e12'); for (let k = 0; k < 6; k++) { let bx = m - c.r * 0.8 + r() * c.r * 1.6, by = m - c.r * 0.6; const n = 8 + r() * 10; for (let j = 0; j < n; j++) { R(bx, by, 1, 3, '#3a4a22'); bx += r() * 4 - 2; by += 3; } R(bx - 1, by, 3, 2, '#4a7a2a'); } }
    if (c.asp === 'dusk') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#1e1410'); x.strokeStyle = '#6a4a2a'; x.lineWidth = 1; for (let k = 0; k < 7; k++) { const a = k * 0.9 + r(); x.beginPath(); x.moveTo(m + 0.5, m + 0.5); x.lineTo(Math.round(m + Math.cos(a) * c.r) + 0.5, Math.round(m + Math.sin(a) * c.r * 0.7) + 0.5); x.stroke(); } for (const q of [0.4, 0.75]) { x.beginPath(); x.ellipse(m, m, c.r * q, c.r * q * 0.7, 0, 0, 7); x.stroke(); } }
    if (c.asp === 'hunger') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#200c10'); blob(c.r * 0.5, Math.round(c.r * 0.3), '#3a1016'); for (let k = 0; k < 6; k++) { const bx = m - c.r * 0.7 + r() * c.r * 1.4, by = m - c.r * 0.4 + r() * c.r * 0.8, w = 5 + r() * 7; R(bx, by, w, 1, '#8a8474'); R(bx - 1, by - 1, 2, 3, '#a8a294'); R(bx + w - 1, by - 1, 2, 3, '#a8a294'); } }
    return cv0; });


  // 부위의 그림: 한 방울(32×32) 위에 덧그린다. 앞은 오른쪽, 뿔은 위. 단계가 오를수록 더 돋는다
  const C = { abyss: ['#081a2a', '#1f8fa8', '#9fe8f0', '#0f5a78'], nebula: ['#1a1030', '#8a5fe0', '#e0c8ff', '#4a2a9a'], brood: ['#102410', '#6fbf3f', '#d0f08a', '#2f7a2a'], dusk: ['#2a1420', '#e08a3a', '#ffe0a0', '#9a4a2a'], hunger: ['#2a0a0e', '#c8303a', '#ff9a8a', '#7a121c'] };
  const GOLDc = '#fff3a0', WH = '#ffffff', BONE = '#fbf7ea', BONE2 = '#cfc8b4', YEL = '#f0e060', MASKc = '#f5f5f5';
  const ART = {
    mouth_abyss: (q, l, f, c) => { q(20, 25, 4, 3, c[3]); q(21, 26, 2, 1, c[2]); q(24, 26, 1, 1, c[1]); if (l >= 2) { q(17, 28, 3, 2, c[3]); q(18, 28, 1, 1, c[2]); } if (l >= 3) { q(25, 25, 2, 1, c[1]); q(27, 24 + f, 1, 1, c[2]); q(25, 28, 2, 1, c[1]); q(27, 29 - f, 1, 1, c[2]); } },
    mouth_nebula: (q, l, f, c) => { q(19, 26, 4, 1, GOLDc); q(20, 27, 2, 1, c[2]); if (l >= 2) { q(18, 26, 6, 1, GOLDc); q(19, 25, 1, 1, c[1]); q(22, 25, 1, 1, c[1]); } if (l >= 3) { q(25, 24 + f, 1, 1, WH); q(17, 28 - f, 1, 1, c[2]); q(24, 27, 1, 1, GOLDc); } },
    mouth_brood: (q, l, f, c) => { q(19, 26, 4, 2, c[0]); q(20, 26, 2, 1, YEL); if (l >= 2) { q(24, 24 - f, 1, 1, c[2]); q(25, 27, 1, 1, c[1]); q(18, 25, 1, 1, c[1]); } if (l >= 3) { q(23, 22 + f, 1, 1, YEL); q(26, 25 - f, 1, 1, c[2]); q(27, 28, 1, 1, c[1]); } },
    mouth_dusk: (q, l, f, c) => { q(19, 25, 4, 3, MASKc); q(19, 25, 4, 1, '#c8c8d0'); q(20, 27, 2, 1, c[0]); if (l >= 2) { q(18, 28, 1, 2, c[1]); q(23, 28, 1, 2 + f, c[1]); } if (l >= 3) { q(24, 24 - f, 1, 1, c[2]); q(26, 23, 1, 1, c[1]); q(25, 26 + f, 1, 1, c[2]); } },
    mouth_hunger: (q, l, f, c) => { q(18, 25, 6, 3, '#2a0508'); q(18, 25, 1, 1, BONE); q(20, 25, 1, 1, BONE); q(22, 25, 1, 1, BONE); q(19, 27, 1, 1, BONE); q(21, 27, 1, 1, BONE); q(23, 27, 1, 1, BONE); if (l >= 2) { q(17, 24, 8, 1, c[3]); q(24, 25, 1, 2 + f, BONE); q(17, 28, 7, 1, c[3]); } if (l >= 3) { q(16, 25, 1, 3, c[3]); q(25, 24, 1, 1, BONE2); q(21, 29, 1, 1 + f, c[1]); q(19, 24, 1, 1, BONE2); q(22, 24, 1, 1, BONE2); } },
    eye_abyss: (q, l, f, c) => { q(16, 10, 1, 2, c[1]); q(17, 9, 2, 1, c[1]); q(19, 9, 1, 2, c[1]); q(18, 11, 3, 3, GOLDc); q(19, 12, 1, 1, WH); if (l >= 2) { q(17, 12, 1, 1, c[2]); q(21, 12, 1, 1, c[2]); q(19, 14, 1, 1, c[2]); q(19, 10 - f, 1, 1, c[2]); } if (l >= 3) { q(21, 8, 2, 1, c[1]); q(23, 7 + f, 2, 2, GOLDc); q(23, 7 + f, 1, 1, WH); } },
    eye_nebula: (q, l, f, c) => { q(14, 15, 3, 3, c[0]); q(15, 16, 1, 1, GOLDc); if (l >= 2) { q(13, 14, 1, 1, c[2]); q(17, 14, 1, 1, c[2]); q(13, 18, 1, 1, c[1]); q(17, 18, 1, 1, c[1]); } if (l >= 3) { q(14, 8 + f, 3, 3, c[0]); q(15, 9 + f, 1, 1, GOLDc); q(12, 10, 1, 1, c[2]); q(18, 10, 1, 1, c[2]); } },
    eye_brood: (q, l, f, c) => { q(13, 10, 1, 3, c[1]); q(12, 9 - f, 1, 1, c[2]); q(18, 10, 1, 3, c[1]); q(19, 9 + f - 1, 1, 1, c[2]); if (l >= 2) { q(11, 8 - f, 1, 1, YEL); q(20, 7 + f, 1, 1, YEL); q(12, 8, 1, 1, c[1]); q(19, 8, 1, 1, c[1]); } if (l >= 3) { q(16, 8, 1, 4, c[1]); q(16, 7 - f, 1, 1, YEL); q(15, 6, 1, 1, c[2]); q(17, 6, 1, 1, c[2]); } },
    eye_dusk: (q, l, f, c) => { q(12, 22, 5, 4, MASKc); q(12, 22, 5, 1, '#c8c8d0'); q(14, 23, 1, 2, c[0]); if (l >= 2) { q(11, 23, 1, 2, MASKc); q(13, 25, 1, 1, c[1]); q(16, 25, 1, 1, c[1]); } if (l >= 3) { q(17, 21, 2, 1, c[1]); q(19, 20 - f, 1, 1, c[2]); q(11, 21, 1, 1, c[1]); q(10, 20 + f, 1, 1, c[2]); } },
    eye_hunger: (q, l, f, c) => { q(13, 23, 3, 3, c[0]); q(14, 24, 1, 1, '#ff5f57'); if (l >= 2) { q(17, 21, 3, 3, c[0]); q(18, 22, 1, 1, '#ff5f57'); } if (l >= 3) { q(11, 26, 2, 2, c[0]); q(11, 26, 1, 1, '#ff5f57'); q(16, 20, 1, 1, c[1]); q(15, 19 - f, 1, 1, c[1]); } },
    leg_abyss: (q, l, f, c) => { q(8, 22, 2, 1, c[1]); q(7, 23, 3, 2, c[1]); q(6, 25 - f, 3, 1, c[2]); q(8, 26, 2, 1, c[3]); if (l >= 2) { q(18, 17, 2, 2, c[1]); q(19, 16, 1, 1, c[2]); q(5, 23, 2, 2, c[1]); } if (l >= 3) { q(3, 22 - f, 2, 4, c[1]); q(2, 23, 1, 2, c[2]); q(20, 15, 1, 2, c[2]); q(21, 17, 1, 2, c[1]); } },
    leg_nebula: (q, l, f, c) => { q(10, 30, 2, 1, GOLDc); q(21, 30, 2, 1, GOLDc); q(8, 27 + f, 1, 1, WH); if (l >= 2) { q(24, 27 - f, 1, 1, WH); q(15, 31, 2, 1, c[2]); q(7, 30, 1, 1, c[1]); q(25, 30, 1, 1, c[1]); } if (l >= 3) { q(6, 25 - f, 1, 1, GOLDc); q(26, 25 + f, 1, 1, GOLDc); q(5, 28, 1, 1, c[2]); q(27, 28, 1, 1, c[2]); q(16, 30, 1, 1, WH); } },
    leg_brood: (q, l, f, c) => { q(12, 29, 1, 3, c[1]); q(11, 31, 1, 1, c[3]); q(16, 30, 1, 2, c[1]); q(20, 29, 1, 3, c[1]); q(21, 31, 1, 1, c[3]); if (l >= 2) { q(9, 29, 1, 2, c[1]); q(8, 31, 1, 1, c[3]); q(23, 29, 1, 2, c[1]); q(24, 31, 1, 1, c[3]); } if (l >= 3) { q(7, 28, 2, 1, c[2]); q(24, 28, 2, 1, c[2]); q(14, 31, 1, 1, c[3]); q(18, 31, 1, 1, c[3]); q(6, 27 - f, 1, 1, YEL); } },
    leg_dusk: (q, l, f, c) => { q(9, 27, 1, 1, c[2]); q(7, 28, 2, 1, c[2]); q(5, 29 + f, 2, 1, c[1]); q(3, 30 + f, 2, 1, c[1]); if (l >= 2) { q(9, 24, 1, 1, c[2]); q(6, 25 - f, 3, 1, c[1]); q(4, 26 - f, 2, 1, c[3]); } if (l >= 3) { q(2, 27, 2, 1, c[2]); q(1, 31, 2, 1, c[2]); q(1, 24 + f, 3, 1, c[1]); } },
    leg_hunger: (q, l, f, c) => { q(12, 29, 2, 2, c[1]); q(11 - f, 31, 1, 1, BONE); q(13 - f, 31, 1, 1, BONE); q(19, 29, 2, 2, c[1]); q(19 + f, 31, 1, 1, BONE); q(21 + f, 31, 1, 1, BONE); if (l >= 2) { q(12, 28, 2, 1, c[3]); q(19, 28, 2, 1, c[3]); q(14, 30, 1, 1, c[3]); q(18, 30, 1, 1, c[3]); } if (l >= 3) { q(22, 28, 1, 1, BONE); q(10, 28, 1, 1, BONE); q(9, 30, 1, 1, BONE2); q(23, 30, 1, 1, BONE2); } },
    skin_abyss: (q, l, f, c) => { q(17, 22, 2, 1, c[1]); q(19, 24, 2, 1, c[1]); q(16, 25, 2, 1, c[1]); if (l >= 2) { q(13, 27, 2, 1, c[1]); q(19, 27, 2, 1, c[2]); q(12, 21, 2, 1, c[1]); } if (l >= 3) { q(18, 22, 1, 1, c[2]); q(20, 24, 1, 1, c[2]); q(17, 25, 1, 1, c[2]); q(15, 20, 2, 1, c[1]); q(21, 26, 1, 1, c[1]); } },
    skin_nebula: (q, l, f, c) => { q(20, 18, 1, 3, c[1]); q(21, 19, 1, 2, c[2]); q(18, 19, 1, 2, c[1]); if (l >= 2) { q(22, 21, 2, 1, c[1]); q(23, 20, 1, 1, c[2]); q(11, 20, 1, 2, c[1]); q(10, 21, 1, 1, c[2]); } if (l >= 3) { q(19, 16, 1, 2, c[2]); q(22, 17, 1, 1, WH); q(9, 19, 1, 1, c[2]); q(24, 22, 1, 2, c[1]); q(12, 18, 1, 2, c[1]); } },
    skin_brood: (q, l, f, c) => { q(12, 20, 3, 1, c[1]); q(13, 19, 1, 1, c[2]); q(18, 20, 3, 1, c[1]); q(19, 19, 1, 1, c[2]); if (l >= 2) { q(10, 23, 1, 2, c[1]); q(21, 22, 1, 2, c[1]); q(16, 21, 2, 1, c[3]); q(22, 25, 1, 1, c[2]); } if (l >= 3) { q(20, 18, 1, 1, YEL); q(12, 18, 1, 1, YEL); q(9, 25, 1, 2, c[1]); q(23, 27, 1, 1, c[1]); q(15, 19, 1, 1, c[2]); } },
    skin_dusk: (q, l, f, c) => { q(17, 20, 5, 1, c[2]); q(18, 21, 5, 1, c[1]); q(21, 22, 2, 4, c[1]); q(22, 26, 1, 2, c[3]); if (l >= 2) { q(23, 23, 1, 5 + f, c[1]); q(16, 19, 2, 1, c[2]); q(20, 22, 1, 3, c[3]); } if (l >= 3) { q(22, 28 + f, 1, 1, MASKc); q(24, 28, 1, 1, MASKc); q(24, 22, 1, 3, c[2]); q(14, 19, 2, 1, c[1]); } },
    skin_hunger: (q, l, f, c) => { q(19, 18, 1, 3, BONE); q(21, 20, 1, 3, BONE); q(22, 24, 2, 1, BONE); if (l >= 2) { q(17, 17, 1, 3, BONE); q(12, 18, 1, 3, BONE); q(23, 22, 1, 1, BONE2); } if (l >= 3) { q(10, 21, 1, 2, BONE); q(23, 26, 2, 1, BONE2); q(15, 16, 1, 2, BONE2); q(20, 16, 1, 2, BONE2); q(24, 20, 1, 1, BONE); } },
    core_abyss: (q, l, f, c) => { q(15, 24, 3, 3, c[1]); q(16, 24, 1, 1, c[2]); if (l >= 2) { q(15, 23, 3, 1, c[1]); q(14, 25, 1, 2, c[3]); q(18, 25, 1, 2, c[3]); } if (l >= 3) { q(21, 19 - f, 1, 1, c[2]); q(22, 17 - f, 1, 1, c[2]); q(16, 27, 2, 1, c[2]); } },
    core_nebula: (q, l, f, c) => { q(10, 18, 3, 1, '#e8c030'); q(18, 18, 4, 1, '#e8c030'); q(21, 17, 1, 1, GOLDc); q(10, 17, 1, 1, GOLDc); if (l >= 2) { q(13, 19, 5, 1, '#a87e14'); q(9 - f, 18, 1, 1, GOLDc); q(22 + f, 18, 1, 1, GOLDc); } if (l >= 3) { q(12, 14, 2, 1, '#e8c030'); q(17, 14, 2, 1, '#e8c030'); q(14, 15, 3, 1, '#a87e14'); q(19, 13, 1, 1, GOLDc); } },
    core_brood: (q, l, f, c) => { q(9, 26, 2, 2, YEL); q(9, 26, 1, 1, '#fff8b0'); if (l >= 2) { q(11, 28, 2, 1, YEL); q(7, 25, 2, 1, YEL); q(7, 25, 1, 1, '#fff8b0'); } if (l >= 3) { q(6, 27, 2, 2, YEL); q(6, 27, 1, 1, '#fff8b0'); q(9, 29, 2, 1, '#c8a820'); q(8, 23 - f, 1, 1, YEL); } },
    core_dusk: (q, l, f, c) => { q(16, 24, 4, 3, c[2]); q(16, 24, 4, 1, c[1]); q(17, 25, 2, 1, c[1]); if (l >= 2) { q(22, 25, 1, 1, c[2]); q(24, 25, 1, 1, c[1]); q(16, 27, 4, 1, c[3]); } if (l >= 3) { q(26 + f, 25, 1, 1, c[3]); q(23, 23, 1, 1, c[2]); q(23, 27, 1, 1, c[2]); q(15, 25, 1, 1, c[3]); } },
    core_hunger: (q, l, f, c) => { q(13, 27, 8, 1, '#707890'); q(14, 28, 6, 1, '#3a3e54'); q(15, 27, 2, 1, '#c0c8e0'); if (l >= 2) { q(13, 26, 1, 1, '#c0c8e0'); q(20, 26, 1, 1, '#c0c8e0'); q(12, 27, 1, 1, '#3a3e54'); q(21, 27, 1, 1, '#3a3e54'); } if (l >= 3) { q(12, 25, 1, 1, '#707890'); q(21, 25, 1, 1, '#707890'); q(17, 26, 2, 1, '#c0c8e0'); q(16, 29, 2, 1, '#707890'); } },
  };
  // 덧그림 한 장: 부위들을 칠하고, 둘레에 어두운 테를 둘러 한 방울 위에서 또렷하게 한다
  function paintParts(list, fr) {
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), q = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    for (const s of ['leg', 'core', 'skin', 'mouth', 'eye']) { const w = list[s]; if (w && ART[w.id]) ART[w.id](q, w.lv, fr, C[PART[w.id].asp]); }
    const d = x.getImageData(0, 0, 32, 32), a = d.data, src = new Uint8Array(1024); for (let i = 0; i < 1024; i++) src[i] = a[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < 32; y++) for (let xx = 0; xx < 32; xx++) { const i = y * 32 + xx; if (src[i]) continue; if ((xx > 0 && src[i - 1]) || (xx < 31 && src[i + 1]) || (y > 0 && src[i - 32]) || (y < 31 && src[i + 32])) { a[i * 4] = 12; a[i * 4 + 1] = 8; a[i * 4 + 2] = 18; a[i * 4 + 3] = 215; } }
    x.putImageData(d, 0, 0); return c;
  }
  const wornKey = () => SLOTS.map(s => { const w = S.worn[s[0]]; return w ? w.id + w.lv : '-'; }).join('|');
  const overlay = fr => spr('ov:' + wornKey() + ':' + fr, () => paintParts(S.worn, fr));
  const iconURL = (id, l) => spr('ic:' + id + (l || 2), () => { const c = document.createElement('canvas'); c.width = c.height = 28; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.globalAlpha = 0.5; x.drawImage(slimeCanvas(DROP, 0), -2, -5); x.globalAlpha = 1; const o = {}; o[PART[id].slot] = { id, lv: l || 2 }; x.drawImage(paintParts(o, 0), -2, -5); return c.toDataURL(); });

  // ---------- 덮개 ----------
  if (!document.getElementById('pro-css')) { const st = document.createElement('style'); st.id = 'pro-css'; st.textContent = PRO.css; document.head.appendChild(st); } else document.getElementById('pro-css').textContent = PRO.css;
  const root = document.createElement('div'); root.id = 'pro'; root.setAttribute('role', 'application'); root.setAttribute('aria-label', '땅속의 한 방울. 손가락이나 마우스가 가는 쪽으로 움직인다. 색 있는 알갱이를 먹고, 모은 것으로 부위를 돋우고, 큰 것은 피한다.');
  root.innerHTML = '<canvas class="pro-cv"></canvas><div class="pro-hud"><div class="pro-row" id="pro-row"></div><div class="pro-row pro-row2" id="pro-row2"></div><div class="pro-bar"><i id="pro-prog"></i></div></div><div class="pro-cap" id="pro-cap" aria-live="polite"></div><button class="pro-b pro-skip" id="pro-skip">건너뛴다</button><button class="pro-b big pro-grow" id="pro-grow">돋운다</button><button class="pro-b pri pro-settle" id="pro-settle" hidden>자리를 잡는다</button><div class="pro-shop" id="pro-shop" hidden></div>';
  document.body.appendChild(root);
  const cv0 = root.querySelector('canvas'), ctx = cv0.getContext('2d'), $p = id => root.querySelector('#' + id);
  let Z = 2, vw = 200, vh = 300, dpr = 1, cam = { x: P.x, y: P.y }, hudKey = '', raf = 0, last = 0, acc = 0, alive = true, result = null, onDone = null, sel = null, keep = null;
  function fit() { const b = root.getBoundingClientRect(); dpr = Math.min(3, window.devicePixelRatio || 1); Z = clampN(Math.round(Math.min(b.width, b.height) / 240), 2, 4); cv0.width = Math.round(b.width * dpr); cv0.height = Math.round(b.height * dpr); vw = b.width / Z; vh = b.height / Z; }
  const toWorld = e => { const b = cv0.getBoundingClientRect(); return { x: cam.x - vw / 2 + (e.clientX - b.left) / Z, y: cam.y - vh / 2 + (e.clientY - b.top) / Z }; };
  const setAim = e => { const w = toWorld(e); S.aim.x = clampN(w.x, 10, W - 10); S.aim.y = clampN(w.y, 10, H - 10); S.aim.on = true; };
  let held = false;
  const onDown = e => { e.preventDefault(); held = true; try { cv0.setPointerCapture(e.pointerId); } catch (er) { /* 괜찮다 */ } setAim(e); };
  const onMove = e => { if (held || e.pointerType === 'mouse') { e.preventDefault(); setAim(e); } };
  const onUp = () => { held = false; };
  cv0.addEventListener('pointerdown', onDown); cv0.addEventListener('pointermove', onMove); cv0.addEventListener('pointerup', onUp); cv0.addEventListener('pointercancel', onUp);
  const noScroll = e => e.preventDefault(); root.addEventListener('touchmove', noScroll, { passive: false }); root.addEventListener('contextmenu', noScroll);
  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', 'ㅁ': 'left', ArrowRight: 'right', d: 'right', D: 'right', 'ㅇ': 'right', ArrowUp: 'up', w: 'up', W: 'up', 'ㅈ': 'up', ArrowDown: 'down', s: 'down', S: 'down', 'ㄴ': 'down' };
  const onKey = e => { if (!alive) return; const k = KEYMAP[e.key]; e.stopPropagation(); if (e.type === 'keydown' && !S.ended && (e.key === ' ' || e.key === 'q' || e.key === 'Q' || e.key === 'ㅂ' || (e.key === 'Escape' && S.shop))) { e.preventDefault(); return S.shop ? closeShop() : openShop(); } if (k && !S.shop) { S.keys[k] = e.type === 'keydown'; e.preventDefault(); } else if (e.key === 'Tab') e.preventDefault(); };   // 게임 쪽 단축키가 먹지 않게 막는다
  window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKey, true); window.addEventListener('resize', fit);
  $p('pro-skip').addEventListener('click', () => end('skip')); $p('pro-grow').addEventListener('click', () => { say('click'); openShop(); });
  let sure = 0; $p('pro-settle').addEventListener('click', () => { const b = $p('pro-settle'), now = performance.now(); if (now - sure < 2600) return end('settle'); sure = now; b.textContent = '한 번 더: 자리를 잡는다'; say('click'); setTimeout(() => { if (alive && !S.ended) b.textContent = '자리를 잡는다'; }, 2600); });

  // ---------- 돋우는 창: 가로는 징조(색), 세로는 자리. 창이 떠 있는 동안 흙 속은 멈춘다 ----------
  const pipsHtml = (n, col) => `<span class="pro-lv" style="--c:${col}">${[1, 2, 3].map(k => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  function shopHtml(tip) {
    if (!sel || !PART[sel]) { const open = CAT.filter(d => !whyNot(d.id) && !(S.worn[d.slot] && S.worn[d.slot].id !== d.id)); sel = (open[0] || CAT.find(d => d.asp === home)).id; }
    const d = PART[sel], w = S.worn[d.slot], mine = w && w.id === sel ? w.lv : 0, price = priceOf(sel), why = whyNot(sel), col = ASPCOL[d.asp];
    let h = `<div class="pro-card" role="dialog" aria-label="부위를 돋운다"><div class="pro-top"><h2>돋운다<small>알갱이로 몸을 바꾼다</small></h2><button class="pro-b" data-x="close">닫는다</button></div>${tip ? `<p class="pro-mute">${tip}</p>` : ''}<div class="pro-grid"><span></span>${ASPS.map(a => `<span class="pro-gh" title="${ASPK[a]}"><i style="background:${ASPCOL[a]}"></i>${S.purse[a]}</span>`).join('')}`;
    for (const s of SLOTS) { const locked = P.size < PRO.open[s[0]]; h += `<span class="pro-gl">${s[1]}${locked ? `<small>크기 ${PRO.open[s[0]]}</small>` : ''}</span>`; for (const a of ASPS) { const id = s[0] + '_' + a, ww = S.worn[s[0]], own = ww && ww.id === id ? ww.lv : 0; h += `<button class="pro-cell${own ? ' own' : ''}${locked ? ' lock' : ''}${!whyNot(id) ? ' can' : ''}${id === sel ? ' sel' : ''}" style="--c:${ASPCOL[a]}" data-id="${id}" aria-label="${s[1]} · ${PART[id].name}${own ? ' ' + own + '단계' : ''}${locked ? ' (잠김)' : ''}"><img src="${iconURL(id)}" alt="">${pipsHtml(own, ASPCOL[a])}</button>`; } }
    const now = mine ? d.say(d.v[mine - 1], mine - 1) : null, next = mine < 3 ? d.say(d.v[mine], mine) : null, swap = w && w.id !== sel;
    h += `</div><div class="pro-det"><p><b style="color:${col}">${d.name}</b> <span class="pro-mute">${SLOTK[d.slot]} · ${ASPK[d.asp]}</span> ${pipsHtml(mine, col)}</p>${now ? `<p>지금: ${now}</p>` : ''}${next ? `<p${now ? ' class="pro-mute"' : ''}>${now ? '다음' : '돋우면'}: ${next}</p>` : ''}${swap ? `<p class="pro-warn">${SLOTK[d.slot]} 자리의 ${PART[w.id].name}${w.lv > 1 ? ' ' + w.lv + '단계' : ''}이 사라진다</p>` : ''}
      <div class="pro-brow"><span class="${why && price != null ? 'pro-warn' : 'pro-mute'}">${why || '둥지에서: ' + NEST.MUT[d.mut].name}</span><button class="pro-b pri" data-x="buy"${why ? ' disabled' : ''}>${price == null ? '다 올렸다' : (mine ? '올린다' : swap ? '갈아 끼운다' : '돋운다') + ' <span style="display:inline-block;width:8px;height:8px;background:' + col + ';border:1px solid #07050a"></span> ' + price}</button></div></div></div>`;
    return h;
  }
  function openShop(tip) { if (S.ended || S.shop) return; S.shop = true; S.shopSeen = true; held = false; S.keys = {}; const el = $p('pro-shop'); el.innerHTML = shopHtml(tip === true ? '먹은 알갱이로 부위를 돋울 수 있어. 색마다 다른 부위야. 쓰지 않고 남긴 것은 둥지의 첫 정수가 돼.' : tip); el.hidden = false; }
  function closeShop() { if (!S.shop) return; S.shop = false; $p('pro-shop').hidden = true; $p('pro-shop').innerHTML = ''; last = 0; acc = 0; hudKey = ''; }
  $p('pro-shop').addEventListener('click', e => { const c = e.target.closest('[data-id]'), b = e.target.closest('[data-x]'); if (c) { sel = c.dataset.id; say('click'); $p('pro-shop').innerHTML = shopHtml(); } else if (b && b.dataset.x === 'close') { say('click'); closeShop(); } else if (b && b.dataset.x === 'buy') { if (buy(sel)) $p('pro-shop').innerHTML = shopHtml(); } else if (e.target === $p('pro-shop')) closeShop(); });

  function hud() {
    const time = Math.floor(S.t / TPS), need = P.size < 3 ? PRO.need[P.size - 1] : 0, base = P.size >= 2 ? PRO.need[P.size - 2] : 0, mh = maxHp(), can = canAny();
    const key = [P.size, P.hp, mh, ASPS.map(a => S.purse[a]).join(','), S.gold, time, can].join('|');
    if (key !== hudKey) { hudKey = key; $p('pro-row').innerHTML = `<span class="pro-pips sz" title="몸집">${[1, 2, 3].map(k => `<i class="${k <= P.size ? 'on' : ''}"></i>`).join('')}</span><span class="pro-pips hp" title="버틸 수 있는 횟수">${Array.from({ length: mh }, (_, k) => `<i class="${k < P.hp ? 'on' : ''}"></i>`).join('')}</span><span>${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}</span><span style="color:#e8c030">진액 ${S.gold}</span>`;
      $p('pro-row2').innerHTML = `<span class="pro-ess">${ASPS.filter(a => S.purse[a] > 0).map(a => `<span><i style="background:${ASPCOL[a]}"></i>${S.purse[a]}</span>`).join('') || '<span style="color:#a59cb4">아직 모은 것이 없다</span>'}</span>`;
      $p('pro-grow').classList.toggle('can', can); }
    $p('pro-prog').style.width = (need ? clampN((S.bio - base) / (need - base), 0, 1) * 100 : 100) + '%';
    const c = S.cap, capEl = $p('pro-cap'); if (c && S.t < c.until && !S.shop) { const html = c.s + (c.sub ? '<small>' + c.sub + '</small>' : ''); if (capEl.dataset.h !== html) { capEl.dataset.h = html; capEl.innerHTML = html; } capEl.style.opacity = 1; } else capEl.style.opacity = 0;
    $p('pro-settle').hidden = !(P.size >= 2 && !S.ended); $p('pro-grow').hidden = !!S.ended;
    if (!S.shopSeen && !S.manual && !S.ended && can && S.t > 2 * TPS) openShop(true);   // 처음 살 수 있게 됐을 때 한 번은 스스로 뜬다
  }
  function draw(now) {
    const k = Z * dpr, t = S.t, fr2 = Math.floor(now / 260) % 2, fr4 = Math.floor(now / 240) % 4, pr = PRO.rad[P.size - 1], R = PRO.light[P.size - 1] * (1 + val('eye_abyss') / 100), feel = lv('eye_brood'), third = lv('eye_nebula');
    cam.x += (clampN(P.x, vw / 2 - 30, W - vw / 2 + 30) - cam.x) * 0.18; cam.y += (clampN(P.y, vh / 2 - 30, H - vh / 2 + 30) - cam.y) * 0.18;
    const sh = t - S.shake < 8 ? (Math.floor(now / 30) % 2 ? 1.5 : -1.5) : 0, ox = Math.round((cam.x - vw / 2 + sh) * k) / k, oy = Math.round((cam.y - vh / 2) * k) / k;
    ctx.setTransform(k, 0, 0, k, -ox * k, -oy * k); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#07050b'; ctx.fillRect(ox, oy, vw, vh);
    { const x0 = Math.max(0, ox), y0 = Math.max(0, oy), x1 = Math.min(W, ox + vw), y1 = Math.min(H, oy + vh); if (x1 > x0 && y1 > y0) { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); const sx = Math.floor(ox / 64) * 64, sy = Math.floor(oy / 64) * 64; for (let y = sy; y < oy + vh; y += 64) for (let x = sx; x < ox + vw; x += 64) ctx.drawImage(soil, x, y); ctx.restore(); } }
    const inView = (o, m) => o.x > ox - m && o.x < ox + vw + m && o.y > oy - m && o.y < oy + vh + m, img = (c, x, y, s) => ctx.drawImage(c, Math.round(x), Math.round(y), c.width * (s || 1), c.height * (s || 1));
    for (const c of S.clusters) if (inView(c, c.r + 20)) { const b = backdrop(c); img(b, c.x - b.width / 2, c.y - b.height / 2); }
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; for (const pts of S.roots) { ctx.beginPath(); pts.forEach((q, j) => j ? ctx.lineTo(Math.round(q[0]), Math.round(q[1])) : ctx.moveTo(Math.round(q[0]), Math.round(q[1]))); ctx.stroke(); }
    for (const n of S.silk) { ctx.fillStyle = 'rgba(255,224,160,' + Math.min(0.8, (n.until - t) / 40) + ')'; ctx.fillRect(Math.round(n.x) - 3, Math.round(n.y), 7, 1); ctx.fillRect(Math.round(n.x), Math.round(n.y) - 2, 1, 5); }
    for (const b of S.beads) if (b.alive && inView(b, 8)) img(beadSpr((fr4 + b.ph) % 4 === 0 ? 1 : 0), b.x - 3, b.y - 4);
    for (const m of S.motes) if (m.alive && inView(m, 4)) img(moteSpr(m.asp, (fr4 + m.ph) % 4 === 0 ? 1 : 0), m.x - 4, m.y - 4);
    for (const w of S.wrig) if (w.alive && inView(w, 8)) { const c = wrigSpr(w.asp, fr2); img(w.vx < 0 ? flip(c) : c, w.x - 5, w.y - 5); }
    for (const h of S.hunters) if (h.alive && inView(h, 24)) { const big = h.size > 2, c = hunterSpr(big, h.stun > 0 ? 0 : fr2), N = c.width; img(h.face < 0 ? flip(c) : c, h.x - N / 2, h.y - N / 2); if (!hostile(h)) { ctx.fillStyle = 'rgba(111,208,140,' + (fr2 ? 0.9 : 0.5) + ')'; ctx.fillRect(Math.round(h.x) - 1, Math.round(h.y - N / 2 - 5), 3, 3); } }
    { const sc = PRO.scale[P.size - 1], c = slimeCanvas(DROP, fr4), s = c.width * sc, ov = overlay(fr2); if (!(P.inv > 0 && Math.floor(now / 80) % 2)) { const px = Math.round(P.x - s / 2), py = Math.round(P.y - s + pr * 0.9 + Math.sin(now / 300) * 1); ctx.drawImage(P.face < 0 ? flip(c) : c, px, py, s, s); ctx.drawImage(P.face < 0 ? flip(ov) : ov, px, py, s, s); }
      if (lv('skin_dusk') && t >= P.veilAt) { ctx.strokeStyle = 'rgba(255,224,160,' + (fr2 ? 0.55 : 0.3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(P.x, P.y - pr * 0.4, pr + 6, 0, 7); ctx.stroke(); }
      if (lv('core_nebula')) { const a = now / 260, rr0 = val('core_nebula') * 0.5 + pr; ctx.fillStyle = '#fff3a0'; ctx.fillRect(Math.round(P.x + Math.cos(a) * rr0) - 1, Math.round(P.y - pr * 0.4 + Math.sin(a) * rr0 * 0.6) - 1, 2, 2); ctx.fillStyle = '#e8c030'; ctx.fillRect(Math.round(P.x + Math.cos(a + 3.14) * rr0) - 1, Math.round(P.y - pr * 0.4 + Math.sin(a + 3.14) * rr0 * 0.6) - 1, 2, 2); } }
    const sw = S.sweep;
    for (const f of S.fx) { const a = (t - f.t0) / TPS; if (a > 0.7) continue;
      if (f.k === 'eat') { ctx.fillStyle = ASPCOL[f.asp]; ctx.globalAlpha = 1 - a / 0.7; ctx.fillRect(Math.round(f.x + (P.x - f.x) * a / 0.7), Math.round(f.y + (P.y - f.y) * a / 0.7) - 1, 2, 2); ctx.globalAlpha = 1; }
      if (f.k === 'gold') { ctx.fillStyle = '#fff3a0'; ctx.globalAlpha = 1 - a / 0.7; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y - a * 18), 7, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y - a * 18) - 3, 1, 7); ctx.globalAlpha = 1; }
      if (f.k === 'split' || f.k === 'gulp' || f.k === 'pulse' || f.k === 'veil') { ctx.strokeStyle = f.k === 'split' ? '#fff3a0' : f.k === 'gulp' ? '#6fd08c' : '#ffe0a0'; ctx.lineWidth = f.k === 'veil' ? 1 : 2; ctx.globalAlpha = 1 - a / 0.7; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + a * (f.k === 'pulse' ? 150 : f.k === 'veil' ? 30 : 60), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (f.k === 'heal') { ctx.fillStyle = 'rgba(208,240,138,' + (1 - a / 0.7) + ')'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y - 14 - a * 16), 7, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y - 17 - a * 16), 1, 7); }
      if (f.k === 'gone') { ctx.fillStyle = 'rgba(200,48,58,' + (1 - a / 0.7) + ')'; for (let q = 0; q < 5; q++) ctx.fillRect(Math.round(f.x + Math.cos(q * 1.26) * a * 22), Math.round(f.y + Math.sin(q * 1.26) * a * 22), 2, 2); }
      if (f.k === 'nib' || f.k === 'blink') { ctx.strokeStyle = (f.k === 'blink' ? 'rgba(224,200,255,' : 'rgba(255,243,160,') + (0.8 * (1 - a / 0.7)) + ')'; ctx.lineWidth = f.k === 'blink' ? 2 : 1; ctx.beginPath(); ctx.moveTo(f.x, f.y - 4); ctx.lineTo(f.tx, f.ty - (f.k === 'blink' ? 4 : 0)); ctx.stroke(); } }
    // 어둠: 한 방울 둘레만 보인다
    { const g = ctx.createRadialGradient(P.x, P.y - pr * 0.3, R * 0.28, P.x, P.y - pr * 0.3, R); g.addColorStop(0, 'rgba(5,4,10,0)'); g.addColorStop(0.62, 'rgba(5,4,10,.42)'); g.addColorStop(1, 'rgba(5,4,10,.965)'); ctx.fillStyle = g; ctx.fillRect(ox, oy, vw, vh); }
    // 어둠 속에서도 희미하게 보이는 것: 알갱이의 빛, 진액의 빛, 굴이빨의 눈
    const far = feel ? 4 : 2.5;
    for (const m of S.motes) if (m.alive && inView(m, 2)) { const d = dist(m, P); if (d > R * 0.8 && d < R * far && (feel || (fr4 + m.ph) % 4 !== 1)) { ctx.fillStyle = ASPCOL[m.asp]; ctx.globalAlpha = feel ? 0.9 : 0.8 * (1 - (d - R * 0.8) / (R * 1.7)); ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, 2, 2); } } ctx.globalAlpha = 1;
    for (const b of S.beads) if (b.alive && inView(b, 2)) { const d = dist(b, P); if (d > R * 0.8 && (feel >= 3 || (d < R * 2 && (fr4 + b.ph) % 4 === 0))) { ctx.fillStyle = '#e8c030'; ctx.globalAlpha = 0.8; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2); ctx.globalAlpha = 1; } }
    if (feel >= 2) for (const w of S.wrig) if (w.alive && inView(w, 2) && dist(w, P) > R * 0.8) { ctx.fillStyle = '#d0f08a'; ctx.fillRect(Math.round(w.x) - 1, Math.round(w.y), 3, 1); ctx.fillRect(Math.round(w.x), Math.round(w.y) - 1, 1, 3); }
    for (const h of S.hunters) if (h.alive && inView(h, 6)) { const d = dist(h, P); if (d > R * 0.75 && hostile(h) && (third || d < R * 2.6)) { ctx.fillStyle = '#ff5f57'; ctx.globalAlpha = h.mode === 'chase' ? 1 : 0.6; ctx.fillRect(Math.round(h.x + h.face * 2) - 2, Math.round(h.y - 2), 1, 1); ctx.fillRect(Math.round(h.x + h.face * 2) + 1, Math.round(h.y - 2), 1, 1); ctx.globalAlpha = 1; if (third) { ctx.strokeStyle = 'rgba(255,95,87,' + (fr2 ? 0.75 : 0.4) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(h.x), Math.round(h.y), h.r + 3, 0, 7); ctx.stroke(); } } }
    if (sw.st === 'run') { for (let j = 7; j >= 1; j--) { const bx = sw.x - sw.dx * j * 20, by = sw.y - sw.dy * j * 20, br = 20 - j * 1.6; ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.arc(bx, by, br + 1.5, 0, 7); ctx.fill(); ctx.fillStyle = j % 2 ? '#2a1a30' : '#3a2440'; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); } const c = sweepSpr(fr2); img(c, sw.x - 28, sw.y - 28); }
    if (sw.st === 'warn') { const a = (t - sw.t0) / sw.warn, on = Math.floor(now / 140) % 2; ctx.strokeStyle = on ? 'rgba(255,95,87,.75)' : 'rgba(255,95,87,.3)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(sw.sx, sw.sy); ctx.lineTo(sw.sx + sw.dx * 1300, sw.sy + sw.dy * 1300); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,95,87,' + (0.15 + a * 0.3) + ')'; ctx.beginPath(); ctx.moveTo(sw.sx - sw.dy * 22, sw.sy + sw.dx * 22); ctx.lineTo(sw.sx - sw.dy * 22 + sw.dx * 1300, sw.sy + sw.dx * 22 + sw.dy * 1300); ctx.moveTo(sw.sx + sw.dy * 22, sw.sy - sw.dx * 22); ctx.lineTo(sw.sx + sw.dy * 22 + sw.dx * 1300, sw.sy - sw.dx * 22 + sw.dy * 1300); ctx.stroke(); }
    // 화면 밖을 가리키는 점: 먹이 무더기(가까운 셋, 더듬이가 있으면 더), 셋째눈이면 굴이빨, 더듬이 3단계면 진액
    { const topY = 104 / Z, dot = (o, col, s) => { const px = clampN(o.x, ox + 6, ox + vw - 9), py = clampN(o.y, oy + topY, oy + vh - 9); ctx.fillStyle = '#05040a'; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, s + 2, s + 2); ctx.fillStyle = col; ctx.globalAlpha = fr2 ? 1 : 0.6; ctx.fillRect(Math.round(px), Math.round(py), s, s); ctx.globalAlpha = 1; };
      const left = S.clusters.map(c => ({ c, n: 0 })); for (const m of S.motes) if (m.alive) for (const q of left) if (Math.abs(m.x - q.c.x) < q.c.r + 4 && Math.abs(m.y - q.c.y) < q.c.r + 4) { q.n++; break; }
      left.filter(q => q.n >= 3 && !inView(q.c, -6)).sort((a, b) => dist(a.c, P) - dist(b.c, P)).slice(0, feel ? 6 : 3).forEach(q => dot(q.c, ASPCOL[q.c.asp], 3));
      if (feel >= 3) S.beads.filter(b => b.alive && !inView(b, -6)).sort((a, b) => dist(a, P) - dist(b, P)).slice(0, 2).forEach(b => dot(b, '#e8c030', 2));
      if (third >= 2) S.hunters.filter(h => h.alive && hostile(h) && !inView(h, -6) && dist(h, P) < 420).forEach(h => dot(h, '#ff5f57', 4)); }
    if (t - S.flash < 9 && S.flash) { ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - (t - S.flash) / 9)) + ')'; ctx.fillRect(ox, oy, vw, vh); }
  }
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (!document.hidden && !S.manual && !S.ended && !S.shop) { acc += dt * (opts.speed || 1); let n = 0; while (acc >= 1 / TPS && n++ < 8) { acc -= 1 / TPS; tick(); } }
    try { draw(now); hud(); } catch (e) { console.error(e); }
  }

  // ---------- 끝 ----------
  const wornList = () => SLOTS.map(s => S.worn[s[0]]).filter(Boolean).map(w => ({ id: w.id, asp: PART[w.id].asp, slot: PART[w.id].slot, lv: w.lv }));
  function makeResult(kind) {
    const fell = kind === 'fell', skipped = kind === 'skip';
    if (skipped) { const e = zero(); e[home] = 12; const rest = ASPS.filter(a => a !== home); for (let k = 0; k < 6; k++) e[rest[k % rest.length]]++; return { ess: e, kin: [], gold: 60, size: 2, time: Math.round(S.t / TPS), fell: false, skipped: true, parts: [], mut: null }; }
    const e = essOf(), parts = wornList(); if (fell) ASPS.forEach(a => { e[a] = Math.floor(e[a] / 2); });
    const best = parts.slice().sort((a, b) => b.lv - a.lv)[0];
    return { ess: e, kin: [], gold: Math.min(PRO.goldCap, S.gold), size: P.size, time: Math.round(S.t / TPS), fell, skipped: false, parts, mut: fell || !best ? null : PART[keep && parts.some(p => p.id === keep) ? keep : best.id].mut };
  }
  function close() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKey, true); window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', onVis); if (root.parentNode) root.parentNode.removeChild(root); if (window.__pro === API) delete window.__pro; onDone(result); }
  function end(kind) {
    if (S.ended) return; closeShop(); S.ended = kind; result = makeResult(kind); hud(); $p('pro-settle').hidden = true; $p('pro-skip').hidden = true; $p('pro-grow').hidden = true; $p('pro-cap').style.opacity = 0;
    if (kind === 'skip') { say('click'); return close(); }
    say(kind === 'fell' ? 'down' : 'up');
    const r = result, tot = ASPS.reduce((a, k) => a + r.ess[k], 0), topA = ASPS.slice().sort((a, b) => r.ess[b] - r.ess[a])[0], mx = Math.max(1, r.ess[topA]), n = r.parts.length;
    if (!r.fell && n) keep = r.parts.slice().sort((a, b) => b.lv - a.lv)[0].id;
    const line = kind === 'fell' ? '간신히 틈에 숨었네. 남긴 걸 반은 흘렸고, 돋운 것도 허물에 새기지 못했어. 그래도 살았잖아.' : n >= 4 ? '몸을 꽤 바꿨네. 그중 하나는 허물을 벗어도 남아. 골라.' : n >= 1 ? '돋운 것 가운데 하나는 둥지까지 가져갈 수 있어.' : '아무것도 안 돋웠어? 그만큼 정수는 넉넉하겠네.';
    const lean = tot ? ' ' + ASPK[topA] + ' 빛깔을 제일 많이 남겼으니 몸이 그쪽으로 기울 거야.' : '';
    const keepHtml = () => { const k = r.parts.find(p => p.id === keep); return `<div class="pro-parts">${r.parts.map(p => `<button class="pro-keep${p.id === keep ? ' on' : ''}" data-keep="${p.id}" style="--c:${ASPCOL[p.asp]}"><img src="${iconURL(p.id, p.lv)}" alt="">${PART[p.id].name} ${pipsHtml(p.lv, ASPCOL[p.asp])}</button>`).join('')}</div>${k ? `<p>둥지에서 <b style="color:${ASPCOL[k.asp]}">${NEST.MUT[PART[k.id].mut].name}</b> — ${NEST.MUT[PART[k.id].mut].desc}</p>` : ''}`; };
    const el = document.createElement('div'); el.className = 'pro-end'; el.innerHTML = `<div class="pro-card" role="dialog" aria-label="땅속에서 얻은 것"><h2>${kind === 'fell' ? '쓰러졌다' : kind === 'time' ? '더는 버틸 수 없다' : '자리를 잡았다'}<small>${Math.floor(r.time / 60)}분 ${r.time % 60}초 · 진액 ${r.gold}방울</small></h2>
      <div class="pro-bars">${ASPS.filter(a => r.ess[a] > 0).map(a => `<span style="color:${ASPCOL[a]}">${ASPK[a]}</span><span class="b"><i style="width:${Math.round(r.ess[a] / mx * 100)}%;background:${ASPCOL[a]}"></i></span><span>${r.ess[a]}</span>`).join('') || '<span class="pro-mute" style="grid-column:1/-1">남긴 것이 없다</span>'}</div>
      <p class="pro-mute">쓰지 않고 남긴 것이 정수가 된다 · 합 ${tot}</p>
      ${r.fell ? (n ? '<p class="pro-warn">쓰러져서 돋운 부위를 허물에 새기지 못했다</p>' : '') : n ? `<p><b style="color:#e8c030;font-family:var(--display,sans-serif);font-weight:400">허물에 새길 부위 하나를 골라</b></p><div id="pro-keepbox">${keepHtml()}</div>` : '<p class="pro-mute">돋운 부위가 없다</p>'}
      <div class="pro-say"><img src="${spriteCanvas('slime', 'echo').toDataURL()}" width="40" height="40" alt=""><p><b style="color:#e8c030;font-family:var(--display,sans-serif);font-weight:400">잔향</b> ${line}${lean}</p></div>
      <button class="pro-b pri" id="pro-go">둥지를 튼다</button></div>`;
    root.appendChild(el); el.addEventListener('click', e => { const b = e.target.closest('[data-keep]'); if (b) { keep = b.dataset.keep; say('click'); el.querySelector('#pro-keepbox').innerHTML = keepHtml(); } });
    const go = el.querySelector('#pro-go'); go.addEventListener('click', () => { say('click'); if (!r.fell && keep) r.mut = PART[keep].mut; close(); }); try { go.focus(); } catch (e) { /* 괜찮다 */ }
  }
  const onVis = () => { last = 0; acc = 0; }; document.addEventListener('visibilitychange', onVis);

  // 시험용 손잡이
  const API = { get player() { return { x: P.x, y: P.y, size: P.size, hp: P.hp, maxHp: maxHp(), r: PRO.rad[P.size - 1], inv: P.inv }; }, get time() { return S.t / TPS; }, get bio() { return S.bio; }, get spent() { return S.spent; }, get splits() { return P.size - 1; }, get firstSplit() { return S.grewAt / TPS; }, get ended() { return S.ended; }, get stats() { return Object.assign({ swallowed: S.swallowed }, S.stats); },
    get motes() { return S.motes.filter(m => m.alive).map(m => ({ x: m.x, y: m.y, kind: m.asp, size: 0 })); }, get beads() { return S.beads.filter(b => b.alive).map(b => ({ x: b.x, y: b.y, kind: 'bead', size: 0 })); },
    get creatures() { const out = []; S.wrig.forEach(w => { if (w.alive) out.push({ x: w.x, y: w.y, kind: 'wriggler', size: 0.5, hostile: false }); }); S.hunters.forEach(h => { if (h.alive) out.push({ x: h.x, y: h.y, kind: 'hunter', size: h.size, hostile: hostile(h), mode: h.mode }); }); if (S.sweep.st !== 'idle') out.push({ x: S.sweep.x, y: S.sweep.y, kind: 'sweeper', size: 9, hostile: true, state: S.sweep.st, dx: S.sweep.dx, dy: S.sweep.dy }); return out; },
    get kin() { return []; }, get result() { return result || makeResult('settle'); },
    get wallet() { return Object.assign({}, S.purse); }, get parts() { const o = {}; SLOTS.forEach(s => { const w = S.worn[s[0]]; if (w) o[w.id] = w.lv; }); return o; }, get shopOpen() { return S.shop; },
    catalog: CAT.map(d => ({ id: d.id, slot: d.slot, asp: d.asp, name: d.name, cost: d.cost.slice(), mut: d.mut, openAt: PRO.open[d.slot], text: [0, 1, 2].map(k => d.say(d.v[k], k)) })),
    buy(id) { const ok = buy(id); if (ok && S.shop) $p('pro-shop').innerHTML = shopHtml(); return ok; }, why(id) { return whyNot(id); }, price(id) { return PART[id] ? priceOf(id) : null; }, openShop(tip) { openShop(tip); }, closeShop() { closeShop(); }, select(id) { if (PART[id]) { sel = id; if (S.shop) $p('pro-shop').innerHTML = shopHtml(); } },
    set manual(v) { S.manual = !!v; }, get manual() { return S.manual; },
    step(n) { for (let k = 0; k < (n || 1) && !S.ended; k++) tick(); return S.ended; }, aim(x, y) { S.aim.x = clampN(x, 10, W - 10); S.aim.y = clampN(y, 10, H - 10); S.aim.on = true; }, end(kind) { end(kind || 'settle'); }, world: { w: W, h: H }, home };
  window.__pro = API;
  return new Promise(res => { onDone = res; fit(); hud(); raf = requestAnimationFrame(loop); });
}
window.runPrologue = runPrologue;
