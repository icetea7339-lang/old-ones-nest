// 화면별로 "잘리는가 / 스크롤해야 하는가"를 잰다. node audit.js [tag]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const tag = process.argv[2] || 'before', only = process.argv[3];
const out = path.join(__dirname, 'audit_' + tag); fs.mkdirSync(out, { recursive: true });
const VPS = [['pc1366', { width: 1366, height: 768 }], ['pc1280', { width: 1280, height: 720 }], ['pc1920', { width: 1920, height: 1080 }], ['s8', 'Galaxy S8'], ['ip14', 'iPhone 14'], ['se', { width: 375, height: 620, mobile: true }]].filter(v => !only || only.split(',').includes(v[0]));
(async () => {
  const b = await pw.chromium.launch(); const table = {};
  for (const [name, vp] of VPS) {
    let ctx; const mobile = typeof vp === 'string' || vp.mobile;
    if (typeof vp === 'string') { const dev = Object.assign({}, pw.devices[vp]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); }
    else if (vp.mobile) ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    else ctx = await b.newContext({ viewport: vp });
    const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(8000); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; __nest.META.clears = 3; });
    const click = s => p.$eval(s, e => e.click());
    const measure = async label => {
      await p.waitForTimeout(260);
      const m = await p.evaluate(() => {
        const vis = e => e && !e.hidden && e.offsetParent !== null, over = e => vis(e) ? Math.max(0, e.scrollHeight - e.clientHeight) : 0;
        const modal = document.getElementById('modal'), view = document.getElementById('view'), night = document.getElementById('night'), left = document.getElementById('left'), tr = document.getElementById('tray');
        const doc = document.scrollingElement; let wide = 0; document.querySelectorAll('#game *, #modal *, #title *').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.width && r.right > innerWidth + 1 && !e.closest('#tray')) wide = Math.max(wide, Math.round(r.right - innerWidth)); });
        const title = document.getElementById('title');
        return { page: Math.max(0, doc.scrollHeight - innerHeight), view: over(view), modal: modal && !modal.hidden ? Math.max(0, modal.scrollHeight - modal.clientHeight) + over(modal.querySelector('.mbody')) + over(modal.querySelector('.sheet')) : 0, night: over(night), left: over(left), tray: tr && vis(tr) ? Math.max(0, tr.scrollWidth - tr.clientWidth) : 0, wide, vh: innerHeight };
      });
      (table[label] = table[label] || {})[name] = m; await p.screenshot({ path: path.join(out, name + '_' + label + '.png') });
    };
    const closeM = async () => { for (let i = 0; i < 4; i++) { const c = await p.$('#modal:not([hidden]) [data-a="close"]'); if (!c) break; await c.evaluate(e => e.click()); await p.waitForTimeout(120); } };
    const cellXY = i => p.evaluate(i => { const b = document.getElementById('stage').getBoundingClientRect(), u = b.height / 550, S = __nest.ST; return [b.left + (20 + (i % 5) * 184 + 92 - S.cam.x + S.ox) * u, b.top + (48 + Math.floor(i / 5) * 124 + 62) * u]; }, i);
    const sel = async (t, i) => { await p.evaluate(([t, i]) => { const el = document.createElement('button'); el.dataset.a = 'sel'; el.dataset.t = t; el.dataset.i = i; el.hidden = true; document.getElementById('game').appendChild(el); el.click(); el.remove(); }, [t, i]); };
    try {
      await measure('01title');
      await click('[data-a="new"]'); await measure('02setup');
      await click('[data-a="close"][data-v="go"]'); await click('[data-a="sceneskip"]'); await p.waitForTimeout(200); await measure('03applicants'); await closeM();
      await p.evaluate(() => {
        const G = __nest.G, S = __nest.NEST; G.gold = 99999; G.ap = 99; G.day = 18;
        S.build(G, 1, 'hall'); S.build(G, 6, 'trap'); S.build(G, 7, 'ambush'); S.build(G, 12, 'hall'); S.dig(G, 14); S.dig(G, 19); S.dig(G, 8); S.build(G, 14, 'prison'); S.build(G, 19, 'chapel');
        S.addTrap(G, 6, 'spike'); S.addTrap(G, 6, 'mist'); S.addTrap(G, 7, 'rock');
        const kinds = ['goblin', 'skeleton', 'cultist', 'scale', 'scribe', 'mask', 'hunger', 'netter', 'spitter', 'tangle', 'licker', 'warden'], locs = [1, 1, 1, 12, 12, 12, 7, 7, 'core', 'core', null, null];
        kinds.forEach((k, n) => G.kin.push({ id: G.nextId++, name: ['가르', '무쿠', '솔', '테브', '니아', '오르', '핀', '라그', '위스', '도른', '케이', '벨'][n], kind: k, lv: 3 + n % 5, exp: 3, loc: locs[n], hurt: n === 4 ? 2 : 0, skill: n % 3, age: 6, unpaid: 0, evo: n % 4 === 0, stance: 'hold' }));
        for (let n = 0; n < 3; n++) G.prison.push({ kind: ['villager', 'militia', 'fisher'][n], vill: 'field' }); for (let n = 0; n < 7; n++) G.corpses.push({ kind: 'militia' });
        G.slime.stage = 2; G.slime.main = 'abyss'; G.slime.sub = 'hunger'; G.slime.ess = { abyss: 120, nebula: 20, brood: 35, dusk: 12, hunger: 80 }; G.slime.muts = Object.keys(S.MUT).slice(0, 4); G.slime.hp = S.slimeStats(G).hp * 0.7;
        G.omen = { id: 'tide', tier: 'mixed' }; G.eld.favor = 1; G.fear = 70; G.faith = 14; G.vill.field.trust = 3; G.vill.bell.host = 30; G.gold = 4321; G.ap = 2; G.d.buildOps = 0;
      });
      await sel('cell', 13); await p.waitForTimeout(100); await sel('cell', 13);
      await p.evaluate(() => { __nest.ST.cam.tx = 0; }); await click('#viewsw [data-v="under"]');
      await p.evaluate(() => { const e = document.querySelector('#sheetclose'); if (e && e.offsetParent) e.click(); });
      await measure('04cell_empty');
      await sel('cell', 1); await measure('05cell_hall');
      await sel('cell', 6); await measure('06cell_trap');
      await sel('cell', 14); await measure('07cell_prison');
      await sel('cell', 9); await measure('08cell_rock');
      await click('#corebtn'); await measure('09core'); if (mobile) { await p.evaluate(() => { const e = document.querySelector('#sheetclose'); if (e && e.offsetParent) e.click(); }); await measure('09core_closed'); }
      await p.keyboard.press('Escape'); await p.evaluate(() => { const e = document.createElement('button'); e.dataset.a = 'view'; e.dataset.v = 'under'; document.getElementById('game').appendChild(e); e.click(); e.remove(); });
      await p.evaluate(() => { const G = __nest.G; });
      // 아무것도 고르지 않은 화면
      await p.evaluate(() => { const e = document.createElement('button'); e.dataset.a = 'view'; e.dataset.v = 'surface'; document.getElementById('game').appendChild(e); e.click(); e.remove(); }); await p.waitForTimeout(400);
      await measure('10overview_surface');
      { const vp2 = await p.evaluate(() => { const b = document.getElementById('stage').getBoundingClientRect(), u = b.height / 550, S = __nest.ST; S.cam.tx = S.cam.x = Math.max(0, Math.min(960 - S.viewW, 258 - S.viewW / 2)); return [b.left + (258 - S.cam.x + S.ox) * u, b.top + 160 * u]; }); await p.waitForTimeout(150); if (mobile) await p.touchscreen.tap(vp2[0], vp2[1]); else await p.mouse.click(vp2[0], vp2[1]); }
      await measure('11village');
      for (const k of ['roster', 'applicants', 'captives', 'elder']) { const el = await p.$(`[data-a="open"][data-v="${k}"]`); if (!el) continue; await el.evaluate(e => e.click()); await measure('12m_' + k); if (k === 'roster') { const u = await p.$('#modal [data-a="kin"]'); if (u) { await u.evaluate(e => e.click()); await measure('12m_kin'); } } await closeM(); }
      for (const k of ['help', 'settings']) { const el = await p.$(`[data-a="${k}"]`); if (el) { await el.evaluate(e => e.click()); await measure('13m_' + k); await closeM(); } }
      // 밤
      await p.evaluate(() => { const G = __nest.G; G.march.tonight = { vill: 'fort', settle: false }; G.guest = null; G.event = null; __nest.META.pause = 'always'; });
      await click('[data-a="endday"]'); await p.waitForTimeout(150); if (await p.$('#foot .warnc')) await click('[data-a="endday"]');
      for (let i = 0; i < 200; i++) { await p.waitForTimeout(80); if (await p.evaluate(() => !document.getElementById('hand').hidden)) break; if (i === 25) await p.evaluate(() => { __nest.ST.speed = 6; }); }
      await measure('14night_hand');
      for (let i = 0; i < 300; i++) { await p.waitForTimeout(60); await p.evaluate(() => { __nest.ST.skip = true; const h = document.querySelector('#hand:not([hidden]) [data-a="hand"][data-k="none"]'); if (h) h.click(); }); if (await p.$('#modal:not([hidden])')) break; }
      await measure('15settle');
    } catch (e) { errs.push('script: ' + e.message.split('\n')[0]); }
    if (errs.length) console.log(name, '오류:', errs.join(' / '));
    await ctx.close();
  }
  const names = VPS.map(v => v[0]);
  console.log('화면'.padEnd(22) + names.map(n => n.padStart(16)).join(''));
  for (const label of Object.keys(table).sort()) console.log(label.padEnd(22) + names.map(n => { const m = table[label][n]; if (!m) return '-'.padStart(16); const s = [m.page ? 'P' + m.page : '', m.view ? 'v' + m.view : '', m.modal ? 'm' + m.modal : '', m.night ? 'n' + m.night : '', m.left ? 'L' + m.left : '', m.wide ? 'W' + m.wide : ''].filter(Boolean).join(' '); return (s || 'ok').padStart(16); }).join(''));
  fs.writeFileSync(path.join(out, 'table.json'), JSON.stringify(table));
  await b.close();
})();
