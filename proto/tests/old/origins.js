// 주인공 여섯이 단계마다 어떻게 보이는지 한 장에
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
(async () => {
  const b = await pw.chromium.launch(), p = await b.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 1 }), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300);
  const data = await p.evaluate(() => {
    const S = __nest.NEST, og = Object.keys(S.ORIGIN), cols = [[null, null, 0], ['abyss', null, 1], ['hunger', 'dusk', 2], ['nebula', 'brood', 3], ['dusk', 'abyss', 4], ['brood', 'hunger', 4]], Z = 5, W = 32 * Z + 12;
    const c = document.createElement('canvas'); c.width = 150 + cols.length * W; c.height = 30 + og.length * (32 * Z + 12); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#212640'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#ece6d6'; x.font = '14px sans-serif'; cols.forEach((cl, k) => x.fillText(cl[2] === 0 ? '처음' : S.ASP[cl[0]] + (cl[1] ? '+' + S.ASP[cl[1]] : '') + ' ' + cl[2] + '단계', 150 + k * W, 18));
    og.forEach((o, r) => { x.fillStyle = '#ece6d6'; x.fillText(S.ORIGIN[o].name, 8, 30 + r * (32 * Z + 12) + 80); cols.forEach((cl, k) => { x.drawImage(__nest.slimeCanvas({ origin: o, main: cl[0], sub: cl[1], stage: cl[2], muts: [] }, 0), 150 + k * W, 26 + r * (32 * Z + 12), 32 * Z, 32 * Z); }); });
    return c.toDataURL('image/png');
  });
  fs.writeFileSync(path.join(__dirname, 'origins.png'), Buffer.from(data.split(',')[1], 'base64'));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
