// 숨은 본체: 그림 한 장, 그리고 조건을 맞춰 첫 허물을 벗으면 실제로 그 몸이 되는가
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2];
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; });
  // ---- 그림 한 장: 본체 셋 × 단계 넷, 색은 징조를 따른다 ----
  const data = await p.evaluate(() => {
    const S = __nest.NEST, bs = Object.keys(S.BODY), cols = [['abyss', null, 1], ['hunger', 'dusk', 2], ['nebula', 'brood', 3], ['dusk', 'abyss', 4], ['brood', 'hunger', 4]], Z = 5, W = 32 * Z + 12;
    const c = document.createElement('canvas'); c.width = 130 + cols.length * W; c.height = 30 + bs.length * (32 * Z + 12); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#212640'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#ece6d6'; x.font = '14px sans-serif'; cols.forEach((cl, k) => x.fillText(S.ASP[cl[0]] + (cl[1] ? '+' + S.ASP[cl[1]] : '') + ' ' + cl[2] + '단계', 130 + k * W, 18));
    bs.forEach((bk, r) => { x.fillStyle = '#ece6d6'; x.fillText(S.FORM1[bk].name, 8, 30 + r * (32 * Z + 12) + 80); cols.forEach((cl, k) => { x.drawImage(__nest.slimeCanvas({ body: bk, main: cl[0], sub: cl[1], stage: cl[2], muts: [] }, 0), 130 + k * W, 26 + r * (32 * Z + 12), 32 * Z, 32 * Z); }); });
    return c.toDataURL('image/png');
  });
  fs.writeFileSync(path.join(__dirname, 'bodies.png'), Buffer.from(data.split(',')[1], 'base64'));
  if (devName) { console.log('그림 저장'); }
  const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(160); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const over = () => p.evaluate(() => { const r = []; const m = document.querySelector('#modal .mbody'); if (m && m.scrollHeight - m.clientHeight > 2) r.push('창 ' + (m.scrollHeight - m.clientHeight)); const v = document.getElementById('view'); if (v && v.offsetParent && v.scrollHeight - v.clientHeight > 2) r.push('패널 ' + (v.scrollHeight - v.clientHeight)); return r.join(',') || '없음'; });
  for (const want of ['hive', 'idol', 'mix', null]) {
    await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
    // 첫 달이 기우는 날 직전으로 가서 조건을 맞춘다
    await p.evaluate(want => { const G = __nest.G, S = __nest.NEST; G.day = S.K.act; G.eventDays = {}; G.march.tonight = null; G.guest = null; __nest.META.pause = 'never'; G.slime.ess = { abyss: 0, nebula: 0, brood: 0, dusk: 0, hunger: 0 }; G.slime.ess[G.startAsp] = 60; G.gold = 2000; G.kin = [];
      if (want === 'hive') for (let n = 0; n < 12; n++) G.kin.push({ id: G.nextId++, name: '시험' + n, kind: 'goblin', lv: 2, exp: 0, loc: null, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold' });
      if (want === 'idol') { G.faithBonus = 20; G.faith = 40; }
      if (want === 'mix') { const o = S.ASPECTS.find(a => a !== G.startAsp); G.slime.ess[o] = 56; } }, want);
    await click('[data-a="core"]'); await p.waitForTimeout(200);
    const guess = (await p.$eval('#view .tb', e => e.textContent)).replace(/\s+/g, ' ').match(/이대로면 「[^」]+」/); if (await has('#sheetclose')) await click('#sheetclose');
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); e.click(); }); await p.waitForTimeout(120);
    await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e && __nest.ST.mode === 'day') e.click(); });
    for (let i = 0; i < 200; i++) { await p.waitForTimeout(80); await p.evaluate(() => { __nest.ST.skip = true; }); if (await has('#modal [data-a="close"]')) break; }
    await click('#modal [data-a="close"]'); await p.waitForTimeout(400);
    const evo = (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 150), o1 = await over(); await p.screenshot({ path: path.join(__dirname, 'body_evo_' + (want || 'plain') + (devName ? '_m' : '') + '.png') });
    await click('#modal [data-a="close"]'); await p.waitForTimeout(300); for (let i = 0; i < 4; i++) { if (await has('[data-a="sceneskip"]')) await click('[data-a="sceneskip"]'); else if (await has('#modal [data-a="event"]')) await click('#modal [data-a="event"][data-i="1"]'); else if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]'); await p.waitForTimeout(200); }
    const st = await p.evaluate(() => { const G = __nest.G, S = __nest.NEST, s = S.slimeStats(G); return { body: G.slime.body || null, main: G.slime.main, name: S.formName(G), spell: S.FORM1[S.pk(G)].spell[0], guards: S.capacity(G).core, faithCap: S.faithCap(G), codex: Object.keys(__nest.META.codex.forms).filter(k => S.BODY[k]) }; });
    await click('[data-a="core"]'); await click('[data-a="tab"][data-g="core"][data-v="pow"]'); const o2 = await over(); if (want === 'hive') await p.screenshot({ path: path.join(__dirname, 'body_core' + (devName ? '_m' : '') + '.png') }); if (await has('#sheetclose')) await click('#sheetclose');
    console.log((want || '조건 없음') + ':', guess ? guess[0] : '(예상 글 없음)', '→', JSON.stringify(st), '· 넘침', o1, '/', o2); console.log('   진화 창:', evo);
    // 2단계 이름
    console.log('   두 번째 허물 이름:', await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; const sl = JSON.parse(JSON.stringify(G.slime)); G.slime.stage = 2; G.slime.sub = S.ASPECTS.find(a => a !== G.slime.main); const n = S.formName(G) + ' / 3단계 ' + (() => { G.slime.stage = 3; return S.formName(G); })(); G.slime = sl; return n; }));
    await p.evaluate(() => { const e = document.querySelector('[data-a="quit"], [data-a="menu"]'); }); await p.evaluate(() => { __nest.G.over = null; });
    if (await has('[data-a="quit"]')) await click('[data-a="quit"]'); else { await click('[data-a="menu"]'); await click('#modal [data-a="quit"]'); } await p.waitForTimeout(250);
  }
  await click('[data-a="codex"]'); await click('[data-a="tab"][data-g="codex"][data-v="form"]'); await click('[data-a="tab"][data-g="codexAsp"][data-v="hid"]'); console.log('도감 숨은 것:', (await p.$$eval('#modal .node span', es => es.map(e => e.textContent))).join(', '), '· 넘침', await over()); await p.screenshot({ path: path.join(__dirname, 'body_codex' + (devName ? '_m' : '') + '.png') });
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
