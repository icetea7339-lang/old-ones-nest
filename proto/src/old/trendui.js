// 새 판 (시험) 화면: 보상 하나 고르기 → 둥지 판에 놓기 · 굴 바꾸기 (몸이 놓은 것을 닮아 간다) → 저절로 싸우는 밤 → 누가 얼마나 했나 → 다시 한 판
// 규칙은 trend.js (TREND). 이 파일은 그리기와 누르기만 한다.
const TRU = { R: null, F: null, sel: null, edit: false, aim: null, speed: 1, fx: [], nums: [], pop: {}, acc: 0, last: 0, raf: 0, g: null, fires: 0, kinds: {}, ended: false, seed: 0, prevArch: null, bodyKey: '', bodyC: null, info: null, bump: 0, spawnN: 0 };
const TRCOL = { spore: '#8fd05f', maw: '#ff5f57', egg: '#f0e0a0', water: '#3ac0d8', eye: '#b08fff', bone: '#e8e0c8', none: '#a2a8c6' };
const TRNAR = {
  offer: '굴 위에서 횃불이 모였다. 오늘 밤 그들은 내려올 것이었다.',
  win: '마지막 횃불이 굴 바닥에서 꺼졌다. 그것은 남은 것을 천천히 거두어들였다.',
  lose: '사람들의 발소리가 가장 깊은 방까지 내려왔다. 그것은 처음으로 몸을 움츠렸다.',
};
const TRHELP = {
  setup: '부위를 누르고 빛나는 칸에 놓는다. 적은 화살표를 따라 본체로 온다.',
  edit: '굴 칸을 막거나 곁의 흙을 판다. 길이 길면 적이 부위 곁에 오래 머문다.',
  fight: '기술은 아무 때나 쓴다. 칸을 고르는 기술은 누르면 싸움이 멈춘다.',
  aim: '기술을 쓸 칸을 고른다. 기술을 다시 누르면 그만둔다.',
};
const TRINV = { villager: 'villager', militia: 'militia', hound: 'hound', priest: 'priest', captain: 'captain', hunter: 'sapper' };

// ---- 그림 ----
const TRIC = {};
function trIcon(id) {
  if (TRIC[id]) return TRIC[id]; const d = TREND.P[id];
  if (d.kind === 'kin' && typeof kinCanvas === 'function') { try { return (TRIC[id] = kinCanvas(d.art, 0, null)); } catch (e) { /* 아래 무늬로 */ } }
  const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'), col = TRCOL[d.tags[0]] || '#ccc';
  const r = (a, b, w, h, k) => { x.fillStyle = k; x.fillRect(a, b, w, h); }, disc = (cx, cy, rr, k) => { x.fillStyle = k; for (let j = -rr; j <= rr; j++) { const w = Math.round(Math.sqrt(rr * rr - j * j)); x.fillRect(cx - w, cy + j, w * 2 + 1, 1); } };
  const AUM = { spawn: 'egg', spore: 'spore', swallow: 'swallow', cd: 'eye', hp: 'bone', dmg: 'water' }, SKM = { wave: 'water', burst: 'spore', call: 'egg', gulp: 'swallow', phantom: 'eye' };
  const m = d.kind === 'organ' ? AUM[Object.keys(d.aura)[0]] : d.kind === 'skill' ? SKM[id] : d.fx;
  if (d.kind === 'organ') { disc(12, 12, 11, '#120e18'); disc(12, 12, 10, '#2a1a28'); for (let k = 0; k < 8; k++) r(12 + Math.round(Math.cos(k * 0.785) * 10), 12 + Math.round(Math.sin(k * 0.785) * 10), 2, 2, col); }
  if (d.kind === 'skill') { x.fillStyle = '#1a1430'; x.beginPath(); x.moveTo(12, 0); x.lineTo(24, 12); x.lineTo(12, 24); x.lineTo(0, 12); x.fill(); x.strokeStyle = col; x.lineWidth = 1; x.stroke(); }
  if (m === 'maw') { for (let k = 0; k < 5; k++) { x.fillStyle = '#f5efe0'; x.beginPath(); x.moveTo(2 + k * 4, 20); x.lineTo(4 + k * 4, 6 + (k % 2) * 3); x.lineTo(6 + k * 4, 20); x.fill(); } r(1, 20, 22, 3, col); }
  if (m === 'swallow') { disc(12, 12, 9, '#07050a'); disc(12, 12, 7, '#3a0a14'); for (let k = 0; k < 6; k++) { r(6 + k * 2, 5 + (k % 2), 1, 3, '#f5efe0'); r(6 + k * 2, 16 - (k % 2), 1, 3, '#f5efe0'); } r(9, 11, 6, 2, '#c8303a'); }
  if (m === 'spore') { [[7, 8, 3], [15, 7, 2], [12, 14, 4], [6, 17, 2], [18, 16, 3]].forEach(([a, b, s]) => { disc(a, b, s, col); disc(a - 1, b - 1, Math.max(1, s - 2), '#e0f8a0'); }); }
  if (m === 'egg') { [[8, 14], [15, 12], [12, 18]].forEach(([a, b]) => { disc(a, b, 4, '#fffbe8'); disc(a, b, 3, '#d8c890'); r(a - 1, b - 2, 1, 1, '#fff'); }); }
  if (m === 'eye') { disc(12, 12, 8, '#e8e0d0'); disc(12, 12, 5, col); r(11, 8, 2, 8, '#07050a'); r(9, 9, 2, 1, '#ffffff'); }
  if (m === 'water') { for (let k = 0; k < 3; k++) for (let i = 0; i < 20; i++) r(2 + i, 6 + k * 5 + Math.round(Math.sin(i * 0.6 + k) * 2), 1, 2, k === 1 ? '#c8f4ff' : col); }
  if (m === 'gut') { disc(12, 15, 8, '#5a6a10'); disc(12, 15, 6, '#b8d040'); [[8, 12, 2], [15, 14, 2], [12, 18, 1], [10, 6, 2], [16, 8, 1]].forEach(([a, b, s]) => disc(a, b, s, '#e8f8a0')); }
  if (m === 'bone') { for (let k = 0; k < 4; k++) { r(3 + k * 5, 3, 3, 18, '#e8e0c8'); r(2 + k * 5, 2, 5, 2, '#fffbe8'); r(2 + k * 5, 20, 5, 2, '#b0a07a'); } }
  return (TRIC[id] = c);
}
const TRURL = {};
const trImg = (id, s) => `<img class="px" src="${TRURL[id] || (TRURL[id] = trIcon(id).toDataURL())}" width="${s}" height="${s}" alt="">`;
const TRSP = {};
function trSprite(k) { if (TRSP[k]) return TRSP[k]; try { TRSP[k] = k === 'spawn' ? kinCanvas('spawn', 0, null) : invCanvasW('fantasy', TRINV[k] || 'villager'); } catch (e) { const c = document.createElement('canvas'); c.width = c.height = 16; c.getContext('2d').fillStyle = '#c8a070'; c.getContext('2d').fillRect(4, 2, 8, 13); TRSP[k] = c; } return TRSP[k]; }
function trBody() {
  const R = TRU.R, g = TREND.genome(R), key = JSON.stringify([g.aspect, g.stage, g.tags]);
  if (key !== TRU.bodyKey) { const had = !!TRU.bodyKey; TRU.bodyKey = key; try { TRU.bodyC = BODYGEN.build(g); } catch (e) { TRU.bodyC = null; } if (had) TRU.bump = performance.now(); }
  return TRU.bodyC;
}

// ---- 판 ----
function trMount() {
  if (document.getElementById('tr')) return;
  const st = document.createElement('style'); st.textContent = `
#tr { position: fixed; inset: 0; z-index: 40; display: flex; flex-direction: column; background: var(--ink); color: var(--text); font-family: var(--body); font-size: 15px; line-height: 1.4; padding-top: env(safe-area-inset-top, 0px); padding-bottom: var(--sab); -webkit-user-select: none; user-select: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
#tr button { font-family: var(--display); font-size: 15px; min-height: 44px; color: var(--text); background: var(--panel2); border: 1px solid var(--edge); box-shadow: inset 0 0 0 1px var(--line), inset 0 3px 0 rgba(255,255,255,.08), inset 0 -4px 0 rgba(0,0,0,.3); padding: 6px 12px; cursor: pointer; }
#tr button.pri { background: var(--coin); color: var(--ink); box-shadow: inset 0 0 0 1px #fff3a0, inset 0 3px 0 #fff3a0, inset 0 -5px 0 #a87e14; }
#tr button.on { box-shadow: inset 0 0 0 2px var(--coin); }
#tr button[disabled] { opacity: .4; cursor: default; }
#tr .mute { color: var(--mute); }
#tr .px { image-rendering: pixelated; }
.tr-top { display: flex; align-items: center; gap: 10px; padding: 6px 16px; min-height: 52px; }
.tr-top b { font-family: var(--display); font-size: 16px; white-space: nowrap; }
.tr-hp { flex: 1; max-width: 260px; height: 14px; background: #2a1a20; box-shadow: inset 0 0 0 1px var(--edge); position: relative; }
.tr-hp i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--up); }
.tr-top .grow { flex: 1; }
.tr-num { font-size: 15px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.tr-main { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; padding: 0 16px 8px; }
.tr-left { flex: 0 0 auto; display: flex; justify-content: center; }
.tr-wrap { position: relative; width: 100%; aspect-ratio: 5 / 4; max-height: 50vh; }
.tr-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; }
.tr-chain { position: absolute; left: 0; right: 0; top: 6%; text-align: center; font-family: var(--display); font-weight: 900; color: #fff3a0; text-shadow: 0 2px 0 #000, 0 0 12px #e8552f; pointer-events: none; opacity: 0; transition: opacity .4s; }
.tr-chain.show { opacity: 1; transition: none; }
.tr-side { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.tr-body { display: flex; gap: 10px; align-items: center; }
.tr-body canvas { width: 72px; height: 72px; flex: 0 0 72px; background: #1a1424; box-shadow: inset 0 0 0 1px var(--line); }
.tr-body b { font-family: var(--display); font-size: 16px; }
.tr-body .tx { min-width: 0; flex: 1; font-size: 14px; }
.tr-tags { display: flex; gap: 6px; margin-top: 4px; overflow-x: auto; }
#tr .tr-tag { flex: 0 0 auto; }
.tr-tl { font-style: normal; display: inline-flex; gap: 4px; flex-wrap: wrap; } .tr-tl i { font-style: normal; font-size: 13px; padding: 0 6px; border-left: 3px solid var(--c); background: rgba(255,255,255,.06); }
.tr-done { align-self: center; padding: 0 8px; white-space: nowrap; }
.tr-wv { display: none; }
#tr .tr-tag { min-height: 40px; padding: 2px 10px; font-size: 14px; border-left: 4px solid var(--c); }
#tr .tr-tag.lv1 { background: #3a3a22; } #tr .tr-tag.lv2 { background: #4a3a14; color: #fff3a0; }
.tr-info { font-size: 14px; min-height: 42px; background: var(--panel); padding: 6px 10px; box-shadow: inset 0 0 0 1px var(--line); display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tr-info .grow { flex: 1; min-width: 160px; }
.tr-bench { display: flex; gap: 6px; overflow-x: auto; overflow-y: hidden; padding-bottom: 2px; min-height: 64px; }
#tr .tr-pc { flex: 0 0 auto; display: flex; gap: 6px; align-items: center; text-align: left; padding: 4px 10px 4px 6px; min-height: 60px; max-width: 200px; }
#tr .tr-pc.sel { box-shadow: inset 0 0 0 3px var(--coin); }
.tr-pc span { display: flex; flex-direction: column; font-size: 14px; line-height: 1.25; }
.tr-pc small { font-family: var(--body); font-size: 13px; color: var(--mute); }
.tr-act { display: flex; gap: 8px; margin-top: auto; }
.tr-act button { flex: 1; }
.tr-sk { display: flex; gap: 6px; }
#tr .tr-sk button { flex: 1; display: flex; gap: 6px; align-items: center; justify-content: center; min-height: 52px; }
.tr-spd { display: flex; gap: 6px; align-items: center; }
#tr .tr-spd button { flex: 1; }
.tr-sheet { position: absolute; inset: 0; z-index: 2; background: rgba(8, 8, 16, .72); display: flex; align-items: center; justify-content: center; padding: 16px; }
.tr-card { background: var(--panel); box-shadow: inset 0 0 0 2px var(--line), 0 8px 0 rgba(0,0,0,.4); padding: 16px; width: 100%; max-width: 560px; max-height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.tr-card h3 { margin: 0; font-size: 18px; }
.tr-nar { margin: 0; font-size: 15px; color: #d8d0bc; font-style: normal; line-height: 1.6; }
.tr-offers { display: flex; flex-direction: column; gap: 8px; }
#tr .tr-off { display: flex; gap: 10px; align-items: center; text-align: left; padding: 8px 12px; min-height: 64px; }
.tr-off span { display: flex; flex-direction: column; font-size: 15px; }
.tr-off small { font-family: var(--body); font-size: 14px; color: var(--mute); }
.tr-off .tr-tl { margin-top: 3px; }
.tr-bars { display: flex; flex-direction: column; gap: 4px; }
.tr-bar { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; gap: 8px; align-items: center; font-size: 14px; }
.tr-bar .bb { height: 10px; background: #2a2440; position: relative; grid-column: 2; }
.tr-bar .bb i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--c); }
.tr-bar .nm { grid-column: 2; }
.tr-bar .v { grid-column: 3; grid-row: 1 / span 2; font-variant-numeric: tabular-nums; }
.tr-bar img, .tr-bar canvas { grid-row: 1 / span 2; }
.tr-stats { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 14px; }
.tr-end-act { display: flex; gap: 8px; } .tr-end-act button { flex: 1; }
@media (min-width: 900px) {
  .tr-main { flex-direction: row; padding: 0 24px 16px; gap: 16px; }
  .tr-left { flex: 1; min-width: 0; align-items: center; }
  .tr-wrap { height: 100%; width: auto; max-width: 100%; max-height: none; }
  .tr-side { flex: 0 0 380px; }
  .tr-tags { flex-wrap: wrap; overflow: visible; }
  .tr-wv { display: flex; flex-direction: column; gap: 6px; background: var(--panel); box-shadow: inset 0 0 0 1px var(--line); padding: 8px 10px; font-size: 14px; }
  .tr-wv .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .tr-wv canvas { width: 36px; height: 36px; image-rendering: pixelated; }
  .tr-bench { flex-wrap: wrap; overflow: visible; }
  #tr .tr-pc { flex: 1 1 170px; max-width: none; }
  .tr-body canvas { width: 96px; height: 96px; flex-basis: 96px; }
}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'tr'; el.hidden = true;
  el.innerHTML = `<div class="tr-top" id="trtop"></div><div class="tr-main"><div class="tr-left"><div class="tr-wrap" id="trwrap"><canvas id="trcv"></canvas><div class="tr-chain" id="trchain"></div></div></div><div class="tr-side" id="trside"></div></div><div class="tr-sheet" id="trsheet" hidden></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', trClick);
  const cv = document.getElementById('trcv'); cv.addEventListener('pointerdown', trBoardTap);
  window.addEventListener('resize', () => { if (!el.hidden) trSize(); });
}
function trOpen() {
  trMount(); const t = document.getElementById('title'); if (t) t.hidden = true;
  document.getElementById('tr').hidden = false; trNew((Date.now() % 100000) + 1);
  if (!TRU.raf) TRU.raf = requestAnimationFrame(trLoop);
}
// 제목 화면의 문은 trendOpen 이라는 이름으로 부른다
function trendOpen() { trOpen(); }
function trExit() { document.getElementById('tr').hidden = true; cancelAnimationFrame(TRU.raf); TRU.raf = 0; TRU.R = TRU.F = null; if (typeof showTitle === 'function') showTitle(); }
function trNew(seed, same) {
  const archs = Object.keys(TREND.ARCH), arch = same ? TRU.R.arch : archs[(archs.indexOf(TRU.prevArch) + 1 + (seed % 2)) % archs.length];
  TRU.seed = seed; TRU.prevArch = arch; TRU.R = TREND.newRun(seed, { arch }); TRU.F = null; TRU.sel = null; TRU.edit = false; TRU.aim = null; TRU.fx = []; TRU.nums = []; TRU.pop = {}; TRU.ended = false; TRU.fires = 0; TRU.kinds = {}; TRU.bodyKey = ''; TRU.info = null; TRU.spawnN = 0;
  typeof music === 'function' && music('day');
  trRender(); trSheetOffer();
}
function trSize() {
  const cv = document.getElementById('trcv'), w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(3, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const cell = Math.floor(Math.min(w / TREND.COLS, h / TREND.ROWS));
  TRU.g = { w, h, dpr, cell, ox: Math.floor((w - cell * TREND.COLS) / 2), oy: Math.floor((h - cell * TREND.ROWS) / 2) };
}
const trCx = c => TRU.g.ox + (c % TREND.COLS + 0.5) * TRU.g.cell, trCy = c => TRU.g.oy + (Math.floor(c / TREND.COLS) + 0.5) * TRU.g.cell;
function trPt(c) { const r = document.getElementById('trcv').getBoundingClientRect(); return { x: r.left + trCx(c), y: r.top + trCy(c) }; }

// ---- 글 (판 짜기와 싸움 옆 칸) ----
function trTop() {
  const R = TRU.R, F = TRU.F, hp = Math.max(0, R.hp);
  let mid = '';
  if (F) { const w = TREND.WAVES.filter(x => x.at <= F.t).length; mid = `<span class="tr-num">물결 ${w}/${TREND.WAVES.length}</span><span class="tr-num">${Math.floor(F.t)}초</span>`; }
  else mid = `<span class="tr-num">길 ${R.bd.path.length}칸</span>`;
  document.getElementById('trtop').innerHTML = `<b>본체</b><span class="tr-hp"><i style="width:${Math.round(100 * hp / R.mhp)}%"></i></span><span class="tr-num">${Math.round(hp)}/${R.mhp}</span>${mid}<span class="grow"></span><button data-t="exit">나가기</button>`;
}
function trTagsHtml() {
  const R = TRU.R, n = TREND.tagCount(R);
  return TREND.TAGS.filter(t => n[t] > 0).sort((a, b) => n[b] - n[a]).map(t => { const lv = TREND.tagLv(R, t, n), nx = TREND.TAG[t].steps.find(s => s > n[t]); return `<button class="tr-tag lv${lv}" data-t="tag" data-v="${t}" style="--c:${TRCOL[t]}">${TREND.TAG[t].name} ${n[t]}${nx ? '/' + nx : ''}</button>`; }).join('');
}
function trBodyHtml() {
  const R = TRU.R, b = TREND.BODY[TREND.bodyOf(R)];
  return `<div class="tr-body"><canvas id="trbody" width="96" height="96"></canvas><div class="tx"><b>${b.name}</b><div class="mute">${b.face}</div><div class="tr-tags">${trTagsHtml()}</div></div></div>`;
}
function trInfoHtml() {
  const R = TRU.R;
  if (TRU.info && TRU.info.tag) { const t = TREND.TAG[TRU.info.tag]; return `<span class="grow"><b>${t.name}</b> · ${t.steps.map((s, i) => s + ': ' + t.text[i]).join(' · ')}</span>`; }
  if (TRU.aim != null) return `<span class="grow">${TRHELP.aim}</span>`;
  if (TRU.F) return `<span class="grow mute">${TRHELP.fight}</span>`;
  if (TRU.edit) return `<span class="grow">${TRHELP.edit}</span>`;
  const p = TRU.sel != null && R.pieces.find(q => q.uid === TRU.sel);
  if (p) { const d = TREND.P[p.id], at = TREND.placedAt(R, p.uid); return `<span class="grow"><b>${d.name}</b> <span class="mute">${TREND.KIND[d.kind]}</span> · ${d.face} <em class="tr-tl">${d.tags.map(t => `<i style="--c:${TRCOL[t]}">${TREND.TAG[t].name}</i>`).join('')}</em></span>${at != null ? '<button data-t="unplace">내리기</button>' : ''}`; }
  return `<span class="grow mute">${TRHELP.setup}</span>`;
}
function trPieceBtn(p) { const d = TREND.P[p.id]; return `<button class="tr-pc${TRU.sel === p.uid ? ' sel' : ''}" data-t="pc" data-u="${p.uid}">${trImg(p.id, 36)}<span>${d.name}<small>${d.face}</small></span></button>`; }
function trRender() {
  const R = TRU.R, F = TRU.F; trTop();
  let h = trBodyHtml() + `<div class="tr-info" id="trinfo">${trInfoHtml()}</div>`;
  if (!F) {
    const b = TREND.bench(R), sk = TREND.skills(R);
    h += `<div class="tr-bench" id="trbench">${b.map(trPieceBtn).join('')}${b.length ? '' : '<span class="mute tr-done">모두 놓았다</span>'}${sk.map(p => `<button class="tr-pc" data-t="skinfo" data-u="${p.uid}">${trImg(p.id, 36)}<span>${TREND.P[p.id].name}<small>기술 · ${TREND.P[p.id].face}</small></span></button>`).join('')}</div>`;
    h += `<div class="tr-act"><button data-t="edit" class="${TRU.edit ? 'on' : ''}"${R.bd.edits > 0 ? '' : ' disabled'}>굴 바꾸기 ${R.bd.edits}</button><button data-t="auto"${b.length ? '' : ' disabled'}>알아서 놓기</button><button data-t="fight" class="pri">싸운다</button></div>`;
  } else {
    h += `<div class="tr-sk">${F.charges.map((c, i) => `<button data-t="sk" data-i="${i}" class="${TRU.aim === i ? 'on' : ''}"${c.used || F.over ? ' disabled' : ''}>${trImg(c.id, 28)}${TREND.P[c.id].name}</button>`).join('')}</div>`;
    h += `<div class="tr-spd">${[1, 2, 3].map(v => `<button data-t="spd" data-v="${v}" class="${TRU.speed === v ? 'on' : ''}">${v}배</button>`).join('')}</div>`;
    h += `<div class="tr-wv" id="trwv">${trWaveHtml()}</div>`;
  }
  document.getElementById('trside').innerHTML = h;
  trSize(); trDrawBody();
}
// 물결 미리 보기: 지금 오는 것과 다음에 올 것
const TRSPURL = {};
function trWaveHtml() {
  const F = TRU.F; if (!F) return ''; const W = TREND.WAVES, k = W.filter(w => w.at <= F.t).length, nx = W[k];
  const row = w => { const n = {}; w.list.forEach(id => { n[id] = (n[id] || 0) + 1; }); return Object.keys(n).map(id => `<span>${`<img class="px" width="36" height="36" alt="" src="${TRSPURL[id] || (TRSPURL[id] = trSprite(id).toDataURL())}">`} ${TREND.E[id].name} ×${n[id]}</span>`).join(''); };
  const left = TREND.alive(F).length + F.spawnQ.filter(q => !nx || q.at < nx.at).length;
  return `<div><b>물결 ${k}/${W.length}</b> <span class="mute">남은 적 ${left}</span></div>` + (nx ? `<div class="mute">다음 물결 ${Math.max(0, Math.ceil(nx.at - F.t))}초 뒤</div><div class="row">${row(nx)}</div>` : '<div class="mute">마지막 물결</div>');
}
function trDrawBody() {
  const c = document.getElementById('trbody'); if (!c) return; const x = c.getContext('2d'), b = trBody(); x.clearRect(0, 0, 96, 96); if (!b) return; x.imageSmoothingEnabled = false;
  const k = 88 / Math.max(b.width, b.height); x.drawImage(b, Math.round((96 - b.width * k) / 2), Math.round((96 - b.height * k) / 2), b.width * k, b.height * k);
}
function trInfo() { const e = document.getElementById('trinfo'); if (e) e.innerHTML = trInfoHtml(); }

// ---- 창: 보상 · 판 끝 ----
// 창이 떠 있으면 뒤의 판은 읽지 않는다 (가려진 것)
function trSheet(on) { const s = document.getElementById('trsheet'); s.hidden = !on; document.querySelectorAll('#trtop, #tr .tr-main').forEach(e => { if (on) e.setAttribute('aria-hidden', 'true'); else e.removeAttribute('aria-hidden'); }); }
function trSheetOffer() {
  const R = TRU.R, s = document.getElementById('trsheet'); if (!R.offer) { trSheet(false); return; }
  s.innerHTML = `<div class="tr-card"><p class="tr-nar">${TRNAR.offer}</p><h3>하나를 고른다</h3><div class="tr-offers">${R.offer.map((id, i) => { const d = TREND.P[id]; return `<button class="tr-off" data-t="offer" data-i="${i}">${trImg(id, 44)}<span>${d.name} <small>${TREND.KIND[d.kind]} · ${d.face}</small><em class="tr-tl">${d.tags.map(t => `<i style="--c:${TRCOL[t]}">${TREND.TAG[t].name}</i>`).join('')}</em></span></button>`; }).join('')}</div></div>`;
  trSheet(true);
}
function trSheetEnd() {
  const R = TRU.R, F = TRU.F, res = R.last, s = document.getElementById('trsheet');
  const rows = Object.keys(res.dmg).map(k => { const v = res.dmg[k]; if (k === 'body') return { nm: TREND.BODY[F.body].name, v, body: true, c: TRCOL[F.body] || TRCOL.none }; const p = R.pieces.find(q => String(q.uid) === k); return p ? { nm: TREND.P[p.id].name, v, id: p.id, c: TRCOL[TREND.P[p.id].tags[0]] } : null; }).filter(Boolean).sort((a, b) => b.v - a.v);
  const tot = rows.reduce((a, r) => a + r.v, 0) || 1, top = rows.length ? rows[0].v : 1;
  const bars = rows.map(r => `<div class="tr-bar" style="--c:${r.c}">${r.body ? '<canvas class="px" width="28" height="28" data-body="1"></canvas>' : trImg(r.id, 28)}<span class="nm">${r.nm}</span><span class="bb"><i style="width:${Math.round(100 * r.v / top)}%"></i></span><span class="v">${Math.round(r.v)} · ${Math.round(100 * r.v / tot)}%</span></div>`).join('');
  s.innerHTML = `<div class="tr-card"><p class="tr-nar">${res.win ? TRNAR.win : TRNAR.lose}</p><h3>${res.win ? '이겼다' : '졌다'} · 누가 얼마나 했나</h3><div class="tr-bars">${bars}</div><div class="tr-stats"><span>${Math.round(res.t)}초</span><span>최대 연쇄 ${res.chainMax}</span><span>삼킴 ${res.swallows}</span><span>움 ${TRU.spawnN}</span><span>본체 ${Math.max(0, Math.round(res.hp))}/${R.mhp}</span></div><div class="tr-end-act"><button data-t="same">같은 판 다시</button><button data-t="again" class="pri">다시 한 판</button></div></div>`;
  trSheet(true);
  const bc = s.querySelector('canvas[data-body]'), b = TRU.bodyC; if (bc && b) { const x = bc.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(b, 0, 0, 28, 28); }
  typeof music === 'function' && music(res.win ? 'win' : 'lose');
}

// ---- 누르기 ----
function trClick(e) {
  const el = e.target.closest('[data-t]'); if (!el || el.disabled) return; const t = el.dataset.t, R = TRU.R;
  if (t === 'exit') return trExit();
  if (t === 'offer') { TREND.take(R, +el.dataset.i); trSheet(false); typeof sfx === 'function' && sfx('card'); TRU.sel = null; return trRender(); }
  if (t === 'pc') { const u = +el.dataset.u; TRU.sel = TRU.sel === u ? null : u; TRU.edit = false; TRU.info = null; typeof sfx === 'function' && sfx('click'); return trRender(); }
  if (t === 'skinfo') { TRU.sel = +el.dataset.u; TRU.info = null; return trInfo(); }
  if (t === 'tag') { TRU.info = TRU.info && TRU.info.tag === el.dataset.v ? null : { tag: el.dataset.v }; return trInfo(); }
  if (t === 'unplace') { TREND.unplace(R, TRU.sel); TRU.sel = null; return trRender(); }
  if (t === 'edit') { TRU.edit = !TRU.edit; TRU.sel = null; TRU.info = null; return trRender(); }
  if (t === 'auto') { TREND.autoPlace(R); TRU.sel = null; typeof sfx === 'function' && sfx('thud'); return trRender(); }
  if (t === 'fight') return trFight();
  if (t === 'spd') { TRU.speed = +el.dataset.v; return trRender(); }
  if (t === 'sk') {
    const i = +el.dataset.i, c = TRU.F.charges[i]; if (!c || c.used) return;
    if (TRU.aim === i) { TRU.aim = null; return trRender(); }
    if (TREND.SKILLCELL[c.id]) { TRU.aim = i; return trRender(); }
    TREND.useSkill(TRU.F, i, null); trEvents(); return trRender();
  }
  if (t === 'again') { trSheet(false); return trNew(TRU.seed * 7 + 13); }
  if (t === 'same') { trSheet(false); return trNew(TRU.seed, true); }
}
function trBoardTap(e) {
  const R = TRU.R, g = TRU.g; if (!R || !g) return; const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left - g.ox, y = e.clientY - r.top - g.oy;
  if (x < 0 || y < 0 || x >= g.cell * TREND.COLS || y >= g.cell * TREND.ROWS) return; const c = Math.floor(y / g.cell) * TREND.COLS + Math.floor(x / g.cell);
  if (TRU.F) {
    if (TRU.aim == null) return; const F = TRU.F, path = R.bd.path; if (!path.includes(c)) return;
    TREND.useSkill(F, TRU.aim, c); TRU.aim = null; trEvents(); typeof sfx === 'function' && sfx('spell'); return trRender();
  }
  if (!document.getElementById('trsheet').hidden) return;
  if (TRU.edit) { if (TREND.toggle(R, c)) { typeof sfx === 'function' && sfx('dig'); if (R.bd.edits <= 0) TRU.edit = false; trRender(); } return; }
  if (TRU.sel != null && TREND.canPlace(R, TRU.sel, c)) { const was = TREND.placedAt(R, TRU.sel); if (was === c) { TRU.sel = null; return trRender(); } TREND.place(R, TRU.sel, c); typeof sfx === 'function' && sfx('thud'); TRU.sel = null; return trRender(); }
  // 판에 놓인 것을 누르면 집는다 (권속 → 부위 → 기관 차례로)
  const here = R.board[c] ? ['kin', 'trap', 'organ'].map(s => R.board[c][s]).filter(u => u != null) : [];
  if (here.length) { const k = here.indexOf(TRU.sel); TRU.sel = here[(k + 1) % here.length]; TRU.info = null; return trRender(); }
  TRU.sel = null; TRU.info = null; trRender();
}
function trFight() {
  const R = TRU.R; TRU.sel = null; TRU.edit = false; TRU.info = null; TRU.F = TREND.startFight(R); TRU.acc = 0; TRU.ended = false;
  typeof sfx === 'function' && sfx('night'); typeof music === 'function' && music('night');
  trRender();
}

// ---- 싸움: 시간 · 사건 → 움직임 ----
function trLoop(ts) {
  TRU.raf = requestAnimationFrame(trLoop); const el = document.getElementById('tr'); if (!el || el.hidden || !TRU.R) return;
  const dt = Math.min(0.1, (ts - (TRU.last || ts)) / 1000); TRU.last = ts; const F = TRU.F;
  if (F && !F.over && TRU.aim == null) {
    TRU.acc += dt * TRU.speed; let n = 0;
    while (TRU.acc >= TREND.DT && n++ < 8) { TRU.acc -= TREND.DT; TREND.step(F); trEvents(); if (F.over) break; }
    if (Math.floor(F.t * 2) !== TRU.tick) { TRU.tick = Math.floor(F.t * 2); trTop(); const wv = document.getElementById('trwv'); if (wv) wv.innerHTML = trWaveHtml(); }
  }
  if (F && F.over && !TRU.ended) { TRU.ended = true; setTimeout(() => { if (TRU.F !== F) return; TREND.endFight(TRU.R); trTop(); trRender(); trSheetEnd(); }, 1100); }
  trDraw(ts / 1000);
}
function trFind(F, uid) { return F.units.find(u => u.uid === uid) || F.allies.find(a => a.uid === uid); }
function trPos(F, u) {
  const path = F.R.bd.path, last = path.length - 1, g = TRU.g, h = trHash(u.uid);
  if (u.kin || u.spawn) { const c = path[Math.max(0, Math.min(last, Math.floor(u.pi)))]; const ox = u.kin ? 0.2 : ((h % 3) - 1) * 0.2 + 0.1, oy = u.kin ? 0.05 : (((h >> 2) % 3) - 1) * 0.16 + 0.12; return { x: trCx(c) + ox * g.cell, y: trCy(c) + oy * g.cell }; }
  const s = Math.max(0, Math.min(last, u.pi - 0.5)), i = Math.floor(s), f = s - i, a = path[i], b = path[Math.min(last, i + 1)];
  return { x: trCx(a) + (trCx(b) - trCx(a)) * f + (u._ox || 0) * g.cell, y: trCy(a) + (trCy(b) - trCy(a)) * f + (u._oy || 0) * g.cell - 0.04 * g.cell };
}
function trHash(s) { let h = 7; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function trEvents() {
  const F = TRU.F; if (!F) return; const now = performance.now() / 1000, R = TRU.R, path = R.bd.path;
  for (const e of F.ev) {
    if (e.k === 'fire') { TRU.fires++; TRU.kinds[e.fx] = (TRU.kinds[e.fx] || 0) + 1; TRU.pop[e.p] = now; const p = F.pieces.find(q => q.uid === e.p); const tgt = e.swallow ? trFind(F, e.swallow) : null;
      TRU.fx.push({ k: e.fx, t: now, cell: e.cell, cells: e.cells, at: tgt ? trPos(F, tgt) : null, col: TRCOL[p ? p.d.tags[0] : 'none'], targets: e.fx === 'eye' ? TREND.alive(F).filter(u => e.cells.includes(TREND.cellOf(F, u))).map(u => trPos(F, u)) : null });
      if (e.swallow && tgt) TRU.nums.push({ t: now, x: tgt.x || trPos(F, tgt).x, y: trPos(F, tgt).y, s: '삼킴', c: '#ff8a80', big: 1 });
      if (typeof sfx === 'function') sfx(e.fx === 'swallow' ? 'die' : e.fx === 'egg' ? 'slide' : 'trap'); }
    else if (e.k === 'hit') { const u = trFind(F, e.u); if (!u) continue; const p = trPos(F, u), col = { trap: '#fff3a0', spore: '#a8e070', body: '#ffb0d0', kin: '#e0e0f0', spawn: '#f0e0a0', skill: '#80e8ff' }[e.kind] || '#fff';
      if (e.kind === 'spore' && e.v < 6) { TRU.nums.push({ t: now, x: p.x + 8, y: p.y - 6, s: String(e.v), c: col, sm: 1 }); continue; }
      TRU.nums.push({ t: now, x: p.x + (Math.random() - 0.5) * 14, y: p.y - 10, s: String(e.v), c: col }); }
    else if (e.k === 'crit') { const u = trFind(F, e.u); if (u) { const p = trPos(F, u); TRU.nums.push({ t: now, x: p.x, y: p.y - 30, s: '치명', c: '#ffb347', big: 1 }); } }
    else if (e.k === 'die') { const u = trFind(F, e.u); if (u) TRU.fx.push({ k: 'die', t: now, at: trPos(F, u) }); }
    else if (e.k === 'burst') { TRU.fx.push({ k: 'burst', t: now, cell: e.cell, cells: [e.cell].concat(TREND.nbrs(e.cell)) }); }
    else if (e.k === 'spawn') { TRU.spawnN++; TRU.fx.push({ k: 'hatch', t: now, cell: e.cell }); }
    else if (e.k === 'body') { TRU.fx.push({ k: 'body', b: e.b, t: now, cell: e.cell }); TRU.pop.body = now; }
    else if (e.k === 'core') { TRU.fx.push({ k: 'corehit', t: now }); TRU.nums.push({ t: now, x: trCx(R.bd.core), y: trCy(R.bd.core) - 20, s: '-' + e.v, c: '#ff5f57', big: 1 }); typeof sfx === 'function' && sfx('hit'); }
    else if (e.k === 'chain') trChain(e.n);
    else if (e.k === 'skill') TRU.fx.push({ k: 'sk_' + e.id, t: now, cell: e.cell });
  }
  F.ev.length = 0;
}
function trChain(n) {
  const el = document.getElementById('trchain'); if (!el) return; el.textContent = '연쇄 ×' + n; el.style.fontSize = Math.min(56, 22 + n * 4) + 'px';
  el.classList.add('show'); clearTimeout(TRU.chT); TRU.chT = setTimeout(() => el.classList.remove('show'), 700);
  if (n >= 3 && typeof sfx === 'function') sfx('combo');
}

// ---- 그리기 ----
function trDraw(now) {
  const cv = document.getElementById('trcv'); if (!cv || !TRU.g) return; const g = TRU.g, x = cv.getContext('2d'), R = TRU.R, F = TRU.F, bd = R.bd, path = bd.path, C = g.cell;
  x.setTransform(g.dpr, 0, 0, g.dpr, 0, 0); x.clearRect(0, 0, g.w, g.h); x.imageSmoothingEnabled = false;
  const rt = performance.now() / 1000;
  // 흙과 굴
  for (let c = 0; c < TREND.N; c++) {
    const X = g.ox + (c % TREND.COLS) * C, Y = g.oy + Math.floor(c / TREND.COLS) * C, h = trHash('c' + c);
    if (!bd.dug[c]) { x.fillStyle = '#3a2a20'; x.fillRect(X, Y, C, C); x.fillStyle = '#4a3828'; for (let k = 0; k < 7; k++) x.fillRect(X + ((h >> k) % 9) * C / 9, Y + ((h >> (k + 3)) % 9) * C / 9, Math.max(2, C / 18), Math.max(2, C / 18)); x.fillStyle = '#2a1e18'; x.fillRect(X, Y + C - 2, C, 2); }
    else { const on = path.includes(c); x.fillStyle = on ? '#2e2436' : '#1e1824'; x.fillRect(X, Y, C, C); x.fillStyle = on ? '#3a2e44' : '#262030'; x.fillRect(X + 3, Y + 3, C - 6, C - 6); }
  }
  // 길 화살표
  x.strokeStyle = 'rgba(232,192,48,.55)'; x.lineWidth = Math.max(2, C / 26); x.setLineDash([C / 10, C / 12]); x.beginPath();
  path.forEach((c, i) => { if (i === 0) x.moveTo(trCx(c), g.oy + Math.floor(c / TREND.COLS) * C + 2); x.lineTo(trCx(c), trCy(c)); }); x.stroke(); x.setLineDash([]);
  path.slice(0, -1).forEach((c, i) => { const n = path[i + 1], mx = (trCx(c) + trCx(n)) / 2, my = (trCy(c) + trCy(n)) / 2, a = Math.atan2(trCy(n) - trCy(c), trCx(n) - trCx(c)); x.save(); x.translate(mx, my); x.rotate(a); x.fillStyle = 'rgba(232,192,48,.8)'; x.beginPath(); x.moveTo(C * 0.09, 0); x.lineTo(-C * 0.06, -C * 0.07); x.lineTo(-C * 0.06, C * 0.07); x.fill(); x.restore(); });
  // 입구의 빛
  { const X = g.ox + (bd.ent % TREND.COLS) * C, Y = g.oy; const gr = x.createLinearGradient(0, Y, 0, Y + C * 0.7); gr.addColorStop(0, 'rgba(255,220,140,.35)'); gr.addColorStop(1, 'rgba(255,220,140,0)'); x.fillStyle = gr; x.fillRect(X + 4, Y, C - 8, C * 0.7); x.fillStyle = '#e8d8b0'; x.font = `600 13px ${getComputedStyle(document.body).fontFamily}`; x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText('입구', X + 6, Y + 4); }
  const font = getComputedStyle(document.body).fontFamily;
  // 판 짜기: 길 칸마다 몇 부위가 닿는가 (많이 닿는 칸이 죽음의 칸)
  if (!F) {
    const cov = {}; for (const k in R.board) for (const s in R.board[k]) { if (s !== 'trap') continue; const p = R.pieces.find(q => q.uid === R.board[k][s]); if (!p) continue; TREND.reach({ R }, { cell: +k, d: TREND.P[p.id] }).forEach(c => { if (path.includes(c)) cov[c] = (cov[c] || 0) + 1; }); }
    for (const c in cov) { const X = g.ox + (c % TREND.COLS) * C, Y = g.oy + Math.floor(c / TREND.COLS) * C; x.fillStyle = `rgba(232,85,47,${Math.min(0.42, 0.11 * cov[c])})`; x.fillRect(X + 3, Y + 3, C - 6, C - 6); if (cov[c] >= 2) { x.fillStyle = '#ffd0a0'; x.font = `700 13px ${font}`; x.textAlign = 'right'; x.textBaseline = 'top'; x.fillText('×' + cov[c], X + C - 6, Y + 5); } }
    // 고른 것을 놓을 수 있는 칸 / 닿는 칸
    const pulse = 0.55 + 0.45 * Math.sin(rt * 5);
    if (TRU.sel != null && !TRU.edit) {
      for (let c = 0; c < TREND.N; c++) if (TREND.canPlace(R, TRU.sel, c)) { const X = g.ox + (c % TREND.COLS) * C, Y = g.oy + Math.floor(c / TREND.COLS) * C; x.strokeStyle = `rgba(255,243,160,${pulse})`; x.lineWidth = 3; x.strokeRect(X + 4, Y + 4, C - 8, C - 8); }
      const at = TREND.placedAt(R, TRU.sel), p = R.pieces.find(q => q.uid === TRU.sel);
      if (at != null && p && TREND.P[p.id].kind === 'trap') TREND.reach({ R }, { cell: at, d: TREND.P[p.id] }).forEach(c => { if (c < 0 || c >= TREND.N) return; const X = g.ox + (c % TREND.COLS) * C, Y = g.oy + Math.floor(c / TREND.COLS) * C; x.fillStyle = (TRCOL[TREND.P[p.id].tags[0]] || '#fff') + '55'; x.fillRect(X + 6, Y + 6, C - 12, C - 12); });
    }
    if (TRU.edit) for (let c = 0; c < TREND.N; c++) if (TREND.canToggle(R, c)) {
      const X = g.ox + (c % TREND.COLS) * C, Y = g.oy + Math.floor(c / TREND.COLS) * C; bd.dug[c] = !bd.dug[c]; const np = TREND.pathOf(bd); bd.dug[c] = !bd.dug[c]; const dl = np ? np.length - path.length : 0;
      x.strokeStyle = dl > 0 ? `rgba(255,243,160,${pulse})` : dl < 0 ? 'rgba(255,125,118,.6)' : bd.dug[c] ? 'rgba(255,125,118,.25)' : 'rgba(111,208,140,.3)'; x.lineWidth = dl > 0 ? 4 : 2; x.setLineDash([6, 5]); x.strokeRect(X + 5, Y + 5, C - 10, C - 10); x.setLineDash([]);
      if (!dl) continue;
      const lab = (bd.dug[c] ? '막기' : '파기') + ' 길' + (dl > 0 ? '+' : '') + dl; x.font = `700 14px ${font}`; x.textAlign = 'center'; x.textBaseline = 'middle'; const tw = x.measureText(lab).width + 10; x.fillStyle = 'rgba(10,8,16,.75)'; x.fillRect(X + C / 2 - tw / 2, Y + C * 0.2 - 10, tw, 20); x.fillStyle = dl > 0 ? '#fff3a0' : dl < 0 ? '#ffb0a8' : '#c8c8d8'; x.fillText(lab, X + C / 2, Y + C * 0.2); }
  }
  // 기관의 기운: 곁의 부위로 가는 가는 선
  for (const k in R.board) { const o = R.board[k].organ; if (o == null) continue; const p = R.pieces.find(q => q.uid === o); if (!p) continue; const col = TRCOL[TREND.P[p.id].tags[0]]; TREND.nbrs(+k).forEach(j => { if (!R.board[j] || (R.board[j].trap == null && R.board[j].kin == null)) return; x.strokeStyle = col + '99'; x.lineWidth = 3; x.setLineDash([3, 4]); x.beginPath(); x.moveTo(trCx(+k), trCy(+k)); x.lineTo(trCx(j), trCy(j)); x.stroke(); x.setLineDash([]); }); }
  // 놓인 것
  const ico = (cnv, cx, cy, s, sc) => { const S = s * (sc || 1); x.drawImage(cnv, Math.round(cx - S / 2), Math.round(cy - S / 2), Math.round(S), Math.round(S)); };
  for (const k in R.board) {
    const c = +k, b = R.board[k], X = trCx(c), Y = trCy(c);
    if (b.organ != null) { const p = R.pieces.find(q => q.uid === b.organ); if (p) ico(trIcon(p.id), X, Y, C * 0.6); }
    if (b.trap != null) { const p = R.pieces.find(q => q.uid === b.trap); if (!p) continue; const fp = F && F.pieces.find(q => q.uid === p.uid), pop = TRU.pop[p.uid] ? Math.max(0, 1 - (rt - TRU.pop[p.uid]) / 0.3) : 0, tx = X - C * 0.22, ty = Y + C * 0.2, s = C * 0.44;
      x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(tx, ty, s * 0.62, 0, 7); x.fill();
      if (fp) { const f = fp.off > 0 ? 0 : fp.t / fp.cd; x.strokeStyle = '#000'; x.lineWidth = 5; x.beginPath(); x.arc(tx, ty, s * 0.62, 0, 7); x.stroke(); x.strokeStyle = f >= 1 ? '#fff3a0' : TRCOL[fp.d.tags[0]]; x.lineWidth = 4; x.beginPath(); x.arc(tx, ty, s * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); x.stroke(); }
      ico(trIcon(p.id), tx, ty, s, 1 + 0.4 * pop);
      if (TRU.sel === p.uid) { x.strokeStyle = '#fff3a0'; x.lineWidth = 3; x.beginPath(); x.arc(tx, ty, s * 0.72, 0, 7); x.stroke(); } }
    if (b.kin != null && !F) { const p = R.pieces.find(q => q.uid === b.kin); if (p) { ico(trIcon(p.id), X + C * 0.2, Y - C * 0.02, C * 0.5); if (TRU.sel === p.uid) { x.strokeStyle = '#fff3a0'; x.lineWidth = 3; x.strokeRect(X - C * 0.06, Y - C * 0.28, C * 0.52, C * 0.52); } } }
  }
  // 본체
  { const b = trBody(), c = bd.core, X = trCx(c), Y = trCy(c), bump = Math.max(0, 1 - (rt - (TRU.bump / 1000)) / 0.5), bp = TRU.pop.body ? Math.max(0, 1 - (rt - TRU.pop.body) / 0.4) : 0, hit = TRU.fx.some(f => f.k === 'corehit' && rt - f.t < 0.25);
    x.fillStyle = hit ? 'rgba(255,95,87,.35)' : 'rgba(176,143,255,.12)'; x.fillRect(g.ox + (c % TREND.COLS) * C + 3, g.oy + Math.floor(c / TREND.COLS) * C + 3, C - 6, C - 6);
    if (b) { const s = C * 0.92 * (1 + 0.18 * bump + 0.12 * bp); x.drawImage(b, Math.round(X - s / 2), Math.round(Y - s / 2 - C * 0.02), Math.round(s), Math.round(s)); } }
  if (F) trDrawFight(x, F, rt, C, font);
}
function trDrawFight(x, F, rt, C, font) {
  const R = TRU.R, path = R.bd.path;
  // 권속과 움
  F.allies.forEach(a => { if (a.hp <= 0) return; const p = trPos(F, a), s = a.kin ? C * 0.5 : C * 0.3, cnv = a.kin ? trIcon(a.id) : trSprite('spawn'); x.drawImage(cnv, Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s)); const w = s * 0.8; x.fillStyle = '#000'; x.fillRect(p.x - w / 2, p.y + s / 2, w, 4); x.fillStyle = '#6fd08c'; x.fillRect(p.x - w / 2, p.y + s / 2, w * Math.max(0, a.hp / a.mhp), 4); });
  // 한 칸에 여럿이면 둥글게 벌려 선다 (자리는 천천히 옮긴다)
  const lead = {};
  { const by = {}; TREND.alive(F).forEach(u => { const c = TREND.cellOf(F, u); (by[c] = by[c] || []).push(u); }); for (const c in by) { const L = by[c].sort((a, b) => String(a.uid).localeCompare(String(b.uid))), n = L.length; lead[by[c].slice().sort((a, b) => b.pi - a.pi)[0].uid] = 1; L.forEach((u, i) => { const r = n === 1 ? 0 : n <= 3 ? 0.2 : 0.27, an = i / n * Math.PI * 2 + 0.6, tx = Math.cos(an) * r - 0.06, ty = Math.sin(an) * r * 0.8; u._ox = u._ox == null ? tx : u._ox + (tx - u._ox) * 0.15; u._oy = u._oy == null ? ty : u._oy + (ty - u._oy) * 0.15; }); } }
  // 적: 그림, 체력, 의도(다음 칸 쪽 화살표와 칠 세기)
  TREND.alive(F).forEach(u => {
    const p = trPos(F, u), e = TREND.E[u.id], s = C * (e.elite ? 0.58 : 0.44), cnv = trSprite(u.id);
    if (u.spore > 0) { x.fillStyle = 'rgba(143,208,95,.35)'; x.beginPath(); x.arc(p.x, p.y, s * 0.55 + Math.sin(rt * 6 + u.pi) * 2, 0, 7); x.fill(); }
    x.globalAlpha = u.stun > 0 ? 0.6 : 1; x.drawImage(cnv, Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s)); x.globalAlpha = 1;
    const w = Math.max(26, s * 0.9), by = p.y - s / 2 - 7; x.fillStyle = '#000'; x.fillRect(p.x - w / 2 - 1, by - 1, w + 2, 6); x.fillStyle = e.elite ? '#e8c030' : '#ff5f57'; x.fillRect(p.x - w / 2, by, w * Math.max(0, u.hp / u.mhp), 4);
    if (u.spore > 0) { x.fillStyle = '#a8e070'; x.font = `700 13px ${font}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(String(u.spore), p.x + w / 2 + 3, by + 2); }
    if (!lead[u.uid] && !e.elite) return;
    const it = TREND.intent(F, u), nx = it.to, cur = TREND.cellOf(F, u), ang = nx === cur ? Math.PI / 2 : Math.atan2(trCy(nx) - trCy(cur), trCx(nx) - trCx(cur));
    const ix = p.x - w / 2 - 2, iy = by - 12; x.fillStyle = 'rgba(10,8,16,.8)'; x.fillRect(ix, iy - 8, 34, 15); x.save(); x.translate(ix + 7, iy); x.rotate(ang); x.fillStyle = '#ffb347'; x.beginPath(); x.moveTo(5, 0); x.lineTo(-4, -4); x.lineTo(-4, 4); x.fill(); x.restore();
    x.fillStyle = '#ffe0c0'; x.font = `700 13px ${font}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(String(it.atk), ix + 14, iy + 0.5);
    if (it.tag === 'elite') { x.fillStyle = '#e8c030'; x.beginPath(); x.moveTo(p.x - 8, by - 20); x.lineTo(p.x - 4, by - 28); x.lineTo(p.x, by - 22); x.lineTo(p.x + 4, by - 28); x.lineTo(p.x + 8, by - 20); x.fill(); }
    if (it.tag === 'heal') { x.fillStyle = '#6fd08c'; x.fillRect(ix + 36, iy - 6, 10, 3); x.fillRect(ix + 39.5, iy - 9.5, 3, 10); }
    if (it.tag === 'fast') { x.strokeStyle = '#80c8ff'; x.lineWidth = 2; x.beginPath(); x.moveTo(ix + 36, iy - 5); x.lineTo(ix + 40, iy); x.lineTo(ix + 36, iy + 5); x.moveTo(ix + 41, iy - 5); x.lineTo(ix + 45, iy); x.lineTo(ix + 41, iy + 5); x.stroke(); }
  });
  // 발동 모습
  TRU.fx = TRU.fx.filter(f => rt - f.t < 0.9);
  TRU.fx.forEach(f => {
    const a = rt - f.t, cells = f.cells || [f.cell];
    const rect = c => [TRU.g.ox + (c % TREND.COLS) * C, TRU.g.oy + Math.floor(c / TREND.COLS) * C];
    if (f.k === 'maw' && a < 0.4) cells.forEach(c => { if (c == null || c < 0) return; const [X, Y] = rect(c), k = Math.min(1, a / 0.15), gap = C * 0.45 * (1 - k); x.fillStyle = `rgba(200,48,58,${0.35 * (1 - a / 0.4)})`; x.fillRect(X, Y, C, C); x.fillStyle = '#f5efe0'; for (let i = 0; i < 6; i++) { const tx = X + C * (0.1 + i * 0.15); x.beginPath(); x.moveTo(tx, Y + C * 0.05 + C * 0.5 - gap - C * 0.05); x.lineTo(tx + C * 0.07, Y + C * 0.5 - gap + C * 0.12); x.lineTo(tx + C * 0.14, Y + C * 0.5 - gap - C * 0.0); x.fill(); x.beginPath(); x.moveTo(tx, Y + C * 0.5 + gap + C * 0.0); x.lineTo(tx + C * 0.07, Y + C * 0.5 + gap - C * 0.12); x.lineTo(tx + C * 0.14, Y + C * 0.5 + gap); x.fill(); } });
    if (f.k === 'swallow' && a < 0.6) { const p = f.at || { x: trCx(f.cell), y: trCy(f.cell) }, r = C * 0.5 * Math.sin(Math.min(1, a / 0.6) * Math.PI); x.fillStyle = '#07050a'; x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fill(); x.strokeStyle = '#f5efe0'; x.lineWidth = 3; x.setLineDash([4, 4]); x.beginPath(); x.arc(p.x, p.y, r * 0.85, 0, 7); x.stroke(); x.setLineDash([]); x.fillStyle = '#c8303a'; x.beginPath(); x.arc(p.x, p.y, r * 0.3, 0, 7); x.fill(); }
    if (f.k === 'spore' && a < 0.8) cells.forEach(c => { if (c == null || c < 0 || c >= TREND.N) return; const t = Math.min(1, a / 0.5), sx = trCx(f.cell), sy = trCy(f.cell), ex = trCx(c), ey = trCy(c); for (let i = 0; i < 4; i++) { const px = sx + (ex - sx) * t + Math.sin(i * 2.1 + a * 5) * C * 0.12, py = sy + (ey - sy) * t + Math.cos(i * 1.7 + a * 4) * C * 0.12; x.fillStyle = `rgba(143,208,95,${0.7 * (1 - a / 0.8)})`; x.beginPath(); x.arc(px, py, C * (0.06 + 0.05 * t) + i, 0, 7); x.fill(); } });
    if (f.k === 'egg' && a < 0.6) { const sx = trCx(f.cell), sy = trCy(f.cell); for (let i = 0; i < 5; i++) { const ang = i * 1.256 + 0.3, d = C * 0.45 * Math.min(1, a / 0.4), h = Math.sin(Math.min(1, a / 0.4) * Math.PI) * C * 0.25; x.fillStyle = '#fffbe8'; x.beginPath(); x.ellipse(sx + Math.cos(ang) * d, sy + Math.sin(ang) * d * 0.6 - h, C * 0.06, C * 0.08, 0, 0, 7); x.fill(); } }
    if (f.k === 'hatch' && a < 0.4) { x.strokeStyle = `rgba(240,224,160,${1 - a / 0.4})`; x.lineWidth = 3; x.beginPath(); x.arc(trCx(f.cell), trCy(f.cell) + C * 0.12, C * 0.12 + a * C * 0.5, 0, 7); x.stroke(); }
    if (f.k === 'water' && a < 0.5) cells.forEach(c => { const [X, Y] = rect(c), t = a / 0.5; x.fillStyle = `rgba(63,184,208,${0.55 * (1 - t)})`; x.fillRect(X, Y + C * (0.2 + 0.1 * Math.sin(t * 6)), C * Math.min(1, t * 1.6), C * 0.6); x.fillStyle = `rgba(200,244,255,${0.8 * (1 - t)})`; x.fillRect(X + C * Math.min(0.95, t * 1.6) - 4, Y + C * 0.2, 4, C * 0.6); });
    if (f.k === 'gut' && a < 0.6) cells.forEach(c => { const [X, Y] = rect(c); for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(184,208,64,${0.8 * (1 - a / 0.6)})`; x.beginPath(); x.arc(X + C * (0.15 + 0.14 * i), Y + C * (0.85 - a * 1.1 - (i % 3) * 0.08), C * 0.05, 0, 7); x.fill(); } });
    if (f.k === 'bone' && a < 0.6) cells.forEach(c => { const [X, Y] = rect(c), d = Math.min(1, a / 0.15); x.fillStyle = '#e8e0c8'; for (let i = 0; i < 4; i++) x.fillRect(X + C * (0.14 + i * 0.22), Y, C * 0.07, C * d); });
    if (f.k === 'eye' && a < 0.35 && f.targets) { const sx = trCx(f.cell), sy = trCy(f.cell); x.strokeStyle = `rgba(176,143,255,${1 - a / 0.35})`; x.lineWidth = 5; f.targets.forEach(t => { x.beginPath(); x.moveTo(sx, sy); x.lineTo(t.x, t.y); x.stroke(); }); x.strokeStyle = `rgba(255,255,255,${1 - a / 0.35})`; x.lineWidth = 2; f.targets.forEach(t => { x.beginPath(); x.moveTo(sx, sy); x.lineTo(t.x, t.y); x.stroke(); }); }
    if (f.k === 'burst' && a < 0.6) cells.forEach(c => { if (c == null) return; x.strokeStyle = `rgba(200,255,140,${1 - a / 0.6})`; x.lineWidth = 4; x.beginPath(); x.arc(trCx(c), trCy(c), C * (0.15 + a * 0.6), 0, 7); x.stroke(); });
    if (f.k === 'die' && a < 0.5) { x.fillStyle = `rgba(200,190,180,${0.6 * (1 - a / 0.5)})`; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(f.at.x + Math.cos(i) * a * C * 0.4, f.at.y + Math.sin(i) * a * C * 0.4, C * 0.05, 0, 7); x.fill(); } }
    if (f.k === 'body' && a < 0.7) { const c = R.bd.core, X = trCx(c), Y = trCy(c), col = TRCOL[f.b] || '#fff', t = a / 0.7;
      if (f.b === 'maw') { const fx = trCx(f.cell), fy = trCy(f.cell), k = Math.min(1, a / 0.2); x.fillStyle = '#07050a'; x.beginPath(); x.arc(fx, fy, C * 0.42 * (1 - Math.abs(0.5 - t)), 0, 7); x.fill(); x.fillStyle = '#f5efe0'; for (let i = 0; i < 7; i++) { const ang = i / 7 * Math.PI * 2; x.beginPath(); x.arc(fx + Math.cos(ang) * C * 0.32 * k, fy + Math.sin(ang) * C * 0.32 * k, C * 0.05, 0, 7); x.fill(); } }
      else if (f.b === 'eye') { const tg = TREND.alive(F).sort((p, q) => q.pi - p.pi)[0]; if (tg && a < 0.35) { const p = trPos(F, tg); x.strokeStyle = 'rgba(176,143,255,.9)'; x.lineWidth = 6; x.beginPath(); x.moveTo(X, Y); x.lineTo(p.x, p.y); x.stroke(); } }
      else { x.strokeStyle = col; x.globalAlpha = 1 - t; x.lineWidth = 6; x.beginPath(); x.arc(X, Y, C * (0.3 + t * 1.1), 0, 7); x.stroke(); x.globalAlpha = 1; } }
    if (f.k === 'sk_wave' && a < 0.8) { const [X, Y] = rect(f.cell); x.fillStyle = `rgba(63,184,208,${0.7 * (1 - a / 0.8)})`; x.fillRect(X - C * 0.5 + a * C * 1.5, Y, C, C); }
    if (f.k === 'sk_gulp' && a < 0.8) { const X = trCx(f.cell), Y = trCy(f.cell); x.fillStyle = '#07050a'; x.beginPath(); x.arc(X, Y, C * 0.6 * Math.sin(a / 0.8 * Math.PI), 0, 7); x.fill(); }
    if (f.k === 'sk_phantom' && a < 0.9) { x.fillStyle = `rgba(176,143,255,${0.3 * (1 - a / 0.9)})`; x.fillRect(0, 0, TRU.g.w, TRU.g.h); }
    if (f.k === 'sk_burst' && a < 0.9) { TREND.alive(F).forEach(u => { const p = trPos(F, u); x.strokeStyle = `rgba(200,255,140,${1 - a / 0.9})`; x.lineWidth = 5; x.beginPath(); x.arc(p.x, p.y, C * (0.1 + a * 0.5), 0, 7); x.stroke(); }); }
    if (f.k === 'sk_call' && a < 0.5) { x.strokeStyle = `rgba(240,224,160,${1 - a / 0.5})`; x.lineWidth = 4; x.beginPath(); x.arc(trCx(f.cell), trCy(f.cell), C * (0.2 + a), 0, 7); x.stroke(); }
  });
  // 기술 겨누기: 길 칸이 빛난다
  if (TRU.aim != null) { const pulse = 0.5 + 0.5 * Math.sin(rt * 6); path.forEach(c => { if (c === R.bd.core) return; const X = TRU.g.ox + (c % TREND.COLS) * C, Y = TRU.g.oy + Math.floor(c / TREND.COLS) * C, n = TREND.alive(F).filter(u => TREND.cellOf(F, u) === c).length; x.strokeStyle = `rgba(128,232,255,${0.4 + 0.6 * pulse})`; x.lineWidth = 3; x.strokeRect(X + 4, Y + 4, C - 8, C - 8); if (n) { x.fillStyle = '#80e8ff'; x.font = `700 14px ${font}`; x.textAlign = 'right'; x.textBaseline = 'top'; x.fillText('적 ' + n, X + C - 7, Y + 6); } }); }
  // 숫자
  TRU.nums = TRU.nums.filter(n => rt - n.t < 0.9); x.textAlign = 'center'; x.textBaseline = 'middle';
  TRU.nums.forEach(n => { const a = rt - n.t; x.globalAlpha = Math.min(1, 1.6 * (1 - a / 0.9)); x.font = `900 ${n.big ? 20 : n.sm ? 13 : 16}px ${font}`; x.lineWidth = 3; x.strokeStyle = '#000'; x.strokeText(n.s, n.x, n.y - a * 26); x.fillStyle = n.c; x.fillText(n.s, n.x, n.y - a * 26); x.globalAlpha = 1; });
}
if (typeof window !== 'undefined') window.__trend = { get R() { return TRU.R; }, get F() { return TRU.F; }, get fires() { return TRU.fires; }, get kinds() { return TRU.kinds; }, get body() { return TRU.bodyKey; }, pt: trPt, open: trOpen, T: TREND };
