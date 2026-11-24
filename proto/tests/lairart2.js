// 둥지 전투 그림 2 (ART-INV2: 2·3막 침입자, 이름 있는 조사자, 사람 꼴로 불려 나오는 것, 새 연출) 확인.
//   node tests/lairart2.js [check|units|cast|strips|compare|fx|all] [id, …]
//   node tests/lairart2.js [busts|bsize] [key, …]  이야기의 인물 초상(ART-BUST): 인물 × 기분 넷 표, 64·96·128 견주기
//   그림은 tests/lairart2_out/ 에 쓴다. check 는 새 id 전부 × 모든 움직임 × 모든 프레임을 한 번씩 그려 예외가 없는지 본다(실패하면 1 로 끝난다).
const pw = require('playwright'), fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src'), OUT = path.join(__dirname, 'lairart2_out'); fs.mkdirSync(OUT, { recursive: true });
const mon = fs.readFileSync(path.join(SRC, 'base.js'), 'utf8'), sculpt = mon.slice(mon.indexOf('const _c32'));
const lib = () => sculpt + '\n' + fs.readFileSync(path.join(SRC, 'lairart.js'), 'utf8');
const mode = process.argv[2] || 'all', only = process.argv.slice(3);
const INV = ['crossbow', 'banner', 'tracker', 'templar', 'exorcist', 'alchemist', 'seekerm'], SUM = ['cultist', 'zealot', 'possessed'], CAST = ['eda', 'rowen', 'mirel', 'tov', 'isel', 'vasco'], FXN = ['banner', 'mark', 'smite', 'exorcise', 'flask', 'possess', 'snare'];
const CASTIDS = [].concat.apply([], CAST.map(c => ['c_' + c, 'c_' + c + '_hurt', 'c_' + c + '_poss'])), ALL = INV.concat(SUM, CASTIDS);
const BKEYS = ['rowen', 'enoch', 'buyer', 'isel', 'eda', 'mirel', 'vasco', 'chief', 'apprentice', 'tov', 'shepherd', 'knightcmd', 'inquis', 'archer'], BMOOD = ['calm', 'fear', 'grim', 'mad'];
// 이야기의 모든 이름(대사·기록의 who, 장면의 인물)
const storyWho = () => { const f = path.join(SRC, 'mazestory.js'); if (!fs.existsSync(f)) return []; const M = new Function(fs.readFileSync(f, 'utf8') + '; return MAZESTORY;')(), w = new Set(); const walk = o => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if ((o.k === 'say' || o.k === 'note') && typeof o.who === 'string') w.add(o.who); if (Array.isArray(o.who)) o.who.forEach(x => w.add(x)); Object.keys(o).forEach(k => walk(o[k])); } }; walk(M); return Array.from(w); };
const OLD = ['militia', 'torch', 'hound', 'knight', 'archer', 'priest', 'mage', 'rogue', 'bard', 'inquis', 'paladin', 'seeker'];
const PAGE = body => '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>둥지 전투 그림 2</title><style>body{margin:0;background:#0d0c18;color:#cfc8d8;font:13px sans-serif}canvas{image-rendering:pixelated}</style></head><body>' + body + '</body></html>';
const TOOLS = `
window.SHEET = function (cells, cols, scale, cw, ch, bg) {
  var rows = Math.ceil(cells.length / cols), c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = bg || '#0d0c18'; x.fillRect(0, 0, c.width, c.height);
  cells.forEach(function (q, i) { var ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch; x.fillStyle = q.bg || ((i + Math.floor(i / cols)) % 2 ? '#15131f' : '#1b1826'); x.fillRect(ox, oy, cw, ch);
    if (q.draw) q.draw(x, ox, oy, cw, ch); else { var h = LAIRART.unit(q.id, q.star || 1); if (h) h.draw(x, ox + cw / 2, oy + ch - 26, q.anim || 'idle', q.t || 0, { scale: q.scale || scale, flip: q.flip, mad: q.mad }); else { x.fillStyle = '#a03030'; x.fillText('없음 ' + q.id, ox + 6, oy + 20); } }
    if (q.label) { x.fillStyle = '#9a94a8'; x.font = '12px sans-serif'; x.fillText(q.label, ox + 6, oy + ch - 8); } });
  return c.toDataURL('image/png'); };
`;
(async () => {
  const b = await pw.chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 900 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.setContent(PAGE('<script>' + lib() + '\n' + TOOLS + '</script>'));
  const save = async (name, expr, arg) => { const url = await p.evaluate(expr, arg); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(url.split(',')[1], 'base64')); console.log('그림', path.join(OUT, name + '.png')); };
  const want = m => mode === 'all' || mode === m, pick = list => (only.length ? list.filter(k => only.includes(k)) : list);
  let bad = 0;
  if (want('check')) {
    const r = await p.evaluate(([ids, fxn]) => { const out = { missing: [], thrown: [], frames: 0, fxMissing: [], fxThrown: [] };
      for (const id of ids) { const h = LAIRART.unit(id, 1); if (!h) { out.missing.push(id); continue; } for (const an of Object.keys(LAIRART.ANIM)) for (let k = 0; k < LAIRART.ANIM[an].n; k++) { try { h.frame(an, k * LAIRART.ANIM[an].dur / LAIRART.ANIM[an].n + 1); h.frame(an, k * LAIRART.ANIM[an].dur / LAIRART.ANIM[an].n + 1, { mad: 1 }); out.frames += 2; } catch (e) { out.thrown.push(id + ' ' + an + ' ' + k + ': ' + e.message); } } try { LAIRART.icon(id, 1, 44); } catch (e) { out.thrown.push(id + ' icon: ' + e.message); } }
      const c = document.createElement('canvas'); c.width = 400; c.height = 400; const x = c.getContext('2d');
      for (const n of fxn) { if (!LAIRART.FX[n]) { out.fxMissing.push(n); continue; } for (let k = 0; k <= 20; k++) { try { LAIRART.fx(n, x, { x: 80, y: 320 }, { x: 300, y: 100 }, k / 20, { px: 2 }); LAIRART.fx(n, x, { x: 200, y: 200 }, { x: 200, y: 200 }, k / 20, { px: 2, r: 2 }); } catch (e) { out.fxThrown.push(n + ' ' + k + ': ' + e.message); } } }
      return out; }, [ALL, FXN]);
    const who = storyWho(), rb = await p.evaluate(([who, keys, moods]) => { const out = { unmapped: [], noBust: [], thrown: [], bad: [], n: 0, nulls: [] };
      if (!LAIRART.bust || !LAIRART.BUSTS) { out.thrown.push('LAIRART.bust 없음'); return out; }
      for (const w of who) { if (!(w in LAIRART.BUSTS)) { out.unmapped.push(w); continue; } const key = LAIRART.BUSTS[w]; if (key === null) { out.nulls.push(w); if (LAIRART.bust(w, 96) !== null) out.bad.push(w + ' 은 null 이어야 한다'); continue; } if (keys.indexOf(key) < 0) out.noBust.push(w + '→' + key); }
      for (const k of keys) for (const md of moods) for (const px of [64, 96, 128]) for (const t of [0, 150, 1500, 4100, 4150]) { try { const c = LAIRART.bust(k, px, md, t); out.n++; if (!c || c.width !== px || c.height !== px) out.bad.push(k + ' ' + md + ' ' + px); } catch (e) { out.thrown.push(k + ' ' + md + ' ' + px + ': ' + e.message); } }
      return out; }, [who, BKEYS, BMOOD]);
    console.log('초상: 이야기의 이름', who.length, '· 그림', rb.n, '장 · 초상 없음(null)', rb.nulls.join(', ') || '-', '· 표에 없는 이름', rb.unmapped.join(', ') || '없음', '· 그림 없는 key', rb.noBust.join(', ') || '없음'); rb.thrown.concat(rb.bad).slice(0, 12).forEach(x => console.log('  잘못', x));
    bad = rb.unmapped.length + rb.noBust.length + rb.thrown.length + rb.bad.length;
    bad += r.missing.length + r.thrown.length + r.fxMissing.length + r.fxThrown.length;
    console.log('검사: 유닛', ALL.length, '프레임', r.frames, '· 없는 유닛', r.missing.join(',') || '없음', '· 없는 연출', r.fxMissing.join(',') || '없음'); r.thrown.concat(r.fxThrown).slice(0, 12).forEach(s => console.log('  예외', s));
  }
  if (want('units')) { await save('inv2_units', a => SHEET(a.map(id => ({ id, label: id, t: 150, flip: false })), 5, 4, 330, 370), pick(INV.concat(SUM))); }
  if (want('cast')) { for (let i = 0; i < CAST.length; i += 3) await save('inv2_cast' + (i / 3 + 1), a => SHEET([].concat.apply([], a.map(c => ['', '_hurt', '_poss'].map(s => ({ id: 'c_' + c + s, label: 'c_' + c + s, t: 150 })))), 3, 5, 400, 430), CAST.slice(i, i + 3)); }
  if (want('strips')) {
    const cols = [['idle', 0], ['idle', 600], ['move', 130], ['attack', 120], ['attack', 215], ['attack', 300], ['cast', 250], ['cast', 400], ['hit', 30], ['die', 250], ['die', 480], ['die', 700], ['mad', 200]];
    const list = pick(INV.concat(SUM, CAST.map(c => 'c_' + c))); for (let i = 0; i < list.length; i += 6) await save('inv2_strip' + (i / 6 + 1), ([l, cols]) => SHEET([].concat.apply([], l.map(id => cols.map(c => ({ id, anim: c[0], t: c[1], label: c[0] + ' ' + c[1] })))), cols.length, 2, 150, 180), [list.slice(i, i + 6), cols]);
  }
  if (want('compare')) { await save('inv2_compare', ([o, n, cs]) => SHEET(o.map(id => ({ id, label: id })).concat(n.map(id => ({ id, label: id })), cs.map(id => ({ id, label: id }))), 12, 2, 130, 170, '#15131f'), [OLD, INV.concat(SUM), CASTIDS.filter(k => !/_/.test(k.slice(2)))]);
    await save('inv2_small', ([o, n, cs]) => SHEET(o.concat(n, cs).map(id => ({ id, flip: true })), 14, 1, 76, 92, '#1a2a32'), [OLD, INV.concat(SUM), CASTIDS]); }
  if (want('fx')) { const names = pick(FXN); for (let i = 0; i < names.length; i += 4) await save('inv2_fx' + (i / 4 + 1), names => SHEET([].concat.apply([], names.map(n => [0.08, 0.2, 0.32, 0.44, 0.56, 0.7, 0.84, 0.95].map(t => ({ label: n + ' ' + t, draw: (x, ox, oy, cw, ch) => LAIRART.fx(n, x, { x: ox + 56, y: oy + ch - 60 }, { x: ox + cw - 76, y: oy + 110 }, t, { px: 2 }) })))), 8, 1, 230, 250), names.slice(i, i + 4)); }
  if (want('busts')) { const ks = pick(BKEYS); for (const PX of [96, 128]) for (let i = 0; i < ks.length; i += 7) await save('bust' + PX + '_' + (i / 7 + 1), ([ks, moods, PX]) => { const cw = PX + 8, ch = PX + 22, c = document.createElement('canvas'); c.width = moods.length * cw + 90; c.height = ks.length * ch; const x = c.getContext('2d'); x.fillStyle = '#0d0c18'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false; x.font = '12px sans-serif';
      ks.forEach((k, r) => { x.fillStyle = '#9a94a8'; x.fillText(k, 6, r * ch + PX / 2); moods.forEach((md, j) => { const b = LAIRART.bust(k, PX, md, 50); if (b) x.drawImage(b, 90 + j * cw, r * ch + 4); x.fillStyle = '#6a6478'; x.fillText(md, 90 + j * cw, r * ch + PX + 18); }); }); return c.toDataURL('image/png'); }, [ks.slice(i, i + 7), BMOOD, PX]); }
  if (mode === 'bone') for (const k of pick(BKEYS)) await save('bust_one_' + k, k => { const c = document.createElement('canvas'); c.width = 644; c.height = 644; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; ['calm', 'fear', 'grim', 'mad'].forEach((md, j) => x.drawImage(LAIRART.bust(k, 320, md, 50) || document.createElement('canvas'), (j % 2) * 324, Math.floor(j / 2) * 324)); return c.toDataURL('image/png'); }, k);
  // 비례 검사: 얼굴 위에 정수리·턱(흰), 눈(하늘), 눈썹(파랑), 코끝(노랑), 입(빨강), 귀 위·아래(초록)를 겹친다
  if (mode === 'bguide') { const ks = pick(BKEYS).filter(k => k !== 'buyer'); for (let i = 0; i < ks.length; i += 4) await save('bust_guide' + (i / 4 + 1), ks => { const Z = 5, P = 320, c = document.createElement('canvas'); c.width = ks.length * (P + 6); c.height = P + 4; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    ks.forEach((k, j) => { const ox = j * (P + 6), b = LAIRART.bust(k, P, 'calm', 50), g = LAIRART.bust.geo(k); x.drawImage(b, ox, 0); if (!g) return; const Y = v => v * Z, X = v => ox + v * Z;
      const hl = (y, col, x0, x1) => { x.strokeStyle = col; x.lineWidth = 1; x.beginPath(); x.moveTo(X(x0 == null ? 14 : x0), Y(y) + 0.5); x.lineTo(X(x1 == null ? 50 : x1), Y(y) + 0.5); x.stroke(); };
      hl(g.top, '#ffffff'); hl(g.chin[1], '#ffffff'); hl(g.ey, '#40e0ff'); hl(g.by, '#4080ff', 24, 44); hl(g.ny, '#ffe040'); hl(g.my, '#ff6060'); hl(g.earT, '#60ff60', g.earX - 4, g.earX + 4); hl(g.earB, '#60ff60', g.earX - 4, g.earX + 4);
      for (const [vx, col] of [[g.ex1, '#40e0ff'], [g.ex2, '#40e0ff'], [g.mx, '#ff6060'], [g.nx, '#ffe040']]) { x.strokeStyle = col; x.beginPath(); x.moveTo(X(vx) + 0.5, Y(g.ey - 6)); x.lineTo(X(vx) + 0.5, Y(g.chin[1] + 2)); x.stroke(); } }); return c.toDataURL('image/png'); }, ks.slice(i, i + 4)); }
  if (want('bsize')) await save('bust_sizes', ks => { const c = document.createElement('canvas'); c.width = 64 + 96 + 128 + 40 + 128 + 128; c.height = ks.length * 136; const x = c.getContext('2d'); x.fillStyle = '#0d0c18'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false;
    ks.forEach((k, r) => { let ox = 4; for (const px of [64, 96, 128]) { x.drawImage(LAIRART.bust(k, px, 'calm', 200), ox, r * 136 + 4); ox += px + 8; } x.drawImage(LAIRART.bust(k, 128, 'calm', 4120), ox + 8, r * 136 + 4); x.drawImage(LAIRART.bust(k, 128, 'calm', 1600), ox + 144, r * 136 + 4); }); return c.toDataURL('image/png'); }, pick(BKEYS));
  console.log(errs.length ? '오류: ' + errs.join(' | ') : 'no errors');
  await b.close(); if (bad || errs.length) process.exit(1);
})();
