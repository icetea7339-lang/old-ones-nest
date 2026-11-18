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
function slimeCanvas(sl) {
  const key = 'sl:' + (sl.main || 'base') + ':' + (sl.sub || '') + ':' + sl.stage + ':' + (sl.muts || []).join(','); if (cv[key]) return cv[key];
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
  x.drawImage(spriteCanvas(sl.main ? 'sl_' + sl.main : 'slime', sl.main || 'base'), 0, 0);
  const put = list => (list || []).forEach(([a, b, col]) => { x.fillStyle = col; x.fillRect(a, b, 1, 1); });
  if (sl.sub) put(SUBOVER[sl.sub]);
  (sl.muts || []).forEach(m => put(MUTOVER[m]));
  const ac = (PAL[sl.main] || PAL.base)[2];
  if (sl.stage >= 3) put([[0, 9, ac], [0, 10, ac], [15, 8, ac], [15, 9, ac], [1, 14, ac], [0, 15, ac], [14, 14, ac], [15, 15, ac], [3, 15, ac], [12, 15, ac]]);  // 세 번째 허물: 몸 밖으로 뻗는 것들
  if (sl.stage >= 4) put([[7, 9, '#ff5040'], [8, 9, '#fff3a0'], [8, 10, '#ff5040'], [7, 11, '#fff3a0'], [9, 8, '#ff5040'], [6, 10, '#ff5040'], [2, 2, ac], [13, 1, ac], [1, 4, ac], [14, 3, ac]]);  // 성체: 속에서 새어 나오는 빛
  return (cv[key] = c);
}
function kinCanvas(kind, evo) {
  const b = spriteCanvas(KINSPR[kind][0], KINSPR[kind][1]); if (!evo) return b; const key = 'evo:' + kind; if (cv[key]) return cv[key];
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); x.drawImage(b, 0, 0);
  [[5, 0], [7, 0], [9, 0], [6, 1], [8, 1]].forEach(([a, d]) => { x.fillStyle = '#e8c030'; x.fillRect(a, d, 1, 1); }); x.fillStyle = '#ff5040'; x.fillRect(7, 1, 1, 1);  // 진화한 권속의 뿔관
  return (cv[key] = c);
}
const toImg = (c, key, size, alt) => `<img class="px" src="${urls[key] || (urls[key] = c.toDataURL())}" width="${size}" height="${size}" alt="${esc(alt || '')}">`;
const kinImg = (kind, size, evo) => toImg(kinCanvas(kind, evo), (evo ? 'evo:' : 'kin:') + kind, size, NEST.KIN[kind].name);
const invImg = (kind, size) => toImg(invCanvas(kind), 'inv:' + kind, size, NEST.INV[kind].name);
const slimeImg = (sl, size, alt) => toImg(slimeCanvas(sl), 'sl:' + (sl.main || 'base') + ':' + (sl.sub || '') + ':' + sl.stage + ':' + (sl.muts || []).join(','), size, alt || '본체');
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
