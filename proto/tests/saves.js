// 저장본 시험: 상한 저장본을 넣어도 첫 화면이 뜨고, 상한 판은 치워지고, 이어하기가 된다. 밤 도중에 꺼도 그날 낮으로 돌아가지 않는다.
// node tests/saves.js
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const bad = [];
const ok = (c, m) => { if (!c) bad.push(m); console.log((c ? '통과 ' : '실패 ') + m); };
(async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(); let errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|bad run/.test(m.text())) errs.push('console: ' + m.text().slice(0, 140)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  const load = async (items) => { await p.goto('http://nest.test/'); await p.evaluate(items => { localStorage.clear(); for (const k in items) localStorage.setItem('oldnest.' + k, items[k]); }, items || {}); errs = []; await p.reload(); await p.waitForTimeout(500); };
  const title = () => p.evaluate(() => ({ shown: !document.getElementById('title').hidden, deck: !!document.querySelector('#menu [data-a="deck"]'), cont: !!document.querySelector('#menu [data-a="continue"]'), ccont: !!document.querySelector('#menu [data-a="ccont"]'), warn: (document.querySelector('#menu .warnc') || {}).textContent || '' }));
  const J = JSON.stringify;

  // 1) 전체 기록이 상한 여러 모양
  const metas = { 'codex null': J({ runs: 3, codex: null }), '깨진 글': '{"runs":', '숫자': '42', '배열': '[1,2]', '칸마다 이상': J({ runs: 'x', roster: 'x', board: null, story: 5, cards: 'x', howto: [], codex: { forms: null, muts: 3 }, best: 7, speed: null }), '카드 기록 이상': J({ cards: { eggs: 'x', forms: null, unlocked: 5 }, story: { clear: null } }) };
  for (const k in metas) { await load({ meta: metas[k] }); const t = await title(); ok(t.shown && t.deck && !errs.length, '전체 기록 「' + k + '」: 첫 화면이 뜬다' + (errs.length ? ' / ' + errs[0] : '')); }
  // 그 상태로 카드 판 시작 화면도 열린다
  await load({ meta: metas['카드 기록 이상'] }); await p.click('#menu [data-a="deck"]'); await p.waitForTimeout(400); ok(!errs.length, '이상한 카드 기록으로도 카드 시작 화면이 열린다' + (errs.length ? ' / ' + errs[0] : ''));

  // 2) 판 저장이 상한 경우: 치워지고 한 줄 알림, 이어하기 단추는 없다
  const runs = { '깨진 글': '{"day":', '칸 없음': J({ day: 3, kin: [], gold: 5 }), '칸이 null': J({ day: 3, cells: null }) };
  for (const k in runs) { await load({ run: runs[k] }); const t = await title(); const aside = await p.evaluate(() => localStorage.getItem('oldnest.run.bad') != null && localStorage.getItem('oldnest.run') == null); ok(t.shown && !t.cont && /저장본이 상하여/.test(t.warn) && aside && !errs.length, '판 저장 「' + k + '」: 치워 두고 알린다'); }
  const cruns = { '깨진 글': '{"G":', '덱이 이상': J({ G: { day: 2 }, deck: 'x' }), '카드 하나 null': null };
  for (const k in cruns) { if (!cruns[k]) continue; await load({ cardrun: cruns[k] }); const t = await title(); const aside = await p.evaluate(() => localStorage.getItem('oldnest.cardrun.bad') != null && localStorage.getItem('oldnest.cardrun') == null); ok(t.shown && !t.ccont && /저장본이 상하여/.test(t.warn) && aside && !errs.length, '카드 판 저장 「' + k + '」: 치워 두고 알린다'); }

  // 3) 멀쩡한 카드 판: 첫 화면 이어하기가 정문
  await load({}); await p.click('#menu [data-a="deck"]'); await p.waitForTimeout(300); await p.click('[data-c="begin"]'); await p.waitForTimeout(700);
  await p.reload(); await p.waitForTimeout(500); let t = await title(); ok(t.ccont && t.deck, '카드 판을 하다 껐다 켜면 첫 화면에 이어하기가 있다');
  const first = await p.evaluate(() => { const b = document.querySelector('#menu .btn'); return b ? b.dataset.a : ''; }); ok(first === 'ccont', '첫 단추가 카드 판 이어하기다 (' + first + ')');
  await p.click('#menu [data-a="ccont"]'); await p.waitForTimeout(700); ok(await p.evaluate(() => !document.getElementById('game').hidden && !!(window.__nest && __nest.G && __nest.G.cardMode)) && !errs.length, '카드 판 이어하기가 된다' + (errs.length ? ' / ' + errs[0] : ''));
  // 카드 하나만 상한 저장본
  await p.evaluate(() => { const r = JSON.parse(localStorage.getItem('oldnest.cardrun')); r.deck[0] = null; localStorage.setItem('oldnest.cardrun', JSON.stringify(r)); }); errs = []; await p.reload(); await p.waitForTimeout(500); t = await title(); ok(!t.ccont && /저장본이 상하여/.test(t.warn) && !errs.length, '카드 한 장이 상한 카드 판도 치워 두고 알린다');

  // 4) 옛 방식: 밤 도중에 끄면 같은 밤으로 바로 들어간다 (그날 낮을 다시 할 수 없다)
  await load({ meta: J({ tutDone: true, howto: { free: 1, story: 1, card: 1 } }) });
  await p.click('#menu [data-a="new"]'); await p.waitForTimeout(300); await p.click('#modal [data-a="close"][data-v="go"]'); await p.waitForTimeout(400);
  for (let i = 0; i < 8 && await p.$('[data-a="sceneskip"]'); i++) { await p.click('[data-a="sceneskip"]').catch(() => {}); await p.waitForTimeout(250); }
  for (let i = 0; i < 4 && !(await p.evaluate(() => !document.getElementById('modal').hidden)) === false; i++) { await p.click('#modal [data-a="close"]').catch(() => {}); await p.waitForTimeout(200); }
  const day0 = await p.evaluate(() => __nest.G.day);
  await p.evaluate(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' })); }); await p.waitForTimeout(150); await p.evaluate(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' })); }); await p.waitForTimeout(600);
  const night = await p.evaluate(() => __nest.ST.mode === 'night'); const lock = await p.evaluate(() => (JSON.parse(localStorage.getItem('oldnest.run')) || {}).nightLock);
  ok(night && lock === day0, '밤이 시작되면 저장본에 밤 표시가 남는다 (' + lock + ')');
  errs = []; await p.reload(); await p.waitForTimeout(500); t = await title(); ok(t.cont, '밤 도중에 끄고 켜도 이어하기가 있다');
  await p.click('#menu [data-a="continue"]'); await p.waitForTimeout(900);
  const back = await p.evaluate(() => ({ night: __nest.ST.mode === 'night', day: __nest.G.day }));
  ok(back.night && back.day === day0 && !errs.length, '이어하기를 누르면 낮을 건너뛰고 같은 밤으로 들어간다' + (errs.length ? ' / ' + errs[0] : ''));

  // 5) 데이터 초기화는 판 안의 설정에서도 닿는다
  await p.evaluate(() => { __nest.ST.skip = true; }); for (let i = 0; i < 40 && await p.evaluate(() => __nest.ST.mode === 'night'); i++) { await p.evaluate(() => { const g = document.querySelector('#hand [data-a="hand"][data-v="none"], #hand .btn.pri'); if (g) g.click(); }); await p.waitForTimeout(300); }
  for (let i = 0; i < 6 && await p.evaluate(() => !document.getElementById('modal').hidden); i++) { await p.click('#modal .btn.pri, #modal [data-a="close"]').catch(() => {}); await p.waitForTimeout(250); }
  await p.click('#hud [data-a="menu"]').catch(() => {}); await p.waitForTimeout(300); await p.click('#modal [data-a="settings"]').catch(() => {}); await p.waitForTimeout(300);
  const hasWipe = await p.evaluate(() => !!document.querySelector('#modal [data-a="wipe"]'));
  ok(hasWipe, '판 안 설정에 「데이터 초기화」가 있다');
  if (hasWipe) { await p.click('#modal [data-a="wipe"]'); await p.click('#modal [data-a="wipe"]'); await p.waitForTimeout(400); t = await title(); const left = await p.evaluate(() => ['meta', 'run', 'cardrun'].filter(k => localStorage.getItem('oldnest.' + k) && k !== 'meta')); ok(t.shown && !t.cont && !left.length, '데이터 초기화를 두 번 누르면 판이 지워지고 첫 화면으로 간다'); }

  await b.close();
  console.log(bad.length ? '실패 ' + bad.length : '모두 통과');
})();
