// 둥지 전투 (시험) 화면: 상점에서 권속을 사서 둥지에 세우고, 방을 깔고, 저절로 싸우는 것을 본다. 세 번의 싸움.
// 규칙은 lair.js (LAIR), 그림과 움직임은 lairart.js (LAIRART). 이 파일은 그리기와 누르기, 싸움을 다시 보여 주는 일만 한다.
const LU = { dbg: { badges: 0, range: [], rows: [], dive: 0 }, R: null, phase: 'prep', sel: null, drag: null, roomPick: null, sheet: null, speed: 1, paused: false, F: null, res: null, raf: 0, last: 0, t: 0, wallH: 45, bg: null, tut: -1, tutT: 0, hitAt: 0, castAt: 0, seed: 0, warm: [], warmed: {}, pops: {}, toastT: 0 };
const LS = 64, LW = 384;
const LCOL = { abyss: '#3ac0d8', nebula: '#b08fff', brood: '#8fd05f', dusk: '#f0a04a', hunger: '#ff5f57' };
const LNAR = {
  win: '횃불이 하나씩 꺼졌다. 굴은 다시 젖은 숨소리로 돌아갔다.',
  lose: '발소리가 가장 깊은 방까지 내려왔다. 그것은 몸을 움츠렸다.',
  end: '책을 든 자는 등불을 떨어뜨리고 달아났다. 그가 본 것은 어느 장부에도 적히지 않았다.',
  fall: '등불이 둥지의 가장 안쪽을 비추었다. 읽힌 것은 더 이상 숨을 수 없었다.',
};
const LTUT = [
  { key: 'shop', text: '권속을 눌러 고르고, 다시 눌러 산다.', at: '#lr-shop .lr-card' },
  { key: 'place', text: '대기석의 권속을 누른 다음 둥지 칸을 눌러 세운다.', at: '#lr-bench .lr-slot.has' },
  { key: 'syn', text: '같은 성향이나 종류가 모이면 힘이 붙는다. 누르면 보인다.', at: '#lr-top .lr-syn', ok: 1 },
  { key: 'room', text: '방을 하나 골라 둥지 칸에 깐다. 그 위에 선 권속이 힘을 받는다.', at: '#lr-bench [data-l="room"]' },
  { key: 'fight', text: '「싸운다」를 누르면 저절로 싸운다. 마나가 차면 스킬을 쓴다.', at: '#lr-top [data-l="fight"]' },
];
const LBIG = { swallow: 1, feast: 1, firepillar: 1, wave: 1, slam: 1, dash: 1, readblast: 1, cloud: 1, skyeye: 1, chorus: 1, shieldwall: 1, sanctum: 1, mask: 1, beam: 1 };
const LFXDUR = { beam: 0.75, pierce: 0.5, whisper: 0.7, lash: 0.6, bites: 0.7, bigbite: 0.6, latch: 0.7, backstab: 0.6, snipe: 0.7, seal: 1.2, madburst: 0.8, shell: 2, eyes: 0.9, slam: 0.8, feast: 0.9, readblast: 0.9, light: 1, sanctum: 4, song: 1, shieldwall: 3, wave: 1.1, swallow: 1.1, mask: 0.9, cloud: 1.4, firepillar: 1, hatch: 0.7, rise: 0.8, chorus: 0.9, skyeye: 1, pull: 0.8, dash: 0.5, read: 1.2, echo: 0.7, eat: 0.6, on: 0.6, spark: 0.25, ichor: 0.5, heal: 0.7, bolt: 0.2, arrow: 0.24 };
// 빠르기: 느리게 / 보통 / 빠르게. 고른 것을 기억한다
const LSPD = [[0.6, '느리게'], [1, '보통'], [2, '빠르게']];
const lrSpeedLoad = () => { let v = 0; try { v = +(META && META.lairSpeed); } catch (e) { v = 0; } return LSPD.some(q => q[0] === v) ? v : 1; };
function lrSpeedSet(v) { LU.speed = v; try { if (META) { META.lairSpeed = v; saveMeta(); } } catch (e) { /* 저장 없이 */ } lrFightPanel(); }
// 쏘는 공격: 놓는 때(rel)와 날아가는 시간(fly). 붙어 치는 공격은 hit 에 닿는다
const LSHOT = { rel: 0.19, fly: 0.26, hit: 0.21 };
const LROLE = { tank: '앞줄에서 맞는다. 방어가 높아 피해를 많이 막는다.', melee: '앞줄에서 붙어 때린다.', ranged: '뒷줄에서 멀리 쏜다.', support: '뒷줄에서 아군을 돕는다.', dive: '싸움이 시작되면 곧 뒷줄로 뛰어든다.' };
const LSTC = { stun: '#ffe060', silenced: '#ff5f57', burn: '#ff9a3a', bleed: '#c8303a', infected: '#a8e04a', wet: '#5ab8f0', taunted: '#f0a04a', atkup: '#ffd040', atkdown: '#8a92a8', fed: '#ff8a8a' };

// ---- 작은 도구 ----
const lq = sel => document.querySelector(sel);
const lcx = c => (c % 6) * LS + LS / 2, lcy = c => LU.wallH + Math.floor(c / 6) * LS + LS / 2;
const lcen = cells => { let x = 0, y = 0; cells.forEach(c => { x += lcx(c); y += lcy(c); }); return { x: x / cells.length, y: y / cells.length }; };
const LURL = {};
function lrIcon(id, star, px) { const k = id + ':' + (star || 1) + ':' + px; if (!LURL[k]) { try { LURL[k] = LAIRART.icon(id, star || 1, px).toDataURL(); } catch (e) { LURL[k] = ''; } } return LURL[k]; }
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
<div id="lr-side"><div id="lr-bench"></div><div id="lr-shop"></div><div id="lr-fight" hidden></div></div></div>
<div id="lr-sheet" hidden></div><div id="lr-coach" hidden></div><div id="lr-toast" hidden></div><img id="lr-drag" alt="" hidden>`;
  document.body.appendChild(el);
  el.addEventListener('click', lrClick);
  el.addEventListener('pointerdown', lrDown); el.addEventListener('pointermove', lrMove); el.addEventListener('pointerup', lrUp); el.addEventListener('pointercancel', () => { LU.drag = null; $('lr-drag').hidden = true; });
  window.addEventListener('resize', () => { if (!el.hidden) lrSize(); });
  window.addEventListener('keydown', e => { if (el.hidden) return; if (e.key === 'Escape') { if (LU.sheet) lrSheetClose(); else if (LU.roomPick != null) { LU.roomPick = null; lrDraw(); } else if (LU.sel) { LU.sel = null; lrDraw(); } } if (LU.phase === 'fight' && (e.key === ' ' || e.key === 'p')) { LU.paused = !LU.paused; lrFightPanel(); e.preventDefault(); } if (LU.phase === 'fight' && e.key.length === 1 && '123'.includes(e.key)) lrSpeedSet(LSPD[+e.key - 1][0]); });
}
function lrSize() {
  const cv = $('lr-cv'), wrap = $('lr-boardwrap'), vw = window.innerWidth, vh = window.innerHeight, wide = vw >= 900, H = LU.wallH + LS * 6;
  $('lr').classList.toggle('wide', wide);
  if (cv.height !== H) cv.height = H;
  const barH = $('lr-bar').offsetHeight || 44, sideH = wide ? 0 : ($('lr-side').offsetHeight || 170);
  const availH = vh - barH - sideH - (wide ? 20 : 6), availW = wide ? vw - 470 : vw;
  let sc = Math.min(availW / LW, availH / H); if (wide) sc = Math.min(sc, 1.75); sc = Math.max(0.6, sc);
  LU.scale = sc; cv.style.width = Math.floor(LW * sc) + 'px'; cv.style.height = Math.floor(H * sc) + 'px'; wrap.style.width = Math.floor(LW * sc) + 'px'; wrap.style.height = Math.floor(H * sc) + 'px';
}
function lairOpen() {
  lrMount(); const t = $('title'); if (t) t.hidden = true; $('lr').hidden = false;
  try { LU.wallH = LAIRART.wallTop(LS, 6, 0).height; } catch (e) { LU.wallH = 45; }
  lrNew(); if (!LU.raf) { LU.last = performance.now(); LU.raf = requestAnimationFrame(lrLoop); }
}
function lrNew(seed) {
  LU.seed = seed || ((Date.now() % 1000000) + 1); LU.R = LAIR.newRun(LU.seed); LU.phase = 'prep'; LU.sel = null; LU.roomPick = null; LU.F = null; LU.res = null; LU.sheet = null; LU.speed = lrSpeedLoad(); LU.paused = false; LU.bg = null;
  const coachOk = !(navigator.webdriver && !window.__lairCoach); LU.tut = coachOk && !(META && META.lairTut) ? 0 : -1;
  $('lr-sheet').hidden = true; $('lr-ov').innerHTML = ''; lrDraw(); lrSize(); lrWarmPrep();
  try { if (typeof music === 'function') music('day'); } catch (e) { /* 음악 없이 */ }
}
function lrExit() { $('lr').hidden = true; cancelAnimationFrame(LU.raf); LU.raf = 0; LU.F = null; if (typeof showTitle === 'function') showTitle(); }

// ---- 준비 화면 (DOM) ----
function lrDraw() {
  const v = lrView(), R = LU.R, fight = LU.phase === 'fight';
  const bv = fight && LU.F ? LU.F.bar : { round: Math.min(v.round, v.rounds), name: v.roundName, gold: v.gold, level: v.level, placed: v.placed, cap: v.cap, hp: v.hp };
  $('lr-bar').innerHTML = `<b class="lr-round">${bv.round}/${v.rounds}</b><span class="lr-rn">${esc(bv.name)}</span>
<span class="lr-stat lr-gold"><i></i>${bv.gold}</span><span class="lr-stat">Lv ${bv.level} · ${bv.placed}/${bv.cap}</span><span class="lr-stat lr-hp"><i></i>${bv.hp}</span><button data-l="exit" aria-label="나가기">✕</button>`;
  $('lr-bench').hidden = fight; $('lr-shop').hidden = fight; $('lr-fight').hidden = !fight;
  if (fight) { lrFightPanel(); lrTop(v); lrCoach(); return; }
  const selU = LU.sel && LU.sel.uid;
  $('lr-bench').innerHTML = v.bench.map((u, i) => u ? `<div class="lr-slot has${selU === u.uid ? ' on' : ''}${LU.pops[u.uid] > LU.t ? ' pop' : ''}" data-bench="${i}" data-u="${u.uid}" role="button" aria-label="${esc(u.name)} ${u.star}성 ${esc(u.roleName)}"><img src="${lrIcon(u.kind, u.star, 44)}" alt="">${lrStars(u.star)}${lrRoleImg(u.role, 18)}</div>` : `<div class="lr-slot" data-bench="${i}"></div>`).join('')
    + `<button class="lr-roombtn${v.roomOffer.length ? ' pri' : ''}" data-l="room"${v.roomOffer.length ? '' : ' disabled'}>${LU.roomPick != null ? '취소' : '방'}</button>`;
  $('lr-shop').innerHTML = `<div class="lr-acts"><button data-l="reroll"${v.canReroll ? '' : ' disabled'}>뽑기 ${v.costs.reroll}</button><button data-l="xp"${v.canXp ? '' : ' disabled'}>넓히기 ${v.costs.xp}<i class="lr-xp"><b style="width:${v.xpNeed ? Math.round(v.xp / v.xpNeed * 100) : 100}%"></b></i></button></div>`
    + v.shop.map((s, i) => s ? `<button class="lr-card c${s.cost}${LU.sel && LU.sel.shop === i ? ' on' : ''}${s.can ? '' : ' poor'}" data-l="shop" data-i="${i}"><img src="${lrIcon(s.kind, 1, 44)}" alt="">${lrRoleImg(s.role, 18)}<b>${esc(s.name)}</b><span class="lr-cmeta"><img src="${lrSym(s.asp, 16)}" alt="${esc(s.aspName)}"><img src="${lrSym(s.cls, 16)}" alt="${esc(s.clsName)}"><em>${s.cost}</em></span><small class="lr-reach">${esc(s.reach)}</small></button>` : '<div class="lr-card empty"></div>').join('');
  lrTop(v); lrCoach(); lrRowTip();
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
  top.innerHTML = `<div class="lr-syns">${lrSynChips(v) || '<span class="lr-hint">권속을 세운다</span>'}</div><button class="pri" data-l="fight"${v.placed ? '' : ' disabled'}>싸운다</button>`;
}
function lrSynChips(v, only) { const all = v.synergies.filter(s => !only || only[s.id]), max = only ? 6 : 4, show = all.length > max ? all.slice(0, max - 1) : all; return show.map(s => `<button class="lr-syn t${s.tier}" data-l="syn" data-id="${s.id}"><img src="${lrSym(s.id, 16)}" alt="${esc(s.name)}">${s.n}/${s.next || s.need[1]}</button>`).join('') + (all.length > show.length ? `<button class="lr-syn" data-l="syns">+${all.length - show.length}</button>` : ''); }
function lrFightPanel() {
  const F = LU.F; if (!F) return;
  $('lr-fight').innerHTML = `<div class="lr-speed">${LSPD.map(q => `<button data-l="speed" data-v="${q[0]}" class="${LU.speed === q[0] ? 'on' : ''}" aria-pressed="${LU.speed === q[0]}">${q[1]}</button>`).join('')}<button data-l="pause" class="${LU.paused ? 'on' : ''}">${LU.paused ? '이어서' : '멈춤'}</button></div>${F.chips ? `<div class="lr-syns">${F.chips}</div>` : ''}<div id="lr-feed">${lrFeedHtml()}</div>`;
}
function lrFeedHtml() { const F = LU.F; return F ? F.feed.slice(F.chips ? -2 : -3).map(f => `<p class="${f.side}"><img src="${lrIcon(f.icon, f.star, 28)}" alt=""><b>${esc(f.name)}</b><span>${esc(f.sk)}</span></p>`).join('') : ''; }
function lrToast(msg) { const t = $('lr-toast'), r = $('lr-boardwrap').getBoundingClientRect(); t.textContent = msg; t.hidden = false; t.style.left = (r.left + r.width / 2) + 'px'; t.style.top = (r.top + (LU.phase === 'fight' ? 50 : LU.wallH + LS * 3 - 18) * (LU.scale || 1)) + 'px'; LU.toastT = LU.t + 1600; }

// ---- 길잡이 ----
function lrCoach() {
  const c = $('lr-coach'); if (LU.tut < 0 || LU.tut >= LTUT.length || LU.sheet) { c.hidden = true; return; }
  const v = lrView(), R = LU.R;
  if (LU.phase === 'prep') {
    if (LU.tut === 0 && Object.keys(R.unit).length) LU.tut = 1;
    if (LU.tut === 1 && v.placed) LU.tut = 2;
    if (LU.tut === 2 && !v.synergies.length) LU.tut = 3;
    if (LU.tut === 3 && !v.roomOffer.length) LU.tut = 4;
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
  if (e.target.id === 'lr-cv' && LU.phase === 'fight' && LU.F && !LU.sheet) { const r = e.target.getBoundingClientRect(), px = (e.clientX - r.left) / LU.scale, py = (e.clientY - r.top) / LU.scale; let best = null, bd = 34; for (const id in LU.F.ents) { const q = LU.F.ents[id]; if (q.dead || q.summon) continue; const d = Math.hypot(q.x - px, q.y - 8 - py) * (q.core ? 0.6 : 1); if (d < bd) { bd = d; best = q; } } if (best) lrSheet(best.core ? { kind: 'core', form: best.form } : best.side === 'inv' ? { kind: 'inv', id: best.kind, round: LU.F.round } : { kind: 'unit', id: best.kind, star: best.star }); return; }
  const b = e.target.closest('[data-l]'); if (!b || b.disabled) return; const a = b.dataset.l, R = LU.R;
  if (a === 'exit') return lrExit();
  if (a === 'tutoff') { LU.tut = -1; if (META) { META.lairTut = 1; try { saveMeta(); } catch (er) { /* 저장 없이 */ } } $('lr-coach').hidden = true; document.querySelectorAll('#lr .lr-glow').forEach(x => x.classList.remove('lr-glow')); return; }
  if (a === 'tutok') { LU.tut++; return lrCoach(); }
  if (a === 'close') return lrSheetClose();
  if (a === 'speed') return lrSpeedSet(+b.dataset.v);
  if (a === 'pause') { LU.paused = !LU.paused; return lrFightPanel(); }
  if (a === 'next') return lrNext();
  if (a === 'again') { lrSheetClose(); return lrNew(); }
  if (a === 'syn') return lrSheet({ kind: 'syn', id: b.dataset.id });
  if (a === 'syns') return lrSheet({ kind: 'syns' });
  if (a === 'info') return lrSheet({ kind: 'unit', id: b.dataset.kind, star: +b.dataset.star || 1 });
  if (a === 'roominfo') return lrSheet({ kind: 'room', id: b.dataset.id });
  if (LU.phase !== 'prep') return;
  if (a === 'shop') { const i = +b.dataset.i; if (LU.sel && LU.sel.shop === i) return lrBuy(i); LU.sel = { shop: i }; lrSay('click'); return lrDraw(); }
  if (a === 'buy') return lrBuy(+b.dataset.i);
  if (a === 'sell') { const r = LAIR.sell(R, +b.dataset.u); if (r.ok) { lrSay('coin'); LU.sel = null; } else lrToast(r.msg); return lrDraw(); }
  if (a === 'reroll') { const r = LAIR.reroll(R); if (r.ok) { lrSay('slide'); if (LU.sel && LU.sel.shop != null) LU.sel = null; lrWarmPrep(); } else lrToast(r.msg); return lrDraw(); }
  if (a === 'xp') { const r = LAIR.buyXp(R); if (r.ok) { lrSay(r.up ? 'up' : 'click'); if (r.up) lrToast('둥지 Lv ' + R.level); } else lrToast(r.msg); return lrDraw(); }
  if (a === 'room') { if (LU.roomPick != null) { LU.roomPick = null; return lrDraw(); } return lrSheet({ kind: 'rooms' }); }
  if (a === 'pickroom') { LU.roomPick = +b.dataset.i; LU.sel = null; lrSheetClose(); return lrDraw(); }
  if (a === 'fight') return lrFight();
}
function lrBuy(i) {
  const R = LU.R, r = LAIR.buy(R, i); if (!r.ok) { lrToast(r.msg); return lrDraw(); }
  lrSay('coin'); LU.sel = null; (r.merged || []).forEach(m => lrMergePop(m)); lrWarmPrep(); lrDraw();
}
function lrMergePop(m) { LU.pops[m.uid] = LU.t + 900; lrSay('combo'); const w = LAIR.whereOf(LU.R, m.uid); if (w && w.cell != null) LU.cellPop = { cell: w.cell, t0: LU.t }; lrToast(LAIR.KIN[m.kind].name + ' ' + '★'.repeat(m.star)); }
// 판의 칸을 찾는다 (화면 좌표 → 칸)
function lrCellAt(cx, cy) { const cv = $('lr-cv'), r = cv.getBoundingClientRect(), x = (cx - r.left) / LU.scale, y = (cy - r.top) / LU.scale - LU.wallH; if (x < 0 || y < 0 || x >= LW || y >= LS * 6) return -1; return Math.floor(y / LS) * 6 + Math.floor(x / LS); }
function lrUnitAtCell(c) { const R = LU.R; if (R.board[c]) return { uid: R.board[c] }; if (LAIR.CORE.includes(c)) return { core: true }; const e = R.enemy.find(q => q.cell === c); return e ? { enemy: e } : null; }
function lrDown(e) {
  if (LU.phase !== 'prep' || LU.sheet) return; const slot = e.target.closest('.lr-slot'), onCv = e.target.id === 'lr-cv';
  if (!slot && !onCv) return;
  let uid = null, cell = -1;
  if (slot) uid = slot.dataset.u ? +slot.dataset.u : null; else { cell = lrCellAt(e.clientX, e.clientY); const u = cell >= 0 ? lrUnitAtCell(cell) : null; uid = u && u.uid ? u.uid : null; }
  LU.drag = { uid, cell, bench: slot ? +slot.dataset.bench : null, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
  if (uid) e.preventDefault();
}
function lrMove(e) {
  const d = LU.drag; if (!d || !d.uid) return; if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 10) return;
  if (!d.moved) { d.moved = true; LU.sel = { uid: d.uid }; const u = LU.R.unit[d.uid], g = $('lr-drag'); g.src = lrIcon(u.kind, u.star, 44); g.hidden = false; lrDraw(); }
  const g = $('lr-drag'); g.style.left = (e.clientX - 28) + 'px'; g.style.top = (e.clientY - 44) + 'px'; LU.hover = lrCellAt(e.clientX, e.clientY);
}
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
  if (u && u.enemy) return lrSheet({ kind: 'inv', id: u.enemy.kind });
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
function lrSheet(s) {
  LU.sheet = s; const el = $('lr-sheet'), v = lrView(); let h = '';
  const stat = (k, n) => `<span class="lr-st"><small>${k}</small><b>${n}</b></span>`;
  if (s.kind === 'unit') { const u = LAIR.unitInfo(s.id, s.star); h = `<div class="lr-shead"><canvas id="lr-prev" width="96" height="96"></canvas><div><h3>${esc(u.name)} ${lrStars(u.star)}</h3><p class="lr-tags">${lrRoleImg(u.role, 18)}<b class="lr-rolename">${esc(u.roleName)}</b> · ${esc(u.reach)}</p><p class="lr-tags"><img src="${lrSym(u.asp, 16)}" alt="">${esc(u.aspName)} <img src="${lrSym(u.cls, 16)}" alt="">${esc(u.clsName)}</p></div></div><div class="lr-stats">${stat('체력', u.hp)}${stat('공격', u.atk)}${stat('방어', u.df)}${stat('닿는 칸', u.range)}${stat('마나', u.mana)}${u.sanAtk ? stat('정신 피해', u.sanAtk) : ''}</div><div class="lr-skill"><b>${esc(u.skill.name)}</b><span>${esc(u.skill.short)}</span><p>${esc(u.skill.more)}</p></div><p class="lr-note">${esc(LROLE[u.role] || '')}</p>`; }
  if (s.kind === 'inv') { const u = LAIR.invInfo(s.id, s.round || LU.R.round); h = `<div class="lr-shead"><canvas id="lr-prev" width="96" height="96"></canvas><div><h3>${esc(u.name)}</h3><p class="lr-tags">${lrRoleImg(u.role, 18)}<b class="lr-rolename">${esc(u.roleName)}</b> · ${esc(u.reach)}${u.elite ? ' · 정예' : ''}${u.boss ? ' · 우두머리' : ''}</p></div></div><div class="lr-stats">${stat('체력', u.hp)}${stat('정신', u.noMad ? '—' : u.san)}${stat('공격', u.atk)}${stat('방어', u.df)}${stat('닿는 칸', u.range)}</div><div class="lr-skill"><b>${esc(u.skill.name)}</b><span>${esc(u.skill.short)}</span><p>${esc(u.skill.more)}</p></div><p class="lr-note">${esc(LROLE[u.role] || '')}</p>`; }
  if (s.kind === 'core') { const f = s.form ? LAIR.formInfo(s.form, LU.F ? LU.F.round : LU.R.round) : v.form; h = `<div class="lr-shead"><canvas id="lr-prev" width="96" height="96"></canvas><div><h3>${esc(f.name)}</h3><p class="lr-tags">본체 · 체력 ${v.hp}</p></div></div><div class="lr-skill"><b>${esc(f.skill.name)}</b><span>${esc(f.skill.short)}</span><p>${esc(f.skill.more)}</p></div><p class="lr-note">가장 많이 모은 성향을 따라 모습이 바뀐다.</p>`; }
  if (s.kind === 'syn') { const info = v.synergies.find(q => q.id === s.id) || LAIR.synInfo(s.id, 0), mem = LAIR.KIN_IDS.filter(k => LAIR.KIN[k].asp === s.id || LAIR.KIN[k].cls === s.id), have = new Set(v.board.map(b => b.kind));
    h = `<div class="lr-shead"><img class="lr-big" src="${lrSym(s.id, 32)}" alt=""><div><h3>${esc(info.name)}</h3><p class="lr-tags">${info.n} 모임</p></div></div><div class="lr-tiers">${info.need.map((n, i) => `<p class="${info.tier > i ? 'on' : ''}"><b>${n}</b>${esc(info.shorts[i])}</p>`).join('')}</div><p class="lr-note">${esc(info.more)}</p><div class="lr-mem">${mem.map(k => `<button data-l="info" data-kind="${k}" data-star="1" class="${have.has(k) ? 'on' : ''}"><img src="${lrIcon(k, 1, 36)}" alt="${esc(LAIR.KIN[k].name)}"></button>`).join('')}</div>`; }
  if (s.kind === 'room') { const r = LAIR.roomInfo(s.id); h = `<div class="lr-shead"><img class="lr-big" src="${lrRoomIcon(s.id)}" alt=""><div><h3>${esc(r.name)}</h3><p class="lr-tags">${r.len}칸</p></div></div><div class="lr-skill"><span>${esc(r.short)}</span><p>${esc(r.more)}</p></div>`; }
  if (s.kind === 'rooms') h = `<h3>방 하나</h3><div class="lr-rooms">${v.roomOffer.map(r => `<button data-l="pickroom" data-i="${r.i}"><img src="${lrRoomIcon(r.id)}" alt=""><b>${esc(r.name)}</b><span>${esc(r.short)}</span><small>${r.len}칸</small></button>`).join('')}</div>`;
  if (s.kind === 'syns') h = `<h3>모인 것</h3><div class="lr-rooms">${v.synergies.map(q => `<button data-l="syn" data-id="${q.id}"><img src="${lrSym(q.id, 32)}" alt=""><b>${esc(q.name)}</b><span>${esc(q.short)}</span><small>${q.n}/${q.next || q.need[1]}</small></button>`).join('')}</div>`;
  if (s.kind === 'result') h = lrResultHtml();
  el.innerHTML = `<div class="lr-sbody${s.kind === 'result' ? ' res' : ''}">${s.kind === 'result' ? '' : '<button class="lr-x" data-l="close" aria-label="닫기">✕</button>'}${h}</div>`; el.hidden = false; $('lr-coach').hidden = true;
}
function lrSheetClose() { LU.sheet = null; $('lr-sheet').hidden = true; lrCoach(); }
function lrSheetAnim(now) {
  const s = LU.sheet, cv = $('lr-prev'); if (!s || !cv) return; const x = cv.getContext('2d'); x.clearRect(0, 0, 96, 96);
  const h = s.kind === 'core' ? LAIRART.boss(s.form || LAIR.formOf(Object.keys(LU.R.board).map(c => LU.R.unit[LU.R.board[c]].kind))) : LAIRART.unit(s.id, s.star || 1); if (!h) return;
  const cyc = now % 4200, anim = cyc < 2200 ? 'idle' : cyc < 2700 ? 'attack' : cyc < 3500 ? 'cast' : 'idle', t = anim === 'idle' ? now : anim === 'attack' ? cyc - 2200 : cyc - 2700;
  h.draw(x, 48, 86, anim, t, { scale: h.size > 72 ? 1 : 1.4 });
}

// ---- 싸움 ----
function lrWarmPrep() { const R = LU.R; if (!R) return; const add = (id, star) => { const k = id + ':' + star; if (!LU.warmed[k]) { LU.warmed[k] = 1; ['idle', 'attack', 'cast', 'move', 'hit', 'die'].forEach(an => LU.warm.push([id, star, an])); } }; Object.keys(R.unit).forEach(id => add(R.unit[id].kind, R.unit[id].star)); R.enemy.forEach(e => add(e.kind, 1)); R.shop.forEach(k => { if (k) add(k, 1); }); }
function lrWarmStep(budget) { const t0 = performance.now(); while (LU.warm.length && performance.now() - t0 < budget) { const [id, star, an] = LU.warm.shift(); try { LAIRART.prewarm([id], star, [an]); } catch (e) { /* 그림이 없으면 건너뛴다 */ } } }
function lrFight() {
  const R = LU.R, v0 = lrView(), name = v0.roundName, round = R.round, bar = { round, name, gold: v0.gold, level: v0.level, placed: v0.placed, cap: v0.cap, hp: v0.hp }; LU.sel = null; LU.roomPick = null;
  const res = LAIR.ready(R); if (!res.ok) return lrToast(res.msg);
  const f = res.fight, F = { tl: f.timeline, i: 0, T: 0, ents: {}, fx: [], zones: [], nums: [], lines: [], late: [], feed: [], stop: 0, shake: 0, shakeMag: 0, intro: 1500, slowUntil: 0, slowK: 1, slows: 0, slowSeen: {}, blocks: 0, shots: 0, taunts: 0, real: 0, done: false, endAt: 0, res, name, round, bar, labs: [], rooms: f.rooms.map(r => ({ id: r.id, cells: r.cells, erased: false, pulse: 0 })), syn: f.syn, form: f.form, banner: null, consumed: 0, mads: 0, casts: 0 };
  f.units.forEach(u => { F.ents[u.id] = lrEnt(u); }); F.chips = lrSynChips(v0, f.syn);
  { const w = f.timeline.find(e => e.type === 'win'); let last = null; f.timeline.forEach(e => { if (e.type === 'die') last = e; }); if (w && last && w.t - last.t < 1) last.last = 1; }
  LU.F = F; LU.res = res; LU.phase = 'fight'; LU.speed = LU.speed || 1; LU.paused = false; $('lr-ov').innerHTML = '';
  Object.keys(F.ents).forEach(id => { const e = F.ents[id]; if (!e.core) ['mad'].forEach(an => { if (e.side === 'inv') LU.warm.push([e.kind, 1, an]); }); });
  { const ids = Object.keys(f.syn || {}), d = document.createElement('div'); d.className = 'lr-intro'; d.innerHTML = `<b>${esc(name)}</b>` + (ids.length ? `<span>${ids.map(id => `<i><img src="${lrSym(id, 16)}" alt="">${esc(LAIR.SYN[id].name)} ${f.syn[id] >= 2 ? LAIR.SYN[id].need[1] : LAIR.SYN[id].need[0]}</i>`).join('')}</span>` : ''); $('lr-ov').appendChild(d); setTimeout(() => d.remove(), 1500); }
  lrSay('night'); try { if (typeof music === 'function') music(round >= 3 ? 'boss' : 'night'); } catch (e) { /* 음악 없이 */ }
  const first = LU.tut >= 0 && LU.tut < LTUT.length; lrDraw(); lrSize(); if (first) { lrToast('위 줄은 체력, 파란 줄은 마나, 보라 줄은 정신이다.'); LU.toastT = LU.t + 5200; }
}
function lrEnt(u) {
  const p = lcen(u.cells && u.cells.length ? u.cells : [u.cell]);
  return { id: u.id, side: u.side, kind: u.kind, star: u.star || 1, core: !!u.core, form: u.form, boss: !!u.boss, elite: !!u.elite, name: u.name, asp: u.asp, cls: u.cls, x: p.x, y: p.y, fx: p.x, fy: p.y, tx: p.x, ty: p.y, mv0: 0, mvDur: 0, mvAnim: '', anim: 'idle', a0: 0, hp: u.mhp, mhp: u.mhp, san: u.msan || 0, msan: u.msan || 0, mana: u.mana || 0, mmana: u.mmana || 100, mad: false, dead: false, dieT: -1, st: {}, flash: 0, rx: 0, ry: 0, face: u.side === 'inv' ? 1 : 0, lunge: null, pop: 0, off: Math.random() * 1200, ranged: 0, dot: 0, dotT: 0, shield: 0, swallow: false, role: u.role || (u.core ? 'core' : 'melee'), range: u.range || 1, summon: !!u.summon };
}
function lrHandle(e) { if (e.core) return LAIRART.boss(e.form || 'drop'); if (e.kind === 'seeker') { const k = e.msan ? e.san / e.msan : 1; return LAIRART.unit('seeker', k > 0.66 ? 1 : k > 0.33 ? 2 : 3); } return LAIRART.unit(e.kind, e.star) || LAIRART.unit('spawn', 1); }
function lrSetAnim(e, anim, T) { e.anim = anim; e.a0 = T; }
function lrLabel(x, y, text, cls, ms) {
  const F = LU.F, sc = LU.scale, hw = (text.length * 12.5 + 16) / 2 / sc; ms = ms || 1100; x = Math.max(hw + 2, Math.min(LW - hw - 2, x)); y = Math.max(LU.wallH + 4, y);
  if (F) { F.labs = F.labs.filter(l => l.until > LU.t); for (let k = 0; k < 4; k++) { if (F.labs.some(l => Math.abs(l.x - x) < hw + l.hw && Math.abs(l.y - y) < 19 / sc)) y -= 20 / sc; else break; } y = Math.max(22 / sc, y); F.labs.push({ x, y, hw, until: LU.t + ms }); }
  const d = document.createElement('span'); d.className = 'lr-lab ' + (cls || ''); d.textContent = text; d.style.left = (x * sc) + 'px'; d.style.top = (y * sc) + 'px'; d.style.animationDuration = ms + 'ms'; $('lr-ov').appendChild(d); setTimeout(() => d.remove(), ms);
}
function lrNum(F, x, y, text, kind, id) {
  if (id && typeof text === 'number' && text > 0) { const q = F.nums.find(n => n.id === id && n.kind === kind && LU.t - n.t0 < 420); if (q) { q.val += text; q.text = Math.round(q.val); q.t0 = Math.max(q.t0, LU.t - 110); return; } }
  if (F.nums.length > 18) F.nums.shift(); F.nums.push({ x, y, text: typeof text === 'number' ? Math.round(text) : text, val: typeof text === 'number' ? text : 0, kind, id, t0: LU.t });
}
function lrAddFx(F, name, a, b, o, dur, under, delay) { F.fx.push({ name, a, b: b || a, t0: F.T + (delay || 0), dur: dur || LFXDUR[name] || 0.6, o: o || {}, under: !!under }); if (F.fx.length > 40) F.fx.shift(); }
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
      const by = E[ev.by];
      if (ev.k === 'dot' || ev.k === 'true') { u.dot += ev.dmg; if (T - u.dotT > 1 && u.dot > 0) { lrNum(F, u.x, u.y - 30, Math.round(u.dot), 'block'); u.dot = 0; u.dotT = T; } return; }
      u.flash = LU.t + 100; if (!(u.lag > u.hp / u.mhp + 0.001)) u.lagHold = T + 0.2; if (by) { const dx = u.x - by.x, dy = u.y - by.y, d = Math.hypot(dx, dy) || 1; u.rx = dx / d * 5; u.ry = dy / d * 5; }
      if (!u.dead && (u.anim === 'idle' || u.anim === 'move' || u.anim === 'mad') && u.mvDur === 0) lrSetAnim(u, 'hit', T);
      if (ev.dmg > 0) lrNum(F, u.x, u.y - 34, ev.dmg, ev.crit || (ev.k === 'skill' && ev.dmg >= u.mhp * 0.15) ? 'crit' : 'dmg', u.id);
      if (ev.san > 0 && u.msan && !u.mad) lrNum(F, u.x + 16, u.y - 20, ev.san, 'san', u.id);
      if (ev.k === 'atk') lrAddFx(F, 'spark', { x: u.x, y: u.y - 12 }, null, { col: by && by.side === 'nest' ? '#c0fff0' : '#ffd0a0', seed: (ev.t * 7) % 1 }, 0.22);
      if (ev.blk > 0 && by) { F.blocks++; if (!(u.blkT > T - 0.45)) { u.blkT = T; lrAddFx(F, 'block', { x: by.x, y: by.y - 12 }, { x: u.x, y: u.y - 14 }, null, 0.36); } lrNum(F, u.x - 18, u.y - 14, ev.blk, 'guard', u.id); }
      if (LU.t - LU.hitAt > 70 / LU.speed) { LU.hitAt = LU.t; lrSay('hit'); }
      return;
    }
    case 'cast': {
      if (!u) return; const tg = E[ev.tg]; if (tg) lrFace(u, tg.x); lrSetAnim(u, 'cast', T); u.mana = 0; F.casts++; u.castT = T; u.castDur = Math.max(0.3, ev.dur || 0.42);
      if (!ev.again && !F.slowSeen[u.id] && (u.core || u.boss || (u.side === 'nest' && LAIR.KIN[u.kind] && LAIR.KIN[u.kind].cost >= 3))) { F.slowSeen[u.id] = 1; lrSlow(F, 700, 0.4); }
      const sk = LAIR.SK[ev.sk]; if (sk && !ev.again) { lrLabel(u.x, u.y - (u.core ? 92 : 64), sk.name, 'sk ' + (u.side === 'nest' && !u.madSide ? 'nest' : 'inv'), Math.max(1000, 1250 / Math.sqrt(LU.speed))); F.feed.push({ icon: u.core ? (u.form || 'drop') : u.kind, star: u.core ? 1 : u.star, name: u.name, sk: sk.name, side: u.side }); if (F.feed.length > 6) F.feed.shift(); const fd = $('lr-feed'); if (fd) fd.innerHTML = lrFeedHtml(); }
      if (tg) F.lines.push({ a: ev.u, b: ev.tg, until: T + (ev.dur || 0.35) + 0.25, side: u.side });
      if (LU.t - LU.castAt > 160) { LU.castAt = LU.t; lrSay('spell'); }
      return;
    }
    case 'skillfx': return lrSkillFx(F, ev);
    case 'status': {
      if (!u) return; if (ev.on) { u.st[ev.st] = { until: T + (ev.dur || 1), v: ev.v }; if (ev.st === 'shield') u.shield = 1; if (ev.st === 'stun') lrNum(F, u.x, u.y - 40, 0, 'block'); } else { delete u.st[ev.st]; if (ev.st === 'shield') u.shield = 0; }
      if (ev.on && ev.st === 'taunted' && ev.by && E[ev.by] && !E[ev.by].dead) { const by = E[ev.by]; F.taunts++; F.lines.push({ a: ev.u, b: ev.by, until: T + 1, t0: T, side: by.side, aggro: 1 }); if (!(by.tauntT > T - 0.4)) { by.tauntT = T; lrAddFx(F, 'on', { x: by.x, y: by.y - 8 }, null, { col: '#f0a04a' }, 0.6); } }
      return;
    }
    case 'mad': {
      if (!u) return; u.mad = true; u.san = 0; F.mads++; lrSetAnim(u, 'mad', T); lrAddFx(F, 'madburst', { x: u.x, y: u.y - 8 }, null, { r: 1.2 }, 0.8); lrLabel(u.x, u.y - 62, '미쳤다', 'mad', 1300); lrNum(F, u.x, u.y - 30, 0, 'mad'); lrStop(F, 150, 3); lrSay('mad'); if (F.mads === 1) lrSlow(F, 800, 0.35);
      return;
    }
    case 'cleanse': { if (!u) return; u.mad = false; if (ev.sn != null) u.san = ev.sn; lrAddFx(F, 'heal', { x: u.x, y: u.y - 8 }, null, { col: '#fff3a0' }); lrLabel(u.x, u.y - 62, '깨어났다', 'inv', 1000); return; }
    case 'die': {
      if (!ev._late) { let at = 0; F.late.forEach(l => { if (l.ev.u === ev.u && l.ev.type === 'hit') at = Math.max(at, l.at); }); if (at > T) { F.late.push({ at: at + 0.01, ev: Object.assign({ _late: 1 }, ev) }); return; } }
      if (!u) return; if (ev.last) lrSlow(F, 900, 0.3); u.dead = true; u.dieT = T; u.hp = 0; u.swallow = ev.how === 'swallow'; lrSetAnim(u, 'die', T);
      if (u.side === 'nest' && !u.swallow) lrAddFx(F, 'ichor', { x: u.x, y: u.y - 6 }, null, { seed: u.x % 7 }); if (u.boss || u.elite) lrStop(F, 180, 4); lrSay('die');
      return;
    }
    case 'spawn': {
      const p = C(ev.cell); F.ents[ev.u] = lrEnt({ id: ev.u, side: ev.side, kind: ev.kind, star: 1, cell: ev.cell, cells: [ev.cell], name: ev.name, mhp: ev.mhp, msan: 0, mmana: 0, mana: 0, role: ev.role, range: ev.range }); F.ents[ev.u].pop = T; F.ents[ev.u].summon = true; lrAddFx(F, ev.kind === 'infected' ? 'rise' : 'on', p, null, { col: '#c8e870' }, 0.5);
      return;
    }
    case 'roomfx': {
      const rm = F.rooms.find(r => r.id === ev.room && (ev.i == null || true)); if (rm) rm.pulse = LU.t + 420;
      if (ev.kind === 'gold' && ev.cell != null) lrNum(F, lcx(ev.cell), lcy(ev.cell) - 20, '+' + (ev.amt || 1), 'gold');
      if (ev.kind === 'erase') { const r2 = F.rooms.find(r => r.id === ev.room && !r.erased) || rm; if (r2) { r2.erased = true; const p = lcen(r2.cells); lrLabel(p.x, p.y - 18, '읽혔다', 'inv', 1500); lrAddFx(F, 'readblast', p, null, { r: 1 }, 0.8); lrStop(F, 160, 3); } }
      if (ev.kind === 'end') F.zones = F.zones.filter(z => !(ev.cells && z.cells.join() === ev.cells.join()));
      if ((ev.kind === 'wet' || ev.kind === 'infect' || ev.kind === 'on' || ev.kind === 'hatch') && ev.cell != null) lrAddFx(F, 'on', C(ev.cell), null, { col: ev.kind === 'wet' ? '#6ab8e0' : ev.kind === 'infect' ? '#c8d848' : ev.kind === 'hatch' ? '#d8e8a0' : '#8a6ab0' }, 0.45);
      return;
    }
    case 'heal': { if (!u) return; u.hp = ev.hp; if (ev.amt >= 8) lrNum(F, u.x - 12, u.y - 26, '+' + Math.round(ev.amt), 'heal'); return; }
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
  if (F.done && LU.t >= F.endAt && !LU.sheet) lrShowResult();
}
function lrShowResult() {
  const F = LU.F, win = F.res.win; lrSay(win ? 'up' : 'down'); try { if (typeof music === 'function') music('day'); } catch (e) { /* 음악 없이 */ }
  const fd = $('lr-feed'); if (fd) fd.innerHTML = ''; lrSheet({ kind: 'result' });
}
function lrResultHtml() {
  const F = LU.F, res = F.res, f = res.fight, R = LU.R, over = R.phase === 'over', bd = f.breakdown.filter(b => b.side === 'nest');
  const rows = {}; bd.forEach(b => { const k = b.summon ? 's:' + b.kind : b.id, r = rows[k] = rows[k] || { name: b.name, kind: b.kind === 'core' ? (f.form || 'drop') : b.kind, star: b.star, n: 0, dmg: 0, san: 0, heal: 0, kills: 0, conv: 0 }; r.n++; r.dmg += b.dmg; r.san += b.san; r.heal += b.heal; r.kills += b.kills; r.conv += b.conv || 0; });
  const list = Object.keys(rows).map(k => rows[k]).sort((a, b) => (b.dmg + b.san) - (a.dmg + a.san)), top = list.slice(0, 5), rest = list.slice(5), mx = Math.max(1, ...list.map(r => r.dmg)), mxs = Math.max(1, ...list.map(r => r.san));
  const row = r => `<div class="lr-row"><img src="${lrIcon(r.kind, r.star, 32)}" alt=""><div><p><b>${esc(r.name)}${r.n > 1 ? ' ×' + r.n : ''}</b><span>${Math.round(r.dmg)}</span></p><i class="lr-b"><b style="width:${Math.round(r.dmg / mx * 100)}%"></b></i>${r.san > 0 ? `<i class="lr-b san"><b style="width:${Math.round(r.san / mxs * 100)}%"></b></i>` : ''}<small>${[r.san > 0 ? '정신 ' + Math.round(r.san) : '', r.kills ? '처치 ' + r.kills : '', r.conv ? '미침 ' + r.conv : '', r.heal > 0 ? '회복 ' + Math.round(r.heal) : ''].filter(Boolean).join(' · ')}</small></div></div>`;
  const others = rest.length ? `<p class="lr-rest">그 밖 ${rest.length} · ${Math.round(rest.reduce((s, r) => s + r.dmg, 0))}</p>` : '';
  const line = over ? (R.over.win ? LNAR.end : R.hp <= 0 ? LNAR.fall : LNAR.lose) : res.win ? LNAR.win : LNAR.lose;
  const foot = over ? `<p class="lr-sum">${R.hist.map(h => `<span class="${h.win ? 'w' : 'l'}">${h.round} ${h.win ? '이김' : '짐'}</span>`).join('')}</p><div class="lr-btns"><button class="pri" data-l="again">다시 한 판</button><button data-l="exit">나가기</button></div>`
    : `<p class="lr-sum"><span class="g">진액 +${res.income}</span>${res.lost ? `<span class="l">본체 −${res.lost}</span>` : ''}${f.converted ? `<span class="m">미친 적 ${f.converted}</span>` : ''}<span>${Math.round(f.time)}초</span></p><div class="lr-btns"><button class="pri" data-l="next">다음 싸움</button></div>`;
  return `<h3 class="${res.win ? 'win' : 'lose'}">${res.win ? '막아 냈다' : '뚫렸다'}</h3><p class="lr-nar">${esc(line)}</p><h4>누가 얼마나 했나</h4>${top.map(row).join('')}${others}${foot}`;
}
function lrNext() {
  lrSheetClose(); const R = LU.R; LU.F = null; LU.phase = 'prep'; $('lr-ov').innerHTML = ''; if (LU.res && LU.res.levelUp) lrToast('둥지 Lv ' + R.level); LU.res = null; lrWarmPrep(); lrDraw(); lrSize();
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
function lrDrawUnit(x, h, px, py, anim, t, o) {
  if (!h) return; h.draw(x, px, py, anim, t, o);
  if (o.white) { const c = LTMP.c || (LTMP.c = document.createElement('canvas')), fr = h.frame(anim, t, o); if (c.width < fr.width || c.height < fr.height) { c.width = Math.max(c.width, fr.width); c.height = Math.max(c.height, fr.height); } const g = c.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height); g.drawImage(fr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, fr.width, fr.height);
    const sc = o.scale || 1, gx = h.w / 2, gy = h.pad + h.rig.ground * h.rig.u; x.save(); x.imageSmoothingEnabled = false; x.translate(Math.round(px), Math.round(py)); x.scale(o.flip ? -sc : sc, sc); x.globalAlpha = 0.75; x.drawImage(c, 0, 0, fr.width, fr.height, -gx, -gy, fr.width, fr.height); x.restore(); }
}
function lrStarPips(x, cx, y, n) { if (n < 2) return; const w = n * 7 - 1; for (let k = 0; k < n; k++) { x.fillStyle = '#0c0812'; x.fillRect(cx - w / 2 + k * 7 - 1, y - 1, 7, 7); x.fillStyle = n >= 3 ? '#ffd040' : '#d8e0f0'; x.fillRect(cx - w / 2 + k * 7, y, 5, 5); } }
function lrRender(now) {
  const cv = $('lr-cv'), x = cv.getContext('2d'), R = LU.R, F = LU.F, gnd = LS * 0.3, t = now / 1000; if (!R) return;
  LU.dbg = { badges: 0, range: [], rows: [], dive: 0 };
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
  R.enemy.forEach(e => list.push({ y: lcy(e.cell), d: () => { const h = LAIRART.unit(e.kind, 1), px = lcx(e.cell), py = lcy(e.cell) + gnd; const role = LAIR.INV[e.kind] ? LAIR.INV[e.kind].role : 'melee'; lrRing(x, px, py - 2, '#c8303a', 17, role); lrDrawUnit(x, h, px, py, 'idle', now + e.cell * 97, { flip: true, alpha: 0.92 }); } }));
  Object.keys(R.board).forEach(c => { const uid = R.board[c], u = R.unit[uid]; c = +c; list.push({ y: lcy(c) + (uid === sel ? 1 : 0), d: () => { const h = LAIRART.unit(u.kind, u.star), px = lcx(c), up = uid === sel ? 7 + Math.sin(now / 160) * 2 : 0, py = lcy(c) + gnd; let sc = 1; if (LU.cellPop && LU.cellPop.cell === c && LU.t - LU.cellPop.t0 < 320) { const k = (LU.t - LU.cellPop.t0) / 320; sc = 1 + (LU.cellPop.soft ? 0.12 : 0.35) * Math.sin(k * 3.1416); } lrRing(x, px, py - 2, uid === sel ? '#fff3a0' : '#2fa8a0', 17, LAIR.KIN[u.kind].role); lrDrawUnit(x, h, px, py - up, 'idle', now + c * 131, { scale: sc }); lrStarPips(x, px, py - h.size * 0.86 - 8 - up, u.star); } }); });
  const form = LAIR.formOf(Object.keys(R.board).map(c => R.unit[R.board[c]].kind)), cp = lcen(LAIR.CORE);
  list.push({ y: cp.y - 1, d: () => { lrRing(x, cp.x, cp.y + gnd, '#2fa8a0', 40); lrDrawUnit(x, LAIRART.boss(form), cp.x, cp.y + gnd + 4, 'idle', now, {}); } });
  list.sort((a, b) => a.y - b.y).forEach(q => q.d());
  // 역할 표지는 몸 위에 그린다. 침투하는 적은 뛰어들 뒷줄까지 줄을 긋는다
  R.enemy.forEach(e => { const role = LAIR.INV[e.kind] ? LAIR.INV[e.kind].role : 'melee'; lrBadge(x, role, lcx(e.cell), lcy(e.cell) + gnd - 2);
    if (role === 'dive') { LU.dbg.dive++; const x0 = lcx(e.cell), y0 = lcy(e.cell) + 8, col = e.cell % 6, x1 = lcx(30 + (col === 2 ? 1 : col === 3 ? 4 : col)), y1 = lcy(30) - 6, mx = (x0 + x1) / 2 + (col < 3 ? -40 : 40), my = (y0 + y1) / 2; x.save(); x.strokeStyle = LAIRART.ROLEC.dive; x.globalAlpha = 0.85; x.lineWidth = 2; x.setLineDash([6, 5]); x.lineDashOffset = -now / 45; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(mx, my, x1, y1); x.stroke(); x.setLineDash([]); const an = Math.atan2(y1 - my, x1 - mx); x.fillStyle = LAIRART.ROLEC.dive; x.beginPath(); x.moveTo(x1 + Math.cos(an) * 6, y1 + Math.sin(an) * 6); x.lineTo(x1 + Math.cos(an + 2.5) * 9, y1 + Math.sin(an + 2.5) * 9); x.lineTo(x1 + Math.cos(an - 2.5) * 9, y1 + Math.sin(an - 2.5) * 9); x.fill(); x.restore(); } });
  Object.keys(R.board).forEach(c => { const u = R.unit[R.board[c]]; lrBadge(x, LAIR.KIN[u.kind].role, lcx(+c), lcy(+c) + gnd - 2); });
}
function lrRenderFight(x, now, gnd) {
  const F = LU.F, T = F.T, ms = T * 1000, fxo = { px: 2, size: LS };
  F.zones.forEach(z => z.cells.forEach(c => LAIRART.fx('burnzone', x, { x: lcx(c), y: lcy(c) }, { x: lcx(c), y: lcy(c) }, ((T - z.t0) * 1.3) % 1, fxo)));
  F.fx.forEach(f => { if (f.under && f.a && T >= f.t0) LAIRART.fx(f.name, x, f.a, f.b, (T - f.t0) / f.dur, Object.assign({}, fxo, f.o)); });
  const list = Object.keys(F.ents).map(id => F.ents[id]).filter(e => !(e.dead && T - e.dieT > (e.swallow ? 0.3 : 1.15))).sort((a, b) => a.y - b.y);
  // 겨누는 줄
  F.lines.forEach(l => { const a = l.pa || lrPos(F, l.a), b = l.pb || lrPos(F, l.b); if (!a || !b) return; if (l.aggro) { const k = Math.max(0, (l.until - T)); x.save(); x.globalAlpha = Math.min(1, k * 2); x.strokeStyle = '#f0a04a'; x.lineWidth = 2; x.setLineDash([7, 4]); x.lineDashOffset = -now / 25; x.beginPath(); x.moveTo(Math.round(a.x), Math.round(a.y - 10)); x.lineTo(Math.round(b.x), Math.round(b.y - 10)); x.stroke(); x.restore(); return; } x.save(); x.strokeStyle = l.side === 'nest' ? 'rgba(143,232,216,.8)' : 'rgba(255,150,120,.8)'; x.lineWidth = 1; x.setLineDash([3, 3]); x.lineDashOffset = -now / 40; x.beginPath(); x.moveTo(Math.round(a.x), Math.round(a.y - 10)); x.lineTo(Math.round(b.x), Math.round(b.y - 10)); x.stroke(); x.restore(); });
  list.forEach(e => {
    const h = lrHandle(e); if (!h) return; let px = e.x + e.rx, py = e.y + gnd + e.ry, sc = 1, alpha = 1;
    if (e.lunge) { const k = (T - e.lunge.t0) / 0.46; if (k >= 1) e.lunge = null; else { const s = e.lunge.r ? (k < 0.41 ? 0 : -(k < 0.5 ? (k - 0.41) / 0.09 : 1 - (k - 0.5) / 0.5)) : k < 0.3 ? -0.2 * (k / 0.3) : k < 0.45 ? -0.2 + 1.2 * ((k - 0.3) / 0.15) : k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; px += e.lunge.ux * e.lunge.len * s; py += e.lunge.uy * e.lunge.len * s; } }
    if (e.mvDur > 0 && (e.mvAnim === 'leap')) { const k = Math.min(1, (T - e.mv0) / e.mvDur); py -= Math.sin(k * 3.1416) * 26; }
    if (e.mvDur > 0 && e.mvAnim === 'blink') alpha = 0.4;
    if (e.pop && T - e.pop < 0.3) sc = 0.3 + 0.7 * ((T - e.pop) / 0.3);
    if (e.dead) { const k = T - e.dieT; if (e.swallow) { sc = Math.max(0.05, 1 - k / 0.3); alpha = sc; } else if (k > 0.85) alpha = Math.max(0, 1 - (k - 0.85) / 0.3); }
    if (e.st.stealth) alpha *= 0.45;
    if (e.core) py += 4;
    if (!e.dead) lrRing(x, e.x, e.y + gnd - 2 + (e.core ? 4 : 0), e.mad ? '#f070e8' : e.side === 'nest' ? '#2fa8a0' : '#c8303a', e.core ? 40 : e.boss ? 22 : 17, e.core ? null : e.role);
    if (e.castT != null && T - e.castT < e.castDur && !e.dead) { const k = (T - e.castT) / e.castDur, col = e.side === 'nest' ? (LCOL[e.asp] || '#8fe8d8') : '#ffb060', rw = (e.core ? 54 : 30) * (1.25 - k * 0.75); x.save(); x.globalAlpha = 0.35 + 0.55 * k; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.ellipse(Math.round(e.x), Math.round(e.y + gnd - 2), rw, rw * 0.4, 0, 0, 6.2832); x.stroke(); x.globalAlpha = 0.18 * k; x.fillStyle = col; x.fill(); x.restore(); }
    const anim = e.anim, at = anim === 'idle' || anim === 'move' || anim === 'mad' ? ms + e.off : (T - e.a0) * 1000;
    lrDrawUnit(x, h, px, py, anim, at, { flip: !!e.face, mad: e.mad, scale: sc, alpha, white: e.flash > LU.t });
  });
  // 막대와 상태
  list.forEach(e => {
    if (e.dead) return; const h = lrHandle(e), top = e.y + gnd - (h ? h.size : 48) * 0.86 - (e.core ? 2 : 8), w = e.core ? 64 : e.boss ? 44 : 32;
    LAIRART.bar(x, e.x, top, w, e.hp / e.mhp, e.msan && !e.mad ? e.san / e.msan : null, { side: e.side === 'inv' && !e.mad ? 'inv' : 'kin', mana: e.mmana ? e.mana / e.mmana : null, shield: e.shield });
    { const hf = Math.max(0, e.hp / e.mhp), fw = Math.round((w - 2) * hf), lw = Math.round((w - 2) * Math.min(1, e.lag || 0)) - fw; if (lw > 0) { x.fillStyle = '#ffffff'; x.fillRect(Math.round(e.x - w / 2) + 1 + fw, top + 1, lw, 4); } }
    lrStarPips(x, e.x, top - 8, e.side === 'nest' && !e.core && !e.summon ? e.star : 0);
    let k = 0; for (const st in e.st) { if (!LSTC[st]) continue; const sx = Math.round(e.x - w / 2 + k * 7), sy = Math.round(top + (e.msan && !e.mad ? 14 : 10)); x.fillStyle = '#0c0812'; x.fillRect(sx - 1, sy - 1, 7, 7); x.fillStyle = LSTC[st]; x.fillRect(sx, sy, 5, 5); if (st === 'stun' || st === 'silenced') { x.fillStyle = '#0c0812'; x.fillRect(sx + 2, sy + 1, 1, 3); x.fillRect(sx + 1, sy + 2, 3, 1); } k++; }
  });
  list.forEach(e => { if (!e.dead && !e.core) lrBadge(x, e.role, e.x, e.y + gnd - 2); });
  F.fx.forEach(f => { if (!f.under && f.a && T >= f.t0) LAIRART.fx(f.name, x, f.a, f.b, (T - f.t0) / f.dur, Object.assign({}, fxo, f.o)); });
  const nl = 820 / Math.sqrt(LU.speed); F.nums = F.nums.filter(n => LU.t - n.t0 < nl); F.nums.forEach(n => LAIRART.num(x, n.x, n.y, n.text, n.kind, (LU.t - n.t0) / nl, n.kind === 'crit' ? 4 / 3 : n.kind === 'guard' ? 1.5 : 2));
  // 시작 알림 · 광란
  if (F.banner && F.banner.until > LU.t && !F.banner.shown) { F.banner.shown = 1; lrLabel(LW / 2, LU.wallH + 26, F.banner.text, 'ban', F.banner.until - LU.t); }
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
if (typeof window !== 'undefined') window.__lair = { get R() { return LU.R; }, get U() { return LU; }, get F() { return LU.F; }, L: typeof LAIR !== 'undefined' ? LAIR : null, open: () => lairOpen(), fresh: seed => lrNew(seed), view: () => lrView(), pt(c) { const r = $('lr-cv').getBoundingClientRect(); return { x: r.left + lcx(c) * LU.scale, y: r.top + lcy(c) * LU.scale }; }, redraw: () => { lrWarmPrep(); lrDraw(); }, give(kind, star, cell) { const R = LU.R, uid = R.nextUid++; R.unit[uid] = { uid, kind, star: star || 1 }; if (cell != null) R.board[cell] = uid; else R.bench[R.bench.indexOf(null)] = uid; return uid; }, sheet: s => lrSheet(s), dbg: () => LU.dbg, speeds: () => LSPD.map(q => q[0]), stats() { const F = LU.F; return F ? { T: F.T, i: F.i, n: F.tl.length, done: F.done, intro: F.intro, real: F.real / 1000, slows: F.slows, blocks: F.blocks, shots: F.shots, taunts: F.taunts, alive: Object.keys(F.ents).filter(id => !F.ents[id].dead && !F.ents[id].core).length, mads: F.mads, casts: F.casts, late: F.late.length, ents: Object.keys(F.ents).length, frames: LU.fpsN } : null; } };
