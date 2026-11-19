// 특별한 합체 12종의 그림을 한 장에 모아 본다 + 옛 것 방 훈련 줄 확인
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2];
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; }); await p.evaluate(() => { __nest.META.tutDone = true; });
  const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(180); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
  // ---- 훈련 줄 ----
  const info = await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; G.gold = 3000; G.day = 5; G.ap = 2; G.kin = [];
    const add = (name, kind, lv, loc, parts) => G.kin.push({ id: G.nextId++, name, kind, lv, exp: 0, loc, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold', parts });
    add('호위', 'skeleton', 1, 'core'); add('그물', 'netter', 2, 'core', [{ kind: 'warden', lv: 2, name: '간수' }]); return { cap: S.prisonCap(G) }; });
  await click('[data-a="core"]'); await p.waitForTimeout(200);
  if (await has('[data-a="tab"][data-g="core"][data-v="guard"]')) await click('[data-a="tab"][data-g="core"][data-v="guard"]');
  const row = await p.evaluate(() => [...document.querySelectorAll('[data-a="train"][data-loc="core"]')].filter(e => e.offsetParent).map(e => e.textContent.trim()));
  console.log('옛 것 방 훈련 단추:', row.join(' / ') || '없음', '· 간수가 붙은 그물잡이의 포로 자리', info.cap);
  await p.screenshot({ path: path.join(__dirname, 'coretrain' + (devName ? '_m' : '') + '.png') });
  const before = await p.evaluate(() => __nest.G.kin.map(m => m.lv + ':' + Math.round(m.exp)).join(' '));
  await click('[data-a="train"][data-loc="core"]');
  console.log('훈련 전', before, '→ 후', await p.evaluate(() => __nest.G.kin.map(m => m.lv + ':' + Math.round(m.exp)).join(' ') + ' · 행동 ' + __nest.G.ap + ' · 재물 ' + __nest.G.gold));
  // ---- 그림 ----
  if (!devName) {
    const names = await p.evaluate(() => { const S = __nest.NEST, ids = Object.keys(S.RECIPE); const wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#14121c;padding:12px;display:grid;grid-template-columns:repeat(6,150px);gap:10px;font:12px sans-serif;color:#ddd';
      ids.forEach(id => { const pr = S.RECIPE[id].pair, mk = pr[1] === null ? 'goblin' : pr[0], pk = pr[1] === null ? pr[0] : pr[1], m = { kind: mk, parts: [{ kind: pk }] }; const cell = document.createElement('div'); cell.style.cssText = 'text-align:center'; const cv = __nest.kinCanvasM(m), big = document.createElement('canvas'); big.width = big.height = 120; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(cv, 0, 0, 120, 120); cell.appendChild(big); cell.insertAdjacentHTML('beforeend', '<div>' + S.RECIPE[id].name + '</div><div style="color:#888">' + S.kinName(m) + '</div>'); wrap.appendChild(cell); });
      document.body.appendChild(wrap); return ids.length; });
    await p.waitForTimeout(200); await p.locator('#sheet').screenshot({ path: path.join(__dirname, 'rcpsheet.png') }); console.log('그림', names, '종');
  }
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
