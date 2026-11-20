// 옛 것의 둥지 — 땅속의 한 방울 (화면). 규칙은 prologue.js 의 PRO.makeSim.
//   runPrologue({ asp, seed, tut, speed, look }) → Promise<{ ess, kin: [], gold, size(닿은 몸 1~5), time, fell, skipped, parts, mut, look(처음 받은 몸) }>
// 덮개(#pro) 하나를 스스로 만들고 끝나면 지운다. 도는 동안 window.__pro 를 내놓는다(시험용).
// 조작: 누르거나 끄는 쪽으로 간다 / 오른쪽 아래 단추 = 재주(Space) / 왼쪽 아래 = 돋운다(Q) / 자리를 잡는다.
const PRO_CSS = `#pro { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 15; background: #05040a; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
#pro, #pro * { box-sizing: border-box; }
#pro canvas.pro-cv { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; image-rendering: pixelated; touch-action: none; cursor: crosshair; }
#pro img { image-rendering: pixelated; }
.pro-hud { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 8px); left: max(12px, env(safe-area-inset-left, 0px)); right: max(12px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 5px; pointer-events: none; font-family: var(--display, sans-serif); font-size: 12px; line-height: 1.2; color: #ece6d6; text-shadow: 0 1px 0 #05040a, 0 -1px 0 #05040a, 1px 0 0 #05040a, -1px 0 0 #05040a; }
.pro-row { display: flex; align-items: center; gap: 6px 10px; flex-wrap: nowrap; white-space: nowrap; padding-right: 92px; min-height: 22px; } .pro-row2 { min-height: 16px; padding-right: 0; }
.pro-row b { font-weight: 400; font-size: 14px; color: #fff3a0; }
.pro-pips { display: inline-flex; gap: 3px; align-items: center; } .pro-pips i { display: block; width: 9px; height: 9px; border: 1px solid #05040a; background: #3a3344; } .pro-pips.sz i { border-radius: 50%; width: 7px; height: 7px; } .pro-pips.sz i.on { background: #dff0e0; } .pro-pips.hp i.on { background: #ff5f57; } .pro-pips.lf i { width: 7px; height: 7px; transform: rotate(45deg); margin: 0 2px; } .pro-pips.lf i.on { background: #6fd08c; }
.pro-ess { display: inline-flex; gap: 8px; } .pro-ess span { display: inline-flex; align-items: center; gap: 3px; } .pro-ess i { display: block; width: 7px; height: 7px; border: 1px solid #05040a; }
.pro-bar { height: 5px; width: min(100%, 300px); background: #05040a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-bar i { display: block; height: 100%; background: #e8c030; }
.pro-cap { position: absolute; left: 12px; right: 12px; top: 22%; text-align: center; pointer-events: none; font-family: var(--display, sans-serif); font-size: 16px; line-height: 1.35; color: #fff3a0; text-shadow: 0 2px 0 #05040a, 0 -1px 0 #05040a, 1px 0 0 #05040a, -1px 0 0 #05040a; word-break: keep-all; transition: opacity .3s; }
.pro-cap small { display: block; font-family: var(--body, sans-serif); font-size: 13px; color: #ece6d6; margin-top: 3px; }
.pro-cap.big { font-size: 26px; }
.pro-skip { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 6px); right: max(10px, env(safe-area-inset-right, 0px)); }
.pro-right { position: absolute; right: max(12px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.pro-settle { white-space: nowrap; text-align: right; } .pro-settle small { display: block; font-family: var(--body, sans-serif); font-size: 11px; line-height: 1.25; opacity: .85; }
.pro-act { position: relative; width: 68px; height: 68px; border-radius: 50%; padding: 0; font-family: var(--display, sans-serif); font-size: 12px; line-height: 1.15; color: #0d0a12; background: #e8c030; border: 2px solid #07050a; box-shadow: inset 0 0 0 2px #fff3a0, inset 0 -6px 0 #a87e14; cursor: pointer; overflow: hidden; }
.pro-act i { position: absolute; top: 0; right: 0; bottom: 0; left: 0; border-radius: 50%; background: conic-gradient(rgba(13,10,18,.78) var(--cd, 0deg), transparent 0); pointer-events: none; }
.pro-act span { position: relative; z-index: 1; display: block; padding: 0 4px; word-break: keep-all; }
.pro-act.off { background: #3a3344; color: #a59cb4; box-shadow: inset 0 0 0 2px #4a3c58; }
.pro-act.wait { color: #3a3020; }
.pro-grow { position: absolute; left: max(12px, env(safe-area-inset-left, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 14px); white-space: nowrap; }
.pro-grow.can::after { content: ""; position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; background: #ff5f57; border: 2px solid #05040a; border-radius: 50%; }
.pro-b { font-family: var(--display, sans-serif); font-size: 12px; line-height: 1.3; color: #ece6d6; background: #2a2236; border: 1px solid #07050a; padding: 8px 10px; min-height: 36px; cursor: pointer; box-shadow: inset 0 0 0 1px #4a3c58, inset 0 -4px 0 rgba(0, 0, 0, .3); }
.pro-b.pri { background: #e8c030; color: #0d0a12; padding: 10px 16px; min-height: 44px; font-size: 14px; box-shadow: inset 0 0 0 1px #fff3a0, inset 0 3px 0 #fff3a0, inset 0 -5px 0 #a87e14; }
.pro-b.big { padding: 10px 14px; min-height: 44px; font-size: 14px; }
.pro-b[disabled] { opacity: .5; cursor: default; }
.pro-b:focus-visible, .pro-cell:focus-visible, .pro-keep:focus-visible, .pro-act:focus-visible { outline: 2px solid #ece6d6; outline-offset: 2px; }
@media (min-width: 900px) { .pro-hud { font-size: 15px; } .pro-row b { font-size: 18px; } .pro-pips i { width: 12px; height: 12px; } .pro-ess i { width: 9px; height: 9px; } .pro-bar { height: 7px; width: 420px; } .pro-cap { font-size: 20px; } .pro-cap.big { font-size: 34px; } .pro-cap small { font-size: 15px; } .pro-b { font-size: 14px; } .pro-act { width: 84px; height: 84px; font-size: 14px; } }
.pro-intro { z-index: 4; } .pro-introing .pro-skip { z-index: 5; }
.pro-seed { align-items: center; text-align: center; width: min(100%, 320px); gap: 6px; } .pro-seed img { width: 128px; height: 128px; image-rendering: pixelated; } .pro-seed h2 { font-size: 26px; } .pro-seed > .pro-b.pri { align-self: center; margin-top: 4px; }
.pro-seedline { display: flex; align-items: center; gap: 6px; } .pro-seedline img { flex: none; width: 24px; height: 24px; image-rendering: pixelated; }
.pro-end, .pro-intro, .pro-shop { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: center; justify-content: center; padding: calc(env(safe-area-inset-top, 0px) + 10px) 12px calc(env(safe-area-inset-bottom, 0px) + 10px); background: rgba(5, 4, 10, .8); }
.pro-shop[hidden] { display: none; }
.pro-card { width: min(100%, 440px); max-height: 100%; background: #1d1826; border: 2px solid #e8c030; box-shadow: inset 0 0 0 2px #07050a; padding: 14px; display: flex; flex-direction: column; gap: 8px; color: #ece6d6; font-family: var(--body, sans-serif); font-size: 14px; line-height: 1.45; word-break: keep-all; }
.pro-card h2 { margin: 0; font-family: var(--display, sans-serif); font-weight: 400; font-size: 20px; line-height: 1.2; } .pro-card h2 small { font-family: var(--body, sans-serif); font-size: 13px; color: #a59cb4; margin-left: 6px; }
.pro-card p { margin: 0; } .pro-mute { color: #a59cb4; font-size: 13px; } .pro-warn { color: #ff9a8a; font-size: 13px; }
.pro-bars { display: grid; grid-template-columns: auto 1fr auto; gap: 3px 8px; align-items: center; font-size: 13px; } .pro-bars span.b { display: block; height: 8px; background: #07050a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-bars span.b i { display: block; height: 100%; }
.pro-say { display: flex; gap: 10px; align-items: flex-start; } .pro-say img { flex: none; }
.pro-card > .pro-b.pri { align-self: flex-end; }
.pro-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pro-grid { display: grid; grid-template-columns: 38px repeat(5, minmax(0, 1fr)); gap: 4px; align-items: stretch; }
.pro-gh { display: flex; align-items: center; justify-content: center; gap: 3px; font-family: var(--display, sans-serif); font-size: 12px; min-height: 20px; } .pro-gh i { display: block; width: 8px; height: 8px; border: 1px solid #07050a; }
.pro-gl { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font-family: var(--display, sans-serif); font-size: 12px; color: #a59cb4; text-align: center; } .pro-gl small { font-family: var(--body, sans-serif); font-size: 9px; line-height: 1.15; color: #ff9a8a; word-break: keep-all; }
.pro-cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 50px; padding: 2px; background: #2a2236; border: 1px solid #07050a; box-shadow: inset 0 0 0 1px #4a3c58; cursor: pointer; }
.pro-cell img { width: 36px; height: 36px; opacity: .55; } .pro-cell.own img, .pro-cell.can img { opacity: 1; }
.pro-cell.own { box-shadow: inset 0 0 0 2px var(--c); background: #332a42; } .pro-cell.sel { outline: 2px solid #e8c030; outline-offset: 0; z-index: 1; }
.pro-cell.lock { opacity: .32; } .pro-cell.can:not(.own)::after { content: ""; position: absolute; top: 2px; right: 2px; width: 6px; height: 6px; background: #e8c030; border-radius: 50%; }
.pro-lv { display: inline-flex; gap: 2px; } .pro-lv i { display: block; width: 7px; height: 4px; background: #07050a; box-shadow: inset 0 0 0 1px #4a3c58; } .pro-lv i.on { background: var(--c, #e8c030); box-shadow: none; }
.pro-det { display: flex; flex-direction: column; gap: 3px; min-height: 132px; } .pro-det b { font-family: var(--display, sans-serif); font-weight: 400; font-size: 15px; }
.pro-det .pro-brow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
.pro-parts { display: flex; flex-wrap: wrap; gap: 6px; } .pro-keep { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 3px; font: inherit; font-size: 13px; color: #ece6d6; background: #2a2236; border: 1px solid #07050a; box-shadow: inset 0 0 0 1px #4a3c58; cursor: pointer; } .pro-keep img { width: 28px; height: 28px; }
.pro-keep.on { box-shadow: inset 0 0 0 2px #e8c030; background: #3a3020; }
@media (max-height: 640px) { .pro-cell { min-height: 42px; } .pro-cell img { width: 28px; height: 28px; } .pro-card { padding: 10px; gap: 5px; font-size: 13px; } .pro-det { min-height: 118px; } .pro-card h2 { font-size: 18px; } }
/* 글자 다듬기: 작은 이름표는 본문 글꼴 굵게, 픽셀 글꼴은 큰 글에만. 줄은 낱말 단위로, 숫자는 한 덩이로 */
#pro { word-break: keep-all; overflow-wrap: break-word; }
.pro-b, .pro-act, .pro-gh, .pro-gl, .pro-settle, .pro-keep { font-family: var(--body, sans-serif); font-weight: 600; letter-spacing: -0.01em; }
.pro-b { font-size: 14px; } .pro-act { font-size: 14px; } .pro-gh, .pro-gl { font-size: 13px; }
.pro-mute, .pro-warn, .pro-bars, .pro-keep { font-size: 14px; }
.pro-card p, .pro-det { text-wrap: pretty; } .pro-cap, .pro-card h2 { text-wrap: balance; }
.pro-cap { font-size: 24px; } .pro-cap.big { font-size: 24px; } .pro-cap small { font-size: 15px; }
.pro-card h2 { font-size: 24px; line-height: 1.2; } .pro-card h2 small { font-family: var(--body, sans-serif); font-size: 14px; font-weight: 400; }
.pro-row b { font-family: var(--display, sans-serif); font-size: 16px; } .pro-row, .pro-row b, .pro-row span, .pro-settle, .pro-b { white-space: nowrap; }
.pro-settle small { font-family: var(--body, sans-serif); font-weight: 400; font-size: 13px; white-space: nowrap; }
.pro-det b { font-size: 16px; } .pro-gl small { font-size: 12px; line-height: 1.1; white-space: nowrap; } .pro-card p > b[style] { font-family: var(--body, sans-serif) !important; font-weight: 600 !important; font-size: 14px; }
@media (min-width: 900px) { .pro-hud { font-size: 16px; } }
@media (max-width: 380px), (max-height: 640px) { .pro-mute, .pro-warn, .pro-bars, .pro-keep { font-size: 13px; } .pro-card h2 { font-size: 16px; } .pro-cap, .pro-cap.big { font-size: 16px; } }
`;

function runPrologue(opts) {
  opts = opts || {};
  const sim = PRO.makeSim(opts), S = sim.S, P = sim.P, STG = PRO.STG, SPC = PRO.SP, CAT = PRO.CAT, PART = PRO.PART, SLOTS = PRO.SLOTS, SLOTK = PRO.SLOTK, ASPS = PRO.ASPS, ASPK = PRO.ASPK, TPS = PRO.TPS, KK = PRO.K, home = sim.home;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), clampN = (v, a, b) => Math.max(a, Math.min(b, v)), lv = sim.lv, val = sim.val;
  const say = k => { try { sfx(k); } catch (e) { /* 소리는 없어도 된다 */ } };
  const G = () => STG[S.stage];

  // ---------- 그림 ----------
  const SPR = {}, spr = (key, make) => SPR[key] || (SPR[key] = make());
  const NESTSAY = typeof NEST !== 'undefined' && NEST.SEEDN && NEST.SEEDN[sim.look] ? NEST.SEEDN[sim.look].text : '';
  const SEED = sim.seedOf, TOP = SEED && SEED.top ? SEED.top : [16, 13], TDX = TOP[0] - 16, TDY = TOP[1] - 13;
  const DROP = { origin: 'drop', stage: 0, main: null, sub: null, muts: [], ess: {}, look: sim.look };
  const flip = c => spr('f:' + (c.__id || (c.__id = Object.keys(SPR).length + 1)), () => { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f; });
  const BN = ['#1b1d2a', '#e4dfd0', '#ffffff', '#a8a294'], RED = '#ff5f57';
  const PALS = { mite: ['#1a120c', '#8a6a48', '#c8a880', '#4a3420'], leech: ['#1a0a10', '#7a2a3a', '#c86a78', '#40121c'], pack: ['#14121a', '#b8b0a0', '#f0ead8', '#6a6458'], lurker: ['#1a140c', '#9a7a4a', '#d8b880', '#5a4424'], weaver: ['#1c1008', '#b87a2a', '#f0c070', '#6a4010'], grazer: ['#0e1a14', '#5a7a68', '#a8c8b0', '#2e4a3c'],
    charger: ['#1c0a0c', '#8a3038', '#d87078', '#4a1218'], spitter: ['#121a08', '#8a9a30', '#d8e070', '#4a5a14'], hunter: ['#120a10', '#5a3c58', '#9a7a98', '#34203a'], mimic: ['#1a0c14', '#8a4a6a', '#d890b0', '#4a2038'], mother: ['#1c1418', '#c8a8a8', '#f4dcd8', '#7a5a60'], filter: ['#061418', '#2a6a70', '#7ac8c8', '#123a40'], stalker: ['#05040a', '#2a2438', '#5a5070', '#14101e'], blind: ['#14101a', '#a89aa8', '#e0d4dc', '#5a4e60'] };
  // 사는 것들의 꼴: 저마다 윤곽이 다르다. 오른쪽을 본다
  const DRAW = {
    mite: (K, c, f, p) => { for (let k = 0; k < 3; k++) { K.px(c - 3 + k * 2, c + 3 + ((k + f) % 2), p[0]); K.px(c - 3 + k * 2, c - 3 - ((k + f) % 2), p[0]); } K.B(c, c, 4, 3, p); K.px(c + 4, c - 1, BN[1]); K.px(c + 4, c + 1, BN[1]); K.px(c + 2, c - 1, RED); },
    leech: (K, c, f, p) => { K.L([[c - 4, c + f], [c, c - f], [c + 3, c]], 1.6, 1.2, p); K.px(c + 4, c - 1, BN[1]); K.px(c + 4, c + 1, BN[1]); K.px(c + 4, c, '#2a0508'); },
    pack: (K, c, f, p) => { K.px(c - 2, c + 4 + f, p[0]); K.px(c + 1, c + 4 + (1 - f), p[0]); K.B(c - 1, c, 3.6, 3.2, p); K.flat(K.el(c + 2.5, c + 1, 2.4, 1.6 + f * 0.6), '#2a0508'); K.fangs(c + 1, c + 4, c, 1, 2, 2); K.px(c, c - 1, RED); },
    lurker: (K, c, f, p) => { K.B(c, c + 2, 9, 5, p); K.flat(K.el(c + 1, c, 8, 3 + f), '#2a0508'); K.fangs(c - 6, c + 8, c - 2 - f, 1, 3, 2); K.fangs(c - 5, c + 8, c + 3 + f, -1, 3, 2); K.px(c - 6, c - 3, RED); K.px(c - 3, c - 4, RED); },
    weaver: (K, c, f, p) => { for (let k = 0; k < 3; k++) { const a = -0.9 + k * 0.9; K.L([[c, c], [c + Math.cos(a) * 6, c - 5 - f * (k % 2)], [c + Math.cos(a) * 9, c - 1]], 0.7, 0.5, p); K.L([[c, c], [c + Math.cos(a) * 6, c + 5 + f * (k % 2)], [c + Math.cos(a) * 9, c + 2]], 0.7, 0.5, p); } K.B(c - 2, c, 5, 4.4, p); K.B(c + 3, c, 2.4, 2.2, p); K.px(c + 4, c - 1, RED); K.px(c + 4, c + 1, RED); K.px(c - 3, c - 1, '#fff3a0'); },
    grazer: (K, c, f, p) => { K.px(c - 6 + f, c + 9, p[0]); K.px(c + 2 - f, c + 9, p[0]); K.px(c + 7, c + 9, p[0]); K.B(c + 9, c + 5, 3, 2.6, ['#1a140c', '#9a8a6a', '#d8c8a0', '#5a4e34']); K.B(c, c + 1, 11, 8, p); for (let k = -1; k <= 1; k++) { K.L([[c + k * 6, c - 5], [c + k * 7, c + 6]], 0.6, 0.6, [p[0], p[3], p[3], p[3]], null); } K.px(c + 10, c + 4, '#0c0812'); },
    charger: (K, c, f, p) => { K.L([[c - 10, c + 2], [c - 13, c - 2 + f]], 1.4, 0.6, p); K.px(c - 6 + f, c + 10, p[0]); K.px(c + 3 - f, c + 10, p[0]); K.B(c - 1, c + 1, 10, 7.6, p); K.G([[c + 6, c - 7], [c + 13, c - 1], [c + 13, c + 5], [c + 6, c + 8]], BN); K.L([[c + 9, c - 5], [c + 13, c - 10]], 1.4, 0.5, BN); K.px(c + 4, c - 3, RED); K.px(c + 5, c - 3, '#ffd0c0'); },
    spitter: (K, c, f, p) => { K.px(c - 4 + f, c + 9, p[0]); K.px(c + 2 - f, c + 9, p[0]); K.B(c - 2, c + 2, 7, 6.4, p); K.L([[c + 3, c], [c + 9, c - 3 - f]], 2, 1.6, p); K.flat(K.el(c + 9.5, c - 3.5 - f, 1.6, 1.6), '#2a3408'); K.px(c - 4, c, '#f0f8a0'); K.px(c - 1, c + 3, '#f0f8a0'); K.px(c + 1, c - 2, RED); },
    hunter: (K, c, f, p) => { const N = K.N; K.L([[c - N * 0.22, c + N * 0.1], [c - N * 0.44, c + N * 0.02 + f]], N * 0.1, 0.6, p); for (let k = 0; k < 4; k++) { const bx = c - N * 0.26 + k * N * 0.14; K.L([[bx, c - N * 0.16], [bx - 1.5, c - N * 0.36 - (k % 2)]], 1.3, 0.5, BN); } K.B(c - N * 0.06, c + N * 0.06, N * 0.33, N * 0.27, p); K.L([[c - N * 0.2, c + N * 0.3], [c - N * 0.26 - f, c + N * 0.44]], 1.4, 0.8, p); K.L([[c + N * 0.04, c + N * 0.31], [c + N * 0.08 + f, c + N * 0.44]], 1.4, 0.8, p);
      const jw = N * 0.2, jh = N * 0.13 + f * 1.4, jx = c + N * 0.26, jy = c + N * 0.08; K.flat(K.el(jx, jy, jw, jh + 1.5), p[0]); K.flat(K.el(jx + 1, jy, jw - 1, jh), '#2a0508'); K.fangs(Math.round(jx - jw + 2), Math.round(jx + jw - 1), Math.round(jy - jh + 0.5), 1, 3, 2); K.fangs(Math.round(jx - jw + 3), Math.round(jx + jw - 1), Math.round(jy + jh - 0.5), -1, 3, 2); K.px(c + N * 0.1, c - N * 0.1, RED); K.px(c - N * 0.02, c - N * 0.14, RED); },
    mimic: (K, c, f, p) => { K.L([[c, c + 6], [c - 1, c + 9]], 1.6, 1.2, p); K.B(c, c + 2, 7, 5, p); K.flat(K.el(c, c - 1, 6, 2 + f * 1.5), '#2a0508'); K.fangs(c - 5, c + 5, c - 3 - f, 1, 2, 2); K.fangs(c - 4, c + 5, c + 1 + f, -1, 2, 2); K.B(c, c - 5 - f * 2, 6, 3, p); K.px(c - 2, c - 6 - f * 2, '#fff3a0'); K.px(c + 3, c - 5 - f * 2, '#fff3a0'); },
    mother: (K, c, f, p) => { K.B(c - 2, c + 3, 19, 15 + f * 0.6, p); for (let k = 0; k < 5; k++) { const a = 0.5 + k * 0.55; K.flat(K.el(c - 2 + Math.cos(a) * 13, c + 5 + Math.sin(a) * 9, 2.2, 1.8), '#7a3a4a'); K.px(c - 2 + Math.cos(a) * 13, c + 5 + Math.sin(a) * 9, '#f0e060'); } K.B(c + 14, c - 8, 5, 4.4, PALS.hunter); K.flat(K.el(c + 17, c - 7, 2, 1.4 + f), '#2a0508'); K.px(c + 13, c - 10, RED); K.px(c + 15, c - 10, RED); K.L([[c - 14, c - 6], [c - 19, c - 11 - f]], 1.4, 0.6, p); K.L([[c - 8, c - 9], [c - 10, c - 16 + f]], 1.4, 0.6, p); },
    filter: (K, c, f, p) => { K.L([[c, c + 18], [c - 2, c + 8]], 4, 5, p); K.L([[c - 6, c + 18], [c - 12, c + 16]], 1.6, 0.8, p); K.L([[c + 6, c + 18], [c + 12, c + 16]], 1.6, 0.8, p); K.B(c, c, 15, 11, p); K.flat(K.el(c, c - 1, 11, 7 + f), '#041014'); K.flat(K.el(c, c - 1, 6, 3.6 + f), '#0a2a30'); for (let k = 0; k < 9; k++) { const a = k * 0.698 + f * 0.3; K.L([[c + Math.cos(a) * 11, c - 1 + Math.sin(a) * 7], [c + Math.cos(a) * 15, c - 1 + Math.sin(a) * 11]], 1, 0.5, [p[0], p[2], '#ffffff', p[1]], null); } },
    stalker: (K, c, f, p) => { for (let k = 0; k < 2; k++) { K.L([[c - 4 + k * 8, c], [c - 8 + k * 8, c - 8 - f * (k ? 1 : -1)], [c - 10 + k * 8, c + 11]], 1, 0.6, p); K.L([[c - 2 + k * 8, c + 2], [c + 2 + k * 8, c - 7 + f * (k ? 1 : -1)], [c + 5 + k * 8, c + 11]], 1, 0.6, p); } K.B(c, c, 9, 5, p); K.B(c + 9, c - 2, 4.4, 3.6, p); K.px(c + 10, c - 3, '#ffd23a'); K.px(c + 12, c - 2, '#ffd23a'); K.L([[c - 8, c], [c - 14, c + 3 + f]], 1.4, 0.5, p); },
    blind: (K, c, f, p) => { for (let j = 3; j >= 1; j--) K.B(c - j * 9, c + j * 2, 17 - j * 2, 15 - j * 2, p); K.B(c + 6, c, 22, 20, p); K.flat(K.el(c + 15, c + 1, 11 + f, 12 + f), '#3a0810'); K.flat(K.el(c + 15, c + 1, 6, 7), '#0a0206'); for (let k = 0; k < 12; k++) { const a = k * 0.5236 + f * 0.26; K.L([[c + 15 + Math.cos(a) * 11, c + 1 + Math.sin(a) * 12], [c + 15 + Math.cos(a) * 6.5, c + 1 + Math.sin(a) * 7.5]], 1.4, 0.5, BN, null); } for (let k = 0; k < 4; k++) K.L([[c + 2 - k * 5, c - 18 + k], [c - 1 - k * 5, c - 26 + k * 2 + f]], 0.9, 0.4, p); },
  };
  const SIZE = { mite: 12, leech: 12, pack: 12, lurker: 24, weaver: 24, grazer: 28, charger: 30, spitter: 24, hunter: 26, mimic: 22, mother: 46, filter: 40, stalker: 34, blind: 64 };
  const DSC = { mother: 1.35, filter: 1.3, stalker: 1.15, blind: 1.6 };   // 큰 것은 크게 그린다
  const creSpr = (k, fr) => spr('c:' + k + fr, () => { const N = SIZE[k], K = Sculpt(N); DRAW[k](K, Math.floor(N / 2), fr, PALS[k]); return K.canvas(); });
  const px = (w, h, rows, pal) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) { x.fillStyle = pal[r[i]]; x.fillRect(i, j, 1, 1); } }); return c; };
  const wrigSpr = (asp, fr) => spr('w' + asp + fr, () => { const K = Sculpt(10), Pp = PAL[asp] || PAL.base; K.px(1 + fr, 6, Pp[3]); K.px(2, 5 + fr, Pp[1]); K.B(5.5, 5, 3, 2.3, Pp); K.px(7, 4, '#ffffff'); K.px(8, 4, '#0c0812'); K.px(4, 2 - fr, Pp[2]); return K.canvas(); });
  const moteSpr = (asp, fr) => spr('m' + asp + fr, () => { const c = document.createElement('canvas'); c.width = c.height = 9; const x = c.getContext('2d'), col = ASPCOL[asp]; x.fillStyle = col; x.globalAlpha = 0.28; x.fillRect(2, 2, 5, 5); x.fillRect(1, 3, 7, 3); x.fillRect(3, 1, 3, 7); x.globalAlpha = 1; x.fillRect(3, 3, 3, 3); x.fillRect(4, 2, 1, 5); x.fillRect(2, 4, 5, 1); if (fr) { x.globalAlpha = 0.7; x.fillRect(4, 0, 1, 9); x.fillRect(0, 4, 9, 1); x.globalAlpha = 1; } x.fillStyle = '#ffffff'; x.fillRect(4, 4, 1, 1); return c; });
  const FSPR = {
    bead: fr => spr('bead' + fr, () => px(7, 8, ['...y...', '..yYy..', '.yYYYy.', 'yYwYYdy', 'yYYYddy', '.yYddy.', '..yyy..'], { y: '#8a6a1c', Y: '#e8c030', w: '#fff3a0', d: '#c89a20' })),
    cap: fr => spr('cap' + fr, () => px(11, 10, ['...ggggg...', '..gGGwGGg..', '.gGGGGGwGg.', '.gGwGGGGGg.', '..ggsssgg..', '....sSs....', '....sSs....', '....sSs....', '...ssSss...'], { g: fr ? '#9fe8c0' : '#5fc8a0', G: fr ? '#dffff0' : '#9fe8c0', w: '#ffffff', s: '#a8a294', S: '#e4dfd0' })),
    seed: () => spr('seed', () => px(9, 8, ['..ooooo..', '.obbhbbo.', 'obbhbbbso', 'obhbbbbso', 'obbbbbsso', '.obbbsso.', '..ooooo..'], { o: '#1c1008', b: '#8a5a2a', h: '#d8a860', s: '#4a2a10' })),
    seed2: () => spr('seed2', () => px(12, 11, ['...oooooo...', '..obbhbbbo..', '.obhbbobbso.', 'obbbbobbbsso', 'obhbbobbbsso', 'obbbbobbssso', 'obbbbobbssso', '.obbbobssso.', '..obbbssso..', '...oooooo...'], { o: '#14100c', b: '#6a5a4a', h: '#c8b8a0', s: '#3a2e24' })),
    nut: () => spr('nut', () => px(16, 14, ['....oooooooo....', '..oobbbhhbbboo..', '.obbhhbbbbbbbso.', 'obbhbbbbobbbbsso', 'obhbbbooobbbsso.', 'obbbbobbbbbbssso', 'obbbobbbbbbsssso', 'obbbbbbbobbsssso', 'obbbbbboobssssso', '.obbbbbbbsssso..', '.obbbbbssssso...', '..oobsssssoo....', '....oooooo......'], { o: '#0c0c12', b: '#707890', h: '#c0c8e0', s: '#3a3e54' })),
    bulb: fr => spr('bulb' + fr, () => px(10, 12, ['....gG....', '...gGg....', '....g.....', '..ooooo...', '.oppPppo..', 'oppPpppso.', 'opPpppsso.', 'oppppssso.', '.oppssso..', '..ooooo...'], { g: '#6fbf3f', G: '#d0f08a', o: '#1a0c1c', p: '#9a5ac0', P: fr ? '#f0d0ff' : '#d0a0f0', s: '#4a2a6a' })),
    root: () => spr('root', () => { const K = Sculpt(22), p = ['#1c1008', '#8a6a48', '#c8a880', '#4a3420']; K.L([[2, 6], [8, 11], [15, 10], [20, 15]], 3.2, 2, p); K.L([[8, 11], [6, 18]], 1.6, 0.6, p); K.L([[15, 10], [17, 3]], 1.4, 0.5, p); K.px(11, 9, '#e8d8b0'); K.px(12, 10, '#e8d8b0'); return K.canvas(); }),
    carc: () => spr('carc', () => { const K = Sculpt(26); K.flat(K.el(13, 17, 11, 5), '#3a1016'); K.flat(K.el(11, 16, 7, 3), '#7a121c'); for (let k = 0; k < 5; k++) K.L([[6 + k * 3.4, 16], [5 + k * 3.4, 8 + (k % 2)], [8 + k * 3.4, 6]], 0.8, 0.5, BN); K.B(21, 13, 3.4, 3, BN); K.px(22, 12, '#0c0812'); return K.canvas(); }),
    egg: fr => spr('egg' + fr, () => px(6, 7, ['..oo..', '.oeEo.', 'oeEeeo', 'oeeeso', 'oeesso', '.osso.', '..oo..'], { o: '#2a2410', e: '#f0e8c0', E: '#ffffff', s: '#c8b880' })),
  };
  // 뒤에서 어른거리는 큰 것들: 다음 몸에서 겨룰 종의 그림을 어둡게 눌러, 크게, 느리게, 멀리 깐다. 닿지 않는다
  const shadeOf = (key, src) => spr('bg:' + key, () => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(30,22,44,.80)'; x.fillRect(0, 0, c.width, c.height); return c; });
  const giantKinds = () => { const ks = Object.keys(SPC).filter(k => SPC[k].st === S.stage + 1); return ks.length ? ks : ['__deep']; };
  const BGN = 4, BGPAR = 0.45;
  const shade2Of = (key, src) => spr('bg2:' + key, () => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(86,70,116,.94)'; x.fillRect(0, 0, c.width, c.height); return c; });
  function giantsAt(t, vw0, vh0) {   // 때에 따라 정해지는 자리(판과 상관없이 흐른다). 화면보다 조금 넓은 틀 안을 느리게 돈다
    const ks = giantKinds(), out = [];
    for (let j = 0; j < BGN; j++) { const k = ks[j % ks.length], a = t * 0.0011 * (0.7 + j * 0.13) + j * 2.4, b = t * 0.0008 * (1 + j * 0.09) + j * 1.7; out.push({ k, j, x: Math.sin(a) * vw0 * 0.5 + Math.sin(b * 1.7) * vw0 * 0.14, y: Math.cos(b) * vh0 * 0.4 + Math.cos(a * 1.3) * vh0 * 0.12, face: Math.cos(a) >= 0 ? 1 : -1 }); }
    return out;
  }
  const sweepSpr = fr => spr('s' + fr, () => { const N = 56, K = Sculpt(N), c = N / 2, Pd = ['#050308', '#2a1a30', '#5a3a5e', '#160c1c']; for (let k = 0; k < 10; k++) { const a = k * 0.628 + fr * 0.2; K.L([[c + Math.cos(a) * 19, c + Math.sin(a) * 19], [c + Math.cos(a) * 26, c + Math.sin(a) * 26]], 2, 0.6, BN); } K.B(c, c, 21, 21, Pd); K.flat(K.el(c, c, 13 + fr, 13 + fr), '#3a0810'); K.flat(K.el(c, c, 8, 8), '#0a0206'); for (let k = 0; k < 12; k++) { const a = k * 0.5236 + fr * 0.26; K.L([[c + Math.cos(a) * 13, c + Math.sin(a) * 13], [c + Math.cos(a) * 8, c + Math.sin(a) * 8]], 1.4, 0.5, BN, null); } return K.canvas(); });
  const soilOf = (seed0, base, cols) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 64, 64); let s = seed0; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; for (let k = 0; k < 150; k++) { x.fillStyle = cols[k % 4]; x.fillRect(Math.floor(r() * 64), Math.floor(r() * 64), 1 + Math.floor(r() * 3), 1); } for (let k = 0; k < 9; k++) { x.fillStyle = cols[4]; const a = Math.floor(r() * 60), b = Math.floor(r() * 60); x.fillRect(a, b, 3, 2); x.fillStyle = '#0f0b14'; x.fillRect(a, b + 2, 3, 1); } return c; };
  const soil = soilOf(7, '#231b2b', ['#2c2336', '#1a1422', '#352b40', '#17111e', '#322838']), hard = soilOf(11, '#12101a', ['#1a1622', '#0c0a12', '#201a2a', '#0a0810', '#1c1826']);
  const backdrop = c => spr('bd' + c.seed, () => { const N = Math.round(c.r * 2 + 30), cv1 = document.createElement('canvas'); cv1.width = N; cv1.height = N; const x = cv1.getContext('2d'), m = N / 2; let s = c.seed + 3; const r = () => { s = (s * 16807 + 11) % 2147483647; return s / 2147483647; }, R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const blob = (rx, ry, col) => { x.fillStyle = col; for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry))) + (r() * 3 - 1)); x.fillRect(m - w, m + j, w * 2, 1); } };
    if (c.asp === 'abyss') { blob(c.r, Math.round(c.r * 0.7), '#0c1c2a'); blob(c.r * 0.72, Math.round(c.r * 0.45), '#10304a'); for (let k = 0; k < 6; k++) R(m - c.r * 0.5 + r() * c.r, m - c.r * 0.25 + r() * c.r * 0.5, 4 + r() * 6, 1, '#1f6a8a'); }
    if (c.asp === 'nebula') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#1a1430'); for (let k = 0; k < 7; k++) { const bx = m - c.r * 0.8 + r() * c.r * 1.6, by = m - c.r * 0.5 + r() * c.r, hh = 6 + r() * 10; x.fillStyle = '#3a2a70'; for (let j = 0; j < hh; j++) x.fillRect(Math.round(bx - (hh - j) * 0.22), Math.round(by - j), Math.max(1, Math.round((hh - j) * 0.44)), 1); R(bx - 1, by - hh * 0.8, 1, hh * 0.6, '#6a4ac0'); } }
    if (c.asp === 'brood') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#141e12'); for (let k = 0; k < 6; k++) { let bx = m - c.r * 0.8 + r() * c.r * 1.6, by = m - c.r * 0.6; const n = 8 + r() * 10; for (let j = 0; j < n; j++) { R(bx, by, 1, 3, '#3a4a22'); bx += r() * 4 - 2; by += 3; } R(bx - 1, by, 3, 2, '#4a7a2a'); } }
    if (c.asp === 'dusk') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#1e1410'); x.strokeStyle = '#6a4a2a'; x.lineWidth = 1; for (let k = 0; k < 7; k++) { const a = k * 0.9 + r(); x.beginPath(); x.moveTo(m + 0.5, m + 0.5); x.lineTo(Math.round(m + Math.cos(a) * c.r) + 0.5, Math.round(m + Math.sin(a) * c.r * 0.7) + 0.5); x.stroke(); } }
    if (c.asp === 'hunger') { blob(c.r * 0.9, Math.round(c.r * 0.66), '#200c10'); blob(c.r * 0.5, Math.round(c.r * 0.3), '#3a1016'); for (let k = 0; k < 6; k++) { const bx = m - c.r * 0.7 + r() * c.r * 1.4, by = m - c.r * 0.4 + r() * c.r * 0.8, w = 5 + r() * 7; R(bx, by, w, 1, '#8a8474'); R(bx - 1, by - 1, 2, 3, '#a8a294'); R(bx + w - 1, by - 1, 2, 3, '#a8a294'); } }
    return cv1; });
  // 부위의 그림: 한 방울(32×32) 위에 덧그린다
  const C = { abyss: ['#081a2a', '#1f8fa8', '#9fe8f0', '#0f5a78'], nebula: ['#1a1030', '#8a5fe0', '#e0c8ff', '#4a2a9a'], brood: ['#102410', '#6fbf3f', '#d0f08a', '#2f7a2a'], dusk: ['#2a1420', '#e08a3a', '#ffe0a0', '#9a4a2a'], hunger: ['#2a0a0e', '#c8303a', '#ff9a8a', '#7a121c'] };
  const GOLDc = '#fff3a0', WH = '#ffffff', BONE = '#fbf7ea', BONE2 = '#cfc8b4', YEL = '#f0e060', MASKc = '#f5f5f5';
  const ART = {
    mouth_abyss: (q, l, f, c) => { q(20, 25, 4, 3, c[3]); q(21, 26, 2, 1, c[2]); q(24, 26, 1, 1, c[1]); if (l >= 2) { q(17, 28, 3, 2, c[3]); q(18, 28, 1, 1, c[2]); } if (l >= 3) { q(25, 25, 2, 1, c[1]); q(27, 24 + f, 1, 1, c[2]); q(25, 28, 2, 1, c[1]); q(27, 29 - f, 1, 1, c[2]); } },
    mouth_nebula: (q, l, f, c) => { q(19, 26, 4, 1, GOLDc); q(20, 27, 2, 1, c[2]); if (l >= 2) { q(18, 26, 6, 1, GOLDc); q(19, 25, 1, 1, c[1]); q(22, 25, 1, 1, c[1]); } if (l >= 3) { q(25, 24 + f, 1, 1, WH); q(17, 28 - f, 1, 1, c[2]); q(24, 27, 1, 1, GOLDc); } },
    mouth_brood: (q, l, f, c) => { q(19, 26, 4, 2, c[0]); q(20, 26, 2, 1, YEL); if (l >= 2) { q(24, 24 - f, 1, 1, c[2]); q(25, 27, 1, 1, c[1]); q(18, 25, 1, 1, c[1]); } if (l >= 3) { q(23, 22 + f, 1, 1, YEL); q(26, 25 - f, 1, 1, c[2]); q(27, 28, 1, 1, c[1]); } },
    mouth_dusk: (q, l, f, c) => { q(19, 25, 4, 3, MASKc); q(19, 25, 4, 1, '#c8c8d0'); q(20, 27, 2, 1, c[0]); if (l >= 2) { q(18, 28, 1, 2, c[1]); q(23, 28, 1, 2 + f, c[1]); } if (l >= 3) { q(24, 24 - f, 1, 1, c[2]); q(26, 23, 1, 1, c[1]); q(25, 26 + f, 1, 1, c[2]); } },
    mouth_hunger: (q, l, f, c) => { q(18, 25, 6, 3, '#2a0508'); q(18, 25, 1, 1, BONE); q(20, 25, 1, 1, BONE); q(22, 25, 1, 1, BONE); q(19, 27, 1, 1, BONE); q(21, 27, 1, 1, BONE); q(23, 27, 1, 1, BONE); if (l >= 2) { q(17, 24, 8, 1, c[3]); q(24, 25, 1, 2 + f, BONE); q(17, 28, 7, 1, c[3]); } if (l >= 3) { q(16, 25, 1, 3, c[3]); q(25, 24, 1, 1, BONE2); q(21, 29, 1, 1 + f, c[1]); q(19, 24, 1, 1, BONE2); q(22, 24, 1, 1, BONE2); } },
    eye_abyss: (q, l, f, c) => { q(16, 10, 1, 2, c[1]); q(17, 9, 2, 1, c[1]); q(19, 9, 1, 2, c[1]); q(18, 11, 3, 3, GOLDc); q(19, 12, 1, 1, WH); if (l >= 2) { q(17, 12, 1, 1, c[2]); q(21, 12, 1, 1, c[2]); q(19, 14, 1, 1, c[2]); q(19, 10 - f, 1, 1, c[2]); } if (l >= 3) { q(21, 8, 2, 1, c[1]); q(23, 7 + f, 2, 2, GOLDc); q(23, 7 + f, 1, 1, WH); } },
    eye_nebula: (q, l, f, c) => { q(14, 15, 3, 3, c[0]); q(15, 16, 1, 1, GOLDc); if (l >= 2) { q(13, 14, 1, 1, c[2]); q(17, 14, 1, 1, c[2]); q(13, 18, 1, 1, c[1]); q(17, 18, 1, 1, c[1]); } if (l >= 3) { q(14, 8 + f, 3, 3, c[0]); q(15, 9 + f, 1, 1, GOLDc); q(12, 10, 1, 1, c[2]); q(18, 10, 1, 1, c[2]); } },
    eye_brood: (q, l, f, c) => { q(13, 10, 1, 3, c[1]); q(12, 9 - f, 1, 1, c[2]); q(18, 10, 1, 3, c[1]); q(19, 9 + f - 1, 1, 1, c[2]); if (l >= 2) { q(11, 8 - f, 1, 1, YEL); q(20, 7 + f, 1, 1, YEL); q(12, 8, 1, 1, c[1]); q(19, 8, 1, 1, c[1]); } if (l >= 3) { q(16, 8, 1, 4, c[1]); q(16, 7 - f, 1, 1, YEL); q(15, 6, 1, 1, c[2]); q(17, 6, 1, 1, c[2]); } },
    eye_dusk: (q, l, f, c) => { q(12, 22, 5, 4, MASKc); q(12, 22, 5, 1, '#c8c8d0'); q(14, 23, 1, 2, c[0]); if (l >= 2) { q(11, 23, 1, 2, MASKc); q(13, 25, 1, 1, c[1]); q(16, 25, 1, 1, c[1]); } if (l >= 3) { q(17, 21, 2, 1, c[1]); q(19, 20 - f, 1, 1, c[2]); q(11, 21, 1, 1, c[1]); q(10, 20 + f, 1, 1, c[2]); } },
    eye_hunger: (q, l, f, c) => { q(13, 23, 3, 3, c[0]); q(14, 24, 1, 1, RED); if (l >= 2) { q(17, 21, 3, 3, c[0]); q(18, 22, 1, 1, RED); } if (l >= 3) { q(11, 26, 2, 2, c[0]); q(11, 26, 1, 1, RED); q(16, 20, 1, 1, c[1]); q(15, 19 - f, 1, 1, c[1]); } },
    leg_abyss: (q, l, f, c) => { q(8, 22, 2, 1, c[1]); q(7, 23, 3, 2, c[1]); q(6, 25 - f, 3, 1, c[2]); q(8, 26, 2, 1, c[3]); if (l >= 2) { q(18, 17, 2, 2, c[1]); q(19, 16, 1, 1, c[2]); q(5, 23, 2, 2, c[1]); } if (l >= 3) { q(3, 22 - f, 2, 4, c[1]); q(2, 23, 1, 2, c[2]); q(20, 15, 1, 2, c[2]); q(21, 17, 1, 2, c[1]); } },
    leg_nebula: (q, l, f, c) => { q(10, 30, 2, 1, GOLDc); q(21, 30, 2, 1, GOLDc); q(8, 27 + f, 1, 1, WH); if (l >= 2) { q(24, 27 - f, 1, 1, WH); q(15, 31, 2, 1, c[2]); q(7, 30, 1, 1, c[1]); q(25, 30, 1, 1, c[1]); } if (l >= 3) { q(6, 25 - f, 1, 1, GOLDc); q(26, 25 + f, 1, 1, GOLDc); q(5, 28, 1, 1, c[2]); q(27, 28, 1, 1, c[2]); q(16, 30, 1, 1, WH); } },
    leg_brood: (q, l, f, c) => { q(12, 29, 1, 3, c[1]); q(11, 31, 1, 1, c[3]); q(16, 30, 1, 2, c[1]); q(20, 29, 1, 3, c[1]); q(21, 31, 1, 1, c[3]); if (l >= 2) { q(9, 29, 1, 2, c[1]); q(8, 31, 1, 1, c[3]); q(23, 29, 1, 2, c[1]); q(24, 31, 1, 1, c[3]); } if (l >= 3) { q(7, 28, 2, 1, c[2]); q(24, 28, 2, 1, c[2]); q(14, 31, 1, 1, c[3]); q(18, 31, 1, 1, c[3]); q(6, 27 - f, 1, 1, YEL); } },
    leg_dusk: (q, l, f, c) => { q(9, 27, 1, 1, c[2]); q(7, 28, 2, 1, c[2]); q(5, 29 + f, 2, 1, c[1]); q(3, 30 + f, 2, 1, c[1]); if (l >= 2) { q(9, 24, 1, 1, c[2]); q(6, 25 - f, 3, 1, c[1]); q(4, 26 - f, 2, 1, c[3]); } if (l >= 3) { q(2, 27, 2, 1, c[2]); q(1, 31, 2, 1, c[2]); q(1, 24 + f, 3, 1, c[1]); } },
    leg_hunger: (q, l, f, c) => { q(12, 29, 2, 2, c[1]); q(11 - f, 31, 1, 1, BONE); q(13 - f, 31, 1, 1, BONE); q(19, 29, 2, 2, c[1]); q(19 + f, 31, 1, 1, BONE); q(21 + f, 31, 1, 1, BONE); if (l >= 2) { q(12, 28, 2, 1, c[3]); q(19, 28, 2, 1, c[3]); q(14, 30, 1, 1, c[3]); q(18, 30, 1, 1, c[3]); } if (l >= 3) { q(22, 28, 1, 1, BONE); q(10, 28, 1, 1, BONE); q(9, 30, 1, 1, BONE2); q(23, 30, 1, 1, BONE2); } },
    skin_abyss: (q, l, f, c) => { q(17, 22, 2, 1, c[1]); q(19, 24, 2, 1, c[1]); q(16, 25, 2, 1, c[1]); if (l >= 2) { q(13, 27, 2, 1, c[1]); q(19, 27, 2, 1, c[2]); q(12, 21, 2, 1, c[1]); } if (l >= 3) { q(18, 22, 1, 1, c[2]); q(20, 24, 1, 1, c[2]); q(17, 25, 1, 1, c[2]); q(15, 20, 2, 1, c[1]); q(21, 26, 1, 1, c[1]); } },
    skin_nebula: (q, l, f, c) => { q(20, 18, 1, 3, c[1]); q(21, 19, 1, 2, c[2]); q(18, 19, 1, 2, c[1]); if (l >= 2) { q(22, 21, 2, 1, c[1]); q(23, 20, 1, 1, c[2]); q(11, 20, 1, 2, c[1]); q(10, 21, 1, 1, c[2]); } if (l >= 3) { q(19, 16, 1, 2, c[2]); q(22, 17, 1, 1, WH); q(9, 19, 1, 1, c[2]); q(24, 22, 1, 2, c[1]); q(12, 18, 1, 2, c[1]); } },
    skin_brood: (q, l, f, c) => { q(12, 20, 3, 1, c[1]); q(13, 19, 1, 1, c[2]); q(18, 20, 3, 1, c[1]); q(19, 19, 1, 1, c[2]); if (l >= 2) { q(10, 23, 1, 2, c[1]); q(21, 22, 1, 2, c[1]); q(16, 21, 2, 1, c[3]); q(22, 25, 1, 1, c[2]); } if (l >= 3) { q(20, 18, 1, 1, YEL); q(12, 18, 1, 1, YEL); q(9, 25, 1, 2, c[1]); q(23, 27, 1, 1, c[1]); q(15, 19, 1, 1, c[2]); } },
    skin_dusk: (q, l, f, c) => { q(17, 20, 5, 1, c[2]); q(18, 21, 5, 1, c[1]); q(21, 22, 2, 4, c[1]); q(22, 26, 1, 2, c[3]); if (l >= 2) { q(23, 23, 1, 5 + f, c[1]); q(16, 19, 2, 1, c[2]); q(20, 22, 1, 3, c[3]); } if (l >= 3) { q(22, 28 + f, 1, 1, MASKc); q(24, 28, 1, 1, MASKc); q(24, 22, 1, 3, c[2]); q(14, 19, 2, 1, c[1]); } },
    skin_hunger: (q, l, f, c) => { q(19, 18, 1, 3, BONE); q(21, 20, 1, 3, BONE); q(22, 24, 2, 1, BONE); if (l >= 2) { q(17, 17, 1, 3, BONE); q(12, 18, 1, 3, BONE); q(23, 22, 1, 1, BONE2); } if (l >= 3) { q(10, 21, 1, 2, BONE); q(23, 26, 2, 1, BONE2); q(15, 16, 1, 2, BONE2); q(20, 16, 1, 2, BONE2); q(24, 20, 1, 1, BONE); } },
    core_abyss: (q, l, f, c) => { q(15, 24, 3, 3, c[1]); q(16, 24, 1, 1, c[2]); if (l >= 2) { q(15, 23, 3, 1, c[1]); q(14, 25, 1, 2, c[3]); q(18, 25, 1, 2, c[3]); } if (l >= 3) { q(21, 19 - f, 1, 1, c[2]); q(22, 17 - f, 1, 1, c[2]); q(16, 27, 2, 1, c[2]); } },
    core_nebula: (q, l, f, c) => { q(10, 18, 3, 1, '#e8c030'); q(18, 18, 4, 1, '#e8c030'); q(21, 17, 1, 1, GOLDc); q(10, 17, 1, 1, GOLDc); if (l >= 2) { q(13, 19, 5, 1, '#a87e14'); q(9 - f, 18, 1, 1, GOLDc); q(22 + f, 18, 1, 1, GOLDc); } if (l >= 3) { q(12, 14, 2, 1, '#e8c030'); q(17, 14, 2, 1, '#e8c030'); q(14, 15, 3, 1, '#a87e14'); q(19, 13, 1, 1, GOLDc); } },
    core_brood: (q, l, f, c) => { q(9, 26, 2, 2, YEL); q(9, 26, 1, 1, '#fff8b0'); if (l >= 2) { q(11, 28, 2, 1, YEL); q(7, 25, 2, 1, YEL); q(7, 25, 1, 1, '#fff8b0'); } if (l >= 3) { q(6, 27, 2, 2, YEL); q(6, 27, 1, 1, '#fff8b0'); q(9, 29, 2, 1, '#c8a820'); q(8, 23 - f, 1, 1, YEL); } },
    core_dusk: (q, l, f, c) => { q(16, 24, 4, 3, c[2]); q(16, 24, 4, 1, c[1]); q(17, 25, 2, 1, c[1]); if (l >= 2) { q(22, 25, 1, 1, c[2]); q(24, 25, 1, 1, c[1]); q(16, 27, 4, 1, c[3]); } if (l >= 3) { q(26 + f, 25, 1, 1, c[3]); q(23, 23, 1, 1, c[2]); q(23, 27, 1, 1, c[2]); q(15, 25, 1, 1, c[3]); } },
    core_hunger: (q, l, f, c) => { q(13, 27, 8, 1, '#707890'); q(14, 28, 6, 1, '#3a3e54'); q(15, 27, 2, 1, '#c0c8e0'); if (l >= 2) { q(13, 26, 1, 1, '#c0c8e0'); q(20, 26, 1, 1, '#c0c8e0'); q(12, 27, 1, 1, '#3a3e54'); q(21, 27, 1, 1, '#3a3e54'); } if (l >= 3) { q(12, 25, 1, 1, '#707890'); q(21, 25, 1, 1, '#707890'); q(17, 26, 2, 1, '#c0c8e0'); q(16, 29, 2, 1, '#707890'); } },
  };
  // 부위는 두 겹으로 그린다: 발·겉·속은 몸 뒤에서 조금 크게(몸 둘레로 비어져 나온다), 입·눈은 몸 앞에. 그래야 처음 받은 몸의 꼴(뿔, 똬리, 대)이 가려지지 않는다
  function paintParts(list, fr, only) {
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), q = (a, b, w, h, col) => { const up = b < 19; x.fillStyle = col; x.fillRect(a + (up ? TDX : 0), b + (up ? TDY : 0), w, h); };
    for (const s of (only || ['leg', 'core', 'skin', 'mouth', 'eye'])) { const w = list[s]; if (w && ART[w.id]) ART[w.id](q, w.lv, fr, C[PART[w.id].asp]); }
    const d = x.getImageData(0, 0, 32, 32), a = d.data, src = new Uint8Array(1024); for (let i = 0; i < 1024; i++) src[i] = a[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < 32; y++) for (let xx = 0; xx < 32; xx++) { const i = y * 32 + xx; if (src[i]) continue; if ((xx > 0 && src[i - 1]) || (xx < 31 && src[i + 1]) || (y > 0 && src[i - 32]) || (y < 31 && src[i + 32])) { a[i * 4] = 12; a[i * 4 + 1] = 8; a[i * 4 + 2] = 18; a[i * 4 + 3] = 215; } }
    x.putImageData(d, 0, 0); return c;
  }
  const wornKey = () => SLOTS.map(s => { const w = S.worn[s[0]]; return w ? w.id + w.lv : '-'; }).join('|');
  const overlay = fr => spr('ov:' + wornKey() + ':' + fr, () => paintParts(S.worn, fr, ['mouth', 'eye'])), underlay = fr => spr('un:' + wornKey() + ':' + fr, () => paintParts(S.worn, fr, ['leg', 'core', 'skin']));
  const BACK = 1.22;
  const iconURL = (id, l) => spr('ic:' + id + (l || 2), () => { const c = document.createElement('canvas'); c.width = c.height = 28; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.globalAlpha = 0.5; x.drawImage(slimeCanvas(DROP, 0), -2, -5); x.globalAlpha = 1; const o = {}; o[PART[id].slot] = { id, lv: l || 2 }; x.drawImage(paintParts(o, 0), -2, -5); return c.toDataURL(); });

  // ---------- 덮개 ----------
  let st0 = document.getElementById('pro-css'); if (!st0) { st0 = document.createElement('style'); st0.id = 'pro-css'; document.head.appendChild(st0); } st0.textContent = PRO_CSS;
  const root = document.createElement('div'); root.id = 'pro'; root.setAttribute('role', 'application'); root.setAttribute('aria-label', '땅속의 한 방울. 손가락이나 마우스가 가는 쪽으로 움직인다. 먹고 자라고, 큰 것은 피하고, 먹은 것으로 부위를 돋운다.');
  root.innerHTML = '<canvas class="pro-cv"></canvas><div class="pro-hud"><div class="pro-row" id="pro-row"></div><div class="pro-row pro-row2" id="pro-row2"></div><div class="pro-bar"><i id="pro-prog"></i></div></div><div class="pro-cap" id="pro-cap" aria-live="polite"></div><button class="pro-b pro-skip" id="pro-skip">건너뛴다</button><button class="pro-b big pro-grow" id="pro-grow">돋운다</button><div class="pro-right"><button class="pro-b pro-settle" id="pro-settle" hidden></button><button class="pro-act off" id="pro-act" aria-label="재주"><i></i><span>재주</span></button></div><div class="pro-shop" id="pro-shop" hidden></div>';
  document.body.appendChild(root);
  const cv0 = root.querySelector('canvas'), ctx = cv0.getContext('2d'), $p = id => root.querySelector('#' + id);
  let Zb = 2, zoom = STG[1].zoom, vw = 200, vh = 300, bw = 300, bh = 500, dpr = 1, cam = { x: 0, y: 0 }, hudKey = '', raf = 0, last = 0, acc = 0, alive = true, result = null, onDone = null, sel = null, manual = false, shop = false, shopSeen = false, flash = -99, shake = -99, ended = false, intro = false, introIv = 0;
  const keys = {}, FX = [];
  function fit() { const b = root.getBoundingClientRect(); bw = b.width; bh = b.height; dpr = Math.min(3, window.devicePixelRatio || 1); Zb = clampN(Math.min(b.width, b.height) / 232, 1.6, 4); cv0.width = Math.round(b.width * dpr); cv0.height = Math.round(b.height * dpr); }
  const toWorld = e => { const b = cv0.getBoundingClientRect(), Z = Zb * zoom; return { x: cam.x - b.width / Z / 2 + (e.clientX - b.left) / Z, y: cam.y - b.height / Z / 2 + (e.clientY - b.top) / Z }; };
  const setAim = e => { const w = toWorld(e); sim.aim(w.x, w.y); };
  let held = false;
  const onDown = e => { e.preventDefault(); held = true; try { cv0.setPointerCapture(e.pointerId); } catch (er) { /* 괜찮다 */ } setAim(e); };
  const onMove = e => { if (held || e.pointerType === 'mouse') { e.preventDefault(); setAim(e); } };
  const onUp = () => { held = false; };
  cv0.addEventListener('pointerdown', onDown); cv0.addEventListener('pointermove', onMove); cv0.addEventListener('pointerup', onUp); cv0.addEventListener('pointercancel', onUp);
  const noScroll = e => e.preventDefault(); root.addEventListener('touchmove', noScroll, { passive: false }); root.addEventListener('contextmenu', noScroll);
  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', 'ㅁ': 'left', ArrowRight: 'right', d: 'right', D: 'right', 'ㅇ': 'right', ArrowUp: 'up', w: 'up', W: 'up', 'ㅈ': 'up', ArrowDown: 'down', s: 'down', S: 'down', 'ㄴ': 'down' };
  const doAct = () => { if (S.ended || shop) return; if (sim.act()) { if (!S.seen.acted) S.seen.acted = 1; } else say('click'); };
  const onKey = e => { if (!alive) return; const k = KEYMAP[e.key]; e.stopPropagation(); if (e.type === 'keydown' && intro) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) closeIntro(); } return; }
    if (e.type === 'keydown' && !S.ended) { if (e.key === 'q' || e.key === 'Q' || e.key === 'ㅂ' || (e.key === 'Escape' && shop)) { e.preventDefault(); return shop ? closeShop() : openShop(); } if (e.key === ' ' && !e.repeat) { e.preventDefault(); return shop ? closeShop() : doAct(); } } if (k && !shop) { keys[k] = e.type === 'keydown'; e.preventDefault(); } else if (e.key === 'Tab' || e.key === ' ') e.preventDefault(); };   // 게임 쪽 단축키가 먹지 않게 막는다
  window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKey, true); window.addEventListener('resize', fit);
  $p('pro-skip').addEventListener('click', () => finish('skip')); $p('pro-grow').addEventListener('click', () => { say('click'); openShop(); }); $p('pro-act').addEventListener('click', doAct);
  let sure = 0; $p('pro-settle').addEventListener('click', () => { const now = performance.now(); if (now - sure < 2600) return sim.end('settle'); sure = now; hudKey = ''; say('click'); setTimeout(() => { hudKey = ''; }, 2650); });

  // ---------- 돋우는 창: 가로는 징조(색), 세로는 자리. 떠 있는 동안 흙 속은 멈춘다 ----------
  const pipsHtml = (n, col) => `<span class="pro-lv" style="--c:${col}">${[1, 2, 3].map(k => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const wal = a => Math.floor(S.purse[a]);
  function shopHtml(tip) {
    if (!sel || !PART[sel]) { const open = CAT.filter(d => !sim.whyNot(d.id) && !(S.worn[d.slot] && S.worn[d.slot].id !== d.id)); sel = (open[0] || CAT.find(d => d.asp === home)).id; }
    const d = PART[sel], w = S.worn[d.slot], mine = w && w.id === sel ? w.lv : 0, price = sim.priceOf(sel), why = sim.whyNot(sel), col = ASPCOL[d.asp];
    let h = `<div class="pro-card" role="dialog" aria-label="부위를 돋운다"><div class="pro-top"><h2>돋운다<small${SEED ? ` title="${SEED.say}"` : ''}>${SEED ? SEED.name + '의 몸을 바꾼다' : '먹은 것으로 몸을 바꾼다'}</small></h2><button class="pro-b" data-x="close">닫는다</button></div>${tip ? `<p class="pro-mute">${tip}</p>` : ''}<div class="pro-grid"><span></span>${ASPS.map(a => `<span class="pro-gh" title="${ASPK[a]}"><i style="background:${ASPCOL[a]}"></i>${wal(a)}</span>`).join('')}`;
    for (const s of SLOTS) { const locked = S.stage < KK.open[s[0]]; h += `<span class="pro-gl">${s[1]}${locked ? `<small>${STG[KK.open[s[0]]].name}</small>` : ''}</span>`; for (const a of ASPS) { const id = s[0] + '_' + a, ww = S.worn[s[0]], own = ww && ww.id === id ? ww.lv : 0; h += `<button class="pro-cell${own ? ' own' : ''}${locked ? ' lock' : ''}${!sim.whyNot(id) ? ' can' : ''}${id === sel ? ' sel' : ''}" style="--c:${ASPCOL[a]}" data-id="${id}" aria-label="${s[1]} · ${PART[id].name}${own ? ' ' + own + '단계' : ''}${locked ? ' (잠김)' : ''}"><img src="${iconURL(id)}" alt="">${pipsHtml(own, ASPCOL[a])}</button>`; } }
    const now = mine ? d.say(d.v[mine - 1], mine - 1) : null, next = mine < 3 ? d.say(d.v[mine], mine) : null, swap = w && w.id !== sel;
    const power = d.slot === 'mouth' ? `<p class="pro-mute">입의 힘 ${Math.min(4, (mine || 0) + (d.id === 'mouth_hunger' && mine ? 1 : 0))}${mine < 3 ? ' → ' + (mine + 1 + (d.id === 'mouth_hunger' ? 1 : 0)) : ''}: 힘만큼 큰 먹잇감을 삼키고 굳은 것을 깬다</p>` : `<p class="pro-mute">${PRO.SLOTSAY[d.slot]}</p>`;
    h += `</div><div class="pro-det"><p><b style="color:${col}">${d.name}</b> <span class="pro-mute">${SLOTK[d.slot]} · ${ASPK[d.asp]}</span> ${pipsHtml(mine, col)}</p>${now ? `<p>지금: ${now}</p>` : ''}${next ? `<p${now ? ' class="pro-mute"' : ''}>${now ? '다음' : '돋우면'}: ${next}</p>` : ''}${power}${swap ? `<p class="pro-warn">${SLOTK[d.slot]} 자리의 ${PART[w.id].name}${w.lv > 1 ? ' ' + w.lv + '단계' : ''}이 사라진다</p>` : ''}
      <div class="pro-brow"><span class="${why && price != null ? 'pro-warn' : 'pro-mute'}">${why || '둥지에서: ' + NEST.MUT[d.mut].name}</span><button class="pro-b pri" data-x="buy"${why ? ' disabled' : ''}>${price == null ? '다 올렸다' : (mine ? '올린다' : swap ? '갈아 끼운다' : '돋운다') + ' <span style="display:inline-block;width:8px;height:8px;background:' + col + ';border:1px solid #07050a"></span> ' + price}</button></div></div></div>`;
    return h;
  }
  function openShop(tip) { if (S.ended || shop) return; shop = true; shopSeen = true; held = false; sim.stop(); for (const k in keys) keys[k] = false; const el = $p('pro-shop'); el.innerHTML = shopHtml(tip === true ? '먹은 것으로 부위를 돋울 수 있어. 입이 커야 큰 것을 삼켜. 쓰지 않고 남긴 것은 둥지의 첫 정수가 돼.' : tip); el.hidden = false; }
  function closeShop() { if (!shop) return; shop = false; $p('pro-shop').hidden = true; $p('pro-shop').innerHTML = ''; last = 0; acc = 0; hudKey = ''; }
  const redrawShop = () => { if (shop) $p('pro-shop').innerHTML = shopHtml(); };
  $p('pro-shop').addEventListener('click', e => { const c = e.target.closest('[data-id]'), b = e.target.closest('[data-x]'); if (c) { sel = c.dataset.id; say('click'); redrawShop(); } else if (b && b.dataset.x === 'close') { say('click'); closeShop(); } else if (b && b.dataset.x === 'buy') { if (sim.buy(sel)) redrawShop(); } else if (e.target === $p('pro-shop')) closeShop(); });

  // ---------- 위쪽 띠와 단추 ----------
  function hud() {
    const g = G(), time = Math.floor(S.t / TPS), base = S.stage > 1 ? STG[S.stage - 1].need : 0, mh = sim.maxHp(), can = sim.canAny(), an = sim.actName(), sureOn = performance.now() - sure < 2600;
    const key = [S.stage, S.hp, mh, S.lives, ASPS.map(wal).join(','), S.gold, time, can, an, sureOn, S.ended].join('|');
    if (key !== hudKey) { hudKey = key;
      $p('pro-row').innerHTML = `<b>${g.name}</b><span class="pro-pips sz" title="몸">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= S.stage ? 'on' : ''}"></i>`).join('')}</span><span class="pro-pips hp" title="버틸 수 있는 횟수">${Array.from({ length: mh }, (_, k) => `<i class="${k < S.hp ? 'on' : ''}"></i>`).join('')}</span><span class="pro-pips lf" title="다시 일어날 기회">${Array.from({ length: KK.lives }, (_, k) => `<i class="${k < S.lives ? 'on' : ''}"></i>`).join('')}</span>`;
      $p('pro-row2').innerHTML = `<span>${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}</span><span style="color:#e8c030">진액 ${S.gold}</span><span class="pro-ess">${ASPS.filter(a => wal(a) > 0).map(a => `<span><i style="background:${ASPCOL[a]}"></i>${wal(a)}</span>`).join('') || '<span style="color:#a59cb4">아직 모은 것이 없다</span>'}</span>`;
      $p('pro-grow').classList.toggle('can', can);
      const sb = $p('pro-settle'), okS = S.stage >= KK.settleFrom && !S.ended; sb.hidden = !okS; if (okS) { const nx = S.stage < 5 ? `더 자라면 ${KK.essCap[S.stage + 1]}까지${S.stage + 1 === KK.keepFrom ? ' · 부위 새김' : ''}` : '다 자라면 가장 많다'; sb.innerHTML = sureOn ? '한 번 더: 자리를 잡는다' : `자리를 잡는다<small>지금 정수 ${sim.essSum(S.stage)}${S.stage >= KK.keepFrom ? ' · 부위 새김' : ''}<br>${nx}</small>`; sb.classList.toggle('pri', sureOn); }
      const ab = $p('pro-act'); ab.classList.toggle('off', !an); ab.querySelector('span').textContent = an || '재주'; ab.setAttribute('aria-label', an ? '재주: ' + an : '재주 (발을 돋우면 생긴다)'); }
    const need = g.need; $p('pro-prog').style.width = clampN((S.bio - base) / (need - base), 0, 1) * 100 + '%';
    { const ab = $p('pro-act'), tot = sim.actTotal(); if (tot) { const f = clampN(P.cd / tot, 0, 1); ab.style.setProperty('--cd', Math.round(f * 360) + 'deg'); ab.classList.toggle('wait', f > 0); } else ab.style.setProperty('--cd', '0deg'); }
    const c = S.cap, capEl = $p('pro-cap'); if (c && S.t < c.until && !shop && !intro) { const html = c.s + (c.sub ? '<small>' + c.sub + '</small>' : ''); if (capEl.dataset.h !== html) { capEl.dataset.h = html; capEl.innerHTML = html; capEl.classList.toggle('big', S.t - S.upAt < 5 * TPS && c.s === g.name); } capEl.style.opacity = 1; } else capEl.style.opacity = 0;
    $p('pro-grow').hidden = !!S.ended; $p('pro-act').hidden = !!S.ended;
    if (!shopSeen && !manual && !intro && !S.ended && can && S.t > 2 * TPS && P.inv <= 0) openShop(true);   // 처음 살 수 있게 됐을 때 한 번은 스스로 뜬다
  }

  // ---------- 일어난 일을 소리와 반짝임으로 ----------
  const SND = { gold: 'coin', gulp: 'dig', hurt: 'hit', respawn: 'down', stage: 'evo', buy: 'coin', erupt: 'trap', snap: 'trap', aim: 'step', charge: 'hit', spit: 'click', splat: 'step', alert: 'step', sweepwarn: 'trap', sweep: 'down', pulse: 'up', heal: 'coin', dash: 'step', blink: 'step', burrow: 'dig', snare: 'click', pounce: 'step', snared: 'trap', leech: 'hit', inhale: 'down', tell: 'step', birth: 'click', veil: 'click', gone: 'die', chew: 'dig', fight: 'hit', grew: 'up' };
  let eatN = 0;
  function drain() {
    for (const e of sim.ev) { if (e.k === 'alert') say({ pack: 'hit', blind: 'down', hunter: 'trap', mite: 'click' }[e.kind] || 'step'); else if (SND[e.k]) say(SND[e.k]); else if (e.k === 'eat' && (eatN++ % 2 === 0)) say('step');
      if (e.k === 'stage') { flash = S.t; hudKey = ''; if (S.stage === 2 && !S.seen.legtip) S.seen.legtip = 1; }
      if (e.k === 'hurt' || e.k === 'respawn') shake = S.t; if (e.k === 'respawn') flash = S.t;
      if (e.k === 'buy') { hudKey = ''; if (PART[e.id].slot === 'leg' && !S.seen.acttip) { S.seen.acttip = 1; sim.caption('재주가 생겼다: ' + PART[e.id].act, '오른쪽 아래 단추를 눌러. 쫓길 때 써', 4); } }
      if (e.k === 'prey' && Math.hypot(e.x - P.x, e.y - P.y) < sim.lightR() * 1.6) { say('die'); if (!S.seen.chain) { S.seen.chain = 1; sim.caption((typeof NEST !== 'undefined' && NEST.fj ? NEST.fj : x => x)(SPC[e.by].name + '이(가) ' + SPC[e.kind].name + '을(를) 잡았다'), '저희끼리도 먹고 먹힌다. 먹는 동안은 한눈을 판다', 3.6); } }
      if (e.x != null) FX.push(e); }
    sim.ev.length = 0; while (FX.length > 90) FX.shift();
  }

  // ---------- 그린다 ----------
  function draw(now) {
    const g = G(), t = S.t, fr2 = Math.floor(now / 260) % 2, fr4 = Math.floor(now / 240) % 4, R = sim.lightR(), third = lv('eye_nebula'), feel = lv('eye_brood'), blood = lv('eye_hunger');
    zoom += (g.zoom - zoom) * 0.035; const Z = Zb * zoom, k = Z * dpr; vw = bw / Z; vh = bh / Z;
    cam.x += (P.x - cam.x) * 0.16; cam.y += (P.y - cam.y) * 0.16;
    const sh = t - shake < 8 ? (Math.floor(now / 30) % 2 ? 2 : -2) / zoom : 0, ox = cam.x - vw / 2 + sh, oy = cam.y - vh / 2;
    ctx.setTransform(k, 0, 0, k, -ox * k, -oy * k); ctx.imageSmoothingEnabled = false;
    const inView = (o, m) => o.x > ox - m && o.x < ox + vw + m && o.y > oy - m && o.y < oy + vh + m, img = (c, x, y, s) => ctx.drawImage(c, Math.round(x), Math.round(y), c.width * (s || 1), c.height * (s || 1));
    // 굳은 흙(아직 못 가는 곳)을 깔고, 갈 수 있는 둥근 굴을 그 위에
    { const sx = Math.floor(ox / 64) * 64, sy = Math.floor(oy / 64) * 64; for (let y = sy; y < oy + vh; y += 64) for (let x = sx; x < ox + vw; x += 64) ctx.drawImage(hard, x, y);
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, g.R, 0, 7); ctx.clip(); for (let y = sy; y < oy + vh; y += 64) for (let x = sx; x < ox + vw; x += 64) ctx.drawImage(soil, x, y); ctx.restore();
      ctx.strokeStyle = '#0a0810'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, g.R + 2, 0, 7); ctx.stroke(); ctx.strokeStyle = '#4a3c58'; ctx.lineWidth = 1.5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(0, 0, g.R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      for (let j = 1; j < S.stage; j++) { ctx.strokeStyle = 'rgba(74,60,88,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, STG[j].R, 0, 7); ctx.stroke(); } }
    // 뒤의 큰 것들
    let under = 0; const gdraw = [];
    { const gs = giantsAt(t, vw, vh), bx0 = P.x - (P.x - cam.x) + (0 - cam.x) * 0, cx0 = cam.x, cy0 = cam.y; ctx.imageSmoothingEnabled = true;
      for (const q of gs) { const deep = q.k === '__deep', src = deep ? sweepSpr(fr2) : creSpr(q.k, Math.floor((t + q.j * 9) / 14) % 2), sh0 = shadeOf((deep ? 'deep' : q.k) + ':' + (deep ? fr2 : Math.floor((t + q.j * 9) / 14) % 2), src), sc = deep ? 7 * g.sc * 0.5 : (3 + (g.sc - 1) * 0.9) * (DSC[q.k] || 1) * 0.9, w = src.width * sc, h = src.height * sc;
        const gx = cx0 * (1 - BGPAR) + q.x, gy = cy0 * (1 - BGPAR) + q.y; if (gx < ox - w || gx > ox + vw + w || gy < oy - h || gy > oy + vh + h) continue;
        ctx.globalAlpha = deep ? 0.5 : 0.62; ctx.drawImage(q.face < 0 ? flip(sh0) : sh0, gx - w / 2, gy - h / 2, w, h); gdraw.push({ key: (deep ? 'deep' : q.k) + ':' + (deep ? fr2 : Math.floor((t + q.j * 9) / 14) % 2), src, face: q.face, x: gx - w / 2, y: gy - h / 2, w, h });
        const dp = Math.hypot(gx - P.x, gy - P.y); if (dp < R * 0.9) { under = Math.max(under, 1 - dp / (R * 0.9)); if (!S.seen.giant && t > 4 * TPS) { S.seen.giant = 1; sim.caption('큰 것이 밑을 지나간다', '아직 닿지 않는다. 자라면 저것들과 겨룬다', 3.4); } if (t % 9 === q.j) FX.push({ k: 'dust', t, x: gx + (Math.sin(t + q.j) * w * 0.3), y: gy + h * 0.2 }); } }
      ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false; }
    for (const c of S.clusters) if (c.ring <= S.stage && inView(c, c.r + 20)) { const b = backdrop(c); img(b, c.x - b.width / 2, c.y - b.height / 2); }
    // 틈: 몸이 들어가면 큰 것들이 못 따라온다
    for (const q of S.crev) if (q.ring <= S.stage && inView(q, q.r + 4)) { const fits = sim.fits(q); ctx.fillStyle = '#05040a'; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * 0.62, 0.4, 0, 7); ctx.fill(); ctx.strokeStyle = fits ? (fr2 ? '#8a7a98' : '#6a5a78') : '#3a2e44'; ctx.lineWidth = 1.5; ctx.setLineDash(fits ? [] : [3, 3]); ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * 0.62, 0.4, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#17111e'; ctx.fillRect(Math.round(q.x - q.r * 0.5), Math.round(q.y - 1), Math.round(q.r), 2); }
    // 실, 녹은 자리, 덫
    ctx.lineWidth = 1; for (const w of S.webs) if (inView(w, w.r)) { ctx.strokeStyle = 'rgba(240,220,180,.42)'; for (let j = 0; j < 3; j++) { const a = j * 1.05 + w.x; ctx.beginPath(); ctx.moveTo(w.x - Math.cos(a) * w.r, w.y - Math.sin(a) * w.r); ctx.lineTo(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r); ctx.stroke(); } ctx.strokeStyle = 'rgba(240,220,180,.25)'; ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 0.6, 0, 7); ctx.stroke(); }
    for (const q of S.puddles) { const a = Math.min(1, (q.until - t) / 20); ctx.fillStyle = 'rgba(184,208,48,' + 0.55 * a + ')'; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * 0.66, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(240,248,160,' + 0.8 * a + ')'; ctx.fillRect(Math.round(q.x - 4 + fr2 * 3), Math.round(q.y - 2), 2, 2); ctx.fillRect(Math.round(q.x + 5 - fr2 * 2), Math.round(q.y + 3), 2, 2); }
    for (const n of S.snares) { ctx.strokeStyle = 'rgba(255,224,160,' + Math.min(0.85, (n.until - t) / 40) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(n.x - 9, n.y); ctx.lineTo(n.x + 9, n.y); ctx.moveTo(n.x, n.y - 7); ctx.lineTo(n.x, n.y + 7); ctx.moveTo(n.x - 6, n.y - 5); ctx.lineTo(n.x + 6, n.y + 5); ctx.moveTo(n.x - 6, n.y + 5); ctx.lineTo(n.x + 6, n.y - 5); ctx.stroke(); }
    // 먹이
    const m0 = sim.mouthLv();
    for (const f of S.food) { if (!f.alive || f.ring > S.stage || !inView(f, 16)) continue;
      if (f.k === 'mote') { img(moteSpr(f.asp, (fr4 + f.ph) % 4 === 0 ? 1 : 0), f.x - 4, f.y - 4); continue; }
      const c = FSPR[f.k]((fr4 + f.ph) % 4 === 0 ? 1 : 0); img(c, f.x - c.width / 2, f.y - c.height / 2);
      const D = PRO.FOOD[f.k]; if (D.need && m0 < D.need && dist(f, P) < R) { ctx.fillStyle = '#ff9a8a'; ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y - c.height / 2 - 5), 5, 1); ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y - c.height / 2 - 3), 5, 1); } }
    for (const w of S.wrig) if (w.alive && w.ring <= S.stage && inView(w, 8)) { const c = wrigSpr(w.asp, fr2); img(w.vx < 0 ? flip(c) : c, w.x - 5, w.y - 5); }
    // 사는 것들
    for (const c of S.cre) { if (!c.alive || c.ring > S.stage || !inView(c, 40)) continue; const d = dist(c, P), host = sim.hostile(c), eat = sim.canEat(c);
      if (c.mode === 'buried') { const born = sim.form.buried || (lv('eye_abyss') && d < R * 0.9), seeIt = third || born || !host || d < 44; if (seeIt) { ctx.globalAlpha = third || born || !host ? 0.95 : 0.55; ctx.fillStyle = '#3a2e24'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 10, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9a7a4a'; ctx.fillRect(Math.round(c.x) - 6, Math.round(c.y) - 1, 3, 2); ctx.fillRect(Math.round(c.x) + 3, Math.round(c.y) - 1, 3, 2); if (third) { ctx.fillStyle = RED; ctx.fillRect(Math.round(c.x) - 5, Math.round(c.y) - 1, 1, 1); ctx.fillRect(Math.round(c.x) + 4, Math.round(c.y) - 1, 1, 1); } ctx.globalAlpha = 1; } continue; }
      if (c.mode === 'bait') { const fake = FSPR[c.look]((fr4 + c.id) % 4 === 0 ? 1 : 0); img(fake, c.x - fake.width / 2, c.y - fake.height / 2); if (third || !host || (lv('eye_abyss') >= 2 && d < R * 0.9) || (t + c.id * 7) % 100 < 5) { ctx.fillStyle = '#fbf7ea'; ctx.fillRect(Math.round(c.x) - 3, Math.round(c.y) + 1, 1, 2); ctx.fillRect(Math.round(c.x) - 1, Math.round(c.y) + 1, 1, 2); ctx.fillRect(Math.round(c.x) + 1, Math.round(c.y) + 1, 1, 2); } if (third && host) { ctx.strokeStyle = 'rgba(255,95,87,' + (fr2 ? 0.8 : 0.4) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, 7); ctx.stroke(); } continue; }
      const sp0 = creSpr(c.k, c.stun > 0 ? 0 : fr2), ds0 = (DSC[c.k] || 1) * (c.r / SPC[c.k].r), N = sp0.width * ds0, rise = c.mode === 'rise' ? 3 : 0; if (c.stun > 0) ctx.globalAlpha = 0.75; img(c.face < 0 ? flip(sp0) : sp0, c.x - N / 2, c.y - N / 2 - rise, ds0); ctx.globalAlpha = 1;
      if (c.stun > 0) { ctx.fillStyle = '#e0c8ff'; ctx.fillRect(Math.round(c.x - 4 + fr2 * 6), Math.round(c.y - N / 2 - 4), 2, 2); ctx.fillRect(Math.round(c.x + 2 - fr2 * 6), Math.round(c.y - N / 2 - 2), 2, 2); }
      if (!host && !SPC[c.k].calm) { ctx.fillStyle = eat ? 'rgba(111,208,140,' + (fr2 ? 0.95 : 0.55) + ')' : 'rgba(165,156,180,.7)'; ctx.fillRect(Math.round(c.x) - 1, Math.round(c.y - N / 2 - 5), 3, 3); }
      else if (host && eat && (blood || c.mode === 'rest' || c.stun > 0)) { ctx.strokeStyle = 'rgba(111,208,140,' + (fr2 ? 0.9 : 0.5) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 4, 0, 7); ctx.stroke(); }
      if (c.on && d < R * 1.15) { const ix = Math.round(c.x), iy = Math.round(c.y - N / 2 - 9);
        if (c.on === 'you' && host) { ctx.fillStyle = '#05040a'; ctx.fillRect(ix - 2, iy - 5, 4, 9); ctx.fillStyle = RED; ctx.fillRect(ix - 1, iy - 4, 2, 4); ctx.fillRect(ix - 1, iy + 1, 2, 2); }
        else if (c.on === 'other' && c.tg) { const ax = c.tg.x - c.x, ay = c.tg.y - c.y, al = Math.hypot(ax, ay) || 1; ctx.fillStyle = '#e8c030'; for (let j = 1; j <= 3; j++) ctx.fillRect(Math.round(c.x + ax / al * (c.r + j * 4)) - 1, Math.round(c.y + ay / al * (c.r + j * 4)) - 1, 2, 2); }
        else if (c.on === 'eat' || c.on === 'scav' || c.on === 'graze') { ctx.fillStyle = c.on === 'graze' ? '#9fe8c0' : '#fbf7ea'; ctx.fillRect(ix - 4 + fr2 * 5, iy + 2, 2, 2); ctx.fillRect(ix + 2 - fr2 * 4, iy - 1, 2, 2); ctx.fillStyle = '#c8303a'; if (c.on !== 'graze') ctx.fillRect(ix - 1, iy + 4 - fr2 * 2, 2, 2); }
        else if (c.on === 'flee') { ctx.fillStyle = '#9fe8f0'; ctx.fillRect(ix - 4, iy + fr2 * 2, 1, 3); ctx.fillRect(ix + 3, iy + 2 - fr2 * 2, 1, 3); }
        else if (c.on === 'fight') { ctx.fillStyle = '#ffffff'; ctx.fillRect(ix - 5 + fr2 * 8, iy, 3, 1); ctx.fillRect(ix - 4 + fr2 * 8, iy - 1, 1, 3); ctx.fillStyle = '#fff3a0'; ctx.fillRect(ix + 3 - fr2 * 7, iy + 3, 3, 1); } }
      if (c.gr >= 2 && d < R) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(Math.round(c.x) - 3, Math.round(c.y - N / 2 - 3), 2, 2); ctx.fillRect(Math.round(c.x) + 2, Math.round(c.y - N / 2 - 3), 2, 2); }
      if (c.k === 'filter' && (c.mode === 'tell' || c.mode === 'inhale')) { const Rr = SPC.filter.see, ph = (now / 500) % 1; ctx.strokeStyle = c.mode === 'tell' ? 'rgba(255,95,87,.5)' : 'rgba(122,200,200,.45)'; ctx.lineWidth = 1; for (let j = 0; j < 3; j++) { const rr0 = Rr * (c.mode === 'tell' ? 0.25 + j * 0.1 : 1 - ((ph + j / 3) % 1)); ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(4, rr0), 0, 7); ctx.stroke(); } } }
    // 겨누는 줄(들이받이, 그림자발)과 날아오는 침
    for (const c of S.cre) if (c.alive && c.ring <= S.stage && (c.mode === 'aim' || c.mode === 'tell') && (c.k === 'charger' || c.k === 'stalker') && (third >= 3 || dist(c, P) < R * 1.5)) { const dx = c.tx - c.x, dy = c.ty - c.y, L = Math.hypot(dx, dy) || 1, len = c.k === 'charger' ? 250 : 205; ctx.strokeStyle = Math.floor(now / 110) % 2 ? 'rgba(255,95,87,.8)' : 'rgba(255,95,87,.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + dx / L * len, c.y + dy / L * len); ctx.stroke(); ctx.setLineDash([]); }
    for (const s of S.shots) { const a = clampN((t - s.t0) / s.dur, 0, 1), x = s.x0 + (s.tx - s.x0) * a, y = s.y0 + (s.ty - s.y0) * a - Math.sin(a * Math.PI) * 26; ctx.strokeStyle = 'rgba(255,95,87,' + (0.35 + a * 0.5) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s.tx, s.ty, 17 * (0.4 + a * 0.6), 11 * (0.4 + a * 0.6), 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#d8e070'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.fillStyle = '#f8ffb0'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 2, 2, 1); }
    // 한 방울: 몸이 클수록 크게 그린다
    { const sc = g.sc, c = slimeCanvas(DROP, fr4), s = c.width * sc, ov = overlay(fr2), pxx = Math.round(P.x - s / 2), pyy = Math.round(P.y - s + g.r * 0.9 + Math.sin(now / 300) * 1);
      if (P.burrow > 0) { ctx.fillStyle = '#3a2e44'; ctx.beginPath(); ctx.ellipse(P.x, P.y, g.r * 1.3, g.r * 0.7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#5a4a68'; ctx.fillRect(Math.round(P.x - g.r * 0.6), Math.round(P.y - 2), Math.round(g.r * 1.2), 2); ctx.globalAlpha = 0.25; ctx.drawImage(c, pxx, pyy + s * 0.35, s, s * 0.65); ctx.globalAlpha = 1; }
      else if (!(P.inv > 0 && Math.floor(now / 80) % 2)) { const un = underlay(fr2), bs = s * BACK; ctx.drawImage(P.face < 0 ? flip(un) : un, Math.round(pxx - (bs - s) / 2), Math.round(pyy - (bs - s) * 0.78), bs, bs); ctx.drawImage(P.face < 0 ? flip(c) : c, pxx, pyy, s, s); ctx.drawImage(P.face < 0 ? flip(ov) : ov, pxx, pyy, s, s); }
      if (P.leech) { const lc = creSpr('leech', fr2); img(lc, P.x - P.face * g.r * 0.6 - 6, P.y - g.r - 8); }
      if (P.chew) { const f = P.chew.t / P.chew.need; ctx.fillStyle = '#05040a'; ctx.fillRect(Math.round(P.x - 12), Math.round(P.y - s * 0.8 - 6), 24, 4); ctx.fillStyle = '#e8c030'; ctx.fillRect(Math.round(P.x - 11), Math.round(P.y - s * 0.8 - 5), Math.round(22 * f), 2); }
      if (lv('skin_dusk') && t >= P.veilAt) { ctx.strokeStyle = 'rgba(255,224,160,' + (fr2 ? 0.55 : 0.3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(P.x, P.y - g.r * 0.4, g.r + 6, 0, 7); ctx.stroke(); }
      if (lv('core_nebula')) { const a = now / 260, rr0 = val('core_nebula') * 0.5 + g.r; ctx.fillStyle = '#fff3a0'; ctx.fillRect(Math.round(P.x + Math.cos(a) * rr0) - 1, Math.round(P.y - g.r * 0.4 + Math.sin(a) * rr0 * 0.6) - 1, 2, 2); ctx.fillStyle = '#e8c030'; ctx.fillRect(Math.round(P.x + Math.cos(a + 3.14) * rr0) - 1, Math.round(P.y - g.r * 0.4 + Math.sin(a + 3.14) * rr0 * 0.6) - 1, 2, 2); }
      if (P.crev && sim.fits(P.crev)) { ctx.fillStyle = 'rgba(5,4,10,.45)'; ctx.beginPath(); ctx.ellipse(P.crev.x, P.crev.y, P.crev.r, P.crev.r * 0.62, 0.4, 0, 7); ctx.fill(); } }
    for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i], a = (t - f.t) / TPS; if (a > 0.8 || a < 0) { FX.splice(i, 1); continue; } const q = 1 - a / 0.8;
      if (f.k === 'eat') { ctx.fillStyle = ASPCOL[f.asp]; ctx.globalAlpha = q; ctx.fillRect(Math.round(f.x + (P.x - f.x) * a / 0.8), Math.round(f.y + (P.y - f.y) * a / 0.8) - 1, 2, 2); ctx.globalAlpha = 1; }
      else if (f.k === 'gold') { ctx.fillStyle = '#fff3a0'; ctx.globalAlpha = q; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y - a * 18), 7, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y - a * 18) - 3, 1, 7); ctx.globalAlpha = 1; }
      else if (f.k === 'gulp' || f.k === 'pulse' || f.k === 'veil' || f.k === 'dash' || f.k === 'burrow' || f.k === 'erupt' || f.k === 'snap' || f.k === 'inhale') { ctx.strokeStyle = f.k === 'gulp' ? '#6fd08c' : f.k === 'erupt' || f.k === 'snap' ? '#ff5f57' : '#ffe0a0'; ctx.lineWidth = f.k === 'veil' ? 1 : 2; ctx.globalAlpha = q; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + a * (f.k === 'pulse' ? (f.r || 140) * 1.2 : f.k === 'gulp' ? 60 : 34), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (f.k === 'heal') { ctx.fillStyle = 'rgba(208,240,138,' + q + ')'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y - 14 - a * 16), 7, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y - 17 - a * 16), 1, 7); }
      else if (f.k === 'gone' || f.k === 'hurt' || f.k === 'splat' || f.k === 'drain') { ctx.fillStyle = (f.k === 'splat' ? 'rgba(216,224,112,' : f.k === 'drain' ? 'rgba(200,106,120,' : 'rgba(200,48,58,') + q + ')'; for (let n = 0; n < 6; n++) ctx.fillRect(Math.round(f.x + Math.cos(n * 1.05) * a * 26), Math.round(f.y + Math.sin(n * 1.05) * a * 26), 2, 2); }
      else if (f.k === 'prey') { ctx.fillStyle = 'rgba(200,48,58,' + q + ')'; for (let n = 0; n < 5; n++) ctx.fillRect(Math.round(f.x + Math.cos(n * 1.26) * a * 18), Math.round(f.y + Math.sin(n * 1.26) * a * 18), 2, 2); ctx.fillStyle = 'rgba(251,247,234,' + q + ')'; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y - a * 10), 2, 2); }
      else if (f.k === 'fight') { ctx.strokeStyle = 'rgba(255,255,255,' + q + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + a * 22, 0, 7); ctx.stroke(); }
      else if (f.k === 'grew') { ctx.fillStyle = 'rgba(255,210,58,' + q + ')'; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y - 12 - a * 14), 2, 6); ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y - 10 - a * 14), 6, 2); }
      else if (f.k === 'dust') { ctx.fillStyle = 'rgba(90,74,104,' + 0.7 * q + ')'; ctx.fillRect(Math.round(f.x - a * 8), Math.round(f.y - a * 12), 2, 2); ctx.fillRect(Math.round(f.x + 5 + a * 6), Math.round(f.y - 3 - a * 9), 2, 1); }
      else if (f.k === 'blink') { ctx.strokeStyle = 'rgba(224,200,255,' + 0.8 * q + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y - 4); ctx.lineTo(f.tx, f.ty - 4); ctx.stroke(); }
      else if (f.k === 'snared') { ctx.strokeStyle = 'rgba(224,200,255,' + q + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + a * 8, 0, 7); ctx.stroke(); } }
    // 어둠: 한 방울 둘레만 보인다
    { const gr = ctx.createRadialGradient(P.x, P.y - g.r * 0.3, R * 0.3, P.x, P.y - g.r * 0.3, R); gr.addColorStop(0, 'rgba(5,4,10,0)'); gr.addColorStop(0.62, 'rgba(5,4,10,.4)'); gr.addColorStop(1, 'rgba(5,4,10,.965)'); ctx.fillStyle = gr; ctx.fillRect(ox, oy, vw, vh); if (under > 0.05) { ctx.fillStyle = 'rgba(5,4,10,' + (0.22 * under).toFixed(3) + ')'; ctx.fillRect(ox, oy, vw, vh); }
      ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 0.17; for (const q of gdraw) { const s2 = shade2Of(q.key, q.src); ctx.drawImage(q.face < 0 ? flip(s2) : s2, q.x, q.y, q.w, q.h); } ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false; }
    // 어둠 속에서도 희미하게 보이는 것: 먹이의 빛, 사나운 것의 눈
    const dotS = Math.max(2, Math.round(2 / zoom));
    for (const f of S.food) { if (!f.alive || f.ring > S.stage || !inView(f, 2)) continue; const d = dist(f, P); if (d < R * 0.8) continue; if (f.k === 'mote' && S.stage >= 3) continue; const big = f.k !== 'mote' && f.k !== 'bead' && f.k !== 'egg'; if (d < R * PRO.K.hintF || (feel && big) || (feel >= 2 && (f.k === 'cap' || f.k === 'egg')) || (feel >= 3 && f.k === 'bead')) { ctx.fillStyle = f.k === 'bead' ? '#e8c030' : f.k === 'cap' ? '#9fe8c0' : ASPCOL[f.asp] || '#a59cb4'; ctx.globalAlpha = (fr4 + f.ph) % 4 === 1 ? 0.35 : 0.8; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, big ? dotS + 1 : dotS, big ? dotS + 1 : dotS); } } ctx.globalAlpha = 1;
    for (const c of S.cre) { if (!c.alive || c.ring > S.stage || !inView(c, 6) || !sim.hostile(c)) continue; const d = dist(c, P); if (d < R * 0.78) continue; const hid = c.mode === 'buried' || c.mode === 'bait'; if (hid && !third) continue; const lit = c.mode === 'chase' || c.mode === 'dash' || c.mode === 'lunge' || c.mode === 'aim' || c.mode === 'tell' || c.mode === 'hunt' || c.mode === 'out'; if (third >= 2 || d < R * PRO.K.hintC || lit) { const e = Math.max(1, Math.round(1.2 / zoom)); ctx.fillStyle = c.k === 'stalker' ? '#ffd23a' : RED; ctx.globalAlpha = lit ? 1 : 0.55; if (c.k !== 'blind') { ctx.fillRect(Math.round(c.x + c.face * 2) - 2 * e, Math.round(c.y - 2), e, e); ctx.fillRect(Math.round(c.x + c.face * 2) + e, Math.round(c.y - 2), e, e); } else { ctx.strokeStyle = 'rgba(224,212,220,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; if (third) { ctx.strokeStyle = 'rgba(255,95,87,' + (fr2 ? 0.7 : 0.35) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(c.x), Math.round(c.y), c.r + 3, 0, 7); ctx.stroke(); } } }
    const sw = S.sweep;
    if (sw.st === 'run') { for (let j = 7; j >= 1; j--) { const bx = sw.x - sw.dx * j * sw.r, by = sw.y - sw.dy * j * sw.r, br = sw.r * (1 - j * 0.08); ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.arc(bx, by, br + 1.5, 0, 7); ctx.fill(); ctx.fillStyle = j % 2 ? '#2a1a30' : '#3a2440'; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); } const c = sweepSpr(fr2), s = sw.r * 2.6 / 56; ctx.drawImage(c, sw.x - 28 * s, sw.y - 28 * s, 56 * s, 56 * s); }
    if (sw.st === 'warn') { const a = (t - sw.t0) / sw.warn, on = Math.floor(now / 140) % 2; ctx.strokeStyle = on ? 'rgba(255,95,87,.75)' : 'rgba(255,95,87,.3)'; ctx.lineWidth = 3 / zoom; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(sw.sx, sw.sy); ctx.lineTo(sw.sx + sw.dx * 1300, sw.sy + sw.dy * 1300); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,95,87,' + (0.15 + a * 0.3) + ')'; ctx.beginPath(); ctx.moveTo(sw.sx - sw.dy * sw.r, sw.sy + sw.dx * sw.r); ctx.lineTo(sw.sx - sw.dy * sw.r + sw.dx * 1300, sw.sy + sw.dx * sw.r + sw.dy * 1300); ctx.moveTo(sw.sx + sw.dy * sw.r, sw.sy - sw.dx * sw.r); ctx.lineTo(sw.sx + sw.dy * sw.r + sw.dx * 1300, sw.sy - sw.dx * sw.r + sw.dy * 1300); ctx.stroke(); }
    // 화면 밖을 가리키는 점: 가까운 틈, 먹이 무더기, 더듬이면 큰 먹이, 셋째눈이면 사나운 것
    { const topY = 96 / Z, botY = 96 / Z, dot = (o, col, s) => { const pxx = clampN(o.x, ox + 6, ox + vw - 9), pyy = clampN(o.y, oy + topY, oy + vh - botY); ctx.fillStyle = '#05040a'; ctx.fillRect(Math.round(pxx) - 1, Math.round(pyy) - 1, s + 2, s + 2); ctx.fillStyle = col; ctx.globalAlpha = fr2 ? 1 : 0.6; ctx.fillRect(Math.round(pxx), Math.round(pyy), s, s); ctx.globalAlpha = 1; }, ds = Math.max(3, Math.round(3 / zoom));
      if (S.stage <= 2) S.clusters.filter(c => c.ring <= S.stage && !inView(c, -6)).sort((a, b) => dist(a, P) - dist(b, P)).slice(0, 3).forEach(c => dot(c, ASPCOL[c.asp], ds));
      if (feel) S.food.filter(f => f.alive && f.ring <= S.stage && !inView(f, -6) && (f.k === 'root' || f.k === 'carc' || f.k === 'seed' || f.k === 'seed2' || f.k === 'nut' || (feel >= 2 && f.k === 'cap') || (feel >= 3 && f.k === 'bead'))).sort((a, b) => dist(a, P) - dist(b, P)).slice(0, 4).forEach(f => dot(f, f.k === 'cap' ? '#9fe8c0' : f.k === 'bead' ? '#e8c030' : '#d8a860', ds));
      if (feel >= 3 || S.hp <= 1) { const q = S.crev.filter(c => sim.fits(c) && c.ring <= S.stage && !inView(c, -6)).sort((a, b) => dist(a, P) - dist(b, P))[0]; if (q) dot(q, '#8a7a98', ds + 1); }
      if (third >= 2) S.cre.filter(c => c.alive && c.ring <= S.stage && sim.hostile(c) && !inView(c, -6) && dist(c, P) < 520 / zoom * 0.5 + 200).forEach(c => dot(c, RED, ds + 1)); }
    if (t - flash < 12) { ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - (t - flash) / 12)) + ')'; ctx.fillRect(ox, oy, vw, vh); }
  }
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (!document.hidden && !manual && !S.ended && !shop && !intro) {
      let kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0); if (kx || ky) { const L = Math.hypot(kx, ky); sim.aim(P.x + kx / L * 70, P.y + ky / L * 70); }
      const slowmo = S.t - S.upAt < 28 ? 0.4 : 1; acc += dt * (opts.speed || 1) * slowmo; let n = 0;
      try { while (acc >= 1 / TPS && n++ < 8) { acc -= 1 / TPS; sim.tick(); } } catch (e) { acc = 0; trouble(e, 'tick'); } }
    try { drain(); draw(now); hud(); if (S.ended && !ended) finish(S.ended); } catch (e) { trouble(e, 'draw'); }
  }
  // 문제가 생기면 멈춰 서지 않는다: 무슨 일인지 적어 두고, 거듭되면 지금까지 얻은 것으로 자리를 잡는다
  let troubles = 0;
  function trouble(e, where) {
    console.error(e); troubles++;
    const msg = where + ': ' + (e && e.message ? e.message : String(e)) + ' @ ' + String((e && e.stack) || '').split('\n').slice(1, 3).join(' | ').slice(0, 240) + ' [몸 ' + S.stage + ', ' + Math.round(S.t / TPS) + '초]';
    try { localStorage.setItem('oldnest.err', JSON.stringify(msg)); } catch (e2) { /* 저장 못 해도 계속 */ }
    if (troubles < 4 || ended) return;
    try { finish('time'); } catch (e3) { console.error(e3); const r = (() => { try { return sim.result('time'); } catch (e4) { return null; } })(); close(); if (onDone) onDone(r || { skipped: true }); }
  }

  // ---------- 끝 ----------
  function close() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKey, true); window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', onVis); if (root.parentNode) root.parentNode.removeChild(root); if (window.__pro === API) delete window.__pro; onDone(result); }
  function finish(kind) {
    if (ended) return; ended = true; closeIntro(); closeShop(); if (!S.ended) sim.end(kind); result = sim.result(kind); hudKey = ''; hud(); $p('pro-settle').hidden = true; $p('pro-skip').hidden = true; $p('pro-grow').hidden = true; $p('pro-act').hidden = true; $p('pro-cap').style.opacity = 0;
    if (kind === 'skip') { say('click'); return close(); }
    say(kind === 'fell' ? 'down' : 'up');
    const r = result, tot = ASPS.reduce((a, k) => a + r.ess[k], 0), topA = ASPS.slice().sort((a, b) => r.ess[b] - r.ess[a])[0], mx = Math.max(1, r.ess[topA]), n = r.parts.length, canKeep = !r.fell && S.stage >= KK.keepFrom && n > 0;
    if (canKeep) sim.setKeep(r.parts.slice().sort((a, b) => b.lv - a.lv)[0].id);
    const title = { fell: '쓰러졌다', time: '밤이 다 갔다', grown: '다 자랐다', settle: '자리를 잡았다' }[kind] || '자리를 잡았다';
    const line = kind === 'fell' ? '세 번 쓰러졌어. 남긴 걸 반은 흘렸고 돋운 것도 새기지 못했어. 그래도 살았잖아.' : kind === 'grown' ? '끝까지 자랐네. 널 쫓던 것들을 다 삼키고. 이만큼 가져가는 방울은 드물어.' : S.stage <= 2 ? '일찍 자리를 잡았네. 안전하지만 가져가는 건 적어.' : n >= 4 ? '몸을 꽤 바꿨네. 그중 하나는 허물을 벗어도 남아.' : '여기까지 온 것만으로도 넉넉해.';
    const lean = tot ? ' ' + ASPK[topA] + ' 빛깔을 제일 많이 남겼으니 몸이 그쪽으로 기울 거야.' : '';
    const nextSay = kind === 'grown' ? '' : S.stage < 5 ? `<p class="pro-mute">${STG[S.stage + 1].name}까지 갔다면: 정수 ${KK.essCap[S.stage + 1]}까지${S.stage + 1 === KK.keepFrom ? ', 부위 하나를 허물에 새김' : ''}</p>` : '<p class="pro-mute">다 자랐다면 남긴 것을 가장 후하게 쳐 준다</p>';
    const keepHtml = () => { const kp = sim.keep, k = r.parts.find(p => p.id === kp); return `<div class="pro-parts">${r.parts.map(p => `<button class="pro-keep${p.id === kp ? ' on' : ''}" data-keep="${p.id}" style="--c:${ASPCOL[p.asp]}"><img src="${iconURL(p.id, p.lv)}" alt="">${PART[p.id].name} ${pipsHtml(p.lv, ASPCOL[p.asp])}</button>`).join('')}</div>${k ? `<p>둥지에서 <b style="color:${ASPCOL[k.asp]}">${NEST.MUT[PART[k.id].mut].name}</b> — ${NEST.MUT[PART[k.id].mut].desc}</p>` : ''}`; };
    const el = document.createElement('div'); el.className = 'pro-end'; el.innerHTML = `<div class="pro-card" role="dialog" aria-label="땅속에서 얻은 것"><h2>${title}<small>${STG[S.stage].name} · ${Math.floor(r.time / 60)}분 ${r.time % 60}초 · 진액 ${r.gold}방울</small></h2>
      <div class="pro-bars">${ASPS.filter(a => r.ess[a] > 0).map(a => `<span style="color:${ASPCOL[a]}">${ASPK[a]}</span><span class="b"><i style="width:${Math.round(r.ess[a] / mx * 100)}%;background:${ASPCOL[a]}"></i></span><span>${r.ess[a]}</span>`).join('') || '<span class="pro-mute" style="grid-column:1/-1">남긴 것이 없다</span>'}</div>
      ${SEED ? `<p class="pro-mute pro-seedline"><img src="${seedURL(0)}" alt=""><span>이번 몸 <b style="color:#ece6d6">${SEED.name}</b> · ${SEED.say}${NESTSAY ? '<br>둥지에서 — ' + NESTSAY : ''}</span></p>` : ''}<p class="pro-mute">쓰지 않고 남긴 것이 정수가 된다 · 합 ${tot} (이 몸으로는 ${KK.essCap[S.stage]}까지)</p>${nextSay}
      ${r.fell ? (n ? '<p class="pro-warn">쓰러져서 돋운 부위를 허물에 새기지 못했다</p>' : '') : canKeep ? `<p><b style="color:#e8c030;font-family:var(--display,sans-serif);font-weight:400">허물에 새길 부위 하나를 골라</b></p><div id="pro-keepbox">${keepHtml()}</div>` : n ? `<p class="pro-mute">부위는 ${STG[KK.keepFrom].name}부터 허물에 새길 수 있다</p>` : '<p class="pro-mute">돋운 부위가 없다</p>'}
      <div class="pro-say"><img src="${spriteCanvas('slime', 'echo').toDataURL()}" width="40" height="40" alt=""><p><b style="color:#e8c030;font-family:var(--display,sans-serif);font-weight:400">잔향</b> ${line}${lean}</p></div>
      <button class="pro-b pri" id="pro-go">둥지를 튼다</button></div>`;
    root.appendChild(el); el.addEventListener('click', e => { const b = e.target.closest('[data-keep]'); if (b) { sim.setKeep(b.dataset.keep); say('click'); el.querySelector('#pro-keepbox').innerHTML = keepHtml(); } });
    const go = el.querySelector('#pro-go'); go.addEventListener('click', () => { say('click'); result = sim.result(kind); close(); }); try { go.focus(); } catch (e) { /* 괜찮다 */ }
  }
  const onVis = () => { last = 0; acc = 0; }; document.addEventListener('visibilitychange', onVis);
  // 이번 몸: 시작할 때 한 번 알린다. 누르면 흙 속이 흐르기 시작한다
  const seedURL = fr => spr('seed:' + fr, () => slimeCanvas(DROP, fr).toDataURL());
  function closeIntro() { if (!intro) return; intro = false; clearInterval(introIv); root.classList.remove('pro-introing'); const el = $p('pro-intro'); if (el && el.parentNode) el.parentNode.removeChild(el); last = 0; acc = 0; hudKey = ''; }
  function openIntro() {
    if (!SEED || intro || S.ended) return; intro = true; root.classList.add('pro-introing');
    const el = document.createElement('div'); el.className = 'pro-end pro-intro'; el.id = 'pro-intro';
    el.innerHTML = `<div class="pro-card pro-seed" role="dialog" aria-label="이번 몸: ${SEED.name}"><p class="pro-mute">별에서 떨어진 것 · 이번 몸</p><img src="${seedURL(0)}" alt=""><h2>${SEED.name}</h2><p>${SEED.say}</p>${NESTSAY ? '<p class="pro-mute">둥지에서 — ' + NESTSAY + '</p>' : ''}${sim.form.act ? '<p class="pro-mute">오른쪽 아래 단추로 쓴다: ' + PRO.ACT0.name + '</p>' : ''}<button class="pro-b pri" id="pro-in-go">깨어난다</button></div>`;
    root.appendChild(el); let k = 0; const im = el.querySelector('img'); introIv = setInterval(() => { k = (k + 1) % 4; im.src = seedURL(k); }, 240);
    el.addEventListener('click', () => { say('click'); closeIntro(); }); try { el.querySelector('#pro-in-go').focus(); } catch (e) { /* 괜찮다 */ }
  }
  if (opts.tut) sim.caption('손가락이 가는 쪽으로 움직여', '색 있는 알갱이를 먹어. 붉은 눈은 피해', 5); else sim.caption('땅속의 한 방울', '먹고, 자라고, 살아남아라', 3.4);

  // 시험용 손잡이
  const API = { get look() { return sim.look; }, get form() { return Object.assign({}, sim.form); }, get intro() { return intro; }, closeIntro() { closeIntro(); },
    get player() { const g = G(); return { x: P.x, y: P.y, size: S.stage, stage: S.stage, hp: S.hp, maxHp: sim.maxHp(), r: g.r, inv: P.inv, speed: g.sp, cd: P.cd }; }, get stage() { return S.stage; }, get lives() { return S.lives; }, get time() { return S.t / TPS; }, get bio() { return S.bio; }, get spent() { return S.spent; }, get splits() { return S.stage - 1; }, get ended() { return S.ended; }, get stats() { return Object.assign({}, S.stats); },
    get motes() { return S.food.filter(f => f.alive && f.k === 'mote' && f.ring <= S.stage).map(f => ({ x: f.x, y: f.y, kind: f.asp, size: 0 })); }, get beads() { return S.food.filter(f => f.alive && f.k === 'bead' && f.ring <= S.stage).map(f => ({ x: f.x, y: f.y, kind: 'bead', size: 0 })); },
    get food() { return S.food.filter(f => f.alive && f.ring <= S.stage).map(f => ({ x: f.x, y: f.y, kind: f.k, asp: f.asp, need: PRO.FOOD[f.k].need || 0 })); },
    get creatures() { const out = S.cre.filter(c => c.alive && c.ring <= S.stage).map(c => ({ id: c.id, kind: c.k, species: c.k, x: c.x, y: c.y, size: c.st, st: c.st, r: c.r, hostile: sim.hostile(c), edible: sim.canEat(c), mode: c.mode, stun: c.stun })); if (S.sweep.st !== 'idle') out.push({ kind: 'sweeper', species: 'sweeper', x: S.sweep.x, y: S.sweep.y, size: 9, st: 9, hostile: true, state: S.sweep.st, dx: S.sweep.dx, dy: S.sweep.dy }); return out; },
    get crevices() { return S.crev.filter(q => q.ring <= S.stage).map(q => ({ x: q.x, y: q.y, r: q.r, fit: q.fit })); },
    get kin() { return []; }, get result() { return result || sim.result(S.ended || 'settle'); },
    get wallet() { const o = {}; ASPS.forEach(a => { o[a] = wal(a); }); return o; }, get parts() { const o = {}; SLOTS.forEach(s => { const w = S.worn[s[0]]; if (w) o[w.id] = w.lv; }); return o; }, get shopOpen() { return shop; },
    catalog: CAT.map(d => ({ id: d.id, slot: d.slot, asp: d.asp, name: d.name, cost: d.cost.slice(), mut: d.mut, openAt: KK.open[d.slot], act: d.act || null, text: [0, 1, 2].map(k => d.say(d.v[k], k)) })),
    buy(id) { const ok = sim.buy(id); if (ok) redrawShop(); return ok; }, why(id) { return sim.whyNot(id); }, price(id) { return PART[id] ? sim.priceOf(id) : null; }, openShop(tip) { openShop(tip); }, closeShop() { closeShop(); }, select(id) { if (PART[id]) { sel = id; redrawShop(); } },
    set manual(v) { manual = !!v; if (manual) closeIntro(); }, get manual() { return manual; }, sim,
    step(n) { for (let k = 0; k < (n || 1) && !S.ended; k++) sim.tick(); return S.ended; }, aim(x, y) { sim.aim(x, y); }, act() { return sim.act(); }, end(kind) { sim.end(kind || 'settle'); if (manual) finish(S.ended); }, world: { r: STG[5].R }, home };
  window.__pro = API;
  return new Promise(res => { onDone = res; fit(); hud(); openIntro(); raf = requestAnimationFrame(loop); });
}
window.runPrologue = runPrologue;
