// 둥지 전투 규칙 검사.  node tests/lairrules.js
const L = require('../src/lair.js'), B = require('../src/lairbot.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const C = (r, c) => L.idx(r, c);
const sim = (o) => L.simulate(Object.assign({ seed: 7, nest: [], inv: [], rooms: [], level: 3, round: 1, form: 'drop', syn: {} }, o));
const N = (kind, cell, star, uid) => ({ uid: uid || cell, kind, star: star || 1, cell });
const E = (kind, r, c) => ({ kind, cell: C(r, c) });
const TYPES = ['move', 'attack', 'hit', 'cast', 'skillfx', 'status', 'mad', 'cleanse', 'die', 'spawn', 'roomfx', 'synergy', 'heal', 'sanity', 'frenzy', 'sudden', 'win'];

// 1. 같은 씨앗이면 같은 싸움
{
  const S = { seed: 11, nest: [N('shell', 20), N('gazer', 26), N('hood', 27), N('biter', 21)], inv: [E('militia', 2, 1), E('militia', 2, 3), E('hound', 1, 0), E('torch', 2, 4)], rooms: [{ id: 'pool', cells: [19, 20, 21] }], syn: { caller: 1 } };
  const a = JSON.stringify(sim(S)), b = JSON.stringify(sim(S)), c = JSON.stringify(sim(Object.assign({}, S, { seed: 12 })));
  ok(a === b, '같은 씨앗의 싸움이 다르다'); ok(a !== c, '씨앗이 달라도 싸움이 같다');
  const r1 = B.playRun(4242, 'decent'), r2 = B.playRun(4242, 'decent'); ok(JSON.stringify(r1.R) === JSON.stringify(r2.R), '같은 씨앗의 판이 다르다');
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
  ok(wins === 1, tag + ': 끝 사건이 하나가 아니다'); ok(f.time > 2 && f.time <= 60.01, tag + ': 싸움 길이 ' + f.time);
  ok(['win', 'loss'].includes(f.result) && f.breakdown.length >= f.units.length, tag + ': 결과가 이상하다');
  // 기절한 동안에는 움직이지 않는다
  const stun = {}; f.timeline.forEach(e => { if (e.type === 'status' && e.st === 'stun') { if (e.on) stun[e.u] = e.t + e.dur; else delete stun[e.u]; } if (e.type === 'die') delete stun[e.u]; if ((e.type === 'attack' || e.type === 'cast') && stun[e.u] != null) ok(e.t >= stun[e.u] - 0.11 || e.again, tag + ': 기절한 것이 움직였다 ' + e.u + '@' + e.t); });
  // 켜진 상태는 꺼지거나, 죽거나, 싸움이 끝난다
  const on = {}; f.timeline.forEach(e => { if (e.type === 'status') { const k = e.u + ':' + e.st; if (e.on) on[k] = e.t; else { ok(on[k] != null, tag + ': 켠 적 없는 상태가 꺼졌다 ' + k); delete on[k]; } } if (e.type === 'die') Object.keys(on).forEach(k => { if (k.split(':')[0] === e.u) delete on[k]; }); });
}
['decent', 'random', 'abyss', 'nebula', 'brood', 'dusk', 'hunger', 'blob'].forEach((nm, k) => { for (let s = 1; s <= 8; s++) { const seed = s * 7919 + 13 + k; const st = B.STRAT[nm], R = L.newRun(seed), S = { s: seed }, rng = () => L.rnd(S); while (R.phase === 'prep') { B.shopping(R, st, rng); B.pickRoom(R, st, rng); B.arrange(R, st, rng); const rd = R.round, r = L.ready(R); checkFight(r.fight, nm + '#' + s + 'r' + rd); tsum[rd - 1] += r.fight.time; tn[rd - 1]++; } } });
// 본체의 모습마다, 권속의 별마다 스킬을 한 번씩
Object.keys(L.FORM).forEach(form => { const f = sim({ seed: 3, form, round: 2, nest: [N('shell', 20, 2), N('heap', 21, 2)], inv: [E('militia', 2, 1), E('militia', 2, 2), E('militia', 2, 3), E('knight', 2, 4), E('hound', 1, 0)] }); checkFight(f, '모습 ' + form); ok(f.timeline.some(e => e.type === 'cast' && e.u === 'core' && e.sk === L.FORM[form].skill), form + ' 모습의 스킬이 안 쓰였다'); });
L.KIN_IDS.forEach(kind => [1, 2, 3].forEach(star => { const f = sim({ seed: 5 + star, round: 2, nest: [N(kind, 20, star), N('shell', 21, 2)], inv: [E('knight', 2, 2), E('militia', 2, 3), E('militia', 2, 1), E('archer', 0, 4), E('priest', 0, 2)] }); checkFight(f, kind + star); ok(f.timeline.some(e => e.type === 'cast' && e.u === 'k20'), kind + ' ' + star + '성이 스킬을 못 썼다'); }));
Object.keys(L.SK).forEach(id => { ok(casts[id] > 0, '한 번도 안 쓰인 스킬 ' + id); ok(fxs[id] > 0, '연출 사건이 없는 스킬 ' + id); });

// 4. 준비: 사기, 합치기, 팔기, 다시 뽑기, 넓히기
{
  const R = L.newRun(99); ok(R.gold === L.K.start.gold && L.view(R).shop.length === 5 && L.view(R).roomOffer.length === 3 && L.view(R).enemy.length === 6, '새 판의 모양');
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
  const R2 = L.newRun(5); L.ready(R2); L.ready(R2); if (R2.phase === 'prep') L.ready(R2); ok(R2.phase === 'over' && R2.over && !R2.over.win && !L.ready(R2).ok, '아무것도 안 세우면 진다');
}
// 5. 시너지
{
  const s0 = L.synOf(['shell', 'shell', 'gazer', 'biter']); ok(s0.abyss.n === 1 && s0.abyss.tier === 0 && s0.guard.n === 1 && !s0.abyss.core, '같은 권속은 한 번만 센다');
  const s = L.synOf(['shell', 'tangle', 'shell', 'gazer']); ok(s.abyss.n === 3 && s.abyss.core && s.abyss.tier === 1 && s.guard.n === 2 && s.guard.core && s.guard.tier === 1 && !s.nebula.core && s.nebula.n === 1, '본체는 제 모습의 성향과 종류에 하나로 든다');
  { const ks = L.KIN_IDS, top = {}; for (let m = 0; m < 1 << ks.length; m++) { const set = ks.filter((k, i) => m >> i & 1); if (set.length > 7) continue; const so = L.synOf(set); L.SYN_IDS.forEach(id => { top[id] = Math.max(top[id] || 0, so[id].tier); }); } L.SYN_IDS.forEach(id => ok(top[id] === 2, '일곱 안에서 닿을 수 없는 시너지 단계: ' + id)); }
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
// 10. 균형 (짧게): 잘하는 쪽이 아무렇게나 하는 쪽보다 낫고, 싸움 길이가 알맞다
{
  const w = nm => { let n = 0; for (let s = 1; s <= 40; s++) if (B.playRun(s * 7919 + 13, nm).R.over.win) n++; return n; }, d = w('decent'), r = w('random');
  ok(d >= 20 && d <= 34, '잘하는 쪽 승률 40판 중 ' + d); ok(r <= 10, '아무렇게나 하는 쪽 승률 40판 중 ' + r);
  const avg = tsum.map((x, i) => x / Math.max(1, tn[i])); ok(avg[1] >= 22 && avg[1] <= 46 && avg[2] >= 25 && avg[2] <= 48, '싸움 길이 ' + avg.map(x => x.toFixed(0)).join('/'));
  console.log('싸움 ' + fights + '번 · 길이 ' + avg.map(x => x.toFixed(0)).join('/') + '초 · 40판 승 ' + d + ' / ' + r + ' · 스킬 ' + Object.keys(casts).length + '가지');
}
console.log(bad ? '실패 ' + bad : '둥지 전투 규칙: 모두 맞음'); process.exitCode = bad ? 1 : 0;
