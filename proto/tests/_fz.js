// 큰 글씨 흉내: 안드로이드 웹뷰(카카오톡 안 브라우저의 "가가")는 글자를 통째로 키운다. 화면마다 모든 글자를 k 배로 키우고, 잘리거나 겹친 글을 찾는다.
// 쓰는 곳: tests/ux.js, tests/story.js, tests/prologue.js (환경 변수 FZ=1.3), tests/bigfont.js
const pw = require('playwright');
// 페이지에 넣는 스크립트: 제 글자 크기를 가진 요소만 k 배로 (물려받는 요소는 부모를 따라 저절로 커진다)
const initScript = k => `(() => { const K = ${+k}; if (!(K > 1)) return; window.__fz = K;
  const proc = root => { if (!root || root.nodeType !== 1) return; const els = [root].concat(Array.from(root.querySelectorAll('*')));
    for (const e of els) { if (!(e instanceof HTMLElement) || e.dataset.fzo || e.tagName === 'CANVAS' || e.tagName === 'SCRIPT' || e.tagName === 'STYLE') continue;
      const cs = parseFloat(getComputedStyle(e).fontSize), p = e.parentElement; let inh = false, po = 0;
      if (p && p.dataset.fzo) { po = parseFloat(p.dataset.fzo); const ps = parseFloat(getComputedStyle(p).fontSize); if (Math.abs(cs - ps) < 0.05 && Math.abs(cs - po) > 0.05) inh = true; }
      e.dataset.fzo = String(inh ? po : cs); if (!inh) e.style.setProperty('font-size', (cs * K) + 'px', 'important'); } };
  const go = () => { proc(document.body); new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType === 1) proc(n); else if (n.nodeType === 3 && n.parentElement) proc(n.parentElement); }); }).observe(document.body, { childList: true, subtree: true }); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go); })();`;
// 잘린 글 찾기: 글자 조각의 상자가 overflow 가 막힌 조상 밖으로 나가거나, 화면 밖으로 나가면 잘린 것
const clipScript = () => {
  const out = [], seen = new Set(), vw = innerWidth, vh = innerHeight;
  const vis = e => { for (let q = e; q && q !== document.body; q = q.parentElement) { if (q.hidden) return false; const s = getComputedStyle(q); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim(); if (!t || t.length < 1) continue; const el = n.parentElement; if (!el || !vis(el) || el.closest('[aria-hidden="true"], .sr, #nojs, .tn-hide')) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const rs = Array.from(rg.getClientRects()).filter(r => r.width > 0.5 && r.height > 0.5); if (!rs.length) continue;
    let why = null;
    for (const r of rs) {
      if ((r.right > vw + 1 || r.left < -1) && !(function () { for (let a = el; a; a = a.parentElement) { const s = getComputedStyle(a); if (/auto|scroll/.test(s.overflowX) && a.scrollWidth > a.clientWidth) return true; } return false; })()) { why = '화면 밖(가로)'; break; }
      let sx = false, sy = false;
      for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
        const s = getComputedStyle(a), ox = s.overflowX, oy = s.overflowY; if (ox === 'visible' && oy === 'visible') continue;
        const b = a.getBoundingClientRect();
        if (!sx && (ox === 'hidden' || ox === 'clip') && (r.right > b.right + 1.5 || r.left < b.left - 1.5)) { why = '가로로 잘림 (' + (a.id || a.className || a.tagName) + ')'; break; }
        if (!sy && (oy === 'hidden' || oy === 'clip') && (r.bottom > b.bottom + 1.5 || r.top < b.top - 1.5)) { why = '세로로 잘림 (' + (a.id || a.className || a.tagName) + ')'; break; }
        if (/auto|scroll/.test(ox)) sx = true; if (/auto|scroll/.test(oy)) sy = true; if (sx && sy) break;
      }
      if (why) break;
      if (r.bottom > vh + 1 && !(function () { for (let a = el; a; a = a.parentElement) { const s = getComputedStyle(a); if (/auto|scroll/.test(s.overflowY) && a.scrollHeight > a.clientHeight) return true; } return false; })()) { why = '화면 밖(세로)'; break; }
    }
    // 단추에 가려진 글: 글 조각 가운데에서 맨 위에 있는 것이 다른 단추면 (같은 층일 때만. 위에 뜬 창이 덮는 것은 괜찮다)
    const inView = (function () { const q = rs[rs.length - 1]; for (let a = el.parentElement; a; a = a.parentElement) { if (/auto|scroll/.test(getComputedStyle(a).overflowY)) { const b = a.getBoundingClientRect(); return q.top >= b.top - 1 && q.bottom <= b.bottom + 1; } } return q.top >= 0 && q.bottom <= vh; })();
    if (!why && inView) { const LAY = '#pro, #hud, #game, #title, #modal', r0 = rs[rs.length - 1], pts = [0.15, 0.5, 0.9].map(f => [r0.left + r0.width * f, r0.top + r0.height / 2]), cb = pts.map(([x, y]) => document.elementFromPoint(Math.min(vw - 1, Math.max(0, x)), Math.min(vh - 1, Math.max(0, y)))).map(t => t && t.closest('button')).find(b => b && !b.contains(el));
      if (cb && !cb.contains(el) && !el.contains(cb) && !el.closest('button') && cb.closest(LAY) === el.closest(LAY) && !(function () { const ov = cb.closest('.pro-shop, .pro-end, .pro-intro, #right, #modal'); return ov && !ov.contains(el); })()) why = '단추에 가려짐 「' + cb.textContent.trim().slice(0, 10) + '」'; }
    if (!why && getComputedStyle(el).textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) why = '말줄임';
    if (why) { const key = t.slice(0, 24) + '|' + why; if (!seen.has(key)) { seen.add(key); out.push('「' + t.slice(0, 24) + '」 ' + why); } }
  }
  // 칸 옆으로 넘쳐 이웃을 덮는 숫자·단추
  document.querySelectorAll('button, .stat').forEach(b => { if (!vis(b)) return; const r = b.getBoundingClientRect(); if (!r.width) return; const rg = document.createRange(); rg.selectNodeContents(b); const tr = rg.getBoundingClientRect(); if (tr.width && (tr.right > r.right + 2 || tr.left < r.left - 2)) out.push('옆으로 넘침 「' + b.textContent.trim().slice(0, 20) + '」'); });
  // 단추 안의 글이 두 줄로 접혀 단추 높이를 넘는 경우
  document.querySelectorAll('button').forEach(b => { if (!vis(b)) return; const r = b.getBoundingClientRect(); if (!r.width) return; if (b.scrollHeight > b.clientHeight + 2 && getComputedStyle(b).overflowY !== 'visible') out.push('단추 넘침 「' + b.textContent.trim().slice(0, 20) + '」'); });
  return out;
};
// 안드로이드 크기
const ANDROID = { a360: { viewport: { width: 360, height: 700 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }, a412: { viewport: { width: 412, height: 780 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true } };
async function context(b, devName) {
  if (ANDROID[devName]) return b.newContext(ANDROID[devName]);
  if (devName === 'small') return b.newContext({ viewport: { width: 375, height: 620 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (devName === 'laptop') return b.newContext({ viewport: { width: 1280, height: 680 } });
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; return b.newContext(dev); }
  return b.newContext({ viewport: { width: 1366, height: 768 } });
}
module.exports = { initScript, clipScript, ANDROID, context, FZ: +(process.env.FZ || 0) };
