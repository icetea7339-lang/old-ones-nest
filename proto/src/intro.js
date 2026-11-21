// 옛 것의 둥지 — 여는 영상 「그날 밤」. 이야기 1장 앞에 한 번 나오고, 장 고르기에서 다시 볼 수 있다.
// 별 사이 바다 → 잠긴 둥지 → 잠든 무르셀 → 일곱 바늘 → 뻗은 몸 → 잘려 나간 한 방울 → 떨어짐 → 들판 → 잔향.
// 그림은 전부 코드로 찍는 도트(낮은 해상도 캔버스를 키워서 보인다). 누르면 다음 줄, 건너뛰기는 전부 넘긴다.
// playIntro() → Promise(끝나거나 건너뛰면 풀린다). 시험용: window.__intro.go(n) 으로 n번째 장면에 간다.
const INTRO_CSS = `
#intro { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 60; background: #03040a; display: flex; flex-direction: column; color: #ece6d6; user-select: none; -webkit-user-select: none; }
#intro .ivw { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden; }
#intro canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; image-rendering: pixelated; image-rendering: crisp-edges; }
#intro .itx { flex: 0 0 auto; padding: 14px max(16px, env(safe-area-inset-right, 0px)) calc(18px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); background: linear-gradient(#03040a00, #03040a 22%); }
#intro .itx > div { max-width: 760px; margin: 0 auto; min-height: 4.6em; }
#intro .iwho { display: block; font-family: var(--display, sans-serif); font-size: 15px; color: #e8c030; margin-bottom: 4px; min-height: 1.1em; }
#intro .iline { font-family: var(--body, sans-serif); font-size: clamp(16px, 1.1vw + 11px, 21px); line-height: 1.6; word-break: keep-all; overflow-wrap: anywhere; white-space: normal; margin: 0; }
#intro .iline.echo { color: #fff3a0; }
#intro .itop { position: absolute; top: calc(10px + env(safe-area-inset-top, 0px)); right: max(10px, env(safe-area-inset-right, 0px)); left: max(10px, env(safe-area-inset-left, 0px)); display: flex; justify-content: space-between; align-items: center; gap: 8px; pointer-events: none; }
#intro .idots { display: flex; gap: 5px; flex-wrap: wrap; }
#intro .idots i { width: 6px; height: 6px; background: #3a3448; display: block; }
#intro .idots i.on { background: #e8c030; }
#intro .iskip { pointer-events: auto; font-family: var(--display, sans-serif); font-size: 15px; color: #ece6d6; background: #1a1626cc; border: 1px solid #4a3c58; padding: 8px 14px; min-height: 40px; cursor: pointer; white-space: nowrap; }
#intro .inext { display: block; margin-top: 6px; font-size: 13px; color: #8a8098; min-height: 1.2em; }
`;
const INTRO_LINES = [
  ['별 너머, 별과 별 사이의 어둠은 비어 있지 않다.', '그것은 무겁고 검은 물이다. 별 사이 바다.'],
  ['그 바다 밑에, 탑이 거꾸로 자란 도시가 떠 있다.', '「잠긴 둥지」. 누가 지었는지 묻는 자는 없다.'],
  ['그 안에서 무르셀이 잔다. 별 사이 바다에 가라앉은 자.', '눈꺼풀 하나가 산맥만 하다. 생김새를 끝까지 본 자는 없다.'],
  ['일곱 개의 바늘이 별 사이 바다를 꿰매고 있었다. 잠긴 둥지의 문을.', '그날 밤, 바늘 하나가 흐려졌다.'],
  ['무르셀은 배고픔을 꿈꾸었다.', '잠결에, 흐려진 틈 너머 작고 푸른 세상 쪽으로 몸 한 가닥을 뻗었다.'],
  ['바늘이 다시 조여들었다. 뻗은 끝이 잘려 나갔다.', '살 한 방울이 떨어져 나왔다.'],
  ['방울은 별 사이 바다를 건너 떨어졌다. 하늘을 태우며.', '들판 가장자리 마을, 물레골 사람들은 그것을 별똥별이라 불렀다.'],
  ['캄캄한 들판에 떨어진 것은 손바닥만 한 무언가였다.', '그 안에는 아주 작은 목소리 하나가 남아 있었다.'],
  [{ who: '잔향', text: '…들리나? 나는 잔향. 네 안에 남은 그의 목소리야.' }, { who: '잔향', text: '너는 무르셀의 한 방울. 먹고 자라서 둥지를 지어. 꿈을 퍼뜨려 바늘을 이리로 돌리면, 그가 올 수 있어.' }],
];
const IH = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const ICOL = { void: '#04050b', deep: '#070b16', band: '#0b1324', band2: '#0f1a30', teal: '#2fa8a0', tealL: '#5fe8f0', gold: '#e8c030', star: '#fff3a0', mass: '#080b15', rim: '#1b2940', rim2: '#2c4262', scale: '#122236', flesh: '#9fb8a8', fleshL: '#e0f8e8', fleshD: '#4a6a60', amber: '#ffb347', sky: '#0a0d1c', hill: '#05070d' };
function introPainter(x, W, H) {
  const px = (a, b, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), 1, 1); };
  const rc = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const disc = (cx, cy, r, c) => { x.fillStyle = c; for (let yy = -r; yy <= r; yy++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy))); x.fillRect(Math.round(cx - w), Math.round(cy + yy), w * 2 + 1, 1); } };
  const alpha = (a, f) => { x.globalAlpha = Math.max(0, Math.min(1, a)); f(); x.globalAlpha = 1; };
  const stars = (t, n, spd, dim) => { for (let k = 0; k < n; k++) { const layer = 1 + (k % 3), sx = ((IH(k, 1) * W * 1.4 - t * spd * layer) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2, sy = IH(k, 2) * H, tw = 0.5 + 0.5 * Math.sin(t * (1 + IH(k, 3) * 3) + k); alpha((dim || 1) * (0.25 + 0.6 * tw) * (layer / 3), () => px(sx, sy, k % 11 === 0 ? ICOL.tealL : k % 7 === 0 ? ICOL.star : '#c8d0e8')); } };
  const water = (t, a) => { alpha(a == null ? 1 : a, () => { for (let yy = 0; yy < H; yy += 2) for (let xx = 0; xx < W; xx += 1) { const v = Math.sin(xx * 0.045 + t * 0.5 + yy * 0.18) + Math.sin(xx * 0.017 - t * 0.3 + yy * 0.07); if (v > 1.55) px(xx, yy, v > 1.8 ? ICOL.band2 : ICOL.band); } }); };
  const bg = c => rc(0, 0, W, H, c || ICOL.void);
  const coil = (pts, w0, w1, t, seed) => {
    const N = 120; for (let k = 0; k <= N; k++) { const f = k / N, p = bez(pts, f), r = Math.max(1, Math.round(w0 + (w1 - w0) * f)); disc(p.x, p.y, r, '#020307'); }
    for (let k = 0; k <= N; k++) { const f = k / N, p = bez(pts, f), r = Math.max(1, Math.round(w0 + (w1 - w0) * f)); rc(p.x, p.y - r, 2, 1, '#2a4460'); px(p.x, p.y - r + 1, '#16263a'); px(p.x, p.y + r, '#0c1624');
      for (let q = 0; q < Math.min(14, 3 + r / 4); q++) { const ox = (IH(k + seed, q) - 0.5) * r * 1.6, oy = (IH(k + seed, q + 5) - 0.45) * r * 1.5; if (Math.hypot(ox, oy) < r - 1) px(p.x + ox, p.y + oy, q % 2 ? '#0a1424' : '#0e1c2e'); }
      if (k % 13 === 6) alpha(0.35 + 0.35 * Math.sin(t * 1.1 + k), () => px(p.x, p.y + r * 0.25, ICOL.teal)); }
  };
  const bez = (p, f) => { const a = 1 - f; if (p.length === 3) return { x: a * a * p[0][0] + 2 * a * f * p[1][0] + f * f * p[2][0], y: a * a * p[0][1] + 2 * a * f * p[1][1] + f * f * p[2][1] }; return { x: a * a * a * p[0][0] + 3 * a * a * f * p[1][0] + 3 * a * f * f * p[2][0] + f * f * f * p[3][0], y: a * a * a * p[0][1] + 3 * a * a * f * p[1][1] + 3 * a * f * f * p[2][1] + f * f * f * p[3][1] }; };
  const city = (cx, cy, s, t, glow) => {
    const n = 15, span = 80 * s; if (glow) for (let k = 0; k < 5; k++) alpha(0.035 + 0.01 * Math.sin(t), () => disc(cx, cy + 24 * s, Math.round((16 + k * 10) * s), '#2fa8a0'));
    rc(cx - span / 2, cy - 4 * s, span, Math.max(2, 5 * s), ICOL.rim); rc(cx - span / 2 + 2, cy - 5 * s, span - 4, 1, ICOL.rim2);
    for (let k = 0; k < n; k++) { const tx = cx - span / 2 + (k + 0.5) * span / n, len = (12 + IH(k, 9) * 46) * s * (k === 7 ? 1.4 : 1), w = Math.max(1, Math.round((2 + IH(k, 4) * 4) * s)); for (let yy = 0; yy < len; yy++) { const ww = Math.max(1, Math.round(w * (1 - Math.max(0, (yy - len * 0.7) / (len * 0.3)) * 0.8))); rc(tx - ww / 2, cy + yy, ww, 1, yy % 9 === 0 ? ICOL.rim : '#0c1322'); } for (let q = 0; q < len / 7; q++) if (IH(k, q) > 0.55) alpha(0.4 + 0.6 * Math.abs(Math.sin(t * 0.7 + k + q)), () => px(tx, cy + 3 + q * 7, ICOL.tealL)); const up = (3 + IH(k, 8) * 10) * s; rc(tx - 1, cy - 4 * s - up, Math.max(1, w - 1), up, '#0c1322'); }
  };
  const eye = (cx, cy, wd, open, t, look) => {
    const hh = Math.max(0.6, open * wd * 0.26), lk = look || 0, ir = wd * 0.34;
    if (open < 0.1) { for (let xx = -wd - 4; xx <= wd + 4; xx++) { const f = Math.max(0, 1 - (xx / (wd + 4)) ** 2), bh = Math.round(wd * 0.2 * f); rc(cx + xx, cy - bh, 1, bh * 2 + 1, '#060a14'); px(cx + xx, cy - bh, '#1e3048'); if (f > 0.05) alpha(0.45 + 0.3 * Math.sin(t * 1.1 + xx * 0.08), () => px(cx + xx, cy, xx % 3 ? '#b07a24' : '#e8a840')); if (f > 0.2 && IH(xx, 7) > 0.8) px(cx + xx, cy + 1, '#3a2410'); } return; }
    if (open > 0.15) alpha(0.10 + 0.06 * Math.sin(t * 2), () => disc(cx + lk, cy, Math.round(ir * 1.9), '#9ad040'));
    for (let xx = -wd; xx <= wd; xx++) { const f = 1 - (xx / wd) * (xx / wd), h = hh * f; if (h < 0.5) continue; for (let yy = -Math.ceil(h); yy <= Math.ceil(h); yy++) { const dx = xx - lk, r = Math.hypot(dx, yy * 1.05) / ir, dth = ((Math.round(cx + xx) + Math.round(cy + yy)) & 1); let c;
      if (r < 1) { if (Math.abs(dx) < Math.max(1, ir * 0.12 * (1 - Math.abs(yy) / (ir + 1)))) c = '#000000'; else c = r < 0.35 ? (dth ? '#f0ffb0' : '#c8f070') : r < 0.7 ? (dth ? '#a8d848' : '#7aa830') : r < 0.9 ? (dth ? '#5a8020' : '#3a5a18') : '#1e2a0c'; }
      else c = (Math.abs(yy) / h > 0.8) ? '#0c0a0a' : (dth && IH(xx, yy) > 0.93 ? '#5a1a14' : '#1a1512');
      px(cx + xx, cy + yy, c); } }
    for (let xx = -wd - 3; xx <= wd + 3; xx++) { const f = Math.max(0, 1 - (xx / (wd + 3)) * (xx / (wd + 3))), h = hh * f; rc(cx + xx, cy - h - 3, 1, 3, '#05070c'); px(cx + xx, cy - h - 3, ICOL.rim2); rc(cx + xx, cy + h + 1, 1, 2, '#05070c'); if (open < 0.2 && f > 0.1) alpha(0.35 + 0.25 * Math.sin(t * 1.2 + xx * 0.05), () => px(cx + xx, cy, '#c89a30')); }
  };
  const needle = (nx, ny, len, a, t, k) => { alpha(a, () => { rc(nx, ny - len / 2, 1, len, '#f8f0c0'); rc(nx, ny - len / 2, 1, 3, '#ffffff'); const tw = 1 + Math.round(1.5 + Math.sin(t * 3 + k)); rc(nx - tw, ny - len / 2 + 1, tw * 2 + 1, 1, ICOL.star); rc(nx, ny - len / 2 + 1 - tw, 1, tw * 2 + 1, ICOL.star); }); };
  const drop = (cx, cy, r, glow) => { if (glow) alpha(glow, () => disc(cx, cy, r * 3, ICOL.teal)); disc(cx, cy, r + 1, ICOL.fleshD); disc(cx, cy, r, ICOL.flesh); disc(cx - r * 0.35, cy - r * 0.4, Math.max(1, Math.round(r * 0.35)), ICOL.fleshL); };
  return { px, rc, disc, alpha, stars, water, bg, coil, bez, city, eye, needle, drop };
}
const INTRO_SHOTS = [
  (P, W, H, t) => { P.bg(); P.water(t, Math.min(1, t / 2)); P.stars(t, 170, 2); if (t < 1.5) P.alpha(1 - t / 1.5, () => P.rc(0, 0, W, H, '#000')); },
  (P, W, H, t) => { P.bg(); P.water(t); P.stars(t, 70, 1, 0.5); const s = Math.min(W, H * 1.6) / 160 * (1 + t * 0.015), cx = W / 2 + Math.sin(t * 0.2) * 6, cy = H * 0.32 + Math.sin(t * 0.4) * 2; P.city(cx, cy, s, t, true); for (let k = 0; k < 18; k++) { const by = (H - ((t * (8 + k % 5 * 3) + IH(k, 7) * H) % H)), bx = cx + (IH(k, 6) - 0.5) * 90 * s + Math.sin(t + k) * 2; P.alpha(0.6, () => P.px(bx, by, '#3a5a78')); } },
  (P, W, H, t) => {
    P.bg('#0a1120'); P.water(t, 0.9); const br = Math.sin(t * 0.6) * 2, pan = t * 1.2;
    for (let k = 0; k < 30; k++) P.alpha(0.5, () => P.px((IH(k, 41) * W * 1.2 - pan * 0.5) % W, (IH(k, 42) * H + t * 3) % H, '#2a3a52'));
    P.coil([[-60, H * 1.25 + br], [W * 0.15 - pan, H * 0.25], [W * 0.85 - pan, H * 1.4], [W + 60, H * 0.62 + br]], Math.round(H * 0.34), Math.round(H * 0.26), t, 3);
    P.coil([[W + 40, -H * 0.1], [W * 0.6 - pan, H * 0.36 + br], [W * 0.1 - pan, -H * 0.3], [-40, H * 0.12]], Math.round(H * 0.16), Math.round(H * 0.1), t, 9);
    const ew = Math.round(Math.min(W * 0.3, 80)); P.eye(W * 0.5 - pan * 0.3, H * 0.66 + br, ew, 0.03, t);
    P.eye(W * 0.2 - pan * 0.3, H * 0.83 + br, Math.round(ew * 0.45), 0.03, t + 1); P.eye(W * 0.8 - pan * 0.3, H * 0.86 + br, Math.round(ew * 0.35), 0.03, t + 2);
    P.city(W * 0.62, H * 0.2, 0.16, t, false); P.alpha(0.8, () => { P.px(W * 0.62, H * 0.2 + 2, ICOL.tealL); P.px(W * 0.62 + 3, H * 0.2 + 4, ICOL.tealL); });
    if (t < 1.2) P.alpha(1 - t / 1.2, () => P.rc(0, 0, W, H, '#000'));
  },
  (P, W, H, t) => {
    P.bg(); P.stars(t, 140, 1.2, 0.8); P.water(t, 0.4); const n = 7, x0 = W * 0.1, x1 = W * 0.9, dim = Math.max(0, Math.min(1, (t - 4.5) / 2.5)), arc = xx => H * 0.52 - Math.sin(Math.PI * (xx - x0) / (x1 - x0)) * H * 0.12;
    for (let xx = Math.floor(x0 - 10); xx < x1 + 10; xx++) { const f = Math.max(0, Math.sin(Math.PI * (xx - x0 + 10) / (x1 - x0 + 20))), h = Math.round(6 * f), y = arc(Math.max(x0, Math.min(x1, xx))); for (let k = 3; k > 0; k--) P.alpha(0.08, () => P.rc(xx, y - h - k * 3, 1, (h + k * 3) * 2 + 1, '#2fa8a0')); P.rc(xx, y - h, 1, h * 2 + 1, '#000000'); if (h > 1 && IH(xx, 3) > 0.85) P.alpha(0.5, () => P.px(xx, y + (IH(xx, 4) - 0.5) * h, '#3a2a10')); }
    for (let k = 0; k < n - 1; k++) { const ax = x0 + (x1 - x0) * k / (n - 1), bx = x0 + (x1 - x0) * (k + 1) / (n - 1), slack = (k === 3 || k === 4) ? dim * 7 : 0; for (let s = 0; s <= 1; s += 0.015) { const xx = ax + (bx - ax) * s, yy = arc(xx), y1 = yy - 10 + 20 * s + Math.sin(s * Math.PI) * slack, y2 = yy + 10 - 20 * s + Math.sin(s * Math.PI) * slack; P.alpha(0.5 - (slack ? dim * 0.25 : 0), () => { P.px(xx, y1, '#d8c070'); P.px(xx, y2, '#d8c070'); }); } }
    for (let k = 0; k < n; k++) { const nx = Math.round(x0 + (x1 - x0) * k / (n - 1)), ny = arc(nx), fl = k === 4 ? (t > 3 ? (Math.random() < 0.3 ? 0.25 : 1) * (1 - dim * 0.85) : 1) : 1;
      P.alpha(fl, () => { for (let yy = -16; yy <= 16; yy++) P.alpha(fl * (1 - Math.abs(yy) / 20), () => P.px(nx, ny + yy, yy < -10 ? '#ffffff' : '#f0e0a0')); P.alpha(fl * 0.25, () => P.disc(nx, ny - 14, 4, '#fff3a0')); P.needle(nx, ny - 13, 2, fl, t, k); }); }
  },
  (P, W, H, t) => {
    P.bg('#03040a'); P.water(t, 0.5); const open = Math.min(1, t / 3), ew = Math.round(Math.min(W * 0.42, 120)), ex = W * 0.62, ey = H * 0.46;
    P.coil([[W + 40, H * 1.1], [W * 0.8, H * 0.7], [W * 0.95, H * 0.2], [W + 40, -10]], Math.round(H * 0.2), Math.round(H * 0.12), t, 21);
    P.eye(ex, ey, ew, open, t, -ew * 0.2 * Math.min(1, t / 4));
    const reach = Math.max(0, Math.min(1, (t - 3.5) / 5)); if (reach > 0) { const pts = [[W * 0.9, H * 0.92], [W * 0.6, H * 1.05], [W * 0.35, H * 0.7], [W * 0.92 - (W * 0.78) * reach, H * 0.82 - H * 0.25 * reach]]; const N = Math.round(60 * reach); for (let k = 0; k <= N; k++) { const p = P.bez(pts, k / 60), r = Math.max(1, Math.round(9 - 7 * k / 60)); P.disc(p.x, p.y, r, ICOL.mass); P.px(p.x, p.y - r, ICOL.rim2); if (k % 5 === 2) P.px(p.x, p.y + r - 1, '#2a4a5e'); } }
    P.alpha(0.25 + 0.6 * reach, () => { P.disc(W * 0.1, H * 0.55, 6, '#1a4a8a'); P.disc(W * 0.1 - 2, H * 0.55 - 2, 3, '#3a8a6a'); P.px(W * 0.1 - 3, H * 0.55 - 4, '#c8e8ff'); });
  },
  (P, W, H, t, I) => {
    P.bg(); P.stars(t, 90, 1, 0.6); const cy = H * 0.5, gx = W * 0.5, snap = 1.6, after = Math.max(0, t - snap);
    for (let xx = 0; xx < W; xx++) { const f = Math.sin(Math.PI * Math.min(1, Math.max(0, xx / W))), h = 4 * f; P.rc(xx, cy - h, 1, h * 2 + 1, '#010103'); }
    const tight = Math.min(1, t / snap); for (let k = 0; k < 3; k++) { const nx = gx + (k - 1) * W * 0.22; P.needle(nx, cy, 30, 1, t, k); }
    for (let s = 0; s <= 1; s += 0.01) { const xx = gx - W * 0.22 + W * 0.44 * s, sag = (1 - tight) * 7 * Math.sin(s * Math.PI); P.alpha(0.7, () => { P.px(xx, cy - 8 + 16 * ((s * 2) % 1) + sag, '#e8d080'); P.px(xx, cy + 8 - 16 * ((s * 2) % 1) + sag, '#e8d080'); }); }
    const tipX = gx + W * 0.03 + after * W * 0.5, pts = [[W + 30, H * 0.85], [W * 0.8, H * 0.6], [W * 0.65, cy + 6], [after > 0 ? tipX : gx, cy]]; for (let k = 0; k <= 60; k++) { const p = P.bez(pts, k / 60), r = Math.max(1, Math.round(10 - 8 * k / 60)); P.disc(p.x, p.y, r, ICOL.mass); P.px(p.x, p.y - r, ICOL.rim2); }
    if (after > 0) { const ea = Math.min(after, 1.6) + Math.max(0, after - 1.6) * 0.15, dx = gx - ea * W * 0.16, dy = cy + ea * H * 0.14, rr = 3; for (let k = 1; k < 10; k++) P.alpha(0.5 - k * 0.05, () => P.px(dx + k * 2, dy - k, ICOL.tealL)); P.drop(dx, dy, rr, 0.18); }
    if (t > snap && !I.fl5) { I.fl5 = 1; I.flash('#fff8e0', 420); I.shake(380, 3); typeof sfx === 'function' && sfx('hit'); }
  },
  (P, W, H, t) => {
    const atm = Math.max(0, Math.min(1, (t - 3.5) / 3)); P.bg(); if (atm > 0) P.alpha(atm, () => { for (let yy = 0; yy < H; yy++) { const f = yy / H; P.rc(0, yy, W, 1, f < 0.5 ? '#0a1430' : f < 0.8 ? '#10204a' : '#1a2c5a'); } });
    for (let k = 0; k < 90; k++) { const sx = IH(k, 1) * W, sy = ((IH(k, 2) * H * 2 + t * (60 + k % 4 * 30)) % (H * 1.3)) - H * 0.15, len = 2 + (k % 4) * 2 + (1 - atm) * 4; P.alpha((1 - atm * 0.7) * 0.7, () => P.rc(sx, sy - len, 1, len, '#c8d0e8')); }
    const cx = W * 0.5 + Math.sin(t * 2.2) * 2, cy = H * 0.55; for (let k = 1; k < 28; k++) { const c = atm > 0 ? (k < 6 ? '#ffffff' : k < 14 ? '#ffd23a' : '#ff7a2a') : (k < 8 ? ICOL.tealL : ICOL.teal); P.alpha(Math.max(0, 0.9 - k / 28) * (atm > 0 ? 1 : 0.7), () => P.rc(cx - Math.max(1, 3 - k / 10), cy - k * 2, Math.max(1, 6 - k / 5), 2, c)); }
    if (atm > 0) for (let k = 0; k < 6; k++) P.alpha(atm * 0.8, () => P.px(cx + (IH(k, Math.floor(t * 10)) - 0.5) * 14, cy - IH(k + 3, Math.floor(t * 10)) * 20, '#ffd23a'));
    P.drop(cx, cy, 3, atm > 0 ? 0.25 : 0.15); if (atm > 0.6) P.alpha((atm - 0.6) * 2.5, () => { for (let xx = 0; xx < W; xx++) P.rc(xx, H - 6 - Math.round(3 * Math.sin(xx * 0.05) + 2 * Math.sin(xx * 0.13)), 1, 12, ICOL.hill); });
  },
  (P, W, H, t, I) => {
    P.bg(ICOL.sky); for (let k = 0; k < 50; k++) P.alpha(0.3 + 0.3 * Math.sin(t + k), () => P.px(IH(k, 1) * W, IH(k, 2) * H * 0.55, '#a8b0c8'));
    const hz = H * 0.66; for (let xx = 0; xx < W; xx++) P.rc(xx, hz - Math.round(6 * Math.sin(xx * 0.03 + 1) + 3 * Math.sin(xx * 0.11)), 1, H, ICOL.hill);
    for (let k = 0; k < 4; k++) P.alpha(0.6 + 0.4 * Math.sin(t * 2 + k), () => P.px(W * 0.86 + k * 3, hz - 4 - (k % 2), '#ffd27a'));
    for (let k = 0; k < 40; k++) { const gx = IH(k, 5) * W, gy = hz + 4 + IH(k, 6) * (H - hz - 6); P.px(gx, gy, '#0e1418'); P.px(gx, gy - 1, '#141c22'); }
    const hit = 1.2, ix = W * 0.42, iy = hz + (H - hz) * 0.45;
    if (t < hit) { const f = t / hit, sx = W * 1.05 + (ix - W * 1.05) * f, sy = -10 + (iy + 10) * f; for (let k = 0; k < 20; k++) P.alpha(1 - k / 20, () => P.rc(sx + k * 3, sy - k * 2.2, 2, 2, k < 4 ? '#ffffff' : k < 10 ? '#ffd23a' : '#ff7a2a')); }
    else { const af = t - hit; if (!I.fl7) { I.fl7 = 1; I.flash('#ffe8c0', 300); I.shake(420, 4); typeof sfx === 'function' && sfx('down'); }
      P.alpha(Math.max(0, 0.5 - af * 0.12), () => P.disc(ix, iy, Math.round(10 + af * 4), ICOL.amber)); for (let k = 0; k < 26; k++) { const a = IH(k, 11) * 3.14, v = 10 + IH(k, 12) * 30, dx = ix + Math.cos(a) * v * Math.min(1, af) * (k % 2 ? 1 : -1), dy = iy - Math.sin(a) * v * 0.5 * Math.min(1, af) + af * af * 6; P.alpha(Math.max(0, 1 - af / 2.5), () => P.px(dx, dy, '#5a4a3a')); }
      P.alpha(Math.min(1, af / 2), () => P.drop(ix, iy - 1, 2, 0.12 + 0.08 * Math.sin(t * 3))); }
  },
  (P, W, H, t) => {
    P.bg('#020306'); const cx = W / 2, cy = H * 0.5, s = 1 + 0.06 * Math.sin(t * 1.4);
    for (let k = 0; k < 3; k++) { const ph = ((t * 0.45 + k / 3) % 1), r = 8 + ph * Math.min(W, H) * 0.5; P.alpha((1 - ph) * 0.5, () => { for (let a = 0; a < 6.283; a += 0.02) P.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, ICOL.teal); }); }
    P.drop(cx, cy, Math.round(9 * s), 0.12 + 0.05 * Math.sin(t * 1.4)); P.px(cx - 2, cy + 1, '#1a2a24'); P.px(cx + 2, cy + 1, '#1a2a24');
  },
];
function playIntro(opts) {
  opts = opts || {}; return new Promise(resolve => {
    if (!document.getElementById('introcss')) { const st = document.createElement('style'); st.id = 'introcss'; st.textContent = INTRO_CSS; document.head.appendChild(st); }
    const old = document.getElementById('intro'); if (old) old.remove();
    const root = document.createElement('div'); root.id = 'intro'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', '여는 이야기');
    root.innerHTML = `<div class="ivw"><canvas></canvas><div class="itop"><div class="idots">${INTRO_SHOTS.map(() => '<i></i>').join('')}</div><button class="iskip" type="button">건너뛰기</button></div></div><div class="itx"><div><span class="iwho"></span><p class="iline"></p><span class="inext"></span></div></div>`;
    document.body.appendChild(root);
    const cv = root.querySelector('canvas'), x = cv.getContext('2d'), vw = root.querySelector('.ivw'), whoEl = root.querySelector('.iwho'), lineEl = root.querySelector('.iline'), nextEl = root.querySelector('.inext'), dots = [...root.querySelectorAll('.idots i')];
    const motion = () => typeof motionOk === 'function' ? motionOk() : true;
    const I = { shot: 0, line: 0, t0: 0, typed: 0, lineT: 0, done: false, flashUntil: 0, flashCol: '#fff', shakeUntil: 0, shakeMag: 0, W: 0, H: 0 };
    I.flash = (col, ms) => { I.flashCol = col; I.flashUntil = performance.now() + (motion() ? ms : Math.min(ms, 90)); };
    I.shake = (ms, mag) => { if (!motion()) return; I.shakeUntil = performance.now() + ms; I.shakeMag = mag; };
    typeof musicTemp === 'function' && musicTemp('story');
    const lineObj = () => { const l = INTRO_LINES[I.shot][I.line]; return typeof l === 'string' ? { who: '', text: l } : l; };
    const showLine = () => { const l = lineObj(); whoEl.textContent = l.who || ''; lineEl.classList.toggle('echo', !!l.who); I.typed = 0; I.lineT = performance.now(); lineEl.textContent = ''; nextEl.textContent = ''; };
    const goShot = n => { I.shot = n; I.line = 0; I.t0 = performance.now(); I.fl5 = 0; I.fl7 = 0; dots.forEach((d, k) => d.classList.toggle('on', k <= n)); showLine(); };
    const finish = () => { if (I.done) return; I.done = true; cancelAnimationFrame(I.raf); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); root.remove(); typeof musicBack === 'function' && musicBack(); try { META.introSeen = 1; typeof saveMeta === 'function' && saveMeta(); } catch (e) { /* 저장이 안 되어도 넘어간다 */ } resolve(); };
    const advance = () => { const l = lineObj(); if (I.typed < l.text.length) { I.typed = l.text.length; return; } if (I.line + 1 < INTRO_LINES[I.shot].length) { I.line++; showLine(); return; } if (I.shot + 1 < INTRO_SHOTS.length) goShot(I.shot + 1); else finish(); };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); finish(); } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); } };
    root.querySelector('.iskip').addEventListener('click', e => { e.stopPropagation(); finish(); });
    root.addEventListener('click', e => { if (e.target.closest('.iskip')) return; typeof sfx === 'function' && sfx('click'); advance(); });
    window.addEventListener('keydown', onKey);
    const fit = () => { const r = vw.getBoundingClientRect(), H = 180, W = Math.max(120, Math.min(420, Math.round(H * Math.max(0.5, r.width / Math.max(1, r.height))))); if (W !== I.W) { cv.width = W; cv.height = H; I.W = W; I.H = H; } };
    window.addEventListener('resize', fit); fit();
    const frame = () => {
      if (I.done) return; const nowT = performance.now(), t = (nowT - I.t0) / 1000, l = lineObj();
      if (I.typed < l.text.length) { I.typed = Math.min(l.text.length, Math.floor((nowT - I.lineT) / 1000 * 26)); lineEl.textContent = l.text.slice(0, I.typed); if (I.typed >= l.text.length) I.lineT = nowT; }
      else { lineEl.textContent = l.text; nextEl.textContent = '누르면 다음 ▸'; if (!opts.manual && !I.hold && nowT - I.lineT > Math.max(2600, l.text.length * 95)) advance(); }
      const W = I.W, H = I.H; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
      if (nowT < I.shakeUntil) { const m = I.shakeMag * (I.shakeUntil - nowT) / 400; x.setTransform(1, 0, 0, 1, Math.round((Math.random() - 0.5) * m * 2), Math.round((Math.random() - 0.5) * m * 2)); }
      const P = introPainter(x, W, H); try { INTRO_SHOTS[I.shot](P, W, H, t, I); } catch (e) { console.error(e); }
      x.setTransform(1, 0, 0, 1, 0, 0); if (nowT < I.flashUntil) { x.globalAlpha = Math.min(0.85, (I.flashUntil - nowT) / 300); x.fillStyle = I.flashCol; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
      I.raf = requestAnimationFrame(frame);
    };
    window.__intro = { go: n => { goShot(Math.max(0, Math.min(INTRO_SHOTS.length - 1, n))); }, at: sec => { I.t0 = performance.now() - sec * 1000; }, get shot() { return I.shot; }, get line() { return I.line; }, get done() { return I.done; }, shots: INTRO_SHOTS.length, hold: v => { I.hold = !!v; }, typeAll: () => { I.typed = lineObj().text.length; }, skip: finish, advance };
    goShot(0); I.raf = requestAnimationFrame(frame);
  });
}
window.playIntro = playIntro;
