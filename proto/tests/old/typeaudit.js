// 글자 검사: ux.js 가 지나가는 화면과 한 방울 구간에서, 잘 안 보이는 글과 이상하게 끊긴 줄을 찾는다.
//   node tests/typeaudit.js [기기: pc|pc720|iPhone 14|iPhone SE|small] [이름표=before]
// 찾는 것: 작은 글(small), 픽셀 글꼴의 어긋난 크기(pixsize), 흐린 글(contrast), 세로로 읽히는 좁은 칸(vertical),
//          마지막 줄에 한두 글자만 남은 것(orphan), 숫자와 단위·이름과 레벨 사이에서 끊긴 것(split), 세 줄 넘는 단추(btn3)
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const HTML = path.join(__dirname, '..', '..', 'PLAY-GAME.html');
const devName = process.argv[2] || 'pc', TAG = process.argv[3] || 'before';
const OUT = path.join(__dirname, '..', '..', 'audit_' + TAG + '_' + devName.replace(/\s+/g, '')); fs.mkdirSync(OUT, { recursive: true });
const FOUND = {}; let shots = 0;

const AUDIT = () => {
  const out = [], vis = e => e && !e.hidden && e.getClientRects().length > 0, phone = innerWidth <= 760;
  const lum = c => { const a = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const rgb = s => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const bgOf = e => { let c = [20, 23, 42], stack = []; for (let q = e; q && q !== document.documentElement; q = q.parentElement) { const b = rgb(getComputedStyle(q).backgroundColor); if (b && b.a > 0) { stack.push(b); if (b.a >= 0.99) break; } } for (let i = stack.length - 1; i >= 0; i--) { const b = stack[i]; c = c.map((v, k) => v * (1 - b.a) + b.c[k] * b.a); } return c; };
  const roots = [...document.querySelectorAll('#game, #modal, #title, #scene, #toast, #pro')].filter(vis);
  const seen = new Set();
  for (const root of roots) for (const e of root.querySelectorAll('*')) {
    if (!vis(e) || seen.has(e)) continue; const own = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()); if (!own.length) continue; seen.add(e);
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity < 0.2) continue; const box = e.getBoundingClientRect(); if (box.width < 1 || box.height < 1 || box.bottom < 0 || box.top > innerHeight) continue;
    const text = e.textContent.replace(/\s+/g, ' ').trim(), fsz = parseFloat(cs.fontSize), pix = /NestPix/.test(cs.fontFamily.split(',')[0]), who = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const add = (cat, extra) => out.push({ cat, text: text.slice(0, 46), who, fs: fsz, w: Math.round(box.width), x: Math.round(box.left), y: Math.round(box.top), bw: Math.round(box.width), bh: Math.round(box.height), extra: extra || '' });
    if (fsz < 12 || (phone && !pix && fsz < 13 && text.length > 3)) add('small', fsz + 'px');
    if (pix && (fsz < 12 || (fsz % 12 !== 0 && fsz % 16 !== 0))) add('pixsize', fsz + 'px');
    { const fg = rgb(cs.color); if (fg) { const bg = bgOf(e), f = fg.c.map((v, k) => v * fg.a + bg[k] * (1 - fg.a)), L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05), big = fsz >= 24 || (pix && fsz >= 16); if (ratio < (big ? 3 : 4.5) && !e.closest('[disabled]') && !/lock|off/.test(who)) add('contrast', ratio.toFixed(2) + ' ' + cs.color); } }
    // 줄을 글자 단위로 나눠 본다
    let lines = []; for (const n of own) { const t = n.textContent; if (t.length > 260) continue; const r = document.createRange(); let cur = null; for (let i = 0; i < t.length; i++) { if (/\s/.test(t[i])) { if (cur) cur.s += ' '; continue; } r.setStart(n, i); r.setEnd(n, i + 1); const q = r.getClientRects()[0]; if (!q) continue; const top = Math.round(q.top); if (!cur || Math.abs(top - cur.top) > q.height * 0.6) { cur = { top, s: '' }; lines.push(cur); } cur.s += t[i]; } }
    lines = lines.map(l => l.s.trim()).filter(Boolean);
    if (lines.length >= 3 && text.length > 6 && lines.every(l => l.length <= 4)) add('vertical', lines.length + '줄');
    else if (lines.length >= 4 && text.length > 8 && box.width < fsz * 4) add('vertical', lines.length + '줄 폭 ' + Math.round(box.width));
    if (lines.length >= 2) { const last = lines[lines.length - 1].replace(/[.,!?…·)"'」]/g, ''); if (last.length <= 2 && text.length > 8) add('orphan', '끝줄 "' + lines[lines.length - 1] + '"'); }
    for (let i = 0; i + 1 < lines.length; i++) { const a = lines[i], b2 = lines[i + 1]; if ((/[0-9+\-−×/]$/.test(a) && /^(방울|명|일|칸|%|초|번|개|마리|배|구|단계|밤|G|\/|[0-9])/.test(b2)) || (/Lv$/.test(a) && /^[0-9]/.test(b2)) || /[(「"']$/.test(a) || /^[)」.,%]/.test(b2)) { add('split', '"' + a.slice(-8) + '" | "' + b2.slice(0, 8) + '"'); break; } }
    const btn = e.closest('button'); if (btn && lines.length >= 3 && e === btn) add('btn3', lines.length + '줄');
  }
  return out;
};

(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName === 'small') ctx = await b.newContext({ viewport: { width: 375, height: 620 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else if (devName === 'pc720') ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  else if (devName === 'pc') ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  else { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); }
  const touch = !/^pc/.test(devName), p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: fs.readFileSync(HTML, 'utf8') })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300); await p.evaluate(() => { __nest.META.auto = false; });
  const tap = async s => { const el = p.locator(s).locator('visible=true').first(); if (touch) await el.tap(); else await el.click(); await p.waitForTimeout(140); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  let n = 0;
  const check = async label => { await p.waitForTimeout(180); n++; const list = await p.evaluate(AUDIT);
    for (const f of list) { const key = f.cat + '|' + f.who + '|' + f.text; if (FOUND[key]) { FOUND[key].n++; continue; } FOUND[key] = Object.assign({ label, n: 1 }, f);
      if (shots < 60 && (f.cat === 'vertical' || f.cat === 'split' || f.cat === 'orphan' || f.cat === 'btn3')) { shots++; const vp = p.viewportSize(), x = Math.max(0, f.x - 30), y = Math.max(0, f.y - 30), w = Math.min(vp.width - x, f.bw + 60), h = Math.min(vp.height - y, f.bh + 60); if (w > 4 && h > 4) await p.screenshot({ path: path.join(OUT, f.cat + '_' + String(shots).padStart(2, '0') + '_' + label + '.png'), clip: { x, y, width: w, height: h } }).catch(() => {}); } } };
  // ---- ux.js 의 걸음을 그대로 빌린다 (check 만 바꿔 끼움) ----
  const closeM = async () => { for (let i = 0; i < 6; i++) { if (await has('#modal [data-a="event"]:not([disabled])')) await tap('#modal [data-a="event"]:not([disabled])'); else if (await has('#modal [data-a="close"]')) await tap('#modal [data-a="close"]'); else break; } };
  const src = fs.readFileSync(path.join(__dirname, 'ux.js'), 'utf8'); const i0 = src.indexOf('  const tabs = async'), i1 = src.indexOf("  } catch (e) { errs.push('검사 스크립트");
  const walk = src.slice(i0, i1) + '  } catch (e) { errs.push("걸음: " + e.message.split("\\n")[0]); }';
  const bad = [], trunc = {}, log = () => {}; void bad; void trunc;
  await eval('(async () => {' + walk + '})()');
  // ---- 한 방울 구간: 시작 카드, 놀이 중, 돋우는 창, 결과 창 ----
  try { await p.goto('http://nest.test/'); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__r = null; runPrologue({ asp: 'dusk', seed: 41, tut: true, look: 'thorn' }).then(r => { window.__r = r; }); }); await p.waitForTimeout(500); await check('pro_card');
    await p.evaluate(() => { __pro.closeIntro(); __pro.manual = true; const s = __pro.sim; for (const a in s.S.purse) s.S.purse[a] = 30; s.buy('mouth_dusk'); s.buy('eye_abyss'); __pro.step(40); }); await p.waitForTimeout(300); await check('pro_play');
    await p.evaluate(() => { __pro.openShop(); }); await p.waitForTimeout(300); await check('pro_shop'); await p.evaluate(() => { __pro.select && __pro.select('skin_brood'); }); await p.waitForTimeout(200); await check('pro_shop_locked');
    await p.evaluate(() => { __pro.closeShop(); __pro.sim.S.stage = 3; __pro.end('settle'); }); await p.waitForTimeout(600); await check('pro_result');
  } catch (e) { errs.push('한 방울: ' + e.message.split('\n')[0]); }
  const all = Object.values(FOUND), by = {}; all.forEach(f => { (by[f.cat] = by[f.cat] || []).push(f); });
  const cats = ['small', 'pixsize', 'contrast', 'vertical', 'orphan', 'split', 'btn3'];
  console.log(devName, TAG, '· 화면', n, '·', cats.map(c => c + ' ' + (by[c] || []).length).join(' · '));
  fs.writeFileSync(path.join(OUT, 'found.json'), JSON.stringify(all, null, 1));
  if (process.argv.includes('-v')) cats.forEach(c => (by[c] || []).slice(0, 14).forEach(f => console.log('  ' + c.padEnd(9), f.label.padEnd(16), (f.extra + '').padEnd(22), f.who.slice(0, 34).padEnd(34), f.text)));
  console.log(errs.length ? '오류: ' + errs.slice(0, 4).join(' / ') : 'no errors'); await b.close();
})();
