// 본체의 깨어남 시험: 자유 침입 1 뒤(카드 셋 → 설명 → 받아들인다 → 바뀌는 연출 → 장면 → 지도의 새 본체 방), 고르는 중·장면 중 저장·이어하기,
// 침입 3 뒤 둘째 깨어남(그대로 키움 / 다른 판에서 갈아탐 = 섞인 몸), 상점의 모습 권속 표지, 이야기 2장 끝 깨어남 → 3장
// node tests/mazeawaken.js [기기: 비우면 "iPhone 14" | a360 | pc]   (큰 글씨: FZ=1.3)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-MAZE.html'), 'utf8');
const dev = process.argv[2] === 'pc' ? '' : process.argv[2] || 'iPhone 14', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'mazeawaken_' + tag + (FZM.FZ ? '_fz' + FZM.FZ : '')); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const ev = (f, a) => p.evaluate(f, a);
  const shot = async (label, noclip) => { n++; await p.waitForTimeout(150); await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); if (noclip) return; (await ev(FZM.clipScript)).forEach(t => bad.push(label + ': ' + t)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error("없음: " + sel); try { await el.click({ timeout: 4000 }); } catch (e) { await p.screenshot({ path: path.join(out, "zz_fail.png") }); console.log("FAIL", sel, JSON.stringify(await ev(() => ({ r: __maze.read(), html: (document.getElementById("mzr") || {}).className, ph: __maze.Z.phase })))); throw e; } await p.waitForTimeout(140); };
  const rd = () => ev(() => __maze.read());
  // 침입 하나 (넘기기) → 결과 → 「준비」
  const raid = async () => { await ev(() => { const M = __maze.M; M.egg = M.eggMax; if (!(M.board.core || []).length) __maze.give('maw', 3, 'core'); __maze.redraw(); }); await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(150); await ev(() => __maze.skip()); await p.waitForTimeout(300); await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(200);
    if (await p.$('#mz-sheet [data-m="reward"]')) { const aw = await rd(); if (aw && aw.awaken) bad.push('깨어남과 보상 창이 함께 떴다'); else await tap('#mz-sheet [data-m="reward"][data-i="0"]'); } };
  const skipRead = async () => { await p.waitForTimeout(1600); await tap('#mzr [data-r="skipall"]'); await p.waitForTimeout(200); };
  // 깨어남 장면을 넘기고 지도로: 막은 침입의 무료 하나가 있으면 고른다
  const skipAw = async () => { await skipRead(); if (await p.$('#mz-sheet [data-m="reward"]')) await tap('#mz-sheet [data-m="reward"][data-i="0"]'); };
  const pick = async (i, label) => { await tap(`#mzr [data-r="acard"][data-i="${i}"]`); if (label) await shot(label); await p.waitForTimeout(300); await tap('#mzr [data-r="aok"]'); };
  // ---- 자유: 침입 1 뒤 첫 깨어남
  await tap('[data-z="free"]'); await p.waitForTimeout(300); await raid();
  let A = await rd(); if (!A || A.awaken !== 1 || A.offer.length !== 3) bad.push('침입 1 뒤 깨어남 고르기가 없다 ' + JSON.stringify(A)); await shot('awaken1');
  { const r = await ev(() => { const s = MAZE.raid(__maze.M); return s.ok ? 'ok' : s.msg; }); if (r !== '깨어남을 먼저 고른다') bad.push('깨어남 전에 침입이 막히지 않는다 ' + r); }
  await tap('#mzr [data-r="acard"][data-i="0"]'); { const d = await ev(() => ({ info: (document.querySelector('#mzr .mza-info') || {}).textContent || '', ok: !!document.querySelector('#mzr [data-r="aok"]') })); if (!/상점 몫/.test(d.info) || !/받는 것/.test(d.info) || !d.ok) bad.push('깨어남 설명 판이 맞지 않다 ' + JSON.stringify(d)); } await shot('awaken1_info');
  // 고르는 중 저장 · 이어하기: 같은 셋
  await p.reload(); await p.waitForTimeout(500); await tap('[data-z="free"]'); await p.waitForTimeout(300); { const B = await rd(); if (!B || B.awaken !== 1 || B.offer.join() !== A.offer.join()) bad.push('깨어남 고르는 중에서 이어지지 않는다 ' + JSON.stringify(B)); }
  const form1 = A.offer[1]; await tap('#mzr [data-r="acard"][data-i="1"]'); await p.waitForTimeout(300); await tap('#mzr [data-r="aok"]'); await p.waitForTimeout(550); await shot('awaken1_morph', true);
  await p.waitForTimeout(1200); { const r = await rd(); if (!r || r.q !== 'awaken') bad.push('깨어남 장면이 열리지 않는다 ' + JSON.stringify(r)); } for (let i = 0; i < 3; i++) await tap('#mzr .mzr-lines'); await shot('awaken1_scene');
  // 장면 중 저장 · 이어하기
  { const r0 = await rd(); await p.reload(); await p.waitForTimeout(500); await tap('[data-z="free"]'); await p.waitForTimeout(300); const r1 = await rd(); if (!r1 || r1.q !== 'awaken' || r1.l !== r0.l) bad.push('깨어남 장면 중간에서 이어지지 않는다 ' + JSON.stringify({ r0, r1 })); }
  await skipAw(); { const c = await ev(() => __maze.view().core); if (c.form !== form1 || c.realStep !== 1 || c.max !== 3) bad.push('지도의 본체가 새 모습이 아니다 ' + JSON.stringify({ form: c.form, step: c.realStep, max: c.max })); }
  await shot('map_body1');
  { const pt = await ev(() => __maze.pt('core')); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250); const t = await ev(() => (document.querySelector('#mz-sheet') || {}).textContent || ''); if (!/Lv/.test(t) || !/권속 \d\/3/.test(t)) bad.push('본체 방 창에 모습·기술·자리가 없다 ' + t.slice(0, 80)); await shot('core_sheet'); await tap('#mz-sheet [data-m="close"]'); }
  // 상점의 모습 권속 표지
  { await ev(() => { const M = __maze.M, k = __maze.view().core.kin[0]; M.shop[0] = k; M.gold = 30; __maze.redraw(); }); await tap('#mz-bench [data-m="shopt"]'); if (!(await p.$('#mz-shop .mz-card.formk'))) bad.push('상점에 모습 권속 표지가 없다'); await shot('shop_formkin'); await tap('#mz-bench [data-m="shopt"]'); }
  // 침입 2, 3 → 둘째 깨어남: 그대로 키운다
  await raid(); await raid(); A = await rd(); if (!A || A.awaken !== 2 || A.offer[0] !== form1) bad.push('침입 3 뒤 둘째 깨어남(첫째 = 지금 모습)이 없다 ' + JSON.stringify(A));
  { const t = await ev(() => Array.from(document.querySelectorAll('#mzr .mza-card em')).map(e => e.textContent)); if (t[0] !== '그대로 키운다' || !t.slice(1).every(x => /갈아탄다/.test(x))) bad.push('둘째 깨어남 표시가 맞지 않다 ' + JSON.stringify(t)); } await shot('awaken2');
  await pick(0, 'awaken2_keep'); await p.waitForTimeout(1700); await skipAw(); { const c = await ev(() => __maze.view().core); if (c.form !== form1 || c.realStep !== 2 || c.mixed) bad.push('그대로 키운 몸이 아니다 ' + JSON.stringify(c)); } await shot('map_body2');
  // ---- 다른 판: 갈아탄다 (섞인 몸)
  await ev(() => { const b = document.querySelector('#mz-bar [data-m="menu"]'); b.click(); }); await p.waitForTimeout(150); await tap('#mz-sheet [data-m="home"]'); await tap('[data-z="freeNew"]'); await tap('#modal [data-z="newYes"]'); await p.waitForTimeout(300);
  await raid(); await pick(0); await p.waitForTimeout(1700); await skipAw(); const f0 = await ev(() => __maze.view().core.form); await raid(); await raid(); A = await rd();
  await pick(1, 'awaken2_mix_info'); await p.waitForTimeout(1700); { const r = await rd(); if (!r || r.q !== 'awaken' || !r.mixed && false) bad.push('갈아탄 장면이 없다'); await shot('awaken2_mix_scene'); } await skipAw();
  { const c = await ev(() => __maze.view().core); if (!c.mixed || c.prev !== f0 || c.form !== A.offer[1]) bad.push('갈아탄 몸이 아니다 ' + JSON.stringify({ c: [c.form, c.prev, c.mixed], f0 })); }
  // ---- 이야기: 2장 끝에 깨어남, 고른 뒤 3장
  await ev(() => { const b = document.querySelector('#mz-bar [data-m="menu"]'); b.click(); }); await p.waitForTimeout(150); await tap('#mz-sheet [data-m="home"]'); await tap('[data-z="story"]');
  let guard = 0, storyAw = null, ch3 = false;
  while (guard++ < 200) {
    const st = await ev(() => { const r = __maze.read(), M = __maze.M; return { r, ch: M.chapter, phase: M.phase, sheet: __maze.Z.sheet && __maze.Z.sheet.kind }; });
    if (st.r && st.r.awaken) { storyAw = st; if (st.ch !== 2 || st.phase !== 'chapterEnd') bad.push('이야기 깨어남이 2장 끝이 아니다 ' + JSON.stringify(st)); await shot('story_awaken'); await pick(2); await p.waitForTimeout(1700); await skipRead(); continue; }
    if (st.r && st.r.card != null) { if (st.r.card === 3) { ch3 = true; break; } await tap('#mzr'); continue; }
    if (st.r && st.r.night) { await tap('#mzr [data-r="nskip"]'); await tap('#mzr [data-r="nnext"]'); continue; }
    if (st.r && st.r.q) { const sk = await p.$('#mzr [data-r="skipall"]:not([hidden])'); if (sk) await sk.click(); else await skipRead(); continue; }
    if (st.sheet === 'result') { await tap('#mz-sheet [data-m="next"]'); continue; }
    if (st.sheet === 'reward') { await tap('#mz-sheet [data-m="reward"][data-i="0"]'); continue; }
    if (st.sheet) { await ev(() => { const c = document.querySelector('#mz-sheet [data-m="close"]'); if (c) c.click(); }); continue; }
    if (st.phase === 'prep') { await ev(() => { const c = document.querySelector('#mz-coach [data-m="guideok"]'); if (c) c.click(); const M = __maze.M; M.egg = M.eggMax; if (!(M.board.core || []).length) __maze.give('maw', 3, 'core'); __maze.redraw(); }); await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(150); await ev(() => __maze.skip()); await p.waitForTimeout(250); continue; }
    await p.waitForTimeout(150);
  }
  if (!storyAw) bad.push('이야기에서 깨어남을 보지 못했다'); if (!ch3) bad.push('깨어난 뒤 3장으로 넘어가지 않았다'); else { const c = await ev(() => __maze.view().core); if (c.realStep !== 1) bad.push('3장의 본체가 1단계가 아니다 ' + JSON.stringify(c)); }
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1); console.log('깨어남 시험 통과');
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
