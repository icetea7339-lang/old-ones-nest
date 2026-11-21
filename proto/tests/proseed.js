// 짧은 한 방울 → 카드 판 첫 몸의 씨앗.  node tests/proseed.js [판 수=200]
//   봇 넷(careless, nobuy, greedy, planned)과 다섯 빛깔, 서로 다른 씨앗으로 돌려 씨앗(형질 상위 셋)이 얼마나 갈리는지 본다.
global.__PRO_SHORT = true;
const PRO = require('../src/prologue.js'), { play } = require('./prosim.js'), TR = require('../src/traits.js');
const N = +(process.argv[2] || 200), KINDS = ['careless', 'nobuy', 'greedy', 'planned', 'planned_eye', 'planned_noeye'];
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
// 1. 짧은 판의 설정
ok(PRO.SHORT && PRO.SHORT.goal === 3 && PRO.SHORT.short, '짧은 판은 셋째 몸까지');
{ const sim = PRO.makeSim({ asp: 'brood', seed: 5, short: true }); ok(sim.sty && sim.sty.short && sim.sty.lives >= 50, '짧은 판은 쓰러져도 끝나지 않는다'); }
// 2. 매핑이 모두 TRAITS 의 태그로 간다
const TAGS = new Set(TR.TAG_IDS); for (const id in PRO.PARTTAG) PRO.PARTTAG[id].forEach(([t]) => ok(TAGS.has(t), '모르는 태그 ' + t + ' (' + id + ')'));
ok(Object.keys(PRO.PARTTAG).length === PRO.CAT.length, '부위 스물다섯 모두 형질로 간다');
// 3. 같은 결과면 같은 씨앗, 건너뛴 결과도 씨앗이 된다
{ const sim = PRO.makeSim({ asp: 'dusk', seed: 9, short: true }); const r = sim.result('skip'), a = PRO.toGenomeSeed(r), b = PRO.toGenomeSeed(JSON.parse(JSON.stringify(r))); ok(JSON.stringify(a) === JSON.stringify(b), '씨앗은 결과로만 정해진다'); ok(a.aspect === 'dusk' && a.skipped, '건너뛰면 고른 빛깔 그대로'); }
// 4. 봇으로 돌려 갈래를 센다
const sets = {}, aspects = {}, tops = {}, times = [], stages = [0, 0, 0, 0, 0, 0]; let fell = 0;
for (let n = 0; n < N; n++) {
  const kind = KINDS[n % KINDS.length], asp = PRO.ASPS[Math.floor(n / KINDS.length) % 5], look = PRO.SEED_IDS[(n * 7) % PRO.SEED_IDS.length];
  const res = play(kind, asp, 3000 + n * 53, look), r = res.r, seed = PRO.toGenomeSeed(r);
  ok(seed.aspect && PRO.ASPS.includes(seed.aspect), '씨앗의 빛깔');
  Object.keys(seed.tags).forEach(t => ok(TAGS.has(t), '씨앗 태그 ' + t));
  const key = seed.top.slice().sort().join('+'); sets[key] = (sets[key] || 0) + 1; aspects[seed.aspect] = (aspects[seed.aspect] || 0) + 1; seed.top.forEach(t => { tops[t] = (tops[t] || 0) + 1; });
  times.push(r.time); stages[r.size]++; if (r.fell) fell++;
}
const distinct = Object.keys(sets).length, avgT = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
console.log(N + '판 · 서로 다른 씨앗(형질 상위 셋) ' + distinct + '가지 · 빛깔 ' + JSON.stringify(aspects));
console.log('닿은 몸 1~5: ' + stages.slice(1).join(' / ') + ' · 평균 ' + avgT + '초 (' + Math.floor(avgT / 60) + '분 ' + avgT % 60 + '초) · 쓰러져 끝 ' + fell);
console.log('상위 셋에 든 형질: ' + Object.keys(tops).sort((a, b) => tops[b] - tops[a]).map(t => TR.TAGS[t].name + ' ' + tops[t]).join(', '));
ok(distinct >= 60, '씨앗이 60가지 넘게 갈린다');
ok(avgT <= 300, '짧은 판은 평균 5분 안');
console.log(bad ? '실패 ' + bad : '모두 통과');
process.exit(bad ? 1 : 0);
