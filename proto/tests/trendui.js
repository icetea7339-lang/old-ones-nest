// 새 판 (시험) 화면 시험: 제목 → 새 판 → 보상 고르기 → 놓기 · 굴 바꾸기 (몸이 바뀐다) → 싸움 (발동이 보인다 · 기술) → 누가 얼마나 했나 → 다시 한 판
// node tests/trendui.js [기기: 비우면 PC | "iPhone 14" | a360]
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'trendui_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const shot = async (label, noclip) => { await p.waitForTimeout(250); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); if (noclip) return; const cl = await p.evaluate(FZM.clipScript); cl.forEach(s => bad.push(label + ': ' + s)); const small = await p.evaluate(() => { const o = []; document.querySelectorAll('#tr *').forEach(e => { if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return; const t = Array.from(e.childNodes).some(c => c.nodeType === 3 && c.textContent.trim()); if (t && parseFloat(getComputedStyle(e).fontSize) < 13) o.push(e.textContent.trim().slice(0, 12)); }); document.querySelectorAll('#tr button').forEach(e => { if (!e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.height < 39.5) o.push('낮은 단추 「' + e.textContent.trim().slice(0, 10) + '」 ' + Math.round(r.height)); }); return o; }); small.forEach(s => bad.push(label + ': 작은 글/단추 ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(120); };
  const tapCell = async c => { const pt = await p.evaluate(c => __trend.pt(c), c); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(120); };
  await shot('title', true);
  if (!(await p.$('[data-a="trend"]'))) throw new Error('제목에 「새 판 (시험)」이 없다');
  await tap('[data-a="trend"]'); await shot('offer');
  const off = await p.$$('#trsheet [data-t="offer"]'); if (off.length !== 3) bad.push('보상이 셋이 아니다 ' + off.length);
  await tap('#trsheet [data-t="offer"][data-i="0"]'); await shot('setup');
  // 놓기: 첫 부위를 들고 빛나는 칸에 놓는다. 몸이 바뀐다
  const body0 = await p.evaluate(() => __trend.body);
  { const uid = await p.evaluate(() => { const R = __trend.R; return __trend.T.bench(R).find(q => __trend.T.P[q.id].kind === 'trap').uid; }); await tap(`#trbench [data-u="${uid}"]`); await shot('lift');
    const cell = await p.evaluate(uid => { const R = __trend.R, T = __trend.T; const ok = []; for (let c = 0; c < T.N; c++) if (T.canPlace(R, uid, c) && R.bd.path.includes(c)) ok.push(c); return ok[ok.length - 1]; }, uid); await tapCell(cell);
    const at = await p.evaluate(uid => __trend.T.placedAt(__trend.R, uid), uid); if (at !== cell) bad.push('부위를 놓지 못했다'); }
  { const uid = await p.evaluate(() => __trend.T.bench(__trend.R).find(q => __trend.T.P[q.id].kind === 'trap').uid); await tap(`#trbench [data-u="${uid}"]`); const cell = await p.evaluate(uid => { const R = __trend.R, T = __trend.T; for (let c = 0; c < T.N; c++) if (T.canPlace(R, uid, c) && R.bd.path.includes(c) && !(R.board[c] && R.board[c].trap)) return c; }, uid); await tapCell(cell); }
  const body1 = await p.evaluate(() => __trend.body); if (body1 === body0) bad.push('부위를 놓았는데 몸이 그대로다'); await shot('placed');
  // 놓인 것을 누르면 자세히 (닿는 칸이 빛난다)
  { const cell = await p.evaluate(() => { const R = __trend.R; for (const k in R.board) if (R.board[k].trap != null) return +k; }); await tapCell(cell); const t = await p.evaluate(() => document.getElementById('trinfo').textContent); if (!/·/.test(t)) bad.push('놓인 부위를 눌렀는데 설명이 없다'); await shot('detail'); }
  // 굴 바꾸기
  await tap('[data-t="edit"]'); await shot('edit');
  { const r = await p.evaluate(() => { const R = __trend.R, T = __trend.T, l0 = R.bd.path.length; let best = null, bl = -1; for (let c = 0; c < T.N; c++) { if (!T.canToggle(R, c)) continue; const d = R.bd.dug; d[c] = !d[c]; const pp = T.pathOf(R.bd); d[c] = !d[c]; if (pp && pp.length > bl) { bl = pp.length; best = c; } } return { best, l0, e0: R.bd.edits }; });
    if (r.best == null) bad.push('바꿀 굴 칸이 없다'); else { await tapCell(r.best); const e1 = await p.evaluate(() => __trend.R.bd.edits); if (e1 !== r.e0 - 1) bad.push('굴 바꾸기가 줄지 않았다'); } await shot('edited'); }
  if (await p.$('[data-t="edit"].on')) await tap('[data-t="edit"]');
  // 태그 누르기 → 세트 설명
  if (await p.$('[data-t="tag"]')) { await tap('[data-t="tag"]'); const t = await p.evaluate(() => document.getElementById('trinfo').textContent); if (!/\d:/.test(t)) bad.push('태그를 눌렀는데 단계 설명이 없다'); }
  await tap('[data-t="auto"]'); await shot('auto');
  if (await p.evaluate(() => __trend.T.bench(__trend.R).length)) bad.push('알아서 놓기 뒤에도 남은 것이 있다');
  // 싸움
  await tap('[data-t="fight"]'); await p.waitForTimeout(1200); await shot('fight_start', true);
  await p.waitForTimeout(4500); await shot('fight_mid', true);
  { const ok = await p.waitForFunction(() => __trend.fires >= 3, null, { timeout: 8000 }).then(() => true, () => false); const f1 = await p.evaluate(() => [__trend.fires, Math.round(__trend.F.t)]); if (!ok) bad.push('싸움 ' + f1[1] + '초 동안 발동이 ' + f1[0] + '번'); }
  // 기술: 칸을 고르는 것은 멈추고 고른다, 아닌 것은 바로
  { const sk = await p.evaluate(() => __trend.F.charges.map(c => ({ id: c.id, cell: !!__trend.T.SKILLCELL[c.id] })));
    const i = sk.findIndex(s => s.cell); if (i >= 0) { await tap(`[data-t="sk"][data-i="${i}"]`); const t0 = await p.evaluate(() => __trend.F.t); await p.waitForTimeout(500); const t1 = await p.evaluate(() => __trend.F.t); if (t1 !== t0) bad.push('기술 칸을 고르는 동안 싸움이 멈추지 않았다'); await shot('aim', true);
      const cell = await p.evaluate(() => { const F = __trend.F, T = __trend.T, L = T.alive(F); return L.length ? T.cellOf(F, L[0]) : F.R.bd.path[1]; }); await tapCell(cell); const used = await p.evaluate(i => __trend.F.charges[i].used, i); if (!used) bad.push('기술을 쓰지 못했다'); }
    const j = sk.findIndex(s => !s.cell); if (j >= 0) { await tap(`[data-t="sk"][data-i="${j}"]`); const used = await p.evaluate(j => __trend.F.charges[j].used, j); if (!used) bad.push('바로 쓰는 기술을 쓰지 못했다'); } }
  await p.waitForTimeout(2500); await shot('fight_late', true);
  await tap('[data-t="spd"][data-v="3"]');
  await p.waitForFunction(() => !document.getElementById('trsheet').hidden && /누가 얼마나/.test(document.getElementById('trsheet').textContent), null, { timeout: 60000 });
  await shot('end');
  const kinds = await p.evaluate(() => __trend.kinds); console.log('발동 모습: ' + JSON.stringify(kinds));
  const rows = await p.$$('#trsheet .tr-bar'); if (rows.length < 3) bad.push('누가 얼마나 했나 줄이 ' + rows.length);
  // 다시 한 판: 새 판 (부위가 바뀐다)
  const ids0 = await p.evaluate(() => __trend.R.pieces.map(q => q.id).join());
  await tap('[data-t="again"]'); await shot('again');
  const ids1 = await p.evaluate(() => __trend.R.pieces.map(q => q.id).join()); if (ids0 === ids1) bad.push('다시 한 판인데 부위가 그대로다');
  if (await p.evaluate(() => document.getElementById('trsheet').hidden)) bad.push('다시 한 판에 보상 창이 없다');
  await tap('#trsheet [data-t="offer"][data-i="1"]'); await tap('[data-t="exit"]'); await p.waitForTimeout(200);
  if (await p.evaluate(() => document.getElementById('title').hidden)) bad.push('나가기 뒤에 제목 화면이 없다');
  await b.close();
  errs.forEach(e => console.log('오류: ' + e)); bad.forEach(e => console.log('문제: ' + e));
  console.log(`새 판 화면 (${tag}): 오류 ${errs.length} · 문제 ${bad.length} · 그림 ${out}`); process.exit(errs.length || bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
