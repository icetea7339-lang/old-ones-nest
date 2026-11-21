// 덱 판 화면 시험: 시작 → 낮 행동(카드·파기·강화·내보내기·상점·기관) → 밤(카드를 눌러 낸다, 턴 끝) → 보상 → 바늘 점 → 판 끝 → 도감
// node tests/deckui.js [기기: 비우면 PC | "iPhone 14" | a360 | a412]   (FZ=1.3 이면 큰 글씨로)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = (dev ? dev.replace(/\s+/g, '') : 'pc') + (FZM.FZ ? '_fz' + FZM.FZ : ''), out = path.join(__dirname, 'deckui_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(8000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const shot = async label => { await p.waitForTimeout(350); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); const cl = await p.evaluate(FZM.clipScript); const over = await p.evaluate(() => { const o = []; const d = document.getElementById('deck'); if (d && !d.hidden && d.scrollWidth > innerWidth + 1) o.push('덱 화면이 옆으로 넘침'); return o; }); cl.concat(over).forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(120); };
  const tapCell = async i => { await p.evaluate(i => { const cv = document.getElementById('dk-cv'), b = cv.getBoundingClientRect(), r = __deck.rect(i); cv.dispatchEvent(new MouseEvent('click', { clientX: b.left + r.x + r.w / 2, clientY: b.top + r.y + r.h / 2, bubbles: true })); }, i); await p.waitForTimeout(150); };
  await shot('title');
  await tap('[data-a="deck"]'); await shot('start');
  await tap('[data-d="asp"][data-v="dusk"]'); await shot('start_dusk');
  await p.evaluate(() => __deck.begin('brood', 12345)); await shot('day');
  // 카드 셋 중 하나
  await tap('[data-d="draft"]'); await shot('draft'); await tap('#dk-sheet [data-d="take"]');
  // 파기
  await tap('[data-d="dig"]'); await shot('dig_mode');
  const dc = await p.evaluate(() => __deck.DECK.digOptions(__deck.R)[0]); if (dc != null) { await tapCell(dc); await shot('dig_result'); await tap('#dk-ov [data-d="digok"]'); if (await p.evaluate(() => !!__deck.R.offer)) { await shot('bones_offer'); await tap('#dk-sheet [data-d="take"]'); } }
  // 강화·내보내기(진액으로)·상점·덱·기관
  await p.evaluate(() => { __deck.R.ess = 400; __deck.render(); });
  await tap('[data-d="upgrade"]'); await shot('upgrade'); { const u = await p.$('#dk-sheet [data-d="doup"][data-pay="1"]'); if (u) { await u.click(); await shot('upgraded'); await tap('#dk-ov [data-d="digok"]'); } }
  await tap('[data-d="remove"]'); await shot('remove'); await tap('#dk-sheet [data-d="close"]');
  await p.evaluate(() => { __deck.R.actions = 1; __deck.render(); }); await tap('[data-d="shop"]'); await shot('shop'); { const bb = await p.$('#dk-sheet [data-d="buy"]:not([disabled])'); if (bb) await bb.click(); } await tap('#dk-sheet [data-d="close"]');
  await tap('[data-d="deck"]'); await shot('deck'); await tap('#dk-sheet [data-d="close"]');
  if (await p.$('[data-d="organs"]')) { await tap('[data-d="organs"]'); await shot('organs'); const po = await p.$('#dk-sheet [data-d="porgan"]:not([disabled])'); if (po) { await po.click(); const cell = await p.evaluate(() => __deck.DKU.hl[0]); if (cell != null) { await tapCell(cell); await shot('organ_placed'); } } else await tap('#dk-sheet [data-d="close"]'); }
  await p.evaluate(() => { const c = document.querySelector('#deck .dkc[data-uid]') ; });
  // 밤
  await tap('[data-d="night"]'); await shot('night');
  for (let turn = 0; turn < 30; turn++) {
    const st = await p.evaluate(() => __deck.R.phase); if (st !== 'night') break;
    for (let k = 0; k < 6; k++) {
      const c = await p.evaluate(() => { const v = __deck.DECK.nightView(__deck.R); const h = v.hand.find(x => x.can && x.cells.length && x.type !== 'curse'); return h ? { uid: h.uid, cell: h.cells[0] } : null; }); if (!c) break;
      await tap('#dk-low .dkc[data-uid="' + c.uid + '"]'); if (turn === 0 && k === 0) await shot('night_lift');
      if (c.cell !== null) await tapCell(c.cell); else await tap('#dk-low .dkc[data-uid="' + c.uid + '"]');
      if (await p.evaluate(() => __deck.R.phase) !== 'night') break;
    }
    if (turn === 0) await shot('night_played');
    if (await p.evaluate(() => __deck.R.phase) !== 'night') break;
    await tap('[data-d="end"]'); await p.waitForTimeout(450); if (turn === 1) await shot('night_turn2');
    if (turn === 4 && await p.evaluate(() => __deck.R.phase) === 'night') { await p.evaluate(() => __deck.win()); await p.waitForTimeout(300); }
  }
  await p.waitForTimeout(1200);
  const ph = await p.evaluate(() => __deck.R.phase); console.log(tag, '밤 뒤', ph);
  if (ph === 'reward') { await shot('reward'); await tap('#dk-ov [data-d="reward"][data-i="0"]'); await shot('day2'); }
  // 바늘 점
  await p.evaluate(() => { __deck.R.needleOffer = true; __deck.R.ess = Math.max(__deck.R.ess, 60); __deck.render(); }); await tap('[data-d="needle"]'); await shot('needle');
  await tap('#dk-ov [data-d="nbet"][data-v="ess"]'); await tap('#dk-ov [data-d="nbet"][data-v="ess"]'); await tap('#dk-ov [data-d="nopen"]'); await shot('needle_3');
  await tap('#dk-ov [data-d="nopen"]'); await tap('#dk-ov [data-d="nopen"]'); await shot('needle_result'); await tap('#dk-ov [data-d="ndone"]');
  // 자세히(길게 누르기와 같은 창)
  await p.evaluate(() => { const c = document.querySelector('[data-d="deck"]'); c && c.click(); }); await p.waitForTimeout(200); await tap('#dk-sheet .dkc[data-d="peek"]'); await shot('detail'); await tap('#dk-sheet [data-d="close"]');
  // 판 끝
  await p.evaluate(() => __deck.finish(false)); await shot('over');
  await tap('#dk-ov [data-d="again"]'); await tap('[data-d="codex"]'); await shot('codex');
  await tap('#dk-ov [data-d="back"]'); await tap('[data-d="home"]'); await shot('back_title');
  await b.close();
  console.log(tag, '화면 ' + n + ' 개', bad.length ? '\n  ' + bad.slice(0, 40).join('\n  ') : '· 잘린 글 없음', errs.length ? '\n오류 ' + errs.slice(0, 5).join('\n') : '· no errors');
  process.exitCode = bad.length || errs.length ? 1 : 0;
})().catch(e => { console.error('실패', e.message); process.exitCode = 1; });
