// 땅속의 한 방울: 봇으로 여러 판을 돌려 숫자를 재고(bot), 화면을 찍고 넘침·건너뛰기·오류를 본다(shots).
//   node prologue.js bot [판 수]         안 사는 봇 / 싼 것부터 사는 봇 / 계획대로 사는 봇의 70초·120초 비교, 막 하는 봇
//   node prologue.js shots [기기|small]  시작, 돋우는 창, 부위를 단 채 굴이빨 곁, 깊은 것 예고, 결과 창
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..'), html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const mode = process.argv[2] || 'bot', arg = process.argv[3] || '';
// 페이지 안에서 도는 봇. 움직임 good: 큰 것은 피하고 깊은 것의 길에서 비킨다 / careless: 가장 가까운 알갱이만 본다. 사는 법 none | greedy | plan
const BOT = `window.__bot = function (moveKind, buyKind, stopAt) {
  const pr = window.__pro, hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); pr.manual = true; let guard = 0; const snap = {}, home = pr.home;
  const plan = [['mouth', 1], ['eye', 1], ['mouth', 2], ['leg', 1], ['skin', 1], ['leg', 2], ['mouth', 3], ['core', 1], ['skin', 2], ['eye', 2], ['leg', 3], ['core', 2], ['skin', 3], ['core', 3], ['eye', 3]].map(q => [q[0] + '_' + home, q[1]]);
  const sum = o => Object.values(o).reduce((a, c) => a + c, 0), shot = () => ({ wallet: sum(pr.wallet), ess: sum(pr.result.ess), bio: pr.bio, spent: pr.spent, parts: Object.keys(pr.parts).length, lvs: sum(pr.parts), hp: pr.player.hp, size: pr.player.size });
  while (!pr.ended && guard++ < 9000) {
    const P = pr.player, cs = pr.creatures, t = pr.time; let tx = null, ty = null;
    if (!snap[70] && t >= 70) snap[70] = shot(); if (!snap[120] && t >= 120) snap[120] = shot();
    if (stopAt && stopAt(pr)) break;
    if (buyKind === 'greedy') { const worn = pr.parts, slotOf = {}; pr.catalog.forEach(c => { if (worn[c.id]) slotOf[c.slot] = c.id; }); const cand = pr.catalog.filter(c => !pr.why(c.id) && (!slotOf[c.slot] || slotOf[c.slot] === c.id)).sort((a, b) => pr.price(a.id) - pr.price(b.id)); if (cand.length) pr.buy(cand[0].id); }
    if (buyKind === 'plan') { const worn = pr.parts, next = plan.find(q => (worn[q[0]] || 0) === q[1] - 1 && !pr.why(q[0])); if (next) pr.buy(next[0]); }
    if (moveKind === 'good') {
      const sw = cs.find(c => c.kind === 'sweeper');
      if (sw) { const rx = P.x - sw.x, ry = P.y - sw.y, along = rx * sw.dx + ry * sw.dy, side = rx * -sw.dy + ry * sw.dx; if (along > -40 && Math.abs(side) < 70) { const s = side >= 0 ? 1 : -1; tx = P.x + -sw.dy * s * 80; ty = P.y + sw.dx * s * 80; } }
      if (tx === null) { const near = cs.filter(c => c.kind === 'hunter' && c.hostile && hyp(c, P) < 105); if (near.length) { let vx = 0, vy = 0; near.forEach(h => { const d = hyp(h, P) || 1; vx += (P.x - h.x) / d; vy += (P.y - h.y) / d; }); const d = Math.hypot(vx, vy) || 1; tx = P.x + vx / d * 90; ty = P.y + vy / d * 90; } }
    }
    if (tx === null) {
      const bad = moveKind === 'good' ? cs.filter(c => c.kind === 'hunter' && c.hostile) : [], safe = o => !bad.some(h => hyp(h, o) < 95);
      let best = null, bd = 1e9; const see = (o, w) => { const d = hyp(o, P) * w; if (d < bd && safe(o)) { bd = d; best = o; } };
      pr.motes.forEach(m => see(m, 1)); if (moveKind === 'good') { cs.forEach(c => { if (c.kind === 'wriggler') see(c, 0.7); if (c.kind === 'hunter' && !c.hostile) see(c, 0.5); }); pr.beads.forEach(b => see(b, 1.3)); }
      if (best) { tx = best.x; ty = best.y; } else { tx = pr.world.w / 2; ty = pr.world.h / 2; }
    }
    pr.aim(tx, ty); pr.step(4);
  }
  return { t: Math.round(pr.time), ended: pr.ended, stats: pr.stats, snap, at: shot(), parts: pr.parts };
};`;
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (arg === 'small') ctx = await b.newContext({ viewport: { width: 375, height: 620 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else if (mode === 'shots' && arg) { const dev = Object.assign({}, pw.devices[arg]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: mode === 'shots' ? 2 : 1 });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errs.length < 6) errs.push('console: ' + m.text().slice(0, 200)); }); p.setDefaultTimeout(8000);
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400); await p.evaluate(BOT);
  const ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'], sum = o => Object.values(o).reduce((a, c) => a + c, 0);
  if (mode === 'bot') {
    const N = +arg || 10;
    // 120초까지 돌린다(자리를 잡지 않고). 70초와 120초의 주머니·정수·먹은 양을 견준다
    const run = (mv, buy, asp, seed) => p.evaluate(async ([mv, buy, asp, seed]) => { const pm = window.runPrologue({ asp, seed, tut: false }); const s = window.__bot(mv, buy, pr => pr.time >= 121); if (!window.__pro.ended) window.__pro.end('settle'); const go = document.getElementById('pro-go'); if (go) go.click(); const r = await pm; return Object.assign(s, { r, left: !!document.getElementById('pro') }); }, [mv, buy, asp, seed]);
    const table = {};
    for (const buy of ['none', 'greedy', 'plan']) { const rows = [];
      for (let k = 0; k < N; k++) { const asp = ASPS[k % 5], seed = 101 + k * 37, o = await run('good', buy, asp, seed); rows.push(o); const s70 = o.snap[70] || o.at, s120 = o.snap[120] || o.at;
        console.log(buy.padEnd(6), asp.padEnd(7), '씨앗', String(seed).padEnd(4), '| 70초 주머니', String(s70.wallet).padStart(3), '정수', String(s70.ess).padStart(2), '먹음', String(s70.bio).padStart(3), '| 120초 주머니', String(s120.wallet).padStart(3), '정수', String(s120.ess).padStart(2), '먹음', String(s120.bio).padStart(3), '쓴 것', String(s120.spent).padStart(3), '| 끝', o.r.time + '초', '크기', o.r.size, '부위', Object.keys(o.parts).map(id => id.replace('_' + asp, '') + o.parts[id]).join(' ') || '-', '물림', o.stats.hits, '삼킴', o.stats.swallowed, o.r.fell ? '쓰러짐' : '', '새김', o.r.mut || '-', o.left ? '(덮개가 남음!)' : ''); }
      const live = rows.filter(o => o.snap[120]), avg = (f, rs) => (rs.length ? rs.reduce((a, o) => a + f(o), 0) / rs.length : 0).toFixed(1);
      table[buy] = { w70: avg(o => (o.snap[70] || o.at).wallet, rows), e70: avg(o => (o.snap[70] || o.at).ess, rows), b70: avg(o => (o.snap[70] || o.at).bio, rows), w120: avg(o => o.snap[120].wallet, live), e120: avg(o => o.snap[120].ess, live), b120: avg(o => o.snap[120].bio, live), fell: rows.filter(o => o.r.fell).length + '/' + rows.length, hits: avg(o => o.stats.hits, rows) }; }
    console.log('\n사는 법    70초: 주머니 정수 먹음 | 120초: 주머니 정수 먹음 | 쓰러짐 물림');
    for (const k in table) { const t = table[k]; console.log(k.padEnd(8), '      ', t.w70.padStart(5), t.e70.padStart(5), t.b70.padStart(5), ' |       ', t.w120.padStart(5), t.e120.padStart(5), t.b120.padStart(5), ' | ', t.fell, t.hits); }
    // 사람이 할 법한 끝내기: 계획대로 사다가 70초에 자리를 잡는다 / 막 하는 봇(안 피함, 싼 것부터 삼)
    for (const [label, mv, buy, stop] of [['보통(계획대로 사고 70초에 자리)', 'good', 'plan', 70], ['안 사고 70초에 자리', 'good', 'none', 70], ['막 함 · 안 삼(120초까지)', 'careless', 'none', 120], ['막 함 · 싼 것부터 삼(120초까지)', 'careless', 'greedy', 120]]) { const rows = [];
      for (let k = 0; k < N; k++) { const o = await p.evaluate(async ([mv, buy, asp, seed, stop]) => { const pm = window.runPrologue({ asp, seed }); const s = window.__bot(mv, buy, pr => pr.time >= stop); if (!window.__pro.ended) window.__pro.end('settle'); const go = document.getElementById('pro-go'); if (go) go.click(); const r = await pm; return Object.assign(s, { r }); }, [mv, buy, ASPS[k % 5], 501 + k * 53, stop]); rows.push(o); }
      const avg = f => (rows.reduce((a, o) => a + f(o), 0) / rows.length).toFixed(1); console.log(label + ': 끝 ' + avg(o => o.r.time) + '초, 정수 ' + avg(o => sum(o.r.ess)) + ', 부위 ' + avg(o => o.r.parts.length) + '개(단계 합 ' + avg(o => o.r.parts.reduce((a, q) => a + q.lv, 0)) + '), 진액 ' + avg(o => o.r.gold) + ', 크기 ' + avg(o => o.r.size) + ', 쓰러짐 ' + rows.filter(o => o.r.fell).length + '/' + rows.length + ', 새김 ' + rows.filter(o => o.r.mut).length + '/' + rows.length); }
    const skip = await p.evaluate(async () => { const pm = window.runPrologue({ asp: 'brood', seed: 5 }); document.getElementById('pro-skip').click(); const r = await pm; return { r, left: !!document.getElementById('pro'), api: !!window.__pro }; }); console.log('건너뛰기:', JSON.stringify(skip));
    // 사고 갈아 끼우는 규칙
    const rules = await p.evaluate(async () => { const pm = window.runPrologue({ asp: 'abyss', seed: 31 }); const pr = window.__pro; pr.manual = true; const out = {}; out.empty = pr.buy('mouth_abyss'); out.whyEmpty = pr.why('mouth_abyss'); out.lock = pr.why('leg_abyss'); window.__bot('good', 'none', q => q.wallet.abyss >= 12 && q.player.size >= 2); out.buy1 = pr.buy('mouth_abyss'); out.buy2 = pr.buy('mouth_abyss'); out.parts = pr.parts; out.leg = pr.buy('leg_abyss'); out.catalog = pr.catalog.length; out.muts = [...new Set(pr.catalog.map(c => c.mut))].length; out.names = pr.catalog.map(c => c.name).filter(n => n.length > 5); pr.end('skip'); await pm; return out; }); console.log('규칙:', JSON.stringify(rules));
  } else {
    const tag = arg === 'small' ? 's' : arg ? 'm' : 'pc', shot = n => p.screenshot({ path: path.join(ROOT, 'pro_' + tag + '_' + n + '.png') });
    const fit = () => p.evaluate(() => ({ page: document.scrollingElement.scrollHeight - innerHeight, pageW: document.scrollingElement.scrollWidth - innerWidth, hudRight: Math.round(Math.max(...[...document.querySelectorAll('#pro .pro-row > *')].map(e => e.getBoundingClientRect().right)) - innerWidth), skipLeft: Math.round(document.getElementById('pro-skip').getBoundingClientRect().left), rowRight: Math.round(Math.max(...[...document.querySelectorAll('#pro .pro-row > *')].map(e => e.getBoundingClientRect().right))) }));
    const card = () => p.evaluate(() => { const el = document.querySelector('#pro .pro-card'); if (!el) return null; const c = el.getBoundingClientRect(), kids = [...el.querySelectorAll('*')].filter(e => e.offsetParent); return { top: Math.round(c.top), bottom: Math.round(innerHeight - c.bottom), left: Math.round(c.left), right: Math.round(innerWidth - c.right), inner: el.scrollHeight - el.clientHeight, spill: Math.round(Math.max(...kids.map(e => e.getBoundingClientRect().bottom)) - c.bottom), wide: Math.round(Math.max(...kids.map(e => e.getBoundingClientRect().right)) - c.right), page: document.scrollingElement.scrollHeight - innerHeight }; });
    await p.evaluate(() => { window.__pm = window.runPrologue({ asp: 'dusk', seed: 211, tut: true }); window.__pro.manual = true; window.__pro.step(2); }); await p.waitForTimeout(500); await shot('1_start'); console.log(tag, '시작', JSON.stringify(await fit()));
    // 조금 먹고 돋우는 창을 연다: 몇 개는 돋운 채, 아래 자리는 잠긴 채
    await p.evaluate(() => window.__bot('good', 'none', pr => pr.wallet.dusk >= 9 || pr.time > 40)); await p.evaluate(() => { const pr = window.__pro; pr.buy('mouth_dusk'); pr.buy('eye_dusk'); pr.buy('mouth_dusk'); pr.openShop(true); pr.select('eye_dusk'); }); await p.waitForTimeout(400); await shot('2_shop'); console.log(tag, '돋우는 창', JSON.stringify(await card()), await p.evaluate(() => ({ cells: document.querySelectorAll('.pro-cell').length, own: document.querySelectorAll('.pro-cell.own').length, lock: document.querySelectorAll('.pro-cell.lock').length, det: document.querySelector('.pro-det').innerText.replace(/\s+/g, ' ').slice(0, 120) })));
    // 창 안에서 눌러서 산다 / 잠긴 자리를 눌러 본다 / 닫는다
    const tapSel = async s => { const el = p.locator(s).first(); if (arg) await el.tap(); else await el.click(); await p.waitForTimeout(200); };
    await tapSel('.pro-cell[data-id="leg_dusk"]'); console.log(tag, '잠긴 자리:', await p.evaluate(() => document.querySelector('.pro-det').innerText.replace(/\s+/g, ' ').slice(0, 90)), '· 단추 꺼짐', await p.evaluate(() => document.querySelector('[data-x="buy"]').disabled)); await shot('2_shop_locked'); console.log(tag, '잠긴 자리 창', JSON.stringify(await card()));
    await tapSel('.pro-cell[data-id="eye_abyss"]'); await shot('2_shop_swap'); console.log(tag, '갈아 끼우기 안내:', await p.evaluate(() => (document.querySelector('.pro-det .pro-warn') || {}).textContent || '(없음)'), JSON.stringify(await card()));
    await tapSel('[data-x="close"]'); console.log(tag, '닫은 뒤 다시 흐름', await p.evaluate(() => !window.__pro.shopOpen && document.getElementById('pro-shop').hidden));
    // 부위 셋 이상을 단 채 굴이빨 곁으로
    await p.evaluate(() => window.__bot('good', 'plan', pr => Object.keys(pr.parts).length >= 4 || pr.time > 100)); await p.evaluate(() => { const pr = window.__pro, hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); for (let k = 0; k < 900; k++) { const P = pr.player, hs = pr.creatures.filter(c => c.kind === 'hunter' && c.hostile).sort((a, c) => hyp(a, P) - hyp(c, P)); if (!hs.length || hyp(hs[0], P) < 50 || pr.ended) break; pr.aim(hs[0].x, hs[0].y); pr.step(3); } }); await p.waitForTimeout(500); await shot('3_parts_hunter'); console.log(tag, '부위', JSON.stringify(await p.evaluate(() => window.__pro.parts)), JSON.stringify(await fit()));
    await p.evaluate(() => window.__bot('good', 'plan', pr => pr.creatures.some(c => c.kind === 'sweeper') || pr.time > 140)); await p.waitForTimeout(400); await shot('4_warn');
    await p.evaluate(() => { const pr = window.__pro; for (let k = 0; k < 400 && !pr.ended; k++) { const P = pr.player, sw = pr.creatures.find(c => c.kind === 'sweeper'); if (sw && sw.state === 'run' && Math.hypot(sw.x - P.x, sw.y - P.y) < 120) break; if (sw) pr.aim(P.x - sw.dy * 70, P.y + sw.dx * 70); pr.step(1); } }); await p.waitForTimeout(400); await shot('4_sweeper');
    console.log(tag, '자리 잡기는 두 번 눌러야', await p.evaluate(() => { const b = document.getElementById('pro-settle'); b.click(); return { ended: window.__pro.ended, label: b.textContent }; }));
    await p.evaluate(() => { if (!window.__pro.ended) window.__pro.end('settle'); }); await p.waitForTimeout(500); await shot('5_result'); console.log(tag, '결과 창', JSON.stringify(await card()), await p.evaluate(() => document.querySelector('.pro-card').innerText.replace(/\s+/g, ' ').slice(0, 260)));
    const keeps = await p.locator('.pro-keep').count(); if (keeps > 1) { await tapSel('.pro-keep >> nth=' + (keeps - 1)); await shot('5_result_keep'); }
    const res = await p.evaluate(async () => { const picked = (document.querySelector('.pro-keep.on') || {}).dataset; document.getElementById('pro-go').click(); const r = await window.__pm; return { r, picked: picked && picked.keep, left: !!document.getElementById('pro') }; }); console.log(tag, '결과', JSON.stringify(res));
    // 스스로 뜨는 돋우는 창: 처음 살 수 있게 되면 한 번
    await p.evaluate(() => { window.__pm = window.runPrologue({ asp: 'abyss', seed: 9 }); const pr = window.__pro; pr.manual = true; window.__bot('good', 'none', q => q.wallet.abyss >= 3); pr.manual = false; }); await p.waitForTimeout(700); console.log(tag, '처음 살 수 있을 때 스스로 뜸', await p.evaluate(() => window.__pro.shopOpen), JSON.stringify(await card())); await shot('6_auto_shop');
    await tapSel('[data-x="buy"]'); await tapSel('[data-x="close"]'); console.log(tag, '창에서 산 것', JSON.stringify(await p.evaluate(() => window.__pro.parts)));
    // 손가락으로 직접: 화면을 누르면 그쪽으로 간다
    const before = await p.evaluate(() => window.__pro.player), vp = p.viewportSize();
    if (arg) await p.touchscreen.tap(vp.width * 0.8, vp.height * 0.35); else await p.mouse.move(vp.width * 0.8, vp.height * 0.35); await p.waitForTimeout(1500); const after = await p.evaluate(() => window.__pro.player);
    console.log(tag, '누른 쪽으로 움직임', Math.round(after.x - before.x), Math.round(after.y - before.y), after.x > before.x && after.y < before.y ? 'ok' : '안 움직임!');
    await p.evaluate(() => document.getElementById('pro-skip').click()); await p.waitForTimeout(200); console.log(tag, '건너뛴 뒤 덮개', await p.evaluate(() => !!document.getElementById('pro')));
  }
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
