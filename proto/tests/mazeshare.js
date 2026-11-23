// 굴 나누기 시험: 자유 판에서 「굴 코드 복사」(두 줄, 코드만 한 줄) → 첫 화면 「들이치기」에 앞뒤 글을 섞어 붙여 넣기 → 받은 굴이 같은지
// → 일행 꾸리기(값, 다섯 제한, 빼기) → 길 미리보기가 바뀜 → 들이친다 → 결과 → 세 번 제한 → 결과 복사 글 → 시도 중 저장·이어하기 → 깨진 코드 거부 글
// node tests/mazeshare.js [기기: 비우면 "iPhone 14" | a360 | pc]   (큰 글씨: FZ=1.3)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-MAZE.html'), 'utf8');
const dev = process.argv[2] === 'pc' ? '' : process.argv[2] || 'iPhone 14', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'mazeshare_' + tag + (FZM.FZ ? '_fz' + FZM.FZ : '')); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const ev = (f, a) => p.evaluate(f, a);
  const shot = async (label, noclip) => { n++; await p.waitForTimeout(150); await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); if (noclip) return; (await ev(FZM.clipScript)).forEach(t => bad.push(label + ': ' + t)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(140); };
  const gridSig = () => ev(() => { const M = __maze.M, u = {}; Object.keys(M.board).forEach(c => { u[c] = M.board[c].map(id => M.unit[id].kind + M.unit[id].star).sort().join(); }); return JSON.stringify([M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join(), u, M.body]); });
  // ---- 자유 판: 굴을 짓고 침입 하나를 버틴 뒤 메뉴에서 굴 코드 복사
  await tap('[data-z="free"]'); await p.waitForTimeout(300);
  await ev(() => { const M = __maze.M; M.gold = 60; [11, 16, 13, 18].forEach(c => MAZE.dig(M, c)); MAZE.setUse(M, 16, 'kin', 'pool'); MAZE.setUse(M, 18, 'trap', 'tr_teeth'); __maze.give('shell', 2, 16); __maze.give('gazer', 1, 16); __maze.give('maw', 3, 'core'); __maze.redraw(); });
  await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(150); await ev(() => __maze.skip()); await p.waitForTimeout(300); await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(200);
  { const r = await ev(() => __maze.read()); if (r && r.awaken) { await tap('#mzr [data-r="acard"][data-i="0"]'); await p.waitForTimeout(300); await tap('#mzr [data-r="aok"]'); await p.waitForTimeout(3600); await tap('#mzr [data-r="skipall"]'); await p.waitForTimeout(200); } if (await p.$('#mz-sheet [data-m="reward"]')) await tap('#mz-sheet [data-m="reward"][data-i="0"]'); }
  const sig0 = await gridSig();
  await tap('#mz-bar [data-m="menu"]'); await tap('#mz-sheet [data-m="ncopy"]'); await p.waitForTimeout(300);
  const copied = await ev(() => __maze.copied()); const lines = String(copied || '').split('\n');
  if (lines.length !== 2 || !/^굴 짓기 · 내 굴 · 침입 1 버팀$/.test(lines[0]) || !/^NEST1-[0-9A-Za-z]{30,100}$/.test(lines[1])) bad.push('굴 코드 복사 글이 맞지 않다 ' + JSON.stringify(copied));
  await shot('menu_code'); await tap('#mz-sheet [data-m="home"]');
  // ---- 첫 화면 들이치기: 깨진 코드 · 코드가 아닌 글은 까닭과 함께 거부
  await tap('[data-z="attack"]'); await shot('paste');
  const pasteOpen = async t => { await p.fill('#mz-pastebox', t); await tap('[data-z="paste"]'); return ev(() => ({ why: (document.querySelector('#modal .mz-why') || {}).textContent || '', mode: __maze.M && !document.getElementById('mz').hidden ? __maze.M.mode : null })); };
  { const d = await pasteOpen('안녕하세요 굴 보냅니다'); if (d.why !== '굴 코드가 아니다' || d.mode === 'attack') bad.push('코드가 아닌 글이 거부되지 않았다 ' + JSON.stringify(d)); }
  { const broken = lines[1].slice(0, -3) + (lines[1].slice(-3) === 'zzz' ? 'yyy' : 'zzz'); const d = await pasteOpen(broken); if (!d.why || d.mode === 'attack') bad.push('깨진 코드가 거부되지 않았다 ' + JSON.stringify(d)); await shot('paste_bad'); }
  // 앞뒤 글을 섞어 붙여 넣는다
  { const d = await pasteOpen('친구가 보낸 굴이다.\n' + copied + '\n잘 해 봐'); if (d.mode !== 'attack') bad.push('붙여 넣은 글에서 코드를 읽지 못했다 ' + JSON.stringify(d)); }
  if ((await gridSig()) !== sig0) bad.push('받은 굴이 보낸 굴과 같지 않다');
  { const t = await ev(() => document.getElementById('mz-bar').textContent); if (!/받은 굴/.test(t) || !/침입 1 버팀/.test(t) || !/시도 0\/3/.test(t)) bad.push('위 띠가 맞지 않다 ' + t); }
  // 받은 굴은 고칠 수 없다: 칸을 누르면 정보만
  { const pt = await ev(() => __maze.pt(16)); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250); const d = await ev(() => ({ h: (document.querySelector('#mz-sheet h3') || {}).textContent || '', dig: !!document.querySelector('#mz-sheet [data-m="dig"], #mz-sheet [data-m="use"], #mz-sheet [data-m="fill"]') })); if (!d.h || d.dig) bad.push('받은 굴의 칸 창이 정보만이 아니다 ' + JSON.stringify(d)); await shot('acell'); await tap('#mz-sheet [data-m="close"]'); }
  // ---- 일행 꾸리기: 명단 → 설명 판 → 데려간다, 값이 빠진다, 다섯 제한, 빼기, 길 미리보기
  if (!(await p.$('#mz-shop:not([hidden]) .mz-roster'))) await tap('#mz-bench [data-m="rostert"]');
  const st = () => ev(() => { const A = __maze.view().attack; return { gold: A.gold, party: A.party.map(q => q.kind), path: __maze.view().next.path.join(), lit: __maze.dbg().path }; });
  const s0 = await st(); if (s0.party.length || s0.lit) bad.push('빈 일행인데 길을 그린다 ' + JSON.stringify(s0));
  const hire = async k => { await tap(`#mz-shop [data-m="rcard"][data-k="${k}"]`); await tap(`#mz-shop [data-m="hire"][data-k="${k}"]`); };
  await tap('#mz-shop [data-m="rcard"][data-k="militia"]'); await shot('roster_info'); await tap('#mz-shop [data-m="hire"][data-k="militia"]');
  const s1 = await st(); if (s1.party.length !== 1 || s1.gold !== s0.gold - 1 || !s1.path || !s1.lit) bad.push('데려가기가 맞지 않다 ' + JSON.stringify(s1));
  await hire('torch'); await hire('hound'); await hire('militia'); await hire('militia');
  { const d = await st(); if (d.party.length !== 5) bad.push('다섯을 채우지 못했다 ' + JSON.stringify(d)); await tap('#mz-shop [data-m="rcard"][data-k="torch"]'); if (!(await p.$('#mz-shop [data-m="hire"][disabled]'))) bad.push('여섯째를 데려갈 수 있다'); const r = await ev(() => MAZE.hire(__maze.M, 'torch')); if (r.ok || r.msg !== '일행이 찼다') bad.push('여섯째 거부 글이 맞지 않다 ' + JSON.stringify(r)); }
  await shot('party_full');
  // 빼기 (일행 칸을 누른다) · 값이 돌아온다
  { const a = await st(); await tap('#mz-bench [data-m="unhire"][data-i="4"]'); const d = await st(); if (d.party.length !== 4 || d.gold !== a.gold + 1) bad.push('빼기가 맞지 않다 ' + JSON.stringify(d)); }
  // 길잡이가 들면 길 미리보기가 바뀐다
  { const a = await st(); await hire('tracker'); const d = await st(); if (!d.party.includes('tracker')) { await tap('#mz-bench [data-m="unhire"][data-i="0"]'); await hire('tracker'); } const e = await st(); const sc = await ev(() => ({ scout: __maze.view().next.scout, drawn: __maze.dbg().scout || 0, chip: document.getElementById('mz-next').textContent })); if (!e.party.includes('tracker') || !sc.scout || !(sc.drawn > 0 || e.path !== a.path) || !/길잡이/.test(sc.chip)) bad.push('길잡이가 들어도 길 미리보기가 그대로다 ' + JSON.stringify({ a: a.path, e: e.path, sc })); await shot('party_scout'); }
  // ---- 들이친다 → 결과
  const attack = async label => { if (await p.$('#mz-shop .mz-spanel')) await tap('#mz-shop [data-m="rx"]'); await tap('#mz-bench [data-m="attack"]'); await p.waitForTimeout(400); if (label) await shot(label + '_play', true); await ev(() => __maze.skip()); await p.waitForTimeout(400);
    return ev(() => ({ sheet: __maze.Z.sheet && __maze.Z.sheet.kind, text: (document.querySelector('#mz-sheet') || {}).textContent || '', tries: __maze.view().attack.tries, big: (document.querySelector('#mz-sheet .mz-score b') || {}).textContent })); };
  { const d = await attack('atk1'); if (d.sheet !== 'attackres' || !/시도 1\/3/.test(d.text) || d.big == null || !/쓰러뜨린 권속/.test(d.text) || !/잃은 자/.test(d.text)) bad.push('들이치기 결과가 맞지 않다 ' + JSON.stringify(d)); await shot('result1'); }
  // 시도 중 저장 · 이어하기
  await tap('#mz-sheet [data-m="reform"]'); await p.reload(); await p.waitForTimeout(500);
  { const t = await ev(() => (document.querySelector('[data-z="attack"] small') || {}).textContent || ''); if (!/시도 1\/3/.test(t)) bad.push('들이치기 이어하기 글이 맞지 않다 ' + t); await tap('[data-z="attack"]'); await p.waitForTimeout(300); const d = await ev(() => ({ mode: __maze.M.mode, tries: __maze.M.attack.tries })); if (d.mode !== 'attack' || d.tries !== 1) bad.push('들이치기 이어하기가 맞지 않다 ' + JSON.stringify(d)); if ((await gridSig()) !== sig0) bad.push('이어한 받은 굴이 다르다'); }
  // 같은 일행이면 결과가 같다: 「들이친다」 곁에 한 줄. 일행을 바꾸면 사라진다
  { const t = await ev(() => { const e = document.getElementById('mz-atknote'); return e && !e.hidden ? e.textContent : ''; }); if (!/지난번과 같은 일행/.test(t)) bad.push('같은 일행 안내가 없다 ' + t); await shot('same_party');
    await tap('#mz-bench [data-m="unhire"][data-i="0"]'); const u = await ev(() => !document.getElementById('mz-atknote').hidden); if (u) bad.push('일행을 바꿨는데 같은 일행 안내가 남았다'); await tap('#mz-bench [data-m="rostert"]'); await tap('#mz-shop [data-m="rcard"][data-k="militia"]'); await tap('#mz-shop [data-m="hire"][data-k="militia"]'); }
  await attack(); await tap('#mz-sheet [data-m="reform"]'); { const d = await attack(); if (d.tries !== 3) bad.push('세 번째 시도가 아니다 ' + d.tries); if (await p.$('#mz-sheet [data-m="reform"]')) bad.push('세 번 뒤에도 「다시 꾸린다」가 있다'); await shot('result3'); }
  // 결과 복사 글
  await tap('#mz-sheet [data-m="acopy"]'); await p.waitForTimeout(300);
  { const t = String(await ev(() => __maze.copied()) || ''); const L = t.split('\n'); if (L.length !== 3 || !/^받은 굴 들이치기 · 알 \d+\/\d+ 깎음 · 일행 \d$/.test(L[0]) || !/^3번 가운데 가장 좋은 것/.test(L[1]) || L[2] !== '굴 ' + lines[1].slice(0, 12) + '…') bad.push('결과 복사 글이 맞지 않다 ' + JSON.stringify(t)); }
  await shot('result_copy');
  { const r = await ev(() => [MAZE.attack(__maze.M), MAZE.hire(__maze.M, 'militia')].map(x => x.ok ? 'ok' : x.msg)); if (r[0] !== '더 해 볼 수 없다' || r[1] !== '더 해 볼 수 없다') bad.push('세 번 뒤에도 들이칠 수 있다 ' + JSON.stringify(r)); }
  await tap('#mz-sheet [data-m="home"]');
  // 자유 판 저장은 그대로
  { const t = await ev(() => (document.querySelector('[data-z="free"] small') || {}).textContent || ''); if (!/이어하기 · 침입 2/.test(t)) bad.push('들이치기가 자유 판 저장을 건드렸다 ' + t); }
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1); console.log('굴 나누기 시험 통과');
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
