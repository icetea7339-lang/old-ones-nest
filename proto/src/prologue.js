// 옛 것의 둥지 — 땅속의 한 방울. 둥지를 틀기 전, 빛 없는 흙 속을 돌아다니며 먹고 자라고 갈라지는 짧은 구간.
//   runPrologue({ asp, seed, tut, speed }) → Promise<{ ess, kin, gold, size, time, fell, skipped }>
// 먹은 색이 정수가 되고, 자랄 때마다 몸이 갈라져 권속이 되고, 뿌리에 맺힌 진액을 챙긴다. 오래 머물수록 더 얻지만 더 큰 것이 온다.
// 화면은 스스로 만든 덮개(#pro) 하나. 끝나면 지운다. 시험용으로 도는 동안 window.__pro 를 내놓는다.
const PRO = {
  W: 1500, H: 1100, TPS: 30,
  need: [16, 44, 84],            // 갈라지는 몸집: 첫 분열(크기 2), 둘째 분열(크기 3), 셋째 분열
  ess: 0.42, essCap: 36, bead: 6, goldCap: 120,
  maxT: 150, sweepAt: 75,
  speed: [64, 60, 56], rad: [7, 11, 15], scale: [1, 1.5, 2], light: [88, 112, 138],
  third: { abyss: 'tangle', nebula: 'spitter', brood: 'licker', dusk: 'cultist', hunger: 'hunger' },
  css: `#pro { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 15; background: #05040a; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
#pro, #pro * { box-sizing: border-box; }
#pro canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; image-rendering: pixelated; touch-action: none; cursor: crosshair; }
.pro-hud { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 8px); left: max(12px, env(safe-area-inset-left, 0px)); right: max(12px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 5px; pointer-events: none; font-family: var(--display, sans-serif); font-size: 12px; line-height: 1.2; color: #ece6d6; text-shadow: 0 1px 0 #05040a, 0 -1px 0 #05040a, 1px 0 0 #05040a, -1px 0 0 #05040a; }
.pro-row { display: flex; align-items: center; gap: 6px 12px; flex-wrap: nowrap; white-space: nowrap; padding-right: 92px; min-height: 22px; } .pro-row2 { min-height: 16px; }
.pro-pips { display: inline-flex; gap: 3px; align-items: center; } .pro-pips i { display: block; width: 9px; height: 9px; border: 1px solid #05040a; background: #3a3344; } .pro-pips.sz i { border-radius: 50%; } .pro-pips.sz i.on { background: #dff0e0; } .pro-pips.hp i.on { background: #ff5f57; }
.pro-ess { display: inline-flex; gap: 8px; } .pro-ess span { display: inline-flex; align-items: center; gap: 3px; } .pro-ess i { display: block; width: 7px; height: 7px; border: 1px solid #05040a; }
.pro-bar { height: 5px; width: min(100%, 300px); background: #05040a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-bar i { display: block; height: 100%; background: #e8c030; }
.pro-cap { position: absolute; left: 12px; right: 12px; top: 24%; text-align: center; pointer-events: none; font-family: var(--display, sans-serif); font-size: 16px; line-height: 1.35; color: #fff3a0; text-shadow: 0 2px 0 #05040a, 0 -1px 0 #05040a, 1px 0 0 #05040a, -1px 0 0 #05040a; word-break: keep-all; transition: opacity .3s; }
.pro-cap small { display: block; font-family: var(--body, sans-serif); font-size: 13px; color: #ece6d6; margin-top: 3px; }
.pro-skip { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 6px); right: max(10px, env(safe-area-inset-right, 0px)); }
.pro-settle { position: absolute; right: max(12px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); white-space: nowrap; }
.pro-b { font-family: var(--display, sans-serif); font-size: 12px; line-height: 1.3; color: #ece6d6; background: #2a2236; border: 1px solid #07050a; padding: 8px 10px; min-height: 36px; cursor: pointer; box-shadow: inset 0 0 0 1px #4a3c58, inset 0 -4px 0 rgba(0, 0, 0, .3); }
.pro-b.pri { background: #e8c030; color: #0d0a12; padding: 10px 16px; min-height: 44px; font-size: 14px; box-shadow: inset 0 0 0 1px #fff3a0, inset 0 3px 0 #fff3a0, inset 0 -5px 0 #a87e14; }
.pro-b:focus-visible { outline: 2px solid #ece6d6; outline-offset: 2px; }
@media (min-width: 900px) { .pro-hud { font-size: 15px; } .pro-pips i { width: 12px; height: 12px; } .pro-ess i { width: 9px; height: 9px; } .pro-bar { height: 7px; width: 420px; } .pro-cap { font-size: 20px; } .pro-cap small { font-size: 15px; } .pro-b { font-size: 14px; } }
.pro-end { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(5, 4, 10, .78); }
.pro-card { width: min(100%, 440px); background: #1d1826; border: 2px solid #e8c030; box-shadow: inset 0 0 0 2px #07050a; padding: 16px; display: flex; flex-direction: column; gap: 10px; color: #ece6d6; font-family: var(--body, sans-serif); font-size: 14px; line-height: 1.45; word-break: keep-all; }
.pro-card h2 { margin: 0; font-family: var(--display, sans-serif); font-weight: 400; font-size: 20px; line-height: 1.2; } .pro-card h2 small { font-family: var(--body, sans-serif); font-size: 13px; color: #a59cb4; margin-left: 6px; }
.pro-card p { margin: 0; } .pro-mute { color: #a59cb4; font-size: 13px; }
.pro-bars { display: grid; grid-template-columns: auto 1fr auto; gap: 4px 8px; align-items: center; font-size: 13px; } .pro-bars span.b { display: block; height: 8px; background: #07050a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-bars span.b i { display: block; height: 100%; }
.pro-kin { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; font-size: 13px; } .pro-kin span { display: inline-flex; align-items: center; gap: 5px; } .pro-kin img, .pro-say img { image-rendering: pixelated; flex: none; }
.pro-say { display: flex; gap: 10px; align-items: flex-start; }
.pro-card .pro-b { align-self: flex-end; }`,
};
function runPrologue(opts) {
  opts = opts || {};
  const ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'], ASPK = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' };
  const home = ASPS.includes(opts.asp) ? opts.asp : 'abyss', TPS = PRO.TPS, W = PRO.W, H = PRO.H;
  let seed = (opts.seed >>> 0) || 1; const rnd = () => { let t = (seed = (seed + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rr = (a, b) => a + rnd() * (b - a), ri = n => Math.floor(rnd() * n), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const say = k => { try { sfx(k); } catch (e) { /* 소리는 없어도 된다 */ } };

  // ---------- 흙 속에 있는 것들 ----------
  const S = { t: 0, p: { x: 0, y: 0, vx: 0, vy: 0, size: 1, hp: 3, inv: 0, face: 1 }, aim: { x: 0, y: 0, on: false }, keys: {}, bio: 0, eat: { abyss: 0, nebula: 0, brood: 0, dusk: 0, hunger: 0 }, gold: 0, splits: 0,
    clusters: [], motes: [], wrig: [], beads: [], roots: [], hunters: [], kin: [], fx: [], cap: null, sweep: { st: 'idle', next: PRO.sweepAt * TPS, n: 0 }, ended: null, firstSplit: 0, swallowed: 0, shake: 0, flash: 0, manual: false, stats: { hits: 0, lostKin: 0 } };
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
  const dominant = () => ASPS.slice().sort((a, b) => S.eat[b] - S.eat[a] || (a === home ? -1 : b === home ? 1 : 0))[0];
  const essOf = () => { const e = {}; let tot = 0; ASPS.forEach(a => { e[a] = Math.round(S.eat[a] * PRO.ess); tot += e[a]; }); if (tot > PRO.essCap) { const k = PRO.essCap / tot; tot = 0; ASPS.forEach(a => { e[a] = Math.floor(e[a] * k); tot += e[a]; }); for (let g = 0; tot < PRO.essCap && g < 9; g++) { e[dominant()]++; tot++; } } return e; };
  const caption = (s, sub, sec) => { S.cap = { s, sub: sub || '', until: S.t + (sec || 2.6) * TPS }; };
  const feed = (asp, n, x, y) => { S.eat[asp] += n; S.bio += n; S.fx.push({ k: 'eat', x, y, t0: S.t, asp }); };
  function grow() {
    while (S.splits < 3 && S.bio >= PRO.need[S.splits]) {
      S.splits++; if (S.splits <= 2) P.size = S.splits + 1; P.hp = Math.min(3, P.hp + 1);
      const kind = S.splits === 1 ? 'goblin' : S.splits === 2 ? 'skeleton' : PRO.third[dominant()];
      S.kin.push({ kind, x: P.x - P.face * 10, y: P.y + 4, alive: true, cd: 20, born: S.t }); if (!S.firstSplit) S.firstSplit = S.t;
      S.flash = S.t; S.fx.push({ k: 'split', x: P.x, y: P.y, t0: S.t }); say('evo');
      caption(['첫 분열', '둘째 분열', '셋째 분열'][S.splits - 1] + ': ' + NEST.KIN[kind].name, S.splits === 1 ? '몸이 갈라졌다. 이제 자리를 잡아도 된다' : S.splits === 2 ? '몸이 더 커졌다. 큰 굴이빨도 삼킬 수 있다' : '더는 갈라지지 않는다', 3.2);
    }
  }
  function hurt(fromX, fromY) {
    if (P.inv > 0 || S.ended) return; P.hp--; P.inv = Math.round(1.7 * TPS); S.shake = S.t; S.stats.hits++; say('hit');
    const a = Math.atan2(P.y - fromY, P.x - fromX); P.vx = Math.cos(a) * 150; P.vy = Math.sin(a) * 150;
    const floor = S.splits ? PRO.need[S.splits - 1] : 0, lose = Math.min(4, Math.max(0, S.bio - floor));   // 흘린 것은 주워 먹을 수 있다
    for (let k = 0; k < lose; k++) { const asp = dominant(); if (S.eat[asp] <= 0) break; S.eat[asp]--; S.bio--; const b = rnd() * 6.283, d = rr(14, 30); S.motes.push({ x: clampN(P.x + Math.cos(b) * d, 20, W - 20), y: clampN(P.y + Math.sin(b) * d, 20, H - 20), asp, alive: true, ph: ri(8) }); }
    if (P.hp <= 0) end('fell'); else caption(P.hp === 1 ? '한 번 더 물리면 끝이다' : '물렸다', '먹은 것을 흘렸다', 1.8);
  }
  function loseKin(m, x, y) { m.alive = false; S.stats.lostKin++; S.fx.push({ k: 'gone', x: m.x, y: m.y, t0: S.t }); say('die'); caption(NEST.KIN[m.kind].name + '을 잃었다', '', 1.8); }
  const steer = (o, tx, ty, sp, k) => { const d = Math.hypot(tx - o.x, ty - o.y) || 1; o.vx += ((tx - o.x) / d * sp - o.vx) * (k || 0.2); o.vy += ((ty - o.y) / d * sp - o.vy) * (k || 0.2); };
  const move = (o, m) => { o.x = clampN(o.x + o.vx / TPS, m, W - m); o.y = clampN(o.y + o.vy / TPS, m, H - m); };

  function tick() {
    if (S.ended) return; S.t++; const time = S.t / TPS, pr = PRO.rad[P.size - 1];
    // 한 방울: 손가락이 가는 쪽으로 미끄러진다
    { let dx = (S.keys.right ? 1 : 0) - (S.keys.left ? 1 : 0), dy = (S.keys.down ? 1 : 0) - (S.keys.up ? 1 : 0), sp = PRO.speed[P.size - 1];
      if (dx || dy) { const d = Math.hypot(dx, dy); P.vx += (dx / d * sp - P.vx) * 0.25; P.vy += (dy / d * sp - P.vy) * 0.25; S.aim.on = false; }
      else if (S.aim.on && Math.hypot(S.aim.x - P.x, S.aim.y - P.y) > 3) steer(P, S.aim.x, S.aim.y, sp, 0.25); else { P.vx *= 0.8; P.vy *= 0.8; }
      if (P.inv > 0) P.inv--; if (Math.abs(P.vx) > 4) P.face = P.vx > 0 ? 1 : -1; move(P, 14); }
    // 먹는다
    for (const m of S.motes) if (m.alive && Math.abs(m.x - P.x) < pr + 4 && Math.abs(m.y - P.y) < pr + 4 && dist(m, P) < pr + 3) { m.alive = false; feed(m.asp, 1, m.x, m.y); if (S.t % 2 === 0) say('step'); }
    for (const b of S.beads) if (b.alive && dist(b, P) < pr + 4) { b.alive = false; S.gold = Math.min(PRO.goldCap, S.gold + PRO.bead); S.fx.push({ k: 'gold', x: b.x, y: b.y, t0: S.t }); say('coin'); }
    for (const w of S.wrig) { if (!w.alive) continue; const d = dist(w, P);
      if (d < pr + 3) { w.alive = false; feed(w.asp, 2, w.x, w.y); say('dig'); continue; }
      if (d < 64) steer(w, w.x + (w.x - P.x), w.y + (w.y - P.y), 46, 0.3); else { if (S.t % 40 === w.ph) w.a += rr(-1.2, 1.2); const tx = w.free ? w.x + Math.cos(w.a) * 30 : w.hx + Math.cos(w.a) * 34, ty = w.free ? w.y + Math.sin(w.a) * 30 : w.hy + Math.sin(w.a) * 26; steer(w, tx, ty, 14, 0.1); }
      move(w, 12); if (w.x <= 12 || w.x >= W - 12) w.a = Math.PI - w.a; if (w.y <= 12 || w.y >= H - 12) w.a = -w.a; }
    // 굴이빨: 나보다 크면 쫓아오고, 내가 더 크면 달아난다
    const kinAlive = S.kin.filter(m => m.alive);
    for (const h of S.hunters) { if (!h.alive) continue; const d = dist(h, P), hostile = h.size > P.size;
      if (h.stun > 0) { h.stun--; h.vx *= 0.85; h.vy *= 0.85; move(h, 16); continue; }
      if (hostile) {
        let tgt = null, td = 1e9; if (d < (h.mode === 'chase' ? 225 : 160) && Math.hypot(h.x - h.hx, h.y - h.hy) < 330) { tgt = P; td = d; }
        for (const m of kinAlive) { const dk = dist(h, m); if (dk < 120 && dk < td - 20) { tgt = m; td = dk; } }
        if (tgt) { if (h.mode !== 'chase') { h.mode = 'chase'; if (!h.seen) { h.seen = true; if (S.t > 3 * TPS) caption('굴이빨이다', '너보다 크다. 달아나', 2); } } steer(h, tgt.x, tgt.y, h.size > 2 ? 49 : 54, 0.12); }
        else { h.mode = 'roam'; if (S.t % 50 === 0) h.a += rr(-1.5, 1.5); steer(h, h.hx + Math.cos(h.a) * 46, h.hy + Math.sin(h.a) * 36, 16, 0.08); }
        if (d < h.r + pr - 3 && P.inv <= 0) { hurt(h.x, h.y); h.stun = Math.round(1.1 * TPS); h.vx = -h.vx; h.vy = -h.vy; }
        for (const m of kinAlive) if (m.alive && S.t - m.born > 2 * TPS && dist(h, m) < h.r + 4) { loseKin(m); h.stun = Math.round(1.6 * TPS); }
      } else {
        if (d < h.r + pr - 2) { h.alive = false; const n = h.size > 2 ? 9 : 5; feed(h.asp, n, h.x, h.y); S.swallowed++; S.fx.push({ k: 'gulp', x: h.x, y: h.y, t0: S.t }); say('trap'); if (S.swallowed === 1) caption('굴이빨을 삼켰다', '쫓던 것이 먹이가 됐다', 2.4); continue; }
        if (d < 120) { h.mode = 'flee'; steer(h, h.x + (h.x - P.x), h.y + (h.y - P.y), h.size > 2 ? 40 : 44, 0.15); } else { h.mode = 'roam'; if (S.t % 50 === 0) h.a += rr(-1.5, 1.5); steer(h, h.x + Math.cos(h.a) * 30, h.y + Math.sin(h.a) * 30, 14, 0.08); }
      }
      if (Math.abs(h.vx) > 3) h.face = h.vx > 0 ? 1 : -1; move(h, 18); }
    // 갈라져 나온 것들: 뒤를 따르며 가까운 알갱이를 주워 먹는다
    { let lead = P, gap = pr + 9; for (const m of S.kin) { if (!m.alive) continue; const d = dist(m, lead); if (d > gap) { const k = Math.min(1, (d - gap) / d) * 0.22; m.x += (lead.x - m.x) * k; m.y += (lead.y - m.y) * k; } m.face = lead.x >= m.x ? 1 : -1;
        if (--m.cd <= 0) { let best = null, bd = 34; for (const q of S.motes) if (q.alive) { const dq = dist(q, m); if (dq < bd) { bd = dq; best = q; } } if (best) { best.alive = false; feed(best.asp, 1, best.x, best.y); S.fx.push({ k: 'nib', x: m.x, y: m.y, tx: best.x, ty: best.y, t0: S.t }); m.cd = Math.round(2 * TPS); } else m.cd = 8; }
        lead = m; gap = 15; } }
    // 깊은 것: 먹을 수 없다. 오래 머물면 온다
    { const sw = S.sweep;
      if (sw.st === 'idle' && S.t >= sw.next) { const a = rnd() * 6.283, far = 520; sw.sx = P.x + Math.cos(a) * far; sw.sy = P.y + Math.sin(a) * far; const lead = 0.9; sw.tx = P.x + P.vx * lead; sw.ty = P.y + P.vy * lead; const d = Math.hypot(sw.tx - sw.sx, sw.ty - sw.sy) || 1; sw.dx = (sw.tx - sw.sx) / d; sw.dy = (sw.ty - sw.sy) / d; sw.x = sw.sx; sw.y = sw.sy; sw.st = 'warn'; sw.t0 = S.t; sw.n++; say('down'); caption(sw.n === 1 ? '땅이 울린다' : '또 온다', sw.n === 1 ? '깊은 것이 지나간다. 길에서 비켜라' : '', 2.2); }
      else if (sw.st === 'warn' && S.t - sw.t0 >= 2.3 * TPS) { sw.st = 'run'; sw.t0 = S.t; }
      else if (sw.st === 'run') { const sp = 150 + Math.min(40, sw.n * 6); sw.x += sw.dx * sp / TPS; sw.y += sw.dy * sp / TPS; S.shake = S.t;
        if (dist(sw, P) < 24 + pr - 4 && P.inv <= 0) hurt(sw.x - sw.dx * 10, sw.y - sw.dy * 10);
        for (const m of S.kin) if (m.alive && dist(sw, m) < 24) loseKin(m); for (const h of S.hunters) if (h.alive && dist(sw, h) < 26) { h.alive = false; S.fx.push({ k: 'gone', x: h.x, y: h.y, t0: S.t }); }
        if ((S.t - sw.t0) / TPS * sp > 1100) { sw.st = 'idle'; sw.next = S.t + Math.round(Math.max(5.5, 10 - sw.n) * TPS); } } }
    grow();
    if (opts.tut && !S.ended) { if (S.t === 1) caption('손가락이 가는 쪽으로 움직여', '', 3.4); if (S.t === 4 * TPS) caption('색 있는 알갱이를 먹어', '색마다 다른 징조가 된다', 3.4); if (S.t === 8 * TPS) caption('큰 것은 피해', '더 커지면 네가 먹어', 3.4); }
    else if (S.t === 1) caption('땅속의 한 방울', '먹고, 자라고, 갈라져라', 3);
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

  // ---------- 덮개 ----------
  if (!document.getElementById('pro-css')) { const st = document.createElement('style'); st.id = 'pro-css'; st.textContent = PRO.css; document.head.appendChild(st); }
  const root = document.createElement('div'); root.id = 'pro'; root.setAttribute('role', 'application'); root.setAttribute('aria-label', '땅속의 한 방울. 손가락이나 마우스가 가는 쪽으로 움직인다. 색 있는 알갱이를 먹고 큰 것은 피한다.');
  root.innerHTML = '<canvas></canvas><div class="pro-hud"><div class="pro-row" id="pro-row"></div><div class="pro-row pro-row2" id="pro-row2"></div><div class="pro-bar"><i id="pro-prog"></i></div></div><div class="pro-cap" id="pro-cap" aria-live="polite"></div><button class="pro-b pro-skip" id="pro-skip">건너뛴다</button><button class="pro-b pri pro-settle" id="pro-settle" hidden>자리를 잡는다</button>';
  document.body.appendChild(root);
  const cv0 = root.querySelector('canvas'), ctx = cv0.getContext('2d'), $p = id => root.querySelector('#' + id);
  let Z = 2, vw = 200, vh = 300, dpr = 1, cam = { x: P.x, y: P.y }, hudKey = '', raf = 0, last = 0, acc = 0, alive = true, result = null, onDone = null;
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
  const onKey = e => { if (!alive) return; const k = KEYMAP[e.key]; e.stopPropagation(); if (k) { S.keys[k] = e.type === 'keydown'; e.preventDefault(); } else if (e.key === 'Tab') e.preventDefault(); };   // 게임 쪽 단축키가 먹지 않게 막는다
  window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKey, true); window.addEventListener('resize', fit);
  $p('pro-skip').addEventListener('click', () => end('skip')); let sure = 0; $p('pro-settle').addEventListener('click', () => { const b = $p('pro-settle'), now = performance.now(); if (now - sure < 2600) return end('settle'); sure = now; b.textContent = '한 번 더: 자리를 잡는다'; say('click'); setTimeout(() => { if (alive && !S.ended) b.textContent = '자리를 잡는다'; }, 2600); });

  function hud() {
    const e = essOf(), time = Math.floor(S.t / TPS), need = S.splits < 3 ? PRO.need[S.splits] : 0, base = S.splits ? PRO.need[S.splits - 1] : 0;
    const key = [P.size, P.hp, ASPS.map(a => e[a]).join(','), S.gold, time, S.kin.filter(m => m.alive).length].join('|');
    if (key !== hudKey) { hudKey = key; $p('pro-row').innerHTML = `<span class="pro-pips sz" title="몸집">${[1, 2, 3].map(k => `<i class="${k <= P.size ? 'on' : ''}"></i>`).join('')}</span><span class="pro-pips hp" title="버틸 수 있는 횟수">${[1, 2, 3].map(k => `<i class="${k <= P.hp ? 'on' : ''}"></i>`).join('')}</span><span>${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}</span><span style="color:#e8c030">진액 ${S.gold}</span>`;
      $p('pro-row2').innerHTML = `<span class="pro-ess">${ASPS.filter(a => e[a] > 0).map(a => `<span><i style="background:${ASPCOL[a]}"></i>${e[a]}</span>`).join('') || '<span style="color:#a59cb4">아직 먹은 것이 없다</span>'}</span>`; }
    $p('pro-prog').style.width = (need ? clampN((S.bio - base) / (need - base), 0, 1) * 100 : 100) + '%';
    const c = S.cap, capEl = $p('pro-cap'); if (c && S.t < c.until) { const html = c.s + (c.sub ? '<small>' + c.sub + '</small>' : ''); if (capEl.dataset.h !== html) { capEl.dataset.h = html; capEl.innerHTML = html; } capEl.style.opacity = 1; } else capEl.style.opacity = 0;
    $p('pro-settle').hidden = !(S.splits >= 1 && !S.ended);
  }
  function draw(now) {
    const k = Z * dpr, t = S.t, fr2 = Math.floor(now / 260) % 2, fr4 = Math.floor(now / 240) % 4, pr = PRO.rad[P.size - 1], R = PRO.light[P.size - 1];
    cam.x += (clampN(P.x, vw / 2 - 30, W - vw / 2 + 30) - cam.x) * 0.18; cam.y += (clampN(P.y, vh / 2 - 30, H - vh / 2 + 30) - cam.y) * 0.18;
    const sh = t - S.shake < 8 ? (Math.floor(now / 30) % 2 ? 1.5 : -1.5) : 0, ox = Math.round((cam.x - vw / 2 + sh) * k) / k, oy = Math.round((cam.y - vh / 2) * k) / k;
    ctx.setTransform(k, 0, 0, k, -ox * k, -oy * k); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#07050b'; ctx.fillRect(ox, oy, vw, vh);
    { const x0 = Math.max(0, ox), y0 = Math.max(0, oy), x1 = Math.min(W, ox + vw), y1 = Math.min(H, oy + vh); if (x1 > x0 && y1 > y0) { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); const sx = Math.floor(ox / 64) * 64, sy = Math.floor(oy / 64) * 64; for (let y = sy; y < oy + vh; y += 64) for (let x = sx; x < ox + vw; x += 64) ctx.drawImage(soil, x, y); ctx.restore(); } }
    const inView = (o, m) => o.x > ox - m && o.x < ox + vw + m && o.y > oy - m && o.y < oy + vh + m, img = (c, x, y, s) => ctx.drawImage(c, Math.round(x), Math.round(y), c.width * (s || 1), c.height * (s || 1));
    for (const c of S.clusters) if (inView(c, c.r + 20)) { const b = backdrop(c); img(b, c.x - b.width / 2, c.y - b.height / 2); }
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; for (const pts of S.roots) { ctx.beginPath(); pts.forEach((q, j) => j ? ctx.lineTo(Math.round(q[0]), Math.round(q[1])) : ctx.moveTo(Math.round(q[0]), Math.round(q[1]))); ctx.stroke(); }
    for (const b of S.beads) if (b.alive && inView(b, 8)) img(beadSpr((fr4 + b.ph) % 4 === 0 ? 1 : 0), b.x - 3, b.y - 4);
    for (const m of S.motes) if (m.alive && inView(m, 4)) img(moteSpr(m.asp, (fr4 + m.ph) % 4 === 0 ? 1 : 0), m.x - 4, m.y - 4);
    for (const w of S.wrig) if (w.alive && inView(w, 8)) { const c = wrigSpr(w.asp, fr2); img(w.vx < 0 ? flip(c) : c, w.x - 5, w.y - 5); }
    for (const m of S.kin) if (m.alive) { const c = frameOf(kinCanvas(m.kind), fr2); img(m.face < 0 ? flip(c) : c, m.x - 8, m.y - 10); }
    for (const h of S.hunters) if (h.alive && inView(h, 24)) { const big = h.size > 2, c = hunterSpr(big, h.stun > 0 ? 0 : fr2), N = c.width; img(h.face < 0 ? flip(c) : c, h.x - N / 2, h.y - N / 2); if (h.size <= P.size) { ctx.fillStyle = 'rgba(111,208,140,' + (fr2 ? 0.9 : 0.5) + ')'; ctx.fillRect(Math.round(h.x) - 1, Math.round(h.y - N / 2 - 5), 3, 3); } }
    { const sc = PRO.scale[P.size - 1], c = slimeCanvas(DROP, fr4), s = c.width * sc; if (!(P.inv > 0 && Math.floor(now / 80) % 2)) { const f = P.face < 0 ? flip(c) : c; ctx.drawImage(f, Math.round(P.x - s / 2), Math.round(P.y - s + pr * 0.9 + Math.sin(now / 300) * 1), s, s); } }
    const sw = S.sweep;
    for (const f of S.fx) { const a = (t - f.t0) / TPS; if (a > 0.7) continue;
      if (f.k === 'eat') { ctx.fillStyle = ASPCOL[f.asp]; ctx.globalAlpha = 1 - a / 0.7; ctx.fillRect(Math.round(f.x + (P.x - f.x) * a / 0.7), Math.round(f.y + (P.y - f.y) * a / 0.7) - 1, 2, 2); ctx.globalAlpha = 1; }
      if (f.k === 'gold') { ctx.fillStyle = '#fff3a0'; ctx.globalAlpha = 1 - a / 0.7; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y - a * 18), 7, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y - a * 18) - 3, 1, 7); ctx.globalAlpha = 1; }
      if (f.k === 'split' || f.k === 'gulp') { ctx.strokeStyle = f.k === 'split' ? '#fff3a0' : '#6fd08c'; ctx.lineWidth = 2; ctx.globalAlpha = 1 - a / 0.7; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + a * 60, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (f.k === 'gone') { ctx.fillStyle = 'rgba(200,48,58,' + (1 - a / 0.7) + ')'; for (let q = 0; q < 5; q++) ctx.fillRect(Math.round(f.x + Math.cos(q * 1.26) * a * 22), Math.round(f.y + Math.sin(q * 1.26) * a * 22), 2, 2); }
      if (f.k === 'nib') { ctx.strokeStyle = 'rgba(223,240,224,' + (0.7 * (1 - a / 0.7)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(f.x, f.y - 4); ctx.lineTo(f.tx, f.ty); ctx.stroke(); } }
    // 어둠: 한 방울 둘레만 보인다
    { const g = ctx.createRadialGradient(P.x, P.y - pr * 0.3, R * 0.28, P.x, P.y - pr * 0.3, R); g.addColorStop(0, 'rgba(5,4,10,0)'); g.addColorStop(0.62, 'rgba(5,4,10,.42)'); g.addColorStop(1, 'rgba(5,4,10,.965)'); ctx.fillStyle = g; ctx.fillRect(ox, oy, vw, vh); }
    // 어둠 속에서도 희미하게 보이는 것: 알갱이의 빛, 진액의 빛, 굴이빨의 눈
    for (const m of S.motes) if (m.alive && inView(m, 2)) { const d = dist(m, P); if (d > R * 0.8 && d < R * 2.5 && (fr4 + m.ph) % 4 !== 1) { ctx.fillStyle = ASPCOL[m.asp]; ctx.globalAlpha = 0.8 * (1 - (d - R * 0.8) / (R * 1.7)); ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, 2, 2); } } ctx.globalAlpha = 1;
    for (const b of S.beads) if (b.alive && inView(b, 2)) { const d = dist(b, P); if (d > R * 0.8 && d < R * 2 && (fr4 + b.ph) % 4 === 0) { ctx.fillStyle = '#e8c030'; ctx.globalAlpha = 0.8; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2); ctx.globalAlpha = 1; } }
    for (const h of S.hunters) if (h.alive && inView(h, 6)) { const d = dist(h, P); if (d > R * 0.75 && d < R * 2.6 && h.size > P.size) { ctx.fillStyle = '#ff5f57'; ctx.globalAlpha = h.mode === 'chase' ? 1 : 0.6; ctx.fillRect(Math.round(h.x + h.face * 2) - 2, Math.round(h.y - 2), 1, 1); ctx.fillRect(Math.round(h.x + h.face * 2) + 1, Math.round(h.y - 2), 1, 1); ctx.globalAlpha = 1; } }
    if (sw.st === 'run') { for (let j = 7; j >= 1; j--) { const bx = sw.x - sw.dx * j * 20, by = sw.y - sw.dy * j * 20, br = 20 - j * 1.6; ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.arc(bx, by, br + 1.5, 0, 7); ctx.fill(); ctx.fillStyle = j % 2 ? '#2a1a30' : '#3a2440'; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); } const c = sweepSpr(fr2); img(c, sw.x - 28, sw.y - 28); }
    if (sw.st === 'warn') { const a = (t - sw.t0) / (2.3 * TPS), on = Math.floor(now / 140) % 2; ctx.strokeStyle = on ? 'rgba(255,95,87,.75)' : 'rgba(255,95,87,.3)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(sw.sx, sw.sy); ctx.lineTo(sw.sx + sw.dx * 1300, sw.sy + sw.dy * 1300); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,95,87,' + (0.15 + a * 0.3) + ')'; ctx.beginPath(); ctx.moveTo(sw.sx - sw.dy * 22, sw.sy + sw.dx * 22); ctx.lineTo(sw.sx - sw.dy * 22 + sw.dx * 1300, sw.sy + sw.dx * 22 + sw.dy * 1300); ctx.moveTo(sw.sx + sw.dy * 22, sw.sy - sw.dx * 22); ctx.lineTo(sw.sx + sw.dy * 22 + sw.dx * 1300, sw.sy - sw.dx * 22 + sw.dy * 1300); ctx.stroke(); }
    // 화면 밖의 먹이 무더기 쪽을 가리키는 점 (가까운 셋)
    { const left = S.clusters.map(c => ({ c, n: 0 })); for (const m of S.motes) if (m.alive) for (const q of left) if (Math.abs(m.x - q.c.x) < q.c.r + 4 && Math.abs(m.y - q.c.y) < q.c.r + 4) { q.n++; break; }
      left.filter(q => q.n >= 3 && !inView(q.c, -6)).sort((a, b) => dist(a.c, P) - dist(b.c, P)).slice(0, 3).forEach(q => { const top = 104 / Z, px = clampN(q.c.x, ox + 6, ox + vw - 9), py = clampN(q.c.y, oy + top, oy + vh - 9); ctx.fillStyle = '#05040a'; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 5, 5); ctx.fillStyle = ASPCOL[q.c.asp]; ctx.globalAlpha = fr2 ? 1 : 0.6; ctx.fillRect(Math.round(px), Math.round(py), 3, 3); ctx.globalAlpha = 1; }); }
    if (t - S.flash < 9 && S.flash) { ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - (t - S.flash) / 9)) + ')'; ctx.fillRect(ox, oy, vw, vh); }
  }
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (!document.hidden && !S.manual && !S.ended) { acc += dt * (opts.speed || 1); let n = 0; while (acc >= 1 / TPS && n++ < 8) { acc -= 1 / TPS; tick(); } }
    try { draw(now); hud(); } catch (e) { console.error(e); }
  }

  // ---------- 끝 ----------
  function makeResult(kind) {
    const fell = kind === 'fell', skipped = kind === 'skip';
    if (skipped) { const e = { abyss: 0, nebula: 0, brood: 0, dusk: 0, hunger: 0 }; e[home] = 12; const rest = ASPS.filter(a => a !== home); for (let k = 0; k < 6; k++) e[rest[k % rest.length]]++; return { ess: e, kin: ['goblin', 'skeleton'], gold: 60, size: 2, time: Math.round(S.t / TPS), fell: false, skipped: true }; }
    const e = essOf(), kin = S.kin.filter(m => m.alive).map(m => m.kind); if (fell) { ASPS.forEach(a => { e[a] = Math.floor(e[a] / 2); }); kin.pop(); }
    return { ess: e, kin, gold: Math.min(PRO.goldCap, S.gold), size: P.size, time: Math.round(S.t / TPS), fell, skipped: false };
  }
  function close() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKey, true); window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', onVis); if (root.parentNode) root.parentNode.removeChild(root); if (window.__pro === API) delete window.__pro; onDone(result); }
  function end(kind) {
    if (S.ended) return; S.ended = kind; result = makeResult(kind); hud(); $p('pro-settle').hidden = true; $p('pro-skip').hidden = true; $p('pro-cap').style.opacity = 0;
    if (kind === 'skip') { say('click'); return close(); }
    say(kind === 'fell' ? 'down' : 'up');
    const r = result, tot = ASPS.reduce((a, k) => a + r.ess[k], 0), top = ASPS.slice().sort((a, b) => r.ess[b] - r.ess[a])[0], mx = Math.max(1, r.ess[top]);
    const line = kind === 'fell' ? '간신히 틈에 숨었네. 먹은 걸 반은 흘렸어. 그래도 살았잖아.' : r.kin.length >= 3 ? '셋이나 갈라졌어? 욕심도 많다. 좋아, 그 욕심으로 둥지를 틀자.' : r.kin.length === 2 ? '둘이면 넉넉해. 이제 자리를 잡고 위를 노려.' : r.kin.length === 1 ? '하나라도 갈라졌으면 됐어. 나머지는 둥지에서 돋우면 돼.' : '혼자네. 괜찮아, 나머지는 둥지에서 돋우면 돼.';
    const lean = tot ? ' ' + ASPK[top] + ' 맛을 제일 많이 봤으니 몸이 그쪽으로 기울 거야.' : '';
    const el = document.createElement('div'); el.className = 'pro-end'; el.innerHTML = `<div class="pro-card" role="dialog" aria-label="땅속에서 얻은 것"><h2>${kind === 'fell' ? '쓰러졌다' : kind === 'time' ? '더는 버틸 수 없다' : '자리를 잡았다'}<small>${Math.floor(r.time / 60)}분 ${r.time % 60}초</small></h2>
      <div class="pro-bars">${ASPS.filter(a => r.ess[a] > 0).map(a => `<span style="color:${ASPCOL[a]}">${ASPK[a]}</span><span class="b"><i style="width:${Math.round(r.ess[a] / mx * 100)}%;background:${ASPCOL[a]}"></i></span><span>${r.ess[a]}</span>`).join('') || '<span class="pro-mute" style="grid-column:1/-1">아무것도 먹지 못했다</span>'}</div>
      <p class="pro-mute">먹은 것은 정수가 된다 · 합 ${tot}</p>
      <div class="pro-kin">${r.kin.map(k => `<span><img src="${kinCanvas(k).toDataURL()}" width="32" height="32" alt="">${NEST.KIN[k].name}</span>`).join('') || '<span class="pro-mute">갈라져 나온 권속이 없다</span>'}<span>진액 ${r.gold}방울</span></div>
      <div class="pro-say"><img src="${spriteCanvas('slime', 'echo').toDataURL()}" width="40" height="40" alt=""><p><b style="color:#e8c030;font-family:var(--display,sans-serif);font-weight:400">잔향</b> ${line}${lean}</p></div>
      <button class="pro-b pri" id="pro-go">둥지를 튼다</button></div>`;
    root.appendChild(el); const go = el.querySelector('#pro-go'); go.addEventListener('click', () => { say('click'); close(); }); try { go.focus(); } catch (e) { /* 괜찮다 */ }
  }
  const onVis = () => { last = 0; acc = 0; }; document.addEventListener('visibilitychange', onVis);

  // 시험용 손잡이
  const API = { get player() { return { x: P.x, y: P.y, size: P.size, hp: P.hp, r: PRO.rad[P.size - 1], inv: P.inv }; }, get time() { return S.t / TPS; }, get bio() { return S.bio; }, get splits() { return S.splits; }, get firstSplit() { return S.firstSplit / TPS; }, get ended() { return S.ended; }, get stats() { return Object.assign({ swallowed: S.swallowed }, S.stats); },
    get motes() { return S.motes.filter(m => m.alive).map(m => ({ x: m.x, y: m.y, kind: m.asp, size: 0 })); }, get beads() { return S.beads.filter(b => b.alive).map(b => ({ x: b.x, y: b.y, kind: 'bead', size: 0 })); },
    get creatures() { const out = []; S.wrig.forEach(w => { if (w.alive) out.push({ x: w.x, y: w.y, kind: 'wriggler', size: 0.5, hostile: false }); }); S.hunters.forEach(h => { if (h.alive) out.push({ x: h.x, y: h.y, kind: 'hunter', size: h.size, hostile: h.size > P.size, mode: h.mode }); }); if (S.sweep.st !== 'idle') out.push({ x: S.sweep.x, y: S.sweep.y, kind: 'sweeper', size: 9, hostile: true, state: S.sweep.st, dx: S.sweep.dx, dy: S.sweep.dy }); return out; },
    get kin() { return S.kin.filter(m => m.alive).map(m => ({ x: m.x, y: m.y, kind: m.kind })); }, get result() { return result || makeResult('settle'); },
    set manual(v) { S.manual = !!v; }, get manual() { return S.manual; },
    step(n) { for (let k = 0; k < (n || 1) && !S.ended; k++) tick(); return S.ended; }, aim(x, y) { S.aim.x = clampN(x, 10, W - 10); S.aim.y = clampN(y, 10, H - 10); S.aim.on = true; }, end(kind) { end(kind || 'settle'); }, world: { w: W, h: H } };
  window.__pro = API;
  return new Promise(res => { onDone = res; fit(); hud(); raf = requestAnimationFrame(loop); });
}
window.runPrologue = runPrologue;
