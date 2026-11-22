// 옛 것의 둥지 — 바탕: 공통 도구, 저장, 소리, 조각 도구
// (build.sh가 base.js부터 shell.js까지를 한 함수 안에 이어 붙인다)
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 저장 ----------
// 저장 판 3: 둥지 싸움만 남긴 판. 그 전의 저장(카드 판·이야기·자유 판)은 읽지 않고 old. 아래로 치워 둔다.
const SAVE_V = 3;
const SAVE_KEYS = { meta: 1, lairrun: 1 };
const store = {
  get(k) { try { const v = localStorage.getItem('oldnest.' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { if (v && typeof v === 'object' && !Array.isArray(v) && k === 'meta') v.sv = SAVE_V; localStorage.setItem('oldnest.' + k, JSON.stringify(v)); } catch (e) { /* 저장이 막힌 환경 */ } },
  del(k) { try { localStorage.removeItem('oldnest.' + k); } catch (e) { /* 저장이 막힌 환경 */ } },
};
const META0 = () => ({ sound: true, music: true, shake: true, trace: true, vol: { master: 1, music: 1, sfx: 1 }, introSeen: 0, lairTut: 0, lairRow: 0, lairSpeed: 1, runs: 0, wins: 0, seen: { kin: {}, inv: {}, room: {}, form: {} }, last: [] });
// 옛 저장에서 설정만 건진다: 소리, 음악, 흔들림, 기록 남기기, 소리 크기, 여는 이야기를 보았는지
function carrySettings(o) {
  const m = {}; if (!o || typeof o !== 'object' || Array.isArray(o)) return m;
  ['sound', 'music', 'shake', 'trace'].forEach(k => { if (typeof o[k] === 'boolean') m[k] = o[k]; });
  if (o.vol && typeof o.vol === 'object' && !Array.isArray(o.vol)) { m.vol = {}; ['master', 'music', 'sfx'].forEach(k => { const v = +o.vol[k]; m.vol[k] = isFinite(v) && o.vol[k] != null ? Math.max(0, Math.min(1, v)) : 1; }); }
  if (o.introSeen) m.introSeen = 1;
  return m;
}
// 기록 고치기: 칸 하나가 이상해도 첫 화면이 멈추지 않게 기본값으로 채운다
function repairMeta(m) {
  const d = META0(); if (!m || typeof m !== 'object' || Array.isArray(m)) m = {};
  for (const k in d) { const dv = d[k], mv = m[k];
    if (Array.isArray(dv)) { if (!Array.isArray(mv)) m[k] = dv; }
    else if (typeof dv === 'object') { if (!mv || typeof mv !== 'object' || Array.isArray(mv)) m[k] = dv; else for (const s in dv) { const a = dv[s], b = mv[s]; if (typeof a === 'object' ? (!b || typeof b !== 'object' || Array.isArray(b)) : (typeof b !== typeof a || !isFinite(b))) mv[s] = a; } }
    else if (typeof mv !== typeof dv || (typeof dv === 'number' && !isFinite(mv))) m[k] = dv; }
  m.last = m.last.filter(r => r && typeof r === 'object' && !Array.isArray(r)).slice(-10);
  m.sv = SAVE_V; return m;
}
// 옛 저장 치우기: oldnest.<이름> 가운데 지금 쓰지 않는 것, 판 번호가 다른 meta 를 oldnest.old.<이름> 으로 옮긴다. 옮기지 못하면 그대로 둔다.
function setAsideOld() {
  let carried = {};
  try {
    const names = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('oldnest.') === 0 && k.indexOf('oldnest.old.') !== 0) names.push(k.slice(8)); }
    for (const k of names) {
      const raw = localStorage.getItem('oldnest.' + k); let val = null; try { val = raw ? JSON.parse(raw) : null; } catch (e) { val = null; }
      if (k === 'meta' && val && typeof val === 'object' && val.sv === SAVE_V) continue;
      if (k !== 'meta' && SAVE_KEYS[k]) continue;
      if (k === 'meta') carried = carrySettings(val);
      localStorage.removeItem('oldnest.' + k); try { localStorage.setItem('oldnest.old.' + k, raw); } catch (e) { /* 자리가 없으면 버린다 */ }
    }
  } catch (e) { /* 저장을 못 쓰는 환경 */ }
  return carried;
}
const CARRIED = setAsideOld();
let META = Object.assign(META0(), repairMeta(Object.assign(store.get('meta') || {}, CARRIED)));
const saveMeta = () => store.set('meta', META);
// 처음부터: 지금 저장과 치워 둔 옛 저장을 모두 지운다
function wipeSaves() { try { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('oldnest.') === 0) ks.push(k); } ks.forEach(k => localStorage.removeItem(k)); } catch (e) { /* 저장을 못 쓰는 환경 */ } META = repairMeta({}); }
const motionOk = () => META.shake !== false && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// ---------- 소리 ----------
let AC = null;
// 소리 크기: 전체 x 효과음 (설정의 미끄럼 막대)
const sfxVol = () => { const v = META.vol || {}; return Math.max(0, Math.min(1, (v.master == null ? 1 : v.master) * (v.sfx == null ? 1 : v.sfx))); };
// 짧은 신호: 집기, 놓기(쿵), 합쳐짐, 허물, 싸움이 온다
function sfxRich(kind, t, vol) {
  const tone = (f, f2, d, type, g0, at) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t + (at || 0)); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (at || 0) + d); g.gain.setValueAtTime(0.0001, t + (at || 0)); g.gain.exponentialRampToValueAtTime(g0 * vol, t + (at || 0) + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (at || 0) + d); o.connect(g); g.connect(AC.destination); o.start(t + (at || 0)); o.stop(t + (at || 0) + d + 0.02); };
  const noise = (d, g0, hp, at) => { const n = Math.floor(AC.sampleRate * d), b = AC.createBuffer(1, n, AC.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n); const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); src.buffer = b; f.type = 'bandpass'; f.frequency.value = hp; g.gain.value = g0 * vol; src.connect(f); f.connect(g); g.connect(AC.destination); src.start(t + (at || 0)); };
  if (kind === 'card') { noise(0.06, 0.18, 2400); tone(660, 990, 0.06, 'triangle', 0.05); return true; }
  if (kind === 'thud') { tone(120, 45, 0.22, 'sine', 0.22); noise(0.09, 0.22, 300); return true; }
  if (kind === 'combo') { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0, 0.18, 'triangle', 0.06, i * 0.05)); return true; }
  if (kind === 'molt') { tone(55, 110, 1.0, 'sawtooth', 0.07); tone(82, 165, 1.0, 'sine', 0.08, 0.05); noise(0.9, 0.06, 500, 0.1); [196, 247, 294, 392].forEach((f, i) => tone(f, 0, 0.7, 'sine', 0.05, 0.55 + i * 0.04)); return true; }
  if (kind === 'night') { tone(73, 70, 1.2, 'sine', 0.12); tone(110, 0, 0.9, 'triangle', 0.03, 0.15); tone(1480, 1400, 0.6, 'sine', 0.02, 0.3); return true; }
  return false;
}
function sfx(kind) {
  if (!META.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const vol = sfxVol(); if (vol <= 0) return; if (sfxRich(kind, AC.currentTime, vol)) return;
    const seq = { hit: [[150, .05, 'square']], trap: [[320, .05, 'sawtooth'], [110, .09, 'sawtooth']], coin: [[880, .05, 'square'], [1320, .08, 'square']], up: [[523, .07, 'square'], [659, .07, 'square'], [784, .07, 'square'], [1047, .14, 'square']], down: [[392, .09, 'square'], [311, .09, 'square'], [233, .18, 'square']], die: [[200, .06, 'triangle'], [90, .12, 'triangle']], evo: [[392, .1, 'square'], [523, .1, 'square'], [659, .1, 'square'], [784, .1, 'square'], [1047, .3, 'square']], step: [[90, .03, 'triangle']], click: [[660, .03, 'square']], talk: [[440, .02, 'square']], mad: [[700, .05, 'sine'], [520, .05, 'sine'], [760, .1, 'sine']], spell: [[220, .08, 'sine'], [440, .08, 'sine'], [880, .2, 'sine']], dig: [[120, .04, 'sawtooth'], [80, .06, 'sawtooth']], slide: [[300, .05, 'triangle'], [200, .08, 'triangle']] }[kind];
    if (!seq) return;
    let t = AC.currentTime;
    for (const [f, d, type] of seq) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.05 * vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); t += d * 0.9; }
  } catch (e) { /* 소리를 못 내는 환경 */ }
}

// ---------- 조각 도구 (Sculpt): 모양을 만들고, 명암을 입히고, 윤곽선을 두른다. 빛은 왼쪽 위에서 온다 ----------
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
