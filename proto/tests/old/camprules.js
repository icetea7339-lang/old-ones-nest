// 이야기(campaign.js) 규칙 시험: 장마다 열리고, 정해진 밤이 그대로 오고, 잠금이 지켜지고, 목표를 채우면 넘기고, 본편에 열리고, 5장 선택이 7장을 바꾼다. 첫 판 순하게도.
// node tests/camprules.js
const N = require('../src/logic.js'), CM = require('../src/cardmode.js'), CP = require('../src/campaign.js'), CD = require('../src/cards2.js'), BOT = require('../src/cardbot.js');
const bad = []; const ok = (c, m) => { if (!c) { bad.push(m); console.log('실패: ' + m); } };
const kindsOf = b => b.party.map(u => u.kind).sort().join(',');

// 숨긴 적: 세상 이름 바꾸기가 훑지 않는다
ok(!Object.keys(N.INV).includes('seeker0') && !!N.INV.seeker0, '책을 쫓는 자가 숨은 칸에 있지 않다');
try { N.applyWorld('wuxia'); N.applyWorld('fantasy'); ok(true, ''); } catch (e) { ok(false, '세상 이름 바꾸기가 깨진다: ' + e.message); }
ok(CM.realName('fantasy', 'seeker1') === '책을 쫓는 자', '책을 쫓는 자의 이름');

for (const ch of CP.IDS) {
  const C = CP.CH[ch], m = CM.newMeta(), R = CP.newRun(ch, 1000 + ch, { meta: m, aspect: 'brood' });
  ok(R && R.camp && R.camp.ch === ch, ch + '장이 열리지 않는다');
  ok(R.deck.length >= C.deck.length - 2 && R.hand.length === 5, ch + '장 처음 덱·손이 이상하다 ' + R.deck.length + '/' + R.hand.length);
  ok(R.deck.every(c => CD.BY[c.id] || String(c.id).indexOf('g') === 0), ch + '장 덱에 없는 카드');
  ok(JSON.stringify(R).length > 100, ch + '장 저장이 안 된다');
  // 잠금: 보상으로 나오는 카드 종류
  const seen = new Set(); for (let k = 0; k < 40; k++) CM.openPool(R).forEach(d => seen.add(d.type));
  ok([...seen].every(t => C.types.includes(t)), ch + '장 보상에 가르치지 않은 종류가 나온다: ' + [...seen].join(','));
  // 정해진 밤: 아침에 적힌 대로 그 밤에 온다
  let checked = 0;
  for (let d = 0; d < 4 && !R.over; d++) {
    const mt = R.G.march.tonight, want = C.nights[R.G.day];
    if (want && want !== 'auto') ok(!!mt && mt.kinds && mt.kinds.length >= want.length, ch + '장 ' + R.G.day + '일 밤이 정해진 대로 아니다');
    if (!want) ok(!mt, ch + '장 ' + R.G.day + '일은 조용해야 한다');
    const exp = mt && mt.kinds ? mt.kinds.slice().sort().join(',') : null;
    const r = CM.endDay(R); const b = r.night && r.night.battle;
    if (exp) { ok(!!b && kindsOf(b) === exp, ch + '장 ' + (R.G.day - 1) + '일 밤 무리가 다르다'); checked++; }
    if (R.phase === 'reward') CM.takeReward(R, 0);
  }
  if (Object.keys(C.nights).some(k => +k <= 4)) ok(checked > 0, ch + '장 정해진 밤을 하나도 확인하지 못했다');
}
// 목표를 채우면 넘기고, 본편에 열린다
{ const m = CM.newMeta(); let R = null; for (let s = 1; s < 8 && !(R && R.over && R.over.win); s++) R = BOT.play(s * 31, 'brood', 1, '', m, null, (sd, a, meta) => CP.newRun(1, sd, { meta, aspect: a }));
  ok(R.over.win && R.over.camp && R.over.camp.win, '1장을 넘기지 못했다');
  ok(CP.campMeta(m).clear[1] === 1, '1장 넘김이 기록되지 않았다');
  ok(CP.CH[1].unlock.cards.every(id => CD.isOpen(CD.BY[id], m)), '1장을 넘겼는데 본편 카드가 안 열렸다');
  ok((m.eggs || []).some(e => e.from === 'camp1'), '1장의 알이 없다');
  ok((R.molts || []).length >= 1, '1장에서 허물을 한 번도 벗지 않았다');
  ok(CP.isOpen(m, 2) && !CP.isOpen(m, 3), '2장만 새로 열려야 한다'); }
// 목표 줄
{ const R = CP.newRun(3, 5, { meta: CM.newMeta() }), g = CP.goals(R); ok(g.some(x => x.k === 'seeker') && g.some(x => x.k === 'traps') && g.some(x => x.k === 'nights'), '3장 목표 줄'); }
// 5장 선택이 7장을 바꾼다
for (const k of ['capture', 'eat', 'release']) {
  const m = CM.newMeta(); CP.choose(m, k); const R = CP.newRun(7, 77, { meta: m, aspect: 'dusk' });
  if (k === 'capture') ok(R.deck.some(c => c.id === 'kn_fallen_r'), '붙잡으면 7장에 기록하는 자가 덱에 있어야 한다');
  if (k === 'eat') ok(R.deck.some(c => c.id === 'tr_eye_great') && (R.genome.tags['눈'] || 0) >= 1, '삼키면 7장에 눈 카드와 눈 형질');
  if (k === 'release') { R.G.day = 12; CP.morning(R); ok(R.G.march.tonight.kinds.includes('seeker2'), '놓아주면 7장 마지막 밤에 그가 돌아온다'); }
  if (k !== 'release') { R.G.day = 12; CP.morning(R); ok(!R.G.march.tonight.kinds.includes('seeker2'), k + ': 마지막 밤에 그가 오면 안 된다'); }
}
// 6장은 바늘 점이 열린다
{ const R = CP.newRun(6, 9, { meta: CM.newMeta() }); ok(R.needleOffer === true, '6장 첫날 바늘 점이 열리지 않는다'); }
// 대사: 한 번만
{ const R = CP.newRun(2, 3, { meta: CM.newMeta() }); R.G.day = 2; const a = CP.linesAt(R, 'night'), b = CP.linesAt(R, 'night'); ok(a.length > 0 && b.length === 0, '밤 대사가 한 번만 나와야 한다'); }
// 첫 판 순하게
{ const m = CM.newMeta(); ok(CM.newRun(5, { meta: m }).ease === 0.7, '첫 판이 순하지 않다'); m.runs = 1; ok(CM.newRun(5, { meta: m }).ease === 0.85, '둘째 판'); m.runs = 2; ok(CM.newRun(5, { meta: m }).ease === 1, '셋째 판부터는 보통');
  const R = CM.newRun(11, { meta: CM.newMeta() }); while (!R.G.march.tonight && R.G.day < 6) { CM.endDay(R); if (R.phase === 'reward') CM.takeReward(R, 0); }
  const d0 = R.G.detBonus; CM.nightBegin(R); ok(Math.abs(R.G.detBonus - d0 * 0.7) < 1e-9, '첫 판 밤 세기가 줄지 않았다'); CM.nightEnd(R, { battle: null, settle: null }); ok(Math.abs(R.G.detBonus - d0) < 1e-9, '첫 판 밤 세기가 되돌아오지 않았다'); }
console.log(bad.length ? '실패 ' + bad.length : '모두 통과');
process.exit(bad.length ? 1 : 0);
