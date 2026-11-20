// 이야기 모드 규칙: 장마다 열리는 것, 목표, 굴짐승, 물레골. 그리고 자유 모드가 그대로인지
// node tests/storyrules.js
const S = require('../src/logic.js');
const bad = [], ok = (c, m) => { if (!c) { bad.push(m); console.log('실패: ' + m); } };
const pr = asp => S.proResult(asp, 'avg');
const nonSpawn = G => G.kin.filter(m => m.kind !== 'spawn').length;

// 표
ok([1, 2, 3, 4, 5, 6, 7].every(c => S.STORYCH[c] && S.STORYCH[c].title), '일곱 장 모두 제목이 있다');
ok([4, 5, 6, 7].every(c => S.STORYCH[c].soon), '4~7장은 아직 닫혀 있다');
ok(S.STORYCH[1].pro && S.STORYCH[1].pro.goal === 2, '1장은 한 방울로 두 번째 몸까지');

// 2장: 땅속, 굴 넓히기와 첫 권속
{
  const G = S.newGame(7, 'abyss', { story: { ch: 2 }, prologue: pr('abyss') });
  ok(G.story && G.story.ch === 2 && G.sealed, '2장은 막힌 채 시작한다');
  ok(G.cells.filter(c => c.dug).length === 1, '2장은 본체 방 한 칸뿐이다 (자국이 미리 파여 있지 않다)');
  ok(!S.breach(G).ok, '2장에서는 뚫을 수 없다');
  ok(S.storyLock(G, 'evo') && S.storyLock(G, 'hand'), '2장은 진화와 손이 닫혀 있다');
  const any = G.cells.findIndex((c, i) => i !== G.core && S.nbrs(G, G.core).includes(i));
  ok(S.canBuild(G, G.core === 0 ? 1 : 0, 'post') && /아직|먼저/.test(S.canBuild(G, any, 'post')), '2장에서는 문턱을 지을 수 없다');
  ok(S.handOf(G).length === 0, '2장은 손에 쥔 주문이 없다');
  ok(G.applicants.every(a => ['goblin', 'skeleton'].includes(a.kind)), '2장에 돋는 것은 깨물이와 뼈껍질뿐');
  ok(G.march.tomorrow && G.march.tomorrow.beast, '둘째 밤에 굴짐승이 온다고 알려 준다');
  const gl = S.storyGoal(G); ok(gl && gl.items.length === 3 && !gl.done, '2장 목표: 굴·권속·밤');
}
function play2(seed) {
  const G = S.newGame(seed, S.ASPECTS[seed % 5], { story: { ch: 2 }, prologue: pr(S.ASPECTS[seed % 5]) }); let fights = 0;
  for (let d = 0; d < 20 && !G.over; d++) {
    for (let k = 0; k < 8; k++) { const i = G.cells.findIndex((c, j) => !c.dug && c.soft && !S.canDig(G, j)); const j2 = i >= 0 ? i : G.cells.findIndex((c, j) => !c.dug && !S.canDig(G, j)); if (j2 < 0 || !S.dig(G, j2).ok) break; }
    while (nonSpawn(G) < 3 && G.applicants.length && S.accept(G, 0).ok);
    if (G.march.tonight) fights++;
    S.endDay(G, () => ({ k: 'none' }));
  }
  return { G, fights };
}
{ let win = 0, lose = 0, fights = 0, days = 0; for (let s = 1; s <= 60; s++) { const r = play2(s * 7919 + 13); if (r.G.over && r.G.over.win && r.G.over.story) { win++; days += r.G.day; } else lose++; fights += r.fights; }
  console.log('2장 60판: 넘김 ' + win + ' · 못 넘김 ' + lose + ' · 굴짐승 밤 ' + (fights / 60).toFixed(1) + ' · 끝난 날 ' + (days / Math.max(1, win)).toFixed(1));
  ok(win === 60, '2장은 사람 손으로 하면 지지 않는다 (60판 모두)'); ok(fights >= 1.5 * 60, '2장에서 굴짐승 밤이 두 번 있다'); }

// 3장: 물레골
{
  const G = S.newGame(11, 'brood', { story: { ch: 3 }, prologue: pr('brood') });
  ok(nonSpawn(G) >= 2, '3장을 새로 열면 권속 둘이 있다');
  ok(S.paths(G).length > 0 && G.sealed, '3장은 바로 뚫을 수 있게 시작한다');
  ok(!G.march.tonight && !G.march.tomorrow, '뚫기 전에는 아무도 오지 않는다');
  const r = S.breach(G); ok(r.ok && G.world === 'fantasy', '3장의 땅 위는 판타지다');
  ok(S.VILL.field.name === '물레골', '마을 이름은 물레골');
  ok(G.march.tonight && G.march.tonight.kinds.join() === 'villager,villager', '뚫은 첫 밤에는 마을 사람 둘');
  ok(S.handOf(G).join() === 'whip', '3장의 손은 채찍 하나');
  ok(!S.canBuild(G, S.paths(G)[0].find(i => i !== G.core && i !== G.ent && G.cells[i].type === 'empty'), 'post'), '3장에서는 문턱을 지을 수 있다');
  ok(/아직/.test(S.canBuild(G, S.paths(G)[0].find(i => i !== G.core && i !== G.ent && G.cells[i].type === 'empty'), 'hall')), '3장에서는 싸움 굴을 지을 수 없다');
}
function play3(seed, from) {
  const asp = S.ASPECTS[seed % 5]; let G = from || S.newGame(seed, asp, { story: { ch: 3 }, prologue: pr(asp) }); if (from) S.storyStart(G, 3);
  let priest = false;
  for (let d = 0; d < 30 && !G.over; d++) {
    if (G.sealed) { for (let k = 0; k < 8 && !S.paths(G).length; k++) { const i = G.cells.findIndex((c, j) => !c.dug && c.soft && !S.canDig(G, j)); if (i < 0 || !S.dig(G, i).ok) break; } S.breach(G); }
    const path = (S.paths(G)[0] || []).filter(i => i !== G.core && i !== G.ent);
    for (const i of path) { if (G.cells[i].type === 'empty' && G.gold > 120) S.build(G, i, G.cells.filter(c => c.type === 'post').length < 1 ? 'post' : 'trap'); if (G.cells[i].type === 'trap' && G.cells[i].traps.length < 1) S.addTrap(G, i, 'spike'); }
    while (nonSpawn(G) < 4 && G.applicants.length && S.accept(G, 0).ok);
    if (G.march.tonight && G.march.tonight.kinds.includes('priest')) priest = true;
    S.endDay(G, ctx => { const w = (ctx.opts || []).find(o => o.id === 'whip' && o.ok); return w && ctx.enemies >= 2 ? { k: 'whip' } : { k: 'none' }; });
  }
  return { G, priest };
}
{ let win = 0, lose = 0, priest = 0, days = 0, cap = 0; const why = {};
  for (let s = 1; s <= 80; s++) { const r = play3(s * 7919 + 13); if (r.G.over && r.G.over.win && r.G.over.story) { win++; days += r.G.day - r.G.story.bday; } else { lose++; const w = r.G.over ? r.G.over.why : '안 끝남'; why[w] = (why[w] || 0) + 1; } priest += r.priest; cap += r.G.stats.captives; }
  console.log('3장 80판: 넘김 ' + win + ' · 못 넘김 ' + lose + ' ' + JSON.stringify(why) + ' · 성직자 밤 ' + priest + ' · 붙잡은 수 ' + (cap / 80).toFixed(1) + ' · 뚫은 뒤 밤 ' + (days / Math.max(1, win)).toFixed(1));
  ok(win >= 76, '3장은 처음 하는 사람도 거의 지지 않는다 (95% 이상)'); ok(priest >= 70, '마지막 밤에 성직자가 온다'); }
// 2장에서 이어받아 3장
{ const r2 = play2(4242); ok(r2.G.over && r2.G.over.win, '이어받을 2장 판'); const G = JSON.parse(JSON.stringify(r2.G)); const r3 = play3(4242, S.migrate(G)); ok(r3.G.over && r3.G.over.win && r3.G.story.ch === 3, '2장의 둥지를 이어받아 3장을 넘긴다'); }
// 자유 모드는 그대로
{ const G = S.newGame(5, 'abyss', { prologue: pr('abyss') }); ok(!G.story && S.VILL.field.name === '너른들', '자유 모드는 이야기 표를 쓰지 않는다'); ok(S.handOf(G).length >= 2, '자유 모드의 손'); ok(G.cells.filter(c => c.dug).length > 1, '자유 모드는 자국이 파인 채로 시작한다'); }
console.log(bad.length ? '실패 ' + bad.length : '모두 통과');
process.exitCode = bad.length ? 1 : 0;
