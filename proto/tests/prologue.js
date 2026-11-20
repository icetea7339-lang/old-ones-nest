// 땅속의 한 방울: 봇으로 여러 판을 돌려 숫자를 재고(bot), 화면을 찍고 넘침·건너뛰기·오류를 본다(shots).
//   node prologue.js bot            잘하는 봇과 막 하는 봇의 결과 분포
//   node prologue.js shots [기기]   시작, 첫 분열, 굴이빨, 결과 창
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..'), html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const mode = process.argv[2] || 'bot', devName = process.argv[3] || '';
// 페이지 안에서 도는 봇. good: 큰 것은 피하고 깊은 것의 길에서 비킨다. careless: 가장 가까운 알갱이만 본다
const BOT = `window.__bot = function (kind, stopAt) {
  const pr = window.__pro, hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); pr.manual = true; let guard = 0;
  while (!pr.ended && guard++ < 6000) {
    const P = pr.player, cs = pr.creatures, t = pr.time; let tx = null, ty = null;
    if (stopAt && stopAt(pr)) break;
    if (kind === 'good') {
      const sw = cs.find(c => c.kind === 'sweeper');
      if (sw) { const rx = P.x - sw.x, ry = P.y - sw.y, along = rx * sw.dx + ry * sw.dy, side = rx * -sw.dy + ry * sw.dx; if (along > -40 && Math.abs(side) < 70) { const s = side >= 0 ? 1 : -1; tx = P.x + -sw.dy * s * 80; ty = P.y + sw.dx * s * 80; } }
      if (tx === null) { const near = cs.filter(c => c.kind === 'hunter' && c.hostile && hyp(c, P) < 105); if (near.length) { let vx = 0, vy = 0; near.forEach(h => { const d = hyp(h, P) || 1; vx += (P.x - h.x) / d; vy += (P.y - h.y) / d; }); const d = Math.hypot(vx, vy) || 1; tx = P.x + vx / d * 90; ty = P.y + vy / d * 90; } }
    }
    if (tx === null) {
      const bad = kind === 'good' ? cs.filter(c => c.kind === 'hunter' && c.hostile) : [], safe = o => !bad.some(h => hyp(h, o) < 95);
      let best = null, bd = 1e9; const see = (o, w) => { const d = hyp(o, P) * w; if (d < bd && safe(o)) { bd = d; best = o; } };
      pr.motes.forEach(m => see(m, 1)); if (kind === 'good') { cs.forEach(c => { if (c.kind === 'wriggler') see(c, 0.7); if (c.kind === 'hunter' && !c.hostile) see(c, 0.5); }); pr.beads.forEach(b => see(b, 1.3)); }
      if (best) { tx = best.x; ty = best.y; } else { tx = pr.world.w / 2; ty = pr.world.h / 2; }
    }
    pr.aim(tx, ty); pr.step(4);
    if (kind === 'good' && !stopAt && ((pr.splits >= 2 && t >= 68) || (pr.splits >= 1 && t >= 96) || pr.splits >= 3)) break;
    if (kind === 'careless' && !stopAt && (pr.splits >= 2 || t >= 120)) break;
  }
  return { t: Math.round(pr.time), first: Math.round(pr.firstSplit), splits: pr.splits, ended: pr.ended, stats: pr.stats };
};`;
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: mode === 'shots' ? 2 : 1 });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.setDefaultTimeout(8000);
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400); await p.evaluate(BOT);
  const play = (kind, asp, seed) => p.evaluate(async ([kind, asp, seed]) => { const pm = window.runPrologue({ asp, seed, tut: false }); const s = window.__bot(kind); if (!window.__pro.ended) window.__pro.end('settle'); const go = document.getElementById('pro-go'); if (go) go.click(); const r = await pm; return Object.assign(s, { r, left: !!document.getElementById('pro') }); }, [kind, asp, seed]);
  if (mode === 'bot') {
    const ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'], sum = r => Object.values(r.ess).reduce((a, c) => a + c, 0);
    for (const kind of ['good', 'careless']) { const rows = [];
      for (let k = 0; k < 15; k++) { const o = await play(kind, ASPS[k % 5], 101 + k * 37); rows.push(o); console.log(kind.padEnd(8), ASPS[k % 5].padEnd(7), '씨앗', String(101 + k * 37).padEnd(4), '첫 분열', String(o.first).padStart(3) + '초', '끝', String(o.r.time).padStart(3) + '초', '크기', o.r.size, '정수', String(sum(o.r)).padStart(2), JSON.stringify(o.r.ess), '권속', o.r.kin.join('+') || '-', '진액', o.r.gold, o.r.fell ? '쓰러짐' : '', '물림', o.stats.hits, '잃음', o.stats.lostKin, '삼킴', o.stats.swallowed, o.left ? '(덮개가 남음!)' : ''); }
      const avg = f => (rows.reduce((a, o) => a + f(o), 0) / rows.length).toFixed(1); console.log('  → ' + kind + ' 평균: 첫 분열 ' + avg(o => o.first) + '초, 끝 ' + avg(o => o.r.time) + '초, 정수 ' + avg(o => sum(o.r)) + ', 권속 ' + avg(o => o.r.kin.length) + ', 진액 ' + avg(o => o.r.gold) + ', 쓰러짐 ' + rows.filter(o => o.r.fell).length + '/' + rows.length); }
    // 오래 버티기: 150초까지 가면 어떻게 되나
    const long = await p.evaluate(async () => { const pm = window.runPrologue({ asp: 'dusk', seed: 777 }); const s = window.__bot('good', pr => false); const go = document.getElementById('pro-go'); if (go) go.click(); const r = await pm; return Object.assign(s, { r }); });
    console.log('끝까지 버티기:', JSON.stringify(long));
    const skip = await p.evaluate(async () => { const pm = window.runPrologue({ asp: 'brood', seed: 5 }); document.getElementById('pro-skip').click(); const r = await pm; return { r, left: !!document.getElementById('pro'), api: !!window.__pro }; }); console.log('건너뛰기:', JSON.stringify(skip));
  } else {
    const tag = devName ? 'm' : 'pc', shot = n => p.screenshot({ path: path.join(ROOT, 'pro_' + tag + '_' + n + '.png') });
    const fit = () => p.evaluate(() => ({ page: document.scrollingElement.scrollHeight - innerHeight, pageW: document.scrollingElement.scrollWidth - innerWidth, hudRight: Math.round(Math.max(...[...document.querySelectorAll('#pro .pro-row > *')].map(e => e.getBoundingClientRect().right)) - innerWidth), skipLeft: Math.round(document.getElementById('pro-skip').getBoundingClientRect().left), rowRight: Math.round(Math.max(...[...document.querySelectorAll('#pro .pro-row > *')].map(e => e.getBoundingClientRect().right))) }));
    await p.evaluate(() => { window.__pm = window.runPrologue({ asp: 'dusk', seed: 211, tut: true }); window.__pro.manual = true; window.__pro.step(2); }); await p.waitForTimeout(500); await shot('1_start'); console.log(tag, '시작', JSON.stringify(await fit()));
    await p.evaluate(() => window.__bot('good', pr => pr.splits >= 1)); await p.evaluate(() => window.__pro.step(6)); await p.waitForTimeout(500); await shot('2_split'); console.log(tag, '첫 분열', JSON.stringify(await fit()), '· 자리 잡기 단추', await p.evaluate(() => !document.getElementById('pro-settle').hidden));
    // 굴이빨이 쫓아오는 장면: 가장 가까운 사나운 것 쪽으로 다가간다
    await p.evaluate(() => { const pr = window.__pro, hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); for (let k = 0; k < 900; k++) { const P = pr.player, hs = pr.creatures.filter(c => c.kind === 'hunter' && c.hostile).sort((a, c) => hyp(a, P) - hyp(c, P)); if (!hs.length || hyp(hs[0], P) < 46 || pr.ended) break; pr.aim(hs[0].x, hs[0].y); pr.step(3); } }); await p.waitForTimeout(500); await shot('3_hunter');
    await p.evaluate(() => window.__bot('good', pr => pr.splits >= 2 || pr.time > 110)); await p.evaluate(() => window.__pro.step(8)); await p.waitForTimeout(500); await shot('4_size3');
    await p.evaluate(() => window.__bot('good', pr => pr.creatures.some(c => c.kind === 'sweeper') || pr.time > 140)); await p.waitForTimeout(400); await shot('5_warn');
    await p.evaluate(() => { const pr = window.__pro; for (let k = 0; k < 400 && !pr.ended; k++) { const P = pr.player, sw = pr.creatures.find(c => c.kind === 'sweeper'); if (sw && sw.state === 'run' && Math.hypot(sw.x - P.x, sw.y - P.y) < 120) break; if (sw) pr.aim(P.x - sw.dy * 70, P.y + sw.dx * 70); pr.step(1); } }); await p.waitForTimeout(400); await shot('5_sweeper');
    console.log(tag, '자리 잡기는 두 번 눌러야', await p.evaluate(() => { const b = document.getElementById('pro-settle'); b.click(); return { ended: window.__pro.ended, label: b.textContent }; }));
    await p.evaluate(() => { if (!window.__pro.ended) window.__pro.end('settle'); }); await p.waitForTimeout(500); await shot('6_result');
    const card = await p.evaluate(() => { const c = document.querySelector('.pro-card').getBoundingClientRect(); return { top: Math.round(c.top), bottom: Math.round(innerHeight - c.bottom), left: Math.round(c.left), right: Math.round(innerWidth - c.right), page: document.scrollingElement.scrollHeight - innerHeight, text: document.querySelector('.pro-card').innerText.replace(/\s+/g, ' ').slice(0, 200) }; }); console.log(tag, '결과 창', JSON.stringify(card));
    const res = await p.evaluate(async () => { document.getElementById('pro-go').click(); const r = await window.__pm; return { r, left: !!document.getElementById('pro') }; }); console.log(tag, '결과', JSON.stringify(res));
    // 손가락으로 직접: 화면을 누르면 그쪽으로 간다
    await p.evaluate(() => { window.__pm = window.runPrologue({ asp: 'abyss', seed: 9 }); }); await p.waitForTimeout(300); const before = await p.evaluate(() => window.__pro.player); const vp = p.viewportSize();
    if (devName) await p.touchscreen.tap(vp.width * 0.8, vp.height * 0.3); else { await p.mouse.move(vp.width * 0.8, vp.height * 0.3); } await p.waitForTimeout(1500); const after = await p.evaluate(() => window.__pro.player);
    console.log(tag, '누른 쪽으로 움직임', Math.round(after.x - before.x), Math.round(after.y - before.y), after.x > before.x && after.y < before.y ? 'ok' : '안 움직임!');
    await p.evaluate(() => document.getElementById('pro-skip').click()); await p.waitForTimeout(200);
  }
  console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
