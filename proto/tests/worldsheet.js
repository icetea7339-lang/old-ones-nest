// 네 세계의 침입자 전부: 세계마다 한 줄, 역할마다 한 칸.  node worldsheet.js [배율]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = '/tmp/claude-0/-home-user-old-ones-nest/3f27d994-873b-53a8-8dbc-9e7b2cfe68eb/scratchpad/fc';
const html = fs.readFileSync(ROOT + '/PLAY-GAME.html', 'utf8'), worlds = fs.readFileSync(ROOT + '/worlds.js', 'utf8'), Z = +(process.argv[2] || 4), ONLY = process.argv[3] || '', COLS = +(process.argv[4] || 18);
(async () => { const b = await pw.chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1900, height: 900 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort()); await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  await p.evaluate(([src, Z, ONLY, COLS]) => { const WORLD = new Function(src + '; return WORLD;')(), wrap = document.createElement('div'); wrap.id = 'sheet'; wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#2a2438;padding:10px;display:grid;grid-template-columns:auto repeat(' + COLS + ',auto);gap:8px 6px;font:11px sans-serif;color:#ddd;align-items:end';
    for (const w in WORLD) { if (ONLY && w !== ONLY) continue; wrap.insertAdjacentHTML('beforeend', '<div style="font:14px sans-serif;color:#e8c030;align-self:center">' + WORLD[w].name + '</div>');
      Object.keys(__nest.NEST.INV).forEach((k, n) => { if (n && n % COLS === 0) wrap.insertAdjacentHTML('beforeend', '<div></div>'); const cv = __nest.invCanvasW(w, k), big = document.createElement('canvas'); big.width = cv.width * Z; big.height = cv.height * Z; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(cv, 0, 0, big.width, big.height);
        const d = document.createElement('div'); d.style.cssText = 'text-align:center;display:flex;flex-direction:column;align-items:center'; d.appendChild(big); d.insertAdjacentHTML('beforeend', '<div>' + (WORLD[w].inv[k] || '?? ' + k) + '</div>'); wrap.appendChild(d); }); }
    document.body.appendChild(wrap); }, [worlds, Z, ONLY, COLS]);
  await p.waitForTimeout(200); await p.locator('#sheet').screenshot({ path: ROOT + '/world_' + (ONLY || 'sheet') + '.png' }); console.log(errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close(); })();
