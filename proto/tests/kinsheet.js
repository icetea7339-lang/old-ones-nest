// 권속 전부: 기본과 진화를 나란히
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
(async () => { const b = await pw.chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1700, height: 1300 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __nest.NEST, Z = 5, wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#2a2438;padding:8px;display:grid;grid-template-columns:repeat(9,auto);gap:6px;font:11px sans-serif;color:#ddd';
    const cell = (cv, label) => { const big = document.createElement('canvas'); big.width = cv.width * Z; big.height = cv.height * Z; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(cv, 0, 0, big.width, big.height); const d = document.createElement('div'); d.style.cssText = 'text-align:center;display:flex;flex-direction:column;justify-content:flex-end;align-items:center'; d.appendChild(big); d.insertAdjacentHTML('beforeend', '<div>' + label + '</div>'); wrap.appendChild(d); };
    Object.keys(S.KIN).forEach(k => { cell(__nest.kinCanvas(k, false), S.KIN[k].name); });
    Object.keys(S.KIN).forEach(k => { try { cell(__nest.kinCanvas(k, true), S.EVO && S.EVO[k] ? S.EVO[k] : k + ' 진화'); } catch (e) {} });
    document.body.appendChild(wrap); });
  await p.waitForTimeout(200); await p.locator('#sheet').screenshot({ path: path.join(__dirname, (process.argv[2] || 'kinsheet') + '.png') }); console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close(); })();
