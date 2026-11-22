// 둥지 전투 그림 확인: 유닛 시트, 움직임 띠, 연출 시트, 폰 크기 싸움 장면, 옛 그림과 견주기, 움직이는 미리보기 쪽.
//   node tests/lairart.js [units|strips|fx|fx2|new|check|scene|compare|board|preview|all] [유닛 id, …]   (new = 새로 그린 것만, check = 새 그림이 모두 탈 없이 그려지는지)
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
    x.save(); x.beginPath(); x.rect(ox, oy, cw, ch); x.clip(); if (q.draw) q.draw(x, ox, oy, cw, ch); else { var h = q.boss ? LAIRART.boss(q.id, q.step) : LAIRART.unit(q.id, q.star || 1); if (h) h.draw(x, ox + cw / 2, oy + ch - 26, q.anim || 'idle', q.t || 0, { scale: q.scale || scale, flip: q.flip, mad: q.mad }); } x.restore();
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
  if (mode === 'fx2') await save('fx_new', names => SHEET([].concat.apply([], names.map(n => [0.08, 0.2, 0.32, 0.44, 0.52, 0.62, 0.74, 0.9].map(t => ({ label: n + ' ' + t, draw: (x, ox, oy, cw, ch) => LAIRART.fx(n, x, { x: ox + 50, y: oy + ch - 50 }, { x: ox + cw - 110, y: oy + 150 }, t, { px: 2, kill: true, w: 230, targets: n === 'rift' ? [[ox + 60, oy + 190], [ox + 150, oy + 210], [ox + 200, oy + 170]] : n === 'sermon' ? [[ox + cw - 150, oy + 170], [ox + cw - 70, oy + 190]] : null }) })))), 8, 1, 260, 260), ['meteor', 'toll', 'ink', 'reap', 'sermon', 'rift', 'rebirth']);
  // 새로 그린 것 (온전한 판): 권속 8 + 큰 새끼 + 다시 그린 셋, 본체의 깨어남 네 단계
  const NEW = ['gulp', 'orbit', 'bell', 'ink', 'hollow', 'preach', 'rift', 'queen'], REDO = ['biter', 'mother', 'spawn', 'brute'], FORMS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
  if (want('new')) { for (let i = 0; i < NEW.length; i += 4) await save('new_kin' + (i / 4 + 1), a => SHEET([].concat.apply([], a.map(id => [1, 2, 3].map(st => ({ id, star: st, label: id + ' ★' + st, t: 150 })))), 3, 4, 400, 400), NEW.slice(i, i + 4));
    await save('new_redo', a => SHEET([].concat.apply([], a.map(id => [1, 2, 3].map(st => ({ id, star: st, label: id + ' ★' + st, t: 150 })))), 3, 4, 400, 400), REDO);
    await save('new_boss', a => SHEET([].concat.apply([], a.map(id => [0, 1, 2, 3].map(step => ({ id, boss: true, step, label: '본체 ' + id + ' ' + step + '단계', t: 150 })))), 4, 3, 440, 440), FORMS);
    const cols = [['idle', 0], ['idle', 600], ['move', 130], ['attack', 120], ['attack', 215], ['attack', 300], ['cast', 150], ['cast', 330], ['cast', 600], ['hit', 30], ['die', 250], ['die', 560]];
    await save('new_strip', ([list, cols]) => SHEET([].concat.apply([], list.map(id => cols.map(c => ({ id, star: 2, anim: c[0], t: c[1], label: c[0] + ' ' + c[1] })))), cols.length, 2, 150, 170), [NEW.concat(REDO), cols]);
    // 옛 권속 12 와 나란히: 수준이 맞는지 본다
    await save('new_vs_old', ([old, nw]) => SHEET(old.map(id => ({ id, star: 2, label: id })).concat(nw.map(id => ({ id, star: 2, label: id + ' (새)' }))), 6, 3, 230, 250), [['shell', 'gazer', 'hood', 'gnaw', 'tangle', 'brood', 'heap', 'mask', 'maw', 'famine', 'biter', 'mother'], NEW.concat(['brute', 'spawn'])]);
    const roles = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 420; c.height = 90; const x = c.getContext('2d'); x.fillStyle = '#15131f'; x.fillRect(0, 0, 420, 90); ['tank', 'melee', 'ranged', 'support', 'dive'].forEach((id, i) => { LAIRART.roleDraw(x, id, 40 + i * 84, 30, 6); LAIRART.roleDraw(x, id, 40 + i * 84, 74, 2); }); return c.toDataURL('image/png'); }); fs.writeFileSync(path.join(OUT, 'new_roles.png'), Buffer.from(roles.split(',')[1], 'base64')); }
  // 검사: 새 id x 별 셋 x 모든 움직임의 모든 프레임, 본체 x 단계 넷, 새 연출. 하나라도 던지면 실패
  if (want('check')) { const bad = await p.evaluate(([NEW, REDO, FORMS]) => { const bad = [], c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d'), run = (h, tag) => { if (!h) { bad.push(tag + ': 없음'); return; } for (const an of Object.keys(LAIRART.ANIM)) for (let k = 0; k < LAIRART.ANIM[an].n; k++) { try { h.draw(x, 150, 250, an, k * LAIRART.ANIM[an].dur / LAIRART.ANIM[an].n + 1, {}); } catch (e) { bad.push(tag + ' ' + an + ' ' + k + ': ' + e.message); return; } } try { h.frame('idle', 0, { mad: true }); h.frame('idle', 0, { flash: true }); } catch (e) { bad.push(tag + ' 덧빛: ' + e.message); } };
      for (const id of NEW.concat(REDO)) for (const st of [1, 2, 3]) run(LAIRART.unit(id, st), id + '★' + st);
      for (const f of FORMS) { for (const st of [undefined, 0, 1, 2, 3]) run(LAIRART.boss(f, st), 'boss ' + f + ':' + st); for (const st of [0, 1, 2, 3]) { const ic = LAIRART.icon('boss:' + f + ':' + st, 1, 48); if (!ic || !ic.width) bad.push('icon boss:' + f + ':' + st); } if (LAIRART.boss(f) !== LAIRART.boss(f, 1)) bad.push(f + ': step 1 이 예전 그림과 다르다'); if (LAIRART.boss(f, 0) !== LAIRART.boss('drop')) bad.push(f + ': step 0 이 drop 이 아니다'); if (LAIRART.boss(f, 3).size <= LAIRART.boss(f, 2).size || LAIRART.boss(f, 2).size <= LAIRART.boss(f, 1).size) bad.push(f + ': 단계가 오를수록 커져야 한다'); }
      for (const id of NEW.concat(['brute'])) { const ic = LAIRART.icon(id, 1, 40); if (!ic || !ic.width) bad.push('icon ' + id); }
      for (const n of ['meteor', 'toll', 'ink', 'reap', 'sermon', 'rift', 'rebirth']) for (let k = 0; k <= 20; k++) { try { if (!LAIRART.fx(n, x, { x: 60, y: 240 }, { x: 200, y: 120 }, k / 20, { px: 2, kill: k % 2 })) bad.push('fx ' + n + ': 없음'); } catch (e) { bad.push('fx ' + n + ' ' + k + ': ' + e.message); break; } }
      for (const id of ['orbit', 'ink', 'rift']) if (!LAIRART.SHOOT[id]) bad.push(id + ': SHOOT 에 없다');
      LAIRART.prewarm(['gulp', 'brood', 'boss:dusk:3'], 1, ['idle']);
      return bad; }, [NEW, REDO, FORMS]); console.log(bad.length ? '검사 실패: ' + bad.join(' | ') : '검사: 새 그림 모두 그려짐'); if (bad.length) process.exitCode = 1; }
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
