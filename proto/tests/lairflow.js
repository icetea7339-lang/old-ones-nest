// 고르는 화면(LF) 시험: 보상 → 조우(굴림 · 다시 굴림 · 결과) → 신화 단계(다시 보기 · 고르기 · 깨어남) 세 번, 정예 보상, 나가기, 저절로 고르기
// 규칙을 직접 몰아 단계마다 화면을 띄운다. 중간에 새로 고쳐도 같은 자리에서 다시 열리는지, 글이 잘리거나 옆으로 넘치지 않는지 본다.
// node tests/lairflow.js [기기: 비우면 PC | "iPhone 14" | a360]   큰 글씨는 FZ=1.3
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = (dev ? dev.replace(/\s+/g, '') : 'pc') + (FZM.FZ ? '_fz' : ''), out = path.join(__dirname, 'lairflow_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  let n = 0;
  // 찍고, #lf 안의 글이 잘리거나 넘치지 않는지 본다. 아래에 깔린 판(#lr)은 재지 않는다
  const shot = async label => { await p.waitForTimeout(200); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') });
    await p.evaluate(() => { const lr = document.getElementById('lr'); if (lr) lr.style.visibility = 'hidden'; }); const cl = await p.evaluate(FZM.clipScript); await p.evaluate(() => { const lr = document.getElementById('lr'); if (lr) lr.style.visibility = ''; }); cl.forEach(s => bad.push(label + ': ' + s));
    const off = await p.evaluate(() => { const o = [], W = innerWidth, H = innerHeight; if (document.documentElement.scrollWidth > W + 1) o.push('가로로 밀린다 ' + document.documentElement.scrollWidth);
      document.querySelectorAll('#lf .lf-box, #lf .lf-foot button, #lf .lf-exit').forEach(e => { if (!e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1)) o.push((e.className || e.tagName) + ' 화면 밖 ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
      document.querySelectorAll('#lf .lf-opt, #lf .lf-card, #lf .lf-foot button').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.height < 40) o.push('누를 곳이 낮다 ' + Math.round(r.height) + ' 「' + e.textContent.trim().slice(0, 10) + '」'); }); return o; }); off.forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(110); };
  const ev = (f, a) => p.evaluate(f, a);
  const st = () => ev(() => ({ open: __lf.open, scr: __lf.screen, phase: __lair.R ? __lair.R.phase : '', done: window.__done || 0, rolling: __lf.rolling }));
  // 지금 판의 고르는 화면을 연다. 합친 뒤에는 준비 화면이 이미 열어 두었을 수 있다
  const patch = () => ev(() => { if (!__lf._p) { const r0 = __lf.run; __lf.run = function (R, done) { return r0.call(__lf, R, () => { window.__done = (window.__done || 0) + 1; if (done) done(); }); }; __lf._p = 1; } });
  const run = async () => { await patch(); await ev(() => { if (!__lf.open) __lf.run(__lair.R, () => {}); }); };
  const keep = () => ev(() => localStorage.setItem('oldnest.lairrun', __lair.L.save(__lair.R)));
  const reopen = async () => { await keep(); await p.reload(); await p.waitForTimeout(400); await ev(() => { window.__lf.auto = false; }); await patch(); if (!(await p.$('[data-a="cont"]'))) { bad.push('새로 고친 뒤 이어하기가 없다'); return false; } await tap('[data-a="cont"]'); await p.waitForTimeout(300); await run(); await p.waitForTimeout(150); return true; };

  await patch(); await tap('[data-a="start"]'); await ev(() => { __lair.fresh(7); window.__lf.auto = false; window.__done = 0; }); await p.waitForTimeout(250);
  if (await ev(() => __lf.pending(__lair.R))) bad.push('새 판이 고르는 단계로 시작한다');
  // 권속 몇을 세워 둥지의 힘(주사위 수)을 만든다
  await ev(() => { __lair.give('shell', 1, 18); __lair.give('gazer', 1, 24); __lair.give('gnaw', 1, 19); __lair.redraw(); });

  // ---- 1. 보상: 방 / 진액 / 조우 ----
  await ev(() => { const R = __lair.R, L = __lair.L; R.round = 2; R.gold = 20; R.choice = { kind: 'reward', opts: [{ type: 'room', id: 'nursery' }, { type: 'gold', amt: 4 }, { type: 'encounter', id: 'pilgrim' }] }; L.settle(R); });
  await run();
  { const s = await st(); if (!s.open || s.scr.indexOf('choice') < 0 || s.phase !== 'choice') bad.push('보상 화면이 뜨지 않았다 ' + JSON.stringify(s));
    const d = await ev(() => ({ n: document.querySelectorAll('#lf .lf-opt').length, pick: document.querySelector('#lf [data-f="cpick"]').disabled, more: document.querySelectorAll('#lf .lf-more').length, pics: Array.from(document.querySelectorAll('#lf img.lf-pic')).every(i => i.getAttribute('src').length > 100) }));
    if (d.n !== 3 || !d.pick || d.more || !d.pics) bad.push('보상 화면의 처음 모습 ' + JSON.stringify(d)); }
  await shot('choice');
  await tap('#lf .lf-opt[data-i="0"]');
  { const d = await ev(() => ({ on: document.querySelectorAll('#lf .lf-opt.on').length, more: (document.querySelector('#lf .lf-opt.on .lf-more') || {}).textContent || '', pick: document.querySelector('#lf [data-f="cpick"]').disabled, phase: __lair.R.phase })); if (d.on !== 1 || d.more.length < 8 || d.pick || d.phase !== 'choice') bad.push('보상을 한 번 눌렀을 때 ' + JSON.stringify(d)); }
  await shot('choice_sel');
  await tap('#lf .lf-opt[data-i="0"]'); if ((await st()).phase !== 'choice') bad.push('두 번 눌렀다고 확정되면 안 된다');
  await tap('#lf .lf-opt[data-i="2"]');
  if (await reopen()) { const s = await st(); if (!s.open || s.scr.indexOf('choice') < 0) bad.push('새로 고친 뒤 보상 화면이 아니다 ' + JSON.stringify(s)); if ((await ev(() => document.querySelectorAll('#lf .lf-opt').length)) !== 3) bad.push('새로 고친 뒤 보상이 셋이 아니다'); }
  await tap('#lf .lf-opt[data-i="2"]'); await shot('choice_enc'); await tap('#lf [data-f="cpick"]');

  // ---- 2. 조우: 고르기 → 굴림 → 다시 굴림 → 결과 ----
  { const s = await st(); if (!s.open || s.scr.indexOf('enc') < 0 || s.phase !== 'encounter') bad.push('조우 화면이 뜨지 않았다 ' + JSON.stringify(s));
    const d = await ev(() => ({ stats: document.querySelectorAll('#lf .lf-stat').length, ch: document.querySelectorAll('#lf .lf-opt').length, text: document.querySelector('#lf .lf-text').textContent.length, seen: Object.keys(__shell.meta.seenEnc || {}).join(' '), saved: JSON.parse(localStorage.getItem('oldnest.lairrun')).phase }));
    if (d.stats !== 5 || d.ch !== 3 || d.text < 30 || d.seen !== 'pilgrim' || d.saved !== 'encounter') bad.push('조우 화면의 처음 모습 ' + JSON.stringify(d)); }
  await shot('enc');
  await tap('#lf .lf-opt[data-id="whisper"]');
  { const d = await ev(() => ({ line: document.querySelector('#lf .lf-opt.on .lf-osh').textContent, hint: document.querySelectorAll('#lf .lf-opt.on .lf-more span').length })); if (!/속삭임 주사위 \d · 성공 2/.test(d.line) || d.hint !== 2) bad.push('조우의 고를 것에 주사위 수나 결과 글이 없다 ' + JSON.stringify(d)); }
  await shot('enc_sel');
  await tap('#lf [data-f="epick"]');
  { const s = await st(); if (!s.rolling) bad.push('주사위가 구르지 않는다'); if (await ev(() => !document.querySelector('#lf [data-f="eres"]').disabled)) bad.push('구르는 동안 단추가 눌린다'); }
  await shot('enc_rolling'); await p.waitForTimeout(900);
  { const d = await ev(() => ({ rolling: __lf.rolling, dice: Array.from(document.querySelectorAll('#lf .lf-tray .lf-die')).map(e => +e.dataset.face), roll: __lair.R.encounter.roll.dice, need: __lair.R.encounter.roll.need })); if (d.rolling || d.dice.join() !== d.roll.join() || d.need !== 2) bad.push('멎은 주사위가 규칙의 눈과 다르다 ' + JSON.stringify(d)); }
  // 모자란 눈을 넣고 다시 연다: 실패한 모습, 다시 굴리기
  await ev(() => { const R = __lair.R; R.encounter.roll.dice = R.encounter.roll.dice.map((d, i) => (i === 0 ? 6 : 2)); R.gold = 20; __lf.run(R, () => { window.__done = (window.__done || 0) + 1; }); });
  { const d = await ev(() => ({ ok: document.querySelectorAll('#lf .lf-die.ok').length, no: document.querySelectorAll('#lf .lf-die.no').length, re: document.querySelector('#lf [data-f="ereroll"]'), cost: (document.querySelector('#lf [data-f="ereroll"] small') || {}).textContent, res: document.querySelector('#lf .lf-rollres').textContent })); if (d.ok !== 1 || d.no < 1 || !d.re || !/2/.test(d.cost || '') || !/1/.test(d.res)) bad.push('모자란 주사위의 모습 ' + JSON.stringify(d)); }
  await shot('enc_short');
  if (await reopen()) { const d = await ev(() => ({ scr: __lf.screen, dice: Array.from(document.querySelectorAll('#lf .lf-tray .lf-die')).map(e => +e.dataset.face).join(), roll: __lair.R.encounter && __lair.R.encounter.roll ? __lair.R.encounter.roll.dice.join() : '' })); if (d.scr.indexOf('enc') < 0 || !d.roll || d.dice !== d.roll || d.dice[0] !== '6') bad.push('새로 고친 뒤 굴린 주사위가 그대로가 아니다 ' + JSON.stringify(d)); }
  await tap('#lf [data-f="ereroll"]');
  { const d = await ev(() => ({ gold: __lair.R.gold, re: __lair.R.encounter.rerolls, rolling: __lf.rolling, kept: document.querySelectorAll('#lf .lf-die.ok').length, spin: document.querySelectorAll('#lf .lf-die.roll').length })); if (d.gold !== 18 || d.re !== 1 || !d.rolling || d.kept < 1 || !d.spin) bad.push('다시 굴리기 ' + JSON.stringify(d)); }
  await p.waitForTimeout(900);
  await ev(() => { const R = __lair.R; R.encounter.roll.dice = R.encounter.roll.dice.map((d, i) => (i === 0 ? 6 : 3)); __lf.run(R, () => { window.__done = (window.__done || 0) + 1; }); });
  if (!/3/.test(await ev(() => (document.querySelector('#lf [data-f="ereroll"] small') || {}).textContent || ''))) bad.push('다시 굴릴 때마다 값이 오르지 않는다');
  await shot('enc_short2');
  await tap('#lf [data-f="eres"]');
  { const s = await st(), d = await ev(() => ({ v: (document.querySelector('#lf .lf-verdict') || {}).textContent, text: document.querySelector('#lf .lf-text').textContent.length, gains: document.querySelectorAll('#lf .lf-gains span').length, enc: __lair.R.encounter })); if (s.scr.indexOf('out') < 0 || d.v !== '실패' || d.text < 8 || !d.gains || d.enc) bad.push('조우의 결과 화면 ' + JSON.stringify(s) + JSON.stringify(d)); }
  await shot('enc_out'); await tap('#lf [data-f="next"]');

  // ---- 3. 신화 단계 1: 다시 보기 → 고르기 → 깨어남 ----
  { const s = await st(); if (!s.open || s.scr.indexOf('mythos') < 0 || s.phase !== 'mythos') bad.push('신화 단계가 뜨지 않았다 ' + JSON.stringify(s));
    const d = await ev(() => ({ cards: document.querySelectorAll('#lf .lf-card').length, pw: document.querySelectorAll('#lf .lf-pw').length, pr: document.querySelectorAll('#lf .lf-pr').length, ph: document.querySelector('#lf .lf-phase').textContent, tier: document.querySelector('#lf .lf-tier').textContent, box: document.querySelector('#lf .lf-box').className, left: (document.querySelector('#lf [data-f="mreroll"] small') || {}).textContent, pick: document.querySelector('#lf [data-f="mpick"]').disabled, seen: Object.keys(__shell.meta.seenCards || {}).length }));
    if (d.cards !== 3 || d.pw !== 3 || d.pr !== 3 || !/1\s*\/3/.test(d.ph) || !/속삭임|징조|현현/.test(d.tier) || !/t[123]/.test(d.box) || d.left !== '1' || !d.pick || d.seen !== 3) bad.push('신화 단계의 처음 모습 ' + JSON.stringify(d)); }
  await p.waitForTimeout(150);
  { const k = await ev(() => { const c = document.querySelector('#lf canvas.lf-boss'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) k++; return k; }); if (k < 150) bad.push('신화 단계의 본체 그림이 비었다 ' + k); }
  await shot('mythos');
  await tap('#lf .lf-card[data-i="1"]'); if ((await ev(() => (document.querySelector('#lf .lf-card.on .lf-more') || {}).textContent || '')).length < 8) bad.push('신화를 눌러도 자세한 글이 없다'); await shot('mythos_sel');
  const offer0 = await ev(() => __lair.R.mythos.offer.join());
  await tap('#lf [data-f="mreroll"]'); if ((await ev(() => __lair.R.mythos.offer.join())) !== offer0) bad.push('다시 보기가 한 번에 바뀐다(확인 없이)'); await shot('mythos_arm');
  if (await reopen()) { const d = await ev(() => ({ scr: __lf.screen, offer: __lair.R.mythos.offer.join() })); if (d.scr.indexOf('mythos') < 0 || d.offer !== offer0) bad.push('새로 고친 뒤 신화 셋이 그대로가 아니다 ' + JSON.stringify(d)); }
  await tap('#lf [data-f="mreroll"]'); await tap('#lf [data-f="mreroll"]');
  { const d = await ev(() => ({ offer: __lair.R.mythos.offer.join(), left: __lair.R.mythos.rerollLeft, dis: document.querySelector('#lf [data-f="mreroll"]').disabled, seen: Object.keys(__shell.meta.seenCards || {}).length })); if (d.offer === offer0 || d.left !== 0 || !d.dis || d.seen !== 6) bad.push('다시 보기 ' + JSON.stringify(d)); }
  await tap('#lf .lf-card[data-i="0"]'); const card0 = await ev(() => __lair.L.cardInfo(__lair.R.mythos.offer[0]));
  await tap('#lf [data-f="mpick"]');
  { const s = await st(), d = await ev(() => ({ awake: __lair.R.awake, form: __lair.R.form, picked: __lair.R.mythos.picked.length, saved: JSON.parse(localStorage.getItem('oldnest.lairrun')).awake })); if (s.scr.indexOf('awake') < 0 || d.awake !== 1 || d.form !== card0.asp || d.picked !== 1 || d.saved !== 1) bad.push('깨어남 화면이 뜨지 않았다 ' + JSON.stringify(s) + JSON.stringify(d)); }
  await shot('awake_before'); await p.waitForTimeout(1700);
  { const d = await ev(() => { const c = document.querySelector('#lf canvas.lf-awcv'), q = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < q.length; i += 4) if (q[i]) k++; return { k, show: document.querySelector('#lf .lf-awtx').classList.contains('show'), name: document.querySelector('#lf .lf-awtx h2').textContent, want: __lair.L.coreInfo(__lair.R).name, step: document.querySelector('#lf .lf-step').textContent, got: document.querySelector('#lf .lf-got b').textContent }; });
    if (d.k < 200 || !d.show || d.name !== d.want || !/1\s*\/3/.test(d.step) || d.got !== card0.name) bad.push('깨어남의 모습 ' + JSON.stringify(d)); }
  await shot('awake1'); await tap('#lf [data-f="next"]');
  { const s = await st(); if (s.open || s.phase !== 'prep' || s.done !== 1) bad.push('다 고른 뒤 닫히고 done 이 한 번 불려야 한다 ' + JSON.stringify(s)); }
  if ((await ev(() => (__shell.meta.seenStep || {})[__lair.R.form])) !== 1) bad.push('깨어난 단계가 적히지 않았다');

  // ---- 4. 신화 단계 2 (현현) · 3 (속삭임): 등급의 모습, 깨어남 2·3 ----
  for (const [round, tier, step] of [[7, 3, 2], [12, 1, 3]]) {
    await ev(([round, tier]) => { const R = __lair.R, L = __lair.L; R.round = round; L.settle(R); const ids = L.MYTHOS_IDS.filter(id => L.MYTHOS[id].tier === tier && !R.mythos.picked.includes(id)); R.mythos.tier = tier; R.mythos.offer = ids.slice(0, 3); window.__done = 0; }, [round, tier]);
    await run();
    { const d = await ev(() => ({ box: document.querySelector('#lf .lf-box').className, ph: document.querySelector('#lf .lf-phase').textContent, picked: document.querySelectorAll('#lf .lf-picked span').length })); if (d.box.indexOf('t' + tier) < 0 || d.ph.indexOf(String(step)) < 0 || d.picked !== step - 1) bad.push('신화 단계 ' + step + ' 의 모습 ' + JSON.stringify(d)); }
    await shot('mythos_t' + tier); await tap('#lf .lf-card[data-i="2"]'); await shot('mythos_t' + tier + '_sel'); await tap('#lf [data-f="mpick"]'); await p.waitForTimeout(1700);
    { const d = await ev(() => ({ awake: __lair.R.awake, step: document.querySelector('#lf .lf-step').textContent, name: document.querySelector('#lf .lf-awtx h2').textContent, want: __lair.L.coreInfo(__lair.R).name })); if (d.awake !== step || d.step.indexOf(String(step)) < 0 || d.name !== d.want) bad.push('깨어남 ' + step + ' ' + JSON.stringify(d)); }
    await shot('awake' + step); await tap('#lf [data-f="next"]');
    { const s = await st(); if (s.open || s.phase !== 'prep' || s.done !== 1) bad.push('신화 단계 ' + step + ' 뒤 ' + JSON.stringify(s)); }
  }
  if (await ev(() => { const R = __lair.R, L = __lair.L; R.round = 14; L.settle(R); return R.phase !== 'prep'; })) bad.push('신화 단계가 네 번 온다');

  // ---- 5. 정예 보상: 2성 권속 / 진액 / 방. 대기석이 차 있으면 진액으로 ----
  await ev(() => { const R = __lair.R, L = __lair.L; for (let i = 0; i < R.bench.length; i++) if (R.bench[i] == null) __lair.give('biter', 1); R.choice = { kind: 'elite', opts: [{ type: 'unit', id: 'maw', star: 2 }, { type: 'gold', amt: 12 }, { type: 'room', id: 'pool' }] }; L.settle(R); window.__done = 0; });
  await run(); await tap('#lf .lf-opt[data-i="0"]');
  { const d = await ev(() => ({ t: document.querySelector('#lf h2').textContent, more: document.querySelector('#lf .lf-opt.on .lf-more').textContent })); if (d.t !== '정예 보상' || !/대기석이 차 있다/.test(d.more)) bad.push('정예 보상의 권속 ' + JSON.stringify(d)); }
  await shot('choice_elite');
  { const g0 = await ev(() => __lair.R.gold); await tap('#lf [data-f="cpick"]'); const d = await ev(() => ({ gold: __lair.R.gold, phase: __lair.R.phase, open: __lf.open, done: window.__done })); if (d.gold !== g0 + 9 || d.phase !== 'prep' || d.open || d.done !== 1) bad.push('대기석이 찬 채로 권속을 골랐을 때 ' + JSON.stringify(d) + ' ' + g0); }

  // ---- 6. 판정이 없는 길, 넘은 주사위 ----
  await ev(() => { const R = __lair.R, L = __lair.L; R.encounter = { id: 'pilgrim', pick: null, roll: null, rerolls: 0 }; L.settle(R); window.__done = 0; }); await run();
  await tap('#lf .lf-opt[data-id="leave"]'); await tap('#lf [data-f="epick"]');
  { const s = await st(), d = await ev(() => ({ v: !!document.querySelector('#lf .lf-verdict'), gains: document.querySelector('#lf .lf-gains').textContent })); if (s.scr.indexOf('out') < 0 || d.v || !/경험/.test(d.gains)) bad.push('판정 없는 길의 결과 ' + JSON.stringify(s) + JSON.stringify(d)); }
  await shot('enc_out_plain'); await tap('#lf [data-f="next"]'); if ((await st()).done !== 1) bad.push('조우 뒤 done 이 불리지 않았다');
  await ev(() => { const R = __lair.R, L = __lair.L; R.encounter = { id: 'pilgrim', pick: null, roll: null, rerolls: 0 }; L.settle(R); L.encounterChoose(R, 'eat'); R.encounter.roll.dice = R.encounter.roll.dice.map(() => 6); window.__done = 0; }); await run();
  { const d = await ev(() => ({ re: !!document.querySelector('#lf [data-f="ereroll"]'), res: document.querySelector('#lf .lf-rollres').className, btn: document.querySelector('#lf [data-f="eres"]').textContent })); if (d.re || d.res.indexOf('ok') < 0 || d.btn !== '이어서') bad.push('넘은 주사위의 모습 ' + JSON.stringify(d)); }
  await shot('enc_pass'); await tap('#lf [data-f="eres"]'); if ((await ev(() => (document.querySelector('#lf .lf-verdict') || {}).textContent)) !== '성공') bad.push('넘었는데 성공이 아니다'); await shot('enc_out_ok'); await tap('#lf [data-f="next"]');

  // ---- 7. 움직임을 끄면 곧바로 결과 ----
  await ev(() => { const R = __lair.R, L = __lair.L; __shell.meta.shake = false; R.encounter = { id: 'pilgrim', pick: null, roll: null, rerolls: 0 }; L.settle(R); }); await run();
  await tap('#lf .lf-opt[data-id="eat"]'); await tap('#lf [data-f="epick"]'); if ((await st()).rolling) bad.push('움직임을 껐는데 주사위가 구른다');
  await tap('#lf [data-f="eres"]'); await tap('#lf [data-f="next"]'); await ev(() => { __shell.meta.shake = true; });

  // ---- 8. 나가기: 고르지 않고 첫 화면으로. 이어하면 같은 자리 ----
  await ev(() => { const R = __lair.R, L = __lair.L; R.choice = { kind: 'boss', opts: [{ type: 'room', id: 'pool' }, { type: 'unit', id: 'tangle', star: 2 }] }; L.settle(R); window.__done = 0; }); await run(); await keep(); await shot('choice_boss');
  await tap('#lf [data-f="exit"]');
  { const d = await ev(() => ({ open: __lf.open, title: !document.getElementById('title').hidden, done: window.__done, cont: !!document.querySelector('[data-a="cont"]') })); if (d.open || !d.title || d.done || !d.cont) bad.push('나가기 ' + JSON.stringify(d)); }
  await tap('[data-a="cont"]'); await p.waitForTimeout(300); await run(); if ((await st()).scr.indexOf('choice') < 0) bad.push('나갔다 오면 같은 보상 화면이어야 한다');

  // ---- 9. 저절로 고르기(시험용) ----
  { const d = await ev(() => { const R = __lair.R, L = __lair.L; __lf.close(); __lair.open(R); R.encounter = { id: 'deserter', pick: null, roll: null, rerolls: 0 }; L.settle(R); __lf.auto = true; let k = 0; __lf.run(R, () => { k++; }); return { k, phase: R.phase, open: __lf.open }; }); if (d.k !== 1 || d.phase !== 'prep' || d.open) bad.push('저절로 고르기 ' + JSON.stringify(d)); }

  await b.close();
  console.log(JSON.stringify({ dev: dev || 'pc', fz: FZM.FZ || 1, shots: n, bad, errs }, null, 1));
  if (bad.length || errs.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
