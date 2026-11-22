// 옛 것의 둥지 — 둥지 전투(롤토체스 방식)의 그림. 전부 새 디자인.
// 정지 그림이 아니다: 유닛은 조각(몸통·머리·팔다리·촉수·껍데기·주머니·무기)으로 나뉘고, 조각마다 축이 있어 프레임마다 옮기고 돌리고 늘인다.
// 조각은 조각 도구(Sculpt, monsters.js)로 그린다. 돌릴 때 번지지 않게 점 단위로 다시 찍어 프레임을 만들고, 만든 프레임은 간직한다.
//   LAIRART.unit(id, star)  → { size, draw(ctx, x, y, anim, t, opts) }   x = 가운데, y = 발 닿는 땅, t = 그 움직임이 시작된 뒤 지난 ms
//       anim: idle move attack cast hit die mad (LAIRART.ANIM[anim].dur = 길이 ms). opts: { scale, flip, mad, flash, tint: '#rrggbb', alpha }
//       id: 권속 12 + spawn(새끼) infected(감염체), 침입자 12. seeker 의 star 1·2·3 = 미쳐 가는 단계
//       새 권속: gulp orbit bell ink hollow preach rift queen, 불려 나오는 것 brute
//   LAIRART.boss(form, step) → 본체 (drop abyss nebula brood dusk hunger). 쓰는 법은 unit 과 같다
//       step 을 안 주면 그 모습 그대로(80 점). step 0 = drop, 1 = 다섯 모습, 2 = 더 크고 빛이 더한 것(90 점), 3 = 다 깨어난 새 모습(96 점)
//       초상은 icon('boss:' + form) 또는 icon('boss:' + form + ':' + step, 1, px). prewarm 도 'boss:form:step' 을 받는다
//   LAIRART.icon(id, star, px) → 얼굴 그림 canvas.   LAIRART.prewarm(ids, star) → 프레임을 미리 만든다
//   LAIRART.fx(name, ctx, from, to, t01, opts{ px, size(칸 크기), r, col, n, w, targets }) — from·to = { x, y } 화면 좌표. 이름은 LAIRART.FX 의 키
//   LAIRART.num(ctx, x, y, text, kind, t01, px)   kind: dmg crit san heal mad block gold
//   LAIRART.bar(ctx, x, y, w, hp01, san01|null, { side: 'inv'|'kin', mana, shield, px })
//   LAIRART.tile(side, col, row, S) / wallTop(S, cols, t) / entrance(S, t) / room(id, S, k, len, t) / sym(id, px) (성향 다섯 + guard hunter caller mother)
// 괴물은 차고 젖은 빛깔에 어긋난 몸, 침입자는 따뜻한 횃불빛. 윤곽 한 점, 빛은 왼쪽 위.
const LAIRART = (() => {
  const PAD = 16, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, ease = k => k * k * (3 - 2 * k);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const hsh = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // ---------- 빛깔: [윤곽, 몸, 밝은 곳, 그늘, 포인트] ----------
  const INK = '#0c0812', VOID = '#07050c', TOOTH = '#fbf7ea', TOOTH2 = '#cfc8b4', GUM = '#5a0f1e', MAWC = '#1c0509';
  const P = {
    abyss: ['#06141c', '#1f8f8a', '#8fe8d8', '#0f5560', '#e8d48a'], abyss2: ['#06141c', '#2a6a8a', '#8ac8e8', '#143a58', '#e8d48a'],
    nebula: ['#120a26', '#6a4fc8', '#cdbcff', '#3a2580', '#fff3a0'], nebula2: ['#120a26', '#9a6ad8', '#f0d8ff', '#5a3090', '#fff3a0'],
    brood: ['#0c1c0c', '#5a9a34', '#c0e878', '#2c5c24', '#f0e060'], brood2: ['#14200c', '#8aa83a', '#e0f090', '#4a6420', '#f0e060'],
    dusk: ['#140a12', '#4a3048', '#8a6a80', '#2a1830', '#f0a04a'], dusk2: ['#1a0c10', '#7a4a3a', '#c08a60', '#4a2a28', '#f0a04a'],
    hunger: ['#22060a', '#b02a34', '#f08a7a', '#6a121c', '#fbf7ea'], hunger2: ['#22060a', '#7a1a26', '#c8505a', '#460c16', '#fbf7ea'],
    flesh: ['#1a1018', '#b8a8a0', '#e8dcd0', '#7a6a6c'], bone: ['#1b1d2a', '#e4dfd0', '#ffffff', '#a8a294'], shell: ['#1a1408', '#c8b070', '#f8ecb8', '#7a6638'],
    egg: ['#2a3010', '#d8e8a0', '#f8ffd8', '#98a860'], shadow: ['#07050c', '#241a2c', '#4a3a58', '#120c1a'], ichor: ['#06141c', '#143a40', '#2a6a68', '#0a2228'],
    skin: ['#2a1410', '#e0a878', '#f8d0a0', '#a86a48'], skin2: ['#2a1410', '#c88a60', '#e8b088', '#8a5438'], hair: ['#1a0e08', '#5a3a20', '#8a6038', '#34200e'], hairG: ['#1b1d2a', '#b0b0b8', '#e0e0e8', '#70707c'],
    steel: ['#1b1d2a', '#8a92a8', '#dce4f4', '#4a5068'], gold: ['#3a2a10', '#e8c030', '#fff3a0', '#a87e14'], wood: ['#1c1008', '#8a5a30', '#c08a50', '#4a3018'],
    tan: ['#2a1c10', '#b89868', '#e0c898', '#7a6040'], brown: ['#221408', '#7a5030', '#a87848', '#48301a'], green: ['#101c10', '#4a7a3a', '#8ab060', '#2a4a24'],
    white: ['#2a2018', '#e8e0d0', '#ffffff', '#b0a490'], red: ['#2a080c', '#a8242c', '#e06050', '#62101a'], blue: ['#0c1024', '#3a4a9a', '#7a8ad8', '#20285c'],
    leather: ['#140c0a', '#4a342c', '#7a5a48', '#2a1c18'], purple: ['#1a0a24', '#6a3a8a', '#a878c8', '#3a1e50'], coat: ['#12100c', '#5a4a38', '#8a7658', '#32281e'],
  };
  const deepOf = p => mixh(p[3], p[0], 0.5);
  // ---------- 그리는 틀: 48 눈금으로 적으면 별 단계에 맞게 커진다 ----------
  function kit(S, DS) {
    const C = S + PAD * 2, u = S / (DS || 48), K = Sculpt(C), X = v => PAD + v * u, s = v => v * u, pts = a => a.map(q => [X(q[0]), X(q[1])]), r1 = v => Math.max(0.5, s(v));
    return { K, u, S, C,
      B: (cx, cy, rx, ry, p, oc) => K.B(X(cx), X(cy), r1(rx), r1(ry), p, oc), L: (a, r0, rb, p, oc) => K.L(pts(a), r1(r0), r1(rb), p, oc), G: (a, p, oc) => K.G(pts(a), p, oc),
      el: (cx, cy, rx, ry, m) => K.el(X(cx), X(cy), r1(rx), r1(ry), m), path: (a, r0, rb, m) => K.path(pts(a), r1(r0), r1(rb), m), poly: (a, m) => K.poly(pts(a), m),
      ball: (m, cx, cy, rx, ry, p, oc) => K.ball(m, X(cx), X(cy), r1(rx), r1(ry), p, oc), lit: (m, p, oc) => K.lit(m, p, oc), flat: (m, c, oc) => K.flat(m, c, oc), cut: (m, fn) => K.cut(m, (x, y) => fn((x - PAD) / u, (y - PAD) / u)),
      shade: (m, fn, oc) => K.commit(m, (x, y) => fn((x - PAD) / u, (y - PAD) / u, x, y), oc),
      eye: (cx, cy, r, iris, slit, lid) => K.eye(X(cx), X(cy), Math.max(1, s(r)), iris, slit, lid),
      fangs: (x0, x1, y, dir, len, step, col) => K.fangs(Math.round(X(x0)), Math.round(X(x1)), Math.round(X(y)), dir, Math.max(1, Math.round(s(len))), Math.max(2, Math.round(s(step || 2))), col),
      px: (x, y, c) => K.px(X(x), X(y), c), dot: (x, y, c) => { const n = Math.max(1, Math.round(u)); K.rect(Math.round(X(x)), Math.round(X(y)), n, n, c); },
      rect: (x, y, w, h, c) => K.rect(Math.round(X(x)), Math.round(X(y)), Math.max(1, Math.round(s(w))), Math.max(1, Math.round(s(h))), c), spark: (x, y, c, on) => K.spark(Math.round(X(x)), Math.round(X(y)), c, on) };
  }
  // ---------- 뼈대 ----------
  const tf = () => ({ dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, m: 0 });
  function Rig(id, S, st, side, DS) {
    const R = { id, S, st, side, DS: DS || 48, C: S + PAD * 2, u: S / (DS || 48), parts: [], eyes: [], ground: (DS || 48) - 3, cx: (DS || 48) / 2, die: side === 'inv' ? 'fall' : 'melt', ichor: '#143a40', glow: '#fff3a0', shw: 11, frames: {}, pose: null };
    // 조각 하나. o: px py(축, 눈금), z, role(body head sway pulse float orbit leg arm), ph(어긋남), amp, parent, strike reach jaw cast morph
    R.part = (name, o, draw) => { R.parts.push(Object.assign({ name, z: R.parts.length, px: R.cx, py: R.ground, role: null, ph: 0, amp: 1, parent: null, draw, cache: {} }, o)); return R; };
    return R;
  }
  function partPix(R, p, m) {
    const q = p.morph ? Math.round(clamp(m, 0, 1) * 4) : 0; if (p.cache[q]) return p.cache[q];
    const D = kit(R.S, R.DS); p.draw(D, q / 4); const C = R.C, px = new Uint32Array(D.K.canvas().getContext('2d').getImageData(0, 0, C, C).data.buffer);
    let x0 = C, y0 = C, x1 = -1, y1 = -1; for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (px[y * C + x] >>> 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return (p.cache[q] = { px, x0, y0, x1, y1 });
  }
  const mat = (t, px, py) => { const co = cos(t.rot), si = sin(t.rot), a = co * t.sx, b = si * t.sx, c = -si * t.sy, d = co * t.sy; return [a, b, c, d, px + t.dx - a * px - c * py, py + t.dy - b * px - d * py]; };
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const inv = m => { const det = m[0] * m[3] - m[1] * m[2] || 1e-6, a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det; return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])]; };
  const over = (dst, src) => { const a = src >>> 24; if (a === 255 || !(dst >>> 24)) return src; const k = a / 255, f = sh => Math.round(((src >>> sh) & 255) * k + ((dst >>> sh) & 255) * (1 - k)); return ((Math.max(a, dst >>> 24) << 24) | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0; };
  function blit(out, C, src, M) {
    if (src.x1 < 0) return; const I = inv(M); let bx0 = C, by0 = C, bx1 = -1, by1 = -1;
    for (const [x, y] of [[src.x0, src.y0], [src.x1 + 1, src.y0], [src.x0, src.y1 + 1], [src.x1 + 1, src.y1 + 1]]) { const tx = M[0] * x + M[2] * y + M[4], ty = M[1] * x + M[3] * y + M[5]; bx0 = Math.min(bx0, tx); bx1 = Math.max(bx1, tx); by0 = Math.min(by0, ty); by1 = Math.max(by1, ty); }
    bx0 = Math.max(0, Math.floor(bx0)); by0 = Math.max(0, Math.floor(by0)); bx1 = Math.min(C - 1, Math.ceil(bx1)); by1 = Math.min(C - 1, Math.ceil(by1));
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const sx = Math.floor(I[0] * (x + 0.5) + I[2] * (y + 0.5) + I[4]), sy = Math.floor(I[1] * (x + 0.5) + I[3] * (y + 0.5) + I[5]); if (sx < src.x0 || sy < src.y0 || sx > src.x1 || sy > src.y1) continue; const c = src.px[sy * C + sx]; if (c >>> 24) out[y * C + x] = over(out[y * C + x], c); }
  }
  // ---------- 움직임 ----------
  const ANIM = { idle: { n: 8, dur: 1200, loop: true }, move: { n: 6, dur: 520, loop: true }, attack: { n: 8, dur: 460 }, cast: { n: 8, dur: 720 }, hit: { n: 4, dur: 260 }, die: { n: 10, dur: 850 }, mad: { n: 6, dur: 620, loop: true } };
  // 공격의 기울기: 뒤로 젖혔다가(-1) 내지르고(+1) 돌아온다
  const lean = f => f < 0.32 ? -ease(f / 0.32) : f < 0.5 ? lerp(-1, 1, ease((f - 0.32) / 0.18)) : lerp(1, 0, ease((f - 0.5) / 0.5));
  // 쏘는 것: 앞으로 내지르지 않는다. 제자리에서 당기고(chg) 놓은 뒤 뒤로 밀린다(rec)
  const SHOOT = { gazer: 1, hood: 1, brood: 1, mother: 1, archer: 1, priest: 1, mage: 1, bard: 1, seeker: 1 };
  const chgOf = f => f < 0.32 ? ease(f / 0.32) : f < 0.41 ? 1 : Math.max(0, 1 - (f - 0.41) / 0.12), recOf = f => f < 0.41 ? 0 : f < 0.5 ? (f - 0.41) / 0.09 : 1 - ease((f - 0.5) / 0.5);
  function pose(R, anim, f) {
    const G = tf(), T = {}, fx = { flash: 0, melt: 0, puddle: 0, fade: 0, glow: 0, mad: anim === 'mad' ? 1 : 0 }, u = R.u, base = anim === 'idle' || anim === 'mad' || anim === 'cast' ? 1 : anim === 'move' ? 0.7 : 0.35;
    const sh = anim === 'attack' && SHOOT[R.id] ? 1 : 0, chg = sh ? chgOf(f) : 0, rec = sh ? recOf(f) : 0, L = anim === 'attack' && !sh ? lean(f) : 0, rise = anim === 'cast' ? sin(Math.min(1, f * 1.15) * Math.PI) : 0, ds = anim === 'die' ? ease(Math.min(1, f / 0.6)) : 0, hr = anim === 'hit' ? (f < 0.25 ? f / 0.25 : 1 - ease((f - 0.25) / 0.75)) : 0;
    for (const p of R.parts) {
      const t = T[p.name] = tf(), a = p.amp, ph = f * TAU * (p.sp || 1) + p.ph, k = base * (anim === 'mad' ? 1.6 : 1);
      if (p.role === 'body') { t.sy = 1 + 0.052 * a * sin(ph) * k; t.sx = 1 - 0.03 * a * sin(ph) * k; }
      else if (p.role === 'head') { t.dy = 1.1 * a * u * sin(ph - 0.7) * k; t.rot = 0.045 * a * sin(ph) * k; }
      else if (p.role === 'sway') t.rot = 0.16 * a * sin(ph) * k;
      else if (p.role === 'pulse') { const s = 1 + 0.08 * a * sin(ph) * k; t.sx = s; t.sy = s; }
      else if (p.role === 'float') { t.dy = 1.7 * a * u * sin(ph) * k; t.rot = 0.04 * a * cos(ph) * k; }
      else if (p.role === 'orbit') { t.dx = 3.2 * a * u * cos(ph); t.dy = 1.3 * a * u * sin(ph); }
      else if (p.role === 'leg') t.rot = 0.02 * sin(ph);
      if (p.blink) t.m = ((f + p.ph / TAU) % 1) > 0.86 && (anim === 'idle' || anim === 'mad') ? 1 : 0;
      if (anim === 'move') { if (p.role === 'leg') t.rot = 0.5 * a * sin(f * TAU + p.ph); if (p.role === 'arm') t.rot = -0.3 * a * sin(f * TAU + p.ph); if (p.role === 'sway') t.rot = 0.2 * a * sin(ph) - 0.12; }
      if (anim === 'attack') {
        if (sh) { if (p.cast) t.rot += p.cast * (0.8 * chg - 0.3 * rec); if (p.role === 'pulse') { t.sx *= 1 + 0.55 * chg; t.sy *= 1 + 0.55 * chg; } }
        else if (p.strike) t.rot += p.strike * (f < 0.32 ? -0.75 * ease(f / 0.32) : f < 0.5 ? lerp(-0.75, 0.95, ease((f - 0.32) / 0.18)) : lerp(0.95, 0, ease((f - 0.5) / 0.5)));
        if (p.reach) { t.sx *= 1 + p.reach * Math.max(0, L); t.dx += (p.thrust || 0) * u * L; }
        if (p.jaw) t.rot += p.jaw * (f < 0.32 ? ease(f / 0.32) : f < 0.46 ? lerp(1, -0.12, (f - 0.32) / 0.14) : lerp(-0.12, 0, (f - 0.46) / 0.54));
        if (p.morph && p.bite) t.m = f < 0.32 ? ease(f / 0.32) : f < 0.46 ? 1 - (f - 0.32) / 0.14 : 0;
      }
      if (anim === 'cast') { if (p.cast) t.rot += p.cast * rise; if (p.lift) t.dy -= p.lift * u * rise; if (p.morph && p.flare) t.m = rise; if (p.role === 'pulse') { t.sx *= 1 + 0.12 * rise; t.sy *= 1 + 0.12 * rise; } }
      if (anim === 'die' && R.die === 'melt') { if (p.role === 'sway' || p.role === 'arm' || p.role === 'float' || p.role === 'orbit') { t.rot += 0.55 * ds * (p.ph % 2 > 1 ? -1 : 1); t.dy += 5 * u * ds; } if (p.role === 'head') t.dy += 4 * u * ds; }
      if (anim === 'die' && R.die === 'fall' && p.drop) { t.dy += 9 * u * ease(Math.min(1, f / 0.5)); t.rot += 1.2 * ds; }
      if (anim === 'mad') { if (p.role === 'head') t.rot += 0.2 * sin(f * TAU * 2); if (p.role === 'arm') t.rot += 0.25 * sin(f * TAU * 2 + p.ph); }
    }
    if (anim === 'move') { G.dy = -Math.abs(sin(f * TAU)) * 2.2 * u; G.rot = 0.05; }
    if (sh) { G.dx = -(1.2 * chg + 3.4 * rec) * u; G.rot = -0.05 * chg - 0.07 * rec; G.sy = 1 + 0.03 * chg - 0.03 * rec; }
    else if (anim === 'attack') { G.rot = 0.13 * L; G.dx = (L < 0 ? 3 : 7) * u * L; G.sx = 1 + 0.07 * Math.max(0, L); G.sy = 1 - 0.06 * Math.max(0, -L) - 0.03 * Math.max(0, L); }
    if (anim === 'cast') { G.dy = -2.2 * u * rise; G.sy = 1 + 0.05 * rise; G.sx = 1 - 0.02 * rise; fx.glow = rise; }
    if (anim === 'hit') { G.dx = -3.5 * u * hr; G.rot = -0.15 * hr; G.sy = 1 - 0.07 * hr; fx.flash = f < 0.3 ? 1 : 0; }
    if (anim === 'die') { if (R.die === 'melt') { G.sy = lerp(1, 0.2, ds); G.sx = lerp(1, 1.32, ds); fx.melt = clamp((f - 0.3) / 0.6, 0, 1); fx.puddle = ease(Math.min(1, f / 0.8)); if (f < 0.12) fx.flash = 1; } else { G.rot = -1.5 * ease(Math.min(1, f / 0.5)); G.dy = -1.5 * u * sin(Math.min(1, f / 0.5) * Math.PI); G.dx = -4 * u * ds; fx.fade = clamp((f - 0.68) / 0.3, 0, 1); if (f < 0.12) fx.flash = 1; } }
    if (anim === 'mad') G.dx = ((Math.round(f * 6) * 7) % 3 - 1) * 0.8 * u;
    if (R.pose) R.pose(anim, f, G, T, fx, { L, rise, ds, hr, chg, rec, u });
    return { G, T, fx };
  }
  // 미친 빛깔: 살빛이 식고 보라가 낀다
  const madPix = c => { const a = c >>> 24, b = (c >>> 16) & 255, g = (c >>> 8) & 255, r = c & 255, l = (r * 3 + g * 5 + b * 2) / 10; if (l < 40) return c; const nr = Math.round(lerp(r, l * 0.85 + 30, 0.55)), ng = Math.round(lerp(g, l * 0.9, 0.5)), nb = Math.round(lerp(b, l * 0.9 + 60, 0.6)); return ((a << 24) | (Math.min(255, nb) << 16) | (ng << 8) | Math.min(255, nr)) >>> 0; };
  function renderFrame(R, anim, fi, variant) {
    const A = ANIM[anim], f = A.loop ? fi / A.n : fi / (A.n - 1), { G, T, fx } = pose(R, anim, f), C = R.C, u = R.u, out = new Uint32Array(C * C), X = v => PAD + v * u, gy = Math.round(X(R.ground)), gcx = X(R.cx);
    const Gm = mat(G, gcx, X(R.ground)), M = {}, parts = R.parts.slice().sort((a, b) => a.z - b.z);
    const matOf = p => { if (M[p.name]) return M[p.name]; const own = mat(T[p.name], X(p.px), X(p.py)), par = p.parent ? R.parts.find(q => q.name === p.parent) : null; return (M[p.name] = mul(par ? matOf(par) : Gm, own)); };
    // 그림자와 웅덩이
    const shw = R.shw * u * (anim === 'die' && R.die === 'fall' ? 1 - fx.fade : 1) * (1 + (anim === 'move' ? G.dy / (20 * u) : 0)); for (let y = -2; y <= 1; y++) for (let x = Math.round(-shw); x <= shw; x++) { const d = (x / shw) * (x / shw) + (y / 1.8) * (y / 1.8); if (d <= 1) { const i = (gy + y) * C + Math.round(gcx + x); if (i >= 0 && i < out.length) out[i] = 0x6a0a0405; } }
    if (fx.puddle > 0) { const pw = R.shw * u * 1.25 * fx.puddle, c1 = C32(R.ichor), c2 = C32(mixh(R.ichor, '#ffffff', 0.25)), c0 = C32(mixh(R.ichor, '#000000', 0.45)); for (let y = -3; y <= 2; y++) for (let x = Math.round(-pw - 1); x <= pw + 1; x++) { const d = (x / pw) * (x / pw) + (y / 2.4) * (y / 2.4), i = (gy + y) * C + Math.round(gcx + x); if (i < 0 || i >= out.length) continue; if (d <= 1) out[i] = d < 0.25 && y < 0 ? c2 : c1; else if (d <= 1.5 && pw > 2) out[i] = c0; } }
    // 시전: 발밑의 문양 (몸 뒤)
    if (fx.glow > 0.05) { const gc = C32(R.glow), gd = C32(mixh(R.glow, '#000000', 0.45)), rw = R.shw * u * (0.7 + 0.6 * fx.glow), n = Math.ceil(rw * 7); for (const [m, ry, dash] of [[1, 3, 1], [0.62, 1.8, 0]]) for (let k = 0; k < n; k++) { if (dash && ((k + fi * 3) % 7) > 4) continue; const an = k / n * TAU, xx = Math.round(gcx + cos(an) * rw * m), yy = Math.round(gy - 1 + sin(an) * ry * u * 0.8), i2 = yy * C + xx; if (xx >= 0 && xx < C && yy >= 0 && yy < C) { out[i2] = sin(an) < 0 ? gd : gc; } } }
    // 내지르는 순간: 바로 앞 자세를 성기게 남긴다
    if (anim === 'attack' && f > 0.38 && f < 0.58) { const q = pose(R, anim, Math.max(0, f - 0.09)), g0 = mat(q.G, gcx, X(R.ground)), M2 = {}, m2 = p => M2[p.name] || (M2[p.name] = mul(p.parent ? m2(R.parts.find(z => z.name === p.parent)) : g0, mat(q.T[p.name], X(p.px), X(p.py)))), tmp = new Uint32Array(C * C); for (const p of parts) blit(tmp, C, partPix(R, p, q.T[p.name].m), m2(p)); for (let i2 = 0; i2 < tmp.length; i2++) { const c = tmp[i2]; if (c >>> 24 === 255 && ((i2 % C) + Math.floor(i2 / C)) % 2 === 0) out[i2] = c; } }
    for (const p of parts) blit(out, C, partPix(R, p, T[p.name].m), matOf(p));
    // 젖은 테두리: 빛 받는 쪽(왼쪽 위) 윤곽을 안쪽 살빛으로 밝힌다. 어두운 바닥에서 몸이 떠 보인다
    if (R.side === 'kin') { const lum = c => ((c & 255) * 3 + ((c >>> 8) & 255) * 5 + ((c >>> 16) & 255) * 2) / 10, hot = []; for (let y = 1; y < C - 1; y++) for (let x = 1; x < C - 1; x++) { const i2 = y * C + x, c = out[i2]; if (c >>> 24 !== 255 || lum(c) > 46) continue; if ((out[i2 - 1] >>> 24) === 255 && (out[i2 - C] >>> 24) === 255) continue; let best = 0, bl = 0; for (const d of [1, C, C + 1]) { const n = out[i2 + d]; if (n >>> 24 === 255 && lum(n) > bl) { bl = lum(n); best = n; } } if (bl > 60) hot.push([i2, best]); }
      for (const [i2, n] of hot) out[i2] = (0xff000000 | (Math.min(255, (((n >>> 16) & 255) * 0.62 + 70) | 0) << 16) | (Math.min(255, (((n >>> 8) & 255) * 0.62 + 62) | 0) << 8) | Math.min(255, ((n & 255) * 0.62 + 40) | 0)) >>> 0; }
    // 시전: 테두리가 빛나고 점이 떠오른다
    if (fx.glow > 0.4) { const gc = C32(R.glow), hot = []; for (let y = 1; y < C - 1; y++) for (let x = 1; x < C - 1; x++) { const i2 = y * C + x; if (out[i2] >>> 24 === 255 && y < gy - 1 && ((out[i2 - 1] >>> 24) < 255 || (out[i2 + 1] >>> 24) < 255 || (out[i2 - C] >>> 24) < 255 || (out[i2 + C] >>> 24) < 255)) hot.push(i2); } for (const i2 of hot) out[i2] = gc; }
    if (fx.glow > 0.05) { const gc = C32(R.glow); for (let k = 0; k < 8; k++) { const xx = Math.round(gcx + (hsh(k, 3) - 0.5) * R.S * 0.95), ph = (hsh(k, 5) + f * 1.2) % 1, yy = Math.round(gy - 2 - ph * R.S * 0.9), i2 = yy * C + xx; if (xx > 1 && xx < C - 1 && yy > 1 && yy < C - 1 && ph < fx.glow + 0.2) { out[i2] = k % 3 ? gc : 0xffffffff; if (k % 4 === 0) { out[i2 - 1] = gc; out[i2 + 1] = gc; out[i2 - C] = gc; out[i2 + C] = gc; } } } }
    // 미친 눈 (눈 자리에 소용돌이)
    if (fx.mad || variant === 'mad') { for (let i = 0; i < out.length; i++) if (out[i] >>> 24 === 255) out[i] = madPix(out[i]); for (const e of R.eyes) { const p = R.parts.find(q => q.name === e[0]), m = matOf(p), ex = Math.round(m[0] * X(e[1]) + m[2] * X(e[2]) + m[4]), ey = Math.round(m[1] * X(e[1]) + m[3] * X(e[2]) + m[5]), k = (fi % 4); const sw = [[0, 0, 0xffffffff], [[1, 0], [0, 1], [-1, 0], [0, -1]][k].concat(0xfff070e8), [[-1, 0], [0, -1], [1, 0], [0, 1]][k].concat(0xff8a2ac8)]; for (const [dx, dy, c] of sw) { const i = (ey + dy) * C + ex + dx; if (i >= 0 && i < out.length) out[i] = c; } } }
    if (fx.flash || variant === 'flash') for (let i = 0; i < out.length; i++) if (out[i] >>> 24 === 255) out[i] = 0xffffffff;
    if (variant && variant[0] === '#') { const tc = C32(variant), tr = tc & 255, tg = (tc >>> 8) & 255, tb = (tc >>> 16) & 255; for (let i = 0; i < out.length; i++) { const c = out[i]; if (c >>> 24 === 255) out[i] = (0xff000000 | (Math.round((((c >>> 16) & 255) + tb) / 2) << 16) | (Math.round((((c >>> 8) & 255) + tg) / 2) << 8) | Math.round(((c & 255) + tr) / 2)) >>> 0; } }
    if (fx.melt > 0) for (let y = 0; y < gy - 2; y++) for (let x = 0; x < C; x++) { const i = y * C + x; if (out[i] >>> 24 && hsh(x, y) < fx.melt * 1.15) out[i] = 0; }
    if (fx.fade > 0) for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) { const i = y * C + x; if (out[i] >>> 24 && hsh(x, y) < fx.fade * 1.1) out[i] = 0; }
    const cv = mk(C); cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(out.buffer), C, C), 0, 0); return cv;
  }
  const frame = (R, anim, fi, variant) => { const k = anim + ':' + fi + ':' + (variant || ''); return R.frames[k] || (R.frames[k] = renderFrame(R, anim, fi, variant)); };
  function handle(R) {
    return { id: R.id, size: R.S, rig: R, w: R.C, pad: PAD, anims: ANIM,
      frame: (anim, t, o) => { const A = ANIM[anim] || ANIM.idle, f = A.loop ? ((t / A.dur) % 1 + 1) % 1 : clamp(t / A.dur, 0, 0.9999); return frame(R, ANIM[anim] ? anim : 'idle', Math.floor(f * A.n), o && (o.flash ? 'flash' : o.mad ? 'mad' : o.tint) || ''); },
      draw(ctx, x, y, anim, t, o) { o = o || {}; const cv = this.frame(anim, t || 0, o), sc = o.scale || 1, gx = R.C / 2, gy = PAD + R.ground * R.u; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y)); ctx.scale(o.flip ? -sc : sc, sc); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.drawImage(cv, -gx, -gy); ctx.restore(); } };
  }
  const DEF = {}, BOSS = {}, cache = {};
  const SIZE = [0, 48, 56, 64];
  function unit(id, star) { const st = clamp(star || 1, 1, 3), k = id + ':' + st; if (cache[k]) return cache[k]; const d = DEF[id]; if (!d) return null; const S = d.size ? d.size(st) : (d.side === 'inv' ? 48 : SIZE[st]), R = Rig(id, S, st, d.side || 'kin', d.ds); d.build(R, st); return (cache[k] = handle(R)); }
  // 본체. step 을 안 주면 그 모습 그대로(예전처럼). step 0 = 떨어진 한 방울, 1 = 다섯 모습, 2 = 더 크고 빛이 더한 것, 3 = 다 깨어난 새 모습(BOSS3)
  function boss(form, step) {
    if (step === 0) form = 'drop'; if (!BOSS[form]) form = 'abyss'; if (form === 'drop' || !(step >= 2)) step = 1; step = Math.min(3, step);
    const k = 'boss:' + form + (step > 1 ? ':' + step : ''); if (cache[k]) return cache[k]; let R;
    if (step === 3 && BOSS3[form]) { R = Rig('boss3_' + form, 96, 3, 'kin', 96); BOSS3[form](R); awake(R, 3); }
    else { R = Rig('boss_' + form, step === 2 ? 90 : 80, 3, 'kin', 80); BOSS[form](R); if (step === 2) awake(R, 2); }
    return (cache[k] = handle(R));
  }
  function icon(id, star, px) { const k = 'ic:' + id + ':' + star + ':' + px; if (cache[k]) return cache[k]; const bf = typeof id === 'string' && id.indexOf('boss:') === 0 ? id.slice(5).split(':') : null, h = bf ? boss(bf[0], bf[1] === undefined ? undefined : +bf[1]) : (unit(id, star) || (BOSS[id] ? boss(id) : null)); if (!h) return mk(px); const src = h.frame('idle', 0), C = h.w, d = src.getContext('2d').getImageData(0, 0, C, C).data; let x0 = C, y0 = C, x1 = 0, y1 = 0; for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (d[(y * C + x) * 4 + 3] > 200) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } const w = x1 - x0 + 1, hh = y1 - y0 + 1, sc = Math.min(px / w, px / hh), k2 = sc >= 1 ? Math.floor(sc) : sc, c = mk(px), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, x0, y0, w, hh, Math.round((px - w * k2) / 2), Math.round(px - hh * k2 - (px - hh * k2) * 0.3), Math.round(w * k2), Math.round(hh * k2)); return (cache[k] = c); }
  // ---------- 권속 ----------
  // 비늘지기: 한쪽 팔이 통째로 따개비 덮인 등딱지. 웅크린 몸, 젖은 청록
  DEF.shell = { build(R, st) {
    const p = P.abyss, sh = P.shell, big = st >= 2 ? 1.5 : 0, cr = st >= 3;
    R.ichor = '#143a40'; R.shw = 12; R.eyes = [['head', 31, 16.4]];
    R.part('crest', { px: 20, py: 24, z: 0, role: 'sway', amp: 0.5, parent: 'body' }, D => { const n = st + 2; for (let k = 0; k < n; k++) { const x = 12 + k * (9 / n), h = 5 + st * 1.5 - Math.abs(k - n / 2) * 0.8; D.G([[x, 26 - k * 0.6], [x + 1.2, 26 - k * 0.6 - h], [x + 3.4, 25 - k * 0.6]], [p[0], p[2], '#e8fff8', p[1]]); } });
    if (st >= 2) R.part('tail', { px: 16, py: 37, z: 0, role: 'sway', amp: 0.8, ph: 1.2 }, D => { D.L([[17, 37], [11, 40], [6, 38 - st]], 2.6, 0.8, p); D.G([[6, 39 - st], [3, 35 - st], [8, 36 - st]], [p[0], p[2], '#e8fff8', p[1]]); });
    if (cr) R.part('coral', { px: 17, py: 24, z: 0, role: 'sway', amp: 0.4, ph: 2, parent: 'body' }, D => { for (const [ox, oy, ex, ey] of [[15, 24, 11.6, 16], [19, 22, 20, 13.6]]) { D.L([[ox, oy], [ex, ey]], 1.2, 0.6, P.hunger); D.L([[lerp(ox, ex, 0.5), lerp(oy, ey, 0.5)], [ex + 2.6, ey + 2]], 0.8, 0.5, P.hunger); D.L([[lerp(ox, ex, 0.7), lerp(oy, ey, 0.7)], [ex - 2.4, ey + 1.6]], 0.7, 0.5, P.hunger); } });
    R.part('legB', { px: 20, py: 37, z: 1, role: 'leg', ph: Math.PI }, D => { D.L([[20, 36], [18.5, 41], [19, 44]], 3, 2.2, [p[0], p[3], p[1], deepOf(p)]); D.G([[16, 45], [18, 42.5], [22.5, 45]], [p[0], p[3], p[1], deepOf(p)]); });
    R.part('armB', { px: 19, py: 28, z: 2, role: 'arm', ph: 2, parent: 'body' }, D => { D.L([[19, 28], [15, 32], [17, 36]], 2, 1.2, [p[0], p[3], p[1], deepOf(p)]); D.px(16, 37, sh[2]); D.px(18, 37.5, sh[2]); });
    R.part('body', { px: 23, py: 39, z: 3, role: 'body' }, D => {
      D.B(22.5, 30, 8.5, 9, p); D.shade(D.el(25, 33.5, 5, 4.6), (x, y) => (Math.round(x * D.u) + Math.round(y * D.u)) % 3 ? '#a8e0c8' : '#d8fff0', null);
      for (const [x, y] of [[16, 27], [18, 31], [15.5, 33], [20, 24.5], [17, 23.5], [21, 35.5], [14.5, 29.5]]) { D.px(x, y, p[3]); D.px(x + 1, y + 0.8, p[3]); D.px(x + 0.2, y - 0.8, p[2]); }
      if (st >= 2) D.B(18, 22.5, 3.4, 2.8, sh); if (st >= 2) D.px(18, 22.5, sh[3]);
    });
    R.part('legF', { px: 26, py: 37, z: 4, role: 'leg' }, D => { D.L([[26, 36], [27.5, 41], [27, 44]], 3.1, 2.3, p); D.G([[24.5, 45], [27, 42.5], [32, 45]], p); D.px(31, 44.4, sh[2]); D.px(29, 44.4, sh[2]); });
    R.part('head', { px: 27, py: 24, z: 6, role: 'head', parent: 'body', strike: -0.2 }, D => { const f = [p[0], '#2aa69a', '#b8f4e4', p[1]]; D.L([[25.6, 25], [29, 20]], 3.6, 3.2, p); D.B(31.6, 17.6, 6, 4.8, f); D.G([[34.6, 16.6], [41, 19.4], [40, 21.6], [34, 22.4]], f); D.flat(D.path([[33.6, 20.8], [37, 21.4], [40, 20.4]], 0.9, 0.6), VOID); D.fangs(34, 40, 20.6, 1, 1.6, 1.5); D.eye(31, 16.4, 2.3, '#f4fff0', false); D.px(31.6, 16.6, INK); for (const [x, y] of [[34.6, 15.6], [36.6, 17.6]].concat(cr ? [[27.6, 18.6], [29.6, 13.2]] : [])) { D.flat(D.el(x, y, 0.9, 0.9), INK); D.px(x, y - 0.2, '#fff8c0'); } for (const [k, ex] of [[0, 42], [1, 43.4]]) D.L([[39, 21.4 + k], [ex, 24 + k * 2], [ex - 1 + k * 2, 27.6 + k * 2]], 0.5, 0.4, [p[0], p[2], '#e8fff8', p[1]]); D.px(28.6, 14.6, '#e8fff8'); D.px(29.6, 14, '#e8fff8'); });
    R.part('shell', { px: 28, py: 28, z: 7, role: 'arm', amp: 0.3, parent: 'body', strike: 0.55, reach: 0.06, thrust: 3 }, D => {
      const cx = 34, cy = 32, rx = 7.6 + big, ry = 9 + big;
      D.L([[27, 28], [31, 30]], 2.4, 2.4, p);
      D.shade(D.el(cx, cy, rx, ry), (x, y) => { const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy), v = (-dx * 0.5 - dy * 0.72) * 0.8 + (1 - d) * 0.3, ring = Math.abs(((d * 3.4) % 1) - 0.5) < 0.12 && d > 0.25; return ring ? (v > 0.2 ? sh[1] : sh[3]) : v > 0.55 ? sh[2] : v > 0.05 ? sh[1] : v > -0.4 ? sh[3] : deepOf(sh); }, sh[0]);
      for (const [bx, by, br] of [[cx - 3, cy - 4, 1.7], [cx + 2.5, cy + 3, 2], [cx - 2, cy + 5, 1.4], [cx + 3.5, cy - 4.5, 1.3]].concat(st >= 2 ? [[cx - 5.5, cy + 1, 1.5], [cx + 1, cy - 8, 1.5]] : [])) { D.B(bx, by, br, br, P.bone); D.px(bx, by, '#3a3440'); }
      if (st >= 2) for (let k = 0; k < 4; k++) { const a = -0.9 + k * 0.6; D.G([[cx + cos(a) * rx * 0.9 - 0.8, cy + sin(a) * ry * 0.9], [cx + cos(a) * (rx + 3.6), cy + sin(a) * (ry + 3.6)], [cx + cos(a + 0.3) * rx * 0.9, cy + sin(a + 0.3) * ry * 0.9]], P.bone); }
      if (cr) { D.flat(D.path([[cx - 4, cy - 1], [cx - 1, cy + 1], [cx + 3, cy]], 1.6, 1.2), VOID); D.eye(cx - 0.6, cy + 0.4, 1.5, '#f0d040', true);  }
    });
  } };
  // 깨물이(biter)는 아래 ART-KIN2 덩어리에서 다시 그린다
  // 별보는 눈: 떠 있는 큰 눈 하나, 고리, 늘어진 신경
  DEF.gazer = { build(R, st) {
    const p = P.nebula, scl = ['#120a26', '#e4dcf2', '#ffffff', '#a898c8'], ringP = ['#2a1c10', '#e8c860', '#fff6c0', '#a8842c'];
    R.ichor = '#3a2580'; R.shw = 8; R.glow = '#cdbcff'; R.eyes = [['ball', 26.5, 24]];
    const ring = (D, front, cy, rx, ry, tilt) => { const m = D.cut(D.el(24, cy, rx, ry), (x, y) => { const dx = (x - 24) / (rx - 1.6), dy = (y - cy - (x - 24) * tilt) / Math.max(0.6, ry - 1.5), yy = y - cy - (x - 24) * tilt; return dx * dx + dy * dy > 1 && (front ? yy >= 0 : yy < 0); }); D.lit(m, ringP); };
    for (let k = 0; k < 3 + (st >= 3 ? 2 : 0); k++) { const x = 20 + k * (st >= 3 ? 2 : 4), len = 8 + (k % 2) * 3 + st; R.part('nerve' + k, { px: x, py: 31, z: 0, role: 'sway', ph: k * 1.7, amp: 1.1, parent: 'ball' }, D => { D.L([[x, 31], [x + (k % 2 ? 1.5 : -1.5), 31 + len * 0.5], [x + (k % 2 ? -1 : 1.2), 31 + len]], 1.5, 0.6, [p[0], p[3], p[1], deepOf(p)]); D.px(x + (k % 2 ? -1 : 1.2), 31.6 + len, p[4]); }); }
    R.part('ringB', { px: 24, py: 24, z: 1, role: 'float', ph: 0.6, parent: 'ball' }, D => { ring(D, false, 24, 15.5, 4.6, 0.12); if (st >= 2) ring(D, false, 24, 13, 4, -0.5); });
    R.part('ball', { px: 24, py: 24, z: 3, role: 'float', morph: true, blink: true }, (D, m) => {
      D.B(24, 24, 9.4, 9.4, scl); for (const [a, b] of [[[16, 21], [19, 22.5]], [[16.5, 27.5], [19.5, 26.6]], [[18, 30], [20.6, 28.4]]]) D.L([a, b], 0.6, 0.5, ['#0000', '#c85a7a', '#c85a7a', '#c85a7a'], null);
      D.shade(D.el(26.5, 24, 5.2, 5.6), (x, y) => { const d = Math.hypot(x - 26.5, (y - 24) * 0.93) / 5.2; return d > 0.84 ? '#3a2580' : d > 0.5 ? (hsh(Math.round(x * 3), Math.round(y * 3)) > 0.6 ? '#f0a04a' : '#e8c030') : '#fff3a0'; }, p[0]);
      if (st >= 3) { for (const [ex, ey] of [[25, 21.6], [28.6, 24], [25, 26.6]]) D.flat(D.el(ex, ey, 1.25, 1.5), INK); } else { D.flat(D.el(26.8, 24, 1.5, 3.6), INK); D.flat(D.el(26.8, 24, 2.4, 1.2), INK); }
      D.px(24.4, 21.4, '#ffffff'); D.px(25.4, 21.4, '#ffffff'); D.px(24.4, 22.4, '#ffffff');
      const lid = 2 + m * 16; D.ball(D.cut(D.el(24, 24, 9.4, 9.4), (x, y) => y < 14.6 + lid - Math.abs(x - 24) * 0.12), 24, 24, 9.4, 9.4, p); if (m < 0.5) D.ball(D.cut(D.el(24, 24, 9.4, 9.4), (x, y) => y > 31.4 + Math.abs(x - 24) * 0.1), 24, 24, 9.4, 9.4, [p[0], p[3], p[1], deepOf(p)]);
      if (st >= 3) for (let k = 0; k < 5; k++) { const a = -2.3 + k * 0.37; D.G([[24 + cos(a) * 8.4 - 1, 24 + sin(a) * 8.4 + 0.6], [24 + cos(a) * 14, 24 + sin(a) * 14], [24 + cos(a) * 8.4 + 1.4, 24 + sin(a) * 8.4 + 0.6]], ringP); }
    });
    R.part('ringF', { px: 24, py: 24, z: 5, role: 'float', ph: 0.6, parent: 'ball' }, D => { ring(D, true, 24, 15.5, 4.6, 0.12); if (st >= 2) ring(D, true, 24, 13, 4, -0.5); });
    if (st >= 2) for (const [k, x, y] of [[0, 10, 14], [1, 39, 34]].concat(st >= 3 ? [[2, 39, 13]] : [])) R.part('moon' + k, { px: x, py: y, z: 6, role: 'float', ph: 2 + k * 2, amp: 1.5 }, D => { D.B(x, y, 2.6, 2.6, scl); D.flat(D.el(x + 0.5, y, 1.2, 1.4), p[1]); D.px(x + 0.6, y, INK); });
    R.part('star0', { px: 24, py: 24, z: 7, role: 'orbit', ph: 0.5, amp: 4 }, D => D.spark(37, 16, p[4], true));
    R.part('star1', { px: 24, py: 24, z: 7, role: 'orbit', ph: 3.6, amp: 3.4 }, D => D.spark(11, 31, p[4], false));
    R.pose = (anim, f, G, T, fx, s) => { if (anim !== 'attack') return; const b = T.ball, k = 1 + 0.2 * s.chg - 0.1 * s.rec; b.sx *= k; b.sy *= k; b.m = f < 0.3 ? 0.42 * s.chg : 0; for (const n of ['star0', 'star1']) { T[n].dx *= 1 - 0.8 * s.chg; T[n].dy *= 1 - 0.8 * s.chg; } T.ringF.rot += 0.5 * s.chg; T.ringB.rot += 0.5 * s.chg; fx.glow = Math.max(fx.glow, 0.62 * s.chg); };
  } };
  // 촉수 하나: 굵게 시작해 가늘어지고, 안쪽에 빨판이 찍힌다
  const tent = (D, pts, r0, r1, p, suck) => { D.L(pts, r0, r1, p); if (suck) for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)); for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; D.px(lerp(a[0], b[0], f) + 0.4, lerp(a[1], b[1], f) + 0.6, suck); } } };
  // 두건 쓴 것: 두건 속에 얼굴 대신 틈. 사람이었던 것. 주황 등불
  DEF.hood = { build(R, st) {
    const p = P.dusk, lit = [p[0], '#6a4a62', '#a888a0', '#3a2440'], fl = P.flesh, gl = p[4], tall = st >= 3 ? 3 : 0;
    R.ichor = '#2a1830'; R.shw = 9; R.glow = gl; R.eyes = [['hoodp', 27, 17 - tall]];
    for (let k = 0; k < 4; k++) R.part('hem' + k, { px: 17.5 + k * 4, py: 40, z: 0, role: 'sway', ph: k * 1.4, amp: 0.9, parent: 'robe' }, D => D.G([[16 + k * 4, 39], [19.6 + k * 4, 39], [18.6 + k * 4 + (k % 2 ? 1 : -1), 45.4 - (k % 2) * 1.6]], [p[0], p[3], p[1], deepOf(p)]));
    R.part('armB', { px: 21, py: 25, z: 1, role: 'arm', ph: 2, parent: 'robe' }, D => { D.L([[21, 25], [17, 30], [17.4, 35]], 2.4, 2, [p[0], p[3], p[1], deepOf(p)]); D.L([[17.4, 35.6], [16.6, 39.6]], 0.9, 0.6, fl); D.px(17.6, 40, fl[2]); D.px(15.6, 39.6, fl[2]); });
    R.part('robe', { px: 24, py: 44, z: 2, role: 'body', amp: 0.6 }, D => {
      D.G([[19, 22 - tall], [29, 22 - tall], [32, 41], [15, 41]], lit); D.L([[21, 26], [19.6, 40]], 0.6, 0.6, [p[0], p[3], p[3], p[3]], null); D.L([[26, 27], [27.6, 40]], 0.6, 0.6, [p[0], p[3], p[3], p[3]], null); D.L([[23.6, 30], [23.4, 40.4]], 0.5, 0.5, [p[0], p[0], p[0], p[0]], null);
      D.rect(19.4, 30.6, 9.6, 1, '#8a6a3a'); D.L([[25.6, 31.6], [25.2, 36]], 0.5, 0.5, ['#0000', '#8a6a3a', '#8a6a3a', '#8a6a3a'], null); D.px(25.2, 36.8, gl);
      if (st >= 2) for (const [x0, y0, x1, y1] of [[22, 27, 27, 30.5], [25, 29, 29.6, 33.6]]) { D.L([[x0, y0], [x1, y1]], 1, 0.7, fl); D.px(x1 + 0.8, y1 + 0.4, fl[2]); D.px(x1 + 0.6, y1 + 1.2, fl[2]); }
    });
    R.part('hoodp', { px: 24, py: 23 - tall, z: 4, role: 'head', parent: 'robe' }, D => {
      const t = tall; D.G([[17.6, 23 - t], [18, 14 - t], [22, 9.6 - t], [27.6, 10.6 - t], [31.2, 16 - t], [30.4, 23.4 - t]], lit); D.L([[22, 9.6 - t], [17, 7.4 - t], [14.6, 9.4 - t]], 1.6, 0.6, lit);
      D.flat(D.el(26.6, 17 - t, 3.6, 5.2), VOID); const n = st >= 3 ? 3 : 1; for (let k = 0; k < n; k++) { const sx = 26.8 + (k - (n - 1) / 2) * 2.2; D.rect(sx, 13.6 - t + Math.abs(k - (n - 1) / 2), 1, 7 - 2 * Math.abs(k - (n - 1) / 2), gl); D.px(sx, 16 - t, '#fff3c0'); D.px(sx, 17 - t, '#fff3c0'); }
      if (st >= 2) { D.px(24.4, 19.6 - t, gl); D.px(29, 15 - t, gl); }
    });
    R.part('armF', { px: 27, py: 25, z: 5, role: 'arm', amp: 0.5, parent: 'robe', strike: 0.35, cast: -0.7 }, D => { D.L([[27, 25], [31, 28.4], [34.6, 27.4]], 2.4, 1.8, lit); D.L([[35, 27.2], [36.6, 26.4]], 0.9, 0.7, fl); D.L([[36.4, 31], [37.4, 12.6]], 0.7, 0.7, P.wood); D.L([[37.4, 12.6], [41, 12], [41.6, 14.6]], 0.6, 0.6, P.wood); });
    R.part('lamp', { px: 41.6, py: 14.6, z: 6, role: 'sway', amp: 1.3, ph: 0.8, parent: 'armF' }, D => { D.rect(41.2, 14.6, 1, 2.4, '#3a2a1a'); D.flat(D.el(41.6, 20, 2.6, 3.2), '#ffd070', '#3a2410'); D.flat(D.el(41.4, 19.8, 1.2, 1.7), '#fff8d8'); D.rect(39, 17, 5.4, 0.9, '#5a3a1a'); D.rect(39, 22.8, 5.4, 0.9, '#5a3a1a'); D.px(41.6, 16.2, '#5a3a1a'); });
    if (st >= 3) for (let k = 0; k < 3; k++) R.part('flame' + k, { px: 24, py: 16, z: 7, role: 'orbit', ph: k * 2.1, amp: 4.6 }, D => { const x = 24 + (k - 1) * 3, y = 4 + (k % 2) * 2; D.flat(D.el(x, y, 1.2, 1.8), gl, '#5a2a0a'); D.px(x, y + 0.4, '#fff3c0'); });
  } };
  // 허기: 갈비뼈가 벌어진 배, 붉은 살
  DEF.gnaw = { build(R, st) {
    const p = P.hunger, dk = [p[0], p[3], p[1], deepOf(p)], bn = P.bone;
    R.ichor = '#6a121c'; R.shw = 11; R.eyes = [['head', 30, 14.6]];
    const claw = (D, x, y, dx) => { for (let k = -1; k <= 1; k++) D.L([[x, y], [x + dx * 2.4 + k * 0.4, y + 2.6 + Math.abs(k) * -0.6 + k * 0.5]], 0.6, 0.4, bn); };
    R.part('legB', { px: 21, py: 35, z: 0, role: 'leg', ph: Math.PI }, D => { D.L([[21, 34], [17.6, 39], [20, 44]], 2, 1.3, dk); D.G([[17.6, 45.2], [20, 43], [23.6, 45.2]], dk); });
    R.part('armB', { px: 21, py: 22, z: 1, role: 'arm', ph: 2.2, parent: 'torso', strike: 0.5 }, D => { D.L([[21, 22], [14.6, 28], [14, 37]], 1.9, 1.1, dk); claw(D, 14, 37.6, -0.4); });
    if (st >= 2) R.part('armX', { px: 19, py: 19, z: 1, role: 'sway', ph: 0.6, amp: 0.8, parent: 'torso' }, D => { D.L([[19, 19], [13, 15], [9.6, 18]], 1.4, 0.8, dk); claw(D, 9.4, 18.6, -0.5); if (st >= 3) { D.L([[18, 16.4], [14, 10], [16.4, 6.6]], 1.3, 0.7, dk); claw(D, 16.6, 6.4, 0.4); } });
    R.part('torso', { px: 23.5, py: 35, z: 2, role: 'body', morph: true, bite: true }, (D, m) => {
      D.G([[18, 17], [27.6, 15.4], [30.6, 21], [29, 30], [26.4, 35.4], [20.6, 35.4], [17.4, 27]], p); D.L([[19, 16.6], [16.6, 22], [17.6, 28]], 1.3, 1, p);
      if (st >= 3) for (let k = 0; k < 4; k++) D.G([[17 + k * 0.3, 18 + k * 3], [13 - (k % 2), 16.6 + k * 3], [17.4 + k * 0.3, 20.4 + k * 3]], bn);
      const w = 2.6 + m * 2.6; D.flat(D.poly([[24.6 - w, 19.4], [24.6 + w, 19.4], [24.6 + w * 0.8, 32.4], [24.6 - w * 0.8, 32.4]]), MAWC, p[0]); D.flat(D.el(24.6, 27, w * 0.6, 4), GUM);
      for (let k = 0; k < 5; k++) { const y = 20.4 + k * 2.6; D.L([[24.4 - w - 1.4, y - 0.4], [24.4 - w + 1.6 + (st >= 2 ? 0.8 : 0), y + 0.8]], 0.7, 0.4, bn); D.L([[24.8 + w + 1.4, y + 0.6], [24.8 + w - 1.6 - (st >= 2 ? 0.8 : 0), y + 1.8]], 0.7, 0.4, bn); }
      if (st >= 3) { D.L([[24.6, 28], [26, 33], [29.6, 35.6]], 1.5, 0.9, ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038']); }
      D.px(21, 33.6, p[2]); D.px(27.4, 17.4, p[2]);
    });
    R.part('legF', { px: 26, py: 35, z: 3, role: 'leg' }, D => { D.L([[26, 34], [29.6, 39], [27, 44]], 2.1, 1.4, p); D.G([[24.6, 45.2], [27, 43], [31.6, 45.2]], p); D.px(31, 44.6, bn[1]); D.px(29.2, 44.6, bn[1]); });
    R.part('head', { px: 27, py: 17, z: 4, role: 'head', parent: 'torso', jaw: -0.12 }, D => { D.L([[27, 17.6], [28.6, 15]], 1.6, 1.4, dk); D.B(29.6, 12.6, 4, 3.6, bn); D.flat(D.el(30.4, 12.6, 1.5, 1.6), VOID); D.px(30.6, 12.6, '#ff5040'); D.px(27.4, 11.6, bn[3]); D.px(32.6, 14.2, VOID); });
    R.part('jawp', { px: 27.6, py: 15.4, z: 5, parent: 'head', jaw: 0.5 }, D => { D.G([[27.4, 15], [33.8, 15.4], [33.4, 17.6], [28.6, 17.8]], [bn[0], bn[3], bn[1], '#7a7468']); D.fangs(29.6, 33, 15, -1, 1.6, 1.8); });
    R.part('armF', { px: 28, py: 21, z: 6, role: 'arm', parent: 'torso', strike: 1.05, reach: 0.12 }, D => { D.L([[28, 21], [33.6, 26.4], [35.4, 36]], 2, 1.1, p); claw(D, 35.6, 36.6, 0.5); D.px(31, 23, p[2]); });
  } };
  // 촉수 뭉치: 매듭진 촉수 덩어리, 가운데 부리
  DEF.tangle = { build(R, st) {
    const p = P.abyss2, dk = dkp(p), lt = [p[0], '#3a82a8', '#a8dcf4', p[1]], suck = '#d8f4ff', bk = ['#1a1408', '#d8b858', '#fff0b0', '#8a6a28'], cx = 23, cy = 30;
    R.ichor = '#143a58'; R.shw = 14; R.eyes = [['knot', 27, 25.6]];
    const arm = (name, a, len, bend, o, pal, w) => R.part(name, Object.assign({ px: cx + cos(a) * 3, py: cy + sin(a) * 3, role: 'sway', amp: 0.7 }, o), D => { const dx = cos(a), dy = sin(a), nx = -dy, ny = dx, pt = (f, b) => [cx + dx * len * f + nx * b, Math.min(45, cy + dy * len * f + ny * b)]; tent(D, [pt(0.16, 0), pt(0.45, bend), pt(0.74, bend * 0.9), pt(0.94, bend * 0.1), pt(1, -bend * 0.6)], w || 3.2, 0.7, pal, suck); });
    arm('b0', -2.5, 17 + st, -4, { z: 0, ph: 0 }, dk); arm('b1', -1.75, 19 + st * 2, 4, { z: 0, ph: 1.4, cast: -0.3 }, dk); arm('b2', -1.05, 18 + st, -3.6, { z: 0, ph: 2.6, cast: 0.3 }, dk);
    if (st >= 2) arm('b3', -2.05, 21, -3, { z: 0, ph: 3.8 }, dk, 2.6); if (st >= 3) arm('b4', -1.4, 23, 3, { z: 0, ph: 5, cast: 0.2 }, dk, 2.6);
    arm('g0', 2.62, 17, 3.6, { z: 1, ph: 0.8, role: 'leg', amp: 0.5 }, dk); arm('g1', 0.42, 16, -3.4, { z: 1, ph: 3.9, role: 'leg', amp: 0.5 }, dk);
    R.part('knot', { px: cx, py: 37, z: 3, role: 'body', amp: 0.9 }, D => {
      D.B(cx, cy - 0.6, 8.4, 7.4, dk);
      D.L([[15.6, 29], [19, 24.6], [25, 24], [29.6, 27]], 2.6, 2.4, p); D.L([[16.6, 33.6], [22, 36], [28.6, 34.4], [30.6, 30.6]], 2.6, 2.2, p); D.L([[18.6, 30.6], [22.6, 28], [26.6, 30.6], [23, 33]], 2, 1.8, lt);
      for (const [x, y] of [[18, 25.6], [22, 24.4], [20.6, 29.4], [24.6, 34.6], [19, 34]]) D.px(x, y, suck);
      D.eye(27, 25.6, 2, '#f0d040', true); D.flat(D.el(22.6, 26, 1, 1), INK); D.px(22.6, 25.8, '#f0e060'); if (st >= 2) { D.flat(D.el(18, 28, 0.9, 0.9), INK); D.px(18, 27.8, '#f0e060'); }
      if (st >= 2) for (const [x, y, r] of [[17, 32.6, 1.4], [26, 36.4, 1.2]]) { D.B(x, y, r, r, P.shell); D.px(x, y, '#3a3018'); }
    });
    R.part('beakU', { px: 28, py: 29.6, z: 5, parent: 'knot', jaw: -0.35 }, D => { D.G([[27, 27], [31.6, 26.6], [36.6, 30.6], [33, 30.4], [28, 31]], bk); D.px(30, 27.6, '#ffffff'); D.px(35.6, 30.4, '#3a2a10'); });
    R.part('beakL', { px: 28, py: 31, z: 4, parent: 'knot', jaw: 0.45, role: 'sway', amp: 0.2 }, D => { D.G([[27.6, 31], [33.6, 31.2], [34.6, 33], [29, 34.4]], [bk[0], bk[3], bk[1], '#5a4418']); D.rect(29, 31, 3.6, 0.8, MAWC); });
    arm('f0', 2.1, 15, -3, { z: 6, ph: 2.2, role: 'leg', amp: 0.5 }, p); arm('f1', 1.05, 15, 3, { z: 6, ph: 5.2, role: 'leg', amp: 0.5 }, p);
    arm('whip', -0.32, 19 + st * 1.5, -4.6, { z: 7, ph: 4.4, strike: 0.75, reach: 0.3, thrust: 3 }, p, 3.4);
    if (st >= 3) for (const [n, a, len] of [['b1', -1.75, 25], ['b4', -1.4, 23]]) R.part('tip' + n, { px: cx + cos(a) * len, py: cy + sin(a) * len, z: 2, parent: n, role: 'pulse', amp: 1 }, D => { const x = cx + cos(a) * len + (n === 'b1' ? -2.4 : 1.8), y = cy + sin(a) * len + 1; D.B(x, y, 2, 2, SCL); D.flat(D.el(x + 0.4, y, 0.9, 1.1), '#f0d040'); D.px(x + 0.4, y, INK); });
  } };
  // 눈 조각: 흰자, 치우친 눈동자, 감기는 눈꺼풀. 조각마다 따로 깜박인다
  const SCL = ['#120a26', '#e4dcf2', '#ffffff', '#a898c8'];
  const eyeP = (R, name, x, y, r, lx, ly, iris, lidP, o) => R.part(name, Object.assign({ px: x, py: y, morph: true, blink: true, role: 'pulse', amp: 0.35 }, o), (D, m) => { D.B(x, y, r, r, SCL); D.flat(D.el(x + lx, y + ly, r * 0.56, r * 0.6), iris, r > 2 ? INK : null); D.flat(D.el(x + lx, y + ly, Math.max(0.5, r * 0.22), r * 0.42), INK); D.px(x - r * 0.4, y - r * 0.45, '#ffffff'); const cut = y - r + (0.24 + m * 2.1) * r; D.ball(D.cut(D.el(x, y, r + 0.3, r + 0.3), (xx, yy) => yy < cut), x, y, r + 0.3, r + 0.3, lidP); });
  // 알 품은 것: 등에 반투명 알 주머니 여럿, 다리 많음
  DEF.brood = { build(R, st) {
    const p = ['#0a120a', '#3e5e30', '#7a9a50', '#22381e', '#f0e060'], dk = [p[0], p[3], p[1], '#142412'], hd = ['#0a120a', '#2e4a2a', '#5e8048', '#182c18'];
    const sac = (D, x, y, rx, ry, wake) => { D.shade(D.el(x, y, rx, ry), (xx, yy) => { const dx = (xx - x) / rx, dy = (yy - y) / ry; return -dx * 0.6 - dy * 0.7 > 0.4 ? '#fbffe8' : dx * 0.6 + dy * 0.7 > 0.5 ? '#a8b878' : '#e0ecb4'; }, '#2a3010'); D.flat(D.el(x + rx * 0.16, y + ry * 0.2, rx * 0.46, ry * 0.44), '#4a6430'); D.px(x + rx * 0.3, y + ry * 0.1, wake ? '#ff5040' : '#1a2a12'); D.px(x - rx * 0.46, y - ry * 0.5, '#ffffff'); };
    R.ichor = '#2c5c24'; R.shw = 14; R.glow = '#e8ff7a'; R.eyes = [['head', 33.6, 33]];
    [[13, -1, Math.PI, 0], [19, -1, 0.8, 0], [25, 1, Math.PI + 0.8, 0], [15.6, -1, 0, 1], [22, 1, Math.PI, 1], [29, 1, 0.6, 1]].forEach(([x, dir, ph, front], k) => R.part('leg' + k, { px: 21 + dir * 2, py: 35, z: front ? 5 : 0, role: 'leg', ph, amp: 0.4 }, D => { const pal = front ? p : dk, fx = x + dir * (front ? 5 : 3.6), ky = front ? 37 : 31 - (k % 2) * 2; D.L([[21 + dir * 2, 35], [x + dir * 1.6, ky], [fx, 41], [fx + dir * 0.8, 45]], 1.5, 0.7, pal); D.px(x + dir * 1.6, ky - 1, pal[2]); }));
    R.part('ovi', { px: 13, py: 34, z: 1, role: 'sway', amp: 0.6, ph: 2, parent: 'abd' }, D => { D.L([[13, 34], [8.6, 36.6], [6.6, 40]], 1.6, 0.7, dk); D.flat(D.el(6.6, 42.4, 1.2, 1.5), '#e0ecb4', '#2a3010'); });
    R.part('abd', { px: 21, py: 40, z: 2, role: 'body', amp: 0.9 }, D => { D.B(20.6, 33.6, 9.4, 6, p); for (let k = 0; k < 4; k++) D.L([[13.6 + k * 4, 30], [14.4 + k * 4, 38]], 0.5, 0.5, ['#0000', p[3], p[3], p[3]], null); for (const [x, y] of [[15, 36], [22, 37.6], [26.6, 35]]) { D.px(x, y, p[2]); D.px(x + 1, y + 0.7, '#142412'); } });
    const S = [[14.6, 24.6, 4, 5, 0.4, 0], [22.6, 21.6, 5, 6.2, 1.8, 1], [29, 26, 3.4, 4.2, 3.2, 0]].concat(st >= 2 ? [[10, 29.6, 2.8, 3.4, 4.4, 0], [17.6, 15.6, 3.6, 4.4, 5.2, 0]] : [], st >= 3 ? [[26.6, 14, 3.4, 4.2, 2.4, 1], [21.6, 8.6, 2.8, 3.4, 0.9, 0]] : []);
    S.forEach(([x, y, rx, ry, ph, w], k) => R.part('sac' + k, { px: x, py: y + ry, z: 3 + (k === 1 ? 1 : 0), role: 'sway', amp: 0.45, ph, parent: 'abd', lift: 1.6 }, D => { D.L([[x, y + ry + 2], [x, y + ry - 1]], 1.3, 1, dk); sac(D, x, y, rx, ry, w); if (w && st >= 2) { D.L([[x - rx * 0.5, y - ry * 0.7], [x - rx * 0.1, y - ry * 0.1], [x - rx * 0.5, y + ry * 0.3]], 0.4, 0.4, ['#0000', INK, INK, INK], null); } }));
    R.part('head', { px: 30, py: 34, z: 6, role: 'head', parent: 'abd', strike: 0.25 }, D => { D.B(33, 34, 4.6, 4, hd); for (const [x, y, r] of [[33.6, 33, 1.3], [36, 34, 0.9], [31.4, 31.6, 0.8], [35, 31.4, 0.7]]) { D.flat(D.el(x, y, r, r), INK); D.px(x, y - 0.2, '#f0e060'); } D.px(30.6, 31, hd[2]); D.px(31.6, 30.6, hd[2]); if (st >= 3) { D.px(30, 33.6, '#f0e060'); D.px(32, 36, '#f0e060'); } });
    for (const [k, dy] of [[0, -1], [1, 1]]) R.part('mand' + k, { px: 36, py: 36 + dy, z: 7, parent: 'head', jaw: dy * 0.5, role: 'sway', amp: 0.25, ph: k * Math.PI }, D => D.G([[35.6, 35.6 + dy], [39.6, 35 + dy * 2.4], [41.6, 37 + dy * 0.6], [38.6, 37 + dy * 1.6], [36, 37.4 + dy]], P.bone));
    if (st >= 2) R.part('nurse', { px: 28, py: 37, z: 7, role: 'arm', amp: 0.5, parent: 'abd', cast: -0.6 }, D => { D.L([[28, 36.6], [31, 40], [33, 40.6]], 1, 0.7, hd); sac(D, 34.4, 41.6, 1.8, 2.2, false); });
  } };
  // 눈 무더기: 눈이 쌓인 살덩이, 눈마다 다른 쪽을 본다
  DEF.heap = { build(R, st) {
    const p = P.nebula2, dk = [p[0], p[3], p[1], deepOf(p)], h = st >= 2 ? 4 : 0;
    R.ichor = '#5a3090'; R.shw = 14; R.glow = '#f0d8ff';
    for (let k = 0; k < 3; k++) R.part('foot' + k, { px: 14 + k * 10, py: 42, z: 0, role: 'sway', ph: k * 2, amp: 0.5 }, D => D.L([[14 + k * 10, 41], [12 + k * 11, 44.6]], 2.4, 1.6, dk));
    R.part('mound', { px: 24, py: 45, z: 1, role: 'body' }, D => {
      D.B(24, 37, 13, 7.6, p); D.B(21.6, 28.6, 9, 7.6, p); D.B(27, 22 - h * 0.6, 6.4, 6.4 + h * 0.4, p); if (st >= 2) D.B(22.6, 16.4 - h, 4.6, 4.8, p); if (st >= 3) D.B(27, 9.6 - h * 0.4, 3.6, 3.8, p);
      for (const [x, y] of [[14, 37.6], [33, 39.6], [17, 30], [30.6, 30.6], [21, 41.6], [27.6, 42]]) { D.px(x, y, p[3]); D.px(x + 1, y + 0.6, p[3]); D.px(x + 0.4, y - 0.8, p[2]); }
      if (st >= 3) { D.flat(D.el(24, 41, 6, 2), MAWC, p[0]); D.fangs(19.6, 28.6, 39.6, 1, 2, 2.2); }
    });
    const E = [['e0', 18.6, 35, 2.8, -0.8, 0.5, '#f0a04a', 0.2], ['e1', 29.6, 36.6, 2.4, 0.9, 0.2, '#6ad0c0', 2.6], ['e2', 22.6, 27.6, 3.4, 0.6, -0.6, '#e85a7a', 4], ['e3', 30, 25.6, 1.9, 0.8, 0.4, '#f0e060', 1.2], ['e4', 26.6, 19.6 - h * 0.6, 2.7, -0.6, -0.5, '#8ad0ff', 5.2], ['e5', 14.6, 29.6, 1.7, -0.7, 0, '#c0e878', 3.3]]
      .concat(st >= 2 ? [['e6', 22.6, 15.4 - h, 2.4, 0.7, 0.3, '#f0a04a', 0.9], ['e7', 33.6, 32, 1.6, 0.6, -0.4, '#e85a7a', 4.6], ['e8', 12.6, 38.4, 1.6, -0.6, 0.4, '#8ad0ff', 2]] : [], st >= 3 ? [['e9', 27, 8.6 - h * 0.4, 2.2, 0.5, -0.5, '#f0e060', 3.9]] : []);
    for (const [n, x, y, r, lx, ly, ir, ph] of E) eyeP(R, n, x, y, st >= 3 && n === 'e2' ? 4.6 : r, lx, ly, ir, p, { z: 3, ph, parent: 'mound' });
    R.eyes = [['e2', 22.6, 27.6]];
    if (st >= 2) for (let k = 0; k < 2; k++) R.part('stalk' + k, { px: 16 + k * 17, py: 24, z: 2, role: 'sway', ph: k * 3 + 1, amp: 0.9, parent: 'mound' }, D => { const x = 16 + k * 17, ex = x + (k ? 4 : -4); D.L([[x, 25], [ex, 18], [ex + (k ? 1 : -1), 13.6]], 1.3, 0.8, dk); D.B(ex + (k ? 1 : -1), 12, 2.1, 2.1, SCL); D.flat(D.el(ex + (k ? 1.6 : -1.6), 12, 1, 1.1), k ? '#6ad0c0' : '#f0a04a'); D.px(ex + (k ? 1.6 : -1.6), 12, INK); });
  } };
  // 가면: 웃는 것, 우는 것, 텅 빈 것
  const maskAt = (D, cx, cy, rx, ry, mood, crack) => { D.B(cx, cy, rx, ry, P.bone); const ex = rx * 0.46, ey = cy - ry * 0.18; D.flat(D.el(cx - ex, ey, Math.max(0.6, rx * 0.26), Math.max(0.6, ry * (mood === 2 ? 0.1 : 0.22))), INK); D.flat(D.el(cx + ex, ey, Math.max(0.6, rx * 0.26), Math.max(0.6, ry * (mood === 2 ? 0.1 : 0.22))), INK); const my = cy + ry * 0.5; D.rect(cx - rx * 0.36, my, rx * 0.8, 0.8, '#7a121c'); if (mood !== 2) { D.px(cx - rx * 0.5, my + (mood ? 0.9 : -0.9), '#7a121c'); D.px(cx + rx * 0.5, my + (mood ? 0.9 : -0.9), '#7a121c'); } if (mood === 1) { D.px(cx - ex, ey + ry * 0.45, '#6ab0e8'); D.px(cx - ex, ey + ry * 0.7, '#6ab0e8'); } if (crack) { D.L([[cx + rx * 0.2, cy - ry], [cx - rx * 0.1, cy - ry * 0.3], [cx + rx * 0.3, cy + ry * 0.1]], 0.5, 0.5, ['#0000', INK, INK, INK], null); D.px(cx, cy - ry * 0.55, P.dusk[4]); } };
  // 가면 쓴 것: 가면 여럿이 떠 도는 그림자 몸
  DEF.mask = { build(R, st) {
    const p = P.shadow, ed = [p[0], '#33243f', '#6a5080', '#170e20'], bn = P.bone, gl = P.dusk[4], tall = st >= 3 ? 2 : 0;
    R.ichor = '#241a2c'; R.shw = 9; R.glow = gl; R.eyes = [['face', 22.8, 14.6 - tall], ['face', 27, 14.6 - tall]];
    for (const [k, x, dx, ph] of [[0, 19, -5, 0.6], [1, 24, -1, 2.4], [2, 28.6, 3, 4.2]]) R.part('wisp' + k, { px: x, py: 33, z: 0, role: 'sway', amp: 0.9, ph }, D => { D.L([[x, 32], [x + dx * 0.4, 38], [x + dx, 42.6], [x + dx * 1.5, 45]], 2.6, 0.5, ed); D.px(x + dx * 1.7, 45.6, ed[2]); });
    R.part('armB', { px: 20, py: 23, z: 1, role: 'arm', ph: 2, parent: 'body', strike: 0.6 }, D => { D.L([[20, 23], [14.6, 26], [11.6, 32.6]], 1.5, 0.6, ed); for (let k = -1; k <= 1; k++) D.L([[11.6, 32.6], [10.2 + k * 1.5, 38 - Math.abs(k)]], 0.55, 0.4, bn); });
    R.part('body', { px: 24, py: 38, z: 2, role: 'body', amp: 1.2 }, D => {
      D.G([[19.6, 20], [28.6, 20], [31.6, 26], [29.4, 31], [31, 35.6], [27, 34], [24.6, 37], [22, 33.6], [18, 35.6], [18.6, 30], [16.6, 26]], ed); D.B(24, 21.4, 6.4, 3, ed);
      D.flat(D.el(24.4, 27.6, 2.6, 3.6), VOID); maskAt(D, 24.4, 27.6, 1.7, 2.2, 2); for (const [a, b] of [[[20, 24], [19, 31]], [[28.6, 24], [29.6, 30]]]) D.L([a, b], 0.4, 0.4, ['#0000', ed[2], ed[2], ed[2]], null);
    });
    R.part('face', { px: 24.6, py: 20, z: 4, role: 'head', parent: 'body' }, D => { const cx = 24.8, cy = 15.6 - tall, rx = 4.8 + (st >= 3 ? 1 : 0), ry = 6 + (st >= 3 ? 1.2 : 0); D.B(cx, cy, rx, ry, bn);
      D.flat(D.el(cx - rx * 0.44, cy - ry * 0.16, rx * 0.3, ry * 0.26), INK); D.flat(D.el(cx + rx * 0.46, cy - ry * 0.2, rx * 0.22, ry * 0.14), INK); D.px(cx - rx * 0.44, cy - ry * 0.1, gl);
      D.L([[cx - rx * 0.44, cy + ry * 0.1], [cx - rx * 0.5, cy + ry * 0.8]], 0.5, 0.4, ['#0000', INK, INK, INK], null); D.rect(cx - rx * 0.3, cy + ry * 0.52, rx * 0.8, 0.7, '#3a3440');
      D.L([[cx + rx * 0.3, cy - ry], [cx + rx * 0.02, cy - ry * 0.4], [cx + rx * 0.3, cy + ry * 0.1]], 0.4, 0.4, ['#0000', '#3a3440', '#3a3440', '#3a3440'], null); if (st >= 3) { D.flat(D.el(cx + rx * 0.2, cy - ry * 0.62, 1, 0.9), INK); D.px(cx + rx * 0.2, cy - ry * 0.62, gl); } });
    R.part('armF', { px: 28.6, py: 23, z: 5, role: 'arm', parent: 'body', strike: 1, reach: 0.15 }, D => { D.L([[28.6, 23], [34, 25.6], [37.6, 31]], 1.6, 0.6, ed); for (let k = -1; k <= 1; k++) D.L([[37.6, 31], [39.8 + k * 1.4, 36.4 - Math.abs(k)]], 0.55, 0.4, bn); });
    const M = [[12, 14, 2.8, 1, 0.4, 2.2], [37, 13, 2.6, 2, 3.4, 2]].concat(st >= 2 ? [[10, 26, 2.4, 2, 1.8, 1.6], [39.6, 23.6, 2.4, 1, 5, 1.8]] : [], st >= 3 ? [[17, 4.6, 2.3, 0, 2.6, 1.5], [33.6, 3.6, 2.3, 1, 4.2, 1.5]] : []);
    M.forEach(([x, y, r, mood, ph, amp], k) => R.part('m' + k, { px: x, py: y, z: 6, role: 'float', ph, amp }, D => maskAt(D, x, y, r, r * 1.2, mood, k % 2 === 1)));
  } };
  // 둥근 입 안쪽으로 난 이빨 고리
  const ringTeeth = (D, cx, cy, rx, ry, n, len, ph, col) => { for (let k = 0; k < n; k++) { const a = ph + k * TAU / n, c = cos(a), s = sin(a), w = 0.42 * TAU / n; D.G([[cx + cos(a - w) * rx, cy + sin(a - w) * ry], [cx + c * (rx - len), cy + s * (ry - len)], [cx + cos(a + w) * rx, cy + sin(a + w) * ry]], col || P.bone, null); } };
  // 해구의 입: 바닥에서 솟은 거대한 이빨 고리
  DEF.maw = { build(R, st) {
    const p = P.abyss, dk = [p[0], p[3], p[1], deepOf(p)], g = st >= 2 ? 1 : 0;
    R.ichor = '#0f5560'; R.shw = 15; R.eyes = [['lip', 13.6, 16], ['lip', 34.6, 16]];
    R.part('pool', { px: 24, py: 44, z: 0 }, D => { D.flat(D.el(24, 44, 15, 2.4), '#0a2a34', '#06141c'); D.flat(D.el(21, 43.6, 6, 0.8), '#1f6a78'); D.px(33, 44, '#8fe8d8'); D.px(13, 44.4, '#8fe8d8'); });
    for (const [k, x, dir] of [[0, 13, -1], [1, 35, 1]]) R.part('feel' + k, { px: x, py: 38, z: 1, role: 'sway', ph: k * 2.6, amp: 1 }, D => tent(D, [[x, 39], [x + dir * 5, 34], [x + dir * 7, 27 - g * 2], [x + dir * 5.4, 23 - g * 3]], 1.8, 0.6, dk, '#bfe8f0'));
    R.part('trunk', { px: 24, py: 45, z: 2, role: 'body', amp: 0.8 }, D => {
      D.G([[14.6, 26], [33.4, 26], [35.6, 44], [12.4, 44]], p); for (let k = 0; k < 4; k++) D.L([[14.6 - k * 0.4, 30 + k * 3.6], [24, 31.6 + k * 3.6], [33.6 + k * 0.4, 30 + k * 3.6]], 0.5, 0.5, [p[0], p[3], p[3], p[3]], null);
      for (const [x, y, r] of [[17, 36, 1.5], [30.6, 39.6, 1.7], [21, 41.6, 1.2]].concat(st >= 3 ? [[28, 33.6, 1.4], [15.4, 41, 1.3]] : [])) { D.B(x, y, r, r, P.bone); D.px(x, y, '#3a3440'); }
    });
    R.part('lip', { px: 24, py: 28, z: 4, role: 'pulse', amp: 0.35, parent: 'trunk', morph: true, bite: true }, (D, m) => {
      const rx = 12.6 + g, ry = 11.6 + g, cy = 18.6 - g, ir = 0.62 + m * 0.2;
      D.B(24, cy, rx, ry, p); D.flat(D.el(24, cy, rx * ir, ry * ir), MAWC, p[0]); D.flat(D.el(24, cy + 1, rx * ir * 0.6, ry * ir * 0.6), GUM); D.flat(D.el(24, cy + 1.6, rx * ir * 0.3, ry * ir * 0.3), VOID);
      ringTeeth(D, 24, cy, rx * ir + 0.6, ry * ir + 0.6, 12, 3.4 + m, 0.2); if (st >= 2) ringTeeth(D, 24, cy + 0.8, rx * ir * 0.62, ry * ir * 0.62, 8, 2.2, 0.6, [P.bone[0], P.bone[3], P.bone[1], '#7a7468']);
      if (st >= 3) { D.L([[24, cy + 2], [25.6, cy + 6], [24, cy + 9.6]], 1.6, 1.2, ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038']); D.flat(D.el(24, cy + 10.4, 1.6, 1.2), MAWC); D.px(23.2, cy + 9.8, TOOTH); D.px(24.8, cy + 9.8, TOOTH); }
      for (const [a, r] of [[-2.5, 1.2], [-0.6, 1.2], [-1.57, 1]].concat(st >= 3 ? [[-2, 0.9], [-1.1, 0.9]] : [])) D.eye(24 + cos(a) * (rx - 1.6), cy + sin(a) * (ry - 1.6), r, '#f0d040', r > 1.1);
      for (const [x, y] of [[14, cy + 4], [34.6, cy + 3], [18, cy + 9]]) D.px(x, y, p[2]);
    });
    if (st >= 3) for (let k = 0; k < 4; k++) R.part('coral' + k, { px: 16 + k * 5.4, py: 9, z: 5, role: 'sway', amp: 0.4, ph: k, parent: 'lip' }, D => { const x = 16 + k * 5.4, y = 8.6 + Math.abs(k - 1.5) * 1.6; D.L([[x, y + 1], [x + (k % 2 ? 1 : -1), y - 4]], 1, 0.6, P.hunger); D.L([[x + (k % 2 ? 0.5 : -0.5), y - 1.6], [x + (k % 2 ? -1.6 : 1.6), y - 4]], 0.7, 0.5, P.hunger); });
  } };
  // 포자 어미(mother)는 아래 ART-KIN2 덩어리에서 다시 그린다
  // 통삼킴: 몸이 통째로 목구멍, 이빨 줄
  DEF.famine = { build(R, st) {
    const p = P.hunger, dk = P.hunger2, bn = P.bone, long = st >= 2 ? 2 : 0;
    R.ichor = '#6a121c'; R.shw = 16; R.eyes = [['gullet', 31, 16.4]];
    R.part('tail', { px: 12, py: 33, z: 0, role: 'sway', ph: 1, amp: 0.8 }, D => { D.L([[13, 33], [6, 34], [2 - long, 30], [3 - long, 26]], 4, 0.9, dk); if (st >= 2) for (let k = 0; k < 3; k++) D.G([[5 + k * 3, 30 + k], [4.4 + k * 3, 26 + k], [7.6 + k * 3, 29.6 + k]], bn); });
    for (const [k, x, ph, pal] of [[0, 14, Math.PI, dk], [1, 23, 0.6, dk], [2, 18, 0, p], [3, 27, 2.6, p]]) R.part('leg' + k, { px: x, py: 38, z: k < 2 ? 1 : 5, role: 'leg', ph, amp: 0.6 }, D => { D.L([[x, 37], [x + 1, 43.6]], 2.2, 1.7, pal); D.G([[x - 1.6, 45.4], [x + 1, 43], [x + 5, 45.4]], pal); D.px(x + 4.4, 44.8, bn[1]); D.px(x + 2.6, 44.8, bn[1]); });
    R.part('barrel', { px: 22, py: 40, z: 2, role: 'body' }, D => {
      D.B(20.6, 30.6, 12.6, 9, p); for (let k = 0; k < 4; k++) D.L([[11 + k * 4.6, 23.6 + Math.abs(k - 1.5) * 0.6], [10 + k * 4.6, 37.6 - Math.abs(k - 1.5) * 0.6]], 0.5, 0.5, [p[0], p[3], p[3], p[3]], null);
      for (const [x, y] of [[14, 27], [19, 25], [16.6, 33.6], [22.6, 35.6]]) { D.px(x, y, p[2]); D.px(x + 1, y, p[2]); }
      if (st >= 2) for (let k = 0; k < 4; k++) D.G([[11 + k * 4, 23.4 - (k % 2)], [12 + k * 4, 17.6 - (k % 2) * 1.6], [14 + k * 4, 23 - (k % 2)]], bn);
      if (st >= 3) for (const [x, y] of [[14.6, 31], [20.6, 29.6]]) { D.flat(D.el(x, y, 2.6, 1.8), MAWC, p[0]); D.fangs(x - 1.6, x + 1.8, y - 1.6, 1, 1, 1.6); }
    });
    R.part('gullet', { px: 26, py: 30, z: 4, role: 'pulse', amp: 0.3, parent: 'barrel', morph: true, bite: true, strike: 0.12 }, (D, m) => {
      const cx = 33, cy = 28.6, rx = 9 + long * 0.6 + m * 1.6, ry = 11 + long * 0.6 + m * 2;
      D.B(cx, cy, rx, ry, p); D.flat(D.el(cx + 0.6, cy, rx * 0.74, ry * 0.76), MAWC, p[0]); D.flat(D.el(cx + 1.2, cy + 0.4, rx * 0.5, ry * 0.52), GUM); D.flat(D.el(cx + 1.6, cy + 0.6, rx * 0.26, ry * 0.3), VOID);
      ringTeeth(D, cx + 0.6, cy, rx * 0.78, ry * 0.8, 11, 3.6, 0.3); ringTeeth(D, cx + 1.2, cy + 0.4, rx * 0.5, ry * 0.52, 7, 2.2, 0.8, [bn[0], bn[3], bn[1], '#7a7468']);
      if (st >= 3) { D.flat(D.el(cx + 1.6, cy + 0.6, rx * 0.3, ry * 0.32), '#8a2038', MAWC); D.flat(D.el(cx + 1.8, cy + 0.6, rx * 0.16, ry * 0.18), VOID); ringTeeth(D, cx + 1.6, cy + 0.6, rx * 0.3, ry * 0.32, 5, 1.4, 0.2); }
      for (const [x, y] of [[cx - 3, cy - ry + 1.6], [cx + 1, cy - ry + 0.8], [cx + 4.6, cy - ry + 2]]) D.px(x, y, '#ffe060');
    });
  } };
  // 새끼(spawn)는 아래 ART-KIN2 덩어리에서 새로 그린다
  // 감염체: 포자에 먹힌 사람. 걷지만 사람의 걸음이 아니다
  DEF.infected = { size: () => 48, build(R) {
    const sk = ['#141a14', '#8aa88a', '#c0d8b8', '#52705a'], rag = ['#12140e', '#4a5038', '#787e58', '#2a2e20'], cap = ['#101c18', '#2a6a5a', '#7ac8a0', '#184438'], sp = '#e8ff7a';
    human(R, { skin: sk, top: rag, bot: rag, boot: rag, strike: 0.9, backStrike: 0.7,
      torso: D => { D.L([[20, 30], [27, 36]], 0.5, 0.5, ['#0000', rag[3], rag[3], rag[3]], null); for (const [x, y, r] of [[21.6, 28.6, 1.6], [26.6, 33, 1.3]]) { D.flat(D.el(x, y, r, r * 0.8), '#b0c040', '#14200c'); D.px(x - 0.4, y - 0.4, sp); } D.px(24, 36, sp); },
      face: D => { D.flat(D.el(24.6, 18.4, 1.3, 1.5), INK); D.flat(D.el(28, 18.6, 1, 1.2), INK); D.px(24.6, 18.2, sp); D.px(28, 18.4, sp); D.rect(24.6, 21.6, 3.4, 1.4, MAWC); D.px(25.4, 21.6, TOOTH); D.px(27.2, 21.6, TOOTH); },
      hat: D => { D.shade(D.cut(D.el(24, 14.6, 7.6, 5.4), (x, y) => y < 15.6), (x, y) => (x - 24) * -0.08 - (y - 14.6) * 0.16 > 0.5 ? cap[2] : (x - 24) * -0.08 - (y - 14.6) * 0.16 > 0.1 ? cap[1] : cap[3], cap[0]); D.rect(17.4, 15.4, 13.6, 0.8, '#e0e8b0'); for (const [x, y] of [[21, 12], [26, 11], [28.6, 13.6]]) D.px(x, y, sp); D.L([[19.6, 15.6], [18.6, 19.6]], 0.6, 0.5, ['#0000', '#8aa83a', '#8aa83a', '#8aa83a'], null); },
      back: D => { armTo(D, 21, 27, 17, 33, dkp(rag)); hand(D, 16.4, 34, sk); },
      front: D => { armTo(D, 27.5, 27, 34, 29, rag); hand(D, 35, 29.4, sk); for (const k of [-1, 0, 1]) D.L([[35.6, 29.4], [37.6, 30 + k * 1.4]], 0.5, 0.4, sk); D.flat(D.el(30.6, 26.6, 1.5, 1.1), '#b0c040', '#14200c'); },
      extra: R => { for (let k = 0; k < 3; k++) R.part('mote' + k, { px: 24, py: 14, z: 9, role: 'orbit', ph: k * 2.1, amp: 2 + k * 0.6 }, D => D.px(16 + k * 7, 8 + k * 2, k % 2 ? sp : '#ffffff')); } });
    R.die = 'melt'; R.ichor = '#2c5c24'; R.glow = sp; R.eyes = [['head', 24.6, 18.4], ['head', 28, 18.6]];
  } };
  // ---------- 침입자: 사람의 틀 하나에 옷과 연장을 갈아 끼운다 ----------
  // o: skin top bot boot cloak robe(긴 옷) build(몸집) hat(D) face(D) torso(D) front(D, 앞손 연장) back(D, 뒷손 것) strike drop
  function human(R, o) {
    const sk = o.skin || P.skin, top = o.top || P.tan, bot = o.bot || P.brown, boot = o.boot || P.leather, w = o.build || 0, hy = o.crouch ? 2.5 : 0;
    R.die = 'fall'; R.shw = 9 + w; R.eyes = [['head', 24.6, 18.6 + hy], ['head', 27.6, 18.6 + hy]];
    if (o.cloak) R.part('cloak', { px: 22, py: 25 + hy, z: 0, role: 'sway', amp: 0.45, ph: 1, parent: 'torso' }, D => { D.G([[19 - w, 24.5 + hy], [26, 24.5 + hy], [27, 39], [22, 41.5], [15.5 - w, 40]], o.cloak); D.L([[20, 29], [18.4, 38]], 0.5, 0.5, [o.cloak[0], o.cloak[3], o.cloak[3], o.cloak[3]], null); });
    if (o.backItem) R.part('backItem', { px: 21, py: 26 + hy, z: 0, parent: 'torso' }, D => o.backItem(D, hy));
    if (!o.robe) {
      R.part('legB', { px: 22, py: 36, z: 1, role: 'leg', ph: Math.PI }, D => { D.L([[22, 36], [21, 41]], 2, 1.7, [bot[0], bot[3], bot[1], deepOf(bot)]); D.G([[19, 45], [19.5, 41], [22.6, 41], [23.6, 45]], [boot[0], boot[3], boot[1], deepOf(boot)]); });
      R.part('legF', { px: 26, py: 36, z: 2, role: 'leg' }, D => { D.L([[26, 36], [26.6, 41]], 2.1, 1.8, bot); D.G([[24.4, 45], [24.8, 41], [28, 41], [30, 45]], boot); });
    }
    R.part('armB', { px: 21 - w * 0.5, py: 27 + hy, z: 3, role: 'arm', ph: Math.PI, parent: 'torso', strike: o.backStrike || 0, drop: !!o.backDrop }, D => { if (o.back) o.back(D, hy); else { D.L([[21 - w * 0.5, 27 + hy], [19.4 - w, 31 + hy], [20, 34.4 + hy]], 1.7, 1.4, [top[0], top[3], top[1], deepOf(top)]); D.B(20, 35 + hy, 1.3, 1.3, sk); } });
    R.part('torso', { px: 24, py: 37, z: 4, role: 'body', amp: 0.7 }, D => {
      if (o.robe) { D.G([[19.5 - w, 33], [28.5 + w, 33], [31 + w, 45], [17 - w, 45]], o.robe); D.L([[22, 36], [21, 44]], 0.5, 0.5, [o.robe[0], o.robe[3], o.robe[3], o.robe[3]], null); D.L([[26.5, 36], [27.5, 44]], 0.5, 0.5, [o.robe[0], o.robe[3], o.robe[3], o.robe[3]], null); }
      D.G([[19.4 - w, 25 + hy], [28.6 + w, 25 + hy], [28.2 + w * 0.6, 36.4], [19.8 - w * 0.6, 36.4]], top); D.B(24, 26.4 + hy, 5.2 + w, 2.6, top);
      if (o.torso) o.torso(D, hy); else D.rect(20, 34.4, 8.4, 1.2, boot[1]);
    });
    R.part('head', { px: 24.5, py: 23.5 + hy, z: 6, role: 'head', parent: 'torso' }, D => {
      D.rect(23.4, 22 + hy, 2.6, 2.4, sk[3]); D.B(24.8, 18.2 + hy, 5, 5.1, sk);
      if (o.face) o.face(D, hy); else { D.rect(24.2, 17.8 + hy, 1, 2, INK); D.rect(27.4, 17.8 + hy, 1, 2, INK); D.px(29.4, 19.6 + hy, sk[3]); D.px(26, 21.4 + hy, sk[3]); D.px(27, 21.4 + hy, sk[3]); }
      if (o.hat) o.hat(D, hy);
    });
    R.part('armF', { px: 27.5 + w * 0.5, py: 27 + hy, z: 7, role: 'arm', parent: 'torso', strike: o.strike == null ? 1 : o.strike, cast: o.cast || 0, drop: !!o.frontDrop, morph: !!o.frontMorph }, (D, m) => { if (o.front) o.front(D, hy, m || 0); });
    if (o.extra) o.extra(R, hy);
  }
  const hand = (D, x, y, sk) => D.B(x, y, 1.4, 1.4, sk || P.skin);
  const armTo = (D, x0, y0, x1, y1, p) => D.L([[x0, y0], [lerp(x0, x1, 0.5) + 0.6, lerp(y0, y1, 0.5) + 1.2], [x1, y1]], 1.8, 1.4, p);
  // 민병: 낡은 창, 누비옷
  DEF.militia = { side: 'inv', build(R) { human(R, { top: P.tan, bot: P.brown, strike: 0.5,
    torso: D => { for (let y = 27; y < 34; y += 2.4) D.rect(20, y, 8.4, 0.6, P.tan[3]); for (let x = 21.5; x < 28; x += 2.6) D.rect(x, 26.4, 0.6, 8, P.tan[3]); D.rect(19.8, 34.4, 8.6, 1.4, P.leather[1]); D.px(24, 34.8, P.gold[1]); },
    hat: D => { D.G([[19, 16.4], [20.4, 12.6], [28.6, 12.2], [30.6, 16.2]], P.steel); D.G([[17.4, 17.4], [18.4, 15.8], [31.6, 15.6], [32.6, 17.2]], P.steel); D.px(22, 13.6, '#ffffff'); },
    front: D => { D.L([[18, 36.5], [40, 20.5]], 0.8, 0.8, P.wood); D.G([[39, 21.6], [44.6, 16.6], [41.4, 19.8], [40.6, 22.8]], P.steel); D.px(43.4, 17.6, '#ffffff'); armTo(D, 27.5, 27, 30.5, 28.4, P.tan); hand(D, 31, 27.6); },
    back: D => { armTo(D, 21, 27, 22.6, 32.4, [P.tan[0], P.tan[3], P.tan[1], deepOf(P.tan)]); hand(D, 23.2, 33, P.skin2); } }); } };
  const dkp = p => [p[0], p[3], p[1], deepOf(p)];
  const blade = (D, x0, y0, x1, y1, w) => { D.L([[x0, y0], [x1, y1]], w || 1, 0.5, P.steel); D.px(lerp(x0, x1, 0.6) - 0.4, lerp(y0, y1, 0.6) - 0.4, '#ffffff'); };
  const flameP = (R, name, x, y, r, parent) => R.part(name, { px: x, py: y + r, z: 9, role: 'pulse', amp: 1.6, sp: 2, parent }, D => { D.flat(D.poly([[x - r, y + r * 0.6], [x - r * 0.5, y - r * 0.4], [x - r * 0.1, y + r * 0.1], [x + r * 0.2, y - r * 1.6], [x + r * 0.9, y - r * 0.2], [x + r, y + r * 0.6], [x, y + r * 1.2]]), '#f07a20', '#7a2a08'); D.flat(D.el(x, y + r * 0.3, r * 0.55, r * 0.7), '#ffd040'); D.px(x, y + r * 0.5, '#fff8d8'); });
  // 횃불꾼: 두건 쓴 농군, 횃불과 기름병
  DEF.torch = { side: 'inv', build(R) { human(R, { top: P.brown, bot: P.tan, strike: 0.8,
    torso: D => { D.rect(19.8, 34.4, 8.6, 1.2, P.leather[1]); D.B(21, 35.6, 1.5, 1.9, P.red); D.px(21, 33.6, P.tan[1]); },
    hat: D => { D.G([[19.4, 21.6], [19.6, 14.6], [23, 12.4], [27.6, 13], [28.6, 15.6], [24.6, 15.4], [22.6, 17.6], [22.4, 22.4]], P.red); },
    front: D => { armTo(D, 27.5, 27, 31.6, 26, P.brown); D.L([[31, 31.6], [34.6, 15.6]], 0.9, 0.9, P.wood); D.rect(33.4, 14, 2.6, 2.6, '#3a2a1a'); hand(D, 32, 26.6); },
    extra: R => flameP(R, 'flame', 35, 10.6, 2.8, 'armF') }); } };
  // 방패 기사: 판금과 큰 방패
  DEF.knight = { side: 'inv', build(R) { human(R, { top: P.steel, bot: P.steel, boot: P.steel, build: 1.2, strike: 0.25, backStrike: 0.9,
    torso: D => { D.rect(19, 30, 10.4, 0.8, P.steel[3]); D.rect(19.2, 34.4, 9.8, 1.4, P.gold[1]); D.px(22, 27.4, '#ffffff'); D.px(23, 27.4, '#ffffff'); },
    face: () => {},
    hat: D => { D.G([[19.4, 23], [19.6, 14.4], [22, 12.6], [28, 12.6], [30.4, 14.6], [30.4, 23]], P.steel); D.rect(24.6, 17.6, 5.6, 1.2, INK); D.rect(26.6, 19.6, 0.8, 2.6, INK); D.rect(28.6, 19.6, 0.8, 2.6, INK); D.px(21.4, 14.4, '#ffffff'); D.L([[24, 12.6], [20, 8.6], [16, 10.6]], 1.6, 0.8, P.red); },
    back: D => { armTo(D, 20.4, 27, 16.6, 25, dkp(P.steel)); blade(D, 16.4, 25.4, 11.6, 9.6, 1.2); D.rect(13.6, 23.6, 5.4, 1, P.gold[1]); },
    front: D => { armTo(D, 28, 27, 31, 30, P.steel); D.G([[27.6, 23.6], [38.6, 23.6], [38.6, 33], [33.2, 40.6], [27.6, 33]], P.white); D.rect(32.4, 24.6, 1.6, 13, P.red[1]); D.rect(28.6, 28.4, 9.2, 1.6, P.red[1]); D.px(29, 25, '#ffffff'); } }); } };
  // 궁수: 긴 활, 두건
  DEF.archer = { side: 'inv', build(R) { human(R, { top: P.leather, bot: P.green, cloak: P.green, strike: 0.2,
    torso: D => { D.L([[20, 26], [28, 34]], 0.6, 0.6, ['#0000', P.tan[1], P.tan[1], P.tan[1]], null); D.rect(19.8, 34.4, 8.6, 1.2, P.tan[3]); },
    backItem: D => { D.G([[17, 22], [20, 21], [22, 33], [19, 34]], P.brown); for (let k = 0; k < 3; k++) { D.rect(17.4 + k, 18.6 - k * 0.6, 0.8, 3, P.wood[2]); D.px(17.4 + k, 18 - k * 0.6, P.red[2]); } },
    hat: D => { D.G([[19, 22.4], [19.4, 14.6], [23, 12], [28, 12.6], [30, 15.4], [24.6, 15.2], [22.6, 17.6], [22.6, 22.6]], P.green); D.L([[19.6, 14.6], [16.6, 17]], 1.2, 0.6, P.green); },
    back: D => { armTo(D, 21, 27, 26.6, 28.6, dkp(P.leather)); hand(D, 27.4, 28.6, P.skin2); D.L([[27.6, 28.6], [35, 28.2]], 0.5, 0.5, P.wood); D.px(35.8, 28.2, P.steel[2]); },
    frontMorph: true,
    front: (D, h, m) => { armTo(D, 27.5, 27, 33, 28, P.leather); D.L([[32.6, 16], [36.6, 22], [36.6, 34], [32.6, 40]], 1, 0.7, P.wood); const sx = 32.6 - 6.4 * m; D.L(m > 0.05 ? [[32.6, 16], [sx, 28.4], [32.6, 40]] : [[32.6, 16], [32.6, 40]], 0.5, 0.5, ['#0000', '#e8e0d0', '#e8e0d0', '#e8e0d0'], null); hand(D, 34.6, 28); } });
    R.pose = (anim, f, G, T, fx, s) => { if (anim !== 'attack') return; T.armF.m = Math.round(s.chg * 4) / 4; T.armB.dx -= 6.4 * s.u * s.chg; T.armB.dy -= 0.6 * s.u * s.chg; T.armF.rot -= 0.06 * s.chg; T.head.rot -= 0.05 * s.chg; if (f >= 0.41 && f < 0.75) T.armB.dx += 2.2 * s.u * s.rec; }; } };
  // 사제: 흰 옷, 향로
  DEF.priest = { side: 'inv', build(R) { human(R, { top: P.white, robe: P.white, strike: 0.3, cast: -0.9,
    torso: D => { D.rect(22.6, 25.6, 1.6, 17, P.gold[1]); D.rect(25.6, 25.6, 1.6, 17, P.gold[1]); D.rect(22.6, 31, 4.6, 1, P.gold[3]); },
    hat: D => { D.G([[20.4, 14.6], [22.4, 7], [24.8, 4.6], [27.2, 7], [29.4, 14.6]], P.white); D.rect(20.6, 13.2, 8.8, 1.4, P.gold[1]); D.rect(24.4, 6.6, 1, 6, P.gold[1]); D.rect(22.6, 8.8, 4.6, 1, P.gold[1]); },
    front: D => { armTo(D, 27.5, 27, 32.6, 25.6, P.white); hand(D, 33.4, 25.4); D.L([[33.6, 26], [35.6, 32]], 0.5, 0.5, ['#0000', P.gold[3], P.gold[3], P.gold[3]], null); },
    back: D => { armTo(D, 21, 27, 19.6, 32, dkp(P.white)); D.G([[16.6, 30], [21, 30.6], [20.6, 35], [16.4, 34.4]], P.red); D.rect(18.2, 31.4, 1, 2.4, P.gold[1]); },
    extra: R => { R.part('censer', { px: 35.6, py: 31, z: 9, role: 'sway', amp: 1.6, parent: 'armF' }, D => { D.B(35.8, 34, 2.4, 2.2, P.gold); D.rect(34.4, 33.4, 3, 0.7, P.gold[3]); D.px(35.6, 31.6, P.gold[1]); }); for (let k = 0; k < 2; k++) R.part('smoke' + k, { px: 36, py: 30, z: 0, role: 'float', ph: k * 3, amp: 2 }, D => { D.flat(D.el(38 + k * 3, 27 - k * 6, 1.8 - k * 0.5, 1.4 - k * 0.3), '#e8e0d088'); }); } });
    R.glow = '#fff3a0'; R.pose = (anim, f, G, T, fx, s) => { if (anim !== 'attack') return; T.armF.rot -= 0.45 * s.chg; T.censer.rot += 0.9 * s.chg - 1.1 * s.rec; for (const n of ['smoke0', 'smoke1']) { T[n].dy -= 3 * s.u * s.chg; T[n].sx *= 1 + 0.8 * s.chg; T[n].sy *= 1 + 0.8 * s.chg; } fx.glow = Math.max(fx.glow, 0.3 * s.chg); }; } };
  // 마법사: 긴 지팡이, 별 무늬
  DEF.mage = { side: 'inv', build(R) { human(R, { top: P.blue, robe: P.blue, strike: 0.3, cast: -0.8, skin: P.skin,
    torso: D => { for (const [x, y] of [[21, 28], [26.6, 30], [22.6, 36], [28, 40], [19.6, 41], [24.6, 42.6]]) D.px(x, y, P.gold[2]); D.rect(19.8, 33, 8.6, 1, P.gold[1]); },
    face: D => { D.rect(24.2, 17.4, 1, 1.8, INK); D.rect(27.4, 17.4, 1, 1.8, INK); D.G([[21.6, 20], [29.6, 20], [28, 25], [25, 28.6], [22.6, 25]], P.hairG); },
    hat: D => { D.G([[19.6, 14.4], [22.6, 7], [21.4, 2.6], [26, 5.6], [29.6, 14.4]], P.blue); D.G([[15.4, 15.6], [16.6, 13.6], [33, 13.6], [34.2, 15.6]], P.blue); D.px(24.4, 9, P.gold[2]); D.px(23.6, 10, P.gold[2]); D.px(25.2, 10, P.gold[2]); D.px(24.4, 11, P.gold[2]); },
    front: D => { armTo(D, 27.5, 27, 32, 28.6, P.blue); D.L([[33.4, 44], [33.6, 11]], 0.9, 0.9, P.wood); D.L([[33.6, 11], [32, 8.4], [33, 6]], 0.8, 0.6, P.wood); hand(D, 33, 28.4); },
    extra: R => R.part('gem', { px: 35, py: 8, z: 9, role: 'pulse', amp: 1.4, sp: 2, parent: 'armF' }, D => { D.B(35, 8, 2.2, 2.2, ['#3a1a08', '#f08a2a', '#ffe0a0', '#b0501a']); D.spark(35, 7.4, '#ffe0a0', true); }) }); R.glow = '#ffb040'; R.pose = (anim, f, G, T, fx, s) => { if (anim !== 'attack') return; T.gem.sx *= 1 + 0.5 * s.chg; T.gem.sy *= 1 + 0.5 * s.chg; fx.glow = Math.max(fx.glow, 0.45 * s.chg); }; } };
  // 도적: 단검 둘, 웅크린 몸
  DEF.rogue = { side: 'inv', build(R) { human(R, { top: P.leather, bot: P.leather, crouch: true, strike: 1.1, backStrike: 0.8, cloak: [P.shadow[0], '#3a2e3a', '#5a4a58', '#221a24'],
    torso: D => { D.L([[20, 29], [28.4, 33]], 0.6, 0.6, ['#0000', P.brown[1], P.brown[1], P.brown[1]], null); D.rect(19.8, 34.4, 8.6, 1.2, P.brown[3]); D.px(26, 34.8, P.steel[2]); },
    face: (D, h) => { D.rect(24.2, 17.6 + h, 1.2, 1.4, '#ffffff'); D.rect(27.4, 17.6 + h, 1.2, 1.4, '#ffffff'); D.px(24.8, 18 + h, INK); D.px(28, 18 + h, INK); D.G([[20.6, 19.6 + h], [30, 19.6 + h], [29.6, 23.6 + h], [21, 23.6 + h]], P.red); },
    hat: (D, h) => { D.G([[19.2, 20 + h], [19.4, 14.6 + h], [23, 12.4 + h], [28.4, 12.8 + h], [30.4, 16.6 + h], [24.4, 15.6 + h], [22.6, 17 + h]], [P.shadow[0], '#3a2e3a', '#5a4a58', '#221a24']); },
    back: (D, h) => { armTo(D, 21, 27 + h, 17, 31 + h, dkp(P.leather)); hand(D, 16.4, 31.4 + h, P.skin2); blade(D, 16, 31 + h, 11, 26.6 + h, 0.9); },
    front: (D, h) => { armTo(D, 27.5, 27 + h, 33, 30 + h, P.leather); hand(D, 33.6, 30 + h); blade(D, 34, 30 + h, 40.6, 27 + h, 0.9); D.rect(33.6, 28.8 + h, 0.8, 2.6, P.gold[1]); } }); } };
  // 음유시인: 류트와 깃 달린 모자
  DEF.bard = { side: 'inv', build(R) { human(R, { top: P.purple, bot: P.gold, strike: 0.25, cast: -0.3,
    torso: D => { D.G([[24, 25], [28.6, 25], [28.2, 36.4], [24, 36.4]], P.gold); D.rect(19.8, 34.4, 8.6, 1.2, P.leather[1]); D.px(24, 28, '#ffffff'); D.px(24, 31, '#ffffff'); },
    hat: D => { D.G([[18.6, 15.6], [20, 12], [29, 11.6], [31.6, 15], [26, 14.6]], P.green); },
    front: D => { D.B(27, 33, 4.6, 3.6, P.wood); D.flat(D.el(27.4, 33, 1.3, 1.1), '#2a1808'); D.L([[30, 31], [38.6, 24.6]], 1, 0.8, P.wood); D.rect(38, 23.6, 2, 2, P.wood[3]); D.L([[24, 33.6], [38, 25]], 0.4, 0.4, ['#0000', '#f0e8d0', '#f0e8d0', '#f0e8d0'], null); armTo(D, 27.5, 27, 30, 32, P.purple); hand(D, 30, 32.6); },
    back: D => { armTo(D, 21, 27, 24, 31.6, dkp(P.purple)); hand(D, 34.6, 27.4, P.skin2); },
    extra: R => R.part('feather', { px: 21, py: 12, z: 9, role: 'sway', amp: 1.2, parent: 'head' }, D => { D.L([[21, 12], [17, 6], [12.6, 5]], 1.3, 0.5, P.red); D.px(15.6, 5.4, '#ffffff'); }) }); } };
  // 심문관: 붉은 옷, 쇠 인장
  DEF.inquis = { side: 'inv', build(R) { human(R, { top: P.red, robe: P.red, skin: ['#2a1410', '#d8b8a0', '#f0dcc8', '#a08068'], strike: 0.9, cast: -0.5,
    torso: D => { D.rect(23.6, 25.6, 2, 18, '#1a0c10'); D.rect(19.6, 32.4, 9, 1.2, '#1a0c10'); D.B(24.6, 28.6, 1.3, 1.3, P.steel); },
    face: D => { D.rect(24, 18, 1.6, 0.9, INK); D.rect(27.2, 18, 1.6, 0.9, INK); D.rect(25.4, 21.6, 2.6, 0.7, '#6a3a30'); },
    hat: D => { D.G([[20.6, 14.6], [21.6, 6.6], [28, 6.6], [29, 14.6]], ['#07050c', '#2a2430', '#4a4252', '#141018']); D.G([[15.6, 16], [17, 14], [32.6, 14], [34, 16]], ['#07050c', '#2a2430', '#4a4252', '#141018']); D.rect(21, 12.4, 7.8, 1.3, P.red[1]); D.rect(23.8, 12, 2.2, 2.2, P.gold[1]); },
    front: D => { armTo(D, 27.5, 27, 32, 27.6, P.red); D.L([[31, 34], [36.6, 15]], 0.9, 0.9, P.steel); D.B(37, 13, 2.6, 2.6, P.steel); D.flat(D.el(37.4, 12.6, 1.4, 1.4), '#ff8a2a'); D.px(37.4, 12.4, '#fff3c0'); hand(D, 32.6, 27.4, ['#2a1410', '#d8b8a0', '#f0dcc8', '#a08068']); },
    back: D => { armTo(D, 21, 27, 19.4, 31.6, dkp(P.red)); D.L([[19.4, 32], [18.4, 36]], 0.5, 0.5, ['#0000', P.steel[1], P.steel[1], P.steel[1]], null); D.G([[15.6, 36], [20.6, 36.4], [20.2, 41.6], [15.4, 41]], P.leather); D.rect(16.6, 37.4, 2.4, 0.7, P.gold[1]); } }); R.glow = '#ff8a2a'; } };
  // 성기사: 금테 갑옷, 빛
  DEF.paladin = { side: 'inv', build(R) { human(R, { top: P.steel, bot: P.steel, boot: P.gold, build: 1.2, strike: 1, cloak: P.white,
    torso: D => { D.G([[21, 25.6], [27.4, 25.6], [27.6, 36.4], [20.8, 36.4]], P.white); D.spark(24.2, 30, P.gold[1], true); D.rect(19, 34.6, 10.4, 1.3, P.gold[1]); D.rect(18.4, 25, 2.6, 2.4, P.gold[1]); D.rect(27.6, 25, 2.6, 2.4, P.gold[1]); },
    hat: D => { D.G([[19.4, 19.6], [19.6, 14], [22.6, 12], [28, 12.4], [30.4, 15.6], [26, 15.4], [22.6, 17], [22.4, 20]], P.steel); D.rect(20, 14.6, 9, 1, P.gold[1]); },
    back: D => { armTo(D, 20.4, 27, 18.6, 31, dkp(P.steel)); D.B(17, 31.6, 4, 4.4, P.gold); D.B(17, 31.6, 1.5, 1.6, P.steel); },
    front: D => { armTo(D, 28, 27, 32.6, 28, P.steel); D.L([[30.6, 34], [36.6, 13.6]], 1, 1, P.wood); D.G([[32.6, 9.6], [41, 11.6], [40, 16.6], [31.6, 14.6]], P.steel); D.rect(35.6, 11.4, 1.4, 3.6, P.gold[1]); D.px(34, 11, '#ffffff'); hand(D, 33, 28, P.steel); },
    extra: R => R.part('halo', { px: 24.8, py: 8, z: 9, role: 'float', amp: 0.6, parent: 'head' }, D => { D.lit(D.cut(D.el(24.8, 8.4, 5.6, 1.9), (x, y) => { const dx = (x - 24.8) / 4.2, dy = (y - 8.4) / 0.8; return dx * dx + dy * dy > 1; }), ['#7a5a10', '#ffe060', '#fffad0', '#e8b020']); }) }); R.glow = '#fff3a0'; } };
  // 음: 사냥개. 목줄 풀린 개
  DEF.hound = { side: 'inv', build(R) {
    const p = ['#140c08', '#6a4a30', '#a07850', '#3e2a1a', '#e8e0d0'], dk = dkp(p);
    R.die = 'fall'; R.shw = 12; R.eyes = [['head', 35.6, 28.6]];
    R.part('tail', { px: 13, py: 31, z: 0, role: 'sway', amp: 1.4, sp: 2 }, D => D.L([[13.6, 31], [9, 28], [7.6, 23.6]], 1.4, 0.6, dk));
    for (const [k, x, ph, pal] of [[0, 15, Math.PI, dk], [1, 28, 0.4, dk], [2, 17.6, 0, p], [3, 30.6, Math.PI + 0.4, p]]) R.part('leg' + k, { px: x, py: 36, z: k < 2 ? 1 : 4, role: 'leg', ph, amp: 1.2 }, D => { D.L([[x, 35], [x - 0.8, 40], [x + 0.6, 44.4]], 1.7, 1.1, pal); D.rect(x, 44, 2.4, 1.2, pal[1]); });
    R.part('body', { px: 22, py: 38, z: 2, role: 'body' }, D => { D.B(21.6, 32.4, 9.6, 4.8, p); D.B(28.6, 31.6, 5, 5, p); D.B(15, 32.6, 4, 4, dk); for (const x of [19, 22, 25]) D.L([[x, 30], [x - 0.6, 35]], 0.4, 0.4, ['#0000', p[3], p[3], p[3]], null); });
    R.part('head', { px: 31, py: 29, z: 5, role: 'head', parent: 'body', strike: 0.3 }, D => { D.L([[30, 29.6], [33, 27.6]], 3, 2.6, p); D.B(35, 27.6, 3.6, 3.2, p); D.G([[36.6, 27], [42.6, 28], [42, 30.4], [36.6, 30.6]], p); D.G([[32.6, 25.4], [33, 20.6], [35.6, 24.6]], dk); D.px(35.6, 26.8, '#ffb030'); D.px(42.4, 28.2, INK); D.fangs(38.6, 41, 30.4, 1, 1.4, 1.6); D.rect(30.6, 28, 1.6, 4.6, P.red[1]); D.px(31.2, 32.6, P.gold[1]); });
    R.part('jawp', { px: 36.6, py: 30.4, z: 3, parent: 'head', jaw: 0.5 }, D => { D.G([[36.4, 30.4], [41.4, 31.4], [40.6, 33], [36.6, 32.6]], dk); D.L([[38, 31.6], [40.4, 32]], 0.5, 0.5, ['#0000', '#d8506a', '#d8506a', '#d8506a'], null); });
    R.part('rope', { px: 31, py: 32, z: 3, role: 'sway', amp: 1.2, ph: 1, parent: 'body' }, D => D.L([[31, 32.6], [29, 37], [30, 40.6]], 0.6, 0.5, P.tan));
  } };
  // 책을 쫓는 자: 긴 외투, 등불, 손에 붙은 책. 별 단계 = 미쳐 가는 정도
  DEF.seeker = { side: 'inv', size: () => 64, build(R, st) {
    const coat = P.coat, mad = st >= 2, lost = st >= 3, sk = lost ? ['#141a14', '#9ab89a', '#c8e0c0', '#5a7a5a'] : mad ? ['#2a1410', '#c8b098', '#e8d8c0', '#8a7060'] : P.skin, ink = '#1a1030', gr = '#7aff8a';
    human(R, { top: coat, bot: P.leather, cloak: coat, skin: sk, strike: 0.4, cast: -1,
      torso: D => { D.G([[19.4, 33], [28.8, 33], [30, 43], [18, 43]], coat); D.rect(23.6, 25.6, 1, 17, coat[3]); for (const y of [28, 31.6, 35.4]) D.px(25.2, y, P.gold[1]); D.G([[20.6, 24.4], [28.4, 24.4], [27, 28], [22, 28]], P.red); if (mad) { D.L([[20, 30], [22.6, 34], [21, 39]], 0.5, 0.5, ['#0000', ink, ink, ink], null); } if (lost) for (const [x, y] of [[21.4, 29.6], [27, 33.6], [22, 38.6]]) { D.flat(D.el(x, y, 1.4, 1), '#f2ecd8', INK); D.px(x, y, gr); } },
      face: D => { if (lost) { D.flat(D.el(27, 18.2, 2, 2.2), VOID); D.px(27, 18, gr); D.px(27.6, 18.6, gr); D.rect(23.6, 17.8, 1.4, 1.6, VOID); D.px(24, 18.4, '#ff5040'); D.rect(25, 21.6, 3.4, 1.2, VOID); D.px(26, 21.6, TOOTH); D.px(27.4, 21.6, TOOTH); } else { for (const x of [24.6, 28]) { D.flat(D.el(x, 18.4, 1.3, 1.2), '#9ab8d0', '#2a2430'); D.px(x - 0.5, 18, '#ffffff'); } D.px(26.3, 18.4, '#2a2430'); D.px(22.6, 18.2, '#2a2430'); if (mad) { D.flat(D.el(24.6, 18.4, 1.3, 1.2), '#e8e0d0', '#2a2430'); D.L([[23.6, 17.4], [25.6, 19.4]], 0.4, 0.4, ['#0000', '#2a2430', '#2a2430', '#2a2430'], null); D.px(28, 18.4, '#c8a8ff'); D.L([[29, 20.6], [28, 23]], 0.4, 0.4, ['#0000', ink, ink, ink], null); } D.G([[22, 21.6], [28.6, 21.6], [27.6, 23.6], [23, 23.6]], P.hair); } },
      hat: D => { D.G([[20.4, 14.4], [21, 9], [28.6, 9], [29.2, 14.4]], [coat[0], '#3a3028', '#5a4c3c', '#221c16']); D.G([[15, 15.8], [16.6, 13.8], [33, 13.8], [34.6, 15.8]], [coat[0], '#3a3028', '#5a4c3c', '#221c16']); D.rect(21, 12.4, 8, 1.2, P.red[1]); },
      back: D => { armTo(D, 21, 27, 20, 32, dkp(coat)); },
      front: D => { armTo(D, 27.5, 27, 33, 26.6, coat); hand(D, 33.8, 26.4, sk); D.rect(33.6, 26.6, 0.8, 4, '#3a2a1a'); },
      extra: R => {
        R.part('book', { px: 25, py: 33, z: 6.5, role: 'pulse', amp: 0.25, parent: 'torso', cast: -0.25, lift: 2 }, D => { const cv = mad ? ['#12081c', '#3a2060', '#6a4a9a', '#22103a'] : P.red, pg = lost ? '#d8f0c8' : '#f2ecd8';
          D.G([[20, 28.6], [30.6, 28.6], [31, 36.4], [19.6, 36.4]], cv); D.flat(D.poly([[20.8, 29.4], [25, 30], [25, 35.6], [20.6, 35.4]]), pg); D.flat(D.poly([[25.4, 30], [29.8, 29.4], [30.2, 35.4], [25.4, 35.6]]), lost ? '#b8d8a8' : '#d8d0b8');
          for (let k = 0; k < 3; k++) { D.rect(21.6, 31 + k * 1.4, 2.6, 0.5, '#5a5060'); if (!mad || k !== 1) D.rect(26.2, 31 + k * 1.4, 2.8, 0.5, '#5a5060'); }
          if (mad) { D.flat(D.el(27.6, 32.4, 1.5, 1.2), lost ? gr : '#c8a8ff', INK); D.px(27.6, 32.4, INK); for (const [a2, b2] of [[[20.6, 33], [18, 31]], [[30, 34], [32.6, 36]], [[24, 36], [22.6, 39]]].concat(lost ? [[[29, 29.6], [31.6, 26]], [[21, 29.6], [18.6, 26.6]]] : [])) D.L([a2, b2], 0.5, 0.4, ['#0000', ink, ink, ink], null); }
          hand(D, 21, 35.6, sk); D.px(19.6, 34.6, mad ? ink : sk[3]); });
        R.part('lamp', { px: 34, py: 30, z: 9, role: 'sway', amp: 1.4, parent: 'armF' }, D => { D.flat(D.el(34, 34, 2.6, 3.2), lost ? '#b0ffb0' : '#ffd070', '#3a2410'); D.flat(D.el(33.8, 33.8, 1.2, 1.7), '#fff8d8'); D.rect(31.6, 30.8, 5, 0.9, '#5a3a1a'); D.rect(31.6, 36.8, 5, 0.9, '#5a3a1a'); });
        if (lost) for (let k = 0; k < 3; k++) R.part('grow' + k, { px: 18, py: 27 + k * 3, z: 0, role: 'sway', ph: k * 2, amp: 1.2 }, D => tent(D, [[19, 27 + k * 3], [12, 22 + k * 5], [8 - k, 15 + k * 7], [10 - k, 11 + k * 8]], 1.8, 0.6, ['#0a140a', '#2a5a3a', '#6aa878', '#16321e'], '#b0ffb0'));
      } });
    R.glow = lost ? gr : '#c8a8ff';
  } };
  // ---------- 본체: 다섯 모습 (80 눈금) ----------
  const flatL = (D, pts, c, w) => D.L(pts, w || 0.5, w || 0.5, ['#0000', c, c, c], null);
  // 심연: 고인 물에서 솟은 종 모양 몸, 촉수 여덟, 눈 하나
  BOSS.abyss = R => {
    const p = P.abyss, dk = dkp(p), q = P.abyss2, qd = dkp(q), sh = P.shell;
    R.ichor = '#0f5560'; R.shw = 31; R.glow = '#8fe8d8';
    R.part('pool', { px: 40, py: 76, z: 0 }, D => { D.flat(D.el(40, 75.4, 34, 3.6), '#0a2a34', '#06141c'); D.flat(D.el(28, 74.8, 13, 1), '#1f6a78'); D.flat(D.el(56, 76, 8, 0.7), '#1f6a78'); for (const x of [10, 22, 51, 66, 71]) D.px(x, 75.4, '#8fe8d8'); });
    [[13, -1, 0, 0], [25, -1, 9, 1.3], [55, 1, 12, 2.6], [67, 1, 2, 3.9]].forEach(([x, dir, h, ph], k) => R.part('bt' + k, { px: x, py: 74, z: 1, role: 'sway', amp: 0.55, ph, cast: dir * 0.3 }, D => tent(D, [[x, 75], [x + dir * 3, 60], [x + dir * 8, 47 - h * 0.4], [x + dir * 8, 33 - h * 0.7], [x + dir * 3, 24 - h], [x + dir * 6, 18 - h], [x + dir * 10, 20 - h]], 4.4, 1, qd, '#bfe8f0')));
    R.part('mantle', { px: 40, py: 76, z: 3, role: 'body', amp: 0.6 }, D => {
      D.G([[22, 52], [58, 52], [65, 76], [15, 76]], q); D.B(40, 38, 19.6, 25, p);
      for (let k = 0; k < 6; k++) flatL(D, [[22.6 + k * 0.4, 54 + k * 3.6], [40, 56.6 + k * 3.6], [57.4 - k * 0.4, 54 + k * 3.6]], q[3]);
      for (const [x, y, r] of [[27, 27, 2.4], [24.6, 34, 1.8], [30, 21, 1.6], [23.6, 43, 2.2], [28, 48, 1.5], [53.6, 23, 1.4]]) { D.B(x, y, r, r, sh); D.px(x, y, '#3a3018'); }
      D.G([[21, 30], [14.6, 26], [17, 36], [12, 38], [19.6, 44]], sh); D.px(16, 31, '#ffffff');
      for (const [x, y, r, s] of [[52, 31, 2.2, 1], [55, 41, 1.7, 0], [30, 54, 1.6, 0], [48.6, 55, 2, 1], [35, 14.6, 1.5, 0]]) D.eye(x, y, r, '#e8d48a', s);
      for (const [x, y] of [[33, 18], [36, 16.6], [31, 24], [45, 16], [50, 20]]) D.px(x, y, '#e8fff8');
      flatL(D, [[34, 17], [29.6, 24], [27.6, 33]], '#c8fff0', 0.6);
      for (let k = 0; k < 7; k++) { const x = 27 + k * 4.4; D.L([[x, 57.6], [x + (k % 2 ? 0.6 : -0.6), 62 + (k % 3)]], 1.2, 0.6, dk); }
    });
    [[30, -1, 7], [38, 0, 10], [46, 1, 8.4], [52, 1, 5]].forEach(([x, dir, h], k) => R.part('crown' + k, { px: x, py: 15, z: 2, role: 'sway', amp: 0.35, ph: k * 1.4, parent: 'mantle' }, D => { D.L([[x, 16 + Math.abs(dir) * 2], [x + dir * 2, 16 - h * 0.6], [x + dir * 1.4, 16 - h]], 1.8, 0.7, [p[0], p[2], '#e8fff8', p[1]]); D.L([[x + dir * 1.6, 16 - h * 0.5], [x + dir * 1.6 + (k % 2 ? 2.6 : -2.6), 16 - h * 0.86]], 1, 0.6, [p[0], p[2], '#e8fff8', p[1]]); }));
    eyeP(R, 'eye', 40, 38, 8.6, 0.8, 0.8, '#f0c840', p, { parent: 'mantle', z: 5, amp: 0.3 });
    [[21, -1, 0], [32, -1, 1.7], [48, 1, 3.1], [59, 1, 4.6]].forEach(([x, dir, ph], k) => { const out = k === 0 || k === 3 ? 1 : 0.45; R.part('ft' + k, { px: x, py: 74, z: 6, role: 'sway', amp: 0.6, ph, strike: -dir * 0.45 * (out > 0.5 ? 1 : 0.6) }, D => tent(D, [[x, 75.6], [x + dir * 5 * out, 67], [x + dir * 13 * out, 62], [x + dir * 17 * out, 54 + (1 - out) * 6], [x + dir * 14 * out, 48 + (1 - out) * 10], [x + dir * 10 * out, 50 + (1 - out) * 10]], 4.6, 1.1, p, '#e8fff8')); });
  };
  // 성운: 떠 있는 큰 눈, 고리, 눈자루
  BOSS.nebula = R => {
    const p = P.nebula, q = P.nebula2, dk = dkp(p), scl = ['#120a26', '#d8ccf0', '#ffffff', '#9a88c8'], gd = ['#3a2a10', '#e8c030', '#fff3a0', '#a87e14'];
    R.ichor = '#3a2580'; R.shw = 20; R.glow = '#fff3a0';
    const ring = (D, front) => D.lit(D.cut(D.el(40, 36, 35, 9.6), (x, y) => { const dx = (x - 40) / 32.4, dy = (y - 36) / 7; return dx * dx + dy * dy > 1 && (front ? y >= 36 : y < 36) && hsh(Math.round(x / 5), front ? 3 : 7) > 0.2; }), gd);
    [[30, -2, 0], [36, 1.6, 1.2], [42, -1.4, 2.4], [48, 2, 3.6], [52.6, -1, 5]].forEach(([x, a, ph], k) => R.part('nerve' + k, { px: x, py: 53, z: 0, role: 'sway', amp: 0.8, ph }, D => tent(D, [[x, 52], [x + a, 60], [x - a, 67], [x + a * 0.6, 73 - (k % 2) * 4]], 2.6 - (k % 2) * 0.6, 0.6, dk, k % 2 ? null : '#cdbcff')));
    R.part('ringB', { px: 40, py: 36, z: 1, role: 'float', amp: 0.4, ph: 1 }, D => ring(D, false));
    R.part('ball', { px: 40, py: 36, z: 3, role: 'pulse', amp: 0.18 }, D => {
      D.B(40, 36, 21, 21, scl);
      for (const [a, len, b] of [[2.5, 9, 0.5], [3.4, 8, -0.4], [0.5, 8.6, 0.4], [-0.3, 7, -0.5], [1.5, 7, 0.3], [4.4, 6, 0.4], [5.3, 6.6, -0.3]]) { const x0 = 40 + cos(a) * 20, y0 = 36 + sin(a) * 20, x1 = 40 + cos(a + b * 0.3) * (20 - len * 0.5), y1 = 36 + sin(a + b * 0.3) * (20 - len * 0.5), x2 = 40 + cos(a - b * 0.2) * (20 - len), y2 = 36 + sin(a - b * 0.2) * (20 - len); flatL(D, [[x0, y0], [x1, y1], [x2, y2]], '#b05ac8'); }
      D.flat(D.el(32, 24.6, 3.4, 2), '#ffffff'); D.px(28, 28.6, '#ffffff');
    });
    R.part('iris', { px: 40, py: 37, z: 4, parent: 'ball', morph: true, flare: true, reach: 0.0 }, (D, m) => {
      D.shade(D.el(40, 37, 11.6, 12), (x, y, ax, ay) => { const d = Math.hypot(x - 40, (y - 37) * 0.97), a = Math.atan2(y - 37, x - 40), h = hsh(ax, ay); if (h > 0.965) return '#ffffff'; if (d > 10.4) return '#2a1860'; const band = sin(a * 9 + d * 0.9) > 0.3; return d > 7.6 ? (band ? '#6a4fc8' : '#4a30a0') : d > 4.6 ? (band ? '#c86ad8' : '#8a5ad8') : (band ? '#fff3a0' : '#f0a04a'); }, INK);
      const w = 2.4 + m * 3.6; D.flat(D.el(40, 37, w, 8.6 - m * 1.6), VOID); for (const [x, y] of [[40, 32], [39.4, 38], [40.6, 41.6]]) D.px(x, y, m > 0.4 ? '#fff3a0' : '#8a7ad8');
      if (m > 0.4) { D.spark(40, 37, '#fff3a0', true); D.px(37, 37, '#fff3a0'); D.px(43, 37, '#fff3a0'); }
      D.px(35, 31, '#ffffff'); D.px(36, 30.6, '#ffffff'); D.px(34.6, 32.6, '#f0d8ff');
    });
    R.part('lid', { px: 40, py: 16, z: 5, parent: 'ball', morph: true, blink: true }, (D, m) => {
      const cut = 15 + (0.3 + m * 1.45) * 21; D.ball(D.cut(D.el(40, 36, 21.6, 21.6), (x, y) => y < cut + Math.abs(x - 40) * 0.12), 40, 36, 21.6, 21.6, p);
      D.ball(D.cut(D.el(40, 36, 21.6, 21.6), (x, y) => y > 53.6 - m * 6), 40, 36, 21.6, 21.6, dk);
      for (const [x, y] of [[30, 17.4], [36, 15.4], [46, 16], [51, 18.6]]) { D.px(x, y, p[2]); D.px(x + 1, y, p[2]); }
    });
    [[31, 16, -5, -9, 0], [40, 14.6, 0.6, -11, 1.3], [48.6, 16, 5, -8, 2.6]].forEach(([x, y, dx, dy, ph], k) => R.part('horn' + k, { px: x, py: y, z: 2, role: 'sway', amp: 0.35, ph, parent: 'ball' }, D => { tent(D, [[x, y + 2], [x + dx * 0.4, y + dy * 0.55], [x + dx, y + dy]], 2.2, 0.7, p, null); D.B(x + dx, y + dy - 0.6, 1.9, 1.9, gd); D.px(x + dx - 0.6, y + dy - 1.2, '#ffffff'); }));
    [[21, 44, 8, 54, 4.8, 0.4, '#f0a04a'], [58.6, 26, 71.6, 15, 5.4, 2, '#7af0d8'], [60, 45, 71.6, 52, 4.4, 3.4, '#f070e8'], [21.6, 26, 8.6, 18, 4.2, 5, '#fff3a0']].forEach(([x0, y0, x1, y1, r, ph, ir], k) => R.part('stalk' + k, { px: x0, py: y0, z: 2, role: 'sway', amp: 0.45, ph, parent: 'ball', morph: true, blink: true, cast: (x1 > 40 ? -1 : 1) * 0.25 }, (D, m) => {
      tent(D, [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2], [x1, y1]], 1.8, 1, dk, null); D.B(x1, y1, r, r, scl); D.flat(D.el(x1 + (x1 > 40 ? -0.6 : 0.6), y1 + 0.4, r * 0.56, r * 0.6), ir, INK); D.flat(D.el(x1 + (x1 > 40 ? -0.6 : 0.6), y1 + 0.4, 0.7, r * 0.42), INK); D.px(x1 - r * 0.4, y1 - r * 0.5, '#ffffff');
      const cut = y1 - r + (0.36 + m * 1.9) * r; D.ball(D.cut(D.el(x1, y1, r + 0.4, r + 0.4), (x, y) => y < cut), x1, y1, r + 0.4, r + 0.4, p); }));
    R.part('ringF', { px: 40, py: 36, z: 7, role: 'float', amp: 0.4, ph: 1 }, D => { ring(D, true); for (const [x, y] of [[16, 42], [58, 44.6], [69, 40]]) D.spark(x, y, '#fff3a0', true); });
    R.pose = (anim, f, G, T, fx, s) => { if (anim === 'idle' || anim === 'cast') G.dy += sin(f * TAU) * 1.6 - 2; if (anim === 'attack') { T.iris.dx = 2.4 * Math.max(0, s.L); T.iris.dy = 1.6 * Math.max(0, s.L); } };
  };
  // 번식: 알로 가득한 배, 등에 솟은 알 주머니, 여러 다리
  BOSS.brood = R => {
    const p = P.brood2, dk = dkp(p), eg = P.egg, g = P.brood, sac = (D, x, y, rx, ry, wake) => { D.shade(D.el(x, y, rx, ry), (xx, yy) => { const dx = (xx - x) / rx, dy = (yy - y) / ry; return -dx * 0.6 - dy * 0.7 > 0.42 ? '#f8ffd8' : dx * 0.6 + dy * 0.7 > 0.5 ? '#98a860' : '#d8e8a0'; }, '#2a3010'); D.flat(D.el(x + rx * 0.14, y + ry * 0.2, rx * 0.46, ry * 0.42), '#5a7030'); D.flat(D.el(x + rx * 0.3, y + ry * 0.06, rx * 0.22, ry * 0.2), '#2c3c18'); D.px(x + rx * 0.34, y, wake ? '#ff5040' : '#f0e060'); D.px(x - rx * 0.5, y - ry * 0.5, '#ffffff'); };
    R.ichor = '#2c5c24'; R.shw = 30; R.glow = '#e8ff7a';
    [[10, -1, Math.PI], [20, -1, 0.6], [60, 1, Math.PI + 0.6], [70, 1, 0], [28, -1, 0], [52, 1, Math.PI]].forEach(([x, dir, ph], k) => R.part('leg' + k, { px: 40 + dir * 14, py: 58, z: k < 4 ? 1 : 6, role: 'leg', ph, amp: 0.35 }, D => { const far = k < 4, pal = far ? dk : p, kx = x - dir * (far ? 1 : 3), ky = far ? 48 - (k % 2) * 6 : 62; D.L([[40 + dir * 14, 58], [kx, ky], [x, 70], [x + dir * 1.6, 76]], far ? 2.4 : 2.8, 1, pal); D.px(kx, ky - 1.6, pal[2]); D.G([[x + dir * 0.6, 77], [x + dir * 1.8, 73.6], [x + dir * 4.6, 77]], pal); }));
    R.part('belly', { px: 40, py: 66, z: 3, role: 'body', amp: 0.75 }, D => {
      D.B(40, 44, 25.6, 20.6, p);
      D.shade(D.el(40, 45, 20.6, 15.6), (x, y, ax, ay) => { const dx = (x - 40) / 20.6, dy = (y - 45) / 15.6; return -dx * 0.6 - dy * 0.7 > 0.5 ? '#f0f8c0' : (ax + ay) % 2 ? '#c8dc90' : '#b4cc7c'; }, p[3]);
      for (const [x, y, rx, ry, w] of [[27, 41, 4.2, 5, 0], [36.6, 37.6, 4.6, 5.4, 1], [47, 40, 4.4, 5.2, 0], [54, 47, 3.6, 4.4, 0], [31.6, 50.6, 4.4, 4.8, 0], [43, 51, 4.8, 5.2, 1], [23.6, 49.6, 3, 3.6, 0]]) sac(D, x, y, rx, ry, w);
      for (const [a, b] of [[[20, 36], [26, 30]], [[60, 38], [55, 31]], [[34, 58], [40, 60]], [[48, 58], [53, 55]]]) flatL(D, [a, b], '#7a9a3a');
      for (const [x, y] of [[17, 46], [16.6, 40], [63, 44], [62, 52], [22, 56]]) { D.px(x, y, p[2]); D.px(x, y + 1, p[3]); }
    });
    [[21, 28, 4.6, 6.4, 0, -0.5], [33, 22.6, 5.6, 8, 1.4, -0.15], [47, 23, 5, 7, 2.8, 0.15], [58.6, 29, 4.2, 5.6, 4.2, 0.5], [40, 17, 3.6, 5, 5.2, 0]].forEach(([x, y, rx, ry, ph, tilt], k) => R.part('sac' + k, { px: x, py: y + ry + 2, z: k === 4 ? 2 : 4, role: 'sway', amp: 0.5, ph, parent: 'belly', lift: 2 }, D => { D.L([[x, y + ry + 3], [x + tilt * 2, y + ry - 1]], 1.6, 1.2, dk); sac(D, x + tilt * 3, y, rx, ry, k === 1); if (k === 1) { flatL(D, [[x - 2, y - 5], [x, y - 2], [x - 1.6, y + 1]], INK); D.px(x - 3, y - 1, '#ff5040'); } }));
    R.part('head', { px: 40, py: 58, z: 7, role: 'head', amp: 0.7, parent: 'belly' }, D => {
      D.B(40, 62, 9.6, 7.4, g); for (const [x, y, r] of [[35, 59.6, 1.5], [39, 58.4, 1.2], [43.4, 59, 1.7], [46.6, 61.4, 1.1], [33, 62.6, 1], [40.6, 61.6, 0.9]]) { D.flat(D.el(x, y, r, r), INK); D.px(x, y - 0.3, '#f0e060'); }
      D.px(33.6, 57, g[2]); D.px(34.6, 56.4, g[2]);
    });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('mand' + k, { px: 40 + dir * 4, py: 66, z: 8, parent: 'head', jaw: -dir * 0.5, role: 'sway', amp: 0.25, ph: k * Math.PI }, D => { D.G([[40 + dir * 5.6, 65], [40 + dir * 6, 71.6], [40 + dir * 1.4, 74], [40 + dir * 3.6, 69.6], [40 + dir * 2.4, 66]], P.bone); });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('arm' + k, { px: 40 + dir * 9, py: 62, z: 6, role: 'arm', ph: k * 2, amp: 0.5, parent: 'belly', strike: dir * 0.4, cast: dir * 0.5 }, D => { D.L([[40 + dir * 9, 62], [40 + dir * 13.6, 67], [40 + dir * 11, 72]], 1.8, 1, g); D.px(40 + dir * 10.6, 73, P.bone[1]); D.px(40 + dir * 12, 73, P.bone[1]); });
    [[9, 74, 2.6, 3, 0], [67.6, 73.6, 3, 3.4, 2], [73.6, 75, 2, 2.2, 4]].forEach(([x, y, rx, ry, ph], k) => R.part('laid' + k, { px: x, py: 77, z: 9, role: 'pulse', amp: 0.6, ph }, D => sac(D, x, y, rx, ry, k === 1)));
  };
  // 황혼: 한 벌 옷 아래 모인 두건 다섯, 등불
  BOSS.dusk = R => {
    const p = P.dusk, lit = [p[0], '#6a4a62', '#a888a0', '#3a2440'], dkr = [p[0], '#32203a', '#5a3e5a', '#1c1024'], fl = P.flesh, gl = p[4];
    R.ichor = '#2a1830'; R.shw = 30; R.glow = gl;
    [[12, -1, 0], [24, -0.4, 1.6], [56, 0.4, 3], [68, 1, 4.4], [40, 0.2, 5.4]].forEach(([x, dir, ph], k) => R.part('hem' + k, { px: x, py: 72, z: 0, role: 'sway', amp: 0.5, ph }, D => tent(D, [[x, 70], [x + dir * 4, 75], [x + dir * 9, 76.4], [x + dir * 12, 74]], 2.6, 0.6, P.shadow, null)));
    R.part('robe', { px: 40, py: 77, z: 2, role: 'body', amp: 0.5 }, D => {
      D.G([[24, 36], [56, 36], [66, 50], [72, 77], [66, 74.6], [60, 77], [54, 74.6], [47, 77], [40, 74.6], [33, 77], [26, 74.6], [20, 77], [14, 74.6], [8, 77], [14, 50]], p);
      for (const [a, b, c] of [[[30, 40], [27, 58], [23, 75]], [[40, 42], [40.6, 60], [39.6, 74]], [[50, 40], [53.6, 58], [57, 75]], [[20, 50], [16, 64], [13, 74]], [[60, 50], [64, 64], [67, 75]]]) flatL(D, [a, b, c], p[3], 0.7);
      for (const [a, b] of [[[33, 44], [31, 62]], [[45, 44], [46.6, 60]], [[24, 54], [21, 68]]]) flatL(D, [a, b], p[2]);
      for (let k = 0; k < 7; k++) { const x = 19 + k * 7; D.spark(x, 67 + (k % 2) * 2, k % 3 ? '#8a5a40' : gl, true); }
      D.G([[30, 36], [50, 36], [46, 43], [40, 45.6], [34, 43]], dkr);
    });
    const hood = (name, x, y, r, ph, kind, z) => R.part(name, { px: x, py: y + r * 1.6, z, role: 'head', amp: 1, ph, parent: 'robe', lift: 1.5 + r * 0.2, morph: true, flare: true, sp: 1 }, (D, m) => {
      const pal = z > 4 ? lit : p; D.L([[x, y + r * 2.1], [x, y + r * 0.8]], r * 0.8, r * 0.7, z > 4 ? p : dkr);
      D.G([[x - r, y + r * 1.2], [x - r * 1.06, y - r * 0.2], [x - r * 0.5, y - r * 1.1], [x + r * 0.16, y - r * 1.62], [x + r * 0.7, y - r * 0.9], [x + r * 1.06, y], [x + r, y + r * 1.2], [x, y + r * 1.5]], pal);
      D.flat(D.el(x + r * 0.04, y + r * 0.24, r * 0.66, r * 0.86), VOID, pal[0]);
      const gc = m > 0.4 ? '#fff3c0' : gl;
      if (kind === 0) { D.flat(D.el(x, y + r * 0.2, 0.7 + m * 1.6, r * 0.62), gc); D.px(x, y + r * 0.1, '#ffffff'); D.px(x, y - r * 0.5, gl); D.px(x, y + r * 0.86, gl); }
      else if (kind === 1) { D.rect(x - r * 0.4, y + r * 0.3, r * 0.9, 0.8 + m * 1.4, MAWC); D.fangs(x - r * 0.4, x + r * 0.5, y + r * 0.3, 1, 1, 1.6); D.px(x - r * 0.26, y - r * 0.16, gc); }
      else if (kind === 2) { for (const [dx, dy] of [[-0.3, -0.1], [0.24, 0.1], [-0.06, 0.5]]) { D.px(x + r * dx, y + r * dy, gc); if (m > 0.4) D.px(x + r * dx + 1, y + r * dy, gl); } }
      else if (kind === 3) { D.G([[x - r * 0.4, y + r * 0.36], [x + r * 0.44, y + r * 0.36], [x + r * 0.3, y + r * 0.96], [x - r * 0.26, y + r * 0.96]], fl); D.rect(x - r * 0.2, y + r * 0.6, r * 0.44, 0.7 + m, MAWC); }
      else { D.eye(x, y + r * 0.2, Math.max(1.4, r * 0.34), gl, true); flatL(D, [[x - r * 0.2, y + r * 0.7], [x - r * 0.3, y + r * 1.3 + m * 2]], '#0a0610', 0.6); }
      D.px(x - r * 0.5, y - r * 0.7, pal[2]); D.px(x - r * 0.3, y - r * 0.96, pal[2]);
    });
    hood('h3', 13.6, 42, 6, 2.2, 4, 3); hood('h4', 66.6, 41, 6.4, 3.8, 3, 3); hood('h1', 25, 28.6, 7.4, 1.1, 1, 4); hood('h2', 56, 27, 7.8, 4.9, 2, 4); hood('h0', 40, 17.6, 9.6, 0, 0, 5);
    R.part('armL', { px: 31, py: 48, z: 6, role: 'arm', amp: 0.4, parent: 'robe', cast: 0.5, strike: 0.5 }, D => { D.L([[30, 47], [26, 55], [32, 58.6]], 3.4, 2.2, lit); D.L([[32, 58.6], [35.6, 58]], 1.2, 0.9, fl); D.px(36.6, 57, fl[1]); D.px(36.6, 59, fl[1]); });
    R.part('armR', { px: 50, py: 48, z: 6, role: 'arm', amp: 0.4, ph: 2, parent: 'robe', cast: -0.7, strike: -0.3 }, D => { D.L([[50, 47], [55, 54], [50.6, 57]], 3.4, 2.2, lit); D.L([[50.6, 57], [47.4, 56]], 1.2, 0.9, fl); D.rect(46, 52.6, 0.9, 4, '#3a2a1a'); });
    R.part('lamp', { px: 46.4, py: 56.6, z: 7, role: 'sway', amp: 0.9, parent: 'armR' }, D => { flatL(D, [[46.4, 56.6], [46.4, 60]], '#3a2a1a'); D.flat(D.el(46.4, 64, 3.6, 4.4), '#ffd070', '#3a2410'); D.flat(D.el(46.2, 63.8, 1.8, 2.6), '#fff8d8'); D.rect(43.2, 60, 6.6, 1, '#5a3a1a'); D.rect(43.2, 68, 6.6, 1, '#5a3a1a'); D.px(46, 62.6, '#ffffff'); });
    R.part('bell', { px: 36.6, py: 58, z: 7, role: 'sway', amp: 1.2, ph: 1.6, parent: 'armL' }, D => { D.G([[34.6, 60], [38.6, 60], [40.4, 66], [32.8, 66]], P.gold); D.px(36.6, 67, P.gold[3]); D.px(35, 61.6, '#ffffff'); });
  };
  // 기아: 몸이 통째로 아가리. 윗턱이 들리고, 갈비뼈가 손가락처럼 벌어진다
  BOSS.hunger = R => {
    const p = P.hunger, q = P.hunger2, dk = dkp(p), bn = P.bone, tg = ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038'];
    R.ichor = '#6a121c'; R.shw = 32; R.glow = '#ff8a7a';
    for (const [k, dir] of [[0, -1], [1, 1]]) for (let j = 0; j < 3; j++) R.part('rib' + k + j, { px: 40 + dir * 22, py: 52 - j * 2, z: 1, role: 'sway', amp: 0.3, ph: j * 1.3 + k * 2, cast: dir * 0.3 }, D => { const x = 40 + dir * 22, y = 52 - j * 3; D.L([[x, y], [x + dir * (8 + j * 2), y - 8 - j * 5], [x + dir * (6 + j), y - 17 - j * 7], [x + dir * (1 + j), y - 21 - j * 7.6]], 2, 0.8, bn); });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('arm' + k, { px: 40 + dir * 24, py: 60, z: 2, role: 'arm', ph: k * 2.4, amp: 0.3, strike: -dir * 0.3 }, D => { const x = 40 + dir * 24; D.L([[x, 58], [x + dir * 9, 62], [x + dir * 8.6, 72]], 5, 3.6, q); D.G([[x + dir * 4.6, 77], [x + dir * 7, 71], [x + dir * 14, 77]], q); for (let c = 0; c < 3; c++) D.G([[x + dir * (6 + c * 3.4), 77.4], [x + dir * (7.4 + c * 3.4), 73.6], [x + dir * (9 + c * 3.4), 77.4]], bn, null); });
    R.part('lower', { px: 40, py: 77, z: 3, role: 'body', amp: 0.5 }, D => {
      D.G([[11, 56], [69, 56], [66, 72], [56, 77], [24, 77], [14, 72]], q); D.B(40, 60, 29, 15, q);
      D.flat(D.el(40, 55, 25, 12.6), MAWC, q[0]); D.flat(D.el(40, 57, 18, 9), GUM); D.flat(D.el(40, 58, 11, 6), VOID);
      ringTeeth(D, 40, 58.6, 12.6, 6.6, 11, 2.6, 0.3, [bn[0], bn[3], bn[1], '#7a7468']);
      for (let k = 0; k < 9; k++) { const x = 18 + k * 5.5, h = 5 + (k % 2) * 2.4 + (k === 4 ? 2 : 0), y = 63.6 - Math.abs(k - 4) * 0.9; D.G([[x - 2, y + 2.6], [x + (k % 3 - 1) * 0.6, y - h], [x + 2, y + 2.6]], bn); }
      for (const [x, y] of [[17, 68], [24, 72], [58, 71.6], [64, 67], [40, 73.6]]) { D.px(x, y, q[2]); D.px(x + 1, y + 1, q[3]); }
      for (const [a, b] of [[[20, 70], [30, 74]], [[50, 74.6], [61, 70]]]) flatL(D, [a, b], q[3]);
    });
    [[30, -6, 0, 13], [41, 3, 1.6, 17], [50, 7, 3.4, 10]].forEach(([x, dx, ph, len], k) => R.part('tongue' + k, { px: x, py: 58, z: 4, role: 'sway', amp: 0.5, ph, parent: 'lower', reach: 0 }, D => { D.L([[x, 57], [x + dx * 0.5, 57 + len * 0.5], [x + dx, 57 + len], [x + dx * 1.3, 57 + len * 1.16]], 2.6, 1.2, tg); D.px(x + dx * 0.4, 57 + len * 0.4, '#ffd0d8'); if (k === 1) { D.flat(D.el(x + dx * 1.2, 57 + len * 1.1, 1.6, 1.2), MAWC); D.px(x + dx * 1.2 - 0.8, 57 + len * 1.1, TOOTH); D.px(x + dx * 1.2 + 0.8, 57 + len * 1.1, TOOTH); } }));
    R.part('upper', { px: 40, py: 48, z: 6, role: 'pulse', amp: 0.12 }, D => {
      D.B(40, 34, 28, 15.6, p); D.G([[12.6, 36], [67.4, 36], [64, 46.6], [16, 46.6]], p);
      D.flat(D.poly([[15, 44], [65, 44], [62, 49], [18, 49]]), GUM, p[0]);
      for (let k = 0; k < 10; k++) { const x = 17.6 + k * 5, h = 6 + (k % 2) * 3 + (k === 2 || k === 7 ? 4 : 0), y = 47; D.G([[x - 2.2, y], [x + 2.2, y], [x + (k % 3 - 1) * 0.7, y + h]], bn); }
      for (const [x, y, r, s] of [[27, 30, 2.6, 1], [34.6, 25.6, 1.6, 0], [46, 28, 3.2, 1], [55, 32.6, 1.8, 0], [20, 35.6, 1.4, 0], [40.6, 33.6, 1.3, 0], [60.6, 38, 1.2, 0]]) D.eye(x, y, r, '#f0d040', s);
      for (const [a, b] of [[[18, 30], [24, 24]], [[52, 22.6], [60, 28]], [[32, 38], [44, 39.6]], [[50, 38], [58, 40.6]]]) flatL(D, [a, b], p[3], 0.6);
      for (const [x, y] of [[24, 23], [30, 21], [37, 20.4], [22, 27]]) D.px(x, y, '#ffd0c8'); flatL(D, [[26, 22.6], [34, 20.4]], '#ffb0a8', 0.6);
    });
    [[24, -3, 0], [38, 1, 1.7], [52, 2.6, 3.2], [60, 4, 4.4]].forEach(([x, dx, ph], k) => R.part('spine' + k, { px: x, py: 22, z: 5, role: 'sway', amp: 0.3, ph, parent: 'upper' }, D => { const y = 20.6 + Math.abs(x - 40) * 0.2; D.G([[x - 2.2, y + 3], [x + dx, y - 7 - (k % 2) * 3], [x + 2.4, y + 3]], bn); }));
    R.pose = (anim, f, G, T, fx, s) => { const open = anim === 'attack' ? (f < 0.32 ? ease(f / 0.32) : f < 0.46 ? 1 - 1.25 * (f - 0.32) / 0.14 : -0.25 * (1 - (f - 0.46) / 0.54)) : anim === 'cast' ? s.rise * 1.2 : anim === 'idle' ? 0.25 + 0.25 * sin(f * TAU) : anim === 'hit' ? 0.5 * s.hr : 0.2; T.upper.dy -= open * 9; T.upper.rot += open * -0.05; for (const k of [0, 1, 2]) if (T['tongue' + k]) T['tongue' + k].sy = 1 + open * 0.2; };
  };
  // 처음 모습: 떨어져 나온 한 방울. 아직 무엇도 아니다
  BOSS.drop = R => {
    const p = ['#07050c', '#2a2440', '#6a5a98', '#16122a'], dk = dkp(p), gl = '#cdbcff';
    R.ichor = '#16122a'; R.shw = 24; R.glow = gl;
    R.part('pool', { px: 40, py: 76, z: 0 }, D => { D.flat(D.el(40, 75.6, 26, 3), '#0e0b1c', '#07050c'); D.flat(D.el(33, 75, 9, 0.8), '#2a2440'); D.px(52, 75.4, gl); D.px(22, 76, gl); });
    [[20, -1, 0, 13], [30, -0.4, 1.6, 9], [52, 0.5, 3.1, 10], [61, 1, 4.6, 14]].forEach(([x, dir, ph, len], k) => R.part('bud' + k, { px: x, py: 72, z: 1, role: 'sway', amp: 0.6, ph, strike: -dir * 0.5 }, D => tent(D, [[x, 73], [x + dir * 3, 73 - len * 0.5], [x + dir * 7, 73 - len], [x + dir * 6, 73 - len * 1.3]], 3, 0.8, dk, null)));
    R.part('body', { px: 40, py: 76, z: 3, role: 'body', amp: 1 }, D => {
      D.shade(D.poly([[18, 76], [20, 62], [27, 48], [35, 37], [39.6, 27], [44, 36], [53, 48], [60, 62], [62, 76]]), (x, y) => { const v = -(x - 40) * 0.03 - (y - 56) * 0.036 + (hsh(Math.round(x / 3), Math.round(y / 3)) - 0.5) * 0.16; return v > 0.52 ? p[2] : v > 0.08 ? p[1] : v > -0.4 ? p[3] : '#0c0a18'; }, p[0]);
      for (const [x, y] of [[30, 52], [50, 66], [26, 68], [46, 44], [34, 70], [54, 58]]) { D.px(x, y, gl); D.px(x + 1, y + 1, '#3a2580'); }
      D.L([[36, 38], [31, 48], [27.6, 58]], 0.7, 0.6, ['#0000', '#a898d8', '#a898d8', '#a898d8'], null); D.px(38, 33, '#ffffff'); D.px(37, 35, '#e8e0ff');
      for (const [x, y] of [[24, 60], [56, 70], [44, 72]]) { D.flat(D.el(x, y, 1.4, 1), INK); D.px(x, y, '#f0a04a'); }
    });
    eyeP(R, 'eye', 40, 55, 7.6, 0.6, 0.6, '#f0a04a', p, { parent: 'body', z: 5, amp: 0.3 });
    R.part('drip', { px: 40, py: 26, z: 4, role: 'float', amp: 1.2, parent: 'body' }, D => { D.B(40, 19.6, 2.2, 2.8, p); D.px(39.4, 18.4, '#ffffff'); });
  };
  // ---------- 연출: 점 단위로 찍는 붓. from·to 는 화면 좌표, t 는 0..1 ----------
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function pen(ctx, s) {
    const q = v => Math.round(v / s) * s, g = { s, ctx,
      a(v) { ctx.globalAlpha = clamp(v, 0, 1); return g; },
      add(on) { ctx.globalCompositeOperation = on ? 'lighter' : 'source-over'; return g; },
      dot(x, y, c, w, h) { ctx.fillStyle = c; ctx.fillRect(q(x), q(y), (w || 1) * s, (h || 1) * s); return g; },
      sq(x, y, c, w) { w = Math.max(1, Math.round(w || 1)); ctx.fillStyle = c; ctx.fillRect(q(x - (w - 1) * s / 2), q(y - (w - 1) * s / 2), w * s, w * s); return g; },
      ell(x, y, rx, ry, c) { ctx.fillStyle = c; const R = Math.max(0.5, ry / s), cx = q(x), cy = q(y); for (let j = -Math.floor(R); j <= Math.floor(R); j++) { const w = Math.round(rx / s * Math.sqrt(Math.max(0, 1 - (j * j) / (R * R + 0.3)))); ctx.fillRect(cx - w * s, cy + j * s, (w * 2 + 1) * s, s); } return g; },
      disc(x, y, r, c) { return g.ell(x, y, r, r, c); },
      ring(x, y, rx, ry, c, w, keep) { const n = Math.max(8, Math.ceil(TAU * Math.max(rx, ry) / s)); for (let k = 0; k < n; k++) { if (keep && !keep(k / n)) continue; const an = k / n * TAU; g.sq(x + cos(an) * rx, y + sin(an) * ry, c, w || 1); } return g; },
      line(x0, y0, x1, y1, c, w) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / s)); for (let k = 0; k <= n; k++) g.sq(lerp(x0, x1, k / n), lerp(y0, y1, k / n), c, w || 1); return g; },
      poly(pts, c, edge) { ctx.fillStyle = c; let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } for (let y = q(y0); y <= y1; y += s) { const yy = y + s / 2, xs = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy) !== (b[1] <= yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort((m, n) => m - n); for (let i = 0; i + 1 < xs.length; i += 2) { const xa = q(xs[i]), xb = q(xs[i + 1]); ctx.fillRect(xa, y, Math.max(s, xb - xa), s); } } if (edge) for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; g.line(a[0], a[1], b[0], b[1], edge, 1); } return g; } };
    return g;
  }
  const star = (g, x, y, c, big) => { g.dot(x, y, c); if (big) { g.dot(x - g.s, y, c); g.dot(x + g.s, y, c); g.dot(x, y - g.s, c); g.dot(x, y + g.s, c); } };
  const rays = (g, x, y, r, n, c, rot, len, w) => { for (let k = 0; k < n; k++) { const an = rot + k * TAU / n; g.line(x + cos(an) * r, y + sin(an) * r, x + cos(an) * (r + len), y + sin(an) * (r + len), c, w || 1); } };
  const fangRow = (g, x, y, w, dir, n, len, c) => { for (let k = 0; k < n; k++) { const fx = x - w / 2 + (k + 0.5) * w / n, h = len * (1 - Math.abs((k + 0.5) / n - 0.5) * 0.8); g.poly([[fx - w / n * 0.46, y], [fx + w / n * 0.46, y], [fx, y + dir * h]], c || TOOTH); g.dot(fx - g.s, y + dir * g.s, '#ffffff'); } };
  // 위아래 턱. open 1 = 벌림, 0 = 다뭄
  const jaws = (g, x, y, w, open, pal) => { const gap = open * w * 0.55, h = w * 0.3; for (const dir of [-1, 1]) { const y0 = y + dir * gap; g.poly([[x - w / 2, y0 + dir * h * 0.4], [x - w * 0.34, y0 + dir * h], [x + w * 0.34, y0 + dir * h], [x + w / 2, y0 + dir * h * 0.4], [x + w * 0.46, y0], [x - w * 0.46, y0]], pal[1], pal[0]); g.line(x - w * 0.3, y0 + dir * h * 0.72, x + w * 0.1, y0 + dir * h * 0.72, dir < 0 ? pal[2] : pal[3], 1); g.line(x - w * 0.42, y0 + dir * g.s, x + w * 0.42, y0 + dir * g.s, GUM, 1); fangRow(g, x, y0, w * 0.86, -dir, 6, h * 0.95, TOOTH); } };
  const tentFx = (g, a, b, k, t, pal, w0) => { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, n = Math.max(4, Math.ceil(d * k / (g.s * 1.5))), pt = f => { const w = sin(f * 7 - t * 14) * d * 0.06 * (1 - f * 0.6) * Math.min(1, f * 4); return [a.x + dx * f * k + nx * w, a.y + dy * f * k + ny * w]; };
    for (const pass of [0, 1]) for (let i = 0; i <= n; i++) { const f = i / n, p = pt(f), w = Math.round(lerp(w0 || 4, 1.6, f)); if (!pass) g.sq(p[0], p[1], pal[0], w + 2); else { g.sq(p[0], p[1], pal[1], w); if (w > 2) g.dot(p[0] - g.s, p[1] - g.s, pal[2]); if (i % 3 === 0) g.dot(p[0], p[1] + g.s, pal[3]); } } return pt(1); };
  const maskFx = (g, x, y, sc, crack) => { const s = g.s * sc; g.ell(x, y, 3.6 * s, 4.6 * s, INK); g.ell(x, y, 3 * s, 4 * s, '#e4dfd0'); g.ell(x - s, y - 1.4 * s, 1.6 * s, 2 * s, '#ffffff'); g.dot(x - 2 * s, y - s, INK, sc, sc); g.dot(x + s, y - s, INK, sc, sc); g.dot(x - s, y + 2 * s, '#7a121c', 3 * sc, sc); if (crack) g.line(x + s, y - 4 * s, x, y - s, INK, 1); };
  const glyph = (g, x, y, k, c) => { const pat = [[0, 1, 1, 0, 1, 0, 0, 1, 1], [1, 0, 1, 0, 1, 0, 1, 0, 1], [1, 1, 0, 1, 0, 0, 1, 1, 1], [0, 1, 0, 1, 1, 1, 0, 1, 0], [1, 0, 0, 1, 1, 0, 0, 1, 1]][((k % 5) + 5) % 5]; for (const [c2, oy] of [[INK, g.s], [c, 0]]) for (let i = 0; i < 9; i++) if (pat[i]) g.dot(x + (i % 3 - 1) * g.s, y + (Math.floor(i / 3) - 1) * g.s + oy, c2); };
  const flame = (g, x, y, w, h, t, sd) => { for (const [c, k] of [['#a8242c', 1], ['#f07a20', 0.74], ['#ffd040', 0.46], ['#fff8d8', 0.2]]) for (let j = 0; j < h; j += g.s) { const f = j / h, hw = w * k * (1 - f * f) * (0.82 + 0.18 * sin(j * 0.5 + t * 40 + sd)) * (f < 0.1 ? 0.6 + f * 4 : 1), off = sin(j * 0.21 + t * 22 + sd) * w * 0.12 * f; if (hw >= g.s * 0.5 && f < 0.4 + k * 0.6) g.dot(x - hw + off, y - j, c, Math.max(1, Math.round(hw * 2 / g.s)), 1); } };
  const FX = {};
  // 응시: 모았다가 쏘는 광선
  FX.beam = (g, a, b, t, o) => { const U = o.size, ch = seg(t, 0, 0.25), fire = seg(t, 0.25, 0.38), fade = seg(t, 0.72, 1), c1 = o.col || '#cdbcff', c2 = o.col2 || '#6a4fc8';
    if (t < 0.3) { for (let k = 0; k < 8; k++) { const an = k * 0.785 + t * 9, r = (1 - ch) * U * 0.42 + g.s * 2; g.dot(a.x + cos(an) * r, a.y + sin(an) * r, k % 2 ? c1 : '#fff3a0'); } g.disc(a.x, a.y, ch * U * 0.1 + g.s, c2); g.disc(a.x, a.y, ch * U * 0.06, '#ffffff'); }
    if (t >= 0.25) { const ex = lerp(a.x, b.x, fire), ey = lerp(a.y, b.y, fire), w = Math.max(1, Math.round((1 - fade) * (U / 16 / g.s * 2 + (Math.floor(t * 40) % 2)))), d = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / d, ny = (b.x - a.x) / d;
      g.add(true).a(0.5 * (1 - fade)).line(a.x, a.y, ex, ey, c2, w + 6).add(false); g.a(1 - fade * 0.7).line(a.x, a.y, ex, ey, c2, w + 2).line(a.x, a.y, ex, ey, c1, w).line(a.x, a.y, ex, ey, '#ffffff', Math.max(1, w - 2));
      for (let k = 0; k < 9; k++) { const f = ((k / 9 + t * 1.7) % 1) * fire, wv = sin(f * 20 + t * 30 + k) * U * 0.12; g.dot(lerp(a.x, b.x, f) + nx * wv, lerp(a.y, b.y, f) + ny * wv, k % 3 ? c1 : '#fff3a0'); }
      g.disc(a.x, a.y, U * 0.09 * (1 - fade), '#ffffff');
      if (fire >= 1) { const r = seg(t, 0.38, 0.8) * U * 0.42; g.ring(b.x, b.y, r, r * 0.6, c1, 1).ring(b.x, b.y, r * 0.6, r * 0.36, '#ffffff', 1); g.disc(b.x, b.y, U * 0.14 * (1 - fade), '#ffffff'); rays(g, b.x, b.y, r * 0.5, 6, '#fff3a0', t * 5, U * 0.14 * (1 - fade)); } }
    g.a(1); };
  // 끌어당김: 뻗어 감고 끌고 온다
  FX.pull = (g, a, b, t, o) => { const U = o.size, k = t < 0.3 ? ease(t / 0.3) : t < 0.45 ? 1 : 1 - ease((t - 0.45) / 0.55) * (o.keep == null ? 0.72 : o.keep), pal = ['#06141c', '#1f8f8a', '#8fe8d8', '#e8fff8'], tip = tentFx(g, a, b, k, t, pal, 5);
    if (t >= 0.28) { g.ring(tip[0], tip[1], U * 0.17, U * 0.13, pal[0], 3).ring(tip[0], tip[1], U * 0.17, U * 0.13, pal[1], 1, f => (f * 8 + t * 6) % 1 < 0.75); if (t < 0.5) rays(g, tip[0], tip[1], U * 0.2, 6, '#e8fff8', t * 3, U * 0.12 * (1 - seg(t, 0.28, 0.5))); }
    for (let i = 0; i < 5; i++) { const f = hsh(i, 3), p = seg(t, 0.2 + f * 0.3, 0.6 + f * 0.4); if (p > 0 && p < 1) g.dot(lerp(a.x, b.x, f * k) + (hsh(i, 5) - 0.5) * U * 0.3, lerp(a.y, b.y, f * k) + p * U * 0.3, '#8fe8d8'); } };
  // 후려침: 뻗어 치고 거둔다
  FX.lash = (g, a, b, t, o) => { const U = o.size, k = t < 0.35 ? ease(t / 0.35) : t < 0.5 ? 1 : 1 - ease((t - 0.5) / 0.5); if (k > 0.03) tentFx(g, a, b, k, t, ['#06141c', '#1f8f8a', '#8fe8d8', '#e8fff8'], 3);
    if (t > 0.3 && t < 0.75) { const p = seg(t, 0.3, 0.75); g.a(1 - p); for (let i = 0; i < 9; i++) { const an = -2.4 + i * 0.3; g.sq(b.x + cos(an) * U * 0.32, b.y + sin(an) * U * 0.32 + U * 0.08, i > 2 && i < 7 ? '#ffffff' : '#8fe8d8', i > 2 && i < 7 ? 2 : 1); } rays(g, b.x, b.y, U * 0.12 + p * U * 0.2, 5, '#e8fff8', 0.4, U * 0.1); g.a(1); } };
  // 삼킴: 바닥에서 솟은 두 잎이 닫힌다
  FX.swallow = (g, a, b, t, o) => { const U = o.size, gy = b.y + U * 0.34, up = ease(seg(t, 0, 0.28)), shut = ease(seg(t, 0.3, 0.5)), sink = ease(seg(t, 0.8, 1)), R = U * 0.5, H = U * 0.95 * up * (1 - sink), gap = (1 - shut) * R * 0.75, gulp = t > 0.5 && t < 0.8 ? sin(seg(t, 0.5, 0.8) * Math.PI * 3) * U * 0.03 : 0;
    g.ell(b.x, gy, R * 1.15 * Math.max(up, 0.2), U * 0.1, '#06141c').ell(b.x, gy, R * Math.max(up, 0.2), U * 0.07, '#0a2a34'); g.ring(b.x, gy, R * (1.1 + seg(t, 0.8, 1) * 0.5), U * 0.09 * (1 + seg(t, 0.8, 1) * 0.5), '#8fe8d8', 1, f => (f * 12) % 1 < 0.5);
    if (H > g.s * 2) for (const dir of [-1, 1]) { const pts = [[b.x + dir * R, gy], [b.x + dir * (R * 1.12 + gulp), gy - H * 0.5], [b.x + dir * (R * 0.5 + gap * 0.6), gy - H], [b.x + dir * gap * 0.5, gy - H * 0.86], [b.x + dir * gap, gy - H * 0.3], [b.x + dir * R * 0.2, gy]]; g.poly(pts, dir < 0 ? '#1f8f8a' : '#0f5560', '#06141c'); g.line(b.x + dir * R * 0.86, gy - H * 0.2, b.x + dir * R * 0.9, gy - H * 0.56, dir < 0 ? '#8fe8d8' : '#1f8f8a', 1);
      if (shut < 1) for (let k = 0; k < 5; k++) { const f = (k + 0.5) / 5, x = lerp(b.x + dir * gap * 0.5, b.x + dir * gap, f), y = lerp(gy - H * 0.86, gy - H * 0.3, f); g.poly([[x, y - U * 0.04], [x, y + U * 0.04], [x - dir * U * 0.1, y]], TOOTH); } }
    if (shut >= 1 && sink < 1) { for (let k = 0; k < 6; k++) g.dot(b.x - g.s, gy - H * (0.3 + k * 0.1), k % 2 ? TOOTH : '#06141c', 2, 1); if (t < 0.62) rays(g, b.x, gy - H * 0.6, R * 0.8, 8, '#e8fff8', 0.2, U * 0.12 * (1 - seg(t, 0.5, 0.62))); } };
  // 큰 한 입
  FX.bigbite = (g, a, b, t, o) => { const U = o.size, open = t < 0.4 ? 1 - ease(t / 0.4) * 0.15 : t < 0.5 ? lerp(0.85, 0, (t - 0.4) / 0.1) : 0, pal = o.pal || ['#22060a', '#b02a34', '#f08a7a', '#6a121c']; g.a(t < 0.12 ? t / 0.12 : 1 - seg(t, 0.75, 1)); jaws(g, b.x, b.y, U * (o.wide || 0.95), open, pal); g.a(1);
    if (t >= 0.5 && t < 0.8) { const p = seg(t, 0.5, 0.8); rays(g, b.x, b.y, U * (0.3 + p * 0.3), 10, '#ffffff', 0.3, U * 0.16 * (1 - p), 1); for (let k = 0; k < 8; k++) { const an = hsh(k, 9) * TAU, r = p * U * 0.6; g.dot(b.x + cos(an) * r, b.y + sin(an) * r + p * p * U * 0.3, o.blood || '#e06050', 1, 1); } } };
  // 물어뜯기: 세 번, 마지막은 피
  FX.bites = (g, a, b, t, o) => { const U = o.size, n = o.n || 3, i = Math.min(n - 1, Math.floor(t * n)), lt = t * n - i, ox = [-0.16, 0.18, 0][i % 3] * U, oy = [-0.12, 0.06, 0][i % 3] * U, open = lt < 0.45 ? 1 - ease(lt / 0.45) : 0, last = i === n - 1;
    jaws(g, b.x + ox, b.y + oy, U * (last ? 0.95 : 0.74), open * 0.8, ['#0c1c0c', '#5a9a34', '#c0e878', '#2c5c24']);
    if (lt >= 0.45) { const p = seg(lt, 0.45, 1); g.a(1 - p); for (const d of [-1, 0, 1]) g.line(b.x + ox - U * 0.3 + d * U * 0.1, b.y + oy - U * 0.28, b.x + ox + U * 0.2 + d * U * 0.1, b.y + oy + U * 0.28, last ? '#ff5a4a' : '#ffffff', last ? 2 : 1); g.a(1); if (last) for (let k = 0; k < 9; k++) { const an = -2.6 + hsh(k, 2) * 2, r = p * U * (0.3 + hsh(k, 4) * 0.4); g.dot(b.x + cos(an) * r, b.y + sin(an) * r + p * p * U * 0.5, k % 3 ? '#c8242c' : '#ff8a7a', k % 4 ? 1 : 2, k % 4 ? 1 : 2); } } };
  // 포자 구름
  FX.cloud = (g, a, b, t, o) => { const U = o.size * (o.r || 1), grow = ease(seg(t, 0, 0.4)), fade = seg(t, 0.65, 1); g.a(0.86 * (1 - fade));
    for (const [c, k, off] of [['#2c5c24', 1.12, 0], ['#8aa83a', 1, 0], ['#e0f090', 0.55, -0.14]]) for (let i = 0; i < 8; i++) { const an = i * 0.785 + hsh(i, 1) + t * (i % 2 ? 0.8 : -0.6), r = U * 0.34 * grow * (0.5 + hsh(i, 7) * 0.5), pr = U * (0.16 + hsh(i, 3) * 0.12) * grow * k * (1 - fade * 0.4); g.disc(b.x + cos(an) * r + off * pr, b.y + sin(an) * r * 0.7 + off * pr, pr, c); }
    g.a(1 - fade); for (let i = 0; i < 16; i++) { const an = hsh(i, 11) * TAU, r = U * 0.6 * grow * hsh(i, 13), y = b.y + sin(an) * r * 0.7 - t * U * 0.3 * hsh(i, 5); star(g, b.x + cos(an) * r + sin(t * 9 + i) * g.s * 2, y, i % 3 ? '#e8ff7a' : '#ffffff', i % 5 === 0); } g.a(1); };
  // 부화: 알이 떨다 깨지고 새끼가 뛰어나온다
  FX.hatch = (g, a, b, t, o) => { const U = o.size, n = o.n || 3;
    for (let i = 0; i < n; i++) { const x = b.x + (i - (n - 1) / 2) * U * 0.3, y = b.y + U * 0.18 + (i % 2) * U * 0.06, d = i * 0.08, lt = seg(t, d, d + 0.75), wob = lt < 0.4 ? sin(lt * 50) * g.s * (lt * 3) : 0;
      if (lt < 0.45) { g.ell(x + wob, y, U * 0.14, U * 0.18, '#2a3010').ell(x + wob, y, U * 0.11, U * 0.15, '#d8e8a0').ell(x + wob - g.s * 2, y - g.s * 3, U * 0.04, U * 0.05, '#f8ffd8'); g.ell(x + wob + g.s, y + g.s, U * 0.05, U * 0.06, '#5a7030'); g.dot(x + wob + g.s, y, '#ff5040'); if (lt > 0.18) { g.line(x + wob - g.s * 2, y - g.s * 3, x + wob, y - g.s, '#2a3010', 1).line(x + wob, y - g.s, x + wob + g.s * 2, y, '#2a3010', 1); } }
      else { const p = seg(lt, 0.45, 1), hop = sin(p * Math.PI) * U * 0.22; for (let k = 0; k < 5; k++) { const an = -2.8 + k * 0.6, r = p * U * 0.3; g.a(1 - p).dot(x + cos(an) * r, y + sin(an) * r + p * p * U * 0.25, k % 2 ? '#d8e8a0' : '#f8ffd8', 2, 1); } g.a(1); g.ell(x, y + g.s * 2, U * 0.09, U * 0.03, '#98a860'); g.ell(x, y - hop, U * 0.11, U * 0.085, '#0c1c0c').ell(x, y - hop, U * 0.085, U * 0.06, '#5a9a34').ell(x - g.s, y - hop - g.s, U * 0.04, U * 0.02, '#c0e878'); g.dot(x - g.s * 2, y - hop - g.s, '#f0e060').dot(x + g.s, y - hop - g.s, '#f0e060'); g.dot(x - g.s, y - hop + g.s, TOOTH, 2, 1); if (p < 0.4) rays(g, x, y, U * 0.12, 5, '#f8ffd8', i, U * 0.08); } } };
  // 조개 닫기: 껍데기 둘이 닫히고 도발의 물결
  FX.shell = (g, a, b, t, o) => { const U = o.size, cl = ease(seg(t, 0, 0.3)), fade = seg(t, 0.85, 1), R = U * 0.52, cy = a.y - U * 0.1, gap = (1 - cl) * R * 0.9; g.a(0.92 * (1 - fade));
    for (const dir of [-1, 1]) { const x0 = a.x + dir * gap, pts = []; for (let k = 0; k <= 8; k++) { const an = -Math.PI / 2 + dir * k / 8 * Math.PI; pts.push([x0 + cos(an) * R * 0.62 * (dir > 0 ? 1 : 1), cy + sin(an) * R]); } g.poly(pts, dir < 0 ? '#c8b070' : '#a89058', '#1a1408'); for (let k = 1; k < 4; k++) { const an = -Math.PI / 2 + dir * k / 4 * Math.PI; g.line(x0, cy, x0 + cos(an) * R * 0.56, cy + sin(an) * R * 0.92, '#7a6638', 1); } g.dot(x0 + dir * R * 0.3, cy - R * 0.5, '#f8ecb8', 2, 2); for (const [bx, by] of [[0.36, 0.3], [0.2, -0.2]]) { g.sq(x0 + dir * R * bx, cy + R * by, '#1a1408', 3).sq(x0 + dir * R * bx, cy + R * by, '#8fe8d8', 1); } }
    if (cl >= 1) { const p = seg(t, 0.3, 0.5); g.a((1 - p) * 0.9).line(a.x - R * 0.5 + p * R, cy - R, a.x - R * 0.7 + p * R, cy + R, '#ffffff', 2); g.a(1 - fade); for (const d of [0, 0.33, 0.66]) { const q2 = ((t - 0.3) * 2 + d) % 1, r = U * (0.5 + q2 * 0.7); g.a((1 - q2) * (1 - fade)).ring(a.x, a.y + U * 0.3, r, r * 0.34, '#e8d48a', 1, f => (f * 14) % 1 < 0.6); } } g.a(1); };
  // 속삭임: 문양이 흘러가 귀에 닿는다
  FX.whisper = (g, a, b, t, o) => { const U = o.size, d = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / d, ny = (b.x - a.x) / d, c = o.col || '#f0a04a', at = f => [lerp(a.x, b.x, f) + nx * sin(f * 9 + t * 5) * U * 0.14 * sin(f * Math.PI), lerp(a.y, b.y, f) + ny * sin(f * 9 + t * 5) * U * 0.14 * sin(f * Math.PI)];
    g.a(0.6); for (let k = 0; k < 26; k++) { const f = k / 26; if (f < seg(t, 0, 0.5) && f > seg(t, 0.5, 0.95)) { const p = at(f); g.dot(p[0], p[1], k % 2 ? '#7a4a3a' : c); } } g.a(1);
    for (let k = 0; k < 4; k++) { const f = seg(t, k * 0.1, 0.45 + k * 0.1); if (f > 0 && f < 1) { const p = at(f); glyph(g, p[0], p[1] - g.s, k + Math.floor(t * 10), '#140a12'); glyph(g, p[0], p[1], k + Math.floor(t * 10), k % 2 ? '#fff3c0' : c); } }
    if (t > 0.45) { const p = seg(t, 0.45, 0.85), pop = seg(t, 0.85, 1), r = U * (0.34 + pop * 0.3); g.a(1 - pop); g.ring(b.x, b.y, r, r, '#140a12', 3).ring(b.x, b.y, r, r, c, 1, f => ((f + t * 0.6) * 6) % 1 < 0.7 * p + 0.1); for (let k = 0; k < 6; k++) { const an = k * TAU / 6 - t * 2; glyph(g, b.x + cos(an) * r * 0.7, b.y + sin(an) * r * 0.7, k, c); } g.ell(b.x, b.y, g.s * 1.5, U * 0.16 * p, '#fff3c0').ell(b.x, b.y, g.s * 0.5, U * 0.1 * p, '#140a12'); g.a(1); } };
  // 메아리: 미친 것에서 번지는 고리
  FX.echo = (g, a, b, t, o) => { const U = o.size, c = o.col || '#f0a04a'; for (const d of [0, 0.22, 0.44]) { const p = seg(t, d, d + 0.56); if (p > 0 && p < 1) { const r = U * (0.2 + p * 0.9); g.a(1 - p).ring(b.x, b.y, r, r * 0.8, '#140a12', 4).ring(b.x, b.y, r, r * 0.8, d ? c : '#fff3c0', 2); } } g.a(1 - seg(t, 0.5, 1)); for (let k = 0; k < 6; k++) { const an = k * 1.05 + t * 2; glyph(g, b.x + cos(an) * U * (0.3 + t * 0.5), b.y + sin(an) * U * (0.24 + t * 0.4), k, '#fff3c0'); } g.a(1 - seg(t, 0, 0.3)).disc(b.x, b.y, U * 0.14, '#fff3c0'); g.a(1); };
  // 얼굴 훔치기: 얼굴이 가면이 되어 떠 온다
  FX.mask = (g, a, b, t, o) => { const U = o.size, peel = seg(t, 0, 0.3), fly = ease(seg(t, 0.3, 0.82)), snap = seg(t, 0.82, 1), hy = U * 0.28, x = lerp(b.x, a.x, fly), y = lerp(b.y - hy, a.y - hy, fly) - sin(fly * Math.PI) * U * 0.5;
    if (t > 0.2) { g.a(0.7 * (1 - snap)).ell(b.x, b.y - hy, g.s * 3, g.s * 4, '#07050c'); g.a(1); for (let k = 0; k < 4; k++) { const an = k * 1.57 + t * 4; g.dot(b.x + cos(an) * U * 0.2, b.y - hy + sin(an) * U * 0.2, '#f0a04a'); } }
    if (t < 0.3) { g.a(peel); maskFx(g, b.x, b.y - hy - peel * g.s * 3, 1.5, false); g.a(1); rays(g, b.x, b.y - hy, U * 0.18, 6, '#fff3c0', t * 6, U * 0.1 * peel); }
    else { for (let k = 3; k >= 1; k--) { const f2 = ease(seg(t - k * 0.035, 0.3, 0.82)); g.a(0.5); g.disc(lerp(b.x, a.x, f2), lerp(b.y - hy, a.y - hy, f2) - sin(f2 * Math.PI) * U * 0.5, g.s * (5 - k), k % 2 ? '#f0a04a' : '#7a4a3a'); } g.a(1); maskFx(g, x, y, 1.5, true); if (snap > 0) { g.a(1 - snap).ring(a.x, a.y - hy, U * (0.16 + snap * 0.4), U * (0.16 + snap * 0.4), '#f0a04a', 2); rays(g, a.x, a.y - hy, U * 0.24, 8, '#fff3c0', 0.2, U * 0.2 * snap); g.a(1); } } };
  // 굶주린 돌진: 붉은 자국과 이빨 자국
  FX.dash = (g, a, b, t, o) => { const U = o.size, k = ease(seg(t, 0.08, 0.6)), fade = seg(t, 0.6, 1), d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d, nx = -uy, ny = ux, hx = lerp(a.x, b.x, k), hy = lerp(a.y, b.y, k), c = o.col || '#b02a34';
    if (t < 0.2) for (let i = 0; i < 6; i++) g.dot(a.x - ux * U * 0.2 + (hsh(i, 1) - 0.5) * U * 0.5, a.y - uy * U * 0.2 + (hsh(i, 2) - 0.5) * U * 0.3 - t * U * 0.4, '#8a7a70', 2, 2);
    g.a(1 - fade); for (const [w, col, len] of [[0.34, '#6a121c', 1], [0.22, c, 0.8], [0.08, '#f08a7a', 0.6]]) { const tx = lerp(hx, a.x, len * Math.min(1, k * 1.4)), ty = lerp(hy, a.y, len * Math.min(1, k * 1.4)); g.poly([[hx + nx * U * w, hy + ny * U * w], [hx - nx * U * w, hy - ny * U * w], [tx, ty]], col); }
    for (let i = 0; i < 6; i++) { const f = (i + 0.5) / 6; if (f < k) { const px = lerp(a.x, b.x, f), py = lerp(a.y, b.y, f); for (const sd of [-1, 1]) g.poly([[px + nx * sd * U * 0.3, py + ny * sd * U * 0.3], [px + nx * sd * U * 0.16 - ux * U * 0.05, py + ny * sd * U * 0.16 - uy * U * 0.05], [px + nx * sd * U * 0.16 + ux * U * 0.05, py + ny * sd * U * 0.16 + uy * U * 0.05]], TOOTH); } }
    for (let i = 0; i < 7; i++) { const off = (hsh(i, 3) - 0.5) * U * 0.9, l = U * (0.3 + hsh(i, 4) * 0.5), back = hsh(i, 6) * d * k; g.line(hx - ux * back + nx * off, hy - uy * back + ny * off, hx - ux * (back + l) + nx * off, hy - uy * (back + l) + ny * off, i % 2 ? '#ffffff' : '#f08a7a', 1); } g.a(1);
    if (k < 1 || fade < 0.4) { g.disc(hx, hy, U * 0.3, '#22060a').disc(hx, hy, U * 0.26, c).disc(hx + ux * U * 0.08, hy + uy * U * 0.08, U * 0.18, MAWC); for (let i = 0; i < 8; i++) { const an = i * 0.785; g.sq(hx + ux * U * 0.08 + cos(an) * U * 0.16, hy + uy * U * 0.08 + sin(an) * U * 0.16, TOOTH, 2); } } };
  // 불기둥
  FX.firepillar = (g, a, b, t, o) => { const U = o.size * (o.r || 1), gy = b.y + o.size * 0.3, warn = seg(t, 0, 0.28), up = ease(seg(t, 0.28, 0.42)), down = seg(t, 0.78, 1);
    g.a(0.9 * (1 - down)); g.ell(b.x, gy, U * 0.56, U * 0.2, '#3a0c08'); g.ring(b.x, gy, U * 0.56, U * 0.2, '#f07a20', 1, f => ((f + t) * 10) % 1 < 0.6); if (warn < 1) { g.ring(b.x, gy, U * 0.56 * (1 - warn), U * 0.2 * (1 - warn), '#ffd040', 1); for (let i = 0; i < 6; i++) g.dot(b.x + (hsh(i, 1) - 0.5) * U, gy - warn * U * 0.4 * hsh(i, 2), '#ffd040'); }
    g.a(1); if (t >= 0.28) { const H = U * 2.1 * up * (1 - down * 0.85), W = U * 0.46 * (1 - down * 0.5); flame(g, b.x, gy, W, H, t, o.seed || 0); g.ell(b.x, gy, W * 1.1, U * 0.1, '#ffd040').ell(b.x, gy, W * 0.6, U * 0.05, '#fff8d8');
      for (let i = 0; i < 12; i++) { const f = (hsh(i, 5) + t * 2.2) % 1; star(g, b.x + (hsh(i, 6) - 0.5) * U * 1.1 + sin(f * 9 + i) * g.s * 2, gy - f * U * 2.3, i % 3 ? '#ffd040' : '#fff8d8', i % 4 === 0); }
      if (down > 0) { g.a(down * 0.7 * (1 - seg(t, 0.94, 1))); for (let i = 0; i < 5; i++) g.disc(b.x + (hsh(i, 8) - 0.5) * U * 0.7, gy - U * (0.5 + i * 0.3) - down * U * 0.4, U * 0.14, i % 2 ? '#4a4048' : '#2a2430'); g.a(1); } } };
  // 불붙은 칸
  FX.burnzone = (g, a, b, t, o) => { const U = o.size, gy = b.y + U * 0.34; g.a(0.5).ell(b.x, gy - U * 0.04, U * 0.46, U * 0.18, '#3a0c08'); g.a(1); for (let i = 0; i < 4; i++) { const x = b.x + (i - 1.5) * U * 0.24 + (hsh(i, o.seed || 1) - 0.5) * U * 0.1, h = U * (0.3 + hsh(i, 3) * 0.3) * (0.7 + 0.3 * sin(t * 20 + i * 2)) * Math.min(1, t * 6); flame(g, x, gy - (i % 2) * U * 0.08, U * 0.12, h, t, i * 3); } for (let i = 0; i < 5; i++) { const f = (hsh(i, 7) + t * 1.5) % 1; g.dot(b.x + (hsh(i, 9) - 0.5) * U * 0.8, gy - f * U * 0.9, '#ffd040'); } };
  // 방패 벽
  FX.shieldwall = (g, a, b, t, o) => { const U = o.size, fade = seg(t, 0.85, 1), dy = b.y >= a.y ? 1 : -1; for (let i = 0; i < 3; i++) { const drop = seg(t, i * 0.08, i * 0.08 + 0.22), bounce = drop < 1 ? (1 - ease(drop)) * -U * 0.6 : 0, x = a.x + (i - 1) * U * 0.5, y = a.y + dy * U * 0.3 - U * 0.1 + bounce, w = U * 0.21, h = U * 0.3; if (drop <= 0) continue;
      g.a(0.9 * (1 - fade)); g.poly([[x - w, y - h], [x + w, y - h], [x + w, y + h * 0.3], [x, y + h], [x - w, y + h * 0.3]], '#dce4f4', '#1b1d2a'); g.poly([[x, y - h + g.s], [x + w - g.s, y - h + g.s], [x + w - g.s, y + h * 0.3], [x, y + h - g.s * 2]], '#aab4cc'); g.dot(x - g.s, y - h * 0.7, '#a8242c', 2, Math.round(h * 1.2 / g.s)); g.dot(x - w * 0.7, y - h * 0.3, '#a8242c', Math.round(w * 1.4 / g.s), 2); g.dot(x - w + g.s * 2, y - h + g.s * 2, '#ffffff', 2, 1);
      if (drop >= 1 && t < i * 0.08 + 0.36) { g.a(1 - seg(t, i * 0.08 + 0.22, i * 0.08 + 0.36)); g.ell(x, y + h + g.s * 2, w * 1.6, g.s * 2, '#c8c0b0'); } }
    if (t > 0.4 && t < 0.7) { const p = seg(t, 0.4, 0.7), x = a.x - U * 0.8 + p * U * 1.6; g.a(0.8).line(x, a.y + dy * U * 0.3 - U * 0.46, x - U * 0.14, a.y + dy * U * 0.3 + U * 0.26, '#ffffff', 2); }
    g.a((1 - fade) * 0.8); g.line(a.x - U * 0.8, a.y + dy * U * 0.3 + U * 0.24, a.x + U * 0.8, a.y + dy * U * 0.3 + U * 0.24, '#e8c030', 1); g.a(1); };
  // 기도의 빛
  FX.light = (g, a, b, t, o) => { const U = o.size * (o.r || 1), k = sin(seg(t, 0, 1) * Math.PI), gy = b.y + o.size * 0.3, top = gy - o.size * 2.4;
    g.add(true).a(0.34 * k); g.poly([[b.x - U * 0.2, top], [b.x + U * 0.2, top], [b.x + U * 0.5, gy], [b.x - U * 0.5, gy]], '#b08a28'); g.a(0.42 * k); g.poly([[b.x - U * 0.07, top], [b.x + U * 0.07, top], [b.x + U * 0.24, gy], [b.x - U * 0.24, gy]], '#c8b060'); g.ell(b.x, gy, U * 0.5, U * 0.17, '#b08a28'); g.add(false);
    g.a(k); g.ring(b.x, gy, U * 0.5, U * 0.17, '#e8c030', 1).ring(b.x, gy, U * 0.34, U * 0.11, '#fff3a0', 1, f => ((f - t) * 8) % 1 < 0.5); const hy = lerp(top + U * 0.6, b.y - o.size * 0.52, ease(seg(t, 0, 0.5))); g.ring(b.x, hy, U * 0.22, U * 0.07, '#7a5a10', 3).ring(b.x, hy, U * 0.22, U * 0.07, '#fff3a0', 1);
    for (let i = 0; i < 9; i++) { const f = (hsh(i, 2) + t * 1.3) % 1, x = b.x + (hsh(i, 4) - 0.5) * U * 0.8, y = gy - f * o.size * 1.6; g.a(k * (1 - f)); star(g, x, y, i % 2 ? '#fff3a0' : '#ffffff', i % 3 === 0); } g.a(1); };
  // 화살: 날아가 박힌다. 겨냥(snipe)은 먼저 표적에 금을 긋는다
  FX.arrow = (g, a, b, t, o) => { const U = o.size, k = seg(t, 0, 0.6), arc = o.arc == null ? 0.12 : o.arc, d = Math.hypot(b.x - a.x, b.y - a.y) || 1, pos = f => [lerp(a.x, b.x, f), lerp(a.y, b.y, f) - sin(f * Math.PI) * d * arc], p = pos(Math.min(k, 1)), q2 = pos(Math.max(0, Math.min(k, 1) - 0.06)), an = Math.atan2(p[1] - q2[1], p[0] - q2[0]) + (k >= 1 ? sin(t * 60) * 0.12 * (1 - seg(t, 0.6, 0.9)) : 0), L = U * 0.5, tx = p[0] - cos(an) * L, ty = p[1] - sin(an) * L;
    if (k < 1) { for (let i = 1; i < 14; i++) { const r = pos(Math.max(0, k - i * 0.035)); g.a(0.85 * (1 - i / 14)).sq(r[0], r[1], i < 5 ? '#ffffff' : o.col || '#fff3a0', i < 6 ? 2 : 1); } g.a(1); }
    g.a(1 - seg(t, 0.88, 1)); g.line(tx, ty, p[0], p[1], '#1c1008', 3).line(tx, ty, p[0], p[1], '#c08a50', 1); g.sq(p[0], p[1], '#1b1d2a', 3).sq(p[0], p[1], '#dce4f4', 1); for (const sd of [-1, 1]) g.line(tx, ty, tx - cos(an - sd * 0.6) * U * 0.1, ty - sin(an - sd * 0.6) * U * 0.1, o.col || '#e06050', 1);
    if (k >= 1 && t < 0.8) { const pp = seg(t, 0.6, 0.8); rays(g, b.x, b.y, U * 0.1 + pp * U * 0.14, 6, '#ffffff', 0.5, U * 0.12 * (1 - pp)); } g.a(1); };
  FX.snipe = (g, a, b, t, o) => { const U = o.size, aim = seg(t, 0, 0.4); if (t < 0.5) { const r = U * (0.7 - aim * 0.4); g.a(0.9).ring(b.x, b.y, r, r, '#a8242c', 1, f => (f * 4 + 0.07) % 1 < 0.86); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.line(b.x + dx * r * 0.6, b.y + dy * r * 0.6, b.x + dx * r * 1.3, b.y + dy * r * 1.3, '#e06050', 1); g.dot(b.x, b.y, '#ffffff'); g.a(0.3).line(a.x, a.y, b.x, b.y, '#e06050', 1); g.a(1); }
    if (t >= 0.4) FX.arrow(g, a, b, seg(t, 0.4, 1), Object.assign({}, o, { arc: 0 })); };
  // 마법 탄
  FX.bolt = (g, a, b, t, o) => { const U = o.size, k = ease(seg(t, 0, 0.7)), x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k), c = o.col || '#f08a2a', c2 = o.col2 || '#ffe0a0'; if (k < 1) { for (let i = 1; i < 12; i++) { const f = Math.max(0, k - i * 0.035); g.a(1 - i / 12).sq(lerp(a.x, b.x, f) + sin(f * 30 + i) * g.s, lerp(a.y, b.y, f) + cos(f * 30 + i) * g.s, i % 2 ? c : c2, i < 3 ? 3 : 2); } g.a(1).disc(x, y, U * 0.13, INK).disc(x, y, U * 0.1, c).disc(x - g.s, y - g.s, U * 0.05, c2); g.dot(x - g.s, y - g.s, '#ffffff'); } else { const p = seg(t, 0.7, 1); g.a(1 - p).ring(b.x, b.y, U * (0.1 + p * 0.3), U * (0.1 + p * 0.3), c, 2); rays(g, b.x, b.y, U * 0.16 * p + g.s * 2, 7, c2, 0.3, U * 0.14 * (1 - p)); g.a(1); } };
  // 그림자 걸음: 흩어졌다가 뒤에서 솟아 긋는다
  FX.backstab = (g, a, b, t, o) => { const U = o.size, out = seg(t, 0, 0.35), run = seg(t, 0.15, 0.6), inn = seg(t, 0.5, 0.75), cut = seg(t, 0.72, 0.95), sh = '#120c1a', vi = '#8a6ab0';
    if (out < 1) for (let i = 0; i < 44; i++) { const x = (hsh(i, 1) - 0.5) * U * 0.44, y = -hsh(i, 2) * U * 0.9; if (hsh(i, 3) > out * 0.9) g.dot(a.x + x * (1 + out), a.y + U * 0.3 + y + out * U * 0.3 * hsh(i, 4), i % 3 ? sh : vi, 2, 2); }
    g.ell(a.x, a.y + U * 0.32, U * 0.34 * (1 - out), U * 0.1 * (1 - out), vi).ell(a.x, a.y + U * 0.32, U * 0.3 * (1 - out), U * 0.08 * (1 - out), sh);
    for (let i = 0; i < 14; i++) { const f = i / 14; if (f < run && f > inn * 1.1 - 0.1) { const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f) + U * 0.32 + sin(f * 12) * g.s * 2; g.dot(x - g.s, y, vi, 4, 2).dot(x, y, sh, 2, 1); } }
    if (inn > 0) { const bx = b.x + (o.side || 1) * U * 0.34, gy = b.y + U * 0.3, k = Math.min(1, inn * 2) * (1 - seg(t, 0.9, 1)); g.ell(bx, gy + g.s, U * 0.34 * k, U * 0.1, vi).ell(bx, gy + g.s, U * 0.3 * k, U * 0.08, sh); const h = U * 0.9 * ease(inn) * (1 - seg(t, 0.85, 1)); if (h > g.s * 2) { const body = e => [[bx - U * 0.15 - e, gy], [bx - U * 0.11 - e, gy - h], [bx + U * 0.02, gy - h * 1.12 - e], [bx + U * 0.13 + e, gy - h * 0.9], [bx + U * 0.15 + e, gy]]; g.poly(body(g.s), vi).poly(body(0), sh); g.dot(bx - g.s * 2, gy - h * 0.86, '#ffffff').dot(bx + g.s, gy - h * 0.86, '#ffffff'); } }
    if (cut > 0 && cut < 1) { g.a(1 - cut * cut); for (const sd of [-1, 1]) { const n = Math.ceil(cut * 12); for (let i = 0; i < n; i++) { const f = i / 12, an = (sd > 0 ? -2.3 : -0.84) + sd * f * 1.7, mid = i > 2 && i < 10; g.sq(b.x + cos(an) * U * 0.46, b.y + sin(an) * U * 0.42, mid ? '#e06050' : '#8a2030', mid ? 4 : 2); if (mid) g.sq(b.x + cos(an) * U * 0.46, b.y + sin(an) * U * 0.42, '#ffffff', 2); } } g.a(1); rays(g, b.x, b.y, U * 0.1, 6, '#ffffff', 0.4, U * 0.16 * (1 - cut)); } };
  // 침묵: 달군 인장이 내려찍힌다
  FX.seal = (g, a, b, t, o) => { const U = o.size, drop = ease(seg(t, 0, 0.3)), hold = seg(t, 0.3, 0.85), fade = seg(t, 0.85, 1), r = U * lerp(0.9, 0.36, drop), hot = t < 0.3 ? '#ff8a2a' : hold < 0.4 ? '#ffd040' : '#a8242c', y = b.y - (1 - drop) * U * 0.5;
    g.a((0.4 + drop * 0.6) * (1 - fade)); g.ring(b.x, y, r, r, '#1b1d2a', 5).ring(b.x, y, r, r, '#8a92a8', 3).ring(b.x, y, r, r, hot, 1); for (const sd of [-1, 1]) g.line(b.x - r * 0.62, y - sd * r * 0.62, b.x + r * 0.62, y + sd * r * 0.62, '#1b1d2a', 4).line(b.x - r * 0.62, y - sd * r * 0.62, b.x + r * 0.62, y + sd * r * 0.62, hot, 2);
    if (t >= 0.3) { const p = seg(t, 0.3, 0.5); if (p < 1) { g.a(1 - p); rays(g, b.x, b.y, r * (1 + p * 0.6), 10, '#ffd040', 0.2, U * 0.2 * (1 - p), 1); g.ring(b.x, b.y, r * (1 + p), r * (1 + p), '#ff8a2a', 1); } g.a(1 - fade); for (let i = 0; i < 2; i++) g.ring(b.x, b.y + (i ? U * 0.14 : -U * 0.1), r * 1.25, r * 0.3, i ? '#4a5068' : '#8a92a8', 2, f => (f * 18 + i * 0.5 + hold * 2) % 1 < 0.55); for (let i = 0; i < 4; i++) g.dot(b.x + (hsh(i, 2) - 0.5) * r * 2, b.y - hold * U * 0.5 * hsh(i, 3) - r * 0.4, '#8a8090', 2, 2); } g.a(1); };
  // 성역: 금빛 원과 빛기둥
  FX.sanctum = (g, a, b, t, o) => { const U = o.size * (o.r || 1.5), k = ease(seg(t, 0, 0.25)), fade = seg(t, 0.85, 1), gy = a.y + o.size * 0.3, R = U * 0.85 * k; g.add(true).a(0.35 * (1 - fade)).ell(a.x, gy, R, R * 0.4, '#a8842c').add(false); g.a(1 - fade); g.ring(a.x, gy, R, R * 0.4, '#7a5a10', 3).ring(a.x, gy, R, R * 0.4, '#ffe060', 1).ring(a.x, gy, R * 0.72, R * 0.29, '#fff3a0', 1, f => ((f + t * 0.5) * 12) % 1 < 0.5);
    for (let i = 0; i < 6; i++) { const an = i * TAU / 6 + 0.5, x = a.x + cos(an) * R, y = gy + sin(an) * R * 0.4, h = o.size * 1.1 * seg(t, 0.2 + i * 0.03, 0.5 + i * 0.03) * (0.85 + 0.15 * sin(t * 20 + i)); if (h > 0) { g.a(0.5 * (1 - fade)).dot(x - g.s, y - h, '#fff3a0', 3, Math.round(h / g.s)); g.a(1 - fade).dot(x, y - h, '#ffffff', 1, Math.round(h / g.s)); star(g, x, y - h, '#ffffff', true); } }
    g.a((1 - fade) * 0.8); g.ring(a.x, gy - o.size * 0.5, R * 0.9, R * 0.9, '#ffe060', 1, f => f > 0.5 && (f * 20) % 1 < 0.5); g.a(1); };
  // 읽는다: 방의 무늬가 뜯겨 책으로 빨려 든다
  FX.read = (g, a, b, t, o) => { const U = o.size, op = ease(seg(t, 0, 0.2)), by = a.y - U * 0.2, w = U * 0.36 * op, c = o.col || '#c8a8ff';
    g.a(1 - seg(t, 0.3, 0.9)); g.ring(b.x, b.y + U * 0.3, U * 0.46, U * 0.2, '#12081c', 3, f => hsh(Math.floor(f * 24), 1) > seg(t, 0.2, 0.8)).ring(b.x, b.y + U * 0.3, U * 0.46, U * 0.2, c, 1, f => hsh(Math.floor(f * 24), 1) > seg(t, 0.2, 0.8)); for (let i = 0; i < 7; i++) if (hsh(i, 9) > seg(t, 0.2, 0.8)) glyph(g, b.x + (hsh(i, 2) - 0.5) * U * 0.7, b.y + U * 0.3 + (hsh(i, 3) - 0.5) * U * 0.24, i, c); g.a(1);
    for (let i = 0; i < 16; i++) { const f = ease(seg(t, 0.15 + i * 0.035, 0.55 + i * 0.035)); if (f > 0 && f < 1) { const x = lerp(b.x + (hsh(i, 2) - 0.5) * U * 0.7, a.x, f), y = lerp(b.y + U * 0.3, by, f) - sin(f * Math.PI) * U * (0.3 + hsh(i, 5) * 0.4); glyph(g, x, y, i + Math.floor(t * 12), i % 3 ? c : '#fff3a0'); g.dot(x + g.s * 2, y + g.s * 2, c); } }
    if (op > 0) { const hh = U * 0.15; g.poly([[a.x - w - g.s * 2, by - hh], [a.x + w + g.s * 2, by - hh], [a.x + w + g.s * 2, by + hh + g.s * 2], [a.x - w - g.s * 2, by + hh + g.s * 2]], '#3a2060', '#12081c'); for (const sd of [-1, 1]) { g.poly([[a.x, by - hh + g.s * 2], [a.x + sd * w, by - hh - sin(t * 30) * g.s * (t > 0.2 && t < 0.9 ? 1 : 0)], [a.x + sd * w, by + hh - g.s], [a.x, by + hh + g.s]], sd < 0 ? '#f2ecd8' : '#d8d0b8'); for (let k = 0; k < 4; k++) g.dot(a.x + (sd < 0 ? -w * 0.84 : w * 0.16), by - hh * 0.5 + k * g.s * 2, '#3a3440', Math.max(1, Math.round(w * 0.68 / g.s)), 1); } g.dot(a.x - g.s, by - hh + g.s, '#12081c', 1, Math.round(hh * 2 / g.s)); if (t > 0.5) { g.a(seg(t, 0.5, 0.8) * (1 - seg(t, 0.9, 1))); g.ell(a.x + w * 0.5, by, g.s * 3, g.s * 2, '#7aff8a'); g.dot(a.x + w * 0.5, by - g.s, INK, 1, 2); rays(g, a.x, by, U * 0.3, 8, c, t * 4, U * 0.12); g.a(1); } } };
  // 읽은 것을 터뜨린다
  FX.readblast = (g, a, b, t, o) => { const U = o.size * (o.r || 2), k = ease(seg(t, 0.1, 0.7)), fade = seg(t, 0.6, 1), c = '#c8a8ff'; g.a(1 - fade); g.ring(a.x, a.y, U * 0.7 * k, U * 0.56 * k, '#12081c', 4).ring(a.x, a.y, U * 0.7 * k, U * 0.56 * k, c, 2).ring(a.x, a.y, U * 0.5 * k, U * 0.4 * k, '#7aff8a', 1, f => (f * 16 + t * 3) % 1 < 0.5); for (let i = 0; i < 14; i++) { const an = i * TAU / 14 + t; glyph(g, a.x + cos(an) * U * 0.6 * k, a.y + sin(an) * U * 0.48 * k, i + Math.floor(t * 10), i % 3 ? '#f0e8ff' : '#7aff8a'); } rays(g, a.x, a.y, U * 0.2 * k, 10, '#ffffff', t, U * 0.2 * (1 - k)); g.a(1 - seg(t, 0, 0.3)).disc(a.x, a.y - o.size * 0.2, o.size * 0.24, '#ffffff'); g.a(1); };
  // 해일: 물마루가 훑고 지나간다
  FX.wave = (g, a, b, t, o) => { const U = o.size, W = o.w || U * 6, k = ease(seg(t, 0, 0.85)), fade = seg(t, 0.8, 1), d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d, nx = -uy, ny = ux, px = lerp(a.x, b.x, k), py = lerp(a.y, b.y, k), L = U * 1.1, st = g.s * 2, cols = ['#ffffff', '#e8fff8', '#8fe8d8', '#1f8f8a', '#1f8f8a', '#0f5560', '#0f5560', '#0a2a34'];
    for (let i = -W / 2; i <= W / 2; i += st) { const cr = sin(i * 0.045 + t * 9) * U * 0.14 + sin(i * 0.11 - t * 6) * U * 0.06, n = Math.round(L / st * (0.8 + 0.2 * sin(i * 0.07))); for (let j = 0; j < n; j++) { const f = j / n, c = cols[Math.min(7, Math.floor(f * 8 + (hsh(Math.round(i), j) < 0.2 ? 1 : 0)))]; g.a((1 - fade) * (1 - f * f * 0.9)); g.dot(px + nx * i + ux * (cr - j * st), py + ny * i + uy * (cr - j * st), c, 2, 2); } }
    g.a(1 - fade); for (let i = 0; i < 26; i++) { const off = (hsh(i, 1) - 0.5) * W, f = (hsh(i, 2) + t * 2) % 1, ah = U * (0.1 + f * 0.5); star(g, px + nx * off + ux * ah, py + ny * off + uy * ah - sin(f * Math.PI) * U * 0.2, i % 3 ? '#e8fff8' : '#ffffff', i % 4 === 0); } g.a(1); };
  // 내려다보는 눈: 위에서 눈이 뜨이고 빛이 떨어진다
  FX.skyeye = (g, a, b, t, o) => { const U = o.size, op = ease(seg(t, 0, 0.28)) * (1 - ease(seg(t, 0.86, 1))), ex = b.x, ey = b.y - U * 1.5, rx = U * 0.8, ry = U * 0.36 * op;
    for (let i = 0; i < 10; i++) { g.a(0.6 * op); star(g, ex + (hsh(i, 1) - 0.5) * U * 2.4, ey + (hsh(i, 2) - 0.5) * U * 0.9, i % 2 ? '#cdbcff' : '#fff3a0', (i + Math.floor(t * 8)) % 4 === 0); } g.a(1);
    if (ry > g.s) { g.ell(ex, ey, rx + g.s * 2, ry + g.s * 2, '#120a26').ell(ex, ey, rx, ry, '#e4dcf2'); g.ell(ex, ey + g.s, Math.min(ry * 1.05, U * 0.3), Math.min(ry, U * 0.3), '#6a4fc8').ell(ex, ey + g.s, Math.min(ry * 0.8, U * 0.2), Math.min(ry * 0.8, U * 0.2), '#f0a04a').ell(ex, ey + g.s, g.s * 2, Math.min(ry * 0.8, U * 0.22), '#07050c'); g.dot(ex - U * 0.14, ey - ry * 0.5, '#ffffff', 2, 2); for (let k = 0; k < 9; k++) { const x = ex - rx + (k + 0.5) * rx * 2 / 9, h = ry * Math.sqrt(Math.max(0, 1 - Math.pow((x - ex) / rx, 2))); g.line(x, ey - h - g.s, x + (x - ex) * 0.12, ey - h - U * 0.14 * op, '#3a2580', 1); } }
    if (t > 0.3 && t < 0.9) { const targets = o.targets || [[b.x, b.y], [b.x - U * 0.9, b.y + U * 0.2], [b.x + U * 0.8, b.y - U * 0.1]]; targets.forEach(([tx, ty], i) => { const p = seg(t, 0.3 + i * 0.06, 0.45 + i * 0.06), q2 = seg(t, 0.7, 0.9); if (p <= 0) return; const x1 = lerp(ex, tx, p), y1 = lerp(ey, ty, p); g.a(1 - q2); g.line(ex, ey, x1, y1, '#6a4fc8', 3).line(ex, ey, x1, y1, Math.floor(t * 30) % 2 ? '#ffffff' : '#fff3a0', 1); if (p >= 1) { g.ring(tx, ty + U * 0.2, U * 0.3, U * 0.12, '#cdbcff', 1); rays(g, tx, ty, U * 0.14, 6, '#fff3a0', t * 8 + i, U * 0.12); } }); g.a(1); } };
  // 광기 폭발
  FX.madburst = (g, a, b, t, o) => { const U = o.size * (o.r || 1), pull = seg(t, 0, 0.2), out = ease(seg(t, 0.2, 0.75)), fade = seg(t, 0.65, 1);
    if (t < 0.22) for (let i = 0; i < 12; i++) { const an = i * 0.52, r = U * 0.7 * (1 - pull); g.dot(b.x + cos(an) * r, b.y + sin(an) * r, i % 2 ? '#f070e8' : '#cdbcff', 2, 2); }
    else { g.a(1 - fade); g.ring(b.x, b.y, U * 0.75 * out, U * 0.62 * out, '#120a26', 3).ring(b.x, b.y, U * 0.75 * out, U * 0.62 * out, '#f070e8', 1); for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 14; i++) { const f = i / 14, an = arm * 2.09 + f * 3.4 + t * 5, r = f * U * 0.7 * out; g.sq(b.x + cos(an) * r, b.y + sin(an) * r * 0.85, i % 3 ? '#8a2ac8' : '#f070e8', f < 0.5 ? 2 : 1); }
      for (let i = 0; i < 5; i++) { const an = i * 1.26 + 0.4, r = U * 0.62 * out, x = b.x + cos(an) * r, y = b.y + sin(an) * r * 0.85 - sin(out * Math.PI) * U * 0.14; g.disc(x, y, g.s * 3, '#120a26').disc(x, y, g.s * 2, '#ffffff'); g.dot(x + cos(an) * g.s, y + sin(an) * g.s, '#07050c', 1, 2); }
      rays(g, b.x, b.y, U * 0.12, 9, '#ffffff', t * 3, U * 0.3 * (1 - out)); g.a(1 - seg(t, 0.2, 0.4)).disc(b.x, b.y, U * 0.26, '#ffffff'); g.a(1); } };
  // 합창: 겹겹의 고리와 문양이 퍼진다
  FX.chorus = (g, a, b, t, o) => { const U = o.size, d = Math.max(U * 2, Math.hypot(b.x - a.x, b.y - a.y)), dir = Math.atan2(b.y - a.y, b.x - a.x), sp = o.spread || 1.1, c = '#f0a04a';
    for (let k = 0; k < 4; k++) { const p = seg(t, k * 0.12, k * 0.12 + 0.6); if (p <= 0 || p >= 1) continue; const r = d * p; g.a((1 - p) * 0.95); for (const [w, col] of [[4, '#140a12'], [2, k % 2 ? c : '#fff3c0']]) { const n = Math.ceil(r * sp * 2 / g.s); for (let i = 0; i <= n; i++) { const an = dir - sp + i / n * sp * 2; g.sq(a.x + cos(an) * r, a.y + sin(an) * r, col, w); } } for (let i = 0; i < 5; i++) { const an = dir - sp * 0.8 + i / 4 * sp * 1.6; glyph(g, a.x + cos(an) * (r - U * 0.16), a.y + sin(an) * (r - U * 0.16), i + k, c); } } g.a(1); };
  // 군가: 음표가 떠오른다
  FX.song = (g, a, b, t, o) => { const U = o.size, fade = seg(t, 0.7, 1); for (let i = 0; i < 6; i++) { const f = seg(t, i * 0.08, i * 0.08 + 0.6); if (f <= 0) continue; const x = a.x + (i - 2.5) * U * 0.22 + sin(f * 6 + i) * U * 0.08, y = a.y - U * 0.3 - f * U * 0.9, c = ['#ffe060', '#f08a2a', '#ffffff'][i % 3]; g.a((1 - fade) * (1 - f * 0.5)); g.sq(x, y, INK, 4).sq(x, y, c, 2); g.dot(x + g.s, y - g.s * 5, INK, 3, 6).dot(x + g.s * 2, y - g.s * 4, c, 1, 4); g.dot(x + g.s * 2, y - g.s * 5, c, 2, 1); }
    for (const dl of [0, 0.3]) { const p = seg(t, dl, dl + 0.6); if (p > 0 && p < 1) { g.a(1 - p).ring(a.x, a.y + U * 0.3, U * (0.3 + p * 1.2), U * (0.12 + p * 0.5), '#ffe060', 1, f => (f * 16) % 1 < 0.6); } } g.a(1); };
  // 대식: 둘레를 큰 턱이 문다
  FX.feast = (g, a, b, t, o) => { const U = o.size * (o.r || 2.2); FX.bigbite(g, a, a, t, Object.assign({}, o, { size: U, wide: 1 })); if (t > 0.5) { const p = seg(t, 0.5, 1); g.a(1 - p); for (let i = 0; i < 10; i++) { const an = i * 0.63, r = U * (0.5 - p * 0.4); star(g, a.x + cos(an) * r, a.y + sin(an) * r * 0.7, i % 2 ? '#ff8a7a' : '#ffffff', i % 3 === 0); } g.a(1); } };
  // 내려찍기: 바닥이 울린다
  FX.slam = (g, a, b, t, o) => { const U = o.size * (o.r || 2), gy = a.y + o.size * 0.3, p = ease(seg(t, 0.15, 0.8)), fade = seg(t, 0.6, 1); if (t < 0.2) { g.a(0.8).ell(a.x, gy, U * 0.3 * (t / 0.2), U * 0.1, '#06141c'); g.a(1); return; }
    g.a(1 - fade); for (const [k, c, w] of [[1, '#06141c', 5], [1, '#8fe8d8', 2], [0.7, '#e8fff8', 1]]) g.ring(a.x, gy, U * 0.8 * p * k, U * 0.36 * p * k, c, w); for (let i = 0; i < 12; i++) { const an = i * 0.524 + 0.2, r = U * 0.7 * p, h = sin(seg(t, 0.15, 0.7) * Math.PI) * o.size * (0.3 + hsh(i, 3) * 0.5); g.sq(a.x + cos(an) * r, gy + sin(an) * r * 0.45 - h, '#0c0812', i % 2 ? 4 : 5).sq(a.x + cos(an) * r, gy + sin(an) * r * 0.45 - h, i % 3 ? '#6a6878' : '#a8a2b4', i % 2 ? 2 : 3); }
    for (let i = 0; i < 7; i++) { const an = i * 0.9 + 0.3; g.line(a.x + cos(an) * U * 0.14, gy + sin(an) * U * 0.06, a.x + cos(an) * U * 0.6 * p, gy + sin(an) * U * 0.27 * p, '#06141c', 1); } g.a(1); };
  // 뜯어먹기: 작은 턱과 붉은 살점이 몸으로 돌아온다
  FX.eat = (g, a, b, t, o) => { const U = o.size; if (t < 0.45) FX.bigbite(g, a, b, t / 0.45 * 0.8, Object.assign({}, o, { wide: 0.6 })); for (let i = 0; i < 9; i++) { const f = ease(seg(t, 0.3 + i * 0.04, 0.75 + i * 0.025)); if (f > 0 && f < 1) { const x = lerp(b.x + (hsh(i, 1) - 0.5) * U * 0.5, a.x, f), y = lerp(b.y, a.y - U * 0.2, f) - sin(f * Math.PI) * U * 0.3; g.sq(x, y, '#22060a', i % 2 ? 4 : 3).sq(x, y, i % 3 ? '#e06050' : '#ffb0a0', i % 2 ? 2 : 1); } } if (t > 0.75) { const p = seg(t, 0.75, 1); g.a(1 - p).ring(a.x, a.y - U * 0.1, U * (0.2 + p * 0.3), U * (0.2 + p * 0.3), '#ff8a7a', 1); for (let i = 0; i < 4; i++) star(g, a.x + (i - 1.5) * U * 0.16, a.y - U * 0.3 - p * U * 0.4, '#ffb0a0', true); g.a(1); } };
  // 물고 늘어짐: 작은 턱이 물고 흔든다
  FX.latch = (g, a, b, t, o) => { const U = o.size, sh = t > 0.3 ? sin(t * 50) * g.s * 2 * (1 - seg(t, 0.7, 1)) : 0; g.a(1 - seg(t, 0.8, 1)); jaws(g, b.x + sh, b.y, U * 0.7, t < 0.3 ? 1 - ease(t / 0.3) : 0, ['#140c08', '#6a4a30', '#a07850', '#3e2a1a']); g.a(1); if (t > 0.3 && t < 0.9) for (let i = 0; i < 5; i++) { const f = (hsh(i, 1) + t * 3) % 1; g.dot(b.x + (hsh(i, 2) - 0.5) * U * 0.5, b.y + f * U * 0.4, '#c8242c', 1, 2); } };
  // 창 찌르기: 두 칸을 꿰는 줄
  FX.pierce = (g, a, b, t, o) => { const U = o.size, k = t < 0.3 ? -0.15 * ease(t / 0.3) : t < 0.45 ? lerp(-0.15, 1, ease((t - 0.3) / 0.15)) : lerp(1, 0.6, seg(t, 0.45, 1)), fade = seg(t, 0.7, 1), d = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d, tx = a.x + ux * d * k, ty = a.y + uy * d * k, sx = tx - ux * U * 0.9, sy = ty - uy * U * 0.9;
    g.a(1 - fade); g.line(sx, sy, tx, ty, '#1c1008', 3).line(sx, sy, tx, ty, '#c08a50', 1); g.poly([[tx + ux * U * 0.2, ty + uy * U * 0.2], [tx - uy * U * 0.07, ty + ux * U * 0.07], [tx + uy * U * 0.07, ty - ux * U * 0.07]], '#dce4f4', '#1b1d2a');
    if (t > 0.36 && t < 0.8) { const p = seg(t, 0.36, 0.8); g.a((1 - p) * 0.9); g.line(a.x + ux * U * 0.3, a.y + uy * U * 0.3, b.x + ux * U * 0.2, b.y + uy * U * 0.2, '#ffffff', 2); for (const f of [0.5, 1]) rays(g, lerp(a.x, b.x, f), lerp(a.y, b.y, f), U * 0.1 + p * U * 0.12, 5, '#fff3a0', f * 3, U * 0.1); } g.a(1); };
  // 감염체가 일어선다
  FX.rise = (g, a, b, t, o) => { const U = o.size, gy = b.y + U * 0.32, k = ease(seg(t, 0, 0.6)), fade = seg(t, 0.8, 1), h = U * 0.8 * k; g.a(1 - fade); g.ell(b.x, gy, U * 0.42, U * 0.13, '#0c1c0c').ell(b.x, gy, U * 0.38, U * 0.1, '#2c5c24');
    if (h > g.s * 2) { const body = e => [[b.x - U * 0.16 - e, gy], [b.x - U * 0.2 - e, gy - h * 0.7], [b.x - U * 0.08, gy - h - e], [b.x + U * 0.1, gy - h - e], [b.x + U * 0.2 + e, gy - h * 0.66], [b.x + U * 0.15 + e, gy]]; g.poly(body(g.s), '#0c1c0c').poly(body(0), '#4a5a34'); g.dot(b.x - g.s * 2, gy - h * 0.86, '#e8ff7a').dot(b.x + g.s * 2, gy - h * 0.86, '#e8ff7a'); for (const [dx, dy, r] of [[-0.2, 0.72, 0.1], [0.19, 0.68, 0.08], [0.02, 1.02, 0.09]]) { g.ell(b.x + U * dx, gy - h * dy, U * r + g.s, U * r * 0.6 + g.s, '#0c1c0c').ell(b.x + U * dx, gy - h * dy, U * r, U * r * 0.6, '#8aa83a'); g.dot(b.x + U * dx - g.s, gy - h * dy - g.s, '#e0f090'); } }
    for (let i = 0; i < 12; i++) { const f = (hsh(i, 4) + t * 1.4) % 1; star(g, b.x + (hsh(i, 5) - 0.5) * U * 0.9, gy - f * U * 1.1, i % 3 ? '#e8ff7a' : '#ffffff', i % 4 === 0); } g.a(1); };
  // 뭇시선: 둘레에 눈이 뜨인다
  FX.eyes = (g, a, b, t, o) => { const U = o.size * (o.r || 1.6), op = ease(seg(t, 0, 0.3)) * (1 - ease(seg(t, 0.8, 1))); for (let i = 0; i < 9; i++) { const an = i * TAU / 9 + 0.3, r = U * (0.5 + (i % 2) * 0.24), x = a.x + cos(an) * r, y = a.y + sin(an) * r * 0.75, rx = g.s * (4 + (i % 3)), ry = Math.max(0, rx * 0.6 * op); if (ry < g.s * 0.6) { g.dot(x - rx, y, '#3a2580', Math.round(rx * 2 / g.s), 1); continue; } g.ell(x, y, rx + g.s, ry + g.s, '#120a26').ell(x, y, rx, ry, '#e4dcf2'); g.ell(x - cos(an) * g.s, y - sin(an) * g.s, Math.min(rx * 0.5, ry), ry, ['#f0a04a', '#7af0d8', '#f070e8'][i % 3]).ell(x - cos(an) * g.s, y - sin(an) * g.s, g.s * 0.5, ry * 0.8, '#07050c'); }
    if (t > 0.3 && t < 0.85) { const p = seg(t, 0.3, 0.85); g.a((1 - p) * 0.8).ring(a.x, a.y, U * 0.34 * (1 + p), U * 0.26 * (1 + p), '#cdbcff', 1, f => (f * 20) % 1 < 0.5); g.a(1); } };
  // 시너지가 켜질 때
  FX.on = (g, a, b, t, o) => { const U = o.size, c = o.col || '#fff3a0', p = ease(t); g.a(1 - t); g.ring(b.x, b.y, U * (0.2 + p * 0.5), U * (0.2 + p * 0.5), c, 2); rays(g, b.x, b.y, U * (0.3 + p * 0.3), 8, '#ffffff', 0.39, U * 0.16 * (1 - t)); g.a(1); };
  // 맞는 불꽃, 진액, 치유
  FX.spark = (g, a, b, t, o) => { const U = o.size, c = o.col || '#fff3a0'; g.a(1 - t * t); rays(g, b.x, b.y, U * (0.06 + t * 0.22), 6, c, o.seed || 0.4, U * 0.16 * (1 - t), t < 0.4 ? 2 : 1); rays(g, b.x, b.y, U * (0.04 + t * 0.14), 6, '#ffffff', (o.seed || 0.4) + 0.52, U * 0.08 * (1 - t)); if (t < 0.35) star(g, b.x, b.y, '#ffffff', true); g.a(1); };
  FX.ichor = (g, a, b, t, o) => { const U = o.size, c = o.col || '#3aa89a', c2 = o.col2 || '#c0fff0'; for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (hsh(i, o.seed || 1) - 0.5) * 2.6, v = U * (0.5 + hsh(i, 3) * 0.6), x = b.x + cos(an) * v * t, y = b.y + sin(an) * v * t + t * t * U * 0.9; g.a(1 - seg(t, 0.7, 1)).sq(x, y, INK, i % 3 ? 4 : 5).sq(x, y, i % 4 ? c : c2, i % 3 ? 2 : 3); } g.a(seg(t, 0.4, 0.7) * (1 - seg(t, 0.85, 1))).ell(b.x, b.y + U * 0.36, U * 0.3, U * 0.08, c); g.a(1); };
  // 막음: 맞는 쪽 앞에 방패 꼴 빛이 섰다 꺼진다. a = 때린 쪽, b = 막은 쪽
  FX.block = (g, a, b, t, o) => { const U = o.size, c = o.col || '#a8c8ff', d = Math.hypot(a.x - b.x, a.y - b.y) || 1, ux = (a.x - b.x) / d, uy = (a.y - b.y) / d, cx = b.x + ux * U * 0.24, cy = b.y + uy * U * 0.16, p = ease(Math.min(1, t * 2.2)), w = U * (0.15 + 0.07 * p), h = U * (0.2 + 0.08 * p);
    g.a((1 - t * t) * 0.95); const pts = [[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h * 0.2], [cx, cy + h], [cx - w, cy + h * 0.2]]; for (let i = 0; i < 5; i++) { const q = pts[i], r = pts[(i + 1) % 5]; g.line(q[0], q[1], r[0], r[1], '#0a1226', 4).line(q[0], q[1], r[0], r[1], t < 0.25 ? '#ffffff' : c, 2); }
    if (t < 0.5) { g.line(cx, cy - h * 0.6, cx, cy + h * 0.5, '#ffffff', 1).line(cx - w * 0.6, cy - h * 0.15, cx + w * 0.6, cy - h * 0.15, '#ffffff', 1); rays(g, cx + ux * U * 0.08, cy + uy * U * 0.06, U * 0.1 + t * U * 0.2, 5, '#ffffff', 0.21, U * 0.1 * (1 - t * 2)); } g.a(1); };
  FX.heal = (g, a, b, t, o) => { const U = o.size, c = o.col || '#7af0a0'; for (let i = 0; i < 6; i++) { const f = (hsh(i, 1) * 0.5 + t) % 1, x = b.x + (hsh(i, 2) - 0.5) * U * 0.7, y = b.y + U * 0.2 - f * U * 0.9; g.a((1 - f) * (1 - seg(t, 0.8, 1))); g.dot(x - g.s, y, c, 3, 1).dot(x, y - g.s, c, 1, 3); g.dot(x, y, '#ffffff'); } g.a(1); };
  // 내 처음 이름들도 받는다
  Object.assign(FX, { spore: FX.cloud, bite: FX.bites, charge: FX.dash, fire: FX.firepillar, shield: FX.shieldwall, prayer: FX.light, shadow: FX.backstab, silence: FX.seal, sanctuary: FX.sanctum, book: FX.read, tide: FX.wave, eye: FX.skyeye, devour: FX.feast, splash: FX.ichor });
  function fx(name, ctx, from, to, t, o) { const f = FX[name]; if (!f) return false; o = Object.assign({ px: 2, size: 64 }, o); to = to || from; from = from || to; ctx.save(); ctx.imageSmoothingEnabled = false; f(pen(ctx, o.px), from, to, clamp(t, 0, 1), o); ctx.restore(); return true; }
  // 뜨는 숫자. kind: dmg crit san heal mad block gold
  const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111', '+': '000010111010000', '-': '000000111000000' };
  const NUMC = { dmg: ['#ffffff', '#0c0812'], crit: ['#ffe060', '#3a0c08'], san: ['#cdbcff', '#1a0a3a'], heal: ['#7af0a0', '#062a14'], mad: ['#f070e8', '#2a0630'], block: ['#9aa0b4', '#0c0812'], guard: ['#a8c8ff', '#0a1226'], gold: ['#8fe8d8', '#06141c'] };
  function num(ctx, x, y, text, kind, t, px) { const s = (px || 2) * (kind === 'crit' ? 1.5 : 1) * (t < 0.12 ? 1.5 : 1), col = NUMC[kind] || NUMC.dmg, str = String(text), spiral = kind === 'san' || kind === 'mad', shield = kind === 'guard', w = (str.length * 4 - 1 + (spiral || shield ? 6 : 0)) * s, x0 = Math.round(x - w / 2 + (kind === 'crit' && t < 0.3 ? Math.sin(t * 90) * 2 : 0)), y0 = Math.round(y - 22 * ease(Math.min(1, t * 1.3)) - (kind === 'crit' ? 4 : 0));
    ctx.save(); ctx.globalAlpha = 1 - seg(t, 0.72, 1); const cells = []; let cx = 0;
    if (spiral) { for (const [dx, dy] of [[1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [2, 2], [4, 2], [0, 3], [2, 3], [3, 3], [1, 4], [4, 4], [2, 5], [3, 5]]) cells.push([dx, dy - 0.5]); cx = 6; }
    if (shield) { for (let i = 0; i < 25; i++) if ('1111111111111110111000100'[i] === '1') cells.push([i % 5, Math.floor(i / 5)]); cx = 6; }
    for (const ch of str) { const d = DIG[ch]; if (d) for (let i = 0; i < 15; i++) if (d[i] === '1') cells.push([cx + i % 3, Math.floor(i / 3)]); cx += 4; }
    ctx.fillStyle = col[1]; for (const [dx, dy] of cells) ctx.fillRect(Math.round(x0 + dx * s - s), Math.round(y0 + dy * s - s), Math.ceil(s * 3), Math.ceil(s * 3)); ctx.fillStyle = col[0]; for (const [dx, dy] of cells) ctx.fillRect(Math.round(x0 + dx * s), Math.round(y0 + dy * s), Math.ceil(s), Math.ceil(s)); ctx.restore(); }
  // 머리 위 막대: 체력(편에 따라 빛깔), 정신(보라), 마나(얇은 줄), 방어막(흰 덧줄)
  function bar(ctx, x, y, w, hp, san, o) { o = o || {}; const s = o.px || 1, x0 = Math.round(x - w / 2), h = 4 * s, hc = o.side === 'inv' ? ['#e85040', '#ffb0a0', '#7a1410'] : ['#3ad8b0', '#c0fff0', '#0f5a4a'], fill = (yy, hh, k, c, hi, lo) => { const fw = Math.round((w - 2 * s) * clamp(k, 0, 1)); ctx.fillStyle = '#0c0812'; ctx.fillRect(x0, yy, w, hh + 2 * s); ctx.fillStyle = '#2a2434'; ctx.fillRect(x0 + s, yy + s, w - 2 * s, hh); if (fw > 0) { ctx.fillStyle = c; ctx.fillRect(x0 + s, yy + s, fw, hh); ctx.fillStyle = hi; ctx.fillRect(x0 + s, yy + s, fw, s); if (hh > 2 * s) { ctx.fillStyle = lo; ctx.fillRect(x0 + s, yy + hh, fw, s); } } };
    ctx.save(); fill(Math.round(y), h, hp, hc[0], hc[1], hc[2]); if (o.shield) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + s, Math.round(y) + s, Math.round((w - 2 * s) * clamp(o.shield, 0, 1)), s * 2); } ctx.fillStyle = '#0c0812'; for (let k = 1; k < 4; k++) ctx.fillRect(x0 + Math.round(w * k / 4), Math.round(y) + s, s, 2 * s);
    let yy = Math.round(y) + h + s; if (san != null) { fill(yy, 2 * s, san, '#b07af0', '#e8d8ff', '#5a3090'); if (san < 0.34) { ctx.fillStyle = '#f070e8'; ctx.fillRect(x0 - 2 * s, yy, 2 * s, 4 * s); } yy += 3 * s; } if (o.mana != null) { ctx.fillStyle = '#0c0812'; ctx.fillRect(x0, yy, w, 3 * s); ctx.fillStyle = o.mana >= 1 ? '#fff3a0' : '#4a8af0'; ctx.fillRect(x0 + s, yy + s, Math.round((w - 2 * s) * clamp(o.mana, 0, 1)), s); } ctx.restore(); }
  // ---------- 판: 젖은 돌 바닥, 입구, 방 무늬, 표식 ----------
  const rgba = (hex, a) => { const c = C32(hex); return (((a == null ? 255 : Math.round(a * 255)) << 24) | (c & 0xffffff)) >>> 0; };
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], bay = (x, y) => (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  function PX(w, h) { const c = mk(w, h), x = c.getContext('2d'), im = x.createImageData(w, h), d = new Uint32Array(im.data.buffer), col = v => (typeof v === 'number' ? v : rgba(v));
    const o = { w, h, d, set(X, Y, v) { X = Math.round(X); Y = Math.round(Y); if (X >= 0 && Y >= 0 && X < w && Y < h) d[Y * w + X] = col(v); return o; },
      mix(X, Y, v, a) { X = Math.round(X); Y = Math.round(Y); if (X < 0 || Y < 0 || X >= w || Y >= h) return o; const s = col(v), t = d[Y * w + X]; if (!(t >>> 24)) { d[Y * w + X] = ((Math.round(a * 255) << 24) | (s & 0xffffff)) >>> 0; return o; } const f = sh => Math.round(((s >>> sh) & 255) * a + ((t >>> sh) & 255) * (1 - a)); d[Y * w + X] = ((Math.max(t >>> 24, Math.round(a * 255)) << 24) | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0; return o; },
      rect(X, Y, W, H, v) { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) o.set(X + i, Y + j, v); return o; },
      ell(cx, cy, rx, ry, v, edge) { for (let j = -Math.ceil(ry) - 1; j <= ry + 1; j++) for (let i = -Math.ceil(rx) - 1; i <= rx + 1; i++) { const q = (i * i) / (rx * rx) + (j * j) / (ry * ry); if (q <= 1) o.set(cx + i, cy + j, v); else if (edge && q <= 1 + 2.2 / Math.min(rx, ry)) o.set(cx + i, cy + j, edge); } return o; },
      line(x0, y0, x1, y1, v) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let k = 0; k <= n; k++) o.set(lerp(x0, x1, k / n), lerp(y0, y1, k / n), v); return o; },
      tri(x0, y0, x1, y1, x2, y2, v) { const ya = Math.floor(Math.min(y0, y1, y2)), yb = Math.ceil(Math.max(y0, y1, y2)), E = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]]; for (let y = ya; y <= yb; y++) { const xs = []; for (const [ax, ay, bx, by] of E) if ((ay <= y + 0.5) !== (by <= y + 0.5)) xs.push(ax + (y + 0.5 - ay) / (by - ay) * (bx - ax)); if (xs.length >= 2) { const a = Math.round(Math.min(xs[0], xs[1])), b = Math.round(Math.max(xs[0], xs[1])); for (let xx = a; xx <= Math.max(a, b - 1); xx++) o.set(xx, y, v); } } return o; },
      done() { x.putImageData(im, 0, 0); return c; } }; return o; }
  const tcache = {};
  const RAMP = { nest: ['#0a1216', '#121e24', '#1a2a32', '#243a42', '#32525a'], nestLit: ['#0a1618', '#102a2c', '#184044', '#22585a', '#3a7a78'], inv: ['#120e14', '#1e1a20', '#2a252c', '#38323a', '#4a434c'], invLit: ['#1a100e', '#2e1e18', '#44301e', '#5e4428', '#7e5e34'] };
  // 바닥 한 칸. side: 'nest' | 'inv', (i, j) = 열·행 (행 0 이 맨 위). 칸마다 돌 갈라짐이 다르다
  function tile(side, i, j, S) { S = S || 64; const key = 'tile:' + side + ':' + i + ':' + j + ':' + S; if (tcache[key]) return tcache[key];
    const nest = side === 'nest', p = PX(S, S), base = nest ? RAMP.nest : RAMP.inv, lit = nest ? RAMP.nestLit : RAMP.invLit, H = S / 2, sp = [Math.round(S * (0.3 + hsh(i * 7 + 1, j * 13) * 0.4)), Math.round(S * (0.3 + hsh(i * 7 + 2, j * 13 + 5) * 0.4))], hy = Math.round(H + (hsh(i + 31, j + 17) - 0.5) * 6);
    const lx = nest ? 2.5 : 2.5, ly = nest ? 5.6 : -0.7;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const r = y < hy ? 0 : 1, sx = sp[r], c = x < sx ? 0 : 1, x0 = c ? sx : 0, x1 = c ? S : sx, y0 = r ? hy : 0, y1 = r ? S : hy, gx = i + x / S, gy = j + y / S;
      let v = 2 + (hsh(i * 5 + c + r * 2, j * 11 + r) - 0.5) * (nest ? 1 : 1.5) + (hsh(Math.floor((x + i * S) / 5), Math.floor((y + j * S) / 4)) - 0.5) * (nest ? 0.6 : 0.9) + (hsh(x + i * 64, y + j * 64) - 0.5) * (nest ? 0.5 : 0.7);
      if (x === x0 || y === y0) v = 0; else if (x === x0 + 1 || y === y0 + 1) v += 0.9; else if (x === x1 - 1 || y === y1 - 1) v -= 0.8;
      if (x === 0 || y === 0) v = 0;
      const dist = Math.hypot(gx - 0.5 - lx, (gy - 0.5 - ly) * 1.2), glow = clamp(1 - dist / (nest ? 2.6 : 3.6), 0, 1) * (nest ? 0.34 : 0.8), ramp = glow > bay(x + i * S, y + j * S) ? lit : base;
      p.set(x, y, ramp[clamp(Math.round(v), 0, 4)]); }
    const h1 = hsh(i * 3 + 7, j * 5 + 3), h2 = hsh(i * 9 + 1, j * 7 + 9);
    if (nest) { if (h1 > 0.5) { const cx = 10 + h2 * (S - 22), cy = 10 + hsh(i, j + 40) * (S - 22), rx = 5 + h1 * 6, ry = 2 + h2 * 2.4; p.ell(cx, cy, rx, ry, '#081014', '#0c1a20'); p.line(cx - rx * 0.5, cy + ry * 0.5, cx + rx * 0.4, cy + ry * 0.7, '#3a7a78'); p.set(cx - rx * 0.4, cy - ry * 0.3, '#8fe8d8'); p.set(cx - rx * 0.4 + 1, cy - ry * 0.3, '#3a7a78'); }
      for (let k = 0; k < 4; k++) { const x = hsh(i + k * 3, j + 71) * S, y = hsh(i + 53, j + k * 5) * S; if (hsh(i + k, j + k) > 0.45) { p.set(x, y, '#1f6a68'); p.set(x + 1, y, '#2a8a80'); p.set(x, y + 1, '#143e40'); if (k % 2) p.set(x + 1, y - 1, '#5ad0c0'); } }
      for (let k = 0; k < 5; k++) { const x = hsh(i * 2 + k, j + 91) * (S - 4), y = hsh(i + 13, j * 2 + k) * (S - 3); p.set(x, y, '#4a7a80'); p.set(x + 1, y + 1, '#32525a'); }
      if (j === 3) for (let x = 0; x < S; x++) { const d = 2 + Math.round(2.4 * sin((x + i * S) * 0.19) + 1.6 * sin((x + i * S) * 0.47 + 1) + hsh(x + i * S, 5) * 1.6); for (let y = 0; y < d; y++) p.set(x, y, y === d - 1 ? '#0a2a2c' : y === 0 ? '#2a8a80' : '#145a58'); if (hsh(x + i * S, 9) > 0.86) { p.set(x, d, '#145a58'); p.set(x, d + 1, '#0a2a2c'); } if (hsh(x + i * S, 3) > 0.9) p.set(x, 1, '#8fe8d8'); } }
    else { if (h1 > 0.55) { let x = 6 + h2 * (S - 12), y = 4 + hsh(i + 5, j + 8) * 10; for (let k = 0; k < 14 + h1 * 12; k++) { p.set(x, y, '#0c080e'); if (k % 3 === 0) p.set(x + 1, y, '#4a434c'); x += hsh(k + i, j + 3) > 0.5 ? 1 : hsh(k + i, j + 3) > 0.2 ? 0 : -1; y += 1; } }
      for (let k = 0; k < 4; k++) { const x = 3 + hsh(i + k * 7, j + 21) * (S - 8), y = 3 + hsh(i + 33, j + k * 9) * (S - 8); if (hsh(i + k, j + k * 2) > 0.4) { p.set(x, y, '#5a525c'); p.set(x + 1, y, '#4a434c'); p.set(x, y + 1, '#0c080e'); p.set(x + 1, y + 1, '#0c080e'); } }
      if (h2 > 0.7) { const x = 8 + h1 * (S - 20), y = S - 14; p.line(x, y, x + 5, y + 2, '#6a5a48'); p.set(x + 6, y + 2, '#8a7a60'); p.set(x - 1, y - 1, '#8a7a60'); } }
    return (tcache[key] = p.done()); }
  const pflame = (p, x, y, t, sd, big) => { const k = Math.floor(t * 9 + sd * 3) % 3, h = (big ? 5 : 3) + (k === 1 ? 1 : 0), lean = k === 2 ? 1 : 0; for (let j = 0; j < h; j++) { const w = j < h * 0.5 ? (big ? 2 : 1) : j < h - 1 ? 1 : 0; for (let q = -w; q <= w; q++) p.set(x + q + (j > h * 0.6 ? lean : 0), y - j, j === 0 || Math.abs(q) === w && w ? '#f07a20' : '#ffd040'); } p.set(x, y - 1, '#fff8d8'); p.set(x + lean, y - h, '#a8242c'); };
  // 위쪽 벽과 입구. 너비 = 칸 여섯, 높이 = S * 0.7. 가운데 두 칸이 입구
  function wallTop(S, cols, t) { S = S || 64; cols = cols || 6; t = t || 0; const W = S * cols, H = Math.round(S * 0.7), k = 'wall:' + S + ':' + cols + ':' + (Math.floor(t * 9) % 3); if (tcache[k]) return tcache[k];
    const p = PX(W, H), cx = W / 2, aw = S * 0.62, ah = H - 6, R = RAMP.inv, L = RAMP.invLit, torches = [cx - S * 0.95, cx + S * 0.95];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const row = Math.floor(y / 9), bx = (x + (row % 2) * 9) % 18, by = y % 9; let v = 2.2 + (hsh(Math.floor((x + (row % 2) * 9) / 18), row) - 0.5) * 1.6 + (hsh(x, y) - 0.5) * 0.6; if (bx === 0 || by === 0) v = 0; else if (bx === 1 || by === 1) v += 0.8; else if (by === 8) v -= 0.8; if (y < 3) v -= 2; if (y > H - 3) v -= 1.2;
      const g = Math.max(...torches.map(tx => clamp(1 - Math.hypot(x - tx, (y - H * 0.4) * 1.1) / (S * 0.75), 0, 1))), ramp = g * 0.95 > bay(x, y) ? L : R; p.set(x, y, ramp[clamp(Math.round(v + g * 0.8), 0, 4)]); }
    // 문: 둥근 머리, 안쪽은 계단과 바깥 빛
    for (let y = H - ah; y < H; y++) for (let x = Math.floor(cx - aw - 5); x <= cx + aw + 5; x++) { const dx = (x - cx) / aw, top = H - ah + (1 - Math.sqrt(Math.max(0, 1 - dx * dx))) * ah * 0.55, dxo = (x - cx) / (aw + 5), topo = H - ah - 5 + (1 - Math.sqrt(Math.max(0, 1 - dxo * dxo))) * ah * 0.55;
      if (Math.abs(dx) <= 1 && y >= top) { const depth = (y - top) / (H - top), warm = clamp(1 - Math.hypot(dx * 0.9, depth * 0.9), 0, 1), step = Math.floor((H - y) / 5); let c = '#07050c'; if (y > H - 16) c = (H - y) % 5 === 0 ? '#5e4428' : step % 2 ? '#2e1e18' : '#44301e'; else if (warm > 0.72) c = '#ffd070'; else if (warm > 0.55 + bay(x, y) * 0.12) c = '#e08a30'; else if (warm > 0.36 + bay(x, y) * 0.14) c = '#7a3a18'; else if (warm > 0.2 + bay(x, y) * 0.1) c = '#2e1410'; p.set(x, y, c); }
      else if (Math.abs(dxo) <= 1 && y >= topo) { const seam = (Math.round(Math.atan2(y - H, x - cx) * 7) + 40) % 2; p.set(x, y, y < topo + 1.5 ? '#9a8a78' : seam ? '#6a5e58' : '#544a48'); if (Math.abs(dx) > 1 && Math.abs(Math.abs(dx) - 1) < 1.4 / aw) p.set(x, y, '#120e14'); } }
    p.rect(Math.round(cx - 3), H - ah - 7, 7, 6, '#9a8a78'); p.rect(Math.round(cx - 2), H - ah - 6, 5, 1, '#c8b8a0'); p.set(cx, H - ah - 4, '#a8242c'); p.set(cx - 1, H - ah - 3, '#a8242c'); p.set(cx + 1, H - ah - 3, '#a8242c'); p.set(cx, H - ah - 2, '#a8242c');
    torches.forEach((tx, n) => { tx = Math.round(tx); const ty = Math.round(H * 0.56); p.rect(tx - 1, ty, 3, 9, '#1c1008'); p.rect(tx, ty + 1, 1, 7, '#8a5a30'); p.rect(tx - 3, ty - 1, 7, 2, '#1b1d2a'); p.rect(tx - 2, ty - 1, 5, 1, '#8a92a8'); pflame(p, tx, ty - 2, t, n, true); for (let q = 0; q < 3; q++) p.set(tx + ((Math.floor(t * 9) + q * 5 + n * 3) % 7) - 3, ty - 9 - ((Math.floor(t * 9) * 2 + q * 3) % 6), '#ffd040'); });
    return (tcache[k] = p.done()); }
  const entrance = (S, t) => { S = S || 64; const w = wallTop(S, 6, t), c = mk(S * 2, w.height); c.getContext('2d').drawImage(w, -S * 2, 0); return c; };
  // 방: 칸 하나짜리 덧그림. k = 줄 안에서 몇 번째 칸, len = 줄 길이
  const ROOMS = {
    nursery: { name: '알집', col: '#d8e8a0', dark: '#3a4a1a' }, pool: { name: '고인 물', col: '#6ab8e0', dark: '#0f3a50' }, eye: { name: '벽의 눈', col: '#b08af0', dark: '#2a1860' }, digest: { name: '소화굴', col: '#e06a72', dark: '#4a0c16' },
    altar: { name: '기도 자리', col: '#f0a04a', dark: '#4a2a10' }, bone: { name: '뼈 울타리', col: '#e4dfd0', dark: '#4a463c' }, spore: { name: '포자밭', col: '#c8d848', dark: '#3a4410' }, shade: { name: '그늘', col: '#8a6ab0', dark: '#0c0816' },
  };
  const egg = (p, x, y, rx, ry, wake) => { p.ell(x, y, rx, ry, '#d8e8a0', '#2a3010'); p.ell(x + rx * 0.2, y + ry * 0.2, rx * 0.5, ry * 0.5, '#98a860'); p.set(x + rx * 0.3, y + ry * 0.1, wake ? '#ff5040' : '#2c3c18'); p.set(x - rx * 0.4, y - ry * 0.5, '#f8ffd8'); p.set(x - rx * 0.4 + 1, y - ry * 0.5, '#f8ffd8'); };
  const eyeFloor = (p, x, y, rx, ry, iris, look, lid) => { p.ell(x, y, rx + 1.5, ry + 1.5, lid || '#3a2580', '#120a26'); if (ry >= 1) { p.ell(x, y, rx, ry, '#e4dcf2'); p.ell(x + look, y, Math.min(rx * 0.5, ry + 0.5), ry, iris); p.ell(x + look, y, 0.6, Math.max(0.6, ry - 0.6), '#07050c'); p.set(x - rx * 0.5, y - ry * 0.5, '#ffffff'); } else p.line(x - rx, y, x + rx, y, '#120a26'); };
  function room(id, S, k, len, t) { S = S || 64; k = k || 0; len = len || 1; t = t || 0; const R = ROOMS[id]; if (!R) return mk(S); const fr = Math.floor(t * 8) % 8, key = 'room:' + id + ':' + S + ':' + k + ':' + len + ':' + fr; if (tcache[key]) return tcache[key];
    const p = PX(S, S), first = k === 0, last = k === len - 1, X = k * S, hh = (a, b) => hsh(a + k * 17 + id.length * 3, b + id.charCodeAt(0));
    // 엷은 물듦과 테두리
    if (id !== 'pool') for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) p.set(x, y, rgba(R.dark, id === 'shade' ? 0.62 : id === 'digest' ? 0.5 : 0.3));
    if (id === 'pool') { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const gx = x + X, top = 7 + 3 * sin(gx * 0.11) + 2 * sin(gx * 0.31 + 2), bot = S - 6 + 2.4 * sin(gx * 0.13 + 1) + 2 * sin(gx * 0.27), l = first ? 6 + 2.6 * sin(y * 0.2) : -1, r = last ? S - 6 + 2.6 * sin(y * 0.23 + 2) : S + 1; if (y > top && y < bot && x > l && x < r) { const edge = y < top + 2 || y > bot - 2.4 || x < l + 2 || x > r - 2, rip = sin(gx * 0.16 + y * 0.5 + t * TAU) + sin(gx * 0.05 - y * 0.33 + t * TAU * 2); p.set(x, y, edge ? (y > bot - 2.4 ? '#8ac8e8' : '#0a2434') : rip > 1.7 ? '#8ac8e8' : rip > 1.35 ? '#2a7aa0' : (bay(gx, y) < 0.5 ? '#12445e' : '#0f3a50')); } }
      for (let q = 0; q < 2; q++) { const cx = 14 + hh(q, 1) * (S - 28), cy = 18 + hh(q, 2) * (S - 36), rr = 3 + ((fr + q * 4) % 8); for (let a = 0; a < 24; a++) if ((a + q) % 3) p.mix(cx + cos(a * TAU / 24) * rr * 1.6, cy + sin(a * TAU / 24) * rr * 0.7, '#c8f0ff', 1 - rr / 11); } p.set(10 + hh(3, 3) * 40, 14 + hh(3, 4) * 30, '#ffffff'); }
    if (id === 'nursery') { for (const [x0, y0, x1, y1] of [[0, 12, 18, 0], [0, 26, 30, 0], [S, S - 14, S - 20, S], [S, S - 28, S - 32, S], [4, S, 0, S - 8]]) p.line(x0, y0, x1, y1, rgba('#f8ffd8', 0.28)); const A = first ? [[9, 9, 5, 6, 0], [19, 7, 4, 5, 1], [8, 20, 4, 4.6, 0]] : [[10, 8, 4, 5, 0], [20, 6, 3.4, 4, 0]], B = last ? [[S - 10, S - 11, 5, 6, 1], [S - 21, S - 8, 4, 5, 0], [S - 8, S - 23, 3.6, 4.4, 0]] : [[S - 10, S - 9, 4, 5, 0]]; for (const [x, y, rx, ry, w] of A.concat(B)) { p.ell(x, y + ry, rx + 1, 1.6, rgba('#0c1c0c', 0.6)); egg(p, x, y + ((fr + Math.round(x)) % 8 === 0 && w ? -1 : 0), rx, ry, w); } }
    if (id === 'eye') { for (const [a, l] of [[0.5, 22], [1.2, 26], [2, 20], [2.6, 24], [1.6, 16]]) { let x = S / 2, y = 12; for (let q = 0; q < l; q++) { p.mix(x, y, '#8a4ac8', 0.45); x += cos(a + sin(q * 0.5 + k) * 0.5); y += sin(a + sin(q * 0.5 + k) * 0.5) * 0.9; } } const look = [-2, -1, 0, 1, 2, 1, 0, -1][(fr + k * 3) % 8], bl = (fr + k * 5) % 8 === 7; eyeFloor(p, S / 2, 11, 12, bl ? 0 : 5.6, k % 2 ? '#7af0d8' : '#f0a04a', look); eyeFloor(p, S - 11, S - 9, 5, (fr + 3) % 8 === 7 ? 0 : 2.6, '#f070e8', look * 0.5); if (first) eyeFloor(p, 9, S - 14, 4, 2, '#fff3a0', -look * 0.5); }
    if (id === 'digest') { for (let y = 11; y < S - 6; y += 11) for (let x = 0; x < S; x++) { const yy = y + Math.round(2.6 * sin((x + X) * 0.17 + y)); p.mix(x, yy, '#c8505a', 0.42); p.mix(x, yy + 1, '#2a060c', 0.6); if ((x + X + y) % 11 === 0) p.mix(x, yy - 1, '#ffb0b0', 0.5); }
      for (let x = 3; x < S - 2; x += 7) { p.tri(x, 0, x + 5, 0, x + 2.5, 6 + ((x + X) % 3), '#fbf7ea'); p.set(x + 1, 1, '#ffffff'); p.tri(x + 2, S, x + 7, S, x + 4.5, S - 6 - ((x + X) % 2) * 2, '#cfc8b4'); }
      for (const [x, y, r] of [[S * 0.3, S * 0.4, 5], [S * 0.72, S * 0.66, 4]]) { p.ell(x, y, r, r * 0.5, '#7ab020', '#22060a'); p.set(x - 2, y - 1, '#e0ff70'); if ((fr + Math.round(x)) % 4 === 0) p.set(x + 1, y - 3 - (fr % 3), '#c0f040'); } }
    if (id === 'altar') { const cx = S / 2, cy = S / 2 + 2, rr = S * 0.36; for (let a = 0; a < 64; a++) { const an = a * TAU / 64; p.mix(cx + cos(an) * rr, cy + sin(an) * rr * 0.62, '#f0a04a', 0.7); if ((a + fr) % 4 < 2) p.mix(cx + cos(an) * rr * 0.7, cy + sin(an) * rr * 0.7 * 0.62, '#fff3c0', 0.55); } for (let q = 0; q < 3; q++) { const a0 = q * TAU / 3 + 0.5, a1 = a0 + TAU / 3 * 2; p.line(cx + cos(a0) * rr * 0.7, cy + sin(a0) * rr * 0.43, cx + cos(a1) * rr * 0.7, cy + sin(a1) * rr * 0.43, rgba('#f0a04a', 0.45)); }
      for (const [x, y, n] of [[7, 9, 0], [S - 8, 8, 1], [6, S - 6, 2], [S - 7, S - 7, 3]]) { p.rect(x - 1, y - 4, 3, 6, '#2a2018'); p.rect(x, y - 4, 1, 5, '#e8e0d0'); p.set(x - 1, y + 1, '#b0a490'); p.set(x + 1, y + 1, '#b0a490'); pflame(p, x, y - 5, t, n, false); p.mix(x - 2, y - 6, '#f0a04a', 0.4); p.mix(x + 2, y - 6, '#f0a04a', 0.4); } }
    if (id === 'bone') { for (let x = 4; x < S; x += 9) { const hgt = 13 + ((x + X) % 3) * 2, lean = ((x + X) % 2 ? 1 : -1); for (let q = 0; q < hgt; q++) { const xx = x + Math.round(lean * 2.4 * sin(q / hgt * 1.6)), w = q < hgt - 3 ? 1 : 0; p.set(xx - 1, 2 + hgt - q, '#1b1d2a'); p.set(xx + w + 1, 2 + hgt - q, '#1b1d2a'); p.set(xx, 2 + hgt - q, '#e4dfd0'); if (w) p.set(xx + 1, 2 + hgt - q, '#a8a294'); } p.set(x + lean * 2, 2, '#ffffff'); }
      p.rect(0, 15, S, 2, '#1b1d2a'); p.rect(0, 15, S, 1, '#a8a294'); for (let x = 2; x < S; x += 9) p.set(x, 15, '#ffffff');
      if (first) { p.ell(11, S - 11, 5, 4.4, '#e4dfd0', '#1b1d2a'); p.rect(8, S - 8, 6, 3, '#e4dfd0'); p.set(9, S - 12, '#1b1d2a'); p.set(10, S - 12, '#1b1d2a'); p.set(13, S - 12, '#1b1d2a'); p.set(9, S - 6, '#1b1d2a'); p.set(11, S - 6, '#1b1d2a'); p.set(13, S - 6, '#1b1d2a'); p.set(8, S - 14, '#ffffff'); }
      for (const [x, y] of last ? [[S - 16, S - 8], [S - 24, S - 14]] : [[S - 14, S - 7]]) { p.line(x, y, x + 8, y + 2, '#1b1d2a'); p.line(x, y - 1, x + 8, y + 1, '#e4dfd0'); p.set(x - 1, y - 1, '#ffffff'); p.set(x + 9, y + 1, '#a8a294'); } }
    if (id === 'spore') { for (let q = 0; q < 9; q++) { let x = hh(q, 1) * S, y = hh(q, 2) * S; for (let n = 0; n < 9; n++) { p.mix(x, y, '#8aa83a', 0.35); x += hh(q, n + 3) > 0.5 ? 1 : -1; y += hh(q + 9, n) > 0.4 ? 1 : 0; } }
      const M = [[9, 12, 4], [S - 10, 10, 3], [14, S - 8, 3], [S - 13, S - 9, 5], [S / 2 + 6, 8, 2]].concat(first ? [[5, S / 2, 3]] : []); for (const [x, y, r] of M) { p.rect(x, y, 1, r + 1, '#e0f090'); p.set(x - 1, y + r, '#4a6420'); p.ell(x, y - 1, r, r * 0.6, '#b0c040', '#14200c'); p.rect(Math.round(x - r), y, Math.round(r * 2 + 1), 1, '#4a6420'); p.set(x - r * 0.4, y - 2, '#f0ffa0'); p.set(x + r * 0.4, y - 1, '#e8ff7a'); }
      for (let q = 0; q < 8; q++) { const x = hh(q, 5) * S, y = S - ((hh(q, 6) * S + fr * 2.5 * (0.5 + hh(q, 7))) % S); p.mix(x + Math.round(sin(fr + q)), y, '#e8ff7a', 0.9); } }
    if (id === 'shade') { for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const ex = Math.min(first ? x : 99, last ? S - 1 - x : 99, y, S - 1 - y) / S; if (ex * 5 < bay(x + X, y) * 0.9 + 0.12) p.set(x, y, rgba('#07050c', 0.86)); } for (const [x, y, ph] of [[10, 10, 0], [S - 14, 13, 3], [12, S - 10, 5], [S - 11, S - 9, 6]]) if ((fr + ph) % 8 < 6) { p.set(x, y, '#c8a8ff'); p.set(x + 3, y, '#c8a8ff'); p.mix(x - 1, y, '#6a5080', 0.8); p.mix(x + 4, y, '#6a5080', 0.8); }
      for (let q = 0; q < 6; q++) { const x = hh(q, 1) * S, y = hh(q, 2) * S; for (let n = 0; n < 6; n++) p.mix(x + n, y + Math.round(sin(n * 0.9 + fr * 0.8 + q)), '#4a3a58', 0.7); } }
    // 테두리: 줄 바깥쪽만
    const E = rgba(R.col, 0.9), E2 = rgba(R.dark, 0.9), seg2 = (x, y, hor) => { if ((hor ? x + X : y) % 6 < 4) { p.set(x, y, E); } };
    for (let q = 2; q < S - 2; q++) { seg2(q, 1, true); seg2(q, S - 2, true); if (first) seg2(1, q, false); if (last) seg2(S - 2, q, false); }
    const corner = (x, y, dx, dy) => { for (let q = 0; q < 7; q++) { p.set(x + dx * q, y, R.col); p.set(x, y + dy * q, R.col); p.set(x + dx * q, y + dy, E2); p.set(x + dx, y + dy * q, E2); } p.set(x + dx * 2, y + dy * 2, '#ffffff'); };
    if (first) { corner(1, 1, 1, 1); corner(1, S - 2, 1, -1); } if (last) { corner(S - 2, 1, -1, 1); corner(S - 2, S - 2, -1, -1); }
    return (tcache[key] = p.done()); }
  // 표식: 성향 다섯, 종류 넷. 16 점 그림을 px 크기로
  const ICON = {
    abyss: D => { D.G([[2, 11], [3, 6], [6, 3], [10, 3], [12, 6], [10, 8], [8, 6], [6, 8], [8, 11], [12, 11], [14, 13], [3, 14]], P.abyss); D.px(5, 6, '#e8fff8'); D.px(4, 8, '#e8fff8'); D.px(10, 12, P.abyss[2]); },
    nebula: D => { D.G([[1, 8], [8, 3], [15, 8], [8, 13]], ['#120a26', '#e4dcf2', '#ffffff', '#a898c8']); D.flat(D.el(8, 8, 3, 3.4), '#6a4fc8', INK); D.flat(D.el(8, 8, 1, 2.6), '#07050c'); D.px(6.6, 6.4, '#ffffff'); D.px(8, 1, '#fff3a0'); D.px(2, 3, '#fff3a0'); D.px(13.6, 13, '#fff3a0'); },
    brood: D => { D.B(8, 8.6, 5, 6.2, P.egg); D.flat(D.el(8.6, 9.6, 2.4, 3), '#5a7030'); D.px(9.4, 9, '#f0e060'); D.px(5.6, 5, '#ffffff'); },
    dusk: D => { D.G([[2.6, 14], [2.6, 7], [5, 3], [8.6, 1], [11, 4], [13.4, 8], [13.4, 14]], [P.dusk[0], '#6a4a62', '#a888a0', '#3a2440']); D.flat(D.el(8, 9, 3.4, 4.2), VOID, P.dusk[0]); D.rect(7.6, 6.6, 1, 5, '#f0a04a'); D.px(7.6, 8.6, '#fff3c0'); },
    hunger: D => { D.B(8, 8, 6.6, 6, P.hunger); D.flat(D.el(8, 8.6, 4.8, 3.6), MAWC, P.hunger[0]); D.fangs(4, 12, 6, 1, 3, 2.6); D.fangs(5, 11.6, 12, -1, 2, 2.6); },
    guard: D => { D.G([[2.6, 2], [13.4, 2], [13.4, 8], [8, 14.6], [2.6, 8]], P.shell); D.L([[8, 3], [8, 13]], 0.5, 0.5, ['#0000', P.shell[3], P.shell[3], P.shell[3]], null); D.L([[4, 6.6], [12, 6.6]], 0.5, 0.5, ['#0000', P.shell[3], P.shell[3], P.shell[3]], null); D.px(4.4, 3.6, '#ffffff'); D.B(10.6, 9.6, 1.3, 1.3, P.abyss); },
    hunter: D => { for (const x of [2.6, 6.6, 10.6]) { D.L([[x + 3, 1.6], [x + 1.4, 8], [x, 14]], 1.5, 0.5, P.bone); } D.px(4, 14.4, '#e06050'); D.px(8, 14.4, '#e06050'); D.px(12, 14.4, '#e06050'); },
    caller: D => { D.lit(D.cut(D.el(8, 8, 6.6, 6.6), (x, y) => Math.hypot(x - 8, y - 8) > 4.6), P.gold); D.L([[8, 8], [10, 7], [10.4, 9.4], [8, 10.6], [5.6, 9], [6, 6], [9, 4.6]], 0.6, 0.6, ['#0000', '#fff3a0', '#fff3a0', '#fff3a0'], null); D.px(8, 8, '#ffffff'); },
    mother: D => { D.B(5.6, 10, 3.4, 4.2, P.egg); D.B(11, 10.6, 3, 3.6, P.egg); D.B(8.4, 5.4, 3.2, 4, P.egg); D.px(8.8, 5.6, '#5a7030'); D.px(5.8, 10.4, '#5a7030'); D.px(11.2, 11, '#ff5040'); D.px(7, 3.4, '#ffffff'); },
  };
  function sym(id, px) { px = px || 16; const k = 'sym:' + id + ':' + px; if (tcache[k]) return tcache[k]; const c = mk(px), x = c.getContext('2d'); if (ICON[id]) { const D = kit(16, 16); ICON[id](D); x.imageSmoothingEnabled = false; const sc = Math.max(1, Math.floor(px / 16)); x.drawImage(D.K.canvas(), PAD, PAD, 16, 16, Math.floor((px - 16 * sc) / 2), Math.floor((px - 16 * sc) / 2), 16 * sc, 16 * sc); } return (tcache[k] = c); }
  const aspIcon = sym, clsIcon = sym;
  const ROLEG = { tank: '1111111111111111111111111111011111000111000001000', melee: '0000011000011100011100101100001100001010001000000', ranged: '0011100010001010000011001001100000101000100011100', support: '0011100001110011111111111111111111100111000011100', dive: '1000001010001000101001001001010001000101000001000' };
  const ROLEC = { tank: '#a8c8ff', melee: '#ffb08a', ranged: '#ffe27a', support: '#8ff0a8', dive: '#e89cff' };
  // 판 위에 바로 그린다: (cx, cy) 가운데, 한 점의 크기 s
  function roleDraw(ctx, id, cx, cy, s) { const g = ROLEG[id]; if (!g) return false; s = s || 2; const w = 7 * s, x0 = Math.round(cx - w / 2), y0 = Math.round(cy - w / 2); ctx.fillStyle = '#0c0812'; ctx.fillRect(x0 - s - 1, y0 - s, w + 2 * s + 2, w + 2 * s); ctx.fillRect(x0 - s, y0 - s - 1, w + 2 * s, w + 2 * s + 2); ctx.fillStyle = ROLEC[id]; for (let i = 0; i < 49; i++) if (g[i] === '1') ctx.fillRect(x0 + (i % 7) * s, y0 + Math.floor(i / 7) * s, s, s); return true; }
  function role(id, px) { px = px || 18; const k = 'role:' + id + ':' + px; if (tcache[k]) return tcache[k]; const c = mk(px), s = Math.max(1, Math.floor(px / 9)); roleDraw(c.getContext('2d'), id, px / 2, px / 2, s); return (tcache[k] = c); }
  // 본보기 판과 싸움 장면 (확인용). 너비에 맞춰 칸 크기를 잡는다
  const SAMPLE_ROOMS = [['pool', 0, 3, 3], ['bone', 3, 3, 3], ['nursery', 0, 4, 2], ['digest', 2, 4, 2], ['eye', 4, 4, 2], ['altar', 0, 5, 2], ['shade', 4, 5, 2]];
  function mockBoard(width, o) { o = o || {}; const S = Math.floor(width / 6 / 8) * 8, ox = Math.floor((width - S * 6) / 2), t = o.t || 0, w = wallTop(S, 6, t), c = mk(width, w.height + S * 6 + (o.extra || 0)), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#07050c'; x.fillRect(0, 0, c.width, c.height); x.drawImage(w, ox, 0);
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) x.drawImage(tile(j < 3 ? 'inv' : 'nest', i, j, S), ox + i * S, w.height + j * S);
    for (const [id, ci, cj, len] of o.rooms || SAMPLE_ROOMS) for (let k = 0; k < len; k++) x.drawImage(room(id, S, k, len, t), ox + (ci + k) * S, w.height + cj * S);
    c.S = S; c.ox = ox; c.oy = w.height; return c; }
  function mockScene(width, t) { const alt = t >= 0.5, c = mockBoard(width, { t: alt ? 0.4 : 0.1, extra: 76, rooms: alt ? [['spore', 0, 3, 3], ['bone', 3, 3, 3], ['shade', 0, 4, 2], ['digest', 2, 4, 2], ['eye', 4, 4, 2], ['altar', 0, 5, 2], ['nursery', 4, 5, 2]] : null }), x = c.getContext('2d'), S = c.S, at = (i, j) => ({ x: c.ox + i * S + S / 2, y: c.oy + j * S + S * 0.5 }), gnd = S * 0.3, L = [];
    const U = (id, star, i, j, anim, tt, o) => L.push(Object.assign({ id, star, i, j, anim, tt, o: o || {} }, o));
    if (!alt) { U('knight', 1, 2, 2, 'attack', 230, { flip: true, hp: 0.8, san: 0.7 }); U('militia', 1, 3, 2, 'attack', 120, { flip: true, hp: 0.5, san: 0.4 }); U('torch', 1, 1, 2, 'idle', 300, { hp: 0.9, san: 0.2, mad: true }); U('hound', 1, 4, 2, 'move', 150, { flip: true, hp: 0.6, san: 0.8 }); U('archer', 1, 1, 0, 'attack', 200, { hp: 1, san: 0.9 }); U('priest', 1, 3, 0, 'cast', 330, { flip: true, hp: 1, san: 1 }); U('mage', 1, 4, 1, 'cast', 300, { flip: true, hp: 0.7, san: 0.6 }); U('bard', 1, 0, 1, 'idle', 500, { hp: 1, san: 1 });
      U('shell', 2, 2, 3, 'cast', 400, { hp: 0.7 }); U('maw', 1, 3, 3, 'attack', 160, { hp: 0.9 }); U('gnaw', 1, 1, 3, 'attack', 220, { hp: 0.4 }); U('biter', 2, 4, 3, 'attack', 200, { flip: true, hp: 0.8 }); U('tangle', 1, 0, 4, 'idle', 200, { hp: 1 }); U('gazer', 2, 1, 4, 'cast', 380, { hp: 1 }); U('hood', 1, 4, 4, 'cast', 300, { flip: true, hp: 0.6 }); U('heap', 1, 5, 3, 'idle', 700, { flip: true, hp: 1 }); U('brood', 1, 0, 5, 'idle', 100, { hp: 1 }); U('mother', 2, 5, 5, 'idle', 400, { flip: true, hp: 1 }); }
    else { U('paladin', 1, 2, 2, 'attack', 230, { flip: true, hp: 0.9, san: 0.9 }); U('inquis', 1, 3, 1, 'cast', 330, { flip: true, hp: 0.8, san: 0.8 }); U('seeker', 2, 3, 0, 'cast', 360, { flip: true, hp: 0.7, san: 0.35 }); U('rogue', 1, 1, 4, 'attack', 220, { hp: 0.5, san: 0.6 }); U('knight', 1, 4, 2, 'hit', 40, { flip: true, hp: 0.3, san: 0.5 }); U('archer', 1, 0, 1, 'mad', 200, { hp: 0.6, san: 0, mad: true }); U('militia', 1, 1, 2, 'die', 420, { hp: 0, san: 0.3 }); U('mage', 1, 5, 0, 'idle', 0, { flip: true, hp: 1, san: 0.9 });
      U('famine', 2, 3, 2, 'attack', 200, { hp: 0.8 }); U('mask', 2, 0, 3, 'cast', 360, { hp: 0.9 }); U('maw', 3, 2, 3, 'cast', 360, { hp: 0.6 }); U('heap', 2, 4, 3, 'cast', 380, { flip: true, hp: 0.7 }); U('gnaw', 3, 5, 3, 'attack', 180, { flip: true, hp: 1 }); U('hood', 2, 0, 4, 'idle', 0, { hp: 1 }); U('brood', 2, 5, 4, 'cast', 300, { flip: true, hp: 0.5 }); U('tangle', 2, 1, 5, 'attack', 200, { hp: 1 }); U('biter', 1, 4, 5, 'die', 500, { flip: true, hp: 0 }); U('gazer', 3, 0, 5, 'idle', 300, { hp: 1 }); }
    L.sort((a, b) => a.j - b.j);
    const core = boss(alt ? 'hunger' : 'abyss'), cp = { x: c.ox + 3 * S, y: c.oy + 5 * S + S * 0.5 };
    for (const u of L) { if (u.j === 5 && !u.coreDone) { } const h = unit(u.id, u.star), p = at(u.i, u.j); h.draw(x, p.x, p.y + gnd, u.anim, u.tt, { flip: u.o.flip, mad: u.o.mad }); }
    core.draw(x, cp.x, cp.y + gnd + 4, alt ? 'idle' : 'cast', alt ? 160 : 330, {});
    for (const u of L) { if (u.o.hp <= 0) continue; const h = unit(u.id, u.star), p = at(u.i, u.j), side = DEF[u.id].side === 'inv' ? 'inv' : 'kin'; bar(x, p.x, p.y + gnd - h.size * 0.86 - 8, 30, u.o.hp, side === 'inv' ? u.o.san : null, { side, mana: (u.i * 37 + u.j * 11) % 10 / 9 }); }
    bar(x, cp.x, cp.y + gnd - 84, 60, alt ? 0.55 : 0.9, null, { side: 'kin', mana: 0.7, px: 1 });
    const F = (n, a, b, tt, o) => fx(n, x, a, b, tt, Object.assign({ px: 2, size: S }, o));
    if (!alt) { F('beam', { x: at(1, 4).x + 6, y: at(1, 4).y - 4 }, at(1, 2), 0.55); F('shell', at(2, 3), at(2, 2), 0.5); F('firepillar', at(4, 1), at(4, 4), 0.5); F('light', at(3, 0), at(3, 2), 0.5); F('arrow', at(1, 0), at(1, 3), 0.4); F('spark', at(3, 2), at(3, 2), 0.3); F('bites', at(4, 3), at(4, 2), 0.86);
      num(x, at(1, 2).x, at(1, 2).y - 34, 62, 'san', 0.3, 2); num(x, at(3, 2).x + 6, at(3, 2).y - 34, 118, 'crit', 0.2, 2); num(x, at(4, 2).x, at(4, 2).y - 30, 55, 'dmg', 0.4, 2); num(x, at(3, 2).x - 22, at(3, 2).y - 16, '+40', 'heal', 0.5, 2); num(x, at(4, 4).x, at(4, 4).y - 34, 96, 'dmg', 0.35, 2); }
    else { F('dash', at(0, 2), at(3, 2), 0.5); F('seal', at(3, 1), at(2, 3), 0.42); F('eyes', at(4, 3), at(4, 3), 0.5); F('backstab', at(1, 1), at(0, 4), 0.86, { side: 1 }); F('madburst', at(0, 1), at(0, 1), 0.5); F('hatch', at(5, 4), at(4.4, 4.4), 0.7); F('ichor', at(4, 5), at(4, 5), 0.5);
      num(x, at(3, 2).x, at(3, 2).y - 40, 240, 'crit', 0.25, 2); num(x, at(0, 1).x, at(0, 1).y - 34, 0, 'mad', 0.3, 2); num(x, at(4, 2).x, at(4, 2).y - 30, 80, 'san', 0.4, 2); num(x, at(2, 2).x, at(2, 2).y - 30, 12, 'block', 0.4, 2); }
    // 아래: 대기석과 표식
    const by = c.oy + S * 6 + 6; x.fillStyle = '#120e18'; x.fillRect(0, by - 6, width, 76); ['shell', 'biter', 'gazer', 'hood', 'famine', 'mask'].forEach((id, n) => { const bx = c.ox + n * S + 4; x.fillStyle = '#1e1a28'; x.fillRect(bx, by, S - 8, 44); x.fillStyle = '#2e2838'; x.fillRect(bx, by, S - 8, 2); x.drawImage(icon(id, 1 + (n % 3), 40), bx + (S - 48) / 2, by + 2); });
    ['abyss', 'nebula', 'brood', 'dusk', 'hunger', 'guard', 'hunter', 'caller', 'mother'].forEach((id, n) => x.drawImage(sym(id, 16), c.ox + 6 + n * 22, by + 50));
    return c; }
  // ── ART-KIN2 시작
  // 새 권속 여덟 + 큰 새끼, 본체의 깨어남, 새 연출. 그림 지시서: lair_units2.md
  // 배불뚝이: 몸의 대부분이 늘어진 배. 배 한가운데 세로로 찢어진 입. 등에는 삼킨 것들의 윤곽이 불룩하다
  DEF.gulp = { build(R, st) {
    const p = P.hunger, dk = dkp(p), bl = ['#2a1808', '#d8b860', '#f8e8a0', '#9a7a38'], bn = P.bone, g = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0, tg = ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038'];
    const rx = 15 + g * 0.6, ry = 12.4 + g, cy = 31 - g;
    R.ichor = '#6a121c'; R.shw = 17; R.glow = '#ff8a7a'; R.eyes = [['head', 33.4, 14.6 - g]];
    R.part('legB', { px: 15, py: 39, z: 0, role: 'leg', ph: Math.PI, amp: 0.5 }, D => { D.L([[15.6, 37], [14, 43]], 3.2, 2.6, dk); D.G([[10.6, 45.4], [14, 42.4], [18.6, 45.4]], dk); });
    R.part('armB', { px: 13, py: 25, z: 0, role: 'arm', ph: 2, amp: 0.5, parent: 'belly' }, D => { D.L([[13.6, 24], [8.6, 29], [8, 34.6]], 2.8, 2, dk); for (const k of [-1, 0, 1]) D.L([[8, 35], [7.4 + k * 1.4, 37.6]], 0.7, 0.5, bn); });
    R.part('belly', { px: 24, py: 45, z: 2, role: 'body', amp: 1.2 }, D => {
      D.shade(D.cut(D.el(24, cy, rx, ry), (x, y) => y < 44.8), (x, y) => { const dx = (x - 24) / rx, dy = (y - cy) / ry, v = -dx * 0.5 - dy * 0.72 + (1 - Math.hypot(dx, dy)) * 0.3, by = Math.hypot((x - 28.6) / (rx * 0.66), (y - cy - 3.4) / (ry * 0.78)); if (by < 1) return v > 0.42 ? bl[2] : v > -0.16 ? bl[1] : bl[3]; if (by < 1.12) return p[3]; return v > 0.64 ? p[2] : v > 0.14 ? p[1] : v > -0.3 ? p[3] : deepOf(p); }, p[0]);
      // 삼킨 것들: 안에서 밀어 올린 얼굴과 손
      D.L([[12.6, 27], [14, 23.6], [17, 22.6]], 0.6, 0.6, ['#0000', p[2], p[2], p[2]], null); D.px(14.4, 25.6, deepOf(p)); D.px(16.6, 25, deepOf(p)); D.rect(14.6, 27.4, 2, 0.8, deepOf(p)); D.px(13, 29, p[2]);
      for (const k of [0, 1, 2, 3]) D.L([[11.6 + k * 1.7, 36.6 - k * 0.5], [11 + k * 1.7, 33 - (k === 1 || k === 2 ? 1.2 : 0)]], 0.6, 0.5, ['#0000', p[2], p[2], p[2]], null); D.px(10.6, 37.6, p[2]);
      if (g) { D.L([[19, 20.6 - g], [21.6, 19 - g], [24.6, 19.6 - g]], 0.6, 0.6, ['#0000', '#ffb0a0', '#ffb0a0', '#ffb0a0'], null); D.px(21, 21.4 - g, deepOf(p)); D.px(23, 21.4 - g, deepOf(p)); }
      // 늘어진 배의 주름과 힘줄
      for (const [a, b, c] of [[[20, 40.6], [27, 43], [35, 40]], [[21.6, 37.4], [24, 38.6], [25.6, 38]]]) D.L([a, b, c], 0.5, 0.5, ['#0000', bl[3], bl[3], bl[3]], null);
      for (const [x, y] of [[33.6, 26], [35.6, 33], [22, 30]]) { D.px(x, y, '#c85a4a'); D.px(x + 0.8, y + 0.9, '#c85a4a'); }
      D.px(19.6, 24.6 - g, '#ffd0c8'); D.px(20.6, 24 - g, '#ffd0c8'); D.px(30, 24.4, '#ffffff'); D.px(31, 24.4, '#fff8d8');
      if (g3) { D.flat(D.el(17.6, 31.6, 2.8, 1.6), MAWC, p[0]); D.fangs(15.6, 19.6, 30.4, 1, 1.4, 1.5); }
    });
    R.part('mouth', { px: 28.6, py: cy + 3, z: 4, parent: 'belly', morph: true, bite: true, flare: true }, (D, m) => {
      const w = 1.2 + m * 5.4, h = 8.2 + g + m * 1.4, my = cy + 3, n = 6 + g + g3;
      D.flat(D.el(28.6, my, w + 1.3, h + 1), GUM, bl[0]); D.flat(D.el(28.6, my, w, h - 0.5), MAWC); if (m > 0.3) { D.flat(D.el(29, my + 0.6, w * 0.55, h * 0.6), VOID); D.L([[28.6, my + h * 0.2], [29.6, my + h * 0.7], [28, my + h + 1 + g3 * 2]], 1.4, 0.8, tg); }
      for (let k = 0; k < n; k++) { const y = my - h + 1.8 + k * (2 * h - 3.6) / (n - 1), ww = w * Math.sqrt(Math.max(0, 1 - Math.pow((y - my) / h, 2))), len = 1.3 + m * 2.2 + (k % 2) * 0.7; D.G([[28.6 - ww - 0.6, y - 0.9], [28.6 - ww + len, y + 0.1], [28.6 - ww - 0.6, y + 0.9]], bn, null); D.G([[28.6 + ww + 0.6, y - 0.1], [28.6 + ww - len, y + 0.9], [28.6 + ww + 0.6, y + 1.7]], bn, null); }
    });
    R.part('legF', { px: 35, py: 39, z: 5, role: 'leg', amp: 0.5 }, D => { D.L([[35, 38], [36, 43]], 3.2, 2.6, p); D.G([[32.6, 45.4], [36, 42.2], [41.4, 45.4]], p); D.px(40.4, 44.8, bn[1]); D.px(38.4, 44.8, bn[1]); D.px(36.4, 44.8, bn[1]); });
    R.part('head', { px: 31, py: 19 - g, z: 6, role: 'head', amp: 0.7, parent: 'belly', jaw: -0.1 }, D => {
      const y = 15 - g; D.B(32, y, 4.8, 3.8, p); D.G([[28, y - 1.6], [30, y - 4.4], [31.6, y - 2.6]], bn); if (g) D.G([[31, y - 3], [33.4, y - 5.6], [34.6, y - 2.6]], bn);
      D.eye(33.4, y - 0.4, 1.5, '#f0d040', false); D.eye(30, y - 0.8, 1, '#f0a04a', false); if (g3) D.eye(35.6, y + 1, 0.9, '#f0d040', false);
      D.rect(31, y + 2.4, 4.6, 1, MAWC); D.px(31.6, y + 2.4, TOOTH); D.px(33.4, y + 2.4, TOOTH); D.px(35, y + 2.4, TOOTH);
    });
    R.part('armF', { px: 34, py: 24, z: 7, role: 'arm', amp: 0.4, parent: 'belly', strike: 0.8, reach: 0.1 }, D => { D.L([[34.6, 23], [39.6, 28], [39, 34]], 3, 2.2, p); for (const k of [-1, 0, 1]) D.L([[39, 34.6], [39.4 + k * 1.4, 37.4]], 0.7, 0.5, bn); D.px(36.6, 24, p[2]); });
    R.pose = (anim, f, G, T, fx, s) => {
      if (anim === 'idle') { T.belly.rot = 0.025 * sin(f * TAU); T.mouth.m = 0.08 + 0.08 * sin(f * TAU * 2); }
      if (anim === 'cast') { const k = s.rise, b = sin(seg(f, 0.7, 1) * Math.PI); T.mouth.m = k; T.mouth.sx = 1 + 0.9 * k; T.mouth.sy = 1 + 0.35 * k; T.belly.sx *= 1 + 0.13 * b - 0.04 * k; T.belly.sy *= 1 + 0.08 * b; T.head.dy -= 2 * s.u * k; T.armF.rot -= 0.7 * k; T.armB.rot += 0.6 * k; G.dy = 0; }
    };
  } };
  // 도는 눈들: 작은 눈 다섯이 보이지 않는 중심을 돈다. 몸은 없다. 궤도마다 가는 고리. 별이 오르면 눈이 일곱, 아홉
  DEF.orbit = { build(R, st) {
    const p = P.nebula, ringC = ['#120a26', '#8a6ad8', '#cdbcff', '#4a3498'], CX = 24, CY = 21 - (st - 1) * 1.5;
    // 궤도: [가로 반지름, 세로 반지름, 기울기, 빠르기(바퀴), 눈 수]
    const ORB = [[16, 5, 0.14, 1, 2], [12, 4.4, -0.62, -1, 2], [7, 9.4, 0.12, 1, 1]].concat(st >= 2 ? [[19, 3, -0.08, -1, 2]] : [], st >= 3 ? [[10.6, 12.6, -0.24, 1, 2]] : []);
    R.ichor = '#3a2580'; R.shw = 8; R.glow = '#cdbcff';
    const ring = (D, front, o) => { const [rx, ry, tilt] = o, pts = [], n = 22; for (let k = 0; k <= n; k++) { const a = (front ? 0 : Math.PI) + k / n * Math.PI; pts.push([CX + cos(a) * rx, CY + sin(a) * ry + cos(a) * rx * tilt]); } const c = front ? ringC[1] : ringC[3]; for (let k = 0; k < n; k++) if (k % 5 !== 3) D.L([pts[k], pts[k + 1]], 0.4, 0.4, ['#0000', c, c, c], null); };
    R.part('ringB', { px: CX, py: CY, z: 0 }, D => ORB.forEach(o => ring(D, false, o)));
    // 가운데: 아무것도 없다. 별 몇 점이 안쪽으로 빨려 든다
    R.part('void', { px: CX, py: CY, z: 1, role: 'pulse', amp: 1.6 }, D => { if (st >= 3) { D.flat(D.el(CX, CY, 2.2, 2.6), VOID, '#3a2580'); D.px(CX, CY, '#cdbcff'); } for (const [dx, dy] of [[-2.6, -1.6], [2.4, 1.2], [0.6, -3.4], [-1, 3]].slice(0, 2 + st)) D.px(CX + dx, CY + dy, st >= 3 ? '#fff3a0' : '#8a6ad8'); });
    const eyes = []; ORB.forEach((o, oi) => { for (let k = 0; k < o[4]; k++) eyes.push({ name: 'e' + eyes.length, o, ph: k * TAU / o[4] + oi * 1.3, r: (oi === 2 ? 4 : 3.3) + (st >= 2 ? 0.2 : 0) }); });
    eyes.forEach((e, i) => R.part(e.name, { px: CX, py: CY, z: 2 + i, morph: true, blink: true, ph: i * 1.9 }, (D, m) => {
      const r = e.r; D.B(CX, CY, r, r, SCL); D.flat(D.el(CX + 0.7, CY + 0.2, r * 0.5, r * 0.56), i % 2 ? '#2a2e9a' : '#6a4fc8', null); D.flat(D.el(CX + 0.7, CY + 0.2, r * 0.3, r * 0.34), i % 2 ? '#141a5a' : '#3a2580', null); D.px(CX + 0.7, CY + 0.2, '#ffffff'); D.px(CX - r * 0.5, CY - r * 0.5, '#ffffff');
      D.L([[CX - r + 0.6, CY + 0.6], [CX - r * 0.4, CY + 1]], 0.5, 0.4, ['#0000', '#c85a7a', '#c85a7a', '#c85a7a'], null);
      if (m > 0) { const cut = CY - r + (0.3 + m * 2) * r; D.ball(D.cut(D.el(CX, CY, r + 0.3, r + 0.3), (xx, yy) => yy < cut), CX, CY, r + 0.3, r + 0.3, p); }
    }));
    R.part('ringF', { px: CX, py: CY, z: 18 }, D => ORB.forEach(o => ring(D, true, o)));
    R.eyes = eyes.map(e => [e.name, CX, CY]);
    R.pose = (anim, f, G, T, fx, s) => {
      const u = s.u, gather = anim === 'attack' ? s.chg : 0, line = anim === 'cast' ? ease(seg(f, 0, 0.35)) * (1 - ease(seg(f, 0.8, 1))) : 0, die = anim === 'die' ? s.ds : 0, n = eyes.length;
      eyes.forEach((e, i) => { const [rx, ry, tilt, sp] = e.o, a = e.ph + sp * f * TAU * (anim === 'idle' || anim === 'mad' ? 1 : anim === 'move' ? 1 : 0.5) + (anim === 'mad' ? sin(f * TAU * 3 + i) * 0.5 : 0), k = 1 - 0.72 * gather, ox = cos(a) * rx * k, oy = (sin(a) * ry + cos(a) * rx * tilt) * k, depth = sin(a);
        // 시전: 한 줄로 선다
        const lx = (i - (n - 1) / 2) * (30 / Math.max(4, n - 1)), ly = -3 - 2 * sin(i * 2.1), t = T[e.name], part = R.parts.find(q => q.name === e.name);
        t.dx = lerp(ox, lx, line) * u; t.dy = (lerp(oy, ly, line) + die * (12 + i * 2)) * u; const sc = (1 + 0.14 * depth * (1 - line)) * (1 + 0.25 * gather); t.sx = sc; t.sy = sc; part.z = 2 + (line > 0.5 ? i : Math.round((depth + 1) * 15)); if (anim === 'cast' && line > 0.9) t.m = 0; });
      if (anim === 'cast') { G.dy = -3 * u * line; fx.glow = Math.max(fx.glow, line); T.ringB.sy = T.ringF.sy = 1 - 0.7 * line; T.ringB.sx = T.ringF.sx = 1 + 0.25 * line; }
      if (anim === 'attack') { T.ringB.rot = T.ringF.rot = 0.4 * s.chg; fx.glow = Math.max(fx.glow, 0.6 * s.chg); }
      if (anim === 'die') { T.ringB.sy = T.ringF.sy = 1 - 0.9 * die; }
    };
  } };
  SHOOT.orbit = 1;
  // 종 든 것: 두건 쓴 큰 몸이 제 가슴에 박힌 종을 두 손으로 안고 있다. 종 속에 추 대신 혀. 두건 아래는 비어 있다
  DEF.bell = { build(R, st) {
    const p = P.dusk, lit = [p[0], '#6a4a62', '#a888a0', '#3a2440'], dkr = [p[0], '#32203a', '#5a3e5a', '#1c1024'], fl = P.flesh, gl = p[4], g = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0;
    const bz = ['#1a140a', '#8a6a34', '#d8b868', '#4a3a1e'], tg = ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038'], vd = '#4a9a80';
    R.ichor = '#2a1830'; R.shw = 16; R.glow = gl; R.eyes = [['hoodp', 28.6, 13.4 - g]];
    for (let k = 0; k < 6; k++) R.part('hem' + k, { px: 10.6 + k * 5.2, py: 41, z: 0, role: 'sway', ph: k * 1.3, amp: 0.7, parent: 'robe' }, D => D.G([[8.4 + k * 5.2, 40], [13 + k * 5.2, 40], [11.6 + k * 5.2 + (k % 2 ? 1.2 : -1), 45.6 - (k % 2) * 1.4]], dkr));
    R.part('robe', { px: 24, py: 45, z: 2, role: 'body', amp: 0.6 }, D => {
      D.G([[14, 19 - g], [20, 15 - g], [31, 15.6 - g], [36.6, 21], [39.6, 41.6], [8, 41.6], [10, 26]], lit);
      for (const [a, b] of [[[13, 24], [10.6, 40]], [[17, 22], [15.6, 40.6]], [[35, 24], [37.4, 40.6]], [[30.6, 38], [31.6, 41]], [[21, 38.6], [20.4, 41]]]) D.L([a, b], 0.5, 0.5, ['#0000', p[3], p[3], p[3]], null);
      D.L([[15, 20.6], [12.6, 26]], 0.5, 0.5, ['#0000', lit[2], lit[2], lit[2]], null);
      // 가슴이 벌어진 자리: 종이 박힌 살
      D.flat(D.el(25.6, 28, 9.4 + g, 9), '#3a1420', p[0]); for (let k = 0; k < 6; k++) { const a = -2.6 + k * 0.42; D.L([[25.6 + cos(a) * 9, 28 + sin(a) * 8.6], [25.6 + cos(a) * 7, 28 + sin(a) * 6.6]], 0.5, 0.4, ['#0000', '#8a2038', '#8a2038', '#8a2038'], null); }
      if (g) for (const [x, y] of [[12, 30], [37, 31]]) { D.L([[x, y], [x + 1, y + 5]], 0.5, 0.5, ['#0000', '#5a4a30', '#5a4a30', '#5a4a30'], null); D.flat(D.el(x + 1, y + 7, 1.6, 1.8), bz[1], bz[0]); D.px(x + 0.4, y + 6.4, bz[2]); }
    });
    R.part('tongue', { px: 25.6, py: 34, z: 3, role: 'sway', amp: 1.3, ph: 1, sp: 1, parent: 'bell' }, D => { for (const dx of g3 ? [-2.6, 0, 2.6] : [0]) { D.L([[25.6 + dx * 0.4, 33], [25.6 + dx, 38], [25 + dx * 1.2, 41.6 + (dx ? 0 : 1)]], 1.5, 1, tg); D.px(25 + dx * 1.2, 42.4 + (dx ? 0 : 1), '#ffd0d8'); } });
    R.part('bell', { px: 25.6, py: 22, z: 4, role: 'sway', amp: 0.16, parent: 'robe', cast: 0.5 }, D => {
      const w = 7 + g * 0.8; D.shade(D.poly([[25.6 - w * 0.45, 20.6], [25.6 + w * 0.45, 20.6], [25.6 + w * 0.8, 27], [25.6 + w * 1.06, 33.6], [25.6 + w * 1.2, 36.4], [25.6 - w * 1.2, 36.4], [25.6 - w * 1.06, 33.6], [25.6 - w * 0.8, 27]]), (x, y) => { const dx = (x - 25.6) / w, n = hsh(Math.round(x * 2), Math.round(y * 2)); if (n > 0.95 && dx > -0.1) return vd; if (n < 0.035) return '#6a3a22'; return dx < -0.5 ? bz[2] : dx < 0.05 ? bz[1] : dx < 0.6 ? bz[3] : '#2e2412'; }, bz[0]);
      D.flat(D.el(25.6, 36.4, w * 1.2, 1.5), MAWC, bz[0]); D.flat(D.el(25.6, 36.6, w * 0.8, 0.8), '#5a2a14'); D.rect(25.6 - w * 0.9, 31.6, w * 1.8, 0.8, bz[3]); D.rect(25.6 - w * 0.7, 25, w * 1.4, 0.7, bz[3]);
      D.L([[22.6, 22.6], [21, 27], [20.4, 32.6]], 0.5, 0.5, ['#0000', '#fff3c0', '#fff3c0', '#fff3c0'], null); D.flat(D.el(25.6, 19.6, 2, 1.6), bz[1], bz[0]); D.px(25, 19, bz[2]);
      // 종에 새긴 눈 모양 문양
      D.flat(D.el(26.6, 28.4, 2.4, 1.5), bz[0]); D.px(26.6, 28.4, gl); if (g3) { D.L([[29, 22], [28, 26], [29.6, 30]], 0.4, 0.4, ['#0000', '#fff3c0', '#fff3c0', '#fff3c0'], null); D.px(28, 26, gl); D.px(29, 28, gl); }
    });
    R.part('armB', { px: 14, py: 22, z: 1, role: 'arm', amp: 0.2, ph: 2, parent: 'robe' }, D => D.L([[13.6, 22], [10, 28], [13, 33]], 3.4, 2.8, dkr));
    R.part('armL', { px: 15, py: 22, z: 5, role: 'arm', amp: 0.15, parent: 'robe', cast: -0.25 }, D => { D.L([[15, 22], [14, 29], [18.6, 32.6]], 3.2, 2.4, lit); D.L([[18.6, 32.6], [21.6, 31.6]], 1.1, 0.8, fl); for (const k of [0, 1, 2]) D.L([[21.6, 31.6], [23.4, 30 + k * 1.3]], 0.5, 0.4, fl); });
    R.part('armR', { px: 35, py: 22, z: 6, role: 'arm', amp: 0.15, ph: 1, parent: 'robe', cast: 0.25, strike: 0.5 }, D => { D.L([[35, 22], [37.6, 28], [34, 31]], 3.2, 2.4, lit); D.L([[34, 31], [31, 29.4]], 1.1, 0.8, fl); for (const k of [0, 1, 2]) D.L([[31, 29.4], [29, 28 + k * 1.3]], 0.5, 0.4, fl); if (g3) { D.L([[36, 30], [35, 35], [31, 36.6]], 2.2, 1.6, lit); D.L([[31, 36.6], [28.6, 35.6]], 0.9, 0.7, fl); } });
    R.part('hoodp', { px: 25, py: 18 - g, z: 7, role: 'head', amp: 0.8, parent: 'robe' }, D => {
      const t = g + g3 * 1.5; D.G([[18, 18.6 - t], [18.6, 11 - t], [22.6, 6.6 - t], [29, 6 - t], [34, 10 - t], [34.6, 18 - t], [31, 20.6 - t], [22, 20.6 - t]], lit); D.L([[22.6, 6.6 - t], [17.6, 5 - t], [15, 8 - t]], 1.7, 0.6, lit);
      D.flat(D.el(28.6, 13.4 - t, 4.4, 5.4), VOID, p[0]); D.px(27, 16.6 - t, '#1c1024'); D.px(30, 11 - t, '#1c1024'); D.px(20.6, 9.6 - t, lit[2]); D.px(21.6, 8.6 - t, lit[2]);
      if (g3) { D.G([[14, 20], [13, 14], [16.4, 10.6], [19, 14], [18.6, 20]], dkr); D.flat(D.el(16.4, 15.6, 1.6, 2.6), VOID); }
    });
    R.pose = (anim, f, G, T, fx, s) => {
      if (anim === 'idle') { T.bell.rot = 0.07 * sin(f * TAU); T.tongue.rot = 0.3 * sin(f * TAU - 1.2); }
      if (anim === 'cast') { const back = ease(seg(f, 0, 0.36)) * (1 - seg(f, 0.36, 0.5)), hit = seg(f, 0.44, 0.52) * (1 - ease(seg(f, 0.52, 1))); G.rot = -0.3 * back + 0.14 * hit; G.dy = 0; G.sy = 1; G.sx = 1; T.bell.rot = -0.5 * back + 0.8 * hit * cos((f - 0.5) * 30); T.tongue.rot = 0.9 * back - 1.1 * hit * cos((f - 0.5) * 30); T.hoodp.rot = -0.25 * back + 0.2 * hit; T.armL.rot = -0.3 * back; T.armR.rot = 0.3 * back; fx.glow = Math.max(0, hit); }
      if (anim === 'hit') { T.bell.rot = 0.3 * s.hr; T.tongue.rot = -0.7 * s.hr; }
    };
  } };
  // 먹물 뿜는 것: 긴 대롱 같은 몸에 주머니 셋. 대롱 끝이 꽃처럼 갈라진다. 바닥에 붙은 발판에서 촉수가 뿌리처럼 뻗는다
  DEF.ink = { build(R, st) {
    const p = P.abyss, dk = dkp(p), q = P.abyss2, inkP = ['#04060a', '#1a2634', '#5a7e98', '#0a1018'], g = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0, H = g * 2 + g3 * 2;
    R.ichor = '#0a1018'; R.shw = 13; R.glow = '#8fe8d8'; R.eyes = [['stalk', 27.6, 22.6 - H]];
    [[15, -1, 0], [20, -0.5, 1.4], [29, 0.6, 2.9], [33, 1, 4.2]].concat(g ? [[24, 0.15, 5.2]] : []).forEach(([x, dir, ph], k) => R.part('root' + k, { px: x, py: 43, z: 0, role: 'sway', amp: 0.35, ph }, D => tent(D, [[x, 43], [x + dir * 5, 42], [x + dir * 9, 44.6], [x + dir * 12.6, 43.6 - (k % 2) * 2]], 1.7, 0.5, dk, k % 2 ? '#bfe8f0' : null)));
    R.part('pad', { px: 24, py: 45, z: 1 }, D => { D.B(24, 42.6, 9.6 + g, 3.2, q); for (const x of [17, 21, 27, 31]) D.px(x, 44, q[3]); D.px(19, 41, '#e8fff8'); D.px(20, 40.8, '#e8fff8'); });
    R.part('stalk', { px: 24, py: 43, z: 3, role: 'body', amp: 0.5 }, D => {
      const top = 15 - H; D.L([[24, 42], [21.6, 34], [24.6, 25 - H * 0.5], [25, top]], 4.6, 3.4, p);
      for (let k = 0; k < 7 + g * 2; k++) { const y = 39 - k * (24 + H) / (7 + g * 2), x = 22.6 + sin(k * 0.9) * 1.2; D.L([[x - 3, y + 0.6], [x + 3.4, y]], 0.5, 0.5, ['#0000', p[3], p[3], p[3]], null); }
      D.L([[21.6, 38], [19.6, 32], [22, 24 - H * 0.5]], 0.6, 0.5, ['#0000', '#c8fff0', '#c8fff0', '#c8fff0'], null);
      D.eye(27.6, 22.6 - H, 2 + g3 * 0.4, '#e8d48a', true); if (g) D.eye(25, 30, 1.2, '#e8d48a', false); if (g3) D.eye(22.4, 19 - H, 1, '#e8d48a', false);
      for (const [x, y] of [[26.6, 36], [23, 29], [27, 28.6 - H * 0.3]]) { D.px(x, y, '#e8d48a'); D.px(x + 0.8, y + 0.8, p[3]); }
    });
    // 먹물 주머니: 차례로 부풀었다 꺼진다
    const sacs = [[16.6, 35.6, 4, 0], [16, 26.6 - H * 0.3, 4.6, 2.1], [18.6, 18.6 - H * 0.7, 3.6, 4.2]].concat(g ? [[31, 33, 3.2, 1.2]] : [], g3 ? [[31.6, 16.6 - H * 0.6, 2.8, 3.3]] : []);
    sacs.forEach(([x, y, r, ph], k) => R.part('sac' + k, { px: x + (x < 24 ? r : -r) * 0.7, py: y + r * 0.4, z: x < 24 ? 2 : 4, role: 'pulse', amp: 2, ph, parent: 'stalk' }, D => { D.L([[x + (x < 24 ? r : -r), y + 1], [x, y]], 1.3, 1.1, dk); D.B(x, y, r, r * 1.14, inkP); D.px(x - r * 0.4, y - r * 0.5, '#c8e8ff'); D.px(x - r * 0.4 + 1, y - r * 0.5, '#8ab0d0'); D.px(x + r * 0.2, y + r * 0.5, '#2a3a4c'); D.L([[x - r * 0.6, y + r * 0.2], [x, y + r * 0.8], [x + r * 0.6, y + r * 0.3]], 0.4, 0.4, ['#0000', '#0a1018', '#0a1018', '#0a1018'], null); }));
    // 대롱 끝: 꽃처럼 갈라진 주둥이
    R.part('bloom', { px: 25, py: 16 - H, z: 6, role: 'head', amp: 0.8, parent: 'stalk', morph: true, flare: true, bite: true, cast: -0.5 }, (D, m) => {
      const cx = 26, cy = 12 - H, n = 5 + g + g3, open = 0.5 + m * 0.9, pal = [p[0], p[2], '#e8fff8', p[1]];
      for (let k = 0; k < n; k++) { const a = -1.15 + (k - (n - 1) / 2) * (0.5 + open * 0.34), len = 6.4 + (k % 2) * 1.6 + g3, bx = cx + cos(a + Math.PI / 2) * 1.5, by = cy + 2 + sin(a + Math.PI / 2) * 1.5, tx = cx + cos(a) * len + 1.6, ty = cy + 2 + sin(a) * len;
        D.G([[bx - cos(a + 1.57) * 3, by - sin(a + 1.57) * 3], [cx + cos(a) * len * 0.6 + cos(a - 1.57) * 1.8, cy + 2 + sin(a) * len * 0.6 + sin(a - 1.57) * 1.8], [tx, ty], [bx, by]], k % 2 ? pal : p); D.px(tx, ty, '#e8d48a'); }
      D.flat(D.el(cx + 1, cy + 1.4, 2.4 + m * 1.4, 1.8 + m * 1.4), '#04060a', p[0]); if (m > 0.3) { D.flat(D.el(cx + 1.6, cy + 0.6, 1.4 + m, 1.2 + m), '#1a2634'); D.px(cx + 1, cy, '#5a7e98'); }
      D.px(cx - 0.6, cy + 4.6, '#04060a'); if (g) D.px(cx + 3.4, cy + 4.4, '#04060a');
    });
    for (let k = 0; k < 1 + g + g3; k++) R.part('drip' + k, { px: 24, py: 30, z: 7, role: 'float', amp: 2.2, ph: k * 2.2 }, D => { const x = 30 + k * 3 - (k === 2 ? 14 : 0), y = 22 - H + k * 6; D.flat(D.el(x, y, 0.8, 1.2), '#04060a', null); D.px(x, y - 0.4, '#5a7e98'); });
    R.pose = (anim, f, G, T, fx, s) => {
      if (anim === 'cast') { const back = ease(seg(f, 0, 0.4)) * (1 - seg(f, 0.4, 0.5)), spit = seg(f, 0.42, 0.5) * (1 - ease(seg(f, 0.5, 1))); T.stalk.rot = -0.3 * back + 0.2 * spit; T.bloom.rot = -0.5 * back + 0.45 * spit; T.bloom.m = Math.max(back * 0.5, spit); G.dy = 0; G.sy = 1 + 0.06 * spit - 0.05 * back; sacs.forEach((q2, k) => { const t = T['sac' + k], sc = 1 + 0.35 * back - 0.3 * spit; t.sx = sc; t.sy = sc; }); }
      if (anim === 'attack') { T.stalk.rot = -0.14 * s.chg + 0.1 * s.rec; T.bloom.m = s.chg; }
    };
  } };
  SHOOT.ink = 1;
  // 텅 빈 것: 갈비뼈만 남은 긴 몸. 가슴 속이 비어 있고 그 안에 이빨이 둥글게 났다. 낫처럼 휜 앞다리 둘
  DEF.hollow = { build(R, st) {
    const bn = ['#1b1408', '#e0d4a8', '#fff8dc', '#a89a68'], bd = ['#1b1408', '#a89a68', '#e0d4a8', '#6e6240'], rd = P.hunger, g = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0;
    const cx = 25, cy = 26.6, rx = 9 + g, ry = 7.6 + g * 0.6;
    R.ichor = '#6a121c'; R.shw = 15; R.glow = '#ff8a7a'; R.eyes = [['skull', 38.6, 13.6]];
    const bl = ['#1b1408', '#f4f0e0', '#ffffff', '#b8b09a'], bl2 = ['#1b1408', '#c8c0a4', '#f4f0e0', '#8a8266'];
    // 낫: 어깨에서 올라간 팔뼈 끝에 초승달 날. len = 날 길이 (음수면 위로 든 낫)
    const scy = (D, sx, sy, len, pal, back) => { const f = len < 0 ? -1 : 1, L = Math.abs(len), jx = sx + 4.6, jy = sy - 5.6 * f, b = back ? bl2 : bl; D.L([[sx, sy], [jx, jy]], 1.5, 1.1, pal); D.B(jx, jy, 1.5, 1.5, pal);
      D.G([[jx - 0.6, jy - 1 * f], [jx + 4.4, jy + 0.6 * f], [jx + 7.6, jy + L * 0.34 * f], [jx + 7.4, jy + L * 0.7 * f], [jx + 4.6, jy + L * f], [jx + 5, jy + L * 0.66 * f], [jx + 4, jy + L * 0.32 * f], [jx + 0.8, jy + 1.8 * f]], b);
      D.L([[jx + 2, jy + 1.6 * f], [jx + 4.6, jy + L * 0.36 * f], [jx + 5.2, jy + L * 0.7 * f]], 0.4, 0.4, ['#0000', '#c8303a', '#c8303a', '#c8303a'], null); D.px(jx + 4.6, jy + L * f, '#c8303a'); };
    // 꼬리뼈
    R.part('tail', { px: 15, py: 30, z: 0, role: 'sway', amp: 0.7, ph: 1 }, D => { const pts = [[16, 30], [11, 31.6], [6.6, 29], [4, 24.6 - g * 2], [5.4, 21 - g * 3]]; D.L(pts, 1.6, 0.6, bd); for (let k = 0; k < pts.length - 1; k++) { const x = (pts[k][0] + pts[k + 1][0]) / 2, y = (pts[k][1] + pts[k + 1][1]) / 2; D.G([[x - 1, y - 0.6], [x - 0.4, y - 3.6 - g], [x + 1.2, y - 0.4]], bn); } });
    for (const [k, x, ph, pal] of [[0, 15, Math.PI, bd], [1, 20, 0, bn]]) R.part('leg' + k, { px: x, py: 33, z: k ? 5 : 0, role: 'leg', ph, amp: 0.7 }, D => { D.L([[x, 32], [x - 3.4, 37], [x + 0.6, 41], [x + 0.2, 44.4]], 1.5, 0.9, pal); D.G([[x - 1.4, 45.4], [x + 0.4, 43.4], [x + 4.4, 45.4]], pal); D.px(x - 3.6, 36.6, pal[2]); });
    R.part('armB', { px: 30, py: 22, z: 1, role: 'arm', amp: 0.3, ph: 2, parent: 'cage', strike: 0.8 }, D => scy(D, 31, 22.6, 25.4 + g, bd, true));
    if (g) R.part('armX', { px: 22, py: 20, z: 1, role: 'sway', amp: 0.5, ph: 0.6, parent: 'cage' }, D => { scy(D, 17, 21, -10 - g3 * 2, bd, true); if (g3) scy(D, 11, 24, -9, bd, true); });
    // 가슴: 붉은 속, 이빨 고리, 그 위로 갈비뼈
    R.part('cage', { px: 22, py: 34, z: 2, role: 'body', amp: 0.7, morph: true, bite: true, flare: true }, (D, m) => {
      D.L([[13.6, 31.4], [20, 20.6], [31, 17.4]], 1.6, 1.4, bn);
      D.flat(D.el(cx, cy, rx - 0.6, ry - 0.4), MAWC, rd[0]); D.flat(D.el(cx + 0.6, cy + 0.4, rx * 0.62, ry * 0.62), GUM); D.flat(D.el(cx + 1, cy + 0.6, rx * (0.34 - m * 0.16), ry * (0.34 - m * 0.16)), VOID);
      ringTeeth(D, cx + 0.4, cy + 0.2, rx * (0.8 - m * 0.1), ry * (0.8 - m * 0.1), 10 + g * 2, 2.6 + m * 2.4, 0.3, bn); if (g3) ringTeeth(D, cx + 0.8, cy + 0.5, rx * 0.44, ry * 0.44, 7, 1.6 + m, 0.7, bd);
      for (let k = 0; k < 5 + g; k++) { const n = 4 + g, f = k / n, x0 = cx - rx + 1 + f * (rx * 2 - 1.4), sp = (f - 0.5) * m * 5, top = cy - ry * Math.sqrt(Math.max(0.05, 1 - Math.pow((x0 - cx) / rx, 2))) - 0.8; if (k % 2 === 0 || m < 0.6) D.L([[x0 + sp * 0.3, top], [x0 + 1 + sp, cy - 2], [x0 + 0.4 + sp * 1.3, cy + ry * 0.1 + (k % 2) * 2.4]], 0.7, 0.4, k % 2 ? bd : bn); }
      D.L([[cx - rx + 1, cy + ry - 1.6], [cx, cy + ry + 0.4], [cx + rx - 2, cy + ry - 2]], 0.9, 0.7, bd);
      for (let k = 0; k < 4; k++) { const f = k / 3, x = 15 + f * 13, y = 29 - f * 10.6; D.G([[x - 1.2, y], [x - 1.6 - g, y - 4 - g * 1.2 - (k % 2)], [x + 1.2, y - 0.8]], bn); }
      D.px(cx - 4, cy + ry - 0.4, '#c8303a'); D.px(cx - 4, cy + ry + 1, '#8a2038'); if (g3) { D.px(cx + 3, cy + ry + 0.2, '#c8303a'); D.px(cx + 3, cy + ry + 2, '#8a2038'); }
    });
    // 목과 머리뼈
    R.part('skull', { px: 31, py: 18, z: 4, role: 'head', amp: 1, parent: 'cage', jaw: -0.14 }, D => { D.L([[31, 18], [34, 15.6]], 1.4, 1.2, bd); D.G([[33, 15.6], [34, 11.4], [38.6, 10.4], [43.4, 12.6], [44.6, 14.6], [40, 16], [35, 16.6]], bn); D.flat(D.el(38.6, 13.6, 1.5, 1.4), VOID); D.px(38.8, 13.6, '#ff5040'); if (g3) { D.flat(D.el(35.6, 12.6, 0.9, 0.9), VOID); D.px(35.6, 12.6, '#ff5040'); } D.px(43, 13.6, VOID); D.fangs(40, 44, 15.6, 1, 1.6, 1.5); if (g) { D.G([[34.4, 11.6], [32, 7.6], [36.6, 10.6]], bn); if (g3) D.G([[37.6, 10.6], [37.4, 6], [40, 10.4]], bn); } });
    R.part('jawp', { px: 35, py: 16.4, z: 3, parent: 'skull', jaw: 0.55 }, D => { D.G([[34.6, 16], [42.6, 16.4], [41.6, 18.6], [36, 18.6]], bd); D.fangs(37.6, 41.6, 16, -1, 1.4, 1.5); });
    R.part('armF', { px: 28, py: 23, z: 6, role: 'arm', amp: 0.3, parent: 'cage', strike: 1.15, reach: 0.1 }, D => scy(D, 27.6, 24, 25.6 + g, bn));
    R.pose = (anim, f, G, T, fx, s) => {
      if (anim === 'idle') { G.dx = sin(f * TAU) * 1.6 * s.u; G.rot = 0.05 * sin(f * TAU); T.armF.rot = 0.12 * sin(f * TAU + 1); T.armB.rot = 0.12 * sin(f * TAU + 2.6); T.cage.m = 0.12 + 0.12 * sin(f * TAU * 2); }
      if (anim === 'cast') { const gone = seg(f, 0.04, 0.2) * (1 - seg(f, 0.3, 0.42)), cut = seg(f, 0.42, 0.56), back = 1 - ease(seg(f, 0.56, 1)); fx.fade = gone * 0.9; G.dy = 0; G.sy = 1; G.sx = 1; G.dx = 6 * s.u * cut * back; G.rot = 0.16 * cut * back; T.armF.rot = (-1 + 2.1 * cut) * (f < 0.42 ? ease(seg(f, 0.1, 0.42)) : back); T.armB.rot = (-1.2 + 2.6 * cut) * (f < 0.42 ? ease(seg(f, 0.1, 0.42)) : back); T.cage.m = cut * back; fx.glow = cut * back; }
    };
  } };
  // 설교하는 것: 두건 쓴 것 셋이 한 몸으로 붙어 섰다. 가운데 것이 책 대신 제 얼굴 가죽을 펴 들고 있다. 발치에 촛농
  DEF.preach = { build(R, st) {
    const p = P.dusk, lit = [p[0], '#6a4a62', '#a888a0', '#3a2440'], dkr = [p[0], '#32203a', '#5a3e5a', '#1c1024'], gl = p[4], sk = ['#241418', '#d8c8b8', '#f4ece0', '#9a8478'], g = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0;
    R.ichor = '#2a1830'; R.shw = 16; R.glow = gl; R.eyes = [['h1', 15.6, 18.6], ['h2', 34.6, 18.2]];
    // 촛농과 초
    R.part('wax', { px: 24, py: 45, z: 0 }, D => { D.flat(D.el(24, 44.6, 17 + g, 1.6), '#b8a888', '#3a2e22'); D.flat(D.el(18, 44.2, 5, 0.7), '#e8dcc0'); for (const [x, h] of [[8.6, 4], [39.6, 5.6]].concat(g ? [[12.6, 2.6]] : [], g3 ? [[36, 3], [5, 2.4]] : [])) { D.rect(x - 0.8, 44.6 - h, 2, h, '#e8dcc0'); D.rect(x + 0.6, 44.6 - h, 0.7, h, '#b8a888'); D.px(x - 1, 45 - h * 0.4, '#e8dcc0'); } });
    [[8.6, 4], [39.6, 5.6]].concat(g ? [[12.6, 2.6]] : [], g3 ? [[36, 3], [5, 2.4]] : []).forEach(([x, h], k) => R.part('fl' + k, { px: x, py: 44.6 - h, z: 1, role: 'pulse', amp: 2.4, ph: k * 1.7, sp: 2 }, D => { D.flat(D.el(x, 43 - h, 1, 1.7), gl, '#5a2a0a'); D.px(x, 43.4 - h, '#fff3c0'); }));
    R.part('robe', { px: 24, py: 45, z: 2, role: 'body', amp: 0.5 }, D => {
      D.G([[11, 26], [16, 22], [32, 22], [37.6, 26], [41, 43.4], [36, 42], [31, 43.6], [24, 42.2], [17, 43.6], [12, 42], [7, 43.4]], lit);
      for (const [a, b] of [[[15, 27], [12.6, 41]], [[20, 30], [19.6, 42]], [[29, 30], [29.6, 42]], [[34, 27], [36.4, 41]], [[24.6, 34], [24.4, 41.6]]]) D.L([a, b], 0.5, 0.5, ['#0000', p[3], p[3], p[3]], null);
      // 세 몸이 붙은 이음매: 꿰맨 자국
      for (const x0 of [19, 30.4]) for (let k = 0; k < 4; k++) { D.px(x0 + (k % 2 ? 0.6 : -0.4), 25 + k * 2.2, '#0c0812'); D.px(x0 + (k % 2 ? -0.6 : 0.8), 25.6 + k * 2.2, sk[3]); }
      for (let k = 0; k < 5; k++) D.spark(12 + k * 6, 38.6 + (k % 2) * 1.6, k % 2 ? '#8a5a40' : gl, k === 2);
    });
    const hood = (name, x, y, r, ph, kind, z, pal) => R.part(name, { px: x, py: y + r * 1.5, z, role: 'head', amp: 1.7, ph, parent: 'robe', sp: 1 }, D => {
      D.L([[x, y + r * 1.9], [x, y + r * 0.8]], r * 0.8, r * 0.7, dkr);
      D.G([[x - r, y + r * 1.2], [x - r * 1.06, y - r * 0.2], [x - r * 0.5, y - r * 1.1], [x + r * 0.2, y - r * 1.6], [x + r * 0.7, y - r * 0.9], [x + r * 1.06, y], [x + r, y + r * 1.2], [x, y + r * 1.5]], pal);
      D.flat(D.el(x + r * 0.1, y + r * 0.24, r * 0.66, r * 0.86), VOID, pal[0]);
      if (kind === 0) { D.L([[x - r * 0.3, y - r * 0.2], [x + r * 0.5, y + r * 0.8]], 0.4, 0.4, ['#0000', '#5a1420', '#5a1420', '#5a1420'], null); D.px(x + r * 0.34, y, '#8a2038'); D.px(x - r * 0.1, y + r * 0.6, '#8a2038'); }
      else if (kind === 1) { D.rect(x + r * 0.1, y - r * 0.3, 0.9, r * 1.1, gl); D.px(x + r * 0.1, y + r * 0.2, '#fff3c0'); }
      else { for (let k = 0; k < 3; k++) { D.px(x - r * 0.3 + k * r * 0.34, y + r * 0.5, '#e4dfd0'); D.px(x - r * 0.3 + k * r * 0.34, y + r * 0.5 + 1, '#0c0812'); } D.px(x - r * 0.16, y - r * 0.1, gl); D.px(x + r * 0.4, y - r * 0.1, gl); }
      D.px(x - r * 0.5, y - r * 0.7, pal[2]); D.px(x - r * 0.3, y - r * 0.96, pal[2]);
    });
    hood('h1', 15, 18, 4.6 + g * 0.3, 2.1, 1, 3, p); hood('h2', 34, 17.6, 4.8 + g * 0.3, 4.2, 2, 3, p); hood('h0', 24.6, 12 - g, 5.8 + g * 0.4, 0, 0, 5, lit);
    if (g3) { hood('h3', 8.6, 25, 3.2, 1, 1, 2, dkr); hood('h4', 40.6, 24.6, 3.2, 3.2, 2, 2, dkr); }
    // 가운데 것의 두 팔과 펴 든 얼굴 가죽
    R.part('skin', { px: 24.6, py: 30, z: 7, role: 'float', amp: 0.6, parent: 'robe', lift: 13, morph: true, flare: true }, (D, m) => {
      const w = 6.6 + g * 0.6 + m * 1.6, y0 = 25.6, h = 9 + g;
      D.shade(D.poly([[24.6 - w, y0 + 0.6], [24.6 - w * 0.4, y0 - 0.6], [24.6 + w * 0.4, y0 - 0.4], [24.6 + w, y0 + 0.8], [24.6 + w * 0.86, y0 + h * 0.7], [24.6 + w * 0.3, y0 + h], [24.6 - w * 0.34, y0 + h], [24.6 - w * 0.9, y0 + h * 0.66]]), (x, y) => { const dx = (x - 24.6) / w; return Math.abs(dx) < 0.06 ? sk[3] : dx < -0.5 ? sk[2] : dx > 0.6 ? sk[3] : sk[1]; }, sk[0]);
      for (const dx of [-0.46, 0.46]) { D.flat(D.el(24.6 + w * dx, y0 + h * 0.34, w * 0.2, h * 0.13 + m * 0.6), m > 0.5 ? gl : VOID, sk[0]); if (m > 0.5) D.px(24.6 + w * dx, y0 + h * 0.34, '#fff3c0'); }
      D.flat(D.el(24.6, y0 + h * 0.72, w * 0.34, h * 0.09 + m * 1.2), m > 0.5 ? '#5a1420' : VOID, sk[0]); D.px(24.6 - w * 0.2, y0 + h * 0.72, sk[2]); D.px(24.6 + w * 0.2, y0 + h * 0.72, sk[2]);
      D.L([[24.6 - w * 0.7, y0 + 1], [24.6 - w * 0.3, y0 + 0.2]], 0.4, 0.4, ['#0000', '#ffffff', '#ffffff', '#ffffff'], null);
      for (let k = 0; k < 3; k++) D.px(24.6 - w * 0.8 + k * 0.6, y0 + h * 0.8 + k * 0.5, '#8a2038');
      if (g) { D.flat(D.el(24.6, y0 + h * 0.5, 0.6, 1), VOID); } if (g3) { for (const dx of [-0.76, 0.76]) { D.px(24.6 + w * dx, y0 + h * 0.56, VOID); D.px(24.6 + w * dx, y0 + h * 0.56 + 1, VOID); } }
      // 가죽을 쥔 손
      for (const dir of [-1, 1]) { D.B(24.6 + dir * (w + 0.6), y0 + 2, 1.5, 1.6, P.flesh); D.px(24.6 + dir * (w - 0.6), y0 + 1.4, P.flesh[2]); D.px(24.6 + dir * (w - 0.6), y0 + 3, P.flesh[2]); }
    });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('arm' + k, { px: 24.6 + dir * 5, py: 23, z: 6, role: 'arm', amp: 0.2, ph: k * 2, parent: 'robe', lift: 9, cast: dir * 0.5 }, D => D.L([[24.6 + dir * 4.6, 22.6], [24.6 + dir * 9.6, 25.6], [24.6 + dir * 8, 27.6]], 2.4, 1.8, lit));
    R.pose = (anim, f, G, T, fx, s) => { if (anim === 'cast') { G.dy = 0; G.sy = 1 + 0.03 * s.rise; for (const n of ['h1', 'h2', 'h0']) T[n].rot = -0.22 * s.rise * (n === 'h1' ? -1 : n === 'h2' ? 1 : 0); T.h0.dy -= 2 * s.u * s.rise; } if (anim === 'attack') { T.skin.m = Math.max(0, s.L); T.skin.dy = -3 * s.u * Math.max(0, -s.L); } };
  } };
  // 하늘의 틈: 허공에 세로로 난 틈. 가장자리에 눈꺼풀 같은 살, 틈 안에는 별이 박힌 어둠. 가는 촉수 몇 가닥이 늘어져 땅에 닿지 않는다
  DEF.rift = { build(R, st) {
    const p = P.nebula, lidP = ['#120a26', '#9a86d8', '#e8dcff', '#5a4698'], g = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0, CX = 24, CY = 20 - g, HH = 15 + g * 1.5 + g3;
    R.ichor = '#3a2580'; R.shw = 7; R.glow = '#cdbcff'; R.eyes = [['slit', CX, CY]];
    // 볼록 렌즈 꼴: 세로 반높이 hh, 가운데 반너비 w
    const lens = (D, cx, cy, w, hh) => D.cut(D.el(cx, cy, w + 0.5, hh), (x, y) => { const f = (y - cy) / hh; return Math.abs(x - cx) <= w * (1 - f * f) * (1 - 0.25 * f * f) + 0.2; });
    // 허공의 금: 틈의 위아래 끝에서 뻗는다
    R.part('crack', { px: CX, py: CY, z: 0 }, D => { const c = '#3a2580', c2 = '#8a6ad8'; for (const [pts] of [[[[CX, CY - HH], [CX - 1.6, CY - HH - 3], [CX + 0.6, CY - HH - 5.6 - g3 * 2]]], [[[CX - 1.6, CY - HH - 3], [CX - 4, CY - HH - 4]]], [[[CX, CY + HH], [CX + 1.4, CY + HH + 2.6], [CX - 0.4, CY + HH + 4.6]]]].concat(g ? [[[[CX + 0.6, CY - HH - 5], [CX + 3.4, CY - HH - 6.6]]]] : [])) { D.L(pts, 0.5, 0.4, ['#0000', c, c, c], null); D.px(pts[pts.length - 1][0], pts[pts.length - 1][1], c2); } });
    // 늘어진 촉수
    [[-3, 0, 9], [0.4, 1.9, 12.6], [3.4, 3.7, 8]].concat(g ? [[-1.4, 5, 6.6]] : [], g3 ? [[2, 2.8, 10.6], [-4.6, 4.4, 5.6]] : []).forEach(([dx, ph, len], k) => R.part('tend' + k, { px: CX + dx * 0.5, py: CY + HH - 3, z: 1, role: 'sway', amp: 0.9, ph }, D => { const y0 = CY + HH - 3 - Math.abs(dx) * 0.8, y1 = Math.min(42.6, y0 + len); tent(D, [[CX + dx * 0.5, y0], [CX + dx, lerp(y0, y1, 0.5)], [CX + dx * 1.3 + (k % 2 ? 1 : -1), y1]], 1.2, 0.5, [p[0], p[3], p[1], deepOf(p)], null); D.px(CX + dx * 1.3 + (k % 2 ? 1 : -1), y1 + 0.6, '#fff3a0'); }));
    R.part('slit', { px: CX, py: CY, z: 3, morph: true, flare: true, bite: true }, (D, m) => {
      const w = 3.6 + g * 0.6 + m * 7.4, hh = HH;
      // 눈꺼풀 같은 살
      D.shade(lens(D, CX, CY, w + 2.4, hh + 1.4), (x, y) => { const dx = x - CX; return dx < -w * 0.4 - 0.6 ? lidP[2] : dx < w * 0.5 ? lidP[1] : lidP[3]; }, lidP[0]);
      // 속눈썹처럼 난 살 돌기
      for (let k = 0; k < 9 + g * 2; k++) { const f = (k + 0.5) / (9 + g * 2) * 1.7 - 0.85, y = CY + f * hh, ww = (w + 2.4) * (1 - f * f) * (1 - 0.25 * f * f), side = k % 2 ? 1 : -1; D.L([[CX + side * ww, y], [CX + side * (ww + 1.8 + (k % 3) * 0.5), y + (f < 0 ? -1.2 : 1.2)]], 0.6, 0.4, [lidP[0], lidP[1], lidP[2], lidP[3]]); }
      // 틈 안: 별이 박힌 어둠
      D.shade(lens(D, CX, CY, w, hh - 1), (x, y, X, Y) => { const n = hsh(X, Y), d = Math.hypot((x - CX) / Math.max(1, w), (y - CY) / hh); if (n > 0.965) return '#ffffff'; if (n > 0.93) return '#cdbcff'; return d < 0.45 ? '#1a1040' : d < 0.8 ? '#0e0828' : VOID; }, '#120a26');
      // 벌어지면 안에서 큰 눈이 내려다본다
      const er = Math.min(w - 0.6, 5.6 + g3) * (m > 0.45 || g3 ? 1 : 0); if (er > 1.6) { const ey = CY + 1; D.flat(D.el(CX, ey, er, er * 0.82), '#e4dcf2', '#120a26'); D.flat(D.el(CX, ey + 0.6, er * 0.62, er * 0.62), '#f0a04a', '#3a2580'); D.flat(D.el(CX, ey + 0.8, Math.max(0.6, er * 0.16), er * 0.5), VOID); D.px(CX - er * 0.4, ey - er * 0.36, '#ffffff'); if (g3 && m > 0.5) for (const dy of [-7.6, 8.6]) { D.flat(D.el(CX, CY + dy, 1.8, 1.5), '#e4dcf2', '#120a26'); D.px(CX, CY + dy + 0.3, '#3a2580'); } }
      else if (g) { D.px(CX, CY, '#f0a04a'); D.px(CX, CY + 1, '#fff3a0'); }
      D.px(CX - w - 1, CY - hh * 0.4, '#ffffff'); D.px(CX - w - 1, CY - hh * 0.4 + 1, '#ffffff');
    });
    if (g) R.part('slit2', { px: 37, py: 17, z: 2, role: 'float', amp: 0.8, ph: 2, morph: true, flare: true }, (D, m) => { const w = 1.3 + m * 1.6, hh = 5.6; D.shade(lens(D, 37, 17, w + 1.4, hh + 1), (x) => (x < 37 ? lidP[2] : lidP[3]), lidP[0]); D.flat(lens(D, 37, 17, w, hh - 0.8), VOID); D.px(37, 16, '#ffffff'); D.px(37, 19, '#cdbcff'); });
    if (g3) R.part('slit3', { px: 10.6, py: 26, z: 2, role: 'float', amp: 0.8, ph: 4, morph: true, flare: true }, (D, m) => { const w = 1.1 + m * 1.4, hh = 4.6; D.shade(lens(D, 10.6, 26, w + 1.4, hh + 1), (x) => (x < 10.6 ? lidP[2] : lidP[3]), lidP[0]); D.flat(lens(D, 10.6, 26, w, hh - 0.8), VOID); D.px(10.6, 25, '#ffffff'); });
    for (let k = 0; k < 3 + g; k++) R.part('star' + k, { px: CX, py: CY, z: 6, role: 'orbit', ph: k * 1.7, amp: 3.6 + (k % 2) }, D => D.spark(CX + (k % 2 ? 9 : -8) + k, CY - 9 + k * 6, '#fff3a0', k % 2 === 0));
    R.pose = (anim, f, G, T, fx, s) => {
      const t = T.slit; if (anim === 'idle') { t.m = 0.1 + 0.1 * sin(f * TAU); G.dy = sin(f * TAU) * 1 * s.u; }
      if (anim === 'move') t.m = 0.1; if (anim === 'attack') { t.m = 0.25 + 0.5 * s.chg; fx.glow = Math.max(fx.glow, 0.6 * s.chg); }
      if (anim === 'cast') { t.m = s.rise; t.sx = 1 + 0.55 * s.rise; G.sx = 1; G.sy = 1; G.dy = -1.4 * s.u * s.rise; }
      if (anim === 'hit') t.m = 0.3 * s.hr; if (anim === 'die') { t.sx = 1 - 0.8 * s.ds; G.sy = 1; G.sx = 1; } if (anim === 'mad') t.m = 0.5 + 0.3 * sin(f * TAU * 2);
    };
  } };
  SHOOT.rift = 1;
  // 반투명한 알 하나: 속에 웅크린 것이 비친다
  const egg2 = (D, x, y, rx, ry, wake) => { D.shade(D.el(x, y, rx, ry), (xx, yy) => { const dx = (xx - x) / rx, dy = (yy - y) / ry; return -dx * 0.6 - dy * 0.7 > 0.4 ? '#fffbd0' : dx * 0.6 + dy * 0.7 > 0.5 ? '#b8a850' : '#f0e088'; }, '#3a3010'); D.flat(D.el(x + rx * 0.16, y + ry * 0.2, rx * 0.46, ry * 0.44), '#6a6428'); D.px(x + rx * 0.3, y + ry * 0.1, wake ? '#ff5040' : '#2a2a12'); D.px(x - rx * 0.46, y - ry * 0.5, '#ffffff'); };
  // 굴의 여왕: 바닥에 뿌리내린 거대한 알집. 위쪽에 작은 상반신이 왕관처럼 얹혀 있다. 알집 옆구리에 반쯤 나온 권속의 형체들
  DEF.queen = { build(R, st) {
    const p = P.brood, dk = dkp(p), fl = ['#1a1814', '#c8c0a8', '#f0ead8', '#8a8068'], fd = dkp(fl), sacP = ['#141c0c', '#7a9a50', '#c8e090', '#3e5a2c'], g = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0, bn = P.bone;
    const rx = 15.6 + g, ry = 12 + g, cy = 34 - g * 0.5, top = cy - ry;
    R.ichor = '#2c5c24'; R.shw = 18; R.glow = '#e8ff7a'; R.eyes = [['head', 26.4, top - 9.6 - g3]];
    [[10, -1, 0], [16, -0.6, 1.7], [33, 0.6, 3], [38.6, 1, 4.4]].forEach(([x, dir, ph], k) => R.part('root' + k, { px: x, py: 43.6, z: 0, role: 'sway', amp: 0.25, ph }, D => tent(D, [[x, 43], [x + dir * 4, 44.4], [x + dir * 8, 43], [x + dir * 10.6, 45]], 1.8, 0.5, dk, null)));
    // 옆구리에서 반쯤 나온 것들
    R.part('emL', { px: 10, py: 34, z: 1, role: 'sway', amp: 0.7, ph: 1, parent: 'sac' }, D => { D.L([[11, 34], [6, 32], [3.6, 35.6]], 1.6, 0.9, dk); for (const k of [-1, 0, 1]) D.L([[3.6, 35.6], [2.6 + k * 1.3, 38]], 0.6, 0.4, bn); if (g) { D.L([[10.6, 28], [6, 24.6], [5, 20.6]], 1.4, 0.7, dk); D.px(5, 19.8, bn[1]); D.px(4, 21, bn[1]); } });
    R.part('emR', { px: 38, py: 36, z: 1, role: 'sway', amp: 0.5, ph: 3, parent: 'sac', jaw: 0.2 }, D => { D.B(40.6, 36.6, 3.6, 3, [p[0], '#6a9a48', '#c8e890', '#34582c']); D.flat(D.poly([[40, 37.6], [44.6, 38], [44, 39.2], [40, 38.8]]), MAWC, null); D.fangs(41, 44, 37.8, 1, 1.3, 1.5); D.flat(D.el(41.6, 35.4, 0.9, 0.9), INK); D.px(41.6, 35.2, '#f0e060'); if (g3) { D.B(41, 28, 2.6, 2.2, [p[0], '#6a9a48', '#c8e890', '#34582c']); D.px(42, 27.6, '#f0e060'); D.fangs(41.6, 43.6, 29.4, 1, 1, 1.4); } });
    // 알집
    R.part('sac', { px: 24, py: 45, z: 2, role: 'body', amp: 1, morph: true, flare: true }, (D, m) => {
      D.shade(D.cut(D.el(24, cy, rx, ry), (x, y) => y < 44.8), (x, y) => { const dx = (x - 24) / rx, dy = (y - cy) / ry, v = -dx * 0.5 - dy * 0.72 + (1 - Math.hypot(dx, dy)) * 0.3; return v > 0.66 ? sacP[2] : v > 0.16 ? sacP[1] : v > -0.3 ? sacP[3] : deepOf(sacP); }, sacP[0]);
      // 막의 마디와 핏줄
      for (let k = 0; k < 5; k++) { const x = 12 + k * 6; D.L([[x, top + 2 + Math.abs(k - 2) * 2.6], [x + (k - 2) * 0.8, cy + 2], [x + (k - 2) * 0.4, 44]], 0.5, 0.5, ['#0000', sacP[3], sacP[3], sacP[3]], null); }
      for (const [a, b, c] of [[[14, 30], [17.6, 33], [16, 37]], [[32, 29], [30, 33.6], [33.6, 38]]]) D.L([a, b, c], 0.4, 0.4, ['#0000', '#a8405a', '#a8405a', '#a8405a'], null);
      // 비치는 알들
      for (const [x, y, r, w] of [[17, 36.6, 3, 0], [30.6, 37.6, 3.4, 1], [12.6, 31, 2.2, 0], [35, 31, 2.4, 0], [20.6, 28.6, 2.2, 1]].concat(g ? [[27.6, 29, 2, 0], [11, 38.6, 2, 0]] : [], g3 ? [[36.6, 39.6, 2.2, 1], [15, 25.6, 1.8, 0]] : [])) egg2(D, x, y, r, r * 1.2, w);
      // 가운데 솔기: 시전하면 갈라진다
      const w = 0.5 + m * 4.4; if (m > 0.12) { D.flat(D.el(24.4, cy + 2.6, w + 1, 8.6), '#f0e088', sacP[0]); D.flat(D.el(24.4, cy + 2.6, w, 7.8), '#fffbd0'); D.flat(D.el(24.6, cy + 3.6, w * 0.6, 5), '#5a7030'); for (let k = 0; k < 4; k++) { D.px(24.4 - w - 0.6, cy - 3 + k * 3.6, sacP[2]); D.px(24.4 + w + 0.8, cy - 2 + k * 3.6, sacP[2]); } }
      else for (let k = 0; k < 7; k++) { D.px(24.2 + (k % 2 ? 0.6 : -0.2), cy - 5 + k * 2.4, sacP[0]); D.px(24.2 + (k % 2 ? -0.6 : 1), cy - 4.4 + k * 2.4, '#a8405a'); }
      D.px(15, top + 5, '#f0ffd0'); D.px(16, top + 4.4, '#f0ffd0'); D.px(14, top + 6.4, '#f0ffd0');
      if (g) for (const [x, y] of [[19, top + 4], [31, top + 5.6]].concat(g3 ? [[25, cy + 8]] : [])) D.eye(x, y, 1.2, '#f0d040', false);
    });
    // 상반신: 알집 꼭대기에서 솟는다
    R.part('torso', { px: 24.6, py: top + 2, z: 4, role: 'head', amp: 0.7, parent: 'sac' }, D => { D.L([[24.6, top + 2.6], [25, top - 3], [25.6, top - 6]], 2.6, 1.8, fl); for (let k = 0; k < 3; k++) D.L([[23, top - 0.6 - k * 1.8], [26.6, top - 1 - k * 1.8]], 0.4, 0.4, ['#0000', fl[3], fl[3], fl[3]], null); D.flat(D.el(24.6, top + 2.6, 4.4, 1.6), sacP[3], sacP[0]); D.px(24, top - 4, fl[2]); });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('arm' + k, { px: 25 + dir * 2, py: top - 4.6, z: k ? 6 : 3, role: 'arm', amp: 0.25, ph: k * 2.4, parent: 'torso', cast: dir * 1.1, strike: k ? 0.6 : 0 }, D => { D.L([[25 + dir * 2, top - 4.6], [25 + dir * 7, top - 1.6], [25 + dir * 9.6, top + 3]], 1.1, 0.7, k ? fl : fd); for (const j of [-1, 0, 1]) D.L([[25 + dir * 9.6, top + 3], [25 + dir * (10.4 + j * 0.3), top + 5 + Math.abs(j) * -0.6 + j * 0.6]], 0.45, 0.35, k ? fl : fd); if (g3) { D.L([[25 + dir * 1.6, top - 2], [25 + dir * 5.6, top - 5.6], [25 + dir * 8.6, top - 9]], 0.9, 0.6, fd); D.px(25 + dir * 9, top - 9.8, bn[1]); } });
    R.part('head', { px: 25.6, py: top - 6, z: 7, role: 'head', amp: 0.9, ph: 1, parent: 'torso', sp: 1 }, D => {
      const hy = top - 9.6 - g3; D.B(25.6, hy, 3.2, 3.8 + g3 * 0.4, fl); D.G([[23, hy - 1], [21.6, hy - 7 - g], [24.4, hy - 3]], bn); D.G([[25, hy - 3], [25.6, hy - 8.6 - g * 1.6], [27, hy - 3]], bn); D.G([[27.4, hy - 2.6], [30, hy - 6.6 - g], [28.6, hy - 1]], bn); if (g3) { D.G([[22.6, hy + 0.6], [19, hy - 3], [23, hy - 1.6]], bn); D.G([[28.6, hy], [32.6, hy - 2.6], [28.6, hy + 1.6]], bn); }
      D.flat(D.el(26.4, hy, 1.1, 1.4), INK); D.px(26.4, hy, '#f0e060'); D.px(24.2, hy - 0.4, '#f0e060'); D.px(27.8, hy + 1.4, '#f0e060'); if (g) D.px(25.2, hy + 1.8, '#f0e060');
      D.rect(25.4, hy + 2.6, 2.2, 0.8, MAWC); D.px(24.4, hy - 2, '#ffffff');
    });
    R.pose = (anim, f, G, T, fx, s) => {
      if (anim === 'idle') { T.sac.sx *= 1 + 0.03 * sin(f * TAU * 2 + 1); T.torso.rot = 0.14 * sin(f * TAU); T.head.rot = 0.22 * sin(f * TAU - 0.6); }
      if (anim === 'cast') { G.dy = 0; G.sy = 1; G.sx = 1; T.sac.m = s.rise; T.sac.sx *= 1 + 0.08 * s.rise; T.torso.dy -= 1.6 * s.u * s.rise; T.head.rot = -0.2 * s.rise; }
    };
  } };
  // 새끼: 알에서 갓 나온 것. 껍데기를 쓴 채 꼬리로 긴다. 턱만 먼저 굳었다
  DEF.spawn = { size: () => 48, build(R) {
    const p = ['#2a2a10', '#d8d890', '#fbfbd0', '#9a9a58'], dk = dkp(p), sh = ['#3a3010', '#f0e088', '#fffbd0', '#b8a850'];
    R.ichor = '#2c5c24'; R.shw = 6; R.eyes = [['body', 27.6, 38]];
    R.part('tail', { px: 20, py: 41, z: 0, role: 'sway', amp: 1.6, sp: 2 }, D => { D.L([[21, 41], [16, 43.4], [12.6, 42], [11, 39.6]], 2, 0.5, dk); D.px(13.6, 42.4, '#5a7030'); D.px(16.6, 43.2, '#5a7030'); });
    R.part('jaw', { px: 25, py: 41.6, z: 1, parent: 'body', jaw: 0.7, role: 'sway', amp: 0.4, sp: 2 }, D => { D.G([[24.6, 41], [32.6, 41.4], [31.6, 44], [26, 44.2]], ['#1b1d2a', '#a8a294', '#e4dfd0', '#6e6a5e']); D.fangs(26.6, 32, 41.6, -1, 2, 1.8); });
    R.part('body', { px: 24, py: 45, z: 2, role: 'body', amp: 1.6, sp: 2 }, D => { D.B(24.6, 39, 5, 3.6, p); D.flat(D.el(23.6, 39.6, 2.2, 1.6), '#7a8a40'); D.px(23, 39.4, '#3a4a1c'); D.flat(D.poly([[25, 40.6], [32, 41], [31.6, 42], [25, 41.6]]), MAWC, null); D.fangs(26.6, 32, 41, 1, 1.4, 1.8); D.flat(D.el(27.6, 38, 1.1, 1.1), INK); D.px(27.6, 37.8, '#ff5040'); });
    R.part('cap', { px: 22, py: 37, z: 3, role: 'sway', amp: 0.5, sp: 2, parent: 'body' }, D => { D.G([[18.6, 38.6], [19, 34.6], [21.6, 32.6], [24.6, 33], [26.6, 35.6], [25, 36.6], [23.6, 35.4], [22, 37], [20.6, 36], [19.6, 38.6]], sh); D.px(20.6, 34, '#ffffff'); D.px(24.4, 34.6, '#3a3010'); });
  } };
  // 큰 새끼: 새끼의 두 배. 껍데기가 등딱지로 굳었고 턱이 넷
  DEF.brute = { size: () => 48, build(R) {
    const p = ['#1c2410', '#a8b868', '#e0eca0', '#5e7038'], dk = dkp(p), sh = ['#3a3010', '#e0cc70', '#fff8c0', '#a08a3c'], bn = ['#1b1d2a', '#c8c2b0', '#f4efe0', '#807a6c'];
    R.ichor = '#2c5c24'; R.shw = 13; R.eyes = [['head', 32.6, 32]];
    R.part('tail', { px: 14, py: 38, z: 0, role: 'sway', amp: 0.9, sp: 1 }, D => { D.L([[15, 38], [9, 40.6], [5, 38], [4, 33.6]], 3, 0.7, dk); D.G([[3, 34], [2.6, 30], [5.6, 33]], bn); });
    for (const [k, x, ph, pal] of [[0, 15, Math.PI, dk], [1, 25, 0.5, dk], [2, 19, 0, p], [3, 28, 2.4, p]]) R.part('leg' + k, { px: x, py: 39, z: k < 2 ? 1 : 5, role: 'leg', ph, amp: 0.8 }, D => { D.L([[x, 38], [x + 2.4, 41], [x + 0.6, 44.4]], 1.7, 1.1, pal); D.G([[x - 1, 45.4], [x + 0.6, 43.2], [x + 4.6, 45.4]], pal); });
    R.part('body', { px: 21, py: 42, z: 2, role: 'body', amp: 0.9 }, D => { D.B(21, 34.6, 10.6, 7, p); D.flat(D.el(20, 37.6, 5, 2.6), '#7a8a40'); for (const [x, y] of [[18, 37.4], [22.6, 38.2]]) D.px(x, y, '#3a4a1c'); for (let k = 0; k < 4; k++) D.px(13 + k * 4.6, 40.4, p[3]); });
    R.part('plate', { px: 20, py: 33, z: 3, role: 'pulse', amp: 0.2, parent: 'body' }, D => { D.shade(D.cut(D.el(20, 32.6, 10.6, 7.6), (x, y) => y < 33 + (x - 20) * 0.08), (x, y) => { const v = -(x - 20) * 0.05 - (y - 32) * 0.12; return v > 0.52 ? sh[2] : v > 0.1 ? sh[1] : sh[3]; }, sh[0]); for (let k = 0; k < 3; k++) D.L([[13.6 + k * 5, 27.6 + Math.abs(k - 1) * 1.6], [14.6 + k * 5, 33]], 0.5, 0.5, ['#0000', sh[3], sh[3], sh[3]], null); for (let k = 0; k < 4; k++) { const x = 12.6 + k * 4.6, y = 27.6 - (k === 1 || k === 2 ? 2.2 : 0); D.G([[x - 1.4, y + 1.6], [x - 0.6, y - 3], [x + 1.6, y + 1]], bn); } D.px(14, 28.6, '#ffffff'); D.px(15, 28, '#ffffff'); });
    R.part('head', { px: 29, py: 34, z: 6, role: 'head', amp: 0.8, parent: 'body', strike: 0.2 }, D => { D.B(32, 33.6, 5, 4.4, p); D.flat(D.el(36, 35, 2.6, 2.6), MAWC, p[0]); D.flat(D.el(36.6, 35, 1.2, 1.4), VOID); D.eye(32.6, 32, 1.5, '#ff5040', false); D.px(30, 30.6, '#ff5040'); D.px(34.6, 30.4, '#ff5040'); D.px(29.6, 31.6, p[2]); });
    [[0, -1, -1], [1, -1, 1], [2, 1, -1], [3, 1, 1]].forEach(([k, v, hgt]) => R.part('mand' + k, { px: 35, py: 35 + v * 1.6, z: 7 + (hgt > 0 ? 1 : 0), parent: 'head', jaw: v * (hgt > 0 ? 0.55 : 0.35), role: 'sway', amp: 0.2, ph: k * 1.6 }, D => { const y = 35 + v * (hgt > 0 ? 2.4 : 1.2), len = hgt > 0 ? 8 : 5.6; D.G([[34.6, y - 1], [34.6 + len * 0.6, y + v * 2.6], [34.6 + len, y + v * 0.4], [34.6 + len * 0.7, y - v * 0.4], [35, y + 1]], hgt > 0 ? bn : dkp(bn)); D.px(34.6 + len, y + v * 0.4, '#ffffff'); }));
  } };
  // 깨물이 (다시 그림): 쐐기꼴 머리가 곧 몸이다. 아래턱이 앞으로 나와 엄니가 윗입술을 넘는다. 눈은 작고 깊다
  DEF.biter = { build(R, st) {
    const p = ['#081208', '#3c6a30', '#8ab85c', '#1e4222', '#f0e060'], dk = [p[0], p[3], p[1], '#122a14'], fl = P.flesh, bn = P.bone, big = st >= 2 ? 1 : 0, g3 = st >= 3 ? 1 : 0, tg = ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038'];
    R.ichor = '#2c5c24'; R.shw = 13; R.eyes = [['body', 31.6, 22.4]];
    R.part('hand', { px: 14, py: 28, z: 0, role: 'sway', amp: 1, ph: 2, parent: 'body' }, D => { D.L([[14.6, 27], [10, 30.6], [9.4, 35]], 1.2, 0.8, fl); for (const k of [-1, 0, 1]) D.L([[9.4, 35], [8.6 + k * 1.3, 37.8]], 0.5, 0.4, bn); });
    R.part('legB', { px: 18, py: 38, z: 1, role: 'leg', ph: Math.PI }, D => { D.L([[18.6, 36.6], [15.6, 40.6], [17.6, 44]], 2.4, 1.5, dk); D.G([[14.6, 45.2], [17, 42.6], [21.6, 45.2]], dk); D.px(20.6, 44.6, bn[1]); });
    R.part('gullet', { px: 27, py: 33, z: 2, parent: 'body' }, D => { D.flat(D.el(28, 33.6, 12, 5.4), MAWC, p[0]); D.flat(D.el(25, 34, 7, 3.2), VOID); D.L([[20, 34.6], [27, 36.6], [33, 35.6]], 1.6, 1.1, tg); D.px(25, 35.6, '#ffd0d8'); });
    R.part('jaw', { px: 14.6, py: 33, z: 3, role: 'sway', amp: 0.2, parent: 'body', jaw: 0.5 }, D => {
      D.G([[13.6, 33], [20, 35.6], [38, 36], [43.6, 34.6], [44, 37.6], [40, 41.6], [30, 43.4], [20, 42.6], [14.6, 39.6]], dk); D.flat(D.poly([[17, 34.6], [41.6, 35.6], [41, 37], [18, 36.6]]), GUM, null);
      for (const [x, h] of [[20.6, 3.6], [24, 6.4], [27.4, 3.4], [30.6, 5.6], [33.6, 3.6]].concat(big ? [[18.4, 2.6], [36, 3]] : [])) D.G([[x - 1.3, 36.6], [x + 0.3, 36.6 - h], [x + 1.4, 36.8]], bn);
      // 엄니: 윗입술을 넘어 솟는다
      for (const [x, y] of [[22, 40.6], [29, 41.6], [35, 40]]) { D.px(x, y, p[1]); D.px(x + 1, y + 0.6, '#122a14'); }
      if (g3) { D.L([[33, 36.6], [38, 40], [40, 44.6]], 1.2, 0.7, tg); D.px(40, 45.4, '#ffd0d8'); }
    });
    R.part('legF', { px: 28, py: 39, z: 4, role: 'leg' }, D => { D.L([[28, 38.6], [31, 41.6], [29.6, 44]], 2.5, 1.7, p); D.G([[27, 45.2], [29.6, 42.6], [34.6, 45.2]], p); D.px(33.6, 44.6, bn[1]); D.px(31.6, 44.6, bn[1]); D.px(29.6, 44.6, bn[1]); });
    R.part('body', { px: 24, py: 41, z: 5, role: 'body' }, D => {
      D.shade(D.cut(D.poly([[11.6, 33], [11, 25], [13.6, 18.6 - big], [19.6, 14.6 - big], [27, 15.4 - big], [33.6, 19], [39, 24.6], [42.6, 30], [42, 34]]), (x, y) => y < 32.4 + (x - 14) * 0.06), (x, y) => { const v = -(x - 26) * 0.036 - (y - 25) * 0.07 + (hsh(Math.round(x * 1.5), Math.round(y * 1.5)) - 0.5) * 0.1; return v > 0.42 ? p[2] : v > 0.08 ? p[1] : v > -0.26 ? p[3] : '#122a14'; }, p[0]);
      D.flat(D.poly([[13.6, 31.6], [41.6, 33], [41.4, 34.4], [13.6, 33]]), GUM, null);
      for (const [x, h] of [[16, 3], [19, 6.6], [22, 4], [25, 8.6], [28.4, 4.6], [31.4, 7.4], [34.4, 4], [36.6, 6]].concat(big ? [[17.6, 2.6], [26.6, 3.4], [33, 3]] : [])) D.G([[x - 1.3, 32.6 + (x - 14) * 0.05], [x + 1.3, 32.8 + (x - 14) * 0.05], [x + 0.5, 32.8 + (x - 14) * 0.05 + h]], bn);
      // 눈두덩 아래 깊이 박힌 눈
      D.L([[27.6, 19.4], [32, 20], [35.6, 22.6]], 0.8, 0.6, ['#0000', '#122a14', '#122a14', '#122a14'], null); D.eye(31.6, 22.4, 1.5, '#f0d040', false); D.px(31.6, 22.4, INK); D.eye(36.6, 25.6, 0.9, '#f0a04a', false); if (big) { D.eye(26.4, 20, 0.9, '#f0d040', false); } if (g3) { D.eye(22, 18.6, 1, '#f0a04a', false); D.px(39.4, 28.6, '#f0e060'); }
      D.px(40.6, 29.6, INK); D.px(40.6, 30.4, '#122a14');
      // 흉터와 사마귀
      D.L([[16, 22], [20.6, 26], [19, 29]], 0.4, 0.4, ['#0000', '#122a14', '#122a14', '#122a14'], null); for (const [x, y] of [[14.6, 27], [23, 24.6], [17.6, 29.6], [27, 27.6], [35, 29.6]]) { D.px(x, y, p[3]); D.px(x + 0.9, y + 0.7, p[3]); D.px(x + 0.2, y - 0.8, p[2]); }
      D.px(17.6, 18.6 - big, '#d8f0c0'); D.px(18.6, 17.8 - big, '#d8f0c0'); D.px(16.8, 19.8 - big, '#d8f0c0');
      // 침
      D.L([[25.4, 40], [25.6, 42.6]], 0.4, 0.4, ['#0000', '#c8e8d8', '#c8e8d8', '#c8e8d8'], null);
      if (g3) { D.flat(D.el(20, 17.6, 3.4, 1.7), MAWC, p[0]); D.fangs(17.4, 22.6, 16.6, 1, 1.6, 1.6); }
    });
    // 엄니: 아래턱에서 윗입술을 넘어 솟는다
    R.part('tusk', { px: 39, py: 36, z: 6, parent: 'jaw' }, D => { D.G([[36.6, 37.4], [38.4, 26.6 - big], [40.4, 37]], bn); D.G([[40.6, 37.4], [42.6, 29.6 - big], [43.8, 36.4]], [bn[0], bn[3], bn[1], '#7a7468']); D.px(38.4, 27.6 - big, '#ffffff'); });
    R.part('spines', { px: 16, py: 20, z: 4, role: 'sway', amp: 0.3, parent: 'body' }, D => { for (let k = 0; k < 3 + st; k++) { const x = 11.6 + k * 2.7, y = 26 - k * 2.6 - big; D.G([[x, y + 2.4], [x - 2.8 - (k % 2), y - 3.6 - big], [x + 2.4, y + 0.6]], bn); } });
  } };
  // 포자 어미 (다시 그림): 살덩이 등에 포자낭이 다닥다닥 돋았다. 몇은 터져 구멍이 났고, 처마 밑에 늘어진 낭이 매달렸다
  DEF.mother = { build(R, st) {
    const st2 = st >= 2, g3 = st >= 3, body = ['#1a2010', '#b8c088', '#e8f0b8', '#7a8450'], sp = '#e8ff7a', hp = ['#0c1a14', '#3a6a4a', '#86c48c', '#1e4430'];
    const sacB = (D, x, y, r, burst) => { D.shade(D.el(x, y, r, r * 1.16), (xx, yy) => { const dx = (xx - x) / r, dy = (yy - y) / (r * 1.16); return -dx * 0.6 - dy * 0.7 > 0.42 ? '#fbffc8' : dx * 0.6 + dy * 0.7 > 0.46 ? '#8aa83a' : '#d0e860'; }, '#2a3010'); if (burst) { D.flat(D.el(x + 0.3, y - r * 0.3, r * 0.56, r * 0.5), '#1a2010', '#5a6a20'); D.px(x + 0.3, y - r * 0.3, '#3a4a1c'); } else { for (const [dx, dy] of [[0.1, 0.3], [-0.3, 0.1], [0.36, -0.1]]) D.px(x + dx * r, y + dy * r, '#5a7030'); D.px(x - r * 0.46, y - r * 0.56, '#ffffff'); } };
    R.ichor = '#2c5c24'; R.shw = 15; R.glow = sp; R.eyes = [['body', 20, 34], ['body', 33.6, 33.6]];
    for (const [k, x, ph, pal] of [[0, 17, Math.PI, [body[0], body[3], body[1], '#4a5230']], [1, 23, 1, [body[0], body[3], body[1], '#4a5230']], [2, 27, 0, body], [3, 32, 2.2, body]]) R.part('leg' + k, { px: x, py: 40, z: k < 2 ? 0 : 5, role: 'leg', ph, amp: 0.5 }, D => { D.L([[x, 39], [x + (k % 2 ? 0.8 : -0.8), 44]], 2.1, 1.6, pal); D.G([[x - 2.4, 45.4], [x, 43], [x + 2.8, 45.4]], pal); });
    R.part('body', { px: 24, py: 41, z: 2, role: 'body', amp: 0.8 }, D => { D.B(24.6, 35, 10.6, 6.6, body); for (let k = 0; k < 5; k++) D.L([[16.6 + k * 4, 30], [17 + k * 3.8, 33.6]], 0.5, 0.5, [body[0], body[3], body[3], body[3]], null);
      for (const [x, y, rx, ry, gg] of [[20, 34, 1.6, 2, 1], [23.6, 37.6, 1.1, 1.3, 0], [17.6, 37.6, 1, 1.1, 0], [33.6, 33.6, 1.3, 1.7, 1], [32, 38, 1, 1.2, 0]].concat(st2 ? [[15.6, 34, 0.8, 1, 0], [36, 36.6, 0.8, 1, 1]] : [])) { D.flat(D.el(x, y, rx, ry), '#1a2010'); D.px(x - rx * 0.5, y + ry, '#e8f0b8'); if (gg) D.px(x, y, sp); }
      D.flat(D.el(28.4, 36, 1.6 + (g3 ? 0.5 : 0), 4.2), MAWC, body[0]); for (let k = 0; k < 4; k++) { D.px(27.2, 33.2 + k * 1.7, TOOTH); D.px(29.6, 34 + k * 1.7, TOOTH); } if (g3) D.L([[28.4, 38.6], [29, 42], [27.6, 44]], 0.8, 0.5, ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038']); });
    // 처마 밑에 늘어진 낭
    [[11.6, 28.6, 2.4, 0.5], [37.6, 28, 2.6, 3.6]].concat(st2 ? [[7.6, 26, 2, 4.6], [41, 25.6, 2, 1.4]] : []).forEach(([x, y, r, ph], k) => R.part('hang' + k, { px: x, py: y - 1, z: 3, role: 'sway', ph, amp: 1.2, parent: 'hump' }, D => { D.rect(x, y - 2, 0.8, 3.4, '#4a6420'); sacB(D, x, y + 3.6 + r * 0.3, r, false); }));
    // 등: 울퉁불퉁한 살덩이
    const lumps = [[16.6, 26, 7.4, 5.4], [26, 24, 8.6, 6.6], [34, 27, 5.6, 4.4]].concat(st2 ? [[21.6, 19.6, 6, 4.6]] : [], g3 ? [[30.6, 18, 5, 4]] : []);
    R.part('hump', { px: 24, py: 31, z: 6, role: 'pulse', amp: 0.25, parent: 'body', lift: 1.6 }, D => {
      const m = D.el(24, 28.6, 13.6 + (st2 ? 1.4 : 0), 3.4); lumps.forEach(([x, y, rx, ry]) => D.el(x, y, rx, ry, m)); D.cut(m, (x, y) => y < 31.4);
      D.shade(m, (x, y) => { let best = 9, bx = 24, by = 26, brx = 8, bry = 6; for (const [lx, ly, lrx, lry] of lumps) { const d = Math.hypot((x - lx) / lrx, (y - ly) / lry); if (d < best) { best = d; bx = lx; by = ly; brx = lrx; bry = lry; } } const dx = (x - bx) / brx, dy = (y - by) / bry, v = -dx * 0.5 - dy * 0.75 + (1 - Math.min(1.2, best)) * 0.3; return best > 0.96 && y < 29 ? hp[3] : v > 0.66 ? hp[2] : v > 0.2 ? hp[1] : v > -0.2 ? hp[3] : deepOf(hp); }, hp[0]);
      for (const [a, b, c] of [[[12, 27], [16, 29.6], [21, 28.6]], [[27, 28], [31, 30], [36, 29]]]) D.L([a, b, c], 0.4, 0.4, ['#0000', '#a8405a', '#a8405a', '#a8405a'], null);
      // 처마: 늘어진 살 자락과 숨구멍
      for (let x = 11.6; x < 38; x += 2.6) { D.px(x, 31.6, hp[3]); D.px(x + 1, 32.4, '#c8d898'); } for (const [x, y] of [[19.6, 24.6], [30.6, 25.6], [24.6, 27.6]]) { D.flat(D.el(x, y, 1.1, 0.8), '#0c1a14'); D.px(x - 1, y - 0.8, hp[2]); }
    });
    // 등에 돋은 포자낭: 저마다 따로 부푼다
    const tops = [[13.6, 21.6, 3.2, 0, 0], [21, 18.4, 3.8, 1.6, 0], [28.6, 17.4, 3.4, 3.1, 1], [35, 22.6, 2.8, 4.6, 0]].concat(st2 ? [[17.6, 13.6, 3, 2.2, 0], [25, 12, 3.2, 0.8, 0]] : [], g3 ? [[32.6, 12.6, 2.8, 3.8, 1], [10, 26.6, 2.2, 5.2, 0], [22, 7.6, 2.4, 2.9, 0]] : []);
    tops.forEach(([x, y, r, ph, burst], k) => R.part('top' + k, { px: x, py: y + r, z: 7, role: 'pulse', amp: 1.1, ph, parent: 'hump' }, D => { D.L([[x, y + r + 1.6], [x, y + r - 0.6]], 1.4, 1.1, [hp[0], hp[3], hp[1], deepOf(hp)]); sacB(D, x, y, r, burst); }));
    for (let k = 0; k < 3 + st; k++) R.part('mote' + k, { px: 24, py: 18, z: 9, role: 'orbit', ph: k * 1.3, amp: 2.4 + (k % 3), sp: 1 }, D => D.px(27 + ((k * 5) % 9) - 2, 9 - (k * 3) % 8, k % 2 ? sp : '#ffffff'));
    R.pose = (anim, f, G, T, fx, s) => { if (anim === 'cast') tops.forEach((q, i) => { const t = T['top' + i], sc = 1 + 0.4 * s.rise * (0.6 + 0.4 * sin(i * 2.1)); t.sx *= sc; t.sy *= sc; }); if (anim === 'attack') { const un = 1 + 0.55 * s.chg; for (const pt of R.parts) if (pt.role === 'pulse') { const t = T[pt.name], sc = (pt.name === 'hump' ? 1 + 0.06 * s.chg : 1 + 0.22 * s.chg) / un; t.sx *= sc; t.sy *= sc; } } };
  } };
  // ---------- 본체의 깨어남 ----------
  // 깨어난 본체에 더하는 빛: 등 뒤의 성긴 후광, 도는 불티, 발밑의 문양
  function awake(R, step) {
    const DS = R.DS, cx = DS / 2, cy = DS * 0.5, gl = R.glow, al = step >= 3 ? 'cc' : '88', p0 = R.pose;
    R.part('aura', { px: cx, py: cy, z: -5, role: 'pulse', amp: 0.5 }, D => D.shade(D.el(cx, cy, DS * 0.54, DS * 0.5), (x, y, X, Y) => { const d = Math.hypot((x - cx) / (DS * 0.54), (y - cy) / (DS * 0.5)); if (d < 0.6) return null; return hsh(X, Y) > 0.45 + (d - 0.6) * 1.4 && (X + Y) % 2 === 0 && Y % 2 === 0 ? gl + al : null; }, null));
    for (let k = 0; k < step * 3; k++) R.part('emb' + k, { px: cx, py: cy, z: 40, role: 'orbit', ph: k * 1.1, amp: 3 + (k % 3) * 2 }, D => D.spark(cx + cos(k * 2.4) * DS * 0.44, cy + sin(k * 2.4) * DS * 0.38, gl, k % 2 === 0));
    R.pose = (anim, f, G, T, fx, s) => { if (p0) p0(anim, f, G, T, fx, s); if (anim !== 'die' && anim !== 'hit') fx.glow = Math.max(fx.glow, step >= 3 ? 0.36 : 0.26); };
  }
  const BOSS3 = {};
  // 바다를 끌고 온 것: 제가 잠겨 있던 물을 통째로 끌고 올라왔다. 양옆에 물마루가 서고, 촉수 열이 머리 위에서 휜다
  BOSS3.abyss = R => {
    const p = P.abyss, dk = dkp(p), q = P.abyss2, qd = dkp(q), sh = P.shell, foam = '#e8fff8';
    R.ichor = '#0f5560'; R.shw = 42; R.glow = '#8fe8d8';
    R.part('sea', { px: 48, py: 92, z: 0 }, D => { D.flat(D.el(48, 91, 47, 4.6), '#0a2a34', '#06141c'); D.flat(D.el(30, 90, 16, 1.2), '#1f6a78'); D.flat(D.el(68, 91.6, 10, 0.8), '#1f6a78'); for (const x of [6, 20, 37, 58, 76, 90]) D.px(x, 90.6, foam); });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('swell' + k, { px: 48 + dir * 36, py: 92, z: 1, role: 'sway', amp: 0.12, ph: k * 2.2 }, D => { const x = 48 + dir * 36; D.shade(D.poly([[x - dir * 13, 92], [x - dir * 9, 78], [x - dir * 2, 67], [x + dir * 6, 62], [x + dir * 10.6, 66], [x + dir * 8.6, 71], [x + dir * 4.6, 70.6], [x + dir * 7, 80], [x + dir * 11.6, 92]]), (xx, yy) => { const v = (92 - yy) / 30 + hsh(Math.round(xx / 2), Math.round(yy / 2)) * 0.22; return v > 0.9 ? foam : v > 0.62 ? '#8fe8d8' : v > 0.34 ? '#1f8f8a' : '#0f5560'; }, '#06141c'); for (let i = 0; i < 5; i++) D.px(x + dir * (3 + i * 2), 61 + (i % 2) * 1.6, foam); });
    [[15, -1, 0, 0], [30, -1, 10, 1.3], [66, 1, 13, 2.6], [81, 1, 2, 3.9]].forEach(([x, dir, h, ph], k) => R.part('bt' + k, { px: x, py: 90, z: 2, role: 'sway', amp: 0.5, ph, cast: dir * 0.3 }, D => tent(D, [[x, 91], [x + dir * 4, 72], [x + dir * 10, 56 - h * 0.4], [x + dir * 10, 38 - h * 0.7], [x + dir * 4, 24 - h], [x + dir * 8, 13 - h * 0.8], [x + dir * 14, 16 - h * 0.8]], 5.6, 1.1, qd, '#bfe8f0')));
    [[34, -1, 8], [42, -0.4, 12], [48, 0, 9], [55, 0.5, 13], [62, 1, 7]].forEach(([x, dir, h], k) => R.part('crown' + k, { px: x, py: 16, z: 3, role: 'sway', amp: 0.3, ph: k * 1.4, parent: 'mantle' }, D => { const c = [p[0], p[2], '#e8fff8', p[1]]; D.L([[x, 18], [x + dir * 2.4, 18 - h * 0.6], [x + dir * 1.6, 18 - h]], 2.2, 0.7, c); D.L([[x + dir * 2, 18 - h * 0.5], [x + dir * 2 + (k % 2 ? 3.4 : -3.4), 18 - h * 0.9]], 1.1, 0.6, c); if (k % 2 === 0) D.L([[x + dir * 1.2, 18 - h * 0.3], [x + dir * 1.2 + (k % 4 ? -2.6 : 2.6), 18 - h * 0.56]], 0.9, 0.5, c); }));
    R.part('mantle', { px: 48, py: 93, z: 4, role: 'body', amp: 0.6 }, D => {
      D.G([[25, 62], [71, 62], [81, 92], [15, 92]], q); D.B(48, 44, 24.6, 31, p);
      for (let k = 0; k < 7; k++) flatL(D, [[26 + k * 0.4, 65 + k * 3.8], [48, 68 + k * 3.8], [70 - k * 0.4, 65 + k * 3.8]], q[3]);
      for (const [x, y, r] of [[31, 30, 3], [28, 39, 2.2], [34.6, 23, 2], [27, 50, 2.8], [32, 57, 1.8], [65, 26, 1.8], [68, 48, 2.4], [62, 20, 1.5]]) { D.B(x, y, r, r, sh); D.px(x, y, '#3a3018'); }
      D.G([[25, 34], [16.6, 29], [19.6, 41], [13.6, 44], [23, 51]], sh); D.px(19, 35, '#ffffff'); D.G([[71, 36], [79, 32], [76.6, 43], [81.6, 47], [73, 52]], [sh[0], sh[3], sh[1], '#4a3e20']);
      for (const [x, y, r, s] of [[63, 36, 2.6, 1], [66, 49, 2, 0], [35, 64, 1.9, 0], [59, 65, 2.4, 1], [41, 17, 1.8, 0], [30, 45, 1.6, 1], [55, 19, 1.5, 0], [47, 71, 1.6, 0]]) D.eye(x, y, r, '#e8d48a', s);
      for (const [x, y] of [[38, 21], [42, 19], [36, 28], [53, 18.6], [59, 23]]) D.px(x, y, foam); flatL(D, [[40, 20], [34.6, 28], [32, 40]], '#c8fff0', 0.7);
      for (let k = 0; k < 9; k++) { const x = 30 + k * 4.5; D.L([[x, 68.6], [x + (k % 2 ? 0.7 : -0.7), 74 + (k % 3) * 1.6]], 1.4, 0.6, dk); }
      // 몸을 타고 흘러내리는 물
      for (const x of [22, 37, 61, 74]) { flatL(D, [[x, 76], [x + 0.4, 84 + (x % 3)]], '#8fe8d8'); D.px(x + 0.4, 86 + (x % 3), foam); }
    });
    eyeP(R, 'eye', 48, 44, 10.6, 0.8, 1, '#f0c840', p, { parent: 'mantle', z: 6, amp: 0.3 });
    eyeP(R, 'eyeL', 34, 50.6, 3.6, 0.5, 0.5, '#e8d48a', p, { parent: 'mantle', z: 6, amp: 0.4, ph: 2 }); eyeP(R, 'eyeR', 62.6, 52, 3.2, -0.5, 0.5, '#e8d48a', p, { parent: 'mantle', z: 6, amp: 0.4, ph: 4 });
    [[20, -1, 0, 1], [30, -1, 1.2, 0.45], [40, -0.6, 2.3, 0.3], [56, 0.6, 3.4, 0.3], [66, 1, 4.5, 0.45], [76, 1, 5.6, 1]].forEach(([x, dir, ph, out], k) => R.part('ft' + k, { px: x, py: 90, z: 7, role: 'sway', amp: 0.6, ph, strike: -dir * 0.45 * (out > 0.5 ? 1 : 0.6) }, D => tent(D, [[x, 91.6], [x + dir * 6 * out, 81], [x + dir * 15 * out, 75], [x + dir * 19 * out, 66 + (1 - out) * 8], [x + dir * 15 * out, 59 + (1 - out) * 13], [x + dir * 10 * out, 62 + (1 - out) * 13]], 5.2, 1.1, p, foam)));
  };
  // 감지 않는 눈: 눈꺼풀을 스스로 찢어 고리에 걸었다. 다시는 감기지 않는다. 눈동자가 셋
  BOSS3.nebula = R => {
    const p = P.nebula, dk = dkp(p), scl = ['#120a26', '#d8ccf0', '#ffffff', '#9a88c8'], gd = ['#3a2a10', '#e8c030', '#fff3a0', '#a87e14'], CX = 48, CY = 42, RR = 25;
    R.ichor = '#3a2580'; R.shw = 24; R.glow = '#fff3a0';
    const ring = (D, front, rx, ry, tilt, th) => D.lit(D.cut(D.el(CX, CY, rx + 2, ry + Math.abs(tilt) * rx + 2), (x, y) => { const yy = y - CY - (x - CX) * tilt, d = Math.hypot((x - CX) / rx, yy / ry), d2 = Math.hypot((x - CX) / (rx - th), yy / Math.max(1, ry - th * 0.8)); return d <= 1 && d2 > 1 && (front ? yy >= 0 : yy < 0) && hsh(Math.round(x / 5), front ? 3 : 7) > 0.16; }), gd);
    [[33, -2, 0], [39, 1.6, 1.2], [45, -1.4, 2.4], [51, 2, 3.6], [57, -1, 5], [62, 1.6, 0.6], [28, 1, 4]].forEach(([x, a, ph], k) => R.part('nerve' + k, { px: x, py: 63, z: 0, role: 'sway', amp: 0.8, ph }, D => tent(D, [[x, 62 - Math.abs(x - 48) * 0.2], [x + a, 71], [x - a, 79], [x + a * 0.6, 88 - (k % 3) * 4]], 3 - (k % 2) * 0.7, 0.6, dk, k % 2 ? null : '#cdbcff')));
    R.part('ringB', { px: CX, py: CY, z: 1, role: 'float', amp: 0.4, ph: 1 }, D => { ring(D, false, 42, 10.6, 0.06, 3); ring(D, false, 36, 9, -0.42, 2.4); });
    // 찢어 젖힌 눈꺼풀: 위아래로 말려 고리에 꿰였다
    R.part('lids', { px: CX, py: CY, z: 2, role: 'pulse', amp: 0.12 }, D => { for (const dir of [-1, 1]) { D.ball(D.cut(D.el(CX, CY, RR + 4.6, RR + 4.6), (x, y) => dir * (y - CY) > RR * 0.78 + Math.abs(x - CX) * 0.1 && hsh(Math.round(x / 3), dir + 2) > 0.14), CX, CY, RR + 4.6, RR + 4.6, dir < 0 ? p : dk); for (let k = 0; k < 5; k++) { const x = CX - 14 + k * 7, y = CY + dir * (RR + 2.6 - Math.abs(k - 2) * 1.6); flatL(D, [[x, y], [x + (k - 2) * 1.6, y + dir * 6.6]], gd[1], 0.6); D.px(x + (k - 2) * 1.6, y + dir * 7.6, gd[2]); D.px(x, y, '#c85a7a'); } } });
    R.part('ball', { px: CX, py: CY, z: 3, role: 'pulse', amp: 0.16 }, D => {
      D.B(CX, CY, RR, RR, scl);
      for (const [a, len, b] of [[2.5, 11, 0.5], [3.4, 10, -0.4], [0.5, 10.6, 0.4], [-0.3, 9, -0.5], [1.5, 9, 0.3], [4.4, 8, 0.4], [5.3, 8.6, -0.3], [2, 7, -0.4], [3.9, 9, 0.5]]) { const x0 = CX + cos(a) * (RR - 1), y0 = CY + sin(a) * (RR - 1), x1 = CX + cos(a + b * 0.3) * (RR - 1 - len * 0.5), y1 = CY + sin(a + b * 0.3) * (RR - 1 - len * 0.5), x2 = CX + cos(a - b * 0.2) * (RR - 1 - len), y2 = CY + sin(a - b * 0.2) * (RR - 1 - len); flatL(D, [[x0, y0], [x1, y1], [x2, y2]], '#b05ac8'); }
      D.flat(D.el(38, 28, 4, 2.4), '#ffffff'); D.px(33.6, 33, '#ffffff');
    });
    R.part('iris', { px: CX, py: CY + 1, z: 4, parent: 'ball', morph: true, flare: true }, (D, m) => {
      const cy = CY + 1; D.shade(D.el(CX, cy, 14.6, 15), (x, y, ax, ay) => { const d = Math.hypot(x - CX, (y - cy) * 0.97), a = Math.atan2(y - cy, x - CX), h = hsh(ax, ay); if (h > 0.965) return '#ffffff'; if (d > 13.2) return '#2a1860'; const band = sin(a * 11 + d * 0.9) > 0.3; return d > 9.6 ? (band ? '#6a4fc8' : '#4a30a0') : d > 5.6 ? (band ? '#c86ad8' : '#8a5ad8') : (band ? '#fff3a0' : '#f0a04a'); }, INK);
      // 눈동자 셋: 서로 다른 곳을 본다
      for (const [dx, dy, w0, hh] of [[0, -5.6, 1.6, 4.6], [-5, 3.6, 1.4, 4], [5, 3.6, 1.4, 4]]) { const w = w0 + m * 2.2; D.flat(D.el(CX + dx, cy + dy, w, hh - m * 0.8), VOID); D.px(CX + dx, cy + dy, m > 0.4 ? '#fff3a0' : '#8a7ad8'); }
      if (m > 0.4) { D.spark(CX, cy, '#fff3a0', true); for (const [dx, dy] of [[-3, 0], [3, 0], [0, -2], [0, 3]]) D.px(CX + dx, cy + dy, '#fff3a0'); }
      D.px(42, 34, '#ffffff'); D.px(43, 33.6, '#ffffff'); D.px(41.6, 35.6, '#f0d8ff');
    });
    [[36, 19, -6, -11, 0], [48, 17, 0.6, -13, 1.3], [59, 19, 6, -10, 2.6], [42, 17.6, -2.6, -8, 3.6], [54, 17.6, 3, -7.6, 4.8]].forEach(([x, y, dx, dy, ph], k) => R.part('horn' + k, { px: x, py: y, z: 2, role: 'sway', amp: 0.35, ph, parent: 'ball' }, D => { tent(D, [[x, y + 2], [x + dx * 0.4, y + dy * 0.55], [x + dx, y + dy]], 2.4, 0.7, p, null); D.B(x + dx, y + dy - 0.6, k < 3 ? 2.2 : 1.6, k < 3 ? 2.2 : 1.6, gd); D.px(x + dx - 0.6, y + dy - 1.2, '#ffffff'); }));
    [[24, 52, 9, 64, 5.4, 0.4, '#f0a04a'], [71, 30, 86, 18, 6, 2, '#7af0d8'], [72, 53, 86.6, 62, 5, 3.4, '#f070e8'], [25, 30, 9.6, 20, 4.8, 5, '#fff3a0'], [22, 41, 5, 42, 3.8, 1.2, '#7af0d8'], [74, 42, 91, 41, 3.8, 4.2, '#f0a04a'], [33, 62, 22, 76, 3.6, 2.8, '#f070e8'], [63, 62, 75, 77, 3.8, 0.9, '#fff3a0']].forEach(([x0, y0, x1, y1, r, ph, ir], k) => R.part('stalk' + k, { px: x0, py: y0, z: 2, role: 'sway', amp: 0.4, ph, parent: 'ball', cast: (x1 > CX ? -1 : 1) * 0.25 }, D => {
      tent(D, [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2], [x1, y1]], 2, 1, dk, null); D.B(x1, y1, r, r, scl); D.flat(D.el(x1 + (x1 > CX ? -0.6 : 0.6), y1 + 0.4, r * 0.56, r * 0.6), ir, INK); D.flat(D.el(x1 + (x1 > CX ? -0.6 : 0.6), y1 + 0.4, 0.7, r * 0.42), INK); D.px(x1 - r * 0.4, y1 - r * 0.5, '#ffffff'); for (const a of [-2.4, -1.57, -0.74]) flatL(D, [[x1 + cos(a) * r, y1 + sin(a) * r], [x1 + cos(a) * (r + 1.8), y1 + sin(a) * (r + 1.8)]], p[1]); }));
    R.part('ringF', { px: CX, py: CY, z: 7, role: 'float', amp: 0.4, ph: 1 }, D => { ring(D, true, 42, 10.6, 0.06, 3); ring(D, true, 36, 9, -0.42, 2.4); for (const [x, y] of [[14, 50], [70, 54], [84, 46], [30, 60]]) D.spark(x, y, '#fff3a0', true); });
    R.pose = (anim, f, G, T, fx, s) => { if (anim === 'idle' || anim === 'cast') G.dy += sin(f * TAU) * 1.8 - 2; if (anim === 'attack') { T.iris.dx = 2.6 * Math.max(0, s.L); T.iris.dy = 1.8 * Math.max(0, s.L); } };
  };
  // 굴을 메운 어미: 알이 굴을 메웠다. 배는 바닥에 퍼졌고, 알 주머니가 탑처럼 솟았으며, 벌써 깬 것들이 몸 위를 긴다
  BOSS3.brood = R => {
    const p = P.brood2, dk = dkp(p), g = P.brood, sac = (D, x, y, rx, ry, wake) => { D.shade(D.el(x, y, rx, ry), (xx, yy) => { const dx = (xx - x) / rx, dy = (yy - y) / ry; return -dx * 0.6 - dy * 0.7 > 0.42 ? '#f8ffd8' : dx * 0.6 + dy * 0.7 > 0.5 ? '#98a860' : '#d8e8a0'; }, '#2a3010'); D.flat(D.el(x + rx * 0.14, y + ry * 0.2, rx * 0.46, ry * 0.42), '#5a7030'); D.flat(D.el(x + rx * 0.3, y + ry * 0.06, rx * 0.22, ry * 0.2), '#2c3c18'); D.px(x + rx * 0.34, y, wake ? '#ff5040' : '#f0e060'); D.px(x - rx * 0.5, y - ry * 0.5, '#ffffff'); };
    const grub = (D, x, y, dir) => { D.B(x, y, 2.6, 1.8, ['#2a2a10', '#d8d890', '#fbfbd0', '#9a9a58']); D.px(x + dir * 1.6, y - 0.4, '#ff5040'); D.px(x + dir * 2.6, y + 0.8, TOOTH); D.px(x - dir * 3, y + 0.6, '#9a9a58'); };
    R.ichor = '#2c5c24'; R.shw = 42; R.glow = '#e8ff7a';
    [[8, -1, Math.PI], [18, -1, 0.6], [28, -1, 2], [68, 1, Math.PI + 2], [78, 1, Math.PI + 0.6], [88, 1, 0], [34, -1, 0], [62, 1, Math.PI]].forEach(([x, dir, ph], k) => R.part('leg' + k, { px: 48 + dir * 18, py: 70, z: k < 6 ? 1 : 7, role: 'leg', ph, amp: 0.3 }, D => { const far = k < 6, pal = far ? dk : p, kx = x - dir * (far ? 1 : 4), ky = far ? 54 - (k % 3) * 6 : 76; D.L([[48 + dir * 18, 70], [kx, ky], [x, 85], [x + dir * 1.6, 92]], far ? 2.6 : 3.2, 1, pal); D.px(kx, ky - 1.6, pal[2]); D.G([[x + dir * 0.6, 93], [x + dir * 1.8, 89], [x + dir * 5, 93]], pal); }));
    R.part('belly', { px: 48, py: 86, z: 3, role: 'body', amp: 0.7 }, D => {
      D.B(48, 56, 36, 25, p);
      D.shade(D.el(48, 58, 30, 19), (x, y, ax, ay) => { const dx = (x - 48) / 30, dy = (y - 58) / 19; return -dx * 0.6 - dy * 0.7 > 0.5 ? '#f0f8c0' : (ax + ay) % 2 ? '#c8dc90' : '#b4cc7c'; }, p[3]);
      for (const [x, y, rx, ry, w] of [[28, 53, 4.6, 5.4, 0], [38, 48, 5, 5.8, 1], [50, 50, 4.8, 5.6, 0], [61, 52, 4.4, 5.2, 1], [69, 60, 3.8, 4.6, 0], [33, 64, 4.8, 5.2, 0], [45, 63, 5.2, 5.6, 1], [57, 64.6, 4.6, 5, 0], [23.6, 61, 3.4, 4, 0], [40, 73, 3.6, 3.6, 0], [53, 73.6, 3.4, 3.4, 0]]) sac(D, x, y, rx, ry, w);
      for (const [a, b] of [[[20, 44], [28, 37]], [[76, 46], [70, 38]], [[36, 76], [46, 78.6]], [[58, 76], [66, 72]]]) flatL(D, [a, b], '#7a9a3a');
      for (const [x, y] of [[14, 56], [14.6, 48], [81, 54], [80, 64], [20, 70]]) { D.px(x, y, p[2]); D.px(x, y + 1, p[3]); }
      // 터진 자리
      for (const [x, y] of [[65, 44], [30, 43]]) { D.flat(D.el(x, y, 2.4, 1.8), '#2c3c18', '#14200c'); D.px(x - 1.6, y - 1.6, '#f8ffd8'); D.px(x + 2, y - 1.4, '#f8ffd8'); }
    });
    [[20, 37, 5, 7, 0, -0.5], [31, 27, 5.6, 8, 1.4, -0.3], [44, 22, 6.4, 9, 2.8, -0.1], [57, 24, 5.6, 8, 4.2, 0.2], [69, 31, 5, 7, 5.2, 0.4], [78, 41, 4.2, 5.6, 0.7, 0.5], [38, 11, 4.2, 6, 3.3, -0.1], [52, 10, 4.6, 6.4, 1.9, 0.1], [45, 2, 3.2, 4.4, 5.6, 0]].forEach(([x, y, rx, ry, ph, tilt], k) => R.part('sac' + k, { px: x, py: y + ry + 2, z: k >= 6 ? 2 : 4, role: 'sway', amp: 0.4, ph, parent: 'belly', lift: 2 }, D => { D.L([[x, y + ry + 4], [x + tilt * 2, y + ry - 1]], 1.8, 1.3, dk); sac(D, x + tilt * 3, y, rx, ry, k % 3 === 1); if (k === 2) { flatL(D, [[x - 2, y - 6], [x, y - 2], [x - 1.6, y + 2]], INK); D.px(x - 3, y - 1, '#ff5040'); D.px(x - 4, y - 2, TOOTH); } }));
    // 벌써 깬 것들
    [[24, 46, 1, 0], [72, 47, -1, 2], [47, 40, 1, 4]].forEach(([x, y, dir, ph], k) => R.part('grub' + k, { px: x, py: y, z: 5, role: 'float', amp: 1, ph, parent: 'belly' }, D => grub(D, x, y, dir)));
    R.part('head', { px: 48, py: 74, z: 8, role: 'head', amp: 0.7, parent: 'belly' }, D => {
      D.B(48, 78, 12, 9, g); for (const [x, y, r] of [[41, 75, 1.8], [46, 73.4, 1.4], [52, 74.6, 2], [56, 77.4, 1.3], [39, 79, 1.2], [48.6, 77.6, 1.1], [44, 80.6, 0.9], [53.6, 81, 0.9]]) { D.flat(D.el(x, y, r, r), INK); D.px(x, y - 0.3, '#f0e060'); }
      D.px(40, 72, g[2]); D.px(41, 71.4, g[2]); for (const x of [38, 44, 52, 58]) D.G([[x - 1, 71], [x, 66.6], [x + 1.4, 71]], P.bone);
    });
    for (const [k, dir] of [[0, -1], [1, 1], [2, -1], [3, 1]]) { const inn = k >= 2; R.part('mand' + k, { px: 48 + dir * (inn ? 2.6 : 5), py: 83, z: 9, parent: 'head', jaw: -dir * (inn ? 0.3 : 0.5), role: 'sway', amp: 0.25, ph: k * Math.PI }, D => { const w = inn ? 0.6 : 1; D.G([[48 + dir * 7 * w, 82], [48 + dir * 7.6 * w, 89.6 - (inn ? 2 : 0)], [48 + dir * 1.8 * w, 92.6 - (inn ? 2.6 : 0)], [48 + dir * 4.6 * w, 87], [48 + dir * 3 * w, 83]], inn ? dkp(P.bone) : P.bone); }); }
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('arm' + k, { px: 48 + dir * 11, py: 78, z: 7, role: 'arm', ph: k * 2, amp: 0.5, parent: 'belly', strike: dir * 0.4, cast: dir * 0.5 }, D => { D.L([[48 + dir * 11, 78], [48 + dir * 17, 84], [48 + dir * 14, 90]], 2.2, 1.1, g); D.px(48 + dir * 13.6, 91, P.bone[1]); D.px(48 + dir * 15, 91, P.bone[1]); });
    [[6, 89, 3, 3.4, 0], [14, 91, 2.2, 2.4, 3], [83, 88.6, 3.4, 3.8, 2], [91, 90.6, 2.2, 2.4, 4], [30, 91, 2, 2.2, 1], [67, 91, 2.2, 2.2, 5]].forEach(([x, y, rx, ry, ph], k) => R.part('laid' + k, { px: x, py: 93, z: 10, role: 'pulse', amp: 0.6, ph }, D => sac(D, x, y, rx, ry, k % 2 === 1)));
  };
  // 끝나지 않는 합창: 한 벌 옷 아래 아홉 두건. 입을 다무는 머리가 없다
  BOSS3.dusk = R => {
    const p = P.dusk, lit = [p[0], '#6a4a62', '#a888a0', '#3a2440'], dkr = [p[0], '#32203a', '#5a3e5a', '#1c1024'], fl = P.flesh, gl = p[4];
    R.ichor = '#2a1830'; R.shw = 40; R.glow = gl;
    [[10, -1, 0], [24, -0.5, 1.6], [38, -0.2, 2.6], [58, 0.2, 3.4], [72, 0.5, 4.4], [86, 1, 5.4]].forEach(([x, dir, ph], k) => R.part('hem' + k, { px: x, py: 88, z: 0, role: 'sway', amp: 0.5, ph }, D => tent(D, [[x, 86], [x + dir * 4, 91], [x + dir * 10, 92.6], [x + dir * 13, 90]], 3, 0.6, P.shadow, null)));
    R.part('robe', { px: 48, py: 93, z: 2, role: 'body', amp: 0.45 }, D => {
      D.G([[28, 46], [68, 46], [80, 60], [88, 93], [81, 90], [74, 93], [67, 90], [60, 93], [53, 90], [48, 93], [43, 90], [36, 93], [29, 90], [22, 93], [15, 90], [8, 93], [16, 60]], p);
      for (const [a, b, c] of [[[36, 50], [32, 70], [28, 90]], [[48, 52], [48.6, 72], [47.6, 90]], [[60, 50], [64, 70], [68, 90]], [[24, 60], [19, 76], [15, 89]], [[72, 60], [77, 76], [81, 89]]]) flatL(D, [a, b, c], p[3], 0.8);
      for (const [a, b] of [[[40, 54], [38, 74]], [[55, 54], [57, 72]], [[29, 64], [25, 82]]]) flatL(D, [a, b], p[2]);
      for (let k = 0; k < 9; k++) { const x = 16 + k * 8; D.spark(x, 80 + (k % 2) * 2.4, k % 3 ? '#8a5a40' : gl, true); }
      D.G([[36, 46], [60, 46], [55, 55], [48, 58], [41, 55]], dkr);
      // 옷자락에 꿰맨 입들
      for (const [x, y] of [[26, 72], [70, 70], [40, 84], [58, 85]]) { D.rect(x - 2, y, 4.4, 1.2, MAWC); D.px(x - 1.4, y, TOOTH); D.px(x + 0.4, y, TOOTH); D.px(x + 1.8, y, TOOTH); }
    });
    const hood = (name, x, y, r, ph, kind, z) => R.part(name, { px: x, py: y + r * 1.6, z, role: 'head', amp: 1, ph, parent: 'robe', lift: 1.5 + r * 0.2, morph: true, flare: true, sp: 1 }, (D, m) => {
      const pal = z > 4 ? lit : z > 3 ? p : dkr; D.L([[x, y + r * 2.1], [x, y + r * 0.8]], r * 0.8, r * 0.7, z > 4 ? p : dkr);
      D.G([[x - r, y + r * 1.2], [x - r * 1.06, y - r * 0.2], [x - r * 0.5, y - r * 1.1], [x + r * 0.16, y - r * 1.62], [x + r * 0.7, y - r * 0.9], [x + r * 1.06, y], [x + r, y + r * 1.2], [x, y + r * 1.5]], pal);
      D.flat(D.el(x + r * 0.04, y + r * 0.24, r * 0.66, r * 0.86), VOID, pal[0]); const gc = m > 0.4 ? '#fff3c0' : gl;
      // 입: 다물지 않는다. 시전하면 더 벌어진다
      const mw = r * 0.34, mh = r * (0.22 + m * 0.3); D.flat(D.el(x, y + r * 0.52, mw, mh), kind % 2 ? '#5a1420' : MAWC, null); if (kind % 3 === 0) { D.px(x - mw * 0.6, y + r * 0.52 - mh, TOOTH); D.px(x + mw * 0.6, y + r * 0.52 - mh, TOOTH); }
      if (kind % 3 === 0) { D.px(x - r * 0.3, y - r * 0.16, gc); D.px(x + r * 0.3, y - r * 0.16, gc); } else if (kind % 3 === 1) { D.rect(x - 0.4, y - r * 0.5, 1, r * 0.6, gc); } else { D.px(x, y - r * 0.2, gc); D.px(x - r * 0.3, y - r * 0.4, gc); D.px(x + r * 0.3, y - r * 0.4, gc); }
      D.px(x - r * 0.5, y - r * 0.7, pal[2]); D.px(x - r * 0.3, y - r * 0.96, pal[2]);
    });
    hood('h7', 8.6, 60, 5.4, 2.6, 2, 3); hood('h8', 87.6, 59, 5.6, 5.6, 1, 3); hood('h5', 17, 47, 6.6, 2.2, 4, 3.5); hood('h6', 79.6, 46, 6.8, 3.8, 3, 3.5);
    hood('h3', 27, 33, 7.6, 1.1, 1, 4); hood('h4', 69.6, 32, 7.8, 4.9, 2, 4); hood('h1', 37, 21, 8, 0.6, 5, 4.5); hood('h2', 59.6, 20.6, 8.2, 4.2, 0, 4.5); hood('h0', 48, 10, 10.6, 0, 6, 5);
    R.part('armL', { px: 37, py: 60, z: 6, role: 'arm', amp: 0.4, parent: 'robe', cast: 0.5, strike: 0.5 }, D => { D.L([[36, 58], [31, 68], [38, 72.6]], 4, 2.6, lit); D.L([[38, 72.6], [42.6, 72]], 1.4, 1, fl); D.px(43.6, 71, fl[1]); D.px(43.6, 73, fl[1]); });
    R.part('armR', { px: 60, py: 60, z: 6, role: 'arm', amp: 0.4, ph: 2, parent: 'robe', cast: -0.7, strike: -0.3 }, D => { D.L([[60, 58], [66, 67], [61, 71]], 4, 2.6, lit); D.L([[61, 71], [57, 70]], 1.4, 1, fl); D.rect(55.6, 65.6, 1, 5, '#3a2a1a'); });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('armX' + k, { px: 48 + dir * 22, py: 62, z: 6, role: 'arm', amp: 0.3, ph: 1 + k * 2, parent: 'robe', cast: dir * 0.8 }, D => { const x = 48 + dir * 22; D.L([[x, 62], [x + dir * 8, 58], [x + dir * 12, 50]], 3.2, 2, lit); D.L([[x + dir * 12, 50], [x + dir * 12.6, 46]], 1.2, 0.9, fl); D.rect(x + dir * 12.2, 40.6, 1.4, 5.6, '#e8dcc0'); D.flat(D.el(x + dir * 12.8, 38.6, 1.2, 2), gl, '#5a2a0a'); D.px(x + dir * 12.8, 39, '#fff3c0'); });
    R.part('lamp', { px: 56, py: 70.6, z: 7, role: 'sway', amp: 0.9, parent: 'armR' }, D => { flatL(D, [[56, 70.6], [56, 74.6]], '#3a2a1a'); D.flat(D.el(56, 79.6, 4.4, 5.2), '#ffd070', '#3a2410'); D.flat(D.el(55.8, 79.4, 2.2, 3.2), '#fff8d8'); D.rect(52, 74.6, 8, 1.1, '#5a3a1a'); D.rect(52, 84.2, 8, 1.1, '#5a3a1a'); D.px(55.6, 77.6, '#ffffff'); });
    R.part('bell', { px: 43.6, py: 72, z: 7, role: 'sway', amp: 1.2, ph: 1.6, parent: 'armL' }, D => { D.G([[41, 74.6], [46, 74.6], [48.4, 82], [38.6, 82]], P.gold); D.px(43.6, 83.2, P.gold[3]); D.px(41.6, 76.6, '#ffffff'); });
    R.pose = (anim, f, G, T, fx, s) => { if (anim === 'idle') for (let k = 0; k < 9; k++) T['h' + k].m = 0.3 + 0.3 * sin(f * TAU * 2 + k * 0.7); };
  };
  // 바닥 없는 아가리: 턱 안에 턱이 있고 그 안에 또 턱이 있다. 끝이 보이지 않는다
  BOSS3.hunger = R => {
    const p = P.hunger, q = P.hunger2, dk = dkp(p), bn = P.bone, bd = [bn[0], bn[3], bn[1], '#7a7468'], tg = ['#3a0810', '#d8506a', '#ff9ab0', '#8a2038'];
    R.ichor = '#6a121c'; R.shw = 42; R.glow = '#ff8a7a';
    for (const [k, dir] of [[0, -1], [1, 1]]) for (let j = 0; j < 4; j++) R.part('rib' + k + j, { px: 48 + dir * 28, py: 62 - j * 2, z: 1, role: 'sway', amp: 0.3, ph: j * 1.3 + k * 2, cast: dir * 0.3 }, D => { const x = 48 + dir * 28, y = 62 - j * 3; D.L([[x, y], [x + dir * (9 + j * 2), y - 9 - j * 5], [x + dir * (7 + j), y - 20 - j * 8], [x + dir * (1 + j), y - 25 - j * 8.6]], 2.4, 0.8, bn); });
    for (const [k, dir] of [[0, -1], [1, 1]]) R.part('arm' + k, { px: 48 + dir * 30, py: 72, z: 2, role: 'arm', ph: k * 2.4, amp: 0.3, strike: -dir * 0.3 }, D => { const x = 48 + dir * 30; D.L([[x, 70], [x + dir * 11, 75], [x + dir * 10, 87]], 6, 4.2, q); D.G([[x + dir * 5, 93], [x + dir * 8.6, 86], [x + dir * 17, 93]], q); for (let c = 0; c < 3; c++) D.G([[x + dir * (7 + c * 4), 93.4], [x + dir * (8.6 + c * 4), 88.6], [x + dir * (10.6 + c * 4), 93.4]], bn, null); });
    R.part('lower', { px: 48, py: 93, z: 3, role: 'body', amp: 0.45 }, D => {
      D.G([[12, 66], [84, 66], [80, 86], [68, 93], [28, 93], [16, 86]], q); D.B(48, 72, 36, 18, q);
      // 턱 안의 턱, 그 안의 턱
      D.flat(D.el(48, 66, 31, 15.6), MAWC, q[0]); ringTeeth(D, 48, 66.6, 29, 14, 19, 4.4, 0.1, bn);
      D.flat(D.el(48, 68, 21, 10.6), GUM, '#3a0810'); ringTeeth(D, 48, 68.4, 19.6, 9.6, 15, 3.4, 0.3, bd);
      D.flat(D.el(48, 69.6, 13, 6.6), '#3a0810', MAWC); ringTeeth(D, 48, 70, 12, 6, 11, 2.4, 0.5, bn);
      D.flat(D.el(48, 71, 7, 3.6), VOID); ringTeeth(D, 48, 71.2, 6.4, 3.2, 7, 1.4, 0.2, bd); D.px(48, 71.6, '#3a0810');
      for (const [x, y] of [[18, 82], [26, 87], [70, 86.6], [78, 81], [48, 89.6]]) { D.px(x, y, q[2]); D.px(x + 1, y + 1, q[3]); }
      for (const [a, b] of [[[22, 84], [34, 89]], [[62, 89.6], [75, 84]]]) flatL(D, [a, b], q[3]);
    });
    [[30, -8, 0, 15], [40, -3, 1.3, 19], [49, 1, 2.6, 22], [58, 4, 3.6, 18], [66, 9, 4.8, 13]].forEach(([x, dx, ph, len], k) => R.part('tongue' + k, { px: x, py: 70, z: 4, role: 'sway', amp: 0.5, ph, parent: 'lower' }, D => { D.L([[x, 69], [x + dx * 0.5, 69 + len * 0.5], [x + dx, 69 + len], [x + dx * 1.3, 69 + len * 1.14]], 2.8, 1.2, tg); D.px(x + dx * 0.4, 69 + len * 0.4, '#ffd0d8'); if (k % 2 === 0) { D.flat(D.el(x + dx * 1.2, 69 + len * 1.1, 1.8, 1.3), MAWC); D.px(x + dx * 1.2 - 0.8, 69 + len * 1.1, TOOTH); D.px(x + dx * 1.2 + 0.8, 69 + len * 1.1, TOOTH); } }));
    R.part('upper', { px: 48, py: 58, z: 6, role: 'pulse', amp: 0.1 }, D => {
      D.B(48, 40, 35, 19.6, p); D.G([[14, 43], [82, 43], [78, 56], [18, 56]], p);
      D.flat(D.poly([[17, 53], [79, 53], [75, 59], [21, 59]]), GUM, p[0]);
      for (let k = 0; k < 13; k++) { const x = 20 + k * 4.7, h = 7 + (k % 2) * 3.6 + (k === 3 || k === 9 ? 5 : 0), y = 57; D.G([[x - 2.2, y], [x + 2.2, y], [x + (k % 3 - 1) * 0.7, y + h]], bn); }
      for (let k = 0; k < 9; k++) { const x = 25 + k * 5.8, y = 56; D.G([[x - 1.4, y], [x + 1.4, y], [x, y + 3.6]], bd, null); }
      for (const [x, y, r, s] of [[30, 35, 3.2, 1], [39.6, 29.6, 2, 0], [54, 32.6, 3.8, 1], [65, 38, 2.2, 0], [22, 42, 1.7, 0], [47, 40, 1.6, 0], [72, 45, 1.5, 0], [35, 44.6, 1.4, 0], [60, 46, 1.4, 0], [44, 24.6, 1.3, 0], [26, 30, 1.2, 0]]) D.eye(x, y, r, '#f0d040', s);
      for (const [a, b] of [[[20, 35], [27, 28]], [[62, 26], [72, 33]], [[38, 47.6], [52, 49.6]], [[60, 49], [70, 51.6]]]) flatL(D, [a, b], p[3], 0.7);
      for (const [x, y] of [[27, 26], [34, 23.6], [42, 22.6], [25, 31]]) D.px(x, y, '#ffd0c8'); flatL(D, [[30, 26], [40, 23]], '#ffb0a8', 0.7);
    });
    [[26, -4, 0], [36, -1, 1.2], [47, 0.6, 2.2], [58, 2.6, 3.2], [68, 5, 4.4]].forEach(([x, dx, ph], k) => R.part('spine' + k, { px: x, py: 26, z: 5, role: 'sway', amp: 0.3, ph, parent: 'upper' }, D => { const y = 23.6 + Math.abs(x - 48) * 0.22; D.G([[x - 2.6, y + 3.6], [x + dx, y - 9 - (k % 2) * 4], [x + 2.8, y + 3.6]], bn); }));
    R.pose = (anim, f, G, T, fx, s) => { const open = anim === 'attack' ? (f < 0.32 ? ease(f / 0.32) : f < 0.46 ? 1 - 1.25 * (f - 0.32) / 0.14 : -0.25 * (1 - (f - 0.46) / 0.54)) : anim === 'cast' ? s.rise * 1.2 : anim === 'idle' ? 0.3 + 0.25 * sin(f * TAU) : anim === 'hit' ? 0.5 * s.hr : 0.25; T.upper.dy -= open * 12; T.upper.rot += open * -0.05; for (let k = 0; k < 5; k++) T['tongue' + k].sy = 1 + open * 0.2; };
  };
  // ---------- 새 연출 (o: size 칸 크기, r 넓이 배수, targets [[x, y], …], w 판 너비, kill 처형) ----------
  // 떨어지는 별: 하늘에서 흰 점이 떨어지고, 닿은 자리에서 고리가 퍼진다 (3x3)
  FX.meteor = (g, a, b, t, o) => { const U = o.size, R3 = U * 1.5 * (o.r || 1), warn = seg(t, 0, 0.3), fall = ease(seg(t, 0.14, 0.46)), hit = seg(t, 0.46, 1), gy = b.y + U * 0.3;
    if (t < 0.5) { g.a(0.5 + 0.4 * sin(t * 40)); g.ring(b.x, gy, R3 * (1.2 - 0.2 * warn), R3 * 0.42 * (1.2 - 0.2 * warn), '#6a4fc8', 1, f => Math.floor(f * 24) % 2 === 0); g.a(1); }
    if (t >= 0.14 && t < 0.48) { const x0 = b.x + U * 1.3, y0 = b.y - U * 5, x = lerp(x0, b.x, fall), y = lerp(y0, b.y, fall); for (let i = 0; i < 14; i++) { const f = i / 14, tx = lerp(x, x0, f * 0.3), ty = lerp(y, y0, f * 0.3); g.a(1 - f); g.sq(tx, ty, i < 3 ? '#ffffff' : i < 8 ? '#cdbcff' : '#6a4fc8', Math.max(1, Math.round(4 - f * 4))); } g.a(1); g.disc(x, y, g.s * 3, '#ffffff'); rays(g, x, y, g.s * 3, 4, '#fff3a0', 0.78, g.s * 4); }
    if (t >= 0.46) { const p = ease(hit); g.a(1 - hit * hit); if (hit < 0.2) { g.add(true).disc(b.x, b.y, U * 0.7 * (1 - hit * 3), '#ffffff').add(false); } for (const [d, c, w] of [[0, '#ffffff', 2], [0.16, '#cdbcff', 2], [0.34, '#6a4fc8', 1]]) { const q = clamp((p - d) / (1 - d), 0, 1); if (q > 0) g.ring(b.x, gy, R3 * q, R3 * 0.42 * q, c, w); }
      g.line(b.x, gy, b.x, gy - U * 2.2 * (1 - hit), '#ffffff', hit < 0.3 ? 3 : 1); for (let i = 0; i < 14; i++) { const an = hsh(i, 2) * TAU, r = R3 * p * (0.3 + hsh(i, 4) * 0.7); star(g, b.x + cos(an) * r, gy + sin(an) * r * 0.42 - sin(hit * Math.PI) * U * (0.2 + hsh(i, 6) * 0.5), i % 3 ? '#cdbcff' : '#fff3a0', i % 4 === 0); } g.a(1); } };
  // 종소리: 둥근 물결이 두 칸까지 퍼진다
  FX.toll = (g, a, b, t, o) => { const U = o.size, R2 = U * 2.4 * (o.r || 1), gy = a.y + U * 0.3, fade = seg(t, 0.75, 1);
    if (t < 0.16) { g.add(true).a(0.8 * (1 - t / 0.16)).disc(a.x, a.y - U * 0.1, U * 0.5, '#f0a04a').add(false).a(1); }
    for (const [d, c, c2, w] of [[0, '#fff3c0', '#f0a04a', 2], [0.14, '#f0a04a', '#8a4a2a', 2], [0.28, '#d8b868', '#4a3a1e', 1], [0.42, '#8a6a34', '#2a1830', 1]]) { const q = seg(t, d, d + 0.6); if (q <= 0 || q >= 1) continue; const e = ease(q); g.a((1 - q) * (1 - fade)); g.ring(a.x, gy, R2 * e, R2 * 0.42 * e, c2, w + 2).ring(a.x, gy, R2 * e, R2 * 0.42 * e, c, w); g.ring(a.x, a.y - U * 0.1, R2 * e * 0.5, R2 * e * 0.5, c, 1, f => Math.floor(f * 16 + t * 8) % 4 === 0); }
    g.a(1 - fade); for (let i = 0; i < 8; i++) { const an = i * 0.785 + 0.3, r = R2 * ease(seg(t, 0.05, 0.8)) * 0.8; glyph(g, a.x + cos(an) * r, gy + sin(an) * r * 0.42 - U * 0.3 - sin(t * 6 + i) * g.s * 2, i, i % 2 ? '#f0a04a' : '#cdbcff'); } g.a(1); };
  // 먹물: 먹빛 덩어리가 날아가 터지고 얼룩이 남는다 (3x3)
  FX.ink = (g, a, b, t, o) => { const U = o.size, R3 = U * 1.45 * (o.r || 1), fly = seg(t, 0, 0.4), sp = ease(seg(t, 0.4, 0.62)), fade = seg(t, 0.82, 1), gy = b.y + U * 0.3, C = ['#04060a', '#1a2634', '#5a7e98'];
    if (t < 0.4) { const x = lerp(a.x, b.x, fly), y = lerp(a.y - U * 0.6, b.y, fly) - sin(fly * Math.PI) * U * 1.1; for (let i = 5; i >= 0; i--) { const f = Math.max(0, fly - i * 0.03), tx = lerp(a.x, b.x, f), ty = lerp(a.y - U * 0.6, b.y, f) - sin(f * Math.PI) * U * 1.1; g.disc(tx, ty, g.s * (4.4 - i * 0.6), i ? C[0] : C[1]); } g.disc(x, y, g.s * 3, C[0]); g.dot(x - g.s * 2, y - g.s * 2, C[2], 2, 1); for (let i = 0; i < 4; i++) g.dot(x - (i + 1) * g.s * 2 * (b.x > a.x ? 1 : -1), y + (i + 1) * g.s * 2, C[0]); }
    else { g.a(1 - fade); g.ell(b.x, gy, R3 * sp, R3 * 0.42 * sp, C[0]); for (let i = 0; i < 12; i++) { const an = i * 0.524 + hsh(i, 3) * 0.3, r = R3 * sp * (0.82 + hsh(i, 5) * 0.4); g.ell(b.x + cos(an) * r, gy + sin(an) * r * 0.42, U * (0.12 + hsh(i, 7) * 0.16) * sp, U * (0.06 + hsh(i, 7) * 0.07) * sp, C[0]); } g.ell(b.x - R3 * 0.2 * sp, gy - R3 * 0.08 * sp, R3 * 0.5 * sp, R3 * 0.14 * sp, C[1]); g.dot(b.x - R3 * 0.4 * sp, gy - R3 * 0.12 * sp, C[2], 3, 1);
      const up = seg(t, 0.4, 0.75); if (up < 1) for (let i = 0; i < 12; i++) { const an = -Math.PI * hsh(i, 9), r = U * (0.4 + hsh(i, 11) * 1.1) * ease(up); g.a(1 - up); g.sq(b.x + cos(an) * r, b.y + sin(an) * r - sin(up * Math.PI) * U * 0.4 + up * up * U * 0.5, i % 4 ? C[0] : C[1], i % 3 ? 2 : 1); }
      // 침묵: 얼룩 위에 지워진 문양
      g.a((1 - fade) * seg(t, 0.55, 0.7)); for (let i = 0; i < 3; i++) { const x = b.x + (i - 1) * U * 0.9, y = b.y - U * 0.5 - (i % 2) * U * 0.2; glyph(g, x, y, i + 2, '#8fe8d8'); g.line(x - g.s * 3, y + g.s * 2, x + g.s * 3, y - g.s * 2, C[0], 1); } }
    g.a(1); };
  // 거둠: 그림자가 스치고, 두 낫이 엇갈려 긋는다. 처형이면 가슴의 이빨이 닫힌다
  FX.reap = (g, a, b, t, o) => { const U = o.size, run = seg(t, 0, 0.3), cut = seg(t, 0.28, 0.5), fade = seg(t, 0.75, 1), kill = o.kill;
    if (t < 0.36) { const d = Math.hypot(b.x - a.x, b.y - a.y) || 1; for (let i = 0; i < 10; i++) { const f = clamp(run - i * 0.05, 0, 1), x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f); g.a((1 - i / 10) * 0.7); for (let j = -3; j <= 3; j++) if ((i + j) % 2 === 0) g.dot(x - (b.y - a.y) / d * j * g.s * 2, y + (b.x - a.x) / d * j * g.s * 2 - U * 0.2, i < 2 ? '#e0d4a8' : '#6a121c', 2, 2); } g.a(1); }
    if (t >= 0.28) { g.a(1 - fade); for (const dir of [-1, 1]) { const n = 16, k = ease(cut); for (let i = 0; i <= n * k; i++) { const f = i / n, an = (dir < 0 ? -2.5 : -0.64) + dir * f * 2.1, r = U * 0.62, x = b.x + cos(an) * r * (dir < 0 ? 1 : 1), y = b.y - U * 0.05 + sin(an) * r * 0.9, w = Math.round(1 + 3 * sin(f * Math.PI)); g.sq(x + dir * g.s, y + g.s, '#8a1a26', w + 1); g.sq(x, y, t < 0.56 ? '#ffffff' : '#fff8dc', w); } }
      if (cut > 0.5 && t < 0.7) rays(g, b.x, b.y, U * 0.1, 8, '#ffffff', 0.4, U * 0.3 * (1 - seg(t, 0.5, 0.7)));
      for (let i = 0; i < 9; i++) { const an = hsh(i, 3) * TAU, p = seg(t, 0.45, 0.9), r = U * (0.2 + hsh(i, 5) * 0.6) * p; g.sq(b.x + cos(an) * r, b.y + sin(an) * r * 0.7 + p * p * U * 0.4, i % 3 ? '#b02a34' : '#f08a7a', i % 2 ? 2 : 1); }
      if (kill) { const cl = seg(t, 0.52, 0.66); g.a((1 - fade)); jaws(g, b.x, b.y, U * 0.86, 1 - cl, ['#1b1408', '#a89a68', '#e0d4a8', '#6e6240']); if (cl >= 1 && t < 0.8) { g.add(true).a(0.6 * (1 - seg(t, 0.66, 0.8))).disc(b.x, b.y, U * 0.5, '#ff5040').add(false); } }
      g.a(1); } };
  // 부름: 촛불 원이 켜지고 바닥에서 두건 쓴 것이 올라온다
  FX.sermon = (g, a, b, t, o) => { const U = o.size, list = o.targets || [[b.x, b.y]], fade = seg(t, 0.82, 1);
    if (t < 0.5) { g.a(0.9 * (1 - t * 2)); for (let i = 0; i < 6; i++) { const f = (i / 6 + t * 1.5) % 1; glyph(g, a.x + sin(i * 2.1) * U * 0.3, a.y - U * 0.6 - f * U * 0.9, i, i % 2 ? '#f0a04a' : '#d8c8b8'); } g.a(1); }
    list.forEach(([x, y], n) => { const lt = seg(t, 0.1 + n * 0.08, 0.72 + n * 0.08), k = ease(lt), gy = y + U * 0.32, h = U * 0.78 * k; g.a(1 - fade); g.ell(x, gy, U * 0.44, U * 0.14, '#140a12').ell(x, gy, U * 0.38, U * 0.11, '#2a1830'); g.ring(x, gy, U * 0.42, U * 0.13, '#f0a04a', 1, f => Math.floor(f * 12 + t * 6) % 2 === 0);
      for (let i = 0; i < 5; i++) { const an = i * 1.257 + 0.5, cx = x + cos(an) * U * 0.42, cy = gy + sin(an) * U * 0.13; g.dot(cx, cy - g.s * 2, '#e8dcc0', 1, 2); if (lt > 0.05) { g.dot(cx, cy - g.s * 4, Math.floor(t * 20 + i) % 2 ? '#ffd070' : '#f0a04a', 1, 2); g.dot(cx, cy - g.s * 3, '#fff3c0'); } }
      if (h > g.s * 2) { const body = e => [[x - U * 0.17 - e, gy], [x - U * 0.19 - e, gy - h * 0.62], [x - U * 0.1, gy - h * 0.94], [x + U * 0.02, gy - h - e], [x + U * 0.13, gy - h * 0.9], [x + U * 0.19 + e, gy - h * 0.6], [x + U * 0.17 + e, gy]]; g.poly(body(g.s), '#140a12').poly(body(0), '#4a3048'); g.line(x - U * 0.12, gy - h * 0.3, x - U * 0.1, gy - h * 0.8, '#8a6a80', 1); g.ell(x + U * 0.02, gy - h * 0.74, U * 0.08, h * 0.13, '#07050c'); g.dot(x + U * 0.02, gy - h * 0.78, '#f0a04a', 1, 2); }
      for (let i = 0; i < 6; i++) { const f = (hsh(i, 4 + n) + t * 1.4) % 1; star(g, x + (hsh(i, 5) - 0.5) * U * 0.8, gy - f * U * 1.1, i % 3 ? '#f0a04a' : '#fff3c0', i % 4 === 0); } }); g.a(1); };
  // 하늘이 열린다: 판 위 하늘이 가로로 갈라지고, 안에서 큰 눈이 내려다본다. 화면이 잠깐 남색으로 물든다
  FX.rift = (g, a, b, t, o) => { const U = o.size, W = o.w || U * 6, cx = o.cx == null ? b.x : o.cx, cy = o.cy == null ? b.y - U * 1.6 : o.cy, op = ease(seg(t, 0.05, 0.34)) * (1 - ease(seg(t, 0.82, 1))), tint = sin(seg(t, 0, 1) * Math.PI), cv = g.ctx.canvas;
    g.a(0.42 * tint); g.ctx.fillStyle = '#120a3a'; g.ctx.fillRect(-4000, -4000, 8000 + cv.width, 8000 + cv.height); g.a(1);
    // 금이 먼저 간다
    if (t < 0.4) { const k = seg(t, 0, 0.14); for (let i = 0; i < 40 * k; i++) { const f = i / 40, x = cx - W / 2 + f * W, y = cy + sin(f * 23) * g.s * 2; g.dot(x, y, i % 3 ? '#cdbcff' : '#ffffff'); } }
    const rx = W * 0.5 * op, ry = U * 0.85 * op; if (ry > g.s) { const lens = (rxx, ryy, c) => { for (let j = -Math.floor(ryy / g.s); j <= Math.floor(ryy / g.s); j++) { const f = j * g.s / ryy, w = rxx * (1 - f * f); g.ctx.fillStyle = c; g.ctx.fillRect(Math.round((cx - w) / g.s) * g.s, Math.round((cy + j * g.s) / g.s) * g.s, Math.max(g.s, Math.round(w * 2 / g.s) * g.s), g.s); } };
      lens(rx + g.s * 3, ry + g.s * 3, '#120a26'); lens(rx + g.s, ry + g.s * 2, '#9a86d8'); lens(rx, ry, '#07050c'); lens(rx * 0.8, ry * 0.7, '#0e0828');
      for (let i = 0; i < 30; i++) { const x = cx + (hsh(i, 1) - 0.5) * rx * 1.7, y = cy + (hsh(i, 2) - 0.5) * ry * 1.4; if (Math.abs(y - cy) / ry < 1 - Math.pow((x - cx) / rx, 2)) star(g, x, y, i % 3 ? '#cdbcff' : '#ffffff', (i + Math.floor(t * 10)) % 7 === 0); }
      for (let k = 0; k < 14; k++) { const f = (k + 0.5) / 14 * 2 - 1, x = cx + f * rx, h = ry * (1 - f * f); g.line(x, cy - h - g.s, x + f * g.s * 3, cy - h - U * 0.18 * op, '#9a86d8', 1); g.line(x, cy + h + g.s, x + f * g.s * 3, cy + h + U * 0.12 * op, '#5a4698', 1); }
      // 내려다보는 눈
      const er = Math.min(ry * 0.86, U * 0.7) * ease(seg(t, 0.24, 0.42)); if (er > g.s * 2) { g.ell(cx, cy, er * 1.5, er, '#e4dcf2'); g.disc(cx, cy + g.s, er * 0.82, '#f0a04a'); g.ring(cx, cy + g.s, er * 0.82, er * 0.82, '#3a2580', 1); g.ell(cx, cy + g.s, Math.max(g.s, er * 0.18), er * 0.7, '#07050c'); g.dot(cx - er * 0.5, cy - er * 0.45, '#ffffff', 2, 2); } }
    // 빛이 모든 적에게 떨어진다
    if (t > 0.42 && t < 0.92) { const targets = o.targets || [[b.x, b.y]]; targets.forEach(([tx, ty], i) => { const p = seg(t, 0.42 + (i % 5) * 0.03, 0.54 + (i % 5) * 0.03), q2 = seg(t, 0.74, 0.92); if (p <= 0) return; const sx = cx + clamp(tx - cx, -rx * 0.7, rx * 0.7) * 0.3, x1 = lerp(sx, tx, p), y1 = lerp(cy, ty, p); g.a(1 - q2); g.line(sx, cy, x1, y1, '#6a4fc8', 3).line(sx, cy, x1, y1, Math.floor(t * 30) % 2 ? '#ffffff' : '#cdbcff', 1); if (p >= 1) { g.ring(tx, ty + U * 0.28, U * 0.34, U * 0.13, '#cdbcff', 1); rays(g, tx, ty, U * 0.12, 6, '#ffffff', t * 8 + i, U * 0.14); } }); g.a(1); } };
  // 다시 낳음: 알집이 갈라지고, 젖은 것이 미끄러져 나온다
  FX.rebirth = (g, a, b, t, o) => { const U = o.size, gy = b.y + U * 0.32, sw = ease(seg(t, 0, 0.3)), sp = ease(seg(t, 0.36, 0.6)), fade = seg(t, 0.8, 1), wob = t < 0.36 ? sin(t * 60) * g.s * 1.5 * sw : 0;
    // 여왕에게서 탯줄처럼 이어진 줄
    if (t < 0.6 && (a.x !== b.x || a.y !== b.y)) { g.a(0.8 * (1 - seg(t, 0.4, 0.6))); for (let i = 0; i <= 14; i++) { const f = i / 14 * ease(seg(t, 0, 0.2)), x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f) + sin(f * Math.PI) * U * 0.3; g.sq(x, y, i % 2 ? '#7a9a50' : '#c8e090', 2); } g.a(1); }
    g.a(1 - fade); g.ell(b.x, gy, U * 0.46 * (sw + sp * 0.4), U * 0.14 * (sw + sp * 0.4), '#3e5a2c'); g.ell(b.x - U * 0.1, gy - g.s, U * 0.2 * sw, U * 0.04 * sw, '#c8e090');
    if (t < 0.62) { const rx = U * 0.34 * sw, ry = U * 0.46 * sw, x = b.x + wob, y = gy - ry * 0.9, gap = sp * U * 0.3; if (rx > g.s * 2) for (const dir of [-1, 1]) { const ox = dir * gap; g.ell(x + ox, y, rx + g.s, ry + g.s, '#3a3010'); g.ell(x + ox, y, rx, ry, '#f0e088'); g.ell(x + ox - rx * 0.3, y - ry * 0.3, rx * 0.4, ry * 0.4, '#fffbd0'); g.ell(x + ox + rx * 0.14, y + ry * 0.16, rx * 0.5, ry * 0.5, '#6a6428'); } if (rx > g.s * 2 && sp > 0) { g.ell(x, y, gap, ry * 0.9, '#fffbd0'); g.ell(x, y + ry * 0.1, gap * 0.5, ry * 0.6, '#c8e090'); }
      if (sp <= 0 && sw > 0.6) { g.line(x, y - ry, x - g.s * 2, y - ry * 0.3, '#3a3010', 1).line(x - g.s * 2, y - ry * 0.3, x + g.s, y + ry * 0.3, '#3a3010', 1); g.dot(x + rx * 0.2, y, '#ff5040', 2, 2); } }
    if (t >= 0.4) { const p = seg(t, 0.4, 0.8); g.add(true).a(0.7 * (1 - p)).disc(b.x, b.y, U * 0.6 * (0.4 + p), '#e8ff7a').add(false); g.a(1 - fade); rays(g, b.x, b.y, U * 0.2 + p * U * 0.3, 10, '#fffbd0', 0.3, U * 0.2 * (1 - p), 1); for (let i = 0; i < 12; i++) { const an = -Math.PI * hsh(i, 3), r = U * (0.3 + hsh(i, 5) * 0.7) * ease(p); g.sq(b.x + cos(an) * r, gy + sin(an) * r * 0.8 + p * p * U * 0.3, i % 3 ? '#f0e088' : '#c8e090', i % 2 ? 2 : 1); }
      for (let i = 0; i < 5; i++) { const x = b.x + (i - 2) * U * 0.14; g.line(x, b.y - U * 0.3, x, b.y - U * 0.3 + U * 0.5 * seg(t, 0.5 + i * 0.03, 0.9), '#c8e090', 1); } }
    g.a(1); };
  // ── ART-KIN2 끝
  const prewarm = (list, star, anims) => { for (const id of list) { const bf = typeof id === 'string' && id.indexOf('boss:') === 0 ? id.slice(5).split(':') : null, h = bf ? boss(bf[0], bf[1] === undefined ? undefined : +bf[1]) : BOSS[id] && !DEF[id] ? boss(id) : unit(id, star || 1); if (h) for (const an of anims || ['idle', 'attack']) for (let k = 0; k < ANIM[an].n; k++) h.frame(an, k * ANIM[an].dur / ANIM[an].n + 1); } };
  // ── ART-INV2 시작
  // 2·3막의 침입자 일곱, 이름 있는 조사자 여섯(다친 모습·홀린 모습), 사람 꼴로 불려 나오는 것 셋, 연출 일곱.
  // 사람의 틀(human)에 옷과 연장을 갈아 끼우는 방식은 1막의 침입자와 같다.
  const partOf = (R, n) => R.parts.find(q => q.name === n);
  const poseAdd = (R, fn) => { const prev = R.pose; R.pose = (anim, f, G, T, fx, s) => { if (prev) prev(anim, f, G, T, fx, s); fn(anim, f, G, T, fx, s); }; };
  const CULTW = ['#2a2018', '#e8e0d0', '#ffffff', '#b0a490'], CULTR = '#a8242c';
  // 교단의 표식: 감은 눈 (아래로 처진 눈꺼풀과 속눈썹 셋)
  const shutEye = (D, x, y, c) => { flatL(D, [[x - 2.4, y - 0.6], [x - 1, y + 0.6], [x + 1, y + 0.6], [x + 2.4, y - 0.6]], c, 0.5); D.px(x - 1.6, y + 1.6, c); D.px(x, y + 2, c); D.px(x + 1.6, y + 1.6, c); };
  // 석궁병: 한쪽 무릎을 꿇고 쏜다. 큰 석궁, 등에 세워 메는 큰 방패
  DEF.crossbow = { side: 'inv', build(R) {
    const gam = ['#2a1410', '#9a5a3a', '#c88a5a', '#6a3a26'], bot = P.brown, boot = P.leather;
    human(R, { top: gam, bot, boot, strike: 0.1,
      torso: D => { for (let x = 21.4; x < 28; x += 2.4) D.rect(x, 26.4, 0.6, 8, gam[3]); D.rect(19.8, 34.4, 8.6, 1.4, P.leather[1]); D.G([[19.6, 33.6], [22.6, 34], [22, 39.6], [19.4, 39]], P.leather); for (let k = 0; k < 3; k++) { D.rect(19.8 + k * 0.9, 31.6, 0.6, 2.4, P.wood[2]); D.px(19.8 + k * 0.9, 31.2, P.steel[2]); } },
      backItem: D => { D.G([[12.4, 19.6], [19.6, 18.6], [20.6, 38.4], [13.4, 39.4]], P.wood); D.G([[13.2, 20.6], [19, 19.8], [19.2, 23.4], [13.4, 24.2]], P.red); D.rect(13.6, 30, 6.2, 0.9, P.steel[1]); D.rect(13.8, 36.4, 6.2, 0.9, P.steel[1]); D.px(14.2, 21.4, '#ffffff'); D.px(16.4, 27, P.wood[3]); D.px(17.6, 33.6, P.wood[3]); },
      hat: D => { D.G([[20, 15.8], [21.4, 11.6], [28.2, 11.4], [30, 15.6]], P.steel); D.G([[16, 17.2], [17.2, 15.4], [32.8, 15.2], [34, 17]], P.steel); D.px(22.6, 12.8, '#ffffff'); D.px(23.6, 12.8, '#ffffff'); },
      back: D => { armTo(D, 21, 27, 30.6, 30.4, dkp(gam)); hand(D, 31.6, 30.6, P.skin2); },
      frontMorph: true,
      front: (D, h, m) => { const sx = lerp(33.4, 39.4, m);
        D.L([[23.6, 30.6], [41, 29.2]], 1.2, 0.9, P.wood); D.rect(41.2, 27.6, 1.6, 3, P.steel[3]); D.rect(26, 31.4, 1, 2, P.steel[1]);
        D.L([[39.6, 20.4], [41.6, 24.6], [41.6, 33.4], [39.6, 37.6]], 1.2, 0.7, P.steel); D.px(40.2, 21.6, '#ffffff');
        flatL(D, [[39.6, 20.4], [sx, 29.2], [39.6, 37.6]], '#e8e0d0', 0.5);
        if (m < 0.5) { D.L([[sx, 28.8], [sx + 8.6, 28.2]], 0.7, 0.6, P.wood); D.G([[sx + 8, 27], [sx + 11.4, 28.2], [sx + 8, 29.6]], P.steel); D.px(sx + 0.6, 27.6, P.red[2]); D.px(sx + 0.6, 30, P.red[2]); }
        armTo(D, 27.5, 27, 27.4, 30.4, gam); hand(D, 27.6, 31.2); } });
    const lb = partOf(R, 'legB'), lf = partOf(R, 'legF'), dk = dkp(bot);
    lb.amp = 0.3; lb.draw = D => { D.L([[22, 38.4], [19.4, 43.6]], 2.1, 1.8, dk); D.L([[19.4, 43.8], [14.6, 44]], 1.7, 1.5, dk); D.G([[11.4, 45], [12, 42.4], [15.4, 42.6], [15.4, 45]], dkp(boot)); };
    lf.amp = 0.3; lf.draw = D => { D.L([[26, 38.6], [31, 39.4]], 2.2, 2, bot); D.L([[31, 39.6], [30.8, 42.6]], 1.9, 1.7, bot); D.G([[28.8, 45], [29.2, 42], [32.6, 42], [34.6, 45]], boot); };
    R.shw = 12;
    poseAdd(R, (anim, f, G, T, fx, s) => { T.torso.dy += 3.4 * s.u; if (anim === 'move') G.dy *= 0.5; if (anim !== 'attack') return; T.armF.m = Math.round(s.rec * 4) / 4; T.armB.dx -= 3.4 * s.u * s.chg; T.head.rot += 0.07 * s.chg; });
  } };
  // 기수: 교단의 긴 깃발. 깃발에는 감은 눈
  DEF.banner = { side: 'inv', build(R) {
    human(R, { top: P.steel, bot: P.red, boot: P.leather, strike: 0.3, cast: -0.3,
      torso: D => { D.G([[20.8, 25.4], [27.8, 25.4], [28.2, 38.6], [20.4, 38.6]], CULTW); D.rect(20.8, 25.4, 7.2, 1.2, P.red[1]); shutEye(D, 24.4, 29.4, CULTR); D.rect(19.6, 34.2, 9.4, 1.3, P.leather[1]); D.px(24.2, 34.6, P.gold[1]); D.rect(20.6, 37.6, 7.6, 1, P.gold[1]); },
      hat: D => { D.G([[19.4, 16.6], [20.4, 12.2], [24.6, 10.6], [29, 12], [30.4, 16.4]], P.steel); D.rect(19.6, 15.6, 10.8, 1.1, P.gold[1]); D.rect(26.6, 16.4, 1, 3.6, P.steel[1]); D.px(21.6, 12.8, '#ffffff'); D.G([[19.2, 16.6], [21.6, 16.6], [21.8, 22.6], [19.6, 22]], P.steel); },
      back: D => { armTo(D, 21, 27, 31, 32.6, dkp(P.steel)); hand(D, 32, 33, P.skin2); },
      front: D => { D.L([[32.4, 45], [33.2, -1]], 1, 0.9, P.wood); D.G([[32, -1], [33.4, -5.6], [34.6, -1]], P.gold); D.rect(32.4, 2.4, 13, 1.2, P.wood[1]); D.px(45.6, 2.6, P.gold[1]); D.px(31.8, 2.6, P.gold[1]); armTo(D, 27.5, 27, 32.4, 25.6, P.steel); hand(D, 33, 25.2); },
      extra: R => {
        R.part('flag', { px: 39.6, py: 3.6, z: 8, role: 'sway', amp: 0.55, ph: 0.6, parent: 'armF' }, D => { D.G([[34.4, 3.6], [45, 3.6], [45, 20.6], [42.4, 17.6], [39.7, 21.6], [37, 17.6], [34.4, 20.6]], CULTW); D.rect(34.6, 3.8, 10.2, 2, P.red[1]); D.rect(34.6, 6, 10.2, 0.6, P.gold[1]); shutEye(D, 39.7, 10.8, CULTR); D.px(39.7, 14.6, P.gold[1]); for (const x of [35.4, 37.4, 39.6, 41.8, 43.8]) D.px(x, 16.4 + (Math.abs(x - 39.6) < 3 ? 1.6 : 0), P.gold[1]); });
        R.part('plume', { px: 24.6, py: 10.8, z: 7, role: 'sway', amp: 1.1, parent: 'head' }, D => { D.L([[24.6, 10.8], [22.6, 7], [19, 6.4]], 1.4, 0.6, P.red); D.px(21, 6.2, P.red[2]); });
      } });
    R.glow = '#ffe060'; R.shw = 10;
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim !== 'cast') return; const up = f < 0.42 ? ease(f / 0.42) : Math.max(0, 1 - (f - 0.42) / 0.08); T.armF.dy -= 4.6 * s.u * up; T.flag.rot += 0.3 * s.rise * sin(f * 20); if (f > 0.5 && f < 0.62) G.dy += 1 * s.u; });
  } };
  // 추적자: 두건과 털 두른 망토, 쇠갈고리와 분필
  DEF.tracker = { side: 'inv', build(R) {
    const hd = ['#1a140c', '#6e5c38', '#a08c58', '#443820'], fur = ['#1c1008', '#a88860', '#d8c090', '#6e5032'], sc = ['#101410', '#4e5e48', '#7c8c6c', '#2e3a2c'];
    human(R, { top: P.leather, bot: P.brown, crouch: true, strike: 1, backStrike: 0.4, cloak: hd,
      torso: (D, h) => { D.B(24, 26.2 + h, 6, 2, fur); for (const x of [19.4, 21.6, 24, 26.4, 28.6]) D.px(x, 28.2 + h, fur[3]); flatL(D, [[20, 29 + h], [28.4, 33.6]], P.tan[1], 0.6); D.rect(19.8, 34.4, 8.6, 1.2, P.brown[3]); D.B(21.6, 36.4, 2.2, 2.2, P.tan); D.px(21.6, 36.4, P.tan[3]); D.px(27, 34.8, P.steel[2]); },
      face: (D, h) => { D.rect(24.2, 17.8 + h, 1.2, 1.2, '#ffffff'); D.rect(27.4, 17.8 + h, 1.2, 1.2, '#ffffff'); D.px(24.8, 18 + h, INK); D.px(28, 18 + h, INK); D.G([[21, 20.4 + h], [30, 20.4 + h], [29.4, 24.2 + h], [21.6, 24.2 + h]], sc); },
      hat: (D, h) => { D.G([[19, 20.6 + h], [19.2, 14.4 + h], [22.6, 11.6 + h], [28.4, 12 + h], [30.8, 16.4 + h], [25, 15.4 + h], [22.6, 17.2 + h], [22.4, 21 + h]], hd); D.L([[19.6, 14 + h], [15.6, 13.2 + h], [13.4, 16 + h]], 1.5, 0.6, hd); for (const [x, y] of [[23.4, 16.2], [25.6, 15.4], [27.8, 15.6], [29.8, 16.4]]) D.px(x, y + h, fur[2]); },
      back: (D, h) => { armTo(D, 21, 27 + h, 17.2, 32 + h, dkp(P.leather)); hand(D, 16.8, 32.6 + h, P.skin2); D.rect(13.6, 32 + h, 3, 1.2, '#ffffff'); D.px(13.2, 32.4 + h, '#d8d0c0'); },
      front: (D, h) => { armTo(D, 27.5, 27 + h, 33, 29.4 + h, P.leather); D.L([[33, 32 + h], [36.4, 21.6 + h]], 0.9, 0.8, P.wood); D.L([[36.4, 21.6 + h], [38, 17.4 + h], [41.6, 17 + h], [43.4, 20.4 + h], [42, 23.6 + h]], 1.1, 0.5, P.steel); D.px(42, 24.4 + h, '#ffffff'); D.px(38.6, 17 + h, '#ffffff'); flatL(D, [[33.2, 31.4 + h], [31, 35 + h], [32.6, 38.4 + h]], P.tan[1], 0.5); hand(D, 33.6, 29.4 + h); } });
    R.shw = 10;
  } };
  // 성전사: 방패 없이 두 손으로 쥔 망치. 갑옷 위에 흰 겉옷
  DEF.templar = { side: 'inv', build(R) {
    human(R, { top: P.steel, bot: P.steel, boot: P.steel, build: 1.2, strike: 1.15, backStrike: 1.05, cloak: CULTW,
      torso: D => { D.G([[20.2, 25.6], [28.6, 25.6], [29.8, 41.4], [27, 40.2], [24.6, 42], [22, 40.2], [19.4, 41.4]], CULTW); D.G([[24.4, 27.2], [26.6, 30.4], [24.4, 33.2], [22.4, 30.4]], P.red); D.px(24.4, 30.2, P.gold[2]); D.rect(19.2, 34.4, 10.4, 1.3, P.leather[1]); D.px(24.2, 34.8, P.gold[1]); D.B(19, 26.2, 2.8, 2.3, P.steel); D.B(30, 26.2, 2.8, 2.3, P.steel); },
      face: () => {},
      hat: D => { D.G([[19.4, 23.4], [19.4, 13], [20.6, 11.8], [29.8, 11.8], [30.8, 13], [30.8, 23.4]], P.steel); D.rect(19.6, 11.8, 11, 1.1, P.gold[1]); D.rect(23.4, 17, 7.2, 1.3, INK); D.rect(26.4, 13, 1.2, 10.2, P.gold[1]); for (const y of [20, 21.6]) { D.px(24.4, y, INK); D.px(28.8, y, INK); } D.px(21, 14, '#ffffff'); D.px(21, 15, '#ffffff'); },
      back: D => { armTo(D, 20.4, 27, 27.4, 31.6, dkp(P.steel)); hand(D, 28, 32.2, P.steel); },
      front: D => { D.L([[24.4, 36], [38.6, 12.6]], 1.1, 1, P.wood); D.G([[32.4, 3.6], [46, 9.8], [42.8, 18.4], [29.2, 12.2]], P.steel); flatL(D, [[35.6, 5.6], [32.6, 13.6]], P.gold[1], 0.7); flatL(D, [[42.6, 8.8], [39.6, 16.8]], P.gold[1], 0.7); D.px(34.4, 5.8, '#ffffff'); D.px(37.6, 7.4, '#ffffff'); D.px(38.6, 7.8, '#ffffff'); armTo(D, 28, 27, 31.8, 24.2, P.steel); hand(D, 32.4, 23.4, P.steel); } });
    R.glow = '#fff3a0'; R.shw = 11;
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim === 'cast') { T.armF.rot -= 0.9 * s.rise; T.armB.rot -= 0.7 * s.rise; } });
  } };
  // 구마사: 입 없는 탈을 쓴 사제. 쇠사슬에 단 향로를 돌린다
  DEF.exorcist = { side: 'inv', build(R) {
    const rb = ['#140a10', '#5e2c36', '#904c52', '#361620'], mk = ['#2a2018', '#e8dcc0', '#fffaf0', '#b0a080'];
    human(R, { top: rb, robe: rb, strike: 0.3, cast: -0.5,
      torso: D => { D.G([[18.4, 25], [29.8, 25], [30.8, 29.4], [24.2, 31.8], [17.6, 29.4]], CULTW); D.rect(18.8, 28.6, 11, 0.6, P.gold[1]); D.rect(23.6, 31.4, 1.4, 12, P.gold[1]); D.rect(19.6, 33.4, 9.4, 1, '#8a6a3a'); for (const [x, y] of [[20.4, 34.4], [26.8, 34.4]]) { D.rect(x, y, 1.8, 4.6, '#f2ecd8'); D.px(x + 0.4, y + 1.2, CULTR); D.px(x + 0.9, y + 2.6, CULTR); D.px(x + 0.4, y + 3.6, CULTR); } },
      face: D => { D.B(25.4, 18.8, 4.2, 4.8, mk); D.rect(23.8, 18, 1.8, 0.9, INK); D.rect(27.4, 18, 1.8, 0.9, INK); D.rect(25.9, 14.8, 1, 2.2, P.gold[1]); D.px(24.6, 16, P.gold[1]); D.px(27.6, 16, P.gold[1]); flatL(D, [[26.4, 20.6], [26.4, 23]], mk[3], 0.4); },
      hat: D => { D.G([[18.8, 24.4], [18.8, 14], [22, 10.8], [27.8, 10.6], [31, 13.6], [31.2, 17.6], [28.8, 13.6], [23.6, 13.6], [21.4, 16.6], [21.4, 24.4]], rb); D.px(21, 13, rb[2]); },
      back: D => { armTo(D, 21, 27, 19.4, 32, dkp(rb)); D.B(19.4, 35, 1.7, 2, P.gold); D.px(19.4, 37.4, P.gold[3]); D.rect(19, 32.6, 0.9, 1, P.gold[3]); },
      front: D => { armTo(D, 27.5, 27, 33, 24.4, rb); hand(D, 33.8, 24); },
      extra: R => {
        R.part('censer', { px: 34, py: 24.4, z: 9, role: 'sway', amp: 3, parent: 'armF' }, D => { for (let y = 25.4; y < 35.4; y += 1) D.px(34 + (Math.round(y) % 2 ? 0 : 0.6), y, Math.round(y) % 2 ? P.steel[2] : P.steel[3]); D.B(34.2, 38.4, 3, 2.8, P.gold); D.G([[32.6, 35.8], [34.2, 33.6], [35.8, 35.8]], P.gold); D.rect(32.2, 38, 4.2, 0.7, P.gold[3]); D.px(33.2, 39.4, '#ff8a2a'); D.px(35, 39.4, '#ff8a2a'); D.px(34.2, 37, '#fff3c0'); });
        for (let k = 0; k < 3; k++) R.part('smoke' + k, { px: 34, py: 34, z: 0, role: 'float', ph: k * 2.2, amp: 2.2 }, D => { D.flat(D.el(37 + k * 2.6, 33 - k * 6.4, 2 - k * 0.4, 1.5 - k * 0.3), '#e8e0d088'); });
      } });
    R.glow = '#ffe060'; R.shw = 10;
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim === 'cast') { T.censer.rot += f * TAU * 2; T.armF.rot -= 0.5 * s.rise; fx.glow = Math.max(fx.glow, 0.5 * s.rise); } if (anim === 'attack') { T.censer.rot += 1.2 * s.chg - 1.4 * s.rec; for (let k = 0; k < 3; k++) { T['smoke' + k].dy -= 3 * s.u * s.chg; T['smoke' + k].sx *= 1 + 0.7 * s.chg; T['smoke' + k].sy *= 1 + 0.7 * s.chg; } } });
  } };
  // 연금술사: 등짐 가득한 유리병, 긴 집게 장갑, 고글
  DEF.alchemist = { side: 'inv', build(R) {
    const ap = ['#221408', '#8e6c40', '#bc9862', '#5a4426'], gv = ['#140c0a', '#5e3c28', '#8e6444', '#34221a'], sh = ['#101c10', '#5c7248', '#8c9c68', '#36462c'], gls = '#c8f0e0', BOT = ['#58d040', '#f0a030', '#6ab8ff', '#e06050', '#d8e060', '#b070e0'];
    const bottle = (D, x, y, c) => { D.rect(x - 0.4, y - 3, 1, 1.6, gls); D.flat(D.el(x, y, 1.6, 1.9), gls, '#1a2a1a'); D.flat(D.cut(D.el(x, y, 1.2, 1.5), (px, py) => py > y - 0.5), c); D.px(x - 0.7, y - 0.8, '#ffffff'); };
    human(R, { top: sh, bot: P.brown, strike: 0.25, cast: -0.7,
      torso: D => { D.G([[20.8, 26.4], [27.8, 26.4], [28.8, 40.6], [20, 40.6]], ap); flatL(D, [[21.4, 26.4], [22.6, 24.8]], ap[3], 0.5); flatL(D, [[27.2, 26.4], [26.2, 24.8]], ap[3], 0.5); D.rect(19.8, 33.6, 9, 1, P.leather[1]); D.rect(24.8, 35.4, 2.8, 3, ap[3]); D.rect(25.4, 33.8, 0.8, 2, gls); D.px(25.4, 33.6, '#58d040'); D.rect(26.6, 34.2, 0.8, 1.6, P.steel[2]); D.px(22, 38, '#58d040'); D.px(22.8, 30, ap[3]); D.px(26.4, 29, '#3a2a1a'); },
      backItem: D => { D.G([[11.6, 19.4], [20.4, 18.8], [21.2, 37], [12.4, 37.6]], P.wood); for (const y of [24.6, 30.6]) D.rect(12.2, y, 8.6, 0.8, P.wood[3]); let k = 0; for (const y of [22, 28, 34]) for (const x of [14.2, 18]) bottle(D, x + (y === 28 ? 0.4 : 0), y, BOT[k++ % 6]); bottle(D, 14.6, 16.4, BOT[4]); D.rect(17.6, 12.6, 1.2, 4.4, gls); D.flat(D.el(18.2, 17.4, 1.9, 1.6), gls, '#1a2a1a'); D.px(18.2, 17.8, BOT[1]); D.px(18.2, 12, P.wood[1]); },
      face: D => { D.rect(19.8, 17.6, 3.4, 1, P.leather[1]); D.flat(D.el(24.5, 18.2, 1.9, 1.9), '#7ad0c0', '#3a2a10'); D.flat(D.el(28.5, 18.2, 1.7, 1.9), '#7ad0c0', '#3a2a10'); D.px(23.8, 17.4, '#ffffff'); D.px(28, 17.4, '#ffffff'); D.px(26.5, 18.2, P.gold[1]); D.rect(25.6, 21.8, 2.6, 0.7, P.skin[3]); D.px(23, 21, '#5a4a40'); D.px(29, 20.6, '#5a4a40'); },
      hat: D => { D.G([[19.6, 15.8], [20.6, 12.2], [24.8, 10.8], [29, 12.2], [30.2, 15.6]], P.leather); D.rect(19.8, 14.8, 10.2, 1, P.leather[2]); D.L([[20.2, 16], [18.2, 14.2]], 0.9, 0.4, P.hairG); D.L([[20, 17.6], [17.6, 17.4]], 0.9, 0.4, P.hairG); D.L([[20.6, 19.4], [18.4, 20.6]], 0.8, 0.4, P.hairG); },
      back: D => { armTo(D, 21, 27, 19.2, 31.4, dkp(sh)); D.L([[19.2, 31.2], [19.6, 35.6]], 1.8, 1.5, dkp(gv)); flatL(D, [[19.2, 36.4], [17.8, 42.4]], P.steel[1], 0.5); flatL(D, [[20, 36.4], [20.4, 42.4]], P.steel[3], 0.5); D.px(19, 43, P.steel[2]); },
      front: D => { armTo(D, 27.5, 27, 31.6, 26.4, sh); D.L([[30.4, 26.8], [34.2, 25]], 2, 1.7, gv); D.px(30.2, 25.4, gv[2]); },
      extra: R => R.part('flask', { px: 35.6, py: 23.6, z: 9, role: 'pulse', amp: 0.7, sp: 2, parent: 'armF' }, D => { D.rect(35, 17.4, 1.4, 3.6, gls); D.rect(34.6, 16.6, 2.2, 1, P.wood[1]); D.flat(D.el(35.6, 23.6, 3.1, 3.1), gls, '#1a2a1a'); D.flat(D.cut(D.el(35.6, 23.6, 2.5, 2.5), (x, y) => y > 23.2), '#58d040'); D.rect(33.4, 23, 4.6, 0.6, '#b8f070'); D.px(34.2, 21.8, '#ffffff'); D.px(36.4, 24.8, '#d8ffb0'); D.px(35, 25.4, '#d8ffb0'); }) });
    R.glow = '#8af060'; R.shw = 11;
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim === 'attack' && s.rec > 0.12) { T.flask.sx = 0.04; T.flask.sy = 0.04; } if (anim === 'attack') fx.glow = Math.max(fx.glow, 0.3 * s.chg); });
  } };
  // 책을 쫓는 자 (3막): 1막의 그 사람. 책이 가슴에 박혀 펼쳐졌고, 눈은 글자로 덮였고, 발이 땅에 닿지 않는다
  DEF.seekerm = { side: 'inv', size: () => 64, build(R) {
    const coat = ['#0e0c10', '#4c403a', '#7a6a58', '#2c2422'], sk = ['#16141c', '#a8a4b0', '#d0ccd8', '#6a6678'], ink = '#1a1030', vi = '#c8a8ff', hatP = ['#0e0c10', '#3a3028', '#5a4c3c', '#221c16'], bk = ['#12081c', '#3a2060', '#6a4a9a', '#22103a'];
    human(R, { top: coat, bot: ['#0e0c10', '#2e2828', '#4a4040', '#1c1818'], boot: P.leather, cloak: coat, skin: sk, strike: 0.3, cast: -0.9,
      torso: D => { D.G([[19.4, 33], [28.8, 33], [30.8, 42], [28.2, 40], [26.2, 43], [24, 40.4], [21.6, 42.8], [19.6, 40], [17.4, 42]], coat); D.rect(23.6, 36, 1, 5, coat[3]); D.G([[20.6, 24.4], [28.4, 24.4], [27.4, 26.6], [21.6, 26.6]], ['#2a080c', '#6e2a30', '#a05a58', '#44161c']);
        for (const [a, b, c] of [[[18.6, 27.6], [20.4, 25.6], 0], [[30.4, 28], [28.8, 26], 0], [[19, 36], [20.6, 39], [19.6, 41.6]], [[29.6, 36.4], [28.4, 39.6], [29.4, 42]], [[24.6, 35.6], [24.2, 38.6], [25, 41.6]]]) flatL(D, c ? [a, b, c] : [a, b], ink, 0.5); },
      face: D => { let k = 0; for (let x = 22.6; x < 30; x += 1.3) { D.rect(x, 17 + (k % 2) * 0.5, 0.8, 2.6 - (k % 3) * 0.6, ink); k++; } D.px(24.6, 18.2, vi); D.px(28, 18.4, vi); flatL(D, [[24.2, 19.6], [23.6, 22.6]], ink, 0.4); flatL(D, [[28.6, 19.6], [29.2, 22]], ink, 0.4); D.rect(25.4, 21.6, 2.6, 1.3, VOID); D.px(26.6, 22, vi); D.G([[22.6, 22.8], [29, 22.8], [28, 24.6], [23.6, 24.6]], ['#16141c', '#5a5660', '#8a8690', '#38343e']); },
      hat: D => { D.G([[20.4, 14.4], [21, 9], [28.6, 9], [29.2, 14.4]], hatP); D.G([[15, 15.8], [16.6, 13.8], [33, 13.8], [34.6, 15.8]], hatP); D.rect(21, 12.4, 8, 1.2, '#6e2a30'); D.px(29, 9.6, hatP[0]); D.px(28, 9, hatP[0]); },
      back: D => { armTo(D, 21, 27, 15.6, 30.4, dkp(coat)); hand(D, 14.8, 30.8, sk); for (const k of [-1, 0, 1]) flatL(D, [[14.2, 30.8], [12, 30.4 + k * 1.5]], sk[1], 0.4); D.px(11.6, 30.4, ink); },
      front: D => { armTo(D, 27.5, 27, 34.4, 30, coat); hand(D, 35.2, 30.4, sk); for (const k of [-1, 0, 1]) flatL(D, [[35.8, 30.4], [38.2, 30.2 + k * 1.5]], sk[1], 0.4); D.px(38.6, 30.2, ink); },
      extra: R => {
        R.part('book', { px: 24.8, py: 31, z: 7.4, role: 'pulse', amp: 0.3, parent: 'torso' }, D => {
          D.G([[16.4, 25.8], [33, 25.8], [33.6, 35.6], [16, 35.6]], bk); D.flat(D.poly([[17.4, 26.8], [24.5, 28.2], [24.5, 34.8], [17, 34.2]]), '#f2ecd8'); D.flat(D.poly([[25, 28.2], [32, 26.8], [32.6, 34.2], [25, 34.8]]), '#d8d0b8');
          for (let k = 0; k < 4; k++) { D.rect(18.2, 28.6 + k * 1.4, 5 - (k % 2), 0.5, '#5a5060'); D.rect(26, 28.8 + k * 1.4, 5.4 - ((k + 1) % 2) * 1.6, 0.5, '#5a5060'); }
          D.flat(D.el(24.8, 31.2, 1.6, 2), vi, INK); D.rect(24.6, 30, 0.7, 2.6, INK);
          for (const [a, b] of [[[16.6, 26.4], [14, 23.6]], [[33, 26.4], [35.6, 23.8]], [[16.4, 35], [13.6, 37.6]], [[33.4, 35], [36, 37.8]], [[20, 35.6], [19, 38.6]], [[29.6, 35.6], [30.6, 38.4]]]) flatL(D, [a, b], ink, 0.5);
          for (const [x, y] of [[16.6, 30.6], [33, 31], [22, 25.8], [28, 25.8]]) D.px(x, y, sk[3]); });
        R.part('page', { px: 24.8, py: 31.4, z: 7.6, role: 'sway', amp: 3.4, sp: 2, parent: 'book' }, D => { D.flat(D.poly([[24.4, 28], [26.8, 24.4], [27.6, 31], [24.6, 34.6]]), '#fffaf0', '#5a5060'); D.px(25.6, 28.6, '#5a5060'); D.px(25.8, 30.4, '#5a5060'); });
        for (let k = 0; k < 5; k++) R.part('mote' + k, { px: 24.6, py: 26, z: k % 2 ? 9 : 0, role: 'orbit', ph: k * 1.26, amp: 3.2 + (k % 3) * 0.8, sp: 1 }, D => { const x = 24.6 + (k - 2) * 2, y = 8 + k * 7.4, c = k % 2 ? vi : '#f0e8ff'; D.rect(x, y, 0.8, 2, c); D.px(x + 1, y + (k % 3), c); D.px(x - 1, y + 1.6 - (k % 2), c); });
      } });
    const lb = partOf(R, 'legB'), lf = partOf(R, 'legF'), pb = ['#0e0c10', '#2e2828', '#4a4040', '#1c1818'];
    lb.draw = D => { D.L([[22, 36], [21.4, 41.4]], 1.8, 1.4, dkp(pb)); D.G([[20, 41], [22.8, 41], [22.4, 44], [20.8, 46.4]], dkp(P.leather)); };
    lf.draw = D => { D.L([[26, 36], [26.4, 41.4]], 1.9, 1.5, pb); D.G([[24.8, 41], [28, 41], [27.6, 44], [26, 46.6]], P.leather); };
    R.glow = vi; R.shw = 8;
    poseAdd(R, (anim, f, G, T, fx, s) => { const up = anim === 'die' ? 1 - s.ds : 1, bob = anim === 'idle' || anim === 'mad' ? sin(f * TAU) : anim === 'move' ? sin(f * TAU * 2) * 0.6 : 0;
      if (anim === 'move') { G.dy = 0; G.rot = 0.1; T.legF.rot = 0.12; T.legB.rot = 0.26; } else if (anim === 'idle' || anim === 'mad' || anim === 'cast') { T.legF.rot = 0.05 + 0.04 * sin(f * TAU); T.legB.rot = 0.1 + 0.05 * sin(f * TAU + 1); }
      G.dy -= (4.6 + bob) * s.u * up; if (anim === 'cast') { T.armB.rot += 0.7 * s.rise; T.book.sx *= 1 + 0.1 * s.rise; T.book.sy *= 1 + 0.1 * s.rise; T.page.rot += f * 9; } });
  } };
  // ---------- 홀림: 몸빛이 잿빛으로 죽고, 눈과 입에서 글자가 흘러나온다 ----------
  const ASHM = {};
  const ashC = c => { if (typeof c !== 'string' || (c.length !== 7 && c.length !== 9)) return c; if (ASHM[c]) return ASHM[c]; const v = parseInt(c.slice(1, 7), 16), l = Math.round((((v >> 16) & 255) * 3 + ((v >> 8) & 255) * 5 + (v & 255) * 2) / 10 * 0.88 + 10), h2 = x => Math.min(255, x).toString(16).padStart(2, '0'); return (ASHM[c] = mixh(c.slice(0, 7), '#' + h2(l) + h2(l) + h2(l + 8), 0.8) + c.slice(7)); };
  const ashP = p => (Array.isArray(p) ? p.slice(0, 5).map(ashC) : ashC(p)), ashO = oc => (oc == null ? oc : ashC(oc));
  const ashKit = D => Object.assign({}, D, { B: (cx, cy, rx, ry, p, oc) => D.B(cx, cy, rx, ry, ashP(p), ashO(oc)), L: (a, r0, rb, p, oc) => D.L(a, r0, rb, ashP(p), ashO(oc)), G: (a, p, oc) => D.G(a, ashP(p), ashO(oc)),
    ball: (m, cx, cy, rx, ry, p, oc) => D.ball(m, cx, cy, rx, ry, ashP(p), ashO(oc)), lit: (m, p, oc) => D.lit(m, ashP(p), ashO(oc)), flat: (m, c, oc) => D.flat(m, ashC(c), ashO(oc)), shade: (m, fn, oc) => D.shade(m, (x, y, a, b) => ashC(fn(x, y, a, b)), ashO(oc)),
    eye: (cx, cy, r, iris, slit, lid) => D.eye(cx, cy, r, ashC(iris), slit, lid), fangs: (x0, x1, y, dir, len, step, col) => D.fangs(x0, x1, y, dir, len, step, col ? ashC(col) : col), px: (x, y, c) => D.px(x, y, ashC(c)), dot: (x, y, c) => D.dot(x, y, ashC(c)), rect: (x, y, w, h, c) => D.rect(x, y, w, h, ashC(c)), spark: (x, y, c, on) => D.spark(x, y, ashC(c), on) });
  const GLV = '#c8a8ff', GLW = '#f0e8ff', GLI = '#1a1030';
  // 흘러내리는 글자: 입에서 턱으로, 가슴으로. 도는 움직임마다 아래로 흐른다
  const glyphStream = (R, hy, n) => { const at = [[26.8, 24.6], [28.6, 28], [26, 31.4], [29.2, 34.6], [30.6, 21.4]];
    for (let k = 0; k < (n || 4); k++) R.part('gs' + k, { px: at[k][0], py: at[k][1] + hy, z: 9.5, raw: true, parent: k === 4 ? 'head' : 'torso' }, D => { const x = at[k][0], y = at[k][1] + hy, c = k % 2 ? GLW : GLV; D.px(x, y - 1.2, GLI); D.rect(x, y, 0.8, 1.8, c); D.px(x + 1, y + (k % 3) * 0.7, c); D.px(x - 1, y + 1.4 - (k % 2), c); });
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim === 'die') return; const lp = anim === 'idle' || anim === 'mad' || anim === 'move' ? f : f * 0.6; for (let k = 0; k < (n || 4); k++) { const q = (lp * 2 + k * 0.37) % 1; T['gs' + k].dy += (q - 0.5) * 4.4 * s.u; T['gs' + k].dx += sin(q * TAU + k) * 0.6 * s.u; } }); };
  const possFace = (D, h) => { D.rect(23.6, 17.2 + h, 2.2, 2.4, VOID); D.px(24.6, 18.2 + h, GLV); D.rect(26.8, 17.2 + h, 2.2, 2.4, VOID); D.px(27.8, 18.4 + h, GLW); flatL(D, [[24.4, 19.8 + h], [23.8, 22.6 + h]], GLI, 0.4); flatL(D, [[28.2, 19.8 + h], [28.8, 22 + h]], GLI, 0.4); D.rect(24.8, 20.8 + h, 3.6, 2.6, VOID); D.px(25.6, 21.6 + h, GLV); D.px(27.4, 22.4 + h, GLW); };
  const possessify = (R, hy) => { for (const p of R.parts) if (!p.raw) { const d = p.draw; p.draw = (D, m) => d(ashKit(D), m); }
    R.part('pface', { px: 24.5, py: 23.5 + hy, z: 6.4, raw: true, parent: 'head' }, D => possFace(D, hy)); glyphStream(R, hy, 5); R.glow = GLV; poseAdd(R, (anim, f, G, T) => { if (anim === 'idle' || anim === 'move') { T.head.rot -= 0.16; T.armB.rot += 0.12; } }); };
  // 다침: 머리나 팔의 붕대
  const BAND = ['#2a2018', '#e8e0d0', '#ffffff', '#b0a490'];
  const bandHead = (D, h) => { D.G([[19.6, 14.6 + h], [30.4, 13.2 + h], [30.6, 15.8 + h], [19.6, 17.2 + h]], BAND); D.px(27.4, 14.4 + h, '#a8242c'); D.px(28.4, 14.6 + h, '#c8505a'); D.px(27.8, 15.4 + h, '#a8242c'); D.L([[19.8, 16.2 + h], [17.4, 18.8 + h], [17.8, 21 + h]], 0.7, 0.4, BAND); };
  const bandArm = (D, x0, y0, x1, y1) => { D.L([[lerp(x0, x1, 0.3), lerp(y0, y1, 0.3) + 0.8], [lerp(x0, x1, 0.85), lerp(y0, y1, 0.85) + 0.9]], 2.1, 1.8, BAND); for (const f of [0.42, 0.58, 0.74]) D.px(lerp(x0, x1, f), lerp(y0, y1, f) + 1.4, BAND[3]); D.px(lerp(x0, x1, 0.6) + 0.6, lerp(y0, y1, 0.6) + 0.2, '#a8242c'); };
  // 조사자 하나를 세 모습으로 올린다. v: 0 그대로, 1 다침, 2 홀림
  const castDef = (id, build) => { [['', 0], ['_hurt', 1], ['_poss', 2]].forEach(([suf, v]) => { DEF['c_' + id + suf] = { side: 'inv', size: () => 56, build(R) { const hy = build(R, v) || 0; if (v === 2) possessify(R, hy); } }; }); };
  // 에다 볼크, 기록관: 잉크 묻은 손, 목에 건 돋보기, 허리의 두루마리 통. 본 것을 받아 적는다
  castDef('eda', (R, v) => {
    const ct = ['#12140e', '#4c5c4a', '#7c8c6e', '#2c362a'], hr = ['#140c0a', '#3e2a22', '#6a4a3a', '#24160f'], INKB = '#1a1a4a';
    human(R, { top: ct, robe: ct, strike: 0.3, cast: -0.8,
      torso: D => { D.G([[21.4, 24.6], [27.8, 24.6], [26.4, 27.4], [22.8, 27.4]], CULTW); D.rect(19.6, 33.2, 9.4, 1.1, P.leather[1]);
        D.G([[16.8, 28.6], [23, 28], [23.6, 35.4], [17.4, 36]], P.wood); D.flat(D.poly([[17.6, 29.2], [22.4, 28.8], [22.8, 34.6], [18, 35]]), '#f2ecd8'); for (let k = 0; k < 3; k++) D.rect(18.4, 30.2 + k * 1.4, 3.4 - (k % 2), 0.5, '#5a5060'); D.B(18.4, 33.6, 1.3, 1.3, P.skin2); D.px(17.8, 33, INKB);
        flatL(D, [[24, 25.4], [26.6, 29.6]], P.gold[3], 0.4); flatL(D, [[27.6, 25.4], [26.8, 29.6]], P.gold[3], 0.4); D.flat(D.el(26.8, 31.2, 2.1, 2.1), '#bfe8f0', P.gold[1]); D.px(26.2, 30.4, '#ffffff'); D.rect(26.4, 33.4, 0.9, 1.8, P.gold[3]);
        D.L([[20.4, 37.6], [25.4, 40]], 1.5, 1.5, P.leather); D.px(20, 37.2, P.gold[1]); D.px(25.8, 40.4, P.gold[1]); D.px(22.8, 38.4, P.leather[2]); },
      face: D => { for (const x of [24.4, 27.8]) { D.rect(x - 0.6, 17.6, 2, 2, '#b8ccd4'); D.rect(x, 18, 1, 1.4, INK); D.px(x - 0.6, 17.6, '#ffffff'); } D.px(26.4, 18.2, P.gold[1]); D.px(22.8, 18, P.gold[1]); D.px(29.9, 18, P.gold[1]); D.rect(25.6, 21.8, 2.2, 0.6, P.skin[3]); if (v === 1) flatL(D, [[27.4, 17.4], [28.8, 19.6]], '#5a5060', 0.4); },
      hat: D => { D.G([[19.6, 18.6], [19.8, 14], [22.6, 11.6], [27.8, 11.6], [30.4, 14.8], [27, 14.2], [23, 15.2], [21.4, 18.8]], hr); D.B(19, 12.6, 2.4, 2.4, hr); flatL(D, [[19.6, 13.4], [16.4, 8.6]], '#c8b890', 0.5); D.px(16, 7.8, '#f2ecd8'); D.px(15.6, 8.6, '#f2ecd8'); D.px(16.8, 7.6, '#f2ecd8'); if (v === 1) bandHead(D, 0); },
      back: D => { armTo(D, 21, 27, 19.2, 31.6, dkp(ct)); },
      front: D => { armTo(D, 27.5, 27, 32.8, 24.6, ct); if (v === 1) bandArm(D, 27.5, 27, 32.8, 24.6); hand(D, 33.6, 24.4); D.px(34.4, 24, INKB); D.px(34, 25.2, INKB); D.L([[33.2, 26.8], [35.8, 18.6], [37.6, 12.8]], 1.2, 0.4, CULTW); D.px(33, 27.6, INK); flatL(D, [[34.2, 23.6], [36.6, 15.6]], '#b0a490', 0.4); },
      extra: R => { for (let k = 0; k < 2; k++) R.part('ink' + k, { px: 36, py: 14, z: 9, role: 'float', ph: k * 3, amp: 1.6, raw: v === 2 }, D => { D.px(39.6 + k * 2.4, 13 - k * 4, INKB); D.px(40.4 + k * 2.4, 12.2 - k * 4, '#6a6ac8'); }); } });
    R.glow = '#bcd0ff'; R.shw = 10;
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim === 'attack') { T.armF.rot += 0.25 * sin(f * 30) * s.chg; fx.glow = Math.max(fx.glow, 0.3 * s.chg); } });
  });
  // 로웬 하스, 파문당한 기사: 문장을 긁어내다 만 방패, 이 빠진 검, 수염
  castDef('rowen', (R, v) => {
    const st = ['#14151e', '#6c7284', '#aab2c4', '#3c4052'], hr = ['#1a1410', '#6c5c4c', '#968672', '#42382e'], ck = ['#141010', '#5c4c46', '#826e62', '#362c2a'], shd = ['#1b1d2a', '#b8b0a0', '#dcd4c4', '#7c766a'];
    human(R, { top: st, bot: st, boot: st, build: 1.2, strike: 0.25, backStrike: 0.95, cloak: ck,
      torso: D => { D.rect(19, 30, 10.4, 0.8, st[3]); D.rect(19.2, 34.4, 9.8, 1.4, P.leather[1]); flatL(D, [[21, 26.6], [24.6, 29.6]], st[2], 0.4); flatL(D, [[23, 26.4], [22, 29.4]], '#2a2c38', 0.4); flatL(D, [[25.6, 27], [27.6, 29.6]], '#2a2c38', 0.4); D.B(19, 26.2, 2.8, 2.3, st); D.px(24.2, 34.8, st[2]); },
      face: D => { D.rect(24, 18, 1.4, 1, INK); D.rect(27.4, 18, 1.4, 1, INK); D.rect(23.6, 16.8, 2.2, 0.6, hr[3]); D.rect(27, 16.8, 2.2, 0.6, hr[3]); flatL(D, [[28.8, 15.4], [29.4, 19.8]], '#a04a40', 0.4); D.G([[21, 21.4], [23.6, 20.8], [25.4, 21.6], [28, 21.6], [29.8, 20.8], [29.6, 24.4], [27.8, 26.8], [25.8, 25.4], [23.8, 27], [22, 24.6]], hr); D.rect(25.6, 22.6, 2.2, 0.7, '#2a1c16'); D.px(26.6, 20.4, P.skin[3]); D.px(29.6, 19.8, P.skin[3]); },
      hat: D => { D.G([[19.8, 17.4], [20.2, 13.6], [23, 12], [28.2, 12.2], [30.2, 14.8], [26.6, 13.8], [22.6, 15], [21.4, 17.6]], hr); if (v === 1) bandHead(D, 0); },
      back: D => { armTo(D, 20.4, 27, 16.6, 25, dkp(st)); D.L([[16.4, 25.4], [12.6, 12.6]], 1.2, 1, P.steel); D.G([[11.4, 13], [12.2, 10.4], [13.8, 12.6]], P.steel); D.px(14.4, 20.6, INK); D.px(13, 16.4, INK); D.px(15.6, 22.6, '#ffffff'); D.rect(13.6, 23.6, 5.4, 1, '#4a4038'); D.px(17.4, 26.6, '#4a4038'); },
      front: D => { armTo(D, 28, 27, 31, 30, st); D.G([[27.6, 23.6], [38.6, 23.6], [38.6, 33], [33.2, 40.6], [27.6, 33]], shd); D.flat(D.el(33.2, 29.6, 2.8, 3), '#a87a68', null); D.flat(D.el(33.2, 29.6, 1.4, 1.6), '#b8b0a0', null); for (const [a, b] of [[[29.6, 25.6], [37, 34]], [[36.8, 25.4], [30, 34.6]], [[31, 24.4], [34.2, 37]], [[28.6, 29.4], [37.8, 28.8]]]) flatL(D, [a, b], '#4e4a44', 0.5); D.px(29, 25, '#ffffff'); D.px(36.6, 31.6, '#2a2c38'); if (v === 1) { D.px(32, 38.6, INK); D.px(33.2, 37.6, INK); } } });
    if (v === 1) { const a = partOf(R, 'armB'), d = a.draw; a.draw = D => { d(D); bandArm(D, 20.4, 27, 16.6, 25); }; }
    R.glow = '#dce4f4'; R.shw = 11;
  });
  // 미렐 수녀, 구마 수녀: 젖은 수녀복 자락, 허리에 감은 두레박 줄
  castDef('mirel', (R, v) => {
    const hb = ['#100c0e', '#40363a', '#6a5c5e', '#241c20'], wet = ['#0a0808', '#261e22', '#40363a', '#161014'], W1 = '#8ac8e8', W2 = '#d8f0ff';
    human(R, { top: hb, robe: hb, strike: 0.3, cast: -0.9,
      torso: D => { D.G([[17.4, 40.4], [30.6, 40.4], [31, 45], [17, 45]], wet); for (const [x, y] of [[19, 41], [22.6, 42.4], [26.4, 41.2], [29.4, 42.8], [24.4, 44]]) D.px(x, y, W1); D.px(20.4, 43.6, W2);
        for (let k = 0; k < 4; k++) { D.rect(19.2, 30.6 + k * 1.3, 9.8, 1, k % 2 ? P.tan[1] : P.tan[2]); D.rect(19.2, 31.5 + k * 1.3, 9.8, 0.4, P.tan[3]); } D.L([[21.4, 35.6], [20.6, 40.4]], 0.9, 0.6, P.tan); D.B(20.6, 41.2, 1.2, 1.2, P.tan);
        D.G([[25.8, 36.4], [31.2, 36.4], [30.6, 41.6], [26.4, 41.6]], P.wood); D.rect(26, 38.6, 5, 0.8, P.steel[1]); D.rect(26.4, 36.4, 4.4, 0.8, W1); D.px(27.4, 36.4, W2); flatL(D, [[26.2, 36.2], [28.4, 34.2], [30.8, 36.2]], P.tan[3], 0.4); flatL(D, [[22.6, 25.8], [24.4, 28.2]], P.gold[3], 0.4); flatL(D, [[26.4, 25.8], [24.6, 28.2]], P.gold[3], 0.4); D.flat(D.el(24.5, 29, 1.3, 1.3), P.gold[1], P.gold[0]); D.px(24.5, 29, P.gold[0]); },
      face: D => { D.rect(23.8, 18.6, 1.8, 0.7, INK); D.rect(27.2, 18.6, 1.8, 0.7, INK); D.px(26.4, 21.6, P.skin[3]); D.px(27.2, 21.6, P.skin[3]); D.px(29.6, 19.4, W1); if (v === 1) { D.rect(27.6, 19.8, 2, 1.6, BAND[1]); D.px(28.4, 20.4, '#c8505a'); } },
      hat: D => { D.G([[21.4, 21.4], [29.6, 21.4], [29, 25.8], [22, 25.8]], CULTW); D.G([[18.4, 26.4], [18.6, 13.6], [22, 10.6], [28, 10.6], [31.2, 13.6], [31.6, 26], [29.8, 23.4], [29.8, 15.4], [26.4, 13.6], [22.8, 14], [21.2, 16.8], [20.8, 24.6]], hb); D.rect(21.4, 13.6, 8.2, 1.4, CULTW[1]); D.px(18.6, 27, W1); D.px(31.4, 26.8, W1); },
      back: D => { armTo(D, 21, 27, 19.6, 32, dkp(hb)); hand(D, 19.8, 33.4, P.skin2); for (let k = 0; k < 4; k++) D.px(19 + (k % 2) * 1.2, 34.8 + k * 1.1, P.gold[1]); },
      front: D => { armTo(D, 27.5, 27, 32.6, 25, hb); if (v === 1) bandArm(D, 27.5, 27, 32.6, 25); hand(D, 33.4, 24.8); D.L([[32.6, 27], [36.2, 15.6]], 0.8, 0.7, P.wood); D.B(37, 13.8, 2.6, 2, P.wood); D.rect(35.2, 13, 3.6, 0.8, W1); D.px(36, 13, W2); },
      extra: R => { for (let k = 0; k < 2; k++) R.part('drip' + k, { px: 37, py: 16, z: 9, role: 'float', ph: k * 2.6, amp: 2.4, sp: 2, raw: v === 2 }, D => { D.px(36 + k * 2.2, 17.6 + k * 3.4, W1); D.px(36 + k * 2.2, 18.6 + k * 3.4, W2); }); } });
    R.glow = '#bfe8ff'; R.shw = 10;
  });
  // 토브 카인, 덫 사냥꾼: 어깨에 쇠덫 여럿, 짐승 가죽 조끼, 한쪽 눈 가림
  castDef('tov', (R, v) => {
    const fur = ['#1c1008', '#8c6a46', '#bc986a', '#58422c'], shirt = ['#2a1c10', '#a8875a', '#d0b888', '#6e5638'], hr = ['#0c0a0a', '#2e2624', '#4e423e', '#1a1514'], h0 = 2.5;
    const trap = (D, cx, cy, r) => { D.lit(D.cut(D.el(cx, cy, r, r), (x, y) => { const dx = (x - cx) / (r - 1.3), dy = (y - cy) / (r - 1.3); return dx * dx + dy * dy > 1; }), P.steel); for (let k = 0; k < 5; k++) { const an = -2.6 + k * 0.5; D.px(cx + cos(an) * (r - 1.8), cy + sin(an) * (r - 1.8), '#ffffff'); } D.rect(cx - r, cy - 0.3, r * 2, 0.7, P.steel[3]); };
    human(R, { top: shirt, bot: P.brown, boot: fur, crouch: true, strike: 1.05, backStrike: 0.5,
      torso: (D, h) => { D.G([[19.6, 25 + h], [24, 25 + h], [23.2, 36.2], [19.6, 36.2]], fur); D.G([[25.6, 25 + h], [28.6, 25 + h], [28.4, 36.2], [26.4, 36.2]], fur); for (const [x, y] of [[20.4, 28], [22.4, 31], [20.6, 34], [27.2, 29], [27.4, 33], [23, 27.6], [26, 27]]) D.px(x, y + h * 0.4, fur[2]); for (const x of [19.6, 21.4, 23, 26.6, 28.2]) D.px(x, 36.6, fur[3]); D.rect(19.8, 34.2, 8.6, 1.2, P.leather[1]); D.px(24.6, 34.6, P.steel[2]); flatL(D, [[20, 26 + h], [28.4, 32.6]], P.leather[2], 0.6); },
      backItem: (D, h) => { trap(D, 16.4, 21.6 + h, 4.2); trap(D, 17.4, 30.4 + h, 3.8); for (let y = 25; y < 28; y += 1) D.px(16.6 + (Math.round(y) % 2) * 0.6, y + h, P.steel[3]); },
      face: (D, h) => { D.rect(24.2, 17.8 + h, 1.2, 1.6, INK); D.rect(23.6, 16.8 + h, 2.4, 0.6, hr[1]); D.rect(27, 17.6 + h, 2.2, 2, '#141018'); D.px(27.2, 17.6 + h, '#3a3440'); flatL(D, [[22, 15.6 + h], [27, 17.8 + h]], '#141018', 0.4); flatL(D, [[29.2, 18.6 + h], [30, 19.6 + h]], '#141018', 0.4); D.rect(22.6, 21.2 + h, 6.6, 2, P.skin[3]); D.rect(25.2, 21.8 + h, 2.6, 0.6, '#5a3020'); for (const x of [23, 24.6, 28.4]) D.px(x, 22.8 + h, hr[1]); },
      hat: (D, h) => { D.G([[19.6, 18.6 + h], [19.8, 14 + h], [22.4, 11.8 + h], [26, 12.6 + h], [28.6, 11.6 + h], [30.4, 14.6 + h], [27.6, 14.6 + h], [25.6, 13.8 + h], [22.6, 15.4 + h], [21.6, 18.6 + h]], hr); D.px(24.2, 11.4 + h, hr[1]); D.px(29.6, 12 + h, hr[1]); if (v === 1) bandHead(D, h - 0.6); },
      back: (D, h) => { armTo(D, 21, 27 + h, 17, 31.6 + h, dkp(shirt)); if (v === 1) bandArm(D, 21, 27 + h, 17, 31.6 + h); hand(D, 16.6, 32.2 + h, P.skin2); for (let y = 33.6; y < 37.4; y += 1) D.px(16.4 + (Math.round(y) % 2) * 0.6, y + h, P.steel[2]); D.L([[13.4, 40.6 + h], [14.6, 38.4 + h], [18.4, 38.4 + h], [19.6, 40.6 + h]], 0.8, 0.6, P.steel); for (const x of [14.4, 16.4, 18.4]) D.px(x, 41.2 + h, '#ffffff'); },
      front: (D, h) => { armTo(D, 27.5, 27 + h, 33, 29.6 + h, shirt); D.L([[33, 32.6 + h], [36.6, 21.6 + h]], 0.9, 0.8, P.wood); D.G([[35.2, 22.4 + h], [41.6, 19.4 + h], [42.6, 25 + h], [36.6, 25 + h]], P.steel); D.px(41.6, 21 + h, '#ffffff'); D.px(41.8, 22.4 + h, '#ffffff'); hand(D, 33.6, 29.6 + h); D.rect(31.8, 28 + h, 2.6, 0.8, P.leather[1]); } });
    R.glow = '#dce4f4'; R.shw = 11; return h0;
  });
  // 이셀 드란, 연금술사: 푸른 불이 든 등, 화상 자국이 있는 팔, 긴 앞치마
  castDef('isel', (R, v) => {
    const sh = ['#1c0c0c', '#7c3c36', '#aa5c4e', '#4a2020'], ap = ['#221810', '#b09870', '#d8c498', '#74623e'], hr = ['#2a0c08', '#b8522c', '#e88c52', '#762c16'], ker = ['#10141c', '#4e6078', '#8094ac', '#2c3848'], BF = '#4a9aff', BF2 = '#bfe8ff';
    human(R, { top: sh, bot: P.brown, boot: P.leather, strike: 0.3, cast: -0.8,
      torso: D => { D.G([[20.6, 26.6], [28, 26.6], [29.8, 43], [19.2, 43]], ap); flatL(D, [[21.6, 26.6], [22.8, 24.8]], ap[3], 0.5); flatL(D, [[27.2, 26.6], [26, 24.8]], ap[3], 0.5); D.rect(19.8, 33, 9.2, 1, P.leather[1]); D.rect(21.4, 35.4, 3.2, 3.2, ap[3]); D.rect(22, 33.8, 0.8, 2.2, P.steel[2]); D.rect(23.4, 34.2, 0.8, 1.8, P.wood[2]); for (const [x, y, c] of [[26.6, 36.6, BF], [27.4, 37.4, '#2a5ab0'], [22.4, 40.6, '#4a3a2a'], [26, 41, BF], [21, 30, '#4a3a2a'], [27, 29.6, '#2a5ab0']]) D.px(x, y, c); },
      face: D => { D.rect(24.2, 17.8, 1, 2, INK); D.rect(27.4, 17.8, 1, 2, INK); D.px(23.4, 20.2, '#c87850'); D.px(25.6, 20.4, '#c87850'); D.px(28.8, 20.2, '#c87850'); D.rect(25.8, 21.8, 2, 0.6, P.skin[3]); D.px(22.6, 19, '#4a3a34'); },
      hat: D => { D.G([[19.4, 19.6], [19.6, 14], [22.6, 11.6], [28, 11.8], [30.4, 14.8], [27, 14.4], [22.8, 15.6], [21.6, 19.8]], hr); D.G([[19.6, 15], [22.4, 12.4], [28.4, 12.4], [30.2, 14.6], [26.4, 13.4], [22.6, 14.4]], ker); D.px(20, 14.4, ker[2]); if (v === 1) bandHead(D, 1.6); },
      back: D => { armTo(D, 21, 27, 19.4, 32, dkp(sh)); D.L([[19.4, 31.6], [19.8, 35.6]], 1.8, 1.5, dkp(P.leather)); D.G([[15.6, 35.6], [20.8, 36.2], [20.4, 41.4], [15.4, 40.8]], P.leather); D.rect(16.6, 37.2, 2.6, 0.7, P.gold[1]); },
      front: D => { D.L([[27.5, 27], [29.6, 27.4]], 2, 1.9, sh); D.L([[29.8, 27.4], [33.4, 25.4]], 1.6, 1.3, P.skin); for (const [x, y, c] of [[30.4, 27.4, '#c85a50'], [31.4, 26.2, '#8a3a34'], [32.2, 26.8, '#c85a50'], [32.8, 25.4, '#e8a090'], [31, 27.8, '#8a3a34']]) D.px(x, y, c); if (v === 1) bandArm(D, 28.6, 27, 33.4, 25.4); hand(D, 34, 25.2); D.rect(33.8, 26, 0.9, 2.6, '#2a2a3a'); },
      extra: R => {
        R.part('lamp', { px: 34.2, py: 28.4, z: 9, role: 'sway', amp: 1.4, parent: 'armF', raw: true }, D => { D.flat(D.el(34.2, 33, 3, 3.8), BF, '#101830'); D.flat(D.el(34, 33.4, 1.5, 2.2), BF2); D.px(33.8, 34, '#ffffff'); D.rect(31.4, 29.2, 5.8, 1, '#2a2a3a'); D.rect(31.4, 36.6, 5.8, 1, '#2a2a3a'); D.rect(33.8, 28.2, 0.9, 1.2, '#2a2a3a'); D.rect(31.4, 30.2, 0.7, 6.4, '#2a2a3a88'); D.rect(36.4, 30.2, 0.7, 6.4, '#2a2a3a88'); });
        R.part('wisp', { px: 34.2, py: 28, z: 9.2, role: 'pulse', amp: 2, sp: 2, parent: 'lamp', raw: true }, D => { D.px(34.2, 27, BF); D.px(34.8, 25.6, BF2); D.px(33.4, 24.6, BF); });
        R.part('tail', { px: 20, py: 15, z: 5.5, role: 'sway', amp: 1.2, parent: 'head' }, D => { D.L([[20, 15.6], [16.6, 17.6], [15.4, 21.6]], 1.6, 0.6, hr); });
      } });
    R.glow = '#6ab8ff'; R.shw = 10;
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim === 'attack') { T.lamp.rot -= 0.9 * s.chg; fx.glow = Math.max(fx.glow, 0.4 * s.chg); } });
  });
  // 늙은 바스코, 등불지기: 굽은 등, 장대에 매단 큰 등불, 흰 눈썹
  castDef('vasco', (R, v) => {
    const ct = ['#14100c', '#604e3c', '#8a765a', '#372c20'], wh = ['#2a2620', '#e8e4dc', '#ffffff', '#b0aaa0'], sk = ['#2a1410', '#c89878', '#e8c0a0', '#986a50'], h0 = 2.5;
    human(R, { top: ct, robe: ct, skin: sk, crouch: true, strike: 0.25, cast: -0.35,
      torso: (D, h) => { D.rect(19.6, 33.4, 9.4, 1, '#8a6a3a'); D.L([[26.4, 34.4], [27, 39]], 0.6, 0.5, ['#0000', '#8a6a3a', '#8a6a3a', '#8a6a3a'], null); D.G([[25.4, 38.6], [28.6, 38.6], [28.2, 42], [25.8, 42]], P.steel); D.px(27, 38, P.steel[2]); D.G([[20.4, 25 + h], [28.2, 25 + h], [26.6, 28.4 + h], [22, 28.4 + h]], ['#141010', '#7a3a30', '#a85a48', '#48201c']); D.px(22.6, 31, ct[3]); D.px(25.4, 36.6, ct[3]); D.rect(20.6, 41, 2.2, 2, ct[3]); },
      backItem: (D, h) => { D.B(18, 27.6 + h, 4.4, 5, dkp(ct)); D.G([[14.4, 29 + h], [19.6, 28.4 + h], [20, 36], [15, 36.6]], P.brown); D.rect(15.2, 31.6 + h, 4.6, 0.8, P.tan[1]); },
      face: (D, h) => { D.px(24.6, 18.8 + h, INK); D.px(28, 18.8 + h, INK); D.rect(23, 16.8 + h, 3.2, 1.3, wh[1]); D.rect(26.8, 16.8 + h, 3.4, 1.3, wh[1]); D.px(22.6, 17.6 + h, wh[1]); D.px(30.4, 17.4 + h, wh[1]); D.px(23.6, 16.4 + h, wh[2]); D.px(27.6, 16.4 + h, wh[2]); D.G([[22.6, 20.8 + h], [29.8, 20.8 + h], [29.4, 23 + h], [27.4, 25.6 + h], [24.4, 25.6 + h], [23, 23 + h]], wh); D.px(26, 21.8 + h, '#7a5a4a'); D.px(22.2, 15 + h, sk[3]); D.px(23.6, 14.4 + h, sk[3]); },
      hat: (D, h) => { D.L([[20.4, 15.6 + h], [19.4, 18.4 + h], [19.8, 21.6 + h]], 1.3, 0.8, wh); D.px(21, 14 + h, wh[1]); if (v === 1) bandHead(D, h - 0.8); },
      back: (D, h) => { armTo(D, 21, 27 + h, 19.6, 32 + h, dkp(ct)); hand(D, 19.8, 33.6 + h, sk); },
      front: (D, h) => { D.L([[31.4, 45], [32.8, 2.6]], 1, 0.9, P.wood); D.L([[32.8, 2.6], [36.6, 0.6], [39.8, 1.6], [40, 4]], 0.8, 0.6, P.wood); D.px(31.2, 44.6, P.steel[2]); armTo(D, 27.5, 27 + h, 31.6, 28.6 + h, ct); if (v === 1) bandArm(D, 27.5, 27 + h, 31.6, 28.6 + h); hand(D, 32.2, 28.4 + h, sk); },
      extra: R => {
        R.part('halo', { px: 40, py: 11, z: 0, role: 'pulse', amp: 1.2, raw: true }, D => { D.flat(D.el(40, 11.2, 7.4, 7.8), '#ffd07026'); D.flat(D.el(40, 11.2, 5.4, 5.8), '#ffd07030'); });
        R.part('lamp', { px: 40, py: 4, z: 9, role: 'sway', amp: 1.1, parent: 'armF', raw: true }, D => { D.rect(39.6, 4, 0.9, 2.6, '#3a2a1a'); D.flat(D.el(40, 11.4, 3.9, 4.8), '#ffd070', '#3a2410'); D.flat(D.el(39.8, 11.4, 2.1, 3), '#fff8d8'); D.px(39.6, 10.4, '#ffffff'); D.rect(36, 6.8, 8, 1.1, '#5a3a1a'); D.rect(36, 15.6, 8, 1.1, '#5a3a1a'); D.G([[37.4, 6.8], [40, 4.6], [42.6, 6.8]], ['#1c1008', '#5a3a1a', '#8a5a30', '#3a2410']); D.rect(36.2, 7.8, 0.7, 7.8, '#5a3a1a'); D.rect(43.2, 7.8, 0.7, 7.8, '#5a3a1a'); });
      } });
    R.glow = '#ffd070'; R.shw = 10;
    poseAdd(R, (anim, f, G, T, fx, s) => { T.torso.rot += 0.13; T.head.rot -= 0.1; T.armF.rot -= 0.13; if (anim === 'cast') { T.armF.dy -= 3 * s.u * s.rise; T.halo.sx *= 1 + 0.5 * s.rise; T.halo.sy *= 1 + 0.5 * s.rise; } if (anim === 'attack') { T.lamp.rot -= 0.8 * s.chg; fx.glow = Math.max(fx.glow, 0.4 * s.chg); } T.halo.dx = T.armF.dx; });
    return h0;
  });
  // ---------- 사람 꼴로 불려 나오는 것 ----------
  // 신도: 설교하는 것이 부른다. 두건 속 얼굴 자리에 틈, 손에 초. 멀리서 속삭인다
  DEF.cultist = { size: () => 48, build(R) {
    const p = P.dusk, rb = [p[0], '#5c3c58', '#987a9c', '#34223c'], gl = p[4];
    human(R, { top: rb, robe: rb, skin: P.flesh, strike: 0.3, cast: -0.8,
      torso: D => { D.rect(19.6, 32.6, 9.4, 1, '#8a6a3a'); flatL(D, [[25.6, 33.6], [25.2, 38]], '#8a6a3a', 0.5); D.px(25.2, 38.8, gl); flatL(D, [[22, 35], [21, 44]], rb[3], 0.5); flatL(D, [[27, 36], [28, 44]], rb[3], 0.5); D.G([[20, 25], [28.4, 25], [26.6, 28.6], [21.8, 28.6]], dkp(rb)); },
      face: D => { D.flat(D.el(26, 18.6, 4, 5), VOID); D.rect(25.6, 15.4, 1, 6.6, gl); D.px(25.6, 18, '#fff3c0'); D.px(25.6, 19, '#fff3c0'); },
      hat: D => { D.G([[18.4, 24.6], [18.4, 14.4], [21.8, 10.2], [26.6, 9.4], [30.8, 12.8], [31.2, 19.6], [29.6, 15], [26, 12.6], [22.8, 13.8], [21.4, 17.6], [21.2, 24.6]], rb); D.L([[21.8, 10.2], [17.6, 7.8], [15.2, 9.8]], 1.5, 0.6, rb); D.G([[28.6, 22], [31.2, 19.4], [31, 24.6]], rb); },
      back: D => { armTo(D, 21, 27, 18.6, 33, dkp(rb)); D.L([[18.6, 33], [18, 37.6]], 1.7, 0.9, dkp(rb)); },
      front: D => { armTo(D, 27.5, 27, 33, 27.6, rb); hand(D, 33.8, 27.4, P.flesh); D.rect(33.2, 21.4, 1.7, 5.8, '#f2ecd8'); D.px(33.2, 23, '#cfc8b4'); D.px(34.6, 24.6, '#cfc8b4'); D.rect(32.6, 27, 2.8, 0.8, '#8a6a3a'); },
      extra: R => flameP(R, 'flame', 34, 17.6, 1.8, 'armF') });
    R.glow = gl; R.shw = 9; R.eyes = [['head', 25.6, 18.6]];
    poseAdd(R, (anim, f, G, T, fx, s) => { if (anim === 'attack') { T.flame.sx *= 1 + 0.9 * s.chg; T.flame.sy *= 1 + 0.9 * s.chg; fx.glow = Math.max(fx.glow, 0.4 * s.chg); } });
  } };
  // 광신도: 미친 채 살아남은 침입자. 찢어진 민병의 옷, 눈을 가린 천, 맨손
  DEF.zealot = { size: () => 48, build(R) {
    const sk = ['#1a1420', '#b8a2aa', '#dccace', '#7a6672'], rag = ['#1c1410', '#8a7652', '#b09c72', '#564630'], bl = ['#120a26', '#5a3fa8', '#9a84e0', '#32206a'], hr = ['#140c0a', '#4a3428', '#6e5240', '#2a1c14'];
    human(R, { skin: sk, top: rag, bot: P.brown, boot: sk, crouch: true, strike: 1, backStrike: 0.9,
      torso: (D, h) => { for (let y = 28 + h; y < 34; y += 2.4) D.rect(20, y, 8.4, 0.6, rag[3]); for (let x = 21.5; x < 28; x += 2.6) D.rect(x, 26.4 + h, 0.6, 7, rag[3]); D.G([[23, 29 + h], [25.6, 30 + h], [24.6, 34.6], [22.4, 33.6]], sk); flatL(D, [[23.4, 31], [24.6, 32.2], [23.6, 33.4]], bl[2], 0.4); flatL(D, [[26.6, 27 + h], [28.6, 30 + h]], INK, 0.4); D.rect(19.8, 34.4, 5, 1.2, P.leather[1]); for (const x of [19.6, 21.6, 23.4, 26, 28]) D.px(x, 36.8 + (x * 3 % 2), rag[1]); },
      face: (D, h) => { D.rect(24.6, 21.2 + h, 3.8, 1.6, MAWC); D.px(25.2, 21.2 + h, TOOTH); D.px(26.6, 21.2 + h, TOOTH); D.px(27.8, 21.2 + h, TOOTH); D.px(26, 22.4 + h, TOOTH2); },
      hat: (D, h) => { D.G([[19.6, 17.4 + h], [19.8, 14 + h], [21.6, 11.6 + h], [23.6, 13 + h], [25.6, 11.4 + h], [27.6, 13 + h], [29.6, 12 + h], [30.4, 15.4 + h], [27, 14.8 + h], [22.6, 15.6 + h]], hr); D.G([[19.6, 16.6 + h], [30.4, 16.4 + h], [30.4, 19.6 + h], [19.6, 20 + h]], bl); D.rect(25.6, 16.8 + h, 1, 2.6, GLW); D.px(24.4, 18 + h, GLW); D.px(27, 18 + h, GLW); },
      back: (D, h) => { armTo(D, 21, 27 + h, 16.4, 30 + h, dkp(rag)); hand(D, 15.8, 30.6 + h, sk); for (const k of [-1, 0, 1]) flatL(D, [[15.2, 30.6 + h], [13, 30.2 + h + k * 1.4]], sk[3], 0.4); },
      front: (D, h) => { armTo(D, 27.5, 27 + h, 34, 27 + h, rag); D.px(30.6, 29 + h, sk[1]); D.px(31.6, 29.4 + h, sk[1]); hand(D, 35, 27.2 + h, sk); for (const k of [-1, 0, 1]) flatL(D, [[35.6, 27.2 + h], [38.2, 26.6 + h + k * 1.5]], sk[1], 0.4); },
      extra: (R, h) => R.part('tail', { px: 20, py: 18 + h, z: 5.5, role: 'sway', amp: 1.6, parent: 'head' }, D => { D.L([[20, 18 + h], [16.4, 19.4 + h], [14.4, 23.4 + h]], 1.1, 0.5, bl); D.L([[20, 18.6 + h], [17.6, 22 + h], [17.4, 25.6 + h]], 0.9, 0.4, dkp(bl)); }) });
    R.glow = '#cdbcff'; R.shw = 10; R.eyes = [['head', 26, 20.6]];
    poseAdd(R, (anim, f, G, T) => { T.torso.rot += 0.1; if (anim === 'idle') { T.head.rot += 0.12 * sin(f * TAU * 2); T.armF.rot += 0.1 * sin(f * TAU + 1); } });
  } };
  // 홀린 자: 3막의 책을 쫓는 자가 일으킨다. 교단의 옷, 입에서 글자가 흘러나온다
  DEF.possessed = { side: 'inv', build(R) {
    const sk = ['#16141c', '#a8a4b0', '#d0ccd8', '#6a6678'], rb = ['#1e1a1c', '#b4aca4', '#d8d2c8', '#7c746e'], rd = '#7e2a30';
    human(R, { skin: sk, top: rb, robe: rb, strike: 0.85, backStrike: 0.6,
      torso: D => { D.rect(22.4, 25.6, 1.5, 17.4, rd); D.rect(25.8, 25.6, 1.5, 17.4, rd); D.rect(22.4, 31, 4.9, 1, '#4e161c'); shutEye(D, 24.8, 36, rd); D.rect(19.6, 33, 2.8, 1, '#8a6a3a'); D.rect(27.4, 33, 1.8, 1, '#8a6a3a'); for (const [a, b] of [[[23.6, 25.4], [21.6, 30]], [[26, 25.6], [27.6, 29.4]], [[24.6, 26], [24.4, 30]]]) flatL(D, [a, b], GLI, 0.4); },
      face: D => possFace(D, 0),
      hat: D => { D.G([[19.4, 22.6], [19.6, 14.4], [22.4, 12], [26.4, 12], [23.6, 14.4], [22.2, 17.6], [21.8, 23]], rb); D.px(27.6, 13.4, sk[3]); D.px(29, 14.6, sk[3]); },
      back: D => { armTo(D, 21, 27, 19.4, 33.6, dkp(rb)); hand(D, 19.4, 35.8, sk); },
      front: D => { armTo(D, 27.5, 27, 31.4, 33, rb); hand(D, 31.8, 34.6, sk); for (const k of [-1, 0, 1]) flatL(D, [[31.8, 35.2], [31.4 + k * 1.2, 37.6]], sk[3], 0.4); } });
    for (const p of R.parts) p.raw = true; glyphStream(R, 0, 5);
    R.glow = GLV; R.shw = 9;
    poseAdd(R, (anim, f, G, T) => { if (anim !== 'attack' && anim !== 'die') T.head.rot -= 0.22; if (anim === 'idle') { T.armF.rot += 0.08 * sin(f * TAU); T.torso.rot += 0.03 * sin(f * TAU + 1); } });
  } };
  for (const id of ['crossbow', 'alchemist', 'exorcist', 'banner', 'cultist', 'c_eda', 'c_mirel', 'c_isel', 'c_vasco']) for (const sf of id.indexOf('c_') === 0 ? ['', '_hurt', '_poss'] : ['']) SHOOT[id + sf] = 1;
  // ---------- 연출 일곱 (a = 쓰는 쪽, b = 첫 대상) ----------
  // 깃발: 발밑에 감은 눈이 새겨지고 빛의 고리가 판으로 퍼진다. 고리 위로 짧은 빛기둥이 선다
  FX.banner = (g, a, b, t, o) => { const U = o.size, gy = a.y + U * 0.34, plant = seg(t, 0, 0.14), k = ease(seg(t, 0.12, 0.62)), fade = seg(t, 0.78, 1), R = U * (o.r || 2.6) * k, c = '#ffe060';
    if (plant < 1) { g.a(1 - plant); g.ell(a.x, gy, U * 0.5 * plant, U * 0.18 * plant, '#fff3a0'); for (let i = 0; i < 6; i++) g.dot(a.x + (hsh(i, 1) - 0.5) * U * 0.8, gy - plant * U * 0.3 * hsh(i, 2), '#c8c0b0', 2, 2); }
    g.add(true).a(0.26 * (1 - fade)).ell(a.x, gy, R, R * 0.4, '#a8842c').add(false);
    g.a(1 - fade); g.ring(a.x, gy, R, R * 0.4, '#7a5a10', 3).ring(a.x, gy, R, R * 0.4, c, 1).ring(a.x, gy, R * 0.82, R * 0.33, '#fff3a0', 1, f => ((f + t * 0.6) * 16) % 1 < 0.45);
    const ew = U * 0.34 * Math.min(1, k * 2.5); if (ew > g.s * 2) { for (let i = -6; i <= 6; i++) { const f = i / 6; g.sq(a.x + f * ew, gy + (1 - f * f) * U * 0.08, '#7a5a10', 3); } for (let i = -6; i <= 6; i++) { const f = i / 6; g.sq(a.x + f * ew, gy + (1 - f * f) * U * 0.08, '#fff3a0', 1); } for (const f of [-0.6, 0, 0.6]) g.line(a.x + f * ew, gy + U * 0.1, a.x + f * ew * 1.25, gy + U * 0.17, c, 1); }
    for (let i = 0; i < 8; i++) { const an = i * TAU / 8 + 0.4, x = a.x + cos(an) * R, y = gy + sin(an) * R * 0.4, h = U * 0.7 * seg(t, 0.3 + i * 0.02, 0.55 + i * 0.02) * (0.85 + 0.15 * sin(t * 24 + i)); if (h > g.s) { g.a(0.45 * (1 - fade)).dot(x - g.s, y - h, '#fff3a0', 3, Math.round(h / g.s)); g.a(1 - fade).dot(x, y - h, '#ffffff', 1, Math.round(h / g.s)); star(g, x, y - h, '#ffffff', i % 2 === 0); } }
    for (let i = 0; i < 10; i++) { const f = (hsh(i, 3) + t * 1.4) % 1, an = hsh(i, 4) * TAU, rr = R * hsh(i, 5); g.a((1 - f) * (1 - fade)); star(g, a.x + cos(an) * rr, gy + sin(an) * rr * 0.4 - f * U * 0.8, i % 2 ? c : '#ffffff', i % 5 === 0); }
    g.a(1); };
  // 표식: 분필 가루가 날아가 대상의 머리 위에 붉은 금을 긋는다
  FX.mark = (g, a, b, t, o) => { const U = o.size, fly = seg(t, 0, 0.22), draw = seg(t, 0.18, 0.5), hold = seg(t, 0.5, 1), fade = seg(t, 0.86, 1), y = b.y - U * 0.86, r = U * 0.25, c = '#e03a30', c2 = '#ff9a80';
    if (fly < 1) for (let i = 0; i < 7; i++) { const f = fly - i * 0.06; if (f > 0) { g.a(0.9 * (1 - i / 7)); g.sq(lerp(a.x, b.x, f) + sin(f * 20 + i) * g.s, lerp(a.y - U * 0.2, y, f), i % 2 ? '#ffffff' : '#e8e0d0', i < 2 ? 2 : 1); } }
    g.a(1 - fade); const sh = hold > 0 ? sin(t * 26) * g.s * 0.6 : 0;
    g.ring(b.x, y + sh, r, r, INK, 3, f => f < draw).ring(b.x, y + sh, r, r, c, 1, f => f < draw);
    if (draw > 0.4) { const q = seg(draw, 0.4, 1); g.line(b.x - r * 0.62, y + sh, b.x - r * 0.62 + r * 1.24 * q, y + sh, INK, 3).line(b.x - r * 0.62, y + sh, b.x - r * 0.62 + r * 1.24 * q, y + sh, c, 1); }
    if (draw >= 1) { g.poly([[b.x - r * 0.56, y + r * 1.3 + sh], [b.x + r * 0.56, y + r * 1.3 + sh], [b.x, y + r * 2.1 + sh]], c, INK); g.sq(b.x, y + sh, c2, 2); g.sq(b.x, y - r * 0.5 + sh, c, 1); g.sq(b.x, y + r * 0.5 + sh, c, 1);
      const p = (hold * 3) % 1; g.a((1 - p) * (1 - fade) * 0.9).ring(b.x, y, r * (1 + p * 0.9), r * (1 + p * 0.9), c2, 1); if (hold < 0.2) { g.a(1 - hold / 0.2); rays(g, b.x, y, r * 1.2, 8, '#ffffff', 0.2, U * 0.16); } }
    g.a(0.75 * (1 - fade) * Math.min(1, draw * 2)).ring(b.x, b.y + U * 0.32, U * 0.42, U * 0.15, c, 1, f => ((f + t) * 10) % 1 < 0.6); g.a(1); };
  // 심판: 망치가 들렸다가 내리꽂히고, 그 자리에 빛기둥이 선다
  FX.smite = (g, a, b, t, o) => { const U = o.size, gy = b.y + U * 0.3, up = ease(seg(t, 0, 0.28)), down = seg(t, 0.28, 0.4), fade = seg(t, 0.8, 1), w = U * 0.36, h = U * 0.23;
    if (t < 0.52) { const hy = t < 0.28 ? b.y - U * (0.8 + 0.7 * up) : lerp(b.y - U * 1.5, b.y - U * 0.1, down * down), tilt = t < 0.28 ? 0.5 * up : 0.5 * (1 - down), sx = b.x + sin(tilt) * U * 0.7, sy = hy - cos(tilt) * U * 0.7;
      g.a(t < 0.4 ? 1 : 1 - seg(t, 0.4, 0.52)); if (down > 0 && down < 1) for (let i = 1; i < 5; i++) { g.a(0.3 * (1 - i / 5)); g.poly([[b.x - w, hy - h - i * U * 0.12], [b.x + w, hy - h - i * U * 0.12], [b.x + w, hy + h - i * U * 0.12], [b.x - w, hy + h - i * U * 0.12]], '#fff3a0'); } g.a(t < 0.4 ? 1 : 1 - seg(t, 0.4, 0.52));
      g.line(b.x, hy, sx, sy, '#1c1008', 3).line(b.x, hy, sx, sy, '#c08a50', 1); g.poly([[b.x - w, hy - h], [b.x + w, hy - h], [b.x + w, hy + h], [b.x - w, hy + h]], '#8a92a8', '#1b1d2a'); g.dot(b.x - w + g.s, hy - h + g.s, '#dce4f4', Math.max(1, Math.round(w * 2 / g.s) - 2), 1); g.dot(b.x - w + g.s, hy + h - g.s * 2, '#4a5068', Math.max(1, Math.round(w * 2 / g.s) - 2), 1); for (const f of [-0.5, 0.5]) g.dot(b.x + f * w - g.s, hy - h, '#e8c030', 2, Math.round(h * 2 / g.s)); }
    if (t >= 0.38) { const k = sin(seg(t, 0.38, 1) * Math.PI), top = gy - U * 2.7, p = ease(seg(t, 0.4, 0.72));
      g.add(true).a(0.5 * k).poly([[b.x - U * 0.16, top], [b.x + U * 0.16, top], [b.x + U * 0.34, gy], [b.x - U * 0.34, gy]], '#b08a28'); g.a(0.6 * k).poly([[b.x - U * 0.05, top], [b.x + U * 0.05, top], [b.x + U * 0.13, gy], [b.x - U * 0.13, gy]], '#d8c070').add(false);
      g.a(1 - fade); g.ring(b.x, gy, U * 0.66 * p, U * 0.24 * p, '#7a5a10', 3).ring(b.x, gy, U * 0.66 * p, U * 0.24 * p, '#ffe060', 1); if (p < 1) rays(g, b.x, gy, U * 0.12, 9, '#fff3a0', 0.3, U * 0.5 * p * (1 - p) * 2.4, 1);
      for (let i = 0; i < 5; i++) { const an = 0.3 + i * 1.3, l = U * (0.3 + 0.2 * hsh(i, 2)) * p; g.line(b.x, gy, b.x + cos(an) * l, gy + sin(an) * l * 0.4, '#3a2a10', 1); }
      for (let i = 0; i < 10; i++) { const f = (hsh(i, 5) + t * 1.6) % 1; g.a(k * (1 - f)); star(g, b.x + (hsh(i, 6) - 0.5) * U * 0.7, gy - f * U * 2, i % 2 ? '#fff3a0' : '#ffffff', i % 3 === 0); } }
    g.a(1); };
  // 구마: 향로가 머리 위에서 돌고, 연기가 판 전체로 번진다. 되돌려지는 자리에 빛이 내린다
  FX.exorcise = (g, a, b, t, o) => { const U = o.size, R = U * (o.r || 3.2), k = ease(seg(t, 0, 0.7)), fade = seg(t, 0.72, 1), gy = a.y + U * 0.2;
    for (const d of [0, 0.14, 0.28]) { const p = ease(seg(t, d, d + 0.6)); if (p <= 0) continue; for (let i = 0; i < 26; i++) { const an = i / 26 * TAU + d * 9 + t * 1.5, rr = R * p * (0.92 + 0.1 * sin(i * 3 + t * 9)); g.a(0.5 * (1 - p * 0.55) * (1 - fade)); g.disc(a.x + cos(an) * rr, gy + sin(an) * rr * 0.62, U * (0.09 + 0.06 * hsh(i, 3)), i % 3 ? '#e8e0d0' : '#c8b890'); } }
    for (let i = 0; i < 16; i++) { const an = hsh(i, 1) * TAU, rr = R * k * (0.2 + 0.8 * hsh(i, 2)), f = (hsh(i, 4) + t * 1.2) % 1; g.a((1 - f) * (1 - fade)); star(g, a.x + cos(an) * rr, gy + sin(an) * rr * 0.62 - f * U * 0.7, i % 2 ? '#ffe060' : '#ffffff', i % 4 === 0); }
    if (t < 0.62) { const an = t * 30, cx = a.x + cos(an) * U * 0.52, cy = a.y - U * 0.74 + sin(an) * U * 0.17, q = 1 - seg(t, 0.5, 0.62); g.a(0.8 * q).line(a.x + U * 0.1, a.y - U * 0.5, cx, cy, '#8a92a8', 1); for (let i = 1; i < 6; i++) { const a2 = an - i * 0.3; g.a(0.4 * (1 - i / 6) * q).disc(a.x + cos(a2) * U * 0.52, a.y - U * 0.74 + sin(a2) * U * 0.17, g.s * 2, '#e8e0d0'); } g.a(q).disc(cx, cy, g.s * 3, '#3a2a10').disc(cx, cy, g.s * 2, '#e8c030'); g.dot(cx - g.s, cy - g.s, '#fff8d8'); g.dot(cx, cy + g.s, '#ff8a2a'); }
    if ((b.x !== a.x || b.y !== a.y) && t > 0.3) { const p = sin(seg(t, 0.3, 1) * Math.PI), by = b.y + U * 0.3; g.add(true).a(0.4 * p).poly([[b.x - U * 0.1, by - U * 1.9], [b.x + U * 0.1, by - U * 1.9], [b.x + U * 0.3, by], [b.x - U * 0.3, by]], '#b08a28').add(false); g.a(p).ring(b.x, by, U * 0.38, U * 0.14, '#7a5a10', 3).ring(b.x, by, U * 0.38, U * 0.14, '#ffe060', 1); for (let i = 0; i < 4; i++) { const f = (hsh(i, 8) + t * 2) % 1; g.a(p * (1 - f)); g.dot(b.x + (hsh(i, 9) - 0.5) * U * 0.5, by - f * U, '#f070e8', 2, 2); } }
    g.a(1); };
  // 산 플라스크: 병이 포물선으로 날아가 깨지고, 산 웅덩이와 초록 연기가 인다
  FX.flask = (g, a, b, t, o) => { const U = o.size, R = U * (o.r || 1.5), k = seg(t, 0, 0.4), gy = b.y + U * 0.3, d = Math.hypot(b.x - a.x, b.y - a.y) || 1, arc = Math.max(U * 0.9, d * 0.3), pos = f => [lerp(a.x, b.x, f), lerp(a.y - U * 0.4, b.y, f) - sin(f * Math.PI) * arc];
    if (k < 1) { g.a(0.5 * k).ring(b.x, gy, R * 0.9, R * 0.36, '#58d040', 1, f => ((f + t) * 12) % 1 < 0.5);
      for (let i = 1; i < 7; i++) { const q = pos(Math.max(0, k - i * 0.035)); g.a(0.55 * (1 - i / 7)).sq(q[0], q[1], i % 2 ? '#8af060' : '#d8ffb0', i < 3 ? 2 : 1); }
      const p = pos(k), sp = t * 44; const br = U * 0.12; g.a(1).disc(p[0], p[1], br + g.s, '#1a2a1a').disc(p[0], p[1], br, '#c8f0e0').disc(p[0], p[1] + g.s, br - g.s, '#58d040'); g.sq(p[0] + cos(sp) * (br + g.s * 2), p[1] + sin(sp) * (br + g.s * 2), '#1a2a1a', 4).sq(p[0] + cos(sp) * (br + g.s * 2), p[1] + sin(sp) * (br + g.s * 2), '#c8f0e0', 2); g.dot(p[0] - br * 0.5, p[1] - br * 0.5, '#ffffff', 2, 1); }
    else { const p = seg(t, 0.4, 1), burst = ease(seg(t, 0.4, 0.58)), fade = seg(t, 0.8, 1);
      g.a(0.8 * (1 - fade)).ell(b.x, gy, R * burst, R * 0.4 * burst, '#1a3a10').ell(b.x, gy, R * 0.9 * burst, R * 0.33 * burst, '#3a8a20'); g.ring(b.x, gy, R * 0.9 * burst, R * 0.33 * burst, '#8af060', 1, f => ((f + t * 0.3) * 9) % 1 < 0.6); for (let i = 0; i < 6; i++) g.ell(b.x + (hsh(i, 1) - 0.5) * R * 1.3 * burst, gy + (hsh(i, 2) - 0.5) * R * 0.36, U * 0.13, U * 0.05, i % 2 ? '#8af060' : '#58d040'); for (let i = 0; i < 5; i++) g.ell(b.x + (hsh(i, 12) - 0.5) * R * 1.2 * burst, gy + (hsh(i, 13) - 0.5) * R * 0.4, U * 0.16, U * 0.05, '#1a3a10');
      if (p < 0.35) { const q = p / 0.35; for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + 0.3, r = U * 0.6 * q; g.a(1 - q).sq(b.x + cos(an) * r, b.y + sin(an) * r * 0.7 - sin(q * Math.PI) * U * 0.25, i % 2 ? '#c8f0e0' : '#ffffff', 2); } g.a(1 - q); rays(g, b.x, b.y, U * 0.1 + q * U * 0.2, 7, '#d8ffb0', 0.4, U * 0.2 * (1 - q)); }
      for (let i = 0; i < 14; i++) { const f = hsh(i, 5) * 0.5 + p * 0.9; if (f > 1) continue; const x = b.x + (hsh(i, 6) - 0.5) * R * 1.6 * burst + sin(f * 6 + i) * g.s * 3, y = gy - f * U * 1.4; g.a(0.6 * (1 - f) * (1 - fade)).disc(x, y, U * (0.09 + 0.1 * hsh(i, 7)) * (0.6 + f), i % 3 ? '#6ac040' : '#b8e870'); }
      for (let i = 0; i < 7; i++) { const f = (hsh(i, 9) + t * 3) % 1, x = b.x + (hsh(i, 10) - 0.5) * R * 1.5, y = gy + (hsh(i, 11) - 0.5) * R * 0.5 - f * g.s * 3; g.a((1 - f) * (1 - fade)).ring(x, y, g.s * 2, g.s * 2, '#d8ffb0', 1); } }
    g.a(1); };
  // 홀린 자가 일어섬: 글자가 쏟아져 바닥에 먹빛 웅덩이를 만들고, 거기서 사람의 꼴이 일어선다
  FX.possess = (g, a, b, t, o) => { const U = o.size, gy = b.y + U * 0.32, pour = seg(t, 0, 0.55), rise = ease(seg(t, 0.36, 0.84)), fade = seg(t, 0.86, 1), pk = ease(seg(t, 0.12, 0.5));
    g.a(0.9 * (1 - fade)).ell(b.x, gy, U * 0.44 * pk, U * 0.16 * pk, GLI).ring(b.x, gy, U * 0.44 * pk, U * 0.16 * pk, GLV, 1, f => ((f - t) * 10 + 10) % 1 < 0.5);
    for (let i = 0; i < 16; i++) { const f = pour * 1.5 - i * 0.055; if (f <= 0 || f >= 1) continue; const x = lerp(a.x, b.x, f) + sin(i * 2.4) * U * 0.1, y = lerp(a.y - U * 0.2, gy, f * f) - sin(f * Math.PI) * U * 0.7; g.a(1); glyph(g, x, y, i, i % 3 ? GLV : GLW); }
    if (rise > 0) { const h = U * 1.02 * rise, w = U * 0.23, body = e => [[b.x - w - e, gy], [b.x - w * 0.9 - e, gy - h * 0.66], [b.x - w * 0.5, gy - h * 0.8 - e], [b.x + w * 0.5, gy - h * 0.8 - e], [b.x + w * 0.9 + e, gy - h * 0.66], [b.x + w + e, gy]];
      g.a(1 - fade); g.poly(body(g.s), GLV).poly(body(0), GLI); g.disc(b.x, gy - h, U * 0.15 + g.s, GLV).disc(b.x, gy - h, U * 0.15, '#2a2040'); g.dot(b.x - g.s * 2, gy - h + g.s * 2, VOID, 4, 2); g.dot(b.x - g.s * 3, gy - h - g.s, '#ffffff', 2, 1).dot(b.x + g.s, gy - h - g.s, '#ffffff', 2, 1);
      const dq = (t * 5) % 1; glyph(g, b.x, gy - h + U * 0.1 + dq * U * 0.3, 2 + Math.floor(t * 5), GLV); glyph(g, b.x + g.s * 3, gy - h + U * 0.2 + ((dq + 0.5) % 1) * U * 0.3, 4, GLW);
      for (const sd of [-1, 1]) g.line(b.x + sd * w, gy - h * 0.62, b.x + sd * (w + g.s * 2), gy - h * 0.2, GLI, 3); if (rise < 1) for (let i = 0; i < 6; i++) g.dot(b.x + (hsh(i, 3) - 0.5) * U * 0.6, gy - hsh(i, 4) * h, i % 2 ? GLV : GLI, 2, 2); }
    g.a(1); };
  // 덫: 쇠 턱이 사슬에 끌려 미끄러져 와, 발밑에서 두 턱이 솟아 맞물린다
  FX.snare = (g, a, b, t, o) => { const U = o.size, gy = b.y + U * 0.34, fly = ease(seg(t, 0, 0.26)), open = t < 0.3 ? 1 : 1 - ease(seg(t, 0.3, 0.38)), fade = seg(t, 0.86, 1), L = U * 0.4, H = U * 0.62, st = '#8a92a8', dk = '#1b1d2a', hx0 = lerp(a.x, b.x, fly), hy0 = lerp(a.y + U * 0.3, gy, fly), sh = t > 0.38 && t < 0.7 ? sin(t * 60) * g.s * (1 - seg(t, 0.38, 0.7)) : 0, hx = hx0 + sh;
    g.a(1 - fade); const n = 12; for (let i = 0; i <= n; i++) { const f = i / n * (fly < 1 ? 1 : 0.5); g.dot(lerp(hx0 - L, a.x, f), lerp(hy0, a.y + U * 0.3, f) + sin(f * Math.PI) * U * 0.06, i % 2 ? st : dk, 2, 1); }
    g.ell(hx, hy0 + g.s, L * 1.1, U * 0.08, dk).ell(hx, hy0, L * 0.3, U * 0.05, '#4a5068');
    const jaw = (apex, front) => { const N = 14, pt = k => { const ph = k / N * Math.PI; return [hx - cos(ph) * L, hy0 + (apex - hy0) * sin(ph)]; };
      for (let k = 0; k < N; k++) { const p = pt(k), q = pt(k + 1); g.line(p[0], p[1], q[0], q[1], dk, 5); } for (let k = 0; k < N; k++) { const p = pt(k), q = pt(k + 1); g.line(p[0], p[1], q[0], q[1], front ? st : '#5a6278', 3); } if (front) for (let k = 1; k < N - 1; k++) { const p = pt(k); g.dot(p[0] - g.s, p[1] - g.s, '#dce4f4'); }
      for (let k = 2; k <= N - 2; k += 2) { const p = pt(k), cx = hx - p[0], cy = hy0 - U * 0.1 - p[1], cl = Math.hypot(cx, cy) || 1, dx = lerp(cx / cl, 0, open), dy = lerp(cy / cl, front ? -1 : -1, open), dl = Math.hypot(dx, dy) || 1, tl = U * 0.13; g.poly([[p[0] - g.s * 2, p[1]], [p[0] + g.s * 2, p[1]], [p[0] + dx / dl * tl, p[1] + dy / dl * tl]], front ? TOOTH : TOOTH2, dk); } };
    jaw(lerp(hy0 - H, hy0 - U * 0.15, open), false); jaw(lerp(hy0 - H + g.s * 3, hy0 + U * 0.15, open), true);
    for (const sd of [-1, 1]) g.sq(hx + sd * L, hy0, dk, 5).sq(hx + sd * L, hy0, '#dce4f4', 2);
    if (t >= 0.36 && t < 0.62) { const p = seg(t, 0.36, 0.62); g.a(1 - p); rays(g, b.x, gy - H * 0.6, U * 0.16 + p * U * 0.24, 9, '#ffffff', 0.3, U * 0.24 * (1 - p)); g.ring(b.x, gy, U * (0.4 + p * 0.3), U * (0.14 + p * 0.1), '#dce4f4', 1); }
    if (t >= 0.38) for (let i = 0; i < 7; i++) { const f = seg(t, 0.38 + i * 0.02, 0.8 + i * 0.02); if (f <= 0 || f >= 1) continue; const an = -Math.PI / 2 + (hsh(i, 2) - 0.5) * 2.4; g.a(1 - f).sq(b.x + cos(an) * U * 0.5 * f, gy - H * 0.5 + sin(an) * U * 0.4 * f + f * f * U * 0.4, i % 2 ? '#a8242c' : '#e06050', 2); }
    g.a(1); };
  // ── ART-INV2 끝
  const API = { unit, boss, icon, prewarm, role, roleDraw, ROLEC, SHOOT, ANIM, DEF, BOSS, P, PAD, lean, FX, fx, num, bar, tile, wallTop, entrance, room, ROOMS, aspIcon, clsIcon, sym, mockBoard, mockScene, ids: side => Object.keys(DEF).filter(k => (DEF[k].side || 'kin') === side) };
  if (typeof window !== 'undefined') window.LAIRART = API;
  return API;
})();
