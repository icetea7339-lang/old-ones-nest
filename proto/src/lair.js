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
  // 싸움에서 맡는 일. 화면은 이것으로 표식과 발밑 고리를 가른다
  const ROLE = { tank: { name: '탱커', row: 'front' }, melee: { name: '근접 딜러', row: 'front' }, ranged: { name: '원거리 딜러', row: 'back' }, support: { name: '지원', row: 'back' }, dive: { name: '침투', row: 'any' } }, ROLE_IDS = Object.keys(ROLE);
  const reachText = (range, role) => (range > 1 && role !== 'melee' && role !== 'tank' && role !== 'dive' ? '원거리 ' : '근접 ') + range + '칸';
  const K = {
    start: { gold: 14, level: 3, hp: 12, rounds: 3 }, xpNeed: { 3: 6, 4: 10, 5: 16 }, maxLv: 6, xpBuy: 4, xpCost: 4, xpFree: 2, reroll: 2,
    odds: { 3: [65, 30, 5], 4: [45, 40, 15], 5: [30, 45, 25], 6: [25, 40, 35] }, income: 10, interest: 5, interestMax: 2, winGold: 2, lossHp: 3,
    roundHp: [2.4, 1.2, 1.03], roundAtk: [1.3, 1.7, 1.56], roundSan: [1.25, 1, 0.85], hpMul: 2.6, sanMul: 1.82, skillMul: 1.5, aggro: 2, engageAt: 18, frenzy: 40, frenzyUp: 0.08, sudden: 72, end: 100, manaAtk: 10, manaHit: 6, castWind: 0.75,
    pace: { as: 0.78, speed: 0.68, back: 1.2, leapAt: 2, leapDur: 0.5 },
    core: { hp: 1000, atk: 75, as: 0.6, range: 2, df: 30, mana: 110, lvHp: 0.2, rdHp: 0.1 },
    // 온전한 판: 3막 x 5라운드. invHp/invAtk/invSan 은 라운드 1~15 의 침입자 배수
    full: { gold: 10, level: 3, life: 20, acts: 3, per: 5, eliteAt: 3, income: 5, interestPer: 10, interestMax: 5, winGold: 1, streak: [0, 0, 1, 2, 3], xpRound: 2, maxLv: 8, xpNeed: { 3: 6, 4: 10, 5: 18, 6: 28, 7: 40 },
      odds: { 3: [70, 25, 5, 0, 0], 4: [50, 33, 15, 2, 0], 5: [35, 35, 24, 5, 1], 6: [22, 33, 30, 12, 3], 7: [18, 27, 33, 17, 5], 8: [12, 22, 33, 23, 10] },
      lossBase: [3, 3, 4], lossPer: 0.5, lossMax: 8, bossLoss: 2, giftGold: [5, 6, 7], eliteGold: [16, 24, 32], bossGold: [8, 12], bossUnit: [2, 3], eliteMul: 1.04, eliteBonus: [10, 14, 18], eliteHeal: [2, 2, 2], eliteLoss: [2, 2, 2], eliteUnit: [3, 4, 5], coreHp: 0.06, coreAtk: 0.07,
      // 신화 단계: 라운드 2/7/12. tier = 단계마다 속삭임/징조/현현 의 무게, fearTier = 공포 1마다 현현 쪽으로 옮기는 무게. awake = 깨어남 단계마다 본체 배수
      mythosAt: [2, 7, 12], tier: [[55, 35, 10], [40, 40, 20], [25, 45, 30]], fearTier: 1.5, awake: [{ hp: 1, atk: 1 }, { hp: 1.2, atk: 1.15 }, { hp: 1.45, atk: 1.35 }, { hp: 1.8, atk: 1.6 }],
      // 공포 판정: heavy/normal = 성공 0/1 일 때 잃는 정신의 비율, stun = 얼어붙는 시간. 공포: 이기면 +1 (권속을 잃지 않았거나, 셋 이상 미쳤거나, 정예를 삼키거나 미치게 했으면 +1 더), 지면 −1. fearAt 을 넘을 때마다 세상이 답한다
      check: { heavy: 0.5, normal: 0.2, stun: 2, bleed: 5, contact: 3, moment: 3 }, sumUp: 0.035, fearMax: 18, fearAt: [6, 12, 18], encounter: 0.5, rerollBase: 2, zealMax: 2,
      invHp: [3.6, 2.7, 1.8, 1.25, 1.05, 3.17, 1.94, 1.94, 1.5, 1.6, 3.87, 2.64, 2.73, 3.08, 3],
      invAtk: [0.75, 1.05, 1.58, 1.97, 3.5, 2.67, 2.43, 3.12, 2.9, 3.5, 3.46, 4.04, 3.81, 3.81, 4.4],
      invSan: [1.05, 1.05, 1.05, 1.1, 1.3, 1.68, 1.62, 1.85, 1.79, 1.35, 2.13, 2.24, 2.3, 2.24, 2] },
  };
  // 닿지 않아도 쓰는 스킬
  const FAR = { hatch: 1, spawning: 1, pray: 1, anthem: 1, read: 1, readall: 1, sermon: 1, rebirth: 1, rally: 1, exorcise: 1, skyrift: 1, mark: 1, reap: 1, c_note: 1, c_hymn: 1, c_snare: 1, c_fire: 1, c_lamp: 1 };
  // 권속 열둘. hp 체력 atk 공격 as 초당 공격 range 닿는 칸 df 방어 mana 스킬에 드는 마나 sanAtk 평타 정신 피해
  const KIN = {
    shell: { name: '비늘지기', role: 'tank', cost: 1, asp: 'abyss', cls: 'guard', hp: 650, atk: 40, as: 0.6, range: 1, df: 40, mana: 70, skill: 'clam' },
    biter: { name: '깨물이', role: 'melee', cost: 1, asp: 'brood', cls: 'hunter', hp: 450, atk: 55, as: 0.9, range: 1, df: 15, mana: 60, skill: 'rend' },
    gazer: { name: '별보는 눈', role: 'ranged', cost: 1, asp: 'nebula', cls: 'caller', hp: 380, atk: 45, as: 0.7, range: 3, df: 10, mana: 60, sanAtk: 8, skill: 'gaze' },
    hood: { name: '두건 쓴 것', role: 'ranged', cost: 1, asp: 'dusk', cls: 'caller', hp: 400, atk: 35, as: 0.7, range: 3, df: 10, mana: 70, sanAtk: 10, skill: 'whisper' },
    gnaw: { name: '허기', role: 'melee', cost: 1, asp: 'hunger', cls: 'hunter', hp: 480, atk: 60, as: 0.8, range: 1, df: 15, mana: 70, skill: 'devour' },
    tangle: { name: '촉수 뭉치', role: 'melee', cost: 2, asp: 'abyss', cls: 'hunter', hp: 600, atk: 55, as: 0.7, range: 1, df: 25, mana: 80, skill: 'drag' },
    brood: { name: '알 품은 것', role: 'support', cost: 2, asp: 'brood', cls: 'mother', hp: 550, atk: 40, as: 0.6, range: 2, df: 20, mana: 80, skill: 'hatch' },
    heap: { name: '눈 무더기', role: 'tank', cost: 2, asp: 'nebula', cls: 'guard', hp: 800, atk: 45, as: 0.6, range: 1, df: 40, mana: 90, sanAtk: 6, skill: 'stare' },
    mask: { name: '가면 쓴 것', role: 'melee', cost: 2, asp: 'dusk', cls: 'hunter', hp: 560, atk: 70, as: 0.9, range: 1, df: 20, mana: 80, sanAtk: 5, skill: 'steal' },
    maw: { name: '해구의 입', role: 'tank', cost: 3, asp: 'abyss', cls: 'guard', hp: 1000, atk: 70, as: 0.6, range: 1, df: 50, mana: 100, skill: 'swallow' },
    mother: { name: '포자 어미', role: 'support', cost: 3, asp: 'brood', cls: 'mother', hp: 750, atk: 50, as: 0.6, range: 3, df: 25, mana: 100, skill: 'spores' },
    famine: { name: '통삼킴', role: 'melee', cost: 3, asp: 'hunger', cls: 'hunter', hp: 800, atk: 95, as: 0.9, range: 1, df: 30, mana: 90, skill: 'charge' },
    gulp: { name: '배불뚝이', role: 'tank', cost: 2, asp: 'hunger', cls: 'guard', hp: 980, atk: 50, as: 0.6, range: 1, df: 40, mana: 80, skill: 'gorge', gen: 2, art: 'gnaw' },
    orbit: { name: '도는 눈들', role: 'ranged', cost: 3, asp: 'nebula', cls: 'caller', hp: 600, atk: 65, as: 0.7, range: 3, df: 15, mana: 90, sanAtk: 10, skill: 'meteor', gen: 2, art: 'gazer' },
    bell: { name: '종 든 것', role: 'tank', cost: 3, asp: 'dusk', cls: 'guard', hp: 950, atk: 55, as: 0.6, range: 1, df: 45, mana: 90, sanAtk: 8, skill: 'toll', gen: 2, art: 'hood' },
    ink: { name: '먹물 뿜는 것', role: 'ranged', cost: 4, asp: 'abyss', cls: 'caller', hp: 800, atk: 80, as: 0.7, range: 3, df: 20, mana: 100, skill: 'inkcloud', gen: 2, art: 'tangle' },
    hollow: { name: '텅 빈 것', role: 'melee', cost: 4, asp: 'hunger', cls: 'hunter', hp: 1000, atk: 135, as: 0.9, range: 1, df: 30, mana: 90, skill: 'reap', gen: 2, art: 'famine' },
    preach: { name: '설교하는 것', role: 'support', cost: 4, asp: 'dusk', cls: 'mother', hp: 850, atk: 60, as: 0.7, range: 3, df: 20, mana: 100, sanAtk: 14, skill: 'sermon', gen: 2, art: 'mask' },
    rift: { name: '하늘의 틈', role: 'ranged', cost: 5, asp: 'nebula', cls: 'caller', hp: 950, atk: 95, as: 0.7, range: 4, df: 25, mana: 130, sanAtk: 16, skill: 'skyrift', gen: 2, art: 'heap' },
    queen: { name: '굴의 여왕', role: 'support', cost: 5, asp: 'brood', cls: 'mother', hp: 1300, atk: 80, as: 0.6, range: 2, df: 35, mana: 120, skill: 'rebirth', gen: 2, art: 'mother' },
  };
  const KIN_IDS = Object.keys(KIN);
  // 불려 나오는 것
  const SUMMON = {
    spawn: { name: '새끼', role: 'melee', hp: 160, atk: 22, as: 1, range: 1, df: 0 },
    infected: { name: '감염체', role: 'melee', hp: 200, atk: 30, as: 0.8, range: 1, df: 5 },
    brute: { name: '큰 새끼', role: 'melee', hp: 520, atk: 60, as: 0.8, range: 1, df: 15, art: 'spawn' },
    cultist: { name: '신도', role: 'ranged', hp: 380, atk: 38, as: 0.7, range: 3, df: 5, sanAtk: 12, art: 'infected' },
    possessed: { name: '홀린 자', role: 'melee', hp: 480, san: 200, atk: 55, as: 0.8, range: 1, df: 10, art: 'infected' },
    zealot: { name: '광신도', role: 'melee', hp: 340, atk: 36, as: 0.8, range: 1, df: 5, art: 'infected' },
  };
  // 본체의 다섯 모습 (가장 많이 모은 성향)과 처음 모습
  const FORM = {
    drop: { name: '옛 것', skill: 'slam' }, abyss: { name: '바다 밑에서 온 것', skill: 'tide', cls: 'guard' }, nebula: { name: '별에서 내려다보는 것', skill: 'eyeabove', cls: 'caller' },
    brood: { name: '새끼 떼의 어미', skill: 'spawning', cls: 'mother' }, dusk: { name: '두건 쓴 무리의 주인', skill: 'chorus', cls: 'caller' }, hunger: { name: '끝없는 아가리', skill: 'feast', cls: 'hunter' },
  };
  // 침입자 열둘. san 정신
  const INV = {
    militia: { name: '민병', tag: '앞줄', role: 'melee', hp: 420, san: 60, atk: 40, as: 0.7, range: 1, df: 15, mana: 60, skill: 'pike', tier: 1 },
    torch: { name: '횃불꾼', tag: '앞줄', role: 'melee', hp: 380, san: 55, atk: 35, as: 0.7, range: 1, df: 10, mana: 70, skill: 'arson', tier: 1 },
    hound: { name: '사냥개', tag: '돌진', role: 'melee', hp: 300, san: 40, atk: 50, as: 1.1, range: 1, df: 5, mana: 50, speed: 2.6, skill: 'latch', tier: 1 },
    knight: { name: '방패 기사', tag: '탱커', role: 'tank', hp: 900, san: 110, atk: 45, as: 0.6, range: 1, df: 60, mana: 80, skill: 'wall', tier: 2 },
    archer: { name: '궁수', tag: '뒷줄', role: 'ranged', hp: 380, san: 70, atk: 52, as: 0.8, range: 4, df: 5, mana: 70, skill: 'aim', weak: true, tier: 2 },
    priest: { name: '사제', tag: '치유', role: 'support', hp: 420, san: 140, atk: 25, as: 0.6, range: 3, df: 10, mana: 70, skill: 'pray', tier: 2 },
    mage: { name: '마법사', tag: '뒷줄', role: 'ranged', hp: 360, san: 90, atk: 40, as: 0.6, range: 4, df: 5, mana: 90, skill: 'pillar', tier: 2 },
    rogue: { name: '도적', tag: '침투', role: 'dive', hp: 400, san: 70, atk: 70, as: 1, range: 1, df: 10, mana: 60, speed: 2.4, skill: 'shadow', leap: true, tier: 2 },
    bard: { name: '음유시인', tag: '지원', role: 'support', hp: 400, san: 100, atk: 30, as: 0.7, range: 3, df: 10, mana: 80, skill: 'anthem', tier: 2 },
    inquis: { name: '심문관', tag: '정예', role: 'melee', hp: 800, san: 160, atk: 65, as: 0.7, range: 2, df: 35, mana: 80, skill: 'silence', elite: true, tier: 3 },
    paladin: { name: '성기사', tag: '정예', role: 'tank', hp: 1100, san: 220, atk: 70, as: 0.6, range: 1, df: 60, mana: 90, skill: 'sanctum', elite: true, tier: 3 },
    seeker: { name: '책을 쫓는 자', tag: '우두머리', role: 'ranged', hp: 2000, san: 300, atk: 80, as: 0.7, range: 3, df: 30, mana: 100, skill: 'read', boss: true, noMad: true, reader: true, tier: 4 },
    // 2막과 3막에 오는 것들
    crossbow: { name: '석궁병', tag: '뒷줄', role: 'ranged', hp: 420, san: 80, atk: 62, as: 0.6, range: 4, df: 10, mana: 80, skill: 'bolt', tier: 2, art: 'archer' },
    banner: { name: '기수', tag: '지원', role: 'support', hp: 520, san: 120, atk: 30, as: 0.6, range: 2, df: 20, mana: 80, skill: 'rally', tier: 2, art: 'bard' },
    tracker: { name: '추적자', tag: '침투', role: 'dive', hp: 480, san: 80, atk: 75, as: 1, range: 1, df: 15, mana: 70, speed: 2.4, skill: 'mark', leap: true, tier: 3, art: 'rogue' },
    templar: { name: '성전사', tag: '앞줄', role: 'melee', hp: 780, san: 150, atk: 72, as: 0.8, range: 1, df: 30, mana: 80, skill: 'smite', tier: 3, art: 'knight' },
    exorcist: { name: '구마사', tag: '지원', role: 'support', hp: 460, san: 200, atk: 30, as: 0.6, range: 3, df: 10, mana: 90, skill: 'exorcise', tier: 3, art: 'priest' },
    alchemist: { name: '연금술사', tag: '뒷줄', role: 'ranged', hp: 400, san: 90, atk: 45, as: 0.6, range: 4, df: 5, mana: 90, skill: 'flask', tier: 3, art: 'mage' },
    seekerm: { name: '책을 쫓는 자', tag: '우두머리', role: 'ranged', hp: 3000, san: 400, atk: 95, as: 0.7, range: 3, df: 35, mana: 100, skill: 'readall', boss: true, noMad: true, reader: true, readAtk: 0.3, readHurt: 0.8, tier: 4, art: 'seeker' },
    // 이름 있는 조사자 여섯. 판마다 되풀이해 온다 (CAST 에 내력이 있다)
    c_eda: { name: '에다 볼크', tag: '조사자', role: 'ranged', hp: 520, san: 150, atk: 55, as: 0.6, range: 4, df: 10, mana: 80, skill: 'c_note', elite: true, tier: 3, art: 'mage', cast: 'eda' },
    c_rowen: { name: '로웬 하스', tag: '조사자', role: 'tank', hp: 1200, san: 180, atk: 75, as: 0.6, range: 1, df: 55, mana: 90, skill: 'c_oath', elite: true, tier: 3, art: 'knight', cast: 'rowen' },
    c_mirel: { name: '미렐 수녀', tag: '조사자', role: 'support', hp: 560, san: 240, atk: 30, as: 0.6, range: 3, df: 10, mana: 80, skill: 'c_hymn', elite: true, tier: 3, art: 'priest', cast: 'mirel' },
    c_tov: { name: '토브 카인', tag: '조사자', role: 'dive', hp: 620, san: 110, atk: 85, as: 1, range: 1, df: 15, mana: 70, speed: 2.4, skill: 'c_snare', leap: true, elite: true, tier: 3, art: 'rogue', cast: 'tov' },
    c_isel: { name: '이셀 드란', tag: '조사자', role: 'ranged', hp: 480, san: 120, atk: 50, as: 0.6, range: 4, df: 5, mana: 90, skill: 'c_fire', elite: true, tier: 3, art: 'mage', cast: 'isel' },
    c_vasco: { name: '늙은 바스코', tag: '조사자', role: 'support', hp: 700, san: 260, atk: 35, as: 0.6, range: 2, df: 20, mana: 80, skill: 'c_lamp', elite: true, tier: 3, art: 'bard', cast: 'vasco' },
  };
  const INV_IDS = Object.keys(INV);
  // 의지: 공포 판정에서 굴리는 주사위 수 (1~4)
  const WILL = { militia: 1, torch: 1, hound: 1, knight: 2, archer: 1, priest: 3, mage: 2, rogue: 2, bard: 2, inquis: 3, paladin: 4, seeker: 4, crossbow: 2, banner: 2, tracker: 2, templar: 3, exorcist: 4, alchemist: 2, seekerm: 3, c_eda: 3, c_rowen: 3, c_mirel: 4, c_tov: 2, c_isel: 2, c_vasco: 4 };
  INV_IDS.forEach(k => { INV[k].will = WILL[k] || 1; });
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
    gorge: { name: '꿀꺽', mul: [2, 2.5, 3.5], short: l => `한 입 ×${P3([2, 2.5, 3.5], l)} · 흡수`, more: '크게 한 입 물고, 준 피해만큼 체력을 되찾는다. 3초 동안 받는 피해가 40% 준다.' },
    meteor: { name: '떨어지는 별', dmg: [110, 190, 360], san: [20, 35, 60], short: l => `범위 ${P3([110, 190, 360], l)} · 정신 ${P3([20, 35, 60], l)}`, more: '가장 뭉친 곳에 별이 떨어진다. 한 칸 둘레의 적 전부가 체력과 정신을 잃는다.' },
    toll: { name: '종소리', san: [25, 40, 70], dur: [2, 2.5, 3], short: l => `도발 ${P3([2, 2.5, 3], l)}초 · 정신 ${P3([25, 40, 70], l)}`, more: '종을 친다. 두 칸 안의 적이 정신을 잃고 제게로 끌려온다. 그동안 받는 피해가 절반이 된다.' },
    inkcloud: { name: '먹물', dmg: [100, 170, 320], sil: [3, 4, 5], short: l => `범위 ${P3([100, 170, 320], l)} · 침묵 ${P3([3, 4, 5], l)}초`, more: '스킬이 가장 가까워진 적에게 먹물을 뿜는다. 한 칸 둘레의 적이 피해를 입고, 입이 막히고, 젖는다.' },
    reap: { name: '거둠', mul: [3, 3.6, 5], cut: [20, 25, 33], short: l => `×${P3([3, 3.6, 5], l)} · ${P3([20, 25, 33], l)}% 아래 처형`, more: '가장 약해진 적 곁으로 뛰어들어 친다. 체력이 낮은 적은 그대로 죽는다 (우두머리는 빼고). 죽이면 두 번까지 다시 쓴다.' },
    sermon: { name: '부름', n: [1, 2, 2], heal: [150, 250, 450], short: l => `신도 ${P3([1, 2, 2], l)} · 광인 회복 ${P3([150, 250, 450], l)}`, more: '신도를 불러낸다. 신도는 멀리서 쏘며 정신을 깎는다. 미친 적들은 체력을 되찾는다.' },
    skyrift: { name: '하늘이 열린다', dmg: [90, 150, 280], san: [30, 45, 80], cut: [20, 25, 35], short: l => `전체 정신 ${P3([30, 45, 80], l)} · 광기`, more: '모든 적이 체력과 정신을 잃는다. 정신이 20/25/35% 아래로 떨어진 적은 곧바로 미친다.' },
    rebirth: { name: '다시 낳음', hp: [40, 60, 100], short: l => `권속 부활 · 체력 ${P3([40, 60, 100], l)}%`, more: '죽은 권속 가운데 가장 값진 하나를 되살린다 (권속마다 한 번). 죽은 권속이 없으면 큰 새끼 하나를 낳는다.' },
    bolt: { name: '꿰뚫는 살', mul: [2, 2, 2], short: () => '한 줄 꿰뚫음 ×2', more: '한 줄 위의 것 전부를 꿴다.' },
    rally: { name: '깃발', short: () => '보호막 30% · 정신 20', more: '아군 전부가 3초 동안 피해를 덜 받고 정신을 되찾는다.' },
    mark: { name: '표식', short: () => '받는 피해 +30% 6초', more: '가장 값진 권속에게 표식을 남긴다. 표식이 붙은 것은 피해를 더 받는다.' },
    smite: { name: '심판', short: () => '×2.5 · 불린 것 2배', more: '앞의 것을 내려친다. 불려 나온 것과 미친 것에게는 두 배로 친다.' },
    exorcise: { name: '구마', short: () => '광인 둘 되돌림', more: '미친 아군 둘을 제정신으로 돌리고, 불려 나온 것 전부에게 피해를 준다.' },
    flask: { name: '산 플라스크', short: () => '범위 90 · 방어 −50%', more: '가장 뭉친 곳에 산을 던진다. 맞은 것은 5초 동안 방어가 절반이 된다.' },
    c_note: { name: '받아 적는다', short: () => '봉인 5초 · 표식', more: '가장 값진 권속의 입을 막고 표식을 남긴다. 표식이 붙은 것은 6초 동안 피해를 30% 더 받는다.' },
    c_oath: { name: '꺾이지 않는 맹세', short: () => '피해 −60% · 회복 20%', more: '방패를 세워 곁의 적을 제게로 끌어들이고, 체력의 20%를 되찾는다.' },
    c_hymn: { name: '우물가의 찬송', short: () => '회복 120 · 정신 30', more: '아군 전부의 체력과 정신을 되돌리고, 미친 아군 하나를 제정신으로 돌린다.' },
    c_snare: { name: '덫', short: () => '기절 2초 · 출혈', more: '가장 값진 권속을 덫에 묶는다.' },
    c_fire: { name: '푸른 불', short: () => '아홉 칸에 불 5초', more: '가장 뭉친 곳의 아홉 칸에 불을 놓는다. 불려 나온 것은 세 배로 탄다.' },
    c_lamp: { name: '꺼지지 않는 등불', short: () => '정신 면역 4초', more: '두 칸 안의 아군이 4초 동안 정신을 잃지 않는다.' },
    readall: { name: '끝까지 읽는다', short: () => '방 둘 지움 · 홀린 자 2', more: '방 둘을 읽어 지우고, 홀린 자 둘을 불러낸다. 곁의 것은 입이 막힌다. 정신이 깎일수록 더 세게 치지만 더 쉽게 다친다. 미치지 않는다.' },
  };
  // 방 타일 여덟. len = 가로로 차지하는 칸
  const ROOM = {
    nursery: { name: '알집', len: 2, short: '죽으면 새끼 2', more: '이 위에 선 권속이 죽으면 새끼 둘이 나온다.' },
    pool: { name: '고인 물', len: 3, short: '적 느려짐 35%', more: '이 위에 들어온 적은 젖어 느려진다. 이 위의 심연 권속은 공격 +20%.' },
    eye: { name: '벽의 눈', len: 2, short: '이 줄 적 정신 −6/초', more: '이 줄에 선 적은 정신을 조금씩 잃는다. 이 줄과 바로 앞줄의 적은 공포 판정에서 주사위를 하나 덜 굴린다.' },
    digest: { name: '소화굴', len: 2, short: '처치 시 진액 +2', more: '이 위에서 적이 죽거나, 이 위에 선 것이 적을 죽이면 진액 +2 (싸움마다 6까지).' },
    altar: { name: '기도 자리', len: 2, short: '마나 +60%', more: '이 위에 선 「부르는 것」은 마나가 더 빨리 찬다.' },
    bone: { name: '뼈 울타리', len: 3, short: '받는 피해 −30%', more: '이 위에 선 권속은 피해를 덜 받는다.' },
    spore: { name: '포자밭', len: 3, short: '밟은 적 감염', more: '이 위를 밟은 적은 감염된다. 감염된 채 죽으면 감염체로 일어난다.' },
    shade: { name: '그늘', len: 2, short: '첫 공격 ×3', more: '여기서 싸움을 시작한 「사냥꾼」의 첫 공격은 세 배다.' },
  };
  const ROOM_IDS = Object.keys(ROOM);
  // 방은 막을 따라 자란다 (온전한 판): 1막 / 2막 / 3막의 수치. 맛보기 판은 늘 첫 칸
  const ROOMLV = { nursery: [2, 2, 3], pool: [0.35, 0.38, 0.42], poolAtk: [0.2, 0.23, 0.26], eye: [6, 8, 10], digest: [2, 2, 3], digestCap: [6, 7, 8], altar: [0.6, 0.7, 0.8], bone: [0.3, 0.33, 0.36], spore: [12, 16, 20], shade: [3, 3.3, 3.6] };
  const RV = (k, lv) => ROOMLV[k][clamp(lv || 1, 1, 3) - 1], P100 = x => Math.round(x * 100);
  const ROOMTXT = {
    nursery: l => ['죽으면 새끼 ' + RV('nursery', l), '이 위에 선 권속이 죽으면 새끼 ' + RV('nursery', l) + '마리가 나온다.'],
    pool: l => [`적 느려짐 ${P100(RV('pool', l))}%`, `이 위에 들어온 적은 젖어 느려진다. 이 위의 심연 권속은 공격 +${P100(RV('poolAtk', l))}%.`],
    eye: l => [`이 줄 적 정신 −${RV('eye', l)}/초`, '이 줄에 선 적은 정신을 조금씩 잃는다. 이 줄과 바로 앞줄의 적은 공포 판정에서 주사위를 하나 덜 굴린다.'],
    digest: l => [`처치 시 진액 +${RV('digest', l)}`, `이 위에서 적이 죽거나, 이 위에 선 것이 적을 죽이면 진액 +${RV('digest', l)} (싸움마다 ${RV('digestCap', l)}까지).`],
    altar: l => [`마나 +${P100(RV('altar', l))}%`, '이 위에 선 「부르는 것」은 마나가 더 빨리 찬다.'],
    bone: l => [`받는 피해 −${P100(RV('bone', l))}%`, '이 위에 선 권속은 피해를 덜 받는다.'],
    spore: l => ['밟은 적 감염 ' + RV('spore', l), '이 위를 밟은 적은 감염되어 조금씩 다친다. 감염된 채 죽으면 감염체로 일어난다.'],
    shade: l => [`첫 공격 ×${RV('shade', l)}`, `여기서 싸움을 시작한 「사냥꾼」의 첫 공격은 ${RV('shade', l)}배다.`],
  };
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
  // 온전한 판의 문턱: 성향 2/4/5 (권속은 성향마다 넷, 다섯째는 진화한 본체), 종류 2/4
  ASPS.forEach(a => { SYN[a].full = [2, 4, 5]; }); CLSS.forEach(c => { SYN[c].full = [2, 4]; });
  SYN.abyss.short.push('모두 −25%·심연 −45%'); SYN.nebula.short.push('정신 피해 +80%'); SYN.brood.short.push('죽으면 새끼 3'); SYN.dusk.short.push('곁 정신 50·광인 +50%'); SYN.hunger.short.push('회복 20% · 네 번까지');
  // 온전한 판의 심연: 덜 단단하고, 젖은 적이 둥지의 공격에 더 다친다 (싸움이 늘어지지 않게)
  SYN.abyss.fullShort = ['심연 −20%·젖음 +21%', '모두 −8%·젖음 +42%', '모두 −12%·젖음 +62%'];
  SYN.dusk.fullShort = ['미치면 곁 정신 15', '곁 정신 28·광인 +30%', '곁 정신 40·광인 +50%'];
  SYN.abyss.fullMore = '심연 권속이 피해를 덜 받는다 (20/28/36%). 그들의 공격은 적을 3초 동안 적셔 느리게 하고, 젖은 적은 둥지의 모든 공격에 더 다친다 (21/42/62%).';
  // 라운드마다 오는 것 (r 줄, c 칸: 줄 0 이 맨 뒤, 줄 2 가 앞)
  const ROUNDS = [
    { name: '민병 무리', units: [['militia', 2, 1], ['militia', 2, 2], ['torch', 2, 3], ['militia', 2, 4], ['hound', 1, 0], ['hound', 1, 5]] },
    { name: '모험가 일행', units: [['knight', 2, 2], ['militia', 2, 3], ['rogue', 2, 5], ['priest', 1, 2], ['mage', 0, 1], ['archer', 0, 4]] },
    { name: '책을 쫓는 자', units: [['paladin', 2, 2], ['knight', 2, 3], ['inquis', 2, 4], ['seeker', 1, 2], ['bard', 0, 1], ['priest', 0, 3], ['archer', 0, 5]] },
  ];

  // ───────── 싸움 ─────────
  // S: { seed, nest: [{uid, kind, star, cell}], inv: [{kind, cell}], rooms: [{id, cells}], level, round, form, syn: {id: 단계} }
  // 선택 인자 (굴 짓기가 쓴다. 없으면 둥지 전투 그대로): hpMul / sanMul (전체 배수 대신), noCore (본체 없이), clock { engage, frenzy, sudden, end },
  //   inv[].hp / san (시작 체력·정신), inv[].mad (미친 채 시작), inv[].st [{ n, dur, v }] (시작 상태), inv[].noLeap (뛰어들지 않는다), nest[].leap (싸움이 시작되면 적의 뒷줄로 뛰어든다), nest[].hp (시작 체력), keep (결과에 final 과 시작 체력을 싣는다)
  //   core.skill (본체의 스킬을 모습 대신 이것으로)
  function simulate(S) {
    const rs = { s: (S.seed | 0) ^ 0x51ed }, RN = () => rnd(rs);
    const T = [], U = [], occ = new Array(N).fill(null), pend = [], zones = [];
    let t = 0, sid = 0, eid = 0, gold = 0, over = null, conv = 0;
    const ev = (type, o) => { T.push(Object.assign({ t: Math.round(t * 100) / 100, type }, o)); };
    const CL = S.clock || {}, T_FR = CL.frenzy != null ? CL.frenzy : K.frenzy, T_SD = CL.sudden != null ? CL.sudden : K.sudden, T_END = CL.end != null ? CL.end : K.end, T_ENG = CL.engage != null ? CL.engage : K.engageAt, HPM = S.hpMul || K.hpMul, SNM = S.sanMul || K.sanMul;
    const syn = S.syn || {}, tier = id => syn[id] || 0, round = S.round || 1, sc = S.core || null, coreLv = sc ? sc.lv : clamp(round, 1, 3), bo = {};
    Object.assign(bo, S.boons || {}); const ck = S.check || null, boBy = S.boonBy || {}; let stood = 0, firstBlood = false, nCheck = 0, nContact = 0, nMoment = 0;
    const fullRun = !!S.scale, rl = k => RV(k, S.roomLv);
    const bev = (id, o) => ev('boon', Object.assign({ id, card: boBy[id] || null }, o || {}));
    const rooms = (S.rooms || []).map((r, i) => ({ i, id: r.id, cells: r.cells.slice(), dead: false }));
    const roomAt = (cell, id) => rooms.find(r => !r.dead && r.id === id && r.cells.includes(cell));
    const has = (u, n) => !!u.st[n] && u.st[n].until > t + 1e-9;
    function setSt(u, n, dur, v, by) { if (!u.alive) return; const on = !has(u, n); u.st[n] = { until: t + dur, v: v == null ? 1 : v, by: by ? by.id : null }; if (on || n === 'stun' || n === 'silenced') ev('status', { u: u.id, st: n, on: 1, dur: R1(dur), v: v == null ? 1 : v, by: by ? by.id : null }); }
    function clrSt(u, n) { if (u.st[n]) { delete u.st[n]; ev('status', { u: u.id, st: n, on: 0 }); } }
    const dist = (a, b) => { let m = 99; for (const x of a.cells) for (const y of b.cells) m = Math.min(m, cheb(x, y)); return m; };
    const dcell = (a, cell) => { let m = 99; for (const x of a.cells) m = Math.min(m, cheb(x, cell)); return m; };
    const foes = u => U.filter(x => x.alive && x.side !== u.side), pals = u => U.filter(x => x.alive && x.side === u.side);
    const byId = id => U.find(x => x.id === id);
    function add(o) {
      const d = o.def, m = o.mul || 1;
      const u = { id: o.id, side: o.side, home: o.side, kind: o.kind, star: o.star || 1, cell: o.cell, cells: o.cells || [o.cell], name: d.name, mhp: Math.round(d.hp * (o.hmul || m) * HPM), atk: d.atk * m, as: d.as * K.pace.as, range: d.range, df: d.df, mmana: d.mana || 0, mana: 0, role: d.role || (o.core ? 'core' : 'melee'),
        msan: d.san ? Math.round(d.san * (o.smul || 1) * SNM) : 0, sanAtk: (d.sanAtk || 0) * (0.6 + 0.4 * m), speed: (d.speed || 1.6) * K.pace.speed, skill: d.skill || null, asp: d.asp || null, cls: d.cls || null, boss: !!d.boss, elite: !!d.elite, noMad: !!d.noMad, weak: !!d.weak, leap: !!d.leap, reader: !!d.reader, readAtk: d.readAtk != null ? d.readAtk : 0.8, readHurt: d.readHurt != null ? d.readHurt : 0.6, art: d.art || o.kind, will: o.will != null ? o.will : d.will || 0, cast: o.cast || null, chk: 0,
        core: !!o.core, summon: !!o.summon, tierV: d.tier || d.cost || 0, st: {}, nextAtk: 0.3 + RN() * 0.5 + (d.range > 1 ? K.pace.back : 0), freeAt: d.range > 1 && !o.core && !o.summon ? K.pace.back : 0, tg: null, reT: 0, alive: true, mad: false, engage: o.side === 'inv' || !!o.summon, prov: null, firstCrit: 0, atkBonus: 0, eat: 0,
        stat: { dmg: 0, san: 0, heal: 0, kills: 0, casts: 0, taken: 0, conv: 0 } };
      u.hp = u.mhp; u.san = u.msan; u.cells.forEach(c => { occ[c] = u; }); U.push(u); return u;
    }
    const emptyNear = (cell, pred) => { let best = -1, bd = 99; for (let i = 0; i < N; i++) { if (occ[i] || (pred && !pred(i))) continue; const d = cheb(i, cell); if (d < bd) { bd = d; best = i; } } return best; };
    function summon(kind, near, side, mul, by, n) {
      const d = SUMMON[kind], bonus = (side === 'nest' && tier('mother') >= 1 ? 1.4 : 1) * (side === 'nest' && bo.spawnplus ? 1 + bo.spawnplus : 1) * (side === 'nest' ? S.sumMul || 1 : 1), out = [];
      for (let k = 0; k < n; k++) { const c = emptyNear(near); if (c < 0) break; const u = add({ id: 's' + (++sid), side, kind, def: d, mul: (mul || 1) * bonus, cell: c, summon: true }); u.nextAtk = t + 0.4; ev('spawn', { u: u.id, kind, side, cell: c, by: by ? by.id : null, name: u.name, mhp: u.mhp, role: u.role, range: u.range }); out.push(u); }
      return out;
    }
    const nSum = n => n + (tier('mother') >= 2 ? 1 : 0);
    const pow = u => { let a = u.atk * (1 + u.atkBonus) * (t > T_FR ? 1 + K.frenzyUp * (t - T_FR) : 1); if (has(u, 'atkup')) a *= 1 + u.st.atkup.v; if (has(u, 'atkdown')) a *= 1 - u.st.atkdown.v; if (u.reader) a *= 1 + u.readAtk * (1 - u.san / u.msan); if (u.home === 'nest' && !u.summon && u.asp === 'abyss' && roomAt(u.cell, 'pool')) a *= 1 + rl('poolAtk'); if (bo.roomplus && u.home === 'nest' && !u.summon && !u.core && rooms.some(r => !r.dead && r.cells.includes(u.cell))) a *= 1 + bo.roomplus; return a; };
    function heal(u, amt, by) { if (!u.alive || amt <= 0) return 0; const h = Math.min(u.mhp - u.hp, Math.round(amt)); if (h <= 0) return 0; u.hp += h; if (by) by.stat.heal += h; ev('heal', { u: u.id, by: by ? by.id : null, amt: h, hp: u.hp }); return h; }
    function gainMana(u, x) { if (!u.mmana || !u.alive) return; let m = x; if (u.home === 'nest' && !u.mad) { if (u.cls === 'caller' && roomAt(u.cell, 'altar')) m *= 1 + rl('altar'); if (tier('caller') >= 2) m *= 1.25; if (bo.manaFast) m *= 1 + bo.manaFast; } u.mana = Math.min(u.mmana, u.mana + m); }
    function goMad(u, by) {
      if (!u.alive || u.mad || u.noMad || u.home !== 'inv') return; u.mad = true; u.side = 'nest'; u.tg = null; u.prov = null; u.engage = true; clrSt(u, 'taunted'); conv++; if (by) by.stat.conv++;
      U.forEach(x => { if (x.tg === u.id) x.tg = null; if (x.st.taunted && x.st.taunted.by === u.id) delete x.st.taunted; });
      ev('mad', { u: u.id, by: by ? by.id : null });
      if (bo.madstrong) { u.atkBonus += bo.madstrong; bev('madstrong', { u: u.id }); heal(u, u.mhp * bo.madstrong, null); }
      const dk = tier('dusk'); if (dk >= 1) { if (dk >= 2) u.atkBonus += dk >= 3 ? 0.5 : 0.3; const tg = foes(u).filter(x => dist(x, u) <= 1 && x.msan); if (tg.length) ev('synergy', { id: 'dusk', fx: 'echo', u: u.id, tgs: tg.map(x => x.id) }); tg.forEach(x => hurt(by || u, x, 0, { san: (fullRun ? [0, 15, 28, 40] : [0, 20, 35, 50])[dk], k: 'san', sk: 'dusk' })); }
    }
    function cleanse(u, by) { if (!u.alive || !u.mad) return; if (bo.keepMad) { bev('keepMad', { u: u.id }); return; } u.mad = false; u.side = 'inv'; u.san = Math.round(u.msan * 0.4); u.tg = null; conv--; U.forEach(x => { if (x.tg === u.id) x.tg = null; }); ev('cleanse', { u: u.id, by: by ? by.id : null, sn: u.san }); }
    function die(u, by, how) {
      if (!u.alive) return;
      if (bo.laststand && stood < bo.laststand && !u.stood && u.home === 'nest' && !u.core && !u.summon && !u.mad) { stood++; u.stood = 1; u.hp = Math.round(u.mhp * 0.5); bev('laststand', { u: u.id }); ev('heal', { u: u.id, by: null, amt: u.hp, hp: u.hp }); return; }
      u.how = how || 'kill';
      u.alive = false; u.cells.forEach(c => { if (occ[c] === u) occ[c] = null; }); ev('die', { u: u.id, by: by ? by.id : null, how: how || 'kill', cell: u.cell });
      U.forEach(x => { if (x.tg === u.id) x.tg = null; if (x.prov === u.id) x.prov = null; if (x.st.taunted && x.st.taunted.by === u.id) delete x.st.taunted; });
      if (u.core) { over = 'inv'; return; }
      if (by && by !== u) { by.stat.kills++; by.kc = (by.kc || 0) + 1; }
      const wasInv = u.home === 'inv' && !u.mad;
      if (wasInv && !u.summon && bo.firstblood && !firstBlood) { firstBlood = true; const al = U.filter(x => x.alive && x.home === 'nest' && !x.summon && !x.core); al.forEach(x => { x.atkBonus += bo.firstblood; }); bev('firstblood', { tgs: al.map(x => x.id) }); }
      if (wasInv && bo.corefeed && core.alive && core.hp < core.mhp) { bev('corefeed', { u: 'core' }); heal(core, core.mhp * bo.corefeed, core); }
      if (u.mad && u.home === 'inv' && bo.madburst) { const near = U.filter(x => x.alive && x.side === 'inv' && dist(x, u) <= 1); bev('madburst', { u: u.id, cell: u.cell, tgs: near.map(x => x.id) }); near.forEach(x => hurt(core, x, u.mhp * bo.madburst, { k: 'true', sk: 'madburst' })); }
      if ((roomAt(u.cell, 'digest') || (by && by.alive && by.home === 'nest' && roomAt(by.cell, 'digest'))) && u.home === 'inv' && gold < rl('digestCap')) { gold += rl('digest'); ev('roomfx', { room: 'digest', kind: 'gold', amt: rl('digest'), cell: u.cell }); }
      if (has(u, 'infected') && wasInv && !u.boss && !u.summon && how !== 'swallow') { const r = summon('infected', u.cell, 'nest', Math.max(0.6, u.mhp / 500), by, 1); if (r.length) ev('skillfx', { sk: 'spores', fx: 'rise', cells: [u.cell], tgs: [r[0].id] }); }
      if (u.home === 'nest' && !u.mad && !u.summon) {
        if (bo.eggsac) { bev('eggsac', { u: u.id, cell: u.cell }); summon('spawn', u.cell, 'nest', STARM[u.star], u, bo.eggsac); }
        if (u.asp === 'brood' && tier('brood') >= 1) { ev('synergy', { id: 'brood', fx: 'hatch', u: u.id, cell: u.cell }); summon('spawn', u.cell, 'nest', STARM[u.star], u, tier('brood')); }
        if (roomAt(u.cell, 'nursery')) { ev('roomfx', { room: 'nursery', kind: 'hatch', cell: u.cell }); summon('spawn', u.cell, 'nest', STARM[u.star], u, rl('nursery')); }
      }
      if (by && by.alive && by.home === 'nest' && !by.mad && wasInv) { const hg = tier('hunger'); if (hg >= 1 && (by.asp === 'hunger' || hg >= 2) && !by.summon && !u.summon) { heal(by, by.mhp * [0, 0.15, 0.2, 0.2][hg] * (fullRun && by.core ? 0.3 : 1), by); if (by.eat < (hg >= 3 ? 4 : 3)) { by.eat++; by.atkBonus += [0, 0.1, 0.15, 0.15][hg]; } ev('synergy', { id: 'hunger', fx: 'eat', u: by.id }); } }
    }
    // 피해: k = atk 평타 / skill 스킬 / dot 지속 / true 그대로 / san 정신만
    function hurt(src, tg, amt, o) {
      if (!tg.alive) return 0; o = o || {}; let d = 0, sd = 0, blk = 0;
      if (amt > 0) {
        d = amt; if (o.k === 'skill' || o.k === 'dot') d *= K.skillMul; if (o.k !== 'true' && o.k !== 'dot') { const df = has(tg, 'corrode') ? tg.df * (1 - tg.st.corrode.v) : tg.df; if (tg.role === 'tank') blk = Math.round(d * df / (100 + df)); d *= 100 / (100 + df); }
        if (has(tg, 'shield')) d *= 1 - tg.st.shield.v;
        if (fullRun && src && src.home === 'nest' && !src.mad && tg.side !== 'nest' && tier('abyss') && has(tg, 'wet')) d *= 1 + [0, 0.21, 0.42, 0.62][tier('abyss')];
        if (tg.reader && tg.msan) d *= 1 + tg.readHurt * (1 - tg.san / tg.msan);
        if (has(tg, 'marked')) d *= 1 + tg.st.marked.v; if (bo.giant && tg.home === 'inv' && (tg.boss || tg.elite)) d *= 1 + bo.giant;
        if (tg.home === 'nest' && !tg.mad) { const ab = tier('abyss'); if (fullRun) { if (ab) d *= 1 - (tg.asp === 'abyss' ? [0, 0.2, 0.28, 0.36][ab] : [0, 0, 0.08, 0.12][ab]); } else if (ab >= 3) d *= tg.asp === 'abyss' ? 0.55 : 0.75; else if (ab >= 2) d *= tg.asp === 'abyss' ? 0.6 : 0.8; else if (ab >= 1 && tg.asp === 'abyss') d *= 0.75; if (!tg.core && roomAt(tg.cell, 'bone')) d *= 1 - rl('bone'); }
        if (o.crit) d *= o.crit;
        d = Math.max(1, Math.round(d)); tg.hp -= d; tg.stat.taken += d; if (src) src.stat.dmg += d; gainMana(tg, K.manaHit);
      }
      if (o.san && tg.msan && tg.home === 'inv' && !tg.mad && !has(tg, 'immSan')) { sd = o.san; if (src && src.home === 'nest') sd *= 1 + [0, 0.3, 0.5, 0.8][tier('nebula')]; sd = Math.min(tg.san, Math.round(sd)); tg.san -= sd; if (src) src.stat.san += sd; if (ck && sd && tg.noMad) { const x = Math.round(sd * ck.bleed); tg.hp -= x; d += x; tg.stat.taken += x; if (src) src.stat.dmg += x; } }
      if (!d && !sd) return 0;
      if (src && tg.home === 'nest' && !tg.mad && !tg.core && src.alive && dist(tg, src) > K.aggro) tg.prov = src.id;
      ev('hit', { u: tg.id, by: src ? src.id : null, dmg: d, san: sd, hp: Math.max(0, tg.hp), sn: tg.san, m: Math.round(tg.mana), k: o.k || 'skill', sk: o.sk || null, crit: o.crit ? 1 : 0, blk: blk >= 8 ? blk : 0 });
      if (tg.hp <= 0) die(tg, src, o.how); else if (sd && tg.san <= 0) goMad(tg, src);
      if (src && tg.alive && src.home === 'nest' && !src.mad && src.asp === 'abyss' && tier('abyss') >= 1 && o.k === 'atk') setSt(tg, 'wet', fullRun ? 3 : 2, (fullRun ? [0, 0.08, 0.12, 0.15] : [0, 0.2, 0.4, 0.5])[tier('abyss')], src);
      if (bo.vamp && d && o.k === 'atk' && src && src.alive && src.home === 'nest' && !src.core && !src.summon && !src.mad && src.hp < src.mhp) heal(src, d * bo.vamp, src);
      // 공포 판정: 침입자가 둥지의 것에 처음 닿을 때 한 번 (맞았을 때, 또는 곁에서 쳤을 때)
      if (ck && o.sk !== 'check' && src) {
        if (tg.alive && tg.home === 'inv' && !tg.mad && !tg.chk && tg.will && src.home === 'nest' && !src.summon && !src.mad && (ck.contact == null || nContact < ck.contact)) { tg.chk = 1; nContact++; check(tg, src, 'contact'); }
        else if (src.alive && src.home === 'inv' && !src.mad && !src.chk && src.will && tg.home === 'nest' && !tg.summon && !tg.mad && o.k === 'atk' && src.range <= 1 && (ck.contact == null || nContact < ck.contact)) { src.chk = 1; nContact++; check(src, tg, 'contact'); }
      }
      return d;
    }
    // 의지만큼 주사위를 굴린다. face 이상이 성공. 성공 0 = 얼어붙음 (정신을 크게 잃고 잠깐 멎는다), 1 = 흔들림, 2 이상 = 버팀
    function check(tg, src, why, sk) {
      if (!tg.alive || tg.mad || tg.home !== 'inv' || !tg.will) return;
      const row = rc(tg.cell)[0], eye = rooms.some(r => { const rr = rc(r.cells[0])[0]; return !r.dead && r.id === 'eye' && (row === rr || row === rr - 1); }), n = clamp(tg.will + (bo.invWill || 0) - (tier('nebula') >= 2 ? 1 : 0) - (bo.dieless || 0) - (eye ? 1 : 0), 1, 6), face = bo.six ? 6 : 5, dice = [];
      for (let i = 0; i < n; i++) dice.push(1 + Math.floor(RN() * 6));
      let re = -1; if (tier('dusk') >= 2) { re = dice.findIndex(x => x >= face); if (re >= 0) dice[re] = 1 + Math.floor(RN() * 6); }
      const okN = dice.filter(x => x >= face).length, res = okN === 0 ? 'froze' : okN === 1 ? 'shaken' : 'held', e = { t: Math.round(t * 100) / 100, type: 'check', u: tg.id, by: src ? src.id : null, dice, face, need: 2, ok: okN, res, why, sk: sk || null, reroll: re, san: 0 };
      T.push(e); nCheck++; const s0 = tg.san, loss = tg.msan * (okN === 0 ? ck.heavy * (1 + (bo.dread || 0)) : okN === 1 ? ck.normal : 0);
      if (loss > 0) hurt(src, tg, 0, { san: loss, k: 'san', sk: 'check' }); e.san = s0 - tg.san;
      if (okN === 0 && tg.alive && !tg.mad && !tg.boss) setSt(tg, 'stun', ck.stun + (bo.awe || 0), 1, src);
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
      steal(u, l) { const fs = foes(u).filter(x => x.skill && x.skill !== 'read' && x.skill !== 'readall' && x.skill !== 'steal' && F[x.skill]); if (!fs.length) { const tg = pickTarget(u); if (tg) hurt(u, tg, pow(u) * 2.5, { k: 'skill', sk: 'steal' }); return; } const m = fs.reduce((a, b) => (b.tierV > a.tierV || (b.tierV === a.tierV && b.mhp > a.mhp) ? b : a)); ev('skillfx', { u: u.id, sk: 'steal', fx: 'mask', tgs: [m.id], stolen: m.skill }); F[m.skill](u, Math.min(3, l + 1)); },
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
        const tg = foes(u).filter(x => u.t2 || rc(x.cell)[0] >= NEST_ROW).sort((a, b) => rc(a.cell)[0] - rc(b.cell)[0] || a.cell - b.cell); ev('skillfx', { u: u.id, sk: 'tide', fx: 'wave', rows: u.t2 ? [0, 1, 2, 3, 4, 5] : [3, 4, 5], tgs: tg.map(x => x.id) });
        tg.forEach(x => { const p = rc(x.cell), up = inb(p[0] - 1, p[1]) ? idx(p[0] - 1, p[1]) : -1; if (up >= 0 && !occ[up] && !x.boss) { moveTo(x, up, 'push', 0.3); x.freeAt = Math.max(x.freeAt, t + 0.3); } hurt(u, x, P3(SK.tide.dmg, l), { k: 'skill', sk: 'tide' }); if (x.alive) { setSt(x, 'wet', 4, fullRun ? 0.25 : 0.4, u); setSt(x, 'stun', 0.6, 1, u); } });
      },
      eyeabove(u, l) { const tg = foes(u); ev('skillfx', { u: u.id, sk: 'eyeabove', fx: 'skyeye', tgs: tg.map(x => x.id) }); tg.forEach(x => { hurt(u, x, 30, { san: P3(SK.eyeabove.san, l), k: 'skill', sk: 'eyeabove' }); if (u.t2 && x.alive && x.side !== u.side) setSt(x, 'stun', 1, 1, u); }); },
      spawning(u, l) { const out = summon('spawn', u.cells[0] - COLS, u.side, 1 + 0.5 * (l - 1), u, nSum(P3(SK.spawning.n, l))).concat(u.t2 ? summon('brute', u.cells[0] - COLS, u.side, 1, u, 1) : []); ev('skillfx', { u: u.id, sk: 'spawning', fx: 'hatch', cells: out.map(x => x.cell), tgs: out.map(x => x.id) }); },
      chorus(u, l) {
        const tg = foes(u).filter(x => x.msan && !x.noMad).sort((a, b) => a.san / a.msan - b.san / b.msan || a.cell - b.cell).slice(0, u.t2 ? 5 : 3), mads = pals(u).filter(x => x.mad);
        ev('skillfx', { u: u.id, sk: 'chorus', fx: 'chorus', tgs: tg.map(x => x.id), pals: mads.map(x => x.id) });
        if (!tg.length) foes(u).slice(0, 3).forEach(x => hurt(u, x, 120, { k: 'skill', sk: 'chorus' }));
        tg.forEach(x => hurt(u, x, sc ? 40 * l : 0, { san: P3(SK.chorus.san, l), k: sc ? 'skill' : 'san', sk: 'chorus' })); pals(u).filter(x => x.mad).forEach(x => { heal(x, 100, u); setSt(x, 'atkup', 5, 0.3, u); });
      },
      feast(u, l) { const rr = u.t2 ? 3 : 2, tg = foes(u).filter(x => dist(x, u) <= rr); let sum = 0; ev('skillfx', { u: u.id, sk: 'feast', fx: 'feast', cells: u.cells, tgs: tg.map(x => x.id), r: rr }); tg.forEach(x => { sum += hurt(u, x, pow(u) * P3(SK.feast.mul, l) * (fullRun ? 0.62 : 1), { k: 'skill', sk: 'feast' }); }); heal(u, sum * 0.5, u); },
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
        const live = bo.noErase ? [] : rooms.filter(r => !r.dead);
        if (u.side === 'inv' && live.length) { const cnt = r => U.filter(x => x.alive && x.side !== u.side && r.cells.includes(x.cell)).length, r = live.reduce((a, b) => (cnt(b) > cnt(a) ? b : a)); r.dead = true; ev('skillfx', { u: u.id, sk: 'read', fx: 'read', cells: r.cells, room: r.i }); ev('roomfx', { room: r.id, i: r.i, kind: 'erase', cells: r.cells }); foes(u).filter(x => r.cells.includes(x.cell)).forEach(x => hurt(u, x, 60, { k: 'skill', sk: 'read' })); for (let k = 0; k < (bo.readPlus || 0); k++) { const r2 = rooms.filter(q => !q.dead)[0]; if (r2) { r2.dead = true; ev('roomfx', { room: r2.id, i: r2.i, kind: 'erase', cells: r2.cells }); } } }
        else { const tg = foes(u).filter(x => dist(x, u) <= 2); ev('skillfx', { u: u.id, sk: 'read', fx: 'readblast', cells: u.cells, tgs: tg.map(x => x.id), r: 2 }); tg.forEach(x => { hurt(u, x, pow(u) * 1.2, { k: 'skill', sk: 'read' }); if (x.alive && !x.core) setSt(x, 'silenced', 3, 1, u); }); }
      },
      // ── 새 권속 여덟의 스킬
      gorge(u, l) { const tg = pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'gorge', fx: 'bigbite', tgs: [tg.id] }); const d = hurt(u, tg, pow(u) * P3(SK.gorge.mul, l), { k: 'skill', sk: 'gorge' }); setSt(u, 'shield', 3, 0.4, u); heal(u, d, u); },
      meteor(u, l) { const fs = foes(u); if (!fs.length) return; let best = fs[0], bn = -1; for (const x of fs) { const n = fs.filter(y => dist(y, x) <= 1).length; if (n > bn) { bn = n; best = x; } } const c = best.cell, hit = fs.filter(x => dcell(x, c) <= 1), cells = []; for (let i = 0; i < N; i++) if (cheb(i, c) <= 1) cells.push(i); ev('skillfx', { u: u.id, sk: 'meteor', fx: 'meteor', from: u.cell, cell: c, cells, tgs: hit.map(x => x.id), r: 1 }); hit.forEach(x => hurt(u, x, P3(SK.meteor.dmg, l), { k: 'skill', san: P3(SK.meteor.san, l), sk: 'meteor' })); },
      toll(u, l) { const d = P3(SK.toll.dur, l), tg = foes(u).filter(x => dist(x, u) <= 2); setSt(u, 'shield', d, 0.5, u); ev('skillfx', { u: u.id, sk: 'toll', fx: 'toll', cells: u.cells, tgs: tg.map(x => x.id), r: 2, dur: d }); tg.forEach(x => { hurt(u, x, 20, { san: P3(SK.toll.san, l), k: 'skill', sk: 'toll' }); if (x.alive && !x.boss && !x.core && x.side !== u.side) setSt(x, 'taunted', d, 1, u); }); },
      inkcloud(u, l) {
        const fs = foes(u); if (!fs.length) return; const fill = x => (x.mmana && x.skill ? x.mana / x.mmana : -1), best = fs.reduce((a, b) => (fill(b) > fill(a) ? b : a)), c = best.cell, hit = fs.filter(x => dcell(x, c) <= 1), cells = []; for (let i = 0; i < N; i++) if (cheb(i, c) <= 1) cells.push(i);
        ev('skillfx', { u: u.id, sk: 'inkcloud', fx: 'ink', from: u.cell, cell: c, cells, tgs: hit.map(x => x.id), r: 1 });
        hit.forEach(x => { hurt(u, x, P3(SK.inkcloud.dmg, l), { k: 'skill', sk: 'inkcloud' }); if (x.alive) { if (!x.core) setSt(x, 'silenced', P3(SK.inkcloud.sil, l), 1, u); setSt(x, 'wet', 4, 0.3, u); } });
      },
      reap(u, l, depth) {
        const fs = foes(u).filter(x => !has(x, 'stealth') && !x.core); if (!fs.length) { const tg0 = pickTarget(u); if (tg0) { ev('skillfx', { u: u.id, sk: 'reap', fx: 'reap', tgs: [tg0.id] }); hurt(u, tg0, pow(u) * P3(SK.reap.mul, l), { k: 'skill', sk: 'reap' }); } return; }
        const tg = fs.reduce((a, b) => (b.hp / b.mhp < a.hp / a.mhp ? b : a));
        if (dist(u, tg) > 1) { const c = emptyNear(tg.cell, i => cheb(i, tg.cell) <= 1); if (c >= 0) { moveTo(u, c, 'leap', 0.25); u.freeAt = t + 0.3; } }
        ev('skillfx', { u: u.id, sk: 'reap', fx: 'reap', tgs: [tg.id] });
        if (dist(u, tg) <= 1) { if (!tg.boss && tg.hp / tg.mhp <= P3(SK.reap.cut, l) / 100) { u.stat.dmg += tg.hp; tg.hp = 0; die(tg, u, 'reap'); } else hurt(u, tg, pow(u) * P3(SK.reap.mul, l), { k: 'skill', sk: 'reap' }); }
        u.tg = tg.alive ? tg.id : null; if (!tg.alive && (depth || 0) < 2 && foes(u).length) { const dp = (depth || 0) + 1; pend.push({ t: t + 0.5, u, fn: () => { ev('cast', { u: u.id, sk: 'reap', dur: 0.1, again: 1 }); F.reap(u, l, dp); } }); }
      },
      sermon(u, l) { const out = summon('cultist', u.cell, u.side, STARM[u.star], u, nSum(P3(SK.sermon.n, l))), mads = pals(u).filter(x => x.mad); ev('skillfx', { u: u.id, sk: 'sermon', fx: 'sermon', cells: out.map(x => x.cell), tgs: out.map(x => x.id), pals: mads.map(x => x.id) }); mads.forEach(x => heal(x, P3(SK.sermon.heal, l), u)); },
      skyrift(u, l) { const tg = foes(u), cut = P3(SK.skyrift.cut, l) / 100; ev('skillfx', { u: u.id, sk: 'skyrift', fx: 'rift', tgs: tg.map(x => x.id) }); tg.forEach(x => { hurt(u, x, P3(SK.skyrift.dmg, l), { k: 'skill', san: P3(SK.skyrift.san, l), sk: 'skyrift' }); if (x.alive && !x.mad && x.msan && !x.noMad && x.home === 'inv' && !has(x, 'immSan') && x.san / x.msan <= cut) { x.san = 0; ev('sanity', { u: x.id, sn: 0 }); goMad(x, u); } }); },
      rebirth(u, l) {
        const dead = U.filter(x => !x.alive && x.home === u.home && x.side === u.side && !x.summon && !x.core && !x.reborn && x !== u), c = emptyNear(u.cell);
        if (dead.length && c >= 0) {
          const x = dead.reduce((a, b) => (b.tierV * 10 + b.star > a.tierV * 10 + a.star ? b : a)); x.alive = true; x.reborn = 1; x.hp = Math.round(x.mhp * P3(SK.rebirth.hp, l) / 100); x.cell = c; x.cells = [c]; occ[c] = x; x.st = {}; x.mana = 0; x.tg = null; x.prov = null; x.engage = true; x.nextAtk = t + 0.6; x.freeAt = t + 0.4;
          ev('skillfx', { u: u.id, sk: 'rebirth', fx: 'rebirth', cells: [c], tgs: [x.id] }); ev('spawn', { u: x.id, kind: x.kind, side: x.side, cell: c, by: u.id, name: x.name, mhp: x.mhp, hp: x.hp, role: x.role, range: x.range, star: x.star, revive: 1 });
        } else { const out = summon('brute', u.cell, u.side, STARM[u.star], u, 1); ev('skillfx', { u: u.id, sk: 'rebirth', fx: 'hatch', cells: out.map(y => y.cell), tgs: out.map(y => y.id) }); }
      },
      // ── 2막과 3막 침입자의 스킬
      bolt(u, l) { const tg = pickTarget(u); if (!tg) return; const from = closest(u, tg), d = dirTo(from, tcell(u, tg)), cells = lineFrom(from, d[0], d[1], 6), hit = foes(u).filter(x => x === tg || x.cells.some(c => cells.includes(c))); ev('skillfx', { u: u.id, sk: 'bolt', fx: 'pierce', from, cells, tgs: hit.map(x => x.id) }); hit.forEach(x => hurt(u, x, pow(u) * P3(SK.bolt.mul, l), { k: 'skill', sk: 'bolt' })); },
      rally(u, l) { const al = pals(u); ev('skillfx', { u: u.id, sk: 'rally', fx: 'banner', cells: u.cells, tgs: al.map(x => x.id), dur: 3 }); al.forEach(x => { if (!has(x, 'shield')) setSt(x, 'shield', 3, 0.3, u); if (x.msan && !x.mad && x.home === 'inv') { x.san = Math.min(x.msan, x.san + 20); ev('sanity', { u: x.id, sn: x.san }); } }); },
      mark(u, l) { const fs = foes(u).filter(x => !x.core && !has(x, 'stealth')), val = x => x.tierV * 10 + x.star * 3 + x.mhp / 10000, tg = fs.length ? fs.reduce((a, b) => (val(b) > val(a) ? b : a)) : pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'mark', fx: 'mark', from: u.cell, tgs: [tg.id] }); setSt(tg, 'marked', 6, 0.3, u); hurt(u, tg, pow(u) * 1.5, { k: 'skill', sk: 'mark' }); },
      smite(u, l) { const tg = pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'smite', fx: 'smite', tgs: [tg.id] }); hurt(u, tg, pow(u) * 2.5 * (tg.summon || tg.mad ? 2 : 1), { k: 'skill', sk: 'smite' }); },
      exorcise(u, l) {
        const lost = U.filter(x => x.alive && x.mad && x.home === u.home && x.side !== u.side).sort((a, b) => b.tierV - a.tierV || a.cell - b.cell).slice(0, 2), sm = foes(u).filter(x => x.summon);
        ev('skillfx', { u: u.id, sk: 'exorcise', fx: 'exorcise', cells: u.cells, tgs: lost.concat(sm).map(x => x.id) }); lost.forEach(x => cleanse(x, u)); sm.forEach(x => hurt(u, x, 90, { k: 'skill', sk: 'exorcise' }));
        if (!lost.length && !sm.length) { const tg = pickTarget(u); if (tg) hurt(u, tg, pow(u) * 2, { k: 'skill', sk: 'exorcise' }); }
      },
      // ── 조사자 여섯의 스킬
      c_note(u, l) { const fs = foes(u).filter(x => !x.core && !has(x, 'stealth')), val = x => x.tierV * 10 + x.star * 3 + x.mhp / 10000, tg = fs.length ? fs.reduce((a, b) => (val(b) > val(a) ? b : a)) : pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'c_note', fx: 'seal', from: u.cell, tgs: [tg.id] }); if (!tg.core) setSt(tg, 'silenced', 5, 1, u); setSt(tg, 'marked', 6, 0.3, u); hurt(u, tg, pow(u) * 1.5, { k: 'skill', sk: 'c_note' }); },
      c_oath(u, l) { setSt(u, 'shield', 3, 0.6, u); const tg = foes(u).filter(x => dist(x, u) <= 1 && !x.core && !x.boss); tg.forEach(x => setSt(x, 'taunted', 2.5, 1, u)); ev('skillfx', { u: u.id, sk: 'c_oath', fx: 'shieldwall', cells: u.cells, tgs: tg.map(x => x.id), pals: [], dur: 3 }); heal(u, u.mhp * 0.2, u); },
      c_hymn(u, l) { const al = pals(u), lost = U.filter(x => x.alive && x.mad && x.home === u.home && x.side !== u.side).sort((a, b) => b.tierV - a.tierV || a.cell - b.cell)[0]; ev('skillfx', { u: u.id, sk: 'c_hymn', fx: 'light', cells: u.cells, tgs: al.map(x => x.id), r: 6 }); al.forEach(x => { heal(x, 120 * (u.atk / 30), u); if (x.msan && !x.mad && x.home === 'inv') { x.san = Math.min(x.msan, x.san + 30); ev('sanity', { u: x.id, sn: x.san }); } }); if (lost) cleanse(lost, u); },
      c_snare(u, l) { const fs = foes(u).filter(x => !x.core && !has(x, 'stealth')), val = x => x.tierV * 10 + x.star * 3 + x.mhp / 10000, tg = fs.length ? fs.reduce((a, b) => (val(b) > val(a) ? b : a)) : pickTarget(u); if (!tg) return; ev('skillfx', { u: u.id, sk: 'c_snare', fx: 'snare', from: u.cell, tgs: [tg.id] }); if (!tg.core) setSt(tg, 'stun', 2, 1, u); hurt(u, tg, pow(u) * 1.5, { k: 'skill', sk: 'c_snare' }); if (tg.alive) setSt(tg, 'bleed', 4, pow(u) * 0.4, u); },
      c_fire(u, l) { const fs = foes(u); if (!fs.length) return; let best = fs[0], bn = -1; for (const x of fs) { const n = fs.filter(y => dist(y, x) <= 1).length; if (n > bn) { bn = n; best = x; } } const c = best.cell, cells = []; for (let i = 0; i < N; i++) if (cheb(i, c) <= 1) cells.push(i); zones.push({ kind: 'burn', cells, until: t + 5, side: u.side, by: u.id, dps: 25 * (u.atk / 50) }); ev('skillfx', { u: u.id, sk: 'c_fire', fx: 'burnzone', from: u.cell, cells, dur: 5 }); },
      c_lamp(u, l) { const al = pals(u).filter(x => dist(x, u) <= 2); ev('skillfx', { u: u.id, sk: 'c_lamp', fx: 'sanctum', cells: u.cells, tgs: al.map(x => x.id), r: 2, dur: 4 }); al.forEach(x => setSt(x, 'immSan', 4, 1, u)); },
      flask(u, l) { const fs = foes(u); if (!fs.length) return; let best = fs[0], bn = -1; for (const x of fs) { const n = fs.filter(y => dist(y, x) <= 1).length; if (n > bn) { bn = n; best = x; } } const c = best.cell, hit = fs.filter(x => dcell(x, c) <= 1), cells = []; for (let i = 0; i < N; i++) if (cheb(i, c) <= 1) cells.push(i); ev('skillfx', { u: u.id, sk: 'flask', fx: 'flask', from: u.cell, cell: c, cells, tgs: hit.map(x => x.id), r: 1 }); hit.forEach(x => { hurt(u, x, 90 * (u.atk / 45), { k: 'skill', sk: 'flask' }); if (x.alive) setSt(x, 'corrode', 5, 0.5, u); }); },
      readall(u, l) {
        const cnt = r => U.filter(x => x.alive && x.side !== u.side && r.cells.includes(x.cell)).length, live = (bo.noErase || u.side !== 'inv' ? [] : rooms.filter(r => !r.dead)).sort((a, b) => cnt(b) - cnt(a) || a.i - b.i).slice(0, 2 + (bo.readPlus || 0));
        live.forEach(r => { r.dead = true; ev('skillfx', { u: u.id, sk: 'readall', fx: 'read', cells: r.cells, room: r.i }); ev('roomfx', { room: r.id, i: r.i, kind: 'erase', cells: r.cells }); foes(u).filter(x => r.cells.includes(x.cell)).forEach(x => hurt(u, x, 60, { k: 'skill', sk: 'readall' })); });
        const tg = foes(u).filter(x => dist(x, u) <= 2); ev('skillfx', { u: u.id, sk: 'readall', fx: 'readblast', cells: u.cells, tgs: tg.map(x => x.id), r: 2 }); tg.forEach(x => { hurt(u, x, pow(u) * 1.2, { k: 'skill', sk: 'readall' }); if (x.alive && !x.core) setSt(x, 'silenced', 3, 1, u); });
        if (u.alive) { const out = summon('possessed', u.cell, u.side, Math.min(2.5, u.atk / 95), u, 2); if (out.length) ev('skillfx', { u: u.id, sk: 'readall', fx: 'possess', cells: out.map(x => x.cell), tgs: out.map(x => x.id) }); }
      },
    };
    // ───── 세우기 ─────
    const lv = S.level || 3, cd = K.core, form = FORM[S.form] ? S.form : 'drop';
    const core = add({ id: 'core', side: 'nest', kind: 'core', core: true, cell: CORE[0], cells: CORE.slice(), def: { name: FORM[form].name, hp: sc ? cd.hp * sc.hp : cd.hp * (1 + cd.lvHp * (lv - 3)) * (1 + cd.rdHp * (round - 1)), atk: sc ? cd.atk * sc.atk : cd.atk * (1 + 0.15 * (round - 1)), as: cd.as, range: cd.range + ((sc && sc.range) || 0), df: cd.df, mana: cd.mana - ((sc && sc.manaCut) || 0), skill: (sc && sc.skill && SK[sc.skill]) ? sc.skill : FORM[form].skill, asp: form === 'drop' ? null : form } });
    core.form = form; core.engage = true; if (S.noCore) { core.alive = false; core.cells.forEach(c => { if (occ[c] === core) occ[c] = null; }); } core.t2 = !!(sc && sc.t2);
    (S.nest || []).forEach(n => { const d = KIN[n.kind]; if (!d || occ[n.cell]) return; const u = add({ id: 'k' + n.uid, side: 'nest', kind: n.kind, star: n.star, cell: n.cell, def: d, mul: STARM[n.star || 1] }); if (n.hp != null) u.hp = Math.max(1, Math.min(u.mhp, Math.round(n.hp))); if (n.leap) u.leap = true; });
    const sl = S.scale || null, rm = sl ? sl.atk : K.roundAtk[round - 1] || 1, rh = sl ? sl.hp : K.roundHp[round - 1] || 1, sm = (sl ? sl.san : K.roundSan[round - 1] || 1) * (1 - (bo.sanfrenzy || 0));
    (S.inv || []).forEach(n => { const d = INV[n.kind]; if (!d || occ[n.cell]) return; add({ id: 'e' + (++eid), side: 'inv', kind: n.kind, cell: n.cell, will: n.will, cast: n.cast, def: n.poss ? Object.assign({}, d, { name: '홀린 ' + d.name, san: 0, noMad: true }) : d, mul: rm * (n.mul || 1), hmul: rh * (n.mul || 1), smul: sm }); const u = U[U.length - 1]; u.src = S.inv.indexOf(n); if (n.noLeap) u.leap = false; if (n.hp != null) u.hp = Math.max(1, Math.min(u.mhp, Math.round(n.hp))); if (n.san != null && u.msan) u.san = Math.max(0, Math.min(u.msan, Math.round(n.san))); });
    // 시너지와 방: 싸움이 시작될 때 붙는 것
    SYN_IDS.forEach(id => { if (tier(id)) ev('synergy', { id, tier: tier(id), fx: 'on' }); });
    U.forEach(u => {
      if (u.home !== 'nest' || u.core) return;
      const g = tier('guard'); if (g) { const b = u.cls === 'guard' ? (g >= 2 ? 0.6 : 0.3) : g >= 2 ? 0.3 : 0; if (b) { u.mhp = Math.round(u.mhp * (1 + b)); u.hp = u.mhp; } }
      const c = tier('caller'); if (c && u.cls === 'caller' && u.mmana) u.mana = u.mmana * (c >= 2 ? 0.6 : 0.4);
      const h = tier('hunter'); if (u.cls === 'hunter') { if (h >= 2) u.firstCrit = 2.5; if (roomAt(u.cell, 'shade')) { u.firstCrit = rl('shade'); ev('roomfx', { room: 'shade', kind: 'on', u: u.id, cell: u.cell }); } if (h >= 1) u.leap = true; }
    });
    // 오래된 것: 싸움이 시작될 때 붙는 것
    U.forEach(u => { if (u.home !== 'nest' || u.core) return; const hm = 1 + (bo.thick || 0) - (bo.kinWeak || 0); if (hm !== 1) { u.mhp = Math.round(u.mhp * hm); u.hp = u.mhp; } if (bo.sharp) u.atk *= 1 + bo.sharp; if (bo.firstfree && u.mmana) u.mana = Math.max(u.mana, u.mmana * Math.min(1, bo.firstfree)); });
    if (S.keep) U.forEach(u => { if (u.src == null || u.home !== 'inv') return; const n = S.inv[u.src]; (n.st || []).forEach(x => setSt(u, x.n, x.dur, x.v, null)); if (n.mad) goMad(u, null); });
    if (S.keep) U.forEach(u => { u.hp0 = u.hp; u.sn0 = u.san; u.mad0 = u.mad; });
    const init = U.filter(u => !(S.noCore && u.core)).map(u => ({ id: u.id, side: u.side, kind: u.kind, art: u.art, will: u.will, cast: u.cast, star: u.star, cell: u.cell, cells: u.cells.slice(), name: u.name, mhp: u.mhp, msan: u.msan, mmana: u.mmana, mana: Math.round(u.mana), range: u.range, role: u.role, skill: u.skill, boss: u.boss, elite: u.elite, core: u.core, form: u.form || null, asp: u.asp, cls: u.cls }));
    Object.keys(boBy).forEach(id => { if (bo[id]) bev(id, { fx: 'on' }); });
    if (bo.hatchstart) summon('spawn', core.cells[0] - COLS, 'nest', 1 + 0.1 * (round - 1), core, bo.hatchstart);
    if (S.zealots) summon('zealot', core.cells[0] - COLS, 'nest', 1 + 0.1 * (round - 1), core, S.zealots);
    if (bo.wetall) U.forEach(u => { if (u.side === 'inv') setSt(u, 'wet', 6, bo.wetall, null); });
    if (bo.stunstart) U.forEach(u => { if (u.side === 'inv' && !u.boss) setSt(u, 'stun', bo.stunstart, 1, null); });
    for (let k = 0; k < (bo.eraseRoom || 0); k++) { const l = rooms.filter(r => !r.dead); if (!l.length) break; const r = l[Math.floor(RN() * l.length)]; r.dead = true; ev('roomfx', { room: r.id, i: r.i, kind: 'erase', cells: r.cells }); }
    // 뛰어드는 것들: 0.6초에 적의 뒷줄 곁으로
    pend.push({ t: K.pace.leapAt, fn: () => { U.filter(u => u.alive && u.leap && !u.core).forEach(u => { const fs = foes(u).filter(x => !x.core); if (!fs.length) return; const far = u.side === 'nest' ? (a, b) => rc(a.cell)[0] - rc(b.cell)[0] : (a, b) => rc(b.cell)[0] - rc(a.cell)[0], back = fs.slice().sort((a, b) => (b.range > 1) - (a.range > 1) || far(a, b) || a.hp - b.hp)[0]; const c = emptyNear(back.cell, i => cheb(i, back.cell) <= 1); if (c >= 0) { moveTo(u, c, 'leap', K.pace.leapDur); u.freeAt = t + K.pace.leapDur + 0.1; u.nextAtk = t + K.pace.leapDur + 0.25; u.tg = back.id; u.reT = t + 2; u.engage = true; } }); } });

    function act(u) {
      if (has(u, 'stun') || t < u.freeAt) return;
      const tg = pickTarget(u); if (!tg) return;
      const d = dist(u, tg);
      if (u.skill && u.mmana && u.mana >= u.mmana && !has(u, 'silenced') && (d <= Math.max(u.range, 4) || u.core || FAR[u.skill])) {
        u.mana = 0; u.stat.casts++; ev('cast', { u: u.id, sk: u.skill, tg: tg.id, dur: K.castWind }); u.freeAt = t + K.castWind + 0.15; u.nextAtk = Math.max(u.nextAtk, t + K.castWind + 0.2);
        const sk = u.skill, l = u.core ? coreLv : u.star; pend.push({ t: t + K.castWind, u, fn: () => { if (has(u, 'stun')) return; F[sk](u, l); if (ck && u.alive && u.home === 'nest' && !u.mad && (u.core || u.tierV >= 5) && (ck.moment == null || nMoment < ck.moment)) { nMoment++; const c = U.filter(x => x.alive && x.home === 'inv' && !x.mad && x.will && x.msan).sort((a, b) => b.tierV - a.tierV || a.san / a.msan - b.san / b.msan || a.cell - b.cell)[0]; if (c) check(c, u, 'skill', sk); } } }); return;
      }
      if (d <= u.range) {
        if (t < u.nextAtk) return;
        const slow = Math.max(has(u, 'slow') ? u.st.slow.v : 0, has(u, 'wet') ? u.st.wet.v : 0); u.nextAtk = t + 1 / (u.as * (1 - slow));
        let crit = 0; if (u.firstCrit) { crit = u.firstCrit; u.firstCrit = 0; }
        ev('attack', { u: u.id, tg: tg.id, r: u.range > 1 ? 1 : 0, from: closest(u, tg), to: tcell(u, tg) }); gainMana(u, K.manaAtk);
        hurt(u, tg, pow(u), { k: 'atk', san: u.sanAtk, crit }); return;
      }
      if (u.core) return;
      const go = u.engage || u.mad || t >= T_ENG || d <= K.aggro + (u.range - 1) || (u.prov && tg.id === u.prov);
      if (go) stepToward(u, tg);
    }
    // ───── 돌리기 ─────
    const maxStep = Math.round(T_END / TICK);
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
        rooms.forEach(r => { if (r.dead) return; if (r.id === 'pool' || r.id === 'spore') U.forEach(u => { if (!u.alive || u.side === 'nest' || !r.cells.includes(u.cell)) return; if (r.id === 'pool') { if (!has(u, 'wet')) ev('roomfx', { room: 'pool', kind: 'wet', u: u.id, cell: u.cell }); setSt(u, 'wet', 1, rl('pool'), null); } else if (!has(u, 'infected')) { ev('roomfx', { room: 'spore', kind: 'infect', u: u.id, cell: u.cell }); setSt(u, 'infected', 8, rl('spore'), core); } }); });
      }
      if (step % 10 === 0 && step > 0) {
        rooms.forEach(r => { if (r.dead || r.id !== 'eye') return; const row = rc(r.cells[0])[0], tg = U.filter(u => u.alive && u.side === 'inv' && u.msan && rc(u.cell)[0] === row); if (tg.length) { ev('roomfx', { room: 'eye', kind: 'gaze', cells: r.cells, tgs: tg.map(x => x.id) }); tg.forEach(x => hurt(core, x, 0, { san: rl('eye'), k: 'san', sk: 'eye' })); } });
        if (Math.abs(t - T_FR) < 1e-6) ev('frenzy', {});
        if (t >= T_SD) { if (Math.abs(t - T_SD) < 1e-6) ev('sudden', {}); const f = 0.03 * (1 + (t - T_SD) / 4); U.slice().forEach(u => { if (u.alive) hurt(null, u, u.mhp * f * (u.core ? 0.5 : 1), { k: 'true', sk: 'sudden' }); }); }
      }
      if (over) break;
      for (const u of U.slice()) { if (!u.alive || over) continue; act(u); }
      if (!over && !U.some(u => u.alive && u.side === 'inv')) over = 'nest';
      if (!over && S.noCore && !U.some(u => u.alive && u.side === 'nest')) over = 'inv';
    }
    if (!over) { const fr = side => { const l = U.filter(u => u.home === side && !u.summon && !(S.noCore && u.core)); return l.reduce((a, u) => a + (u.alive && u.side === side ? u.hp : 0), 0) / Math.max(1, l.reduce((a, u) => a + u.mhp, 0)); }; over = fr('nest') > fr('inv') ? 'nest' : 'inv'; }
    const survivors = U.filter(u => u.alive && u.side === 'inv').length;
    ev('win', { side: over, survivors });
    T.sort((a, b) => a.t - b.t);
    if (S.keep) init.forEach(x => { const u = byId(x.id); x.hp = u.hp0; x.sn = u.sn0; x.mad = u.mad0; });
    const OUT = { seed: S.seed, round, form, syn, timeline: T, result: over === 'nest' ? 'win' : 'loss', winner: over, time: R1(t), units: init, rooms: rooms.map(r => ({ id: r.id, cells: r.cells, erased: r.dead })), gold, survivors, converted: U.filter(u => u.mad).length, checks: nCheck, lostKin: U.filter(u => u.home === 'nest' && !u.summon && !u.core && !u.alive).length, madLeft: U.filter(u => u.alive && u.mad && !u.cast && !u.summon).length,
      eliteDown: U.filter(u => u.home === 'inv' && (u.elite || u.boss || u.cast) && (u.mad || u.how === 'swallow')).length, cast: U.filter(u => u.cast).map(u => ({ id: u.cast, alive: u.alive, mad: u.mad, how: u.alive ? null : u.how || 'kill' })), coreHp: Math.max(0, core.hp), coreMhp: core.mhp,
      breakdown: U.map(u => ({ id: u.id, kind: u.kind, name: u.name, side: u.home, star: u.star, summon: u.summon, alive: u.alive, mad: u.mad, dmg: u.stat.dmg, san: u.stat.san, heal: u.stat.heal, kills: u.stat.kills, casts: u.stat.casts, taken: u.stat.taken, conv: u.stat.conv })) };
    if (S.keep) OUT.final = U.filter(u => !(S.noCore && u.core)).map(u => ({ id: u.id, kind: u.kind, home: u.home, side: u.side, src: u.src != null ? u.src : null, uid: u.home === 'nest' && !u.summon && !u.core ? +u.id.slice(1) : null, core: u.core, summon: u.summon, hp: Math.max(0, Math.round(u.hp)), mhp: u.mhp, san: Math.round(u.san), msan: u.msan, alive: u.alive, mad: u.mad }));
    return OUT;
  }

  // ───────── 온전한 판의 표 ─────────
  // 막마다: 라운드 1~4 는 둘 가운데 하나가 온다 (f 앞줄, m 가운데, b 뒷줄). boss 는 막의 끝. elite 는 셋째 라운드에서 정예를 고르면 더 오는 것. more 는 공포가 차면 무리마다 더 오는 것
  const ACTS = [
    { name: '마을에서 온 것들', more: 'archer', rounds: [
      [{ name: '민병 무리', f: ['militia', 'militia', 'militia', 'militia'], m: ['hound', 'hound'] }, { name: '횃불 든 무리', f: ['militia', 'torch', 'torch', 'militia'], m: ['hound', 'hound'] }],
      [{ name: '사냥꾼들', f: ['militia', 'militia', 'militia'], m: ['hound', 'hound'], b: ['archer'] }, { name: '마을 자경단', f: ['militia', 'torch', 'militia'], m: ['hound'], b: ['archer', 'archer'] }],
      [{ name: '모험가 일행', f: ['knight', 'militia'], m: ['rogue'], b: ['priest', 'archer'] }, { name: '용병단', f: ['knight', 'militia', 'torch'], b: ['mage', 'archer'] }],
      [{ name: '토벌대', f: ['knight', 'militia', 'militia'], m: ['rogue'], b: ['mage', 'priest'] }, { name: '순례단', f: ['knight', 'knight', 'torch'], b: ['priest', 'bard', 'archer'] }],
    ], boss: { name: '책을 쫓는 자', f: ['knight', 'militia', 'militia'], m: ['seeker'], b: ['priest', 'archer'] }, elite: { f: ['inquis'] } },
    { name: '교단이 보낸 것들', more: 'crossbow', rounds: [
      [{ name: '교단 척후', f: ['knight', 'militia', 'militia'], m: ['tracker', 'hound'], b: ['crossbow', 'archer'] }, { name: '석궁대', f: ['knight', 'knight', 'militia'], m: ['hound'], b: ['crossbow', 'crossbow', 'banner'] }],
      [{ name: '불 지르는 자들', f: ['knight', 'torch', 'torch', 'militia'], b: ['mage', 'alchemist', 'bard'] }, { name: '순찰대', f: ['knight', 'templar', 'militia'], m: ['rogue'], b: ['priest', 'crossbow', 'archer'] }],
      [{ name: '구마단', f: ['knight', 'templar', 'knight'], m: ['rogue'], b: ['exorcist', 'priest', 'mage'] }, { name: '추적대', f: ['templar', 'knight', 'militia'], m: ['tracker', 'tracker'], b: ['crossbow', 'banner'] }],
      [{ name: '심문단', f: ['inquis', 'knight', 'templar', 'knight'], m: ['rogue'], b: ['priest', 'alchemist', 'crossbow'] }, { name: '성가 행렬', f: ['paladin', 'knight', 'templar'], m: ['tracker'], b: ['bard', 'banner', 'priest', 'mage'] }],
    ], boss: { name: '성기사단', f: ['paladin', 'inquis', 'paladin', 'inquis'], m: ['templar'], b: ['priest', 'banner', 'exorcist'] }, elite: { f: ['paladin'], b: ['exorcist'] } },
    { name: '책을 쫓는 자', more: 'templar', rounds: [
      [{ name: '교단 본대', f: ['paladin', 'knight', 'templar', 'knight'], m: ['rogue'], b: ['priest', 'crossbow', 'mage'] }, { name: '불의 행렬', f: ['templar', 'torch', 'torch', 'knight'], b: ['mage', 'mage', 'alchemist', 'bard'] }],
      [{ name: '사냥 나온 기사단', f: ['paladin', 'templar', 'templar', 'knight'], m: ['tracker', 'tracker'], b: ['crossbow', 'banner'] }, { name: '구마 행렬', f: ['paladin', 'knight', 'inquis'], m: ['rogue'], b: ['exorcist', 'exorcist', 'priest', 'bard'] }],
      [{ name: '심문 법정', f: ['inquis', 'paladin', 'inquis', 'templar'], m: ['rogue'], b: ['priest', 'alchemist', 'crossbow', 'banner'] }, { name: '성전 선봉', f: ['paladin', 'templar', 'paladin', 'templar'], m: ['tracker'], b: ['bard', 'exorcist', 'mage', 'crossbow'] }],
      [{ name: '마지막 토벌대', f: ['paladin', 'inquis', 'templar', 'paladin'], m: ['rogue', 'tracker'], b: ['exorcist', 'priest', 'alchemist', 'crossbow'] }, { name: '책을 지키는 자들', f: ['paladin', 'inquis', 'inquis', 'templar'], m: ['tracker', 'rogue'], b: ['bard', 'banner', 'mage', 'exorcist'] }],
    ], boss: { name: '책을 쫓는 자 · 다 읽은 것', f: ['paladin', 'inquis', 'templar', 'knight'], m: ['seekerm'], b: ['exorcist', 'bard', 'alchemist', 'crossbow'] }, elite: { f: ['paladin', 'inquis'], b: ['alchemist'] } },
  ];
  // 본체가 깨어나는 모습. names = 1~2단계 / 3단계의 이름, t2 = 3단계가 스킬에 더하는 것
  const EVO = {
    abyss: { part: '촉수', names: ['바다 밑에서 온 것', '바다를 끌고 온 것'], t2: '해일이 판 전체에' },
    nebula: { part: '눈', names: ['별에서 내려다보는 것', '감지 않는 눈'], t2: '모든 적 기절 1초' },
    brood: { part: '알 어미', names: ['새끼 떼의 어미', '굴을 메운 어미'], t2: '큰 새끼 1 더' },
    dusk: { part: '두건 쓴 합창', names: ['두건 쓴 무리의 주인', '끝나지 않는 합창'], t2: '합창 대상 다섯' },
    hunger: { part: '아가리', names: ['끝없는 아가리', '바닥 없는 아가리'], t2: '대식이 세 칸까지' },
  };
  // 신화: 권능 (pw) 과 대가 (pr). tier 1 속삭임 / 2 징조 / 3 현현. asp = 본체가 따라가는 성향
  //   숫자 열쇠는 더해진다: cap 세우는 수, interestCap, freeRoll, xpRound, winGold, third, mergeGold, income, rerollCost, xpCost, lossMore, shopUp, invHp/invAtk/invSan, bossUp, eliteForce, coreHp/coreAtk/coreMana/coreRange
  //   syn = 시너지 수에 더함, bo = 싸움 안의 깃발, extra = 무리마다 더 오는 것, now = 고를 때 한 번 얻는 것 (조우의 얻는 것과 같은 꼴)
  const TIERN = ['', '속삭임', '징조', '현현'];
  const MYTHOS = {
    deepbell: { name: '깊은 곳의 종소리', tier: 1, asp: 'abyss', cat: '시너지', power: '심연 +1', price: '방패 기사 1 · 공격 +4%', more: '심연 권속을 하나 더 가진 것으로 센다. 그 종소리를 들은 기사가 무리마다 하나씩 따라오고, 침입자의 공격이 4% 오른다.', pw: { syn: { abyss: 1 } }, pr: { extra: ['knight'], invAtk: 0.04 } },
    starseat: { name: '별을 세는 자리', tier: 1, asp: 'nebula', cat: '시너지', power: '성운 +1', price: '침입자 정신 +15%', more: '성운 권속을 하나 더 가진 것으로 센다. 하늘을 본 적이 있는 자들만 굴로 보내진다.', pw: { syn: { nebula: 1 } }, pr: { invSan: 0.15 } },
    oldclutch: { name: '묵은 알자리', tier: 1, asp: 'brood', cat: '시너지', power: '번식 +1 · 새끼 1', price: '침입자 공격 +4%', more: '번식 권속을 하나 더 가진 것으로 센다. 싸움이 시작되면 본체 앞에 새끼 하나가 나온다.', pw: { syn: { brood: 1 }, bo: { hatchstart: 1 } }, pr: { invAtk: 0.04 } },
    underhood: { name: '두건 아래의 얼굴', tier: 1, asp: 'dusk', cat: '시너지', power: '황혼 +1 · 적 정신 −8%', price: '무리마다 사냥개 1', more: '황혼 권속을 하나 더 가진 것으로 센다. 모든 적이 정신이 8% 깎인 채 싸움을 시작한다. 냄새를 맡은 사냥개가 무리마다 하나씩 온다.', pw: { syn: { dusk: 1 }, bo: { sanfrenzy: 0.08 } }, pr: { extra: ['hound'] } },
    emptybelly: { name: '비어 있는 배', tier: 1, asp: 'hunger', cat: '시너지', power: '기아 +1', price: '권속 체력 −4%', more: '기아 권속을 하나 더 가진 것으로 센다. 굶주림은 권속의 살도 깎는다.', pw: { syn: { hunger: 1 } }, pr: { bo: { kinWeak: 0.04 } } },
    pooled: { name: '고인 진액', tier: 1, asp: 'abyss', cat: '살림', power: '이자 상한 +2 · 진액 +4', price: '다시 뽑기 값 +1', more: '이자를 7까지 받고, 진액 4를 곧바로 얻는다. 고인 것은 쉽게 움직이지 않는다.', pw: { interestCap: 2, now: { gold: 4 } }, pr: { rerollCost: 1 } },
    rummage: { name: '뒤적이는 손', tier: 1, asp: 'hunger', cat: '살림', power: '첫 다시 뽑기 공짜', price: '수입 −1', more: '라운드마다 첫 다시 뽑기에는 진액이 들지 않는다. 라운드 수입이 1 준다.', pw: { freeRoll: 1 }, pr: { income: -1 } },
    thickshell: { name: '두꺼운 껍질', tier: 1, asp: 'abyss', cat: '싸움', power: '권속 체력 +12%', price: '침입자 공격 +6%', more: '둥지에 세운 권속 전부의 체력이 오른다. 침입자들은 더 벼린 날을 들고 온다.', pw: { bo: { thick: 0.12 } }, pr: { invAtk: 0.06 } },
    whetted: { name: '벼린 이빨', tier: 1, asp: 'hunger', cat: '싸움', power: '권속 공격 +10%', price: '침입자 체력 +5%', more: '둥지에 세운 권속 전부의 공격이 오른다. 침입자들은 더 두꺼운 갑옷을 입고 온다.', pw: { bo: { sharp: 0.1 } }, pr: { invHp: 0.05 } },
    thinmind: { name: '얇아진 정신', tier: 1, asp: 'dusk', cat: '광기', power: '적 정신 −20%', price: '침입자 체력 +5%', more: '모든 적이 정신이 깎인 채 싸움을 시작한다. 침입자들은 더 두꺼운 갑옷을 입고 온다.', pw: { bo: { sanfrenzy: 0.2 } }, pr: { invHp: 0.05 } },
    firstbreath: { name: '첫 숨', tier: 1, asp: 'nebula', cat: '싸움', power: '마나 50%로 시작', price: '침입자 공격 +8%', more: '권속은 마나를 절반 채운 채 싸움을 시작한다.', pw: { bo: { firstfree: 0.5 } }, pr: { invAtk: 0.08 } },
    earlyegg: { name: '먼저 깬 알', tier: 1, asp: 'brood', cat: '싸움', power: '시작할 때 새끼 3', price: '무리마다 횃불꾼 1', more: '싸움이 시작되면 본체 앞에 새끼 셋이 나온다. 횃불 든 자가 무리마다 하나씩 온다.', pw: { bo: { hatchstart: 3 } }, pr: { extra: ['torch'] } },
    deeproot: { name: '깊은 뿌리', tier: 1, asp: 'brood', cat: '본체', power: '본체 체력 +40%', price: '지면 목숨 −1 더', more: '본체의 체력이 오른다. 뿌리가 깊을수록 뽑힐 때 더 많이 찢긴다.', pw: { coreHp: 0.4 }, pr: { lossMore: 1 } },
    livingwall: { name: '살아 있는 벽', tier: 1, asp: 'dusk', cat: '방', power: '방이 지워지지 않는다', price: '우두머리 +10%', more: '방은 읽혀도 지워지지 않고, 방 위에 선 권속은 공격 +15%. 우두머리의 체력과 공격이 10% 오른다.', pw: { bo: { noErase: 1, roomplus: 0.15 } }, pr: { bossUp: 0.1 } },
    eyelids: { name: '천 개의 눈꺼풀', tier: 2, asp: 'nebula', cat: '광기', power: '판정 주사위 −1', price: '침입자 체력 +6%', more: '침입자는 공포 판정에서 주사위를 하나 덜 굴린다 (적어도 하나는 굴린다). 침입자들은 더 두꺼운 갑옷을 입고 온다.', pw: { bo: { dieless: 1 } }, pr: { invHp: 0.06 } },
    widehall: { name: '넓어지는 굴', tier: 2, asp: 'brood', cat: '살림', power: '세우는 수 +1', price: '침입자 체력 +4%', more: '둥지에 권속 하나를 더 세운다. 굴이 넓어진 만큼 들어오는 것도 단단해진다.', pw: { cap: 1 }, pr: { invHp: 0.04 } },
    lastbreath: { name: '마지막 숨', tier: 2, asp: 'abyss', cat: '싸움', power: '죽음을 두 번 버틴다', price: '지면 목숨 −1 더', more: '싸움마다 처음 쓰러지는 권속 둘이 체력 50%로 버틴다.', pw: { bo: { laststand: 2 } }, pr: { lossMore: 1 } },
    burstskull: { name: '터지는 머리', tier: 2, asp: 'dusk', cat: '광기', power: '미친 적 죽으면 폭발', price: '침입자 체력 +4%', more: '미친 적이 죽으면 터진다. 곁의 적이 그 최대 체력의 40%만큼 피해를 입는다.', pw: { bo: { madburst: 0.4 } }, pr: { invHp: 0.04 } },
    manymouths: { name: '많은 입', tier: 2, asp: 'brood', cat: '싸움', power: '불린 것 +40%', price: '무리마다 연금술사 1', more: '새끼, 감염체, 신도처럼 불려 나온 것들의 체력과 공격이 오른다.', pw: { bo: { spawnplus: 0.4 } }, pr: { extra: ['alchemist'] } },
    firstcry: { name: '첫 울음', tier: 2, asp: 'nebula', cat: '싸움', power: '시작할 때 기절 2.5초', price: '침입자 공격 +5%', more: '싸움이 시작되면 우두머리가 아닌 적 전부가 기절한다.', pw: { bo: { stunstart: 2.5 } }, pr: { invAtk: 0.05 } },
    bigbiter: { name: '큰 것을 무는 이', tier: 2, asp: 'hunger', cat: '싸움', power: '정예 +10% · 공격 +8%', price: '정예가 늘 온다', more: '정예와 우두머리가 받는 피해가 10% 오르고, 권속 전부의 공격이 8% 오른다. 막마다 셋째 라운드의 정예를 물릴 수 없다.', pw: { bo: { giant: 0.1, sharp: 0.08 } }, pr: { eliteForce: 1 } },
    digger: { name: '굴 파는 것', tier: 2, asp: 'abyss', cat: '살림', power: '라운드마다 경험 +2', price: '수입 −1', more: '라운드가 끝날 때마다 경험을 2 더 얻는다. 라운드 수입이 1 준다.', pw: { xpRound: 2 }, pr: { income: -1 } },
    gatething: { name: '문 앞에 선 것', tier: 2, asp: 'abyss', cat: '시너지', power: '수문장 +1 · 체력 +8%', price: '침입자 공격 +5%', more: '수문장을 하나 더 가진 것으로 센다. 권속 전부의 체력이 8% 오른다.', pw: { syn: { guard: 1 }, bo: { thick: 0.08 } }, pr: { invAtk: 0.05 } },
    nighthunt: { name: '밤 사냥', tier: 2, asp: 'hunger', cat: '시너지', power: '사냥꾼 +1 · 공격 +4%', price: '침입자 체력 +4%', more: '사냥꾼을 하나 더 가진 것으로 센다. 권속 전부의 공격이 4% 오른다.', pw: { syn: { hunter: 1 }, bo: { sharp: 0.04 } }, pr: { invHp: 0.04 } },
    callvoice: { name: '부르는 목소리', tier: 2, asp: 'nebula', cat: '시너지', power: '부르는 것 +1·마나 +10%', price: '무리마다 기수 1', more: '「부르는 것」을 하나 더 가진 것으로 센다. 권속의 마나가 10% 빨리 찬다.', pw: { syn: { caller: 1 }, bo: { manaFast: 0.1 } }, pr: { extra: ['banner'] } },
    grandmother: { name: '어미의 어미', tier: 2, asp: 'brood', cat: '시너지', power: '어미 +1 · 죽으면 새끼 1', price: '무리마다 마법사 1', more: '「어미」를 하나 더 가진 것으로 센다. 권속이 죽으면 그 자리에서 새끼 하나가 나온다. 불을 다루는 자가 무리마다 하나씩 온다.', pw: { syn: { mother: 1 }, bo: { eggsac: 1 } }, pr: { extra: ['mage'] } },
    redsill: { name: '붉은 문지방', tier: 2, asp: 'dusk', cat: '광기', power: '성공은 6뿐 · 정신 −10%', price: '침입자 체력 +3%', more: '공포 판정에서 5는 성공이 아니다. 모든 적이 정신이 10% 깎인 채 싸움을 시작한다.', pw: { bo: { six: 1, sanfrenzy: 0.1 } }, pr: { invHp: 0.03 } },
    newfaith: { name: '새 신도', tier: 2, asp: 'dusk', cat: '광기', power: '광인 회복·공격 +60%', price: '침입자 체력 +3%', more: '적이 미치면 체력의 60%를 되찾고 공격이 60% 오른다.', pw: { bo: { madstrong: 0.6 } }, pr: { invHp: 0.03 } },
    hungrycore: { name: '굶주린 본체', tier: 2, asp: 'hunger', cat: '본체', power: '본체 공격 +25%·흡수', price: '침입자 체력 +5%', more: '본체의 공격이 오르고, 적이 죽을 때마다 본체가 체력의 3%를 되찾는다.', pw: { coreAtk: 0.25, bo: { corefeed: 0.03 } }, pr: { invHp: 0.05 } },
    wallhears: { name: '벽이 듣는다', tier: 2, asp: 'nebula', cat: '방', power: '방 타일 2', price: '읽는 방 +1', more: '방 타일 둘을 곧바로 얻는다. 책을 쫓는 자는 읽을 때마다 방 하나를 더 지운다.', pw: { now: { room: 2 } }, pr: { bo: { readPlus: 1 } } },
    secondheart: { name: '두 번째 심장', tier: 3, asp: 'abyss', cat: '시너지', power: '심연 +2', price: '무리마다 성기사 1', more: '심연 권속을 둘 더 가진 것으로 센다. 성기사가 무리마다 하나씩 온다.', pw: { syn: { abyss: 2 } }, pr: { extra: ['paladin'] } },
    opensky: { name: '열린 하늘', tier: 3, asp: 'nebula', cat: '시너지', power: '성운 +2 · 주사위 −1', price: '무리마다 구마사 1', more: '성운 권속을 둘 더 가진 것으로 센다. 침입자는 공포 판정에서 주사위를 하나 덜 굴린다. 구마사가 무리마다 하나씩 온다.', pw: { syn: { nebula: 2 }, bo: { dieless: 1 } }, pr: { extra: ['exorcist'] } },
    endlessbrood: { name: '끝없는 산란', tier: 3, asp: 'brood', cat: '시너지', power: '번식 +2·불린 것 +50%', price: '침입자 공격 +6%', more: '번식 권속을 둘 더 가진 것으로 센다. 불려 나온 것들의 체력과 공격이 50% 오른다.', pw: { syn: { brood: 2 }, bo: { spawnplus: 0.5 } }, pr: { invAtk: 0.06 } },
    allsing: { name: '모두가 합창한다', tier: 3, asp: 'dusk', cat: '시너지', power: '황혼 +2 · 광인 고정', price: '침입자 체력 +12%', more: '황혼 권속을 둘 더 가진 것으로 센다. 미친 적은 다시 제정신으로 돌아가지 못한다.', pw: { syn: { dusk: 2 }, bo: { keepMad: 1 } }, pr: { invHp: 0.12 } },
    bottomless: { name: '바닥 없는 배', tier: 3, asp: 'hunger', cat: '시너지', power: '기아 +2·평타 흡수 15%', price: '침입자 공격 +6%', more: '기아 권속을 둘 더 가진 것으로 센다. 권속이 평타로 준 피해의 15%만큼 체력을 되찾는다.', pw: { syn: { hunger: 2 }, bo: { vamp: 0.15 } }, pr: { invAtk: 0.06 } },
    deepening: { name: '끝없이 넓어지는 굴', tier: 3, asp: 'abyss', cat: '살림', power: '세우는 수 +2', price: '침입자 체력·공격 +8%', more: '둥지에 권속 둘을 더 세운다.', pw: { cap: 2 }, pr: { invHp: 0.08, invAtk: 0.08 } },
    sleeperbreath: { name: '잠든 이의 숨', tier: 3, asp: 'nebula', cat: '싸움', power: '마나 80%로 시작·+10%', price: '심문관 1 · 공격 +5%', more: '권속은 마나를 80% 채운 채 싸움을 시작하고, 마나가 10% 빨리 찬다. 입을 막는 심문관이 무리마다 하나씩 오고, 침입자의 공격이 5% 오른다.', pw: { bo: { firstfree: 0.8, manaFast: 0.1 } }, pr: { extra: ['inquis'], invAtk: 0.05 } },
    undying: { name: '죽지 않는 것들', tier: 3, asp: 'brood', cat: '싸움', power: '모든 권속 죽음 1번 버팀', price: '침입자 공격 +15%', more: '권속은 저마다 싸움에서 한 번, 쓰러질 때 체력 50%로 버틴다.', pw: { bo: { laststand: 99 } }, pr: { invAtk: 0.15 } },
    freezing: { name: '얼어붙는 것', tier: 3, asp: 'dusk', cat: '광기', power: '얼어붙음 4초·정신 +80%', price: '침입자 체력 +5%', more: '공포 판정에서 하나도 성공하지 못한 적은 4초 동안 얼어붙고 정신을 80% 더 잃는다.', pw: { bo: { awe: 2, dread: 0.8 } }, pr: { invHp: 0.05 } },
    kingbody: { name: '왕의 몸', tier: 3, asp: 'hunger', cat: '본체', power: '본체 체력·공격 +25%', price: '권속 체력 −10%', more: '본체의 체력과 공격이 25% 오르고 한 칸 더 멀리 닿는다.', pw: { coreHp: 0.25, coreAtk: 0.25, coreRange: 1 }, pr: { bo: { kinWeak: 0.1 } } },
    usury: { name: '이자의 이자', tier: 3, asp: 'abyss', cat: '살림', power: '이자 상한 +5·진액 +15', price: '지면 목숨 −1 더', more: '이자를 10까지 받고, 진액 15를 곧바로 얻는다.', pw: { interestCap: 5, now: { gold: 15 } }, pr: { lossMore: 1 } },
    eatingroom: { name: '먹는 방', tier: 3, asp: 'hunger', cat: '방', power: '방 2 · 방이 안 지워진다', price: '우두머리 +8%', more: '방 타일 둘을 곧바로 얻는다. 방은 읽혀도 지워지지 않고, 방 위에 선 권속은 공격 +20%.', pw: { now: { room: 2 }, bo: { noErase: 1, roomplus: 0.2 } }, pr: { bossUp: 0.08 } },
    thirdborn: { name: '셋째', tier: 3, asp: 'brood', cat: '살림', power: '합칠 때마다 진액 +4', price: '침입자 체력 +3%', more: '권속이 합쳐져 별이 오를 때마다 진액 4를 얻는다. 3성이 되면 같은 권속 2성 하나를 대기석에 더 얻는다 (대기석이 차 있으면 그 값만큼 진액). 상점은 한 레벨 위의 확률로 나온다.', pw: { third: 1, mergeGold: 4, shopUp: 1 }, pr: { invHp: 0.03 } },
  };
  const MYTHOS_IDS = Object.keys(MYTHOS);
  // 저주: 조우에서 진 값. n = 이어지는 싸움 수
  const CURSE = {
    watched: { name: '들킨 굴', short: '침입자 공격 +12%', n: 2 },
    hungry: { name: '주린 배', short: '권속 체력 −10%', n: 2 },
    sealed: { name: '막힌 목', short: '본체 마나 +30', n: 2 },
    debt: { name: '빚', short: '수입 −2', n: 2 },
  };
  // 이름 있는 조사자. will 의지 / lore 지식 / might 힘. 판마다 셋이 되풀이해 온다
  const CAST = {
    eda: { kind: 'c_eda', role: '기록관', will: 3, lore: 4, might: 1, hist: '교단의 서고에서 금서의 목록을 베끼던 서기였다.' },
    rowen: { kind: 'c_rowen', role: '파문당한 기사', will: 3, lore: 1, might: 4, hist: '성기사단에서 쫓겨난 뒤에도 방패의 문장을 떼지 않았다.' },
    mirel: { kind: 'c_mirel', role: '구마 수녀', will: 4, lore: 3, might: 1, hist: '세 마을의 우물에서 같은 얼굴을 건져 올렸다고 하였다.' },
    tov: { kind: 'c_tov', role: '덫 사냥꾼', will: 2, lore: 2, might: 3, hist: '짐승의 것이 아닌 발자국을 사흘 동안 따라왔다.' },
    isel: { kind: 'c_isel', role: '연금술사', will: 2, lore: 4, might: 2, hist: '굴에서 흘러나온 물을 병에 담아 간 적이 있었다.' },
    vasco: { kind: 'c_vasco', role: '등불지기', will: 4, lore: 2, might: 2, hist: '서른 해 동안 고갯길의 등불을 꺼뜨린 적이 없었다.' },
  };
  const CAST_IDS = Object.keys(CAST);
  // 둥지의 네 가지 힘: 조우의 판정에서 굴리는 주사위 수 (1~6)
  const STAT = { menace: '위압', whisper: '속삭임', hunger: '굶주림', brood: '품' };
  // 조우: 라운드 사이에 굴 앞으로 찾아오는 것. ch = 고를 것. stat/need 가 있으면 그 힘만큼 주사위를 굴려 5 이상이 need 개 나와야 한다. cost = 고르는 데 드는 진액
  //   ok/no = [결과 글, 얻는 것]. 얻는 것: gold, unit [값, 별], room, fear, life, xp, curse, cult (판 끝까지 싸움마다 광신도), omen (그 수만큼의 싸움 동안 판정 주사위 −1), zeal (다음 싸움의 광신도)
  const ENC = {
    pilgrim: { title: '문 앞의 순례자', text: '길을 잃은 순례자 하나가 굴 어귀에 무릎을 꿇고 있었다. 그는 제가 찾던 성소에 닿았다고 믿는 듯하였다. 기도는 낮고 길었으며, 안쪽의 어둠은 그것을 끝까지 들었다.', ch: [
      { id: 'eat', label: '삼킨다', stat: 'hunger', need: 1, ok: ['기도는 중간에서 끊겼다.', { gold: 6 }], no: ['그는 달아났고, 마을은 굴의 자리를 알게 되었다.', { curse: 'watched' }] },
      { id: 'whisper', label: '속삭인다', stat: 'whisper', need: 2, ok: ['그는 일어나 안으로 걸어 들어왔다. 다시 나가지 않았다.', { cult: 1, omen: 3, xp: 4 }], no: ['그는 귀를 막고 산을 내려갔다.', { fear: 2 }] },
      { id: 'leave', label: '둔다', ok: ['그는 해가 질 때까지 기도하다가 돌아갔다.', { xp: 4 }] }] },
    deserter: { title: '탈영병의 지도', text: '갑옷을 반쯤 벗어 던진 병사가 굴 앞에 지도 한 장을 내려놓았다. 토벌대가 올 길이 붉은 먹으로 그어져 있었다. 그는 값으로 제 목숨만을 청하였다.', ch: [
      { id: 'take', label: '받는다', stat: 'menace', need: 1, ok: ['지도는 틀리지 않았다. 오는 자들의 걸음을 미리 알았다.', { omen: 2, gold: 3 }], no: ['지도는 미끼였다.', { curse: 'watched' }] },
      { id: 'eat', label: '삼킨다', stat: 'hunger', need: 1, ok: ['그가 청한 값은 치러지지 않았다.', { gold: 6 }], no: ['그는 칼을 버리지 않았었다.', { life: -1 }] },
      { id: 'leave', label: '돌려보낸다', ok: ['그는 굴에서 본 것을 누구에게도 말하지 않았다.', { fear: -2, xp: 2 }] }] },
    dreamchild: { title: '물을 꿈꾸는 아이', text: '마을의 아이 하나가 밤마다 같은 꿈을 꾸었다. 꿈속에서 아이는 검은 물가에 서 있었고, 물은 아이의 이름을 알고 있었다. 그날 밤 아이는 잠든 채로 굴 어귀까지 걸어왔다.', ch: [
      { id: 'deepen', label: '꿈을 깊게 한다', stat: 'whisper', need: 2, ok: ['아이가 본 물이 굴 바닥에 고였다.', { room: 1, xp: 6 }], no: ['아이는 비명을 지르며 깨어났다. 마을의 창마다 불이 켜졌다.', { fear: 2 }] },
      { id: 'eat', label: '삼킨다', stat: 'hunger', need: 1, ok: ['아이는 돌아가지 않았다.', { gold: 7, fear: 1 }], no: ['아이를 찾는 횃불이 산을 메웠다.', { curse: 'watched' }] },
      { id: 'leave', label: '돌려보낸다', ok: ['아이는 제 침상에서 깨어났고, 발이 젖어 있었다.', { xp: 4 }] }] },
    envoy: { title: '다른 굴의 사절', text: '두건을 쓴 사절이 다른 굴의 이름으로 찾아왔다. 그는 제 주인이 더 오래되었다고 말하였고, 조공을 요구하였다. 그의 그림자는 그보다 한 박자 늦게 움직였다.', ch: [
      { id: 'cow', label: '위압한다', stat: 'menace', need: 2, ok: ['사절은 가져온 것을 두고 물러갔다.', { gold: 14 }], no: ['사절은 웃지 않고 제 몫을 거두어 갔다.', { gold: -4 }] },
      { id: 'eat', label: '삼킨다', stat: 'hunger', need: 2, ok: ['두건 아래에 있던 것은 굴의 것이 되었다.', { unit: [3, 2], gold: 4 }], no: ['삼킨 것은 목에 걸려 오래 내려가지 않았다.', { curse: 'sealed' }] },
      { id: 'pay', label: '조공을 낸다', cost: 3, ok: ['사절은 값을 세고 돌아갔다. 한동안 길이 조용하였다.', { fear: -2, omen: 2 }] }] },
    scholar: { title: '탁본을 뜨는 학자', text: '늙은 학자가 굴 벽의 무늬에 종이를 대고 숯을 문지르고 있었다. 그는 무늬가 글자라는 것을 알아보았다. 그것이 읽는 쪽을 읽는다는 것은 알지 못하였다.', ch: [
      { id: 'let', label: '읽게 둔다', stat: 'whisper', need: 1, ok: ['그는 사흘 뒤에 돌아와, 제가 읽은 것을 벽에 보태었다.', { xp: 7 }], no: ['그는 종이를 불태우고 교단에 편지를 썼다.', { fear: 1 }] },
      { id: 'eat', label: '삼킨다', stat: 'hunger', need: 1, ok: ['숯과 종이만이 어귀에 남았다.', { gold: 7 }], no: ['그의 제자들이 스승을 찾으러 왔다.', { life: -1 }] }] },
    midwife: { title: '산파의 등불', text: '산파 하나가 등불을 들고 굴 안쪽의 울음소리를 따라 들어왔다. 그녀는 그것이 갓난것의 울음이라고 믿었다. 알들은 불빛 쪽으로 천천히 돌아누웠다.', ch: [
      { id: 'egg', label: '알을 맡긴다', stat: 'brood', need: 2, ok: ['알 하나가 그녀의 손에서 일찍 깨었다.', { unit: [2, 2], zeal: 2, gold: 3 }], no: ['그녀는 등불을 떨어뜨렸고, 알자리 한쪽이 탔다.', { curse: 'hungry' }] },
      { id: 'leave', label: '돌려보낸다', ok: ['그녀는 빈손으로 돌아갔고, 그 뒤로 아이를 받지 않았다.', { xp: 4 }] }] },
    tollman: { title: '통행세를 걷는 자', text: '고갯길의 세리가 굴 앞을 제 길목으로 삼았다. 그는 드나드는 것마다 값을 매겼고, 굴에서 나오는 것에도 값을 매기려 하였다.', ch: [
      { id: 'cow', label: '위압한다', stat: 'menace', need: 1, ok: ['그는 걷은 것을 모두 두고 달아났다.', { gold: 7 }], no: ['그는 병사들을 데리고 돌아와 제 몫을 받아 갔다.', { gold: -3 }] },
      { id: 'eat', label: '삼킨다', stat: 'hunger', need: 1, ok: ['길목은 다시 비었다.', { gold: 6, xp: 3, fear: 1 }], no: ['세리의 장부가 관청에 닿았다.', { curse: 'watched' }] }] },
    bellringer: { title: '종을 치는 사내', text: '마을의 종지기가 밤마다 굴 쪽을 향해 종을 쳤다. 종소리는 무엇인가를 쫓으려는 것이었다. 안쪽의 것들은 그것을 부름으로 들었다.', ch: [
      { id: 'bell', label: '종을 가져온다', stat: 'menace', need: 2, ok: ['종은 굴 안에 걸렸고, 치는 이 없이 울었다.', { room: 1, gold: 6 }], no: ['종루에 불이 올랐고, 온 골짜기가 그것을 보았다.', { fear: 2 }] },
      { id: 'answer', label: '답한다', stat: 'whisper', need: 2, ok: ['종지기는 줄을 놓고 소리가 난 쪽으로 걸어왔다.', { cult: 1, omen: 3, xp: 4 }], no: ['답은 너무 컸다. 본체의 목이 쉬었다.', { curse: 'sealed' }] },
      { id: 'leave', label: '둔다', ok: ['종은 새벽까지 울렸다.', { xp: 4 }] }] },
    shepherd: { title: '양을 잃은 목동', text: '목동이 잃은 양을 찾아 굴 어귀까지 내려왔다. 양은 이미 안쪽에 있었고, 더는 양이 아니었다.', ch: [
      { id: 'return', label: '양을 돌려준다', stat: 'brood', need: 1, ok: ['돌아간 양은 우리 안의 다른 것들을 바꾸어 놓았다.', { gold: 7, fear: 1 }], no: ['목동은 돌아온 것을 알아보고 불에 태웠다.', { curse: 'hungry' }] },
      { id: 'eat', label: '목동도 들인다', stat: 'hunger', need: 2, ok: ['지팡이만이 어귀에 남았다.', { unit: [3, 2], gold: 3 }], no: ['목동의 개가 먼저 물었다.', { life: -1 }] }] },
    relic: { title: '성물을 든 수사', text: '젊은 수사가 뼈 한 조각이 든 함을 품에 안고 굴 앞에 섰다. 그는 그것이 어둠을 물리친다고 배웠다. 함 속의 뼈는 굴 쪽으로 기울었다.', ch: [
      { id: 'seize', label: '빼앗는다', stat: 'menace', need: 2, ok: ['뼈는 제자리를 찾은 듯 굴 벽에 박혔다.', { room: 1, gold: 6 }], no: ['함이 열리며 본체의 목이 탔다.', { curse: 'sealed' }] },
      { id: 'whisper', label: '속삭인다', stat: 'whisper', need: 2, ok: ['수사는 수도원으로 돌아가 형제들에게 밤마다 같은 말을 하였다.', { omen: 5, xp: 4 }], no: ['그는 성가를 부르며 뒷걸음질하였다.', { fear: 1 }] }] },
    flood: { title: '차오르는 물', text: '비가 사흘을 내려 굴 아래쪽에 물이 찼다. 물은 빠지지 않았고, 밤이면 수면 아래에서 무엇인가 숨을 쉬었다.', ch: [
      { id: 'welcome', label: '물을 들인다', stat: 'brood', need: 2, ok: ['물과 함께 온 것이 권속의 자리에 앉았다.', { unit: [3, 2], xp: 6 }], no: ['물은 알자리까지 올라왔다.', { curse: 'hungry' }] },
      { id: 'dig', label: '물길을 판다', stat: 'menace', need: 1, ok: ['물은 굴이 정한 자리에 고였다.', { room: 1 }], no: ['물길은 무너졌고, 고쳐 파는 데 진액이 들었다.', { gold: -3 }] }] },
    merchant: { title: '밤에 온 상인', text: '상인 하나가 달이 없는 밤에 수레를 끌고 왔다. 그는 무엇을 파는지 말하지 않았고, 무엇을 받는지도 말하지 않았다. 수레의 덮개 아래에서 무엇인가 긁는 소리가 났다.', ch: [
      { id: 'buy', label: '값을 치른다', cost: 6, ok: ['덮개 아래에 있던 것이 굴로 기어 들어왔다.', { unit: [3, 2] }] },
      { id: 'tip', label: '수레를 뒤집는다', stat: 'menace', need: 2, ok: ['상인은 수레를 버리고 갔다.', { unit: [3, 2], gold: 5 }], no: ['수레에서 나온 것은 굴의 편이 아니었다.', { life: -1 }] },
      { id: 'leave', label: '보낸다', ok: ['수레는 날이 밝기 전에 고개를 넘었다.', { xp: 3 }] }] },
    twins: { title: '쌍둥이의 내기', text: '쌍둥이 형제가 누가 더 깊이 들어가는지를 두고 내기를 하였다. 한 사람은 횃불을 들었고 한 사람은 들지 않았다.', ch: [
      { id: 'eat', label: '하나만 삼킨다', stat: 'hunger', need: 1, ok: ['남은 하나는 내기에 이겼다고 말하고 다녔다.', { gold: 7, fear: 1 }], no: ['둘은 함께 달아나 함께 떠들었다.', { curse: 'watched' }] },
      { id: 'whisper', label: '둘 다 속인다', stat: 'whisper', need: 3, ok: ['둘은 서로를 형이라 부르며 굴의 문을 지켰다.', { cult: 2, zeal: 2, omen: 3, xp: 5 }], no: ['한 사람이 다른 사람을 끌고 나갔다.', { fear: 2 }] }] },
    gravedigger: { title: '무덤 파는 이', text: '무덤 파는 이가 굴 가까이에 새 구덩이를 팠다. 그는 묻을 것을 가져오지 않았다. 그는 구덩이 곁에 앉아 기다렸다.', ch: [
      { id: 'fill', label: '채워 준다', stat: 'brood', need: 1, ok: ['그는 값을 치르고 흙을 덮었다.', { gold: 6 }], no: ['그는 구덩이 속을 들여다보고는 삽을 두고 갔다.', { fear: 1 }] },
      { id: 'bury', label: '그를 묻는다', stat: 'hunger', need: 2, ok: ['구덩이는 딱 맞았다.', { xp: 10, gold: 4 }], no: ['그는 삽을 쓸 줄 알았다.', { life: -1 }] }] },
    choirboy: { title: '성가대의 아이', text: '성가대에서 쫓겨난 아이가 굴 앞에서 혼자 노래하였다. 음은 맞지 않았다. 안쪽에서 누군가 낮은 음을 받쳐 주었다.', ch: [
      { id: 'sing', label: '함께 부른다', stat: 'whisper', need: 1, ok: ['아이는 그 노래를 마을에 가져갔다.', { omen: 3, gold: 3 }], no: ['아이의 목소리가 갈라졌고, 사제가 그 까닭을 물었다.', { fear: 1 }] },
      { id: 'adopt', label: '들인다', stat: 'brood', need: 2, ok: ['아이는 굴에서 음을 맞추는 법을 배웠다.', { cult: 1, xp: 5, gold: 3 }], no: ['아이의 노래가 본체의 목에 걸렸다.', { curse: 'sealed' }] }] },
    hounddog: { title: '돌아오지 않는 개', text: '사냥꾼의 개가 굴 앞에서 짖다가 그쳤다. 개는 꼬리를 내리고 안으로 들어갔고, 사냥꾼은 밖에서 이름을 불렀다.', ch: [
      { id: 'return', label: '개를 돌려보낸다', stat: 'whisper', need: 2, ok: ['돌아간 개는 밤마다 주인의 침상 곁에서 굴 쪽을 보았다.', { omen: 4, xp: 6, fear: 1 }], no: ['사냥꾼은 개의 눈을 보고 활을 들었다.', { curse: 'watched' }] },
      { id: 'feed', label: '개를 먹인다', stat: 'hunger', need: 1, ok: ['개였던 것이 권속 사이에 누웠다.', { unit: [2, 2] }], no: ['개는 먹이만 물고 달아났다.', { gold: -2 }] }] },
    census: { title: '머릿수를 세는 관리', text: '관리가 장부를 들고 골짜기의 머릿수를 세러 왔다. 그는 굴 앞에서 붓을 멈추었다. 장부에는 이미 한 줄이 더 적혀 있었다.', ch: [
      { id: 'amend', label: '장부를 고친다', stat: 'whisper', need: 2, ok: ['골짜기는 장부에서 지워졌고, 한동안 잊혔다.', { fear: -3, gold: 8 }], no: ['고친 자리가 번져 더 눈에 띄었다.', { curse: 'watched' }] },
      { id: 'eat', label: '삼킨다', stat: 'hunger', need: 1, ok: ['장부는 굴 안에서 마지막 줄까지 채워졌다.', { gold: 6 }], no: ['관리를 찾는 이들이 장부의 마지막 쪽을 읽었다.', { fear: 2 }] }] },
    smith: { title: '대장장이의 못', text: '대장장이가 굴 어귀에 쇠못을 박아 문을 달려 하였다. 못은 돌에 들어가지 않고 휘었다. 그는 그것을 제 솜씨의 탓으로 여겼다.', ch: [
      { id: 'door', label: '문을 달게 둔다', stat: 'menace', need: 1, ok: ['문은 안쪽에서만 열렸다.', { room: 1 }], no: ['문은 밖에서 잠겼고, 권속 몇이 며칠을 굶었다.', { curse: 'hungry' }] },
      { id: 'chase', label: '쫓는다', stat: 'menace', need: 2, ok: ['그는 연장을 두고 달아났다.', { gold: 14 }], no: ['그는 달아나며 본 것을 대장간에서 떠들었다.', { fear: 1 }] }] },
    plague: { title: '역병 든 수레', text: '역병으로 죽은 이들을 실은 수레가 고갯길에 버려져 있었다. 끌던 말은 달아났고, 까마귀도 내려앉지 않았다.', ch: [
      { id: 'gather', label: '거두어 들인다', stat: 'brood', need: 2, ok: ['수레에 누웠던 것들이 굴 앞에서 일어섰다.', { cult: 1, zeal: 2, gold: 4 }], no: ['병은 굴 안을 가리지 않았다.', { curse: 'hungry' }] },
      { id: 'eat', label: '먹는다', stat: 'hunger', need: 2, ok: ['수레는 비었고, 굴은 넓어졌다.', { xp: 8, gold: 5 }], no: ['먹은 것이 본체 안에서 오래 썩었다.', { life: -1 }] },
      { id: 'leave', label: '둔다', ok: ['수레는 첫눈이 올 때까지 그 자리에 있었다.', { fear: -1, xp: 3 }] }] },
    astronomer: { title: '별을 재는 이', text: '천문을 보는 이가 언덕에 관측대를 세웠다. 그는 별 하나가 제자리에 있지 않다고 적었다. 그 별은 굴의 천장에 있었다.', ch: [
      { id: 'show', label: '보여 준다', stat: 'whisper', need: 2, ok: ['그는 관측대를 버리고 별이 있는 쪽으로 내려왔다.', { unit: [3, 2], omen: 2 }], no: ['그는 본 것을 그려 교단에 보냈다.', { fear: 2 }] },
      { id: 'topple', label: '관측대를 무너뜨린다', stat: 'menace', need: 1, ok: ['놋쇠와 유리는 진액으로 녹았다.', { gold: 7 }], no: ['무너지는 소리가 아랫마을까지 내려갔다.', { curse: 'watched' }] }] },
    wedding: { title: '혼례 행렬', text: '혼례 행렬이 길을 잘못 들어 굴 앞을 지났다. 악사들은 연주를 멈추지 않았고, 신부는 면사포 너머로 굴 안을 오래 보았다.', ch: [
      { id: 'invite', label: '안으로 부른다', stat: 'whisper', need: 3, ok: ['잔치는 굴 안에서 이어졌고, 끝나지 않았다.', { cult: 3, gold: 10 }], no: ['신랑이 신부의 손을 끌었다. 행렬은 마을마다 그 일을 말하였다.', { fear: 2, gold: -3 }] },
      { id: 'steal', label: '잔칫상을 가로챈다', stat: 'hunger', need: 1, ok: ['행렬은 빈 수레를 끌고 갔다.', { gold: 6 }], no: ['수레에는 지키는 이가 있었다.', { gold: -2 }] },
      { id: 'leave', label: '보낸다', ok: ['행렬은 고개를 넘었다. 신부는 한 번 돌아보았다.', { xp: 4 }] }] },
    mirror: { title: '거울 파는 노파', text: '노파가 굴 앞에 거울을 늘어놓았다. 거울에는 굴 안의 것들이 비치지 않았고, 그 자리에 다른 것들이 서 있었다.', ch: [
      { id: 'buy', label: '거울을 산다', cost: 5, ok: ['거울은 굴 어귀에 걸렸다. 들어오는 자들은 먼저 그것을 보았다.', { omen: 4, xp: 2 }] },
      { id: 'break', label: '깨뜨린다', stat: 'menace', need: 2, ok: ['조각마다 다른 굴이 비쳤다. 노파는 값을 두고 갔다.', { gold: 10, xp: 5 }], no: ['깨진 것은 거울만이 아니었다.', { curse: 'sealed' }] }] },
    oathbreaker: { title: '맹세를 깬 기사', text: '문장을 긁어낸 기사가 칼을 땅에 꽂고 굴 앞에 섰다. 그는 섬길 것을 찾는다고 말하였다. 그의 눈은 오래 잠들지 못한 눈이었다.', ch: [
      { id: 'accept', label: '받아들인다', stat: 'menace', need: 2, ok: ['그는 갑옷을 벗지 않은 채 권속이 되었다.', { unit: [3, 2], zeal: 2 }], no: ['그는 섬길 것이 아니라 벨 것을 찾고 있었다.', { life: -1 }] },
      { id: 'test', label: '시험한다', stat: 'whisper', need: 2, ok: ['그는 물음마다 옳게 답하였고, 문 앞에 섰다.', { cult: 1, omen: 2, xp: 5 }], no: ['그는 셋째 물음에서 칼을 뽑아 들고 물러갔다.', { fear: 1 }] }] },
    well: { title: '마른 우물', text: '마을의 우물이 말랐다. 사람들은 두레박을 더 깊이 내렸고, 두레박은 굴의 천장을 두드렸다.', ch: [
      { id: 'water', label: '물을 올려 보낸다', stat: 'brood', need: 1, ok: ['마을은 그 물을 마셨고 한동안 조용하였다.', { fear: -1, gold: 6 }], no: ['물맛을 본 이들이 우물을 메웠다.', { fear: 1 }] },
      { id: 'pull', label: '두레박을 당긴다', stat: 'hunger', need: 2, ok: ['줄 끝에 매달려 온 것은 두레박만이 아니었다.', { unit: [3, 2], gold: 4 }], no: ['줄이 끊어졌고, 사람들은 우물 속을 등불로 비추었다.', { curse: 'watched' }] }] },
  };
  const ENC_IDS = Object.keys(ENC);
  // ───────── 준비 ─────────
  const SAVE_V = 2;
  const isNestCell = c => c >= NEST_ROW * COLS && c < N && !CORE.includes(c);
  // 고른 신화가 바꾸는 것들을 모은다: 숫자는 더하고, syn/bo 는 열쇠마다 더하고, extra 는 잇는다. by = 그 깃발을 준 신화
  function modOf(R) {
    const M = { syn: {}, bo: {}, by: {}, extra: [] }; if (R.taste || !R.mythos) return M;
    R.mythos.picked.forEach(id => { const c = MYTHOS[id]; if (!c) return; [c.pw, c.pr].forEach(o => { for (const k in o || {}) { const v = o[k]; if (k === 'syn') for (const x in v) M.syn[x] = (M.syn[x] || 0) + v[x]; else if (k === 'bo') for (const x in v) { M.bo[x] = (M.bo[x] || 0) + v[x]; M.by[x] = id; } else if (k === 'extra') M.extra = M.extra.concat(v); else if (k !== 'now') M[k] = (M[k] || 0) + v; } }); });
    return M;
  }
  const mo = (R, k) => modOf(R)[k] || 0, curseOn = (R, id) => (R.curses || []).some(c => c.id === id);
  const XN = R => (R.taste ? K.xpNeed : K.full.xpNeed), ML = R => (R.taste ? K.maxLv : K.full.maxLv);
  // 시너지. R 이 없거나 맛보기 판이면 옛 규칙 (본체가 제 모습의 성향과 종류에 하나로 든다). 온전한 판에서는 깨어난 본체가 제 성향에만 하나로 들고, 신화가 수를 더한다
  function synOf(kinds, R) {
    const set = [...new Set(kinds)].filter(k => KIN[k]), out = {}, full = !!(R && !R.taste), form = full ? (R.awake ? R.form : 'drop') : formOf(set), fc = full ? null : FORM[form].cls, ms = full ? modOf(R).syn : {};
    SYN_IDS.forEach(id => { const core = id === form || id === fc ? 1 : 0, own = set.filter(k => KIN[k].asp === id || KIN[k].cls === id).length, n = own + core + (ms[id] || 0), need = full ? SYN[id].full : SYN[id].need; let tier = 0; need.forEach((x, i) => { if (n >= x) tier = i + 1; }); out[id] = { n, own, core: !!core, plus: ms[id] || 0, tier }; });
    return out;
  }
  function formOf(kinds) { const set = [...new Set(kinds)], cnt = {}; set.forEach(k => { const a = KIN[k].asp; cnt[a] = (cnt[a] || 0) + 1; }); let best = 'drop', bn = 1; ASPS.forEach(a => { if ((cnt[a] || 0) > bn) { bn = cnt[a]; best = a; } }); return best; }
  const cap = R => R.level + 1 + mo(R, 'cap');
  const boardUids = R => Object.keys(R.board).map(c => R.board[c]);
  const boardKinds = R => boardUids(R).map(id => R.unit[id].kind);
  const oddsOf = level => K.full.odds[clamp(level, 3, K.full.maxLv)];
  function rollShop(R) {
    R.shop = [];
    if (R.taste) { const o = K.odds[R.level] || K.odds[K.maxLv]; for (let i = 0; i < 5; i++) { const x = rnd(R.rs) * 100, c = x < o[0] ? 1 : x < o[0] + o[1] ? 2 : 3, pool = KIN_IDS.filter(k => KIN[k].cost === c && !KIN[k].gen); R.shop.push(pool[Math.floor(rnd(R.rs) * pool.length)]); } return; }
    const o = oddsOf(R.level + mo(R, 'shopUp'));
    for (let i = 0; i < 5; i++) { let x = rnd(R.rs) * 100, c = 1; for (let k = 0; k < 5; k++) { if (x < o[k]) { c = k + 1; break; } x -= o[k]; } const pool = KIN_IDS.filter(k => KIN[k].cost === c); R.shop.push(pool[Math.floor(rnd(R.rs) * pool.length)]); }
  }
  function rollRooms(R) { const pool = ROOM_IDS.filter(id => !R.rooms.some(r => r.id === id)), out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rnd(R.rs) * pool.length), 1)[0]); R.roomOffer = out; }
  function enemyOf(R, round) { const d = ROUNDS[round - 1], flip = rnd(R.rs) < 0.5; return d.units.map(u => ({ kind: u[0], cell: idx(u[1], flip ? COLS - 1 - u[2] : u[2]) })); }
  // 온전한 판의 침입자: 틀에서 자리를 잡는다. 앞줄은 가운데부터, 뛰어드는 것은 양 끝, 우두머리는 가운데 줄 한복판
  const ROWSEQ = { 2: [2, 1, 0], 1: [1, 0, 2], 0: [0, 1, 2] }, COLSEQ = { f: [2, 3, 1, 4, 0, 5], d: [0, 5, 1, 4, 2, 3], b: [1, 4, 2, 3, 0, 5] };
  function layParty(p, flip, mul) {
    const used = {}, out = [];
    const put = (kind, row, cols) => { for (const r of ROWSEQ[row]) for (const c of cols) { const cell = idx(r, flip ? COLS - 1 - c : c); if (used[cell]) continue; used[cell] = 1; const o = { kind, cell }; if (mul && mul !== 1) o.mul = mul; out.push(o); return; } };
    (p.m || []).filter(k => INV[k].boss).forEach(k => put(k, 1, COLSEQ.f)); (p.f || []).forEach(k => put(k, 2, COLSEQ.f)); (p.m || []).filter(k => !INV[k].boss).forEach(k => put(k, 1, INV[k].leap ? COLSEQ.d : COLSEQ.f)); (p.b || []).forEach(k => put(k, 0, COLSEQ.b));
    return out;
  }
  // 조사자: 판마다 셋이 막의 둘째·넷째 라운드에 번갈아 온다. 삼켜진 이는 3막에 홀린 채로 돌아오고, 마지막 싸움에는 홀린 이들이 (둘까지) 낀다
  function castFor(R, act, rin) {
    const F0 = K.full, C = R.cast, out = [], last = act >= F0.acts && rin >= F0.per; if (!C || !(rin === 2 || rin === 4 || last)) return out;
    const pool = C.active.filter(id => { const m = C.mem[id]; return m.state !== 'gone' && (last ? m.state === 'eaten' : m.state !== 'eaten' || act >= F0.acts); });
    for (let k = 0; k < (last ? 2 : 1) && k < pool.length; k++) { const id = pool[(C.next + k) % pool.length], m = C.mem[id], poss = m.state === 'eaten'; out.push({ id, kind: CAST[id].kind, will: poss ? 0 : m.will, poss, mul: poss ? 1.2 : m.state === 'hurt' ? 0.85 : 1 }); }
    return out;
  }
  function partyOf(R, act, rin) {
    const A = ACTS[clamp(act, 1, ACTS.length) - 1], F0 = K.full, M = modOf(R), flip = rnd(R.rs) < 0.5, boss = rin >= F0.per, vs = boss ? [A.boss] : A.rounds[rin - 1], p = vs[Math.floor(rnd(R.rs) * vs.length)];
    const ex = M.extra.slice(); if (R.world >= 1) ex.push(A.more); if (R.world >= 2) ex.push('paladin');
    const cast = castFor(R, act, rin), bu = boss ? (M.bossUp || 0) + (R.world >= 3 ? 0.2 : 0) : 0;
    const make = (more, mul) => {
      const q = { f: (p.f || []).slice(), m: (p.m || []).slice(), b: (p.b || []).slice() };
      ex.concat(more, cast.map(c => c.kind)).forEach(k => { const r = INV[k].role; q[r === 'dive' ? 'm' : r === 'ranged' || r === 'support' ? 'b' : 'f'].push(k); });
      const units = layParty(q, flip, mul), lead = units.some(u => INV[u.kind].boss) ? u => INV[u.kind].boss : u => INV[u.kind].elite && !INV[u.kind].cast;
      units.forEach(u => { const c = cast.find(x => x.kind === u.kind); if (c) { u.cast = c.id; u.will = c.will; if (c.poss) u.poss = true; if (c.mul !== 1) u.mul = (u.mul || 1) * c.mul; } else if (bu && lead(u)) u.mul = (u.mul || 1) * (1 + bu); });
      return units;
    };
    const e = A.elite, base = { name: p.name, units: make([], 1) }, alt = !boss && rin === F0.eliteAt ? { name: '정예 ' + p.name, units: make((e.f || []).concat(e.m || [], e.b || []), F0.eliteMul) } : null;
    return { base, alt, cast: cast.map(c => c.id) };
  }
  function nextEnemy(R) { const p = partyOf(R, R.act, R.rin); R.enemy = p.base.units; R.enemyName = p.base.name; R.alt = p.alt; R.elite = !!(p.alt && mo(R, 'eliteForce')); if (p.cast.length && R.cast.at !== R.round) { R.cast.at = R.round; R.cast.next++; } }
  const curEnemy = R => (R.elite && R.alt ? R.alt.units : R.enemy), curName = R => (R.elite && R.alt ? R.alt.name : R.enemyName);
  const scaleOf = R => { const F0 = K.full, i = clamp(R.round, 1, F0.invHp.length) - 1, M = modOf(R); return { hp: F0.invHp[i] * (1 + (M.invHp || 0)), atk: F0.invAtk[i] * (1 + (M.invAtk || 0)) * (curseOn(R, 'watched') ? 1.12 : 1), san: F0.invSan[i] * (1 + (M.invSan || 0)) }; };
  // 본체: 둥지 레벨과 라운드로 자라고, 신화 단계를 지날 때마다 한 단계 깨어난다 (스킬 단계 = 깨어남 단계, 3단계에서 스킬이 달라진다)
  function coreOf(R) {
    const F0 = K.full, cd = K.core, M = modOf(R), a = F0.awake[clamp(R.awake, 0, 3)];
    return { lv: clamp(R.awake, 1, 3), hp: (1 + cd.lvHp * (R.level - 3)) * (1 + F0.coreHp * (R.round - 1)) * a.hp * (1 + (M.coreHp || 0)), atk: (1 + F0.coreAtk * (R.round - 1)) * a.atk * (1 + (M.coreAtk || 0)), manaCut: (M.coreMana || 0) - (curseOn(R, 'sealed') ? 30 : 0), range: M.coreRange || 0, t2: R.awake >= 3 };
  }
  function pickN(R, pool, n) { const p = pool.slice(), out = []; while (out.length < n && p.length) out.push(p.splice(Math.floor(rnd(R.rs) * p.length), 1)[0]); return out; }
  function newRun(seed, opts) {
    opts = opts || {}; const taste = !!opts.taste, F0 = K.full;
    const R = { v: SAVE_V, mode: taste ? 'taste' : 'full', taste, seed: seed >>> 0, rs: { s: (seed | 0) ^ 0x7a11 }, round: 1, rounds: taste ? K.start.rounds : F0.acts * F0.per, act: 1, rin: 1, gold: taste ? K.start.gold : F0.gold, level: taste ? K.start.level : F0.level, xp: 0, hp: taste ? K.start.hp : F0.life, hpMax: taste ? K.start.hp : F0.life,
      shop: [], bench: [null, null, null, null, null, null], board: {}, unit: {}, nextUid: 1, rooms: [], roomOffer: [], enemy: [], enemyName: '', alt: null, elite: false, phase: 'prep', choice: null, over: null, merges: [], hist: [], picks: [], fights: 0, streak: 0, freeRoll: false, retry: 0,
      form: 'drop', awake: 0, fear: 0, world: 0, mythos: taste ? null : { phase: 0, tier: 0, offer: null, picked: [], seen: [], rerollLeft: 0 }, encounter: null, encSeen: [], curses: [], cult: 0, omen: 0, zealots: 0, cast: null };
    rollShop(R);
    if (taste) { rollRooms(R); R.enemy = enemyOf(R, 1); R.enemyName = ROUNDS[0].name; }
    else { const active = pickN(R, CAST_IDS, 3), mem = {}; active.forEach(id => { mem[id] = { state: 'fresh', will: CAST[id].will, seen: 0, mad: 0, eaten: 0, killed: 0 }; }); R.cast = { active, next: 0, at: 0, mem }; nextEnemy(R); }
    return R;
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
      for (const k in groups) {
        const g = groups[k]; if (g.length < 3) continue; g.sort((a, b) => { const wa = whereOf(R, a), wb = whereOf(R, b); return (wa.cell != null ? 0 : 1) - (wb.cell != null ? 0 : 1) || a - b; }); const keep = g[0]; removeUnit(R, g[1]); removeUnit(R, g[2]); R.unit[keep].star++;
        const m = { uid: keep, kind: R.unit[keep].kind, star: R.unit[keep].star, ate: [g[1], g[2]] }, mg = mo(R, 'mergeGold'); out.push(m); done = false; if (mg) { R.gold += mg; m.gold = mg; }
        if (m.star === 3 && mo(R, 'third')) { const b = R.bench.slice(0, 6).indexOf(null); if (b >= 0) { const uid = R.nextUid++; R.unit[uid] = { uid, kind: m.kind, star: 2 }; R.bench[b] = uid; m.gift = uid; } else { m.giftGold = KIN[m.kind].cost * 3; R.gold += m.giftGold; } }
        break;
      }
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
  const rerollCost = R => K.reroll + mo(R, 'rerollCost'), xpCost = R => K.xpCost + mo(R, 'xpCost');
  function reroll(R) { if (R.phase !== 'prep') return fail('지금은 안 된다'); const free = !!R.freeRoll, cost = rerollCost(R); if (!free && R.gold < cost) return fail('진액이 모자란다'); if (free) R.freeRoll = false; else R.gold -= cost; rollShop(R); return ok({ free }); }
  function levelUp(R) { const need = XN(R), max = ML(R); let up = 0; while (R.level < max && R.xp >= need[R.level]) { R.xp -= need[R.level]; R.level++; up++; } if (R.level >= max) R.xp = 0; return up; }
  function buyXp(R) { if (R.phase !== 'prep') return fail('지금은 안 된다'); if (R.level >= ML(R)) return fail('더 넓힐 수 없다'); if (R.gold < xpCost(R)) return fail('진액이 모자란다'); R.gold -= xpCost(R); R.xp += K.xpBuy; return ok({ up: levelUp(R) }); }
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
  // 방 놓기. 맛보기 판은 셋 가운데 하나만, 온전한 판은 고른 방을 놓을 때까지 들고 있는다
  function placeRoom(R, i, cell) { if (R.phase !== 'prep') return fail('지금은 안 된다'); const id = R.roomOffer[i]; if (!id) return fail('고를 방이 없다'); if (!canPlaceRoom(R, id, cell)) return fail('놓을 수 없는 자리다'); R.rooms.push({ id, cells: roomCells(id, cell) }); if (R.taste) R.roomOffer = []; else R.roomOffer.splice(i, 1); return ok({ id }); }
  function setupOf(R, seed) {
    const kinds = boardKinds(R), sy = synOf(kinds, R), syn = {}; SYN_IDS.forEach(id => { if (sy[id].tier) syn[id] = sy[id].tier; });
    const S = { seed: seed == null ? (R.seed ^ Math.imul(R.round + R.fights * 31, 0x9E3779B1)) | 0 : seed, nest: Object.keys(R.board).map(c => ({ uid: R.board[c], kind: R.unit[R.board[c]].kind, star: R.unit[R.board[c]].star, cell: +c })), inv: curEnemy(R), rooms: R.rooms, level: R.level, round: R.round, form: R.taste ? formOf(kinds) : R.form, syn };
    if (!R.taste) {
      const M = modOf(R), bo = Object.assign({}, M.bo); if (curseOn(R, 'hungry')) bo.kinWeak = (bo.kinWeak || 0) + 0.1; if (R.omen > 0) bo.dieless = (bo.dieless || 0) + 1;
      S.scale = scaleOf(R); S.core = coreOf(R); S.boons = bo; S.boonBy = M.by; S.check = K.full.check; S.zealots = R.zealots + R.cult; S.sumMul = 1 + K.full.sumUp * (R.round - 1); S.roomLv = R.act;
    }
    return S;
  }
  // ───────── 라운드 사이 ─────────
  function econOf(R, win) {
    const F0 = K.full, M = modOf(R), capI = Math.max(0, F0.interestMax + (M.interestCap || 0)), interest = Math.min(capI, Math.floor(R.gold / F0.interestPer)), s = win ? Math.max(1, R.streak + 1) : Math.min(-1, R.streak - 1), streak = F0.streak[Math.min(F0.streak.length - 1, Math.abs(s))], wg = win ? F0.winGold + (M.winGold || 0) : 0, base = Math.max(0, F0.income + (M.income || 0) - (curseOn(R, 'debt') ? 2 : 0));
    return { base, interest, interestMax: capI, streak, win: wg, total: base + interest + streak + wg };
  }
  const freeRooms = R => ROOM_IDS.filter(id => !R.rooms.some(r => r.id === id) && !R.roomOffer.includes(id) && roomSpots(R, id).length);
  // 공포: 0~12. 4/8/12 를 넘으면 세상이 한 단계 답한다 (되돌아가지 않는다)
  function addFear(R, n) { const F0 = K.full, f0 = R.fear; R.fear = clamp(R.fear + n, 0, F0.fearMax); R.world = Math.max(R.world, F0.fearAt.filter(x => R.fear >= x).length); return R.fear - f0; }
  function addUnit(R, cost, star) { const pool = KIN_IDS.filter(k => KIN[k].cost === cost), kind = pool[Math.floor(rnd(R.rs) * pool.length)]; return putUnit(R, kind, star); }
  function putUnit(R, kind, star) { const b = R.bench.indexOf(null); if (b < 0) { const v = KIN[kind].cost * Math.pow(3, star - 1); R.gold += v; return { type: 'gold', amt: v, instead: kind }; } const uid = R.nextUid++; R.unit[uid] = { uid, kind, star }; R.bench[b] = uid; const merged = merge(R); return { type: 'unit', kind, star, uid, name: KIN[kind].name, merged }; }
  function addRooms(R, n) { const got = pickN(R, freeRooms(R), n), out = got.map(id => { R.roomOffer.push(id); return { type: 'room', id, name: ROOM[id].name }; }); for (let k = got.length; k < n; k++) { R.gold += 4; out.push({ type: 'gold', amt: 4 }); } return out; }
  function applyGains(R, g) {
    const out = []; g = g || {};
    if (g.gold) { const v = Math.max(-R.gold, g.gold); R.gold += v; out.push({ type: 'gold', amt: v }); }
    if (g.xp) { R.xp += g.xp; out.push({ type: 'xp', amt: g.xp, levelUp: levelUp(R) }); }
    if (g.life) { const h0 = R.hp; R.hp = clamp(R.hp + g.life, 1, R.hpMax); out.push({ type: 'life', amt: R.hp - h0 }); }
    if (g.fear) out.push({ type: 'fear', amt: addFear(R, g.fear) });
    if (g.unit) out.push(addUnit(R, g.unit[0], g.unit[1]));
    if (g.room) addRooms(R, g.room).forEach(x => out.push(x));
    if (g.curse) { const c = CURSE[g.curse]; R.curses.push({ id: g.curse, left: c.n }); out.push({ type: 'curse', id: g.curse, name: c.name, short: c.short, n: c.n }); }
    if (g.cult) { R.cult += g.cult; out.push({ type: 'cult', amt: g.cult }); }
    if (g.omen) { R.omen += g.omen; out.push({ type: 'omen', amt: g.omen }); }
    if (g.zeal) { R.zealots += g.zeal; out.push({ type: 'zeal', amt: g.zeal }); }
    return out;
  }
  const sg = n => (n > 0 ? '+' : '−') + Math.abs(n);
  function gainText(g) {
    const p = []; g = g || {};
    if (g.gold) p.push('진액 ' + sg(g.gold)); if (g.xp) p.push('경험 +' + g.xp); if (g.life) p.push('목숨 ' + sg(g.life)); if (g.fear) p.push('공포 ' + sg(g.fear)); if (g.unit) p.push(g.unit[1] + '성 ' + g.unit[0] + '값 권속'); if (g.room) p.push('방 타일 ' + g.room);
    if (g.curse) p.push(CURSE[g.curse].name + ' (' + CURSE[g.curse].short + ', ' + CURSE[g.curse].n + '싸움)'); if (g.cult) p.push('광신도 +' + g.cult + ' (판 끝까지)'); if (g.omen) p.push('판정 주사위 −1 (' + g.omen + '싸움)'); if (g.zeal) p.push('다음 싸움 광신도 ' + g.zeal);
    return p.length ? p.join(' · ') : '아무 일도 없다';
  }
  // 이긴 보통 라운드 뒤: 방 / 진액 / 조우 (둘에 한 번쯤). 정예를 이기면: 2성 권속 / 진액 / 방. 막의 우두머리를 이기면: 진액은 그냥 받고, 방 / 2성 권속 가운데 하나
  function rewardChoice(R, act, kind) {
    const F0 = K.full, a = clamp(act, 1, F0.acts) - 1, opts = [], unit = (cost, star) => { const pool = KIN_IDS.filter(k => KIN[k].cost === cost); return { type: 'unit', id: pool[Math.floor(rnd(R.rs) * pool.length)], star }; };
    if (kind === 'elite') { opts.push(unit(F0.eliteUnit[a], 2)); opts.push({ type: 'gold', amt: F0.eliteGold[a] }); pickN(R, freeRooms(R), 1).forEach(id => opts.push({ type: 'room', id })); }
    else if (kind === 'boss') { pickN(R, freeRooms(R), 1).forEach(id => opts.push({ type: 'room', id })); opts.push(unit(F0.bossUnit[a], 2)); }
    else { const enc = rnd(R.rs) < F0.encounter ? pickN(R, ENC_IDS.filter(id => !R.encSeen.includes(id)), 1) : []; pickN(R, freeRooms(R), enc.length ? 1 : 2).forEach(id => opts.push({ type: 'room', id })); opts.push({ type: 'gold', amt: F0.giftGold[a] }); enc.forEach(id => opts.push({ type: 'encounter', id })); }
    return { kind, opts };
  }
  // (권속을 골랐는데 대기석이 차 있으면 그 값만큼 진액으로 받는다)
  // 다음에 할 일을 정한다: 고를 것 → 조우 → 신화 단계 → 준비
  const mythosDue = R => !R.taste && R.mythos.phase < K.full.mythosAt.length && R.round >= K.full.mythosAt[R.mythos.phase];
  function settle(R) {
    if (R.phase === 'over') return;
    if (R.choice) R.phase = 'choice';
    else if (R.encounter) R.phase = 'encounter';
    else if (mythosDue(R)) { if (!R.mythos.offer) openMythos(R); R.phase = 'mythos'; }
    else R.phase = 'prep';
  }
  function choose(R, i) {
    const ch = R.choice; if (!ch || R.phase !== 'choice') return fail('고를 것이 없다'); const o = ch.opts[i]; if (!o) return fail('없는 것이다');
    let got = null;
    if (o.type === 'unit') got = putUnit(R, o.id, o.star || 1);
    else if (o.type === 'gold') R.gold += o.amt;
    else if (o.type === 'room') R.roomOffer.push(o.id);
    else if (o.type === 'encounter') { R.encounter = { id: o.id, pick: null, roll: null, rerolls: 0 }; R.encSeen.push(o.id); }
    R.picks.push({ round: R.round, kind: ch.kind, type: o.type, id: o.id || null }); R.choice = null; settle(R);
    return ok({ picked: o, got, next: R.phase });
  }
  // 셋째 라운드의 정예: 켜면 더 센 무리가 오고, 이기면 더 좋은 것을 고른다
  function setElite(R, on) { if (R.phase !== 'prep') return fail('지금은 안 된다'); if (!R.alt) return fail('정예가 없는 라운드다'); if (!on && mo(R, 'eliteForce')) return fail('정예를 물릴 수 없다'); R.elite = !!on; return ok({ elite: R.elite }); }
  // ── 신화 단계: 라운드 2/7/12 의 준비 앞. 셋 가운데 하나를 고른다. 단계마다 한 번 통째로 다시 볼 수 있다
  function drawMythos(R, tier, skip) { const all = MYTHOS_IDS.filter(id => MYTHOS[id].tier === tier && !R.mythos.picked.includes(id)), fresh = all.filter(id => !skip.includes(id)); return pickN(R, fresh.length >= 3 ? fresh : all, 3); }
  function openMythos(R) {
    const F0 = K.full, My = R.mythos, w = F0.tier[My.phase].slice(), sh = Math.min(w[0], F0.fearTier * R.fear); w[0] -= sh; w[2] += sh;
    const x = rnd(R.rs) * (w[0] + w[1] + w[2]); My.tier = x < w[0] ? 1 : x < w[0] + w[1] ? 2 : 3; My.offer = drawMythos(R, My.tier, []); My.seen = My.offer.slice(); My.rerollLeft = 1;
  }
  function mythosReroll(R) { const My = R.mythos; if (R.phase !== 'mythos' || !My || !My.offer) return fail('신화 단계가 아니다'); if (My.rerollLeft <= 0) return fail('다시 볼 수 없다'); My.rerollLeft--; My.offer = drawMythos(R, My.tier, My.seen); My.seen = My.seen.concat(My.offer); return ok({ offer: My.offer.map(cardInfo) }); }
  const aspWeights = R => { const w = {}; ASPS.forEach(a => { w[a] = 0; }); Object.keys(R.unit).forEach(id => { const u = R.unit[id], d = KIN[u.kind], at = whereOf(R, +id); w[d.asp] += d.cost * Math.pow(3, u.star - 1) * (at && at.cell != null ? 2 : 1); }); return w; };
  // 본체의 모습: 고른 신화 가운데 가장 많은 성향. 같으면 가진 권속이 더 무거운 쪽
  function formByCards(R) { const n = {}; R.mythos.picked.forEach(id => { const a = MYTHOS[id].asp; n[a] = (n[a] || 0) + 1; }); const max = Math.max.apply(null, ASPS.map(a => n[a] || 0)), w = aspWeights(R); return ASPS.filter(a => (n[a] || 0) === max).sort((a, b) => w[b] - w[a] || ASPS.indexOf(a) - ASPS.indexOf(b))[0]; }
  function mythosPick(R, i) {
    const My = R.mythos; if (R.phase !== 'mythos' || !My || !My.offer) return fail('신화 단계가 아니다'); const id = My.offer[i], c = MYTHOS[id]; if (!c) return fail('없는 것이다');
    My.picked.push(id); My.offer = null; My.phase++; R.awake = My.phase; R.form = formByCards(R);
    const gains = applyGains(R, c.pw.now).concat(applyGains(R, c.pr.now)); if (mo(R, 'freeRoll')) R.freeRoll = true;
    R.picks.push({ round: R.round, kind: 'mythos', type: 'mythos', id }); nextEnemy(R); settle(R);
    return ok({ picked: cardInfo(id), gains, awake: R.awake, form: R.form, next: R.phase });
  }
  // ── 조우: 고르고 (주사위), 모자라면 진액으로 실패한 주사위를 다시 굴리고, 끝맺는다
  function nestStat(R, stat) {
    const us = boardUids(R).map(id => R.unit[id]), d = u => KIN[u.kind]; let n = 1;
    if (stat === 'menace') n += Math.floor(us.reduce((a, u) => a + d(u).cost * u.star, 0) / 5);
    else if (stat === 'whisper') n += us.filter(u => d(u).cls === 'caller' || d(u).asp === 'dusk' || d(u).asp === 'nebula').length;
    else if (stat === 'hunger') n += us.filter(u => d(u).cls === 'hunter' || d(u).asp === 'hunger' || d(u).asp === 'abyss').length;
    else n += us.filter(u => d(u).cls === 'mother' || d(u).cls === 'guard' || d(u).asp === 'brood').length;
    return clamp(n, 1, 6);
  }
  const succ = dice => dice.filter(x => x >= 5).length;
  function rollView(R) { const E = R.encounter, r = E && E.roll, cost = K.full.rerollBase + (E ? E.rerolls : 0); return { roll: r ? { stat: r.stat, statName: STAT[r.stat], dice: r.dice.slice(), successes: succ(r.dice), need: r.need } : null, canReroll: !!r && succ(r.dice) < r.need && R.gold >= cost, rerollCost: r && succ(r.dice) < r.need ? cost : 0 }; }
  function encounterChoose(R, cid) {
    const E = R.encounter; if (R.phase !== 'encounter' || !E) return fail('조우가 없다'); if (E.pick) return fail('이미 골랐다'); const c = ENC[E.id].ch.find(x => x.id === cid); if (!c) return fail('없는 것이다');
    if (c.cost && R.gold < c.cost) return fail('진액이 모자란다'); if (c.cost) R.gold -= c.cost; E.pick = cid;
    if (c.stat) { const n = nestStat(R, c.stat); E.roll = { stat: c.stat, dice: [], need: c.need }; for (let k = 0; k < n; k++) E.roll.dice.push(1 + Math.floor(rnd(R.rs) * 6)); }
    return ok(rollView(R));
  }
  function encounterReroll(R) {
    const E = R.encounter; if (R.phase !== 'encounter' || !E || !E.roll) return fail('굴린 주사위가 없다'); if (succ(E.roll.dice) >= E.roll.need) return fail('이미 넘었다'); const cost = K.full.rerollBase + E.rerolls; if (R.gold < cost) return fail('진액이 모자란다');
    R.gold -= cost; E.rerolls++; E.roll.dice = E.roll.dice.map(x => (x >= 5 ? x : 1 + Math.floor(rnd(R.rs) * 6)));
    return ok(rollView(R));
  }
  function encounterResolve(R) {
    const E = R.encounter; if (R.phase !== 'encounter' || !E) return fail('조우가 없다'); if (!E.pick) return fail('먼저 골라야 한다');
    const c = ENC[E.id].ch.find(x => x.id === E.pick), success = !E.roll || succ(E.roll.dice) >= E.roll.need, o = success ? c.ok : c.no, gains = applyGains(R, o[1]);
    R.picks.push({ round: R.round, kind: 'encounter', type: 'encounter', id: E.id, pick: E.pick, success }); R.encounter = null; settle(R);
    return ok({ success, outcomeText: o[0], gains, next: R.phase });
  }
  // 조사자의 기억: 미쳤으면 의지 −1, 쓰러졌으면 붕대, 삼켜졌으면 3막에 홀린 채로, 살아 돌아갔으면 의지 +1
  function castAfter(R, f, act) {
    (f.cast || []).forEach(c => {
      const m = R.cast.mem[c.id]; if (!m) return; const was = m.state; m.seen++;
      if (c.how === 'swallow') { m.eaten++; m.state = was === 'eaten' || act >= K.full.acts ? 'gone' : 'eaten'; }
      else if (was === 'eaten') { if (!c.alive) m.state = 'gone'; }
      else if (c.mad) { m.mad++; m.state = 'mad'; m.will = Math.max(1, m.will - 1); }
      else if (!c.alive) { m.killed++; m.state = 'hurt'; }
      else { m.state = 'bold'; m.will = Math.min(5, m.will + 1); }
    });
  }
  // 싸운다: 결과를 돌려주고 다음 라운드로 넘긴다
  function readyTaste(R) {
    const f = simulate(setupOf(R)); R.fights++; const win = f.result === 'win';
    let lost = 0; if (!win) { lost = K.lossHp + f.survivors; R.hp = Math.max(0, R.hp - lost); }
    const interest = Math.min(K.interestMax, Math.floor(R.gold / K.interest)), income = K.income + interest + (win ? K.winGold : 0) + f.gold;
    R.hist.push({ round: R.round, win, time: f.time, lost, converted: f.converted, gold: income });
    const res = { fight: f, win, lost, income, round: R.round };
    if (R.hp <= 0) { R.phase = 'over'; R.over = { win: false, round: R.round, why: '본체가 무너졌다' }; return ok(res); }
    if (R.round >= R.rounds) { R.phase = 'over'; R.over = { win, round: R.round, why: win ? '책을 쫓는 자가 물러났다' : '둥지가 읽혔다' }; return ok(res); }
    R.round++; R.gold += income; R.xp += K.xpFree; res.levelUp = levelUp(R); rollShop(R); rollRooms(R); R.enemy = enemyOf(R, R.round); R.enemyName = ROUNDS[R.round - 1].name; R.merges = [];
    return ok(res);
  }
  function readyFull(R) {
    const F0 = K.full, M = modOf(R), f = simulate(setupOf(R)); R.fights++; const win = f.result === 'win', boss = R.rin >= F0.per, elite = !!(R.elite && R.alt), act = R.act, a = act - 1, more = M.lossMore || 0;
    const el = elite ? F0.eliteLoss[a] : 0; let lost = 0; if (!win) { lost = Math.min(F0.lossMax + more + el, F0.lossBase[a] + Math.ceil(f.survivors * F0.lossPer) + (boss ? F0.bossLoss : 0) + more + el); R.hp = Math.max(0, R.hp - lost); }
    const e = econOf(R, win), gift = boss && win && act < F0.acts ? F0.bossGold[a] : 0, eb = elite && win ? F0.eliteBonus[a] : 0, income = e.total + f.gold + gift + eb; R.streak = win ? Math.max(1, R.streak + 1) : Math.min(-1, R.streak - 1);
    const w0 = R.world, df = addFear(R, win ? Math.min(2, 1 + (f.lostKin === 0 || f.converted >= 3 || f.eliteDown > 0 ? 1 : 0) + (f.madLeft > F0.zealMax ? 1 : 0)) : -1);
    castAfter(R, f, act); R.zealots = win ? Math.min(F0.zealMax, f.madLeft) : 0; R.curses = R.curses.map(c => ({ id: c.id, left: c.left - 1 })).filter(c => c.left > 0); if (R.omen > 0) R.omen--;
    R.hist.push({ round: R.round, act, rin: R.rin, name: curName(R), boss, elite, win, time: f.time, lost, converted: f.converted, gold: income, fear: R.fear, checks: f.checks });
    const eh = elite && win ? Math.min(R.hpMax - R.hp, F0.eliteHeal[a]) : 0; R.hp += eh;
    const res = { fight: f, win, lost, income, econ: e, bossGold: gift, eliteBonus: eb, eliteHeal: eh, round: R.round, act, rin: R.rin, boss, elite, fear: { delta: df, now: R.fear, world: R.world, worldUp: R.world > w0 }, zealots: R.zealots, cast: f.cast };
    if (R.hp <= 0) { R.phase = 'over'; R.over = { win: false, round: R.round, act, why: '본체가 무너졌다' }; res.next = 'over'; return ok(res); }
    if (boss && win && act >= F0.acts) { R.phase = 'over'; R.over = { win: true, round: R.round, act, why: '책을 쫓는 자가 쓰러졌다' }; res.next = 'over'; return ok(res); }
    R.gold += income; R.xp += F0.xpRound + (M.xpRound || 0); res.levelUp = levelUp(R); R.merges = []; R.freeRoll = !!M.freeRoll;
    if (boss && !win) R.retry++;
    else if (boss) { R.act++; R.rin = 1; R.round++; R.retry = 0; R.choice = rewardChoice(R, act, 'boss'); }
    else { R.rin++; R.round++; if (win) R.choice = rewardChoice(R, act, elite ? 'elite' : 'reward'); }
    rollShop(R); nextEnemy(R); settle(R); res.next = R.phase;
    return ok(res);
  }
  function ready(R) { if (R.phase !== 'prep') return fail(R.phase === 'over' ? '이미 끝난 판이다' : '먼저 골라야 한다'); return R.taste ? readyTaste(R) : readyFull(R); }
  // 이어 하기: R 은 그대로 JSON 이 된다
  function save(R) { return JSON.stringify(R); }
  function load(json) {
    let R = null; try { R = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return null; }
    if (!R || R.v !== SAVE_V || !R.unit || !R.board || !Array.isArray(R.bench) || !R.rs || typeof R.rs.s !== 'number' || !['prep', 'choice', 'mythos', 'encounter', 'over'].includes(R.phase)) return null;
    return R;
  }
  // ───────── 화면이 읽는 것 ─────────
  const skillInfo = (id, l) => { const s = SK[id]; return s ? { id, name: s.name, short: s.short(l || 1), more: s.more } : null; };
  function unitInfo(kind, star) {
    const d = KIN[kind], s = star || 1; if (!d) return null; const m = STARM[s];
    const hp = Math.round(d.hp * m * K.hpMul);
    return { kind, art: d.art || kind, name: d.name, star: s, cost: d.cost, asp: d.asp, aspName: ASPN[d.asp], cls: d.cls, clsName: CLSN[d.cls], hp, atk: Math.round(d.atk * m), as: d.as, df: d.df, range: d.range, role: d.role, roleName: ROLE[d.role].name, reach: reachText(d.range, d.role), row: ROLE[d.role].row, mana: d.mana, sanAtk: Math.round((d.sanAtk || 0) * (0.6 + 0.4 * m)), short: hp >= 10000 ? `체력 ${hp}·공격 ${Math.round(d.atk * m)}` : `체력 ${hp} · 공격 ${Math.round(d.atk * m)}`, more: `${ROLE[d.role].name} · ${reachText(d.range, d.role)} · ${ASPN[d.asp]} · ${CLSN[d.cls]}`, skill: skillInfo(d.skill, s) };
  }
  // sc = { hp, atk, san } 를 주면 그 배수로 (온전한 판), 아니면 맛보기 판의 라운드 배수로
  function invInfo(kind, round, sc) {
    const d = INV[kind]; if (!d) return null; const r = clamp(round || 1, 1, 3) - 1, hp = Math.round(d.hp * (sc ? sc.hp : K.roundHp[r]) * K.hpMul), san = Math.round(d.san * (sc ? sc.san : K.roundSan[r]) * K.sanMul), atk = Math.round(d.atk * (sc ? sc.atk : K.roundAtk[r]));
    return { kind, art: d.art || kind, name: d.name, tag: d.tag, role: d.role, roleName: ROLE[d.role].name, reach: reachText(d.range, d.role), row: ROLE[d.role].row, hp, san, atk, as: d.as, df: d.df, range: d.range, mana: d.mana, boss: !!d.boss, elite: !!d.elite, noMad: !!d.noMad, will: d.will || 0, cast: d.cast || null, short: hp >= 10000 ? `체력 ${hp}·정신 ${san}` : `체력 ${hp} · 정신 ${san}`, more: ROLE[d.role].name + ' · ' + reachText(d.range, d.role) + (d.tag && d.tag !== ROLE[d.role].name ? ' · ' + d.tag : ''), skill: skillInfo(d.skill, 1) };
  }
  // lv = 막 (온전한 판에서 방이 자란 만큼의 글과 수치). 없으면 처음 수치
  const roomInfo = (id, lv) => (ROOM[id] ? { id, name: ROOM[id].name, len: ROOM[id].len, lv: clamp(lv || 1, 1, 3), short: lv ? ROOMTXT[id](lv)[0] : ROOM[id].short, more: lv ? ROOMTXT[id](lv)[1] : ROOM[id].more } : null);
  // taste = 맛보기 판의 문턱으로 볼 때
  function synInfo(id, n, taste) { const s = SYN[id], need = taste ? s.need : s.full, sh = !taste && s.fullShort ? s.fullShort : s.short; let tier = 0; need.forEach((x, i) => { if (n >= x) tier = i + 1; }); return { id, name: s.name, n, need, tier, next: tier >= need.length ? null : need[tier], short: sh[Math.max(0, tier - 1)], shorts: sh.slice(0, need.length), more: !taste && s.fullMore ? s.fullMore : s.more, kind: ASPN[id] ? 'asp' : 'cls' }; }
  function formInfo(form, round) { const f = FORM[form] || FORM.drop; return { form, name: f.name, skill: skillInfo(f.skill, clamp(round || 1, 1, 3)) }; }
  const cardInfo = id => { const c = MYTHOS[id]; return c ? { id, name: c.name, tier: c.tier, tierName: TIERN[c.tier], asp: c.asp, aspName: ASPN[c.asp], cat: c.cat, power: c.power, price: c.price, more: c.more } : null; };
  const pct = x => '+' + Math.round((x - 1) * 100) + '%';
  // 깨어남 단계의 본체. step 0 = 옛 것 (내려침), 1~3 = 고른 신화의 성향을 따른 모습
  function coreInfo(R) { const f = FORM[R.awake ? R.form : 'drop'] || FORM.drop, e = R.awake ? EVO[R.form] : null, c = coreOf(R); return { form: R.awake ? R.form : 'drop', step: R.awake, name: e ? e.names[R.awake >= 3 ? 1 : 0] : f.name, part: e ? e.part : null, skill: skillInfo(f.skill, c.lv), t2: e && R.awake >= 3 ? e.t2 : null, hp: Math.round(K.core.hp * c.hp * K.hpMul), atk: Math.round(K.core.atk * c.atk), range: K.core.range + c.range, mana: K.core.mana - c.manaCut }; }
  const CASTNOTE = { fresh: '아직 굴에 들어온 적이 없다.', mad: '굴에서 미쳤다가 끌려 나갔다. 의지 −1. 머리에 붕대를 감고 온다.', hurt: '굴에서 쓰러져 실려 나갔다. 붕대를 감고 온다. 체력·공격 −15%.', eaten: '삼켜졌다. 3막에 홀린 채로 돌아온다.', bold: '굴을 보고도 살아 돌아갔다. 의지 +1.', gone: '다시 오지 않는다.' };
  function castInfo(R, id) { const c = CAST[id], d = INV[c.kind], m = (R && R.cast && R.cast.mem[id]) || { state: 'fresh', will: c.will, seen: 0, mad: 0, eaten: 0, killed: 0 }; return { id, kind: c.kind, art: d.art, name: d.name, role: c.role, will: m.will, will0: c.will, lore: c.lore, might: c.might, skill: skillInfo(d.skill, 1), hist: c.hist, state: m.state, note: CASTNOTE[m.state], seen: m.seen, mad: m.mad, eaten: m.eaten, killed: m.killed, here: !!R && curEnemy(R).some(u => u.cast === id) }; }
  const actInfo = act => { const A = ACTS[clamp(act, 1, ACTS.length) - 1]; return { act, name: A.name, boss: A.boss.name, rounds: A.rounds.map(v => v.map(p => p.name)) }; };
  function previewOf(units) { const n = {}; units.forEach(u => { n[u.kind] = (n[u.kind] || 0) + 1; }); return INV_IDS.filter(k => n[k]).map(k => INV[k].name + ' ' + n[k]).join(' · '); }
  function encounterView(R) {
    const E = R.encounter; if (!E) return null; const d = ENC[E.id];
    return Object.assign({ id: E.id, title: d.title, text: d.text, pick: E.pick, rerolls: E.rerolls, choices: d.ch.map(c => ({ id: c.id, label: c.label, cost: c.cost || 0, can: !c.cost || R.gold >= c.cost, test: c.stat ? { stat: c.stat, statName: STAT[c.stat], dice: nestStat(R, c.stat), need: c.need } : null, hint: (c.cost ? '진액 −' + c.cost + ' · ' : '') + (c.stat ? '성공: ' + gainText(c.ok[1]) + ' / 실패: ' + gainText(c.no[1]) : gainText(c.ok[1])) })) }, rollView(R));
  }
  function choiceView(R) {
    const ch = R.choice; if (!ch) return null;
    return { kind: ch.kind, opts: ch.opts.map((o, i) => {
      if (o.type === 'room') return Object.assign({ i, type: 'room', can: true, spots: roomSpots(R, o.id) }, roomInfo(o.id, R.act));
      if (o.type === 'gold') return { i, type: 'gold', can: true, id: 'gold', amt: o.amt, name: '진액', short: '진액 +' + o.amt, more: '진액 ' + o.amt + '을 얻는다.' };
      if (o.type === 'unit') return Object.assign({ i, type: 'unit', can: true, asGold: R.bench.indexOf(null) >= 0 ? 0 : KIN[o.id].cost * Math.pow(3, (o.star || 1) - 1), id: o.id }, unitInfo(o.id, o.star || 1));
      return { i, type: 'encounter', can: true, id: o.id, name: ENC[o.id].title, short: '조우', more: ENC[o.id].text };
    }) };
  }
  const WORLD = ['무리마다 하나가 더 온다', '무리마다 성기사 1', '우두머리 +20%'];
  function view(R) {
    const kinds = boardKinds(R), sy = synOf(kinds, R), full = !R.taste, F0 = K.full, sc = full ? scaleOf(R) : null, uv = id => { const u = R.unit[id]; return u ? Object.assign({ uid: id, sell: sellValue(u) }, unitInfo(u.kind, u.star)) : null; };
    const ev = e => { const o = Object.assign({ cell: e.cell }, invInfo(e.kind, R.round, sc && { hp: sc.hp * (e.mul || 1), atk: sc.atk * (e.mul || 1), san: sc.san })); if (e.cast) { o.will = e.will; if (e.poss) { o.name = '홀린 ' + o.name; o.san = 0; o.noMad = true; o.poss = true; o.short = '체력 ' + o.hp + ' · 홀림'; } } return o; };
    const V = { mode: R.mode, round: R.round, rounds: R.rounds, roundName: full ? curName(R) : ROUNDS[Math.min(R.round, ROUNDS.length) - 1].name, phase: R.phase, over: R.over, gold: R.gold, level: R.level, xp: R.xp, xpNeed: XN(R)[R.level] || 0, cap: cap(R), placed: kinds.length, hp: R.hp, hpMax: R.hpMax,
      shop: R.shop.map((k, i) => (k ? Object.assign({ i, can: R.gold >= KIN[k].cost }, unitInfo(k, 1)) : null)), bench: R.bench.map(id => (id ? uv(id) : null)), board: Object.keys(R.board).map(c => Object.assign({ cell: +c }, uv(R.board[c]))),
      rooms: R.rooms.map(r => Object.assign({ cells: r.cells }, roomInfo(r.id, full ? R.act : 0))), roomOffer: R.roomOffer.map((id, i) => Object.assign({ i, spots: roomSpots(R, id) }, roomInfo(id, full ? R.act : 0))),
      synergies: SYN_IDS.map(id => Object.assign(synInfo(id, sy[id].n, R.taste), { core: sy[id].core, plus: sy[id].plus || 0 })).filter(s => s.n > 0).sort((a, b) => b.tier - a.tier || b.n - a.n), form: full ? coreInfo(R) : formInfo(formOf(kinds), R.round),
      enemy: curEnemy(R).map(ev), costs: { reroll: R.freeRoll ? 0 : rerollCost(R), xp: xpCost(R) }, canXp: R.level < ML(R) && R.gold >= xpCost(R), canReroll: !!R.freeRoll || R.gold >= rerollCost(R), merges: R.merges, hist: R.hist };
    if (!full) return V;
    const ew = econOf(R, true), el = econOf(R, false), My = R.mythos, M = modOf(R), nextFear = F0.fearAt.find(x => x > R.fear) || null;
    return Object.assign(V, { act: R.act, acts: F0.acts, actName: ACTS[R.act - 1].name, rin: R.rin, per: F0.per, boss: R.rin >= F0.per, retry: R.retry, preview: previewOf(curEnemy(R)), maxLv: F0.maxLv, xpRound: F0.xpRound + (M.xpRound || 0), freeRoll: !!R.freeRoll,
      streak: R.streak, econ: { base: ew.base, per: F0.interestPer, interest: ew.interest, interestMax: ew.interestMax, nextAt: ew.interest < ew.interestMax ? (ew.interest + 1) * F0.interestPer : null, ifWin: ew, ifLoss: el },
      odds: oddsOf(R.level + (M.shopUp || 0)), oddsTable: F0.odds, choice: choiceView(R), picks: R.picks,
      elite: R.alt ? { on: !!R.elite, forced: !!M.eliteForce, name: R.alt.name, preview: previewOf(R.alt.units), reward: '진액 +' + F0.eliteBonus[R.act - 1] + ', 목숨 +' + F0.eliteHeal[R.act - 1] + ' 을 받고, 2성 권속 · 진액 ' + F0.eliteGold[R.act - 1] + ' · 방 가운데 하나. 지면 목숨을 ' + F0.eliteLoss[R.act - 1] + ' 더 잃는다', enemy: R.alt.units.map(ev) } : null,
      mythos: { phase: My.phase, next: My.phase < F0.mythosAt.length ? F0.mythosAt[My.phase] : null, tier: My.offer ? My.tier : 0, tierName: My.offer ? TIERN[My.tier] : '', offer: My.offer ? My.offer.map(cardInfo) : null, picked: My.picked.map(cardInfo), rerollLeft: My.rerollLeft },
      awaken: { step: R.awake, form: R.awake ? R.form : 'drop', fear: R.fear, max: F0.fearMax, next: nextFear, world: R.world, effects: F0.fearAt.map((at, i) => ({ at, world: WORLD[i], on: R.world > i })) },
      encounter: encounterView(R), stats: Object.keys(STAT).map(id => ({ id, name: STAT[id], dice: nestStat(R, id) })),
      curses: R.curses.map(c => ({ id: c.id, name: CURSE[c.id].name, short: CURSE[c.id].short, left: c.left })), cult: R.cult, omen: R.omen, zealots: R.zealots + R.cult,
      cast: R.cast.active.map(id => castInfo(R, id)) });
  }
  return { COLS, ROWS, N, CORE, NEST_ROW, TICK, K, KIN, KIN_IDS, INV, INV_IDS, SUMMON, FORM, SK, ROOM, ROOM_IDS, SYN, SYN_IDS, ROUNDS, ACTS, EVO, MYTHOS, MYTHOS_IDS, TIERN, ENC, ENC_IDS, CAST, CAST_IDS, CURSE, STAT, WORLD, SAVE_V, ROOMLV, ASPN, ASPS, CLSN, CLSS, STARM, ROLE, ROLE_IDS, reachText, rc, idx, cheb, rnd, isNestCell,
    simulate, newRun, view, buy, sell, sellValue, reroll, buyXp, move, placeRoom, canPlaceRoom, roomSpots, roomCells, ready, setupOf, merge, synOf, formOf, cap, whereOf, unitInfo, invInfo, skillInfo, roomInfo, synInfo, formInfo, enemyOf,
    choose, setElite, save, load, mythosPick, mythosReroll, encounterChoose, encounterReroll, encounterResolve, cardInfo, coreInfo, castInfo, actInfo, oddsOf, econOf, scaleOf, coreOf, modOf, nestStat, partyOf, previewOf, curEnemy, gainText, addFear, settle, castAfter };
})();
if (typeof module !== 'undefined') module.exports = LAIR;
