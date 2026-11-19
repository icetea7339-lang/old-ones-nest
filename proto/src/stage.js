// 옛 것의 둥지 — 화면 2/3: 지도(지상·지하)와 밤 전투 재생
const W = 960, H = 550, GX = 20, GY = 48, CW = 184, CH = 124, S = 2;
const cellRect = i => ({ x: GX + (i % 5) * CW, y: GY + Math.floor(i / 5) * CH, w: CW, h: CH });
const locIdx = loc => loc === 'core' ? NEST.CORE : +loc;
const floorY = r => r.y + r.h - 20;
const THEME = {
  base: { wall: '#3a3352', floor: '#5d4f72' }, abyss: { wall: '#183a5e', floor: '#2f6a94' }, nebula: { wall: '#2e2452', floor: '#5a4a9a' },
  brood: { wall: '#24402a', floor: '#4a7a3a' }, dusk: { wall: '#4a3028', floor: '#8a5a3a' }, hunger: { wall: '#4d1c22', floor: '#8a3038' },
};
PAL.shade = ['#101018', '#2a2a3a', '#2a2a3a', '#20202c', '#20202c'];
const VPOS = { gaet: { x: 92, y: 214 }, field: { x: 258, y: 146 }, bell: { x: 480, y: 118 }, school: { x: 702, y: 146 }, fort: { x: 868, y: 214 } };
const PPOS = [{ x: 244, y: 348 }, { x: 480, y: 322 }, { x: 716, y: 348 }], CAVE = { x: 480, y: 486 };
const SPOS = [{ x: 120, y: 440 }, { x: 362, y: 424 }, { x: 600, y: 424 }, { x: 842, y: 440 }];
const ST = { screen: 'under', p: 1, mode: 'day', ents: null, defs: {}, floats: [], sparks: [], cam: { x: 0, tx: 0 }, camMem: { surface: 240, under: 0 }, viewW: W, ox: 0, fm: 1, fire: {}, sanfx: {}, shake: 0, flash: 0, speed: 1, skip: false, label: '', hud: null, hover: null, focus: null, march: null };
const now = () => performance.now();
function rect(x, col, a, b, w, h) { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); }
function txt(x, s, px, py, col, size, align) { const z = size || 13, sz = z <= 20 ? Math.round(z * ST.fm) : z; x.font = sz + 'px "Do Hyeon", "Malgun Gothic", sans-serif'; x.textAlign = align || 'left'; x.textBaseline = 'top'; x.fillStyle = '#0b0c16'; x.fillText(s, px + 1, py + 1); x.fillStyle = col || '#ece6d6'; x.fillText(s, px, py); }
function plate(x, s, cx, y, col, size) { const z = Math.round((size || 13) * ST.fm); x.font = z + 'px "Do Hyeon", "Malgun Gothic", sans-serif'; const w = x.measureText(s).width + 10; rect(x, '#0b0c16bb', cx - w / 2, y - 2, w, z + 6); txt(x, s, cx, y, col, size, 'center'); }
function camTo(lx, snap) { if (!snap && ST.mode === 'night' && ST.camHold > now()) return; const max = Math.max(0, W - ST.viewW); ST.cam.tx = Math.max(0, Math.min(max, lx - ST.viewW / 2)); if (snap === true) ST.cam.x = ST.cam.tx; }
function villState(v) { const s = G.vill[v]; return s.razed ? '폐허' : s.tribute ? '공물 중' : s.host >= 50 ? '보복 준비' : s.host >= 15 ? '수상히 여김' : '평온'; }
function slimeScale(sl) { return [2.5, 3.5, 4.5, 5.5, 6.5][sl.stage]; }
function defPos(loc, k, small) {
  const r = cellRect(locIdx(loc)), fy = floorY(r), sz = small ? 16 : 32;
  if (loc === 'core') return { x: r.x + 68 - (k % 3) * 24, y: fy - sz + 2 - Math.floor(k / 3) * 20 };
  return { x: r.x + r.w - 14 - 32 - (k % 4) * 26 + (small ? 8 : 0), y: fy - sz + 2 - Math.floor(k / 4) * 24 };
}
const invPos = (r, j) => ({ x: r.x + 8 + (j % 4) * 20, y: floorY(r) - 30 - (Math.floor(j / 4) % 3) * 22 });

// ---------- 지하 ----------
function drawRoom(x, c, i, r, t) {
  const fy = floorY(r), type = c.type, mx = r.x + r.w / 2, firing = ST.fire[i] && t - ST.fire[i] < 320, main = G.slime.main;
  if (c.zone && main) { rect(x, ASPCOL[main] + '66', r.x + 8, fy - 3, r.w - 16, 6); for (let k = 0; k < 4; k++) rect(x, ASPCOL[main] + 'aa', r.x + 20 + k * 40 + Math.sin(t / 300 + k) * 4, fy - 8, 3, 3); }
  c.traps.forEach((tr, k) => {
    const bx = r.x + 16 + k * 62;
    if (tr.kind === 'spike') { x.fillStyle = '#cfd3e6'; for (let n = 0; n < 4; n++) { const h = firing ? 28 : 7; x.beginPath(); x.moveTo(bx + n * 11, fy); x.lineTo(bx + n * 11 + 5, fy - h); x.lineTo(bx + n * 11 + 10, fy); x.fill(); } }
    if (tr.kind === 'rock') { x.fillStyle = '#8a8296'; x.beginPath(); x.arc(bx + 22, firing ? fy - 14 : r.y + 34, 12, 0, 7); x.fill(); }
    if (tr.kind === 'acid') rect(x, '#8fe05a', bx, fy - 4, 44, 5);
    if (tr.kind === 'mist') for (let n = 0; n < 3; n++) rect(x, firing ? '#d0a8ffcc' : '#a884ff66', bx + n * 14 + Math.sin(t / 400 + n) * 3, fy - 16 - n * 6, 12, 6);
    for (let l = 0; l < tr.lv; l++) rect(x, '#e8c030', bx + l * 7, fy + 6, 4, 4);
  });
  const banner = (bx, col) => { rect(x, '#2a2438', bx, r.y + 26, 3, 36); rect(x, col, bx + 3, r.y + 28, 16, 22); };
  if (type === 'post') banner(r.x + r.w - 30, '#5b9bff');
  if (type === 'hall') { banner(r.x + r.w - 30, '#ff5f57'); banner(r.x + r.w - 56, '#ff5f57'); }
  if (type === 'bighall') { banner(r.x + r.w - 30, '#e8c030'); banner(r.x + r.w - 56, '#ff5f57'); banner(r.x + r.w - 82, '#e8c030'); }
  if (type === 'ambush') { banner(r.x + r.w - 30, '#6fd08c'); rect(x, '#2f6b3a', r.x + r.w - 96, fy - 18, 34, 18); }
  if (type === 'decoy') { rect(x, '#8a6a1c', mx - 18, fy - 22, 36, 22); rect(x, '#e8c030', mx - 18, fy - 26, 36, 7); }
  if (type === 'shop') { rect(x, '#7a5a3a', mx - 28, fy - 30, 56, 30); for (let n = 0; n < 4; n++) rect(x, n % 2 ? '#f5f5f5' : '#ff5f57', mx - 28 + n * 14, fy - 42, 14, 12); }
  if (type === 'prison') { rect(x, '#1a1626', mx - 34, fy - 50, 68, 50); for (let n = 0; n < 7; n++) rect(x, '#8a8296', mx - 32 + n * 11, fy - 50, 3, 50); const n = Math.min(4, G.prison.length); for (let k = 0; k < n; k++) rect(x, '#e8b890', mx - 24 + k * 14, fy - 16, 8, 8); }
  if (type === 'chapel') { rect(x, '#8a8296', mx - 18, fy - 16, 36, 16); x.strokeStyle = '#e8c030'; x.lineWidth = 3; x.beginPath(); x.ellipse(mx, fy - 32, 13, 8, 0, 0, 7); x.stroke(); rect(x, '#c8a8ff', mx - 3, fy - 35, 6, 6); rect(x, Math.sin(t / 150) > 0 ? '#ffd23a' : '#ff9a3a', mx + 20, fy - 26, 4, 8); rect(x, Math.sin(t / 170) > 0 ? '#ffd23a' : '#ff9a3a', mx - 24, fy - 26, 4, 8); }
  if (type === 'ritual') { x.strokeStyle = '#c8303a'; x.lineWidth = 2; x.beginPath(); x.ellipse(mx, fy - 2, 34, 6, 0, 0, 7); x.stroke(); rect(x, '#c8303a', mx - 2, fy - 30 + Math.sin(t / 200) * 2, 4, 14); }
  if (type === 'persuade') { rect(x, '#5a4630', mx - 8, fy - 22, 16, 22); rect(x, '#5a4630', mx - 8, fy - 36, 4, 14); rect(x, '#ffd23a', mx + 24, r.y + 24, 8, 8); rect(x, '#2a2438', mx + 27, r.y + 6, 2, 18); }
  if (type === 'altar') { rect(x, '#8a8296', mx - 18, fy - 20, 36, 20); rect(x, ASPCOL[main || G.startAsp], mx - 5, fy - 40 - Math.sin(t / 150) * 3, 10, 14); }
  if (type === 'pool') { rect(x, '#3fb8d0', r.x + 30, fy - 5 + Math.sin(t / 250) * 1.5, r.w - 60, 9); rect(x, '#9fe8f0', r.x + 50 + (t / 30 % 60), fy - 4, 10, 2); }
  if (type === 'sluice') { rect(x, '#5a6a8a', mx - 6, r.y + 8, 12, fy - r.y - 8); rect(x, '#3fb8d0', mx - 30, fy - 6, 60, 6); rect(x, '#e8c030', mx - 10, r.y + 30, 20, 6); }
  if (type === 'library') { for (let n = 0; n < 3; n++) { rect(x, '#5a4630', mx - 40, fy - 20 - n * 20, 80, 4); for (let k = 0; k < 8; k++) rect(x, ['#a884ff', '#e8c030', '#5b9bff', '#c8303a'][(k + n) % 4], mx - 38 + k * 10, fy - 34 - n * 20, 7, 14); } }
  if (type === 'warp') { x.strokeStyle = '#a884ff'; x.lineWidth = 3; for (let n = 0; n < 3; n++) { x.beginPath(); x.arc(mx, fy - 34, 8 + n * 9, t / 300 + n, t / 300 + n + 4); x.stroke(); } }
  if (type === 'hatchery') for (let n = 0; n < 4; n++) { x.fillStyle = n % 2 ? '#d0f08a' : '#f0e8c0'; x.beginPath(); x.ellipse(mx - 30 + n * 20, fy - 9 - (Math.sin(t / 300 + n) > 0.9 ? 2 : 0), 7, 10, 0, 0, 7); x.fill(); }
  if (type === 'fleshwall') { rect(x, '#b85a6a', mx - 12, r.y + 8, 24, fy - r.y - 8); for (let n = 0; n < 4; n++) rect(x, '#e89aa8', mx - 8 + (n % 2) * 8, r.y + 16 + n * 20 + Math.sin(t / 300 + n) * 2, 6, 6); }
  if (type === 'stage') { rect(x, '#7a121c', r.x + 10, r.y + 8, 22, fy - r.y - 8); rect(x, '#7a121c', r.x + r.w - 32, r.y + 8, 22, fy - r.y - 8); rect(x, '#c8303a', r.x + 10, r.y + 8, r.w - 20, 10); rect(x, '#5a4630', r.x + 30, fy - 6, r.w - 60, 6); }
  if (type === 'mirror') { rect(x, '#e8c030', mx - 16, fy - 56, 32, 50); rect(x, '#b6ecff', mx - 13, fy - 53, 26, 44); rect(x, '#ffffff', mx - 9, fy - 48, 4, 14); }
  if (type === 'abattoir') { rect(x, '#8a8296', r.x + 20, r.y + 16, r.w - 40, 3); for (let n = 0; n < 4; n++) { rect(x, '#d0d0d8', r.x + 34 + n * 34, r.y + 19, 2, 14); rect(x, '#b8303a', r.x + 29 + n * 34, r.y + 33, 12, 18); } }
  if (type === 'table') { rect(x, '#7a5a3a', mx - 40, fy - 20, 80, 6); rect(x, '#5a4630', mx - 36, fy - 14, 5, 14); rect(x, '#5a4630', mx + 31, fy - 14, 5, 14); for (let n = 0; n < 3; n++) rect(x, '#f5f5f5', mx - 28 + n * 24, fy - 25, 12, 5); }

  if (type === 'core') {   // 본체는 재물 더미를 깔고 앉아 있다
    const n = Math.min(12, Math.ceil(Math.max(0, ST.hud ? ST.hud.gold : G.gold) / (100 * NEST.cm(G)))), cx = r.x + r.w - 60, rows = [6, 4, 2]; let k = 0;
    rows.forEach((w, row) => { for (let j = 0; j < w && k < n; j++, k++) { const bx = Math.round(cx - w * 9 + j * 18), by = fy - 9 - row * 8; rect(x, '#8a6a1c', bx, by, 16, 9); rect(x, '#e8c030', bx + 1, by, 14, 7); rect(x, '#fff3a0', bx + 3, by + 1, 5, 2); } });
  }
  if (type === 'core') { x.fillStyle = (main ? ASPCOL[main] : '#9fb8a8') + '33'; x.beginPath(); x.ellipse(r.x + r.w - 60, fy, 56 + Math.sin(t / 500) * 4, 12, 0, 0, 7); x.fill(); }
  for (let l = 1; l < c.lv; l++) rect(x, '#f5f5f5', r.x + r.w - 14 - (l - 1) * 7, r.y + 10, 4, 4);
}
function drawCell(x, i, t, canDig) {
  const c = G.cells[i], r = cellRect(i), th = THEME[G.slime.main || 'base'];
  if (!c.dug) {
    rect(x, '#1e1929', r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    for (let k = 0; k < 5; k++) rect(x, '#2a2338', r.x + 14 + ((i * 53 + k * 37) % (r.w - 30)), r.y + 12 + ((i * 29 + k * 41) % (r.h - 26)), 8, 5);
    if (canDig && G.buried && G.buried[i]) { for (let k = 0; k < 3; k++) rect(x, Math.sin(t / 200 + k * 2) > 0.3 ? '#fff3a0' : '#e8c03066', r.x + 40 + k * 46, r.y + 26 + (k % 2) * 60, 4, 4); txt(x, '무언가 묻혀 있다', r.x + r.w / 2, r.y + r.h - 34, '#fff3a0', 12, 'center'); }
    if (canDig) { x.strokeStyle = '#e8c03088'; x.lineWidth = 2; x.setLineDash([6, 6]); x.strokeRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16); x.setLineDash([]); txt(x, '+ 파기', r.x + r.w / 2, r.y + r.h / 2 - 8, '#e8c030aa', 15, 'center'); }
    return;
  }
  const fy = floorY(r);
  rect(x, th.wall, r.x + 4, r.y + 4, r.w - 8, r.h - 8); rect(x, th.floor, r.x + 4, fy, r.w - 8, r.y + r.h - 4 - fy);
  const right = i % 5 < 4 && G.cells[i + 1].dug, down = i + 5 < NEST.N && G.cells[i + 5].dug;
  if (right) { rect(x, th.wall, r.x + r.w - 4, fy - 46, 8, 46); rect(x, th.floor, r.x + r.w - 4, fy, 8, r.y + r.h - 4 - fy); }
  if (down) { rect(x, th.wall, r.x + r.w / 2 - 16, r.y + r.h - 4, 32, 8); rect(x, '#7a5a3a', r.x + r.w / 2 - 10, fy - 4, 3, 46); rect(x, '#7a5a3a', r.x + r.w / 2 + 7, fy - 4, 3, 46); for (let k = 0; k < 5; k++) rect(x, '#7a5a3a', r.x + r.w / 2 - 10, fy + k * 9, 20, 2); }
  drawRoom(x, c, i, r, t);
  if (c.block) { for (let k = 0; k < 6; k++) rect(x, k % 2 ? '#5a5266' : '#6a6278', r.x + 20 + k * 24, fy - 18 - (k % 3) * 10, 30, 22 + (k % 3) * 10); txt(x, '막힘', r.x + r.w / 2, r.y + 40, '#ff9a92', 15, 'center'); }
  if (G.off[i]) { rect(x, '#0b0c16aa', r.x + 4, r.y + 4, r.w - 8, r.h - 8); txt(x, '뒤집힘', r.x + r.w / 2, r.y + 40, '#ff9a92', 14, 'center'); }
  if (ST.sanfx[i] && t - ST.sanfx[i] < 380) rect(x, '#a884ff44', r.x + 4, r.y + 4, r.w - 8, r.h - 8);
  const d = NEST.ROOM[c.type]; let name = i === NEST.ENT && c.type === 'empty' ? '입구' : d.name;
  if (i === NEST.ENT && c.type !== 'empty') name = '입구 · ' + name;
  if (d.def && i !== NEST.CORE) name += ' ' + G.kin.filter(m => m.loc === i && m.kind !== 'spawn').length + '/' + d.def;
  txt(x, name, r.x + 10, r.y + 8, c.type === 'empty' ? '#a2a8c6' : '#ece6d6', 13);
}
function drawRoute(x, t) {
  const ps = NEST.paths(G); x.fillStyle = '#e8c030';
  ps.forEach(p => { for (let k = 0; k < p.length - 1; k++) { const a = cellRect(p[k]), b = cellRect(p[k + 1]), ax = a.x + a.w / 2, ay = floorY(a) + 8, bx = b.x + b.w / 2, by = floorY(b) + 8, n = 6; for (let s = 0; s < n; s++) { const f = (s + (t / 600) % 1) / n; x.globalAlpha = 0.55; x.fillRect(Math.round(ax + (bx - ax) * f) - 2, Math.round(ay + (by - ay) * f) - 2, 4, 4); } } });
  x.globalAlpha = 1;
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
  rect(x, '#16121f', 0, 0, W, H); rect(x, '#2f6b3a', 0, 0, W, 10); rect(x, '#4a3a2a', 0, 10, W, 8);
  const er = cellRect(NEST.ENT); rect(x, '#0b0c16', er.x + 28, 0, 40, GY + 6); rect(x, '#7a5a3a', er.x + 34, 0, 3, GY + 60); rect(x, '#7a5a3a', er.x + 59, 0, 3, GY + 60); for (let k = 0; k < 11; k++) rect(x, '#7a5a3a', er.x + 34, 4 + k * 10, 28, 2);
  txt(x, TOUCH ? '▲ 지상' : '▲ 지상 (Tab)', er.x + 78, 22, '#a2a8c6', 13);
  const day = ST.mode === 'day';
  for (let i = 0; i < NEST.N; i++) drawCell(x, i, t, day && !G.cells[i].dug && !NEST.canDig(G, i));
  drawRoute(x, t);
  if (ST.ents) { const es = Object.values(ST.ents); es.filter(e => e.side === 'def').forEach(e => drawUnit(x, e, t)); es.filter(e => e.side === 'inv').forEach(e => drawUnit(x, e, t)); }
  else {
    const by = {}; G.kin.forEach(m => { if (m.loc !== null) (by[m.loc] = by[m.loc] || []).push(m); });
    for (const loc in by) by[loc].forEach((m, k) => { const sm = m.kind === 'spawn', p = defPos(loc === 'core' ? 'core' : +loc, k, sm); x.globalAlpha = m.hurt || m.strike ? 0.4 : 1; x.drawImage(frameOf(kinCanvas(m.kind, m.evo), Math.floor(t / 420 + m.id * 0.37) % 2), p.x - (m.evo ? 5 : 0), Math.round(p.y + Math.sin(t / 500 + m.id) * 1) - (m.evo ? 10 : 0), sm ? (m.evo ? 26 : 16) : m.evo ? 42 : 32, sm ? (m.evo ? 26 : 16) : m.evo ? 42 : 32); x.globalAlpha = 1; if (m.hurt) txt(x, '부상', p.x + 16, p.y - 14, '#ff9a92', 11, 'center'); else if (m.strike) txt(x, '파업', p.x + 16, p.y - 14, '#ffb347', 11, 'center'); });
    const r = cellRect(NEST.CORE), sc = slimeScale(G.slime), size = 16 * sc; x.drawImage(slimeCanvas(G.slime, Math.floor(t / 240)), r.x + r.w - 14 - size, Math.round(floorY(r) - size + sc + Math.sin(t / 400) * 2), size, size);
    const hp = G.slime.hp / NEST.slimeStats(G).hp; if (hp < 0.999) { rect(x, '#0b0c16', r.x + r.w - 15 - size, floorY(r) - size - 9, size + 2, 6); rect(x, '#6fd08c', r.x + r.w - 14 - size, floorY(r) - size - 8, size * hp, 4); }
  }
  ST.sparks = ST.sparks.filter(s => t - s.t0 < s.dur); ST.sparks.forEach(s => { const k = (t - s.t0) / s.dur; x.globalAlpha = 1 - k; if (s.fx) drawFx(x, s, k); else if (s.ring) { x.strokeStyle = s.col; x.lineWidth = 2; x.beginPath(); x.arc(s.x, s.y, 6 + k * 18, 0, 7); x.stroke(); } else for (let n = 0; n < 6; n++) { const a = n * 1.047 + s.rot, r0 = 4 + k * 6, r1 = 9 + k * 16; x.strokeStyle = s.col; x.lineWidth = 2; x.beginPath(); x.moveTo(s.x + Math.cos(a) * r0, s.y + Math.sin(a) * r0); x.lineTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1); x.stroke(); } x.globalAlpha = 1; });
  const mark = (loc, col) => { const r = cellRect(locIdx(loc)); x.strokeStyle = col; x.lineWidth = 3; x.strokeRect(r.x + 3.5, r.y + 3.5, r.w - 7, r.h - 7); };
  if (day && ST.hover && ST.hover.t === 'cell' && !(UI.sel && UI.sel.t === 'cell' && UI.sel.i === ST.hover.i)) mark(ST.hover.i, '#ece6d666');
  if (day && UI.sel && UI.sel.t === 'cell') mark(UI.sel.i, '#e8c030');
  if (ST.tutCell != null && day) { const r = cellRect(ST.tutCell), up = Math.floor(t / 300) % 2; mark(ST.tutCell, up ? '#e8c030' : '#fff3a0'); plate(x, '▼ 여기', r.x + r.w / 2, r.y + 22 + up * 4, '#fff3a0', 15); }
  if (ST.focus != null) mark(ST.focus, Math.floor(t / 250) % 2 ? '#ff5f57' : '#fff3a0');
}

// ---------- 지상 ----------
function pathPoint(v, f) { const a = VPOS[v], b = PPOS[NEST.VILL[v].plot], c = CAVE; if (f < 0.5) { const k = f / 0.5; return { x: a.x + (b.x - a.x) * k, y: a.y + 34 + (b.y - a.y - 34) * k }; } const k = (f - 0.5) / 0.5; return { x: b.x + (c.x - b.x) * k, y: b.y + (c.y - b.y) * k }; }
function drawParty(x, t, est, f, label, col) {
  const p = pathPoint(est.vill, f), n = Math.min(7, est.count);
  for (let k = 0; k < n; k++) { const kind = est.kinds ? est.kinds[k % est.kinds.length] : 'shade'; x.drawImage(kind === 'shade' ? spriteCanvas('human', 'shade') : invCanvas(kind), Math.round(p.x - n * 9 + k * 18), Math.round(p.y - 30 + Math.sin(t / 200 + k) * 2), 32, 32); }
  if (label) { const s = label + ' · ' + NEST.GRADE_NAME[est.grade] + ' ' + (est.kinds ? '' : '약 ') + est.count + '명'; const z = Math.round(14 * ST.fm); x.font = z + 'px "Do Hyeon", sans-serif'; const w = x.measureText(s).width + 14; rect(x, '#0b0c16cc', p.x - w / 2, p.y - 42 - z, w, z + 8); rect(x, col, p.x - w / 2, p.y - 42 - z, 4, z + 8); txt(x, s, p.x + 2, p.y - 38 - z, '#ece6d6', 14, 'center'); }
}
function drawVillage(x, v, p, t, night) {
  const win = night ? '#ffd23a' : '#5a4630', wall = '#e8dcc0';
  const house = (ox, oy, w, h, roof) => { rect(x, wall, p.x + ox, p.y + oy, w, h); x.fillStyle = roof; x.beginPath(); x.moveTo(p.x + ox - 3, p.y + oy); x.lineTo(p.x + ox + w / 2, p.y + oy - h * 0.7); x.lineTo(p.x + ox + w + 3, p.y + oy); x.fill(); rect(x, win, p.x + ox + w / 2 - 3, p.y + oy + h - 9, 6, 9); };
  if (v === 'gaet') { // 갯마을: 물 위의 수상 가옥과 배
    rect(x, night ? '#1f4a6a' : '#4f9fd0', p.x - 44, p.y + 14, 100, 14); for (let k = 0; k < 4; k++) rect(x, '#d8f6ff88', p.x - 38 + k * 26 + Math.sin(t / 400 + k) * 4, p.y + 18 + (k % 2) * 5, 10, 2);
    [[-30, -8], [6, -14]].forEach(([ox, oy]) => { rect(x, '#5a4630', p.x + ox + 2, p.y + oy + 16, 3, 12); rect(x, '#5a4630', p.x + ox + 19, p.y + oy + 16, 3, 12); house(ox, oy, 24, 16, '#3fb8d0'); });
    rect(x, '#7a5a3a', p.x + 36, p.y + 8, 22, 4); const bx = p.x + 40 + Math.sin(t / 700) * 3; rect(x, '#8a6a3a', bx, p.y + 18, 20, 5); rect(x, '#f5f5f5', bx + 8, p.y + 4, 2, 14); x.fillStyle = '#f5f5f5'; x.beginPath(); x.moveTo(bx + 10, p.y + 5); x.lineTo(bx + 20, p.y + 15); x.lineTo(bx + 10, p.y + 15); x.fill();
  } else if (v === 'field') { // 너른들: 초가와 풍차, 밭고랑
    for (let k = 0; k < 4; k++) rect(x, k % 2 ? '#c8b050' : '#8fb04f', p.x - 44 + k * 4, p.y + 18 + k * 3, 96 - k * 8, 3);
    house(-34, 0, 24, 16, '#d8b850'); house(-4, 4, 22, 14, '#d8b850');
    rect(x, '#b8a888', p.x + 30, p.y - 20, 14, 38); x.fillStyle = '#8a6a3a'; x.beginPath(); x.moveTo(p.x + 27, p.y - 20); x.lineTo(p.x + 37, p.y - 32); x.lineTo(p.x + 47, p.y - 20); x.fill();
    x.save(); x.translate(p.x + 37, p.y - 18); x.rotate(t / 900); for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 2); rect(x, '#f5f5f5', -2, 2, 4, 20); rect(x, '#d8d0c0', 2, 6, 5, 14); } x.restore();
  } else if (v === 'bell') { // 종탑 마을: 높은 종탑
    house(-36, 2, 22, 16, '#f0a04a'); house(20, 4, 22, 14, '#f0a04a');
    rect(x, '#9a94a8', p.x - 8, p.y - 46, 20, 64); rect(x, '#6a6478', p.x - 8, p.y - 46, 20, 4); x.fillStyle = '#f0a04a'; x.beginPath(); x.moveTo(p.x - 12, p.y - 46); x.lineTo(p.x + 2, p.y - 66); x.lineTo(p.x + 16, p.y - 46); x.fill();
    rect(x, '#2a2438', p.x - 4, p.y - 40, 12, 14); rect(x, '#e8c030', p.x - 1 + Math.sin(t / 300) * 3, p.y - 37, 6, 8); rect(x, win, p.x - 1, p.y + 6, 6, 12);
  } else if (v === 'school') { // 학술원 마을: 둥근 지붕과 기둥
    rect(x, '#d8d0e8', p.x - 30, p.y - 6, 60, 24); for (let k = 0; k < 5; k++) rect(x, '#f5f0ff', p.x - 26 + k * 13, p.y - 2, 4, 20); rect(x, '#b8a8d8', p.x - 34, p.y - 10, 68, 5);
    x.fillStyle = '#a884ff'; x.beginPath(); x.arc(p.x, p.y - 10, 20, Math.PI, 0); x.fill(); rect(x, '#e8c030', p.x - 1, p.y - 38, 2, 9); rect(x, win, p.x - 4, p.y + 6, 8, 12);
    rect(x, '#d8d0e8', p.x + 36, p.y - 14, 12, 32); x.fillStyle = '#6a5a9a'; x.beginPath(); x.arc(p.x + 42, p.y - 14, 8, Math.PI, 0); x.fill(); rect(x, '#fff3a0', p.x + 46, p.y - 22, 8, 2);
  } else { // 병영 도시: 성벽과 탑
    rect(x, '#8a8698', p.x - 36, p.y - 6, 78, 26); for (let k = 0; k < 7; k++) rect(x, '#8a8698', p.x - 36 + k * 12, p.y - 12, 7, 6);
    [[-44, -26], [34, -26]].forEach(([ox, oy], k) => { rect(x, '#9a96a8', p.x + ox, p.y + oy, 18, 46); for (let n = 0; n < 3; n++) rect(x, '#9a96a8', p.x + ox - 1 + n * 7, p.y + oy - 6, 5, 6); rect(x, '#2a2438', p.x + ox + 7, p.y + oy + 12, 4, 9); rect(x, '#5a4630', p.x + ox + 8, p.y + oy - 22, 2, 16); x.fillStyle = '#e8505a'; x.beginPath(); x.moveTo(p.x + ox + 10, p.y + oy - 22); x.lineTo(p.x + ox + 22 + Math.sin(t / 200 + k) * 2, p.y + oy - 18); x.lineTo(p.x + ox + 10, p.y + oy - 14); x.fill(); });
    rect(x, '#b0acc0', p.x - 10, p.y - 22, 26, 20); x.fillStyle = '#e8505a'; x.beginPath(); x.moveTo(p.x - 13, p.y - 22); x.lineTo(p.x + 3, p.y - 36); x.lineTo(p.x + 19, p.y - 22); x.fill(); rect(x, win, p.x, p.y - 16, 5, 7);
    x.fillStyle = '#3a2a20'; x.beginPath(); x.arc(p.x + 3, p.y + 20, 9, Math.PI, 0); x.fill(); rect(x, '#3a2a20', p.x - 6, p.y + 12, 18, 8); for (let n = 0; n < 3; n++) rect(x, '#6a6478', p.x - 4 + n * 6, p.y + 6, 2, 14);
  }
}
function drawSurface(x, t) {
  const night = ST.mode === 'night', g = x.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, night ? '#0e1230' : '#5fa0e0'); g.addColorStop(1, night ? '#2a2a5a' : '#c8e4f0'); x.fillStyle = g; x.fillRect(0, 0, W, 270);
  if (night) for (let k = 0; k < 40; k++) rect(x, k % 7 ? '#ffffff' : '#fff3a0', (k * 97) % W, (k * 53) % 200, 2, 2); else { rect(x, '#fff3a0', 820, 40, 34, 34); for (let k = 0; k < 3; k++) rect(x, '#ffffffcc', (k * 330 + t / 60) % (W + 120) - 120, 30 + k * 34, 90, 14); }
  if (G.eld && G.day >= NEST.OMEN_DAY) { // 하늘에서 지켜보는 옛 것
    const c = ASPCOL[G.eld.id], f = G.eld.favor, ex = 150, ey = 62, open = Math.sin(t / 900) > -0.92; x.globalAlpha = night ? 0.9 : 0.5;
    x.strokeStyle = c; x.lineWidth = 3; x.beginPath(); x.ellipse(ex, ey, 44, open ? 18 : 3, 0, 0, 7); x.stroke();
    if (open) { x.fillStyle = f <= -2 ? '#ff5f57' : c; x.beginPath(); x.arc(ex + Math.sin(t / 1400) * 10, ey, 9, 0, 7); x.fill(); rect(x, '#0b0c16', ex + Math.sin(t / 1400) * 10 - 2, ey - 6, 4, 12); }
    if (f >= 2) for (let k = 0; k < 6; k++) rect(x, '#fff3a0', ex + Math.cos(k * 1.05 + t / 800) * 58 - 2, ey + Math.sin(k * 1.05 + t / 800) * 28 - 2, 4, 4);
    x.globalAlpha = 1; plate(x, '「' + NEST.ELDER[G.eld.id].name + '」', ex, ey + 30, c, 12);
  }
  x.fillStyle = night ? '#1a2a3a' : '#5a8a6a'; x.beginPath(); x.moveTo(0, 270); for (let k = 0; k <= 8; k++) x.lineTo(k * 120, 200 - (k % 2 ? 44 : 10) - (k % 3) * 8); x.lineTo(W, 270); x.fill();
  rect(x, night ? '#1f3a2f' : '#3f7a45', 0, 250, W, H - 250); for (let k = 0; k < 40; k++) rect(x, night ? '#274a3a' : '#4f8f55', (k * 131) % W, 262 + (k * 71) % 270, 10, 4);
  // 길
  x.fillStyle = night ? '#6a6050' : '#c8b890';
  NEST.VIDS.forEach(v => { for (let s = 0; s <= 40; s++) { const p = pathPoint(v, s / 40); x.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 5, 4); } });
  // 마을
  NEST.VIDS.forEach(v => {
    const p = VPOS[v], d = NEST.VILL[v], s = G.vill[v], sel = UI.sel && UI.sel.t === 'vill' && UI.sel.v === v, hov = ST.hover && ST.hover.t === 'vill' && ST.hover.v === v;
    if (s.razed) { for (let k = 0; k < 5; k++) rect(x, '#4a4a58', p.x - 34 + k * 14, p.y + 8 - (k % 2) * 8, 12, 10 + (k % 2) * 8); for (let k = 0; k < 3; k++) rect(x, '#8a829688', p.x - 10 + k * 8 + Math.sin(t / 300 + k) * 4, p.y - 20 - ((t / 40 + k * 20) % 40), 8, 8); }
    else drawVillage(x, v, p, t, night);
    if (sel || hov) { x.strokeStyle = sel ? '#e8c030' : '#ece6d688'; x.lineWidth = 3; x.strokeRect(p.x - 46.5, p.y - 28.5, 106, 62); }
    const stt = villState(v); plate(x, d.name + ' · ' + stt + (stt === '평온' && G.vill[v].trust ? ' ' + '●'.repeat(G.vill[v].trust) : ''), p.x + 6, p.y + 32, stt === '평온' ? '#ece6d6' : stt === '공물 중' ? '#e8c030' : stt === '폐허' ? '#a2a8c6' : '#ff9a92', 14);
    if (!s.razed) { rect(x, '#0b0c16', p.x - 25, p.y + 55, 62, 6); rect(x, '#ff5f57', p.x - 24, p.y + 56, 60 * Math.min(1, s.host / 100), 4); }
  });
  // 길목
  PPOS.forEach((p, k) => {
    const type = G.plots[k], sel = UI.sel && UI.sel.t === 'plot' && UI.sel.p === k, hov = ST.hover && ST.hover.t === 'plot' && ST.hover.p === k;
    x.fillStyle = night ? '#4a4438' : '#a89870'; x.beginPath(); x.ellipse(p.x, p.y, 40, 16, 0, 0, 7); x.fill();
    if (type === 'bramble') { x.strokeStyle = '#9c2a1c'; x.lineWidth = 3; for (let n = 0; n < 7; n++) { x.beginPath(); x.moveTo(p.x - 30 + n * 10, p.y + 4); x.lineTo(p.x - 24 + n * 10, p.y - 18); x.stroke(); } }
    if (type === 'camp') { x.fillStyle = '#c8a050'; x.beginPath(); x.moveTo(p.x - 22, p.y + 4); x.lineTo(p.x, p.y - 26); x.lineTo(p.x + 22, p.y + 4); x.fill(); rect(x, Math.sin(t / 120) > 0 ? '#ffb347' : '#ff7a2f', p.x + 26, p.y - 8, 8, 10); }
    if (type === 'tower') { rect(x, '#7a5a3a', p.x - 8, p.y - 44, 16, 48); rect(x, '#5a4630', p.x - 14, p.y - 54, 28, 12); rect(x, '#ffd23a', p.x - 3, p.y - 50, 6, 5); }
    if (type === 'garden') for (let n = 0; n < 8; n++) { rect(x, '#5a4630', p.x - 30 + (n % 4) * 16, p.y - 8 + Math.floor(n / 4) * 10, 12, 4); rect(x, '#8fe05a', p.x - 26 + (n % 4) * 16, p.y - 13 + Math.floor(n / 4) * 10, 4, 6); }
    if (sel || hov) { x.strokeStyle = sel ? '#e8c030' : '#ece6d688'; x.lineWidth = 3; x.beginPath(); x.ellipse(p.x, p.y, 46, 22, 0, 0, 7); x.stroke(); }
    plate(x, '길목 ' + (k + 1) + (type !== 'none' ? ' · ' + NEST.PLOT[type].name : ''), p.x, p.y + 22, type === 'none' ? '#a2a8c6' : '#ece6d6', 13);
  });
  // 둥지 입구
  x.fillStyle = '#4a4a58'; x.beginPath(); x.ellipse(CAVE.x, CAVE.y + 6, 74, 46, 0, Math.PI, 0); x.fill(); x.fillStyle = '#0b0c16'; x.beginPath(); x.ellipse(CAVE.x, CAVE.y + 6, 50, 32, 0, Math.PI, 0); x.fill();
  const eye = Math.sin(t / 700) > -0.8; if (eye) { const c = G.slime.main ? ASPCOL[G.slime.main] : '#dff0e0'; rect(x, c, CAVE.x - 12, CAVE.y - 12, 6, 4); rect(x, c, CAVE.x + 6, CAVE.y - 12, 6, 4); }
  plate(x, TOUCH ? '▼ 둥지' : '▼ 둥지 (Tab)', CAVE.x, CAVE.y + 16, '#ece6d6', 14);
  if (G.guest && !night) { rect(x, Math.sin(t / 150) > 0 ? '#ffd23a' : '#ffb347', CAVE.x + 58, CAVE.y - 30, 6, 8); rect(x, '#5a4630', CAVE.x + 60, CAVE.y - 22, 2, 22); plate(x, '오늘 밤 손님 · ' + NEST.GUEST[G.guest.type].name, CAVE.x, CAVE.y - 66, '#e8c030', 14); }
  // 지상에 나타난 것
  if (G.spot && !night) {
    const p = SPOS[G.spot.pos], ty = G.spot.type, sel = UI.sel && UI.sel.t === 'spot', hov = ST.hover && ST.hover.t === 'spot', fl = Math.sin(t / 120) > 0;
    x.fillStyle = '#0b0c1655'; x.beginPath(); x.ellipse(p.x, p.y + 6, 36, 12, 0, 0, 7); x.fill();
    if (ty === 'meteor') { x.fillStyle = '#3a2a20'; x.beginPath(); x.ellipse(p.x, p.y, 26, 10, 0, 0, 7); x.fill(); rect(x, fl ? '#fff3a0' : '#c8a8ff', p.x - 4, p.y - 6, 8, 8); rect(x, '#ffffff', p.x - 1, p.y - 14 - (t / 40 % 10), 2, 4); }
    if (ty === 'shrine') { rect(x, '#8a8296', p.x - 18, p.y - 12, 36, 14); rect(x, '#6a6278', p.x - 12, p.y - 30, 8, 18); rect(x, '#6a6278', p.x + 4, p.y - 30, 8, 18); rect(x, '#8a8296', p.x - 16, p.y - 36, 32, 7); rect(x, '#4f8f55', p.x - 20, p.y - 2, 10, 5); }
    if (ty === 'band') { rect(x, fl ? '#ffb347' : '#ff7a2f', p.x - 4, p.y - 12, 8, 12); x.drawImage(spriteCanvas('goblin', 'goblin'), p.x - 40, p.y - 30, 32, 32); x.drawImage(spriteCanvas('skeleton', 'skeleton'), p.x + 8, p.y - 30, 32, 32); }
    if (ty === 'cart') { rect(x, '#7a5a3a', p.x - 24, p.y - 18, 44, 16); rect(x, '#c8a050', p.x - 20, p.y - 28, 16, 10); rect(x, '#e8dcc0', p.x, p.y - 26, 14, 8); x.fillStyle = '#3a2a20'; x.beginPath(); x.arc(p.x + 22, p.y - 20, 9, 0, 7); x.fill(); rect(x, '#7a5a3a', p.x + 20, p.y - 22, 4, 4); }
    if (ty === 'camp') { x.fillStyle = '#8a6a3a'; x.beginPath(); x.moveTo(p.x - 30, p.y); x.lineTo(p.x - 10, p.y - 28); x.lineTo(p.x + 10, p.y); x.fill(); rect(x, fl ? '#ffb347' : '#ff7a2f', p.x + 16, p.y - 10, 8, 10); x.drawImage(spriteCanvas('human', 'militia'), p.x + 22, p.y - 30, 32, 32); }
    if (sel || hov) { x.strokeStyle = sel ? '#e8c030' : '#ece6d688'; x.lineWidth = 3; x.beginPath(); x.ellipse(p.x, p.y - 8, 48, 34, 0, 0, 7); x.stroke(); }
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
  if (ST.flash > t) rect(x, '#ffffff55', 0, 0, VW + 1, H);
  if (max > 1 && ST.mode === 'day') { // 좌우로 더 있다는 표시
    x.fillStyle = '#ece6d6'; x.globalAlpha = 0.45 + 0.25 * Math.sin(t / 300); const tri = (px, d) => { x.beginPath(); x.moveTo(px, H / 2 - 16); x.lineTo(px + d * 14, H / 2); x.lineTo(px, H / 2 + 16); x.fill(); };
    if (ST.cam.x > 4) tri(18, -1); if (ST.cam.x < max - 4) tri(VW - 18, 1); x.globalAlpha = 1;
  }
  if (ST.focus != null) plate(x, isMobile() ? '손을 쓸 차례 — 아래에서 고른다' : '손을 쓸 차례 — 오른쪽에서 고른다', VW / 2, 12, '#fff3a0', 16);
  if (ST.label) { let fs = 34; x.font = fs + 'px "Do Hyeon", sans-serif'; let w = x.measureText(ST.label).width + 60; if (w > VW - 12) { fs = Math.floor(fs * (VW - 12) / w); x.font = fs + 'px "Do Hyeon", sans-serif'; w = x.measureText(ST.label).width + 40; } rect(x, '#0b0c16dd', VW / 2 - w / 2, H / 2 - 36, w, 64); rect(x, '#e8c030', VW / 2 - w / 2, H / 2 - 36, w, 3); txt(x, ST.label, VW / 2, H / 2 - 4 - fs / 2, '#ece6d6', Math.max(21, fs), 'center'); }
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
  if (ST.screen === 'under') { const col = Math.floor((cx - GX) / CW), row = Math.floor((cy - GY) / CH); if (cy < GY && cx > GX + 20 && cx < GX + 200) return { t: 'up' }; if (col < 0 || col > 4 || row < 0 || row > 3) return null; return { t: 'cell', i: row * 5 + col }; }
  if (G.spot) { const p = SPOS[G.spot.pos]; if (Math.abs(cx - p.x) < 48 && cy > p.y - 46 && cy < p.y + 34) return { t: 'spot' }; }
  for (const v of NEST.VIDS) { const p = VPOS[v]; if (cx > p.x - 48 && cx < p.x + 60 && cy > p.y - 30 && cy < p.y + 72) return { t: 'vill', v }; }
  for (let k = 0; k < 3; k++) { const p = PPOS[k]; if (Math.abs(cx - p.x) < 48 && Math.abs(cy - p.y) < 30) return { t: 'plot', p: k }; }
  if (Math.abs(cx - CAVE.x) < 76 && cy > CAVE.y - 44) return { t: 'down' };
  return null;
}
function setScreen(s) { if (ST.screen === s) return; ST.camMem[ST.screen] = ST.cam.tx; ST.screen = s; ST.cam.tx = ST.camMem[s]; sfx('slide'); document.querySelectorAll('[data-a="view"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s)); }

// ---------- 밤 전투 재생 ----------
const wait = ms => new Promise(res => ST.skip ? res() : setTimeout(res, ms / ST.speed));
const nlog = (s, cls) => { const el = $('nlog'); if (!el || !s) return; const p = document.createElement('p'); p.className = 'small' + (cls ? ' ' + cls : ''); p.textContent = s; el.prepend(p); while (el.children.length > 12) el.lastChild.remove(); };
function moveTo(e, p, dur) { e.fx = e.x; e.fy = e.y; e.tx = p.x; e.ty = p.y; e.t0 = now(); e.dur = Math.max(1, dur / ST.speed); }
function prepareNight() {
  const E = ST.ents = {}; ST.defs = {}; ST.floats = []; ST.sparks = []; ST.fire = {}; ST.sanfx = {};
  G.kin.forEach(m => { if (m.loc === null || m.hurt || m.strike) return; const list = ST.defs[m.loc] = ST.defs[m.loc] || [], sm = m.kind === 'spawn', p = defPos(m.loc, list.length, sm); E['k' + m.id] = { id: 'k' + m.id, kind: m.kind, side: 'def', can: kinCanvas(m.kind, m.evo), x: p.x - (m.evo ? 5 : 0), y: p.y - (m.evo ? 10 : 0), hp: 1, scale: sm ? (m.evo ? 1.625 : 1) : m.evo ? 2.625 : S }; list.push('k' + m.id); });
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
        const tag = { bind: '묶임', flee: '광란!', kneel: '항복', infight: '내분!', revive: '부활', heal: '+', lvup: 'Lv UP', back: '후퇴' }[e.k]; if (tag) u.tag = { s: tag, t0: now(), col: ['flee', 'kneel', 'infight'].includes(e.k) ? '#c8a8ff' : '#fff3a0' };
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
