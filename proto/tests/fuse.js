// 권속 합체: 창에서 합치고, 능력·급여·그림·자리가 바뀌는가
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2];
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; });
  const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(180); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const over = () => p.evaluate(() => { const m = document.querySelector('#modal .mbody'); return m ? Math.max(0, m.scrollHeight - m.clientHeight) : 0; });
  const shot = n => p.screenshot({ path: path.join(__dirname, 'fuse_' + n + (devName ? '_m' : '') + '.png') });
  await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
  await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; G.gold = 3000; G.ap = 9; S.build(G, 1, 'hall'); G.kin = []; const add = (name, kind, lv, loc, evo) => G.kin.push({ id: G.nextId++, name, kind, lv, exp: 0, loc, hurt: 0, skill: 0, age: 3, unpaid: 0, evo: !!evo, stance: 'hold' });
    add('가르', 'goblin', 5, 1, true); add('무쿠', 'skeleton', 4, 1); add('솔', 'cultist', 3, null); add('니아', 'mask', 3, null); add('핀', 'hunger', 2, null); add('움', 'spawn', 1, null); add('테브', 'scale', 4, 1); G.ap = 2; });
  const info = id => p.evaluate(id => { const G = __nest.G, S = __nest.NEST, m = G.kin.find(x => x.id === id), s = S.kinStats(G, m); return JSON.stringify({ name: S.kinName(m), hp: Math.round(s.hp), atk: Math.round(s.atk), satk: Math.round(s.satk), pay: +S.salary(G, m).toFixed(1), parts: (m.parts || []).length, kin: G.kin.length, gold: Math.round(G.gold) }); }, id);
  const ids = await p.evaluate(() => __nest.G.kin.map(m => [m.name, m.id]));
  const id = n => ids.find(x => x[0] === n)[1];
  await click('[data-a="open"][data-v="roster"]'); await click(`#modal [data-a="kin"][data-id="${id('가르')}"]`); await click('[data-a="tab"][data-g="kin"][data-v="fuse"]');
  console.log('합치기 전', await info(id('가르'))); console.log('재료 목록:', (await p.$$eval('#modal [data-a="fuse"] b', es => es.map(e => e.textContent.replace(/\s+/g, ' ').trim()))).join(' | '), '· 넘침', await over()); await shot('tab');
  await click(`#modal [data-a="fuse"][data-b="${id('니아')}"]`); await p.waitForTimeout(300);
  console.log('가면을 붙임', await info(id('가르'))); console.log('연출 창:', (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 90), '· 넘침', await over()); await shot('reveal');
  await click('#modal [data-a="kin"]'); await click('[data-a="tab"][data-g="kin"][data-v="fuse"]'); await click(`#modal [data-a="fuse"][data-b="${id('무쿠')}"]`); await p.waitForTimeout(300);
  console.log('해골을 더 붙임', await info(id('가르'))); await shot('reveal2'); await click('#modal [data-a="kin"]'); await click('[data-a="tab"][data-g="kin"][data-v="fuse"]');
  console.log('둘 붙인 뒤 탭:', (await p.$eval('#modal .tb', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 110));
  // 안 되는 경우
  console.log('움이 숙주:', await p.evaluate(([a, b2]) => __nest.NEST.fuseWhy(__nest.G, a, b2), [id('움'), id('솔')]), '· 합쳐진 권속을 재료로:', await p.evaluate(([a, b2]) => __nest.NEST.fuseWhy(__nest.G, a, b2), [id('테브'), id('가르')]), '· 움을 재료로:', await p.evaluate(([a, b2]) => __nest.NEST.fuseWhy(__nest.G, a, b2) || '된다', [id('테브'), id('움')]));
  await click('#modal [data-a="close"]'); await p.waitForTimeout(500); await shot('map');
  // 밤에 싸우는가
  await p.evaluate(() => { const G = __nest.G; G.march.tonight = { vill: 'field', settle: false }; G.guest = null; G.event = null; __nest.META.pause = 'never'; });
  await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); e.click(); }); await p.waitForTimeout(150); await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e && __nest.ST.mode === 'day') e.click(); });
  await p.waitForTimeout(3500); await shot('night'); for (let i = 0; i < 300; i++) { await p.waitForTimeout(70); await p.evaluate(() => { __nest.ST.skip = true; }); if (await has('#modal [data-a="close"]')) break; }
  console.log('밤 뒤:', (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 70), '· 흔적', await p.evaluate(() => !!__nest.META.feats.fuse1), '· 도감', JSON.stringify(await p.evaluate(() => Object.keys(__nest.META.codex.fuse))));
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
