// 시험용 놀이 성향: 셈 두세 개를 크게, 나머지는 조금. 같은 씨앗이면 같은 성향
function profiles(T, n, seed0) {
  const keys = Object.keys(T.COUNTERS), out = [];
  for (let i = 0; i < n; i++) {
    const r = T.rng(T.hash('prof' + (seed0 || 0) + ':' + i)), c = {};
    for (const k of keys) if (r() < 0.35) c[k] = Math.floor(r() * 6);
    const big = 2 + Math.floor(r() * 3);
    for (let b = 0; b < big; b++) { const k = keys[Math.floor(r() * keys.length)]; c[k] = (c[k] || 0) + Math.floor(10 + r() * (k === 'coreDamage' ? 500 : 45)); }
    const aspect = T.ASPS[i % 5], sub = r() < 0.5 ? T.ASPS[Math.floor(r() * 5)] : null, stage = 1 + (i % 5);
    const g = T.newGenome({ aspect, sub: sub === aspect ? null : sub, stage, seed: 1000 + i * 7919 + (seed0 || 0) });
    T.addBehaviour(g, c); out.push({ g, c });
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = { profiles };
