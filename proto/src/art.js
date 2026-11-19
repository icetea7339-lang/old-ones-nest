// 옛 것의 둥지 — 화면 1/3: 공통 도구, 저장, 도트, 소리
// (build.sh가 art.js + stage.js + ui.js를 한 함수 안에 이어 붙인다)
const $ = id => document.getElementById(id);
const esc = s => NEST.fj(String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
const ASPCOL = { abyss: '#3fb8d0', nebula: '#b08fff', brood: '#7fd04f', dusk: '#f0a04a', hunger: '#f2696f' };
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
function slimeCanvas(sl, frame) {
  const fr = (frame || 0) % 4, ph = fr * 1.57, key = 'sl4:' + (sl.origin || 'drop') + ':' + (sl.body || '') + ':' + (sl.main || 'base') + ':' + (sl.sub || '') + ':' + sl.stage + ':' + (sl.muts || []).join(',') + ':' + fr; if (cv[key]) return cv[key];
  const P = PAL[sl.main] || PAL.base, Q = (sl.sub && PAL[sl.sub]) || P, st = sl.main ? Math.max(1, sl.stage) : 0, DK = '#1a0508', WH = '#f5f5f5';
  const NEW = FORMS[st ? (sl.body || sl.main) + st : 'base'], N = NEW ? [32, 32, 40, 48, 52][st] : 32;   // 새 모습은 허물을 벗을 때마다 캔버스가 커진다
  const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
  const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w || 1, h || 1); };
  const disc = (cx, cy, rx, ry, col) => { x.fillStyle = col; rx = Math.max(0.5, rx); ry = Math.max(0.5, ry); for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const q = 1 - (j * j) / (ry * ry); if (q < 0) continue; const w = Math.round(rx * Math.sqrt(q)); x.fillRect(Math.round(cx) - w, Math.round(cy) + j, w * 2 + 1, 1); } };
  const blob = (cx, cy, rx, ry, p) => { disc(cx, cy, rx + 1, ry + 1, p[0]); disc(cx, cy, rx, ry, p[3]); disc(cx - rx * 0.12, cy - ry * 0.14, rx * 0.86, ry * 0.84, p[1]); disc(cx - rx * 0.4, cy - ry * 0.45, rx * 0.26, ry * 0.2, p[2]); };
  const tent = (x0, y0, len, drift, amp, p, w) => { for (let pass = 0; pass < 2; pass++) for (let i = 0; i < len; i++) { const xx = x0 + drift * i + Math.sin(i * 0.8 + x0 + ph) * amp * (0.4 + i / len), ww = Math.max(1, Math.round((w || 2) * (1 - i / len * 0.6))); if (pass === 0) px(xx - 1, y0 + i, ww + 2, 1, p[0]); else px(xx, y0 + i, ww, 1, i % 4 === 3 ? p[2] : p[1]); } };
  const maw = (cx, cy, w, h, p, vert) => { disc(cx, cy, w + 1, h + 1, p[0]); disc(cx, cy, w, h, DK); if (vert) { for (let j = -h + 1; j < h; j += 2) { const d = Math.round(w * Math.sqrt(Math.max(0, 1 - (j * j) / (h * h)))); px(cx - d, cy + j, Math.min(2, Math.max(1, d)), 1, WH); px(cx + d - Math.min(1, Math.max(0, d - 1)), cy + j + 1, Math.min(2, Math.max(1, d)), 1, WH); } px(cx, cy - 1, 1, 3, '#c8303a'); } else { for (let i = -w + 1 + (fr % 2); i < w; i += 2) { const d = Math.round(h * Math.sqrt(Math.max(0, 1 - (i * i) / (w * w)))); px(cx + i, cy - d, 1, Math.min(2, Math.max(1, d)), WH); px(cx + i + 1, cy + d - Math.min(1, Math.max(0, d - 1)), 1, Math.min(2, Math.max(1, d)), WH); } if (h >= 3) px(cx - 1, cy, 3, 1, '#c8303a'); } };
  const pit = (a, b, col) => { const tw = (Math.round(a * 3 + b) + fr) % 4 === 0; px(a - 1 - (tw ? 1 : 0), b, 3 + (tw ? 2 : 0), 1, tw ? '#ffffff' : col); px(a, b - 1 - (tw ? 1 : 0), 1, 3 + (tw ? 2 : 0), tw ? '#ffffff' : col); px(a, b, 1, 1, '#ffffff'); };
  const ring = (cx, cy, rx, ry, col, half) => { x.fillStyle = col; for (let a = half ? 0 : -3.1416; a < 3.1416; a += 0.1) x.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); };
  const mask = (a, b, s) => { px(a - 1, b - 1, s + 2, s + 3, '#1b1d2a'); px(a, b, s, s + 1, WH); px(a, b, s, 1, '#c8c8d0'); px(a + 1, b + 2, 1, 1, '#1b1d2a'); px(a + s - 2, b + 2, 1, 1, '#1b1d2a'); px(a + 1, b + s - 1, s - 2, 1, '#7a121c'); };
  const mouth = (a, b, w, p) => { const op = (Math.round(a + b) + fr) % 3 ? 2 : 1; px(a - 1, b - 1, w + 2, op + 2, p[0]); px(a, b, w, op, DK); for (let i = 0; i < w; i += 2) px(a + i, b + (op > 1 && i % 4 ? 1 : 0), 1, 1, WH); };
  const sac = (a, b, r, p, seed) => { const pu = (Math.round(a) + fr) % 4 === 0 ? 0.7 : 0; blob(a, b, r + pu, r + pu, p); if (seed) px(a, b + (fr % 2), 1, 2, p[0]); };
  let B = { cx: 16, cy: 24, R: 4, top: 20, bot: 27 };
  if (NEW) { const K = Sculpt(N); B = NEW(K, st, P, Q, fr); if (st >= 2 && sl.sub) subOrgan(K, sl.sub, Q, B, st, fr); x.drawImage(K.canvas(), 0, 0); }
  else if (st === 0) { blob(16, 25, 5, 3, P); px(11, 28, 2, 2, P[1]); px(21, 28, 1, 2, P[3]); px(14, 21 - (fr % 2), 1, 2, P[1]); px(14, 20 - (fr % 2), 1, 1, P[2]); px(11 + fr, 29, 1, 1, P[2]); }
  else {
    const R = [0, 5, 7, 9, 11][st];
    if (sl.body === 'mix') {              // 뒤엉킨 것: 먹은 것들이 제각각 자라 한 덩어리가 됐다
      const cy = [0, 19, 18, 17, 16][st], O2 = ['abyss', 'hunger', 'brood', 'dusk', 'nebula'].map(a => PAL[a]).filter(q => q !== P); B = { cx: 16, cy, R, top: cy - R, bot: Math.min(30, cy + R) };
      tent(16 - R + 1, cy + 2, 8 + st * 2, -0.5, 1.2, O2[0], 2); tent(16 + R - 3, cy + 1, 6 + st * 2, 0.4, 1, O2[2], 2);
      if (st >= 3) { tent(14, cy + R - 2, 31 - (cy + R - 2), 0.1, 1.4, O2[1], 2); tent(16 - R - 2, cy - 2, 9, -0.7, 0.8, O2[3], 1); }
      blob(16 - R * 0.35, cy + 1, R * 0.8, R * 0.75, P); blob(16 + R * 0.45, cy - R * 0.25, R * 0.6, R * 0.6, O2[0]); blob(16 + R * 0.1, cy + R * 0.45, R * 0.55, R * 0.45, O2[1]);
      if (st >= 2) blob(16 - R * 0.7, cy - R * 0.55, R * 0.4, R * 0.4, O2[2]); if (st >= 3) blob(16 + R * 0.9, cy + R * 0.4, R * 0.35, R * 0.35, O2[3]);
      mouth(Math.round(16 - R * 0.6), cy + 1, 3 + (st > 2 ? 1 : 0), P); if (st >= 2) mouth(Math.round(16 + R * 0.3), Math.round(cy - R * 0.4), 3, O2[0]); pit(16 + R * 0.1, cy + R * 0.5, O2[1][2]);
      px(16 + R * 0.5, cy - R - 2, 1, 3 + st, O2[2][3]); px(16 + R * 0.5 - 1, cy - R - 3, 3, 2, O2[2][4]);
      if (st >= 4) { mask(16 - R - 1, cy - R + 1, 4); ring(16 + R * 0.45, cy - R * 0.25, R * 0.6 + 2, 2, O2[3][4]); }
    } else if (sl.body === 'hive') {      // 여럿인 것: 작은 몸 여럿이 빈 가운데를 돌며 하나처럼 군다
      const cy = [0, 18, 17, 16, 16][st], n = 4 + st * 2, rr = [0, 6, 8, 10, 12][st], rot = fr * (6.283 / n) / 4; B = { cx: 16, cy, R: rr, top: Math.round(cy - rr * 0.7 - 2), bot: Math.min(30, Math.round(cy + rr * 0.7 + 2)) };
      const ring2 = []; for (let k = 0; k < n; k++) { const a = k * 6.283 / n + rot; ring2.push([Math.sin(a), 16 + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, k]); }
      ring2.forEach(([s0, bx, by]) => { for (let i = 1; i < 5; i++) px(16 + (bx - 16) * i / 5, cy + (by - cy) * i / 5, 1, 1, i % 2 ? P[3] : P[0]); });
      disc(16, cy, 2 + (st > 2 ? 1 : 0), 2 + (st > 2 ? 1 : 0), P[0]); px(16, cy, 1, 1, P[4]);
      ring2.sort((u, v) => u[0] - v[0]).forEach(([s0, bx, by, k]) => { const r = 2 + (k % 3 === 0 ? 1 : 0) + (st >= 3 && k % 4 === 0 ? 1 : 0); blob(bx, by, r, r - 0.5, P); px(bx, by - r - 1, 1, 1, P[1]); if (k % 2) px(bx - 1, by + 1, 2, 1, P[0]); });
      if (st >= 4) { blob(16, cy, 4, 3.5, P); mouth(14, cy, 4, P); }
    } else if (sl.body === 'idol') {      // 받들린 것: 받침 위에 선 매끈한 돌, 머리 위의 테, 발치의 촛불
      const top = [0, 12, 9, 6, 4][st], hw = [0, 3, 4, 5, 6][st], bs = 27; B = { cx: 16, cy: Math.round((top + bs) / 2), R: hw + 1, top, bot: 30 };
      px(16 - hw - 4, bs + 1, hw * 2 + 9, 3, P[0]); px(16 - hw - 3, bs + 1, hw * 2 + 7, 1, P[3]); px(16 - hw - 2, bs - 1, hw * 2 + 5, 2, P[0]); px(16 - hw - 1, bs - 1, hw * 2 + 3, 1, P[1]);
      for (let y = top; y <= bs - 2; y++) { const f = (y - top) / (bs - 2 - top), w = Math.round(hw * (0.55 + 0.45 * Math.min(1, f * 2.2))); px(16 - w - 1, y, w * 2 + 3, 1, P[0]); px(16 - w, y, w * 2 + 1, 1, P[1]); px(16 + Math.round(w * 0.3), y, Math.max(1, w - Math.round(w * 0.3) + 1), 1, P[3]); px(16 - w, y, 1, 1, P[2]); }
      px(15, top - 1, 3, 1, P[0]);
      for (let k = 0; k < st + 1; k++) { const yy = top + 4 + k * 4; if (yy < bs - 4) { px(14, yy, 5, 1, P[0]); px(15, yy + 1, 3, 1, P[4]); } }
      ring(16, Math.max(1, top - 2), hw + 2, 1.5, '#fff3a0'); if (st >= 3) ring(16, Math.max(1, top - 2), hw + 4, 2.5, P[4]);
      for (let k = 0; k < 1 + st; k++) { const s2 = k % 2 ? 1 : -1, xx = 16 + s2 * (hw + 3 + Math.floor(k / 2) * 3); px(xx, bs - 2, 1, 3, '#e8dcc0'); px(xx, bs - 3 - ((fr + k) % 2), 1, 1 + ((fr + k) % 2), '#ffd23a'); }
      if (st >= 2) { px(16 - hw - 3, top + 6, 2, 1, P[0]); px(16 - hw - 4, top + 3, 1, 4, P[1]); px(16 + hw + 2, top + 6, 2, 1, P[0]); px(16 + hw + 4, top + 3, 1, 4, P[1]); }
      if (st >= 4) [[4, 6], [27, 8], [6, 16], [26, 17]].forEach(([a, b2], k) => { px(a, b2 + ((fr + k) % 2), 2, 2, P[0]); px(a, b2 + ((fr + k) % 2), 1, 1, P[2]); });
    } else if (sl.main === 'abyss') {            // 젖은 것: 갓 아래로 늘어지는 다리들
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
    if (m === 'mouth') mouth(B.cx + 1, Math.min((N - 4), B.cy + B.R - 3), 4, P);
    if (m === 'maskm') mask(B.cx - B.R, B.cy - 4, 4);
    if (m === 'whisper') for (let i = 0; i < 4; i++) px(B.cx + B.R + 1 + i, B.top + 1 - i + (i % 2), 1, 1, '#ffe0a0');
    if (m === 'teeth') for (let i = -B.R + 2; i < B.R - 1; i += 2) px(B.cx + i, B.cy + B.R - 1, 1, 2, WH);
    if (m === 'steelgut') { px(B.cx - 2, B.cy + 1, 5, 3, '#6a6278'); px(B.cx - 1, B.cy + 1, 3, 1, '#d0d0d8'); }
  });
  // 태생: 어떤 모습으로 자라도 남는 것
  const og = sl.origin || 'drop';
  if (og === 'shell') {          // 깨진 알껍데기를 뒤집어썼다
    const SH = ['#2a261c', '#efe6d0', '#ffffff', '#b8ad92'], w = Math.max(3, Math.round(B.R * 0.95)), hh = Math.max(2, Math.round(B.R * 0.6)), y0 = Math.max(1, B.top - 1);
    for (let dx = -w; dx <= w; dx++) { const h = Math.max(1, Math.round(hh * Math.sqrt(Math.max(0, 1 - (dx * dx) / (w * w + 1))))) + ((dx + 40) % 3 === 0 ? 1 : 0); const yt = y0 + (hh + 1 - h) - 2 + ((dx + 40) % 3 === 0 ? 0 : 0), hb = h + ((dx + 41) % 4 === 0 ? 1 : 0); px(B.cx + dx, yt - 1, 1, hb + 2, SH[0]); px(B.cx + dx, yt, 1, hb, dx > w * 0.35 ? SH[3] : SH[1]); }
    px(B.cx - w - 1, y0 + hh - 2, 1, 2, SH[0]); px(B.cx + w + 1, y0 + hh - 2, 1, 2, SH[0]); px(B.cx - Math.round(w * 0.45), y0 + Math.round(hh * 0.3) - 1, 2, 1, SH[2]);
    for (let k = 0; k < hh; k++) px(B.cx + 1 + (k % 2), y0 - 1 + k, 1, 1, SH[0]);
    const gy = Math.min((N - 2), B.bot + 1); px(B.cx + w + 2, gy - 1, 4, 3, SH[0]); px(B.cx + w + 3, gy - 1, 2, 2, SH[1]); px(B.cx - w - 5, gy, 3, 2, SH[0]); px(B.cx - w - 4, gy, 1, 1, SH[3]);
  }
  if (og === 'root') {           // 뿌리부터 뻗었다
    const RT = ['#1e140a', '#6b4a2a', '#b08a50'], by = Math.min((N - 4), B.bot), n = 3 + Math.min(3, st);
    for (let k = 0; k < n; k++) { const f = n === 1 ? 0 : k / (n - 1) - 0.5; let xx = B.cx + f * (B.R * 2 - 2), yy = by - 1; for (let i = 0; i < 6 + (k % 2) * 2 && yy < N; i++) { px(xx - 1, yy, 3, 1, RT[0]); px(xx, yy, 1, 1, i % 3 === 2 ? RT[2] : RT[1]); xx += f * 2.2 + (((i + k) % 2) ? 0.7 : -0.7); if (!(i % 3 === 2 && Math.abs(f) > 0.2)) yy++; } }
    for (let i = 0; i < 3 + st; i++) { const yy = Math.min((N - 1), by + 1 + (i % 2)); px(B.cx - B.R - 1 - i * 2, yy, 3, 1, RT[0]); px(B.cx - B.R - 1 - i * 2, yy, 2, 1, RT[1]); px(B.cx + B.R + i * 2 - 1, yy, 3, 1, RT[0]); px(B.cx + B.R + i * 2, yy, 2, 1, RT[1]); }
    for (let i = 0; i < 1 + Math.min(3, st); i++) { px(B.cx - B.R - 2, B.cy + 2 - i * 3, 2, 3, RT[0]); px(B.cx - B.R - 1, B.cy + 2 - i * 3, 1, 3, RT[1]); px(B.cx - B.R - 3, B.cy + 1 - i * 3, 1, 1, RT[2]); px(B.cx + B.R + 1, B.cy + 3 - i * 3, 2, 3, RT[0]); px(B.cx + B.R + 1, B.cy + 3 - i * 3, 1, 3, RT[1]); px(B.cx + B.R + 3, B.cy + 2 - i * 3, 1, 1, RT[2]); }
  }
  if (og === 'maw') {            // 입부터 생겼다
    const mw = Math.max(2, Math.round(B.R * 0.6)), my = Math.min((N - 6), Math.round(B.cy + B.R * 0.2)); maw(B.cx, my, mw, st >= 3 ? 3 : 2, P);
    const tl = 3 + Math.min(4, st); for (let i = 0; i < tl; i++) { const tx = B.cx + Math.round(Math.sin(i * 0.9 + ph) * (i / tl) * 2); px(tx - 1, my + 1 + i, 3, 1, '#5a0c14'); px(tx, my + 1 + i, 1, 1, i === tl - 1 ? '#ff9a8a' : '#e8505a'); }
    px(B.cx - mw, my + 2 + (fr % 2), 1, 2, '#bfe8ff');
  }
  if (og === 'lamp') {           // 등불을 들었다
    const LG = ['#3a2a10', '#ffd23a', '#fff3a0'], sx = B.cx + Math.max(1, Math.round(B.R * 0.35)), ty = Math.max(3, B.top - 4 - Math.min(2, st));
    for (let y = ty + 1; y <= B.top + 1; y++) px(sx - 1 + (y % 3 === 0 ? 1 : 0), y, 2, 1, P[0]);
    const ox = sx + 2, oy = ty, lr = st >= 3 ? 2 : 1; disc(ox, oy, lr + 1, lr + 1, LG[0]); disc(ox, oy, lr, lr, LG[1]); px(ox, oy, 1, 1, '#ffffff'); if (lr > 1) px(ox - 1, oy - 1, 1, 1, LG[2]);
    if (fr % 2 === 0) { px(ox - 4, oy, 1, 1, LG[2]); px(ox + 4, oy, 1, 1, LG[2]); px(ox, oy - 3, 1, 1, LG[2]); px(ox, oy + 4, 1, 1, LG[1]); } else { px(ox - 3, oy - 2, 1, 1, LG[2]); px(ox + 3, oy + 2, 1, 1, LG[2]); px(ox + 3, oy - 2, 1, 1, LG[2]); px(ox - 3, oy + 3, 1, 1, LG[1]); }
  }
  if (og === 'coin') {           // 금화째 굳었다
    const CN = ['#5a3c06', '#e8c030', '#fff3a0'], coin = (a, b, g) => { px(a - 1, b - 1, 4, 4, CN[0]); px(a, b, 2, 2, CN[1]); px(a, b, 1, 1, g ? '#ffffff' : CN[2]); };
    const by = Math.min((N - 2), B.bot + 1), sp = 2 + Math.min(3, st); for (let k = -sp; k <= sp; k++) coin(B.cx + k * 3, by - (Math.abs(k) % 2), (k + fr + 8) % 4 === 0);
    for (let k = 0; k < 2 + st; k++) { const a = k * 2.2 + 0.6, d = B.R * (0.3 + (k % 3) * 0.22); coin(Math.round(B.cx + Math.cos(a) * d), Math.round(Math.min((N - 5), B.cy + Math.sin(a) * d * 0.8)), (k + fr) % 4 === 0); }
  }
  if (og === 'thorn') {          // 온몸에 가시가 돋았다
    const TH = ['#1e1424', '#d8cdb8', '#ffffff'], n = 7 + st * 2;
    for (let k = 0; k < n; k++) { const a = -3.3 + k * (3.5 / (n - 1)) + (k % 2 ? 0.08 : -0.08), len = 3 + (k % 3 === 0 ? 2 : 0) + Math.min(2, st), c0 = Math.cos(a), s0 = Math.sin(a) * 0.95;
      for (let i = 0; i <= len; i++) { const xx = B.cx + c0 * (B.R + i), yy = B.cy + s0 * (B.R + i); if (yy < 0 || yy > (N - 1)) continue; if (i < len) px(xx - 1, yy, 3, 1, TH[0]); px(xx, yy, 1, 1, i >= len - 1 ? TH[2] : TH[1]); } }
    for (let k = 0; k < 2 + st; k++) { const xx = B.cx - B.R + 2 + k * ((B.R * 2 - 4) / (1 + st)), yy = Math.round(B.cy - B.R * 0.3 + (k % 2) * 3); px(xx - 1, yy - 1, 3, 3, TH[0]); px(xx, yy - 1, 1, 2, TH[1]); px(xx, yy - 2 + (fr % 2 ? 0 : 0), 1, 1, TH[2]); }
  }
  if (og === 'chain') {          // 포로의 사슬이 감겼다
    const CH = ['#22242e', '#8a90a8', '#e0e4f0'], link = (a, b, k) => { px(a - 1, b - 1, 3, 3, CH[0]); px(a, b, k % 2 ? 2 : 1, k % 2 ? 1 : 2, k % 3 === 0 ? CH[2] : CH[1]); };
    for (let k = 0, n = B.R * 2 + 2; k <= n; k += 2) { link(Math.round(B.cx - B.R - 1 + k), Math.round(B.cy - B.R * 0.5 + k * 0.55), k / 2); if (st >= 2) link(Math.round(B.cx + B.R + 1 - k), Math.round(B.cy - B.R * 0.2 + k * 0.4), k / 2 + 1); }
    const gy = Math.min((N - 2), B.bot + 1); for (let k = 0; k < 4 + st; k++) link(B.cx + B.R + 1 + k * 2, gy - (k % 2), k);
    const sx = Math.min((N - 3), B.cx + B.R + 3 + (4 + st) * 2); px(sx - 2, gy - 3, 5, 5, CH[0]); px(sx - 1, gy - 2, 3, 3, CH[1]); px(sx, gy - 1, 1, 1, CH[0]);
    px(B.cx - B.R - 2, B.cy + 1, 1, 3 + (fr % 2), CH[1]); px(B.cx - B.R - 3, B.cy + 4 + (fr % 2), 3, 2, CH[0]); px(B.cx - B.R - 2, B.cy + 4 + (fr % 2), 1, 1, CH[2]);
  }
  if (og === 'shade') {          // 몸보다 큰 그림자를 끈다
    const SD = ['#07050c', '#2a1840', '#6a3a9a'], w = B.R + 5 + st, gy = Math.min((N - 2), B.bot + 1);
    for (let dx = -w; dx <= w; dx++) { const h = Math.abs(dx) > B.R + 1 ? 2 : 1; px(B.cx + dx + ((fr % 2) && Math.abs(dx) === w ? 1 : 0), gy - h + 1, 1, h, SD[0]); if ((dx + 40) % 5 === 0) px(B.cx + dx, gy - h, 1, 1, SD[1]); }
    for (const side of [-1, 1]) for (let k = 0; k < 6 + st * 2; k++) { const xx = B.cx + side * (B.R + 1 + k), top = Math.round(B.cy - B.R * 0.6 - Math.sin(k / (5 + st * 2) * 3.14) * (4 + st) + k * 0.4), bot = Math.round(B.cy + 2 - k * 0.2 + ((k + fr) % 3 === 0 ? 2 : 0)); if (xx < 0 || xx > (N - 1)) continue; px(xx, top, 1, Math.max(1, bot - top), SD[0]); px(xx, top, 1, 1, k % 2 ? SD[2] : SD[1]); if (k % 3 === 2) px(xx, bot, 1, 2, SD[1]); }
  }
  return (cv[key] = c);
}
// 권속: 종류마다 다른 몸. 손으로 찍은 그림이 없는 종류는 여기서 16×16에 그린다. q = (x, y, 너비, 높이, 색), p = [윤곽, 몸, 밝은 곳, 그늘, 포인트]
const BONE = '#f2e9c9', STEEL = '#a0a8c0', GOLD = '#e8c030', RED = '#c8303a', WHT = '#f5f5f5', INK = '#1a0508', WOOD = '#7a5a3a';
const KDRAW = {
  scale(q, p) { q(7, 0, 1, 4, p[4]); q(6, 1, 1, 3, p[4]); q(5, 3, 6, 4, p[0]); q(6, 4, 4, 3, p[1]); q(7, 5, 1, 1, WHT); q(9, 5, 1, 1, WHT); q(11, 4, 2, 1, p[4]); q(4, 7, 8, 6, p[0]); q(5, 8, 6, 4, p[1]); q(6, 9, 1, 1, p[2]); q(8, 10, 1, 1, p[2]); q(7, 11, 1, 1, p[3]); q(1, 7, 4, 6, p[0]); q(2, 8, 2, 4, p[4]); q(12, 10, 2, 1, p[1]); q(13, 9, 1, 1, p[1]); q(5, 13, 2, 2, p[0]); q(9, 13, 2, 2, p[0]); },
  scribe(q, p) { q(7, 0, 2, 1, p[4]); q(7, 1, 2, 1, WHT); q(6, 2, 4, 4, p[0]); q(7, 3, 2, 2, p[1]); q(7, 4, 2, 1, p[0]); q(6, 6, 4, 8, p[0]); q(7, 6, 2, 8, p[3]); q(7, 7, 1, 6, p[1]); q(1, 8, 5, 4, p[0]); q(2, 8, 3, 3, BONE); q(3, 8, 1, 4, p[0]); q(2, 9, 1, 1, p[3]); q(4, 10, 1, 1, p[3]); q(5, 14, 6, 1, p[0]); q(11, 5, 1, 6, WHT); q(12, 4, 1, 2, WHT); },
  mask(q, p) { q(5, 2, 6, 7, p[0]); q(6, 3, 4, 5, WHT); q(7, 4, 1, 1, p[0]); q(9, 4, 1, 1, p[0]); q(7, 6, 3, 1, '#7a121c'); q(7, 9, 2, 5, p[0]); q(6, 10, 4, 3, p[3]); q(5, 14, 6, 1, p[0]); q(1, 5, 3, 3, WHT); q(2, 6, 1, 1, p[0]); q(12, 7, 3, 3, WHT); q(13, 8, 1, 1, p[0]); q(4, 9, 1, 3, p[4]); q(11, 10, 1, 3, p[4]); },
  netter(q, p) { q(12, 1, 1, 13, WOOD); for (let k = 0; k < 3; k++) { q(8, 1 + k * 2, 4, 1, STEEL); q(8 + k * 2, 1, 1, 5, STEEL); } q(3, 5, 5, 4, p[0]); q(4, 6, 3, 2, p[1]); q(5, 6, 1, 1, WHT); q(3, 9, 7, 4, p[0]); q(4, 9, 5, 3, p[1]); q(5, 10, 3, 1, p[2]); q(9, 8, 3, 1, p[1]); q(4, 13, 2, 2, p[0]); q(7, 13, 2, 2, p[0]); },
  warden(q, p) { q(5, 0, 6, 5, p[0]); q(6, 1, 4, 3, STEEL); q(7, 1, 1, 3, p[0]); q(9, 1, 1, 3, p[0]); q(2, 5, 12, 7, p[0]); q(3, 6, 10, 5, p[1]); q(4, 6, 3, 2, p[2]); q(3, 10, 10, 1, p[0]); q(0, 5, 2, 7, WOOD); q(0, 4, 2, 1, p[0]); q(11, 6, 4, 4, GOLD); q(12, 7, 2, 2, p[0]); q(12, 10, 1, 5, GOLD); q(13, 11, 1, 1, GOLD); q(13, 13, 2, 1, GOLD); q(4, 12, 3, 3, p[0]); q(8, 12, 3, 3, p[0]); },
  fallen(q, p) { q(5, 0, 2, 1, p[4]); q(9, 0, 2, 1, p[4]); q(5, 1, 6, 5, p[0]); q(6, 2, 4, 3, WHT); q(7, 3, 1, 1, p[0]); q(9, 3, 1, 1, p[0]); q(7, 4, 1, 2, '#7a121c'); q(4, 6, 8, 8, p[0]); q(5, 7, 6, 7, p[3]); q(7, 7, 2, 7, p[4]); q(13, 1, 1, 13, WOOD); q(12, 1, 3, 1, p[4]); q(13, 0, 1, 1, p[4]); q(3, 14, 10, 1, p[0]); },
  digger(q, p) { q(5, 3, 6, 3, p[0]); q(6, 4, 4, 1, p[4]); q(7, 2, 2, 2, '#ffd23a'); q(3, 6, 10, 8, p[0]); q(4, 7, 8, 6, p[1]); q(6, 9, 4, 3, p[2]); q(6, 7, 1, 1, p[0]); q(9, 7, 1, 1, p[0]); q(7, 8, 2, 1, '#e88aa8'); q(0, 9, 3, 1, BONE); q(0, 11, 3, 1, BONE); q(1, 10, 2, 1, p[0]); q(13, 9, 3, 1, BONE); q(13, 11, 3, 1, BONE); q(13, 10, 2, 1, p[0]); q(4, 14, 3, 1, p[0]); q(9, 14, 3, 1, p[0]); },
  clerk(q, p) { q(5, 1, 6, 6, p[0]); q(6, 2, 4, 4, '#e8b890'); q(5, 1, 6, 2, p[4]); q(4, 2, 1, 1, p[4]); q(6, 4, 1, 1, WHT); q(9, 4, 1, 1, WHT); q(7, 4, 2, 1, p[0]); q(4, 7, 8, 7, p[0]); q(5, 8, 6, 5, p[3]); q(7, 8, 2, 3, p[4]); q(2, 9, 7, 5, p[0]); q(3, 10, 5, 3, BONE); q(4, 11, 3, 1, p[0]); q(12, 3, 1, 7, WHT); q(13, 2, 1, 2, WHT); q(12, 11, 3, 1, GOLD); q(12, 12, 3, 1, '#a87a10'); q(12, 13, 3, 1, GOLD); q(12, 14, 3, 1, '#a87a10'); },
  licker(q, p) { q(3, 6, 9, 8, p[0]); q(4, 7, 7, 6, p[1]); q(5, 8, 2, 1, p[2]); q(6, 10, 5, 2, INK); q(10, 10, 3, 1, '#e8505a'); q(13, 9, 1, 2, '#e8505a'); q(14, 7, 1, 3, '#e8505a'); q(13, 6, 1, 1, '#e8505a'); q(12, 5, 1, 1, '#ff9a8a'); q(7, 12, 1, 2, p[2]); q(4, 14, 7, 1, p[0]); },
  spitter(q, p) { q(7, 10, 2, 5, p[0]); q(7, 11, 2, 3, p[3]); q(5, 14, 6, 1, p[0]); q(4, 3, 8, 7, p[0]); q(5, 4, 6, 5, p[1]); q(6, 5, 2, 1, p[2]); q(7, 6, 2, 2, INK); [[2, 2, 2, 1], [1, 5, 3, 1], [2, 9, 2, 1], [12, 2, 2, 1], [12, 5, 3, 1], [12, 9, 2, 1], [7, 0, 1, 3], [9, 1, 1, 2], [5, 1, 1, 2]].forEach(a => q(a[0], a[1], a[2], a[3], p[4])); },
};
// 진화: 21×21. 원래 몸은 (2, 5)에 놓이고, 종류마다 다른 장비와 부위가 덧붙는다
const KEVO = {
  spawn(q, p) { q(1, 9, 4, 4, p[0]); q(2, 10, 2, 2, p[1]); q(16, 8, 4, 5, p[0]); q(17, 9, 2, 3, p[1]); q(8, 2, 6, 5, p[0]); q(9, 3, 4, 3, p[1]); q(10, 3, 1, 1, p[2]); q(6, 6, 1, 3, p[4]); q(14, 5, 1, 3, p[4]); q(3, 7, 1, 2, p[4]); q(4, 20, 13, 1, p[0]); },
  goblin(q) { q(17, 3, 3, 7, WOOD); q(16, 1, 5, 4, '#5a4630'); q(17, 2, 1, 1, STEEL); q(19, 3, 1, 1, STEEL); q(7, 15, 1, 2, BONE); q(12, 15, 1, 2, BONE); q(2, 14, 4, 2, STEEL); q(9, 3, 2, 5, RED); q(8, 4, 1, 2, RED); },
  skeleton(q) { q(5, 5, 10, 3, STEEL); q(6, 4, 8, 1, STEEL); q(9, 0, 2, 5, RED); q(11, 1, 1, 3, RED); q(0, 12, 5, 7, STEEL); q(1, 13, 3, 5, RED); q(2, 14, 1, 3, GOLD); q(18, 3, 1, 12, WHT); q(17, 14, 3, 1, GOLD); q(18, 15, 1, 2, WOOD); },
  cultist(q) { q(7, 0, 6, 7, '#5a2a7a'); q(8, 1, 4, 1, '#7a3a9a'); q(9, 2, 2, 2, GOLD); q(18, 3, 1, 17, WOOD); q(17, 0, 3, 3, GOLD); q(18, 1, 1, 1, RED); q(0, 10, 1, 4, WHT); q(0, 9, 1, 1, '#ffd23a'); q(1, 16, 1, 3, WHT); q(1, 15, 1, 1, '#ffd23a'); },
  scale(q) { q(18, 1, 1, 19, STEEL); q(16, 2, 5, 1, STEEL); q(16, 0, 1, 3, STEEL); q(20, 0, 1, 3, STEEL); q(8, 0, 1, 6, GOLD); q(10, 1, 1, 5, GOLD); q(6, 2, 1, 4, GOLD); q(4, 15, 2, 2, BONE); q(13, 17, 2, 2, BONE); q(2, 11, 6, 8, '#0f5a78'); q(3, 12, 4, 6, GOLD); q(4, 13, 2, 4, '#0f5a78'); },
  scribe(q) { q(0, 3, 4, 3, BONE); q(1, 4, 2, 1, INK); q(17, 7, 4, 3, BONE); q(18, 8, 2, 1, INK); q(0, 15, 3, 3, BONE); q(6, 3, 9, 1, GOLD); q(5, 4, 1, 1, GOLD); q(15, 4, 1, 1, GOLD); q(10, 0, 1, 2, WHT); q(9, 1, 3, 1, WHT); q(3, 10, 1, 1, GOLD); q(18, 13, 1, 1, GOLD); q(16, 2, 1, 1, WHT); },
  mask(q) { [[1, 5], [4, 1], [9, 0], [14, 1], [17, 5]].forEach(a => { q(a[0] - 1, a[1] - 1, 5, 6, '#1b1d2a'); q(a[0], a[1], 3, 4, WHT); q(a[0] + 1, a[1] + 1, 1, 1, '#1b1d2a'); q(a[0], a[1] + 3, 3, 1, '#7a121c'); }); q(0, 14, 1, 5, GOLD); q(20, 14, 1, 5, GOLD); },
  hunger(q) { q(4, 1, 13, 6, '#1b1d2a'); q(5, 2, 11, 4, INK); for (let k = 0; k < 6; k++) { q(5 + k * 2, 2, 1, 1, WHT); q(6 + k * 2, 5, 1, 1, WHT); } q(9, 3, 3, 2, RED); q(3, 19, 3, 2, '#1b1d2a'); q(15, 19, 3, 2, '#1b1d2a'); q(0, 9, 2, 1, BONE); q(19, 9, 2, 1, BONE); q(0, 12, 2, 1, BONE); q(19, 12, 2, 1, BONE); },
  netter(q) { for (let k = 0; k < 3; k++) { q(0, 1 + k * 2, 5, 1, STEEL); q(k * 2, 1, 1, 6, STEEL); } q(2, 7, 1, 4, WOOD); q(1, 14, 1, 5, STEEL); q(0, 18, 2, 1, STEEL); q(17, 12, 1, 6, STEEL); q(17, 17, 3, 1, STEEL); q(19, 16, 1, 1, STEEL); q(6, 7, 6, 2, RED); },
  warden(q) { q(15, 2, 6, 9, STEEL); q(16, 3, 4, 7, '#1b1d2a'); q(17, 3, 1, 7, STEEL); q(19, 3, 1, 7, STEEL); q(17, 6, 2, 2, '#e8b890'); q(14, 16, 1, 1, STEEL); q(15, 17, 1, 1, STEEL); q(16, 17, 5, 4, '#4a4a58'); q(17, 18, 1, 1, STEEL); q(6, 3, 8, 3, STEEL); q(7, 2, 6, 1, GOLD); },
  turncoat(q) { q(0, 11, 4, 9, '#7a121c'); q(17, 11, 3, 9, '#7a121c'); q(1, 12, 2, 7, RED); q(5, 3, 2, 4, BONE); q(4, 2, 1, 2, BONE); q(14, 3, 2, 4, BONE); q(16, 2, 1, 2, BONE); q(19, 0, 2, 15, STEEL); q(20, 0, 1, 15, WHT); q(18, 15, 3, 1, GOLD); q(7, 9, 2, 1, RED); q(11, 9, 2, 1, RED); },
  fallen(q) { q(4, 1, 4, 1, GOLD); q(12, 1, 4, 1, GOLD); q(3, 3, 3, 1, GOLD); q(15, 3, 3, 1, GOLD); q(9, 0, 2, 1, RED); q(0, 9, 3, 7, BONE); q(1, 10, 1, 5, INK); q(0, 16, 2, 2, BONE); q(18, 9, 3, 7, BONE); q(19, 10, 1, 5, INK); q(19, 16, 2, 2, BONE); },
  digger(q) { q(15, 13, 6, 3, STEEL); q(19, 11, 2, 7, STEEL); q(20, 14, 1, 1, WHT); q(16, 12, 1, 1, '#4a4a58'); q(18, 16, 1, 1, '#4a4a58'); q(7, 1, 6, 5, GOLD); q(8, 2, 4, 3, '#ffd23a'); q(9, 3, 2, 1, WHT); q(7, 11, 3, 2, '#b6ecff'); q(11, 11, 3, 2, '#b6ecff'); },
  clerk(q) { for (let k = 0; k < 6; k++) { q(17, 19 - k * 2, 4, 1, GOLD); q(17, 18 - k * 2, 4, 1, '#a87a10'); } q(18, 6, 2, 2, GOLD); q(10, 5, 7, 2, GOLD); q(11, 4, 1, 1, GOLD); q(13, 3, 1, 2, GOLD); q(15, 4, 1, 1, GOLD); q(13, 4, 1, 1, RED); q(0, 9, 3, 1, GOLD); q(1, 8, 1, 3, GOLD); },
  licker(q) { q(0, 13, 4, 1, '#e8505a'); q(0, 10, 1, 4, '#e8505a'); q(1, 9, 1, 1, '#ff9a8a'); q(16, 18, 4, 1, '#e8505a'); q(19, 18, 1, 3, '#e8505a'); q(5, 4, 1, 7, '#e8505a'); q(4, 3, 1, 2, '#ff9a8a'); q(9, 8, 4, 3, INK); q(10, 9, 2, 1, WHT); q(3, 17, 2, 2, WHT); q(13, 12, 1, 1, WHT); },
  spitter(q, p) { q(0, 6, 6, 6, p[0]); q(1, 7, 4, 4, p[1]); q(2, 8, 2, 2, INK); q(15, 4, 6, 6, p[0]); q(16, 5, 4, 4, p[1]); q(17, 6, 2, 2, INK); q(2, 4, 1, 2, p[4]); q(0, 9, 1, 1, p[4]); q(18, 2, 1, 2, p[4]); q(20, 7, 1, 1, p[4]); q(9, 0, 1, 5, p[4]); q(11, 1, 1, 4, p[4]); q(4, 12, 4, 1, p[3]); q(14, 10, 3, 1, p[3]); },
  eyeheap(q, p) { q(5, 0, 11, 8, p[0]); q(6, 1, 9, 6, p[1]); q(8, 2, 5, 4, WHT); q(10, 3, 2, 2, INK); q(10, 3, 1, 1, RED); q(0, 11, 3, 3, p[0]); q(0, 11, 2, 2, WHT); q(1, 12, 1, 1, INK); q(18, 13, 3, 3, p[0]); q(19, 13, 2, 2, WHT); q(19, 14, 1, 1, INK); q(4, 19, 13, 2, p[3]); },
  tangle(q, p) { q(8, 11, 5, 5, p[0]); q(9, 12, 3, 3, '#f0e060'); q(10, 13, 1, 1, WHT); [[0, 3, 7], [3, 0, 6], [17, 0, 7], [20, 4, 8], [1, 15, 5], [19, 15, 5]].forEach(a => { q(a[0], a[1], 1, a[2], p[1]); q(a[0], a[1], 1, 1, p[2]); }); q(6, 3, 1, 3, p[1]); q(14, 2, 1, 4, p[1]); },
};
// 숨 쉬는 두 번째 장면: 윗몸이 한 칸 내려앉는다. 어떤 그림에도 쓴다
const FRM = new Map();
function frameOf(can, f) {
  if (!f) return can; if (FRM.has(can)) return FRM.get(can);
  const c = document.createElement('canvas'); c.width = can.width; c.height = can.height; const x = c.getContext('2d'), h = can.height, cutY = h - Math.max(3, Math.round(h * 0.2));
  x.drawImage(can, 0, 0, can.width, cutY, 0, 1, can.width, cutY); x.drawImage(can, 0, cutY, can.width, h - cutY, 0, cutY, can.width, h - cutY); x.clearRect(0, cutY, 0, 0);
  FRM.set(can, c); return c;
}
function kinBase(kind) {
  if (!KDRAW[kind]) return spriteCanvas(KINSPR[kind][0], KINSPR[kind][1]); const key = 'kb:' + kind; if (cv[key]) return cv[key];
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); KDRAW[kind]((a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, PAL[KINSPR[kind][1]] || PAL.base); return (cv[key] = c);
}
function kinCanvas(kind, evo) {
  if (evo && KEVO2[kind]) { const k2 = 'evo5:' + kind; if (cv[k2]) return cv[k2]; const K = Sculpt(24); KEVO2[kind](K, PAL[KINSPR[kind][1]] || PAL.base); return (cv[k2] = K.canvas()); }   // 진화하면 다른 것이 된다
  if (!evo || !KEVO[kind]) return kinBase(kind); const key = 'evo4:' + kind; if (cv[key]) return cv[key];
  const c = document.createElement('canvas'); c.width = c.height = 21; const x = c.getContext('2d'), q = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, P = PAL[KINSPR[kind][1]] || PAL.base;
  if (['turncoat', 'fallen', 'scale', 'warden'].includes(kind)) KEVO[kind](q, P);          // 망토·날개·등짐은 몸 뒤에
  x.drawImage(kinBase(kind), 2, 5);
  if (!['turncoat', 'fallen', 'warden'].includes(kind)) KEVO[kind](q, P); else if (kind === 'turncoat') { q(5, 3, 2, 4, BONE); q(14, 3, 2, 4, BONE); q(19, 0, 2, 15, STEEL); q(20, 0, 1, 15, WHT); q(18, 15, 3, 1, GOLD); } else if (kind === 'fallen') { q(4, 1, 4, 1, GOLD); q(12, 1, 4, 1, GOLD); q(3, 3, 3, 1, GOLD); q(15, 3, 3, 1, GOLD); q(9, 0, 2, 1, RED); } else { q(6, 3, 8, 3, STEEL); q(7, 2, 6, 1, GOLD); q(14, 16, 1, 1, STEEL); q(15, 17, 1, 1, STEEL); q(16, 17, 5, 4, '#4a4a58'); q(17, 18, 1, 1, STEEL); }
  return (cv[key] = c);
}
// ---------- 결말 그림: 192×108. 징조마다 다른 재앙이고, 점수 등급(0~2)이 높을수록 더 멀리 간다 ----------
function endingScene(c, key, tier, sl, fr) {
  const x = c.getContext('2d'), W = 192, H = 108, t = tier, P = PAL[key] || PAL.base; x.imageSmoothingEnabled = false;
  const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const disc = (cx, cy, r, col) => { x.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1); } };
  const tent = (x0, y0, len, w, col) => { for (let i = 0; i < len; i++) px(x0 + Math.sin(i * 0.35 + x0 + fr * 0.8) * (2 + i * 0.08), y0 - i, Math.max(1, w * (1 - i / len)), 1, col); };
  const SKY = { abyss: ['#0a1830', '#12305a', '#1f5a80'], nebula: ['#0a0620', '#1a1040', '#3a2470'], brood: ['#141c10', '#24381c', '#4a6a2a'], dusk: ['#1c0c14', '#3a1420', '#6a2a2a'], hunger: ['#140406', '#2a0a0e', '#4a1218'] }[key];
  SKY.forEach((col, i) => px(0, i * 24, W, i === 2 ? 60 : 24, col));
  for (let k = 0; k < 26; k++) px((k * 53) % W, (k * 29) % 56, 1, 1, (k + fr) % 7 ? '#c8d0ff' : '#ffffff');
  const mx = 150, my = 22, gy = 78; disc(mx, my, 9, '#e8e6d0'); disc(mx - 3, my - 2, 2, '#c8c6b0');
  x.fillStyle = '#0c0e1a'; x.beginPath(); x.moveTo(0, gy); for (let k = 0; k <= 8; k++) x.lineTo(k * 24, gy - 10 - ((k * 7) % 13)); x.lineTo(W, gy); x.fill();
  px(0, gy, W, H - gy, '#10121c');
  const houses = []; for (let k = 0; k < 11; k++) houses.push({ x: 6 + k * 17, w: 10 + (k % 3) * 2, h: 8 + (k * 5) % 7 });
  const drawTown = (lift, skip) => houses.forEach((h, k) => { if (skip && skip(k)) return; const up = lift ? lift(k) : 0; px(h.x, gy - h.h - up, h.w, h.h, '#181a28'); x.fillStyle = '#181a28'; x.beginPath(); x.moveTo(h.x - 1, gy - h.h - up); x.lineTo(h.x + h.w / 2, gy - h.h - 5 - up); x.lineTo(h.x + h.w + 1, gy - h.h - up); x.fill(); px(h.x + 2, gy - h.h + 3 - up, 2, 2, '#e8c030'); if (h.w > 11) px(h.x + 7, gy - h.h + 3 - up, 2, 2, (k + fr) % 5 ? '#e8c030' : '#181a28'); });
  const folk = (fx, col, head, arms) => { px(fx, gy - 5, 2, 5, col); px(fx, gy - 7, 2, 2, head || col); if (arms) px(fx + 2, gy - 5, 2, 1, col); };
  const body = (cx, by, size) => { const sc = slimeCanvas(sl, fr), w = sc.width * Math.max(1, Math.round(size / sc.width)); x.drawImage(sc, Math.round(cx - w / 2), Math.round(by - w), w, w); };
  if (key === 'abyss') {           // 물이 차오른다
    body(96, gy + 6, 44 + t * 26); drawTown(); const wl = gy - 2 - t * 12;
    for (let k = 0; k < 3 + t * 5; k++) tent(10 + k * (170 / (2 + t * 5)), wl + 6, 14 + t * 10 + (k % 3) * 4, 3, P[1]);
    x.fillStyle = 'rgba(20,70,110,0.72)'; x.fillRect(0, wl, W, H - wl); for (let k = 0; k < W; k += 6) px(k + (fr % 2) * 3, wl, 3, 1, '#9fe8f0');
    houses.forEach(h => { if (gy - h.h + 3 > wl) px(h.x + 2, gy - h.h + 3, 2, 2, '#ffe890'); });
    if (t >= 1) for (let k = 0; k < 4 + t * 4; k++) folk(30 + k * 15 + (fr % 2), '#0a0c14');
    if (t === 0) for (let k = 0; k < 6; k++) px(60 + k * 7, gy + 8 + (k % 2) * 3, 2, 1, '#9fe8f0');
  } else if (key === 'nebula') {   // 하늘이 갈라진다
    const cw = 30 + t * 50; x.fillStyle = '#f5f0ff'; for (let k = 0; k < cw; k++) x.fillRect(Math.round(96 - cw / 2 + k), Math.round(30 + Math.sin(k * 0.5) * 3 + ((k * 7) % 5) - 2), 1, 1 + t + ((k + fr) % 3 === 0 ? 1 : 0));
    if (t === 2) { x.fillStyle = '#05030c'; x.beginPath(); x.moveTo(40, 0); x.lineTo(152, 0); x.lineTo(96, 44); x.fill(); x.fillStyle = '#d8c8ff'; for (let k = 0; k < 30; k++) x.fillRect(60 + (k * 37) % 72, (k * 13) % 30, 1, 1); }
    body(96, 54 + t * 4, 34 + t * 22); drawTown(t === 2 ? k => 6 + (k * 7) % 16 + (fr % 2) : null);
    if (t === 2) houses.forEach((h, k) => { for (let d = 0; d < 3; d++) px(h.x + 2 + d * 3, gy - 2 - d * 2 - (k % 3), 1, 1, '#181a28'); });
    for (let k = 0; k < (t ? 6 + t * 5 : 1); k++) { folk(20 + k * 10, '#0a0c14'); px(20 + k * 10, gy - 8, 2, 1, '#d8c8ff'); }
    for (let k = 0; k < 8 * t; k++) px((k * 41 + fr * 3) % W, 60 - ((k * 17 + fr * 5) % 50), 1, 3, '#fff3a0');
    if (t === 0) { px(40, 14, 3, 1, '#fff3a0'); px(41, 13, 1, 3, '#fff3a0'); }
  } else if (key === 'brood') {    // 피어난다
    body(96, gy + 4, 40 + t * 28); drawTown();
    houses.forEach((h, k) => { for (let d = 0; d < 2 + t * 4; d++) px(h.x + (d * 5) % h.w, gy - 1 - (d * 3) % (h.h + t * 3), 2, 1 + (d % 2), d % 3 ? '#4a8a2a' : '#8fd05f'); if (t >= 1) { disc(h.x + h.w / 2, gy - h.h - 6, 2 + (k % 2), '#6fbf3f'); px(h.x + h.w / 2, gy - h.h - 7, 1, 1, '#d0f08a'); } if (t === 2) tent(h.x + 3, gy - h.h - 6, 16 + (k * 5) % 14, 2, '#2f7a2a'); });
    const n = t === 0 ? 1 : 5 + t * 6; for (let k = 0; k < n; k++) { const fx = 8 + k * (176 / n) + (t === 2 ? (fr + k) % 2 : 0); folk(fx, '#16240f', '#6fbf3f', t === 2); px(fx, gy - 9, 1, 2, '#d0f08a'); }
    for (let k = 0; k < 10 * t; k++) px((k * 37 + fr * 2) % W, (k * 23 + fr * 3) % 80, 1, 1, '#d0f08a');
  } else if (key === 'dusk') {     // 막이 오른다
    body(96, gy - 2, 44 + t * 26);
    for (let sd = 0; sd < 2; sd++) for (let k = 0; k < 8 + t * 10; k++) px(sd ? W - 1 - k : k, 0, 1, 60 + t * 20 - (k % 4) * 3 + Math.sin(k * 0.6 + fr) * 2, k % 3 ? '#7a121c' : '#c8303a');
    px(0, 0, W, 3 + t * 2, '#7a121c'); drawTown();
    houses.forEach((h, k) => { if (t >= 1 || k === 4) { px(h.x + 2, gy - h.h + 2, 3, 4, '#f5f5f5'); px(h.x + 3, gy - h.h + 3, 1, 1, '#1b1d2a'); } });
    for (let r = 0; r < (t ? t + 1 : 0); r++) for (let k = 0; k < 20; k++) { const fx = 6 + k * 9 + (r % 2) * 4, fy = gy + 6 + r * 8; px(fx, fy, 3, 4, '#0a0c14'); px(fx, fy - 3, 3, 3, '#f5f5f5'); px(fx + 1, fy - 2, 1, 1, '#1b1d2a'); if ((k + fr + r) % 2) px(fx - 1, fy + 1, 5, 1, '#0a0c14'); }
  } else {                         // 먹힌다
    disc(mx + 5 + t * 2, my - 3, 5 + t * 3, SKY[0]); for (let k = 0; k < 4 + t * 2; k++) px(mx + 1 + t - k % 2, my - 6 + k * 2, 1, 1, '#ffffff');
    for (let k = 0; k < 1 + t * 3; k++) { disc(20 + k * 48, gy - 12, 7 + t * 2, SKY[2]); for (let d = -5; d <= 5; d += 2) px(20 + k * 48 + d, gy - 6 - Math.abs(d) / 2, 1, 2, '#f5f5f5'); }
    body(96, gy + 8, 44 + t * 28); drawTown(null, t ? k => (k * 5 + 1) % (4 - t) === 0 : null);
    for (let k = 0; k < (t ? 4 : 2); k++) folk(40 + k * 34, '#0a0c14');
    if (t === 2) { x.fillStyle = '#f2e9c9'; for (let k = 0; k < W; k += 8) { const d = 8 + (k * 3) % 5 + (fr % 2); x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 4, d + 6); x.lineTo(k + 8, 0); x.fill(); x.beginPath(); x.moveTo(k, H); x.lineTo(k + 4, H - d - 4); x.lineTo(k + 8, H); x.fill(); } px(0, 0, W, 2, '#7a121c'); px(0, H - 2, W, 2, '#7a121c'); }
  }
}
const toImg = (c, key, size, alt) => `<img class="px" src="${urls[key] || (urls[key] = c.toDataURL())}" width="${size}" height="${size}" alt="${esc(alt || '')}">`;
// 합체: 붙은 것들이 어깨 뒤로 비죽 나온다. 24×24, 숙주는 아래 가운데
function kinCanvasM(m) {
  const parts = (m.parts || []); if (!parts.length) return kinCanvas(m.kind, m.evo);
  const key = 'fz:' + m.kind + (m.evo ? 'e' : '') + ':' + parts.map(p => p.kind + (p.evo ? 'e' : '')).join('+'); if (cv[key]) return cv[key];
  const host = kinCanvas(m.kind, m.evo), c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const hx = Math.round((24 - host.width) / 2), hy = 24 - host.height;
  parts.forEach((p, k) => { const pc = kinCanvas(p.kind, false), w = Math.round(pc.width * 0.7), px0 = k === 0 ? Math.max(0, hx - 5) : Math.min(24 - w, hx + host.width - w + 5), py0 = Math.max(0, hy - 6 + k * 2); x.drawImage(pc, px0, py0, w, w);
    x.fillStyle = '#5a0c14'; for (let i = 0; i < 4; i++) x.fillRect(px0 + Math.round(w / 2) + (k ? -i : i), py0 + w - 2 + i, 2, 1); x.fillStyle = '#e8505a'; x.fillRect(px0 + Math.round(w / 2) + (k ? -1 : 1), py0 + w - 1, 1, 1); });
  x.drawImage(host, hx, hy);
  NEST.recipesOf(m).forEach(r => rcpMark(x, r, hx, hy, host.width, host.height));
  return (cv[key] = c);
}
// 특별한 합체의 표식: 조합마다 몸에 한 가지가 더 붙는다
function rcpMark(x, r, hx, hy, w, h) {
  const cx = hx + Math.floor(w / 2), P = (col, pts) => { x.fillStyle = col; pts.forEach(p => x.fillRect(p[0], p[1], p[2] || 1, p[3] || 1)); }, top = Math.max(0, hy - 3), bot = 23;
  if (r === 'pray') P('#f4d868', [[cx - 3, top, 6, 1], [cx - 4, top + 1], [cx + 3, top + 1], [cx - 3, top + 2, 6, 1]]);
  if (r === 'twice') { P('#c8c8dc', [[cx - 3, top, 2, 1], [cx + 1, top, 2, 1], [cx - 4, top + 1], [cx + 3, top + 1], [cx - 3, top + 2, 3, 1]]); P('#e8505a', [[cx, top + 1]]); }
  if (r === 'read') P('#7fe0ff', [[cx - 3, hy + Math.floor(h / 2)], [cx - 1, hy + Math.floor(h / 2) + 1], [cx + 1, hy + Math.floor(h / 2)], [cx + 3, hy + Math.floor(h / 2) + 1]]);
  if (r === 'wall') { P('#2a3038', [[hx - 2, bot - 8, 6, 8]]); P('#9aa4b0', [[hx - 1, bot - 7, 4, 6]]); P('#dfe6ee', [[hx, bot - 6, 1, 4]]); }
  if (r === 'fist') { P('#5a1810', [[hx + w - 2, bot - 9, 6, 6]]); P('#e07050', [[hx + w - 1, bot - 8, 4, 4]]); P('#ffd0b0', [[hx + w - 1, bot - 8, 4, 1]]); }
  if (r === 'brawl') { P('#3a2408', [[hx - 3, bot - 10, 5, 5], [hx + w - 2, bot - 10, 5, 5]]); P('#e0b060', [[hx - 2, bot - 9, 3, 3], [hx + w - 1, bot - 9, 3, 3]]); }
  if (r === 'choir') P('#f4d868', [[cx - 6, top + 1, 1, 3], [cx - 7, top + 3, 2, 1], [cx + 5, top, 1, 3], [cx + 4, top + 2, 2, 1]]);
  if (r === 'bud') { P('#2c5a24', [[cx, top + 1, 1, 3]]); P('#7ad060', [[cx - 2, top, 2, 2], [cx + 1, top, 2, 2]]); }
  if (r === 'bind') { for (let i = 0; i < w + 4; i += 2) P(i % 4 ? '#6a7078' : '#c8ced6', [[hx - 2 + i, bot - 1, 2, 1]]); P('#f4d868', [[hx + w, bot - 4, 2, 2], [hx + w, bot - 2, 1, 1]]); }
  if (r === 'briar') P('#5fae4a', [[hx - 2, bot - 9], [hx - 3, bot - 7, 2, 1], [hx - 2, bot - 4], [hx + w + 1, bot - 10], [hx + w, bot - 6, 2, 1], [hx + w + 1, bot - 3], [cx - 2, top + 1], [cx + 2, top]]);
  if (r === 'ledger') { P('#3a2a10', [[hx + w - 2, bot - 5, 5, 5]]); P('#f0c040', [[hx + w - 1, bot - 4, 3, 3]]); P('#fff0a0', [[hx + w - 1, bot - 4, 1, 1]]); }
  if (r === 'record') { P('#101018', [[cx - 3, top, 6, 4]]); P('#f0f0f8', [[cx - 2, top + 1, 4, 2]]); P('#7030c0', [[cx - 1, top + 1, 2, 2]]); }
}
const kinImgM = (m, size) => m.parts && m.parts.length ? toImg(kinCanvasM(m), 'fz:' + m.kind + (m.evo ? 'e' : '') + ':' + m.parts.map(p => p.kind + (p.evo ? 'e' : '')).join('+'), size, NEST.kinName(m)) : kinImg(m.kind, size, m.evo);
const kinImg = (kind, size, evo) => toImg(kinCanvas(kind, evo), (evo ? 'evo5:' : 'kin3:') + kind, size, NEST.KIN[kind].name);
const invImg = (kind, size) => toImg(invCanvas(kind), 'inv:' + kind, size, NEST.INV[kind].name);
// 본체 그림은 점이 뭉개지지 않게 정수배로만 키운다. 자리는 size 그대로 잡고 그 안 바닥에 세운다
const slimeImg = (sl, size, alt) => { const c = slimeCanvas(sl), N = c.width; let k = Math.max(1, Math.round(size / N)); if (k > 1 && N * k > size * 1.12) k--; const w = N * k > size * 1.12 ? size : N * k;
  return `<span class="slbox" style="width:${size}px;height:${size}px">${toImg(c, 'sl5:' + (sl.origin || 'drop') + ':' + (sl.body || '') + ':' + (sl.main || 'base') + ':' + (sl.sub || '') + ':' + sl.stage + ':' + (sl.muts || []).join(','), w, alt || '본체')}</span>`; };
// 현황판의 작은 그림
const ICON = {
  gold: [['..yyyyy..', '.yYYYYYy.', 'yYYwYYYYy', 'yYwYYYYdy', 'yYwYYYYdy', 'yYYYYYddy', '.yYYdddy.', '..yyyyy..'], { y: '#8a6a1c', Y: '#e8c030', w: '#fff3a0', d: '#c89a20' }],
  faith: [['....f....', '...fo....', '...fof...', '..foyof..', '..foyof..', '...ooo...', '..wwwww..', '..wWWWw..', '..wWWWw..'], { f: '#b08fff', o: '#d8c0ff', y: '#ffffff', w: '#8a8296', W: '#d8d4e4' }],
  fear: [['..sssss..', '.sssssss.', 'ssksssks.', 'sskksskk.', 'sssssssss', '.sssksss.', '..sssss..', '..s.s.s..'], { s: '#ff9a92', k: '#3a1014' }],
  ess: [['....d....', '...dd....', '...dDd...', '..dDDdd..', '.dDwDDdd.', '.dDwDDDd.', '.ddDDDdd.', '..ddddd..'], { d: '#3f8a9a', D: '#8fe0e8', w: '#ffffff' }],
  food: [['.rrrr....', 'rRRRRr...', 'rRpRRRr..', 'rRRRRRr..', '.rRRRrw..', '..rrrwWw.', '.....wWWw', '......ww.'], { r: '#7a2028', R: '#d85a5a', p: '#ffb0a8', w: '#b8b0a0', W: '#f0ead8' }],
  life: [['.rr...rr.', 'rRRr.rRRr', 'rRwRrRRRr', 'rRRRRRRRr', '.rRRRRRr.', '..rRRRr..', '...rRr...', '....r....'], { r: '#8a2028', R: '#ff7d76', w: '#ffd0cc' }],
  dead: [['.kk...kk.', 'kKKk.kKKk', 'kKKKkKKKk', 'kKKKKKKKk', '.kKKKKKk.', '..kKKKk..', '...kKk...', '....k....'], { k: '#2a2a3c', K: '#4a4e6e' }],
};
const iconSrc = {};
function iconImg(name, size) { if (!iconSrc[name]) { const [rows, pal] = ICON[name], c = document.createElement('canvas'); c.width = 9; c.height = 9; const x = c.getContext('2d'); rows.forEach((row, yy) => { for (let k = 0; k < row.length; k++) if (pal[row[k]]) { x.fillStyle = pal[row[k]]; x.fillRect(k, yy, 1, 1); } }); iconSrc[name] = c.toDataURL(); } return `<img class="px ic" src="${iconSrc[name]}" width="${size || 18}" height="${size || 18}" alt="">`; }
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
