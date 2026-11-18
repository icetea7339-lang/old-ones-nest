// 옛 것의 둥지 — 화면 1/3: 공통 도구, 저장, 도트, 소리
// (build.sh가 art.js + stage.js + ui.js를 한 함수 안에 이어 붙인다)
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const R = x => Math.round(x).toLocaleString('ko-KR');
let G = null;
const UI = { sel: null, confirmEnd: false, hint: '' };
const mq = q => !!(window.matchMedia && window.matchMedia(q).matches);
const TOUCH = mq('(hover: none) and (pointer: coarse)'), isMobile = () => mq('(max-width: 760px)');

// ---------- 저장 ----------
const store = { get(k) { try { const v = localStorage.getItem('oldnest.' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('oldnest.' + k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } }, del(k) { try { localStorage.removeItem('oldnest.' + k); } catch (e) { /* 무시 */ } } };
const META0 = () => ({ runs: 0, clears: 0, best: null, legacy: [], codex: { forms: {}, muts: {}, ends: {} }, sound: true, speed: 1, pause: 'settle', roster: [], rid: 1, dust: 0, lastDraw: '', board: [] });
let META = Object.assign(META0(), store.get('meta') || {});
if (META.legacy && META.legacy.length) { META.legacy.forEach(l => META.roster.push(Object.assign({ rid: META.rid++, tier: l.rare ? 'R' : 'N', title: '', runs: 1 }, l))); META.legacy = []; }
META.codex.combos = META.codex.combos || {};
const saveMeta = () => store.set('meta', META), saveRun = () => { if (G && !G.over) store.set('run', G); };
const GORD = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

// ---------- 도트 ----------
const SPR = {
  slime: ['................', '................', '................', '................', '................', '......ooo.......', '....oobbboo.....', '...obhhbbbbo....', '..obhbbbbbbbo...', '.obbbbbbbbbbbo..', '.obbbbbbbbbbbbo.', 'obbbbbbbbbbbbbso', 'obbbbbbbbbbbbsso', '.obbsbbbbbbssso.', '..oossoosssooo..', '...oo..oooo.....'],
  sl_abyss: ['.......oo.......', '......obbo......', '.....obhbbo.....', '....obhbbbbo....', '....obbbbbbo....', '...obbebbebbo...', '...obbebbebbo...', '..obbbbbbbbbbo..', '..obbebbebbbbo..', '.obbbbbbbbbbbbo.', '.obbbbbbbbbbsbo.', '.obbsbbbbbbssbo.', '.obo.obbsbo.obo.', '.oao.obo.oo.oao.', '..o..oao.....o..', '......o.........'],
  sl_nebula: ['....aaaaaaaa....', '...a........a...', '....aaaaaaaa....', '.....oooooo.....', '...oobbbbbboo...', '..obbwbbbbbbbo..', '.obbbbbbabbbbbo.', '.obhbbbbbbbwbbo.', '.obbbbwbbbbbbbo.', '.obbbbbbbbabbso.', '..obbabbbbbbso..', '...oobbbwbsoo...', '.....oossoo.....', '......o..o......', '.....o....o.....', '................'],
  sl_brood: ['................', '....a.....a.....', '...oao...oao....', '..obbbo.obbbo...', '..obhbooobhbo...', '.oobbbbbbbbboo..', 'obbbobbbbbobbbo.', 'obhbobbhbbobhbo.', 'obbbbbbbbbbbbbo.', '.oobbbobbbobboo.', '.obbbbobbbobbbo.', 'obhbbbbbbbbbbsbo', 'obbbbsbbbbsbbsso', '.obbssbbbssbsso.', '..oooosssoooo...', '................'],
  sl_dusk: ['......oooo......', '....oobbbboo....', '...obbbbbbbbo...', '..obbwwwbbbbbo..', '..obbweebbbebo..', '.obbbbbbbbbeebo.', '.obebbbbbbbbbbo.', '.obeebbbweebbbo.', '.obbbbbbbbbbbbo.', '.obbbweebbbebbo.', '..obbbbbbbeebo..', '..obsbbbbbbbso..', '...obssbbbsso...', '...oboosssobo...', '..oo.o.oo.o.oo..', '................'],
  sl_hunger: ['................', '....oooooooo....', '..oobbbbbbbboo..', '.obbhbbbbbbbbbo.', '.obbbbbbbbbbbbo.', 'obwbwbwbwbwbwbwo', 'oeweweweweweweeo', 'oeeeeeeeeeeeeeeo', 'oeeeeaaaaaeeeeeo', 'oeeeeeaaaeeeeeeo', 'oeweweweweweweeo', 'obwbwbwbwbwbwbso', '.obbbbbbbbbbsso.', '.obbsbbbbbssso..', '..ooossssooo....', '................'],
  eyeheap: ['................', '................', '.....oooooo.....', '...oobbbbbboo...', '..obwwbbbwwbbo..', '..obweobbweobo..', '.obbbbbwwbbbbbo.', '.obwwbbweobwwbo.', '.obweobbbbbweoo.', '.obbbbwwbbbbbbo.', '..obbbweobwwbo..', '..obsbbbbbweoo..', '...obssbbbbso...', '....oosssoo.....', '................', '................'],
  tangle: ['................', '..o........o....', '.obo..oo..obo...', '.obo.obbo.obo...', '..obobbbbobo....', '..obbbhbbbbo.o..', '.oobbbbbbbbooboo', 'obobbsbbbbbbobo.', 'obobbbbbbsbbbo..', '.oobbbbbbbbboo..', '..obobbbbobobo..', '.obo.obbo.obo...', '.obo.obo..obo...', '..o..obo...o....', '......o.........', '................'],
  goblin: ['................', '................', 'o....oooooo....o', 'oo..obbbbbbo..oo', 'obooobbbbbbooobo', '.obbbbbbbbbbbbo.', '..obbebbbbebbo..', '..obbebbbbebbo..', '..obbbbbbbbbbo..', '...obbwwwwbbo...', '....obbbbbbo....', '...oossssssoo...', '..obosssssobo.a.', '..obosssssoboa..', '....oso..oso....', '...ooo...ooo....'],
  skeleton: ['................', '....oooooooo....', '...owwwwwwwwo...', '..owwwwwwwwwwo..', '..owweewweewwo..', '..owweewweewwo..', '..owwwwsswwwwo..', '...owwwwwwwwo...', '....owowowoo....', '.....oooooo.....', '...oowwsswwoo...', '..owoowssoowo.a.', '..owo.owwo.owoa.', '......owwo......', '.....owoowo.....', '....ooo..ooo....'],
  harpy: ['................', '................', '.o............o.', 'obo...oooo...obo', 'obbo.obbbbo.obbo', 'obbboobebbeoobbo', 'obbbbobbbbobbbbo', '.obbbbbaabbbbbo.', '..obbbbbbbbbbo..', '...oosbbbbsoo...', '.....obbbbo.....', '.....osssso.....', '.....osssso.....', '......o..o......', '.....oo..oo.....', '................'],
  mimic: ['................', '................', '..oooooooooooo..', '.obbbbbbbbbbbbo.', '.obhhbbbbbbbbbo.', '.obbbbbbbbbbbbo.', '.oooooooooooooo.', '.owowowowowowoo.', '.oeoooooooooeoo.', '.owowowowowowoo.', '.oooooooaaooooo.', '.osssssoaaossso.', '.osssssssssssso.', '.osssssssssssso.', '.oooooooooooooo.', '................'],
  human: ['................', '.....oooooo.....', '....oaaaaaao....', '...oaaaaaaaao...', '....obbbbbbo....', '....obebbebo....', '....obbbbbbo....', '.....obbbbo.....', '...oossssssoo...', '..obosssssobo...', '..obosssssobo.w.', '..oo.ssssso.o.w.', '.....osooso...o.', '.....oso.oso..o.', '....ooo..ooo..o.', '................'],
  hound: ['................', '................', '................', '................', '.........oo..o..', '........obbooo..', '..o....obbbbeo..', '.obo..obbbbbbbo.', '.obbooobbbbbwwo.', '..obbbbbbbbbooo.', '..obbbbbbbbbo...', '..obbbsbbbbso...', '..obo.obo.obo...', '..obo.obo.obo...', '..oo..oo..oo....', '................'],
  hood: ['................', '.....oooooo.....', '....oaaaaaao....', '...oaaaaaaaao...', '...oaobbbboao...', '...oaebbbbeao...', '...oaobbbboao...', '....oaobboao....', '...oossssssoo...', '..oossssssssoo..', '..osssshhsssso..', '..osssssssssso..', '..osssssssssso..', '..ossssssssso...', '...oooooooooo...', '................'],
};
const SKIN = ['#1b1d2a', '#e8b890', '#f6d8b8'];
const PAL = {
  // 본체: [윤곽, 몸, 밝은 곳, 그늘, 포인트]
  base: ['#1b1d2a', '#9fb8a8', '#dff0e0', '#5f7f72', '#f2e9c9'], abyss: ['#081a2a', '#1f8fa8', '#9fe8f0', '#0f5a78', '#d8f6ff'],
  nebula: ['#1a1030', '#8a5fe0', '#e0c8ff', '#4a2a9a', '#fff3a0'], brood: ['#102410', '#6fbf3f', '#d0f08a', '#2f7a2a', '#f0e060'],
  dusk: ['#2a1420', '#e08a3a', '#ffe0a0', '#9a4a2a', '#f5f5f5'], hunger: ['#2a0a0e', '#c8303a', '#ff9a8a', '#7a121c', '#f5f5f5'],
  echo: ['#3a4060', '#aab4e0', '#e8ecff', '#6a74a8', '#ffffff'],
  // 권속
  goblin: ['#1b1d2a', '#7fae4a', '#b8e080', '#5a4630', '#c8c8d0'], skeleton: ['#1b1d2a', '#d8d8c8', '#ffffff', '#8a8a7a', '#c8c8d0'],
  cultist: ['#1b1d2a', '#c8b8a8', '#e8c030', '#5a2a7a', '#3a1a5a'], scribe: ['#1b1d2a', '#b8c0e0', '#fff3a0', '#2a3a8a', '#1a2460'],
  mask: ['#1b1d2a', '#f5f5f5', '#e8c030', '#2a2030', '#7a121c'], scale: ['#081a2a', '#2fa8a0', '#a0f0e0', '#0f6a78', '#e8c030'],
  hunger_k: ['#2a0a0e', '#b8303a', '#ff9a8a', '#7a121c', '#f5f5f5'], spawn: ['#102410', '#8fd05f', '#e0f8a0', '#3f8a3a', '#f0e060'],
  // 침입자: [윤곽, 살, 밝은 살, 옷, 머리·모자]
  villager: SKIN.concat(['#8a6a3a', '#c8a050']), fisher: SKIN.concat(['#3a6a9a', '#e8d050']), militia: SKIN.concat(['#3f6b46', '#7a5a2a']),
  captain: SKIN.concat(['#8a2a2a', '#d0d0d8']), detective: SKIN.concat(['#4a4a58', '#6a6a78']), apprentice: SKIN.concat(['#6aa0d0', '#7a5a3a']),
  warrior: SKIN.concat(['#707890', '#a0a8c0']), smuggler: SKIN.concat(['#3a2a4a', '#2a2030']), priest: SKIN.concat(['#e8e8f0', '#f0d060']),
  scholar: SKIN.concat(['#2a3a8a', '#e8e8f0']), herbalist: SKIN.concat(['#4a8a4a', '#e890b0']), soldier: SKIN.concat(['#2a3a6a', '#a0a8c0']),
  hound: ['#1b1d2a', '#8a6a4a', '#b89a7a', '#5a4630', '#c8c8d0'], handler: SKIN.concat(['#5a4630', '#3f6b46']), sapper: SKIN.concat(['#6a5a2a', '#e8c030']),
  digger: ['#1b1d2a', '#a8845a', '#d8b88a', '#3a2a20', '#e8c030'], clerk: ['#1b1d2a', '#d8c8a8', '#e8c030', '#2f6b46', '#1f4a2a'], licker: ['#3a1a2a', '#e88aa8', '#ffd0e0', '#a84a6a', '#f5f5f5'],
  spitter: ['#1a1030', '#9a6ad0', '#e0c8ff', '#4a2a7a', '#fff3a0'], eyeheap: ['#2a0a1e', '#a84a6a', '#e89ab0', '#6a2a44', '#f5f5f5'], tangle: ['#081a2a', '#3a8a7a', '#8ad8c0', '#1a5a50', '#f0e060'],
  netter: ['#1b1d2a', '#5f9fc0', '#a8d8f0', '#2a4a6a', '#c8c8d0'], warden: ['#1b1d2a', '#b8b0a0', '#e8e0d0', '#4a4a58', '#e8c030'],
  chaplain: SKIN.concat(['#f0e8e0', '#c83030']), sealer: ['#1b1d2a', '#ffe0c0', '#fff0e0', '#1a1a2a', '#e8c030'],
};
const ASPCOL = { abyss: '#3fb8d0', nebula: '#a884ff', brood: '#7fd04f', dusk: '#f0a04a', hunger: '#e8505a' };
const KINSPR = { goblin: ['goblin', 'goblin'], skeleton: ['skeleton', 'skeleton'], cultist: ['hood', 'cultist'], scale: ['harpy', 'scale'], scribe: ['hood', 'scribe'], spawn: ['slime', 'spawn'], mask: ['hood', 'mask'], hunger: ['mimic', 'hunger_k'], netter: ['goblin', 'netter'], warden: ['skeleton', 'warden'], turncoat: ['human', 'warrior'], fallen: ['hood', 'priest'], digger: ['goblin', 'digger'], clerk: ['hood', 'clerk'], licker: ['slime', 'licker'], spitter: ['harpy', 'spitter'], eyeheap: ['eyeheap', 'eyeheap'], tangle: ['tangle', 'tangle'] };
const invCanvas = kind => spriteCanvas(kind === 'hound' ? 'hound' : 'human', kind);
// 부 징조가 본체에 더하는 그림 [x, y, 색]
const SUBOVER = {
  abyss: [[7, 2, '#9fe8f0'], [8, 1, '#9fe8f0'], [8, 2, '#3fb8d0'], [9, 2, '#9fe8f0'], [13, 5, '#d8f6ff']],
  nebula: [[4, 7, '#fff3a0'], [11, 6, '#fff3a0'], [8, 5, '#ffffff'], [6, 12, '#fff3a0'], [12, 10, '#ffffff'], [3, 10, '#ffffff']],
  brood: [[5, 2, '#6fbf3f'], [5, 1, '#d0f08a'], [10, 2, '#6fbf3f'], [11, 1, '#d0f08a'], [10, 1, '#6fbf3f'], [4, 1, '#6fbf3f']],
  dusk: [[3, 7, '#f5f5f5'], [4, 7, '#f5f5f5'], [5, 7, '#f5f5f5'], [6, 7, '#f5f5f5'], [9, 7, '#f5f5f5'], [10, 7, '#f5f5f5'], [11, 7, '#f5f5f5'], [12, 7, '#f5f5f5'], [4, 10, '#f5f5f5'], [11, 10, '#f5f5f5']],
  hunger: [[5, 11, '#f5f5f5'], [6, 11, '#2a0a0e'], [7, 11, '#f5f5f5'], [8, 11, '#f5f5f5'], [9, 11, '#2a0a0e'], [10, 11, '#f5f5f5'], [6, 12, '#f5f5f5'], [9, 12, '#f5f5f5']],
};
const MUTOVER = {
  tentacle: [[0, 13, '#9fe8f0'], [0, 14, '#3fb8d0'], [1, 15, '#9fe8f0'], [15, 13, '#9fe8f0'], [15, 14, '#3fb8d0'], [14, 15, '#9fe8f0']],
  gills: [[2, 9, '#081a2a'], [2, 11, '#081a2a'], [13, 9, '#081a2a'], [3, 10, '#081a2a']],
  thirdeye: [[7, 5, '#fff3a0'], [8, 5, '#1a1030'], [7, 4, '#1a1030'], [8, 4, '#1a1030']],
  ring: [[4, 1, '#fff3a0'], [5, 0, '#fff3a0'], [6, 0, '#fff3a0'], [7, 0, '#ffffff'], [8, 0, '#fff3a0'], [9, 0, '#fff3a0'], [10, 0, '#fff3a0'], [11, 1, '#fff3a0']],
  spore: [[2, 3, '#d0f08a'], [13, 2, '#d0f08a'], [14, 5, '#d0f08a'], [1, 6, '#d0f08a'], [12, 4, '#f0e060']],
  mouth: [[9, 13, '#1b1d2a'], [10, 13, '#f5f5f5'], [11, 13, '#1b1d2a']],
  maskm: [[2, 8, '#f5f5f5'], [3, 8, '#f5f5f5'], [2, 9, '#f5f5f5'], [3, 9, '#f5f5f5'], [3, 7, '#f5f5f5'], [2, 10, '#e8c030']],
  whisper: [[14, 3, '#ffe0a0'], [15, 2, '#ffe0a0'], [13, 1, '#ffe0a0'], [15, 4, '#ffe0a0']],
  teeth: [[4, 14, '#f5f5f5'], [6, 15, '#f5f5f5'], [8, 15, '#f5f5f5'], [10, 15, '#f5f5f5'], [12, 14, '#f5f5f5']],
  steelgut: [[6, 12, '#a0a8c0'], [7, 12, '#d0d0d8'], [8, 12, '#a0a8c0'], [9, 12, '#a0a8c0'], [7, 13, '#a0a8c0'], [8, 13, '#a0a8c0']],
};
const cv = {}, urls = {};
function spriteCanvas(name, pal) {
  const key = name + ':' + pal; if (cv[key]) return cv[key];
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'), p = PAL[pal] || PAL.base;
  const map = { o: p[0], b: p[1], h: p[2], s: p[3], a: p[4], e: p[0], w: '#f5f5f5' };
  SPR[name].forEach((row, y) => { for (let i = 0; i < 16; i++) { const col = map[row[i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); } } });
  return (cv[key] = c);
}
// 본체: 주 징조 = 색, 부 징조 = 덧그림, 변이 = 부위, 성체 = 빛나는 눈
// 본체: 32×32 위에 부품을 조립해 그린다. 주 징조 = 몸의 구조, 단계 = 크기와 부위 수, 부 징조 = 다른 색의 덧붙은 기관, 변이 = 부위.
function slimeCanvas(sl) {
  const key = 'sl2:' + (sl.main || 'base') + ':' + (sl.sub || '') + ':' + sl.stage + ':' + (sl.muts || []).join(','); if (cv[key]) return cv[key];
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const P = PAL[sl.main] || PAL.base, Q = (sl.sub && PAL[sl.sub]) || P, st = sl.main ? Math.max(1, sl.stage) : 0, DK = '#1a0508', WH = '#f5f5f5';
  const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w || 1, h || 1); };
  const disc = (cx, cy, rx, ry, col) => { x.fillStyle = col; rx = Math.max(0.5, rx); ry = Math.max(0.5, ry); for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const q = 1 - (j * j) / (ry * ry); if (q < 0) continue; const w = Math.round(rx * Math.sqrt(q)); x.fillRect(Math.round(cx) - w, Math.round(cy) + j, w * 2 + 1, 1); } };
  const blob = (cx, cy, rx, ry, p) => { disc(cx, cy, rx + 1, ry + 1, p[0]); disc(cx, cy, rx, ry, p[3]); disc(cx - rx * 0.12, cy - ry * 0.14, rx * 0.86, ry * 0.84, p[1]); disc(cx - rx * 0.4, cy - ry * 0.45, rx * 0.26, ry * 0.2, p[2]); };
  const tent = (x0, y0, len, drift, amp, p, w) => { for (let pass = 0; pass < 2; pass++) for (let i = 0; i < len; i++) { const xx = x0 + drift * i + Math.sin(i * 0.8 + x0) * amp, ww = Math.max(1, Math.round((w || 2) * (1 - i / len * 0.6))); if (pass === 0) px(xx - 1, y0 + i, ww + 2, 1, p[0]); else px(xx, y0 + i, ww, 1, i % 4 === 3 ? p[2] : p[1]); } };
  const maw = (cx, cy, w, h, p, vert) => { disc(cx, cy, w + 1, h + 1, p[0]); disc(cx, cy, w, h, DK); if (vert) { for (let j = -h + 1; j < h; j += 2) { const d = Math.round(w * Math.sqrt(Math.max(0, 1 - (j * j) / (h * h)))); px(cx - d, cy + j, Math.min(2, Math.max(1, d)), 1, WH); px(cx + d - Math.min(1, Math.max(0, d - 1)), cy + j + 1, Math.min(2, Math.max(1, d)), 1, WH); } px(cx, cy - 1, 1, 3, '#c8303a'); } else { for (let i = -w + 1; i < w; i += 2) { const d = Math.round(h * Math.sqrt(Math.max(0, 1 - (i * i) / (w * w)))); px(cx + i, cy - d, 1, Math.min(2, Math.max(1, d)), WH); px(cx + i + 1, cy + d - Math.min(1, Math.max(0, d - 1)), 1, Math.min(2, Math.max(1, d)), WH); } if (h >= 3) px(cx - 1, cy, 3, 1, '#c8303a'); } };
  const pit = (a, b, col) => { px(a - 1, b, 3, 1, col); px(a, b - 1, 1, 3, col); px(a, b, 1, 1, '#ffffff'); };
  const ring = (cx, cy, rx, ry, col, half) => { x.fillStyle = col; for (let a = half ? 0 : -3.1416; a < 3.1416; a += 0.1) x.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); };
  const mask = (a, b, s) => { px(a - 1, b - 1, s + 2, s + 3, '#1b1d2a'); px(a, b, s, s + 1, WH); px(a, b, s, 1, '#c8c8d0'); px(a + 1, b + 2, 1, 1, '#1b1d2a'); px(a + s - 2, b + 2, 1, 1, '#1b1d2a'); px(a + 1, b + s - 1, s - 2, 1, '#7a121c'); };
  const mouth = (a, b, w, p) => { px(a - 1, b - 1, w + 2, 4, p[0]); px(a, b, w, 2, DK); for (let i = 0; i < w; i += 2) px(a + i, b + (i % 4 ? 1 : 0), 1, 1, WH); };
  const sac = (a, b, r, p, seed) => { blob(a, b, r, r, p); if (seed) px(a, b, 1, 2, p[0]); };
  let B = { cx: 16, cy: 24, R: 4, top: 20, bot: 27 };
  if (st === 0) { blob(16, 25, 5, 3, P); px(11, 28, 2, 2, P[1]); px(21, 28, 1, 2, P[3]); px(14, 21, 1, 2, P[1]); px(14, 20, 1, 1, P[2]); }
  else {
    const R = [0, 5, 7, 9, 11][st];
    if (sl.main === 'abyss') {            // 젖은 것: 갓 아래로 늘어지는 다리들
      const cy = [0, 13, 12, 11, 10][st], n = 3 + st * 2, len = 7 + st * 3; B = { cx: 16, cy, R, top: cy - R - 1, bot: cy + R };
      if (st >= 3) for (let k = 0; k < 6; k++) { px(16 - R - 1 - k, cy - 1 + k, 2 + (5 - k), 1, P[0]); px(16 + R + k - (5 - k), cy - 1 + k, 2 + (5 - k), 1, P[0]); px(16 - R - k, cy + k, 5 - k, 1, P[3]); px(16 + R + k - (4 - k), cy + k, 5 - k, 1, P[3]); }
      for (let k = 0; k < n; k++) { const f = n === 1 ? 0 : k / (n - 1) - 0.5; tent(16 + f * (R * 2 - 2), cy + R - 3, Math.min(31 - (cy + R - 3), len - Math.abs(f) * 5), f * 0.5, 1.2, P, 2); }
      disc(16, cy, R + 1, R + 2, P[0]); disc(16, cy, R, R + 1, P[3]); disc(15, cy - 1, R - 1, R, P[1]); disc(16 - R * 0.4, cy - R * 0.5, R * 0.3, R * 0.25, P[2]);
      for (let g = 0; g < Math.min(4, st + 1); g++) { px(16 - R + 2, cy - 2 + g * 2, 3, 1, P[0]); px(16 + R - 4, cy - 2 + g * 2, 3, 1, P[0]); }
      for (let d = 0; d < st; d++) px(8 + d * 6, 29 + (d % 2), 1, 2, P[4]);
      if (st >= 4) for (let k = -2; k <= 2; k++) { px(16 + k * 4, cy - R - 3 - (2 - Math.abs(k)), 2, 3 + (2 - Math.abs(k)), P[0]); px(16 + k * 4, cy - R - 2 - (2 - Math.abs(k)), 1, 2 + (2 - Math.abs(k)), P[2]); }
    } else if (sl.main === 'nebula') {    // 빛나는 것: 고리를 두른 구, 별구멍
      const r = [0, 5, 6, 8, 9][st], cy = 16; B = { cx: 16, cy, R: r, top: cy - r, bot: cy + r };
      for (let k = 1; k <= Math.min(3, st); k++) ring(16, cy + (k - 2), r + 2 + k * 2, 2 + k, P[4]);
      blob(16, cy, r, r, P);
      for (let k = 1; k <= Math.min(3, st); k++) ring(16, cy + (k - 2), r + 2 + k * 2, 2 + k, P[4], true);
      for (let k = 0; k < 2 + st * 2; k++) { const a = k * 2.4, d = (k % 3 + 1) / 3.6 * r; pit(16 + Math.cos(a) * d, cy + Math.sin(a) * d, k % 2 ? P[4] : P[2]); }
      if (st >= 3) blob(16 + r + 4, cy - r - 1, 2, 2, P);
      if (st >= 4) { for (let j = -r + 2; j < r - 1; j++) px(16 + (j % 3 === 0 ? 1 : j % 3 === 1 ? 0 : -1), cy + j, 2, 1, j % 2 ? '#ffffff' : '#fff3a0'); [[3, 5], [27, 7], [5, 26], [26, 25], [2, 15], [29, 17]].forEach(([a, b]) => { px(a, b, 2, 1, P[2]); px(a, b + 1, 1, 1, P[4]); }); }
    } else if (sl.main === 'brood') {     // 불어나는 것: 쌓인 주머니와 줄기
      const n = 3 + st * 3, sr = st >= 3 ? 4 : 3, rows = []; let left = n, w = Math.min(5, 2 + st), y = 26;
      while (left > 0 && w > 0) { const k = Math.min(left, w); rows.push([y, k]); left -= k; w--; y -= sr + 2; }
      B = { cx: 16, cy: 20, R: Math.min(13, rows[0][1] * (sr + 1)), top: y + sr, bot: 29 };
      if (st >= 4) for (let k = 0; k < 5; k++) tent(6 + k * 5, 27, 5, (k - 2) * 0.3, 0.8, P, 1);
      rows.slice().reverse().forEach(([yy, k], ri) => { for (let i = 0; i < k; i++) sac(16 + (i - (k - 1) / 2) * (sr * 2 + 1), yy, sr, P, st >= 3 && (i + ri) % 2 === 0); });
      const topRow = rows[rows.length - 1]; for (let k = 0; k <= st; k++) { const sx = 16 + (k - st / 2) * 4, h = 3 + (k % 2) * 2 + st; px(sx, topRow[0] - sr - h, 1, h, P[3]); px(sx - 1, topRow[0] - sr - h - 1, 3, 2, P[4]); }
      if (st >= 4) { sac(16, 20, 6, P, false); px(15, 19, 3, 3, P[4]); px(16, 20, 1, 1, '#ffffff'); }
    } else if (sl.main === 'dusk') {      // 속삭이는 것: 얼굴 없는 장막, 입과 가면
      const top = [0, 9, 7, 5, 4][st], bw = 4 + st * 2; B = { cx: 16, cy: (top + 28) / 2, R: bw, top, bot: 28 };
      if (st >= 3) { tent(16 - bw + 1, top + 8, 14, -0.45, 0.8, P, 1); tent(16 + bw - 2, top + 8, 14, 0.45, 0.8, P, 1); }
      for (let y = top; y <= 28; y++) { const f = (y - top) / (28 - top), hw = Math.round(3 + (bw - 3) * Math.pow(f, 0.7)), rag = y > 25 ? ((y + hw) % 2) : 0; px(16 - hw - 1, y, hw * 2 + 3, 1, P[0]); if (!(y === 28)) { px(16 - hw + rag, y, hw * 2 + 1 - rag * 2, 1, P[1]); px(16 + Math.round(hw * 0.4), y, Math.max(1, hw - Math.round(hw * 0.4)), 1, P[3]); } }
      if (st >= 4) for (let k = 0; k < 5; k++) tent(16 - bw + 1 + k * (bw * 2 - 2) / 4, 27, 5, (k - 2) * 0.25, 0.7, P, 2);
      disc(16, top + 4, 3, 3, DK); px(15, top + 1, 3, 1, P[2]);
      for (let k = 0; k < 1 + st * 2; k++) { const yy = top + 9 + ((k * 5) % Math.max(1, 17 - top)), f = (yy - top) / (28 - top), hw = 3 + (bw - 3) * Math.pow(f, 0.7); if (yy < 26) mouth(Math.round(16 + (((k * 7) % 9) / 8 - 0.5) * (hw * 2 - 5)), yy, 3 + (k % 2), P); }
      if (st >= 2) mask(14, top + 2, 4);
      if (st >= 3) { mask(16 - bw - 4, top + 3, 4); mask(16 + bw + 1, top + 5, 4); }
      if (st >= 4) { mask(4, 2, 3); mask(25, 1, 3); mask(15, 0, 3); }
    } else {                               // 씹는 것: 몸이 곧 입
      const cy = 17; B = { cx: 16, cy, R, top: cy - R, bot: cy + R };
      if (st >= 4) for (let k = 0; k < 10; k++) { const a = k * 0.628; tent(16 + Math.cos(a) * (R + 1), cy + Math.sin(a) * (R + 1) - 2, 4, Math.cos(a) * 0.9, 0.3, P, 1); }
      blob(16, cy, R, R, P);
      if (st === 1) maw(16, cy + 1, R - 2, 2, P);
      if (st === 2) { maw(16, cy + 1, R - 2, 3, P); mouth(16 - R + 1, cy - R + 3, 3, P); mouth(16 + R - 4, cy - R + 3, 3, P); }
      if (st === 3) { maw(16, cy, 4, R - 2, P, true); mouth(16 - R + 1, cy - 2, 3, P); mouth(16 + R - 4, cy + 2, 3, P); mouth(16 - R + 2, cy + 4, 3, P); }
      if (st >= 4) { disc(16, cy, R - 2, R - 2, DK); for (let a = 0; a < 6.283; a += 0.42) px(16 + Math.cos(a) * (R - 3), cy + Math.sin(a) * (R - 3), 1, 2, WH); disc(16, cy, R - 5, R - 5, P[3]); disc(16, cy, R - 7, R - 7, DK); for (let a = 0.2; a < 6.283; a += 0.7) px(16 + Math.cos(a) * (R - 7), cy + Math.sin(a) * (R - 7), 1, 1, WH); px(15, cy - 1, 3, 3, '#c8303a'); px(16, cy, 1, 1, '#ff9a8a'); }
    }
    // 부 징조: 다른 색의 기관이 덧붙는다
    if (st >= 2 && sl.sub) {
      const k = st - 1;
      if (sl.sub === 'abyss') for (let i = 0; i < 2 + k; i++) tent(B.cx - B.R + 2 + i * ((B.R * 2 - 4) / (1 + k)), Math.min(26, B.bot - 2), 31 - Math.min(26, B.bot - 2), (i - (1 + k) / 2) * 0.3, 1, Q, 2);
      if (sl.sub === 'nebula') { ring(B.cx, B.top + 1, B.R + 1, 2, Q[4]); for (let i = 0; i < 1 + k; i++) pit(B.cx - B.R + 1 + i * ((B.R * 2 - 2) / Math.max(1, k)), Math.max(2, B.top - 3 - (i % 2) * 2), Q[1]); }
      if (sl.sub === 'brood') for (let i = 0; i < 2 + k; i++) sac(B.cx + (i % 2 ? 1 : -1) * (B.R - 1 - Math.floor(i / 2) * 2), B.top + 2 + Math.floor(i / 2) * 3, 2 + (i < 2 ? 1 : 0), Q, i < 2);
      if (sl.sub === 'dusk') { mask(B.cx - 2, B.cy - 3, 4); if (k >= 2) mask(B.cx + B.R - 3, B.cy + 1, 3); if (k >= 3) mask(B.cx - B.R, B.cy + 2, 3); }
      if (sl.sub === 'hunger') { maw(B.cx, Math.min(27, B.cy + B.R * 0.45), Math.max(3, B.R * 0.5), 2, Q); if (k >= 2) mouth(B.cx - B.R + 1, B.cy - 2, 3, Q); if (k >= 3) mouth(B.cx + B.R - 4, B.cy - 3, 3, Q); }
    }
  }
  // 변이: 눈에 보이는 부위
  (sl.muts || []).forEach(m => {
    if (m === 'tentacle') { tent(B.cx - B.R - 1, B.cy - 1, 11, -0.35, 1, PAL.abyss, 2); tent(B.cx + B.R, B.cy - 1, 11, 0.35, 1, PAL.abyss, 2); }
    if (m === 'gills') for (let g = 0; g < 3; g++) { px(B.cx - B.R + 1, B.cy + g * 2, 3, 1, '#081a2a'); px(B.cx + B.R - 3, B.cy + g * 2, 3, 1, '#081a2a'); }
    if (m === 'thirdeye') { px(B.cx - 2, B.top + 2, 5, 3, '#1b1d2a'); px(B.cx - 1, B.top + 3, 3, 1, '#fff3a0'); px(B.cx, B.top + 3, 1, 1, '#c8303a'); }
    if (m === 'ring') ring(B.cx, Math.max(1, B.top - 2), 5, 1, '#fff3a0');
    if (m === 'spore') [[-1.3, -0.6], [1.2, -0.9], [-1.5, 0.4], [1.5, 0.2], [0.3, -1.4]].forEach(([a, b]) => px(B.cx + a * B.R, B.cy + b * B.R, 1, 1, '#d0f08a'));
    if (m === 'mouth') mouth(B.cx + 1, Math.min(28, B.cy + B.R - 3), 4, P);
    if (m === 'maskm') mask(B.cx - B.R, B.cy - 4, 4);
    if (m === 'whisper') for (let i = 0; i < 4; i++) px(B.cx + B.R + 1 + i, B.top + 1 - i + (i % 2), 1, 1, '#ffe0a0');
    if (m === 'teeth') for (let i = -B.R + 2; i < B.R - 1; i += 2) px(B.cx + i, B.cy + B.R - 1, 1, 2, WH);
    if (m === 'steelgut') { px(B.cx - 2, B.cy + 1, 5, 3, '#6a6278'); px(B.cx - 1, B.cy + 1, 3, 1, '#d0d0d8'); }
  });
  return (cv[key] = c);
}
function kinCanvas(kind, evo) {
  const b = spriteCanvas(KINSPR[kind][0], KINSPR[kind][1]); if (!evo) return b; const key = 'evo2:' + kind; if (cv[key]) return cv[key];
  // 진화한 권속: 몸이 붉게 물들고, 뿔과 가시가 돋고, 한 뼘 더 크게 그려진다
  const c = document.createElement('canvas'); c.width = c.height = 20; const x = c.getContext('2d'); x.drawImage(b, 2, 4);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(170, 20, 50, 0.32)'; x.fillRect(0, 0, 20, 20); x.globalCompositeOperation = 'source-over';
  const put = (list, col) => list.forEach(([a, d]) => { x.fillStyle = col; x.fillRect(a, d, 1, 1); });
  put([[5, 4], [4, 3], [4, 2], [3, 1], [3, 0], [14, 4], [15, 3], [15, 2], [16, 1], [16, 0]], '#f2e9c9'); put([[5, 3], [14, 3]], '#1b1d2a');
  put([[1, 12], [0, 11], [0, 10], [18, 12], [19, 11], [19, 10], [1, 16], [18, 16]], '#f2e9c9'); put([[8, 3], [9, 2], [10, 2], [11, 3]], '#e8c030'); put([[9, 3], [10, 3]], '#ff5040');
  return (cv[key] = c);
}
const toImg = (c, key, size, alt) => `<img class="px" src="${urls[key] || (urls[key] = c.toDataURL())}" width="${size}" height="${size}" alt="${esc(alt || '')}">`;
const kinImg = (kind, size, evo) => toImg(kinCanvas(kind, evo), (evo ? 'evo2:' : 'kin:') + kind, size, NEST.KIN[kind].name);
const invImg = (kind, size) => toImg(invCanvas(kind), 'inv:' + kind, size, NEST.INV[kind].name);
const slimeImg = (sl, size, alt) => toImg(slimeCanvas(sl), 'sl2:' + (sl.main || 'base') + ':' + (sl.sub || '') + ':' + sl.stage + ':' + (sl.muts || []).join(','), size, alt || '본체');
const echoImg = size => toImg(spriteCanvas('slime', 'echo'), 'echo', size, '잔향');

// ---------- 소리 ----------
let AC = null;
function sfx(kind) {
  if (!META.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const seq = { hit: [[150, .05, 'square']], trap: [[320, .05, 'sawtooth'], [110, .09, 'sawtooth']], coin: [[880, .05, 'square'], [1320, .08, 'square']], up: [[523, .07, 'square'], [659, .07, 'square'], [784, .07, 'square'], [1047, .14, 'square']], down: [[392, .09, 'square'], [311, .09, 'square'], [233, .18, 'square']], die: [[200, .06, 'triangle'], [90, .12, 'triangle']], evo: [[392, .1, 'square'], [523, .1, 'square'], [659, .1, 'square'], [784, .1, 'square'], [1047, .3, 'square']], step: [[90, .03, 'triangle']], click: [[660, .03, 'square']], talk: [[440, .02, 'square']], mad: [[700, .05, 'sine'], [520, .05, 'sine'], [760, .1, 'sine']], spell: [[220, .08, 'sine'], [440, .08, 'sine'], [880, .2, 'sine']], dig: [[120, .04, 'sawtooth'], [80, .06, 'sawtooth']], slide: [[300, .05, 'triangle'], [200, .08, 'triangle']] }[kind];
    if (!seq) return;
    let t = AC.currentTime;
    for (const [f, d, type] of seq) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); t += d * 0.9; }
  } catch (e) { /* 소리를 못 내는 환경 */ }
}
