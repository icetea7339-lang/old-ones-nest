// 붐비는 밤의 그리기 속도: 적 60 쯤이 한꺼번에 드는 밤을 억지로 만들고, CPU 를 4배 느리게 하여 초당 그림 수를 잰다.
// 확인: 초당 30 이상, 한 칸에 겹친 무리는 수 꼬리표(+N)로 줄여 그린다, 오류 없음.
// node tests/perf.js [기기: 비우면 PC | "iPhone 14"]
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'perf_' + tag); fs.mkdirSync(out, { recursive: true });
const RATE = +(process.env.RATE || 4), WANT = +(process.env.WANT || 30), CROWD = +(process.env.CROWD || 60);
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const tap = async sel => { if (!(await p.$(sel))) throw new Error('없음: ' + sel); await p.click(sel, { timeout: 8000 }); await p.waitForTimeout(140); };
  await tap('[data-a="deck"]'); await tap('[data-c="begin"]'); await p.waitForTimeout(500);
  await p.evaluate(() => { const m = __card.meta; m.tutOff = true; __card.META.pause = 'never'; });
  // 손의 굴 카드를 모두 놓아 무리가 흩어질 칸을 만든다
  for (let i = 0; i < 8; i++) {
    const v = await p.evaluate(() => { const x = __card.CARDMODE.handView(__card.run).find(v => v.can && v.type === 'shape' && v.places && v.places[0]); return x ? { uid: x.uid } : null; }); if (!v) break;
    const ok = await p.evaluate(uid => { const hv = __card.CARDMODE.handView(__card.run).find(x => x.uid === uid); return __card.CARDMODE.play(__card.run, uid, { cells: hv.places[0] }).ok; }, v.uid); if (!ok) break;
  }
  // 오늘 밤 무리를 크게: 예산을 크게, 머릿수 상한을 CROWD 로
  await p.evaluate(n => { NEST.K.card.cap = n; NEST.K.card.curve = [40, 0, 0]; const G = __card.run.G; G.march.tonight = { vill: 'field', settle: false }; }, CROWD);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await tap('#mnav [data-c="night"]'); if (await p.$('#cm-ov [data-c="go"]')) await tap('#cm-ov [data-c="go"]');
  await p.evaluate(() => { __card.ST.speed = 1; });
  // 무리가 무대에 오를 때까지 기다린다
  const t0 = Date.now(); let party = 0; while (Date.now() - t0 < 20000) { await p.waitForTimeout(300); party = await p.evaluate(() => { const b = __card.run.G.lastBattle || (__card.ST.night && __card.ST.night.battle); return b && b.party ? b.party.length : 0; }).catch(() => 0); if (party || (await p.evaluate(() => __card.ST.mode === 'night'))) break; }
  await p.waitForTimeout(1500);
  const fps = await p.evaluate(ms => new Promise(res => { let n = 0, worst = 0, last = performance.now(); const t0 = last; const f = t => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else res({ fps: n * 1000 / (t - t0), worst: Math.round(worst) }); }; requestAnimationFrame(f); }), 5000);
  const seen = await p.evaluate(() => ({ party: (() => { const b = __card.run.G.lastBattle; return b && b.party ? b.party.length : null; })(), badge: (__card.ST.drawn || {}).hid || 0, drawn: (__card.ST.drawn || {}).inv || 0, mode: __card.ST.mode }));
  await p.screenshot({ path: path.join(out, '1_crowd.png') });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  if (fps.fps < WANT) bad.push(`초당 ${fps.fps.toFixed(1)} 그림 (${WANT} 아래)`);
  if (errs.length) bad.push('오류: ' + errs.slice(0, 3).join(' | '));
  console.log(tag, `CPU ×${RATE} · 초당 ${fps.fps.toFixed(1)} · 가장 긴 틈 ${fps.worst}ms · 무대의 적 ${seen.drawn} (수로 줄인 것 ${seen.badge}) · ${seen.mode}`);
  console.log(tag, bad.length ? '문제 ' + bad.length + '\n  ' + bad.join('\n  ') : '통과');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
