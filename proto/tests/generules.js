// 카드 판의 몸(게놈) 시험.  node tests/generules.js
const S = require('../src/logic.js'), CM = require('../src/cardmode.js'), CD = require('../src/cards2.js'), T = require('../src/traits.js'), GE = require('../src/genome.js'), B = require('../src/cardbot.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('실패: ' + m); } };
const allMeta = () => { const m = CM.newMeta(); Object.keys(CD.UNLOCK).forEach(id => { m.unlocked[id] = 1; }); return m; };

// 1. 한 일이 형질이 된다
{ const g = T.newGenome({ aspect: 'brood', seed: 3 }); T.addBehaviour(g, { infections: 30, risen: 8 }); ok(T.topTags(g, 1)[0] === 'spore', '감염이 쌓이면 포자'); const g2 = T.newGenome({ aspect: 'hunger', seed: 3 }); T.addBehaviour(g2, { kinLost: 12, nightsAlone: 9 }); ok(T.topTags(g2, 1)[0] === 'alone', '권속을 잃고 홀로 버티면 홀로'); }

// 2. 판이 게놈을 가지고, 밤마다 셈이 들어간다
{ const R = B.play(4242, 'abyss', 2, '', CM.newMeta()); ok(R.genome && Object.keys(R.genome.tags).length >= 3, '판이 끝나면 몸에 형질이 셋 넘게 있다 (' + Object.keys((R.genome || {}).tags || {}).length + ')'); ok(R.over.egg && R.meta.eggs.length === 1, '판이 끝나면 알을 남긴다'); ok(R.over.body && R.over.body.name, '판 끝에 몸의 이름이 있다'); }

// 3. 형질마다 다시 쓴 카드가 실제 카드로 있고, 낮과 밤에 돈다
{
  let errs = 0, made = 0, played = 0, missing = [];
  T.TAG_IDS.forEach((tag, ti) => {
    const srcs = CD.LIST.filter(d => GE.canRewrite(tag, d)); if (!srcs.length) { missing.push(tag); return; }
    srcs.filter((d, k) => k % Math.max(1, Math.floor(srcs.length / 4)) === 0).slice(0, 5).forEach((d, k) => {
      const id = 'gx_' + tag + '__' + d.id, nd = GE.ensure(id); if (!nd) { errs++; console.log('없는 카드', id); return; } made++;
      ok(nd.name && nd.text && nd.text.length <= 22, id + ' 얼굴 글이 짧다'); ok(nd.unlock === 'gene' && !CD.isOpen(nd, allMeta()), id + ' 는 보상으로 나오지 않는다');
      try {
        const R = CM.newRun(500 + ti * 7 + k, { aspect: d.asp === 'none' ? 'brood' : d.asp, meta: allMeta() }), G = R.G; G.gold = 9999; G.faith = 99;
        ['sh_three', 'sh_bend'].forEach(sid => { const c = CM.addCard(R, sid); R.hand.push(c.uid); const p = CM.shapePlacements(R, CD.BY[sid]); if (p.length) CM.play(R, c.uid, { cells: p[0].cells }); });
        const c = CM.addCard(R, id); R.hand.push(c.uid); CM.syncHeld(R);
        if (nd.type === 'skill') { G.march.tonight = { vill: 'field', settle: false }; CM.endDay(R, ctx => { const o = (ctx.opts || []).find(x => x.id === nd.spell && x.ok); return o ? { k: o.id, u: ctx.tough, from: (o.targets || [])[0] } : { k: 'none' }; }); played++; }
        else { const v = CM.handView(R).find(h => h.uid === c.uid), tgt = v.target === 'shape' ? { cells: (v.places || [])[0] } : v.target === 'cell' ? { cell: (v.cellsCan || [])[0] } : {}; const r = CM.play(R, c.uid, tgt); if (r.ok) played++; G.march.tonight = G.march.tonight || { vill: 'field', settle: false }; CM.endDay(R, () => ({ k: 'none' })); }
      } catch (e) { errs++; if (errs <= 3) console.log(id, e.stack.split('\n').slice(0, 3).join(' | ')); }
    });
  });
  ok(!missing.length, '모든 형질이 다시 쓸 카드가 있다 (없음: ' + missing.join(',') + ')'); ok(!errs, '다시 쓴 카드가 오류 없이 돈다 (' + errs + ')');
  console.log('형질로 다시 쓴 카드 ' + made + '장 만들어 ' + played + '장 냄');
  // 짝 형질 카드
  let cm = 0, cmMiss = []; T.COMBOS.forEach(cmb => { const src = CD.LIST.find(d => d.type !== 'curse' && cmb.tags.some(t => GE.RW[t] && GE.RW[t].on === d.type)); const nd = src && GE.ensure('gc_' + cmb.id + '__' + src.id); if (nd) cm++; else cmMiss.push(cmb.id); });
  ok(cm === T.COMBOS.length, '짝 형질마다 특별한 카드가 있다 (' + cm + '/' + T.COMBOS.length + ', 없음 ' + cmMiss.join(',') + ')');
}

// 4. 허물이 덱을 다시 쓰고 본체가 달라진다
{
  const R = CM.newRun(777, { aspect: 'brood', meta: CM.newMeta() }), G = R.G;
  const hp0 = S.slimeStats(G).hp, atk0 = S.slimeStats(G).atk; G.stats.infections = 40; G.stats.risen = 12; G.stats.kinMade = 9; CM.syncCounters(R); GE.feed(R, CM.behaviour(R));
  G.slime.stage = 1; G.slime.main = 'brood'; R.moltQ = 1; const m = CM.molt(R);
  ok(m && m.after.stage === 2 && m.lines.length >= 1 && m.name.name, '허물: 몸이 한 단계 크고 이름과 「네가 한 일」이 있다');
  ok(m && m.mutated.length >= 2, '허물: 덱의 카드가 다시 쓰였다 (' + (m ? m.mutated.length : 0) + ')');
  ok(m && m.mutated.every(x => CD.BY[x.to] && R.deck.some(c => c.id === x.to)), '다시 쓴 카드가 덱에 있다');
  const st = S.slimeStats(G); ok(st.hp !== hp0 || st.atk !== atk0 || G.slime.muts.length, '허물: 본체의 힘이나 변이가 바뀐다');
  ok(!CM.moltPending(R), '허물을 치르면 기다리는 허물이 없다');
  const a = CM.newRun(888, { aspect: 'hunger', meta: CM.newMeta() }); a.G.stats.kinLost = 15; a.G.stats.nightsAlone = 9; CM.syncCounters(a); GE.feed(a, CM.behaviour(a)); a.G.slime.stage = 2; a.moltQ = 1; CM.molt(a);
  const b = CM.newRun(888, { aspect: 'hunger', meta: CM.newMeta() }); b.G.stats.trapKills = 40; b.G.stats.trapsPlaced = 12; CM.syncCounters(b); GE.feed(b, CM.behaviour(b)); b.G.slime.stage = 2; b.moltQ = 1; CM.molt(b);
  ok(S.slimeStats(a.G).atk > S.slimeStats(b.G).atk * 1.1, '홀로 큰 몸이 덫 큰 몸보다 본체 공격이 세다');
  ok(T.topTags(a.genome, 1)[0] !== T.topTags(b.genome, 1)[0], '같은 씨앗도 한 일이 다르면 다른 몸');
}

// 5. 알을 물려받는다
{
  const meta = CM.newMeta(); const R1 = B.play(9191, 'dusk', 2, '', meta); const egg = meta.eggs[meta.eggs.length - 1];
  ok(egg && Object.keys(egg.tags).length >= 1, '알에 형질이 있다');
  const R2 = CM.newRun(9192, { aspect: 'dusk', meta, egg }); const top = Object.keys(egg.tags).sort((x, y) => egg.tags[y] - egg.tags[x])[0];
  ok(R2.genome.lineage.length === 1 && (R2.genome.tags[top] || 0) > 0, '알에서 시작하면 형질을 물려받는다');
  ok(R2.deck.some(c => /^g[xc]_/.test(c.id)) || !CD.LIST.some(d => GE.canRewrite(top, d) && CD.START.dusk.includes(d.id)), '물려받은 형질이 처음 덱을 다시 쓴다');
  for (let k = 0; k < 7; k++) B.play(100 + k, 'abyss', 1, '', meta); ok(meta.eggs.length === 6, '알은 여섯 개까지 남는다');
}

// 6. 도감
{ const meta = CM.newMeta(); for (let k = 0; k < 6; k++) B.play(300 + k, CD.ASPS[k % 5], 2, '', meta); const cx = CM.codex(meta); ok(cx.found >= 3 && cx.list.length === cx.found && cx.total === 30, '도감에 본 몸이 쌓인다 (' + cx.found + ')'); }

// 7. 같은 씨앗이면 같은 몸
{ const a = B.play(5150, 'nebula', 2, '', CM.newMeta()), b = B.play(5150, 'nebula', 2, '', CM.newMeta()); ok(JSON.stringify(a.genome.tags) === JSON.stringify(b.genome.tags) && a.deck.map(c => c.id).join() === b.deck.map(c => c.id).join(), '같은 씨앗이면 같은 몸과 같은 덱'); }

// 8. 다시 쓴 카드를 id 만으로 다시 만든다 (저장한 판을 불러올 때)
{ const id = 'gx_spore__gx_maw__tr_eye'; const d = GE.ensure(id); ok(d && d.trap === 'spore' && d.gene.join() === 'maw,spore', '두 번 다시 쓴 카드도 id 로 만든다'); }

console.log(bad ? '실패 ' + bad : '모두 통과');
