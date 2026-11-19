// 합체 그림과 걷는 그림이 새 권속으로도 오류 없이 나오는지
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
(async () => { const b = await pw.chromium.launch(); const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const out = await p.evaluate(() => { const ks = Object.keys(__nest.NEST.KIN), r = []; ks.forEach((k, i) => { const a = __nest.kinCanvas(k, false), e = __nest.kinCanvas(k, true), f = __nest.kinCanvasM({ kind: k, evo: i % 2 === 0, parts: [{ kind: ks[(i + 5) % ks.length] }, { kind: ks[(i + 9) % ks.length], evo: true }] }); let n = 0; const d = a.getContext('2d').getImageData(0, 0, a.width, a.height).data; for (let q = 3; q < d.length; q += 4) if (d[q]) n++; r.push(k + ' ' + a.width + '/' + e.width + '/' + f.width + ' px' + n); }); return r.join(', '); });
  console.log(out); console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close(); })();
