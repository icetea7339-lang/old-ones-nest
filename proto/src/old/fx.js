// 옛 것의 둥지 — 결정적 순간의 연출. 흔들림·번쩍임·잠깐 멈춤·가루.
// 설정의 "흔들림"을 끄거나 기기가 움직임 줄이기를 원하면 흔들림은 하지 않고 번쩍임은 아주 약하게 한다.
// 빨리 감기(4배)나 건너뛰기 중에는 무대 연출을 만들지 않는다. 어떤 연출도 1.2초를 넘지 않고, 누르면 바로 끝난다.
const motionOk = () => META.shake !== false && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const fastNow = () => ST.mode === 'night' && (ST.skip || ST.speed >= 4);

// ---- 무대(캔버스) ----
function jolt(ms, mag) { if (!motionOk() || fastNow()) return; const t = now(); if ((ST.shake || 0) < t + ms) ST.shake = t + ms; ST.shakeMag = Math.max(mag || 1, ST.shake > t ? ST.shakeMag || 1 : 0); }
function flashC(col, ms) { if (fastNow()) return; ST.flash = now() + (motionOk() ? ms : Math.min(ms, 80)); ST.flashCol = motionOk() ? col : col.slice(0, 7) + '22'; }
// 무대 좌표에 가루를 뿌린다
function burst(x0, y0, col, n, spd, dur) {
  if (fastNow()) return; const t = now(), cols = Array.isArray(col) ? col : [col];
  for (let k = 0; k < (n || 14); k++) { const a = Math.random() * 6.283, v = (spd || 1) * (0.06 + Math.random() * 0.12); ST.sparks.push({ dot: true, x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.05, t0: t, dur: (dur || 520) * (0.7 + Math.random() * 0.5), col: cols[k % cols.length], sz: Math.random() < 0.3 ? 4 : 2 }); }
}
function ringAt(x0, y0, col, r1, dur) { if (fastNow()) return; ST.sparks.push({ ring: true, x: x0, y: y0, t0: now(), dur: dur || 420, col, r1: r1 || 24 }); }
// 잠깐 멈춤: 무대의 시계를 ms 동안 세운다 (빨리 감기 중에는 하지 않는다)
function hitStop(ms) {
  if (fastNow() || ST.freezeAt) return Promise.resolve();
  const t = performance.now(); ST.freezeAt = now();
  return new Promise(res => setTimeout(() => { ST.debt = (ST.debt || 0) + (performance.now() - t); ST.freezeAt = 0; res(); }, ms));
}
const entMid = e => { const size = 16 * (e.scale || S); return { x: e.x + (e.can ? e.can.width * (e.scale || S) / 2 : size / 2), y: e.y + (e.can ? e.can.height * (e.scale || S) / 2 : size / 2) }; };

// ---- 화면(DOM) ----
let fxLayer = null, fxCv = null, fxParts = [], fxRun = false;
function fxDom() {
  if (fxLayer) return fxLayer;
  fxLayer = document.createElement('div'); fxLayer.id = 'fxlayer'; fxCv = document.createElement('canvas'); fxCv.id = 'fxcv'; fxLayer.appendChild(fxCv); document.body.appendChild(fxLayer);
  const skip = () => { fxParts = []; document.querySelectorAll('.fx-run').forEach(el => el.classList.add('fx-done')); fxLayer.classList.remove('fl'); };
  document.addEventListener('pointerdown', skip, true); document.addEventListener('keydown', skip, true);
  return fxLayer;
}
function domFlash(col, ms) {
  const L = fxDom(); L.style.setProperty('--fxc', motionOk() ? col : col.slice(0, 7) + '33'); L.style.setProperty('--fxd', Math.min(1200, ms || 260) + 'ms');
  L.classList.remove('fl'); void L.offsetWidth; L.classList.add('fl');
}
function domShake(lv) {
  if (!motionOk()) return; const el = document.body; const c = lv >= 2 ? 'fx-shake2' : 'fx-shake1';
  el.classList.remove('fx-shake1', 'fx-shake2'); void el.offsetWidth; el.classList.add(c); setTimeout(() => el.classList.remove(c), lv >= 2 ? 520 : 320);
}
// 화면 좌표(px)에 가루
function domBurst(cx, cy, col, n, spd) {
  fxDom(); const cols = Array.isArray(col) ? col : [col], t = performance.now();
  for (let k = 0; k < (n || 24); k++) { const a = Math.random() * 6.283, v = (spd || 1) * (0.12 + Math.random() * 0.32); fxParts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.08, t0: t, dur: 600 + Math.random() * 450, col: cols[k % cols.length], sz: Math.random() < 0.3 ? 5 : 3 }); }
  if (!fxRun) { fxRun = true; requestAnimationFrame(fxTick); }
}
function fxTick() {
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight;
  if (fxCv.width !== Math.round(W * dpr) || fxCv.height !== Math.round(H * dpr)) { fxCv.width = Math.round(W * dpr); fxCv.height = Math.round(H * dpr); }
  const x = fxCv.getContext('2d'), t = performance.now(); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
  fxParts = fxParts.filter(p => t - p.t0 < p.dur);
  fxParts.forEach(p => { const dt = t - p.t0, k = dt / p.dur; x.globalAlpha = 1 - k * k; x.fillStyle = p.col; x.fillRect(Math.round(p.x + p.vx * dt), Math.round(p.y + p.vy * dt + 0.00018 * dt * dt), p.sz, p.sz); });
  x.globalAlpha = 1;
  if (fxParts.length) requestAnimationFrame(fxTick); else { fxRun = false; x.clearRect(0, 0, W, H); }
}
const elMid = el => { const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 }; };

// 바뀌는 모습: 옛 모습 → 그림자처럼 맥박 → 새 모습. 열린 창 위에 겹쳐 1.1초 동안만 보인다 (누르면 끝)
function morphOver(host, beforeImg, afterImg, col, strong, title) {
  if (!host) return; const L = fxDom(), old = L.querySelector('.fx-morph'); if (old) old.remove();
  const hr = host.getBoundingClientRect(), d = document.createElement('div'); d.className = 'fx-morph fx-run' + (strong ? ' strong' : ''); d.style.setProperty('--mc', col || '#e8c030');
  Object.assign(d.style, { left: Math.max(0, hr.left) + 'px', top: Math.max(0, hr.top) + 'px', width: Math.min(window.innerWidth, hr.width) + 'px', height: Math.min(window.innerHeight - Math.max(0, hr.top), hr.height) + 'px' });
  d.innerHTML = `<div class="mm"><span class="m0">${beforeImg}</span><span class="m1">${afterImg}</span><i class="mr"></i></div>${title ? `<p class="mt">${title}</p>` : ''}`;
  L.appendChild(d); setTimeout(() => d.remove(), strong ? 1200 : 1050);
  setTimeout(() => { const m = elMid(d.querySelector('.mm')); domBurst(m.x, m.y, strong ? [col, '#fff3a0', '#c8a8ff'] : [col, '#fff3a0'], strong ? 46 : 26, strong ? 1.3 : 1); }, 520);
}

// ---- 순간들 ----
const FXLOG = [];
const FX = {
  kinEvo(m, beforeImg, secret) { FXLOG.push('kinEvo');
    const host = document.querySelector('#modal .sheet'), col = ASPCOL[NEST.KASP && NEST.KASP[m.kind]] || '#e8c030';
    morphOver(host, beforeImg, kinImgM(m, 72), secret ? '#c8a8ff' : col, !!secret, secret ? '비밀 갈래 · ' + esc(NEST.kinName ? NEST.kinName(m) : '') : '');
    domFlash(secret ? '#c8a8ffaa' : col + '88', secret ? 700 : 360); domShake(secret ? 2 : 1); sfx('evo'); if (secret) setTimeout(() => sfx('up'), 380);
  },
  molt(col) { FXLOG.push('molt'); domFlash((col || '#e8c030') + 'aa', 700); domShake(2); setTimeout(() => { const el = document.querySelector('#modal .evo .row'); const m = elMid(el); domBurst(m.x, m.y, [col || '#e8c030', '#fff3a0', '#ffffff'], 50, 1.4); }, 560); },
  breach() { FXLOG.push('breach'); domFlash('#fff3a0bb', 600); domShake(2); jolt(420, 2); },
  captive(el) { FXLOG.push('captive'); const m = elMid(el); domFlash('#c8a8ff66', 360); domBurst(m.x, m.y, ['#c8a8ff', '#e8c030'], 28, 1); sfx('coin'); },
  chapter(el) { FXLOG.push('chapter'); domFlash('#fff3a0aa', 800); domShake(1); setTimeout(() => { const m = elMid(el); domBurst(m.x, m.y, ['#fff3a0', '#e8c030', '#c8a8ff'], 54, 1.3); }, 380); },
  end(win) { FXLOG.push('end'); domFlash(win ? '#fff3a099' : '#ff5f5799', 900); domShake(win ? 1 : 2); },
  // 무대: 쓰러뜨림. 우두머리면 잠깐 멈춘다
  async kill(e) { FXLOG.push('kill');
    const m = entMid(e), boss = e.side === 'inv' && NEST.INV[e.kind] && (NEST.INV[e.kind].boss || NEST.INV[e.kind].g >= 4);
    burst(m.x, m.y, boss ? ['#fff3a0', '#e8c030', '#ffffff'] : ['#fff3a0', '#ece6d6'], boss ? 30 : 10, boss ? 1.4 : 0.9);
    if (boss) { ringAt(m.x, m.y, '#e8c030', 48, 520); flashC('#fff3a066', 160); jolt(320, 2); sfx('evo'); await hitStop(170); }
  },
  kinDown(e) { FXLOG.push('kinDown'); const m = entMid(e); burst(m.x, m.y, ['#ff5f57', '#7a121c', '#ece6d6'], 16, 0.9, 640); ringAt(m.x, m.y, '#ff5f57', 26, 380); jolt(180, 1); },
  nightEnd(result) { FXLOG.push('nightEnd'); const r = cellRect(G.core), cx = r.x + r.w / 2, cy = r.y + r.h / 2; if (result === 'repel') { burst(cx, cy, ['#fff3a0', '#e8c030', '#6fd08c'], 30, 1.2, 700); flashC('#fff3a044', 220); } else { burst(cx, cy, ['#ff5f57', '#3a3444'], 26, 1, 700); flashC('#ff5f5766', 300); jolt(400, 2); } },
};

window.__fx = { FX, FXLOG, jolt, motionOk, hitStop };
