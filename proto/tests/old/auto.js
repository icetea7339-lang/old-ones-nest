// 맡김 방식으로 한 판을 끝까지: 아침마다 교시를 고르고, 나머지는 권속들이 한다.  node auto.js [기기] [며칠까지]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2] || '', upto = +(process.argv[3] || 40), tag = devName ? devName.replace(/\s+/g, '') : 'pc';
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(), errs = [], over = []; p.setDefaultTimeout(8000); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(160); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const shot = n => p.screenshot({ path: path.join(__dirname, 'auto_' + tag + '_' + n + '.png') });
  const check = async label => { const r = await p.evaluate(() => { const vis = e => e && !e.hidden && e.offsetParent !== null, o = e => vis(e) ? Math.max(0, e.scrollHeight - e.clientHeight) : 0, out = []; if (document.scrollingElement.scrollHeight > innerHeight + 1) out.push('페이지'); [['#modal .mbody', '창'], ['#view', '패널'], ['#left', '왼쪽']].forEach(([s, n]) => { const v = o(document.querySelector(s)); if (v > 2) out.push(n + ' ' + v); }); let cut = 0; document.querySelectorAll('#mnav button, #foot button, #modal button').forEach(e => { if (!vis(e)) return; const q = e.getBoundingClientRect(); if (q.right > innerWidth + 1 || q.bottom > innerHeight + 1 || q.left < -1) cut++; }); if (cut) out.push('잘린 단추 ' + cut); return out; }); if (r.length) over.push(label + ': ' + r.join(', ')); };
  await click('[data-a="new"]'); await click('[data-a="tab"][data-g="setup"][data-v="rule"]'); await check('setup_rule'); await shot('setup');
  console.log('맡김이 기본으로 켜져 있나:', await p.evaluate(() => document.querySelector('[data-a="setup"][data-k="auto"][data-v="1"]').className.includes('on')));
  await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300);
  for (let i = 0; i < 12 && await has('[data-a="sceneskip"]'); i++) await click('[data-a="sceneskip"]');
  await p.evaluate(() => { __nest.AUTO.speed = 4; __nest.META.pause = 'never'; });
  let lastDay = 0, edicts = {}, shots = 0; const t0 = Date.now();
  for (let i = 0; i < 4000; i++) {
    const st = await p.evaluate(() => { const G = __nest.G; return G ? { day: G.day, over: !!G.over, kin: G.kin.length, gold: Math.round(G.gold), stage: G.slime.stage, gods: G.gods, mode: __nest.ST.mode } : null; });
    if (!st) break; if (st.day > upto) break;
    const head = await p.$eval('#modal h2', e => e.textContent).catch(() => '');
    if (head.includes('아침')) { if (st.day !== lastDay) { lastDay = st.day; if ([1, 2, 9, 20].includes(st.day)) { await check('edict_' + st.day); await shot('edict_' + st.day); } }
      const ids = await p.$$eval('#modal [data-a="close"][data-v]', es => es.map(e => e.dataset.v)); const pick = ids[st.day % ids.length]; edicts[pick] = (edicts[pick] || 0) + 1; await click(`#modal [data-a="close"][data-v="${pick}"]`); await p.waitForTimeout(250); if ([1, 9].includes(st.day)) { await p.waitForTimeout(1200); await check('day_' + st.day); await shot('day_' + st.day); } continue; }
    if (await has('[data-a="sceneskip"]')) { await click('[data-a="sceneskip"]'); continue; }
    if (await has('#modal [data-a="event"]:not([disabled])')) { await click('#modal [data-a="event"]:not([disabled])'); continue; }
    if (/깨어났다|돌아갔다|명부/.test(head)) { await shot('end'); break; }
    if (await has('#modal [data-a="close"]')) { if (shots++ < 2) await shot('modal' + shots); await click('#modal [data-a="close"]'); continue; }
    await p.evaluate(() => { __nest.ST.skip = true; }); await p.waitForTimeout(120);
  }
  const fin = await p.evaluate(() => { const G = __nest.G; return G ? { day: G.day, over: G.over, kin: G.kin.length, bred: G.stats.bred || 0, preached: G.stats.preached || 0, gifts: G.stats.gifts || 0, banes: G.stats.banes || 0, gods: G.gods, form: __nest.NEST.formName(G), ess: __nest.NEST.essTotal(G), eats: G.stats.eats || 0, kills: G.stats.kills, dug: G.cells.filter(c => c.dug).length } : 'G 없음'; });
  console.log(tag, Math.round((Date.now() - t0) / 1000) + '초 ·', JSON.stringify(fin)); console.log('고른 교시:', JSON.stringify(edicts));
  console.log(over.length ? '넘침: ' + over.join(' / ') : '넘침 없음', '·', errs.length ? '오류: ' + errs.slice(0, 4).join(' / ') : 'no errors'); await b.close();
})();
