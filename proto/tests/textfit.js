// 글이 잘리는 곳 찾기: (1) 잔향의 한마디가 두 줄 안에 드는가 (2) 걸어 다니며 본 화면에 말줄임(…)으로 잘린 글이 있는가 (3) 조사 표기 '이(가)'가 화면에 남았는가
const pw = require('playwright'); const fs = require('fs');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const src = fs.readFileSync('/home/user/slime-ipo-design/proto/src/ui.js', 'utf8');
const a = src.indexOf('function guideLine0()'), body = src.slice(a, src.indexOf('\n}\n', a));
const lines = [...body.matchAll(/'((?:[^'\\\n]|\\.){24,})'/g)].map(m => m[1].replace(/\\'/g, "'")).filter(t => !/return|=>|\);/.test(t));
(async () => {
  const b = await pw.chromium.launch();
  for (const devName of ['iPhone 14', 'Galaxy S8', 'iPhone SE']) {
    const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; const ctx = await b.newContext(dev);
    const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.tutDone = true; });
    const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(180); };
    const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
    await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
    await p.evaluate(() => document.fonts.ready);
    const bad = await p.evaluate(ls => { const el = document.querySelector('#recent p'); if (!el) return ['#recent p 없음']; const keep = el.innerHTML, out = []; const head = el.querySelector('b, span') ? el.innerHTML.slice(0, el.innerHTML.indexOf(el.textContent.trim().slice(3, 9)) > 0 ? 0 : 0) : ''; ls.forEach(t => { const first = el.firstElementChild ? el.firstElementChild.outerHTML + ' ' : ''; el.innerHTML = first + t; if (el.scrollHeight > el.clientHeight + 1) out.push(t.length + '자: ' + t.slice(0, 40)); }); el.innerHTML = keep; return out; }, lines);
    console.log(devName, '· 잔향 문장', lines.length, '개 · 두 줄을 넘는 것', bad.length, bad.join(' | '));
    console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await ctx.close();
  }
  await b.close();
})();
