// 옛 것의 둥지 — 카드로 짓는 판의 화면 (규칙은 cardmode.js, 카드는 cards2.js).
// 낮: 아침마다 받은 다섯 장을 아래에 펼친다. 카드를 누르면 놓을 수 있는 칸이 빛나고, 굴 카드는 칸을 눌러 자리를 보고(↻ 돌리기) 놓는다.
// 밤: 원래 게임의 밤 그대로. 무리가 방에 들어 멈추면 쥔 기술 카드가 아래에 카드로 나온다.
// 같은 밤을 두 번 돈다: 화면에서 한 번(보여 주고 답을 적는다), 규칙에서 한 번(적은 답으로). 씨앗이 같으니 결과도 같다.
const CMU = { run: null, sel: null, place: null, alts: [], altI: 0, tapCell: null, hint: null, hintKey: '', hints: [], ov: null, raf: 0, sheet: null, learnedN: 0, bodyKey: '', body: null, set0: null, down: null, lpT: 0, lpFired: false, egg: null, look: null, asp: null, nres: null, codexTab: 'card', codexAsp: 'all', deckTab: 'all', eggLaid: false };
const cmMeta = () => { if (!META.cards) META.cards = CARDMODE.newMeta(); const m = META.cards; m.eggs = m.eggs || []; m.forms = m.forms || {}; m.marks = m.marks || {}; return m; };
const cmDef = id => CARDS2.BY[id] || (typeof CARDMODE !== 'undefined' && CARDMODE.def ? CARDMODE.def({ id }) : undefined);
const cmCard = uid => CMU.run ? CMU.run.deck.find(c => c.uid === uid) : null;
const cmOn = () => !!(CMU.run && G && G.cardMode && CMU.run.G === G && !$('game').hidden);
// 카드 판에서는 둥지 너비 전체를 한 화면에 (stage.js 가 묻는다). '가까이'를 고르면 예전처럼 크게 보고 밀어서 본다. 카드를 들면 늘 전체로
const cmFitOn = () => cmOn() && ST.screen === 'under' && (CMU.zoom !== 'near' || CMU.sel != null || !!(CMU.drag && CMU.drag.on));
const cmCol = a => (typeof ASPCOL !== 'undefined' && ASPCOL[a]) || '#c8c0b0';
const cmTagName = t => (typeof TRAITS !== 'undefined' && TRAITS.TAGS[t] ? TRAITS.TAGS[t].name : t);

// ---- 저장: 판 전체(덱·손·둥지)를 'cardrun' 에. 원래 게임의 저장이 카드 판을 'run' 에 덮어쓰지 않게 막는다 ----
(function () { const set0 = store.set; CMU.set0 = set0; store.set = function (k, v) { if (k === 'run' && v && v.cardMode) { cmSave(); return; } return set0.call(store, k, v); }; })();
function cmSave() { if (CMU.run && CMU.run.camp && typeof campSave === 'function') return campSave(); const run = CMU.run; if (!run || CMU.inNight || run.phase === 'over' || (run.G && run.G.over)) return; try { CMU.set0.call(store, 'cardrun', Object.assign({}, run, { meta: null })); } catch (e) { /* 저장 못 해도 판은 계속 */ } }
function cmLoad() { const r = store.get('cardrun'); if (!r || !r.G || !r.deck) return null; r.meta = cmMeta(); try { CARDMODE.repair(r); } catch (e) { return null; } return r; }

// ---- 본체의 몸: 게놈으로 그린다 ----
function cmGenome() {
  const run = CMU.run; if (!run) return null;
  if (typeof CARDMODE.genome === 'function') { try { const g = CARDMODE.genome(run); if (g) return g; } catch (e) { /* 아래 */ } }
  return cmGenomeNow(run, G.slime.stage);
}
// 게놈 단계가 아직 없을 때: 지금까지 한 일로 몸을 짐작한다
function cmGenomeNow(run, stage) {
  if (typeof TRAITS === 'undefined') return null; const g0 = run.G;
  const g = TRAITS.newGenome({ aspect: g0.slime.main || run.aspect, sub: g0.slime.sub || null, stage: Math.min(5, (stage || 0) + 1), seed: run.seed, lineage: run.egg ? [run.egg] : [] });
  const b = CARDMODE.behaviour(run), num = {}; for (const k in b) if (typeof b[k] === 'number') num[k] = b[k];
  TRAITS.addBehaviour(g, num); return g;
}
const cmGKey = g => g ? [g.aspect, g.sub || '', g.stage, g.seed, Object.keys(g.tags || {}).sort().map(t => t + Math.round(g.tags[t])).join(',')].join(':') : '';
function cmBodyCanvas(g) { if (!g || typeof BODYGEN === 'undefined') return null; try { return BODYGEN.build(g); } catch (e) { return null; } }
function cmBodyImg(g, size) { const c = cmBodyCanvas(g); return c ? toImg(c, 'gb:' + cmGKey(g), size, '본체') : ''; }
function cmBody() { const g = cmGenome(), k = cmGKey(g) + ':' + G.day; if (k !== CMU.bodyKey) { CMU.bodyKey = k; CMU.body = cmBodyCanvas(g); cmForgetSlime(); } return CMU.body; }
// slimeImg 는 본체 그림을 겉모습 열쇠로 기억한다: 카드 판의 몸이 바뀌거나 판을 나가면 그 기억을 지운다
function cmForgetSlime() { Object.keys(urls).forEach(k => { if (k.indexOf('sl5:') === 0) delete urls[k]; }); }
// 카드 판에서는 본체를 그릴 때 게놈 몸을 쓴다 (지도·본체 창·밤 무대)
{ const sc0 = slimeCanvas; slimeCanvas = function (sl, fr) { if (G && G.cardMode && CMU.run && CMU.run.G === G) { const c = cmBody(); if (c) return c; } return sc0(sl, fr); }; }

// ---- 카드 그림: 꼬리표로 무늬를 고른다 (권속은 권속 그림, 굴은 모양) ----
const CMART = {}, CMDARK = { abyss: '#0d3a48', nebula: '#2e2250', brood: '#21401a', dusk: '#4a2c10', hunger: '#4a1418', none: '#3a3640' };
const CMMOTIF = { maw: 'maw', tongue: 'maw', spore: 'spore', egg: 'egg', swarm: 'egg', eye: 'eye', star: 'star', light: 'pulse', water: 'wave', tentacle: 'tent', root: 'tent', bone: 'shell', shell: 'shell', horn: 'teeth', thorn: 'teeth', digest: 'drop', face: 'brand', shadow: 'brand', mirror: 'eye', wing: 'wave', trap: 'teeth', alone: 'brand' };
function cmArtCanvas(v) {
  const d = cmDef(v.id) || {}, key = v.type === 'kin' ? 'k:' + d.kin : v.type === 'shape' ? 's:' + v.id : v.id;
  if (CMART[key]) return CMART[key];
  if (v.type === 'kin' && d.kin && typeof kinCanvas === 'function') { try { return (CMART[key] = kinCanvas(d.kin, 0, null)); } catch (e) { /* 아래 그림으로 */ } }
  const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'), col = cmCol(v.asp), dk = CMDARK[v.asp] || CMDARK.none;
  const r = (a, b, w, h, k) => { x.fillStyle = k; x.fillRect(a, b, w, h); }, disc = (cx, cy, rr, k) => { x.fillStyle = k; for (let j = -rr; j <= rr; j++) { const w = Math.round(Math.sqrt(rr * rr - j * j)); x.fillRect(cx - w, cy + j, w * 2 + 1, 1); } };
  if (v.type === 'shape' && d.cells) {
    const xs = d.cells.map(p => p[0]), ys = d.cells.map(p => p[1]), mx = Math.min(...xs), my = Math.min(...ys), w = Math.max(...xs) - mx + 1, h = Math.max(...ys) - my + 1, s = Math.floor(22 / Math.max(w, h, 2)), ox = Math.floor((24 - w * s) / 2), oy = Math.floor((24 - h * s) / 2);
    d.cells.forEach(([a, b]) => { r(ox + (a - mx) * s, oy + (b - my) * s, s - 1, s - 1, '#8a6a4a'); r(ox + (a - mx) * s, oy + (b - my) * s, s - 1, 2, '#c8a070'); });
    if (d.asp && d.asp !== 'none') r(ox, oy + h * s - 2, w * s - 1, 2, col);
    return (CMART[key] = c);
  }
  if (v.type === 'shape') { r(3, 10, 18, 4, '#8a6a4a'); r(10, 3, 4, 18, d.op === 'block' ? '#5a4a3a' : '#8a6a4a'); if (d.op === 'block') r(4, 4, 16, 16, '#3a3040'); return (CMART[key] = c); }
  const TRM = { maw: 'maw', drown: 'wave', eye: 'eye', spore: 'spore', eggsac: 'egg', whisper: 'brand', digest: 'drop', limb: 'tent' };
  const RMM = { trap: 'teeth', post: 'shell', hall: 'maw', bighall: 'maw', ambush: 'eye', decoy: 'pulse', shop: 'drop', prison: 'egg', chapel: 'star', altar: 'brand', pool: 'wave', sluice: 'wave', library: 'star', warp: 'brand', hatchery: 'egg', fleshwall: 'shell', stage: 'pulse', abattoir: 'teeth' };
  const m = v.type === 'curse' ? 'thorn' : v.type === 'trap' && TRM[d.trap] ? TRM[d.trap] : v.type === 'organ' && RMM[d.room] ? RMM[d.room] : CMMOTIF[(d.tags || [])[0]] || (v.type === 'organ' ? 'maw' : 'star');
  if (v.type === 'organ') { disc(12, 13, 10, '#120e18'); disc(12, 13, 9, dk); }
  if (m === 'maw') { disc(12, 13, 8, '#07050a'); disc(12, 13, 6, '#2a0a10'); for (let k = 0; k < 6; k++) { r(6 + k * 2, 7 + (k % 2), 1, 3, '#f5efe0'); r(6 + k * 2, 17 - (k % 2), 1, 3, '#f5efe0'); } r(9, 12, 6, 2, '#c8303a'); }
  if (m === 'teeth') { for (let k = 0; k < 5; k++) { x.fillStyle = '#f5efe0'; x.beginPath(); x.moveTo(3 + k * 4, 20); x.lineTo(5 + k * 4, 6 + (k % 2) * 3); x.lineTo(7 + k * 4, 20); x.fill(); } r(2, 20, 20, 2, col); }
  if (m === 'spore') { [[7, 8, 3], [15, 7, 2], [12, 14, 4], [6, 17, 2], [18, 16, 3]].forEach(([a, b, s]) => { disc(a, b, s, col); disc(a - 1, b - 1, Math.max(1, s - 2), '#fff3a0'); }); }
  if (m === 'egg') { [[8, 14], [15, 12], [12, 18]].forEach(([a, b]) => { disc(a, b, 4, '#e8e0c0'); disc(a, b, 3, col); r(a - 1, b - 2, 1, 1, '#fff'); }); }
  if (m === 'eye') { disc(12, 12, 9, '#e8e0d0'); disc(12, 12, 5, col); r(11, 8, 2, 8, '#07050a'); r(9, 9, 2, 1, '#ffffff'); }
  if (m === 'wave') { for (let k = 0; k < 3; k++) for (let i = 0; i < 20; i++) r(2 + i, 7 + k * 5 + Math.round(Math.sin(i * 0.6 + k) * 2), 1, 2, k === 1 ? '#ffffff' : col); }
  if (m === 'tent') { for (let k = 0; k < 3; k++) for (let i = 0; i < 18; i++) disc(5 + k * 7 + Math.round(Math.sin(i * 0.5 + k) * 2), 21 - i, Math.max(1, 2 - Math.floor(i / 8)), i % 4 ? col : dk); }
  if (m === 'pulse') { disc(12, 13, 7, col); disc(12, 13, 4, '#fff3a0'); r(2, 12, 6, 2, col); r(16, 12, 6, 2, col); }
  if (m === 'shell') { disc(12, 13, 9, '#cfc8b4'); disc(12, 13, 7, dk); for (let k = 0; k < 4; k++) r(5, 8 + k * 3, 14, 1, '#cfc8b4'); }
  if (m === 'star') { r(11, 2, 2, 20, col); r(2, 11, 20, 2, col); r(7, 7, 10, 10, dk); disc(12, 12, 3, '#fff3a0'); }
  if (m === 'drop') { for (let j = 0; j < 14; j++) r(12 - Math.round(j / 2), 4 + j, Math.round(j) + 1, 1, col); disc(12, 17, 6, col); r(9, 13, 2, 3, '#ffffff'); }
  if (m === 'brand') { disc(12, 12, 9, dk); r(11, 4, 2, 16, col); r(5, 11, 14, 2, col); disc(12, 12, 3, '#fff3a0'); }
  if (m === 'thorn') { for (let k = 0; k < 6; k++) { x.strokeStyle = k % 2 ? '#5a2a3a' : '#2a1018'; x.lineWidth = 2; x.beginPath(); x.moveTo(12, 12); x.lineTo(12 + Math.cos(k) * 11, 12 + Math.sin(k) * 11); x.stroke(); } disc(12, 12, 4, '#07050a'); r(11, 11, 2, 2, '#c8303a'); }
  return (CMART[key] = c);
}
// 몸이 다시 쓴 카드: 본디 그림 위에 형질 무늬를 덧그리고, 테두리를 형질 빛깔로
const CMGCOL = { maw: '#ff5f57', spore: '#8fd05f', eye: '#b08fff', water: '#3ac0d8', bone: '#e8e0c8', tent: '#3aa890', egg: '#f0e0a0', spike: '#d8a060', face: '#f0b090', gut: '#b8d040', shadow: '#8a7aaa', star: '#fff3a0', trap: '#e8a860', alone: '#d07040', swarm: '#7ac050', shell: '#90a8c0', wing: '#b080d8', glow: '#ffe060', root: '#a07a48', mirror: '#c8e0f0', tongue: '#ff8aa8', horn: '#d8c8a0' };
const cmGeneTag = v => { const g = v && v.gene; return g && g.length ? g[g.length - 1] : null; };
function cmGeneArt(v) {
  const tag = cmGeneTag(v), key = 'g:' + v.id; if (CMART[key]) return CMART[key];
  const d = cmDef(v.id) || {}, src = d.from ? Object.assign({}, v, { id: d.from, gene: null }) : v, base = cmArtCanvas(src);
  const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(base, 0, 0, 24, 24);
  const col = CMGCOL[tag] || '#fff3a0', r = (a, b, w, h, k) => { x.fillStyle = k; x.fillRect(a, b, w, h); }, dot = (a, b, k) => { r(a, b, 2, 2, '#07050a'); r(a, b, 1, 1, k || col); };
  const fam = { spore: 'dots', egg: 'dots', swarm: 'dots', glow: 'dots', star: 'dots', eye: 'eye', mirror: 'eye', water: 'wave', tongue: 'wave', bone: 'bars', shell: 'bars', spike: 'bars', horn: 'bars', tent: 'curl', root: 'curl', shadow: 'curl', wing: 'curl', maw: 'teeth', gut: 'teeth', trap: 'teeth', face: 'face', alone: 'one' }[tag] || 'dots';
  if (fam === 'dots') [[2, 3], [18, 2], [3, 18], [20, 17], [11, 1]].forEach(([a, b]) => dot(a, b));
  if (fam === 'eye') { r(16, 1, 7, 5, '#07050a'); r(17, 2, 5, 3, '#f5efe0'); r(19, 2, 2, 3, col); r(19, 3, 1, 1, '#07050a'); }
  if (fam === 'wave') for (let i = 0; i < 24; i++) r(i, 20 + Math.round(Math.sin(i * 0.8) * 1.5), 1, 2, col);
  if (fam === 'bars') for (let k = 0; k < 3; k++) { r(1, 3 + k * 7, 4, 2, '#07050a'); r(1, 3 + k * 7, 3, 1, col); r(20, 6 + k * 7, 4, 2, '#07050a'); r(21, 6 + k * 7, 3, 1, col); }
  if (fam === 'curl') for (let i = 0; i < 9; i++) { r(1 + Math.round(Math.sin(i * 0.7) * 1.5), 23 - i * 2, 2, 2, col); r(21 + Math.round(Math.cos(i * 0.7) * 1.5), 23 - i * 2, 2, 2, col); }
  if (fam === 'teeth') for (let k = 0; k < 6; k++) { r(1 + k * 4, 0, 3, 3, '#07050a'); r(2 + k * 4, 0, 1, 2, '#f5efe0'); r(1 + k * 4, 21, 3, 3, '#07050a'); r(2 + k * 4, 22, 1, 2, '#f5efe0'); }
  if (fam === 'face') { r(16, 1, 7, 7, '#07050a'); r(17, 2, 5, 5, col); r(18, 3, 1, 1, '#07050a'); r(20, 3, 1, 1, '#07050a'); r(18, 5, 3, 1, '#7a3a2a'); }
  if (fam === 'one') { r(18, 1, 5, 5, '#07050a'); r(19, 2, 3, 3, col); }
  return (CMART[key] = c);
}
// 카드 그림: 종류마다 다른 무대(기관은 살 방, 부위는 굴 바닥, 권속은 동굴, 기술은 표식, 굴은 흙 도면) 위에 본디 무늬를 얹는다. 48x36
const cmHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function cmScene(v) {
  const gt = cmGeneTag(v), key = 'sc:' + v.id + (gt ? ':' + gt : '') + ':' + (v.type || ''); if (CMART[key]) return CMART[key];
  const W = 48, H = 36, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const col = v.type === 'curse' ? '#c8303a' : cmCol(v.asp), dk = CMDARK[v.asp] || CMDARK.none; let h = cmHash(v.id);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h ^= h >>> 13; return (h % 1000) / 1000; };
  const r = (a, b, w, hh, k) => { x.fillStyle = k; x.fillRect(a, b, w, hh); }, al = (k, aa) => { x.globalAlpha = aa; return k; };
  const ell = (cx, cy, rx, ry, k) => { x.fillStyle = k; for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry)))); x.fillRect(cx - w, cy + j, w * 2 + 1, 1); } };
  const grad = (a, b) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const t = v.type;
  if (t === 'organ') {
    grad('#1a0a10', '#0a0508'); ell(24, 19, 21, 15, '#3a1218'); ell(24, 19, 19, 13, dk); ell(24, 21, 15, 9, '#1a0810');
    for (let k = 0; k < 6; k++) { let px = 4 + rnd() * 40, py = 5 + rnd() * 26; x.globalAlpha = 0.55; for (let i = 0; i < 9; i++) { r(Math.round(px), Math.round(py), 1, 1, col); px += rnd() * 2 - 0.6; py += rnd() * 2 - 1; } x.globalAlpha = 1; }
    r(10, 9, 3, 1, al('#ffd0d8', 0.5)); r(33, 26, 2, 1, '#ffd0d8'); x.globalAlpha = 1;
  } else if (t === 'trap') {
    grad('#0e0b14', '#1c1622'); r(0, 25, W, 11, '#2a2230'); r(0, 25, W, 1, '#4a3c52');
    for (let k = 0; k < 10; k++) r(Math.floor(rnd() * W), 27 + Math.floor(rnd() * 8), 2, 1, '#3a3044');
    for (let k = 0; k < 4; k++) { const sx = 4 + rnd() * 40; for (let i = 0; i < 4 + rnd() * 5; i++) r(Math.round(sx), i, 1, 1, '#2a2232'); }
    x.globalAlpha = 0.35; ell(24, 28, 14, 3, col); x.globalAlpha = 1;
  } else if (t === 'kin') {
    grad('#141020', '#0a0810'); r(0, 29, W, 7, '#221a2a'); for (let k = 0; k < 6; k++) { const sx = Math.floor(rnd() * W), ln = 3 + Math.floor(rnd() * 6); for (let i = 0; i < ln; i++) r(sx + (i > ln / 2 ? 1 : 0), i, Math.max(1, 3 - Math.floor(i / 2)), 1, '#2a2236'); }
    x.globalAlpha = 0.28; ell(24, 22, 16, 12, col); x.globalAlpha = 1;
  } else if (t === 'skill' || t === 'boon') {
    grad('#120e1c', '#07050c');
    const ring = (rad, k, dash) => { for (let a = 0; a < 64; a++) { if (dash && a % 4 === 0) continue; const an = a / 64 * Math.PI * 2; r(Math.round(24 + Math.cos(an) * rad), Math.round(18 + Math.sin(an) * rad * 0.82), 1, 1, k); } };
    x.globalAlpha = 0.9; ring(16, col, false); x.globalAlpha = 0.6; ring(12, col, true); x.globalAlpha = 1;
    for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2 + rnd() * 0.2; const px = Math.round(24 + Math.cos(an) * 16), py = Math.round(18 + Math.sin(an) * 13); r(px - 1, py - 1, 3, 3, '#07050a'); r(px, py, 1, 1, t === 'boon' ? '#fff3a0' : '#ffffff'); }
    if (t === 'boon') { x.globalAlpha = 0.25; for (let k = 0; k < 7; k++) { const an = k / 7 * Math.PI * 2; x.strokeStyle = '#fff3a0'; x.beginPath(); x.moveTo(24, 18); x.lineTo(24 + Math.cos(an) * 26, 18 + Math.sin(an) * 22); x.stroke(); } x.globalAlpha = 1; }
  } else if (t === 'curse') {
    grad('#2a0810', '#07020a'); for (let k = 0; k < 7; k++) { x.strokeStyle = k % 2 ? '#4a1420' : '#2a0a12'; x.lineWidth = 2; x.beginPath(); x.moveTo(rnd() * W, 0); x.lineTo(rnd() * W, H); x.stroke(); }
  } else {
    grad('#3a2a1c', '#22180f'); for (let k = 0; k < 40; k++) r(Math.floor(rnd() * W), Math.floor(rnd() * H), 1, 1, rnd() < 0.5 ? '#4a3a28' : '#1a120a');
    x.globalAlpha = 0.25; for (let i = 0; i < W; i += 6) r(i, 0, 1, H, '#c8a070'); for (let j = 0; j < H; j += 6) r(0, j, W, 1, '#c8a070'); x.globalAlpha = 1;
  }
  const mot = gt ? cmGeneArt(v) : cmArtCanvas(v);
  if (t === 'kin') { const sz = Math.min(30, Math.max(20, mot.width * 1.5)); x.drawImage(mot, Math.round(24 - sz / 2), Math.round(31 - sz), sz, sz); }
  else { x.drawImage(mot, 12, t === 'trap' ? 5 : 6, 24, 24); }
  x.globalAlpha = 0.12; r(0, 0, W, H, col); x.globalAlpha = 1;
  r(0, 0, W, 1, '#07050a'); r(0, H - 1, W, 1, '#07050a'); r(0, 0, 1, H, '#07050a'); r(W - 1, 0, 1, H, '#07050a');
  return (CMART[key] = c);
}
const cmArtUrl = v => { const c = cmScene(v); return c.__u || (c.__u = c.toDataURL()); };
// 카드 앞면 (.dkc 꼴을 그대로 쓴다)
const CMTYPE = { shape: '굴', organ: '기관', trap: '부위', kin: '권속', skill: '기술', boon: '축복', curse: '저주' };
// 카드 판에서 옛 판의 말을 카드 판 말로 (정신 → 넋, 정수 → 빛깔, n라운드 → n차례 …)
const CMWORDS = [[/정신력/g, '넋'], [/정신 ([−-])/g, '넋 $1'], [/포로 밥값/g, '붙잡아 둔 것 먹이'], [/진액 방울/g, '진액'], [/정수가/g, '빛깔이'], [/정수를/g, '빛깔을'], [/정수는/g, '빛깔은'], [/정수와/g, '빛깔과'], [/정수/g, '빛깔'], [/(\d+)라운드/g, '$1차례'], [/\s*\(익숙해짐 [−-]\d+%\)/g, '']];
const cmWords = s => { if (s == null) return s; s = String(s); for (const [a, b] of CMWORDS) s = s.replace(a, b); return s; };
function cmFace(v, o) {
  o = o || {}; if (!v) return ''; const d = cmDef(v.id) || {}, cost = o.cost != null ? o.cost : v.cost;
  const gt = cmGeneTag(v), cls = 'dkc asp-' + (v.asp || 'none') + ' rar-' + (v.type === 'curse' ? 'x' : v.rar) + ' t-' + v.type + (gt ? ' gene' : '') + (o.cls ? ' ' + o.cls : '');
  const tx = cmWords(o.text != null ? o.text : (v.face || v.text));
  return `<div class="${cls}"${gt ? ` style="--gc:${CMGCOL[gt] || '#fff3a0'}"` : ''}${o.c ? ` data-c="${o.c}"` : ''}${o.uid != null ? ` data-uid="${o.uid}"` : ''}${o.i != null ? ` data-i="${o.i}"` : ''} data-id="${v.id}"><b class="dkc-cost${o.faith || v.type === 'skill' ? ' faith' : ''}">${v.type === 'curse' ? '✕' : v.type === 'skill' && !o.faith ? cmSkillCost(d) : cost}</b><i class="dkc-gem"></i><span class="dkc-art"><img src="${cmArtUrl(v)}" alt="" draggable="false">${gt ? `<i class="dkc-gene">${esc(cmTagName(gt))}</i>` : ''}</span><b class="dkc-nm">${esc(cmWords(v.name))}</b><span class="dkc-tx">${esc(tx)}</span><i class="dkc-ty">${CMTYPE[v.type] || ''}${d.asp && d.asp !== 'none' ? ' · ' + CARDS2.ASPN[d.asp] : ''}</i></div>`;
}
// 기술 카드의 신앙 값 (밤에 실제로 드는 값과 같은 셈)
const cmSkillCost = d => { try { const base = typeof G !== 'undefined' && G && NEST.spellCost && d.spell ? NEST.spellCost(G, d.spell) : 3; return Math.max(1, Math.ceil(base * (d.cmul || 1))); } catch (e) { return Math.max(1, Math.ceil(3 * (d.cmul || 1))); } };
const cmDefView = (id, up) => CMU.run ? CARDMODE.view(CMU.run, { uid: 0, id, up: up || 0 }) : cmBareView(id, up);
function cmBareView(id, up) { const d = cmDef(id); return { uid: 0, id, name: d.name + (up ? '+' : ''), type: d.type, asp: d.asp, rar: d.rar, cost: d.type === 'skill' ? 0 : d.cost, text: d.text, more: d.more, up: up || 0 }; }
const CMUPTXT = { shape: '진액이 덜 든다', organ: '방이 한 단계 높게 돋는다', trap: '함정 단계 +1', kin: '권속이 두 단계 높게 든다', skill: '세기 ×1.3, 신앙이 덜 든다', boon: '효과가 커진다' };

// ---- 뼈대 ----
function cmMount() {
  if ($('cm-ov')) return;
  const ov = document.createElement('div'); ov.id = 'cm-ov'; ov.hidden = true; document.body.appendChild(ov);
  const sh = document.createElement('div'); sh.id = 'cm-sheet'; sh.hidden = true; document.body.appendChild(sh);
  const tt = document.createElement('div'); tt.id = 'cm-toast'; tt.hidden = true; document.body.appendChild(tt);
  const cv = document.createElement('canvas'); cv.id = 'cmov'; $('stagewrap').insertBefore(cv, $('mapchips')); CMU.ov = cv;
  const hb = document.createElement('div'); hb.id = 'chand'; hb.hidden = true; $('handbar').insertBefore(hb, $('hand'));
  document.addEventListener('click', cmClick);
  document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('.dkc'); CMU.down = { x: e.clientX, y: e.clientY }; if (!el || !cmOnScreen()) return; clearTimeout(CMU.lpT); CMU.lpT = setTimeout(() => { CMU.lpEl = el; CMU.lpAt = Date.now(); cmDetail(el.dataset.id, el.dataset.uid); }, 480); });
  ['pointerup', 'pointercancel'].forEach(k => document.addEventListener(k, () => clearTimeout(CMU.lpT)));
  // 끌어서 놓기: 손의 카드를 위로 끌어 지도에 놓는다 (옆으로 끌면 띠가 밀린다)
  document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('#chand .cm-hand .dkc'); if (!el || !cmOn() || ST.mode !== 'day' || busy || el.dataset.uid == null) return; CMU.drag = { uid: +el.dataset.uid, x0: e.clientX, y0: e.clientY, on: false }; });
  document.addEventListener('pointermove', e => { const d = CMU.drag; if (!d) return; if (!d.on) { const dx = e.clientX - d.x0, dy = e.clientY - d.y0; if (Math.hypot(dx, dy) > 10) clearTimeout(CMU.lpT); if (dy < -16 && Math.abs(dy) > Math.abs(dx) * 1.1) cmDragStart(e); else return; } e.preventDefault(); cmDragMove(e); }, { passive: false });
  document.addEventListener('pointerup', e => { if (CMU.drag && CMU.drag.on) cmDragEnd(e); CMU.drag = null; });
  document.addEventListener('pointercancel', () => { if (CMU.drag && CMU.drag.on) cmDragEnd(null); CMU.drag = null; });
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.dkc') && cmOnScreen()) e.preventDefault(); });
  // 카드 판에서 연 도움말은 카드 판 것으로 (ui.js 의 도움말은 다른 판 설명이다)
  window.addEventListener('click', e => { const h = e.target.closest && e.target.closest('[data-a="help"]'); if (!h || !CMU.run || !G || !G.cardMode || $('game').hidden) return; e.stopImmediatePropagation(); e.preventDefault(); if (!$('modal').hidden) closeModal(); cmSheet('help', cmHelpHtml()); }, true);
  // 카드를 들고 있을 때 지도를 누르면: 원래 게임의 칸 고르기보다 먼저 받는다
  window.addEventListener('click', e => {
    if (Date.now() - (CMU.dragEnd || 0) < 450 && cmOn()) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (e.target.id !== 'stage' || !cmOn() || ST.mode !== 'day' || CMU.sel == null || busy) return;
    if (CMU.down && Math.hypot(e.clientX - CMU.down.x, e.clientY - CMU.down.y) > 10) return;
    const [sx, sy] = stagePoint(e), col = Math.floor((sx - GX) / CW), row = Math.floor((sy - GY) / CH);
    if (col < 0 || row < 0 || col >= G.cols || row >= G.rows || ST.screen !== 'under') return;
    e.stopImmediatePropagation(); e.preventDefault(); cmTapCell(row * G.cols + col);
  }, true);
}
const cmOnScreen = () => !!CMU.run && ($('cm-ov') && (!$('cm-ov').hidden || !$('game').hidden));
function cmOv(html, cls) { const o = $('cm-ov'); if (!html) { o.hidden = true; o.innerHTML = ''; o.className = ''; return; } o.className = cls || ''; o.innerHTML = html; o.hidden = false; o.scrollTop = 0; }
function cmSheet(kind, html) { const s = $('cm-sheet'); CMU.sheet = kind; if (!kind) { s.hidden = true; s.innerHTML = ''; return; } s.innerHTML = `<div class="dk-grab"></div><button class="btn sm dk-x" data-c="close" aria-label="닫기">✕</button>${html}`; s.hidden = false; s.scrollTop = 0; }
let cmToastT = 0;
function cmToast(s) { const t = $('cm-toast'); if (!t) return; s = cmText(String(s || '').replace(/([+−-]?\d[\d,]*)\s*방울/g, '진액 $1')); if (!s) return; t.textContent = s; t.hidden = false; clearTimeout(cmToastT); cmToastT = setTimeout(() => { t.hidden = true; }, 2600); }
// 접어 두는 글: 누르면 펼친다
const cmFold = (label, html) => `<button class="btn sm cm-fold" data-c="fold">${label}</button><div class="cm-foldc" hidden>${html}</div>`;
const cmSnd = k => { try { sfx(k); } catch (e) { /* 소리는 없어도 된다 */ } };

// ---- 시작 ----
const CMASP = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
function cardOpen() {
  cmMount(); const m = cmMeta(); $('title').hidden = true; $('game').hidden = true; G = null; CMU.run = null;
  CMU.asp = CMU.asp || 'brood'; CMU.look = CMU.look || 'drop'; CMU.egg = null;
  // 처음 하는 사람: 여는 이야기 → 짧은 한 방울 → 그 몸으로 첫 판 (자동 시험에서는 window.__forceOpening 일 때만)
  const first = !m.opened && !(m.runs > 0) && !store.get('cardrun') && typeof playOpening === 'function' && !(navigator.webdriver && !window.__forceOpening);
  if (first) return cmOpening({}); cmStart();
}
// 한 방울부터: 여는 이야기(처음만)와 짧은 한 방울을 하고, 돌려받은 씨앗으로 판을 연다
async function cmOpening(o) {
  o = o || {}; cmOv(null); cmSheet(null); $('game').hidden = true; $('title').hidden = true;
  const noFilm = !!o.noFilm || !!(navigator.webdriver && !window.__forceIntro);
  const open = window.playOpening || playOpening; let seed = null; try { seed = await open(Object.assign({}, o, { noFilm })); } catch (e) { console.error(e); seed = null; }
  const m = cmMeta(); m.opened = 1; saveMeta();
  if (!seed) return cmStart();
  if (seed.aspect) CMU.asp = seed.aspect; if (seed.look) CMU.look = seed.look;
  cmBeginWith(seed);
}
// 빛깔마다 한 줄: 어떤 판이 되나
const CMASPD = { abyss: '함정과 물로 삼킨다 · 느리게 자란다', nebula: '기술 카드로 끼어든다 · 빨리 일그러진다', brood: '권속과 움이 떼로 막는다', dusk: '사람을 홀리고 믿게 만든다', hunger: '본체가 직접 먹어 치운다' };
// 처음 몸 미리보기: 고른 빛깔과 몸으로 첫날의 몸을 그린다 (실제 판의 첫 몸과 같다)
function cmLookGenome(a, k) { if (typeof TRAITS === 'undefined') return null; const g = TRAITS.newGenome({ norm: true, aspect: a, seed: TRAITS.hash ? TRAITS.hash('look' + k) : 7, stage: 1, look: k }); TRAITS.addBehaviour(g, {}); return g; }
function cmStart() {
  const m = cmMeta(), a = CMU.asp, saved = store.get('cardrun'), looks = Object.keys(SEEDS).slice(0, 15), start = CARDS2.START[a] || [];
  const eggs = m.eggs.slice(-3).reverse(), lk = SEEDS[CMU.look] || {}, ls = TRAITS.LOOKSEED && TRAITS.LOOKSEED[CMU.look], lt = ls ? Object.keys(ls).sort((p, q) => ls[q] - ls[p])[0] : null;
  const big = cmLookGenome(a, CMU.look);
  cmOv(`<div class="dk-start cm-start"><h2>새 판</h2>
<div class="cm-sbody">${big ? cmBodyImg(big, isMobile() ? 96 : 120) : ''}<div><b>${esc(lk.name || '')}</b>${lt ? `<p class="small">처음부터 <b style="color:${CMGCOL[lt] || '#fff3a0'}">${esc(cmTagName(lt))}</b></p>` : ''}<p class="small mute">${esc(NEST.ASP[a])}</p></div></div>
<div class="dk-row2 cm-sgo"><button class="btn pri" data-c="begin">이 몸으로 시작</button>${typeof playOpening === 'function' ? '<button class="btn" data-c="fromdrop">한 방울부터</button>' : ''}</div>
<p class="dk-lab">빛깔</p><div class="dk-asps">${CMASP.map(x => `<button class="dk-asp${x === a ? ' on' : ''}" style="--c:${cmCol(x)}" data-c="asp" data-v="${x}" title="${esc(CMASPD[x] || '')}"><i></i>${NEST.ASP[x]}</button>`).join('')}</div>
<p class="dk-lab">처음 몸</p><div class="cm-looks">${looks.map(k => `<button class="cm-look${k === CMU.look ? ' on' : ''}" data-c="look" data-v="${k}" title="${esc(SEEDS[k].say || '')}">${cmBodyImg(cmLookGenome(a, k), 36)}<span>${esc(SEEDS[k].name)}</span></button>`).join('')}</div>
${eggs.length ? `<p class="dk-lab">남긴 알</p><div class="cm-eggs"><button class="cm-egg${CMU.egg == null ? ' on' : ''}" data-c="egg" data-v="-1"><span>없이</span></button>${eggs.map((e, k) => { const g = cmEggGenome(e); return `<button class="cm-egg${CMU.egg === k ? ' on' : ''}" data-c="egg" data-v="${k}">${cmBodyImg(g, 40)}<span>${esc(e.name || '알')}</span></button>`; }).join('')}</div>` : ''}
${cmFold('처음 덱 ' + start.length + '장 보기', `<div class="dk-row dk-mini">${start.map(id => cmFace(cmBareView(id), { cls: 'mini' })).join('')}</div>`)}
<div class="dk-row2">${saved && saved.G && !saved.G.over ? `<button class="btn" data-c="cont">이어하기 <small>${saved.G.day}일</small></button>` : ''}<button class="btn" data-c="codex">도감</button><button class="btn" data-c="home">돌아가기</button></div></div>`, 'dk-full');
}
function cmEggGenome(e) { if (typeof TRAITS === 'undefined') return null; const g = TRAITS.newGenome({ aspect: e.aspect || 'brood', stage: 2, seed: TRAITS.hash ? TRAITS.hash(String(e.name || 'egg')) : 7 }); g.tags = Object.assign({}, e.tags || {}); return g; }
function cmBegin() { cmBeginWith(null); }
function cmBeginWith(pro) {
  const m = cmMeta(), egg = CMU.egg != null ? m.eggs.slice(-3).reverse()[CMU.egg] : null, seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const run = CARDMODE.newRun(seed, pro ? { aspect: pro.aspect || CMU.asp, look: pro.look || undefined, proSeed: pro, meta: m, egg: egg || undefined, diff: 2 } : { aspect: CMU.asp, look: CMU.look, meta: m, egg: egg || undefined, diff: 2 });
  if (egg) run.egg = egg;
  cmGo(run); if (!cmTutOn()) cmToast('카드를 누르면 놓을 수 있는 칸이 빛난다');
  if (!(navigator.webdriver && !window.__forceWorldLine) && CMWORLD[G.world]) setTimeout(() => { if (CMU.run === run && typeof scene === 'function') scene([N_(CMWORLD[G.world])]); }, 300);
}
// 판마다 둥지 위가 어떤 세상인지는 뚫린 뒤에야 안다: 한 문장으로만 알린다
const CMWORLD = { fantasy: '굴 위에서 쇠와 향과 종소리가 내려왔다. 위는 성벽과 기도의 세상이었다.', wuxia: '굴 위에서 칼집 스치는 소리와 향 연기가 내려왔다. 위는 산과 문파의 세상이었다.', modern: '굴 위에서 꺼지지 않는 전깃불의 웅웅거림이 내려왔다. 위는 밤에도 잠들지 않는 세상이었다.', future: '굴 위에서 숨 쉬지 않는 쇠붙이들의 박동이 내려왔다. 위는 사람보다 기계가 많은 세상이었다.' };
function cmGo(run) {
  CMU.run = run; G = run.G; CMU.sel = null; CMU.place = null; CMU.learnedN = (run.learned || []).length; CMU.eggLaid = false; cmOv(null); cmSheet(null);
  showGame(); busy = false; cmSave();
  if (!CMU.raf) CMU.raf = requestAnimationFrame(cmLoop);
  if (run.phase === 'reward') setTimeout(() => cmAfterNightReward(), 200);
  else if (run.nightLock && run.nightLock.day === run.G.day && run.phase === 'day') setTimeout(() => cardNight((run.nightLock.keep || []).filter(u => run.hand.includes(u))), 250);
}
function cmContinue() { cmMount(); cmMeta(); const run = cmLoad(); if (!run) return cmStart(); cmGo(run); }

// ---- 위쪽 줄과 아래 줄 (ui.js 의 hud/tray 대신) ----
function cardHud() {
  const g = cmGenome();
  $('hud').innerHTML = `<button class="hbar" data-c="body" title="내 몸 보기"><span class="cm-por">${g ? cmBodyImg(g, 26) : ''}</span><span class="hud-turn">${G.day}일 <small class="mute">/${NEST.K.days}<span class="cm-act"> · ${NEST.actOf(G)}막</span></small></span><span class="hstat" title="진액: 카드를 놓고 사는 데 든다">${iconImg('gold')}<b class="num coin">${R(Math.max(0, (ST.hud || G).gold))}</b><small class="cm-lb">진액</small></span><span class="hstat cm-faith" title="신앙: 밤의 기술 카드에 든다">${iconImg('faith')}<b class="num">${Math.floor((ST.hud || G).faith)}</b><small class="cm-lb">신앙</small></span><span class="hstat">${lifePips()}</span></button><button class="btn sm hmenu" data-a="menu" aria-label="메뉴" title="메뉴">≡</button>`;
  document.documentElement.style.setProperty('--hud-h', $('hud').offsetHeight + 'px');
}
const cmUpkeep = () => { if (!CMU.run || typeof CARDMODE.upkeepWarn !== 'function') return null; try { const u = CARDMODE.upkeepWarn(CMU.run); const lv = u && Array.isArray(u.leaving) ? u.leaving : [], n = lv.length || (u && +u.short) || 0; return u && n > 0 ? { leaving: lv, n, days: u.days } : null; } catch (e) { return null; } };
function cardTray() {
  const run = CMU.run; if (!run) return;
  const cmb = NEST.cardCombos(G), names = [...new Set(cmb.map(c => c.name))], ch = [], mob = isMobile(), add = (p, h) => ch.push({ p, h });
  const uw = cmUpkeep();
  if (uw) add(10, `<button class="chip cm-warn" data-c="upkeep">⚠ 권속 ${uw.n} 떠남</button>`);
  if (G.march.tonight) add(9, cmThreatChip());
  if (run.needleOffer) add(8, `<button class="chip todo hot" data-c="needle">✦ 바늘 점</button>`);
  const h = cmHints()[0]; if (h && CMU.sel == null) add(5, `<button class="chip cm-hint" data-c="hint">한 장 더면 ${esc(h.name)}</button>`);
  if (mob && names.length) add(4, `<button class="chip cm-cmb" data-c="combos">◇ 족보 ${names.length}</button>`); else names.forEach(n => add(4, `<button class="chip cm-cmb" data-c="combos">◇ ${esc(n)}</button>`));
  add(3, `<button class="chip cm-deckchip" data-c="deck">덱 ${run.deck.length} <small class="mute">· 남은 ${run.drawP.length}</small></button>`);
  if (mob) add(2, `<button class="chip cm-zoom" data-c="zoom">${CMU.zoom === 'near' ? '⤢ 전체' : '⤡ 가까이'}</button>`);
  ch.sort((a, b) => b.p - a.p); CMU.chipsAll = ch.map(x => x.h);
  const shown = mob && ch.length > 3 ? ch.slice(0, 2).map(x => x.h).concat([`<button class="chip cm-more" data-c="chips">… ${ch.length - 2}</button>`]) : ch.map(x => x.h);
  $('mapchips').innerHTML = ST.mode === 'day' ? shown.join('') : '';
  const ib = (c, v, icon, label, extra, cls) => `<button class="btn ib ${cls || ''}" data-c="${c}"${v ? ` data-v="${v}"` : ''}>${icon}<span>${label}</span>${extra || ''}</button>`;
  $('game').classList.add('cm'); cmBodyBand();
  $('mnav').innerHTML = ib('deck', null, '<span class="gl">▤</span>', '덱') + ib('shop', null, iconImg('gold', 20), '상점') + ib('up', null, '<span class="gl">✚</span>', '강화') + ib('rm', null, '<span class="gl">✕</span>', '빼기') + `<button class="btn ib" data-c="body">${cmBodyImg(cmGenome(), 22)}<span>몸</span></button>` + `<button class="btn pri end" data-c="night"><span>밤 맞기</span></button>`;
}
// 아래 손: 낮에는 받은 카드, 밤에는 쥔 기술 카드(흐리게)
function cmHand() {
  const el = $('chand'), run = CMU.run; if (!el || !run) return;
  if (ST.mode === 'night') {
    const held = (G.cardHeld || []).filter(h => !h.used).map(h => cmCard(h.uid)).filter(Boolean);
    el.hidden = !held.length || !$('hand').hidden; el.innerHTML = held.length ? `<div class="dk-hand cm-held" style="--n:${held.length}">${held.map(c => cmFace(CARDMODE.view(run, c), { cls: 'mini dim', night: true })).join('')}</div>` : '';
    return;
  }
  const hv = CARDMODE.handView(run); el.hidden = false;
  const sel = hv.find(v => v.uid === CMU.sel);
  let bar = '';
  if (sel) {
    if (sel.type === 'skill') bar = `<p class="cm-tip">밤에 무리가 방에 들면 쓴다</p><div class="cm-acts">${btn('x', null, '닫기', 'sm')}</div>`;
    else if (sel.target === 'shape') bar = CMU.place ? `<div class="cm-acts"><button class="btn" data-c="rot">↻ 돌리기</button><button class="btn pri" data-c="put">놓기 ${sel.cost}</button><button class="btn" data-c="unsel">취소</button></div>` : `<p class="cm-tip">빛나는 칸을 누른다</p><div class="cm-acts"><button class="btn" data-c="unsel">취소</button></div>`;
    else if (sel.target === 'cell') bar = `<p class="cm-tip">${sel.can ? '빛나는 칸을 누른다' : esc(sel.why)}</p><div class="cm-acts"><button class="btn" data-c="unsel">취소</button></div>`;
    else bar = `<div class="cm-acts">${sel.can ? `<button class="btn pri" data-c="put">내기 ${sel.cost || ''}</button>` : `<span class="cm-tip">${esc(sel.why)}</span>`}<button class="btn" data-c="unsel">취소</button></div>`;
  }
  const deal = CMU.dealDay !== G.day; CMU.dealDay = G.day; if (deal && hv.length) cmSnd('click');
  el.innerHTML = `${bar}<span class="cm-cnt">손 ${hv.length}</span><div class="dk-hand cm-hand cm-strip${deal ? ' cm-deal' : ''}" style="--n:${hv.length}">${hv.map(v => cmFace(v, { c: 'card', uid: v.uid, cls: (isMobile() ? 'mini ' : '') + (v.uid === CMU.sel ? 'lift' : '') + (v.can || v.type === 'skill' ? '' : ' no') })).join('') || '<p class="small mute">손이 비었다 · 밤을 맞는다</p>'}</div>`;
}
function cardRender() { cmHand(); cmBodyBand(); cmCoach(); const mc = $('mapchips'); if (mc) mc.classList.toggle('cm-lift', isMobile() && (CMU.sel != null || !!(CMU.drag && CMU.drag.on))); }

// ---- 고르고 놓기 ----
function cmSelect(uid) { CMU.sel = uid; CMU.place = null; CMU.alts = []; CMU.altI = 0; CMU.tapCell = null; if (uid != null && ST.screen !== 'under') setScreen('under'); UI.sel = null; render(); }
function cmTapCell(i) {
  const run = CMU.run, v = CARDMODE.handView(run).find(x => x.uid === CMU.sel); if (!v) return;
  if (v.target === 'cell') { if ((v.cellsCan || []).includes(i)) return cmPlay(v.uid, { cell: i }); cmToast('그 칸에는 못 놓는다'); cmSnd('down'); return; }
  if (v.target === 'shape') {
    const alts = cmPlaces(v).filter(p => p.cells.includes(i)); if (!alts.length) { cmToast('그 자리에는 못 판다'); cmSnd('down'); return; }
    if (CMU.tapCell === i && CMU.alts.length) { CMU.altI = (CMU.altI + 1) % CMU.alts.length; } else { CMU.alts = alts; CMU.altI = 0; CMU.tapCell = i; }
    CMU.place = CMU.alts[CMU.altI]; cmSnd('click'); render(); return;
  }
}
// 굴 카드가 놓일 수 있는 자리들 ({ cells, rot })
const cmPlaces = v => CARDMODE.shapePlacements(CMU.run, cmDef(v.id));
function cmRotate() { if (!CMU.alts.length) return; CMU.altI = (CMU.altI + 1) % CMU.alts.length; CMU.place = CMU.alts[CMU.altI]; cmSnd('click'); render(); }
function cmPlay(uid, tgt) {
  const run = CMU.run, c = cmCard(uid), d = c && cmDef(c.id), r = CARDMODE.play(run, uid, tgt || {});
  if (!r.ok) { cmToast(r.msg || '놓을 수 없다'); cmSnd('down'); return; }
  CMU.sel = null; CMU.place = null; CMU.alts = []; CMU.tapCell = null; CMU.hintKey = '';
  cmSnd('card'); if (d && d.type === 'shape') setTimeout(() => cmSnd('thud'), 90); else if (d && d.type === 'kin') cmSnd('up'); cmToast(r.msg);
  { let cells = (tgt && tgt.cells) || (tgt && tgt.cell != null ? [tgt.cell] : []); if (!cells.length && d && d.type === 'kin') { const k = G.kin.slice().sort((a, b) => b.id - a.id)[0]; if (k && typeof k.loc === 'number') cells = [k.loc]; } if (cells.length) (CMU.fx = CMU.fx || []).push({ cells, t0: performance.now(), col: d ? cmCol(d.asp) : '#fff3a0', big: d && d.type === 'shape' }); if (d && d.type === 'shape' && typeof domShake === 'function' && (typeof motionOk !== 'function' || motionOk())) domShake(1); }
  const before = CMU.cmbN || 0, now = NEST.cardCombos(G).length; if (now > before) { const n = NEST.cardCombos(G).slice(-1)[0]; if (n) { cmBanner('◇ ' + n.name); setTimeout(() => cmSnd('combo'), 160); (CMU.fx = CMU.fx || []).push({ cells: (n.cells || []).map(i => i === 'core' ? G.core : i).filter(i => typeof i === 'number'), t0: performance.now() + 120, col: '#e8c030', big: true }); } } CMU.cmbN = now;
  cmSave(); render();
}
// ---- 끌어서 놓기 ----
function cmCellAt(e) { const b = $('stage').getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom || ST.screen !== 'under') return null; const [sx, sy] = stagePoint(e), col = Math.floor((sx - GX) / CW), row = Math.floor((sy - GY) / CH); return col < 0 || row < 0 || col >= G.cols || row >= G.rows ? null : row * G.cols + col; }
function cmDragStart(e) {
  const d = CMU.drag, c = cmCard(d.uid); if (!c) { CMU.drag = null; return; } d.on = true; clearTimeout(CMU.lpT);
  CMU.sel = d.uid; CMU.place = null; CMU.alts = []; CMU.altI = 0; CMU.tapCell = null; CMU.dragCell = null; if (ST.screen !== 'under') setScreen('under'); UI.sel = null; render();
  const g = document.createElement('div'); g.id = 'cm-drag'; g.innerHTML = cmFace(CARDMODE.view(CMU.run, c), { cls: 'mini' }); document.body.appendChild(g); cmSnd('click');
}
function cmDragMove(e) {
  const g = $('cm-drag'); if (g) { g.style.left = Math.max(0, Math.min(innerWidth - g.offsetWidth, e.clientX - g.offsetWidth / 2)) + 'px'; g.style.top = Math.max(0, e.clientY - g.offsetHeight - 24) + 'px'; }
  const v = CARDMODE.handView(CMU.run).find(z => z.uid === CMU.drag.uid), i = cmCellAt(e); if (!v) return;
  if (g) g.classList.toggle('over', i != null);
  if (v.target === 'shape') { if (i == null) { CMU.place = null; CMU.dragCell = null; return; } if (i === CMU.dragCell && CMU.alts.length) return; const alts = cmPlaces(v).filter(p => p.cells.includes(i)); CMU.dragCell = i; CMU.alts = alts; CMU.altI = alts.length ? CMU.altI % alts.length : 0; CMU.place = alts[CMU.altI] || null; CMU.tapCell = alts.length ? i : null; return; }
  CMU.dragCell = i;
}
function cmDragEnd(e) {
  const g = $('cm-drag'); if (g) g.remove(); CMU.dragEnd = Date.now();
  const d = CMU.drag, v = d && CARDMODE.handView(CMU.run).find(z => z.uid === d.uid), i = e ? cmCellAt(e) : null; CMU.dragCell = null;
  if (!v || i == null) return render();
  if (v.target === 'shape') { if (CMU.place && CMU.place.cells.includes(i)) return cmPlay(v.uid, { cells: CMU.place.cells }); cmToast('그 자리에는 못 판다'); cmSnd('down'); return render(); }
  if (v.target === 'cell') { if ((v.cellsCan || []).includes(i)) return cmPlay(v.uid, { cell: i }); cmToast('그 칸에는 못 놓는다'); cmSnd('down'); return render(); }
  if (v.target === 'none' && v.can) return cmPlay(v.uid, {});
  render();
}
function cmBanner(s) { const b = document.createElement('div'); b.className = 'cm-banner'; b.textContent = s; $('stagewrap').appendChild(b); setTimeout(() => b.remove(), 1700); cmSnd('evo'); }

// ---- 한 장 더면: 손의 기관·부위 카드를 칸마다 놓아 보고, 새 배치 족보가 생기는지 본다 ----
function cmHints() {
  const run = CMU.run; if (!run || run.phase !== 'day') return [];
  const key = run.hand.join(',') + '|' + G.cells.map(c => (c.dug ? 1 : 0) + c.type.slice(0, 2) + c.traps.length + (c.casp || '')).join('') + '|' + G.kin.map(m => m.loc).join(',');
  if (key === CMU.hintKey) return CMU.hints; CMU.hintKey = key;
  const base = new Set(NEST.cardCombos(G).map(x => x.id + ':' + (x.cells || []).join('.'))), out = [];
  for (const v of CARDMODE.handView(run)) {
    if (!v.can || (v.type !== 'organ' && v.type !== 'trap')) continue; const d = cmDef(v.id);
    for (const i of (v.cellsCan || [])) {
      const c = G.cells[i], t0 = c.type, a0 = c.casp;
      if (v.type === 'organ') { c.type = d.room; c.casp = d.asp === 'none' ? null : d.asp; } else c.traps.push({ kind: d.trap, lv: 1, pow: 1, asp: d.asp });
      let found = null; try { found = NEST.cardCombos(G).find(x => !base.has(x.id + ':' + (x.cells || []).join('.'))); } catch (e) { found = null; }
      if (v.type === 'organ') { c.type = t0; c.casp = a0; } else c.traps.pop();
      if (found) { out.push({ uid: v.uid, cell: i, name: found.name, card: v.name }); break; }
    }
    if (out.length >= 2) break;
  }
  CMU.hints = out; return out;
}

// ---- 지도 위에 덧그리기: 빛나는 칸, 굴 모양 그림자, 배치 족보 ----
function cmLoop(t) {
  CMU.raf = 0; if (!CMU.run) return; CMU.raf = requestAnimationFrame(cmLoop);
  const cv = CMU.ov; if (!cv || !cmOn()) { if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); return; }
  const st = $('stage'), b = st.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, W = Math.round(b.width * dpr), Hh = Math.round(b.height * dpr);
  if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
  const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, Hh);
  if (ST.mode !== 'day' || ST.screen !== 'under' || ST.p < 0.98) return;
  const u = b.height / (ST.vh || H) * dpr, ox = (ST.ox - ST.cam.x), oy = (ST.oyFit || 0) - (ST.cam.y || 0) - (ST.cam.v || 0);
  const rc = i => { const r = cellRect(i); return { x: (r.x + ox) * u, y: (r.y + oy) * u, w: r.w * u, h: r.h * u }; };
  const box = (i, fill, line, lw, inset) => { const r = rc(i), k = (inset || 4) * u; if (fill) { x.fillStyle = fill; x.fillRect(r.x + k, r.y + k, r.w - 2 * k, r.h - 2 * k); } if (line) { x.strokeStyle = line; x.lineWidth = (lw || 2) * u; x.strokeRect(r.x + k, r.y + k, r.w - 2 * k, r.h - 2 * k); } };
  const pulse = 0.55 + 0.35 * Math.sin(t / 260);
  // 배치 족보: 이어진 칸을 금빛 테두리로
  NEST.cardCombos(G).forEach(cb => { (cb.cells || []).forEach(i => { const ii = i === 'core' ? G.core : i; if (typeof ii === 'number') box(ii, null, 'rgba(232,192,48,.55)', 2, 8); }); });
  const run = CMU.run, v = CMU.sel != null ? CARDMODE.handView(run).find(z => z.uid === CMU.sel) : null;
  if (v && v.target === 'cell') (v.cellsCan || []).forEach(i => box(i, `rgba(255,243,160,${0.12 + 0.12 * pulse})`, `rgba(255,243,160,${0.5 + 0.4 * pulse})`, 3));
  if (v && CMU.dragCell != null && v.target !== 'shape') box(CMU.dragCell, (v.cellsCan || []).includes(CMU.dragCell) ? 'rgba(255,243,160,.35)' : 'rgba(255,95,87,.28)', '#ffffff', 3, 2);
  if (v && v.target === 'shape') {
    const can = new Set(); (v.places || []).forEach(p => p.forEach(i => can.add(i))); can.forEach(i => box(i, 'rgba(200,160,112,.10)', `rgba(232,168,96,${0.35 + 0.3 * pulse})`, 2));
    if (CMU.place) CMU.place.cells.forEach(i => { box(i, 'rgba(138,106,74,.72)', '#fff3a0', 3, 2); const r = rc(i); x.fillStyle = 'rgba(200,160,112,.9)'; x.fillRect(r.x + 8 * u, r.y + r.h - 14 * u, r.w - 16 * u, 4 * u); });
  }
  const h = !v && cmHints()[0]; if (h) box(h.cell, null, `rgba(176,143,255,${0.4 + 0.4 * pulse})`, 2, 10);
  if (CMU.fx && CMU.fx.length) { const now = performance.now(); CMU.fx = CMU.fx.filter(f => now - f.t0 < 700); CMU.fx.forEach(f => { const a = (now - f.t0) / 700; if (a < 0) return; f.cells.forEach(i => { const r = rc(i), k = (1 - a) * (f.big ? 10 : 6) * u; x.globalAlpha = Math.max(0, 0.55 * (1 - a)); x.fillStyle = f.col; x.fillRect(r.x, r.y, r.w, r.h); x.globalAlpha = Math.max(0, 1 - a); x.strokeStyle = f.col; x.lineWidth = (2 + 3 * (1 - a)) * u; x.strokeRect(r.x - k, r.y - k, r.w + 2 * k, r.h + 2 * k); x.globalAlpha = 1; }); }); }
}

// ---- 칸 창 (ui.js cellPanel 대신): 무엇이 있는지만 보인다 ----
function cardCellPanel(i) {
  if (i === G.core) return phead('본체 방', '') + cmBodyHtml();
  const c = G.cells[i], room = NEST.ROOM[c.type], ks = G.kin.filter(m => m.loc === i), cmb = NEST.cardCombos(G).filter(x => (x.cells || []).includes(i));
  if (!c.dug) return phead('안 판 칸', coord(i)) + '<p class="small mute">굴 카드로 판다</p>';
  return phead(esc(room ? room.name : '빈 굴'), coord(i) + (c.casp ? ' · ' + NEST.ASP[c.casp] : '') + (c.lv > 1 ? ' · Lv' + c.lv : '')) +
    (room && room.desc && c.type !== 'empty' ? `<p class="small">${esc(room.desc)}</p>` : '') +
    (c.traps.length ? `<p class="small coin">함정</p><div class="stack">${c.traps.map(t => `<span class="chip">${esc(t.name || (NEST.TRAP[t.kind] && NEST.TRAP[t.kind].name) || t.kind)} <small>${t.lv || 1}단계</small></span>`).join('')}</div>` : '') +
    (ks.length ? `<p class="small coin">권속</p><div class="units g3">${ks.map(kinChip).join('')}</div>` : '') +
    (cmb.length ? `<p class="small okc">◇ ${cmb.map(x => esc(x.name)).join(' · ')}</p>` : '') +
    (c.block ? '<p class="small up">흙벽으로 막혔다</p>' : '');
}

// ---- 낮 끝: 남길 카드 고르기 → 밤 ----
function cmNightAsk() {
  const run = CMU.run; if (busy || !run || run.phase !== 'day') return;
  const hand = run.hand.map(cmCard).filter(c => c && cmDef(c.id).type !== 'curse');
  if (hand.length <= run.retain) return cardNight(hand.map(c => c.uid));
  CMU.keep = hand.filter(c => cmDef(c.id).type === 'skill').slice(0, run.retain).map(c => c.uid); cmKeepView();
}
function cmKeepView() {
  const run = CMU.run, hand = run.hand.map(cmCard).filter(c => c && cmDef(c.id).type !== 'curse');
  cmOv(`<div class="dk-reward"><h2>밤을 맞는다</h2>${G.march.tonight ? cmThreatHtml(true) : ''}<p class="dk-sub">남길 카드 ${CMU.keep.length}/${run.retain} · 나머지는 버린다</p><div class="dk-grid cm-keepg">${hand.map(c => cmFace(CARDMODE.view(run, c), { c: 'keep', uid: c.uid, cls: 'mini' + (CMU.keep.includes(c.uid) ? ' cm-kept' : '') })).join('')}</div>
<div class="dk-row2"><button class="btn pri" data-c="go">밤 맞기</button><button class="btn" data-c="ovx">돌아가기</button></div></div>`, 'dk-dim');
}
async function cardNight(keep) {
  const run = CMU.run; if (busy || !G || G.over || !run || run.phase !== 'day') return;
  cmOv(null); cmSheet(null); busy = true; CMU.sel = null; CMU.place = null; UI.sel = null; UI.confirmEnd = false; if (!$('modal').hidden) closeModal(); toast(null); setSheet(false); cmCoachHide();
  run.nightLock = { day: G.day, keep: (keep || []).slice() }; cmSave(); CMU.inNight = true; if (G.march.tonight) cmSnd('night');
  const day = G.day, g0 = cmGenome() ? JSON.parse(JSON.stringify(cmGenome())) : null, stage0 = G.slime.stage;
  // 밤 앞 (규칙): 저주의 몫, 족보 세기, 허물 막기. 그 다음 원래 게임의 밤을 화면에서 한 번만 돈다
  const b = CARDMODE.nightBegin(run); if (!b.ok) { busy = false; CMU.inNight = false; run.nightLock = null; return; }
  const tonight = G.march.tonight;
  ST.hud = { gold: G.gold, faith: G.faith, fear: G.fear }; ST.skip = false; ST.asked = false; ST.pick = null; setNight(true); hud(); cmHand();
  { const e = NEST.estimate(G, 'tonight'); typeof music === 'function' && music(e && e.boss && e.boss !== 'captain' ? 'boss' : 'night'); }
  const it = NEST.beginNight(G); prepareNight(); let rep = null;
  if (!tonight) { const r0 = it.next(); rep = r0 && r0.done ? r0.value || null : null; nlog('아무도 오지 않았다.'); ST.label = '조용한 밤'; await wait(1100); ST.label = ''; }
  else { let r = it.next(), played = 0; while (!r.done) { played = await playEvents(r.value.ev, played); const ans = await askHand(r.value); cmHand(); r = it.next(ans); } rep = r.value; await playEvents(rep.ev, played); await wait(300); }
  const st = NEST.settle(G, rep);
  // 밤 뒤 (규칙): 손 버리기, 몸에 형질 쌓기, 허물이 익었나, 보상, 말 배우기
  CARDMODE.nightEnd(run, { battle: rep, settle: st }, keep); const bat = rep; run.nightLock = null; CMU.inNight = false; cmSave();
  ST.ents = null; ST.hud = null; ST.skip = false; ST.focus = null; setNight(false); setScreen('under'); CMU.hintKey = ''; CMU.cmbN = NEST.cardCombos(G).length; CMU.threatKey = ''; render(); typeof music === 'function' && music('day');
  cmSnd(bat && bat.result !== 'repel' ? 'down' : 'coin');
  if (st) { const firstCap = bat && bat.captives && bat.captives.length && G.stats.captives === bat.captives.length, pm = modal(cmSettleHtml(bat, st, day, g0)); if (firstCap) setTimeout(() => FX.captive(document.querySelector('#modal .card')), 140); await pm; }
  if (st && st.found && !G.over) await revealWorld(true);
  if (typeof CARDMODE.moltPending === 'function' && CARDMODE.moltPending(run)) { const m = CARDMODE.molt(run); if (m) await cmMoltScreen(m); }
  else if (!G.over && g0) cmDayChange(g0);
  if (run.camp && typeof campAfterNight === 'function') await campAfterNight(run);
  if (run.phase === 'over' || G.over) return cardFinish();
  cmLearned();
  if (run.phase === 'reward') await cmAfterNightReward();
  if (run.needleOffer) cmToast('바늘 점이 열렸다 · 지도 위 ✦');
  busy = false; cmSave(); render(); cmCoach();
}
// 밤 뒤 정산 (카드 판 전용): 무엇이 왔고 어떻게 끝났나, 진액이 얼마나 드나들었나, 몸이 무엇으로 자랐나. 다른 판의 말(신·섬김·정수 물듦…)은 쓰지 않는다
const CMNOTE_OUT = /섬김|신뢰|포로 밥값|밥값|물든|물듦|정수|「[^」]*」의 벌|선물|징조|눈길|교시|첩자|별자리|명부|야유|끼니|유지/;
const CM_DROP = /^(징조|이 세상에만 있는 것)|포교|신도 "|포로 자리|섬김|신뢰|밥값\(끼니\)|정수 [+−-]|적의 [+−-]|정신력 [+−-]|공포 [+−-]|신앙 상한|「마지막 막」|교시|명부|첩자/;
const cmMarchLabel = e => cmText(e.txt) || '';
function cmText(s) { if (s == null) return s; s = cmWords(String(s)).replace(/\s*\(공포 \+\d+ 더\)/g, '').replace(/(\d)\s*방울/g, '$1').replace(/(\d+)라운드 교전: (\d+)명 쓰러뜨림/g, '맞붙음이 끝났다. 쓰러진 침입자 $2'); return CM_DROP.test(s) ? null : NEST.fj(s); }
// 진액이 어디서 들고 났나 (카드 판 말로)
const CMLEDGE = { '지닌 것': '쓰러진 것들이 지녔던 것', '삼킨 것': '붙잡아 둔 것들', '끼니': '권속 밥값', '방 유지': '굴 유지', '진액 털림': '본체가 털린 것', '진액 맥': '진액 맥', '소화': '소화액', '빨판 굴': '빨판 굴', '미끼 굴': '미끼 굴', '상자': '주운 것', '버려진 짐': '주운 것', '보급함': '주운 것', '훈련': '권속 먹이기', '권속 진화': '권속 진화' };
function cmSettleHtml(b, st, day, g0) {
  const L = st.ledger || {}, tot = Math.round(Object.values(L).reduce((a, x) => a + x, 0)), run = CMU.run, w = G.world;
  const nm = k => (typeof CARDMODE.knownName === 'function' ? CARDMODE.knownName(run.meta, w, k) : null) || (CARDMODE.ALIEN && CARDMODE.ALIEN[k]) || '낯선 것';
  let h = '';
  if (b) {
    const kinds = {}; b.party.forEach(u => { kinds[u.kind] = (kinds[u.kind] || 0) + 1; });
    const res = { repel: ['막아 냈다', 'okc'], stolen: ['본체가 쓰러졌다 · 진액을 털렸다', 'up'], core: ['본체가 쓰러졌다', 'up'] }[b.result] || ['끝났다', ''];
    h += `<div class="card cm-set"><p class="h3 ${res[1]}">${res[0]}</p><div class="cm-setinv">${Object.keys(kinds).map(k => `<span class="cm-inv">${invImg(k, 28)}<small>${esc(nm(k))} ×${kinds[k]}</small></span>`).join('')}</div>
<p class="small">쓰러뜨림 <b>${b.kills || 0}</b> · 달아남 <b>${b.fled || 0}</b>${(b.captives || []).length ? ` · 붙잡음 <b style="color:#c8a8ff">${b.captives.length}</b>` : ''} <span class="mute">/ ${b.party.length}</span></p>${b.fell ? `<p class="small up">목숨 ${lifePips()}${G.over ? ' · 다시 일어나지 못했다' : NEST.lives(G) <= 1 ? ' · 한 번 더 쓰러지면 끝이다' : ' · 남은 목숨 ' + NEST.lives(G)}</p>` : ''}</div>`;
  } else h += '<p class="mute">아무도 오지 않았다. 굴이 조용히 자랐다.</p>';
  { const parts = Object.keys(L).filter(k => Math.round(L[k])).sort((a, c) => Math.abs(L[c]) - Math.abs(L[a])).slice(0, 3).map(k => cmWords(CMLEDGE[k] || k) + ' ' + (L[k] > 0 ? '+' : '') + Math.round(L[k]));
    h += `<p class="cm-ess ${tot >= 0 ? 'coin' : 'up'}">진액 ${tot >= 0 ? '+' : ''}${tot}</p>${parts.length ? `<p class="small mute">${parts.map(esc).join(' · ')}</p>` : ''}`; }
  const notes = (st.notes || []).filter(n => !CMNOTE_OUT.test(n)).map(n => cmText(n.replace(/([+−-]?\d[\d,]*)\s*방울/g, '진액 $1'))).filter(Boolean).slice(0, 3);
  if (notes.length) h += `<div class="stack" style="gap:2px">${notes.map(n => `<p class="small warnc">${esc(n)}</p>`).join('')}</div>`;
  const g1 = cmGenome(), gm = g0 && g1 && TRAITS.grewMost ? TRAITS.grewMost(g0, g1) : null;
  if (gm) h += `<div class="cm-grew">${cmBodyImg(g1, 48)}<p class="small">${esc(gm.line)}</p></div>`;
  return M(b ? day + '일째 밤' : day + '일째', NEST.fj(h), closeBtn('아침으로'));
}
// 아침마다 몸이 조금 바뀐다: 위쪽 초상이 짧게 바뀌고 한 줄이 남는다
function cmDayChange(g0) {
  const g1 = cmGenome(); if (!g0 || !g1 || !TRAITS.grewMost) return; const gm = TRAITS.grewMost(g0, g1); if (!gm || gm.gain < 0.3) return;
  CMU.dayChange = { from: cmBodyImg(g0, 112), line: gm.line, tag: gm.tag, t: Date.now() };
}
function cmLearned() { const run = CMU.run, L = run.learned || []; const fresh = L.slice(CMU.learnedN); CMU.learnedN = L.length; fresh.forEach((w, k) => setTimeout(() => cmToast('기억을 삼켰다: ' + w.from + ' → ' + w.to), 300 + k * 2700)); }

// ---- 허물: 옛 몸 → 그림자 → 새 몸, 네가 한 일, 바뀐 카드 ----
function cmMoltGuess(g0, stage0) {
  const run = CMU.run, g1 = cmGenomeNow(run, G.slime.stage), top0 = g0 && TRAITS.topTags ? TRAITS.topTags(g0, 3) : [], top1 = g1 && TRAITS.topTags ? TRAITS.topTags(g1, 3) : [];
  const nm = g1 && TRAITS.nameOf ? TRAITS.nameOf(g1) : { name: NEST.formName(G), title: '' };
  return { before: g0 || cmGenomeNow(run, stage0), after: g1, lines: g1 && TRAITS.narrate ? TRAITS.narrate(g1) : [], nums: g1 && TRAITS.describe ? TRAITS.describe(g1) : [], gained: top1.filter(t => !top0.includes(t)), combos: g1 && TRAITS.combosOf ? TRAITS.combosOf(g1) : [], landmark: g1 && TRAITS.landmarkOf ? TRAITS.landmarkOf(g1) : null, name: nm, mutated: [] };
}
const cmTagList = a => (a || []).map(t => typeof t === 'string' ? t : t && (t.id || t.tag || t.name)).filter(Boolean);
// 허물 순간: 화면 가득 옛 몸의 그림자가 두 번 맥박치고, 새 몸이 빛 속에서 드러난다 (1.2초 안팎, 누르면 넘김, 움직임을 끄면 건너뜀)
function cmMoltIntro(before, after, col) {
  return new Promise(res => {
    if ((typeof motionOk === 'function' && !motionOk()) || !before || !after || (navigator.webdriver && !window.__forceMoltIntro)) return res();
    const d = document.createElement('div'); d.className = 'cm-moltin'; d.style.setProperty('--mc', col || '#b08fff');
    d.innerHTML = `<span class="cm-mi0">${cmBodyImg(before, 128)}</span><span class="cm-mi1">${cmBodyImg(after, 128)}</span>`;
    document.body.appendChild(d); cmSnd('molt');
    let done = false; const end = () => { if (done) return; done = true; d.remove(); res(); };
    d.addEventListener('pointerdown', end); setTimeout(end, 1250);
  });
}
function cmMoltScreen(m) {
  return cmMoltIntro(m.before, m.after || cmGenome(), cmCol(((m.after || cmGenome()) || {}).aspect || G.slime.main)).then(() => cmMoltScreen0(m));
}
function cmMoltScreen0(m) {
  return new Promise(res => {
    const run = CMU.run, before = m.before, after = m.after || cmGenome(), nm = m.name || {}, lm = m.landmark;
    const lmName = lm ? (typeof lm === 'string' ? ((TRAITS.LANDMARKS.find(x => x.id === lm) || {}).name || lm) : lm.name) : '';
    const lmText = lm && typeof lm === 'object' ? lm.text : lm ? (TRAITS.LANDMARKS.find(x => x.id === lm) || {}).text : '';
    const mut = (m.mutated || []).slice(0, 8);
    cmOv(`<div class="cm-molt"><p class="dk-lab" style="text-align:center">허물을 벗었다</p>${lm ? `<p class="cm-lm">★ ${esc(lmName)}${lmText ? `<small>${esc(lmText)}</small>` : ''}</p>` : ''}
<div class="cm-morph" id="cm-morph"><span class="cm-b0">${cmBodyImg(before, 96)}</span><span class="cm-ar">→</span><span class="cm-b1">${cmBodyImg(after, 128)}</span></div>
<h2>${esc(nm.name || '')}${nm.title ? `<small>「${esc(nm.title)}」</small>` : ''}</h2>
<div class="dk-list cm-mlines">${(m.lines || []).slice(0, 3).map(s => `<div class="dk-li">${esc(s)}</div>`).join('')}</div>${(m.nums || []).length ? cmFold('숫자로 보기', m.nums.map(x => `<p class="small mute">${esc(x)}</p>`).join('')) : ''}
${cmTagList(m.gained).length ? `<div class="dk-row cm-tags">${cmTagList(m.gained).map(t => `<span class="chip on">+ ${esc(cmTagName(t))}</span>`).join('')}</div>` : ''}
${mut.length ? `<p class="dk-lab">몸이 바뀌자 카드도 바뀌었다</p><div class="cm-muts">${mut.map((x, k) => `<div class="dk-uprow cm-flip" style="animation-delay:${600 + k * 260}ms">${cmFace(cmDefView(x.from), { cls: 'mini' })}<span class="dk-arrow">→</span>${cmFace(cmDefView(x.to), { cls: 'mini' })}</div>`).join('')}</div>` : ''}
<button class="btn pri dk-wide" data-c="moltok">좋다</button></div>`, 'dk-full cm-moltov');
    CMU.moltRes = () => { CMU.moltRes = null; CMU.dayChange = null; cmOv(null); res(); };
    const host = $('cm-morph'), col = cmCol((after && after.aspect) || G.slime.main);
    if (typeof morphOver === 'function' && host) morphOver(host, cmBodyImg(before, 96), cmBodyImg(after, 128), col, !!lm, lm ? '★ ' + esc(lmName) : '');
    if (typeof domFlash === 'function') domFlash(col + 'aa', lm ? 800 : 600); if (typeof domShake === 'function') domShake(2); cmSnd('evo');
    if (typeof cmMoltHook === 'function') cmMoltHook(m);
  });
}

// ---- 보상: 셋 중 하나 ----
function cmAfterNightReward() {
  return new Promise(res => { CMU.rewardRes = () => { CMU.rewardRes = null; cmOv(null); res(); }; cmRewardView(); });
}
function cmRewardView() {
  const run = CMU.run; if (!run || run.phase !== 'reward' || !run.offer) { if (CMU.rewardRes) CMU.rewardRes(); return; }
  const rr = Math.round(CARDMODE.K.reroll * NEST.cm(G));
  cmOv(`<div class="dk-reward"><h2>${run.offer.boss ? '우두머리를 넘겼다' : '밤을 넘겼다'}</h2><p class="dk-sub">덱에 넣을 카드 하나</p><div class="dk-pick3">${run.offer.cards.map((id, k) => cmFace(cmDefView(id), { c: 'reward', i: k, cls: 'pick' })).join('')}</div>
<div class="dk-row2"><button class="btn" data-c="reroll"${G.gold < rr ? ' disabled' : ''}>다시 뽑기 ${rr}</button><button class="btn" data-c="rskip">안 받기</button></div><p class="dk-mute">길게 누르면 자세히</p></div>`, 'dk-full');
}

// ---- 창: 덱 · 상점 · 강화 · 빼기 · 배치 족보 ----
function cmDeckSheet() {
  const run = CMU.run, dv = CARDMODE.deckView(run), tabs = [['all', '모두'], ['hand', '손'], ['draw', '남은'], ['disc', '버림']], t = CMU.deckTab;
  const list = dv.filter(v => t === 'all' || v.where === t).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  cmSheet('deck', `<h3>덱 ${run.deck.length}장 <small>남은 ${run.drawP.length} · 버림 ${run.disc.length} · 손에 남기는 ${run.retain}</small></h3><div class="dk-tabs">${tabs.map(([k, n]) => `<button class="dk-tab${k === t ? ' on' : ''}" data-c="dtab" data-v="${k}">${n}</button>`).join('')}</div><div class="dk-grid">${list.map(v => `<div class="dk-cell">${cmFace(v, { cls: 'mini', uid: v.uid })}</div>`).join('')}</div>`);
}
// 진액을 쓸 곳: 같은 날 거듭하면 값이 오른다
const CMSINKT = { redraw: '손의 카드를 버리고 새로 받는다', draw: '덱에서 한 장을 더 받는다', feed: '모든 권속이 자란다', hurry: '다음 허물이 가까워진다' };
function cmSinkHtml() {
  if (!CARDMODE.sinkOptions) return ''; const o = CARDMODE.sinkOptions(CMU.run);
  return `<p class="dk-lab">진액을 쓴다</p><div class="cm-sinks">${o.map(x => `<button class="btn cm-sink" data-c="sink" data-v="${x.id}"${x.ok ? '' : ' disabled'} title="${esc(x.ok ? CMSINKT[x.id] : x.why || '')}"><b>${esc(x.name)} <span class="coin">${x.cost}</span></b>${x.ok ? '' : `<small>${esc(x.why || '')}</small>`}</button>`).join('')}</div>`;
}
function cmShopSheet() {
  const run = CMU.run, sh = run.shop || [];
  cmSheet('shop', `<h3>상점 <small>진액 ${R(G.gold)}</small></h3><div class="dk-grid">${sh.map((s, i) => `<div class="dk-cell${s.sold ? ' sold' : ''}">${cmFace(cmDefView(s.id), { cls: 'mini' })}<button class="btn sm" data-c="buy" data-i="${i}"${s.sold || G.gold < s.price ? ' disabled' : ''}>${s.sold ? '팔림' : '사기 ' + s.price}</button></div>`).join('') || '<p class="dk-mute">오늘은 없다</p>'}</div>${cmSinkHtml()}`);
}
function cmUpSheet() {
  const run = CMU.run, k = CARDMODE.upCost(run), list = run.deck.filter(c => !c.up && cmDef(c.id).type !== 'curse');
  cmSheet('up', `<h3>강화 <small>한 장 ${k} · 진액 ${R(G.gold)}</small></h3><div class="dk-list">${list.map(c => { const v = CARDMODE.view(run, c), u = CARDMODE.view(run, Object.assign({}, c, { up: 1 })); return `<div class="dk-uprow">${cmFace(v, { cls: 'mini' })}<span class="dk-arrow">→</span>${cmFace(u, { cls: 'mini', text: CMUPTXT[v.type] || u.text })}<div class="dk-col"><button class="btn sm" data-c="doup" data-uid="${c.uid}"${G.gold < k ? ' disabled' : ''}>강화 ${k}</button></div></div>`; }).join('') || '<p class="dk-mute">강화할 카드가 없다</p>'}</div>`);
}
function cmRmSheet() {
  const run = CMU.run, k = CARDMODE.rmCost(run);
  cmSheet('rm', `<h3>빼기 <small>한 장 ${k} · 진액 ${R(G.gold)}</small></h3><div class="dk-grid">${run.deck.map(c => `<div class="dk-cell">${cmFace(CARDMODE.view(run, c), { cls: 'mini' })}<button class="btn sm" data-c="dorm" data-uid="${c.uid}"${G.gold < k ? ' disabled' : ''}>빼기</button></div>`).join('')}</div>`);
}
function cmCombosSheet() {
  const now = NEST.cardCombos(G), ids = new Set(now.map(x => x.id));
  cmSheet('combos', `<h3>배치 족보</h3><div class="dk-list">${Object.keys(NEST.CMB).map(k => `<div class="dk-li${ids.has(k) ? ' cm-on' : ''}"><b>${ids.has(k) ? '◆' : '◇'} ${esc(NEST.CMB[k].name)}</b><span class="dk-mute">${esc(cmWords(NEST.CMB[k].text || NEST.CMB[k].desc || ''))}</span></div>`).join('')}</div>`);
}
function cmDetail(id, uid) {
  if (!id) return; const run = CMU.run, c = uid ? cmCard(+uid) : null, v = c ? CARDMODE.view(run, c) : cmDefView(id), d = cmDef(id), un = d.unlock && CARDS2.UNLOCK[d.unlock];
  cmSheet('detail', `<div class="dk-detail">${cmFace(v, { cls: 'big' })}<div class="dk-dt"><p><b>${esc(v.name)}</b> <span class="dk-tag" style="--c:${cmCol(d.asp)}">${CMTYPE[d.type]}${d.asp !== 'none' ? ' · ' + CARDS2.ASPN[d.asp] : ''}</span></p><p>${esc(cmWords(d.more || d.text))}</p>${v.more ? `<p class="dk-mute">${esc(cmWords(v.more))}</p>` : d.btext && cmGeneTag(v) ? `<p class="dk-mute">본디: ${esc(cmWords(d.btext))}</p>` : ''}${d.lore ? `<p class="dk-mute dk-lore">${esc(d.lore)}</p>` : ''}${d.from ? `<p class="dk-mute">← 원래 「${esc(d.baseName || (cmDef(d.from) || {}).name || d.from)}」 · 몸이 다시 쓴 카드</p>` : ''}${d.type !== 'curse' ? `<p class="dk-mute">강화하면: ${esc(CMUPTXT[d.type] || '세진다')}</p>` : ''}${(d.tags || []).length ? `<p class="dk-mute">몸의 꼬리표: ${d.tags.map(cmTagName).join(' · ')}</p>` : ''}${un ? `<p class="dk-lock">${un.hard ? '<span class="dk-hard">도전</span> ' : ''}${esc(un.text)}</p>` : ''}</div></div>`);
}

// ---- 바늘 점 ----
const CMSIGN = ['〰', '◉', '⬮', '◐', '▼', '⊓', '│', '▲', '⋔', '≀', '△', '◯', '⋀'];
function cmStar(s, hidden) { if (!s || hidden) return '<div class="dk-star back"><i></i></div>'; const col = s.asp === 'none' ? '#e8e0d0' : cmCol(s.asp); return `<div class="dk-star" style="--c:${col}"><b>${CMSIGN[s.sign] || '✦'}</b><span>${esc(CARDMODE.SIGNS[s.sign] || '')}</span><em>${s.asp === 'none' ? '바늘' : CARDS2.ASPN[s.asp]}</em></div>`; }
function cmNeedle(op, v, uid) {
  const run = CMU.run; let res = null;
  if (op === 'start') { const r = CARDMODE.needleStart(run); if (!r.ok) { cmToast(r.msg); return; } CMU.nres = null; cmSave(); }
  if (op === 'bet') { const r = CARDMODE.needleBet(run, v === 'card' ? { kind: 'card', uid } : v === 'faith' ? { kind: 'faith', n: 3 } : { kind: 'ess', n: 10 }); if (!r.ok) cmToast(r.msg || '걸 것이 없다'); else cmSnd('coin'); }
  if (op === 'open') { const r = CARDMODE.needleReveal(run); if (!r.ok) cmToast(r.msg || '먼저 건다'); else { cmSnd('trap'); if (r.result) res = r; } }
  if (op === 'fold') { CARDMODE.needleFold(run); cmOv(null); cmToast('접었다'); cmSave(); render(); return; }
  if (res) CMU.nres = res;
  const n = res ? res.needle : CARDMODE.needlePublic(run); if (!n) return;
  const shown = n.stars.length, stars = []; for (let k = 0; k < 5; k++) stars.push(cmStar(n.stars[k], k >= shown));
  const holes = (n.hole || [null, null]).map(h => cmStar(h, !h)).join(''), kin = run.deck.filter(c => cmDef(c.id).type === 'kin'), st = n.stake, done = !!res;
  const out = done ? (res.result.pay > 0 ? `<p class="dk-pay win">${esc(res.result.name)} · 진액 +${res.result.pay}${res.result.gifts.length ? ' · 선물 ' + res.result.gifts.length : ''}</p>` : `<p class="dk-pay lose">${esc(res.result.name)} · 잃었다${res.result.curse ? ' · 저주가 붙었다' : ''}</p>`) : '';
  if (done) { cmSnd(res.result.pay > 0 ? 'evo' : 'down'); cmSave(); render(); }
  cmOv(`<div class="dk-needle"><h2>바늘 점</h2><p class="dk-sub">별 다섯 + 내 바늘 둘 · 가장 좋은 다섯</p><div class="dk-sky">${stars.join('')}</div><p class="dk-lab">내 바늘</p><div class="dk-sky holes">${holes}</div>
<p class="dk-stake">건 것 · 진액 ${st.ess} · 신앙 ${st.faith} · 권속 ${(st.cards || []).length} <b>(값 ${st.value})</b></p>${out}
${done ? '<button class="btn pri dk-wide" data-c="ndone">좋다</button>' : `<div class="dk-row2"><button class="btn" data-c="nbet" data-v="ess"${G.gold < 1 ? ' disabled' : ''}>진액 10</button><button class="btn" data-c="nbet" data-v="faith"${G.faith < 1 ? ' disabled' : ''}>신앙 3</button>${kin.length ? `<button class="btn" data-c="nbet" data-v="card" data-uid="${kin[0].uid}">권속 1</button>` : ''}</div><div class="dk-row2"><button class="btn pri" data-c="nopen"${st.value > 0 ? '' : ' disabled'}>${n.step === 0 ? '별을 연다' : '다음 별'}</button><button class="btn" data-c="nfold">접는다</button></div>`}
<button class="btn sm dk-paybtn" data-c="paytbl">족보와 몫</button></div>`, 'dk-full needle');
}

// ---- 판 끝 ----
function cardFinish() {
  if (CMU.run && CMU.run.camp && typeof campFinish === 'function') return void campFinish();
  const run = CMU.run; busy = true; const o = run.over || { win: false, score: 0, unlocks: [], why: '' }, g = cmGenome(), m = cmMeta();
  store.del('cardrun');
  if (g && typeof TRAITS !== 'undefined') { const nm = TRAITS.nameOf(g), lm = TRAITS.landmarkOf(g); m.forms[nm.name] = { aspect: g.aspect, sub: g.sub, stage: g.stage, seed: g.seed, tags: g.tags, title: nm.title || '', lm: lm ? (lm.id || lm) : null, at: Date.now() }; if (lm) m.marks[lm.id || lm] = 1; }
  saveMeta(); typeof music === 'function' && music(o.win ? 'win' : 'lose'); if (FX && FX.end) FX.end(!!o.win);
  const un = o.unlocks || [], nm = g && TRAITS.nameOf ? TRAITS.nameOf(g) : { name: '', title: '' };
  cmOv(`<div class="dk-over ${o.win ? 'win' : 'lose'}"><h2>${o.win ? '일곱째 바늘이 돌아섰다' : '본체가 쓰러졌다'}</h2><p class="dk-sub">${CARDS2.ASPN[run.aspect]} · ${o.day || G.day}일 · 점수 <b>${R(o.score || 0)}</b>${o.grade ? ' · ' + o.grade : ''}</p>
<div class="cm-final">${cmBodyImg(g, 128)}<p class="h3">${esc(nm.name)}${nm.title ? ` <small>「${esc(nm.title)}」</small>` : ''}</p></div>
<button class="btn dk-wide" data-c="egg-lay"${CMU.eggLaid ? ' disabled' : ''}>${CMU.eggLaid ? '알을 남겼다' : '알을 남긴다'}</button>
${un.length ? `<p class="dk-lab">새로 열린 카드</p>${un.map(u => `<div class="dk-un"><p class="dk-mute">${u.hard ? '<span class="dk-hard">도전</span> ' : ''}${esc(u.text)}</p><div class="dk-row">${(u.cards || []).map(id => cmFace(cmBareView(id), { cls: 'mini' })).join('')}</div></div>`).join('')}` : '<p class="dk-mute">이번에는 새로 열린 카드가 없다</p>'}${(m.queue || []).length ? `<p class="dk-lab">다음 판에 더 열린다 ${m.queue.length}</p>` : ''}
<div class="dk-row2"><button class="btn pri" data-c="again">다시 한다</button><button class="btn" data-c="codex">도감</button><button class="btn" data-c="home">처음 화면</button></div></div>`, 'dk-full');
}
function cmLayEgg() {
  const run = CMU.run, m = cmMeta(); if (CMU.eggLaid) return;
  if (typeof CARDMODE.layEgg === 'function') { try { CARDMODE.layEgg(run); } catch (e) { /* 아래 */ } }
  else { const g = cmGenome(); if (g) { const e = TRAITS.inherit(g); e.at = Date.now(); m.eggs.push(e); m.eggs = m.eggs.slice(-6); } }
  CMU.eggLaid = true; saveMeta(); cmSnd('up'); cmToast('알을 남겼다'); cardFinish();
}

// ---- 도감: 카드 / 형태 ----
function cmCodex() {
  { const t = $('cm-toast'); if (t) t.hidden = true; }
  const m = cmMeta(), tab = CMU.codexTab;
  let body = '';
  if (tab === 'card') {
    const a = CMU.codexAsp, list = CARDS2.LIST.filter(d => d.type !== 'curse' && (a === 'all' || d.asp === a)), open = list.filter(d => CARDS2.isOpen(d, m)).length;
    body = `<div class="dk-tabs">${[['all', '모두']].concat(CMASP.map(x => [x, NEST.ASP[x]]), [['none', '무색']]).map(([k, n]) => `<button class="dk-tab${k === a ? ' on' : ''}" data-c="casp" data-v="${k}">${n}</button>`).join('')}</div><p class="dk-mute">열림 ${open}/${list.length}</p>
<div class="dk-grid">${list.map(d => { const op = CARDS2.isOpen(d, m), un = d.unlock && CARDS2.UNLOCK[d.unlock]; return `<div class="dk-cell">${cmFace(cmBareView(d.id), { cls: 'mini' + (op ? '' : ' locked') })}${op ? '' : `<span class="dk-lockt">${un && un.hard ? '도전 · ' : ''}${esc(un ? un.text : d.part ? '이야기에서 그 부위를 단다' : '')}</span>`}</div>`; }).join('')}</div>`;
  } else {
    const cx = typeof CARDMODE.codex === 'function' ? (function () { try { return CARDMODE.codex(m); } catch (e) { return null; } })() : null;
    const forms = Object.keys(m.forms).map(n => Object.assign({ name: n }, m.forms[n])), lms = typeof TRAITS !== 'undefined' ? TRAITS.LANDMARKS : [], found = cx && cx.landmarksFound != null ? cx.landmarksFound : Object.keys(m.marks).length;
    body = `<p class="dk-mute">찾은 형태 ${cx && cx.found != null ? cx.found : forms.length} · 숨은 형태 ${found}/${lms.length}</p>
<div class="dk-grid cm-forms">${forms.map(f => { const g = TRAITS.newGenome({ aspect: f.aspect, sub: f.sub, stage: f.stage, seed: f.seed }); g.tags = f.tags || {}; return `<div class="dk-cell cm-form">${cmBodyImg(g, 56)}<span>${esc(f.name)}</span></div>`; }).join('') || '<p class="dk-mute">아직 찾은 형태가 없다</p>'}</div>
<p class="dk-lab">숨은 형태</p><div class="dk-grid cm-forms">${lms.map(l => m.marks[l.id] ? `<div class="dk-cell cm-form on"><b class="cm-lmk">★</b><span>${esc(l.name)}</span></div>` : '<div class="dk-cell cm-form off"><b class="cm-lmk">?</b><span>???</span></div>').join('')}</div>`;
  }
  cmOv(`<div class="dk-codex"><h2>도감</h2><div class="dk-tabs"><button class="dk-tab${tab === 'card' ? ' on' : ''}" data-c="ctab" data-v="card">카드</button><button class="dk-tab${tab === 'form' ? ' on' : ''}" data-c="ctab" data-v="form">형태</button></div>${body}<button class="btn dk-wide" data-c="cback">돌아가기</button></div>`, 'dk-full');
}

// ---- 밤에 멈췄을 때: 쥔 기술 카드를 카드로 (ui.js askHand 가 부른다) ----
function cardAskHtml(ctx) {
  const run = CMU.run, held = G.cardHeld || [], faces = [], free = []; if ($('chand')) $('chand').hidden = true;
  ctx.opts.forEach(o => {
    const h = held.find(x => x.spell === o.id && !x.used), c = h && cmCard(h.uid);
    if (c) { faces.push(`<button class="cm-cbtn" data-a="hand" data-k="${o.id}"${o.ok ? '' : ' disabled'} title="${esc(o.why || o.desc || '')}">${cmFace(CARDMODE.view(run, c), { cost: Math.ceil(o.cost || 0), faith: true, night: true, cls: 'mini' + (o.ok ? '' : ' no') })}</button>`); return; }
    if (NEST.SPELL[o.id] && NEST.SPELL[o.id].free) free.push(btn('hand', { k: o.id }, spellImg(o.id) + ' ' + o.name + ' <small>' + ({ whip: '이 방 공격↑', move: '권속 불러오기' }[o.id] || '') + '</small>' + (o.tgt ? ' ◎' : ''), 'sm', !o.ok));
  });
  try { if (typeof camCell === 'function' && typeof ctx.cell === 'number') camCell(ctx.cell); } catch (e) { /* 비추지 못해도 고를 수는 있다 */ }
  return `<p class="h3">손을 쓸까? <small class="mute">신앙 ${Math.floor(ctx.faith)} · 적 ${ctx.enemies}</small></p><div class="row cm-nfree">${free.join('')}${btn('hand', { k: 'none' }, '그냥 둔다', 'pri')}</div>${faces.length ? `<div class="cm-nhand cm-nstrip">${faces.join('')}</div>` : ''}`;
}
function cardMorning() { busy = false; render(); if (G.event) openModal('event'); }

// ---- 누르기 ----
function cmClick(e) {
  const el = e.target.closest && e.target.closest('[data-c]'); if (!el || !CMU.run && !['asp', 'look', 'egg', 'begin', 'cont', 'codex', 'home', 'ctab', 'casp', 'cback', 'fold', 'fromdrop'].includes(el.dataset.c)) return;
  // 길게 누른 뒤 손을 뗄 때 오는 누름은 넘긴다 (그 카드에서 온 것만)
  if (CMU.lpEl) { const same = e.target.closest('.dkc') === CMU.lpEl && Date.now() - CMU.lpAt < 900; CMU.lpEl = null; if (same) return; }
  if (Date.now() - (CMU.dragEnd || 0) < 450) return;
  const c = el.dataset.c, v = el.dataset.v, run = CMU.run;
  if (c === 'asp') { CMU.asp = v; cmSnd('click'); return cmStart(); }
  if (c === 'look') { CMU.look = v; cmSnd('click'); return cmStart(); }
  if (c === 'egg') { CMU.egg = +v < 0 ? null : +v; cmSnd('click'); return cmStart(); }
  if (c === 'begin') return cmBegin();
  if (c === 'fromdrop') return cmOpening({ noFilm: true, canSkip: true, asp: CMU.asp, look: CMU.look });
  if (c === 'cont') return cmContinue();
  if (c === 'codex') { CMU.codexFrom = run && run.phase === 'over' ? 'over' : run ? 'game' : 'start'; return cmCodex(); }
  if (c === 'ctab') { CMU.codexTab = v; return cmCodex(); }
  if (c === 'casp') { CMU.codexAsp = v; return cmCodex(); }
  if (c === 'cback') { if (CMU.codexFrom === 'over') return cardFinish(); if (CMU.codexFrom === 'game') return cmOv(null); return cmStart(); }
  if (c === 'home') { $('game').classList.remove('cm'); cmOv(null); cmSheet(null); CMU.run = null; G = null; busy = false; cmForgetSlime(); return showTitle(); }
  if (c === 'again') { cmOv(null); CMU.run = null; G = null; busy = false; cmForgetSlime(); $('game').hidden = true; return cmStart(); }
  if (c === 'close') return cmSheet(null);
  if (c === 'fold') { const n = el.nextElementSibling; if (n) { n.hidden = !n.hidden; el.classList.toggle('on', !n.hidden); } return; }
  if (c === 'tutoff') { cmMeta().tutOff = true; saveMeta(); cmCoachHide(); document.querySelectorAll('.cm-glow').forEach(x => x.classList.remove('cm-glow')); return; }
  if (c === 'tagi') { CMU.tagOpen = CMU.tagOpen === v ? null : v; return cmBodySheet(); }
  if (c === 'tutagain') { const m = cmMeta(); m.tutOff = false; m.tut = 0; saveMeta(); cmSheet(null); return cmCoach(); }
  if (c === 'egg-lay') return cmLayEgg();
  if (!run) return;
  if (c === 'moltok') { if (CMU.moltRes) CMU.moltRes(); return; }
  if (c === 'body') { cmSnd('click'); return cmBodySheet(); }
  if (c === 'chips') { cmSnd('click'); return cmSheet('chips', `<div class="cm-chipsheet">${(CMU.chipsAll || []).join('')}</div>`); }
  if (c === 'upkeep') { const u = cmUpkeep(); cmSnd('click'); return cmSheet('upkeep', u ? `<p class="h3">밥값이 모자란다</p><p>진액 ${R(Math.max(0, G.gold))} · ${u.days != null ? u.days + '일 뒤' : '내일'}</p><p class="small">${u.leaving.map(esc).join(', ')}</p>` : '<p>모자라지 않다</p>'); }
  if (c === 'threat') { cmSnd('click'); cmCoachDone('threat'); return cmSheet('threat', cmThreatHtml()); }
  if (c === 'reward') { const r = CARDMODE.takeReward(run, +el.dataset.i); if (r.ok) { cmSnd('up'); cmToast(r.msg || '덱에 넣었다'); } if (CMU.rewardRes) CMU.rewardRes(); return; }
  if (c === 'rskip') { CARDMODE.skipReward(run); if (CMU.rewardRes) CMU.rewardRes(); return; }
  if (c === 'reroll') { const r = CARDMODE.rerollReward(run); if (!r.ok) cmToast(r.msg); else cmSnd('click'); hud(); return cmRewardView(); }
  if (c === 'keep') { const u = +el.dataset.uid, k = CMU.keep.indexOf(u); if (k >= 0) CMU.keep.splice(k, 1); else if (CMU.keep.length < run.retain) CMU.keep.push(u); else { CMU.keep.shift(); CMU.keep.push(u); } cmSnd('click'); return cmKeepView(); }
  if (c === 'go') return cardNight(CMU.keep.slice());
  if (c === 'ovx') return cmOv(null);
  if (c === 'ndone' || c === 'nfold') { if (c === 'nfold') return cmNeedle('fold'); CMU.nres = null; cmOv(null); render(); return; }
  if (c === 'nbet') return cmNeedle('bet', v, +el.dataset.uid);
  if (c === 'nopen') return cmNeedle('open');
  if (c === 'paytbl') return cmSheet('pay', `<h3>바늘 점 · 족보와 몫</h3><div class="dk-list">${CARDMODE.NHANDS.slice(1).map(h => `<div class="dk-li"><b>${esc(h.name)}</b><span class="dk-mute">건 값 ×${h.pay}${h.extra ? ' · 선물' : ''}</span></div>`).join('')}</div>`);
  if (c === 'needle') return cmNeedle('start');
  if (busy || ST.mode !== 'day') return;
  if (c === 'card') { const u = +el.dataset.uid; cmSnd('click'); if (CMU.sel === u) { const vv = CARDMODE.handView(run).find(z => z.uid === u); if (vv && vv.target === 'none' && vv.can) return cmPlay(u, {}); return cmSelect(null); } return cmSelect(u); }
  if (c === 'unsel' || c === 'x') return cmSelect(null);
  if (c === 'rot') return cmRotate();
  if (c === 'put') { if (CMU.place) return cmPlay(CMU.sel, { cells: CMU.place.cells }); return cmPlay(CMU.sel, {}); }
  if (c === 'hint') { const h = cmHints()[0]; if (h) { cmSelect(h.uid); cmToast(h.card + ' · 보라 테두리 칸'); CMU.hintFocus = h.cell; } return; }
  if (c === 'deck') return cmDeckSheet();
  if (c === 'dtab') { CMU.deckTab = v; return cmDeckSheet(); }
  if (c === 'shop') return cmShopSheet();
  if (c === 'sink') { const r = CARDMODE.buySink(run, el.dataset.v); cmToast(r.msg); if (r.ok) cmSnd('coin'); CMU.threatKey = ''; render(); cmSave(); return cmShopSheet(); }
  if (c === 'buy') { const r = CARDMODE.shopBuy(run, +el.dataset.i); cmToast(r.msg || (r.ok ? '샀다' : '못 산다')); if (r.ok) cmSnd('coin'); render(); cmSave(); return cmShopSheet(); }
  if (c === 'up') return cmUpSheet();
  if (c === 'doup') { const r = CARDMODE.upgrade(run, +el.dataset.uid); cmToast(r.msg || (r.ok ? '강화했다' : '못 한다')); if (r.ok) cmSnd('up'); render(); cmSave(); return cmUpSheet(); }
  if (c === 'rm') return cmRmSheet();
  if (c === 'dorm') { const r = CARDMODE.removeCard(run, +el.dataset.uid); cmToast(r.msg || (r.ok ? '뺐다' : '못 뺀다')); if (r.ok) cmSnd('click'); render(); cmSave(); return cmRmSheet(); }
  if (c === 'combos') return cmCombosSheet();
  if (c === 'zoom') { CMU.zoom = CMU.zoom === 'near' ? 'fit' : 'near'; if (CMU.zoom === 'near') camCell(G.core, true); cmSnd('click'); return render(); }
  if (c === 'night') return cmNightAsk();
}

// 시험용
window.__card = { get run() { return CMU.run; }, CMU, CARDMODE, face: cmFace, dview: cmDefView, open: cardOpen, begin: cmBegin, select: cmSelect, tap: cmTapCell, play: cmPlay, night: cardNight, finish: cardFinish, molt: cmMoltScreen, guess: cmMoltGuess, genome: cmGenome, needle: cmNeedle, codex: cmCodex, hints: cmHints, rect: i => cellRect(i), render: () => render(), cam: i => camCell(i, true), get META() { return META; }, get ST() { return ST; }, get meta() { return cmMeta(); },
  // 칸 i 의 가운데를 화면 좌표로 (시험에서 지도를 누를 때)
  pt(i) { const b = $('stage').getBoundingClientRect(), u = b.height / (ST.vh || H), r = cellRect(i); return { x: b.left + (r.x + r.w / 2 + ST.ox - ST.cam.x) * u, y: b.top + (r.y + r.h / 2 + (ST.oyFit || 0) - (ST.cam.y || 0) - (ST.cam.v || 0)) * u }; } };

// ==== 몸이 주인공: 위쪽 초상, 몸 창, 오늘 밤 위험, 처음 판 안내, 카드 판 도움말 ====
// 위쪽 초상: 낮에는 크게(휴대폰 104px, PC 150px), 밤에는 작게. 누르면 몸 창
function cmBodyBand() {
  const wrap = $('stagewrap'); if (!wrap) return; let el = $('cm-body');
  const wideNow = cmOn() && ST.mode !== 'night' && !isMobile() && window.innerWidth >= 1000; $('game').classList.toggle('cm-wide', wideNow); $('game').classList.toggle('cm-mode', cmOn());
  let side = $('cm-side'); if (side) side.hidden = !wideNow;
  if (!cmOn()) { if (el) el.hidden = true; const dl = $('cm-dline'); if (dl) dl.hidden = true; return; }
  if (!el) { el = document.createElement('button'); el.id = 'cm-body'; el.dataset.c = 'body'; el.setAttribute('aria-label', '내 몸 보기'); wrap.appendChild(el); }
  if (wideNow && !side) { side = document.createElement('div'); side.id = 'cm-side'; wrap.appendChild(side); }
  if (wideNow) { if (el.parentNode !== side) side.insertBefore(el, side.firstChild); let th = $('cm-sth'); if (!th) { th = document.createElement('button'); th.id = 'cm-sth'; th.dataset.c = 'threat'; side.appendChild(th); } const tk = cmThreatKey() + '|' + (CMU.threat ? CMU.threat.level + CMU.threat.n : '') + '|' + G.day; if (th.dataset.k !== tk) { th.dataset.k = tk; th.innerHTML = G.march.tonight ? cmThreatHtml(true) : '<p class="h3">오늘 밤</p><p class="small mute">조용하다</p>'; } }
  else if (el.parentNode !== wrap) wrap.appendChild(el);
  const mp = typeof CARDMODE.moltProgress === 'function' ? (() => { try { return CARDMODE.moltProgress(CMU.run); } catch (e) { return null; } })() : null, bar0 = CARDMODE.evoBar ? CARDMODE.evoBar(CMU.run) : null, near = !!(mp ? (mp.near || (!mp.done && (mp.frac != null ? mp.frac : mp.p || 0) >= 0.85)) : (bar0 && !bar0.done && (bar0.frac || 0) >= 0.85));
  el.classList.toggle('near', near && ST.mode !== 'night'); el.classList.toggle('still', typeof motionOk === 'function' && !motionOk());
  const g = cmGenome(), night = ST.mode === 'night', sz = night ? 56 : isMobile() ? 88 : wideNow ? (window.innerWidth >= 1600 ? 224 : 176) : 150, nm = g && TRAITS.nameOf ? TRAITS.nameOf(g) : { name: '', title: '' }, bar = CARDMODE.evoBar ? CARDMODE.evoBar(CMU.run) : null;
  const dc = CMU.dayChange && Date.now() - CMU.dayChange.t < 6000 ? CMU.dayChange : null, key = cmGKey(g) + sz + (near ? 'N' : '') + (bar ? Math.round((bar.frac || 0) * 20) : '') + (dc ? dc.t : '') + nm.name;
  el.hidden = false; el.classList.toggle('night', night); el.classList.toggle('cm-pass', CMU.sel != null || !!(CMU.drag && CMU.drag.on));
  if (el.dataset.key !== key) {
    el.dataset.key = key;
    el.innerHTML = `<span class="cm-bimg">${dc ? `<span class="cm-bold">${dc.from}</span>` : ''}${g ? cmBodyImg(g, sz) : ''}</span>${night ? '' : `<b class="cm-bnm">${esc(nm.name || '이름 없는 것')}</b>${bar ? (bar.done ? '<small class="cm-bev">다 자랐다</small>' : `<span class="cm-evo" title="다음 허물까지"><u style="width:${Math.round(((mp && mp.frac != null ? mp.frac : bar.frac) || 0) * 100)}%"></u></span><small class="cm-bev">${near ? '허물이 가깝다' : '허물까지'}</small>`) : ''}`}`;
    if (dc) { el.classList.remove('cm-morphing'); void el.offsetWidth; el.classList.add('cm-morphing'); }
  }
  let dl = $('cm-dline'); if (!dl) { dl = document.createElement('div'); dl.id = 'cm-dline'; wrap.appendChild(dl); }
  if (dc && !night) { if (dl.dataset.t !== String(dc.t)) { dl.dataset.t = String(dc.t); dl.innerHTML = `<b>어제 → 오늘</b> ${esc(dc.line)}`; } dl.hidden = false; } else dl.hidden = true;
}
// 몸 창: 큰 그림, 이름, 몸에 돋은 것(형질)과 그것이 하는 일, 다음 허물까지
function cmBodyHtml() {
  const run = CMU.run, g = cmGenome(); if (!g) return '<p class="mute">아직 몸이 없다</p>';
  const nm = TRAITS.nameOf(g), top = TRAITS.topTags(g, 4), bar = CARDMODE.evoBar ? CARDMODE.evoBar(run) : null, cmb = TRAITS.combosOf ? TRAITS.combosOf(g) : [], cls = TRAITS.classOf ? TRAITS.classOf(g) : null;
  const story = TRAITS.narrate ? TRAITS.narrate(Object.assign({}, g, { usedLines: (g.usedLines || []).slice() }), 3) : [], nums = TRAITS.describe ? TRAITS.describe(g) : [];
  return `<div class="cm-bodyp"><div class="cm-bodybig">${cmBodyImg(g, isMobile() ? 144 : 176)}</div><h3>${esc(nm.name)}${nm.title ? `<small>「${esc(nm.title)}」</small>` : ''}</h3>
<p class="small mute">${(run.molts || []).length}번 허물을 벗었다${cls ? ' · ' + esc(TRAITS.LOCO[cls.loco] || '') + ' 몸' : ''}</p>
${bar && !bar.done ? `<div class="cm-evobig"><u style="width:${Math.round((bar.frac || 0) * 100)}%"></u></div><p class="small mute">다음 허물 ${Math.round((bar.frac || 0) * 100)}%</p>` : '<p class="small okc">더 벗을 허물이 없다. 다 자랐다</p>'}
${CMU.dayChange && CMU.dayChange.line ? `<p class="dk-lab">어제 → 오늘</p><div class="dk-list"><div class="dk-li">${esc(CMU.dayChange.line)}</div></div>` : ''}<p class="dk-lab">몸에 돋은 것</p><div class="cm-tagl">${top.map(t => `<button class="cm-tagrow" data-c="tagi" data-v="${t}"><b style="color:${CMGCOL[t] || '#fff3a0'}">${esc(cmTagName(t))}</b> <span class="num">${Math.round(g.tags[t] || 0)}</span></button>${CMU.tagOpen === t ? `<p class="small cm-taghint">${esc(TRAITS.TAGS[t].hint)}</p>` : ''}`).join('') || '<p class="small mute">아직 아무것도</p>'}</div>
${cmb.length ? `<p class="small okc">◇ ${cmb.slice(0, 2).map(c => esc(c.name)).join(' · ')}</p>` : ''}
${story.length ? cmFold('왜 이렇게 되었나', `<div class="dk-list">${story.map(x => `<div class="dk-li">${esc(x)}</div>`).join('')}</div>${nums.map(x => `<p class="small mute">${esc(x)}</p>`).join('')}`) : ''}
<p class="small mute">목숨 ${lifePips()} · 체력 ${Math.round(G.slime.hp)}</p></div>`;
}
function cmBodySheet() { cmSheet('body', cmBodyHtml()); cmCoachDone('body'); }

// ---- 오늘 밤 위험: 손을 쓰지 않으면 어떻게 끝나나를 미리 굴려 본다 (낮마다, 판이 바뀔 때만) ----
const CMTH = { safe: ['안전', '#8fd05f', 1], risk: ['위험', '#e8a830', 2], fatal: ['치명', '#ff5f57', 3] };
function cmThreatKey() { return G.day + '|' + G.cells.map(c => (c.dug ? 1 : 0) + c.type.slice(0, 2) + c.traps.length + (c.block ? 'b' : '')).join('') + '|' + G.kin.map(m => m.loc + ':' + m.lv).join(',') + '|' + Math.round(G.slime.hp); }
function cmThreat() {
  const run = CMU.run; if (!run || !G.march.tonight || run.phase !== 'day') return null; const k = cmThreatKey();
  if (CMU.threatKey === k) return CMU.threat; if (CMU.threatBusy) return CMU.threat;
  CMU.threatBusy = true; setTimeout(() => { let f = null; try { f = CARDMODE.foresee(run); } catch (e) { f = null; } CMU.threat = f; CMU.threatKey = k; CMU.threatBusy = false; if (cmOn()) cardTray(); }, 30);
  return CMU.threatKey === k ? CMU.threat : null;
}
function cmThreatHints() {
  const path = NEST.paths(G)[0] || [], onPath = new Set(path), hs = [];
  if (!path.some(i => G.cells[i].traps.length)) hs.push('길 위에 부위(함정)가 없다');
  if (!G.kin.some(m => m.kind !== 'spawn' && m.loc !== null && m.loc !== 'core' && onPath.has(m.loc))) hs.push('길 위 방에 권속이 없다');
  if (path.length < 6) hs.push('굴이 짧다 · 굴 카드로 길을 늘리면 오래 싸운다');
  if ((G.cardHeld || []).length) hs.push('쥔 기술 카드로 밤에 끼어들 수 있다');
  return hs;
}
function cmThreatChip() {
  const e = NEST.estimate(G, 'tonight'); if (!e) return ''; const f = cmThreat(), lv = f ? CMTH[f.level] : null;
  return `<button class="chip cm-threat${lv ? ' lv-' + f.level : ''}" data-c="threat"${lv ? ` style="--tc:${lv[1]}"` : ''}><span class="cm-tdots">${[1, 2, 3].map(i => `<i class="${lv && i <= lv[2] ? 'on' : ''}"></i>`).join('')}</span>${lv ? lv[0] : '…'} · 적 ${f ? f.n : '…'}${e.boss ? ' !' : ''}</button>`;
}
function cmThreatHtml(short) {
  const e = NEST.estimate(G, 'tonight'), f = cmThreat(), run = CMU.run; if (!e) return '<p class="mute">오늘 밤은 조용할 것 같다</p>';
  const lv = f ? CMTH[f.level] : null, kinds = f ? f.kinds : (e.kinds || []), nm = k => CARDMODE.knownName(run.meta, G.world, k);
  const bar = f ? `<div class="cm-tbar"><u style="width:${Math.round(100 * f.stopped / Math.max(1, f.n))}%;background:${lv[1]}"></u></div><p class="small">손을 안 쓰면: 적 ${f.n} 가운데 <b>${f.stopped}</b> 막는다${f.fell ? ' · <b class="up">본체가 쓰러진다</b>' : f.lost > 0.05 ? ' · 본체가 다친다' : ''}</p>` : '<p class="small mute">헤아리는 중…</p>';
  const hs = f && f.level !== 'safe' ? cmThreatHints() : [];
  return `<div class="cm-threatp">${lv ? `<p class="h3" style="color:${lv[1]}">오늘 밤 · ${lv[0]}</p>` : '<p class="h3">오늘 밤</p>'}<div class="cm-setinv">${kinds.slice(0, 8).map(k => `<span class="cm-inv">${invImg(k, 28)}<small>${esc(nm(k))}${f && f.count && f.count[k] > 1 ? ' ×' + f.count[k] : ''}</small></span>`).join('')}${!kinds.length ? `<span class="small">${f ? f.n : e.count}</span>` : ''}</div>${bar}${f ? '<p class="small mute">기술 카드를 쓰면 결과가 달라진다</p>' : ''}${hs.length ? `<div class="stack" style="gap:2px">${hs.slice(0, short ? 2 : 4).map(h => `<p class="small warnc">· ${esc(h)}</p>`).join('')}</div>` : ''}</div>`;
}

// ---- 처음 판 안내: 손 → 칸 → 돌리기 → 다른 카드 → 몸 → 위험 → 밤 → 기술 → 보상 ----
const CMTUT = [
  { id: 'hand', at: '#chand .cm-hand .dkc.t-shape, #chand .cm-hand .dkc', say: '카드를 누르면 놓을 수 있는 칸이 빛난다. 굴 카드는 둥지를 넓힌다.', when: () => ST.mode === 'day' && $('cm-ov').hidden, done: () => CMU.sel != null || (CMU.run.st.shapes || 0) > 0 },
  { id: 'map', at: '#stage', say: '빛나는 칸을 누르면 굴 모양이 비친다.', when: () => CMU.sel != null && (cmCard(CMU.sel) && cmDef(cmCard(CMU.sel).id).type === 'shape'), done: () => !!CMU.place || (CMU.run.st.shapes || 0) > 0 },
  { id: 'rot', at: '[data-c="rot"]', say: '↻ 돌리기로 모양을 바꾸고, 「놓기」로 판다.', when: () => !!CMU.place, done: () => (CMU.run.st.shapes || 0) > 0 },
  { id: 'more', at: '#chand', say: '기관·부위·권속 카드도 빛나는 칸에 놓는다. 위로 끌어 놓을 수도 있다.', when: () => ST.mode === 'day' && CMU.sel == null, done: () => (CMU.run.st.organs || 0) + (CMU.run.st.traps || 0) + (G.stats.kinMade || 0) > 0 || G.day >= 3 },
  { id: 'body', at: '#cm-body', say: '위쪽 그림이 본체다. 한 일에 따라 몸이 바뀐다. 누르면 자세히 본다.', when: () => ST.mode === 'day', done: () => ST.mode === 'night', auto: 7000 },
  { id: 'threat', at: '.cm-threat', say: '오늘 밤 올 무리와 막을 힘이다. 붉으면 더 놓아야 한다.', when: () => ST.mode === 'day' && !!G.march.tonight && !!document.querySelector('.cm-threat'), done: () => ST.mode === 'night', auto: 7000 },
  { id: 'night', at: '[data-c="night"]', say: '다 놓았으면 「밤 맞기」를 누른다.', when: () => ST.mode === 'day' && CMU.sel == null, done: () => ST.mode === 'night' },
  { id: 'skill', at: '#hand .cm-nhand, #hand', say: '무리가 방에 들면 멈춘다. 기술 카드를 누르면 끼어든다.', when: () => ST.mode === 'night' && !$('hand').hidden, done: () => ST.mode !== 'night', seen: 1 },
  { id: 'reward', at: '.dk-pick3', say: '셋 가운데 하나를 덱에 넣는다.', when: () => !!document.querySelector('#cm-ov .dk-pick3'), done: () => CMU.run.phase !== 'reward', seen: 1 }
];
// 첫 판 안내가 「기술」 단계에 닿기 전이면, 무리가 처음 방에 들 때 한 번은 반드시 멈춘다
function cmForcePause(ctx) { const m = cmMeta(), k = CMTUT.findIndex(x => x.id === 'skill'); return cmTutOn() && (m.tut || 0) <= k && ctx.opts.some(o => o.ok); }
const cmTutOn = () => { const m = cmMeta(); return !m.tutOff && (m.tut || 0) < CMTUT.length; };
function cmCoachDone(id) { const m = cmMeta(), k = CMTUT.findIndex(s => s.id === id); if (k >= 0 && (m.tut || 0) === k) { m.tut = k + 1; CMU.coachAt = 0; saveMeta(); } }
function cmCoachHide() { const b = $('cm-coach'); if (b) b.hidden = true; document.querySelectorAll('.cm-glow').forEach(x => x.classList.remove('cm-glow')); }
function cmCoach() {
  if (!CMU.run || !cmTutOn()) return cmCoachHide(); const m = cmMeta();
  let s = CMTUT[m.tut || 0];
  while (s && (!s.seen || (CMU.shown || {})[s.id]) && (() => { try { return s.done(); } catch (e) { return false; } })()) { m.tut = (m.tut || 0) + 1; CMU.coachAt = 0; saveMeta(); s = CMTUT[m.tut]; }
  if (!s) return cmCoachHide();
  if ((!$('cm-ov').hidden && s.id !== 'reward') || CMU.sheet || ($('modal') && !$('modal').hidden)) return cmCoachHide();
  let show = false; try { show = s.when(); } catch (e) { show = false; }
  const tgt = show ? document.querySelector(s.at) : null; if (!tgt || !tgt.getBoundingClientRect().width) return cmCoachHide();
  if (!CMU.coachAt || CMU.coachId !== s.id) { CMU.coachAt = Date.now(); CMU.coachId = s.id; }
  (CMU.shown = CMU.shown || {})[s.id] = 1;
  if (s.auto && Date.now() - CMU.coachAt > s.auto) { cmCoachDone(s.id); return cmCoach(); }
  let b = $('cm-coach'); if (!b) { b = document.createElement('div'); b.id = 'cm-coach'; document.body.appendChild(b); }
  if (b.dataset.id !== s.id) { b.dataset.id = s.id; b.innerHTML = `<span class="cm-cotx">${esc(s.say)}</span><button class="cm-cox" data-c="tutoff" aria-label="안내 끄기">안내 끄기</button><i class="cm-coar"></i>`; }
  b.hidden = false; const r = tgt.getBoundingClientRect(), bw = Math.min(innerWidth - 16, 300); b.style.width = bw + 'px';
  const left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2)), bh = b.offsetHeight || 60, above = r.top - bh - 14 > 8 && !(s.id === 'map');
  b.style.left = left + 'px'; b.style.top = (s.id === 'map' ? Math.max(8, r.top + 12) : above ? r.top - bh - 12 : Math.min(innerHeight - bh - 8, r.bottom + 12)) + 'px';
  b.classList.toggle('below', !above || s.id === 'map'); const ar = b.querySelector('.cm-coar'); if (ar) ar.style.left = Math.max(14, Math.min(bw - 14, r.left + r.width / 2 - left)) + 'px';
  document.querySelectorAll('.cm-glow').forEach(x => { if (x !== tgt) x.classList.remove('cm-glow'); }); if (s.id !== 'map') tgt.classList.add('cm-glow');
}
setInterval(() => { if (CMU.run && cmOnScreen()) { cmCoach(); cmBodyBand(); } else cmCoachHide(); }, 350);

// ---- 카드 판 도움말: 이 판에서 쓰는 말만 ----
function cmHelpHtml() {
  const L = [['낮', '아침마다 덱에서 다섯 장이 온다. 굴 카드로 둥지를 넓히고, 기관·부위·권속을 칸에 놓는다'], ['밤', '「밤 맞기」를 누르면 무리가 길을 따라 내려온다. 싸움은 저절로 되고, 무리가 방에 들면 멈춘다'],
    ['기술', '밤에 멈췄을 때 쥔 기술 카드를 눌러 끼어든다. 신앙이 든다'], ['진액', '카드를 놓고 사는 데 쓴다. 밤을 넘기면 들어온다'], ['신앙', '밤의 기술 카드에 든다'],
    ['굴 · 기관 · 부위 · 권속', '굴 = 둥지 넓히기, 기관 = 방의 쓰임, 부위 = 몸에서 뻗은 함정, 권속 = 둥지에 사는 살붙이'], ['몸', '한 일에 따라 몸이 바뀐다. 많이 하면 허물을 벗고, 허물마다 몸이 크고 카드 몇 장이 다시 쓰인다'],
    ['위험', '지도 위 「안전·위험·치명」은 손을 안 쓰면 오늘 밤이 어떻게 끝나는지다'], ['족보', '칸에 놓은 모양이 맞물리면 ◇ 이름이 붙고 힘이 붙는다'], ['목숨', '본체가 쓰러지면 목숨 하나를 잃는다. 다 잃으면 판이 끝난다']];
  return `<div class="cm-help"><h3>카드로 짓는 둥지</h3>${L.map(([k, v]) => `<div class="cm-hrow"><b>${esc(k)}</b><span class="small">${esc(v)}</span></div>`).join('')}<div class="dk-row2"><button class="btn" data-c="tutagain">처음 안내 다시 보기</button></div></div>`;
}

// ---- 키보드 (ui.js 가 카드 판에서 먼저 부른다. 맡았으면 true) ----
// 1~5 손의 카드 고르기 · R 돌리기 · Enter 놓기/확인 · Space 밤 맞기 · Esc 창 닫기/내려놓기
function cardKey(e) {
  if (!CMU.run || !G || !G.cardMode) return false; const k = e.key, ov = $('cm-ov'), ovOn = ov && !ov.hidden, q = sel => ov && ov.querySelector(sel);
  if (k === 'Escape') { if (CMU.sheet) { cmSheet(null); return true; } if (ovOn && q('[data-c="ovx"]')) { cmOv(null); return true; } if (CMU.sel != null) { cmSelect(null); return true; } return false; }
  if (ovOn) {
    if (k === 'Enter' || k === ' ') { const b = q('[data-c="moltok"]') || q('[data-c="go"]') || q('[data-c="ndone"]'); if (b) { b.click(); return true; } }
    if (/^[1-3]$/.test(k) && q('[data-c="reward"]')) { const b = q(`[data-c="reward"][data-i="${+k - 1}"]`); if (b) { b.click(); return true; } }
    return false;
  }
  if (busy || ST.mode !== 'day' || CMU.run.phase !== 'day') return false;
  if (/^[1-9]$/.test(k)) { const hv = CARDMODE.handView(CMU.run), v = hv[+k - 1]; if (!v) return false; cmSnd('click'); cmSelect(CMU.sel === v.uid ? null : v.uid); return true; }
  if (k === 'r' || k === 'R') { if (CMU.place) { cmRotate(); return true; } return false; }
  if (k === 'Enter') { if (CMU.sel == null) return false; const v = CARDMODE.handView(CMU.run).find(z => z.uid === CMU.sel); if (!v) return false; if (CMU.place) { cmPlay(v.uid, { cells: CMU.place.cells }); return true; } if (v.target === 'none' && v.can) { cmPlay(v.uid, {}); return true; } if (v.target === 'cell' && (v.cellsCan || []).length) { cmPlay(v.uid, { cell: CMU.hintFocus != null && v.cellsCan.includes(CMU.hintFocus) ? CMU.hintFocus : v.cellsCan[0] }); return true; } if (v.target === 'shape' && (v.places || []).length) { cmTapCell(v.places[0][0]); return true; } return false; }
  if (k === ' ') { cmNightAsk(); return true; }
  return false;
}
