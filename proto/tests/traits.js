// 별자리와 형질: 고르지 못하는 시작, 조건이 맞으면 오는 사건, 받아들이기와 긁어내기
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2];
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; });
  const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(160); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const shot = n => p.screenshot({ path: path.join(__dirname, 'trait_' + n + (devName ? '_m' : '') + '.png') });
  const over = () => p.evaluate(() => { const e = document.querySelector('#modal .mbody'); return e ? Math.max(0, e.scrollHeight - e.clientHeight) : 0; });
  // ---- 새 판 준비: 고를 것이 없다 ----
  await click('[data-a="new"]'); await p.waitForTimeout(200);
  console.log('준비 창 탭:', (await p.$$eval('#modal [data-a="tab"]', es => es.map(e => e.textContent.trim()))).join(' | '), '· 고르는 단추(주인공·조각·별자리):', await p.$$eval('#modal [data-a="setup"][data-k="origin"], #modal [data-a="setup"][data-k="asp"], #modal [data-a="setup"][data-k="star"]', e => e.length));
  console.log('첫 판의 별자리:', await p.$eval('#modal .card .h3', e => e.textContent), '· 다시 뽑기 단추', await p.$eval('[data-a="reroll"]', e => e.disabled ? '꺼짐(별가루 부족)' : '켜짐'), '· 넘침', await over()); await shot('setup');
  // 나갔다 들어와도 같은 별자리인가
  const s1 = await p.evaluate(() => __nest.META.nextSign); await click('[data-a="close"][data-v=""]'); await click('[data-a="new"]'); const s2 = await p.evaluate(() => __nest.META.nextSign);
  console.log('닫았다 다시 열어도 같은 별자리:', s1 === s2);
  // 별가루로 다시 뽑기 (한 판을 끝낸 것으로 해서 뜰 수 있는 별자리를 늘린다)
  await p.evaluate(() => { __nest.META.dust = 100; __nest.META.board.push({ total: 1, grade: 'D', form: 'x', day: 3, diff: 1, win: false }); }); await click('[data-a="close"][data-v=""]'); await click('[data-a="new"]');
  const seen = new Set([await p.evaluate(() => __nest.META.nextSign)]); for (let i = 0; i < 3; i++) { await click('[data-a="reroll"]'); seen.add(await p.evaluate(() => __nest.META.nextSign)); }
  console.log('별가루 100 → 세 번 다시 뽑음:', [...seen].join(' → '), '· 남은 별가루', await p.evaluate(() => __nest.META.dust));
  await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300);
  console.log('첫 대사:', (await p.$eval('#scene', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 70)); await shot('intro');
  await click('[data-a="sceneskip"]'); await p.waitForTimeout(300); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
  console.log('시작:', JSON.stringify(await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; return { sign: G.sign, star: G.star, asp: G.startAsp, origin: G.origin, name: S.formName(G), ess: G.slime.ess[G.startAsp] }; })));
  // ---- 형질 사건 ----
  const nextMorning = async () => {
    await p.evaluate(() => { const G = __nest.G; G.march.tonight = null; G.guest = null; __nest.META.pause = 'never'; G.eventDays = {}; });
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); e.click(); }); await p.waitForTimeout(120);
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e && __nest.ST.mode === 'day') e.click(); });
    for (let i = 0; i < 200; i++) { await p.waitForTimeout(80); await p.evaluate(() => { __nest.ST.skip = true; }); if (await has('#modal [data-a="close"]')) break; }
    await click('#modal [data-a="close"]'); await p.waitForTimeout(350); if (await has('[data-a="sceneskip"]')) await click('[data-a="sceneskip"]'); await p.waitForTimeout(250);
  };
  const waitTrait = async label => { for (let d = 0; d < 14; d++) { await nextMorning(); const id = await p.evaluate(() => __nest.G.event && __nest.G.event.id); if (id && id.startsWith('trait_')) return id; if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]'); } return null; };
  for (let d = 0; d < 3; d++) { await nextMorning(); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]'); }
  console.log('4일째, 조건 없음 → 올 수 있는 형질:', JSON.stringify(await p.evaluate(() => __nest.NEST.traitReady(__nest.G))));
  // 굴을 넷 판 것으로 한다 → 뿌리
  await p.evaluate(() => { __nest.G.stats.dug = 4; }); console.log('굴 넷 → 올 수 있는 형질:', JSON.stringify(await p.evaluate(() => __nest.NEST.traitReady(__nest.G))));
  let id = await waitTrait(); console.log('사건이 온 날:', await p.evaluate(() => __nest.G.day) + '일째 ·', id, '·', (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 150), '· 넘침', await over()); await shot('event');
  // 긁어낸다
  await click('#modal [data-a="event"][data-i="1"]'); console.log('긁어낸 뒤:', JSON.stringify(await p.evaluate(() => ({ origin: __nest.G.origin, no: __nest.G.traitNo, ready: __nest.NEST.traitReady(__nest.G) }))));
  // 재물을 쌓은 것으로 한다 → 금화
  await p.evaluate(() => { __nest.G.gold = 3000; }); id = await waitTrait(); console.log('재물 3,000 → 사건:', id);
  const g0 = await p.evaluate(() => __nest.G.gold); await click('#modal [data-a="event"][data-i="0"]'); await p.waitForTimeout(300);
  console.log('받아들인 뒤:', JSON.stringify(await p.evaluate(() => ({ origin: __nest.G.origin, sprite: __nest.G.slime.origin, name: __nest.NEST.formName(__nest.G), codex: __nest.META.codex.traits, feats: Object.keys(__nest.META.feats).filter(k => k.startsWith('trait')) }))), '· 재물', Math.round(g0), '→', Math.round(await p.evaluate(() => __nest.G.gold)));
  console.log('연출 창:', (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 110), '· 넘침', await over()); await shot('reveal'); await click('#modal [data-a="close"]');
  console.log('하나 돋은 뒤 올 수 있는 형질:', JSON.stringify(await p.evaluate(() => { __nest.G.stats.dug = 9; __nest.G.falls = 1; return __nest.NEST.traitReady(__nest.G); })));
  await click('[data-a="core"]'); await click('[data-a="tab"][data-g="core"][data-v="pow"]'); console.log('본체 창 능력 탭:', (await p.$eval('#view .kv', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 90)); await shot('core');
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
