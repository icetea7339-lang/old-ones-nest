// 어디서 그만두는지 남기는 기록. claude.ai 안에서 연 판에서만 쓴다(CLOUD 가 있을 때). 개인 정보는 없다: 몇 번째 싸움인지, 준비인지 싸움인지, 끝난 까닭뿐.
// 기록은 runs/<보는 사람의 불투명한 id> 문서 하나에 쌓인다. 읽기는 주인(관리자)만. 설정에서 끌 수 있다(META.trace === false).
const TRACE = { last: 0, busy: false };
const traceOn = () => typeof CLOUD !== 'undefined' && CLOUD && META.trace !== false;
function traceSnap(extra) {
  let R = null, phase = 'title'; try { const lr = $('lr'); if (lr && !lr.hidden && LU.R) { R = LU.R; phase = LU.phase; } } catch (e) { R = null; }
  return Object.assign({ t: Date.now(), sv: SAVE_V, mode: R ? 'lair' : 'title', round: R ? R.round : null, rounds: R ? R.rounds : null, phase, hp: R ? R.hp : null, level: R ? R.level : null }, extra || {});
}
async function traceWrite(fn) {
  if (!traceOn() || TRACE.busy) return; TRACE.busy = true;
  try { const ref = CLOUD.db.doc('runs/' + CLOUD.uid), cur = await ref.get(), d = cur.exists ? cur.data() : {}; const nd = fn(d || {}); if (nd) await ref.set(nd); } catch (e) { /* 기록이 안 되어도 게임은 계속한다 */ }
  TRACE.busy = false;
}
// 지금 어디쯤인지: 싸움이 끝날 때마다, 화면을 떠날 때. 마지막 것만 남긴다
function traceLive(extra) { const now = Date.now(); if (now - TRACE.last < 4000 && !(extra && extra.start)) return; TRACE.last = now; traceWrite(d => Object.assign({}, d, { live: traceSnap(extra), seen: (d.seen || 0) + (extra && extra.start ? 1 : 0) })); }
// 판이 끝났을 때: 최근 40개까지 쌓는다
function traceEnd(kind, extra) { traceWrite(d => { const runs = (Array.isArray(d.runs) ? d.runs : []).concat([traceSnap(Object.assign({ end: kind }, extra || {}))]).slice(-40); return Object.assign({}, d, { runs, live: null }); }); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { TRACE.last = 0; traceLive({ left: true }); } });
