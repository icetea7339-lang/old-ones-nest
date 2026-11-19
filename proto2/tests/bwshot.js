// 새 판 시험 화면: 시작, 방 단추, 허물, 4분, 뚫린 뒤, 성체를 찍고 넘침을 잰다.  node bwshot.js [기기] [씨앗]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-BURROW.html', 'utf8'); const devName = process.argv[2] || '', tag = devName ? 'm' : 'pc', seed = +(process.argv[3] || 3);
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://bw.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://bw.test/'); await p.waitForTimeout(500); const shot = n => p.screenshot({ path: path.join(__dirname, 'bw_' + tag + '_' + n + '.png') });
  await p.evaluate(seed => { __bw.start(seed); }, seed); await shot('intro'); await p.locator('[data-a="close"]').click(); await p.waitForTimeout(300);
  await p.evaluate(() => { __bw.V.paused = true; });
  // 방은 그 권속이 꽉 찼을 때, 덜 지은 것부터 짓는다
  const run = (sec, build) => p.evaluate(([sec, build]) => { const S = __bw.S, B = __bw.B; for (let i = 0; i < sec * 10 && !S.over; i++) { B.tick(S); if (S.molt) return 'molt';
    if (build && i % 20 === 0) { const need = B.unlocked(S).filter(k => { const kin = B.ROOM[k].kin; return B.count(S, kin) >= B.capOf(S, kin) && !S.chambers.some(c => c.kind === k && !c.open); }).sort((a, c) => B.rooms(S, a, true) - B.rooms(S, c, true))[0]; if (need && S.hero.bio >= B.ROOM[need].cost + 12) B.buildRoom(S, need); } } return 'ok'; }, [sec, build]);
  const pickMolt = async () => { await p.waitForTimeout(500); if (await p.locator('[data-a="molt"]').count()) await p.locator('[data-a="molt"]').first().click(); };
  const fit = () => p.evaluate(() => ({ page: document.scrollingElement.scrollHeight - innerHeight, right: Math.round(Math.max(...[...document.querySelectorAll('#bw-ctl *, #bw-hud > *')].map(e => e.getBoundingClientRect().right)) - innerWidth), clip: [...document.querySelectorAll('.bw-room')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map(e => e.textContent), ctlH: Math.round(document.getElementById('bw-ctl').getBoundingClientRect().height), cvH: Math.round(document.getElementById('bw-cv').getBoundingClientRect().height) }));
  for (let k = 0; k < 40 && await p.evaluate(() => __bw.S.hero.bio < 12 || __bw.B.count(__bw.S, 'w') < 4); k++) if (await run(1, false) === 'molt') await pickMolt(); await p.waitForTimeout(300);
  await p.locator('[data-a="open"]').click(); await p.waitForTimeout(150); console.log(tag, '밖으로(이른)', await p.evaluate(() => document.getElementById('bw-log').textContent));
  // 단추를 직접 눌러 본다: 움터는 지어지고, 바로 이어 누른 송곳니 굴은 살이 모자라 거절된다
  await p.locator('[data-a="room"][data-v="w"]').click(); await p.waitForTimeout(200); const afterW = await p.evaluate(() => ({ rooms: __bw.S.chambers.length, bio: Math.round(__bw.S.hero.bio), btn: document.querySelector('[data-a="room"][data-v="w"]').textContent }));
  await p.locator('[data-a="room"][data-v="s"]').click(); await p.waitForTimeout(200); const afterS = await p.evaluate(() => ({ rooms: __bw.S.chambers.length, log: document.getElementById('bw-log').textContent, warn: document.getElementById('bw-log').classList.contains('warn') }));
  console.log(tag, '단추', JSON.stringify(afterW), JSON.stringify(afterS)); await p.evaluate(() => { const S = __bw.S; __bw.V.cx = S.hero.x * 8 + 4; __bw.V.cy = S.hero.y * 8; }); await p.waitForTimeout(200); await shot('t4'); console.log(tag, 't4', JSON.stringify(await fit()));
  let r = await run(45, true); await p.waitForTimeout(400); await shot('t50'); let guard = 0;
  while (r !== 'molt' && guard++ < 12) r = await run(15, true); await p.waitForTimeout(700); await shot('molt'); console.log(tag, 'molt', JSON.stringify(await p.evaluate(() => { const s = document.querySelector('.bw-sheet').getBoundingClientRect(); return { top: Math.round(s.top), bottom: Math.round(innerHeight - s.bottom), opts: [...document.querySelectorAll('.bw-opt')].map(e => e.textContent.trim()) }; }))); await pickMolt();
  for (let k = 0; k < 14; k++) { r = await run(15, true); if (r === 'molt') { if (k > 3) { await p.waitForTimeout(600); await shot('molt2'); } await pickMolt(); } }
  await p.evaluate(() => { __bw.V.z = 2; }); await p.waitForTimeout(500); await shot('t4min'); console.log(tag, 't4min', JSON.stringify(await fit()));
  await p.evaluate(() => { __bw.B.openUp(__bw.S); });
  for (let k = 0; k < 50; k++) { r = await run(15, true); if (r === 'molt') await pickMolt(); if (await p.evaluate(() => __bw.S.foes.length) > 0) { await run(8, true); break; } }
  await p.evaluate(() => { const S = __bw.S, f = S.foes[0]; __bw.V.z = 3; if (f) { __bw.V.cx = f.x * 8; __bw.V.cy = f.y * 8 + 20; } }); await p.waitForTimeout(500); await shot('fight');
  for (let k = 0; k < 12; k++) { r = await run(15, true); if (r === 'molt') await pickMolt(); }
  // 가장 나중에 지은 방을 가까이서
  await p.evaluate(() => { const S = __bw.S, c = S.chambers.filter(q => q.open && q.kind !== 'core' && q.kind !== 'w' && q.kind !== 's').pop() || S.chambers[S.chambers.length - 1]; __bw.V.z = 4; __bw.V.cx = c.x * 8 + 4; __bw.V.cy = c.y * 8; }); await p.waitForTimeout(500); await shot('room');
  await p.evaluate(() => { const S = __bw.S; __bw.V.z = 2; __bw.V.cx = S.hero.x * 8 + 4; __bw.V.cy = S.hero.y * 8 - 30; }); await p.waitForTimeout(500); await shot('nest'); console.log(tag, 'nest', JSON.stringify(await fit()));
  for (let k = 0; k < 60 && await p.evaluate(() => __bw.S.hero.stage) < 4; k++) { r = await run(15, true); if (r === 'molt') await pickMolt(); }
  await p.waitForTimeout(700); await shot('done'); const done = await p.locator('.bw-sheet h2').count() ? await p.locator('.bw-sheet h2').textContent() : '(없음)';
  const ov = await p.evaluate(() => ({ t: Math.round(__bw.S.t), stage: __bw.S.hero.stage, main: __bw.S.hero.main, sub: __bw.S.hero.sub, kin: __bw.S.kin.length, rooms: __bw.S.chambers.length - 1, dug: __bw.S.dug, wave: __bw.S.wave }));
  console.log(tag, '끝 창: ' + done, JSON.stringify(ov), errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
