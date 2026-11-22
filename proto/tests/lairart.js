// 둥지 전투 그림 확인: 유닛 시트, 움직임 띠, 연출 시트, 폰 크기 싸움 장면, 옛 그림과 견주기, 움직이는 미리보기 쪽.
//   node tests/lairart.js [units|strips|fx|scene|compare|board|preview|all] [유닛 id, …]
//   그림은 tests/lairart_out/ 에, 미리보기는 tests/lairart_preview.html 에 쓴다.
const pw = require('playwright'), fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src'), OUT = path.join(__dirname, 'lairart_out'); fs.mkdirSync(OUT, { recursive: true });
const mon = fs.readFileSync(path.join(SRC, 'base.js'), 'utf8'), sculpt = mon.slice(mon.indexOf('const _c32'));
const lib = () => sculpt + '\n' + fs.readFileSync(path.join(SRC, 'lairart.js'), 'utf8');
const mode = process.argv[2] || 'all', only = process.argv.slice(3);
const PAGE = body => '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>둥지 전투 그림</title><style>body{margin:0;background:#0d0c18;color:#cfc8d8;font:13px sans-serif}canvas{image-rendering:pixelated}</style></head><body>' + body + '</body></html>';
// 쪽 안에서 도는 그리기 도구
const TOOLS = `
window.SHEET = function (cells, cols, scale, cw, ch, bg) {
  var rows = Math.ceil(cells.length / cols), c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = bg || '#0d0c18'; x.fillRect(0, 0, c.width, c.height);
  cells.forEach(function (q, i) { var ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch; x.fillStyle = q.bg || ((i + Math.floor(i / cols)) % 2 ? '#15131f' : '#1b1826'); x.fillRect(ox, oy, cw, ch);
    if (q.draw) q.draw(x, ox, oy, cw, ch); else { var h = q.boss ? LAIRART.boss(q.id) : LAIRART.unit(q.id, q.star || 1); if (h) h.draw(x, ox + cw / 2, oy + ch - 26, q.anim || 'idle', q.t || 0, { scale: q.scale || scale, flip: q.flip, mad: q.mad }); }
    if (q.label) { x.fillStyle = '#9a94a8'; x.font = '12px sans-serif'; x.fillText(q.label, ox + 6, oy + ch - 8); } });
  return c.toDataURL('image/png'); };
`;
(async () => {
  const b = await pw.chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 900 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.setContent(PAGE('<script>' + lib() + '\n' + TOOLS + '</script>'));
  const save = async (name, expr, arg) => { const url = await p.evaluate(expr, arg); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(url.split(',')[1], 'base64')); console.log('그림', path.join(OUT, name + '.png')); };
  const ids = await p.evaluate(() => ({ kin: LAIRART.ids('kin'), inv: LAIRART.ids('inv'), boss: Object.keys(LAIRART.BOSS), fx: LAIRART.FX ? Object.keys(LAIRART.FX).filter((k, i, a) => a.findIndex(j => LAIRART.FX[j] === LAIRART.FX[k]) === i) : [], rooms: LAIRART.ROOMS ? Object.keys(LAIRART.ROOMS) : [] }));
  const kin = only.length ? ids.kin.filter(k => only.includes(k)) : ids.kin, inv = only.length ? ids.inv.filter(k => only.includes(k)) : ids.inv, want = m => mode === 'all' || mode === m;
  if (want('units')) {
    // 권속: 넷씩 한 장, 별 셋
    for (let i = 0; i < kin.length; i += 4) await save('units_kin' + (i / 4 + 1), a => SHEET([].concat.apply([], a.map(id => [1, 2, 3].map(st => ({ id, star: st, label: id + ' ★' + st, t: 150 })))), 3, 4, 400, 400), kin.slice(i, i + 4));
    for (let i = 0; i < inv.length; i += 6) await save('units_inv' + (i / 6 + 1), a => SHEET(a.map(id => ({ id, star: 1, label: id, t: 150 })), 3, 4, 400, 400), inv.slice(i, i + 6));
    if (!only.length && ids.boss.length) await save('units_boss', a => SHEET(a.map(id => ({ id, boss: true, label: '본체 ' + id, t: 150 })), 3, 4, 460, 460), ids.boss);
  }
  if (want('strips')) {
    // 움직임 띠: 한 줄에 한 유닛. idle 2 · move 1 · attack 3 · cast 2 · hit 1 · die 3 (+ 침입자는 mad 1)
    const cols = [['idle', 0], ['idle', 600], ['move', 130], ['attack', 120], ['attack', 215], ['attack', 300], ['cast', 250], ['cast', 400], ['hit', 30], ['die', 250], ['die', 480], ['die', 700]];
    const strip = async (name, list, star, madToo) => save(name, ([list, cols, star, madToo]) => SHEET([].concat.apply([], list.map(id => cols.map(c => ({ id, star, anim: c[0], t: c[1], label: c[0] + ' ' + c[1] })).concat(madToo ? [{ id, star, anim: 'mad', t: 200, label: 'mad' }] : []))), cols.length + (madToo ? 1 : 0), 2, 150, 170), [list, cols, star, madToo]);
    for (let i = 0; i < kin.length; i += 6) await strip('strip_kin' + (i / 6 + 1), kin.slice(i, i + 6), only.length ? 1 : 2, false);
    for (let i = 0; i < inv.length; i += 6) await strip('strip_inv' + (i / 6 + 1), inv.slice(i, i + 6), 1, true);
  }
  if (want('compare') && ids.kin.length) { await save('small_all', ([k, i, bs]) => SHEET(k.map(id => ({ id, star: 1 })).concat(k.map(id => ({ id, star: 3 })), i.map(id => ({ id, star: 1, flip: true })), bs.map(id => ({ id, boss: true }))), 12, 1, 100, 110, '#15131f'), [ids.kin, ids.inv, ids.boss]);
    await save('seeker', () => SHEET([1, 2, 3].map(st => ({ id: 'seeker', star: st, label: '책을 쫓는 자 단계 ' + st })).concat([1, 2, 3].map(st => ({ id: 'seeker', star: st, mad: true, label: '미침 ' + st }))), 3, 4, 400, 400)); }
  if (want('fx') && ids.fx.length) for (let i = 0; i < ids.fx.length; i += 5) await save('fx' + (i / 5 + 1), names => SHEET([].concat.apply([], names.map(n => [0.12, 0.3, 0.42, 0.55, 0.7, 0.9].map(t => ({ label: n + ' ' + t, draw: (x, ox, oy, cw, ch) => LAIRART.fx(n, x, { x: ox + 56, y: oy + ch - 56 }, { x: ox + cw - 64, y: oy + 96 }, t, { px: 2 }) })))), 6, 1, 200, 230), ids.fx.slice(i, i + 5));
  if (want('board') && ids.rooms.length) { await save('board', () => LAIRART.mockBoard(390, {}).toDataURL('image/png')); await save('rooms', () => SHEET(Object.keys(LAIRART.ROOMS).map(id => ({ label: id + ' ' + LAIRART.ROOMS[id].name, draw: (x, ox, oy) => { for (let k = 0; k < 3; k++) { x.drawImage(LAIRART.tile('nest', k, 4, 64), ox + 8 + k * 128, oy + 8, 128, 128); x.drawImage(LAIRART.room(id, 64, k, 3, 0.3), ox + 8 + k * 128, oy + 8, 128, 128); } } })).concat([{ label: '표식', draw: (x, ox, oy) => ['abyss', 'nebula', 'brood', 'dusk', 'hunger', 'guard', 'hunter', 'caller', 'mother'].forEach((id, n) => x.drawImage(LAIRART.sym(id, 32), ox + 10 + n * 42, oy + 40)) }]), 2, 1, 400, 170)); }
  if (want('scene') && await p.evaluate(() => !!LAIRART.mockScene)) for (const t of [0, 1]) await save('scene' + t, t => LAIRART.mockScene(390, t).toDataURL('image/png'), t);
  if (want('preview')) fs.writeFileSync(path.join(__dirname, 'lairart_preview.html'), PAGE('<div id="v" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px"></div><script>' + lib() + `
(function () { var v = document.getElementById('v'), L = LAIRART, list = [];
  L.ids('kin').forEach(function (id) { [1, 2, 3].forEach(function (s) { list.push({ id: id, star: s }); }); }); L.ids('inv').forEach(function (id) { list.push({ id: id, star: 1 }); }); Object.keys(L.BOSS).forEach(function (id) { list.push({ id: id, boss: true }); });
  var seq = ['idle', 'idle', 'move', 'attack', 'attack', 'cast', 'hit', 'idle', 'die'], cells = list.map(function (q) { var d = document.createElement('div'), c = document.createElement('canvas'); c.width = 240; c.height = 250; c.style.background = '#15131f'; d.appendChild(c); var s = document.createElement('div'); s.textContent = q.id + (q.boss ? ' (본체)' : ' ★' + q.star); s.style.padding = '2px 4px'; d.appendChild(s); v.appendChild(d); return { q: q, x: c.getContext('2d'), h: q.boss ? L.boss(q.id) : L.unit(q.id, q.star) }; });
  var t0 = performance.now(); (function loop() { var t = performance.now() - t0, k = Math.floor(t / 1300) % seq.length, a = seq[k], lt = t % 1300;
    cells.forEach(function (c) { c.x.clearRect(0, 0, 240, 250); c.x.fillStyle = '#6a6478'; c.x.font = '12px sans-serif'; c.x.fillText(a, 6, 14); c.h.draw(c.x, 120, 215, a, lt, { scale: c.q.boss ? 2 : 3, flip: L.DEF[c.q.id] && L.DEF[c.q.id].side === 'inv' }); });
    requestAnimationFrame(loop); })(); })();
</script>`));
  // 옛 그림과 견주기(old)는 옛 판을 내리면서 뺐다. 옛 그림은 src/old/ 에 있고 지은 판에는 없다.
  if (mode === 'old') console.log('옛 그림은 지은 판에서 빠졌다 (src/old/). 견줄 것이 없다.');
  console.log(errs.length ? '오류: ' + errs.join(' | ') : 'no errors', '· 권속', ids.kin.length, '침입자', ids.inv.length, '본체', ids.boss.length, '연출', ids.fx.length, '방', ids.rooms.length);
  await b.close();
})();
