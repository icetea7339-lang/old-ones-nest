// 처음 받는 몸 열다섯: 한 장에 모아 본다.  node tests/seedsheet.js [배율=3]
//   몸마다 그림 둘(0번과 2번 프레임), 이름, 타고난 것 한 줄. 부위를 얹은 모습(등불·톱니입·덮침발)도 한 줄 아래에 붙인다.
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const SEEDS = require('../src/seeds.js');
const ROOT = path.join(__dirname, '..', '..'), html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8'), Z = +(process.argv[2] || 3);
(async () => {
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1 }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300);
  // 부위를 얹은 모습은 실제 판에서 얻는다: 몸을 정해 시작하고, 부위를 쥐여 주고, 그 판의 덧그림을 그대로 쓴다
  const worn = {};
  for (const id of Object.keys(SEEDS)) worn[id] = await p.evaluate(async id => {
    if (window.__pro) window.__pro.end('skip'); runPrologue({ asp: 'abyss', seed: 3, look: id }); __pro.manual = true; const s = __pro.sim, S = s.S; S.stage = 3; S.worn = { mouth: { id: 'mouth_hunger', lv: 2 }, eye: { id: 'eye_abyss', lv: 2 }, leg: { id: 'leg_hunger', lv: 2 }, skin: { id: 'skin_nebula', lv: 2 } };
    s.P.x = 0; s.P.y = 0; s.P.inv = 0; S.cap = null; S.cre.forEach(c => { c.alive = false; }); S.food.forEach(f => { f.alive = false; }); __pro.step(1); await new Promise(r => setTimeout(r, 120));
    const cv = document.querySelector('#pro canvas'), w = cv.width, h = cv.height, c = document.createElement('canvas'); c.width = 150; c.height = 150; c.getContext('2d').drawImage(cv, w / 2 - 75, h / 2 - 105, 150, 150, 0, 0, 150, 150); const out = c.toDataURL(); __pro.end('skip'); return out; }, id);
  const out = await p.evaluate(([SEEDS, Z, worn]) => {
    const ids = Object.keys(SEEDS), url = (id, fr) => __nest.slimeCanvas({ origin: 'drop', stage: 0, main: null, sub: null, muts: [], ess: {}, look: id }, fr).toDataURL();
    const el = document.createElement('div'); el.id = 'sheet'; el.style.cssText = 'position:fixed;left:0;top:0;z-index:99;width:1300px;background:#0d0a12;color:#ece6d6;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:10px;font-family:var(--body,sans-serif);font-size:13px;line-height:1.35';
    el.innerHTML = ids.map(id => `<div style="background:radial-gradient(circle at 50% 40%, #2a2236, #120e1a 70%);padding:8px;display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center"><div><img src="${url(id, 0)}" width="${32 * Z}" height="${32 * Z}" style="image-rendering:pixelated"><img src="${url(id, 2)}" width="${32 * Z}" height="${32 * Z}" style="image-rendering:pixelated"><img src="${worn[id]}" width="100" height="100" style="image-rendering:pixelated"></div><b style="font-family:var(--display,sans-serif);font-weight:400;font-size:16px">${SEEDS[id].name} <small style="color:#a59cb4;font-family:var(--body,sans-serif);font-size:11px">${id}</small></b><span style="color:#cfc6dc">${SEEDS[id].say}</span></div>`).join('');
    document.body.appendChild(el); return ids.length;
  }, [SEEDS, Z, worn]);
  await p.waitForTimeout(300); await p.locator('#sheet').screenshot({ path: path.join(ROOT, 'seed_sheet.png') });
  console.log('몸', out, '개 ·', errs.length ? '오류: ' + errs.join(' / ') : 'no errors'); await b.close();
})();
