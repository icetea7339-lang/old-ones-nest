// 옛 것의 둥지 — 둥지 전투 (자동 전투) 규칙. 화면 없이 돈다.
// 준비(상점·세우기·방 타일) → 싸움(결정된 시뮬레이션, 사건 줄을 내놓는다) → 결과.
// 싸움은 씨앗이 같으면 늘 같다. 화면은 timeline 을 순서대로 틀기만 하면 된다.
const LAIR = (function () {
  'use strict';
  const COLS = 6, ROWS = 6, N = 36, TICK = 0.1, CORE = [32, 33], NEST_ROW = 3;
  const rc = i => [Math.floor(i / COLS), i % COLS], idx = (r, c) => r * COLS + c, inb = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const cheb = (a, b) => { const p = rc(a), q = rc(b); return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])); };
  const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), R1 = x => Math.round(x * 10) / 10;
  function rnd(S) { S.s = (S.s + 0x6D2B79F5) | 0; let t = Math.imul(S.s ^ (S.s >>> 15), 1 | S.s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

  const ASPN = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' }, ASPS = Object.keys(ASPN);
  const CLSN = { guard: '수문장', hunter: '사냥꾼', caller: '부르는 것', mother: '어미' }, CLSS = Object.keys(CLSN);
  const STARM = [0, 1, 1.8, 3.2];
  const K = {
    start: { gold: 14, level: 3, hp: 12, rounds: 3 }, xpNeed: { 3: 6, 4: 10, 5: 16 }, maxLv: 6, xpBuy: 4, xpCost: 4, xpFree: 2, reroll: 2,
    odds: { 3: [65, 30, 5], 4: [45, 40, 15], 5: [30, 45, 25], 6: [25, 40, 35] }, income: 10, interest: 5, interestMax: 2, winGold: 2, lossHp: 3,
    roundHp: [2.2, 1.2, 1.05], roundAtk: [1.3, 1.7, 1.6], roundSan: [1.25, 1, 0.85], hpMul: 2, sanMul: 1.4, skillMul: 1.5, aggro: 2, engageAt: 12, frenzy: 24, frenzyUp: 0.08, sudden: 44, end: 60, manaAtk: 10, manaHit: 6, castWind: 0.35,
    core: { hp: 1000, atk: 75, as: 0.6, range: 2, df: 30, mana: 110, lvHp: 0.2, rdHp: 0.1 },
  };
  // 권속 열둘. hp 체력 atk 공격 as 초당 공격 range 닿는 칸 df 방어 mana 스킬에 드는 마나 sanAtk 평타 정신 피해
  const KIN = {
    shell: { name: '비늘지기', cost: 1, asp: 'abyss', cls: 'guard', hp: 650, atk: 40, as: 0.6, range: 1, df: 40, mana: 70, skill: 'clam' },
    biter: { name: '깨물이', cost: 1, asp: 'brood', cls: 'hunter', hp: 450, atk: 55, as: 0.9, range: 1, df: 15, mana: 60, skill: 'rend' },
    gazer: { name: '별보는 눈', cost: 1, asp: 'nebula', cls: 'caller', hp: 380, atk: 45, as: 0.7, range: 3, df: 10, mana: 60, sanAtk: 8, skill: 'gaze' },
    hood: { name: '두건 쓴 것', cost: 1, asp: 'dusk', cls: 'caller', hp: 400, atk: 35, as: 0.7, range: 3, df: 10, mana: 70, sanAtk: 10, skill: 'whisper' },
    gnaw: { name: '허기', cost: 1, asp: 'hunger', cls: 'hunter', hp: 480, atk: 60, as: 0.8, range: 1, df: 15, mana: 70, skill: 'devour' },
    tangle: { name: '촉수 뭉치', cost: 2, asp: 'abyss', cls: 'hunter', hp: 600, atk: 55, as: 0.7, range: 1, df: 25, mana: 80, skill: 'drag' },
    brood: { name: '알 품은 것', cost: 2, asp: 'brood', cls: 'mother', hp: 550, atk: 40, as: 0.6, range: 2, df: 20, mana: 80, skill: 'hatch' },
    heap: { name: '눈 무더기', cost: 2, asp: 'nebula', cls: 'guard', hp: 800, atk: 45, as: 0.6, range: 1, df: 40, mana: 90, sanAtk: 6, skill: 'stare' },
    mask: { name: '가면 쓴 것', cost: 2, asp: 'dusk', cls: 'hunter', hp: 560, atk: 70, as: 0.9, range: 1, df: 20, mana: 80, sanAtk: 5, skill: 'steal' },
    maw: { name: '해구의 입', cost: 3, asp: 'abyss', cls: 'guard', hp: 1000, atk: 70, as: 0.6, range: 1, df: 50, mana: 100, skill: 'swallow' },
    mother: { name: '포자 어미', cost: 3, asp: 'brood', cls: 'mother', hp: 750, atk: 50, as: 0.6, range: 3, df: 25, mana: 100, skill: 'spores' },
    famine: { name: '통삼킴', cost: 3, asp: 'hunger', cls: 'hunter', hp: 800, atk: 95, as: 0.9, range: 1, df: 30, mana: 90, skill: 'charge' },
  };
  const KIN_IDS = Object.keys(KIN);
  // 불려 나오는 것
  const SUMMON = {
    spawn: { name: '새끼', hp: 160, atk: 22, as: 1, range: 1, df: 0 },
    infected: { name: '감염체', hp: 200, atk: 30, as: 0.8, range: 1, df: 5 },
  };
  // 본체의 다섯 모습 (가장 많이 모은 성향)과 처음 모습
  const FORM = {
    drop: { name: '옛 것', skill: 'slam' }, abyss: { name: '바다 밑에서 온 것', skill: 'tide', cls: 'guard' }, nebula: { name: '별에서 내려다보는 것', skill: 'eyeabove', cls: 'caller' },
    brood: { name: '새끼 떼의 어미', skill: 'spawning', cls: 'mother' }, dusk: { name: '두건 쓴 무리의 주인', skill: 'chorus', cls: 'caller' }, hunger: { name: '끝없는 아가리', skill: 'feast', cls: 'hunter' },
  };
  // 침입자 열둘. san 정신
  const INV = {
    militia: { name: '민병', role: '앞줄', hp: 420, san: 60, atk: 40, as: 0.7, range: 1, df: 15, mana: 60, skill: 'pike', tier: 1 },
    torch: { name: '횃불꾼', role: '앞줄', hp: 380, san: 55, atk: 35, as: 0.7, range: 1, df: 10, mana: 70, skill: 'arson', tier: 1 },
    hound: { name: '사냥개', role: '돌진', hp: 300, san: 40, atk: 50, as: 1.1, range: 1, df: 5, mana: 50, speed: 2.6, skill: 'latch', tier: 1 },
    knight: { name: '방패 기사', role: '탱커', hp: 900, san: 110, atk: 45, as: 0.6, range: 1, df: 60, mana: 80, skill: 'wall', tier: 2 },
    archer: { name: '궁수', role: '뒷줄', hp: 380, san: 70, atk: 52, as: 0.8, range: 4, df: 5, mana: 70, skill: 'aim', weak: true, tier: 2 },
    priest: { name: '사제', role: '치유', hp: 420, san: 140, atk: 25, as: 0.6, range: 3, df: 10, mana: 70, skill: 'pray', tier: 2 },
    mage: { name: '마법사', role: '뒷줄', hp: 360, san: 90, atk: 40, as: 0.6, range: 4, df: 5, mana: 90, skill: 'pillar', tier: 2 },
    rogue: { name: '도적', role: '침투', hp: 400, san: 70, atk: 70, as: 1, range: 1, df: 10, mana: 60, speed: 2.4, skill: 'shadow', leap: true, tier: 2 },
    bard: { name: '음유시인', role: '지원', hp: 400, san: 100, atk: 30, as: 0.7, range: 3, df: 10, mana: 80, skill: 'anthem', tier: 2 },
    inquis: { name: '심문관', role: '정예', hp: 800, san: 160, atk: 65, as: 0.7, range: 2, df: 35, mana: 80, skill: 'silence', elite: true, tier: 3 },
    paladin: { name: '성기사', role: '정예', hp: 1100, san: 220, atk: 70, as: 0.6, range: 1, df: 60, mana: 90, skill: 'sanctum', elite: true, tier: 3 },
    seeker: { name: '책을 쫓는 자', role: '우두머리', hp: 2000, san: 300, atk: 80, as: 0.7, range: 3, df: 30, mana: 100, skill: 'read', boss: true, noMad: true, tier: 4 },
  };
  const INV_IDS = Object.keys(INV);
  // 스킬: v = 별마다의 수치. 설명은 화면이 그대로 쓴다 (short 는 16자 안)
  const P3 = (a, l) => a[clamp(l, 1, 3) - 1];
  const SK = {
    clam: { name: '조개 닫기', dur: [2, 2.5, 3], short: l => `피해 −75% · ${P3([2, 2.5, 3], l)}초`, more: '껍데기를 닫아 받는 피해를 크게 줄이고, 두 칸 안의 적을 제게로 끌어들인다.' },
    rend: { name: '물어뜯기', mul: [0.9, 1.1, 1.4], short: l => `세 번 ×${P3([0.9, 1.1, 1.4], l)} · 출혈`, more: '세 번 연달아 문다. 마지막 한 입은 피를 흘리게 한다.' },
    gaze: { name: '응시', dmg: [90, 160, 300], san: [25, 40, 70], short: l => `광선 ${P3([90, 160, 300], l)} · 정신 ${P3([25, 40, 70], l)}`, more: '한 줄을 꿰뚫는 시선. 줄 위의 적 전부가 체력과 정신을 잃는다.' },
    whisper: { name: '속삭임', san: [45, 75, 130], burst: [20, 35, 60], short: l => `정신 ${P3([45, 75, 130], l)} · 미치면 번짐`, more: '가장 가까운 적의 정신을 크게 깎는다. 그 적이 미치면 곁의 적들도 정신을 잃는다.' },
    devour: { name: '뜯어먹기', mul: [2.5, 3, 4], short: l => `한 입 ×${P3([2.5, 3, 4], l)} · 먹고 회복`, more: '크게 한 입 문다. 그것으로 쓰러뜨리면 체력을 되찾고, 싸움이 끝날 때까지 공격이 오른다.' },
    drag: { name: '끌어당김', dmg: [80, 140, 250], stun: [1.5, 2, 2.5], short: l => `끌어와 기절 ${P3([1.5, 2, 2.5], l)}초`, more: '가장 멀리 있는 적을 제 앞으로 끌어와 기절시킨다.' },
    hatch: { name: '부화', n: [3, 3, 4], short: l => `새끼 ${P3([3, 3, 4], l)}`, more: '등의 알이 터져 새끼들이 기어 나온다.' },
    stare: { name: '뭇시선', san: [18, 30, 55], short: l => `둘레 정신 ${P3([18, 30, 55], l)} · 공격↓`, more: '두 칸 안의 적 전부가 정신을 잃고, 한동안 공격이 무뎌진다.' },
    steal: { name: '얼굴 훔치기', short: () => '가장 센 적의 스킬', more: '가장 센 적의 얼굴을 쓰고, 그 적의 스킬을 한 번 쓴다.' },
    swallow: { name: '삼킴', cap: [300, 550, 1000], mul: [2.5, 3, 4], short: l => `체력 ${P3([300, 550, 1000], l)} 아래 삼킴`, more: '체력이 낮은 적 하나를 통째로 삼킨다. 삼킬 것이 없으면 크게 문다. 삼키는 동안 단단해진다.' },
    spores: { name: '포자 구름', dmg: [40, 70, 130], short: l => `구름 ${P3([40, 70, 130], l)} · 감염`, more: '넓게 포자를 뿜어 감염시킨다. 감염된 적이 죽으면 감염체로 일어나 둥지 편에서 싸운다.' },
    charge: { name: '굶주린 돌진', mul: [1.8, 2.2, 3], short: l => `돌진 ×${P3([1.8, 2.2, 3], l)} · 먹으면 또`, more: '한 줄을 꿰뚫고 달린다. 지나간 자리의 적을 전부 물고, 쓰러뜨리면 곧바로 다시 달린다.' },
    slam: { name: '내려침', dmg: [80, 110, 150], short: l => `둘레 ${P3([80, 110, 150], l)}`, more: '본체가 몸을 내려쳐 곁의 적을 친다.' },
    tide: { name: '해일', dmg: [70, 110, 160], short: l => `밀어냄 ${P3([70, 110, 160], l)} · 젖음`, more: '둥지에 들어온 적 전부를 한 줄 밀어내고 적신다.' },
    eyeabove: { name: '내려다보는 눈', san: [20, 30, 45], short: l => `모든 적 정신 ${P3([20, 30, 45], l)}`, more: '천장에서 눈이 열린다. 모든 적이 정신을 잃는다.' },
    spawning: { name: '산란', n: [3, 4, 5], short: l => `새끼 ${P3([3, 4, 5], l)}`, more: '본체가 알을 쏟아 새끼를 낸다.' },
    chorus: { name: '합창', san: [40, 60, 90], short: l => `셋에게 정신 ${P3([40, 60, 90], l)}`, more: '정신이 가장 약해진 셋을 무너뜨린다. 미친 것들은 기운을 얻는다.' },
    feast: { name: '대식', mul: [2, 2.5, 3], short: l => `둘레 ×${P3([2, 2.5, 3], l)} · 흡수`, more: '곁의 적을 한꺼번에 물고, 준 피해의 절반만큼 체력을 되찾는다.' },
    pike: { name: '창 찌르기', mul: [1.6, 1.6, 1.6], short: () => '두 칸 꿰뚫음 ×1.6', more: '앞의 둘을 한 번에 꿴다.' },
    arson: { name: '불 지르기', dps: [20, 20, 20], short: () => '칸에 불 4초', more: '바닥에 불을 지른다. 새끼와 감염체는 세 배로 타고, 불 속의 아군은 감염이 씻긴다.' },
    latch: { name: '물고 늘어짐', short: () => '기절 1초 · 출혈', more: '뛰어들어 물고 놓지 않는다.' },
    wall: { name: '방패 벽', short: () => '피해 −60% · 도발', more: '방패를 세워 곁의 아군까지 지키고, 곁의 적을 제게로 끌어들인다.' },
    aim: { name: '겨냥', mul: [2.5, 2.5, 2.5], short: () => '가장 약한 것 ×2.5', more: '가장 약해진 것을 골라 쏜다.' },
    pray: { name: '기도', heal: [100, 100, 100], short: () => '회복 100 · 정신 25', more: '곁의 아군의 체력과 정신을 되돌리고, 미친 아군 하나를 제정신으로 돌린다.' },
    pillar: { name: '불기둥', dmg: [110, 110, 110], short: () => '범위 110 · 화상', more: '가장 뭉친 곳에 불기둥을 세운다. 뭉쳐 있을수록 더 뜨겁다.' },
    shadow: { name: '그림자 걸음', mul: [3, 3, 3], short: () => '뒷줄 급습 ×3', more: '뒷줄의 가장 약한 것 곁에 나타나 찌른다. 잠깐 보이지 않는다.' },
    anthem: { name: '군가', short: () => '공격 +25% · 정신 15', more: '아군 전부의 공격을 올리고 정신을 붙든다.' },
    silence: { name: '침묵', short: () => '스킬 봉인 5초', more: '스킬이 가장 가까워진 것 하나의 입을 막는다.' },
    sanctum: { name: '성역', short: () => '곁 정신 면역 4초', more: '곁의 아군이 한동안 정신을 잃지 않는다. 앞의 적을 내려친다.' },
    read: { name: '읽는다', short: () => '방 하나를 지움', more: '방 하나를 읽어 그 효과를 지운다. 정신이 깎일수록 더 세게 치지만 더 쉽게 다친다. 미치지 않는다.' },
  };
  // 방 타일 여덟. len = 가로로 차지하는 칸
  const ROOM = {
    nursery: { name: '알집', len: 2, short: '죽으면 새끼 2', more: '이 위에 선 권속이 죽으면 새끼 둘이 나온다.' },
    pool: { name: '고인 물', len: 3, short: '적 느려짐 35%', more: '이 위에 들어온 적은 젖어 느려진다. 이 위의 심연 권속은 공격 +20%.' },
    eye: { name: '벽의 눈', len: 2, short: '이 줄 적 정신 −6/초', more: '이 줄에 선 적은 정신을 조금씩 잃는다.' },
    digest: { name: '소화굴', len: 2, short: '처치 시 진액 +2', more: '이 위에서 적이 죽거나, 이 위에 선 것이 적을 죽이면 진액 +2 (싸움마다 6까지).' },
    altar: { name: '기도 자리', len: 2, short: '마나 +60%', more: '이 위에 선 「부르는 것」은 마나가 더 빨리 찬다.' },
    bone: { name: '뼈 울타리', len: 3, short: '받는 피해 −30%', more: '이 위에 선 권속은 피해를 덜 받는다.' },
    spore: { name: '포자밭', len: 3, short: '밟은 적 감염', more: '이 위를 밟은 적은 감염된다. 감염된 채 죽으면 감염체로 일어난다.' },
    shade: { name: '그늘', len: 2, short: '첫 공격 ×3', more: '여기서 싸움을 시작한 「사냥꾼」의 첫 공격은 세 배다.' },
  };
  const ROOM_IDS = Object.keys(ROOM);
  // 시너지: need = 단계마다 필요한 서로 다른 권속 수
  const SYN = {
    abyss: { name: '심연', need: [2, 4], short: ['심연 피해 −25%', '모두 −20%·심연 −40%'], more: '심연 권속이 피해를 덜 받고, 그들의 공격은 적을 적셔 느리게 한다.' },
    nebula: { name: '성운', need: [2, 3], short: ['정신 피해 +30%', '정신 피해 +50%'], more: '둥지가 주는 정신 피해가 커진다.' },
    brood: { name: '번식', need: [2, 4], short: ['죽으면 새끼 1', '죽으면 새끼 2'], more: '번식 권속이 죽으면 새끼가 남는다.' },
    dusk: { name: '황혼', need: [2, 3], short: ['미치면 곁 정신 20', '곁 정신 35·광인 +30%'], more: '적이 미칠 때마다 그 곁의 적이 정신을 잃는다.' },
    hunger: { name: '기아', need: [2, 3], short: ['처치 시 회복 15%', '모두 회복 20%'], more: '기아 권속이 적을 쓰러뜨리면 체력을 되찾고 공격이 오른다.' },
    guard: { name: '수문장', need: [2, 4], short: ['수문장 체력 +30%', '모두 +30%·수문장 +60%'], more: '수문장이 더 단단해진다.' },
    hunter: { name: '사냥꾼', need: [2, 4], short: ['뒷줄로 뛰어듦', '첫 공격 ×2.5'], more: '싸움이 시작되면 사냥꾼이 적의 뒷줄로 뛰어든다.' },
    caller: { name: '부르는 것', need: [2, 3], short: ['마나 40%로 시작', '60% 시작 · 모두 +25%'], more: '부르는 것이 마나를 채운 채 시작한다.' },
    mother: { name: '어미', need: [2, 3], short: ['불린 것 +40%', '불린 것 하나 더'], more: '불려 나온 것들이 더 세고 많아진다.' },
  };
  const SYN_IDS = Object.keys(SYN);
  // 라운드마다 오는 것 (r 줄, c 칸: 줄 0 이 맨 뒤, 줄 2 가 앞)
  const ROUNDS = [
    { name: '민병 무리', units: [['militia', 2, 1], ['militia', 2, 2], ['torch', 2, 3], ['militia', 2, 4], ['hound', 1, 0], ['hound', 1, 5]] },
    { name: '모험가 일행', units: [['knight', 2, 2], ['militia', 2, 3], ['rogue', 2, 5], ['priest', 1, 2], ['mage', 0, 1], ['archer', 0, 4]] },
    { name: '책을 쫓는 자', units: [['paladin', 2, 2], ['knight', 2, 3], ['inquis', 2, 4], ['seeker', 1, 2], ['bard', 0, 1], ['priest', 0, 3], ['archer', 0, 5]] },
  ];

  // ───────── 싸움 ─────────
  // S: { seed, nest: [{uid, kind, star, cell}], inv: [{kind, cell}], rooms: [{id, cells}], level, round, form, syn: {id: 단계} }
  function simulate(S) {
    const rs = { s: (S.seed | 0) ^ 0x51ed }, RN = () => rnd(rs);
    const T = [], U = [], occ = new Array(N).fill(null), pend = [], zones = [];
    let t = 0, sid = 0, eid = 0, gold = 0, over = null, conv = 0;
    const ev = (type, o) => { T.push(Object.assign({ t: Math.round(t * 100) / 100, type }, o)); };
    const syn = S.syn || {}, tier = id => syn[id] || 0, round = S.round || 1, coreLv = clamp(round, 1, 3);
    const rooms = (S.rooms || []).map((r, i) => ({ i, id: r.id, cells: r.cells.slice(), dead: false }));
    const roomAt = (cell, id) => rooms.find(r => !r.dead && r.id === id && r.cells.includes(cell));
    const has = (u, n) => !!u.st[n] && u.st[n].until > t + 1e-9;
    function setSt(u, n, dur, v, by) { if (!u.alive) return; const on = !has(u, n); u.st[n] = { until: t + dur, v: v == null ? 1 : v, by: by ? by.id : null }; if (on || n === 'stun' || n === 'silenced') ev('status', { u: u.id, st: n, on: 1, dur: R1(dur), v: v == null ? 1 : v }); }
    function clrSt(u, n) { if (u.st[n]) { delete u.st[n]; ev('status', { u: u.id, st: n, on: 0 }); } }
    const dist = (a, b) => { let m = 99; for (const x of a.cells) for (const y of b.cells) m = Math.min(m, cheb(x, y)); return m; };
    const dcell = (a, cell) => { let m = 99; for (const x of a.cells) m = Math.min(m, cheb(x, cell)); return m; };
    const foes = u => U.filter(x => x.alive && x.side !== u.side), pals = u => U.filter(x => x.alive && x.side === u.side);
    const byId = id => U.find(x => x.id === id);
    function add(o) {
      const d = o.def, m = o.mul || 1;
      const u = { id: o.id, side: o.side, home: o.side, kind: o.kind, star: o.star || 1, cell: o.cell, cells: o.cells || [o.cell], name: d.name, mhp: Math.round(d.hp * (o.hmul || m) * K.hpMul), atk: d.atk * m, as: d.as, range: d.range, df: d.df, mmana: d.mana || 0, mana: 0,
        msan: d.san ? Math.round(d.san * (o.smul || 1) * K.sanMul) : 0, sanAtk: (d.sanAtk || 0) * (0.6 + 0.4 * m), speed: d.speed || 1.6, skill: d.skill || null, asp: d.asp || null, cls: d.cls || null, boss: !!d.boss, elite: !!d.elite, noMad: !!d.noMad, weak: !!d.weak, leap: !!d.leap,
        core: !!o.core, summon: !!o.summon, tierV: d.tier || d.cost || 0, st: {}, nextAtk: 0.3 + RN() * 0.5, freeAt: 0, tg: null, reT: 0, alive: true, mad: false, engage: o.side === 'inv' || !!o.summon, prov: null, firstCrit: 0, atkBonus: 0, eat: 0,
        stat: { dmg: 0, san: 0, heal: 0, kills: 0, casts: 0, taken: 0, conv: 0 } };
      u.hp = u.mhp; u.san = u.msan; u.cells.forEach(c => { occ[c] = u; }); U.push(u); return u;
    }
    const emptyNear = (cell, pred) => { let best = -1, bd = 99; for (let i = 0; i < N; i++) { if (occ[i] || (pred && !pred(i))) continue; const d = cheb(i, cell); if (d < bd) { bd = d; best = i; } } return best; };
    function summon(kind, near, side, mul, by, n) {
      const d = SUMMON[kind], bonus = side === 'nest' && tier('mother') >= 1 ? 1.4 : 1, out = [];
      for (let k = 0; k < n; k++) { const c = emptyNear(near); if (c < 0) break; const u = add({ id: 's' + (++sid), side, kind, def: d, mul: (mul || 1) * bonus, cell: c, summon: true }); u.nextAtk = t + 0.4; ev('spawn', { u: u.id, kind, side, cell: c, by: by ? by.id : null, name: u.name, mhp: u.mhp }); out.push(u); }
      return out;
    }
    const nSum = n => n + (tier('mother') >= 2 ? 1 : 0);
    const pow = u => { let a = u.atk * (1 + u.atkBonus) * (t > K.frenzy ? 1 + K.frenzyUp * (t - K.frenzy) : 1); if (has(u, 'atkup')) a *= 1 + u.st.atkup.v; if (has(u, 'atkdown')) a *= 1 - u.st.atkdown.v; if (u.kind === 'seeker') a *= 1 + 0.8 * (1 - u.san / u.msan); if (u.home === 'nest' && !u.summon && u.asp === 'abyss' && roomAt(u.cell, 'pool')) a *= 1.2; return a; };
    function heal(u, amt, by) { if (!u.alive || amt <= 0) return 0; const h = Math.min(u.mhp - u.hp, Math.round(amt)); if (h <= 0) return 0; u.hp += h; if (by) by.stat.heal += h; ev('heal', { u: u.id, by: by ? by.id : null, amt: h, hp: u.hp }); return h; }
    function gainMana(u, x) { if (!u.mmana || !u.alive) return; let m = x; if (u.home === 'nest' && !u.mad) { if (u.cls === 'caller' && roomAt(u.cell, 'altar')) m *= 1.6; if (tier('caller') >= 2) m *= 1.25; } u.mana = Math.min(u.mmana, u.mana + m); }
    function goMad(u, by) {
      if (!u.alive || u.mad || u.noMad || u.home !== 'inv') return; u.mad = true; u.side = 'nest'; u.tg = null; u.prov = null; u.engage = true; clrSt(u, 'taunted'); conv++; if (by) by.stat.conv++;
      U.forEach(x => { if (x.tg === u.id) x.tg = null; if (x.st.taunted && x.st.taunted.by === u.id) delete x.st.taunted; });
      ev('mad', { u: u.id, by: by ? by.id : null });
      const dk = tier('dusk'); if (dk >= 1) { if (dk >= 2) u.atkBonus += 0.3; const tg = foes(u).filter(x => dist(x, u) <= 1 && x.msan); if (tg.length) ev('synergy', { id: 'dusk', fx: 'echo', u: u.id, tgs: tg.map(x => x.id) }); tg.forEach(x => hurt(by || u, x, 0, { san: dk >= 2 ? 35 : 20, k: 'san', sk: 'dusk' })); }
    }
    function cleanse(u, by) { if (!u.alive || !u.mad) return; u.mad = false; u.side = 'inv'; u.san = Math.round(u.msan * 0.4); u.tg = null; conv--; U.forEach(x => { if (x.tg === u.id) x.tg = null; }); ev('cleanse', { u: u.id, by: by ? by.id : null, sn: u.san }); }
    function die(u, by, how) {
      if (!u.alive) return; u.alive = false; u.cells.forEach(c => { if (occ[c] === u) occ[c] = null; }); ev('die', { u: u.id, by: by ? by.id : null, how: how || 'kill', cell: u.cell });
      U.forEach(x => { if (x.tg === u.id) x.tg = null; if (x.prov === u.id) x.prov = null; if (x.st.taunted && x.st.taunted.by === u.id) delete x.st.taunted; });
      if (u.core) { over = 'inv'; return; }
      if (by && by !== u) { by.stat.kills++; by.kc = (by.kc || 0) + 1; }
      const wasInv = u.home === 'inv' && !u.mad;
      if ((roomAt(u.cell, 'digest') || (by && by.alive && by.home === 'nest' && roomAt(by.cell, 'digest'))) && u.home === 'inv' && gold < 6) { gold += 2; ev('roomfx', { room: 'digest', kind: 'gold', amt: 2, cell: u.cell }); }
      if (has(u, 'infected') && wasInv && !u.boss && !u.summon && how !== 'swallow') { const r = summon('infected', u.cell, 'nest', Math.max(0.6, u.mhp / 500), by, 1); if (r.length) ev('skillfx', { sk: 'spores', fx: 'rise', cells: [u.cell], tgs: [r[0].id] }); }
      if (u.home === 'nest' && !u.mad && !u.summon) {
        if (u.asp === 'brood' && tier('brood') >= 1) { ev('synergy', { id: 'brood', fx: 'hatch', u: u.id, cell: u.cell }); summon('spawn', u.cell, 'nest', STARM[u.star], u, tier('brood')); }
        if (roomAt(u.cell, 'nursery')) { ev('roomfx', { room: 'nursery', kind: 'hatch', cell: u.cell }); summon('spawn', u.cell, 'nest', STARM[u.star], u, 2); }
      }
      if (by && by.alive && by.home === 'nest' && !by.mad && wasInv) { const hg = tier('hunger'); if (hg >= 1 && (by.asp === 'hunger' || hg >= 2) && !by.summon) { heal(by, by.mhp * (hg >= 2 ? 0.2 : 0.15), by); if (by.eat < 3) { by.eat++; by.atkBonus += hg >= 2 ? 0.15 : 0.1; } ev('synergy', { id: 'hunger', fx: 'eat', u: by.id }); } }
    }
    // 피해: k = atk 평타 / skill 스킬 / dot 지속 / true 그대로 / san 정신만
    function hurt(src, tg, amt, o) {
      if (!tg.alive) return 0; o = o || {}; let d = 0, sd = 0;
      if (amt > 0) {
        d = amt; if (o.k === 'skill' || o.k === 'dot') d *= K.skillMul; if (o.k !== 'true' && o.k !== 'dot') d *= 100 / (100 + tg.df);
        if (has(tg, 'shield')) d *= 1 - tg.st.shield.v;
        if (tg.kind === 'seeker' && tg.msan) d *= 1 + 0.6 * (1 - tg.san / tg.msan);
        if (tg.home === 'nest' && !tg.mad) { const ab = tier('abyss'); if (ab >= 2) d *= tg.asp === 'abyss' ? 0.6 : 0.8; else if (ab >= 1 && tg.asp === 'abyss') d *= 0.75; if (!tg.core && roomAt(tg.cell, 'bone')) d *= 0.7; }
        if (o.crit) d *= o.crit;
        d = Math.max(1, Math.round(d)); tg.hp -= d; tg.stat.taken += d; if (src) src.stat.dmg += d; gainMana(tg, K.manaHit);
      }
      if (o.san && tg.msan && tg.home === 'inv' && !tg.mad && !has(tg, 'immSan')) { sd = o.san; if (src && src.home === 'nest') sd *= 1 + [0, 0.3, 0.5][tier('nebula')]; sd = Math.min(tg.san, Math.round(sd)); tg.san -= sd; if (src) src.stat.san += sd; }
      if (!d && !sd) return 0;
      if (src && tg.home === 'nest' && !tg.mad && !tg.core && src.alive && dist(tg, src) > K.aggro) tg.prov = src.id;
      ev('hit', { u: tg.id, by: src ? src.id : null, dmg: d, san: sd, hp: Math.max(0, tg.hp), sn: tg.san, m: Math.round(tg.mana), k: o.k || 'skill', sk: o.sk || null, crit: o.crit ? 1 : 0 });
      if (tg.hp <= 0) die(tg, src, o.how); else if (sd && tg.san <= 0) goMad(tg, src);
      if (src && tg.alive && src.home === 'nest' && !src.mad && src.asp === 'abyss' && tier('abyss') >= 1 && o.k === 'atk') setSt(tg, 'wet', 2, tier('abyss') >= 2 ? 0.4 : 0.2, src);
      return d;
    }
    function moveTo(u, cell, anim, dur) { if (u.core || cell === u.cell || occ[cell]) return false; const from = u.cell; occ[from] = null; u.cell = cell; u.cells = [cell]; occ[cell] = u; ev('move', { u: u.id, from, to: cell, dur: R1(dur || 0.3), anim: anim || 'walk' }); return true; }
    const nearest = (u, list) => { let b = null, bd = 99; for (const x of list) { if (has(x, 'stealth')) continue; const d = dist(u, x); if (d < bd || (d === bd && b && x.hp < b.hp)) { bd = d; b = x; } } return b; };
    function pickTarget(u) {
      if (has(u, 'taunted')) { const x = byId(u.st.taunted.by); if (x && x.alive && x.side !== u.side) return x; }
      const fs = foes(u).filter(x => !has(x, 'stealth')); if (!fs.length) return null;
      let cur = u.tg ? byId(u.tg) : null; if (cur && (!cur.alive || cur.side === u.side || has(cur, 'stealth'))) cur = null;
      if (cur && t < u.reT && dist(u, cur) <= u.range) return cur;
      if (u.prov) { const p = byId(u.prov); if (p && p.alive && p.side !== u.side && (!cur || dist(u, cur) > u.range)) cur = p; }
      let x;
      if (u.weak) { const inr = fs.filter(f => dist(u, f) <= u.range); x = inr.length ? inr.reduce((a, b) => (b.hp < a.hp ? b : a)) : nearest(u, fs); }
      else x = cur && dist(u, cur) <= u.range ? cur : nearest(u, fs);
      if (cur && u.prov === cur.id && dist(u, x) > u.range) x = cur;
      u.tg = x ? x.id : null; u.reT = t + 1; return x;
    }
    // 길 찾기: 빈 칸을 따라 대상에게 닿는 칸으로 한 걸음
    function stepToward(u, tg) {
      const q = [u.cell], prev = new Array(N).fill(-2); prev[u.cell] = -1; let goal = -1;
      for (let h = 0; h < q.length && goal < 0; h++) {
        const c = q[h], p = rc(c);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const r = p[0] + dr, cc = p[1] + dc; if (!inb(r, cc)) continue; const n = idx(r, cc); if (prev[n] !== -2 || occ[n]) continue; prev[n] = c; if (dcell(tg, n) <= u.range) { goal = n; break; } q.push(n);
        }
      }
      let stepCell = -1;
      if (goal >= 0) { let c = goal; while (prev[c] !== u.cell) c = prev[c]; stepCell = c; }
      else { let bd = dist(u, tg); const p = rc(u.cell); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const r = p[0] + dr, cc = p[1] + dc; if (!inb(r, cc)) continue; const n = idx(r, cc); if (occ[n]) continue; const d = dcell(tg, n); if (d < bd) { bd = d; stepCell = n; } } }
      if (stepCell < 0) return false;
      const slow = Math.max(has(u, 'slow') ? u.st.slow.v : 0, has(u, 'wet') ? u.st.wet.v : 0), dur = 1 / (u.speed * (1 - slow));
      moveTo(u, stepCell, 'walk', dur); u.freeAt = t + dur; return true;
    }
    const lineFrom = (cell, dr, dc, max) => { const out = [], p = rc(cell); for (let k = 1; k <= (max || 6); k++) { const r = p[0] + dr * k, c = p[1] + dc * k; if (!inb(r, c)) break; out.push(idx(r, c)); } return out; };
    const dirTo = (a, b) => { const p = rc(a), q = rc(b); return [sgn(q[0] - p[0]), sgn(q[1] - p[1])]; };
    const closest = (u, tg) => { let b = u.cells[0], bd = 99; for (const x of u.cells) for (const y of tg.cells) { const d = cheb(x, y); if (d < bd) { bd = d; b = x; } } return b; };
    const tcell = (u, tg) => { let b = tg.cells[0], bd = 99; for (const y of tg.cells) { const d = dcell(u, y); if (d < bd) { bd = d; b = y; } } return b; };
    // ───── 스킬 ─────
    const F = {
      clam(u, l) { const d = P3(SK.clam.dur, l); setSt(u, 'shield', d, 0.75, u); const tg = foes(u).filter(x => dist(x, u) <= 2 && !x.boss); tg.forEach(x => setSt(x, 'taunted', d, 1, u)); ev('skillfx', { u: u.id, sk: 'clam', fx: 'shell', cells: u.cells, tgs: tg.map(x => x.id), dur: d }); },
      rend(u, l) { const tg = pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'rend', fx: 'bites', tgs: [tg.id], n: 3 }); for (let k = 0; k < 3 && tg.alive; k++) hurt(u, tg, pow(u) * P3(SK.rend.mul, l), { k: 'skill', sk: 'rend' }); if (tg.alive) setSt(tg, 'bleed', 4, pow(u) * 0.3, u); },
      gaze(u, l) { const tg = pickTarget(u); if (!tg) return; const from = closest(u, tg), d = dirTo(from, tcell(u, tg)), cells = lineFrom(from, d[0], d[1], 6), hit = foes(u).filter(x => x === tg || x.cells.some(c => cells.includes(c))); ev('skillfx', { u: u.id, sk: 'gaze', fx: 'beam', from, cells, tgs: hit.map(x => x.id) }); hit.forEach(x => hurt(u, x, P3(SK.gaze.dmg, l), { k: 'skill', san: P3(SK.gaze.san, l), sk: 'gaze' })); },
      whisper(u, l) {
        const fs = foes(u).filter(x => !has(x, 'stealth')), sane = fs.filter(x => x.msan && !x.noMad && !has(x, 'immSan')), tg = nearest(u, sane.length ? sane : fs); if (!tg) return;
        ev('skillfx', { u: u.id, sk: 'whisper', fx: 'whisper', from: u.cell, tgs: [tg.id] });
        if (tg.msan && !tg.noMad && !has(tg, 'immSan')) { hurt(u, tg, 0, { san: P3(SK.whisper.san, l), k: 'san', sk: 'whisper' }); if (tg.mad) { const near = foes(u).filter(x => dist(x, tg) <= 1); ev('skillfx', { u: tg.id, sk: 'whisper', fx: 'madburst', cells: [tg.cell], tgs: near.map(x => x.id) }); near.forEach(x => hurt(u, x, 30, { san: P3(SK.whisper.burst, l), k: 'skill', sk: 'whisper' })); } }
        else hurt(u, tg, P3(SK.whisper.san, l) * 2, { san: P3(SK.whisper.san, l), k: 'skill', sk: 'whisper' });
      },
      devour(u, l) { const tg = pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'devour', fx: 'bigbite', tgs: [tg.id] }); hurt(u, tg, pow(u) * P3(SK.devour.mul, l), { k: 'skill', sk: 'devour' }); if (!tg.alive) { heal(u, u.mhp * 0.3, u); u.atkBonus += 0.2; setSt(u, 'fed', 99, 1, u); } },
      drag(u, l) {
        const fs = foes(u).filter(x => !has(x, 'stealth')); if (!fs.length) return; let tg = null, bd = -1; for (const x of fs) { if (x.boss || x.core) continue; const d = dist(u, x); if (d > bd) { bd = d; tg = x; } }
        if (!tg) { tg = nearest(u, fs); ev('skillfx', { u: u.id, sk: 'drag', fx: 'lash', from: u.cell, tgs: [tg.id] }); hurt(u, tg, P3(SK.drag.dmg, l) * 1.5, { k: 'skill', sk: 'drag' }); return; }
        const dest = bd > 1 ? emptyNear(u.cell) : -1, from = tg.cell; ev('skillfx', { u: u.id, sk: 'drag', fx: 'pull', from: u.cell, to: from, dest, tgs: [tg.id] });
        if (dest >= 0 && cheb(dest, u.cell) < bd) { moveTo(tg, dest, 'pull', 0.3); tg.tg = null; tg.freeAt = t + 0.3; }
        setSt(tg, 'stun', P3(SK.drag.stun, l), 1, u); hurt(u, tg, P3(SK.drag.dmg, l), { k: 'skill', sk: 'drag' }); u.tg = tg.alive ? tg.id : null;
      },
      hatch(u, l) { const out = summon('spawn', u.cell, u.side, STARM[u.star], u, nSum(P3(SK.hatch.n, l))); ev('skillfx', { u: u.id, sk: 'hatch', fx: 'hatch', cells: out.map(x => x.cell), tgs: out.map(x => x.id) }); },
      stare(u, l) { const tg = foes(u).filter(x => dist(x, u) <= 2); ev('skillfx', { u: u.id, sk: 'stare', fx: 'eyes', cells: u.cells, tgs: tg.map(x => x.id), r: 2 }); tg.forEach(x => { hurt(u, x, 20, { san: P3(SK.stare.san, l), k: 'skill', sk: 'stare' }); if (x.alive) setSt(x, 'atkdown', 4, 0.3, u); }); },
      steal(u, l) { const fs = foes(u).filter(x => x.skill && x.skill !== 'read' && x.skill !== 'steal' && F[x.skill]); if (!fs.length) { const tg = pickTarget(u); if (tg) hurt(u, tg, pow(u) * 2.5, { k: 'skill', sk: 'steal' }); return; } const m = fs.reduce((a, b) => (b.tierV > a.tierV || (b.tierV === a.tierV && b.mhp > a.mhp) ? b : a)); ev('skillfx', { u: u.id, sk: 'steal', fx: 'mask', tgs: [m.id], stolen: m.skill }); F[m.skill](u, Math.min(3, l + 1)); },
      swallow(u, l) {
        const cap = P3(SK.swallow.cap, l) * K.hpMul / 2, fs = foes(u).filter(x => dist(x, u) <= 2 && !x.boss && !x.core && x.hp <= cap && !has(x, 'stealth'));
        if (fs.length) { const tg = fs.reduce((a, b) => (b.hp > a.hp ? b : a)); ev('skillfx', { u: u.id, sk: 'swallow', fx: 'swallow', from: u.cell, to: tg.cell, tgs: [tg.id] }); u.stat.dmg += tg.hp; tg.hp = 0; die(tg, u, 'swallow'); setSt(u, 'shield', 4, 0.5, u); heal(u, u.mhp * 0.15, u); }
        else { const tg = pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'swallow', fx: 'bigbite', tgs: [tg.id] }); hurt(u, tg, pow(u) * P3(SK.swallow.mul, l), { k: 'skill', sk: 'swallow' }); }
      },
      spores(u, l) { const tg = pickTarget(u); if (!tg) return; const c = tcell(u, tg), hit = foes(u).filter(x => dcell(x, c) <= 2), cells = []; for (let i = 0; i < N; i++) if (cheb(i, c) <= 2) cells.push(i); ev('skillfx', { u: u.id, sk: 'spores', fx: 'cloud', from: u.cell, cell: c, cells, tgs: hit.map(x => x.id), r: 2 }); hit.forEach(x => { hurt(u, x, P3(SK.spores.dmg, l), { k: 'skill', sk: 'spores' }); if (x.alive) setSt(x, 'infected', 8, 12 * STARM[u.star], u); }); },
      charge(u, l, depth) {
        const tg = pickTarget(u); if (!tg || u.core) return; const d = dirTo(u.cell, tcell(u, tg)), cells = lineFrom(u.cell, d[0], d[1], 5); if (!cells.length) return;
        let land = -1; for (const c of cells) if (!occ[c]) land = c;
        const hit = foes(u).filter(x => x.cells.some(c => cells.includes(c))), from = u.cell; if (!hit.includes(tg) && dist(u, tg) <= 1) hit.push(tg);
        ev('skillfx', { u: u.id, sk: 'charge', fx: 'dash', from, cells, to: land >= 0 ? land : from, tgs: hit.map(x => x.id) });
        if (land >= 0) { moveTo(u, land, 'dash', 0.25); u.freeAt = t + 0.3; }
        let killed = 0; hit.forEach(x => { hurt(u, x, pow(u) * P3(SK.charge.mul, l), { k: 'skill', sk: 'charge' }); if (!x.alive) killed++; });
        u.tg = null; if (killed && (depth || 0) < 2 && foes(u).length) { const dp = (depth || 0) + 1; pend.push({ t: t + 0.45, u, fn: () => { ev('cast', { u: u.id, sk: 'charge', dur: 0.1, again: 1 }); F.charge(u, l, dp); } }); }
      },
      slam(u, l) { const tg = foes(u).filter(x => dist(x, u) <= 2); ev('skillfx', { u: u.id, sk: 'slam', fx: 'slam', cells: u.cells, tgs: tg.map(x => x.id), r: 2 }); tg.forEach(x => hurt(u, x, P3(SK.slam.dmg, l), { k: 'skill', sk: 'slam' })); },
      tide(u, l) {
        const tg = foes(u).filter(x => rc(x.cell)[0] >= NEST_ROW).sort((a, b) => rc(a.cell)[0] - rc(b.cell)[0] || a.cell - b.cell); ev('skillfx', { u: u.id, sk: 'tide', fx: 'wave', rows: [3, 4, 5], tgs: tg.map(x => x.id) });
        tg.forEach(x => { const p = rc(x.cell), up = inb(p[0] - 1, p[1]) ? idx(p[0] - 1, p[1]) : -1; if (up >= 0 && !occ[up] && !x.boss) { moveTo(x, up, 'push', 0.3); x.freeAt = Math.max(x.freeAt, t + 0.3); } hurt(u, x, P3(SK.tide.dmg, l), { k: 'skill', sk: 'tide' }); if (x.alive) { setSt(x, 'wet', 4, 0.4, u); setSt(x, 'stun', 0.6, 1, u); } });
      },
      eyeabove(u, l) { const tg = foes(u); ev('skillfx', { u: u.id, sk: 'eyeabove', fx: 'skyeye', tgs: tg.map(x => x.id) }); tg.forEach(x => hurt(u, x, 30, { san: P3(SK.eyeabove.san, l), k: 'skill', sk: 'eyeabove' })); },
      spawning(u, l) { const out = summon('spawn', u.cells[0] - COLS, u.side, 1 + 0.5 * (l - 1), u, nSum(P3(SK.spawning.n, l))); ev('skillfx', { u: u.id, sk: 'spawning', fx: 'hatch', cells: out.map(x => x.cell), tgs: out.map(x => x.id) }); },
      chorus(u, l) {
        const tg = foes(u).filter(x => x.msan && !x.noMad).sort((a, b) => a.san / a.msan - b.san / b.msan || a.cell - b.cell).slice(0, 3), mads = pals(u).filter(x => x.mad);
        ev('skillfx', { u: u.id, sk: 'chorus', fx: 'chorus', tgs: tg.map(x => x.id), pals: mads.map(x => x.id) });
        if (!tg.length) foes(u).slice(0, 3).forEach(x => hurt(u, x, 120, { k: 'skill', sk: 'chorus' }));
        tg.forEach(x => hurt(u, x, 0, { san: P3(SK.chorus.san, l), k: 'san', sk: 'chorus' })); pals(u).filter(x => x.mad).forEach(x => { heal(x, 100, u); setSt(x, 'atkup', 5, 0.3, u); });
      },
      feast(u, l) { const tg = foes(u).filter(x => dist(x, u) <= 2); let sum = 0; ev('skillfx', { u: u.id, sk: 'feast', fx: 'feast', cells: u.cells, tgs: tg.map(x => x.id), r: 2 }); tg.forEach(x => { sum += hurt(u, x, pow(u) * P3(SK.feast.mul, l), { k: 'skill', sk: 'feast' }); }); heal(u, sum * 0.5, u); },
      pike(u, l) { const tg = pickTarget(u); if (!tg) return; const from = closest(u, tg), d = dirTo(from, tcell(u, tg)), cells = lineFrom(from, d[0], d[1], 2), hit = foes(u).filter(x => x === tg || x.cells.some(c => cells.includes(c))); ev('skillfx', { u: u.id, sk: 'pike', fx: 'pierce', from, cells, tgs: hit.map(x => x.id) }); hit.forEach(x => hurt(u, x, pow(u) * P3(SK.pike.mul, l), { k: 'skill', sk: 'pike' })); },
      arson(u, l) { const tg = pickTarget(u); if (!tg) return; const c = tcell(u, tg), p = rc(c), cells = [c]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { if (inb(p[0] + dr, p[1] + dc)) cells.push(idx(p[0] + dr, p[1] + dc)); }); zones.push({ kind: 'burn', cells, until: t + 4, side: u.side, by: u.id, dps: P3(SK.arson.dps, l) * (u.atk / 35) }); ev('skillfx', { u: u.id, sk: 'arson', fx: 'burnzone', from: u.cell, cells, dur: 4 }); },
      latch(u, l) { const tg = pickTarget(u) || nearest(u, foes(u)); if (!tg) return; if (dist(u, tg) > 1) { const c = emptyNear(tcell(u, tg), i => dcell(tg, i) <= 1); if (c >= 0 && dcell(u, c) <= 4) { moveTo(u, c, 'leap', 0.25); u.freeAt = t + 0.25; } } ev('skillfx', { u: u.id, sk: 'latch', fx: 'latch', tgs: [tg.id] }); if (dist(u, tg) <= 1) { hurt(u, tg, pow(u) * 1.5, { k: 'skill', sk: 'latch' }); if (tg.alive) { if (!tg.core) setSt(tg, 'stun', 1, 1, u); setSt(tg, 'bleed', 4, pow(u) * 0.3, u); } } },
      wall(u, l) { setSt(u, 'shield', 3, 0.6, u); const al = pals(u).filter(x => x !== u && dist(x, u) <= 1), tg = foes(u).filter(x => dist(x, u) <= 1 && !x.core && !x.boss); al.forEach(x => setSt(x, 'shield', 3, 0.35, u)); tg.forEach(x => setSt(x, 'taunted', 2.5, 1, u)); ev('skillfx', { u: u.id, sk: 'wall', fx: 'shieldwall', cells: u.cells, tgs: tg.map(x => x.id), pals: al.map(x => x.id), dur: 3 }); },
      aim(u, l) { const fs = foes(u).filter(x => !has(x, 'stealth')); if (!fs.length) return; const tg = fs.reduce((a, b) => (b.hp < a.hp ? b : a)); ev('skillfx', { u: u.id, sk: 'aim', fx: 'snipe', from: u.cell, to: tg.cell, tgs: [tg.id] }); hurt(u, tg, pow(u) * P3(SK.aim.mul, l), { k: 'skill', sk: 'aim', crit: 1 }); },
      pray(u, l) {
        const al = pals(u).filter(x => dist(x, u) <= 2), lost = U.filter(x => x.alive && x.mad && x.home === u.home && x.side !== u.side && dist(x, u) <= 3);
        ev('skillfx', { u: u.id, sk: 'pray', fx: 'light', cells: u.cells, tgs: al.map(x => x.id), r: 2 });
        al.forEach(x => { heal(x, P3(SK.pray.heal, l) * (u.atk / 25), u); if (x.msan && !x.mad) { x.san = Math.min(x.msan, x.san + 25); ev('sanity', { u: x.id, sn: x.san }); } clrSt(x, 'infected'); });
        if (lost.length) cleanse(lost.reduce((a, b) => (b.tierV > a.tierV ? b : a)), u);
      },
      pillar(u, l) { const fs = foes(u); if (!fs.length) return; let best = fs[0], bn = -1; for (const x of fs) { const n = fs.filter(y => dist(y, x) <= 1).length; if (n > bn) { bn = n; best = x; } } const c = best.cell, hit = fs.filter(x => dcell(x, c) <= 1), cells = []; for (let i = 0; i < N; i++) if (cheb(i, c) <= 1) cells.push(i); ev('skillfx', { u: u.id, sk: 'pillar', fx: 'firepillar', from: u.cell, cell: c, cells, tgs: hit.map(x => x.id), r: 1 }); hit.forEach(x => { hurt(u, x, P3(SK.pillar.dmg, l) * (u.atk / 40) * (1 + 0.15 * (hit.length - 1)), { k: 'skill', sk: 'pillar' }); if (x.alive) setSt(x, 'burn', 3, 15 * (u.atk / 40), u); }); },
      shadow(u, l) { const fs = foes(u).filter(x => !x.core); if (!fs.length) { const tg = pickTarget(u); if (tg) hurt(u, tg, pow(u) * 2, { k: 'skill', sk: 'shadow' }); return; } const back = fs.filter(x => x.range > 1), pool = back.length ? back : fs, tg = pool.reduce((a, b) => (b.hp < a.hp ? b : a)); if (dist(u, tg) > 1) { const c = emptyNear(tg.cell, i => cheb(i, tg.cell) <= 1); if (c >= 0) moveTo(u, c, 'blink', 0.2); } ev('skillfx', { u: u.id, sk: 'shadow', fx: 'backstab', tgs: [tg.id] }); setSt(u, 'stealth', 1, 1, u); U.forEach(x => { if (x.tg === u.id) x.tg = null; }); if (dist(u, tg) <= 1) hurt(u, tg, pow(u) * P3(SK.shadow.mul, l), { k: 'skill', sk: 'shadow', crit: 1 }); u.tg = tg.alive ? tg.id : null; },
      anthem(u, l) { const al = pals(u); ev('skillfx', { u: u.id, sk: 'anthem', fx: 'song', tgs: al.map(x => x.id) }); al.forEach(x => { setSt(x, 'atkup', 4, 0.25, u); if (x.msan && !x.mad && x.home === 'inv') { x.san = Math.min(x.msan, x.san + 15); ev('sanity', { u: x.id, sn: x.san }); } }); },
      silence(u, l) { const fs = foes(u).filter(x => x.skill && x.mmana); if (!fs.length) return; const tg = fs.reduce((a, b) => (b.mana / b.mmana > a.mana / a.mmana ? b : a)); ev('skillfx', { u: u.id, sk: 'silence', fx: 'seal', from: u.cell, tgs: [tg.id] }); setSt(tg, 'silenced', 5, 1, u); hurt(u, tg, pow(u) * 1.5, { k: 'skill', sk: 'silence' }); },
      sanctum(u, l) { const al = pals(u).filter(x => dist(x, u) <= 1); ev('skillfx', { u: u.id, sk: 'sanctum', fx: 'sanctum', cells: u.cells, tgs: al.map(x => x.id), r: 1, dur: 4 }); al.forEach(x => setSt(x, 'immSan', 4, 1, u)); const tg = pickTarget(u); if (tg && dist(u, tg) <= u.range) hurt(u, tg, pow(u) * 2, { k: 'skill', sk: 'sanctum' }); },
      read(u, l) {
        const live = rooms.filter(r => !r.dead);
        if (u.side === 'inv' && live.length) { const cnt = r => U.filter(x => x.alive && x.side !== u.side && r.cells.includes(x.cell)).length, r = live.reduce((a, b) => (cnt(b) > cnt(a) ? b : a)); r.dead = true; ev('skillfx', { u: u.id, sk: 'read', fx: 'read', cells: r.cells, room: r.i }); ev('roomfx', { room: r.id, i: r.i, kind: 'erase', cells: r.cells }); foes(u).filter(x => r.cells.includes(x.cell)).forEach(x => hurt(u, x, 60, { k: 'skill', sk: 'read' })); }
        else { const tg = foes(u).filter(x => dist(x, u) <= 2); ev('skillfx', { u: u.id, sk: 'read', fx: 'readblast', cells: u.cells, tgs: tg.map(x => x.id), r: 2 }); tg.forEach(x => { hurt(u, x, pow(u) * 1.2, { k: 'skill', sk: 'read' }); if (x.alive && !x.core) setSt(x, 'silenced', 3, 1, u); }); }
      },
    };
    // ───── 세우기 ─────
    const lv = S.level || 3, cd = K.core, form = FORM[S.form] ? S.form : 'drop';
    const core = add({ id: 'core', side: 'nest', kind: 'core', core: true, cell: CORE[0], cells: CORE.slice(), def: { name: FORM[form].name, hp: cd.hp * (1 + cd.lvHp * (lv - 3)) * (1 + cd.rdHp * (round - 1)), atk: cd.atk * (1 + 0.15 * (round - 1)), as: cd.as, range: cd.range, df: cd.df, mana: cd.mana, skill: FORM[form].skill, asp: form === 'drop' ? null : form } });
    core.form = form; core.engage = true;
    (S.nest || []).forEach(n => { const d = KIN[n.kind]; if (!d || occ[n.cell]) return; add({ id: 'k' + n.uid, side: 'nest', kind: n.kind, star: n.star, cell: n.cell, def: d, mul: STARM[n.star || 1] }); });
    const rm = K.roundAtk[round - 1] || 1, rh = K.roundHp[round - 1] || 1, sm = K.roundSan[round - 1] || 1;
    (S.inv || []).forEach(n => { const d = INV[n.kind]; if (!d || occ[n.cell]) return; add({ id: 'e' + (++eid), side: 'inv', kind: n.kind, cell: n.cell, def: d, mul: rm * (n.mul || 1), hmul: rh * (n.mul || 1), smul: sm }); });
    // 시너지와 방: 싸움이 시작될 때 붙는 것
    SYN_IDS.forEach(id => { if (tier(id)) ev('synergy', { id, tier: tier(id), fx: 'on' }); });
    U.forEach(u => {
      if (u.home !== 'nest' || u.core) return;
      const g = tier('guard'); if (g) { const b = u.cls === 'guard' ? (g >= 2 ? 0.6 : 0.3) : g >= 2 ? 0.3 : 0; if (b) { u.mhp = Math.round(u.mhp * (1 + b)); u.hp = u.mhp; } }
      const c = tier('caller'); if (c && u.cls === 'caller' && u.mmana) u.mana = u.mmana * (c >= 2 ? 0.6 : 0.4);
      const h = tier('hunter'); if (u.cls === 'hunter') { if (h >= 2) u.firstCrit = 2.5; if (roomAt(u.cell, 'shade')) { u.firstCrit = 3; ev('roomfx', { room: 'shade', kind: 'on', u: u.id, cell: u.cell }); } if (h >= 1) u.leap = true; }
    });
    const init = U.map(u => ({ id: u.id, side: u.side, kind: u.kind, star: u.star, cell: u.cell, cells: u.cells.slice(), name: u.name, mhp: u.mhp, msan: u.msan, mmana: u.mmana, mana: Math.round(u.mana), range: u.range, skill: u.skill, boss: u.boss, elite: u.elite, core: u.core, form: u.form || null, asp: u.asp, cls: u.cls }));
    // 뛰어드는 것들: 0.6초에 적의 뒷줄 곁으로
    pend.push({ t: 0.6, fn: () => { U.filter(u => u.alive && u.leap && !u.core).forEach(u => { const fs = foes(u).filter(x => !x.core); if (!fs.length) return; const far = u.side === 'nest' ? (a, b) => rc(a.cell)[0] - rc(b.cell)[0] : (a, b) => rc(b.cell)[0] - rc(a.cell)[0], back = fs.slice().sort((a, b) => (b.range > 1) - (a.range > 1) || far(a, b) || a.hp - b.hp)[0]; const c = emptyNear(back.cell, i => cheb(i, back.cell) <= 1); if (c >= 0) { moveTo(u, c, 'leap', 0.35); u.freeAt = t + 0.4; u.nextAtk = t + 0.5; u.tg = back.id; u.reT = t + 2; u.engage = true; } }); } });

    function act(u) {
      if (has(u, 'stun') || t < u.freeAt) return;
      const tg = pickTarget(u); if (!tg) return;
      const d = dist(u, tg);
      if (u.skill && u.mmana && u.mana >= u.mmana && !has(u, 'silenced') && (d <= Math.max(u.range, 4) || u.core || u.skill === 'hatch' || u.skill === 'spawning' || u.skill === 'pray' || u.skill === 'anthem' || u.skill === 'read')) {
        u.mana = 0; u.stat.casts++; ev('cast', { u: u.id, sk: u.skill, tg: tg.id, dur: K.castWind }); u.freeAt = t + K.castWind + 0.15; u.nextAtk = Math.max(u.nextAtk, t + K.castWind + 0.2);
        const sk = u.skill, l = u.core ? coreLv : u.star; pend.push({ t: t + K.castWind, u, fn: () => { if (!has(u, 'stun')) F[sk](u, l); } }); return;
      }
      if (d <= u.range) {
        if (t < u.nextAtk) return;
        const slow = Math.max(has(u, 'slow') ? u.st.slow.v : 0, has(u, 'wet') ? u.st.wet.v : 0); u.nextAtk = t + 1 / (u.as * (1 - slow));
        let crit = 0; if (u.firstCrit) { crit = u.firstCrit; u.firstCrit = 0; }
        ev('attack', { u: u.id, tg: tg.id, r: u.range > 1 ? 1 : 0, from: closest(u, tg), to: tcell(u, tg) }); gainMana(u, K.manaAtk);
        hurt(u, tg, pow(u), { k: 'atk', san: u.sanAtk, crit }); return;
      }
      if (u.core) return;
      const go = u.engage || u.mad || t >= K.engageAt || d <= K.aggro + (u.range - 1) || (u.prov && tg.id === u.prov);
      if (go) stepToward(u, tg);
    }
    // ───── 돌리기 ─────
    const maxStep = Math.round(K.end / TICK);
    for (let step = 0; step <= maxStep && !over; step++) {
      t = step * TICK;
      for (let i = 0; i < pend.length; i++) { const p = pend[i]; if (p.t <= t + 1e-9) { pend.splice(i, 1); i--; if (!p.u || p.u.alive) p.fn(); if (over) break; } }
      if (over) break;
      for (const u of U) { if (!u.alive) continue; for (const n in u.st) if (u.st[n].until <= t + 1e-9) { delete u.st[n]; ev('status', { u: u.id, st: n, on: 0 }); } }
      if (step % 5 === 0 && step > 0) {
        for (const u of U.slice()) {
          if (!u.alive) continue;
          for (const n of ['bleed', 'burn', 'infected']) if (u.alive && has(u, n)) hurt(byId(u.st[n].by) || null, u, u.st[n].v * 0.5, { k: 'dot', sk: n });
        }
        for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; if (z.until <= t) { zones.splice(i, 1); ev('roomfx', { room: 'burn', kind: 'end', cells: z.cells }); continue; } const by = byId(z.by); U.slice().forEach(u => { if (!u.alive || !z.cells.includes(u.cell)) return; if (u.side !== z.side) hurt(by && by.alive ? by : null, u, z.dps * 0.5 * (u.summon ? 3 : 1), { k: 'dot', sk: 'burn' }); else clrSt(u, 'infected'); }); }
        rooms.forEach(r => { if (r.dead) return; if (r.id === 'pool' || r.id === 'spore') U.forEach(u => { if (!u.alive || u.side === 'nest' || !r.cells.includes(u.cell)) return; if (r.id === 'pool') { if (!has(u, 'wet')) ev('roomfx', { room: 'pool', kind: 'wet', u: u.id, cell: u.cell }); setSt(u, 'wet', 1, 0.35, null); } else if (!has(u, 'infected')) { ev('roomfx', { room: 'spore', kind: 'infect', u: u.id, cell: u.cell }); setSt(u, 'infected', 8, 12, core); } }); });
      }
      if (step % 10 === 0 && step > 0) {
        rooms.forEach(r => { if (r.dead || r.id !== 'eye') return; const row = rc(r.cells[0])[0], tg = U.filter(u => u.alive && u.side === 'inv' && u.msan && rc(u.cell)[0] === row); if (tg.length) { ev('roomfx', { room: 'eye', kind: 'gaze', cells: r.cells, tgs: tg.map(x => x.id) }); tg.forEach(x => hurt(core, x, 0, { san: 6, k: 'san', sk: 'eye' })); } });
        if (Math.abs(t - K.frenzy) < 1e-6) ev('frenzy', {});
        if (t >= K.sudden) { if (Math.abs(t - K.sudden) < 1e-6) ev('sudden', {}); const f = 0.03 * (1 + (t - K.sudden) / 4); U.slice().forEach(u => { if (u.alive) hurt(null, u, u.mhp * f * (u.core ? 0.5 : 1), { k: 'true', sk: 'sudden' }); }); }
      }
      if (over) break;
      for (const u of U.slice()) { if (!u.alive || over) continue; act(u); }
      if (!over && !U.some(u => u.alive && u.side === 'inv')) over = 'nest';
    }
    if (!over) { const fr = side => { const l = U.filter(u => u.home === side && !u.summon); return l.reduce((a, u) => a + (u.alive && u.side === side ? u.hp : 0), 0) / Math.max(1, l.reduce((a, u) => a + u.mhp, 0)); }; over = fr('nest') > fr('inv') ? 'nest' : 'inv'; }
    const survivors = U.filter(u => u.alive && u.side === 'inv').length;
    ev('win', { side: over, survivors });
    T.sort((a, b) => a.t - b.t);
    return { seed: S.seed, round, form, syn, timeline: T, result: over === 'nest' ? 'win' : 'loss', winner: over, time: R1(t), units: init, rooms: rooms.map(r => ({ id: r.id, cells: r.cells, erased: r.dead })), gold, survivors, converted: U.filter(u => u.mad).length, coreHp: Math.max(0, core.hp), coreMhp: core.mhp,
      breakdown: U.map(u => ({ id: u.id, kind: u.kind, name: u.name, side: u.home, star: u.star, summon: u.summon, alive: u.alive, mad: u.mad, dmg: u.stat.dmg, san: u.stat.san, heal: u.stat.heal, kills: u.stat.kills, casts: u.stat.casts, taken: u.stat.taken, conv: u.stat.conv })) };
  }

  // ───────── 준비 ─────────
  const isNestCell = c => c >= NEST_ROW * COLS && c < N && !CORE.includes(c);
  function synOf(kinds) { const set = [...new Set(kinds)].filter(k => KIN[k]), out = {}, form = formOf(set), fc = FORM[form].cls; SYN_IDS.forEach(id => { const core = id === form || id === fc ? 1 : 0, n = set.filter(k => KIN[k].asp === id || KIN[k].cls === id).length + core, need = SYN[id].need; out[id] = { n, core: !!core, tier: n >= need[1] ? 2 : n >= need[0] ? 1 : 0 }; }); return out; }
  function formOf(kinds) { const set = [...new Set(kinds)], cnt = {}; set.forEach(k => { const a = KIN[k].asp; cnt[a] = (cnt[a] || 0) + 1; }); let best = 'drop', bn = 1; ASPS.forEach(a => { if ((cnt[a] || 0) > bn) { bn = cnt[a]; best = a; } }); return best; }
  const cap = R => R.level + 1;
  const boardUids = R => Object.keys(R.board).map(c => R.board[c]);
  const boardKinds = R => boardUids(R).map(id => R.unit[id].kind);
  function rollShop(R) { const o = K.odds[R.level] || K.odds[K.maxLv]; R.shop = []; for (let i = 0; i < 5; i++) { const x = rnd(R.rs) * 100, c = x < o[0] ? 1 : x < o[0] + o[1] ? 2 : 3, pool = KIN_IDS.filter(k => KIN[k].cost === c); R.shop.push(pool[Math.floor(rnd(R.rs) * pool.length)]); } }
  function rollRooms(R) { const pool = ROOM_IDS.filter(id => !R.rooms.some(r => r.id === id)), out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rnd(R.rs) * pool.length), 1)[0]); R.roomOffer = out; }
  function enemyOf(R, round) { const d = ROUNDS[round - 1], flip = rnd(R.rs) < 0.5; return d.units.map(u => ({ kind: u[0], cell: idx(u[1], flip ? COLS - 1 - u[2] : u[2]) })); }
  function newRun(seed, opts) {
    opts = opts || {};
    const R = { v: 1, seed: seed >>> 0, rs: { s: (seed | 0) ^ 0x7a11 }, round: 1, rounds: K.start.rounds, gold: K.start.gold, level: K.start.level, xp: 0, hp: K.start.hp, shop: [], bench: [null, null, null, null, null, null], board: {}, unit: {}, nextUid: 1, rooms: [], roomOffer: [], enemy: [], phase: 'prep', over: null, merges: [], hist: [], fights: 0 };
    rollShop(R); rollRooms(R); R.enemy = enemyOf(R, 1); return R;
  }
  const fail = msg => ({ ok: false, msg }), ok = o => Object.assign({ ok: true }, o || {});
  const whereOf = (R, uid) => { const b = R.bench.indexOf(uid); if (b >= 0) return { bench: b }; for (const c in R.board) if (R.board[c] === uid) return { cell: +c }; return null; };
  function removeUnit(R, uid) { const w = whereOf(R, uid); if (w && w.bench != null) R.bench[w.bench] = null; else if (w) delete R.board[w.cell]; delete R.unit[uid]; }
  // 같은 권속 같은 별 셋이면 하나로 합쳐 별이 오른다
  function merge(R) {
    const out = [];
    for (let guard = 0; guard < 20; guard++) {
      let done = true; const groups = {};
      Object.keys(R.unit).forEach(id => { const u = R.unit[id]; if (u.star >= 3) return; const k = u.kind + ':' + u.star; (groups[k] = groups[k] || []).push(+id); });
      for (const k in groups) { const g = groups[k]; if (g.length < 3) continue; g.sort((a, b) => { const wa = whereOf(R, a), wb = whereOf(R, b); return (wa.cell != null ? 0 : 1) - (wb.cell != null ? 0 : 1) || a - b; }); const keep = g[0]; removeUnit(R, g[1]); removeUnit(R, g[2]); R.unit[keep].star++; out.push({ uid: keep, kind: R.unit[keep].kind, star: R.unit[keep].star, ate: [g[1], g[2]] }); done = false; break; }
      if (done) break;
    }
    if (out.length) R.merges = R.merges.concat(out); return out;
  }
  function buy(R, i) {
    if (R.phase !== 'prep') return fail('지금은 살 수 없다'); const kind = R.shop[i]; if (!kind) return fail('빈 자리다'); const cost = KIN[kind].cost; if (R.gold < cost) return fail('진액이 모자란다');
    let slot = R.bench.indexOf(null); const same = Object.keys(R.unit).filter(id => R.unit[id].kind === kind && R.unit[id].star === 1).length;
    if (slot < 0 && same < 2) return fail('대기석이 찼다');
    R.gold -= cost; R.shop[i] = null; const uid = R.nextUid++; R.unit[uid] = { uid, kind, star: 1 };
    if (slot >= 0) R.bench[slot] = uid; else R.bench.push(uid);
    const merged = merge(R); R.bench = R.bench.slice(0, 6);
    return ok({ uid, merged });
  }
  const sellValue = u => KIN[u.kind].cost * Math.pow(3, u.star - 1);
  function sell(R, uid) { if (R.phase !== 'prep') return fail('지금은 팔 수 없다'); const u = R.unit[uid]; if (!u) return fail('없는 권속이다'); const v = sellValue(u); removeUnit(R, uid); R.gold += v; return ok({ gold: v }); }
  function reroll(R) { if (R.phase !== 'prep') return fail('지금은 안 된다'); if (R.gold < K.reroll) return fail('진액이 모자란다'); R.gold -= K.reroll; rollShop(R); return ok(); }
  function levelUp(R) { let up = 0; while (R.level < K.maxLv && R.xp >= K.xpNeed[R.level]) { R.xp -= K.xpNeed[R.level]; R.level++; up++; } if (R.level >= K.maxLv) R.xp = 0; return up; }
  function buyXp(R) { if (R.phase !== 'prep') return fail('지금은 안 된다'); if (R.level >= K.maxLv) return fail('더 넓힐 수 없다'); if (R.gold < K.xpCost) return fail('진액이 모자란다'); R.gold -= K.xpCost; R.xp += K.xpBuy; return ok({ up: levelUp(R) }); }
  // 옮기기: to = { cell } 또는 { bench }. 자리가 차 있으면 서로 바꾼다
  function move(R, uid, to) {
    if (R.phase !== 'prep') return fail('지금은 옮길 수 없다'); if (!R.unit[uid]) return fail('없는 권속이다'); const from = whereOf(R, uid);
    if (to.cell != null) {
      if (!isNestCell(to.cell)) return fail('세울 수 없는 칸이다'); const other = R.board[to.cell];
      if (from.cell == null && !other && boardUids(R).length >= cap(R)) return fail('둥지가 찼다 (' + cap(R) + ')');
      if (from.cell != null) delete R.board[from.cell]; else R.bench[from.bench] = null;
      R.board[to.cell] = uid; if (other) { if (from.cell != null) R.board[from.cell] = other; else R.bench[from.bench] = other; }
    } else {
      const b = to.bench; if (b == null || b < 0 || b > 5) return fail('없는 자리다'); const other = R.bench[b];
      if (from.cell != null) delete R.board[from.cell]; else R.bench[from.bench] = null;
      R.bench[b] = uid; if (other) { if (from.cell != null) R.board[from.cell] = other; else R.bench[from.bench] = other; }
    }
    return ok();
  }
  const roomCells = (id, cell) => { const out = [], p = rc(cell); for (let k = 0; k < ROOM[id].len; k++) out.push(inb(p[0], p[1] + k) ? idx(p[0], p[1] + k) : -1); return out; };
  function canPlaceRoom(R, id, cell) { if (!ROOM[id]) return false; const cs = roomCells(id, cell); return cs.every(c => c >= 0 && c >= NEST_ROW * COLS && !CORE.includes(c) && !R.rooms.some(r => r.cells.includes(c))); }
  function roomSpots(R, id) { const out = []; for (let c = NEST_ROW * COLS; c < N; c++) if (canPlaceRoom(R, id, c)) out.push(c); return out; }
  function placeRoom(R, i, cell) { if (R.phase !== 'prep') return fail('지금은 안 된다'); const id = R.roomOffer[i]; if (!id) return fail('고를 방이 없다'); if (!canPlaceRoom(R, id, cell)) return fail('놓을 수 없는 자리다'); R.rooms.push({ id, cells: roomCells(id, cell) }); R.roomOffer = []; return ok({ id }); }
  function setupOf(R, seed) { const kinds = boardKinds(R), sy = synOf(kinds), syn = {}; SYN_IDS.forEach(id => { if (sy[id].tier) syn[id] = sy[id].tier; }); return { seed: seed == null ? (R.seed ^ Math.imul(R.round + R.fights * 31, 0x9E3779B1)) | 0 : seed, nest: Object.keys(R.board).map(c => ({ uid: R.board[c], kind: R.unit[R.board[c]].kind, star: R.unit[R.board[c]].star, cell: +c })), inv: R.enemy, rooms: R.rooms, level: R.level, round: R.round, form: formOf(kinds), syn }; }
  // 싸운다: 결과를 돌려주고 다음 라운드로 넘긴다
  function ready(R) {
    if (R.phase !== 'prep') return fail('이미 끝난 판이다');
    const f = simulate(setupOf(R)); R.fights++; const win = f.result === 'win';
    let lost = 0; if (!win) { lost = K.lossHp + f.survivors; R.hp = Math.max(0, R.hp - lost); }
    const interest = Math.min(K.interestMax, Math.floor(R.gold / K.interest)), income = K.income + interest + (win ? K.winGold : 0) + f.gold;
    R.hist.push({ round: R.round, win, time: f.time, lost, converted: f.converted, gold: income });
    const res = { fight: f, win, lost, income, round: R.round };
    if (R.hp <= 0) { R.phase = 'over'; R.over = { win: false, round: R.round, why: '본체가 무너졌다' }; return ok(res); }
    if (R.round >= R.rounds) { R.phase = 'over'; R.over = { win, round: R.round, why: win ? '책을 쫓는 자가 물러났다' : '둥지가 읽혔다' }; return ok(res); }
    R.round++; R.gold += income; R.xp += K.xpFree; res.levelUp = levelUp(R); rollShop(R); rollRooms(R); R.enemy = enemyOf(R, R.round); R.merges = [];
    return ok(res);
  }
  // ───────── 화면이 읽는 것 ─────────
  const skillInfo = (id, l) => { const s = SK[id]; return s ? { id, name: s.name, short: s.short(l || 1), more: s.more } : null; };
  function unitInfo(kind, star) {
    const d = KIN[kind], s = star || 1; if (!d) return null; const m = STARM[s];
    const hp = Math.round(d.hp * m * K.hpMul);
    return { kind, name: d.name, star: s, cost: d.cost, asp: d.asp, aspName: ASPN[d.asp], cls: d.cls, clsName: CLSN[d.cls], hp, atk: Math.round(d.atk * m), as: d.as, df: d.df, range: d.range, mana: d.mana, sanAtk: Math.round((d.sanAtk || 0) * (0.6 + 0.4 * m)), short: `체력 ${hp} · 공격 ${Math.round(d.atk * m)}`, more: `${ASPN[d.asp]} · ${CLSN[d.cls]} · 닿는 칸 ${d.range}`, skill: skillInfo(d.skill, s) };
  }
  function invInfo(kind, round) { const d = INV[kind]; if (!d) return null; const r = clamp(round || 1, 1, 3) - 1, hp = Math.round(d.hp * K.roundHp[r] * K.hpMul), san = Math.round(d.san * K.roundSan[r] * K.sanMul), atk = Math.round(d.atk * K.roundAtk[r]); return { kind, name: d.name, role: d.role, hp, san, atk, as: d.as, df: d.df, range: d.range, mana: d.mana, boss: !!d.boss, elite: !!d.elite, noMad: !!d.noMad, short: `체력 ${hp} · 정신 ${san}`, more: d.role + ' · 닿는 칸 ' + d.range, skill: skillInfo(d.skill, 1) }; }
  const roomInfo = id => (ROOM[id] ? { id, name: ROOM[id].name, len: ROOM[id].len, short: ROOM[id].short, more: ROOM[id].more } : null);
  function synInfo(id, n) { const s = SYN[id], tier = n >= s.need[1] ? 2 : n >= s.need[0] ? 1 : 0; return { id, name: s.name, n, need: s.need, tier, next: tier >= 2 ? null : s.need[tier], short: s.short[Math.max(0, tier - 1)], shorts: s.short, more: s.more, kind: ASPN[id] ? 'asp' : 'cls' }; }
  function formInfo(form, round) { const f = FORM[form] || FORM.drop; return { form, name: f.name, skill: skillInfo(f.skill, clamp(round || 1, 1, 3)) }; }
  function view(R) {
    const kinds = boardKinds(R), sy = synOf(kinds), uv = id => { const u = R.unit[id]; return u ? Object.assign({ uid: id, sell: sellValue(u) }, unitInfo(u.kind, u.star)) : null; };
    return { round: R.round, rounds: R.rounds, roundName: ROUNDS[Math.min(R.round, ROUNDS.length) - 1].name, phase: R.phase, over: R.over, gold: R.gold, level: R.level, xp: R.xp, xpNeed: K.xpNeed[R.level] || 0, cap: cap(R), placed: kinds.length, hp: R.hp, hpMax: K.start.hp,
      shop: R.shop.map((k, i) => (k ? Object.assign({ i, can: R.gold >= KIN[k].cost }, unitInfo(k, 1)) : null)), bench: R.bench.map(id => (id ? uv(id) : null)), board: Object.keys(R.board).map(c => Object.assign({ cell: +c }, uv(R.board[c]))),
      rooms: R.rooms.map(r => Object.assign({ cells: r.cells }, roomInfo(r.id))), roomOffer: R.roomOffer.map((id, i) => Object.assign({ i, spots: roomSpots(R, id) }, roomInfo(id))),
      synergies: SYN_IDS.map(id => Object.assign(synInfo(id, sy[id].n), { core: sy[id].core })).filter(s => s.n > 0).sort((a, b) => b.tier - a.tier || b.n - a.n), form: formInfo(formOf(kinds), R.round),
      enemy: R.enemy.map(e => Object.assign({ cell: e.cell }, invInfo(e.kind, R.round))), costs: { reroll: K.reroll, xp: K.xpCost }, canXp: R.level < K.maxLv && R.gold >= K.xpCost, canReroll: R.gold >= K.reroll, merges: R.merges, hist: R.hist };
  }
  return { COLS, ROWS, N, CORE, NEST_ROW, TICK, K, KIN, KIN_IDS, INV, INV_IDS, SUMMON, FORM, SK, ROOM, ROOM_IDS, SYN, SYN_IDS, ROUNDS, ASPN, ASPS, CLSN, CLSS, STARM, rc, idx, cheb, rnd, isNestCell,
    simulate, newRun, view, buy, sell, sellValue, reroll, buyXp, move, placeRoom, canPlaceRoom, roomSpots, roomCells, ready, setupOf, merge, synOf, formOf, cap, whereOf, unitInfo, invInfo, skillInfo, roomInfo, synInfo, formInfo, enemyOf };
})();
if (typeof module !== 'undefined') module.exports = LAIR;
