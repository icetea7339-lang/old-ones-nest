// 권속 진화 세 단계와 비밀 진화의 규칙 (node, 브라우저 없음)
// node tests/kinevo.js
const S = require('../src/logic.js');
let bad = 0; const ok = (c, msg) => { if (!c) { bad++; console.log('실패: ' + msg); } };
const fresh = () => { const G = S.newGame(4242, 'brood', { diff: 1, prologue: S.proResult('brood', 'avg') }); G.gold = 5000; G.sealed = false; return G; };
const add = (G, kind, lv, loc) => { const m = { id: G.nextId++, name: kind + G.nextId, kind, lv, exp: 0, loc: loc === undefined ? null : loc, hurt: 0, skill: -1, rare: false, age: 3, unpaid: 0, evo: 0 }; G.kin.push(m); return m; };
const C = S.K.kevo.cap;

// 1. 한도에서 경험치가 멈춘다
{ const G = fresh(), m = add(G, 'goblin', 1); for (let k = 0; k < 40; k++) S.giveExp(m, 500); ok(m.lv === C[0] && m.exp === 0, '기본 단계는 Lv' + C[0] + '에서 멈춘다 (지금 Lv' + m.lv + ')'); }
// 2. 한도 아래면 진화 못 하고, 한도에서 하면 된다. 값이 단계마다 다르다
{ const G = fresh(), m = add(G, 'goblin', C[0] - 1); ok(!S.evolveKin(G, m.id).ok, '한도 아래에서는 진화 못 한다');
  m.lv = C[0]; const g0 = G.gold, c0 = S.evoCost(G, m), r = S.evolveKin(G, m.id); ok(r.ok && S.stageOf(m) === 1, '한도에서 첫 진화'); ok(Math.round(g0 - G.gold) === Math.round(c0), '첫 진화 값 ' + c0);
  S.giveExp(m, 99999); ok(m.lv === C[1], '자란 것은 Lv' + C[1] + '에서 멈춘다 (지금 Lv' + m.lv + ')');
  const c1 = S.evoCost(G, m); ok(c1 > c0, '둘째 진화가 더 비싸다 ' + c0 + ' → ' + c1);
  const s1 = S.kinStats(G, m).hp; ok(S.evolveKin(G, m.id).ok && S.stageOf(m) === 2, '둘째 진화'); ok(S.kinStats(G, m).hp > s1, '다 자라면 체력이 는다');
  ok(!S.evolveKin(G, m.id).ok, '다 자란 뒤에는 더 못 한다'); ok(S.kinName(m) === S.EVO2.goblin, '다 자란 이름 ' + S.kinName(m)); }
// 3. 비밀 진화: 짝이 같은 자리에 있고 사흘 뿌리내려야 열린다
{ const G = fresh(), loc = Object.keys(S.capacity(G)).find(k => k !== 'core'), L = loc === undefined ? 'core' : +loc;
  const m = add(G, 'skeleton', C[1], L); m.evo = 1;
  ok(!S.secretReady(G, m), '짝이 없으면 닫혀 있다'); ok(!S.evolveKin(G, m.id, true).ok, '닫혀 있으면 비밀 진화 못 한다');
  const p = add(G, 'cultist', 3, L); m.pin = true; m.hold = 2; ok(!S.secretReady(G, m), '뿌리내림 2밤이면 아직');
  m.hold = 3; ok(S.secretReady(G, m), '짝 + 뿌리내림 3밤이면 열린다');
  p.loc = null; ok(!S.secretReady(G, m), '짝이 자리를 떠나면 닫힌다'); p.loc = L;
  const r = S.evolveKin(G, m.id, true); ok(r.ok && r.secret && m.secret === 'pray' && S.stageOf(m) === 2, '비밀 진화: 죽어도 기도하는 것');
  ok(S.recipesOf(m).includes('pray'), '비밀 진화의 재주가 켜진다'); ok(S.kinName(m) === S.SECRET.skeleton[2], '비밀 이름 ' + S.kinName(m));
  const n = { id: -1, kind: 'skeleton', lv: C[1], evo: 2, pin: m.pin, hold: m.hold, loc: m.loc }; ok(S.kinStats(G, m).hp < S.kinStats(G, n).hp, '비밀 갈래는 몸이 조금 약하다');
  const d = S.mkDef ? S.mkDef(G, m) : null; if (d) ok(d.revives >= 3, '부활 횟수에 재주가 더해진다 (' + d.revives + ')');
  ok((G.stats.secrets || 0) === 1, '비밀 진화 수를 센다'); }
// 4. 모든 짝이 이어져 있다
for (const k in S.SECRET) { const [r, p] = S.SECRET[k]; ok(!!S.RECIPE[r], k + ' 의 재주 ' + r); ok(!!S.KIN[p], k + ' 의 짝 ' + p); ok(!!S.EVO2[k], k + ' 의 다 자란 이름'); }
// 5. 옛 저장: 붙은 몸 → 비밀 진화, true → 1
{ const G = fresh(), a = add(G, 'goblin', 9, 'core'), b = add(G, 'scale', 4); a.parts = [{ kind: 'hunger', lv: 3, name: 'x' }]; b.evo = true; b.parts = [{ kind: 'mask', lv: 2, name: 'y' }];
  const G2 = S.migrate(JSON.parse(JSON.stringify(G))), a2 = G2.kin.find(x => x.id === a.id), b2 = G2.kin.find(x => x.id === b.id);
  ok(a2.secret === 'fist' && a2.evo === 2 && !a2.parts, '조합이 있던 몸은 비밀 진화로 옮긴다'); ok(b2.evo === 1 && !b2.secret && !b2.parts, '조합 없는 몸은 붙은 것만 떨어진다');
  ok(S.kinStats(G2, a2).hp > 0 && S.salary(G2, a2) > 0, '옮긴 몸의 능력치와 끼니'); }
// 6. 방의 경험치는 한도와 상관없다
{ const cell = { type: 'hall', lv: 1, exp: 0 }; S.giveExp(cell, 99999); ok(cell.lv > C[2], '방은 한도 없이 오른다 (Lv' + cell.lv + ')'); }
console.log(bad ? '실패 ' + bad : '모두 통과');
