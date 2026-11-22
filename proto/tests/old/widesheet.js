// 넓은 화면 카드 판 견본: 1366x768, 1920x1080 낮·허물 직전·허물 순간.  node tests/widesheet.js
const pw = require('playwright'), fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8'), out = path.join(__dirname, 'widesheet'); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), errs = [];
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    await p.goto('http://nest.test/'); await p.waitForTimeout(400);
    await p.evaluate(() => { __card.open(); }); await p.waitForTimeout(300); await p.evaluate(() => { __card.begin(); }); await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(out, w + '_day.png') });
    const empty = await p.evaluate(() => { const s = document.getElementById('stage').getBoundingClientRect(), side = document.getElementById('cm-side'); return { stageW: Math.round(s.width), side: side && !side.hidden ? Math.round(side.getBoundingClientRect().width) : 0, wide: document.getElementById('game').classList.contains('cm-wide') }; });
    console.log(w, JSON.stringify(empty));
    await p.evaluate(() => { const R = __card.run; if (__card.CARDMODE.evoBar) { const b0 = __card.CARDMODE.evoBar(R); } document.getElementById('cm-body').classList.add('near'); });
    await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, w + '_near.png') });
    await p.evaluate(() => { const g = __card.genome(); const g2 = JSON.parse(JSON.stringify(g)); g2.stage = (g2.stage || 1) + 1; window.__forceMoltIntro = true; window.__mi = __card.molt({ before: g, after: g2, lines: ['굴 바닥에 차오른 물이 빠지지 않았고, 옆구리에 아가미 같은 틈이 벌어졌다.'], gained: ['water'], name: { name: '시험', title: '' }, mutated: [] }); });
    await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, w + '_molt_in.png') });
    await p.waitForTimeout(1400); await p.screenshot({ path: path.join(out, w + '_molt.png') });
  }
  await b.close(); console.log(errs.length ? errs.join('\n') : 'no errors');
})();
