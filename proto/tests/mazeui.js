// 굴 짓기 화면 시험: 첫 화면 → 시작 → 파기 · 메우기(막는 메우기는 까닭과 함께 거부) → 권속 방 · 방 종류 · 함정
// → 권속을 사서 고르면 판 통로 · 자리 남은 방 · 본체 방이 밝아진다 → 바위·함정은 까닭과 함께 거부 → 누르기-누르기로 통로에(진짜 터치) → 끌어서 본체 방에
// → 셋이 하나로(별) → 침입 재생 끝까지(빠르게: 걷기, 어둠, 방 싸움 확대, 출구 밑 굴 → 본체 방 싸움 → 알의 방) → 결과
// → 저장 · 새로 고침 · 이어하기 → 넷째 침입까지 → 판 끝 → 다시 한 판 → (새 판) 미로 함정 셋: 미리보기 화살·표지, 침입의 끌림·헛갈림·삼킴 → (안내를 켠 새 판) 상점 → 세우기 → 파기 → 침입이 본체 방 → 알로
// 상점은 대기석 위로 올라오는 서랍(카드를 한 번 누르면 고르고 다시 누르면 산다), 방의 권속 아무나 끈다, 헤매는 일행(되돌아감), 방 싸움은 쓰는 칸만 크게, 막으면 무료 하나
// (창이 길면 창 안에서 굴러 닿으므로, 굴러가는 상자 안의 단추는 화면 밖이어도 괜찮다)
// node tests/mazeui.js [기기: 비우면 PC | "iPhone 14" | a360]   (큰 글씨: FZ=1.3)
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-MAZE.html'), 'utf8');
const dev = process.argv[2] || '', tag = dev ? dev.replace(/\s+/g, '') : 'pc', out = path.join(__dirname, 'mazeui_' + tag + (FZM.FZ ? '_fz' + FZM.FZ : '')); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const touch = await p.evaluate(() => navigator.maxTouchPoints > 0);
  let n = 0;
  const snap = async label => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); };
  const shot = async (label, noclip) => { await p.waitForTimeout(200); await snap(label); if (noclip) return; const cl = await p.evaluate(FZM.clipScript); cl.forEach(s => bad.push(label + ': ' + s));
    const off = await p.evaluate(() => { const o = [], W = innerWidth, H = innerHeight; const scrolls = e => { for (let q = e.parentElement; q; q = q.parentElement) { const st = getComputedStyle(q); if (/auto|scroll/.test(st.overflowY) && q.scrollHeight > q.clientHeight + 1) return true; } return false; };
    document.querySelectorAll('#mz button, #mz .mz-slot, #mz-cv, #title button').forEach(e => { if (!e.offsetParent || scrolls(e)) return; const r = e.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1)) o.push((e.id || e.className || e.tagName) + ' 화면 밖 ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }); if (document.documentElement.scrollWidth > W + 1) o.push('가로로 넘친다 ' + document.documentElement.scrollWidth); return o; }); off.forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) { await p.screenshot({ path: path.join(out, "zz_fail.png") }); console.log(await p.evaluate(() => JSON.stringify({ pend: __maze.Z.pend, sheet: __maze.Z.sheet, toast: document.getElementById("mz-toast").textContent, gold: __maze.M.gold })), bad); throw new Error("없음: " + sel); } await el.click(); await p.waitForTimeout(120); };
  const tapAt = async c => { const pt = await p.evaluate(c => __maze.pt(c), c); if (touch) await p.touchscreen.tap(pt.x, pt.y); else await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200); };
  const toast = () => ev(() => document.getElementById('mz-toast').textContent || '');
  const tapCell = async c => { const pt = await p.evaluate(c => __maze.pt(c), c); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(150); };
  const ev = (f, a) => p.evaluate(f, a);
  // 상점 서랍에서 산다: 서랍을 열고, 카드를 한 번 누르면 고르고, 다시 누르면 산다. 사면 서랍이 닫힌다
  const buy = async i => { if (await ev(() => document.getElementById('mz-shop').hidden)) await tap('#mz-bench [data-m="shopt"]'); await tap(`#mz-shop [data-m="shop"][data-i="${i}"]`); await tap('#mz-shop [data-m="buy"]'); if (!(await ev(() => document.getElementById('mz-shop').hidden))) bad.push('사고 나서 서랍이 닫히지 않았다'); };
  const close = async () => { if (await p.$('#mz-sheet:not([hidden]) [data-m="close"]')) await tap('#mz-sheet [data-m="close"]'); };
  // 첫 화면
  await shot('title');
  if (!(await p.$('#title #mz-tcv'))) bad.push('첫 화면에 굴 그림이 없다');
  { const d = await ev(() => Array.from(document.querySelectorAll('#menu button')).map(b => b.textContent)); if (!d.some(t => /^이야기/.test(t)) || !d.some(t => /^자유/.test(t)) || !d.some(t => /도움말/.test(t)) || !d.some(t => /소리/.test(t))) bad.push('첫 화면 단추가 맞지 않는다 ' + JSON.stringify(d)); }
  await tap('[data-z="help"]'); await shot('help'); if ((await p.$$('#modal .sh-tab')).length !== 4) bad.push('도움말이 네 쪽(짓기·침입·진화·기록)이 아니다'); await tap('#modal .sh-tab[data-i="1"]'); await tap('#modal [data-z="mclose"]');
  { const s0 = await ev(() => __maze.meta.sound !== false); await tap('[data-z="sound"]'); if ((await ev(() => __maze.meta.sound !== false)) === s0) bad.push('소리 단추가 안 된다'); await tap('[data-z="sound"]'); }
  await tap('[data-z="free"]'); await p.waitForTimeout(400);
  { const d = await ev(() => ({ shown: !document.getElementById('mz').hidden, raid: __maze.M.raid, path: __maze.dbg().path, bar: document.getElementById('mz-bar').textContent, k: __maze.Z.k, vw: innerWidth, vh: innerHeight })); if (!d.shown || d.raid !== 1 || !d.path) bad.push('지도가 열리지 않았다 ' + JSON.stringify(d)); if (!/침입 1\/4/.test(d.bar) || !/20/.test(d.bar)) bad.push('위 띠가 맞지 않는다 ' + d.bar); if (dev && d.k * 64 < 52) bad.push('칸이 너무 작다 ' + Math.round(d.k * 64)); if (d.vw >= 390 && d.vh >= 780 && d.k * 64 < 64) bad.push('390x780 에서 칸이 64 보다 작다 ' + Math.round(d.k * 64)); }
  await shot('map');
  // 파기: 길에 붙은 바위
  const dig = await ev(() => __maze.view().grid.find(g => g.canDig && g.r === 2).cell);
  await tapCell(dig); await shot('sheet_rock'); { const d = await ev(() => ({ btn: (document.querySelector('#mz-sheet [data-m="dig"]') || {}).textContent || '' })); if (!/파기 \d/.test(d.btn)) bad.push('바위를 눌렀는데 「파기 n」이 없다 ' + d.btn); }
  // 묻기: 값이 드는 것은 고르면 창 아래에 확인 줄이 뜨고, 확인 없이는 진액도 지도도 바뀌지 않는다. 같은 단추를 다시 누르면 풀린다
  const okTap = async () => { await p.waitForTimeout(300); await tap('#mz-sheet [data-m="ok"]'); await p.waitForTimeout(150); };
  const snapM = () => ev(() => JSON.stringify([__maze.M.gold, __maze.M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join()]));
  { const g0 = await ev(() => __maze.M.gold), m0 = await snapM(); await tap('#mz-sheet [data-m="dig"]'); const d = await ev(() => ({ ok: (document.querySelector('#mz-sheet [data-m="ok"]') || {}).textContent || '', no: !!document.querySelector('#mz-sheet [data-m="no"]') }));
    if (!/^판다 · \d+$/.test(d.ok) || !d.no) bad.push('「파기」를 눌렀는데 확인 줄이 맞지 않다 ' + JSON.stringify(d)); if ((await snapM()) !== m0) bad.push('확인 없이 진액이나 지도가 바뀌었다(파기)'); await shot('confirm_dig');
    await p.waitForTimeout(650); await tap('#mz-sheet [data-m="dig"]'); if (await p.$('#mz-sheet [data-m="ok"]:not([disabled])')) bad.push('같은 단추를 다시 눌러도 고르기가 풀리지 않는다');
    await p.waitForTimeout(650); await tap('#mz-sheet [data-m="dig"]'); await okTap(); await snap('dug_fx');
    const z = await ev(c => ({ dug: __maze.M.grid[c].dug, gold: __maze.M.gold, sheet: !document.getElementById('mz-sheet').hidden, toast: document.getElementById('mz-toast').textContent, fx: __maze.dbg().fx }), dig);
    if (!z.dug || z.gold >= g0) bad.push('확인했는데 파지 못했다 ' + JSON.stringify(z)); if (z.sheet) bad.push('확인한 뒤에 창이 닫히지 않았다'); if (!/^팠다 · −\d+$/.test(z.toast)) bad.push('판 뒤의 알림이 맞지 않다 ' + z.toast); if (z.fx !== 'dig') bad.push('판 칸이 번쩍이지 않았다'); }
  // 메우기: 「그만둔다」면 그대로, 확인하면 메운다 · 길을 끊는 메우기는 까닭과 함께 거부
  await tapCell(dig); { await tap('#mz-sheet [data-m="fill"]'); const t = await ev(() => (document.querySelector('#mz-sheet [data-m="ok"]') || {}).textContent || ''); if (!/^메운다 · \+\d+$/.test(t)) bad.push('메우기 확인 줄이 맞지 않다 ' + t); await tap('#mz-sheet [data-m="no"]'); if (!(await ev(c => __maze.M.grid[c].dug, dig)) || (await p.$('#mz-sheet [data-m="ok"]:not([disabled])'))) bad.push('「그만둔다」가 듣지 않는다');
    await p.waitForTimeout(650); await tap('#mz-sheet [data-m="fill"]'); await okTap(); if (await ev(c => __maze.M.grid[c].dug, dig)) bad.push('메우지 못했다'); }
  await tapCell(12); { const d = await ev(() => ({ dis: !!document.querySelector('#mz-sheet [data-m="fill"][disabled]'), why: (document.querySelector('#mz-sheet .mz-why') || {}).textContent || '' })); if (!d.dis || !/끊긴다/.test(d.why)) bad.push('길을 끊는 메우기가 거부되지 않았다 ' + JSON.stringify(d)); await shot('sheet_fillwhy'); } await close();
  // 다시 파서 권속 방으로 (길 곁): 「권속 방」 → 방 종류를 고르면 확인 줄이 「깐다 · 진액 n」 으로
  await tapCell(dig); await tap('#mz-sheet [data-m="dig"]'); await okTap(); await tapCell(dig); await tap('#mz-sheet [data-m="use"][data-u="kin"]');
  { const t = await ev(() => (document.querySelector('#mz-sheet [data-m="ok"]') || {}).textContent || ''); if (!/^바꾼다/.test(t)) bad.push('쓰임 바꾸기 확인 줄이 없다 ' + t); }
  { const m0 = await snapM(); await tap('#mz-sheet [data-m="room"][data-id="pool"]'); await shot('sheet_room'); const t = await ev(() => (document.querySelector('#mz-sheet [data-m="ok"]') || {}).textContent || ''); if (!/^깐다 · 진액 \d+$/.test(t)) bad.push('방 종류 확인 줄이 맞지 않다 ' + t); if ((await snapM()) !== m0) bad.push('확인 없이 바뀌었다(방)'); await okTap();
    const d = await ev(c => __maze.M.grid[c], dig), tt = await ev(() => document.getElementById('mz-toast').textContent); if (d.use !== 'kin' || d.room !== 'pool') bad.push('권속 방이 되지 않았다 ' + JSON.stringify(d)); if (!/깔았다 · −\d+$/.test(tt)) bad.push('방을 깐 알림이 맞지 않다 ' + tt); }
  await tapCell(17); await tap('#mz-sheet [data-m="use"][data-u="kin"]'); await okTap(); if ((await ev(() => __maze.M.grid[17].use)) !== 'kin') bad.push('권속 방으로 바뀌지 않았다');
  // 진액이 모자라면 확인 단추가 흐리고 까닭
  { const g = await ev(() => { const g = __maze.M.gold; __maze.M.gold = 0; __maze.redraw(); return g; }); await tapCell(27); await tap('#mz-sheet [data-m="use"][data-u="trap"]'); await tap('#mz-sheet [data-m="trap"][data-id="tr_maw"]');
    const d = await ev(() => ({ dis: !!document.querySelector('#mz-sheet [data-m="ok"][disabled]'), why: (document.querySelector('#mz-sheet .mz-confirm .mz-why') || {}).textContent || '' })); if (!d.dis || !/모자란다/.test(d.why)) bad.push('진액이 모자란데 확인이 흐리지 않다 ' + JSON.stringify(d)); await shot('confirm_poor'); await tap('#mz-sheet [data-m="no"]'); await close(); await ev(g => { __maze.M.gold = g; __maze.redraw(); }, g); }
  await tapCell(7); await tap('#mz-sheet [data-m="use"][data-u="trap"]'); if (await p.$('#mz-sheet [data-m="ok"]:not([disabled])')) bad.push('「함정」만 눌렀는데 확인 줄이 떴다'); await tap('#mz-sheet [data-m="trap"][data-id="tr_whisper"]'); await shot('sheet_trap');
  { const info = () => ev(() => { const e = document.querySelector('#mz-sheet .mz-cinfo'); return e ? e.textContent : ''; }); const a = await info(); if (!/속삭이는 벽 · \d/.test(a) || !/정신/.test(a)) bad.push('고른 함정의 설명이 없다 ' + a);
    await tap('#mz-sheet [data-m="trap"][data-id="tr_teeth"]'); const t = await info(); if (!/이빨 구덩이/.test(t) || !/피한다/.test(t)) bad.push('다른 함정을 눌렀는데 설명이 바뀌지 않았다 ' + t); if ((await ev(() => __maze.M.grid[7].use)) !== 'path') bad.push('함정을 누르기만 했는데 깔렸다');
    await tap('#mz-sheet [data-m="trap"][data-id="tr_whisper"]'); }
  { const d = await ev(() => Array.from(document.querySelectorAll('#mz-sheet [data-m="trap"] b')).map(b => b.textContent)); if (d.length !== 7) bad.push('함정 창에 일곱이 아니다 ' + JSON.stringify(d)); const mw = d.find(t => /삼키는 구멍/.test(t)) || ''; if (!/· 3$/.test(mw)) bad.push('삼키는 구멍의 값이 맞지 않는다 ' + mw); if (!d.some(t => /미끼 불빛/.test(t)) || !d.some(t => /헛갈림 벽/.test(t))) bad.push('미로 함정이 함정 창에 없다'); }
  await okTap(); { const d = await ev(() => __maze.M.grid[7]), t = await ev(() => document.getElementById('mz-toast').textContent); if (d.use !== 'trap' || d.trap !== 'tr_whisper') bad.push('함정이 깔리지 않았다 ' + JSON.stringify(d)); if (!/^속삭이는 벽을 깔았다 · −\d+$/.test(t)) bad.push('함정 알림이 맞지 않다 ' + t); await snap('trap_fx'); } await close();
  // 권속을 산다 (카드 → 창 → 「산다」) · 누르기-누르기로 방에 세운다
  await ev(() => { const M = __maze.M; M.gold = 60; M.shop = ['shell', 'gazer', 'gazer', 'gazer', 'hood']; __maze.redraw(); });
  await tap('#mz-bench [data-m="shopt"]'); await shot('drawer'); // 카드를 누르면 설명 판(이름 · 값 · 스킬 · 같은 권속 수). 다른 카드를 누르면 판이 바뀌고, 다시 눌러도 사지 않는다. 「산다」로만 산다
  const panel = () => ev(() => { const e = document.querySelector('#mz-shop .mz-spanel'); return e ? { name: e.querySelector('.mz-sp1 b').textContent, skill: (e.querySelector('.mz-sp3') || {}).textContent || '', same: (e.querySelector('.mz-sp4') || {}).textContent || '', buy: (e.querySelector('[data-m="buy"]') || {}).textContent || '', n: Object.keys(__maze.M.unit).length } : null; });
  await tap('#mz-shop [data-m="shop"][data-i="0"]'); { const d = await panel(); if (!d || !/^껍데기|^\S/.test(d.name) || !/· 1$/.test(d.name) || !d.skill || !/같은 권속 0/.test(d.same) || !/^산다 · 1$/.test(d.buy) || d.n) bad.push('카드 설명 판이 맞지 않는다 ' + JSON.stringify(d)); } await shot('drawer_sel');
  await tap('#mz-shop [data-m="shop"][data-i="1"]'); { const a = await panel(); if (!a || a.name === (await ev(() => '')) || a.n) bad.push('다른 카드를 눌렀는데 판이 바뀌지 않았다 ' + JSON.stringify(a)); await tap('#mz-shop [data-m="shop"][data-i="1"]'); if ((await ev(() => Object.keys(__maze.M.unit).length)) !== 0) bad.push('카드를 두 번 누르니 샀다(「산다」로만 사야 한다)'); await shot('drawer_panel2'); }
  await tap('#mz-shop [data-m="shop"][data-i="0"]'); await tap('#mz-shop [data-m="buy"]');
  if ((await ev(() => Object.keys(__maze.M.unit).length)) !== 1) bad.push('사지 못했다');
  // 고르면 놓을 수 있는 곳이 모두 밝아진다: 판 통로(입구·출구·함정 빼고), 자리가 남은 권속 방, 본체 방
  const rock = await ev(() => __maze.view().grid.find(g => !g.dug && g.r > 1).cell);
  await tap('#mz-bench .mz-slot.has'); await p.waitForTimeout(150);
  { const d = await ev(() => __maze.dbg().lit); for (const c of [12, 17, 22, 27, 32, dig, 'core']) if (!d.includes(c)) bad.push('고른 권속을 놓을 곳 ' + c + ' 이 밝지 않다 ' + JSON.stringify(d)); for (const c of [2, 37, 7, rock]) if (d.includes(c)) bad.push(c + ' 은 놓을 수 없는데 밝다'); } await shot('lift');
  // 바위 · 함정은 까닭과 함께 거부하고, 고른 것은 그대로 둔다
  await tapAt(rock); { const d = { t: await toast(), sel: await ev(() => !!(__maze.Z.sel && __maze.Z.sel.uid)) }; if (!/바위다\. 먼저 판다/.test(d.t) || !d.sel) bad.push('바위를 누르면 까닭이 떠야 한다 ' + JSON.stringify(d)); } await shot('rock_why');
  await tapAt(7); { const t = await toast(); if (!/함정 칸이다/.test(t)) bad.push('함정 칸 거부 글이 없다 ' + t); }
  // 고른 권속의 「자세히」: 설명 창을 보고 닫아도 고른 것은 남는다
  { if (!(await p.$('#mz-uinfo:not([hidden])'))) bad.push('고른 권속의 「자세히」 단추가 없다'); else { await tap('#mz-uinfo'); const h = await ev(() => (document.querySelector('#mz-sheet h3') || {}).textContent || ''); if (!h) bad.push('「자세히」를 눌러도 설명이 없다'); await shot('uinfo'); await close(); if (!(await ev(() => !!(__maze.Z.sel && __maze.Z.sel.uid)))) bad.push('「자세히」를 보고 나니 고르기가 풀렸다'); } }
  // 누르기-누르기로 판 통로에 세운다 (폰이면 진짜 터치로): 그 칸은 권속 방이 된다
  await tapAt(22); { const d = await ev(() => ({ b: __maze.M.board[22] || [], use: __maze.M.grid[22].use, sel: __maze.Z.sel })); if (d.b.length !== 1 || d.use !== 'kin' || d.sel) bad.push('누르기-누르기로 통로에 세우지 못했다 ' + JSON.stringify(d)); }
  // 끌기: 폰이면 진짜 터치로, PC 면 마우스로 → 본체 방
  await buy(4);
  { const s = await (await p.$('#mz-bench .mz-slot.has')).boundingBox(), to = await ev(() => __maze.pt('core')), a = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    if (touch) { const cdp = await ctx.newCDPSession(p), T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); await T('touchStart', a.x, a.y); for (let k = 1; k <= 8; k++) { await T('touchMove', a.x + (to.x - a.x) * k / 8, a.y + (to.y - a.y) * k / 8); await p.waitForTimeout(16); } await snap('drag'); await T('touchEnd'); }
    else { await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y - 30, { steps: 4 }); await p.mouse.move(to.x, to.y, { steps: 6 }); await snap('drag'); await p.mouse.up(); }
    await p.waitForTimeout(200); const d = await ev(() => ({ core: __maze.M.board.core || [], view: __maze.view().core.units.length })); if (d.core.length !== 1 || d.view !== 1) bad.push('끌어서 본체 방에 세우지 못했다 ' + JSON.stringify(d)); }
  await shot('core_room');
  // 본체 방을 누르면 본체 방 창
  await tapAt('core'); { const d = await ev(() => ({ h: (document.querySelector('#mz-sheet h3') || {}).textContent || '', n: document.querySelectorAll('#mz-sheet .mz-urow').length })); if (!/본체 방/.test(d.h) || d.n !== 1) bad.push('본체 방 창이 맞지 않는다 ' + JSON.stringify(d)); await shot('sheet_core'); } await close();
  // 셋이 하나로
  for (const i of [1, 2, 3]) { await buy(i); if (i === 3) await snap('merge'); }
  { const d = await ev(() => ({ st: Object.values(__maze.M.unit).filter(u => u.kind === 'gazer').map(u => u.star), merges: __maze.Z.merges || 0, toast: document.getElementById('mz-toast').textContent })); if (d.st.join() !== '2' || !d.merges || !/★★/.test(d.toast)) bad.push('셋이 하나가 되지 않았다 ' + JSON.stringify(d)); }
  await tap('#mz-bench .mz-slot.has'); await tapCell(22);
  { const d = await ev(() => ({ units: __maze.dbg().units, board: Object.keys(__maze.M.board).length })); if (d.units < 3) bad.push('지도에 권속이 그려지지 않았다 ' + JSON.stringify(d)); } await shot('map_full');
  // 방의 권속 창
  await tapCell(22); if ((await p.$$('#mz-sheet .mz-urow')).length !== 2) bad.push('방의 권속 창이 맞지 않는다'); await shot('sheet_kin'); await close();
  // 방의 첫째 권속을 끌어 대기석으로, 다시 누르기-누르기로 방에
  { const first = await ev(() => __maze.M.board[22][0]), a = await ev(() => __maze.spot(22, 0)), s = await (await p.$('#mz-bench .mz-slot:not(.has)')).boundingBox();
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(a.x, a.y + 30, { steps: 4 }); await p.mouse.move(s.x + s.width / 2, s.y + s.height / 2, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
    const d = await ev(f => ({ on: (__maze.M.board[22] || []).includes(f), bench: __maze.M.bench.includes(f) }), first); if (d.on || !d.bench) bad.push('방의 첫째 권속을 끌어내지 못했다 ' + JSON.stringify(d));
    await tap(`#mz-bench .mz-slot[data-u="${first}"]`); await tapCell(22); if (!(await ev(f => (__maze.M.board[22] || []).includes(f), first))) bad.push('끌어낸 권속을 다시 세우지 못했다'); }
  // 침입: 빠르게 끝까지
  const raid = async (label, full) => {
    await tap('#mz-bench [data-m="raid"]'); await p.waitForTimeout(300);
    if (!full) { await ev(() => __maze.skip()); await p.waitForTimeout(300); return ev(() => ({ res: __maze.P && __maze.P.res.result, over: __maze.M.phase === 'over' })); }
    // 빠르기: 보통 1 · 빠르게 3 · 아주 빠르게 5 (느리게 없음). 둥지 전투의 빠르기는 건드리지 않는다. 5배로 보며 이름표 겹침 · 프레임을 잰다
    { const d = await ev(() => Array.from(document.querySelectorAll('#mz-raid [data-m="spd"]')).map(b => b.textContent + ':' + b.dataset.v).join()); if (d !== '보통:1,빠르게:3,아주 빠르게:5') bad.push(label + ': 빠르기 단추가 맞지 않는다 ' + d); }
    const ls0 = await ev(() => __maze.meta ? __maze.meta.lairSpeed : undefined);
    await tap('#mz-raid [data-m="spd"][data-v="5"]'); if ((await ev(() => __maze.speed())) !== 5) bad.push(label + ': 아주 빠르게가 안 눌린다');
    await ev(() => { const F = window.__mzfps = { n: 0, worst: 0, t0: performance.now(), last: performance.now(), on: true }; const f = t => { if (!F.on) return; F.n++; F.worst = Math.max(F.worst, t - F.last); F.last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const seen = { labOv: 0 }; const t0 = Date.now();
    for (let k = 0; k < 1200; k++) {
      const st = await ev(() => { const P = __maze.P, L = window.__lair, s = L && L.F ? L.stats() : null; return { back: !!(P && P.back), crop: !!(L && L.U.crop), sc: L ? L.U.scale : 0, tags: __maze.dbg().tags || 0, done: P && P.done, type: P && P.cur && P.cur.type, party: __maze.dbg().party, dark: __maze.dbg().dark, rp: !!(s && s.replay), lr: !document.getElementById('lr') || !document.getElementById('lr').hidden, egg: P && P.egg, i: P && P.i, cell: P && P.cur && P.cur.cell }; });
      if (st.type === 'walk' && st.party && !seen.walk) { seen.walk = 1; await snap(label + '_walk'); }
      if (st.type === 'travel' && !seen.travel) { seen.travel = 1; await snap(label + '_tunnel'); }
      if (st.rp && st.cell === 'core' && !seen.core) { seen.core = 1; seen.coreCrop = st.crop; await p.waitForTimeout(700); await shot(label + '_corefight'); }
      if (st.type === 'egg' && seen.core) seen.eggAfter = 1;
      if (st.rp && !seen.fight) { seen.fight = 1; seen.crop = st.crop; seen.sc = st.sc; await p.waitForTimeout(700); await shot(label + '_fight'); }
      if (st.back && !seen.back) { seen.back = 1; await snap(label + '_back'); }
      if (st.type === 'egg' && !seen.egg) { seen.egg = 1; await snap(label + '_egg'); }
      if (st.dark) seen.dark = 1;
      if (st.rp && seen.lrsp == null) seen.lrsp = await ev(() => window.__lair.U.speed);
      { const ov = await ev(() => { const r = Array.from(document.querySelectorAll('#mz-ov .mz-lab:not(.dark)')).map(e => e.getBoundingClientRect()); let n = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const w = Math.min(r[i].right, r[j].right) - Math.max(r[i].left, r[j].left), h = Math.min(r[i].bottom, r[j].bottom) - Math.max(r[i].top, r[j].top); if (w > 0 && h > 0 && w * h > 0.35 * Math.min(r[i].width * r[i].height, r[j].width * r[j].height)) n++; } return { n, dark: document.querySelectorAll('#mz-ov .mz-lab.dark').length }; }); if (ov.n > seen.labOv) { seen.labOv = ov.n; if (!seen.ovShot) { seen.ovShot = 1; await snap(label + '_labov'); } } seen.darkMax = Math.max(seen.darkMax || 0, ov.dark); }
      if (st.done) break; await p.waitForTimeout(60);
    }
    seen.secs = Math.round((Date.now() - t0) / 1000); { const f = await ev(() => { const F = window.__mzfps; F.on = false; return { fps: Math.round(F.n / ((performance.now() - F.t0) / 1000)), worst: Math.round(F.worst) }; }); seen.fps = f.fps; seen.worst = f.worst; if (f.fps < 30) bad.push(label + ': 5배에서 프레임이 떨어진다 ' + JSON.stringify(f)); }
    if (seen.fight && seen.lrsp !== 5) bad.push(label + ': 방 싸움 재생이 5배가 아니다 ' + seen.lrsp); if ((await ev(() => __maze.meta ? __maze.meta.lairSpeed : undefined)) !== ls0) bad.push(label + ': 둥지 전투의 빠르기를 건드렸다'); if (seen.labOv > 1) bad.push(label + ': 5배에서 이름표가 겹친다 ' + seen.labOv); if (seen.darkMax > 6) bad.push(label + ': 5배에서 어둠 숫자가 쌓인다 ' + seen.darkMax);
    await p.waitForTimeout(150); seen.tags = await ev(() => __maze.dbg().tags || 0);
    await p.waitForTimeout(400); const r = await ev(() => ({ res: __maze.P && __maze.P.res.result, over: __maze.M.phase === 'over', sheet: !document.getElementById('mz-sheet').hidden, title: (document.querySelector('#mz-sheet h3') || {}).textContent || '', kinds: __maze.P ? __maze.P.res.steps.map(s => s.type === 'fight' ? (s.core ? 'core' : 'room') : s.type).filter(k => k !== 'walk') : [], next: !!document.querySelector('#mz-sheet [data-m="next"]'), lrHidden: !document.getElementById('lr') || document.getElementById('lr').hidden }));
    if (!r.sheet || !r.lrHidden) bad.push(label + ': 침입 뒤에 결과가 없다 ' + JSON.stringify(r)); if (!r.over && !r.next) bad.push(label + ': 결과에 「준비」가 없다');
    if (r.res && !r.over && (r.res.win ? !/막아 냈다/.test(r.title) : !/알이 깎였다/.test(r.title))) bad.push(label + ': 결과 제목이 맞지 않는다 ' + r.title);
    if (r.kinds.includes('core') && (!seen.travel || !seen.core)) bad.push(label + ': 출구 밑 굴 → 본체 방 싸움을 못 봤다 ' + JSON.stringify(seen)); if (r.kinds.includes('core') && r.kinds.includes('egg') && !seen.eggAfter) bad.push(label + ': 본체 방 뒤에 알의 방이 오지 않았다'); if (seen.core && !seen.coreCrop) bad.push(label + ': 본체 방 싸움이 잘리지 않았다');
    await shot(label + '_result'); return Object.assign(r, { seen });
  };
  const r1 = await raid('r1', true);
  if (!r1.seen.walk) bad.push('일행이 걷는 것을 못 봤다'); if (!r1.seen.fight) bad.push('방 싸움을 못 봤다'); if (!r1.seen.dark) bad.push('굴 속의 어둠이 정신을 깎는 것을 못 봤다'); if (r1.seen.secs > 120) bad.push('빠르게로 침입이 ' + r1.seen.secs + '초 걸렸다'); if (r1.seen.fight && !r1.seen.crop) bad.push('방 싸움이 쓰는 칸만 잘리지 않았다'); if (r1.seen.fight && dev && !(r1.seen.sc > 1.05)) bad.push('방 싸움이 커지지 않았다 ' + r1.seen.sc); if (!r1.seen.tags) bad.push('침입 뒤 방의 꼬리표가 없다');
  await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(300);
  // 막았으면 무료 하나 (방 종류 또는 함정)
  if (r1.res && r1.res.win) { if (!(await p.$('#mz-sheet [data-m="reward"]'))) bad.push('막았는데 보상 창이 없다'); else { await shot('reward'); const o = await ev(() => __maze.view().reward.opts[0]); await tap('#mz-sheet [data-m="reward"][data-i="0"]');
      const d = await ev(id => ({ free: __maze.view().free.map(q => q.id), id }), o.id); if (!d.free.includes(o.id)) bad.push('보상을 골랐는데 무료가 없다 ' + JSON.stringify(d));
      await tapCell(17); await tap(`#mz-sheet [data-m="use"][data-u="${o.type === 'room' ? 'kin' : 'trap'}"]`); const lab = await ev(id => (document.querySelector(`#mz-sheet [data-id="${id}"] b`) || {}).textContent || '', o.id); if (!/· 0/.test(lab)) bad.push('무료인 것이 값 0 으로 보이지 않는다 ' + lab); await shot('free'); if (o.type !== 'room') await tap('#mz-sheet [data-m="use"][data-u="kin"]'); await close(); } }
  { const d = await ev(() => ({ raid: __maze.M.raid, phase: __maze.Z.phase, bench: !document.getElementById('mz-bench').hidden, path: __maze.dbg().path })); if (d.raid !== 2 || d.phase !== 'prep' || !d.bench || !d.path) bad.push('결과 뒤에 준비로 돌아오지 않았다 ' + JSON.stringify(d)); }
  await shot('prep2');
  // 저장 · 새로 고침 · 이어하기
  { const a = await ev(() => JSON.stringify([__maze.M.raid, __maze.M.gold, __maze.M.egg, __maze.M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join(), __maze.M.board]));
    await p.reload(); await p.waitForTimeout(500); if (!(await p.$('[data-z="freeNew"]')) || !/이어하기/.test(await ev(() => document.querySelector('[data-z="free"]').textContent))) bad.push('새로 고침 뒤에 이어하기가 없다'); else { await shot('title_cont', true); await tap('[data-z="free"]'); await p.waitForTimeout(400);
      const z = await ev(() => JSON.stringify([__maze.M.raid, __maze.M.gold, __maze.M.egg, __maze.M.grid.map(g => (g.dug ? 1 : 0) + (g.use || '') + (g.room || '') + (g.trap || '')).join(), __maze.M.board])); if (a !== z) bad.push('이어한 판이 다르다'); }
    if (await ev(() => !!localStorage.getItem('oldnest.lairrun'))) bad.push('굴 짓기가 둥지 전투의 저장을 건드렸다');
    { const d = await ev(() => { const a = __maze.speed(); __maze.meta.mazeSpeed = 0.6; __maze.Z.speed = null; const b = __maze.speed(); __maze.meta.mazeSpeed = a; __maze.Z.speed = null; return [a, b, __maze.speed()]; }); if (d[0] !== 5 || d[1] !== 1 || d[2] !== 5) bad.push('고른 빠르기가 남지 않거나 0.6 이 보통이 되지 않는다 ' + JSON.stringify(d)); } }
  // 넷째까지 (넘기기)
  let last = null; for (let k = 0; k < 6; k++) { await ev(() => { const M = __maze.M; M.gold = Math.max(M.gold, 10); }); last = await raid('r' + (k + 2), false); if (last.over) break; await shot('r' + (k + 2) + '_result', true); await tap('#mz-sheet [data-m="next"]'); await p.waitForTimeout(200); await close(); }
  await p.waitForTimeout(300); await shot('over');
  { const d = await ev(() => ({ over: __maze.M.over, again: !!document.querySelector('#mz-sheet [data-m="again"]'), home: !!document.querySelector('#mz-sheet [data-m="home"]'), saved: localStorage.getItem('nestmaze.maze') || localStorage.getItem('oldnest.maze') })); if (!d.over || !d.again || !d.home) bad.push('판 끝 화면이 맞지 않는다 ' + JSON.stringify(d)); if (d.saved) bad.push('끝난 판의 저장이 남았다'); }
  await tap('#mz-sheet [data-m="again"]'); await p.waitForTimeout(300); if ((await ev(() => __maze.M.raid)) !== 1) bad.push('다시 한 판이 처음이 아니다');
  await tap('#mz-bar [data-m="menu"]'); await shot('menu'); await tap('#mz-sheet [data-m="home"]'); if (await ev(() => document.getElementById('title').hidden)) bad.push('처음으로가 안 된다');
  // 안내를 켠 새 판: 상점 → 고르면 빛나는 통로 → 세우기 → 파기 → 침입이 출구 밑 굴로 본체 방 → 알의 방
  // 미로 함정 셋: 미리보기(순간 이동은 끊고 휘는 화살 · 끌림/헛갈림 표지 · 「헤맨다」/「길잡이 · 추적자」) → 침입(끌린다 · 헛갈린다 · 삼킴)
  let r8 = null;
  { const c3 = await FZM.context(b, dev), q = await c3.newPage(); q.setDefaultTimeout(9000); q.on('pageerror', e => errs.push('3: ' + e.message));
    await q.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await q.route(/fonts\./, r => r.abort()); if (FZM.FZ) await q.addInitScript(FZM.initScript(FZM.FZ));
    await q.goto('http://nest.test/'); await q.waitForTimeout(400); await q.click('[data-z="free"]'); await q.waitForTimeout(400); const e3 = (f, a) => q.evaluate(f, a);
    await e3(() => { const M = __maze.M; [6, 11, 16, 21, 26, 8, 13, 18, 23, 28].forEach(c => Object.assign(M.grid[c], { dug: true, use: 'path' })); MAZE.setUse(M, 26, 'trap', 'tr_maw'); MAZE.setUse(M, 21, 'trap', 'tr_lure'); MAZE.setUse(M, 22, 'trap', 'tr_mirror'); __maze.redraw(); });
    await q.waitForTimeout(250); await q.screenshot({ path: path.join(out, '80_maze_traps.png') });
    const pv = await e3(() => { const n = __maze.view().next, d = __maze.dbg(); return { warps: n.warps.length, lured: n.lured.length, conf: n.confused.length, arrow: d.warpArrow || 0, marks: d.marks || 0, btn: document.getElementById('mz-next').textContent, clip: null }; });
    if (!pv.warps || !pv.lured || !pv.conf) bad.push('미로 함정 지도가 삼킴·끌림·헛갈림을 만들지 않는다 ' + JSON.stringify(pv)); if (pv.warps && !pv.arrow) bad.push('순간 이동 화살이 없다'); if ((pv.lured || pv.conf) && !pv.marks) bad.push('끌림·헛갈림 표지가 없다'); if (pv.btn !== '헤맨다') bad.push('길잡이 없는 일행이 「헤맨다」가 아니다 ' + pv.btn);
    { const cl = await e3(FZM.clipScript); cl.forEach(t => bad.push('미로 지도: ' + t)); }
    { const t = await e3(() => { const M = __maze.M, r0 = M.raid; M.raid = 3; __maze.redraw(); const t = document.getElementById('mz-next').textContent; M.raid = r0; __maze.redraw(); return t; }); if (t !== '길잡이 · 추적자') bad.push('길잡이 있는 일행이 「길잡이 · 추적자」가 아니다 ' + t); }
    await q.click('#mz-next'); await q.waitForTimeout(150); { const t = await e3(() => (document.querySelector('#mz-sheet .mz-note') || {}).textContent || ''); if (!/헤맨다/.test(t) || !/삼킴 1/.test(t)) bad.push('일행 창 머리글이 맞지 않는다 ' + t); } await q.click('#mz-sheet [data-m="close"]');
    await q.click('#mz-bench [data-m="raid"]'); await q.waitForTimeout(200); await q.click('#mz-raid [data-m="spd"][data-v="1"]');
    const seen = {}, t0 = Date.now(); for (let k = 0; k < 3000; k++) { const st = await e3(() => { const P = __maze.P, d = __maze.dbg(); return { wf: !!(P && P.warpFx), wk: P && P.warpFx ? (__maze.Z.t - P.warpFx.t0) / P.warpFx.dur : 0, lure: d.lureLab || 0, conf: d.confLab || 0, done: P && P.done }; });
      if (st.lure && !seen.lure) { seen.lure = 1; await q.screenshot({ path: path.join(out, '81_lure.png') }); }
      if (st.conf && !seen.conf) { seen.conf = 1; await q.screenshot({ path: path.join(out, '82_confused.png') }); }
      if (st.wf && st.wk > 0.25 && !seen.sw) { seen.sw = 1; await q.screenshot({ path: path.join(out, '83_swallow.png') }); }
      if (st.wf && st.wk > 0.7 && !seen.sp) { seen.sp = 1; await q.screenshot({ path: path.join(out, '84_spit.png') }); }
      if (st.done) break; await q.waitForTimeout(30); }
    seen.secs = Math.round((Date.now() - t0) / 100) / 10; const rr = await e3(() => { const r = __maze.P.res.result, st = __maze.P.res.steps; return { warps: r.warps.length, lured: r.lured.length, conf: r.confused.length, warpStep: st.some(s => s.type === 'warp'), walkT: __maze.P.walkT }; }); r8 = Object.assign({ seen }, rr);
    if (rr.lured && !seen.lure) bad.push('「불빛에 끌린다」를 못 봤다'); if (rr.conf && !seen.conf) bad.push('「헛갈린다」를 못 봤다'); if (rr.warpStep && (!seen.sw || !seen.sp)) bad.push('삼키는 구멍에 빨려 들었다 토해지는 것을 못 봤다 ' + JSON.stringify(seen)); if (!(rr.walkT >= 0.15 && rr.walkT <= 0.2)) bad.push('걷기 빠르기가 칸당 0.15~0.2초가 아니다 ' + rr.walkT); if (seen.secs > 60) bad.push('보통 빠르기 침입이 ' + seen.secs + '초 걸렸다');
    await c3.close(); }
  let r9 = null;
  { const c2 = await FZM.context(b, dev), q = await c2.newPage(); q.setDefaultTimeout(9000); q.on('pageerror', e => errs.push('2: ' + e.message));
    await q.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await q.route(/fonts\./, r => r.abort()); await q.addInitScript(() => { window.__mazeCoach = 1; }); if (FZM.FZ) await q.addInitScript(FZM.initScript(FZM.FZ));
    await q.goto('http://nest.test/'); await q.waitForTimeout(400); await q.click('[data-z="free"]'); await q.waitForTimeout(400);
    const e2 = (f, a) => q.evaluate(f, a), coach = () => e2(() => { const c = document.getElementById('mz-coach'); return c && !c.hidden ? c.textContent : ''; }), qt = async c => { const pt = await e2(c => __maze.pt(c), c); if (touch) await q.touchscreen.tap(pt.x, pt.y); else await q.mouse.click(pt.x, pt.y); await q.waitForTimeout(200); };
    // 말풍선은 가리키는 대상과 겹치지 않고, 대상의 가운데는 늘 눌린다
    const cover = async label => { await q.waitForTimeout(300); const d = await e2(() => { const c = document.getElementById('mz-coach'), a = __maze.Z.coachAt; if (!c || c.hidden || !a) return null; const r = c.getBoundingClientRect(), ov = !(r.right <= a.left || r.left >= a.right || r.bottom <= a.top || r.top >= a.bottom), el = document.elementFromPoint((a.left + a.right) / 2, (a.top + a.bottom) / 2); return { ov, hit: !!(el && el.closest('#mz-coach')), r: [r.left, r.top, r.right, r.bottom].map(Math.round), a: [a.left, a.top, a.right, a.bottom].map(Math.round) }; }); if (d && (d.ov || d.hit)) bad.push(label + ': 말풍선이 가리키는 대상을 덮는다 ' + JSON.stringify(d)); return d; };
    if (!/상점/.test(await coach())) bad.push('안내의 첫 걸음이 상점이 아니다 ' + (await coach())); await cover('안내 상점');
    await q.screenshot({ path: path.join(out, '90_tut_shop.png') });
    await e2(() => { __maze.M.shop = ['hood', 'shell', 'shell', 'shell', 'shell']; __maze.redraw(); });
    await q.click('#mz-bench [data-m="shopt"]'); await q.waitForTimeout(100); if (!/카드/.test(await coach())) bad.push('서랍을 열었는데 카드 안내가 없다 ' + (await coach())); await cover('안내 카드'); await q.screenshot({ path: path.join(out, '90b_tut_cards.png') });
    await q.click('#mz-shop [data-m="shop"][data-i="0"]'); await q.waitForTimeout(100); if (!/산다/.test(await coach())) bad.push('카드를 골랐는데 「산다」 안내가 없다 ' + (await coach())); await cover('안내 산다'); await q.screenshot({ path: path.join(out, '90c_tut_buy.png') });
    await q.click('#mz-shop [data-m="buy"]'); await q.waitForTimeout(150); await cover('안내 대기석');
    if (!/빛나는 통로/.test(await coach())) bad.push('사고 나서 세우기 안내가 없다 ' + (await coach()));
    await q.click('#mz-bench .mz-slot.has'); await q.waitForTimeout(200);
    { const d = await e2(() => { const c = document.getElementById('mz-coach').getBoundingClientRect(), lit = __maze.dbg().lit.filter(x => typeof x === 'number'); return { lit, cy: c.top + c.height / 2, n: lit.length }; }); if (d.n < 5) bad.push('안내 중 고른 권속의 통로가 밝지 않다 ' + JSON.stringify(d)); }
    await cover('안내 통로'); await q.screenshot({ path: path.join(out, '91_tut_place.png') });
    await qt(17); if ((await e2(() => (__maze.M.board[17] || []).length)) !== 1) bad.push('안내대로 통로에 세우지 못했다');
    if (!/바위/.test(await coach())) bad.push('세운 뒤 파기 안내가 없다 ' + (await coach())); await cover('안내 바위');
    { const c = await e2(() => __maze.view().grid.find(g => g.canDig).cell); await qt(c); await q.waitForTimeout(650); if (!/파기/.test(await coach())) bad.push('바위 창에서 「파기」 안내가 없다 ' + (await coach())); await cover('안내 파기'); await q.click('#mz-sheet [data-m="dig"]'); await q.waitForTimeout(300); if (!/판다/.test(await coach())) bad.push('확인 줄에 「판다」 안내가 없다 ' + (await coach())); await cover('안내 판다'); await q.screenshot({ path: path.join(out, '95_tut_confirm.png') }); await q.click('#mz-sheet [data-m="ok"]'); await q.waitForTimeout(150); }
    if (!/침입/.test(await coach())) bad.push('판 뒤 침입 안내가 없다 ' + (await coach())); await cover('안내 침입'); await q.screenshot({ path: path.join(out, '96_tut_raid.png') });
    await q.click('#mz-bench [data-m="raid"]'); await q.waitForTimeout(200); await q.click('#mz-raid [data-m="spd"][data-v="3"]');
    const seen = {}; for (let k = 0; k < 1500; k++) { const st = await e2(() => { const P = __maze.P, L = window.__lair; return { type: P && P.cur && P.cur.type, rp: !!(L && L.U.replay), cell: P && P.cur && P.cur.cell, done: P && P.done, pos: P && P.pos, at: P && P.at }; });
      if (st.type === 'travel' && !seen.travel) { seen.travel = 1; await q.waitForTimeout(120); await q.screenshot({ path: path.join(out, '92_tunnel.png') }); }
      if (st.rp && st.cell === 'core' && !seen.core) { seen.core = 1; await q.waitForTimeout(800); await q.screenshot({ path: path.join(out, '93_corefight.png') }); }
      if (st.type === 'egg' && !seen.egg) { seen.egg = seen.core ? 2 : 1; seen.eggPos = st.pos; await q.waitForTimeout(150); await q.screenshot({ path: path.join(out, '94_egg.png') }); }
      if (st.done) break; await q.waitForTimeout(50); }
    const kinds = await e2(() => __maze.P.res.steps.map(s => s.type === 'fight' ? (s.core ? 'core' : 'room') : s.type).filter(k => k !== 'walk')); r9 = { seen, kinds };
    if (!kinds.includes('core')) bad.push('본체 방 싸움이 없다(일행이 그 전에 다 쓰러짐) ' + JSON.stringify(kinds)); else if (!seen.travel || !seen.core) bad.push('침입이 출구 밑 굴로 본체 방에 가지 않았다 ' + JSON.stringify(seen));
    if (kinds.includes('egg') && seen.egg !== 2) bad.push('알의 방이 본체 방 뒤에 오지 않았다 ' + JSON.stringify(seen));
    const ep = await e2(() => __maze.pt('egg')), cr = await e2(() => document.getElementById('mz-cv').getBoundingClientRect().bottom); if (ep.y > cr) bad.push('알의 방이 지도 밖으로 나갔다');
    await c2.close(); }
  await b.close();
  console.log(JSON.stringify({ tag, shots: n, r1: r1.seen, r8, r9, errs, bad }, null, 1)); if (errs.length || bad.length) process.exit(1);
})().catch(e => { console.error('시험 실패', e); process.exit(1); });
