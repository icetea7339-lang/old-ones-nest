// 권속 전부: 기본(16)과 진화(24)를 나란히, 새 이름으로.  node kinsheet2.js [출력 경로]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..'), html = fs.readFileSync(path.join(ROOT, 'PLAY-GAME.html'), 'utf8'), names = JSON.parse(fs.readFileSync(path.join(ROOT, 'kinnames.json'), 'utf8'));
(async () => { const b = await pw.chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1500, height: 1200 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  await p.evaluate(names => { const Z = 5, wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#1d1826;padding:10px;display:grid;grid-template-columns:repeat(6,auto);gap:10px 14px;font:12px sans-serif;color:#ddd';
    const big = cv => { const c = document.createElement('canvas'); c.width = cv.width * Z; c.height = cv.height * Z; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(cv, 0, 0, c.width, c.height); return c; };
    Object.keys(names).filter(k => k !== 'words').forEach(k => { const d = document.createElement('div'); d.style.cssText = 'display:flex;flex-direction:column;align-items:center;background:#2a2236;padding:6px 8px'; const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:flex-end;gap:8px';
      row.appendChild(big(__nest.kinCanvas(k, false))); row.appendChild(big(__nest.kinCanvas(k, true))); d.appendChild(row); d.insertAdjacentHTML('beforeend', '<div style="margin-top:4px">' + names[k].name + ' → ' + names[k].evo + '</div>'); wrap.appendChild(d); });
    document.body.appendChild(wrap); }, names);
  await p.waitForTimeout(200); await p.locator('#sheet').screenshot({ path: process.argv[2] || path.join(ROOT, 'kin_sheet.png') }); console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close(); })();
