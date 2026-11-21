// 옛 것의 둥지 — 유전자대로 조립하는 몸 (traits.js 의 genome → 캔버스)
// 차례: 그림자 → 뒤쪽 것(날개막, 꼬리, 뒷다리) → 몸통(자세·대칭) → 앞다리·뿌리 → 형질 부위(무게 큰 것부터, 정해진 자리에) → 짝 덧칠 → 이름 붙은 형태의 표지
// 빛은 왼쪽 위, 얼굴은 왼쪽을 본다. 같은 genome 은 늘 같은 몸.
const BODYGEN = (function () {
  const SIZE = [32, 32, 40, 48, 56, 64];
  const cache = {};
  const PARTPAL = {
    spore: ['#102410', '#8fd05f', '#e0f8a0', '#3f8a3a'], egg: ['#2a2418', '#e8dcb8', '#fffbe8', '#b0a07a'], bone: BONE_R,
    eye: null, glow: null, star: ['#1a1030', '#fff3a0', '#ffffff', '#c8a030'], water: ['#081a2a', '#3fb8d0', '#c8f4ff', '#1a6a88'],
    shell: null, gut: ['#2a0a0e', '#a83a4a', '#f08a90', '#5a1420'], tongue: ['#2a0a0e', '#e0607a', '#ffb0c0', '#9a2a40'],
    mirror: ['#1b1d2a', '#c8d8e8', '#ffffff', '#7a8aa8'], shadow: ['#05040a', '#2a2238', '#4a3c5a', '#140f1e'], root: ['#1a1008', '#7a5a3a', '#b8946a', '#4a3020'],
    horn: ['#1b1d2a', '#e4dfd0', '#ffffff', '#8a8478'], spike: null
  };
  const IRIS = { abyss: '#9fe8f0', nebula: '#fff3a0', brood: '#f0e060', dusk: '#ffb060', hunger: '#ff5f57' };
  const ck = g => [g.aspect, g.sub, g.stage, g.seed, TRAITS.topTags(g, 5).map(t => t + ':' + Math.round((g.tags[t] || 0) * 4)).join(',')].join('|');
  const tone = (p, q, k) => [p[0], mixh(p[1], q[1], k), mixh(p[2], q[2], k), mixh(p[3], q[3], k)];

  function build(g) {
    const key = ck(g); if (cache[key]) return cache[key];
    const N = SIZE[Math.max(1, Math.min(5, g.stage || 1))], K = Sculpt(N), R = TRAITS.rng(TRAITS.hash(key)), rr = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rr(a, b + 1));
    const cls = TRAITS.classOf(g), P = (PAL[g.aspect] || PAL.base).slice(0, 5), Q = (g.sub && PAL[g.sub]) ? PAL[g.sub].slice(0, 5) : P, top = TRAITS.topTags(g, 5), sh = t => TRAITS.share(g, t), has = t => top.includes(t) && sh(t) > 0.05;
    const s = N / 48, gy = N - 2, fl = cls.loco === 'float';
    // ---- 몸통 크기와 자리 ----
    let legH = { crawl: 1.5, l2: 13, l4: 10, l6: 8, many: 6, float: 9, root: 5, slither: 1 }[cls.loco] * s;
    let rx, ry; ({ low: () => { rx = 17; ry = 8.5; }, up: () => { rx = 10; ry = 13; }, crouch: () => { rx = 13.5; ry = 11.5; }, sag: () => { rx = 15.5; ry = 10; } })[cls.post]();
    if (cls.sym === 'rad') { const m = (rx + ry) / 2; rx = m; ry = m * 0.95; }
    rx *= s; ry *= s; if (cls.loco === 'l2') ry *= 1.08;
    // 캔버스 안에 들도록: 다리 + 몸 + 머리 + 뿔·별 자리
    { const plan0 = cls.plan || 'blob', hd = cls.post === 'up' && plan0 !== 'pear' ? rx * 1.25 : plan0 === 'neck' ? ry * 0.9 : 0, est = legH + 2 * ry + hd + 7 * s, room = N - 4; if (est > room) { const f = room / est; rx *= Math.max(0.8, f); ry *= f; legH *= f; } }
    const cx = N / 2 + (cls.loco === 'slither' ? 3 * s : 0), cy = gy - legH - ry + (cls.loco === 'crawl' || cls.loco === 'slither' ? 1 : 0);
    const B = { cx, cy, rx, ry, top: cy - ry, bot: cy + ry, left: cx - rx, right: cx + rx };
    // 고개: 곧게 선 것은 머리를 따로 얹는다
    const plan = cls.plan || 'blob';
    let headR = cls.post === 'up' && plan !== 'pear' ? Math.max(3, rx * 0.72) : 0, head = headR ? { x: cx - rx * 0.15, y: B.top - headR * 0.55, r: headR } : { x: B.left + rx * 0.35, y: cy - ry * 0.25, r: ry * 0.55 };
    if (plan === 'neck' && !headR) { headR = Math.max(3, ry * 0.62); head = { x: B.left - headR * 0.2, y: B.top - headR * 0.4, r: headR }; }
    if (plan === 'pear') head = { x: cx - rx * 0.2, y: cy - ry * 0.45, r: ry * 0.58 };
    if (plan === 'seg') { headR = 0; head = { x: B.left + rx * 0.2, y: cy - ry * 0.05, r: ry * 0.62 }; }
    if (!fl) K.shadow(cx, Math.max(5, rx * 0.95)); else K.flat(K.el(cx, N - 1.5, rx * 0.6, 1.2), '#05040a66');

    // ---- 뒤쪽 것 ----
    if (has('wing')) { const w = 1 + Math.min(2, Math.floor(sh('wing') * 6)), WP = tone(PARTPAL.shadow, P, 0.5); for (let k = 0; k < w; k++) { const bx = cx + rx * (0.1 + k * 0.25), by = B.top + ry * 0.3; K.G([[bx, by], [bx + rx * (0.9 + k * 0.2), by - ry * (1.1 + k * 0.25) - 2 * s], [bx + rx * (1.1 + k * 0.2), by - ry * 0.1], [bx + rx * 0.4, by + ry * 0.5]], WP); for (let i = 1; i < 3; i++) K.L([[bx, by], [bx + rx * (0.9 + k * 0.2) * (0.5 + i * 0.2), by - ry * (1.1 + k * 0.25) * (0.6 + i * 0.15)]], 0.7, 0.5, [P[0], P[3], P[1], P[3]]); } }
    if (cls.loco === 'slither') K.L([[cx + rx * 0.6, cy + ry * 0.4], [cx + rx * 1.1, gy - 2 * s], [N - 3, gy - 1], [N - 1, gy - 4 * s]], ry * 0.55, 1, P);
    if (cls.loco === 'float' || has('tent')) {
      const n = has('tent') ? 2 + Math.min(4, Math.floor(sh('tent') * 10)) : 3, TP = has('tent') ? tone(P, PARTPAL.water, 0.25) : P;
      for (let k = 0; k < n; k++) { const x0 = B.left + rx * 0.3 + k * (rx * 1.4 / n), wob = rr(-3, 3) * s, len = (fl ? legH + 4 * s : 6 * s + sh('tent') * 14 * s); K.L([[x0, cy + ry * 0.6], [x0 + wob, cy + ry * 0.6 + len * 0.5], [x0 - wob * 0.6, Math.min(gy, cy + ry * 0.6 + len)]], Math.max(1, 1.8 * s), 0.6, TP); }
    }
    // 다리 (뒤)
    const legs = (pairs, back) => { for (let k = 0; k < pairs; k++) { const f = pairs === 1 ? 0.5 : k / (pairs - 1), x0 = B.left + rx * (0.45 + f * 1.1) + (back ? 2 * s : 0), y0 = cy + ry * 0.55, kneeOut = (f - 0.5) * 6 * s + (back ? 2 * s : 0), LP = back ? [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)] : P;
      if (has('bone') && !back) K.L([[x0, y0], [x0 + kneeOut - 2 * s, y0 + legH * 0.55], [x0 + kneeOut * 1.3, gy]], 2 * s, 1.2 * s, BONE_R); else K.L([[x0, y0], [x0 + kneeOut - 2 * s, y0 + legH * 0.55], [x0 + kneeOut * 1.3, gy]], 2.1 * s, 1.1 * s, LP);
      if (has('spike') && !back) K.px(x0 + kneeOut - 3 * s, y0 + legH * 0.5, '#fbf7ea'); } };
    const pairsOf = { l2: 1, l4: 2, l6: 3, many: 5 }[cls.loco] || 0;
    if (pairsOf && cls.loco !== 'l2') legs(pairsOf, true);

    // ---- 몸통 ----
    const BP = tone(P, Q, g.sub ? 0.25 : 0);
    if (cls.sym === 'asym') { const side = R() < 0.5 ? -1 : 1; K.B(cx + side * rx * 0.7, cy + ry * 0.2, rx * 0.55, ry * 0.65, BP); }
    if (cls.post === 'sag') for (let k = 0; k < 3; k++) K.B(B.left + rx * (0.5 + k * 0.5), cy + ry * 0.65, rx * 0.32, ry * 0.45, BP);
    if (has('shell')) { const SP = tone(PARTPAL.root, P, 0.55); K.B(cx + rx * 0.08, cy - ry * 0.12, rx * 1.08, ry * 0.92, SP); }
    if (plan === 'seg') { const n = cls.sym === 'rad' ? 3 : 4; for (let k = n - 1; k >= 0; k--) { const f = k / (n - 1), sx = B.left + rx * 0.25 + f * rx * 1.5, sr = ry * (1 - f * 0.35); K.B(sx, cy + f * ry * 0.15, Math.max(2, rx / n * 1.25), Math.max(2, sr), BP); } }
    else if (plan === 'pear') { K.B(cx + rx * 0.05, cy + ry * 0.25, rx, ry * 0.8, BP); K.B(cx - rx * 0.2, cy - ry * 0.45, rx * 0.62, ry * 0.6, BP); }
    else { if (plan === 'neck') K.L([[cx - rx * 0.4, cy - ry * 0.3], [head.x + head.r * 0.2, head.y + head.r * 0.4]], Math.max(1.6, ry * 0.38), Math.max(1.2, head.r * 0.55), BP); K.B(cx, cy, rx, ry, BP); }
    if (cls.sym === 'rad') { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, x = cx + Math.cos(a) * rx * 0.62, y = cy + Math.sin(a) * ry * 0.62; K.px(x, y, P[3]); } }
    if (headR) K.B(head.x, head.y, headR, headR * 0.92, BP);
    if (has('shell')) { const n = 3 + Math.floor(sh('shell') * 6); for (let k = 0; k < n; k++) { const x = B.left + rx * 0.5 + k * (rx * 1.5 / n); K.L([[x, cy - ry * 0.85], [x - 1 * s, cy + ry * 0.2]], 0.6, 0.6, [P[0], P[0], P[3], P[0]]); } }
    if (has('mirror')) { const MP = PARTPAL.mirror; for (let k = 0; k < 2; k++) { const x = B.left + rx * (0.6 + k * 0.6); K.L([[x, cy - ry * 0.45], [x + 3 * s, cy + ry * 0.25]], 0.5, 0.5, [mixh(MP[2], P[2], 0.4), mixh(MP[2], P[2], 0.4), mixh(MP[2], P[2], 0.4), MP[1]], mixh(MP[1], P[1], 0.5)); } }
    if (has('gut')) { const GP = PARTPAL.gut; K.flat(K.el(cx + rx * 0.05, cy + ry * 0.25, rx * 0.5, ry * 0.42), GP[3], P[0]); K.flat(K.el(cx + rx * 0.05, cy + ry * 0.22, rx * 0.4, ry * 0.32), GP[1]); for (let k = 0; k < 3; k++) K.px(cx - rx * 0.2 + k * rx * 0.2, cy + ry * 0.3 + (k % 2), BONE_R[1]); }
    if (has('shadow')) { for (let k = 0; k < 10; k++) { const a = R() * Math.PI * 2, d = 1.05 + R() * 0.25; K.px(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, '#2a2238'); } K.flat(K.cut(K.el(cx, cy, rx, ry), (x, y) => y > cy + ry * 0.2), mixh(P[3], '#05040a', 0.6)); }

    // ---- 앞다리 / 뿌리 / 기는 혹 ----
    if (pairsOf) legs(cls.loco === 'l2' ? 1 : pairsOf, false);
    if (cls.loco === 'l2') { K.L([[cx + rx * 0.3, cy + ry * 0.6], [cx + rx * 0.45, cy + ry * 0.6 + legH * 0.5], [cx + rx * 0.3, gy]], 2.1 * s, 1.1 * s, P); }
    if (cls.loco === 'crawl' || cls.loco === 'slither') for (let k = 0; k < 4; k++) K.B(B.left + rx * (0.4 + k * 0.45), gy - 1, 1.6 * s, 1.2 * s, P);
    if (cls.loco === 'root' || has('root')) { const RP = PARTPAL.root, n = 3 + Math.floor(sh('root') * 8); for (let k = 0; k < n; k++) { const x0 = B.left + rx * 0.3 + k * (rx * 1.4 / n), dx = rr(-6, 6) * s; K.L([[x0, cy + ry * 0.7], [x0 + dx * 0.5, gy - 1], [x0 + dx, gy]], 1.6 * s, 0.6, RP); } }

    // ---- 형질 부위 ----
    const nOf = (t, lo, hi) => Math.max(lo, Math.min(hi, lo + Math.floor(sh(t) * 10)));
    const backPt = f => ({ x: B.left + rx * (0.35 + f * 1.3), y: cy - ry * Math.sqrt(Math.max(0, 1 - Math.pow((0.35 + f * 1.3 - 1), 2))) });
    if (has('spike')) { const n = nOf('spike', 3, 8); for (let k = 0; k < n; k++) { const p = backPt(k / Math.max(1, n - 1)), h = (3 + R() * 3) * s; K.G([[p.x - 1.5 * s, p.y + 1], [p.x + 0.5 * s, p.y - h], [p.x + 1.8 * s, p.y + 1]], [P[0], BONE_R[1], BONE_R[2], BONE_R[3]]); } }
    if (has('bone')) { const n = nOf('bone', 2, 6); for (let k = 0; k < n; k++) { const p = backPt(0.1 + k * 0.8 / n); K.B(p.x, p.y + 1, 2.2 * s, 1.5 * s, BONE_R); } K.L([[B.left + rx * 0.4, cy + ry * 0.1], [B.right - rx * 0.4, cy + ry * 0.15]], 0.7, 0.7, BONE_R); }
    if (has('spore')) { const n = nOf('spore', 2, 7); for (let k = 0; k < n; k++) { const p = backPt(R()), r = (1.6 + R() * 1.8) * s; K.B(p.x, p.y - r * 0.4, r, r, PARTPAL.spore); K.px(p.x, p.y - r * 0.4, '#3f8a3a'); } for (let k = 0; k < n + 2; k++) K.px(B.left + R() * rx * 2, B.top - R() * 6 * s, '#c8f08a'); }
    if (has('egg')) { const n = nOf('egg', 2, 6), ex = cls.sym === 'asym' ? B.right - rx * 0.3 : B.left + rx * 0.5; for (let k = 0; k < n; k++) K.B(ex + (k % 3) * 2.6 * s, cy + ry * 0.55 - Math.floor(k / 3) * 2.4 * s, 1.6 * s, 1.9 * s, PARTPAL.egg); }
    if (has('glow')) { const GL = IRIS[g.aspect] || '#fff3a0', n = nOf('glow', 2, 7); for (let k = 0; k < n; k++) { const x = B.left + rx * (0.3 + R() * 1.4), y = cy + ry * (R() * 1.2 - 0.6); K.px(x, y, '#ffffff'); K.px(x + 1, y, GL); K.px(x, y + 1, GL); } }
    if (has('star')) { const n = nOf('star', 1, 4); for (let k = 0; k < n; k++) { const x = B.left + R() * rx * 2, y = B.top - (2 + R() * 6) * s; K.spark(x, y, '#fff3a0', true); } K.flat(K.cut(K.el(head.x, head.y - head.r * 0.2, head.r * 1.15, head.r * 0.4), (x, y) => y < head.y - head.r * 0.2), '#fff3a0'); }
    if (has('horn')) { const n = Math.min(3, 1 + Math.floor(sh('horn') * 6)); for (let k = 0; k < n; k++) K.L([[head.x + (k - 0.5) * 2.4 * s, head.y - head.r * 0.6], [head.x + (k - 1) * 4 * s - 1, head.y - head.r - 5 * s], [head.x + (k - 1) * 6 * s, head.y - head.r - 7 * s]], 1.6 * s, 0.6, PARTPAL.horn); }
    // 얼굴 쪽
    const faceX = head.x - head.r * (headR ? 0.1 : 0.2), faceY = head.y;
    if (has('face')) { const n = nOf('face', 1, 4); drawMask(K, faceX, faceY, Math.max(2, head.r * 0.6), Math.max(2.4, head.r * 0.72), ri(0, 2)); for (let k = 1; k < n; k++) { const p = backPt(0.2 + k * 0.25); drawMask(K, p.x, p.y + 2 * s, 1.8 * s, 2.1 * s, (k + 1) % 3); } }
    if (has('maw')) { const w = Math.max(3, rx * (0.5 + sh('maw') * 0.6)), my = has('face') ? cy + ry * 0.35 : faceY + head.r * 0.35, mx = B.left + w * 0.55 + (headR ? 2 * s : 0); K.flat(K.el(mx, my, w * 0.55, Math.max(1.5, ry * 0.32)), '#1a0508', P[0]); K.flat(K.el(mx, my + 1, w * 0.35, Math.max(1, ry * 0.18)), '#5a0c14'); K.fangs(Math.round(mx - w * 0.45), Math.round(mx + w * 0.45), Math.round(my - Math.max(1.5, ry * 0.32) + 1), 1, Math.max(2, Math.round(2.4 * s)), Math.max(2, Math.round(2 * s))); }
    if (has('tongue')) { const TP = PARTPAL.tongue, my = faceY + head.r * 0.4; K.L([[B.left + 1, my], [B.left - 3 * s, my + 4 * s], [B.left - 1 * s, Math.min(gy, my + 8 * s + sh('tongue') * 10 * s)]], 1.6 * s, 1 * s, TP); }
    if (has('eye') || !has('face')) {
      const ne = has('eye') ? nOf('eye', 1, 7) : 1, iris = IRIS[g.sub || g.aspect] || '#f0d060', slit = g.aspect === 'abyss' || g.aspect === 'hunger';
      K.eye(faceX - (has('maw') ? 0 : 1), faceY - head.r * 0.25, Math.max(1.2, Math.min(3.6 * s, head.r * 0.32)), iris, slit);
      for (let k = 1; k < ne; k++) { const p = cls.sym === 'rad' ? { x: cx + Math.cos(k / ne * 6.28) * rx * 0.55, y: cy + Math.sin(k / ne * 6.28) * ry * 0.55 } : backPt(0.15 + (k - 1) * 0.75 / Math.max(1, ne - 1)); K.eye(p.x, p.y + 1.5 * s, Math.max(1.1, (1.2 + R() * 1.2) * s), iris, slit); }
    }
    if (has('water')) { const WP = PARTPAL.water, n = nOf('water', 3, 6), tips = []; for (let k = 0; k < n; k++) { const p = backPt(k / Math.max(1, n - 1)), h = (3 + (k % 2 ? 0 : 2) + sh('water') * 5) * s; tips.push([p.x, p.y, p.x + 1.5 * s, p.y - h]); }
      for (let k = 0; k + 1 < tips.length; k++) K.flat(K.poly([[tips[k][0], tips[k][1] + 1], [tips[k][2], tips[k][3]], [tips[k + 1][2], tips[k + 1][3] + 1.5 * s], [tips[k + 1][0], tips[k + 1][1] + 1]]), mixh(WP[1], P[1], 0.35), P[0]);
      for (const t of tips) K.L([[t[0], t[1] + 1], [t[2], t[3]]], 0.7, 0.5, [WP[0], WP[2], WP[2], WP[3]], WP[0]);
      for (let k = 0; k < 3; k++) K.L([[cx - rx * 0.1 + k * 2 * s, cy - ry * 0.1], [cx - rx * 0.15 + k * 2 * s, cy + ry * 0.35]], 0.5, 0.5, [WP[3], WP[3], WP[3], WP[3]], WP[3]); for (let k = 0; k < 4; k++) K.px(B.left + R() * rx * 2, cy + ry + R() * 3 * s, WP[2]); }
    if (has('trap')) { const TP = [P[0], BONE_R[1], BONE_R[2], BONE_R[3]], tx = B.right + 1 * s; K.L([[tx - 3 * s, gy], [tx + 4 * s, gy - 4 * s]], 0.8, 0.8, TP); K.L([[tx + 9 * s, gy], [tx + 3 * s, gy - 4 * s]], 0.8, 0.8, TP); for (let k = 0; k < 3; k++) K.px(tx + k * 2 * s, gy - 1, '#fbf7ea'); }
    if (has('swarm')) { const n = nOf('swarm', 2, 5); for (let k = 0; k < n; k++) { const x = 3 + R() * (N - 6), y = gy - 1.5 * s; K.B(x, y, 1.7 * s, 1.4 * s, P); K.px(x - 0.5 * s, y - 0.5 * s, '#ffffff'); } }
    if (has('alone')) { K.L([[cx - rx * 0.2, cy - ry * 0.3], [cx + rx * 0.3, cy + ry * 0.2]], 0.5, 0.5, [P[0], P[0], P[0], P[0]], P[0]); K.L([[cx + rx * 0.1, cy - ry * 0.5], [cx + rx * 0.5, cy - ry * 0.1]], 0.5, 0.5, [P[0], P[0], P[0], P[0]], P[0]); }

    // ---- 짝 덧칠 ----
    for (const c of TRAITS.combosOf(g).slice(0, 2)) {
      if (c.id === 'eye+maw' && has('maw')) K.eye(B.left + rx * 0.5, cy + ry * 0.35, 1.4 * s, '#ff5f57', true);
      else if (c.id === 'water+spore') for (let k = 0; k < 5; k++) K.px(B.left + R() * rx * 2, B.top + R() * ry, '#9fe8f0');
      else if (c.id === 'star+glow' || c.id === 'eye+glow') K.flat(K.el(cx, cy, 1.6 * s, 1.6 * s), '#fff3a0');
      else K.px(cx + rx * 0.4, cy - ry * 0.6, Q[2]);
    }
    // ---- 이름 붙은 형태: 몸 둘레의 빛 ----
    const lm = TRAITS.landmarkOf(g); if (lm) { const col = IRIS[g.aspect] || '#fff3a0'; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, d = 1 + (k % 2) * 0.12; K.px(cx + Math.cos(a) * (rx + 3 * s) * d, cy + Math.sin(a) * (ry + 3 * s) * d, k % 2 ? '#ffffff' : col); } }
    return (cache[key] = K.canvas());
  }
  return { build, SIZE };
})();
if (typeof window !== 'undefined') window.__body = { build: g => BODYGEN.build(g), TRAITS };
