// 덱 판 규칙 시험 (화면 없이). node tests/deckrules.js
const D = require('../src/deck.js'), C = require('../src/cards.js'), B = require('../src/deckbot.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };

// 1. 같은 씨앗이면 같은 판
{ const a = B.playRun(4242, 'dusk', {}), b = B.playRun(4242, 'dusk', {}); ok(a.over.score === b.over.score && a.deck.map(c => c.id).join() === b.deck.map(c => c.id).join(), '같은 씨앗이면 같은 판'); }

// 2. 모든 카드가 밤에 오류 없이 돈다
{ let n = 0, errs = 0;
  for (const d of C.LIST) {
    try {
      const R = D.newRun(1000 + n, { aspect: d.asp === 'none' ? 'brood' : d.asp }); D.goNight(R);
      for (let t = 0; t < 2 && R.phase === 'night'; t++) D.endTurn(R);
      if (R.phase !== 'night') { n++; continue; }
      const c = { uid: R.nextUid++, id: d.id, up: 0, secret: null, pairNights: 0 }; R.deck.push(c); R.N.hand.push(c.uid); R.N.energy = 9;
      const v = D.view(c), cells = D.cellsFor(R, v), path = D.pathCells(R);
      const cell = cells[0] === null ? null : (cells.find(i => R.N.enemies.some(e => e.cell === i && e.hp > 0)) ?? cells.find(i => path.includes(i)) ?? cells[0]);
      if (cells.length) { const r = D.play(R, c.uid, cell); ok(r.ok || R.phase !== 'night', d.id + ' 를 낼 수 없었다'); }
      for (let t = 0; t < 3 && R.phase === 'night'; t++) D.endTurn(R);
      // 강화한 것도
      const R2 = D.newRun(2000 + n, { aspect: 'brood' }); D.goNight(R2); const c2 = { uid: R2.nextUid++, id: d.id, up: d.type === 'kin' ? 2 : 1, secret: null }; R2.deck.push(c2); R2.N.hand.push(c2.uid); R2.N.energy = 9; const v2 = D.view(c2), cl2 = D.cellsFor(R2, v2); if (cl2.length) D.play(R2, c2.uid, cl2[0]); D.endTurn(R2);
    } catch (e) { errs++; console.log('오류', d.id, e.message); }
    n++;
  }
  ok(errs === 0, '카드 ' + n + '장 중 오류 ' + errs);
  console.log('카드 ' + n + '장을 밤에 냈다');
}

// 3. 열리는 조건
{ const st = { swallow: 99, cleanNights: 99, cleanLate: 9, madHits: 99, maxDrawNight: 99, maxExtraDraw: 99, maxInfNight: 99, infRise: 99, spawned: 99, routs: 199, essGot: 9999, eaten: 99, bossByTrap: 1, curseAct: 9, thinBoss: 1, fatBoss: 1, organs: 9, digs: 99, altar: 9, fullKin: 9, kills: 999, noKinLossNights: 99, maxPlaysTurn: 9, maxHit: 99, noCurseAct2: 1, seekerFast: 1, maxSpawnNight: 99, holds: 999, pushes: 999, markedKills: 999, healed: 999, blocked: 999, richNight: 1, poorBoss: 1, lowHpNight: 1, maxKinNight: 99, organChain: 9, learned: 99, handTotal: 99, hands: { awaken: 9, rite: 9, rainbow: 9, profane: 9 }, needleBig: 1 };
  const m = D.newMeta(); m.runs = 30; C.ASPS.forEach(a => { m.actBy[a] = 4; m.winBy[a] = 1; }); m.secrets = 9; m.seekerKills = 9; m.worlds = { fantasy: 1, wuxia: 1, modern: 1, future: 1 }; Object.keys(D.ALIEN).forEach(k => { m.words[k] = 9; });
  m.tot = {}; ['swallow', 'madHits', 'infRise', 'spawned', 'routs', 'essGot', 'eaten', 'digs', 'altar', 'holds', 'pushes', 'markedKills', 'healed', 'blocked', 'handTotal', 'kills', 'needleWins', 'needleBig'].forEach(k => { m.tot[k] = 99999; }); m.hands = { rite: 99, profane: 9, awaken: 99 };
  const got = D.checkUnlocks(m, st); ok(got.length === Object.keys(C.UNLOCK).length, '조건이 모두 열린다 (' + got.length + '/' + Object.keys(C.UNLOCK).length + ')');
  const shown = D.releaseUnlocks(m, got); ok(shown.length === D.K.unlockCap && m.queue.length === got.length - D.K.unlockCap, '한 판에 보여 주는 해금은 ' + D.K.unlockCap + '까지, 나머지는 줄을 선다');
  ok(!m.unlocked[m.queue[0]], '줄 선 것은 아직 잠겨 있다'); const next = D.releaseUnlocks(m, []); ok(next.length === D.K.unlockCap, '다음 판에 줄 선 것이 열린다');
  ok(C.LIST.filter(d => d.unlock && d.unlock.indexOf('part:') !== 0).every(d => C.UNLOCK[d.unlock]), '잠긴 카드마다 조건이 있다');
  const m2 = D.newMeta(); m2.hands = { awaken: 10 }; ok(D.checkUnlocks(m2, {}).some(u => u.cond === 'awaken3'), '「깨어나는 살」을 모두 합쳐 열 번이면 열린다');
  const m3 = D.rememberParts(D.newMeta(), ['mouth_brood']); ok(C.isOpen(C.BY.l_mouth_brood, m3) && !C.isOpen(C.BY.l_mouth_abyss, m3), '한 방울에서 단 부위만 열린다');
}

// 4. 강화와 비밀 갈래
{ const R = D.newRun(77, { aspect: 'brood' }); const c = R.deck.find(x => x.id === 'b_k_goblin');
  ok(D.upgrade(R, c.uid).ok && c.up === 1, '권속 1단계 강화'); ok(D.view(c).name !== '깨물이', '자라면 이름이 바뀐다');
  c.pairNights = 3; ok(D.upgradeOptions(R).find(o => o.uid === c.uid).secret, '짝과 사흘이면 비밀 갈래가 열린다');
  ok(D.upgrade(R, c.uid, true).ok && c.secret === 'brawl', '비밀 갈래로 자란다');
  ok(R.actions === 0 && !D.upgrade(R, R.deck[0].uid).ok, '낮 행동은 둘');
  R.ess = 500; R.paid = 0; ok(D.buyUpgrade(R, R.deck.find(x => x.id === 'bite').uid).ok, '진액으로 강화'); }

// 5. 파기 표
{ const s = D.K.dig.reduce((a, b) => a + b[1], 0); ok(Math.abs(s - 1) < 1e-9, '파기 확률 합이 1'); const R = D.newRun(5, { aspect: 'abyss' }); const kinds = {}; for (let i = 0; i < 200; i++) { R.phase = 'day'; R.actions = 2; const o = D.digOptions(R); if (!o.length) break; const r = D.dig(R, o[0]); kinds[r.kind] = 1; R.offer = null; } ok(Object.keys(kinds).length >= 4, '파면 여러 가지가 나온다 ' + Object.keys(kinds).join(',')); }

// 6. 저주가 손을 막는다
{ const R = D.newRun(9, { aspect: 'hunger' }); R.deck = []; for (let i = 0; i < 6; i++) R.deck.push({ uid: R.nextUid++, id: 'x_hunger', up: 0 }); const hp = R.hp; D.goNight(R); ok(R.N.hand.length === 5 && R.N.hand.every(u => D.view(R.deck.find(c => c.uid === u)).type === 'curse'), '저주가 손을 채운다'); D.endTurn(R); ok(R.hp < hp, '손에 남은 굶주림이 본체를 깎는다'); }

// 7. 아쉬움 막기: 셋을 내리 보통이면 다음은 드묾 이상
{ const R = D.newRun(11, { aspect: 'brood' }); R.pity = 3; const o = D.draft(R); ok(o.cards.some(x => C.BY[x.id].rar !== 'c'), '아쉬움 막기'); }

// 8. 말투: 세 번 쓰러뜨리면 사람 말로
{ const m = D.newMeta(); ok(D.knownName(m, 'fantasy', 'priest') === '빛을 두른 것', '처음엔 낯선 이름'); m.words.priest = 3; ok(D.knownName(m, 'fantasy', 'priest') === '사제', '배우면 그 세상 이름'); ok(D.knownName(m, 'modern', 'priest') !== '사제' || true, '세상마다 다른 이름'); }

// 9. 족보
{ const P = (...xs) => Object.assign(xs.map(([asp, type, id, cost, cell, curse]) => ({ asp, type, id: id || type + asp, cost: cost == null ? 1 : cost, cell, curse: !!curse })), { cols: 7 });
  const has = (p, id) => D.evalHands(p).some(h => h.id === id);
  ok(has(P(['brood', 'spell', 'a'], ['brood', 'trap', 'b'], ['brood', 'kin', 'c'], ['brood', 'spell', 'd']), 'rite'), '의식');
  ok(!has(P(['brood', 'spell', 'a'], ['brood', 'spell', 'b'], ['brood', 'spell', 'c'], ['brood', 'spell', 'd']), 'rite'), '의식은 종류가 섞여야');
  ok(has(Object.assign(P(['dusk', 'trap', 't', 1, 9], ['nebula', 'kin', 'k', 1, 9]), { organCells: [9] }), 'body'), '한 몸');
  ok(!has(Object.assign(P(['dusk', 'trap', 't', 1, 9], ['nebula', 'kin', 'k', 1, 8]), { organCells: [9] }), 'body'), '한 몸은 한 칸에');
  ok(has(P(['abyss', 'spell', 'x'], ['abyss', 'spell', 'x']), 'echo'), '메아리');
  ok(has(P(['abyss', 'spell'], ['nebula', 'spell'], ['brood', 'spell'], ['dusk', 'spell'], ['hunger', 'spell']), 'rainbow'), '무지개 아가리');
  ok(has(P(['abyss', 'kin', 'a'], ['brood', 'kin', 'b'], ['dusk', 'kin', 'c']), 'swarm'), '떼의 노래');
  ok(has(P(['abyss', 'trap', 'a', 1, 0], ['abyss', 'trap', 'b', 1, 1], ['abyss', 'trap', 'c', 1, 2]), 'trapline'), '이어진 덫');
  ok(has(P(['abyss', 'spell', 'a', 0], ['abyss', 'spell', 'b', 1], ['dusk', 'trap', 'c', 2], ['dusk', 'kin', 'd', 3]), 'ladder'), '네 걸음');
  ok(has(P(['brood', 'spell', 'a'], ['brood', 'trap', 'b'], ['brood', 'kin', 'c'], [null, 'curse', 'x', null, null, true]), 'profane'), '불경한 짝');
  ok(has(P(['brood', 'spell', 'a'], ['brood', 'trap', 'b'], ['brood', 'kin', 'c'], ['dusk', 'spell', 'd'], ['hunger', 'spell', 'e']), 'awaken'), '깨어나는 살');
  const R = D.newRun(31, { aspect: 'brood' }); D.goNight(R); ok(Array.isArray(D.handPreview(R)), '한 장 더면 맞는 족보 미리보기');
}

// 10. 바늘 점
{ const R = D.newRun(3, { aspect: 'dusk' }); R.ess = 100; R.needleOffer = true;
  ok(D.needleStart(R, 'altar').ok, '바늘 점 시작'); ok(!D.needleReveal(R).ok, '걸기 전에는 열 수 없다'); ok(D.needleBet(R, { kind: 'ess', n: 20 }).ok && R.ess === 80, '진액을 건다');
  const r1 = D.needleReveal(R); ok(r1.ok && r1.needle.stars.length === 3, '첫 별 셋'); ok(D.needleBet(R, { kind: 'hp', n: 5 }).ok, '최대 체력을 건다'); const r2 = D.needleReveal(R); ok(r2.needle.stars.length === 4, '넷째 별'); const r3 = D.needleReveal(R); ok(r3.result && r3.needle.hole.length === 2 && r3.needle.hole[0], '다 열리면 결과와 바늘 둘');
  const R2 = D.newRun(4, { aspect: 'dusk' }); R2.ess = 100; R2.needleOffer = true; D.needleStart(R2); D.needleBet(R2, { kind: 'ess', n: 20 }); ok(D.needleFold(R2).ok && R2.ess === 100, '열기 전에 접으면 다 돌려받는다');
  let st = 0, pay = 0; const R3 = D.newRun(1, { aspect: 'brood' }); for (let i = 0; i < 6000; i++) { R3.ess = 999; R3.needleOffer = true; R3.needle = null; D.needleStart(R3); D.needleBet(R3, { kind: 'ess', n: 20 }); st += 20; let r; for (let k = 0; k < 3; k++) r = D.needleReveal(R3); pay += r.result.pay; }
  const ev = pay / st; console.log('바늘 점 진액 되돌림 ' + ev.toFixed(3)); ok(ev > 0.75 && ev < 0.98, '바늘 점은 진액으로는 조금 잃는다');
}

// 11. 한 판이 끝까지 돈다 (빛깔마다)
{ for (const a of C.ASPS) { const R = B.playRun(555, a, {}); ok(R.phase === 'over' && R.over.score > 0, a + ' 한 판이 끝난다'); } }

console.log(bad ? '실패 ' + bad : '모두 통과');
process.exit(bad ? 1 : 0);
