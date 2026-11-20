// 옛 것의 둥지 — 화면 2/3: 지도(지상·지하)와 밤 전투 재생
const W = 960, H = 550, GX = 20, GY = 48, CW = 184, CH = 124, S = 2;
const cellRect = i => ({ x: GX + (i % G.cols) * CW, y: GY + Math.floor(i / G.cols) * CH, w: CW, h: CH });
const locIdx = loc => loc === 'core' ? G.core : +loc;
// 지하의 넓이: 판마다 칸 수가 다르다 (옛 저장 5×4 는 화면 하나에 꼭 맞는다). 넓으면 좌우로, 높으면 위아래로 밀어 본다
const UW = () => GX * 2 + (G ? G.cols : 5) * CW, UH = () => GY + (G ? G.rows : 4) * CH + 6;
const worldW = () => ST.screen === 'under' ? Math.max(W, UW()) : W, vMax = () => ST.screen === 'under' ? Math.max(0, UH() - (ST.vh || H)) : 0;
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
function camTo(lx, snap, ly) { if (!snap && ST.mode === 'night' && ST.camHold > now()) return; const max = Math.max(0, worldW() - ST.viewW); ST.cam.tx = Math.max(0, Math.min(max, lx - ST.viewW / 2)); if (ly != null) ST.cam.tv = Math.max(0, Math.min(vMax(), ly - (ST.vh || H) / 2)); if (snap === true) { ST.cam.x = ST.cam.tx; if (ly != null) ST.cam.v = ST.cam.tv; } }
const camCell = (i, snap) => { const r = cellRect(i); camTo(r.x + r.w / 2, snap, r.y + r.h / 2); };
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
const STK = [0, 0.38, 0.6, 0.82, 1], DARK = [0.30, 0.26, 0.20, 0.13, 0.06];   // 허물 단계마다: 환경이 물드는 정도, 칸을 덮는 어둠
function biome() { const sl = G.slime, st = sl.main ? Math.max(1, Math.min(4, sl.stage)) : 0; return { st, main: st ? sl.main : 'base', sub: st >= 2 && sl.sub && sl.sub !== sl.main ? sl.sub : '', k: STK[st], key: st + (st ? sl.main : '') + (st >= 2 && sl.sub ? sl.sub : '') }; }
const visible = i => G.cells[i].dug || NEST.nbrs(G, i).some(j => G.cells[j].dug);
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
  base: { rock: '#2c2540', floor: '#463d54', lit: '#8fa89a' }, abyss: { rock: '#12303f', floor: '#1b4a5e', lit: '#3fb8d0' }, nebula: { rock: '#2a1f52', floor: '#3a2c72', lit: '#b08fff' },
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
  // 살림의 재료: 엄니, 해골, 눈, 고치, 진 구슬. 사람이 만든 물건은 없다
  const SK0 = '#8a7a60', SK1 = '#d8c8a8', SK2 = '#f4ead4';
  const tusk = (bx, h, dir, w) => { for (let n = 0; n < h; n += 2) { const k = n / h, wd = Math.max(2, ev2((w || 8) * (1 - k * 0.75))), off = Math.round(dir * k * k * 14); rect(x, BD, bx + off, fy - n - 2, wd, 2); rect(x, BN, bx + off + (dir < 0 ? 2 : 0), fy - n - 2, Math.max(2, wd - 2), 2); rect(x, BH, bx + off + (dir < 0 ? wd - 2 : 0), fy - n - 2, 2, 2); } };
  const skull = (cx, cy) => { disc(x, BD, cx, cy, 7); disc(x, BN, cx, cy - 1, 6); rect(x, BH, cx - 4, cy - 6, 4, 2); rect(x, '#0b0911', cx - 4, cy - 2, 3, 3); rect(x, '#0b0911', cx + 1, cy - 2, 3, 3); rect(x, BN, cx - 3, cy + 4, 6, 3); rect(x, '#0b0911', cx - 1, cy + 4, 1, 3); rect(x, '#0b0911', cx + 1, cy + 4, 1, 3); };
  const eyeball = (cx, cy, rad, iris, look, shut) => { disc(x, '#0b0911', cx, cy, rad + 2); if (shut) { disc(x, '#7a4a62', cx, cy, rad); rect(x, '#0b0911', cx - rad + 2, cy, rad * 2 - 4, 2); return; } disc(x, '#f2ecd8', cx, cy, rad); disc(x, iris, cx + look, cy, Math.max(2, rad - 4)); rect(x, '#0b0911', cx + look - 1, cy - Math.max(2, rad - 5), 2, Math.max(4, (rad - 5) * 2)); rect(x, '#ffffff', cx + look - 4, cy - 4, 2, 2); };
  const thread = (cx, y0, y1, col) => { for (let y = y0; y < y1; y += 2) rect(x, col || SK1, cx + (Math.floor(y / 6) % 2), y, 1, 2); };
  const cocoon = (cx, top, len, wid, full, sway) => { const sx = cx + sway; thread(cx, r.y + 12, top, SK0); for (let n = 0; n < len; n += 2) { const k = n / len, wd = Math.max(4, ev2(wid * Math.sin(Math.PI * (0.12 + 0.88 * k) ** 0.8))), px = sx - wd / 2 + Math.round(sway * k); rect(x, SK0, px - 1, top + n, wd + 2, 2); rect(x, n % 8 === 6 ? '#b8a888' : SK1, px, top + n, wd, 2); rect(x, SK2, px + 1, top + n, 2, 2); }
    if (full) { const fy0 = top + Math.round(len * 0.26), fx0 = sx - 3 + Math.round(sway * 0.3); rect(x, '#3a2a20', fx0 - 1, fy0 - 1, 8, 8); rect(x, '#e8b890', fx0, fy0, 6, 6); rect(x, '#0b0911', fx0 + 1, fy0 + 2, 1, 2); rect(x, '#0b0911', fx0 + 4, fy0 + 2, 1, 2); } };
  const bead = (cx, cy, col) => { disc(x, mixc(col, '#000000', 0.5), cx, cy, 5); disc(x, col, cx, cy - 1, 4); rect(x, mixc(col, '#ffffff', 0.6), cx - 3, cy - 4, 2, 2); };
  const dots = (x0, y0, x1, y1, col) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 5)); for (let k = 1; k < n; k++) rect(x, col, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, 2, 2); };
  // 문턱: 엄니 둘이 마주 휘어 낮은 문을 이룬다. 그 사이를 지나야 한다
  if (type === 'post') { tusk(mx - 46, 46, 1, 8); tusk(mx - 4, 46, -1, 8); rect(x, BD, mx - 44, fy - 2, 44, 2); thread(mx - 23, fy - 50, fy - 42, SN); bead(mx - 22, fy - 38, '#5b9bff'); }
  // 싸움 굴: 벽에 발톱 자국, 바닥에 이빨 그루터기, 꼬챙이에 꿴 머리 하나
  const slashes = (sx, sy, col) => { for (let q = 0; q < 3; q++) for (let n = 0; n < 9; n++) { rect(x, '#0b0911', sx + q * 8 + n * 2, sy + n * 3, 3, 3); rect(x, col, sx + q * 8 + n * 2 + 2, sy + n * 3, 1, 3); } };
  const stubs = (x0, n, gap) => { for (let q = 0; q < n; q++) { const hh = 4 + (q % 3) * 2; rect(x, BD, x0 + q * gap, fy - hh, 4, hh); rect(x, BN, x0 + q * gap, fy - hh, 2, hh); rect(x, BH, x0 + q * gap, fy - hh, 2, 2); } };
  if (type === 'hall') { slashes(mx - 60, r.y + 30, '#b8303a'); slashes(mx + 6, r.y + 26, '#b8303a'); stubs(r.x + 18, 9, 18); rect(x, BD, mx - 26, fy - 34, 3, 34); rect(x, BN, mx - 26, fy - 34, 1, 34); skull(mx - 24, fy - 38); }
  // 큰 싸움 굴: 갈비가 천장까지 맞닿은 아치, 머리 무더기
  if (type === 'bighall') { tusk(r.x + 16, 78, 1, 12); tusk(r.x + r.w - 28, 78, -1, 12); tusk(r.x + 44, 56, 1, 8); tusk(r.x + r.w - 52, 56, -1, 8); slashes(mx - 18, r.y + 28, '#e8c030'); skull(mx - 14, fy - 6); skull(mx + 2, fy - 6); skull(mx - 6, fy - 16); bead(mx - 6, r.y + 22, '#e8c030'); }
  // 매복굴: 거미줄 친 돌무더기. 틈에서 눈이 내다본다
  if (type === 'ambush') { const ax = r.x + r.w - 104; disc(x, '#1a1622', ax + 8, fy - 4, 12); disc(x, '#3a3444', ax + 6, fy - 6, 10); disc(x, '#1a1622', ax + 26, fy - 8, 16); disc(x, '#4a4458', ax + 24, fy - 10, 14); disc(x, '#1a1622', ax + 44, fy - 2, 10); disc(x, '#3a3444', ax + 42, fy - 4, 8); rect(x, '#0b0911', ax + 14, fy - 12, 20, 6); dots(ax - 6, r.y + 14, ax + 20, fy - 22, SK1); dots(ax + 52, r.y + 14, ax + 30, fy - 24, SK1); dots(ax, fy - 12, ax + 46, fy - 10, SK0); if (Math.floor(t / 700 + i) % 4) { rect(x, '#9fe86a', ax + 16, fy - 10, 3, 2); rect(x, '#9fe86a', ax + 26, fy - 10, 3, 2); } }
  if (type === 'decoy') { rect(x, SN, mx - 1, fy - 34, 2, 14); glow(x, '#e8c030', mx, fy - 14, 26, 0.35 + 0.1 * Math.sin(t / 300)); disc(x, '#8a6a1c', mx, fy - 12, 12); disc(x, '#e8c030', mx, fy - 13, 10); rect(x, '#fff3a0', mx - 6, fy - 20, 4, 4); }
  if (type === 'shop') { disc(x, '#5a2a34', mx, fy + 2, 30); rect(x, '#5a2a34', mx - 30, fy - 4, 60, 6); for (let n = 0; n < 3; n++) { const sx = mx - 22 + n * 22, sy = fy - 16 - (n === 1 ? 8 : 0); disc(x, '#b85a6a', sx, sy, 9); disc(x, '#e89aa8', sx, sy - 1, 7); disc(x, '#3a1418', sx, sy, 3); } rect(x, '#e8c030', mx - 2 + Math.round(Math.sin(t / 250) * 8), fy - 6 + (Math.floor(t / 200) % 3) * 2, 2, 4); }
  // 고치 굴: 잡힌 것은 실에 감겨 천장에 매달린다. 빈 고치는 홀쭉하다
  if (type === 'prison') { const n = Math.min(4, G.prison.length); dots(r.x + 30, r.y + 14, r.x + 58, r.y + 40, SK0); dots(r.x + 30, r.y + 30, r.x + 70, r.y + 16, SK0); dots(r.x + r.w - 20, r.y + 16, r.x + r.w - 46, r.y + 44, SK0); for (let k = 0; k < 4; k++) { const full = k < n, cx = mx - 30 + k * 24; cocoon(cx, r.y + 22 + (k % 2) * 6, full ? 40 : 20, full ? 16 : 8, full, full ? Math.round(Math.sin(t / 600 + k * 1.7) * 1.5) : 0); } }
  // 기도 굴: 살 둔덕 위에 돋은 눈. 믿는 것들이 이것을 올려다본다
  if (type === 'chapel') { ell(x, '#3a2434', mx, fy, 24, 14, true); ell(x, '#5a3a52', mx - 2, fy, 20, 11, true); rect(x, '#3a2434', mx - 5, fy - 30, 10, 22); rect(x, '#7a4a62', mx - 3, fy - 30, 6, 22); rect(x, '#a86a82', mx - 3, fy - 30, 2, 20); const shut = Math.floor(t / 180 + i * 7) % 26 === 0; glow(x, '#c8a8ff', mx, fy - 42, 30, 0.28 + 0.06 * Math.sin(t / 400)); eyeball(mx, fy - 42, 11, '#a884ff', Math.round(Math.sin(t / 1300 + i) * 3), shut); for (let k = 0; k < 7; k++) { const a = Math.PI * (1.08 + k * 0.14), tx = mx + Math.cos(a) * 19, ty = fy - 42 + Math.sin(a) * 19; rect(x, BH, tx - 1, ty - 2, 2, 4); } for (const d of [-34, 30]) { rect(x, '#f2e9c9', mx + d + 1, fy - 8, 2, 8); rect(x, Math.sin(t / 150 + d) > 0 ? '#d0f08a' : '#9fe8f0', mx + d - 2, fy - 12, 8, 4); } }
  // 제물 굴: 이빨 두른 구덩이. 위에는 뼈칼이 드리워 있다
  if (type === 'ritual') { glow(x, '#c8303a', mx, fy - 2, 34, 0.22 + 0.08 * Math.sin(t / 260)); x.fillStyle = '#12060a'; x.beginPath(); x.ellipse(mx, fy, 34, 6, 0, 0, 7); x.fill(); x.strokeStyle = '#7a121c'; x.lineWidth = 2; x.beginPath(); x.ellipse(mx, fy, 34, 6, 0, 0, 7); x.stroke(); for (let k = 0; k < 9; k++) { const tx = mx - 30 + k * 7.5, up = Math.round(6 * Math.sqrt(Math.max(0, 1 - ((tx - mx) / 34) ** 2))); rect(x, BH, tx, fy - up - 3, 2, 5); rect(x, BN, tx, fy + up - 1, 2, 4); } const by = fy - 36 + Math.sin(t / 200) * 2; thread(mx, r.y + 12, by, SN); rect(x, BD, mx - 3, by, 6, 14); rect(x, BN, mx - 2, by, 4, 14); rect(x, BH, mx - 2, by, 2, 12); rect(x, BN, mx - 1, by + 14, 2, 4); rect(x, '#c8303a', mx - 1, by + 18, 2, 2 + (Math.floor(t / 300) % 3) * 2); }
  // 속삭임 굴: 진으로 굳힌 자리 하나, 그 위에서 입이 달린 꼬투리가 속삭인다
  if (type === 'persuade') { ell(x, '#3a2a18', mx - 8, fy, 22, 14, true); ell(x, RS, mx - 9, fy, 19, 12, true); ell(x, RH, mx - 12, fy - 6, 9, 4, true); rect(x, '#3a2a18', mx - 14, fy - 12, 12, 3); for (const d of [-24, 6]) rect(x, RS, mx + d, fy - 2, 3, 2); const px0 = mx + 24, py0 = r.y + 40, open = Math.floor(t / 260) % 3; thread(px0, r.y + 12, py0 - 10, SN); glow(x, '#f0a04a', px0, py0, 24, 0.26); disc(x, '#3a2028', px0, py0, 11); disc(x, '#7a4a52', px0, py0 - 1, 9); rect(x, '#a86a72', px0 - 6, py0 - 7, 4, 2); rect(x, '#12060a', px0 - 6, py0, 12, 2 + open * 2); for (let q = 0; q < 3; q++) rect(x, BH, px0 - 5 + q * 4, py0, 2, 2); for (let q = 0; q < 3; q++) { const ph = ((t / 900) + q / 3) % 1; x.globalAlpha = 1 - ph; rect(x, '#ffe0a0', px0 - 14 - ph * 18, py0 + 8 + ph * 16, 4, 2); x.globalAlpha = 1; } }
  // 달맞이 굴: 천장 틈으로 달빛이 내려와 조개 그릇에 고인다
  if (type === 'altar') { const ac = ASPCOL[main || G.startAsp], ph = 0.5 + 0.5 * Math.sin(t / 500); rect(x, '#0b0911', mx - 12, r.y + 6, 24, 10); disc(x, '#e8ecff', mx, r.y + 20, 8); disc(x, '#0b0911', mx + 4, r.y + 18, 7); for (let n = 0; n < fy - r.y - 30; n += 4) { const wd = 12 + n * 0.34; rect(x, 'rgba(232,236,255,' + (0.05 + 0.03 * ph) + ')', mx - wd / 2, r.y + 26 + n, wd, 4); } glow(x, ac, mx, fy - 10, 26, 0.3 + 0.15 * ph); rect(x, BD, mx - 20, fy - 6, 40, 6); rect(x, BN, mx - 22, fy - 10, 44, 4); rect(x, BH, mx - 22, fy - 10, 44, 1); rect(x, BD, mx - 14, fy - 2, 28, 2); rect(x, ac, mx - 18, fy - 12, 36, 3); rect(x, mixc(ac, '#ffffff', 0.6), mx - 14 + Math.round(ph * 14), fy - 12, 8, 1); for (let k = 0; k < 3; k++) { const p2 = (t / 1800 + k / 3) % 1; x.globalAlpha = 1 - p2; rect(x, mixc(ac, '#ffffff', 0.5), mx - 10 + k * 10, fy - 16 - p2 * 30, 2, 2); x.globalAlpha = 1; } }
  if (type === 'pool') { rect(x, '#0c3a50', r.x + 26, fy - 4, r.w - 52, 12); rect(x, '#3fb8d0', r.x + 30, fy - 5 + Math.sin(t / 250) * 1.5, r.w - 60, 9); rect(x, '#9fe8f0', r.x + 50 + (t / 30 % 60), fy - 4, 10, 2); }
  // 물목: 조개 판이 겹쳐 선 목. 사이로 물이 샌다
  if (type === 'sluice') { rect(x, '#0c3a50', mx - 32, fy - 6, 64, 8); rect(x, '#3fb8d0', mx - 30, fy - 6 + Math.sin(t / 250) * 1, 60, 5); for (let q = 0; q < 5; q++) { const cy = r.y + 22 + q * 17, wob = q % 2 ? 2 : -2; disc(x, '#0b1a22', mx + wob, cy, 15); disc(x, '#1f4a5a', mx + wob, cy, 13); disc(x, '#3a6a7a', mx + wob - 1, cy - 2, 10); rect(x, '#7fa8b8', mx + wob - 8, cy - 8, 6, 2); rect(x, '#0b1a22', mx + wob - 10, cy + 6, 20, 2); rect(x, '#9fe8f0', mx + wob - 6 + ((Math.floor(t / 240) + q) % 4) * 3, cy + 8, 2, 4); } for (const [dx, dy] of [[-16, 30], [14, 52], [-14, 70]]) { rect(x, '#cfc8b4', mx + dx, r.y + dy, 4, 4); rect(x, '#0b1a22', mx + dx + 1, r.y + dy + 1, 2, 2); } }
  // 별자리 굴: 벽에 긁어 새긴 별과 그 사이를 이은 금. 책은 없다
  if (type === 'library') { const ST1 = [[-52, -74], [-34, -60], [-42, -40], [-18, -46], [-8, -68]], ST2 = [[14, -76], [30, -58], [50, -66], [44, -38], [22, -32]]; for (const ps of [ST1, ST2]) { for (let k = 0; k < ps.length - 1; k++) dots(mx + ps[k][0], fy + ps[k][1], mx + ps[k + 1][0], fy + ps[k + 1][1], '#6a4ab0'); dots(mx + ps[1][0], fy + ps[1][1], mx + ps[3][0], fy + ps[3][1], '#6a4ab0'); ps.forEach(([dx, dy], k) => { const tw = Math.sin(t / 380 + k * 1.9 + dx) > 0.5; glow(x, k % 2 ? '#fff3a0' : '#b08fff', mx + dx + 1, fy + dy + 1, tw ? 12 : 8, 0.5); rect(x, k % 2 ? '#fff3a0' : '#e0c8ff', mx + dx - 1, fy + dy - 1, 4, 4); if (tw) { rect(x, '#ffffff', mx + dx, fy + dy - 4, 2, 10); rect(x, '#ffffff', mx + dx - 3, fy + dy, 8, 2); } }); } for (let q = 0; q < 5; q++) { rect(x, '#0b0911', r.x + 22 + q * 5, fy - 22, 2, 10); rect(x, BD, r.x + 23 + q * 5, fy - 22, 1, 10); } dots(r.x + 20, fy - 14, r.x + 46, fy - 20, BD); }
  if (type === 'warp') { x.strokeStyle = '#a884ff'; x.lineWidth = 3; for (let n = 0; n < 3; n++) { x.beginPath(); x.arc(mx, fy - 34, 8 + n * 9, t / 300 + n, t / 300 + n + 4); x.stroke(); } }
  // 알 굴: 진으로 다진 둥우리에 알이 놓여 있다
  if (type === 'hatchery') { rect(x, RS, mx - 44, fy - 6, 88, 6); rect(x, RH, mx - 44, fy - 6, 88, 2); for (let q = 0; q < 8; q++) rect(x, RS, mx - 42 + q * 11, fy - 8 - (q % 2) * 2, 6, 4); for (let n = 0; n < 4; n++) { x.fillStyle = n % 2 ? '#d0f08a' : '#f0e8c0'; x.beginPath(); x.ellipse(mx - 30 + n * 20, fy - 13 - (Math.sin(t / 300 + n) > 0.9 ? 2 : 0), 7, 10, 0, 0, 7); x.fill(); rect(x, '#ffffff', mx - 34 + n * 20, fy - 20, 2, 4); } }
  if (type === 'fleshwall') { rect(x, '#7a2a3a', mx - 14, r.y + 8, 28, fy - r.y - 8); rect(x, '#b85a6a', mx - 12, r.y + 8, 24, fy - r.y - 8); for (let n = 0; n < 4; n++) rect(x, '#e89aa8', mx - 8 + (n % 2) * 8, r.y + 16 + n * 20 + Math.sin(t / 300 + n) * 2, 6, 6); }
  // 무대: 실로 짠 막이 양옆에 늘어지고, 바닥은 진으로 다졌다
  if (type === 'stage') { for (const [sx, dir] of [[r.x + 10, 1], [r.x + r.w - 10, -1]]) { for (let y = r.y + 14; y < fy - 8; y += 2) { const wd = ev2(18 + Math.sin(y / 7 + sx) * 4 - (y - r.y) * 0.05), px = dir > 0 ? sx : sx - wd; rect(x, SK0, px - 1, y, wd + 2, 2); rect(x, (y >> 1) % 5 === 0 ? '#b8a888' : SK1, px, y, wd, 2); rect(x, SK2, dir > 0 ? px + 2 : px + wd - 4, y, 2, 2); rect(x, 'rgba(240,160,74,.22)', px, y, wd, 2); } for (let q = 0; q < 4; q++) thread(sx + dir * (2 + q * 5), fy - 8, fy - 8 + 4 + (q % 2) * 4, SK1); }
    rect(x, SK0, r.x + 10, r.y + 12, r.w - 20, 8); rect(x, SK1, r.x + 10, r.y + 12, r.w - 20, 6); rect(x, SK2, r.x + 10, r.y + 12, r.w - 20, 2); rect(x, 'rgba(240,160,74,.22)', r.x + 10, r.y + 12, r.w - 20, 6); for (let q = 0; q < 9; q++) { const px = r.x + 13 + q * 18, dp = 4 + (q % 2) * 4; rect(x, SK0, px - 1, r.y + 18, 16, dp + 2); rect(x, SK1, px, r.y + 18, 14, dp); rect(x, 'rgba(240,160,74,.22)', px, r.y + 18, 14, dp); thread(px + 7, r.y + 18 + dp, r.y + 22 + dp + (q % 3) * 3, SK1); } dots(r.x + 30, r.y + 22, r.x + 56, r.y + 50, SK0); dots(r.x + r.w - 30, r.y + 22, r.x + r.w - 56, r.y + 50, SK0); rect(x, RS, r.x + 34, fy - 6, r.w - 68, 6); rect(x, RH, r.x + 34, fy - 6, r.w - 68, 2); }
  // 거울 굴: 진 테두리 안에 팽팽히 선 얇은 막. 들여다보는 것을 비춘다
  if (type === 'mirror') { const cy = fy - 34; thread(mx - 8, r.y + 12, cy - 24, SK0); thread(mx + 8, r.y + 12, cy - 24, SK0); x.fillStyle = '#0b0911'; x.beginPath(); x.ellipse(mx, cy, 20, 28, 0, 0, 7); x.fill(); for (let k = 0; k < 14; k++) { const a = k * 0.449, kx = mx + Math.cos(a) * 18, ky = cy + Math.sin(a) * 26; disc(x, RS, kx, ky, 4); rect(x, RH, kx - 2, ky - 3, 2, 2); } x.fillStyle = '#6fb8d0'; x.beginPath(); x.ellipse(mx, cy, 14, 22, 0, 0, 7); x.fill(); x.fillStyle = '#b6ecff'; x.beginPath(); x.ellipse(mx - 1, cy - 1, 12, 20, 0, 0, 7); x.fill(); const sh = Math.round(Math.sin(t / 700) * 4); rect(x, '#ffffff', mx - 8 + sh, cy - 14, 3, 12); rect(x, '#e8fbff', mx - 3 + sh, cy - 6, 2, 8); rect(x, '#6fb8d0', mx + 2, cy + 8, 6, 2); }
  // 되새김 굴: 바닥에 벌어진 입. 넣어 둔 것을 천천히 씹는다
  if (type === 'abattoir') { const ch = Math.round(2 + 2 * Math.sin(t / 420)); glow(x, '#f2696f', mx, fy - 6, 40, 0.18 + 0.06 * Math.sin(t / 420)); x.fillStyle = '#5a1018'; x.beginPath(); x.ellipse(mx, fy - 2, 46, 12, 0, 0, 7); x.fill(); x.fillStyle = '#b8303a'; x.beginPath(); x.ellipse(mx, fy - 3, 43, 10, 0, 0, 7); x.fill(); x.fillStyle = '#1a0508'; x.beginPath(); x.ellipse(mx, fy - 2, 38, 5 + ch, 0, 0, 7); x.fill(); for (let k = 0; k < 9; k++) { const tx = mx - 32 + k * 8, e = Math.sqrt(Math.max(0, 1 - ((tx - mx) / 38) ** 2)) * (5 + ch); rect(x, BN, tx, fy - 2 - e, 4, 6); rect(x, BH, tx, fy - 2 - e, 2, 6); rect(x, BN, tx + 4, fy - 2 + e - 5, 4, 5); } for (const [dx, len] of [[-58, 26], [52, 34]]) { thread(mx + dx + 6, r.y + 12, r.y + 12 + len, SN); rect(x, '#5a1018', mx + dx, r.y + 12 + len, 14, 20); rect(x, '#b8303a', mx + dx + 2, r.y + 13 + len, 10, 16); rect(x, '#ff9a8a', mx + dx + 2, r.y + 14 + len, 2, 6); rect(x, SN, mx + dx, r.y + 18 + len, 14, 2); rect(x, SN, mx + dx, r.y + 26 + len, 14, 2); } }
  // 먹이 굴: 진으로 빚은 구유. 쓰러뜨린 것이 쌓인다
  if (type === 'table') { const n = Math.min(6, G.corpses.length); rect(x, '#3a2a18', mx - 48, fy - 10, 96, 10); rect(x, RS, mx - 46, fy - 12, 92, 10); rect(x, RH, mx - 46, fy - 12, 92, 2); rect(x, RS, mx - 50, fy - 18, 8, 18); rect(x, RH, mx - 50, fy - 18, 2, 16); rect(x, RS, mx + 42, fy - 18, 8, 18); rect(x, RH, mx + 42, fy - 18, 2, 16); for (let k = 0; k < 3; k++) { const bx = mx - 30 + k * 22; rect(x, BD, bx, fy - 20, 2, 8); rect(x, BN, bx + 2, fy - 24, 8, 2); rect(x, BN, bx + 10, fy - 22, 2, 10); rect(x, BH, bx + 2, fy - 24, 4, 1); } for (let k = 0; k < n; k++) { const bx = mx - 36 + k * 13, by = fy - 16 - (k % 2) * 5; disc(x, '#5a1018', bx, by, 6); disc(x, '#b8303a', bx - 1, by - 1, 4); rect(x, '#ff9a8a', bx - 3, by - 3, 2, 2); } if (!n) skull(mx + 26, fy - 16); }

  if (type === 'core') {   // 본체는 모아 둔 것을 깔고 앉아 있다: 방울방울 굳은 덩이
    const n = Math.min(12, Math.ceil(Math.max(0, ST.hud ? ST.hud.gold : G.gold) / (100 * NEST.cm(G)))), cx = r.x + r.w - 60, rows = [6, 4, 2]; let k = 0;
    rows.forEach((w, row) => { for (let j = 0; j < w && k < n; j++, k++) { const bx = Math.round(cx - w * 9 + j * 18) + 8, by = fy - 5 - row * 8; disc(x, '#8a6a1c', bx, by, 8); disc(x, '#e8c030', bx, by - 1, 6); rect(x, '#fff3a0', bx - 4, by - 4, 3, 2); } });
  }
  if (type === 'core') { x.fillStyle = (main ? ASPCOL[main] : '#9fb8a8') + '33'; x.beginPath(); x.ellipse(r.x + r.w - 60, fy, 56 + Math.sin(t / 500) * 4, 12, 0, 0, 7); x.fill(); }
  for (let l = 1; l < c.lv; l++) rect(x, '#f5f5f5', r.x + r.w - 14 - (l - 1) * 7, r.y + 10, 4, 4);
}
function drawCell(x, i, t, canDig) {
  const c = G.cells[i], r = cellRect(i), b = biome(), dg = k => k >= 0 && k < G.cells.length && G.cells[k].dug, C = G.cols;
  const nb = [i % C > 0 && dg(i - 1), i % C < C - 1 && dg(i + 1), dg(i - C), dg(i + C)].map(v => v ? 1 : 0);
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
  if (i === G.ent && !G.sealed) for (let k = 0; k < 22; k += 4) { const wob = ev2(hsh(33, k) * 6); rect(x, DARKC, r.x + 38 - wob, r.y + k, 32 + wob + ev2(hsh(34, k) * 4), 4); }   // 땅 위로 난 틈
  if (c.type !== 'empty') lamp(x, r, i, t, b);
  ambient(x, r, i, t, b);
  if (i === G.core) { const sz = 16 * slimeScale(G.slime), hc = G.slime.main ? ASPCOL[G.slime.main] : '#9fb8a8'; x.save(); x.beginPath(); x.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); x.clip(); glow(x, hc, r.x + r.w - 14 - sz / 2, fy - sz / 2, 84 + b.st * 10 + Math.sin(t / 600) * 4, 0.5 + b.st * 0.03); x.restore(); }   // 본체가 내는 희미한 빛
  drawRoom(x, c, i, r, t);
  if (c.block) { for (let k = 0; k < 6; k++) { const bx = r.x + 34 + k * 24, br = 13 + (k % 3) * 4; disc(x, '#2a2434', bx, fy - br + 4, br); disc(x, k % 2 ? '#4a4458' : '#5a5466', bx - 1, fy - br + 3, br - 2); rect(x, '#7a7488', bx - br + 6, fy - br * 2 + 8, 6, 2); } txt(x, '막힘', r.x + r.w / 2, r.y + 40, '#ff9a92', 15, 'center'); }
  if (G.off[i]) { rect(x, '#0b0c16aa', r.x + 4, r.y + 4, r.w - 8, r.h - 8); txt(x, '뒤집힘', r.x + r.w / 2, r.y + 40, '#ff9a92', 14, 'center'); }
  if (ST.sanfx[i] && t - ST.sanfx[i] < 380) rect(x, '#a884ff44', r.x + 4, r.y + 4, r.w - 8, r.h - 8);
  const d = NEST.ROOM[c.type]; let name = i === G.ent && c.type === 'empty' ? '입구' : d.name;
  if (i === G.ent && c.type !== 'empty') name = '입구 · ' + name;
  if (d.def && i !== G.core) name += ' ' + G.kin.filter(m => m.loc === i && m.kind !== 'spawn').length + '/' + d.def;
  tagL(x, name, r.x + 12, r.y + 10, c.type === 'empty' ? '#a2a8c6' : '#ece6d6', 13, c.type === 'empty' ? null : i === G.core ? '#e8c030' : b.st ? ASPCOL[b.main] : '#6a6478');
}
function drawRoute(x, t) {
  const ps = NEST.paths(G); x.fillStyle = '#e8c030';
  ps.forEach(p => { for (let k = 0; k < p.length - 1; k++) { const a = cellRect(p[k]), b = cellRect(p[k + 1]), vert = a.x === b.x, ax = a.x + (vert ? 54 : a.w / 2), ay = floorY(a) + 8, bx = b.x + (vert ? 54 : b.w / 2), by = floorY(b) + 8, n = 6; for (let s = 0; s < n; s++) { const f = (s + (t / 600) % 1) / n; x.globalAlpha = 0.55; x.fillRect(Math.round(ax + (bx - ax) * f) - 2, Math.round(ay + (by - ay) * f) - 2, 4, 4); } } });
  x.globalAlpha = 1;
}
// ---------- 낮의 권속: 지키라고 한 것은 제자리에, 나머지는 제멋대로 굴을 돌아다닌다. 밤이 오면 제 자리로 간다 ----------
const dugAt = i => i >= 0 && i < G.cells.length && G.cells[i].dug && !G.cells[i].block;
function roamPos(m, home, t, small) {
  const R = ST.roam || (ST.roam = {}), still = !!(m.pin || m.hurt || m.strike || ST.mode !== 'day' || small), homeCell = locIdx(m.loc), sz = small ? 16 : 32;
  let w = R[m.id]; if (!w) w = R[m.id] = { x: home.x, y: home.y, fx: home.x, fy: home.y, tx: home.x, ty: home.y, t0: t, dur: 0, cell: homeCell, next: homeCell, rest: t + 300 + Math.random() * 2500 };
  const go = (tx, ty, cell) => { w.fx = w.x; w.fy = w.y; w.tx = tx; w.ty = ty; w.t0 = t; w.dur = Math.max(250, Math.hypot(tx - w.x, ty - w.y) * 24); w.next = cell; };
  if (w.dur) { const k = Math.min(1, (t - w.t0) / w.dur); w.x = w.fx + (w.tx - w.fx) * k; w.y = w.fy + (w.ty - w.fy) * k; if (k >= 1) { w.dur = 0; w.cell = w.next; w.rest = t + 500 + Math.random() * 3200; } }
  else if (still) { if (Math.abs(w.x - home.x) + Math.abs(w.y - home.y) > 1) go(home.x, home.y, homeCell); }
  else if (t > w.rest) {
    const C = G.cols, c = dugAt(w.cell) || w.cell === G.core ? w.cell : homeCell, col = c % C, row = Math.floor(c / C), far = Math.abs(col - homeCell % C) + Math.abs(row - Math.floor(homeCell / C));
    const opts = []; if (col > 0 && dugAt(c - 1)) opts.push(c - 1); if (col < C - 1 && dugAt(c + 1)) opts.push(c + 1); if (row > 0 && dugAt(c - C)) opts.push(c - C); if (row < G.rows - 1 && dugAt(c + C)) opts.push(c + C);
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
// 손 주문이 무대에 남기는 것. 주문마다 모양과 빛깔이 다르다
const SPFX = { whip: ['tendril', '#fff3a0'], move: ['rings', '#ece6d6'], mark: ['xmark', '#ff5f57'], rock: ['fall', '#9a94a8'], wave: ['sweep', '#6fb8ff'], rift: ['crack', '#c8a8ff'], hatch: ['rings', '#6fd08c'], phantom: ['ghost', '#c8a8ff'], bite: ['teeth', '#f5f5f5'], call: ['rings', '#e8c030'], halo: ['halo', '#fff3a0'], flip: ['swirl', '#ece6d6'], tide: ['rise', '#8ad8c0'], star: ['stars', '#fff3a0'], flesh: ['rings', '#e89aa8'], charm: ['heart', '#e89aa8'], rise: ['hands', '#8fe05a'], scream: ['rings', '#ff9a92'], cocoon: ['net', '#ece6d6'], eclipse: ['dark', '#0b0911'], guard: ['shield', '#6fb8ff'], grip: ['tendril', '#8ad8c0'] };
const SPSND = { rock: 'trap', bite: 'hit', tide: 'up', scream: 'mad', phantom: 'mad', charm: 'mad', whip: 'hit', cocoon: 'slide', guard: 'click', hatch: 'talk', rise: 'die' };
function triD(x, col, cx, ty, hw, h) { x.fillStyle = col; for (let dy = 0; dy < h; dy += 2) { const hf = Math.max(1, Math.round(hw * (1 - dy / h))); x.fillRect(Math.round(cx - hf), Math.round(ty + dy), hf * 2, 2); } }
function castFx(e) {
  const f = SPFX[e.sp]; if (!f) return; const r = cellRect(locIdx(e.room)), u = e.u && ST.ents[e.u];
  ST.spfx = { id: e.sp, fx: f[0], col: f[1], r, t0: now(), dur: 760, ux: u ? u.x + 8 * (u.scale || S) : r.x + r.w / 2, uy: u ? u.y + 8 * (u.scale || S) : floorY(r) - 24 };
  if (e.sp === 'mark' && u) u.marked = true;
  ST.floats.push({ x: r.x + r.w / 2, y: r.y + 34, s: NEST.SPELL[e.sp].name, col: f[1] === '#0b0911' ? '#fff3a0' : f[1], t0: now(), big: true });
  if (['rock', 'wave', 'bite', 'scream'].includes(e.sp)) ST.shake = now() + 260;
  sfx('spell'); if (SPSND[e.sp]) setTimeout(() => sfx(SPSND[e.sp]), 140);
}
function drawSpell(x, s, k, t) {
  const r = s.r, fy = floorY(r), cx = r.x + r.w / 2, a = 1 - k; x.save(); x.beginPath(); x.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); if (s.fx !== 'rise') x.clip(); x.globalAlpha = Math.min(1, a * 1.6); x.strokeStyle = s.col; x.fillStyle = s.col; x.lineWidth = 3;
  if (s.fx === 'fall') for (let n = 0; n < 6; n++) { const px = r.x + 18 + n * (r.w - 36) / 5, py = r.y + 8 + Math.min(1, k * 1.7 + (n % 3) * 0.08) * (fy - r.y - 16); disc(x, '#3a3444', px, py, 9); disc(x, s.col, px, py - 1, 7); rect(x, '#d8d4e4', px - 4, py - 5, 4, 2); }
  else if (s.fx === 'sweep') for (let n = 0; n < 4; n++) { const px = r.x + r.w - (k * 1.2 + n * 0.12) * r.w; rect(x, n % 2 ? '#d8f0ff' : s.col, px, fy - 44 + n * 8, 46, 6); rect(x, s.col, px + 8, fy - 6, 60, 4); }
  else if (s.fx === 'crack') { x.beginPath(); x.moveTo(cx, r.y + 6); for (let n = 1; n <= 7; n++) x.lineTo(cx + (n % 2 ? 1 : -1) * (6 + 10 * k), r.y + 6 + n * (r.h - 12) / 7); x.stroke(); x.globalAlpha = a * 0.35; rect(x, s.col, cx - 14 * k - 3, r.y + 6, 28 * k + 6, r.h - 12); }
  else if (s.fx === 'rings') for (let n = 0; n < 3; n++) { const kk = (k + n * 0.22) % 1; x.globalAlpha = (1 - kk) * a; x.beginPath(); x.ellipse(s.ux, s.id === 'hatch' || s.id === 'flesh' ? fy - 4 : s.uy, 10 + kk * 70, (s.id === 'hatch' || s.id === 'flesh' ? 4 : 10) + kk * (s.id === 'hatch' || s.id === 'flesh' ? 14 : 44), 0, 0, 7); x.stroke(); }
  else if (s.fx === 'ghost') for (let n = 0; n < 4; n++) { const px = r.x + 24 + n * (r.w - 48) / 3, py = fy - 20 - k * 46 - (n % 2) * 8; x.globalAlpha = a * 0.8; disc(x, s.col, px, py, 9); rect(x, s.col, px - 8, py, 16, 12); rect(x, '#16121f', px - 5, py - 3, 3, 3); rect(x, '#16121f', px + 2, py - 3, 3, 3); }
  else if (s.fx === 'teeth') { const g = 26 * (1 - Math.min(1, k * 2.2)); for (let n = -3; n <= 3; n++) { triD(x, s.col, s.ux + n * 7, s.uy - g - 10, 4, 12); tri(x, s.col, s.ux + n * 7, s.uy + g + 10, 4, 12); } rect(x, '#ff5f57', s.ux - 26, s.uy - g - 12, 52, 4); rect(x, '#ff5f57', s.ux - 26, s.uy + g + 10, 52, 4); }
  else if (s.fx === 'xmark') { const z = 18 - 6 * Math.min(1, k * 3); x.beginPath(); x.moveTo(s.ux - z, s.uy - z); x.lineTo(s.ux + z, s.uy + z); x.moveTo(s.ux + z, s.uy - z); x.lineTo(s.ux - z, s.uy + z); x.stroke(); x.beginPath(); x.arc(s.ux, s.uy, z + 6, 0, 7); x.stroke(); }
  else if (s.fx === 'halo') { x.beginPath(); x.ellipse(cx, r.y + 26 + k * 10, r.w * 0.4, 9, 0, 0, 7); x.stroke(); x.globalAlpha = a * 0.25; rect(x, s.col, r.x + 10, r.y + 26, r.w - 20, fy - r.y - 26); }
  else if (s.fx === 'swirl') for (let n = 0; n < 2; n++) { x.beginPath(); x.arc(cx, fy - 30, 30 + n * 14, k * 7 + n * 3.14, k * 7 + n * 3.14 + 2.4); x.stroke(); }
  else if (s.fx === 'rise') { x.globalAlpha = a * 0.5; for (let c = 0; c < 5; c++) for (let w = 0; w < 4; w++) { const q = cellRect(w * 5 + c); if (!G.cells[w * 5 + c].dug) continue; rect(x, s.col, q.x + 6, floorY(q) - k * 40, q.w - 12, 4); rect(x, '#f5f5f5', q.x + q.w / 2 - 2, floorY(q) - 30 - k * 20, 4, 12); rect(x, '#f5f5f5', q.x + q.w / 2 - 6, floorY(q) - 26 - k * 20, 12, 4); } }
  else if (s.fx === 'stars') for (let n = 0; n < 7; n++) { const px = r.x + 16 + n * (r.w - 32) / 6, py = r.y + 14 + ((n * 37) % 22); if (Math.floor(t / 90 + n) % 2) { rect(x, s.col, px - 1, py - 5, 2, 10); rect(x, s.col, px - 5, py - 1, 10, 2); } x.globalAlpha = a * 0.3; rect(x, s.col, px, py, 2, fy - py); x.globalAlpha = a; }
  else if (s.fx === 'heart') for (let n = 0; n < 3; n++) { const px = s.ux - 14 + n * 14, py = s.uy - 18 - k * 26 - (n % 2) * 6; disc(x, s.col, px - 3, py, 4); disc(x, s.col, px + 3, py, 4); triD(x, s.col, px, py + 1, 7, 8); }
  else if (s.fx === 'hands') for (let n = 0; n < 4; n++) { const px = r.x + 30 + n * (r.w - 60) / 3, hh = Math.min(1, k * 2) * 26; rect(x, s.col, px, fy - hh, 6, hh); for (let q = -1; q <= 1; q++) rect(x, s.col, px + q * 5, fy - hh - 8, 3, 9); }
  else if (s.fx === 'net') { for (let n = -2; n <= 2; n++) { rect(x, s.col, s.ux + n * 6, s.uy - 16, 2, 32); rect(x, s.col, s.ux - 16, s.uy + n * 6, 32, 2); } x.beginPath(); x.arc(s.ux, s.uy, 20, 0, 7); x.stroke(); }
  else if (s.fx === 'dark') { x.globalAlpha = a * 0.7; rect(x, s.col, r.x + 2, r.y + 2, r.w - 4, r.h - 4); x.globalAlpha = a; disc(x, '#fff3a0', cx, r.y + 34, 14); disc(x, '#16121f', cx + 12 - k * 12, r.y + 34, 14); }
  else if (s.fx === 'shield') { brk(x, s.col, r.x + 10, r.y + 12, r.w - 20, fy - r.y - 14); x.globalAlpha = a * 0.2; rect(x, s.col, r.x + 10, r.y + 12, r.w - 20, fy - r.y - 14); }
  else if (s.fx === 'tendril') for (let n = 0; n < 3; n++) { x.beginPath(); x.moveTo(r.x + r.w - 20, fy - 6); x.quadraticCurveTo(cx, r.y + 10 + n * 14 + 30 * k, r.x + 18 + n * 22, fy - 30 + n * 8); x.stroke(); }
  x.restore(); x.globalAlpha = 1;
}
// 과녁 고르기: 누를 수 있는 적과 방을 밝힌다
function drawPick(x, t) {
  const p = ST.pick, up = Math.floor(t / 220) % 2, col = up ? '#fff3a0' : '#6fb8ff';
  if (p.kind === 'inv') p.ids.forEach(id => { const e = ST.ents && ST.ents[id]; if (!e || e.gone || e.dead) return; const sz = 16 * (e.scale || S); brk(x, col, e.x - 4, e.y - 4, sz + 8, sz + 8); triD(x, col, e.x + sz / 2, e.y - 24 + up * 3, 6, 8); });
  else p.ids.forEach(k => { const r = cellRect(locIdx(k)); x.strokeStyle = col; x.lineWidth = 4; x.strokeRect(r.x + 5.5, r.y + 5.5, r.w - 11, r.h - 11); plate(x, '여기', r.x + r.w / 2, r.y + 22 + up * 3, col, 14); });
}
function atkFx(a, b, h) {
  const sa = 8 * (a.scale || S), sb = 8 * (b.scale || S), kind = a.id === 's' ? 'bite' : a.side === 'inv' ? 'slash' : (h.sd > 0 && !h.d ? 'beam' : FXKIND[a.kind] || 'slash');
  ST.sparks.push({ fx: kind, x0: a.x + sa, y0: a.y + sa, x: b.x + sb, y: b.y + sb, t0: now(), dur: kind === 'beam' ? 360 : kind === 'net' ? 420 : 250, col: kind === 'beam' ? '#c8a8ff' : kind === 'bite' ? '#f5f5f5' : kind === 'net' ? '#a0a8c0' : a.side === 'inv' ? '#ff9a92' : kind === 'whip' ? '#8ad8c0' : '#fff3a0' });
}
function drawUnder(x, t) {
  rect(x, DARKC, 0, 0, UW(), UH());
  const er = cellRect(G.ent), UWv = UW();
  if (G.sealed) txt(x, '굴이 막혀 있다 · 땅 위는 아직 모른다', GX + 8, 22, '#6a6478', 13);
  else {   // 뚫린 뒤: 입구 언저리의 땅거죽만 보인다. 사다리가 아니라 다듬지 않은 틈이다
    const tk = 'top:' + G.ent + ':' + UWv; if (!BG[tk]) { const W = UWv, cv0 = BG[tk] = document.createElement('canvas'); cv0.width = W; cv0.height = GY; const q = cv0.getContext('2d'); rockTex(q, 999, 0, 0, W, GY, '#1a1524'); q.fillStyle = '#3a2c20'; q.fillRect(0, 10, W, 10); q.fillStyle = '#2a2018'; q.fillRect(0, 18, W, 2); q.fillStyle = '#2f6b3a'; q.fillRect(0, 0, W, 10); q.fillStyle = '#1f4a28'; q.fillRect(0, 8, W, 2);
      for (let k = 0; k < 120; k++) { const px = ev2(hsh(7, k) * W); q.fillStyle = hsh(8, k) > 0.5 ? '#4a9a52' : '#3f8046'; q.fillRect(px, ev2(hsh(9, k) * 6), 2, 4); if (k % 3 === 0) { q.fillStyle = '#5a4634'; q.fillRect(ev2(hsh(10, k) * W), 12 + ev2(hsh(11, k) * 6), 4, 2); } if (k % 5 === 0) { q.fillStyle = '#3a2c20'; const len = 6 + ev2(hsh(12, k) * 16); q.fillRect(px, 20, 2, len); } }
      const g = q.createLinearGradient(er.x + 120, 0, er.x + 330, 0); g.addColorStop(0, 'rgba(7,5,10,0)'); g.addColorStop(1, 'rgba(7,5,10,1)'); q.fillStyle = g; q.fillRect(er.x + 120, 0, W, GY);
      const g2 = q.createLinearGradient(er.x - 20, 0, er.x - 230, 0); g2.addColorStop(0, 'rgba(7,5,10,0)'); g2.addColorStop(1, 'rgba(7,5,10,1)'); q.fillStyle = g2; q.fillRect(0, 0, Math.max(0, er.x - 20), GY); }
    x.drawImage(BG[tk], 0, 0);
    for (let k = 0; k < GY; k += 4) { const wob = ev2(hsh(31, k) * 6); rect(x, DARKC, er.x + 38 - wob, k, 32 + wob + ev2(hsh(32, k) * 6), 4); }
    for (const [dx, len] of [[34, 16], [44, 8], [70, 20], [76, 10]]) rect(x, '#3a2c20', er.x + dx, 20, 2, len);
    if (ST.focus == null) { const right = G.ent % G.cols >= G.cols - 2; txt(x, TOUCH ? '▲ 지상' : '▲ 지상 (Tab)', right ? er.x + 30 : er.x + 86, 22, '#a2a8c6', 13, right ? 'right' : 'left'); } }
  const day = ST.mode === 'day';
  for (let i = 0; i < G.cells.length; i++) drawCell(x, i, t, day && !G.cells[i].dug && !NEST.canDig(G, i));
  if (!G.sealed && G.cells[G.ent].dug) {   // 틈으로 새어 드는 바깥의 빛
    x.save(); x.beginPath(); x.rect(er.x, 0, er.w, floorY(er)); x.clip(); x.globalCompositeOperation = 'lighter'; x.fillStyle = ST.mode === 'night' ? 'rgba(120,150,220,' + (0.10 + 0.02 * Math.sin(t / 700)) + ')' : 'rgba(255,232,176,' + (0.13 + 0.02 * Math.sin(t / 700)) + ')';
    x.beginPath(); x.moveTo(er.x + 38, 0); x.lineTo(er.x + 70, 0); x.lineTo(er.x + 100, floorY(er)); x.lineTo(er.x + 12, floorY(er)); x.fill(); x.restore(); }
  drawRoute(x, t);
  if (ST.ents) { const es = Object.values(ST.ents); es.filter(e => e.side === 'def').forEach(e => drawUnit(x, e, t)); es.filter(e => e.side === 'inv').forEach(e => drawUnit(x, e, t)); }
  else {
    const by = {}; G.kin.forEach(m => { if (m.loc !== null) (by[m.loc] = by[m.loc] || []).push(m); });
    for (const loc in by) by[loc].forEach((m, k) => { const sm = m.kind === 'spawn', p = roamPos(m, defPos(loc === 'core' ? 'core' : +loc, k, sm), t, sm); if (!m.hurt && !m.strike) glow(x, '#cfeee0', p.x + (sm ? 8 : 16), p.y + (sm ? 8 : 16), sm ? 14 : 30, 0.2); x.globalAlpha = m.hurt || m.strike ? 0.4 : 1; { const fz = !sm && (NEST.stageOf(m) >= 2 || !!m.secret), sz = fz ? 64 : (m.evo && !sm) ? 48 : sm ? (m.evo ? 26 : 16) : 32; x.drawImage(frameOf(fz ? kinCanvasM(m) : kinCanvas(m.kind, !!m.evo), Math.floor(t / 420 + m.id * 0.37) % 2), p.x - (fz ? 16 : (m.evo && !sm) ? 8 : m.evo ? 5 : 0), Math.round(p.y + Math.sin(t / 500 + m.id) * 1) - (fz ? 32 : (m.evo && !sm) ? 16 : m.evo ? 10 : 0), sz, sz); } x.globalAlpha = 1; if (m.hurt) txt(x, '부상', p.x + 16, p.y - 14, '#ff9a92', 11, 'center'); else if (m.strike) txt(x, '파업', p.x + 16, p.y - 14, '#ffb347', 11, 'center'); });
    G.kin.forEach(m => { if (!m.pin || m.loc === null || m.kind === 'spawn') return; const w = ST.kinPos && ST.kinPos[m.id]; if (!w) return; const fx = Math.round(w.x) + 14, fy = Math.round(w.y) - 12; rect(x, '#0b0c16', fx - 1, fy - 1, 4, 13); rect(x, '#e8c030', fx, fy, 2, 11); rect(x, '#0b0c16', fx + 1, fy - 1, 9, 8); rect(x, '#e8c030', fx + 2, fy, 7, 6); rect(x, '#fff3a0', fx + 2, fy, 7, 2); });
    const r = cellRect(G.core), sc = slimeScale(G.slime), size = 16 * sc;
    { const hc = G.slime.main ? ASPCOL[G.slime.main] : '#cfeee0', cx = r.x + r.w - 14 - size / 2, fy0 = floorY(r); for (let k = 0; k < 7; k++) { const ph = (t / 1900 + k / 7) % 1; x.globalAlpha = (1 - ph) * 0.85; rect(x, k % 3 ? hc : '#ffffff', cx + Math.sin(k * 2.3 + t / 700) * (size * 0.55 + 6), fy0 - 4 - ph * (size + 18), 2, 2); } x.globalAlpha = 1; }
    x.drawImage(slimeCanvas(G.slime, Math.floor(t / 240)), r.x + r.w - 14 - size, Math.round(floorY(r) - size + sc + Math.sin(t / 400) * 2), size, size);
    const hp = G.slime.hp / NEST.slimeStats(G).hp; if (hp < 0.999) { rect(x, '#0b0c16', r.x + r.w - 15 - size, floorY(r) - size - 9, size + 2, 6); rect(x, '#6fd08c', r.x + r.w - 14 - size, floorY(r) - size - 8, size * hp, 4); }
  }
  ST.sparks = ST.sparks.filter(s => t - s.t0 < s.dur); ST.sparks.forEach(s => { const k = (t - s.t0) / s.dur; x.globalAlpha = 1 - k; if (s.fx) drawFx(x, s, k); else if (s.ring) { x.strokeStyle = s.col; x.lineWidth = 2; x.beginPath(); x.arc(s.x, s.y, 6 + k * 18, 0, 7); x.stroke(); } else for (let n = 0; n < 6; n++) { const a = n * 1.047 + s.rot, r0 = 4 + k * 6, r1 = 9 + k * 16; x.strokeStyle = s.col; x.lineWidth = 2; x.beginPath(); x.moveTo(s.x + Math.cos(a) * r0, s.y + Math.sin(a) * r0); x.lineTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1); x.stroke(); } x.globalAlpha = 1; });
  const mark = (loc, col) => { const r = cellRect(locIdx(loc)); x.strokeStyle = col; x.lineWidth = 3; x.strokeRect(r.x + 3.5, r.y + 3.5, r.w - 7, r.h - 7); };
  if (day && ST.hover && ST.hover.t === 'cell' && visible(ST.hover.i) && !(UI.sel && UI.sel.t === 'cell' && UI.sel.i === ST.hover.i)) mark(ST.hover.i, '#ece6d666');
  if (day && UI.sel && UI.sel.t === 'cell') mark(UI.sel.i, '#e8c030');
  if (ST.tutCell != null && day) { const r = cellRect(ST.tutCell), up = Math.floor(t / 300) % 2; mark(ST.tutCell, up ? '#e8c030' : '#fff3a0'); plate(x, '▼ 여기', r.x + r.w / 2, r.y + 22 + up * 4, '#fff3a0', 15); }
  if (ST.ents) Object.values(ST.ents).forEach(e => { if (e.marked && !e.gone && !e.dead) { const sz = 16 * (e.scale || S), mx = Math.round(e.x + sz / 2), my = Math.round(e.y - 14); rect(x, '#ff5f57', mx - 5, my - 1, 10, 2); rect(x, '#ff5f57', mx - 1, my - 5, 2, 10); } });
  if (ST.spfx) { const k = (t - ST.spfx.t0) / ST.spfx.dur; if (k >= 1) ST.spfx = null; else drawSpell(x, ST.spfx, k, t); }
  if (ST.focus != null && !ST.pick) mark(ST.focus, Math.floor(t / 250) % 2 ? '#ff5f57' : '#fff3a0');
  if (ST.pick && ST.mode === 'night') drawPick(x, t);
  if (ST.pulse && now() - ST.pulse.t0 < 700) mark(ST.pulse.i, Math.floor((now() - ST.pulse.t0) / 120) % 2 ? '#fff3a0' : '#e8c030');   // 권속이 방금 손댄 칸
}

// ---------- 지상 ----------
function pathPoint(v, f) { const a = VPOS[v], b = PPOS[NEST.VILL[v].plot], c = CAVE; if (f < 0.5) { const k = f / 0.5; return { x: a.x + (b.x - a.x) * k, y: a.y + 34 + (b.y - a.y - 34) * k }; } const k = (f - 0.5) / 0.5; return { x: b.x + (c.x - b.x) * k, y: b.y + (c.y - b.y) * k }; }
function drawParty(x, t, est, f, label, col) {
  const p = pathPoint(est.vill, f), n = Math.min(7, est.count);
  for (let k = 0; k < n; k++) { const kind = est.kinds ? est.kinds[k % est.kinds.length] : (est.only && k < est.only.length ? est.only[k] : 'shade'); x.drawImage(kind === 'shade' ? spriteCanvas('human', 'shade') : invCanvas(kind), Math.round(p.x - n * 9 + k * 18), Math.round(p.y - 30 + Math.sin(t / 200 + k) * 2), 32, 32); }
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
    if (s.razed) { if (!razedW(x, G && G.world, p, t)) for (let k = 0; k < 5; k++) rect(x, '#4a4a58', p.x - 34 + k * 14, p.y + 8 - (k % 2) * 8, 12, 10 + (k % 2) * 8); for (let k = 0; k < 3; k++) rect(x, '#8a829688', p.x - 10 + k * 8 + Math.sin(t / 300 + k) * 4, p.y - 20 - ((t / 40 + k * 20) % 40), 8, 8); }
    else drawVillageW(x, (G && G.world) || 'fantasy', v, p, t, night);
    if (sel || hov) brk(x, sel ? '#e8c030' : '#ece6d6aa', p.x - 48, p.y - 30, 108, 64);
    const stt = villState(v); plate(x, d.name + ' · ' + stt + (stt === '평온' && G.vill[v].trust ? ' ' + '●'.repeat(G.vill[v].trust) : ''), p.x + 6, p.y + 32, stt === '평온' ? '#ece6d6' : stt === '공물 중' ? '#e8c030' : stt === '폐허' ? '#a2a8c6' : '#ff9a92', 14);
    if (!s.razed) { rect(x, '#0b0c16', p.x - 25, p.y + 55, 62, 6); rect(x, '#ff5f57', p.x - 24, p.y + 56, 60 * Math.min(1, s.host / 100), 4); }
  });
  // 길목
  PPOS.forEach((p, k) => {
    const type = G.plots[k], sel = UI.sel && UI.sel.t === 'plot' && UI.sel.p === k, hov = ST.hover && ST.hover.t === 'plot' && ST.hover.p === k;
    plotBaseW(x, G && G.world, p, type);
    plotPropW(x, G && G.world, p, type, t);   // 길목의 시설은 둥지가 지은 것이라 어느 세상에서나 둥지의 것으로 보인다
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
    spotDressW(x, G && G.world, ty, p, t, fl);
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
  const fitH = G && c.clientHeight >= 360 ? Math.max(H, UH()) : H; ST.vh = H + (fitH - H) * ST.p; const VH = ST.vh;
  const k0 = c.height / VH, VW = c.width / k0; const WW = worldW(); ST.viewW = Math.min(WW, VW); ST.ox = Math.max(0, (VW - WW) / 2); ST.fm = Math.max(1, Math.min(1.7, 0.86 * dpr / k0));
  if (ST.camFor !== G) { ST.camFor = G; if (ST.screen === 'under' && ST.mode === 'day') { camCell(G.core, true); ST.camMem.under = ST.cam.tx; } }   // 새 판은 동굴 한 칸뿐이다. 그 칸이 먼저 보여야 한다
  if (ST.march && ST.screen === 'surface') camTo(pathPoint(ST.march.est.vill, 0.5 + 0.5 * Math.min(1, (t - ST.march.t0) / ST.march.dur)).x);
  const max = Math.max(0, worldW() - ST.viewW); ST.cam.tx = Math.max(0, Math.min(max, ST.cam.tx)); ST.cam.x += (ST.cam.tx - ST.cam.x) * 0.16; if (Math.abs(ST.cam.tx - ST.cam.x) < 0.5) ST.cam.x = ST.cam.tx;
  { const vm = Math.max(0, UH() - VH); ST.cam.tv = Math.max(0, Math.min(vm, ST.cam.tv || 0)); ST.cam.v = ST.cam.v || 0; ST.cam.v += (ST.cam.tv - ST.cam.v) * 0.16; if (Math.abs(ST.cam.tv - ST.cam.v) < 0.5) ST.cam.v = ST.cam.tv; }
  x.setTransform(k0, 0, 0, k0, 0, 0); x.imageSmoothingEnabled = false; rect(x, '#16121f', 0, 0, VW + 1, VH);
  const target = ST.screen === 'under' ? 1 : 0; ST.p += (target - ST.p) * 0.2; if (Math.abs(target - ST.p) < 0.004) ST.p = target;
  { // 창이 덮은 만큼(ST.cover, 화면 px) 고른 것을 위로 올린다
    const cov = ST.mode === 'day' && ST.cover ? ST.cover / (c.clientHeight / VH) : 0, sel = UI.sel; let sy = null;
    if (cov > 0 && sel) sy = sel.t === 'cell' ? cellRect(sel.i).y + CH / 2 - (ST.cam.v || 0) : sel.t === 'vill' ? VPOS[sel.v].y + 20 : sel.t === 'plot' ? PPOS[sel.p].y : sel.t === 'spot' && G.spot ? SPOS[G.spot.pos].y : null;
    const ty = sy == null ? 0 : Math.max(0, Math.min(cov, sy - (VH - cov) / 2));
    ST.cam.y = ST.cam.y || 0; ST.cam.y += (ty - ST.cam.y) * 0.22; if (Math.abs(ty - ST.cam.y) < 0.5) ST.cam.y = ty;
  }
  x.save(); x.translate(Math.round(ST.ox - ST.cam.x), -Math.round(ST.cam.y || 0));
  if (ST.shake > t) x.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
  if (ST.p < 0.999) { x.save(); x.translate(0, Math.round(-H * ST.p)); drawSurface(x, t); x.restore(); }
  if (ST.p > 0.001) { x.save(); x.translate(0, Math.round(H * (1 - ST.p) - (ST.cam.v || 0))); drawUnder(x, t); ST.floats = ST.floats.filter(f => t - f.t0 < 800); ST.floats.forEach(f => { const k = (t - f.t0) / 800; x.globalAlpha = 1 - k; txt(x, f.s, f.x, f.y - k * 26, f.col, f.big ? 20 : 14, 'center'); x.globalAlpha = 1; }); x.restore(); }
  x.restore();
  { const g = x.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, Math.max(VW, VH) * 0.78); g.addColorStop(0, 'rgba(5,3,12,0)'); g.addColorStop(1, 'rgba(5,3,12,' + (0.22 + 0.36 * ST.p).toFixed(2) + ')'); x.fillStyle = g; x.fillRect(0, 0, VW + 1, H); }
  if (ST.flash > t) rect(x, '#ffffff55', 0, 0, VW + 1, VH);
  if (max > 1 && ST.mode === 'day') { // 좌우로 더 있다는 표시
    x.fillStyle = '#ece6d6'; x.globalAlpha = 0.45 + 0.25 * Math.sin(t / 300); const tri = (px, d) => { x.beginPath(); x.moveTo(px, VH / 2 - 16); x.lineTo(px + d * 14, VH / 2); x.lineTo(px, VH / 2 + 16); x.fill(); };
    if (ST.cam.x > 4) tri(18, -1); if (ST.cam.x < max - 4) tri(VW - 18, 1); x.globalAlpha = 1;
  }
  if (ST.mode === 'day' && ST.screen === 'under' && UH() > VH + 1) { // 위아래로 더 있다는 표시
    x.fillStyle = '#ece6d6'; x.globalAlpha = 0.45 + 0.25 * Math.sin(t / 300); const tv = (py, d) => { x.beginPath(); x.moveTo(VW / 2 - 16, py); x.lineTo(VW / 2, py + d * 12); x.lineTo(VW / 2 + 16, py); x.fill(); };
    if ((ST.cam.v || 0) > 4) tv(16, -1); if ((ST.cam.v || 0) < UH() - VH - 4) tv(VH - 16, 1); x.globalAlpha = 1;
  }
  if (ST.focus != null) plate(x, ST.pick ? (ST.pick.kind === 'inv' ? '적을 누른다' : '방을 누른다') : isMobile() ? '손을 쓸 차례 — 아래에서 고른다' : '손을 쓸 차례 — 오른쪽에서 고른다', VW / 2, 12, '#fff3a0', 16);
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
  if (ST.screen === 'under') { const col = Math.floor((cx - GX) / CW), row = Math.floor((cy - GY) / CH), er = cellRect(G.ent); if (cy < GY && cx > er.x + 20 && cx < er.x + 200) return G.sealed ? null : { t: 'up' }; if (col < 0 || col >= G.cols || row < 0 || row >= G.rows) return null; return visible(row * G.cols + col) ? { t: 'cell', i: row * G.cols + col } : null; }   // 보이지 않는 칸은 누를 수 없다
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
  const E = ST.ents = {}; ST.defs = {}; ST.floats = []; ST.sparks = []; ST.fire = {}; ST.sanfx = {}; ST.spfx = null; ST.pick = null;
  G.kin.forEach(m => { if (m.loc === null || m.hurt || m.strike) return; const list = ST.defs[m.loc] = ST.defs[m.loc] || [], sm = m.kind === 'spawn', p = defPos(m.loc, list.length, sm); E['k' + m.id] = { id: 'k' + m.id, kind: m.kind, side: 'def', can: !sm && (NEST.stageOf(m) >= 2 || m.secret) ? kinCanvasM(m) : kinCanvas(m.kind, !!m.evo), x: p.x - (!sm && (NEST.stageOf(m) >= 2 || m.secret) ? 16 : (m.evo && !sm) ? 8 : m.evo ? 5 : 0), y: p.y - (!sm && (NEST.stageOf(m) >= 2 || m.secret) ? 36 : (m.evo && !sm) ? 16 : m.evo ? 10 : 0), hp: 1, scale: !sm && (NEST.stageOf(m) >= 2 || m.secret) ? 2.5 : (m.evo && !sm) ? 3 : sm ? (m.evo ? 1.625 : 1) : S }; list.push('k' + m.id); });
  const r = cellRect(G.core), sc = slimeScale(G.slime), size = 16 * sc;
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
  const E = ST.ents, shaft = { x: cellRect(G.ent).x + 32, y: -50 };
  for (let n = from; n < ev.length; n++) {
    const e = ev[n]; if (e.txt) nlog(e.txt, e.t === 'fx' && ['kneel', 'flee', 'infight'].includes(e.k) ? 'mad' : e.t === 'fx' && ['hand', 'spell'].includes(e.k) ? 'hand' : '');
    if (e.t === 'march') {
      UI.sel = null; setScreen('surface'); $('nparty').innerHTML = e.party.map(u => invImg(u.kind, 32)).join(''); ST.label = NEST.VILL[e.vill].name + ' · ' + e.gname + ' ' + e.party.length + '명'; await wait(700);
      ST.march = { t0: now(), dur: 1300 / ST.speed, est: { vill: e.vill, count: e.party.length, kinds: e.party.map(u => u.kind), grade: 1 } }; await wait(1350); ST.label = '';
      e.party.forEach((u, j) => { E[u.uid] = { id: u.uid, kind: u.kind, side: 'inv', can: invCanvas(u.kind), x: shaft.x, y: shaft.y - j * 14, hp: 1, sp: 1, scale: u.kind === 'sealer' ? 3 : S }; });
      ST.camMem.under = 0; setScreen('under'); await wait(450); ST.march = null;
    } else if (e.t === 'go') {
      const out = e.to === 'out', r = out ? cellRect(G.ent) : cellRect(locIdx(e.to)); camTo(r.x + r.w / 2, false, r.y + r.h / 2);
      e.who.forEach((id, j) => { const u = E[id]; if (!u || u.dead || u.gone) return; moveTo(u, out ? shaft : invPos(r, j), e.back ? 300 : 420); if (out) setTimeout(() => { u.gone = true; }, 320 / ST.speed); });
      sfx('step'); await wait(e.back ? 320 : 460);
    } else if (e.t === 'trap') {
      const idx = e.room != null ? locIdx(e.room) : null; if (idx != null) camCell(idx);
      if (e.kind === 'san') { if (idx != null) ST.sanfx[idx] = now(); sfx('mad'); } else { if (idx != null) ST.fire[idx] = now(); sfx('trap'); }
      if (e.kind === 'boom' || e.kind === 'bite') { ST.shake = now() + 300; ST.flash = now() + 100; }
      e.hits.forEach(applyHit); await wait(430);
    } else if (e.t === 'round') {
      if (e.room != null) camCell(locIdx(e.room));
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
      if (e.k === 'hand' || e.k === 'spell') { ST.flash = now() + 120; if (e.sp && e.room != null) { camCell(locIdx(e.room)); castFx(e); await wait(360); } else sfx('spell'); }
      if (e.k === 'star' && e.room != null) { ST.fire[locIdx(e.room)] = now(); sfx('spell'); }
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
      if (e.amt > 0) { const r = cellRect(G.core); ST.floats.push({ x: r.x + r.w / 2, y: r.y + 40, s: '-' + e.amt + '방울', col: '#ff5f57', t0: now(), big: true }); sfx('down'); }
      await wait(600);
    } else if (e.t === 'end') {
      ST.label = { repel: '격퇴!', stolen: '쓰러졌다… 진액을 털렸다', core: '본체가 쓰러졌다' }[e.result]; sfx(e.result === 'repel' ? 'up' : 'down'); await wait(1000); ST.label = '';
    }
  }
  return ev.length;
}
