// 이야기 모드를 처음부터 3장 끝까지 눌러 본다: 첫 화면 → 이야기 → 1장(한 방울) → 2장(땅속) → 3장(물레골) → 장 고르기
// node tests/story.js [기기 이름]   찍은 그림은 tests/story_<기기>/
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const FZM = require('./_fz.js'), devName = process.argv[2], tag = (devName ? devName.replace(/\s+/g, '') : 'pc') + (FZM.FZ ? '_fz' + FZM.FZ : ''), out = path.join(__dirname, 'story_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); const ctx = await FZM.context(b, devName);
  const touch = !!devName && devName !== 'laptop', p = await ctx.newPage(), errs = [], bad = [], shots = {}; p.setDefaultTimeout(8000); if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  p.on('pageerror', e => errs.push(e.message + ' @ ' + ((e.stack || '').split('\n')[1] || '').trim().slice(0, 90)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300);
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(150); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  let n = 0;
  const check = async label => {
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const vis = e => e && !e.hidden && e.offsetParent !== null, over = e => vis(e) ? Math.max(0, e.scrollHeight - e.clientHeight) : 0, r = [];
      const doc = document.scrollingElement; if (doc.scrollHeight > innerHeight + 1) r.push('페이지 ' + (doc.scrollHeight - innerHeight));
      [['#modal .mbody', '창'], ['#night', '밤'], ['#left', '왼쪽']].forEach(([s, nm]) => { const o = over(document.querySelector(s)); if (o > 2) r.push(nm + ' ' + o); });
      let cut = 0; document.querySelectorAll('button').forEach(e => { if (!vis(e) || e.closest('#tray') || (e.closest('#view') && document.querySelector('#view').scrollHeight > document.querySelector('#view').clientHeight + 2)) return; const q = e.getBoundingClientRect(); if (!q.width) return; if (q.right > innerWidth + 1 || q.left < -1 || q.bottom > innerHeight + 1) cut++; });
      if (cut) r.push('잘린 단추 ' + cut);
      document.querySelectorAll('#coach, #coach2, #scene .box').forEach(e => { if (vis(e) && e.scrollWidth > e.clientWidth + 2) r.push('옆으로 넘침 ' + e.id); });
      if (/이\(가\)|을\(를\)|은\(는\)|와\(과\)|\(으\)로/.test(document.body.innerText)) r.push('조사 표기가 남음');
      return r;
    });
    if (FZM.FZ) { r.splice(0, r.length, ...r.filter(x => !/^(패널|창|밤|왼쪽) |^잘린 단추/.test(x))); const cl = await p.evaluate(FZM.clipScript); if (cl.length) r.push('잘린 글 ' + cl.length + ': ' + cl.slice(0, 6).join(' / ')); }
    n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') });
    if (r.length) bad.push(label + ': ' + r.join(', '));
  };
  // 대사가 떠 있으면: 꿈·책을 쫓는 자·포로는 한 번씩 찍고 넘긴다
  // 대사가 떠 있으면 한 줄씩 넘긴다: 꿈·책을 쫓는 자·포로는 한 번씩 찍는다
  const skipAll = async () => { for (let k = 0; k < 60; k++) { if (!(await has('#scene .box'))) return; for (const c of ['dream', 'seeker', 'cap']) if (!shots[c] && await has('#scene .box.' + c)) { shots[c] = 1; await p.waitForTimeout(1200); await check('line_' + c); } await p.evaluate(() => { const e = document.getElementById('scene'); if (e && !e.hidden) e.click(); }); await p.waitForTimeout(60); await p.evaluate(() => { const e = document.getElementById('scene'); if (e && !e.hidden) e.click(); }); await p.waitForTimeout(90); } };
  const state = () => p.evaluate(() => ({ modal: !document.getElementById('modal').hidden, scene: !document.getElementById('scene').hidden, cleared: !!document.querySelector('#modal .cleared'), mode: __nest.ST.mode, day: __nest.G && __nest.G.day, ch: __nest.G && __nest.G.story && __nest.G.story.ch, over: __nest.G && __nest.G.over }));
  // 낮을 끝내고 밤을 건너뛰고 정산 창을 닫는다. 장을 넘긴 창이 뜨면 멈춘다
  const playUntilClear = async (prep, label) => {
    for (let k = 0; k < 40; k++) {
      await skipAll(); let s = await state(); if (s.cleared) return true;
      if (s.modal) { if (await has('#modal [data-a="close"]')) { await tap('#modal [data-a="close"]'); continue; } }
      if (s.mode === 'night') { await p.evaluate(() => { const q = sel => [...document.querySelectorAll(sel)].find(x => x.offsetParent); const k = q('[data-a="skip"]'); if (k) k.click(); const h = q('#hand [data-a]'); if (h) h.click(); }); await p.waitForTimeout(300); continue; }
      if (s.mode === 'day' && !s.modal && !s.scene) { if (prep) await p.evaluate(prep); await p.evaluate(() => __nest.render()); await p.waitForTimeout(150); await skipAll(); if ((await state()).modal) continue;
        if (label && !shots[label + s.day]) { shots[label + s.day] = 1; if (s.day <= 2) await check(label + '_day' + s.day); }
        await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e) e.click(); }); await p.waitForTimeout(80);
        await p.evaluate(() => { const e = [...document.querySelectorAll('[data-a="endday"]')].find(x => x.offsetParent); if (e && __nest.ST.mode === 'day') e.click(); }); await p.waitForTimeout(250); }
      await p.waitForTimeout(150);
    }
    return false;
  };
  const log = (...a) => console.log(...a);
  try {
    // ---------- 첫 화면 ----------
    await check('title');
    if (!(await has('#menu [data-a="story"].pri'))) bad.push('처음 하는 사람에게 「이야기」가 먼저 보이지 않는다');
    if (!(await has('#menu [data-a="new"]'))) bad.push('「자유」가 없다');
    await tap('#menu [data-a="story"]'); await check('select');
    if (await p.locator('#modal [data-a="close"][data-v="ch2"]:not([disabled])').count()) bad.push('1장을 넘기기 전에 2장이 열려 있다');
    // ---------- 1장: 한 방울 ----------
    await tap('#modal [data-a="close"][data-v="ch1"]'); await p.waitForTimeout(200); await check('ch1_start'); await skipAll();
    await p.waitForFunction(() => window.__pro && document.querySelector('.pro-cv'), null, { timeout: 8000 });
    await p.evaluate(() => { if (__pro.intro) __pro.closeIntro(); }); await p.waitForTimeout(1500); await check('ch1_pro');
    if (await p.evaluate(() => { const e = document.getElementById('pro-skip'); return e && !e.hidden; })) bad.push('1장에 건너뛰기 단추가 있다');
    await p.evaluate(() => { __pro.sim.S.bio = 9999; }); await p.waitForFunction(() => !document.querySelector('.pro-cv'), null, { timeout: 8000 });
    await p.waitForTimeout(300); await skipAll();
    await p.waitForSelector('#modal .cleared', { timeout: 8000 }); await check('ch1_clear');
    log('1장 넘김 ·', JSON.stringify(await p.evaluate(() => ({ clear: __nest.META.story.clear, size: __nest.META.story.pr && __nest.META.story.pr.size }))));
    // ---------- 2장: 땅속 ----------
    await tap('#modal [data-a="close"][data-v="next"]'); await p.waitForTimeout(200); await check('ch2_start'); await skipAll(); await p.waitForTimeout(300);
    await check('ch2_day');
    const chip = await p.evaluate(() => { const e = document.querySelector('#mapchips .goalchip'); return e && e.offsetParent ? e.textContent : ''; }); if (!/목표 \d\/\d/.test(chip)) bad.push('2장 목표 칩이 보이지 않는다: ' + chip);
    await tap('#mapchips .goalchip'); await check('ch2_goal');
    const ch2 = await p.evaluate(() => ({ coach: [...document.querySelectorAll('#view')].some(e => e.offsetParent && /2장/.test(e.textContent)), breach: [...document.querySelectorAll('[data-a="breach"]')].some(e => e.offsetParent), sealed: __nest.G.sealed, dug: __nest.G.cells.filter(c => c.dug).length }));
    if (!ch2.coach) bad.push('2장 목표 창이 열리지 않는다'); await tap('#sheetclose'); if (ch2.breach) bad.push('2장에 뚫기 단추가 보인다'); if (ch2.dug !== 1) bad.push('2장이 한 칸으로 시작하지 않는다');
    // 본체 방을 열어 손 탭이 없는지, 빈 칸에 방 목록이 없는지
    await tap('[data-a="core"]'); await p.waitForTimeout(200); await check('ch2_core');
    if (await p.locator('[data-a="tab"][data-g="core"][data-v="hand"]').count()) bad.push('2장에 손 탭이 있다');
    await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; for (let k = 0; k < 4; k++) { const i = G.cells.findIndex((c, j) => !c.dug && !S.canDig(G, j)); if (i >= 0) S.dig(G, i); } __nest.render(); });
    { const i = await p.evaluate(() => __nest.G.cells.findIndex((c, j) => c.dug && j !== __nest.G.core)); await p.evaluate(i => { __nest.ST.screen = 'under'; }, i); const c = await p.evaluate(i => __nest.cellAt(i), i); await p.evaluate(([x, y]) => __nest.aim(x, y), c); await p.waitForTimeout(150); const xy = await p.evaluate(([x, y]) => __nest.toClient(x, y), c); if (touch) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(300); await skipAll(); await check('ch2_cell'); }
    if (await p.locator('[data-a="build"]:not([data-v="empty"])').locator('visible=true').count()) bad.push('2장 빈 굴에 지을 방 목록이 보인다');
    if (await has('#sheetclose')) await tap('#sheetclose');
    const prep2 = () => { const G = __nest.G, S = __nest.NEST; for (let k = 0; k < 4; k++) { const i = G.cells.findIndex((c, j) => !c.dug && c.soft && !S.canDig(G, j)); const j = i >= 0 ? i : G.cells.findIndex((c, q) => !c.dug && !S.canDig(G, q)); if (j < 0 || !S.dig(G, j).ok) break; } while (G.kin.filter(m => m.kind !== 'spawn').length < 2 && G.applicants.length && S.accept(G, 0).ok); };
    if (!(await playUntilClear(prep2, 'ch2'))) bad.push('2장이 끝나지 않았다'); await check('ch2_clear');
    log('2장 넘김 ·', JSON.stringify(await p.evaluate(() => ({ clear: __nest.META.story.clear, snap: !!__nest.META.story.snap, day: __nest.G.day }))));
    // ---------- 3장: 물레골 ----------
    await tap('#modal [data-a="close"][data-v="next"]'); await p.waitForTimeout(200); await skipAll(); await check('ch3_start');
    await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; for (let k = 0; k < 8 && !S.paths(G).length; k++) { const i = G.cells.findIndex((c, j) => !c.dug && c.soft && !S.canDig(G, j)); if (i < 0 || !S.dig(G, i).ok) break; } __nest.render(); });
    await skipAll(); await tap('#foot [data-a="breach"], #mnav [data-a="breach"]'); await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(400);
    await skipAll(); await check('ch3_breached');
    const v3 = await p.evaluate(() => ({ world: __nest.G.world, vill: __nest.NEST.VILL.field.name, tonight: __nest.G.march.tonight && __nest.G.march.tonight.kinds }));
    log('3장 뚫음 ·', JSON.stringify(v3)); if (v3.world !== 'fantasy' || v3.vill !== '물레골') bad.push('3장의 땅 위가 물레골이 아니다');
    const prep3 = () => { const G = __nest.G, S = __nest.NEST; const path = (S.paths(G)[0] || []).filter(i => i !== G.core && i !== G.ent); for (const i of path) { if (G.cells[i].type === 'empty' && G.gold > 120) S.build(G, i, G.cells.some(c => c.type === 'post') ? 'trap' : 'post'); if (G.cells[i].type === 'trap' && !G.cells[i].traps.length) S.addTrap(G, i, 'spike'); } while (G.kin.filter(m => m.kind !== 'spawn').length < 4 && G.applicants.length && S.accept(G, 0).ok); };
    if (!(await playUntilClear(prep3, 'ch3'))) bad.push('3장이 끝나지 않았다'); await check('ch3_clear');
    for (const c of ['dream', 'seeker', 'cap']) if (!shots[c]) bad.push('대사를 보지 못했다: ' + c);
    await tap('#modal [data-a="close"][data-v="title"]'); await p.waitForTimeout(300); await check('title_after');
    await tap('#menu [data-a="story"]'); await check('select_after');
    const sel = await p.evaluate(() => [...document.querySelectorAll('#modal .storylist .btn')].map(e => (e.disabled ? 'x' : 'o') + e.textContent.slice(0, 4)).join(' '));
    log('장 고르기:', sel); if (!/o1장/.test(sel) || !/o3장/.test(sel) || !/x4장/.test(sel)) bad.push('장 고르기 상태가 이상하다: ' + sel);
  } catch (e) {
    errs.push('검사 스크립트: ' + e.message.split('\n').slice(0, 3).join(' | ')); await p.screenshot({ path: path.join(out, 'fail.png') }).catch(() => {});
    errs.push('그때: ' + JSON.stringify(await state().catch(() => null)));
  }
  console.log(tag, '· 화면', n, '개 ·', bad.length ? '문제:\n  ' + bad.join('\n  ') : '넘치거나 잘린 화면 없음');
  console.log(errs.length ? '오류:\n  ' + errs.join('\n  ') : 'no errors'); await b.close();
  process.exitCode = bad.length || errs.length ? 1 : 0;
})();
