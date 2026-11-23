// 굴 짓기 이야기 모드 시험: 첫 화면(이야기 / 자유) → 장 제목 → 장면 (누르면 한 줄, 넘기기, 건너뛰기, 줄 모양) → 지도의 안내 한 줄 → 침입 → 침입 사이 장면
// → 장 끝 → 다음 장 … 장 3부터 밤의 한 수(고르기·결과·고르지 않음) → 알이 깨진 장 다시 하기 → 마지막 장 → 결말 → 처음으로(본 결말 n/5)
// 저장·이어하기는 장면 중간과 밤의 한 수 중간에서 본다. 잠긴 것(파기·함정)은 창에 나오지 않는다. 기록 탭.
// node tests/mazestory.js [기기: 비우면 "iPhone 14" | a360 | pc]   (큰 글씨: FZ=1.3)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-MAZE.html'), 'utf8');
const dev = process.argv[2] === 'pc' ? '' : process.argv[2] || 'iPhone 14', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'mazestory_' + tag + (FZM.FZ ? '_fz' + FZM.FZ : '')); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const ev = (f, a) => p.evaluate(f, a);
  const shot = async (label, noclip) => { n++; await p.waitForTimeout(150); await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); if (noclip) return; (await ev(FZM.clipScript)).forEach(t => bad.push(label + ': ' + t)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(140); };
  const rd = () => ev(() => __maze.read());
  // 첫 화면
  { const d = await ev(() => Array.from(document.querySelectorAll('#menu button')).map(b => b.dataset.z)); if (!d.includes('story') || !d.includes('free') || !d.includes('help') || !d.includes('sound')) bad.push('첫 화면 단추가 맞지 않는다 ' + JSON.stringify(d)); }
  await shot('title');
  // 이야기 시작: 장 제목 카드
  await tap('[data-z="story"]'); { const r = await rd(); if (!r || r.card !== 0) bad.push('장 제목 카드가 없다 ' + JSON.stringify(r)); const t = await ev(() => document.querySelector('#mzr .mzr-card').textContent); if (!/서장/.test(t) || !/낙하/.test(t)) bad.push('장 제목이 맞지 않다 ' + t); } await shot('chapter_card');
  await tap('#mzr'); { const r = await rd(); if (!r || r.q !== 'start' || r.l !== 1) bad.push('장면이 첫 줄부터 열리지 않는다 ' + JSON.stringify(r)); }
  // 누르면 한 줄씩
  for (let i = 0; i < 5; i++) await tap('#mzr .mzr-lines'); { const r = await rd(), c = await ev(() => document.querySelectorAll('#mzr .mzr-l').length); if (r.l !== 6 || c !== 6) bad.push('누르기마다 한 줄이 나오지 않는다 ' + JSON.stringify({ r, c })); }
  await tap('#mzr .mzr-lines'); await shot('scene_echo'); if (!(await p.$('#mzr .k-echo'))) bad.push('잔향 줄의 모양이 없다');
  // 저장·이어하기: 장면 중간
  { const before = await rd(); await p.reload(); await p.waitForTimeout(500); const t = await ev(() => (document.querySelector('[data-z="story"] small') || {}).textContent || ''); if (!/서장 · 침입 1/.test(t)) bad.push('이야기 이어하기 글이 맞지 않다 ' + t); await tap('[data-z="story"]'); const r = await rd(); if (!r || r.s !== before.s || r.l !== before.l) bad.push('장면 중간에서 이어지지 않는다 ' + JSON.stringify({ before, r })); }
  // 넘기기: 이 장면 끝까지
  await tap('#mzr [data-r="skipscene"]'); { const r = await rd(); if (r.l !== r.n) bad.push('넘기기가 장면 끝까지 가지 않는다 ' + JSON.stringify(r)); }
  await tap('#mzr .mzr-lines'); { const r = await rd(); if (r.s !== 1 || r.l !== 1) bad.push('장면 끝에서 누르면 다음 장면이 아니다 ' + JSON.stringify(r)); }
  // 건너뛰기: 처음 보는 묶음은 잠깐 뒤에 보인다
  await p.waitForTimeout(1600); await tap('#mzr [data-r="skipall"]'); { const r = await rd(); if (r) bad.push('건너뛰기 뒤에도 장면이 남았다 ' + JSON.stringify(r)); }
  // 지도: 장의 안내 한 줄, 잠긴 것은 창에 없다
  { const g = await ev(() => ({ g: __maze.guide(), coach: !document.getElementById('mz-coach').hidden, mode: __maze.M.mode, ch: __maze.M.chapter })); if (!g.coach || !g.g || g.mode !== 'story' || g.ch !== 0) bad.push('지도에 장의 안내가 없다 ' + JSON.stringify(g)); } await shot('map_guide');
  await tap('#mz-coach [data-m="guideok"]'); if (!(await ev(() => document.getElementById('mz-coach').hidden))) bad.push('안내를 닫지 못했다');
  { const pt = await ev(() => __maze.pt(11)); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200); const d = await ev(() => ({ dig: !!document.querySelector('#mz-sheet [data-m="dig"]'), t: (document.querySelector('#mz-sheet') || {}).textContent || '' })); if (d.dig) bad.push('서장에서 파기가 보인다'); await shot('locked_rock'); await tap('#mz-sheet [data-m="close"]'); }
  { const pt = await ev(() => __maze.pt(12)); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200); if (await p.$('#mz-sheet [data-m="use"][data-u="trap"]')) bad.push('서장에서 함정 단추가 보인다'); await tap('#mz-sheet [data-m="close"]'); }
  // 장을 이어 간다: 읽기는 건너뛰고, 침입은 넘기기. 장 1 의 둘째 침입에서 알이 깨지게 해 장 다시 하기를 본다
  const seen = { nights: 0, picked: 0, skipped: 0, retry: 0, between: 0, ends: 0, said: 0, chapters: [0] }; let guard = 0, ending = null;
  while (guard++ < 400) {
    const st = await ev(() => { const r = __maze.read(), M = __maze.M; return { r, title: !document.getElementById('title').hidden, ch: M ? M.chapter : null, raid: M ? M.raid : null, phase: M ? M.phase : null, sheet: __maze.Z.sheet && __maze.Z.sheet.kind, mapOn: !document.getElementById('mz').hidden }; });
    if (st.title) break;
    if (st.r && st.r.ending) { ending = st.r.ending; await shot('ending_card'); await tap('#mzr [data-r="home"]'); continue; }
    // 본체의 깨어남 (2장·4장 끝): 첫 카드를 받아들이고 장면을 넘긴다
    if (st.r && st.r.awaken) { seen.awaken = (seen.awaken || 0) + 1; await tap('#mzr [data-r="acard"][data-i="0"]'); await p.waitForTimeout(300); await tap('#mzr [data-r="aok"]'); await p.waitForTimeout(1800); continue; }
    if (st.r && st.r.night) { seen.nights++;
      if (seen.nights === 1) { await shot('night'); const c = await ev(() => document.querySelectorAll('#mzr .mzn-card').length); if (c !== 3) bad.push('밤의 카드가 셋이 아니다 ' + c);
        // 저장·이어하기: 밤의 한 수 중간
        const off = st.r.night.join(); await p.reload(); await p.waitForTimeout(500); await tap('[data-z="story"]'); const r2 = await rd(); if (!r2 || !r2.night || r2.night.join() !== off) bad.push('밤의 한 수 중간에서 이어지지 않는다 ' + JSON.stringify(r2));
        await tap('#mzr .mzn-card:not([disabled])'); await shot('night_sel'); const g0 = await ev(() => __maze.M.gold); await tap('#mzr [data-r="npick"]'); const d = await rd(); if (!d || !d.nightDone) bad.push('밤의 한 수를 고르지 못했다 ' + JSON.stringify(d)); else seen.picked++;
        const t = await ev(() => (document.querySelector('#mzr .mzn-res') || {}).textContent || ''); if (t.length < 8) bad.push('밤의 한 수 결과 글이 없다'); await shot('night_result'); void g0; }
      else if (seen.nights === 2) { await tap('#mzr [data-r="nskip"]'); seen.skipped++; }
      else { const can = await p.$('#mzr .mzn-card:not([disabled])'); if (can) { await can.click(); await p.waitForTimeout(100); await tap('#mzr [data-r="npick"]'); seen.picked++; } else await tap('#mzr [data-r="nskip"]'); }
      await tap('#mzr [data-r="nnext"]'); continue; }
    if (st.r && st.r.card != null) { seen.chapters.push(st.r.card); if (st.r.card === 1 && !seen.card1) { seen.card1 = 1; await shot('chapter1_card'); } await tap('#mzr'); continue; }
    if (st.r && st.r.q) {
      if (st.r.q === 'retry') seen.retry++; if (st.r.q === 'between') seen.between++; if (st.r.q === 'end') seen.ends++;
      // 대사 장면을 한 번 찍는다
      if (!seen.said) { await tap('#mzr [data-r="skipscene"]'); if (await p.$('#mzr .k-say')) { seen.said = 1; await shot('scene_say'); const f = await ev(() => Array.from(document.querySelectorAll('#mzr .k-say .mzr-face')).map(e => !!e.querySelector('img') || !!e.querySelector('i'))); if (!f.every(Boolean)) bad.push('대사에 얼굴이 없다'); } }
      if (st.r.q === 'retry' && seen.retry === 1) await shot('retry');
      if (st.r.q === 'ending' && !seen.endScene) { seen.endScene = 1; await tap('#mzr [data-r="skipscene"]'); await shot('ending_scene'); }
      await p.waitForTimeout(st.r.q === 'retry' || st.r.q === 'ending' ? 1600 : 0); const sk = await p.$('#mzr [data-r="skipall"]:not([hidden])'); if (sk) await sk.click(); else { await p.waitForTimeout(1600); await tap('#mzr [data-r="skipall"]'); } await p.waitForTimeout(120); continue; }
    if (st.sheet === 'result') { await tap('#mz-sheet [data-m="next"]'); continue; }
    if (st.sheet === 'reward') { await tap('#mz-sheet [data-m="reward"][data-i="0"]'); continue; }
    if (st.sheet) { await ev(() => { const c = document.querySelector('#mz-sheet [data-m="close"]'); if (c) c.click(); }); continue; }
    if (st.mapOn && st.phase === 'prep') {
      // 침입: 장 1 의 둘째 침입은 알을 1 로 두어 깨지게, 나머지는 알을 채우고 본체 방에 강한 권속
      await ev(o => { const M = __maze.M; const c = document.querySelector('#mz-coach [data-m="guideok"]'); if (c) c.click(); if (o.brk) M.egg = 0; else { M.egg = M.eggMax; if (!(M.board.core || []).length) __maze.give('maw', 3, 'core'); } __maze.redraw(); }, { brk: st.ch === 1 && st.raid === 2 && !seen.retry });
      await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(150); await ev(() => __maze.skip()); await p.waitForTimeout(250); continue; }
    await p.waitForTimeout(150);
  }
  if (!ending) bad.push('결말에 닿지 못했다 ' + JSON.stringify(seen));
  if (seen.awaken !== 2) bad.push('이야기에서 깨어남이 두 번이 아니다 ' + seen.awaken);
  if (!seen.retry) bad.push('알이 깨진 장을 다시 하지 않았다'); if (!seen.picked || !seen.skipped) bad.push('밤의 한 수를 고르거나 건너뛰지 않았다 ' + JSON.stringify(seen)); if (!seen.between) bad.push('침입 사이 장면이 없었다'); if (!seen.said) bad.push('대사 장면을 못 봤다');
  { const want = [0, 1, 1, 2, 3, 4, 5, 6]; if (want.some(c => !seen.chapters.includes(c))) bad.push('장 제목 카드를 다 보지 못했다 ' + JSON.stringify(seen.chapters)); }
  // 처음으로: 본 결말 n/5, 이야기 저장은 지워졌다, 기록 탭
  await p.waitForTimeout(300); { const t = await ev(() => (document.querySelector('#menu .mz-ends') || {}).textContent || ''), s = await ev(() => (document.querySelector('[data-z="story"] small') || {}).textContent || ''); if (!/본 결말 1\/5/.test(t)) bad.push('본 결말이 적히지 않았다 ' + t); if (s) bad.push('결말 뒤에도 이야기 이어하기가 남았다 ' + s); } await shot('title_after');
  await tap('[data-z="help"]'); await ev(() => Array.from(document.querySelectorAll('#modal .sh-tab')).find(b => b.textContent === '기록').click()); await p.waitForTimeout(150); { const d = await ev(() => document.querySelectorAll('#modal .mz-lognote').length); if (d < 6) bad.push('기록 탭의 조각이 모자란다 ' + d); } await shot('logs'); await tap('#modal [data-z="mclose"]');
  // 모드마다 저장이 따로: 이야기를 새로 열고 자유를 열어 둘 다 남는지, 「새로」는 그 모드만 지운다(묻고)
  await tap('[data-z="story"]'); await tap('#mzr'); await ev(() => __maze.redraw()); await p.reload(); await p.waitForTimeout(400); await tap('[data-z="free"]'); await p.waitForTimeout(300); { const m = await ev(() => __maze.M.mode); if (m !== 'free') bad.push('자유가 자유 판이 아니다 ' + m); }
  await ev(() => { const b = document.querySelector('#mz-bar [data-m="menu"]'); b.click(); }); await p.waitForTimeout(150); await tap('#mz-sheet [data-m="home"]');
  { const d = await ev(() => ({ st: !!document.querySelector('[data-z="storyNew"]'), fr: !!document.querySelector('[data-z="freeNew"]') })); if (!d.st || !d.fr) bad.push('두 모드의 저장이 따로 남지 않는다 ' + JSON.stringify(d)); }
  await tap('[data-z="freeNew"]'); if (!(await p.$('#modal [data-z="newYes"]'))) bad.push('「새로」가 묻지 않는다'); await shot('ask_new'); await tap('#modal [data-z="mclose"]');
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, seen, ending, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1); console.log('이야기 모드 시험 통과');
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
