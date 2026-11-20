// 손 주문: 낮에 쥘 것을 고르고, 밤에 방마다 쓰고, 과녁은 무대를 눌러 고른다.
// node hand.js [기기 이름]   기기를 주면 손가락으로 누른다.
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'hand_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const touch = !!devName, p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message + ' @ ' + ((e.stack || '').split('\n')[1] || '').trim().slice(0, 90)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; __nest.META.openAll = true; });
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(140); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const shot = name => p.screenshot({ path: path.join(out, name + '.png') });
  const check = async label => {
    const r = await p.evaluate(() => { const vis = e => e && !e.hidden && e.offsetParent !== null, r = [], doc = document.scrollingElement; if (doc.scrollHeight > innerHeight + 1) r.push('페이지 ' + (doc.scrollHeight - innerHeight)); if (doc.scrollWidth > innerWidth + 1) r.push('가로 ' + (doc.scrollWidth - innerWidth));
      const h = document.getElementById('hand'); if (vis(h)) { const q = h.getBoundingClientRect(); if (q.bottom > innerHeight + 1 || q.right > innerWidth + 1) r.push('손 창이 화면 밖 ' + Math.round(q.bottom - innerHeight)); h.querySelectorAll('button').forEach(e => { const z = e.getBoundingClientRect(); if (z.right > q.right + 1 || z.bottom > innerHeight + 1) r.push('잘린 단추 ' + e.textContent.trim().slice(0, 8)); }); }
      return r; });
    if (r.length) bad.push(label + ': ' + r.join(', '));
  };
  const stageTap = async (lx, ly) => {
    await p.evaluate(lx => { const S = __nest.ST; S.cam.tx = S.cam.x = Math.max(0, Math.min(960 - S.viewW, lx - S.viewW / 2)); }, lx); await p.waitForTimeout(120);
    const xy = await p.evaluate(([lx, ly]) => { const b = document.getElementById('stage').getBoundingClientRect(), u = b.height / 550, S = __nest.ST; return [b.left + (lx - S.cam.x + S.ox) * u, b.top + (ly - (S.cam.y || 0)) * u]; }, [lx, ly]);
    if (touch) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(120);
  };
  const closeM = async () => { for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="event"]:not([disabled])')) await tap('#modal [data-a="event"]:not([disabled])'); else if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; } };
  const closeSheet = async () => { if (await has('#sheetclose')) await tap('#sheetclose'); await p.waitForTimeout(150); };
  try {
    await tap('[data-a="new"]'); await tap('[data-a="tab"][data-g="setup"][data-v="rule"]'); if (await has('[data-a="setup"][data-k="tut"].on')) await tap('[data-a="setup"][data-k="tut"]');
    await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300); for (let i = 0; i < 6 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(300); await closeM();
    await tap('[data-a="breach"]'); await tap('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(500); for (let i = 0; i < 6 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(400); await tap('[data-a="view"][data-v="under"]'); await p.waitForTimeout(600); await closeM();
    // 판을 차린다: 성운 둘째 허물(손 +2), 길 위에 문턱·함정·싸움 굴, 곁에 기도 굴과 고치 굴
    const info = await p.evaluate(() => {
      const G = __nest.G, N = __nest.NEST, path = N.paths(G)[0]; G.gold = 5000; G.faith = 40; G.slime.main = 'nebula'; G.slime.sub = 'abyss'; G.slime.stage = 2; G.slime.body = null; G.event = null; G.guest = null;
      const rooms = path.filter(i => i !== N.CORE); ['post', 'trap', 'hall'].forEach((t, k) => { const i = rooms[Math.min(k, rooms.length - 1)]; if (G.cells[i].type === 'empty' || k < rooms.length) G.cells[i].type = t; });
      G.cells.forEach((c, i) => { if (c.type === 'trap') c.traps = [{ kind: 'spike', lv: 1 }, { kind: 'acid', lv: 1 }]; });
      const free = []; for (let i = 0; i < N.N; i++) if (!G.cells[i].dug && !N.canDig(G, i)) free.push(i); free.slice(0, 2).forEach((i, k) => { G.cells[i].dug = true; G.cells[i].type = k ? 'prison' : 'chapel'; });
      const mk = (kind, loc) => G.kin.push({ id: G.nextId++, name: '시험' + G.nextId, kind, lv: 3, exp: 0, loc, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold' });
      G.kin.forEach(m => { m.loc = null; }); G.cells.forEach((c, i) => { if (c.type === 'post' || c.type === 'hall') { mk('goblin', i); mk('skeleton', i); } }); mk('goblin', 'core');
      G.march.tonight = { vill: 'field', settle: true }; __nest.META.pause = 'always';
      return { known: N.SPELL_IDS.filter(id => N.spellKnown(G, id)), hand: N.handOf(G), hands: N.handsMax(G), slots: N.handSlots(G) };
    });
    console.log('아는 주문', info.known.join(' '), '| 쥔 손', info.hand.join(' '), '| 손', info.hands, '자리', info.slots);
    // 주문 책: 하나 내려놓고 다른 것을 쥔다
    await tap('[data-a="core"]'); await tap('[data-a="tab"][data-g="core"][data-v="hand"]'); await p.waitForTimeout(200); await shot('1_book'); await check('book');
    const seek = async id => { for (let i = 0; i < 4 && !(await p.$('[data-a="sethand"][data-id="' + id + '"]')); i++) { await tap('[data-a="page"][data-g="hand"][data-v="' + (i < 2 ? 1 : -1) + '"]'); await p.waitForTimeout(120); } await tap('[data-a="sethand"][data-id="' + id + '"]'); };
    await seek('star'); await seek('mark'); await p.waitForTimeout(150); await shot('1_book_changed');
    const hand2 = await p.evaluate(() => __nest.NEST.handOf(__nest.G)); console.log('고친 손', hand2.join(' ')); if (hand2.includes('star') || !hand2.includes('mark')) bad.push('쥔 손이 바뀌지 않았다');
    for (let i = 0; i < 4 && !(await p.$('[data-a="sethand"][data-id="rock"]')); i++) { await tap('[data-a="page"][data-g="hand"][data-v="' + (i < 2 ? -1 : 1) + '"]'); await p.waitForTimeout(120); }
    if (!(await p.evaluate(() => !!document.querySelector('[data-a="sethand"][data-id="rock"]:not(.on)')))) bad.push('안 쥔 주문이 보이지 않는다');
    await closeSheet();
    // 밤
    await tap('[data-a="endday"]'); await p.waitForTimeout(200); if (await has('[data-a="endday"]')) await tap('[data-a="endday"]');
    const cast = [], staged = []; let shots = 0, prompts = 0, asked = false, tshot = false;
    for (let i = 0; i < 600; i++) {
      await p.waitForTimeout(90); if (i === 20) await p.evaluate(() => { __nest.ST.speed = 3; });
      if (await has('#modal [data-a="close"]')) break;
      if (!(await has('#hand [data-a="hand"]'))) continue;
      prompts++; if (!asked) { asked = true; await p.waitForTimeout(250); await shot('2_prompt'); } await check('prompt' + prompts);
      const ids = await p.$$eval('#hand [data-a="hand"]:not([disabled])', es => es.map(e => e.dataset.k).filter(k => k !== 'none'));
      const want = ['mark', 'move', 'rift', 'whip', 'scream', 'cocoon', 'rock'].find(k => ids.includes(k) && !cast.includes(k));
      if (!want) { await tap('#hand [data-a="hand"][data-k="none"]'); continue; }
      await tap(`#hand [data-a="hand"][data-k="${want}"]`);
      if (await has('#hand [data-a="handback"]')) {
        await p.waitForTimeout(260); if (!tshot) { tshot = true; await shot('3_target'); await check('target'); await tap('#hand [data-a="handback"]'); await p.waitForTimeout(150); if (!(await has('#hand [data-a="hand"][data-k="none"]'))) bad.push('취소 뒤 손 창이 돌아오지 않았다'); await tap(`#hand [data-a="hand"][data-k="${want}"]`); await p.waitForTimeout(200); }
        const pt = await p.evaluate(() => { const S = __nest.ST, pk = S.pick; if (!pk) return null; if (pk.kind === 'inv') { const e = S.ents[pk.ids[0]], z = 8 * (e.scale || 2); return [e.x + z, e.y + z]; } const k = pk.ids[0], i = k === 'core' ? __nest.NEST.CORE : +k; return [20 + (i % 5) * 184 + 92, 48 + Math.floor(i / 5) * 124 + 62]; });
        if (!pt) { bad.push('과녁 고르기가 열리지 않았다: ' + want); continue; }
        await stageTap(pt[0], pt[1]); staged.push(want);
        if (await has('#hand [data-a="handback"]')) { bad.push('무대를 눌러도 고르지 못했다: ' + want); await tap('#hand [data-a="handback"]'); await tap('#hand [data-a="hand"][data-k="none"]'); continue; }
      }
      cast.push(want); await p.waitForTimeout(330); if (shots < 4) { shots++; await shot('4_fx_' + want); }
    }
    const st = await p.evaluate(() => ({ sp: __nest.G.stats.spells || {}, hands: __nest.G.stats.hands || 0 }));
    console.log('쓴 주문', cast.join(' '), '| 무대에서 고른 것', staged.join(' '), '| 기록', JSON.stringify(st.sp), '| 멈춘 횟수', prompts);
    if (cast.length < 4) bad.push('서로 다른 주문을 넷 이상 쓰지 못했다: ' + cast.length);
    if (!staged.length) bad.push('무대를 눌러 고른 주문이 없다');
    cast.forEach(k => { if (!st.sp[k]) bad.push('기록에 없는 주문: ' + k); });
    await shot('5_after'); await check('after');
  } catch (e) { bad.push('멈춤: ' + e.message.split('\n')[0]); await shot('err'); }
  console.log(tag, bad.length || errs.length ? '실패' : '통과', bad.join(' / '), errs.join(' / '));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})();
