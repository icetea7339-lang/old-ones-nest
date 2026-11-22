// 몸 유전자 규칙: 같은 것은 같게, 모든 형질·짝·이름 붙은 형태에 닿을 수 있게, 갈래는 수백 개.  node tests/bodyrules.js
const T = require('../src/traits.js'), { profiles } = require('./bodyprof.js'), S = require('./bodysheet.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const mk = (c, o) => { const g = T.newGenome(Object.assign({ aspect: 'abyss', stage: 4, seed: 9 }, o || {})); T.addBehaviour(g, c); return g; };
// 1. 같은 입력이면 같은 몸
{ const a = mk({ trapKills: 20, infections: 7 }), b = mk({ trapKills: 20, infections: 7 }); ok(JSON.stringify(T.summary(a)) === JSON.stringify(T.summary(b)), '같은 셈과 씨앗이면 같은 몸'); }
// 2. 형질마다 그 형질을 먹이는 셈만 주면 맨 위에 선다
{ const miss = []; for (const t of T.TAG_IDS) { const c = {}; for (const [k] of T.TAGS[t].feed) c[k] = 40; let hit = false; for (const asp of T.ASPS) { const g = mk(c, { aspect: asp }); if (T.topTags(g, 2).includes(t)) hit = true; } if (!hit) miss.push(t); } ok(!miss.length, '닿지 않는 형질: ' + miss.join(' ')); console.log('형질 ' + T.TAG_IDS.length + '개, 닿음 ' + (T.TAG_IDS.length - miss.length)); }
// 3. 짝마다 그 형질들을 먹이면 생긴다
{ const miss = []; for (const cb of T.COMBOS) { const c = {}; cb.tags.forEach(t => { const f = T.TAGS[t].feed[0]; c[f[0]] = (c[f[0]] || 0) + 40; }); let hit = false; for (const asp of T.ASPS) for (let sd = 1; sd < 4 && !hit; sd++) { const g = mk(c, { aspect: asp, seed: sd }); if (T.combosOf(g).some(x => x.id === cb.id)) hit = true; } if (!hit) miss.push(cb.name); } ok(!miss.length, '닿지 않는 짝: ' + miss.join(', ')); console.log('짝 ' + T.COMBOS.length + '개, 닿음 ' + (T.COMBOS.length - miss.length)); }
// 4. 이름 붙은 형태 서른
{ const l = S.landmarkGenomes(), hit = l.filter(x => x.got === x.want).length; ok(hit === T.LANDMARKS.length, '이름 붙은 형태 ' + hit + '/' + T.LANDMARKS.length); console.log('이름 붙은 형태 ' + hit + '/' + T.LANDMARKS.length); }
// 5. 이름과 갈래의 수
{ const pr = profiles(T, 1000, 7), names = new Set(pr.map(x => T.nameOf(x.g).name)); console.log('무작위 1,000 몸의 다른 이름 ' + names.size); ok(names.size >= 500, '이름이 너무 겹친다'); }
{ const pr = profiles(T, 200, 3), keys = new Set(), cls = new Set(), lm = {}; pr.forEach(x => { const c = T.classOf(x.g), k = [c.loco, c.post, c.sym, c.plan].join('/'); cls.add(k); keys.add(k + '|' + T.topTags(x.g, 3).join(',')); const L = T.landmarkOf(x.g); if (L) lm[L.name] = (lm[L.name] || 0) + 1; });
  console.log('놀이 성향 200 → 다른 몸(꼴+형질 셋) ' + keys.size + ' · 다른 꼴 ' + cls.size + ' · 이름 붙은 형태 ' + Object.values(lm).reduce((a, b) => a + b, 0) + '번 (' + Object.keys(lm).length + '가지)'); ok(keys.size >= 150, '갈래가 너무 적다'); }
// 6. 조금만 달리 놀면 갈라진다: 셈 하나를 +14 했을 때 위쪽 형질 셋이나 꼴이 바뀌는 비율
{ const base = { kinKills: 12, trapKills: 10, eaten: 8, infections: 6, skillsUsed: 6 }, ks = Object.keys(T.COUNTERS); let moved = 0; const g0 = mk(base), k0 = JSON.stringify([T.classOf(g0), T.topTags(g0, 3)]);
  for (const k of ks) { const c = Object.assign({}, base); c[k] = (c[k] || 0) + 14; const g = mk(c); if (JSON.stringify([T.classOf(g), T.topTags(g, 3)]) !== k0) moved++; }
  console.log('셈 하나 +14 로 몸이 바뀐 비율 ' + moved + '/' + ks.length); ok(moved >= ks.length * 0.5, '작은 변화에 너무 둔하다'); }
// 7. 물려받기
{ const a = mk({ infections: 60 }), h = T.inherit(a), b = T.newGenome({ aspect: 'nebula', stage: 1, seed: 3, lineage: [h] }); T.addBehaviour(b, { skillsUsed: 3 }); ok((b.tags.spore || 0) > 0, '앞 판의 형질이 조금 남는다'); ok(T.describe(b).length >= 1, '설명 줄'); }
console.log(bad ? '실패 ' + bad : '모두 통과');
