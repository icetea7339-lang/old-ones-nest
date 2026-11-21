// 긴장 곡선: 밤마다 오는 적의 수, 조용한 밤의 비율, 진액이 쌓이는 정도, 그리고 세 사람(잘 놓는 이·아무렇게 놓는 이·아무것도 안 하는 이)의 결과.
//   node tests/tension.js [판 수]      (카드 판, 난이도 2)
const BOT = require('../src/cardbot.js'), CM = require('../src/cardmode.js'), CD = require('../src/cards2.js');
const N = +(process.argv[2] || 60), ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
function run(mode) {
  const o = { win: 0, deathDay: [], nights: 0, empty: 0, after3: 0, empty3: 0, perDay: {}, maxN: 0, goldMax: 0, gold: [], fellBy8: 0 };
  for (let s = 1; s <= N; s++) {
    const seed = s * 7919 + 13, R = BOT.play(seed, ASPS[s % 5], 2, mode, CM.newMeta());
    const G = R.G; if (G.over && G.over.win) o.win++; else o.deathDay.push(G.day);
    let fell8 = false; (R.curve || []).forEach(c => { o.nights++; if (!c.n) o.empty++; if (c.d >= 3) { o.after3++; if (!c.n) o.empty3++; } (o.perDay[c.d] = o.perDay[c.d] || []).push(c.n); o.maxN = Math.max(o.maxN, c.n); o.goldMax = Math.max(o.goldMax, c.g); o.gold.push(c.g); if (c.fell && c.d <= 8) fell8 = true; });
    if (fell8) o.fellBy8++;
  }
  return o;
}
const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const bad = []; const out = {};
for (const mode of ['', 'random', 'nothing']) {
  const o = run(mode), name = mode || 'smart'; out[name] = o;
  const days = [3, 5, 8, 12, 16, 20, 24, 28, 32, 36, 40].map(d => d + ':' + (o.perDay[d] ? Math.round(avg(o.perDay[d])) : '-')).join(' ');
  console.log(name.padEnd(7) + ' 이김 ' + Math.round(100 * o.win / N) + '% · 죽은 날 가운데 ' + med(o.deathDay) + ' · 8일 안에 쓰러짐 ' + o.fellBy8 + '/' + N + ' · 3일 뒤 조용한 밤 ' + Math.round(100 * o.empty3 / Math.max(1, o.after3)) + '% · 가장 많은 적 ' + o.maxN + ' · 진액 가운데 ' + med(o.gold) + ' 가장 많이 ' + o.goldMax);
  console.log('        밤마다 적(평균) ' + days);
}
const sm = out.smart, rd = out.random, no = out.nothing;
if (sm.maxN > 30) bad.push('적이 30을 넘는다: ' + sm.maxN);
if (Math.round(100 * sm.empty3 / Math.max(1, sm.after3)) > 30) bad.push('조용한 밤이 너무 많다');
if (med(no.deathDay) > 6) bad.push('아무것도 안 해도 오래 산다: ' + med(no.deathDay) + '일');
if (100 * (sm.win - rd.win) / N < 15) bad.push('잘 놓는 것과 아무렇게 놓는 것의 차이가 작다: ' + Math.round(100 * (sm.win - rd.win) / N) + '%p');
if (med(sm.gold) > 500) bad.push('진액이 쌓인다: 가운데 ' + med(sm.gold));
console.log(bad.length ? '실패: ' + bad.join(' / ') : '모두 통과');
process.exitCode = bad.length ? 1 : 0;
