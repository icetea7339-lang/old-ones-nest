// 굴 짓기 화면: 첫 화면, 지도(파기·메우기·방·함정·권속 세우기), 상점과 대기석, 침입 재생, 결과와 판 끝.
// 규칙은 maze.js (MAZE), 싸움 재생은 둥지 전투의 것(lairui.js 의 lairReplay)을 그대로 쓴다. 그림은 lairart.js 의 maze* (없으면 단순한 대체).
const MZ = { M: null, v: null, phase: 'title', sel: null, sheet: null, drag: null, hover: -1, k: 1, t: 0, last: 0, raf: 0, pops: {}, burst: null, play: null, tut: -1, toastT: 0, dug0: 0, dbg: {} };
const MS = 64, MTOP = Math.round(MS * 0.9), MW = MS * 5, MH = MTOP + MS * 8 + 18;
// 규칙의 함정 id → 그림의 함정 id
const MZTRAP = { tr_teeth: 'pit', tr_whisper: 'whisper', tr_slime: 'slime', tr_spore: 'spore' };
const MZTRAPC = { tr_teeth: '#e8e0d0', tr_whisper: '#b48cff', tr_slime: '#6ad08a', tr_spore: '#d8e870' };
const MZNAR = {
  win: '횃불은 굴의 중간에서 꺼졌다. 알은 고요히 맥박쳤다.',
  hurt: '발소리가 알의 방까지 닿았다. 껍질에 새 금이 갔다.',
  end: '네 번째 등불이 꺼진 뒤로, 굴을 찾아 내려오는 자는 없었다. 알 속의 것은 더 깊이 잠들었다.',
  fall: '껍질이 갈라지고, 그 안의 어둠이 흙으로 스며들었다. 둥지는 지킬 것을 잃었다.',
};
const MZTUT = [
  { key: 'dig', text: '바위를 눌러 판다.' },
  { key: 'room', text: '판 칸을 눌러 권속 방으로 바꾼다.' },
  { key: 'place', text: '권속을 사서 방에 세운다.' },
  { key: 'raid', text: '「침입」을 누르면 일행이 들어온다.', ok: 1 },
];
const mq = s => document.querySelector(s);
const mzA = () => typeof LAIRART !== 'undefined' ? LAIRART : {};
const mzFn = n => typeof mzA()[n] === 'function';
const mzSay = k => { try { sfx(k); } catch (e) { /* 소리 없이 */ } };
const mzMusic = n => { try { if (typeof music === 'function') music(n); } catch (e) { /* 음악 없이 */ } };
const MZURL = {};
function mzIcon(id, star, px) { const k = id + ':' + (star || 1) + ':' + px; if (MZURL[k] == null) { try { MZURL[k] = LAIRART.icon(typeof lrArtId === 'function' ? lrArtId(id) : id, star || 1, px).toDataURL(); } catch (e) { MZURL[k] = ''; } } return MZURL[k]; }
function mzSym(id, px) { const k = 'sym:' + id + ':' + px; if (MZURL[k] == null) { try { MZURL[k] = LAIRART.sym(id, px).toDataURL(); } catch (e) { MZURL[k] = ''; } } return MZURL[k]; }
const MZICV = {};
function mzIconCv(id, star, px) { const k = id + ':' + star + ':' + px; if (!MZICV[k]) { try { MZICV[k] = LAIRART.icon(typeof lrArtId === 'function' ? lrArtId(id) : id, star || 1, px); } catch (e) { MZICV[k] = null; } } return MZICV[k]; }
function mzRoomIcon(id) { const k = 'room:' + id; if (MZURL[k] == null) { try { MZURL[k] = (mzFn('mazeRoomMark') ? LAIRART.mazeRoomMark(48, id, 0) : LAIRART.room(id, 48, 0, 1, 0)).toDataURL(); } catch (e) { MZURL[k] = ''; } } return MZURL[k]; }
function mzTrapIcon(id) {
  const k = 'trap:' + id; if (MZURL[k] != null) return MZURL[k];
  try { const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'); if (mzFn('mazeFloor')) x.drawImage(LAIRART.mazeFloor(48, 10, 'path', 2), 0, 0); else { x.fillStyle = '#16232a'; x.fillRect(0, 0, 48, 48); } mzTrapDraw(x, id, 0, 0, 48, 0.2); MZURL[k] = c.toDataURL(); } catch (e) { MZURL[k] = ''; }
  return MZURL[k];
}
const mzStars = n => (n > 1 ? `<span class="mz-stars">${'★'.repeat(n)}</span>` : '');

// ---- 저장: 둥지 전투의 저장과 섞이지 않게 제 키에. base.js 가 'maze' 를 아는 키로 두면 store 를 쓴다
const MZKEY = 'maze';
const mzOwnKey = () => !(typeof SAVE_KEYS !== 'undefined' && SAVE_KEYS && SAVE_KEYS[MZKEY]);
function mzSave() { const M = MZ.M; if (!M) return; try { const raw = M.phase === 'over' ? null : JSON.parse(MAZE.save(M)); if (mzOwnKey()) { if (raw) localStorage.setItem('nestmaze.' + MZKEY, JSON.stringify(raw)); else localStorage.removeItem('nestmaze.' + MZKEY); } else if (raw) store.set(MZKEY, raw); else store.del(MZKEY); } catch (e) { /* 저장 없이 */ } }
function mzSaved() {
  let raw = null; try { raw = mzOwnKey() ? JSON.parse(localStorage.getItem('nestmaze.' + MZKEY) || 'null') : store.get(MZKEY); } catch (e) { raw = null; } if (!raw) return null;
  try { const M = MAZE.load(raw); if (M && M.phase === 'prep') { MAZE.view(M); return M; } } catch (e) { /* 아래에서 치운다 */ }
  try { if (mzOwnKey()) localStorage.removeItem('nestmaze.' + MZKEY); else store.del(MZKEY); } catch (e) { /* 저장 없이 */ } return null;
}

// ---- 첫 화면 ----
function mzTitle() {
  const lr = $('lr'); if (lr) lr.hidden = true; const m = $('mz'); if (m) m.hidden = true; $('modal').hidden = true; $('title').hidden = false; MZ.phase = 'title';
  const run = mzSaved(), snd = META.sound !== false;
  $('menu').innerHTML = (run ? `<button class="btn pri" data-z="cont">이어하기<small>침입 ${run.raid}/${run.raids}</small></button><button class="btn" data-z="fresh">새로 시작</button>` : '<button class="btn pri" data-z="start">시작</button>')
    + `<div class="mz-row2"><button class="btn" data-z="help">도움말</button><button class="btn${snd ? ' on' : ''}" data-z="sound" aria-pressed="${snd}">소리 ${snd ? '켬' : '끔'}</button></div>`;
  mzMusic('title');
}
const MZHELP = [
  ['짓기', '<p>바위를 눌러 판다. 입구에서 알까지 길이 끊기는 파기와 메우기는 되지 않는다.</p><p>판 칸은 통로, 권속 방, 함정 가운데 하나가 된다. 권속 방에는 셋까지 세우고, 방 종류 하나를 깐다.</p><p>본체 방에는 본체와 권속 둘이 선다.</p>'],
  ['침입', '<p>일행은 입구에서 알까지 가장 짧은 길로 온다. 지도의 점선이 그 길이다.</p><p>함정을 밟으면 다치고, 권속이 선 방에 닿으면 그 방에서 싸운다. 다친 것은 다음 방까지 이어진다.</p><p>알에 닿은 자마다 알이 깎인다. 알이 깨지면 판이 끝난다.</p>'],
  ['진화', '<p>같은 권속 셋을 모으면 하나가 되어 별이 오른다. 별은 셋까지 오른다.</p><p>방 안에서 같은 성향 둘이면 그 성향의 힘이 붙는다.</p>'],
];
function mzHelp(page) {
  page = page || 0; const m = $('modal');
  m.innerHTML = `<div class="sh-box mz-help" role="dialog" aria-modal="true"><div class="sh-head"><h2>도움말</h2><button class="sh-x" data-z="mclose" aria-label="닫기">✕</button></div><div class="sh-tabs" style="grid-template-columns:repeat(${MZHELP.length},minmax(0,1fr))">${MZHELP.map((q, i) => `<button class="sh-tab${i === page ? ' on' : ''}" data-z="hpage" data-i="${i}">${q[0]}</button>`).join('')}</div><div class="sh-body">${MZHELP[page][1]}</div></div>`;
  m.hidden = false;
}
function mzTitleClick(e) {
  const b = e.target.closest('[data-z]'); if (!b) { if (e.target.id === 'modal') $('modal').hidden = true; return; } const a = b.dataset.z;
  if (a === 'start' || a === 'fresh') { try { if (mzOwnKey()) localStorage.removeItem('nestmaze.' + MZKEY); else store.del(MZKEY); } catch (er) { /* 저장 없이 */ } return mzOpen(null); }
  if (a === 'cont') { const run = mzSaved(); return run ? mzOpen(run) : mzTitle(); }
  if (a === 'help') { mzSay('click'); return mzHelp(0); }
  if (a === 'hpage') return mzHelp(+b.dataset.i);
  if (a === 'mclose') { $('modal').hidden = true; return; }
  if (a === 'sound') { META.sound = META.sound === false; META.music = META.sound; try { saveMeta(); if (typeof musicSet === 'function') musicSet(META.music); } catch (er) { /* 저장 없이 */ } mzSay('click'); return mzTitle(); }
}

// ---- 세우기 ----
function mzMount() {
  if ($('mz')) return;
  const el = document.createElement('div'); el.id = 'mz'; el.hidden = true;
  el.innerHTML = `<div id="mz-bar"></div>
<div id="mz-main"><div id="mz-mapwrap"><canvas id="mz-cv" width="${MW}" height="${MH}"></canvas><div id="mz-ov"></div></div>
<div id="mz-side"><div id="mz-bench"></div><div id="mz-shop"></div><div id="mz-raid" hidden></div></div></div>
<div id="mz-sheet" hidden></div><div id="mz-coach" hidden></div><div id="mz-toast" hidden></div><img id="mz-drag" alt="" hidden><div id="mz-zoom" hidden></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', mzClick);
  el.addEventListener('pointerdown', mzDown); el.addEventListener('pointermove', mzMove); el.addEventListener('pointerup', mzUp); el.addEventListener('pointercancel', mzCancel);
  // 끄는 동안에는 손가락의 움직임을 게임이 쥔다 (폰에서 스크롤로 넘어가 끌기가 취소되지 않게)
  el.addEventListener('touchmove', e => { if (MZ.drag && MZ.drag.uid && e.cancelable) e.preventDefault(); }, { passive: false });
  window.addEventListener('resize', () => { if (!el.hidden) mzSize(); });
  window.addEventListener('keydown', e => { if (el.hidden || e.key !== 'Escape') return; if (MZ.sheet && MZ.sheet.kind !== 'result') mzSheetClose(); else if (MZ.sel) { MZ.sel = null; mzDraw(); } });
}
function mzOpen(run) {
  mzMount(); $('title').hidden = true; $('modal').hidden = true; $('mz').hidden = false;
  MZ.M = run || MAZE.newRun((Date.now() % 1000000) + 1); MZ.phase = 'prep'; MZ.sel = null; MZ.sheet = null; MZ.play = null; $('mz-sheet').hidden = true; $('mz-ov').innerHTML = '';
  const coachOk = !(navigator.webdriver && !window.__mazeCoach); MZ.tut = coachOk && !(META && META.mazeTut) ? 0 : -1; MZ.dug0 = MAZE.dugCount(MZ.M);
  mzDraw(); mzSize(); mzMusic('day'); if (!MZ.raf) { MZ.last = performance.now(); MZ.raf = requestAnimationFrame(mzLoop); }
}
function mzHome() { mzSave(); $('mz').hidden = true; MZ.sheet = null; $('mz-sheet').hidden = true; if (typeof lrReplayEnd === 'function' && typeof LU !== 'undefined' && LU.replay) { LU.replay.done = null; lrReplayEnd(); } MZ.play = null; mzTitle(); }
// 크기: 지도는 위에서 아래로, 아래에 대기석·상점(침입 중에는 빠르기와 일행)
const MZSIDE = 150;
function mzSize() {
  const wrap = $('mz-mapwrap'), cv = $('mz-cv'), vw = window.innerWidth, vh = window.innerHeight, wide = vw >= 900, barH = $('mz-bar').offsetHeight || 44;
  $('mz').classList.toggle('wide', wide);
  const availH = vh - barH - (wide ? 16 : MZSIDE + 8), availW = wide ? Math.min(vw - 470, 520) : vw - 4;
  let k = Math.min(availW / MW, availH / MH); k = Math.max(0.5, Math.min(wide ? 1.6 : 1.4, k)); MZ.k = k;
  cv.style.width = Math.floor(MW * k) + 'px'; cv.style.height = Math.floor(MH * k) + 'px'; wrap.style.width = Math.floor(MW * k) + 'px'; wrap.style.height = Math.floor(MH * k) + 'px';
  mzCoach();
}

// ---- 위 띠, 대기석, 상점 ----
function mzView() { MZ.v = MAZE.view(MZ.M); return MZ.v; }
function mzDraw() {
  const M = MZ.M; if (!M) return; const v = mzView(), raid = MZ.phase === 'raid', P = raid && MZ.play && !MZ.play.done ? MZ.play : null, eg = raid && MZ.play ? MZ.play.egg : v.egg.hp, gold = P ? P.gold0 : v.gold, rd = P ? P.raidNo : Math.min(v.raid, v.raids);
  $('mz-bar').innerHTML = `<span class="mz-stat mz-gold" aria-label="진액 ${gold}"><i></i>${gold}</span><span class="mz-stat" aria-label="레벨 ${v.level}, 세운 수 ${v.placed}/${v.cap}">Lv ${v.level}<small>${v.placed}/${v.cap}</small></span><span class="mz-stat mz-egg${eg < v.egg.max * 0.5 ? ' low' : ''}" aria-label="알 ${eg}/${v.egg.max}"><i></i>${eg}<small>/${v.egg.max}</small></span><span class="mz-stat mz-rd">침입 ${rd}/${v.raids}</span><button class="mz-menu" data-m="menu" aria-label="메뉴"><i></i></button>`;
  $('mz-bench').hidden = raid; $('mz-shop').hidden = raid; $('mz-raid').hidden = !raid;
  if (raid) { mzRaidPanel(); mzCoach(); return; }
  const sel = MZ.sel && MZ.sel.uid;
  $('mz-bench').innerHTML = v.bench.map((u, i) => (u ? `<div class="mz-slot has${sel === u.uid ? ' on' : ''}${MZ.pops[u.uid] > MZ.t ? ' pop' : ''}" data-bench="${i}" data-u="${u.uid}" role="button" aria-label="${esc(u.name)} ${u.star}성"><img src="${mzIcon(u.kind, u.star, 40)}" alt="">${mzStars(u.star)}</div>` : `<div class="mz-slot" data-bench="${i}"></div>`)).join('')
    + `<button class="mz-raidbtn pri" data-m="raid">침입</button>`;
  $('mz-shop').innerHTML = `<div class="mz-acts"><button data-m="reroll"${v.canReroll ? '' : ' disabled'}>뽑기 ${v.costs.reroll}</button><button data-m="xp"${v.canXp ? '' : ' disabled'}>${v.level >= v.maxLv ? 'Lv ' + v.level : '넓히기 ' + v.costs.xp}${v.level >= v.maxLv ? '' : `<i class="mz-xp"><b style="width:${v.xpNeed ? Math.round(v.xp / v.xpNeed * 100) : 100}%"></b></i>`}</button></div>`
    + v.shop.map((s, i) => (s ? `<button class="mz-card c${s.cost}${s.can ? '' : ' poor'}${MZ.sel && MZ.sel.shop === i ? ' on' : ''}" data-m="shop" data-i="${i}" aria-label="${esc(s.name)} ${s.cost}"><em>${s.cost}</em><img class="mz-asp" src="${mzSym(s.asp, 14)}" alt="${esc(s.aspName)}"><img src="${mzIcon(s.kind, 1, 36)}" alt=""><b>${esc(s.name)}</b></button>` : '<div class="mz-card empty"></div>')).join('');
  mzCoach(); mzSave();
}
function mzToast(msg, ms) { const t = $('mz-toast'); t.textContent = msg; t.hidden = false; MZ.toastT = MZ.t + (ms || 1700); }

// ---- 지도 그리기 ----
const mzCx = c => (c % 5) * MS + MS / 2, mzCy = c => MTOP + Math.floor(c / 5) * MS + MS / 2;
// 이웃: 위 1, 오른쪽 2, 아래 4, 왼쪽 8. 입구(0행 가운데의 위)는 판 칸으로 친다
function mzNb(grid, c) { const r = Math.floor(c / 5), q = c % 5, out = []; [[-1, 0], [0, 1], [1, 0], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = q + dc; if (rr === -1 && cc === 2) out.push(true); else if (rr < 0 || rr > 7 || cc < 0 || cc > 4) out.push(false); else out.push(!!grid[rr * 5 + cc].dug); }); return out; }
const mzMask = (grid, c) => mzNb(grid, c).reduce((a, d, k) => a | (d ? 1 << k : 0), 0);
const mzRockV = (grid, c) => mzNb(grid, c).reduce((a, d, k) => a | (d ? 0 : 1 << k), 0);
function mzTrapDraw(x, id, X, Y, S, t) {
  if (mzFn('mazeTrap')) { x.drawImage(LAIRART.mazeTrap(S, MZTRAP[id] || 'pit', t), X, Y); return; }
  const col = MZTRAPC[id] || '#ffffff'; x.save(); x.fillStyle = col; x.globalAlpha = 0.85;
  if (id === 'tr_teeth') { for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(X + S * (0.2 + i * 0.16), Y + S * 0.62); x.lineTo(X + S * (0.28 + i * 0.16), Y + S * 0.38); x.lineTo(X + S * (0.36 + i * 0.16), Y + S * 0.62); x.fill(); } }
  else { x.beginPath(); x.arc(X + S / 2, Y + S / 2, S * 0.22, 0, 6.2832); x.fill(); }
  x.restore();
}
function mzEggDraw(x, c, hp, max, t, shake) {
  const crack = Math.max(0, Math.min(4, Math.floor((1 - hp / max) * 5))), cx = mzCx(c) + (shake ? Math.sin(t * 60) * 3 : 0), cy = mzCy(c) - 2;
  if (mzFn('mazeEgg')) { const e = LAIRART.mazeEgg(MS, crack, t); x.drawImage(e, Math.round(cx - e.width / 2), Math.round(cy - e.height / 2)); return; }
  x.save(); x.fillStyle = '#0a0612'; x.strokeStyle = '#6a4ab0'; x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy, MS * 0.36, MS * 0.44, 0, 0, 6.2832); x.fill(); x.stroke();
  x.fillStyle = '#c8b8ff'; for (let i = 0; i < 9; i++) x.fillRect(Math.round(cx + Math.cos(i * 2.4) * MS * 0.22), Math.round(cy + Math.sin(i * 1.7) * MS * 0.3), 1, 1);
  x.globalAlpha = 0.3 + 0.2 * Math.sin(t * 4); x.fillStyle = '#b48cff'; x.beginPath(); x.arc(cx, cy, MS * 0.12, 0, 6.2832); x.fill(); x.globalAlpha = 1;
  x.strokeStyle = '#e9e2cf'; x.lineWidth = 1; for (let k = 0; k < crack; k++) { x.beginPath(); x.moveTo(cx - MS * 0.2 + k * 8, cy - MS * 0.3); x.lineTo(cx - MS * 0.12 + k * 8, cy - MS * 0.05); x.lineTo(cx - MS * 0.18 + k * 8, cy + MS * 0.2); x.stroke(); }
  x.restore();
}
function mzCellDraw(x, grid, c, t, form) {
  const g = grid[c], X = (c % 5) * MS, Y = MTOP + Math.floor(c / 5) * MS, A = LAIRART;
  if (!g.dug) { if (mzFn('mazeRock')) x.drawImage(A.mazeRock(MS, mzRockV(grid, c), c * 7 + 3), X, Y); else { x.fillStyle = '#120e16'; x.fillRect(X, Y, MS, MS); x.fillStyle = '#1c1722'; x.fillRect(X + 6 + (c * 13) % 30, Y + 10 + (c * 7) % 30, 10, 6); } return; }
  if (g.use === 'core') { if (mzFn('mazeCore')) x.drawImage(A.mazeCore(MS, form, t, mzMask(grid, c)), X, Y); else { x.fillStyle = '#163238'; x.fillRect(X, Y, MS, MS); } return; }
  const room = g.use === 'kin' || g.use === 'egg';
  if (mzFn('mazeFloor')) x.drawImage(A.mazeFloor(MS, mzMask(grid, c), room ? 'room' : 'path', c * 5 + 1), X, Y); else { x.fillStyle = room ? '#1c3a3c' : '#16282c'; x.fillRect(X + 2, Y + 2, MS - 4, MS - 4); }
  if (g.use === 'kin' && g.room) { if (mzFn('mazeRoomMark')) x.drawImage(A.mazeRoomMark(MS, g.room, t), X, Y); else { try { x.globalAlpha = 0.8; x.drawImage(A.room(g.room, MS, 0, 1, t), X, Y); x.globalAlpha = 1; } catch (e) { x.globalAlpha = 1; } } }
  if (g.use === 'kin' && !g.room) { x.save(); x.strokeStyle = 'rgba(90,216,196,.35)'; x.lineWidth = 2; x.setLineDash([4, 4]); x.strokeRect(X + 6, Y + 6, MS - 12, MS - 12); x.restore(); }
  if (g.use === 'trap') mzTrapDraw(x, g.trap, X, Y, MS, t);
}
// 길: 입구에서 알까지 칸 가운데를 잇는 점선. 부서질 바위에는 금
function mzPathDraw(x, cells, breaks, t) {
  if (!cells || cells.length < 1) return; const pts = [[2, -1]].concat(cells.map(c => [c % 5, Math.floor(c / 5), breaks.includes(c)]));
  if (mzFn('mazePath')) { LAIRART.mazePath(x, pts, MS, t, 'walk', { oy: MTOP }); breaks.forEach(b => { const i = cells.indexOf(b); if (i < 0) return; const seg = [i > 0 ? cells[i - 1] : 2, b, cells[i + 1] != null ? cells[i + 1] : b].map((c, k) => (k === 0 && i === 0 ? [2, -1] : [c % 5, Math.floor(c / 5), c === b])); LAIRART.mazePath(x, seg, MS, t, 'break', { oy: MTOP }); }); return; }
  x.save(); x.strokeStyle = '#ffb060'; x.lineWidth = 3; x.setLineDash([6, 6]); x.lineDashOffset = -t * 40; x.beginPath(); pts.forEach(([q, r], i) => { const px = q * MS + MS / 2, py = MTOP + r * MS + MS / 2; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); x.restore();
  breaks.forEach(b => { x.save(); x.strokeStyle = '#ff8a40'; x.lineWidth = 2; const cx = mzCx(b), cy = mzCy(b); x.beginPath(); x.moveTo(cx - 14, cy - 12); x.lineTo(cx, cy); x.lineTo(cx + 12, cy - 6); x.moveTo(cx, cy); x.lineTo(cx - 4, cy + 14); x.stroke(); x.restore(); });
}
// 방의 권속: 셋까지 작은 그림으로 (본체 방은 둘)
const MZUSPOT = [[0.28, 0.66], [0.72, 0.66], [0.5, 0.36]];
// 본체 방의 본체: 칸보다 크게, 방 바닥에 발을 딛고 위로 솟는다
function mzCoreBoss(x, form, now) { if (typeof LAIRART === 'undefined' || !LAIRART.boss) return; const h = lrBossH(form === 'drop' ? null : form, form === 'drop' ? 0 : 1), fr = h.frame('idle', now), c = MAZE.CORE, sz = Math.round(MS * 1.35), X = Math.round((c % 5) * MS + MS / 2 - sz / 2), Y = Math.round(MTOP + Math.floor(c / 5) * MS + MS * 1.02 - sz); x.drawImage(fr, X, Y, sz, sz); }
function mzUnitsDraw(x, grid, c, units, alpha) {
  const X = (c % 5) * MS, Y = MTOP + Math.floor(c / 5) * MS, core = grid[c].use === 'core', spots = core ? [[0.2, 0.74], [0.8, 0.74]] : MZUSPOT;
  units.forEach((u, i) => { const sp = spots[i]; if (!sp) return; const ic = mzIconCv(u.kind, u.star, 30); if (!ic) return; const px = Math.round(X + sp[0] * MS - 15), py = Math.round(Y + sp[1] * MS - 18); x.save(); if (alpha != null) x.globalAlpha = alpha; x.fillStyle = 'rgba(5,4,10,.5)'; x.beginPath(); x.ellipse(px + 15, py + 28, 11, 4, 0, 0, 6.2832); x.fill(); x.drawImage(ic, px, py); if (u.star > 1) { x.fillStyle = u.star >= 3 ? '#ffd040' : '#e8e8f0'; for (let s = 0; s < u.star; s++) x.fillRect(px + 9 + s * 5, py + 30, 4, 3); } x.restore(); MZ.dbg.units++; });
}
function mzRender(now) {
  const cv = $('mz-cv'), x = cv.getContext('2d'), M = MZ.M; if (!M) return; const P = MZ.play, v = MZ.v || mzView(), t = now / 1000, tf = (now % 3000) / 3000;
  const grid = P ? P.grid : v.grid, form = typeof LAIR !== 'undefined' ? LAIR.formOf(Object.keys(M.board).reduce((a, c) => a.concat(M.board[c].map(id => M.unit[id] && M.unit[id].kind).filter(Boolean)), [])) : 'drop';
  MZ.dbg = { units: 0, lit: [], path: 0, party: 0, dark: MZ.dbg.dark || 0 };
  x.imageSmoothingEnabled = false; x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#050407'; x.fillRect(0, 0, MW, MH);
  if (mzFn('mazeEntrance')) x.drawImage(LAIRART.mazeEntrance(MS, 5), 0, 0); else { const gr = x.createLinearGradient(0, 0, 0, MTOP); gr.addColorStop(0, '#3a3020'); gr.addColorStop(1, '#050407'); x.fillStyle = gr; x.fillRect(0, 0, MW, MTOP); x.fillStyle = '#ffd890'; x.fillRect(MS * 2 + 22, 0, 20, MTOP - 6); }
  for (let c = 0; c < 40; c++) if (grid[c].use !== 'core') mzCellDraw(x, grid, c, tf, form);
  // 부서지는 바위
  if (P && P.brk && P.brk.t1 > MZ.t) { const c = P.brk.cell, k = 1 - (P.brk.t1 - MZ.t) / P.brk.dur; x.save(); x.fillStyle = '#8a7a60'; for (let i = 0; i < 10; i++) { const a = i * 0.63, d = k * MS * 0.5; x.fillRect(Math.round(mzCx(c) + Math.cos(a) * d), Math.round(mzCy(c) + Math.sin(a) * d + k * k * 20), 4, 4); } x.restore(); }
  // 다음 일행의 길 (준비 때). 알과 본체 그림 아래에
  if (!P && v.next && MZ.phase === 'prep') { mzPathDraw(x, v.next.path, v.next.breaks, tf); MZ.dbg.path = v.next.path.length; }
  // 고른 권속을 세울 수 있는 방
  const selU = MZ.sel && MZ.sel.uid ? MZ.sel.uid : MZ.drag && MZ.drag.moved ? MZ.drag.uid : null;
  if (selU && !P) { for (let c = 0; c < 40; c++) { const g = v.grid[c]; if (!(g.use === 'kin' || g.use === 'core') || g.units.length >= g.max && !g.units.some(u => u.uid === selU)) continue; MZ.dbg.lit.push(c); const X = (c % 5) * MS, Y = MTOP + Math.floor(c / 5) * MS; x.save(); x.globalAlpha = 0.2 + 0.12 * Math.sin(now / 160); x.fillStyle = '#5ad8c4'; x.fillRect(X + 3, Y + 3, MS - 6, MS - 6); x.globalAlpha = 1; x.strokeStyle = MZ.hover === c ? '#fff3a0' : '#5ad8c4'; x.lineWidth = 2; x.strokeRect(X + 3.5, Y + 3.5, MS - 7, MS - 7); x.restore(); } }
  mzCellDraw(x, grid, MAZE.CORE, tf, form);
  mzCoreBoss(x, form, now);
  mzEggDraw(x, MAZE.EGG, P ? P.egg : v.egg.hp, v.egg.max, t, P && P.eggHit > MZ.t);
  // 권속
  for (let c = 0; c < 40; c++) { const g = v.grid[c]; if (!g.units.length) continue; mzUnitsDraw(x, grid, c, g.units.map(u => ({ uid: u.uid, kind: u.kind, star: u.star })), P && P.dead && g.units.every(u => P.dead[u.uid]) ? 0.35 : null); }
  // 진화의 터짐
  if (MZ.burst && MZ.burst.t1 > MZ.t) { const b = MZ.burst, k = 1 - (b.t1 - MZ.t) / 700; x.save(); x.strokeStyle = '#ffd040'; x.globalAlpha = 1 - k; x.lineWidth = 3; x.beginPath(); x.arc(mzCx(b.cell), mzCy(b.cell), 10 + k * 40, 0, 6.2832); x.stroke(); x.restore(); }
  // 칸 고르기 표시
  if (MZ.sheet && MZ.sheet.cell != null) { const c = MZ.sheet.cell, X = (c % 5) * MS, Y = MTOP + Math.floor(c / 5) * MS; x.save(); x.strokeStyle = '#fff3a0'; x.lineWidth = 2; x.setLineDash([5, 3]); x.lineDashOffset = -now / 60; x.strokeRect(X + 2.5, Y + 2.5, MS - 5, MS - 5); x.restore(); }
  // 함정의 번쩍임
  if (P && P.flash && P.flash.t1 > MZ.t) { const c = P.flash.cell, k = (P.flash.t1 - MZ.t) / P.flash.dur; x.save(); x.globalAlpha = 0.55 * k; x.fillStyle = P.flash.col; x.fillRect((c % 5) * MS, MTOP + Math.floor(c / 5) * MS, MS, MS); x.restore(); }
  // 일행 표식
  if (P && P.pos && !P.done) { const px = Math.round(MS * 0.66), kinds = P.alive.map(p => p.kind), n = kinds.length; if (n) { if (mzFn('mazeParty')) { const im = LAIRART.mazeParty(px, kinds, n, tf * 4); x.drawImage(im, Math.round(P.pos.x - im.width / 2), Math.round(P.pos.y - im.height / 2)); } else { const ic = mzIconCv(kinds[0], 1, px); x.fillStyle = '#e08a30'; x.beginPath(); x.arc(P.pos.x, P.pos.y, px / 2, 0, 6.2832); x.fill(); if (ic) x.drawImage(ic, P.pos.x - px / 2, P.pos.y - px / 2); x.fillStyle = '#fff'; x.font = '700 14px sans-serif'; x.fillText(String(n), P.pos.x + px / 2 - 6, P.pos.y + px / 2); } MZ.dbg.party = n; const ms = P.alive.reduce((a, p) => a + (p.msan || 0), 0), sn = P.alive.reduce((a, p) => a + (p.msan ? Math.max(0, p.san) : 0), 0); if (ms) { const w = px - 8, bx = Math.round(P.pos.x - w / 2), by = Math.round(P.pos.y + px / 2 - 2); x.fillStyle = '#0c0812'; x.fillRect(bx - 1, by - 1, w + 2, 5); x.fillStyle = '#2a1a48'; x.fillRect(bx, by, w, 3); x.fillStyle = '#b08fff'; x.fillRect(bx, by, Math.round(w * sn / ms), 3); } } }
}

// ---- 누르기 ----
function mzCellAt(cx, cy) { const r = $('mz-cv').getBoundingClientRect(), x = (cx - r.left) / MZ.k, y = (cy - r.top) / MZ.k - MTOP; if (x < 0 || x >= MW || y < 0 || y >= MS * 8) return -1; return Math.floor(y / MS) * 5 + Math.floor(x / MS); }
function mzClick(e) {
  if (e.target.id === 'mz-sheet' && MZ.sheet && MZ.sheet.kind !== 'result' && MZ.sheet.kind !== 'over') return mzSheetClose();
  const b = e.target.closest('[data-m]'); if (!b || b.disabled) return; const a = b.dataset.m, M = MZ.M;
  if (a === 'menu') { mzSay('click'); return mzSheet({ kind: 'menu' }); }
  if (a === 'close') return mzSheetClose();
  if (a === 'home') return mzHome();
  if (a === 'tog') { const k = b.dataset.v; META[k] = k === 'sound' ? META.sound === false : META[k] === false; try { saveMeta(); if (k === 'music' && typeof musicSet === 'function') musicSet(META.music); } catch (er) { /* 저장 없이 */ } return mzSheet({ kind: 'menu' }); }
  if (a === 'spd') { if (typeof lrSpeedSet === 'function') lrSpeedSet(+b.dataset.v); if (MZ.sheet && MZ.sheet.kind === 'menu') mzSheet({ kind: 'menu' }); if (MZ.phase === 'raid') mzRaidPanel(); return; }
  if (a === 'skip') return mzSkipAll();
  if (a === 'tutok') { MZ.tut++; return mzCoach(); }
  if (a === 'tutoff') { MZ.tut = -1; if (META) { META.mazeTut = 1; try { saveMeta(); } catch (er) { /* 저장 없이 */ } } $('mz-coach').hidden = true; return; }
  if (a === 'next') return mzNext();
  if (a === 'again') { mzSheetClose(); return mzOpen(null); }
  if (a === 'uinfo') return mzSheet({ kind: 'unit', kindId: b.dataset.k, star: +b.dataset.s || 1, uid: b.dataset.u ? +b.dataset.u : null });
  if (a === 'pinfo') return mzSheet({ kind: 'party' });
  if (MZ.phase !== 'prep') return;
  if (a === 'shop') { const i = +b.dataset.i; MZ.sel = { shop: i }; mzSay('click'); mzDraw(); return mzSheet({ kind: 'shop', i }); }
  if (a === 'buy') return mzBuy(+b.dataset.i);
  if (a === 'reroll') { const r = MAZE.reroll(M); if (r.ok) mzSay('slide'); else mzToast(r.msg); return mzDraw(); }
  if (a === 'xp') { const r = MAZE.buyXp(M); if (r.ok) { mzSay(r.up ? 'up' : 'click'); if (r.up) mzToast('Lv ' + M.level); } else mzToast(r.msg); return mzDraw(); }
  if (a === 'raid') return mzRaid();
  const cell = MZ.sheet && MZ.sheet.cell;
  if (a === 'dig') { const r = MAZE.dig(M, cell); if (!r.ok) return mzToast(r.msg); mzSay('thud'); mzDraw(); return mzSheet({ kind: 'cell', cell }); }
  if (a === 'fill') { const r = MAZE.fill(M, cell); if (!r.ok) return mzToast(r.msg); mzSay('thud'); mzDraw(); return mzSheet({ kind: 'cell', cell }); }
  if (a === 'use') { const u = b.dataset.u, r = MAZE.setUse(M, cell, u, u === 'trap' ? b.dataset.id || MAZE.TRAP_IDS[0] : null); if (!r.ok) return mzToast(r.msg); mzSay('click'); mzDraw(); return mzSheet({ kind: 'cell', cell }); }
  if (a === 'room') { const r = MAZE.setUse(M, cell, 'kin', b.dataset.id); if (!r.ok) return mzToast(r.msg); mzSay('thud'); mzDraw(); return mzSheet({ kind: 'cell', cell }); }
  if (a === 'trap') { const r = MAZE.setUse(M, cell, 'trap', b.dataset.id); if (!r.ok) return mzToast(r.msg); mzSay('thud'); mzDraw(); return mzSheet({ kind: 'cell', cell }); }
  if (a === 'tobench') { const r = MAZE.move(M, +b.dataset.u, { bench: null }); if (!r.ok) return mzToast(r.msg); mzSay('click'); mzDraw(); return cell != null ? mzSheet({ kind: 'cell', cell }) : mzSheetClose(); }
  if (a === 'sell') { const r = MAZE.sell(M, +b.dataset.u); if (!r.ok) return mzToast(r.msg); mzSay('coin'); MZ.sel = null; mzDraw(); return cell != null ? mzSheet({ kind: 'cell', cell }) : mzSheetClose(); }
  if (a === 'pick') { MZ.sel = { uid: +b.dataset.u }; mzSheetClose(); mzSay('click'); return mzDraw(); }
}
function mzBuy(i) {
  const M = MZ.M, r = MAZE.buy(M, i); if (!r.ok) { mzToast(r.msg); return mzDraw(); }
  mzSay('coin'); MZ.sel = null; mzSheetClose(); (r.merged || []).forEach(m => mzMergePop(m)); mzDraw();
}
// 셋이 하나로: 대기석 칸이나 지도의 방에서 터진다
function mzMergePop(m) {
  MZ.pops[m.uid] = MZ.t + 900; mzSay('combo'); const w = MAZE.whereOf(MZ.M, m.uid); if (w && w.cell != null) MZ.burst = { cell: w.cell, t1: MZ.t + 700 };
  mzToast(LAIR.KIN[m.kind].name + ' ' + '★'.repeat(m.star)); MZ.merges = (MZ.merges || 0) + 1;
}
function mzDown(e) {
  if (MZ.phase !== 'prep' || MZ.sheet) return; const slot = e.target.closest('.mz-slot'), onCv = e.target.id === 'mz-cv'; if (!slot && !onCv) return;
  let uid = null, cell = -1;
  if (slot) uid = slot.dataset.u ? +slot.dataset.u : null; else { cell = mzCellAt(e.clientX, e.clientY); const here = cell >= 0 ? MZ.M.board[cell] || [] : []; uid = here.length ? here[here.length - 1] : null; }
  MZ.drag = { uid, cell, bench: slot ? +slot.dataset.bench : null, x0: e.clientX, y0: e.clientY, moved: false };
  if (uid) e.preventDefault();
}
function mzMove(e) {
  const d = MZ.drag; if (!d || !d.uid) return; if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 10) return;
  if (!d.moved) { d.moved = true; MZ.sel = null; const u = MZ.M.unit[d.uid], g = $('mz-drag'); g.src = mzIcon(u.kind, u.star, 44); g.hidden = false; mzDraw(); }
  const g = $('mz-drag'); g.style.left = (e.clientX - 26) + 'px'; g.style.top = (e.clientY - 42) + 'px'; MZ.hover = mzCellAt(e.clientX, e.clientY); d.lx = e.clientX; d.ly = e.clientY;
}
// 끌기가 취소되면(손가락이 화면 밖으로, 알림이 끼어듦) 마지막으로 가리킨 자리에 놓는다
function mzCancel() { const d = MZ.drag; if (d && d.moved && d.lx != null) return mzUp({ clientX: d.lx, clientY: d.ly }); MZ.drag = null; $('mz-drag').hidden = true; MZ.hover = -1; }
function mzUp(e) {
  const d = MZ.drag; MZ.drag = null; $('mz-drag').hidden = true; MZ.hover = -1; if (!d || MZ.phase !== 'prep') return; const M = MZ.M;
  if (d.moved) {
    const el = document.elementFromPoint(e.clientX, e.clientY), slot = el && el.closest('.mz-slot'), cell = mzCellAt(e.clientX, e.clientY);
    if (slot) return mzMoveTo(d.uid, { bench: +slot.dataset.bench }); if (el && el.closest('#mz-shop')) { const r = MAZE.sell(M, d.uid); if (r.ok) mzSay('coin'); return mzDraw(); } if (cell >= 0) return mzMoveTo(d.uid, { cell }); return mzDraw();
  }
  // 누르기
  if (d.bench != null) { if (MZ.sel && MZ.sel.uid && MZ.sel.uid !== d.uid) return mzMoveTo(MZ.sel.uid, { bench: d.bench }); if (d.uid) { MZ.sel = MZ.sel && MZ.sel.uid === d.uid ? null : { uid: d.uid }; mzSay('click'); } return mzDraw(); }
  const cell = d.cell; if (cell < 0) { MZ.sel = null; return mzDraw(); }
  if (MZ.sel && MZ.sel.uid) { const g = M.grid[cell]; if (g.use === 'kin' || g.use === 'core') return mzMoveTo(MZ.sel.uid, { cell }); MZ.sel = null; mzDraw(); }
  mzSay('click'); mzSheet({ kind: 'cell', cell });
}
function mzMoveTo(uid, to) { const r = MAZE.move(MZ.M, uid, to); if (r.ok) { mzSay(to.cell != null ? 'thud' : 'click'); MZ.sel = null; } else mzToast(r.msg); mzDraw(); }

// ---- 아래에서 올라오는 창 ----
const mzSt = (k, n) => `<span class="mz-st"><small>${k}</small><b>${n}</b></span>`;
function mzUnitRow(u, cell) { return `<div class="mz-urow"><button class="mz-uin" data-m="uinfo" data-k="${u.kind}" data-s="${u.star}" data-u="${u.uid}"><img src="${mzIcon(u.kind, u.star, 36)}" alt=""><b>${esc(u.name)}</b>${mzStars(u.star)}</button><button data-m="pick" data-u="${u.uid}">옮기기</button><button data-m="tobench" data-u="${u.uid}">대기석</button><button data-m="sell" data-u="${u.uid}">팔기 ${u.sell}</button></div>`; }
function mzSheet(s) {
  MZ.sheet = s; const el = $('mz-sheet'), v = MZ.v || mzView(); let h = '';
  if (s.kind === 'cell') {
    const g = v.grid[s.cell];
    if (!g.dug) h = `<h3>바위</h3><div class="mz-acts2"><button class="pri" data-m="dig"${g.canDig ? '' : ' disabled'}>파기 ${g.digCost}</button></div>${g.digWhy ? `<p class="mz-why">${esc(g.digWhy)}</p>` : ''}<p class="mz-note">판 칸 ${v.dug}/${v.dugCap}</p>`;
    else if (g.use === 'egg') h = `<h3>알</h3><div class="mz-stats">${mzSt('체력', v.egg.hp + '/' + v.egg.max)}</div>`;
    else if (g.use === 'core') h = `<h3>본체 방</h3><p class="mz-note">권속 ${g.units.length}/${g.max}</p>${g.units.map(u => mzUnitRow(u, s.cell)).join('')}`;
    else {
      const title = g.use === 'kin' ? (g.roomInfo ? g.roomInfo.name : '권속 방') : g.use === 'trap' ? g.trapInfo.name : '통로';
      h = `<h3>${esc(title)}</h3><div class="mz-uses">${[['path', '통로'], ['kin', '권속 방'], ['trap', '함정']].map(q => `<button data-m="use" data-u="${q[0]}" class="${g.use === q[0] ? 'on' : ''}" aria-pressed="${g.use === q[0]}">${q[1]}</button>`).join('')}</div>`;
      if (g.use === 'kin') h += `<p class="mz-note">권속 ${g.units.length}/${g.max}</p>${g.units.map(u => mzUnitRow(u, s.cell)).join('')}<h4>방 종류 · ${v.costs.room}</h4><div class="mz-grid">${v.rooms.map(r => `<button data-m="room" data-id="${r.id}" class="${g.room === r.id ? 'on' : ''}"><img src="${mzRoomIcon(r.id)}" alt=""><b>${esc(r.name)}</b><small>${esc(r.short)}</small></button>`).join('')}</div>`;
      if (g.use === 'trap') h += `<div class="mz-grid">${v.traps.map(q => `<button data-m="trap" data-id="${q.id}" class="${g.trap === q.id ? 'on' : ''}"><img src="${mzTrapIcon(q.id)}" alt=""><b>${esc(q.name)}</b><small>${esc(q.short)}</small></button>`).join('')}</div><p class="mz-note">함정 ${v.costs.trap}</p>`;
      if (g.use === 'path') h += `<p class="mz-note">권속 방 0 · 함정 ${v.costs.trap}</p>`;
      h += `<div class="mz-acts2"><button data-m="fill"${g.canFill ? '' : ' disabled'}>메우기 +${g.fillGold}</button></div>${g.fillWhy ? `<p class="mz-why">${esc(g.fillWhy)}</p>` : ''}`;
    }
  }
  if (s.kind === 'shop') { const q = v.shop[s.i]; if (!q) return mzSheetClose(); h = mzUnitHtml(q) + `<div class="mz-acts2"><button class="pri" data-m="buy" data-i="${s.i}"${q.can ? '' : ' disabled'}>산다 ${q.cost}</button></div>`; }
  if (s.kind === 'unit') { const u = LAIR.unitInfo(s.kindId, s.star), w = s.uid != null ? MAZE.whereOf(MZ.M, s.uid) : null; h = mzUnitHtml(u) + (s.uid != null && MZ.phase === 'prep' ? `<div class="mz-acts2"><button data-m="pick" data-u="${s.uid}">옮기기</button>${w && w.cell != null ? `<button data-m="tobench" data-u="${s.uid}">대기석</button>` : ''}<button data-m="sell" data-u="${s.uid}">팔기 ${MAZE.sellValue(MZ.M.unit[s.uid])}</button></div>` : ''); }
  if (s.kind === 'party') { const n = v.next; if (!n) return mzSheetClose(); h = `<h3>${esc(n.name)}</h3><p class="mz-note">길 ${n.len}${n.breaks.length ? ' · 지름길 ' + n.breaks.length : ''}${n.avoided ? ' · 함정을 돌아감' : ''}</p><div class="mz-party">${n.party.map(p => `<div><img src="${mzIcon(p.kind, 1, 36)}" alt=""><b>${esc(p.name)}</b><small>체력 ${p.hp}${p.noMad ? '' : ' · 정신 ' + p.san} · 알 −${p.egg}</small></div>`).join('')}</div>`; }
  if (s.kind === 'menu') { const sp = typeof LSPD !== 'undefined' ? LSPD : [[0.6, '느리게'], [1, '보통'], [2, '빠르게']], cur = typeof LU !== 'undefined' ? LU.speed || lrSpeedLoad() : 1;
    h = `<h3>메뉴</h3><p class="mz-setrow"><span>효과음</span><button data-m="tog" data-v="sound" class="${META.sound !== false ? 'on' : ''}" aria-pressed="${META.sound !== false}">${META.sound !== false ? '켬' : '끔'}</button></p><p class="mz-setrow"><span>음악</span><button data-m="tog" data-v="music" class="${META.music !== false ? 'on' : ''}" aria-pressed="${META.music !== false}">${META.music !== false ? '켬' : '끔'}</button></p><p class="mz-setrow"><span>빠르기</span><span class="mz-spd">${sp.map(q => `<button data-m="spd" data-v="${q[0]}" class="${cur === q[0] ? 'on' : ''}">${q[1]}</button>`).join('')}</span></p><div class="mz-acts2"><button data-m="home">처음으로</button><button class="pri" data-m="close">돌아간다</button></div>`; }
  if (s.kind === 'result') h = mzResultHtml();
  if (s.kind === 'over') h = mzOverHtml();
  const modal = s.kind === 'result' || s.kind === 'over';
  el.innerHTML = `<div class="mz-sbody${modal ? ' res' : ''}">${modal ? '' : '<button class="mz-x" data-m="close" aria-label="닫기">✕</button>'}${h}</div>`; el.hidden = false; $('mz-coach').hidden = true; mzUnder(true);
}
// 창이나 싸움 다시 보기가 떠 있는 동안 밑의 지도는 읽는 이에게 가린다
function mzUnder(on) { ['mz-bar', 'mz-main'].forEach(id => { const e = $(id); if (!e) return; if (on) e.setAttribute('aria-hidden', 'true'); else e.removeAttribute('aria-hidden'); }); }
function mzUnitHtml(u) { return `<div class="mz-shead"><img src="${mzIcon(u.kind, u.star, 64)}" alt=""><div><h3>${esc(u.name)} ${mzStars(u.star)}</h3><p class="mz-tags">${esc(u.roleName)} · ${esc(u.reach)} · 값 ${u.cost}</p><p class="mz-tags"><img src="${mzSym(u.asp, 16)}" alt="">${esc(u.aspName)}</p></div></div><div class="mz-stats">${mzSt('체력', u.hp)}${mzSt('공격', u.atk)}${mzSt('방어', u.df)}${mzSt('닿는 칸', u.range)}</div><div class="mz-skill"><b>${esc(u.skill.name)}</b><span>${esc(u.skill.short)}</span><p>${esc(u.skill.more)}</p></div>`; }
function mzSheetClose() { MZ.sheet = null; $('mz-sheet').hidden = true; mzUnder(false); if (MZ.sel && MZ.sel.shop != null) { MZ.sel = null; mzDraw(); } mzCoach(); }

// ---- 길잡이: 첫 판에만 넷 ----
function mzCoach() {
  const c = $('mz-coach'); if (!c) return; const M = MZ.M;
  if (MZ.tut < 0 || MZ.tut >= MZTUT.length || MZ.sheet || MZ.phase !== 'prep' || !M) { c.hidden = true; return; }
  const v = MZ.v || mzView();
  if (MZ.tut === 0 && v.dug > MZ.dug0) MZ.tut = 1;
  if (MZ.tut === 1 && v.grid.some(g => g.use === 'kin')) MZ.tut = 2;
  if (MZ.tut === 2 && v.placed) MZ.tut = 3;
  if (MZ.tut >= MZTUT.length) { c.hidden = true; return; }
  const st = MZTUT[MZ.tut]; let at = null;
  if (st.key === 'dig') { const g = v.grid.find(q => q.canDig); if (g) at = mzCellRect(g.cell); }
  if (st.key === 'room') { const g = v.grid.find(q => q.dug && q.use === 'path' && !q.fixed && q.r > 0); if (g) at = mzCellRect(g.cell); }
  if (st.key === 'place') { const b = mq('#mz-bench .mz-slot.has') || mq('#mz-shop .mz-card:not(.empty)'); if (b) at = b.getBoundingClientRect(); }
  if (st.key === 'raid') { const b = mq('#mz-bench [data-m="raid"]'); if (b) at = b.getBoundingClientRect(); }
  if (!at) { c.hidden = true; return; }
  c.innerHTML = `<p>${esc(st.text)}</p><span>${st.ok ? '<button data-m="tutok">알았다</button>' : ''}<button data-m="tutoff">안내 끄기</button></span>`; c.hidden = false;
  const cw = Math.min(280, window.innerWidth - 16); c.style.width = cw + 'px'; const ch = c.offsetHeight || 70, below = at.top < 170;
  c.style.left = Math.max(8, Math.min(window.innerWidth - cw - 8, at.left + at.width / 2 - cw / 2)) + 'px'; c.style.top = (below ? at.bottom + 8 : at.top - ch - 8) + 'px';
}
function mzCellRect(c) { const r = $('mz-cv').getBoundingClientRect(), k = MZ.k, x = r.left + (c % 5) * MS * k, y = r.top + (MTOP + Math.floor(c / 5) * MS) * k; return { left: x, top: y, width: MS * k, height: MS * k, right: x + MS * k, bottom: y + MS * k }; }

// ---- 침입 ----
// 걸음: 칸당 0.2초 (보통). 함정 0.8초, 바위 부수기 0.9초, 알 1.2초. 방의 싸움은 둥지 전투의 재생으로
const MZWALK = 0.2;
const mzSpeed = () => (typeof LU !== 'undefined' && LU.speed) || (typeof lrSpeedLoad === 'function' ? lrSpeedLoad() : 1);
function mzRaid() {
  const M = MZ.M; MZ.sel = null; mzSheetClose(); const v0 = mzView(), party = MAZE.partyOf(M), kinAt = {}; Object.keys(M.board).forEach(c => { kinAt[c] = M.board[c].slice(); });
  const res = MAZE.raid(M); if (!res.ok) return mzToast(res.msg);
  if (MZ.tut === 3) { MZ.tut = MZTUT.length; if (META) { META.mazeTut = 1; try { saveMeta(); } catch (e) { /* 저장 없이 */ } } }
  mzSave();
  MZ.play = { steps: res.steps, i: -1, res, grid: v0.grid.map(g => ({ dug: g.dug, use: g.use, room: g.room, trap: g.trap })), egg: v0.egg.hp, eggHit: 0, gold0: v0.gold, raidNo: v0.raid, pos: { x: mzCx(2), y: MTOP / 2 }, party, alive: party.slice(), log: [], dead: {}, cur: null, wait: 0, skip: false, done: false, name: v0.next.name, fights: 0, traps: 0 };
  MZ.phase = 'raid'; mzMusic('night'); mzSay('night'); mzDraw(); mzStepNext();
}
function mzPartyApply(snap) { const P = MZ.play; if (!snap) return; snap.forEach(s => { const p = P.party[s.i]; if (p) Object.assign(p, { hp: s.hp, mhp: s.mhp, san: s.san, msan: s.msan, alive: s.alive, mad: s.mad, out: s.out }); }); P.alive = P.party.filter(p => p.alive && !p.mad && !p.out); }
function mzLog(text, cls, icon) { const P = MZ.play; P.log.push({ text, cls: cls || '', icon: icon || null }); if (P.log.length > 6) P.log.shift(); const el = $('mz-log'); if (el) el.innerHTML = mzLogHtml(); }
function mzLogHtml() { const P = MZ.play; return P ? P.log.slice(-3).reverse().map(l => `<p class="${l.cls}">${l.icon ? `<img src="${l.icon}" alt="">` : ''}<span>${esc(l.text)}</span></p>`).join('') : ''; }
const mzRoomName = (g, cell) => (cell === MAZE.CORE ? '본체 방' : g && g.room ? LAIR.ROOM[g.room].name : '권속 방');
function mzStepNext() {
  const P = MZ.play; if (!P || P.done) return; P.i++; const s = P.steps[P.i]; P.cur = s; P.t0 = MZ.t;
  if (!s) return mzRaidEnd();
  const sp = mzSpeed();
  if (s.type === 'walk') { P.walk = { cells: s.cells, k: 0, n: 0, from: { x: P.pos.x, y: P.pos.y }, mad: s.mad || [] }; return; }
  if (s.type === 'trap') { const T = MAZE.trapInfo(s.id), hit = s.after.filter((a, i) => a.alive && (a.hp < s.before[i].hp || a.san < s.before[i].san || a.mad !== s.before[i].mad)).length; P.traps++; P.pos = { x: mzCx(s.cell), y: mzCy(s.cell) }; P.flash = { cell: s.cell, t1: MZ.t + 600 / sp, dur: 600 / sp, col: MZTRAPC[s.id] || '#ffffff' }; mzPartyApply(s.after); mzLabel(mzCx(s.cell), mzCy(s.cell) - 30, T.name + ' · ' + T.short, 'trap'); mzLog(T.name + ' · ' + hit, 'trap', mzTrapIcon(s.id)); mzSay('hit'); P.wait = MZ.t + 800 / sp; return; }
  if (s.type === 'break') { P.brk = { cell: s.cell, t1: MZ.t + 900 / sp, dur: 900 / sp }; P.grid[s.cell] = { dug: true, use: 'path', room: null, trap: null }; mzLabel(mzCx(s.cell), mzCy(s.cell) - 26, '지름길', 'brk'); mzLog('바위를 부수었다', 'brk'); mzSay('thud'); P.wait = MZ.t + 900 / sp; return; }
  if (s.type === 'egg') { P.pos = { x: mzCx(s.cell), y: mzCy(s.cell) - 20 }; P.egg = s.egg; P.eggHit = MZ.t + 900; mzLabel(mzCx(s.cell), mzCy(s.cell) - 40, '알 −' + s.dmg, 'egg'); mzLog('알 −' + s.dmg, 'egg'); mzSay('die'); P.alive.forEach(p => { p.out = true; }); P.alive = []; mzRaidPanel(); mzDraw(); P.wait = MZ.t + 1200 / sp; return; }
  if (s.type === 'fight') return mzFight(s);
  P.wait = MZ.t;
}
function mzFight(s) {
  const P = MZ.play, g = P.grid[s.cell], name = mzRoomName(g, s.cell), sp = mzSpeed(); P.pos = { x: mzCx(s.cell), y: mzCy(s.cell) - 24 }; P.fights++;
  const go = () => {
    if (!MZ.play || MZ.play !== P || P.skip) return;
    const party = s.before.inv.filter(p => p.alive && !p.out).length;
    mzUnder(true); lairReplay(s.fight, { name, sub: '일행 ' + party + ' · 권속 ' + s.before.kin.length, form: s.fight.form, step: 0, skip: mzSkipAll, done: () => { mzUnder(false); mzZoom(s.cell, false, () => { if (!MZ.play || MZ.play !== P) return; mzFightAfter(s); }); } });
  };
  mzZoom(s.cell, true, go, sp);
}
function mzFightAfter(s) {
  const P = MZ.play; mzPartyApply(s.after.inv); s.after.kin.forEach(k => { if (!k.alive) P.dead[k.uid] = 1; });
  const kills = s.after.inv.filter((a, i) => s.before.inv[i] && s.before.inv[i].alive && !a.alive).length, mads = s.after.inv.filter((a, i) => s.before.inv[i] && !s.before.inv[i].mad && a.mad).length;
  mzLog(mzRoomName(P.grid[s.cell], s.cell) + ' · 쓰러뜨림 ' + kills + (mads ? ' · 미침 ' + mads : ''), s.fight.result === 'win' ? 'win' : 'lose', s.core ? mzIcon('boss:' + (s.fight.form || 'drop') + ':1', 1, 24) : P.grid[s.cell].room ? mzRoomIcon(P.grid[s.cell].room) : null);
  mzRaidPanel(); P.wait = MZ.t + 250; P.cur = { type: 'idle' };
}
// 방으로 다가가기: 칸의 상자가 화면 가득 넓어진 뒤 싸움을 연다. 돌아올 때는 거꾸로. 움직임을 끈 설정이면 곧바로
function mzZoom(cell, inn, cb) {
  const z = $('mz-zoom'); if (!(typeof motionOk !== 'function' || motionOk())) { z.hidden = true; cb(); return; }
  const r = mzCellRect(cell), full = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }, a = inn ? r : full, b = inn ? full : r;
  z.style.transition = 'none'; Object.assign(z.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', opacity: inn ? 0.4 : 1 }); z.hidden = false; void z.offsetWidth;
  z.style.transition = 'left .28s ease-in, top .28s ease-in, width .28s ease-in, height .28s ease-in, opacity .28s'; Object.assign(z.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', opacity: inn ? 1 : 0.2 });
  setTimeout(() => { z.hidden = true; cb(); }, 300);
}
// 넘기기: 남은 걸음을 바로 결과로
function mzSkipAll() {
  const P = MZ.play; if (!P || P.done) return; P.skip = true;
  if (typeof LU !== 'undefined' && LU.replay) { LU.replay.done = null; lrReplayEnd(); } mzUnder(false);
  $('mz-zoom').hidden = true; P.steps.forEach((s, i) => { if (i <= P.i && P.cur !== s) return; if (s.type === 'break') P.grid[s.cell] = { dug: true, use: 'path', room: null, trap: null }; if (s.type === 'trap' || s.type === 'fight') { if (s.type === 'trap') P.traps++; else P.fights++; mzPartyApply(s.type === 'trap' ? s.after : s.after.inv); } if (s.type === 'fight') s.after.kin.forEach(k => { if (!k.alive) P.dead[k.uid] = 1; }); if (s.type === 'egg') P.egg = s.egg; if (s.type === 'walk') (s.mad || []).forEach(i => { if (P.party[i]) P.party[i].mad = true; }); });
  P.i = P.steps.length; mzRaidEnd();
}
function mzRaidEnd() {
  const P = MZ.play; if (!P || P.done) return; P.done = true; P.egg = MZ.M.egg; mzSay(P.res.result.win ? 'up' : 'down'); mzMusic('day');
  mzDraw(); mzSheet({ kind: MZ.M.phase === 'over' ? 'over' : 'result' });
}
function mzRaidPanel() {
  const P = MZ.play; if (!P) return; const cur = mzSpeed(), sp = typeof LSPD !== 'undefined' ? LSPD : [[0.6, '느리게'], [1, '보통'], [2, '빠르게']];
  $('mz-raid').innerHTML = `<div class="mz-spd">${sp.map(q => `<button data-m="spd" data-v="${q[0]}" class="${cur === q[0] ? 'on' : ''}" aria-pressed="${cur === q[0]}">${q[1]}</button>`).join('')}<button data-m="skip">넘기기</button></div>`
    + `<div class="mz-pty" role="button" data-m="pinfo">${P.party.map(p => `<span class="${!p.alive ? 'dead' : p.mad ? 'mad' : p.out ? 'out' : ''}"><img src="${mzIcon(p.kind, 1, 28)}" alt="${esc(p.name)}"><i><b style="width:${Math.round(Math.max(0, p.hp) / p.mhp * 100)}%"></b></i>${p.msan ? `<i class="s"><b style="width:${Math.round(Math.max(0, p.san) / p.msan * 100)}%"></b></i>` : ''}</span>`).join('')}</div><div id="mz-log">${mzLogHtml()}</div>`;
}
function mzLabel(x, y, text, cls) { const d = document.createElement('span'), k = MZ.k; d.className = 'mz-lab ' + (cls || ''); d.textContent = text; const hw = (text.length * 12 + 14) / 2; d.style.left = Math.max(hw, Math.min(MW * k - hw, x * k)) + 'px'; d.style.top = Math.max(24, y * k) + 'px'; $('mz-ov').appendChild(d); setTimeout(() => d.remove(), 1300); }
// 굴 속의 어둠: 한 칸마다 일행의 정신이 깎인다 (표식 곁의 작은 보라 숫자, 표식 아래의 정신 띠)
function mzDark(cell) {
  const P = MZ.play, d = (MAZE.MK && MAZE.MK.darkSan) || 0; if (!d || cell === MAZE.EGG) return; let hit = 0;
  P.alive.forEach(p => { if (!p.msan) return; p.san = Math.max(0, p.san - d); hit++; }); if (!hit) return; P.dark = (P.dark || 0) + d;
  mzLabel(P.pos.x + 22, P.pos.y - 10, '−' + d, 'dark'); MZ.dbg.dark = (MZ.dbg.dark || 0) + 1;
}
// 걷기를 마치면: 정신이 바닥난 자는 표식에서 떨어져 나간다 (다음 방에서 둥지 편에 선다)
function mzDarkEnd(W) {
  const P = MZ.play; (W.mad || []).forEach(i => { const p = P.party[i]; if (!p || p.mad) return; p.mad = true; p.san = 0; P.madWalk = (P.madWalk || 0) + 1; mzLabel(P.pos.x, P.pos.y - 34, p.name + ' · 미쳤다', 'mad'); mzLog(p.name + ' · 미쳤다', 'mad', mzIcon(p.kind, 1, 24)); mzSay('mad'); });
  P.alive = P.party.filter(p => p.alive && !p.mad && !p.out); mzRaidPanel();
}
// 시간이 흐른다
function mzStep(dt) {
  const P = MZ.play; if (!P || P.done || P.skip) return; if (typeof LU !== 'undefined' && LU.replay) return; const s = P.cur, sp = mzSpeed();
  if (s && s.type === 'walk' && P.walk) {
    const W = P.walk; W.k += dt / 1000 * sp / MZWALK; const i = Math.min(W.cells.length - 1, Math.floor(W.k)), f = Math.min(1, W.k - Math.floor(W.k)), a = i === 0 ? W.from : { x: mzCx(W.cells[i - 1]), y: mzCy(W.cells[i - 1]) }, b = { x: mzCx(W.cells[i]), y: mzCy(W.cells[i]) };
    P.pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    while (W.n < Math.min(W.cells.length, Math.floor(W.k) + 1)) { W.n++; mzDark(W.cells[W.n - 1]); }
    if (W.n % 2 === 0 && W.n !== W.drawn) { W.drawn = W.n; mzRaidPanel(); }
    if (W.k >= W.cells.length) { mzDarkEnd(W); P.pos = { x: mzCx(W.cells[W.cells.length - 1]), y: mzCy(W.cells[W.cells.length - 1]) }; P.walk = null; mzStepNext(); }
    return;
  }
  if (s && s.type === 'fight') return;
  if (MZ.t >= P.wait) mzStepNext();
}
function mzResultHtml() {
  const P = MZ.play, r = P.res.result, steps = P.res.steps, rows = steps.filter(s => s.type === 'fight').map(s => { const kills = s.after.inv.filter((a, i) => s.before.inv[i] && s.before.inv[i].alive && !a.alive).length, mads = s.after.inv.filter((a, i) => s.before.inv[i] && !s.before.inv[i].mad && a.mad).length, lost = s.after.kin.filter(k => !k.alive).length, g = P.grid[s.cell];
    const best = (s.fight.breakdown || []).filter(b => b.side === 'nest' && !b.summon).sort((a, b) => (b.dmg + b.san) - (a.dmg + a.san))[0];
    return `<div class="mz-rrow"><img src="${s.core ? mzIcon('boss:' + (s.fight.form || 'drop') + ':1', 1, 32) : g.room ? mzRoomIcon(g.room) : mzIcon(best ? best.kind : 'shell', 1, 32)}" alt=""><div><b>${esc(mzRoomName(g, s.cell))}</b><small>${['쓰러뜨림 ' + kills, mads ? '미침 ' + mads : '', lost ? '잃음 ' + lost : '', best && best.kind !== 'core' && LAIR.KIN[best.kind] ? LAIR.KIN[best.kind].name + ' ' + Math.round(best.dmg + best.san) : ''].filter(Boolean).join(' · ')}</small></div></div>`; }).join('');
  const traps = steps.filter(s => s.type === 'trap'), tline = traps.length ? `<p class="mz-note">${traps.map(s => MAZE.TRAP[s.id].name).join(' · ')}</p>` : '';
  const n = MZ.v && MZ.v.next;
  return `<h3 class="${r.win ? 'win' : 'lose'}">${r.win ? '막아 냈다' : '알이 깎였다 ' + r.eggLost}</h3><p class="mz-nar">${esc(r.win ? MZNAR.win : MZNAR.hurt)}</p><p class="mz-sum"><span class="g">진액 +${r.gold}</span>${r.eggLost ? `<span class="l">알 −${r.eggLost}</span>` : ''}${r.mads ? `<span class="m">미침 ${r.mads}</span>` : ''}${r.breaks ? `<span>지름길 ${r.breaks}</span>` : ''}${r.avoided ? '<span>함정을 돌아감</span>' : ''}</p>${rows ? `<h4>방</h4>${rows}` : ''}${tline}`
    + (n ? `<div class="mz-nextp"><span>다음</span><b>${esc(n.name)}</b>${n.party.map(p => `<img src="${mzIcon(p.kind, 1, 28)}" alt="${esc(p.name)}">`).join('')}</div>` : '') + '<div class="mz-acts2"><button class="pri" data-m="next">준비</button></div>';
}
function mzOverHtml() {
  const M = MZ.M, win = !!(M.over && M.over.win), hist = M.hist.map(h => `<span class="${h.win ? 'w' : 'l'}">${h.raid} ${h.win ? '막음' : '알 −' + h.eggLost}</span>`).join('');
  return `<h3 class="${win ? 'win' : 'lose'}">${win ? '둥지는 남았다' : '알이 깨졌다'}</h3><p class="mz-nar">${esc(win ? MZNAR.end : MZNAR.fall)}</p><p class="mz-sum">${hist}</p><p class="mz-sum"><span>알 ${M.egg}/${M.eggMax}</span><span>Lv ${M.level}</span></p><div class="mz-acts2"><button class="pri" data-m="again">다시 한 판</button><button data-m="home">처음으로</button></div>`;
}
function mzNext() { mzSheetClose(); MZ.play = null; MZ.phase = 'prep'; $('mz-ov').innerHTML = ''; mzDraw(); mzSize(); }
function mzLoop(now) {
  MZ.raf = requestAnimationFrame(mzLoop); const dt = Math.min(100, now - MZ.last); MZ.last = now; MZ.t = now;
  if (!$('mz') || $('mz').hidden) return; if (MZ.phase === 'raid') mzStep(dt);
  mzRender(now); if (MZ.toastT && now > MZ.toastT) { $('mz-toast').hidden = true; MZ.toastT = 0; }
}
function mzBoot() {
  const t = $('title'); if (!t) return; const n = $('nojs'); if (n) n.hidden = true;
  t.addEventListener('click', mzTitleClick); $('modal').addEventListener('click', mzTitleClick); mzTitle();
}
// 시험용
if (typeof window !== 'undefined') window.__maze = { get M() { return MZ.M; }, get meta() { return META; }, get Z() { return MZ; }, get P() { return MZ.play; }, view: () => mzView(), open: run => mzOpen(run), saved: () => mzSaved(), title: () => mzTitle(), redraw: () => mzDraw(), pt(c) { const r = $('mz-cv').getBoundingClientRect(); return { x: r.left + mzCx(c) * MZ.k, y: r.top + mzCy(c) * MZ.k }; }, dbg: () => MZ.dbg, skip: () => mzSkipAll(), give(kind, star, cell) { const M = MZ.M, uid = M.nextUid++; M.unit[uid] = { uid, kind, star: star || 1 }; if (cell != null) M.board[cell] = (M.board[cell] || []).concat([uid]); else M.bench[M.bench.indexOf(null)] = uid; mzDraw(); return uid; } };
mzBoot();
