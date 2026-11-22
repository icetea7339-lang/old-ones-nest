// 화면 틀 확인: 낮·목표·상태·칸·본체·밤(손)·이야기 2장·3장·한 방울을 기기마다 찍는다
// node tests/framesheet.js [기기: pc|a360|a412|iPhone 14] [html 경로] [이름표]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const FZM = require('./_fz.js');
const devName = process.argv[2] && process.argv[2] !== 'pc' ? process.argv[2] : undefined;
const htmlPath = process.argv[3] || path.join(__dirname, '..', '..', 'PLAY-GAME.html'), TAG = process.argv[4] || 'after';
const html = fs.readFileSync(htmlPath, 'utf8'), out = path.join(__dirname, 'frame_' + TAG + '_' + (devName || 'pc').replace(/\s+/g, '')); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); const ctx = await FZM.context(b, devName), touch = !!devName;
  const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(200); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const shot = async n => { await p.waitForTimeout(350); await p.screenshot({ path: path.join(out, n + '.png') }); };
  const skip = async () => { for (let i = 0; i < 10 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(250); };
  const closeM = async () => { for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; } };
  const toTitle = async () => { await p.evaluate(() => { const q = document.createElement('button'); q.dataset.a = 'quit'; document.body.appendChild(q); q.click(); q.remove(); }); await p.waitForTimeout(600); await closeM(); };
  const cellTap = async i => { const c = await p.evaluate(i => __nest.cellAt(i), i); await p.evaluate(([x, y]) => __nest.aim(x, y), c); await p.waitForTimeout(150); const xy = await p.evaluate(([x, y]) => __nest.toClient(x, y), c); if (touch) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(300); };
  try {
    await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; __nest.META.pause = 'always'; });
    await shot('00_title');
    await tap('[data-a="new"]'); if (await has('[data-a="setup"][data-k="tut"].on')) await tap('[data-a="setup"][data-k="tut"]'); await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300); await skip();
    for (let i = 0; i < 2; i++) if (await has('#modal [data-a="accept"]:not([disabled])')) await tap('#modal [data-a="accept"]:not([disabled])'); await closeM();
    await shot('01_sealed');
    if (await has('[data-a="breach"]')) { await tap('[data-a="breach"]'); if (await has('#modal [data-a="close"][data-v="go"]')) await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(500); await skip(); }
    await closeM(); await p.evaluate(() => { __nest.render(); }); await shot('02_day');
    if (await has('[data-a="panel"][data-v="goal"]')) { await tap('#mnav [data-a="panel"][data-v="goal"], [data-a="panel"][data-v="goal"]'); await shot('03_goal'); await tap('#sheetclose'); }
    if (await has('[data-a="panel"][data-v="status"]')) { await tap('[data-a="panel"][data-v="status"]'); await shot('04_status'); await tap('#sheetclose'); }
    const pc = await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; return (S.paths(G)[0] || []).filter(i => i !== G.ent && i !== G.core)[0]; });
    if (pc != null) { await cellTap(pc); await shot('05_cell'); if (await has('#sheetclose')) await tap('#sheetclose'); }
    await tap('[data-a="core"]'); await shot('06_core'); if (await has('#sheetclose')) await tap('#sheetclose');
    if (await has('[data-a="view"][data-v="surface"]')) { await tap('[data-a="view"][data-v="surface"]'); await shot('07_surface'); await tap('[data-a="view"][data-v="under"]'); }
    await tap('[data-a="endday"]'); if (await has('[data-a="endday"].warn')) await tap('[data-a="endday"]');
    for (let i = 0; i < 60; i++) { await p.waitForTimeout(100); if (await p.evaluate(() => __nest.ST.mode === 'night')) break; } await p.waitForTimeout(1500); await shot('08_night');
    for (let i = 0; i < 80; i++) { await p.waitForTimeout(150); if (await has('#hand:not([hidden])') || await has('#modal [data-a="close"]')) break; }
    if (await has('#hand:not([hidden])')) await shot('08b_hand'); if (await has('#hand:not([hidden])')) await tap('#hand [data-a="hand"][data-k="none"]');
    await p.evaluate(() => { __nest.ST.skip = true; }); for (let i = 0; i < 200; i++) { await p.waitForTimeout(100); if (await has('#modal [data-a="close"]')) break; const h = await has('#hand:not([hidden]) [data-a="hand"][data-k="none"]'); if (h) await tap('#hand [data-a="hand"][data-k="none"]'); }
    await shot('09_settle'); await closeM();
    // 이야기 2장·3장
    await p.evaluate(() => { const m = __nest.META; m.story = m.story || {}; m.story.clear = { 1: 1, 2: 1 }; m.story.asp = 'brood'; m.howto = { story: 1, free: 1 }; });
    await toTitle();
    if (await has('[data-a="story"]')) { await tap('[data-a="story"]'); await shot('10_story_select'); await tap('#modal [data-a="close"][data-v="ch2"]'); await p.waitForTimeout(400); await skip(); await closeM(); await skip(); await shot('11_ch2');
      await toTitle();
      await tap('[data-a="story"]'); await tap('#modal [data-a="close"][data-v="ch3"]'); await p.waitForTimeout(400); await skip(); await closeM(); await skip(); await shot('12_ch3'); }
    // 한 방울
    await p.evaluate(() => { runPrologue({ asp: 'abyss', seed: 5 }); __pro.manual = true; }); await p.waitForTimeout(400); await p.evaluate(() => { __pro.closeIntro && __pro.closeIntro(); __pro.step(30); }); await shot('13_prologue');
  } catch (e) { errs.push('스크립트: ' + e.message.split('\n')[0]); }
  console.log(TAG, devName || 'pc', errs.length ? '오류: ' + errs.slice(0, 3).join(' / ') : 'no errors', '→', out); await b.close();
})();
