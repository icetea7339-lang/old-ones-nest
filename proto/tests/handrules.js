// 손 주문과 방 정리의 규칙 시험 (화면 없이): 옛 저장 옮기기, 빈손으로 밤 보내기, 쥐기/내려놓기, 모든 주문을 한 번씩 써 보기
const S = require('../src/logic.js'), STEWARD = require('../src/steward.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패:', m); } };
// 1) 옛 저장: 없어진 방은 합쳐진 방으로, 자리가 없으면 진액으로
{ const G = S.newGame(7, 'hunger', { diff: 1 }); const cs = G.cells.filter((c, i) => i !== S.CORE).slice(0, 5); cs.forEach(c => { c.dug = true; });
  cs[0].type = 'persuade'; cs[1].type = 'ritual'; cs[2].type = 'table'; cs[3].type = 'mirror'; cs[4].type = 'altar'; const g0 = G.gold; S.migrate(G);
  ok(cs[0].type === 'chapel' && cs[2].type === 'abattoir' && cs[3].type === 'empty' && cs[1].type === 'empty' && cs[4].type === 'altar', '옛 방 옮기기 ' + cs.map(c => c.type).join(','));
  ok(G.gold > g0, '자리가 없는 방은 진액으로 돌려준다'); ok(!G.cells.some(c => !S.ROOM[c.type]), '모르는 방이 남았다'); }
// 2) 쥐기와 내려놓기
{ const G = S.newGame(11, 'dusk', { diff: 1 }); const h0 = S.handOf(G); ok(h0.includes('whip') && h0.includes('move') && h0.includes('rock') && h0.includes('mark'), '처음 손 ' + h0.join(','));
  ok(S.setHand(G, 'rock').ok && !S.handOf(G).includes('rock'), '내려놓기'); ok(!S.setHand(G, 'phantom').ok, '모르는 주문은 못 쥔다'); ok(S.setHand(G, 'rock').ok && S.handOf(G).includes('rock'), '다시 쥐기');
  G.slime.main = 'dusk'; G.slime.stage = 2; G.slime.sub = 'abyss'; ok(S.spellKnown(G, 'phantom') && S.spellKnown(G, 'charm') && !S.spellKnown(G, 'wave'), '허물로 배우는 주문'); ok(S.handSlots(G) === 4, '둘째 허물부터 자리 넷'); }
// 3) 빈손(주문을 하나도 쥐지 않음)과, 주문 하나만 쓰는 판이 끝까지 돈다
const play = (seed, st, prep) => { const asp = S.ASPECTS[seed % 5], G = S.newGame(seed, asp, { diff: 1, prologue: S.proResult(asp, 'avg') }); let n = 0; if (prep) prep(G);
  while (!G.over && n++ < 60) { STEWARD.tasks(S, G, st, { seed }).forEach(f => f()); if (G.sealed && S.paths(G).length && (G.under || 0) >= 1) S.breach(G); S.endDay(G, STEWARD.decide(st)); } return G; };
{ const G = play(101, { captive: 'mix', raid: 1, spend: 1 }, g => { g.hand = []; g.handSet = true; }); ok(G.over, '빈손으로 끝까지'); ok(S.handOf(G).length === 2, '빈손이면 채찍과 옮기기뿐'); }
const used = {};
for (const id of S.SPELL_IDS) for (let s = 1; s <= 12; s++) { const G = play(s * 31 + 5, { captive: 'mix', raid: 1, spend: 1, only: id }); ok(G.over, id + ' 판이 끝나지 않았다'); if ((G.stats.spells || {})[id]) used[id] = (used[id] || 0) + G.stats.spells[id]; }
const never = S.SPELL_IDS.filter(id => !used[id]); console.log('쓴 횟수', S.SPELL_IDS.map(id => S.SPELL[id].name + ' ' + (used[id] || 0)).join(' · '));
// 5) 주문마다 판을 차려 놓고 한 밤에 직접 써 본다 (그 주문이 통하는 자리가 올 때까지 방마다 시도)
const tryOne = id => { const d = S.SPELL[id];
  for (let seed = 3; seed < 40; seed++) {
    const asp = d.asp || 'abyss', G = S.newGame(seed, asp, { diff: 1, prologue: S.proResult(asp, 'avg') }); for (let n = 0; n < 3; n++) { STEWARD.tasks(S, G, { captive: 'mix', raid: 0, spend: 1 }, { seed }).forEach(f => f()); if (G.sealed && S.paths(G).length) S.breach(G); S.endDay(G, () => ({ k: 'none' })); if (G.over) break; }
    if (G.over) continue; G.slime.main = asp; G.slime.stage = 2; G.slime.sub = asp === 'abyss' ? 'dusk' : 'abyss'; G.slime.body = d.body || null; if (d.mut && !G.slime.muts.includes(d.mut)) G.slime.muts.push(d.mut); G.faith = 40; G.gold += 2000;
    const path = S.paths(G)[0].filter(i => i !== S.CORE); path.forEach((i, k) => { G.cells[i].type = ['post', 'trap', 'hall'][k % 3]; if (G.cells[i].type === 'trap') G.cells[i].traps = [{ kind: 'spike', lv: 1 }]; });
    const side = []; for (let i = 0; i < S.N; i++) if (!G.cells[i].dug && !S.canDig(G, i)) side.push(i); ['chapel', 'prison', 'altar'].forEach((t, k) => { if (side[k] != null) { G.cells[side[k]].dug = true; G.cells[side[k]].type = t; } });
    for (let k = 0; k < 6; k++) G.kin.push({ id: G.nextId++, name: '시험', kind: k % 2 ? 'goblin' : 'skeleton', lv: 2, exp: 0, loc: null, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold' }); S.autoPlace(G); for (let k = 0; k < 4; k++) G.corpses.push({ kind: 'militia' });
    if (!S.spellKnown(G, id)) return 'unknown'; G.hand = [id]; G.handSet = true; G.march.tonight = { vill: 'field', settle: true };
    let seen = false; const r = S.endDay(G, ctx => { const o = ctx.opts.find(x => x.id === id); if (o) seen = true; return o && o.ok ? { k: id, u: ctx.tough, from: ctx.from[0] } : { k: 'none' }; });
    if ((G.stats.spells || {})[id]) return r && r.battle ? 'ok' : 'nobattle';
  }
  return 'never'; };
const res = S.SPELL_IDS.map(id => [id, tryOne(id)]); console.log('직접 써 보기', res.map(r => S.SPELL[r[0]].name + ':' + r[1]).join(' '));
ok(res.every(r => r[1] === 'ok'), '쓰지 못한 주문: ' + res.filter(r => r[1] !== 'ok').map(r => r[0] + '=' + r[1]).join(','));
// 4) 이름은 네 글자까지
ok(S.SPELL_IDS.every(id => S.SPELL[id].name.replace(/\s/g, '').length <= 4), '이름이 길다');
console.log(bad ? '실패 ' + bad : '모두 통과'); process.exit(bad ? 1 : 0);
