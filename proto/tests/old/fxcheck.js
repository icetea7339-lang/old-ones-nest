// 결정적 순간의 연출: 권속 진화·비밀 진화·뚫기·쓰러뜨리는 밤에서 연출이 불리고, 오류가 없고, "흔들림"을 끄면 무대가 흔들리지 않는지
// node tests/fxcheck.js [기기 이름]   찍은 그림은 tests/fx_<기기>/
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../../PLAY-GAME.html'), 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'fx_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const touch = !!devName, p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message + ' @ ' + ((e.stack || '').split('\n')[1] || '').trim().slice(0, 90)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; __nest.META.openAll = true; });
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(120); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const shot = name => p.screenshot({ path: path.join(out, name + '.png') });
  const log = () => p.evaluate(() => __fx.FXLOG.slice());
  const closeM = async () => { for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="event"]:not([disabled])')) await tap('#modal [data-a="event"]:not([disabled])'); else if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; } };
  const openKin = async id => {
    await closeM(); await tap('[data-a="open"][data-v="roster"]'); await p.waitForTimeout(150);
    for (let i = 0; i < 6 && !(await has(`#modal [data-a="kin"][data-id="${id}"]`)); i++) { if (await has('#modal [data-a="page"][data-v="1"]:not([disabled])')) await tap('#modal [data-a="page"][data-v="1"]:not([disabled])'); else break; }
    await tap(`#modal [data-a="kin"][data-id="${id}"]`); await tap('#modal [data-a="tab"][data-g="kin"][data-v="evo"]'); await p.waitForTimeout(150);
  };
  try {
    await tap('[data-a="new"]'); await tap('[data-a="tab"][data-g="setup"][data-v="rule"]'); if (await has('[data-a="setup"][data-k="tut"].on')) await tap('[data-a="setup"][data-k="tut"]');
    await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300); for (let i = 0; i < 6 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(300); await closeM();
    const ids = await p.evaluate(() => {
      const G = __nest.G, N = __nest.NEST, C = N.K.kevo.cap; G.gold = 9000; G.event = null; G.guest = null; G.kin = [];
      const mk = (kind, lv, evo, loc, x) => { const m = Object.assign({ id: G.nextId++, name: '시험' + G.nextId, kind, lv, exp: 0, loc, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold', evo }, x || {}); G.kin.push(m); return m.id; };
      return { cap0: mk('goblin', C[0], 0, 'core'), ready: mk('skeleton', C[1], 1, 'core', { pin: true, hold: 3 }), mate: mk('cultist', 6, 0, 'core', { pin: true }) };
    });
    // 1. 권속 진화
    await openKin(ids.cap0); await tap(`#modal [data-a="kinevo"][data-id="${ids.cap0}"]`); await p.waitForTimeout(400);
    if (!(await p.$('#fxlayer .fx-morph'))) bad.push('진화 연출이 창에 없다'); await shot('1_kinevo_mid'); await p.waitForTimeout(900); if (await p.$('#fxlayer .fx-morph')) bad.push('진화 연출이 1.2초 뒤에도 남았다');
    // 2. 비밀 진화
    await openKin(ids.ready); await tap(`#modal [data-a="kinevo"][data-id="${ids.ready}"][data-s="1"]`); await p.waitForTimeout(500);
    if (!(await p.$('#fxlayer .fx-morph.strong'))) bad.push('비밀 진화 연출이 없다'); await shot('2_secret_mid');
    // 누르면 바로 끝난다
    await p.mouse.click(5, 5); await p.waitForTimeout(80); if (await p.$('#fxlayer .fx-morph:not(.fx-done)')) bad.push('눌러도 진화 연출이 안 끝난다');
    await p.waitForTimeout(800); await closeM();
    // 3. 뚫기
    await p.evaluate(() => { const G = __nest.G; G.start.forEach(i => { G.cells[i].dug = true; }); });
    await tap('[data-a="breach"]'); await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await shot('3_breach_mid');
    for (let i = 0; i < 8 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await closeM();
    // 4. 쓰러뜨리는 밤 (우두머리 하나)
    await p.evaluate(() => { const G = __nest.G; G.kin.forEach(m => { m.lv = 30; m.evo = 2; m.loc = 'core'; }); G.march.tonight = { vill: 'field', settle: false, kinds: ['captain', 'villager', 'villager'] }; });
    await tap('[data-a="view"][data-v="under"]').catch(() => {});
    await tap('[data-a="endday"]'); await p.waitForTimeout(200); if (await has('[data-a="endday"]')) await tap('[data-a="endday"]');
    let shotKill = false;
    for (let i = 0; i < 400; i++) {
      await p.waitForTimeout(60);
      const st = await p.evaluate(() => ({ k: __fx.FXLOG.includes('kill'), frz: !!__nest.ST.freezeAt }));
      if (st.k && !shotKill) { shotKill = true; await shot('4_kill'); }
      await p.evaluate(() => { const h = document.querySelector('#hand:not([hidden]) [data-a="hand"][data-k="none"]'); if (h) h.click(); });
      if (await has('#modal [data-a="close"]')) break;
    }
    await shot('5_night_end'); await closeM(); await p.waitForTimeout(300); if (await has('[data-a="sceneskip"]')) await tap('[data-a="sceneskip"]'); await closeM();
    const L = await log(); ['kinEvo', 'breach', 'kill', 'nightEnd'].forEach(k => { if (!L.includes(k)) bad.push('불리지 않은 연출: ' + k); });
    // 5. 흔들림 끄기: 무대가 흔들리지 않고 화면도 흔들리지 않는다
    await p.evaluate(() => { __nest.META.shake = false; __nest.ST.shake = 0; __fx.jolt(600, 2); __nest.ST.shake = performance.now() + 600; __fx.FX.breach(); });
    await p.waitForTimeout(120);
    const st = await p.evaluate(() => ({ shook: __nest.ST.shook, cls: document.body.className }));
    if (st.shook) bad.push('흔들림을 껐는데 무대가 흔들린다'); if (/fx-shake/.test(st.cls)) bad.push('흔들림을 껐는데 화면이 흔들린다');
    await p.evaluate(() => { __nest.META.shake = true; __nest.ST.shake = performance.now() + 600; }); await p.waitForTimeout(120);
    if (!(await p.evaluate(() => __nest.ST.shook))) bad.push('흔들림을 켰는데 무대가 흔들리지 않는다');
    // 6. 설정에 흔들림 단추
    await closeM(); await tap('[data-a="settings"]').catch(() => {}); if (await has('#modal')) { if (!(await has('#modal [data-a="set"][data-k="shake"]'))) bad.push('설정에 흔들림이 없다'); await shot('6_settings'); }
  } catch (e) { bad.push('스크립트: ' + e.message.split('\n')[0]); }
  console.log(tag, bad.length ? '실패 ' + bad.join(' | ') : '통과', errs.length ? '| 오류: ' + [...new Set(errs)].slice(0, 4).join(' / ') : '| no errors');
  await b.close();
})();
