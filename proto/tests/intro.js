// 여는 영상 「그날 밤」: 장면마다 찍고, 글이 잘리거나 넘치지 않는지, 건너뛰기가 되는지, 음악이 이야기 곡으로 바뀌는지 본다
// node tests/intro.js [기기 이름]   찍은 그림은 tests/intro_<기기>/
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../../PLAY-GAME.html'), 'utf8');
const devName = process.argv[2], tag = devName ? devName.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'intro_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(7000);
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  await p.mouse.click(5, 5);
  await p.evaluate(() => { window.__introDone = false; playIntro({ manual: true }).then(() => { window.__introDone = true; }); });
  await p.waitForTimeout(300);
  const n = await p.evaluate(() => window.__intro.shots);
  const fit = () => p.evaluate(() => {
    const o = []; const root = document.getElementById('intro'); if (!root) return ['영상이 없다'];
    const vw = innerWidth, vh = innerHeight;
    root.querySelectorAll('.iline, .iwho, .iskip, .inext').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width && !el.textContent) return; if (r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1) o.push(el.className + ' 화면 밖 ' + Math.round(r.right) + ',' + Math.round(r.bottom)); if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') o.push(el.className + ' 가로로 잘림'); });
    const box = root.querySelector('.itx').getBoundingClientRect(); if (box.bottom > vh + 1) o.push('글상자가 화면 밖');
    const cv = root.querySelector('canvas').getBoundingClientRect(); if (cv.height < 120) o.push('그림이 너무 작다 ' + Math.round(cv.height));
    return o;
  });
  for (let k = 0; k < n; k++) {
    await p.evaluate(k => { window.__intro.go(k); }, k);
    const lines = await p.evaluate(() => window.__intro ? 0 : 0);
    for (const [sec, ln] of [[1.6, 0], [5.5, 1]]) {
      await p.evaluate(([sec, ln]) => { window.__intro.go(window.__intro.shot); for (let q = 0; q < ln; q++) { window.__intro.typeAll(); window.__intro.advance(); } window.__intro.typeAll(); window.__intro.at(sec); }, [sec, ln]);
      await p.waitForTimeout(450);
      const f = await fit(); if (f.length) bad.push('장면 ' + k + ': ' + f.join(', '));
      await p.screenshot({ path: path.join(out, String(k).padStart(2, '0') + '_' + ln + '.png') });
    }
    void lines;
  }
  const mus = await p.evaluate(() => window.__music ? window.__music.want || window.__music.cur : 'none');
  if (mus !== 'story') bad.push('음악이 이야기 곡이 아니다: ' + mus);
  await p.click('#intro .iskip'); await p.waitForTimeout(300);
  const gone = await p.evaluate(() => !document.getElementById('intro') && window.__introDone);
  if (!gone) bad.push('건너뛰기가 안 된다');
  const seen = await p.evaluate(() => __nest.META.introSeen === 1);
  if (!seen) bad.push('본 표시가 남지 않았다');
  console.log(tag, '장면 ' + n + '개', bad.length ? '실패 ' + bad.join(' | ') : '통과', errs.length ? 'errors: ' + errs.join(' | ') : 'no errors');
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})();
