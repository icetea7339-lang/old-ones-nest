// 둥지 전투 규칙 검사.  node tests/lairrules.js
const L = require('../src/lair.js'), B = require('../src/lairbot.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const C = (r, c) => L.idx(r, c);
const sim = (o) => L.simulate(Object.assign({ seed: 7, nest: [], inv: [], rooms: [], level: 3, round: 1, form: 'drop', syn: {} }, o));
const N = (kind, cell, star, uid) => ({ uid: uid || cell, kind, star: star || 1, cell });
const E = (kind, r, c) => ({ kind, cell: C(r, c) });
const TYPES = ['move', 'attack', 'hit', 'cast', 'skillfx', 'status', 'mad', 'cleanse', 'die', 'spawn', 'roomfx', 'synergy', 'heal', 'sanity', 'frenzy', 'sudden', 'win', 'boon', 'check'];

// 1. 같은 씨앗이면 같은 싸움
{
  const S = { seed: 11, nest: [N('shell', 20), N('gazer', 26), N('hood', 27), N('biter', 21)], inv: [E('militia', 2, 1), E('militia', 2, 3), E('hound', 1, 0), E('torch', 2, 4)], rooms: [{ id: 'pool', cells: [19, 20, 21] }], syn: { caller: 1 } };
  const a = JSON.stringify(sim(S)), b = JSON.stringify(sim(S)), c = JSON.stringify(sim(Object.assign({}, S, { seed: 12 })));
  ok(a === b, '같은 씨앗의 싸움이 다르다'); ok(a !== c, '씨앗이 달라도 싸움이 같다');
  const r1 = B.playRun(4242, 'decent', { taste: true }), r2 = B.playRun(4242, 'decent', { taste: true }); ok(JSON.stringify(r1.R) === JSON.stringify(r2.R), '같은 씨앗의 판이 다르다');
}

// 2. 사건 줄이 바르다 + 3. 스킬이 전부 쓰인다
const casts = {}, fxs = {}; let fights = 0, tsum = [0, 0, 0], tn = [0, 0, 0];
function checkFight(f, tag) {
  fights++; const ids = new Set(f.units.map(u => u.id)); let last = -1, wins = 0;
  f.timeline.forEach((e, i) => {
    ok(TYPES.includes(e.type), tag + ': 모르는 사건 ' + e.type); ok(e.t >= last - 1e-9, tag + ': 시간이 거꾸로 간다 ' + e.type + '@' + e.t); last = e.t;
    if (e.type === 'spawn') ids.add(e.u);
    ['u', 'by', 'tg'].forEach(k => { if (e[k] != null && e.type !== 'spawn') ok(ids.has(e[k]), tag + ': 없는 유닛 ' + e.type + '.' + k + '=' + e[k]); });
    (e.tgs || []).concat(e.pals || []).forEach(id => ok(ids.has(id), tag + ': 없는 대상 ' + e.type + ' ' + id));
    ['from', 'to', 'cell'].forEach(k => { if (typeof e[k] === 'number') ok(e[k] >= 0 && e[k] < L.N, tag + ': 판 밖의 칸 ' + e.type + '.' + k); });
    (e.cells || []).forEach(c => ok(c >= 0 && c < L.N, tag + ': 판 밖의 칸들'));
    if (e.type === 'hit') { ok(e.hp >= 0 && e.sn >= 0 && e.dmg >= 0 && e.san >= 0, tag + ': 음수 수치'); ok(e.dmg > 0 || e.san > 0, tag + ': 빈 타격'); }
    if (e.type === 'cast') casts[e.sk] = (casts[e.sk] || 0) + 1; if (e.type === 'skillfx') { fxs[e.sk] = (fxs[e.sk] || 0) + 1; ok(typeof e.fx === 'string', tag + ': 연출 이름이 없다'); }
    if (e.type === 'win') { wins++; ok(i === f.timeline.length - 1, tag + ': 끝 사건이 마지막이 아니다'); }
  });
  ok(wins === 1, tag + ': 끝 사건이 하나가 아니다'); ok(f.time > 2 && f.time <= L.K.end + 0.01, tag + ': 싸움 길이 ' + f.time);
  ok(['win', 'loss'].includes(f.result) && f.breakdown.length >= f.units.length, tag + ': 결과가 이상하다');
  // 기절한 동안에는 움직이지 않는다
  const stun = {}; f.timeline.forEach(e => { if (e.type === 'status' && e.st === 'stun') { if (e.on) stun[e.u] = e.t + e.dur; else delete stun[e.u]; } if (e.type === 'die') delete stun[e.u]; if ((e.type === 'attack' || e.type === 'cast') && stun[e.u] != null) ok(e.t >= stun[e.u] - 0.11 || e.again, tag + ': 기절한 것이 움직였다 ' + e.u + '@' + e.t); });
  // 켜진 상태는 꺼지거나, 죽거나, 싸움이 끝난다
  const on = {}; f.timeline.forEach(e => { if (e.type === 'status') { const k = e.u + ':' + e.st; if (e.on) on[k] = e.t; else { ok(on[k] != null, tag + ': 켠 적 없는 상태가 꺼졌다 ' + k); delete on[k]; } } if (e.type === 'die') Object.keys(on).forEach(k => { if (k.split(':')[0] === e.u) delete on[k]; }); });
}
['decent', 'random', 'abyss', 'nebula', 'brood', 'dusk', 'hunger', 'blob'].forEach((nm, k) => { for (let s = 1; s <= 8; s++) { const seed = s * 7919 + 13 + k; const st = B.STRAT[nm], R = L.newRun(seed, { taste: true }), S = { s: seed }, rng = () => L.rnd(S); while (R.phase === 'prep') { B.shopping(R, st, rng); B.pickRoom(R, st, rng); B.arrange(R, st, rng); const rd = R.round, r = L.ready(R); checkFight(r.fight, nm + '#' + s + 'r' + rd); tsum[rd - 1] += r.fight.time; tn[rd - 1]++; } } });
// 본체의 모습마다, 권속의 별마다 스킬을 한 번씩
Object.keys(L.FORM).forEach(form => { const f = sim({ seed: 3, form, round: 2, nest: [N('shell', 20, 2), N('heap', 21, 2)], inv: [E('militia', 2, 1), E('militia', 2, 2), E('militia', 2, 3), E('knight', 2, 4), E('hound', 1, 0)] }); checkFight(f, '모습 ' + form); ok(f.timeline.some(e => e.type === 'cast' && e.u === 'core' && e.sk === L.FORM[form].skill), form + ' 모습의 스킬이 안 쓰였다'); });
L.KIN_IDS.forEach(kind => [1, 2, 3].forEach(star => { const f = sim({ seed: 5 + star, round: 2, nest: [N(kind, 20, star), N('shell', 21, 2)], inv: [E('knight', 2, 2), E('militia', 2, 3), E('militia', 2, 1), E('archer', 0, 4), E('priest', 0, 2)] }); checkFight(f, kind + star); ok(f.timeline.some(e => e.type === 'cast' && e.u === 'k20'), kind + ' ' + star + '성이 스킬을 못 썼다'); }));
// 침입자마다 스킬을 한 번씩 (조사자와 2막·3막의 것들까지)
L.INV_IDS.forEach((kind, k) => { let done = false; for (let s = 1; s <= 8 && !done; s++) { const f = sim({ seed: s + k, round: 2, check: L.K.full.check, nest: [N('shell', 20, 3), N('heap', 21, 3), N('maw', 19, 3), N('hood', 26, 2), N('brood', 27, 2)], inv: [E(kind, 1, 2), E('knight', 2, 2), E('militia', 2, 3), E('priest', 0, 4)], rooms: [{ id: 'bone', cells: [19, 20, 21] }, { id: 'altar', cells: [26, 27] }] }); checkFight(f, '침입자 ' + kind + s); if (f.timeline.some(e => e.type === 'cast' && e.u === 'e1')) done = true; } ok(done, kind + ' 가 스킬을 못 썼다'); });
Object.keys(L.SK).forEach(id => { ok(casts[id] > 0, '한 번도 안 쓰인 스킬 ' + id); ok(fxs[id] > 0, '연출 사건이 없는 스킬 ' + id); });

// 4. 준비: 사기, 합치기, 팔기, 다시 뽑기, 넓히기
{
  const R = L.newRun(99, { taste: true }); ok(R.gold === L.K.start.gold && L.view(R).shop.length === 5 && L.view(R).roomOffer.length === 3 && L.view(R).enemy.length === 6, '새 판의 모양');
  R.shop = ['biter', 'biter', 'biter', 'maw', 'gazer']; R.gold = 20; ok(L.buy(R, 0).ok && L.buy(R, 1).ok, '사기'); ok(Object.keys(R.unit).length === 2, '둘을 샀다');
  const m = L.buy(R, 2); ok(m.ok && m.merged.length === 1 && Object.keys(R.unit).length === 1 && R.unit[Object.keys(R.unit)[0]].star === 2, '셋이면 2성으로 합쳐진다'); ok(R.gold === 17, '값을 치렀다');
  for (let k = 0; k < 2; k++) { R.shop = ['biter', 'biter', 'biter', null, null]; R.gold = 9; L.buy(R, 0); L.buy(R, 1); L.buy(R, 2); }
  const u3 = Object.keys(R.unit).map(id => R.unit[id]); ok(u3.length === 1 && u3[0].star === 3, '2성 셋이면 3성');
  ok(L.sellValue(u3[0]) === 9, '3성 1값 권속은 9에 팔린다'); const g = R.gold; ok(L.sell(R, u3[0].uid).ok && R.gold === g + 9 && !Object.keys(R.unit).length, '팔기');
  R.gold = 1; ok(!L.reroll(R).ok, '진액이 없으면 다시 못 뽑는다'); R.gold = 5; const before = R.shop.join(); ok(L.reroll(R).ok && R.gold === 3 && R.shop.length === 5 && R.shop.every(x => x), '다시 뽑기');
  R.gold = 30; R.xp = 0; const lv = R.level; L.buyXp(R); L.buyXp(R); ok(R.level === lv + 1 && R.xp === 2, '경험을 사면 둥지가 넓어진다 ' + R.level + '/' + R.xp);
  R.shop = ['shell', 'gazer', 'hood', 'gnaw', 'biter']; for (let i = 0; i < 5; i++) L.buy(R, i); R.shop = ['tangle', 'brood', null, null, null]; L.buy(R, 0);
  ok(!L.buy(R, 1).ok || R.bench.filter(x => x).length <= 6, '대기석은 여섯');
  const ids = R.bench.filter(x => x); ok(!L.move(R, ids[0], { cell: 5 }).ok && !L.move(R, ids[0], { cell: 32 }).ok, '침입자 쪽과 본체 칸에는 못 세운다');
  let placed = 0; [18, 19, 20, 21, 22, 23].forEach((c, i) => { if (ids[i] && L.move(R, ids[i], { cell: c }).ok) placed++; }); ok(placed === L.cap(R), '세울 수 있는 수는 둥지 레벨 + 1 (' + placed + '/' + L.cap(R) + ')');
  ok(L.move(R, R.board[18], { cell: 24 }).ok && !R.board[18] && R.board[24], '판 위에서 옮기기'); const a = R.board[19], b = R.board[20]; ok(L.move(R, a, { cell: 20 }).ok && R.board[20] === a && R.board[19] === b, '서로 바꾸기');
  const v = L.view(R); ok(v.placed === L.cap(R) && v.board.every(x => x.name && x.skill && x.short), '판 보기');
  // 방 타일
  const o = v.roomOffer[0]; ok(o.spots.length > 0 && !L.canPlaceRoom(R, o.id, 0) && !L.canPlaceRoom(R, o.id, 32), '방은 둥지 쪽 빈 줄에만'); ok(L.placeRoom(R, 0, o.spots[0]).ok && R.rooms.length === 1 && !R.roomOffer.length, '방 놓기'); ok(!L.placeRoom(R, 0, o.spots[0]).ok, '한 라운드에 방 하나');
  const r = L.ready(R); ok(r.ok && r.fight && typeof r.win === 'boolean' && (R.round === 2 || R.phase === 'over'), '싸우면 다음 라운드로'); if (R.phase === 'prep') { ok(L.view(R).roomOffer.length === 3 && !L.view(R).roomOffer.some(x => x.id === o.id), '다음 라운드의 방 셋 (놓은 방은 빼고)'); ok(R.gold >= L.K.income, '수입'); }
  const R2 = L.newRun(5, { taste: true }); L.ready(R2); L.ready(R2); if (R2.phase === 'prep') L.ready(R2); ok(R2.phase === 'over' && R2.over && !R2.over.win && !L.ready(R2).ok, '아무것도 안 세우면 진다');
}
// 5. 시너지
{
  const s0 = L.synOf(['shell', 'shell', 'gazer', 'biter']); ok(s0.abyss.n === 1 && s0.abyss.tier === 0 && s0.guard.n === 1 && !s0.abyss.core, '같은 권속은 한 번만 센다');
  const s = L.synOf(['shell', 'tangle', 'shell', 'gazer']); ok(s.abyss.n === 3 && s.abyss.core && s.abyss.tier === 1 && s.guard.n === 2 && s.guard.core && s.guard.tier === 1 && !s.nebula.core && s.nebula.n === 1, '본체는 제 모습의 성향과 종류에 하나로 든다');
  { const ks = L.KIN_IDS.filter(k => !L.KIN[k].gen), top = {}; for (let m = 0; m < 1 << ks.length; m++) { const set = ks.filter((k, i) => m >> i & 1); if (set.length > 7) continue; const so = L.synOf(set); L.SYN_IDS.forEach(id => { top[id] = Math.max(top[id] || 0, so[id].tier); }); } L.SYN_IDS.forEach(id => ok(top[id] === 2, '일곱 안에서 닿을 수 없는 시너지 단계: ' + id)); }
  ok(L.synOf(['shell', 'tangle', 'maw', 'heap']).guard.tier === 2 && L.synOf(['biter', 'brood', 'mother']).brood.tier === 2 && L.synOf(['biter', 'brood']).brood.tier === 1 && L.synOf(['gazer', 'heap']).nebula.tier === 2 && L.synOf(['gazer', 'heap', 'shell', 'tangle', 'maw']).nebula.tier === 1, '단계'); ok(L.formOf(['shell', 'tangle', 'gazer']) === 'abyss' && L.formOf(['shell', 'gazer']) === 'drop', '본체의 모습은 가장 많이 모은 성향');
  const hp = t => sim({ nest: [N('shell', 20)], inv: [E('militia', 2, 2)], syn: t }).units.find(u => u.id === 'k20').mhp; ok(hp({ guard: 1 }) > hp({}) * 1.25, '수문장 시너지가 체력을 올린다');
  const f = sim({ nest: [N('biter', 20), N('gnaw', 21)], inv: [E('archer', 0, 2), E('militia', 2, 2)], syn: { hunter: 1 } }); ok(f.timeline.some(e => e.type === 'move' && e.anim === 'leap' && e.u === 'k20'), '사냥꾼이 뒷줄로 뛰어든다'); ok(f.timeline.some(e => e.type === 'synergy' && e.id === 'hunter'), '시너지 사건');
  const m0 = sim({ nest: [N('gazer', 26)], inv: [E('militia', 2, 2)], syn: { caller: 1 } }).units.find(u => u.id === 'k26'); ok(m0.mana > 0, '부르는 것은 마나를 채우고 시작한다');
  const sp = sim({ seed: 2, round: 2, nest: [N('biter', 20)], inv: [E('knight', 2, 2), E('militia', 2, 3), E('archer', 0, 2)], syn: { brood: 1 } }); ok(sp.timeline.some(e => e.type === 'synergy' && e.id === 'brood') && sp.timeline.some(e => e.type === 'spawn' && e.kind === 'spawn'), '번식: 죽으면 새끼');
}
// 6. 방
{
  const inv = [E('militia', 2, 1), E('militia', 2, 2), E('militia', 2, 3), E('hound', 1, 0)], rm = (id, cells) => [{ id, cells }], fx = (f, room, kind) => f.timeline.some(e => e.type === 'roomfx' && e.room === room && e.kind === kind);
  ok(fx(sim({ nest: [N('shell', 20, 2), N('heap', 21, 2)], inv, rooms: rm('pool', [19, 20, 21]) }), 'pool', 'wet') || fx(sim({ seed: 9, nest: [N('shell', 26, 2)], inv, rooms: rm('pool', [18, 19, 20]) }), 'pool', 'wet'), '고인 물이 적을 적신다');
  let sporeOk = false, eyeOk = false, nurseOk = false, goldOk = false; for (let s = 1; s <= 12; s++) {
    const a = sim({ seed: s, nest: [N('gazer', 31, 2), N('hood', 30, 2)], inv, rooms: rm('spore', [18, 19, 20]) }); if (fx(a, 'spore', 'infect')) sporeOk = true;
    const b = sim({ seed: s, nest: [N('gazer', 31, 2)], inv, rooms: rm('eye', [18, 19]) }); if (fx(b, 'eye', 'gaze') && b.timeline.some(e => e.type === 'hit' && e.sk === 'eye' && e.san > 0)) eyeOk = true;
    const c = sim({ seed: s, round: 2, nest: [N('biter', 20)], inv: [E('knight', 2, 2), E('militia', 2, 3), E('archer', 0, 3)], rooms: rm('nursery', [20, 21]) }); if (fx(c, 'nursery', 'hatch') && c.timeline.filter(e => e.type === 'spawn').length >= 2) nurseOk = true;
    const d = sim({ seed: s, nest: [N('maw', 20, 2), N('famine', 21, 2)], inv, rooms: rm('digest', [20, 21]) }); if (d.gold > 0 && d.gold <= 6 && fx(d, 'digest', 'gold')) goldOk = true;
  }
  ok(sporeOk, '포자밭이 감염시킨다'); ok(eyeOk, '벽의 눈이 정신을 깎는다'); ok(nurseOk, '알집에서 새끼가 나온다'); ok(goldOk, '소화굴이 진액을 낸다');
  const first = f => f.timeline.find(e => e.type === 'hit' && e.u === 'k20' && e.k === 'atk'), one = [E('knight', 2, 2)]; const h0 = first(sim({ nest: [N('shell', 20)], inv: one })), h1 = first(sim({ nest: [N('shell', 20)], inv: one, rooms: rm('bone', [19, 20, 21]) })); ok(h0 && h1 && h1.dmg < h0.dmg * 0.8, '뼈 울타리가 피해를 줄인다');
  const ct = f => { const e = f.timeline.find(x => x.type === 'cast' && x.u === 'k26'); return e ? e.t : 99; }; ok(ct(sim({ nest: [N('gazer', 26), N('shell', 20, 3)], inv, rooms: rm('altar', [26, 27]) })) < ct(sim({ nest: [N('gazer', 26), N('shell', 20, 3)], inv })), '기도 자리에서 마나가 빨리 찬다');
  const sh = sim({ nest: [N('biter', 20)], inv: one, rooms: rm('shade', [20, 21]) }), fh = sh.timeline.find(e => e.type === 'hit' && e.by === 'k20' && e.k === 'atk'); ok(fh && fh.crit === 1 && sh.timeline.some(e => e.type === 'roomfx' && e.room === 'shade'), '그늘에서 시작한 사냥꾼의 첫 공격은 치명타');
}
// 7. 광기와 되돌림, 감염체, 삼킴
{
  let mad = false, turn = false, cl = false, rise = false, sw = false, echo = false;
  for (let s = 1; s <= 25; s++) {
    const f = sim({ seed: s, round: 2, nest: [N('hood', 26, 2), N('gazer', 27, 2), N('heap', 20, 2), N('shell', 21, 2)], inv: [E('militia', 2, 1), E('militia', 2, 2), E('militia', 2, 3), E('priest', 0, 2), E('knight', 2, 4)], syn: { nebula: 1, dusk: 1 } });
    const mads = f.timeline.filter(e => e.type === 'mad'); if (mads.length) { mad = true; const id = mads[0].u, t0 = mads[0].t; if (f.timeline.some(e => e.type === 'attack' && e.u === id && e.t > t0 && /^e/.test(e.tg))) turn = true; }
    if (f.timeline.some(e => e.type === 'cleanse')) { cl = true; const c = f.timeline.find(e => e.type === 'cleanse'); ok(c.sn > 0, '되돌아온 것은 정신이 조금 남는다'); }
    if (f.timeline.some(e => e.type === 'synergy' && e.id === 'dusk' && e.fx === 'echo')) echo = true;
    const g = sim({ seed: s, round: 1, nest: [N('mother', 26, 2), N('maw', 20, 2)], inv: [E('militia', 2, 1), E('militia', 2, 2), E('militia', 2, 3), E('hound', 1, 0), E('hound', 1, 5)] });
    if (g.timeline.some(e => e.type === 'spawn' && e.kind === 'infected')) rise = true; if (g.timeline.some(e => e.type === 'die' && e.how === 'swallow')) sw = true;
  }
  ok(mad, '정신이 바닥나면 미친다'); ok(turn, '미친 적은 제 편을 친다'); ok(cl, '사제가 미친 것을 되돌린다'); ok(echo, '황혼: 미치면 곁의 정신이 깎인다'); ok(rise, '감염된 적이 죽으면 감염체로 일어난다'); ok(sw, '해구의 입이 삼킨다');
  const bossy = sim({ seed: 4, round: 3, nest: [N('hood', 26, 3), N('gazer', 27, 3), N('heap', 20, 3)], inv: [E('seeker', 1, 2)], syn: { nebula: 2 } }); ok(!bossy.timeline.some(e => e.type === 'mad' && e.u === 'e1'), '책을 쫓는 자는 미치지 않는다');
}
// 8. 책을 쫓는 자가 방을 읽어 지운다
{
  let erased = false; for (let s = 1; s <= 6 && !erased; s++) { const f = sim({ seed: s, round: 3, nest: [N('shell', 20, 3), N('heap', 21, 3), N('maw', 19, 2)], inv: [E('seeker', 1, 2), E('knight', 2, 3)], rooms: [{ id: 'bone', cells: [19, 20, 21] }, { id: 'altar', cells: [26, 27] }] }); if (f.timeline.some(e => e.type === 'roomfx' && e.kind === 'erase') && f.rooms.some(r => r.erased) && f.timeline.some(e => e.type === 'skillfx' && e.sk === 'read' && e.fx === 'read')) erased = true; }
  ok(erased, '방이 읽혀 지워진다');
}
// 9. 화면에 쓰는 글: 짧은 줄은 16자 안
{
  const len = (s, w) => ok(typeof s === 'string' && s.length > 0 && s.length <= 16, '짧은 글이 16자를 넘는다: ' + w + ' 「' + s + '」');
  Object.keys(L.SK).forEach(id => [1, 2, 3].forEach(l => { const i = L.skillInfo(id, l); len(i.short, id); ok(i.name && i.more, id + ' 설명'); }));
  L.KIN_IDS.forEach(k => [1, 2, 3].forEach(s => { const i = L.unitInfo(k, s); len(i.short, k); ok(i.skill && i.aspName && i.clsName, k + ' 정보'); })); L.INV_IDS.forEach(k => [1, 2, 3].forEach(r => { const i = L.invInfo(k, r); len(i.short, k); ok(i.skill && i.role, k + ' 정보'); }));
  L.ROOM_IDS.forEach(id => len(L.roomInfo(id).short, id)); L.SYN_IDS.forEach(id => L.SYN[id].short.forEach(s => len(s, id))); Object.keys(L.FORM).forEach(f => ok(L.formInfo(f, 2).skill && L.formInfo(f).name, f + ' 모습'));
  const banned = /!|인간|괜찮|그래[.,]|해 봐|돋운/; const all = JSON.stringify([L.SK, L.ROOM, L.SYN, L.KIN, L.INV, L.FORM].map(t => Object.keys(t).map(k => [t[k].name, t[k].more, t[k].role]))); ok(!banned.test(all), '문체에 어긋나는 낱말');
}
// 9-2. 역할: 모두에게 역할과 닿는 칸 글이 있고, 싸움 기록에도 실린다. 탱커는 막은 몫을 남긴다
{
  L.KIN_IDS.forEach(k => { const i = L.unitInfo(k, 1); ok(L.ROLE[i.role] && i.roleName && /^(근접|원거리) \d칸$/.test(i.reach), k + ' 역할'); ok((i.role === 'ranged' || i.role === 'support') === (i.range > 1) || i.role === 'support', k + ' 역할과 닿는 칸이 어긋난다'); });
  L.INV_IDS.forEach(k => { const i = L.invInfo(k, 2); ok(L.ROLE[i.role] && i.roleName && /^(근접|원거리) \d칸$/.test(i.reach), k + ' 역할'); });
  const f = sim({ seed: 4, round: 2, nest: [N('shell', 20, 2), N('gazer', 31)], inv: [E('militia', 2, 2), E('militia', 2, 3), E('archer', 0, 2), E('knight', 2, 1)] });
  ok(f.units.every(u => u.core || L.ROLE[u.role]), '처음 모습에 역할이 없다'); ok(f.timeline.some(e => e.type === 'hit' && e.blk > 0 && (e.u === 'k20' || /^e/.test(e.u))), '탱커가 막은 몫이 없다');
  const first = id => { const e = f.timeline.find(x => x.type === 'attack' && x.u === id); return e ? e.t : 99; }; ok(first('k31') >= L.K.pace.back, '뒷줄이 한 박자 늦게 쏘지 않는다');
}

// ───────── 온전한 판 (3막 x 5라운드) ─────────
const F0 = L.K.full, clone = o => JSON.parse(JSON.stringify(o));
// 판을 자동 플레이어로 민다. until(R) 이 참이 되면 멈춘다. hook(r, R, before) 는 싸움마다 불린다
function drive(R, until, st, hook) {
  const S = { s: (R.seed | 0) + 5 }, rng = () => L.rnd(S); st = st || B.FSTRAT.decent;
  for (let g = 0; g < 500 && R.phase !== 'over' && !(until && until(R)); g++) {
    if (R.phase === 'choice') B.pickChoice(R, st, rng); else if (R.phase === 'mythos') B.pickMythos(R, st, rng); else if (R.phase === 'encounter') B.playEncounter(R, st, rng);
    else { B.placeRooms(R, st, rng); B.shopFull(R, st, rng); B.arrangeFull(R, st, rng); const before = { round: R.round, fear: R.fear, gold: R.gold, hp: R.hp, elite: R.elite }, r = L.ready(R); if (hook) hook(r, R, before); }
  }
  return R;
}
// 권속을 곧바로 판에 올린다 (검사용)
function put(R, list) { const cells = [20, 21, 19, 22, 26, 27, 25, 28, 18, 23, 24, 29]; R.board = {}; R.unit = {}; R.bench = [null, null, null, null, null, null]; list.forEach((x, i) => { const uid = R.nextUid++, k = Array.isArray(x) ? x[0] : x; R.unit[uid] = { uid, kind: k, star: Array.isArray(x) ? x[1] : 1 }; R.board[cells[i]] = uid; }); return R; }
const STRONG = [['maw', 3], ['shell', 3], ['heap', 3], ['famine', 3], ['hollow', 3], ['rift', 3], ['queen', 3], ['ink', 3], ['bell', 3]];

// 11. 짜임: 15라운드, 막마다 넷 + 우두머리, 지면 목숨이 깎이고 우두머리는 다시 온다
const fullLog = { fights: 0, rewards: 0, enc: 0, tsum: new Array(15).fill(0), tn: new Array(15).fill(0), wins: {} };
{
  const R = L.newRun(77), v = L.view(R);
  ok(v.mode === 'full' && v.rounds === 15 && v.acts === 3 && v.per === 5 && v.act === 1 && v.rin === 1 && v.hp === F0.life && v.gold === F0.gold && v.level === 3, '새 판의 모양 (온전한 판)');
  ok(L.ACTS[0].rounds[0].some(p => p.name === v.roundName) && v.preview.length > 3 && v.enemy.length >= 4 && v.enemy.every(e => e.will >= 1 && e.hp > 0 && e.cell < 18), '첫 라운드의 침입자와 미리 보기');
  ok(v.mythos.phase === 0 && v.mythos.next === 2 && v.mythos.offer === null && v.awaken.step === 0 && v.awaken.fear === 0 && v.awaken.max === F0.fearMax && v.cast.length === 3 && v.stats.length === 4 && v.choice === null && v.encounter === null, '새 판의 신화, 공포, 조사자');
  for (let act = 1; act <= 3; act++) for (let rin = 1; rin <= 5; rin++) for (let s = 0; s < 4; s++) {
    const Q = L.newRun(100 + s), p = L.partyOf(Q, act, rin), cells = p.base.units.map(u => u.cell);
    ok(p.base.name && cells.every(c => c >= 0 && c < 18) && new Set(cells).size === cells.length && p.base.units.every(u => L.INV[u.kind]), '무리의 자리 ' + act + '-' + rin);
    ok((rin === 3) === !!p.alt, '정예는 셋째 라운드에만 ' + act + '-' + rin); if (p.alt) ok(p.alt.units.length > p.base.units.length && p.alt.units.every(u => (u.mul || 1) >= F0.eliteMul - 0.31) && /^정예 /.test(p.alt.name), '정예 무리가 더 세다');
    if (rin === 5) ok(p.base.units.some(u => (act === 1 ? u.kind === 'seeker' : act === 2 ? u.kind === 'paladin' : u.kind === 'seekerm')) && p.base.name === L.ACTS[act - 1].boss.name, '막의 우두머리 ' + act);
    ok(p.base.units.length >= (act === 1 ? 5 : 7) && p.base.units.length <= 16, '무리의 크기 ' + act + '-' + rin + ' = ' + p.base.units.length);
  }
  // 지면 살아남은 적만큼 목숨이 깎인다
  const Q = L.newRun(3), n = Q.enemy.length, r = L.ready(Q); ok(r.ok && !r.win && r.lost === Math.min(F0.lossMax, F0.lossBase[0] + Math.ceil(r.fight.survivors * F0.lossPer)) && Q.hp === F0.life - r.lost && r.fight.survivors <= n && r.fight.survivors > 0, '진 값 ' + r.lost);
  ok(Q.round === 2 && Q.phase === 'mythos' && !L.ready(Q).ok, '진 뒤에는 고를 것 없이 다음 라운드 (둘째 라운드 앞은 신화 단계)');
  // 우두머리에게 지면 같은 우두머리가 다시 온다
  const Z = L.newRun(9); Z.round = 5; Z.rin = 5; Z.mythos.phase = 1; const p = L.partyOf(Z, 1, 5); Z.enemy = p.base.units; Z.enemyName = p.base.name; Z.alt = null; const rz = L.ready(Z);
  ok(rz.boss && !rz.win && Z.round === 5 && Z.rin === 5 && Z.retry === 1 && rz.lost >= F0.lossBase[0] + F0.bossLoss && Z.phase === 'prep' && Z.enemy.some(u => u.kind === 'seeker'), '우두머리는 이길 때까지 다시 온다');
  // 끝까지: 마지막 우두머리를 이기면 판이 끝난다
  const W = put(L.newRun(21), STRONG); W.level = 8; W.round = 15; W.act = 3; W.rin = 5; W.mythos.phase = 3; W.awake = 3; W.form = 'abyss'; const pw = L.partyOf(W, 3, 5); W.enemy = pw.base.units.map(u => Object.assign({}, u, { mul: 0.2 })); W.enemyName = pw.base.name; const rw = L.ready(W);
  ok(rw.win && W.phase === 'over' && W.over.win && rw.next === 'over' && !L.ready(W).ok, '3막의 우두머리를 이기면 끝난다');
  // 여러 전략으로 끝까지: 싸움마다 사건 줄을 검사한다
  ['decent', 'random', 'dusk', 'brood', 'nebula', 'noecon'].forEach((nm, k) => { for (let s = 1; s <= 2; s++) {
    const Rn = L.newRun(s * 7919 + 13 + k); let last = 0;
    drive(Rn, null, B.FSTRAT[nm], (r, R1, b) => {
      checkFight(r.fight, 'full ' + nm + '#' + s + 'r' + r.round); fullLog.fights++; fullLog.tsum[r.round - 1] += r.fight.time; fullLog.tn[r.round - 1]++;
      ok(r.round >= last && r.round <= 15 && r.act === Math.ceil(r.round / 5) && r.rin === (r.round - 1) % 5 + 1 && r.boss === (r.rin === 5), '라운드와 막 ' + r.round); last = r.round;
      ok(r.win ? r.fear.delta >= 0 && r.fear.delta <= 2 : r.fear.delta <= 0 && r.fear.delta >= -1, '공포는 이기면 오르고 지면 조금 내린다 ' + r.fear.delta); ok(r.zealots === (r.win ? Math.min(F0.zealMax, r.fight.madLeft) : 0), '미친 채 살아남은 적이 광신도로 돌아온다');
      if (R1.phase === 'over') return;
      ok(R1.gold === b.gold + r.income, '수입이 들어온다'); ok(r.income === r.econ.total + r.fight.gold + r.bossGold + r.eliteBonus && r.eliteBonus === (r.elite && r.win ? F0.eliteBonus[r.act - 1] : 0) && r.eliteHeal >= 0 && r.eliteHeal <= (r.elite && r.win ? F0.eliteHeal[r.act - 1] : 0) && R1.hp === b.hp - r.lost + r.eliteHeal, '수입의 셈과 목숨');
      if (R1.choice) { const types = R1.choice.opts.map(o => o.type); ok(r.win, '진 싸움 뒤에는 고를 것이 없다');
        if (r.boss) ok(R1.choice.kind === 'boss' && r.bossGold === F0.bossGold[r.act - 1] && types.every(t => t === 'room' || t === 'unit') && types.includes('unit'), '우두머리 뒤: 진액과 방 / 2성 권속');
        else if (r.elite) ok(R1.choice.kind === 'elite' && types.includes('unit') && types.includes('gold') && R1.choice.opts.find(o => o.type === 'unit').star === 2, '정예 뒤: 2성 권속 / 진액 / 방');
        else { ok(R1.choice.kind === 'reward' && types.every(t => ['room', 'gold', 'encounter'].includes(t)) && types.includes('gold') && types.length <= 3, '보통 라운드 뒤: 방 / 진액 / 조우'); fullLog.rewards++; if (types.includes('encounter')) fullLog.enc++; }
      } else ok(!r.win || r.boss && r.act === 3, '이긴 싸움 뒤에는 고를 것이 있다');
    });
    ok(Rn.phase === 'over' && Rn.over, nm + ' 판이 끝나지 않았다'); if (Rn.over.win) { fullLog.wins[nm] = (fullLog.wins[nm] || 0) + 1; ok(Rn.hist[Rn.hist.length - 1].boss && Rn.hist[Rn.hist.length - 1].act === 3 && Rn.hp > 0, '이긴 판의 마지막 싸움'); } else ok(Rn.hp === 0, '진 판은 목숨이 0');
    const my = Rn.picks.filter(p => p.kind === 'mythos').map(p => p.round); ok(my.every((r, i) => r === F0.mythosAt[i]) && my.length === F0.mythosAt.filter(r => r <= Rn.round).length, '신화 단계는 라운드 2/7/12 에 ' + my.join(','));
    ok(L.view(Rn).hist.length === Rn.fights && JSON.stringify(Rn).length > 100, '끝난 판 보기');
  } });
  ok(fullLog.rewards > 20 && fullLog.enc / fullLog.rewards > 0.25 && fullLog.enc / fullLog.rewards < 0.75, '조우는 둘에 한 번쯤 (' + fullLog.enc + '/' + fullLog.rewards + ')');
}
// 12. 살림: 이자 (10마다 +1, 5까지), 연승·연패, 라운드 경험, 레벨 8, 값 1~5 의 상점 확률, 다시 뽑기 2, 경험 4
{
  const R = L.newRun(31); R.gold = 34; ok(L.econOf(R, true).interest === 3 && L.econOf(R, true).base === F0.income && L.econOf(R, true).win === F0.winGold && L.econOf(R, false).win === 0, '이자는 10마다 1'); R.gold = 99; ok(L.econOf(R, true).interest === 5, '이자는 5까지');
  R.gold = 0; R.streak = 2; ok(L.econOf(R, true).streak === F0.streak[3] && L.econOf(R, true).total === F0.income + F0.streak[3] + F0.winGold, '연승'); R.streak = -3; ok(L.econOf(R, false).streak === F0.streak[4] && L.econOf(R, true).streak === 0, '연패, 그리고 끊긴 연패');
  const v = L.view(R); ok(v.econ.per === 10 && v.econ.nextAt === 10 && v.econ.ifWin.total > 0 && v.econ.ifLoss.total > 0 && v.streak === -3 && v.costs.reroll === 2 && v.costs.xp === 4 && v.xpRound === F0.xpRound && v.maxLv === 8, '보기: 살림');
  Object.keys(F0.odds).forEach(l => ok(F0.odds[l].length === 5 && F0.odds[l].reduce((a, b) => a + b, 0) === 100, '상점 확률의 합 ' + l)); ok(F0.odds[3][3] === 0 && F0.odds[3][4] === 0 && F0.odds[8][4] > 0 && v.odds === F0.odds[3] && v.oddsTable === F0.odds, '레벨이 올라야 4값과 5값이 나온다');
  R.gold = 999; let ups = 0; for (let k = 0; k < 60 && L.buyXp(R).ok; k++) ups++; ok(R.level === 8 && !L.buyXp(R).ok && ups === Math.ceil((6 + 10 + 18 + 28 + 40) / 4), '레벨은 8까지 (' + R.level + ', ' + ups + '번)'); ok(L.cap(R) === 9, '레벨 8 이면 아홉을 세운다');
  const seen = {}; for (let k = 0; k < 60; k++) { L.reroll(R); R.shop.forEach(x => { seen[L.KIN[x].cost] = 1; }); } ok([1, 2, 3, 4, 5].every(c => seen[c]), '레벨 8 상점에는 값 1~5 가 다 나온다');
  const Q = L.newRun(32); for (let k = 0; k < 40; k++) { Q.gold = 9; L.reroll(Q); ok(Q.shop.every(x => L.KIN[x].cost <= 3), '레벨 3 상점에는 3값까지만'); }
  const X = L.newRun(33), x0 = X.xp; L.ready(X); ok(X.xp === x0 + F0.xpRound || X.level > 3, '라운드마다 경험');
}
// 13. 권속 스물, 침입자, 불려 나오는 것
{
  ok(L.KIN_IDS.length === 20, '권속은 스물'); [1, 2, 3, 4, 5].forEach(c => ok(L.KIN_IDS.filter(k => L.KIN[k].cost === c).length >= 2, c + '값 권속이 둘 이상'));
  L.ASPS.forEach(a => ok(L.KIN_IDS.filter(k => L.KIN[k].asp === a).length === 4, a + ' 권속은 넷')); L.CLSS.forEach(c => ok(L.KIN_IDS.filter(k => L.KIN[k].cls === c).length >= 4, c + ' 권속은 넷 이상'));
  L.KIN_IDS.filter(k => L.KIN[k].gen).forEach(k => ok(L.KIN[L.KIN[k].art] && !L.KIN[L.KIN[k].art].gen && L.unitInfo(k, 1).art === L.KIN[k].art, k + ' 의 빌린 그림')); ok(L.KIN_IDS.filter(k => L.KIN[k].gen).length === 8 && L.unitInfo('shell', 1).art === 'shell', '새 권속 여덟');
  ['crossbow', 'banner', 'tracker', 'templar', 'exorcist', 'alchemist', 'seekerm'].concat(L.CAST_IDS.map(c => L.CAST[c].kind)).forEach(k => ok(L.INV[k] && L.INV[L.INV[k].art] && !L.INV[L.INV[k].art].art && L.invInfo(k, 1).art === L.INV[k].art, k + ' 의 빌린 그림'));
  ['brute', 'cultist', 'possessed', 'zealot'].forEach(k => ok(L.SUMMON[k] && L.SUMMON[k].art, k + ' 가 없다'));
  const T = L.newRun(8, { taste: true }); for (let k = 0; k < 40; k++) { T.gold = 9; L.reroll(T); ok(T.shop.every(x => !L.KIN[x].gen), '맛보기 판에는 새 권속이 안 나온다'); }
  // 굴의 여왕이 죽은 권속을 되살린다
  let rev = false; for (let s = 1; s <= 10 && !rev; s++) { const f = sim({ seed: s, round: 2, nest: [N('queen', 26, 2), N('biter', 20), N('gnaw', 21)], inv: [E('knight', 2, 2), E('militia', 2, 3), E('militia', 2, 1), E('archer', 0, 2), E('mage', 0, 3)] }); checkFight(f, '되살림'); if (f.timeline.some(e => e.type === 'spawn' && e.revive && /^k/.test(e.u) && e.hp > 0)) rev = true; } ok(rev, '굴의 여왕이 되살린다');
}
// 14. 시너지 (온전한 판): 성향 2/4/5, 종류 2/4. 깨어난 본체가 제 성향에 하나로 든다
{
  const R = L.newRun(41), syn = ks => L.synOf(ks, R);
  ok(syn(['shell', 'tangle']).abyss.tier === 1 && syn(['shell', 'tangle', 'maw']).abyss.tier === 1 && syn(['shell', 'tangle', 'maw', 'ink']).abyss.tier === 2 && !syn(['shell', 'tangle']).abyss.core, '성향 문턱 2/4');
  ok(syn(['shell', 'heap']).guard.tier === 1 && syn(['shell', 'heap', 'maw', 'bell']).guard.tier === 2 && syn(['gazer', 'hood', 'orbit']).caller.tier === 1 && syn(['gazer', 'hood', 'orbit', 'ink']).caller.tier === 2, '종류 문턱 2/4');
  R.awake = 1; R.form = 'abyss'; const s5 = syn(['shell', 'tangle', 'maw', 'ink']); ok(s5.abyss.n === 5 && s5.abyss.core && s5.abyss.tier === 3 && !s5.guard.core && s5.guard.n === 2 && syn(['shell']).abyss.tier === 1, '깨어난 본체는 제 성향에만 든다');
  R.mythos.picked = ['deepbell', 'gatething']; const sp = syn(['shell']); ok(sp.abyss.n === 3 && sp.abyss.plus === 1 && sp.guard.n === 2 && sp.guard.tier === 1, '신화가 시너지 수를 더한다'); R.mythos.picked = [];
  L.SYN_IDS.forEach(id => { const i = L.synInfo(id, 9); ok(i.need === L.SYN[id].full && i.tier === i.need.length && i.next === null && i.shorts.length === i.need.length, id + ' 시너지 보기'); ok(L.synInfo(id, 2, true).need === L.SYN[id].need, id + ' 맛보기 문턱'); });
  const fhit = t => { const f = sim({ seed: 3, scale: { hp: 1, atk: 1, san: 1 }, nest: [N('shell', 20)], inv: [E('knight', 2, 2)], rooms: [{ id: 'pool', cells: [14] }], syn: { abyss: t } }); return [f.timeline.find(e => e.type === 'hit' && e.u === 'k20' && e.k === 'atk').dmg, f.timeline.filter(e => e.type === 'hit' && e.by === 'k20' && e.k === 'atk').slice(1, 4).reduce((a, e) => a + e.dmg, 0)]; }, a0 = fhit(0), a1 = fhit(1), a3 = fhit(3);
  ok(a1[0] < a0[0] && a3[0] < a1[0] && a1[1] > a0[1] * 1.05 && a3[1] > a1[1] * 1.1 && L.synInfo('abyss', 5).shorts.length === 3 && L.synInfo('abyss', 5).short === L.SYN.abyss.fullShort[2] && L.synInfo('abyss', 4, true).short === L.SYN.abyss.short[1] && L.SYN.abyss.fullShort.every(x => x.length <= 16), '온전한 판의 심연: 덜 단단하고, 젖은 적이 더 다친다 ' + a0 + ' ' + a1 + ' ' + a3);
  const hit = t => { const f = sim({ seed: 3, nest: [N('shell', 20)], inv: [E('knight', 2, 2)], syn: { abyss: t } }); return f.timeline.find(e => e.type === 'hit' && e.u === 'k20' && e.k === 'atk').dmg; }; ok(hit(3) < hit(2) && hit(2) < hit(1), '심연 3단계가 더 단단하다');
}
// 15. 신화: 권능과 대가
const BO_TESTED = {};
{
  const ids = L.MYTHOS_IDS, KEYS = ['syn', 'bo', 'extra', 'now', 'cap', 'interestCap', 'freeRoll', 'xpRound', 'winGold', 'third', 'mergeGold', 'income', 'rerollCost', 'xpCost', 'lossMore', 'shopUp', 'invHp', 'invAtk', 'invSan', 'bossUp', 'eliteForce', 'coreHp', 'coreAtk', 'coreMana', 'coreRange'];
  ok(ids.length >= 36, '신화는 서른여섯 이상'); [1, 2, 3].forEach(t => ok(ids.filter(i => L.MYTHOS[i].tier === t).length >= 12, L.TIERN[t] + ' 이 열둘 이상')); L.ASPS.forEach(a => ok(ids.filter(i => L.MYTHOS[i].asp === a).length >= 6, a + ' 신화가 여섯 이상'));
  ok(new Set(ids.map(i => L.MYTHOS[i].cat)).size >= 6 && new Set(ids.map(i => L.MYTHOS[i].name)).size === ids.length, '신화의 갈래와 이름');
  // 권능만, 대가만 따로 넣어도 판의 무엇인가가 달라진다
  const base = L.newRun(51); put(base, ['shell', 'gazer', 'biter', 'hood']); base.round = 5; base.rin = 5; base.gold = 55;
  const print = R => { const S = L.setupOf(R), p = L.partyOf(clone(R), 1, 3), pb = L.partyOf(clone(R), 1, 5), sy = L.synOf(['shell'], R); return JSON.stringify([L.scaleOf(R), L.coreOf(R), L.cap(R), L.econOf(R, true), L.view(R).costs, L.view(R).odds, L.view(R).xpRound, S.boons, p.base.units.length, pb.base.units.map(u => u.mul || 1), L.SYN_IDS.map(i => sy[i].n), R.gold, R.roomOffer.length, !!L.modOf(R).third, L.modOf(R).mergeGold || 0, !!L.modOf(R).freeRoll, L.modOf(R).lossMore || 0, L.modOf(R).eliteForce || 0]); }, p0 = print(base);
  ids.forEach(id => {
    const c = L.MYTHOS[id], i = L.cardInfo(id);
    ok(c.name && L.ASPN[c.asp] && c.tier >= 1 && c.tier <= 3 && c.cat && c.more && c.more.length > 12 && i.tierName === L.TIERN[c.tier] && i.power === c.power && i.price === c.price, id + ' 의 모양');
    ok(c.power.length <= 16 && c.price.length <= 16 && /\d|공짜|않는다|없이|폭발|버틴다|고정|6뿐|늘 온다/.test(c.power) && c.price.length >= 4, id + ' 의 짧은 글 「' + c.power + '」「' + c.price + '」');
    Object.keys(c.pw).concat(Object.keys(c.pr)).forEach(k => ok(KEYS.includes(k), id + ' 의 모르는 열쇠 ' + k)); Object.keys(Object.assign({}, c.pw.bo, c.pr.bo)).forEach(b => { BO_TESTED[b] = BO_TESTED[b] || 0; });
    ['pw', 'pr'].forEach(side => { L.MYTHOS._t = { name: 't', tier: 1, asp: c.asp, pw: side === 'pw' ? c.pw : {}, pr: side === 'pr' ? c.pr : {} }; const Q = clone(base); Q.mythos.picked = ['_t']; if (c[side].now) { Q.mythos.offer = ['_t']; Q.mythos.picked = []; Q.phase = 'mythos'; Q.round = 7; Q.mythos.phase = 1; L.mythosPick(Q, 0); Q.round = 5; Q.awake = 0; Q.form = 'drop'; Q.rin = 5; } ok(print(Q) !== p0, id + ' 의 ' + (side === 'pw' ? '권능' : '대가') + '이 아무것도 바꾸지 않는다'); delete L.MYTHOS._t; });
  });
  // 흐름: 둘째 라운드 앞에 셋을 보여 주고, 한 번 통째로 다시 보고, 하나를 고르면 본체가 깨어난다
  const R = drive(L.newRun(52), Q => Q.phase === 'mythos'), v = L.view(R).mythos;
  ok(R.round === 2 && v.phase === 0 && v.offer.length === 3 && new Set(v.offer.map(c => c.id)).size === 3 && v.offer.every(c => c.tier === v.tier && c.name && c.power && c.price && c.more && c.aspName) && v.rerollLeft === 1 && v.tierName === L.TIERN[v.tier], '신화 단계의 셋');
  ok(!L.ready(R).ok && !L.buy(R, 0).ok && !L.choose(R, 0).ok, '신화 단계에서는 고르기 전에 다른 일을 못 한다');
  const first = v.offer.map(c => c.id), rr = L.mythosReroll(R), v2 = L.view(R).mythos; ok(rr.ok && v2.offer.length === 3 && v2.offer.every(c => !first.includes(c.id) && c.tier === v.tier) && v2.rerollLeft === 0 && !L.mythosReroll(R).ok, '한 번 통째로 다시 본다');
  const card = v2.offer[1], pk = L.mythosPick(R, 1), v3 = L.view(R); ok(pk.ok && pk.picked.id === card.id && v3.mythos.phase === 1 && v3.mythos.next === 7 && v3.mythos.offer === null && v3.mythos.picked.length === 1 && v3.awaken.step === 1 && v3.awaken.form === card.asp && v3.form.step === 1 && v3.form.form === card.asp && R.phase === 'prep' && !L.mythosPick(R, 0).ok, '고르면 본체가 한 단계 깨어난다 (' + card.name + ')');
  // 본체의 모습은 고른 신화의 성향을 따른다. 같으면 가진 권속이 무거운 쪽
  const mk = (picked, offer, kin) => { const Q = put(L.newRun(53), kin); Q.round = 12; Q.act = 3; Q.rin = 2; Q.mythos = { phase: 2, tier: 3, offer: [offer], picked, seen: [], rerollLeft: 1 }; Q.phase = 'mythos'; L.mythosPick(Q, 0); return Q; };
  ok(mk(['deepbell', 'starseat'], 'secondheart', ['gazer', 'heap']).form === 'abyss', '많이 고른 성향이 모습이 된다'); const tie = mk(['starseat', 'oldclutch'], 'secondheart', ['biter', 'brood', 'mother']); ok(tie.form === 'brood' && tie.awake === 3 && L.coreOf(tie).t2 && L.coreOf(tie).lv === 3 && L.view(tie).form.t2 === L.EVO.brood.t2 && L.view(tie).form.name === L.EVO.brood.names[1], '같으면 가진 권속이 무거운 쪽, 3단계에서 스킬이 달라진다');
  const c0 = L.coreOf(L.newRun(54)), c1 = (() => { const Q = L.newRun(54); Q.awake = 2; Q.form = 'dusk'; return L.coreOf(Q); })(); ok(c0.lv === 1 && c1.lv === 2 && c1.hp > c0.hp * 1.3 && c1.atk > c0.atk * 1.2 && !c1.t2, '깨어날수록 본체가 세진다');
  let wide = false; for (let s = 1; s <= 6 && !wide; s++) { const t2 = sim({ seed: s, form: 'abyss', round: 2, core: { lv: 3, hp: 2, atk: 1.5, t2: true }, nest: [N('shell', 20, 3)], inv: [E('militia', 2, 1), E('archer', 0, 2), E('knight', 2, 3), E('hound', 1, 0), E('rogue', 1, 5)] }); if (t2.timeline.some(e => e.type === 'skillfx' && e.sk === 'tide' && e.rows.length === 6)) wide = true; } ok(wide, '3단계의 해일은 판 전체에 미친다');
  // 단계의 등급: 셋이 다 나오고, 처음에는 속삭임이 가장 흔하다. 공포가 높으면 현현이 는다
  const tiers = fear => { const n = [0, 0, 0, 0]; for (let s = 1; s <= 240; s++) { const Q = L.newRun(s * 31); Q.round = 2; Q.fear = fear; L.settle(Q); n[Q.mythos.tier]++; } return n; }, t0 = tiers(0), t9 = tiers(18);
  ok(t0[1] > t0[2] && t0[2] > t0[3] && t0[3] > 5 && t9[3] > t0[3] * 1.8, '단계의 등급 ' + t0.slice(1).join('/') + ' → 공포가 차면 ' + t9.slice(1).join('/'));
  const W = L.newRun(55); W.round = 7; W.mythos.phase = 1; W.mythos.offer = ['wallhears', 'usury', 'eyelids']; W.mythos.tier = 2; W.phase = 'mythos'; const g0 = W.gold; ok(L.mythosPick(clone(W), 1).gains.some(g => g.type === 'gold' && g.amt === 15) && (() => { const Q = clone(W), r = L.mythosPick(Q, 0); return r.gains.filter(g => g.type === 'room').length === 2 && Q.roomOffer.length === 2 && L.view(Q).roomOffer.length === 2; })(), '고를 때 한 번 얻는 것 (진액, 방)');
  const E3 = L.newRun(56); E3.mythos.picked = ['bigbiter']; const pe = L.partyOf(E3, 1, 3); E3.alt = pe.alt; E3.elite = true; ok(!L.setElite(E3, false).ok && L.view(E3).elite.forced && L.setElite(E3, true).ok, '대가: 정예를 물릴 수 없다');
  const T3 = put(L.newRun(57), []); T3.mythos.picked = ['thirdborn']; T3.gold = 50; for (let k = 0; k < 3; k++) { T3.shop = ['biter', 'biter', 'biter', null, null]; L.buy(T3, 0); L.buy(T3, 1); L.buy(T3, 2); } const us = Object.keys(T3.unit).map(i => T3.unit[i]); ok(us.length === 2 && us.some(u => u.star === 3) && us.some(u => u.star === 2 && u.kind === 'biter') && T3.merges.some(m => m.gift) && T3.merges.every(m => m.gold === 4) && T3.gold === 50 - 9 + 4 * T3.merges.length, '셋째: 합칠 때마다 진액, 3성이 되면 2성 하나를 더 얻는다');
  const FR = L.newRun(58); FR.mythos.picked = ['rummage']; FR.freeRoll = true; const fg = FR.gold; ok(L.view(FR).costs.reroll === 0 && L.reroll(FR).ok && FR.gold === fg && L.reroll(FR).ok && FR.gold === fg - 2 && L.econOf(FR, true).base === F0.income - 1, '뒤적이는 손: 첫 다시 뽑기 공짜, 수입 −1');
  const LM = L.newRun(59); LM.mythos.picked = ['usury', 'deeproot']; const rl = L.ready(LM); ok(rl.lost === Math.min(F0.lossMax + 2, F0.lossBase[0] + Math.ceil(rl.fight.survivors * F0.lossPer) + 2), '대가: 지면 목숨을 더 잃는다');
  // 싸움 안의 깃발: 저마다 눈에 보이는 일을 한다
  const inv6 = [E('militia', 2, 1), E('militia', 2, 2), E('knight', 2, 3), E('hound', 1, 0), E('archer', 0, 2), E('priest', 0, 3)], nest4 = [N('shell', 20, 2), N('biter', 21, 2), N('gazer', 26, 2), N('hood', 27, 2)];
  const fb = (bo, o) => sim(Object.assign({ seed: 6, round: 2, nest: nest4, inv: inv6, boons: bo, boonBy: Object.keys(bo).reduce((a, k) => { a[k] = 'card'; return a; }, {}) }, o || {})), f0 = fb({}), unit = (f, id) => f.units.find(u => u.id === id), bev = (f, id) => f.timeline.some(e => e.type === 'boon' && e.id === id && e.fx !== 'on');
  const any = (bo, id, o, n) => { for (let s = 1; s <= (n || 14); s++) { const f = fb(bo, Object.assign({ seed: s }, o || {})); checkFight(f, '깃발 ' + id); if (bev(f, id)) return f; } return null; }, T = (id, c) => { BO_TESTED[id] = 1; ok(c, '신화의 깃발이 돌지 않는다: ' + id); };
  ok(fb({ thick: 0.12 }).timeline.some(e => e.type === 'boon' && e.id === 'thick' && e.fx === 'on' && e.card === 'card'), '깃발이 켜졌다는 사건');
  T('thick', unit(fb({ thick: 0.12 }), 'k20').mhp === Math.round(unit(f0, 'k20').mhp * 1.12)); T('kinWeak', unit(fb({ kinWeak: 0.1 }), 'k20').mhp === Math.round(unit(f0, 'k20').mhp * 0.9));
  const fh = (f, by) => f.timeline.find(e => e.type === 'hit' && e.by === by && e.k === 'atk'); T('sharp', fh(fb({ sharp: 0.5 }), 'k21').dmg > fh(f0, 'k21').dmg * 1.3);
  T('firstfree', fb({ firstfree: 1 }).units.filter(u => /^k/.test(u.id)).every(u => u.mana === u.mmana) && unit(f0, 'k20').mana === 0);
  const ct = f => f.timeline.find(e => e.type === 'cast' && e.u === 'k21').t; T('manaFast', ct(fb({ manaFast: 0.5 })) < ct(f0));
  T('hatchstart', fb({ hatchstart: 2 }).timeline.filter(e => e.type === 'spawn' && e.kind === 'spawn' && e.t === 0).length === 2);
  const sp = f => f.timeline.find(e => e.type === 'spawn' && e.kind === 'spawn').mhp; T('spawnplus', sp(fb({ hatchstart: 1, spawnplus: 0.6 })) > sp(fb({ hatchstart: 1 })) * 1.5);
  const weak = { nest: [N('biter', 20), N('gnaw', 21), N('gazer', 26)], inv: [E('knight', 2, 2), E('militia', 2, 3), E('militia', 2, 1), E('archer', 0, 2), E('mage', 0, 4), E('rogue', 1, 5)] };
  const es = any({ eggsac: 1 }, 'eggsac', weak); T('eggsac', es && es.timeline.some(e => e.type === 'spawn' && e.kind === 'spawn'));
  const ls = any({ laststand: 2 }, 'laststand', weak), lse = ls ? ls.timeline.filter(e => e.type === 'boon' && e.id === 'laststand' && e.fx !== 'on') : []; T('laststand', lse.length === 2 && new Set(lse.map(e => e.u)).size === 2 && lse.every(e => ls.timeline.some(x => x.type === 'heal' && x.u === e.u && x.t === e.t)));
  T('firstblood', any({ firstblood: 0.15 }, 'firstblood')); T('corefeed', any({ corefeed: 0.04 }, 'corefeed', { inv: inv6.concat([E('rogue', 1, 5), E('mage', 0, 1)]), nest: [N('shell', 20, 3), N('famine', 21, 3)] }));
  const mad = { round: 1, nest: [N('hood', 26, 3), N('gazer', 27, 3), N('heap', 20, 3), N('bell', 21, 3)], inv: [E('militia', 2, 1), E('militia', 2, 2), E('militia', 2, 3), E('priest', 0, 2), E('knight', 2, 4), E('exorcist', 0, 4)], syn: { nebula: 1, dusk: 1 } };
  T('madstrong', any({ madstrong: 0.35 }, 'madstrong', mad)); T('madburst', any({ madburst: 0.3 }, 'madburst', { round: 2, nest: [N('hood', 26, 2), N('gazer', 27, 2), N('heap', 20, 3), N('shell', 21, 3)], inv: [E('militia', 2, 1), E('militia', 2, 2), E('militia', 2, 3), E('knight', 2, 4), E('knight', 2, 0), E('paladin', 1, 2), E('archer', 0, 1), E('mage', 0, 4)], syn: { nebula: 1, dusk: 1 } }, 30)); const km = any({ keepMad: 1 }, 'keepMad', mad, 30); T('keepMad', km && !km.timeline.some(e => e.type === 'cleanse'));
  T('sanfrenzy', Math.abs(unit(fb({ sanfrenzy: 0.15 }), 'e1').msan - unit(f0, 'e1').msan * 0.85) <= 1); T('wetall', fb({ wetall: 0.25 }).timeline.filter(e => e.type === 'status' && e.st === 'wet' && e.t === 0 && e.on).length === 6); T('stunstart', fb({ stunstart: 1.5 }).timeline.filter(e => e.type === 'status' && e.st === 'stun' && e.t === 0 && e.dur === 1.5).length === 6);
  T('vamp', fb({ vamp: 0.15 }).timeline.some(e => e.type === 'heal' && e.u === 'k21' && e.by === 'k21') && !f0.timeline.some(e => e.type === 'heal' && e.u === 'k21' && e.by === 'k21'));
  const rd0 = (bo, s) => sim({ seed: s, round: 3, nest: [N('shell', 20, 3), N('heap', 21, 3), N('maw', 19, 3)], inv: [E('seeker', 1, 2), E('knight', 2, 3)], rooms: [{ id: 'bone', cells: [19, 20, 21] }, { id: 'altar', cells: [26, 27] }, { id: 'shade', cells: [28, 29] }], boons: bo }), rd = bo => { for (let s = 1; s <= 8; s++) { const f = rd0(bo, s); if (firstRead(f) >= 0) return f; } return rd0(bo, 1); }, firstRead = f => { const e = f.timeline.find(x => x.type === 'skillfx' && x.sk === 'read'); return e ? f.timeline.filter(x => x.type === 'roomfx' && x.kind === 'erase' && x.t === e.t).length : -1; };
  T('noErase', rd({ noErase: 1 }).rooms.every(r => !r.erased) && rd({}).rooms.some(r => r.erased)); T('readPlus', firstRead(rd({})) === 1 && firstRead(rd({ readPlus: 1 })) === 2);
  const onRoom = bo => fh(sim({ seed: 4, nest: [N('biter', 20, 2)], inv: [E('knight', 2, 2)], rooms: [{ id: 'bone', cells: [19, 20, 21] }], boons: bo }), 'k20').dmg; T('roomplus', onRoom({ roomplus: 0.5 }) > onRoom({}) * 1.3);
  const el = bo => { const f = sim({ seed: 4, nest: [N('biter', 20, 2)], inv: [E('paladin', 2, 2)], boons: bo }); return f.timeline.find(e => e.type === 'hit' && e.u === 'e1' && e.k === 'atk').dmg; }; T('giant', el({ giant: 0.5 }) > el({}) * 1.3);
  // 판정 깃발은 16번에서 본다
}
// 16. 공포 판정: 침입자가 둥지의 것에 처음 닿을 때 한 번, 본체와 5값 권속의 스킬이 떨어질 때 한 번
{
  const CK = F0.check, CKall = Object.assign({}, CK, { contact: 99, moment: 99 }), base = { round: 2, check: CK, nest: [N('shell', 20, 3), N('heap', 21, 3), N('gazer', 26, 2), N('rift', 27, 2)], inv: [E('militia', 2, 1), E('militia', 2, 2), E('knight', 2, 3), E('hound', 1, 0), E('archer', 0, 2), E('priest', 0, 3), E('paladin', 2, 4)] };
  const will = { e1: 1, e2: 1, e3: 2, e4: 1, e5: 1, e6: 3, e7: 4 }; let froze = 0, shaken = 0, held = 0, skill = 0, total = 0, rerolled = 0;
  for (let s = 1; s <= 12; s++) {
    const f = sim(Object.assign({ seed: s }, base)); checkFight(f, '판정#' + s); const cs = f.timeline.filter(e => e.type === 'check'), contact = cs.filter(e => e.why === 'contact'), per = {}; total += cs.length;
    contact.forEach(e => { per[e.u] = (per[e.u] || 0) + 1; }); ok(Object.keys(per).every(u => per[u] === 1 && /^e/.test(u)), '침입자마다 닿을 때의 판정은 한 번');
    const casts = f.timeline.filter(e => e.type === 'cast' && (e.u === 'core' || e.u === 'k27')).length; ok(cs.length - contact.length <= casts && contact.length <= CK.contact && cs.length - contact.length <= CK.moment && cs.length >= 2 && f.checks === cs.length, '판정은 닿을 때 ' + CK.contact + '번, 큰 스킬에 ' + CK.moment + '번까지 (' + cs.length + ')');
    cs.forEach(e => {
      ok(e.dice.length === will[e.u] && e.dice.every(x => x >= 1 && x <= 6 && x === Math.floor(x)) && e.face === 5 && e.need === 2 && e.ok === e.dice.filter(x => x >= 5).length && e.res === (e.ok === 0 ? 'froze' : e.ok === 1 ? 'shaken' : 'held') && e.san >= 0 && e.by && e.reroll === -1, '판정 사건의 모양 ' + JSON.stringify(e));
      if (e.res === 'held') { held++; ok(e.san === 0, '버티면 정신을 잃지 않는다'); } else if (e.res === 'shaken') shaken++; else { froze++; if (e.u !== 'e7' && f.timeline.some(x => x.type === 'die' && x.u === e.u && x.t === e.t) === false && !f.timeline.some(x => x.type === 'mad' && x.u === e.u && x.t === e.t)) ok(f.timeline.some(x => x.type === 'status' && x.st === 'stun' && x.u === e.u && x.t === e.t && x.dur === CK.stun), '얼어붙으면 잠깐 멎는다'); }
      if (e.why === 'skill') { skill++; ok(e.sk, '스킬 판정에는 스킬 이름이 실린다'); }
      if (e.san > 0) ok(f.timeline.some(x => x.type === 'hit' && x.u === e.u && x.sk === 'check' && x.san === e.san && x.t === e.t), '판정으로 잃은 정신이 타격 사건에도 실린다');
    });
  }
  ok(froze > 5 && shaken > 3 && held > 0 && skill > 3 && total >= 40 && total <= 72, '판정의 결과가 고루 나온다 ' + [froze, shaken, held, skill].join('/'));
  ok(!sim(Object.assign({ seed: 1 }, base, { check: null })).timeline.some(e => e.type === 'check') && sim(Object.assign({ seed: 1 }, base, { check: null })).checks === 0, '맛보기 판에는 판정이 없다');
  const dice = o => { const n = {}; for (let s = 1; s <= 4; s++) sim(Object.assign({ seed: s }, base, { check: CKall }, o)).timeline.filter(e => e.type === 'check').forEach(e => { n[e.u] = e.dice.length; n.face = e.face; if (e.reroll >= 0) rerolled++; }); return n; };
  const dn = dice({ syn: { nebula: 2 } }); ok(dn.e7 === 3 && dn.e6 === 2 && dn.e1 === 1, '성운 2단계: 주사위 하나를 덜 굴린다 (적어도 하나)'); const dd = dice({ boons: { dieless: 1 } }); BO_TESTED.dieless = 1; ok(dd.e7 === 3 && dd.e3 === 1, '신화: 주사위 −1');
  BO_TESTED.six = 1; ok(dice({ boons: { six: 1 } }).face === 6, '신화: 성공은 6뿐'); BO_TESTED.invWill = 1; ok(dice({ boons: { invWill: 1 } }).e7 === 5, '의지 +1');
  const de = dice({ rooms: [{ id: 'eye', cells: [18, 19] }] }); ok(de.e7 === 3 || de.e3 === 1, '벽의 눈의 줄과 그 앞줄에서는 주사위 하나를 덜 굴린다 ' + JSON.stringify(de)); rerolled = 0; dice({ syn: { dusk: 2 } }); ok(rerolled > 0, '황혼 2단계: 성공한 주사위 하나를 다시 굴린다');
  const fz = o => { let d = 0, sn = 0; for (let s = 1; s <= 6; s++) { const f = sim(Object.assign({ seed: s }, base, { check: CKall }, o)); f.timeline.filter(e => e.type === 'check' && e.res === 'froze' && e.u === 'e1').forEach(e => { sn = Math.max(sn, e.san); const st = f.timeline.find(x => x.type === 'status' && x.st === 'stun' && x.u === e.u && x.t === e.t); if (st) d = Math.max(d, st.dur); }); } return [d, sn]; }, z0 = fz({}), z1 = fz({ boons: { awe: 1, dread: 0.6 } });
  BO_TESTED.awe = 1; BO_TESTED.dread = 1; ok(z0[0] === CK.stun && z1[0] === CK.stun + 1 && z1[1] > z0[1] * 1.4, '신화: 더 오래 얼어붙고 정신을 더 잃는다 ' + z0 + ' → ' + z1);
  L.INV_IDS.forEach(k => ok(L.INV[k].will >= 1 && L.INV[k].will <= 4 && L.invInfo(k, 1).will === L.INV[k].will, k + ' 의 의지'));
  Object.keys(BO_TESTED).forEach(b => ok(BO_TESTED[b] === 1, '검사하지 않은 싸움 깃발 ' + b));
}
// 17. 조우: 고르고, 주사위를 굴리고, 진액으로 다시 굴리고, 끝맺는다
{
  const GK = ['gold', 'unit', 'room', 'fear', 'life', 'xp', 'curse', 'cult', 'omen', 'zeal'], banned = /!|\?|괜찮|그래[.,]|해 봐|~|ㅋ|잖아|거든/;
  ok(L.ENC_IDS.length >= 24, '조우는 스물넷 이상');
  L.ENC_IDS.forEach(id => {
    const d = L.ENC[id]; ok(d.title && d.title.length <= 12 && (d.text.match(/다\./g) || []).length >= 2 && (d.text.match(/다\./g) || []).length <= 4 && !banned.test(d.text + d.title), id + ' 의 글'); ok(d.ch.length >= 2 && d.ch.length <= 3 && d.ch.some(c => c.stat) && new Set(d.ch.map(c => c.id)).size === d.ch.length, id + ' 의 고를 것');
    d.ch.forEach(c => { ok(c.label && c.label.length <= 10 && c.ok && c.ok[0] && !banned.test(c.ok[0]) && (c.stat ? L.STAT[c.stat] && c.need >= 1 && c.need <= 3 && c.no && c.no[0] && !banned.test(c.no[0]) : !c.no), id + '.' + c.id + ' 의 모양'); [c.ok, c.no].filter(x => x).forEach(o => { Object.keys(o[1]).forEach(k => ok(GK.includes(k), id + '.' + c.id + ' 의 모르는 얻는 것 ' + k)); if (o[1].curse) ok(L.CURSE[o[1].curse], '모르는 저주'); ok(typeof L.gainText(o[1]) === 'string', '얻는 것의 글'); }); });
  });
  const open = (seed, id, kin) => { const R = put(L.newRun(seed), kin || ['shell', 'gazer', 'hood', 'biter']); R.round = 3; R.rin = 3; R.mythos.phase = 1; R.choice = { kind: 'reward', opts: [{ type: 'gold', amt: 6 }, { type: 'encounter', id }] }; R.phase = 'choice'; R.gold = 30; return R; };
  const R = open(61, 'envoy'), cv = L.view(R).choice; ok(cv.opts[1].type === 'encounter' && cv.opts[1].name === L.ENC.envoy.title && L.choose(R, 1).ok && R.phase === 'encounter' && !L.ready(R).ok && !L.buy(R, 0).ok, '조우를 고르면 조우로 들어간다');
  const ev = L.view(R).encounter; ok(ev.id === 'envoy' && ev.title && ev.text && ev.choices.length === 3 && ev.choices[0].test.stat === 'menace' && ev.choices[0].test.dice === L.nestStat(R, 'menace') && ev.choices[0].test.need === 2 && ev.choices[0].hint.includes('진액 +14') && ev.choices[2].test === null && ev.choices[2].cost === 3 && ev.roll === null && ev.pick === null, '조우 보기');
  ok(!L.encounterResolve(R).ok && !L.encounterReroll(R).ok && !L.encounterChoose(R, 'nope').ok, '고르기 전에는 끝맺지 못한다');
  // 실패한 주사위만 다시 굴린다. 값은 2, 3, 4 로 오른다
  let failSeen = false, winSeen = false, loseSeen = false;
  for (let s = 1; s <= 40; s++) {
    const Q = open(600 + s, 'envoy', ['shell', 'gazer', 'hood', 'biter', 'maw', 'famine']); L.choose(Q, 1); const n = L.nestStat(Q, 'menace'), g0 = Q.gold; let r = L.encounterChoose(Q, 'cow');
    ok(r.ok && r.roll.dice.length === n && r.roll.need === 2 && r.roll.successes === r.roll.dice.filter(x => x >= 5).length && r.roll.statName === '위압' && !L.encounterChoose(Q, 'eat').ok, '굴린 주사위');
    if (r.roll.successes < 2) { failSeen = true; ok(r.canReroll && r.rerollCost === F0.rerollBase, '모자라면 다시 굴릴 수 있다'); let cost = F0.rerollBase, spent = 0;
      for (let k = 0; k < 3 && r.canReroll; k++) { const kept = r.roll.dice.filter(x => x >= 5).length, before = r.roll.dice.slice(); r = L.encounterReroll(Q); spent += cost; cost++; ok(r.ok && Q.gold === g0 - spent && r.roll.successes >= kept && before.every((x, i) => x < 5 || r.roll.dice[i] === x) && (r.roll.successes >= 2 ? r.rerollCost === 0 && !r.canReroll : r.rerollCost === cost), '다시 굴리기 ' + k); }
      if (r.roll.successes >= 2) ok(!L.encounterReroll(Q).ok, '넘었으면 더 굴리지 않는다'); }
    const g1 = Q.gold, res = L.encounterResolve(Q); ok(res.ok && res.success === (r.roll.successes >= 2) && res.outcomeText && Q.encounter === null && Q.phase === 'prep' && L.view(Q).encounter === null, '끝맺기');
    if (res.success) { winSeen = true; ok(Q.gold === g1 + 14 && res.gains[0].type === 'gold' && res.gains[0].amt === 14, '이기면 얻는다'); } else { loseSeen = true; ok(Q.gold === g1 - 4 && res.gains[0].amt === -4, '지면 잃는다'); }
  }
  ok(failSeen && winSeen && loseSeen, '조우의 세 갈래를 다 보았다');
  const P = open(62, 'envoy'); L.choose(P, 1); P.gold = 2; ok(!L.encounterChoose(P, 'pay').ok && L.view(P).encounter.choices[2].can === false, '값을 치를 진액이 없으면 못 고른다'); P.gold = 9; const f0 = P.fear = 3; const rp = L.encounterChoose(P, 'pay'); ok(rp.ok && rp.roll === null && !rp.canReroll && P.gold === 6 && L.encounterResolve(P).success && P.fear === f0 - 2 && P.omen === 2, '판정 없는 선택');
  // 모든 조우의 모든 갈래가 탈 없이 끝난다
  L.ENC_IDS.forEach(id => L.ENC[id].ch.forEach(c => [6, 1].forEach(face => { if (!c.stat && face === 1) return; const Q = open(63, id); L.choose(Q, 1); Q.bench = [null, null, null, null, null, null]; const r = L.encounterChoose(Q, c.id); if (!r.ok) { ok(false, id + '.' + c.id + ' 을 고를 수 없다'); return; } if (Q.encounter.roll) Q.encounter.roll.dice = Q.encounter.roll.dice.map(() => face).concat([face, face]); const res = L.encounterResolve(Q), o = face === 6 ? c.ok : c.no; ok(res.ok && res.success === (face === 6) && res.outcomeText === o[0] && res.gains.length >= Object.keys(o[1]).filter(k => k !== 'room').length && Q.phase === 'prep' && L.view(Q).gold >= 0 && Q.hp >= 1 && Q.fear >= 0, id + '.' + c.id + ' 의 결과');
    if (o[1].curse) ok(Q.curses.some(x => x.id === o[1].curse) && L.view(Q).curses.length === 1, '저주가 걸린다'); if (o[1].cult) ok(Q.cult === o[1].cult && L.setupOf(Q).zealots >= o[1].cult, '광신도가 는다'); if (o[1].omen) ok(Q.omen === o[1].omen && L.setupOf(Q).boons.dieless === 1, '징조: 판정 주사위 −1'); if (o[1].unit) ok(Object.keys(Q.unit).some(i => Q.unit[i].star === o[1].unit[1] && L.KIN[Q.unit[i].kind].cost === o[1].unit[0] && Q.bench.includes(+i)), '권속을 얻는다'); if (o[1].room) ok(Q.roomOffer.length === o[1].room, '방 타일을 얻는다'); })));
  // 득실: 늘 정답인 갈래도, 고를 까닭이 없는 갈래도, 주사위가 많아도 손해인 갈래도 없다. 주사위가 많을수록 낫다
  { const tb = B.encTable(); ok(tb.length === L.ENC_IDS.reduce((a, id) => a + L.ENC[id].ch.length, 0) && tb.every(r => !r.flag), '조우의 갈래 득실: ' + tb.filter(r => r.flag).map(r => r.title + ' ' + r.label + ' ' + r.flag).join(', '));
    tb.forEach(r => { ok(r.ev.length === 4 && r.ev[3] >= r.ev[0] && (r.p ? r.p[3] > r.p[0] && r.ok > r.no && r.ev[3] > 0 : r.ev[0] === r.ev[3]), r.title + ' ' + r.label + ' 의 기대값 ' + r.ev.join('/')); }); }
  // 저주는 싸움 둘 동안 간다
  const C = put(L.newRun(64), ['shell']); C.curses = [{ id: 'watched', left: 2 }, { id: 'hungry', left: 2 }, { id: 'sealed', left: 2 }, { id: 'debt', left: 1 }]; const C0 = L.newRun(64);
  ok(L.scaleOf(C).atk > L.scaleOf(C0).atk * 1.1 && L.setupOf(C).boons.kinWeak === 0.1 && L.coreOf(C).manaCut === -30 && L.econOf(C, true).base === F0.income - 2, '저주 넷의 효과'); L.ready(C); ok(C.curses.length === 3 && C.curses.every(c => c.left === 1), '저주가 줄어든다');
  const s0 = L.nestStat(put(L.newRun(65), []), 'whisper'), s1 = L.nestStat(put(L.newRun(65), ['gazer', 'hood', 'mask']), 'whisper'); ok(s0 === 1 && s1 === 4 && L.nestStat(put(L.newRun(65), STRONG), 'menace') === 6, '둥지의 힘은 판 위의 권속에서 나온다');
}
// 18. 공포: 이기면 오르고, 문턱마다 세상이 답한다
{
  const R = L.newRun(71); ok(L.addFear(R, 5) === 5 && R.world === 0 && L.addFear(R, 1) === 1 && R.world === 1 && L.view(R).awaken.effects[0].on && !L.view(R).awaken.effects[1].on && L.view(R).awaken.next === F0.fearAt[1], '첫 문턱');
  L.addFear(R, -3); ok(R.fear === 3 && R.world === 1, '공포가 내려도 세상은 물러서지 않는다'); ok(L.addFear(R, 99) === F0.fearMax - 3 && R.world === 3 && L.view(R).awaken.next === null && L.addFear(R, -99) === -F0.fearMax && R.fear === 0, '끝과 바닥');
  const n = w => { const Q = L.newRun(72); Q.world = w; return L.partyOf(Q, 2, 1).base.units; }, n0 = n(0), n1 = n(1), n2 = n(2);
  ok(n1.length === n0.length + 1 && n1.filter(u => u.kind === L.ACTS[1].more).length === n0.filter(u => u.kind === L.ACTS[1].more).length + 1 && n2.length === n0.length + 2 && n2.some(u => u.kind === 'paladin'), '세상의 답: 무리가 는다');
  const bm = w => { const Q = L.newRun(72); Q.world = w; return L.partyOf(Q, 1, 5).base.units.find(u => u.kind === 'seeker').mul || 1; }; ok(bm(2) === 1 && Math.abs(bm(3) - 1.2) < 1e-9, '세상의 답: 우두머리가 세진다');
  L.WORLD.forEach(s => ok(s.length <= 16, '세상의 답 글'));
}
// 19. 조사자와 광신도
{
  const R = L.newRun(81), v = L.view(R).cast;
  ok(R.cast.active.length === 3 && new Set(R.cast.active).size === 3 && R.cast.active.every(id => L.CAST[id]) && v.every(c => c.name && c.role && c.will >= 1 && c.lore >= 1 && c.might >= 1 && c.skill && c.skill.name && c.hist && c.note && c.state === 'fresh' && !c.here), '조사자 셋');
  ok(L.CAST_IDS.length >= 5 && L.CAST_IDS.every(id => { const c = L.CAST[id]; return L.INV[c.kind] && L.INV[c.kind].cast === id && L.INV[c.kind].elite && /다\.$/.test(c.hist); }), '조사자의 내력');
  [1, 2, 3, 4, 5].forEach(rin => { const p = L.partyOf(clone(R), 1, rin); ok(p.cast.length === (rin === 2 || rin === 4 ? 1 : 0) && p.base.units.filter(u => u.cast).length === p.cast.length, '조사자는 둘째와 넷째 라운드에 온다 ' + rin); });
  const id = L.partyOf(clone(R), 1, 2).cast[0], w0 = L.CAST[id].will, at = (Q, act, rin) => L.partyOf(clone(Q), act, rin).base.units.find(u => u.cast === id);
  const A = clone(R); L.castAfter(A, { cast: [{ id, alive: true, mad: true, how: null }] }, 1); ok(A.cast.mem[id].state === 'mad' && A.cast.mem[id].will === w0 - 1 && A.cast.mem[id].mad === 1 && at(A, 1, 2).will === w0 - 1 && /붕대/.test(L.castInfo(A, id).note), '미쳤던 조사자는 의지 −1 로 돌아온다');
  const Bq = clone(R); L.castAfter(Bq, { cast: [{ id, alive: false, mad: false, how: 'kill' }] }, 1); ok(Bq.cast.mem[id].state === 'hurt' && at(Bq, 1, 2).mul === 0.85, '쓰러졌던 조사자는 붕대를 감고 돌아온다');
  const Cq = clone(R); L.castAfter(Cq, { cast: [{ id, alive: true, mad: false, how: null }] }, 1); ok(Cq.cast.mem[id].state === 'bold' && at(Cq, 1, 2).will === w0 + 1, '살아 돌아간 조사자는 의지 +1');
  const D = clone(R); L.castAfter(D, { cast: [{ id, alive: false, mad: false, how: 'swallow' }] }, 1); ok(D.cast.mem[id].state === 'eaten' && !at(D, 1, 2) && !at(D, 2, 4), '삼켜진 조사자는 1막과 2막에 오지 않는다');
  const d3 = [0, 1, 2].map(k => { const Q = clone(D); Q.cast.next = k; return at(Q, 3, 2); }).find(x => x), dl = at(D, 3, 5); ok(d3 && d3.poss && d3.will === 0 && Math.abs(d3.mul - 1.2) < 1e-9 && dl && dl.poss, '3막에 홀린 채로 돌아오고, 마지막 싸움에 낀다');
  L.castAfter(D, { cast: [{ id, alive: false, mad: false, how: 'kill' }] }, 3); ok(D.cast.mem[id].state === 'gone' && !at(D, 3, 5) && L.castInfo(D, id).note, '홀린 것이 쓰러지면 다시 오지 않는다');
  const kind = L.CAST[id].kind, fp = sim({ seed: 2, round: 2, check: F0.check, nest: [N('hood', 26, 3), N('gazer', 27, 3), N('heap', 20, 3)], inv: [{ kind, cell: C(2, 2), cast: id, will: 0, poss: true }, E('militia', 2, 3)], syn: { nebula: 1 } }), pu = fp.units.find(u => u.cast === id);
  ok(pu && /^홀린 /.test(pu.name) && pu.msan === 0 && pu.will === 0 && !fp.timeline.some(e => (e.type === 'mad' || e.type === 'check') && e.u === pu.id) && fp.cast.length === 1 && fp.cast[0].id === id, '홀린 조사자는 미치지 않고 판정도 하지 않는다');
  // 실제 판에서: 둘째 라운드에 조사자가 오고, 싸움 뒤에 기억이 남는다
  let seenCast = 0; for (let s = 1; s <= 3; s++) drive(L.newRun(820 + s), Q => Q.round > 4, null, (r, Q) => { if (r.cast.length) { seenCast++; const m = Q.cast.mem[r.cast[0].id]; ok(m.seen >= 1 && m.state !== 'fresh' && r.fight.units.some(u => u.cast === r.cast[0].id && u.elite), '조사자의 기억이 남는다'); } }); ok(seenCast >= 3, '조사자가 판에 나온다 (' + seenCast + ')');
  // 광신도
  const fz = sim({ seed: 1, zealots: 2, nest: [N('shell', 20)], inv: [E('militia', 2, 2)] }); ok(fz.timeline.filter(e => e.type === 'spawn' && e.kind === 'zealot' && e.t === 0 && e.side === 'nest').length === 2, '광신도가 싸움의 처음에 선다');
  const Z = L.newRun(83); Z.zealots = 1; Z.cult = 1; ok(L.setupOf(Z).zealots === 2 && L.view(Z).zealots === 2 && L.view(Z).cult === 1, '광신도의 수');
}
// 20. 정예: 켜면 더 센 무리, 이기면 더 좋은 것
{
  const R = L.newRun(91); R.round = 3; R.rin = 3; R.mythos.phase = 1; const p = L.partyOf(R, 1, 3); R.enemy = p.base.units; R.enemyName = p.base.name; R.alt = p.alt; R.elite = false;
  const v = L.view(R); ok(v.elite && !v.elite.on && !v.elite.forced && v.elite.enemy.length > v.enemy.length && v.elite.preview && v.elite.reward && /^정예 /.test(v.elite.name), '정예 보기'); ok(L.setElite(R, true).ok && L.view(R).elite.on && L.view(R).enemy.length === v.elite.enemy.length && L.view(R).roundName === v.elite.name && L.setupOf(R).inv === R.alt.units, '정예를 켠다'); ok(L.setElite(R, false).ok && L.view(R).enemy.length === v.enemy.length, '정예를 끈다');
  const N1 = L.newRun(92); ok(!L.setElite(N1, true).ok && L.view(N1).elite === null, '다른 라운드에는 정예가 없다');
  const W = put(L.newRun(93), STRONG); W.level = 8; W.round = 3; W.rin = 3; W.mythos.phase = 1; const pw = L.partyOf(W, 1, 3); W.enemy = pw.base.units; W.alt = pw.alt; L.setElite(W, true); const rw = L.ready(W), cv = L.view(W).choice;
  ok(rw.win && rw.elite && cv.kind === 'elite' && cv.opts[0].type === 'unit' && cv.opts[0].star === 2 && cv.opts[0].cost === F0.eliteUnit[0] && cv.opts[1].type === 'gold' && cv.opts[1].amt === F0.eliteGold[0] && cv.opts.every(o => ['unit', 'gold', 'room'].includes(o.type)), '정예를 이긴 뒤');
  W.bench = [null, null, null, null, null, null]; const n0 = Object.keys(W.unit).length; ok(L.choose(W, 0).ok && Object.keys(W.unit).length === n0 + 1 && W.phase === 'prep' && W.choice === null && W.picks[W.picks.length - 1].kind === 'elite', '2성 권속을 받는다');
  // 정예에게 지면 목숨을 더 잃는다
  { const El = L.newRun(97); El.round = 3; El.rin = 3; El.mythos.phase = 1; const pe = L.partyOf(El, 1, 3); El.enemy = pe.base.units; El.alt = pe.alt; L.setElite(El, true); const rwd = L.view(El).elite.reward, re = L.ready(El); ok(re.elite && !re.win && re.eliteBonus === 0 && re.lost === Math.min(F0.lossMax + F0.eliteLoss[0], F0.lossBase[0] + Math.ceil(re.fight.survivors * F0.lossPer) + F0.eliteLoss[0]) && F0.eliteLoss[0] > 0 && /더 잃는다/.test(rwd), '정예에게 진 값 ' + re.lost); }
  // 대기석이 차 있으면 권속 대신 그 값만큼 진액을 받는다 (고를 것이 막히는 일이 없다)
  const Fb = L.newRun(95); Fb.gold = 50; ['shell', 'gazer', 'hood', 'gnaw', 'tangle', 'heap'].forEach((k, i) => { Fb.shop[0] = k; L.buy(Fb, 0); }); Fb.choice = { kind: 'boss', opts: [{ type: 'unit', id: 'maw', star: 2 }] }; Fb.phase = 'choice'; const fg = Fb.gold;
  ok(Fb.bench.every(x => x) && L.view(Fb).choice.opts[0].can && L.view(Fb).choice.opts[0].asGold === 9 && L.choose(Fb, 0).ok && Fb.gold === fg + 9 && Fb.phase === 'prep' && Object.keys(Fb.unit).length === 6, '대기석이 차 있으면 진액으로 받는다');
  // 방은 막을 따라 자란다
  L.ROOM_IDS.forEach(id => { const i1 = L.roomInfo(id, 1), i3 = L.roomInfo(id, 3), i0 = L.roomInfo(id); ok(i0.short === L.ROOM[id].short && i0.lv === 1 && i3.lv === 3 && i1.short.length <= 16 && i3.short.length <= 16 && i3.more && (i3.short !== i1.short || i3.more !== i1.more) && Object.keys(L.ROOMLV).some(k => k.indexOf(id) === 0 && L.ROOMLV[k][2] > L.ROOMLV[k][0]), id + ' 방이 자라지 않는다'); });
  { const one = [E('knight', 2, 2)], fh = lv => sim({ seed: 3, roomLv: lv, nest: [N('shell', 20)], inv: one, rooms: [{ id: 'bone', cells: [19, 20, 21] }] }).timeline.find(e => e.type === 'hit' && e.u === 'k20' && e.k === 'atk').dmg; ok(fh(3) < fh(1) && fh(1) === fh(undefined), '3막의 뼈 울타리가 더 막는다');
    const Rv = L.newRun(96); Rv.rooms = [{ id: 'pool', cells: [18, 19, 20] }]; Rv.roomOffer = ['bone']; const s1 = L.view(Rv).rooms[0].short; Rv.act = 3; Rv.round = 11; ok(L.view(Rv).rooms[0].short !== s1 && L.view(Rv).rooms[0].lv === 3 && L.view(Rv).roomOffer[0].lv === 3 && L.setupOf(Rv).roomLv === 3 && L.view(L.newRun(96, { taste: true })).roomOffer[0].lv === 1, '보기: 막마다의 방 글'); }
  // 방을 고르면 놓을 때까지 들고 있는다
  const Rm = L.newRun(94); Rm.choice = { kind: 'reward', opts: [{ type: 'room', id: 'pool' }, { type: 'gold', amt: 6 }] }; Rm.phase = 'choice'; ok(L.view(Rm).choice.opts[0].spots.length > 0 && L.choose(Rm, 0).ok && Rm.roomOffer.length === 1 && L.placeRoom(Rm, 0, L.view(Rm).roomOffer[0].spots[0]).ok && Rm.rooms.length === 1 && !Rm.roomOffer.length, '고른 방을 놓는다');
}
// 21. 이어 하기: 어느 때에 갈무리해도 같은 끝에 닿는다
{
  ok(L.load('{') === null && L.load(JSON.stringify({ v: 1 })) === null && L.load(null) === null && L.SAVE_V === L.newRun(1).v, '못 읽는 갈무리');
  const stops = [Q => Q.phase === 'mythos', Q => Q.phase === 'choice' && Q.round >= 4, Q => Q.phase === 'encounter', Q => Q.phase === 'prep' && Q.round === 8, Q => Q.phase === 'mythos' && Q.round >= 12];
  stops.forEach((stop, k) => { const R = drive(L.newRun(900 + k * 17), stop), js = L.save(R), R2 = L.load(js); ok(typeof js === 'string' && R2 && JSON.stringify(R2) === JSON.stringify(R) && JSON.stringify(L.view(R2)) === JSON.stringify(L.view(R)), '갈무리와 되읽기 ' + k); if (!R2) return; drive(R, null); drive(R2, null); ok(R.phase === 'over' && JSON.stringify(R) === JSON.stringify(R2), '되읽은 판이 같은 끝에 닿는다 ' + k + ' (' + R.round + ')'); });
  const a = B.playRun(4242, 'decent'), b = B.playRun(4242, 'decent'), c = B.playRun(4243, 'decent'); ok(JSON.stringify(a.R) === JSON.stringify(b.R) && JSON.stringify(a.R) !== JSON.stringify(c.R), '같은 씨앗의 온전한 판은 같다');
}
// 22. 화면에 쓰는 글 (온전한 판)
{
  const len = (s, w) => ok(typeof s === 'string' && s.length > 0 && s.length <= 16, '짧은 글이 16자를 넘는다: ' + w + ' 「' + s + '」');
  Object.keys(L.CURSE).forEach(id => len(L.CURSE[id].short, id)); Object.keys(L.EVO).forEach(a => { len(L.EVO[a].t2, a); ok(L.EVO[a].names.length === 2 && L.EVO[a].part, a + ' 의 모습'); });
  const all = JSON.stringify([L.MYTHOS, L.ENC, L.CAST, L.CURSE, L.ACTS.map(a => [a.name, a.boss.name, a.rounds.map(v => v.map(p => p.name))]), L.EVO]); ok(!/!|인간|괜찮|그래[.,]|해 봐|돋운/.test(all), '문체에 어긋나는 낱말 (온전한 판)');
  [1, 2, 3].forEach(a => ok(L.actInfo(a).name && L.actInfo(a).boss && L.actInfo(a).rounds.length === 4, '막 보기'));
}
// 23. 균형 (짧게): 잘하는 쪽이 아무렇게나 하는 쪽보다 멀리 간다. 싸움 길이가 알맞다
{
  let d = 0, r = 0, dr = 0, rr = 0; for (let s = 1; s <= 16; s++) { const a = B.playRun(s * 7919 + 13, 'decent').R, b = B.playRun(s * 7919 + 13, 'random').R; if (a.over.win) d++; if (b.over.win) r++; dr += a.round; rr += b.round; }
  ok(d > r && dr > rr + 16 && r <= 3 && d >= 1 && d <= 11, '온전한 판 16판 중 승 ' + d + ' / ' + r + ', 닿은 라운드 ' + dr + ' / ' + rr);
  const avg = fullLog.tsum.map((x, i) => (fullLog.tn[i] ? x / fullLog.tn[i] : 0)), acts = [0, 1, 2].map(a => { let t = 0, n = 0; for (let i = a * 5; i < a * 5 + 5; i++) { t += fullLog.tsum[i]; n += fullLog.tn[i]; } return n ? t / n : 0; });
  ok(acts.every(x => x === 0 || (x >= 34 && x <= 76)), '막마다의 싸움 길이 ' + acts.map(x => x.toFixed(0)).join('/'));
  console.log('온전한 판: 싸움 ' + fullLog.fights + '번 · 막마다 길이 ' + acts.map(x => x.toFixed(0)).join('/') + '초 · 16판 승 ' + d + ' / ' + r + ' · 조우 ' + fullLog.enc + '/' + fullLog.rewards);
}
// 10. 균형 (짧게): 잘하는 쪽이 아무렇게나 하는 쪽보다 낫고, 싸움 길이가 알맞다
{
  const w = nm => { let n = 0; for (let s = 1; s <= 40; s++) if (B.playRun(s * 7919 + 13, nm, { taste: true }).R.over.win) n++; return n; }, d = w('decent'), r = w('random');
  ok(d >= 20 && d <= 34, '잘하는 쪽 승률 40판 중 ' + d); ok(r <= 10, '아무렇게나 하는 쪽 승률 40판 중 ' + r);
  const avg = tsum.map((x, i) => x / Math.max(1, tn[i])); ok(avg[0] >= 34 && avg[1] >= 45 && avg[1] <= 70 && avg[2] >= 45 && avg[2] <= 75, '싸움 길이 ' + avg.map(x => x.toFixed(0)).join('/'));
  console.log('싸움 ' + fights + '번 · 길이 ' + avg.map(x => x.toFixed(0)).join('/') + '초 · 40판 승 ' + d + ' / ' + r + ' · 스킬 ' + Object.keys(casts).length + '가지');
}
console.log(bad ? '실패 ' + bad : '둥지 전투 규칙: 모두 맞음'); process.exitCode = bad ? 1 : 0;
