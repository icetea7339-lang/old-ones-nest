// 세상마다 그 세상에만 있는 것이 실제로 나오고 재주를 부리는지: 자동 플레이어로 며칠 굴린 뒤 밤의 기록에서 그 줄을 찾는다.  node tests/worldnight.js
const path = require('path'); const S = require(path.join(__dirname, '../src/logic.js')); const STEWARD = require(path.join(__dirname, '../src/steward.js'));
const NEED = { fantasy: ['불비', '깃발을 세운다'], wuxia: ['지목했다', '함정을 밟지 않고', '비무의 밤'], modern: ['환히 비춘다', '소문을 퍼뜨린다'], future: ['흔들리지 않는다', '까지 막는다'] };
let bad = 0;
for (const w of S.WORLD_IDS) {
  const found = {}, shown = [], kindsSeen = {}, fore = {};
  for (let seed = 1; seed <= 40 && Object.keys(found).length < NEED[w].length; seed++) {
    const G = S.newGame(seed * 7919, 'hunger', { diff: 2, prologue: S.proResult('hunger', 'avg') }); G.forceWorld = w; S.breach(G, true);
    const st = { captive: 'mix', raid: false, spend: 1 };
    for (let d = 0; d < 40 && !G.over; d++) {
      for (const t of STEWARD.tasks(S, G, st, {})) t();
      const e = S.estimate(G, 'tonight'); if (e) e.only.forEach(k => { fore[k] = 1; });
      const rep = S.endDay(G, STEWARD.decide(st)).battle;
      if (rep && rep.ev) { (rep.party || []).forEach(u => { if (S.INV[u.kind].only) kindsSeen[u.kind] = 1; }); rep.ev.forEach(x => { if (!x.txt) return; NEED[w].forEach(n => { if (!found[n] && x.txt.includes(n)) { found[n] = 1; shown.push('  ' + G.day + '일 · ' + x.txt); } }); }); }
    }
  }
  const ex = S.WORLD[w].only, miss = NEED[w].filter(n => !found[n]), noShow = ex.filter(k => !kindsSeen[k]), noFore = ex.filter(k => !fore[k]);
  console.log(S.WORLD[w].name + ' · ' + S.WORLD[w].beat[0] + ' · 이 세상에만: ' + ex.map(k => S.INV[k].name).join(', ')); shown.forEach(l => console.log(l));
  if (miss.length || noShow.length || noFore.length) { bad++; console.log('  빠짐: ' + miss.concat(noShow.map(k => k + ' 안 나옴'), noFore.map(k => k + ' 예보에 없음')).join(' / ')); }
  if (ex.some(k => S.INV[k].only !== w)) { bad++; console.log('  only 틀림'); }
}
// 다른 세상에는 섞여 들지 않는다
for (const w of S.WORLD_IDS) { const G = S.newGame(5, 'hunger', { diff: 3 }); G.forceWorld = w; S.breach(G, true); G.fear = 90; for (const day of [3, 8, 9, 16, 24, 30, 33, 40]) { G.day = day; const p = S.partyKinds(G, 'fort', day % 8 === 0, false, day); p.kinds.forEach(k => { if (S.INV[k].only && S.INV[k].only !== w) { bad++; console.log(w + ': 남의 세상 것 ' + k); } }); } }
console.log(bad ? '실패 ' + bad : '통과');
process.exit(bad ? 1 : 0);
