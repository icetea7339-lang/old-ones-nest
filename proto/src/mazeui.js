// 굴 짓기 화면: 첫 화면, 지도(파기·메우기·방·함정·권속 세우기), 상점과 대기석, 침입 재생, 결과와 판 끝.
// 규칙은 maze.js (MAZE), 싸움 재생은 둥지 전투의 것(lairui.js 의 lairReplay)을 그대로 쓴다. 그림은 lairart.js 의 maze* (없으면 단순한 대체).
const MZ = { shop: false, travel: null, M: null, v: null, phase: 'title', sel: null, sheet: null, drag: null, hover: -1, k: 1, t: 0, last: 0, raf: 0, pops: {}, burst: null, play: null, tut: -1, toastT: 0, dug0: 0, dbg: {} };
const MS = 64, MTOP = 40, MW = MS * 5, MGY = MTOP + MS * 8, MBAND = 104, MH = MGY + MBAND;
// 지도 밖의 두 방 (캔버스 좌표): 출구(37) 밑으로 굴이 빠져나가 본체 방, 거기서 짧은 굴로 알의 방
const MZCR = { x: 10, y: MGY + 16, w: 200, h: 82 }, MZER = { x: 232, y: MGY + 8, w: 80, h: 92 };
const MZCORE_SPOTS = [[MZCR.x + 126, MZCR.y + MZCR.h - 12], [MZCR.x + 156, MZCR.y + MZCR.h - 12], [MZCR.x + 186, MZCR.y + MZCR.h - 12]];
// 칸 번호면 칸 가운데, 'core' 면 본체 방의 가운데(본체 자리), 'egg' 면 알
function mzPt(c) { if (c === 'core') return { x: MZCR.x + 68, y: MZCR.y + MZCR.h * 0.55 }; if (c === 'egg') return { x: MZER.x + MZER.w / 2, y: MZER.y + MZER.h / 2 }; return { x: mzCx(c), y: mzCy(c) }; }
const MZEXIT = 37;
// 규칙의 함정 id → 그림의 함정 id
const MZTRAP = { tr_teeth: 'pit', tr_whisper: 'whisper', tr_slime: 'slime', tr_spore: 'spore' };
const MZTRAPC = { tr_teeth: '#e8e0d0', tr_whisper: '#b48cff', tr_slime: '#6ad08a', tr_spore: '#d8e870', tr_lure: '#ffc860', tr_maw: '#9a6ad8', tr_mirror: '#a8d8ff' };
const MZNAR = {
  win: '횃불은 굴의 중간에서 꺼졌다. 알은 고요히 맥박쳤다.',
  hurt: '발소리가 알의 방까지 닿았다. 껍질에 새 금이 갔다.',
  end: '네 번째 등불이 꺼진 뒤로, 굴을 찾아 내려오는 자는 없었다. 알 속의 것은 더 깊이 잠들었다.',
  fall: '껍질이 갈라지고, 그 안의 어둠이 흙으로 스며들었다. 둥지는 지킬 것을 잃었다.',
};
const MZTUT = [
  { key: 'shop', text: '「상점」에서 권속을 산다.' },
  { key: 'place', text: '권속을 누르고 빛나는 통로를 누른다.' },
  { key: 'dig', text: '바위를 눌러 굴을 넓힌다.' },
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
const MZKEY = 'maze', mzKeyOf = mode => (mode === 'story' ? 'mazestory' : MZKEY);
const mzOwnKey = k => !(typeof SAVE_KEYS !== 'undefined' && SAVE_KEYS && SAVE_KEYS[k || MZKEY]);
function mzSaveDel(mode) { const k = mzKeyOf(mode); try { if (mzOwnKey(k)) localStorage.removeItem('nestmaze.' + k); else store.del(k); } catch (e) { /* 저장 없이 */ } }
// 이야기는 장면을 읽는 중(M.ui.read)이면 판이 끝났어도(알이 깨져 다시 할 때, 결말) 남긴다
const mzKeepable = M => M.phase === 'prep' || !!M.awaken || (M.mode === 'story' && !!(M.ui && M.ui.read));
function mzSave() { const M = MZ.M; if (!M) return; const k = mzKeyOf(M.mode); try { const raw = mzKeepable(M) ? JSON.parse(MAZE.save(M)) : null; if (mzOwnKey(k)) { if (raw) localStorage.setItem('nestmaze.' + k, JSON.stringify(raw)); else localStorage.removeItem('nestmaze.' + k); } else if (raw) store.set(k, raw); else store.del(k); } catch (e) { /* 저장 없이 */ } }
function mzSaved(mode) {
  const k = mzKeyOf(mode); let raw = null; try { raw = mzOwnKey(k) ? JSON.parse(localStorage.getItem('nestmaze.' + k) || 'null') : store.get(k); } catch (e) { raw = null; } if (!raw) return null;
  try { const M = MAZE.load(raw); if (M && (M.mode || 'free') === (mode === 'story' ? 'story' : 'free') && mzKeepable(M)) { MAZE.view(M); return M; } } catch (e) { /* 아래에서 치운다 */ }
  mzSaveDel(mode); return null;
}

// ---- 첫 화면 ----
function mzTitle() {
  const lr = $('lr'); if (lr) lr.hidden = true; const m = $('mz'); if (m) m.hidden = true; $('modal').hidden = true; $('title').hidden = false; MZ.phase = 'title';
  const run = mzSaved('free'), st = mzSaved('story'), snd = META.sound !== false, ends = mzEndsSeen().length;
  $('menu').innerHTML = `<div class="mz-mode"><button class="btn pri" data-z="story">이야기${st ? `<small>이어하기 · ${esc(mzChapName(st.chapter))} · 침입 ${st.raid}</small>` : ''}</button>${st ? '<button class="btn sm" data-z="storyNew">새로</button>' : ''}</div>${ends ? `<p class="mz-ends">본 결말 ${ends}/5</p>` : ''}`
    + `<div class="mz-mode"><button class="btn" data-z="free">자유${run ? `<small>이어하기 · 침입 ${run.raid}/${run.raids}</small>` : ''}</button>${run ? '<button class="btn sm" data-z="freeNew">새로</button>' : ''}</div>`
    + `<div class="mz-row2"><button class="btn" data-z="help">도움말</button><button class="btn${snd ? ' on' : ''}" data-z="sound" aria-pressed="${snd}">소리 ${snd ? '켬' : '끔'}</button></div>`;
  mzMusic('title'); mzTitleScene();
}
const MZTG = (() => { const g = []; for (let i = 0; i < 40; i++) g.push({ dug: false, use: null, room: null, trap: null }); const set = (c, use, o) => Object.assign(g[c], { dug: true, use }, o || {});
  [2, 7, 6, 11, 16, 17, 18, 23, 28, 27].forEach(c => set(c, 'path')); set(16, 'kin', { room: 'eye' }); set(18, 'trap', { trap: 'tr_teeth' }); set(32, 'path'); set(37, 'path'); set(13, 'kin', { room: 'nursery' }); set(8, 'path'); set(12, 'path'); return g; })();
const MZTU = { 16: [{ kind: 'gazer', star: 2 }, { kind: 'hood', star: 1 }], 13: [{ kind: 'brood', star: 1 }] };
function mzTitleScene() {
  const t = $('title'); let cv = $('mz-tcv'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'mz-tcv'; cv.className = 'px'; cv.width = MW; cv.height = mzFn('mazeTitle') ? 400 : MH; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', '입구에서 알까지 내려가는 굴'); t.insertBefore(cv, t.firstChild); }
  if (!MZ.traf) { const loop = now => { MZ.traf = requestAnimationFrame(loop); if ($('title').hidden) return; mzTitleDraw(cv.getContext('2d'), now); }; MZ.traf = requestAnimationFrame(loop); }
}
function mzTitleDraw(x, now) {
  if (mzFn('mazeTitle')) { const cv = x.canvas; x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(LAIRART.mazeTitle(cv.width, cv.height, (now % 6000) / 6000), 0, 0); return; }
  const tf = (now % 3000) / 3000; x.imageSmoothingEnabled = false; x.fillStyle = '#050407'; x.fillRect(0, 0, MW, MH);
  if (mzFn('mazeEntrance')) x.drawImage(LAIRART.mazeEntrance(MS, 5), 0, 0);
  for (let c = 0; c < 40; c++) mzCellDraw(x, MZTG, c, tf, 'abyss');
  Object.keys(MZTU).forEach(c => mzUnitsDraw(x, MZTG, +c, MZTU[c]));
}
const MZHELP = [
  ['짓기', '<p>바위를 눌러 판다. 입구에서 알까지 길이 끊기는 파기와 메우기는 되지 않는다.</p><p>판 칸은 통로, 권속 방, 함정 가운데 하나가 된다. 권속 방에는 셋까지 세우고, 방 종류 하나를 깐다.</p><p>본체 방에는 본체와 권속 둘이 선다.</p><p>미로 함정 셋은 길을 어지럽힌다. 미끼 불빛은 헤매는 일행을 끌고, 삼키는 구멍은 입구 아래로 뱉고, 헛갈림 벽은 다음 갈림길을 틀리게 한다.</p>'],
  ['침입', '<p>일행은 입구에서 굴을 더듬어 내려온다. 길잡이가 없으면 갈림길마다 헤매고 막다른 곳에서 되돌아간다. 지도의 점선이 그 길이다.</p><p>추적자가 길잡이로 앞서면 일행은 알까지 곧게 온다. 길잡이가 쓰러지면 다시 헤맨다.</p><p>함정을 밟으면 다치고, 권속이 선 방에 닿으면 그 방에서 싸운다. 다친 것은 다음 방까지 이어진다.</p><p>알에 닿은 자마다 알이 깎인다. 알이 깨지면 판이 끝난다.</p>'],
  ['깨어남', '<p>본체는 두 번 깨어난다. 자유는 침입 1 뒤와 3 뒤, 이야기는 2장 끝과 4장 끝이다.</p><p>모습 셋 가운데 하나를 고른다. 모습마다 본체 기술, 상점에 그 성향이 나올 몫, 드물게 나오는 모습 권속, 값 없는 방 종류 하나, 깨어날 때 받는 신도 하나가 정해진다. 본체 방 자리는 셋이 되고 알이 1 찬다.</p><p>둘째 깨어남에서 지금 모습을 고르면 그대로 자라 기술이 세진다. 다른 모습을 고르면 갈아타 섞인 몸이 된다: 두 모습의 몫을 조금씩 갖지만 기술은 세지지 않는다.</p>'],
  ['진화', '<p>같은 권속 셋을 모으면 하나가 되어 별이 오른다. 별은 셋까지 오른다.</p><p>방 안에서 같은 성향 둘이면 그 성향의 힘이 붙는다.</p>'],
];
function mzHelp(page) {
  page = page || 0; const m = $('modal'); const pages = MZHELP.concat([['기록', mzLogsHtml()]]); if (page >= pages.length) page = 0;
  m.innerHTML = `<div class="sh-box mz-help" role="dialog" aria-modal="true"><div class="sh-head"><h2>도움말</h2><button class="sh-x" data-z="mclose" aria-label="닫기">✕</button></div><div class="sh-tabs" style="grid-template-columns:repeat(${pages.length},minmax(0,1fr))">${pages.map((q, i) => `<button class="sh-tab${i === page ? ' on' : ''}" data-z="hpage" data-i="${i}">${q[0]}</button>`).join('')}</div><div class="sh-body">${pages[page][1]}</div></div>`;
  m.hidden = false;
}
function mzTitleClick(e) {
  const b = e.target.closest('[data-z]'); if (!b) { if (e.target.id === 'modal') $('modal').hidden = true; return; } const a = b.dataset.z;
  if (a === 'start' || a === 'fresh') { mzSaveDel('free'); return mzOpen(null); }
  if (a === 'cont' || a === 'free') { const run = mzSaved('free'); mzOpen(run || null); if (run && run.ui && run.ui.read) return mzRead(); if (run && run.awaken) return mzAwaken(); return; }
  if (a === 'story') { mzSay('click'); const st = mzSaved('story'); return st ? mzStoryResume(st) : mzStoryNew(); }
  if (a === 'storyNew' || a === 'freeNew') { mzSay('click'); return mzAskNew(a === 'storyNew' ? 'story' : 'free'); }
  if (a === 'newYes') { const md = b.dataset.mode; mzSaveDel(md); $('modal').hidden = true; return md === 'story' ? mzStoryNew() : mzOpen(null); }
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
<div id="mz-main"><div id="mz-mapwrap"><canvas id="mz-cv" width="${MW}" height="${MH}"></canvas><div id="mz-ov"></div><button id="mz-next" data-m="pinfo" hidden></button><button id="mz-uinfo" data-m="uinfo" hidden></button></div>
<div id="mz-side"><div id="mz-shop" hidden></div><div id="mz-bench"></div><div id="mz-raid" hidden></div></div></div>
<div id="mz-sheet" hidden></div><div id="mz-coach" hidden></div><div id="mz-ring" hidden></div><div id="mz-toast" hidden></div><img id="mz-drag" alt="" hidden><div id="mz-zoom" hidden></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', mzClick);
  el.addEventListener('pointerdown', mzDown); el.addEventListener('pointermove', mzMove); el.addEventListener('pointerup', mzUp); el.addEventListener('pointercancel', mzCancel);
  // 끄는 동안에는 손가락의 움직임을 게임이 쥔다 (폰에서 스크롤로 넘어가 끌기가 취소되지 않게)
  el.addEventListener('touchmove', e => { if (MZ.drag && MZ.drag.uid && e.cancelable) e.preventDefault(); }, { passive: false });
  // 손가락이 닿는 순간부터 쥔다: 앱(웹뷰)이 첫 움직임을 스크롤로 가져가 끌기가 끊기지 않게. 누르기는 pointer 사건이 그대로 받는다
  el.addEventListener('touchstart', e => { const t = e.target; if (e.cancelable && MZ.phase === 'prep' && !MZ.sheet && (t.id === 'mz-cv' || (t.closest && t.closest('#mz-bench .mz-slot.has')))) e.preventDefault(); }, { passive: false });
  window.addEventListener('resize', () => { if (!el.hidden) mzSize(); });
  window.addEventListener('keydown', e => { if (el.hidden || e.key !== 'Escape') return; if (MZ.sheet && MZ.sheet.kind !== 'result') mzSheetClose(); else if (MZ.sel) { MZ.sel = null; mzDraw(); } });
}
function mzOpen(run) {
  mzMount(); $('title').hidden = true; $('modal').hidden = true; $('mz').hidden = false;
  MZ.M = run || MAZE.newRun((Date.now() % 1000000) + 1); MZ.phase = 'prep'; MZ.sel = null; MZ.sheet = null; MZ.play = null; $('mz-sheet').hidden = true; $('mz-ov').innerHTML = '';
  const coachOk = !(navigator.webdriver && !window.__mazeCoach); MZ.tut = coachOk && MZ.M.mode !== 'story' && !(META && META.mazeTut) ? 0 : -1; MZ.dug0 = MAZE.dugCount(MZ.M);
  mzDraw(); mzSize(); mzMusic('day'); if (!MZ.raf) { MZ.last = performance.now(); MZ.raf = requestAnimationFrame(mzLoop); }
}
function mzHome() { mzSave(); $('mz').hidden = true; MZ.sheet = null; $('mz-sheet').hidden = true; if (typeof lrReplayEnd === 'function' && typeof LU !== 'undefined' && LU.replay) { LU.replay.done = null; lrReplayEnd(); } MZ.play = null; mzTitle(); }
// 크기: 지도는 위에서 아래로, 아래에 대기석·상점(침입 중에는 빠르기와 일행)
const MZSIDE = 58;
function mzSize() {
  const wrap = $('mz-mapwrap'), cv = $('mz-cv'), vw = window.innerWidth, vh = window.innerHeight, wide = vw >= 900, barH = $('mz-bar').offsetHeight || 44;
  $('mz').classList.toggle('wide', wide);
  const availH = vh - barH - (wide ? 16 : MZSIDE + 6), availW = wide ? Math.min(vw - 470, 560) : vw;
  let k = Math.min(availW / MW, availH / MH); k = Math.max(0.5, Math.min(wide ? 1.6 : 1.4, k)); MZ.k = k;
  cv.style.width = Math.floor(MW * k) + 'px'; cv.style.height = Math.floor(MH * k) + 'px'; wrap.style.width = Math.floor(MW * k) + 'px'; wrap.style.height = Math.floor(MH * k) + 'px';
  mzCoach();
}

// ---- 위 띠, 대기석, 상점 ----
function mzView() { MZ.v = MAZE.view(MZ.M); return MZ.v; }
function mzDraw() {
  const M = MZ.M; if (!M) return; const v = mzView(), raid = MZ.phase === 'raid', P = raid && MZ.play && !MZ.play.done ? MZ.play : null, eg = raid && MZ.play ? MZ.play.egg : v.egg.hp, gold = P ? P.gold0 : v.gold, rd = P ? P.raidNo : Math.min(v.raid, v.raids);
  $('mz-bar').innerHTML = `<span class="mz-stat mz-gold" aria-label="진액 ${gold}"><i></i>${gold}</span><span class="mz-stat" aria-label="레벨 ${v.level}, 세운 수 ${v.placed}/${v.cap}">Lv ${v.level}<small>${v.placed}/${v.cap}</small></span><span class="mz-stat mz-egg${eg < v.egg.max * 0.5 ? ' low' : ''}" aria-label="알 ${eg}/${v.egg.max}"><i></i>${eg}<small>/${v.egg.max}</small></span><span class="mz-stat mz-rd">침입 ${rd}/${v.raids}</span><button class="mz-menu" data-m="menu" aria-label="메뉴"><i></i></button>`;
  $('mz-bench').hidden = raid; $('mz-raid').hidden = !raid; if (raid) MZ.shop = false; $('mz-shop').hidden = !MZ.shop;
  if (raid) { $('mz-next').hidden = true; $('mz-uinfo').hidden = true; mzRaidPanel(); mzCoach(); return; }
  const sel = MZ.sel && MZ.sel.uid;
  $('mz-bench').innerHTML = v.bench.map((u, i) => (u ? `<div class="mz-slot has${sel === u.uid ? ' on' : ''}${MZ.pops[u.uid] > MZ.t ? ' pop' : ''}" data-bench="${i}" data-u="${u.uid}" role="button" aria-label="${esc(u.name)} ${u.star}성"><img src="${mzIcon(u.kind, u.star, 36)}" alt="">${mzStars(u.star)}</div>` : `<div class="mz-slot" data-bench="${i}"></div>`)).join('')
    + `<button class="mz-shopbtn${MZ.shop ? ' on' : ''}" data-m="shopt" aria-pressed="${MZ.shop}">상점</button><button class="mz-raidbtn pri" data-m="raid">침입</button>`;
  if (MZ.shop) mzShopHtml(v);
  mzNextBtn(v); mzUinfoBtn();
  mzCoach(); mzSave();
}
const mzSanTrap = id => { const T = MAZE.TRAP && MAZE.TRAP[id]; return !!(T && (T.san || T.sanFlat) && MAZE.MK && MAZE.MK.trapSanFade); };
// 고른 함정·방 종류의 설명 (확인 줄 위)
function mzPendInfo(pd, v) {
  if (pd.act === 'trap') { const T = MAZE.trapInfo(pd.id); if (!T) return ''; const av = (MAZE.AVOIDERS || []).map(k => (LAIR.INV && LAIR.INV[k] ? LAIR.INV[k].name : k)).join('·'), notes = [];
    if (!T.maze && av) notes.push(av + '가 낀 일행은 돌아갈 길이 있으면 피한다.'); if (mzSanTrap(pd.id) && !/절반/.test(T.more)) notes.push('정신을 깎는 함정은 두 번째부터 절반, 세 번째부터 4분의 1.');
    return `<div class="mz-cinfo"><img src="${mzTrapIcon(pd.id)}" alt=""><div><b>${esc(T.name)} · ${pd.cost}</b><p>${esc(T.more)}</p>${notes.map(n => `<small>${esc(n)}</small>`).join('')}</div></div>`; }
  if (pd.act === 'room') { const R = LAIR.roomInfo(pd.id); if (!R) return ''; return `<div class="mz-cinfo"><img src="${mzRoomIcon(pd.id)}" alt=""><div><b>${esc(R.name)} · ${pd.cost}</b><p>${esc(R.more || R.short)}</p></div></div>`; }
  return '';
}
// 값이 드는 칸 일: 고르면 창 아래에 확인 줄. 같은 것을 다시 누르면 풀린다
function mzPend(p) { const q = MZ.pend; MZ.pend = q && q.act === p.act && q.key === p.key && q.cell === p.cell ? null : p; MZ.pendT = performance.now(); mzSay('click'); mzSheet(MZ.sheet); }
const mzJosa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? a : b); };
// 확인: 하고 나면 창을 닫고 지도에서 그 칸이 번쩍인다. 안 되면 창을 두고 까닭
function mzConfirm() {
  const p = MZ.pend, M = MZ.M; if (!p || performance.now() - (MZ.pendT || 0) < 250) return; const c = p.cell; let r = null, msg = '', fx = 'drop', img = null;
  if (p.act === 'dig') { r = MAZE.dig(M, c); msg = '팠다 · −' + (r.cost != null ? r.cost : p.cost); fx = 'dig'; }
  else if (p.act === 'fill') { r = MAZE.fill(M, c); msg = '메웠다 · +' + (r.gold || 0); fx = 'dig'; }
  else if (p.act === 'use') { r = MAZE.setUse(M, c, p.u, null); msg = p.u === 'kin' ? '권속 방으로 바꿨다' : '통로로 바꿨다'; }
  else if (p.act === 'room') { r = MAZE.setUse(M, c, 'kin', p.id); const nm = LAIR.ROOM[p.id] ? LAIR.ROOM[p.id].name : '방'; msg = mzJosa(nm, '을', '를') + ' 깔았다' + (r.cost ? ' · −' + r.cost : ''); if (mzFn('mazeRoomMark')) img = LAIRART.mazeRoomMark(MS, p.id, 0); }
  else if (p.act === 'trap') { r = MAZE.setUse(M, c, 'trap', p.id); const T = MAZE.trapInfo(p.id); msg = mzJosa(T ? T.name : '함정', '을', '를') + ' 깔았다' + (r.cost ? ' · −' + r.cost : ''); if (mzFn('mazeTrap')) img = LAIRART.mazeTrap(MS, MZTRAP[p.id] || p.id, 0); }
  if (!r || !r.ok) { mzToast(r ? r.msg : '안 된다'); MZ.pend = null; mzSay('click'); return mzSheet(MZ.sheet); }
  MZ.pend = null; mzSheetClose(); mzSay('thud'); MZ.fx = { cell: c, kind: fx, img, t1: MZ.t + 650, dur: 650 }; MZ.dbg.fx = fx; mzToast(msg, 1800); mzDraw();
}
// 다음 일행: 길잡이(추적자)가 있으면 「길잡이 · 추적자」, 없으면 「헤맨다」. 누르면 일행 창
function mzUinfoBtn() {
  const b = $('mz-uinfo'); if (!b) return; const u = MZ.sel && MZ.sel.uid != null && MZ.phase === 'prep' ? MZ.M.unit[MZ.sel.uid] : null; if (!u) { b.hidden = true; return; }
  b.dataset.k = u.kind; b.dataset.s = u.star; b.dataset.u = u.uid != null ? u.uid : MZ.sel.uid; b.innerHTML = `<img src="${mzIcon(u.kind, u.star, 20)}" alt=""><span>자세히</span>`; b.setAttribute('aria-label', (LAIR.KIN[u.kind] ? LAIR.KIN[u.kind].name : '') + ' 자세히');
  b.style.height = Math.max(26, Math.round(MTOP * MZ.k) - 8) + 'px'; b.hidden = false;
}
function mzScoutOf(party) { const sc = MAZE.SCOUTS || []; return (party || []).find(p => sc.includes(p.kind)) || null; }
function mzNextBtn(v) {
  const b = $('mz-next'); if (!b) return; const n = v.next; if (!n || MZ.phase !== 'prep' || (v.locks && v.locks.wander === false)) { b.hidden = true; return; }
  const sc = mzScoutOf(n.party); b.className = sc ? 'scout' : 'lost'; b.innerHTML = sc ? `<img src="${mzIcon(sc.kind, 1, 20)}" alt=""><span>길잡이 · ${esc(sc.name)}</span>` : `<span>헤맨다</span>`;
  b.setAttribute('aria-label', '다음 일행 ' + (sc ? '길잡이 ' + sc.name : '헤맨다')); b.style.height = Math.max(26, Math.round(MTOP * MZ.k) - 8) + 'px'; b.hidden = false;
}
// 상점 카드의 설명 판: 이름 · 값 · 성향 · 역할 · 체력 · 공격 · 닿는 칸 · 스킬 · 같은 권속 수. 다른 카드를 누르면 바뀐다
function mzShopPanel(u, i, v) {
  const M = MZ.M, same = Object.values(M.unit).filter(q => q.kind === u.kind && q.star === 1).length;
  return `<div class="mz-spanel" role="region" aria-label="${esc(u.name)} 설명"><div class="mz-sp1"><img src="${mzIcon(u.kind, 1, 36)}" alt=""><div><b>${esc(u.name)} · ${u.cost}</b><small><img src="${mzSym(u.asp, 14)}" alt="">${esc(u.aspName)} · ${esc(u.roleName)} · ${esc(u.reach)}</small></div><button class="mz-spx" data-m="shopx" aria-label="닫기">✕</button></div>`
    + `<p class="mz-sp2">체력 ${u.hp} · 공격 ${u.atk} · 방어 ${u.df} · 닿는 칸 ${u.range}</p><p class="mz-sp3"><b>${esc(u.skill.name)}</b> ${esc(u.skill.more || u.skill.short)}</p>`
    + `<p class="mz-sp4">같은 권속 ${same}${same >= 2 ? ' · 사면 셋이 하나로 ★★' : ' · 셋이면 별이 오른다'}</p><div class="mz-sp5"><button class="pri" data-m="buy" data-i="${i}"${u.can ? '' : ' disabled'}>산다 · ${u.cost}</button><button data-m="shopx">닫기</button></div>${u.can ? '' : '<p class="mz-why">진액이 모자란다</p>'}</div>`;
}
// 상점 서랍: 대기석 위로 올라온다. 카드를 한 번 누르면 고르고(위 줄에 이름·역할·스킬), 다시 누르면 산다. 사면 닫힌다
function mzShopHtml(v) {
  const s = MZ.sel && MZ.sel.shop != null ? v.shop[MZ.sel.shop] : null;
  $('mz-shop').innerHTML = (s ? mzShopPanel(s, MZ.sel.shop, v) : '') + `<div class="mz-shead">${`<span class="mz-shint">진액 ${v.gold}</span><button data-m="reroll"${v.canReroll ? '' : ' disabled'}>뽑기 ${v.costs.reroll}</button><button data-m="xp"${v.canXp ? '' : ' disabled'}>${v.level >= v.maxLv ? 'Lv ' + v.level : '넓히기 ' + v.costs.xp}${v.level >= v.maxLv ? '' : `<i class="mz-xp"><b style="width:${v.xpNeed ? Math.round(v.xp / v.xpNeed * 100) : 100}%"></b></i>`}</button>`}</div>`
    + `<div class="mz-cards">${v.shop.map((q, i) => (q ? `<button style="${(v.core && (v.core.kin || []).includes(q.kind)) ? '--fk:' + (MZFORMC[v.core.form] || '#ffd040') : ''}" class="mz-card c${q.cost}${(v.core && (v.core.kin || []).includes(q.kind)) ? ' formk' : ''}${q.can ? '' : ' poor'}${MZ.sel && MZ.sel.shop === i ? ' on' : ''}" data-m="shop" data-i="${i}" aria-label="${esc(q.name)} ${q.cost}"><em>${q.cost}</em><img class="mz-asp" src="${mzSym(q.asp, 14)}" alt="${esc(q.aspName)}"><img src="${mzIcon(q.kind, 1, 36)}" alt=""><b>${esc(q.name)}</b></button>` : '<div class="mz-card empty"></div>')).join('')}</div>`;
}
function mzToast(msg, ms) { const t = $('mz-toast'), cv = $('mz-cv'); t.textContent = msg; t.hidden = false; if (cv && cv.offsetParent) { const r = cv.getBoundingClientRect(); t.style.top = Math.round(r.top + MTOP * MZ.k + 6) + 'px'; t.style.left = Math.round(r.left + r.width / 2) + 'px'; t.style.maxWidth = Math.round(r.width - 8) + 'px'; } MZ.toastT = MZ.t + (ms || 1700); }

// ---- 지도 그리기 ----
const mzCx = c => (c % 5) * MS + MS / 2, mzCy = c => MTOP + Math.floor(c / 5) * MS + MS / 2;
// 이웃: 위 1, 오른쪽 2, 아래 4, 왼쪽 8. 입구(0행 가운데의 위)는 판 칸으로 친다
function mzNb(grid, c) { const r = Math.floor(c / 5), q = c % 5, out = []; [[-1, 0], [0, 1], [1, 0], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = q + dc; if (rr === -1 && cc === 2) out.push(true); else if (rr < 0 || rr > 7 || cc < 0 || cc > 4) out.push(false); else out.push(!!grid[rr * 5 + cc].dug); }); return out; }
const mzMask = (grid, c) => mzNb(grid, c).reduce((a, d, k) => a | (d ? 1 << k : 0), 0);
const mzRockV = (grid, c) => mzNb(grid, c).reduce((a, d, k) => a | (d ? 0 : 1 << k), 0);
function mzTrapDraw(x, id, X, Y, S, t) {
  if (mzFn('mazeTrap')) { x.drawImage(LAIRART.mazeTrap(S, MZTRAP[id] || id, t), X, Y); return; }
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
  const room = g.use === 'kin';
  if (mzFn('mazeFloor')) x.drawImage(A.mazeFloor(MS, mzMask(grid, c), room ? 'room' : 'path', c * 5 + 1), X, Y); else { x.fillStyle = room ? '#1c3a3c' : '#16282c'; x.fillRect(X + 2, Y + 2, MS - 4, MS - 4); }
  if (g.use === 'kin' && g.room) { if (mzFn('mazeRoomMark')) x.drawImage(A.mazeRoomMark(MS, g.room, t), X, Y); else { try { x.globalAlpha = 0.8; x.drawImage(A.room(g.room, MS, 0, 1, t), X, Y); x.globalAlpha = 1; } catch (e) { x.globalAlpha = 1; } } }
  if (g.use === 'kin' && !g.room) { x.save(); x.strokeStyle = 'rgba(90,216,196,.35)'; x.lineWidth = 2; x.setLineDash([4, 4]); x.strokeRect(X + 6, Y + 6, MS - 12, MS - 12); x.restore(); }
  if (g.use === 'trap') mzTrapDraw(x, g.trap, X, Y, MS, t);
}
// 길: 입구에서 알까지 칸 가운데를 잇는 점선. 부서질 바위에는 금
function mzPathDraw(x, cells, breaks, t, tail, warp) {
  if (!cells || cells.length < 1) return;
  if (warp && warp.some(Boolean)) { const segs = [[]]; cells.forEach((c, i) => { if (warp[i]) segs.push([]); segs[segs.length - 1].push(c); }); segs.forEach((sg, j) => { if (!sg.length) return; const last = j === segs.length - 1; if (j === 0) mzPathDraw(x, sg, breaks, t, last ? tail : []); else mzPathSeg(x, sg, breaks, t, last ? tail : []); }); return; }
  const pts = [[2, -1]].concat(cells.map(c => [c % 5, Math.floor(c / 5), breaks.includes(c)]), (tail || []).map(q => [q.x / MS - 0.5, (q.y - MTOP) / MS - 0.5]));
  if (mzFn('mazePath')) { LAIRART.mazePath(x, pts, MS, t, 'walk', { oy: MTOP }); breaks.forEach(b => { const i = cells.indexOf(b); if (i < 0) return; const seg = [i > 0 ? cells[i - 1] : 2, b, cells[i + 1] != null ? cells[i + 1] : b].map((c, k) => (k === 0 && i === 0 ? [2, -1] : [c % 5, Math.floor(c / 5), c === b])); LAIRART.mazePath(x, seg, MS, t, 'break', { oy: MTOP }); }); return; }
  x.save(); x.strokeStyle = '#ffb060'; x.lineWidth = 3; x.setLineDash([6, 6]); x.lineDashOffset = -t * 40; x.beginPath(); pts.forEach(([q, r], i) => { const px = q * MS + MS / 2, py = MTOP + r * MS + MS / 2; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); x.restore();
  breaks.forEach(b => { x.save(); x.strokeStyle = '#ff8a40'; x.lineWidth = 2; const cx = mzCx(b), cy = mzCy(b); x.beginPath(); x.moveTo(cx - 14, cy - 12); x.lineTo(cx, cy); x.lineTo(cx + 12, cy - 6); x.moveTo(cx, cy); x.lineTo(cx - 4, cy + 14); x.stroke(); x.restore(); });
}
// 순간 이동 뒤의 길: 입구에서 잇지 않고 입구 아래 칸에서 새로 시작한다
function mzPathSeg(x, cells, breaks, t, tail) {
  const pts = cells.map(c => [c % 5, Math.floor(c / 5), breaks.includes(c)]).concat((tail || []).map(q => [q.x / MS - 0.5, (q.y - MTOP) / MS - 0.5])); if (pts.length < 2) return;
  if (mzFn('mazePath')) { LAIRART.mazePath(x, pts, MS, t, 'walk', { oy: MTOP }); return; }
  x.save(); x.strokeStyle = '#ffb060'; x.lineWidth = 3; x.setLineDash([6, 6]); x.lineDashOffset = -t * 40; x.beginPath(); pts.forEach(([q, r], i) => { const px = q * MS + MS / 2, py = MTOP + r * MS + MS / 2; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); x.restore();
}
// 삼키는 구멍 → 입구 아래: 옆으로 휘는 보라 점선 화살 하나
function mzWarpDraw(x, from, to, now) {
  const ax = mzCx(from), ay = mzCy(from), bx = mzCx(to), by = mzCy(to) + 10, side = (from % 5) < 2 ? -1 : (from % 5) > 2 ? 1 : (from % 2 ? 1 : -1), cx = (ax + bx) / 2 + side * MS * 1.15, cy = (ay + by) / 2;
  x.save(); x.lineCap = 'round'; x.strokeStyle = '#0c0812'; x.lineWidth = 5; x.globalAlpha = 0.7; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(cx, cy, bx, by); x.stroke();
  x.globalAlpha = 1; x.strokeStyle = '#c89cff'; x.lineWidth = 2.5; x.setLineDash([5, 5]); x.lineDashOffset = -now / 40; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(cx, cy, bx, by); x.stroke(); x.setLineDash([]);
  const dx = bx - cx, dy = by - cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; x.fillStyle = '#c89cff'; x.strokeStyle = '#0c0812'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx + ux * 2, by + uy * 2); x.lineTo(bx - ux * 11 - uy * 7, by - uy * 11 + ux * 7); x.lineTo(bx - ux * 11 + uy * 7, by - uy * 11 - ux * 7); x.closePath(); x.stroke(); x.fill();
  x.restore(); MZ.dbg.warpArrow = (MZ.dbg.warpArrow || 0) + 1;
}
// 갈림길 표지: 미끼에 끌린 곳은 호박빛 불씨, 헛갈린 곳은 보라 물음표 (칸 오른쪽 위)
function mzMarkDraw(x, cell, kind, now) {
  const X = (cell % 5) * MS + MS - 13, Y = MTOP + Math.floor(cell / 5) * MS + 13, pulse = 0.75 + 0.25 * Math.sin(now / 220);
  x.save(); x.fillStyle = '#0c0812'; x.beginPath(); x.arc(X, Y, 9.5, 0, 6.2832); x.fill(); x.lineWidth = 2; x.strokeStyle = kind === 'lure' ? '#ffc860' : '#c89cff'; x.stroke();
  if (kind === 'lure') { x.globalAlpha = pulse; x.fillStyle = '#ffc860'; x.beginPath(); x.moveTo(X, Y - 6); x.quadraticCurveTo(X + 5, Y, X, Y + 5); x.quadraticCurveTo(X - 5, Y, X, Y - 6); x.fill(); x.fillStyle = '#fff3c8'; x.fillRect(X - 1, Y - 1, 2, 4); }
  else { x.fillStyle = '#e8d8ff'; x.font = '700 13px "Nest Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', X, Y + 1); }
  x.restore(); MZ.dbg.marks = (MZ.dbg.marks || 0) + 1;
}
// 길잡이의 길: 희미한 흰 선. 길잡이가 쓰러질 수 있는 방에는 흰 테
function mzScoutDraw(x, cells, lostAt, now) {
  if (mzFn('mazeScout')) { LAIRART.mazeScout(x, [[2, -1]].concat(cells.map(c => [c % 5, Math.floor(c / 5)])), MS, (now % 3000) / 3000, { ox: -10, oy: MTOP }); x.save(); x.strokeStyle = '#e8f0ff'; x.lineWidth = 2; x.globalAlpha = 0.6 + 0.3 * Math.sin(now / 200); lostAt.forEach(c => { x.strokeRect((c % 5) * MS + 5.5, MTOP + Math.floor(c / 5) * MS + 5.5, MS - 11, MS - 11); }); x.restore(); MZ.dbg.scout = cells.length; return; }
  const pts = [[mzCx(2), MTOP / 2]].concat(cells.map(c => [mzCx(c), mzCy(c)])); x.save(); x.globalAlpha = 0.55; x.strokeStyle = '#e8f0ff'; x.lineWidth = 2; x.setLineDash([2, 5]); x.lineDashOffset = -now / 80; x.beginPath(); pts.forEach(([px, py], i) => { if (i) x.lineTo(px - 6, py); else x.moveTo(px - 6, py); }); x.stroke();
  x.setLineDash([]); x.globalAlpha = 0.6 + 0.3 * Math.sin(now / 200); lostAt.forEach(c => { x.strokeRect((c % 5) * MS + 5.5, MTOP + Math.floor(c / 5) * MS + 5.5, MS - 11, MS - 11); }); x.restore(); MZ.dbg.scout = cells.length;
}
// 되돌아가는 구간: 같은 칸을 두 번 지나는 데는 곁에 겹선을 긋고, 길 위에 가는 쪽을 가리키는 화살
function mzBackDraw(x, cells, back, now) {
  if (!cells || cells.length < 2) return;
  if (mzFn('mazeBack')) { const t = (now % 3000) / 3000; let run = null; const flush = () => { if (run && run.length > 1) { LAIRART.mazeBack(x, run.map(c => [c % 5, Math.floor(c / 5)]), MS, t, { oy: MTOP }); MZ.dbg.back = (MZ.dbg.back || 0) + run.length - 1; } run = null; }; for (let i = 1; i < cells.length; i++) { if (back[i]) { if (!run) run = [cells[i - 1]]; run.push(cells[i]); } else flush(); } flush(); return; } const k = (now % 1600) / 1600; x.save();
  for (let i = 1; i < cells.length; i++) {
    const a = cells[i - 1], b = cells[i], ax = mzCx(a), ay = mzCy(a), bx = mzCx(b), by = mzCy(b), L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L, bk = !!back[i];
    const ox = bk ? -uy * 7 : 0, oy = bk ? ux * 7 : 0;
    if (bk) { x.strokeStyle = '#2a0e06'; x.lineWidth = 4; x.setLineDash([5, 4]); x.lineDashOffset = now / 50; x.beginPath(); x.moveTo(ax + ox, ay + oy); x.lineTo(bx + ox, by + oy); x.stroke(); x.strokeStyle = '#ffcf8a'; x.lineWidth = 2; x.stroke(); MZ.dbg.back = (MZ.dbg.back || 0) + 1; }
    if (bk || i % 2 === 0) { const mx = ax + (bx - ax) * (0.35 + 0.3 * k) + ox, my = ay + (by - ay) * (0.35 + 0.3 * k) + oy, s = bk ? 6 : 5; x.setLineDash([]); x.fillStyle = bk ? '#ffcf8a' : '#ffb050'; x.strokeStyle = '#2a0e06'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(mx + ux * s, my + uy * s); x.lineTo(mx - ux * s - uy * s, my - uy * s + ux * s); x.lineTo(mx - ux * s + uy * s, my - uy * s - ux * s); x.closePath(); x.fill(); x.stroke(); }
  }
  x.restore();
}
// 방의 권속: 셋까지 작은 그림으로 (본체 방은 둘)
const MZUSPOT = [[0.28, 0.66], [0.72, 0.66], [0.5, 0.36]];
// 지도 밖의 띠: 흙 바탕, 출구에서 내려가는 굴, 본체 방, 잇는 굴, 알의 방. 방은 격자 칸과 다른 틀 (돌테 + 빛)
function mzRRect(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
function mzFloorFill(x, X, Y, W, H, r, seed) {
  x.save(); mzRRect(x, X, Y, W, H, r); x.clip();
  if (mzFn('mazeFloor')) { for (let yy = Y - (Y - MGY) % MS; yy < Y + H; yy += MS) for (let xx = 0; xx < MW; xx += MS) x.drawImage(LAIRART.mazeFloor(MS, 15, 'room', seed + xx / MS), xx, yy); } else { x.fillStyle = '#16282c'; x.fillRect(X, Y, W, H); }
  x.restore();
}
function mzBandDraw(x, t, lit) {
  const Y = MGY; if (mzFn('mazeRock')) { for (let yy = Y; yy < MH; yy += MS) for (let xx = 0; xx < MW; xx += MS) x.drawImage(LAIRART.mazeRock(MS, 15, 200 + xx / MS + yy), xx, yy); } else { x.fillStyle = '#120e16'; x.fillRect(0, Y, MW, MBAND); }
  const ex = mzCx(MZEXIT), my = MZCR.y + MZCR.h / 2;
  // 굴: 출구 밑에서 본체 방으로, 본체 방에서 알의 방으로
  mzFloorFill(x, ex - 13, Y - 4, 26, MZCR.y - Y + 14, 6, 1); mzFloorFill(x, MZCR.x + MZCR.w - 10, my - 12, MZER.x - MZCR.x - MZCR.w + 20, 24, 6, 2);
  x.save(); x.strokeStyle = 'rgba(90,216,196,.35)'; x.lineWidth = 1; mzRRect(x, ex - 13.5, Y - 4.5, 27, MZCR.y - Y + 14, 6); x.stroke(); x.restore();
  // 본체 방
  mzFloorFill(x, MZCR.x, MZCR.y, MZCR.w, MZCR.h, 12, 5);
  x.save(); mzRRect(x, MZCR.x + 1.5, MZCR.y + 1.5, MZCR.w - 3, MZCR.h - 3, 12); x.lineWidth = 3; x.strokeStyle = '#2a2436'; x.stroke(); x.lineWidth = 1; x.strokeStyle = lit === 'core' ? '#fff3a0' : 'rgba(90,216,196,' + (0.5 + 0.2 * Math.sin(t * 6.2832)).toFixed(2) + ')'; mzRRect(x, MZCR.x + 4.5, MZCR.y + 4.5, MZCR.w - 9, MZCR.h - 9, 9); x.stroke(); x.restore();
  // 알의 방
  mzFloorFill(x, MZER.x, MZER.y, MZER.w, MZER.h, 14, 9);
  x.save(); mzRRect(x, MZER.x + 1.5, MZER.y + 1.5, MZER.w - 3, MZER.h - 3, 14); x.lineWidth = 3; x.strokeStyle = '#2a2436'; x.stroke(); x.lineWidth = 1; x.strokeStyle = 'rgba(180,140,255,' + (0.45 + 0.25 * Math.sin(t * 6.2832 + 1)).toFixed(2) + ')'; mzRRect(x, MZER.x + 4.5, MZER.y + 4.5, MZER.w - 9, MZER.h - 9, 11); x.stroke(); x.restore();
}
// 본체 방의 본체(크게, 바닥에 발을 딛고)와 권속 둘
function mzCoreDraw(x, core, now, alpha) {
  if (typeof LAIRART !== 'undefined' && LAIRART.boss) { try { const st = core && core.step != null ? core.step : 0, form = core && core.form ? core.form : 'drop', h = typeof lrBossH === 'function' ? lrBossH(st ? form : 'drop', st) : LAIRART.boss(form, st), fr = h.frame('idle', now), sz = 84, X = Math.round(MZCR.x + 68 - sz / 2), Y = Math.round(MZCR.y + MZCR.h - 4 - sz * 0.92); x.drawImage(fr, X, Y, sz, sz); } catch (e) { /* 그림 없이 */ } }
  ((core && core.units) || []).forEach((u, i) => { const sp = MZCORE_SPOTS[i]; if (!sp) return; const ic = mzIconCv(u.kind, u.star, 32); if (!ic) return; const px = Math.round(sp[0] - 16), py = Math.round(sp[1] - 30); x.save(); if (alpha && alpha[u.uid]) x.globalAlpha = 0.35; x.fillStyle = 'rgba(5,4,10,.5)'; x.beginPath(); x.ellipse(sp[0], sp[1], 12, 4, 0, 0, 6.2832); x.fill(); x.drawImage(ic, px, py); if (u.star > 1) { x.fillStyle = u.star >= 3 ? '#ffd040' : '#e8e8f0'; for (let k = 0; k < u.star; k++) x.fillRect(px + 9 + k * 5, py + 32, 4, 3); } x.restore(); MZ.dbg.units++; });
}
function mzEggRoomDraw(x, hp, max, t, shake) {
  const crack = Math.max(0, Math.min(4, Math.floor((1 - hp / max) * 5))), cx = MZER.x + MZER.w / 2 + (shake ? Math.sin(t * 60) * 3 : 0), cy = MZER.y + MZER.h / 2;
  if (mzFn('mazeEgg')) { const e = LAIRART.mazeEgg(MS, crack, t), sz = Math.min(MZER.w + 6, e.width); x.drawImage(e, Math.round(cx - sz / 2), Math.round(cy - sz / 2), sz, sz); return; }
  x.save(); x.fillStyle = '#0a0612'; x.strokeStyle = '#6a4ab0'; x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy, 26, 34, 0, 0, 6.2832); x.fill(); x.stroke(); x.strokeStyle = '#e9e2cf'; x.lineWidth = 1; for (let k = 0; k < crack; k++) { x.beginPath(); x.moveTo(cx - 12 + k * 6, cy - 22); x.lineTo(cx - 6 + k * 6, cy); x.lineTo(cx - 10 + k * 6, cy + 18); x.stroke(); } x.restore();
}
function mzWarpFxDraw(x, wf, k) {
  x.save();
  if (k < 0.6) { const a = Math.min(1, k * 4) * (k < 0.5 ? 1 : (0.6 - k) * 10), cx = mzCx(wf.from), cy = mzCy(wf.from); x.globalAlpha = a; x.strokeStyle = '#c89cff'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(cx, cy, (MS * 0.42) * (1 - ((k * 3 + i / 3) % 1)), k * 20 + i * 2, k * 20 + i * 2 + 4); x.stroke(); } }
  if (k >= 0.5) { const q = (k - 0.5) * 2, cx = mzCx(wf.to), cy = mzCy(wf.to); x.globalAlpha = 1 - q; x.fillStyle = '#6a5a48'; for (let i = 0; i < 9; i++) { const ang = -Math.PI / 2 + (i - 4) * 0.35, d = q * MS * 0.55; x.fillRect(Math.round(cx + Math.cos(ang) * d), Math.round(cy + Math.sin(ang) * d + q * q * 16), 3, 3); } x.strokeStyle = '#c89cff'; x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy + 12, 8 + q * 18, 3 + q * 5, 0, 0, 6.2832); x.stroke(); }
  x.restore();
}
function mzUnitsDraw(x, grid, c, units, alpha) {
  const X = (c % 5) * MS, Y = MTOP + Math.floor(c / 5) * MS, spots = MZUSPOT;
  units.forEach((u, i) => { const sp = spots[i]; if (!sp) return; const ic = mzIconCv(u.kind, u.star, 30); if (!ic) return; const px = Math.round(X + sp[0] * MS - 15), py = Math.round(Y + sp[1] * MS - 18); x.save(); if (alpha != null) x.globalAlpha = alpha; x.fillStyle = 'rgba(5,4,10,.5)'; x.beginPath(); x.ellipse(px + 15, py + 28, 11, 4, 0, 0, 6.2832); x.fill(); x.drawImage(ic, px, py); if (u.star > 1) { x.fillStyle = u.star >= 3 ? '#ffd040' : '#e8e8f0'; for (let s = 0; s < u.star; s++) x.fillRect(px + 9 + s * 5, py + 30, 4, 3); } x.restore(); MZ.dbg.units++; });
}
const MZTAIL = () => [{ x: mzCx(MZEXIT), y: MZCR.y + MZCR.h / 2 }, { x: MZER.x + 16, y: MZCR.y + MZCR.h / 2 }, mzPt('egg')];
function mzRender(now) {
  const cv = $('mz-cv'), x = cv.getContext('2d'), M = MZ.M; if (!M) return; const P = MZ.play, v = MZ.v || mzView(), t = now / 1000, tf = (now % 3000) / 3000;
  const grid = P ? P.grid : v.grid;
  MZ.dbg = { fx: MZ.dbg.fx || null, units: 0, lit: [], path: 0, party: 0, dark: MZ.dbg.dark || 0, lostLab: MZ.dbg.lostLab || 0, scoutDown: MZ.dbg.scoutDown || 0, lureLab: MZ.dbg.lureLab || 0, confLab: MZ.dbg.confLab || 0, warp: MZ.dbg.warp || 0 };
  x.imageSmoothingEnabled = false; x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#050407'; x.fillRect(0, 0, MW, MH);
  if (mzFn('mazeEntrance')) { const e = LAIRART.mazeEntrance(MS, 5); x.drawImage(e, 0, MTOP - e.height); } else { const gr = x.createLinearGradient(0, 0, 0, MTOP); gr.addColorStop(0, '#3a3020'); gr.addColorStop(1, '#050407'); x.fillStyle = gr; x.fillRect(0, 0, MW, MTOP); x.fillStyle = '#ffd890'; x.fillRect(MS * 2 + 22, 0, 20, MTOP - 4); }
  for (let c = 0; c < 40; c++) mzCellDraw(x, grid, c, tf, 'drop');
  if (mzFn('mazeEntranceGlow')) x.drawImage(LAIRART.mazeEntranceGlow(MS, 5, tf), 0, MTOP);
  const selU = MZ.sel && MZ.sel.uid ? MZ.sel.uid : MZ.drag && MZ.drag.moved ? MZ.drag.uid : null, places = selU && !P ? mzPlaces(v, selU) : null;
  mzBandDraw(x, tf, places && places.core ? 'core' : null);
  // 부서지는 바위
  if (P && P.brk && P.brk.t1 > MZ.t) { const c = P.brk.cell, k = 1 - (P.brk.t1 - MZ.t) / P.brk.dur; x.save(); x.fillStyle = '#8a7a60'; for (let i = 0; i < 10; i++) { const a = i * 0.63, d = k * MS * 0.5; x.fillRect(Math.round(mzCx(c) + Math.cos(a) * d), Math.round(mzCy(c) + Math.sin(a) * d + k * k * 20), 4, 4); } x.restore(); }
  if (MZ.fx && MZ.fx.t1 > MZ.t) { const f = MZ.fx, k = 1 - (f.t1 - MZ.t) / f.dur, X = (f.cell % 5) * MS, Y = MTOP + Math.floor(f.cell / 5) * MS; x.save();
    x.globalAlpha = 0.4 * (1 - k); x.fillStyle = '#fff3c8'; x.fillRect(X, Y, MS, MS); x.globalAlpha = 1;
    if (f.kind === 'dig') { x.fillStyle = '#8a7a60'; for (let i = 0; i < 12; i++) { const a = i * 0.52 + 0.2, d = k * MS * 0.55; x.globalAlpha = 1 - k; x.fillRect(Math.round(X + MS / 2 + Math.cos(a) * d), Math.round(Y + MS / 2 + Math.sin(a) * d + k * k * 18), 4, 4); } }
    else { const q = Math.min(1, k * 1.7), sc = 1.6 - 0.6 * q; if (f.img) { x.globalAlpha = Math.min(1, k * 2.5); const w = MS * sc; x.drawImage(f.img, Math.round(X + (MS - w) / 2), Math.round(Y + (MS - w) / 2), Math.round(w), Math.round(w)); } if (k > 0.55) { x.globalAlpha = (1 - k) * 2; x.strokeStyle = '#e8dcc0'; x.lineWidth = 2; x.beginPath(); x.ellipse(X + MS / 2, Y + MS * 0.62, MS * (0.3 + (k - 0.55) * 0.6), MS * (0.1 + (k - 0.55) * 0.2), 0, 0, 6.2832); x.stroke(); } }
    x.restore(); }
  // 다음 일행의 길 (준비 때): 출구에서 본체 방을 지나 알까지. 본체·알 그림 아래에
  if (!P && v.next && MZ.phase === 'prep') { if (v.next.scout && v.next.scoutPath && v.next.scoutPath.length) mzScoutDraw(x, v.next.scoutPath, v.next.lostAt || [], now); mzPathDraw(x, v.next.path, v.next.breaks, tf, v.next.path[v.next.path.length - 1] === MZEXIT ? MZTAIL() : [], v.next.warp); (v.next.warps || []).forEach(w => mzWarpDraw(x, w.from, w.to, now)); Array.from(new Set(v.next.lured || [])).forEach(c => mzMarkDraw(x, c, 'lure', now)); Array.from(new Set(v.next.confused || [])).forEach(c => mzMarkDraw(x, c, 'conf', now)); mzBackDraw(x, v.next.path, v.next.back || [], now); MZ.dbg.path = v.next.path.length; }
  // 고른 권속을 놓을 수 있는 곳: 판 통로, 자리가 남은 권속 방, 본체 방
  if (places) { places.cells.forEach(c => { MZ.dbg.lit.push(c); const X = (c % 5) * MS, Y = MTOP + Math.floor(c / 5) * MS; x.save(); x.globalAlpha = 0.18 + 0.12 * Math.sin(now / 160); x.fillStyle = '#5ad8c4'; x.fillRect(X + 3, Y + 3, MS - 6, MS - 6); x.globalAlpha = 1; x.strokeStyle = MZ.hover === c ? '#fff3a0' : '#5ad8c4'; x.lineWidth = 2; x.strokeRect(X + 3.5, Y + 3.5, MS - 7, MS - 7); x.restore(); });
    if (places.core) { MZ.dbg.lit.push('core'); x.save(); x.globalAlpha = 0.16 + 0.1 * Math.sin(now / 160); x.fillStyle = '#5ad8c4'; mzRRect(x, MZCR.x + 3, MZCR.y + 3, MZCR.w - 6, MZCR.h - 6, 10); x.fill(); x.restore(); } }
  mzCoreDraw(x, v.core, now, P && P.dead);
  mzEggRoomDraw(x, P ? P.egg : v.egg.hp, v.egg.max, t, P && P.eggHit > MZ.t);
  // 권속
  for (let c = 0; c < 40; c++) { const g = v.grid[c]; if (!g.units || !g.units.length) continue; mzUnitsDraw(x, grid, c, g.units.map(u => ({ uid: u.uid, kind: u.kind, star: u.star })), P && P.dead && g.units.every(u => P.dead[u.uid]) ? 0.35 : null); }
  // 진화의 터짐
  if (MZ.burst && MZ.burst.t1 > MZ.t) { const b = MZ.burst, k = 1 - (b.t1 - MZ.t) / 700, bp = mzPt(b.cell); x.save(); x.strokeStyle = '#ffd040'; x.globalAlpha = 1 - k; x.lineWidth = 3; x.beginPath(); x.arc(bp.x, bp.y, 10 + k * 40, 0, 6.2832); x.stroke(); x.restore(); }
  // 칸 고르기 표시
  if (MZ.sheet && typeof MZ.sheet.cell === 'number') { const c = MZ.sheet.cell, X = (c % 5) * MS, Y = MTOP + Math.floor(c / 5) * MS; x.save(); x.strokeStyle = '#fff3a0'; x.lineWidth = 2; x.setLineDash([5, 3]); x.lineDashOffset = -now / 60; x.strokeRect(X + 2.5, Y + 2.5, MS - 5, MS - 5); x.restore(); }
  // 함정의 번쩍임
  if (P && P.flash && P.flash.t1 > MZ.t) { const c = P.flash.cell, k = (P.flash.t1 - MZ.t) / P.flash.dur; x.save(); x.globalAlpha = 0.55 * k; x.fillStyle = P.flash.col; x.fillRect((c % 5) * MS, MTOP + Math.floor(c / 5) * MS, MS, MS); x.restore(); }
  // 일행 표식
  if (P && P.pos && !P.done) {
    const px = Math.round(MS * 0.66), kinds = P.alive.map(p => p.kind), n = kinds.length;
    if (n) {
      const wf = P.warpFx, wk = wf ? Math.min(1, (MZ.t - wf.t0) / wf.dur) : 0, wq = Math.max(0, (wk - 0.5) * 2), wsc = !wf ? 1 : wk < 0.5 ? 1 - wk * 2 : Math.min(1, wq * 1.5) * (1 + 0.25 * Math.sin(wq * Math.PI)); if (wf) mzWarpFxDraw(x, wf, wk);
      const im = mzFn('mazeParty') ? LAIRART.mazeParty(px, kinds, n, tf * 4) : null; x.save(); x.translate(Math.round(wf && wk >= 0.5 ? mzCx(wf.to) : P.pos.x), Math.round(wf && wk >= 0.5 ? mzCy(wf.to) : P.pos.y)); if (wf) { x.rotate(wk < 0.5 ? wk * 12 : 0); x.scale(Math.max(0.01, wsc), Math.max(0.01, wsc)); } if (P.back) x.scale(-1, 1);
      if (im) x.drawImage(im, -Math.round(im.width / 2), -Math.round(im.height / 2)); else { const ic = mzIconCv(kinds[0], 1, px); x.fillStyle = '#e08a30'; x.beginPath(); x.arc(0, 0, px / 2, 0, 6.2832); x.fill(); if (ic) x.drawImage(ic, -px / 2, -px / 2); }
      x.restore(); MZ.dbg.party = n; MZ.dbg.back = P.back ? (MZ.dbg.back || 0) + 1 : MZ.dbg.back;
      const sum = (f, g) => P.alive.reduce((a, p) => a + (g(p) ? f(p) : 0), 0), mh = sum(p => p.mhp, () => 1), hp = sum(p => Math.max(0, p.hp), () => 1), ms = sum(p => p.msan, p => p.msan), sn = sum(p => Math.max(0, p.san), p => p.msan);
      const w = px - 6, bx = Math.round(P.pos.x - w / 2), by = Math.round(P.pos.y + px / 2 - 2), H = ms ? 8 : 5; if (wf) x.globalAlpha = 0; x.fillStyle = '#0c0812'; x.fillRect(bx - 1, by - 1, w + 2, H);
      x.fillStyle = '#3a1416'; x.fillRect(bx, by, w, 3); x.fillStyle = '#e85040'; x.fillRect(bx, by, Math.round(w * hp / Math.max(1, mh)), 3);
      if (ms) { x.fillStyle = '#2a1a48'; x.fillRect(bx, by + 3, w, 3); x.fillStyle = '#b08fff'; x.fillRect(bx, by + 3, Math.round(w * sn / ms), 3); } x.globalAlpha = 1;
      if (!n) MZ.dbg.party = 0;
    }
  }
  // 막은 뒤: 방마다 쓰러뜨린 수의 꼬리표
  if (MZ.tags && MZ.tags.t1 > MZ.t) MZ.tags.list.forEach(q => { const qp = mzPt(q.cell), X = qp.x, Y = q.cell === 'core' ? MZCR.y + 10 : qp.y - MS * 0.42; x.save(); x.globalAlpha = Math.min(1, (MZ.tags.t1 - MZ.t) / 500); x.fillStyle = '#0c0812'; x.fillRect(X - 15, Y - 9, 30, 17); x.fillStyle = q.n ? '#ffd040' : '#6a6478'; x.fillRect(X - 14, Y - 8, 28, 15); x.fillStyle = '#0c0812'; x.font = '700 12px "Nest Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('×' + q.n, X, Y); x.restore(); MZ.dbg.tags = (MZ.dbg.tags || 0) + 1; });
}

// 고른 권속을 놓을 수 있는 곳: { cells, core }. 대기석의 권속인데 더 세울 수 없으면 비어 있다
function mzPlaces(v, uid) {
  const M = MZ.M, w = MAZE.whereOf(M, uid), fromBench = !w || w.bench != null, full = fromBench && v.placed >= v.cap, out = { cells: [], core: false, full };
  if (full) return out;
  v.grid.forEach(g => { if (!g.dug || g.canPlace === false) return; const here = (g.units || []).some(u => u.uid === uid); if (g.use === 'path' || (g.use === 'kin' && ((g.units || []).length < g.max || here))) out.cells.push(g.cell); });
  const C = v.core; out.core = !!C && (C.units.length < C.max || C.units.some(u => u.uid === uid)); return out;
}
function mzSelect(uid) {
  MZ.sel = { uid }; mzSay('click'); const v = MZ.v || mzView(), pl = mzPlaces(v, uid);
  if (pl.full) mzToast('더 세울 수 없다 (' + v.cap + ')'); else if (!pl.cells.length && !pl.core) mzToast('놓을 곳이 없다. 바위를 판다');
}
// ---- 누르기 ----
function mzCellAt(cx, cy) { const r = $('mz-cv').getBoundingClientRect(), x = (cx - r.left) / MZ.k, y = (cy - r.top) / MZ.k; const inB = B => x >= B.x && x < B.x + B.w && y >= B.y && y < B.y + B.h; if (inB(MZCR)) return 'core'; if (inB(MZER)) return 'egg'; const gy = y - MTOP; if (x < 0 || x >= MW || gy < 0 || gy >= MS * 8) return -1; return Math.floor(gy / MS) * 5 + Math.floor(x / MS); }
function mzClick(e) {
  // 폰에서 손을 떼어 창을 연 바로 뒤에 오는 click 은 창 바깥(어둠)에 떨어진다: 막 연 창은 닫지 않는다
  if (e.target.id === 'mz-sheet' && MZ.sheet && MZ.sheet.kind !== 'result' && MZ.sheet.kind !== 'over') { if (performance.now() - (MZ.sheetT || 0) < 450) return; return mzSheetClose(); }
  // 칸을 손가락으로 눌러 연 창: 손을 뗀 그 자리에 따라오는 click 하나가 막 뜬 창의 단추(대기석, 팔기 …)를 누르지 않게 버린다. 다른 자리를 누르는 것은 바로 받는다
  { const g = MZ.sheetPtr; if (g && e.target.closest('#mz-sheet') && performance.now() - g.t < 600 && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 14) { MZ.sheetPtr = null; e.preventDefault(); e.stopPropagation(); return; } }
  const b = e.target.closest('[data-m]'); if (!b || b.disabled) return; const a = b.dataset.m, M = MZ.M;
  if (a === 'menu') { mzSay('click'); return mzSheet({ kind: 'menu' }); }
  if (a === 'close') return mzSheetClose();
  if (a === 'home') return mzHome();
  if (a === 'tog') { const k = b.dataset.v; META[k] = k === 'sound' ? META.sound === false : META[k] === false; try { saveMeta(); if (k === 'music' && typeof musicSet === 'function') musicSet(META.music); } catch (er) { /* 저장 없이 */ } return mzSheet({ kind: 'menu' }); }
  if (a === 'spd') { mzSpeedSet(+b.dataset.v); if (MZ.sheet && MZ.sheet.kind === 'menu') mzSheet({ kind: 'menu' }); if (MZ.phase === 'raid') mzRaidPanel(); return; }
  if (a === 'skip') return mzSkipAll();
  if (a === 'tutok') { MZ.tut++; return mzCoach(); }
  if (a === 'guideok') { const M = MZ.M; if (M && M.ui) { M.ui.guided = M.ui.guided || {}; M.ui.guided[mzGuideKey(M)] = 1; } mzSay('click'); mzSave(); return mzGuide(); }
  if (a === 'tutoff') { MZ.tut = -1; if (META) { META.mazeTut = 1; try { saveMeta(); } catch (er) { /* 저장 없이 */ } } $('mz-coach').hidden = true; return; }
  if (a === 'next') return mzNext();
  if (a === 'again') { mzSheetClose(); return mzOpen(null); }
  if (a === 'nightOpen') return mzNight();
  if (a === 'uinfo') return mzSheet({ kind: 'unit', kindId: b.dataset.k, star: +b.dataset.s || 1, uid: b.dataset.u ? +b.dataset.u : null });
  if (a === 'reward') { const r = typeof MAZE.takeReward === 'function' ? MAZE.takeReward(MZ.M, +b.dataset.i) : { ok: false, msg: '' }; if (!r.ok) { if (r.msg) mzToast(r.msg); return mzSheetClose(); } mzSay('up'); mzToast((r.picked && (LAIR.ROOM[r.picked.id] ? LAIR.ROOM[r.picked.id].name : MAZE.TRAP[r.picked.id] ? MAZE.TRAP[r.picked.id].name : '')) + ' · 0'); mzSheetClose(); return mzDraw(); }
  if (a === 'pinfo') return mzSheet({ kind: MZ.phase === 'raid' && MZ.play ? 'raidparty' : 'party' });
  if (MZ.phase !== 'prep') return;
  if (a === 'shopt') { MZ.shop = !MZ.shop; MZ.sel = null; mzSay('click'); return mzDraw(); }
  if (a === 'shop') { const i = +b.dataset.i; if (MZ.sel && MZ.sel.shop === i) return; MZ.sel = { shop: i }; mzSay('click'); return mzDraw(); }
  if (a === 'shopx') { MZ.sel = null; mzSay('click'); return mzDraw(); }
  if (a === 'shopinfo') return mzSheet({ kind: 'shop', i: +b.dataset.i });
  if (a === 'buy') return mzBuy(+b.dataset.i);
  if (a === 'reroll') { const r = MAZE.reroll(M); if (r.ok) mzSay('slide'); else mzToast(r.msg); return mzDraw(); }
  if (a === 'xp') { const r = MAZE.buyXp(M); if (r.ok) { mzSay(r.up ? 'up' : 'click'); if (r.up) mzToast('Lv ' + M.level); } else mzToast(r.msg); return mzDraw(); }
  if (a === 'raid') return mzRaid();
  const cell = MZ.sheet && MZ.sheet.cell;
  if (a === 'dig' || a === 'fill' || a === 'use' || a === 'room' || a === 'trap') { if (e.detail) MZ.sheetPtr = { t: performance.now(), x: e.clientX, y: e.clientY }; const v = MZ.v || mzView(), g = v.grid[cell], id = b.dataset.id;
    if (a === 'dig') return mzPend({ act: 'dig', key: 'dig', cell, cost: g.digCost, label: '판다 · ' + g.digCost });
    if (a === 'fill') return mzPend({ act: 'fill', key: 'fill', cell, cost: 0, label: '메운다 · +' + g.fillGold });
    if (a === 'use') { const u = b.dataset.u; MZ.sheet.view = u; if (u === g.use || u === 'trap') { if (MZ.pend && MZ.pend.act === 'use') MZ.pend = null; mzSay('click'); return mzSheet(MZ.sheet); } return mzPend({ act: 'use', key: u, u, cell, cost: 0, label: '바꾼다 · 진액 0' }); }
    if (a === 'room') { if (g.use === 'kin' && g.room === id) return; const c = mzFree(v, id) ? 0 : v.costs.room; return mzPend({ act: 'room', key: id, id, cell, cost: c, label: '깐다 · 진액 ' + c }); }
    if (g.use === 'trap' && g.trap === id) return; const q = v.traps.find(t => t.id === id), c = mzFree(v, id) ? 0 : q && q.cost != null ? q.cost : v.costs.trap; return mzPend({ act: 'trap', key: id, id, cell, cost: c, label: '깐다 · 진액 ' + c }); }
  if (a === 'no') { MZ.pend = null; mzSay('click'); return MZ.sheet ? mzSheet(MZ.sheet) : null; }
  if (a === 'ok') return mzConfirm();
  if (a === 'tobench') { const r = MAZE.move(M, +b.dataset.u, { bench: null }); if (!r.ok) return mzToast(r.msg); mzSay('click'); mzDraw(); return MZ.sheet && MZ.sheet.kind === 'core' ? mzSheet({ kind: 'core' }) : cell != null ? mzSheet({ kind: 'cell', cell }) : mzSheetClose(); }
  if (a === 'sell') { const r = MAZE.sell(M, +b.dataset.u); if (!r.ok) return mzToast(r.msg); mzSay('coin'); MZ.sel = null; mzDraw(); return MZ.sheet && MZ.sheet.kind === 'core' ? mzSheet({ kind: 'core' }) : cell != null ? mzSheet({ kind: 'cell', cell }) : mzSheetClose(); }
  if (a === 'pick') { mzSheetClose(); mzSelect(+b.dataset.u); return mzDraw(); }
}
function mzBuy(i) {
  const M = MZ.M, r = MAZE.buy(M, i); if (!r.ok) { mzToast(r.msg); return mzDraw(); }
  mzSay('coin'); MZ.sel = null; MZ.shop = false; mzSheetClose(); (r.merged || []).forEach(m => mzMergePop(m)); mzDraw();
}
// 셋이 하나로: 대기석 칸이나 지도의 방에서 터진다
function mzMergePop(m) {
  MZ.pops[m.uid] = MZ.t + 900; mzSay('combo'); const w = MAZE.whereOf(MZ.M, m.uid); if (w && w.cell != null) MZ.burst = { cell: w.cell, t1: MZ.t + 700 };
  mzToast(LAIR.KIN[m.kind].name + ' ' + '★'.repeat(m.star)); MZ.merges = (MZ.merges || 0) + 1;
}
function mzDown(e) {
  if (MZ.phase !== 'prep' || MZ.sheet) return; const slot = e.target.closest('.mz-slot'), onCv = e.target.id === 'mz-cv'; if (!slot && !onCv) return;
  let uid = null, cell = -1;
  if (slot) uid = slot.dataset.u ? +slot.dataset.u : null; else { cell = mzCellAt(e.clientX, e.clientY); uid = cell === 'core' || cell >= 0 ? mzUnitNear(cell, e.clientX, e.clientY) : null; }
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
    if (slot) return mzMoveTo(d.uid, { bench: +slot.dataset.bench }); if (el && el.closest('#mz-shop')) { const r = MAZE.sell(M, d.uid); if (r.ok) mzSay('coin'); return mzDraw(); } if (cell === 'core') return mzMoveTo(d.uid, { core: true }); if (cell === 'egg') { mzToast('알의 방에는 세울 수 없다'); return mzDraw(); } if (cell >= 0) return mzMoveTo(d.uid, { cell }); return mzDraw();
  }
  // 누르기
  if (d.bench != null) { if (MZ.sel && MZ.sel.uid && MZ.sel.uid !== d.uid) return mzMoveTo(MZ.sel.uid, { bench: d.bench }); if (d.uid) { if (MZ.sel && MZ.sel.uid === d.uid) MZ.sel = null; else mzSelect(d.uid); } return mzDraw(); }
  const cell = d.cell; if (cell === -1) { MZ.sel = null; return mzDraw(); }
  if (MZ.sel && MZ.sel.uid) { if (cell === 'egg') { mzToast('알의 방에는 세울 수 없다'); return; } return mzMoveTo(MZ.sel.uid, cell === 'core' ? { core: true } : { cell }, true); }
  MZ.sheetPtr = { t: performance.now(), x: e.clientX, y: e.clientY }; mzSay('click'); MZ.shop = false; $('mz-shop').hidden = true; if (cell === 'core' || cell === 'egg') return mzSheet({ kind: cell }); mzSheet({ kind: 'cell', cell });
}
// 방 안에서 누른 자리에 가장 가까운 권속 (그림의 자리 MZUSPOT 대로)
function mzUnitNear(cell, cx, cy) {
  const v = MZ.v || mzView(); if (cell === 'core') { const us = v.core ? v.core.units : [], r = $('mz-cv').getBoundingClientRect(), x = (cx - r.left) / MZ.k, y = (cy - r.top) / MZ.k; let best = null, bd = 1e9; us.forEach((u, i) => { const q = MZCORE_SPOTS[i]; if (!q) return; const d = Math.hypot(q[0] - x, q[1] - 14 - y); if (d < bd && d < 40) { bd = d; best = u.uid; } }); return best; }
  const here = (v.grid[cell] && v.grid[cell].units || []).map(u => u.uid); if (!here.length) return null; const r = $('mz-cv').getBoundingClientRect(), x = (cx - r.left) / MZ.k - (cell % 5) * MS, y = (cy - r.top) / MZ.k - MTOP - Math.floor(cell / 5) * MS, sp = MZUSPOT;
  let best = here[here.length - 1], bd = 1e9; here.forEach((uid, i) => { const q = sp[i]; if (!q) return; const d = Math.hypot(q[0] * MS - x, q[1] * MS - 6 - y); if (d < bd) { bd = d; best = uid; } }); return best;
}
// keep: 실패해도 고른 것을 그대로 둔다 (다른 칸을 눌러 볼 수 있게)
function mzMoveTo(uid, to, keep) { const r = MAZE.move(MZ.M, uid, to); if (r.ok) { mzSay(to.bench != null ? 'click' : 'thud'); MZ.sel = null; const w = MAZE.whereOf(MZ.M, uid); if (w && (w.cell != null || w.core)) MZ.burst = { cell: w.core ? 'core' : w.cell, t1: MZ.t + 500 }; } else { mzToast(r.msg); if (!keep) MZ.sel = null; } mzDraw(); }

// ---- 아래에서 올라오는 창 ----
const mzFree = (v, id) => (v.free || []).some(q => q.id === id);
const mzSt = (k, n) => `<span class="mz-st"><small>${k}</small><b>${n}</b></span>`;
function mzUnitRow(u, cell) { return `<div class="mz-urow"><button class="mz-uin" data-m="uinfo" data-k="${u.kind}" data-s="${u.star}" data-u="${u.uid}"><img src="${mzIcon(u.kind, u.star, 36)}" alt=""><b>${esc(u.name)}</b>${mzStars(u.star)}</button><button data-m="pick" data-u="${u.uid}">옮기기</button><button data-m="tobench" data-u="${u.uid}">대기석</button><button data-m="sell" data-u="${u.uid}">팔기 ${u.sell}</button></div>`; }
function mzSheet(s) {
  if (!MZ.sheet || MZ.sheet.kind !== s.kind) MZ.sheetT = performance.now(); if (MZ.pend && (s.kind !== 'cell' || s.cell !== MZ.pend.cell)) MZ.pend = null; MZ.sheet = s; const el = $('mz-sheet'), v = MZ.v || mzView(); let h = '';
  if (s.kind === 'cell') {
    const g = v.grid[s.cell], pd = MZ.pend && MZ.pend.cell === s.cell ? MZ.pend : null, pk = (act, key) => (pd && pd.act === act && pd.key === key ? ' pick' : ''), pr = (act, key) => ` aria-pressed="${!!(pd && pd.act === act && pd.key === key)}"`;
    const lk = v.locks || {};
    if (!g.dug && lk.dig === false) h = `<h3>바위</h3><p class="mz-note">이 장에서는 아직 파지 않는다.</p>`;
    else if (!g.dug) h = `<h3>바위</h3><div class="mz-acts2"><button class="pri${pk('dig', 'dig')}" data-m="dig"${pr('dig', 'dig')}${g.canDig ? '' : ' disabled'}>파기 ${g.digCost}</button></div>${g.digWhy ? `<p class="mz-why">${esc(g.digWhy)}</p>` : ''}<p class="mz-note">판 칸 ${v.dug}/${v.dugCap}</p>`;
    else {
      const view = s.view || g.use, title = g.use === 'kin' ? (g.roomInfo ? g.roomInfo.name : '권속 방') : g.use === 'trap' ? g.trapInfo.name : '통로';
      h = `<h3>${esc(title)}</h3><div class="mz-uses">${[['path', '통로'], ['kin', '권속 방'], ['trap', '함정']].filter(q => q[0] !== 'trap' || v.traps.length).map(q => `<button data-m="use" data-u="${q[0]}" class="${view === q[0] ? 'on' : ''}${pk('use', q[0])}" aria-pressed="${view === q[0]}">${q[1]}</button>`).join('')}</div>`;
      if (view === 'kin') h += `${g.use === 'kin' ? `<p class="mz-note">권속 ${g.units.length}/${g.max}</p>${g.units.map(u => mzUnitRow(u, s.cell)).join('')}` : ''}${v.rooms.length ? `<h4>방 종류 · ${v.costs.room}</h4>` : ''}<div class="mz-grid">${v.rooms.map(r => `<button data-m="room" data-id="${r.id}" class="${g.use === 'kin' && g.room === r.id ? 'on' : ''}${mzFree(v, r.id) ? ' free' : ''}${pk('room', r.id)}"${pr('room', r.id)}><img src="${mzRoomIcon(r.id)}" alt=""><b>${esc(r.name)}${mzFree(v, r.id) ? ' · 0' : ''}</b><small>${esc(r.short)}</small></button>`).join('')}</div>`;
      if (view === 'trap') h += `<div class="mz-grid">${v.traps.map(q => `<button data-m="trap" data-id="${q.id}" class="${g.use === 'trap' && g.trap === q.id ? 'on' : ''}${mzFree(v, q.id) ? ' free' : ''}${pk('trap', q.id)}"${pr('trap', q.id)}><img src="${mzTrapIcon(q.id)}" alt=""><b>${esc(q.name)} · ${mzFree(v, q.id) ? 0 : q.cost != null ? q.cost : v.costs.trap}</b><small>${esc(q.short)}${mzSanTrap(q.id) ? ' · 겹치면 ½' : ''}</small></button>`).join('')}</div>${(MAZE.MK && MAZE.MK.trapSanFade) ? '<p class="mz-note">정신을 깎는 함정은 같은 일행에게 두 번째부터 절반, 세 번째부터 4분의 1만 깎는다.</p>' : ''}`;
      if (view === 'path' && v.traps.length) { const tc = v.traps.map(q => (q.cost != null ? q.cost : v.costs.trap)), lo = Math.min.apply(null, tc), hi = Math.max.apply(null, tc); h += `<p class="mz-note">권속 방 0 · 함정 ${lo === hi ? lo : lo + '–' + hi}</p>`; }
      if (lk.dig !== false) h += `<div class="mz-acts2"><button class="${pk('fill', 'fill').trim()}" data-m="fill"${pr('fill', 'fill')}${g.canFill ? '' : ' disabled'}>메우기 +${g.fillGold}</button></div>${g.fillWhy ? `<p class="mz-why">${esc(g.fillWhy)}</p>` : ''}`;
    }
    // 확인 줄은 늘 창 아래에 자리를 잡아 둔다 (고르기 전에는 흐리게): 고를 때 단추가 밀려 손가락 밑으로 오지 않게
    if (!pd && !(lk.dig === false && (!g.dug || (!v.rooms.length && !v.traps.length)))) h += `<div class="mz-confirm idle"><div><button class="pri" data-m="ok" disabled>${g.dug ? '깐다' : '판다'}</button><button data-m="no" disabled>그만둔다</button></div></div>`;
    if (pd) { const can = !pd.cost || v.gold >= pd.cost; h += `<div class="mz-confirm">${mzPendInfo(pd, v)}<div><button class="pri" data-m="ok"${can ? '' : ' disabled'}>${esc(pd.label)}</button><button data-m="no">그만둔다</button></div>${can ? '' : '<p class="mz-why">진액이 모자란다</p>'}</div>`; }
  }
  if (s.kind === 'egg') h = `<h3>알의 방</h3><div class="mz-stats">${mzSt('알', v.egg.hp + '/' + v.egg.max)}</div>`;
  if (s.kind === 'core') { const C = v.core || { units: [], max: 2 }, sk = C.skill && LAIR.skillInfo ? LAIR.skillInfo(C.skill, C.skillLv || 1) : null, nm = mzFormName(C.form, C.realStep != null ? C.realStep : C.step, C.mixed); h = `<h3>본체 방</h3><div class="mz-shead"><img src="${mzBossUrl(C.form, C.realStep != null ? C.realStep : C.step, 64)}" alt=""><div><b>${esc(nm)}</b>${C.mixed ? `<small class="mz-mixed">섞인 몸 · ${esc(mzFormName(C.prev, 1))}</small>` : ''}${sk ? `<p class="mz-tags">${esc(sk.name)} Lv ${C.skillLv || 1} · ${esc(sk.short)}</p>` : ''}</div></div><p class="mz-note">권속 ${C.units.length}/${C.max}</p>${C.units.map(u => mzUnitRow(u, 'core')).join('')}`; }
  if (s.kind === 'shop') { const q = v.shop[s.i]; if (!q) return mzSheetClose(); h = mzUnitHtml(q) + `<div class="mz-acts2"><button class="pri" data-m="buy" data-i="${s.i}"${q.can ? '' : ' disabled'}>산다 ${q.cost}</button></div>`; }
  if (s.kind === 'unit') { const u = LAIR.unitInfo(s.kindId, s.star), w = s.uid != null ? MAZE.whereOf(MZ.M, s.uid) : null; h = mzUnitHtml(u) + (s.uid != null && MZ.phase === 'prep' ? `<div class="mz-acts2"><button data-m="pick" data-u="${s.uid}">옮기기</button>${w && w.cell != null ? `<button data-m="tobench" data-u="${s.uid}">대기석</button>` : ''}<button data-m="sell" data-u="${s.uid}">팔기 ${MAZE.sellValue(MZ.M.unit[s.uid])}</button></div>` : ''); }
  if (s.kind === 'party') { const n = v.next; if (!n) return mzSheetClose(); const sc = MAZE.SCOUTS || MAZE.AVOIDERS || []; const scu = mzScoutOf(n.party); h = `<h3>${esc(n.name)}</h3><p class="mz-note">${scu ? '길잡이 · ' + esc(scu.name) : '헤맨다'} · 걸음 ${n.len}${(n.back || []).some(Boolean) ? ' · 되돌아감 ' + n.back.filter(Boolean).length : ''}${n.breaks.length ? ' · 지름길 ' + n.breaks.length : ''}${n.avoided ? ' · 함정을 돌아감' : ''}${(n.warps || []).length ? ' · 삼킴 ' + n.warps.length : ''}${(n.lured || []).length ? ' · 끌림 ' + n.lured.length : ''}${(n.confused || []).length ? ' · 헛갈림 ' + n.confused.length : ''}</p><div class="mz-party">${n.party.map(p => `<div class="${sc.includes(p.kind) ? 'scout' : ''}"><img src="${mzIcon(p.kind, 1, 36)}" alt=""><b>${esc(p.name)}${sc.includes(p.kind) ? ' · 길잡이' : ''}</b><small>체력 ${p.hp}${p.noMad ? '' : ' · 정신 ' + p.san} · 알 −${p.egg}</small></div>`).join('')}</div>`; }
  if (s.kind === 'reward') { const R = v.reward; if (!R) return mzSheetClose(); h = `<h3>무료 하나</h3><div class="mz-rew">${R.opts.map(o => `<button data-m="reward" data-i="${o.i}"><img src="${o.type === 'room' ? mzRoomIcon(o.id) : mzTrapIcon(o.id)}" alt=""><b>${esc(o.name)}</b><small>${o.type === 'room' ? '방 종류' : '함정'} · ${esc(o.short)}</small><em>0</em></button>`).join('')}</div>`; }
  if (s.kind === 'raidparty') { const P = MZ.play; if (!P) return mzSheetClose(); h = `<h3>${esc(P.name)}</h3><div class="mz-party">${P.party.map(p => `<div class="${!p.alive ? 'dead' : p.mad ? 'mad' : ''}"><img src="${mzIcon(p.kind, 1, 36)}" alt=""><b>${esc(p.name)}${!p.alive ? ' · 쓰러짐' : p.mad ? ' · 미침' : p.out ? ' · 알' : ''}</b><small>체력 ${Math.max(0, Math.round(p.hp))}/${p.mhp}${p.msan ? ' · 정신 ' + Math.max(0, Math.round(p.san)) + '/' + p.msan : ''}</small></div>`).join('')}</div>`; }
  if (s.kind === 'menu') { const sp = MZSPD, cur = mzSpeed();
    h = `<h3>메뉴</h3><p class="mz-setrow"><span>효과음</span><button data-m="tog" data-v="sound" class="${META.sound !== false ? 'on' : ''}" aria-pressed="${META.sound !== false}">${META.sound !== false ? '켬' : '끔'}</button></p><p class="mz-setrow"><span>음악</span><button data-m="tog" data-v="music" class="${META.music !== false ? 'on' : ''}" aria-pressed="${META.music !== false}">${META.music !== false ? '켬' : '끔'}</button></p><p class="mz-setrow"><span>빠르기</span><span class="mz-spd">${sp.map(q => `<button data-m="spd" data-v="${q[0]}" class="${cur === q[0] ? 'on' : ''}">${q[1]}</button>`).join('')}</span></p><div class="mz-acts2"><button data-m="home">처음으로</button><button class="pri" data-m="close">돌아간다</button></div>`; }
  if (s.kind === 'result') h = mzResultHtml();
  if (s.kind === 'over') h = mzOverHtml();
  const modal = s.kind === 'result' || s.kind === 'over';
  el.innerHTML = `<div class="mz-sbody${modal ? ' res' : ''}">${modal ? '' : '<button class="mz-x" data-m="close" aria-label="닫기">✕</button>'}${h}</div>`; el.hidden = false; $('mz-coach').hidden = true; mzUnder(true); { const cf = el.querySelector('.mz-confirm'); if (cf && cf.scrollIntoView) cf.scrollIntoView({ block: 'nearest' }); } mzCoach();
}
// 창이나 싸움 다시 보기가 떠 있는 동안 밑의 지도는 읽는 이에게 가린다
function mzUnder(on) { ['mz-bar', 'mz-main'].forEach(id => { const e = $(id); if (!e) return; if (on) e.setAttribute('aria-hidden', 'true'); else e.removeAttribute('aria-hidden'); }); }
function mzUnitHtml(u) { return `<div class="mz-shead"><img src="${mzIcon(u.kind, u.star, 64)}" alt=""><div><h3>${esc(u.name)} ${mzStars(u.star)}</h3><p class="mz-tags">${esc(u.roleName)} · ${esc(u.reach)} · 값 ${u.cost}</p><p class="mz-tags"><img src="${mzSym(u.asp, 16)}" alt="">${esc(u.aspName)}</p></div></div><div class="mz-stats">${mzSt('체력', u.hp)}${mzSt('공격', u.atk)}${mzSt('방어', u.df)}${mzSt('닿는 칸', u.range)}</div><div class="mz-skill"><b>${esc(u.skill.name)}</b><span>${esc(u.skill.short)}</span><p>${esc(u.skill.more)}</p></div>`; }
function mzSheetClose() { MZ.pend = null; MZ.sheet = null; $('mz-sheet').hidden = true; mzUnder(false); mzCoach(); }

// ---- 길잡이: 첫 판에만 넷 ----
function mzCoach() { if (MZ.M && MZ.M.mode === 'story') return mzGuide(); mzCoachNow(); clearTimeout(MZ.coachRe); MZ.coachRe = setTimeout(mzCoachNow, 230); }
function mzCoachNow() {
  const c = $('mz-coach'); if (!c) return; const M = MZ.M; let avoid = [];
  const off = () => { c.hidden = true; $('mz-ring').hidden = true; MZ.coachAt = null; };
  if (MZ.tut < 0 || MZ.tut >= MZTUT.length || MZ.phase !== 'prep' || !M) return off();
  if (MZ.sheet && !(MZTUT[MZ.tut] && MZTUT[MZ.tut].key === 'dig' && MZ.sheet.kind === 'cell')) return off();
  const v = MZ.v || mzView();
  if (MZ.tut === 0 && (Object.keys(M.unit).length || v.placed)) MZ.tut = 1;
  if (MZ.tut === 1 && v.placed) MZ.tut = 2;
  if (MZ.tut === 2 && v.dug > MZ.dug0) MZ.tut = 3;
  if (MZ.tut >= MZTUT.length) return off();
  const st = MZTUT[MZ.tut]; let at = null;
  let text = st.text;
  if (st.key === 'dig') { if (MZ.sheet) { const b = mq(MZ.pend && MZ.pend.act === 'dig' ? '#mz-sheet [data-m="ok"]' : '#mz-sheet [data-m="dig"]'); if (b) { at = b.getBoundingClientRect(); text = MZ.pend && MZ.pend.act === 'dig' ? '값을 보고 「판다」를 누른다.' : '「파기」를 누른다.'; } } else { const g = v.grid.find(q => q.canDig); if (g) at = mzCellRect(g.cell); } }
  if (st.key === 'shop') { if (MZ.shop && MZ.sel && MZ.sel.shop != null) { const b = mq('#mz-shop [data-m="buy"]'), pn = mq('#mz-shop .mz-spanel'); if (pn) avoid.push(pn.getBoundingClientRect()); if (b) { at = b.getBoundingClientRect(); text = '「산다」를 누르면 산다.'; } } else if (MZ.shop) { const b = mq('#mz-shop .mz-cards'); if (b) { at = b.getBoundingClientRect(); text = '카드를 누르면 설명이 뜬다.'; } } else { const b = mq('#mz-bench [data-m="shopt"]'); if (b) at = b.getBoundingClientRect(); } }
  if (st.key === 'place') { if (MZ.sel && MZ.sel.uid) { const pl = mzPlaces(v, MZ.sel.uid); if (pl.cells.length) at = mzCellRect(pl.cells[Math.min(1, pl.cells.length - 1)]); else if (pl.core) at = mzCellRect('core'); } else { const b = mq('#mz-bench .mz-slot.has'); if (b) at = b.getBoundingClientRect(); } }
  if (st.key === 'raid') { const b = mq('#mz-bench [data-m="raid"]'); if (b) at = b.getBoundingClientRect(); }
  if (!at) return off();
  mzCoachPut(c, at, `<p>${esc(text)}</p><span>${st.ok ? '<button data-m="tutok">알았다</button>' : ''}<button data-m="tutoff">안내 끄기</button></span>`, avoid);
}
// 말풍선 자리: 대상이 위쪽이면 아래, 아래쪽이면 위. 둘 다 안 되면 맨 위 띠 밑(대상이 거기면 맨 아래)에 한 줄 띠로
function mzCoachPut(c, at, html, avoid) {
  const vw = window.innerWidth, vh = window.innerHeight, top0 = ($('mz-bar').getBoundingClientRect().bottom || 44) + 4, G = 12, ring = $('mz-ring');
  Object.assign(ring.style, { left: Math.round(at.left - 4) + 'px', top: Math.round(at.top - 4) + 'px', width: Math.round(at.width + 8) + 'px', height: Math.round(at.height + 8) + 'px' }); ring.hidden = false;
  if (c.dataset.h !== html) { c.innerHTML = html; c.dataset.h = html; } c.className = ''; c.hidden = false; const cw = Math.min(248, vw - 16); c.style.width = cw + 'px'; const ch = c.offsetHeight || 60, cx = at.left + at.width / 2;
  let x = Math.max(8, Math.min(vw - cw - 8, cx - cw / 2)), y = null, cls = '';
  const fitB = at.bottom + G + ch <= vh - 4, fitA = at.top - G - ch >= top0, wantB = at.top + at.height / 2 < vh / 2, clear = yy => !(avoid || []).some(r => !(x + cw <= r.left || x >= r.right || yy + ch <= r.top || yy >= r.bottom));
  const opts = (wantB ? [['down', fitB, at.bottom + G], ['up', fitA, at.top - G - ch]] : [['up', fitA, at.top - G - ch], ['down', fitB, at.bottom + G]]).filter(q => q[1]), pick = opts.find(q => clear(q[2])) || opts[0];
  if (pick) { cls = pick[0]; y = pick[2]; }
  if (y == null) { x = 8; c.style.width = (vw - 16) + 'px'; y = at.top < top0 + ch + 8 ? vh - c.offsetHeight - 4 : top0; cls = 'strip'; }
  c.className = cls; c.style.left = Math.round(x) + 'px'; c.style.top = Math.round(y) + 'px'; c.style.setProperty('--ax', Math.round(Math.max(14, Math.min((cls === 'strip' ? vw - 16 : cw) - 14, cx - x))) + 'px');
  MZ.coachAt = { left: at.left, top: at.top, right: at.left + at.width, bottom: at.top + at.height };
}
function mzCellRect(c) { const r = $('mz-cv').getBoundingClientRect(), k = MZ.k; if (c === 'core' || c === 'egg') { const B = c === 'core' ? MZCR : MZER; return { left: r.left + B.x * k, top: r.top + B.y * k, width: B.w * k, height: B.h * k, right: r.left + (B.x + B.w) * k, bottom: r.top + (B.y + B.h) * k }; } const x = r.left + (c % 5) * MS * k, y = r.top + (MTOP + Math.floor(c / 5) * MS) * k; return { left: x, top: y, width: MS * k, height: MS * k, right: x + MS * k, bottom: y + MS * k }; }

// ---- 침입 ----
// 걸음: 칸당 0.2초 (보통). 함정 0.8초, 바위 부수기 0.9초, 알 1.2초. 방의 싸움은 둥지 전투의 재생으로
const MZWALK = 0.2;
// 걷기와 같은 빠르기로 지도 밖의 굴을 걷는다
function mzTravelStep(P, dt) {
  const T = P.trav, sp = mzSpeed(); T.k += dt / 1000 * sp / (P.walkT || MZWALK); const i = Math.min(T.pts.length - 1, Math.floor(T.k)), f = Math.min(1, T.k - Math.floor(T.k)), a = i === 0 ? T.from : T.pts[i - 1], b = T.pts[i];
  P.pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; if (T.k < T.pts.length) return;
  P.pos = Object.assign({}, T.pts[T.pts.length - 1]); P.at = T.to; P.trav = null; P.cur = T.s; if (T.s.type === 'fight') mzFight(T.s); else { P.i--; mzStepNext(); }
}
const MZSPD = [[1, '보통'], [3, '빠르게'], [5, '아주 빠르게']];
function mzSpeedLoad() { const v = typeof META !== 'undefined' && META ? +META.mazeSpeed : 1; return MZSPD.some(q => q[0] === v) ? v : 1; }
const mzSpeed = () => MZ.speed || (MZ.speed = mzSpeedLoad());
function mzSpeedSet(v) { MZ.speed = MZSPD.some(q => q[0] === v) ? v : 1; try { if (META) { META.mazeSpeed = MZ.speed; saveMeta(); } } catch (e) { /* 저장 없이 */ } if (typeof LU !== 'undefined' && LU.replay) { LU.speed = MZ.speed; if (typeof lrFightPanel === 'function') lrFightPanel(); } }
function mzRaid() {
  const M = MZ.M; MZ.sel = null; mzSheetClose(); const v0 = mzView(), party = MAZE.partyOf(M), kinAt = {}; Object.keys(M.board).forEach(c => { kinAt[c] = M.board[c].slice(); });
  const res = MAZE.raid(M); if (!res.ok) return mzToast(res.msg);
  if (M.mode === 'story') mzStoryQueue(M, res.next, v0.raid);
  if (MZ.tut === 3) { MZ.tut = MZTUT.length; if (META) { META.mazeTut = 1; try { saveMeta(); } catch (e) { /* 저장 없이 */ } } }
  mzSave();
  const nWalk = res.steps.reduce((a, q) => a + (q.type === 'walk' ? q.cells.length : 0), 0);
  MZ.play = { walkT: nWalk > 24 ? Math.max(0.15, MZWALK * 24 / nWalk) : MZWALK, lureSet: new Set(res.result.lured || []), confSet: new Set(res.result.confused || []), marked: {}, steps: res.steps, i: -1, res, grid: v0.grid.map(g => ({ dug: g.dug, use: g.use, room: g.room, trap: g.trap })), egg: v0.egg.hp, eggHit: 0, gold0: v0.gold, raidNo: v0.raid, pos: { x: mzCx(2), y: MTOP / 2 }, party, alive: party.slice(), log: [], dead: {}, cur: null, wait: 0, skip: false, done: false, name: v0.next.name, fights: 0, traps: 0 };
  MZ.phase = 'raid'; mzMusic('night'); mzSay('night'); mzDraw(); mzStepNext();
}
function mzPartyApply(snap) { const P = MZ.play; if (!snap) return; snap.forEach(s => { const p = P.party[s.i]; if (p) Object.assign(p, { hp: s.hp, mhp: s.mhp, san: s.san, msan: s.msan, alive: s.alive, mad: s.mad, out: s.out }); }); P.alive = P.party.filter(p => p.alive && !p.mad && !p.out); }
function mzLog(text, cls, icon) { const P = MZ.play; P.log.push({ text, cls: cls || '', icon: icon || null }); if (P.log.length > 6) P.log.shift(); const el = $('mz-log'); if (el) el.innerHTML = mzLogHtml(); }
function mzLogHtml() { const P = MZ.play; return P ? P.log.slice(-3).reverse().map(l => `<p class="${l.cls}">${l.icon ? `<img src="${l.icon}" alt="">` : ''}<span>${esc(l.text)}</span></p>`).join('') : ''; }
const mzRoomName = (g, cell) => (cell === 'core' ? '본체 방' : g && g.room ? LAIR.ROOM[g.room].name : '권속 방');
function mzStepNext() {
  const P = MZ.play; if (!P || P.done) return; P.i++; const s = P.steps[P.i]; P.cur = s; P.t0 = MZ.t;
  if (!s) return mzRaidEnd();
  const sp = mzSpeed();
  if (s.type === 'warp') { const mo = typeof motionOk !== 'function' || motionOk(), dur = mo ? 1100 / sp : 0; P.pos = { x: mzCx(s.from), y: mzCy(s.from) }; P.warpFx = dur ? { from: s.from, to: s.to, t0: MZ.t, dur } : null; if (!dur) P.pos = { x: mzCx(s.to), y: mzCy(s.to) }; mzLog('삼켜져 입구로', 'trap', mzTrapIcon('tr_maw')); mzSay('die'); P.wait = MZ.t + dur + 200 / sp; MZ.dbg.warp = (MZ.dbg.warp || 0) + 1; return; }
  if (s.type === 'walk') { P.walk = { cells: s.cells, back: s.back || [], k: 0, n: 0, from: { x: P.pos.x, y: P.pos.y }, mad: s.mad || [] }; if (s.lost) mzScoutDown(); return; }
  if (s.type === 'trap') { const T = MAZE.trapInfo(s.id), hit = s.after.filter((a, i) => a.alive && (a.hp < s.before[i].hp || a.san < s.before[i].san || a.mad !== s.before[i].mad)).length; P.traps++; P.pos = { x: mzCx(s.cell), y: mzCy(s.cell) }; P.flash = { cell: s.cell, t1: MZ.t + 600 / sp, dur: 600 / sp, col: MZTRAPC[s.id] || '#ffffff' }; mzPartyApply(s.after); mzLabel(mzCx(s.cell), mzCy(s.cell) - 30, T.name + ' · ' + T.short, 'trap'); mzLog(T.name + ' · ' + hit, 'trap', mzTrapIcon(s.id)); mzSay('hit'); P.wait = MZ.t + 800 / sp; return; }
  if (s.type === 'break') { P.brk = { cell: s.cell, t1: MZ.t + 900 / sp, dur: 900 / sp }; P.grid[s.cell] = { dug: true, use: 'path', room: null, trap: null }; mzLabel(mzCx(s.cell), mzCy(s.cell) - 26, '지름길', 'brk'); mzLog('바위를 부수었다', 'brk'); mzSay('thud'); P.wait = MZ.t + 900 / sp; return; }
  if (s.type === 'egg' && mzTravel(P, 'egg', s)) return;
  if (s.type === 'egg') { const ep = mzPt('egg'); P.pos = { x: ep.x, y: ep.y - 20 }; P.egg = s.egg; P.eggHit = MZ.t + 900; mzLabel(mzPt('egg').x, mzPt('egg').y - 40, '알 −' + s.dmg, 'egg'); mzLog('알 −' + s.dmg, 'egg'); mzSay('die'); P.alive.forEach(p => { p.out = true; }); P.alive = []; mzRaidPanel(); mzDraw(); P.wait = MZ.t + 1200 / sp; return; }
  if (s.type === 'fight' && s.cell === 'core' && mzTravel(P, 'core', s)) return;
  if (s.type === 'fight') return mzFight(s);
  P.wait = MZ.t;
}
// 지도 밖으로: 출구 밑의 굴을 내려가 본체 방으로, 짧은 굴을 지나 알의 방으로. 다 걸으면 그 걸음(s)을 다시 연다
function mzTravel(P, to, s) {
  if (P.at === to) return false; const pts = [], ex = mzCx(MZEXIT), my = MZCR.y + MZCR.h / 2;
  if (P.at !== 'core') pts.push({ x: ex, y: MGY + 2 }, { x: ex, y: my }); if (to === 'core') pts.push(mzPt('core')); else pts.push({ x: MZER.x + 10, y: my }, mzPt('egg'));
  P.trav = { pts, k: 0, from: { x: P.pos.x, y: P.pos.y }, to, s }; P.cur = { type: 'travel' }; return true;
}
function mzFight(s) {
  const P = MZ.play, g = s.cell === 'core' ? null : P.grid[s.cell], name = mzRoomName(g, s.cell), sp = mzSpeed(), fp = mzPt(s.cell); P.pos = { x: fp.x, y: fp.y - 24 }; P.fights++;
  const go = () => {
    if (!MZ.play || MZ.play !== P || P.skip) return;
    const party = s.before.inv.filter(p => p.alive && !p.out).length;
    mzUnder(true); lairReplay(s.fight, { name, sub: g && g.room && LAIR.ROOM[g.room] ? LAIR.ROOM[g.room].short + ' · 일행 ' + party : '일행 ' + party + ' · 권속 ' + s.before.kin.length, form: s.fight.form, step: 0, speed: mzSpeed(), speeds: MZSPD, onSpeed: v => { mzSpeedSet(v); mzRaidPanel(); }, skip: mzSkipAll, done: () => { mzUnder(false); mzZoom(s.cell, false, () => { if (!MZ.play || MZ.play !== P) return; mzFightAfter(s); }); } });
  };
  mzZoom(s.cell, true, go, sp);
}
function mzFightAfter(s) {
  const P = MZ.play; mzPartyApply(s.after.inv); s.after.kin.forEach(k => { if (!k.alive) P.dead[k.uid] = 1; }); if (s.scoutDown) mzScoutDown(s.cell);
  const kills = s.after.inv.filter((a, i) => s.before.inv[i] && s.before.inv[i].alive && !a.alive).length, mads = s.after.inv.filter((a, i) => s.before.inv[i] && !s.before.inv[i].mad && a.mad).length;
  mzLog(mzRoomName(P.grid[s.cell], s.cell) + ' · 쓰러뜨림 ' + kills + (mads ? ' · 미침 ' + mads : ''), s.fight.result === 'win' ? 'win' : 'lose', s.core ? mzIcon('boss:' + (s.fight.form || 'drop') + ':1', 1, 24) : P.grid[s.cell] && P.grid[s.cell].room ? mzRoomIcon(P.grid[s.cell].room) : null);
  mzRaidPanel(); P.wait = MZ.t + 250; P.cur = { type: 'idle' };
}
// 방으로 다가가기: 칸의 상자가 화면 가득 넓어진 뒤 싸움을 연다. 돌아올 때는 거꾸로. 움직임을 끈 설정이면 곧바로
function mzZoom(cell, inn, cb) {
  const z = $('mz-zoom'); if (!(typeof motionOk !== 'function' || motionOk())) { z.hidden = true; cb(); return; }
  const r = mzCellRect(cell), full = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }, a = inn ? r : full, b = inn ? full : r;
  z.style.transition = 'none'; Object.assign(z.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', opacity: inn ? 0.4 : 1 }); z.hidden = false; void z.offsetWidth;
  const zt = Math.max(0.08, 0.28 / mzSpeed()).toFixed(2) + 's'; z.style.transition = ['left', 'top', 'width', 'height', 'opacity'].map(q => q + ' ' + zt + ' ease-in').join(', '); Object.assign(z.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', opacity: inn ? 1 : 0.2 });
  setTimeout(() => { z.hidden = true; cb(); }, Math.max(90, 300 / mzSpeed()));
}
function mzScoutDown(cell) { const P = MZ.play; if (!P || P.scoutDown) return; P.scoutDown = true; const c = cell != null ? cell : null, x = c != null ? mzCx(c) : P.pos.x, y = c != null ? mzCy(c) : P.pos.y; mzLabel(x, y - 40, '길잡이가 쓰러졌다', 'scout', 1800); mzSay('down'); MZ.dbg.scoutDown = 1; }
// 넘기기: 남은 걸음을 바로 결과로
function mzSkipAll() {
  const P = MZ.play; if (!P || P.done) return; P.skip = true;
  if (P.trav) { P.cur = P.trav.s; P.trav = null; } P.warpFx = null;
  if (typeof LU !== 'undefined' && LU.replay) { LU.replay.done = null; lrReplayEnd(); } mzUnder(false);
  $('mz-zoom').hidden = true; P.steps.forEach((s, i) => { if (i <= P.i && P.cur !== s) return; if (s.type === 'break') P.grid[s.cell] = { dug: true, use: 'path', room: null, trap: null }; if (s.type === 'trap' || s.type === 'fight') { if (s.type === 'trap') P.traps++; else P.fights++; mzPartyApply(s.type === 'trap' ? s.after : s.after.inv); } if (s.type === 'fight') s.after.kin.forEach(k => { if (!k.alive) P.dead[k.uid] = 1; }); if (s.type === 'egg') P.egg = s.egg; if (s.type === 'walk') (s.mad || []).forEach(i => { if (P.party[i]) P.party[i].mad = true; }); });
  P.i = P.steps.length; mzRaidEnd();
}
function mzRaidEnd() {
  const P = MZ.play; if (!P || P.done) return; P.done = true; P.egg = MZ.M.egg; mzSay(P.res.result.win ? 'up' : 'down'); mzMusic('day');
  { const by = {}; P.res.steps.filter(q => q.type === 'fight').forEach(q => { by[q.cell] = (by[q.cell] || 0) + q.after.inv.filter((a, i) => q.before.inv[i] && q.before.inv[i].alive && !a.alive).length; }); MZ.tags = { t1: MZ.t + 2600, list: Object.keys(by).map(c => ({ cell: c === 'core' ? 'core' : +c, n: by[c] })) }; }
  mzDraw(); mzSheet({ kind: MZ.M.phase === 'over' && MZ.M.mode !== 'story' ? 'over' : 'result' });
}
function mzRaidPanel() {
  const P = MZ.play; if (!P) return; const cur = mzSpeed(), sp = MZSPD;
  $('mz-raid').innerHTML = `<div class="mz-spd">${sp.map(q => `<button data-m="spd" data-v="${q[0]}" class="${cur === q[0] ? 'on' : ''}" aria-pressed="${cur === q[0]}">${q[1]}</button>`).join('')}<button data-m="skip">넘기기</button><button class="mz-ptyb" data-m="pinfo" aria-label="일행 ${P.alive.length}">${P.party.slice(0, 5).map(p => `<img class="${!p.alive ? 'dead' : p.mad ? 'mad' : p.out ? 'out' : ''}" src="${mzIcon(p.kind, 1, 20)}" alt="">`).join('')}</button></div>`;
}
function mzLabel(x, y, text, cls, ms) { const d = document.createElement('span'), k = MZ.k; d.className = 'mz-lab ' + (cls || ''); d.textContent = text; const base = ms || (cls === 'dark' ? 900 : 1300), dur = MZ.play && !MZ.play.done ? Math.max(cls === 'dark' ? 450 : 650, base / mzSpeed()) : base; d.style.animationDuration = dur + 'ms'; const hw = (text.length * 12 + 14) / 2; d.style.left = Math.max(hw, Math.min(MW * k - hw, x * k)) + 'px'; d.style.top = Math.max(24, y * k) + 'px'; $('mz-ov').appendChild(d); setTimeout(() => d.remove(), dur); }
function mzMazeMark(P, c) {
  if (P.marked[c]) return; if (P.lureSet.has(c)) { P.marked[c] = 1; if (MZ.t - (P.lureT || -1e9) < 1500) return; P.lureT = MZ.t; mzLabel(mzCx(c), mzCy(c) - 26, '불빛에 끌린다', 'lure'); mzLog('불빛에 끌린다', 'lure', mzTrapIcon('tr_lure')); MZ.dbg.lureLab = (MZ.dbg.lureLab || 0) + 1; }
  else if (P.confSet.has(c)) { P.marked[c] = 1; mzLabel(mzCx(c), mzCy(c) - 26, '헛갈린다', 'conf'); mzLog('헛갈린다', 'conf', mzTrapIcon('tr_mirror')); MZ.dbg.confLab = (MZ.dbg.confLab || 0) + 1; }
}
// 굴 속의 어둠: 한 칸마다 일행의 정신이 깎인다 (표식 곁의 작은 보라 숫자, 표식 아래의 정신 띠)
function mzDark(cell) {
  const P = MZ.play, d = (MAZE.MK && MAZE.MK.darkSan) || 0; if (!d || typeof cell !== 'number') return; let hit = 0;
  P.alive.forEach(p => { if (!p.msan) return; p.san = Math.max(0, p.san - d); hit++; }); if (!hit) return; P.dark = (P.dark || 0) + d; P.darkAcc = (P.darkAcc || 0) + d; MZ.dbg.dark = (MZ.dbg.dark || 0) + 1;
  if (MZ.t - (P.darkT || -1e9) < 170) return; mzLabel(P.pos.x + 22, P.pos.y - 10, '−' + P.darkAcc, 'dark'); P.darkAcc = 0; P.darkT = MZ.t; MZ.dbg.darkLab = (MZ.dbg.darkLab || 0) + 1;
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
    const W = P.walk; W.k += dt / 1000 * sp / (P.walkT || MZWALK); const i = Math.min(W.cells.length - 1, Math.floor(W.k)), f = Math.min(1, W.k - Math.floor(W.k)), a = i === 0 ? W.from : { x: mzCx(W.cells[i - 1]), y: mzCy(W.cells[i - 1]) }, b = { x: mzCx(W.cells[i]), y: mzCy(W.cells[i]) };
    P.pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    while (W.n < Math.min(W.cells.length, Math.floor(W.k) + 1)) { W.n++; mzDark(W.cells[W.n - 1]); mzMazeMark(P, W.cells[W.n - 1]); const bk = !!W.back[W.n - 1]; if (bk && !P.back) { P.lostN = (P.lostN || 0) + 1; mzLabel(mzCx(W.cells[W.n - 1]), mzCy(W.cells[W.n - 1]) - 26, '헤맨다', 'lost'); MZ.dbg.lostLab = (MZ.dbg.lostLab || 0) + 1; } P.back = bk; }
    if (W.n % 2 === 0 && W.n !== W.drawn) { W.drawn = W.n; mzRaidPanel(); }
    if (W.k >= W.cells.length) { P.back = false; mzDarkEnd(W); P.pos = { x: mzCx(W.cells[W.cells.length - 1]), y: mzCy(W.cells[W.cells.length - 1]) }; P.walk = null; mzStepNext(); }
    return;
  }
  if (s && s.type === 'travel' && P.trav) return mzTravelStep(P, dt);
  if (s && s.type === 'fight') return;
  if (P.warpFx && MZ.t >= P.warpFx.t0 + P.warpFx.dur) { P.pos = { x: mzCx(P.warpFx.to), y: mzCy(P.warpFx.to) }; P.warpFx = null; mzLabel(P.pos.x, P.pos.y - 30, '입구로 뱉어졌다', 'trap'); }
  if (MZ.t >= P.wait) mzStepNext();
}
function mzResultHtml() {
  const P = MZ.play, r = P.res.result, steps = P.res.steps, rows = steps.filter(s => s.type === 'fight').map(s => { const kills = s.after.inv.filter((a, i) => s.before.inv[i] && s.before.inv[i].alive && !a.alive).length, mads = s.after.inv.filter((a, i) => s.before.inv[i] && !s.before.inv[i].mad && a.mad).length, lost = s.after.kin.filter(k => !k.alive).length, g = s.cell === 'core' ? null : P.grid[s.cell];
    const best = (s.fight.breakdown || []).filter(b => b.side === 'nest' && !b.summon).sort((a, b) => (b.dmg + b.san) - (a.dmg + a.san))[0];
    return `<div class="mz-rrow"><img src="${s.core ? mzIcon('boss:' + (s.fight.form || 'drop') + ':1', 1, 32) : g && g.room ? mzRoomIcon(g.room) : mzIcon(best ? best.kind : 'shell', 1, 32)}" alt=""><div><b>${esc(mzRoomName(g, s.cell))}</b><small>${['쓰러뜨림 ' + kills, mads ? '미침 ' + mads : '', lost ? '잃음 ' + lost : '', best && best.kind !== 'core' && LAIR.KIN[best.kind] ? LAIR.KIN[best.kind].name + ' ' + Math.round(best.dmg + best.san) : ''].filter(Boolean).join(' · ')}</small></div></div>`; }).join('');
  const traps = steps.filter(s => s.type === 'trap'), tline = traps.length ? `<p class="mz-note">${traps.map(s => MAZE.TRAP[s.id].name).join(' · ')}</p>` : '';
  const n = MZ.v && MZ.v.next;
  return `<h3 class="${r.win ? 'win' : 'lose'}">${r.win ? '막아 냈다' : '알이 깎였다 ' + r.eggLost}</h3><p class="mz-nar">${esc(r.win ? MZNAR.win : MZNAR.hurt)}</p><p class="mz-sum"><span class="g">진액 +${r.gold}</span>${r.eggLost ? `<span class="l">알 −${r.eggLost}</span>` : ''}${r.mads ? `<span class="m">미침 ${r.mads}</span>` : ''}${r.breaks ? `<span>지름길 ${r.breaks}</span>` : ''}${r.avoided ? '<span>함정을 돌아감</span>' : ''}</p>${rows ? `<h4>방</h4>${rows}` : ''}${tline}`
    + (n && MZ.M.mode !== 'story' ? `<div class="mz-nextp"><span>다음</span><b>${esc(n.name)}</b>${n.party.map(p => `<img src="${mzIcon(p.kind, 1, 28)}" alt="${esc(p.name)}">`).join('')}</div>` : '') + `<div class="mz-acts2"><button class="pri" data-m="next">${MZ.M.mode === 'story' ? '이어서' : '준비'}</button></div>`;
}
function mzOverHtml() {
  const M = MZ.M, win = !!(M.over && M.over.win), hist = M.hist.map(h => `<span class="${h.win ? 'w' : 'l'}">${h.raid} ${h.win ? '막음' : '알 −' + h.eggLost}</span>`).join('');
  return `<h3 class="${win ? 'win' : 'lose'}">${win ? '둥지는 남았다' : '알이 깨졌다'}</h3><p class="mz-nar">${esc(win ? MZNAR.end : MZNAR.fall)}</p><p class="mz-sum">${hist}</p><p class="mz-sum"><span>알 ${M.egg}/${M.eggMax}</span><span>Lv ${M.level}</span></p><div class="mz-acts2"><button class="pri" data-m="again">다시 한 판</button><button data-m="home">처음으로</button></div>`;
}
function mzNext() { if (MZ.M && MZ.M.mode !== 'story' && MZ.M.awaken) { mzSheetClose(); MZ.play = null; MZ.phase = 'prep'; $('mz-ov').innerHTML = ''; mzDraw(); return mzAwaken(); } if (MZ.M && MZ.M.mode === 'story') { mzSheetClose(); MZ.play = null; MZ.phase = 'prep'; $('mz-ov').innerHTML = ''; return mzStoryGo(); } mzSheetClose(); MZ.play = null; MZ.phase = 'prep'; $('mz-ov').innerHTML = ''; mzDraw(); mzSize(); const v = MZ.v; if (v && v.reward && v.reward.opts && v.reward.opts.length) mzSheet({ kind: 'reward' }); }
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
// ======== 본체의 깨어남 ========
const MZAW = typeof MAZEAWAKEN !== 'undefined' ? MAZEAWAKEN : null;
const MZFORMC = { abyss: '#4ab0d8', nebula: '#a88af0', brood: '#8ad050', dusk: '#e0905a', hunger: '#e05a5a', drop: '#c8c0d8' };
// 섞인 몸은 둘째 단계여도 첫째 이름 (온전히 자라지 않았다)
const mzFormName = (form, step, mixed) => { if (!form || form === 'drop' || !step) return '옛 것'; const A = MZAW && MZAW[form]; return A ? (step >= 2 && !mixed ? A.name2 : A.name1) : (LAIR.FORM[form] || {}).name || form; };
function mzBossUrl(form, step, px) { const k = 'boss:' + form + ':' + step + ':' + px; if (MZURL[k] == null) { try { MZURL[k] = typeof lrBossIcon === 'function' ? lrBossIcon(form, step, px).toDataURL() : ''; } catch (e) { MZURL[k] = ''; } } return MZURL[k]; }
function mzAwakenScene(r) { if (!MZAW) return []; const A = r.mixed ? MZAW.mixed : MZAW[r.form], sc = A && (r.step >= 2 ? A.scene2 : A.scene1); return sc ? [sc] : []; }
// 고르기: 위에 지금 본체, 카드 셋(다음 모습 그림 · 이름 · 한 줄 · 바뀌는 것). 누르면 설명 판, 「받아들인다」로 정한다
function mzAwaken() {
  const M = MZ.M, v = mzView(), A = v.awaken, el = mzReadMount(); if (!A) return mzAfterAwaken(); el.onclick = null; mzReadShow(el); el.className = 'awaken'; MZ.phase = 'awaken';
  const C = v.core, sel = MZ.awSel != null && A.offer[MZ.awSel] ? A.offer[MZ.awSel] : null; mzMusic('night');
  const card = o => { const tag = A.step >= 2 ? (o.keep ? '<em class="keep">그대로 키운다</em>' : '<em class="mix">갈아탄다 · 섞인 몸</em>') : '';
    return `<button class="mza-card${MZ.awSel === o.i ? ' on' : ''}" data-r="acard" data-i="${o.i}" aria-pressed="${MZ.awSel === o.i}" style="--fc:${MZFORMC[o.form] || '#fff'}"><img src="${mzBossUrl(o.form, o.step, 56)}" alt=""><span><b>${esc(mzFormName(o.form, o.step, o.mixed))}</b>${tag}<small>${esc(((MZAW && MZAW[o.form]) || {})['short' + Math.min(2, o.step)] || '')}</small><i>${esc(mzAwLine(o))}</i></span></button>`; };
  el.innerHTML = `<div class="mza-top"><canvas id="mza-cv" width="120" height="120" role="img" aria-label="${esc(mzFormName(C.form, C.realStep))}"></canvas><div><small>깨어남 · ${A.step}단계</small><b>${esc(mzFormName(C.form, C.realStep, C.mixed))}</b><span>모습 하나를 고른다</span></div></div>`
    + `<div class="mza-cards">${A.offer.map(card).join('')}</div>`
    + (sel ? `<div class="mza-info">${mzAwInfo(sel, A)}</div><div class="mz-confirm mza-ok"><div><button class="pri" data-r="aok">받아들인다</button><button data-r="ano">그만둔다</button></div></div>` : `<div class="mz-confirm mza-ok idle"><div><button class="pri" disabled>받아들인다</button><button disabled>그만둔다</button></div></div>`);
  mzAwDraw(C.form, C.realStep, null, 0); MZ.dbgRead = { awaken: A.step, offer: A.offer.map(o => o.form), sel: MZ.awSel };
  el.onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; const a = b.dataset.r;
    if (a === 'acard') { mzSay('click'); const i = +b.dataset.i; MZ.awSel = MZ.awSel === i ? null : i; MZ.awT = performance.now(); mzAwaken(); const inf = el.querySelector('.mza-ok'); if (inf && inf.scrollIntoView) inf.scrollIntoView({ block: 'nearest' }); return; }
    if (a === 'ano') { MZ.awSel = null; mzSay('click'); return mzAwaken(); }
    if (a === 'aok' && performance.now() - (MZ.awT || 0) > 250) return mzAwakenOk(); };
}
const mzPct = x => Math.round(x * 100) + '%';
// 카드의 한 줄: 기술 · 모습 권속 · 값 없는 방 · 상점 몫 · 신도
function mzAwLine(o) { const sk = LAIR.skillInfo ? LAIR.skillInfo(o.skill, o.skillLv) : null, kn = (o.kin || []).map(k => (LAIR.KIN[k] || {}).name).filter(Boolean); return [sk ? sk.name + ' Lv ' + o.skillLv + (o.t2 ? ' · 강화' : '') : '', kn.length ? '권속 ' + kn.join('·') : '', (o.room || []).map(r => (LAIR.ROOM[r] || {}).name + ' 0').join(' '), o.shop.map(q => (LAIR.ASPN ? LAIR.ASPN[q.asp] : q.asp) + ' ' + mzPct(q.share)).join(' · ')].filter(Boolean).join(' · '); }
function mzAwInfo(o, A) {
  const sk = LAIR.skillInfo ? LAIR.skillInfo(o.skill, o.skillLv) : null, kn = (o.kin || []).map(k => LAIR.KIN[k] ? LAIR.unitInfo(k, 1) : null).filter(Boolean), gift = o.gift && LAIR.KIN[o.gift] ? LAIR.KIN[o.gift].name : null;
  const rows = [sk ? `<p><b>${esc(sk.name)} Lv ${o.skillLv}</b> ${esc(sk.more || sk.short)}${o.t2 ? ' 둘째 깨어남으로 기술이 세진다.' : ''}</p>` : '',
    kn.length ? `<p><b>모습 권속</b> ${kn.map(u => esc(u.name) + ' (' + u.cost + ')').join(' · ')} · 상점에 드물게 ${mzPct(o.formKin || 0)}</p>` : '',
    (o.room || []).length ? `<p><b>값 없는 방</b> ${(o.room || []).map(r => esc((LAIR.ROOM[r] || {}).name || r)).join(' · ')}</p>` : '',
    `<p><b>상점 몫</b> ${o.shop.map(q => esc(LAIR.ASPN ? LAIR.ASPN[q.asp] : q.asp) + ' ' + mzPct(q.share)).join(' · ')}</p>`,
    `<p><b>받는 것</b> ${gift ? '신도 ' + esc(gift) + ' · ' : ''}알 +${o.egg} · 본체 방 자리 ${2 + (o.coreSlots || 0)}</p>`,
    A.step >= 2 && !o.keep ? `<p class="mza-lose">갈아타면 ${esc(mzFormName(o.prev, 1))}의 권속 하나와 몫 일부가 남고, 기술은 세지지 않는다.</p>` : ''];
  return `<div class="mza-hd"><img src="${mzBossUrl(o.form, o.step, 48)}" alt=""><b>${esc(mzFormName(o.form, o.step, o.mixed))}</b></div>${rows.join('')}`;
}
// 본체 그림 (위): 옛 → 떨림 → 번쩍 → 새
function mzAwDraw(form, step, to, k) {
  const cv = $('mza-cv'); if (!cv) return; const x = cv.getContext('2d'), W = cv.width; x.imageSmoothingEnabled = false; x.clearRect(0, 0, W, W);
  const draw = (f, st, dx) => { try { const fr = lrBossH(f, st).frame('idle', performance.now()); x.drawImage(fr, Math.round(dx), 0, W, W); } catch (e) { /* 그림 없이 */ } };
  if (!to || k < 0.55) { const sh = to ? Math.sin(k * 90) * 6 * Math.min(1, k * 2.5) : 0; draw(form, step, sh); }
  else draw(to.form, to.step, 0);
  if (to && k > 0.35 && k < 0.85) { x.fillStyle = '#fff6d8'; x.globalAlpha = 1 - Math.abs(k - 0.55) / 0.3; x.fillRect(0, 0, W, W); x.globalAlpha = 1; }
}
function mzAwakenOk() {
  const M = MZ.M, A = mzView().awaken, o = A && A.offer[MZ.awSel]; if (!o) return; const C = mzView().core, from = { form: C.form, step: C.realStep };
  const r = MAZE.awaken(M, MZ.awSel); if (!r.ok) return mzToast(r.msg); MZ.awSel = null; mzSay('up'); M.ui = M.ui || { guided: {} };
  M.ui.read = { q: 'awaken', form: r.form, step: r.step, mixed: !!r.mixed, ch: M.chapter || 0, s: 0, l: 0 }; mzSave(); MZ.dbgRead = { awakenDone: r.form, step: r.step, mixed: !!r.mixed, gift: r.gift };
  const el = $('mzr'); el.onclick = null; const top = el.querySelector('.mza-top'); el.innerHTML = ''; if (top) { el.appendChild(top); top.querySelector('b').textContent = mzFormName(r.form, r.step, r.mixed); top.querySelector('small').textContent = '깨어났다 · ' + r.step + '단계'; top.querySelector('span').textContent = r.gift && LAIR.KIN[r.gift] ? '신도 ' + LAIR.KIN[r.gift].name + ' · 알 +1' : '알 +1'; }
  el.className = 'awaken morph';
  if (!(typeof motionOk !== 'function' || motionOk())) { mzAwDraw(r.form, r.step, null, 0); return setTimeout(mzRead, 400); }
  const t0 = performance.now(), dur = 1200, step = () => { const k = Math.min(1, (performance.now() - t0) / dur); mzAwDraw(from.form, from.step, { form: r.form, step: r.step }, k); if (k < 1) return requestAnimationFrame(step); setTimeout(mzRead, 350); }; requestAnimationFrame(step);
}
// 깨어난 뒤: 이야기의 장 끝이면 다음 장으로, 아니면 지도로
function mzAfterAwaken() {
  const M = MZ.M; if (!M) return; if (M.ui) M.ui.read = null; MZ.awSel = null;
  if (M.mode === 'story') { if (M.phase === 'chapterEnd') { M.ui.read = { q: 'end', ch: M.chapter, s: 999, l: 0 }; return mzReadDone(); } return mzStoryGo(); }
  mzReadClose(); MZ.phase = 'prep'; mzSave(); mzDraw(); mzSize(); const v = MZ.v; if (v && v.reward && v.reward.opts && v.reward.opts.length) mzSheet({ kind: 'reward' });
}
// ======== 이야기 모드 ========
const MZST = typeof MAZESTORY !== 'undefined' ? MAZESTORY : null;
const mzChapName = n => (n === 0 ? '서장' : n + '장');
const MZACT = { raid: '습격', whisper: '속삭임', trade: '거래', hunt: '사냥' };
// 말한 이의 얼굴: 조사자 여섯은 그림, 다른 이는 이니셜 원
const MZFACE = { 에다: 'c_eda', '에다 볼크': 'c_eda', 로웬: 'c_rowen', '로웬 하스': 'c_rowen', 미렐: 'c_mirel', '미렐 수녀': 'c_mirel', 토브: 'c_tov', '토브 카인': 'c_tov', 이셀: 'c_isel', '이셀 드란': 'c_isel', 바스코: 'c_vasco', '늙은 바스코': 'c_vasco' };
const MZLOGWHO = { eda: ['에다', '에다 볼크'], rowen: ['로웬', '로웬 하스'], mirel: ['미렐', '미렐 수녀'], tov: ['토브', '토브 카인'], isel: ['이셀', '이셀 드란'], vasco: ['바스코', '늙은 바스코'] };
function mzEndsSeen() { return (META && Array.isArray(META.mazeEnds)) ? META.mazeEnds : []; }
function mzMetaSet(f) { try { if (META) { f(META); saveMeta(); } } catch (e) { /* 저장 없이 */ } }
function mzAskNew(mode) {
  const m = $('modal'); m.innerHTML = `<div class="sh-box mz-ask" role="dialog" aria-modal="true"><div class="sh-head"><h2>${mode === 'story' ? '이야기' : '자유'} 새로 시작</h2><button class="sh-x" data-z="mclose" aria-label="닫기">✕</button></div><div class="sh-body"><p>${mode === 'story' ? '이야기의' : '자유 판의'} 저장을 지운다. 다른 모드의 저장은 남는다.</p><div class="mz-row2"><button class="btn pri" data-z="newYes" data-mode="${mode}">지우고 시작</button><button class="btn" data-z="mclose">그만둔다</button></div></div></div>`; m.hidden = false;
}
// 기록: 조사자의 기록 조각. 그 조사자가 나오는 장에 닿으면 첫 조각, 그 장을 넘기면 둘째 조각
function mzLogFirst(key) { if (!MZST) return 99; const names = MZLOGWHO[key] || []; for (let c = 0; c < MZST.chapters.length; c++) { const C = MZST.chapters[c], groups = [C.start, C.end].concat(C.between || []); if (groups.some(g => (g || []).some(sc => (sc.who || []).some(w => names.includes(w)) || sc.lines.some(l => l.who && names.includes(l.who))))) return c; } return 99; }
function mzLogsHtml() {
  if (!MZST || !MZST.logs) return '<p>없다.</p>'; const reach = META && META.mazeReach != null ? META.mazeReach : -1;
  return Object.keys(MZST.logs).map(k => { const at = mzLogFirst(k), parts = MZST.logs[k], kind = MZFACE[(MZLOGWHO[k] || [])[0]], nm = kind && LAIR.INV && LAIR.INV[kind] ? LAIR.INV[kind].name : k;
    const open = parts.filter((t, i) => reach >= at + i); return `<div class="mz-log1"><div class="mz-loghd">${kind ? `<img src="${mzIcon(kind, 1, 28)}" alt="">` : ''}<b>${open.length ? esc(nm) : '아직 모른다'}</b><small>${open.length}/${parts.length}</small></div>${open.map(t => `<p class="mz-lognote">${esc(t)}</p>`).join('')}</div>`; }).join('');
}
function mzStoryNew() { const M = MAZE.newStory((Date.now() % 1000000) + 1); M.ui = { guided: {}, read: { q: 'start', ch: 0, i: 0, s: 0, l: 0, card: 1 } }; mzMetaSet(m => { m.mazeReach = Math.max(m.mazeReach != null ? m.mazeReach : -1, 0); }); mzOpen(M); mzStoryGo(); }
function mzStoryResume(M) { M.ui = M.ui || { guided: {} }; mzOpen(M); mzStoryGo(); }
// 침입 하나가 끝나면 그 뒤에 읽을 묶음: 침입 사이 장면(없으면 곧바로 밤 / 준비), 장 끝, 알이 깨진 장의 다시, 결말
function mzStoryQueue(M, next, raidNo) {
  const ch = M.chapter; M.ui = M.ui || { guided: {} };
  if (next === 'over') { M.ui.read = M.over && M.over.ending ? { q: 'ending', ch, key: M.over.ending, s: 0, l: 0 } : { q: 'retry', ch, s: 0, l: 0 }; return; }
  if (next === 'chapterEnd') { M.ui.read = { q: 'end', ch, s: 0, l: 0 }; return; }
  const B = MZST && MZST.chapters[ch] && MZST.chapters[ch].between ? MZST.chapters[ch].between[raidNo - 1] : null; M.ui.read = B && B.length ? { q: 'between', ch, i: raidNo - 1, s: 0, l: 0 } : null;
}
function mzScenes(r) { if (!MZST || !r) return []; const C = MZST.chapters[r.ch] || {}; if (r.q === 'start') return C.start || []; if (r.q === 'end') return C.end || []; if (r.q === 'between') return (C.between || [])[r.i] || []; if (r.q === 'retry') return MZST.retry || []; if (r.q === 'ending') return (MZST.endings[r.key] || {}).scenes || []; if (r.q === 'awaken') return mzAwakenScene(r); return []; }
const mzReadKey = r => r.q + ':' + (r.q === 'awaken' ? r.form + ':' + r.step + (r.mixed ? 'm' : '') : r.ch + ':' + (r.q === 'between' ? r.i : r.q === 'ending' ? r.key : ''));
// 다음에 할 것: 읽을 것이 있으면 읽기, 밤이면 밤의 한 수, 아니면 지도
function mzStoryGo() {
  const M = MZ.M; if (!M || M.mode !== 'story') return; M.ui = M.ui || { guided: {} }; mzSave();
  if (M.ui.read) return mzRead();
  mzReadClose(); if (M.awaken) return mzAwaken(); if (M.night) return mzNight();
  if (M.phase === 'over' || M.phase === 'chapterEnd') { mzStoryQueue(M, M.phase === 'over' ? 'over' : 'chapterEnd', M.raid); return mzRead(); }
  MZ.phase = 'prep'; mzDraw(); mzSize(); const v = MZ.v; if (v && v.reward && v.reward.opts && v.reward.opts.length) mzSheet({ kind: 'reward' });
}
// 읽기를 다 마치면
function mzReadDone() {
  const M = MZ.M, r = M.ui.read; if (!r) return M.mode === 'story' ? mzStoryGo() : mzAfterAwaken(); mzMetaSet(m => { m.mazeSeen = m.mazeSeen || {}; m.mazeSeen[mzReadKey(r)] = 1; }); M.ui.read = null;
  if (r.q === 'awaken') return mzAfterAwaken();
  if (r.q === 'end' && M.awaken) return mzAwaken();
  if (r.q === 'end') { const x = MAZE.nextChapter(M); if (x.ok) { mzMetaSet(m => { m.mazeReach = Math.max(m.mazeReach != null ? m.mazeReach : -1, M.chapter); }); M.ui.read = { q: 'start', ch: M.chapter, s: 0, l: 0, card: 1 }; MZ.dug0 = MAZE.dugCount(M); } return mzStoryGo(); }
  if (r.q === 'retry') { const x = MAZE.retryChapter(M); M.ui = { guided: {}, read: x.ok ? { q: 'start', ch: M.chapter, s: 0, l: 0, card: 1 } : null }; MZ.dug0 = MAZE.dugCount(M); return mzStoryGo(); }
  if (r.q === 'ending') { const k = r.key; mzMetaSet(m => { m.mazeEnds = Array.from(new Set(mzEndsSeen().concat([k]))); m.mazeReach = Math.max(m.mazeReach != null ? m.mazeReach : -1, MZST.chapters.length); }); mzSaveDel('story'); return mzEndingCard(k); }
  return mzStoryGo();
}
// ---- 장면 읽기 ----
function mzReadMount() {
  let el = $('mzr'); if (el) return el; el = document.createElement('div'); el.id = 'mzr'; el.hidden = true; document.body.appendChild(el);
  el.addEventListener('click', e => { const b = e.target.closest('[data-r]'); return mzReadClick(b ? b.dataset.r : 'tap', b); });
  window.addEventListener('keydown', e => { if (el.hidden) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); mzReadClick('tap'); } if (e.key === 'Escape') mzReadClick('skipscene'); });
  return el;
}
function mzReadClose() { const el = $('mzr'); if (el) { el.hidden = true; el.innerHTML = ''; } MZ.reading = false; const m = $('mz'); if (m) m.removeAttribute('aria-hidden'); }
// 읽는 동안 뒤의 지도는 가려 둔다 (읽기 화면 밖으로 눌리지도, 읽히지도 않게)
function mzReadShow(el) { el.hidden = false; MZ.reading = true; const m = $('mz'); if (m) m.setAttribute('aria-hidden', 'true'); }
function mzRead() {
  const M = MZ.M, r = M.ui.read, el = mzReadMount(); el.onclick = null; mzReadShow(el); MZ.readT0 = performance.now(); mzMusic('title');
  if (r.card) { const C = MZST.chapters[r.ch] || {}; el.className = 'card'; el.innerHTML = `<div class="mzr-card"><small>${esc(mzChapName(r.ch))}</small><h2>${esc(C.title || '')}</h2><p>${esc(C.concept || '')}</p><span class="mzr-tap">누르면 넘어간다</span></div>`; MZ.dbgRead = { card: r.ch }; return; }
  const scs = mzScenes(r); if (!scs.length || r.s >= scs.length) return mzReadDone();
  const sc = scs[r.s], seen = !!(META && META.mazeSeen && META.mazeSeen[mzReadKey(r)]); el.className = 'read';
  el.innerHTML = `<div class="mzr-head"><span><b>${esc(sc.place || '')}</b><small>${esc((sc.who || []).join(' · '))}</small></span><button data-r="skipscene">넘기기</button><button data-r="skipall" class="mzr-all"${seen ? '' : ' hidden'}>건너뛰기</button></div><div class="mzr-lines" aria-live="polite"></div><div class="mzr-foot"><span>${r.s + 1}/${scs.length}</span><span class="mzr-tap">누르면 다음 줄</span></div>`;
  if (!seen) setTimeout(() => { const b = el.querySelector('.mzr-all'); if (b && MZ.M && MZ.M.ui && MZ.M.ui.read === r) b.hidden = false; }, 1500);
  const box = el.querySelector('.mzr-lines'); for (let i = 0; i < Math.max(1, r.l); i++) mzLineAdd(box, sc.lines[i], i === r.l - 1 || (r.l === 0 && i === 0));
  if (r.l === 0) r.l = 1; MZ.dbgRead = { q: r.q, ch: r.ch, s: r.s, l: r.l, n: sc.lines.length, scenes: scs.length };
}
function mzLineAdd(box, L, fresh) {
  if (!L) return; const d = document.createElement('div'), anim = fresh && (typeof motionOk !== 'function' || motionOk()); d.className = 'mzr-l k-' + L.k + (anim ? ' in' : '');
  if (L.k === 'say') { const kind = MZFACE[L.who]; d.innerHTML = `<span class="mzr-face">${kind ? `<img src="${mzIcon(kind, 1, 32)}" alt="">` : `<i>${esc((L.who || '?').slice(0, 1))}</i>`}</span><span class="mzr-say"><b>${esc(L.who || '')}</b><span>${esc(L.t)}</span></span>`; }
  else if (L.k === 'note') d.innerHTML = `${L.who ? `<b>${esc(L.who)}</b>` : ''}<span>${esc(L.t)}</span>`;
  else d.textContent = L.t;
  box.appendChild(d); if (box.scrollHeight > box.clientHeight) box.scrollTop = box.scrollHeight;
}
function mzReadClick(a) {
  const M = MZ.M; if (!M || !M.ui || !M.ui.read) return; const r = M.ui.read;
  if (performance.now() - (MZ.readT0 || 0) < 120) return; mzSay('click');
  if (r.card) { r.card = 0; mzSave(); return mzRead(); }
  const scs = mzScenes(r), sc = scs[r.s]; if (!sc) return mzReadDone();
  if (a === 'skipall') { r.s = scs.length; return mzReadDone(); }
  if (a === 'skipscene' && r.l < sc.lines.length) { const box = $('mzr').querySelector('.mzr-lines'); for (let i = r.l; i < sc.lines.length; i++) mzLineAdd(box, sc.lines[i], false); r.l = sc.lines.length; mzSave(); MZ.dbgRead.l = r.l; return; }
  if (r.l < sc.lines.length) { mzLineAdd($('mzr').querySelector('.mzr-lines'), sc.lines[r.l], true); r.l++; mzSave(); MZ.dbgRead.l = r.l; return; }
  r.s++; r.l = 0; mzSave(); if (r.s >= scs.length) return mzReadDone(); return mzRead();
}
// ---- 결말 ----
function mzEndingCard(k) {
  const E = MZST.endings[k] || {}, el = mzReadMount(); mzReadShow(el); el.className = 'card ending'; MZ.readT0 = performance.now();
  el.innerHTML = `<div class="mzr-card"><small>결말 ${esc(k)}</small><h2>${esc(E.title || '')}</h2><p>본 결말 ${mzEndsSeen().length}/5</p><button class="btn pri" data-r="home">처음으로</button></div>`; MZ.dbgRead = { ending: k };
  el.onclick = e => { if (e.target.closest('[data-r="home"]')) { el.onclick = null; mzReadClose(); MZ.M = null; $('mz').hidden = true; mzTitle(); } };
}
// ---- 밤의 한 수 ----
function mzNight() {
  const M = MZ.M; MZ.phase = 'night'; const v = mzView(), N = v.night, el = mzReadMount(); if (!N) { MZ.phase = 'prep'; return mzStoryGo(); }
  mzReadShow(el); el.className = 'night'; MZ.nightSel = MZ.nightSel != null && MZ.nightSel < N.offer.length ? MZ.nightSel : null; mzMusic('night');
  const st = v.story, lights = N.offer.map(c => c.place), sel = MZ.nightSel != null ? N.offer[MZ.nightSel] : null;
  el.innerHTML = `<div class="mzn-top"><b>${esc(mzChapName(st.chapter))} · 밤</b><div class="mzn-alert" aria-label="경계 ${st.alert}/${st.alertMax}"><span>경계</span><i>${Array.from({ length: st.alertMax }, (x, i) => `<em class="${i < st.alert ? 'on' : ''}${st.alertSteps.includes(i + 1) ? ' step' : ''}"></em>`).join('')}</i><b>${st.alert}</b></div></div>`
    + `<canvas id="mzn-sky" width="320" height="96" role="img" aria-label="밤의 지상"></canvas>`
    + `<div class="mzn-cards">${N.offer.map((c, i) => { const T = mzCardText(c.id); return `<button class="mzn-card${MZ.nightSel === i ? ' on' : ''}" data-r="ncard" data-i="${i}"${c.can ? '' : ' disabled'} aria-pressed="${MZ.nightSel === i}"><small>${esc(MZST.night.places[c.place] || '')} · ${esc(MZACT[c.act] || '')}${c.cost ? ' · 진액 ' + c.cost : ''}</small><b>${esc(T.name)}</b><span>${esc(T.short)}</span></button>`; }).join('')}</div>`
    + `<div class="mzn-acts"><button class="pri" data-r="npick"${sel ? '' : ' disabled'}>${sel ? '고른다 · ' + esc(mzCardText(sel.id).name) : '카드를 고른다'}</button><button data-r="nskip">고르지 않는다</button></div>`;
  mzSkyDraw(lights, sel ? sel.place : null); MZ.dbgRead = { night: N.offer.map(c => c.id) };
  el.onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; const a = b.dataset.r; if (a === 'ncard') { mzSay('click'); MZ.nightSel = +b.dataset.i; return mzNight(); } if (a === 'npick' || a === 'nskip') return mzNightPick(a === 'nskip' ? -1 : MZ.nightSel); if (a === 'nnext') { el.onclick = null; MZ.nightSel = null; mzReadClose(); MZ.phase = 'prep'; return mzStoryGo(); } };
}
const mzCardText = id => ((MZST && MZST.night.cards.find(c => c.id === id)) || { name: id, short: '', outcome: '' });
function mzNightPick(i) {
  const M = MZ.M, before = M.alert, r = MAZE.nightPick(M, i == null ? -1 : i); if (!r.ok) return mzToast(r.msg); mzSay(r.skip ? 'click' : 'thud'); mzSave();
  const el = $('mzr'), T = r.id ? mzCardText(r.id) : null, g = r.gains || {}, list = [g.gold ? '진액 +' + g.gold : '', (g.kin || []).map(k => (LAIR.KIN[k] ? LAIR.KIN[k].name : k) + ' 하나').join(' · '), g.egg ? '알 ' + (g.egg > 0 ? '+' : '−') + Math.abs(g.egg) : '', g.trap ? '함정 · ' + (MAZE.trapInfo(g.trap) || {}).name : '', g.lure ? '미끼 불빛 ' + g.lure : '', g.clue ? '단서 ' + g.clue : ''].filter(Boolean);
  const text = !T ? '그 밤에는 아무 데도 가지 않았다.' : r.success === false && T.outcomeFail ? T.outcomeFail : T.outcome;
  el.innerHTML = `<div class="mzn-top"><b>${esc(T ? T.name : '고르지 않았다')}</b><div class="mzn-alert"><span>경계</span><b>${before} → ${r.alert}</b></div></div><canvas id="mzn-sky" width="320" height="96" role="img" aria-label="밤의 지상"></canvas><div class="mzn-res"><p>${esc(text)}</p>${r.success != null ? `<p class="mzn-hunt">${r.success ? '사냥이 되었다' : '사냥이 어긋났다'}</p>` : ''}${list.length ? `<p class="mzn-gain">${list.map(esc).join(' · ')}</p>` : ''}</div><div class="mzn-acts"><button class="pri" data-r="nnext">준비</button></div>`;
  mzSkyDraw([], T ? (MAZE.CARDS.find(c => c.id === r.id) || {}).place : null); MZ.dbgRead = { nightDone: r.id || 'skip', success: r.success };
}
// 지상 띠: 밤 하늘, 마을 · 예배당 · 기록관의 집 · 연금술 공방 · 북쪽 탑. 고를 수 있는 곳만 창에 불빛
function mzSkyDraw(lights, pick) {
  const cv = $('mzn-sky'); if (!cv) return; const x = cv.getContext('2d'), W = cv.width, H = cv.height, g = x.createLinearGradient(0, 0, 0, H); x.imageSmoothingEnabled = false;
  g.addColorStop(0, '#05040c'); g.addColorStop(1, '#141028'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#cfc8e8'; for (let i = 0; i < 40; i++) { const sx = (i * 73) % W, sy = (i * 37) % (H - 40); x.globalAlpha = 0.3 + (i % 5) / 8; x.fillRect(sx, sy, 1, 1); } x.globalAlpha = 1;
  x.fillStyle = '#0a0812'; x.beginPath(); x.moveTo(0, H - 16); for (let i = 0; i <= W; i += 16) x.lineTo(i, H - 16 - Math.round(4 * Math.sin(i / 27))); x.lineTo(W, H); x.lineTo(0, H); x.fill();
  const any = lights.includes('any'), lit = p => any || lights.includes(p), win = (wx, wy, p) => { x.fillStyle = lit(p) ? (pick === p || (pick === 'any' && lit(p)) ? '#fff0a0' : '#e8b048') : '#1c1830'; x.fillRect(wx, wy, 3, 3); };
  const B = (p, f) => { x.fillStyle = '#0a0812'; f(); }, dark = () => { x.fillStyle = '#0a0812'; };
  B('village', () => { [[10, 62, 18, 14], [30, 58, 16, 18], [48, 64, 14, 12]].forEach(([bx, by, bw, bh]) => { dark(); x.fillRect(bx, by, bw, bh); x.beginPath(); x.moveTo(bx - 2, by); x.lineTo(bx + bw / 2, by - 8); x.lineTo(bx + bw + 2, by); x.fill(); win(bx + bw / 2 - 1, by + 5, 'village'); }); });
  B('chapel', () => { x.fillRect(78, 54, 22, 26); x.fillRect(86, 34, 6, 20); x.beginPath(); x.moveTo(84, 34); x.lineTo(89, 22); x.lineTo(94, 34); x.fill(); x.fillRect(88, 16, 2, 6); x.fillRect(86, 18, 6, 2); win(88, 60, 'chapel'); win(88, 40, 'chapel'); });
  B('archive', () => { x.fillRect(120, 52, 30, 28); x.beginPath(); x.moveTo(116, 52); x.lineTo(135, 38); x.lineTo(154, 52); x.fill(); win(126, 60, 'archive'); win(140, 60, 'archive'); });
  B('workshop', () => { x.fillRect(176, 58, 34, 22); x.fillRect(200, 36, 6, 22); win(184, 64, 'workshop'); if (lit('workshop')) { x.fillStyle = '#6a5a8a'; x.globalAlpha = 0.5; x.fillRect(201, 28, 4, 6); x.fillRect(203, 22, 4, 5); x.globalAlpha = 1; } });
  B('tower', () => { x.fillStyle = '#0a0812'; x.fillRect(262, 18, 14, 62); x.fillRect(258, 14, 22, 6); win(268, 30, 'tower'); win(268, 50, 'tower'); });
  const L = { village: [10, '마을'], chapel: [72, '예배당'], archive: [118, '기록관의 집'], workshop: [172, '연금술 공방'], tower: [246, '북쪽 탑'] }; x.font = '9px "Nest Sans", sans-serif'; x.textBaseline = 'top';
  Object.keys(L).forEach(k => { x.fillStyle = lit(k) ? '#e8dcc0' : '#4a4460'; x.fillText(L[k][1], L[k][0], H - 12); });
}
// ---- 장의 안내 한 줄 (지도 위 띠) ----
const mzGuideKey = M => M.chapter + ':' + M.raid;
function mzGuide() {
  const c = $('mz-coach'), M = MZ.M; if (!c || !M) return; const C = MZST && MZST.chapters[M.chapter], G = C && C.guide ? C.guide : [], line = G[Math.min(M.raid - 1, G.length - 1)];
  if (!line || MZ.phase !== 'prep' || MZ.sheet || MZ.reading || (M.ui && M.ui.guided && M.ui.guided[mzGuideKey(M)]) || (M.raid > G.length && M.ui && M.ui.guided && M.ui.guided[M.chapter + ':' + G.length])) { c.hidden = true; $('mz-ring').hidden = true; return; }
  const cv = $('mz-cv'); if (!cv) return; const r = cv.getBoundingClientRect(), at = { left: r.left + r.width / 2 - 1, top: r.top + 4, width: 2, height: 2 };
  if (c.dataset.h !== line) { c.innerHTML = `<p>${esc(line)}</p><span><button data-m="guideok">알았다</button></span>`; c.dataset.h = line; } c.hidden = false; c.className = 'strip guide'; const vw = window.innerWidth;
  c.style.width = Math.min(vw - 16, r.width + 40) + 'px'; c.style.left = Math.max(8, Math.round(r.left + r.width / 2 - Math.min(vw - 16, r.width + 40) / 2)) + 'px'; c.style.top = Math.round(r.top + MTOP * MZ.k + 6) + 'px'; $('mz-ring').hidden = true; MZ.coachAt = null; MZ.dbgGuide = line; void at;
}
if (typeof window !== 'undefined') window.__maze = { get M() { return MZ.M; }, get meta() { return META; }, get Z() { return MZ; }, get P() { return MZ.play; }, view: () => mzView(), open: run => mzOpen(run), saved: () => mzSaved(), title: () => mzTitle(), redraw: () => mzDraw(), pt(c) { const r = $('mz-cv').getBoundingClientRect(), q = mzPt(c); return { x: r.left + q.x * MZ.k, y: r.top + q.y * MZ.k }; }, spot(c, i) { const r = $('mz-cv').getBoundingClientRect(); if (c === 'core') { const q = MZCORE_SPOTS[i]; return { x: r.left + q[0] * MZ.k, y: r.top + (q[1] - 14) * MZ.k }; } const q = MZUSPOT[i]; return { x: r.left + ((c % 5) * MS + q[0] * MS) * MZ.k, y: r.top + (MTOP + Math.floor(c / 5) * MS + q[1] * MS - 6) * MZ.k }; }, dbg: () => MZ.dbg, speed: () => mzSpeed(), read: () => (MZ.reading ? MZ.dbgRead : null), awaken: () => mzAwaken(), guide: () => MZ.dbgGuide || null, story: () => ({ go: mzStoryGo, done: mzReadDone, night: mzNight }), skip: () => mzSkipAll(), give(kind, star, cell) { const M = MZ.M, uid = M.nextUid++; M.unit[uid] = { uid, kind, star: star || 1 }; if (cell != null) M.board[cell] = (M.board[cell] || []).concat([uid]); else M.bench[M.bench.indexOf(null)] = uid; mzDraw(); return uid; } };
mzBoot();
