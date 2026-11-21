// 카드 판의 밤은 한 번만 돈다: 화면 길(밤 앞 → 원래 게임의 밤 → 정산 → 밤 뒤)과 규칙 길(endDay)이 같은 판에서 똑같이 끝나는가.
// 허물은 달력이 아니라 한 일로 온다: 정산일(8일마다)에 원래 게임의 허물이 끼어들지 않는가, 첫 허물이 이르게 오는가. 오늘 밤 미리보기는 판을 건드리지 않는가.
// node tests/cardnight.js
const S = require('../src/logic.js'); global.NEST = S; global.TRAITS = require('../src/traits.js'); global.CARDS2 = require('../src/cards2.js'); global.GENOME = require('../src/genome.js');
const CM = require('../src/cardmode.js'), B = require('../src/cardbot.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const dig = R => JSON.stringify([R.G.day, Math.round(R.G.gold), R.G.faith, R.G.kin.map(m => m.id + ':' + m.loc + ':' + m.lv), R.G.slime.hp, R.G.slime.stage, R.hand, R.disc.length, R.phase, R.genome && R.genome.evo]);
// 1) 두 길이 같은가: 같은 판을 둘로 복사해 한쪽은 endDay, 한쪽은 화면 길로
for (let s = 1; s <= 6; s++) {
  const R = CM.newRun(s * 977 + 5, { aspect: CM.K && ['abyss', 'nebula', 'brood', 'dusk', 'hunger'][s % 5], meta: CM.newMeta(), diff: 2 });
  for (let d = 0; d < 9 && !R.G.over; d++) {
    const A = JSON.parse(JSON.stringify(R)), Bx = JSON.parse(JSON.stringify(R)); A.meta = R.meta; Bx.meta = JSON.parse(JSON.stringify(R.meta));
    CM.endDay(A, () => ({ k: 'none' }), []);
    const b = CM.nightBegin(Bx); ok(b.ok, '밤 앞이 열린다'); const it = S.beginNight(Bx.G); let r = it.next(); while (!r.done) r = it.next({ k: 'none' }); const st = S.settle(Bx.G, r.value || null); CM.nightEnd(Bx, { battle: r.value || null, settle: st }, []);
    ok(dig(A) === dig(Bx), '씨앗 ' + s + ' ' + R.G.day + '일: 두 길의 끝이 다르다');
    CM.endDay(R, () => ({ k: 'none' }), []); if (R.phase === 'reward') CM.skipReward(R); while (CM.moltPending(R)) CM.molt(R);
  }
}
// 2) 정산일에 원래 게임의 허물이 끼어들지 않는다 (진화의 정수가 모자라면 8일째·16일째에도 그대로)
{ process.env.EVON = '99999,99999,99999,99999'; delete require.cache[require.resolve('../src/genome.js')]; }
{ const R = CM.newRun(4242, { aspect: 'abyss', meta: CM.newMeta(), diff: 1 }); R.G.slime.ess.abyss = 900; let st = R.G.slime.stage;
  for (let d = 0; d < 17 && !R.G.over; d++) { CM.endDay(R, () => ({ k: 'none' }), []); if (R.phase === 'reward') CM.skipReward(R); }
  ok(R.G.slime.stage === st || R.G.over, '정산일에 원래 게임의 허물이 끼어들었다 (' + st + ' → ' + R.G.slime.stage + ')'); ok(R.G.slime.ess.abyss >= 900, '밤 동안 비운 정수가 돌아오지 않았다'); }
// 3) 첫 허물이 이르게 온다 (자동 플레이어 40판, 가운데 값 5일째 안)
{ const days = []; for (let s = 1; s <= 40; s++) { const R = B.play(s * 7919 + 13, ['abyss', 'nebula', 'brood', 'dusk', 'hunger'][s % 5], 2, '', CM.newMeta()); if (R.moltDays && R.moltDays.length) days.push(R.moltDays[0]); }
  days.sort((a, b) => a - b); const med = days[Math.floor(days.length / 2)]; console.log('첫 허물 날 가운데 값 ' + med + ' (' + days.length + '/40판)'); ok(days.length >= 36 && med <= 5, '첫 허물이 늦다'); }
// 4) 오늘 밤 미리보기는 판을 건드리지 않는다
{ const R = CM.newRun(777, { aspect: 'brood', meta: CM.newMeta(), diff: 2 }); for (let d = 0; d < 3; d++) { CM.endDay(R, () => ({ k: 'none' }), []); if (R.phase === 'reward') CM.skipReward(R); }
  const before = JSON.stringify(R.G), f = CM.foresee(R); ok(JSON.stringify(R.G) === before, '미리보기가 판을 바꿨다'); ok(!R.G.march.tonight || (f && ['safe', 'risk', 'fatal'].includes(f.level)), '미리보기가 등급을 주지 않는다'); console.log('오늘 밤 미리보기: ' + (f ? f.level + ' · ' + f.stopped + '/' + f.n : '조용')); }
console.log(bad ? '실패 ' + bad : '모두 통과'); process.exit(bad ? 1 : 0);
