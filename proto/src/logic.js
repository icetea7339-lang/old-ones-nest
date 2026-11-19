// 옛 것의 둥지 — 규칙 엔진 (화면과 분리, node에서도 실행 가능)
// 기획: design/gdd/*.md (v0.5) + design/gdd/map-v2.md (지상·지하 지도)
const NEST = (function () {
  'use strict';
  const K = {
    days: 40, act: 8, cost: [0, 1, 2, 4, 7, 11], stat: [0, 1, 1.5, 2.4, 3.6, 5], size: [0, 1, 1.3, 1.8, 2.4, 3],
    ap: 2, startGold: 300, faithCap: 30, thresh: [0, 50, 150, 300, 480], tier: [1, 2.5, 6, 11, 18],
    slime: { hp: 80, atk: 7, df: 5 }, budget: 37, settle: 1.7, rob: 0.5, falls: [0, 2, 2, 2], smell: 0.8, wary: 0.5, trustMax: 5, trustGain: 0.4, trustCap: [0, 5, 4, 2, 0], trustKills: 3,
    lvGrowth: 1.15, expBase: 10, expGrowth: 1.3, trainEff: 1.5, hands: 2, corpseCap: 9,
  };
  const ASPECTS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
  const ASP = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' };
  // ---------- 지하 격자: 5 × 4 ----------
  const COLS = 5, ROWS = 4, N = 20, ENT = 0, CORE = 18, START = [0, 1, 6, 7, 12, 13];
  const nbrs = i => { const c = i % COLS, r = Math.floor(i / COLS), o = []; if (c > 0) o.push(i - 1); if (c < COLS - 1) o.push(i + 1); if (r > 0) o.push(i - COLS); if (r < ROWS - 1) o.push(i + COLS); return o; };
  const ROOM = {
    empty: { name: '빈 굴', cost: 0, desc: '아무것도 없다. 적이 그냥 지나간다' },
    trap: { name: '함정방', cost: 30, traps: 2, desc: '함정 2개' },
    post: { name: '초소', cost: 25, def: 2, desc: '권속 2. 한 명이 적 2명까지 막고 나머지는 지나간다' },
    hall: { name: '대기실', cost: 60, def: 3, block: true, desc: '권속 3. 들어온 적 전원과 싸운다' },
    ambush: { name: '매복굴', cost: 50, def: 2, traps: 1, desc: '함정 1개가 터진 뒤 권속 2가 덮친다' },
    bighall: { name: '큰 대기실', cost: 140, def: 5, block: true, act: 2, desc: '권속 5. 전원 조우. 2막부터' },
    decoy: { name: '미끼 방', cost: 50, desc: '들어온 적의 30%가 푼돈을 들고 돌아간다' },
    shop: { name: '상점', cost: 40, desc: '지나가는 적 1명당 수입. 대신 적 공격 +20%' },
    prison: { name: '감옥', cost: 40, side: true, desc: '포로 자리 +4' },
    chapel: { name: '예배당', cost: 60, side: true, desc: '매일 신앙 +2, 신앙 상한 +20. 신도 지망자가 자주 온다' },
    ritual: { name: '의식실', cost: 70, side: true, max: 1, desc: '제물의 정수 +1, 변이 확률 +15%p' },
    persuade: { name: '설득실', cost: 60, side: true, max: 1, desc: '개종 성공률 +20%p' },
    altar: { name: '제단', cost: 80, side: true, max: 1, desc: '달이 기우는 밤마다 주 징조 정수 +8' },
    pool: { name: '고인 웅덩이', cost: 60, asp: 'abyss', ess: true, side: true, desc: '이웃 칸 아군이 매 라운드 HP 5% 회복. 매일 심연 정수 +2. 비늘지기를 부른다' },
    sluice: { name: '수문', cost: 70, asp: 'abyss', desc: '지나가는 무리를 하룻밤 한 번 앞 칸으로 되돌린다' },
    library: { name: '서고', cost: 60, asp: 'nebula', ess: true, side: true, desc: '손 주문 효과 +25%. 매일 성운 정수 +2. 별필경사를 부른다' },
    warp: { name: '뒤틀린 복도', cost: 70, asp: 'nebula', desc: '지나가는 적의 25%를 입구로 되돌려 보낸다' },
    hatchery: { name: '부화실', cost: 60, asp: 'brood', ess: true, side: true, desc: '매일 움 1마리. 매일 번식 정수 +2' },
    fleshwall: { name: '살의 벽', cost: 70, asp: 'brood', desc: '벽이 부서질 때까지 무리를 붙잡고, 받은 피해의 25%를 돌려준다' },
    stage: { name: '무대', cost: 60, asp: 'dusk', ess: true, desc: '지나가는 적 전원의 정신력을 깎는다. 매일 황혼 정수 +2. 가면쟁이를 부른다' },
    mirror: { name: '거울 방', cost: 70, asp: 'dusk', side: true, max: 1, desc: '광란한 적이 자기 편을 공격할 확률 20% → 40%' },
    abattoir: { name: '도살장', cost: 60, asp: 'hunger', ess: true, side: true, desc: '시체 정수 +1. 매일 기아 정수 +2. 허기를 부른다' },
    table: { name: '식탁', cost: 70, asp: 'hunger', side: true, max: 1, desc: '시체 창고 +6. 매일 시체 2구를 알아서 먹는다' },

    core: { name: '본체 방', cost: 0, fixed: true, def: 2, desc: '호위 2. 본체가 쓰러지면 끝난다' },
  };
  const TRAP = {
    spike: { name: '가시 바닥', cost: 15, desc: '앞에서 3/4/5명에게 피해' },
    rock: { name: '낙석', cost: 25, desc: '1명에게 큰 피해. 하룻밤 1회' },
    acid: { name: '산성 웅덩이', cost: 30, desc: '앞에서 3/4/5명의 방어 −30%. 익숙해지지 않는다' },
    mist: { name: '환각 안개', cost: 35, desc: '앞에서 3/4/5명의 정신력을 깎는다' },
  };
  const LVM = [0, 1, 1.5, 2], TGT = [0, 3, 4, 5];
  const ZONE = { abyss: ['침수', '함정 대상 +2명, 아군 방어 +20%'], nebula: ['별빛', '이 칸 아군의 정신 공격 +30%'], brood: ['이끼', '이 칸 아군이 매 라운드 HP 3% 회복'], dusk: ['속삭임', '지나가는 적의 정신력을 깎는다'], hunger: ['화상', '지나가는 적이 최대 체력의 8%를 잃는다'] };
  const PLOT = {
    none: { name: '빈 터', cost: 0, desc: '아무것도 없다' },
    bramble: { name: '가시덤불', cost: 30, desc: '이 길로 오는 무리의 인원 −20%' },
    camp: { name: '야영지', cost: 40, desc: '이 길로 오는 무리의 인원 +30%' },
    tower: { name: '망루', cost: 40, desc: '이 길로 오는 무리의 자세한 구성이 보인다' },
    garden: { name: '텃밭', cost: 40, desc: '매일 수입. 무리가 지나간 날은 없다' },
  };
  // ---------- 권속 ----------
  const KIN = {
    goblin: { name: '떠돌이 고블린', cost: 20, hp: 30, atk: 8, df: 2, pay: 1, w: 3, skills: [['기습', '첫 라운드에 두 번 공격'], ['떼거리', '같은 방 고블린 1명당 공격 +15%'], ['뒤통수', '가장 약한 적을 노려 피해 +20%']] },
    skeleton: { name: '떠돌이 해골', cost: 30, hp: 45, atk: 7, df: 6, pay: 1, w: 3, note: '전투당 1회 부활', skills: [['방패 벽', '같은 방 아군이 받는 피해 −20%'], ['뼈 가시', '맞을 때마다 반격'], ['불사', '부활 +1회']] },
    cultist: { name: '신도', cost: 15, hp: 20, atk: 4, df: 1, satk: 3, pay: 0.5, w: 1, note: '매일 신앙 +1', skills: [['합창', '같은 방 신도 1명당 정신 공격 +2'], ['순교', '쓰러질 때 적 전원의 정신력을 깎는다'], ['열성', '매일 신앙 +1 추가']] },
    scale: { name: '비늘지기', cost: 40, hp: 60, atk: 7, df: 9, pay: 2, w: 0, room: 'pool', note: '같은 방 아군 피해 −20%', skills: [['조류', '매 라운드 가장 다친 아군 HP 8% 회복'], ['끌어들임', '전투 시작 때 적 1명을 2라운드 묶음'], ['깊은 숨', '자신의 방어 +50%']] },
    scribe: { name: '별필경사', cost: 50, hp: 25, atk: 0, df: 2, satk: 5, stg: 2, pay: 3, w: 0, room: 'library', note: '정신 공격만 한다', skills: [['낭독', '정신 공격 대상 +1명'], ['봉인문', '전투 시작 때 적 1명의 특성을 끈다'], ['주석', '손 주문 신앙 비용 −2']] },
    spawn: { name: '움', cost: 0, hp: 14, atk: 4, df: 0, pay: 0, w: 0, note: '자리를 차지하지 않는다. 최대 6', skills: [['달라붙기', '맞힌 적의 공격 −10%'], ['터짐', '쓰러질 때 적 전원에게 피해'], ['자라남', '사흘 살아남으면 능력치 2배']] },
    mask: { name: '가면쟁이', cost: 45, hp: 30, atk: 0, df: 3, satk: 8, stg: 1, pay: 2, w: 0, room: 'stage', note: '정신 공격만 한다. 무릎 꿇음 +10%p', skills: [['눈맞춤', '정신력이 가장 낮은 적을 노린다'], ['흉내', '광란한 적의 내분 확률 +20%p'], ['막 내림', '전투당 1회 적 전원의 정신력을 깎는다']] },
    hunger: { name: '허기', cost: 55, hp: 55, atk: 16, df: 4, pay: 0, eat: 0.5, w: 0, room: 'abattoir', note: '처치하면 HP 20% 회복. 시체를 먹는다', skills: [['물어뜯기', '첫 타격 2배'], ['포만', '처치할 때마다 공격 +15%'], ['통째로', '체력 25% 이하인 적을 즉시 처치']] },
  };
  Object.assign(KIN, {
    netter: { name: '그물잡이', cost: 35, hp: 28, atk: 6, df: 3, pay: 2, w: 0, room: 'prison', note: '체력 30% 아래로 떨어진 적을 그물로 덮어 무릎 꿇린다. 감옥이 있으면 찾아온다', skills: [['넓은 그물', '체력 40% 아래까지 덮는다'], ['질긴 가죽', '자신의 방어 +50%'], ['두 번 던지기', '한 라운드에 두 명을 덮는다']] },
    warden: { name: '간수', cost: 30, hp: 40, atk: 6, df: 6, pay: 1, w: 0, room: 'prison', note: '포로 자리 +2, 몸값 +25%. 뒤지는 자가 포로를 풀지 못한다. 감옥이 있으면 찾아온다', skills: [['몽둥이', '공격 +30%'], ['자물쇠', '포로 자리 +2 더'], ['호통', '전투 시작 때 적 전원의 정신력을 깎는다']] },
    turncoat: { name: '돌아선 검', cost: 0, hp: 60, atk: 13, df: 8, satk: 2, pay: 2, w: 0, note: '개종한 싸움꾼. 옛 동료를 칠 때마다 그들의 정신력도 깎는다', skills: [] },
    fallen: { name: '무너진 사제', cost: 0, hp: 35, atk: 0, df: 4, satk: 4, pay: 2, w: 0, note: '개종한 성직자. 매 라운드 가장 다친 아군을 치료하고 정신 공격을 한다', skills: [] },
  });
  Object.assign(KIN, {
    digger: { name: '굴꾼', cost: 40, hp: 20, atk: 3, df: 2, pay: 2, w: 0, note: '매일 공짜 작업 1번 (둘까지). 굴을 3칸 넘게 판 둥지에 찾아온다', skills: [] },
    clerk: { name: '장부쟁이', cost: 50, hp: 15, atk: 0, df: 1, pay: 3, w: 0, room: 'shop', note: '시설 유지비 −25%, 상점 수입 +50%. 싸우지 않는다. 상점이 있으면 찾아온다', skills: [] },
    licker: { name: '핥는 것', cost: 40, hp: 30, atk: 2, df: 4, pay: 2, w: 0.5, note: '같은 방 아군을 매 라운드 치료한다. 다친 권속이 하루 만에 돌아온다', skills: [] },
  });
  Object.assign(KIN, {
    spitter: { name: '가시쏘개', cost: 45, hp: 22, atk: 9, df: 1, pay: 2, w: 1, note: '싸움이 붙기 전에 들어온 적 전원에게 가시를 쏜다', skills: [] },
    eyeheap: { name: '눈 무더기', cost: 50, hp: 26, atk: 0, df: 2, satk: 4, stg: 3, pay: 3, w: 0.7, note: '눈길만으로 한 번에 세 명의 정신력을 깎는다. 다가오는 무리의 구성이 늘 보인다', skills: [] },
    tangle: { name: '촉수 뭉치', cost: 45, hp: 50, atk: 6, df: 5, pay: 2, w: 0.7, note: '싸움이 시작되면 적 둘을 두 라운드 동안 붙든다', skills: [] },
  });
  // 권속의 진화: 레벨 5부터, 재물을 들여 한 번
  const EVO = { spawn: '큰 움', goblin: '홉고블린', skeleton: '해골 기사', cultist: '대신도', scale: '심해지기', scribe: '별의 서기', mask: '천의 가면', hunger: '게걸', netter: '올가미꾼', warden: '옥졸장', turncoat: '검은 기사', fallen: '이단 주교', digger: '땅굴 장인', clerk: '재무관', licker: '약손', spitter: '가시 포대', eyeheap: '눈의 탑', tangle: '매듭 덩이' };
  const EVO_DESC = {
    spawn: '나흘을 살아남으면 저절로 자란다', goblin: '칠 때마다 옆의 적 하나도 같은 세기로 친다', skeleton: '같은 방 아군이 받는 피해 −25%, 부활 +1회', cultist: '매일 신앙 +2 더, 정신 공격 대상 +1명',
    scale: '매 라운드 가장 다친 아군을 치료한다 (스킬과 따로)', scribe: '정신 공격 2배, 손 주문 효과 +25%', mask: '싸움이 시작될 때 적 전원의 정신력을 깎는다',
    hunger: '매 라운드 두 번 문다', netter: '그물 문턱 +10%p, 한 번에 한 명 더 덮는다', warden: '포로 자리 +2 더, 싸움이 시작될 때 호통으로 적 전원의 정신력을 깎는다',
    turncoat: '처치할 때마다 남은 적 전원의 정신력을 깎는다', fallen: '치료량 2배', digger: '공짜 작업 +1번 더', clerk: '시설 유지비 −40%',
    licker: '전투마다 한 번, 쓰러진 아군 하나를 일으킨다', spitter: '싸움 전에 가시를 두 번 쏜다', eyeheap: '눈길이 들어온 적 전원에게 닿는다', tangle: '적 넷을 세 라운드 동안 붙든다',
  };
  const kinName = m => m.evo && EVO[m.kind] ? EVO[m.kind] : KIN[m.kind].name, evoCost = G => 120 * cm(G);
  function evolveKin(G, id) {
    const m = G.kin.find(x => x.id === id); if (!m || !EVO[m.kind]) return fail('진화할 수 없는 권속입니다'); if (m.kind === 'spawn') return fail('움은 나흘을 살아남으면 저절로 자랍니다'); if (m.evo) return fail('이미 진화했습니다'); if (m.lv < 5) return fail('레벨 5부터 진화할 수 있습니다');
    if (G.gold < evoCost(G)) return fail('재물이 부족합니다 (' + evoCost(G) + 'G)'); spend(G, evoCost(G), '권속 진화'); m.evo = true; G.stats.kinEvo = (G.stats.kinEvo || 0) + 1;
    return ok(m.name + '이(가) ' + EVO[m.kind] + '(으)로 자랐다. ' + EVO_DESC[m.kind]);
  }
  const convertKind = kind => ['militia', 'captain', 'warrior', 'soldier'].includes(kind) ? 'turncoat' : ['priest', 'chaplain'].includes(kind) ? 'fallen' : 'cultist';
  const SKILL_LV = [2, 4, 7];
  const NAMES = ['구르', '뼈다귀', '삐약', '덜컹', '쿵쿵', '모락', '찰랑', '반짝', '투덜', '꼬물', '바삭', '철컥', '낼름', '휘릭', '뚱땅', '사각', '덥석', '쫄깃', '으쓱', '말랑', '뽀득', '주섬', '느릿', '까딱'];
  // ---------- 침입자 ----------
  const INV = {
    villager: { name: '마을 사람', g: 1, b: 5, hp: 24, atk: 5, df: 1, san: 10, gold: 10, asp: 'brood' },
    fisher: { name: '어부', g: 1, b: 5, hp: 26, atk: 4, df: 2, san: 12, gold: 10, asp: 'abyss' },
    militia: { name: '민병', g: 2, b: 10, hp: 35, atk: 9, df: 4, san: 20, gold: 20, asp: 'hunger', trapHalf: true },
    captain: { name: '민병대장', g: 2, b: 30, hp: 75, atk: 14, df: 8, san: 45, gold: 60, asp: 'hunger', trapHalf: true },
    detective: { name: '수사관', g: 2, b: 12, hp: 28, atk: 7, df: 3, san: 14, gold: 25, asp: 'dusk', rummage: true },
    apprentice: { name: '견습 학자', g: 2, b: 12, hp: 24, atk: 5, df: 2, san: 28, gold: 25, asp: 'nebula', ward: 0.15 },
    warrior: { name: '전사', g: 3, b: 25, hp: 70, atk: 14, df: 10, san: 30, gold: 35, asp: 'hunger' },
    smuggler: { name: '밀수꾼', g: 3, b: 20, hp: 40, atk: 12, df: 4, san: 24, gold: 45, asp: 'abyss', rummage: true, disarm: true },
    priest: { name: '성직자', g: 3, b: 25, hp: 45, atk: 6, df: 5, san: 40, gold: 35, asp: 'dusk', heal: true },
    scholar: { name: '학자', g: 3, b: 25, hp: 35, atk: 6, df: 3, san: 45, gold: 40, asp: 'nebula', seal: true },
    herbalist: { name: '약초꾼', g: 3, b: 20, hp: 45, atk: 8, df: 4, san: 26, gold: 35, asp: 'brood', revive: true },
    soldier: { name: '병사', g: 4, b: 30, hp: 80, atk: 15, df: 14, san: 40, gold: 30, asp: 'hunger', breach: true },
    chaplain: { name: '종군 사제', g: 4, b: 30, hp: 55, atk: 8, df: 8, san: 60, gold: 35, asp: 'dusk', ward: 0.3 },
    sealer: { name: '봉인자', g: 5, b: 60, hp: 190, atk: 20, df: 14, san: 120, gold: 150, asp: 'nebula', trapHalf: true, ward: 0.3, twice: true },
  };
  Object.assign(INV, {
    hound: { name: '사냥개', g: 1, b: 6, hp: 18, atk: 8, df: 1, san: 60, gold: 0, asp: 'hunger', fast: true },
    handler: { name: '사냥개 조련사', g: 2, b: 26, hp: 60, atk: 12, df: 6, san: 40, gold: 50, asp: 'brood', boss: '개들이 처음 두 칸을 건너뛰어 달려 들어온다' },
    sapper: { name: '공병대장', g: 3, b: 34, hp: 95, atk: 14, df: 12, san: 45, gold: 70, asp: 'abyss', sap: true, trapHalf: true, boss: '지나가는 방마다 첫 번째 함정을 꺼 버린다' },
  });
  INV.torch = { name: '횃불꾼', g: 3, b: 22, hp: 50, atk: 10, df: 6, san: 50, gold: 30, asp: 'dusk' };
  INV.captain.boss = '민병의 공격 +20%'; INV.sealer.boss = '함정 피해 절반, 한 번에 두 번 친다';
  const GRADE_NAME = ['', '마을 사람들', '민병대', '사냥꾼 무리', '병단', '봉인단'];
  const VILL = {
    gaet: { name: '갯마을', asp: 'abyss', wealth: 40, df: 10, plot: 0, x: ['fisher', 'fisher', 'smuggler'] },
    field: { name: '너른들', asp: 'brood', wealth: 40, df: 10, plot: 0, x: ['villager', 'villager', 'herbalist'] },
    bell: { name: '종탑 마을', asp: 'dusk', wealth: 60, df: 20, plot: 1, x: ['villager', 'detective', 'priest'] },
    school: { name: '학술원 마을', asp: 'nebula', wealth: 60, df: 20, plot: 2, x: ['villager', 'apprentice', 'scholar'] },
    fort: { name: '병영 도시', asp: 'hunger', wealth: 80, df: 30, plot: 2, x: ['villager', 'militia', 'warrior'] },
  };
  VILL.gaet.chief = ['선주', '탐욕스럽다. 이 마을 포로의 몸값 +50%. 대신 교역에서는 절반만 내놓는다'];
  VILL.field.chief = ['촌장', '겁이 많다. 위협하면 공물을 2배로 바친다. 약탈하면 교역이 영영 끊긴다'];
  VILL.bell.chief = ['종지기', '완고하다. 이 마을의 적의는 하루에 1씩만 가라앉는다'];
  VILL.school.chief = ['학장', '호기심이 많다. 공포가 높을수록 이 마을에서 더 자주 온다'];
  VILL.fort.chief = ['사령관', '앙심을 품는다. 이 마을 사람이 죽을 때마다 적의 +2'];
  const VIDS = Object.keys(VILL);
  // ---------- 진화 ----------
  const FORM1 = {
    abyss: { name: '젖은 것', skill: '본체 방 아군이 받는 피해 −30%, 매 라운드 HP 5% 회복', spell: ['해일', 6, '무리를 앞 칸으로 밀어내 그 칸을 다시 치르게 한다'] },
    nebula: { name: '빛나는 것', skill: '밤 개입 +1', spell: ['틈', 6, '무리의 절반을 입구로 되돌려 보낸다'] },
    brood: { name: '불어나는 것', skill: '매일 아침 움 1마리 (최대 6)', spell: ['급속 부화', 5, '이 싸움에 움 3마리를 불러낸다'] },
    dusk: { name: '속삭이는 것', skill: '본체를 본 적의 정신력 피해 2배, 무릎 꿇음 +15%p', spell: ['환영', 8, '무리 전원의 정신력을 크게 깎는다'] },
    hunger: { name: '씹는 것', skill: '본체 공격 +30%, 처치할 때마다 공격 +10%', spell: ['한 입', 8, '가장 튼튼한 적에게 본체 공격 4배 피해. 쓰러지면 바로 먹는다'] },
  };
  const FORM2UP = { abyss: '피해 −45%, 회복 8%', nebula: '개입 +2, 주문 신앙 −2', brood: '움 하루 2마리, 움 능력치 +50%', dusk: '무릎 꿇음 +30%p, 달아난 광란자가 공포를 올리지 않음', hunger: '처치당 공격 +20%, 포식 정수 +1' };
  const SUBTRAIT = { abyss: '본체가 쓰러졌을 때 털리는 재물 −40%', nebula: '다가오는 무리의 자세한 구성이 보인다', brood: '다친 권속이 쉬지 않고 복귀 (하루 2명)', dusk: '개종 성공률 +20%p', hunger: '시체 정수 +1' };
  const FORM2 = {
    abyss_nebula: '조수의 눈', abyss_brood: '알 품는 웅덩이', abyss_dusk: '익사자의 노래', abyss_hunger: '삼키는 소용돌이',
    nebula_abyss: '가라앉은 별', nebula_brood: '포자 성단', nebula_dusk: '거꾸로 뜬 달', nebula_hunger: '빛을 먹는 점',
    brood_abyss: '늪의 어미', brood_nebula: '천 개의 싹', brood_dusk: '웃는 군체', brood_hunger: '이빨 밭',
    dusk_abyss: '젖은 가면', dusk_nebula: '별을 읽는 입', dusk_brood: '합창하는 살', dusk_hunger: '굶주린 설교자',
    hunger_abyss: '바닥 없는 아가리', hunger_nebula: '궤도를 씹는 것', hunger_brood: '제 새끼를 먹는 것', hunger_dusk: '웃으며 먹는 것',
  };
  const AVATAR = { child: '빵을 나눠 먹은 것', h_abyss: '말라붙은 바다', h_nebula: '눈 감은 별', h_brood: '외동', h_dusk: '막 뒤의 것', h_hunger: '단식하는 입', abyss: '잠든 해구의 주인', nebula: '별 사이를 여는 자', brood: '끝없이 낳는 숲', dusk: '마지막 막의 연출가', hunger: '모든 것의 마지막 한 입', none: '깨어나지 않은 것', pure: '아무것도 아닌 것' };
  const MUT = {
    tentacle: { name: '촉수', asp: 'abyss', desc: '본체 방에서 매 라운드 추가 타격' }, gills: { name: '아가미', asp: 'abyss', desc: '휴식 회복 40% → 70%' },
    thirdeye: { name: '셋째 눈', asp: 'nebula', desc: '다가오는 무리의 자세한 구성이 보인다' }, ring: { name: '떠 있는 고리', asp: 'nebula', desc: '손 주문 신앙 비용 −2' },
    spore: { name: '포자', asp: 'brood', desc: '적이 쓰러지면 20% 확률로 그 싸움에 움이 돋는다' }, mouth: { name: '여벌의 입', asp: 'brood', desc: '포식 한 번에 6구' },
    maskm: { name: '가면', asp: 'dusk', desc: '아군이 주는 정신력 피해 +25%' }, whisper: { name: '속삭임', asp: 'dusk', desc: '개종 성공률 +15%p' },
    teeth: { name: '이빨 줄', asp: 'hunger', desc: '본체가 처치할 때마다 HP 8% 회복' }, steelgut: { name: '강철 위', asp: 'hunger', desc: '시체 정수 +1' },
  };
  const DIFF = { 1: { name: '첫 각성', mult: 1, score: 1 }, 2: { name: '깊은 각성', mult: 1.4, score: 1.1 }, 3: { name: '끝없는 밤', mult: 1.65, score: 1.25 } };
  const GRADES = [['SSS', 23000], ['SS', 19000], ['S', 15500], ['A', 12000], ['B', 9000], ['C', 6000], ['D', 0]];
  const EVENTS = {
    feeder: { title: '떠돌이 먹이 상인', text: '수레에 이상한 냄새가 나는 꾸러미가 가득하다. "속성 진한 놈으로만 골라 왔수다."', min: 2 },
    traveler: { title: '길 잃은 여행자', text: '초보 여행자 하나가 둥지 앞에서 지도를 거꾸로 들고 있다.', min: 2 },
    meteor: { title: '유성우', text: '밤새 별똥별이 쏟아졌다. 구덩이마다 낯익은 빛이 고여 있다.', min: 2 },
    trainer: { title: '떠돌이 교관', text: '흉터투성이 교관이 권속들을 훑어본다. "돈만 주면 하루 만에 괴물 만들어 주지."', min: 5 },
    box: { title: '수상한 상자', text: '입구 앞에 누가 상자를 두고 갔다. 안에서 달그락거린다.', min: 2 },
    informer: { title: '밀고자', text: '후드를 눌러쓴 자가 속삭인다. "다음에 올 놈들이 누군지 압니다. 값만 맞으면."', min: 5 },
    dream: { title: '꿈', text: '잠결에 몸 어딘가가 간지럽다. 뭔가 돋으려 한다.', min: 7 },
    pilgrims: { title: '순례자 무리', text: '누더기를 걸친 무리가 동굴을 향해 절을 하고 있다.', min: 5 },
    informer2: { title: '밀고자의 다른 손님', text: '지난번 그 밀고자가 마을에도 네 둥지 얘기를 팔고 있었다. 오늘 또 왔다. 아무 일 없다는 얼굴로.', min: 99 },
    pilgrims2: { title: '순례자들의 청', text: '굴 앞에 자리 잡은 순례자들이 다시 왔다. 맨 앞의 늙은이가 입을 연다. "절할 곳을 하나만 내어 주십시오."', min: 99 },
    mapper1: { title: '측량꾼', text: '낯선 자가 입구 앞에서 줄자를 펴고 뭔가를 적고 있다. 학술원 마을에서 온 지도 제작자다.', min: 99 },
    mapper2: { title: '측량꾼의 지도', text: '며칠 전 그 측량꾼의 일이 다시 불거졌다.', min: 99 },
    tax: { title: '세금 징수원', text: '징수원이 장부를 펼친다. "동굴에도 재산세는 붙습니다."', min: 5 },
  };

  // ---------- 옛 것과 징조 (7일째부터) ----------
  // 판마다 다 자란 옛 것 하나가 지켜본다. 밤이 지나면 뒤척이고, 다음 날의 규칙이 하나 바뀐다.
  const ELDER = {
    abyss: { name: '잠든 해구', text: '깊은 곳에서 자는 것. 시끄러운 것을 싫어한다.', likes: ['rest', 'dig', 'ransom'], hates: ['raid1', 'raid2', 'stolen'], omens: ['tide', 'silence', 'wetwall', 'gaze', 'star'] },
    nebula: { name: '거꾸로 뜬 눈', text: '위에서 내려다보는 것. 솜씨를 보고 싶어 한다.', likes: ['spell', 'convert', 'train'], hates: ['eat', 'rest'], omens: ['star', 'eye', 'dust', 'gaze', 'longday'] },
    brood: { name: '천 개의 싹', text: '불어나는 것. 식구가 느는 것을 좋아한다.', likes: ['accept', 'capture', 'dig'], hates: ['sacrifice', 'raid2'], omens: ['sprout', 'longday', 'wetwall', 'dust', 'tide'] },
    dusk: { name: '마지막 막', text: '구경하는 것. 싱겁게 끝나는 것을 싫어한다.', likes: ['raid0', 'capture', 'spell'], hates: ['ransom', 'quiet'], omens: ['whisper', 'moon', 'star', 'eye', 'silence'] },
    hunger: { name: '빈 접시', text: '늘 배고픈 것. 살려 보내는 것을 싫어한다.', likes: ['eat', 'sacrifice', 'kill'], hates: ['ransom', 'convert'], omens: ['hungry', 'moon', 'whisper', 'sprout', 'longday'] },
  };
  const ACT_NAME = { rest: '휴식', dig: '굴 파기', ransom: '몸값 받고 풀어 주기', raid0: '마을 위협', raid1: '마을 약탈', raid2: '마을 초토화', stolen: '쓰러져 재물을 털림', spell: '손 주문', convert: '개종', train: '훈련', eat: '포식', accept: '권속 들이기', capture: '포로 잡기', sacrifice: '제물', quiet: '행동을 남김', kill: '하룻밤 셋 이상 처치' };
  const OMEN = {
    tide: { name: '밀물', boon: '오늘 밤 함정이 1명씩 더 맞힌다', bane: '해가 지면 재물의 10%가 쓸려 간다' },
    star: { name: '별이 운다', boon: '오늘 밤 침입자의 정신력 −25%', bane: '해가 지면 권속 하나가 겁먹고 오늘 밤 쉰다' },
    hungry: { name: '배고픈 밤', boon: '오늘 밤 본체 공격 +40%', bane: '해가 지면 먹이 2구가 사라진다' },
    silence: { name: '침묵', boon: '오늘 밤은 아무도 오지 않는다 (큰 밤이면 침입자 체력 −15%)', bane: '오늘 밤 개입 −1' },
    moon: { name: '살찐 달', boon: '오늘 밤 침입자의 소지금 +50%', bane: '오늘 밤 침입자 방어 +20%' },
    eye: { name: '깨어 있는 눈', boon: '오늘 밤 개입 +1', bane: '해가 지면 신앙 −5' },
    sprout: { name: '싹트는 굴', boon: '아침에 움 2마리가 돋았다', bane: '오늘 급여가 2배다' },
    whisper: { name: '속삭임', boon: '오늘 밤 광란한 자가 무릎 꿇을 확률 +20%p', bane: '오늘 밤 침입자 공격 +15%' },
    longday: { name: '긴 낮', boon: '오늘 행동 +1', bane: '오늘 밤 침입자 체력 +15%' },
    wetwall: { name: '젖은 벽', boon: '오늘 밤 권속 방어 +30%', bane: '오늘 밤 함정 피해 −30%' },
    dust: { name: '별가루 비', boon: '아침에 정수 +4가 내렸다', bane: '해가 지면 모든 마을의 적의 +5' },
    gaze: { name: '돌아보는 것', boon: '아침에 신앙 +6이 고였다', bane: '오늘 밤 본체 방어 −25%' },
  };
  const OMEN_IDS = Object.keys(OMEN), OMEN_DAY = K.act + 1, CALM_COST = 6;

  const STAR = {
    none: { name: '고요한 하늘', desc: '바뀌는 규칙이 없다' },
    poor: { name: '가난한 별', desc: '시작 재물 100. 대신 지원자 계약금이 절반' },
    quiet: { name: '조용한 별', desc: '공포가 절반만 오른다. 대신 침입자의 소지금 −10%' },
    loud: { name: '시끄러운 별', desc: '매일 밤 온다. 무리가 20% 크다. 대신 소지금 +20%' },
    lone: { name: '외톨이 별', desc: '권속을 3명까지만 들인다. 대신 본체 능력치 1.1배' },
    faith: { name: '믿음의 별', desc: '예배당과 신도 둘로 시작한다. 대신 시작 재물 150' },
    glass: { name: '유리 별', desc: '본체 체력 절반. 대신 얻는 정수 +20%' },
  };

  // ---------- 유틸 ----------
  function rng(G) { let t = (G.seed = (G.seed + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const pick = (G, a) => a[Math.floor(rng(G) * a.length)];
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const dmg = (atk, df) => Math.max(1, atk * (1 - df / (df + 20)));
  const actOf = G => Math.min(5, Math.floor((G.day - 1) / K.act) + 1);
  const cm = G => K.cost[actOf(G)], sm = G => K.stat[actOf(G)];
  const isSettle = G => G.day % K.act === 0;
  const expNeed = l => K.expBase * Math.pow(K.expGrowth, l - 1);
  function giveExp(o, x) { o.exp += x; let up = 0; while (o.exp >= expNeed(o.lv)) { o.exp -= expNeed(o.lv); o.lv++; up++; } return up; }
  function earn(G, x, why) { G.gold += x; G.ledger[why] = (G.ledger[why] || 0) + x; if (x > 0) G.stats.income[why] = (G.stats.income[why] || 0) + x; }
  function spend(G, x, why) { G.gold -= x; G.ledger[why] = (G.ledger[why] || 0) - x; }
  const say = (G, s) => { G.log.push('[' + G.day + '일] ' + s); if (G.log.length > 200) G.log.shift(); };
  const fail = msg => ({ ok: false, msg }), ok = msg => ({ ok: true, msg });
  const ob = (G, id) => !!G.omen && G.omen.id === id && G.omen.tier !== 'bane';                     // 좋은 쪽이 살아 있는가
  const ox = (G, id) => !!G.omen && G.omen.id === id && G.omen.tier !== 'boon' && !G.omen.calmed;  // 나쁜 쪽이 살아 있는가
  function note(G, act) { if (!G.eld || G.day < OMEN_DAY) return; const e = ELDER[G.eld.id]; if (e.likes.includes(act)) G.eld.tally++; if (e.hates.includes(act)) G.eld.tally--; }
  function calm(G) {
    if (!G.omen || G.omen.tier === 'boon') return fail('달랠 것이 없습니다'); if (G.omen.calmed) return fail('이미 달랬습니다');
    if (G.faith < CALM_COST) return fail('신앙이 부족합니다 (' + CALM_COST + ')');
    G.faith -= CALM_COST; G.omen.calmed = true; G.stats.calms = (G.stats.calms || 0) + 1; return ok('신앙을 바쳤다. 나쁜 쪽은 일어나지 않는다');
  }
  // 해가 질 때: 남긴 행동만큼 쉬고, 징조의 나쁜 쪽 중 바로 일어나는 것을 치른다
  function dusk(G) {
    if (G.event) { const r = resolveEvent(G, eventOptions(G).length - 1); if (!r.ok) G.event = null; }
    if (G.guest) { const r = resolveGuest(G, guestOptions(G).length - 1); if (!r.ok) G.guest = null; }
    const s = slimeStats(G); if (G.ap > 0) { G.slime.hp = Math.min(s.hp, G.slime.hp + s.hp * 0.15 * G.ap); note(G, 'quiet'); }
    if (ox(G, 'tide')) { const x = Math.round(Math.max(0, G.gold) * 0.1); if (x) spend(G, x, '징조'); }
    if (ox(G, 'star')) { const c = G.kin.filter(m => m.loc !== null && m.kind !== 'spawn' && !m.hurt && !m.strike); if (c.length) { const m = pick(G, c); m.strike = 1; say(G, '징조: ' + m.name + '이(가) 겁먹고 쉰다'); } }
    if (ox(G, 'hungry')) G.corpses.splice(0, 2);
    if (ox(G, 'eye')) G.faith = Math.max(0, G.faith - 5);
    if (ox(G, 'dust')) VIDS.forEach(v => { G.vill[v].host += 5; });
  }
  const has = (G, m) => G.slime.muts.includes(m);
  const hasRoom = (G, t) => G.cells.some((c, i) => c.dug && c.type === t && !G.off[i]);
  const countRoom = (G, t) => G.cells.filter(c => c.dug && c.type === t).length;
  const formId = G => G.slime.stage === 0 ? 'base' : G.slime.stage === 1 ? G.slime.main : G.slime.main + '_' + G.slime.sub;
  const formName = G => G.slime.stage === 0 ? ((G.origin && ORIGIN[G.origin]) || ORIGIN.drop).title : G.slime.stage === 1 ? FORM1[G.slime.main].name : (G.slime.stage === 3 ? '겹쳐진 ' : G.slime.stage >= 4 ? '거대한 ' : '') + FORM2[formId(G)];
  const essTotal = G => ASPECTS.reduce((a, k) => a + G.slime.ess[k], 0);
  const fearGrade = G => G.fear < 25 ? 1 : G.fear < 60 ? 2 : G.fear < 110 ? 3 : 4;
  const faithCap = G => K.faithCap + 20 * countRoom(G, 'chapel') + (G.faithBonus || 0);
  const addFaith = (G, x) => { G.faith = clamp(G.faith + x, 0, faithCap(G)); };
  const addEss = (G, asp, x) => { G.slime.ess[asp] += G.star === 'glass' ? Math.round(x * 1.2) : x; };
  const corpseCap = G => K.corpseCap + (hasRoom(G, 'table') ? 6 : 0);
  const corpsePts = (G, kind) => Math.floor((G.origin === 'maw' ? 1.25 : 1) * INV[kind].g * 2) + (has(G, 'steelgut') ? 1 : 0) + (hasRoom(G, 'abattoir') ? 1 : 0) + (G.slime.stage >= 2 && (G.slime.main === 'hunger' || G.slime.sub === 'hunger') ? 1 : 0);
  function addCorpse(G, kind) { G.corpses.push({ kind }); while (G.corpses.length > corpseCap(G)) G.corpses.shift(); }
  function eatN(G, n) { const out = {}; G.corpses.splice(0, n).forEach(c => { const a = INV[c.kind].asp, p = corpsePts(G, c.kind); addEss(G, a, p); out[a] = (out[a] || 0) + p; }); return Object.keys(out).map(a => ASP[a] + ' +' + out[a]).join(', '); }

  // ---------- 방 조합: 맞닿은 두 시설 ----------
  const COMBO = {
    confess: { name: '고해소', a: 'prison', b: 'chapel', desc: '개종 +15%p, 포로 밥값 없음' },
    queue: { name: '대기 줄', a: 'prison', b: 'ritual', desc: '제물의 정수 +2' },
    corridor: { name: '죽음의 복도', a: 'trap', b: 'trap', desc: '두 함정방의 함정 피해 +30%' },
    throne: { name: '옥좌', a: 'altar', b: 'core', desc: '본체를 마주한 적의 정신력 피해 +50%' },
  };
  function combos(G) { const out = []; for (const id in COMBO) { const c = COMBO[id], cells = []; G.cells.forEach((x, i) => { if (x.dug && x.type === c.a && nbrs(i).some(j => j !== i && G.cells[j].dug && G.cells[j].type === c.b)) { cells.push(i); nbrs(i).forEach(j => { if (G.cells[j].dug && G.cells[j].type === c.b) cells.push(j); }); } }); if (cells.length) out.push({ id, name: c.name, desc: c.desc, cells: [...new Set(cells)] }); } return out; }
  const combo = (G, id, cell) => { const c = combos(G).find(x => x.id === id); return !!c && (cell == null || c.cells.includes(cell)); };

  // 교역: 사이가 좋은 날마다 신뢰가 쌓이고, 신뢰만큼 교역이 커진다
  const trading = (G, v) => { const s = G.vill[v]; return !s.razed && !s.tribute && s.host < 15 && !s.noTrade; };
  const trustCap = G => G.origin === 'maw' ? 0 : K.trustCap[fearGrade(G)];
  const tradeOf = (G, v) => Math.round((v === 'gaet' ? 1.5 : 3) * cm(G) * (1 + K.trustGain * (G.vill[v].trust || 0)) * (G.origin === 'coin' ? 1.5 : 1));
  // 목숨: 본체가 몇 번 더 쓰러질 수 있는가 (마지막 밤은 예외)
  const livesMax = G => K.falls[G.diff] + hoardN(G, 'life'), lives = G => Math.max(0, livesMax(G) - (G.falls || 0));
  function migrate(G) { if (!G.origin) G.origin = 'drop'; if (G.slime && !G.slime.origin) G.slime.origin = G.origin; if (G.cells[18] && G.cells[18].type === 'vault') { G.cells[18].type = 'core'; G.cells[19] = { dug: false, block: false, type: 'empty', lv: 1, exp: 0, traps: [], zone: false }; } if (G.falls == null) G.falls = G.spared ? 1 : 0; if (!G.eld) G.eld = { id: G.startAsp, favor: 0, tally: 0 }; return G; }
  // ---------- 길 찾기 ----------
  const passable = (G, i) => G.cells[i].dug && !G.cells[i].block && i !== CORE;
  function paths(G) {
    const d = new Array(N).fill(-1); d[CORE] = 0; const q = [CORE];
    while (q.length) { const u = q.shift(); for (const v of nbrs(u)) if (d[v] < 0 && passable(G, v)) { d[v] = d[u] + 1; q.push(v); } }
    if (d[ENT] < 0) return [];
    const out = [];
    (function walk(u, acc) { if (out.length >= 3) return; if (u === CORE) { out.push(acc.slice()); return; } for (const v of nbrs(u)) if (d[v] === d[u] - 1 && (v === CORE || passable(G, v))) { acc.push(v); walk(v, acc); acc.pop(); } })(ENT, [ENT]);
    return out;
  }
  function sideRooms(G) { const on = new Set([CORE]); paths(G).forEach(p => p.forEach(i => on.add(i))); return G.cells.map((c, i) => c.dug && !on.has(i) ? i : -1).filter(i => i >= 0); }

  // ---------- 새 판 ----------
  function newGame(seed, startAsp, opts) {
    opts = opts || {};
    const G = {
      seed: seed >>> 0, day: 1, ap: K.ap, spot: null, over: null, sign: SIGN[opts.sign] ? opts.sign : null, star: STAR[opts.star] ? opts.star : 'none', gold: (opts.star === 'poor' ? 100 : opts.star === 'faith' ? 150 : K.startGold) + (opts.origin === 'coin' ? 100 : 0), origin: ORIGIN[opts.origin] ? opts.origin : 'drop', faith: 0, fear: 0, diff: opts.diff || 1,
      slime: { stage: 0, main: null, sub: null, hp: K.slime.hp, ess: { abyss: 0, nebula: 0, brood: 0, dusk: 0, hunger: 0 }, muts: [] },
      corpses: [], cells: [], plots: ['none', 'none', 'none'], vill: {}, kin: [], prison: [], applicants: [], nextId: 1,
      march: { tonight: null, tomorrow: null }, eld: { id: opts.elder || null, favor: 0, tally: 0 }, omen: null, omenNext: null, forceOmen: opts.forceOmen || null, d: {}, off: {}, event: null, eventDays: {}, ledger: {}, log: [], startAsp,
      detBonus: 1, known: false, sacrifices: 0,
      stats: { income: {}, repels: 0, kills: 0, battles: 0, stolen: 0, captives: 0, converts: 0, ransoms: 0, peak: K.startGold },
    };
    for (let i = 0; i < N; i++) G.cells.push({ dug: START.includes(i) || i === CORE, block: false, type: i === CORE ? 'core' : i === ENT ? 'trap' : 'empty', lv: 1, exp: 0, traps: i === ENT ? [{ kind: 'spike', lv: 1 }] : [], zone: false });
    VIDS.forEach(v => { G.vill[v] = { host: 0, tribute: 0, pause: 0, razed: false, trust: 0 }; });
    G.slime.origin = G.origin; G.slime.ess[startAsp] = 12; G.slime.hp = slimeStats(G).hp; if (!G.eld.id) G.eld.id = pick(G, ASPECTS); G.bossAlt = { [K.act]: rng(G) < 0.5, [2 * K.act]: rng(G) < 0.5 };
    G.buried = {}; { const und = G.cells.map((c, i) => c.dug ? -1 : i).filter(i => i >= 0), ts = Object.keys(BURIED); for (let k = 0; k < 3 && und.length; k++) G.buried[und.splice(Math.floor(rng(G) * und.length), 1)[0]] = ts.splice(Math.floor(rng(G) * ts.length), 1)[0]; }
    if (rng(G) < 0.6) G.eventDays[8] = 'mapper1';
    const pool = Object.keys(EVENTS);
    for (const d of [2, 5, 10, 16, 22, 27]) { const c = pool.filter(id => EVENTS[id].min <= d); if (c.length) { const id = pick(G, c); pool.splice(pool.indexOf(id), 1); G.eventDays[d] = id; } }
    (opts.legacy || []).forEach(l => { G.kin.push({ id: G.nextId++, name: l.name, kind: l.kind, lv: l.lv, exp: 0, loc: null, hurt: 0, skill: l.skill, rare: !!l.rare, stance: l.stance, legacy: true, rid: l.rid, title: l.title, evo: !!l.evo, age: 9, unpaid: 0 }); });
    if (G.star === 'faith') { G.cells[11].dug = true; G.cells[11].type = 'chapel'; for (let k = 0; k < 2; k++) G.kin.push({ id: G.nextId++, name: NAMES[Math.floor(rng(G) * NAMES.length)], kind: 'cultist', lv: 1, exp: 0, loc: null, hurt: 0, skill: -1, rare: false, age: 0, unpaid: 0 }); }
    G.kin.forEach(m => { m.loc = freeSlot(G, m.kind); });
    morning(G);
    return G;
  }
  // ---------- 별자리: 어디서 떨어졌는가. 품고 온 조각(징조)과 판의 규칙 하나가 정해진다. 고르지 못한다 ----------
  // need: 0 처음부터 · 1 한 판을 끝내면 · 2 한 번 깨어나면 · 3 두 번 깨어나면.  pts: 별의 자리 (100×60 안)
  const SIGN = {
    cradle: { name: '빈 요람자리', asp: 'brood', star: 'none', need: 0, text: '아무도 누운 적 없는 요람. 거기서 굴러떨어졌다.', pts: [[14, 20], [30, 40], [50, 48], [70, 40], [86, 20], [50, 30]] },
    well: { name: '마른 우물자리', asp: 'abyss', star: 'none', need: 0, text: '바닥이 보이지 않는 우물. 물은 오래전에 여기로 떨어졌다.', pts: [[30, 8], [70, 8], [74, 30], [62, 52], [38, 52], [26, 30]] },
    saw: { name: '이 빠진 톱자리', asp: 'hunger', star: 'none', need: 0, text: '하늘을 썰다 만 톱. 빠진 이 하나가 너다.', pts: [[8, 44], [22, 22], [36, 44], [50, 22], [64, 44], [78, 22], [92, 44]] },
    anchor: { name: '가라앉은 닻자리', asp: 'abyss', star: 'quiet', need: 1, text: '소리 없이 가라앉는 닻. 떨어지는 소리도 나지 않았다.', pts: [[50, 6], [50, 46], [26, 36], [34, 52], [50, 56], [66, 52], [74, 36]] },
    purse: { name: '빈 주머니자리', asp: 'hunger', star: 'poor', need: 1, text: '뒤집어 턴 주머니. 금화는 대부분 오다가 흩어졌다.', pts: [[36, 8], [64, 8], [58, 22], [78, 44], [50, 56], [22, 44], [42, 22]] },
    pot: { name: '끓는 솥자리', asp: 'brood', star: 'loud', need: 1, text: '뚜껑이 들썩이는 솥. 떨어질 때 온 들판이 그 소리를 들었다.', pts: [[18, 18], [82, 18], [76, 44], [60, 56], [40, 56], [24, 44], [50, 6]] },
    mask: { name: '뒤집힌 가면자리', asp: 'dusk', star: 'none', need: 2, text: '안쪽을 보이며 걸린 가면. 얼굴이 닿던 자리에서 떨어졌다.', pts: [[24, 10], [76, 10], [84, 34], [64, 54], [36, 54], [16, 34], [38, 28], [62, 28]] },
    choir: { name: '눈먼 성가대자리', asp: 'dusk', star: 'faith', need: 2, text: '줄지어 선 별들이 보이지 않는 것을 향해 노래한다. 그 노래가 너를 따라 내려왔다.', pts: [[10, 40], [26, 28], [42, 40], [58, 28], [74, 40], [90, 28], [50, 10]] },
    tower: { name: '외딴 등대자리', asp: 'nebula', star: 'lone', need: 3, text: '아무 배도 지나지 않는 등대. 불빛만 떨어져 나왔다.', pts: [[50, 4], [42, 20], [58, 20], [38, 54], [62, 54], [20, 12], [80, 12]] },
    crown: { name: '유리 왕관자리', asp: 'nebula', star: 'glass', need: 3, text: '손대면 깨질 듯한 왕관. 가장 밝은 조각이 떨어졌다.', pts: [[12, 46], [22, 14], [36, 34], [50, 8], [64, 34], [78, 14], [88, 46]] },
  };
  // ---------- 형질: 판을 하다 보면 하는 짓에 따라 몸에 돋는 것. 한 판에 하나. 장점 하나와 단점 하나 ----------
  const ORIGIN = {
    drop: { name: '아직 없음', title: '옛 것?', text: '아직 아무것도 돋지 않았다.', good: '치우침이 없다', bad: '없음' },
    shell: { name: '껍데기 쓴 것', title: '옛 것?', ev: ['굳어 가는 것', '맞은 자리의 살이 딱딱하게 굳어 간다. 깨진 알껍데기 같은 것이 등을 덮기 시작했다.', '쓰러졌다 일어나거나, 죽기 직전까지 몰린 밤을 두 번 넘기면'], cond: G => (G.falls || 0) >= 1 || (G.stats.close || 0) >= 2, text: '깨진 알껍데기 같은 것이 등을 덮었다. 잘 깨지지 않는다.', good: '본체 방어 +50%, 체력 +20%', bad: '본체 공격 −25%', hp: 1.2, atk: 0.75, df: 1.5 },
    root: { name: '뿌리 내린 것', title: '옛 것?', ev: ['벽 속의 가닥', '파 놓은 굴마다 가느다란 가닥이 뻗어 있다. 잘라도 다음 날이면 다시 자란다. 네 몸에서 나온 것이다.', '굴을 넷 넘게 파면'], cond: G => (G.stats.dug || 0) >= 4, text: '굴 벽을 따라 뿌리가 뻗었다. 굴이 곧 몸이다.', good: '굴 파기 값 절반, 시설 유지비 없음', bad: '본체 체력 −20%', hp: 0.8 },
    maw: { name: '입이 벌어진 것', title: '옛 것?', ev: ['먼저 벌어지는 것', '먹을 때마다 몸 한쪽이 먼저 벌어진다. 이제는 먹지 않을 때도 닫히지 않는다.', '많이 죽이고 많이 먹으면'], cond: G => G.stats.kills >= 30 && (G.stats.eats || 0) >= 5, text: '닫히지 않는 입이 생겼다. 먹는 것 말고는 관심이 없다.', good: '포식 정수 +25%, 본체 공격 +15%', bad: '권속이 겁을 먹어 급여 +30%, 마을이 거래하지 않는다', atk: 1.15 },
    lamp: { name: '등불 든 것', title: '옛 것?', ev: ['어둠 속의 깜빡임', '신도들이 네 머리 위를 보며 무릎을 꿇는다. 거기 무언가가 돋아 빛나고 있다.', '신도 둘을 거느리면'], cond: G => G.kin.filter(m => m.kind === 'cultist').length >= 2, text: '머리 위에 빛나는 것이 돋았다. 그 빛을 보고 찾아오는 자들이 있다.', good: '매일 신앙 +3, 개종 확률 +20%p, 신도는 급여를 받지 않는다', bad: '본체 체력 −10%', hp: 0.9 },
    coin: { name: '금화 품은 것', title: '옛 것?', ev: ['박힌 금화', '깔고 앉은 금화 몇 닢이 살에 박혀 떨어지지 않는다. 박힌 자리가 따뜻하다.', '재물을 많이 쌓거나 삼키면'], cond: G => G.gold >= 600 * cm(G) || hoardN(G, 'gulp') >= 1, text: '금화가 살에 박혔다. 금 냄새가 난다.', good: '교역 +50%, 탐식 값 −20%, 돋을 때 재물을 조금 토해 낸다', bad: '금 냄새에 무리가 15% 더 온다. 쓰러지면 재물의 80%를 털린다' },
  };
  const org = G => (G && G.origin && ORIGIN[G.origin] ? G.origin : 'drop'), isO = (G, k) => org(G) === k;
  const digCost = G => Math.round(40 * cm(G) * (isO(G, 'root') ? 0.5 : 1));
  const TRAITS = ['shell', 'root', 'maw', 'lamp', 'coin'];
  const traitReady = G => isO(G, 'drop') && G.day >= 4 ? TRAITS.filter(k => !(G.traitNo && G.traitNo[k]) && ORIGIN[k].cond(G)) : [];
  function takeTrait(G, k) {
    const before = slimeStats(G).hp; G.origin = k; G.slime.origin = k; G.slime.hp = Math.max(1, G.slime.hp * slimeStats(G).hp / before); G.stats.trait = k; G.traitDay = G.day;
    if (k === 'coin') earn(G, 150 * cm(G), '형질'); return '몸에 무언가 돋았다 — ' + ORIGIN[k].name;
  }
  // ---------- 탐식: 깔고 앉은 재물을 삼켜 힘으로 바꾼다 ----------
  const HOARD = {
    gulp: { name: '재물을 삼킨다', base: 150, grow: 1.8, max: 99, hp: 0.06, atk: 0.03, desc: '본체 최대 체력 +6%, 공격·방어 +3%. 삼킬 때마다 값이 오른다' },
    seat: { name: '황금 호위석', base: 300, grow: 1, max: 1, desc: '본체 방 호위 자리 +1' },
    life: { name: '허물 하나 더', base: 500, grow: 1, max: 1, desc: '목숨 +1. 한 번 더 쓰러져도 일어난다' },
    veil: { name: '별 가리기', base: 700, grow: 1, max: 1, act: 4, cut: 0.15, desc: '마지막 밤에 오는 무리의 체력·공격 −15%' },
  };
  const hoardN = (G, k) => (G.hoard && G.hoard[k]) || 0;
  const hoardCost = (G, k) => Math.round(HOARD[k].base * cm(G) * Math.pow(HOARD[k].grow, hoardN(G, k)) * (isO(G, 'coin') ? 0.8 : 1));
  function hoardWhy(G, k) { const d = HOARD[k]; if (!d) return '없는 것입니다'; if (hoardN(G, k) >= d.max) return '더는 할 수 없습니다'; if (d.act && actOf(G) < d.act) return d.act + '막부터 할 수 있습니다'; if (G.gold < hoardCost(G, k)) return '재물이 부족합니다 (' + hoardCost(G, k) + 'G)'; return null; }
  function hoardBuy(G, k) {
    const why = hoardWhy(G, k); if (why) return fail(why); const cost = hoardCost(G, k), before = slimeStats(G).hp;
    spend(G, cost, '탐식'); G.hoard = G.hoard || {}; G.hoard[k] = hoardN(G, k) + 1; G.stats.hoard = (G.stats.hoard || 0) + cost; note(G, 'gulp');
    if (k === 'gulp') { G.slime.hp += slimeStats(G).hp - before; return ok('재물을 삼켰다. 본체가 불어났다 (−' + cost + 'G)'); }
    if (k === 'seat') return ok('황금 호위석을 놓았다. 호위 자리 ' + capacity(G).core + ' (−' + cost + 'G)');
    if (k === 'life') return ok('허물을 하나 더 둘렀다. 목숨 ' + lives(G) + ' (−' + cost + 'G)');
    return ok('별을 가렸다. 마지막 밤의 무리가 약해진다 (−' + cost + 'G)');
  }
  function slimeStats(G) {
    const t = K.tier[G.slime.stage], m = G.slime.main;
    const x = G.star === 'lone' ? 1.1 : 1, g = hoardN(G, 'gulp'), gh = 1 + HOARD.gulp.hp * g, ga = 1 + HOARD.gulp.atk * g, O = ORIGIN[org(G)]; return { hp: K.slime.hp * t * x * (G.star === 'glass' ? 0.5 : 1) * gh * (O.hp || 1), atk: K.slime.atk * t * x * (m === 'hunger' ? 1.3 : 1) * ga * (O.atk || 1), df: K.slime.df * t * x * ga * (O.df || 1) };
  }
  function kinStats(G, m) {
    const d = KIN[m.kind], g = Math.pow(K.lvGrowth, m.lv - 1) * (m.rare ? 1.4 : 1) * (m.evo ? 1.5 : 1) * (m.kind === 'spawn' && m.skill === 2 && m.age >= 3 ? 2 : 1) * (m.kind === 'spawn' && G.slime.main === 'brood' && G.slime.stage >= 2 ? 1.5 : 1);
    return { hp: d.hp * g, atk: d.atk * g, df: d.df * g, satk: (d.satk || 0) * g };
  }
  const salary = (G, m) => G.origin === 'lamp' && m.kind === 'cultist' ? 0 : KIN[m.kind].pay * cm(G) * (1 + 0.1 * m.lv) * (m.evo ? 1.5 : 1) * (G.origin === 'maw' ? 1.3 : 1);
  const upkeep = G => G.origin === 'root' ? 0 : (G.kin.some(m => m.kind === 'clerk' && m.evo) ? 0.6 : G.kin.some(m => m.kind === 'clerk') ? 0.75 : 1) * (G.cells.filter(c => c.dug && ROOM[c.type].cost > 0 && !c.free).length + G.plots.filter(p => p !== 'none').length) * cm(G);
  function capacity(G) { const c = { core: 2 + hoardN(G, 'seat') }; G.cells.forEach((x, i) => { if (x.dug && i !== CORE && ROOM[x.type].def) c[i] = ROOM[x.type].def; }); return c; }
  function freeSlot(G, kind) {
    const c = capacity(G), used = {}; G.kin.forEach(m => { if (m.loc !== null && m.kind !== 'spawn') used[m.loc] = (used[m.loc] || 0) + 1; });
    const order = Object.keys(c).filter(k => k !== 'core').map(Number).concat(['core']);
    if (kind === 'spawn') return order.length ? order[0] : 'core';
    for (const k of order) if ((used[k] || 0) < c[k]) return k;
    return null;
  }
  const prisonCap = G => 2 + 4 * countRoom(G, 'prison') + (G.kin.some(m => m.kind === 'warden') ? 2 : 0) + (G.kin.some(m => m.kind === 'warden' && m.skill === 1) ? 2 : 0) + (G.kin.some(m => m.kind === 'warden' && m.evo) ? 2 : 0);
  const handsMax = G => K.hands + (G.slime.main === 'nebula' ? (G.slime.stage >= 2 ? 2 : G.slime.stage >= 1 ? 1 : 0) : 0);
  const spellCost = G => G.slime.main ? Math.max(1, FORM1[G.slime.main].spell[1] - (has(G, 'ring') ? 2 : 0) - (G.slime.main === 'nebula' && G.slime.stage >= 2 ? 2 : 0) - (G.kin.some(m => m.kind === 'scribe' && m.skill === 2) ? 2 : 0)) : 99;
  const seesDetail = (G, v) => G.known || G.known2 || G.kin.some(m => m.kind === 'eyeheap') || has(G, 'thirdeye') || (G.slime.stage >= 2 && G.slime.sub === 'nebula') || G.plots[VILL[v].plot] === 'tower';

  // ---------- 아침 ----------
  function fearGradeAt(G, settle) { return settle ? Math.min(4, Math.max(fearGrade(G), actOf(G) + 1)) : Math.max(fearGrade(G), actOf(G) - 1); }
  function partyBudget(G, v, settle) {
    const plot = G.plots[VILL[v].plot];
    return (G.star === 'loud' ? 1.2 : 1) * (G.origin === 'coin' ? 1.15 : 1) * K.budget * K.size[actOf(G)] * (1 + G.fear / 150 + (Math.max(0, G.gold) + K.smell * ((G.stats && G.stats.hoard) || 0)) / (1500 * cm(G))) * (settle ? K.settle : 1) * ({ bramble: 0.8, camp: 1.3 }[plot] || 1) * DIFF[G.diff].mult * G.detBonus;
  }
  function partyKinds(G, v, settle, thin, day) {
    day = day || G.day; const alt = !!(G.bossAlt && G.bossAlt[day]); const final = day === K.days, g = final ? Math.max(3, fearGradeAt(G, true)) : fearGradeAt(G, settle), x = VILL[v].x;
    let B = partyBudget(G, v, settle) * (thin ? 0.7 : 1); const kinds = [];
    if (final) { kinds.push('sealer'); B -= 60; } else if (settle && day === K.act && alt) { kinds.push('handler', 'hound', 'hound', 'hound'); B -= 44; } else if (settle && day === 2 * K.act && alt) { kinds.push('sapper'); B -= 34; } else if (settle && g === 2) { kinds.push('captain'); B -= 30; }
    const seq = [null, [x[0]], ['militia', x[1], 'militia'], ['warrior', x[2], 'torch', x[1]], ['soldier', x[2], 'chaplain', 'warrior']][g];
    for (let i = 0; B >= INV[seq[i % seq.length]].b || !kinds.length; i++) { const k = seq[i % seq.length]; kinds.push(k); B -= INV[k].b; }
    return { g: final ? 5 : g, kinds };
  }
  function pickVillage(G) { const vs = VIDS.filter(v => !G.vill[v].razed); if (!vs.length) return 'field'; let tot = 0; const w = vs.map(v => (tot += 5 + G.vill[v].host + (v === 'school' ? G.fear / 5 : 0))); const r = rng(G) * tot; return vs[w.findIndex(x => r < x)]; }
  function morning(G) {
    G.ap = K.ap; G.d = { buildOps: Math.min(3, G.kin.filter(m => m.kind === 'digger').length + G.kin.filter(m => m.kind === 'digger' && m.evo).length), fear0: G.fear }; G.ledger = {}; G.off = {}; G.known = false;
    G.event = G.eventDays[G.day] ? { id: G.eventDays[G.day] } : null;
    if (!G.event) { const rd = traitReady(G); if (rd.length && rng(G) < 0.45) G.event = { id: 'trait_' + pick(G, rd) }; }
    // 오늘 밤과 내일 밤
    const sched = G.march.tomorrow; G.march.tonight = isSettle(G) ? { vill: (sched && sched.vill) || pickVillage(G), settle: true, thin: !!(sched && sched.thin) } : sched;
    const tmr = G.day + 1;
    if (tmr > K.days) G.march.tomorrow = null;
    else if (tmr % K.act === 0) G.march.tomorrow = { vill: pickVillage(G), settle: true };
    else { const p = clamp(0.45 + (G.mapSold ? 0.1 : 0) + Math.max(0, G.gold) / (3000 * cm(G)) + G.fear / 400, 0.10, 0.92); G.march.tomorrow = (tmr === 3 || G.star === 'loud' || rng(G) < p) ? { vill: tmr === 3 ? 'field' : pickVillage(G), settle: false } : null; }
    // 밤 손님: 평소 밤 대신 가끔 온다. 낮 동안 어떻게 맞을지 정한다
    G.guest = null;
    if (G.day >= 4 && G.march.tonight && !G.march.tonight.settle && !ob(G, 'silence') && rng(G) < 0.2) {
      const c = cm(G), ts = [];
      if (G.gold >= 150 * c) ts.push('merchant'); if (hasRoom(G, 'chapel') || G.faith >= 15) ts.push('pilgrims');
      if (actOf(G) === 1 && !G.child && G.fear < 25) ts.push('child', 'child'); if (actOf(G) >= 2 && !G.deserted) ts.push('deserter'); if (G.fear >= 60 && !G.poet) ts.push('poet', 'poet');
      if (ts.length) { G.guest = { type: pick(G, ts), vill: G.march.tonight.vill }; G.march.tonight = null; }
    }
    // 지상에 나타나는 것: 이틀 머문다
    if (G.spot && --G.spot.left <= 0) G.spot = null;
    if (!G.spot && G.day >= 2 && rng(G) < 0.6) { const ts = ['meteor', 'shrine', 'band', 'cart'].concat(G.march.tonight || G.march.tomorrow ? ['camp', 'camp'] : []), vs = VIDS.filter(v => !G.vill[v].razed); G.spot = { type: pick(G, ts), pos: Math.floor(rng(G) * 4), left: G.spotLong ? 3 : 2, vill: vs.length ? pick(G, vs) : 'field' }; }
    // 지원자
    G.applicants = [];
    if (G.day >= 1) {
      const w = {}; for (const k in KIN) w[k] = KIN[k].w + (KIN[k].room && hasRoom(G, KIN[k].room) ? (k === 'netter' || k === 'warden' ? 1.5 : k === 'clerk' ? 2 : 4) : 0); if ((G.stats.dug || 0) >= 3) w.digger = 1.5;
      w.cultist += 3 * countRoom(G, 'chapel') + Math.floor(G.fear / 25) + (G.pilgrimDay === G.day ? 6 : 0); w.spawn = 0;
      const ks = Object.keys(w).filter(k => w[k] > 0), tot = ks.reduce((a, k) => a + w[k], 0);
      for (let i = 0; i < 3; i++) { let r = rng(G) * tot, kind = ks[0]; for (const k of ks) { if (r < w[k]) { kind = k; break; } r -= w[k]; } G.applicants.push({ kind, rare: false, name: NAMES[Math.floor(rng(G) * NAMES.length)] }); }
      if (G.day === 1) { G.applicants[0].kind = 'goblin'; G.applicants[1].kind = 'skeleton'; }
      if (G.day > 1 && [11, 22, 33, 44, 55].includes(Math.floor(Math.max(0, G.gold)) % 100)) G.applicants[0].rare = true;
    }
    if (G.slime.main === 'brood' && G.slime.stage >= 1) for (let i = 0; i < (G.slime.stage >= 2 ? 2 : 1); i++) addSpawn(G);
    // 오늘의 징조: 좋은 쪽 가운데 아침에 바로 일어나는 것
    G.omen = G.omenNext || null; G.omenNext = null;
    if (ob(G, 'silence') && G.march.tonight && !G.march.tonight.settle) G.march.tonight = null;
    if (ob(G, 'sprout')) { addSpawn(G); addSpawn(G); }
    if (ob(G, 'longday')) G.ap++;
    if (ob(G, 'dust')) addEss(G, G.slime.main || G.startAsp, 4);
    if (ob(G, 'gaze')) addFaith(G, 6);
  }
  function addSpawn(G) { if (G.kin.filter(m => m.kind === 'spawn').length >= 6) return false; G.kin.push({ id: G.nextId++, name: '움', kind: 'spawn', lv: Math.max(1, actOf(G) * 3 - 2), exp: 0, loc: freeSlot(G, 'spawn'), hurt: 0, skill: -1, age: 0, unpaid: 0 }); return true; }
  function estimate(G, when) { const m = G.march[when]; if (!m) return null; const p = partyKinds(G, m.vill, m.settle, m.thin, when === 'tonight' ? G.day : G.day + 1), bk = p.kinds.find(k => INV[k].boss); return { vill: m.vill, boss: bk || null, thin: !!m.thin, settle: m.settle, grade: p.g, count: p.kinds.length, kinds: seesDetail(G, m.vill) ? p.kinds : null }; }

  // ---------- 굴을 파다 나오는 것: 판마다 세 칸 ----------
  const BURIED = { gold: '금맥', bones: '옛 뼈무더기', spring: '지하수', sealed: '봉인된 방', relic: '잊힌 제단' };
  function unearth(G, i) {
    const t = G.buried && G.buried[i]; if (!t) return null; delete G.buried[i]; const c = cm(G); G.stats.found = (G.stats.found || 0) + 1;
    if (t === 'gold') { earn(G, 60 * c, '금맥'); G.cells[i].free = true; return '금맥이 드러났다! +' + 60 * c + 'G. 이 칸의 시설은 유지비가 들지 않는다'; }
    if (t === 'bones') { for (let k = 0; k < 2; k++) { const m = { id: G.nextId++, name: NAMES[Math.floor(rng(G) * NAMES.length)], kind: 'skeleton', lv: Math.max(1, actOf(G) * 3 - 2) + 1, exp: 0, loc: freeSlot(G, 'skeleton'), hurt: 0, skill: -1, rare: false, age: 0, unpaid: 0 }; autoSkill(m); G.kin.push(m); } return '옛 뼈무더기가 일어났다. 해골 둘이 따라온다'; }
    if (t === 'spring') { G.cells[i].type = 'pool'; G.cells[i].free = true; return '지하수가 터졌다. 이 칸이 고인 웅덩이가 되었다'; }
    if (t === 'sealed') { const k = gainMut(G, null); G.fear += 8; return '봉인된 방이 열렸다. ' + (k ? '변이 ' + MUT[k].name + ', ' : '') + '공포 +8'; }
    G.faithBonus = (G.faithBonus || 0) + 10; addFaith(G, 12); return '잊힌 제단을 찾았다. 신앙 +12, 신앙 상한 +10';
  }

  // ---------- 낮 행동 ----------
  function useAp(G) { if (G.ap <= 0) return false; G.ap--; return true; }
  function buildOp(G) { if (G.d.buildOps <= 0) { if (!useAp(G)) return '행동이 남지 않았습니다'; G.d.buildOps = 3; } G.d.buildOps--; return null; }
  function pay(G, c, why) { if (G.gold < c) return false; if (c) spend(G, c, why); return true; }
  function canDig(G, i) { const c = G.cells[i]; if (!c || c.dug) return '이미 판 칸입니다'; if (!nbrs(i).some(j => G.cells[j].dug)) return '판 칸에 맞닿은 곳만 팔 수 있습니다'; return null; }
  function digPreview(G, i) {
    if (canDig(G, i)) return null; const a = paths(G); G.cells[i].dug = true; const b = paths(G); G.cells[i].dug = false;
    if (b[0].length < a[0].length) return 'short'; if (b.some(p => p.includes(i))) return 'split'; return 'side';
  }
  function dig(G, i) {
    const why = canDig(G, i); if (why) return fail(why);
    const cost = digCost(G); if (G.gold < cost) return fail('재물이 부족합니다 (' + cost + 'G)');
    const e = buildOp(G); if (e) return fail(e);
    pay(G, cost, '굴착'); G.cells[i].dug = true; G.stats.dug = (G.stats.dug || 0) + 1; note(G, 'dig');
    const found = unearth(G, i); return found ? { ok: true, msg: found, found: true } : ok('한 칸을 팠습니다');
  }
  function toggleBlock(G, i) {
    const c = G.cells[i]; if (!c || !c.dug || [ENT, CORE].includes(i)) return fail('막을 수 없는 칸입니다');
    if (!c.block) { c.block = true; const still = paths(G).length > 0; c.block = false; if (!still) return fail('입구에서 본체 방까지 길이 하나는 남아야 합니다'); }
    const cost = c.block ? 0 : 20 * cm(G); if (G.gold < cost) return fail('재물이 부족합니다');
    const e = buildOp(G); if (e) return fail(e);
    pay(G, cost, '굴착'); c.block = !c.block; if (c.block) G.kin.forEach(m => { if (m.loc === i) m.loc = null; });
    return ok(c.block ? '칸을 막았습니다' : '막은 것을 텄습니다');
  }
  function canBuild(G, i, type) {
    const d = ROOM[type], c = G.cells[i]; if (!d || d.fixed || !c) return '지을 수 없습니다';
    if (!c.dug) return '먼저 파야 합니다'; if (i === CORE) return '고정된 칸입니다'; if (c.block) return '막힌 칸입니다';
    if (d.act && actOf(G) < d.act) return d.act + '막부터 지을 수 있습니다';
    if (d.asp && !(G.slime.main === d.asp && G.slime.stage >= 1) && !(d.ess && G.slime.sub === d.asp && G.slime.stage >= 2)) return ASP[d.asp] + ' 징조 전용입니다';
    if (d.max && countRoom(G, type) >= d.max) return '이미 있습니다';
    if (c.type === type) return '이미 그 시설입니다';
    return null;
  }
  const buildCost = (G, i, type) => Math.max(0, ROOM[type].cost * cm(G) - Math.floor(ROOM[G.cells[i].type].cost * cm(G) / 2));
  function build(G, i, type) {
    const why = canBuild(G, i, type); if (why) return fail(why);
    const cost = buildCost(G, i, type); if (G.gold < cost) return fail('재물이 부족합니다 (' + cost + 'G)');
    const e = buildOp(G); if (e) return fail(e);
    pay(G, cost, '건설');
    const cap = ROOM[type].def || 0; let k = 0; G.kin.forEach(m => { if (m.loc === i && m.kind !== 'spawn' && ++k > cap) m.loc = null; if (m.loc === i && !cap) m.loc = null; });
    const c = G.cells[i]; c.type = type; c.lv = 1; c.exp = 0; c.traps = []; if (ROOM[type].asp && ROOM[type].asp === G.slime.main) G.stats.aspBuilt = (G.stats.aspBuilt || 0) + 1;
    return ok(ROOM[type].name + ' 건설' + (cost ? ' (' + cost + 'G)' : ''));
  }
  function addTrap(G, i, kind) {
    const c = G.cells[i]; if (!c || !ROOM[c.type].traps) return fail('함정을 놓을 수 없는 시설입니다');
    if (c.traps.length >= ROOM[c.type].traps) return fail('함정 칸이 가득 찼습니다');
    const cost = TRAP[kind].cost * cm(G); if (G.gold < cost) return fail('재물이 부족합니다 (' + cost + 'G)');
    const e = buildOp(G); if (e) return fail(e);
    pay(G, cost, '건설'); c.traps.push({ kind, lv: 1 }); return ok(TRAP[kind].name + ' 설치');
  }
  const trapUpCost = (G, t) => Math.round(TRAP[t.kind].cost * cm(G) * (t.lv === 1 ? 1.5 : 2.25));
  function upTrap(G, i, j) {
    const t = G.cells[i] && G.cells[i].traps[j]; if (!t) return fail('없는 함정입니다'); if (t.lv >= 3) return fail('최고 레벨입니다');
    const cost = trapUpCost(G, t); if (G.gold < cost) return fail('재물이 부족합니다 (' + cost + 'G)');
    const e = buildOp(G); if (e) return fail(e);
    pay(G, cost, '건설'); t.lv++; return ok(TRAP[t.kind].name + ' Lv' + t.lv);
  }
  function setZone(G, i) {
    const c = G.cells[i]; if (!c || !c.dug) return fail('깔 수 없는 칸입니다'); if (!G.slime.main) return fail('진화한 뒤에 깔 수 있습니다'); if (c.zone) return fail('이미 깔려 있습니다');
    const cost = 30 * cm(G); if (G.gold < cost) return fail('재물이 부족합니다 (' + cost + 'G)');
    const e = buildOp(G); if (e) return fail(e);
    pay(G, cost, '건설'); c.zone = true; return ok(ZONE[G.slime.main][0] + ' 영역');
  }
  function setPlot(G, p, type) {
    if (!PLOT[type] || G.plots[p] === type) return fail('바꿀 것이 없습니다');
    const cost = PLOT[type].cost * cm(G); if (G.gold < cost) return fail('재물이 부족합니다 (' + cost + 'G)');
    const e = buildOp(G); if (e) return fail(e);
    pay(G, cost, '건설'); G.plots[p] = type; return ok('길목 ' + (p + 1) + ': ' + PLOT[type].name);
  }
  function autoSkill(m) { let best = -1; SKILL_LV.forEach((l, i) => { if (m.lv >= l) best = i; }); if (m.auto !== false) m.skill = best; }
  function acceptCost(G, a) { return Math.round(KIN[a.kind].cost * cm(G) * (a.rare ? 2.5 : 1) * (a.cheap ? 0.7 : 1) * (G.star === 'poor' ? 0.5 : 1)); }
  function accept(G, i) {
    const a = G.applicants[i]; if (!a) return fail('없는 지원자입니다');
    if (G.star === 'lone' && G.kin.filter(m => m.kind !== 'spawn').length >= 3) return fail('외톨이 별: 권속은 3명까지입니다');
    const cost = acceptCost(G, a); if (!pay(G, cost, '계약금')) return fail('재물이 부족합니다 (' + cost + 'G)');
    const lv = Math.max(1, actOf(G) * 3 - 2) + (a.rare ? 2 : 0);
    const m = { id: G.nextId++, name: a.name, kind: a.kind, lv, exp: 0, loc: freeSlot(G, a.kind), hurt: 0, skill: -1, rare: a.rare, age: 0, unpaid: 0 };
    autoSkill(m); G.kin.push(m); G.applicants.splice(i, 1); note(G, 'accept');
    return ok((a.rare ? '희귀 ' : '') + KIN[a.kind].name + ' "' + m.name + '" 맞이 (Lv' + lv + ')' + (m.loc === null ? '. 자리가 없어 대기 중' : ''));
  }
  function dismiss(G, id) { const i = G.kin.findIndex(m => m.id === id); if (i < 0) return fail('없는 권속입니다'); const m = G.kin.splice(i, 1)[0]; return ok(m.name + '을(를) 내보냈습니다'); }
  function moveKin(G, id, loc) {
    const m = G.kin.find(x => x.id === id); if (!m) return fail('없는 권속입니다');
    if (loc !== null) { const c = capacity(G); if (!(loc in c)) return fail('둘 수 없는 곳입니다'); if (m.kind !== 'spawn' && G.kin.filter(x => x.loc === loc && x.kind !== 'spawn').length >= c[loc]) return fail('자리가 없습니다'); }
    const e = buildOp(G); if (e) return fail(e);
    m.loc = loc; return ok(m.name + ' 재배치');
  }
  function setSkill(G, id, idx) { const m = G.kin.find(x => x.id === id); if (!m || idx < 0 || m.lv < SKILL_LV[idx]) return fail('아직 배우지 못한 스킬입니다'); m.skill = idx; m.auto = false; return ok(m.name + ': ' + KIN[m.kind].skills[idx][0]); }
  function setStance(G, id, st) { const m = G.kin.find(x => x.id === id); if (!m) return fail('없는 권속입니다'); m.stance = st; return ok(m.name + ': ' + (st === 'hold' ? '사수' : '신중')); }
  function train(G, loc, gold) {
    if (G.day < 4) return fail('훈련은 4일째부터 가능합니다');
    const team = G.kin.filter(m => m.loc === loc); if (!team.length) return fail('그곳에 권속이 없습니다');
    gold = Math.floor(gold); if (gold < 1 || gold > G.gold) return fail('재물이 부족합니다');
    if (!useAp(G)) return fail('행동이 남지 않았습니다');
    note(G, 'train'); spend(G, gold, '훈련'); const each = K.trainEff * gold * sm(G) / cm(G) / team.length; let ups = 0;
    team.forEach(m => { ups += giveExp(m, each); autoSkill(m); });
    return ok('훈련: 레벨업 ' + ups + '회');
  }
  function eat(G) { if (!G.corpses.length) return fail('먹을 것이 없습니다'); if (!useAp(G)) return fail('행동이 남지 않았습니다'); note(G, 'eat'); G.stats.eats = (G.stats.eats || 0) + 1; return ok('포식: ' + eatN(G, has(G, 'mouth') ? 6 : 3)); }
  function rest(G) { if (!useAp(G)) return fail('행동이 남지 않았습니다'); note(G, 'rest'); const s = slimeStats(G); G.slime.hp = Math.min(s.hp, G.slime.hp + s.hp * (has(G, 'gills') ? 0.7 : 0.4)); G.kin.forEach(m => { m.hurt = 0; }); return ok('휴식: 본체 회복, 다친 권속 복귀'); }

  // ---------- 포로 ----------
  function convertChance(G, kind) { return clamp(0.70 + (G.origin === 'lamp' ? 0.2 : 0) - 0.15 * (Math.min(4, INV[kind].g) - 1) + (combo(G, 'confess') ? 0.15 : 0) + (hasRoom(G, 'persuade') ? 0.2 : 0) + (G.slime.stage >= 2 && G.slime.sub === 'dusk' ? 0.2 : 0) + (has(G, 'whisper') ? 0.15 : 0), 0.05, 0.95); }
  const ransomOf = (G, kind, bonus) => Math.round(INV[kind].g * 20 * cm(G) * (G.kin.some(m => m.kind === 'warden') ? 1.25 : 1) * (bonus || 1));
  const sacEss = (G, kind) => INV[kind].g * 4 + (hasRoom(G, 'ritual') ? 1 : 0) + (combo(G, 'queue') ? 2 : 0);
  const mutChance = (G, kind) => clamp(0.1 * INV[kind].g + (hasRoom(G, 'ritual') ? 0.15 : 0), 0, 0.9);
  function gainMut(G, asp) { const c = Object.keys(MUT).filter(k => !has(G, k) && (!asp || MUT[k].asp === asp)); if (!c.length || G.slime.muts.length >= 6) return null; const k = pick(G, c); G.slime.muts.push(k); say(G, '변이: ' + MUT[k].name); return k; }
  function dispose(G, i, how) {
    const p = G.prison[i]; if (!p) return fail('없는 포로입니다');
    const d = INV[p.kind]; G.prison.splice(i, 1); if (['ransom', 'sacrifice', 'convert'].includes(how)) note(G, how);
    if (how === 'ransom') { const g = ransomOf(G, p.kind, (p.bonus || 1) * (p.vill === 'gaet' ? 1.5 : 1)); earn(G, g, '몸값'); G.stats.ransoms++; if (p.vill) { const vs = G.vill[p.vill]; vs.host = Math.max(0, vs.host - 5); if (trading(G, p.vill)) vs.trust = Math.min(trustCap(G), (vs.trust || 0) + 1); } return ok(d.name + ' 몸값 +' + g + 'G'); }
    if (how === 'sacrifice') {
      const e = sacEss(G, p.kind); addEss(G, d.asp, e); addFaith(G, d.g); G.fear += d.g * 2; G.sacrifices++; if (p.vill) G.vill[p.vill].host += 2;
      const mut = rng(G) < mutChance(G, p.kind) ? gainMut(G, d.asp) : null;
      return { ok: true, msg: d.name + ' 제물: ' + ASP[d.asp] + ' 정수 +' + e + (mut ? ', 변이 ' + MUT[mut].name + '!' : ''), mut };
    }
    if (how === 'convert') {
      if (rng(G) < convertChance(G, p.kind)) { const m = { id: G.nextId++, name: NAMES[Math.floor(rng(G) * NAMES.length)], kind: convertKind(p.kind), lv: Math.max(1, actOf(G) * 3 - 2), exp: 0, loc: freeSlot(G, 'cultist'), hurt: 0, skill: -1, rare: false, age: 0, unpaid: 0 }; autoSkill(m); G.kin.push(m); G.stats.converts++; return ok(d.name + '이(가) ' + KIN[m.kind].name + ' "' + m.name + '"이(가) 되었습니다'); }
      G.fear += 1; return { ok: true, msg: d.name + ' 개종 실패. 달아났습니다', failed: true };
    }
    return fail('알 수 없는 처분입니다');
  }

  // ---------- 습격 ----------
  function raidInfo(G, v, level) {
    const d = VILL[v], ratio = clamp(slimeStats(G).atk / (d.df * sm(G)), 0.2, 1.5), base = d.wealth * cm(G) * ratio;
    return { gold: Math.round(base * [0.3, 1.0, 0.5][level]), ess: [4, 8, 12][level], fear: [6, 12, 25][level], tribute: Math.round(d.wealth * 0.15 * cm(G)) };
  }
  function raid(G, v, level) {
    if (actOf(G) < 2) return fail('습격은 2막부터 가능합니다'); const s = G.vill[v]; if (!s || s.razed) return fail('남아 있지 않은 마을입니다'); if (G.d.raided && G.d.raided[v]) return fail('오늘은 이미 다녀왔습니다');
    if (!useAp(G)) return fail('행동이 남지 않았습니다');
    note(G, 'raid' + level); G.stats.raids = (G.stats.raids || 0) + 1; const r = raidInfo(G, v, level); earn(G, r.gold, '습격'); addEss(G, VILL[v].asp, r.ess); G.fear += r.fear; (G.d.raided = G.d.raided || {})[v] = 1; G.d.away = true; s.trust = 0;
    if (level === 0) { s.tribute = r.tribute * (v === 'field' ? 2 : 1); s.host += 15; }
    if (level === 1) { if (v === 'field') s.noTrade = true; s.pause = 3; s.host += 35; G.march.tonight = G.march.tonight || { vill: v, settle: false }; G.march.tonight.vill = v; }
    if (level === 2) { s.razed = true; s.tribute = 0; G.march.tonight = G.march.tonight || { vill: v, settle: false }; G.march.tonight.vill = v; G.march.tonight.angry = true; }
    return ok(VILL[v].name + ' ' + ['위협', '약탈', '초토화'][level] + ': +' + r.gold + 'G, ' + ASP[VILL[v].asp] + ' 정수 +' + r.ess + ', 공포 +' + r.fear);
  }

  // ---------- 지상 인카운터 ----------
  const SPOT = {
    meteor: { name: '유성 구덩이', text: '밤사이 떨어진 별똥별이 구덩이를 남겼다. 바닥에 낯익은 빛이 고여 있다.' },
    shrine: { name: '버려진 사당', text: '풀에 덮인 돌무더기. 누군가 아주 오래전에 무언가를 빌던 자리다.' },
    band: { name: '떠돌이 무리', text: '갈 곳 없는 것들이 모닥불 가에 모여 있다. 일자리를 찾는 눈치다.' },
    cart: { name: '뒤집힌 수레', text: '길가에 수레가 뒤집혀 있다. 짐은 그대로고, 주인은 도움을 구하러 간 모양이다.' },
    camp: { name: '사냥꾼 야영', text: '둥지로 올 무리가 길가에서 쉬고 있다. 아직 이쪽을 못 봤다.' },
  };
  function spotOptions(G) {
    const s = G.spot; if (!s) return []; const c = cm(G), a0 = G.slime.main || G.startAsp, vn = VILL[s.vill].name;
    if (s.type === 'meteor') return [{ label: '핥는다', desc: '무작위 징조의 정수 +6', run: () => { const a = pick(G, ASPECTS); addEss(G, a, 6); return ASP[a] + ' 정수 +6'; } }, { label: '골라 삼킨다', desc: ASP[a0] + ' 정수 +3', run: () => { addEss(G, a0, 3); return ASP[a0] + ' 정수 +3'; } }];
    if (s.type === 'shrine') return [{ label: '깨운다', desc: '신앙 +10', run: () => { addFaith(G, 10); return '사당이 낮게 울렸다. 신앙 +10'; } }, { label: '부순다', desc: '재물 +' + 40 * c + 'G, 공포 +5', run: () => { earn(G, 40 * c, '사당'); G.fear += 5; return '돌 밑에 묻힌 것을 챙겼다. +' + 40 * c + 'G'; } }];
    if (s.type === 'band') return [{ label: '불러들인다', desc: '지원자 2명이 더 온다. 계약금 30% 할인', run: () => { for (let i = 0; i < 2; i++) G.applicants.push({ kind: pick(G, ['goblin', 'skeleton', 'cultist', 'goblin']), rare: false, cheap: true, name: NAMES[Math.floor(rng(G) * NAMES.length)] }); return '둘이 둥지 앞으로 따라왔다'; } }];
    if (s.type === 'cart') return [{ label: '턴다', desc: '재물 +' + 50 * c + 'G, ' + vn + ' 적의 +10', run: () => { earn(G, 50 * c, '수레'); G.vill[s.vill].host += 10; return '짐을 챙겼다. +' + 50 * c + 'G'; } }, { label: '세워 둔다', desc: vn + ' 적의 −15, 공포 −3', run: () => { G.vill[s.vill].host = Math.max(0, G.vill[s.vill].host - 15); G.fear = Math.max(0, G.fear - 3); return '수레를 바로 세워 두었다. 주인은 영문을 모를 것이다'; } }];
    return [{ label: '먼저 덮친다', desc: '다음에 올 무리의 인원 −30%, 먹이 +1, 공포 +5', run: () => { const m = G.march.tonight || G.march.tomorrow; if (m) m.thin = true; addCorpse(G, 'villager'); G.fear += 5; return '야영지를 덮쳤다. 남은 자들만 온다'; } }];
  }
  function resolveSpot(G, i) {
    const o = spotOptions(G)[i]; if (!o) return fail('고를 수 없습니다'); if (!useAp(G)) return fail('행동이 남지 않았습니다');
    const msg = o.run(); say(G, SPOT[G.spot.type].name + ': ' + msg); G.spot = null; G.stats.spots = (G.stats.spots || 0) + 1; return ok(msg);
  }

  // ---------- 밤 손님 ----------
  const GUEST = {
    merchant: { name: '행상단', text: '수레 셋이 입구 앞에 멈췄다. 싸울 뜻은 없어 보인다. "밤길에 장사 좀 하고 갑시다."' },
    pilgrims: { name: '순례 행렬', text: '누더기를 걸친 무리가 등불을 들고 온다. 무기는 없다. 동굴 쪽으로 절을 하며 걷는다.' },
    child: { name: '길 잃은 아이', text: '아이 하나가 울지도 않고 굴 안으로 걸어 들어온다. 손에는 반쯤 먹은 빵이 들려 있다.' },
    poet: { name: '떠돌이 시인', text: '류트를 멘 사내가 입구에서 안을 들여다본다. 무서운 소문을 듣고 구경하러 왔단다. "노래 한 곡 지어도 되겠습니까?"' },
    deserter: { name: '탈영병', text: '갑옷을 반쯤 벗어 던진 병사 하나가 입구에 주저앉아 있다. "저쪽보단 이쪽이 낫겠다 싶어서."' },
  };
  function guestOptions(G) {
    const gs = G.guest; if (!gs) return []; const c = cm(G), a0 = G.slime.main || G.startAsp, vn = VILL[gs.vill].name, pass = { label: '문을 닫는다', desc: '아무 일도 없다', cost: 0, run: () => '아무도 들이지 않았다' };
    if (gs.type === 'merchant') return [
      { label: '정수 병을 산다', desc: ASP[a0] + ' 정수 +8', cost: 40 * c, run: () => { addEss(G, a0, 8); return ASP[a0] + ' 정수 +8'; } },
      { label: '함정 기술자를 쓴다', desc: '레벨이 가장 낮은 함정 둘을 한 단계 올린다', cost: 60 * c, why: G.cells.some(x => x.traps.some(t => t.lv < 3)) ? null : '올릴 함정이 없습니다', run: () => { const ts = []; G.cells.forEach(x => x.traps.forEach(t => { if (t.lv < 3) ts.push(t); })); ts.sort((a, b) => a.lv - b.lv).slice(0, 2).forEach(t => { t.lv++; }); return '함정을 손봤다'; } },
      { label: '덮친다', desc: '재물 +' + 120 * c + 'G, 모든 마을 적의 +10, 공포 +6', cost: 0, run: () => { earn(G, 120 * c, '행상단'); VIDS.forEach(v => { G.vill[v].host += 10; }); G.fear += 6; note(G, 'raid1'); return '수레째 삼켰다. +' + 120 * c + 'G'; } }, pass];
    if (gs.type === 'pilgrims') return [
      { label: '맞아들인다', desc: '신앙 +8, 신도 지원자 2명 (계약금 30% 할인), ' + vn + ' 적의 +10', cost: 0, run: () => { addFaith(G, 8); for (let i = 0; i < 2; i++) G.applicants.push({ kind: 'cultist', rare: false, cheap: true, name: NAMES[Math.floor(rng(G) * NAMES.length)] }); G.vill[gs.vill].host += 10; return '등불이 굴 안에 줄지어 섰다. 신앙 +8'; } },
      { label: '돌려보낸다', desc: '신앙 −3', cost: 0, run: () => { G.faith = Math.max(0, G.faith - 3); return '행렬은 말없이 돌아섰다'; } }];
    if (gs.type === 'child') return [
      { label: '돌려보낸다', desc: '공포 −10, ' + vn + ' 적의 0', cost: 0, run: () => { G.fear = Math.max(0, G.fear - 10); G.vill[gs.vill].host = 0; G.child = 'home'; note(G, 'ransom'); return '아이는 빵을 다 먹고 돌아갔다'; } },
      { label: '붙잡는다', desc: '포로가 된다 (몸값 5배), ' + vn + ' 적의 +40', cost: 0, why: G.prison.length >= prisonCap(G) ? '감옥에 자리가 없습니다' : null, run: () => { G.prison.push({ kind: 'villager', vill: gs.vill, bonus: 5 }); G.vill[gs.vill].host += 40; G.child = 'held'; note(G, 'capture'); return '아이를 감옥에 넣었다'; } },
      { label: '삼킨다', desc: ASP[a0] + ' 정수 +10, 공포 +20', cost: 0, run: () => { addEss(G, a0, 10); G.fear += 20; G.sacrifices++; G.child = 'eaten'; note(G, 'eat'); return '빵 조각만 남았다'; } }];
    if (gs.type === 'poet') return [
      { label: '구경시키고 보낸다', desc: '공포 +15. 노래가 퍼져 신도 지원자 3명이 온다 (계약금 30% 할인)', cost: 0, run: () => { G.fear += 15; G.poet = 'sang'; for (let i = 0; i < 3; i++) G.applicants.push({ kind: 'cultist', rare: false, cheap: true, name: NAMES[Math.floor(rng(G) * NAMES.length)] }); return '시인은 떨리는 손으로 받아 적고 돌아갔다'; } },
      { label: '곁에 둔다', desc: '희귀 권속 「목쉰 시인」이 된다 (가면쟁이)', cost: 0, run: () => { const m = { id: G.nextId++, name: '목쉰 시인', kind: 'mask', lv: Math.max(1, actOf(G) * 3 - 2) + 2, exp: 0, loc: freeSlot(G, 'mask'), hurt: 0, skill: -1, rare: true, age: 0, unpaid: 0 }; autoSkill(m); G.kin.push(m); G.poet = 'kept'; return '시인은 그날 밤 이후로 다른 노래를 부르지 못했다'; } },
      { label: '삼킨다', desc: '황혼 정수 +10, 공포 +5', cost: 0, run: () => { addEss(G, 'dusk', 10); G.fear += 5; G.poet = 'eaten'; note(G, 'eat'); return '류트 줄만 남았다'; } }];
    return [
      { label: '받아들인다', desc: '「돌아선 검」이 되어 합류한다. 병영 도시 적의 +15', cost: 0, run: () => { const m = { id: G.nextId++, name: NAMES[Math.floor(rng(G) * NAMES.length)], kind: 'turncoat', lv: Math.max(1, actOf(G) * 3 - 1), exp: 0, loc: freeSlot(G, 'turncoat'), hurt: 0, skill: -1, rare: false, age: 0, unpaid: 0 }; G.kin.push(m); G.vill.fort.host += 15; G.deserted = true; note(G, 'accept'); return '"' + m.name + '"이(가) 무기를 고쳐 잡았다'; } },
      { label: '삼킨다', desc: '기아 정수 +8, 공포 +4', cost: 0, run: () => { addEss(G, 'hunger', 8); G.fear += 4; note(G, 'eat'); return '갑옷만 남았다'; } },
      { label: '돌려보낸다', desc: '공포 −3', cost: 0, run: () => { G.fear = Math.max(0, G.fear - 3); return '병사는 어둠 속으로 사라졌다'; } }];
  }
  function resolveGuest(G, i) {
    const o = guestOptions(G)[i]; if (!o) return fail('고를 수 없습니다'); if (o.why) return fail(o.why); if (o.cost > G.gold) return fail('재물이 부족합니다 (' + o.cost + 'G)');
    if (o.cost) spend(G, o.cost, '밤 손님'); const msg = o.run(); say(G, GUEST[G.guest.type].name + ': ' + msg); G.guest = null; G.stats.guests = (G.stats.guests || 0) + 1; return ok(msg);
  }

  // ---------- 아침 사건 ----------
  const eventInfo = G => { const id = G.event.id; if (id.startsWith('trait_')) { const e = ORIGIN[id.slice(6)].ev; return { title: e[0], text: e[1] + ' 몸이 달라지려 한다.' }; } return EVENTS[id]; };
  function eventOptions(G) {
    if (G.event && G.event.id.startsWith('trait_')) { const k = G.event.id.slice(6), O = ORIGIN[k]; return [{ label: '그대로 둔다 — ' + O.name, desc: '＋ ' + O.good + '  － ' + O.bad, cost: 0, run: () => takeTrait(G, k) }, { label: '긁어낸다', desc: '아무것도 돋지 않는다. 이 사건은 다시 오지 않는다. 고른 조각의 정수 +4', cost: 0, run: () => { (G.traitNo = G.traitNo || {})[k] = 1; addEss(G, G.startAsp, 4); return '긁어냈다. ' + ASP[G.startAsp] + ' 정수 +4'; } }]; }
    if (!G.event) return []; const c = cm(G), id = G.event.id, pass = { label: '그냥 보낸다', cost: 0, run: () => '아무 일도 없었다' };
    const later = () => { let d = G.day + 5; while (G.eventDays[d]) d++; if (d < K.days) G.eventDays[d] = 'mapper2'; };
    if (id === 'mapper1') return [
      { label: '붙잡는다 (포로가 된다)', cost: 0, why: G.prison.length >= prisonCap(G) ? '감옥에 자리가 없습니다' : null, run: () => { G.prison.push({ kind: 'detective', vill: 'school' }); G.vill.school.host += 10; G.mapper = 'held'; later(); return '측량꾼을 감옥에 넣었다. 그가 적던 것도 함께'; } },
      { label: '적게 둔다', cost: 0, run: () => { G.mapper = 'sent'; later(); return '측량꾼은 뭔가를 잔뜩 적어 돌아갔다'; } },
      { label: '겁을 줘서 쫓는다 (공포 +5)', cost: 0, run: () => { G.fear += 5; G.mapper = 'gone'; return '줄자만 남기고 달아났다'; } }];
    if (id === 'mapper2') return G.mapper === 'held' ? [
      { label: '둥지로 오는 길을 그리게 한다', cost: 0, run: () => { G.known2 = true; return '이제 다가오는 무리의 구성이 늘 보인다'; } },
      { label: '지상의 지도를 그리게 한다', cost: 0, run: () => { G.spotLong = true; return '지상에 나타나는 것이 하루 더 머문다'; } }] : [
      { label: '지도를 사들여 태운다', cost: 80 * c, run: () => '지도는 불쏘시개가 됐다' },
      { label: '내버려 둔다', cost: 0, run: () => { G.mapSold = true; return '둥지로 오는 길이 지도에 실렸다. 앞으로 침입이 잦아진다'; } }];
    if (id === 'feeder') return ASPECTS.map(a => ({ label: ASP[a] + ' 정수 +6', cost: 30 * c, run: () => { addEss(G, a, 6); return ASP[a] + ' 정수를 삼켰다'; } })).concat([pass]);
    if (id === 'traveler') return [{ label: '길을 알려 준다 (공포 −8)', cost: 0, run: () => { G.fear = Math.max(0, G.fear - 8); return '여행자가 고맙다며 돌아갔다'; } }, { label: '잡아 둔다 (포로 1)', cost: 0, why: G.prison.length >= prisonCap(G) ? '감옥에 자리가 없습니다' : null, run: () => { G.prison.push({ kind: 'villager', vill: 'field' }); G.fear += 2; return '여행자를 감옥에 넣었다'; } }];
    if (id === 'meteor') return [{ label: '빛을 핥는다 (무작위 정수 +4)', cost: 0, run: () => { const a = pick(G, ASPECTS); addEss(G, a, 4); return ASP[a] + ' 정수 +4'; } }, { label: '지켜본다 (신앙 +8)', cost: 0, run: () => { addFaith(G, 8); return '신앙이 차올랐다'; } }];
    if (id === 'trainer') return [{ label: '전 권속 특훈', cost: 30 * c, why: G.kin.length ? null : '권속이 없습니다', run: () => { let u = 0; G.kin.forEach(m => { u += giveExp(m, 12 * sm(G)); autoSkill(m); }); return '특훈 완료: 레벨업 ' + u + '회'; } }, pass];
    if (id === 'box') return [{ label: '열어 본다', cost: 0, run: () => { if (rng(G) < 0.5) { earn(G, 60 * c, '상자'); return '재물이 들어 있었다. +' + 60 * c + 'G'; } G.fear += 10; return '빈 상자였다. 누가 지켜보고 있었다 (공포 +10)'; } }, pass];
    if (id === 'informer') return [{ label: '정보를 산다', cost: 20 * c, run: () => { G.known = true; let d = G.day + 5; while (G.eventDays[d]) d++; if (d < K.days) G.eventDays[d] = 'informer2'; return '오늘과 내일 올 무리의 구성을 알았다'; } }, pass];
    if (id === 'pilgrims2') return [
      { label: hasRoom(G, 'chapel') ? '예배당을 내어 준다' : '성소를 지어 준다', cost: hasRoom(G, 'chapel') ? 0 : 60 * c, run: () => { const m = { id: G.nextId++, name: '첫 사도', kind: 'cultist', lv: Math.max(1, actOf(G) * 3 - 2) + 3, exp: 0, loc: freeSlot(G, 'cultist'), hurt: 0, skill: -1, rare: true, age: 0, unpaid: 0 }; autoSkill(m); G.kin.push(m); G.faithBonus = (G.faithBonus || 0) + 10; addFaith(G, 10); return '늙은이가 무릎을 꿇었다. 「첫 사도」가 합류했다. 신앙 +10, 신앙 상한 +10'; } },
      { label: '돌려보낸다', cost: 0, run: () => { G.faith = Math.max(0, G.faith - 5); return '순례자들은 다른 굴을 찾아 떠났다'; } }];
    if (id === 'informer2') return [
      { label: '붙잡는다 (포로가 된다)', cost: 0, why: G.prison.length >= prisonCap(G) ? '감옥에 자리가 없습니다' : null, run: () => { G.prison.push({ kind: 'detective', vill: 'bell' }); return '밀고자를 감옥에 넣었다'; } },
      { label: '이중 첩자로 쓴다', cost: 0, run: () => { G.known2 = true; G.spy = true; return '이제 다가오는 무리의 구성이 늘 보인다. 대신 매일 삯을 줘야 한다'; } },
      { label: '모른 척한다', cost: 0, run: () => { G.leak = true; return '다음 큰 밤, 인간들은 네 함정 자리를 알고 온다'; } }];
    if (id === 'dream') return [{ label: '돋게 둔다 (변이 1, 본체 HP −30%)', cost: 0, why: G.slime.muts.length >= 6 ? '변이 칸이 가득 찼습니다' : null, run: () => { const k = gainMut(G, null); G.slime.hp = Math.max(1, G.slime.hp - slimeStats(G).hp * 0.3); return k ? '변이를 얻었다: ' + MUT[k].name : '아무것도 돋지 않았다'; } }, { label: '깬다', cost: 0, run: () => '꿈은 금세 잊혔다' }];
    if (id === 'pilgrims') return [{ label: '맞이한다 (내일 신도 지망자가 온다)', cost: 0, run: () => { G.pilgrims = true; let d = G.day + 5; while (G.eventDays[d]) d++; if (d < K.days) G.eventDays[d] = 'pilgrims2'; return '순례자들이 근처에 자리를 잡았다'; } }, { label: '쫓아낸다 (공포 +4)', cost: 0, run: () => { G.fear += 4; return '순례자들이 비명을 지르며 흩어졌다'; } }];
    if (id === 'tax') { const t = Math.round(Math.max(0, G.gold) * 0.1); return [{ label: '세금을 낸다 (' + t + 'G)', cost: 0, run: () => { spend(G, t, '세금'); return t + 'G를 냈다'; } }, { label: '삼킨다 (시체 1, 공포 +8)', cost: 0, run: () => { addCorpse(G, 'militia'); G.fear += 8; return '징수원은 돌아가지 못했다'; } }]; }
    return [pass];
  }
  function resolveEvent(G, i) {
    const o = eventOptions(G)[i]; if (!o) return fail('고를 수 없습니다'); if (o.why) return fail(o.why); if (o.cost > G.gold) return fail('재물이 부족합니다 (' + o.cost + 'G)');
    if (o.cost) spend(G, o.cost, '사건'); const msg = o.run(); say(G, eventInfo(G).title + ': ' + msg); G.event = null; return ok(msg);
  }

  // ---------- 밤 ----------
  const alive = us => us.filter(u => u.hp > 0 && !u.gone && !u.fled);
  const hpf = u => Math.max(0, u.hp) / u.mhp, spf = u => u.msan ? Math.max(0, u.san) / u.msan : 1;
  function mkInv(G, kind, n, vill) { const d = INV[kind], m0 = sm(G), hm = (ob(G, 'silence') ? 0.85 : 1) * (ox(G, 'longday') ? 1.15 : 1) * (G.star === 'loud' ? 1 : 1), m = m0; return { uid: 'i' + n, side: 'inv', kind, name: d.name, hp: d.hp * m * hm, mhp: d.hp * m * hm, atk: d.atk * m * (ox(G, 'whisper') ? 1.15 : 1) * (G.star === 'loud' ? 1.25 : 1), df: d.df * m * (ox(G, 'moon') ? 1.2 : 1), san: d.san * m * (ob(G, 'star') ? 0.75 : 1), msan: d.san * m, vill }; }
  function mkDef(G, m) { const s = kinStats(G, m); return { uid: 'k' + m.id, side: 'def', kind: m.kind, name: m.name, hp: s.hp, mhp: s.hp, atk: s.atk, df: s.df * ((m.kind === 'scale' && m.skill === 2) || (m.kind === 'netter' && m.skill === 1) ? 1.5 : 1) * (ob(G, 'wetwall') ? 1.3 : 1), satk: s.satk * (m.evo && m.kind === 'scribe' ? 2 : 1), ref: m, sk: m.skill, evo: !!m.evo, revives: m.kind === 'skeleton' ? 1 + (m.skill === 2 ? 1 : 0) + (m.evo ? 1 : 0) : 0 }; }
  function strike(t, x) { const was = t.hp > 0; t.hp -= x; return { b: t.uid, d: Math.round(x), hp: hpf(t), k: was && t.hp <= 0 }; }
  const ward = g => alive(g).reduce((a, u) => Math.max(a, u.sealed ? 0 : (INV[u.kind].ward || 0)), 0);

  function* nightGen(G) {
    const mt = G.march.tonight; if (!mt) return null;
    const pk = partyKinds(G, mt.vill, mt.settle, mt.thin), party = pk.kinds.map((k, i) => mkInv(G, k, i, mt.vill));
    if (mt.angry) { const extra = Math.ceil(party.length * 0.3); for (let i = 0; i < extra; i++) party.push(mkInv(G, pk.kinds[i % pk.kinds.length], party.length, mt.vill)); }
    const start = party.reduce((a, u) => a + u.mhp, 0), hpOf = us => alive(us).reduce((a, u) => a + Math.max(0, u.hp), 0), uids = us => alive(us).map(u => u.uid);
    const ev = [], rep = { vill: mt.vill, grade: pk.g, gname: GRADE_NAME[pk.g], count: party.length, party: party.map(u => ({ uid: u.uid, kind: u.kind, name: u.name })), ev, result: '', loot: 0, gold: 0, corpses: 0, captives: [], hurt: [], settle: !!mt.settle, off: [], adds: [] };
    const st = { rock: {}, sluice: {}, hands: Math.max(0, handsMax(G) + (ob(G, 'eye') ? 1 : 0) - (ox(G, 'silence') ? 1 : 0)), rummaged: {}, tempId: 0 }, squads = {}, fought = new Set();
    if (G.omen) ev.push({ t: 'note', txt: '징조 「' + OMEN[G.omen.id].name + '」' + (G.omen.tier !== 'bane' ? ' · ' + OMEN[G.omen.id].boon : '') + (ox(G, G.omen.id) ? ' · ' + OMEN[G.omen.id].bane : '') });
    if (G.day === K.days && hoardN(G, 'veil')) { party.forEach(u => { u.hp *= 1 - HOARD.veil.cut; u.mhp *= 1 - HOARD.veil.cut; u.atk *= 1 - HOARD.veil.cut; }); ev.push({ t: 'note', txt: '가려 둔 별 아래에서 무리가 길을 헤맨다. 침입자의 체력·공격 −15%' }); }
    if (G.day === K.days && G.eld && G.eld.favor >= 2) { party.forEach(u => { u.san *= 0.7; }); ev.push({ t: 'note', txt: '「' + ELDER[G.eld.id].name + '」이(가) 네 편에서 내려다본다. 침입자의 정신력 −30%' }); }
    if (G.day === K.days && G.eld && G.eld.favor <= -2) { party.forEach(u => { u.hp *= 1.2; u.mhp *= 1.2; }); ev.push({ t: 'note', txt: '「' + ELDER[G.eld.id].name + '」이(가) 봉인단의 등을 민다. 침입자의 체력 +20%' }); }
    const main = G.slime.main, stage = G.slime.stage, c = cm(G), m = sm(G);
    const squad = loc => squads[loc] || (squads[loc] = G.kin.filter(k => k.loc === loc && !k.hurt && !k.strike).map(k => mkDef(G, k)));
    const say2 = (k, o) => ev.push(Object.assign({ t: 'fx', k }, o));
    let sealedCore = false;
    // --- 정신력 ---
    function madness(u, group, cellIdx) {
      if (u.hp <= 0 || u.gone || u.san > 0) return; u.gone = true; addFaith(G, 1);
      let kneel = (u.netted ? 2 : 0.4) + (ob(G, 'whisper') ? 0.2 : 0) + (main === 'dusk' && stage >= 1 ? (stage >= 2 ? 0.3 : 0.15) : 0) + (cellIdx != null && squad(cellIdx).some(d => d.kind === 'mask' && d.hp > 0) ? 0.1 : 0);
      let infight = 0.2 + (hasRoom(G, 'mirror') ? 0.2 : 0) + (cellIdx != null && squad(cellIdx).some(d => d.kind === 'mask' && d.sk === 1 && d.hp > 0) ? 0.2 : 0);
      kneel = Math.min(u.netted ? 1 : 0.85, kneel); infight = Math.min(1 - kneel, infight);
      const r = rng(G);
      if (r < kneel && G.prison.length + rep.captives.length < prisonCap(G)) { u.mad = 'kneel'; rep.captives.push({ kind: u.kind, vill: u.vill }); ev.push({ t: 'fx', k: 'kneel', u: u.uid, txt: u.name + '이(가) 무릎을 꿇었다' }); return; }
      if (r < kneel + infight) { const others = alive(group); if (others.length) { const t = pick(G, others), h = strike(t, dmg(u.atk, t.df)); ev.push({ t: 'fx', k: 'infight', u: u.uid, txt: u.name + '이(가) 미쳐서 ' + t.name + '을(를) 쳤다', hit: h }); } }
      u.mad = 'flee'; if (!(main === 'dusk' && stage >= 2)) G.fear += 1;
      ev.push({ t: 'fx', k: 'flee', u: u.uid, txt: u.name + '이(가) 비명을 지르며 달아났다' });
    }
    function sanHit(group, targets, amt, txt, cellIdx, room) {
      const w = 1 - ward(group), mult = (has(G, 'maskm') ? 1.25 : 1) * w, hits = [];
      targets.forEach(u => { if (u.hp <= 0 || u.gone) return; u.san -= amt * mult; hits.push({ b: u.uid, d: 0, sd: Math.round(amt * mult), hp: hpf(u), sp: spf(u), k: false }); });
      if (hits.length) ev.push({ t: 'trap', kind: 'san', room, txt, hits });
      targets.forEach(u => madness(u, group, cellIdx));
    }
    // --- 함정 ---
    function fireTraps(cell, idx, g, retreat) {
      const zf = cell.zone && main === 'abyss', mult = m * (1 + 0.1 * (cell.lv - 1)) * (ox(G, 'wetwall') ? 0.7 : 1) * (cell.type === 'trap' && combo(G, 'corridor', idx) ? 1.3 : 1) * (G.leak && mt.settle ? 0.7 : 1);
      cell.traps.forEach((t, ti) => {
        if (ti === 0 && !retreat && alive(g).some(u => INV[u.kind].sap && !u.sealed)) { say2('disarm', { room: idx, txt: '공병대장이 ' + TRAP[t.kind].name + '을(를) 꺼 버렸다' }); return; }
        const liv = alive(g); if (!liv.length) return;
        if (liv.some(u => INV[u.kind].disarm && !u.sealed) && rng(G) < 0.3) { say2('disarm', { room: idx, txt: '밀수꾼이 ' + TRAP[t.kind].name + '을(를) 해제했다' }); return; }
        const n = TGT[t.lv] + (zf ? 2 : 0) + (ob(G, 'tide') ? 1 : 0), tg = liv.slice(0, n), half = u => INV[u.kind].trapHalf ? 0.5 : 1;
        if (t.kind === 'rock' && (retreat || st.rock[idx + '_' + ti])) return; if (t.kind === 'acid' && retreat) return;
        st.wary = st.wary || {}; const wn = st.wary[t.kind] || 0, wv = Math.pow(K.wary, wn), wt = wn ? ' (익숙해짐 −' + Math.round((1 - wv) * 100) + '%)' : ''; st.wary[t.kind] = wn + 1;
        if (t.kind === 'spike') { const d = 10 * LVM[t.lv] * mult * wv; ev.push({ t: 'trap', kind: 'spike', room: idx, txt: '가시 바닥' + wt + ': ' + tg.length + '명에게 ' + Math.round(d), hits: tg.map(u => strike(u, d * half(u))) }); }
        else if (t.kind === 'rock' && !retreat && !st.rock[idx + '_' + ti]) { st.rock[idx + '_' + ti] = 1; const u = pick(G, liv), d = 40 * LVM[t.lv] * mult * wv; ev.push({ t: 'trap', kind: 'rock', room: idx, txt: '낙석' + wt + ': ' + u.name + '에게 ' + Math.round(d), hits: [strike(u, d * half(u))] }); }
        else if (t.kind === 'acid' && !retreat) { tg.forEach(u => { if (!u.acid) { u.acid = 1; u.df *= 0.7; } }); ev.push({ t: 'trap', kind: 'acid', room: idx, txt: '산성 웅덩이: ' + tg.length + '명 방어 −30%', hits: tg.map(u => ({ b: u.uid, d: 0, hp: hpf(u), k: false })) }); }
        else if (t.kind === 'mist') sanHit(g, tg, 8 * LVM[t.lv] * mult * wv, '환각 안개' + wt + ': ' + tg.length + '명의 정신이 흔들린다', idx, idx);
      });
      witness(g);
    }
    function witness(g) { const dead = g.filter(u => u.hp <= 0 && !u.seen); if (!dead.length) return; dead.forEach(u => { u.seen = 1; }); const liv = alive(g); if (liv.length && !liv.some(u => u.kind === 'torch' && !u.sealed)) { liv.forEach(u => { u.san -= 4 * m * dead.length * (1 - ward(g)); }); liv.forEach(u => madness(u, g, null)); } }
    // --- 전투 ---
    function fight(inv0, defs, idx, isCore, ctx) {
      ctx = ctx || {}; const cell = idx != null ? G.cells[idx] : null, zone = cell && cell.zone ? main : null, slime = defs.find(d => d.kind === 'slime');
      const healAdj = idx != null && nbrs(idx).some(j => G.cells[j].dug && G.cells[j].type === 'pool' && !G.off[j]);
      let kills = 0, pool = 0, rounds = 0; const coreOn = isCore && !sealedCore;
      const fx = (u, k, txt) => ev.push({ t: 'fx', u: u.uid, k, txt, hp: hpf(u) });
      defs.forEach(d => {
        if (d.hp <= 0) return; const inv = alive(inv0); if (!inv.length) return;
        if (d.kind === 'scale' && d.sk === 1) { const u = pick(G, inv); u.skip = 2; fx(u, 'bind', d.name + '이(가) ' + u.name + '을(를) 끌어들였다'); }
        if (d.kind === 'scribe' && d.sk === 1) { const u = inv.find(x => INV[x.kind].heal || INV[x.kind].ward || INV[x.kind].revive || INV[x.kind].twice) || pick(G, inv); u.sealed = true; fx(u, 'bind', d.name + '이(가) ' + u.name + '의 특성을 봉했다'); }
        if (d.kind === 'mask' && d.sk === 2) sanHit(inv0, inv, 4 * m, d.name + '의 막 내림', idx, idx);
        if (d.kind === 'mask' && d.evo) sanHit(inv0, alive(inv0), 5 * m, d.name + '의 가면들이 한꺼번에 돌아본다', idx, idx);
        if (d.kind === 'spitter') ev.push({ t: 'trap', kind: 'spike', room: idx, txt: d.name + '이(가) 가시를 쏟아부었다', hits: alive(inv0).map(u => strike(u, dmg(d.atk * 0.5, u.df))) });
        if (d.kind === 'spitter' && d.evo) ev.push({ t: 'trap', kind: 'spike', room: idx, txt: d.name + '이(가) 한 번 더 쏟아부었다', hits: alive(inv0).map(u => strike(u, dmg(d.atk * 0.5, u.df))) });
        if (d.kind === 'tangle') alive(inv0).slice(0, d.evo ? 4 : 2).forEach(u => { u.skip = d.evo ? 3 : 2; fx(u, 'bind', d.name + '이(가) ' + u.name + '을(를) 붙들었다'); });
        if (d.kind === 'warden' && (d.sk === 2 || d.evo)) sanHit(inv0, alive(inv0), 3 * m, d.name + '의 호통', idx, idx);
      });
      for (let round = 1; round <= 10; round++) {
        const inv = alive(inv0), dfn = alive(defs); if (!inv.length || !dfn.length) break; rounds = round;
        const hits = [], knight = dfn.some(d => d.kind === 'skeleton' && d.evo), wall = dfn.some(d => d.kind === 'skeleton' && d.sk === 0), scaleHere = dfn.some(d => d.kind === 'scale'), cap = inv.some(u => u.kind === 'captain');
        for (const a of inv) {
          if (a.skip > 0) { a.skip--; continue; }
          for (let rep2 = 0; rep2 < (INV[a.kind].twice && !a.sealed ? 2 : 1); rep2++) {
            const t = pick(G, dfn); let x = dmg(a.atk * (cap && a.kind === 'militia' ? 1.2 : 1) * (a.shop ? 1.2 : 1) * (a.stick ? 0.9 : 1), t.df * (zone === 'abyss' ? 1.2 : 1));
            if (a.kind === 'priest' && t.kind === 'skeleton') x *= 2;
            if (wall && !(t.kind === 'skeleton' && t.sk === 0)) x *= 0.8;
            if (scaleHere && t.kind !== 'scale') x *= 0.8;
            if (knight && !(t.kind === 'skeleton' && t.evo)) x *= 0.75;
            if (coreOn && main === 'abyss' && stage >= 1) x *= stage >= 2 ? 0.55 : 0.7;
            if (t.kind === 'wall') hits.push([a, x * 0.25, t]);
            hits.push([t, x, a]);
            if (t.kind === 'skeleton' && t.sk === 1) hits.push([a, dmg(t.atk * 0.3, a.df), t]);
          }
        }
        const sanQ = [];
        for (const d of dfn) {
          if (d.kind === 'wall') continue;
          const weak = inv.reduce((a, b) => a.hp < b.hp ? a : b); let t = pick(G, inv), mult = (ctx.whip ? 1.3 : 1);
          if (d.kind === 'slime') {
            const atk = d.atk * (coreOn && main === 'hunger' ? 1 + (stage >= 2 ? 0.2 : 0.1) * kills : 1);
            hits.push([t, dmg(atk, t.df), d]);
            if (stage >= 1) inv.forEach(u => hits.push([u, dmg(atk * 0.3, u.df), d, 'aoe']));
            if (has(G, 'tentacle')) hits.push([pick(G, inv), dmg(atk * 0.6, t.df), d]);
            continue;
          }
          const s = d.satk ? d.satk * (zone === 'nebula' ? 1.3 : 1) + (d.kind === 'cultist' && d.sk === 0 ? 2 * (dfn.filter(x => x.kind === 'cultist').length - 1) : 0) : 0;
          if (s > 0) { const n = (KIN[d.kind].stg || 1) + (d.kind === 'scribe' && d.sk === 0 ? 1 : 0) + (d.evo && d.kind === 'cultist' ? 1 : 0) + (d.evo && d.kind === 'eyeheap' ? 99 : 0), pool2 = inv.slice().sort((a, b) => d.kind === 'mask' && d.sk === 0 ? a.san - b.san : rng(G) - 0.5); pool2.slice(0, n).forEach(u => sanQ.push([u, s * m / K.stat[1], d])); }
          if (!d.atk) continue;
          if (d.kind === 'goblin') { if (d.sk === 1) mult *= 1 + 0.15 * (dfn.filter(x => x.kind === 'goblin').length - 1); if (d.sk === 2) { t = weak; mult *= 1.2; } }
          if (d.kind === 'warden' && d.sk === 0) mult *= 1.3;
          if (d.kind === 'netter') { const th = (d.sk === 0 ? 0.4 : 0.3) + (d.evo ? 0.1 : 0), c = inv.filter(u => u.hp > 0 && !u.gone && !u.netted && u.hp < u.mhp * th && !INV[u.kind].boss).slice(0, (d.sk === 2 ? 2 : 1) + (d.evo ? 1 : 0)); if (c.length) { c.forEach(u => { u.netted = 1; u.san = 0; }); continue; } }
          if (d.kind === 'hunger') { if (d.sk === 0 && round === 1) mult *= 2; if (d.sk === 1) mult *= 1 + 0.15 * (d.kills || 0); if (d.sk === 2 && weak.hp < weak.mhp * 0.25) { hits.push([weak, weak.hp + 1, d]); continue; } }
          const x = dmg(d.atk * mult, t.df); hits.push([t, x, d]);
          if (d.evo && d.kind === 'goblin' && inv.length > 1) hits.push([inv.find(u => u !== t) || t, x, d]);
          if (d.evo && d.kind === 'hunger') hits.push([pick(G, inv), x, d]);
          if (d.kind === 'goblin' && d.sk === 0 && round === 1) hits.push([pick(G, inv), x, d]);
          if (d.kind === 'spawn' && d.sk === 0) t.stick = 1;
        }
        const recs = [];
        for (const [t, x, src, tag] of hits) {
          const rec = strike(t, x); rec.a = src.uid; rec.s = src.side; if (tag) rec.tag = tag; recs.push(rec);
          if (rec.k && t.side === 'inv') {
            kills++; pool += INV[t.kind].b * m; src.kills = (src.kills || 0) + 1;
            if (src.evo && src.kind === 'turncoat') alive(inv0).forEach(u => { u.san -= 4 * m; });
            if (src.kind === 'hunger') src.hp = Math.min(src.mhp, src.hp + src.mhp * 0.2);
            if (src.kind === 'slime' && has(G, 'teeth')) src.hp = Math.min(src.mhp, src.hp + src.mhp * 0.08);
            if (has(G, 'spore') && rng(G) < 0.2 && idx != null) { const u = tempSpawn(idx); defs.push(u); }
          }
        }
        for (const [u, s, d] of sanQ) { if (u.hp <= 0 || u.gone) continue; const v = s * (has(G, 'maskm') ? 1.25 : 1) * (1 - ward(inv0)); u.san -= v; recs.push({ a: d.uid, s: 'def', b: u.uid, d: 0, sd: Math.round(v), hp: hpf(u), sp: spf(u), k: false }); }
        ev.push({ t: 'round', n: round, hits: recs, room: isCore ? 'core' : idx });
        { const med = dfn.find(d => d.kind === 'licker' && d.evo && d.hp > 0 && !d.used), down = med && defs.find(d => d.ref && d.hp <= 0 && d.kind !== 'spawn' && !(d.kind === 'skeleton' && d.revives > 0)); if (down) { med.used = 1; down.hp = down.mhp * 0.4; fx(down, 'revive', med.name + '이(가) ' + down.name + '을(를) 핥아 일으켰다'); } }
        for (const d of dfn) {
          if (d.kind === 'skeleton' && d.hp <= 0 && d.revives > 0) { d.revives--; d.hp = d.mhp * 0.5; fx(d, 'revive', d.name + ' 부활'); }
          if (d.kind === 'spawn' && d.hp <= 0 && d.sk === 1 && !d.boom) { d.boom = 1; ev.push({ t: 'trap', kind: 'boom', at: d.uid, txt: d.name + '이(가) 터졌다', hits: alive(inv0).map(u => strike(u, dmg(d.atk * 1.5, u.df))) }); }
          if (d.kind === 'cultist' && d.hp <= 0 && d.sk === 1 && !d.boom) { d.boom = 1; sanHit(inv0, alive(inv0), 6 * m, d.name + '의 순교', idx, idx); }
          if (d.ref && !isCore && d.ref.stance !== 'hold' && d.kind !== 'spawn' && d.hp > 0 && d.hp < d.mhp * 0.3) { d.fled = true; fx(d, 'back', d.name + '이(가) 물러났다'); }
        }
        const livD = alive(defs);
        livD.forEach(d => { let h = 0; if (healAdj) h += 0.05; if (zone === 'brood') h += 0.03; if (coreOn && main === 'abyss' && stage >= 1) h += stage >= 2 ? 0.08 : 0.05; if (h && d.hp < d.mhp) d.hp = Math.min(d.mhp, d.hp + d.mhp * h); });
        livD.forEach(d => { if ((d.kind === 'scale' && (d.sk === 0 || d.evo)) || d.kind === 'fallen' || d.kind === 'licker') { const w = livD.reduce((a, b) => hpf(a) < hpf(b) ? a : b); if (w.hp < w.mhp) { w.hp = Math.min(w.mhp, w.hp + w.mhp * 0.08 * (d.evo && d.kind === 'fallen' ? 2 : 1)); fx(w, 'heal'); } } });
        for (const p of alive(inv0)) if (INV[p.kind].heal && !p.sealed) { const liv = alive(inv0), w = liv.reduce((a, b) => hpf(a) < hpf(b) ? a : b), z = liv.reduce((a, b) => spf(a) < spf(b) ? a : b); if (hpf(w) < 0.7) w.hp = Math.min(w.mhp, w.hp + 10 * m); else z.san = Math.min(z.msan, z.san + 6 * m); }
        for (const h of alive(inv0)) if (INV[h.kind].revive && !h.sealed && !h.used) { const dead = inv0.find(u => u.hp <= 0 && !u.gone && !u.rev); if (dead) { h.used = 1; dead.rev = 1; dead.hp = dead.mhp * 0.3; kills = Math.max(0, kills - 1); fx(dead, 'revive', '약초꾼이 ' + dead.name + '을(를) 일으켰다'); } }
        witness(inv0);
        inv0.forEach(u => madness(u, inv0, idx));
        if (slime && slime.hp <= 0 && !alive(inv0).length) { slime.hp = 1; fx(slime, 'revive', '본체가 간신히 버텼다'); }
      }
      const down = defs.filter(d => d.ref && d.hp <= 0).length;
      ev.push({ t: 'note', txt: rounds + '라운드 교전: ' + kills + '명 처치' + (down ? ', 아군 ' + down + '명 쓰러짐' : '') });
      const liv = defs.filter(d => d.ref && d.hp > 0 && !d.temp);
      liv.forEach(d => { if (giveExp(d.ref, pool / liv.length)) { autoSkill(d.ref); ev.push({ t: 'fx', u: d.uid, k: 'lvup', txt: d.name + ' 레벨업 → Lv' + d.ref.lv, hp: hpf(d) }); } });
      if (cell) giveExp(cell, pool);
      defs.forEach(d => { if (d.ref) fought.add(d); });
    }
    function tempSpawn(idx) { const d = KIN.spawn, g = Math.pow(K.lvGrowth, Math.max(1, actOf(G) * 3 - 2) - 1) * (main === 'brood' && stage >= 2 ? 1.5 : 1), u = { uid: 't' + (st.tempId++), side: 'def', kind: 'spawn', name: '움', hp: d.hp * g, mhp: d.hp * g, atk: d.atk * g, df: 0, temp: true, sk: -1 }; rep.adds.push({ uid: u.uid, kind: 'spawn', loc: idx }); ev.push({ t: 'add', uid: u.uid, kind: 'spawn', loc: idx }); return u; }
    // --- 개입 ---
    function* decide(idx, g, defs, isCore, prev) {
      const ctx = {}; if (st.hands <= 0 || !alive(g).length) return ctx;
      const others = Object.keys(capacity(G)).map(k => k === 'core' ? k : +k).filter(k => k !== (isCore ? 'core' : idx) && squad(k).some(d => d.hp > 0));
      const ans = yield { cell: isCore ? 'core' : idx, enemies: alive(g).length, hands: st.hands, faith: G.faith, spell: main && stage >= 1 ? { name: FORM1[main].spell[0], cost: spellCost(G), ok: G.faith >= spellCost(G) && !(main === 'abyss' && prev == null) } : null, from: others, ev, settle: !!mt.settle };
      if (!ans || ans.k === 'none') return ctx;
      st.hands--; G.stats.hands = (G.stats.hands || 0) + 1;
      if (ans.k === 'whip') { ctx.whip = true; say2('hand', { room: idx, txt: '채찍! 이 방 아군 공격 +30%' }); }
      if (ans.k === 'move' && ans.from != null) { const s = squad(ans.from).filter(d => d.hp > 0); squads[ans.from] = squad(ans.from).filter(d => d.hp <= 0); s.forEach(d => defs.push(d)); ev.push({ t: 'move', who: s.map(d => d.uid), to: isCore ? 'core' : idx, txt: '손: ' + s.length + '명을 옮겼다' }); }
      if (ans.k === 'spell' && main && G.faith >= spellCost(G)) {
        G.faith -= spellCost(G); note(G, 'spell'); const lib = (hasRoom(G, 'library') ? 1.25 : 1) * (G.kin.some(k => k.kind === 'scribe' && k.evo) ? 1.25 : 1); ctx.spell = main;
        say2('spell', { room: idx, txt: '손 주문: ' + FORM1[main].spell[0] });
        if (main === 'dusk') sanHit(g, alive(g), 15 * m * lib, '환영이 무리를 덮친다', idx, idx);
        if (main === 'brood') for (let i = 0; i < 3; i++) defs.push(tempSpawn(isCore ? 'core' : idx));
        if (main === 'hunger') { const liv = alive(g); if (liv.length) { const t = liv.reduce((a, b) => a.hp > b.hp ? a : b), h = strike(t, dmg(slimeStats(G).atk * 4 * lib, t.df)); h.tag = 'coin'; ev.push({ t: 'trap', kind: 'bite', room: idx, txt: '한 입: ' + t.name + '에게 ' + h.d, hits: [h] }); if (h.k) { t.eaten = 1; addEss(G, INV[t.kind].asp, corpsePts(G, t.kind)); } witness(g); } }
        if (main === 'nebula') ctx.rift = true;
        if (main === 'abyss') ctx.wave = true;
      }
      return ctx;
    }
    // --- 한 무리가 한 칸을 지난다 ---
    function* visit(i, g, prev, noHand) {
      const cell = G.cells[i], d = ROOM[cell.type]; if (!alive(g).length) return;
      ev.push({ t: 'go', to: i, who: uids(g) });
      if (cell.zone && main === 'hunger') ev.push({ t: 'trap', kind: 'burn', room: i, txt: '화상 영역', hits: alive(g).map(u => strike(u, u.mhp * 0.08)) });
      if (cell.zone && main === 'dusk') sanHit(g, alive(g), 5 * m, '속삭임 영역', i, i);
      if (cell.type === 'stage' && !G.off[i]) sanHit(g, alive(g), 10 * m * (1 + 0.1 * (cell.lv - 1)), '무대: 무리 전원의 정신이 흔들린다', i, i);
      if (d.traps) fireTraps(cell, i, g, false);
      // 뒤지는 자
      for (const s of nbrs(i)) { if (st.rummaged[s] || !sideSet.has(s) || G.cells[s].type === 'empty') continue; const r = alive(g).find(u => INV[u.kind].rummage && !u.rum); if (!r) break; r.rum = 1; st.rummaged[s] = 1;
        const guards = squad(s).filter(x => x.hp > 0);
        if (guards.length) { ev.push({ t: 'go', to: s, who: [r.uid] }); say2('rummage', { room: s, txt: r.name + '이(가) 곁방을 뒤지려다 들켰다' }); fight([r], guards, s, false); if (r.hp > 0 && !r.gone) ev.push({ t: 'go', to: i, who: [r.uid] }); }
        else { G.off[s] = 1; rep.off.push(s); let extra = ''; if (G.cells[s].type === 'prison' && G.prison.length && !G.kin.some(k => k.kind === 'warden')) { G.prison.pop(); extra = ' 포로 한 명이 풀려났다.'; } say2('rummage', { room: s, txt: r.name + '이(가) ' + ROOM[G.cells[s].type].name + '을(를) 뒤집어 놓았다.' + extra }); } }
      if (cell.type === 'fleshwall' && alive(g).length) { const w = { uid: 'w' + i, side: 'def', kind: 'wall', name: '살의 벽', hp: 200 * m * (1 + 0.1 * (cell.lv - 1)), mhp: 200 * m * (1 + 0.1 * (cell.lv - 1)), atk: 0, df: 10 * m }; ev.push({ t: 'add', uid: w.uid, kind: 'wall', loc: i }); fight(g, [w], i, false); ev.push({ t: 'fx', k: 'gone', u: w.uid }); }
      if (d.def && alive(g).length) {
        const s = squad(i);
        if (s.some(x => x.hp > 0)) {
          const inv = alive(g), eng = d.block ? g : inv.slice(0, alive(s).length * 2);
          if (!d.block && eng.length < inv.length) say2('pass', { room: i, txt: (inv.length - eng.length) + '명이 싸움을 피해 지나갔다' });
          const ctx = noHand ? {} : yield* decide(i, g, s, false, prev);
          if (ctx.wave && prev != null) { say2('wave', { room: i, txt: '해일이 무리를 앞 칸으로 밀어냈다' }); yield* visit(prev, g, null, true); ev.push({ t: 'go', to: i, who: uids(g) }); }
          if (ctx.rift) { const liv = alive(g), half = liv.slice(Math.ceil(liv.length / 2)); if (half.length) { half.forEach(u => { g.splice(g.indexOf(u), 1); }); queue.push({ units: half, path: curPath, from: 0 }); ev.push({ t: 'go', to: ENT, who: half.map(u => u.uid), back: true }); say2('rift', { room: i, txt: '틈: ' + half.length + '명이 입구로 되돌아갔다' }); } }
          fight(d.block ? g : (ctx.rift ? alive(g) : eng).filter(u => g.includes(u)), s, i, false, ctx);
        }
      }
      if (cell.type === 'sluice' && prev != null && !st.sluice[i] && alive(g).length) { st.sluice[i] = 1; say2('wave', { room: i, txt: '수문이 열려 무리가 앞 칸으로 쓸려 갔다' }); yield* visit(prev, g, null, true); ev.push({ t: 'go', to: i, who: uids(g) }); }
      if (cell.type === 'warp' && alive(g).length > 1) { const liv = alive(g), out = liv.filter(() => rng(G) < 0.25); if (out.length && out.length < liv.length) { out.forEach(u => g.splice(g.indexOf(u), 1)); queue.push({ units: out, path: curPath, from: 0 }); ev.push({ t: 'go', to: ENT, who: out.map(u => u.uid), back: true }); say2('rift', { room: i, txt: '뒤틀린 복도: ' + out.length + '명이 입구로 떨어졌다' }); } }
      if (cell.type === 'shop' && alive(g).length) { const n = alive(g).length; alive(g).forEach(u => { u.shop = 1; }); earn(G, 4 * c * n * (G.kin.some(k => k.kind === 'clerk') ? 1.5 : 1), '상점'); say2('shop', { room: i, txt: '상점: ' + n + '명이 장을 봤다 (+' + 4 * c * n + 'G, 적 공격↑)' }); }
      if (cell.type === 'decoy') { const out = alive(g).filter(() => rng(G) < 0.3); if (out.length) { const amt = Math.min(Math.max(0, G.gold), 5 * c * out.length); petty += amt; out.forEach(u => { u.gone = true; u.left = 1; }); ev.push({ t: 'fx', k: 'decoy', room: i, who: out.map(u => u.uid), txt: '미끼 방: ' + out.length + '명이 ' + Math.round(amt) + 'G를 들고 돌아갔다' }); } }
    }
    function runAway(g, passed) {
      if (!alive(g).length) return; say2('retreat', { txt: alive(g).length + '명이 물러난다' });
      alive(g).forEach(u => { if (rng(G) < 0.15 + 0.6 * (1 - spf(u)) && G.prison.length + rep.captives.length < prisonCap(G)) { u.gone = true; u.mad = 'kneel'; rep.captives.push({ kind: u.kind, vill: u.vill }); ev.push({ t: 'fx', k: 'kneel', u: u.uid, txt: u.name + '이(가) 무기를 버리고 엎드렸다' }); } });
      if (!alive(g).length) return;
      for (const i of passed.slice().reverse()) { if (!alive(g).length) break; ev.push({ t: 'go', to: i, who: uids(g), back: true }); if (G.cells[i].traps.length) fireTraps(G.cells[i], i, g, true); }
      if (alive(g).length) { ev.push({ t: 'go', to: 'out', who: uids(g), back: true }); alive(g).forEach(u => { u.gone = true; u.left = 1; }); }
    }
    // --- 진행 ---
    const ps = paths(G), sideSet = new Set(sideRooms(G)); let petty = 0, core = false, curPath = ps[0];
    const plot = G.plots[VILL[mt.vill].plot];
    ev.push({ t: 'march', vill: mt.vill, plot: VILL[mt.vill].plot, party: rep.party, gname: rep.gname, txt: VILL[mt.vill].name + '에서 ' + rep.gname + ' ' + party.length + '명' + (plot !== 'none' ? ' (' + PLOT[plot].name + ' 통과)' : '') });
    if (plot === 'garden') G.off.garden = 1;
    const queue = [];
    const groups = ps.map(() => []); party.forEach((u, k) => groups[k % ps.length].push(u));
    const breach = party.some(u => INV[u.kind].breach);
    if (breach) say2('breach', { txt: '병사들이 벽을 뚫고 입구 칸을 건너뛰었다' });
    const fastU = party.filter(u => INV[u.kind].fast); if (fastU.length) { groups.forEach(gr => { for (let k = gr.length - 1; k >= 0; k--) if (INV[gr[k].kind].fast) gr.splice(k, 1); }); say2('breach', { txt: '사냥개 ' + fastU.length + '마리가 앞질러 달려 들어온다' }); queue.push({ units: fastU, path: ps[0], from: Math.min(2, ps[0].length - 2) }); }
    groups.forEach((units, k) => { if (units.length) queue.push({ units, path: ps[k], from: breach ? 1 : 0 }); });
    const arrived = [];
    while (queue.length) {
      const q = queue.shift(), g = q.units, base = g.reduce((a, u) => a + u.mhp, 0), passed = []; curPath = q.path; let prev = null, fled = false;
      for (let s = q.from; s < q.path.length - 1; s++) {
        const i = q.path[s]; yield* visit(i, g, prev, false); passed.push(i); prev = i;
        if (!alive(g).length) break;
        if (hpOf(g) / base < 0.25) { runAway(g, passed); fled = true; break; }
      }
      if (!fled) alive(g).forEach(u => arrived.push(u));
    }
    const last = G.day >= K.days; let fatal = false;
    if (arrived.length) {
      const s = slimeStats(G), sl = { uid: 's', side: 'def', kind: 'slime', name: formName(G), hp: G.slime.hp, mhp: s.hp, atk: s.atk * (ob(G, 'hungry') ? 1.4 : 1), df: s.df * (G.d.away ? 0.8 : 1) * (ox(G, 'gaze') ? 0.75 : 1) };
      const gd = squad('core');
      ev.push({ t: 'go', to: 'core', who: uids(arrived) });
      if (alive(arrived).some(u => INV[u.kind].seal && !u.sealed)) { sealedCore = true; say2('seal', { txt: '학자가 본체의 능력을 봉인했다' }); }
      sanHit(arrived, alive(arrived), stage * 8 * m * (main === 'dusk' && !sealedCore ? 2 : 1) * (combo(G, 'throne') ? 1.5 : 1), '본체를 마주한 침입자들이 얼어붙는다', 'core', 'core');
      if (alive(arrived).length) { const defs = [sl].concat(gd), ctx = yield* decide('core', arrived, defs, true, null); fight(arrived, defs, null, true, ctx); }
      G.slime.hp = Math.max(0, sl.hp); core = sl.hp <= 0; if (!core && sl.hp < sl.mhp * 0.4) G.stats.close = (G.stats.close || 0) + 1;
      if (core) {
        fatal = last || lives(G) <= 1;
        if (!fatal) {
          const frac = Math.min(0.9, K.rob * (G.origin === 'coin' ? 1.6 : 1) * (stage >= 2 && G.slime.sub === 'abyss' ? 0.6 : 1) * (alive(arrived).some(u => u.kind === 'smuggler') ? 1.3 : 1));
          rep.loot = Math.round(Math.max(0, G.gold) * frac);
          ev.push({ t: 'steal', amt: rep.loot, txt: rep.loot > 0 ? '쓰러진 본체 밑에서 ' + rep.loot + 'G를 끌어냈다' : '본체 밑에는 아무것도 없었다' });
          ev.push({ t: 'go', to: 'out', who: uids(arrived), back: true }); alive(arrived).forEach(u => { u.gone = true; u.left = 1; });
        }
      } else if (alive(arrived).length) runAway(arrived, ps[0].slice(0, -1));
    }
    // --- 결과 ---
    const escaped = party.some(u => u.hp > 0 && u.left);
    for (const u of party) {
      if (u.hp <= 0) { const g = INV[u.kind].gold * c; rep.gold += g; rep.corpses++; if (!u.eaten) addCorpse(G, u.kind); G.vill[u.vill].host += u.vill === 'fort' ? 2 : 1; }
      if (u.hp > 0 && u.left && u.kind === 'detective') G.detNext = true;
    }
    { const kv = {}; party.forEach(u => { if (u.hp <= 0) kv[u.vill] = (kv[u.vill] || 0) + 1; }); rep.trustLost = []; for (const v in kv) { const vs = G.vill[v]; if (vs && kv[v] >= K.trustKills && (vs.trust || 0) > 0) { rep.trustLost.push({ v, n: kv[v], was: vs.trust }); vs.trust = 0; } } }
    rep.gold = Math.round(rep.gold * (ob(G, 'moon') ? 1.5 : 1) * (G.star === 'quiet' ? 0.9 : G.star === 'loud' ? 1.2 : 1)); if (rep.gold) earn(G, rep.gold, '소지금');
    if (petty > 0) { spend(G, petty, '미끼 방'); G.stats.stolen += petty; }
    rep.captives.forEach(p => G.prison.push(p)); G.stats.captives += rep.captives.length; if (rep.captives.length) note(G, 'capture'); if (party.filter(u => u.hp <= 0).length >= 3) note(G, 'kill');
    let heal = (stage >= 2 && G.slime.sub === 'brood') ? 2 : 0;
    for (const x of fought) if (x.hp <= 0 && x.ref) { if (x.kind === 'spawn') { G.kin = G.kin.filter(k => k !== x.ref); continue; } if (heal > 0) heal--; else { x.ref.hurt = 2; rep.hurt.push(x.name); } }
    if (core) {
      G.falls = (G.falls || 0) + 1; rep.fell = G.falls; rep.lives = lives(G);
      if (fatal) { rep.result = 'core'; rep.loot = 0; G.over = { win: false, why: last ? '마지막 밤에 본체가 쓰러졌습니다' : '본체가 다시 일어나지 못했습니다' }; }
      else { rep.result = 'stolen'; spend(G, rep.loot, '재물 털림'); G.stats.stolen += rep.loot; note(G, 'stolen'); G.fear = Math.max(0, G.fear - 5); G.slime.hp = slimeStats(G).hp * 0.3; }
    }
    else { rep.result = 'repel'; rep.loot = 0; G.fear += 2; G.stats.repels++; }
    rep.kills = party.filter(u => u.hp <= 0).length; rep.fled = party.filter(u => u.mad === 'flee').length; rep.sealer = party.some(u => u.kind === 'sealer');
    G.stats.kills += rep.kills; G.stats.battles++;
    rep.log = ev.filter(e => e.txt).map(e => e.txt);
    ev.push({ t: 'end', result: rep.result });
    say(G, '침입(' + VILL[mt.vill].name + ' ' + rep.gname + ' ' + rep.count + '명): ' + ({ repel: '격퇴', stolen: '본체가 쓰러져 ' + rep.loot + 'G 털림', core: '본체 쓰러짐' })[rep.result] + (rep.captives.length ? ', 포로 ' + rep.captives.length : ''));
    return rep;
  }

  // ---------- 정산 ----------
  function settle(G, battle) {
    const rep = { notes: [], evolved: null, evoCheck: null, ess: {}, faith: 0 }; if (G.over) return rep;
    const c = cm(G), f0 = G.faith;
    spend(G, upkeep(G), '시설 유지비');
    if (G.prison.length && !combo(G, 'confess')) spend(G, G.prison.length * c, '포로 밥값');
    if (G.spy) spend(G, 5 * c, '첩자 삯'); if (G.leak && isSettle(G)) G.leak = false;
    for (const m of G.kin) { const s = salary(G, m) * (ox(G, 'sprout') ? 2 : 1); m.strike = 0; if (!s) continue; if (G.gold >= s) { spend(G, s, '급여'); m.unpaid = 0; } else { m.unpaid = (m.unpaid || 0) + 1; m.strike = 1; rep.notes.push(m.name + ' 급여 미지급 (내일 밤 불참)'); } }
    // 먹이를 먹는 권속
    G.hungry = (G.hungry || 0) + G.kin.reduce((a, m) => a + (KIN[m.kind].eat || 0), 0);
    while (G.hungry >= 1) { G.hungry -= 1; if (G.corpses.length) G.corpses.shift(); else { const eater = G.kin.find(m => KIN[m.kind].eat && !m.strike); if (eater) { if (eater.kind === 'hunger' && G.gold >= 4 * c) spend(G, 4 * c, '급여'); else { eater.unpaid = (eater.unpaid || 0) + 1; eater.strike = 1; rep.notes.push(eater.name + '이(가) 굶었다'); } } } }
    const gone = G.kin.filter(m => m.unpaid >= 2); if (gone.length) { G.kin = G.kin.filter(m => !(m.unpaid >= 2)); rep.notes.push(gone.map(m => m.name).join(', ') + '이(가) 떠났다'); }
    // 수입
    for (const v of VIDS) { const s = G.vill[v]; if (s.pause > 0) s.pause--; else if (s.tribute && !s.razed) earn(G, Math.round(s.tribute * (1 + 0.25 * (fearGrade(G) - 1))), '공물'); if (trading(G, v)) { earn(G, tradeOf(G, v), '교역'); s.trust = Math.min(trustCap(G), (s.trust || 0) + 1); } else s.trust = 0; s.host = Math.max(0, s.host - (v === 'bell' ? 1 : 3)); }
    G.plots.forEach(p => { if (p === 'garden' && !G.off.garden) earn(G, 8 * c, '텃밭'); });
    // 신앙과 정수
    const cult = G.kin.filter(m => m.kind === 'cultist'); if (G.origin === 'lamp') addFaith(G, 3); addFaith(G, cult.length + cult.filter(m => m.skill === 2).length + 2 * cult.filter(m => m.evo).length);
    G.cells.forEach((x, i) => { if (!x.dug || G.off[i]) return; if (x.type === 'chapel') addFaith(G, 2); const d = ROOM[x.type]; if (d.ess) { addEss(G, d.asp, 2); rep.ess[d.asp] = (rep.ess[d.asp] || 0) + 2; } if (x.type === 'hatchery') addSpawn(G); });
    if (hasRoom(G, 'table') && G.corpses.length) eatN(G, 2);
    rep.faith = G.faith - f0;
    if (G.star === 'quiet' && G.d.fear0 != null && G.fear > G.d.fear0) G.fear = G.d.fear0 + (G.fear - G.d.fear0) / 2;
    G.fear = Math.max(0, G.fear - 2);
    const lick = G.kin.some(m => m.kind === 'licker' && !m.hurt); G.kin.forEach(m => { if (m.hurt > 0) m.hurt = Math.max(0, m.hurt - (lick ? 2 : 1)); m.age = (m.age || 0) + 1; if (m.kind === 'spawn' && m.age >= 4) m.evo = true; });
    if (G.detNext) { G.detBonus = 1.2; G.detNext = false; } else G.detBonus = 1;
    if (G.pilgrims) { G.pilgrimDay = G.day + 1; G.pilgrims = false; }
    rep.ledger = Object.assign({}, G.ledger);
    G.stats.peak = Math.max(G.stats.peak, G.gold);
    if (G.gold < -100 * c) { G.over = { win: false, why: '재물이 바닥나 둥지가 말라붙었습니다' }; return rep; }
    if (isSettle(G)) {
      if (hasRoom(G, 'altar')) addEss(G, G.slime.main || G.startAsp, 8);
      const ate = eatN(G, 99), tot = essTotal(G);
      if (G.day < K.days) {
        const need = K.thresh[G.slime.stage + 1]; if (need) rep.evoCheck = { tot, need, ate };
        if (need && tot >= need) {
          const order = ASPECTS.slice().sort((a, b) => G.slime.ess[b] - G.slime.ess[a] || (a === G.startAsp ? -1 : 0));
          if (G.slime.stage === 0) G.slime.main = order[0];
          if (G.slime.stage === 1) G.slime.sub = order.filter(a => a !== G.slime.main)[0];
          G.slime.stage++; G.slime.hp = slimeStats(G).hp; G.fear += 10; rep.evolved = formId(G); rep.mut = gainMut(G, order[0]) || gainMut(G, null); say(G, '진화: ' + formName(G));
        }
      }
    }
    if (G.day >= K.days) { G.over = { win: true, why: '별이 서는 밤을 넘겼습니다' }; return rep; }
    // 옛 것이 뒤척인다: 오늘 한 짓으로 눈길이 한 칸 움직이고, 내일의 징조가 정해진다
    G.eld = G.eld || { id: G.startAsp, favor: 0, tally: 0 };
    if (G.day >= OMEN_DAY) { const dlt = Math.sign(G.eld.tally); G.eld.favor = clamp(G.eld.favor + dlt, -3, 3); rep.favor = dlt; }
    G.eld.tally = 0;
    if (G.day + 1 >= OMEN_DAY) { const fav = rng(G) < 0.65 ? ELDER[G.eld.id].omens : OMEN_IDS, c = fav.filter(id => !G.omen || id !== G.omen.id), id = G.forceOmen || pick(G, c); G.omenNext = { id, tier: G.eld.favor >= 2 ? 'boon' : G.eld.favor <= -2 ? 'bane' : 'both', calmed: false }; rep.omen = G.omenNext; }
    G.day++; morning(G);
    return rep;
  }
  // 낮을 끝낸다. decide(ctx)로 밤 개입을 고른다 (없으면 개입 안 함).
  function endDay(G, decide) {
    if (G.over) return null;
    dusk(G);
    const it = nightGen(G); let r = it.next();
    while (!r.done) r = it.next(decide ? decide(r.value) : { k: 'none' });
    return { battle: r.value, settle: settle(G, r.value) };
  }
  function beginNight(G) { dusk(G); return nightGen(G); }

  // ---------- 점수 ----------
  function luxury(G) { let v = 0; G.cells.forEach(c => { if (c.dug) v += ROOM[c.type].cost / 10 + c.traps.reduce((a, t) => a + t.lv * 2, 0) + (c.zone ? 3 : 0) + (c.lv - 1) + 1; }); return Math.round(v); }
  // 이단 화신: 성체까지 자랐는데 그 징조답지 않게 굴었을 때
  function heretic(G) { const m = G.slime.main, st = G.stats; if (G.slime.stage < 4) return false; return m === 'abyss' ? !st.aspBuilt : m === 'nebula' ? !st.hands : m === 'brood' ? G.kin.filter(k => k.kind !== 'spawn').length <= 4 : m === 'dusk' ? st.kills <= 10 : (st.eats || 0) <= 5; }
  function endKey(G) { return G.slime.stage === 0 ? 'none' : G.child === 'home' && G.sacrifices === 0 ? 'child' : heretic(G) ? 'h_' + G.slime.main : G.sacrifices === 0 ? 'pure' : G.slime.main; }
  function avatarOf(G) { return AVATAR[endKey(G)]; }
  function score(G) {
    const parts = [['재물', Math.min(6000, Math.max(0, Math.round(G.gold / 2)))], ['공포', Math.round(G.fear * 10)], ['둥지 호화도', luxury(G) * 25], ['권속 전력', G.kin.reduce((a, m) => a + m.lv, 0) * 25], ['진화', G.slime.stage * 400], ['변이', G.slime.muts.length * 100], ['격퇴', G.stats.repels * 40], ['신도', G.kin.filter(m => m.kind === 'cultist').length * 30], ['탐식', hoardN(G, 'gulp') * 150 + (hoardN(G, 'seat') + hoardN(G, 'life') + hoardN(G, 'veil')) * 250], ['털린 재물', -Math.round(G.stats.stolen)]];
    const base = parts.reduce((a, p) => a + p[1], 0), mult = DIFF[G.diff].score * (G.over && G.over.win ? 1 : 0.4), total = Math.max(0, Math.round(base * mult));
    return { parts, mult, total, grade: GRADES.find(g => total >= g[1])[0] };
  }

  return { K, ASPECTS, ASP, COLS, ROWS, N, ENT, CORE, nbrs, lives, livesMax, migrate, trading, tradeOf, trustCap, HOARD, hoardN, hoardCost, hoardWhy, hoardBuy, ORIGIN, digCost, SIGN, TRAITS, traitReady, eventInfo, ROOM, TRAP, ZONE, PLOT, KIN, SKILL_LV, INV, GRADE_NAME, VILL, VIDS, FORM1, FORM2, FORM2UP, SUBTRAIT, AVATAR, MUT, DIFF, GRADES, EVENTS,
    newGame, actOf, cm, sm, isSettle, formId, formName, essTotal, fearGrade, faithCap, corpseCap, corpsePts, slimeStats, kinStats, salary, upkeep, capacity, freeSlot, prisonCap, handsMax, spellCost, seesDetail, expNeed,
    paths, sideRooms, estimate, partyBudget, canDig, digPreview, dig, toggleBlock, canBuild, buildCost, build, addTrap, trapUpCost, upTrap, setZone, setPlot, accept, acceptCost, dismiss, moveKin, setSkill, setStance, train, eat, rest,
    SPOT, spotOptions, resolveSpot, ELDER, OMEN, OMEN_IDS, OMEN_DAY, CALM_COST, ACT_NAME, calm, COMBO, combos, BURIED, STAR, EVO, EVO_DESC, kinName, evoCost, evolveKin, GUEST, guestOptions, resolveGuest, convertKind, endKey, convertChance, ransomOf, sacEss, mutChance, dispose, raidInfo, raid, eventOptions, resolveEvent, endDay, beginNight, settle, luxury, avatarOf, score };
})();
if (typeof module !== 'undefined') module.exports = NEST;
