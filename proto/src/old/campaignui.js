// 옛 것의 둥지 — 이야기 화면 (campaign.js 의 일곱 장을 카드 판 화면 위에서 한다)
// 장 고르기(일곱 바늘) → 장의 첫 장면 → 카드 판(cardui.js 그대로) → 밤마다 그 밤의 대사 → 장 끝 장면 → 넘긴 화면(열린 카드·알).
// cardui.js / ui.js 와 같은 묶음(IIFE) 안에서 돈다. 이 파일이 쓰는 것: cmMount cmMeta cmGo cmOv cmSheet cmToast cmFace cmBareView cmBodyImg scene N_ E_ D_ V_ seekerImg needlesSvg showTitle store saveMeta
const CPU = { css: false, goalEl: null, goalT: 0 };
const CP_CSS = `
.cp-wrap { max-width: 560px; margin: 0 auto; padding: 18px 16px 28px; display: flex; flex-direction: column; gap: 10px; }
.cp-wrap h2 { margin: 0; font-size: 22px; }
.cp-wrap .needles { width: 100%; max-width: 300px; margin: 4px auto 0; display: block; }
.cp-sub { color: var(--mute, #a59cb4); font-size: 14px; margin: 0; line-height: 1.5; word-break: keep-all; }
.cp-list { display: flex; flex-direction: column; gap: 8px; }
.cp-row { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left; padding: 10px 12px; font-family: var(--body, sans-serif); }
.cp-row b { font-size: 16px; }
.cp-row small { color: var(--mute, #a59cb4); font-size: 13px; line-height: 1.45; word-break: keep-all; white-space: normal; }
.cp-row.done b::after { content: ' · 넘김'; color: #8fd08a; font-size: 13px; font-weight: 400; }
.cp-row[disabled] { opacity: .5; }
.cp-row.pri small { color: #2a2236; }
.cp-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.cp-btns .btn { flex: 1 1 auto; }
.cp-choice { display: flex; flex-direction: column; gap: 8px; }
.cp-choice .btn { text-align: left; padding: 10px 12px; }
.cp-choice .btn small { display: block; margin-top: 3px; white-space: normal; word-break: keep-all; line-height: 1.45; }
.cp-goal { position: absolute; left: 8px; top: 58px; z-index: 6; font: inherit; font-size: 13px; padding: 6px 10px; background: rgba(20, 16, 32, .88); color: #ece6d6; border: 1px solid #e8c030; cursor: pointer; max-width: calc(100% - 16px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-goal b { color: #e8c030; font-weight: 700; }
.cp-goals { display: flex; flex-direction: column; gap: 6px; margin: 6px 0; }
.cp-goals p { margin: 0; font-size: 15px; }
.cp-goals .ok { color: #8fd08a; }
.cp-opened { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
body:has(#scene:not([hidden])) #cm-coach { display: none; }
#scene .box.journal { border-color: #b8a070; background: linear-gradient(180deg, #221c12, #17130c); }
#scene .box.journal .who { color: #e0c890; letter-spacing: .05em; }
#scene .box.journal .txt { color: #efe2c4; font-family: "Nest Sans", "IBM Plex Sans KR", serif; }
`;
function cpCss() { if (CPU.css) return; CPU.css = true; const s = document.createElement('style'); s.textContent = CP_CSS; document.head.appendChild(s); }

// 책을 쫓는 자의 그림 (이야기에만 나오는 적) · 다른 세상에서 건너온 적은 제 세상 차림으로
(function () {
  if (typeof invCanvasW !== 'function') return;
  const base = invCanvasW;
  invCanvasW = function (world, kind) {
    const k = String(kind);
    if (k.indexOf('seeker') === 0 && typeof HEROART !== 'undefined' && HEROART.seeker) return HEROART.seeker(+k.slice(6) || 0);
    const d = NEST.INV[k]; if (d && d.only && d.only !== world) return base(d.only, k);
    return base(world, kind);
  };
})();

// ---- 대사 한 줄 → 장면 ----
const CP_SEEK = { 3: 0, 4: 1, 5: 1, 7: 2 };
function cpLine(L, ch) {
  if (L.s === 'n') return N_(L.t);
  if (L.s === 'd') return D_(L.t);
  if (L.s === 'e') return E_(L.t);
  if (L.s === 's') return V_('책을 쫓는 자', L.t, typeof seekerImg === 'function' ? seekerImg(CP_SEEK[ch] || 0) : '', 'seeker');
  if (L.s === 'j') return { narr: true, who: '에녹 하르의 일지', text: L.t, cls: 'journal' };
  return { narr: true, who: '사람의 목소리', text: L.t, cls: 'cap' };
}
async function cpScene(lines, ch) { if (!lines || !lines.length) return; await scene(lines.map(L => cpLine(L, ch))); }

// ---- 저장: 이야기 판은 'camprun' 에 따로 둔다 (본편 'cardrun' 을 덮지 않는다) ----
function campSave() { const run = CMU.run; if (!run || CMU.inNight || run.phase === 'over' || (run.G && run.G.over)) return; try { CMU.set0.call(store, 'camprun', Object.assign({}, run, { meta: null })); } catch (e) { /* 저장 못 해도 판은 계속 */ } }
function campLoad() { const r = store.get('camprun'); if (!r || !r.G || !r.deck || !r.camp) return null; if (typeof cardRunOk === 'function' && !cardRunOk(r)) { store.del('camprun'); return null; } r.meta = cmMeta(); try { CARDMODE.repair(r); } catch (e) { return null; } return r; }

// ---- 장 고르기 ----
function campOpen() {
  cpCss(); cmMount(); const m = cmMeta(), cm = CAMPAIGN.campMeta(m); $('title').hidden = true; $('game').hidden = true; G = null; CMU.run = null; cpGoalShow(false);
  const n = Object.keys(cm.clear).filter(k => +k >= 1 && cm.clear[k]).length, saved = campLoad();
  const row0 = `<button class="btn opt cp-row${cm.clear[0] ? ' done' : ''}" data-cp="ch" data-v="0"><b>여는 이야기 · 떨어진 바늘</b></button>`;
  const rows = CAMPAIGN.IDS.map(ch => { const C = CAMPAIGN.CH[ch], open = CAMPAIGN.isOpen(m, ch), done = !!cm.clear[ch]; return `<button class="btn opt cp-row${done ? ' done' : ''}${open && ch === CAMPAIGN.next(m) && !done ? ' pri' : ''}" data-cp="ch" data-v="${ch}"${open ? '' : ' disabled'}><b>${ch}장 · ${esc(C.title)}</b></button>`; }).join('');
  const ch5 = cm.choice5 && CAMPAIGN.CHOICE[cm.choice5] ? `<p class="cp-sub">5장에서 그를 「${CAMPAIGN.CHOICE[cm.choice5].label}」 하였다.</p>` : '';
  cmOv(`<div class="cp-wrap"><h2>이야기</h2>${typeof needlesSvg === 'function' ? needlesSvg(n) : ''}${ch5}
${saved ? `<button class="btn pri" data-cp="cont">이어하기 <small>${saved.camp.ch}장 「${esc(CAMPAIGN.CH[saved.camp.ch].title)}」 · ${saved.G.day}일</small></button>` : ''}
<div class="cp-list">${row0}${rows}</div>
<div class="cp-btns">${typeof playIntro === 'function' ? '<button class="btn" data-cp="film">여는 이야기 다시 보기</button>' : ''}<button class="btn" data-cp="home">처음 화면</button></div></div>`, 'dk-full');
}
// 한 장 시작
async function campBegin(ch) {
  cpCss(); const m = cmMeta(), cm = CAMPAIGN.campMeta(m); cmOv(null); cmSheet(null);
  if (ch === 0) { await cpOpening(); return campOpen(); }
  // 몸을 아직 정하지 않았으면 여는 이야기부터 (자동 시험에서는 건너뛴다)
  if (!cm.seed && typeof playOpening === 'function' && !(navigator.webdriver && !window.__forceOpening)) await cpOpening();
  const C = CAMPAIGN.CH[ch]; store.del('camprun');
  await cpScene([{ s: 'n', t: ch + '장 · ' + C.title }].concat(C.lines.start), ch);
  const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0, run = CAMPAIGN.newRun(ch, seed, { meta: m });
  run.camp.said.start = 1; cmGo(run); cpGoalShow(true); cmToast(C.teach + ' · 목표는 지도 왼쪽 위');
}
async function cpOpening() {
  const m = cmMeta(), cm = CAMPAIGN.campMeta(m); let seed = null;
  try { const noFilm = !!(navigator.webdriver && !window.__forceIntro); seed = await playOpening({ noFilm, camp: true }); } catch (e) { seed = null; }
  if (seed) cm.seed = seed; cm.clear[0] = 1; m.opened = 1; saveMeta();
}
// 밤이 끝날 때마다 (cardui.js 의 cardNight 가 부른다): 그 밤의 대사
async function campAfterNight(run) { if (!run || !run.camp) return; const L = CAMPAIGN.linesAt(run, 'night'); if (L.length) await cpScene(L, run.camp.ch); cpGoalPaint(); }
// 장이 끝났을 때 (cardui.js 의 cardFinish 대신)
async function campFinish() {
  const run = CMU.run; if (!run) return; busy = true; cpGoalShow(false); store.del('camprun');
  const o = run.over || {}, cr = o.camp || { ch: run.camp.ch, win: !!o.win, opened: [] }, ch = run.camp.ch, C = CAMPAIGN.CH[ch], m = cmMeta(), cm = CAMPAIGN.campMeta(m);
  typeof music === 'function' && music(cr.win ? 'win' : 'lose');
  await cpScene(cr.win ? CAMPAIGN.linesAt(run, 'end') : CAMPAIGN.linesAt(run, 'fail'), ch);
  if (cr.win && ch === 5) await cpChoose();
  saveMeta(); busy = false;
  const n = Object.keys(cm.clear).filter(k => +k >= 1 && cm.clear[k]).length, nextCh = ch < 7 ? ch + 1 : null;
  const opened = (cr.opened || []).filter(id => CARDS2.BY[id]), egg = cr.egg;
  cmOv(`<div class="cp-wrap"><h2>${cr.win ? (ch === 7 ? '일곱째 바늘이 돌아섰다' : ch + '장을 넘겼다') : '둥지가 무너졌다'}</h2><div class="cp-btns">${cr.win && nextCh ? `<button class="btn pri" data-cp="ch" data-v="${nextCh}">${nextCh}장으로</button>` : ''}${!cr.win ? `<button class="btn pri" data-cp="ch" data-v="${ch}">다시 한다</button>` : ''}<button class="btn" data-cp="menu">장 고르기</button><button class="btn" data-cp="home">처음 화면</button></div>${typeof needlesSvg === 'function' ? needlesSvg(n, cr.win && cr.first) : ''}
<p class="cp-sub">${ch}장 「${esc(C.title)}」 · ${o.day || run.G.day}일${cr.win && cr.first ? ' · 처음 넘김' : ''}</p>
${opened.length ? `<p class="dk-lab">본편에 열린 카드</p><div class="cp-opened">${opened.map(id => cmFace(cmBareView(id), { cls: 'mini' })).join('')}</div>` : ''}
${egg ? `<p class="cp-sub">본편에서 고를 수 있는 알이 하나 생겼다: <b>${esc(egg.name)}</b></p>` : ''}
</div>`, 'dk-full');
}
// 5장 끝: 그를 어떻게 하나
function cpChoose() {
  return new Promise(done => {
    CPU.choose = k => { CAMPAIGN.choose(cmMeta(), k); saveMeta(); CPU.choose = null; cmOv(null); const L = CAMPAIGN.CHOICE[k].line; cpScene([L], 5).then(done); };
    cmOv(`<div class="cp-wrap"><h2>에녹 하르</h2><p class="cp-sub">장부를 붙인 손을 늘어뜨린 채, 그는 본체가 앉은 방 앞에 무릎을 꿇고 있었다.</p><div class="cp-choice">${Object.keys(CAMPAIGN.CHOICE).map(k => `<button class="btn" data-cp="choose" data-v="${k}"><b>${esc(CAMPAIGN.CHOICE[k].label)}</b><small>${esc(CAMPAIGN.CHOICE[k].text)}</small></button>`).join('')}</div></div>`, 'dk-full');
  });
}

// ---- 목표 단추 (지도 왼쪽 위, 카드 판 단추 줄 아래) ----
function cpGoalShow(on) {
  cpCss(); let el = $('camp-goal');
  if (!el && on) { const w = $('stagewrap'); if (!w) return; el = document.createElement('button'); el.id = 'camp-goal'; el.className = 'cp-goal'; el.setAttribute('data-cp', 'goal'); w.appendChild(el); }
  if (el) el.hidden = !on;
  if (on) cpGoalPaint();
}
function cpGoalPaint() {
  const el = $('camp-goal'), run = CMU.run; if (!el) return;
  if (!run || !run.camp || $('game').hidden) { el.hidden = true; return; }
  const gs = CAMPAIGN.goals(run), ok = gs.filter(x => x.done).length, C = CAMPAIGN.CH[run.camp.ch];
  el.hidden = false; el.innerHTML = `<b>${run.camp.ch}장</b> 목표 ${ok}/${gs.length} · ${esc(C.title)}`;
}
function cpGoalSheet() {
  const run = CMU.run; if (!run || !run.camp) return; const C = CAMPAIGN.CH[run.camp.ch];
  cmSheet('campgoal', `<h3>${run.camp.ch}장 · ${esc(C.title)}</h3><p class="cp-sub">${esc(C.brief)}</p><div class="cp-goals">${CAMPAIGN.goals(run).map(x => `<p class="${x.done ? 'ok' : ''}">${x.done ? '✓' : '·'} ${esc(x.label)} ${x.cur}/${x.need}</p>`).join('')}</div><p class="cp-sub">이 장에서 배우는 것: ${esc(C.teach)}</p>`);
}
setInterval(() => { if (CMU.run && CMU.run.camp && !$('game').hidden) { if (!$('camp-goal') || $('camp-goal').hidden) cpGoalShow(true); else cpGoalPaint(); } else if ($('camp-goal')) $('camp-goal').hidden = true; }, 600);

// ---- 누름 ----
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('[data-cp]'); if (!el || el.disabled) return;
  const c = el.dataset.cp, v = el.dataset.v;
  if (c === 'ch') return void campBegin(+v);
  if (c === 'cont') { const r = campLoad(); if (!r) return campOpen(); cmOv(null); try { cmGo(r); cpGoalShow(true); } catch (e) { console.warn(e); store.del('camprun'); CMU.run = null; campOpen(); } return; }
  if (c === 'menu') return void campOpen();
  if (c === 'home') { cmOv(null); cpGoalShow(false); CMU.run = null; return void showTitle(); }
  if (c === 'film') { cmOv(null); return void playIntro({ camp: true }).then(campOpen); }
  if (c === 'goal') return void cpGoalSheet();
  if (c === 'choose' && CPU.choose) return void CPU.choose(v);
});
// 시험용
window.__camp = { CAMPAIGN, open: campOpen, begin: campBegin, finish: campFinish, after: campAfterNight, goal: cpGoalSheet, line: (L, ch) => cpScene([L], ch || 3), choose: k => CPU.choose && CPU.choose(k), win: () => { const run = CMU.run; if (!run) return false; run.G.over = { win: true, why: 'test', camp: true }; CARDMODE.endRun(run); return run.over; } };
