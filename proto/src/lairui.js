// 둥지 전투 화면: 상점에서 권속을 사서 둥지에 세우고, 방을 깔고, 저절로 싸우는 것을 본다. 세 막, 막마다 다섯 번의 싸움.
// 싸움 사이의 고르는 화면(보상, 신화 단계, 조우)은 lairflow.js (LF) 가 띄운다. 여기서는 LF.pending / LF.run 만 부른다.
// 규칙은 lair.js (LAIR), 그림과 움직임은 lairart.js (LAIRART). 이 파일은 그리기와 누르기, 싸움을 다시 보여 주는 일만 한다.
const LU = { dbg: { badges: 0, range: [], rows: [], dive: 0, dice: 0 }, flow: false, R: null, phase: 'prep', sel: null, drag: null, roomPick: null, sheet: null, speed: 1, paused: false, F: null, res: null, raf: 0, last: 0, t: 0, wallH: 45, bg: null, tut: -1, tutT: 0, hitAt: 0, castAt: 0, seed: 0, warm: [], warmed: {}, pops: {}, toastT: 0 };
const LS = 64, LW = 384;
const LCOL = { abyss: '#3ac0d8', nebula: '#b08fff', brood: '#8fd05f', dusk: '#f0a04a', hunger: '#ff5f57' };
const LNAR = {
  win: '횃불이 하나씩 꺼졌다. 굴은 다시 젖은 숨소리로 돌아갔다.',
  lose: '발소리가 가장 깊은 방까지 내려왔다. 그것은 몸을 움츠렸다.',
  boss: '가장 앞에 섰던 자가 쓰러졌다. 남은 자들은 등불을 버리고 위로 달아났다.',
  again: '그들은 물러나지 않았다. 굴 어귀에서 횃불이 다시 줄을 맞추었다.',
  end: '책은 덮였다. 그것을 읽던 자는 굴의 일부가 되었고, 위의 마을에는 아침이 오지 않았다.',
  fall: '등불이 둥지의 가장 안쪽을 비추었다. 읽힌 것은 더 이상 숨을 수 없었다.',
};
const LTUT = [
  { key: 'shop', text: '권속을 눌러 고르고, 다시 눌러 산다.', at: '#lr-shop .lr-card' },
  { key: 'place', text: '대기석의 권속을 누른 다음 둥지 칸을 눌러 세운다.', at: '#lr-bench .lr-slot.has' },
  { key: 'syn', text: '같은 성향이나 종류가 모이면 힘이 붙는다. 누르면 보인다.', at: '#lr-top .lr-syn', ok: 1 },
  { key: 'fight', text: '「싸운다」를 누르면 저절로 싸운다. 마나가 차면 스킬을 쓴다.', at: '#lr-top [data-l="fight"]' },
];
const LBIG = { meteor: 1, rift: 1, smite: 1, rebirth: 1, possess: 1, swallow: 1, feast: 1, firepillar: 1, wave: 1, slam: 1, dash: 1, readblast: 1, cloud: 1, skyeye: 1, chorus: 1, shieldwall: 1, sanctum: 1, mask: 1, beam: 1 };
const LFXDUR = { meteor: 1.1, toll: 1, ink: 1.2, reap: 0.6, sermon: 0.9, rift: 1.3, rebirth: 0.9, banner: 1, mark: 0.8, smite: 0.8, exorcise: 1.1, flask: 1.1, possess: 0.9, snare: 0.7, beam: 0.75, pierce: 0.5, whisper: 0.7, lash: 0.6, bites: 0.7, bigbite: 0.6, latch: 0.7, backstab: 0.6, snipe: 0.7, seal: 1.2, madburst: 0.8, shell: 2, eyes: 0.9, slam: 0.8, feast: 0.9, readblast: 0.9, light: 1, sanctum: 4, song: 1, shieldwall: 3, wave: 1.1, swallow: 1.1, mask: 0.9, cloud: 1.4, firepillar: 1, hatch: 0.7, rise: 0.8, chorus: 0.9, skyeye: 1, pull: 0.8, dash: 0.5, read: 1.2, echo: 0.7, eat: 0.6, on: 0.6, spark: 0.25, ichor: 0.5, heal: 0.7, bolt: 0.2, arrow: 0.24 };
// 빠르기: 느리게 / 보통 / 빠르게. 고른 것을 기억한다
const LSPD = [[0.6, '느리게'], [1, '보통'], [2, '빠르게']];
const lrSpeedLoad = () => { let v = 0; try { v = +(META && META.lairSpeed); } catch (e) { v = 0; } return LSPD.some(q => q[0] === v) ? v : 1; };
function lrSpeedSet(v) { LU.speed = v; try { if (META) { META.lairSpeed = v; saveMeta(); } } catch (e) { /* 저장 없이 */ } lrFightPanel(); }
// 쏘는 공격: 놓는 때(rel)와 날아가는 시간(fly). 붙어 치는 공격은 hit 에 닿는다
const LSHOT = { rel: 0.19, fly: 0.26, hit: 0.21 };
const LROLE = { tank: '앞줄에서 맞는다. 방어가 높아 피해를 많이 막는다.', melee: '앞줄에서 붙어 때린다.', ranged: '뒷줄에서 멀리 쏜다.', support: '뒷줄에서 아군을 돕는다.', dive: '싸움이 시작되면 곧 뒷줄로 뛰어든다.' };
const LSTC = { marked: '#ff4060', corrode: '#9ad04a', stun: '#ffe060', silenced: '#ff5f57', burn: '#ff9a3a', bleed: '#c8303a', infected: '#a8e04a', wet: '#5ab8f0', taunted: '#f0a04a', atkup: '#ffd040', atkdown: '#8a92a8', fed: '#ff8a8a' };

// ---- 작은 도구 ----
const lq = sel => document.querySelector(sel);
const lcx = c => (c % 6) * LS + LS / 2, lcy = c => LU.wallH + Math.floor(c / 6) * LS + LS / 2;
const lcen = cells => { let x = 0, y = 0; cells.forEach(c => { x += lcx(c); y += lcy(c); }); return { x: x / cells.length, y: y / cells.length }; };
const LURL = {};
// 새 그림이 아직 없는 유닛은 규칙이 적어 둔 빌린 그림(art)으로 그린다. st = 조사자의 덧그림('poss' 홀림, 'hurt' 붕대)
function lrArtId(kind, st) { const d = LAIR.KIN[kind] || LAIR.INV[kind] || LAIR.SUMMON[kind] || {}; if (st && LAIRART.DEF[kind + '_' + st]) return kind + '_' + st; return LAIRART.DEF[kind] ? kind : d.art && LAIRART.DEF[d.art] ? d.art : kind; }
const lrUnitH = (kind, star, st) => { const id = lrArtId(kind, st); return LAIRART.unit(id, id === kind || LAIR.KIN[kind] ? star || 1 : 1); };
const lrBossH = (form, step) => LAIRART.boss(step ? form || 'drop' : 'drop', step || 0);
// 연출 이름: 그림이 없으면 닮은 옛 연출로
const LFXALT = { meteor: 'firepillar', toll: 'eyes', ink: 'cloud', reap: 'backstab', sermon: 'rise', rift: 'skyeye', rebirth: 'hatch', banner: 'song', mark: 'seal', smite: 'slam', exorcise: 'light', flask: 'cloud', possess: 'rise', snare: 'latch' };
const lrFxName = n => (LAIRART.FX && LAIRART.FX[n] ? n : LFXALT[n] || n);
// 본체 초상: 'boss:모습:단계'. 단계가 0 이면 떨어진 한 방울
function lrBossIcon(form, step, px) { const h = lrBossH(form, step), src = h.frame('idle', 0), C = h.w, d = src.getContext('2d').getImageData(0, 0, C, C).data; let x0 = C, y0 = C, x1 = 0, y1 = 0; for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) if (d[(y * C + x) * 4 + 3] > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } const w = Math.max(1, x1 - x0 + 1), hh = Math.max(1, y1 - y0 + 1), sc = Math.min(px / w, px / hh), k2 = sc >= 1 ? Math.floor(sc) : sc, c = document.createElement('canvas'); c.width = c.height = px; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, x0, y0, w, hh, Math.round((px - w * k2) / 2), Math.round((px - hh * k2) * 0.7), Math.round(w * k2), Math.round(hh * k2)); return c; }
function lrIcon(id, star, px) {
  const k = id + ':' + (star || 1) + ':' + px; if (LURL[k] != null) return LURL[k];
  try { if (typeof id === 'string' && id.indexOf('boss:') === 0) { const q = id.split(':'); LURL[k] = lrBossIcon(q[1], q[2] == null ? (q[1] === 'drop' ? 0 : 1) : +q[2], px).toDataURL(); } else { const q = String(id).split('/'), aid = lrArtId(q[0], q[1]); LURL[k] = LAIRART.icon(aid, aid === q[0] || LAIR.KIN[q[0]] ? star || 1 : 1, px).toDataURL(); } } catch (e) { LURL[k] = ''; }
  return LURL[k];
}
function lrSym(id, px) { const k = 'sym:' + id + ':' + px; if (!LURL[k]) { try { LURL[k] = LAIRART.sym(id, px).toDataURL(); } catch (e) { LURL[k] = ''; } } return LURL[k]; }
function lrRoleImg(role, px) { if (!LAIR.ROLE[role]) return ''; const k = 'role:' + role + ':' + px; if (!LURL[k]) { try { LURL[k] = LAIRART.role(role, px).toDataURL(); } catch (e) { LURL[k] = ''; } } return `<img class="lr-role" data-role="${role}" src="${LURL[k]}" alt="${esc(LAIR.ROLE[role].name)}">`; }
function lrRoomIcon(id) { const k = 'room:' + id; if (!LURL[k]) { try { LURL[k] = LAIRART.room(id, 48, 0, 1, 0).toDataURL(); } catch (e) { LURL[k] = ''; } } return LURL[k]; }
const lrStars = n => '<span class="lr-stars">' + '★'.repeat(n || 1) + '</span>';
const lrSay = k => { try { sfx(k); } catch (e) { /* 소리를 못 내는 환경 */ } };
const lrView = () => LAIR.view(LU.R);

// ---- 세우기 ----
function lrMount() {
  if ($('lr')) return;
  const el = document.createElement('div'); el.id = 'lr'; el.hidden = true;
  el.innerHTML = `<div id="lr-bar"></div>
<div id="lr-main"><div id="lr-boardwrap"><canvas id="lr-cv" width="${LW}" height="429"></canvas><div id="lr-ov"></div><div id="lr-top"></div></div>
<div id="lr-side"><div id="lr-info" hidden></div><div id="lr-bench"></div><div id="lr-shop"></div><div id="lr-fight" hidden></div></div></div>
<div id="lr-sheet" hidden></div><div id="lr-coach" hidden></div><div id="lr-toast" hidden></div><img id="lr-drag" alt="" hidden>`;
  document.body.appendChild(el);
  el.addEventListener('click', lrClick);
  el.addEventListener('pointerdown', lrDown); el.addEventListener('pointermove', lrMove); el.addEventListener('pointerup', lrUp); el.addEventListener('pointercancel', lrCancel);
  // 폰에서는 앱이나 브라우저가 끄는 손가락을 스크롤로 가져가 끌기가 취소된다. 끄는 동안에는 움직임을 게임이 쥔다
  el.addEventListener('touchmove', e => { if (LU.drag && LU.drag.uid && e.cancelable) e.preventDefault(); }, { passive: false });
  el.addEventListener('touchstart', e => { const t = e.target; if (e.cancelable && LU.phase === 'prep' && !LU.sheet && !LU.flow && (t.id === 'lr-cv' || (t.closest && t.closest('#lr-bench .lr-slot[data-u]')))) e.preventDefault(); }, { passive: false });
  window.addEventListener('resize', () => { if (!el.hidden) { lrBarFit(); lrSize(); } });
  window.addEventListener('keydown', e => { if (el.hidden) return; if (e.key === 'Escape') { if (LU.sheet) lrSheetClose(); else if (LU.roomPick != null) { LU.roomPick = null; lrDraw(); } else if (LU.sel) { LU.sel = null; lrDraw(); } } if (LU.phase === 'fight' && (e.key === ' ' || e.key === 'p')) { LU.paused = !LU.paused; lrFightPanel(); e.preventDefault(); } if (LU.phase === 'fight' && e.key.length === 1 && '123'.includes(e.key)) lrSpeedSet(LSPD[+e.key - 1][0]); });
}
// 세로 폰에서 판 아래에 남는 높이(rest)를 잰다. 40 이상이면 tall, 86 이상이면 tall2: 준비 때는 다음 무리 줄과 큰 상점 카드, 싸움 때는 시너지 줄과 긴 기록
const LSIDE = 158;
function lrSize() {
  const cv = $('lr-cv'), wrap = $('lr-boardwrap'), lr = $('lr'), vw = window.innerWidth, vh = window.innerHeight, wide = vw >= 900, H = LU.wallH + LS * 6;
  lr.classList.toggle('wide', wide);
  if (cv.height !== H) cv.height = H;
  const barH = $('lr-bar').offsetHeight || (lr.classList.contains('replay') ? 40 : 68);
  const availH = vh - barH - (wide ? 20 : LSIDE + 6), availW = wide ? vw - 470 : vw;
  let sc = Math.min(availW / LW, availH / H); if (wide) sc = Math.min(sc, 1.75); sc = Math.max(0.6, sc);
  if (LU.replay && LU.crop && lrCropFit(availW, availH)) { lrPrepTags(); return; }
  LU.scale = sc; cv.style.width = Math.floor(LW * sc) + 'px'; cv.style.height = Math.floor(H * sc) + 'px'; wrap.style.width = Math.floor(LW * sc) + 'px'; wrap.style.height = Math.floor(H * sc) + 'px';
  const rest = wide ? 0 : vh - barH - Math.floor(H * sc) - LSIDE, t1 = rest >= 40, t2 = rest >= 86, ch = lr.classList.contains('tall') !== t1 || lr.classList.contains('tall2') !== t2;
  lr.classList.toggle('tall', t1); lr.classList.toggle('tall2', t2); LU.rest = rest;
  if (ch && LU.R) { if (LU.phase === 'fight') lrFightPanel(); else lrInfo(); }
  lrPrepTags();
}
// run: 이어할 판(lairSaved() 가 돌려준 것). 없으면 새 판
function lairOpen(run) {
  lrMount(); const t = $('title'); if (t) t.hidden = true; $('lr').hidden = false;
  try { LU.wallH = LAIRART.wallTop(LS, 6, 0).height; } catch (e) { LU.wallH = 45; }
  lrNew(0, run); if (!LU.raf) { LU.last = performance.now(); LU.raf = requestAnimationFrame(lrLoop); }
}
function lrNew(seed, run) {
  LU.seed = run ? run.seed : seed || ((Date.now() % 1000000) + 1); LU.R = run || LAIR.newRun(LU.seed); LU.phase = 'prep'; LU.sel = null; LU.roomPick = null; LU.F = null; LU.res = null; LU.sheet = null; LU.speed = lrSpeedLoad(); LU.paused = false; LU.bg = null; LU.flow = false;
  const coachOk = !(navigator.webdriver && !window.__lairCoach); LU.tut = coachOk && !(META && META.lairTut) ? 0 : -1;
  $('lr-sheet').hidden = true; $('lr').classList.remove('sheeton'); $('lr-ov').innerHTML = ''; lrDraw(); lrSize(); lrWarmPrep();
  try { if (typeof music === 'function') music('day'); } catch (e) { /* 음악 없이 */ }
  try { if (typeof traceLive === 'function') traceLive({ start: !run }); } catch (e) { /* 기록 없이 */ }
  lrFlow();
}
function lrExit() { lrSave(); try { if (typeof traceLive === 'function') { TRACE.last = 0; traceLive({ left: true }); } } catch (e) { /* 기록 없이 */ } $('lr').hidden = true; cancelAnimationFrame(LU.raf); LU.raf = 0; LU.F = null; LU.phase = 'prep'; LU.sheet = null; $('lr-sheet').hidden = true; $('lr').classList.remove('sheeton'); if (typeof showTitle === 'function') showTitle(); }
// 고를 것이 있으면(보상, 신화 단계, 조우) 고르는 화면에 넘기고, 끝나면 준비 화면으로 돌아온다
function lrFlow() {
  const R = LU.R; if (!R || LU.flow || typeof LF === 'undefined' || !LF.pending(R)) return false;
  LU.flow = true; $('lr-coach').hidden = true; const rooms0 = R.roomOffer.length, lv0 = R.level;
  LF.run(R, () => { LU.flow = false; lrSave(); lrBossIconsReset(); lrWarmPrep(); lrDraw(); lrSize(); if (R.roomOffer.length > rooms0) lrToast('방을 얻었다. 「방」을 눌러 깐다.'); else if (R.level > lv0) lrToast('둥지 Lv ' + R.level); });
  return true;
}
// 본체의 모습이 바뀌면 초상을 다시 그린다
function lrBossIconsReset() { Object.keys(LURL).forEach(k => { if (k.indexOf('boss:') === 0) delete LURL[k]; }); }

// ---- 저장, 본 것, 지난 판 ----
// 저장은 준비 때마다(무언가 바꿀 때마다) 그리고 싸움을 시작한 직후에 한다. 싸움 결과는 시작할 때 이미 정해지므로, 싸움 도중에 나가면 다음 준비(또는 고르는 화면)에서 잇는다.
const LSAVE = 'lairrun';
function lrSave() { const R = LU.R; try { if (!R || typeof store === 'undefined') return; if (R.phase === 'over') store.del(LSAVE); else store.set(LSAVE, JSON.parse(LAIR.save(R))); } catch (e) { /* 저장 없이 */ } }
// 이어할 판이 있으면 돌려준다. 읽지 못하거나 규칙 판이 다르면 치우고 null
function lairSaved() {
  let raw = null; try { raw = typeof store === 'undefined' ? null : store.get(LSAVE); } catch (e) { raw = null; } if (raw == null) return null;
  try { const R = LAIR.load(raw); if (R && R.phase !== 'over' && !R.taste && Array.isArray(R.shop) && Array.isArray(R.rooms) && isFinite(R.round) && isFinite(R.hp)) { LAIR.view(R); return R; } } catch (e) { /* 아래에서 치운다 */ }
  try { store.set('old.' + LSAVE, raw); store.del(LSAVE); } catch (e) { /* 저장 없이 */ } return null;
}
// 도감에 쓸 것: 가게에 나왔거나 가진 권속(별), 마주친 침입자, 받은 방, 본체의 모습
function lrSeen(v) {
  try { if (!META || !META.seen) return; const S = META.seen; let ch = false; const mark = (k, id, n) => { if (!S[k]) S[k] = {}; if (id && (S[k][id] || 0) < n) { S[k][id] = n; ch = true; } };
    v.shop.forEach(q => { if (q) mark('kin', q.kind, 1); }); v.bench.forEach(u => { if (u) mark('kin', u.kind, 1 + u.star); }); v.board.forEach(u => mark('kin', u.kind, 1 + u.star));
    v.enemy.forEach(e => mark('inv', e.kind, 1)); v.roomOffer.forEach(r => mark('room', r.id, 1)); v.rooms.forEach(r => mark('room', r.id, 2)); if (v.form) mark('form', v.form.form, Math.max(1, v.form.step || 0));
    if (ch) saveMeta(); } catch (e) { /* 저장 없이 */ }
}
// 판 내내 누가 얼마나 했나 (판 끝 화면에 쓴다). R 에 얹어 두어 이어하기에도 남는다
function lrTally(f) { const R = LU.R; try { const T = R.uiTop = R.uiTop || {}; f.breakdown.forEach(b => { if (b.side !== 'nest' || b.summon || b.kind === 'core' || !LAIR.KIN[b.kind]) return; T[b.kind] = Math.round((T[b.kind] || 0) + b.dmg + b.san); }); } catch (e) { /* 없어도 된다 */ } }
// 판이 끝나면 한 줄 남긴다. 최근 10판
function lrRecord(f) {
  const R = LU.R; if (!R || !R.over) return;
  try { if (!META) return; const team = f.units.filter(u => u.side === 'nest' && !u.core && !u.summon && LAIR.KIN[u.kind]).map(u => [u.kind, u.star || 1]).slice(0, 12);
    META.last = (META.last || []).concat([{ t: Date.now(), win: !!R.over.win, round: R.over.round || R.round, rounds: R.rounds, act: R.over.act || R.act, hp: Math.max(0, R.hp), level: R.level, form: R.awake ? R.form : 'drop', step: R.awake || 0, mythos: R.mythos ? R.mythos.picked.slice() : [], team, wins: R.hist.filter(h => h.win).length }]).slice(-10);
    META.runs = (META.runs || 0) + 1; if (R.over.win) META.wins = (META.wins || 0) + 1; saveMeta(); } catch (e) { /* 저장 없이 */ }
  try { if (typeof traceEnd === 'function') traceEnd(R.over.win ? 'win' : 'lose'); } catch (e) { /* 기록 없이 */ }
}

// ---- 준비 화면 (DOM) ----
const LROM = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'];
// 위쪽 두 줄: 진액 · 레벨 · 연속 · 목숨 · 공포와 깨어남 · 메뉴 / 막과 열다섯 라운드
function lrBarHtml(v) {
  const hist = {}; (v.hist || []).forEach(h => { hist[h.round] = h.win ? 'w' : 'l'; });
  const my = (LAIR.K.full.mythosAt || []), cells = []; for (let r = 1; r <= v.rounds; r++) { const boss = r % v.per === 0, cls = ['lr-tc']; if (r < v.round) cls.push(hist[r] === 'l' ? 'l' : 'w'); if (r === v.round) cls.push('cur'); if (boss) cls.push('boss'); if (my.includes(r)) cls.push(v.mythos && v.mythos.phase > my.indexOf(r) ? 'myd' : 'my'); cells.push(`<i class="${cls.join(' ')}"></i>` + (boss && r < v.rounds ? '<i class="lr-tg"></i>' : '')); }
  const s = v.streak || 0, aw = v.awaken, fearTo = aw.next || aw.max, here = (v.cast || []).filter(c => c.here);
  const notes = here.map(c => `<button class="lr-castb" data-l="cast" data-id="${c.id}" aria-label="${esc(c.name)}"><img src="${lrIcon(lrCastIcon(c, v), 1, 26)}" alt=""></button>`).join('') + (v.zealots ? `<button class="lr-note2 z" data-l="run" aria-label="광신도 ${v.zealots}"><img src="${lrIcon('zealot', 1, 22)}" alt="">${v.zealots}</button>` : '') + (v.curses && v.curses.length ? `<button class="lr-note2 c" data-l="run" aria-label="저주 ${v.curses.length}"><i></i>${v.curses.length}</button>` : '');
  return `<div class="lr-b1"><button class="lr-stat lr-gold" data-l="econ" aria-label="진액 ${v.gold}"><i></i>${v.gold}</button><button class="lr-stat lr-lv" data-l="econ" aria-label="둥지 레벨 ${v.level}, 세운 수 ${v.placed}/${v.cap}">Lv ${v.level}<small>${v.placed}/${v.cap}</small></button>${Math.abs(s) >= 2 ? `<button class="lr-stat lr-strk ${s > 0 ? 'w' : 'l'}" data-l="econ" aria-label="${s > 0 ? '연승' : '연패'} ${Math.abs(s)}"><i></i>${Math.abs(s)}</button>` : ''}<button class="lr-stat lr-hp" data-l="run" aria-label="목숨 ${v.hp}"><i></i>${v.hp}</button><button class="lr-stat lr-fear${aw.world ? ' w' + aw.world : ''}" data-l="core" aria-label="깨어남 ${aw.step}, 공포 ${aw.fear}"><i class="lr-eye"></i><span class="lr-pips">${[1, 2, 3].map(k => `<i class="${aw.step >= k ? 'on' : ''}"></i>`).join('')}</span>${aw.fear}/${fearTo}</button><button class="lr-menu" data-l="menu" aria-label="메뉴"><i></i></button></div>
<div class="lr-b2"><button class="lr-trackb" data-l="run" aria-label="${v.act}막 ${v.rin}/${v.per}"><b class="lr-act">${LROM[v.act] || v.act}</b><span class="lr-track">${cells.join('')}</span></button>${notes ? `<span class="lr-notes">${notes}</span>` : ''}</div>`;
}
// 조사자의 초상 id: 홀린 채 왔으면 '/poss', 다쳤거나 미쳤다가 돌아왔으면 '/hurt'
function lrCastSt(c, v) { const e = v && v.enemy ? v.enemy.find(q => q.cast === c.id) : null; return (e && e.poss) || c.state === 'eaten' ? 'poss' : c.state === 'mad' || c.state === 'hurt' ? 'hurt' : ''; }
function lrCastIcon(c, v) { const st = lrCastSt(c, v); return st ? c.kind + '/' + st : c.kind; }
// 좁은 화면이나 큰 글씨에서 위 줄이 넘치면 덜 중요한 것부터 접는다 (세운 수 → 깨어남 눈금)
function lrBarFit() { const bar = $('lr-bar'), b1 = bar.querySelector('.lr-b1'); bar.classList.remove('t1', 't2'); if (!b1) return; if (b1.scrollWidth > b1.clientWidth + 1) bar.classList.add('t1'); if (b1.scrollWidth > b1.clientWidth + 1) bar.classList.add('t2'); }
function lrDraw() {
  const fight = LU.phase === 'fight', v = fight && LU.F ? LU.F.v0 : lrView();
  $('lr-bar').innerHTML = lrBarHtml(v); lrBarFit(); requestAnimationFrame(lrBarFit);
  $('lr').classList.toggle('nomo', typeof motionOk === 'function' && !motionOk());
  $('lr-bench').hidden = fight; $('lr-shop').hidden = fight; $('lr-fight').hidden = !fight;
  if (fight) { $('lr-info').hidden = true; lrFightPanel(); lrTop(v); lrCoach(); return; }
  const selU = LU.sel && LU.sel.uid, nR = v.roomOffer.length, maxed = v.level >= v.maxLv;
  $('lr-bench').innerHTML = v.bench.map((u, i) => u ? `<div class="lr-slot has${selU === u.uid ? ' on' : ''}${LU.pops[u.uid] > LU.t ? ' pop' : ''}" data-bench="${i}" data-u="${u.uid}" role="button" aria-label="${esc(u.name)} ${u.star}성 ${esc(u.roleName)}"><img src="${lrIcon(u.kind, u.star, 44)}" alt="">${lrStars(u.star)}${lrRoleImg(u.role, 18)}</div>` : `<div class="lr-slot" data-bench="${i}"></div>`).join('')
    + `<button class="lr-roombtn${nR ? ' pri' : ''}" data-l="room"${nR ? '' : ' disabled'}>${LU.roomPick != null ? '취소' : '방' + (nR > 1 ? ' ' + nR : '')}</button>`;
  $('lr-shop').innerHTML = `<div class="lr-acts"><button data-l="reroll"${v.canReroll ? '' : ' disabled'}${v.freeRoll ? ' class="free"' : ''}>뽑기 ${v.costs.reroll}</button><button data-l="xp"${v.canXp ? '' : ' disabled'}>${maxed ? 'Lv ' + v.level : '넓히기 ' + v.costs.xp}${maxed ? '' : `<i class="lr-xp"><b style="width:${v.xpNeed ? Math.round(v.xp / v.xpNeed * 100) : 100}%"></b></i>`}</button></div>`
    + v.shop.map((s, i) => s ? `<button class="lr-card c${s.cost}${LU.sel && LU.sel.shop === i ? ' on' : ''}${s.can ? '' : ' poor'}" data-l="shop" data-i="${i}"><img src="${lrIcon(s.kind, 1, 44)}" alt="">${lrRoleImg(s.role, 18)}<b>${esc(s.name)}</b><span class="lr-cmeta"><img src="${lrSym(s.asp, 16)}" alt="${esc(s.aspName)}"><img src="${lrSym(s.cls, 16)}" alt="${esc(s.clsName)}"><em>${s.cost}</em></span><small class="lr-reach">${esc(s.reach)}</small><small class="lr-skn">${esc(s.skill.name)}</small></button>` : '<div class="lr-card empty"></div>').join('');
  lrTop(v); lrInfo(v); lrPrepTags(v); lrCoach(); lrRowTip(); lrSeen(v); if (!LU.flow) lrSave();
}
// 준비 때 조사자의 머리 위에 이름을 띄운다
function lrPrepTags(v) {
  const ov = $('lr-ov'); if (!ov || LU.phase !== 'prep') return; ov.querySelectorAll('.lr-tag').forEach(e => e.remove()); const sc = LU.scale || 1; v = v || lrView();
  v.enemy.forEach(e => { if (!e.cast) return; const d = document.createElement('span'); d.className = 'lr-tag'; d.textContent = e.name; const hw = (e.name.length * 12 + 12) / 2; d.style.left = Math.max(hw + 2, Math.min(LW * sc - hw - 2, lcx(e.cell) * sc)) + 'px'; d.style.top = ((lcy(e.cell) + 23) * sc) + 'px'; ov.appendChild(d); });
}
// 처음 권속을 집었을 때 한 번: 어느 줄에 세우는지
function lrRowTip() { if (!(LU.sel && LU.sel.uid) || LU.phase !== 'prep' || (navigator.webdriver && !window.__lairCoach)) return; try { if (!META || META.lairRow) return; META.lairRow = 1; saveMeta(); } catch (e) { return; } lrToast('탱커는 앞줄, 원거리는 뒷줄에 세운다.'); LU.toastT = LU.t + 4200; }
// 벽 위의 줄: 고른 것이 있으면 그 이름과 단추, 없으면 시너지와 「싸운다」
function lrTop(v) {
  const top = $('lr-top'); top.hidden = LU.phase === 'fight'; if (LU.phase === 'fight') { top.innerHTML = ''; return; }
  if (LU.roomPick != null) { const r = v.roomOffer[LU.roomPick]; top.innerHTML = r ? `<div class="lr-selinfo"><img src="${lrRoomIcon(r.id)}" alt=""><span><b>${esc(r.name)}</b><small>${esc(r.short)}</small></span></div><span class="lr-hint">빛나는 칸</span>` : ''; return; }
  const s = LU.sel;
  if (s && s.shop != null && v.shop[s.shop]) { const u = v.shop[s.shop]; top.innerHTML = `<div class="lr-selinfo" data-l="info" data-kind="${u.kind}" data-star="1"><img src="${lrIcon(u.kind, 1, 36)}" alt=""><span><b>${esc(u.name)}</b><small>${lrRoleImg(u.role, 18)}${esc(u.roleName)} · ${u.range}칸 · ${esc(u.skill.name)}</small></span></div><button class="pri" data-l="buy" data-i="${s.shop}"${u.can ? '' : ' disabled'}>산다 ${u.cost}</button>`; return; }
  if (s && s.uid && LU.R.unit[s.uid]) { const u = LAIR.unitInfo(LU.R.unit[s.uid].kind, LU.R.unit[s.uid].star); top.innerHTML = `<div class="lr-selinfo" data-l="info" data-kind="${u.kind}" data-star="${u.star}"><img src="${lrIcon(u.kind, u.star, 36)}" alt=""><span><b>${esc(u.name)} ${lrStars(u.star)}</b><small>${lrRoleImg(u.role, 18)}${esc(u.roleName)} · ${u.range}칸 · ${esc(u.skill.name)}</small></span></div><button data-l="sell" data-u="${s.uid}">팔기 ${LAIR.sellValue(LU.R.unit[s.uid])}</button>`; return; }
  top.innerHTML = `<div class="lr-syns">${lrSynChips(v) || '<span class="lr-hint">권속을 세운다</span>'}</div>${v.elite ? `<button class="lr-elite${v.elite.on ? ' on' : ''}" data-l="elite" aria-pressed="${!!v.elite.on}">정예</button>` : ''}<button class="pri" data-l="fight"${v.placed ? '' : ' disabled'}>싸운다</button>`;
}
function lrSynChips(v, only) { const all = v.synergies.filter(s => !only || only[s.id]), max = only ? 6 : 4, show = all.length > max ? all.slice(0, max - 1) : all; return show.map(s => `<button class="lr-syn t${s.tier}" data-l="syn" data-id="${s.id}"><img src="${lrSym(s.id, 16)}" alt="${esc(s.name)}">${s.n}/${s.next || s.need[s.need.length - 1]}</button>`).join('') + (all.length > show.length ? `<button class="lr-syn" data-l="syns">+${all.length - show.length}</button>` : ''); }
function lrFightPanel() {
  const F = LU.F; if (!F) return; const lr = $('lr'), roomy = lr.classList.contains('wide') || lr.classList.contains('tall');
  $('lr-fight').innerHTML = `<div class="lr-speed">${LSPD.map(q => `<button data-l="speed" data-v="${q[0]}" class="${LU.speed === q[0] ? 'on' : ''}" aria-pressed="${LU.speed === q[0]}">${q[1]}</button>`).join('')}<button data-l="pause" class="${LU.paused ? 'on' : ''}">${LU.paused ? '이어서' : '멈춤'}</button></div>${F.chips && roomy ? `<div class="lr-syns">${F.chips}</div>` : ''}<div id="lr-meter">${lrMeterHtml()}</div><div id="lr-feed"></div>`;
  const fd = $('lr-feed'), side = $('lr-side'), room = lr.classList.contains('wide') ? 150 : side.getBoundingClientRect().bottom - fd.getBoundingClientRect().top - 2; LU.feedN = Math.max(1, Math.min(5, Math.floor((room + 2) / 30))); fd.innerHTML = lrFeedHtml();
}
// 누가 얼마나: 싸우는 동안 살아 있는 막대. 위 넷 (피해는 주황, 정신 피해는 보라)
function lrMeterHtml() {
  const F = LU.F; if (!F) return ''; const M = F.meter, rows = Object.keys(M).map(k => M[k]).filter(r => r.dmg + r.san > 0).sort((a, b) => (b.dmg + b.san) - (a.dmg + a.san)).slice(0, 4), mx = Math.max(1, ...rows.map(r => r.dmg + r.san));
  return rows.map(r => `<p><img src="${lrIcon(r.icon, r.star, 24)}" alt=""><span class="lr-mn">${esc(r.name)}</span><span class="lr-mb"><b style="width:${(r.dmg / mx * 100).toFixed(1)}%"></b><i style="width:${(r.san / mx * 100).toFixed(1)}%"></i></span><em>${Math.round(r.dmg + r.san)}</em></p>`).join('');
}
function lrMeterAdd(F, by, dmg, san) {
  if (!by || by.side !== 'nest' || !(dmg > 0 || san > 0)) return; const k = by.core ? 'core' : by.summon ? 's:' + by.kind : by.id;
  const r = F.meter[k] = F.meter[k] || { name: by.name, icon: by.core ? 'boss:' + (by.form || 'drop') + ':' + F.step : by.kind, star: by.core || by.summon ? 1 : by.star, dmg: 0, san: 0 }; r.dmg += dmg || 0; r.san += san || 0; F.meterDirty = true;
}
// 방금 일어난 큰 일: 큰 스킬, 미침, 값진 것의 죽음, 신화의 권능, 큰 판정
function lrFeed(F, e, text, cls) { F.feed.push({ img: e && e.img ? e.img : null, icon: e && !e.img ? (e.core ? 'boss:' + (e.form || 'drop') + ':' + F.step : e.cast && e.artSt ? e.kind + '/' + e.artSt : e.kind) : null, star: e && !e.core && e.side === 'nest' ? e.star : 1, name: e ? e.name : '', sk: text, side: e ? (e.side === 'nest' ? 'nest' : 'inv') : 'boon', cls: cls || '' }); if (F.feed.length > 8) F.feed.shift(); const fd = $('lr-feed'); if (fd) fd.innerHTML = lrFeedHtml(); }
function lrFeedHtml() { const F = LU.F, n = LU.feedN || 2; return F ? F.feed.slice(-n).reverse().map(f => `<p class="${f.side} ${f.cls}">${f.img ? `<img src="${f.img}" alt="">` : f.icon ? `<img src="${lrIcon(f.icon, f.star, 28)}" alt="">` : '<i class="lr-eye"></i>'}${f.name ? `<b>${esc(f.name)}</b>` : ''}<span>${esc(f.sk)}</span></p>`).join('') : ''; }
// 준비 때 높은 화면의 남는 자리: 다음 무리의 이름과 얼굴들
function lrInfo(v) {
  const el = $('lr-info'); if (!el) return; const show = LU.phase === 'prep' && $('lr').classList.contains('tall'); el.hidden = !show; if (!show) return; v = v || lrView();
  const g = {}, order = []; v.enemy.forEach(e => { const k = e.cast ? 'c:' + e.cast : e.kind; if (!g[k]) { g[k] = { e, n: 0 }; order.push(k); } g[k].n++; });
  order.sort((a, b) => (g[b].e.boss ? 4 : g[b].e.cast ? 3 : g[b].e.elite ? 2 : 1) - (g[a].e.boss ? 4 : g[a].e.cast ? 3 : g[a].e.elite ? 2 : 1));
  el.innerHTML = `<span class="lr-rn" role="button" tabindex="0" data-l="run">${esc(v.roundName)}</span><span class="lr-foes">${order.slice(0, 7).map(k => { const q = g[k], e = q.e, c = e.cast ? (v.cast || []).find(x => x.id === e.cast) : null; return `<span role="button" tabindex="0" data-l="${e.cast ? 'cast' : 'invinfo'}" data-id="${e.cast || e.kind}" class="lr-foe ${e.boss ? 'boss' : e.cast ? 'cast' : e.elite ? 'elite' : ''}" aria-label="${esc(e.name)} ${q.n}"><img src="${lrIcon(c ? lrCastIcon(c, v) : e.kind, 1, 28)}" alt="">${q.n > 1 ? `<em>${q.n}</em>` : ''}</span>`; }).join('')}</span>`;
  lrInfoFit(); requestAnimationFrame(lrInfoFit);
}
// 이름이 길거나 글씨가 크면 얼굴을 뒤에서부터 덜어 낸다
function lrInfoFit() { const el = $('lr-info'); if (!el || el.hidden) return; const foes = el.querySelector('.lr-foes'); let n = 0; while (foes && el.scrollWidth > el.clientWidth + 1 && foes.children.length > 2 && n++ < 6) foes.lastChild.remove(); }
function lrToast(msg) { const t = $('lr-toast'), r = $('lr-boardwrap').getBoundingClientRect(); t.textContent = msg; t.hidden = false; t.style.left = (r.left + r.width / 2) + 'px'; t.style.top = (r.top + (LU.phase === 'fight' ? 50 : LU.wallH + LS * 3 - 18) * (LU.scale || 1)) + 'px'; LU.toastT = LU.t + 1600; }

// ---- 길잡이 ----
function lrCoach() {
  const c = $('lr-coach'); if (LU.tut < 0 || LU.tut >= LTUT.length || LU.sheet || LU.flow) { c.hidden = true; return; }
  const v = lrView(), R = LU.R;
  if (LU.phase === 'prep') {
    if (LU.tut === 0 && Object.keys(R.unit).length) LU.tut = 1;
    if (LU.tut === 1 && v.placed) LU.tut = 2;
    if (LU.tut === 2 && !v.synergies.length) LU.tut = 3;
  } else { LU.tut = LTUT.length; if (META) { META.lairTut = 1; try { saveMeta(); } catch (e) { /* 저장 없이 */ } } c.hidden = true; return; }
  const st = LTUT[LU.tut], at = lq(st.at); if (!at) { c.hidden = true; return; }
  c.innerHTML = `<p>${esc(st.text)}</p><span>${st.ok ? '<button data-l="tutok">알았다</button>' : ''}<button data-l="tutoff">안내 끄기</button></span>`; c.hidden = false;
  const r = at.getBoundingClientRect(), cw = Math.min(300, window.innerWidth - 16); c.style.width = cw + 'px';
  const ch = c.offsetHeight || 70, wide = $('lr').classList.contains('wide'), sr = $('lr-side').getBoundingClientRect(), inSide = wide && at.closest('#lr-side'), below = r.top < 150;
  if (inSide) { c.style.left = sr.left + 'px'; c.style.top = (sr.bottom + 12) + 'px'; } else { c.style.left = Math.max(8, Math.min(window.innerWidth - cw - 8, r.left + r.width / 2 - cw / 2)) + 'px'; c.style.top = (below ? r.bottom + 10 : r.top - ch - 10) + 'px'; }
  document.querySelectorAll('#lr .lr-glow').forEach(e => e.classList.remove('lr-glow')); at.classList.add('lr-glow');
}

// ---- 누르기 ----
function lrClick(e) {
  if (e.target.id === 'lr-sheet' && LU.sheet && LU.sheet.kind !== 'result') return lrSheetClose();
  if (e.target.id === 'lr-cv' && LU.phase === 'fight' && LU.F && !LU.sheet && !LU.replay) { const r = e.target.getBoundingClientRect(), px = (e.clientX - r.left) / LU.scale, py = (e.clientY - r.top) / LU.scale; let best = null, bd = 34; for (const id in LU.F.ents) { const q = LU.F.ents[id]; if (q.dead || q.summon) continue; const d = Math.hypot(q.x - px, q.y - 8 - py) * (q.core ? 0.6 : 1); if (d < bd) { bd = d; best = q; } } if (best) lrSheet(best.core ? { kind: 'core' } : best.cast ? { kind: 'cast', id: best.cast } : best.side === 'inv' ? { kind: 'inv', id: best.kind } : { kind: 'unit', id: best.kind, star: best.star }); return; }
  const b = e.target.closest('[data-l]'); if (!b || b.disabled) return; const a = b.dataset.l, R = LU.R;
  if (a === 'exit') { if (LU.sheet && LU.sheet.kind === 'result' && R.phase === 'over') { LU.sheet = null; $('lr-sheet').hidden = true; $('lr').classList.remove('sheeton'); } return lrExit(); }
  if (a === 'tutoff') { LU.tut = -1; if (META) { META.lairTut = 1; try { saveMeta(); } catch (er) { /* 저장 없이 */ } } $('lr-coach').hidden = true; document.querySelectorAll('#lr .lr-glow').forEach(x => x.classList.remove('lr-glow')); return; }
  if (a === 'tutok') { LU.tut++; return lrCoach(); }
  if (a === 'close') return lrSheetClose();
  if (a === 'speed') { lrSpeedSet(+b.dataset.v); if (LU.sheet && LU.sheet.kind === 'menu') lrSheet({ kind: 'menu' }); return; }
  if (a === 'pause') { LU.paused = !LU.paused; return lrFightPanel(); }
  if (a === 'rskip') { if (LU.replay && LU.replay.skip) LU.replay.skip(); return; }
  if (LU.replay) return;
  if (a === 'next') return lrNext();
  if (a === 'again') { lrSheetClose(); return lrNew(); }
  if (a === 'syn') return lrSheet({ kind: 'syn', id: b.dataset.id });
  if (a === 'syns') return lrSheet({ kind: 'syns' });
  if (a === 'info') return lrSheet({ kind: 'unit', id: b.dataset.kind, star: +b.dataset.star || 1 });
  if (a === 'roominfo') return lrSheet({ kind: 'room', id: b.dataset.id });
  if (a === 'econ' || a === 'run' || a === 'core' || a === 'menu') { lrSay('click'); return lrSheet({ kind: a }); }
  if (a === 'cast') return lrSheet({ kind: 'cast', id: b.dataset.id });
  if (a === 'invinfo') return lrSheet({ kind: 'inv', id: b.dataset.id });
  if (a === 'tog') { const k = b.dataset.v; META[k] = !(k === 'sound' ? META.sound : META[k] !== false); try { saveMeta(); if (k === 'music' && typeof musicSet === 'function') musicSet(META.music); } catch (er) { /* 저장 없이 */ } return lrSheet({ kind: 'menu' }); }
  if (LU.phase !== 'prep' || LU.flow) return;
  if (a === 'shop') { const i = +b.dataset.i; if (LU.sel && LU.sel.shop === i) return lrBuy(i); LU.sel = { shop: i }; lrSay('click'); return lrDraw(); }
  if (a === 'buy') return lrBuy(+b.dataset.i);
  if (a === 'sell') { const r = LAIR.sell(R, +b.dataset.u); if (r.ok) { lrSay('coin'); LU.sel = null; } else lrToast(r.msg); return lrDraw(); }
  if (a === 'reroll') { const r = LAIR.reroll(R); if (r.ok) { lrSay('slide'); if (LU.sel && LU.sel.shop != null) LU.sel = null; lrWarmPrep(); } else lrToast(r.msg); return lrDraw(); }
  if (a === 'xp') { const r = LAIR.buyXp(R); if (r.ok) { lrSay(r.up ? 'up' : 'click'); if (r.up) lrToast('둥지 Lv ' + R.level); } else lrToast(r.msg); return lrDraw(); }
  if (a === 'room') { if (LU.roomPick != null) { LU.roomPick = null; return lrDraw(); } return lrSheet({ kind: 'rooms' }); }
  if (a === 'pickroom') { LU.roomPick = +b.dataset.i; LU.sel = null; lrSheetClose(); return lrDraw(); }
  if (a === 'elite') return lrSheet({ kind: 'elite' });
  if (a === 'eliteset') { const r = LAIR.setElite(R, b.dataset.v === '1'); if (!r.ok) lrToast(r.msg); else lrSay('thud'); lrSheetClose(); lrWarmPrep(); return lrDraw(); }
  if (a === 'fight') return lrFight();
}
function lrBuy(i) {
  const R = LU.R, r = LAIR.buy(R, i); if (!r.ok) { lrToast(r.msg); return lrDraw(); }
  lrSay('coin'); LU.sel = null; (r.merged || []).forEach(m => lrMergePop(m)); lrWarmPrep(); lrDraw();
}
function lrMergePop(m) { LU.pops[m.uid] = LU.t + 900; lrSay('combo'); const w = LAIR.whereOf(LU.R, m.uid); if (w && w.cell != null) LU.cellPop = { cell: w.cell, t0: LU.t }; lrToast(LAIR.KIN[m.kind].name + ' ' + '★'.repeat(m.star)); }
// 판의 칸을 찾는다 (화면 좌표 → 칸)
function lrCellAt(cx, cy) { const cv = $('lr-cv'), r = cv.getBoundingClientRect(), x = (cx - r.left) / LU.scale, y = (cy - r.top) / LU.scale - LU.wallH; if (x < 0 || y < 0 || x >= LW || y >= LS * 6) return -1; return Math.floor(y / LS) * 6 + Math.floor(x / LS); }
function lrUnitAtCell(c) { const R = LU.R; if (R.board[c]) return { uid: R.board[c] }; if (LAIR.CORE.includes(c)) return { core: true }; const e = LAIR.curEnemy(R).find(q => q.cell === c); return e ? { enemy: e } : null; }
function lrDown(e) {
  if (LU.phase !== 'prep' || LU.sheet || LU.flow) return; const slot = e.target.closest('.lr-slot'), onCv = e.target.id === 'lr-cv';
  if (!slot && !onCv) return;
  let uid = null, cell = -1;
  if (slot) uid = slot.dataset.u ? +slot.dataset.u : null; else { cell = lrCellAt(e.clientX, e.clientY); const u = cell >= 0 ? lrUnitAtCell(cell) : null; uid = u && u.uid ? u.uid : null; }
  LU.drag = { uid, cell, bench: slot ? +slot.dataset.bench : null, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
  if (uid) e.preventDefault();
}
function lrMove(e) {
  const d = LU.drag; if (!d || !d.uid) return; d.lx = e.clientX; d.ly = e.clientY; if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 10) return;
  if (!d.moved) { d.moved = true; LU.sel = { uid: d.uid }; const u = LU.R.unit[d.uid], g = $('lr-drag'); g.src = lrIcon(u.kind, u.star, 44); g.hidden = false; lrDraw(); }
  const g = $('lr-drag'); g.style.left = (e.clientX - 28) + 'px'; g.style.top = (e.clientY - 44) + 'px'; LU.hover = lrCellAt(e.clientX, e.clientY);
}
// 끌던 중에 취소되면 손가락이 마지막에 있던 자리에 놓는다
function lrCancel() { const d = LU.drag; if (d && d.moved && d.lx != null) return lrUp({ clientX: d.lx, clientY: d.ly }); LU.drag = null; $('lr-drag').hidden = true; LU.hover = -1; }
function lrUp(e) {
  const d = LU.drag; LU.drag = null; $('lr-drag').hidden = true; LU.hover = -1; if (!d || LU.phase !== 'prep') return; const R = LU.R;
  if (d.moved) {
    const el = document.elementFromPoint(e.clientX, e.clientY), slot = el && el.closest('.lr-slot'), cell = lrCellAt(e.clientX, e.clientY);
    if (slot) lrMoveTo(d.uid, { bench: +slot.dataset.bench }); else if (el && el.closest('#lr-shop')) { const r = LAIR.sell(R, d.uid); if (r.ok) { lrSay('coin'); LU.sel = null; } lrDraw(); } else if (cell >= 0) lrMoveTo(d.uid, { cell }); else lrDraw();
    return;
  }
  // 누르기
  if (d.bench != null) { if (LU.sel && LU.sel.uid && LU.sel.uid !== d.uid) return lrMoveTo(LU.sel.uid, { bench: d.bench }); if (d.uid) { LU.sel = LU.sel && LU.sel.uid === d.uid ? null : { uid: d.uid }; lrSay('click'); } return lrDraw(); }
  const cell = d.cell; if (cell < 0) return;
  if (LU.roomPick != null) return lrPlaceRoom(cell);
  const u = lrUnitAtCell(cell);
  if (LU.sel && LU.sel.uid && LAIR.isNestCell(cell) && !(u && u.core) && !(u && u.uid === LU.sel.uid)) return lrMoveTo(LU.sel.uid, { cell });
  if (u && u.uid) { LU.sel = LU.sel && LU.sel.uid === u.uid ? null : { uid: u.uid }; lrSay('click'); return lrDraw(); }
  if (u && u.enemy) return lrSheet(u.enemy.cast ? { kind: 'cast', id: u.enemy.cast } : { kind: 'inv', id: u.enemy.kind, cell: u.enemy.cell });
  if (u && u.core) return lrSheet({ kind: 'core' });
  const rm = LU.R.rooms.find(r => r.cells.includes(cell)); if (rm && !LU.sel) return lrSheet({ kind: 'room', id: rm.id });
  LU.sel = null; lrDraw();
}
function lrMoveTo(uid, to) {
  const R = LU.R; if (to.cell != null && (!LAIR.isNestCell(to.cell) || LAIR.CORE.includes(to.cell))) { lrToast('세울 수 없는 칸이다'); return lrDraw(); }
  const r = LAIR.move(R, uid, to); if (r.ok) { lrSay(to.cell != null ? 'thud' : 'click'); LU.sel = null; if (to.cell != null) LU.cellPop = { cell: to.cell, t0: LU.t, soft: 1 }; } else lrToast(r.msg);
  lrDraw();
}
function lrPlaceRoom(cell) {
  const R = LU.R, v = lrView(), o = v.roomOffer[LU.roomPick]; if (!o) { LU.roomPick = null; return lrDraw(); }
  let spot = o.spots.includes(cell) ? cell : o.spots.find(s => LAIR.roomCells(o.id, s).includes(cell)); if (spot == null) { lrToast('놓을 수 없는 자리다'); return; }
  const r = LAIR.placeRoom(R, LU.roomPick, spot); if (r.ok) { lrSay('thud'); LU.roomPop = { cells: LAIR.roomCells(o.id, spot), t0: LU.t }; LU.roomPick = null; } else lrToast(r.msg); lrDraw();
}

// ---- 아래에서 올라오는 창 ----
const lrStat = (k, n) => `<span class="lr-st"><small>${k}</small><b>${n}</b></span>`;
const lrSkillHtml = (sk, extra) => (sk ? `<div class="lr-skill"><b>${esc(sk.name)}</b><span>${esc(sk.short)}</span><p>${esc(sk.more)}</p>${extra || ''}</div>` : '');
const lrTog = (k, name, on) => `<p class="lr-setrow"><span>${name}</span><button data-l="tog" data-v="${k}" class="${on ? 'on' : ''}" aria-pressed="${!!on}">${on ? '켬' : '끔'}</button></p>`;
function lrSheetView() { return LU.phase === 'fight' && LU.F ? LU.F.v0 : lrView(); }
function lrSheet(s) {
  LU.sheet = s; const el = $('lr-sheet'), v = lrSheetView(), R = LU.R; let h = ''; $('lr-toast').hidden = true; LU.toastT = 0;
  if (s.kind === 'unit') { const u = LAIR.unitInfo(s.id, s.star); h = `<div class="lr-shead"><canvas id="lr-prev" width="96" height="96"></canvas><div><h3>${esc(u.name)} ${lrStars(u.star)}</h3><p class="lr-tags">${lrRoleImg(u.role, 18)}<b class="lr-rolename">${esc(u.roleName)}</b> · ${esc(u.reach)} · 값 ${u.cost}</p><p class="lr-tags"><img src="${lrSym(u.asp, 16)}" alt="">${esc(u.aspName)} <img src="${lrSym(u.cls, 16)}" alt="">${esc(u.clsName)}</p></div></div><div class="lr-stats">${lrStat('체력', u.hp)}${lrStat('공격', u.atk)}${lrStat('방어', u.df)}${lrStat('닿는 칸', u.range)}${lrStat('마나', u.mana)}${u.sanAtk ? lrStat('정신 피해', u.sanAtk) : ''}</div>${lrSkillHtml(u.skill)}<p class="lr-note">${esc(LROLE[u.role] || '')}</p>`; }
  if (s.kind === 'inv') { const e = v.enemy.find(q => q.kind === s.id && (s.cell == null || q.cell === s.cell)) || (v.elite ? v.elite.enemy.find(q => q.kind === s.id) : null), u = e || LAIR.invInfo(s.id, v.round, LAIR.scaleOf(R));
    h = `<div class="lr-shead"><canvas id="lr-prev" width="96" height="96"></canvas><div><h3>${esc(u.name)}</h3><p class="lr-tags">${lrRoleImg(u.role, 18)}<b class="lr-rolename">${esc(u.roleName)}</b> · ${esc(u.reach)}${u.boss ? ' · 우두머리' : u.elite ? ' · 정예' : ''}</p></div></div><div class="lr-stats">${lrStat('체력', u.hp)}${lrStat('정신', u.noMad ? '—' : u.san)}${lrStat('의지', u.will || '—')}${lrStat('공격', u.atk)}${lrStat('방어', u.df)}${lrStat('닿는 칸', u.range)}</div>${lrSkillHtml(u.skill)}<p class="lr-note">${esc(LROLE[u.role] || '')}${u.will ? ' 공포 판정에서 의지만큼 주사위를 굴린다.' : ''}</p>`; }
  if (s.kind === 'cast') { const c = (v.cast || []).find(q => q.id === s.id) || LAIR.castInfo(R, s.id), e = v.enemy.find(q => q.cast === c.id);
    h = `<div class="lr-shead"><canvas id="lr-prev" width="96" height="96"></canvas><div><h3>${esc(c.name)}</h3><p class="lr-tags">${esc(c.role)}${c.here ? ' · 이번 무리' : ''}</p></div></div><div class="lr-stats">${lrStat('의지', c.will)}${lrStat('지식', c.lore)}${lrStat('힘', c.might)}${e ? lrStat('체력', e.hp) + lrStat('정신', e.noMad ? '—' : e.san) : ''}</div><p class="lr-nar">${esc(c.hist)}</p><p class="lr-note lr-cstate ${c.state}">${esc(c.note)}</p>${lrSkillHtml(c.skill)}${c.seen ? `<p class="lr-sum"><span>마주침 ${c.seen}</span>${c.mad ? `<span class="m">미침 ${c.mad}</span>` : ''}${c.killed ? `<span>쓰러짐 ${c.killed}</span>` : ''}${c.eaten ? `<span class="l">삼켜짐 ${c.eaten}</span>` : ''}</p>` : ''}`; }
  if (s.kind === 'core') { const f = v.form, aw = v.awaken, my = v.mythos;
    h = `<div class="lr-shead"><canvas id="lr-prev" width="96" height="96"></canvas><div><h3>${esc(f.name)}</h3><p class="lr-tags">본체 · 깨어남 ${aw.step}/3${my.next ? ' · 다음 신화 단계 ' + my.next + '라운드' : ''}</p></div></div><div class="lr-stats">${lrStat('체력', f.hp)}${lrStat('공격', f.atk)}${lrStat('닿는 칸', f.range)}${lrStat('마나', f.mana)}</div>${lrSkillHtml(f.skill, f.t2 ? `<p class="lr-t2">${esc(f.t2)}</p>` : '')}`
      + (my.picked.length ? `<h4>고른 신화</h4><div class="lr-cards">${my.picked.map(c => `<div class="lr-mc t${c.tier}"><p><img src="${lrSym(c.asp, 16)}" alt=""><b>${esc(c.name)}</b><small>${esc(c.tierName)}</small></p><span class="pw">${esc(c.power)}</span><span class="pr">${esc(c.price)}</span></div>`).join('')}</div>` : '')
      + `<h4>공포 ${aw.fear}/${aw.max}</h4><div class="lr-fearbar"><b style="width:${Math.round(aw.fear / aw.max * 100)}%"></b>${aw.effects.map(e => `<i style="left:${Math.round(e.at / aw.max * 100)}%"></i>`).join('')}</div><div class="lr-tiers">${aw.effects.map(e => `<p class="${e.on ? 'on' : ''}"><b>${e.at}</b>${esc(e.world)}</p>`).join('')}</div><p class="lr-note">이기면 공포가 오르고 지면 내린다. 공포가 높을수록 신화 단계에 더 큰 것이 온다.</p>`; }
  if (s.kind === 'syn') { const info = v.synergies.find(q => q.id === s.id) || LAIR.synInfo(s.id, 0), mem = LAIR.KIN_IDS.filter(k => LAIR.KIN[k].asp === s.id || LAIR.KIN[k].cls === s.id), have = new Set(v.board.map(b => b.kind));
    h = `<div class="lr-shead"><img class="lr-big" src="${lrSym(s.id, 32)}" alt=""><div><h3>${esc(info.name)}</h3><p class="lr-tags">${info.n} 모임${info.plus ? ' (본체 +' + info.plus + ')' : ''}</p></div></div><div class="lr-tiers">${info.need.map((n, i) => `<p class="${info.tier > i ? 'on' : ''}"><b>${n}</b>${esc(info.shorts[i])}</p>`).join('')}</div><p class="lr-note">${esc(info.more)}</p><div class="lr-mem">${mem.map(k => `<button data-l="info" data-kind="${k}" data-star="1" class="${have.has(k) ? 'on' : ''}"><img src="${lrIcon(k, 1, 36)}" alt="${esc(LAIR.KIN[k].name)}"><small>${LAIR.KIN[k].cost}</small></button>`).join('')}</div>`; }
  if (s.kind === 'room') { const r = LAIR.roomInfo(s.id); h = `<div class="lr-shead"><img class="lr-big" src="${lrRoomIcon(s.id)}" alt=""><div><h3>${esc(r.name)}</h3><p class="lr-tags">${r.len}칸</p></div></div><div class="lr-skill"><span>${esc(r.short)}</span><p>${esc(r.more)}</p></div>`; }
  if (s.kind === 'rooms') h = `<h3>방</h3><div class="lr-rooms">${v.roomOffer.map(r => `<button data-l="pickroom" data-i="${r.i}"${r.spots.length ? '' : ' disabled'}><img src="${lrRoomIcon(r.id)}" alt=""><b>${esc(r.name)}</b><span>${esc(r.short)}</span><small>${r.len}칸</small></button>`).join('')}</div>`;
  if (s.kind === 'syns') h = `<h3>모인 것</h3><div class="lr-rooms">${v.synergies.map(q => `<button data-l="syn" data-id="${q.id}"><img src="${lrSym(q.id, 32)}" alt=""><b>${esc(q.name)}</b><span>${esc(q.short)}</span><small>${q.n}/${q.next || q.need[q.need.length - 1]}</small></button>`).join('')}</div>`;
  if (s.kind === 'econ') { const e = v.econ, w = e.ifWin, l = e.ifLoss, st = v.streak || 0, costs = ['', 1, 2, 3, 4, 5];
    h = `<h3>진액 ${v.gold}</h3><table class="lr-tb"><tr><th></th><th>기본</th><th>이자</th><th>연속</th><th>승리</th><th>합</th></tr><tr class="w"><th>이기면</th><td>${w.base}</td><td>${w.interest}</td><td>${w.streak}</td><td>${w.win}</td><td><b>+${w.total}</b></td></tr><tr class="l"><th>지면</th><td>${l.base}</td><td>${l.interest}</td><td>${l.streak}</td><td>—</td><td><b>+${l.total}</b></td></tr></table>`
      + `<p class="lr-sum"><span>이자 ${e.per}마다 1 · 최대 ${e.interestMax}</span>${e.nextAt ? `<span class="g">다음 이자 ${e.nextAt}</span>` : ''}${st ? `<span class="${st > 0 ? 'w' : 'l'}">${st > 0 ? '연승' : '연패'} ${Math.abs(st)}</span>` : ''}</p>`
      + `<h4>상점에 나오는 값 · Lv ${v.level}</h4><table class="lr-tb odds"><tr><th>Lv</th>${costs.slice(1).map(c => `<th class="c${c}">${c}</th>`).join('')}</tr>${Object.keys(v.oddsTable).map(lv => `<tr class="${+lv === v.level ? 'on' : ''}"><th>${lv}</th>${v.oddsTable[lv].map(p => `<td>${p ? p + '%' : '—'}</td>`).join('')}</tr>`).join('')}</table>`
      + `<p class="lr-sum"><span>뽑기 ${v.costs.reroll}${v.freeRoll ? ' (이번 한 번)' : ''}</span><span>넓히기 ${v.costs.xp} → 경험 +${LAIR.K.xpBuy}</span><span>싸움마다 경험 +${v.xpRound}</span>${v.level < v.maxLv ? `<span>경험 ${v.xp}/${v.xpNeed}</span>` : ''}<span>세울 수 ${v.cap}</span></p>`; }
  if (s.kind === 'run') { const hist = {}; v.hist.forEach(q => { hist[q.round] = q; });
    h = `<h3>${v.act}막 ${esc(v.actName)}</h3><p class="lr-tags">${v.rin}/${v.per} · ${esc(v.roundName)}${v.retry ? ' · 다시 ' + v.retry : ''}</p><div class="lr-acts2">${[1, 2, 3].slice(0, v.acts).map(a => { const A = LAIR.actInfo(a); return `<div class="${a === v.act ? 'on' : ''}"><p><b>${a}막 ${esc(A.name)}</b><small>${esc(A.boss)}</small></p><span class="lr-track">${Array.from({ length: v.per }, (_, k) => { const r = (a - 1) * v.per + k + 1, q = hist[r]; return `<i class="lr-tc${r < v.round ? (q && !q.win ? ' l' : ' w') : ''}${r === v.round ? ' cur' : ''}${k === v.per - 1 ? ' boss' : ''}${LAIR.K.full.mythosAt.includes(r) ? (v.mythos.phase > LAIR.K.full.mythosAt.indexOf(r) ? ' myd' : ' my') : ''}"></i>`; }).join('')}</span></div>`; }).join('')}</div><p class="lr-leg"><span><i class="lr-tc my"></i>신화 단계</span><span><i class="lr-tc boss"></i>우두머리</span></p>`
      + `<h4>조사자</h4><div class="lr-rooms">${(v.cast || []).map(c => `<button data-l="cast" data-id="${c.id}"><img src="${lrIcon(lrCastIcon(c, v), 1, 44)}" alt=""><b>${esc(c.name)}</b><span>${esc(c.role)} · 의지 ${c.will}</span><small class="lr-cstate ${c.state}">${esc(LCST[c.state] || '')}</small></button>`).join('')}</div>`
      + (v.zealots ? `<p class="lr-sum"><span class="m">광신도 ${v.zealots}</span></p>` : '')
      + (v.curses.length ? `<h4>저주</h4><div class="lr-tiers">${v.curses.map(c => `<p class="on"><b>${c.left}</b>${esc(c.name)} · ${esc(c.short)}</p>`).join('')}</div>` : ''); }
  if (s.kind === 'elite') { const e = v.elite; if (!e) return lrSheetClose();
    h = `<h3>${esc(e.name)}</h3><p class="lr-tags">${esc(e.preview)}</p><div class="lr-skill"><b>이기면</b><span>${esc(e.reward)}</span></div><div class="lr-btns"><button class="pri" data-l="eliteset" data-v="${e.on ? 0 : 1}"${e.on && e.forced ? ' disabled' : ''}>${e.on ? (e.forced ? '물릴 수 없다' : '정예를 물린다') : '정예를 부른다'}</button></div>`; }
  if (s.kind === 'menu') h = `<h3>메뉴</h3>${lrTog('sound', '효과음', META.sound)}${lrTog('music', '음악', META.music !== false)}${lrTog('shake', '흔들림과 번쩍임', META.shake !== false)}<p class="lr-setrow"><span>빠르기</span><span class="lr-speed">${LSPD.map(q => `<button data-l="speed" data-v="${q[0]}" class="${LU.speed === q[0] ? 'on' : ''}" aria-pressed="${LU.speed === q[0]}">${q[1]}</button>`).join('')}</span></p><div class="lr-btns"><button data-l="exit">나가기</button><button class="pri" data-l="close">돌아간다</button></div>`;
  if (s.kind === 'result') h = lrResultHtml();
  const modal = s.kind === 'result';
  el.innerHTML = `<div class="lr-sbody${modal ? ' res' : ''}">${modal ? '' : '<button class="lr-x" data-l="close" aria-label="닫기">✕</button>'}${h}</div>`; el.hidden = false; $('lr-coach').hidden = true; $('lr').classList.add('sheeton');
  if (modal) { lrResFit(); requestAnimationFrame(lrResFit); }
}
// 결과 창이 화면보다 길면 덜 중요한 줄부터 접는다 (그 밖 → 기여 줄 → 진액 내역)
function lrResFit() { const b = lq('#lr-sheet .lr-sbody.res'); if (!b) return; const over = () => b.scrollHeight > b.clientHeight + 1, drop = sel => { const q = b.querySelectorAll(sel); if (!q.length) return false; q[q.length - 1].remove(); return true; }; if (over()) drop('.lr-rest'); while (over() && b.querySelectorAll('.lr-row').length > 2 && drop('.lr-row')) { /* 줄인다 */ } if (over()) drop('.lr-eco2'); if (over()) drop('.lr-nar'); }
const LCST = { fresh: '아직 오지 않았다', mad: '미쳤었다', hurt: '쓰러졌었다', eaten: '삼켜졌다', bold: '살아 돌아갔다', gone: '오지 않는다' };
function lrSheetClose() { LU.sheet = null; $('lr-sheet').hidden = true; $('lr').classList.remove('sheeton'); lrCoach(); }
function lrSheetAnim(now) {
  const s = LU.sheet, cv = $('lr-prev'); if (!s || !cv) return; const x = cv.getContext('2d'), v = lrSheetView(); x.clearRect(0, 0, 96, 96);
  let h = null;
  if (s.kind === 'core') h = lrBossH(v.form.form, v.form.step);
  else if (s.kind === 'cast') { const c = (v.cast || []).find(q => q.id === s.id); h = c ? lrUnitH(c.kind, 1, lrCastSt(c, v)) : null; }
  else if (s.kind === 'unit' || s.kind === 'inv') h = lrUnitH(s.id, s.star || 1);
  if (!h) return;
  const cyc = now % 4200, anim = cyc < 2200 ? 'idle' : cyc < 2700 ? 'attack' : cyc < 3500 ? 'cast' : 'idle', t = anim === 'idle' ? now : anim === 'attack' ? cyc - 2200 : cyc - 2700;
  h.draw(x, 48, 86, anim, t, { scale: h.size > 72 ? 1 : 1.4 });
}

// ---- 싸움 ----
function lrWarmPrep() { const R = LU.R; if (!R) return; const add = (id, star) => { const k = id + ':' + star; if (!LU.warmed[k]) { LU.warmed[k] = 1; ['idle', 'attack', 'cast', 'move', 'hit', 'die'].forEach(an => LU.warm.push([id, star, an])); } }; Object.keys(R.unit).forEach(id => add(lrArtId(R.unit[id].kind), R.unit[id].star)); LAIR.curEnemy(R).forEach(e => add(lrArtId(e.kind, e.poss ? 'poss' : ''), 1)); R.shop.forEach(k => { if (k) add(lrArtId(k), 1); }); }
function lrWarmStep(budget) { const t0 = performance.now(); while (LU.warm.length && performance.now() - t0 < budget) { const [id, star, an] = LU.warm.shift(); try { LAIRART.prewarm([id], star, [an]); } catch (e) { /* 그림이 없으면 건너뛴다 */ } } }
function lrFight() {
  const R = LU.R, v0 = lrView(), name = v0.roundName, round = R.round; if (LU.flow || LU.phase !== 'prep') return; LU.sel = null; LU.roomPick = null;
  const castSt = {}; (v0.cast || []).forEach(c => { castSt[c.id] = lrCastSt(c, v0); });
  const res = LAIR.ready(R); if (!res.ok) return lrToast(res.msg);
  lrTally(res.fight); lrSave(); if (R.phase === 'over') lrRecord(res.fight); else { try { if (typeof traceLive === 'function') traceLive(); } catch (e) { /* 기록 없이 */ } }
  const f = res.fight, boss = !!v0.boss, F = { tl: f.timeline, i: 0, T: 0, ents: {}, fx: [], zones: [], nums: [], lines: [], late: [], feed: [], meter: {}, meterDirty: false, meterAt: 0, plates: [], crowd: false, stop: 0, shake: 0, shakeMag: 0, intro: boss ? 2300 : 1500, slowUntil: 0, slowK: 1, slows: 0, slowSeen: {}, blocks: 0, shots: 0, taunts: 0, checks: 0, bigChecks: 0, boons: 0, boonAt: {}, real: 0, done: false, endAt: 0, res, name, round, v0, step: v0.form.step, labs: [], rooms: f.rooms.map(r => ({ id: r.id, cells: r.cells, erased: false, pulse: 0 })), syn: f.syn, form: f.form, banner: null, consumed: 0, mads: 0, casts: 0, bigCasts: 0, smallCasts: 0, frozen: 0 };
  f.units.forEach(u => { const e = F.ents[u.id] = lrEnt(u); if (u.cast) e.artSt = castSt[u.cast] || ''; e.minor = !!LMINOR[u.kind]; }); F.chips = lrSynChips(v0, f.syn);
  { const w = f.timeline.find(e => e.type === 'win'); let last = null; f.timeline.forEach(e => { if (e.type === 'die') last = e; }); if (w && last && w.t - last.t < 1) last.last = 1; }
  LU.F = F; LU.res = res; LU.phase = 'fight'; LU.speed = LU.speed || 1; LU.paused = false; $('lr-ov').innerHTML = ''; $('lr-toast').hidden = true; LU.toastT = 0;
  Object.keys(F.ents).forEach(id => { const e = F.ents[id]; if (!e.core && e.side === 'inv') LU.warm.push([lrArtId(e.kind, e.artSt), 1, 'mad']); });
  { const ids = Object.keys(f.syn || {}), d = document.createElement('div'), ms = boss ? 2300 : 1500; d.className = 'lr-intro' + (boss ? ' boss' : ''); d.style.animationDuration = ms + 'ms';
    d.innerHTML = (boss ? `<small>${v0.act}막 ${esc(v0.actName)}</small>` : '') + `<b>${esc(name)}</b>` + (v0.elite && v0.elite.on ? '<em>정예</em>' : '') + (ids.length ? `<span>${ids.map(id => `<i><img src="${lrSym(id, 16)}" alt="">${esc(LAIR.SYN[id].name)} ${LAIR.SYN[id].full[Math.max(0, f.syn[id] - 1)]}</i>`).join('')}</span>` : ''); $('lr-ov').appendChild(d); setTimeout(() => d.remove(), ms); }
  lrSay('night'); try { if (typeof music === 'function') music(boss ? 'boss' : 'night'); } catch (e) { /* 음악 없이 */ }
  const first = LU.tut >= 0 && LU.tut < LTUT.length; lrDraw(); lrSize(); if (first) { lrToast('위 줄은 체력, 파란 줄은 마나, 보라 줄은 정신이다.'); LU.toastT = LU.t + 5200; }
}
// ---- 다른 화면(굴 짓기)이 싸움 하나를 다시 보여 줄 때 ----
// 판·유닛·스킬 연출·숫자·막대·아래의 「누가 얼마나」는 둥지 전투 그대로. 준비 화면과 결과 창 없이, 끝나면 o.done() 을 부른다.
// f = LAIR.simulate 의 결과 (keep 이면 시작 체력·정신·미침이 실린다). o = { name, sub, form, step, done, skip }
function lairReplay(f, o) {
  o = o || {}; lrMount(); const lr = $('lr'); lr.classList.add('replay'); lr.hidden = false;
  try { LU.wallH = LAIRART.wallTop(LS, 6, 0).height; } catch (e) { LU.wallH = 45; }
  LU.replay = o; LU.sheet = null; LU.sel = null; LU.roomPick = null; LU.speed = lrSpeedLoad(); LU.paused = false; LU.phase = 'fight';
  $('lr-sheet').hidden = true; $('lr-coach').hidden = true; $('lr-top').hidden = true; $('lr-top').innerHTML = ''; ['lr-bench', 'lr-shop', 'lr-info'].forEach(id => { $(id).hidden = true; }); $('lr-fight').hidden = false;
  const F = { tl: f.timeline, i: 0, T: 0, ents: {}, fx: [], zones: [], nums: [], lines: [], late: [], feed: [], meter: {}, meterDirty: false, meterAt: 0, plates: [], crowd: false, stop: 0, shake: 0, shakeMag: 0, intro: 900, slowUntil: 0, slowK: 1, slows: 0, slowSeen: {}, blocks: 0, shots: 0, taunts: 0, checks: 0, bigChecks: 0, boons: 0, boonAt: {}, real: 0, done: false, endAt: 0, res: { fight: f, win: f.result === 'win' }, name: o.name || '', round: 1, v0: null, step: o.step || 0, labs: [], rooms: f.rooms.map(r => ({ id: r.id, cells: r.cells, erased: false, pulse: 0 })), syn: f.syn, form: o.form || f.form, banner: null, consumed: 0, mads: 0, casts: 0, bigCasts: 0, smallCasts: 0, frozen: 0 };
  f.units.forEach(u => { const e = F.ents[u.id] = lrEnt(u); e.minor = !!LMINOR[u.kind]; if (e.hp < e.mhp) e.lag = e.hp / e.mhp; });
  { const w = f.timeline.find(e => e.type === 'win'); let last = null; f.timeline.forEach(e => { if (e.type === 'die') last = e; }); if (w && last && w.t - last.t < 1) last.last = 1; }
  LU.F = F; LU.res = F.res; $('lr-ov').innerHTML = ''; $('lr-toast').hidden = true; LU.toastT = 0;
  $('lr-bar').innerHTML = `<div class="lr-b1 lr-rp"><span class="lr-rpt"><b>${esc(F.name)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span><button class="lr-rpskip" data-l="rskip">넘기기</button></div>`;
  { const d = document.createElement('div'); d.className = 'lr-intro'; d.style.animationDuration = '900ms'; d.innerHTML = `<b>${esc(F.name)}</b>`; $('lr-boardwrap').appendChild(d); setTimeout(() => d.remove(), 900); }
  LU.crop = o.crop === false ? null : lrCropOf(f);
  Object.keys(F.ents).forEach(id => { const e = F.ents[id]; LU.warm.push([e.core ? null : lrArtId(e.kind, e.artSt), e.star || 1, 'attack']); }); LU.warm = LU.warm.filter(q => q[0]);
  lrFightPanel(); lrSize(); if (!LU.raf) { LU.last = performance.now(); LU.raf = requestAnimationFrame(lrLoop); }
}
// 싸움이 쓰는 칸만: 처음 선 칸, 걸어간 칸, 불려 나온 칸을 감싸는 상자 (막대·이름표가 들어갈 위쪽 여백과 함께). 캔버스 좌표
function lrCropOf(f) {
  let r0 = 9, r1 = -1, c0 = 9, c1 = -1; const add = c => { if (c == null || c < 0 || c > 35) return; const r = Math.floor(c / 6), q = c % 6; r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, q); c1 = Math.max(c1, q); };
  f.units.forEach(u => { (u.cells && u.cells.length ? u.cells : [u.cell]).forEach(add); }); f.timeline.forEach(e => { if (e.type === 'move') add(e.to); if (e.type === 'spawn') add(e.cell); });
  if (r1 < 0) return null; const y0 = Math.max(0, LU.wallH + r0 * LS - 40), y1 = LU.wallH + (r1 + 1) * LS + 6, x0 = Math.max(0, c0 * LS - 6), x1 = Math.min(LW, (c1 + 1) * LS + 6);
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
}
// 재생 때 상자에 맞춰 판을 키운다. 화면의 가로세로에 맞게 상자를 넓히고(판 밖으로는 안 나간다), 넘치는 데는 잘라 낸다
function lrCropFit(availW, availH) {
  const C = LU.crop, cv = $('lr-cv'), wrap = $('lr-boardwrap'), ov = $('lr-ov'), H = LU.wallH + LS * 6; if (!C) return false;
  let { x0, y0, w, h } = C; const A = availW / availH;
  if (w / h < A) { const nw = Math.min(LW, h * A); x0 = Math.max(0, Math.min(LW - nw, x0 - (nw - w) / 2)); w = nw; } else { const nh = Math.min(H, w / A); y0 = Math.max(0, Math.min(H - nh, y0 - (nh - h) / 2)); h = nh; }
  const sc = Math.max(0.6, Math.min(2.2, availW / w, availH / h)), tf = `translate(${-Math.round(x0 * sc)}px, ${-Math.round(y0 * sc)}px)`; LU.scale = sc;
  cv.style.width = Math.floor(LW * sc) + 'px'; cv.style.height = Math.floor(H * sc) + 'px'; cv.style.transform = tf; cv.style.transformOrigin = '0 0';
  Object.assign(ov.style, { width: Math.floor(LW * sc) + 'px', height: Math.floor(H * sc) + 'px', right: 'auto', bottom: 'auto', transform: tf, transformOrigin: '0 0' });
  wrap.style.width = Math.floor(w * sc) + 'px'; wrap.style.height = Math.floor(h * sc) + 'px'; return true;
}
function lrCropReset() { const cv = $('lr-cv'), ov = $('lr-ov'); if (!cv) return; cv.style.transform = ''; Object.assign(ov.style, { width: '', height: '', right: '', bottom: '', transform: '' }); LU.crop = null; }
// 다시 보기를 끝낸다 (끝까지 보았거나 넘겼을 때). done 은 한 번만
function lrReplayEnd() {
  const o = LU.replay; if (!o) return; LU.replay = null; lrCropReset(); LU.F = null; LU.phase = 'prep'; const lr = $('lr'); lr.hidden = true; lr.classList.remove('replay'); $('lr-ov').innerHTML = ''; $('lr-top').hidden = false;
  ['lr-bench', 'lr-shop'].forEach(id => { $(id).hidden = false; }); $('lr-fight').hidden = true; $('lr-bar').innerHTML = '';
  if (o.done) o.done();
}
function lrEnt(u) {
  const p = lcen(u.cells && u.cells.length ? u.cells : [u.cell]);
  return { id: u.id, side: u.side, kind: u.kind, cast: u.cast || null, will: u.will || 0, artSt: '', star: u.star || 1, core: !!u.core, form: u.form, boss: !!u.boss, elite: !!u.elite, name: u.name, asp: u.asp, cls: u.cls, x: p.x, y: p.y, fx: p.x, fy: p.y, tx: p.x, ty: p.y, mv0: 0, mvDur: 0, mvAnim: '', anim: 'idle', a0: 0, hp: u.hp != null ? u.hp : u.mhp, mhp: u.mhp, san: u.sn != null ? u.sn : u.msan || 0, msan: u.msan || 0, mana: u.mana || 0, mmana: u.mmana || 100, mad: !!u.mad, dead: false, dieT: -1, st: {}, flash: 0, rx: 0, ry: 0, face: u.side === 'inv' ? 1 : 0, lunge: null, pop: 0, off: Math.random() * 1200, ranged: 0, dot: 0, dotT: 0, shield: 0, swallow: false, role: u.role || (u.core ? 'core' : 'melee'), range: u.range || 1, summon: !!u.summon };
}
// 주역을 가리지 않게 작고 흐리게 그리는 것
const LMINOR = { spawn: 1, infected: 1 };
function lrHandle(e) { if (e.core) return lrBossH(e.form || 'drop', LU.F ? LU.F.step : 0); const aid = lrArtId(e.kind, e.artSt); if (aid === 'seeker') { const k = e.msan ? e.san / e.msan : 1; return LAIRART.unit('seeker', k > 0.66 ? 1 : k > 0.33 ? 2 : 3); } return LAIRART.unit(aid, aid === e.kind || LAIR.KIN[e.kind] ? e.star : 1) || LAIRART.unit('spawn', 1); }
function lrSetAnim(e, anim, T) { e.anim = anim; e.a0 = T; }
// pri: 3 = 본체·우두머리의 스킬, 2 = 조사자·값진 권속의 스킬과 미침, 1 = 그 밖. 셋이 떠 있으면 더 가벼운 것을 지우고 뜨거나, 뜨지 않는다
const LLABMAX = 3;
function lrLabClean(F) { F.labs = F.labs.filter(l => { if (l.until > LU.t) return true; if (l.el) l.el.remove(); return false; }); }
function lrLabel(x, y, text, cls, ms, pri) {
  const F = LU.F, sc = LU.scale, hw = (text.length * 12.5 + 16) / 2 / sc, ban = /\bban\b/.test(cls || ''); ms = ms || 1100; pri = pri || 1; x = Math.max(hw + 2, Math.min(LW - hw - 2, x)); y = Math.max(LU.wallH + 4, y);
  if (F) {
    lrLabClean(F);
    if (!ban) { const live = F.labs.filter(l => !l.ban); if (live.length >= LLABMAX) { const low = live.reduce((a, b) => (b.pri < a.pri || (b.pri === a.pri && b.until < a.until) ? b : a)); if (low.pri >= pri) return false; if (low.el) low.el.remove(); F.labs = F.labs.filter(l => l !== low); } }
    for (let k = 0; k < 4; k++) { if (F.labs.some(l => Math.abs(l.x - x) < hw + l.hw && Math.abs(l.y - y) < 19 / sc)) y -= 20 / sc; else break; } y = Math.max(38 / sc, y);
  }
  const d = document.createElement('span'); d.className = 'lr-lab ' + (cls || '') + (pri >= 3 ? ' p3' : ''); d.textContent = text; d.style.left = (x * sc) + 'px'; d.style.top = (y * sc) + 'px'; d.style.animationDuration = ms + 'ms'; $('lr-ov').appendChild(d); setTimeout(() => d.remove(), ms);
  if (F) F.labs.push({ x, y, hw, until: LU.t + ms, pri, ban, el: d }); return true;
}
// grp: 'hp'(피해) · 'san'(정신) · 'guard'(막음) · 'heal'. 같은 유닛·같은 갈래는 0.4초 안에서 하나로 더한다. 치명이 섞이면 치명으로 보인다
function lrNum(F, x, y, text, kind, id) {
  const grp = kind === 'crit' || kind === 'dmg' ? 'hp' : kind;
  if (id && typeof text === 'number' && text > 0) { const q = F.nums.find(n => n.id === id && n.grp === grp && LU.t - n.t1 < 400 && LU.t - n.t0 < 900); if (q) { q.val += text; q.text = Math.round(q.val); if (kind === 'crit') q.kind = 'crit'; q.t1 = LU.t; q.t0 = Math.max(q.t0, LU.t - 110); return; } }
  if (F.nums.length > (F.crowd ? 12 : 18)) F.nums.shift(); F.nums.push({ x, y, text: typeof text === 'number' ? Math.round(text) : text, val: typeof text === 'number' ? text : 0, kind, grp, id, t0: LU.t, t1: LU.t });
}
// 이름표와 느린 화면을 받는 큰 것: 본체, 우두머리, 조사자, 값 4~5 권속
const lrBig = u => !!u && (u.core || u.boss || !!u.cast || (u.side === 'nest' && !u.summon && LAIR.KIN[u.kind] && LAIR.KIN[u.kind].cost >= 4));
function lrAddFx(F, name, a, b, o, dur, under, delay) { dur = dur || LFXDUR[name]; name = lrFxName(name); F.fx.push({ name, a, b: b || a, t0: F.T + (delay || 0), dur: dur || LFXDUR[name] || 0.6, o: o || {}, under: !!under }); if (F.fx.length > 40) F.fx.shift(); }
function lrStop(F, ms, mag) { F.stop = Math.max(F.stop, ms); if (mag && typeof motionOk === 'function' && motionOk()) { F.shake = LU.t + 220; F.shakeMag = Math.max(F.shakeMag, mag); } }
// 큰 순간: 잠깐 느리게 흐른다 (흔들림을 끈 사람에게는 하지 않는다)
function lrSlow(F, ms, k) { if (typeof motionOk === 'function' && !motionOk()) return; F.slowUntil = Math.max(F.slowUntil, LU.t + ms / Math.max(1, LU.speed)); F.slowK = k; F.slows++; }
function lrPos(F, id) { const e = F.ents[id]; return e ? { x: e.x, y: e.y - 6 } : null; }
function lrFace(e, tx) { if (Math.abs(tx - e.x) > 6) e.face = tx < e.x ? 1 : 0; }
// 사건 하나를 화면에 옮긴다
function lrEv(F, ev) {
  const E = F.ents, T = F.T, u = ev.u ? E[ev.u] : null, C = c => ({ x: lcx(c), y: lcy(c) });
  switch (ev.type) {
    case 'synergy': {
      if (ev.fx === 'on') { for (const id in E) { const q = E[id]; if (q.side === 'nest' && (q.asp === ev.id || q.cls === ev.id)) lrAddFx(F, 'on', { x: q.x, y: q.y }, null, { col: LCOL[ev.id] || '#ffd040' }, 0.7); } return; }
      if (u) lrAddFx(F, ev.fx === 'echo' ? 'echo' : ev.fx === 'eat' ? 'eat' : 'on', lrPos(F, ev.u), null, { col: LCOL[ev.id] });
      else if (ev.cell != null) lrAddFx(F, 'on', C(ev.cell), null, { col: LCOL[ev.id] });
      return;
    }
    case 'move': {
      if (!u || u.core) return; const p = C(ev.to); u.fx = u.x; u.fy = u.y; u.tx = p.x; u.ty = p.y; u.mv0 = T; u.mvDur = Math.max(0.12, ev.dur || 0.3); u.mvAnim = ev.anim; lrFace(u, p.x);
      if (ev.anim === 'walk') lrSetAnim(u, 'move', T); else if (ev.anim === 'pull' || ev.anim === 'push') lrSetAnim(u, 'hit', T); else if (ev.anim === 'dash' || ev.anim === 'leap') lrSetAnim(u, 'attack', T);
      return;
    }
    case 'attack': {
      const tg = E[ev.tg]; if (!u || !tg) return; lrFace(u, tg.x); lrSetAnim(u, 'attack', T); u.ranged = ev.r ? 1 : 0; u.mana = Math.min(u.mmana, u.mana + LAIR.K.manaAtk);
      const dx = tg.x - u.x, dy = tg.y - u.y, d = Math.hypot(dx, dy) || 1; if (!u.core) u.lunge = { ux: dx / d, uy: dy / d, t0: T, r: ev.r ? 1 : 0, len: ev.r ? 7 : Math.min(30, d * 0.46) };
      if (ev.r) { const ar = u.kind === 'archer'; F.shots++; lrAddFx(F, ar ? 'arrow' : 'bolt', { x: u.x + dx / d * 12, y: u.y - 14 }, { x: tg.x, y: tg.y - 10 }, { col: u.side === 'nest' && !u.mad ? LCOL[u.asp] || '#8fe8d8' : '#f08a2a', col2: '#ffffff' }, LSHOT.fly / (ar ? 0.6 : 0.7), false, LSHOT.rel); }
      return;
    }
    case 'hit': {
      if (ev.k === 'atk' && !ev._late) { const by = E[ev.by]; F.late.push({ at: ev.t + (by && by.ranged ? LSHOT.rel + LSHOT.fly : LSHOT.hit), ev: Object.assign({ _late: 1 }, ev) }); return; }
      if (!u) return; u.hp = ev.hp; if (ev.sn != null && u.msan) u.san = ev.sn; if (ev.m != null) u.mana = ev.m;
      const by = E[ev.by], crowd = F.crowd, kill = ev.hp <= 0; lrMeterAdd(F, by, ev.dmg, u.msan && !u.mad ? ev.san : 0);
      if (ev.k === 'dot' || ev.k === 'true') { u.dot += ev.dmg; if (T - u.dotT > 1 && u.dot > 0) { if (!crowd) lrNum(F, u.x, u.y - 30, Math.round(u.dot), 'block'); u.dot = 0; u.dotT = T; } return; }
      u.flash = LU.t + 100; if (!(u.lag > u.hp / u.mhp + 0.001)) u.lagHold = T + 0.2; if (by) { const dx = u.x - by.x, dy = u.y - by.y, d = Math.hypot(dx, dy) || 1; u.rx = dx / d * 5; u.ry = dy / d * 5; }
      if (!u.dead && (u.anim === 'idle' || u.anim === 'move' || u.anim === 'mad') && u.mvDur === 0) lrSetAnim(u, 'hit', T);
      // 무리가 크면(양쪽 합 12 이상) 작은 평타 숫자와 막은 숫자는 감춘다. 치명, 처치, 스킬, 큰 정신 피해는 남는다
      const crit = !!ev.crit || (ev.k === 'skill' && ev.dmg >= u.mhp * 0.15), small = ev.k === 'atk' && !crit && !kill;
      if (ev.dmg > 0 && !(crowd && (small || u.minor))) lrNum(F, u.x, u.y - 34, ev.dmg, crit ? 'crit' : 'dmg', u.id);
      if (ev.san > 0 && u.msan && !u.mad && (!crowd || ev.san >= u.msan * 0.1 || ev.sn <= 0)) lrNum(F, u.x + 16, u.y - 20, ev.san, 'san', u.id);
      if (ev.k === 'atk') lrAddFx(F, 'spark', { x: u.x, y: u.y - 12 }, null, { col: by && by.side === 'nest' ? '#c0fff0' : '#ffd0a0', seed: (ev.t * 7) % 1 }, 0.22);
      if (ev.blk > 0 && by) { F.blocks++; if (!(u.blkT > T - 0.45)) { u.blkT = T; lrAddFx(F, 'block', { x: by.x, y: by.y - 12 }, { x: u.x, y: u.y - 14 }, null, 0.36); } if (!crowd) lrNum(F, u.x - 18, u.y - 14, ev.blk, 'guard', u.id); }
      if (LU.t - LU.hitAt > 70 / LU.speed) { LU.hitAt = LU.t; lrSay('hit'); }
      return;
    }
    // 스킬: 큰 것만 이름표·느린 화면·기록을 받는다. 작은 것은 발밑 고리와 짧은 반짝임, 연출만
    case 'cast': {
      if (!u) return; const tg = E[ev.tg], big = lrBig(u); if (tg) lrFace(u, tg.x); lrSetAnim(u, 'cast', T); u.mana = 0; F.casts++; u.castT = T; u.castDur = Math.max(0.3, ev.dur || 0.42);
      if (big && !ev.again && !F.slowSeen[u.id]) { F.slowSeen[u.id] = 1; lrSlow(F, 700, 0.4); }
      const sk = LAIR.SK[ev.sk];
      if (sk && !ev.again) { if (big) { F.bigCasts++; lrLabel(u.x, u.y - (u.core ? 92 : 64), sk.name, 'sk ' + (u.side === 'nest' && !u.madSide ? 'nest' : 'inv'), Math.max(1000, 1250 / Math.sqrt(LU.speed)), u.core || u.boss ? 3 : 2); lrFeed(F, u, sk.name); } else { F.smallCasts++; u.glow = LU.t + 260; } }
      if (tg && big) F.lines.push({ a: ev.u, b: ev.tg, until: T + (ev.dur || 0.35) + 0.25, side: u.side });
      if (LU.t - LU.castAt > 160) { LU.castAt = LU.t; lrSay('spell'); }
      return;
    }
    case 'skillfx': return lrSkillFx(F, ev);
    case 'status': {
      if (!u) return; if (ev.on) { u.st[ev.st] = { until: T + (ev.dur || 1), v: ev.v }; if (ev.st === 'shield') u.shield = 1; if (ev.st === 'stun' && !F.crowd) lrNum(F, u.x, u.y - 40, 0, 'block'); if (ev.st === 'marked' && !(u.markT > T - 1)) { u.markT = T; lrLabel(u.x, u.y - 62, '표식', 'inv', 900, 1); } } else { delete u.st[ev.st]; if (ev.st === 'shield') u.shield = 0; }
      if (ev.on && ev.st === 'taunted' && ev.by && E[ev.by] && !E[ev.by].dead) { const by = E[ev.by]; F.taunts++; if (!F.crowd || lrBig(by)) F.lines.push({ a: ev.u, b: ev.by, until: T + 1, t0: T, side: by.side, aggro: 1 }); if (!(by.tauntT > T - 0.4)) { by.tauntT = T; lrAddFx(F, 'on', { x: by.x, y: by.y - 8 }, null, { col: '#f0a04a' }, 0.6); } }
      return;
    }
    case 'mad': {
      if (!u) return; u.mad = true; u.san = 0; F.mads++; lrSetAnim(u, 'mad', T); lrAddFx(F, 'madburst', { x: u.x, y: u.y - 8 }, null, { r: 1.2 }, 0.8); lrLabel(u.x, u.y - 62, '미쳤다', 'mad', 1300, u.boss || u.cast ? 3 : 2); lrNum(F, u.x, u.y - 30, 0, 'mad'); lrStop(F, 150, 3); lrSay('mad'); if (F.mads === 1 || lrBig(u)) lrSlow(F, 800, 0.35); lrFeed(F, u, '미쳤다', 'mad');
      return;
    }
    case 'cleanse': { if (!u) return; u.mad = false; if (ev.sn != null) u.san = ev.sn; lrAddFx(F, 'heal', { x: u.x, y: u.y - 8 }, null, { col: '#fff3a0' }); lrLabel(u.x, u.y - 62, '깨어났다', 'inv', 1000, 1); return; }
    case 'die': {
      if (!ev._late) { let at = 0; F.late.forEach(l => { if (l.ev.u === ev.u && l.ev.type === 'hit') at = Math.max(at, l.at); }); if (at > T) { F.late.push({ at: at + 0.01, ev: Object.assign({ _late: 1 }, ev) }); return; } }
      if (!u) return; if (ev.last) lrSlow(F, 900, 0.3); u.dead = true; u.dieT = T; u.hp = 0; u.swallow = ev.how === 'swallow'; lrSetAnim(u, 'die', T);
      if (u.side === 'nest' && !u.swallow && !u.minor) lrAddFx(F, 'ichor', { x: u.x, y: u.y - 6 }, null, { seed: u.x % 7 }); if (u.boss || u.elite) lrStop(F, 180, 4); lrSay('die');
      if (!u.summon && (lrBig(u) || u.elite || (u.side === 'nest' && u.star >= 2))) lrFeed(F, u, u.swallow ? '삼켜졌다' : '쓰러졌다', 'die');
      return;
    }
    case 'spawn': {
      const p = C(ev.cell);
      if (ev.revive && F.ents[ev.u]) { const q = F.ents[ev.u]; q.dead = false; q.dieT = -1; q.swallow = false; q.hp = ev.hp != null ? ev.hp : q.mhp; q.lag = q.hp / q.mhp; q.x = q.fx = q.tx = p.x; q.y = q.fy = q.ty = p.y; q.mvDur = 0; q.st = { wet: { until: T + 2, v: 1 } }; q.pop = T; lrSetAnim(q, 'idle', T); lrLabel(p.x, p.y - 62, '다시 낳았다', 'sk nest', 1200, 2); lrFeed(F, q, '다시 낳았다'); lrStop(F, 120, 2); return; }
      const n = F.ents[ev.u] = lrEnt({ id: ev.u, side: ev.side, kind: ev.kind, star: ev.star || 1, cell: ev.cell, cells: [ev.cell], name: ev.name, mhp: ev.mhp, msan: 0, mmana: 0, mana: 0, role: ev.role, range: ev.range }); n.pop = T; n.summon = true; n.minor = !!LMINOR[ev.kind]; lrAddFx(F, ev.kind === 'spawn' || ev.kind === 'brute' ? 'on' : 'rise', p, null, { col: '#c8e870' }, 0.5);
      return;
    }
    // 공포 판정. 큰 것(우두머리·조사자의 판정, 본체 스킬이 부른 판정)만 주사위가 굴러 멎는다. 작은 것은 얼어붙었을 때만 짧게 알린다
    case 'check': {
      if (!u) return; const by = E[ev.by], big = !!(u.boss || u.cast || (ev.why === 'skill' && by && by.core)); F.checks++;
      if (!big) { if (ev.res === 'froze') { F.frozen++; lrAddFx(F, 'madburst', { x: u.x, y: u.y - 8 }, null, { r: 0.7 }, 0.5); lrLabel(u.x, u.y - 58, LCHK.froze[0], 'mad sm', 800, 1); if (LU.t - (F.frozeAt || 0) > 300) { F.frozeAt = LU.t; lrSay('mad'); } } return; }
      F.bigChecks++; lrPlate(F, u, ev); lrSlow(F, 900, 0.35); lrSay('click');
      // 처음 보는 판정에는 한 번 일러 준다
      if (!LU.toastT && META && !META.lairDice && !(navigator.webdriver && !window.__lairCoach)) { META.lairDice = 1; try { saveMeta(); } catch (er) { /* 저장 없이 */ } lrToast('공포 판정: 의지만큼 굴린다. ' + ev.face + ' 이상이 둘이면 버틴다.'); LU.toastT = LU.t + 4800; }
      return;
    }
    // 신화의 권능이 돌았다: 카드 이름이 짧게 뜬다 (같은 카드는 잠깐 쉬었다가)
    case 'boon': {
      const c = ev.card && LAIR.MYTHOS[ev.card]; F.boons++; if (!c || F.boonAt[ev.card] > T - 4) return; F.boonAt[ev.card] = T;
      const at = u ? { x: u.x, y: u.y } : ev.cell != null ? C(ev.cell) : lcen(LAIR.CORE); lrAddFx(F, 'on', { x: at.x, y: at.y - 8 }, null, { col: LCOL[c.asp] || '#ffd040' }, 0.6); if (!F.crowd) lrLabel(at.x, at.y - (u && u.core ? 92 : 58), c.name, 'boon', 1300, 1); lrFeed(F, null, c.name, 'boon');
      return;
    }
    case 'roomfx': {
      const rm = F.rooms.find(r => r.id === ev.room && (ev.i == null || true)); if (rm) rm.pulse = LU.t + 420;
      if (ev.kind === 'gold' && ev.cell != null) lrNum(F, lcx(ev.cell), lcy(ev.cell) - 20, '+' + (ev.amt || 1), 'gold');
      if (ev.kind === 'erase') { const r2 = F.rooms.find(r => r.id === ev.room && !r.erased) || rm; if (r2) { r2.erased = true; const p = lcen(r2.cells); lrLabel(p.x, p.y - 18, '읽혔다', 'inv', 1500, 2); lrFeed(F, { img: lrRoomIcon(r2.id), name: LAIR.ROOM[r2.id].name, side: 'inv' }, '읽혔다', 'die'); lrAddFx(F, 'readblast', p, null, { r: 1 }, 0.8); lrStop(F, 160, 3); } }
      if (ev.kind === 'end') F.zones = F.zones.filter(z => !(ev.cells && z.cells.join() === ev.cells.join()));
      if ((ev.kind === 'wet' || ev.kind === 'infect' || ev.kind === 'on' || ev.kind === 'hatch') && ev.cell != null) lrAddFx(F, 'on', C(ev.cell), null, { col: ev.kind === 'wet' ? '#6ab8e0' : ev.kind === 'infect' ? '#c8d848' : ev.kind === 'hatch' ? '#d8e8a0' : '#8a6ab0' }, 0.45);
      return;
    }
    case 'heal': { if (!u) return; u.hp = ev.hp; if (ev.amt >= (F.crowd ? Math.max(40, u.mhp * 0.08) : 8)) lrNum(F, u.x - 12, u.y - 26, '+' + Math.round(ev.amt), 'heal'); return; }
    case 'sanity': { if (u && ev.sn != null) u.san = ev.sn; return; }
    case 'frenzy': F.banner = { text: '격해진다', until: LU.t + 1600 }; return;
    case 'sudden': F.banner = { text: '굴이 무너진다', until: LU.t + 1800 }; lrStop(F, 0, 3); return;
    case 'win': { if (!ev._late) { let at = 0; F.late.forEach(l => { at = Math.max(at, l.at); }); if (at > T) { F.late.push({ at: at + 0.02, ev: Object.assign({ _late: 1 }, ev) }); return; } } F.done = true; F.endAt = LU.t + (F.slowUntil > LU.t ? 2000 : 1100); F.winSide = ev.side; return; }
  }
}
function lrSkillFx(F, ev) {
  const E = F.ents, u = ev.u ? E[ev.u] : null, P = id => lrPos(F, id), C = c => ({ x: lcx(c), y: lcy(c) }), first = ev.tgs && ev.tgs.length ? P(ev.tgs[0]) : null, me = u ? { x: u.x, y: u.y - 6 } : null, fxn = ev.fx, add = (a, b, o, under) => lrAddFx(F, fxn, a, b, o, ev.dur && (fxn === 'sanctum' || fxn === 'shieldwall' || fxn === 'shell') ? ev.dur : null, under);
  if (LBIG[fxn]) lrStop(F, fxn === 'swallow' || fxn === 'feast' || fxn === 'wave' ? 130 : 80, fxn === 'beam' || fxn === 'mask' ? 0 : 3);
  if (fxn === 'burnzone') { F.zones.push({ cells: ev.cells || [], until: F.T + (ev.dur || 4), t0: F.T }); return; }
  if (fxn === 'beam' || fxn === 'pierce') { const a = ev.from != null ? C(ev.from) : me, cs = ev.cells || [], b = cs.length ? C(cs[cs.length - 1]) : first || a; return add({ x: a.x, y: a.y - 8 }, { x: b.x, y: b.y - 8 }); }
  if (fxn === 'dash') return add(C(ev.from), C(ev.to != null ? ev.to : ev.from));
  if (fxn === 'swallow') return add(me || C(ev.from), ev.to != null ? C(ev.to) : first);
  if (fxn === 'pull') return add(me || C(ev.from), ev.to != null ? C(ev.to) : first);
  if (fxn === 'meteor' || fxn === 'ink' || fxn === 'flask') return add(ev.from != null ? C(ev.from) : me, ev.cell != null ? C(ev.cell) : first, { r: 1.4 });
  if (fxn === 'rift') { const real = lrFxName('rift') === 'rift'; if (real) return add(me, { x: LW / 2, y: LU.wallH + LS * 1.5 }, { w: LW }); (ev.tgs || []).slice(0, 6).forEach(id => { const p = P(id); if (p) lrAddFx(F, 'rift', p, p, {}); }); return; }
  if (fxn === 'sermon' || fxn === 'possess' || fxn === 'rebirth') { const cs = ev.cells || []; if (!cs.length) return add(me, me, { r: 1.2 }); cs.forEach(c => lrAddFx(F, fxn, C(c), C(c), { r: 1.2 })); return; }
  if (fxn === 'toll' || fxn === 'banner' || fxn === 'exorcise') return add(me, me, { r: ev.r || 2 }, fxn === 'banner');
  if (fxn === 'cloud' || fxn === 'firepillar') return add(ev.from != null ? C(ev.from) : me, ev.cell != null ? C(ev.cell) : first, { r: fxn === 'cloud' ? 1.7 : 1.1 });
  if (fxn === 'madburst' || fxn === 'rise') { const p = ev.cells && ev.cells.length ? C(ev.cells[0]) : me; return add(p, p, { r: 1.4 }); }
  if (fxn === 'hatch') { const cs = ev.cells || []; return add(me || (cs.length ? C(cs[0]) : null), cs.length ? lcen(cs) : me, { n: Math.max(1, cs.length) }); }
  if (fxn === 'wave') { const y0 = LU.wallH + LS * 6, a = u && u.side === 'nest' ? { x: LW / 2, y: y0 } : { x: LW / 2, y: LU.wallH }, b = u && u.side === 'nest' ? { x: LW / 2, y: LU.wallH + LS * 0.5 } : { x: LW / 2, y: y0 }; return add(a, b, { w: LW }); }
  if (fxn === 'skyeye') { (ev.tgs || []).slice(0, 5).forEach(id => { const p = P(id); if (p) lrAddFx(F, 'skyeye', p, p, {}); }); return; }
  if (fxn === 'chorus') { const ps = (ev.tgs || []).map(P).filter(Boolean), b = ps.length ? { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length } : { x: me.x, y: me.y - 120 }; return add(me, b); }
  if (fxn === 'read') { const b = ev.cells && ev.cells.length ? lcen(ev.cells) : me; F.lines.push({ pa: me, pb: b, until: F.T + 1, side: 'inv' }); return add(me, b); }
  if (fxn === 'shieldwall') return add(me, { x: me.x, y: me.y + (u && u.side === 'inv' ? 64 : -64) });
  if (fxn === 'shell' || fxn === 'eyes' || fxn === 'slam' || fxn === 'feast' || fxn === 'readblast' || fxn === 'light' || fxn === 'sanctum' || fxn === 'song' || fxn === 'echo' || fxn === 'eat') return add(me, me, { r: ev.r ? (fxn === 'eyes' ? 1.6 : fxn === 'light' ? 1.6 : ev.r) : undefined }, fxn === 'sanctum' || fxn === 'slam');
  if (!me && !first) return;
  return add(me || first, first || me, { n: ev.n });
}
// 시간이 흐른다
function lrStep(dt) {
  const F = LU.F; if (!F) return;
  if (F.intro > 0) { F.intro -= dt; return; }
  if (LU.paused || (LU.sheet && !F.done)) return;
  if (!F.done) F.real += dt;
  if (F.stop > 0) { F.stop -= dt; return; }
  const sm = F.slowUntil > LU.t ? F.slowK : 1; F.T += dt / 1000 * LU.speed * sm; const T = F.T;
  while (F.i < F.tl.length && F.tl[F.i].t <= T) { lrEv(F, F.tl[F.i]); F.i++; F.consumed++; }
  if (F.late.length) { const due = F.late.filter(l => l.at <= T || F.done).sort((a, b) => a.at - b.at); F.late = F.late.filter(l => !(l.at <= T || F.done)); due.forEach(l => lrEv(F, l.ev)); }
  for (const id in F.ents) {
    const e = F.ents[id];
    if (e.mvDur > 0) { const k = Math.min(1, (T - e.mv0) / e.mvDur), s = k * k * (3 - 2 * k); e.x = e.fx + (e.tx - e.fx) * s; e.y = e.fy + (e.ty - e.fy) * s; if (k >= 1) { e.mvDur = 0; e.x = e.tx; e.y = e.ty; if (!e.dead && (e.anim === 'move' || e.anim === 'hit' || e.anim === 'attack')) lrSetAnim(e, e.mad ? 'mad' : 'idle', T); } }
    if (!e.dead && e.anim !== 'idle' && e.anim !== 'move' && e.anim !== 'mad') { const d = LAIRART.ANIM[e.anim] ? LAIRART.ANIM[e.anim].dur / 1000 : 0.4; if (T - e.a0 > d) lrSetAnim(e, e.mad ? 'mad' : 'idle', T); }
    e.rx *= 0.8; e.ry *= 0.8; { const hf = e.hp / e.mhp; if (e.lag == null || e.lag < hf) e.lag = hf; else if (T > (e.lagHold || 0)) e.lag = Math.max(hf, e.lag - dt / 1000 * LU.speed * 0.9); }
    for (const k in e.st) if (e.st[k].until < T) { delete e.st[k]; if (k === 'shield') e.shield = 0; }
  }
  F.fx = F.fx.filter(f => T - f.t0 < f.dur); F.zones = F.zones.filter(z => z.until > T); F.lines = F.lines.filter(l => l.until > T);
  { let n = 0; for (const id in F.ents) { const e = F.ents[id]; if (!e.dead && !e.core) n++; } F.crowd = n >= 12; } lrLabClean(F);
  if (F.meterDirty && LU.t - F.meterAt > 300) { F.meterAt = LU.t; F.meterDirty = false; const m = $('lr-meter'); if (m) m.innerHTML = lrMeterHtml(); }
  if (F.done && LU.t >= F.endAt && !LU.sheet) { if (LU.replay) lrReplayEnd(); else lrShowResult(); }
}
function lrShowResult() {
  const F = LU.F, win = F.res.win; lrSay(win ? 'up' : 'down'); try { if (typeof music === 'function') music('day'); } catch (e) { /* 음악 없이 */ }
  const fd = $('lr-feed'); if (fd) fd.innerHTML = ''; lrSheet({ kind: 'result' });
}
function lrResultHtml() {
  const F = LU.F, res = F.res, f = res.fight, R = LU.R, over = R.phase === 'over', bd = f.breakdown.filter(b => b.side === 'nest'), v0 = F.v0;
  const rows = {}; bd.forEach(b => { const k = b.summon ? 's:' + b.kind : b.id, r = rows[k] = rows[k] || { name: b.name, kind: b.kind === 'core' ? 'boss:' + (f.form || 'drop') + ':' + F.step : b.kind, star: b.star, n: 0, dmg: 0, san: 0, heal: 0, kills: 0, conv: 0 }; r.n++; r.dmg += b.dmg; r.san += b.san; r.heal += b.heal; r.kills += b.kills; r.conv += b.conv || 0; });
  const list = Object.keys(rows).map(k => rows[k]).sort((a, b) => (b.dmg + b.san) - (a.dmg + a.san)), top = list.slice(0, over ? 3 : 4), rest = list.slice(top.length), mx = Math.max(1, ...list.map(r => r.dmg)), mxs = Math.max(1, ...list.map(r => r.san));
  const row = r => `<div class="lr-row"><img src="${lrIcon(r.kind, r.star, 32)}" alt=""><div><p><b>${esc(r.name)}${r.n > 1 ? ' ×' + r.n : ''}</b><span>${Math.round(r.dmg)}</span></p><i class="lr-b"><b style="width:${Math.round(r.dmg / mx * 100)}%"></b></i>${r.san > 0 ? `<i class="lr-b san"><b style="width:${Math.round(r.san / mxs * 100)}%"></b></i>` : ''}<small>${[r.san > 0 ? '정신 ' + Math.round(r.san) : '', r.kills ? '처치 ' + r.kills : '', r.conv ? '미침 ' + r.conv : '', r.heal > 0 ? '회복 ' + Math.round(r.heal) : ''].filter(Boolean).join(' · ')}</small></div></div>`;
  const others = rest.length ? `<p class="lr-rest">그 밖 ${rest.length} · ${Math.round(rest.reduce((s, r) => s + r.dmg, 0))}</p>` : '';
  const who = `<h4>누가 얼마나 했나</h4>${top.map(row).join('')}${others}`;
  // 조사자의 끝
  const castRows = (res.cast || []).map(c => { const ci = (v0.cast || []).find(q => q.id === c.id) || LAIR.castInfo(R, c.id), end = c.how === 'swallow' ? ['삼켜졌다', 'l'] : c.mad ? ['미쳤다', 'm'] : !c.alive ? ['쓰러졌다', ''] : ['살아 돌아갔다', 'w']; return `<button class="lr-castrow" data-l="cast" data-id="${c.id}"><img src="${lrIcon(lrCastIcon(ci, v0), 1, 32)}" alt=""><b>${esc(ci.name)}</b><span class="${end[1]}">${end[0]}</span></button>`; }).join('');
  if (over) {
    const win = !!R.over.win, form = LAIR.coreInfo(R), picked = R.mythos.picked.map(LAIR.cardInfo), T = R.uiTop || {}, best = Object.keys(T).sort((a, b) => T[b] - T[a]).slice(0, 3), wins = R.hist.filter(h => h.win).length, hist = {}; R.hist.forEach(h => { hist[h.round] = h.win; });
    const track = Array.from({ length: R.rounds }, (_, k) => { const r = k + 1; return `<i class="lr-tc${hist[r] == null ? '' : hist[r] ? ' w' : ' l'}${r % 5 === 0 ? ' boss' : ''}"></i>` + (r % 5 === 0 && r < R.rounds ? '<i class="lr-tg"></i>' : ''); }).join('');
    return `<h3 class="${win ? 'win' : 'lose'}">${win ? '둥지는 남았다' : '둥지가 읽혔다'}</h3><p class="lr-nar">${esc(win ? LNAR.end : LNAR.fall)}</p>
<div class="lr-end"><img src="${lrIcon('boss:' + form.form + ':' + form.step, 1, 64)}" alt=""><div><b>${esc(form.name)}</b><span>깨어남 ${form.step}/3 · Lv ${R.level}</span><span>${R.over.round}/${R.rounds} 라운드 · ${wins}승 ${R.hist.length - wins}패</span></div></div><p class="lr-track end">${track}</p>`
      + (picked.length ? `<h4>고른 신화</h4><p class="lr-sum">${picked.map(c => `<span class="t${c.tier}"><img src="${lrSym(c.asp, 16)}" alt="">${esc(c.name)}</span>`).join('')}</p>` : '')
      + (best.length ? `<h4>가장 많이 한 권속</h4><p class="lr-sum">${best.map(k => `<span><img class="lr-ki" src="${lrIcon(k, 1, 28)}" alt="">${esc(LAIR.KIN[k].name)} ${T[k]}</span>`).join('')}</p>` : '')
      + `<div class="lr-btns"><button class="pri" data-l="again">다시 한 판</button><button data-l="exit">나가기</button></div>`;
  }
  const e = res.econ, parts = [['기본', e.base], ['이자', e.interest], ['연속', e.streak], ['승리', e.win], ['방', f.gold], ['우두머리', res.bossGold], ['정예', res.eliteBonus || 0]].filter(q => q[1] > 0), fe = res.fear, nx = res.next;
  const line = res.win ? (res.boss ? LNAR.boss : LNAR.win) : res.boss ? LNAR.again : LNAR.lose;
  const sum = `<p class="lr-sum"><span class="g">진액 +${res.income}</span>${res.lost ? `<span class="l">목숨 −${res.lost}</span>` : ''}${res.eliteHeal ? `<span class="w">목숨 +${res.eliteHeal}</span>` : ''}${fe && fe.delta ? `<span class="f">공포 ${fe.delta > 0 ? '+' : '−'}${Math.abs(fe.delta)}</span>` : ''}${f.converted ? `<span class="m">미친 적 ${f.converted}</span>` : ''}${res.zealots ? `<span class="m">광신도 ${res.zealots}</span>` : ''}${res.levelUp ? `<span class="w">둥지 Lv ${R.level}</span>` : ''}<span>${Math.round(f.time)}초</span></p><p class="lr-eco2">${parts.map(q => `${q[0]} ${q[1]}`).join(' · ')}</p>`
    + (fe && fe.worldUp ? `<p class="lr-world">공포 ${fe.now} · ${esc(LAIR.WORLD[fe.world - 1] || '')}</p>` : '') + (res.boss && !res.win ? '<p class="lr-world">우두머리가 다시 온다.</p>' : '');
  const go = nx === 'mythos' ? '신화 단계' : nx === 'choice' ? '보상' : nx === 'encounter' ? '조우' : res.boss && !res.win ? '다시 맞선다' : '다음 싸움';
  return `<h3 class="${res.win ? 'win' : 'lose'}">${res.win ? '막아 냈다' : '뚫렸다'}</h3><p class="lr-nar">${esc(line)}</p>${sum}${castRows ? `<div class="lr-castrows">${castRows}</div>` : ''}${who}<div class="lr-btns"><button class="pri" data-l="next">${go}</button></div>`;
}
function lrNext() {
  lrSheetClose(); const R = LU.R; LU.F = null; LU.phase = 'prep'; $('lr-ov').innerHTML = ''; const up = LU.res && LU.res.levelUp; LU.res = null; lrWarmPrep(); lrDraw(); lrSize();
  if (!lrFlow() && up) lrToast('둥지 Lv ' + R.level);
}

// ---- 그리기 ----
function lrBg() { if (LU.bg) return LU.bg; const c = document.createElement('canvas'); c.width = LW; c.height = LS * 6; const x = c.getContext('2d'); for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) x.drawImage(LAIRART.tile(j < 3 ? 'inv' : 'nest', i, j, LS), i * LS, j * LS); return (LU.bg = c); }
// 발밑 고리: 역할마다 다르다. 탱커 = 두꺼운 겹고리, 근접 = 찬 고리, 원거리 = 빈 점선 고리, 지원 = 빈 잔점 고리, 침투 = 끊긴 고리
function lrRing(x, cx, cy, col, w, role) {
  const far = role === 'ranged' || role === 'support'; x.save(); x.beginPath(); x.ellipse(cx, cy, w, w * 0.36, 0, 0, 6.2832);
  x.globalAlpha = far ? 0.16 : 0.55; x.fillStyle = col; x.fill(); x.globalAlpha = 0.95; x.strokeStyle = col; x.lineWidth = role === 'tank' ? 3 : far ? 2 : 1;
  if (role === 'ranged') x.setLineDash([6, 4]); else if (role === 'support') x.setLineDash([2, 3]); else if (role === 'dive') x.setLineDash([10, 4]);
  x.stroke(); if (role === 'tank') { x.setLineDash([]); x.lineWidth = 1; x.beginPath(); x.ellipse(cx, cy, w + 4, (w + 4) * 0.36, 0, 0, 6.2832); x.stroke(); }
  x.restore();
}
// 역할 표지: 고리의 왼쪽 아래 모서리
function lrBadge(x, role, cx, cy) { if (LAIRART.roleDraw(x, role, cx - 22, cy + 3, 2)) LU.dbg.badges++; }
const LTMP = { c: null };
const LCORE_FADE = 0.45;
// front = 본체의 솟은 데 앞에 누가 서 있는가. 그러면 맨 아랫줄의 윗금 위쪽은 흐리게 그린다
function lrDrawCore(x, h, px, py, anim, t, o, front) {
  if (!h) return; LU.dbg.coreFade = front ? 1 : 0;
  if (!front) return lrDrawUnit(x, h, px, py, anim, t, o);
  const cut = LU.wallH + LS * 5, a = o.alpha == null ? 1 : o.alpha;
  x.save(); x.beginPath(); x.rect(-20, cut, LW + 40, LS * 2); x.clip(); lrDrawUnit(x, h, px, py, anim, t, o); x.restore();
  x.save(); x.beginPath(); x.rect(-20, -20, LW + 40, cut + 20); x.clip(); lrDrawUnit(x, h, px, py, anim, t, Object.assign({}, o, { alpha: a * LCORE_FADE })); x.restore();
}
// 본체 그림의 폭 안, 바로 윗줄에 선 것이 있는가 (xs = 그 줄에 선 것들의 x)
const lrCoreFront = (h, xs) => { const cx = lcen(LAIR.CORE).x, hw = (h ? h.size : 80) / 2 + 14; return xs.some(q => Math.abs(q - cx) < hw); };
function lrDrawUnit(x, h, px, py, anim, t, o) {
  if (!h) return; h.draw(x, px, py, anim, t, o);
  if (o.white) { const c = LTMP.c || (LTMP.c = document.createElement('canvas')), fr = h.frame(anim, t, o); if (c.width < fr.width || c.height < fr.height) { c.width = Math.max(c.width, fr.width); c.height = Math.max(c.height, fr.height); } const g = c.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height); g.drawImage(fr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, fr.width, fr.height);
    const sc = o.scale || 1, gx = h.w / 2, gy = h.pad + h.rig.ground * h.rig.u; x.save(); x.imageSmoothingEnabled = false; x.translate(Math.round(px), Math.round(py)); x.scale(o.flip ? -sc : sc, sc); x.globalAlpha = 0.75; x.drawImage(c, 0, 0, fr.width, fr.height, -gx, -gy, fr.width, fr.height); x.restore(); }
}
function lrStarPips(x, cx, y, n) { if (n < 2) return; const w = n * 7 - 1; for (let k = 0; k < n; k++) { x.fillStyle = '#0c0812'; x.fillRect(cx - w / 2 + k * 7 - 1, y - 1, 7, 7); x.fillStyle = n >= 3 ? '#ffd040' : '#d8e0f0'; x.fillRect(cx - w / 2 + k * 7, y, 5, 5); } }
function lrRender(now) {
  const cv = $('lr-cv'), x = cv.getContext('2d'), R = LU.R, F = LU.F, gnd = LS * 0.3, t = now / 1000; if (!R && !F) return;
  LU.dbg = { badges: 0, range: [], rows: [], dive: 0, dice: 0, coreFade: 0 };
  x.imageSmoothingEnabled = false; x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#07050c'; x.fillRect(0, 0, cv.width, cv.height);
  if (F && F.shake > LU.t) { const m = F.shakeMag * (F.shake - LU.t) / 220; x.translate(Math.round((Math.random() - 0.5) * 2 * m), Math.round((Math.random() - 0.5) * 2 * m)); } else if (F) F.shakeMag = 0;
  x.drawImage(LAIRART.wallTop(LS, 6, t), 0, 0); x.drawImage(lrBg(), 0, LU.wallH);
  const rooms = F ? F.rooms : R.rooms.map(r => ({ id: r.id, cells: r.cells }));
  rooms.forEach(r => { r.cells.forEach((c, k) => { x.save(); if (r.erased) x.globalAlpha = 0.22; x.drawImage(LAIRART.room(r.id, LS, k, r.cells.length, t), lcx(c) - LS / 2, lcy(c) - LS / 2); x.restore(); if (r.pulse > LU.t) { x.fillStyle = 'rgba(255,255,255,' + (0.28 * (r.pulse - LU.t) / 420).toFixed(3) + ')'; x.fillRect(lcx(c) - LS / 2, lcy(c) - LS / 2, LS, LS); } }); });
  if (!F) lrRenderPrep(x, now, gnd); else lrRenderFight(x, now, gnd);
}
function lrRenderPrep(x, now, gnd) {
  const R = LU.R, v = LU.vcache && LU.vcacheT === LU.t ? LU.vcache : lrView(), sel = LU.sel && LU.sel.uid, lifting = sel || (LU.drag && LU.drag.moved);
  // 방을 놓을 자리
  if (LU.roomPick != null && v.roomOffer[LU.roomPick]) { const o = v.roomOffer[LU.roomPick], seen = {}; o.spots.forEach(s => LAIR.roomCells(o.id, s).forEach(c => { seen[c] = 1; })); const a = 0.16 + 0.1 * Math.sin(now / 180); for (let c = 18; c < 36; c++) { if (seen[c]) { x.fillStyle = 'rgba(255,208,64,' + a.toFixed(3) + ')'; x.fillRect(lcx(c) - LS / 2 + 3, lcy(c) - LS / 2 + 3, LS - 6, LS - 6); x.strokeStyle = 'rgba(255,224,120,.85)'; x.lineWidth = 1; x.setLineDash([4, 3]); x.lineDashOffset = -now / 60; x.strokeRect(lcx(c) - LS / 2 + 3.5, lcy(c) - LS / 2 + 3.5, LS - 7, LS - 7); x.setLineDash([]); } else { x.fillStyle = 'rgba(5,4,10,.5)'; x.fillRect(lcx(c) - LS / 2, lcy(c) - LS / 2, LS, LS); } } }
  if (LU.roomPop && LU.t - LU.roomPop.t0 < 500) { const k = 1 - (LU.t - LU.roomPop.t0) / 500; LU.roomPop.cells.forEach(c => { x.fillStyle = 'rgba(255,255,255,' + (0.5 * k).toFixed(3) + ')'; x.fillRect(lcx(c) - LS / 2, lcy(c) - LS / 2, LS, LS); }); }
  // 세울 수 있는 칸. 집은 권속의 역할에 맞는 줄은 빛깔을 입히고, 그 자리에서 닿는 칸을 보여 준다
  const liftUid = LU.drag && LU.drag.moved ? LU.drag.uid : sel, lu = liftUid && R.unit[liftUid] ? LAIR.unitInfo(R.unit[liftUid].kind, R.unit[liftUid].star) : null;
  if (lifting) {
    const rowOf = lu ? lu.row : 'any', rc = lu ? LAIRART.ROLEC[lu.role] : null;
    for (let c = 18; c < 36; c++) { if (LAIR.CORE.includes(c)) continue; const r = Math.floor(c / 6), good = (rowOf === 'front' && r === 3) || (rowOf === 'back' && r === 5);
      if (good) { LU.dbg.rows.push(c); x.save(); x.globalAlpha = 0.2 + 0.06 * Math.sin(now / 220); x.fillStyle = rc; x.fillRect(lcx(c) - LS / 2 + 3, lcy(c) - LS / 2 + 3, LS - 6, LS - 6); x.restore(); }
      x.strokeStyle = LU.hover === c ? '#fff3a0' : good ? rc : 'rgba(143,232,216,.55)'; x.lineWidth = LU.hover === c || good ? 2 : 1; x.strokeRect(lcx(c) - LS / 2 + 3.5, lcy(c) - LS / 2 + 3.5, LS - 7, LS - 7); }
    if (lu) { const w = LAIR.whereOf(R, liftUid), at = LU.drag && LU.drag.moved ? (LU.hover >= 18 && !LAIR.CORE.includes(LU.hover) ? LU.hover : -1) : (w && w.cell != null ? w.cell : -1);
      if (at >= 0) for (let c = 0; c < 36; c++) { if (c === at || LAIR.cheb(at, c) > lu.range) continue; LU.dbg.range.push(c); const px = lcx(c), py = lcy(c), h = LS / 2 - 5; x.save(); x.fillStyle = 'rgba(255,226,122,' + (c < 18 ? 0.2 : 0.08) + ')'; x.fillRect(px - h, py - h, h * 2, h * 2); x.strokeStyle = 'rgba(255,226,122,.9)'; x.lineWidth = 2; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { x.beginPath(); x.moveTo(px + sx * h, py + sy * (h - 8)); x.lineTo(px + sx * h, py + sy * h); x.lineTo(px + sx * (h - 8), py + sy * h); x.stroke(); } x.restore(); } }
  }
  const list = [];
  const foes = LAIR.curEnemy(R);
  foes.forEach(e => list.push({ y: lcy(e.cell), d: () => { const h = lrUnitH(e.kind, 1, e.poss ? 'poss' : e.cast && R.cast && R.cast.mem[e.cast] && (R.cast.mem[e.cast].state === 'mad' || R.cast.mem[e.cast].state === 'hurt') ? 'hurt' : ''), px = lcx(e.cell), py = lcy(e.cell) + gnd; const role = LAIR.INV[e.kind] ? LAIR.INV[e.kind].role : 'melee'; lrRing(x, px, py - 2, e.cast ? '#ffb040' : '#c8303a', LAIR.INV[e.kind] && LAIR.INV[e.kind].boss ? 22 : 17, role); lrDrawUnit(x, h, px, py, 'idle', now + e.cell * 97, { flip: true, alpha: 0.92 }); } }));
  Object.keys(R.board).forEach(c => { const uid = R.board[c], u = R.unit[uid]; c = +c; list.push({ y: lcy(c) + (uid === sel ? 1 : 0), d: () => { const h = lrUnitH(u.kind, u.star), px = lcx(c), up = uid === sel ? 7 + Math.sin(now / 160) * 2 : 0, py = lcy(c) + gnd; let sc = 1; if (LU.cellPop && LU.cellPop.cell === c && LU.t - LU.cellPop.t0 < 320) { const k = (LU.t - LU.cellPop.t0) / 320; sc = 1 + (LU.cellPop.soft ? 0.12 : 0.35) * Math.sin(k * 3.1416); } lrRing(x, px, py - 2, uid === sel ? '#fff3a0' : '#2fa8a0', 17, LAIR.KIN[u.kind].role); lrDrawUnit(x, h, px, py - up, 'idle', now + c * 131, { scale: sc }); lrStarPips(x, px, py - h.size * 0.86 - 8 - up, u.star); } }); });
  const cp = lcen(LAIR.CORE);
  { const bh = lrBossH(R.form, R.awake), front = lrCoreFront(bh, Object.keys(R.board).map(Number).filter(c => Math.floor(c / 6) === 4).map(lcx)); list.push({ y: -1, d: () => { lrRing(x, cp.x, cp.y + gnd, '#2fa8a0', 40); lrDrawCore(x, bh, cp.x, cp.y + gnd + 4, 'idle', now, {}, front); } }); }
  list.sort((a, b) => a.y - b.y).forEach(q => q.d());
  // 역할 표지는 몸 위에 그린다. 침투하는 적은 뛰어들 뒷줄까지 줄을 긋는다
  foes.forEach(e => { const role = LAIR.INV[e.kind] ? LAIR.INV[e.kind].role : 'melee'; lrBadge(x, role, lcx(e.cell), lcy(e.cell) + gnd - 2);
    if (role === 'dive') { LU.dbg.dive++; const x0 = lcx(e.cell), y0 = lcy(e.cell) + 8, col = e.cell % 6, x1 = lcx(30 + (col === 2 ? 1 : col === 3 ? 4 : col)), y1 = lcy(30) - 6, mx = (x0 + x1) / 2 + (col < 3 ? -40 : 40), my = (y0 + y1) / 2; x.save(); x.strokeStyle = LAIRART.ROLEC.dive; x.globalAlpha = 0.85; x.lineWidth = 2; x.setLineDash([6, 5]); x.lineDashOffset = -now / 45; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(mx, my, x1, y1); x.stroke(); x.setLineDash([]); const an = Math.atan2(y1 - my, x1 - mx); x.fillStyle = LAIRART.ROLEC.dive; x.beginPath(); x.moveTo(x1 + Math.cos(an) * 6, y1 + Math.sin(an) * 6); x.lineTo(x1 + Math.cos(an + 2.5) * 9, y1 + Math.sin(an + 2.5) * 9); x.lineTo(x1 + Math.cos(an - 2.5) * 9, y1 + Math.sin(an - 2.5) * 9); x.fill(); x.restore(); } });
  Object.keys(R.board).forEach(c => { const u = R.unit[R.board[c]]; lrBadge(x, LAIR.KIN[u.kind].role, lcx(+c), lcy(+c) + gnd - 2); });
}
// 싸움 중의 막대: 얇게 한 덩어리로. 체력(3) · 정신(2, 보라) · 마나(1, 파랑). 작은 것(새끼, 감염체)은 체력만
function lrBars(x, e, top, w) {
  const x0 = Math.round(e.x - w / 2), iw = w - 2, inv = e.side === 'inv' && !e.mad, hasSan = !!e.msan && !e.mad, hasMana = !!e.mmana && !e.minor, hh = e.minor ? 2 : e.core || e.boss ? 4 : 3, H = 2 + hh + (hasSan ? 3 : 0) + (hasMana ? 2 : 0);
  top = Math.round(top); x.fillStyle = '#0c0812'; x.fillRect(x0, top, w, H); x.fillStyle = '#2a2434'; x.fillRect(x0 + 1, top + 1, iw, hh);
  const hf = Math.max(0, Math.min(1, e.hp / e.mhp)), fw = Math.round(iw * hf), lw = Math.round(iw * Math.min(1, e.lag || 0)) - fw;
  if (lw > 0) { x.fillStyle = '#ffffff'; x.fillRect(x0 + 1 + fw, top + 1, lw, hh); }
  if (fw > 0) { x.fillStyle = e.mad ? '#f070e8' : inv ? '#e85040' : '#3ad8b0'; x.fillRect(x0 + 1, top + 1, fw, hh); x.fillStyle = e.mad ? '#ffc8f8' : inv ? '#ffb0a0' : '#c0fff0'; x.fillRect(x0 + 1, top + 1, fw, 1); }
  if (e.shield) { x.fillStyle = '#bfe8ff'; x.fillRect(x0, top - 1, w, 1); }
  let y = top + 1 + hh;
  if (hasSan) { x.fillStyle = '#1a1230'; x.fillRect(x0 + 1, y + 1, iw, 2); x.fillStyle = '#b08fff'; x.fillRect(x0 + 1, y + 1, Math.round(iw * Math.max(0, Math.min(1, e.san / e.msan))), 2); y += 3; }
  if (hasMana) { const mk = Math.max(0, Math.min(1, e.mana / e.mmana)); x.fillStyle = '#10182c'; x.fillRect(x0 + 1, y + 1, iw, 1); x.fillStyle = mk >= 1 ? '#fff3a0' : '#4aa8ff'; x.fillRect(x0 + 1, y + 1, Math.round(iw * mk), 1); }
  return H;
}
function lrRenderFight(x, now, gnd) {
  const F = LU.F, T = F.T, ms = T * 1000, fxo = { px: 2, size: LS };
  F.zones.forEach(z => z.cells.forEach(c => LAIRART.fx('burnzone', x, { x: lcx(c), y: lcy(c) }, { x: lcx(c), y: lcy(c) }, ((T - z.t0) * 1.3) % 1, fxo)));
  F.fx.forEach(f => { if (f.under && f.a && T >= f.t0) LAIRART.fx(f.name, x, f.a, f.b, (T - f.t0) / f.dur, Object.assign({}, fxo, f.o)); });
  // 죽은 것은 먼저(밑에), 그다음 위에서 아래로
  const lay = e => (e.dead ? 0 : e.core && e.anim !== 'cast' ? 1 : 2), list = Object.keys(F.ents).map(id => F.ents[id]).filter(e => !(e.dead && T - e.dieT > (e.swallow ? 0.3 : 1))).sort((a, b) => lay(a) - lay(b) || a.y - b.y);
  const rowY = lcy(24), coreFront = lrCoreFront(lrBossH(F.form || 'drop', F.step), list.filter(e => !e.dead && !e.core && Math.abs(e.y - rowY) < LS * 0.55).map(e => e.x));
  // 겨누는 줄
  F.lines.forEach(l => { const a = l.pa || lrPos(F, l.a), b = l.pb || lrPos(F, l.b); if (!a || !b) return; if (l.aggro) { const k = Math.max(0, (l.until - T)); x.save(); x.globalAlpha = Math.min(1, k * 2); x.strokeStyle = '#f0a04a'; x.lineWidth = 2; x.setLineDash([7, 4]); x.lineDashOffset = -now / 25; x.beginPath(); x.moveTo(Math.round(a.x), Math.round(a.y - 10)); x.lineTo(Math.round(b.x), Math.round(b.y - 10)); x.stroke(); x.restore(); return; } x.save(); x.strokeStyle = l.side === 'nest' ? 'rgba(143,232,216,.8)' : 'rgba(255,150,120,.8)'; x.lineWidth = 1; x.setLineDash([3, 3]); x.lineDashOffset = -now / 40; x.beginPath(); x.moveTo(Math.round(a.x), Math.round(a.y - 10)); x.lineTo(Math.round(b.x), Math.round(b.y - 10)); x.stroke(); x.restore(); });
  list.forEach(e => {
    const h = lrHandle(e); if (!h) return; let px = e.x + e.rx, py = e.y + gnd + e.ry, sc = e.minor ? 0.8 : 1, alpha = e.minor ? 0.85 : 1;
    if (e.lunge) { const k = (T - e.lunge.t0) / 0.46; if (k >= 1) e.lunge = null; else { const s = e.lunge.r ? (k < 0.41 ? 0 : -(k < 0.5 ? (k - 0.41) / 0.09 : 1 - (k - 0.5) / 0.5)) : k < 0.3 ? -0.2 * (k / 0.3) : k < 0.45 ? -0.2 + 1.2 * ((k - 0.3) / 0.15) : k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; px += e.lunge.ux * e.lunge.len * s; py += e.lunge.uy * e.lunge.len * s; } }
    if (e.mvDur > 0 && (e.mvAnim === 'leap')) { const k = Math.min(1, (T - e.mv0) / e.mvDur); py -= Math.sin(k * 3.1416) * 26; }
    if (e.mvDur > 0 && e.mvAnim === 'blink') alpha = 0.4;
    if (e.pop && T - e.pop < 0.3) sc *= 0.3 + 0.7 * ((T - e.pop) / 0.3);
    // 쓰러진 것은 곧 흐려져 주역을 가리지 않는다
    if (e.dead) { const k = T - e.dieT; if (e.swallow) { sc = Math.max(0.05, 1 - k / 0.3); alpha = sc; } else alpha *= k < 0.25 ? 1 - k * 1.6 : k < 0.7 ? 0.6 : Math.max(0, 0.6 * (1 - (k - 0.7) / 0.3)); }
    if (e.st.stealth) alpha *= 0.45;
    if (e.core) py += 4;
    if (!e.dead) lrRing(x, e.x, e.y + gnd - 2 + (e.core ? 4 : 0), e.mad ? '#f070e8' : e.side === 'nest' ? '#2fa8a0' : e.cast ? '#ffb040' : '#c8303a', e.core ? 40 : e.boss ? 22 : e.minor ? 11 : 17, e.core ? null : e.role);
    if (e.castT != null && T - e.castT < e.castDur && !e.dead) { const k = (T - e.castT) / e.castDur, col = e.side === 'nest' ? (LCOL[e.asp] || '#8fe8d8') : '#ffb060', rw = (e.core ? 54 : 30) * (1.25 - k * 0.75); x.save(); x.globalAlpha = 0.35 + 0.55 * k; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.ellipse(Math.round(e.x), Math.round(e.y + gnd - 2), rw, rw * 0.4, 0, 0, 6.2832); x.stroke(); x.globalAlpha = 0.18 * k; x.fillStyle = col; x.fill(); x.restore(); }
    const anim = e.anim, at = anim === 'idle' || anim === 'move' || anim === 'mad' ? ms + e.off : (T - e.a0) * 1000;
    const o = { flip: !!e.face, mad: e.mad, scale: sc, alpha, white: e.flash > LU.t || e.glow > LU.t };
    if (e.core) lrDrawCore(x, h, px, py, anim, at, o, coreFront && anim !== 'cast' && !e.dead); else lrDrawUnit(x, h, px, py, anim, at, o);
  });
  // 막대와 상태 (역할 표지는 싸움 중에는 그리지 않는다: 발밑 고리의 모양이 역할이다)
  list.forEach(e => {
    if (e.dead) return; const h = lrHandle(e), top = e.core ? Math.max(e.y + gnd - (h ? h.size : 80) * 0.86 - 2, LU.wallH + LS * 5 - 22) : e.y + gnd - (h ? h.size : 48) * (e.minor ? 0.7 : 0.86) - 7, w = e.core ? 64 : e.boss ? 44 : e.minor ? 16 : 28, bh = lrBars(x, e, top, w);
    if (e.minor) return;
    lrStarPips(x, e.x, top - 7, e.side === 'nest' && !e.core && !e.summon ? e.star : 0);
    let k = 0; for (const st in e.st) { if (!LSTC[st] || k >= 4) continue; const sx = Math.round(e.x - w / 2 + 1 + k * 6), sy = Math.round(top + bh + 1); x.fillStyle = '#0c0812'; x.fillRect(sx - 1, sy - 1, 6, 6); x.fillStyle = LSTC[st]; x.fillRect(sx, sy, 4, 4); k++; }
  });
  list.forEach(e => { if (e.dead || !e.st.marked) return; const cy = e.y + gnd - 26, r = 15 + Math.sin(now / 130) * 1.5; x.save(); x.strokeStyle = '#ff4060'; x.lineWidth = 2; x.setLineDash([5, 4]); x.lineDashOffset = now / 50; x.beginPath(); x.arc(Math.round(e.x), Math.round(cy), r, 0, 6.2832); x.stroke(); x.restore(); });
  F.fx.forEach(f => { if (!f.under && f.a && T >= f.t0) LAIRART.fx(f.name, x, f.a, f.b, (T - f.t0) / f.dur, Object.assign({}, fxo, f.o)); });
  const nl = 820 / Math.sqrt(LU.speed); F.nums = F.nums.filter(n => LU.t - n.t0 < nl); F.nums.forEach(n => LAIRART.num(x, n.x, n.y, n.text, n.kind, (LU.t - n.t0) / nl, n.kind === 'crit' ? 4 / 3 : n.kind === 'guard' ? 1.5 : 2));
  lrPlates(F, gnd);
  // 시작 알림 · 광란
  if (F.banner && F.banner.until > LU.t && !F.banner.shown) { F.banner.shown = 1; lrLabel(LW / 2, LU.wallH + 26, F.banner.text, 'ban', F.banner.until - LU.t); }
}
// 큰 공포 판정의 주사위 판: 뼈로 깎은 흰 주사위. 성공한 눈은 보랏빛 테, 실패는 어둡게. 이름표보다 위에 뜨는 DOM 이고, 멎으면 결과가 함께 적힌다
const LPIP = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const LCHK = { froze: ['얼어붙었다', 'mad'], shaken: ['흔들렸다', 'inv'], held: ['버텼다', 'held'] };
function lrPlate(F, u, ev) {
  const mo = typeof motionOk !== 'function' || motionOk(), roll = mo ? 800 : 0, d = document.createElement('div'); d.className = 'lr-dice';
  d.innerHTML = `<span>${ev.dice.map(() => '<i class="lr-die">' + '<u></u>'.repeat(9) + '</i>').join('')}</span><b></b>`;
  while (F.plates.length >= 2) F.plates.shift().el.remove();
  $('lr-ov').appendChild(d); F.plates.push({ el: d, id: u.id, dice: ev.dice.slice(), face: ev.face, res: ev.res, t0: LU.t, roll, until: LU.t + roll + 1500, said: false, seed: Math.floor(ev.t * 97), last: -9 });
}
function lrPlateFace(die, n, cls) { const us = die.children, on = LPIP[n] || LPIP[1]; for (let k = 0; k < 9; k++) us[k].className = on.includes(k) ? 'on' : ''; die.className = 'lr-die ' + cls; }
function lrPlates(F, gnd) {
  if (!F.plates.length) return; F.plates = F.plates.filter(p => { if (p.until > LU.t && F.ents[p.id] && p.el.parentNode) return true; p.el.remove(); return false; });
  F.plates.forEach(p => {
    const e = F.ents[p.id], h = lrHandle(e), sc = LU.scale, top = e.y + gnd - (h ? h.size : 48) * 0.86 - 12, el = LU.t - p.t0, rolling = el < p.roll, dice = p.el.firstChild.children, hw = dice.length * 13 + 8;
    p.el.style.left = Math.max(hw, Math.min(LW * sc - hw, e.x * sc)) + 'px'; p.el.style.top = Math.max(64, top * sc) + 'px';
    const tick = rolling ? Math.floor(el / 80) : -1; if (tick !== p.last) { p.last = tick; for (let i = 0; i < dice.length; i++) lrPlateFace(dice[i], rolling ? 1 + ((p.seed + i * 5 + tick * (i + 2)) % 6) : p.dice[i], rolling ? 'roll' : p.dice[i] >= p.face ? 'ok' : 'fail'); }
    if (!rolling && !p.said) { p.said = true; const L = LCHK[p.res]; p.el.lastChild.textContent = L[0]; p.el.classList.add(p.res); lrFeed(F, e, L[0], p.res === 'froze' ? 'mad' : ''); if (p.res === 'froze') { lrAddFx(F, 'madburst', { x: e.x, y: e.y - 8 }, null, { r: 1.2 }, 0.5); lrStop(F, 140, 3); lrSay('mad'); } else lrSay(p.res === 'held' ? 'thud' : 'hit'); }
    LU.dbg.dice += dice.length;
  });
}
function lrLoop(now) {
  LU.raf = requestAnimationFrame(lrLoop); const dt = Math.min(100, now - LU.last); LU.last = now; LU.t = now;
  if ($('lr').hidden) return;
  LU.fpsN = (LU.fpsN || 0) + 1;
  lrWarmStep(LU.phase === 'fight' ? 3 : 6);
  if (LU.phase === 'fight') lrStep(dt);
  lrRender(now);
  if (LU.sheet) lrSheetAnim(now);
  if (LU.toastT && now > LU.toastT) { $('lr-toast').hidden = true; LU.toastT = 0; }
}
// 시험용
if (typeof window !== 'undefined') window.__lair = { get R() { return LU.R; }, get U() { return LU; }, get F() { return LU.F; }, L: typeof LAIR !== 'undefined' ? LAIR : null, open: run => lairOpen(run), saved: () => lairSaved(), fresh: seed => lrNew(seed), view: () => lrView(), flow: () => lrFlow(), art: (k, st) => lrArtId(k, st), pt(c) { const r = $('lr-cv').getBoundingClientRect(); return { x: r.left + lcx(c) * LU.scale, y: r.top + lcy(c) * LU.scale }; }, redraw: () => { lrWarmPrep(); lrDraw(); }, give(kind, star, cell) { const R = LU.R, uid = R.nextUid++; R.unit[uid] = { uid, kind, star: star || 1 }; if (cell != null) R.board[cell] = uid; else R.bench[R.bench.indexOf(null)] = uid; return uid; }, sheet: s => lrSheet(s), dbg: () => LU.dbg, speeds: () => LSPD.map(q => q[0]), stats() { const F = LU.F; return F ? { T: F.T, i: F.i, n: F.tl.length, done: F.done, intro: F.intro, real: F.real / 1000, slows: F.slows, blocks: F.blocks, shots: F.shots, taunts: F.taunts, replay: !!LU.replay, checks: F.checks, bigChecks: F.bigChecks, boons: F.boons, dice: F.plates.length, bigCasts: F.bigCasts, smallCasts: F.smallCasts, frozen: F.frozen, crowd: F.crowd, labs: F.labs.filter(l => l.until > LU.t && !l.ban).length, meter: Object.keys(F.meter).length, alive: Object.keys(F.ents).filter(id => !F.ents[id].dead && !F.ents[id].core).length, mads: F.mads, casts: F.casts, late: F.late.length, ents: Object.keys(F.ents).length, frames: LU.fpsN } : null; } };
