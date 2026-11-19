// 특별한 합체의 발견, 붙잡는 적 수 표시, 명부에 올려도 붙은 채로 남는가
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
  const shot = n => p.screenshot({ path: path.join(__dirname, 'rcp_' + n + (devName ? '_m' : '') + '.png') });
  await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
  await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; G.gold = 5000; G.ap = 9; S.build(G, 1, 'hall'); G.kin = []; const add = (name, kind, lv, loc) => G.kin.push({ id: G.nextId++, name, kind, lv, exp: 0, loc, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold' });
    add('뼈돌', 'skeleton', 4, 1); add('솔', 'cultist', 3, null); add('달', 'cultist', 2, null); add('별', 'cultist', 2, null); add('고블', 'goblin', 3, 1); add('허기', 'hunger', 2, null); G.ap = 2; });
  const ids = await p.evaluate(() => __nest.G.kin.map(m => [m.name, m.id])), id = n => ids.find(x => x[0] === n)[1];
  const openFuse = async n => { if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]'); await click('[data-a="open"][data-v="roster"]'); await click(`#modal [data-a="kin"][data-id="${id(n)}"]`); await click('[data-a="tab"][data-g="kin"][data-v="fuse"]'); };
  await openFuse('뼈돌');
  console.log('붙잡는 수:', (await p.$eval('#modal .tb', e => e.textContent)).replace(/\s+/g, ' ').match(/한 번에 붙잡는 적 [^(]+/)[0].trim());
  console.log('찾기 전 조짐:', (await p.$$eval('#modal [data-a="fuse"]', es => es.map(e => e.querySelector('b').textContent.trim().split(' ')[0] + (e.textContent.includes('★') ? ' ★' + e.textContent.split('★')[1].trim() : '')))).join(' | '), '· 넘침', await over()); await shot('before');
  await click(`#modal [data-a="fuse"][data-b="${id('솔')}"]`); await p.waitForTimeout(300);
  console.log('연출:', (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 130), '· 넘침', await over()); await shot('reveal');
  console.log('기록:', JSON.stringify(await p.evaluate(() => ({ rcp: Object.keys(__nest.META.codex.rcp), feat: !!__nest.META.feats.rcp1 }))));
  await openFuse('고블'); console.log('다른 권속의 재료 목록(찾은 것은 이름이 보이는가):', (await p.$$eval('#modal [data-a="fuse"]', es => es.map(e => e.querySelector('b').textContent.trim().split(' ')[0] + (e.textContent.includes('★') ? ' ★' + e.textContent.split('★')[1].trim() : '')))).join(' | '));
  await click(`#modal [data-a="fuse"][data-b="${id('허기')}"]`); await p.waitForTimeout(250); console.log('고블린+허기:', JSON.stringify(await p.evaluate(() => Object.keys(__nest.META.codex.rcp))));
  await click('#modal [data-a="kin"]'); console.log('권속 창 머리:', (await p.$eval('#modal .slime-top', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 150), '· 넘침', await over()); await shot('kin');
  // ---- 명부: 판을 끝내고 올린 뒤 다음 판에 데려온다 ----
  await click('#modal [data-a="close"]');
  await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; G.day = S.K.days; G.eventDays = {}; G.event = null; G.march.tonight = null; G.guest = null; __nest.META.pause = 'never'; });
  await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); e.click(); }); await p.waitForTimeout(150); await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e && __nest.ST.mode === 'day') e.click(); });
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(90); await p.evaluate(() => { __nest.ST.skip = true; }); const h = await p.$eval('#modal h2', e => e.textContent).catch(() => ''); if (h.includes('명부에 올릴')) break; if (await has('[data-a="sceneskip"]')) await click('[data-a="sceneskip"]'); else if (await has('#modal [data-a="tab"][data-v="score"]') && /깨어났다|돌아갔다/.test(h) && !(await has('#modal .grade'))) await click('#modal [data-a="tab"][data-v="score"]'); else if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]'); }
  await shot('legacy'); await click(`#modal [data-a="legacy"][data-id="${id('뼈돌')}"]`); await click('#modal [data-a="close"]'); await p.waitForTimeout(400);
  console.log('명부:', JSON.stringify(await p.evaluate(() => __nest.META.roster.map(r => ({ name: r.name, kind: r.kind, lv: r.lv, parts: (r.parts || []).map(q => q.kind + ' Lv' + q.lv) })))));
  await click('[data-a="barracks"]'); await click('[data-a="tab"][data-g="barracks"][data-v="list"]'); await shot('barracks'); await click('#modal [data-a="close"]');
  await click('[data-a="new"]'); await click('[data-a="tab"][data-g="setup"][data-v="bring"]'); await click('#modal [data-a="setup"][data-k="bring"]'); await shot('bring'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(300);
  console.log('다음 판에 온 권속:', JSON.stringify(await p.evaluate(() => __nest.G.kin.filter(m => m.legacy).map(m => ({ name: __nest.NEST.kinName(m), parts: (m.parts || []).length, rc: __nest.NEST.recipesOf(m) })))));
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
