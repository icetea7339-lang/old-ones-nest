// 끝없는 자유 · 오늘의 판 시험: 첫 화면(오늘의 판 · 날짜, 자유의 최고 기록), 오늘의 판은 같은 날 같은 처음 상점(다른 날은 다름),
// 판 끝 점수 판(버틴 침입 · 알 · 쓰러뜨림 · 막음/깎임 칸), 결과 복사 글, 하루 한 번 기록(다시 해도 첫 판만), 저장 셋(이야기 · 자유 · 오늘의 판)이 섞이지 않음
// node tests/mazedaily.js [기기: 비우면 "iPhone 14" | a360 | pc]   (큰 글씨: FZ=1.3)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-MAZE.html'), 'utf8');
const dev = process.argv[2] === 'pc' ? '' : process.argv[2] || 'iPhone 14', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'mazedaily_' + tag + (FZM.FZ ? '_fz' + FZM.FZ : '')); fs.mkdirSync(out, { recursive: true });
const DAY = '2026-11-23', DAY2 = '2026-11-24';
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), errs = [], bad = [];
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const p = await ctx.newPage(); p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.addInitScript(d => { window.__mazeToday = sessionStorage.getItem('day') || d; }, DAY); if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const ev = (f, a) => p.evaluate(f, a);
  const shot = async (label, noclip) => { n++; await p.waitForTimeout(150); await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); if (noclip) return; (await ev(FZM.clipScript)).forEach(t => bad.push(label + ': ' + t)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(140); };
  const home = async () => { await ev(() => document.querySelector('#mz-bar [data-m="menu"]').click()); await p.waitForTimeout(150); await tap('#mz-sheet [data-m="home"]'); };
  const awakenIf = async () => { const r = await ev(() => __maze.read()); if (!r || !r.awaken) return; await tap('#mzr [data-r="acard"][data-i="0"]'); await p.waitForTimeout(300); await tap('#mzr [data-r="aok"]'); await p.waitForTimeout(1900); await p.waitForTimeout(1600); await tap('#mzr [data-r="skipall"]'); await p.waitForTimeout(200); };
  // 침입 하나를 넘기기로. brk 면 알을 0 으로 두어 끝낸다
  const raid = async brk => { await ev(k => { const M = __maze.M; M.egg = k ? 0 : M.eggMax; if (!(M.board.core || []).length) __maze.give('maw', 3, 'core'); __maze.redraw(); }, brk); await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(150); await ev(() => __maze.skip()); await p.waitForTimeout(300); if (brk) return; await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(200); await awakenIf(); if (await p.$('#mz-sheet [data-m="reward"]')) await tap('#mz-sheet [data-m="reward"][data-i="0"]'); };
  // 첫 화면
  { const t = await ev(() => (document.querySelector('[data-z="daily"]') || {}).textContent || ''); if (!/오늘의 판 · 11월 23일/.test(t)) bad.push('첫 화면에 오늘의 판이 없다 ' + t); } await shot('title');
  // 오늘의 판: 같은 날 같은 처음 상점
  await tap('[data-z="daily"]'); await p.waitForTimeout(300); const shop1 = await ev(() => ({ shop: __maze.M.shop.join(), daily: __maze.M.daily, endless: __maze.view().endless })); if (shop1.daily !== DAY || !shop1.endless) bad.push('오늘의 판이 그날의 끝없는 판이 아니다 ' + JSON.stringify(shop1));
  await shot('daily_map');
  { const s2 = await ev(d => MAZE.newDaily(d).shop.join(), DAY), s3 = await ev(d => MAZE.newDaily(d).shop.join(), DAY2); if (s2 !== shop1.shop) bad.push('같은 날인데 처음 상점이 다르다'); if (s3 === shop1.shop) bad.push('다른 날인데 처음 상점이 같다'); }
  // 저장 셋: 오늘의 판 하나 · 자유 하나 · 이야기 하나
  await raid(false); const dRaid = await ev(() => __maze.M.raid); await home();
  await tap('[data-z="free"]'); await p.waitForTimeout(300); { const m = await ev(() => ({ daily: __maze.M.daily, raid: __maze.M.raid })); if (m.daily || m.raid !== 1) bad.push('자유가 오늘의 판과 섞였다 ' + JSON.stringify(m)); } await raid(false); await home();
  await tap('[data-z="story"]'); await p.waitForTimeout(300); await tap('#mzr'); await ev(() => __maze.redraw()); await p.reload(); await p.waitForTimeout(500);
  { const t = await ev(() => ({ st: (document.querySelector('[data-z="story"] small') || {}).textContent || '', fr: (document.querySelector('[data-z="free"] small') || {}).textContent || '', dl: (document.querySelector('[data-z="daily"] small') || {}).textContent || '' })); if (!/이어하기/.test(t.st) || !/침입 2/.test(t.fr) || !new RegExp('침입 ' + dRaid).test(t.dl)) bad.push('세 저장이 따로 남지 않는다 ' + JSON.stringify(t)); await shot('title_three'); }
  await tap('[data-z="daily"]'); await p.waitForTimeout(300); { const m = await ev(() => ({ daily: __maze.M.daily, raid: __maze.M.raid })); if (m.daily !== DAY || m.raid !== dRaid) bad.push('오늘의 판 이어하기가 맞지 않다 ' + JSON.stringify(m)); }
  // 오늘의 판을 끝까지: 침입 4까지 버티고 다섯째에 알이 깨진다 → 점수 판, 하루 한 번 기록, 결과 복사
  while ((await ev(() => __maze.M.raid)) < 5) await raid(false);
  { const d = await ev(() => ({ boss: __maze.view().next.boss, name: __maze.view().next.name, bar: document.getElementById('mz-bar').textContent, mark: !!document.querySelector('#mz-bar .mz-rd.boss'), narrow: innerWidth < 380 && !!window.__fz })); if (!d.boss || !d.mark || !(d.bar.includes(d.name) || d.narrow)) bad.push('우두머리 침입의 위 띠에 무리 이름이 없다 ' + JSON.stringify(d)); await shot('boss_bar'); }
  await raid(true); await p.waitForTimeout(400);
  { const d = await ev(() => ({ box: (document.querySelector('#mz-sheet .mz-score') || {}).textContent || '', marks: (document.querySelector('#mz-sheet .mz-marks') || {}).textContent || '', rec: __maze.meta.mazeDaily && __maze.meta.mazeDaily['2026-11-23'] })); if (!/버틴 침입/.test(d.box) || !/^[□■]+$/.test(d.marks) || !d.rec || d.rec.raids !== 4) bad.push('오늘의 판 점수 판·기록이 맞지 않다 ' + JSON.stringify(d)); }
  await shot('score_daily');
  await tap('#mz-sheet [data-m="copy"]'); await p.waitForTimeout(300); { const t = await ev(() => __maze.copied()); if (!/^굴 짓기 · 오늘의 판 11월 23일 · 침입 4 버팀 · 알 0\n[□■]+$/.test(t || '') || /http|www/.test(t || '')) bad.push('결과 복사 글이 맞지 않다 ' + JSON.stringify(t)); const shown = await ev(() => !document.getElementById('mz-copybox').hidden), clip = await ev(() => (navigator.clipboard ? navigator.clipboard.readText().catch(() => null) : null)); if (clip !== t && !shown) bad.push('복사도 안 되고 글도 보이지 않는다'); }
  await shot('copy');
  // 다시 해도 기록은 첫 판만
  await tap('#mz-sheet [data-m="again"]'); await p.waitForTimeout(300); await raid(false); await raid(true); await p.waitForTimeout(300); { const r = await ev(() => __maze.meta.mazeDaily['2026-11-23'].raids); if (r !== 4) bad.push('다시 한 오늘의 판이 기록을 바꿨다 ' + r); const t = await ev(() => document.getElementById('mz-sheet').textContent); if (!/첫 판/.test(t)) bad.push('다시 한 판에 첫 판 기록 안내가 없다'); }
  await tap('#mz-sheet [data-m="home"]'); { const t = await ev(() => (document.querySelector('[data-z="daily"] small') || {}).textContent || ''); if (!/침입 4 버팀 · 알 0 · 내일 다시/.test(t)) bad.push('오늘 끝낸 판의 점수·내일 다시가 없다 ' + t); } await shot('title_done');
  // 다음 날: 새 판
  await ev(d => sessionStorage.setItem('day', d), DAY2); await p.reload(); await p.waitForTimeout(400); { const t = await ev(() => (document.querySelector('[data-z="daily"]') || {}).textContent || ''); if (!/11월 24일/.test(t) || /내일 다시/.test(t)) bad.push('다음 날의 오늘의 판이 새로 열리지 않는다 ' + t); }
  // 자유: 최고 기록 (자유 판을 끝내면 첫 화면에)
  await tap('[data-z="free"]'); await p.waitForTimeout(300); await raid(true); await p.waitForTimeout(300); { const d = await ev(() => ({ best: (document.querySelector('#mz-sheet .mz-best') || {}).textContent || '', m: __maze.meta.mazeBest })); if (!/기록/.test(d.best) || !d.m) bad.push('자유의 최고 기록이 없다 ' + JSON.stringify(d)); } await shot('score_free');
  await tap('#mz-sheet [data-m="home"]'); { const t = await ev(() => (document.querySelector('#menu .mz-ends:not(:first-of-type)') || document.querySelector('#menu') ).textContent); if (!/최고 · 침입 \d+ 버팀/.test(t)) bad.push('첫 화면에 자유의 최고 기록이 없다'); }
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1); console.log('오늘의 판 시험 통과');
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
