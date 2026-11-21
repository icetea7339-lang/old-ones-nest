// 땅속의 한 방울: 화면 없이 봇으로 돌려 균형을 잰다.   node tests/prosim.js [판 수=25] [봇들=careless,nobuy,greedy,planned] [-v]
//   node tests/prosim.js 20 planned,nobuy forms   처음 받는 몸 열다섯을 하나씩 정해 놓고 잰다 (몸마다 [판 수]판)
// 봇은 사람이 화면에서 볼 수 있는 것만 안다: 밝은 둘레 안, 어둠 속의 희미한 점과 붉은 눈, 화면 가장자리의 표시, 눈 부위와 타고난 몸이 드러내 주는 것.
//   allsee 를 붙이면 예전처럼 어둠 속의 것도 다 안다(견주어 보려고 남겼다).   EYE=abyss|nebula|brood|dusk|hunger 로 planned_eye 가 살 눈을 정한다.
const PRO = require('../src/prologue.js');
const N = +(process.argv[2] || 25), WHO = (process.argv[3] || 'careless,nobuy,greedy,planned').split(','), V = process.argv.includes('-v'), FORMS_MODE = process.argv.includes('forms'), ALLSEE = process.argv.includes('allsee'), EYE = process.env.EYE || '';
const TPS = PRO.TPS, ASPS = PRO.ASPS;

function census() {   // 고리마다 무엇이 사는가
  const sim = PRO.makeSim({ asp: 'abyss', seed: 7 }), out = [];
  for (let k = 1; k <= 5; k++) { const c = {}, f = {}; sim.S.cre.forEach(q => { if (q.ring === k) c[PRO.SP[q.k].name] = (c[PRO.SP[q.k].name] || 0) + 1; }); sim.S.food.forEach(q => { if (q.ring === k) f[PRO.FOOD[q.k].name] = (f[PRO.FOOD[q.k].name] || 0) + 1; }); f['꿈틀이'] = sim.S.wrig.filter(q => q.ring === k).length; out.push(k + ' ' + PRO.STG[k].name + ' | 사는 것: ' + Object.keys(c).map(n => n + ' ' + c[n]).join(', ') + ' | 먹이: ' + Object.keys(f).filter(n => f[n]).map(n => n + ' ' + f[n]).join(', ') + ' | 틈 ' + sim.S.crev.filter(q => q.ring === k).length); }
  return out.join('\n');
}

function play(kind, asp, seed, look) {
  const sim = PRO.makeSim(Object.assign({ asp, seed, look }, process.env.STORY ? { story: require('../src/logic.js').STORYCH[1].pro } : {})), S = sim.S, P = sim.P, careful = kind !== 'careless', buys = kind === 'greedy' || kind.indexOf('planned') === 0;
  // ---- 보이는 것만 안다 (prologue2.js 의 그리기와 같은 규칙) ----
  const LIT = new Set(['chase', 'dash', 'lunge', 'aim', 'tell', 'hunt', 'out']);
  const viewR = () => 250 / PRO.STG[S.stage].zoom;
  const knowsC = c => {   // 이 사나운 것이 거기 있는 줄 아는가
    if (ALLSEE) return true; const d = Math.hypot(c.x - P.x, c.y - P.y), R = sim.lightR(), third = sim.lv('eye_nebula');
    if (c.mode === 'buried') return !!(third || sim.form.buried || d < 44 || (sim.lv('eye_abyss') && d < R * 0.9));
    if (c.mode === 'bait') return !!(third || (sim.lv('eye_abyss') >= 2 && d < R * 0.9));
    if (d < R) return true; if (d > viewR()) return false;
    return third >= 2 || d < R * PRO.K.hintC || LIT.has(c.mode);
  };
  const seesPrey = c => ALLSEE || Math.hypot(c.x - P.x, c.y - P.y) < sim.lightR() || (sim.lv('eye_hunger') && Math.hypot(c.x - P.x, c.y - P.y) < viewR());
  const seesFood = f => { if (ALLSEE) return true; const d = Math.hypot(f.x - P.x, f.y - P.y), R = sim.lightR(), feel = sim.lv('eye_brood'); if (d < R) return true; if (f.k === 'mote' && S.stage >= 3) return false; const big = f.k !== 'mote' && f.k !== 'bead' && f.k !== 'egg'; if (d < R * PRO.K.hintF && d < viewR() * 1.3) return true; if (d > viewR() * (feel ? 1.8 : 1)) return false; return !!((feel && big) || (feel >= 2 && (f.k === 'cap' || f.k === 'egg')) || (feel >= 3 && f.k === 'bead')); };
  const seesNear = (o, k) => ALLSEE || Math.hypot(o.x - P.x, o.y - P.y) < sim.lightR() * (k || 1.1);
  const log = { stageAt: [0, 0], deaths: [], firstBuy: 0 };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  let target = null, retarget = 0, roam = null;
  const threatR = c => { const d = PRO.SP[c.k]; if (c.k === 'lurker') return c.mode === 'buried' ? 40 : 70; if (c.k === 'mimic') return c.mode === 'bait' ? 22 : 70; if (c.k === 'filter') return 200; if (c.k === 'mother') return 60; if (c.k === 'blind') return 70; if (c.k === 'charger') return c.mode === 'rest' ? 20 : 60; if (c.k === 'spitter') return 50; if (c.k === 'stalker') return 60; if (c.k === 'weaver') return 40; return Math.min(110, d.see * 0.8); };
  const plan = () => {   // 계획대로: 입 → 발 → 겉 → 속, 그다음 올린다. 그 자리에서 가장 넉넉한 빛깔의 것을 고른다
    const order = kind === 'planned_eye' ? ['mouth', 'leg', 'eye', 'mouth', 'skin', 'leg', 'core', 'eye', 'mouth', 'skin', 'leg', 'core'] : kind === 'planned_noeye' ? ['mouth', 'leg', 'mouth', 'skin', 'leg', 'core', 'mouth', 'skin', 'leg', 'core'] : ['mouth', 'leg', 'mouth', 'skin', 'leg', 'core', 'mouth', 'skin', 'leg', 'core', 'eye'];
    const want = {}; for (const s of order) { want[s] = (want[s] || 0) + 1; const w = S.worn[s], have = w ? w.lv : 0; if (have >= want[s]) continue; if (S.stage < PRO.K.open[s]) continue;
      const cands = w ? [w.id] : (s === 'eye' && EYE ? [EYE] : ASPS.slice().sort((a, b) => S.purse[b] - S.purse[a])).map(a => s + '_' + a); for (const id of cands) { if (!sim.whyNot(id)) return id; } if (s === 'eye' && EYE) { want[s]--; continue; } return null; }   // 차례가 안 되면 기다린다(모은다)
    return null;
  };
  for (let n = 0; n < 500 * TPS && !S.ended; n++) {
    const g = PRO.STG[S.stage];
    if (n % 6 === 0) {
      if (buys) { let id = null; if (kind === 'greedy') { const c = PRO.CAT.filter(d => !sim.whyNot(d.id) && !(S.worn[d.slot] && S.worn[d.slot].id !== d.id)).sort((a, b) => sim.priceOf(a.id) - sim.priceOf(b.id))[0]; id = c ? c.id : null; } else id = plan(); if (id && sim.buy(id) && !log.firstBuy) log.firstBuy = Math.round(S.t / TPS); }
      // 무엇이 위험한가
      let rx = 0, ry = 0, danger = 0, near = null;
      if (careful) {
        for (const c of S.cre) { if (!c.alive || c.ring > S.stage || !sim.hostile(c) || c.stun > 0 || !knowsC(c)) continue; const d = dist(c, P), R = threatR(c) + g.r + c.r; if (d < R) { const w = (R - d) / R; rx += (P.x - c.x) / (d || 1) * w * 2; ry += (P.y - c.y) / (d || 1) * w * 2; danger = Math.max(danger, w); if (!near || d < dist(near, P)) near = c; }
          if ((c.mode === 'aim' || c.mode === 'tell' || c.mode === 'dash' || c.mode === 'lunge') && (c.k === 'charger' || c.k === 'stalker')) { const lx = (c.tx || P.x) - c.x, ly = (c.ty || P.y) - c.y, L = Math.hypot(lx, ly) || 1, ux = lx / L, uy = ly / L, px = P.x - c.x, py = P.y - c.y, along = px * ux + py * uy, side = px * -uy + py * ux; if (along > -20 && along < 330 && Math.abs(side) < 30 + g.r) { const sgn = side >= 0 ? 1 : -1; rx += -uy * sgn * 3; ry += ux * sgn * 3; danger = Math.max(danger, 0.9); } } }
        for (const s of S.shots) { if (!seesNear({ x: s.tx, y: s.ty }, 1.2)) continue; const d = Math.hypot(s.tx - P.x, s.ty - P.y); if (d < 34 + g.r) { rx += (P.x - s.tx) / (d || 1) * 2; ry += (P.y - s.ty) / (d || 1) * 2; danger = Math.max(danger, 0.6); } }
        if (!sim.acidOK()) for (const s of S.puddles) { const d = dist(s, P); if (d < 30 + g.r) { rx += (P.x - s.x) / (d || 1) * 2; ry += (P.y - s.y) / (d || 1) * 2; danger = Math.max(danger, 0.6); } }
        if (!sim.webOK()) for (const w of S.webs) { const d = dist(w, P); if (d < w.r + g.r + 8) { rx += (P.x - w.x) / (d || 1) * 0.9; ry += (P.y - w.y) / (d || 1) * 0.9; } }
        const sw = S.sweep; if (sw.st !== 'idle') { const px = P.x - sw.sx, py = P.y - sw.sy, side = px * -sw.dy + py * sw.dx; if (Math.abs(side) < sw.r + g.r + 26) { const sgn = side >= 0 ? 1 : -1; rx += -sw.dy * sgn * 4; ry += sw.dx * sgn * 4; danger = Math.max(danger, 0.95); } }
      }
      // 무엇을 먹으러 가나
      if (!target || !target.alive || n >= retarget || (target.gone && target.gone())) {
        let best = null, bs = 1e9; const m = sim.mouthLv(), cand = (o, val, kindK) => { const d = dist(o, P); if (d > 700) return; let s = (d + 30) / Math.max(0.5, val); if (careful) for (const c of S.cre) { if (c.alive && c.ring <= S.stage && sim.hostile(c) && c !== o && knowsC(c) && dist(c, o) < threatR(c) + c.r + 14) { s *= 6; break; } } if (s < bs) { bs = s; best = o; } };
        for (const f of S.food) { if (!f.alive || f.ring > S.stage || !seesFood(f)) continue; const D = PRO.FOOD[f.k]; if (D.need && m < D.need) continue; if (D.bitter && !sim.bitterOK() && (careful || S.hp <= 1)) continue; if (f.k === 'cap' && S.hp >= sim.maxHp()) continue; let v = f.k === 'bead' ? 0.6 : f.k === 'cap' ? 6 : D.val * (D.tier <= S.stage - 3 ? 0.25 : D.tier <= S.stage - 2 ? 0.5 : 1); if (D.chew) v *= 0.8; cand(f, v); }
        for (const w of S.wrig) if (w.alive && w.ring <= S.stage && seesPrey(w)) cand(w, 1.4);
        for (const c of S.cre) if (c.alive && c.ring <= S.stage && sim.canEat(c) && (sim.hostile(c) ? knowsC(c) : seesPrey(c)) && !(sim.hostile(c) && careful && !(c.stun > 0 || c.mode === 'rest'))) cand(c, PRO.SP[c.k].val * 0.9);
        // 미끼혹은 드러나지 않으면 먹이로 보인다
        if (!ALLSEE) for (const c of S.cre) if (c.alive && c.ring <= S.stage && c.mode === 'bait' && sim.hostile(c) && !knowsC(c) && Math.hypot(c.x - P.x, c.y - P.y) < sim.lightR() * PRO.K.hintF) cand(c, 5);
        // 보이는 먹이가 없으면 화면 가장자리의 표시(먹이 무더기)를 따라간다. 그것도 없으면 굴을 돈다
        if (!best && !ALLSEE) { let bc = null, bd = 1e9; for (const q of S.clusters) { if (q.ring > S.stage) continue; const d = dist(q, P); if (d < 40) continue; const sc = d * (S.stage >= 3 && q.ring < S.stage - 1 ? 3 : 1); if (sc < bd) { bd = sc; bc = q; } } if (bc && (!roam || roam.until < n || dist(roam, P) < 30)) { const pick = S.clusters.filter(q => q.ring <= S.stage && q.ring >= S.stage - 1 && dist(q, P) > 60); const q = pick.length ? pick[(n / 45 | 0) % pick.length] : bc; roam = { x: q.x, y: q.y, until: n + 600, alive: true, roam: true }; } best = roam; }
        target = best; retarget = n + 45;
      }
      let ax = 0, ay = 0; if (target) { const d = dist(target, P) || 1; ax = (target.x - P.x) / d; ay = (target.y - P.y) / d; }
      const blind = careful && S.cre.find(c => c.alive && c.k === 'blind' && c.ring <= S.stage && sim.hostile(c) && knowsC(c) && dist(c, P) < 330);
      if (careful && danger > 0.05) { const k = Math.min(1, danger * 2.2); ax = ax * (1 - k) + rx; ay = ay * (1 - k) + ry; }
      // 쫓기면 몸이 들어가는 틈으로 달아난다. 틈 안에서는 쫓던 것이 물러갈 때까지 기다린다
      if (careful) { const chased = S.cre.some(c => c.alive && c.ring <= S.stage && sim.hostile(c) && knowsC(c) && (c.mode === 'chase' || c.mode === 'out') && dist(c, P) < 150 && c.r > 4.2 && PRO.SP[c.k].sp >= g.sp); const cv = S.crev.filter(q => sim.fits(q) && q.ring <= S.stage).sort((a, b) => dist(a, P) - dist(b, P))[0];
        if (chased && cv && dist(cv, P) < 170) { const d = dist(cv, P); if (d < cv.r * 0.5) { ax = 0; ay = 0; } else { ax = (cv.x - P.x) / d + rx * 0.3; ay = (cv.y - P.y) / d + ry * 0.3; } } }
      const L = Math.hypot(ax, ay);
      if (blind && danger < 0.5 && dist(blind, P) < 300) sim.stop();                               // 눈먼 큰것 곁에서는 멈춘다
      else if (L > 0.01) sim.aim(P.x + ax / L * 60, P.y + ay / L * 60); else sim.stop();
      if (target && !danger && dist(target, P) < 20 && PRO.FOOD[target.k] && PRO.FOOD[target.k].chew) sim.aim(target.x, target.y);
      if (careful && buys && sim.actReady() && (danger > 0.55 || P.leech) && S.worn.leg && S.worn.leg.id !== 'leg_hunger') sim.act();
      if (buys && sim.actReady() && S.worn.leg && S.worn.leg.id === 'leg_hunger' && target && target.k && PRO.SP[target.k] && dist(target, P) < 80) sim.act();
      if (careful && buys && sim.lv('core_dusk') && P.cd2 <= 0 && danger > 0.6) sim.act();
      if (careful && !S.worn.leg && sim.form.act && sim.actReady() && (danger > 0.55 || P.leech)) sim.act();   // 타고난 재주(똬리)
    }
    const st0 = S.stage, d0 = S.stats.defeats; sim.tick(); if (S.stage !== st0) log.stageAt[S.stage] = Math.round(S.t / TPS);
    if (S.stats.defeats !== d0) { const e = sim.ev.slice().reverse().find(q => q.k === 'hurt'); log.deaths.push((e ? e.kind : '?') + '@' + st0); }
    sim.ev.length = 0;
  }
  const r = sim.result(), ess = ASPS.reduce((a, k) => a + r.ess[k], 0);
  return { eco: S.eco, look: sim.look, stage: S.stage, end: S.ended || 'none', time: Math.round(S.t / TPS), defeats: S.stats.defeats, hits: S.stats.hits, parts: r.parts.reduce((a, p) => a + p.lv, 0), ess, gold: r.gold, mut: r.mut, bio: Math.round(S.bio), spent: Math.round(S.spent), acts: S.stats.acts, log, r, byKind: S.stats.byKind };
}

if (FORMS_MODE) {
  // 몸마다: 닿은 몸의 분포, 다 자란 비율, 첫 몸에서 끝난 판, 평균 시간·쓰러짐·정수
  for (const who of WHO) {
    console.log('== ' + who + ' · 몸마다 ' + N + '판'); const rows = [];
    for (const look of PRO.SEED_IDS.filter(l => !process.env.LOOKS || process.env.LOOKS.split(',').includes(l))) { const rs = []; for (let n = 0; n < N; n++) rs.push(play(who, ASPS[n % 5], 1000 + n * 37, look));
      const d5 = [1, 2, 3, 4, 5].map(k => rs.filter(r => r.stage === k).length), grown = rs.filter(r => r.end === 'grown').length, avg = f => rs.reduce((a, r) => a + f(r), 0) / rs.length;
      rows.push({ look, name: PRO.SEEDS[look].name, d5, grown, rate: grown / N * 100, t: avg(r => r.time), def: avg(r => r.defeats), ess: avg(r => r.ess), gold: avg(r => r.gold), t2: (() => { const xs = rs.map(r => r.log.stageAt[2]).filter(Boolean); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; })() }); }
    const mean = rows.reduce((a, r) => a + r.rate, 0) / rows.length;
    rows.forEach(r => console.log((r.look + ' ' + r.name).padEnd(14), '닿은 몸 1~5:', r.d5.join(' / ').padEnd(22), '다 자람', String(Math.round(r.rate)).padStart(3) + '%', '(평균과 ' + (r.rate - mean >= 0 ? '+' : '') + Math.round(r.rate - mean) + ')', '둘째 몸 ' + Math.round(r.t2) + '초', '시간 ' + Math.round(r.t), '쓰러짐 ' + r.def.toFixed(1), '정수 ' + r.ess.toFixed(1), '진액 ' + r.gold.toFixed(0)));
    console.log('   평균 다 자람 ' + mean.toFixed(1) + '% · 가장 낮은 ' + Math.round(Math.min(...rows.map(r => r.rate))) + '% · 가장 높은 ' + Math.round(Math.max(...rows.map(r => r.rate))) + '% · 첫 몸에서 끝난 판 ' + rows.reduce((a, r) => a + r.d5[0], 0) + '/' + rows.length * N);
  }
} else {
console.log(census()); console.log('');
for (const who of WHO) {
  const rs = []; for (let n = 0; n < N; n++) rs.push(play(who, ASPS[n % 5], 1000 + n * 37));
  const dist5 = [1, 2, 3, 4, 5].map(k => rs.filter(r => r.stage === k).length), avg = f => (rs.reduce((a, r) => a + f(r), 0) / rs.length).toFixed(1), ends = {}; rs.forEach(r => { ends[r.end] = (ends[r.end] || 0) + 1; });
  const tAt = k => { const xs = rs.map(r => r.log.stageAt[k]).filter(Boolean); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : '-'; }, killers = {}; rs.forEach(r => r.log.deaths.forEach(d => { killers[d] = (killers[d] || 0) + 1; }));
  console.log(who.padEnd(9), '닿은 몸 1~5:', dist5.join(' / '), '| 끝:', JSON.stringify(ends), '| 시간', avg(r => r.time), '쓰러짐', avg(r => r.defeats), '물림', avg(r => r.hits), '부위 단계', avg(r => r.parts), '정수', avg(r => r.ess), '진액', avg(r => r.gold), '재주', avg(r => r.acts));
  { const e = k => rs.reduce((x, r) => x + r.eco[k], 0), per = k => (e(k) / rs.length).toFixed(1); console.log('          먹이사슬(판마다): 서로 먹음 ' + per('eats') + ' (그중 먼 곳 ' + per('far') + '), 자람 ' + per('grew') + ', 한 급 오름 ' + per('promo') + ', 맞붙음 ' + per('fights') + ', 주검 ' + per('carc') + ', 뜯어 먹음 ' + per('scav') + ' | 사나운 것이 나를 본 시간 ' + Math.round(100 * e('tP') / Math.max(1, e('tP') + e('tO'))) + '% · 다른 것을 쫓은 시간 ' + Math.round(100 * e('tO') / Math.max(1, e('tP') + e('tO'))) + '%'); }
  { const gr = rs.filter(r => r.end === 'grown'); if (gr.length) console.log('          다 자란 판: ' + gr.length + ', 걸린 시간 ' + Math.round(gr.reduce((a, r) => a + r.time, 0) / gr.length) + '초, 부위 단계 ' + (gr.reduce((a, r) => a + r.parts, 0) / gr.length).toFixed(1) + ', 정수 ' + (gr.reduce((a, r) => a + r.ess, 0) / gr.length).toFixed(1) + ', 쓰러짐 ' + (gr.reduce((a, r) => a + r.defeats, 0) / gr.length).toFixed(1)); }
  console.log('          몸 2~5 에 닿은 때(초):', [2, 3, 4, 5].map(tAt).join(' / '), '| 쓰러뜨린 것:', Object.keys(killers).sort((a, b) => killers[b] - killers[a]).slice(0, 8).map(k => k + '×' + killers[k]).join(' '));
  if (V) rs.slice(0, 6).forEach(r => console.log('    ', JSON.stringify({ st: r.stage, end: r.end, t: r.time, def: r.defeats, parts: r.r.parts.map(p => p.id + p.lv).join(','), ess: r.ess, at: r.log.stageAt.slice(2), ate: r.byKind })));
}

}
