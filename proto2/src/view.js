// 옛 것의 둥지 — 새 판 시험: 화면. 땅의 단면을 보여 주고, 손가락으로 끌어 둘러본다.
const B = BURROW, TS = 8, $ = id => document.getElementById(id);
const SPECIES = { abyss: ['', '젖은 것', '등불 아귀', '바닥 갑주', '해구의 주인'], nebula: ['', '빛나는 것', '눈 품은 수정', '도는 고리', '틈을 여는 자'], brood: ['', '불어나는 것', '걷는 버섯', '알 품은 어미', '낳는 숲'], dusk: ['', '속삭이는 것', '줄 달린 인형', '막 두른 나방', '막의 연출가'], hunger: ['', '씹는 것', '굶은 짐승', '솟은 목구멍', '마지막 한 입'] };
const ASPCOL = { abyss: '#3fb8d0', nebula: '#b08fff', brood: '#7fd04f', dusk: '#f0a04a', hunger: '#f2696f' };
let S = null, V = { cx: 0, cy: 0, z: 3, speed: 1, paused: false, acc: 0, last: 0, drag: null, card: false, frame: 0 };
const wc = document.createElement('canvas'); wc.width = B.W * TS; wc.height = B.H * TS; const wx = wc.getContext('2d');
const hash = (a, b) => { let n = Math.imul(a + 3, 374761393) ^ Math.imul(b + 11, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const solidAt = (x, y) => x < 0 || y < 0 || x >= B.W || y >= B.H || (S.g[B.idx(x, y)] !== B.T.AIR && S.g[B.idx(x, y)] !== B.T.SKY);

// ---------- 땅 한 칸 ----------
const SKYC = ['#1c1a3e', '#241e48', '#2f2454', '#3e2a5e', '#523166', '#6a3a6a', '#85466a', '#a25664', '#bf6a5c', '#d98456'];
function drawTile(i) {
  const x = i % B.W, y = (i - x) / B.W, t = S.g[i], px = x * TS, py = y * TS, T = B.T, r = (a, b, w, h, c) => { wx.fillStyle = c; wx.fillRect(px + a, py + b, w, h); };
  if (t === T.SKY) { r(0, 0, TS, TS, SKYC[Math.min(9, y)]); if (hash(x, y) < 0.05 && y < 6) r(3, 3, 1, 1, '#ffffff'); return; }
  if (t === T.AIR) { r(0, 0, TS, TS, '#110d17'); if (hash(x, y) < 0.3) r(2 + Math.floor(hash(y, x) * 4), 2 + Math.floor(hash(x + 5, y) * 4), 1, 1, '#1b1524');
    if (solidAt(x, y - 1)) { r(0, 0, TS, 2, '#08060c'); } if (solidAt(x, y + 1)) { r(0, TS - 2, TS, 1, '#7a6676'); r(0, TS - 1, TS, 1, '#4a3c4c'); } if (solidAt(x - 1, y)) r(0, 0, 1, TS, '#3a2e40'); if (solidAt(x + 1, y)) r(TS - 1, 0, 1, TS, '#2a2030'); return; }
  const d = Math.min(1, (y - B.SKY) / (B.H - B.SKY)), base = mixh('#4a3440', '#221a2a', d);
  if (t === T.BED) { r(0, 0, TS, TS, '#0b090f'); if (hash(x, y) < 0.4) r(2, 5, 2, 1, '#18141e'); return; }
  r(0, 0, TS, TS, base); const h1 = hash(x, y), h2 = hash(y + 9, x + 4);
  r(Math.floor(h1 * 6), Math.floor(h2 * 6), 2, 1, mixh(base, '#000000', 0.28)); r(Math.floor(h2 * 6), 1 + Math.floor(h1 * 5), 1, 1, mixh(base, '#b89ab0', 0.22)); if (h1 > 0.8) { r(4, 5, 3, 2, mixh(base, '#8a7a8a', 0.3)); r(4, 6, 3, 1, mixh(base, '#000000', 0.3)); }
  if (y % 7 === 3) r(0, 4, TS, 1, mixh(base, '#000000', 0.12));
  if (t === T.GRASS) { r(0, 0, TS, 3, '#2f6b3a'); r(0, 0, TS, 1, '#4a9a52'); r(Math.floor(h1 * 6), 0, 1, 1, '#7fd04f'); r(0, 3, TS, 1, '#1f4a28'); }
  if (t === T.ROCK) { r(0, 0, TS, TS, '#3d3a4c'); r(0, 0, TS, 1, '#6a667e'); r(0, 0, 1, TS, '#565268'); r(0, TS - 1, TS, 1, '#262430'); r(TS - 1, 0, 1, TS, '#2c2a38'); if (h1 > 0.5) r(3, 3, 2, 1, '#262430'); }
  if (t === T.FOOD && S.seen[i]) { r(2, 3, 5, 3, '#8a7a50'); r(2, 2, 4, 3, '#e8dcb0'); r(3, 2, 2, 1, '#fff8dc'); r(3, 4, 1, 1, '#b8a878'); r(5, 3, 1, 1, '#b8a878'); r(6, 4, 1, 1, '#3a2a20'); }
  if (t === T.GEM && S.seen[i]) { r(3, 1, 2, 6, '#3f8a9a'); r(2, 3, 4, 2, '#3f8a9a'); r(3, 2, 1, 3, '#9fe8f0'); r(4, 2, 1, 1, '#ffffff'); }
}
function redrawAll() { for (let i = 0; i < B.W * B.H; i++) drawTile(i); S.dirty.length = 0; }
function flushDirty() { if (!S.dirty.length) return; const seen = new Set(); for (const i of S.dirty) { const x = i % B.W, y = (i - x) / B.W; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= B.W || ny >= B.H) continue; const n = B.idx(nx, ny); if (!seen.has(n)) { seen.add(n); drawTile(n); } } } S.dirty.length = 0; }

// ---------- 움직이는 것들의 그림 ----------
const SPR = {};
const heroPal = () => PAL[S.hero.main] || PAL.base;
function kinSprite(kind, fr) { const P = heroPal(), key = kind + ':' + (S.hero.main || 'base') + ':' + fr; if (SPR[key]) return SPR[key]; const K = Sculpt(8);
  if (kind === 'w') { K.px(2 + fr, 7, P[0]); K.px(5 + fr, 7, P[0]); K.B(4, 4.4, 3, 2.6, P); K.px(3, 4, '#ffffff'); K.px(4, 4, INKY); K.px(4, 1 - 0, P[1]); K.px(4, 0 + fr, P[2]); }
  else { K.px(2 + fr, 7, P[0]); K.px(5 - fr, 7, P[0]); K.px(1, 1, '#f2e9c9'); K.px(6, 1, '#f2e9c9'); K.px(1, 2, '#cfc8b4'); K.px(6, 2, '#cfc8b4'); K.B(4, 4, 3.4, 3, [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)]); K.px(3, 3, '#ff5f57'); K.px(5, 3, '#ff5f57'); K.px(3, 5 + fr, '#fbf7ea'); K.px(5, 5 + fr, '#fbf7ea'); }
  return (SPR[key] = K.canvas()); }
const FOE = ['..hhhh..', '..ssss.f', '..sees.f', '.cccccct', '.cccccc.', '..cccc..', '..l..l..', '..l..l..'];
function foeSprite(fr) { const key = 'foe' + fr; if (SPR[key]) return SPR[key]; const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d'), pal = { h: '#5a4630', s: '#e8b890', e: '#1b1d2a', c: '#3f6b46', l: '#3a2a20', t: '#7a5a3a', f: fr ? '#ffd23a' : '#ff7a2a' }; FOE.forEach((row, yy) => { for (let k = 0; k < 8; k++) if (pal[row[k]]) { x.fillStyle = pal[row[k]]; x.fillRect(k, yy + (yy > 5 && fr && k === 2 ? 0 : 0), 1, 1); } }); return (SPR[key] = c); }
function heroSprite(fr) { const h = S.hero, key = 'hero:' + h.stage + ':' + h.main + ':' + h.sub + ':' + fr; if (SPR[key]) return SPR[key]; const st = h.stage, N = [32, 32, 40, 48, 52][st], K = Sculpt(N), P = heroPal(), Q = (h.sub && PAL[h.sub]) || P, A = FORMS[st ? h.main + st : 'base'](K, st, P, Q, fr); if (st >= 2 && h.sub) subOrgan(K, h.sub, Q, A, st, fr); return (SPR[key] = K.canvas()); }
function previewSprite(stage, main, sub) { const N = [32, 32, 40, 48, 52][stage], K = Sculpt(N), P = PAL[main], Q = (sub && PAL[sub]) || P, A = FORMS[main + stage](K, stage, P, Q, 0); if (stage >= 2 && sub) subOrgan(K, sub, Q, A, stage, 0); return K.canvas().toDataURL(); }

// ---------- 그리기 ----------
function draw() {
  const c = $('bw-cv'), dpr = window.devicePixelRatio || 1, bw = Math.round(c.clientWidth * dpr), bh = Math.round(c.clientHeight * dpr); if (!bw || !bh) return; if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
  const x = c.getContext('2d'), k = V.z * dpr, vw = bw / k, vh = bh / k; x.imageSmoothingEnabled = false; flushDirty();
  V.cx = Math.max(vw / 2 - 16, Math.min(wc.width - vw / 2 + 16, V.cx)); V.cy = Math.max(vh / 2 - 8, Math.min(wc.height - vh / 2 + 8, V.cy));
  const ox = Math.round((V.cx - vw / 2) * k) / k, oy = Math.round((V.cy - vh / 2) * k) / k; x.setTransform(k, 0, 0, k, -ox * k, -oy * k);
  x.fillStyle = '#07050a'; x.fillRect(ox, oy, vw, vh); x.drawImage(wc, 0, 0);
  const t = S.t, fr2 = Math.floor(performance.now() / 260) % 2, fr4 = Math.floor(performance.now() / 240) % 4, h = S.hero;
  // 팔 자리와 부름
  const x0 = Math.max(0, Math.floor(ox / TS)), x1 = Math.min(B.W - 1, Math.ceil((ox + vw) / TS)), y0 = Math.max(0, Math.floor(oy / TS)), y1 = Math.min(B.H - 1, Math.ceil((oy + vh) / TS));
  x.fillStyle = 'rgba(232,192,48,.30)'; for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) if (S.want[B.idx(xx, yy)]) { x.fillRect(xx * TS + 3, yy * TS + 3, 2, 2); }
  S.marks.forEach(m => { x.fillStyle = '#e8c030'; x.fillRect(m.x * TS + 3, m.y * TS - 2 - fr2, 1, 8); x.fillRect(m.x * TS + 4, m.y * TS - 2 - fr2, 4, 3); });
  // 본체: 방 바닥에 앉아 있다
  { const sp = heroSprite(fr4), bx = h.x * TS + 4 - sp.width / 2, by = (h.y + 3) * TS - sp.height + (S.t - (h.hurt || -9) < 0.2 ? 1 : 0);
    const g = x.createRadialGradient(h.x * TS + 4, h.y * TS, 4, h.x * TS + 4, h.y * TS, 70); g.addColorStop(0, (h.main ? ASPCOL[h.main] : '#cfeee0') + '30'); g.addColorStop(1, '#00000000'); x.fillStyle = g; x.fillRect(h.x * TS - 70, h.y * TS - 70, 148, 140);
    x.drawImage(sp, Math.round(bx), Math.round(by)); }
  S.items.forEach(o => { x.fillStyle = '#8a2028'; x.fillRect(o.x * TS + 1, o.y * TS + 5, 6, 2); x.fillStyle = '#e8b890'; x.fillRect(o.x * TS + 2, o.y * TS + 4, 2, 2); });
  const pos = e => [(e.fx + (e.x - e.fx) * e.mt) * TS, (e.fy + (e.y - e.fy) * e.mt) * TS];
  for (const m of S.kin) { const [ex, ey] = pos(m), moving = m.mt < 1 || (m.path && m.path.length), digging = t - (m.dig || -9) < 0.25; x.drawImage(kinSprite(m.kind, moving ? fr2 : 0), Math.round(ex), Math.round(ey + (digging && fr2 ? -1 : 0))); if (m.carry) { x.fillStyle = m.carry > 10 ? '#9fe8f0' : '#e8dcb0'; x.fillRect(Math.round(ex) + 3, Math.round(ey) - 2, 3, 2); } }
  for (const f of S.foes) { const [ex, ey] = pos(f); x.drawImage(foeSprite(fr2), Math.round(ex), Math.round(ey)); x.fillStyle = '#0b0c16'; x.fillRect(Math.round(ex), Math.round(ey) - 3, 8, 2); x.fillStyle = '#ff5f57'; x.fillRect(Math.round(ex), Math.round(ey) - 3, Math.max(0, 8 * f.hp / f.mhp), 1); }
  // 반짝임
  for (const f of S.fx) { const a = t - f.t; if (a > 0.6) continue; const fxp = f.x * TS + 4, fyp = f.y * TS + 4;
    if (f.k === 'dig') { x.fillStyle = '#b89ab0'; for (let q = 0; q < 3; q++) x.fillRect(fxp + (q - 1) * (3 + a * 14), fyp - a * 10 + q, 1, 1); }
    if (f.k === 'hit') { x.fillStyle = '#fff3a0'; x.fillRect(fxp - 3, fyp, 7, 1); x.fillRect(fxp, fyp - 3, 1, 7); }
    if (f.k === 'die') { x.fillStyle = 'rgba(200,48,58,' + (1 - a / 0.6) + ')'; x.fillRect(fxp - 3 - a * 6, fyp + 2, 2, 2); x.fillRect(fxp + 2 + a * 6, fyp + 1, 2, 2); x.fillRect(fxp, fyp - 2 - a * 6, 2, 2); }
    if (f.k === 'bud' || f.k === 'eat') { x.strokeStyle = f.k === 'bud' ? '#fff3a0' : '#7fd04f'; x.globalAlpha = 1 - a / 0.6; x.lineWidth = 1; x.strokeRect(fxp - 6 - a * 16, fyp - 4 - a * 12, 12 + a * 32, 8 + a * 24); x.globalAlpha = 1; }
    if (f.k === 'molt') { x.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - a / 0.6)) + ')'; x.fillRect(ox, oy, vw, vh); } }
  // 가장자리 어둠
  x.setTransform(1, 0, 0, 1, 0, 0); const g2 = x.createRadialGradient(bw / 2, bh / 2, Math.min(bw, bh) * 0.35, bw / 2, bh / 2, Math.max(bw, bh) * 0.75); g2.addColorStop(0, 'rgba(5,3,12,0)'); g2.addColorStop(1, 'rgba(5,3,12,.55)'); x.fillStyle = g2; x.fillRect(0, 0, bw, bh);
}

// ---------- 글자로 된 것들 ----------
const R = v => Math.round(v).toLocaleString('ko-KR');
function hud() {
  const h = S.hero, need = h.stage < 4 ? B.K.molt[h.stage] : 0, name = h.stage === 0 ? '옛 것?' : SPECIES[h.main][h.stage], w = B.count(S, 'w'), s = B.count(S, 's');
  $('bw-hud').innerHTML = `<div class="bw-name"><b style="color:${h.main ? ASPCOL[h.main] : 'inherit'}">${name}</b> <small>${B.STAGE[h.stage]}</small></div>
    <div class="bw-stats"><span title="살: 권속을 돋우는 데 쓴다"><i class="bw-dot" style="background:#e8dcb0"></i>살 <b>${R(h.bio)}</b></span><span title="일움 / 이빨움 / 거느릴 수 있는 수">권속 <b>${w}</b>+<b>${s}</b><small>/${B.kinCap(S)}</small></span><span title="판 칸">굴 <b>${S.dug}</b></span></div>
    <div class="bw-bars"><span class="bw-bar" title="본체 체력"><i style="width:${Math.max(0, 100 * h.hp / h.mhp)}%;background:#6fd08c"></i></span>${need ? `<span class="bw-bar" title="다음 허물까지"><i style="width:${Math.min(100, 100 * h.eaten / need)}%;background:${h.main ? ASPCOL[h.main] : '#e8c030'}"></i></span>` : ''}</div>`;
  const rdy = B.ready(S), L = S.log[0];
  $('bw-log').textContent = L ? L.s : '';
  $('bw-ctl').innerHTML = `<div class="bw-seg" role="group" aria-label="권속의 기울기">${['파기', '고르게', '지키기'].map((n, k) => `<button class="bw-btn${S.lean === k ? ' on' : ''}" data-a="lean" data-v="${k}">${n}</button>`).join('')}</div>
    <div class="bw-seg"><button class="bw-btn${V.paused ? ' on' : ''}" data-a="pause" aria-label="${V.paused ? '다시 흐르게' : '멈춤'}">${V.paused ? '▶' : '⏸'}</button>${[1, 2, 4].map(v => `<button class="bw-btn${V.speed === v ? ' on' : ''}" data-a="speed" data-v="${v}">${v}배</button>`).join('')}</div>
    <div class="bw-seg"><button class="bw-btn" data-a="zoom" data-v="-1" aria-label="멀리">−</button><button class="bw-btn" data-a="zoom" data-v="1" aria-label="가까이">＋</button><button class="bw-btn" data-a="home">본체</button></div>
    ${rdy ? '<button class="bw-btn pri" data-a="open">밖으로 뚫는다</button>' : S.breach === 1 ? '<span class="bw-note">위로 파는 중</span>' : S.breach === 2 ? `<span class="bw-note">땅 위의 무리 ${S.wave}번째 · 다음 ${Math.max(0, Math.ceil(S.waveT))}초</span>` : `<span class="bw-note">${h.stage < 1 ? '첫 허물을 벗으면' : '굴이 ' + B.K.ready + '칸이 되면'} 밖으로 뚫을 수 있다</span>`}`;
}
function modal(html) { $('bw-modal').innerHTML = `<div class="bw-sheet">${html}</div>`; $('bw-modal').hidden = false; }
function closeModal() { $('bw-modal').hidden = true; $('bw-modal').innerHTML = ''; }
function moltModal() { const m = S.molt, h = S.hero; if (!m || !m.choices) return;
  modal(`<h2>${B.STAGE[m.stage]}</h2><p class="bw-mute">${m.stage === 1 ? '몸이 허물 속에서 뒤척인다. 무엇이 되어 나올 것인가.' : '또 한 번. 이번에는 무엇이 섞여 돋을 것인가.'}</p><div class="bw-opts">${m.choices.map(a => { const main = m.stage === 1 ? a : h.main, sub = m.stage === 1 ? null : a; return `<button class="bw-opt" data-a="molt" data-v="${a}"><img class="bw-px" src="${previewSprite(m.stage, main, sub)}" width="${[0, 64, 80][m.stage]}" height="${[0, 64, 80][m.stage]}" alt=""><span><b style="color:${ASPCOL[a]}">${B.ASP[a]}${m.stage === 1 ? ' · ' + SPECIES[a][1] : ' 섞임'}</b><small>${B.GIFT[a]}</small></span></button>`; }).join('')}</div>`); }
function overModal() { modal(`<h2>한 방울로 돌아갔다</h2><p class="bw-mute">${Math.floor(S.t / 60)}분 ${Math.floor(S.t % 60)}초를 버텼다. 굴 ${S.dug}칸, 돋운 권속 ${S.stats.born}, 쓰러뜨린 것 ${S.stats.slain}.</p><div class="bw-row"><button class="bw-btn pri" data-a="restart">다시 떨어진다</button></div>`); }
function introModal() { modal(`<h2>땅속 한 칸</h2><p>별에서 떨어진 한 방울이 땅속 깊이 박혔다. 몸에서 작은 것들이 돋아나 굴을 파고 먹이를 물어 온다.</p><p class="bw-mute">너는 하나하나 시키지 않는다. 화면을 끌어 둘러보고, 흙을 눌러 그쪽을 파게 부르고, 아래에서 기울기를 고른다. 먹이가 차면 허물을 벗는다. 굴이 넉넉해지면 밖으로 뚫는다.</p><div class="bw-row"><button class="bw-btn pri" data-a="close">시작</button></div>`); }

// ---------- 흐름 ----------
function start(seed) { S = B.newWorld(seed || ((Date.now() ^ (Math.random() * 1e9)) >>> 0)); for (const k in SPR) delete SPR[k]; redrawAll(); V.cx = S.hero.x * TS + 4; V.cy = S.hero.y * TS; V.paused = false; V.acc = 0; hud(); }
function loop(now) {
  const dt = Math.min(0.25, (now - (V.last || now)) / 1000); V.last = now;
  if (S && !V.paused && !S.over && !S.molt && $('bw-modal').hidden) { V.acc += dt * V.speed; let n = 0; while (V.acc >= B.DT && n++ < 40) { V.acc -= B.DT; const st0 = S.hero.stage; B.tick(S); if (S.hero.stage !== st0) { for (const k in SPR) delete SPR[k]; } if (S.molt || S.over) break; } }
  if (S) { if (S.molt && S.molt.choices && $('bw-modal').hidden) moltModal(); if (S.over && $('bw-modal').hidden) overModal(); draw(); if (++V.frame % 6 === 0) hud(); }
  requestAnimationFrame(loop);
}
function tileAt(clientX, clientY) { const c = $('bw-cv'), q = c.getBoundingClientRect(), vw = q.width / V.z, vh = q.height / V.z, axp = V.cx - vw / 2 + (clientX - q.left) / V.z, ayp = V.cy - vh / 2 + (clientY - q.top) / V.z; return [Math.floor(axp / TS), Math.floor(ayp / TS)]; }
function onAction(el) { const a = el.dataset.a, v = el.dataset.v;
  if (a === 'lean') S.lean = +v; if (a === 'pause') V.paused = !V.paused; if (a === 'speed') { V.speed = +v; V.paused = false; } if (a === 'zoom') V.z = Math.max(1, Math.min(5, V.z + +v)); if (a === 'home') { V.cx = S.hero.x * TS + 4; V.cy = S.hero.y * TS; }
  if (a === 'open') B.openUp(S); if (a === 'molt') { B.applyMolt(S, v); for (const k in SPR) delete SPR[k]; closeModal(); } if (a === 'restart') { closeModal(); start(); } if (a === 'close') closeModal(); hud(); }
function boot() {
  document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el) onAction(el); });
  const c = $('bw-cv'), pts = new Map();
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); V.drag = { x: e.clientX, y: e.clientY, cx: V.cx, cy: V.cy, moved: 0, t: performance.now(), pinch: pts.size > 1 ? Math.hypot(...[...pts.values()].slice(0, 2).reduce((a, p, k) => k ? [a[0] - p.x, a[1] - p.y] : [p.x, p.y], [0, 0])) : 0, z0: V.z }; });
  c.addEventListener('pointermove', e => { if (!V.drag || !pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size > 1) { const [p, q] = [...pts.values()], d = Math.hypot(p.x - q.x, p.y - q.y); if (V.drag.pinch) V.z = Math.max(1, Math.min(5, Math.round(V.drag.z0 * d / V.drag.pinch))); else { V.drag.pinch = d; V.drag.z0 = V.z; } V.drag.moved = 99; return; } const dx = e.clientX - V.drag.x, dy = e.clientY - V.drag.y; V.drag.moved = Math.max(V.drag.moved, Math.abs(dx) + Math.abs(dy)); V.cx = V.drag.cx - dx / V.z; V.cy = V.drag.cy - dy / V.z; });
  const up = e => { const d = V.drag; pts.delete(e.pointerId); if (!pts.size) V.drag = null; if (d && d.moved < 8 && performance.now() - d.t < 500 && S && !S.over) { const [tx, ty] = tileAt(e.clientX, e.clientY); if (B.mark(S, tx, ty)) hud(); } };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', e => { pts.delete(e.pointerId); if (!pts.size) V.drag = null; });
  c.addEventListener('wheel', e => { e.preventDefault(); V.z = Math.max(1, Math.min(5, V.z + (e.deltaY < 0 ? 1 : -1))); }, { passive: false });
  document.addEventListener('keydown', e => { if (e.key === ' ') { V.paused = !V.paused; e.preventDefault(); hud(); } });
  V.z = Math.min(window.innerWidth, window.innerHeight) < 520 ? 3 : 3;
  start(); introModal(); requestAnimationFrame(loop);
  window.__bw = { get S() { return S; }, V, B, start, draw, hud };
}
boot();
