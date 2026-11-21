// 덱 판을 혼자 하는 플레이어 (화면 없이). node src/deckbot.js 200 <aspect|all> [nohands]
// 낮: 빛깔 맞는 카드를 고르고, 권속을 키우고, 남는 진액으로 장터. 밤: 길 위의 칸에 부위를, 적이 다가올 칸에 권속을, 가까운 적에게 주문을.
const DECK = require('./deck.js'), CARDS = require('./cards.js');
const D = DECK, C = CARDS;

function botNight(R, opt) {
  let g = 0;
  while (R.phase === 'night' && g++ < 40) {
    let guard = 0;
    while (guard++ < 12 && R.phase === 'night') {
      const best = bestPlay(R, opt); if (!best || best.score <= 0) break;
      const r = D.play(R, best.uid, best.cell); if (!r.ok) break;
    }
    if (R.phase !== 'night') break;
    D.endTurn(R);
  }
}
function bestPlay(R, opt) {
  const nv = D.nightView(R); if (!nv) return null;
  const d = D.distMap(R), path = D.pathCells(R), es = nv.enemies, upstream = c => es.filter(e => d[e.cell] > d[c]).length + nv.queue;
  const front = es.slice().sort((a, b) => d[a.cell] - d[b.cell])[0];
  const prev = opt.nohands ? [] : D.handPreview(R);
  let best = null;
  for (const v of nv.hand) {
    if (!v.can || !v.cells.length) continue;
    const hp = prev.filter(p => p.uid === v.uid);
    for (const cell of v.cells.slice(0, 40)) {
      const handBonus = hp.filter(p => p.cell == null || p.cell === cell || p.id !== 'body').reduce((s, p) => s + (D.HANDS.find(h => h.id === p.id).tier) * 5, 0);
      let s = 0;
      if (v.type === 'curse') { s = handBonus > 0 ? handBonus - 3 : -1; }
      else if (v.type === 'trap') { if (cell === null || !path.includes(cell)) continue; const up = upstream(cell); s = up ? 6 + Math.min(up, v.charges) * 3 - (d[cell] < 2 ? 2 : 0) : -1; if (cell === R.ent && nv.queue > 0) s += 3; }
      else if (v.type === 'organ') { const o = v.hooks || {}; const onPath = path.includes(cell); s = 8 + (o.enter && onPath ? 4 : 0) + (o.turn && onPath ? 3 : 0) + (v.cap ? (onPath ? 3 : 0) : 0) - (onPath ? 0 : 2) + (nv.turn <= 2 ? 3 : 0); if (!onPath && (o.enter || o.turn)) s -= 6; }
      else if (v.type === 'kin') { if (cell === null) continue; const ahead = front ? d[front.cell] - d[cell] : 0; if (!path.includes(cell) && cell !== R.core) continue; s = 10 + (front ? (ahead >= 0 && ahead <= 2 ? 8 : ahead > 2 ? 3 : -4) : 1) + (cell === R.core && es.some(e => e.cell === R.core) ? 10 : 0); }
      else {
        for (const o of v.ops) {
          const k = o[0];
          if (k === 'dmg' || k === 'mind' || k === 'dmgPer' || k === 'mindPer' || k === 'inf' || k === 'mark' || k === 'swallow' || k === 'mad') {
            const area = k === 'dmgPer' || k === 'mindPer' ? o[3] : o[2];
            const tgs = area === 'all' ? es : area === 'core' ? es.filter(e => e.cell === R.core) : cell === null ? [] : es.filter(e => e.cell === cell);
            const tg = area === 'cell' || area === 'all' || area === 'core' ? tgs : tgs.slice().sort((a, b) => a.hp - b.hp).slice(0, 1);
            const near = x => 1 + Math.max(0, 6 - d[x.cell]) * 0.25;
            if (k === 'dmg') s += tg.reduce((a, e) => a + Math.min(o[1], e.hp) * near(e) + (o[1] >= e.hp ? 4 : 0), 0) * 0.5;
            else if (k === 'mind') s += tg.reduce((a, e) => a + Math.min(o[1], Math.max(0, e.san)) * near(e) * 0.4 + (o[1] >= e.san && !e.boss ? 5 : 0), 0);
            else if (k === 'swallow') s += tg.filter(e => e.hp <= o[1] && !e.boss).length ? 14 : 0;
            else if (k === 'inf') s += tg.reduce((a, e) => a + o[1] * 1.2, 0);
            else if (k === 'mark') s += tg.length * 2;
            else if (k === 'mad') s += tg.filter(e => !e.boss).length * 5;
            else s += tg.length * 3;
          } else if (k === 'hold' || k === 'push' || k === 'pull') { const tg = o[2] === 'all' ? es : es.filter(e => e.cell === cell); s += tg.reduce((a, e) => a + Math.max(0, 7 - d[e.cell]), 0) * (k === 'pull' ? -0.5 : 0.8); }
          else if (k === 'block') { const threat = es.filter(e => d[e.cell] <= 1).reduce((a, e) => a + e.hp > 0 ? 8 : 0, 0); s += Math.min(o[1], threat ? 12 : 1); }
          else if (k === 'heal') s += R.hp < R.maxHp * 0.6 ? Math.min(o[1], R.maxHp - R.hp) : 1;
          else if (k === 'draw') s += 5 * o[1];
          else if (k === 'energy') s += o[1] > 0 ? 6 * o[1] : -6;
          else if (k === 'spawn' || k === 'kin' || k === 'rise') { if (cell === null || (!path.includes(cell) && cell !== R.core)) { s -= 5; continue; } const ahead = front ? d[front.cell] - d[cell] : 0; s += 6 + (front && ahead >= 0 && ahead <= 2 ? 5 : 0); }
          else if (k === 'buff' || k === 'healKin') { const n = nv.kin.filter(u => o[3] === 'all' || o[2] === 'all' || u.cell === cell).length; s += n * 2; }
          else if (k === 'ess' || k === 'eat') s += 2;
          else if (k === 'self') s -= o[1] * (R.hp < R.maxHp * 0.5 ? 3 : 1.5);
          else s += 2;
        }
        if (!es.length && !nv.queue) s = -1;
      }
      s += handBonus - v.costNow * 1.5;
      if (!best || s > best.score) best = { uid: v.uid, cell, score: s };
    }
  }
  return best;
}
// 카드 값 어림: 효과를 숫자로 (희귀도가 아니라)
const AREAW = { front: 1, one: 1, enter: 1, cell: 1.5, all: 2.2, core: 1, rand: 1 };
const KV = { goblin: 9, skeleton: 10, cultist: 7, scale: 10, scribe: 9, spawn: 4, mask: 9, hunger: 15, netter: 8, warden: 9, turncoat: 15, fallen: 8, digger: 6, clerk: 5, licker: 8, spitter: 8, eyeheap: 9, tangle: 11 };
function opsValue(ops) {
  let v = 0;
  for (const o of ops || []) {
    const [k, a, b, c] = o, w = AREAW[b] || 1;
    if (k === 'dmg') v += a * 0.8 * w; else if (k === 'mind') v += a * 0.55 * w; else if (k === 'swallow') v += a * 0.45; else if (k === 'hold') v += 4 * a * w; else if (k === 'push') v += 4 * a * w;
    else if (k === 'inf') v += a * 1.8 * w; else if (k === 'mark') v += a * 0.08 * w; else if (k === 'mad') v += 5 * a * w; else if (k === 'spawn') v += 4.5 * a; else if (k === 'kin') v += (KV[a] || 8) * (b || 1);
    else if (k === 'rise') v += 4 * a; else if (k === 'heal') v += a * 0.5; else if (k === 'healKin') v += a * 0.4 * (b === 'all' ? 2 : 1); else if (k === 'buff') v += a * 1.5 * (c === 'all' ? 2.5 : 1) + (b || 0) * 0.3;
    else if (k === 'block') v += a * 0.6; else if (k === 'draw') v += 4 * a; else if (k === 'energy') v += 5 * a; else if (k === 'ess') v += a * 0.15; else if (k === 'eat') v += a * 0.6;
    else if (k === 'pull') v -= 3 * a; else if (k === 'dmgPer' || k === 'mindPer') v += a * 2 * (AREAW[c] || 1); else if (k === 'self') v -= a * 1.2; else if (k === 'charge') v += 8; else v += 2;
  }
  return v;
}
function cardPower(d) {
  let v;
  if (d.type === 'trap') v = opsValue(d.ops) * d.charges * 0.75;
  else if (d.type === 'organ') { const h = d.hooks || {}; v = (h.turn ? opsValue(h.turn) * 4 : 0) + (h.enter ? opsValue(h.enter) * 4 : 0) + (h.kill ? opsValue(h.kill) * 2.5 : 0) + (h.night ? opsValue(h.night) * 2 : 0) + (h.day ? opsValue(h.day) * 2 : 0) + (h.hand ? opsValue(h.hand) * 1 : 0) + (d.cap || 0) * 5; v *= 1.6; }
  else v = opsValue(d.ops);
  if (d.kw && d.kw.exhaust) v *= 0.6;
  return v / (d.cost + 0.6);
}
function cardScore(R, id) {
  const d = C.BY[id]; if (!d || d.type === 'curse') return -10;
  const deck = R.deck.map(c => C.BY[c.id]);
  const kin = deck.filter(x => x.type === 'kin').length, traps = deck.filter(x => x.type === 'trap').length, organs = deck.filter(x => x.type === 'organ').length;
  let s = cardPower(d) / 3.5;
  if (d.asp === R.aspect) s += 2; else if (d.asp === 'none') s += 0.5; else s -= 1.5;
  if (d.type === 'kin') s += kin < 4 ? 3 : kin < 6 ? 1.5 : 0; if (d.type === 'trap' && traps < 4) s += 1; if (d.type === 'organ' && organs < 3) s += 1;
  const copies = R.deck.filter(c => c.id === id).length; if (copies >= 2) s -= 1.5 * (copies - 1);
  if (d.ops && d.ops.some(o => o[0] === 'self')) s -= 1;
  if (R.deck.length > 20) s -= 1.5;
  if (R.deck.length > 26) s -= 2;
  return s;
}
function botDay(R, opt) {
  if (R.phase === 'reward') { const cs = R.reward.cards.map((o, i) => [i, cardScore(R, o.id)]).sort((a, b) => b[1] - a[1]); D.takeReward(R, cs[0] && cs[0][1] > 1.5 ? cs[0][0] : null, R.reward.molts ? R.reward.molts[0] : null); }
  if (R.phase !== 'day') return;
  // 바늘 점: 진액이 넉넉하면 조금 건다
  if (R.needleOffer && opt.needle !== false && R.ess >= 70) { D.needleStart(R, 'altar'); D.needleBet(R, { kind: 'ess', n: 20 }); for (let s = 0; s < 3 && R.needle; s++) D.needleReveal(R); }
  // 낮에 기관 놓기
  for (const c of R.deck.slice()) { const v = D.view(c); if (v.type === 'organ' && !c.placed && R.ess >= 12 * v.cost + 90) { const path = D.pathCells(R).filter(i => i !== R.core && !R.cells[i].organ); const cell = (v.hooks && (v.hooks.enter || v.hooks.turn)) ? path[Math.floor(path.length / 2)] : path[path.length - 2]; if (cell != null) D.placeOrgan(R, c.uid, cell); } }
  let g = 0;
  while (R.actions > 0 && g++ < 5) {
    const ups = D.upgradeOptions(R).map(o => ({ o, v: D.view(R.deck.find(c => c.uid === o.uid)) })).sort((a, b) => (b.v.type === 'kin') - (a.v.type === 'kin') || (b.v.rar === 'r') - (a.v.rar === 'r'));
    const basics = R.deck.filter(c => c.id === 'bite' || c.id === 'harden');
    if (R.deck.length < 14 || (R.night % 2 === 1 && R.actions === 2 && R.deck.length < 24)) { D.draft(R); const cs = R.offer.cards.map((o, i) => [i, cardScore(R, o.id)]).sort((a, b) => b[1] - a[1]); if (cs[0][1] < 1.5 && R.deck.length >= 18) { D.skipOffer(R); continue; } if (cs[0][1] < 1.5 && R.ess > 40) { D.reroll(R); const c2 = R.offer.cards.map((o, i) => [i, cardScore(R, o.id)]).sort((a, b) => b[1] - a[1]); D.takeOffer(R, c2[0][0]); } else D.takeOffer(R, cs[0][0]); continue; }
    if (ups.length && rand01(R) < 0.6) { const u = ups[0]; D.upgrade(R, u.o.uid, u.o.secret); continue; }
    if (R.ess >= 90) { D.openShop(R); const items = R.shop.items.map((it, i) => [i, cardScore(R, it.id), it.price]).filter(x => x[1] > 2).sort((a, b) => b[1] - a[1]); for (const [i, , p] of items) { if (R.ess >= p + 20) D.shopBuy(R, i); } if (R.shop.molt && R.ess >= R.shop.molt.price + 20) D.shopBuy(R, 'molt'); continue; }
    if (basics.length > 3 && R.deck.length > 14) { D.removeCard(R, basics[0].uid); continue; }
    const dg = D.digOptions(R); if (dg.length) { const r = D.dig(R, dg[Math.floor(rand01(R) * dg.length)]); if (R.offer) { const cs = R.offer.cards.map((o, i) => [i, cardScore(R, o.id)]).sort((a, b) => b[1] - a[1]); D.takeOffer(R, cs[0][0]); } continue; }
    D.draft(R); D.takeOffer(R, 0);
  }
  // 남는 진액: 강화와 내보내기
  let g2 = 0;
  while (g2++ < 4 && R.ess >= D.essPrice(R, 'up') + 30) {
    const ups = D.upgradeOptions(R).map(o => ({ o, v: D.view(R.deck.find(c => c.uid === o.uid)) })).sort((a, b) => (b.v.type === 'kin') - (a.v.type === 'kin') || (b.v.rar === 'r') - (a.v.rar === 'r'));
    const basics = R.deck.filter(c => c.id === 'bite' || c.id === 'harden');
    if (basics.length > 2 && R.deck.length > 15 && R.ess >= D.essPrice(R, 'rm') + 30) { D.buyRemove(R, basics[0].uid); continue; }
    if (!ups.length) break; D.buyUpgrade(R, ups[0].o.uid, ups[0].o.secret);
  }
}
const rand01 = R => D.rnd(R);
function playRun(seed, aspect, opt) {
  opt = opt || {};
  const R = D.newRun(seed, { aspect, meta: opt.meta || D.newMeta(), body: opt.body });
  let g = 0;
  while (R.phase !== 'over' && g++ < 200) {
    if (R.phase === 'day' || R.phase === 'reward') { botDay(R, opt); if (R.phase === 'day') D.goNight(R); }
    else if (R.phase === 'night') botNight(R, opt);
  }
  return R;
}
module.exports = { playRun, botNight, botDay, bestPlay, cardScore, cardPower, opsValue };

if (require.main === module) {
  const n = +(process.argv[2] || 100), which = process.argv[3] || 'all', nohands = process.argv.includes('nohands'), full = process.argv.includes('full');
  if (process.argv.includes('offhands')) D.K.noHands = true;
  const asps = which === 'all' ? C.ASPS : [which];
  const meta0 = () => { const m = D.newMeta(); if (full) for (const id in C.UNLOCK) m.unlocked[id] = 1; return m; };
  const tot = { win: 0, n: 0, acts: [0, 0, 0, 0, 0], nights: 0, hands: {}, play: {}, inDeck: {}, inDeckWin: {}, needle: 0, needleWin: 0 };
  const per = {};
  for (const a of asps) {
    per[a] = { win: 0, n: 0, act2: 0 };
    for (let s = 1; s <= n; s++) {
      const R = playRun(s * 7919 + 13 + a.length, a, { nohands, meta: meta0() });
      const win = !!(R.over && R.over.win);
      per[a].n++; tot.n++; if (win) { per[a].win++; tot.win++; } if (R.act >= 2) per[a].act2++;
      tot.acts[Math.min(4, win ? 4 : R.act)]++; tot.nights += R.st.nightsWon;
      for (const h in R.st.hands) tot.hands[h] = (tot.hands[h] || 0) + R.st.hands[h];
      tot.needle += R.st.needleWins;
      const ids = new Set(R.deck.map(c => c.id)); ids.forEach(id => { const k = id + '|' + a; tot.inDeck[k] = (tot.inDeck[k] || 0) + 1; if (win) tot.inDeckWin[k] = (tot.inDeckWin[k] || 0) + 1; });
    }
  }
  const pc = (a, b) => b ? Math.round(100 * a / b) : 0;
  console.log('판 ' + tot.n + (nohands ? ' (족보 안 노림)' : '') + (full ? ' (모두 열림)' : '') + ' | 끝까지 ' + pc(tot.win, tot.n) + '% | 닿은 막 1/2/3/끝: ' + tot.acts.slice(1).map(x => pc(x, tot.n) + '%').join(' / ') + ' | 넘긴 밤 평균 ' + (tot.nights / tot.n).toFixed(1));
  console.log('색별: ' + asps.map(a => C.ASPN[a] + ' ' + pc(per[a].win, per[a].n) + '% (2막 ' + pc(per[a].act2, per[a].n) + '%)').join(' · '));
  console.log('족보(판당): ' + D.HANDS.map(h => h.name + ' ' + ((tot.hands[h.id] || 0) / tot.n).toFixed(2)).join(' · '));
  // 같은 빛깔 덱의 승률과 견준다 (빛깔 차이가 카드 값처럼 보이지 않게)
  const rows = Object.keys(tot.inDeck).filter(k => tot.inDeck[k] >= 12).map(k => { const [id, a] = k.split('|'); return [id, pc(tot.inDeckWin[k] || 0, tot.inDeck[k]) - pc(per[a].win, per[a].n), tot.inDeck[k]]; }).sort((x, y) => y[1] - x[1]);
  console.log('카드 값 폭: ' + (rows.length ? rows[0][1] + ' ~ ' + rows[rows.length - 1][1] : '-') + '%p, 잰 카드 ' + rows.length);
  console.log('덱에 있을 때 승률 차 (위 8): ' + rows.slice(0, 8).map(r => C.BY[r[0]].name + ' ' + (r[1] >= 0 ? '+' : '') + r[1] + '(' + r[2] + ')').join(', '));
  console.log('덱에 있을 때 승률 차 (아래 6): ' + rows.slice(-6).map(r => C.BY[r[0]].name + ' ' + (r[1] >= 0 ? '+' : '') + r[1] + '(' + r[2] + ')').join(', '));
}
