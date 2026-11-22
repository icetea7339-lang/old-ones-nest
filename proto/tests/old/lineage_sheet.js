// 계통 한 장: 줄 = 계통, 칸 = 한 방울, 1, 2, 3, 4.  node lineage_sheet.js [배율] [줄: pure|sub|all] [프레임]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'PLAY-GAME.html'), 'utf8');
const Z = +(process.argv[2] || 3), MODE = process.argv[3] || 'all', FR = +(process.argv[4] || 0), OUT = process.argv[5] || 'lineage_sheet.png';
(async () => {
  const b = await pw.chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 2600 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const n = await p.evaluate(({ Z, MODE, FR }) => { const S = __nest.NEST, A = S.ASPECTS; const wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#221c30;padding:10px;display:grid;grid-template-columns:repeat(5,auto);gap:6px 10px;font:12px sans-serif;color:#ddd';
    let k = 0; const cell = (sl, label) => { const cv = __nest.slimeCanvas(sl, FR), big = document.createElement('canvas'); big.width = cv.width * Z; big.height = cv.height * Z; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(cv, 0, 0, big.width, big.height); const d = document.createElement('div'); d.style.cssText = 'text-align:center;display:flex;flex-direction:column;justify-content:flex-end;align-items:center'; d.appendChild(big); d.insertAdjacentHTML('beforeend', '<div>' + label + '</div>'); wrap.appendChild(d); k++; };
    const row = (a, sub) => { cell({ stage: 0, main: null, sub: null, muts: [], ess: {} }, '한 방울'); for (let st = 1; st <= 4; st++) cell({ stage: st, main: a, sub: st >= 2 ? sub : null, muts: [], ess: {} }, S.ASP[a] + ' ' + st + (st >= 2 && sub ? ' +' + S.ASP[sub] : '')); };
    const ONLY = (MODE.indexOf('only:') === 0) ? MODE.slice(5).split(',') : null; if (ONLY) ONLY.forEach(a => row(a, null)); else if (MODE !== 'sub') A.forEach(a => row(a, null));
    if (MODE === 'all') row('dusk', 'abyss');
    if (MODE === 'sub') A.forEach((a, i) => { row(a, A[(i + 1) % 5]); row(a, A[(i + 3) % 5]); });
    document.body.appendChild(wrap); return k; }, { Z, MODE, FR });
  await p.waitForTimeout(200); await p.locator('#sheet').screenshot({ path: path.join(__dirname, OUT) });
  console.log('그림', n, errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
