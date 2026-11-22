// 옛 것의 둥지 — 겉: 첫 화면, 도감, 도움말, 설정, 지난 판
// 판 자체는 lairui.js 가 맡는다. 여기서는 lairOpen(run) 으로 들여보내고, lrExit() 가 showTitle() 로 돌려보낸다.
let CLOUD = null;
async function initCloud() { try { if (!window.claude || !window.claude.use) return; const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); if (!db || !user) return; const uid = await user.id(); if (uid) CLOUD = { db, user, uid }; } catch (e) { /* 연결 없이 간다 */ } }

const SH = { raf: 0, last: 0, open: null, tab: 'kin', pick: null, star: 1, page: 'board', bg: null, wallH: 45, cast: null, busy: false };
const SHURL = {};
const shUrl = (k, fn) => { if (SHURL[k] == null) { try { SHURL[k] = fn().toDataURL(); } catch (e) { SHURL[k] = ''; } } return SHURL[k]; };
const shSym = (id, px) => `<img class="sh-ic" src="${shUrl('sym:' + id + ':' + px, () => LAIRART.sym(id, px))}" width="${px}" height="${px}" alt="">`;
const shRole = (role, px) => LAIR.ROLE[role] ? `<img class="sh-ic" src="${shUrl('role:' + role + ':' + px, () => LAIRART.role(role, px))}" width="${px}" height="${px}" alt="">` : '';
const shKinIcon = (id, star, px) => `<img class="sh-ic" src="${shUrl('ic:' + id + ':' + star + ':' + px, () => LAIRART.icon(id, star, px))}" width="${px}" height="${px}" alt="">`;
const shSay = k => { try { sfx(k); } catch (e) { /* 소리를 못 내는 환경 */ } };
const shVol = () => { try { const v = META.vol || {}; musicVol((v.master == null ? 1 : v.master) * (v.music == null ? 1 : v.music)); } catch (e) { /* 음악 없이 */ } };

// ---------- 첫 화면 ----------
function showTitle() {
  const lr = $('lr'); if (lr) lr.hidden = true; shClose(); $('title').hidden = false; SH.cast = null;
  let run = null; try { run = lairSaved(); } catch (e) { run = null; }
  const n = META.last.length;
  $('menu').innerHTML = (run ? `<button class="btn pri" data-a="cont">이어하기<small>${run.round}/${run.rounds}</small></button><button class="btn" data-a="start">새로 시작</button>` : '<button class="btn pri" data-a="start">시작</button>')
    + '<div class="sh-row3"><button class="btn" data-a="codex">도감</button><button class="btn" data-a="help">도움말</button><button class="btn" data-a="set">설정</button></div>'
    + (n ? `<button class="sh-lnk" data-a="last">지난 판 ${n}</button>` : '');
  try { music('title'); } catch (e) { /* 음악 없이 */ }
  shWake();
}
// 첫 화면 그림: 둥지 안쪽. 본체와, 지금까지 본 권속 몇이 숨을 쉰다
function shCast() {
  const seen = LAIR.KIN_IDS.filter(k => META.seen.kin[k]), pool = (seen.length >= 4 ? seen : LAIR.KIN_IDS).slice().sort((a, b) => LAIR.KIN[a].cost - LAIR.KIN[b].cost).slice(0, 4), gy = SH.wallH + 128 - 18;
  const spots = [[52, gy - 40, 0], [116, gy, 0], [268, gy, 1], [332, gy - 40, 1]];
  return [{ boss: 1, x: 192, y: gy - 6, ph: 0 }].concat(pool.map((id, i) => ({ id, x: spots[i][0], y: spots[i][1], flip: !!spots[i][2], ph: i * 370 }))).sort((a, b) => a.y - b.y);
}
function shTitleDraw(now) {
  const cv = $('tcv'); if (!cv) return; const x = cv.getContext('2d'), S = 64; x.imageSmoothingEnabled = false;
  try {
    if (!SH.bg) { const w = LAIRART.wallTop(S, 6, 0), c = document.createElement('canvas'); c.width = 384; c.height = w.height + S * 2; const g = c.getContext('2d'); for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) g.drawImage(LAIRART.tile('nest', i, j + 4, S), i * S, w.height + j * S); SH.bg = c; SH.wallH = w.height; }
    if (cv.width !== 384 || cv.height !== SH.bg.height) { cv.width = 384; cv.height = SH.bg.height; }
    x.fillStyle = '#07050c'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(SH.bg, 0, 0); x.drawImage(LAIRART.wallTop(S, 6, now / 1000), 0, 0);
    const cast = SH.cast || (SH.cast = shCast());
    cast.forEach(u => { const h = u.boss ? LAIRART.boss('drop') : LAIRART.unit(u.id, 1); if (h) h.draw(x, u.x, u.y, 'idle', now + u.ph, { flip: u.flip }); });
  } catch (e) { /* 그림 없이도 첫 화면은 뜬다 */ }
}
function shWake() { if (!SH.raf) SH.raf = requestAnimationFrame(shLoop); }
function shLoop(now) {
  const title = !$('title').hidden, modal = !$('modal').hidden;
  if (!title && !modal) { SH.raf = 0; return; }
  SH.raf = requestAnimationFrame(shLoop); if (now - SH.last < 30) return; SH.last = now;
  if (title && !modal) shTitleDraw(now);
  if (modal) shAnim(now);
}

// ---------- 시작, 이어하기 ----------
async function shStart(run) {
  if (SH.busy) return; SH.busy = true; shClose();
  try {
    const auto = navigator.webdriver && !window.__forceIntro;
    if (!run && !META.introSeen && !auto && typeof playIntro === 'function') { $('title').hidden = true; await playIntro(); }
  } catch (e) { /* 영상 없이 간다 */ }
  SH.busy = false;
  try { lairOpen(run || null); } catch (e) { console.error(e); const lr = $('lr'); if (lr) lr.hidden = true; $('title').hidden = false; shToast('판을 열지 못했다. 새로 시작한다.'); try { store.del('lairrun'); } catch (er) { /* 저장 없이 */ } showTitle(); }
}
async function shFilm() { shClose(); try { await playIntro(); } catch (e) { /* 영상 없이 간다 */ } shWake(); }
function shToast(msg) { const t = $('toast'); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(SH.toastT); SH.toastT = setTimeout(() => { t.hidden = true; }, 2600); }

// ---------- 창 ----------
function shOpen(kind, html) { SH.open = kind; const m = $('modal'); m.innerHTML = `<div class="sh-box" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; shWake(); }
function shClose() { SH.open = null; const m = $('modal'); if (m) { m.hidden = true; m.innerHTML = ''; } }
const shHead = (title, extra) => `<div class="sh-head"><h2>${title}</h2>${extra || ''}<button class="sh-x" data-a="close" aria-label="닫기">✕</button></div>`;
const shTabs = (list, cur, act) => `<div class="sh-tabs" style="grid-template-columns: repeat(${list.length}, minmax(0, 1fr))">${list.map(([id, name, sub]) => `<button class="sh-tab${id === cur ? ' on' : ''}" data-a="${act}" data-v="${id}" aria-pressed="${id === cur}"><b>${name}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;
function shAsk(text, yes, act) { shOpen('ask', `<div class="sh-ask"><p>${text}</p><div class="sh-btns"><button class="btn pri" data-a="${act}">${yes}</button><button class="btn" data-a="close">그만둔다</button></div></div>`); }

// ---------- 도감 ----------
const shSynKnown = id => LAIR.KIN_IDS.some(k => META.seen.kin[k] && (LAIR.KIN[k].asp === id || LAIR.KIN[k].cls === id));
const shFormIds = () => Object.keys(LAIR.FORM);
const shFormKnown = id => id === 'drop' || !!META.seen.form[id];
function shCodexSets() {
  return { kin: ['권속', LAIR.KIN_IDS, id => !!META.seen.kin[id]], inv: ['침입자', LAIR.INV_IDS, id => !!META.seen.inv[id]], room: ['방', LAIR.ROOM_IDS, id => !!META.seen.room[id]], syn: ['시너지', LAIR.SYN_IDS, shSynKnown], form: ['본체', shFormIds(), shFormKnown] };
}
const shStat = (k, n) => `<span class="sh-st"><small>${k}</small><b>${n}</b></span>`;
function shCodex() {
  const sets = shCodexSets(), tab = sets[SH.tab] ? SH.tab : 'kin', [, ids, known] = sets[tab];
  const tabs = shTabs(Object.keys(sets).map(k => [k, sets[k][0], sets[k][1].filter(sets[k][2]).length + '/' + sets[k][1].length]), tab, 'ctab');
  let body = '';
  if (SH.pick && ids.includes(SH.pick) && known(SH.pick)) body = shCodexDetail(tab, SH.pick);
  else { SH.pick = null; body = `<div class="sh-grid">${ids.map(id => { const ok = known(id), nm = ok ? shCodexName(tab, id) : '';
    const pic = tab === 'syn' ? (ok ? shSym(id, 32) : '<i class="sh-q"></i>') : `<canvas class="sh-cv" width="${tab === 'form' ? 96 : 64}" height="${tab === 'form' ? 96 : 64}" data-k="${tab}" data-id="${id}"${ok ? '' : ' data-dark="1"'}></canvas>`;
    return `<button class="sh-cell${ok ? '' : ' no'}" data-a="cpick" data-v="${id}"${ok ? '' : ' disabled'} aria-label="${ok ? esc(nm) : '아직 보지 못했다'}">${pic}<span>${ok ? esc(nm) : '—'}</span></button>`; }).join('')}</div>`; }
  shOpen('codex', shHead('도감') + tabs + `<div class="sh-body">${body}</div>`);
}
function shCodexName(tab, id) { return tab === 'kin' ? LAIR.KIN[id].name : tab === 'inv' ? LAIR.INV[id].name : tab === 'room' ? LAIR.ROOM[id].name : tab === 'syn' ? LAIR.SYN[id].name : LAIR.FORM[id].name; }
function shCodexDetail(tab, id) {
  const back = '<button class="btn sm" data-a="cback">목록</button>'; let h = '';
  if (tab === 'kin') { const st = Math.max(1, Math.min(3, SH.star || 1)), u = LAIR.unitInfo(id, st);
    h = `<div class="sh-dhead"><canvas class="sh-cv big" width="96" height="96" data-k="kin" data-id="${id}" data-star="${st}" data-show="1"></canvas><div><h3>${esc(u.name)}</h3><p class="sh-tags">${shRole(u.role, 18)}<b>${esc(u.roleName)}</b> · ${esc(u.reach)}</p><p class="sh-tags">${shSym(u.asp, 16)}${esc(u.aspName)} ${shSym(u.cls, 16)}${esc(u.clsName)} · 값 ${u.cost}</p><div class="sh-stars">${[1, 2, 3].map(n => `<button class="sh-star${n === st ? ' on' : ''}" data-a="cstar" data-v="${n}" aria-pressed="${n === st}">${'★'.repeat(n)}</button>`).join('')}</div></div></div>`
      + `<div class="sh-stats">${shStat('체력', u.hp)}${shStat('공격', u.atk)}${shStat('방어', u.df)}${shStat('닿는 칸', u.range)}${shStat('마나', u.mana)}${u.sanAtk ? shStat('정신 피해', u.sanAtk) : ''}</div><div class="sh-skill"><b>${esc(u.skill.name)}</b><span>${esc(u.skill.short)}</span><p>${esc(u.skill.more)}</p></div>`; }
  if (tab === 'inv') { const u = LAIR.invInfo(id, 1);
    h = `<div class="sh-dhead"><canvas class="sh-cv big" width="96" height="96" data-k="inv" data-id="${id}" data-show="1"></canvas><div><h3>${esc(u.name)}</h3><p class="sh-tags">${shRole(u.role, 18)}<b>${esc(u.roleName)}</b> · ${esc(u.reach)}${u.elite ? ' · 정예' : ''}${u.boss ? ' · 우두머리' : ''}</p><p class="sh-tags mute">첫 싸움의 수치</p></div></div>`
      + `<div class="sh-stats">${shStat('체력', u.hp)}${shStat('정신', u.noMad ? '—' : u.san)}${shStat('공격', u.atk)}${shStat('방어', u.df)}${shStat('닿는 칸', u.range)}</div><div class="sh-skill"><b>${esc(u.skill.name)}</b><span>${esc(u.skill.short)}</span><p>${esc(u.skill.more)}</p></div>`; }
  if (tab === 'room') { const r = LAIR.roomInfo(id); h = `<div class="sh-dhead"><canvas class="sh-cv big" width="96" height="96" data-k="room" data-id="${id}" data-show="1"></canvas><div><h3>${esc(r.name)}</h3><p class="sh-tags">${r.len}칸</p></div></div><div class="sh-skill"><span>${esc(r.short)}</span><p>${esc(r.more)}</p></div>`; }
  if (tab === 'syn') { const s = LAIR.synInfo(id, 0), mem = LAIR.KIN_IDS.filter(k => LAIR.KIN[k].asp === id || LAIR.KIN[k].cls === id);
    h = `<div class="sh-dhead"><span class="sh-bigsym">${shSym(id, 32)}</span><div><h3>${esc(s.name)}</h3><p class="sh-tags">${s.kind === 'asp' ? '성향' : '종류'}</p></div></div><div class="sh-tiers">${s.need.map((n, i) => `<p><b>${n}</b>${esc(s.shorts[i])}</p>`).join('')}</div><div class="sh-skill"><p>${esc(s.more)}</p></div>`
      + `<div class="sh-mem">${mem.map(k => META.seen.kin[k] ? `<button class="sh-memb" data-a="cgo" data-v="${k}" aria-label="${esc(LAIR.KIN[k].name)}">${shKinIcon(k, 1, 40)}</button>` : '<span class="sh-memb no"><i class="sh-q"></i></span>').join('')}</div>`; }
  if (tab === 'form') { const f = LAIR.formInfo(id, 1); h = `<div class="sh-dhead"><canvas class="sh-cv big" width="96" height="96" data-k="form" data-id="${id}" data-show="1"></canvas><div><h3>${esc(f.name)}</h3><p class="sh-tags">${id === 'drop' ? '처음의 모습' : shSym(id, 16) + esc(LAIR.SYN[id] ? LAIR.SYN[id].name : '') + ' 성향을 가장 많이 모았을 때'}</p></div></div><div class="sh-skill"><b>${esc(f.skill.name)}</b><span>${esc(f.skill.short)}</span><p>${esc(f.skill.more)}</p></div>`; }
  return h + `<div class="sh-btns">${back}</div>`;
}
// 창 안의 그림을 움직인다. 보지 못한 것은 검은 그림자로 한 번만 그린다
function shAnim(now) {
  document.querySelectorAll('#modal canvas.sh-cv').forEach(cv => {
    const d = cv.dataset; if (d.dark && d.done) return; const x = cv.getContext('2d'), W = cv.width, k = d.k; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, W); x.imageSmoothingEnabled = false;
    try {
      if (k === 'room') { const S = 64, c = LAIRART.room(d.id, S, 0, 1, d.dark ? 0 : now / 1000); x.drawImage(c, Math.floor((W - S) / 2), Math.floor((W - S) / 2)); }
      else { const h = k === 'form' ? LAIRART.boss(d.id) : LAIRART.unit(d.id, +d.star || 1); if (!h) return;
        const big = W >= 96, cyc = now % 4200, show = d.show && !d.dark, anim = !show || cyc < 2200 ? 'idle' : cyc < 2700 ? 'attack' : cyc < 3500 ? 'cast' : 'idle', t = d.dark ? 0 : anim === 'idle' ? now : anim === 'attack' ? cyc - 2200 : cyc - 2700;
        h.draw(x, W / 2, big ? 86 : 58, anim, t, { scale: big && h.size <= 72 ? 1.4 : 1 }); }
      if (d.dark) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#3d3a66'; x.fillRect(0, 0, W, W); x.globalCompositeOperation = 'source-over'; d.done = '1'; }
    } catch (e) { d.done = '1'; }
  });
}

// ---------- 도움말 ----------
const SHHELP = [['board', '판'], ['role', '역할'], ['syn', '시너지'], ['room', '방'], ['mad', '광기']];
function shHelp() {
  const page = SHHELP.some(p => p[0] === SH.page) ? SH.page : 'board'; let h = '';
  const li = a => `<ul class="sh-list">${a.map(t => `<li>${t}</li>`).join('')}</ul>`;
  if (page === 'board') { const n = LAIR.ROUNDS && LAIR.ROUNDS.length; h = li(['가게에서 권속을 사서 둥지의 아래 세 줄에 세운다.', '같은 권속 셋이 모이면 별이 하나 오른다.', '「넓히기」로 둥지 레벨을 올리면 세울 수 있는 수가 는다.', '「싸운다」를 누르면 침입자가 위에서 내려온다. 싸움은 저절로 흐른다.', '싸움에 지면 본체가 체력을 잃는다. 본체 체력이 0이 되면 판이 끝난다.'].concat(n ? ['싸움은 모두 ' + n + '번이다.'] : [])); }
  if (page === 'role') h = `<div class="sh-rows">${LAIR.ROLE_IDS.map(r => `<p>${shRole(r, 18)}<b>${esc(LAIR.ROLE[r].name)}</b><span>${esc(LROLE[r] || '')}</span></p>`).join('')}</div>` + li(['앞줄은 침입자와 가까운 위쪽 줄이다.', '권속의 테두리 색과 배지가 역할을 알린다.']);
  if (page === 'syn') h = li(['성향이나 종류가 같은 권속을 세우면 모인 수에 따라 힘이 붙는다.', '같은 권속 여럿은 하나로 센다.', '가장 많이 모은 성향을 따라 본체의 모습이 바뀐다.']) + `<div class="sh-rows two">${LAIR.SYN_IDS.map(id => `<p>${shSym(id, 16)}<b>${esc(LAIR.SYN[id].name)}</b><span>${LAIR.SYN[id].need.join(' · ')}</span></p>`).join('')}</div>`;
  if (page === 'room') h = li(['「방」을 눌러 하나를 고르고 둥지 칸에 깐다.', '방마다 차지하는 칸 수가 다르다.', '방의 힘은 그 위에 선 권속이나 그 위로 들어온 적에게 닿는다.']) + `<div class="sh-rows">${LAIR.ROOM_IDS.map(id => { const r = LAIR.roomInfo(id); return `<p><b>${esc(r.name)}</b><span>${esc(r.short)} · ${r.len}칸</span></p>`; }).join('')}</div>`;
  if (page === 'mad') h = li(['침입자는 체력과 함께 정신을 가진다. 보라 줄이 정신이다.', '정신 피해를 주는 권속과 방이 정신을 깎는다.', '정신이 0이 된 침입자는 미쳐서 둥지 편에서 싸운다.', '우두머리 가운데에는 미치지 않는 자가 있다.']);
  shOpen('help', shHead('도움말') + shTabs(SHHELP, page, 'hpage') + `<div class="sh-body">${h}</div><div class="sh-btns"><button class="btn sm" data-a="film">여는 이야기 보기</button></div>`);
}

// ---------- 설정 ----------
function shSet() {
  const v = META.vol || {}, tog = (k, name, on) => `<p class="sh-setrow"><span>${name}</span><button class="btn sm${on ? ' on' : ''}" data-a="tog" data-v="${k}" aria-pressed="${!!on}">${on ? '켬' : '끔'}</button></p>`;
  const rng = (k, name) => `<label class="sh-setrow"><span>${name}</span><input type="range" min="0" max="100" step="5" value="${Math.round((v[k] == null ? 1 : v[k]) * 100)}" data-vol="${k}" aria-label="${name} 크기"></label>`;
  shOpen('set', shHead('설정') + `<div class="sh-body">${tog('sound', '효과음', META.sound)}${tog('music', '음악', META.music !== false)}${rng('master', '전체 소리')}${rng('music', '음악 소리')}${rng('sfx', '효과음 소리')}${tog('shake', '흔들림과 번쩍임', META.shake !== false)}${CLOUD ? tog('trace', '그만둔 곳 남기기', META.trace !== false) : ''}</div>`
    + '<div class="sh-btns"><button class="btn sm" data-a="film">여는 이야기 보기</button><button class="btn sm warn" data-a="wipe">기록 지우기</button></div>');
}

// ---------- 지난 판 ----------
function shLast() {
  const rows = META.last.slice().reverse().map(r => { const d = new Date(+r.t || 0), team = Array.isArray(r.team) ? r.team.filter(q => Array.isArray(q) && LAIR.KIN[q[0]]).slice(0, 8) : [];
    return `<div class="sh-run"><p><b class="${r.win ? 'w' : 'l'}">${r.win ? '이김' : '짐'}</b><span>${+r.round || 0}/${+r.rounds || 0}</span><span>본체 ${+r.hp || 0}</span><span>Lv ${+r.level || 0}</span><small>${d.getMonth() + 1}.${d.getDate()}</small></p><div>${team.map(q => shKinIcon(q[0], Math.max(1, Math.min(3, +q[1] || 1)), 28)).join('')}</div></div>`; }).join('');
  shOpen('last', shHead('지난 판', `<span class="sh-sub">${META.runs}판 · ${META.wins}승</span>`) + `<div class="sh-body">${rows || '<p class="mute">아직 끝낸 판이 없다.</p>'}</div>`);
}

// ---------- 누름 ----------
function shClick(e) {
  if (e.target.id === 'modal') return shClose();
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a, v = b.dataset.v; shSay('click');
  if (a === 'close') return shClose();
  if (a === 'cont') { let run = null; try { run = lairSaved(); } catch (er) { run = null; } if (!run) return showTitle(); return shStart(run); }
  if (a === 'start') { let run = null; try { run = lairSaved(); } catch (er) { run = null; } if (run) return shAsk('하던 판은 사라진다.', '새로 시작', 'fresh'); return shStart(null); }
  if (a === 'fresh') { try { store.del('lairrun'); } catch (er) { /* 저장 없이 */ } return shStart(null); }
  if (a === 'codex') { SH.pick = null; return shCodex(); }
  if (a === 'ctab') { SH.tab = v; SH.pick = null; return shCodex(); }
  if (a === 'cpick') { SH.pick = v; SH.star = 1; return shCodex(); }
  if (a === 'cgo') { SH.tab = 'kin'; SH.pick = v; SH.star = 1; return shCodex(); }
  if (a === 'cstar') { SH.star = +v; return shCodex(); }
  if (a === 'cback') { SH.pick = null; return shCodex(); }
  if (a === 'help') return shHelp();
  if (a === 'hpage') { SH.page = v; return shHelp(); }
  if (a === 'set') return shSet();
  if (a === 'last') return shLast();
  if (a === 'film') return shFilm();
  if (a === 'tog') { META[v] = !(v === 'sound' ? META.sound : META[v] !== false); saveMeta(); if (v === 'music') { try { musicSet(META.music); } catch (er) { /* 음악 없이 */ } } return shSet(); }
  if (a === 'wipe') return shAsk('기록과 하던 판을 모두 지운다.', '지운다', 'wipeok');
  if (a === 'wipeok') { wipeSaves(); saveMeta(); shVol(); return showTitle(); }
}
function shInput(e) { const k = e.target.dataset && e.target.dataset.vol; if (!k) return; META.vol = META.vol || { master: 1, music: 1, sfx: 1 }; META.vol[k] = Math.max(0, Math.min(1, (+e.target.value || 0) / 100)); saveMeta(); shVol(); if (e.type === 'change' && k !== 'music') shSay('coin'); }

// ---------- 켜기 ----------
function shBoot() {
  const nj = $('nojs'); if (nj) nj.hidden = true;
  $('title').addEventListener('click', shClick); $('modal').addEventListener('click', shClick);
  $('modal').addEventListener('input', shInput); $('modal').addEventListener('change', shInput);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) shClose(); });
  shVol(); showTitle(); initCloud();
}
if (typeof window !== 'undefined') window.__shell = { get meta() { return META; }, get open() { return SH.open; }, title: () => showTitle(), start: run => shStart(run), saved: () => lairSaved(), codex: (tab, pick) => { SH.tab = tab || 'kin'; SH.pick = pick || null; shCodex(); }, help: page => { SH.page = page || 'board'; shHelp(); }, set: () => shSet(), last: () => shLast(), close: () => shClose(), sv: SAVE_V };
shBoot();
