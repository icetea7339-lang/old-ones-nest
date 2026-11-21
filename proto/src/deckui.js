// 옛 것의 둥지 — 덱 판 화면 (시험판). 규칙은 deck.js(DECK), 카드는 cards.js(CARDS). 이 파일은 그리기와 누르기만 한다.
// 화면: 위 한 줄(막·밤 · 진액 · 체력 · 메뉴) / 큰 지도 / 아래(낮: 행동 단추 줄, 밤: 손패 부채꼴) / 아래에서 올라오는 창 / 덮개 화면.
// 진행은 META.deck(해금·말 배우기)과 store 'deckrun'(낮에만 저장, 밤 도중에 나가면 그날 낮부터 다시)에 남는다.
const DKU = { R: null, sel: null, pick: null, pickUid: null, sheet: null, raf: 0, pos: {}, floats: [], hl: [], snap: null, lpT: 0, lpFired: false, busy: false, evi: 0, filter: 'all', boot: false };
const dkMeta = () => { if (!META.deck) META.deck = DECK.newMeta(); return META.deck; };
const dk$ = id => document.getElementById(id);
const dkSnd = k => { try { sfx(k); } catch (e) { /* 소리는 없어도 된다 */ } };
const dkMus = k => { if (typeof music === 'function') music(k); };
function dkSave() {
  const R = DKU.R; if (!R) return; if (R.phase === 'over') { store.del('deckrun'); return; } if (R.N) return;
  const m = R.meta; R.meta = null; try { store.set('deckrun', R); } finally { R.meta = m; } saveMeta();
}
function dkLoad() { const R = store.get('deckrun'); if (!R || !R.cells) return null; R.meta = dkMeta(); return R; }

// ---------------- 카드 그림 (24×24, 몸의 부위) ----------------
const DKART = {};
const DKCOL = { abyss: '#3fb8d0', nebula: '#b08fff', brood: '#7fd04f', dusk: '#f0a04a', hunger: '#f47c81', none: '#c8c0b0' };
const DKDARK = { abyss: '#0d3a48', nebula: '#2e2250', brood: '#21401a', dusk: '#4a2c10', hunger: '#4a1418', none: '#3a3640' };
function dkMotif(v) {
  if (v.type === 'curse') return 'thorn';
  const o = (v.ops && v.ops[0] && v.ops[0][0]) || (v.hooks && Object.values(v.hooks)[0] && Object.values(v.hooks)[0][0] && Object.values(v.hooks)[0][0][0]) || '';
  return { swallow: 'maw', dmg: 'teeth', dmgPer: 'teeth', inf: 'spore', infect2: 'spore', spawn: 'egg', rise: 'egg', mind: 'eye', mindPer: 'eye', mad: 'eye', push: 'wave', pull: 'wave', hold: 'tent', heal: 'pulse', healKin: 'pulse', block: 'shell', draw: 'star', energy: 'star', ess: 'drop', eat: 'drop', mark: 'brand', buff: 'pulse', curse: 'thorn' }[o] || (v.type === 'organ' ? 'maw' : 'star');
}
function dkArtCanvas(v) {
  const key = v.type === 'kin' ? 'k:' + v.kin + ':' + (v.stage || 0) + ':' + (v.secretId || '') : v.id + ':' + dkMotif(v);
  if (DKART[key]) return DKART[key];
  if (v.type === 'kin' && v.kin && typeof kinCanvas === 'function') { try { return (DKART[key] = kinCanvas(v.kin, v.stage || 0, v.secretId || null)); } catch (e) { /* 아래 그림으로 */ } }
  const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'), col = DKCOL[v.asp] || DKCOL.none, dk = DKDARK[v.asp] || DKDARK.none;
  const r = (a, b, w, h, k) => { x.fillStyle = k; x.fillRect(a, b, w, h); }, disc = (cx, cy, rr, k) => { x.fillStyle = k; for (let j = -rr; j <= rr; j++) { const w = Math.round(Math.sqrt(rr * rr - j * j)); x.fillRect(cx - w, cy + j, w * 2 + 1, 1); } };
  const m = dkMotif(v);
  if (v.type === 'organ') { disc(12, 13, 10, '#120e18'); disc(12, 13, 9, dk); }
  if (m === 'maw') { disc(12, 13, 8, '#07050a'); disc(12, 13, 6, '#2a0a10'); for (let k = 0; k < 6; k++) { r(6 + k * 2, 7 + (k % 2), 1, 3, '#f5efe0'); r(6 + k * 2, 17 - (k % 2), 1, 3, '#f5efe0'); } r(9, 12, 6, 2, '#c8303a'); }
  if (m === 'teeth') { for (let k = 0; k < 5; k++) { x.fillStyle = '#f5efe0'; x.beginPath(); x.moveTo(3 + k * 4, 20); x.lineTo(5 + k * 4, 6 + (k % 2) * 3); x.lineTo(7 + k * 4, 20); x.fill(); } r(2, 20, 20, 2, col); }
  if (m === 'spore') { [[7, 8, 3], [15, 7, 2], [12, 14, 4], [6, 17, 2], [18, 16, 3]].forEach(([a, b, s]) => { disc(a, b, s, col); disc(a - 1, b - 1, Math.max(1, s - 2), '#fff3a0'); }); }
  if (m === 'egg') { [[8, 14], [15, 12], [12, 18]].forEach(([a, b]) => { disc(a, b, 4, '#e8e0c0'); disc(a, b, 3, col); r(a - 1, b - 2, 1, 1, '#fff'); }); }
  if (m === 'eye') { disc(12, 12, 9, '#e8e0d0'); disc(12, 12, 5, col); r(11, 8, 2, 8, '#07050a'); r(9, 9, 2, 1, '#ffffff'); }
  if (m === 'wave') { for (let k = 0; k < 3; k++) for (let i = 0; i < 20; i++) r(2 + i, 7 + k * 5 + Math.round(Math.sin(i * 0.6 + k) * 2), 1, 2, k === 1 ? '#ffffff' : col); }
  if (m === 'tent') { for (let k = 0; k < 3; k++) for (let i = 0; i < 18; i++) disc(5 + k * 7 + Math.round(Math.sin(i * 0.5 + k) * 2), 21 - i, Math.max(1, 2 - Math.floor(i / 8)), i % 4 ? col : dk); }
  if (m === 'pulse') { disc(12, 13, 7, col); disc(12, 13, 4, '#fff3a0'); r(2, 12, 6, 2, col); r(16, 12, 6, 2, col); }
  if (m === 'shell') { disc(12, 13, 9, '#cfc8b4'); disc(12, 13, 7, dk); for (let k = 0; k < 4; k++) r(5, 8 + k * 3, 14, 1, '#cfc8b4'); }
  if (m === 'star') { r(11, 2, 2, 20, col); r(2, 11, 20, 2, col); r(7, 7, 10, 10, dk); disc(12, 12, 3, '#fff3a0'); }
  if (m === 'drop') { for (let j = 0; j < 14; j++) r(12 - Math.round(j / 2), 4 + j, Math.round(j) + 1, 1, col); disc(12, 17, 6, col); r(9, 13, 2, 3, '#ffffff'); }
  if (m === 'brand') { disc(12, 12, 9, dk); r(11, 4, 2, 16, col); r(5, 11, 14, 2, col); disc(12, 12, 3, '#fff3a0'); }
  if (m === 'thorn') { for (let k = 0; k < 6; k++) { x.strokeStyle = k % 2 ? '#5a2a3a' : '#2a1018'; x.lineWidth = 2; x.beginPath(); x.moveTo(12, 12); x.lineTo(12 + Math.cos(k) * 11, 12 + Math.sin(k) * 11); x.stroke(); } disc(12, 12, 4, '#07050a'); r(11, 11, 2, 2, '#c8303a'); }
  return (DKART[key] = c);
}
const dkArtUrl = v => { const c = dkArtCanvas(v); return c.__u || (c.__u = c.toDataURL()); };

// ---------------- 카드 앞면 ----------------
const DKTYPE = { organ: '기관', trap: '부위', kin: '권속', spell: '주문', curse: '저주' };
const DKRAR = { s: '처음', c: '보통', u: '드묾', r: '옛것급', x: '저주' };
function dkView(c) { const v = DECK.view(c); if (v && v.type === 'kin') { v.secretId = c.secret || null; } return v; }
function dkFace(v, o) {
  o = o || {}; if (!v) return '';
  const cost = o.cost != null ? o.cost : v.cost, cls = 'dkc asp-' + v.asp + ' rar-' + v.rar + ' t-' + v.type + (o.cls ? ' ' + o.cls : '') + (o.dim ? ' dim' : '');
  return `<div class="${cls}"${o.d ? ` data-d="${o.d}"` : ''}${o.uid != null ? ` data-uid="${o.uid}"` : ''}${o.i != null ? ` data-i="${o.i}"` : ''}${o.id ? ` data-id="${o.id}"` : ''}><b class="dkc-cost">${v.type === 'curse' ? '✕' : cost}</b><i class="dkc-gem"></i><span class="dkc-art"><img src="${dkArtUrl(v)}" alt=""></span><b class="dkc-nm">${esc(v.name)}</b><span class="dkc-tx">${esc(o.up ? v.textUp || v.text : v.text || '')}</span><em class="dkc-ty">${DKTYPE[v.type] || ''}</em></div>`;
}
const dkDefView = (id, up) => DECK.view({ uid: 0, id, up: up || 0, secret: null, pairNights: 0 });

// ---------------- 뼈대 ----------------
function dkMount() {
  if (dk$('deck')) return;
  const d = document.createElement('div'); d.id = 'deck'; d.hidden = true;
  d.innerHTML = `<div class="dk-top"><b id="dk-when"></b><span id="dk-ess" class="dk-stat"></span><span id="dk-hp" class="dk-stat"></span><button class="btn sm" data-d="menu" aria-label="메뉴">≡</button></div>
<div class="dk-mapw" id="dk-mapw"><canvas id="dk-cv"></canvas><div id="dk-chips"></div><div id="dk-floats"></div><div id="dk-banner" hidden></div><div id="dk-tip" hidden></div></div>
<div id="dk-low"></div><div id="dk-sheet" hidden></div><div id="dk-ov" hidden></div><div id="dk-toast" hidden></div>`;
  document.body.appendChild(d);
  d.addEventListener('click', dkClick);
  d.addEventListener('pointerdown', dkDown); d.addEventListener('pointerup', dkUp); d.addEventListener('pointercancel', dkUp); d.addEventListener('pointerleave', dkUp);
  d.addEventListener('contextmenu', e => { if (e.target.closest('.dkc')) e.preventDefault(); });
  dk$('dk-cv').addEventListener('click', dkMapTap);
  window.addEventListener('resize', () => { if (!d.hidden) dkSize(); });
  if (window.ResizeObserver) new ResizeObserver(() => { if (!d.hidden && DKU.R) dkSize(); }).observe(dk$('dk-mapw'));
  document.addEventListener('keydown', e => { if (d.hidden) return; if (e.key === 'Escape') { if (DKU.sheet) dkSheet(null); else if (DKU.sel != null) { DKU.sel = null; dkRender(); } } if ((e.key === 'e' || e.key === 'E') && DKU.R && DKU.R.phase === 'night' && !DKU.busy) dkEndTurn(); });
}
function deckOpen() {
  dkMount(); dkMeta(); const t = dk$('title'); if (t) t.hidden = true; const g = dk$('game'); if (g) g.hidden = true;
  dk$('deck').hidden = false; DKU.R = null; dkStart();
}
function dkClose() { cancelAnimationFrame(DKU.raf); DKU.raf = 0; dkSave(); dk$('deck').hidden = true; DKU.R = null; dkSheet(null); dkOv(null); showTitle(); }

// ---------------- 덮개와 창 ----------------
function dkOv(html, cls) { const o = dk$('dk-ov'); if (!html) { o.hidden = true; o.innerHTML = ''; o.className = ''; return; } o.className = cls || ''; o.innerHTML = html; o.hidden = false; o.scrollTop = 0; }
function dkSheet(kind, html) { const s = dk$('dk-sheet'); DKU.sheet = kind; if (!kind) { s.hidden = true; s.innerHTML = ''; return; } s.innerHTML = `<div class="dk-grab"></div><button class="btn sm dk-x" data-d="close" aria-label="닫기">✕</button>${html}`; s.hidden = false; s.scrollTop = 0; }
let dkToastT = 0;
function dkToast(s) { const t = dk$('dk-toast'); t.textContent = s; t.hidden = false; clearTimeout(dkToastT); dkToastT = setTimeout(() => { t.hidden = true; }, 2600); }
function dkBanner(s, col) { const b = dk$('dk-banner'); b.textContent = s; b.style.setProperty('--bc', col || '#e8c030'); b.hidden = false; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); clearTimeout(b.__t); b.__t = setTimeout(() => { b.hidden = true; }, 1600); }
function dkTip(s) { const t = dk$('dk-tip'); if (!s) { t.hidden = true; return; } t.textContent = s; t.hidden = false; }

// ---------------- 시작 화면 ----------------
const DKASP = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
function dkStart(sel) {
  cancelAnimationFrame(DKU.raf); DKU.raf = 0; dkMus('title');
  const saved = dkLoad(), m = dkMeta(), a = sel || DKU.startAsp || 'brood'; DKU.startAsp = a;
  const open = CARDS.LIST.filter(d => d.type !== 'curse' && d.rar !== 's' && CARDS.isOpen(d, m)).length, all = CARDS.LIST.filter(d => d.type !== 'curse' && d.rar !== 's').length;
  const tr = DECK.TRAIT[a], start = (CARDS.START[a] || []).map(id => dkDefView(id));
  dkOv(`<div class="dk-start"><h2>덱 <small>시험판</small></h2><p class="dk-sub">카드로 둥지를 키우고 밤을 막는다</p>
${saved ? `<button class="btn pri dk-wide" data-d="cont">이어하기 <small>${CARDS.ASPN[saved.aspect]} · ${saved.act}막 ${Math.min(saved.night, DECK.K.nights + 1)}밤</small></button>` : ''}
<p class="dk-lab">빛깔을 고른다</p><div class="dk-asps">${DKASP.map(k => `<button class="dk-asp${k === a ? ' on' : ''}" data-d="asp" data-v="${k}" style="--c:${DKCOL[k]}"><i></i>${CARDS.ASPN[k]}</button>`).join('')}</div>
<div class="dk-trait" style="--c:${DKCOL[a]}"><b>${esc(tr.name)}</b><span>${esc(tr.text)}</span></div>
<p class="dk-lab">처음 덱 ${start.length}장</p><div class="dk-row dk-mini">${start.map(v => dkFace(v, { cls: 'mini', d: 'peek', id: v.id })).join('')}</div>
<button class="btn pri dk-wide" data-d="go">${CARDS.ASPN[a]}으로 시작</button>
<div class="dk-row2"><button class="btn" data-d="codex">도감 ${open}/${all}</button><button class="btn" data-d="home">돌아가기</button></div></div>`, 'dk-full');
}
function dkBegin(aspect, seed) {
  store.del('deckrun'); const m = dkMeta();
  DKU.R = DECK.newRun(seed != null ? seed : (Date.now() ^ (Math.random() * 1e9)) >>> 0, { aspect, meta: m });
  DKU.pos = {}; DKU.sel = null; DKU.pick = null; dkOv(null); dkSave(); dkGo();
}
function dkGo() { dkOv(null); dkSheet(null); dkSize(); dkRender(); if (!DKU.raf) DKU.raf = requestAnimationFrame(dkLoop); dkMus(DKU.R.phase === 'night' ? 'night' : 'day'); dkPhase(); }
// 국면이 바뀌면 그에 맞는 덮개
function dkPhase() {
  const R = DKU.R; if (!R) return;
  if (R.phase === 'reward') return dkReward();
  if (R.phase === 'over') return dkOver();
  if (R.phase === 'day' && R.offer) return dkOffer();
}

// ---------------- 지도 ----------------
const DKG = { W: 0, H: 0, cw: 0, ch: 0, ox: 0, oy: 0, dpr: 1 };
function dkSize() {
  const w = dk$('dk-mapw'), cv = dk$('dk-cv'), R = DKU.R; if (!w || !R) return;
  const W = w.clientWidth, H = w.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const ch0 = Math.floor((H - 44) / R.rows), cw = Math.floor(Math.min((W - 8) / R.cols, ch0 * 1.5)), ch = Math.floor(Math.min(ch0, cw * 1.7));
  Object.assign(DKG, { W, H, cw, ch, ox: Math.floor((W - cw * R.cols) / 2), oy: Math.max(38, Math.floor((H - ch * R.rows) / 2)), dpr });
}
const dkRect = i => { const R = DKU.R, c = i % R.cols, r = Math.floor(i / R.cols); return { x: DKG.ox + c * DKG.cw, y: DKG.oy + r * DKG.ch, w: DKG.cw, h: DKG.ch }; };
function dkCellAt(px, py) { const R = DKU.R; const c = Math.floor((px - DKG.ox) / DKG.cw), r = Math.floor((py - DKG.oy) / DKG.ch); if (c < 0 || r < 0 || c >= R.cols || r >= R.rows) return -1; return r * R.cols + c; }
const dkHash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function dkDrawCell(x, i, t) {
  const R = DKU.R, c = R.cells[i], r = dkRect(i), g = 2, path = DKU.path || [];
  const canDig = R.phase === 'day' && DKU.pick === 'dig' && DECK.digOptions(R).includes(i);
  if (!c.dug) {
    x.fillStyle = '#0c0a12'; x.fillRect(r.x + g, r.y + g, r.w - g * 2, r.h - g * 2);
    for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(80,70,100,' + (0.12 + dkHash(i, k) * 0.12) + ')'; x.fillRect(r.x + 4 + dkHash(i, k + 9) * (r.w - 10), r.y + 4 + dkHash(i, k + 3) * (r.h - 10), 3, 2); }
    if (canDig) { const a = 0.5 + 0.4 * Math.sin(t / 300 + i); x.strokeStyle = 'rgba(232,192,48,' + a + ')'; x.lineWidth = 2; x.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); dkText(x, '파기', r.x + r.w / 2, r.y + r.h / 2, '#fff3a0', 12); }
    return;
  }
  const onPath = path.includes(i);
  x.fillStyle = i === R.core ? '#2a2236' : onPath ? '#221c2e' : '#1c1826'; x.fillRect(r.x + g, r.y + g, r.w - g * 2, r.h - g * 2);
  x.fillStyle = '#15111e'; x.fillRect(r.x + g, r.y + r.h - g - 6, r.w - g * 2, 6);
  if (onPath) { x.fillStyle = 'rgba(232,192,48,.25)'; for (let k = 0; k < 3; k++) x.fillRect(r.x + r.w / 2 - 1, r.y + 6 + k * (r.h - 12) / 3, 2, 4); }
  if (i === R.ent) { x.fillStyle = 'rgba(150,170,220,.18)'; x.fillRect(r.x + r.w / 2 - 8, r.y, 16, r.h * 0.6); dkText(x, '입구', r.x + r.w / 2, r.y + 10, '#a2a8c6', 10); }
  if (i === R.core) { const p = 1 + 0.06 * Math.sin(t / 400); const cx = r.x + r.w / 2, cy = r.y + r.h - 18, rr = Math.min(r.w, r.h) * 0.2 * p; const gr = x.createRadialGradient(cx, cy, 2, cx, cy, rr * 2.2); gr.addColorStop(0, DKCOL[R.aspect] + 'aa'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(r.x, r.y, r.w, r.h); x.fillStyle = '#d8e8e0'; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.8, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#07050a'; x.fillRect(cx - rr * 0.4, cy - rr * 0.2, 2, 2); x.fillRect(cx + rr * 0.3, cy - rr * 0.2, 2, 2); }
  if (c.organ) { const v = dkView(c.organ), s = Math.min(r.w, r.h) * 0.5; x.globalAlpha = 0.95; x.drawImage(dkArtCanvas(v), r.x + r.w / 2 - s / 2, r.y + 4, s, s); x.globalAlpha = 1; x.strokeStyle = DKCOL[v.asp]; x.lineWidth = 1; x.strokeRect(r.x + 3.5, r.y + 3.5, r.w - 7, r.h - 7); }
  c.traps.forEach((tr, k) => { const v = DECK.view({ uid: 0, id: tr.id, up: 0 }), s = Math.max(12, Math.min(18, r.w * 0.3)); if (!v) return; x.drawImage(dkArtCanvas(v), r.x + 3 + k * (s + 1), r.y + r.h - s - 7, s, s); x.fillStyle = '#fff3a0'; x.font = '700 9px "IBM Plex Sans KR", sans-serif'; x.textAlign = 'left'; x.fillText(String(tr.charges), r.x + 4 + k * (s + 1), r.y + r.h - s - 8); });
  if (c.corpses) { x.fillStyle = '#8a4a4a'; for (let k = 0; k < Math.min(3, c.corpses); k++) x.fillRect(r.x + r.w - 10 - k * 5, r.y + r.h - 10, 4, 3); }
  if (DKU.pvCell === i && !DKU.hl.length) { x.strokeStyle = 'rgba(232,192,48,' + (0.35 + 0.3 * Math.sin(t / 300)) + ')'; x.setLineDash([4, 3]); x.lineWidth = 2; x.strokeRect(r.x + 5, r.y + 5, r.w - 10, r.h - 10); x.setLineDash([]); }
  if (DKU.hl.includes(i)) { const a = 0.55 + 0.35 * Math.sin(t / 220); x.strokeStyle = 'rgba(127,208,79,' + a + ')'; x.lineWidth = 3; x.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6); }
}
function dkText(x, s, px, py, col, size) { x.font = '700 ' + size + 'px "IBM Plex Sans KR", "Apple SD Gothic Neo", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 3; x.strokeStyle = 'rgba(7,5,10,.85)'; x.strokeText(s, px, py); x.fillStyle = col; x.fillText(s, px, py); }
function dkUnitSprite(u, side) {
  if (side === 'kin') { try { return kinCanvas(u.kind === 'infected' ? 'licker' : u.kind, 0, u.secret || null); } catch (e) { return null; } }
  if (u.boss && u.kind === 'seeker' && typeof HEROART !== 'undefined') return HEROART.seeker(Math.max(0, (DKU.R.act || 1) - 1));
  try { return invCanvasW(DKU.R.world, u.kind); } catch (e) { return null; }
}
function dkDrawUnits(x, t) {
  const R = DKU.R, v = DKU.nv; if (!v) return;
  const per = {}, place = (u, side) => { const k = u.cell + side; per[k] = (per[k] || 0) + 1; return per[k] - 1; };
  const draw = (u, side) => {
    const n = place(u, side), r = dkRect(u.cell), s = Math.max(20, Math.min(34, r.w * 0.55)), max = Math.max(1, Math.floor((r.h - 10) / (s * 0.7)));
    if (n >= max) { if (n === max) dkText(x, '+', side === 'kin' ? r.x + 8 : r.x + r.w - 8, r.y + r.h - 8, '#fff', 11); return; }
    const tx = side === 'kin' ? r.x + 4 : r.x + r.w - s - 4, ty = r.y + 4 + n * s * 0.7;
    const P = DKU.pos[u.uid] || (DKU.pos[u.uid] = { x: side === 'inv' ? dkRect(R.ent).x + r.w - s : tx, y: side === 'inv' ? dkRect(R.ent).y - s : ty });
    P.x += (tx - P.x) * 0.18; P.y += (ty - P.y) * 0.18;
    const sp = dkUnitSprite(u, side); if (sp) { x.save(); if (side === 'kin') { x.translate(P.x + s, P.y); x.scale(-1, 1); x.drawImage(sp, 0, 0, s, s); } else x.drawImage(sp, P.x, P.y, s, s); x.restore(); }
    const f = Math.max(0, u.hp / u.mhp); x.fillStyle = '#07050a'; x.fillRect(P.x, P.y + s, s, 3); x.fillStyle = side === 'kin' ? '#7fd04f' : u.boss ? '#e8c030' : '#f47c81'; x.fillRect(P.x, P.y + s, s * f, 3);
    if (side === 'inv' && (u.inf || u.mark || u.hold || u.mad)) { let k = 0; [['inf', '#7fd04f'], ['mark', '#f0a04a'], ['hold', '#3fb8d0'], ['mad', '#b08fff']].forEach(([q, cl]) => { if (u[q]) { x.fillStyle = cl; x.fillRect(P.x + k * 5, P.y - 3, 4, 3); k++; } }); }
  };
  v.kin.forEach(u => draw(u, 'kin')); v.enemies.forEach(u => draw(u, 'inv'));
}
function dkLoop(t) {
  DKU.raf = requestAnimationFrame(dkLoop); const R = DKU.R, cv = dk$('dk-cv'); if (!R || !cv || dk$('deck').hidden) return;
  const x = cv.getContext('2d'); x.setTransform(DKG.dpr, 0, 0, DKG.dpr, 0, 0); x.imageSmoothingEnabled = false;
  x.fillStyle = '#07050a'; x.fillRect(0, 0, DKG.W, DKG.H);
  for (let i = 0; i < R.cells.length; i++) dkDrawCell(x, i, t);
  if (R.phase === 'night') dkDrawUnits(x, t);
  DKU.floats = DKU.floats.filter(f => t - (f.t0 || (f.t0 = t)) < 1100);
  DKU.floats.forEach(f => { const r = dkRect(f.cell), k = (t - f.t0) / 1100; x.globalAlpha = 1 - k; dkText(x, f.s, r.x + r.w / 2 + (f.dx || 0), r.y + r.h / 2 - 10 - k * 22, f.col, f.big ? 15 : 12); x.globalAlpha = 1; });
}
function dkFloat(cell, s, col, big, dx) { if (cell == null || cell < 0) return; DKU.floats.push({ cell, s, col: col || '#fff', big, dx: dx || 0 }); }

// ---------------- 위·아래 ----------------
function dkRender() {
  const R = DKU.R; if (!R) return;
  DKU.path = DECK.pathCells(R); DKU.nv = R.phase === 'night' ? DECK.nightView(R) : null;
  const boss = R.night > DECK.K.nights;
  dk$('dk-when').textContent = R.act + '막 · ' + (boss ? '우두머리' : R.night + '밤') + (R.phase === 'night' ? ' · ' + (DKU.nv ? DKU.nv.turn : '') + '턴' : ' · 낮');
  dk$('dk-ess').innerHTML = `<i class="dk-ic ess"></i>${R.ess}`;
  dk$('dk-hp').innerHTML = `<i class="dk-ic hp"></i>${Math.max(0, Math.round(R.hp))}<small>/${R.maxHp}</small>${DKU.nv && DKU.nv.block ? ` <i class="dk-ic blk"></i>${DKU.nv.block}` : ''}`;
  const chips = [];
  if (R.phase === 'day') {
    chips.push(`<button class="dk-chip" data-d="deck">덱 ${R.deck.length}</button>`);
    if (R.needleOffer) chips.push(`<button class="dk-chip hot" data-d="needle">바늘 점</button>`);
    const organs = R.deck.filter(c => { const d = CARDS.BY[c.id]; return d && d.type === 'organ' && !c.placed; }); if (organs.length) chips.push(`<button class="dk-chip" data-d="organs">기관 놓기 ${organs.length}</button>`);
    if (R.molts.length) chips.push(`<button class="dk-chip" data-d="molts">허물 ${R.molts.length}</button>`);
  } else if (DKU.nv) {
    const pv = DKU.nv.preview; if (pv && pv.length) chips.push(`<button class="dk-chip pv" data-d="pv" data-uid="${pv[0].uid}">한 장 더면 ${esc(pv[0].name)} · ${esc(pv[0].card || '')}</button>`);
    if (DKU.nv.queue) chips.push(`<span class="dk-chip">남은 적 ${DKU.nv.queue}</span>`);
  }
  dk$('dk-chips').innerHTML = chips.join('');
  dk$('dk-low').className = R.phase === 'night' ? 'night' : 'day';
  dk$('dk-low').innerHTML = R.phase === 'night' ? dkHandHtml() : R.phase === 'day' ? dkDayBar() : '';
  dkHighlight();
}
function dkDayBar() {
  const R = DKU.R, o = DECK.dayOptions(R), a = R.actions, B = (d, ic, lb, on) => `<button class="dk-act${on ? '' : ' off'}" data-d="${d}"${on ? '' : ' disabled'}><i class="dk-ic ${ic}"></i><span>${lb}</span></button>`;
  return `<div class="dk-acts"><span class="dk-left">행동 <b>${'●'.repeat(a)}${'○'.repeat(Math.max(0, DECK.K.dayActions - a))}</b></span>${B('dig', 'i-dig', '파기', o.includes('dig'))}${B('draft', 'i-card', '카드', o.includes('draft'))}${B('upgrade', 'i-up', '강화', true)}${B('remove', 'i-rm', '빼기', true)}${B('shop', 'i-shop', '상점', o.includes('shop'))}</div><button class="btn pri dk-night" data-d="night">밤 맞기</button>`;
}
function dkHandHtml() {
  const v = DKU.nv; if (!v) return '';
  const n = v.hand.length, cards = v.hand.map((c, k) => { const lift = DKU.sel === c.uid; return dkFace(c, { d: 'card', uid: c.uid, cost: c.costNow, cls: (lift ? 'lift' : '') + (c.sealed ? ' sealed' : c.can && c.cells.length ? '' : ' no'), i: k }); }).join('');
  return `<div class="dk-hud"><span class="dk-orbs">${Array.from({ length: Math.max(v.energy, 3) }, (x, k) => `<i class="${k < v.energy ? 'on' : ''}"></i>`).join('')}<b>${v.energy}</b></span><span class="dk-piles">덱 ${v.drawN} · 버림 ${v.discardN}</span><button class="btn pri dk-end" data-d="end">턴 끝</button></div><div class="dk-hand" style="--n:${n}">${cards}</div>`;
}
function dkHighlight() {
  const R = DKU.R; DKU.hl = [];
  if (R.phase === 'night' && DKU.sel != null && DKU.nv) { const c = DKU.nv.hand.find(h => h.uid === DKU.sel); if (c && c.cells[0] !== null) DKU.hl = c.cells; }
  if (R.phase === 'day' && DKU.pick === 'organ') DKU.hl = R.cells.map((c, i) => i).filter(i => R.cells[i].dug && !R.cells[i].organ && i !== R.core);
  if (R.phase === 'day' && DKU.pick === 'dig') DKU.hl = [];
  DKU.pvCell = R.phase === 'night' && DKU.nv && DKU.nv.preview && DKU.nv.preview[0] && DKU.nv.preview[0].cell != null ? DKU.nv.preview[0].cell : null;
  const c = DKU.sel != null && DKU.nv ? DKU.nv.hand.find(h => h.uid === DKU.sel) : null;
  dkTip(DKU.pick === 'dig' ? '팔 칸을 누른다' : DKU.pick === 'organ' ? '기관을 놓을 칸을 누른다' : c ? (c.cells[0] === null ? '한 번 더 누르면 낸다' : '빛나는 칸을 누른다') : null);
}

// ---------------- 누르기 ----------------
function dkDown(e) { const c = e.target.closest('.dkc'); if (!c) return; DKU.lpFired = false; clearTimeout(DKU.lpT); DKU.lpT = setTimeout(() => { DKU.lpFired = true; dkDetail(c); }, 480); }
function dkUp() { clearTimeout(DKU.lpT); }
function dkDetail(el) {
  const R = DKU.R; let v = null;
  if (el.dataset.uid && R) { const c = R.deck.find(x => x.uid === +el.dataset.uid); if (c) v = dkView(c); }
  if (!v && el.dataset.id) v = dkDefView(el.dataset.id);
  if (!v) return; const d = CARDS.BY[v.id] || {}, up = d.textUp && v.up === 0;
  dkSheet('detail', `<div class="dk-detail">${dkFace(v, { cls: 'big' })}<div class="dk-dt"><p class="dk-tag" style="--c:${DKCOL[v.asp]}">${CARDS.ASPN[v.asp]} · ${DKTYPE[v.type]} · ${DKRAR[v.rar] || ''}</p><p>${esc(d.more || v.text || '')}</p>${up ? `<p class="dk-mute">강화하면: ${esc(d.textUp)}</p>` : ''}${d.unlock && !CARDS.isOpen(d, dkMeta()) && CARDS.UNLOCK[d.unlock] ? `<p class="dk-lock">${CARDS.UNLOCK[d.unlock].hard ? '<b class="dk-hard">도전</b> ' : ''}열리는 조건: ${esc(CARDS.UNLOCK[d.unlock].text)}</p>` : ''}${d.lore ? `<p class="dk-mute">${esc(d.lore)}</p>` : ''}</div></div>`);
}
function dkClick(e) {
  if (DKU.lpFired) { DKU.lpFired = false; e.preventDefault(); return; }
  const el = e.target.closest('[data-d]'); if (!el) return; const d = el.dataset.d, R = DKU.R;
  dkSnd('click');
  if (d === 'close') return dkSheet(null);
  if (d === 'home') return dkClose();
  if (d === 'asp') return dkStart(el.dataset.v);
  if (d === 'go') return dkBegin(DKU.startAsp || 'brood');
  if (d === 'cont') { DKU.R = dkLoad(); if (!DKU.R) return dkStart(); if (DKU.R.phase === 'night') { DKU.R.phase = 'day'; DKU.R.N = null; } return dkGo(); }
  if (d === 'codex') return dkCodex();
  if (d === 'back') return dkStart();
  if (d === 'cfilter') { DKU.filter = el.dataset.v; return dkCodex(); }
  if (d === 'peek') return dkDetail(el);
  if (d === 'menu') return dkMenu();
  if (d === 'quit') { dkSheet(null); return dkClose(); }
  if (d === 'giveup') { if (!el.dataset.sure) { el.dataset.sure = 1; el.textContent = '정말 포기?'; return; } dkSheet(null); R.N = null; R.phase = 'over'; R.over = { win: false, act: R.act, night: R.night, score: DECK.score(R, false), unlocks: [] }; R.meta.runs = (R.meta.runs || 0) + 1; return dkOver(); }
  if (!R) return;
  if (d === 'deck') return dkDeckView();
  if (d === 'molts') return dkSheet('molts', `<h3>허물</h3><div class="dk-list">${R.molts.map(m => `<div class="dk-li"><b>${esc(CARDS.MOLT[m].name)}</b><span>${esc(CARDS.MOLT[m].text)}</span></div>`).join('')}</div>`);
  if (d === 'organs') return dkOrganList();
  if (d === 'porgan') { DKU.pick = 'organ'; DKU.pickUid = +el.dataset.uid; dkSheet(null); return dkRender(); }
  if (d === 'dig') { DKU.pick = DKU.pick === 'dig' ? null : 'dig'; return dkRender(); }
  if (d === 'draft') { const r = DECK.draft(R); if (r.ok) dkOffer(); return dkRender(); }
  if (d === 'reroll') { const r = DECK.reroll(R); if (!r.ok) dkToast(r.msg || '진액이 모자란다'); return dkOffer(); }
  if (d === 'take') { DECK.takeOffer(R, +el.dataset.i); dkSnd('up'); dkSheet(null); dkSave(); return dkRender(); }
  if (d === 'skip') { DECK.skipOffer(R); dkSheet(null); dkSave(); return dkRender(); }
  if (d === 'upgrade') return dkUpList();
  if (d === 'doup') { const sec = el.dataset.sec === '1', pay = el.dataset.pay === '1'; const r = pay ? DECK.buyUpgrade(R, +el.dataset.uid, sec) : DECK.upgrade(R, +el.dataset.uid, sec); if (!r.ok) { dkToast(r.msg || '할 수 없다'); return; } dkSnd('evo'); dkSave(); dkRender(); return dkUpDone(r.card, sec); }
  if (d === 'remove') return dkRmList();
  if (d === 'dorm') { const pay = el.dataset.pay === '1'; const r = pay ? DECK.buyRemove(R, +el.dataset.uid) : DECK.removeCard(R, +el.dataset.uid); if (!r.ok) { dkToast(r.msg || '할 수 없다'); return; } dkSave(); dkRender(); return dkRmList(); }
  if (d === 'shop') { if (!R.shop) { const r = DECK.openShop(R); if (!r.ok) return; } dkSave(); dkRender(); return dkShop(); }
  if (d === 'buy') { const r = DECK.shopBuy(R, el.dataset.i === 'molt' ? 'molt' : +el.dataset.i); if (!r.ok) { dkToast('진액이 모자란다'); return; } dkSnd('coin'); dkSave(); dkRender(); return dkShop(); }
  if (d === 'night') return dkNight();
  if (d === 'card') return dkCardTap(+el.dataset.uid);
  if (d === 'pv') { DKU.sel = null; return dkCardTap(+el.dataset.uid); }
  if (d === 'end') return dkEndTurn();
  if (d === 'reward') { const R2 = R; DECK.takeReward(R2, el.dataset.i === 'skip' ? null : +el.dataset.i, DKU.moltPick || null); DKU.moltPick = null; dkOv(null); dkSave(); dkMus('day'); dkRender(); return dkPhase(); }
  if (d === 'molt') { DKU.moltPick = el.dataset.v; return dkReward(); }
  if (d === 'needle') return dkNeedle('start');
  if (d === 'paytbl') return dkSheet('pay', `<h3>바늘 점 족보</h3><div class="dk-list">${DECK.NHANDS.slice(1).map(h => `<div class="dk-li"><b>${esc(h.name)}</b><span>건 것 ×${h.pay}${h.extra ? (h.extra.indexOf('molt') === 0 ? ' · 허물' : ' · 옛것급 카드') : ''}</span></div>`).join('')}</div><p class="dk-mute">흩어진 별이면 건 것을 잃는다. 크게 걸고 잃으면 저주가 붙는다.</p>`);
  if (d === 'nbet') return dkNeedle('bet', el.dataset.v, +el.dataset.uid);
  if (d === 'nopen') return dkNeedle('open');
  if (d === 'nfold') return dkNeedle('fold');
  if (d === 'ndone') { DKU.needleRes = null; dkOv(null); dkSave(); dkRender(); return dkPhase(); }
  if (d === 'again') { const a = R.aspect; DKU.R = null; return dkStart(a); }
  if (d === 'digok') { dkOv(null); dkRender(); return dkPhase(); }
}
function dkMenu() {
  const R = DKU.R;
  dkSheet('menu', `<h3>메뉴</h3><div class="dk-col">${R && R.phase !== 'over' ? `<button class="btn" data-d="deck">덱 보기 (${R.deck.length})</button>` : ''}<button class="btn" data-d="codex">도감</button><button class="btn" data-d="quit">처음 화면 ${R && R.phase === 'day' ? '(저장)' : ''}</button>${R && R.phase !== 'over' ? '<button class="btn bad" data-d="giveup">이 판 포기</button>' : ''}</div>${R ? `<p class="dk-mute">${CARDS.ASPN[R.aspect]} · ${esc(DECK.TRAIT[R.aspect].name)}: ${esc(DECK.TRAIT[R.aspect].text)}</p>` : ''}`);
}

// ---------------- 낮 ----------------
function dkOffer() {
  const R = DKU.R; if (!R.offer) return dkSheet(null);
  const price = DECK.K.reroll * (R.rerolls + 1);
  dkSheet('offer', `<h3>${R.offer.why === 'bones' ? '옛 뼈에서 나온 것' : '셋 중 하나'}</h3><div class="dk-pick3">${R.offer.cards.map((o, k) => dkFace(dkDefView(o.id, o.up), { d: 'take', i: k, id: o.id, cls: 'pick' })).join('')}</div><div class="dk-row2"><button class="btn" data-d="reroll"${R.ess < price ? ' disabled' : ''}>다시 뽑기 ${price}</button><button class="btn" data-d="skip">안 받기</button></div><p class="dk-mute">길게 누르면 자세히</p>`);
}
function dkUpList() {
  const R = DKU.R, o = DECK.upgradeOptions(R), act = R.actions > 0, price = DECK.essPrice(R, 'up');
  dkSheet('up', `<h3>강화 <small>행동 1 또는 진액 ${price}</small></h3>${o.length ? `<div class="dk-list">${o.map(x => { const c = R.deck.find(q => q.uid === x.uid), v = dkView(c), nx = dkView(Object.assign({}, c, { up: c.up + 1 })); return `<div class="dk-uprow">${dkFace(v, { cls: 'mini', uid: c.uid, d: 'peek' })}<span class="dk-arrow">→</span>${dkFace(nx, { cls: 'mini' })}<div class="dk-col">${act ? `<button class="btn sm pri" data-d="doup" data-uid="${c.uid}">행동</button>` : ''}<button class="btn sm" data-d="doup" data-pay="1" data-uid="${c.uid}"${R.ess < price ? ' disabled' : ''}>진액 ${price}</button>${x.secret ? `<button class="btn sm hot" data-d="doup" data-sec="1"${act ? '' : ' data-pay="1"'} data-uid="${c.uid}">비밀 갈래</button>` : ''}</div></div>`; }).join('')}</div>` : '<p class="dk-mute">강화할 카드가 없다</p>'}`);
}
function dkUpDone(v, sec) { dkSheet(null); dkOv(`<div class="dk-pop"><p class="dk-lab">${sec ? '비밀 갈래' : '강화'}</p>${dkFace(v, { cls: 'big' + (sec ? ' secret' : '') })}<button class="btn pri" data-d="digok">좋다</button></div>`, 'dk-dim'); }
function dkRmList() {
  const R = DKU.R, act = R.actions > 0, price = DECK.essPrice(R, 'rm'), list = R.deck.filter(c => !c.placed);
  dkSheet('rm', `<h3>카드 빼기 <small>덱에서 없앤다 · 행동 1 또는 진액 ${price}</small></h3><div class="dk-list">${list.map(c => { const v = dkView(c); return `<div class="dk-uprow">${dkFace(v, { cls: 'mini', uid: c.uid, d: 'peek' })}<div class="dk-col">${act ? `<button class="btn sm" data-d="dorm" data-uid="${c.uid}">행동으로</button>` : ''}<button class="btn sm" data-d="dorm" data-pay="1" data-uid="${c.uid}"${R.ess < price ? ' disabled' : ''}>진액 ${price}</button></div></div>`; }).join('')}</div>`);
}
function dkShop() {
  const R = DKU.R, s = R.shop; if (!s) return;
  dkSheet('shop', `<h3>상점 <small>진액 ${R.ess}</small></h3><div class="dk-grid">${s.items.map((it, k) => `<div class="dk-cell${it.sold ? ' sold' : ''}">${dkFace(dkDefView(it.id), { cls: 'mini', d: 'peek', id: it.id })}<button class="btn sm${R.ess >= it.price && !it.sold ? ' pri' : ''}" data-d="buy" data-i="${k}"${it.sold || R.ess < it.price ? ' disabled' : ''}>${it.sold ? '팔림' : it.price}</button></div>`).join('')}</div>${s.molt ? `<div class="dk-li molt"><b>허물 · ${esc(CARDS.MOLT[s.molt.id].name)}</b><span>${esc(CARDS.MOLT[s.molt.id].text)}</span><button class="btn sm" data-d="buy" data-i="molt"${s.molt.sold || R.ess < s.molt.price ? ' disabled' : ''}>${s.molt.sold ? '팔림' : s.molt.price}</button></div>` : ''}`);
}
function dkOrganList() {
  const R = DKU.R, list = R.deck.filter(c => { const d = CARDS.BY[c.id]; return d && d.type === 'organ' && !c.placed; });
  dkSheet('organs', `<h3>기관 놓기 <small>낮에는 진액 · 밤에는 기운 +1</small></h3><div class="dk-grid">${list.map(c => { const v = dkView(c), p = DECK.K.organDay * v.cost; return `<div class="dk-cell">${dkFace(v, { cls: 'mini', uid: c.uid, d: 'peek' })}<button class="btn sm" data-d="porgan" data-uid="${c.uid}"${R.ess < p ? ' disabled' : ''}>놓기 ${p}</button></div>`; }).join('')}</div>`);
}
function dkDeckView() {
  const R = DKU.R, t = DKU.deckT || 'all', list = R.deck.filter(c => t === 'all' || (CARDS.BY[c.id] && CARDS.BY[c.id].type === t));
  dkSheet('deck', `<h3>덱 ${R.deck.length}장</h3><div class="dk-tabs">${['all', 'organ', 'trap', 'kin', 'spell', 'curse'].map(k => `<button class="dk-tab${k === t ? ' on' : ''}" data-d="deckt" data-v="${k}">${k === 'all' ? '전부' : DKTYPE[k]}</button>`).join('')}</div><div class="dk-grid">${list.map(c => `<div class="dk-cell">${dkFace(dkView(c), { cls: 'mini' + (c.placed ? ' placed' : ''), uid: c.uid, d: 'peek' })}</div>`).join('')}</div>`);
}
document.addEventListener('click', e => { const t = e.target.closest('[data-d="deckt"]'); if (t) { DKU.deckT = t.dataset.v; dkDeckView(); } });
function dkCodex() {
  const m = dkMeta(), f = DKU.filter || 'all', list = CARDS.LIST.filter(d => d.type !== 'curse' && d.rar !== 's' && (f === 'all' || d.asp === f));
  const html = `<h3>도감 <small>${list.filter(d => CARDS.isOpen(d, m)).length}/${list.length}</small></h3><div class="dk-tabs">${['all'].concat(DKASP, ['none']).map(k => `<button class="dk-tab${k === f ? ' on' : ''}" data-d="cfilter" data-v="${k}">${k === 'all' ? '전부' : CARDS.ASPN[k]}</button>`).join('')}</div><div class="dk-grid">${list.map(d => { const open = CARDS.isOpen(d, m); return `<div class="dk-cell">${dkFace(dkDefView(d.id), { cls: 'mini' + (open ? '' : ' locked'), d: 'peek', id: d.id })}${open ? '' : `<span class="dk-lockt">${CARDS.UNLOCK[d.unlock] && CARDS.UNLOCK[d.unlock].hard ? '<b class="dk-hard">도전</b> ' : ''}${esc((CARDS.UNLOCK[d.unlock] && CARDS.UNLOCK[d.unlock].text) || (d.unlock && d.unlock.indexOf('part:') === 0 ? '한 방울에서 그 부위를 달기' : ''))}</span>`}</div>`; }).join('')}</div>`;
  if (!DKU.R) { dkOv(`<div class="dk-codex">${html}<button class="btn dk-wide" data-d="back">돌아가기</button></div>`, 'dk-full'); return; }
  dkSheet('codex', html);
}
// 파기: 결과를 뒤집어 보인다
function dkDig(cell) {
  const R = DKU.R, r = DECK.dig(R, cell); DKU.pick = null; if (!r.ok) return dkRender();
  const T = { empty: ['빈 굴', '진액 +5'], bones: ['옛 뼈', '카드 셋 중 하나'], beast: ['땅속 짐승', '체력 −' + (r.lose || 0) + ' · 진액 +25'], egg: ['잠든 알', '권속 카드'], cursed: ['저주받은 보물', '옛것급 카드 + 저주'], altar: ['제단', '바늘 점이 열렸다'] }[r.kind] || [r.kind, ''];
  dkSnd(r.kind === 'beast' ? 'hit' : r.kind === 'empty' ? 'step' : 'up'); dkFloat(cell, T[0], '#fff3a0', true);
  const cards = [r.card, r.curse].filter(Boolean).map(id => dkFace(dkDefView(id), { cls: 'mini', d: 'peek', id })).join('');
  dkOv(`<div class="dk-pop dig"><div class="dk-flip"><p class="dk-lab">파낸 것</p><h3>${T[0]}</h3><p>${T[1]}</p>${cards ? `<div class="dk-row">${cards}</div>` : ''}</div><button class="btn pri" data-d="digok">${r.kind === 'bones' ? '고르러' : '좋다'}</button></div>`, 'dk-dim');
  dkSave(); dkRender();
}
function dkMapTap(e) {
  const R = DKU.R; if (!R) return; const b = e.currentTarget.getBoundingClientRect(), i = dkCellAt(e.clientX - b.left, e.clientY - b.top); if (i < 0) return;
  if (R.phase === 'day') {
    if (DKU.pick === 'dig') { if (DECK.digOptions(R).includes(i)) return dkDig(i); DKU.pick = null; return dkRender(); }
    if (DKU.pick === 'organ') { const r = DECK.placeOrgan(R, DKU.pickUid, i); DKU.pick = null; if (!r.ok) dkToast(r.msg || '놓을 수 없다'); else { dkSnd('up'); dkFloat(i, '기관', '#7fd04f', true); dkSave(); } return dkRender(); }
    return dkCellInfo(i);
  }
  if (R.phase === 'night') { if (DKU.sel != null && DKU.hl.includes(i)) return dkPlay(DKU.sel, i); return dkCellInfo(i); }
}
function dkCellInfo(i) {
  const R = DKU.R, c = R.cells[i]; if (!c.dug) return;
  const items = []; if (i === R.core) items.push('<p><b>본체 방</b> · 여기까지 오면 본체가 싸운다</p>'); if (i === R.ent) items.push('<p><b>입구</b></p>');
  if (c.organ) items.push(`<div class="dk-row">${dkFace(dkView(c.organ), { cls: 'mini', uid: c.organ.uid, d: 'peek' })}</div>`);
  if (c.traps.length) items.push(`<p class="dk-lab">부위</p><div class="dk-list">${c.traps.map(t => `<div class="dk-li"><b>${esc(t.name)}</b><span>남은 횟수 ${t.charges}</span></div>`).join('')}</div>`);
  const v = DKU.nv; if (v) { const es = v.enemies.filter(u => u.cell === i), ks = v.kin.filter(u => u.cell === i); if (ks.length) items.push(`<p class="dk-lab">권속</p>${ks.map(u => `<p>${esc(u.name)} · ${Math.round(u.hp)}/${u.mhp}</p>`).join('')}`); if (es.length) items.push(`<p class="dk-lab">적</p>${es.map(u => `<p>${esc(u.name)} · ${Math.round(u.hp)}/${u.mhp}${u.boss ? ' · 우두머리' : ''}</p>`).join('')}`); }
  if (!items.length) items.push('<p class="dk-mute">빈 굴</p>');
  dkSheet('cell', items.join(''));
}

// ---------------- 밤 ----------------
function dkNight() {
  const R = DKU.R; dkSave(); const r = DECK.goNight(R); if (!r.ok) return; DKU.pos = {}; DKU.sel = null; DKU.pick = null; dkSheet(null);
  dkMus(R.night > DECK.K.nights ? 'boss' : 'night'); dkSnd('down'); dkBanner(R.night > DECK.K.nights ? '우두머리의 밤' : R.act + '막 ' + R.night + '밤', '#f47c81');
  DKU.evi = 0; dkRender(); dkEvents();
}
function dkCardTap(uid) {
  const R = DKU.R; if (R.phase !== 'night' || DKU.busy) return; const c = DKU.nv.hand.find(h => h.uid === uid); if (!c) return;
  if (c.sealed) { dkToast('봉인되었다 · 이번 턴에는 못 낸다'); return; }
  if (!c.can || !c.cells.length) { dkToast(c.can ? '낼 칸이 없다' : '기운이 모자란다'); return; }
  if (DKU.sel === uid) { if (c.cells[0] === null) return dkPlay(uid, null); DKU.sel = null; return dkRender(); }
  DKU.sel = uid; if (c.cells.length === 1 && c.cells[0] !== null && c.type !== 'kin' && c.type !== 'organ' && c.type !== 'trap') return dkPlay(uid, c.cells[0]);
  dkRender();
}
function dkSnapshot() { const v = DECK.nightView(DKU.R); const m = {}; if (v) { v.enemies.forEach(e => { m[e.uid] = { hp: e.hp, cell: e.cell }; }); v.kin.forEach(k => { m[k.uid] = { hp: k.hp, cell: k.cell, kin: true }; }); } return { m, hp: DKU.R.hp }; }
function dkDiff(before) {
  const v = DECK.nightView(DKU.R), now = {}; if (v) { v.enemies.forEach(e => { now[e.uid] = e; }); v.kin.forEach(k => { now[k.uid] = k; }); }
  for (const uid in before.m) { const b = before.m[uid], n = now[uid]; if (n && n.hp < b.hp - 0.5) dkFloat(n.cell, '-' + Math.round(b.hp - n.hp), b.kin ? '#ff9a8a' : '#fff3a0', false, b.kin ? -10 : 10); }
  if (DKU.R.hp < before.hp - 0.5) dkFloat(DKU.R.core, '본체 -' + Math.round(before.hp - DKU.R.hp), '#f47c81', true);
}
function dkEvents(list) {
  const R = DKU.R, ev = list || (R.N ? R.N.events : []); for (let k = DKU.evi; k < ev.length; k++) { const e = ev[k];
    if (e.t === 'die') { dkFloat(e.cell, '쓰러짐', '#f47c81'); dkSnd('hit'); }
    if (e.t === 'swallow') { dkFloat(e.cell, '삼켰다', '#3fb8d0', true); dkSnd('trap'); }
    if (e.t === 'rout') dkFloat(e.cell, '달아남', '#f0a04a');
    if (e.t === 'kindie') dkFloat(e.cell, '권속 쓰러짐', '#ff9a8a');
    if (e.t === 'hand') { dkBanner('족보 · ' + e.name, '#e8c030'); dkSnd('evo'); }
    if (e.t === 'learn') { const al = DECK.ALIEN[e.kind] || ''; dkToast('기억을 삼켰다: ' + (al ? al + ' → ' : '') + e.name); }
    if (e.t === 'sap') { dkFloat(e.cell, '기관이 뜯겼다', '#a2a8c6', true); dkToast('기관이 뜯겨 덱으로 돌아왔다'); }
  } DKU.evi = ev.length;
}
function dkPlay(uid, cell) {
  const R = DKU.R, before = dkSnapshot(), ev = R.N.events, r = DECK.play(R, uid, cell); DKU.sel = null;
  if (!r.ok) { dkToast(r.msg || '낼 수 없다'); return dkRender(); }
  dkSnd('trap'); dkEvents(ev); dkDiff(before); if (cell != null) dkFloat(cell, '✦', '#fff3a0');
  if (R.phase !== 'night') return dkAfterNight(); dkRender();
}
function dkEndTurn() {
  const R = DKU.R; if (R.phase !== 'night' || DKU.busy) return; DKU.busy = true; DKU.sel = null;
  const before = dkSnapshot(), ev = R.N.events; DECK.endTurn(R); dkEvents(ev); dkDiff(before); dkSnd('step');
  setTimeout(() => { DKU.busy = false; if (R.phase !== 'night') return dkAfterNight(); dkRender(); }, 380);
  dkRender();
}
function dkAfterNight() {
  const R = DKU.R; DKU.evi = 0; DKU.nv = null; dkRender();
  if (R.phase === 'over') return setTimeout(dkOver, 600);
  dkBanner('밤을 넘겼다', '#7fd04f'); dkSnd('up'); setTimeout(dkReward, 700);
}
function dkReward() {
  const R = DKU.R; if (R.phase !== 'reward' || !R.reward) return; dkSheet(null);
  const ms = R.reward.molts;
  dkOv(`<div class="dk-reward"><h2>밤을 넘겼다</h2><p class="dk-sub">진액이 고였다 · 카드 하나를 고른다</p><div class="dk-pick3">${R.reward.cards.map((o, k) => dkFace(dkDefView(o.id, o.up), { d: 'reward', i: k, id: o.id, cls: 'pick' })).join('')}</div>
${ms && ms.length ? `<p class="dk-lab">허물 하나 (우두머리를 넘겼다)</p><div class="dk-col">${ms.map(m => `<button class="dk-molt${DKU.moltPick === m ? ' on' : ''}" data-d="molt" data-v="${m}"><b>${esc(CARDS.MOLT[m].name)}</b><span>${esc(CARDS.MOLT[m].text)}</span></button>`).join('')}</div>` : ''}
<button class="btn dk-wide" data-d="reward" data-i="skip">카드 안 받기</button><p class="dk-mute">길게 누르면 자세히${ms && ms.length ? ' · 허물을 먼저 고른 뒤 카드를 고른다' : ''}</p></div>`, 'dk-full');
}
function dkOver() {
  const R = DKU.R, o = R.over || { win: false, score: 0, unlocks: [] }; store.del('deckrun'); saveMeta(); dkSheet(null); dkMus(o.win ? 'win' : 'lose');
  const un = o.unlocks || [];
  dkOv(`<div class="dk-over ${o.win ? 'win' : 'lose'}"><h2>${o.win ? '일곱째 바늘이 돌아섰다' : '본체가 쓰러졌다'}</h2><p class="dk-sub">${CARDS.ASPN[R.aspect]} · ${o.act}막 ${Math.min(o.night, DECK.K.nights + 1)}밤까지 · 점수 <b>${o.score}</b></p>
${un.length ? `<p class="dk-lab">새로 열린 카드</p>${un.map(u => `<div class="dk-un"><p class="dk-mute">${esc(u.text)}</p><div class="dk-row">${u.cards.map(id => dkFace(dkDefView(id), { cls: 'mini', d: 'peek', id })).join('')}</div></div>`).join('')}` : '<p class="dk-mute">이번에는 새로 열린 카드가 없다</p>'}${(R.meta.queue || []).length ? `<p class="dk-lab">다음 판에 더 열린다 ${R.meta.queue.length}</p>` : ''}
<div class="dk-row2"><button class="btn pri" data-d="again">다시 한다</button><button class="btn" data-d="home">처음 화면</button></div></div>`, 'dk-full');
}

// ---------------- 바늘 점 ----------------
const DKSIGN = ['〰', '◉', '⬮', '◐', '▼', '⊓', '│', '▲', '⋔', '≀', '△', '◯', '⋀'];
function dkStar(s, hidden) { if (!s || hidden) return `<div class="dk-star back"><i></i></div>`; const col = s.asp === 'none' ? '#e8e0d0' : DKCOL[s.asp]; return `<div class="dk-star" style="--c:${col}"><b>${DKSIGN[s.sign] || '✦'}</b><span>${esc(DECK.SIGNS[s.sign] || '')}</span><em>${s.asp === 'none' ? '바늘' : CARDS.ASPN[s.asp]}</em></div>`; }
function dkNeedle(op, v, uid) {
  const R = DKU.R; let res = null;
  if (op === 'start') { const r = DECK.needleStart(R, 'altar'); if (!r.ok) return; dkSave(); dkRender(); }
  if (op === 'bet') { const r = DECK.needleBet(R, v === 'card' ? { kind: 'card', uid } : { kind: v, n: v === 'ess' ? 10 : 5 }); if (!r.ok) dkToast('걸 것이 없다'); else dkSnd('coin'); }
  if (op === 'open') { const r = DECK.needleReveal(R); if (!r.ok) { dkToast(r.msg || '먼저 건다'); } else { dkSnd('trap'); if (r.result) res = r; } }
  if (op === 'fold') { DECK.needleFold(R); dkOv(null); dkToast('접었다'); dkSave(); dkRender(); return; }
  if (res) { DKU.needleRes = res; }
  const n = res ? res.needle : R.needle ? (function () { const x = R.needle; return { step: x.step, stars: x.stars.slice(0, x.shown), hole: [null, null], stake: Object.assign({}, x.stake, { value: x.stake.ess + x.stake.hp * 5 + x.stake.cards.length * 30 }), done: false }; })() : null;
  if (!n) return;
  const shown = n.stars.length, stars = []; for (let k = 0; k < 5; k++) stars.push(dkStar(n.stars[k], k >= shown));
  const holes = (n.hole || [null, null]).map(h => dkStar(h, !h)).join(''), kinCards = R.deck.filter(c => CARDS.BY[c.id] && CARDS.BY[c.id].type === 'kin');
  const st = n.stake, done = !!res;
  const out = done ? (res.result.pay > 0 ? `<p class="dk-pay win">${esc(res.result.name)} · 진액 +${res.result.pay}${res.result.gifts.length ? ' · 선물 ' + res.result.gifts.length : ''}</p>` : `<p class="dk-pay lose">${esc(res.result.name)} · 잃었다${res.result.curse ? ' · 저주가 붙었다' : ''}</p>`) : '';
  if (done) { dkSnd(res.result.pay > 0 ? 'evo' : 'down'); dkSave(); dkRender(); }
  dkOv(`<div class="dk-needle"><h2>바늘 점</h2><p class="dk-sub">별 다섯이 차례로 뜬다. 내 바늘 둘과 합쳐 가장 좋은 다섯을 본다</p>
<div class="dk-sky">${stars.join('')}</div><p class="dk-lab">내 바늘</p><div class="dk-sky holes">${holes}</div>
<p class="dk-stake">건 것 · 진액 ${st.ess} · 체력 ${st.hp} · 권속 ${st.cards.length || 0} <b>(값 ${st.value})</b></p>${out}
${done ? '<button class="btn pri dk-wide" data-d="ndone">좋다</button>' : `<div class="dk-row2"><button class="btn" data-d="nbet" data-v="ess"${R.ess < 1 ? ' disabled' : ''}>진액 10</button><button class="btn" data-d="nbet" data-v="hp"${R.maxHp <= 20 ? ' disabled' : ''}>최대 체력 5</button>${kinCards.length ? `<button class="btn" data-d="nbet" data-v="card" data-uid="${kinCards[0].uid}">권속 1</button>` : ''}</div><div class="dk-row2"><button class="btn pri" data-d="nopen"${st.value > 0 ? '' : ' disabled'}>${n.step === 0 ? '별을 연다' : '다음 별'}</button><button class="btn" data-d="nfold">접는다</button></div>`}
<button class="btn sm dk-paybtn" data-d="paytbl">족보와 몫</button></div>`, 'dk-full needle');
}

// 시험용
window.__deck = { get R() { return DKU.R; }, DKU, DECK, rect: dkRect, open: deckOpen, begin: dkBegin, render: dkRender, night: dkNight, endTurn: dkEndTurn, play: dkPlay,
  win() { const R = DKU.R; if (!R || R.phase !== 'night') return; R.N.queue.length = 0; R.N.enemies.forEach(e => { e.hp = 0; }); DECK.endTurn(R); if (R.phase !== 'night') dkAfterNight(); },
  finish(win) { const R = DKU.R; R.phase = 'over'; R.over = { win: !!win, act: R.act, night: R.night, score: DECK.score(R, !!win), unlocks: [] }; dkOver(); } };
