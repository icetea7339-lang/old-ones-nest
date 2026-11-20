// 네 세상이 화면에서 어떻게 달라 보이는지: 뚫는 장면의 글, 둥지 창, 예보, 도움말 "세상 넷", 그리고 침입자 전부의 그림.
//   node tests/worldshow.js [기기: pc | "iPhone 14"]   → ../w1_<세상>_<기기>.png, ../w1_sheet.png
const pw = require('playwright'); const fs = require('fs');
const ROOT = '/tmp/claude-0/-home-user-old-ones-nest/3f27d994-873b-53a8-8dbc-9e7b2cfe68eb/scratchpad/fx';
const html = fs.readFileSync(ROOT + '/PLAY-GAME.html', 'utf8'), devName = process.argv[2] && process.argv[2] !== 'pc' ? process.argv[2] : '', tag = devName ? devName.replace(/\s+/g, '') : 'pc';
(async () => {
  const b = await pw.chromium.launch(); let bad = 0;
  for (const w of ['fantasy', 'wuxia', 'modern', 'future']) {
    let ctx; if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(6000); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; });
    const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (devName) await el.tap(); else await el.click(); await p.waitForTimeout(300); }, has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
    await tap('[data-a="new"]'); await tap('[data-a="close"][data-v="go"]'); await tap('[data-a="sceneskip"]'); await p.waitForTimeout(300); if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]');
    await p.evaluate(w => { const N = __nest.NEST, G = __nest.G; G.forceWorld = w; N.openTrail(G); }, w);
    await tap('[data-a="breach"]'); await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(500);
    const lines = [];
    for (let i = 0; i < 12 && await has('[data-a="sceneskip"]'); i++) { const t = await p.evaluate(() => { const e = document.querySelector('#scene .txt'); return e ? e.textContent : ''; }); if (t && !lines.includes(t)) lines.push(t); await p.keyboard.press('Space'); await p.waitForTimeout(140); await p.keyboard.press('Space'); await p.waitForTimeout(160); }
    for (let i = 0; i < 3 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(400);
    const names = await p.evaluate(() => { const N = __nest.NEST; return N.WORLD[__nest.G.world].only.map(k => N.INV[k].name); });
    const said = names.every(n => lines.some(l => l.includes(n))) && lines.some(l => l.includes('이 세상에만 있는 것')) && lines.some(l => l.includes('오는 박자'));
    if (!said) bad++;
    console.log('== ' + w + ' (' + tag + ') 뚫는 장면: ' + (said ? '규칙·박자·이 세상에만 있는 것을 말함' : '빠짐!')); lines.filter(l => l.includes('박자') || l.includes('이 세상에만')).forEach(l => console.log('   ' + l));
    // 큰 밤 하루 전으로 옮겨 예보에 그 세상의 것이 보이게 한다
    await p.evaluate(() => { const N = __nest.NEST, G = __nest.G; G.day = 15; G.fear = 60; G.guest = null; G.event = null; G.march.tonight = { vill: 'fort', settle: false }; G.march.tomorrow = { vill: 'school', settle: true }; G.known = true; document.querySelector('[data-a="view"][data-v="under"]').click(); });
    await p.waitForTimeout(300);
    const fore = await p.evaluate(() => { const e = document.getElementById('fore'); return e ? e.innerText.replace(/\n/g, ' ') : ''; }); console.log('   예보: ' + fore);
    if (!names.some(n => fore.includes(n))) { bad++; console.log('   예보에 이 세상의 것이 없다!'); }
    if (devName) { await p.evaluate(() => { document.getElementById('right').classList.add('open'); }); await p.waitForTimeout(300); }
    const view = await p.evaluate(() => { const e = document.getElementById('view'); return { t: e.innerText, over: e.scrollWidth - e.clientWidth }; });
    if (!names.every(n => view.t.includes(n)) || !view.t.includes('이 세상에만 있는 것')) { bad++; console.log('   둥지 창에 이 세상의 것이 없다!'); } if (view.over > 2) { bad++; console.log('   둥지 창이 옆으로 넘침 ' + view.over); }
    await p.screenshot({ path: ROOT + '/w1_' + w + '_' + tag + '.png' });
    if (devName) { await p.evaluate(() => { document.getElementById('right').classList.remove('open'); }); await p.waitForTimeout(200); }
    await p.evaluate(() => { document.querySelector('[data-a="view"][data-v="surface"]').click(); }); await p.waitForTimeout(500); await p.screenshot({ path: ROOT + '/w1_' + w + '_' + tag + '_surface.png' });
    if (w === 'fantasy') {
      await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="help"], [data-a="menu"]')].find(x => x.offsetParent); if (e) e.click(); }); await p.waitForTimeout(300); if (await has('#modal [data-a="help"]')) await tap('#modal [data-a="help"]');
      await tap('#modal [data-a="tab"][data-g="help"][data-v="worlds"]'); await p.screenshot({ path: ROOT + '/w1_help_' + tag + '.png' }); if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]');
      // 침입자 전부: 세상마다 한 줄. 그 세상에만 있는 것은 노란 이름
      await p.evaluate(Z => { const N = __nest.NEST, wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#2a2438;padding:10px;display:grid;grid-template-columns:auto repeat(10,auto);gap:10px 8px;font:12px sans-serif;color:#ddd;align-items:end';
        for (const w of N.WORLD_IDS) { const ks = Object.keys(N.INV).filter(k => !N.INV[k].only || N.INV[k].only === w); wrap.insertAdjacentHTML('beforeend', '<div style="font:15px sans-serif;color:#e8c030;align-self:center">' + N.WORLD[w].name + '</div>');
          ks.forEach((k, n) => { if (n && n % 10 === 0) wrap.insertAdjacentHTML('beforeend', '<div></div>'); const cv = __nest.invCanvasW(w, k), big = document.createElement('canvas'); big.width = cv.width * Z; big.height = cv.height * Z; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(cv, 0, 0, big.width, big.height);
            const d = document.createElement('div'); d.style.cssText = 'text-align:center;display:flex;flex-direction:column;align-items:center'; d.appendChild(big); d.insertAdjacentHTML('beforeend', '<div style="' + (N.INV[k].only ? 'color:#ffd23a' : '') + '">' + ((N.WORLD[w].inv[k]) || N.INV[k].name) + '</div>'); wrap.appendChild(d); }); }
        document.body.appendChild(wrap); }, 4);
      if (!devName) { await p.setViewportSize({ width: 1500, height: 1500 }); await p.waitForTimeout(200); await p.locator('#sheet').screenshot({ path: ROOT + '/w1_sheet.png' }); }
    }
    if (errs.length) { bad++; console.log('   오류: ' + errs.join(' / ')); }
    await ctx.close();
  }
  console.log(bad ? '실패 ' + bad : '통과'); await b.close(); process.exit(bad ? 1 : 0);
})();
