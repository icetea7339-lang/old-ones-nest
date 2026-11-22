// 옛 것의 둥지 — 지상의 풍경. 뚫린 세계(판타지·무협·현대·미래)에 맞춰 하늘, 산, 길, 마을을 달리 그린다.
// stage.js 의 도구(rect, ell, tri, disc, hsh, ev2, mixc, pathPoint, BG, VPOS …)를 그대로 쓴다. 자리와 크기는 판타지와 같다.
// 판타지는 stage.js 의 원래 그림(surfBg, drawVillage)을 그대로 부른다.
const WS_SKY = {
  wuxia: ['#16283a', '#1c3444', '#234250', '#2c525c', '#386468', '#487872', '#5c8c7c', '#76a088', '#94b496', '#b4c8a6', '#d2d8b8', '#e8e4c8'],
  modern: ['#0c1230', '#101838', '#161f42', '#1e264c', '#282d56', '#36335e', '#483a64', '#5e4268', '#7a4c66', '#985860', '#b86a58', '#d48452'],
  future: ['#05081a', '#070c22', '#0a122c', '#0d1a38', '#102444', '#13304e', '#173e58', '#1c4e62', '#24606a', '#307472', '#40887a', '#549c82'],
};
const WS_GROUND = {
  wuxia: ['#2a4c3c', '#274839', '#244436', '#214033', '#1e3c30', '#1b382d'],
  modern: ['#2a4438', '#284035', '#253c32', '#22382f', '#1f342c', '#1c3029'],
  future: ['#1c3238', '#1a2f35', '#182c32', '#16292f', '#14262c', '#122329'],
};
const cloudColW = w => w === 'wuxia' ? 'rgba(236,240,226,.5)' : w === 'modern' ? 'rgba(150,130,170,.4)' : w === 'future' ? 'rgba(110,220,230,.2)' : 'rgba(255,190,170,.5)';
const caveRimW = w => w === 'wuxia' ? '#1b382d' : w === 'modern' ? '#1c3029' : w === 'future' ? '#122329' : '#1c3a29';

function surfBgW(world) {
  if (!WS_SKY[world]) return surfBg();
  const key = 'surf_' + world; if (BG[key]) return BG[key];
  const cv0 = BG[key] = document.createElement('canvas'); cv0.width = W; cv0.height = H; const q = cv0.getContext('2d');
  const R = (col, a, b, w, h) => { q.fillStyle = col; q.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  WS_SKY[world].forEach((c, k) => R(c, 0, k * 22, W, 24));
  const pts = []; NEST.VIDS.forEach(v => { for (let k = 0; k <= 160; k++) pts.push(pathPoint(v, k / 160)); });
  const keep = [...Object.values(VPOS), ...PPOS, ...SPOS, CAVE];
  const clear = (tx, ty, mx, my) => !(keep.some(p => Math.abs(p.x - tx) < (mx || 70) && Math.abs(p.y - ty) < (my || 56)) || pts.some(p => Math.abs(p.x - tx) < 22 && Math.abs(p.y - ty) < 18));
  const ridge = (col, base, amp, f, sd, rim) => { for (let px = 0; px < W; px += 4) { const hgt = amp * (0.55 + 0.45 * Math.sin(px * f + sd * 1.7)) + amp * 0.35 * Math.sin(px * f * 2.7 + sd) + hsh(sd, px) * 4, y = ev2(base - hgt); R(col, px, y, 4, 280 - y); R(rim, px, y, 4, 2); } };

  if (world === 'wuxia') {
    for (let k = 0; k < 26; k++) R('rgba(255,255,255,.6)', ev2(hsh(31, k) * W), ev2(hsh(32, k) * 70), 2, 2);
    disc(q, '#f0b89a', 706, 222, 34); disc(q, '#f8dcc0', 706, 222, 26);
    // 솟은 봉우리: 좁고 가파른 바위기둥을 세 겹으로, 사이사이 안개
    const peaks = (col, rim, base, sd, n, wMin, wMax, hMin, hMax) => { for (let k = 0; k < n; k++) { const cx = ev2((k + 0.2 + hsh(sd, k) * 0.6) * W / n), w = wMin + hsh(sd + 1, k) * (wMax - wMin), h = hMin + hsh(sd + 2, k) * (hMax - hMin);
      for (let dy = 0; dy < h; dy += 2) { const f = dy / h, hw = ev2(w * (0.22 + 0.78 * Math.pow(f, 0.62)) / 2 + Math.sin(dy * 0.21 + k) * 2); R(col, cx - hw, base - h + dy, hw * 2, 2); if (dy < 6 || hsh(sd + 3, k * 97 + dy) > 0.82) R(rim, cx - hw, base - h + dy, Math.max(2, ev2(hw * 0.5)), 2); }
      if (hsh(sd + 4, k) > 0.45) { const ty = base - h - 2; R('#1c3a30', cx - 6, ty - 2, 12, 2); R('#1c3a30', cx - 4, ty - 4, 8, 2); R('#2a2018', cx, ty, 2, 4); } } R(col, 0, base, W, 280 - base); };
    const mist = (y, a, sd) => { for (let k = 0; k < 9; k++) { const mx = ev2(hsh(sd, k) * W) - 60, mw = 110 + hsh(sd + 1, k) * 160; R('rgba(232,238,224,' + a + ')', mx, y + ev2(hsh(sd + 2, k) * 14), mw, 4); R('rgba(232,238,224,' + (a * 0.7) + ')', mx + 20, y + 4 + ev2(hsh(sd + 2, k) * 14), mw - 50, 4); } };
    peaks('#6a8c8c', '#a8c8bc', 236, 61, 9, 40, 76, 70, 150); mist(170, 0.3, 71);
    peaks('#3e6064', '#6c9088', 246, 62, 7, 50, 96, 50, 110); mist(206, 0.38, 72);
    peaks('#254440', '#3e6a5c', 256, 63, 11, 60, 120, 20, 46); mist(238, 0.3, 73);
    WS_GROUND.wuxia.forEach((c, k) => R(c, 0, 252 + k * 50, W, 52)); R('#3e7254', 0, 252, W, 2);
    for (let k = 0; k < 420; k++) { const px = ev2(hsh(41, k) * W), py = 258 + ev2(hsh(42, k) * (H - 262)), r1 = hsh(43, k); R(r1 > 0.6 ? '#44805a' : r1 > 0.25 ? '#18342a' : '#34684c', px, py, r1 > 0.6 ? 2 : 6, r1 > 0.6 ? 4 : 2); if (k % 23 === 0) R(k % 2 ? '#f0b8c8' : '#f4e8d0', px + 2, py - 2, 2, 2); if (k % 29 === 0) { R('#6a7068', px, py, 8, 4); R('#98a094', px, py, 6, 2); } }
    // 길: 돌을 깐 길
    pts.forEach(p => R('#2c302a', ev2(p.x) - 8, ev2(p.y) - 4, 16, 8));
    pts.forEach((p, k) => { R('#8a8c7a', ev2(p.x) - 6, ev2(p.y) - 2, 12, 4); if (k % 4 === 0) R('#a8aa96', ev2(p.x) - 4 + (k % 8 ? 4 : -2), ev2(p.y) - 2, 4, 2); if (k % 6 === 0) R('#5c6056', ev2(p.x) - 6, ev2(p.y) - 2, 2, 4); });
    // 대숲과 소나무
    const veg = []; for (let k = 0; k < 120 && veg.length < 40; k++) { const tx = 14 + hsh(51, k) * (W - 28), ty = 276 + hsh(52, k) * (H - 300); if (clear(tx, ty)) veg.push([tx, ty, hsh(53, k), k]); }
    veg.sort((a, b) => a[1] - b[1]).forEach(([tx, ty, r1, k]) => { ell(q, 'rgba(8,16,14,.4)', tx + 4, ty + 2, 12, 4);
      if (k % 4 === 0) { const hgt = 22 + ev2(r1 * 10); R('#3a2816', ev2(tx) - 2, ty - hgt, 4, hgt); R('#4a3420', ev2(tx), ty - hgt, 2, hgt); [[-12, 0, 20], [-8, -8, 18], [-10, -14, 14]].forEach(([ox, oy, w], n) => { R('#16382c', ev2(tx) + ox, ty - hgt + 4 + oy, w, 4); R('#24543c', ev2(tx) + ox + 2, ty - hgt + 2 + oy, w - 6, 2); }); }
      else for (let s = 0; s < 4; s++) { const bx = ev2(tx) - 8 + s * 5 + (s % 2), hgt = 26 + ev2(hsh(54, k * 7 + s) * 16); R(s % 2 ? '#3f7a4e' : '#5a9a5c', bx, ty - hgt, 2, hgt); for (let n = 8; n < hgt; n += 8) R('#254a34', bx, ty - n, 2, 1); R('#7ab870', bx - 4, ty - hgt, 6, 2); R('#5a9a5c', bx + 2, ty - hgt + 4, 6, 2); R('#7ab870', bx - 6, ty - hgt + 8, 6, 2); } });
  }

  if (world === 'modern') {
    for (let k = 0; k < 16; k++) R('rgba(255,255,255,.55)', ev2(hsh(31, k) * W), ev2(hsh(32, k) * 80), 2, 2);
    disc(q, '#ffb070', 706, 236, 34); disc(q, '#ffd8a0', 706, 236, 24);
    [[90, 120, 130], [380, 80, 170], [760, 104, 120]].forEach(([cx, cy, w]) => { R('rgba(160,120,160,.4)', cx, cy, w, 6); R('rgba(160,120,160,.4)', cx + 18, cy - 6, w - 44, 6); R('rgba(40,30,70,.35)', cx + 8, cy + 6, w - 24, 4); });
    // 도시의 윤곽: 먼 고층, 가까운 낮은 건물, 맨 앞은 가로수 줄
    const skyline = (col, lit, base, sd, wMin, wMax, hMin, hMax, tall) => { let px = -6; let k = 0; while (px < W) { const w = ev2(wMin + hsh(sd, k) * (wMax - wMin)), big = hsh(sd + 5, k) > 1 - tall, h = ev2((big ? hMax : hMin) + hsh(sd + 1, k) * (big ? hMax * 0.5 : (hMax - hMin) * 0.5)), top = base - h;
        R(col, px, top, w, 280 - top); R(mixc(col, '#ffffff', 0.12), px, top, 2, 280 - top); if (big && hsh(sd + 2, k) > 0.4) { R(col, px + w / 2 - 1, top - 12, 2, 12); R('#ff5f57', px + w / 2 - 1, top - 14, 2, 2); } else if (hsh(sd + 2, k) > 0.7) R(col, px + 4, top - 4, w - 10, 4);
        for (let wy = top + 6; wy < base + 6; wy += 8) for (let wx = px + 4; wx < px + w - 4; wx += 6) if (hsh(sd + 3, wx * 31 + wy) > 0.56) R(hsh(sd + 4, wx + wy * 17) > 0.8 ? '#bfe8ff' : lit, wx, wy, 2, 4);
        px += w + (hsh(sd + 6, k) > 0.7 ? 6 : 2); k++; } };
    skyline('#2c2a52', '#f0c060', 214, 81, 18, 36, 26, 74, 0.3); R('rgba(255,150,90,.16)', 0, 190, W, 40);
    skyline('#1e2140', '#ffd870', 238, 82, 22, 44, 14, 34, 0.12);
    for (let px = 0; px < W; px += 4) { const y = ev2(250 - 8 - 6 * Math.sin(px * 0.09) - hsh(83, px) * 6); R('#16262a', px, y, 4, 280 - y); }
    WS_GROUND.modern.forEach((c, k) => R(c, 0, 252 + k * 50, W, 52)); R('#3a5e4a', 0, 252, W, 2);
    for (let k = 0; k < 360; k++) { const px = ev2(hsh(41, k) * W), py = 258 + ev2(hsh(42, k) * (H - 262)), r1 = hsh(43, k); R(r1 > 0.6 ? '#3e6e50' : r1 > 0.25 ? '#182e26' : '#305a44', px, py, r1 > 0.6 ? 2 : 6, r1 > 0.6 ? 4 : 2); if (k % 37 === 0) { R('#4a4a56', px, py, 8, 4); R('#6a6a78', px, py, 8, 2); } }
    // 굴 옆의 주차장
    { const lx = 566, ly = 480, lw = 150, lh = 48; R('#14141a', lx - 2, ly - 2, lw + 4, lh + 4); R('#34343e', lx, ly, lw, lh); for (let k = 0; k <= 6; k++) R('#c8c8d0', lx + 10 + k * 22, ly + 4, 2, 18); for (let k = 0; k <= 6; k++) R('#c8c8d0', lx + 10 + k * 22, ly + lh - 20, 2, 16);
      [[0, '#c8404a'], [2, '#e8e4d8'], [5, '#3f8fd0']].forEach(([n, col]) => { const cx = lx + 14 + n * 22; R('#0b0c16', cx, ly + 8, 16, 12); R(col, cx + 2, ly + 6, 12, 12); R(mixc(col, '#ffffff', 0.4), cx + 2, ly + 6, 12, 2); R('#1e2a3a', cx + 4, ly + 10, 8, 4); }); }
    // 길: 아스팔트와 가운데 금
    pts.forEach(p => R('#121218', ev2(p.x) - 10, ev2(p.y) - 6, 20, 10));
    pts.forEach(p => R('#383842', ev2(p.x) - 8, ev2(p.y) - 4, 16, 8));
    pts.forEach((p, k) => { if (k % 8 < 4) R('#e8c030', ev2(p.x) - 1, ev2(p.y) - 1, 2, 2); if (k % 13 === 0) R('#4a4a56', ev2(p.x) - 6 + (k % 26 ? 8 : 0), ev2(p.y) - 2, 4, 2); });
    // 가로수와 가로등
    const veg = []; for (let k = 0; k < 90 && veg.length < 22; k++) { const tx = 14 + hsh(51, k) * (W - 28), ty = 276 + hsh(52, k) * (H - 300); if (clear(tx, ty) && !(tx > 550 && tx < 730 && ty > 462 && ty < 540)) veg.push([tx, ty, hsh(53, k)]); }
    veg.sort((a, b) => a[1] - b[1]).forEach(([tx, ty, r1]) => { const r = 9 + ev2(r1 * 5); ell(q, 'rgba(8,12,14,.45)', tx + 4, ty + 2, 12, 4); R('#3a2816', ev2(tx) - 2, ty - 10, 4, 12); disc(q, '#122c22', ev2(tx), ty - 12 - r / 2, r + 2); disc(q, '#1d4634', ev2(tx) - 2, ty - 14 - r / 2, r - 1); disc(q, '#2a5c42', ev2(tx) - 4, ty - 17 - r / 2, Math.max(3, r - 5)); });
    pts.forEach((p, k) => { if (k % 46 !== 20 || p.y < 290) return; const side = (k / 46 | 0) % 2 ? 14 : -16, lx = ev2(p.x) + side, ly = ev2(p.y); if (keep.some(c => Math.abs(c.x - lx) < 46 && Math.abs(c.y - ly) < 40)) return; R('#0b0c1666', lx - 2, ly + 2, 8, 2); R('#5a5a68', lx, ly - 26, 2, 28); R('#5a5a68', lx - (side > 0 ? 6 : -2), ly - 26, 6, 2); const hx = lx - (side > 0 ? 6 : -6); R('#fff3a0', hx, ly - 24, 4, 2); q.fillStyle = 'rgba(255,220,120,.16)'; q.beginPath(); q.moveTo(hx + 2, ly - 22); q.lineTo(hx - 10, ly + 4); q.lineTo(hx + 14, ly + 4); q.fill(); });
  }

  if (world === 'future') {
    for (let k = 0; k < 70; k++) R(k % 5 ? 'rgba(200,240,255,.7)' : '#9fe8f0', ev2(hsh(31, k) * W), ev2(hsh(32, k) * 150), 2, 2);
    // 고리 두른 별과 작은 달
    disc(q, '#2a4a6a', 612, 78, 40); disc(q, '#3a6a8a', 608, 74, 34); for (let k = 0; k < 5; k++) R(k % 2 ? '#5a94aa' : '#2e5878', 580 + k * 3, 56 + k * 9, 60 - k * 5, 3); disc(q, '#0a122c', 630, 66, 30);
    disc(q, '#2a4a6a', 612, 78, 40); disc(q, '#3d7090', 606, 72, 33); for (let k = 0; k < 6; k++) R(k % 2 ? '#62a0b4' : '#2e5a7a', 578 + (k % 3) * 4, 52 + k * 8, 62 - (k % 3) * 8, 3);
    q.strokeStyle = '#9fe8f0'; q.lineWidth = 2; q.beginPath(); q.ellipse(612, 80, 66, 12, -0.22, 0.25, Math.PI - 0.25); q.stroke(); q.strokeStyle = 'rgba(159,232,240,.5)'; q.beginPath(); q.ellipse(612, 80, 74, 15, -0.22, 0.2, Math.PI - 0.2); q.stroke();
    disc(q, '#c8d8e8', 322, 46, 9); disc(q, '#e8f4ff', 320, 44, 6);
    // 투명한 돔의 살과, 하늘을 흐르는 불빛 줄
    q.strokeStyle = 'rgba(120,220,235,.16)'; q.lineWidth = 2; for (let k = 0; k < 7; k++) { q.beginPath(); q.ellipse(W / 2, 300, 120 + k * 78, 80 + k * 44, 0, Math.PI, Math.PI * 2); q.stroke(); } for (let k = -5; k <= 5; k++) { q.beginPath(); q.moveTo(W / 2 + k * 30, 0); q.quadraticCurveTo(W / 2 + k * 70, 120, W / 2 + k * 110, 262); q.stroke(); }
    [[20, 30, 0.14], [150, 112, 0.1], [60, 150, -0.05]].forEach(([x0, y0, sl], n) => { for (let k = 0; k < 44; k++) { const px = x0 + k * 22 + (n * 7), py = y0 + k * 22 * sl; if (px > W) break; R(k % 6 === 0 ? '#ffd870' : n === 1 ? 'rgba(255,150,220,.75)' : 'rgba(140,235,250,.8)', px, py, 4, 2); } });
    // 먼 곳: 탑과 돔의 윤곽
    const towers = (col, rim, base, sd, n, hMin, hMax) => { for (let k = 0; k < n; k++) { const cx = ev2((k + 0.15 + hsh(sd, k) * 0.7) * W / n), kind = Math.floor(hsh(sd + 1, k) * 3), h = ev2(hMin + hsh(sd + 2, k) * (hMax - hMin));
        if (kind === 0) { for (let dy = 0; dy < h; dy += 2) { const hw = ev2(5 + 10 * (dy / h)); R(col, cx - hw, base - h + dy, hw * 2, 2); } R(col, cx - 1, base - h - 16, 2, 16); R('#ff5f9a', cx - 1, base - h - 18, 2, 2); for (let dy = 8; dy < h; dy += 10) R(rim, cx - 2, base - h + dy, 4, 2); }
        else if (kind === 1) { ell(q, col, cx, base, 34 + h * 0.3, h * 0.7, true); for (let s = -2; s <= 2; s++) R(rim, cx + s * 12, base - h * 0.62 + Math.abs(s) * 6, 2, 2); R(rim, cx - 20, base - 6, 40, 1); }
        else { R(col, cx - 12, base - h, 24, h); R(col, cx - 18, base - h * 0.6, 36, h * 0.6); R(rim, cx - 12, base - h, 24, 2); for (let dy = 6; dy < h - 4; dy += 6) for (let s = 0; s < 3; s++) if (hsh(sd + 3, k * 13 + dy + s) > 0.5) R(s === 1 ? '#ffd870' : '#9fe8f0', cx - 8 + s * 7, base - h + dy, 2, 2); } } R(col, 0, base, W, 280 - base); R(rim, 0, base, W, 1); };
    towers('#16284a', '#3f8fb0', 222, 91, 9, 50, 110); R('rgba(90,220,230,.10)', 0, 196, W, 34);
    towers('#101c34', '#2f6f8a', 242, 92, 12, 24, 54);
    for (let px = 0; px < W; px += 4) { const y = ev2(252 - 4 - (px % 96 < 40 ? 6 : 0) - hsh(93, px >> 5) * 4); R('#0c1624', px, y, 4, 280 - y); }
    WS_GROUND.future.forEach((c, k) => R(c, 0, 252 + k * 50, W, 52)); R('#3fb8d0', 0, 252, W, 1);
    // 판을 깐 땅: 이음매와 작은 불빛, 군데군데 이끼
    for (let gy = 268; gy < H; gy += 26) for (let gx = (gy % 52 ? 0 : 30); gx < W; gx += 60) { R('#22404a', gx, gy, 34, 2); if (hsh(94, gx + gy * 7) > 0.7) R('#22404a', gx + 34, gy - 12, 2, 14); }
    for (let k = 0; k < 220; k++) { const px = ev2(hsh(41, k) * W), py = 258 + ev2(hsh(42, k) * (H - 262)), r1 = hsh(43, k); if (r1 > 0.86) { R('#5fe0f0', px, py, 2, 2); R('rgba(95,224,240,.25)', px - 2, py - 2, 6, 6); } else if (r1 > 0.5) R('#274a4e', px, py, 6, 2); else if (r1 > 0.3) R('#0e1c22', px, py, 6, 2); else if (r1 < 0.07) { R('#2f6a4a', px, py, 8, 4); R('#4a9a5e', px + 2, py, 4, 2); } }
    // 길: 빛줄이 박힌 길
    pts.forEach(p => R('#080c12', ev2(p.x) - 10, ev2(p.y) - 6, 20, 10));
    pts.forEach(p => R('#26303c', ev2(p.x) - 8, ev2(p.y) - 4, 16, 8));
    pts.forEach((p, k) => { R('#3a4856', ev2(p.x) - 8, ev2(p.y) - 4, 2, 2); if (k % 6 < 3) { R('#5fe0f0', ev2(p.x) - 1, ev2(p.y) - 1, 2, 2); } });
    // 등대 기둥, 태양판, 둥근 나무
    const veg = []; for (let k = 0; k < 110 && veg.length < 30; k++) { const tx = 14 + hsh(51, k) * (W - 28), ty = 276 + hsh(52, k) * (H - 300); if (clear(tx, ty)) veg.push([tx, ty, hsh(53, k), k]); }
    veg.sort((a, b) => a[1] - b[1]).forEach(([tx, ty, r1, k]) => { const x0 = ev2(tx); ell(q, 'rgba(4,8,12,.45)', tx + 4, ty + 2, 12, 4);
      if (k % 3 === 0) { const hgt = 22 + ev2(r1 * 12); R('#3a4856', x0 - 1, ty - hgt, 2, hgt); R('#56687a', x0 - 4, ty - 2, 8, 2); R('#9fe8f0', x0 - 2, ty - hgt - 4, 4, 4); R('rgba(95,224,240,.22)', x0 - 6, ty - hgt - 8, 12, 12); }
      else if (k % 3 === 1) { R('#3a4856', x0 - 1, ty - 10, 2, 10); for (let s = 0; s < 4; s++) R(s % 2 ? '#2a5a9a' : '#3f7fd0', x0 - 10 + s * 5, ty - 16 + s * 2, 5, 6); R('#9fc8ff', x0 - 10, ty - 16, 20, 1); }
      else { const r = 8 + ev2(r1 * 4); R('#2a3440', x0 - 1, ty - 8, 2, 10); disc(q, '#0e3038', x0, ty - 10 - r / 2, r + 2); disc(q, '#1c5a5c', x0 - 2, ty - 12 - r / 2, r - 1); disc(q, '#3a9a8a', x0 - 4, ty - 15 - r / 2, Math.max(3, r - 5)); R('#9fe8f0', x0 + 2, ty - 12 - r, 2, 2); } });
  }
  return cv0;
}

// 길목의 바닥: 세계마다 다른 터
function plotBaseW(x, world, p, type) {
  if (world === 'wuxia') { ell(x, '#20261e', p.x, p.y + 2, 44, 18); ell(x, type === 'none' ? '#6e7264' : '#7e8272', p.x, p.y, 40, 16); ell(x, '#9a9e8a', p.x - 6, p.y - 4, 22, 6); rect(x, '#5c6056', p.x - 20, p.y + 2, 40, 2); rect(x, '#5c6056', p.x - 2, p.y - 8, 2, 20); return; }
  if (world === 'modern') { ell(x, '#101016', p.x, p.y + 2, 44, 18); ell(x, type === 'none' ? '#34343e' : '#3c3c48', p.x, p.y, 40, 16); ell(x, '#484854', p.x - 6, p.y - 4, 22, 6); for (let k = 0; k < 6; k++) rect(x, '#e8c030', p.x - 30 + k * 11, p.y + 8, 6, 2); return; }
  if (world === 'future') { ell(x, '#060a10', p.x, p.y + 2, 44, 18); ell(x, type === 'none' ? '#24303c' : '#2c3a48', p.x, p.y, 40, 16); ell(x, '#3a4a5a', p.x - 6, p.y - 4, 22, 6); for (let k = 0; k < 8; k++) rect(x, k % 2 ? '#5fe0f0' : '#2f8a9a', p.x + Math.cos(k * 0.785) * 34 - 1, p.y + Math.sin(k * 0.785) * 12 - 1, 2, 2); return; }
  ell(x, '#2a2218', p.x, p.y + 2, 44, 18); ell(x, type === 'none' ? '#6a5a40' : '#7a6848', p.x, p.y, 40, 16); ell(x, '#8a7652', p.x - 6, p.y - 4, 22, 6);
}
// 지상에 나타난 것 가운데 세계에 따라 꼴이 달라지는 것. 그렸으면 true (판타지 그림을 건너뛴다)
function spotPropW(x, world, ty, p, t, fl) {
  if (ty === 'cart' && world === 'modern') { rect(x, '#0b0c1655', p.x - 26, p.y - 2, 54, 4); rect(x, '#e8e4d8', p.x - 24, p.y - 28, 32, 24); rect(x, '#c8c4b8', p.x - 24, p.y - 8, 32, 4); rect(x, '#3f8fd0', p.x - 20, p.y - 22, 22, 6); rect(x, '#c8404a', p.x + 8, p.y - 20, 16, 16); rect(x, '#9fd8ff', p.x + 14, p.y - 18, 8, 6); rect(x, fl ? '#fff3a0' : '#e8c030', p.x + 22, p.y - 10, 2, 4); disc(x, '#16161c', p.x - 14, p.y - 2, 5); disc(x, '#16161c', p.x + 14, p.y - 2, 5); rect(x, '#6a6a78', p.x - 16, p.y - 4, 4, 4); rect(x, '#6a6a78', p.x + 12, p.y - 4, 4, 4); return true; }
  if (ty === 'cart' && world === 'future') { const bob = Math.round(Math.sin(t / 300) * 2); ell(x, 'rgba(95,224,240,.3)', p.x, p.y + 2, 24, 5); rect(x, '#3a4856', p.x - 22, p.y - 22 + bob, 44, 14); rect(x, '#56687a', p.x - 22, p.y - 22 + bob, 44, 2); rect(x, '#e8a030', p.x - 18, p.y - 32 + bob, 14, 10); rect(x, '#4fb0c0', p.x - 2, p.y - 30 + bob, 16, 8); rect(x, '#9fe8f0', p.x + 16, p.y - 18 + bob, 4, 4); rect(x, fl ? '#5fe0f0' : '#2f8a9a', p.x - 18, p.y - 8 + bob, 8, 2); rect(x, fl ? '#5fe0f0' : '#2f8a9a', p.x + 10, p.y - 8 + bob, 8, 2); return true; }
  if (ty === 'camp' && world === 'future') { ell(x, '#3a4856', p.x - 10, p.y, 22, 24, true); ell(x, '#56687a', p.x - 14, p.y - 4, 12, 14, true); rect(x, '#1a2430', p.x - 16, p.y - 12, 10, 12); rect(x, fl ? '#5fe0f0' : '#9fe8f0', p.x + 16, p.y - 12, 4, 12); rect(x, 'rgba(95,224,240,.25)', p.x + 12, p.y - 16, 12, 18); x.drawImage(invCanvas('militia'), p.x + 22, p.y - 30, 32, 32); return true; }
  if (ty === 'camp' && world === 'modern') { ell(x, '#5a6a3a', p.x - 10, p.y, 22, 22, true); ell(x, '#7a8a4a', p.x - 14, p.y - 4, 12, 12, true); rect(x, '#2a3020', p.x - 14, p.y - 12, 8, 12); rect(x, '#5a5a66', p.x + 18, p.y - 12, 4, 12); rect(x, fl ? '#fff3a0' : '#ffd23a', p.x + 16, p.y - 16, 8, 5); x.drawImage(invCanvas('militia'), p.x + 22, p.y - 30, 32, 32); return true; }
  return false;
}

// 길목의 시설: 둥지가 길가에 내어 놓은 것. 사람이 지은 천막이나 망루가 아니라 돋아난 것이다. 어느 세상에서나 같다
function plotPropW(x, world, p, type, t) {
  if (type === 'bramble') {   // 가시덤불: 뼈 끝이 달린 붉은 가시
    for (let n = 0; n < 8; n++) { const bx = p.x - 32 + n * 9, lean = (n % 2 ? 1 : -1) * (2 + n % 3), h = 16 + (n * 5) % 9; for (let q = 0; q < h; q += 2) { const k = q / h, px = bx + Math.round(lean * k * 2); rect(x, '#3a0e0a', px - 1, p.y + 4 - q, 4, 2); rect(x, q > h - 6 ? '#f2e9c9' : '#9c2a1c', px, p.y + 4 - q, 2, 2); } if (n % 3 === 1) { rect(x, '#9c2a1c', bx + 2, p.y - 6, 4, 2); rect(x, '#f2e9c9', bx + 6, p.y - 8, 2, 2); } }
    return true; }
  if (type === 'camp') {   // 야영지: 따뜻한 빛이 새는 살 둔덕. 쉬어 가라고 꾀는 미끼다
    const fl = Math.sin(t / 120) > 0, pu = Math.round(Math.sin(t / 500) * 1);
    ell(x, '#2a1418', p.x - 4, p.y + 4, 30, 30 + pu, true); ell(x, '#6a2a34', p.x - 6, p.y + 2, 26, 26 + pu, true); ell(x, '#9a4a52', p.x - 12, p.y - 6, 12, 10, true);
    ell(x, '#12060a', p.x - 4, p.y + 4, 12, 16, true); ell(x, fl ? '#ffb347' : '#ff7a2f', p.x - 4, p.y + 4, 8, 10, true); rect(x, '#fff3a0', p.x - 6, p.y - 2, 4, 4);
    for (const [dx, h] of [[26, 16], [34, 10]]) { rect(x, '#6a2a34', p.x + dx, p.y + 2 - h, 2, h); disc(x, '#8a6a1c', p.x + dx + 1, p.y - h, 5); disc(x, fl ? '#ffd23a' : '#e8c030', p.x + dx + 1, p.y - h - 1, 3); }
    return true; }
  if (type === 'tower') {   // 망루: 길을 내려다보는 눈자루
    const look = Math.round(Math.sin(t / 1100) * 3), shut = Math.floor(t / 200) % 31 === 0;
    ell(x, '#2a1a28', p.x, p.y + 4, 16, 8, true); for (let q = 0; q < 42; q += 2) { const sway = Math.round(Math.sin(q / 9 + t / 1600) * 2); rect(x, '#2a1a28', p.x - 4 + sway, p.y + 2 - q, 8, 2); rect(x, '#7a4a62', p.x - 3 + sway, p.y + 2 - q, 6, 2); rect(x, '#a86a82', p.x - 3 + sway, p.y + 2 - q, 2, 2); }
    const ex = p.x + Math.round(Math.sin(42 / 9 + t / 1600) * 2), ey = p.y - 48; disc(x, '#0b0911', ex, ey, 12); if (shut) { disc(x, '#7a4a62', ex, ey, 10); rect(x, '#0b0911', ex - 8, ey, 16, 2); } else { disc(x, '#f2ecd8', ex, ey, 10); disc(x, '#e8c030', ex + look, ey, 6); rect(x, '#0b0911', ex + look - 1, ey - 5, 2, 10); rect(x, '#ffffff', ex + look - 4, ey - 4, 2, 2); }
    return true; }
  if (type === 'garden') {   // 텃밭: 진을 빨아올리는 버섯밭
    for (let n = 0; n < 8; n++) { const bx = p.x - 30 + (n % 4) * 16 + (n > 3 ? 6 : 0), by = p.y - 6 + Math.floor(n / 4) * 10, tall = 6 + (n * 3) % 5, lit = Math.sin(t / 600 + n * 1.3) > 0.2;
      rect(x, '#2a2018', bx - 2, by + 2, 12, 3); rect(x, '#e8e0c8', bx + 3, by - tall + 4, 2, tall); rect(x, '#2f7a2a', bx - 1, by - tall + 1, 10, 4); rect(x, lit ? '#d0f08a' : '#8fe05a', bx, by - tall, 8, 3); rect(x, '#ffffff', bx + 1, by - tall, 2, 1); }
    return true; }
  return false;
}
// 무너진 마을: 세상마다 남는 것이 다르다. 그렸으면 true
function razedW(x, world, p, t) {
  const R = (col, a, b, w, h) => rect(x, col, p.x + a, p.y + b, w, h), smoke = col => { for (let k = 0; k < 3; k++) rect(x, col, p.x - 10 + k * 8 + Math.sin(t / 300 + k) * 4, p.y - 20 - ((t / 40 + k * 20) % 40), 8, 8); };
  if (world === 'wuxia') { R('#3a342c', -36, 10, 76, 8); R('#5a4a3a', -30, -2, 10, 14); R('#5a4a3a', 14, 2, 8, 10); for (let k = 0; k < 6; k++) R(k % 2 ? '#3a5a5a' : '#2c4848', -34 + k * 11, 4 - (k % 3) * 4, 12, 4); R('#7a2a20', -18, -10, 44, 4); R('#4a1810', -18, -6, 44, 2); R('#3a5a5a', -4, -16, 20, 4); smoke('#9a9e8a88'); return true; }
  if (world === 'modern') { R('#2a2a32', -38, 10, 80, 8); R('#6a6a74', -32, -4, 22, 16); R('#8a8a94', -32, -4, 22, 2); R('#5a5a64', -6, 2, 26, 10); R('#8a8a94', -6, 2, 26, 2); R('#4a4a54', 22, -10, 12, 22); for (let k = 0; k < 4; k++) R('#a0522a', -28 + k * 14, -10 - (k % 2) * 4, 2, 8); R('#1a1a22', -26, 0, 6, 6); R('#1a1a22', 26, -4, 4, 6); R('#5a5a66', 40, -30, 3, 40); R('#5a5a66', 32, -32, 12, 3); if (Math.sin(t / 90) > 0.6) R('#fff3a0', 30, -29, 4, 3); smoke('#6a6a7488'); return true; }
  if (world === 'future') { R('#0e161e', -38, 10, 80, 8); R('#2c3a48', -34, -2, 24, 14); R('#3a4a5a', -34, -2, 24, 2); R('#24303c', -4, -12, 18, 24); R('#3a4a5a', -4, -12, 2, 24); R('#2c3a48', 18, 2, 20, 10); for (let k = 0; k < 3; k++) { const on = Math.sin(t / 110 + k * 2.1) > 0.3; R(on ? '#5fe0f0' : '#1f5a66', -28 + k * 22, 4 - k * 6, 8, 2); } const sp = Math.floor(t / 70) % 9; if (sp < 3) { R('#9ff8ff', 6 + sp * 4, -18 - sp * 3, 2, 2); R('#5fe0f0', 2 - sp * 3, -14 - sp * 2, 2, 2); } smoke('rgba(95,224,240,.25)'); return true; }
  return false;
}
// 지상에 나타난 것 곁에 그 세상 사람들이 남긴 표시 (사당, 유성 구덩이)
function spotDressW(x, world, ty, p, t, fl) {
  if (ty !== 'shrine' && ty !== 'meteor') return;
  if (world === 'wuxia') { rect(x, '#5a6a3a', p.x + 26, p.y - 34, 2, 36); rect(x, '#c8404a', p.x + 28, p.y - 32, 6, 16 + Math.round(Math.sin(t / 400) * 1)); rect(x, '#f2e9c9', p.x + 30, p.y - 28, 2, 8); }
  if (world === 'modern') { for (const d of [-34, 30]) { tri(x, '#e87a2a', p.x + d + 3, p.y + 4, 5, 12); rect(x, '#f5f5f5', p.x + d, p.y - 2, 6, 2); } for (let k = 0; k < 8; k++) rect(x, k % 2 ? '#e8c030' : '#1a1a22', p.x - 30 + k * 8, p.y - 8, 8, 2); }
  if (world === 'future') { for (const d of [-34, 32]) { rect(x, '#3a4856', p.x + d, p.y - 22, 3, 26); rect(x, '#56687a', p.x + d - 2, p.y - 26, 7, 4); rect(x, fl ? '#5fe0f0' : '#1f5a66', p.x + d, p.y - 30, 3, 3); } rect(x, 'rgba(95,224,240,.18)', p.x - 32, p.y - 20 + ((t / 30) % 20), 66, 2); }
}

// 마을: 자리와 크기는 판타지와 같다 (가로 −46…+58, 세로 −66…+28)
function drawVillageW(x, world, v, p, t, night) {
  if (!WS_SKY[world]) return drawVillage(x, v, p, t, night);
  const R = (col, a, b, w, h) => rect(x, col, p.x + a, p.y + b, w, h), sh = (a, b, w) => R('#0b0c1655', a - 2, b, w + 6, 3), fl = Math.sin(t / 200) > 0;

  if (world === 'wuxia') {
    const win = night ? '#ffd23a' : '#4a3a28';
    rect(x, 'rgba(232,238,224,.30)', p.x - 52, p.y + 22, 116, 4); rect(x, 'rgba(232,238,224,.22)', p.x - 36, p.y + 26, 84, 3);
    // 기와집: 흰 벽, 검은 기둥, 끝이 들린 지붕
    const roof = (ox, oy, w, col) => { R(mixc(col, '#000000', 0.45), ox - 6, oy + 2, w + 12, 3); R(col, ox - 4, oy - 2, w + 8, 4); R(mixc(col, '#ffffff', 0.25), ox - 2, oy - 5, w + 4, 3); R(col, ox - 8, oy - 2, 4, 2); R(col, ox + w + 4, oy - 2, 4, 2); R(col, ox - 10, oy - 4, 2, 2); R(col, ox + w + 8, oy - 4, 2, 2); };
    const hall = (ox, oy, w, h, col) => { sh(ox, oy + h, w); R('#ece4d0', ox, oy, w, h); R('#b8ac90', ox + w - 3, oy, 3, h); R('#3a2a20', ox, oy, 2, h); R('#3a2a20', ox + w - 2, oy, 2, h); R('#6a5a44', ox, oy + h - 2, w, 2); roof(ox, oy, w, col); R(win, ox + w / 2 - 3, oy + h - 9, 6, 9); if (night) R('#ffd23a55', ox + w / 2 - 5, oy + h - 11, 10, 13); };
    if (v === 'gaet') { // 나루촌: 강가의 누각과 돛단배
      R(night ? '#1c4654' : '#5aa8b0', -44, 14, 100, 14); for (let k = 0; k < 4; k++) R('#e0f4f088', -38 + k * 26 + Math.sin(t / 400 + k) * 4, 18 + (k % 2) * 5, 10, 2);
      R('#4a3a28', -28, 8, 3, 20); R('#4a3a28', -9, 8, 3, 20); R('#6a5a44', -32, 6, 30, 3); hall(-30, -10, 26, 16, '#3a8a94');
      R('#4a3a28', 4, 2, 3, 26); R('#4a3a28', 21, 2, 3, 26); R('#6a5a44', 0, 0, 28, 3); hall(4, -14, 20, 14, '#3a8a94');
      const bx = 34 + Math.round(Math.sin(t / 700) * 3); R('#5a4630', bx, 18, 24, 5); R('#7a5a3a', bx + 2, 16, 20, 2); R('#3a2a20', bx + 10, -6, 2, 24); for (let k = 0; k < 5; k++) R(k % 2 ? '#c89a5a' : '#a87a44', bx + 12, -4 + k * 4, 10 - (k === 0 || k === 4 ? 4 : 0), 3); R(fl ? '#ff7a5a' : '#e8505a', bx + 2, 8, 4, 5);
    } else if (v === 'field') { // 화전촌: 다랑이밭, 초가, 물레방아
      for (let k = 0; k < 5; k++) { R(k % 2 ? '#b8a850' : '#7fae56', -44 + k * 5, 16 + k * 3, 96 - k * 10, 3); R('#4a5a34', -44 + k * 5, 19 + k * 3, 96 - k * 10, 1); }
      const hut = (ox, oy, w, h) => { sh(ox, oy + h, w); R('#d8c8a0', ox, oy, w, h); R('#a89870', ox + w - 3, oy, 3, h); ell(x, '#8a7030', p.x + ox + w / 2, p.y + oy + 3, w / 2 + 6, 12, true); ell(x, '#c8a850', p.x + ox + w / 2 - 1, p.y + oy + 1, w / 2 + 4, 10, true); R('#e0c870', ox + 3, oy - 6, w - 8, 2); R(win, ox + w / 2 - 3, oy + h - 8, 6, 8); };
      hut(-36, 2, 24, 14); hut(-6, 6, 20, 12);
      R('#6a5a44', 26, -6, 6, 24); R('#4a3a28', 22, -10, 14, 4); R('#5aa8b0', 32, -2, 12, 2);
      x.save(); x.translate(p.x + 42, p.y + 6); x.rotate(t / 700); for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 4); rect(x, '#7a5a3a', -13, -1, 26, 2); } x.strokeStyle = '#5a4630'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 13, 0, 7); x.stroke(); x.restore(); R('#3a2a20', 40, 4, 4, 4);
      for (let k = 0; k < 3; k++) R('#d8d8d055', -26 + Math.sin(t / 500 + k) * 3, -14 - ((t / 60 + k * 9) % 24), 5, 5);
    } else if (v === 'bell') { // 범종 마을: 오층탑과 종각
      hall(24, 4, 20, 14, '#c8703a');
      sh(-12, 18, 30); for (let k = 0; k < 5; k++) { const w = 28 - k * 4, oy = 6 - k * 13; R('#ece4d0', 2 - w / 2, oy, w, 12); R('#3a2a20', 2 - w / 2, oy, 2, 12); R('#3a2a20', w / 2, oy, 2, 12); R(night ? '#ffd23a' : '#4a3a28', 0, oy + 4, 4, 6); roof(2 - w / 2, oy, w, '#c8703a'); } R('#e8c030', 1, -64, 2, 10); R('#e8c030', -1, -58, 6, 2);
      R('#3a2a20', -44, 0, 2, 18); R('#3a2a20', -28, 0, 2, 18); roof(-44, 0, 18, '#c8703a'); R('#6a5a44', -46, 18, 22, 2); const sw = Math.round(Math.sin(t / 320) * 3); R('#8a7a3a', -39 + sw, 3, 8, 9); R('#c8b050', -39 + sw, 3, 8, 2); R('#5a4a20', -38 + sw, 12, 6, 2);
    } else if (v === 'school') { // 도관 고을: 겹지붕 전각과 향 연기
      sh(-32, 18, 62); R('#8a8478', -34, 14, 66, 4); R('#ece4d0', -28, -2, 54, 16); for (let k = 0; k < 5; k++) R('#8a2a30', -26 + k * 12, -2, 3, 16); roof(-30, -2, 58, '#7a5ac8'); R('#ece4d0', -16, -16, 30, 10); roof(-18, -16, 34, '#7a5ac8'); R('#e8c030', -2, -26, 2, 6);
      disc(x, '#2a2438', p.x - 1, p.y + 8, 6); disc(x, night ? '#ffd23a' : '#c8b8f0', p.x - 1, p.y + 8, 4); R('#2a2438', -2, 4, 2, 8);
      R('#6a6478', 40, 4, 10, 14); R('#8a8496', 38, 0, 14, 4); R('#6a6478', 42, -8, 6, 8); R(fl ? '#ffb347' : '#ff7a2f', 43, -6, 4, 4); for (let k = 0; k < 3; k++) R('#d8d0f055', 44 + Math.sin(t / 420 + k) * 3, -14 - ((t / 50 + k * 10) % 26), 4, 4);
    } else { // 관아 성읍: 성벽과 문루, 붉은 깃발
      sh(-36, 20, 78); R('#7a7e86', -36, -2, 78, 22); for (let k = 0; k < 13; k++) R(k % 2 ? '#6a6e76' : '#8a8e96', -36 + k * 6, -2 + (k % 2) * 8, 6, 8); for (let k = 0; k < 7; k++) R('#7a7e86', -36 + k * 12, -8, 7, 6);
      R('#3a2a20', -8, 6, 22, 14); R('#8a2a30', -6, 8, 18, 12); R('#e8c030', 2, 12, 2, 4); R('#5a1a20', 2, 8, 2, 12);
      R('#8a2a30', -10, -22, 3, 14); R('#8a2a30', 13, -22, 3, 14); R('#ece4d0', -7, -20, 20, 10); R(night ? '#ffd23a' : '#4a3a28', 0, -18, 6, 6); roof(-14, -24, 34, '#2e5a4a'); R('#2e5a4a', -4, -32, 14, 4); R('#4a8a6e', -2, -34, 10, 2);
      [[-46, -14], [36, -14]].forEach(([ox, oy], k) => { R('#8a8e96', ox, oy, 16, 34); R('#6a6e76', ox + 12, oy, 4, 34); roof(ox - 1, oy, 18, '#2e5a4a'); R('#2a2438', ox + 6, oy + 10, 4, 8); R('#4a3a28', ox + 7, oy - 26, 2, 22); x.fillStyle = '#e8505a'; x.beginPath(); x.moveTo(p.x + ox + 9, p.y + oy - 26); x.lineTo(p.x + ox + 21 + Math.sin(t / 200 + k) * 2, p.y + oy - 22); x.lineTo(p.x + ox + 9, p.y + oy - 16); x.fill(); });
    }
    return;
  }

  if (world === 'modern') {
    const lit = night ? '#ffd870' : '#2c3a4e', lit2 = night ? '#bfe8ff' : '#3a4a5e';
    ell(x, '#0e1020', p.x + 6, p.y + 22, 56, 8); ell(x, '#3a3a48', p.x + 6, p.y + 20, 52, 6); ell(x, '#4c4c5c', p.x, p.y + 18, 30, 2);
    const block = (ox, oy, w, h, col, sd) => { sh(ox, oy + h, w); R(col, ox, oy, w, h); R(mixc(col, '#000000', 0.25), ox + w - 3, oy, 3, h); R(mixc(col, '#ffffff', 0.25), ox, oy, w, 2); for (let wy = oy + 4; wy < oy + h - 4; wy += 6) for (let wx = ox + 3; wx < ox + w - 5; wx += 5) R(hsh(sd, wx * 7 + wy) > 0.45 ? lit : lit2, wx, wy, 3, 3); };
    if (v === 'gaet') { // 부둣가: 방파제, 창고, 크레인, 어선
      R(night ? '#142c4a' : '#3f78b0', -44, 14, 100, 14); for (let k = 0; k < 4; k++) R('#c8e8ff66', -38 + k * 26 + Math.sin(t / 400 + k) * 4, 18 + (k % 2) * 5, 10, 2);
      R('#8a8a96', -46, 10, 62, 6); R('#6a6a78', -46, 14, 62, 2); for (let k = 0; k < 4; k++) R('#4a4a56', -42 + k * 16, 16, 3, 10);
      sh(-42, 10, 30); R('#b8c0c8', -42, -6, 30, 16); R('#3f78b0', -44, -10, 34, 5); for (let k = 0; k < 7; k++) R('#2f5a8a', -42 + k * 5, -10, 1, 5); R('#4a5a6a', -34, 0, 10, 10); R(lit, -20, -2, 5, 5);
      R('#c8404a', -8, 0, 12, 10); R('#3f8fd0', -8, -8, 12, 8); R('#e8a030', 4, 2, 10, 8); R('#0b0c1655', -8, 0, 22, 1);
      R('#e8c030', 20, -34, 4, 44); R('#b89820', 22, -34, 2, 44); R('#e8c030', 6, -36, 44, 4); R('#b89820', 6, -33, 44, 1); R('#4a4a56', 40 + Math.round(Math.sin(t / 900) * 4), -32, 1, 16); R('#c8404a', 38 + Math.round(Math.sin(t / 900) * 4), -18, 6, 5); R(fl ? '#ff5f57' : '#7a2a2a', 21, -38, 2, 2);
      const bx = 34 + Math.round(Math.sin(t / 700) * 3); R('#e8e4d8', bx, 17, 22, 6); R('#c8404a', bx, 21, 22, 2); R('#e8e4d8', bx + 4, 10, 9, 7); R('#3a5a7a', bx + 6, 12, 5, 3); R('#4a4a56', bx + 16, 6, 1, 11); R(fl ? '#6fd08c' : '#2a6a3a', bx + 15, 5, 3, 2);
    } else if (v === 'field') { // 읍내: 비닐하우스, 양옥, 물탱크와 전봇대
      for (let k = 0; k < 4; k++) R(k % 2 ? '#a8a050' : '#6f9e4a', -44 + k * 4, 19 + k * 3, 96 - k * 8, 3);
      for (let k = 0; k < 3; k++) { ell(x, '#c8d8d8', p.x - 32 + k * 16, p.y + 18, 8, 12, true); ell(x, '#eef6f6', p.x - 34 + k * 16, p.y + 16, 4, 7, true); R('#8a9a9a', -40 + k * 16, 16, 16, 2); }
      sh(8, 16, 22); R('#e8e0d0', 8, 0, 22, 16); R('#b8b0a0', 27, 0, 3, 16); R('#c8503a', 6, -4, 26, 5); R('#a03a2a', 6, 0, 26, 1); R(lit, 12, 5, 5, 5); R(lit, 21, 5, 5, 5); R('#5a4630', 17, 9, 4, 7);
      R('#6a6a78', 40, -6, 2, 24); R('#6a6a78', 50, -6, 2, 24); R('#8ab0c8', 36, -22, 20, 16); R('#a8d0e8', 36, -22, 20, 3); R('#5a8098', 52, -22, 4, 16); R('#4a4a56', 44, -26, 4, 4);
      R('#5a4630', -2, -30, 2, 46); R('#5a4630', -8, -28, 14, 2); R('#3a3a44', -8, -26, 1, 3); R('#3a3a44', 5, -26, 1, 3); x.strokeStyle = '#1a1a22'; x.lineWidth = 1; x.beginPath(); x.moveTo(p.x - 8, p.y - 27); x.quadraticCurveTo(p.x - 28, p.y - 18, p.x - 46, p.y - 24); x.moveTo(p.x + 6, p.y - 27); x.quadraticCurveTo(p.x + 22, p.y - 20, p.x + 36, p.y - 22); x.stroke();
    } else if (v === 'bell') { // 구시가: 시계탑과 벽돌 상가
      block(-40, 0, 24, 18, '#a8584a', 3); R('#3a2a20', -40, 12, 24, 6); R(night ? '#ff7ad0' : '#8a4a6a', -37, 13, 10, 3); R(night ? '#7af0ff' : '#4a7a8a', -25, 13, 6, 3);
      block(22, 2, 24, 16, '#b87a4a', 4); R('#3a2a20', 22, 12, 24, 6); R(night ? '#ffd23a' : '#8a7a3a', 26, 13, 14, 3);
      sh(-10, 18, 24); R('#c8b89a', -10, -40, 24, 58); R('#a8987a', 10, -40, 4, 58); R('#8a7a60', -12, -42, 28, 4); tri(x, '#3a5a6a', p.x + 2, p.y - 42, 14, 20); R('#e8c030', 1, -66, 2, 6);
      disc(x, '#2a2438', p.x + 2, p.y - 28, 8); disc(x, night ? '#fff3a0' : '#f5f0e0', p.x + 2, p.y - 28, 6); x.strokeStyle = '#1a1a22'; x.lineWidth = 2; x.beginPath(); x.moveTo(p.x + 2, p.y - 28); x.lineTo(p.x + 2 + Math.cos(t / 4000) * 4, p.y - 28 + Math.sin(t / 4000) * 4); x.moveTo(p.x + 2, p.y - 28); x.lineTo(p.x + 2, p.y - 33); x.stroke();
      for (let k = 0; k < 3; k++) R(lit, -6 + (k % 2) * 10, -14 + k * 9, 4, 5); R('#5a4630', -2, 8, 8, 10);
    } else if (v === 'school') { // 대학가: 본관, 유리 도서관, 천문대
      block(-34, -2, 44, 20, '#a85a4a', 5); R('#e8e0d0', -34, -4, 44, 3); R('#e8e0d0', -18, -14, 12, 12); tri(x, '#7a5ac8', p.x - 12, p.y - 14, 9, 8); R(lit, -15, -10, 6, 6); R('#e8e0d0', -16, 8, 8, 10); R('#5a4630', -14, 10, 4, 8); R('#4a4a56', -12, -30, 1, 10); x.fillStyle = '#7a5ac8'; x.beginPath(); x.moveTo(p.x - 11, p.y - 30); x.lineTo(p.x - 3 + Math.sin(t / 220) * 2, p.y - 27); x.lineTo(p.x - 11, p.y - 24); x.fill();
      sh(14, 18, 22); R(night ? '#6ab8e8' : '#3a6a8a', 14, -10, 22, 28); for (let k = 0; k < 4; k++) R('#c8e8ff', 14 + k * 6, -10, 1, 28); for (let k = 0; k < 4; k++) R('#c8e8ff', 14, -10 + k * 7, 22, 1); R('#e8e0d0', 12, -12, 26, 3);
      sh(40, 18, 14); R('#d8d0e8', 40, 2, 14, 16); ell(x, '#a884ff', p.x + 47, p.y + 2, 9, 10, true); ell(x, '#c8a8ff', p.x + 44, p.y - 1, 4, 5, true); R('#2a2438', 47, -8, 2, 8); R(lit, 44, 8, 5, 5);
    } else { // 주둔지: 담, 막사, 감시탑, 레이더, 차단기
      R('#8a8c98', -44, 2, 98, 16); R('#a8aab6', -44, 2, 98, 2); R('#6a6c78', -44, 14, 98, 4); for (let k = 0; k < 17; k++) R('#c8cad4', -43 + k * 6, -1, 2, 3); R('#5a5c68', -44, 0, 98, 1);
      [[-38, -8], [-14, -8]].forEach(([ox, oy]) => { ell(x, '#5a6a3a', p.x + ox + 10, p.y + oy + 12, 12, 14, true); ell(x, '#8a9a58', p.x + ox + 7, p.y + oy + 9, 6, 8, true); R('#2a3020', ox + 6, oy + 4, 8, 8); R(night ? '#ffd870' : '#4a5438', ox + 8, oy + 5, 4, 3); });
      R('#8a6a44', 30, -30, 2, 34); R('#8a6a44', 44, -30, 2, 34); for (let k = 0; k < 3; k++) R('#6a4a2c', 30, -22 + k * 9, 16, 1); R('#8a9a58', 26, -42, 24, 12); R('#5a6a3a', 24, -46, 28, 4); R('#2a3020', 30, -38, 16, 5);
      if (night) { const a = Math.sin(t / 1300) * 0.7 + 2.4; x.fillStyle = 'rgba(255,240,170,.16)'; x.beginPath(); x.moveTo(p.x + 30, p.y - 36); x.lineTo(p.x + 30 + Math.cos(a - 0.14) * 90, p.y - 36 + Math.sin(a - 0.14) * 90); x.lineTo(p.x + 30 + Math.cos(a + 0.14) * 90, p.y - 36 + Math.sin(a + 0.14) * 90); x.fill(); } R('#fff3a0', 28, -38, 3, 4);
      R('#7a7c88', 12, -22, 2, 24); const rw = Math.round(Math.cos(t / 600) * 8); R('#e8e8f0', 13 - Math.abs(rw), -30, Math.abs(rw) * 2 + 2, 7); R('#a8aab6', 12, -24, 4, 2);
      R('#6a4a2c', -42, -34, 2, 36); x.fillStyle = '#e8505a'; x.beginPath(); x.moveTo(p.x - 40, p.y - 34); x.lineTo(p.x - 28 + Math.sin(t / 200) * 2, p.y - 30); x.lineTo(p.x - 40, p.y - 26); x.fill();
      R('#2a2c36', -4, 4, 14, 14); for (let k = 0; k < 5; k++) R(k % 2 ? '#f5f5f5' : '#e8505a', -6 + k * 4, 8, 4, 3); R('#e8c030', -8, 4, 3, 10);
    }
    return;
  }

  // 미래
  const glow = night ? 1 : 0.6, cy = '#5fe0f0', pulse = 0.5 + 0.5 * Math.sin(t / 500);
  ell(x, '#04080e', p.x + 6, p.y + 22, 56, 8); ell(x, '#22303c', p.x + 6, p.y + 20, 52, 6); for (let k = 0; k < 7; k++) rect(x, k % 2 ? '#5fe0f0' : '#2f8a9a', p.x - 40 + k * 15, p.y + 24, 3, 1);
  const metal = (ox, oy, w, h, col) => { sh(ox, oy + h, w); R(col, ox, oy, w, h); R(mixc(col, '#ffffff', 0.3), ox, oy, w, 2); R(mixc(col, '#000000', 0.3), ox + w - 3, oy, 3, h); };
  if (v === 'gaet') { // 양식 구역: 빛나는 수조와 펌프탑
    R('#1a2a36', -46, 12, 104, 16); R('#3a4856', -46, 12, 104, 2);
    [[-30, 20, 14], [2, 20, 14], [34, 20, 12]].forEach(([cx, cyy, r], k) => { ell(x, '#0c1820', p.x + cx, p.y + cyy, r + 2, 7); ell(x, k === 1 ? '#2fb8a0' : '#2f9ac8', p.x + cx, p.y + cyy, r, 5); ell(x, '#9ff0e0', p.x + cx - 3 + Math.sin(t / 500 + k) * 3, p.y + cyy - 1, 4, 2); });
    ell(x, 'rgba(159,232,240,.28)', p.x + 2, p.y + 18, 16, 22, true); x.strokeStyle = '#9fe8f0'; x.lineWidth = 1; x.beginPath(); x.ellipse(p.x + 2, p.y + 18, 16, 22, 0, Math.PI, Math.PI * 2); x.stroke();
    metal(-44, -12, 14, 26, '#4a5a6a'); R(cy, -40, -8, 6, 2); R(cy, -40, -2, 6, 2); R('#3a4856', -38, -24, 2, 12); R(fl ? '#ff5f9a' : '#7a2a4a', -39, -26, 4, 2);
    R('#56687a', -30, 4, 62, 3); R('#3a4856', -14, 4, 2, 12); R('#3a4856', 18, 4, 2, 12);
    const bx = 30 + Math.round(Math.sin(t / 700) * 4), by = -8 + Math.round(Math.sin(t / 350) * 2); R('#c8d8e8', bx, by, 20, 6); R('#3a4856', bx + 2, by + 6, 16, 2); R('#4fb0c0', bx + 10, by - 4, 8, 4); R('rgba(95,224,240,.5)', bx + 4, by + 9, 12, 2);
  } else if (v === 'field') { // 경작 돔: 유리 돔 안의 밭
    R('#1a2a36', -46, 16, 104, 4);
    ell(x, '#1c4a34', p.x - 12, p.y + 18, 30, 34, true); for (let k = 0; k < 5; k++) R(k % 2 ? '#6fd04f' : '#3f9a3a', -34 + k * 2, 12 - k * 5, 44 - k * 4, 3); ell(x, 'rgba(159,240,220,.22)', p.x - 12, p.y + 18, 30, 34, true);
    x.strokeStyle = '#9fe8f0'; x.lineWidth = 1; x.beginPath(); x.ellipse(p.x - 12, p.y + 18, 30, 34, 0, Math.PI, Math.PI * 2); x.stroke(); x.strokeStyle = 'rgba(159,232,240,.5)'; [10, 20].forEach(rx => { x.beginPath(); x.ellipse(p.x - 12, p.y + 18, rx, 34, 0, Math.PI, Math.PI * 2); x.stroke(); }); R('rgba(255,255,255,.5)', -30, -4, 4, 8);
    ell(x, '#1c4a34', p.x + 30, p.y + 18, 14, 16, true); ell(x, 'rgba(159,240,220,.25)', p.x + 30, p.y + 18, 14, 16, true); x.strokeStyle = '#9fe8f0'; x.beginPath(); x.ellipse(p.x + 30, p.y + 18, 14, 16, 0, Math.PI, Math.PI * 2); x.stroke(); R('#6fd04f', 24, 12, 12, 3);
    metal(46, -14, 8, 32, '#56687a'); R('#e8c030', 46, -6, 8, 2); R('#e8c030', 46, 4, 8, 2);
    const dx = -12 + Math.round(Math.sin(t / 900) * 18), dy = -30 + Math.round(Math.sin(t / 300) * 2); R('#c8d8e8', dx - 5, dy, 10, 3); R('#3a4856', dx - 8, dy - 1, 4, 1); R('#3a4856', dx + 4, dy - 1, 4, 1); R(fl ? cy : '#2f8a9a', dx - 1, dy + 3, 2, 2);
  } else if (v === 'bell') { // 기록 보관소: 빛줄 흐르는 검은 탑과 떠 있는 고리
    metal(-38, 2, 20, 16, '#3a3040'); R('#f0a04a', -34, 6, 12, 2); R('#f0a04a', -34, 11, 8, 2); metal(24, 6, 20, 12, '#3a3040'); R('#f0a04a', 28, 10, 12, 2);
    sh(-10, 18, 24); for (let dy = 0; dy < 62; dy += 2) { const hw = 7 + Math.round(5 * dy / 62); R('#1c1826', 2 - hw, -44 + dy, hw * 2, 2); R('#2e2838', 2 - hw, -44 + dy, 2, 2); }
    for (let k = 0; k < 3; k++) for (let dy = 0; dy < 54; dy += 4) { const on = ((dy * 3 + k * 17 + Math.floor(t / 160)) % 11) < 5; R(on ? '#ffd870' : '#7a4a20', -2 + k * 4, -38 + dy, 2, 2); }
    x.globalAlpha = (0.55 + 0.45 * pulse) * glow; x.strokeStyle = '#ffb347'; x.lineWidth = 2; x.beginPath(); x.ellipse(p.x + 2, p.y - 54 + Math.sin(t / 600) * 2, 14, 4, 0, 0, 7); x.stroke(); x.globalAlpha = 1; R('#fff3a0', 1, -62, 2, 4);
  } else if (v === 'school') { // 연구 단지: 받침 위의 고리와 첨탑
    metal(-34, 6, 68, 12, '#4a4a6a'); for (let k = 0; k < 8; k++) R(k % 3 ? '#c8a8ff' : cy, -30 + k * 8, 10, 4, 3);
    R('#6a6a8a', -22, -8, 3, 14); R('#6a6a8a', 19, -8, 3, 14); R('#d8d0e8', -2, -40, 4, 46); R('#a884ff', -1, -46, 2, 6); R(fl ? '#ffffff' : '#c8a8ff', -1, -48, 2, 2);
    x.strokeStyle = '#8a7ab8'; x.lineWidth = 5; x.beginPath(); x.ellipse(p.x, p.y - 12, 30, 9, 0, 0, 7); x.stroke(); x.strokeStyle = '#d8d0e8'; x.lineWidth = 1; x.beginPath(); x.ellipse(p.x, p.y - 13, 30, 9, 0, 0, 7); x.stroke();
    { const a = t / 700; R('#ffffff', Math.cos(a) * 30 - 2, -12 + Math.sin(a) * 9 - 2, 4, 4); R('rgba(168,132,255,.4)', Math.cos(a) * 30 - 4, -12 + Math.sin(a) * 9 - 4, 8, 8); }
    x.globalAlpha = (0.3 + 0.3 * pulse) * glow; ell(x, '#a884ff', p.x, p.y - 12, 12, 5); x.globalAlpha = 1;
    R('#6a6a8a', 42, -4, 2, 22); x.strokeStyle = '#d8d0e8'; x.lineWidth = 2; x.beginPath(); x.arc(p.x + 47, p.y - 8, 8, 2.2, 4.6); x.stroke(); R('#e8c030', 46, -9, 2, 2);
  } else { // 방위 기지: 비스듬한 벽, 포탑 둘, 방패 안테나
    sh(-38, 20, 80); for (let dy = 0; dy < 24; dy += 2) { const hw = 30 + Math.round(10 * dy / 24); R(dy % 8 ? '#4a5462' : '#56606e', 2 - hw, -4 + dy, hw * 2, 2); } R('#6a7482', -28, -4, 60, 2); for (let k = 0; k < 5; k++) R(fl && k % 2 ? '#ff5f57' : '#7a2a2a', -24 + k * 12, 2, 4, 2);
    R('#1a2028', -6, 8, 18, 12); R('#e8c030', -6, 8, 18, 2); for (let k = 0; k < 3; k++) R('#e8c030', -4 + k * 6, 12, 3, 6);
    [[-34, -16, 1], [28, -16, -1]].forEach(([ox, oy, dir], k) => { R('#3a4452', ox, oy, 16, 14); R('#56606e', ox, oy, 16, 2); ell(x, '#6a7482', p.x + ox + 8, p.y + oy, 9, 9, true); const a = (dir > 0 ? Math.PI : 0) + dir * (0.5 + Math.sin(t / 1100 + k * 2) * 0.35); x.strokeStyle = '#8a94a2'; x.lineWidth = 3; x.beginPath(); x.moveTo(p.x + ox + 8, p.y + oy - 5); x.lineTo(p.x + ox + 8 + Math.cos(a) * 16, p.y + oy - 5 - Math.abs(Math.sin(a)) * 16); x.stroke(); R(fl ? '#ff5f57' : '#7a2a2a', ox + 7, oy + 5, 2, 2); });
    R('#6a7482', 1, -34, 2, 30); x.globalAlpha = (0.35 + 0.35 * pulse) * glow; x.strokeStyle = cy; x.lineWidth = 2; [8, 14].forEach(r => { x.beginPath(); x.arc(p.x + 2, p.y - 34, r, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }); x.globalAlpha = 1; R(cy, 0, -36, 4, 3);
  }
}
