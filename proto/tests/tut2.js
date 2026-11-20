// 길잡이를 처음부터 끝까지 시키는 대로 따라간다 (새 화면)
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'tut_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName === 'small') ctx = await b.newContext({ viewport: { width: 375, height: 620 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const touch = !!devName, p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; });
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(450); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const coach = async () => { const t = await p.evaluate(() => { const e = [...document.querySelectorAll('#coach, #coach2')].find(x => x.offsetParent); return e ? e.textContent.replace(/\s+/g, ' ').replace(/^잔향 /, '').slice(0, 62) : '(안 보임)'; }); return t; };
  let n = 0; const shot = async l => { n++; await p.waitForTimeout(150); const o = await p.evaluate(() => { const r = []; const v = document.getElementById('view'); if (v && v.offsetParent && v.scrollHeight - v.clientHeight > 2) r.push('패널 ' + (v.scrollHeight - v.clientHeight)); const d = document.scrollingElement; if (d.scrollHeight > innerHeight + 1) r.push('페이지'); const c = [...document.querySelectorAll('#coach, #coach2')].find(x => x.offsetParent); if (c && c.scrollHeight - c.clientHeight > 2) r.push('길잡이 글 잘림 ' + (c.scrollHeight - c.clientHeight)); return r; }); if (o.length) bad.push(l + ': ' + o.join(', ')); await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + l + '.png') }); };
  const tapTutCell = async () => { const i = await p.evaluate(() => __nest.ST.tutCell); if (i == null) return false; await p.evaluate(i => { const c = __nest.cellAt(i); __nest.aim(c[0], c[1]); }, i); await p.waitForTimeout(150); const xy = await p.evaluate(i => { const c = __nest.cellAt(i); return __nest.toClient(c[0], c[1]); }, i); if (touch) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(500); return true; };
  try {
    await tap('[data-a="new"]'); await tap('[data-a="tab"][data-g="setup"][data-v="rule"]'); console.log('길잡이 단추:', await p.$eval('[data-a="setup"][data-k="tut"]', e => e.textContent)); await tap('[data-a="close"][data-v="go"]'); await tap('[data-a="sceneskip"]'); await p.waitForTimeout(500);
    console.log('1', await coach()); await shot('1_start');
    await tap('[data-a="open"][data-v="applicants"]'); await shot('1_applicants'); await tap('#modal [data-a="accept"]:not([disabled])'); if (await has('#modal [data-a="accept"]:not([disabled])')) await tap('#modal [data-a="accept"]:not([disabled])'); await tap('#modal [data-a="close"]'); await p.waitForTimeout(500);
    console.log('2', await coach()); await shot('2'); console.log('  깜빡이는 칸', await p.evaluate(() => __nest.ST.tutCell), await tapTutCell());
    console.log('3', await coach()); await shot('3'); console.log('  초소 단추 깜빡임', await p.$$eval('[data-a="build"][data-v="post"].tut-glow', e => e.length)); await tap('[data-a="build"][data-v="post"]'); await p.waitForTimeout(500);
    console.log('4', await coach()); await shot('4'); if (!(await has('#view [data-a="place"]'))) await tapTutCell(); console.log('  지켜라 단추', await p.$$eval('#view [data-a="place"]', e => e.filter(x => x.offsetParent).length)); await tap('#view [data-a="place"]'); await p.waitForTimeout(500);
    console.log('4b', await coach()); await shot('4b'); console.log('  권속의 자리', await p.evaluate(() => __nest.G.kin.map(m => m.loc + (m.pin ? '(지킴)' : '')).join(','))); if (await has('#sheetclose')) await tap('#sheetclose'); console.log('  뚫기 단추', await p.$$eval('[data-a="breach"]', e => e.filter(x => x.offsetParent).length)); await tap('[data-a="breach"]'); await shot('4_confirm'); await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(600); await shot('4_reveal'); for (let i = 0; i < 6 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(700);
    console.log('5', await coach(), '· 세계', await p.evaluate(() => __nest.G.world + ' / ' + __nest.NEST.INV.warrior.name + ' / 화면 ' + __nest.ST.screen)); await shot('5'); await tap('[data-a="view"][data-v="under"]'); await p.waitForTimeout(700);
    console.log('7', await coach()); await shot('7'); await tap('[data-a="endday"]'); if (await has('[data-a="endday"]')) await tap('[data-a="endday"]');
    for (let i = 0; i < 400; i++) { await p.waitForTimeout(80); await p.evaluate(() => { __nest.ST.speed = 30; const h = document.querySelector('#hand:not([hidden]) [data-a="hand"][data-k="none"]'); if (h) h.click(); }); if (await has('#modal [data-a="close"]')) break; }
    await shot('7_settle'); for (let i = 0; i < 5; i++) { if (await has('#modal [data-a="event"]:not([disabled])')) await tap('#modal [data-a="event"]:not([disabled])'); else if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else if (await has('[data-a="sceneskip"]')) await tap('[data-a="sceneskip"]'); else break; }
    await p.waitForTimeout(600); console.log('8', await coach(), '· 먹이', await p.evaluate(() => __nest.G.corpses.length)); await shot('8');
    if (await p.evaluate(() => __nest.G.corpses.length > 0)) { await tap('[data-a="core"]'); console.log('9', await coach()); await shot('9'); await tap('[data-a="eat"]'); await p.waitForTimeout(500); }
    console.log('10', await coach()); await shot('10'); await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="tutend"]')].reverse().find(x => x.offsetParent); e.click(); }); await p.waitForTimeout(300);
    console.log('끝낸 뒤:', JSON.stringify(await p.evaluate(() => ({ tut: __nest.G.tut, done: __nest.META.tutDone }))), '· 길잡이', await coach());
  } catch (e) { errs.push('스크립트: ' + e.message.split('\n').slice(0, 2).join(' | ')); await p.screenshot({ path: path.join(out, 'fail.png') }).catch(() => {}); }
  console.log(tag, bad.length ? '넘침: ' + bad.join(' / ') : '넘침 없음', '·', errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
