// 새 판 (시험) 규칙 시험: 같은 씨앗이면 같은 판, 싸움이 끝난다, 세트 단계, 연쇄, 굴 바꾸기, 본체 공격, 칸 닿기
const T = require('../src/trend.js'), B = require('../src/trendbot.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('틀림: ' + m); } };
// 같은 씨앗 → 같은 판, 같은 결과
{ const a = B.play(4242, 'smart'), b = B.play(4242, 'smart'); ok(JSON.stringify(a) === JSON.stringify(b), '같은 씨앗인데 결과가 다르다'); }
// 시작: 부위 6~10개, 보상 셋, 길이 있다
for (let s = 1; s <= 60; s++) {
  const R = T.newRun(s); ok(R.pieces.length >= 6 && R.pieces.length <= 10, '시작 부위 수 ' + R.pieces.length); ok(R.offer.length === 3, '보상이 셋이 아니다');
  ok(R.bd.path && R.bd.path[0] === R.bd.ent && R.bd.path[R.bd.path.length - 1] === R.bd.core, '길이 입구에서 본체로 이어지지 않는다');
  ok(new Set(R.offer).size === 3, '보상이 겹친다 ' + R.offer);
}
// 싸움은 끝나고, 30~40초 근처에서 끝난다
{ const L = []; for (let s = 1; s <= 120; s++) { const r = B.play(s * 31 + 7, 'smart'); L.push(r.t); ok(r.t < 75.1, '싸움이 끝나지 않았다'); } L.sort((a, b) => a - b); const mid = L[L.length >> 1]; ok(mid >= 28 && mid <= 42, '싸움 길이 가운데 ' + mid.toFixed(1)); console.log('싸움 길이 가운데 ' + mid.toFixed(1) + '초'); }
// 잘 놓은 판이 아무렇게나 놓은 판보다 훨씬 자주 이긴다. 세 갈래 모두 할 만하다
{ const rate = (st, a) => { let w = 0; for (let s = 1; s <= 150; s++) w += B.play(s * 7919 + 13, st, a).win; return w / 150; };
  const sm = rate('smart'), rn = rate('random'); console.log('잘 놓음 ' + Math.round(sm * 100) + '% · 아무렇게나 ' + Math.round(rn * 100) + '%');
  ok(sm - rn >= 0.4, '잘 놓은 판과 아무렇게나의 차이가 작다'); ok(rn <= 0.35, '아무렇게나 놓아도 자주 이긴다');
  for (const a of ['spore', 'maw', 'egg']) { const r = rate('smart', a); ok(r >= 0.6, a + ' 갈래 승률 ' + Math.round(r * 100) + '%'); } }
// 세트 단계: 포자 둘이면 1단계, 넷이면 2단계
{ const R = T.newRun(7, { arch: 'spore' }); T.take(R, 0); const n = { spore: 0 }; T.TAGS.forEach(t => { n[t] = 0; }); n.spore = 2; ok(T.tagLv(R, 'spore', n) === 1, '포자 2 → 1단계'); n.spore = 4; ok(T.tagLv(R, 'spore', n) === 2, '포자 4 → 2단계'); n.spore = 1; ok(T.tagLv(R, 'spore', n) === 0, '포자 1 → 0단계'); }
// 본체는 가장 많은 태그를 닮는다. 놓을수록 몸 단계가 오른다
for (const a of ['spore', 'maw', 'egg']) { const R = T.newRun(11, { arch: a }); T.take(R, 0); const g0 = T.genome(R).stage; ok(T.bodyOf(R) === 'none', '아무것도 놓지 않았는데 몸이 있다'); T.autoPlace(R); ok(T.bodyOf(R) === a, a + ' 판인데 몸이 ' + T.bodyOf(R)); ok(T.genome(R).stage > g0, '놓았는데 몸 단계가 그대로다'); ok(T.genome(R).tags[a] > 0, '몸 형질에 ' + a + ' 이 없다'); }
// 굴 바꾸기: 막아서 길을 늘릴 수 있고, 길을 끊는 막기는 안 된다. 세 번까지
{ let longer = 0, tried = 0; for (let s = 1; s <= 60; s++) { const R = T.newRun(s); const l0 = R.bd.path.length; B.bend(R); tried++; if (R.bd.path.length > l0) longer++; ok(R.bd.edits >= 0, '굴 바꾸기가 음수'); ok(!!T.pathOf(R.bd), '굴을 바꾸다 길이 끊겼다'); }
  ok(longer / tried >= 0.5, '막아서 길을 늘릴 수 있는 판이 적다 ' + longer + '/' + tried);
  const R = T.newRun(3); for (let c = 0; c < T.N; c++) if (R.bd.dug[c] && c !== R.bd.ent && c !== R.bd.core) { R.bd.dug[c] = false; const cut = !T.pathOf(R.bd); R.bd.dug[c] = true; if (cut) { ok(!T.canToggle(R, c), '길을 끊는 칸을 막을 수 있다'); break; } }
  const R2 = T.newRun(5); let k = 0; for (let c = 0; c < T.N && R2.bd.edits > 0; c++) if (T.canToggle(R2, c)) { T.toggle(R2, c); k++; } ok(k <= 3 && R2.bd.edits === 0 || k < 3, '굴 바꾸기가 세 번을 넘는다'); }
// 칸 닿기: 아가리는 제 칸과 다음 길 칸, 포자는 위아래옆, 눈은 길 앞쪽
{ const R = T.newRun(9); const path = R.bd.path, c = path[1], F = { R };
  const m = T.reach(F, { cell: c, d: T.P.teeth }); ok(m.length === 2 && m[0] === c && m[1] === path[2], '아가리 닿는 칸이 제 칸과 다음 칸이 아니다');
  const sp = T.reach(F, { cell: c, d: T.P.sporebag }); ok(sp.length === 1 + T.nbrs(c).length, '포자가 곁 칸에 닿지 않는다');
  const ey = T.reach(F, { cell: path[3], d: T.P.eyewall }); ok(ey.includes(path[1]) && ey.includes(path[3]) && !ey.includes(path[4]), '눈이 길 앞쪽 두 칸에 닿지 않는다'); }
// 연쇄: 포자 판은 연쇄가 길고, 아가리 판은 삼킴이 많고, 알 판은 움이 많다 (판마다 느낌이 다르다)
{ const avg = (a, k) => { let s = 0; for (let i = 1; i <= 60; i++) s += B.play(i * 97 + 1, 'smart', a)[k]; return s / 60; };
  const ch = avg('spore', 'chain'), sw = avg('maw', 'sw'), sp = avg('egg', 'sp'); console.log('포자 연쇄 ' + ch.toFixed(1) + ' · 아가리 삼킴 ' + sw.toFixed(1) + ' · 알 움 ' + sp.toFixed(1));
  ok(ch > avg('maw', 'chain') + 2, '포자 판의 연쇄가 길지 않다'); ok(sw > avg('spore', 'sw') + 5, '아가리 판의 삼킴이 많지 않다'); ok(sp > avg('maw', 'sp') + 20, '알 판의 움이 많지 않다'); }
// 본체가 싸운다: 몸에 따라 다른 공격이 나온다
for (const a of ['spore', 'maw', 'egg']) { const R = T.newRun(21, { arch: a }); T.take(R, 0); B.bend(R); B.arrange(R); const F = T.startFight(R); let body = 0, g = 0; while (!F.over && g++ < 900) { T.step(F); F.ev.forEach(e => { if (e.k === 'body' && e.b === a) body++; }); F.ev.length = 0; } ok(body >= 2, a + ' 몸이 거의 싸우지 않았다 ' + body); }
// 기술: 아무 때나 쓰고, 한 번 쓰면 다시 못 쓴다
{ const R = T.newRun(13, { arch: 'maw' }); T.take(R, 0); T.autoPlace(R); const F = T.startFight(R); for (let i = 0; i < 40; i++) T.step(F); ok(F.charges.length >= 2, '기술이 둘 미만'); const cell = T.cellOf(F, T.alive(F)[0]); ok(T.useSkill(F, 0, cell), '기술을 쓰지 못했다'); ok(!T.useSkill(F, 0, cell), '쓴 기술을 또 썼다'); }
// 알: 곁의 길 칸으로 깨어난다
{ const R = T.newRun(17, { arch: 'egg' }); T.take(R, 0); T.autoPlace(R); const F = T.startFight(R); let g = 0, far = 0, n = 0; while (!F.over && g++ < 400) { T.step(F); F.ev.forEach(e => { if (e.k === 'spawn' && typeof e.src === 'number') { const p = F.pieces.find(q => q.uid === e.src); if (p) { n++; if (![p.cell].concat(T.nbrs(p.cell)).includes(e.cell)) far++; } } }); F.ev.length = 0; } ok(n > 0, '알이 깨지 않았다'); ok(far === 0, '알이 곁이 아닌 칸에 깨어났다 ' + far); }
console.log(bad ? '틀림 ' + bad : '새 판 규칙: 모두 맞음'); process.exit(bad ? 1 : 0);
