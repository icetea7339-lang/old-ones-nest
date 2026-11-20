// 배경 음악: 화면마다 곡이 바뀌는지, 곡마다 소리가 나되 넘치지 않는지 본다 (들을 수는 없으니 숫자로)
// node music.js [기기 이름]
const pw = require('playwright'); const fs = require('fs');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc';
(async () => {
  const b = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const touch = !!devName, p = await ctx.newPage(), errs = [], bad = [], seen = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; });
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(140); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  const cur = () => p.evaluate(() => __music.cur);
  const expect = async (want, label) => { let c = null; for (let i = 0; i < 20; i++) { c = await cur(); if (c === want) break; await p.waitForTimeout(100); } seen.push(label + ':' + c); if (c !== want) bad.push(label + ' 에서 ' + want + ' 이어야 하는데 ' + c); };
  try {
    // 처음 누르기 전에는 소리가 깨지 않는다
    if (await p.evaluate(() => __music.armed)) bad.push('누르기도 전에 오디오가 깨어났다');
    if (await p.evaluate(() => __music.want) !== 'title') bad.push('제목 화면이 title 을 부르지 않았다');
    await tap('#trec'); await expect('title', '제목');
    await tap('[data-a="new"]'); await tap('[data-a="tab"][data-g="setup"][data-v="rule"]'); if (await has('[data-a="setup"][data-k="tut"].on')) await tap('[data-a="setup"][data-k="tut"]');
    await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(400);
    if (await has('[data-a="sceneskip"]')) await expect('story', '첫 장면');
    for (let i = 0; i < 6 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]'); await p.waitForTimeout(300);
    for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; }
    await expect('day', '낮');
    // 밤: 무리를 하나 보내고 하루를 넘긴다
    await p.evaluate(() => { const G = __nest.G; G.sealed = false; G.march.tonight = { vill: 'field', settle: true }; G.event = null; G.guest = null; __nest.META.pause = 'never'; });
    await tap('[data-a="endday"]'); await p.waitForTimeout(200); if (await has('[data-a="endday"]')) await tap('[data-a="endday"]');
    await expect('night', '밤');
    // 설정에서 끄면 멈추고, 켜면 다시 튼다
    await p.evaluate(() => { __nest.ST.skip = true; }); for (let i = 0; i < 60 && await p.evaluate(() => __nest.ST.mode === 'night'); i++) { await p.waitForTimeout(250); for (const s of ['#modal [data-a="close"]', '[data-a="sceneskip"]']) if (await has(s)) await tap(s); }
    await expect('day', '밤 뒤의 낮');
    for (let i = 0; i < 8; i++) { let hit = false; for (const s of ['#modal [data-a="event"]:not([disabled])', '#modal [data-a="close"]', '[data-a="sceneskip"]']) if (await has(s)) { await tap(s); hit = true; break; } if (!hit) break; }
    await p.evaluate(() => { const m = document.querySelector('#modal'); return m && !m.hidden ? m.innerText.slice(0, 80) : ''; }).then(t => { if (t) seen.push('창: ' + t.replace(/\n/g, ' ')); });
    if (!(await has('[data-a="settings"]'))) await tap('[data-a="menu"]'); await tap('[data-a="settings"]'); await tap('[data-a="set"][data-k="music"][data-v="0"]'); await p.waitForTimeout(200);
    if (await cur() !== null) bad.push('음악을 꺼도 멈추지 않는다'); if (await p.evaluate(() => __music.want) !== 'day') bad.push('끄면서 틀 곡을 잊었다');
    await tap('[data-a="set"][data-k="music"][data-v="1"]'); await expect('day', '다시 켬'); await tap('#modal [data-a="close"]');
    // 곡마다 소리를 그려 본다
    const res = await p.evaluate(async () => { const o = {}; for (const n of __music.tracks) o[n] = await __music.render(n, n === 'win' || n === 'lose' ? 5 : 8); return o; });
    for (const n in res) { const r = res[n]; seen.push(n + ' 최고 ' + r.peak.toFixed(2) + ' 평균 ' + r.rms.toFixed(3)); if (r.rms < 0.004) bad.push(n + ' 이(가) 너무 조용하다'); if (r.peak >= 0.9) bad.push(n + ' 이(가) 넘친다 ' + r.peak.toFixed(2)); }
  } catch (e) { bad.push('멈춤: ' + e.message.split('\n')[0]); }
  console.log(seen.join(' | '));
  console.log(tag, bad.length || errs.length ? '실패 ' + bad.concat(errs).join(' / ') : '통과');
  await b.close();
})();
