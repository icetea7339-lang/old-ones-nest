// 겉 시험: 첫 화면 → 도감(일곱 갈래) · 도움말(여덟 쪽) · 설정 → 시작(자동 시험에서는 영상을 건너뛴다) → 준비 → 다시 열어 이어하기 → 끝까지 → 지난 판
// 영상을 억지로 틀었을 때(처음 한 번만), 망가진 저장·옛 저장을 넣었을 때 첫 화면이 멈추지 않는지, 연결이 있을 때 그만둔 곳이 적히는지도 본다
// node tests/shell.js [기기: 비우면 PC | "iPhone 14" | a360]   큰 글씨는 FZ=1.3
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = (dev ? dev.replace(/\s+/g, '') : 'pc') + (FZM.FZ ? '_fz' : ''), out = path.join(__dirname, 'shell_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), errs = [], bad = []; let n = 0;
  const open = async (ctx, init) => {
    const p = await ctx.newPage(); p.setDefaultTimeout(9000);
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
    await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
    if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ)); if (init) await p.addInitScript(init);
    await p.goto('http://nest.test/'); await p.waitForTimeout(400); return p;
  };
  const shot = async (p, label) => { await p.waitForTimeout(180); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); const cl = await p.evaluate(FZM.clipScript); cl.forEach(s => bad.push(label + ': ' + s));
    const off = await p.evaluate(() => { const o = [], W = innerWidth, H = innerHeight; document.querySelectorAll('#title button, #modal .sh-box, #modal .sh-btns button, #modal .sh-x, #modal .sh-tab').forEach(e => { if (!e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1)) o.push((e.className || e.tagName) + ' 화면 밖 ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); if (e.tagName === 'BUTTON' && r.height < 36) o.push((e.textContent || e.className) + ' 단추가 낮다 ' + Math.round(r.height)); }); return o; }); off.forEach(s => bad.push(label + ': ' + s)); };
  const tap = async (p, sel) => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(120); };
  const menu = p => p.evaluate(() => Array.from(document.querySelectorAll('#menu button')).map(x => x.dataset.a).join(' '));
  const state = p => p.evaluate(() => ({ title: !document.getElementById('title').hidden, lr: !!document.getElementById('lr') && !document.getElementById('lr').hidden, modal: !document.getElementById('modal').hidden, phase: window.__lair && __lair.R ? __lair.U.phase : '', round: window.__lair && __lair.R ? __lair.R.round : 0 }));

  // ---- 1. 처음 연 사람 ----
  const ctx = await FZM.context(b, dev), p = await open(ctx);
  if ((await menu(p)) !== 'start codex help set') bad.push('첫 화면 단추가 다르다: ' + (await menu(p)));
  if (await p.evaluate(() => !document.getElementById('nojs').hidden)) bad.push('미리보기 안내가 보인다');
  { const ink = await p.evaluate(async () => { await new Promise(r => setTimeout(r, 200)); const c = document.getElementById('tcv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, set = new Set(); for (let i = 0; i < d.length; i += 4 * 37) set.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return set.size; }); if (ink < 12) bad.push('첫 화면 그림이 비었다 (색 ' + ink + ')'); }
  await shot(p, 'title');
  // 도감: 아직 본 것이 없다
  await tap(p, '[data-a="codex"]');
  { const d = await p.evaluate(() => ({ tabs: document.querySelectorAll('#modal .sh-tab').length, cells: document.querySelectorAll('#modal .sh-cell').length, open: document.querySelectorAll('#modal .sh-cell:not([disabled])').length })); if (d.tabs !== 7 || d.cells !== 20) bad.push('도감 칸 수 ' + JSON.stringify(d)); if (d.open) bad.push('본 적 없는 권속이 열려 있다 ' + d.open); }
  await shot(p, 'codex_empty');
  for (const [t, want] of [['inv', 19], ['cast', 6], ['myth', 43], ['room', 8], ['syn', 9], ['form', 6]]) { await tap(p, `#modal .sh-tab[data-v="${t}"]`); const k = await p.evaluate(() => document.querySelectorAll('#modal .sh-cell').length); if (k !== want) bad.push('도감 ' + t + ' 칸 수 ' + k + ' (' + want + ')'); await shot(p, 'codex_' + t + '_empty'); }
  if ((await p.evaluate(() => document.querySelectorAll('#modal .sh-cell:not([disabled])').length)) !== 1) bad.push('본체는 처음 모습 하나만 열려 있어야 한다');
  await tap(p, '#modal .sh-x'); if ((await state(p)).modal) bad.push('도감이 닫히지 않는다');
  // 도움말 여덟 쪽
  await tap(p, '[data-a="help"]');
  if ((await p.evaluate(() => document.querySelectorAll('#modal .sh-tab').length)) !== 8) bad.push('도움말이 여덟 쪽이 아니다');
  for (const pg of ['board', 'econ', 'role', 'syn', 'room', 'mad', 'myth', 'enc']) { await tap(p, `#modal .sh-tab[data-v="${pg}"]`); const len = await p.evaluate(() => document.querySelector('#modal .sh-body').textContent.trim().length); if (len < 40) bad.push('도움말 ' + pg + ' 이 비었다'); await shot(p, 'help_' + pg); }
  if (!(await p.$('#modal [data-a="film"]'))) bad.push('도움말에 여는 이야기 단추가 없다');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100); if ((await state(p)).modal) bad.push('Esc 로 창이 닫히지 않는다');
  // 설정
  await tap(p, '[data-a="set"]'); await shot(p, 'set');
  await tap(p, '#modal [data-a="tog"][data-v="sound"]'); await tap(p, '#modal [data-a="tog"][data-v="shake"]');
  await p.evaluate(() => { const r = document.querySelector('#modal [data-vol="music"]'); r.value = 30; r.dispatchEvent(new Event('input', { bubbles: true })); });
  { const m = await p.evaluate(() => JSON.parse(localStorage.getItem('oldnest.meta'))); if (m.sound !== false || m.shake !== false || Math.abs(m.vol.music - 0.3) > 0.01 || m.sv !== 3) bad.push('설정이 저장되지 않았다 ' + JSON.stringify({ s: m.sound, k: m.shake, v: m.vol, sv: m.sv })); }
  await tap(p, '#modal [data-a="tog"][data-v="sound"]'); await tap(p, '#modal .sh-x');

  // ---- 2. 시작 → 준비 → 다시 열어 이어하기 ----
  await tap(p, '[data-a="start"]'); await p.waitForTimeout(300);
  { const s = await state(p); if (s.title || !s.lr || s.phase !== 'prep' || s.round !== 1) bad.push('시작이 준비 화면으로 가지 않았다 ' + JSON.stringify(s)); if (await p.$('#intro')) bad.push('자동 시험인데 영상이 떴다'); }
  await p.evaluate(() => { const R = __lair.R; for (let i = 0; i < R.shop.length; i++) if (R.shop[i]) { __lair.L.buy(R, i); break; } __lair.redraw(); });
  const before = await p.evaluate(() => ({ seed: __lair.R.seed, gold: __lair.R.gold, bench: __lair.R.bench.filter(Boolean).length, saved: !!localStorage.getItem('oldnest.lairrun') }));
  if (!before.saved || before.bench !== 1) bad.push('준비에서 저장되지 않았다 ' + JSON.stringify(before));
  await p.reload(); await p.waitForTimeout(400);
  if ((await menu(p)) !== 'cont start codex help set') bad.push('다시 열었을 때 이어하기가 없다: ' + (await menu(p)));
  { const t = await p.evaluate(() => document.querySelector('[data-a="cont"] small').textContent); if (!/^1막 · 1\/15$/.test(t)) bad.push('이어하기에 막과 라운드가 없다: ' + t); }
  await shot(p, 'title_cont');
  await tap(p, '[data-a="cont"]'); await p.waitForTimeout(300);
  { const a = await p.evaluate(() => ({ seed: __lair.R.seed, gold: __lair.R.gold, bench: __lair.R.bench.filter(Boolean).length, phase: __lair.U.phase })); if (a.seed !== before.seed || a.gold !== before.gold || a.bench !== before.bench || a.phase !== 'prep') bad.push('이어하기가 같은 판이 아니다 ' + JSON.stringify(a) + ' / ' + JSON.stringify(before)); }
  await shot(p, 'cont_prep');
  await tap(p, '#lr-bar .lr-menu'); await tap(p, '#lr-sheet [data-l=\"exit\"]'); { const s = await state(p); if (!s.title || s.lr) bad.push('나가기가 첫 화면으로 가지 않는다'); }
  // 도감: 가게에 나온 권속과 다음 침입자가 열렸다
  await tap(p, '[data-a="codex"]');
  { const k = await p.evaluate(() => document.querySelectorAll('#modal .sh-cell:not([disabled])').length); if (k < 2) bad.push('본 권속이 도감에 열리지 않았다 ' + k); }
  await shot(p, 'codex_kin'); await tap(p, '#modal .sh-cell:not([disabled])');
  { const d = await p.evaluate(() => ({ cv: !!document.querySelector('#modal canvas.big'), st: document.querySelectorAll('#modal .sh-st').length, sk: !!document.querySelector('#modal .sh-skill b') })); if (!d.cv || d.st < 5 || !d.sk) bad.push('권속 상세가 비었다 ' + JSON.stringify(d)); }
  { const drawn = await p.evaluate(async () => { await new Promise(r => setTimeout(r, 150)); const c = document.querySelector('#modal canvas.big'), d = c.getContext('2d').getImageData(0, 0, 96, 96).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) k++; return k; }); if (drawn < 200) bad.push('상세 그림이 그려지지 않았다 ' + drawn); }
  await shot(p, 'codex_kin_detail'); await tap(p, '#modal [data-a="cstar"][data-v="3"]'); await shot(p, 'codex_kin_star3'); await tap(p, '#modal [data-a="cback"]');
  await tap(p, '#modal .sh-tab[data-v="inv"]'); if ((await p.evaluate(() => document.querySelectorAll('#modal .sh-cell:not([disabled])').length)) < 1) bad.push('마주친 침입자가 도감에 없다'); await tap(p, '#modal .sh-cell:not([disabled])'); await shot(p, 'codex_inv_detail'); await tap(p, '#modal [data-a="cback"]');
  await tap(p, '#modal .sh-tab[data-v="room"]'); if (await p.$('#modal .sh-cell:not([disabled])')) { await tap(p, '#modal .sh-cell:not([disabled])'); await shot(p, 'codex_room_detail'); await tap(p, '#modal [data-a="cback"]'); }
  await tap(p, '#modal .sh-tab[data-v="syn"]'); if (await p.$('#modal .sh-cell:not([disabled])')) { await tap(p, '#modal .sh-cell:not([disabled])'); await shot(p, 'codex_syn_detail'); }
  await tap(p, '#modal .sh-tab[data-v="form"]'); await tap(p, '#modal .sh-cell:not([disabled])'); await shot(p, 'codex_form_detail'); await tap(p, '#modal .sh-x');

  // ---- 3. 새로 시작(묻는다) → 끝까지 → 지난 판 ----
  await tap(p, '[data-a="start"]'); if (!(await p.$('#modal [data-a="fresh"]'))) bad.push('하던 판이 있는데 묻지 않고 새로 시작한다'); await shot(p, 'ask_fresh');
  await tap(p, '#modal [data-a="close"]'); if ((await menu(p)).indexOf('cont') < 0) bad.push('그만둔다를 눌렀는데 하던 판이 사라졌다');
  await tap(p, '[data-a="start"]'); await tap(p, '#modal [data-a="fresh"]'); await p.waitForTimeout(300);
  { const a = await p.evaluate(() => ({ round: __lair.R.round, bench: __lair.R.bench.filter(Boolean).length, phase: __lair.U.phase })); if (a.round !== 1 || a.bench !== 0 || a.phase !== 'prep') bad.push('새로 시작이 새 판이 아니다 ' + JSON.stringify(a)); }
  let over = false; const lfAuto = () => p.evaluate(() => { window.__lf.auto = true; const R = __lair.R; if (R && __lf.pending(R)) __lf.run(R, () => __lair.redraw()); });
  await lfAuto();
  for (let k = 0; k < 40 && !over; k++) {
    await lfAuto(); await p.evaluate(() => { if (!Object.keys(__lair.R.board).length) { __lair.give('shell', 1, 20); __lair.redraw(); } }); await tap(p, '#lr [data-l="fight"]'); await p.evaluate(() => { __lair.U.speed = 60; });
    if (k === 0) { await p.reload(); await p.waitForTimeout(400); if ((await menu(p)).indexOf('cont') < 0) { bad.push('싸움 도중에 닫으면 이어하기가 없다'); break; } await p.evaluate(() => { window.__lf.auto = true; }); await tap(p, '[data-a="cont"]'); await p.waitForTimeout(200); await lfAuto(); const s = await state(p); if (s.phase !== 'prep' || s.round !== 2 || (await p.evaluate(() => __lair.R.phase)) !== 'prep') bad.push('싸움 도중에 닫았다 열면 다음 준비여야 한다 ' + JSON.stringify(s)); continue; }
    await p.waitForSelector('#lr-sheet .lr-sbody.res', { timeout: 20000 });
    over = await p.evaluate(() => __lair.R.phase === 'over');
    if (!over) await tap(p, '#lr-sheet [data-l="next"]');
  }
  if (!over) bad.push('판이 끝나지 않았다');
  if (await p.evaluate(() => !!localStorage.getItem('oldnest.lairrun'))) bad.push('끝난 판의 저장이 남아 있다');
  await tap(p, '#lr-sheet [data-l="exit"]');
  if ((await menu(p)) !== 'start codex help set last') bad.push('끝난 뒤 첫 화면 단추: ' + (await menu(p)));
  await tap(p, '[data-a="last"]'); if ((await p.evaluate(() => document.querySelectorAll('#modal .sh-run').length)) !== 1) bad.push('지난 판이 한 줄이 아니다'); await shot(p, 'last');
  await p.evaluate(() => { const m = __shell.meta; for (let i = 0; i < 14; i++) m.last.push({ t: Date.now() - i * 86400000, win: i % 3 === 0, round: 1 + i, rounds: 15, act: 1 + i % 3, hp: 20 - i, level: 3 + i % 4, form: 'abyss', step: 1 + i % 3, mythos: ['deepbell', 'pooled', 'nope', 7], team: [['shell', 1], ['biter', 2], ['gazer', 3], ['hood', 1], ['gnaw', 1], ['tangle', 2], ['brood', 1], ['heap', 1], ['mask', 1]] }); m.seenCards = { deepbell: 1, pooled: 1, usury: 1 }; m.seenStep = { abyss: 2 }; m.seen.inv.c_eda = 1; m.seen.form.abyss = 1; localStorage.setItem('oldnest.meta', JSON.stringify(m)); });
  await p.reload(); await p.waitForTimeout(400); await tap(p, '[data-a="last"]'); if ((await p.evaluate(() => document.querySelectorAll('#modal .sh-run').length)) !== 10) bad.push('지난 판은 열 줄까지다'); if ((await p.evaluate(() => document.querySelectorAll('#modal .sh-run .sh-myth span').length)) !== 20) bad.push('지난 판에 받아들인 신화가 없다'); await shot(p, 'last_full'); await tap(p, '#modal .sh-x');
  // 도감: 본 신화, 조사자, 본체의 단계
  await tap(p, '[data-a="codex"]'); await tap(p, '#modal .sh-tab[data-v="myth"]');
  { const d = await p.evaluate(() => ({ open: document.querySelectorAll('#modal .sh-cell:not([disabled])').length, tiers: document.querySelectorAll('#modal .sh-tier').length })); if (d.open !== 3 || d.tiers !== 3) bad.push('도감 신화 갈래 ' + JSON.stringify(d)); }
  await shot(p, 'codex_myth'); await tap(p, '#modal .sh-cell[data-v="usury"]');
  { const d = await p.evaluate(() => ({ pw: (document.querySelector('#modal .lf-pw') || {}).textContent || '', pr: (document.querySelector('#modal .lf-pr') || {}).textContent || '', t3: !!document.querySelector('#modal .sh-card.t3') })); if (d.pw.length < 4 || d.pr.length < 4 || !d.t3) bad.push('도감 신화 상세 ' + JSON.stringify(d)); }
  await shot(p, 'codex_myth_detail'); await tap(p, '#modal [data-a="cback"]');
  await tap(p, '#modal .sh-tab[data-v="cast"]'); if (await p.evaluate(() => document.querySelector('#modal .sh-cell[data-v="eda"]').disabled)) bad.push('만난 조사자가 도감에 열리지 않았다'); await shot(p, 'codex_cast'); await tap(p, '#modal .sh-cell[data-v="eda"]');
  { const d = await p.evaluate(() => ({ st: document.querySelectorAll('#modal .sh-st').length, hist: (document.querySelector('#modal .sh-hist') || {}).textContent || '', sk: !!document.querySelector('#modal .sh-skill b') })); if (d.st !== 3 || d.hist.length < 10 || !d.sk) bad.push('조사자 상세 ' + JSON.stringify(d)); }
  await shot(p, 'codex_cast_detail'); await tap(p, '#modal [data-a="cback"]');
  await tap(p, '#modal .sh-tab[data-v="form"]'); await tap(p, '#modal .sh-cell[data-v="abyss"]');
  { const d = await p.evaluate(() => Array.from(document.querySelectorAll('#modal .sh-star')).map(b => (b.disabled ? 'x' : 'o')).join('')); if (d !== 'oox') bad.push('본체의 단계 단추 ' + d); }
  await tap(p, '#modal [data-a="cstar"][data-v="2"]'); if ((await p.evaluate(() => document.querySelector('#modal canvas.big').dataset.step)) !== '2') bad.push('본체 2단계가 열리지 않는다'); await shot(p, 'codex_form_step2'); await tap(p, '#modal .sh-x');
  // 기록 지우기
  await tap(p, '[data-a="set"]'); await tap(p, '#modal [data-a="wipe"]'); await shot(p, 'ask_wipe'); await tap(p, '#modal [data-a="wipeok"]');
  if ((await menu(p)) !== 'start codex help set') bad.push('지운 뒤 첫 화면 단추: ' + (await menu(p)));
  if (await p.evaluate(() => Object.keys(localStorage).some(k => k.indexOf('oldnest.') === 0 && k !== 'oldnest.meta'))) bad.push('지운 뒤에도 저장이 남았다');
  await ctx.close();

  // ---- 4. 영상: 처음 시작할 때 한 번만 ----
  { const c2 = await FZM.context(b, dev), q = await open(c2, 'window.__forceIntro = 1;');
    await tap(q, '[data-a="start"]'); await q.waitForTimeout(400);
    if (!(await q.$('#intro'))) bad.push('처음 시작인데 영상이 뜨지 않았다'); else { if ((await state(q)).lr) bad.push('영상 도중에 판이 열렸다'); await shot(q, 'film'); await tap(q, '#intro .iskip'); await q.waitForTimeout(300); }
    { const s = await state(q); if (!s.lr || s.phase !== 'prep') bad.push('영상 뒤에 바로 판이 열리지 않았다 ' + JSON.stringify(s)); }
    if (!(await q.evaluate(() => __shell.meta.introSeen))) bad.push('영상을 본 것이 적히지 않았다');
    await tap(q, '#lr-bar .lr-menu'); await tap(q, '#lr-sheet [data-l=\"exit\"]'); await tap(q, '[data-a="start"]'); await tap(q, '#modal [data-a="fresh"]'); await q.waitForTimeout(300);
    if (await q.$('#intro')) bad.push('영상이 두 번째에도 떴다');
    await tap(q, '#lr-bar .lr-menu'); await tap(q, '#lr-sheet [data-l=\"exit\"]'); await tap(q, '[data-a="help"]'); await tap(q, '#modal [data-a="film"]'); await q.waitForTimeout(300);
    if (!(await q.$('#intro'))) bad.push('도움말에서 영상을 다시 볼 수 없다'); else { await tap(q, '#intro .iskip'); await q.waitForTimeout(200); const s = await state(q); if (!s.title || s.lr) bad.push('다시 본 영상 뒤에 첫 화면이 아니다'); }
    await c2.close(); }

  // ---- 5. 망가진 저장, 옛 저장 ----
  const OLD = { meta: JSON.stringify({ sv: 2, runs: 7, sound: false, music: false, shake: false, vol: { master: 0.5, music: 0.2, sfx: 0.9 }, codex: null, cards: { eggs: 3 }, introSeen: 1, lairTut: 1 }), run: JSON.stringify({ day: 3, slime: { stage: 2 } }), cardrun: '{"deck":[1,2', story: JSON.stringify({ ch: 2 }), camp: 'null' };
  const CASES = [
    ['옛 저장', OLD, m => (m.sound === false && m.music === false && m.shake === false && Math.abs(m.vol.master - 0.5) < 0.01 && m.introSeen === 1 && m.sv === 3 && !('codex' in m) && !('cards' in m)) ? '' : '설정을 옮기지 못했다 ' + JSON.stringify(m).slice(0, 160)],
    ['깨진 meta', { meta: '{"sv":3,"vol":', lairrun: '{' }],
    ['null meta', { meta: 'null', lairrun: 'null' }],
    ['배열 meta', { meta: '[1,2]', lairrun: '[]' }],
    ['글자 meta', { meta: '"abc"', lairrun: '"x"' }],
    ['칸이 이상한 meta', { meta: JSON.stringify({ sv: 3, sound: 'yes', vol: 'loud', seen: null, last: 'zz', runs: 'many', lairSpeed: null }), lairrun: JSON.stringify({ v: 1 }) }],
    ['칸이 이상한 meta 2', { meta: JSON.stringify({ sv: 3, vol: { master: 'x', music: null }, seen: { kin: 3, inv: [] }, last: [null, 3, 'a', { win: 1 }, { t: 'x', team: 'q' }, { team: [[1], ['nope', 9], null] }] }), lairrun: JSON.stringify({ v: 999, phase: 'prep', unit: {}, shop: [], bench: [], board: {}, rooms: [], round: 1, hp: 10 }) }],
    ['그럴듯하지만 틀린 판', { lairrun: JSON.stringify({ v: 1, seed: 5, phase: 'prep', unit: {}, shop: [{ kind: 'nope' }, 'zzz'], bench: [77], board: { 3: 99 }, rooms: [{ id: 'nope' }], round: 1, rounds: 3, hp: 10, gold: 5, level: 1, xp: 0 }) }],
    ['끝난 판', { lairrun: JSON.stringify({ v: 1, phase: 'over', over: { win: false } }) }],
  ];
  for (const [name, keys, check] of CASES) {
    const c3 = await FZM.context(b, dev), e0 = errs.length;
    const q = await open(c3, `try { if (!sessionStorage.getItem('inj')) { sessionStorage.setItem('inj', '1'); const K = ${JSON.stringify(keys)}; for (const k in K) localStorage.setItem('oldnest.' + k, K[k]); } } catch (e) {}`);
    const mn = await menu(q); if (!/^(cont )?start codex help set( last)?$/.test(mn)) bad.push(name + ': 첫 화면 단추가 없다 (' + mn + ')');
    if (name !== '옛 저장' && mn.indexOf('cont') >= 0) { await tap(q, '[data-a="cont"]'); await q.waitForTimeout(300); const s = await state(q); if (!s.lr && !s.title) bad.push(name + ': 이어하기가 빈 화면으로 갔다'); if (s.lr) await tap(q, '#lr-bar .lr-menu'); await tap(q, '#lr-sheet [data-l=\"exit\"]'); }
    if (name === '옛 저장') { const keysNow = await q.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('oldnest.') === 0).sort().join(' ')); if (mn.indexOf('cont') >= 0) bad.push(name + ': 옛 판을 이어하려 한다'); for (const k of ['run', 'cardrun', 'story', 'camp']) { if (keysNow.split(' ').includes('oldnest.' + k)) bad.push(name + ': oldnest.' + k + ' 가 그대로다'); if (!keysNow.split(' ').includes('oldnest.old.' + k)) bad.push(name + ': oldnest.old.' + k + ' 로 치워지지 않았다'); } }
    if (check) { const m = await q.evaluate(() => __shell.meta), why = check(m); if (why) bad.push(name + ': ' + why); }
    for (const a of ['codex', 'help', 'set']) { await tap(q, `[data-a="${a}"]`); await q.waitForTimeout(80); if (!(await state(q)).modal) bad.push(name + ': ' + a + ' 창이 열리지 않는다'); await tap(q, '#modal .sh-x'); }
    if (mn.indexOf('last') >= 0) { await tap(q, '[data-a="last"]'); await shot(q, 'last_broken'); await tap(q, '#modal .sh-x'); }
    await tap(q, '[data-a="start"]'); if (await q.$('#modal [data-a="fresh"]')) await tap(q, '#modal [data-a="fresh"]'); await q.waitForTimeout(300);
    { const s = await state(q); if (!s.lr || s.phase !== 'prep' || s.round !== 1) bad.push(name + ': 시작이 되지 않는다 ' + JSON.stringify(s)); }
    await q.reload(); await q.waitForTimeout(300); if ((await menu(q)).indexOf('cont') < 0) bad.push(name + ': 새 판이 저장되지 않았다');
    if (errs.length > e0) bad.push(name + ': 오류 ' + errs.slice(e0).join(' | ').slice(0, 200));
    await c3.close();
  }
  // ---- 6. 그만둔 곳 기록: 연결이 있을 때만 쓴다. 둥지 판의 몇 번째 싸움, 준비인지 싸움인지 ----
  { const c4 = await FZM.context(b, dev), q = await open(c4, `window.__docs = {}; window.claude = { use: async k => k === 'db' ? { doc: id => ({ get: async () => ({ exists: id in window.__docs, data: () => window.__docs[id] }), set: async v => { window.__docs[id] = JSON.parse(JSON.stringify(v)); } }) } : { id: async () => 'u1' } };`);
    await tap(q, '[data-a="set"]'); if (!(await q.$('#modal [data-v="trace"]'))) bad.push('연결이 있는데 기록 끄기 단추가 없다'); await tap(q, '#modal .sh-x');
    await tap(q, '[data-a="start"]'); await q.waitForTimeout(500);
    const d = await q.evaluate(() => window.__docs['runs/u1']); if (!d || !d.live || d.live.mode !== 'lair' || d.live.round !== 1 || d.live.phase !== 'prep') bad.push('그만둔 곳 기록이 둥지 판을 적지 않는다 ' + JSON.stringify(d));
    await c4.close(); }
  await b.close();
  console.log(JSON.stringify({ device: dev || 'pc', fz: FZM.FZ || 1, shots: n, bad, errs }, null, 1));
  console.log(bad.length || errs.length ? '겉 시험 실패 ' + (bad.length + errs.length) : '겉 시험 통과');
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
