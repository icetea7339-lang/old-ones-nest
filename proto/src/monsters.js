// 옛 것의 둥지 — 본체의 모습. 징조 다섯 × 허물 네 번 = 스무 가지 괴물.
// 허물을 벗을 때마다 부위가 느는 것이 아니라 다른 생물이 된다. 캔버스도 커진다(32 → 40 → 48 → 52).
// 조각 도구(Sculpt): 모양(가림판)을 만들고, 명암을 입히고, 윤곽선을 두른다. 빛은 왼쪽 위에서 온다.
const _c32 = {};
const C32 = h => _c32[h] || (_c32[h] = (() => { const v = parseInt(h.slice(1, 7), 16), a = h.length > 7 ? parseInt(h.slice(7, 9), 16) : 255; return ((a << 24) | ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255)) >>> 0; })());
const mixh = (a, b, k) => { const f = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), A = f(a), B = f(b); return '#' + A.map((v, n) => Math.round(v + (B[n] - v) * k).toString(16).padStart(2, '0')).join(''); };
const BONE_R = ['#1b1d2a', '#e4dfd0', '#ffffff', '#a8a294'], INKY = '#0c0812';
function Sculpt(N) {
  const buf = new Uint32Array(N * N), K = { N }, at = (m, x, y) => x >= 0 && y >= 0 && x < N && y < N && m[y * N + x];
  K.px = (x, y, col) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) buf[y * N + x] = C32(col); };
  K.rect = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) K.px(x + i, y + j, col); };
  K.mask = () => new Uint8Array(N * N);
  K.el = (cx, cy, rx, ry, m) => { m = m || K.mask(); for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(N - 1, Math.ceil(cy + ry)); y++) for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(N - 1, Math.ceil(cx + rx)); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1.0001) m[y * N + x] = 1; } return m; };
  K.cap = (m, x0, y0, x1, y1, r0, r1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) { const f = i / n; K.el(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, Math.max(0.5, r0 + (r1 - r0) * f), Math.max(0.5, r0 + (r1 - r0) * f), m); } return m; };
  K.path = (pts, r0, r1, m) => { m = m || K.mask(); const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const T = L[L.length - 1] || 1; for (let i = 1; i < pts.length; i++) K.cap(m, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], r0 + (r1 - r0) * L[i - 1] / T, r0 + (r1 - r0) * L[i] / T); return m; };
  K.poly = (pts, m) => { m = m || K.mask(); for (let y = 0; y < N; y++) { const yy = y + 0.5, xs = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort((p, q) => p - q); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(N - 1, Math.floor(xs[k + 1] - 0.5)); x++) m[y * N + x] = 1; } return m; };
  K.cut = (m, fn) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y * N + x] && !fn(x, y)) m[y * N + x] = 0; return m; };
  K.commit = (m, shade, oc) => { if (oc) { const o = C32(oc); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!m[y * N + x] && (at(m, x - 1, y) || at(m, x + 1, y) || at(m, x, y - 1) || at(m, x, y + 1))) buf[y * N + x] = o; } for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y * N + x]) { const c = shade(x, y, m); if (c) buf[y * N + x] = C32(c); } return m; };
  const deep = p => p[5] || (p[5] = mixh(p[3], p[0], 0.5)), hi = p => p[6] || (p[6] = mixh(p[2], '#ffffff', 0.55));
  // 둥근 몸: 왼쪽 위가 밝고 오른쪽 아래가 어둡다
  K.ball = (m, cx, cy, rx, ry, p, oc) => K.commit(m, (x, y) => { const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy), v = (-dx * 0.5 - dy * 0.72) * 0.8 + (1 - d) * 0.3; return v > 0.6 ? p[2] : v > 0.1 ? p[1] : v > -0.36 ? p[3] : deep(p); }, oc === undefined ? p[0] : oc);
  // 가는 것(다리, 촉수, 뿔): 가장자리만 보고 밝은 쪽과 그늘진 쪽을 가른다
  K.lit = (m, p, oc) => K.commit(m, (x, y) => { const up = !at(m, x, y - 1), lf = !at(m, x - 1, y), dn = !at(m, x, y + 1), rt = !at(m, x + 1, y); return (dn || rt) && !(up && lf) ? p[3] : (up || lf) ? p[2] : p[1]; }, oc === undefined ? p[0] : oc);
  K.flat = (m, col, oc) => K.commit(m, () => col, oc);
  K.B = (cx, cy, rx, ry, p, oc) => { K.ball(K.el(cx, cy, rx, ry), cx, cy, rx, ry, p, oc); if (rx >= 4 && ry >= 3) { K.px(cx - rx * 0.42, cy - ry * 0.52, hi(p)); if (rx >= 7) K.px(cx - rx * 0.42 + 1, cy - ry * 0.52, hi(p)); } };
  K.L = (pts, r0, r1, p, oc) => K.lit(K.path(pts, r0, r1), p, oc);
  K.G = (pts, p, oc) => K.lit(K.poly(pts), p, oc);
  // 눈: 눈구멍, 흰자, 눈동자, 반짝임. slit = 세로로 찢어진 동공
  K.eye = (cx, cy, r, iris, slit, lid) => { K.flat(K.el(cx, cy, r + 1, r + 1), INKY); K.flat(K.el(cx, cy, r, r), r < 1.6 ? iris : '#f2ecd8'); if (r >= 1.6) { K.flat(K.el(cx, cy, r * 0.62, r * 0.62), iris); if (slit) K.rect(Math.round(cx), Math.round(cy - r * 0.6), 1, Math.max(2, Math.round(r * 1.2)), INKY); else K.flat(K.el(cx, cy, Math.max(0.5, r * 0.3), Math.max(0.5, r * 0.3)), INKY); K.px(cx - r * 0.4, cy - r * 0.45, '#ffffff'); } if (lid) K.rect(Math.round(cx - r), Math.round(cy - r), Math.round(r * 2) + 1, Math.max(1, Math.round(r * lid)), INKY); };
  // 이빨 한 줄: dir 1 = 아래로, -1 = 위로
  K.fangs = (x0, x1, y, dir, len, step, col) => { for (let x = x0, k = 0; x <= x1; x += step || 2, k++) { const l = Math.max(1, len - (k % 2 ? 1 : 0)); for (let i = 0; i < l; i++) K.px(x, y + dir * i, i === l - 1 && l > 2 ? '#cfc8b4' : (col || '#fbf7ea')); if (l > 2) K.px(x + 1, y, '#cfc8b4'); } };
  K.spark = (x, y, col, on) => { K.px(x, y, '#ffffff'); if (on) { K.px(x - 1, y, col); K.px(x + 1, y, col); K.px(x, y - 1, col); K.px(x, y + 1, col); } };
  K.shadow = (cx, w) => K.flat(K.el(cx, N - 1.5, w, 1.4), '#05040a88');
  K.canvas = () => { const c = document.createElement('canvas'); c.width = c.height = N; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buf.buffer), N, N), 0, 0); return c; };
  return K;
}
// 가면: 황혼의 것들이 쓰는 흰 얼굴. mood 0 웃음, 1 울상, 2 무표정
function drawMask(K, cx, cy, rx, ry, mood) { K.ball(K.el(cx, cy, rx, ry), cx, cy, rx, ry, BONE_R); const ex = Math.max(1, Math.round(rx * 0.45)), ey = Math.round(cy - ry * 0.2); K.rect(Math.round(cx - ex - (rx > 3 ? 1 : 0)), ey, rx > 3 ? 2 : 1, ry > 3 ? 2 : 1, INKY); K.rect(Math.round(cx + ex), ey, rx > 3 ? 2 : 1, ry > 3 ? 2 : 1, INKY); const my = Math.round(cy + ry * 0.5); if (mood === 2) K.rect(Math.round(cx - 1), my, 3, 1, '#7a121c'); else { K.rect(Math.round(cx - 1), my, 3, 1, '#7a121c'); K.px(cx - 2, my + (mood ? 1 : -1), '#7a121c'); K.px(cx + 2, my + (mood ? 1 : -1), '#7a121c'); } if (rx > 3) K.px(cx - ex, ey + 3, '#c8303a'); }

const FORMS = {};
// ---------- 한 방울 ----------
FORMS.base = (K, st, P, Q, fr) => {
  const b = fr % 2; K.shadow(16, 7);
  K.flat(K.el(16, 29, 8, 1.5), mixh(P[3], P[0], 0.4), P[0]);                               // 고인 물
  K.B(16, 24 + b * 0.5, 6, 5 - b * 0.5, P); K.L([[16, 20], [17, 16], [15, 13 - b]], 2.2, 0.8, P);
  K.flat(K.el(14, 24, 1.4, 2), INKY); K.px(14, 23, '#ffffff'); K.px(20, 26, P[3]); K.px(11, 27, P[2]);
  return { cx: 16, cy: 24, R: 5, top: 19, bot: 28 };
};
// ---------- 심연 ----------
FORMS.abyss1 = (K, st, P, Q, fr) => {          // 젖은 것: 눈만 큰 올챙이
  const s = [0, 1, 0, -1][fr]; K.shadow(15, 11);
  K.G([[21, 19], [27, 12 + s], [31, 5 + s], [29, 15 + s], [24, 24]], [P[0], P[3], Q[1], mixh(P[3], P[0], 0.4)]);                // 꼬리 지느러미
  K.L([[20, 23], [25, 20], [28, 14 + s], [29, 8 + s]], 3.4, 1, P);
  K.L([[6, 17], [3, 13 - s]], 1.3, 0.7, [P[0], Q[1], Q[2], P[3]]); K.L([[8, 15], [7, 10 + s]], 1.3, 0.7, [P[0], Q[1], Q[2], P[3]]);  // 아가미 술
  K.B(13, 22, 9, 7, P); K.flat(K.cut(K.el(13, 25, 7, 3.4), (x, y) => y > 25), mixh(P[2], '#ffffff', 0.2));                  // 배
  K.eye(10, 20, 4, '#f0d060', true); K.rect(15, 26, 4, 1, P[0]); K.px(19, 25, P[0]);
  K.B(9, 29, 2.4, 1.6, P); K.B(18, 29.4, 2.2, 1.4, P);
  return { cx: 13, cy: 22, R: 8, top: 14, bot: 29, head: [10, 13], back: [[17, 16], [22, 19], [13, 15]], belly: [14, 26], side: [20, 22], under: [[8, 30], [14, 30], [20, 30]] };
};
FORMS.abyss2 = (K, st, P, Q, fr) => {          // 등불을 드리운 아귀: 몸의 절반이 입
  const s = [0, 1, 0, -1][fr], LURE = ['#3a2a10', '#ffd23a', '#fff3a0', '#c8901a']; K.shadow(20, 16);
  K.G([[31, 22], [38, 15], [39, 24], [38, 33], [32, 30]], [P[0], P[3], Q[1], mixh(P[3], P[0], 0.4)]);                         // 꼬리
  for (let k = 0; k < 4; k++) K.G([[18 + k * 4, 16], [20 + k * 4, 9 + (k % 2) * 2], [22 + k * 4, 16]], [P[0], Q[1], Q[2], P[3]]);      // 등 가시
  K.B(20, 25, 15, 10, P);
  K.G([[29, 27], [36, 26 + s], [34, 34]], [P[0], P[3], Q[1], mixh(P[3], P[0], 0.4)]);                                          // 가슴지느러미
  K.flat(K.el(16, 29, 12, 5.4), '#1a0508', P[0]); K.flat(K.el(16, 30, 8, 3), '#5a0c14');                                    // 입 안
  K.fangs(6, 26, 25, 1, 5, 3); K.fangs(7, 25, 33, -1, 4, 3);
  K.L([[8, 35], [16, 37], [24, 35]], 1.6, 1.6, P);                                                                           // 아랫입술
  K.eye(27, 18, 2.6, '#ffd23a', true); K.eye(21, 17, 1.4, '#ffd23a');
  K.L([[17, 16], [12, 8], [15, 3 + s], [21, 4 + s]], 1.3, 0.8, P); K.B(23, 7 + s, 3, 3, LURE); K.spark(23, 7 + s, '#fff3a0', fr % 2 === 0);  // 등불
  K.B(11, 37.5, 3, 1.6, P); K.B(27, 37.5, 3, 1.6, P);
  return { cx: 20, cy: 25, R: 12, top: 15, bot: 37, head: [20, 12], back: [[30, 19], [14, 17], [24, 16]], belly: [26, 31], side: [33, 24], under: [[12, 38], [20, 38], [28, 38]] };
};
FORMS.abyss3 = (K, st, P, Q, fr) => {          // 바닥을 기는 갑주: 집게 둘, 마디진 등, 자루눈
  const s = [0, 1, 0, -1][fr], SH = [P[0], mixh(P[3], P[1], 0.5), P[1], P[3]], GL = '#9fe8f0'; K.shadow(25, 21);
  for (let k = 0; k < 4; k++) { const x0 = 14 + k * 7, o = (k + fr) % 2; K.L([[x0, 34], [x0 - 3 + o, 40], [x0 - 5 + o, 46]], 2, 1, P); K.L([[x0 + 4, 35], [x0 + 6 - o, 41], [x0 + 5 - o, 46]], 1.8, 1, [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)]); }
  K.L([[38, 27], [45, 22], [44, 13 + s]], 3, 2.4, [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)]); K.B(44, 10 + s, 4, 4.4, SH); K.G([[41, 7 + s], [43, 0 + s], [45, 6 + s]], SH); K.G([[45, 7 + s], [48, 2 + s], [47, 9 + s]], SH);   // 뒤 집게
  K.B(26, 27, 18, 12, SH);                                                                                                   // 등딱지
  for (let k = 0; k < 4; k++) { const x0 = 15 + k * 7; for (let y = 16; y < 39; y++) { const dy = (y - 27) / 12, e = Math.sqrt(Math.max(0, 1 - dy * dy)); if (Math.abs(x0 - 26) < 18 * e - 1) { K.px(x0 + Math.round((1 - e) * -3), y, P[0]); K.px(x0 + 1 + Math.round((1 - e) * -3), y, y < 26 ? P[2] : P[1]); } } }
  for (let k = 0; k < 5; k++) K.G([[13 + k * 6, 17 + Math.abs(k - 2)], [15 + k * 6, 10 + Math.abs(k - 2) * 2], [18 + k * 6, 17 + Math.abs(k - 2)]], [P[0], Q[1], Q[2], Q[3]]);   // 등 가시
  K.L([[19, 18], [17, 10], [17, 6 - s]], 1.2, 1, P); K.eye(17, 5 - s, 2, GL, true); K.L([[26, 17], [28, 9], [29, 5 + s]], 1.2, 1, P); K.eye(29, 4 + s, 2, GL, true);   // 자루눈
  K.flat(K.el(13, 33, 5, 3), '#1a0508', P[0]); K.fangs(10, 16, 31, 1, 3, 2); K.L([[8, 33], [5, 37]], 1.2, 0.8, P); K.L([[17, 35], [19, 39]], 1.2, 0.8, P);            // 입과 턱다리
  K.L([[12, 27], [5, 23], [4, 14 - s]], 3.6, 3, P); K.B(5, 10 - s, 5.4, 5.4, SH);                                              // 앞 집게
  K.G([[1, 8 - s], [3, -1 - s], [6, 6 - s]], SH); K.G([[6, 7 - s], [11, 0 - s], [10, 9 - s]], SH); K.flat(K.poly([[4, 6 - s], [5, 1 - s], [7, 6 - s]]), '#1a0508');
  return { cx: 26, cy: 27, R: 14, top: 14, bot: 45, head: [23, 9], back: [[20, 19], [32, 19], [38, 23]], belly: [28, 34], side: [40, 28], under: [[14, 46], [26, 46], [38, 46]] };
};
FORMS.abyss4 = (K, st, P, Q, fr) => {          // 잠든 해구의 주인: 똬리 위로 솟은 목, 등지느러미, 줄지은 눈
  const s = [0, 1, 0, -1][fr], BL = [P[0], mixh(P[2], '#ffffff', 0.15), '#ffffff', P[1]], FN = [P[0], Q[1], Q[2], Q[3]], GL = '#ffd23a'; K.shadow(27, 23);
  K.L([[42, 44], [49, 38], [48, 30 + s], [44, 26 + s]], 3.4, 1, P); K.G([[44, 27 + s], [50, 20 + s], [47, 30 + s]], FN);                // 꼬리
  K.B(34, 41, 17, 9, P); K.flat(K.cut(K.el(34, 44, 14, 5), (x, y) => y > 44 && (x + y) % 3 !== 0), BL[1]);                       // 뒤 똬리
  K.B(17, 44, 13, 7, P); K.flat(K.cut(K.el(17, 46, 10, 4), (x, y) => y > 46 && (x + y) % 3 !== 0), BL[1]);                        // 앞 똬리
  const neck = [[31, 38], [39, 29], [36, 19], [27, 13], [20, 11]];
  for (let k = 0; k < 6; k++) { const f = k / 5, px0 = 39 - f * 12, py0 = 30 - f * 18; K.G([[px0 + 3, py0 + 2], [px0 + 10 - f * 3, py0 - 5 + s * (k % 2)], [px0 + 1, py0 - 5]], FN); }   // 등지느러미
  K.L(neck, 7.2, 5.4, P);
  K.commit(K.cut(K.path(neck, 7.2, 5.4), (x, y) => { let best = 99; for (let i = 0; i < 40; i++) { const f = i / 39, a = neck[Math.min(3, Math.floor(f * 4))], b = neck[Math.min(4, Math.floor(f * 4) + 1)], g = f * 4 - Math.floor(f * 4), cx = a[0] + (b[0] - a[0]) * g - 3.2, cy = a[1] + (b[1] - a[1]) * g + 2.6, d = Math.hypot(x - cx, y - cy); if (d < best) best = d; } return best < 3.1 && (x + y * 2) % 4 !== 0; }), () => BL[1]);   // 배 비늘
  [[33, 22], [36, 28], [29, 16]].forEach(([ex, ey], k) => K.eye(ex, ey, 1.6, GL, false, (fr + k) % 4 === 0 ? 1 : 0));           // 목의 눈
  K.G([[20, 6], [22, -1], [25, 6]], FN); K.G([[14, 6], [17, 0], [20, 6]], FN); K.G([[9, 8], [11, 2], [15, 7]], FN);                // 볏
  K.B(15, 14.5, 8, 3.6, P); K.B(16, 9.5, 9, 5.4, P);                                                                           // 아래턱, 머리
  K.flat(K.el(11, 13, 7, 1.6), '#1a0508'); K.fangs(5, 17, 12, 1, 3, 2); K.fangs(6, 16, 14, -1, 2, 3);
  K.eye(18, 8, 2.4, GL, true); K.px(7, 9, P[0]);
  K.L([[9, 16], [6, 22], [8, 27 + s]], 1, 0.6, [P[0], Q[2], Q[2], Q[1]]); K.L([[14, 17], [13, 23], [15, 28 - s]], 1, 0.6, [P[0], Q[2], Q[2], Q[1]]);   // 수염
  return { cx: 28, cy: 30, R: 15, top: 5, bot: 49, head: [17, 2], back: [[40, 32], [44, 40], [30, 36]], belly: [22, 44], side: [41, 24], under: [[10, 50], [26, 50], [42, 50]] };
};

const GOLD_R = ['#3a2a10', '#e8c030', '#fff3a0', '#a87e14'], EGG_R = ['#3a3410', '#f0e060', '#fff8b0', '#c8a820'], ROOT_R = ['#1e140a', '#6b4a2a', '#b08a50', '#3a2816'], TONGUE_R = ['#5a0c14', '#e8505a', '#ff9a8a', '#b8303a'];
const SW = fr => [0, 1, 0, -1][fr];
const ringM = (K, cx, cy, rx, ry, th) => { const inner = K.el(cx, cy, Math.max(0.5, rx - th), Math.max(0.5, ry - th)); return K.cut(K.el(cx, cy, rx, ry), (x, y) => !inner[y * K.N + x]); };
// 보석 면: 왼쪽 면은 바탕, 가운데 모서리는 밝게, 오른쪽 면은 그늘
const gem = (K, pts, cx, p) => { const top = Math.min.apply(null, pts.map(q => q[1])); return K.commit(K.poly(pts), (x, y) => y < top + 3 ? p[2] : x < cx - 1 ? p[1] : x > cx ? p[3] : p[2], p[0]); };
const stripes = (K, m, fn) => K.commit(m, fn);
// ---------- 성운 ----------
FORMS.nebula1 = (K, st, P, Q, fr) => {         // 빛나는 것: 떠다니는 외눈
  const s = SW(fr), RAY = [P[0], Q[2], '#ffffff', Q[1]]; K.shadow(16, 6);
  K.G([[9, 14 + s], [0, 9 + s], [3, 15 + s], [0, 22 + s], [9, 18 + s]], RAY); K.G([[23, 14 + s], [31, 9 + s], [28, 15 + s], [31, 22 + s], [23, 18 + s]], RAY);
  K.L([[16, 21 + s], [18, 25], [15, 28], [16, 30]], 2.6, 0.6, P);
  K.B(16, 15 + s, 8, 8, P); K.eye(16, 15 + s, 4.8, '#ffd23a', true);
  K.spark(5, 5, P[2], fr % 2 === 0); K.spark(27, 3, '#fff3a0', fr % 2 === 1); K.px(24, 27, P[2]); K.px(8, 26, '#fff3a0');
  return { cx: 16, cy: 15, R: 8, top: 7, bot: 24, head: [16, 5], back: [[22, 9], [10, 9], [16, 7]], belly: [16, 22], side: [24, 16], under: [[12, 25], [16, 27], [20, 25]] };
};
FORMS.nebula2 = (K, st, P, Q, fr) => {         // 눈을 품은 수정: 살이 아니라 모난 돌이 됐다
  const s = SW(fr), QR = [P[0], Q[1], Q[2], Q[3]]; K.shadow(20, 11);
  gem(K, [[7, 11 - s], [11, 16 - s], [10, 28 - s], [7, 32 - s], [4, 27 - s], [4, 16 - s]], 7, QR); gem(K, [[33, 8 - s], [37, 14 - s], [36, 25 - s], [33, 29 - s], [30, 25 - s], [30, 13 - s]], 33, QR);
  gem(K, [[20, 2 + s], [28, 11 + s], [28, 26 + s], [20, 35 + s], [12, 26 + s], [12, 11 + s]], 20, P);
  K.eye(20, 18 + s, 4.4, '#ffd23a', true);
  [[3, 5], [36, 34], [29, 2], [9, 36]].forEach(([dx, dy], k) => { const o = (fr + k) % 2; K.G([[dx, dy - 2 + o], [dx + 2, dy + o], [dx, dy + 2 + o], [dx - 2, dy + o]], k % 2 ? QR : P); });
  K.spark(15, 9 + s, '#ffffff', fr % 2 === 0); K.px(24, 30 + s, P[2]);
  return { cx: 20, cy: 19, R: 9, top: 3, bot: 35, head: [20, 2], back: [[27, 11], [13, 11], [33, 9]], belly: [20, 29], side: [28, 20], under: [[13, 32], [20, 37], [27, 32]] };
};
FORMS.nebula3 = (K, st, P, Q, fr) => {         // 도는 고리의 눈: 몸은 가운데 하나, 나머지는 궤도
  const s = SW(fr), cy = 23 + s, QR = [P[0], Q[1], Q[2], Q[3]]; K.shadow(24, 15);
  [[5, 4], [43, 4], [5, 42], [43, 42]].forEach(([tx, ty]) => K.flat(K.poly([[tx, ty + s], [24 + (tx < 24 ? -3 : 3), cy], [24, cy + (ty < 24 ? -3 : 3)]]), mixh(P[3], P[0], 0.35)));
  K.lit(ringM(K, 24, cy, 21.4, 21.4, 2.6), P);
  K.lit(K.cut(ringM(K, 24, cy, 21, 7.4, 2.2), (x, y) => y < cy), GOLD_R); K.lit(K.cut(ringM(K, 24, cy, 7.4, 21, 2.2), (x, y) => x < 24), QR);
  K.B(24, cy, 8.4, 8.4, P); K.eye(24, cy, 5.2, '#ffd23a', true);
  K.lit(K.cut(ringM(K, 24, cy, 21, 7.4, 2.2), (x, y) => y >= cy + 3), GOLD_R); K.lit(K.cut(ringM(K, 24, cy, 7.4, 21, 2.2), (x, y) => x >= 28), QR);
  for (let k = 0; k < 6; k++) { const a = k * 1.047 + 0.52; K.eye(24 + Math.cos(a) * 20.4, cy + Math.sin(a) * 20.4, 1.8, k % 2 ? '#fff3a0' : Q[2], false, (fr + k) % 4 === 0 ? 1 : 0); }
  K.spark(24, cy - 14, '#ffffff', fr % 2 === 0);
  return { cx: 24, cy: 23, R: 12, top: 2, bot: 45, head: [24, 4], back: [[36, 9], [12, 9], [41, 20]], belly: [24, 33], side: [39, 26], under: [[14, 44], [24, 46], [34, 44]] };
};
FORMS.nebula4 = (K, st, P, Q, fr) => {         // 별 사이를 여는 자: 옷자락 안이 밤하늘인 것. 가슴에 틈이 열려 있다
  const s = SW(fr), VOID = ['#0a0618', '#141028', '#3a2a6a', '#0c0820']; K.shadow(26, 20);
  K.G([[14, 20], [6, 8 - s], [18, 15]], P); K.G([[38, 20], [46, 8 - s], [34, 15]], P);                                           // 어깨의 깃
  K.L([[15, 22], [7, 28], [5, 36 + s]], 1.7, 1.1, P); [[2, 42], [5, 43], [8, 42]].forEach(f => K.L([[5, 36 + s], [f[0], f[1] + s]], 0.7, 0.6, P));
  K.L([[37, 22], [45, 17], [47, 9 - s]], 1.7, 1.1, P); [[44, 3], [47, 2], [50, 4]].forEach(f => K.L([[47, 9 - s], [f[0], f[1] - s]], 0.7, 0.6, P));
  const cloak = K.poly([[20, 14], [32, 14], [38, 20], [41, 36], [45, 50], [37, 47], [32, 51], [26, 47], [20, 51], [15, 47], [7, 50], [11, 36], [14, 20]]), N = K.N, inm = (x, y) => x >= 0 && y >= 0 && x < N && y < N && cloak[y * N + x];
  K.commit(cloak, (x, y) => { const e1 = !inm(x - 1, y) || !inm(x + 1, y) || !inm(x, y - 1) || !inm(x, y + 1), e2 = !inm(x - 2, y) || !inm(x + 2, y) || !inm(x, y - 2) || !inm(x, y + 2), h = ((x * 73856093) ^ (y * 19349663)) >>> 0; if (e1) return x < 26 ? P[2] : P[1]; if (e2) return P[3]; if (h % 29 === 0) return (h + fr) % 3 ? '#ffffff' : '#fff3a0'; if (h % 11 === 0) return '#2a1c50'; return (x + y * 2) % 9 < 3 ? '#160e30' : VOID[0]; }, P[0]);
  const rift = K.poly([[26, 20], [29, 30], [26, 42], [23, 30]]); K.commit(rift, (x, y) => x === 26 ? '#ffffff' : Math.abs(x - 26) === 1 ? '#fff3a0' : Q[2], '#fff3a0'); K.spark(26, 30, '#ffffff', fr % 2 === 0);
  K.lit(K.cut(ringM(K, 26, 4, 8, 2.6, 1.3), (x, y) => y < 4), GOLD_R);
  K.B(26, 8, 4.6, 4.6, VOID); K.spark(26, 8, '#fff3a0', true);
  K.lit(K.cut(ringM(K, 26, 4, 8, 2.6, 1.3), (x, y) => y >= 5), GOLD_R);
  K.rect(11, 49, 2, 2, P[1]); K.px(40, 50, P[2]); K.px(24, 50, P[1]); K.px(3, 47, P[3]);
  return { cx: 26, cy: 30, R: 13, top: 3, bot: 50, head: [26, 1], back: [[38, 23], [14, 23], [41, 35]], belly: [26, 45], side: [40, 30], under: [[10, 50], [26, 51], [42, 50]] };
};
// ---------- 번식 ----------
FORMS.brood1 = (K, st, P, Q, fr) => {          // 불어나는 것: 싹 튼 알뿌리
  const s = SW(fr); K.shadow(16, 10);
  K.L([[11, 26], [8, 29], [5, 30]], 1.6, 0.8, ROOT_R); K.L([[16, 27], [16, 30]], 1.6, 1, ROOT_R); K.L([[21, 26], [24, 29], [27, 30]], 1.6, 0.8, ROOT_R);
  K.L([[16, 16], [15, 10], [17, 6 + s]], 1.8, 1.2, P);
  K.G([[17, 6 + s], [11, 1 + s], [5, 4 + s], [10, 9 + s]], P); K.G([[17, 6 + s], [23, 2 + s], [28, 6 + s], [22, 10 + s]], P); K.px(11, 5 + s, P[3]); K.px(22, 6 + s, P[3]);
  K.B(24, 15, 2.6, 2.6, EGG_R);
  K.B(16, 21, 9, 7.4, P); K.flat(K.cut(K.el(16, 24.5, 6, 3.2), (x, y) => y > 24), mixh(P[2], '#ffffff', 0.25));
  K.rect(12, 19, 2, 3, INKY); K.rect(19, 19, 2, 3, INKY); K.px(12, 19, '#ffffff'); K.px(19, 19, '#ffffff'); K.px(15, 23, INKY); K.px(16, 24, INKY); K.px(17, 23, INKY);
  return { cx: 16, cy: 21, R: 8, top: 13, bot: 29, head: [16, 2], back: [[22, 16], [10, 16], [16, 14]], belly: [16, 26], side: [24, 22], under: [[10, 30], [16, 31], [22, 30]] };
};
FORMS.brood2 = (K, st, P, Q, fr) => {          // 걸어 다니는 버섯: 갓 아래에 얼굴이 생겼다
  const s = SW(fr), STK = [P[0], '#e4e0c4', '#ffffff', '#aaa482'], SPOT = mixh(Q[2], '#ffffff', 0.3), cap = (cx, cy, rx, ry) => K.ball(K.cut(K.el(cx, cy, rx, ry), (x, y) => y <= cy), cx, cy, rx, ry, P); K.shadow(20, 15);
  K.L([[14, 33], [10, 36], [8, 38]], 2, 1, ROOT_R); K.L([[18, 34], [17, 38]], 1.8, 1.2, ROOT_R); K.L([[23, 34], [24, 38]], 1.8, 1.2, ROOT_R); K.L([[27, 33], [31, 36], [33, 38]], 2, 1, ROOT_R);
  K.L([[6, 31], [6, 25]], 1.5, 1.5, STK); cap(6, 25, 5, 4.4); K.L([[35, 30], [35, 22]], 1.5, 1.5, STK); cap(35, 22, 4.6, 4);
  K.B(20, 28, 8, 8, STK);
  K.flat(K.el(16, 27, 1.7, 2.3), INKY); K.flat(K.el(24, 27, 1.7, 2.3), INKY); K.px(16, 26, '#f0e060'); K.px(24, 26, '#f0e060');
  K.flat(K.el(20, 32, 4.4, 1.8), INKY); K.fangs(17, 23, 31, 1, 2, 2);
  K.flat(K.el(20, 19, 15.4, 3.4), mixh(P[3], P[0], 0.45), P[0]); for (let gx = 6; gx < 35; gx += 2) K.px(gx, 20, P[0]);
  cap(20, 18, 18, 13.4);
  [[13, 11, 2.8, 1.9], [25, 8, 3.2, 2.1], [31, 14, 2, 1.4], [7, 15, 1.7, 1.2], [19, 14, 1.5, 1]].forEach(([a, b, c, d]) => K.flat(K.el(a, b, c, d), SPOT));
  K.spark(3, 6 + s, '#d0f08a', fr % 2 === 0); K.px(37, 9 - s, '#d0f08a'); K.px(31, 3 + s, '#f0e060');
  return { cx: 20, cy: 22, R: 12, top: 5, bot: 38, head: [20, 3], back: [[30, 9], [10, 9], [20, 6]], belly: [27, 31], side: [29, 27], under: [[10, 38], [20, 39], [30, 38]] };
};
FORMS.brood3 = (K, st, P, Q, fr) => {          // 알 품은 어미: 머리는 작고 배가 전부인 벌레
  const s = SW(fr), D = [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)], WING = [P[0], '#cfe8c0', '#ffffff', '#9ac090'], EG = [Q[0], Q[1], Q[2], Q[3]]; K.shadow(26, 21);
  K.L([[14, 28], [11, 35], [9, 45]], 1.4, 0.9, D); K.L([[19, 29], [19, 37], [17, 45]], 1.4, 0.9, D); K.L([[27, 37], [30, 41], [28, 45]], 1.4, 0.9, D);
  K.G([[17, 20], [27, 7 + s], [34, 10 + s], [25, 22]], WING); K.G([[20, 21], [32, 14 + s], [36, 18 + s], [27, 24]], WING);
  K.B(32, 29, 15, 12, P);
  for (let k = 0; k < 4; k++) { const x0 = 24 + k * 6; for (let y = 18; y < 41; y++) { const dy = (y - 29) / 12, e = Math.sqrt(Math.max(0, 1 - dy * dy)); if (Math.abs(x0 - 32) < 15 * e - 1) { K.px(x0, y, P[3]); K.px(x0 + 1, y, y < 27 ? P[2] : P[1]); } } }
  [[28, 35], [34, 37], [40, 34], [37, 28], [43, 27]].forEach(([ex, ey], k) => { K.B(ex, ey, 2.5, 2.5, EG); K.px(ex, ey + ((fr + k) % 2), INKY); });
  K.L([[45, 33], [48, 38]], 2, 1, P); K.B(44, 44.4, 2.6, 2.2, EGG_R); K.B(39, 45, 2, 1.8, EGG_R);
  K.B(17, 25, 7, 6, P);
  K.L([[13, 28], [8, 34], [5, 45]], 1.6, 0.9, P); K.L([[17, 30], [14, 37], [13, 45]], 1.6, 0.9, P); K.L([[21, 30], [24, 38], [22, 45]], 1.6, 0.9, P);
  K.B(9, 20, 5.4, 5, P);
  K.G([[5, 22], [1, 27 + s], [4, 29 + s], [7, 25]], BONE_R); K.G([[9, 24], [8, 30 + s], [11, 29 + s], [12, 24]], BONE_R);
  K.eye(7, 18, 1.8, '#f0e060'); K.eye(12, 19, 1.4, '#f0e060');
  K.L([[7, 16], [4, 9], [7, 4 + s]], 0.9, 0.6, P); K.L([[11, 15], [11, 8], [15, 4 - s]], 0.9, 0.6, P);
  return { cx: 30, cy: 28, R: 13, top: 15, bot: 45, head: [9, 12], back: [[30, 18], [39, 20], [23, 19]], belly: [20, 27], side: [45, 27], under: [[10, 46], [24, 46], [40, 46]] };
};
FORMS.brood4 = (K, st, P, Q, fr) => {          // 끝없이 낳는 숲: 입 벌린 나무. 가지마다 알주머니가 달렸다
  const s = SW(fr), BK = ['#141a0c', '#5c5a30', '#8c8a48', '#34381c'], EG = [Q[0], Q[1], Q[2], Q[3]]; K.shadow(27, 24);
  K.L([[20, 46], [12, 49], [4, 50]], 2.6, 1, BK); K.L([[24, 48], [20, 51]], 2, 1.2, BK); K.L([[30, 48], [33, 51]], 2, 1.2, BK); K.L([[34, 46], [42, 49], [49, 50]], 2.6, 1, BK);
  K.L([[22, 28], [13, 20], [8, 14]], 3, 1.6, BK); K.L([[32, 28], [40, 19], [45, 13]], 3, 1.6, BK); K.L([[13, 20], [6, 23]], 1.2, 0.8, BK); K.L([[40, 19], [47, 23]], 1.2, 0.8, BK);
  const trunk = K.G([[18, 48], [21, 30], [20, 20], [33, 20], [33, 31], [36, 48]], BK); K.commit(trunk, (x, y) => (x * 7 + (y >> 2)) % 5 === 0 && x > 20 && x < 34 ? BK[3] : null);
  K.flat(K.el(27, 37, 4.6, 6.6), '#0a0806', BK[0]); K.fangs(24, 30, 31, 1, 3, 2, '#d8d0a0'); K.fangs(25, 29, 43, -1, 2, 2, '#d8d0a0'); K.px(27, 38, '#f0e060'); K.px(27, 37, '#8a7a20');
  K.eye(23, 26, 1.7, '#f0e060', false, fr === 3 ? 1 : 0); K.eye(31, 26, 1.7, '#f0e060', false, fr === 3 ? 1 : 0);
  [[11, 20, 28], [42, 21, 30], [17, 18, 24], [37, 18, 25]].forEach(([hx, y0, y1], k) => { for (let y = y0; y < y1 + (k % 2 ? s : -s); y++) K.px(hx, y, BK[3]); const py0 = y1 + (k % 2 ? s : -s) + 2; K.B(hx, py0, k < 2 ? 2.8 : 2.2, k < 2 ? 3.4 : 2.8, EG); K.px(hx, py0 + 1, INKY); });
  [[8, 17, 6, 5], [45, 17, 6, 5], [14, 12, 8, 7], [38, 12, 8, 7], [20, 6, 7, 5.4], [33, 6, 7, 5.4], [26, 10, 10, 8]].forEach(([a, b, c, d]) => K.B(a, b, c, d, P));
  K.eye(18, 11, 1.4, '#f0e060'); K.eye(35, 10, 1.4, '#f0e060'); K.px(26, 6, P[2]); K.px(10, 15, P[2]);
  K.L([[4, 49], [3, 46 + s]], 0.7, 0.6, P); K.px(2, 45 + s, P[2]); K.L([[48, 49], [49, 46 - s]], 0.7, 0.6, P); K.px(50, 45 - s, P[2]);
  return { cx: 27, cy: 34, R: 12, top: 2, bot: 50, head: [26, 2], back: [[38, 7], [14, 7], [45, 13]], belly: [27, 46], side: [36, 36], under: [[8, 51], [26, 51], [44, 51]] };
};
// ---------- 황혼 ----------
FORMS.dusk1 = (K, st, P, Q, fr) => {           // 속삭이는 것: 가면 하나를 쓴 작은 그림자
  const s = SW(fr); K.shadow(16, 9);
  const robe = K.G([[9, 13], [23, 13], [26, 23], [28, 30], [24, 28], [21, 31], [18, 28], [15, 31], [12, 28], [8, 31], [5, 29], [7, 22]], P); K.commit(robe, (x, y) => y > 16 && (x === 12 || x === 20) ? P[3] : null);
  K.L([[8, 20], [5, 22 + s]], 1.4, 1, P); K.L([[24, 20], [27, 21 - s]], 1.4, 1, P);
  K.rect(27, 22 - s, 1, 2, '#3a2a10'); K.B(27.5, 26 - s, 2.2, 2.4, GOLD_R); K.spark(27, 26 - s, '#fff3a0', fr % 2 === 0);
  K.B(16, 12, 8.4, 8, P); K.flat(K.el(16, 13.4, 5.6, 6), '#1a0a14');
  drawMask(K, 16, 14, 3.6, 4.6, 0);
  return { cx: 16, cy: 18, R: 8, top: 4, bot: 30, head: [16, 3], back: [[22, 8], [10, 8], [16, 5]], belly: [16, 24], side: [22, 17], under: [[9, 31], [16, 31], [23, 31]] };
};
FORMS.dusk2 = (K, st, P, Q, fr) => {           // 줄에 매달린 것: 마디마디가 따로 노는 인형
  const s = SW(fr), STR = '#d8c8a8'; K.shadow(20, 9);
  for (let y = 0; y < 3; y++) K.px(20, y, STR); for (let y = 0; y < 3 + s; y += 2) K.px(5, y, STR); for (let y = 0; y < 27 - s; y += 2) K.px(35, y, STR);
  K.L([[18, 27], [15, 33], [17, 38]], 1.4, 1, P); K.L([[22, 27], [26, 32], [24, 38]], 1.4, 1, P); K.G([[18, 37], [12, 39], [18, 40]], P); K.G([[24, 37], [30, 39], [24, 40]], P);
  K.B(15, 33, 1.3, 1.3, BONE_R); K.B(26, 32, 1.3, 1.3, BONE_R);
  const torso = K.G([[16, 16], [24, 16], [23, 22], [25, 28], [15, 28], [17, 22]], P); K.commit(torso, (x, y) => (y === 19 || y === 21) && x > 17 && x < 23 ? P[3] : null); K.B(20, 23, 2.2, 1.6, BONE_R);
  K.L([[16, 17], [9, 13], [5, 7 + s]], 1.3, 1, P); K.B(9, 13, 1.4, 1.4, BONE_R); [[3, 3], [5, 2], [7, 3]].forEach(f => K.L([[5, 7 + s], [f[0], f[1] + s]], 0.6, 0.6, BONE_R));
  K.L([[24, 17], [31, 21], [35, 28 - s]], 1.3, 1, P); K.B(31, 21, 1.4, 1.4, BONE_R); [[33, 34], [35, 35], [37, 34]].forEach(f => K.L([[35, 28 - s], [f[0], f[1] - s]], 0.6, 0.6, BONE_R));
  for (let k = 0; k < 5; k++) K.G([[14 + k * 2.6, 15], [15.3 + k * 2.6, 18.4], [16.6 + k * 2.6, 15]], BONE_R);
  K.G([[15, 5], [10, 0], [18, 4]], P); K.G([[25, 5], [30, 0], [22, 4]], P); K.px(10, 0, '#ffd23a'); K.px(30, 0, '#ffd23a');
  drawMask(K, 20, 9, 5, 6.4, 0);
  return { cx: 20, cy: 21, R: 8, top: 2, bot: 39, head: [20, 2], back: [[25, 18], [15, 18], [20, 16]], belly: [20, 26], side: [26, 22], under: [[15, 39], [20, 39], [26, 39]] };
};
FORMS.dusk3 = (K, st, P, Q, fr) => {           // 막을 두른 나방: 날개가 무대의 막이고, 날개의 눈이 관객을 본다
  const s = SW(fr), D = [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)], mir = pts => pts.map(q => [48 - q[0], q[1]]), spot = (cx, cy) => { K.flat(K.el(cx, cy, 4.6, 4.6), INKY); K.flat(K.el(cx, cy, 3.6, 3.6), '#f2ecd8'); K.flat(K.el(cx, cy, 2.2, 2.2), Q[1]); K.flat(K.el(cx, cy, 1, 1), INKY); K.px(cx - 1, cy - 1, '#ffffff'); }; K.shadow(24, 15);
  const lw = [[21, 27], [8, 33], [11, 44 + s], [20, 40], [23, 33]], uw = [[22, 22], [14, 6 - s], [3, 3 - s], [1, 18], [6, 30], [21, 28]];
  K.G(lw, D); K.G(mir(lw), D);
  [uw, mir(uw)].forEach(w => { const m = K.G(w, P); K.commit(m, (x, y) => x % 4 === 1 ? P[3] : null); K.commit(m, (x, y) => { const e = y > 0 && !m[(y - 1) * K.N + x]; return e ? '#ffd23a' : null; }); });
  spot(10, 17 - s); spot(38, 17 - s);
  K.L([[22, 27], [19, 33]], 0.7, 0.6, P); K.L([[26, 27], [29, 33]], 0.7, 0.6, P);
  K.L([[24, 28], [24, 36], [24, 43 + s]], 3, 1.2, P); for (const yy of [32, 36, 40]) K.rect(22, yy, 5, 1, P[0]);
  K.B(24, 24, 4.2, 5, P); K.px(22, 22, P[2]); K.px(25, 21, P[2]);
  K.L([[22, 11], [18, 5], [15, 2 + s]], 0.8, 0.6, P); K.L([[26, 11], [30, 5], [33, 2 + s]], 0.8, 0.6, P); for (let k = 0; k < 3; k++) { K.px(19 - k * 2, 5 - k + s, P[2]); K.px(29 + k * 2, 5 - k + s, P[2]); }
  drawMask(K, 24, 15, 4, 5, 2);
  return { cx: 24, cy: 24, R: 10, top: 2, bot: 44, head: [24, 8], back: [[34, 9], [14, 9], [41, 20]], belly: [24, 37], side: [37, 26], under: [[14, 45], [24, 46], [34, 45]] };
};
FORMS.dusk4 = (K, st, P, Q, fr) => {           // 마지막 막의 연출가: 얼굴이 부채처럼 펼쳐지고, 손마다 줄을 쥐었다
  const s = SW(fr), HOOD = [P[0], '#3a1420', '#6a2a30', '#1a0a10'], STR = '#d8c8a8'; K.shadow(26, 23);
  for (let k = 0; k < 7; k++) { const a = 3.45 + k * 0.42, mx = 26 + Math.cos(a) * 16, my = 16 + Math.sin(a) * 13; for (let i = 3; i < 10; i++) K.px(26 + Math.cos(a) * (i * 1.4), 14 + Math.sin(a) * (i * 1.2), P[3]); drawMask(K, Math.round(mx), Math.round(my + (k % 2 ? s : -s) * 0.5), 2.5, 3.1, k % 3); }
  for (let y = 24; y < 41; y += 2) { K.px(5, y, STR); K.px(47, y, STR); }
  [[5, 41 + s], [47, 41 - s]].forEach(([hx, hy]) => { K.rect(hx - 1, hy, 3, 3, '#e8b890'); K.rect(hx - 1, hy + 3, 3, 4, '#3f6b46'); K.px(hx - 2, hy + 4, '#e8b890'); K.px(hx + 2, hy + 3, '#e8b890'); K.px(hx - 1, hy + 7, INKY); K.px(hx + 1, hy + 7, INKY); K.px(hx, hy + 1, INKY); });
  K.L([[14, 22], [8, 20], [5, 23]], 1.7, 1.1, P); K.B(5, 23, 1.5, 1.5, BONE_R); K.L([[38, 22], [44, 20], [47, 23]], 1.7, 1.1, P); K.B(47, 23, 1.5, 1.5, BONE_R);
  const cloak = K.G([[17, 18], [35, 18], [40, 28], [44, 42], [47, 50], [5, 50], [8, 42], [12, 28]], P); K.commit(cloak, (x, y) => y > 22 ? (x % 5 === 2 ? P[3] : x % 5 === 3 ? mixh(P[3], P[0], 0.5) : null) : null); K.commit(cloak, (x, y) => y >= 48 ? ((x + (y === 48 ? 1 : 0)) % 4 < 2 ? '#ffd23a' : '#a87e14') : null);
  K.L([[16, 30], [22, 35], [27, 34]], 1.7, 1.1, HOOD); K.B(28, 34, 1.5, 1.5, BONE_R); K.L([[36, 30], [30, 37], [25, 38]], 1.7, 1.1, HOOD); K.B(24, 38, 1.5, 1.5, BONE_R);
  K.G([[18, 19], [26, 25], [34, 19], [30, 16], [22, 16]], BONE_R);
  K.B(26, 11, 5.6, 7, HOOD); drawMask(K, 26, 12, 4, 5.6, 0);
  K.G([[21, 5], [22, 0], [25, 4]], GOLD_R); K.G([[24, 4], [26, -1], [28, 4]], GOLD_R); K.G([[27, 4], [30, 0], [31, 5]], GOLD_R);
  return { cx: 26, cy: 34, R: 13, top: 1, bot: 50, head: [26, 1], back: [[38, 25], [14, 25], [42, 37]], belly: [26, 44], side: [41, 34], under: [[8, 51], [26, 51], [44, 51]] };
};
// ---------- 기아 ----------
FORMS.hunger1 = (K, st, P, Q, fr) => {         // 씹는 것: 두 발 달린 입
  const s = SW(fr); K.shadow(16, 11);
  K.L([[24, 18], [28, 15], [29, 11 + s]], 1.4, 0.7, P);
  K.L([[11, 25], [10, 29]], 2, 1.6, P); K.B(9, 30, 2.8, 1.4, P); K.L([[21, 25], [22, 29]], 2, 1.6, P); K.B(23, 30, 2.8, 1.4, P);
  K.B(16, 17, 10, 9.4, P);
  K.flat(K.el(15, 20, 8, 5), '#1a0508', P[0]); K.flat(K.el(15, 22, 5, 2.4), '#7a121c');
  K.L([[15, 22], [13, 26], [11, 27 + s]], 1.6, 1.2, TONGUE_R);
  K.fangs(8, 22, 16, 1, 4, 2); K.fangs(9, 21, 24, -1, 3, 3);
  K.eye(11, 10, 1.9, '#ffd23a'); K.eye(19, 9, 2.3, '#ffd23a', true); K.rect(9, 7, 3, 1, P[0]); K.rect(18, 6, 4, 1, P[0]);
  return { cx: 16, cy: 17, R: 9, top: 8, bot: 30, head: [16, 6], back: [[23, 11], [9, 12], [16, 8]], belly: [22, 23], side: [25, 18], under: [[9, 31], [16, 31], [23, 31]] };
};
FORMS.hunger2 = (K, st, P, Q, fr) => {         // 굶은 짐승: 갈비가 드러난 네 발, 꼬리 끝에도 입
  const s = SW(fr), D = [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)]; K.shadow(22, 17);
  K.L([[18, 26], [19, 32], [17, 38]], 1.6, 1, D); K.L([[32, 25], [35, 31], [33, 38]], 1.6, 1, D);
  K.L([[34, 20], [38, 15], [36, 9 + s]], 1.9, 1.3, P); K.B(35, 6 + s, 3.2, 2.8, P); K.flat(K.el(33.6, 7 + s, 2.4, 1.1), '#1a0508'); K.px(32, 6 + s, '#fbf7ea'); K.px(34, 6 + s, '#fbf7ea'); K.px(37, 5 + s, '#ffd23a');
  for (let k = 0; k < 6; k++) K.G([[14 + k * 3.6, 17], [16 + k * 3.6, 10 + (k % 2) * 2], [18 + k * 3.6, 17]], BONE_R);
  K.B(21, 22, 11, 6.4, P); K.B(31, 22, 6, 6, P);
  for (let k = 0; k < 4; k++) for (let y = 19; y < 27; y++) { K.px(16 + k * 3 - (y > 23 ? 1 : 0), y, P[3]); K.px(17 + k * 3 - (y > 23 ? 1 : 0), y, P[2]); }
  K.flat(K.cut(K.el(22, 28, 8, 3), (x, y) => y > 26), '#00000000');
  K.L([[14, 26], [11, 32], [12, 38]], 2, 1.1, P); K.px(10, 38, '#fbf7ea'); K.px(12, 39, '#fbf7ea'); K.L([[29, 26], [32, 32], [30, 38]], 2.2, 1.1, P); K.px(28, 38, '#fbf7ea'); K.px(30, 39, '#fbf7ea');
  K.L([[13, 20], [9, 17]], 4.4, 4, P);
  K.B(8, 21, 6.4, 2.6, P); K.B(8, 14, 7.4, 4.6, P);
  K.flat(K.poly([[1, 16], [14, 17], [13, 20], [2, 20]]), '#1a0508'); K.fangs(2, 12, 17, 1, 3, 2); K.fangs(3, 12, 19, -1, 2, 3);
  K.eye(11, 12, 1.9, '#ffd23a', true); K.G([[12, 10], [16, 4], [15, 11]], P); K.G([[8, 10], [10, 4], [12, 10]], P);
  K.px(5, 22, '#bfe8ff'); K.px(5, 24 + s, '#bfe8ff');
  return { cx: 22, cy: 22, R: 10, top: 9, bot: 38, head: [9, 7], back: [[24, 15], [30, 15], [18, 15]], belly: [22, 27], side: [36, 22], under: [[12, 39], [22, 39], [32, 39]] };
};
FORMS.hunger3 = (K, st, P, Q, fr) => {         // 구멍에서 솟은 것: 다리도 눈도 버리고 목구멍만 남았다
  const s = SW(fr), RK = ['#141018', '#4a4458', '#6a6478', '#2a2634'], seg = [[39, 42], [41, 35], [40, 28], [36, 21], [30, 16], [23, 14 + s]]; K.shadow(30, 20);
  K.L([[7, 46], [6, 41], [8, 37 + s]], 2.6, 2.2, P); K.flat(K.el(8, 36 + s, 1.9, 1.5), '#1a0508'); K.px(7, 35 + s, '#fbf7ea'); K.px(9, 35 + s, '#fbf7ea');
  K.B(38, 44.4, 9, 3.4, RK); K.B(28, 45.4, 5, 2.4, RK); K.B(45, 45.6, 3, 2, RK); K.B(4, 46.4, 3, 1.6, RK);
  seg.forEach(([cx, cy], k) => { const a = Math.atan2(cy - 30, cx - 26), ox = Math.cos(a), oy = Math.sin(a); K.G([[cx + ox * 6 - oy * 3, cy + oy * 6 + ox * 3], [cx + ox * 13, cy + oy * 13], [cx + ox * 6 + oy * 3, cy + oy * 6 - ox * 3]], BONE_R); K.B(cx, cy, 8.4, 8.4, P); });
  const hx = 14, hy = 17 + s;
  [[[5, 8], [0, 15], [6, 13]], [[4, 26], [0, 20], [6, 22]], [[20, 6], [25, 10], [19, 11]], [[19, 28], [24, 25], [18, 23]]].forEach(h => K.G(h.map(q => [q[0], q[1] + s]), BONE_R));
  K.B(hx + 1, hy, 10, 10, P);
  K.flat(K.el(hx, hy, 7.6, 7.6), '#1a0508', P[0]); K.flat(K.el(hx, hy, 5.8, 5.8), '#6a1018'); K.flat(K.el(hx, hy, 2.8, 2.8), '#1a0508'); K.px(hx, hy, '#ffb347');
  for (let k = 0; k < 12; k++) { const a = k * 0.5236 + fr * 0.13; K.px(hx + Math.cos(a) * 6.6, hy + Math.sin(a) * 6.6, '#fbf7ea'); K.px(hx + Math.cos(a) * 5.4, hy + Math.sin(a) * 5.4, '#cfc8b4'); }
  for (let k = 0; k < 7; k++) { const a = k * 0.8976 - fr * 0.2; K.px(hx + Math.cos(a) * 3.8, hy + Math.sin(a) * 3.8, '#fbf7ea'); }
  return { cx: 30, cy: 26, R: 12, top: 5, bot: 46, head: [15, 4], back: [[40, 23], [43, 32], [34, 15]], belly: [36, 37], side: [45, 30], under: [[12, 47], [28, 47], [44, 47]] };
};
FORMS.hunger4 = (K, st, P, Q, fr) => {         // 모든 것의 마지막 한 입: 몸 전체가 세로로 찢어진 입. 그 안에 입이 또 있다
  const s = SW(fr), IN = ['#2a0a0e', '#e8505a', '#ff9a8a', '#8a1c26']; K.shadow(26, 24);
  K.B(14, 49, 5, 2.4, P); K.B(38, 49, 5, 2.4, P);
  K.L([[10, 17], [4, 11], [5, 3 - s]], 2.8, 0.8, BONE_R); K.L([[42, 17], [48, 11], [47, 3 - s]], 2.8, 0.8, BONE_R);
  K.L([[5, 34], [1, 40], [4, 45 + s]], 2.2, 1.4, P); K.px(3, 47 + s, '#fbf7ea'); K.px(5, 47 + s, '#fbf7ea'); K.L([[47, 34], [51, 40], [48, 45 + s]], 2.2, 1.4, P); K.px(47, 47 + s, '#fbf7ea'); K.px(49, 47 + s, '#fbf7ea');
  K.B(26, 29, 23, 19, P);
  [[9, 22, 2.6], [13, 31, 1.8], [8, 37, 1.6], [43, 22, 2.6], [39, 32, 1.8], [44, 38, 1.6], [14, 15, 1.5], [38, 15, 1.5]].forEach(([ex, ey, r], k) => K.eye(ex, ey, r, '#ffd23a', r > 2, (fr + k) % 4 === 0 ? 1 : 0));
  K.flat(K.el(26, 30, 10.6, 16.6), '#7a121c', P[0]); K.flat(K.el(26, 30, 8.8, 15), '#1a0508');
  for (let k = 0; k < 7; k++) { const y = 17 + k * 4, dy = (y + 1.5 - 30) / 15.4, e = Math.sqrt(Math.max(0, 1 - dy * dy)), xl = 26 - 9.4 * e, xr = 26 + 9.4 * e, ln = 4 + e * 3 - (k % 2); K.G([[xl, y], [xl + ln, y + 1.5], [xl, y + 3]], BONE_R); K.G([[xr + 1, y + 1], [xr + 1 - ln, y + 2.5], [xr + 1, y + 4]], BONE_R); }
  K.L([[26, 37], [24, 43], [27, 48 + s]], 2.2, 1.2, TONGUE_R);
  K.B(26, 32 + s * 0.5, 5.2, 5.2, IN); K.flat(K.el(26, 33 + s * 0.5, 3.6, 2.4), '#1a0508'); K.fangs(24, 28, 31 + Math.round(s * 0.5), 1, 2, 2); K.px(24, 29, INKY); K.px(28, 29, INKY);
  K.px(20, 46, '#bfe8ff'); K.px(20, 48 + s, '#bfe8ff'); K.px(33, 47, '#bfe8ff');
  return { cx: 26, cy: 29, R: 18, top: 9, bot: 49, head: [26, 7], back: [[40, 13], [12, 13], [46, 24]], belly: [39, 44], side: [47, 28], under: [[10, 50], [26, 50], [42, 50]] };
};
// ---------- 숨은 본체: 여럿인 것 (작은 몸들이 하나처럼 군다) ----------
const tiny = (K, cx, cy, r, p, blink) => { K.B(cx, cy, r, r * 0.92, p); if (r >= 2.4) K.eye(cx - r * 0.15, cy - r * 0.1, Math.max(1, r * 0.42), '#f0e060', false, blink ? 1 : 0); else { K.px(cx, cy, INKY); K.px(cx - 1, cy - 1, '#ffffff'); } };
FORMS.hive1 = (K, st, P, Q, fr) => {            // 셋이 붙어 다닌다
  const s = SW(fr); K.shadow(16, 10);
  K.L([[10, 26], [8, 30]], 1.2, 0.8, P); K.L([[14, 27], [14, 30]], 1.2, 0.8, P); K.L([[20, 27], [21, 30]], 1.2, 0.8, P); K.L([[24, 25], [26, 30]], 1.2, 0.8, P);
  for (let y = 14; y < 20; y++) { K.px(13 + (y % 2), y, P[3]); K.px(19 - (y % 2), y, P[3]); }
  tiny(K, 11, 22, 5.4, P, fr === 2); tiny(K, 22, 22.4, 5, P, fr === 0); tiny(K, 16.4, 12 + s, 5, P, fr === 1);
  K.L([[15, 7 + s], [13, 3 + s]], 0.7, 0.6, P); K.L([[18, 7 + s], [20, 3 + s]], 0.7, 0.6, P); K.px(13, 2 + s, P[2]); K.px(20, 2 + s, P[2]);
  return { cx: 16, cy: 19, R: 9, top: 6, bot: 30, head: [16, 4], back: [[24, 17], [8, 17], [16, 8]], belly: [16, 26], side: [26, 21], under: [[9, 31], [16, 31], [23, 31]] };
};
FORMS.hive2 = (K, st, P, Q, fr) => {            // 떼: 가운데는 비었는데 얼굴이 보인다
  const s = SW(fr), WING = [P[0], '#d8ecd8', '#ffffff', '#a0b8a0'], n = 8, rot = fr * 0.2; K.shadow(20, 12);
  const pts = []; for (let k = 0; k < n; k++) { const a = k * 6.283 / n + rot; pts.push([20 + Math.cos(a) * 13, 19 + Math.sin(a) * 11, Math.sin(a), k]); }
  K.flat(K.el(20, 19, 7, 6), '#0a0812aa'); K.flat(K.el(17, 18, 1.2, 1.8), P[2]); K.flat(K.el(23, 18, 1.2, 1.8), P[2]); K.rect(18, 22, 5, 1, P[2]); K.px(17, 21, P[2]); K.px(23, 21, P[2]);
  pts.sort((a, b) => a[2] - b[2]).forEach(([bx, by, d, k]) => { const o = (fr + k) % 2; K.G([[bx - 1, by - 2], [bx - 6, by - 6 - o * 2], [bx - 4, by - 1]], WING); K.G([[bx + 1, by - 2], [bx + 6, by - 6 - o * 2], [bx + 4, by - 1]], WING); tiny(K, bx, by, 3.2 + (k % 3 === 0 ? 0.6 : 0), P, (fr + k) % 4 === 0); K.px(bx, by + 4, P[3]); });
  K.px(20, 36, P[1]); K.px(14, 37, P[3]); K.px(27, 37, P[1]);
  return { cx: 20, cy: 19, R: 12, top: 4, bot: 34, head: [20, 3], back: [[31, 12], [9, 12], [20, 6]], belly: [20, 30], side: [33, 20], under: [[11, 36], [20, 38], [29, 36]] };
};
FORMS.hive3 = (K, st, P, Q, fr) => {            // 벌집: 방마다 눈이 내다본다
  const s = SW(fr), WAX = [P[0], mixh(P[1], '#c8a050', 0.6), mixh(P[2], '#f0d890', 0.6), mixh(P[3], '#6a4a20', 0.6)], WING = [P[0], '#d8ecd8', '#ffffff', '#a0b8a0']; K.shadow(24, 20);
  K.B(24, 40, 19, 6.4, WAX); K.B(24, 30, 16, 9, WAX); K.B(24, 19, 12, 9, WAX); K.B(24, 10, 7, 6, WAX);
  [[17, 39], [26, 40], [35, 38], [13, 30], [22, 31], [31, 29], [18, 20], [28, 19], [23, 10], [38, 31], [9, 38]].forEach(([hx, hy], k) => { K.flat(K.poly([[hx - 3, hy], [hx - 1.5, hy - 3], [hx + 1.5, hy - 3], [hx + 3, hy], [hx + 1.5, hy + 3], [hx - 1.5, hy + 3]]), '#120a06', WAX[3]); if (k % 3 !== 2) { K.px(hx - 1, hy, (fr + k) % 4 === 0 ? '#120a06' : '#f0e060'); K.px(hx + 1, hy, (fr + k) % 4 === 0 ? '#120a06' : '#f0e060'); } else K.flat(K.el(hx, hy + 1, 1.6, 1.2), EGG_R[1]); });
  for (let k = 0; k < 3; k++) K.px(24 + k * 5 - 5, 46 + (k % 2), WAX[1]);
  [[6, 10, 0], [41, 8, 1], [44, 22, 2], [4, 24, 3]].forEach(([bx, by, k]) => { const o = (fr + k) % 2, y = by + (k % 2 ? s : -s); K.G([[bx - 1, y - 2], [bx - 5, y - 5 - o * 2], [bx - 3, y - 1]], WING); K.G([[bx + 1, y - 2], [bx + 5, y - 5 - o * 2], [bx + 3, y - 1]], WING); tiny(K, bx, y, 2.8, P, false); });
  tiny(K, 31, 12, 2.6, P, fr === 1); tiny(K, 12, 24, 2.4, P, fr === 3);
  return { cx: 24, cy: 28, R: 14, top: 4, bot: 46, head: [24, 3], back: [[34, 14], [14, 14], [39, 26]], belly: [24, 44], side: [40, 34], under: [[9, 47], [24, 47], [39, 47]] };
};
FORMS.hive4 = (K, st, P, Q, fr) => {            // 혼자가 아닌 것: 작은 몸들이 쌓여 거인의 꼴을 했다
  const s = SW(fr), D = [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)]; K.shadow(26, 22);
  const part = (list, p) => list.forEach(([cx, cy, r], k) => tiny(K, cx, cy, r, p, (fr + k + Math.round(cx)) % 5 === 0));
  part([[19, 47, 3.6], [33, 47, 3.6], [20, 41, 3.4], [32, 41, 3.4], [21, 35, 3.6], [31, 35, 3.6]], D);                         // 다리
  part([[9, 20 + s, 3.2], [5, 26 + s, 3], [4, 33 + s, 3.2], [6, 39 + s, 2.6], [43, 20 - s, 3.2], [47, 14 - s, 3], [48, 7 - s, 3.2], [45, 2 - s, 2.4]], D);   // 팔: 하나는 내리고 하나는 들었다
  part([[26, 30, 5], [20, 26, 4.6], [32, 26, 4.6], [26, 22, 5.4], [16, 20, 4], [36, 20, 4], [22, 17, 4.4], [30, 17, 4.4]], P);  // 몸통
  part([[26, 9, 6]], P); part([[20, 6, 2.6], [32, 6, 2.6], [26, 2.6, 2.4]], P);                                               // 머리와 그 위에 올라앉은 것들
  K.flat(K.el(26, 28, 3, 2), '#1a0508', P[0]); K.fangs(24, 28, 27, 1, 2, 2);
  return { cx: 26, cy: 26, R: 13, top: 1, bot: 50, head: [26, 1], back: [[38, 17], [14, 17], [42, 26]], belly: [26, 36], side: [39, 28], under: [[12, 51], [26, 51], [40, 51]] };
};
// ---------- 숨은 본체: 받들린 것 (살이 아니라 깎은 돌) ----------
const stoneOf = P => [P[0], mixh(P[1], '#8a8a96', 0.6), mixh(P[2], '#e8e8f0', 0.6), mixh(P[3], '#3a3a48', 0.6)];
const candle = (K, cx, by, fr, k) => { K.rect(cx, by - 4, 2, 4, '#e4dfd0'); K.px(cx + 1, by - 4, '#a8a294'); K.px(cx, by - 5, INKY); K.px(cx + ((fr + k) % 2), by - 6, '#ffd23a'); K.px(cx + ((fr + k) % 2), by - 7, '#ff7a2a'); };
FORMS.idol1 = (K, st, P, Q, fr) => {            // 작은 돌 우상: 누가 깎았는지 모른다
  const ST = stoneOf(P); K.shadow(16, 11);
  K.G([[6, 30], [8, 26], [24, 26], [26, 30]], ST); K.rect(8, 26, 16, 1, ST[2]);
  candle(K, 5, 30, fr, 0); candle(K, 25, 30, fr, 1);
  K.G([[11, 26], [10, 16], [22, 16], [21, 26]], ST); K.B(16, 12, 6.4, 6, ST);
  K.rect(11, 20, 10, 1, ST[3]); K.rect(14, 22, 4, 3, ST[3]); K.px(15, 23, ST[1]);
  K.eye(16, 12, 2.6, P[2] === '#dff0e0' ? '#ffd23a' : P[2], true); K.rect(13, 16, 7, 1, ST[0]);
  K.lit(ringM(K, 16, 4, 5, 1.7, 1), GOLD_R);
  return { cx: 16, cy: 18, R: 7, top: 5, bot: 30, head: [16, 2], back: [[22, 14], [10, 14], [16, 7]], belly: [16, 23], side: [22, 21], under: [[9, 31], [16, 31], [23, 31]] };
};
FORMS.idol2 = (K, st, P, Q, fr) => {            // 얼굴을 쌓은 기둥: 아래 얼굴은 이를 드러내고 위 얼굴은 눈을 뜬다
  const ST = stoneOf(P), bowl = (cx, k) => { K.G([[cx - 4, 33], [cx + 4, 33], [cx + 2, 37], [cx - 2, 37]], GOLD_R); K.px(cx - 1 + ((fr + k) % 2), 31, '#ff7a2a'); K.px(cx, 32, '#ffd23a'); K.px(cx + 1, 30 - ((fr + k) % 2), '#ffd23a'); K.rect(cx - 1, 37, 2, 2, GOLD_R[3]); }; K.shadow(20, 15);
  K.G([[8, 39], [10, 35], [30, 35], [32, 39]], ST); bowl(6, 0); bowl(34, 1);
  K.G([[12, 35], [11, 21], [29, 21], [28, 35]], ST); K.flat(K.el(20, 30, 5.4, 2.6), '#1a0508', ST[0]); K.fangs(16, 24, 28, 1, 3, 2); K.rect(14, 24, 3, 2, ST[0]); K.rect(23, 24, 3, 2, ST[0]); K.px(15, 24, '#ffd23a'); K.px(24, 24, '#ffd23a');
  K.rect(11, 20, 18, 2, GOLD_R[1]); K.rect(11, 20, 18, 1, GOLD_R[2]); for (let gx = 12; gx < 29; gx += 3) K.px(gx, 21, GOLD_R[3]);
  K.G([[13, 20], [12, 9], [28, 9], [27, 20]], ST); K.eye(16, 13, 2.2, P[1], true); K.eye(24, 13, 2.2, P[1], true); K.rect(18, 17, 5, 1, ST[0]); K.rect(19, 15, 2, 2, ST[3]);
  K.G([[12, 9], [14, 4], [17, 8], [20, 2], [23, 8], [26, 4], [28, 9]], GOLD_R);
  K.G([[11, 14], [5, 12], [7, 18], [11, 18]], ST); K.G([[29, 14], [35, 12], [33, 18], [29, 18]], ST);
  return { cx: 20, cy: 22, R: 9, top: 3, bot: 39, head: [20, 1], back: [[29, 12], [11, 12], [20, 5]], belly: [20, 33], side: [30, 26], under: [[11, 39], [20, 39], [29, 39]] };
};
FORMS.idol3 = (K, st, P, Q, fr) => {            // 앉은 상: 팔 넷, 둘은 불을 받치고 둘은 무릎에 얹었다
  const s = SW(fr), ST = stoneOf(P); K.shadow(24, 20);
  K.lit(ringM(K, 24, 12, 13, 13, 2), GOLD_R); for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.39; K.px(24 + Math.cos(a) * 15, 12 + Math.sin(a) * 15, GOLD_R[2]); }
  K.G([[5, 46], [8, 41], [40, 41], [43, 46]], ST); K.rect(8, 41, 32, 1, ST[2]); K.G([[2, 47], [46, 47], [46, 45], [2, 45]], ST);
  candle(K, 4, 45, fr, 0); candle(K, 43, 45, fr, 1); candle(K, 10, 41, fr, 2); candle(K, 37, 41, fr, 3);
  K.L([[16, 22], [8, 17], [6, 9 + s]], 2.2, 1.6, ST); K.L([[32, 22], [40, 17], [42, 9 - s]], 2.2, 1.6, ST);
  K.B(6, 5 + s, 2.6, 2.6, GOLD_R); K.spark(6, 5 + s, '#fff3a0', fr % 2 === 0); K.B(42, 5 - s, 2.6, 2.6, GOLD_R); K.spark(42, 5 - s, '#fff3a0', fr % 2 === 1);
  K.B(13, 38, 8, 4, ST); K.B(35, 38, 8, 4, ST);                                                                              // 무릎
  K.G([[16, 38], [15, 22], [33, 22], [32, 38]], ST); K.B(24, 32, 6.4, 5, ST);
  K.L([[17, 25], [14, 32], [20, 36]], 2, 1.6, ST); K.L([[31, 25], [34, 32], [28, 36]], 2, 1.6, ST);
  K.rect(17, 22, 15, 2, GOLD_R[1]); K.rect(17, 22, 15, 1, GOLD_R[2]); K.px(24, 25, GOLD_R[1]); K.px(24, 27, GOLD_R[1]);
  K.B(24, 13, 6.4, 7, ST); K.eye(24, 9, 1.6, P[2], true); K.rect(20, 13, 3, 1, ST[0]); K.rect(26, 13, 3, 1, ST[0]); K.rect(22, 17, 5, 1, ST[0]);
  K.G([[18, 8], [20, 3], [22, 6], [24, 1], [26, 6], [28, 3], [30, 8]], GOLD_R);
  return { cx: 24, cy: 28, R: 12, top: 1, bot: 46, head: [24, 1], back: [[34, 22], [14, 22], [38, 34]], belly: [24, 34], side: [37, 30], under: [[8, 47], [24, 47], [40, 47]] };
};
FORMS.idol4 = (K, st, P, Q, fr) => {            // 올려다보이는 것: 떠 있는 얼굴 하나. 눈물은 금이다
  const s = SW(fr), ST = stoneOf(P), y0 = s; K.shadow(26, 20);
  for (let k = 0; k < 12; k++) { const a = k * 0.5236, x1 = 26 + Math.cos(a) * 25, y1 = 22 + Math.sin(a) * 25; K.flat(K.poly([[26 + Math.cos(a + 0.09) * 15, 22 + Math.sin(a + 0.09) * 15], [x1, y1], [26 + Math.cos(a - 0.09) * 15, 22 + Math.sin(a - 0.09) * 15]]), k % 2 ? GOLD_R[3] : GOLD_R[1]); }
  K.lit(ringM(K, 26, 22, 19, 19, 2.4), GOLD_R);
  K.G([[13, 9 + y0], [16, 2 + y0], [20, 7 + y0], [23, 0 + y0], [26, 6 + y0], [29, 0 + y0], [32, 7 + y0], [36, 2 + y0], [39, 9 + y0]], GOLD_R);
  K.B(26, 23 + y0, 14, 16, ST);
  K.G([[12, 20 + y0], [8, 18 + y0], [8, 28 + y0], [12, 27 + y0]], ST); K.G([[40, 20 + y0], [44, 18 + y0], [44, 28 + y0], [40, 27 + y0]], ST); K.px(9, 30 + y0, GOLD_R[1]); K.px(43, 30 + y0, GOLD_R[1]);
  K.rect(14, 12 + y0, 25, 2, GOLD_R[1]); K.rect(14, 12 + y0, 25, 1, GOLD_R[2]); K.B(26, 13 + y0, 2, 2, [P[0], P[1], P[2], P[3]]);
  K.eye(26, 17 + y0, 2, P[2], true);
  [[19, 23], [33, 23]].forEach(([ex, ey], k) => { K.flat(K.el(ex, ey + y0, 4, 2.4), INKY); if (fr !== 3) { K.flat(K.el(ex, ey + y0, 3, 1.6), '#f2ecd8'); K.flat(K.el(ex, ey + y0, 1.4, 1.6), P[1]); K.px(ex, ey + y0, INKY); } for (let d = 0; d < 6 + ((fr + k) % 2) * 2; d++) K.px(ex + (k ? 1 : -1), ey + 3 + d + y0, d % 3 === 2 ? GOLD_R[2] : GOLD_R[1]); });
  K.G([[24, 25 + y0], [26, 22 + y0], [28, 25 + y0], [28, 30 + y0], [24, 30 + y0]], ST); K.rect(21, 34 + y0, 11, 1, ST[0]); K.rect(22, 35 + y0, 9, 1, ST[3]);
  [[14, 44, 3], [38, 45, 2.6], [26, 46, 3.4], [7, 40, 1.8], [45, 39, 1.8]].forEach(([rx, ry, r], k) => K.B(rx, ry - ((fr + k) % 2), r, r * 0.8, ST));
  return { cx: 26, cy: 23, R: 14, top: 1, bot: 48, head: [26, 1], back: [[38, 12], [14, 12], [42, 22]], belly: [26, 37], side: [41, 30], under: [[12, 49], [26, 50], [40, 49]] };
};
// ---------- 숨은 본체: 뒤엉킨 것 (먹은 것이 제각각 자라 한 몸에 얽혔다) ----------
const others = P => ['abyss', 'hunger', 'brood', 'dusk', 'nebula'].map(a => PAL[a]).filter(q => q[1] !== P[1]);
FORMS.mix1 = (K, st, P, Q, fr) => {             // 머리가 둘: 서로 다른 것을 먹고 자랐다
  const s = SW(fr), O = others(P); K.shadow(16, 11);
  K.L([[11, 25], [9, 30]], 2, 1.2, O[0]); K.L([[21, 25], [23, 30]], 1.4, 0.8, ROOT_R); K.L([[21, 25], [19, 30]], 1.2, 0.7, ROOT_R);
  K.L([[12, 17], [8, 11], [7, 8 + s]], 2.6, 2.2, P); K.L([[20, 17], [24, 12], [25, 9 - s]], 2.4, 2, O[1]);
  K.B(16, 21, 8.4, 6.4, P); K.B(20, 22, 4.6, 4, O[1]);
  K.B(7, 7 + s, 4.6, 4, P); K.eye(6, 6 + s, 1.8, '#ffd23a', true); K.rect(4, 9 + s, 5, 1, P[0]);
  K.B(25, 8 - s, 4.4, 4, O[1]); K.flat(K.el(25, 9 - s, 3, 1.6), '#1a0508'); K.fangs(23, 27, 8 - s, 1, 2, 2); K.px(23, 5 - s, '#ffd23a'); K.px(27, 5 - s, '#ffd23a');
  K.px(14, 21, P[3]); K.px(15, 23, P[3]); K.px(17, 22, O[1][0]);
  return { cx: 16, cy: 20, R: 8, top: 4, bot: 30, head: [16, 3], back: [[22, 16], [10, 16], [16, 14]], belly: [15, 25], side: [25, 21], under: [[9, 31], [16, 31], [23, 31]] };
};
FORMS.mix2 = (K, st, P, Q, fr) => {             // 앞은 짐승, 뒤는 풀, 등에는 지느러미, 꼬리에는 눈
  const s = SW(fr), O = others(P); K.shadow(20, 16);
  K.L([[30, 27], [33, 33], [36, 38]], 1.6, 0.8, ROOT_R); K.L([[27, 28], [27, 38]], 1.6, 1, ROOT_R);
  K.L([[33, 20], [37, 14], [35, 8 + s]], 1.6, 1.1, O[2]); K.eye(35, 6 + s, 2.6, '#ffd23a', true);
  K.G([[18, 16], [22, 6 + s], [27, 16]], O[0]); K.G([[24, 17], [28, 9 - s], [31, 17]], O[0]);
  K.B(28, 23, 8, 7, O[1]); K.B(17, 23, 9, 7, P);
  K.B(31, 19, 2.4, 2.4, EGG_R); K.B(34, 25, 2, 2, EGG_R);
  for (let y = 18; y < 29; y++) K.px(23 + (y % 3 === 0 ? 1 : 0), y, P[0]);
  K.L([[13, 28], [11, 33], [12, 38]], 2, 1.1, P); K.px(10, 38, '#fbf7ea'); K.px(12, 39, '#fbf7ea'); K.L([[19, 29], [20, 34], [19, 38]], 1.8, 1.1, P);
  K.L([[11, 21], [7, 18]], 4, 3.6, P); K.B(6, 21, 5.4, 2.4, P); K.B(6, 15, 6.4, 4.2, P);
  K.flat(K.poly([[0, 17], [11, 18], [10, 21], [1, 21]]), '#1a0508'); K.fangs(1, 9, 18, 1, 3, 2); K.fangs(2, 9, 20, -1, 2, 3); K.eye(8, 13, 1.8, '#ffd23a', true);
  drawMask(K, 17, 19, 2.6, 3.2, 1);
  return { cx: 20, cy: 23, R: 11, top: 6, bot: 38, head: [7, 9], back: [[22, 15], [30, 16], [14, 16]], belly: [20, 29], side: [35, 24], under: [[11, 39], [20, 39], [30, 39]] };
};
FORMS.mix3 = (K, st, P, Q, fr) => {             // 쌓인 것: 몸통 셋이 서로 다른 쪽을 보며 한 줄로 붙었다
  const s = SW(fr), O = others(P); K.shadow(24, 17);
  K.L([[18, 40], [13, 44], [9, 46]], 2.2, 1, ROOT_R); K.L([[30, 40], [35, 44], [39, 46]], 2.2, 1, ROOT_R); K.L([[24, 42], [24, 46]], 2, 1.2, ROOT_R);
  K.L([[16, 34], [8, 30], [4, 34 + s]], 1.8, 1.1, O[1]); K.L([[32, 34], [40, 31], [44, 35 - s]], 1.8, 1.1, O[1]);
  K.B(24, 36, 11, 7.4, O[1]); K.flat(K.el(24, 38, 6, 2.6), '#1a0508', O[1][0]); K.fangs(20, 28, 36, 1, 3, 2); K.px(19, 33, '#ffd23a'); K.px(29, 33, '#ffd23a');
  K.L([[32, 24], [41, 20], [45, 13 - s]], 2, 1.2, P); [[43, 8], [46, 8], [48, 11]].forEach(f => K.L([[45, 13 - s], [f[0], f[1] - s]], 0.7, 0.6, P));
  K.L([[16, 24], [7, 22], [3, 15 + s]], 2, 1.2, P); K.G([[3, 15 + s], [0, 10 + s], [5, 12 + s]], BONE_R);
  K.B(24, 24, 9, 7, P); K.eye(20, 23, 2.6, '#ffd23a', true); K.eye(28, 24, 1.6, '#ffd23a'); K.rect(22, 28, 5, 1, P[0]);
  K.G([[15, 13], [9, 8 + s], [17, 10]], O[0]); K.G([[33, 13], [39, 8 + s], [31, 10]], O[0]);
  K.B(24, 12, 7, 6.4, O[0]); K.eye(24, 11, 3.4, '#9fe8f0', true); K.L([[24, 6], [22, 2 + s]], 0.8, 0.6, O[0]); K.L([[26, 6], [29, 2 - s]], 0.8, 0.6, O[0]);
  drawMask(K, 33, 37, 2.4, 3, 2); K.B(15, 31, 2.2, 2.2, EGG_R);
  return { cx: 24, cy: 26, R: 12, top: 2, bot: 46, head: [24, 1], back: [[32, 9], [16, 9], [36, 22]], belly: [24, 43], side: [36, 28], under: [[9, 47], [24, 47], [39, 47]] };
};
FORMS.mix4 = (K, st, P, Q, fr) => {             // 경계 없는 살: 어디까지가 한 마리인지 알 수 없다
  const s = SW(fr), O = others(P); K.shadow(26, 24);
  K.L([[6, 44], [2, 40], [3, 33 + s]], 2, 1, O[0]); K.L([[46, 44], [50, 38], [48, 31 - s]], 2, 1, O[0]); K.L([[12, 46], [8, 50]], 1.6, 0.8, ROOT_R); K.L([[40, 46], [45, 50]], 1.6, 0.8, ROOT_R); K.L([[26, 46], [26, 51]], 1.6, 1, ROOT_R);
  gem(K, [[38, 14], [43, 4 - s], [47, 15], [44, 22]], 43, O[3]); gem(K, [[10, 18], [7, 8 + s], [13, 14]], 9, O[3]);
  K.B(12, 36, 10, 9, O[0]); K.B(40, 37, 10, 8.4, O[1]); K.B(26, 40, 12, 8, P); K.B(19, 24, 10, 9, P); K.B(34, 24, 9.4, 8.4, O[2]); K.B(26, 13, 8, 7, O[1]);
  K.flat(K.el(26, 41, 8, 3.4), '#1a0508', P[0]); K.fangs(20, 32, 39, 1, 4, 2); K.fangs(21, 31, 43, -1, 2, 3);
  K.flat(K.el(11, 38, 4, 2), '#1a0508', O[0][0]); K.fangs(8, 14, 37, 1, 2, 2);
  K.eye(19, 23, 4, '#ffd23a', true); K.eye(35, 23, 2.8, '#9fe8f0', true); K.eye(41, 35, 2, '#ffd23a', false, fr === 2 ? 1 : 0); K.eye(26, 12, 2.4, '#f2696f', true); K.eye(9, 31, 1.6, '#ffd23a'); K.eye(30, 31, 1.4, '#ffd23a');
  drawMask(K, 43, 26, 2.6, 3.2, 1); drawMask(K, 14, 16, 2.4, 3, 0);
  K.B(30, 6 + s, 2.6, 2.6, EGG_R); K.B(21, 6 - s, 2.2, 2.2, EGG_R); K.L([[26, 6], [26, 1 + s]], 0.8, 0.6, O[1]); K.spark(26, 0 + s, '#fff3a0', fr % 2 === 0);
  for (let k = 0; k < 5; k++) K.px(17 + k * 4, 47 + (k % 2), k % 2 ? P[1] : O[1][1]);
  return { cx: 26, cy: 28, R: 16, top: 4, bot: 50, head: [26, 2], back: [[38, 14], [12, 16], [44, 28]], belly: [26, 47], side: [47, 36], under: [[10, 51], [26, 51], [42, 51]] };
};
// ---------- 부 징조: 두 번째로 많이 먹은 것이 몸의 한 군데에 다른 색 기관으로 돋는다 ----------
function subOrgan(K, sub, Q, A, st, fr) {
  const n = st - 1, s = SW(fr), QR = [Q[0], Q[1], Q[2], Q[3]], clampY = y => Math.max(2, y);
  if (sub === 'abyss') { for (let i = 0; i < Math.min(n + 1, A.back.length); i++) { const [bx, by] = A.back[i]; K.G([[bx - 3, by + 1], [bx + 1, clampY(by - 6 - n) + (i % 2 ? s : 0)], [bx + 3, by + 1]], QR); } const [sx, sy] = A.side; K.px(sx, sy + 3, '#9fe8f0'); K.px(sx, sy + 5 + ((fr + 1) % 3), '#9fe8f0'); }
  if (sub === 'nebula') { const [hx, hy] = A.head, y = clampY(hy); K.lit(ringM(K, hx, y, 5 + n, 1.9, 1), GOLD_R); for (let i = 0; i < n; i++) { const [bx, by] = A.back[i % A.back.length]; K.spark(bx + (i % 2 ? 3 : -3), clampY(by - 5 - i), Q[2], (fr + i) % 2 === 0); } }
  if (sub === 'brood') for (let i = 0; i < Math.min(n + 1, A.back.length); i++) { const [bx, by] = A.back[i], r = i === 0 ? 2.8 : 2.2; K.B(bx, by, r, r, QR); K.px(bx, by + ((fr + i) % 2), INKY); }
  if (sub === 'dusk') { const [sx, sy] = A.side; drawMask(K, sx, sy, 2.4 + (n > 1 ? 0.8 : 0), 3 + (n > 1 ? 0.8 : 0), 1); if (n >= 3) { const [bx, by] = A.back[1]; drawMask(K, bx, by, 2.4, 3, 2); } }
  if (sub === 'hunger') { const [bx, by] = A.belly, w = 2.6 + n; K.flat(K.el(bx, by, w, 1.5 + n * 0.25), '#1a0508', Q[0]); K.fangs(Math.round(bx - w + 1), Math.round(bx + w - 1), Math.round(by - 1), 1, 2, 2); K.px(bx - w - 1, by, Q[1]); K.px(bx + w + 1, by, Q[1]); }
}
