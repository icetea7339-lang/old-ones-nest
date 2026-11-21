// 카드로 짓는 판의 규칙 시험.  node tests/cardrules.js
const S = require('../src/logic.js'), CM = require('../src/cardmode.js'), CD = require('../src/cards2.js'), B = require('../src/cardbot.js'), STEWARD = require('../src/steward.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const allMeta = () => { const m = CM.newMeta(); Object.keys(CD.UNLOCK).forEach(id => { m.unlocked[id] = 1; }); return m; };

// 1. 같은 씨앗이면 같은 판
{ const a = B.play(12345, 'brood', 2, '', CM.newMeta()), b = B.play(12345, 'brood', 2, '', CM.newMeta()); ok(a.G.day === b.G.day && a.over.score === b.over.score && a.deck.length === b.deck.length, '같은 씨앗이면 같은 판이다'); }

// 2. 카드가 하나도 빠짐없이 낮과 밤에 돈다
{
  let errs = 0, played = 0, cast = 0;
  CD.LIST.forEach((d, n) => {
    try {
      const R = CM.newRun(1000 + n, { aspect: d.asp === 'none' ? 'abyss' : d.asp, meta: allMeta() }), G = R.G; G.gold = 9999; G.faith = 99;
      // 둥지를 조금 넓혀 둔다
      ['sh_three', 'sh_bend'].forEach(id => { const c = CM.addCard(R, id); R.hand.push(c.uid); const p = CM.shapePlacements(R, CD.BY[id]); if (p.length) CM.play(R, c.uid, { cells: p[0].cells }); });
      const c = CM.addCard(R, d.id); R.hand.push(c.uid); CM.syncHeld(R);
      if (d.type === 'skill') { G.march.tonight = { vill: S.VIDS ? S.VIDS[0] : 'field', settle: false }; const r = CM.endDay(R, ctx => { const o = (ctx.opts || []).find(x => x.id === d.spell && x.ok); return o ? { k: o.id, u: ctx.tough, from: (o.targets || [])[0] } : { k: 'none' }; }); if (r.ok) cast += (G.stats.skills || 0) > 0 ? 1 : 0; }
      else { const v = CM.handView(R).find(h => h.uid === c.uid), tgt = v.target === 'shape' ? { cells: (v.places || [])[0] } : v.target === 'cell' ? { cell: (v.cellsCan || [])[0] } : {}; const r = CM.play(R, c.uid, tgt); if (r.ok) played++; G.march.tonight = G.march.tonight || null; CM.endDay(R, () => ({ k: 'none' })); }
    } catch (e) { errs++; if (errs <= 3) console.log(d.id, e.stack.split('\n').slice(0, 3).join(' | ')); }
  });
  ok(!errs, '모든 카드가 오류 없이 돈다 (' + errs + '장 오류)'); console.log('카드 ' + CD.LIST.length + '장 · 낮에 낸 것 ' + played + ' · 밤에 쓴 기술 ' + cast);
}

// 3. 굴 모양: 판 칸과 맞닿고, 안 판 칸만, 격자 안
{
  const R = CM.newRun(77, { aspect: 'nebula' }), G = R.G; let good = true;
  CD.LIST.filter(d => d.type === 'shape' && d.cells).forEach(d => CM.shapePlacements(R, d).forEach(p => { if (p.cells.length !== d.cells.length || p.cells.some(i => i < 0 || i >= G.cells.length || G.cells[i].dug) || !p.cells.some(i => S.nbrs(G, i).some(j => G.cells[j].dug && !p.cells.includes(j)))) good = false; }));
  ok(good, '굴 모양은 판 칸에 닿고 안 판 칸에만 놓인다');
  const big = CM.shapePlacements(R, CD.BY.sh_big)[0]; if (big) { const rows = big.cells.map(i => Math.floor(i / G.cols)), cols = big.cells.map(i => i % G.cols); ok(Math.max(...rows) - Math.min(...rows) === 1 && Math.max(...cols) - Math.min(...cols) === 1, '큰 방은 2×2 이다 (줄을 넘어가지 않는다)'); }
}

// 4. 배치 족보
{
  const R = CM.newRun(88, { aspect: 'brood' }), G = R.G; G.gold = 9999;
  const p = CM.shapePlacements(R, CD.BY.sh_three).find(x => x.cells.every(i => Math.floor(i / G.cols) === Math.floor(x.cells[0] / G.cols)));
  p.cells.forEach(i => S.cardDig(G, i)); p.cells.forEach(i => S.cardBuild(G, i, 'post', 'brood'));
  ok(S.cardCombos(G).some(c => c.id === 'ritual'), '같은 빛깔 기관 셋이 이어지면 「한 빛깔의 의식」');
  const i = p.cells[0]; S.cardTrap(G, i, { kind: 'maw', lv: 1 }); S.cardKin(G, 'goblin'); G.kin[G.kin.length - 1].loc = i;
  ok(S.cardCombos(G).some(c => c.id === 'onebody'), '기관 칸에 함정과 권속이 함께면 「한 몸」');
  ok(S.cardCmbEffects(G).trap[i] > 1, '족보가 그 칸 함정을 세게 한다');
}

// 5. 괴물 몸 함정이 실제 밤에 터진다, 감염체가 일어난다
{
  let sw = 0, inf = 0, egg = 0, dig = 0;
  for (let s = 1; s <= 40; s++) { const R = B.play(s * 31 + 7, ['hunger', 'brood', 'brood', 'hunger'][s % 4], 2, '', allMeta()); sw += R.G.stats.swallows || 0; inf += R.st.infRise; egg += R.G.stats.spawns || 0; dig += (R.G.stats.income || {})['소화'] || 0; }
  ok(sw > 0, '바닥 아가리가 삼킨다 (' + sw + ')'); ok(inf > 0, '감염체가 일어난다 (' + inf + ')'); ok(egg > 0, '알주머니가 터진다 (' + egg + ')'); ok(dig > 0, '소화액이 진액을 낸다 (' + dig + ')');
}

// 6. 옛 짓기는 카드 판에서 막힌다, 자유 판은 그대로
{ const R = CM.newRun(5, { aspect: 'dusk' }), G = R.G, e = G.cells.findIndex((c, i) => !c.dug && S.nbrs(G, i).some(j => G.cells[j].dug)); ok(!S.dig(G, e).ok && !S.build(G, G.ent, 'post').ok, '카드 판에서는 진액으로 파고 짓지 못한다');
  const F = S.newGame(5, 'dusk', {}); ok(!F.cardMode && S.addTrap(F, 0, 'maw').ok === false, '괴물 몸 함정은 자유 판에서 진액으로 달 수 없다'); }

// 7. 해금: 한 판에 여덟까지, 나머지는 줄
{ const m0 = CM.newMeta(); m0.runs = 1; ok(CM.releaseUnlocks(m0, Object.keys(CD.UNLOCK).slice(0, 20)).length === 4, '첫 판은 넷까지만 연다 (판마다 하나씩 늘어 여덟까지)');
  const m = CM.newMeta(); m.runs = 10; const fresh = Object.keys(CD.UNLOCK).slice(0, 20), out = CM.releaseUnlocks(m, fresh); ok(out.length === CM.K.unlockCap && m.queue.length === 12, '한 판에 여는 것은 ' + CM.K.unlockCap + '까지, 나머지는 줄을 선다'); const out2 = CM.releaseUnlocks(m, []); ok(out2.length === 8 && m.queue.length === 4, '줄 선 것은 다음 판에 열린다');
  const st = { win: true, deckN: 12 }; const m2 = CM.newMeta(); m2.tot = { swallow: 25 }; const got = CM.checkUnlocks(m2, st); ok(got.includes('swallow_0') && got.includes('thin_win'), '조건이 맞으면 열린다'); }

// 8. 바늘 점: 진액으로만 걸면 돌아오는 값이 0.75~0.98
{ let put = 0, back = 0; const R = CM.newRun(9, { aspect: 'abyss' }); for (let k = 0; k < 20000; k++) { R.G.gold = 1000; R.needleOffer = true; R.needlePity = 0; CM.needleStart(R); const g0 = R.G.gold; CM.needleBet(R, { kind: 'ess', n: 10 }); const st = g0 - R.G.gold; put += st; const gb = R.G.gold; for (let j = 0; j < 3 && R.needle; j++) CM.needleReveal(R); back += R.G.gold - gb; }
  const ev = back / put; console.log('바늘 점 돌아오는 값 ' + ev.toFixed(3)); ok(ev > 0.75 && ev < 0.98, '바늘 점은 살짝 손해지만 크게 터질 때가 있다'); }

// 9. 말 배우기
{ const m = CM.newMeta(); ok(CM.knownName(m, 'fantasy', 'priest') === '빛을 두른 것', '처음엔 낯선 이름'); m.words.priest = CM.K.words; ok(CM.knownName(m, 'fantasy', 'priest') !== '빛을 두른 것', '세 번 넘기면 사람 말로 부른다'); }

// 10. 손: 아침마다 다섯 장, 남기는 것은 둘까지
{ const R = CM.newRun(321, { aspect: 'nebula' }); ok(R.hand.length === 5, '아침에 다섯 장'); const keep = R.hand.slice(0, 3); R.G.march.tonight = null; CM.endDay(R, () => ({ k: 'none' }), keep); if (R.phase === 'reward') CM.skipReward(R); ok(R.hand.length <= 5 + 2, '남기는 것은 둘까지 (손 ' + R.hand.length + ')'); }

// 11. 게놈 준비: 꼬리표, 변이 갈고리, 몸의 버릇
{ ok(CD.LIST.every(d => Array.isArray(d.tags) && d.tags.length), '모든 카드에 꼬리표가 있다');
  let T = null; try { T = require('/home/user/slime-ipo-design/proto/src/traits.js'); } catch (e) { T = null; }
  if (T) { ok(CD.LIST.every(d => d.tags.every(t => T.TAG_IDS.includes(t))), '꼬리표는 몸 생성기의 22가지 안에 있다'); ok(Object.keys(T.COUNTERS).every(k => CM.COUNTERS.includes(k)), '몸의 버릇 이름이 몸 생성기와 같다'); }
  const R = B.play(4242, 'brood', 2, '', allMeta()), bh = CM.behaviour(R); ok(bh.kinKills + bh.coreKills > 0 && Object.keys(bh.cardsBy).length >= 3 && Object.keys(bh.cmb).length, '몸의 버릇이 쌓인다 (권속 처치 ' + bh.kinKills + ', 본체 처치 ' + bh.coreKills + ')');
  const R2 = CM.newRun(55, { aspect: 'hunger' }); CM.registerMutator((c, d) => d.id === 'tr_maw' ? 'tr_spore_hunger' : null); const ch = CM.mutateDeck(R2); CM.clearMutators(); ok(ch.length === 1 && R2.deck.some(c => c.id === 'tr_spore_hunger' && c.from === 'tr_maw'), '변이 갈고리가 꼬리표로 카드를 바꾼다'); }

console.log(bad ? '실패 ' + bad : '모두 통과');
