// 옛 것의 둥지 — 땅속의 한 방울 (규칙). 둥지를 틀기 전, 빛 없는 흙 속에서 살아남으며 다섯 번 자란다.
// 이 파일에는 화면이 없다(node 에서도 돈다). 화면은 prologue2.js 의 runPrologue 가 맡는다.
//   PRO.makeSim({ asp, seed }) → sim.  sim.tick() 한 틱(1/30초), sim.aim(x, y), sim.act(), sim.buy(id), sim.result(kind)
// 자랄 때마다 세상이 넓어지고, 어제 나를 쫓던 것이 오늘의 먹이가 된다. 먹은 것으로 부위를 돋우고(다섯 자리 × 다섯 징조 × 세 단계),
// 부위가 없으면 못 먹는 먹이와 못 피하는 것들이 있다. 쓰지 않고 남긴 것이 둥지의 첫 정수가 된다.
const PRO = (function () {
  const TPS = 30, ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'], ASPK = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' };
  // 다섯 번의 몸: need = 이 몸을 벗는 데 드는 몸집, R = 갈 수 있는 세상의 반지름, r = 몸의 반지름, sp = 빠르기, sc = 그림 배율, zoom = 화면 배율, light = 밝은 둘레
  const STG = [null,
    { name: '한 방울', need: 16, R: 250, r: 6, sp: 60, sc: 1, zoom: 1, light: 84 },
    { name: '기는 것', need: 58, R: 440, r: 9, sp: 68, sc: 1.4, zoom: 0.78, light: 108 },
    { name: '파고드는 것', need: 125, R: 680, r: 13, sp: 78, sc: 2, zoom: 0.6, light: 140 },
    { name: '삼키는 것', need: 265, R: 980, r: 18, sp: 90, sc: 2.8, zoom: 0.47, light: 180 },
    { name: '다 자란 것', need: 450, R: 1340, r: 24, sp: 102, sc: 3.7, zoom: 0.37, light: 230 }];
  const K = { maxT: 450, lives: 2, hp: 2, cost: [4, 9, 16], eyeCost: [3, 7, 12], hintC: 1.9, hintF: 2.1, open: { mouth: 1, eye: 1, leg: 2, skin: 2, core: 3 }, bead: 4, goldCap: 120,
    essF: [0, 0.2, 0.22, 0.25, 0.28, 0.32], essCap: [0, 4, 8, 14, 22, 36], keepFrom: 3, settleFrom: 2, sweepStage: 120, sweepAll: 345 };
  // 사는 것들. st = 그것과 맞수가 되는 몸. 내 몸이 st 보다 작으면 못 이긴다, 같으면 피할 수 있다, 크면 먹이다
  const SP = {
    mite: { name: '흙진드기', st: 1, r: 5, sp: 46, see: 70, val: 3, say: '느리게 따라와 문다' },
    leech: { name: '달라붙이', st: 1, r: 4, sp: 62, see: 64, val: 2, say: '붙어서 모은 것을 빨아먹는다' },
    pack: { name: '떼이빨', st: 2, r: 5, sp: 59, see: 100, val: 2, say: '여럿이 에워싼다' },
    lurker: { name: '숨은턱', st: 2, r: 9, sp: 50, see: 27, val: 7, say: '흙에 묻혀 있다가 솟는다' },
    weaver: { name: '실잣이', st: 2, r: 7, sp: 54, see: 90, val: 6, say: '실을 쳐 두고 걸린 것을 문다' },
    grazer: { name: '등딱지', st: 2, r: 11, sp: 16, see: 0, val: 11, armor: 2, calm: true, say: '물지 않는다. 껍질이 단단하다' },
    charger: { name: '들이받이', st: 3, r: 12, sp: 50, see: 175, val: 12, say: '겨누고 나서 일직선으로 들이받는다' },
    spitter: { name: '침뱉이', st: 3, r: 9, sp: 56, see: 190, val: 10, say: '멀리서 침을 뱉는다. 떨어진 자리가 녹는다' },
    hunter: { name: '굴이빨', st: 3, r: 11, sp: 73, see: 150, val: 12, say: '끈질기게 쫓아온다' },
    mimic: { name: '미끼혹', st: 3, r: 8, sp: 62, see: 15, val: 11, say: '먹이인 척한다' },
    mother: { name: '굴어미', st: 4, r: 26, sp: 0, see: 160, val: 26, say: '새끼를 끝없이 낳는다' },
    filter: { name: '들숨입', st: 4, r: 20, sp: 0, see: 185, val: 22, say: '숨을 들이쉬어 끌어당긴다' },
    stalker: { name: '그림자발', st: 4, r: 14, sp: 96, see: 300, val: 20, say: '빛 가장자리를 돌다가 덮친다' },
    blind: { name: '눈먼 큰것', st: 5, r: 44, sp: 112, see: 290, val: 45, say: '눈이 없다. 떨림을 따라온다' },
  };
  const CENSUS = [null,
    { mite: 5, leech: 2, lurker: 1 },   // 첫 몸에서는 떼이빨이 나오지 않는다. 사람 손으로는 첫 20초에 에워싸이면 배울 틈이 없다
    { mite: 3, leech: 2, lurker: 4, pack: 2, weaver: 3, grazer: 3, charger: 1, hunter: 3 },
    { weaver: 2, grazer: 3, charger: 3, spitter: 2, hunter: 3, mimic: 3, stalker: 1, mother: 1 },
    { charger: 2, spitter: 3, hunter: 3, mimic: 3, mother: 2, filter: 3, stalker: 3, blind: 1 },
    { spitter: 2, hunter: 3, mother: 2, filter: 3, stalker: 3, blind: 2 }];
  // 먹이. tier = 어느 몸의 먹이인가(두 몸 넘게 자라면 반밖에 안 된다), need = 입의 힘, chew = 서서 씹는 시간
  const FOOD = {
    mote: { name: '알갱이', val: 1, tier: 1 }, wrig: { name: '꿈틀이', val: 2, tier: 1 }, bead: { name: '진액 방울', val: 0, tier: 1 },
    cap: { name: '빛갓', val: 2, tier: 2, say: '상처 하나가 아문다' }, seed: { name: '씨앗', val: 4, tier: 2, need: 1 }, seed2: { name: '굳은 씨', val: 8, tier: 3, need: 2 }, nut: { name: '돌열매', val: 15, tier: 4, need: 3 },
    bulb: { name: '쓴알뿌리', val: 6, tier: 2, bitter: true }, root: { name: '굵은 뿌리', val: 8, tier: 3, need: 1, chew: 1.4 }, carc: { name: '주검', val: 16, tier: 3, need: 1, chew: 2.2 }, egg: { name: '알', val: 3, tier: 2 },
  };
  const FCENSUS = [null,
    { cl: 6, clN: 5, grow: 6, wrig: 6, bead: 4, cap: 1, seed: 3 },
    { cl: 7, clN: 6, grow: 8, wrig: 5, bead: 6, cap: 2, seed: 6, bulb: 4, root: 3, egg: 2 },
    { cl: 5, clN: 6, grow: 11, wrig: 3, bead: 8, cap: 2, seed2: 6, bulb: 6, root: 5, carc: 2, egg: 2 },
    { cl: 4, clN: 5, grow: 14, bead: 10, cap: 3, seed2: 4, nut: 5, bulb: 5, root: 5, carc: 4, egg: 3 },
    { cl: 3, clN: 5, grow: 16, bead: 12, cap: 3, nut: 7, root: 6, carc: 6, egg: 3 }];
  const CREV = [null, { n: 3, r: 14, fit: 2 }, { n: 4, r: 18, fit: 3 }, { n: 4, r: 24, fit: 4 }, { n: 4, r: 30, fit: 5 }, { n: 3, r: 36, fit: 5 }];

  // ---------- 부위: 다섯 자리 × 다섯 징조. 한 자리에는 하나만. v = 단계별 세기 ----------
  const SLOTS = [['mouth', '입'], ['eye', '눈'], ['leg', '발'], ['skin', '겉'], ['core', '속']], SLOTK = { mouth: '입', eye: '눈', leg: '발', skin: '겉', core: '속' };
  const SLOTSAY = { mouth: '입이 클수록 큰 것을 삼키고 단단한 것을 깬다', eye: '어둠 속에 숨은 것을 알아본다', leg: '단추를 눌러 쓰는 재주가 생긴다', skin: '물리고 녹고 걸리는 것을 막는다', core: '몸속의 살림' };
  const part = (slot, asp, name, mut, v, say, o) => Object.assign({ id: slot + '_' + asp, slot, asp, name, mut, v, say, cost: slot === 'eye' ? K.eyeCost : K.cost }, o || {});
  const CAT = [
    part('mouth', 'abyss', '빨판', 'tentacle', [24, 36, 50], v => `둘레 ${v} 안의 먹이가 빨려 온다`),
    part('mouth', 'nebula', '빛입', 'ring', [30, 55, 80], v => `먹을 때 ${v}%로 한 입 더 얻는다`),
    part('mouth', 'brood', '포자입', 'mouth', [35, 55, 75], v => `먹은 자리에 ${v}%로 알갱이가 돋는다`),
    part('mouth', 'dusk', '속삭입', 'whisper', [60, 90, 130], v => `둘레 ${v} 안의 먹잇감이 달아나지 않는다`),
    part('mouth', 'hunger', '톱니입', 'teeth', [1, 2, 3], (v, k) => ['입의 힘이 하나 더 세다. 지친 맞수를 삼킨다', '맞수를 언제든 삼킨다', '굳거나 엉킨 큰 것까지 삼킨다'][k]),
    part('eye', 'abyss', '등불', 'gills', [35, 60, 90], (v, k) => `밝은 둘레 +${v}%. 빛 안에서는 묻힌 것` + (k ? '과 먹이인 척하는 것' : '') + '이 드러난다'),
    part('eye', 'nebula', '셋째눈', 'thirdeye', [1, 2, 3], (v, k) => ['묻힌 것과 먹이인 척하는 것이 보인다', '어둠 속과 화면 밖의 사나운 것이 보인다', '덮치기 전의 낌새가 더 일찍 보인다'][k]),
    part('eye', 'brood', '더듬이', 'spore', [12, 22, 32], (v, k) => ['큰 먹이가 있는 쪽을 가리킨다', '빛갓과 알도 가리킨다', '진액과 틈도 가리킨다'][k] + `. 알갱이가 아닌 먹이 +${v}%`),
    part('eye', 'dusk', '가면눈', 'maskm', [25, 40, 55], v => `사나운 것이 ${v}% 더 가까이 와야 나를 알아챈다`),
    part('eye', 'hunger', '피눈', 'steelgut', [15, 25, 35], v => `삼킬 수 있는 것이 표시된다. 그 곁에서 ${v}% 빠르다`),
    part('leg', 'abyss', '물살발', 'gills', [5, 4, 3], (v, k) => `재주: 잠깐 세 배로 내달린다 (${v}초마다). 늘 ${[6, 10, 14][k]}% 빠르다`, { act: '내달리기' }),
    part('leg', 'nebula', '별뜀', 'ring', [6, 5, 4], (v, k) => `재주: 가는 쪽으로 ${[60, 85, 110][k]}만큼 건너뛴다 (${v}초마다)`, { act: '건너뛰기' }),
    part('leg', 'brood', '뿌리발', 'spore', [9, 8, 7], (v, k) => `재주: ${[1.6, 2.2, 2.8][k]}초 동안 흙에 박혀 아무것도 못 건드린다 (${v}초마다)`, { act: '파묻히기' }),
    part('leg', 'dusk', '실발', 'whisper', [7, 6, 5], (v, k) => `재주: 덫을 놓는다. 밟은 것이 ${[2, 3, 4][k]}초 엉킨다 (${v}초마다)`, { act: '덫 놓기' }),
    part('leg', 'hunger', '덮침발', 'teeth', [6, 5, 4], (v, k) => `재주: ${[70, 90, 110][k]}만큼 덮친다. 먹이는 삼키고 맞수는 굳힌다 (${v}초마다)`, { act: '덮치기' }),
    part('skin', 'abyss', '비늘', 'tentacle', [1, 1, 2], (v, k) => `버팀 +${v}` + ['', '. 침에 녹지 않는다', '. 침에 녹지 않는다'][k]),
    part('skin', 'nebula', '수정껍질', 'thirdeye', [2, 3.5, 5], (v, k) => `나를 문 것이 ${v}초 굳는다` + (k ? '. 실에 걸리지 않는다' : '')),
    part('skin', 'brood', '이끼', 'spore', [40, 30, 22], v => `쓴 것과 침이 듣지 않는다. ${v}초마다 상처 하나가 아문다`),
    part('skin', 'dusk', '막', 'maskm', [35, 26, 18], v => `실에 걸리지 않는다. ${v}초마다 한 번 흘려보낸다`),
    part('skin', 'hunger', '가시', 'teeth', [1, 2, 3], (v, k) => ['나를 문 작은 것은 죽고 큰 것은 굳는다', '쓴 것도 먹는다', '물려도 모은 것을 흘리지 않는다'][k]),
    part('core', 'abyss', '닻주머니', 'gills', [50, 80, 100], (v, k) => `들숨에 ${v}% 덜 끌려간다. 달라붙이가 못 붙는다. 물리면 ${[2, 1, 0][k]}개만 흘린다`),
    part('core', 'nebula', '고리', 'ring', [34, 48, 62], v => `둘레 ${v} 안의 알갱이와 방울을 저절로 긁어 온다`),
    part('core', 'brood', '알주머니', 'mouth', [15, 30, 45], v => `남긴 것의 정수 +${v}%. 씹는 것이 그만큼 빠르다`),
    part('core', 'dusk', '울림통', 'whisper', [14, 11, 8], (v, k) => `재주에 얹힌다: 둘레 ${[110, 140, 180][k]} 안의 사나운 것을 쫓는다 (${v}초마다)`, { act: '울림' }),
    part('core', 'hunger', '강철위', 'steelgut', [15, 30, 45], v => `산 것을 삼킬 때 ${v}% 더 얻는다`),
  ];
  const PART = {}; CAT.forEach(c => { PART[c.id] = c; });

  // ---------- 처음 받는 몸: 판마다 열다섯 가운데 하나. 타고난 것이 조금씩 다르다 (seeds.js) ----------
  const SEEDS_ = (typeof SEEDS !== 'undefined' && SEEDS) || (typeof require !== 'undefined' ? require('./seeds.js') : {}), SEED_IDS = Object.keys(SEEDS_);
  const FORM0 = { sp: 1, light: 1, see: 1, eat: 1, ess: 0, bead: 1, hp: 0, pull: 0, mouth: 0, stun: 0, drop: 3, mend: 0, act: false, fit: 0, buried: false, keepPart: false };
  const ACT0 = { name: '튕기기', cd: 7, dash: 0.3 };
  const pickLook = seed => SEED_IDS.length ? SEED_IDS[(Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 9) % SEED_IDS.length] : null;

  function makeSim(opts) {
    opts = opts || {};
    const home = ASPS.includes(opts.asp) ? opts.asp : 'abyss', STY = opts.story || null;   // 이야기 1장: 목표 크기, 넉넉한 목숨, 적은 짐승, 쓸고 가는 것 없음
    let seed = (opts.seed >>> 0) || 1; const look = SEEDS_[opts.look] ? opts.look : pickLook(seed), F = Object.assign({}, FORM0, look ? SEEDS_[look].mod : null); const rnd = () => { let t = (seed = (seed + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const rr = (a, b) => a + rnd() * (b - a), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const zero = () => ({ abyss: 0, nebula: 0, brood: 0, dusk: 0, hunger: 0 }), pickAsp = () => rnd() < 0.4 ? home : ASPS[Math.floor(rnd() * 5)];
    const ev = [], emit = (k, o) => { if (ev.length < 240) ev.push(Object.assign({ k, t: S.t }, o || {})); };
    const S = { t: 0, stage: 1, stageT: 0, bio: 0, purse: zero(), spent: 0, gold: 0, worn: {}, hp: K.hp, lives: K.lives, falls: 0, ended: null, seen: {}, upAt: -999,
      food: [], wrig: [], cre: [], clusters: [], crev: [], webs: [], shots: [], puddles: [], snares: [], drops: [],
      sweep: { st: 'idle', next: 0, x: 0, y: 0, dx: 0, dy: 0, sx: 0, sy: 0, t0: 0, warn: 0, n: 0 }, stats: { hits: 0, eaten: 0, swallowed: 0, acts: 0, bought: 0, defeats: 0, byKind: {} }, cap: null,
      eco: { eats: 0, grew: 0, promo: 0, fights: 0, scav: 0, carc: 0, far: 0, tP: 0, tO: 0 } };
    S.hp = K.hp + F.hp; if (STY && STY.lives) S.lives = STY.lives;
    const P = { mendAt: F.mend * TPS, x: 0, y: 0, vx: 0, vy: 0, face: 1, inv: 45, aimX: 0, aimY: 0, aimOn: false, cd: 0, cd2: 0, dash: 0, burrow: 0, pounce: null, chew: null, leech: null, veilAt: 0, mossAt: 0, slow: 0, noise: 0, crev: null, kx: 0, ky: 0 };
    const G = () => STG[S.stage];
    // ---------- 부위를 읽는 손잡이 ----------
    const lv = id => { const w = S.worn[PART[id].slot]; return w && w.id === id ? w.lv : 0; }, val = id => { const k = lv(id); return k ? PART[id].v[k - 1] : 0; };
    const mouthLv = () => { const w = S.worn.mouth; return Math.max(F.mouth, w ? w.lv + (w.id === 'mouth_hunger' ? 1 : 0) : 0); };
    const maxHp = () => K.hp + F.hp + val('skin_abyss'), lightR = () => G().light * F.light * (1 + val('eye_abyss') / 100);
    const fits = q => S.stage <= q.fit + F.fit;
    const acidOK = () => lv('skin_brood') >= 1 || lv('skin_abyss') >= 2, webOK = () => lv('skin_dusk') >= 1 || lv('skin_nebula') >= 2, bitterOK = () => lv('skin_brood') >= 1 || lv('skin_hunger') >= 2;
    const hostile = c => !SP[c.k].calm && c.st >= S.stage, prey = c => c.st < S.stage;
    const stuck = c => c.stun > 0 || c.mode === 'rest' || c.mode === 'eat' || c.mode === 'fight';
    const cval = c => Math.round(SP[c.k].val * (1 + 0.4 * (c.gr || 0)));
    const canEat = c => { const m = mouthLv(), a = SP[c.k].armor || 0, th = lv('mouth_hunger'); if (c.st < S.stage) return m >= c.st - 1 && m >= a; if (c.st === S.stage) return th >= 2 || (th >= 1 && stuck(c)); return th >= 3 && c.st === S.stage + 1 && c.stun > 0; };
    const held = () => S.cap && S.cap.hold > S.t;                                   // 자람·쓰러짐 알림은 잠깐 다른 말에 덮이지 않는다
    const caption = (s, sub, sec, hold) => { if (!hold && held()) return; S.cap = { s, sub: sub || '', until: S.t + (sec || 2.8) * TPS, hold: hold ? S.t + hold * TPS : 0 }; };
    const once = (key, s, sub, sec) => { if (S.seen[key] || held()) return false; S.seen[key] = 1; caption(s, sub, sec); return true; };

    // ---------- 세상을 깐다: 고리 다섯 겹. 바깥 고리는 그만큼 자라야 열린다 ----------
    const ringPos = k => { const r0 = k === 1 ? 44 : STG[k - 1].R + 16, r1 = STG[k].R - 16, a = rnd() * 6.2832, r = Math.sqrt(r0 * r0 + rnd() * (r1 * r1 - r0 * r0)); return { x: Math.cos(a) * r, y: Math.sin(a) * r }; };
    const spot = (k, minD, lists) => { let p = ringPos(k); for (let n = 0; n < 24; n++) { if (lists.every(L => L.every(o => dist(o, p) > minD))) return p; p = ringPos(k); } return p; };
    let nid = 1;
    const mkCre = (k, ring, at, g) => { const d = SP[k], c = { id: nid++, k, st: d.st, r: d.r, ring, x: at.x, y: at.y, hx: at.x, hy: at.y, vx: 0, vy: 0, face: 1, alive: true, mode: 'idle', t: rnd() * 90, cd: 0, stun: 0, wa: rnd() * 6.28, asp: pickAsp(), g: g || 0, deadAt: 0, tx: 0, ty: 0, kids: 0, fed: 0, gr: 0, full: 0, tg: null, fd: null, nib: 0, foe: null, fleeT: 0, fleeFrom: null, on: '' }; if (k === 'lurker') c.mode = 'buried'; if (k === 'mimic') { c.mode = 'bait'; c.look = rnd() < 0.5 ? 'cap' : 'seed'; } S.cre.push(c); return c; };
    const mkFood = (k, ring, at, o) => { const f = Object.assign({ id: nid++, k, ring, x: at.x, y: at.y, alive: true, asp: k === 'bead' ? null : pickAsp(), ph: Math.floor(rnd() * 4), back: 0 }, o || {}); S.food.push(f); return f; };
    S.crev.push({ x: 0, y: 0, r: CREV[1].r, fit: CREV[1].fit, ring: 1 });
    for (let k = 1; k <= 5; k++) {
      const c = CREV[k]; for (let n = (k === 1 ? 1 : 0); n < c.n; n++) { const p = spot(k, 120, [S.crev]); S.crev.push({ x: p.x, y: p.y, r: c.r, fit: c.fit, ring: k }); }
      const F = FCENSUS[k]; for (let n = 0; n < F.cl; n++) { const p = spot(k, 70, [S.clusters, k === 1 ? [{ x: 0, y: 0 }] : []]), asp = n < 2 ? home : ASPS[(n + k) % 5], c2 = { x: p.x, y: p.y, r: 20 + k * 4, asp, ring: k, cap: F.clN, grow: F.grow * TPS, at: 0, seed: nid++ }; S.clusters.push(c2); for (let j = 0; j < F.clN; j++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * c2.r; mkFood('mote', k, { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d * 0.7 }, { asp, cl: c2 }); } }
      for (let n = 0; n < (F.wrig || 0); n++) { const p = ringPos(k); S.wrig.push({ id: nid++, x: p.x, y: p.y, vx: 0, vy: 0, wa: rnd() * 6.28, asp: pickAsp(), alive: true, ring: k, back: 0 }); }
      for (const fk of ['bead', 'cap', 'seed', 'seed2', 'nut', 'bulb', 'root', 'carc']) for (let n = 0; n < (F[fk] || 0); n++) mkFood(fk, k, spot(k, 34, [S.food.filter(f => f.k !== 'mote')]));
      const C = (STY && STY.census && STY.census[k]) || CENSUS[k]; for (const ck in C) for (let n = 0; n < C[ck]; n++) { const p = spot(k, ck === 'pack' ? 150 : 90, [S.cre, [{ x: 0, y: 0 }]]); if (ck === 'pack') { const g = nid++; for (let j = 0; j < 4; j++) mkCre('pack', k, { x: p.x + rr(-14, 14), y: p.y + rr(-14, 14) }, g); } else mkCre(ck, k, p); }
      // 알은 지키는 것 곁에 놓인다
      const guards = S.cre.filter(c2 => c2.ring === k && (c2.k === 'mother' || c2.k === 'pack' || c2.k === 'hunter')); for (let n = 0; n < (F.egg || 0) && guards.length; n++) { const g = guards[Math.floor(rnd() * guards.length)]; for (let j = 0; j < 3; j++) mkFood('egg', k, { x: g.hx + rr(-12, 12) + (g.k === 'mother' ? 30 : 0), y: g.hy + rr(-10, 10) }); }
    }
    // 실잣이는 제 둘레에 실을 쳐 둔다
    const spin = c => { for (let j = 0; j < 7; j++) { const a = j * 0.9 + rnd(), d = rr(20, 58); S.webs.push({ x: c.hx + Math.cos(a) * d, y: c.hy + Math.sin(a) * d, r: 15, own: c.id }); } };
    S.cre.forEach(c => { if (c.k === 'weaver') spin(c); });

    // ---------- 먹는다 ----------
    const gain = (asp, v, tier, x, y, live) => {
      let n = v * F.eat * (tier <= S.stage - 3 ? 0.25 : tier <= S.stage - 2 ? 0.5 : 1); if (live) n *= 1 + val('core_hunger') / 100;
      if (v > 1.5) n *= 1 + val('eye_brood') / 100;
      if (lv('mouth_nebula') && rnd() * 100 < val('mouth_nebula')) n += Math.max(1, v * 0.3);
      S.purse[asp || home] += n; S.bio += n; S.stats.eaten += n; emit('eat', { x, y, asp: asp || home, n });
      if (lv('mouth_brood') && rnd() * 100 < val('mouth_brood')) S.drops.push({ x: x + rr(-8, 8), y: y + rr(-8, 8), asp: 'brood', at: S.t + 4 * TPS });
    };
    const eatFood = f => {
      const d = FOOD[f.k]; f.alive = false; f.back = S.t + (f.k === 'mote' ? 0 : f.k === 'bead' || f.k === 'egg' ? 1e9 : f.k === 'cap' ? 60 * TPS : 45 * TPS);
      if (f.loose) f.back = 0;
      S.stats.byKind[f.k] = (S.stats.byKind[f.k] || 0) + 1;
      if (f.k === 'bead') { S.gold = Math.min(K.goldCap, S.gold + Math.round(K.bead * F.bead)); emit('gold', { x: f.x, y: f.y }); return; }
      if (f.k === 'cap') { if (S.hp < maxHp()) { S.hp++; emit('heal', { x: P.x, y: P.y }); once('cap', '빛갓', '상처 하나가 아물었다'); return; } }
      if (d.bitter && !bitterOK()) { once('bulb', '쓰다', '겉을 돋워야 탈 없이 먹는다', 3); hurt(null, true); gain(f.asp, d.val * 0.5, d.tier, f.x, f.y); return; }
      gain(f.asp, f.val || d.val, f.tier || d.tier, f.x, f.y);
    };
    const swallow = c => { c.alive = false; c.deadAt = S.t; S.stats.swallowed++; S.stats.byKind[c.k] = (S.stats.byKind[c.k] || 0) + 1; gain(c.asp, cval(c), c.st, c.x, c.y, true); emit('gulp', { x: c.x, y: c.y, kind: c.k }); if (P.leech === c.id) P.leech = null;
      if (!S.seen['turn_' + c.k] && c.st >= 2) { S.seen['turn_' + c.k] = 1; caption(SP[c.k].name + '을 삼켰다', '널 쫓던 것이 이제 먹이다'); } };

    // ---------- 돋운다 ----------
    const priceOf = id => { const d = PART[id], w = S.worn[d.slot]; return w && w.id === id ? (w.lv >= 3 ? null : d.cost[w.lv]) : d.cost[0]; };
    const whyNot = id => { const d = PART[id]; if (!d) return '없는 부위다'; if (S.stage < K.open[d.slot]) return STG[K.open[d.slot]].name + '부터 돋는다'; const p = priceOf(id); if (p == null) return '다 올렸다'; if (S.purse[d.asp] < p) return ASPK[d.asp] + ' 알갱이가 ' + Math.ceil(p - S.purse[d.asp]) + '개 모자란다'; return null; };
    const canAny = () => CAT.some(d => !whyNot(d.id) && !(S.worn[d.slot] && S.worn[d.slot].id !== d.id));
    function buy(id) {
      if (S.ended || whyNot(id)) return false; const d = PART[id], p = priceOf(id), w = S.worn[d.slot];
      S.purse[d.asp] -= p; S.spent += p; S.stats.bought++; if (w && w.id === id) w.lv++; else S.worn[d.slot] = { id, lv: 1 };
      if (id === 'skin_abyss') S.hp = Math.min(maxHp(), S.hp + (S.worn.skin.lv === 2 ? 0 : 1)); if (id === 'skin_dusk') P.veilAt = S.t; if (id === 'skin_brood') P.mossAt = S.t + val('skin_brood') * TPS;
      emit('buy', { id }); return true;
    }

    // ---------- 물린다, 쓰러진다 ----------
    function hurt(c, self) {
      if (S.ended || P.inv > 0 || P.burrow > 0) return false;
      if (!self && lv('skin_dusk') && S.t >= P.veilAt) { P.veilAt = S.t + val('skin_dusk') * TPS; P.inv = 18; emit('veil', { x: P.x, y: P.y }); return false; }
      S.hp--; S.stats.hits++; P.inv = (lv('skin_abyss') >= 2 ? 1.9 : 1.2) * TPS; P.chew = null; P.pounce = null; emit('hurt', { x: P.x, y: P.y, kind: c ? c.k : 'self' });
      if (c) { const d = dist(c, P) || 1; P.kx = (P.x - c.x) / d * 150; P.ky = (P.y - c.y) / d * 150;
        if (lv('skin_nebula')) c.stun = Math.max(c.stun, val('skin_nebula') * TPS);
        if (F.stun && c.r < 40) c.stun = Math.max(c.stun, F.stun * TPS);
        if (lv('skin_hunger')) { if (c.st <= S.stage && c.st <= 2) { c.alive = false; c.deadAt = S.t; emit('gone', { x: c.x, y: c.y }); } else c.stun = Math.max(c.stun, 1.2 * TPS); } }
      if (!(lv('skin_hunger') >= 3)) { let drop = lv('core_abyss') ? [2, 1, 0][lv('core_abyss') - 1] : F.drop; while (drop-- > 0) { const a = ASPS.slice().sort((p, q) => S.purse[q] - S.purse[p])[0]; if (S.purse[a] < 1) break; S.purse[a] -= 1; S.drops.push({ x: P.x + rr(-22, 22), y: P.y + rr(-22, 22), asp: a, at: S.t + 12 }); } }
      if (S.hp <= 0) defeat(c);
      return true;
    }
    function defeat(c) {
      S.stats.defeats++; S.falls++;
      if (S.lives <= 0) return end('fell');
      S.lives--; if (!STY) ASPS.forEach(a => { S.purse[a] = Math.floor(S.purse[a] * 2 / 3); });
      const ws = Object.keys(S.worn).map(s => S.worn[s]).sort((a, b) => b.lv - a.lv)[0]; let lost = null; if (ws && !F.keepPart) { lost = PART[ws.id].name; if (ws.lv > 1) ws.lv--; else delete S.worn[PART[ws.id].slot]; }
      S.bio = S.stage > 1 ? STG[S.stage - 1].need : 0; S.hp = maxHp(); S.stageT = S.t;
      const cs = S.crev.filter(q => fits(q) && q.ring <= S.stage).sort((a, b) => dist(a, P) - dist(b, P)); const to = cs[0] || S.crev[0]; P.x = to.x; P.y = to.y; P.vx = P.vy = P.kx = P.ky = 0; P.inv = 3 * TPS; P.leech = null; P.chew = null; P.aimOn = false; P.aimX = P.x; P.aimY = P.y;
      S.cre.forEach(q => { if (q.alive && q.ring <= S.stage + 1) { q.mode = q.k === 'lurker' ? 'buried' : q.k === 'mimic' ? 'bait' : 'idle'; if (SP[q.k].sp || q.k === 'blind') { q.x = q.hx; q.y = q.hy; } q.vx = q.vy = 0; q.stun = 0; q.t = 0; } }); S.shots.length = 0; S.puddles.length = 0; S.sweep.st = 'idle'; S.sweep.next = S.t + 20 * TPS;
      emit('respawn', { x: P.x, y: P.y, lost, by: c ? c.k : null }); caption('쓰러졌다. 틈으로 기어들었다', (lost ? '모은 것의 삼분의 일과 ' + lost + ' 한 단계를 잃었다' : '모은 것의 삼분의 일을 잃었다') + ' · 남은 기회 ' + S.lives, 4, 3);
    }

    // ---------- 재주 ----------
    const actName = () => { const w = S.worn.leg; return w ? PART[w.id].act : F.act ? ACT0.name : null; }, actReady = () => (!!S.worn.leg || F.act) && P.cd <= 0 && P.burrow <= 0 && !P.pounce;
    const actTotal = () => { const w = S.worn.leg; return w ? PART[w.id].v[w.lv - 1] * TPS : F.act ? ACT0.cd * TPS : 0; };
    // 재주를 쓰면 붙어 있던 달라붙이가 떨어진다. 떨어진 것은 한동안 다시 붙지 못한다
    const shake = () => { if (!P.leech) return; const c = S.cre.find(q => q.id === P.leech); if (c) { c.mode = 'idle'; c.cd = 5 * TPS; } P.leech = null; };
    function act() {
      if (S.ended) return false; let did = false; const w = S.worn.leg, k = w ? w.lv - 1 : 0, dx0 = P.aimOn ? P.aimX - P.x : P.face, dy0 = P.aimOn ? P.aimY - P.y : 0, dl = Math.hypot(dx0, dy0) || 1, ux = dx0 / dl, uy = dy0 / dl;
      if (w && P.cd <= 0 && P.burrow <= 0 && !P.pounce) { did = true; P.cd = PART[w.id].v[k] * TPS; P.chew = null; shake();
        if (w.id === 'leg_abyss') { P.dash = 0.5 * TPS; emit('dash', { x: P.x, y: P.y }); }
        if (w.id === 'leg_nebula') { const d = [60, 85, 110][k], fx = P.x, fy = P.y; P.x += ux * d; P.y += uy * d; const rr0 = Math.hypot(P.x, P.y), lim = G().R - G().r; if (rr0 > lim) { P.x *= lim / rr0; P.y *= lim / rr0; } P.inv = Math.max(P.inv, 6); emit('blink', { x: fx, y: fy, tx: P.x, ty: P.y }); }
        if (w.id === 'leg_brood') { P.burrow = [1.6, 2.2, 2.8][k] * TPS; P.vx = P.vy = 0; emit('burrow', { x: P.x, y: P.y }); }
        if (w.id === 'leg_dusk') { S.snares.push({ x: P.x, y: P.y, until: S.t + 9 * TPS, hold: [2, 3, 4][k] * TPS }); emit('snare', { x: P.x, y: P.y }); }
        if (w.id === 'leg_hunger') { const d = [70, 90, 110][k]; P.pounce = { ux, uy, left: 9, sp: d / 9 * TPS }; emit('pounce', { x: P.x, y: P.y }); } }
      if (!w && F.act && P.cd <= 0 && P.burrow <= 0) { did = true; P.cd = ACT0.cd * TPS; P.chew = null; shake(); P.dash = ACT0.dash * TPS; emit('dash', { x: P.x, y: P.y }); }
      if (lv('core_dusk') && P.cd2 <= 0) { did = true; P.cd2 = val('core_dusk') * TPS; const R = [110, 140, 180][lv('core_dusk') - 1]; S.cre.forEach(c => { if (c.alive && hostile(c) && dist(c, P) < R + c.r && c.k !== 'filter' && c.k !== 'mother') { c.mode = 'scared'; c.t = 2.6 * TPS; } }); emit('pulse', { x: P.x, y: P.y, r: R }); }
      if (did) S.stats.acts++; return did;
    }

    // ---------- 움직임의 손잡이 ----------
    const steer = (o, tx, ty, sp, k) => { const d = Math.hypot(tx - o.x, ty - o.y) || 1; o.vx += ((tx - o.x) / d * sp - o.vx) * (k || 0.2); o.vy += ((ty - o.y) / d * sp - o.vy) * (k || 0.2); };
    const moveIn = (o, R) => { o.x += o.vx / TPS; o.y += o.vy / TPS; const r = Math.hypot(o.x, o.y); if (r > R) { o.x *= R / r; o.y *= R / r; } if (Math.abs(o.vx) > 2) o.face = o.vx < 0 ? -1 : 1; };
    const wander = (c, sp, leash) => { c.wa += rr(-0.3, 0.3); if (Math.hypot(c.x - c.hx, c.y - c.hy) > leash) steer(c, c.hx, c.hy, sp, 0.1); else steer(c, c.x + Math.cos(c.wa) * 40, c.y + Math.sin(c.wa) * 40, sp, 0.06); };
    const hidden = c => { if (P.burrow > 0) return true; const q = P.crev; return !!(q && fits(q) && c.r > q.r * 0.3); };
    const sees = c => !hidden(c) && dist(c, P) < SP[c.k].see * F.see * (1 - val('eye_dusk') / 100) + G().r;
    const touch = (c, pad) => dist(c, P) < c.r + G().r * 0.8 + (pad || 0);
    const bite = c => { if (c.cd <= 0 && touch(c) && !hidden(c)) { c.cd = 1.3 * TPS; hurt(c); return true; } return false; };

    // ---------- 먹이사슬: 사는 것들은 나만 보지 않는다. 서로 쫓고, 먹고, 자라고, 주검을 남긴다 ----------
    const BUSY = { aim: 1, dash: 1, rest: 1, tell: 1, lunge: 1, rise: 1, out: 1, inhale: 1, scared: 1, lured: 1 };
    const feed = (c, v) => {
      c.fed += v; c.full = S.t + 5 * TPS; const need = SP[c.k].val * (1.3 + c.gr);
      if (c.gr < 2 && c.fed >= need) { c.fed -= need; c.gr++; c.r *= 1.16; S.eco.grew++; emit('grew', { x: c.x, y: c.y, kind: c.k }); if (c.gr === 2 && c.st < STG.length - 1 && SP[c.k].sp > 0) { c.st++; S.eco.promo++; } }
    };
    const kill = (c, q) => {
      if (!q.k) { q.alive = false; q.back = S.t + 30 * TPS; c.tg = null; feed(c, 2); return; }
      q.alive = false; q.deadAt = S.t; if (P.leech === q.id) P.leech = null; S.eco.eats++; const v = cval(q);
      emit('prey', { x: q.x, y: q.y, by: c.k, kind: q.k });
      if (q.st >= 2 || q.gr) { mkFood('carc', 1, { x: q.x, y: q.y }, { loose: true, val: Math.max(4, Math.round(v * 0.6)), tier: q.st, exp: S.t + 40 * TPS, asp: q.asp }); S.eco.carc++; }
      c.mode = 'eat'; c.t = 2.4 * TPS; c.tg = null; c.foe = null; c.vx = c.vy = 0; feed(c, v);
    };
    // 내 몸과 닿았을 때: 삼키거나, 물리거나, 밀린다. 삼켰으면 true
    const contact = c => {
      if (P.burrow > 0 || !touch(c)) return false;
      if (canEat(c)) { swallow(c); return true; }
      if (hostile(c)) bite(c);
      return false;
    };
    const retarget = (c, d, D) => {
      c.tg = null; if (D.calm || c.full > S.t) return;
      let best = null, bs = 1e9; if (hostile(c) && sees(c)) { bs = d; best = P; }
      const R = Math.max(70, D.see * 0.8);
      for (const q of S.cre) {
        if (!q.alive || q === c || q.ring > S.stage || q.k === c.k || q.mode === 'buried' || q.mode === 'bait' || !SP[q.k].sp || (q.mom && q.mom === c.id)) continue;
        const steal = q.st === c.st && q.mode === 'eat' && !SP[q.k].calm; if (!(q.st < c.st || steal)) continue; if (SP[q.k].calm && c.st < 3) continue;
        const dq = dist(c, q); if (dq > R) continue; const sc = dq * (steal ? 0.7 : 0.8); if (sc < bs) { bs = sc; best = q; }
      }
      if (c.st <= 2) for (const w of S.wrig) { if (!w.alive || w.ring > S.stage) continue; const dq = dist(c, w); if (dq < 70 && dq * 0.9 < bs) { bs = dq * 0.9; best = w; } }
      if (best && best !== P) { c.tg = best; if (best.k && best.st < c.st) { best.fleeFrom = c; best.fleeT = S.t + 45; } }
    };
    // 한 틱의 먹이사슬. 이 틱의 움직임을 여기서 끝냈으면 true
    function ecoStep(c, d, D, lim) {
      const t = S.t; c.on = '';
      if (P.leech === c.id) return false;
      if (c.mode === 'eat') { c.on = 'eat'; c.vx *= 0.7; c.vy *= 0.7; if (--c.t <= 0) c.mode = 'idle'; contact(c); return true; }
      if (c.mode === 'fight') { c.on = 'fight'; const q = c.foe; c.vx = rr(-30, 30); c.vy = rr(-30, 30); moveIn(c, lim); if (!q || !q.alive || q.mode !== 'fight') { c.mode = 'idle'; c.foe = null; } else if (--c.t <= 0) { const win = rnd() < c.r / (c.r + q.r) ? c : q, lose = win === c ? q : c; lose.mode = 'idle'; kill(win, lose); } contact(c); return true; }
      if (BUSY[c.mode]) return false;
      if (c.mode === 'buried' || c.mode === 'bait') {   // 숨은 것은 위로 지나가는 작은 것도 문다. 그때 제 자리를 들킨다
        if (t % 6 === c.id % 6) for (const q of S.cre) if (q.alive && q !== c && q.ring <= S.stage && q.st <= c.st && q.k !== c.k && SP[q.k].sp && !SP[q.k].calm && q.r < c.r && dist(c, q) < c.r + q.r) { emit(c.k === 'mimic' ? 'snap' : 'erupt', { x: c.x, y: c.y }); kill(c, q); c.t = 3.2 * TPS; return true; }
        return false;
      }
      if (!D.sp) {   // 붙박인 큰 것: 닿은 작은 것을 삼킨다
        if (t % 10 === c.id % 10) for (const q of S.cre) if (q.alive && q !== c && q.ring <= S.stage && q.st < c.st && q.mom !== c.id && SP[q.k].sp && dist(c, q) < c.r + q.r * 0.4) { const m0 = c.mode, t0 = c.t; kill(c, q); c.mode = m0; c.t = t0; break; }
        return false;
      }
      if (c.fleeT > t && c.fleeFrom && c.fleeFrom.alive && dist(c, c.fleeFrom) < 150) { c.on = 'flee'; c.tg = null; c.fd = null; steer(c, c.x + (c.x - c.fleeFrom.x), c.y + (c.y - c.fleeFrom.y), D.sp * 1.04, 0.24); moveIn(c, lim); if (c.mode === 'chase') c.mode = 'home'; contact(c); return true; }
      if (t % 12 === c.id % 12) retarget(c, d, D);
      const q = c.tg;
      if (q) {
        if (!q.alive || dist(c, q) > Math.max(120, D.see * 1.5)) c.tg = null;
        else { c.on = 'other'; S.eco.tO++; steer(c, q.x, q.y, D.sp * 0.94, 0.18); moveIn(c, lim);
          if (dist(c, q) < c.r + (q.r || 3) * 0.6) { if (q.k && q.st === c.st) { if (q.mode !== 'fight') { c.mode = q.mode = 'fight'; c.t = q.t = 1.6 * TPS; c.foe = q; q.foe = c; c.tg = null; S.eco.fights++; emit('fight', { x: (c.x + q.x) / 2, y: (c.y + q.y) / 2 }); } } else kill(c, q); }
          contact(c); return true; }
      }
      // 노릴 것이 없으면 먹을 것을 찾는다: 등딱지는 알갱이와 뿌리, 작은 것들은 주검과 알
      const eyeing = hostile(c) && sees(c);
      if (!eyeing && c.full <= t && t % 20 === c.id % 20 && !c.fd) { const wants = D.calm ? { mote: 1, root: 1, seed: 1 } : c.st <= 3 ? { carc: 1, egg: 1 } : { carc: 1 }; let bf = null, bd = 150; for (const f of S.food) { if (!f.alive || !wants[f.k] || f.ring > S.stage) continue; const dx = f.x - c.x, dy = f.y - c.y; if (Math.abs(dx) > bd || Math.abs(dy) > bd) continue; const df = Math.hypot(dx, dy); if (df < bd) { bd = df; bf = f; } } c.fd = bf; }
      if (c.fd) {
        const f = c.fd; if (!f.alive || eyeing) { c.fd = null; return false; }
        c.on = D.calm ? 'graze' : 'scav'; steer(c, f.x, f.y, Math.max(14, D.sp * 0.6), 0.14); moveIn(c, lim);
        if (dist(c, f) < c.r + 4) { c.vx *= 0.5; c.vy *= 0.5; if (++c.nib > (D.calm ? 2.2 : 3) * TPS) { c.nib = 0; S.eco.scav++; if (f.k === 'carc') { f.val = (f.val || FOOD.carc.val) - 5; feed(c, 5); if (f.val <= 0) { f.alive = false; f.back = f.loose ? 0 : S.t + 45 * TPS; } } else { f.alive = false; f.back = f.k === 'mote' ? 0 : S.t + 45 * TPS; feed(c, FOOD[f.k].val || 1); } c.fd = null; } }
        if (contact(c)) return true;
        if (D.calm && touch(c) && P.burrow <= 0) { const dd = d || 1, push = c.r + G().r * 0.8 - d; P.x += (P.x - c.x) / dd * push; P.y += (P.y - c.y) / dd * push; }
        return true;
      }
      return false;
    }

    // ---------- 한 틱 ----------
    function tick() {
      if (S.ended) return; S.t++; const g = G(), t = S.t;
      if (t % TPS === 0 && (S.trace = S.trace || []).length < 600) S.trace.push([Math.round(P.x), Math.round(P.y)]);
      if (P.inv > 0) P.inv--; if (P.cd > 0) P.cd--; if (P.cd2 > 0) P.cd2--; if (P.dash > 0) P.dash--; if (P.burrow > 0) P.burrow--;
      // 한 방울
      P.crev = null; for (const q of S.crev) if (dist(q, P) < q.r) { P.crev = q; break; }
      let sp = g.sp * F.sp * (1 + (lv('leg_abyss') ? [6, 10, 14][lv('leg_abyss') - 1] : 0) / 100), slow = 1;
      if (!webOK()) { for (const w of S.webs) if (Math.abs(w.x - P.x) < w.r && Math.abs(w.y - P.y) < w.r && dist(w, P) < w.r) { slow = 0.42; once('web', '실에 걸렸다', '겉을 돋우면 걸리지 않는다'); break; } } else for (let i = S.webs.length - 1; i >= 0; i--) if (dist(S.webs[i], P) < S.webs[i].r) S.webs.splice(i, 1);
      if (P.leech) slow *= 0.85; if (P.dash > 0) sp *= 3;
      if (lv('eye_hunger')) { for (const c of S.cre) if (c.alive && canEat(c) && dist(c, P) < 90) { sp *= 1 + val('eye_hunger') / 100; break; } }
      if (P.burrow > 0) { P.vx = P.vy = 0; }
      else if (P.pounce) { const q = P.pounce; P.vx = q.ux * q.sp; P.vy = q.uy * q.sp; if (--q.left <= 0) P.pounce = null; }
      else if (P.chew) { P.vx *= 0.6; P.vy *= 0.6; }
      else if (P.aimOn && Math.hypot(P.aimX - P.x, P.aimY - P.y) > 3) steer(P, P.aimX, P.aimY, sp * slow, 0.26); else { P.vx *= 0.8; P.vy *= 0.8; }
      P.vx += P.kx; P.vy += P.ky; P.kx *= 0.7; P.ky *= 0.7; if (Math.abs(P.kx) < 1) P.kx = 0; if (Math.abs(P.ky) < 1) P.ky = 0;
      moveIn(P, g.R - g.r); P.noise = Math.hypot(P.vx, P.vy) / g.sp;
      if (Math.hypot(P.x, P.y) > g.R - g.r - 2 && S.stage < 5) once('wall', '흙이 단단하다', '더 자라야 밖으로 나간다');
      // 이끼
      if (lv('skin_brood') && S.hp < maxHp() && t >= P.mossAt) { S.hp++; P.mossAt = t + val('skin_brood') * TPS; emit('heal', { x: P.x, y: P.y }); } else if (lv('skin_brood') && S.hp >= maxHp()) P.mossAt = Math.max(P.mossAt, t + val('skin_brood') * TPS * 0.5);
      if (F.mend && !lv('skin_brood')) { if (S.hp < maxHp() && t >= P.mendAt) { S.hp++; P.mendAt = t + F.mend * TPS; emit('heal', { x: P.x, y: P.y }); } else if (S.hp >= maxHp()) P.mendAt = Math.max(P.mendAt, t + F.mend * TPS * 0.5); }
      // 달라붙이
      if (P.leech) { const c = S.cre.find(q => q.id === P.leech); if (!c || !c.alive || (P.crev && fits(P.crev))) P.leech = null; else { c.x = P.x - P.face * g.r * 0.6; c.y = P.y - g.r * 0.5; c.t++; if (c.t % 36 === 0) { const a = ASPS.slice().sort((p, q) => S.purse[q] - S.purse[p])[0]; if (S.purse[a] >= 1) { S.purse[a] -= 1; emit('drain', { x: P.x, y: P.y, asp: a }); } } if (c.t > 9 * TPS) { P.leech = null; c.mode = 'idle'; c.cd = 5 * TPS; } } }
      // 먹이: 닿으면 먹는다. 굳은 것은 입의 힘이 있어야, 질긴 것은 서서 씹어야
      const reach = g.r + 3, pull = Math.max(F.pull, val('mouth_abyss')), ring = val('core_nebula'), m = mouthLv();
      let chewing = false;
      for (const f of S.food) {
        if (!f.alive) { if (f.back && t >= f.back && f.k !== 'mote' && dist(f, P) > 160) f.alive = true; continue; }
        if (f.exp && t > f.exp) { f.alive = false; f.back = 0; continue; }
        if (f.ring > S.stage) continue; const dx = f.x - P.x, dy = f.y - P.y; if (Math.abs(dx) > 90 || Math.abs(dy) > 90) continue; const d = Math.hypot(dx, dy), D = FOOD[f.k];
        if ((pull && d < pull + g.r && !D.chew && !D.need) || (ring && d < ring + g.r && (f.k === 'mote' || f.k === 'bead'))) { f.x -= dx / (d || 1) * 2.6; f.y -= dy / (d || 1) * 2.6; }
        if (d > reach + (D.chew ? 6 : 2) || P.burrow > 0) continue;
        if (D.need && m < D.need) { once('need_' + f.k, D.name + '은 단단하다', m ? '입을 더 올려야 깬다' : '입을 돋워야 깬다', 3); continue; }
        if (D.chew) { chewing = true; if (!P.chew || P.chew.f !== f) { P.chew = { f, t: 0, need: D.chew * TPS * (1 - val('core_brood') / 100) }; emit('chew', { x: f.x, y: f.y }); if (f.k === 'carc') { S.cre.filter(c => c.alive && hostile(c) && SP[c.k].sp && dist(c, f) < 420 && c.ring <= S.stage).sort((a, b) => dist(a, f) - dist(b, f)).slice(0, 2).forEach(c => { c.mode = 'lured'; c.tx = f.x; c.ty = f.y; c.t = 7 * TPS; }); once('carc', '주검이다', '냄새를 맡고 다른 것들도 온다', 3); } } else if (++P.chew.t >= P.chew.need) { P.chew = null; eatFood(f); } continue; }
        eatFood(f);
      }
      if (!chewing) P.chew = null;
      for (let i = S.drops.length - 1; i >= 0; i--) { const q = S.drops[i]; if (t >= q.at) { S.drops.splice(i, 1); mkFood('mote', 1, q, { asp: q.asp, loose: true }); } }
      for (const c of S.clusters) if (c.ring <= S.stage && t >= c.at) { c.at = t + c.grow; let n = 0; for (const f of S.food) if (f.cl === c && f.alive) n++; if (n < c.cap) { const f = S.food.find(q => q.cl === c && !q.alive); if (f) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * c.r; f.x = c.x + Math.cos(a) * d; f.y = c.y + Math.sin(a) * d * 0.7; f.alive = true; } } }
      if (t % 60 === 0 && S.food.length > 900) S.food = S.food.filter(f => f.alive || !f.loose);
      // 꿈틀이: 달아난다
      const hush = val('mouth_dusk');
      for (const w of S.wrig) { if (!w.alive) { if (t >= w.back && dist(w, P) > 200) { const p = ringPos(w.ring); w.x = p.x; w.y = p.y; w.alive = true; } continue; } if (w.ring > S.stage) continue;
        const d = dist(w, P); if (d < 150) { if (d < 60 && !(hush && d < hush)) steer(w, w.x + (w.x - P.x), w.y + (w.y - P.y), 52, 0.22); else { w.wa += rr(-0.5, 0.5); steer(w, w.x + Math.cos(w.wa) * 30, w.y + Math.sin(w.wa) * 30, 16, 0.1); } moveIn(w, STG[w.ring].R - 6); if (d < reach + 3 && P.burrow <= 0) { w.alive = false; w.back = t + 30 * TPS; S.stats.byKind.wrig = (S.stats.byKind.wrig || 0) + 1; gain(w.asp, FOOD.wrig.val, 1, w.x, w.y, true); } } }
      // 사는 것들
      for (const c of S.cre) {
        if (c.ring > S.stage) continue;
        if (!c.alive) { const wait = (c.st >= 4 ? 60 : c.st >= S.stage ? 45 : 50) * TPS; if (c.deadAt && t - c.deadAt > wait && Math.hypot(c.hx - P.x, c.hy - P.y) > lightR() + 120) { c.alive = true; c.x = c.hx; c.y = c.hy; c.vx = c.vy = 0; c.stun = 0; c.kids = 0; c.st = SP[c.k].st; c.r = SP[c.k].r; c.gr = 0; c.fed = 0; c.full = 0; c.tg = null; c.fd = null; c.foe = null; c.fleeT = 0; c.mode = c.k === 'lurker' ? 'buried' : c.k === 'mimic' ? 'bait' : 'idle'; } continue; }
        if (Math.abs(c.x - P.x) > 620 || Math.abs(c.y - P.y) > 620) {
          if (t % 150 === c.id % 150 && SP[c.k].sp && !SP[c.k].calm && c.full <= t) { for (const q of S.cre) if (q.alive && q !== c && q.ring <= S.stage && q.st < c.st && q.k !== c.k && SP[q.k].sp && Math.abs(q.x - c.x) < 160 && Math.abs(q.y - c.y) < 160 && rnd() < 0.3) { q.alive = false; q.deadAt = t; S.eco.eats++; S.eco.far++; feed(c, cval(q)); break; } }
          continue;
        }
        if (c.cd > 0) c.cd--; if (c.stun > 0) { c.stun--; c.vx *= 0.6; c.vy *= 0.6; moveIn(c, STG[5].R); if (touch(c) && canEat(c) && P.burrow <= 0) swallow(c); continue; }
        const d = dist(c, P), D = SP[c.k], lim = STG[Math.min(5, c.ring)].R - c.r;
        // 덫
        for (let i = S.snares.length - 1; i >= 0; i--) { const s = S.snares[i]; if (c.r < 40 && !D.calm && D.sp && dist(s, c) < c.r + 9) { c.stun = s.hold; S.snares.splice(i, 1); emit('snared', { x: c.x, y: c.y }); } }
        // 덮치는 중에 닿은 것
        if (P.pounce && touch(c, 3)) { if (canEat(c)) { swallow(c); continue; } if (hostile(c) && c.st <= S.stage + 1 && c.r < 40) { c.stun = Math.max(c.stun, (c.st > S.stage ? 0.8 : [1.5, 2, 2.5][lv('leg_hunger') - 1]) * TPS); emit('snared', { x: c.x, y: c.y }); continue; } }
        if (ecoStep(c, d, D, lim)) continue;
        if (!c.alive) continue;
        // 먹이가 된 것: 달아난다. 닿으면 삼킨다(입이 모자라면 못 삼킨다)
        if (prey(c) || D.calm) {
          if (c.mode === 'bait' || c.mode === 'buried') { if (touch(c) && P.burrow <= 0) { if (canEat(c)) swallow(c); else once('small_' + c.k, '입이 작다', SP[c.k].name + '을 삼키려면 입을 돋워야 한다', 3); } continue; }
          if (touch(c) && P.burrow <= 0) { if (canEat(c)) { swallow(c); continue; } if (D.calm) { const dd = d || 1, push = c.r + g.r * 0.8 - d; P.x += (P.x - c.x) / dd * push; P.y += (P.y - c.y) / dd * push; once('armor', '등딱지는 단단하다', '입의 힘이 ' + D.armor + '은 돼야 깬다', 3); } else once('small_' + c.k, '입이 작다', SP[c.k].name + '을 삼키려면 입을 돋워야 한다', 3); }
          if (D.calm) wander(c, D.sp, 60); else if (D.sp && d < 80 + g.r && !(hush && d < hush)) steer(c, c.x + (c.x - P.x), c.y + (c.y - P.y), D.sp * 0.82, 0.2); else if (D.sp) wander(c, D.sp * 0.35, 70); if (D.sp) moveIn(c, lim); continue;
        }
        // 사나운 것
        if (c.mode === 'scared') { steer(c, c.x + (c.x - P.x), c.y + (c.y - P.y), (D.sp || 60) * 1.1, 0.25); moveIn(c, lim); if (--c.t <= 0) c.mode = 'idle'; continue; }
        if (c.mode === 'lured') { steer(c, c.tx, c.ty, D.sp * 0.8, 0.15); moveIn(c, lim); if (sees(c) && d < SP[c.k].see * 0.7) c.mode = 'idle'; else if (--c.t <= 0 || Math.hypot(c.x - c.tx, c.y - c.ty) < 12) c.mode = 'idle'; bite(c); continue; }
        const saw = sees(c) && !(c.full > t && d > D.see * 0.65);
        if (saw && D.sp) { S.eco.tP++; c.on = 'you'; }
        if (saw && !S.seen['met_' + c.k] && d < lightR()) { S.seen['met_' + c.k] = 1; if (c.st > S.stage) caption(D.name + '이다', '너보다 크다. ' + D.say, 3); else caption(D.name, D.say, 2.6); emit('meet', { kind: c.k }); }
        switch (c.k) {
          case 'mite': case 'hunter': {
            if (c.mode === 'chase') { steer(c, P.x, P.y, D.sp, c.k === 'mite' ? 0.12 : 0.17); bite(c); if (!saw && d > D.see * 1.5 || Math.hypot(c.x - c.hx, c.y - c.hy) > (c.k === 'mite' ? 150 : 340) || hidden(c)) { c.mode = 'home'; } }
            else if (c.mode === 'home') { steer(c, c.hx, c.hy, D.sp * 0.7, 0.12); if (Math.hypot(c.x - c.hx, c.y - c.hy) < 30) c.mode = 'idle'; }
            else { wander(c, D.sp * 0.3, 60); if (saw) { c.mode = 'chase'; emit('alert', { kind: c.k, x: c.x, y: c.y }); } }
            moveIn(c, lim); break; }
          case 'leech': {
            if (P.leech === c.id) break;
            if (saw && c.cd <= 0 && !P.leech) { steer(c, P.x, P.y, D.sp, 0.3); if (touch(c)) { if (lv('core_abyss')) { c.cd = 6 * TPS; c.mode = 'idle'; } else { P.leech = c.id; c.t = 0; emit('leech', { x: P.x, y: P.y }); once('leech', '달라붙이가 붙었다', '모은 것을 빨아먹는다. 틈에 들어가거나 재주를 쓰면 떨어진다', 3.6); } } } else wander(c, D.sp * 0.3, 50);
            moveIn(c, lim); break; }
          case 'pack': {
            if (c.mode === 'chase') { const a = (c.id % 4) * 1.5708 + t * 0.02, off = d > 46 ? 30 : 0; steer(c, P.x + Math.cos(a) * off, P.y + Math.sin(a) * off, D.sp, 0.2); bite(c); if (hidden(c) || Math.hypot(c.x - c.hx, c.y - c.hy) > 300 || d > 260) c.mode = 'home'; }
            else if (c.mode === 'home') { steer(c, c.hx, c.hy, D.sp * 0.7, 0.12); if (Math.hypot(c.x - c.hx, c.y - c.hy) < 34) c.mode = 'idle'; }
            else { wander(c, D.sp * 0.3, 36); if (saw) { S.cre.forEach(q => { if (q.g === c.g && q.alive && q.mode === 'idle') q.mode = 'chase'; }); emit('alert', { kind: 'pack', x: c.x, y: c.y }); } }
            moveIn(c, lim); break; }
          case 'lurker': {
            if (c.mode === 'buried') { if (saw && d < D.see + g.r) { c.mode = 'rise'; c.t = 10; emit('erupt', { x: c.x, y: c.y }); } }
            else if (c.mode === 'rise') { if (--c.t <= 0) { c.mode = 'lunge'; c.t = 9; const dd = d || 1; c.vx = (P.x - c.x) / dd * 210; c.vy = (P.y - c.y) / dd * 210; } }
            else if (c.mode === 'lunge') { moveIn(c, lim); bite(c); if (--c.t <= 0) { c.mode = 'out'; c.t = 2.6 * TPS; } }
            else if (c.mode === 'out') { steer(c, P.x, P.y, D.sp, 0.12); moveIn(c, lim); bite(c); if (--c.t <= 0 || hidden(c)) c.mode = 'home'; }
            else { steer(c, c.hx, c.hy, D.sp, 0.15); moveIn(c, lim); if (Math.hypot(c.x - c.hx, c.y - c.hy) < 6) { c.mode = 'buried'; c.vx = c.vy = 0; } }
            break; }
          case 'weaver': {
            const caught = !webOK() && S.webs.some(w => w.own === c.id && dist(w, P) < w.r);
            if ((caught || (saw && d < 46)) && !hidden(c)) { steer(c, P.x, P.y, D.sp, 0.2); bite(c); } else { steer(c, c.hx, c.hy, D.sp * 0.5, 0.1); if (t % (12 * TPS) === c.id % (12 * TPS) && S.webs.filter(w => w.own === c.id).length < 5) spin(c); }
            moveIn(c, lim); break; }
          case 'charger': {
            if (c.mode === 'aim') { c.vx *= 0.7; c.vy *= 0.7; if (--c.t <= 0) { c.mode = 'dash'; c.t = 28; const dd = Math.hypot(c.tx - c.x, c.ty - c.y) || 1; c.vx = (c.tx - c.x) / dd * 265; c.vy = (c.ty - c.y) / dd * 265; emit('charge', { x: c.x, y: c.y }); } }
            else if (c.mode === 'dash') { moveIn(c, lim); bite(c); if (--c.t <= 0) { c.mode = 'rest'; c.t = 2.3 * TPS; c.vx = c.vy = 0; } }
            else if (c.mode === 'rest') { if (touch(c) && canEat(c) && P.burrow <= 0) { swallow(c); break; } if (--c.t <= 0) c.mode = 'idle'; }
            else { wander(c, D.sp * 0.4, 90); moveIn(c, lim); if (saw && c.cd <= 0) { c.mode = 'aim'; c.t = (lv('eye_nebula') >= 3 ? 30 : 24); c.tx = P.x + P.vx * 0.25; c.ty = P.y + P.vy * 0.25; c.cd = 3 * TPS; emit('aim', { x: c.x, y: c.y, tx: c.tx, ty: c.ty }); } }
            break; }
          case 'spitter': {
            if (saw) { if (d < 80) steer(c, c.x + (c.x - P.x), c.y + (c.y - P.y), D.sp, 0.18); else if (d > 150) steer(c, P.x, P.y, D.sp * 0.6, 0.1); else { c.vx *= 0.85; c.vy *= 0.85; }
              if (c.cd <= 0) { c.cd = 2.5 * TPS; const lead = 0.5, tx = P.x + P.vx * lead, ty = P.y + P.vy * lead, dur = Math.max(20, Math.round(Math.hypot(tx - c.x, ty - c.y) / 82 * TPS)); S.shots.push({ x0: c.x, y0: c.y, tx, ty, t0: t, dur, by: c.id }); emit('spit', { x: c.x, y: c.y }); } bite(c); }
            else wander(c, D.sp * 0.3, 80);
            moveIn(c, lim); break; }
          case 'mimic': {
            if (c.mode === 'bait') { if (touch(c, 1) && !hidden(c) && P.burrow <= 0) { c.mode = 'out'; c.t = 3 * TPS; c.cd = 0; bite(c); emit('snap', { x: c.x, y: c.y }); once('mimic', '미끼혹이다', '먹이가 아니었다. 눈을 돋우면 알아본다', 3.4); } }
            else if (c.mode === 'out') { steer(c, P.x, P.y, D.sp, 0.16); moveIn(c, lim); bite(c); if (--c.t <= 0 || hidden(c)) c.mode = 'home'; }
            else { steer(c, c.hx, c.hy, D.sp, 0.15); moveIn(c, lim); if (Math.hypot(c.x - c.hx, c.y - c.hy) < 6) { c.mode = 'bait'; c.vx = c.vy = 0; } }
            break; }
          case 'mother': {
            if (touch(c) && canEat(c) && P.burrow <= 0) { swallow(c); break; } bite(c);
            if (d < 520 && --c.t <= 0) { c.t = 6.5 * TPS; const kids = S.cre.filter(q => q.alive && q.mom === c.id).length; if (kids < 5) { const k = mkCre('pack', c.ring, { x: c.x + rr(-16, 16), y: c.y + c.r + 4 }, c.id + 9000); k.mom = c.id; k.mode = saw ? 'chase' : 'idle'; emit('birth', { x: c.x, y: c.y }); } }
            if (saw) S.cre.forEach(q => { if (q.alive && q.mom === c.id && q.mode === 'idle') q.mode = 'chase'; });
            break; }
          case 'filter': {
            if (touch(c) && canEat(c) && P.burrow <= 0) { swallow(c); break; }
            if (c.mode === 'tell') { if (--c.t <= 0) { c.mode = 'inhale'; c.t = 2.2 * TPS; emit('inhale', { x: c.x, y: c.y }); } }
            else if (c.mode === 'inhale') { if (d < D.see && P.burrow <= 0 && !hidden(c)) { const f = 62 * (1 - val('core_abyss') / 100) * (1 - d / (D.see * 1.3)), dd = d || 1; P.x += (c.x - P.x) / dd * f / TPS; P.y += (c.y - P.y) / dd * f / TPS; if (f > 20) once('inhale', '들숨입이 끌어당긴다', '속을 돋우면 덜 끌려간다', 3); } bite(c); if (--c.t <= 0) { c.mode = 'idle'; c.t = 4.5 * TPS; } }
            else if (d < D.see * 1.2 && --c.t <= 0) { c.mode = 'tell'; c.t = 0.8 * TPS; emit('tell', { x: c.x, y: c.y }); }
            break; }
          case 'stalker': {
            if (c.mode === 'tell') { c.vx *= 0.6; c.vy *= 0.6; if (--c.t <= 0) { c.mode = 'lunge'; c.t = 20; const dd = Math.hypot(c.tx - c.x, c.ty - c.y) || 1; c.vx = (c.tx - c.x) / dd * 310; c.vy = (c.ty - c.y) / dd * 310; emit('charge', { x: c.x, y: c.y }); } }
            else if (c.mode === 'lunge') { moveIn(c, lim); bite(c); if (--c.t <= 0) { c.mode = 'rest'; c.t = 1.1 * TPS; } }
            else if (c.mode === 'rest') { c.vx *= 0.8; c.vy *= 0.8; moveIn(c, lim); if (touch(c) && canEat(c) && P.burrow <= 0) { swallow(c); break; } if (--c.t <= 0) { c.mode = 'idle'; c.cd = 3.6 * TPS; } }
            else if (saw && Math.hypot(c.x - c.hx, c.y - c.hy) < 420) { const R = lightR() * 1.08, a = Math.atan2(c.y - P.y, c.x - P.x) + 0.035; steer(c, P.x + Math.cos(a) * R, P.y + Math.sin(a) * R, D.sp, 0.14); moveIn(c, lim); if (c.cd <= 0 && d < R * 1.4) { c.mode = 'tell'; c.t = lv('eye_nebula') >= 3 ? 22 : 15; c.tx = P.x + P.vx * 0.3; c.ty = P.y + P.vy * 0.3; emit('aim', { x: c.x, y: c.y, tx: c.tx, ty: c.ty }); } }
            else { wander(c, D.sp * 0.3, 120); moveIn(c, lim); }
            break; }
          case 'blind': {
            const hear = !hidden(c) && d < D.see + g.r && P.noise > 0.5;
            if (hear) { c.tx = P.x; c.ty = P.y; c.t = 1.6 * TPS; if (c.mode !== 'hunt') { c.mode = 'hunt'; emit('alert', { kind: 'blind', x: c.x, y: c.y }); } }
            if (c.mode === 'hunt') { steer(c, c.tx, c.ty, D.sp, 0.07); if (--c.t <= 0 || Math.hypot(c.x - c.tx, c.y - c.ty) < 10) c.mode = 'idle'; } else wander(c, 26, 200);
            moveIn(c, lim); if (touch(c) && canEat(c) && P.burrow <= 0) { swallow(c); break; } bite(c); break; }
        }
      }
      // 침과 녹은 자리
      for (let i = S.shots.length - 1; i >= 0; i--) { const s = S.shots[i]; if (!s) continue; if (t - s.t0 >= s.dur) { S.shots.splice(i, 1); S.puddles.push({ x: s.tx, y: s.ty, r: 17, until: t + 2.6 * TPS }); emit('splat', { x: s.tx, y: s.ty }); } }
      for (let i = S.puddles.length - 1; i >= 0; i--) { const q = S.puddles[i]; if (!q) continue; if (t >= q.until) { S.puddles.splice(i, 1); continue; } if (!acidOK() && dist(q, P) < q.r + g.r * 0.5) { if (hurt(null, true)) once('acid', '침에 녹는다', '겉을 돋우면 녹지 않는다', 3); } }
      for (let i = S.snares.length - 1; i >= 0; i--) if (t >= S.snares[i].until) S.snares.splice(i, 1);
      // 깊은 것: 한 몸으로 너무 오래 머물거나 밤이 깊으면 쓸고 지나간다
      const sw = S.sweep, late = (S.stage >= 2 && t - S.stageT > K.sweepStage * TPS) || t > K.sweepAll * TPS;
      if (late) {
        if (sw.st === 'idle' && t >= sw.next && !(STY && STY.sweep === false)) { const a = rnd() * 6.2832; sw.dx = Math.cos(a); sw.dy = Math.sin(a); const px = -sw.dy, py = sw.dx, off = rr(-36, 36); sw.sx = P.x + px * off - sw.dx * 560; sw.sy = P.y + py * off - sw.dy * 560; sw.x = sw.sx; sw.y = sw.sy; sw.st = 'warn'; sw.t0 = t; sw.warn = (lv('eye_nebula') >= 3 ? 3.8 : 2.3) * TPS; sw.r = 16 + S.stage * 5; emit('sweepwarn', {}); if (!sw.n) caption('흙이 떨린다', '깊은 것이 지나간다. 붉은 줄에서 비켜', 3.2); sw.n++; }
        else if (sw.st === 'warn' && t - sw.t0 >= sw.warn) { sw.st = 'run'; sw.t0 = t; emit('sweep', {}); }
        else if (sw.st === 'run') { const v = (200 + S.stage * 40) / TPS; sw.x += sw.dx * v; sw.y += sw.dy * v; if (dist(sw, P) < sw.r + g.r * 0.7 && !(P.crev && fits(P.crev))) hurt({ x: sw.x, y: sw.y, k: 'sweeper', st: 9, r: sw.r, stun: 0 }); for (const c of S.cre) if (c.alive && c.r < 40 && c.ring <= S.stage && dist(sw, c) < sw.r + c.r) { c.alive = false; c.deadAt = t; emit('gone', { x: c.x, y: c.y }); } if (t - sw.t0 > 1150 / v) { sw.st = 'idle'; sw.next = t + Math.max(5, 10 - sw.n * 0.7) * TPS; } }
      }
      // 자란다
      if (S.stage < 5 && S.bio >= g.need) { S.stage++; S.stageT = t; S.upAt = t; S.hp = Math.min(maxHp(), S.hp + 1); P.inv = Math.max(P.inv, 2 * TPS); sw.st = 'idle'; sw.next = t; sw.n = 0; emit('stage', { stage: S.stage }); caption(STG[S.stage].name, ['', '', '어른거리던 큰 것들이 이제 네 눈높이다. 발과 겉이 돋는다', '저 뒤의 것들과 겨룰 몸이다. 속이 돋고, 부위 하나를 새길 수 있다', '널 쫓던 것들이 작아 보인다', '마지막 허물이다. 다 자라면 가장 많이 가져간다'][S.stage], 4, 2.6); }
      else if (S.stage === 5 && S.bio >= g.need) return end('grown');
      if (STY && STY.goal && S.stage >= STY.goal) return end('story');
      if (t >= ((STY && STY.maxT) || K.maxT) * TPS) end('time');
    }

    // ---------- 끝과 셈 ----------
    const wornList = () => SLOTS.map(s => S.worn[s[0]]).filter(Boolean).map(w => ({ id: w.id, asp: PART[w.id].asp, slot: PART[w.id].slot, lv: w.lv }));
    const essAt = stage => { const e = {}, f = K.essF[stage] * (1 + F.ess) * (1 + val('core_brood') / 100); let tot = 0; ASPS.forEach(a => { e[a] = Math.round(S.purse[a] * f); tot += e[a]; }); const capN = K.essCap[stage]; if (tot > capN) { const k = capN / tot; let s = 0; ASPS.forEach(a => { e[a] = Math.floor(e[a] * k); s += e[a]; }); const top = ASPS.slice().sort((a, b) => e[b] - e[a])[0]; e[top] += capN - s; } return e; };
    const essSum = stage => { const e = essAt(stage); return ASPS.reduce((a, k) => a + e[k], 0); };
    let keep = null;
    // 헤집고 다닌 자리: 둥지의 칸(가로 7 × 세로 5)에 옮겨 센다. 마지막 자리는 세 번 센다
    function roamGrid() {
      const T = (S.trace || []).concat([[Math.round(P.x), Math.round(P.y)], [Math.round(P.x), Math.round(P.y)], [Math.round(P.x), Math.round(P.y)]]), B = Math.max(120, ...T.map(q => Math.max(Math.abs(q[0]), Math.abs(q[1])))), C = 7, R = 5, o = new Array(C * R).fill(0);
      T.forEach(q => { const c = Math.min(C - 1, Math.max(0, Math.floor((q[0] / B + 1) / 2 * C))), r = Math.min(R - 1, Math.max(0, Math.floor((q[1] / B + 1) / 2 * R))); o[r * C + c]++; });
      return o;
    }
    function result(kind) {
      kind = kind || S.ended || 'settle'; const fell = kind === 'fell', time = Math.round(S.t / TPS);
      if (kind === 'skip') { const e = zero(); e[home] = 12; const rest = ASPS.filter(a => a !== home); for (let k = 0; k < 6; k++) e[rest[k % rest.length]]++; return { ess: e, kin: [], gold: 60, size: 2, time, fell: false, skipped: true, parts: [], mut: null, look }; }
      const e = essAt(S.stage), parts = wornList(); if (fell) ASPS.forEach(a => { e[a] = Math.floor(e[a] / 2); });
      const best = parts.slice().sort((a, b) => b.lv - a.lv)[0], can = !fell && S.stage >= K.keepFrom && best;
      return { ess: e, kin: [], gold: Math.min(K.goldCap, S.gold), size: S.stage, time, fell, skipped: false, ate: Object.assign({}, S.stats.byKind), roam: roamGrid(), parts, mut: can ? PART[keep && parts.some(p => p.id === keep) ? keep : best.id].mut : null, look };
    }
    function end(kind) { if (S.ended) return; S.ended = kind; emit('end', { kind }); }

    return { look, form: F, seedOf: look ? SEEDS_[look] : null, cval, fits, actTotal, S, P, STG, SP, CAT, PART, SLOTS, home, ev, tick, act, buy, whyNot, priceOf, canAny, hurt, end, result, hostile, prey, canEat, lv, val, mouthLv, maxHp, lightR, acidOK, webOK, bitterOK, actName, actReady, essAt, essSum, hidden, caption,
      aim(x, y) { const lim = G().R - G().r, r = Math.hypot(x, y); if (r > lim) { x *= lim / r; y *= lim / r; } P.aimX = x; P.aimY = y; P.aimOn = true; }, stop() { P.aimOn = false; }, setKeep(id) { keep = id; }, get keep() { return keep; } };
  }
  return { TPS, ASPS, ASPK, STG, K, SP, FOOD, CENSUS, FCENSUS, CAT, PART, SLOTS, SLOTK, SLOTSAY, SEEDS: SEEDS_, SEED_IDS, FORM0, ACT0, pickLook, makeSim };
})();
if (typeof module !== 'undefined') module.exports = PRO;
