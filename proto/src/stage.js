// 옛 것의 둥지 — 화면 2/3: 지도(지상·지하)와 밤 전투 재생
const W = 960, H = 550, GX = 20, GY = 48, CW = 184, CH = 124, S = 2;
const cellRect = i => ({ x: GX + (i % 5) * CW, y: GY + Math.floor(i / 5) * CH, w: CW, h: CH });
const locIdx = loc => loc === 'core' ? NEST.CORE : +loc;
const floorY = r => r.y + r.h - 20;
PAL.shade = ['#101018', '#2a2a3a', '#2a2a3a', '#20202c', '#20202c'];
const VPOS = { gaet: { x: 92, y: 214 }, field: { x: 258, y: 146 }, bell: { x: 480, y: 118 }, school: { x: 702, y: 146 }, fort: { x: 868, y: 214 } };
const PPOS = [{ x: 244, y: 348 }, { x: 480, y: 322 }, { x: 716, y: 348 }], CAVE = { x: 480, y: 486 };
const SPOS = [{ x: 120, y: 440 }, { x: 362, y: 424 }, { x: 600, y: 424 }, { x: 842, y: 440 }];
const ST = { screen: 'under', p: 1, mode: 'day', ents: null, defs: {}, floats: [], sparks: [], cam: { x: 0, tx: 0 }, camMem: { surface: 240, under: 0 }, viewW: W, ox: 0, fm: 1, fire: {}, sanfx: {}, shake: 0, flash: 0, speed: 1, skip: false, label: '', hud: null, hover: null, focus: null, march: null };
const now = () => performance.now();
function rect(x, col, a, b, w, h) { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); }
function txt(x, s, px, py, col, size, align) { const z = size || 13, sz = z <= 20 ? Math.round(z * ST.fm) : z; x.font = sz + 'px "NestPix", "Do Hyeon", "Malgun Gothic", sans-serif'; x.textAlign = align || 'left'; x.textBaseline = 'top'; x.fillStyle = '#0b0c16'; x.fillText(s, px + 1, py + 1); x.fillStyle = col || '#ece6d6'; x.fillText(s, px, py); }
function tagL(x, s, px, py, col, size, accent) { const z = Math.round((size || 13) * ST.fm); x.font = z + 'px "NestPix", "Do Hyeon", "Malgun Gothic", sans-serif'; const w = x.measureText(s).width + 12; rect(x, '#07050cd0', px - 4, py - 3, w, z + 7); if (accent) rect(x, accent, px - 4, py - 3, 2, z + 7); txt(x, s, px + 2, py, col, size); }
function plate(x, s, cx, y, col, size) { const z = Math.round((size || 13) * ST.fm); x.font = z + 'px "NestPix", "Do Hyeon", "Malgun Gothic", sans-serif'; const w = x.measureText(s).width + 10; rect(x, '#0b0c16bb', cx - w / 2, y - 2, w, z + 6); txt(x, s, cx, y, col, size, 'center'); }
function camTo(lx, snap) { if (!snap && ST.mode === 'night' && ST.camHold > now()) return; const max = Math.max(0, W - ST.viewW); ST.cam.tx = Math.max(0, Math.min(max, lx - ST.viewW / 2)); if (snap === true) ST.cam.x = ST.cam.tx; }
function villState(v) { const s = G.vill[v]; return s.razed ? '폐허' : s.tribute ? '공물 중' : s.host >= 50 ? '보복 준비' : s.host >= 15 ? '수상히 여김' : '평온'; }
function slimeScale(sl) { return slimeCanvas(sl, 0).width / 8; }   // 그림 한 점이 지도 2px. 권속과 점 크기가 같다
function defPos(loc, k, small) {
  const r = cellRect(locIdx(loc)), fy = floorY(r), sz = small ? 16 : 32;
  if (loc === 'core') return { x: r.x + 68 - (k % 3) * 24, y: fy - sz + 2 - Math.floor(k / 3) * 20 };
  return { x: r.x + r.w - 14 - 32 - (k % 4) * 26 + (small ? 8 : 0), y: fy - sz + 2 - Math.floor(k / 4) * 24 };
}
const invPos = (r, j) => ({ x: r.x + 8 + (j % 4) * 20, y: floorY(r) - 30 - (Math.floor(j / 4) % 3) * 22 });

// ---------- 지하 ----------
// 처음에는 빛 없는 동굴 한 칸이다. 파지 않은 곳은 보이지 않고, 판 곳 바로 옆만 어렴풋이 드러난다.
// 허물을 벗을 때마다 둥지 전체가 본체의 징조를 닮아 간다(biome). 바탕은 칸마다 한 번 그려 두고 다시 쓴다. 모든 점은 2px 격자에 맞춘다.
const hsh = (a, b) => { let n = Math.imul(a + 1, 374761393) ^ Math.imul(b + 7, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const hx3 = c => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
const mixc = (a, b, k) => { const A = hx3(a), B = hx3(b); return '#' + A.map((v, n) => Math.round(v + (B[n] - v) * k).toString(16).padStart(2, '0')).join(''); };
const ev2 = v => Math.floor(v / 2) * 2, BG = {}, DARKC = '#07050a';
const STK = [0, 0.38, 0.6, 0.82, 1], DARK = [0.40, 0.30, 0.22, 0.14, 0.06];   // 허물 단계마다: 환경이 물드는 정도, 칸을 덮는 어둠
function biome() { const sl = G.slime, st = sl.main ? Math.max(1, Math.min(4, sl.stage)) : 0; return { st, main: st ? sl.main : 'base', sub: st >= 2 && sl.sub && sl.sub !== sl.main ? sl.sub : '', k: STK[st], key: st + (st ? sl.main : '') + (st >= 2 && sl.sub ? sl.sub : '') }; }
const visible = i => G.cells[i].dug || NEST.nbrs(i).some(j => G.cells[j].dug);
function rockTex(x, i, x0, y0, w, h, base) {
  x.fillStyle = base; x.fillRect(x0, y0, w, h);
  for (let b = 0; b < 5; b++) { const y = y0 + ev2(hsh(i, b) * (h - 12)), t = 6 + ev2(hsh(i, b + 9) * 8); x.fillStyle = mixc(base, b % 2 ? '#000000' : '#7a6a9a', 0.10); x.fillRect(x0, y, w, Math.min(t, y0 + h - y)); }
  for (let k = 0; k < 14; k++) { const sw = 8 + ev2(hsh(i, k + 60) * 12), sh = 4 + ev2(hsh(i, k + 80) * 6), sx = x0 + ev2(hsh(i, k + 20) * (w - sw)), sy = y0 + ev2(hsh(i, k + 40) * (h - sh));
    x.fillStyle = mixc(base, '#8a7aa8', 0.12); x.fillRect(sx, sy, sw, sh); x.fillStyle = mixc(base, '#000000', 0.38); x.fillRect(sx, sy + sh - 2, sw, 2); x.fillRect(sx + sw - 2, sy, 2, sh); x.fillStyle = mixc(base, '#b8a8d8', 0.16); x.fillRect(sx, sy, sw - 2, 2); }
  for (let k = 0; k < 16; k++) { x.fillStyle = mixc(base, hsh(i, k + 120) > 0.5 ? '#000000' : '#9a8ab8', 0.28); x.fillRect(x0 + ev2(hsh(i, k + 140) * (w - 2)), y0 + ev2(hsh(i, k + 160) * (h - 2)), 2, 2); }
}
// 징조마다 굴에 돋는 것들. n: 1(조금) … 4(온통). o: 무작위 씨앗의 자리(부 징조는 다른 자리를 쓴다). top(px): 그 자리의 천장 높이
const DECO = {
  base(x, i, n, o, w, fy, top, B) {   // 맨 동굴: 금 간 바위와 뼛조각뿐
    for (let k = 0; k < 3; k++) { let px = ev2(20 + hsh(i, o + k) * (w - 40)), py = ev2(26 + hsh(i, o + k + 5) * 30); x.fillStyle = '#0a0810'; for (let q = 0; q < 6; q++) { x.fillRect(px, py, 2, 4); py += 4; px += hsh(i, o + k * 9 + q + 20) > 0.5 ? 2 : -2; } }
    if (hsh(i, o + 40) > 0.5) { const bx = ev2(80 + hsh(i, o + 41) * 70); x.fillStyle = '#6a6470'; x.fillRect(bx, fy - 2, 10, 2); x.fillRect(bx - 2, fy - 4, 2, 2); x.fillRect(bx + 10, fy - 4, 2, 2); }
  },
  abyss(x, i, n, o, w, fy, top, B) {   // 젖은 바위: 물줄기, 고인 물, 따개비, 산호, 푸른 빛
    for (let k = 0; k < n * 3; k++) { const px = ev2(10 + hsh(i, o + k) * (w - 20)), len = 10 + ev2(hsh(i, o + k + 30) * 26), py = top(px) + 2 + ev2(hsh(i, o + k + 60) * 20); x.fillStyle = mixc(B.wall, '#9fe8f0', 0.16); x.fillRect(px, py, 2, Math.min(len, fy - py - 2)); }
    for (let k = 0; k < Math.min(2, n); k++) { const pw = 22 + ev2(hsh(i, o + k + 90) * 22), px = ev2(70 + hsh(i, o + k + 95) * (w - 90 - pw)); x.fillStyle = '#0c3a50'; x.fillRect(px, fy, pw, 4); x.fillStyle = '#1f8fa8'; x.fillRect(px + 2, fy, pw - 4, 2); x.fillStyle = '#9fe8f0'; x.fillRect(px + 6, fy, 6, 2); }
    for (let k = 0; k < n * 4; k++) { const px = ev2(8 + hsh(i, o + k + 120) * (w - 16)), py = ev2(top(px) + 6 + hsh(i, o + k + 150) * (fy - top(px) - 14)); x.fillStyle = k % 3 ? '#3fb8d0' : '#9fe8f0'; x.fillRect(px, py, 2, 2); }
    if (n >= 2) for (let k = 0; k < n * 2; k++) { const px = ev2(k % 2 ? 8 + hsh(i, o + k + 200) * 30 : w - 40 + hsh(i, o + k + 200) * 28), py = fy - 6 - ev2(hsh(i, o + k + 210) * 14); x.fillStyle = '#8ab0b8'; x.fillRect(px, py, 6, 4); x.fillStyle = '#0c1a26'; x.fillRect(px + 2, py, 2, 2); }
    if (n >= 3) for (let k = 0; k < n - 1; k++) { const px = ev2(84 + hsh(i, o + k + 240) * (w - 110)), hh = 10 + ev2(hsh(i, o + k + 250) * 10), c = k % 2 ? '#d86a8a' : '#1f8fa8'; x.fillStyle = c; x.fillRect(px, fy - hh, 2, hh); x.fillRect(px - 4, fy - hh + 2, 2, hh - 6); x.fillRect(px + 4, fy - hh - 2, 2, hh - 4); x.fillRect(px - 4, fy - 6, 10, 2); x.fillStyle = mixc(c, '#ffffff', 0.5); x.fillRect(px, fy - hh, 2, 2); x.fillRect(px + 4, fy - hh - 2, 2, 2); x.fillRect(px - 4, fy - hh + 2, 2, 2); }
  },
  nebula(x, i, n, o, w, fy, top, B) {   // 수정이 돋고 벽에 별이 박힌다
    for (let k = 0; k < n * 6; k++) { const px = ev2(8 + hsh(i, o + k) * (w - 16)), py = ev2(top(px) + 4 + hsh(i, o + k + 30) * (fy - top(px) - 12)); x.fillStyle = k % 4 ? '#e0c8ff' : '#fff3a0'; x.fillRect(px, py, 2, 2); if (k % 5 === 0) { x.fillRect(px - 2, py, 6, 2); x.fillRect(px, py - 2, 2, 6); } }
    const shard = (px, by, ww, hh, dir) => { for (let q = 0; q < hh; q += 2) { const wd = Math.max(2, ev2(ww * (1 - q / hh))), xx = px + ev2((ww - wd) / 2), yy = dir > 0 ? by - q - 2 : by + q; x.fillStyle = '#8a5fe0'; x.fillRect(xx, yy, wd, 2); x.fillStyle = '#e0c8ff'; x.fillRect(xx, yy, 2, 2); if (wd > 4) { x.fillStyle = '#4a2a9a'; x.fillRect(xx + wd - 2, yy, 2, 2); } } };
    for (let k = 0; k < n * 2; k++) { const up = k % 3 === 2, ww = 6 + ev2(hsh(i, o + k + 70) * 6), hh = 10 + ev2(hsh(i, o + k + 80) * (8 + n * 4)), px = ev2((k % 2 ? 78 : 10) + hsh(i, o + k + 90) * (k % 2 ? w - 100 : 30)); if (up) shard(px, top(px), ww, hh, -1); else shard(px, fy, ww, hh, 1); }
  },
  brood(x, i, n, o, w, fy, top, B) {   // 이끼, 뿌리, 선반 버섯, 알
    for (let k = 0; k < n * 3; k++) { const pw = 8 + ev2(hsh(i, o + k) * 16), px = ev2(6 + hsh(i, o + k + 20) * (w - 12 - pw)), onTop = k % 3 === 0, py = onTop ? top(px + pw / 2) : fy - 2; x.fillStyle = '#2f7a2a'; x.fillRect(px, py, pw, onTop ? 4 : 4); x.fillStyle = '#6fbf3f'; x.fillRect(px + 2, py, pw - 6, 2); x.fillStyle = '#d0f08a'; x.fillRect(px + 4, py, 2, 2); }
    for (let k = 0; k < Math.ceil(n * 1.5); k++) { let px = ev2(14 + hsh(i, o + k + 60) * (w - 28)), py = top(px); const len = 12 + ev2(hsh(i, o + k + 70) * (10 + n * 6)); x.fillStyle = '#3a2c20'; for (let q = 0; q < len; q += 4) { x.fillRect(px, py + q, 2, 4); if (hsh(i, o + k * 7 + q + 80) > 0.6) px += hsh(i, o + k + q) > 0.5 ? 2 : -2; } x.fillStyle = '#6fbf3f'; x.fillRect(px, py + len, 2, 2); }
    if (n >= 2) for (let k = 0; k < n; k++) { const right = k % 2, py = ev2(34 + hsh(i, o + k + 120) * 36), px = right ? w - 22 : 8; x.fillStyle = '#8a7850'; x.fillRect(px + (right ? 4 : 0), py + 2, 10, 2); x.fillStyle = '#4f9f3a'; x.fillRect(px + (right ? 2 : 0), py, 12, 2); x.fillRect(px + (right ? 6 : 0), py - 2, 8, 2); x.fillStyle = '#d0f08a'; x.fillRect(px + (right ? 8 : 2), py - 2, 2, 2); }
    if (n >= 3) for (let k = 0; k < n - 1; k++) { const px = ev2(90 + hsh(i, o + k + 150) * (w - 120)); x.fillStyle = '#b8b070'; x.fillRect(px, fy - 6, 6, 6); x.fillRect(px + 6, fy - 4, 4, 4); x.fillStyle = '#f0e8c0'; x.fillRect(px, fy - 6, 4, 2); x.fillRect(px + 6, fy - 4, 2, 2); }
  },
  dusk(x, i, n, o, w, fy, top, B) {   // 거미줄 같은 실, 늘어진 막, 고치, 나방 가루
    const web = (cx, cy, sx) => { x.fillStyle = 'rgba(240,224,200,.30)'; for (let a = 0; a < 3 + n; a++) { const dx = 1 + a * 0.5, len = 14 + n * 6 + a * 2; for (let q = 0; q < len; q += 2) x.fillRect(Math.round(cx + sx * q * dx / (1 + a * 0.35)), Math.round(cy + q * (1 - a / (4 + n))), 2, 2); } for (let q = 8; q < 14 + n * 6; q += 8) x.fillRect(cx + (sx > 0 ? 0 : -q), cy + q, q, 1); };
    web(8, top(8) + 2, 1); web(w - 10, top(w - 10) + 2, -1);
    if (n >= 2) for (let k = 0; k < n; k++) { const px = ev2(60 + hsh(i, o + k) * (w - 90)), pw = 10 + ev2(hsh(i, o + k + 20) * 8), len = 16 + ev2(hsh(i, o + k + 30) * (8 + n * 6)), py = top(px + pw / 2); x.fillStyle = 'rgba(224,138,58,.26)'; x.fillRect(px, py, pw, len); x.fillStyle = 'rgba(255,224,160,.30)'; x.fillRect(px, py, 2, len); for (let q = 0; q < pw; q += 4) { x.fillStyle = 'rgba(224,138,58,.26)'; x.fillRect(px + q, py + len, 2, 2 + ev2(hsh(i, o + k + q) * 6)); } }
    if (n >= 2) for (let k = 0; k < n - 1; k++) { const px = ev2(30 + hsh(i, o + k + 60) * (w - 60)), py = top(px), len = 8 + ev2(hsh(i, o + k + 70) * 12); x.fillStyle = 'rgba(240,224,200,.5)'; x.fillRect(px + 2, py, 1, len); x.fillStyle = '#c8a070'; x.fillRect(px, py + len, 6, 10); x.fillStyle = '#ffe0a0'; x.fillRect(px, py + len, 2, 8); x.fillStyle = '#8a5a3a'; x.fillRect(px + 4, py + len + 2, 2, 8); }
    for (let k = 0; k < n * 4; k++) { const px = ev2(8 + hsh(i, o + k + 100) * (w - 16)), py = ev2(top(px) + 8 + hsh(i, o + k + 130) * (fy - top(px) - 16)); x.fillStyle = k % 2 ? 'rgba(255,224,160,.7)' : 'rgba(240,160,74,.7)'; x.fillRect(px, py, 2, 2); }
  },
  hunger(x, i, n, o, w, fy, top, B) {  // 살로 덮인 벽: 핏줄, 이빨, 갈비
    if (n >= 4) { x.strokeStyle = 'rgba(207,200,180,.42)'; x.lineWidth = 4; for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(62 + k * 42, fy + 6, 16, fy - 26, 0, Math.PI, Math.PI * 2); x.stroke(); } }
    for (let k = 0; k < n * 2; k++) { let px = ev2(10 + hsh(i, o + k) * (w - 20)), py = top(px) + 4; const len = 16 + ev2(hsh(i, o + k + 20) * 30); for (let q = 0; q < len; q += 2) { x.fillStyle = k % 2 ? '#7a121c' : '#c8303a'; x.fillRect(px, py + q, 2, 2); if (hsh(i, o + k * 11 + q + 40) > 0.55) px += hsh(i, o + k + q + 3) > 0.5 ? 2 : -2; if (py + q > fy - 8) break; } }
    for (let k = 0; k < n; k++) { const px = ev2(12 + hsh(i, o + k + 90) * (w - 30)), py = ev2(top(px) + 14 + hsh(i, o + k + 95) * (fy - top(px) - 34)); x.fillStyle = '#7a121c'; x.fillRect(px, py, 10, 8); x.fillStyle = '#b8303a'; x.fillRect(px + 2, py, 6, 6); x.fillStyle = '#ff9a8a'; x.fillRect(px + 2, py, 2, 2); }
    if (n >= 2) for (let px = 12 + ev2(hsh(i, o + 120) * 10); px < w - 14; px += n >= 4 ? 12 : 22) { if (px > 34 && px < 74) continue; const hh = 4 + ev2(hsh(i, px + o) * (n >= 3 ? 8 : 4)), ty = top(px + 2); x.fillStyle = '#cfc8b4'; x.fillRect(px, ty, 6, hh - 2); x.fillRect(px + 2, ty + hh - 2, 2, 2); x.fillStyle = '#fbf7ea'; x.fillRect(px, ty, 2, hh - 2); }
    if (n >= 3) for (const px of [8, 16, w - 24, w - 14]) { x.fillStyle = '#cfc8b4'; x.fillRect(px, fy - 6, 4, 6); x.fillStyle = '#fbf7ea'; x.fillRect(px, fy - 6, 2, 4); }
  },
};
const BIO = {
  base: { rock: '#262034', floor: '#3a3244', lit: '#8fa89a' }, abyss: { rock: '#12303f', floor: '#1b4a5e', lit: '#3fb8d0' }, nebula: { rock: '#2a1f52', floor: '#3a2c72', lit: '#b08fff' },
  brood: { rock: '#1f3320', floor: '#34502a', lit: '#7fd04f' }, dusk: { rock: '#3e2a1e', floor: '#5c3e26', lit: '#f0a04a' }, hunger: { rock: '#4a1820', floor: '#6a2428', lit: '#f2696f' },
};
// 위아래 칸을 잇는 것: 맨 동굴은 발 디딜 홈, 그 뒤로는 징조에 따라 다르다
function climb(x, b, mx, y1, y2, i) {
  const m = b.main;
  if (m === 'base') { for (let y = y1 + 4, k = 0; y < y2 - 2; y += 10, k++) { x.fillStyle = '#3a3444'; x.fillRect(mx + (k % 2 ? 2 : -10), y, 8, 2); x.fillStyle = '#0a0810'; x.fillRect(mx + (k % 2 ? 2 : -10), y + 2, 8, 2); } return; }
  if (m === 'hunger') { x.fillStyle = '#7a121c'; x.fillRect(mx - 1, y1, 2, y2 - y1); for (let y = y1 + 2; y < y2 - 4; y += 8) { x.fillStyle = '#cfc8b4'; x.fillRect(mx - 6, y, 12, 4); x.fillStyle = '#fbf7ea'; x.fillRect(mx - 6, y, 12, 2); x.fillStyle = '#a8a294'; x.fillRect(mx - 10, y + 2, 4, 2); x.fillRect(mx + 6, y + 2, 4, 2); } return; }
  if (m === 'nebula') { for (let y = y1 + 4, k = 0; y < y2 - 2; y += 10, k++) { const px = mx + (k % 2 ? 0 : -10); x.fillStyle = '#8a5fe0'; x.fillRect(px, y, 10, 4); x.fillStyle = '#e0c8ff'; x.fillRect(px, y, 10, 2); x.fillStyle = '#4a2a9a'; x.fillRect(px + 2, y + 4, 6, 2); } return; }
  const col = { abyss: ['#0f5a78', '#3fb8d0', '#9fe8f0'], brood: ['#3a2c20', '#6a4a2a', '#6fbf3f'], dusk: ['#8a7a60', '#f0e0c8', '#f0a04a'] }[m];
  for (let y = y1, k = 0; y < y2; y += 2, k++) { const sway = Math.round(Math.sin((y + i * 9) / 9) * (m === 'dusk' ? 1 : 3)); x.fillStyle = col[0]; x.fillRect(mx - 2 + sway, y, 4, 2); x.fillStyle = col[1]; x.fillRect(mx - 2 + sway, y, 2, 2); if (k % 6 === 3) { x.fillStyle = col[2]; x.fillRect(mx + (k % 12 === 3 ? 2 : -6) + sway, y, 4, 2); } }
  if (m === 'dusk') for (let y = y1, k = 0; y < y2; y += 2, k++) { x.fillStyle = col[1]; x.fillRect(mx + 5 - Math.round(Math.sin((y + i * 5) / 7) * 2), y, 1, 2); }
}
// mode: 판 칸은 0. 안 판 칸은 1 어렴풋한 바위, 2 팔 수 있는 바위, 3 무른 흙(팔 수 있다), 4 무른 흙(지금은 못 판다)
function cellBg(i, c, b, nb, mode) {
  const key = i + '|' + (c.dug ? c.type : 'rock' + mode) + '|' + b.key + '|' + nb.join(''); if (BG[key]) return BG[key];
  const cv0 = document.createElement('canvas'); cv0.width = CW; cv0.height = CH; const x = cv0.getContext('2d'), w = CW, h = CH, fy = h - 20, [left, right, up, down] = nb, P = BIO[b.main];
  if (!c.dug) {   // 판 곳 옆에서 어렴풋이 보이는 바위. 판 곳에서 멀어질수록 어둠에 묻힌다
    const soft = mode >= 3, can = mode === 2 || mode === 3;
    rockTex(x, i, 0, 0, w, h, soft ? (can ? '#2e2218' : '#1e1612') : can ? '#17121f' : '#110d17');
    if (soft) { for (let k = 0; k < 26; k++) { x.fillStyle = k % 3 ? '#1a120c' : '#5a4634'; x.fillRect(ev2(hsh(i, k + 700) * (w - 4)), ev2(hsh(i, k + 730) * (h - 4)), k % 4 ? 2 : 4, 2); }
      x.fillStyle = '#120c08'; for (let k = 0; k < 5; k++) { let px = ev2(20 + hsh(i, k + 200) * (w - 40)), py = ev2(8 + hsh(i, k + 210) * 50); for (let n = 0; n < 12; n++) { x.fillRect(px, py, 2, 4); py += 4; px += hsh(i, k * 20 + n + 220) > 0.5 ? 2 : -2; if (py > h - 6) break; } } }
    else if (can) { x.fillStyle = '#0e0b16'; for (let k = 0; k < 3; k++) { let px = ev2(30 + hsh(i, k + 200) * (w - 60)), py = ev2(16 + hsh(i, k + 210) * 30); for (let n = 0; n < 9; n++) { x.fillRect(px, py, 2, 4); py += 4; px += hsh(i, k * 20 + n + 220) > 0.5 ? 2 : -2; } } }
    const fade = (x0, y0, x1, y1) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(7,5,10,0)'); g.addColorStop(1, 'rgba(7,5,10,1)'); x.fillStyle = g; x.fillRect(0, 0, w, h); };
    const reach = can ? 0.8 : 0.6; if (!left) fade(w * reach, 0, 0, 0); if (!right) fade(w * (1 - reach), 0, w, 0); if (!up) fade(0, h * reach, 0, 0); if (!down) fade(0, h * (1 - reach), 0, h);
    x.fillStyle = 'rgba(7,5,10,' + (can ? 0.18 : 0.45) + ')'; x.fillRect(0, 0, w, h);
    return (BG[key] = cv0);
  }
  const built = c.type !== 'empty', wall = mixc(BIO.base.rock, P.rock, b.k), floor = mixc(BIO.base.floor, P.floor, b.k), B = { wall, floor };
  const top = px => (up && px >= 36 && px < 72) ? 0 : 6 + ev2(Math.max(0, 5 + 4 * Math.sin(px / 23 + i * 1.3) + 3 * Math.sin(px / 9 + i * 0.7) + hsh(i, 500 + (px >> 3)) * 4 - (built ? 3 : 0)));
  const side = (py, k) => py > fy - 48 && (k ? right : left) ? 0 : 4 + ev2(Math.max(0, 3 + 3 * Math.sin(py / 13 + i + k * 2) + hsh(i, 600 + k * 40 + (py >> 3)) * 4 - (built ? 2 : 0)));
  rockTex(x, i + 77, 0, 0, w, h, mixc(wall, '#000000', built ? 0.08 : 0.24));                    // 굴 안쪽 벽
  if (built) { x.fillStyle = 'rgba(255,255,255,.035)'; x.fillRect(14, 22, w - 28, fy - 26); }       // 방은 벽을 긁어 고른 자리가 있다
  DECO[b.main](x, i, Math.max(1, b.st), 800, w, fy, top, B); if (b.sub) DECO[b.sub](x, i, 1, 1700, w, fy, top, B);
  // 천장과 옆의 바위(파지 않은 살): 울퉁불퉁하게 남긴다
  for (let px = 0; px < w; px += 2) { const ty = top(px); if (!ty) continue; x.fillStyle = '#0b0911'; x.fillRect(px, 0, 2, ty); x.fillStyle = mixc(wall, '#000000', 0.55); x.fillRect(px, ty, 2, 2); x.fillStyle = 'rgba(7,5,10,.5)'; x.fillRect(px, ty + 2, 2, 6); x.fillStyle = 'rgba(7,5,10,.28)'; x.fillRect(px, ty + 8, 2, 10); }
  for (let py = 0; py < fy; py += 2) for (const k of [0, 1]) { const s = side(py, k); if (!s) continue; x.fillStyle = '#0b0911'; x.fillRect(k ? w - s : 0, py, s, 2); x.fillStyle = mixc(wall, k ? '#000000' : '#ffffff', k ? 0.5 : 0.10); x.fillRect(k ? w - s - 2 : s, py, 2, 2); }
  if (b.main === 'base' || b.st < 3 || b.main === 'abyss') for (let k = 0; k < (built ? 3 : 6); k++) { const sx = ev2(10 + hsh(i, k + 300) * (w - 30)); if (up && sx > 26 && sx < 74) continue; const len = 6 + ev2(hsh(i, k + 310) * 14), ty = top(sx + 4); for (let n = 0; n < len; n += 2) { const wd = Math.max(2, ev2(10 * (1 - n / len))); x.fillStyle = '#0b0911'; x.fillRect(sx + (10 - wd) / 2, ty + n, wd, 2); } if (b.main === 'abyss') { x.fillStyle = '#3fb8d0'; x.fillRect(sx + 4, ty + len, 2, 2); } }   // 종유석
  // 바닥: 고르지 않은 돌바닥
  x.fillStyle = floor; x.fillRect(0, fy, w, h - fy); x.fillStyle = mixc(floor, '#000000', 0.38); x.fillRect(0, fy + 8, w, h - fy - 8);
  for (let px = 0; px < w; px += 2) { const bump = hsh(i, 900 + (px >> 2)) > 0.72; x.fillStyle = mixc(floor, '#ffffff', bump ? 0.34 : 0.18); x.fillRect(px, fy - (bump ? 2 : 0), 2, 2); }
  for (let k = 0; k < 8; k++) { const px = ev2(hsh(i, k + 400) * (w - 6)); x.fillStyle = mixc(floor, '#000000', 0.45); x.fillRect(px, fy + 4 + ev2(hsh(i, k + 410) * 4), 4 + ev2(hsh(i, k + 420) * 6), 2); }
  x.fillStyle = 'rgba(7,5,10,.30)'; x.fillRect(0, fy - 4, w, 4);
  for (const k of [0, 1]) if (!(k ? right : left)) { const s = side(fy - 50, k) + 2; x.fillStyle = '#0b0911'; x.fillRect(k ? w - s : 0, fy - 4, s, h - fy + 4); }
  x.fillStyle = '#0b0911'; x.fillRect(0, h - 4, w, 4);
  // 위아래로 난 굴
  if (up) { x.fillStyle = mixc(wall, '#000000', 0.6); x.fillRect(38, 0, 32, 10); climb(x, b, 54, 0, fy, i); }
  if (down) { x.fillStyle = DARKC; x.fillRect(38, fy, 32, h - fy); x.fillStyle = mixc(floor, '#ffffff', 0.2); x.fillRect(36, fy, 2, 4); x.fillRect(70, fy, 2, 4); climb(x, b, 54, fy - 6, h, i); }
  x.fillStyle = 'rgba(7,5,10,' + DARK[b.st] + ')'; x.fillRect(0, 0, w, h);                         // 어둠: 허물을 벗을수록 걷힌다
  return (BG[key] = cv0);
}
function disc(x, col, cx, cy, r) { x.fillStyle = col; for (let dy = -r; dy < r; dy += 2) { const hf = ev2(Math.sqrt(r * r - (dy + 1) * (dy + 1))); x.fillRect(Math.round(cx - hf), Math.round(cy + dy), hf * 2, 2); } }
// 빛: 미리 그려 둔 둥근 빛을 겹쳐 얹는다
const GLOW = {};
function glow(x, col, cx, cy, rad, a) {
  let g = GLOW[col]; if (!g) { g = GLOW[col] = document.createElement('canvas'); g.width = g.height = 64; const q = g.getContext('2d'), c = hx3(col).join(','), gr = q.createRadialGradient(32, 32, 1, 32, 32, 32); gr.addColorStop(0, 'rgba(' + c + ',.9)'); gr.addColorStop(0.35, 'rgba(' + c + ',.32)'); gr.addColorStop(1, 'rgba(' + c + ',0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); }
  const op = x.globalCompositeOperation, ga = x.globalAlpha; x.globalCompositeOperation = 'lighter'; x.globalAlpha = a; x.drawImage(g, Math.round(cx - rad), Math.round(cy - rad), rad * 2, rad * 2); x.globalAlpha = ga; x.globalCompositeOperation = op;
}
// 방의 불빛: 맨 동굴에는 없다. 허물을 벗으면 징조에 맞는 것이 천장에 돋아 빛난다
function lamp(x, r, i, t, b) {
  if (!b.st) return; const px = r.x + 20, py = r.y + 46, f = Math.floor(t / 180 + i * 1.7) % 3, col = ASPCOL[b.main], m = b.main, hi = { abyss: '#9fe8f0', nebula: '#e0c8ff', brood: '#d0f08a', dusk: '#ffe0a0', hunger: '#ff9a8a' }[m];
  x.save(); x.beginPath(); x.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); x.clip(); glow(x, col, px + 3, py + 2, 70 + b.st * 8 + f * 2, 0.20 + b.st * 0.05); x.restore();
  rect(x, '#0b0911', px + 2, r.y + 30, 2, py - r.y - 34);
  if (m === 'nebula') { rect(x, col, px, py - 4, 6, 4); rect(x, col, px + 2, py - 8, 2, 4); rect(x, col, px + 2, py, 2, 6); rect(x, hi, px, py - 4, 2, 4); rect(x, '#ffffff', px + 2, py - 2 - (f === 1 ? 2 : 0), 2, 2); }
  else if (m === 'dusk') { rect(x, '#c8a070', px - 2, py - 6, 10, 14); rect(x, col, px, py - 4, 6, 10); rect(x, hi, px + 2, py - 2 + (f === 2 ? 2 : 0), 2, 4); rect(x, '#8a5a3a', px - 2, py + 6, 10, 2); }
  else if (m === 'hunger') { const pu = f === 0 ? 2 : 0; rect(x, '#7a121c', px - 2 - pu / 2, py - 6, 10 + pu, 12); rect(x, col, px, py - 4, 6 + pu, 8); rect(x, hi, px, py - 4, 2, 2); rect(x, '#7a121c', px - 4, py - 8, 2, 4); rect(x, '#7a121c', px + 8, py - 8, 2, 4); }
  else if (m === 'brood') { rect(x, '#2f7a2a', px - 2, py - 4, 10, 4); rect(x, col, px - 2, py - 6, 10, 2); rect(x, '#f2e9c9', px + 2, py, 2, 6); rect(x, hi, px, py - 6, 2, 2); rect(x, hi, px + 4 - f * 2, py + 8 + f * 2, 2, 2); }
  else { rect(x, '#0f5a78', px, py - 4, 6, 4); rect(x, col, px - 2, py, 10, 8); rect(x, hi, px, py + 2, 2, 2); rect(x, hi, px + 2, py + 10 + f * 2, 2, 2); }
}
// 굴 안을 떠도는 것들: 물방울, 별 먼지, 포자, 나방 가루, 맥박
function ambient(x, r, i, t, b) {
  if (!b.st) return; const fy = floorY(r), m = b.main, n = b.st;
  if (m === 'abyss') { for (let k = 0; k < Math.ceil(n / 2); k++) { const ph = ((t / 2600) + hsh(i, k + 40)) % 1, px = r.x + ev2(20 + hsh(i, k + 50) * (r.w - 40)); if (ph < 0.5) rect(x, '#9fe8f0', px, r.y + 14 + ph * 2 * (fy - r.y - 16), 2, 4); else if (ph < 0.6) { rect(x, '#9fe8f0', px - 4, fy - 2, 2, 2); rect(x, '#9fe8f0', px + 4, fy - 2, 2, 2); } } }
  else if (m === 'hunger') { x.save(); x.beginPath(); x.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); x.clip(); glow(x, '#f2696f', r.x + r.w / 2, r.y + r.h / 2, 80, (0.03 + n * 0.02) * (0.6 + 0.4 * Math.sin(t / 420 + i))); x.restore(); }
  else for (let k = 0; k < n + 1; k++) { const sp = m === 'brood' ? -1 : m === 'nebula' ? 0.3 : 0.6, ph = ((t / (m === 'brood' ? 5200 : 7000)) * (0.6 + hsh(i, k + 60)) + hsh(i, k + 70)) % 1, px = r.x + 14 + hsh(i, k + 80) * (r.w - 28) + Math.sin(t / 900 + k * 2 + i) * 6, py = sp < 0 ? fy - 6 - ph * (fy - r.y - 24) : r.y + 18 + ((hsh(i, k + 90) + ph * sp) % 1) * (fy - r.y - 28);
    x.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t / 500 + k * 1.7 + i)); rect(x, m === 'brood' ? '#d0f08a' : m === 'nebula' ? (k % 2 ? '#fff3a0' : '#e0c8ff') : '#ffe0a0', px, py, 2, 2); x.globalAlpha = 1; }
}
const CLAW = ['.h...h...h', '.h...h...h', 'h...h...h.', 'h...h...h.', 's...s...s.', 's...s...s.', '.s...s...s', '..........'];
function pickIcon(x, cx, cy, a) { x.globalAlpha = a; CLAW.forEach((row, yy) => { for (let k = 0; k < row.length; k++) { const ch = row[k]; if (ch !== '.') rect(x, ch === 'h' ? '#e8dcb0' : '#b08a4a', cx - 10 + k * 2, cy - 8 + yy * 2, 2, 2); } }); x.globalAlpha = 1; }
// 방의 살림: 권속이 긁어 내고, 뼈와 진과 실로 지은 것들이다
function drawRoom(x, c, i, r, t) {
  const fy = floorY(r), type = c.type, mx = r.x + r.w / 2, firing = ST.fire[i] && t - ST.fire[i] < 320, main = G.slime.main, BN = '#cfc8b4', BH = '#fbf7ea', BD = '#8a8478', RS = '#6a4a2a', RH = '#a87a3a', SN = '#7a4a52';
  if (c.zone && main) { rect(x, ASPCOL[main] + '66', r.x + 8, fy - 3, r.w - 16, 6); for (let k = 0; k < 4; k++) rect(x, ASPCOL[main] + 'aa', r.x + 20 + k * 40 + Math.sin(t / 300 + k) * 4, fy - 8, 3, 3); }
  c.traps.forEach((tr, k) => {
    const bx = r.x + 16 + k * 62;
    if (tr.kind === 'spike') for (let n = 0; n < 4; n++) { const h = firing ? 28 : 8, st = h / 4; for (let q = 0; q < 4; q++) rect(x, q === 3 ? '#ffffff' : q ? BH : BN, bx + n * 11 + q, fy - (q + 1) * st, 10 - q * 2 - (q === 3 ? 2 : 0), st + 1); }
    if (tr.kind === 'rock') { const cy = firing ? fy - 14 : r.y + 36; if (!firing) rect(x, SN, bx + 21, r.y + 10, 2, 16); disc(x, '#3a3444', bx + 22, cy, 14); disc(x, '#6a6478', bx + 22, cy - 1, 12); rect(x, '#9a94a8', bx + 16, cy - 8, 6, 2); rect(x, '#9a94a8', bx + 14, cy - 6, 2, 4); rect(x, '#4a4458', bx + 24, cy + 4, 6, 2); }
    if (tr.kind === 'acid') { rect(x, '#3a6a2a', bx - 2, fy - 2, 48, 4); rect(x, '#8fe05a', bx, fy - 4, 44, 5); rect(x, '#d8ffa0', bx + 6 + (Math.floor(t / 300) % 3) * 10, fy - 4, 4, 2); }
    if (tr.kind === 'mist') for (let n = 0; n < 3; n++) rect(x, firing ? '#d0a8ffcc' : '#a884ff66', bx + n * 14 + Math.sin(t / 400 + n) * 3, fy - 16 - n * 6, 12, 6);
    for (let l = 0; l < tr.lv; l++) rect(x, '#e8c030', bx + l * 7, fy + 6, 4, 4);
  });
  // 표식: 힘줄에 매단 살갗. 색으로 방의 쓰임을 가른다
  const banner = (bx, col) => { rect(x, SN, bx + 9, r.y + 14, 2, 14); rect(x, BN, bx + 2, r.y + 26, 16, 3); rect(x, BH, bx + 2, r.y + 26, 16, 1); rect(x, mixc(col, '#000000', 0.35), bx + 2, r.y + 29, 16, 20); rect(x, col, bx + 4, r.y + 29, 12, 18); rect(x, mixc(col, '#ffffff', 0.35), bx + 4, r.y + 29, 2, 16); for (let q = 0; q < 3; q++) rect(x, mixc(col, '#000000', 0.35), bx + 3 + q * 6, r.y + 49, 3, 3 + (q % 2) * 2); };
  if (type === 'post') banner(r.x + r.w - 30, '#5b9bff');
  if (type === 'hall') { banner(r.x + r.w - 30, '#ff5f57'); banner(r.x + r.w - 56, '#ff5f57'); }
  if (type === 'bighall') { banner(r.x + r.w - 30, '#e8c030'); banner(r.x + r.w - 56, '#ff5f57'); banner(r.x + r.w - 82, '#e8c030'); }
  if (type === 'ambush') { banner(r.x + r.w - 30, '#6fd08c'); const ax = r.x + r.w - 96; rect(x, '#0b0911', ax, fy - 6, 34, 8); rect(x, '#1f4a28', ax - 2, fy - 12, 10, 12); rect(x, '#2f6b3a', ax + 6, fy - 18, 14, 18); rect(x, '#1f4a28', ax + 18, fy - 14, 12, 14); rect(x, '#2f6b3a', ax + 28, fy - 8, 8, 8); if (Math.floor(t / 700 + i) % 4) { rect(x, '#fff3a0', ax + 10, fy - 10, 2, 2); rect(x, '#fff3a0', ax + 18, fy - 10, 2, 2); } }
  if (type === 'decoy') { rect(x, SN, mx - 1, fy - 34, 2, 14); glow(x, '#e8c030', mx, fy - 14, 26, 0.35 + 0.1 * Math.sin(t / 300)); disc(x, '#8a6a1c', mx, fy - 12, 12); disc(x, '#e8c030', mx, fy - 13, 10); rect(x, '#fff3a0', mx - 6, fy - 20, 4, 4); }
  if (type === 'shop') { disc(x, '#5a2a34', mx, fy + 2, 30); rect(x, '#5a2a34', mx - 30, fy - 4, 60, 6); for (let n = 0; n < 3; n++) { const sx = mx - 22 + n * 22, sy = fy - 16 - (n === 1 ? 8 : 0); disc(x, '#b85a6a', sx, sy, 9); disc(x, '#e89aa8', sx, sy - 1, 7); disc(x, '#3a1418', sx, sy, 3); } rect(x, '#e8c030', mx - 2 + Math.round(Math.sin(t / 250) * 8), fy - 6 + (Math.floor(t / 200) % 3) * 2, 2, 4); }
  if (type === 'prison') { rect(x, '#0b0911', mx - 34, fy - 48, 68, 48); const n = Math.min(4, G.prison.length); for (let k = 0; k < n; k++) { rect(x, '#e8b890', mx - 24 + k * 14, fy - 16, 8, 8); rect(x, '#3a2a20', mx - 24 + k * 14, fy - 8, 8, 8); } for (let q = 0; q < 7; q++) { const bx = mx - 33 + q * 11, bend = Math.round((q - 3) * 0.8); rect(x, BD, bx + bend, fy - 50, 3, 18); rect(x, BN, bx, fy - 34, 3, 34); rect(x, BH, bx, fy - 34, 1, 34); } rect(x, BN, mx - 36, fy - 52, 72, 4); rect(x, BH, mx - 36, fy - 52, 72, 1); }
  if (type === 'chapel') { rect(x, '#3a3444', mx - 14, fy - 12, 28, 12); rect(x, '#5a5466', mx - 10, fy - 22, 20, 10); rect(x, '#5a5466', mx - 6, fy - 28, 12, 6); rect(x, '#8a8296', mx - 10, fy - 22, 2, 10); x.strokeStyle = '#e8c030'; x.lineWidth = 3; x.beginPath(); x.ellipse(mx, fy - 40, 13, 7, 0, 0, 7); x.stroke(); rect(x, '#c8a8ff', mx - 3, fy - 43, 6, 6); for (const d of [-26, 22]) { rect(x, '#f2e9c9', mx + d + 1, fy - 8, 2, 8); rect(x, Math.sin(t / 150 + d) > 0 ? '#d0f08a' : '#9fe8f0', mx + d - 2, fy - 12, 8, 4); } }
  if (type === 'ritual') { x.strokeStyle = '#c8303a'; x.lineWidth = 2; x.beginPath(); x.ellipse(mx, fy - 2, 34, 6, 0, 0, 7); x.stroke(); const by = fy - 30 + Math.sin(t / 200) * 2; rect(x, BN, mx - 2, by, 4, 12); rect(x, BH, mx - 2, by, 2, 12); rect(x, BN, mx - 1, by + 12, 2, 4); rect(x, '#c8303a', mx - 4, by + 14, 8, 2); }
  if (type === 'persuade') { rect(x, RS, mx - 10, fy - 16, 20, 16); rect(x, RH, mx - 10, fy - 16, 20, 3); rect(x, RS, mx - 10, fy - 34, 4, 18); rect(x, RH, mx - 10, fy - 34, 2, 18); rect(x, SN, mx + 27, r.y + 10, 2, 16); disc(x, '#f2ecd8', mx + 28, r.y + 32, 7); disc(x, '#f0a04a', mx + 28, r.y + 32, 4); rect(x, '#0b0911', mx + 27, r.y + 30, 2, 4); glow(x, '#f0a04a', mx + 28, r.y + 32, 22, 0.3); }
  if (type === 'altar') { rect(x, '#3a3444', mx - 16, fy - 10, 32, 10); rect(x, '#5a5466', mx - 10, fy - 20, 20, 10); rect(x, '#8a8296', mx - 10, fy - 20, 20, 2); const ac = ASPCOL[main || G.startAsp], ay = fy - 42 - Math.sin(t / 150) * 3; glow(x, ac, mx, ay + 7, 20, 0.4); rect(x, ac, mx - 5, ay, 10, 14); rect(x, mixc(ac, '#ffffff', 0.6), mx - 5, ay, 3, 10); rect(x, ac, mx - 3, ay - 4, 6, 4); rect(x, ac, mx - 3, ay + 14, 6, 4); }
  if (type === 'pool') { rect(x, '#0c3a50', r.x + 26, fy - 4, r.w - 52, 12); rect(x, '#3fb8d0', r.x + 30, fy - 5 + Math.sin(t / 250) * 1.5, r.w - 60, 9); rect(x, '#9fe8f0', r.x + 50 + (t / 30 % 60), fy - 4, 10, 2); }
  if (type === 'sluice') { rect(x, '#3a5a6a', mx - 8, r.y + 8, 16, fy - r.y - 8); rect(x, '#7fa8b8', mx - 8, r.y + 8, 3, fy - r.y - 8); for (let q = 0; q < 5; q++) rect(x, '#1f4a5a', mx - 8, r.y + 18 + q * 18, 16, 2); rect(x, '#3fb8d0', mx - 30, fy - 6, 60, 6); rect(x, '#e8c030', mx - 4, r.y + 34, 8, 8); }
  if (type === 'library') { for (let n = 0; n < 3; n++) { rect(x, '#2a2434', mx - 42, fy - 20 - n * 20, 84, 5); rect(x, '#4a4458', mx - 42, fy - 20 - n * 20, 84, 1); for (let k = 0; k < 8; k++) { const col = ['#a884ff', '#e8c030', '#5b9bff', '#c8303a'][(k + n) % 4], hh = 10 + ((k * 7 + n * 3) % 3) * 2; rect(x, mixc(col, '#000000', 0.3), mx - 38 + k * 10, fy - 20 - n * 20 - hh, 7, hh); rect(x, col, mx - 38 + k * 10, fy - 20 - n * 20 - hh, 5, hh - 2); rect(x, mixc(col, '#ffffff', 0.5), mx - 38 + k * 10, fy - 20 - n * 20 - hh, 2, 2); } } }
  if (type === 'warp') { x.strokeStyle = '#a884ff'; x.lineWidth = 3; for (let n = 0; n < 3; n++) { x.beginPath(); x.arc(mx, fy - 34, 8 + n * 9, t / 300 + n, t / 300 + n + 4); x.stroke(); } }
  if (type === 'hatchery') for (let n = 0; n < 4; n++) { x.fillStyle = n % 2 ? '#d0f08a' : '#f0e8c0'; x.beginPath(); x.ellipse(mx - 30 + n * 20, fy - 9 - (Math.sin(t / 300 + n) > 0.9 ? 2 : 0), 7, 10, 0, 0, 7); x.fill(); }
  if (type === 'fleshwall') { rect(x, '#7a2a3a', mx - 14, r.y + 8, 28, fy - r.y - 8); rect(x, '#b85a6a', mx - 12, r.y + 8, 24, fy - r.y - 8); for (let n = 0; n < 4; n++) rect(x, '#e89aa8', mx - 8 + (n % 2) * 8, r.y + 16 + n * 20 + Math.sin(t / 300 + n) * 2, 6, 6); }
  if (type === 'stage') { for (const sx of [r.x + 10, r.x + r.w - 32]) { rect(x, '#7a121c', sx, r.y + 12, 22, fy - r.y - 22); for (let q = 0; q < 4; q++) rect(x, '#7a121c', sx + q * 6, fy - 10, 4, 4 + (q % 2) * 4); rect(x, '#b8303a', sx + 2, r.y + 12, 3, fy - r.y - 24); rect(x, '#b8303a', sx + 12, r.y + 12, 3, fy - r.y - 28); } rect(x, '#c8303a', r.x + 10, r.y + 10, r.w - 20, 8); for (let q = 0; q < 9; q++) rect(x, '#c8303a', r.x + 14 + q * 18, r.y + 18, 10, 3 + (q % 2) * 3); rect(x, RS, r.x + 34, fy - 6, r.w - 68, 6); rect(x, RH, r.x + 34, fy - 6, r.w - 68, 2); }
  if (type === 'mirror') { rect(x, BD, mx - 18, fy - 58, 36, 54); rect(x, BN, mx - 16, fy - 56, 32, 50); rect(x, '#b6ecff', mx - 13, fy - 53, 26, 44); rect(x, '#ffffff', mx - 9, fy - 48, 4, 14); for (const d of [-18, 14]) { rect(x, BH, mx + d, fy - 60, 4, 4); rect(x, BH, mx + d, fy - 8, 4, 4); } }
  if (type === 'abattoir') { rect(x, SN, r.x + 20, r.y + 16, r.w - 40, 3); rect(x, '#b87a82', r.x + 20, r.y + 16, r.w - 40, 1); for (let n = 0; n < 4; n++) { rect(x, BN, r.x + 34 + n * 34, r.y + 19, 2, 12); rect(x, BN, r.x + 32 + n * 34, r.y + 29, 2, 3); rect(x, '#7a121c', r.x + 28 + n * 34, r.y + 32, 14, 20); rect(x, '#b8303a', r.x + 30 + n * 34, r.y + 33, 10, 16); rect(x, '#ff9a8a', r.x + 30 + n * 34, r.y + 34, 2, 6); } }
  if (type === 'table') { rect(x, '#3a3444', mx - 42, fy - 14, 84, 14); rect(x, '#5a5466', mx - 44, fy - 20, 88, 8); rect(x, '#8a8296', mx - 44, fy - 20, 88, 2); for (let n = 0; n < 3; n++) { rect(x, BN, mx - 30 + n * 24, fy - 24, 14, 3); rect(x, BH, mx - 32 + n * 24, fy - 26, 3, 3); rect(x, BH, mx - 17 + n * 24, fy - 26, 3, 3); } }

  if (type === 'core') {   // 본체는 모아 둔 것을 깔고 앉아 있다: 방울방울 굳은 덩이
    const n = Math.min(12, Math.ceil(Math.max(0, ST.hud ? ST.hud.gold : G.gold) / (100 * NEST.cm(G)))), cx = r.x + r.w - 60, rows = [6, 4, 2]; let k = 0;
    rows.forEach((w, row) => { for (let j = 0; j < w && k < n; j++, k++) { const bx = Math.round(cx - w * 9 + j * 18) + 8, by = fy - 5 - row * 8; disc(x, '#8a6a1c', bx, by, 8); disc(x, '#e8c030', bx, by - 1, 6); rect(x, '#fff3a0', bx - 4, by - 4, 3, 2); } });
  }
  if (type === 'core') { x.fillStyle = (main ? ASPCOL[main] : '#9fb8a8') + '33'; x.beginPath(); x.ellipse(r.x + r.w - 60, fy, 56 + Math.sin(t / 500) * 4, 12, 0, 0, 7); x.fill(); }
  for (let l = 1; l < c.lv; l++) rect(x, '#f5f5f5', r.x + r.w - 14 - (l - 1) * 7, r.y + 10, 4, 4);
}
function drawCell(x, i, t, canDig) {
  const c = G.cells[i], r = cellRect(i), b = biome(), dg = k => k >= 0 && k < NEST.N && G.cells[k].dug;
  const nb = [i % 5 > 0 && dg(i - 1), i % 5 < 4 && dg(i + 1), dg(i - 5), dg(i + 5)].map(v => v ? 1 : 0);
  if (!c.dug) {
    if (!nb.some(v => v)) return;   // 판 곳과 닿지 않은 칸은 보이지 않는다
    x.drawImage(cellBg(i, c, b, nb, c.soft ? (canDig ? 3 : 4) : canDig ? 2 : 1), r.x, r.y);
    if (canDig && G.buried && G.buried[i]) { for (let k = 0; k < 3; k++) rect(x, Math.sin(t / 200 + k * 2) > 0.3 ? '#fff3a0' : '#e8c03066', r.x + 40 + k * 46, r.y + 26 + (k % 2) * 60, 4, 4); txt(x, '무언가 묻혀 있다', r.x + r.w / 2, r.y + r.h - 30, '#fff3a0', 12, 'center'); }
    if (canDig) { const a = 0.55 + 0.25 * Math.sin(t / 420 + i), cx = r.x + r.w / 2, cy = r.y + r.h / 2 - 10; pickIcon(x, cx, cy + Math.round(Math.sin(t / 420 + i) * 1.5), a + 0.15); txt(x, c.soft ? '무른 흙 · 파기' : '파기', cx, cy + 14, c.soft ? '#e8c890' : '#e8dcb0', 12, 'center');
      if (c.soft) for (let k = 0; k < 3; k++) { const ph = (t / 1400 + k / 3) % 1; x.globalAlpha = 1 - ph; rect(x, '#8a6a4a', r.x + 40 + k * 50, r.y + 20 + ph * 26, 2, 2); x.globalAlpha = 1; }
      x.globalAlpha = a * 0.7; const bc = c.soft ? '#e8a860' : '#e8c030'; for (const [px, py, sx, sy] of [[r.x + 10, r.y + 10, 1, 1], [r.x + r.w - 10, r.y + 10, -1, 1], [r.x + 10, r.y + r.h - 10, 1, -1], [r.x + r.w - 10, r.y + r.h - 10, -1, -1]]) { rect(x, bc, Math.min(px, px + sx * 12), Math.min(py, py + sy * 2), 12, 2); rect(x, bc, Math.min(px, px + sx * 2), Math.min(py, py + sy * 12), 2, 12); } x.globalAlpha = 1; }
    return;
  }
  x.drawImage(cellBg(i, c, b, nb, 0), r.x, r.y);
  const fy = floorY(r);
  if (i === NEST.ENT && !G.sealed) for (let k = 0; k < 22; k += 4) { const wob = ev2(hsh(33, k) * 6); rect(x, DARKC, r.x + 38 - wob, r.y + k, 32 + wob + ev2(hsh(34, k) * 4), 4); }   // 땅 위로 난 틈
  if (c.type !== 'empty') lamp(x, r, i, t, b);
  ambient(x, r, i, t, b);
  if (i === NEST.CORE) { const sz = 16 * slimeScale(G.slime), hc = G.slime.main ? ASPCOL[G.slime.main] : '#9fb8a8'; x.save(); x.beginPath(); x.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); x.clip(); glow(x, hc, r.x + r.w - 14 - sz / 2, fy - sz / 2, 84 + b.st * 10 + Math.sin(t / 600) * 4, 0.5 + b.st * 0.03); x.restore(); }   // 본체가 내는 희미한 빛
  drawRoom(x, c, i, r, t);
  if (c.block) { for (let k = 0; k < 6; k++) { const bx = r.x + 34 + k * 24, br = 13 + (k % 3) * 4; disc(x, '#2a2434', bx, fy - br + 4, br); disc(x, k % 2 ? '#4a4458' : '#5a5466', bx - 1, fy - br + 3, br - 2); rect(x, '#7a7488', bx - br + 6, fy - br * 2 + 8, 6, 2); } txt(x, '막힘', r.x + r.w / 2, r.y + 40, '#ff9a92', 15, 'center'); }
  if (G.off[i]) { rect(x, '#0b0c16aa', r.x + 4, r.y + 4, r.w - 8, r.h - 8); txt(x, '뒤집힘', r.x + r.w / 2, r.y + 40, '#ff9a92', 14, 'center'); }
  if (ST.sanfx[i] && t - ST.sanfx[i] < 380) rect(x, '#a884ff44', r.x + 4, r.y + 4, r.w - 8, r.h - 8);
  const d = NEST.ROOM[c.type]; let name = i === NEST.ENT && c.type === 'empty' ? '입구' : d.name;
  if (i === NEST.ENT && c.type !== 'empty') name = '입구 · ' + name;
  if (d.def && i !== NEST.CORE) name += ' ' + G.kin.filter(m => m.loc === i && m.kind !== 'spawn').length + '/' + d.def;
  tagL(x, name, r.x + 12, r.y + 10, c.type === 'empty' ? '#a2a8c6' : '#ece6d6', 13, c.type === 'empty' ? null : i === NEST.CORE ? '#e8c030' : b.st ? ASPCOL[b.main] : '#6a6478');
}
function drawRoute(x, t) {
  const ps = NEST.paths(G); x.fillStyle = '#e8c030';
  ps.forEach(p => { for (let k = 0; k < p.length - 1; k++) { const a = cellRect(p[k]), b = cellRect(p[k + 1]), vert = a.x === b.x, ax = a.x + (vert ? 54 : a.w / 2), ay = floorY(a) + 8, bx = b.x + (vert ? 54 : b.w / 2), by = floorY(b) + 8, n = 6; for (let s = 0; s < n; s++) { const f = (s + (t / 600) % 1) / n; x.globalAlpha = 0.55; x.fillRect(Math.round(ax + (bx - ax) * f) - 2, Math.round(ay + (by - ay) * f) - 2, 4, 4); } } });
  x.globalAlpha = 1;
}
// ---------- 낮의 권속: 지키라고 한 것은 제자리에, 나머지는 제멋대로 굴을 돌아다닌다. 밤이 오면 제 자리로 간다 ----------
const dugAt = i => i >= 0 && i < NEST.N && G.cells[i].dug && !G.cells[i].block;
function roamPos(m, home, t, small) {
  const R = ST.roam || (ST.roam = {}), still = !!(m.pin || m.hurt || m.strike || ST.mode !== 'day' || small), homeCell = locIdx(m.loc), sz = small ? 16 : 32;
  let w = R[m.id]; if (!w) w = R[m.id] = { x: home.x, y: home.y, fx: home.x, fy: home.y, tx: home.x, ty: home.y, t0: t, dur: 0, cell: homeCell, next: homeCell, rest: t + 300 + Math.random() * 2500 };
  const go = (tx, ty, cell) => { w.fx = w.x; w.fy = w.y; w.tx = tx; w.ty = ty; w.t0 = t; w.dur = Math.max(250, Math.hypot(tx - w.x, ty - w.y) * 24); w.next = cell; };
  if (w.dur) { const k = Math.min(1, (t - w.t0) / w.dur); w.x = w.fx + (w.tx - w.fx) * k; w.y = w.fy + (w.ty - w.fy) * k; if (k >= 1) { w.dur = 0; w.cell = w.next; w.rest = t + 500 + Math.random() * 3200; } }
  else if (still) { if (Math.abs(w.x - home.x) + Math.abs(w.y - home.y) > 1) go(home.x, home.y, homeCell); }
  else if (t > w.rest) {
    const c = dugAt(w.cell) || w.cell === NEST.CORE ? w.cell : homeCell, col = c % 5, row = Math.floor(c / 5), far = Math.abs(col - homeCell % 5) + Math.abs(row - Math.floor(homeCell / 5));
    const opts = []; if (col > 0 && dugAt(c - 1)) opts.push(c - 1); if (col < 4 && dugAt(c + 1)) opts.push(c + 1); if (row > 0 && dugAt(c - 5)) opts.push(c - 5); if (row < 3 && dugAt(c + 5)) opts.push(c + 5);
    if (far >= 2 || c !== w.cell) go(home.x, home.y, homeCell);
    else { const to = opts.length && Math.random() < 0.5 ? opts[Math.floor(Math.random() * opts.length)] : c, r = cellRect(to); go(r.x + 12 + Math.random() * (r.w - 24 - sz), floorY(r) - sz + 2, to); }
  }
  (ST.kinPos || (ST.kinPos = {}))[m.id] = w; return w;
}
function drawUnit(x, e, t) {
  if (e.gone) return;
  if (e.dur) { const k = Math.min(1, (t - e.t0) / e.dur); e.x = e.fx + (e.tx - e.fx) * k; e.y = e.fy + (e.ty - e.fy) * k; if (k >= 1) e.dur = 0; }
  let a = e.alpha == null ? 1 : e.alpha, dx = 0, dy = 0; const sc = e.scale || S, size = 16 * sc;
  if (e.dead) { const k = (t - e.dead) / 400; if (k >= 1) return; a *= 1 - k; dy = k * 8; }
  if (e.lunge) { const k = (t - e.lunge.t0) / 180; if (k < 1) dx = Math.sin(k * Math.PI) * e.lunge.dx; else e.lunge = null; }
  if (e.hit && t - e.hit < 160) dx += (Math.floor(t / 30) % 2 ? 2 : -2);
  if (e.down) a *= 0.3;
  const px = Math.round(e.x + dx), py = Math.round(e.y + dy + (e.bob ? Math.sin(t / 400) * 2 : 0));
  x.globalAlpha = a;
  if (e.wall) { rect(x, '#b85a6a', px, py - 30, 24, 62); rect(x, '#e89aa8', px + 4, py - 20 + Math.sin(t / 200) * 2, 8, 8); rect(x, '#e89aa8', px + 12, py + 6, 8, 8); }
  else x.drawImage(e.sl ? slimeCanvas(e.sl, Math.floor(t / 240)) : frameOf(e.can, e.dead || e.down || e.kneel ? 0 : Math.floor(t / (e.side === 'inv' ? 300 : 420) + px * 0.13) % 2), px, py, size, size);
  if (e.hit && t - e.hit < 80 && !e.wall) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.6 * a; x.drawImage(e.can, px, py, size, size); x.globalCompositeOperation = 'source-over'; }
  x.globalAlpha = 1;
  if (e.kneel) { rect(x, '#8a8296', px + size - 4, py - 8, 2, 14); rect(x, '#f5f5f5', px + size - 2, py - 8, 9, 6); }
  if (!e.dead && !e.down && !e.kneel && e.hp != null && (e.side === 'inv' || e.hp < 0.999)) {
    const bw = Math.max(18, size - 6), bx = px + (size - bw) / 2, by = py - (e.wall ? 38 : 7);
    rect(x, '#0b0c16', bx - 1, by - 1, bw + 2, 5); rect(x, e.side === 'inv' ? '#ff5f57' : '#6fd08c', bx, by, bw * Math.max(0, e.hp), 3);
    if (e.sp != null) { rect(x, '#0b0c16', bx - 1, by + 4, bw + 2, 4); rect(x, '#a884ff', bx, by + 5, bw * Math.max(0, e.sp), 2); }
  }
  if (e.tag && t - e.tag.t0 < 1000) txt(x, e.tag.s, px + size / 2, py - 24 - (t - e.tag.t0) / 80, e.tag.col || '#fff3a0', 14, 'center');
}
// 공격 동작: 베기, 쏘기, 눈길, 물기, 그물, 휘감기
const FXKIND = { spitter: 'shot', scribe: 'beam', eyeheap: 'beam', mask: 'beam', cultist: 'beam', fallen: 'beam', hunger: 'bite', licker: 'whip', tangle: 'whip', scale: 'whip', netter: 'net' };
function drawFx(x, s, k) {
  x.strokeStyle = s.col; x.fillStyle = s.col; x.lineWidth = 2;
  if (s.fx === 'slash') { x.lineWidth = 3; x.beginPath(); x.arc(s.x, s.y, 14, -2.2 + k * 2.4, -0.8 + k * 2.4); x.stroke(); }
  else if (s.fx === 'shot') { const px = s.x0 + (s.x - s.x0) * k, py = s.y0 + (s.y - s.y0) * k; x.globalAlpha = 1; x.lineWidth = 3; x.beginPath(); x.moveTo(px, py); x.lineTo(px - (s.x - s.x0) * 0.14, py - (s.y - s.y0) * 0.14); x.stroke(); }
  else if (s.fx === 'beam') { for (let n = 0; n < 7; n++) { const f = ((n + k * 3) / 7) % 1; x.fillRect(Math.round(s.x0 + (s.x - s.x0) * f) - 1, Math.round(s.y0 + (s.y - s.y0) * f + Math.sin(f * 9 + k * 6) * 3) - 1, 3, 3); } x.beginPath(); x.arc(s.x, s.y, 4 + k * 10, 0, 7); x.stroke(); }
  else if (s.fx === 'bite') { const g = 12 * (1 - k); for (let n = -2; n <= 2; n++) { x.fillRect(s.x + n * 5 - 1, s.y - g - 7, 3, 7); x.fillRect(s.x + n * 5 + 1, s.y + g, 3, 7); } }
  else if (s.fx === 'net') { for (let n = -2; n <= 2; n++) { x.fillRect(s.x + n * 6, s.y - 14, 1, 28); x.fillRect(s.x - 14, s.y + n * 6, 28, 1); } }
  else if (s.fx === 'whip') { x.lineWidth = 3; x.beginPath(); x.moveTo(s.x0, s.y0); x.quadraticCurveTo((s.x0 + s.x) / 2, Math.min(s.y0, s.y) - 22 * (1 - k), s.x, s.y); x.stroke(); }
}
function atkFx(a, b, h) {
  const sa = 8 * (a.scale || S), sb = 8 * (b.scale || S), kind = a.id === 's' ? 'bite' : a.side === 'inv' ? 'slash' : (h.sd > 0 && !h.d ? 'beam' : FXKIND[a.kind] || 'slash');
  ST.sparks.push({ fx: kind, x0: a.x + sa, y0: a.y + sa, x: b.x + sb, y: b.y + sb, t0: now(), dur: kind === 'beam' ? 360 : kind === 'net' ? 420 : 250, col: kind === 'beam' ? '#c8a8ff' : kind === 'bite' ? '#f5f5f5' : kind === 'net' ? '#a0a8c0' : a.side === 'inv' ? '#ff9a92' : kind === 'whip' ? '#8ad8c0' : '#fff3a0' });
}
function drawUnder(x, t) {
  rect(x, DARKC, 0, 0, W, H);
  const er = cellRect(NEST.ENT);
  if (G.sealed) txt(x, '굴이 막혀 있다 · 땅 위는 아직 모른다', GX + 8, 22, '#6a6478', 13);
  else {   // 뚫린 뒤: 입구 언저리의 땅거죽만 보인다. 사다리가 아니라 다듬지 않은 틈이다
    if (!BG.top) { const cv0 = BG.top = document.createElement('canvas'); cv0.width = W; cv0.height = GY; const q = cv0.getContext('2d'); rockTex(q, 999, 0, 0, W, GY, '#1a1524'); q.fillStyle = '#3a2c20'; q.fillRect(0, 10, W, 10); q.fillStyle = '#2a2018'; q.fillRect(0, 18, W, 2); q.fillStyle = '#2f6b3a'; q.fillRect(0, 0, W, 10); q.fillStyle = '#1f4a28'; q.fillRect(0, 8, W, 2);
      for (let k = 0; k < 120; k++) { const px = ev2(hsh(7, k) * W); q.fillStyle = hsh(8, k) > 0.5 ? '#4a9a52' : '#3f8046'; q.fillRect(px, ev2(hsh(9, k) * 6), 2, 4); if (k % 3 === 0) { q.fillStyle = '#5a4634'; q.fillRect(ev2(hsh(10, k) * W), 12 + ev2(hsh(11, k) * 6), 4, 2); } if (k % 5 === 0) { q.fillStyle = '#3a2c20'; const len = 6 + ev2(hsh(12, k) * 16); q.fillRect(px, 20, 2, len); } }
      const g = q.createLinearGradient(er.x + 120, 0, er.x + 330, 0); g.addColorStop(0, 'rgba(7,5,10,0)'); g.addColorStop(1, 'rgba(7,5,10,1)'); q.fillStyle = g; q.fillRect(er.x + 120, 0, W, GY); }
    x.drawImage(BG.top, 0, 0);
    for (let k = 0; k < GY; k += 4) { const wob = ev2(hsh(31, k) * 6); rect(x, DARKC, er.x + 38 - wob, k, 32 + wob + ev2(hsh(32, k) * 6), 4); }
    for (const [dx, len] of [[34, 16], [44, 8], [70, 20], [76, 10]]) rect(x, '#3a2c20', er.x + dx, 20, 2, len);
    if (ST.focus == null) txt(x, TOUCH ? '▲ 지상' : '▲ 지상 (Tab)', er.x + 86, 22, '#a2a8c6', 13); }
  const day = ST.mode === 'day';
  for (let i = 0; i < NEST.N; i++) drawCell(x, i, t, day && !G.cells[i].dug && !NEST.canDig(G, i));
  if (!G.sealed && G.cells[NEST.ENT].dug) {   // 틈으로 새어 드는 바깥의 빛
    x.save(); x.beginPath(); x.rect(er.x, 0, er.w, floorY(er)); x.clip(); x.globalCompositeOperation = 'lighter'; x.fillStyle = ST.mode === 'night' ? 'rgba(120,150,220,' + (0.10 + 0.02 * Math.sin(t / 700)) + ')' : 'rgba(255,232,176,' + (0.13 + 0.02 * Math.sin(t / 700)) + ')';
    x.beginPath(); x.moveTo(er.x + 38, 0); x.lineTo(er.x + 70, 0); x.lineTo(er.x + 100, floorY(er)); x.lineTo(er.x + 12, floorY(er)); x.fill(); x.restore(); }
  drawRoute(x, t);
  if (ST.ents) { const es = Object.values(ST.ents); es.filter(e => e.side === 'def').forEach(e => drawUnit(x, e, t)); es.filter(e => e.side === 'inv').forEach(e => drawUnit(x, e, t)); }
  else {
    const by = {}; G.kin.forEach(m => { if (m.loc !== null) (by[m.loc] = by[m.loc] || []).push(m); });
    for (const loc in by) by[loc].forEach((m, k) => { const sm = m.kind === 'spawn', p = roamPos(m, defPos(loc === 'core' ? 'core' : +loc, k, sm), t, sm); if (!m.hurt && !m.strike) glow(x, '#cfeee0', p.x + (sm ? 8 : 16), p.y + (sm ? 8 : 16), sm ? 14 : 30, 0.2); x.globalAlpha = m.hurt || m.strike ? 0.4 : 1; { const fz = m.parts && m.parts.length, sz = fz || (m.evo && !sm) ? 48 : sm ? (m.evo ? 26 : 16) : 32; x.drawImage(frameOf(fz ? kinCanvasM(m) : kinCanvas(m.kind, m.evo), Math.floor(t / 420 + m.id * 0.37) % 2), p.x - (fz || (m.evo && !sm) ? 8 : m.evo ? 5 : 0), Math.round(p.y + Math.sin(t / 500 + m.id) * 1) - (fz || (m.evo && !sm) ? 16 : m.evo ? 10 : 0), sz, sz); } x.globalAlpha = 1; if (m.hurt) txt(x, '부상', p.x + 16, p.y - 14, '#ff9a92', 11, 'center'); else if (m.strike) txt(x, '파업', p.x + 16, p.y - 14, '#ffb347', 11, 'center'); });
    G.kin.forEach(m => { if (!m.pin || m.loc === null || m.kind === 'spawn') return; const w = ST.kinPos && ST.kinPos[m.id]; if (!w) return; const fx = Math.round(w.x) + 14, fy = Math.round(w.y) - 12; rect(x, '#0b0c16', fx - 1, fy - 1, 4, 13); rect(x, '#e8c030', fx, fy, 2, 11); rect(x, '#0b0c16', fx + 1, fy - 1, 9, 8); rect(x, '#e8c030', fx + 2, fy, 7, 6); rect(x, '#fff3a0', fx + 2, fy, 7, 2); });
    const r = cellRect(NEST.CORE), sc = slimeScale(G.slime), size = 16 * sc;
    { const hc = G.slime.main ? ASPCOL[G.slime.main] : '#cfeee0', cx = r.x + r.w - 14 - size / 2, fy0 = floorY(r); for (let k = 0; k < 7; k++) { const ph = (t / 1900 + k / 7) % 1; x.globalAlpha = (1 - ph) * 0.85; rect(x, k % 3 ? hc : '#ffffff', cx + Math.sin(k * 2.3 + t / 700) * (size * 0.55 + 6), fy0 - 4 - ph * (size + 18), 2, 2); } x.globalAlpha = 1; }
    x.drawImage(slimeCanvas(G.slime, Math.floor(t / 240)), r.x + r.w - 14 - size, Math.round(floorY(r) - size + sc + Math.sin(t / 400) * 2), size, size);
    const hp = G.slime.hp / NEST.slimeStats(G).hp; if (hp < 0.999) { rect(x, '#0b0c16', r.x + r.w - 15 - size, floorY(r) - size - 9, size + 2, 6); rect(x, '#6fd08c', r.x + r.w - 14 - size, floorY(r) - size - 8, size * hp, 4); }
  }
  ST.sparks = ST.sparks.filter(s => t - s.t0 < s.dur); ST.sparks.forEach(s => { const k = (t - s.t0) / s.dur; x.globalAlpha = 1 - k; if (s.fx) drawFx(x, s, k); else if (s.ring) { x.strokeStyle = s.col; x.lineWidth = 2; x.beginPath(); x.arc(s.x, s.y, 6 + k * 18, 0, 7); x.stroke(); } else for (let n = 0; n < 6; n++) { const a = n * 1.047 + s.rot, r0 = 4 + k * 6, r1 = 9 + k * 16; x.strokeStyle = s.col; x.lineWidth = 2; x.beginPath(); x.moveTo(s.x + Math.cos(a) * r0, s.y + Math.sin(a) * r0); x.lineTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1); x.stroke(); } x.globalAlpha = 1; });
  const mark = (loc, col) => { const r = cellRect(locIdx(loc)); x.strokeStyle = col; x.lineWidth = 3; x.strokeRect(r.x + 3.5, r.y + 3.5, r.w - 7, r.h - 7); };
  if (day && ST.hover && ST.hover.t === 'cell' && visible(ST.hover.i) && !(UI.sel && UI.sel.t === 'cell' && UI.sel.i === ST.hover.i)) mark(ST.hover.i, '#ece6d666');
  if (day && UI.sel && UI.sel.t === 'cell') mark(UI.sel.i, '#e8c030');
  if (ST.tutCell != null && day) { const r = cellRect(ST.tutCell), up = Math.floor(t / 300) % 2; mark(ST.tutCell, up ? '#e8c030' : '#fff3a0'); plate(x, '▼ 여기', r.x + r.w / 2, r.y + 22 + up * 4, '#fff3a0', 15); }
  if (ST.focus != null) mark(ST.focus, Math.floor(t / 250) % 2 ? '#ff5f57' : '#fff3a0');
  if (ST.pulse && now() - ST.pulse.t0 < 700) mark(ST.pulse.i, Math.floor((now() - ST.pulse.t0) / 120) % 2 ? '#fff3a0' : '#e8c030');   // 권속이 방금 손댄 칸
}

// ---------- 지상 ----------
function pathPoint(v, f) { const a = VPOS[v], b = PPOS[NEST.VILL[v].plot], c = CAVE; if (f < 0.5) { const k = f / 0.5; return { x: a.x + (b.x - a.x) * k, y: a.y + 34 + (b.y - a.y - 34) * k }; } const k = (f - 0.5) / 0.5; return { x: b.x + (c.x - b.x) * k, y: b.y + (c.y - b.y) * k }; }
function drawParty(x, t, est, f, label, col) {
  const p = pathPoint(est.vill, f), n = Math.min(7, est.count);
  for (let k = 0; k < n; k++) { const kind = est.kinds ? est.kinds[k % est.kinds.length] : 'shade'; x.drawImage(kind === 'shade' ? spriteCanvas('human', 'shade') : invCanvas(kind), Math.round(p.x - n * 9 + k * 18), Math.round(p.y - 30 + Math.sin(t / 200 + k) * 2), 32, 32); }
  if (label) { const s = label + ' · ' + NEST.GRADE_NAME[est.grade] + ' ' + (est.kinds ? '' : '약 ') + est.count + '명'; const z = Math.round(14 * ST.fm); x.font = z + 'px "NestPix", "Do Hyeon", sans-serif'; const w = x.measureText(s).width + 14; rect(x, '#0b0c16cc', p.x - w / 2, p.y - 42 - z, w, z + 8); rect(x, col, p.x - w / 2, p.y - 42 - z, 4, z + 8); txt(x, s, p.x + 2, p.y - 38 - z, '#ece6d6', 14, 'center'); }
}
// 계단 모양 도형: 타원(반쪽 가능), 세모, 고른 것의 모서리 표시
function ell(x, col, cx, cy, rx, ry, half) { x.fillStyle = col; for (let dy = -ry; dy < (half ? 0 : ry); dy += 2) { const hf = ev2(rx * Math.sqrt(Math.max(0, 1 - Math.pow((dy + 1) / ry, 2)))); if (hf > 0) x.fillRect(Math.round(cx - hf), Math.round(cy + dy), hf * 2, 2); } }
function tri(x, col, cx, by, hw, h) { x.fillStyle = col; for (let dy = 0; dy < h; dy += 2) { const hf = Math.max(1, Math.round(hw * (1 - dy / h))); x.fillRect(Math.round(cx - hf), Math.round(by - dy - 2), hf * 2, 2); } }
function brk(x, col, x0, y0, w, h) { x.fillStyle = col; const L = 14; [[x0, y0, 1, 1], [x0 + w, y0, -1, 1], [x0, y0 + h, 1, -1], [x0 + w, y0 + h, -1, -1]].forEach(([px, py, sx, sy]) => { x.fillRect(Math.round(Math.min(px, px + sx * L)), Math.round(Math.min(py, py + sy * 3)), L, 3); x.fillRect(Math.round(Math.min(px, px + sx * 3)), Math.round(Math.min(py, py + sy * L)), 3, L); }); }
function surfBg() {
  if (BG.surf) return BG.surf; const cv0 = BG.surf = document.createElement('canvas'); cv0.width = W; cv0.height = H; const q = cv0.getContext('2d');
  ['#1c1a3e', '#241e48', '#2f2454', '#3e2a5e', '#523166', '#6a3a6a', '#85466a', '#a25664', '#bf6a5c', '#d98456', '#eaa258', '#f4c06c'].forEach((c, k) => { q.fillStyle = c; q.fillRect(0, k * 22, W, 24); });
  for (let k = 0; k < 46; k++) { q.fillStyle = k % 6 ? 'rgba(255,255,255,.75)' : '#fff3a0'; q.fillRect(ev2(hsh(31, k) * W), ev2(hsh(32, k) * 96), 2, 2); }
  disc(q, '#ffe9a8', 706, 232, 34); disc(q, '#fff6d8', 706, 232, 26);
  [[120, 150, 110], [420, 96, 150], [800, 130, 90], [600, 176, 120]].forEach(([cx, cy, w], k) => { q.fillStyle = k % 2 ? 'rgba(255,170,150,.55)' : 'rgba(240,140,150,.45)'; q.fillRect(cx, cy, w, 6); q.fillRect(cx + 16, cy - 6, w - 40, 6); q.fillStyle = 'rgba(90,50,100,.35)'; q.fillRect(cx + 8, cy + 6, w - 24, 4); });
  const ridge = (col, base, amp, f, sd, rim) => { for (let px = 0; px < W; px += 4) { const hgt = amp * (0.55 + 0.45 * Math.sin(px * f + sd * 1.7)) + amp * 0.35 * Math.sin(px * f * 2.7 + sd) + hsh(sd, px) * 4, y = ev2(base - hgt); q.fillStyle = col; q.fillRect(px, y, 4, 280 - y); q.fillStyle = rim; q.fillRect(px, y, 4, 2); } };
  ridge('#4b3a68', 214, 58, 0.0105, 1, '#c07a78'); ridge('#33304f', 238, 36, 0.019, 2, '#7a5a78'); ridge('#22323a', 256, 18, 0.031, 3, '#3a5a52');
  ['#2a563a', '#285238', '#254c34', '#224631', '#1f402d', '#1c3a29'].forEach((c, k) => { q.fillStyle = c; q.fillRect(0, 252 + k * 50, W, 52); });
  q.fillStyle = '#3a6e48'; q.fillRect(0, 252, W, 2);
  for (let k = 0; k < 420; k++) { const px = ev2(hsh(41, k) * W), py = 258 + ev2(hsh(42, k) * (H - 262)), r1 = hsh(43, k); q.fillStyle = r1 > 0.6 ? '#3f7a4e' : r1 > 0.25 ? '#1a3626' : '#33684a'; q.fillRect(px, py, r1 > 0.6 ? 2 : 6, r1 > 0.6 ? 4 : 2); if (k % 23 === 0) { q.fillStyle = k % 2 ? '#e8c8f0' : '#f0d070'; q.fillRect(px + 2, py - 2, 2, 2); } if (k % 31 === 0) { q.fillStyle = '#5a5a66'; q.fillRect(px, py, 6, 4); q.fillStyle = '#8a8a96'; q.fillRect(px, py, 4, 2); } }
  // 길: 다져진 흙
  const pts = []; NEST.VIDS.forEach(v => { for (let k = 0; k <= 160; k++) pts.push(pathPoint(v, k / 160)); });
  pts.forEach(p => { q.fillStyle = '#3a3226'; q.fillRect(ev2(p.x) - 8, ev2(p.y) - 4, 16, 8); });
  pts.forEach((p, k) => { q.fillStyle = '#6a583e'; q.fillRect(ev2(p.x) - 6, ev2(p.y) - 2, 12, 4); if (k % 5 === 0) { q.fillStyle = '#8a7652'; q.fillRect(ev2(p.x) - 2 + (k % 10 ? 2 : -2), ev2(p.y) - 2, 4, 2); } });
  // 나무: 길과 마을을 피해서
  const keep = [...Object.values(VPOS), ...PPOS, ...SPOS, CAVE], trees = [];
  for (let k = 0; k < 90 && trees.length < 34; k++) { const tx = 14 + hsh(51, k) * (W - 28), ty = 276 + hsh(52, k) * (H - 300); if (keep.some(p => Math.abs(p.x - tx) < 70 && Math.abs(p.y - ty) < 56) || pts.some(p => Math.abs(p.x - tx) < 22 && Math.abs(p.y - ty) < 18)) continue; trees.push([tx, ty, hsh(53, k)]); }
  trees.sort((a, b) => a[1] - b[1]).forEach(([tx, ty, r1]) => { const hgt = 20 + ev2(r1 * 14); ell(q, 'rgba(8,16,14,.45)', tx + 4, ty + 2, 12, 4); q.fillStyle = '#3a2816'; q.fillRect(ev2(tx) - 2, ty - 6, 4, 8); tri(q, '#143026', tx, ty - 4, 12, hgt); tri(q, '#1d4634', tx - 2, ty - 6, 8, hgt - 6); q.fillStyle = '#e09a6a'; q.fillRect(ev2(tx) + 2, ty - hgt + 2, 2, 4); });
  return cv0;
}
function drawVillage(x, v, p, t, night) {
  const win = night ? '#ffd23a' : '#5a4630', wall = '#e8dcc0';
  const house = (ox, oy, w, h, roof) => { rect(x, '#0b0c1655', p.x + ox - 2, p.y + oy + h, w + 8, 3); rect(x, wall, p.x + ox, p.y + oy, w, h); rect(x, '#b8a888', p.x + ox + w - 4, p.y + oy, 4, h); rect(x, '#8a7a60', p.x + ox, p.y + oy + h - 2, w, 2); tri(x, mixc(roof, '#000000', 0.35), p.x + ox + w / 2, p.y + oy + 2, w / 2 + 5, h * 0.7 + 2); tri(x, roof, p.x + ox + w / 2, p.y + oy, w / 2 + 3, h * 0.7); rect(x, win, p.x + ox + w / 2 - 3, p.y + oy + h - 9, 6, 9); if (night) rect(x, '#ffd23a55', p.x + ox + w / 2 - 5, p.y + oy + h - 11, 10, 13); };
  if (v === 'gaet') { // 갯마을: 물 위의 수상 가옥과 배
    rect(x, night ? '#1f4a6a' : '#4f9fd0', p.x - 44, p.y + 14, 100, 14); for (let k = 0; k < 4; k++) rect(x, '#d8f6ff88', p.x - 38 + k * 26 + Math.sin(t / 400 + k) * 4, p.y + 18 + (k % 2) * 5, 10, 2);
    [[-30, -8], [6, -14]].forEach(([ox, oy]) => { rect(x, '#5a4630', p.x + ox + 2, p.y + oy + 16, 3, 12); rect(x, '#5a4630', p.x + ox + 19, p.y + oy + 16, 3, 12); house(ox, oy, 24, 16, '#3fb8d0'); });
    rect(x, '#7a5a3a', p.x + 36, p.y + 8, 22, 4); const bx = p.x + 40 + Math.sin(t / 700) * 3; rect(x, '#8a6a3a', bx, p.y + 18, 20, 5); rect(x, '#f5f5f5', bx + 8, p.y + 4, 2, 14); x.fillStyle = '#f5f5f5'; x.beginPath(); x.moveTo(bx + 10, p.y + 5); x.lineTo(bx + 20, p.y + 15); x.lineTo(bx + 10, p.y + 15); x.fill();
  } else if (v === 'field') { // 너른들: 초가와 풍차, 밭고랑
    for (let k = 0; k < 4; k++) rect(x, k % 2 ? '#c8b050' : '#8fb04f', p.x - 44 + k * 4, p.y + 18 + k * 3, 96 - k * 8, 3);
    house(-34, 0, 24, 16, '#d8b850'); house(-4, 4, 22, 14, '#d8b850');
    rect(x, '#b8a888', p.x + 30, p.y - 20, 14, 38); tri(x, '#8a6a3a', p.x + 37, p.y - 20, 10, 12);
    x.save(); x.translate(p.x + 37, p.y - 18); x.rotate(t / 900); for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 2); rect(x, '#f5f5f5', -2, 2, 4, 20); rect(x, '#d8d0c0', 2, 6, 5, 14); } x.restore();
  } else if (v === 'bell') { // 종탑 마을: 높은 종탑
    house(-36, 2, 22, 16, '#f0a04a'); house(20, 4, 22, 14, '#f0a04a');
    rect(x, '#9a94a8', p.x - 8, p.y - 46, 20, 64); rect(x, '#6a6478', p.x - 8, p.y - 46, 20, 4); tri(x, '#f0a04a', p.x + 2, p.y - 46, 14, 20); rect(x, '#7a7488', p.x + 8, p.y - 42, 4, 60);
    rect(x, '#2a2438', p.x - 4, p.y - 40, 12, 14); rect(x, '#e8c030', p.x - 1 + Math.sin(t / 300) * 3, p.y - 37, 6, 8); rect(x, win, p.x - 1, p.y + 6, 6, 12);
  } else if (v === 'school') { // 학술원 마을: 둥근 지붕과 기둥
    rect(x, '#d8d0e8', p.x - 30, p.y - 6, 60, 24); for (let k = 0; k < 5; k++) rect(x, '#f5f0ff', p.x - 26 + k * 13, p.y - 2, 4, 20); rect(x, '#b8a8d8', p.x - 34, p.y - 10, 68, 5);
    ell(x, '#a884ff', p.x, p.y - 10, 20, 20, true); ell(x, '#c8a8ff', p.x - 6, p.y - 16, 8, 10, true); rect(x, '#e8c030', p.x - 1, p.y - 38, 2, 9); rect(x, win, p.x - 4, p.y + 6, 8, 12);
    rect(x, '#d8d0e8', p.x + 36, p.y - 14, 12, 32); ell(x, '#6a5a9a', p.x + 42, p.y - 14, 8, 8, true); rect(x, '#fff3a0', p.x + 46, p.y - 22, 8, 2);
  } else { // 병영 도시: 성벽과 탑
    rect(x, '#8a8698', p.x - 36, p.y - 6, 78, 26); for (let k = 0; k < 7; k++) rect(x, '#8a8698', p.x - 36 + k * 12, p.y - 12, 7, 6);
    [[-44, -26], [34, -26]].forEach(([ox, oy], k) => { rect(x, '#9a96a8', p.x + ox, p.y + oy, 18, 46); for (let n = 0; n < 3; n++) rect(x, '#9a96a8', p.x + ox - 1 + n * 7, p.y + oy - 6, 5, 6); rect(x, '#2a2438', p.x + ox + 7, p.y + oy + 12, 4, 9); rect(x, '#5a4630', p.x + ox + 8, p.y + oy - 22, 2, 16); x.fillStyle = '#e8505a'; x.beginPath(); x.moveTo(p.x + ox + 10, p.y + oy - 22); x.lineTo(p.x + ox + 22 + Math.sin(t / 200 + k) * 2, p.y + oy - 18); x.lineTo(p.x + ox + 10, p.y + oy - 14); x.fill(); });
    rect(x, '#b0acc0', p.x - 10, p.y - 22, 26, 20); tri(x, '#e8505a', p.x + 3, p.y - 22, 16, 14); rect(x, win, p.x, p.y - 16, 5, 7);
    ell(x, '#3a2a20', p.x + 3, p.y + 12, 9, 9, true); rect(x, '#3a2a20', p.x - 6, p.y + 12, 18, 8); for (let n = 0; n < 3; n++) rect(x, '#6a6478', p.x - 4 + n * 6, p.y + 6, 2, 14);
  }
}
function drawSurface(x, t) {
  const night = ST.mode === 'night'; x.drawImage(surfBgW((G && G.world) || 'fantasy'), 0, 0);
  if (night) { rect(x, 'rgba(8,10,40,.62)', 0, 0, W, H); for (let k = 0; k < 40; k++) rect(x, k % 7 ? '#ffffff' : '#fff3a0', (k * 97) % W, (k * 53) % 200, 2, 2); disc(x, '#e8ecff', 706, 92, 22); disc(x, '#1c1a3e', 716, 86, 18); }
  else for (let k = 0; k < 3; k++) { const cx = (k * 330 + t / 90) % (W + 160) - 160, cy = 44 + k * 30; rect(x, cloudColW(G && G.world), cx, cy, 96, 6); rect(x, cloudColW(G && G.world), cx + 18, cy - 6, 52, 6); }
  if (G.eld && G.day >= NEST.OMEN_DAY) { // 하늘에서 지켜보는 옛 것
    const c = ASPCOL[G.eld.id], f = G.eld.favor, ex = 150, ey = 62, open = Math.sin(t / 900) > -0.92; x.globalAlpha = night ? 0.9 : 0.5;
    x.strokeStyle = c; x.lineWidth = 3; x.beginPath(); x.ellipse(ex, ey, 44, open ? 18 : 3, 0, 0, 7); x.stroke();
    if (open) { x.fillStyle = f <= -2 ? '#ff5f57' : c; x.beginPath(); x.arc(ex + Math.sin(t / 1400) * 10, ey, 9, 0, 7); x.fill(); rect(x, '#0b0c16', ex + Math.sin(t / 1400) * 10 - 2, ey - 6, 4, 12); }
    if (f >= 2) for (let k = 0; k < 6; k++) rect(x, '#fff3a0', ex + Math.cos(k * 1.05 + t / 800) * 58 - 2, ey + Math.sin(k * 1.05 + t / 800) * 28 - 2, 4, 4);
    x.globalAlpha = 1; plate(x, '「' + NEST.ELDER[G.eld.id].name + '」', ex, ey + 30, c, 12);
  }
  // 마을
  NEST.VIDS.forEach(v => {
    const p = VPOS[v], d = NEST.VILL[v], s = G.vill[v], sel = UI.sel && UI.sel.t === 'vill' && UI.sel.v === v, hov = ST.hover && ST.hover.t === 'vill' && ST.hover.v === v;
    if (s.razed) { for (let k = 0; k < 5; k++) rect(x, '#4a4a58', p.x - 34 + k * 14, p.y + 8 - (k % 2) * 8, 12, 10 + (k % 2) * 8); for (let k = 0; k < 3; k++) rect(x, '#8a829688', p.x - 10 + k * 8 + Math.sin(t / 300 + k) * 4, p.y - 20 - ((t / 40 + k * 20) % 40), 8, 8); }
    else drawVillageW(x, (G && G.world) || 'fantasy', v, p, t, night);
    if (sel || hov) brk(x, sel ? '#e8c030' : '#ece6d6aa', p.x - 48, p.y - 30, 108, 64);
    const stt = villState(v); plate(x, d.name + ' · ' + stt + (stt === '평온' && G.vill[v].trust ? ' ' + '●'.repeat(G.vill[v].trust) : ''), p.x + 6, p.y + 32, stt === '평온' ? '#ece6d6' : stt === '공물 중' ? '#e8c030' : stt === '폐허' ? '#a2a8c6' : '#ff9a92', 14);
    if (!s.razed) { rect(x, '#0b0c16', p.x - 25, p.y + 55, 62, 6); rect(x, '#ff5f57', p.x - 24, p.y + 56, 60 * Math.min(1, s.host / 100), 4); }
  });
  // 길목
  PPOS.forEach((p, k) => {
    const type = G.plots[k], sel = UI.sel && UI.sel.t === 'plot' && UI.sel.p === k, hov = ST.hover && ST.hover.t === 'plot' && ST.hover.p === k;
    plotBaseW(x, G && G.world, p, type);
    if (type === 'bramble') { x.strokeStyle = '#9c2a1c'; x.lineWidth = 3; for (let n = 0; n < 7; n++) { x.beginPath(); x.moveTo(p.x - 30 + n * 10, p.y + 4); x.lineTo(p.x - 24 + n * 10, p.y - 18); x.stroke(); } }
    if (type === 'camp') { tri(x, '#8a6a30', p.x + 2, p.y + 6, 24, 30); tri(x, '#c8a050', p.x, p.y + 4, 22, 30); rect(x, '#3a2816', p.x - 3, p.y - 8, 6, 12); rect(x, Math.sin(t / 120) > 0 ? '#ffb347' : '#ff7a2f', p.x + 26, p.y - 8, 8, 10); }
    if (type === 'tower') { rect(x, '#7a5a3a', p.x - 8, p.y - 44, 16, 48); rect(x, '#5a4630', p.x - 14, p.y - 54, 28, 12); rect(x, '#ffd23a', p.x - 3, p.y - 50, 6, 5); }
    if (type === 'garden') for (let n = 0; n < 8; n++) { rect(x, '#5a4630', p.x - 30 + (n % 4) * 16, p.y - 8 + Math.floor(n / 4) * 10, 12, 4); rect(x, '#8fe05a', p.x - 26 + (n % 4) * 16, p.y - 13 + Math.floor(n / 4) * 10, 4, 6); }
    if (sel || hov) brk(x, sel ? '#e8c030' : '#ece6d6aa', p.x - 50, p.y - 26, 100, 50);
    plate(x, '길목 ' + (k + 1) + (type !== 'none' ? ' · ' + NEST.PLOT[type].name : ''), p.x, p.y + 22, type === 'none' ? '#a2a8c6' : '#ece6d6', 13);
  });
  // 둥지 입구
  ell(x, '#1a1524', CAVE.x, CAVE.y + 6, 80, 52, true); ell(x, '#3a3448', CAVE.x, CAVE.y + 6, 74, 46, true); ell(x, '#5a5268', CAVE.x - 10, CAVE.y - 6, 52, 30, true); ell(x, '#3a3448', CAVE.x - 4, CAVE.y + 2, 54, 34, true); ell(x, '#07050c', CAVE.x, CAVE.y + 6, 50, 32, true); for (let k = 0; k < 7; k++) rect(x, '#2a2438', CAVE.x - 70 + k * 22 + (k % 2) * 6, CAVE.y - 10 - (k % 3) * 10, 8, 4); rect(x, caveRimW(G && G.world), CAVE.x - 84, CAVE.y + 4, 168, 4);
  const eye = Math.sin(t / 700) > -0.8; if (eye) { const c = G.slime.main ? ASPCOL[G.slime.main] : '#dff0e0'; rect(x, c, CAVE.x - 12, CAVE.y - 12, 6, 4); rect(x, c, CAVE.x + 6, CAVE.y - 12, 6, 4); }
  plate(x, TOUCH ? '▼ 둥지' : '▼ 둥지 (Tab)', CAVE.x, CAVE.y + 16, '#ece6d6', 14);
  if (G.guest && !night) { rect(x, Math.sin(t / 150) > 0 ? '#ffd23a' : '#ffb347', CAVE.x + 58, CAVE.y - 30, 6, 8); rect(x, '#5a4630', CAVE.x + 60, CAVE.y - 22, 2, 22); plate(x, '오늘 밤 손님 · ' + NEST.GUEST[G.guest.type].name, CAVE.x, CAVE.y - 66, '#e8c030', 14); }
  // 지상에 나타난 것
  if (G.spot && !night) {
    const p = SPOS[G.spot.pos], ty = G.spot.type, sel = UI.sel && UI.sel.t === 'spot', hov = ST.hover && ST.hover.t === 'spot', fl = Math.sin(t / 120) > 0;
    ell(x, '#0b0c1655', p.x, p.y + 6, 36, 12);
    if (ty === 'meteor') { ell(x, '#3a2a20', p.x, p.y, 26, 10); rect(x, fl ? '#fff3a0' : '#c8a8ff', p.x - 4, p.y - 6, 8, 8); rect(x, '#ffffff', p.x - 1, p.y - 14 - (t / 40 % 10), 2, 4); }
    if (ty === 'shrine') { rect(x, '#8a8296', p.x - 18, p.y - 12, 36, 14); rect(x, '#6a6278', p.x - 12, p.y - 30, 8, 18); rect(x, '#6a6278', p.x + 4, p.y - 30, 8, 18); rect(x, '#8a8296', p.x - 16, p.y - 36, 32, 7); rect(x, '#4f8f55', p.x - 20, p.y - 2, 10, 5); }
    if (ty === 'band') { rect(x, fl ? '#ffb347' : '#ff7a2f', p.x - 4, p.y - 12, 8, 12); x.drawImage(kinCanvas('goblin'), p.x - 40, p.y - 30, 32, 32); x.drawImage(kinCanvas('skeleton'), p.x + 8, p.y - 30, 32, 32); }
    if (ty === 'cart' && !spotPropW(x, G && G.world, ty, p, t, fl)) { rect(x, '#7a5a3a', p.x - 24, p.y - 18, 44, 16); rect(x, '#c8a050', p.x - 20, p.y - 28, 16, 10); rect(x, '#e8dcc0', p.x, p.y - 26, 14, 8); disc(x, '#3a2a20', p.x + 22, p.y - 20, 9); rect(x, '#7a5a3a', p.x + 20, p.y - 22, 4, 4); }
    if (ty === 'camp' && !spotPropW(x, G && G.world, ty, p, t, fl)) { tri(x, '#8a6a3a', p.x - 10, p.y, 20, 28); rect(x, fl ? '#ffb347' : '#ff7a2f', p.x + 16, p.y - 10, 8, 10); x.drawImage(invCanvas('militia'), p.x + 22, p.y - 30, 32, 32); }
    if (sel || hov) brk(x, sel ? '#e8c030' : '#ece6d6aa', p.x - 50, p.y - 44, 100, 66);
    txt(x, '!', p.x, p.y - 62 + Math.sin(t / 200) * 4, '#e8c030', 20, 'center');
    plate(x, NEST.SPOT[ty].name + ' · ' + G.spot.left + '일 남음', p.x, p.y + 14, '#e8c030', 13);
  }
  // 다가오는 무리
  if (ST.march) { const k = Math.min(1, (t - ST.march.t0) / ST.march.dur); drawParty(x, t, ST.march.est, 0.5 + 0.5 * k, null); }
  else if (!night) { const a = NEST.estimate(G, 'tonight'), b = NEST.estimate(G, 'tomorrow'); if (b) drawParty(x, t, b, 0.3, '내일 밤', '#ffb347'); if (a) drawParty(x, t, a, 0.5, '오늘 밤', '#ff5f57'); }
}

// ---------- 그리기 ----------
function drawStage() {
  const c = $('stage'), x = c.getContext('2d'), t = now(); if (!G) return;
  const dpr = window.devicePixelRatio || 1, bw = Math.round(c.clientWidth * dpr), bh = Math.round(c.clientHeight * dpr);
  if (bw > 0 && bh > 0 && (c.width !== bw || c.height !== bh)) { c.width = bw; c.height = bh; }
  // 높이에 맞춘다. 좁은 화면에서는 가로 일부만 보이고 카메라가 좌우로 움직인다.
  const k0 = c.height / H, VW = c.width / k0; ST.viewW = Math.min(W, VW); ST.ox = Math.max(0, (VW - W) / 2); ST.fm = Math.max(1, Math.min(1.7, 0.86 * dpr / k0));
  if (ST.march && ST.screen === 'surface') camTo(pathPoint(ST.march.est.vill, 0.5 + 0.5 * Math.min(1, (t - ST.march.t0) / ST.march.dur)).x);
  const max = W - ST.viewW; ST.cam.tx = Math.max(0, Math.min(max, ST.cam.tx)); ST.cam.x += (ST.cam.tx - ST.cam.x) * 0.16; if (Math.abs(ST.cam.tx - ST.cam.x) < 0.5) ST.cam.x = ST.cam.tx;
  x.setTransform(k0, 0, 0, k0, 0, 0); x.imageSmoothingEnabled = false; rect(x, '#16121f', 0, 0, VW + 1, H);
  const target = ST.screen === 'under' ? 1 : 0; ST.p += (target - ST.p) * 0.2; if (Math.abs(target - ST.p) < 0.004) ST.p = target;
  { // 창이 덮은 만큼(ST.cover, 화면 px) 고른 것을 위로 올린다
    const cov = ST.mode === 'day' && ST.cover ? ST.cover / (c.clientHeight / H) : 0, sel = UI.sel; let sy = null;
    if (cov > 0 && sel) sy = sel.t === 'cell' ? cellRect(sel.i).y + CH / 2 : sel.t === 'vill' ? VPOS[sel.v].y + 20 : sel.t === 'plot' ? PPOS[sel.p].y : sel.t === 'spot' && G.spot ? SPOS[G.spot.pos].y : null;
    const ty = sy == null ? 0 : Math.max(0, Math.min(cov, sy - (H - cov) / 2));
    ST.cam.y = ST.cam.y || 0; ST.cam.y += (ty - ST.cam.y) * 0.22; if (Math.abs(ty - ST.cam.y) < 0.5) ST.cam.y = ty;
  }
  x.save(); x.translate(Math.round(ST.ox - ST.cam.x), -Math.round(ST.cam.y || 0));
  if (ST.shake > t) x.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
  if (ST.p < 0.999) { x.save(); x.translate(0, Math.round(-H * ST.p)); drawSurface(x, t); x.restore(); }
  if (ST.p > 0.001) { x.save(); x.translate(0, Math.round(H * (1 - ST.p))); drawUnder(x, t); ST.floats = ST.floats.filter(f => t - f.t0 < 800); ST.floats.forEach(f => { const k = (t - f.t0) / 800; x.globalAlpha = 1 - k; txt(x, f.s, f.x, f.y - k * 26, f.col, f.big ? 20 : 14, 'center'); x.globalAlpha = 1; }); x.restore(); }
  x.restore();
  { const g = x.createRadialGradient(VW / 2, H / 2, H * 0.42, VW / 2, H / 2, Math.max(VW, H) * 0.78); g.addColorStop(0, 'rgba(5,3,12,0)'); g.addColorStop(1, 'rgba(5,3,12,' + (0.22 + 0.36 * ST.p).toFixed(2) + ')'); x.fillStyle = g; x.fillRect(0, 0, VW + 1, H); }
  if (ST.flash > t) rect(x, '#ffffff55', 0, 0, VW + 1, H);
  if (max > 1 && ST.mode === 'day') { // 좌우로 더 있다는 표시
    x.fillStyle = '#ece6d6'; x.globalAlpha = 0.45 + 0.25 * Math.sin(t / 300); const tri = (px, d) => { x.beginPath(); x.moveTo(px, H / 2 - 16); x.lineTo(px + d * 14, H / 2); x.lineTo(px, H / 2 + 16); x.fill(); };
    if (ST.cam.x > 4) tri(18, -1); if (ST.cam.x < max - 4) tri(VW - 18, 1); x.globalAlpha = 1;
  }
  if (ST.focus != null) plate(x, isMobile() ? '손을 쓸 차례 — 아래에서 고른다' : '손을 쓸 차례 — 오른쪽에서 고른다', VW / 2, 12, '#fff3a0', 16);
  if (ST.label) { let fs = 34; x.font = fs + 'px "NestPix", "Do Hyeon", sans-serif'; let w = x.measureText(ST.label).width + 60; if (w > VW - 12) { fs = Math.floor(fs * (VW - 12) / w); x.font = fs + 'px "NestPix", "Do Hyeon", sans-serif'; w = x.measureText(ST.label).width + 40; } rect(x, '#0b0c16dd', VW / 2 - w / 2, H / 2 - 36, w, 64); rect(x, '#e8c030', VW / 2 - w / 2, H / 2 - 36, w, 3); txt(x, ST.label, VW / 2, H / 2 - 4 - fs / 2, '#ece6d6', Math.max(21, fs), 'center'); }
}
function drawTitle() {
  const c = $('tcv'), x = c.getContext('2d'), t = now() / 1000; x.imageSmoothingEnabled = false;
  const g = x.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, '#0a0c22'); g.addColorStop(1, '#2a2050'); x.fillStyle = g; x.fillRect(0, 0, 320, 150);
  for (let k = 0; k < 46; k++) rect(x, Math.sin(t * 2 + k) > 0.6 ? '#fff3a0' : '#c8d0ff', (k * 71) % 320, (k * 37) % 100, 1, 1);
  const f = (t % 5) / 1.2; if (f < 1) { const sx = 290 - f * 150, sy = 6 + f * 96; for (let k = 0; k < 8; k++) rect(x, k ? '#fff3a088' : '#ffffff', sx + k * 4, sy - k * 2.6, 2, 2); }
  x.fillStyle = '#141228'; x.beginPath(); x.moveTo(0, 150); x.lineTo(0, 120); for (let k = 0; k <= 8; k++) x.lineTo(k * 40, 112 - (k % 2 ? 12 : 0) - (k === 4 ? 6 : 0)); x.lineTo(320, 150); x.fill();
  x.fillStyle = '#0a0a16'; x.beginPath(); x.ellipse(160, 132, 46, 26, 0, Math.PI, 0); x.fill();
  x.drawImage(spriteCanvas('slime', 'base'), 144, 100 + Math.round(Math.sin(t * 2) * 1.5), 32, 32);
  ['abyss', 'nebula', 'brood', 'dusk', 'hunger'].forEach((a, k) => { const ang = t * 0.7 + k * 1.2566; rect(x, ASPCOL[a], 158 + Math.cos(ang) * 40, 112 + Math.sin(ang) * 14, 4, 4); });
}
function loop() { try { if (!$('title').hidden) drawTitle(); else drawStage(); } catch (e) { console.error(e); } requestAnimationFrame(loop); }
function hitTest(cx, cy) {
  if (ST.screen === 'under') { const col = Math.floor((cx - GX) / CW), row = Math.floor((cy - GY) / CH); if (cy < GY && cx > GX + 20 && cx < GX + 200) return G.sealed ? null : { t: 'up' }; if (col < 0 || col > 4 || row < 0 || row > 3) return null; return visible(row * 5 + col) ? { t: 'cell', i: row * 5 + col } : null; }   // 보이지 않는 칸은 누를 수 없다
  if (G.spot) { const p = SPOS[G.spot.pos]; if (Math.abs(cx - p.x) < 48 && cy > p.y - 46 && cy < p.y + 34) return { t: 'spot' }; }
  for (const v of NEST.VIDS) { const p = VPOS[v]; if (cx > p.x - 48 && cx < p.x + 60 && cy > p.y - 30 && cy < p.y + 72) return { t: 'vill', v }; }
  for (let k = 0; k < 3; k++) { const p = PPOS[k]; if (Math.abs(cx - p.x) < 48 && Math.abs(cy - p.y) < 30) return { t: 'plot', p: k }; }
  if (Math.abs(cx - CAVE.x) < 76 && cy > CAVE.y - 44) return { t: 'down' };
  return null;
}
function setScreen(s) { if (ST.screen === s) return; ST.camMem[ST.screen] = ST.cam.tx; ST.screen = s; ST.cam.tx = ST.camMem[s]; sfx('slide'); document.querySelectorAll('[data-a="view"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s)); }

// ---------- 밤 전투 재생 ----------
const wait = ms => new Promise(res => ST.skip ? res() : setTimeout(res, ms / ST.speed));
const nlog = (s, cls) => { const el = $('nlog'); if (!el || !s) return; const p = document.createElement('p'); p.className = 'small' + (cls ? ' ' + cls : ''); p.textContent = NEST.fj(s); el.prepend(p); while (el.children.length > 12) el.lastChild.remove(); };
function moveTo(e, p, dur) { e.fx = e.x; e.fy = e.y; e.tx = p.x; e.ty = p.y; e.t0 = now(); e.dur = Math.max(1, dur / ST.speed); }
function prepareNight() {
  const E = ST.ents = {}; ST.defs = {}; ST.floats = []; ST.sparks = []; ST.fire = {}; ST.sanfx = {};
  G.kin.forEach(m => { if (m.loc === null || m.hurt || m.strike) return; const list = ST.defs[m.loc] = ST.defs[m.loc] || [], sm = m.kind === 'spawn', p = defPos(m.loc, list.length, sm); E['k' + m.id] = { id: 'k' + m.id, kind: m.kind, side: 'def', can: m.parts && m.parts.length ? kinCanvasM(m) : kinCanvas(m.kind, m.evo), x: p.x - ((m.parts && m.parts.length) || (m.evo && !sm) ? 8 : m.evo ? 5 : 0), y: p.y - ((m.parts && m.parts.length) || (m.evo && !sm) ? 16 : m.evo ? 10 : 0), hp: 1, scale: (m.parts && m.parts.length) || (m.evo && !sm) ? 3 : sm ? (m.evo ? 1.625 : 1) : S }; list.push('k' + m.id); });
  const r = cellRect(NEST.CORE), sc = slimeScale(G.slime), size = 16 * sc;
  E.s = { id: 's', side: 'def', sl: JSON.parse(JSON.stringify(G.slime)), can: slimeCanvas(G.slime), x: r.x + r.w - 14 - size, y: floorY(r) - size + sc, hp: G.slime.hp / NEST.slimeStats(G).hp, scale: sc, bob: true };
}
function applyHit(h) {
  const e = ST.ents[h.b]; if (!e) return;
  e.hp = h.hp; if (h.sp != null) e.sp = h.sp; e.hit = now(); const size = 16 * (e.scale || S);
  if (h.d > 0) ST.sparks.push({ x: e.x + size / 2, y: e.y + size / 2, t0: now(), dur: 180, col: '#fff3a0', rot: Math.random() * 6 });
  if (h.sd > 0) ST.sparks.push({ x: e.x + size / 2, y: e.y + size / 3, t0: now(), dur: 320, col: '#c8a8ff', ring: true });
  if (h.k) ST.sparks.push({ x: e.x + size / 2, y: e.y + size / 2, t0: now(), dur: 420, col: '#ece6d6', ring: true });
  if (h.d > 0) ST.floats.push({ x: e.x + size / 2, y: e.y - 6, s: '-' + h.d, col: e.side === 'inv' ? '#fff3a0' : '#ff9a92', t0: now(), big: h.tag === 'coin' });
  if (h.sd > 0) ST.floats.push({ x: e.x + size / 2 + 12, y: e.y - 18, s: '정신 -' + h.sd, col: '#c8a8ff', t0: now() });
  if (h.k) { if (e.side === 'inv' || e.wall || e.temp) { e.dead = now(); sfx('die'); } else if (e.id !== 's') e.down = true; }
}
async function playEvents(ev, from) {
  const E = ST.ents, shaft = { x: cellRect(NEST.ENT).x + 32, y: -50 };
  for (let n = from; n < ev.length; n++) {
    const e = ev[n]; if (e.txt) nlog(e.txt, e.t === 'fx' && ['kneel', 'flee', 'infight'].includes(e.k) ? 'mad' : e.t === 'fx' && ['hand', 'spell'].includes(e.k) ? 'hand' : '');
    if (e.t === 'march') {
      UI.sel = null; setScreen('surface'); $('nparty').innerHTML = e.party.map(u => invImg(u.kind, 32)).join(''); ST.label = NEST.VILL[e.vill].name + ' · ' + e.gname + ' ' + e.party.length + '명'; await wait(700);
      ST.march = { t0: now(), dur: 1300 / ST.speed, est: { vill: e.vill, count: e.party.length, kinds: e.party.map(u => u.kind), grade: 1 } }; await wait(1350); ST.label = '';
      e.party.forEach((u, j) => { E[u.uid] = { id: u.uid, kind: u.kind, side: 'inv', can: invCanvas(u.kind), x: shaft.x, y: shaft.y - j * 14, hp: 1, sp: 1, scale: u.kind === 'sealer' ? 3 : S }; });
      ST.camMem.under = 0; setScreen('under'); await wait(450); ST.march = null;
    } else if (e.t === 'go') {
      const out = e.to === 'out', r = out ? null : cellRect(locIdx(e.to)); camTo(r ? r.x + r.w / 2 : 0);
      e.who.forEach((id, j) => { const u = E[id]; if (!u || u.dead || u.gone) return; moveTo(u, out ? shaft : invPos(r, j), e.back ? 300 : 420); if (out) setTimeout(() => { u.gone = true; }, 320 / ST.speed); });
      sfx('step'); await wait(e.back ? 320 : 460);
    } else if (e.t === 'trap') {
      const idx = e.room != null ? locIdx(e.room) : null; if (idx != null) camTo(cellRect(idx).x + CW / 2);
      if (e.kind === 'san') { if (idx != null) ST.sanfx[idx] = now(); sfx('mad'); } else { if (idx != null) ST.fire[idx] = now(); sfx('trap'); }
      if (e.kind === 'boom' || e.kind === 'bite') { ST.shake = now() + 300; ST.flash = now() + 100; }
      e.hits.forEach(applyHit); await wait(430);
    } else if (e.t === 'round') {
      if (e.room != null) camTo(cellRect(locIdx(e.room)).x + CW / 2);
      for (const side of ['inv', 'def']) {
        const hs = e.hits.filter(h => h.s === side); if (!hs.length) continue;
        // 한꺼번에 번쩍이지 않고 한 대씩 차례로 친다
        const gap = Math.min(55, 230 / hs.length);
        if (hs.some(h => h.tag === 'aoe')) ST.shake = now() + 120;
        sfx(hs.some(h => h.sd > 0) && !hs.some(h => h.d > 0) ? 'mad' : 'hit');
        for (let k = 0; k < hs.length; k++) { const h = hs[k], a = E[h.a], b = E[h.b]; if (a && b && !h.tag && !a.wall && !['shot', 'beam'].includes(FXKIND[a.kind])) a.lunge = { t0: now(), dx: Math.sign(b.x - a.x) * 16 }; applyHit(h); if (a && b && !a.wall) atkFx(a, b, h); if (!h.tag && k < hs.length - 1 && hs.length > 1) await wait(gap); }
        await wait(140);
      }
    } else if (e.t === 'fx') {
      const u = e.u && E[e.u];
      if (u) {
        if (e.hp != null) u.hp = e.hp;
        const tag = { bind: '묶임', flee: '광란!', kneel: '꿇음', infight: '내분!', revive: '부활', heal: '+', lvup: 'Lv UP', back: '후퇴' }[e.k]; if (tag) u.tag = { s: tag, t0: now(), col: ['flee', 'kneel', 'infight'].includes(e.k) ? '#c8a8ff' : '#fff3a0' };
        if (e.k === 'kneel') { u.kneel = true; u.alpha = 0.6; u.sp = 0; sfx('mad'); }
        if (e.k === 'flee') { u.sp = 0; sfx('mad'); moveTo(u, shaft, 500); setTimeout(() => { u.gone = true; }, 520 / ST.speed); }
        if (e.k === 'infight' && e.hit) applyHit(e.hit);
        if (e.k === 'back') u.alpha = 0.35; if (e.k === 'revive') { u.down = false; u.dead = null; u.alpha = 1; } if (e.k === 'lvup') sfx('up'); if (e.k === 'gone') u.gone = true;
      }
      if (e.k === 'decoy' && e.who) e.who.forEach(id => { const d = E[id]; if (d) { d.tag = { s: '푼돈', t0: now() }; moveTo(d, shaft, 500); setTimeout(() => { d.gone = true; }, 520 / ST.speed); } });
      if (e.k === 'shop') sfx('coin');
      if (e.k === 'hand' || e.k === 'spell') { ST.flash = now() + 120; sfx('spell'); }
      if (e.k === 'wave' || e.k === 'rift' || e.k === 'breach') ST.shake = now() + 200;
      await wait(e.k === 'heal' ? 60 : e.k === 'gone' ? 0 : 340);
    } else if (e.t === 'add') {
      const list = ST.defs[e.loc] = ST.defs[e.loc] || [], r = cellRect(locIdx(e.loc));
      if (e.kind === 'wall') E[e.uid] = { id: e.uid, side: 'def', wall: true, x: r.x + r.w / 2 - 12, y: floorY(r) - 34, hp: 1 };
      else { const p = defPos(e.loc, list.length, true); E[e.uid] = { id: e.uid, side: 'def', temp: true, can: kinCanvas('spawn'), x: p.x, y: p.y, hp: 1, scale: 1, tag: { s: '돋았다', t0: now() } }; list.push(e.uid); }
      await wait(160);
    } else if (e.t === 'move') {
      const list = ST.defs[e.to] = ST.defs[e.to] || [];
      e.who.forEach(id => { const u = E[id]; if (!u) return; for (const k in ST.defs) ST.defs[k] = ST.defs[k].filter(z => z !== id); moveTo(u, defPos(e.to, list.length, u.scale === 1), 350); list.push(id); });
      ST.flash = now() + 100; sfx('spell'); await wait(420);
    } else if (e.t === 'steal') {
      if (e.amt > 0) { const r = cellRect(NEST.CORE); ST.floats.push({ x: r.x + r.w / 2, y: r.y + 40, s: '-' + e.amt + 'G', col: '#ff5f57', t0: now(), big: true }); sfx('down'); }
      await wait(600);
    } else if (e.t === 'end') {
      ST.label = { repel: '격퇴!', stolen: '쓰러졌다… 재물을 털렸다', core: '본체가 쓰러졌다' }[e.result]; sfx(e.result === 'repel' ? 'up' : 'down'); await wait(1000); ST.label = '';
    }
  }
  return ev.length;
}
