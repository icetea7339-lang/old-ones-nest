// 판마다 다른 둥지 모양이 화면에서 제대로 보이는가: 씨앗 셋으로 새 판 → 동굴 한 칸 → 파 올라가 뚫기 → 첫 밤
// node tests/mapview.js [기기 이름]   찍은 그림은 tests/mapview_<기기>/
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../../PLAY-GAME.html'), 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'mapview_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const touch = !!devName, errs = [], bad = [];
  for (const seed of [11, 2222, 777777]) {
    const p = await ctx.newPage(); p.setDefaultTimeout(7000);
    p.on('pageerror', e => errs.push(seed + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(seed + ': ' + m.text().slice(0, 160)); });
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(s => { __nest.META.auto = false; __nest.META.tutDone = true; window.__seed = s; }, seed);
    const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(160); };
    const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
    const closeM = async () => { for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="event"]:not([disabled])')) await tap('#modal [data-a="event"]:not([disabled])'); else if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; } };
    const shot = async label => {
      await p.waitForTimeout(500);
      const m = await p.evaluate(() => { const r = [], d = document.scrollingElement; if (d.scrollHeight > innerHeight + 1) r.push('페이지 넘침 ' + (d.scrollHeight - innerHeight)); const v = document.getElementById('view'); if (v && v.offsetParent && v.scrollHeight - v.clientHeight > 2) r.push('패널 넘침'); return r; });
      if (m.length) bad.push(seed + ' ' + label + ': ' + m.join(', '));
      await p.screenshot({ path: path.join(out, seed + '_' + label + '.png') });
    };
    try {
      await tap('[data-a="new"]'); if (await has('[data-a="setup"][data-k="tut"].on')) await tap('[data-a="setup"][data-k="tut"]');
      await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300); if (await has('[data-a="sceneskip"]')) await tap('[data-a="sceneskip"]'); await closeM();
      const L = await p.evaluate(() => { const G = __nest.G; return { cols: G.cols, rows: G.rows, ent: G.ent, core: G.core, start: G.start }; });
      console.log(seed, '모양', L.cols + '×' + L.rows, '입구', L.ent, '본체', L.core, '자국', L.start.join(','));
      // 본체 방이 화면 가운데쯤에 보이는가
      await p.waitForTimeout(800);
      const seen = await p.evaluate(() => { const G = __nest.G, c = __nest.cellAt(G.core), xy = __nest.toClient(c[0], c[1]), b = document.getElementById('stage').getBoundingClientRect(); return xy[0] > b.left && xy[0] < b.right && xy[1] > b.top && xy[1] < b.bottom; });
      if (!seen) bad.push(seed + ': 처음 화면에 본체 방이 보이지 않는다');
      await shot('1_sealed');
      // 무른 흙을 아래에서부터 손으로 판다: 판 칸을 눌러 "파기"
      for (let k = 0; k < 12; k++) {
        const i = await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; return G.start.slice().reverse().find(j => !G.cells[j].dug && !S.canDig(G, j)); }); if (i == null) break;
        const c = await p.evaluate(i => __nest.cellAt(i), i); await p.evaluate(c => __nest.aim(c[0], c[1]), c); await p.waitForTimeout(160);
        const xy = await p.evaluate(c => __nest.toClient(c[0], c[1]), c); if (touch) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(250);
        if (!(await has('[data-a="dig"]'))) { bad.push(seed + ': 무른 흙 칸을 눌러도 파기가 없다 (' + i + ')'); break; }
        await tap('[data-a="dig"]'); await p.evaluate(() => { __nest.G.ap = 9; __nest.G.d.buildOps = 9; });
        if (await has('[data-a="closesheet"]')) await tap('[data-a="closesheet"]');
      }
      await shot('2_dug');
      await tap('[data-a="breach"]'); await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(500);
      for (let i = 0; i < 6 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await closeM();
      await shot('3_surface');
      await tap('[data-a="view"][data-v="under"]'); await p.waitForTimeout(2600); await shot('4_under');
      await p.evaluate(() => { const G = __nest.G; G.march.tonight = { vill: 'field', settle: false }; });
      await tap('[data-a="endday"]'); await p.waitForTimeout(200); if (await has('[data-a="endday"]')) await tap('[data-a="endday"]');
      for (let i = 0; i < 60; i++) { await p.waitForTimeout(100); if (await has('#hand [data-a="hand"]')) break; if (await has('#modal [data-a="close"]')) break; }
      await shot('5_night');
      for (let i = 0; i < 300; i++) { await p.waitForTimeout(70); await p.evaluate(() => { __nest.ST.skip = true; const h = document.querySelector('#hand:not([hidden]) [data-a="hand"][data-k="none"]'); if (h) h.click(); }); if (await has('#modal [data-a="close"]')) break; }
      await closeM(); await p.waitForTimeout(300); if (await has('[data-a="sceneskip"]')) await tap('[data-a="sceneskip"]'); await closeM();
      await shot('6_day2');
      const day = await p.evaluate(() => __nest.G.day); if (day < 2) bad.push(seed + ': 밤을 넘기지 못했다');
    } catch (e) { bad.push(seed + ' 스크립트: ' + e.message.split('\n')[0]); }
    await p.close();
  }
  console.log(tag, bad.length ? '실패 ' + bad.join(' | ') : '통과', errs.length ? '| 오류: ' + [...new Set(errs)].slice(0, 4).join(' / ') : '| no errors');
  await b.close();
})();
