// 새 화면 전체를 실제로 눌러 보며 지나간다: 타이틀의 창들, 새 판 준비(잠금), 패널 탭, 밤, 정산, 끝까지.
// node ux.js [기기 이름]   기기를 주면 손가락으로 누른다.
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'ux_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName === 'small') ctx = await b.newContext({ viewport: { width: 375, height: 620 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else if (devName === 'laptop') ctx = await b.newContext({ viewport: { width: 1280, height: 680 } });
  else if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const touch = !!devName && devName !== 'laptop';
  const p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message + ' @ ' + ((e.stack || '').split('\n')[1] || '').trim().slice(0, 90)));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300);
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(140); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  let n = 0;
  const check = async label => {
    await p.waitForTimeout(200);
    const m = await p.evaluate(() => {
      const vis = e => e && !e.hidden && e.offsetParent !== null, over = e => vis(e) ? Math.max(0, e.scrollHeight - e.clientHeight) : 0, r = [];
      const doc = document.scrollingElement; if (doc.scrollHeight > innerHeight + 1) r.push('페이지 ' + (doc.scrollHeight - innerHeight));
      [['#view', '패널'], ['#modal .mbody', '창'], ['#night', '밤'], ['#left', '왼쪽']].forEach(([s, nm]) => { const e = document.querySelector(s), o = over(e); if (o > 2) r.push(nm + ' ' + o); });
      // 화면 밖으로 잘린 단추
      let cut = 0; document.querySelectorAll('button').forEach(e => { if (!vis(e) || e.closest('#tray')) return; const q = e.getBoundingClientRect(); if (!q.width) return; const top = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, q.left + q.width / 2)), Math.min(innerHeight - 1, Math.max(0, q.top + q.height / 2))); if (q.right > innerWidth + 1 || q.bottom > innerHeight + 1 || q.left < -1 || q.top < -1) cut++; });
      if (cut) r.push('잘린 단추 ' + cut); return r;
    });
    n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') });
    if (m.length) bad.push(label + ': ' + m.join(', '));
  };
  const closeM = async () => { for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="event"]:not([disabled])')) await tap('#modal [data-a="event"]:not([disabled])'); else if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; } };
  const tabs = async (g, label) => { const vs = await p.$$eval(`#modal [data-a="tab"][data-g="${g}"], #view [data-a="tab"][data-g="${g}"]`, es => es.filter(e => e.offsetParent).map(e => e.dataset.v)); for (const v of vs) { await tap(`[data-a="tab"][data-g="${g}"][data-v="${v}"]`); await check(label + '_' + v); } return vs.length; };
  const stageTap = async (lx, ly) => {
    await p.evaluate(lx => { const S = __nest.ST; S.cam.tx = S.cam.x = Math.max(0, Math.min(960 - S.viewW, lx - S.viewW / 2)); }, lx); await p.waitForTimeout(120);
    const xy = await p.evaluate(([lx, ly]) => { const b = document.getElementById('stage').getBoundingClientRect(), u = b.height / 550, S = __nest.ST; return [b.left + (lx - S.cam.x + S.ox) * u, b.top + (ly - (S.cam.y || 0)) * u]; }, [lx, ly]);
    if (touch) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(260);
  };
  const cell = i => stageTap(20 + (i % 5) * 184 + 92, 48 + Math.floor(i / 5) * 124 + 62);
  const closeSheet = async () => { if (await has('#sheetclose')) await tap('#sheetclose'); await p.waitForTimeout(150); };
  const log = (...a) => console.log(...a);
  try {
    // ---------- 타이틀과 그 창들 ----------
    await check('title');
    await tap('[data-a="codex"]'); log('도감 탭', await tabs('codex', 'codex')); await tap('[data-a="tab"][data-g="codex"][data-v="form"]'); await tabs('codexAsp', 'codexform'); await closeM();
    await tap('[data-a="records"]'); log('기록 탭', await tabs('records', 'records')); await closeM();
    await tap('[data-a="barracks"]'); await tabs('barracks', 'barracks'); await tap('[data-a="tab"][data-g="barracks"][data-v="draw"]'); await tap('[data-a="draw"][data-v="free"]'); await check('barracks_drawn'); await closeM();
    await tap('[data-a="help"]'); log('도움말 쪽', await tabs('help', 'help')); await closeM();
    // ---------- 새 판 준비: 고르는 것은 깊이와 데려갈 권속뿐 ----------
    await tap('[data-a="new"]'); await check('setup_sky'); log('별자리:', await p.$eval('#modal .card .h3', e => e.textContent), '· 준비 창 탭', await tabs('setup', 'setup'));
    await tap('[data-a="tab"][data-g="setup"][data-v="rule"]'); log('잠긴 깊이', await p.$$eval('[data-a="setup"][data-k="diff"][disabled]', e => e.length)); await tap('[data-a="close"][data-v=""]');
    await tap('[data-a="settings"]'); await tap('[data-a="set"][data-k="open"][data-v="1"]'); await check('settings'); await closeM();
    await tap('[data-a="codex"]'); await tap('[data-a="tab"][data-g="codex"][data-v="sign"]'); log('전부 열어 둔 뒤 잠긴 별자리', await p.$$eval('#modal .node.lockd', e => e.length)); await closeM();
    await tap('[data-a="new"]'); await tap('[data-a="tab"][data-g="setup"][data-v="rule"]'); await check('setup_rule_open');
    if (await has('[data-a="setup"][data-k="tut"].on')) await tap('[data-a="setup"][data-k="tut"]');
    await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300); await check('intro'); await tap('[data-a="sceneskip"]'); await p.waitForTimeout(300);
    log('판 시작:', await p.evaluate(() => __nest.G.sign + ' / ' + __nest.G.startAsp + ' / ' + __nest.G.star + ' / ' + __nest.NEST.formName(__nest.G)));
    // ---------- 지원자 ----------
    await check('applicants'); for (let i = 0; i < 2; i++) if (await has('#modal [data-a="accept"]:not([disabled])')) await tap('#modal [data-a="accept"]:not([disabled])'); await closeM();
    await check('day1');
    // ---------- 빈 굴: 추천 → 초소 → 세우기 ----------
    await cell(1); await check('cell_rec'); log('추천:', (await p.$$eval('#view .opts .opt b', es => es.map(e => e.textContent.trim()))).join(' | '));
    await tap('[data-a="build"][data-v="post"]'); await check('cell_post'); if (await has('#view [data-a="place"]')) { await tap('#view [data-a="place"]'); if (await has('#view [data-a="place"]')) await tap('#view [data-a="place"]'); }
    log('초소 주둔', await p.evaluate(() => __nest.G.kin.filter(m => m.loc === 1).length)); await check('cell_post_placed');
    for (const v of ['fight', 'trick', 'home']) { await tap(`[data-a="tab"][data-g="cell"][data-v="${v}"]`); await check('cell_' + v); }
    log('잠긴 시설 표시', await p.$$eval('#view .opt.lockd', e => e.length)); await closeSheet();
    await cell(6); await tap('[data-a="build"][data-v="trap"]'); await check('cell_trap'); if (await has('[data-a="trap"][data-v="spike"]')) await tap('[data-a="trap"][data-v="spike"]'); if (await has('[data-a="trap"][data-v="rock"]')) await tap('[data-a="trap"][data-v="rock"]'); await check('cell_trap_full'); await closeSheet();
    // ---------- 바위 파기 ----------
    await p.evaluate(() => { __nest.G.gold = 3000; __nest.G.ap = 2; });
    await cell(14); await check('rock'); await tap('[data-a="dig"]'); await check('dug'); if (await has('[data-a="build"][data-v="prison"]')) await tap('[data-a="build"][data-v="prison"]'); await check('prison'); await closeSheet();
    await cell(18); await check('core_by_cell'); await closeSheet();
    // ---------- 본체 ----------
    await tap('[data-a="core"]'); await check('core'); log('본체 탭', await tabs('core', 'core')); await tap('[data-a="tab"][data-g="core"][data-v="hoard"]'); await tap('[data-a="hoard"][data-k="gulp"]'); await check('core_gulp'); await closeSheet();
    // ---------- 지상 ----------
    await tap('[data-a="view"][data-v="surface"]'); await p.waitForTimeout(500); await check('surface');
    await stageTap(258, 160); await check('vill'); await tabs('vill', 'vill'); await closeSheet();
    await stageTap(244, 348); await check('plot'); await closeSheet();
    await tap('[data-a="view"][data-v="under"]'); await p.waitForTimeout(400);
    // ---------- 권속 창 ----------
    await tap('[data-a="open"][data-v="roster"]'); await check('roster'); await tap('#modal [data-a="kin"]'); await check('kin'); log('권속 탭', await tabs('kin', 'kin')); await closeM();
    // ---------- 밤 ----------
    await p.evaluate(() => { const G = __nest.G; G.march.tonight = { vill: 'field', settle: false }; G.guest = null; G.event = null; __nest.META.pause = 'always'; });
    await tap('[data-a="endday"]'); await p.waitForTimeout(200); if (await has('[data-a="endday"]')) await tap('[data-a="endday"]');
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(100); if (i === 15) await p.evaluate(() => { __nest.ST.speed = 8; }); if (await has('#hand [data-a="hand"]')) break; if (await has('#modal [data-a="close"]')) break; }
    await check('night'); if (await has('#hand [data-a="hand"][data-k="whip"]')) await tap('#hand [data-a="hand"][data-k="whip"]');
    for (let i = 0; i < 300; i++) { await p.waitForTimeout(70); await p.evaluate(() => { __nest.ST.skip = true; const h = document.querySelector('#hand:not([hidden]) [data-a="hand"][data-k="none"]'); if (h) h.click(); }); if (await has('#modal [data-a="close"]')) break; }
    await check('settle'); await closeM(); await p.waitForTimeout(300); if (await has('[data-a="sceneskip"]')) await tap('[data-a="sceneskip"]'); await closeM();
    // ---------- 포로 ----------
    await p.evaluate(() => { const G = __nest.G; G.prison = []; for (let k = 0; k < 4; k++) G.prison.push({ kind: ['villager', 'militia', 'fisher', 'villager'][k], vill: 'field' }); G.event = null; }); await p.waitForTimeout(500); await closeM(); await cell(0); await closeSheet();
    await tap('[data-a="open"][data-v="captives"]'); await check('captives'); await tap('#modal [data-a="dispose"][data-how="convert"]'); await tap('#modal [data-a="disposeall"]'); await check('captives_after'); await closeM();
    log('포로 처분 뒤:', await p.evaluate(() => 'G.prison ' + __nest.G.prison.length + ', 권속 ' + __nest.G.kin.length));
    // ---------- 끝까지 ----------
    await p.evaluate(() => { __nest.META.pause = 'never'; });
    let ended = '';
    for (let guard = 0; guard < 2500; guard++) {
      const s = await p.evaluate(() => { const G = __nest.G; return { title: !document.getElementById('title').hidden, scene: !document.getElementById('scene').hidden, modal: !document.getElementById('modal').hidden, night: __nest.ST.mode === 'night', day: G && G.day, over: G && !!G.over, h: (document.querySelector('#modal h2') || {}).textContent || '' }; });
      if (s.title) { ended = '타이틀로 돌아옴'; break; }
      if (s.scene) { await p.evaluate(() => { const e = document.querySelector('[data-a="sceneskip"]'); if (e) e.click(); }); await p.waitForTimeout(60); continue; }
      if (s.night) { await p.evaluate(() => { __nest.ST.skip = true; }); await p.waitForTimeout(50); continue; }
      if (s.modal) {
        if (/깨어났다|돌아갔다/.test(s.h)) { await check('result'); log('결과 창:', s.h, '· 탭', await tabs('result', 'result')); await p.evaluate(() => { const e = document.querySelector('#modal [data-a="close"]'); if (e) e.click(); }); await p.waitForTimeout(150); continue; }
        if (s.h.includes('명부에 올릴')) await check('legacy');
        if (await p.$('.evo') && !s.evoShot) await check((s.h ? 'evo_' : 'trait_') + s.day);
        if (/달라지려/.test(await p.$eval('#modal', e => e.textContent))) await check('traitevent_' + s.day);
        await p.evaluate(() => { const ev = document.querySelector('#modal [data-a="event"]:not([disabled])'), gu = document.querySelector('#modal [data-a="guest"]:not([disabled])'), c = document.querySelector('#modal [data-a="close"]'); (ev || gu || c).click(); }); await p.waitForTimeout(70); continue;
      }
      await p.evaluate(() => {
        const G = __nest.G, S = __nest.NEST, c = S.cm(G); G.gold = Math.max(G.gold, 400 * c);
        for (let i = G.applicants.length - 1; i >= 0; i--) if (S.freeSlot(G, G.applicants[i].kind) !== null) S.accept(G, i);
        const path = S.paths(G)[0], want = ['hall', 'trap', 'hall', 'ambush', 'hall']; let wi = 0;
        for (const i of path) if (i !== S.CORE && G.cells[i].type === 'empty') { S.build(G, i, want[wi++ % 5]); }
        G.cells.forEach((x, i) => { while (x.traps.length < (S.ROOM[x.type].traps || 0)) if (!S.addTrap(G, i, x.traps.length ? 'rock' : 'spike').ok) break; });
        for (let i = G.prison.length - 1; i >= 0; i--) S.dispose(G, i, 'sacrifice');
        G.kin.forEach(m => { if (m.loc === null) { const f = S.freeSlot(G, m.kind); if (f !== null) S.moveKin(G, m.id, f); } if (!m.evo && m.lv >= 5) S.evolveKin(G, m.id); });
        if (G.corpses.length >= 3) S.eat(G); if (G.slime.hp < S.slimeStats(G).hp * 0.6) S.rest(G); const locs = [...new Set(G.kin.map(m => m.loc).filter(l => l !== null))]; if (G.day >= 4 && locs.length) S.train(G, locs[G.day % locs.length], 120 * c); S.hoardBuy(G, 'gulp');
        G.guest = null;
      });
      if ([9, 17, 25, 33].includes(s.day) && !ended.includes('d' + s.day)) { ended += 'd' + s.day; await tap('[data-a="core"]'); await check('core_day' + s.day); await closeSheet(); await check('day' + s.day); }
      await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e) { e.click(); } }); await p.waitForTimeout(60);
      await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e && __nest.ST.mode === 'day') e.click(); }); await p.waitForTimeout(60);
    }
    log('끝:', ended.replace(/d\d+/g, ''), '· 기록', JSON.stringify(await p.evaluate(() => ({ best: __nest.META.best, clears: __nest.META.clears, feats: Object.keys(__nest.META.feats).length, traits: Object.keys(__nest.META.codex.traits), next: __nest.META.nextSign }))));
    await check('title_after');
  } catch (e) { errs.push('검사 스크립트: ' + e.message.split('\n').slice(0, 3).join(' | ')); await p.screenshot({ path: path.join(out, 'fail.png') }).catch(() => {}); }
  console.log(tag, '· 화면', n, '개 ·', bad.length ? '넘치거나 잘린 화면:\n  ' + bad.join('\n  ') : '넘치거나 잘린 화면 없음');
  console.log(errs.length ? '오류:\n  ' + errs.join('\n  ') : 'no errors'); await b.close();
})();
