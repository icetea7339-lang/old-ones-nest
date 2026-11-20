// 세계마다: 뚫은 뒤의 화면 글에 "마을"이나 풀리지 않은 자리표({…})가 남아 있는지 본다.  node folkcheck.js [기기]
const pw = require('playwright'); const fs = require('fs');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8'); const devName = process.argv[2] || '';
(async () => {
  const b = await pw.chromium.launch(); let bad = 0;
  for (const w of ['fantasy', 'wuxia', 'modern', 'future']) {
    let ctx; if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(6000); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; __nest.META.openAll = true; });
    const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (devName) await el.tap(); else await el.click(); await p.waitForTimeout(300); }, has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
    const seen = [], grab = async label => { const t = await p.evaluate(() => document.body.innerText); const hits = []; for (const line of t.split('\n')) { if (/\{[가-힣]+\}/.test(line) || /\((이|을|은|와|으)\)|이\(가\)|을\(를\)|은\(는\)|와\(과\)/.test(line)) hits.push('자리표: ' + line.trim().slice(0, 70)); else if (line.includes('마을')) hits.push(line.trim().slice(0, 70)); } seen.push([label, hits]); if (process.env.DEBUG === w) { const f = await p.evaluate(() => __nest.NEST.folk(__nest.G)); const ls = t.split('\n').filter(x => x.includes(f)); console.log('   · ' + label + ': ' + f + ' ' + ls.length + '줄' + (ls[0] ? ' — ' + ls[0].trim().slice(0, 80) : '')); } };
    await tap('[data-a="new"]'); await tap('[data-a="close"][data-v="go"]'); await tap('[data-a="sceneskip"]'); await p.waitForTimeout(300); if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]');
    await p.evaluate(w => { const N = __nest.NEST, G = __nest.G; G.forceWorld = w; N.openTrail(G); }, w);
    await tap('[data-a="breach"]'); await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(500);
    for (let i = 0; i < 8 && await has('[data-a="sceneskip"]'); i++) { await grab('뚫는 장면'); await p.evaluate(() => { const e = document.querySelector('#scene .txt'); if (e) e.click(); }); await p.keyboard.press('Space'); await p.waitForTimeout(120); await p.keyboard.press('Space'); await p.waitForTimeout(150); }
    for (let i = 0; i < 3 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(400);
    await grab('지상');
    // 마을 창 (정보, 습격), 길목 창
    await p.evaluate(() => { const G = __nest.G; G.day = 9; G.ap = 2; });
    for (const v of ['gaet', 'fort']) { await p.evaluate(v => { const ev = new MouseEvent('click', { bubbles: true }); window.__sel = v; }, v); }
    const pick = async (kind, key) => { await p.evaluate(([kind, key]) => { const b = document.createElement('button'); b.dataset.a = 'none'; }, [kind, key]); };
    // 지도의 마을을 눌러 창을 연다
    const tapStage = async (lx, ly) => { await p.evaluate(lx => { const S = __nest.ST; S.cam.tx = S.cam.x = Math.max(0, Math.min(960 - S.viewW, lx - S.viewW / 2)); }, lx); await p.waitForTimeout(150); const xy = await p.evaluate(([lx, ly]) => { const bb = document.getElementById('stage').getBoundingClientRect(), u = bb.height / 550, S = __nest.ST; return [bb.left + (lx - S.cam.x + S.ox) * u, bb.top + (ly - (S.cam.y || 0)) * u]; }, [lx, ly]); if (devName) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(300); };
    await tapStage(258 + 6, 146 + 20); await grab('마을 창: 정보'); if (await has('[data-a="tab"][data-g="vill"][data-v="raid"]')) { await tap('[data-a="tab"][data-g="vill"][data-v="raid"]'); await grab('마을 창: 습격'); }
    await tapStage(480, 322); await grab('길목 창');
    if (await has('#sheetclose')) await tap('#sheetclose');
    // 도움말 전부
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="help"], [data-a="menu"]')].find(x => x.offsetParent); if (e) e.click(); }); await p.waitForTimeout(300); if (await has('#modal [data-a="help"]')) await tap('#modal [data-a="help"]');
    const tabs = await p.$$eval('#modal [data-a="tab"][data-g="help"]', es => es.map(e => e.dataset.v)); for (const t of tabs) { await tap(`#modal [data-a="tab"][data-g="help"][data-v="${t}"]`); await grab('도움말 ' + t); } if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]');
    // 밤 손님과 아침 사건 전부
    for (const g of ['merchant', 'pilgrims', 'child', 'poet', 'deserter']) { await p.evaluate(g => { __nest.G.guest = { type: g, vill: 'field' }; document.querySelector('[data-a="view"][data-v="under"]').click(); }, g); await p.waitForTimeout(150); await tap('[data-a="open"][data-v="guest"]'); await grab('손님 ' + g); if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); }
    await p.evaluate(() => { __nest.G.guest = null; });
    for (const e of ['traveler', 'pilgrims', 'pilgrims2', 'mapper1', 'mapper2', 'informer2', 'tax', 'feeder']) { await p.evaluate(e => { __nest.G.event = { id: e }; document.querySelector('[data-a="view"][data-v="under"]').click(); }, e); await p.waitForTimeout(150); await tap('[data-a="open"][data-v="event"]'); await grab('사건 ' + e); await p.evaluate(() => { __nest.G.event = null; const m = document.getElementById('modal'); m.hidden = true; m.innerHTML = ''; }); await p.waitForTimeout(100); }
    // 징조·옛 것 창, 기록(흔적)
    const out = seen.filter(x => x[1].length); const names = await p.evaluate(() => { const N = __nest.NEST; return [N.folk(__nest.G), N.GUEST.merchant.name, N.GUEST.poet.name, N.EVENTS.traveler.title, N.EVENTS.mapper1.title, N.EVENTS.pilgrims.title, N.AVATAR.child, N.PLOT.camp.name + '/' + N.PLOT.tower.name + '/' + N.PLOT.garden.name, N.ACT_NAME.raid1].join(' · '); });
    console.log('== ' + w + ' (' + (devName || 'pc') + '): ' + names + ' · 본 화면 ' + seen.length + (errs.length ? ' · 오류 ' + errs.join(' / ') : ''));
    for (const [label, hits] of out) { if (w === 'fantasy' && hits.every(h => !h.startsWith('자리표'))) continue; bad += hits.length; console.log('  [' + label + '] ' + [...new Set(hits)].join(' | ')); }
    await ctx.close();
  }
  console.log(bad ? '남은 것 ' + bad : '판타지가 아닌 세계에 "마을"도, 풀리지 않은 자리표도 없음'); await b.close();
})();
