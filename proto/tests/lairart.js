// 둥지 전투 그림 확인: 유닛 시트, 움직임 띠, 연출 시트, 폰 크기 싸움 장면, 옛 그림과 견주기, 움직이는 미리보기 쪽.
//   node tests/lairart.js [units|strips|fx|fx2|new|maze|story|check|scene|compare|board|preview|all] [유닛 id, …]   (new = 새로 그린 것만, check = 새 그림이 모두 탈 없이 그려지는지)
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
  // 굴 짓기의 지도 (maze): 5x8 지도 하나를 꾸며 폰 폭(390)과 큰 칸(96)으로, 알의 금 0~4, 함정 넷, 일행 표식
  const MAZE_MAP = `(() => { window.MAZEMAP = function (S, t) { var L = LAIRART, G = ['##.##', '#R.s#', '#l#R#', '#.#m#', '#p.w#', '##Ri#', '##C##', '##E##'], R = 8, C = 5, top = Math.round(S * 0.9), c = document.createElement('canvas'); c.width = S * C; c.height = top + S * R + Math.round(S * 0.3); var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#050407'; x.fillRect(0, 0, c.width, c.height);
    var at = function (r, cc) { return r >= 0 && r < R && cc >= 0 && cc < C ? G[r][cc] : (r === -1 && cc === 2 ? '.' : '#'); }, rock = function (ch) { return ch === '#'; }, TR = { p: 'pit', w: 'whisper', s: 'slime', o: 'spore', l: 'tr_lure', m: 'maw', i: 'mirror' }, RM = { '1,1': 'nursery', '2,3': 'bone', '5,2': 'eye' };
    x.drawImage(L.mazeEntrance(S, C), 0, 0);
    for (var r = 0; r < R; r++) for (var cc = 0; cc < C; cc++) { var ch = G[r][cc], X = cc * S, Y = top + r * S, nb = [at(r - 1, cc), at(r, cc + 1), at(r + 1, cc), at(r, cc - 1)], seed = r * 7 + cc * 3, v = 0, m = 0;
      nb.forEach(function (q, k) { if (rock(q)) v |= 1 << k; else m |= 1 << k; });
      if (rock(ch)) { x.drawImage(L.mazeRock(S, v, seed), X, Y); continue; } if (ch === 'C') { x.drawImage(L.mazeCore(S, 'abyss', t, m), X, Y); continue; } if (ch === 'E') { x.drawImage(L.mazeFloor(S, m, 'room', seed), X, Y); continue; }
      x.drawImage(L.mazeFloor(S, m, ch === 'R' ? 'room' : 'path', seed), X, Y); if (TR[ch]) x.drawImage(L.mazeTrap(S, TR[ch], t), X, Y); if (RM[r + ',' + cc]) x.drawImage(L.mazeRoomMark(S, RM[r + ',' + cc], t), X, Y); }
    var eg = L.mazeEgg(S, 1, t); x.drawImage(eg, 2.5 * S - eg.width / 2, top + 7.45 * S - eg.height / 2);
    L.boss('abyss', 1).draw(x, 2.5 * S, top + 6.88 * S, 'idle', 300, { scale: S / 110 });
    L.mazePath(x, [[2, -1], [2, 0], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [2, 5], [2, 6], [2, 7]], S, t, 'walk', { oy: top });
    L.mazePath(x, [[3, 3], [2, 3, true], [1, 3]], S, t, 'break', { oy: top });
    L.mazeBack(x, [[3, 3], [3, 2], [3, 1], [3, 2], [3, 3]], S, t, { oy: top }); L.mazeScout(x, [[2, 0], [3, 1], [3, 4]], S, t, { oy: top }); x.drawImage(L.mazeEntranceGlow(S, C, t), 0, top);
    var pm = L.mazeParty(Math.round(S * 0.62), ['militia', 'torch', 'hound'], 3, t); x.drawImage(pm, 2.5 * S - pm.width / 2, top + 0.5 * S - pm.height / 2);
    return c; }; })();`;
  if (want('maze')) { await p.evaluate(MAZE_MAP);
    await save('maze_title', () => { var c = document.createElement('canvas'); c.width = 390 * 2 + 20; c.height = 700; var x = c.getContext('2d'); x.drawImage(LAIRART.mazeTitle(390, 700, 0.2), 0, 0); x.drawImage(LAIRART.mazeTitle(390, 700, 0.7), 410, 0); return c.toDataURL('image/png'); });
    await save('maze_rock', () => { var L = LAIRART, S = 72, c = document.createElement('canvas'); c.width = S * 8; c.height = S * 4; var x = c.getContext('2d'); for (var r = 0; r < 4; r++) for (var k = 0; k < 8; k++) x.drawImage(r === 1 && k === 3 ? L.mazeFloor(S, 5, 'path', 2) : L.mazeRock(S, 15, r * 8 + k), k * S, r * S); return c.toDataURL('image/png'); });
    await save('maze_390', () => MAZEMAP(78, 0.3).toDataURL('image/png')); await save('maze_96', () => MAZEMAP(96, 0.3).toDataURL('image/png'));
    await save('maze_egg', () => { var L = LAIRART, S = 96, c = document.createElement('canvas'); c.width = 5 * 180; c.height = 2 * 180; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#0c0a0e'; x.fillRect(0, 0, c.width, c.height);
      for (var k = 0; k <= 4; k++) [[0, 0], [1, 0.5]].forEach(function (q) { var e = L.mazeEgg(S, k, q[1]); x.drawImage(e, k * 180 + 90 - e.width / 2, q[0] * 180 + 92 - e.height / 2); x.fillStyle = '#9a94a8'; x.font = '12px sans-serif'; x.fillText('금 ' + k + ' · t ' + q[1], k * 180 + 6, q[0] * 180 + 14); }); return c.toDataURL('image/png'); });
    await save('maze_parts', () => { var L = LAIRART, S = 96, c = document.createElement('canvas'); c.width = 7 * 110; c.height = 600; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#0c0a0e'; x.fillRect(0, 0, c.width, c.height);
      L.MAZE_TRAPS.forEach(function (id, k) { [0.1, 0.6].forEach(function (t, r) { x.drawImage(L.mazeFloor(S, 5, 'path', k), k * 110, r * 120 + 14); x.drawImage(L.mazeTrap(S, id, t), k * 110, r * 120 + 14); }); x.fillStyle = '#9a94a8'; x.font = '12px sans-serif'; x.fillText(id, k * 110 + 4, 11); });
      ['abyss', 'dusk'].forEach(function (f, k) { x.drawImage(L.mazeCore(S, f, 0.2, 5), k * 110, 494); });
      [15, 0, 5, 10].forEach(function (v, k) { x.drawImage(L.mazeRock(S, v, k), (2 + k) * 110, 494); });
      [['militia', 3], ['knight', 4], ['tracker', 4], ['seeker', 3]].forEach(function (q, k) { x.drawImage(L.mazeParty(48, [q[0]], q[1], 0.25), k * 110 + 20, 270, 96, 96); });
      ['nursery', 'pool', 'eye', 'digest', 'altar', 'bone'].forEach(function (id, k) { x.drawImage(L.mazeFloor(S, 5, 'room', k), k * 110, 380, 96, 96); x.drawImage(L.mazeRoomMark(S, id, 0.2), k * 110, 380, 96, 96); }); return c.toDataURL('image/png'); }); }
  // 이야기 모드의 장면 그림 (story): 모든 key 를 390 폭 띠로, 큰 화면 몇 장
  const storyScenes = () => { const M = require(path.join(SRC, 'mazestory.js')), out = []; M.chapters.forEach(c => { (c.start || []).forEach((s, i) => out.push([c.id + '.s' + i, s.place])); (c.between || []).forEach((b, i) => (b || []).forEach((s, j) => out.push([c.id + '.b' + i + '.' + j, s.place]))); (c.end || []).forEach((s, i) => out.push([c.id + '.e' + i, s.place])); }); Object.keys(M.endings).forEach(k => M.endings[k].scenes.forEach((s, i) => out.push(['end' + k + i, s.place]))); (M.retry || []).forEach((s, i) => out.push(['retry' + i, s.place])); return out; };
  if (want('story')) { const keys = await p.evaluate(() => { const k = LAIRART.STORY_KEYS.slice(); Object.keys(LAIRART.STORY_ART).forEach(pl => { const v = LAIRART.STORY_ART[pl]; if (!k.includes(v)) k.push(v); }); return k; });
    for (let i = 0; i < keys.length; i += 8) await save('story_band' + (i / 8 + 1), ks => { const c = document.createElement('canvas'); c.width = 390 * 2 + 10; c.height = Math.ceil(ks.length / 2) * 215; const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height); ks.forEach((k, j) => { const X = (j % 2) * 400, Y = Math.floor(j / 2) * 215; x.drawImage(LAIRART.storyArt(k, 390, 195, 0.3), X, Y); x.fillStyle = '#ccc'; x.font = '12px sans-serif'; x.fillText(k, X + 4, Y + 208); }); return c.toDataURL('image/png'); }, keys.slice(i, i + 8));
    for (const k of ['sky', 'tower', 'endA', 'endB', 'endC', 'endD', 'endE']) await save('story_big_' + k, k => LAIRART.storyArt(k, 960, 540, 0.3).toDataURL('image/png'), k);
    // 주인공: 이야기 그림 속 모습과 게임 속 그림(지도 위 본체 칸, 싸움 판의 본체)을 나란히
    await save('story_hero', () => { const L = LAIRART, rows = [['drop', 0], ['abyss', 1], ['dusk', 2], ['hunger', 3]], c = document.createElement('canvas'); c.width = 390 * 2 + 20 + 260; c.height = rows.length * 210; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
      rows.forEach(([form, step], i) => { const Y = i * 210, o = { form, step }; x.drawImage(L.storyArt('burrow1', 390, 195, 0.3, o), 0, Y); x.drawImage(L.storyArt('burrow6', 390, 195, 0.3, o), 400, Y);
        const S = 96, X = 810; x.drawImage(L.mazeCore(S, form === 'drop' ? 'drop' : form, 0.3, 5), X, Y + 20); L.boss(form, step).draw(x, X + S / 2, Y + 20 + S * 0.88, 'idle', 300, { scale: S / 110 }); L.boss(form, step).draw(x, X + 180, Y + 180, 'idle', 300, { scale: 1 });
        x.fillStyle = '#ccc'; x.font = '12px sans-serif'; x.fillText(form + ' ' + step + ' · 이야기 / 지도 / 싸움', 4, Y + 206); }); return c.toDataURL('image/png'); });
    await save('story_tall', () => { const c = document.createElement('canvas'); c.width = 390 * 3 + 20; c.height = 700; const x = c.getContext('2d'); ['sky', 'tower', 'eggroom'].forEach((k, i) => x.drawImage(LAIRART.storyArt(k, 390, 700, 0.3), i * 400, 0)); return c.toDataURL('image/png'); }); }
  if (want('check')) { const scenes = storyScenes(), sbad = await p.evaluate(scenes => { const bad = [], L = LAIRART; if (typeof L.storyArt !== 'function' || typeof L.storyArtFor !== 'function') return ['storyArt 가 없다'];
      const keys = L.STORY_KEYS.slice(); Object.keys(L.STORY_ART).forEach(pl => { const v = L.STORY_ART[pl]; if (!keys.includes(v.split('@')[0])) bad.push('STORY_ART ' + pl + ' → ' + v + ': 없는 그림'); });
      const lum = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 16) { s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n / 3; };
      for (const k of keys) for (const [w, h] of [[390, 195], [390, 220], [960, 540], [390, 700]]) { let cv = null; try { cv = L.storyArt(k, w, h, 0.4); } catch (e) { bad.push('storyArt ' + k + ' ' + w + 'x' + h + ': ' + e.message); continue; } if (!cv || cv.width !== w || cv.height !== h) bad.push('storyArt ' + k + ': 크기'); else if (w === 390 && h === 195 && lum(cv) < 6) bad.push('storyArt ' + k + ': 거의 검다'); }
      if (L.storyArt('sky', 390, 195, 0.1) !== L.storyArt('sky', 390, 195, 0.1)) bad.push('storyArt: 캐시가 안 된다');
      if (L.storyArt('burrow1', 390, 195, 0.1, { form: 'abyss', step: 1 }) === L.storyArt('burrow1', 390, 195, 0.1)) bad.push('storyArt: o 의 모습이 캐시 열쇠에 없다');
      for (const [form, step] of [['abyss', 1], ['nebula', 2], ['brood', 3], ['dusk', 0], ['hunger', 3], ['none', 2]]) for (const k of ['crevice', 'burrow3', 'burrow6', 'eggroom@1', 'eggdoor', 'endD']) { try { const cv = L.storyArt(k, 390, 195, 0.5, { form, step }); if (!cv || cv.width !== 390) bad.push('storyArt o ' + k); } catch (e) { bad.push('storyArt o ' + k + ' ' + form + ': ' + e.message); } }
      for (const [id, place] of scenes) { const k = L.storyArtFor(id, place); if (!k || !keys.includes(String(k).split('@')[0])) bad.push('storyArtFor ' + id + ' ' + place + ' → ' + k); else { try { L.storyArt(k, 390, 195, 0); } catch (e) { bad.push('storyArt ' + k + ': ' + e.message); } } }
      for (const X of 'ABCDE') if (L.storyArtFor('end' + X + '0', '알의 방') !== 'end' + X) bad.push('storyArtFor end' + X + '0'); if (L.storyArtFor('c3.s1', '굴').split('@')[0] !== 'burrow3') bad.push('storyArtFor c3.s1');
      return bad; }, scenes); console.log(sbad.length ? '이야기 그림 검사 실패: ' + sbad.join(' | ') : '이야기 그림: ' + scenes.length + ' 장면 모두 그림이 있다'); if (sbad.length) process.exitCode = 1; }
  if (want('check')) { const bad = await p.evaluate(([NEW, REDO, FORMS]) => { const bad = [], c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d'), run = (h, tag) => { if (!h) { bad.push(tag + ': 없음'); return; } for (const an of Object.keys(LAIRART.ANIM)) for (let k = 0; k < LAIRART.ANIM[an].n; k++) { try { h.draw(x, 150, 250, an, k * LAIRART.ANIM[an].dur / LAIRART.ANIM[an].n + 1, {}); } catch (e) { bad.push(tag + ' ' + an + ' ' + k + ': ' + e.message); return; } } try { h.frame('idle', 0, { mad: true }); h.frame('idle', 0, { flash: true }); } catch (e) { bad.push(tag + ' 덧빛: ' + e.message); } };
      for (const id of NEW.concat(REDO)) for (const st of [1, 2, 3]) run(LAIRART.unit(id, st), id + '★' + st);
      for (const f of FORMS) { for (const st of [undefined, 0, 1, 2, 3]) run(LAIRART.boss(f, st), 'boss ' + f + ':' + st); for (const st of [0, 1, 2, 3]) { const ic = LAIRART.icon('boss:' + f + ':' + st, 1, 48); if (!ic || !ic.width) bad.push('icon boss:' + f + ':' + st); } if (LAIRART.boss(f) !== LAIRART.boss(f, 1)) bad.push(f + ': step 1 이 예전 그림과 다르다'); if (LAIRART.boss(f, 0) !== LAIRART.boss('drop')) bad.push(f + ': step 0 이 drop 이 아니다'); if (LAIRART.boss(f, 3).size <= LAIRART.boss(f, 2).size || LAIRART.boss(f, 2).size <= LAIRART.boss(f, 1).size) bad.push(f + ': 단계가 오를수록 커져야 한다'); }
      for (const id of NEW.concat(['brute'])) { const ic = LAIRART.icon(id, 1, 40); if (!ic || !ic.width) bad.push('icon ' + id); }
      for (const n of ['meteor', 'toll', 'ink', 'reap', 'sermon', 'rift', 'rebirth']) for (let k = 0; k <= 20; k++) { try { if (!LAIRART.fx(n, x, { x: 60, y: 240 }, { x: 200, y: 120 }, k / 20, { px: 2, kill: k % 2 })) bad.push('fx ' + n + ': 없음'); } catch (e) { bad.push('fx ' + n + ' ' + k + ': ' + e.message); break; } }
      for (const id of ['orbit', 'ink', 'rift']) if (!LAIRART.SHOOT[id]) bad.push(id + ': SHOOT 에 없다');
      // 굴 짓기의 지도: 새 함수 전부, 여러 크기와 변형
      for (const S of [64, 72, 96]) { for (let v = 0; v < 16; v++) { const cv = LAIRART.mazeRock(S, v, v); if (!cv || cv.width !== S) bad.push('mazeRock ' + S + ' ' + v); const f = LAIRART.mazeFloor(S, v, v % 2 ? 'room' : 'path', v); if (!f || f.width !== S) bad.push('mazeFloor ' + S + ' ' + v); }
        if (LAIRART.mazeRock(S, 5, 1) !== LAIRART.mazeRock(S, 5, 1)) bad.push('mazeRock: 캐시가 안 된다');
        for (const id of LAIRART.MAZE_TRAPS) for (let k = 0; k <= 8; k++) { const cv = LAIRART.mazeTrap(S, id, k / 8); if (!cv || cv.width !== S) bad.push('mazeTrap ' + id); }
        for (const [rid, gid] of [['tr_teeth', 'pit'], ['tr_whisper', 'whisper'], ['tr_slime', 'slime'], ['tr_spore', 'spore'], ['tr_lure', 'lure'], ['tr_maw', 'maw'], ['tr_mirror', 'mirror']]) { if (!LAIRART.MAZE_TRAPS.includes(gid)) bad.push('MAZE_TRAPS 에 ' + gid + ' 가 없다'); const a = LAIRART.mazeTrap(S, rid, 0.3).toDataURL(), b2 = LAIRART.mazeTrap(S, gid, 0.3).toDataURL(); if (a !== b2) bad.push('mazeTrap ' + rid + ' 와 ' + gid + ' 가 다르다'); const d = LAIRART.mazeTrap(S, gid, 0.3).getContext('2d').getImageData(0, 0, S, S).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; if (n < S * S * 0.1) bad.push('mazeTrap ' + gid + ': 거의 비었다'); }
        if (LAIRART.mazeTrap(S, 'maw', 0.3).toDataURL() === LAIRART.mazeTrap(S, 'pit', 0.3).toDataURL()) bad.push('maw 와 pit 가 같다');
        for (const id of ['nursery', 'pool', 'eye', 'digest', 'altar', 'bone', 'spore', 'shade']) { const cv = LAIRART.mazeRoomMark(S, id, 0.3); if (!cv || cv.width !== S) bad.push('mazeRoomMark ' + id); }
        const en = LAIRART.mazeEntrance(S, 5); if (!en || en.width !== S * 5) bad.push('mazeEntrance ' + S);
        for (let k = 0; k <= 4; k++) { const e = LAIRART.mazeEgg(S, k, k / 4); if (!e || Math.abs(e.width - S * 1.4) > 1) bad.push('mazeEgg ' + S + ' ' + k); }
        for (const f of ['abyss', 'nebula', 'brood', 'dusk', 'hunger', 'drop']) { const cv = LAIRART.mazeCore(S, f, 0.4); if (!cv || cv.width !== S) bad.push('mazeCore ' + f); }
        for (const k of ['militia', 'knight', 'seeker', 'tracker']) { const cv = LAIRART.mazeParty(Math.round(S * 0.6), [k], 4, 0.5); if (!cv || !cv.width) bad.push('mazeParty ' + k); }
        try { if (LAIRART.mazePath(x, [[2, -1], [2, 0], [3, 0, true], [3, 1]], S, 0.3, 'break', { ox: 0, oy: 0 }) !== true) bad.push('mazePath: true 가 아니다'); if (LAIRART.mazeBack(x, [[1, 1], [1, 2], [1, 1]], S, 0.3, {}) !== true) bad.push('mazeBack: true 가 아니다'); if (LAIRART.mazeScout(x, [[1, 1], [3, 4]], S, 0.3, {}) !== true) bad.push('mazeScout: true 가 아니다'); } catch (e) { bad.push('mazePath/Back/Scout: ' + e.message); }
        const eg = LAIRART.mazeEntranceGlow(S, 5, 0.3); if (!eg || eg.width !== S * 5 || eg.height !== S) bad.push('mazeEntranceGlow ' + S); const en2 = LAIRART.mazeEntrance(S, 5); if (en2.height !== Math.round(S * 0.9)) bad.push('mazeEntrance: 높이가 0.9S 가 아니다'); }
      if (LAIRART.mazeBack(x, [[0, 0]], 64, 0) !== false || LAIRART.mazeScout(x, [], 64, 0) !== false) bad.push('mazeBack/Scout: 칸 하나에 false 가 아니다');
      for (const [w, h] of [[390, 600], [360, 520], [960, 700]]) { const tc = LAIRART.mazeTitle(w, h, 0.4); if (!tc || tc.width !== w || tc.height !== h) bad.push('mazeTitle ' + w + 'x' + h); }
      { const a = LAIRART.mazeRock(64, 15, 1).getContext('2d').getImageData(0, 0, 64, 64).data, b2 = LAIRART.mazeFloor(64, 5, 'path', 1).getContext('2d').getImageData(0, 0, 64, 64).data, lum = d => { let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * 0.3 + d[i + 1] * 0.5 + d[i + 2] * 0.2; return s / (d.length / 4); }; if (lum(a) >= lum(b2)) bad.push('mazeRock 이 판 칸보다 밝다'); }
      if (LAIRART.mazePath(x, [[0, 0]], 64, 0) !== false) bad.push('mazePath: 칸 하나에 false 가 아니다');
      const e0 = LAIRART.mazeEgg(96, 0, 0).getContext('2d').getImageData(0, 0, 134, 134).data, e4 = LAIRART.mazeEgg(96, 4, 0).getContext('2d').getImageData(0, 0, 134, 134).data; let diff = 0; for (let i = 0; i < e0.length; i += 4) if (e0[i] !== e4[i]) diff++; if (diff < 200) bad.push('mazeEgg: 금 0 과 4 가 거의 같다');
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
