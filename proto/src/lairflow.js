// 판 사이의 고르는 화면: 보상(choice), 신화 단계(mythos)와 깨어남, 조우(encounter)와 주사위.
// 약속: LF.pending(R) 은 R.phase 가 이 셋 중 하나인지. LF.run(R, done) 은 R.phase 가 'prep' 이나 'over' 가 될 때까지 화면을 이어 띄우고 done() 을 한 번 부른다.
// LF.auto 가 참이면 화면 없이 첫째 것을 고른다(시험용). 화면은 body 에 붙는 #lf 하나에 그린다. 고를 때마다 lrSave() 가 있으면 부른다.
// 판을 나갔다 와도 R 에 다 들어 있으므로(고를 것, 신화 셋, 조우에서 굴린 주사위) 같은 자리에서 다시 열린다.
const LFS = { R: null, done: null, sel: null, arm: null, inter: null, rolling: null, tm: 0, raf: 0, last: 0 };
const LFURL = {};
const lfUrl = (k, fn) => { if (LFURL[k] == null) { try { LFURL[k] = fn().toDataURL(); } catch (e) { LFURL[k] = ''; } } return LFURL[k]; };
const lfSym = (id, px) => `<img class="lf-ic" src="${lfUrl('sym:' + id + ':' + px, () => LAIRART.sym(id, px))}" width="${px}" height="${px}" alt="">`;
// 그림 id: 새 그림이 붙기 전에는 규칙이 알려 주는 빌린 그림
const lfArt = kind => { try { if (LAIRART.DEF && LAIRART.DEF[kind]) return kind; const d = LAIR.KIN[kind] || LAIR.INV[kind]; return (d && d.art) || kind; } catch (e) { return kind; } };
const lfSay = k => { try { sfx(k); } catch (e) { /* 소리 없이 */ } };
const lfSave = () => { try { if (typeof lrSave === 'function') lrSave(); } catch (e) { /* 저장 없이 */ } };
const lfMotion = () => { try { return motionOk(); } catch (e) { return true; } };
const lfToast = msg => { try { if (typeof shToast === 'function') shToast(msg || '지금은 안 된다'); } catch (e) { /* 알림 없이 */ } };
const lfSg = n => (n > 0 ? '+' : '−') + Math.abs(n);
// 본 것을 적는다: 도감이 읽는다. key = 'seenCards' | 'seenEnc' | 'seenStep'
function lfSeen(key, ids, n) {
  try { if (typeof META === 'undefined' || !META) return; if (!META[key] || typeof META[key] !== 'object' || Array.isArray(META[key])) META[key] = {}; const S = META[key]; let ch = false;
    ids.forEach(id => { if (id && (+S[id] || 0) < (n || 1)) { S[id] = n || 1; ch = true; } }); if (ch) saveMeta(); } catch (e) { /* 저장 없이 */ }
}

// ---------- 주사위 ----------
// 뼈로 깎은 흰 주사위. 5와 6이 성공: 보랏빛 테. 실패는 어둡게
const LFPIP = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const lfDie = (face, cls) => `<span class="lf-die${cls ? ' ' + cls : ''}" data-face="${face}" role="img" aria-label="주사위 ${face}">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => ((LFPIP[face] || []).includes(i) ? '<i class="p"></i>' : '<i></i>')).join('')}</span>`;
function lfDieSet(el, face) { el.dataset.face = face; Array.from(el.children).forEach((c, i) => { c.className = LFPIP[face].includes(i) ? 'p' : ''; }); }

// ---------- 틀 ----------
function lfMount() {
  let el = $('lf'); if (el) return el;
  el = document.createElement('div'); el.id = 'lf'; el.hidden = true; document.body.appendChild(el); el.addEventListener('click', lfClick); return el;
}
const lfBox = (cls, head, body, foot) => `<div class="lf-box ${cls}" role="dialog" aria-modal="true"><div class="lf-head">${head}<button class="lf-exit" data-f="exit">나가기</button></div><div class="lf-body">${body}</div><div class="lf-foot">${foot}</div></div>`;
const lfWhere = v => (v.act ? `<span class="lf-sub">${v.act}막 ${v.rin}/${v.per}</span>` : '');
function lfShow() {
  const el = lfMount(), R = LFS.R; clearInterval(LFS.tm); LFS.tm = 0;
  if (LFS.inter) el.innerHTML = LFS.inter.kind === 'awake' ? lfAwakeHtml() : lfOutHtml();
  else { if (!R || !LF.pending(R)) return lfClose(); const v = LAIR.view(R); el.innerHTML = R.phase === 'choice' ? lfChoiceHtml(v) : R.phase === 'mythos' ? lfMythosHtml(v) : lfEncHtml(v); }
  el.hidden = false; if (!LFS.raf) LFS.raf = requestAnimationFrame(lfLoop);
}
function lfClose() {
  const el = $('lf'); if (el) { el.hidden = true; el.innerHTML = ''; } clearInterval(LFS.tm); LFS.tm = 0; LFS.rolling = null;
  const d = LFS.done; LFS.done = null; LFS.R = null; LFS.sel = null; LFS.arm = null; LFS.inter = null; if (d) d();
}
// 판에서 나간다: 고르지 않고 첫 화면으로. 저장은 그대로이니 이어하면 같은 자리다
function lfExit() {
  const el = $('lf'); if (el) { el.hidden = true; el.innerHTML = ''; } clearInterval(LFS.tm); LFS.tm = 0; LFS.rolling = null; LFS.done = null; LFS.R = null; LFS.sel = null; LFS.arm = null; LFS.inter = null;
  try { if (typeof lrExit === 'function') lrExit(); else if (typeof showTitle === 'function') showTitle(); } catch (e) { /* 첫 화면 없이 */ }
}
function lfLoop(now) {
  const el = $('lf'); if (!el || el.hidden) { LFS.raf = 0; return; }
  LFS.raf = requestAnimationFrame(lfLoop); if (now - LFS.last < 33) return; LFS.last = now;
  el.querySelectorAll('canvas.lf-boss').forEach(cv => lfBossDraw(cv, now));
  const aw = el.querySelector('canvas.lf-awcv'); if (aw) lfAwakeDraw(aw, now);
}
function lfBossDraw(cv, now) {
  const d = cv.dataset, mo = lfMotion(); if (!mo && d.done) return; const x = cv.getContext('2d'), W = cv.width;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, W); x.imageSmoothingEnabled = false;
  try { const h = LAIRART.boss(d.form, +d.step || 0); if (h) h.draw(x, W / 2, W - 10, 'idle', mo ? now : 0, {}); } catch (e) { /* 그림 없이 */ }
  d.done = '1';
}

// ---------- 보상 ----------
const LFKIND = { reward: '보상', elite: '정예 보상', boss: '우두머리 보상' };
function lfOptPic(o) {
  if (o.type === 'room') return `<img class="lf-pic" src="${lfUrl('room:' + o.id, () => LAIRART.room(o.id, 64, 0, 1, 0))}" width="64" height="64" alt="">`;
  if (o.type === 'unit') return `<img class="lf-pic" src="${lfUrl('ic:' + o.id + ':' + o.star, () => LAIRART.icon(lfArt(o.id), o.star, 64))}" width="64" height="64" alt="">`;
  if (o.type === 'gold') return `<span class="lf-pic lf-coin">+${o.amt}</span>`;
  return `<span class="lf-pic lf-encpic">${lfDie(5, 'ok')}</span>`;
}
function lfOptText(o) {
  if (o.type === 'room') return { name: o.name, short: o.short + ' · ' + o.len + '칸', more: esc(o.more) + (o.spots && o.spots.length ? '' : '<br>지금은 깔 자리가 없다.') };
  if (o.type === 'unit') return { name: o.name + ' ' + '★'.repeat(o.star), short: `값 ${o.cost} · ${o.aspName} · ${o.clsName}`, more: `${esc(o.roleName)} · ${esc(o.reach)} · ${esc(o.short)}<br><b>${esc(o.skill.name)}</b> ${esc(o.skill.short)}` + (o.asGold ? `<br>대기석이 차 있다. 진액 ${o.asGold}으로 받는다.` : '') };
  if (o.type === 'gold') return { name: '진액', short: '+' + o.amt, more: esc(o.more) };
  return { name: o.name, short: '조우 · 주사위', more: esc(o.more) };
}
function lfChoiceHtml(v) {
  const ch = v.choice, sel = LFS.sel;
  const rows = ch.opts.map(o => { const on = sel === o.i, t = lfOptText(o);
    return `<button class="lf-opt${on ? ' on' : ''}" data-f="sel" data-i="${o.i}" data-t="${o.type}" aria-pressed="${on}"${o.can ? '' : ' disabled'}>${lfOptPic(o)}<span class="lf-otx"><b>${esc(t.name)}</b><span class="lf-osh">${esc(t.short)}</span>${on ? `<span class="lf-more">${t.more}</span>` : ''}</span></button>`; }).join('');
  return lfBox('choice', `<h2>${LFKIND[ch.kind] || '보상'}</h2>${lfWhere(v)}`, `<p class="lf-guide">하나를 고른다.</p><div class="lf-list">${rows}</div>`, `<button class="btn pri" data-f="cpick"${sel == null ? ' disabled' : ''}>고른다</button>`);
}

// ---------- 신화 단계 ----------
function lfCardHtml(c, i, on) {
  return `<button class="lf-card${on ? ' on' : ''}" data-f="sel" data-i="${i}" data-id="${c.id}" aria-pressed="${on}"><span class="lf-ch">${lfSym(c.asp, 16)}<b>${esc(c.name)}</b><small>${esc(c.aspName)} · ${esc(c.cat)}</small></span>`
    + `<span class="lf-pw"><i>권능</i><span>${esc(c.power)}</span></span><span class="lf-pr"><i>대가</i><span>${esc(c.price)}</span></span>${on ? `<span class="lf-more">${esc(c.more)}</span>` : ''}</button>`;
}
function lfMythosHtml(v) {
  const m = v.mythos, c = v.form || LAIR.coreInfo(LFS.R), sel = LFS.sel, armed = LFS.arm === 'reroll';
  lfSeen('seenCards', m.offer.map(o => o.id));
  const syn = (v.synergies || []).filter(s => s.kind === 'asp').slice(0, 5).map(s => `<span class="lf-syn">${lfSym(s.id, 16)}${s.n}</span>`).join('');
  const picked = m.picked.length ? `<p class="lf-picked">받아들인 것 ${m.picked.map(q => `<span>${lfSym(q.asp, 16)}${esc(q.name)}</span>`).join('')}</p>` : '';
  const head = `<canvas class="lf-boss" width="96" height="96" data-form="${c.form}" data-step="${c.step}"></canvas><div class="lf-mh"><p class="lf-phase">신화 단계 <b>${m.phase + 1}</b>/3</p><p class="lf-tier">${esc(m.tierName)}</p>${syn ? `<p class="lf-syns">${syn}</p>` : ''}</div>`;
  const body = `<p class="lf-guide">하나를 받아들인다. 본체는 받아들인 신화의 성향을 따라 깨어난다.</p><div class="lf-cards">${m.offer.map((q, i) => lfCardHtml(q, i, sel === i)).join('')}</div>${picked}`;
  const foot = `<button class="btn${armed ? ' on' : ''}" data-f="mreroll"${m.rerollLeft > 0 ? '' : ' disabled'}>${armed ? '셋을 버린다' : '다시 본다'}<small>${m.rerollLeft}</small></button><button class="btn pri" data-f="mpick"${sel == null ? ' disabled' : ''}>받아들인다</button>`;
  return lfBox('mythos t' + m.tier, head, body, foot);
}
// 깨어남: 받아들인 뒤 본체가 한 단계 바뀌는 것을 보여 준다
const LFWAKE = ['', '잠든 이의 꿈이 굴 바닥까지 스며들었다. 그것은 처음으로 제 형상을 가졌다.', '굴의 돌이 안쪽으로 기울었다. 그것은 더 이상 숨지 않았다.', '별들이 제자리에 섰다. 굴은 그것을 담기에 좁았다.'];
const LFWAKEA = { abyss: '젖은 촉수가 벽을 따라 뻗었고, 돌 틈마다 짠물이 배어 나왔다.', nebula: '천장이 있던 자리에 눈이 열렸다. 그 눈은 깜박이지 않았다.', brood: '알들이 한꺼번에 뒤척였고, 껍질 안에서 무엇인가가 대답하였다.', dusk: '두건 쓴 것들이 낮은 소리로 같은 구절을 되풀이하였다.', hunger: '아가리가 벌어졌고, 굴 안의 공기가 그쪽으로 쓸려 들어갔다.' };
function lfGain(g) {
  if (!g) return ''; const t = g.type, a = +g.amt || 0;
  if (t === 'gold') return a ? `<span class="${a > 0 ? 'ok' : 'no'}">진액 ${lfSg(a)}${g.instead && LAIR.KIN[g.instead] ? ' (대기석이 차서 ' + esc(LAIR.KIN[g.instead].name) + ' 대신)' : ''}</span>` : '';
  if (t === 'xp') return `<span class="ok">경험 +${a}${g.levelUp ? ' · 둥지 레벨 오름' : ''}</span>`;
  if (t === 'life') return a ? `<span class="${a > 0 ? 'ok' : 'no'}">목숨 ${lfSg(a)}</span>` : '';
  if (t === 'fear') return a ? `<span>공포 ${lfSg(a)}</span>` : '';
  if (t === 'unit') return `<span class="ok">${esc(g.name || '')} ${'★'.repeat(g.star || 1)}</span>`;
  if (t === 'room') return `<span class="ok">방 · ${esc(g.name || '')}</span>`;
  if (t === 'curse') return `<span class="no">${esc(g.name)} · ${esc(g.short)} · ${g.n}싸움</span>`;
  if (t === 'cult') return `<span class="ok">광신도 +${a}</span>`;
  if (t === 'omen') return `<span class="ok">판정 주사위 −1 · ${a}싸움</span>`;
  if (t === 'zeal') return `<span class="ok">다음 싸움 광신도 ${a}</span>`;
  return '';
}
const lfGains = list => (Array.isArray(list) ? list.map(lfGain).join('') : '');
function lfAwakeHtml() {
  const A = LFS.inter, to = A.to, c = A.card, gains = lfGains(A.gains);
  const sk = to.skill ? `<p class="lf-skill"><b>${esc(to.skill.name)}</b> ${esc(to.skill.short)}${to.t2 ? ' · ' + esc(to.t2) : ''}</p>` : '';
  const body = `<canvas class="lf-awcv" width="128" height="128"></canvas><div class="lf-awtx${lfMotion() ? '' : ' show'}"><p class="lf-step">깨어남 ${to.step}/3</p><h2>${esc(to.name)}</h2><p class="lf-text">${LFWAKE[to.step] || ''} ${LFWAKEA[to.form] || ''}</p>${sk}`
    + `<div class="lf-got"><b>${esc(c.name)}</b><span class="lf-pw"><i>권능</i><span>${esc(c.power)}</span></span><span class="lf-pr"><i>대가</i><span>${esc(c.price)}</span></span>${gains ? `<p class="lf-gains">${gains}</p>` : ''}</div></div>`;
  return `<div class="lf-box awake t${c.tier}" role="dialog" aria-modal="true"><div class="lf-body">${body}</div><div class="lf-foot"><button class="btn pri" data-f="next">이어서</button></div></div>`;
}
function lfAwakeDraw(cv, now) {
  const A = LFS.inter; if (!A || A.kind !== 'awake') return; const mo = lfMotion(); if (!mo && A.drawn) return; if (!A.t0) A.t0 = now;
  const t = mo ? now - A.t0 : 99999, old = t < 1100, x = cv.getContext('2d'), W = cv.width;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, W, W); x.imageSmoothingEnabled = false;
  try {
    const f = old ? A.from : A.to, h = LAIRART.boss(f.form, f.step), sh = t > 450 && t < 1100 ? Math.round(Math.sin(now / 28) * Math.min(3, (t - 450) / 200)) : 0;
    if (h) h.draw(x, W / 2 + sh, W - 14, old && t > 700 ? 'cast' : 'idle', old && t > 700 ? t - 700 : (mo ? now : 0), {});
    if (t >= 1000 && t < 1600) { x.globalAlpha = t < 1100 ? (t - 1000) / 110 : Math.max(0, 1 - (t - 1100) / 500) * 0.9; x.fillStyle = '#efe6ff'; x.fillRect(0, 0, W, W); x.globalAlpha = 1; }
  } catch (e) { /* 그림 없이 */ }
  if (t >= 1100 && !A.shown) { A.shown = 1; const b = $('lf').querySelector('.lf-awtx'); if (b) b.classList.add('show'); lfSay('molt'); }
  A.drawn = 1;
}

// ---------- 조우 ----------
function lfHint(c) {
  const h = String(c.hint || '').replace(/^진액 −\d+ · /, ''), m = h.match(/^성공: (.*) \/ 실패: (.*)$/);
  return m ? `<span class="lf-more"><span class="ok">성공 · ${esc(m[1])}</span><span class="no">실패 · ${esc(m[2])}</span></span>` : `<span class="lf-more">${esc(h)}</span>`;
}
function lfEncHtml(v) {
  const e = v.encounter, sel = LFS.sel, roll = e.roll, rolling = LFS.rolling; lfSeen('seenEnc', [e.id]);
  const stats = `<div class="lf-stats">${v.stats.map(s => `<span class="lf-stat${roll && roll.stat === s.id ? ' on' : ''}"><small>${esc(s.name)}</small><b>${s.dice}</b></span>`).join('')}<span class="lf-stat coin"><small>진액</small><b>${v.gold}</b></span></div>`;
  let body = stats + `<p class="lf-text">${esc(e.text)}</p>`, foot = '';
  if (!e.pick) {
    body += `<div class="lf-list">${e.choices.map((c, i) => { const on = sel === i, t = c.test;
      const line = (t ? `${lfDie(5, 'mini ok')}${esc(t.statName)} 주사위 ${t.dice} · 성공 ${t.need}` : '판정 없음') + (c.cost ? ` · 진액 −${c.cost}` : '');
      return `<button class="lf-opt txt${on ? ' on' : ''}" data-f="sel" data-i="${i}" data-id="${c.id}" aria-pressed="${on}"${c.can ? '' : ' disabled'}><span class="lf-otx"><b>${esc(c.label)}</b><span class="lf-osh">${line}</span>${on ? lfHint(c) : ''}</span></button>`; }).join('')}</div>`;
    foot = `<button class="btn pri" data-f="epick"${sel == null ? ' disabled' : ''}>고른다</button>`;
  } else {
    const c = e.choices.find(q => q.id === e.pick) || { label: '' };
    body += `<p class="lf-chosen"><b>${esc(c.label)}</b>${roll ? `<span>${esc(roll.statName)} · 성공 ${roll.need}</span>` : ''}</p>`;
    if (roll) {
      const win = roll.successes >= roll.need;
      body += `<div class="lf-tray">${roll.dice.map((d, i) => (rolling && rolling[i] ? lfDie(1 + ((i * 3 + 2) % 6), 'roll') : lfDie(d, d >= 5 ? 'ok' : 'no'))).join('')}</div>`
        + `<p class="lf-rollres${rolling ? ' wait' : win ? ' ok' : ' no'}">${rolling ? '굴린다' : `성공 <b>${roll.successes}</b> / ${roll.need}`}</p>`;
      if (win) foot = `<button class="btn pri" data-f="eres"${rolling ? ' disabled' : ''}>이어서</button>`;
      else foot = `<button class="btn" data-f="ereroll"${rolling || !e.canReroll ? ' disabled' : ''}>다시 굴린다<small>진액 ${e.rerollCost}</small></button><button class="btn pri" data-f="eres"${rolling ? ' disabled' : ''}>그대로 받는다</button>`;
    } else foot = '<button class="btn pri" data-f="eres">이어서</button>';
  }
  return lfBox('enc', `<h2>${esc(e.title)}</h2>`, body, foot);
}
// 주사위를 굴린다. prev = 다시 굴릴 때의 앞선 눈(5 이상은 그대로 둔다). 움직임을 끈 설정이면 곧바로 결과
function lfRoll(prev) {
  const R = LFS.R, E = R && R.encounter; if (!E || !E.roll) return lfShow();
  if (!lfMotion()) { LFS.rolling = null; lfSay('thud'); return lfShow(); }
  LFS.rolling = E.roll.dice.map((d, i) => !prev || prev[i] < 5); lfShow();
  const t0 = Date.now(), dur = 620 + (prev ? 0 : 120);
  LFS.tm = setInterval(() => {
    const el = $('lf'); if (!el || el.hidden) { clearInterval(LFS.tm); LFS.tm = 0; LFS.rolling = null; return; }
    if (Date.now() - t0 >= dur) { clearInterval(LFS.tm); LFS.tm = 0; LFS.rolling = null; const ok = E.roll.dice.filter(d => d >= 5).length >= E.roll.need; lfSay(ok ? 'combo' : 'thud'); return lfShow(); }
    el.querySelectorAll('.lf-die.roll').forEach(d => lfDieSet(d, 1 + Math.floor(Math.random() * 6)));
  }, 70);
}
function lfResolve() {
  const R = LFS.R, v = LAIR.view(R).encounter; if (!v) return lfShow();
  const c = v.choices.find(q => q.id === v.pick), r = LAIR.encounterResolve(R); if (!r.ok) return lfToast(r.msg);
  LFS.inter = { kind: 'out', title: v.title, label: c ? c.label : '', tested: !!v.roll, success: r.success, text: r.outcomeText, gains: r.gains }; LFS.sel = null; lfSave(); if (!v.roll) lfSay('card'); lfShow();
}
function lfOutHtml() {
  const O = LFS.inter, gains = lfGains(O.gains);
  const body = `<p class="lf-chosen"><b>${esc(O.label)}</b>${O.tested ? `<span class="lf-verdict ${O.success ? 'ok' : 'no'}">${O.success ? '성공' : '실패'}</span>` : ''}</p><p class="lf-text">${esc(O.text)}</p><p class="lf-gains">${gains || '<span>아무 일도 없다</span>'}</p>`;
  return `<div class="lf-box enc out" role="dialog" aria-modal="true"><div class="lf-head"><h2>${esc(O.title)}</h2></div><div class="lf-body">${body}</div><div class="lf-foot"><button class="btn pri" data-f="next">이어서</button></div></div>`;
}

// ---------- 누름 ----------
function lfClick(e) {
  const b = e.target.closest('[data-f]'); if (!b || b.disabled || LFS.rolling) return; const f = b.dataset.f, R = LFS.R, i = +b.dataset.i;
  if (f !== 'mreroll') LFS.arm = null;
  if (f === 'exit') { lfSay('click'); return lfExit(); }
  if (f === 'next') { LFS.inter = null; LFS.sel = null; lfSay('click'); return lfShow(); }
  if (!R) return;
  if (f === 'sel') { LFS.sel = i; lfSay('card'); return lfShow(); }
  if (f === 'cpick') { if (LFS.sel == null) return; const r = LAIR.choose(R, LFS.sel); if (!r.ok) return lfToast(r.msg); LFS.sel = null; lfSave(); lfSay('coin'); return lfShow(); }
  if (f === 'mreroll') {
    if (LFS.arm !== 'reroll') { LFS.arm = 'reroll'; lfSay('click'); return lfShow(); }
    LFS.arm = null; const r = LAIR.mythosReroll(R); if (!r.ok) return lfToast(r.msg); LFS.sel = null; lfSave(); lfSay('card'); return lfShow();
  }
  if (f === 'mpick') {
    if (LFS.sel == null) return; const from = LAIR.coreInfo(R), r = LAIR.mythosPick(R, LFS.sel); if (!r.ok) return lfToast(r.msg);
    const to = LAIR.coreInfo(R); lfSeen('seenStep', [to.form], to.step); try { if (META.seen && META.seen.form && !META.seen.form[to.form]) { META.seen.form[to.form] = 1; saveMeta(); } } catch (er) { /* 저장 없이 */ }
    LFS.inter = { kind: 'awake', from: { form: from.form, step: from.step }, to, card: r.picked, gains: r.gains, t0: 0 }; LFS.sel = null; lfSave(); if (!lfMotion()) lfSay('molt'); return lfShow();
  }
  if (f === 'epick') {
    const v = LAIR.view(R).encounter, c = v && v.choices[LFS.sel]; if (!c) return; const r = LAIR.encounterChoose(R, c.id); if (!r.ok) return lfToast(r.msg);
    LFS.sel = null; lfSave(); if (!r.roll) return lfResolve(); return lfRoll(null);
  }
  if (f === 'ereroll') { if (!R.encounter || !R.encounter.roll) return; const prev = R.encounter.roll.dice.slice(), r = LAIR.encounterReroll(R); if (!r.ok) return lfToast(r.msg); lfSave(); lfSay('coin'); return lfRoll(prev); }
  if (f === 'eres') return lfResolve();
}

const LF = { auto: false,
  pending(R) { return !!R && (R.phase === 'choice' || R.phase === 'mythos' || R.phase === 'encounter'); },
  // 화면 없이 한 걸음: 첫째 것을 고른다
  step(R) {
    if (R.phase === 'choice') return LAIR.choose(R, 0);
    if (R.phase === 'mythos') return LAIR.mythosPick(R, 0);
    if (R.phase === 'encounter') { const v = LAIR.view(R).encounter, c = v.choices.find(q => q.can) || v.choices[0]; if (!v.pick) LAIR.encounterChoose(R, c.id); return LAIR.encounterResolve(R); }
    return null;
  },
  run(R, done) {
    if (LF.auto || !R) {
      // 화면이 떠 있던 채로 저절로 고르게 되면 화면을 걷고, 먼저 기다리던 done 도 부른다
      const prev = LFS.done, el = $('lf'); if (el && !el.hidden) { el.hidden = true; el.innerHTML = ''; } clearInterval(LFS.tm); LFS.tm = 0; LFS.rolling = null; LFS.done = null; LFS.R = null; LFS.sel = null; LFS.arm = null; LFS.inter = null;
      let n = 0; while (LF.pending(R) && n++ < 40) { const r = LF.step(R); if (!r || !r.ok) break; } if (R) lfSave(); if (prev && prev !== done) prev(); if (done) done(); return;
    }
    LFS.R = R; LFS.done = done || null; LFS.sel = null; LFS.arm = null; LFS.inter = null; LFS.rolling = null; lfShow();
  },
  get open() { const el = $('lf'); return !!el && !el.hidden; },
  get screen() { const el = $('lf'), b = el && !el.hidden && el.querySelector('.lf-box'); return b ? b.className.replace('lf-box ', '') : ''; },
  get rolling() { return !!LFS.rolling; },
  close() { lfExit(); }
};
if (typeof window !== 'undefined') window.__lf = LF;
