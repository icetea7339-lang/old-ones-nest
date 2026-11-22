// 판마다 다른 둥지 모양: 입구·본체 방·떨어지며 지나온 자국이 규칙대로 놓이는가, 옛 저장(5×4)은 그대로 도는가
// node tests/maplayout.js
const S = require('../src/logic.js'), STEWARD = require('../src/steward.js');
const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
const conn = (G, cells) => { const set = new Set(cells), seen = new Set([cells[0]]), q = [cells[0]]; while (q.length) { const u = q.shift(); S.nbrs(G, u).forEach(v => { if (set.has(v) && !seen.has(v)) { seen.add(v); q.push(v); } }); } return seen.size === set.size; };
const ents = {}, cores = {};
for (let s = 1; s <= 200; s++) {
  const G = S.newGame(s * 7919 + 13, S.ASPECTS[s % 5], { diff: 2 });
  const C = G.cols, R = G.rows, er = Math.floor(G.ent / C), cr = Math.floor(G.core / C), cc = G.core % C;
  ents[G.ent] = 1; cores[G.core] = 1;
  ok(C === 7 && R === 5 && G.cells.length === 35, s + ': 7×5 가 아니다');
  ok(er === 0, s + ': 입구가 맨 윗줄이 아니다');
  ok(cr >= R - 2 && cc >= 1 && cc <= C - 2, s + ': 본체 방이 아래 두 줄 안쪽이 아니다');
  ok(cr + Math.abs(cc - G.ent % C) >= 4, s + ': 입구와 본체 방이 너무 가깝다');
  ok(G.start[0] === G.ent && G.start.every(i => G.cells[i].soft && !G.cells[i].dug), s + ': 자국이 입구에서 시작하는 무른 흙이 아니다');
  ok(conn(G, G.start.concat([G.core])), s + ': 자국이 본체 방까지 이어지지 않는다');
  ok(G.sealed && !S.paths(G).length, s + ': 처음부터 길이 뚫려 있다');
  G.ap = 99; G.d.buildOps = 99; G.start.slice().reverse().forEach(i => S.dig(G, i));
  ok(S.paths(G).length > 0 && S.breach(G).ok, s + ': 자국을 다 파도 뚫지 못한다');
}
ok(Object.keys(ents).length >= 6, '입구 자리가 고루 나오지 않는다: ' + Object.keys(ents).length);
ok(Object.keys(cores).length >= 8, '본체 방 자리가 고루 나오지 않는다: ' + Object.keys(cores).length);
// 같은 씨앗이면 같은 모양
{ const a = S.newGame(42, 'abyss', {}), b = S.newGame(42, 'abyss', {}); ok(a.ent === b.ent && a.core === b.core && a.start.join() === b.start.join(), '같은 씨앗인데 모양이 다르다'); }
// 한 방울이 헤집고 다닌 자리를 따른다
{ const roam = new Array(35).fill(0); [8, 15, 22, 29, 30].forEach(i => { roam[i] = 6; }); roam[31] = 12; let hit = 0;
  for (let s = 1; s <= 40; s++) { const G = S.newGame(s * 31, 'brood', { prologue: Object.assign(S.proResult('brood', 'avg'), { skipped: false, roam }) }); if (G.core === 29 || G.core === 30 || G.core === 31 || G.core === 22) hit++; ok((G.soft2 || []).every(i => roam[i] > 0 && G.cells[i].soft), s + ': 더 무른 칸이 헤집은 자리가 아니다'); }
  ok(hit >= 24, '본체 방이 헤집은 자리 쪽에 잘 놓이지 않는다: ' + hit + '/40'); }
// 옛 저장: 모양 정보가 없으면 5×4, 입구 0, 본체 18
{ const G = S.newGame(9, 'dusk', { layout: 'old' }); const raw = JSON.parse(JSON.stringify(G)); ['cols', 'rows', 'ent', 'core', 'start', 'soft2'].forEach(k => delete raw[k]);
  const M = S.migrate(raw); ok(M.cols === 5 && M.rows === 4 && M.ent === 0 && M.core === 18 && M.start.join() === '0,1,6,7,12,13', '옛 저장의 모양이 틀렸다');
  M.ap = 99; M.d.buildOps = 99; M.start.slice().reverse().forEach(i => S.dig(M, i)); ok(S.breach(M).ok, '옛 저장에서 뚫지 못한다');
  const st = { captive: 'mix', raid: 1, spend: 1 }; let n = 0; while (!M.over && n++ < 6) { STEWARD.tasks(S, M, st, { seed: 9, ban: [] }).forEach(t => t()); S.endDay(M, STEWARD.decide(st)); }
  ok(M.day >= 5 || M.over, '옛 저장으로 밤을 넘기지 못한다'); }
console.log(bad.length ? '실패 ' + bad.length + '\n' + bad.slice(0, 12).join('\n') : '모두 통과 (입구 ' + Object.keys(ents).length + '곳, 본체 방 ' + Object.keys(cores).length + '곳)');
