// 방 열여덟을 한 판에 다 지어 놓고 낮과 밤에 찍는다. 서로 구분되는지 눈으로 보기 위한 것
// node tests/roomsheet.js [이름표]   찍은 그림은 tests/rooms_<이름표>/
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../../PLAY-GAME.html'), 'utf8');
const tag = process.argv[2] || 'now', out = path.join(__dirname, 'rooms_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; __nest.META.openAll = true; });
  const tap = async s => { await p.locator(s).locator('visible=true').first().click(); await p.waitForTimeout(150); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  await tap('[data-a="new"]'); await tap('[data-a="close"][data-v="go"]'); await p.waitForTimeout(300);
  for (let i = 0; i < 8 && await has('[data-a="sceneskip"]'); i++) await tap('[data-a="sceneskip"]');
  for (let i = 0; i < 6 && await has('#modal [data-a="close"]'); i++) await tap('#modal [data-a="close"]');
  const types = await p.evaluate(() => {
    const G = __nest.G, N = __nest.NEST, T = Object.keys(N.ROOM).filter(k => k !== 'core'); G.sealed = false; G.kin = [];
    let k = 0; G.cells.forEach((c, i) => { c.dug = true; c.soft = false; if (i === G.core) return; if (i === G.ent) { c.type = 'trap'; c.traps = [{ kind: 'spike', lv: 1 }]; return; } const t = T[k++ % T.length]; c.type = t; c.lv = 1; c.traps = t === 'trap' ? [{ kind: 'rock', lv: 1 }] : []; });
    __nest.UI && (__nest.UI.sel = null); __nest.render(); return T;
  });
  await p.evaluate(() => { const s = document.getElementById('right'); if (s) s.style.display = 'none'; });
  for (const mode of ['day', 'night']) {
    await p.evaluate(m => { __nest.ST.mode = m; }, mode);
    for (const ty of types.concat(['core'])) {
      const i = await p.evaluate(ty => __nest.G.cells.findIndex((c, i) => (ty === 'core' ? i === __nest.G.core : c.type === ty && i !== __nest.G.ent)), ty); if (i < 0) continue;
      const c = await p.evaluate(i => __nest.cellAt(i), i); await p.evaluate(c => __nest.aim(c[0], c[1]), c); await p.waitForTimeout(450);
      const box = await p.evaluate(i => { const N = __nest, c = N.cellAt(i), a = N.toClient(c[0] - 92, c[1] - 62), z = N.toClient(c[0] + 92, c[1] + 62); return { x: a[0], y: a[1], width: z[0] - a[0], height: z[1] - a[1] }; }, i);
      await p.screenshot({ path: path.join(out, mode + '_' + ty + '.png'), clip: box });
    }
  }
  console.log(tag, types.length, '종', errs.length ? '오류 ' + errs.slice(0, 3).join(' / ') : 'no errors');
  await b.close();
})();
