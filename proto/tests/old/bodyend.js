// 숨은 본체로 깨어나면 그 본체의 결말이 나오는가, 신도의 헌금이 정산에 뜨는가
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
  const over = () => p.evaluate(() => { const m = document.querySelector('#modal .mbody'); return m ? Math.max(0, m.scrollHeight - m.clientHeight) : 0; });
  const cases = [['hive', 0], ['idol', 1], ['mix', 2]];
  for (const [body, tier] of cases) {
    await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
    await p.evaluate(([body, tier]) => { const G = __nest.G, S = __nest.NEST; G.day = S.K.days; G.eventDays = {}; G.event = null; G.march.tonight = null; G.guest = null; __nest.META.pause = 'never'; G.slime.stage = 4; G.slime.main = G.startAsp; G.slime.sub = S.ASPECTS.find(a => a !== G.startAsp); G.slime.body = body; G.sacrifices = 2; G.stats.aspBuilt = 1; G.stats.hands = 3; G.stats.kills = 40; G.stats.eats = 9; for (let n = 0; n < 3; n++) G.kin.push({ id: G.nextId++, name: '고블린' + n, kind: 'goblin', lv: 3, exp: 0, loc: null, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold' }); G.gold = [0, 9000, 30000][tier]; G.fear = [0, 400, 1200][tier]; G.stats.repels = [0, 30, 60][tier];
      for (let n = 0; n < 3; n++) G.kin.push({ id: G.nextId++, name: '신도' + n, kind: 'cultist', lv: 3, exp: 0, loc: null, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold' }); }, [body, tier]);
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); e.click(); }); await p.waitForTimeout(120);
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e && __nest.ST.mode === 'day') e.click(); });
    for (let i = 0; i < 250; i++) { await p.waitForTimeout(80); await p.evaluate(() => { __nest.ST.skip = true; }); if (await has('#modal [data-a="close"]')) break; }
    const settle = (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' '); if (body === 'hive') console.log('정산의 헌금:', (settle.match(/헌금\+[\d,]+/) || ['(없음)'])[0]);
    for (let i = 0; i < 6; i++) { const h = await p.$eval('#modal h2', e => e.textContent).catch(() => ''); if (/깨어났다|돌아갔다/.test(h)) break; if (await has('[data-a="sceneskip"]')) await click('[data-a="sceneskip"]'); else if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]'); await p.waitForTimeout(300); }
    const t = (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ');
    console.log(body + ' (등급 단계 ' + tier + '):', (t.match(/깨어났다[^.]*결말 · [^ ]+( [^ ]+)?/) || [t.slice(0, 80)])[0].slice(0, 90), '· 넘침', await over()); await p.screenshot({ path: path.join(__dirname, 'bodyend_' + body + (devName ? '_m' : '') + '.png') });
    console.log('   글:', (t.match(/결말 · .{0,70}/) || [''])[0]);
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => !document.getElementById('title').hidden)) break; if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]'); else if (await has('#modal [data-a="tab"][data-v="score"]')) await click('#modal [data-a="tab"][data-v="score"]'); await p.waitForTimeout(250); }
  }
  await click('[data-a="codex"]'); await click('[data-a="tab"][data-g="codex"][data-v="end"]'); console.log('도감 결말 탭:', (await p.$$eval('#modal .tb p.row', es => es.slice(5).map(e => e.textContent.replace(/\s+/g, ' ').trim()))).join(' | '), '· 넘침', await over());
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
