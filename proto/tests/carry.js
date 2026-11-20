// 한 방울에서 둥지로 넘어오는 것: 몸에 남은 것, 첫 허물의 기울기, 삼킨 것의 권속, 허물 뒤에도 남는 처음 몸의 자국
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const S = require('../src/logic.js'); let bad = 0; const ok = (c, m) => { console.log((c ? 'ok  ' : 'BAD ') + m); if (!c) bad++; };
{ const pr = S.proResult('abyss', 'great'), G = S.newGame(5, 'abyss', { prologue: pr });
  ok(G.body.length === 5 && S.bodyLv(G, 'mouth') === 3, '몸에 남은 것 다섯, 입 3단계');
  const G0 = S.newGame(5, 'abyss', { prologue: Object.assign({}, pr, { parts: [] }) }); ok(S.slimeStats(G).hp > S.slimeStats(G0).hp && S.slimeStats(G).atk > S.slimeStats(G0).atk && S.corpseCap(G) === S.corpseCap(G0) + 1, '겉·발·속의 효과');
  ok(S.seesDetail(G, 'field') && !S.seesDetail(G0, 'field'), '눈: 처음 며칠 무리의 구성이 보인다');
  ok(G.pro.kinLean.length === 2 && G.pro.kinLean.every(k => S.KIN[k]), '삼킨 것 → 권속 둘: ' + G.pro.kinLean.join(','));
  const G2 = S.newGame(7, 'abyss', { prologue: { ess: { abyss: 6, nebula: 5, brood: 0, dusk: 0, hunger: 0 }, size: 3, gold: 0, parts: [{ id: 'mouth_nebula', slot: 'mouth', asp: 'nebula', lv: 2 }], ate: {} } });
  ok(S.moltOrder(G2)[0] === 'nebula' && S.moltLean(G2).nebula === 4, '첫 허물의 기울기: 정수는 심연이 많아도 성운 부위가 민다');
  const G3 = S.newGame(5, 'abyss', { prologue: Object.assign({}, pr, { skipped: true }) }); ok(!(G3.body || []).length && !G3.pro.kinLean.length, '건너뛰면 몸에 남는 것이 없다');
  const e0 = G.slime.ess.abyss; G.corpses.push({ kind: 'villager' }); S.eat(G); ok(G.slime.ess.abyss >= e0 + 1, '입: 포식하면 정수가 더 붙는다'); }
(async () => { const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8'); const b = await pw.chromium.launch();
  for (const dev of ['', 'iPhone 14']) { let ctx; if (dev) { const d = Object.assign({}, pw.devices[dev]); delete d.defaultBrowserType; ctx = await b.newContext(d); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage(), errs = [], tag = dev ? 'm' : 'pc'; p.on('pageerror', e => errs.push(e.message)); p.setDefaultTimeout(8000);
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__forcePro = true; __nest.META.tutDone = true; });
    const tap = async s => { const e = p.locator(s).locator('visible=true').first(); if (dev) await e.tap(); else await e.click(); await p.waitForTimeout(350); };
    await tap('[data-a="new"]'); await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(600);
    await p.evaluate(() => { const P = window.__pro; if (P.closeIntro) P.closeIntro(); P.manual = true; const S2 = P.sim.S; S2.stage = 4; for (const a in S2.purse) S2.purse[a] = 60; ['mouth_abyss', 'eye_nebula', 'leg_abyss', 'skin_brood', 'core_abyss'].forEach(id => { P.sim.buy(id); P.sim.buy(id); }); S2.stats.byKind = { pack: 5, hunter: 3, mite: 2 }; for (const a in S2.purse) S2.purse[a] = 20; if (P.closeShop) P.closeShop(); P.end('settle'); });
    await p.waitForTimeout(500); await p.getByText('둥지를 튼다').first().click(); await p.waitForTimeout(600);
    for (let i = 0; i < 12 && await p.locator('[data-a="sceneskip"]').locator('visible=true').count(); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(500);
    const card = await p.evaluate(() => { const m = document.getElementById('modal'); return { open: !m.hidden, text: m.innerText.replace(/\s+/g, ' ').slice(0, 260), over: m.querySelector('.sheet') ? m.querySelector('.sheet').scrollHeight - m.querySelector('.sheet').clientHeight : 0, body: __nest.G.body.length, lean: __nest.G.pro.kinLean, mut: __nest.G.pro.mut }; });
    ok(card.open && /함께 온 것/.test(card.text) && card.body === 5 && card.over <= 1, tag + ' 함께 온 것 창: ' + card.text.slice(0, 120) + ' … 넘침 ' + card.over); await p.screenshot({ path: path.join(__dirname, '..', '..', 'carry_' + tag + '_card.png') });
    await tap('#modal [data-a="close"]'); if (await p.locator('#modal [data-a="close"]').locator('visible=true').count()) await tap('#modal [data-a="close"]');
    await tap('[data-a="core"]'); await tap('[data-a="tab"][data-g="core"][data-v="pow"]'); const pow = await p.evaluate(() => ({ t: document.getElementById('view').innerText.replace(/\s+/g, ' ').slice(0, 200), over: document.getElementById('view').scrollHeight - document.getElementById('view').clientHeight })); ok(/몸에 남은 것/.test(pow.t), tag + ' 본체 창 능력 탭: ' + pow.t.slice(0, 90) + ' … 넘침 ' + pow.over); await p.screenshot({ path: path.join(__dirname, '..', '..', 'carry_' + tag + '_hero.png') });
    const mark = await p.evaluate(() => { const G = __nest.G, sl = Object.assign({}, G.slime, { stage: 1, main: 'abyss' }), a = __nest.slimeCanvas(sl, 0), bb = __nest.slimeCanvas(Object.assign({}, sl, { look: '' }), 0); const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, db = bb.getContext('2d').getImageData(0, 0, bb.width, bb.height).data; let n = 0; for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 3] !== db[i + 3]) n++; G.slime.stage = 1; G.slime.main = 'abyss'; return n; });
    ok(mark > 10, tag + ' 허물 뒤에도 처음 몸의 조각이 그려진다 (다른 점 ' + mark + ')'); await p.evaluate(() => { document.querySelector('[data-a="core"]').click(); }); await p.waitForTimeout(400); await p.screenshot({ path: path.join(__dirname, '..', '..', 'carry_' + tag + '_molted.png') });
    console.log(tag, errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); if (errs.length) bad++; await ctx.close(); }
  await b.close(); console.log(bad ? '실패 ' + bad : '모두 통과'); })();
