// 땅속의 한 방울: 화면 없이 봇으로 돌려 균형을 잰다.   node tests/prosim.js [판 수=25] [봇들=careless,nobuy,greedy,planned] [-v]
// 봇은 어둠 속의 것도 다 안다(사람보다 유리하다). 눈 부위의 값은 그래서 여기서는 재지 못한다.
const PRO = require('../src/prologue.js');
const N = +(process.argv[2] || 25), WHO = (process.argv[3] || 'careless,nobuy,greedy,planned').split(','), V = process.argv.includes('-v');
const TPS = PRO.TPS, ASPS = PRO.ASPS;

function census() {   // 고리마다 무엇이 사는가
  const sim = PRO.makeSim({ asp: 'abyss', seed: 7 }), out = [];
  for (let k = 1; k <= 5; k++) { const c = {}, f = {}; sim.S.cre.forEach(q => { if (q.ring === k) c[PRO.SP[q.k].name] = (c[PRO.SP[q.k].name] || 0) + 1; }); sim.S.food.forEach(q => { if (q.ring === k) f[PRO.FOOD[q.k].name] = (f[PRO.FOOD[q.k].name] || 0) + 1; }); f['꿈틀이'] = sim.S.wrig.filter(q => q.ring === k).length; out.push(k + ' ' + PRO.STG[k].name + ' | 사는 것: ' + Object.keys(c).map(n => n + ' ' + c[n]).join(', ') + ' | 먹이: ' + Object.keys(f).filter(n => f[n]).map(n => n + ' ' + f[n]).join(', ') + ' | 틈 ' + sim.S.crev.filter(q => q.ring === k).length); }
  return out.join('\n');
}

function play(kind, asp, seed) {
  const sim = PRO.makeSim({ asp, seed }), S = sim.S, P = sim.P, careful = kind !== 'careless', buys = kind === 'greedy' || kind === 'planned' || kind === 'planned_early';
  const log = { stageAt: [0, 0], deaths: [], firstBuy: 0 };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  let target = null, retarget = 0;
  const threatR = c => { const d = PRO.SP[c.k]; if (c.k === 'lurker') return c.mode === 'buried' ? 40 : 70; if (c.k === 'mimic') return c.mode === 'bait' ? 22 : 70; if (c.k === 'filter') return 200; if (c.k === 'mother') return 60; if (c.k === 'blind') return 70; if (c.k === 'charger') return c.mode === 'rest' ? 20 : 60; if (c.k === 'spitter') return 50; if (c.k === 'stalker') return 60; if (c.k === 'weaver') return 40; return Math.min(110, d.see * 0.8); };
  const plan = () => {   // 계획대로: 입 → 발 → 겉 → 속, 그다음 올린다. 그 자리에서 가장 넉넉한 빛깔의 것을 고른다
    const order = ['mouth', 'leg', 'mouth', 'skin', 'leg', 'core', 'mouth', 'skin', 'leg', 'core', 'eye'];
    const want = {}; for (const s of order) { want[s] = (want[s] || 0) + 1; const w = S.worn[s], have = w ? w.lv : 0; if (have >= want[s]) continue; if (S.stage < PRO.K.open[s]) continue;
      const cands = w ? [w.id] : ASPS.slice().sort((a, b) => S.purse[b] - S.purse[a]).map(a => s + '_' + a); for (const id of cands) { if (!sim.whyNot(id)) return id; } return null; }   // 차례가 안 되면 기다린다(모은다)
    return null;
  };
  for (let n = 0; n < 500 * TPS && !S.ended; n++) {
    const g = PRO.STG[S.stage];
    if (n % 6 === 0) {
      if (buys) { let id = null; if (kind === 'greedy') { const c = PRO.CAT.filter(d => !sim.whyNot(d.id) && !(S.worn[d.slot] && S.worn[d.slot].id !== d.id)).sort((a, b) => sim.priceOf(a.id) - sim.priceOf(b.id))[0]; id = c ? c.id : null; } else id = plan(); if (id && sim.buy(id) && !log.firstBuy) log.firstBuy = Math.round(S.t / TPS); }
      // 무엇이 위험한가
      let rx = 0, ry = 0, danger = 0, near = null;
      if (careful) {
        for (const c of S.cre) { if (!c.alive || c.ring > S.stage || !sim.hostile(c) || c.stun > 0) continue; const d = dist(c, P), R = threatR(c) + g.r + c.r; if (d < R) { const w = (R - d) / R; rx += (P.x - c.x) / (d || 1) * w * 2; ry += (P.y - c.y) / (d || 1) * w * 2; danger = Math.max(danger, w); if (!near || d < dist(near, P)) near = c; }
          if ((c.mode === 'aim' || c.mode === 'tell' || c.mode === 'dash' || c.mode === 'lunge') && (c.k === 'charger' || c.k === 'stalker')) { const lx = (c.tx || P.x) - c.x, ly = (c.ty || P.y) - c.y, L = Math.hypot(lx, ly) || 1, ux = lx / L, uy = ly / L, px = P.x - c.x, py = P.y - c.y, along = px * ux + py * uy, side = px * -uy + py * ux; if (along > -20 && along < 330 && Math.abs(side) < 30 + g.r) { const sgn = side >= 0 ? 1 : -1; rx += -uy * sgn * 3; ry += ux * sgn * 3; danger = Math.max(danger, 0.9); } } }
        for (const s of S.shots) { const d = Math.hypot(s.tx - P.x, s.ty - P.y); if (d < 34 + g.r) { rx += (P.x - s.tx) / (d || 1) * 2; ry += (P.y - s.ty) / (d || 1) * 2; danger = Math.max(danger, 0.6); } }
        if (!sim.acidOK()) for (const s of S.puddles) { const d = dist(s, P); if (d < 30 + g.r) { rx += (P.x - s.x) / (d || 1) * 2; ry += (P.y - s.y) / (d || 1) * 2; danger = Math.max(danger, 0.6); } }
        if (!sim.webOK()) for (const w of S.webs) { const d = dist(w, P); if (d < w.r + g.r + 8) { rx += (P.x - w.x) / (d || 1) * 0.9; ry += (P.y - w.y) / (d || 1) * 0.9; } }
        const sw = S.sweep; if (sw.st !== 'idle') { const px = P.x - sw.sx, py = P.y - sw.sy, side = px * -sw.dy + py * sw.dx; if (Math.abs(side) < sw.r + g.r + 26) { const sgn = side >= 0 ? 1 : -1; rx += -sw.dy * sgn * 4; ry += sw.dx * sgn * 4; danger = Math.max(danger, 0.95); } }
      }
      // 무엇을 먹으러 가나
      if (!target || !target.alive || n >= retarget || (target.gone && target.gone())) {
        let best = null, bs = 1e9; const m = sim.mouthLv(), cand = (o, val, kindK) => { const d = dist(o, P); if (d > 700) return; let s = (d + 30) / Math.max(0.5, val); if (careful) for (const c of S.cre) { if (c.alive && c.ring <= S.stage && sim.hostile(c) && c !== o && dist(c, o) < threatR(c) + c.r + 14) { s *= 6; break; } } if (s < bs) { bs = s; best = o; } };
        for (const f of S.food) { if (!f.alive || f.ring > S.stage) continue; const D = PRO.FOOD[f.k]; if (D.need && m < D.need) continue; if (D.bitter && !sim.bitterOK() && (careful || S.hp <= 1)) continue; if (f.k === 'cap' && S.hp >= sim.maxHp()) continue; let v = f.k === 'bead' ? 0.6 : f.k === 'cap' ? 6 : D.val * (D.tier <= S.stage - 3 ? 0.25 : D.tier <= S.stage - 2 ? 0.5 : 1); if (D.chew) v *= 0.8; cand(f, v); }
        for (const w of S.wrig) if (w.alive && w.ring <= S.stage) cand(w, 1.4);
        for (const c of S.cre) if (c.alive && c.ring <= S.stage && sim.canEat(c) && !(sim.hostile(c) && careful && !(c.stun > 0 || c.mode === 'rest'))) cand(c, PRO.SP[c.k].val * 0.9);
        target = best; retarget = n + 45;
      }
      let ax = 0, ay = 0; if (target) { const d = dist(target, P) || 1; ax = (target.x - P.x) / d; ay = (target.y - P.y) / d; }
      const blind = careful && S.cre.find(c => c.alive && c.k === 'blind' && c.ring <= S.stage && sim.hostile(c) && dist(c, P) < 330);
      if (careful && danger > 0.05) { const k = Math.min(1, danger * 2.2); ax = ax * (1 - k) + rx; ay = ay * (1 - k) + ry; }
      // 쫓기면 몸이 들어가는 틈으로 달아난다. 틈 안에서는 쫓던 것이 물러갈 때까지 기다린다
      if (careful) { const chased = S.cre.some(c => c.alive && c.ring <= S.stage && sim.hostile(c) && (c.mode === 'chase' || c.mode === 'out') && dist(c, P) < 150 && c.r > 4.2 && PRO.SP[c.k].sp >= g.sp); const cv = S.crev.filter(q => q.fit >= S.stage && q.ring <= S.stage).sort((a, b) => dist(a, P) - dist(b, P))[0];
        if (chased && cv && dist(cv, P) < 170) { const d = dist(cv, P); if (d < cv.r * 0.5) { ax = 0; ay = 0; } else { ax = (cv.x - P.x) / d + rx * 0.3; ay = (cv.y - P.y) / d + ry * 0.3; } } }
      const L = Math.hypot(ax, ay);
      if (blind && danger < 0.5 && dist(blind, P) < 300) sim.stop();                               // 눈먼 큰것 곁에서는 멈춘다
      else if (L > 0.01) sim.aim(P.x + ax / L * 60, P.y + ay / L * 60); else sim.stop();
      if (target && !danger && dist(target, P) < 20 && PRO.FOOD[target.k] && PRO.FOOD[target.k].chew) sim.aim(target.x, target.y);
      if (careful && buys && sim.actReady() && (danger > 0.55 || P.leech) && S.worn.leg && S.worn.leg.id !== 'leg_hunger') sim.act();
      if (buys && sim.actReady() && S.worn.leg && S.worn.leg.id === 'leg_hunger' && target && target.k && PRO.SP[target.k] && dist(target, P) < 80) sim.act();
      if (careful && buys && sim.lv('core_dusk') && P.cd2 <= 0 && danger > 0.6) sim.act();
    }
    const st0 = S.stage, d0 = S.stats.defeats; sim.tick(); if (S.stage !== st0) log.stageAt[S.stage] = Math.round(S.t / TPS);
    if (S.stats.defeats !== d0) { const e = sim.ev.slice().reverse().find(q => q.k === 'hurt'); log.deaths.push((e ? e.kind : '?') + '@' + st0); }
    sim.ev.length = 0;
  }
  const r = sim.result(), ess = ASPS.reduce((a, k) => a + r.ess[k], 0);
  return { stage: S.stage, end: S.ended || 'none', time: Math.round(S.t / TPS), defeats: S.stats.defeats, hits: S.stats.hits, parts: r.parts.reduce((a, p) => a + p.lv, 0), ess, gold: r.gold, mut: r.mut, bio: Math.round(S.bio), spent: Math.round(S.spent), acts: S.stats.acts, log, r, byKind: S.stats.byKind };
}

console.log(census()); console.log('');
for (const who of WHO) {
  const rs = []; for (let n = 0; n < N; n++) rs.push(play(who, ASPS[n % 5], 1000 + n * 37));
  const dist5 = [1, 2, 3, 4, 5].map(k => rs.filter(r => r.stage === k).length), avg = f => (rs.reduce((a, r) => a + f(r), 0) / rs.length).toFixed(1), ends = {}; rs.forEach(r => { ends[r.end] = (ends[r.end] || 0) + 1; });
  const tAt = k => { const xs = rs.map(r => r.log.stageAt[k]).filter(Boolean); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : '-'; }, killers = {}; rs.forEach(r => r.log.deaths.forEach(d => { killers[d] = (killers[d] || 0) + 1; }));
  console.log(who.padEnd(9), '닿은 몸 1~5:', dist5.join(' / '), '| 끝:', JSON.stringify(ends), '| 시간', avg(r => r.time), '쓰러짐', avg(r => r.defeats), '물림', avg(r => r.hits), '부위 단계', avg(r => r.parts), '정수', avg(r => r.ess), '진액', avg(r => r.gold), '재주', avg(r => r.acts));
  { const gr = rs.filter(r => r.end === 'grown'); if (gr.length) console.log('          다 자란 판: ' + gr.length + ', 걸린 시간 ' + Math.round(gr.reduce((a, r) => a + r.time, 0) / gr.length) + '초, 부위 단계 ' + (gr.reduce((a, r) => a + r.parts, 0) / gr.length).toFixed(1) + ', 정수 ' + (gr.reduce((a, r) => a + r.ess, 0) / gr.length).toFixed(1) + ', 쓰러짐 ' + (gr.reduce((a, r) => a + r.defeats, 0) / gr.length).toFixed(1)); }
  console.log('          몸 2~5 에 닿은 때(초):', [2, 3, 4, 5].map(tAt).join(' / '), '| 쓰러뜨린 것:', Object.keys(killers).sort((a, b) => killers[b] - killers[a]).slice(0, 8).map(k => k + '×' + killers[k]).join(' '));
  if (V) rs.slice(0, 6).forEach(r => console.log('    ', JSON.stringify({ st: r.stage, end: r.end, t: r.time, def: r.defeats, parts: r.r.parts.map(p => p.id + p.lv).join(','), ess: r.ess, at: r.log.stageAt.slice(2), ate: r.byKind })));
}
