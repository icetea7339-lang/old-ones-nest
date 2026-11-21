// 카드로 짓는 판 화면 시험: 시작 → 굴(돌리기)·기관·부위·권속 놓기 → 창들 → 밤(멈추면 기술 카드) → 보상 → 바늘 점 → 허물 → 판 끝(알) → 도감
// node tests/cardui.js [기기: 비우면 PC | "iPhone 14" | a360 | a412]   (FZ=1.3 이면 큰 글씨로)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = (dev ? dev.replace(/\s+/g, '') : 'pc') + (FZM.FZ ? '_fz' + FZM.FZ : ''), out = path.join(__dirname, 'cardui_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = [], warns = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /카드 밤/.test(m.text())) warns.push(m.text().slice(0, 200)); });
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const shot = async label => { await p.waitForTimeout(380); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); const cl = await p.evaluate(FZM.clipScript); const over = await p.evaluate(() => { const o = []; if (document.scrollingElement.scrollWidth > innerWidth + 1) o.push('옆으로 넘침'); return o; }); cl.concat(over).forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(140); };
  const tapCell = async i => { await p.evaluate(i => __card.cam(i), i); await p.waitForTimeout(500); const pt = await p.evaluate(i => __card.pt(i), i); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(160); };
  // 손에 카드를 쥐여 준다 (없으면 덱에 넣어서)
  const give = (type, pick) => p.evaluate(([type, pick]) => { const R = __card.run, C = CARDS2; let c = R.hand.map(u => R.deck.find(x => x.uid === u)).find(x => x && C.BY[x.id].type === type && (!pick || x.id === pick)); if (!c) { const d = C.LIST.find(x => x.type === type && (!pick || x.id === pick) && (type !== 'trap' || x.trap)); c = __card.CARDMODE.addCard(R, d.id); R.hand.push(c.uid); } R.G.gold = Math.max(R.G.gold, 400); __card.CARDMODE.syncHeld(R); __card.render(); return c.uid; }, [type, pick || null]);
  const rer = () => p.evaluate(() => { __card.select(null); });

  await shot('title');
  await tap('[data-a="deck"]'); await shot('start');
  await tap('[data-c="asp"][data-v="dusk"]'); await tap('[data-c="look"][data-v="bead"]'); await shot('start_dusk');
  await p.evaluate(() => { __card.META.pause = 'always'; }); await tap('[data-c="begin"]'); await shot('day');
  // 굴: 카드를 들고 → 칸을 눌러 자리를 보고 → 돌리고 → 놓는다
  { const uid = await give('shape', 'sh_bend') ; await tap(`#chand [data-c="card"][data-uid="${uid}"]`); await shot('shape_lift');
    const cell = await p.evaluate(uid => { const v = __card.CARDMODE.handView(__card.run).find(x => x.uid === uid); return v.places[0][0]; }, uid); await tapCell(cell); await shot('shape_ghost');
    if (await p.$('#chand [data-c="rot"]')) { await tap('#chand [data-c="rot"]'); await shot('shape_rot'); }
    const dug0 = await p.evaluate(() => __card.run.G.cells.filter(c => c.dug).length); await tap('#chand [data-c="put"]'); const dug1 = await p.evaluate(() => __card.run.G.cells.filter(c => c.dug).length); if (dug1 <= dug0) bad.push('굴 카드를 놓았는데 칸이 늘지 않았다'); await shot('shape_put'); }
  // 끌어서 놓기: 손의 굴 카드를 위로 끌어 지도 칸 위에서 놓는다 (손가락을 따라 그림자가 움직인다)
  { const uid = await give('shape', 'sh_bend'); await p.evaluate(uid => { const el = document.querySelector(`#chand [data-c="card"][data-uid="${uid}"]`); if (el) el.scrollIntoView({ inline: 'center', block: 'nearest' }); }, uid); await p.waitForTimeout(200);
    const cell = await p.evaluate(uid => { const v = __card.CARDMODE.handView(__card.run).find(x => x.uid === uid); return v && v.places[0] ? v.places[0][0] : null; }, uid);
    const box = await (await p.$(`#chand [data-c="card"][data-uid="${uid}"]`)).boundingBox(), sx = box.x + box.width / 2, sy = box.y + box.height / 2;
    await p.mouse.move(sx, sy); await p.mouse.down(); await p.mouse.move(sx, sy - 30, { steps: 4 }); await p.waitForTimeout(250);
    const pt = await p.evaluate(i => __card.pt(i), cell); await p.mouse.move(pt.x, pt.y, { steps: 8 }); await shot('drag_ghost');
    const dug0 = await p.evaluate(() => __card.run.G.cells.filter(c => c.dug).length); await p.mouse.up(); await p.waitForTimeout(300);
    const dug1 = await p.evaluate(() => __card.run.G.cells.filter(c => c.dug).length); if (dug1 <= dug0) bad.push('끌어서 놓았는데 칸이 늘지 않았다'); await shot('drag_put'); }
  // 몸이 다시 쓴 카드: 손의 카드 하나를 형질이 바꾼 것으로 바꿔 보고, 표시(형질 빛깔 테두리·꼬리표·무늬)와 길게 누른 설명을 본다
  { const uid = await p.evaluate(() => { const R = __card.run, CM = __card.CARDMODE, tags = ['spore', 'eye', 'maw', 'water', 'bone', 'tent', 'face', 'egg']; for (const u of R.hand) { const c = R.deck.find(x => x.uid === u); for (const t of tags) { const id = 'gx_' + t + '__' + c.id; if (CM.def({ id })) { c.from = c.id; c.id = id; __card.render(); return u; } } } return null; });
    if (uid == null) bad.push('다시 쓴 카드를 만들지 못했다'); else { await p.evaluate(uid => { const el = document.querySelector(`#chand [data-uid="${uid}"]`); if (el) el.scrollIntoView({ inline: 'center', block: 'nearest' }); }, uid); await shot('gene_hand');
      const gb = await (await p.$(`#chand [data-uid="${uid}"]`)).boundingBox(); await p.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await shot('gene_detail');
      const has = await p.evaluate(() => !!document.querySelector('#cm-sheet .dkc.gene .dkc-gene') && /원래/.test(document.getElementById('cm-sheet').textContent)); if (!has) bad.push('다시 쓴 카드 표시나 원래 이름이 없다'); await p.evaluate(() => { const x = document.querySelector('#cm-sheet [data-c="close"]'); if (x) x.click(); }); } }
  // 기관·부위: 들고 → 빛나는 칸
  for (const ty of ['organ', 'trap']) { const uid = await give(ty); await tap(`#chand [data-c="card"][data-uid="${uid}"]`); await shot(ty + '_lift'); const cell = await p.evaluate(uid => { const v = __card.CARDMODE.handView(__card.run).find(x => x.uid === uid); return (v.cellsCan || [])[0]; }, uid); if (cell == null) { bad.push(ty + ': 놓을 칸이 없다'); await rer(); continue; } await tapCell(cell); const gone = await p.evaluate(uid => !__card.run.hand.includes(uid), uid); if (!gone) bad.push(ty + ' 카드를 놓지 못했다'); await shot(ty + '_put'); }
  // 권속: 들고 → 내기
  { const uid = await give('kin'); await tap(`#chand [data-c="card"][data-uid="${uid}"]`); await shot('kin_lift'); await tap('#chand [data-c="put"]'); const gone = await p.evaluate(uid => !__card.run.hand.includes(uid), uid); if (!gone) bad.push('권속 카드를 내지 못했다'); await shot('kin_put'); }
  // 창들
  await tap('[data-c="deck"]'); await shot('deck'); await tap('#cm-sheet [data-c="close"]');
  await tap('#mnav [data-c="shop"]'); await shot('shop'); { const bb = await p.$('#cm-sheet [data-c="buy"]:not([disabled])'); if (bb) await bb.click(); } await tap('#cm-sheet [data-c="close"]');
  await tap('#mnav [data-c="up"]'); await shot('upgrade'); { const u = await p.$('#cm-sheet [data-c="doup"]:not([disabled])'); if (u) { await u.click(); await shot('upgraded'); } } await tap('#cm-sheet [data-c="close"]');
  await tap('#mnav [data-c="rm"]'); await shot('remove'); await tap('#cm-sheet [data-c="close"]');
  { const el = await p.$('#chand .dkc'); const bb = await el.boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await shot('detail'); await tap('#cm-sheet [data-c="close"]'); }
  if (await p.$('[data-c="combos"]')) { await tap('[data-c="combos"]'); await shot('combos'); await tap('#cm-sheet [data-c="close"]'); }
  // 밤: 조용한 밤 둘을 빨리 넘기고, 셋째 밤에 무리가 온다. 멈추면 기술 카드를 낸다
  const night = async (label, castSkill) => {
    await p.evaluate(() => { __card.ST.speed = 4; });
    await tap('#mnav [data-c="night"]');
    if (await p.$('#cm-ov [data-c="go"]')) { await shot(label + '_keep'); const k = await p.$('#cm-ov [data-c="keep"]'); if (k) await k.click(); await tap('#cm-ov [data-c="go"]'); }
    let asked = 0, cast = 0; const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      await p.waitForTimeout(250);
      if (await p.evaluate(() => !document.getElementById('hand').hidden)) {
        asked++; if (asked === 1) await shot(label + '_ask');
        const cb = castSkill && !cast ? await p.$('#hand .cm-cbtn:not([disabled])') : null;
        if (cb) { await cb.click(); cast++; await p.waitForTimeout(200); if (await p.$('#hand [data-a="handback"]')) { const tgt = await p.$('#hand [data-a="handpick"]'); if (tgt) await tgt.click(); else { await tap('#hand [data-a="handback"]'); cast--; } } }
        else await tap('#hand [data-a="hand"][data-k="none"]');
        continue;
      }
      if (await p.evaluate(() => !document.getElementById('modal').hidden)) { await shot(label + '_settle'); await tap('#modal [data-a="close"]'); break; }
    }
    return { asked, cast };
  };
  const r1 = await night('night1', false); await p.waitForTimeout(400); if (await p.$('#cm-ov [data-c="reward"]')) await tap('#cm-ov [data-c="rskip"]');
  const r2 = await night('night2', false); await p.waitForTimeout(400); if (await p.$('#cm-ov [data-c="reward"]')) await tap('#cm-ov [data-c="rskip"]');
  await give('skill', 'sk_rock'); await p.evaluate(() => { __card.run.G.faith = 30; __card.render(); }); await shot('day3_skill');
  const r3 = await night('night3', true); console.log(tag, '셋째 밤 멈춤', r3.asked, '기술 카드', r3.cast);
  if (!r3.asked) bad.push('셋째 밤에 멈추지 않았다'); if (!r3.cast) bad.push('기술 카드를 내지 못했다');
  await p.waitForTimeout(500);
  if (await p.$('#cm-ov [data-c="reward"]')) { await shot('reward'); await tap('#cm-ov [data-c="reward"][data-i="0"]'); } else console.log(tag, '보상 창 없음 (진 밤?)');
  await shot('day4');
  // 바늘 점
  await p.evaluate(() => { __card.run.needleOffer = true; __card.run.G.gold = 300; __card.render(); }); await tap('#mapchips [data-c="needle"]'); await shot('needle');
  await tap('#cm-ov [data-c="nbet"][data-v="ess"]'); await tap('#cm-ov [data-c="nopen"]'); await shot('needle_3'); await tap('#cm-ov [data-c="nopen"]'); await tap('#cm-ov [data-c="nopen"]'); await shot('needle_result'); await tap('#cm-ov [data-c="ndone"]');
  // 허물 (게놈 단계가 없으면 짐작으로)
  await p.evaluate(() => { const R = __card.run, g0 = __card.genome(); R.G.stats.trapKills = (R.G.stats.trapKills || 0) + 30; R.G.stats.infections = (R.G.stats.infections || 0) + 12; R.G.slime.stage = Math.max(1, R.G.slime.stage); __card.molt(__card.guess(g0, 0)); }); await shot('molt'); await p.waitForTimeout(1300); await shot('molt_after'); await tap('#cm-ov [data-c="moltok"]');
  // 판 끝 → 알 → 도감
  await p.evaluate(() => { const R = __card.run; R.G.over = { win: false, why: '시험' }; __card.CARDMODE.endRun(R); __card.finish(); }); await shot('over');
  await tap('#cm-ov [data-c="egg-lay"]'); await shot('over_egg');
  await tap('#cm-ov [data-c="codex"]'); await shot('codex_cards'); await tap('#cm-ov [data-c="ctab"][data-v="form"]'); await shot('codex_forms'); await tap('#cm-ov [data-c="cback"]');
  await tap('#cm-ov [data-c="again"]'); await shot('start_egg');
  const eggs = await p.evaluate(() => (__card.META.cards.eggs || []).length); if (!eggs) bad.push('알이 남지 않았다');
  await tap('#cm-ov [data-c="home"]'); await shot('back_title');
  await b.close();
  if (warns.length) console.log(tag, '밤 되돌려 다시 돌리기 차이:', warns.join(' | '));
  console.log(tag, '화면 ' + n + ' 개 · ' + (bad.length ? '문제 ' + bad.length + '\n  ' + bad.join('\n  ') : '잘린 글 없음') + ' · ' + (errs.length ? 'ERR ' + errs.join(' | ') : 'no errors'));
  if (bad.length || errs.length) process.exitCode = 1;
})();
