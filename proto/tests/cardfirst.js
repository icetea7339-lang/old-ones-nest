// 처음 하는 사람처럼 카드 판을 6일째까지: 기본값으로 시작, 손의 카드를 왼쪽부터 놓을 수 있는 대로 놓고, 밤에 멈추면 첫 기술 카드, 보상은 첫 장.
// 확인: 6일째까지 허물이 한 번 이상, 위쪽 초상이 바뀜, 오늘 밤 위험 막대가 보임, 처음 안내 말풍선이 나옴, 잘린 글·오류 없음.
// node tests/cardfirst.js [기기: 비우면 PC | "iPhone 14" | a360]   (FZ=1.3 이면 큰 글씨로)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = (dev ? dev.replace(/\s+/g, '') : 'pc') + (FZM.FZ ? '_fz' + FZM.FZ : ''), out = path.join(__dirname, 'cardfirst_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0; const shot = async label => { await p.waitForTimeout(350); await p.evaluate(() => { document.querySelectorAll('#left, #game, #handbar').forEach(e => { e.scrollLeft = 0; }); }); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); const cl = await p.evaluate(FZM.clipScript); cl.forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(140); };
  const seen = { coach: new Set(), threat: 0, ports: new Set(), dline: 0 };
  const look = async () => { const s = await p.evaluate(() => { const c = document.getElementById('cm-coach'), t = document.querySelector('.cm-threat'), im = document.querySelector('#cm-body .cm-bimg > img'), dl = document.getElementById('cm-dline'); return { coach: c && !c.hidden ? c.dataset.id : null, threat: !!(t && t.getBoundingClientRect().width), port: im ? im.getAttribute('src').slice(-40) : null, dline: !!(dl && !dl.hidden) }; }); if (s.coach) seen.coach.add(s.coach); if (s.threat) seen.threat++; if (s.port) seen.ports.add(s.port); if (s.dline) seen.dline++; };
  const tapCell = async i => { await p.evaluate(i => __card.cam(i), i); await p.waitForTimeout(250); const pt = await p.evaluate(i => __card.pt(i), i); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(160); };

  await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(400);
  await shot('title');
  await tap('[data-a="deck"]'); await shot('start');
  await tap('[data-c="begin"]'); await p.evaluate(() => { __card.ST.speed = 4; }); await look(); await shot('day1');
  // 키보드 (PC): 1 고르기 · Esc 내려놓기 · Space 밤 맞기 창 · Esc 닫기
  if (!dev) { await p.keyboard.press('1'); const s1 = await p.evaluate(() => __card.CMU.sel); await p.keyboard.press('Escape'); const s2 = await p.evaluate(() => __card.CMU.sel);
    if (s1 == null || s2 != null) bad.push('1·Esc 로 카드를 고르고 내려놓지 못했다');
    await p.keyboard.press(' '); await p.waitForTimeout(250); const kv = await p.evaluate(() => !!document.querySelector('#cm-ov [data-c="go"]')); await p.keyboard.press('Escape'); await p.waitForTimeout(150); const kc = await p.evaluate(() => document.getElementById('cm-ov').hidden);
    if (!kv || !kc) bad.push('Space 로 밤 맞기 창이 열리고 Esc 로 닫히지 않았다'); }
  let molts = 0, day = 0, locked = false;
  for (let guard = 0; guard < 12; guard++) {
    const st = await p.evaluate(() => ({ day: __card.run.G.day, over: !!__card.run.G.over, phase: __card.run.phase })); if (st.over || st.day > 6) break; day = st.day;
    // 손의 카드를 왼쪽부터: 누르고 → 놓을 곳 → 놓기
    for (let k = 0; k < 8; k++) {
      const v = await p.evaluate(() => { const hv = __card.CARDMODE.handView(__card.run); const x = hv.find(v => v.can && v.type !== 'skill' && v.type !== 'curse'); return x ? { uid: x.uid, target: x.target, cell: x.cellsCan && x.cellsCan[0], place: x.places && x.places[0] && x.places[0][0] } : null; }); if (!v) break;
      await p.evaluate(uid => { const el = document.querySelector(`#chand [data-c="card"][data-uid="${uid}"]`), st = el && el.closest('.cm-strip'); if (st) st.scrollLeft = Math.max(0, el.offsetLeft - st.clientWidth / 2 + el.offsetWidth / 2); }, v.uid);
      await tap(`#chand [data-c="card"][data-uid="${v.uid}"]`); await look();
      if (v.target === 'shape' && v.place != null) { await tapCell(v.place); await look(); if (await p.$('#chand [data-c="put"]')) await tap('#chand [data-c="put"]'); }
      else if (v.target === 'cell' && v.cell != null) await tapCell(v.cell);
      else if (await p.$('#chand [data-c="put"]')) await tap('#chand [data-c="put"]');
      await look();
      const still = await p.evaluate(uid => __card.run.hand.includes(uid), v.uid); if (still) { await p.evaluate(() => __card.select(null)); break; }
    }
    await look(); await shot('day' + day + '_built');
    if (day === 1) { await tap('[data-c="body"]'); await shot('body_sheet'); await tap('#cm-sheet [data-c="close"]'); }
    if (await p.$('.cm-threat')) { await tap('.cm-threat'); await shot('day' + day + '_threat'); await tap('#cm-sheet [data-c="close"]'); }
    // 밤
    await tap('#mnav [data-c="night"]');
    if (await p.$('#cm-ov [data-c="go"]')) { await shot('day' + day + '_keep'); await tap('#cm-ov [data-c="go"]'); }
    // 밤 한가운데에 끄고 다시 켜도 그날 밤으로 곧장 들어간다 (낮을 다시 짤 수 없다) — PC 에서 한 번
    if (!dev && day === 2 && !locked) { locked = true; await p.waitForTimeout(700); const lk = await p.evaluate(() => JSON.parse(localStorage.getItem('oldnest.cardrun') || 'null')); if (!lk || !lk.nightLock || lk.nightLock.day !== 2) bad.push('밤 잠금이 저장되지 않았다');
      await p.reload(); await p.waitForTimeout(500); await tap('[data-a="ccont"]'); await p.waitForTimeout(900); const nm = await p.evaluate(() => ({ mode: __card.ST.mode, day: __card.run && __card.run.G.day })); if (nm.mode !== 'night' || nm.day !== 2) bad.push('이어하기가 그날 밤으로 들어가지 않았다 ' + JSON.stringify(nm)); await p.evaluate(() => { __card.ST.speed = 4; }); }
    const t0 = Date.now(); let asked = 0;
    while (Date.now() - t0 < 120000) {
      await p.waitForTimeout(250); await look();
      if (await p.evaluate(() => !document.getElementById('hand').hidden)) { asked++; if (asked === 1) await shot('night' + day + '_ask'); const cb = await p.$('#hand .cm-cbtn:not([disabled])'); if (cb) { await cb.click(); await p.waitForTimeout(200); if (await p.$('#hand [data-a="handback"]')) { const tg = await p.$('#hand [data-a="handpick"]'); if (tg) await tg.click(); else await tap('#hand [data-a="handback"]'); } } else await tap('#hand [data-a="hand"][data-k="none"]'); continue; }
      if (await p.evaluate(() => !document.getElementById('modal').hidden)) { await shot('night' + day + '_settle'); await tap('#modal [data-a="close"]'); break; }
    }
    await p.waitForTimeout(500);
    if (await p.$('#cm-ov [data-c="moltok"]')) { molts++; await shot('molt' + molts); await p.waitForTimeout(1600); await shot('molt' + molts + '_after'); await tap('#cm-ov [data-c="moltok"]'); await p.waitForTimeout(300); }
    if (await p.$('#cm-ov [data-c="reward"]')) { await look(); await shot('reward' + day); await tap('#cm-ov [data-c="reward"][data-i="0"]'); }
    await p.waitForTimeout(400); await look();
    if (await p.$('#cm-dline:not([hidden])')) await shot('day' + (day + 1) + '_change');
    if (await p.$('#cm-ov [data-c="again"], #cm-ov [data-c="egg-lay"]')) break;
  }
  const end = await p.evaluate(() => ({ day: __card.run ? __card.run.G.day : null, molts: __card.run ? (__card.run.molts || []).length : null, over: __card.run ? !!__card.run.G.over : null }));
  await shot('end');
  if (!molts && !(end.molts > 0)) bad.push('6일째까지 허물이 없었다');
  if (seen.ports.size < 2) bad.push('위쪽 초상이 바뀌지 않았다');
  if (!seen.threat) bad.push('오늘 밤 위험이 보이지 않았다');
  if (seen.coach.size < 3) bad.push('처음 안내가 거의 나오지 않았다 (' + [...seen.coach].join(',') + ')');
  console.log(tag, '날', end.day, '· 허물', molts + '/' + end.molts, '· 초상', seen.ports.size, '가지 · 위험 막대', seen.threat, '· 아침 바뀜', seen.dline, '· 안내', [...seen.coach].join(','));
  console.log(tag, bad.length ? '문제 ' + bad.length + '\n  ' + bad.slice(0, 30).join('\n  ') : '통과', errs.length ? '\n오류 ' + errs.slice(0, 5).join('\n') : '· no errors');
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})();
