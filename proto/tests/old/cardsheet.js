// 카드 앞면 견본: 시작 덱 카드와 드묾/옛것급 몇 장, 다시 쓴 카드. node tests/cardsheet.js
const pw = require('playwright'), fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8'), out = path.join(__dirname, 'cardsheet');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await pw.chromium.launch(), errs = [];
  for (const [w, h, tag, mini] of [[1100, 900, 'big', false], [390, 844, 'mini', true]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    await p.goto('http://nest.test/'); await p.waitForTimeout(400);
    await p.evaluate(mini => {
      const C = CARDS2, K = window.__card, ids = []; C.LIST.filter(c => c.rar === 'r').slice(0, 4).forEach(c => ids.push(c.id)); C.LIST.filter(c => c.rar === 'u' && c.type === 'trap').slice(0, 3).forEach(c => ids.push(c.id));
      ['brood', 'abyss', 'dusk'].forEach(a => C.START[a].forEach(id => { if (!ids.includes(id)) ids.push(id); }));
      C.LIST.filter(c => c.type === 'curse').slice(0, 1).forEach(c => ids.push(c.id)); C.LIST.filter(c => c.type === 'boon').slice(0, 1).forEach(c => ids.push(c.id));
      const genes = C.LIST.filter(c => c.type === 'trap').slice(0, 2).map(c => Object.assign(K.dview(c.id), { gene: ['spore'] }));
      const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#14172a;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;overflow:auto';
      d.innerHTML = ids.slice(0, 26).map(id => K.face(K.dview(id), { cls: mini ? 'mini' : '' })).join('') + genes.map(v => K.face(v, { cls: mini ? 'mini' : '' })).join('');
      document.body.appendChild(d);
    }, mini);
    await p.waitForTimeout(300); await p.screenshot({ path: path.join(out, tag + '.png'), fullPage: false });
  }
  await b.close(); console.log(errs.length ? errs.join('\n') : 'no errors');
})();
