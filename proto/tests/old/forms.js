// 본체의 모든 모습을 한 장에: 징조 5 × 단계 1~4.  node forms.js [이름표] [부징조 고정] [배율]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const tag = process.argv[2] || 'forms', subFix = process.argv[3] || '', Z = +(process.argv[4] || 4);
(async () => {
  const b = await pw.chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const n = await p.evaluate(({ subFix, Z, process_only }) => { const S = __nest.NEST, A = S.ASPECTS; const wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#2a2438;padding:10px;display:grid;grid-template-columns:repeat(5,auto);gap:8px;font:12px sans-serif;color:#ddd';
    let k = 0; const cell = (sl, label) => { const cv = __nest.slimeCanvas(sl, 0), big = document.createElement('canvas'); big.width = cv.width * Z; big.height = cv.height * Z; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(cv, 0, 0, big.width, big.height); const d = document.createElement('div'); d.style.cssText = 'text-align:center;display:flex;flex-direction:column;justify-content:flex-end;align-items:center'; d.appendChild(big); d.insertAdjacentHTML('beforeend', '<div>' + label + '</div>'); wrap.appendChild(d); k++; };
    cell({ stage: 0, main: null, sub: null, muts: [], ess: {} }, '한 방울'); for (let i = 0; i < 4; i++) wrap.appendChild(document.createElement('div'));
    A.filter(a => !process_only || process_only === a).forEach((a, ai) => { for (let st = 1; st <= 4; st++) { const sub = st >= 2 ? (subFix || A[(ai + 1) % 5]) : null; cell({ stage: st, main: a, sub, muts: [], ess: {} }, S.ASP[a] + ' ' + st + (sub ? ' +' + S.ASP[sub] : '')); } wrap.appendChild(document.createElement('div')); });
    document.body.appendChild(wrap); return k; }, { subFix, Z, process_only: process.argv[5] || '' });
  await p.waitForTimeout(200); await p.locator('#sheet').screenshot({ path: path.join(__dirname, tag + '.png') });
  console.log('그림', n, errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
