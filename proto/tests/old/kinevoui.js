// 권속 창의 진화 탭: 단계마다 화면이 넘치지 않는지, 진화 단추와 비밀 갈래가 제대로 도는지
// node kinevoui.js [기기 이름]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'kinevo_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const touch = !!devName, p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message + ' @ ' + ((e.stack || '').split('\n')[1] || '').trim().slice(0, 90)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; __nest.META.openAll = true; });
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(160); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const shot = name => p.screenshot({ path: path.join(out, name + '.png') });
  const closeM = async () => { for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="event"]:not([disabled])')) await tap('#modal [data-a="event"]:not([disabled])'); else if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; } };
  const check = async label => {
    const r = await p.evaluate(() => { const r = [], md = document.getElementById('modal'); if (!md) return ['창이 없다']; const box = (md.querySelector('.mbody') || md.firstElementChild || md).getBoundingClientRect();
      if (document.scrollingElement.scrollWidth > innerWidth + 1) r.push('가로 넘침 ' + (document.scrollingElement.scrollWidth - innerWidth));
      md.querySelectorAll('button, .chip, .opt').forEach(e => { if (e.offsetParent === null) return; const z = e.getBoundingClientRect(); if (z.right > Math.min(innerWidth, box.right) + 1 || z.left < Math.max(0, box.left) - 1) r.push('잘린 것 ' + e.textContent.trim().slice(0, 14)); if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') r.push('글자 넘침 ' + e.textContent.trim().slice(0, 14)); });
      md.querySelectorAll('.evoc b, .evoc span').forEach(e => { if (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2) r.push('잘린 글 ' + e.textContent.trim().slice(0, 14)); });
      md.querySelectorAll('b, small, span, p').forEach(e => { if (e.offsetParent === null || !e.textContent.trim()) return; const z = e.getBoundingClientRect(); if (z.width > 0 && z.width < 18 && z.height > 44) r.push('세로로 선 글 ' + e.textContent.trim().slice(0, 10)); });
      return [...new Set(r)]; });
    if (r.length) bad.push(label + ': ' + r.join(', '));
  };
  const openKin = async (id, label) => {
    await closeM(); await p.evaluate(id => { const m = __nest.G.kin.find(x => x.id === id); m.loc = m.loc; }, id);
    await tap('[data-a="open"][data-v="roster"]'); await p.waitForTimeout(200);
    for (let i = 0; i < 6 && !(await has(`#modal [data-a="kin"][data-id="${id}"]`)); i++) { if (await has('#modal [data-a="page"][data-v="1"]:not([disabled])')) await tap('#modal [data-a="page"][data-v="1"]:not([disabled])'); else break; }
    await tap(`#modal [data-a="kin"][data-id="${id}"]`); await tap('#modal [data-a="tab"][data-g="kin"][data-v="evo"]'); await p.waitForTimeout(200);
    await shot(label); await check(label); return (await p.$eval('#modal', e => e.textContent)).replace(/\s+/g, ' ');
  };
  try {
    await tap('[data-a="new"]'); await tap('[data-a="tab"][data-g="setup"][data-v="rule"]'); if (await has('[data-a="setup"][data-k="tut"].on')) await tap('[data-a="setup"][data-k="tut"]');
    await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300); for (let i = 0; i < 6 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(300); await closeM();
    const ids = await p.evaluate(() => {
      const G = __nest.G, N = __nest.NEST, C = N.K.kevo.cap; G.gold = 5000; G.event = null; G.guest = null; G.kin = [];
      const mk = (kind, lv, evo, loc, x) => { const m = Object.assign({ id: G.nextId++, name: '시험' + G.nextId, kind, lv, exp: 0, loc, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold', evo }, x || {}); G.kin.push(m); return m.id; };
      __nest.META.codex.kin = {}; __nest.META.codex.secret = {};
      return { low: mk('goblin', C[0] - 1, 0, null), cap0: mk('goblin', C[0], 0, null), ready: mk('skeleton', C[1], 1, 'core', { pin: true, hold: 3 }), mate: mk('cultist', 3, 0, 'core', { pin: true }),
        named: mk('scale', C[1], 1, null), vague: mk('tangle', C[1], 1, null), skel: mk('skeleton', 2, 0, null), full: mk('goblin', 20, 2, null), sec: mk('hunger', 20, 2, null, { secret: 'fist' }) };
    });
    let t = await openKin(ids.low, '1_below_cap'); if (!/한도 6/.test(t) || /한도: 진화해야/.test(t)) bad.push('한도 아래 표시: ' + t.slice(0, 120));
    if (!(await has('#modal [data-a="kinevo"][disabled]'))) bad.push('한도 아래인데 진화 단추가 눌린다');
    t = await openKin(ids.cap0, '2_at_cap'); if (!/한도: 진화해야 더 큰다/.test(t)) bad.push('한도 표시가 없다');
    await tap(`#modal [data-a="kinevo"][data-id="${ids.cap0}"]`); const st1 = await p.evaluate(id => __nest.NEST.stageOf(__nest.G.kin.find(x => x.id === id)), ids.cap0); if (st1 !== 1) bad.push('첫 진화가 안 됐다 ' + st1);
    t = await openKin(ids.ready, '3_two_cards_ready'); if ((await p.$$('#modal [data-a="kinevo"]')).length !== 2) bad.push('둘째 진화에서 카드 둘이 아니다');
    await tap(`#modal [data-a="kinevo"][data-id="${ids.ready}"][data-s="1"]`);
    const r = await p.evaluate(id => { const m = __nest.G.kin.find(x => x.id === id); return { st: __nest.NEST.stageOf(m), sec: m.secret, codex: Object.keys(__nest.META.codex.secret) }; }, ids.ready);
    if (r.st !== 2 || r.sec !== 'pray' || !r.codex.includes('skeleton')) bad.push('비밀 진화가 안 됐다 ' + JSON.stringify(r));
    t = await openKin(ids.named, '4_hint_named'); if (!/뼈껍질을\(를\) 곁에 두고/.test(t)) bad.push('본 적 있는 짝의 이름이 귀띔에 없다: ' + t.slice(-160));
    await p.evaluate(() => { delete __nest.META.codex.kin.spitter; }); t = await openKin(ids.vague, '5_hint_vague'); if (!/무언가를 곁에 두고/.test(t)) bad.push('본 적 없는 짝인데 이름이 보인다');
    t = await openKin(ids.full, '6_full'); if (!/다 자란 것/.test(t)) bad.push('다 자란 모습 표시');
    t = await openKin(ids.sec, '7_secret'); if (!/비밀/.test(t)) bad.push('비밀 갈래 표시');
    await closeM(); await tap('[data-a="open"][data-v="roster"]'); await p.waitForTimeout(200); await shot('8_roster'); await check('roster');
    await closeM(); await p.waitForTimeout(300); await shot('9_stage');
  } catch (e) { bad.push('멈춤: ' + e.message.split('\n')[0]); await shot('stuck'); }
  if (errs.length) bad.push('오류 ' + errs.slice(0, 3).join(' | '));
  console.log(bad.length ? tag + ' 실패 ' + bad.join(' / ') : tag + ' 통과');
  await b.close();
})();
