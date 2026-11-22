// 주문 하나하나의 값: 그 주문을 아는 판에서, 그 주문만 쓸 때와 손을 안 쓸 때의 클리어율을 같은 씨앗으로 견준다
// node tests/spellworth.js [판 수] [난이도] [주문...]
const S = require('../src/logic.js'), STEWARD = require('../src/steward.js');
const N = +(process.argv[2] || 200), DIFF = +(process.argv[3] || 2), ids = process.argv.slice(4).length ? process.argv.slice(4) : S.SPELL_IDS;
function play(seed, st, watch) {
  const asp = S.ASPECTS[seed % 5], G = S.newGame(seed, asp, { diff: DIFF, prologue: S.proResult(asp, 'avg'), origin: 'drop', star: 'none' });
  if (KNOW && watch && !S.SPELL[watch].free) G.hand = [watch];   // 잴 주문을 먼저 쥔다
  const o = { seen: 0, ok: 0, used: 0 }, dec = STEWARD.decide(st);
  const wrap = ctx => { const x = (ctx.opts || []).find(y => y.id === watch); if (x) { o.seen++; if (x.ok) o.ok++; } const a = dec(ctx); if (a && a.k === watch) o.used++; return a; };
  let guard = 0;
  while (!G.over && guard++ < 60) { STEWARD.tasks(S, G, st, { seed, ban: [] }).forEach(t => t()); if (G.sealed && S.paths(G).length) S.breach(G); S.endDay(G, wrap); }
  o.win = !!(G.over && G.over.win); return o;
}
const base = { captive: 'mix', raid: 1, spend: 1 }, rows = [];
const KNOW = !!process.env.KNOW, SMART = !!process.env.SMART;   // SMART=1: 자동 플레이어의 보통 판단으로 그 주문 하나만 쓴다 (다른 주문은 막는다)   // KNOW=1: 그 주문을 첫날부터 아는 것으로 두고 잰다 (모든 판)
for (const id of ids) {
  S.K.know = KNOW ? [id] : null;
  let known = 0, w1 = 0, w0 = 0, seen = 0, ok = 0, used = 0;
  for (let s = 1; s <= N; s++) {
    const seed = s * 7919 + 13, a = play(seed, Object.assign({}, base, SMART ? { banSp: S.SPELL_IDS.filter(x => x !== id) } : { only: id }), id);
    if (!a.seen) continue;
    const b = play(seed, Object.assign({}, base, SMART ? { banSp: S.SPELL_IDS.slice() } : { nohand: true }), id);
    known++; w1 += a.win; w0 += b.win; seen += a.seen; ok += a.ok; used += a.used;
  }
  const pc = x => known ? Math.round(100 * x / known) : 0;
  rows.push([S.SPELL[id].name, known, pc(w1) - pc(w0), known ? (used / known).toFixed(1) : 0, seen ? Math.round(100 * ok / seen) : 0]);
  console.log(`${(S.SPELL[id].name + '      ').slice(0, 5)} 아는 판 ${String(known).padStart(3)}/${N} | 값 ${(pc(w1) - pc(w0) >= 0 ? '+' : '') + (pc(w1) - pc(w0))}%p (${pc(w0)}→${pc(w1)}) | 판당 ${known ? (used / known).toFixed(1) : 0}번 | 쓸 수 있던 때 ${seen ? Math.round(100 * ok / seen) : 0}%`);
}
