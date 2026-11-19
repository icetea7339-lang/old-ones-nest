// 전/후 그림 두 장을 나란히 붙인다.  node compare.js 앞.png 뒤.png 결과.png [높이]
const pw = require('playwright'); const fs = require('fs');
const [a, b, out, hh] = process.argv.slice(2), h = +(hh || 900);
const uri = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
(async () => { const br = await pw.chromium.launch(); const p = await br.newPage({ deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:#0b0c16;font:700 22px sans-serif;color:#ece6d6"><div id="w" style="display:inline-flex;gap:18px;padding:18px"><figure style="margin:0"><figcaption style="padding:0 0 8px;color:#a2a8c6">전</figcaption><img src="${uri(a)}" style="height:${h}px;display:block"></figure><figure style="margin:0"><figcaption style="padding:0 0 8px;color:#e8c030">후</figcaption><img src="${uri(b)}" style="height:${h}px;display:block"></figure></div></body>`);
  await p.waitForTimeout(300); await p.locator('#w').screenshot({ path: out }); await br.close(); })();
