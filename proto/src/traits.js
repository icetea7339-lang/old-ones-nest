// 옛 것의 둥지 — 몸의 유전자 (화면과 분리, node 에서도 돈다)
// 한 일이 곧 몸이 된다: 판에서 센 것(counters)이 형질(tags)의 무게가 되고, 무게 큰 형질 몇 개와 그 짝(combos)이 몸의 꼴과 이름을 정한다.
// genome = { aspect, sub, stage, tags: { 형질: 무게 }, seed, lineage: [], feed: { 형질: [[셈, 기여], ...] } }
const TRAITS = (function () {
  'use strict';
  const ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
  const ASPN = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' };

  // 판에서 세는 것. 규칙 쪽(G.stats)이 이 이름으로 넘겨 주면 된다
  const COUNTERS = {
    trapKills: '함정으로 쓰러뜨림', kinKills: '권속이 쓰러뜨림', coreKills: '본체가 직접 쓰러뜨림', swallows: '통째로 삼킴',
    infections: '감염시킴', risen: '감염체가 일어남', captives: '산 채로 붙잡음', converts: '믿게 만듦', eaten: '먹어 치움',
    kinLost: '잃은 권속', nightsAlone: '권속 없이 넘긴 밤', kinMade: '들인 권속', spawns: '돋운 움',
    skillsUsed: '쓴 기술', wordsLearned: '배운 사람 말', coreDamage: '본체가 받은 상처', digestKills: '소화액에서 죽음',
    waterKills: '물에서 죽음', pulled: '끌어온 적', madness: '미치게 한 적', routs: '쫓아 보낸 적', shapesPlaced: '놓은 굴', organsPlaced: '놓은 기관',
    trapsPlaced: '단 부위', combos: '맞춘 족보', nightsDark: '빛 없이 넘긴 밤', bossKills: '쓰러뜨린 우두머리',
    ess_abyss: '심연 정수', ess_nebula: '성운 정수', ess_brood: '번식 정수', ess_dusk: '황혼 정수', ess_hunger: '기아 정수'
  };

  // 형질. asp = 잘 붙는 징조, feed = [셈, 무게] (셈 하나당 무게), hint = 놀이에서 무엇이 달라지나 (20자 안)
  // part = 몸에 돋는 것 (bodygen 이 그린다), loco/post/sym = 몸꼴에 주는 표
  const TAGS = {
    maw: { name: '아가리', asp: ['abyss', 'hunger'], feed: [['swallows', 3], ['coreKills', 1.2], ['eaten', 0.6]], hint: '약한 적을 통째로 삼킨다', loco: { crawl: 1 }, post: { low: 1 }, sym: { bi: 1 } },
    spore: { name: '포자', asp: ['brood'], feed: [['infections', 2.4], ['risen', 2]], hint: '죽은 적이 감염체로 선다', loco: { many: 1, root: 0.6 }, post: { sag: 1 }, sym: { asym: 1.4 } },
    eye: { name: '눈', asp: ['nebula'], feed: [['madness', 2.2], ['skillsUsed', 0.8], ['combos', 0.6]], hint: '다가오는 무리가 다 보인다', loco: { float: 0.8 }, post: { up: 0.6 }, sym: { rad: 1.4 } },
    water: { name: '물', asp: ['abyss'], feed: [['waterKills', 2.6], ['ess_abyss', 0.35]], hint: '지나가는 적이 젖어 느려진다', loco: { slither: 1.4 }, post: { sag: 0.8 }, sym: { bi: 0.6 } },
    bone: { name: '뼈', asp: ['hunger', 'dusk'], feed: [['eaten', 1.4], ['bossKills', 3], ['ess_hunger', 0.25]], hint: '버티는 힘이 붙는다', loco: { l4: 1, l2: 0.4 }, post: { up: 0.6 }, sym: { bi: 1 } },
    tent: { name: '촉수', asp: ['abyss'], feed: [['captives', 1.6], ['swallows', 0.8], ['routs', 0.6]], hint: '앞의 적을 붙든다', loco: { slither: 1, float: 0.5 }, post: { sag: 1 }, sym: { rad: 0.8 } },
    egg: { name: '알', asp: ['brood'], feed: [['spawns', 1.6], ['kinMade', 1.2]], hint: '움이 더 자주 돋는다', loco: { many: 0.8 }, post: { crouch: 1 }, sym: { asym: 1 } },
    spike: { name: '가시', asp: ['hunger'], feed: [['coreDamage', 0.5], ['coreKills', 1]], hint: '때린 적이 되찔린다', loco: { l6: 1, l4: 0.5 }, post: { crouch: 0.6 }, sym: { bi: 0.8 } },
    face: { name: '얼굴', asp: ['dusk'], feed: [['wordsLearned', 3], ['converts', 1.6]], hint: '사람이 너를 믿기 쉽다', loco: { l2: 1.6 }, post: { up: 1.4 }, sym: { bi: 1.2 } },
    gut: { name: '소화', asp: ['hunger'], feed: [['digestKills', 2.6], ['eaten', 1]], hint: '쓰러진 적이 곧 진액이 된다', loco: { crawl: 0.8 }, post: { sag: 1 }, sym: { bi: 0.6 } },
    shadow: { name: '그림자', asp: ['dusk'], feed: [['nightsDark', 2], ['routs', 1.4]], hint: '처음 마주친 적이 겁먹는다', loco: { float: 0.6, slither: 0.4 }, post: { crouch: 0.8 }, sym: { asym: 0.8 } },
    star: { name: '별', asp: ['nebula'], feed: [['skillsUsed', 1.8], ['ess_nebula', 0.35]], hint: '기술 하나가 더 싸다', loco: { float: 1.4 }, post: { up: 0.6 }, sym: { rad: 1.2 } },
    trap: { name: '덫기관', asp: ['abyss', 'hunger'], feed: [['trapKills', 2.2], ['trapsPlaced', 0.8]], hint: '함정이 한 번 더 문다', loco: { root: 0.8, crawl: 0.6 }, post: { low: 1.2 }, sym: { bi: 0.6 } },
    alone: { name: '홀로', asp: ['hunger', 'dusk'], feed: [['kinLost', 1.8], ['nightsAlone', 3]], hint: '곁이 비면 본체가 세진다', loco: { l2: 0.6, l4: 0.6 }, post: { crouch: 1.2 }, sym: { asym: 0.8 } },
    swarm: { name: '떼', asp: ['brood'], feed: [['kinMade', 1.4], ['spawns', 1]], hint: '권속이 많을수록 세진다', loco: { many: 1.4 }, post: { low: 0.6 }, sym: { asym: 1 } },
    shell: { name: '껍질', asp: ['abyss'], feed: [['coreDamage', 0.9], ['nightsAlone', 0.6]], hint: '첫 피해를 막는다', loco: { l6: 0.8, crawl: 0.6 }, post: { low: 1 }, sym: { bi: 1 } },
    wing: { name: '날개막', asp: ['nebula', 'dusk'], feed: [['routs', 1.2], ['shapesPlaced', 0.4]], hint: '굴 사이를 건너뛴다', loco: { float: 1.6 }, post: { up: 0.6 }, sym: { bi: 1.2 } },
    glow: { name: '빛', asp: ['nebula'], feed: [['combos', 1.4], ['madness', 0.6]], hint: '어둠 속 적이 드러난다', loco: { float: 0.6 }, post: { up: 0.4 }, sym: { rad: 0.8 } },
    root: { name: '뿌리', asp: ['brood'], feed: [['organsPlaced', 1.2], ['shapesPlaced', 0.6]], hint: '기관이 더 오래 버틴다', loco: { root: 2 }, post: { up: 0.4, sag: 0.4 }, sym: { asym: 0.6 } },
    mirror: { name: '거울살', asp: ['dusk'], feed: [['madness', 1.2], ['converts', 1]], hint: '적이 제 편을 잘못 친다', loco: { l2: 0.8, slither: 0.4 }, post: { up: 0.8 }, sym: { bi: 1 } },
    tongue: { name: '혀', asp: ['brood', 'hunger'], feed: [['pulled', 2.6], ['eaten', 0.8], ['captives', 0.6]], hint: '멀리 있는 것을 끌어온다', loco: { crawl: 0.8 }, post: { low: 0.6 }, sym: { bi: 0.6 } },
    horn: { name: '뿔', asp: ['hunger', 'abyss'], feed: [['bossKills', 2.4], ['kinKills', 0.6]], hint: '우두머리에게 더 아프다', loco: { l4: 1 }, post: { up: 0.4 }, sym: { bi: 1 } }
  };
  const TAG_IDS = Object.keys(TAGS);

  // 몸꼴: 크기(허물 다섯) · 걸음 · 자세 · 대칭
  const LOCO = { crawl: '기는', l2: '두 발로 걷는', l4: '네 발로 걷는', l6: '여섯 발로 걷는', many: '발이 많은', float: '떠다니는', root: '박혀 있는', slither: '미끄러지는' };
  const POST = { low: '낮게 깔린', up: '곧게 선', crouch: '웅크린', sag: '늘어진' };
  const SYM = { bi: '좌우가 같은', rad: '둥글게 퍼진', asym: '비뚤어진' };
  const PLAN = { blob: '한 덩이', seg: '마디진', neck: '목이 긴', pear: '배 처진' };
  const ASP_LOCO = { abyss: { slither: 0.6, crawl: 0.4 }, nebula: { float: 0.8 }, brood: { many: 0.6, root: 0.3 }, dusk: { l2: 0.6, float: 0.2 }, hunger: { l4: 0.6, crawl: 0.3 } };
  const ASP_POST = { abyss: { low: 0.5 }, nebula: { up: 0.5 }, brood: { sag: 0.5 }, dusk: { up: 0.4, crouch: 0.2 }, hunger: { crouch: 0.5 } };
  const ASP_SYM = { abyss: { bi: 0.4 }, nebula: { rad: 0.5 }, brood: { asym: 0.5 }, dusk: { bi: 0.5 }, hunger: { bi: 0.3, asym: 0.2 } };

  // 형질의 짝: 둘(또는 셋)이 함께 무거우면 새 것이 돋는다
  const COMBOS = [
    ['water', 'spore', '습지 포자낭', '젖은 포자가 굴을 메운다'], ['eye', 'maw', '보는 아가리', '삼킨 적의 기억을 본다'],
    ['bone', 'face', '가면 쓴 것', '뼈 위에 사람 얼굴'], ['tent', 'shadow', '숨은 팔', '보이지 않는 팔이 붙든다'],
    ['egg', 'swarm', '끝없는 산란', '밤마다 움이 쏟아진다'], ['star', 'eye', '별을 세는 눈', '하늘의 바늘을 센다'],
    ['maw', 'gut', '두 번째 위', '삼킨 것이 바로 진액이 된다'], ['spike', 'shell', '가시 갑주', '때린 것이 피를 흘린다'],
    ['root', 'spore', '포자 숲', '뿌리마다 포자가 핀다'], ['wing', 'shadow', '밤의 막', '어둠 속을 미끄러진다'],
    ['face', 'mirror', '남의 얼굴', '적이 저를 저로 본다'], ['tent', 'water', '해구의 팔', '물 밑에서 끌어당긴다'],
    ['eye', 'glow', '등불 눈', '눈이 스스로 빛난다'], ['bone', 'horn', '뼈 왕관', '우두머리를 꿰뚫는다'],
    ['alone', 'spike', '고슴도치 외톨이', '홀로 남아 가시가 섰다'], ['alone', 'shadow', '마지막 그림자', '아무도 남지 않은 굴'],
    ['egg', 'water', '물알', '물속에서 알이 깬다'], ['trap', 'maw', '입 덫', '굴 바닥이 입이 된다'],
    ['trap', 'spore', '포자 덫', '밟으면 포자가 터진다'], ['tongue', 'maw', '긴 혀 아귀', '멀리서 끌어와 삼킨다'],
    ['swarm', 'face', '얼굴 떼', '권속마다 다른 얼굴'], ['star', 'wing', '별 사이 막', '별 사이 바다를 기억한다'],
    ['gut', 'spore', '썩는 배', '배 속에서 감염체가 자란다'], ['shell', 'water', '조개 등', '물을 머금은 껍데기'],
    ['root', 'bone', '뼈뿌리', '무덤 위에 뿌리내린다'], ['glow', 'water', '빛 물결', '물이 빛을 머금는다'],
    ['mirror', 'eye', '거울 눈', '보는 것이 비친다'], ['horn', 'shell', '뿔 껍데기', '들이받는 껍데기'],
    ['tent', 'egg', '알 품은 팔', '팔 끝에 알이 맺힌다'], ['spike', 'tongue', '가시 혀', '혀가 찌른다'],
    ['shadow', 'face', '그늘진 얼굴', '어둠 속에서 웃는다'], ['wing', 'eye', '날개 눈', '막마다 눈이 뜬다'],
    ['maw', 'spike', '이빨 숲', '입 둘레가 가시'], ['swarm', 'alone', '흩어진 하나', '떼였다가 하나였다가'],
    ['root', 'trap', '뿌리 덫', '굴 벽이 붙잡는다'], ['star', 'glow', '작은 별', '몸 안에 별이 떴다'],
    ['water', 'maw', '빨아들이는 물', '물과 함께 삼킨다'], ['eye', 'spore', '눈 포자', '포자마다 눈이 달렸다'],
    ['bone', 'spore', '뼈곰팡이', '뼈에서 포자가 난다'], ['face', 'tongue', '말하는 혀', '사람 말을 흉내 낸다'],
    ['eye', 'maw', 'star', '삼킨 하늘', '입 안에 별이 보인다'], ['egg', 'swarm', 'spore', '번지는 둥지', '굴 전체가 자궁'],
    ['bone', 'face', 'mirror', '모두의 가면', '얼굴을 갈아 끼운다'], ['tent', 'water', 'maw', '해구 그 자체', '굴이 바다 밑이 된다']
  ].map(c => { const tags = c.slice(0, c.length - 2), name = c[c.length - 2], text = c[c.length - 1]; return { id: tags.join('+'), tags, name, text }; });

  // 이름 붙은 극단 형태: 드물게만 닿는다
  const share = (g, t) => { const s = sum(g.tags); return s ? (g.tags[t] || 0) / s : 0; };
  const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const cnt = (g, k) => (g.seen && g.seen[k]) || 0;
  // 이정표는 위쪽 다섯 형질 안에서의 몫으로 잰다 (형질이 스물둘이라 전체 몫은 늘 작다)
  const shr = (g, t) => { if (!g.norm) return share(g, t); const top = TAG_IDS.filter(x => g.tags[x] > 0).sort((a, b) => g.tags[b] - g.tags[a]).slice(0, 4), s = top.reduce((a, x) => a + g.tags[x], 0); return s && top.includes(t) ? g.tags[t] / s : 0; };
  // 셈마다 크기가 다르다(정신 피해는 천 단위, 우두머리는 한두 번). 한 판에 흔히 쌓이는 만큼을 20 으로 맞춰 무게를 잰다
  const SCALE = { trapKills: 48, kinKills: 200, coreKills: 42, swallows: 120, infections: 100, risen: 26, captives: 50, converts: 3, eaten: 18, kinLost: 4, nightsAlone: 3, kinMade: 10, spawns: 20, skillsUsed: 27, wordsLearned: 8, coreDamage: 1800, digestKills: 10, waterKills: 70, pulled: 50, madness: 1500, routs: 1500, shapesPlaced: 14, organsPlaced: 10, trapsPlaced: 11, combos: 90, nightsDark: 11, bossKills: 2, ess_abyss: 190, ess_nebula: 170, ess_brood: 120, ess_dusk: 220, ess_hunger: 210 };
  const TGX = typeof process !== 'undefined' && process.env && process.env.TGX ? +process.env.TGX : 1.0;
  const TAGW = typeof process !== 'undefined' && process.env && process.env.TAGW ? +process.env.TAGW : 1.4;
  const GX = typeof process !== 'undefined' && process.env && process.env.GEXP ? +process.env.GEXP : 1.0;
  // 판마다 거의 같은 만큼 쌓이는 셈(굴·기관·함정 놓기, 어두운 밤, 족보, 정수)은 덜 친다: 몸은 남과 다르게 한 것으로 갈라진다
  const FLAT = { shapesPlaced: 0.35, organsPlaced: 0.45, trapsPlaced: 0.45, nightsDark: 0.5, combos: 0.55, ess_abyss: 0.6, ess_nebula: 0.6, ess_brood: 0.6, ess_dusk: 0.6, ess_hunger: 0.6, kinKills: 0.7, coreKills: 0.8 };
  const eff = (g, k, c) => g.norm ? (FLAT[k] || 1) * Math.pow(c * 20 / (SCALE[k] || 20), GX) : Math.sqrt(c);
  const LANDMARKS = [
    { id: 'chorus', name: '합창하는 살', text: '입마다 다른 기도를 한다', f: ['maw', 'face'], fx: g => cnt(g, 'converts') >= 3, when: g => shr(g, 'maw') + shr(g, 'face') > 0.55 && shr(g, 'maw') > 0.2 && cnt(g, 'converts') >= 5 },
    { id: 'mimic', name: '사람이 되려던 것', text: '두 발로 서서 웃는 법을 배웠다', f: ['face', 'mirror'], when: g => shr(g, 'face') + shr(g, 'mirror') > 0.5 && shr(g, 'face') > shr(g, 'mirror') && shr(g, 'face') < 0.7 && classOf(g).loco === 'l2' },
    { id: 'madlight', name: '미치게 하는 빛', text: '바라본 것이 제 편을 친다', f: ['glow', 'eye'], fx: g => cnt(g, 'madness') >= 2500, when: g => cnt(g, 'madness') >= 30 && shr(g, 'eye') < 0.45 && shr(g, 'glow') > 0.15 && shr(g, 'eye') + shr(g, 'glow') + shr(g, 'mirror') > 0.45 },
    { id: 'forest', name: '걸어 다니는 숲', text: '포자만 먹고 자란 몸. 걸음마다 숲이 따라 걷는다', f: ['spore', 'root'], fx: g => g.stage >= 3, when: g => shr(g, 'spore') + shr(g, 'root') > 0.55 && shr(g, 'root') >= 0.1 && g.stage >= 3 },
    { id: 'plague', name: '역병 그 자체', text: '닿는 것마다 자기 것이 된다', f: ['spore'], fx: g => cnt(g, 'infections') >= 100, when: g => cnt(g, 'infections') >= 100 && shr(g, 'spore') > 0.36 && shr(g, 'root') < 0.1 },
    { id: 'scarred', name: '흉터투성이', text: '받은 상처가 다 갑옷이 됐다', f: ['shell', 'spike'], fx: g => cnt(g, 'coreDamage') >= 2500, when: g => cnt(g, 'coreDamage') >= 2000 && cnt(g, 'coreKills') >= 40 && shr(g, 'shell') + shr(g, 'spike') + shr(g, 'bone') > 0.46 },
    { id: 'echo', name: '위대한 것의 메아리', text: '다섯 빛깔이 다 섞였다. 저 아래의 것을 가장 닮았다', when: g => g.stage >= 5 && TAG_IDS.filter(t => share(g, t) > 0.045).length >= (g.norm ? 10 : 9) && Math.max.apply(null, TAG_IDS.map(t => share(g, t))) < (g.norm ? 0.105 : 0.15) },
    { id: 'tiny', name: '작은 채로 다 큰 것', text: '끝까지 작았지만 누구보다 오래 살았다', when: g => g.stage <= 3 && cnt(g, 'bossKills') >= 4 },
    { id: 'hollow', name: '속이 빈 것', text: '먹어도 먹어도 비어 있다', f: ['gut', 'alone'], when: g => shr(g, 'gut') > 0.3 && shr(g, 'alone') > 0.25 },
    { id: 'crowned', name: '뼈 왕관을 쓴 것', text: '우두머리들의 뿔을 이어 붙였다', f: ['horn'], fx: g => cnt(g, 'bossKills') >= 2, when: g => shr(g, 'horn') > 0.3 && cnt(g, 'bossKills') >= 3 },
    { id: 'patient', name: '기다리는 것', text: '한 자리에서 움직이지 않고 다 먹었다', f: ['maw', 'root'], when: g => classOf(g).loco === 'root' && shr(g, 'maw') > 0.18 && shr(g, 'maw') + shr(g, 'trap') > 0.48 },
    { id: 'drowned', name: '가라앉은 정원', text: '물과 뿌리와 포자가 엉킨 몸', f: ['water', 'root', 'spore'], when: g => (g.tags.water || 0) > 0 && (g.tags.root || 0) > 0 && (g.tags.spore || 0) > 0 && shr(g, 'water') + shr(g, 'root') + shr(g, 'spore') > 0.72 && Math.min(shr(g, 'water'), shr(g, 'root'), shr(g, 'spore')) > 0.14 },
    { id: 'skywound', name: '하늘의 상처', text: '날개막 사이로 별 사이 바다가 보인다', f: ['wing', 'star'], when: g => shr(g, 'wing') + shr(g, 'star') > 0.5 },
    { id: 'allfaces', name: '모두의 얼굴', text: '삼킨 사람들의 얼굴이 다 남아 있다', f: ['face'], fx: g => cnt(g, 'wordsLearned') >= 11, when: g => cnt(g, 'wordsLearned') >= 9 && shr(g, 'face') > 0.36 },
    { id: 'lastone', name: '마지막 하나', text: '곁에 아무도 남지 않았다. 그래서 무엇보다 크다', f: ['alone'], fx: g => cnt(g, 'kinMade') <= 4, when: g => shr(g, 'alone') > 0.34 && cnt(g, 'nightsAlone') >= 6 },
    { id: 'ossuary', name: '걷는 납골당', text: '먹은 것의 뼈를 다 두르고 다닌다', f: ['bone'], fx: g => cnt(g, 'eaten') >= 20, when: g => shr(g, 'bone') > 0.4 && cnt(g, 'eaten') >= 30 },
    { id: 'constel', name: '내려온 별자리', text: '몸에 바늘 일곱이 박혀 빛난다', f: ['star', 'glow'], fx: g => g.stage >= 4, when: g => shr(g, 'star') + shr(g, 'glow') > 0.5 && g.stage >= 4 },
    { id: 'tongue', name: '굴을 핥는 혀', text: '혀가 굴 끝에서 끝까지 닿는다', f: ['tongue'], when: g => shr(g, 'tongue') > 0.4 },
    { id: 'swarmone', name: '하나인 떼', text: '수백 마리가 한 몸처럼 움직인다', f: ['swarm'], when: g => shr(g, 'swarm') > 0.42 && shr(g, 'swarm') > shr(g, 'egg') },
    { id: 'queen', name: '끝없는 어미', text: '숨 쉴 때마다 알이 떨어진다', f: ['egg', 'swarm'], when: g => shr(g, 'egg') + shr(g, 'swarm') > 0.6 },
    { id: 'veil', name: '거울 너울', text: '보는 이마다 다른 것을 본다', f: ['mirror'], when: g => shr(g, 'mirror') > 0.33 },
    { id: 'shellmind', name: '껍데기 속의 생각', text: '껍데기를 몇 겹 둘렀는지 스스로도 모른다', f: ['shell'], when: g => shr(g, 'shell') > 0.4 && shr(g, 'shell') > shr(g, 'spike') * 1.5 },
    { id: 'lantern', name: '등불 무리', text: '어둠 속의 작은 해들', f: ['glow'], when: g => shr(g, 'glow') > 0.38 },
    { id: 'pit', name: '바닥 없는 아가리', text: '몸이 거의 입이다', f: ['maw'], when: g => shr(g, 'maw') > 0.45 },
    { id: 'thousandeyes', name: '천의 눈', text: '어느 쪽에서 와도 보인다', f: ['eye'], when: g => shr(g, 'eye') > 0.42 },
    { id: 'trench', name: '걸어 나온 해구', text: '물이 몸이고 몸이 물이다', f: ['water', 'tent'], when: g => shr(g, 'water') + shr(g, 'tent') > 0.6 },
    { id: 'pitfall', name: '굴이 된 몸', text: '어디까지가 굴이고 어디부터 몸인지 모른다', f: ['trap', 'root'], when: g => shr(g, 'trap') + shr(g, 'root') > 0.57 },
    { id: 'hedgehog', name: '찔리는 산', text: '가시가 가시를 낳았다', f: ['spike', 'shell'], when: g => shr(g, 'spike') + shr(g, 'shell') > 0.55 },
    { id: 'nomad', name: '그늘 나그네', text: '빛이 닿기 전에 늘 다른 곳에 있다', f: ['shadow', 'wing'], when: g => shr(g, 'shadow') + shr(g, 'wing') > 0.5 },
    { id: 'gourmand', name: '다 먹는 배', text: '소화하는 소리가 굴 끝까지 들린다', f: ['gut', 'maw'], when: g => shr(g, 'gut') + shr(g, 'maw') > 0.62 }
  ];

  // ---- 셈 → 무게 ----
  // 같은 셈도 시드에 따라 아주 조금 흔들린다: 비슷하게 놀아도 판마다 조금씩 다른 쪽으로 기운다
  const hash = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const rng = seed => { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // 처음 몸(seeds.js 의 열다섯): 고른 몸이 첫날의 몸이 된다. 작은 씨앗 형질로 들어가 놀이가 쌓이면 묻힌다
  const LOOKSEED = { drop: { water: 1 }, sliver: { star: 1, wing: 0.5 }, bead: { shell: 1 }, husk: { shell: 0.6, bone: 0.7 }, mote: { shadow: 1 }, coil: { tent: 1 }, eye: { eye: 1.2 }, twin: { eye: 0.7, face: 0.6 },
    horn: { horn: 1.2 }, sticky: { tongue: 1 }, flat: { shadow: 0.6, shell: 0.6 }, glow: { glow: 1.2 }, spore: { spore: 1.2 }, pod: { egg: 1.2 }, thorn: { spike: 1.2 } };
  const LOOKW = 1.6, LOOKF = typeof process !== 'undefined' && process.env && process.env.LOOKF ? +process.env.LOOKF : 0.14;
  // 서술(문어체 과거형): 무엇을 했나(앞 절, "-고") → 몸 어디에 무엇이 돋았나(뒤 절). 숫자는 접어 둔 곳에만
  const DID = { trapKills: '덫에 걸려 죽은 것들의 맛이 살갗에 배었고', kinKills: '권속이 물어 온 피가 몸 안을 돌았고', coreKills: '그것이 몸소 짓이긴 것들이 속에 남았고', swallows: '통째로 삼킨 것들이 아직 안에서 꿈틀거렸고', infections: '포자를 옮겨 받은 몸들이 굴 밖에서 썩어 갔고',
    risen: '감염된 것들이 다시 일어섰고', captives: '산 채로 붙든 것들의 떨림이 굴 벽을 타고 전해졌고', converts: '그것을 믿게 된 자들의 기도가 어둠에 쌓였고', eaten: '먹어 치운 살이 그것의 살이 되었고', kinLost: '잃어버린 살붙이의 빈자리가 식어 갔고',
    nightsAlone: '곁에 아무도 없는 밤이 이어졌고', kinMade: '살이 거듭 갈라져 나갔고', spawns: '움이 쉬지 않고 돋았고', skillsUsed: '밤마다 그것의 손길이 굴 안을 더듬었고', wordsLearned: '삼킨 자들의 말이 안에서 웅얼거렸고', coreDamage: '찢긴 상처가 아물지 않은 채 굳었고',
    digestKills: '위액에 녹은 것들이 굴 바닥에 고였고', waterKills: '물에 잠긴 자들이 다시 떠오르지 않았고', pulled: '끌려온 것들의 발버둥이 흙에 새겨졌고', madness: '미쳐 버린 눈동자들이 그것을 비추었고', routs: '달아난 자들의 겁에 질린 냄새가 굴에 남았고', shapesPlaced: '굴은 깊고 길게 뻗어 나갔고',
    organsPlaced: '굴 벽마다 새 기관이 박동했고', trapsPlaced: '굴 곳곳에 그것의 일부가 덫으로 매달렸고', combos: '굴의 모양이 어떤 오래된 무늬와 맞물렸고', nightsDark: '빛 한 줄기 없는 밤이 이어졌고', bossKills: '쓰러진 우두머리의 무게가 그것을 짓눌렀고',
    ess_abyss: '깊은 물의 기운이 스며들었고', ess_nebula: '별 사이의 빛이 스며들었고', ess_brood: '번식의 기운이 스며들었고', ess_dusk: '황혼의 기운이 스며들었고', ess_hunger: '굶주림이 스며들었고' };
  const GREW = { maw: '배에 새 아가리가 벌어졌다', spore: '등에 포자 주머니가 부풀어 올랐다', eye: '살갗 위로 눈이 하나둘 떠올랐다', water: '몸이 젖은 지느러미로 덮였다', bone: '안쪽에서부터 뼈가 굳어 갔다', tent: '옆구리에서 촉수가 뻗어 나왔다',
    egg: '배 밑에 알이 매달렸다', spike: '등에 가시가 돋았다', face: '몸 한쪽에 사람의 얼굴이 떠올랐다', gut: '속이 위액 주머니로 채워졌다', shadow: '몸 둘레에 그림자가 엉겨 붙었다', star: '살 속에 별빛 같은 점이 박혔다',
    trap: '피부 한 곳이 덫처럼 오므라드는 기관으로 바뀌었다', alone: '살은 홀로 서기 위해 굳어 갔다', swarm: '몸이 여럿으로 나뉘어 서로 붙었다', shell: '등이 단단한 껍질로 덮였다', wing: '팔 사이에 얇은 막이 펼쳐졌다',
    glow: '살갗 아래로 희미한 빛이 번졌다', root: '발밑에서 뿌리가 흙을 파고들었다', mirror: '살갗이 거울처럼 매끈해졌다', tongue: '입 밖으로 긴 혀가 늘어졌다', horn: '머리에 뿔이 솟았다' };
  // 한 형질이 왜 돋았나를 한 문장으로 (원인 셈이 없으면 결과만)
  function tell(t, k) {
    const g = GREW[t] || '몸이 조금 달라졌다';
    if (!k) return '어느새 ' + g + '.';
    if (k.indexOf('look:') === 0) return '떨어질 때 받은 모양이 아직 남아 있었고, ' + g + '.';
    if (k.indexOf('pro:') === 0) return ['한 방울이던 때 삼킨 것들이 아직 몸 안에 남아 있었고', '흙 속을 기어 다니던 날들이 살에 새겨졌고', '처음 깨어난 어둠의 맛이 가시지 않았고'][TAG_IDS.indexOf(t) % 3] + ', ' + g + '.';
    if (k.indexOf('tag:') === 0) { const tn = TAGS[k.slice(4)] ? TAGS[k.slice(4)].name : ''; return (tn ? tn + '의 기운을 거듭 불러낸 버릇이 몸에 배었고, ' : '같은 것을 거듭 불러낸 버릇이 몸에 배었고, ') + g + '.'; }
    return (DID[k] || '굴에서 일어난 일들이 몸에 남았고') + ', ' + g + '.';
  }
  // 허물의 "왜": 위쪽 형질 셋을 이야기로
  function narrate(g, n) { return topTags(g, n || 3).map(t => { const f = (g.feed[t] || [])[0]; return tell(t, f ? f[0] : null); }); }
  // 하루 사이 가장 크게 자란 형질과 그 까닭
  function grewMost(g0, g1) { let best = null, bv = 0; for (const t of TAG_IDS) { const d = (g1.tags[t] || 0) - ((g0 && g0.tags[t]) || 0); if (d > bv) { bv = d; best = t; } } if (!best) return null; const f = (g1.feed[best] || [])[0]; return { tag: best, gain: +bv.toFixed(2), line: tell(best, f ? f[0] : null) }; }
  function newGenome(o) { o = o || {}; return { norm: !!o.norm, aspect: o.aspect || 'abyss', sub: o.sub || null, stage: o.stage || 1, tags: {}, seed: (o.seed >>> 0) || 1, lineage: o.lineage || [], feed: {}, seen: {}, look: o.look && LOOKSEED[o.look] ? o.look : null, pro: o.pro || null }; }
  function addBehaviour(g, counters) {
    const seen = g.seen = Object.assign({}, g.seen || {});
    for (const k in counters) seen[k] = (seen[k] || 0) + (+counters[k] || 0);
    const tags = {}, feed = {};
    for (const t of TAG_IDS) {
      let w = 0; const from = [];
      for (const [k, m] of TAGS[t].feed) { const c = seen[k] || 0; if (!c) continue; const v = m * eff(g, k, c); w += v; from.push([k, c, v]); }
      if (g.norm && seen['tag:' + t]) { const c = seen['tag:' + t], v = TAGW * Math.pow(c * 20 / 8, TGX); w += v; from.push(['tag:' + t, c, v]); }
      if (TAGS[t].asp.includes(g.aspect)) w *= 1.25; else if (g.sub && TAGS[t].asp.includes(g.sub)) w *= 1.1;
      if (w > 0) { tags[t] = +(w * (0.94 + 0.12 * rng(hash(t + g.seed))())).toFixed(3); feed[t] = from.sort((a, b) => b[2] - a[2]).slice(0, 2).map(x => [x[0], x[1]]); }
    }
    for (const l of g.lineage || []) for (const t in (l.tags || {})) tags[t] = +((tags[t] || 0) + l.tags[t] * 0.15).toFixed(3);
    // 한 방울이던 때 얻은 형질: 첫 몸의 바탕으로 그대로 남는다
    if (g.pro) for (const t in g.pro) { if (!TAGS[t]) continue; tags[t] = +((tags[t] || 0) + g.pro[t]).toFixed(3); if (!feed[t] || !feed[t].length) feed[t] = [['pro:' + t, 1]]; }
    // 처음 몸은 판 내내 남는다: 쌓인 형질 전체의 일정 몫만큼 (고른 몸이 끝까지 보이게)
    if (g.look && LOOKSEED[g.look]) { const ls = LOOKSEED[g.look], tot = Object.values(tags).reduce((x, y) => x + y, 0); for (const t in ls) { tags[t] = +((tags[t] || 0) + ls[t] * Math.max(LOOKW, LOOKF * tot)).toFixed(3); if (!feed[t]) feed[t] = [['look:' + g.look, 1]]; } }
    g.tags = tags; g.feed = feed; return g;
  }
  const topTags = (g, n) => TAG_IDS.filter(t => g.tags[t] > 0).sort((a, b) => g.tags[b] - g.tags[a] || a.localeCompare(b)).slice(0, n || 3);
  // 짝: 두 형질이 다 위쪽 다섯 안에 있고 각각 전체의 8% 넘게
  function combosOf(g) { const top = topTags(g, 5); return COMBOS.filter(c => c.tags.every(t => top.includes(t) && share(g, t) > 0.08)).sort((a, b) => b.tags.length - a.tags.length); }
  // 카드 판(norm): 그 형질 꼬리표 카드를 일부러 많이 내야 닿는다. 형질이 위쪽에 있고, 그 꼬리표로 낸 카드가 충분해야 한다
  const LM_N = typeof process !== 'undefined' && process.env && process.env.LMN ? +process.env.LMN : 10;
  const LM_K = typeof process !== 'undefined' && process.env && process.env.LMK ? +process.env.LMK : 1.07;
  // 덱(밤마다 쌓은 것)에서 그 꼬리표 카드가 차지한 몫, 그 꼬리표로 낸 수, 형질이 위쪽에 있는지 — 셋 다 맞아야 한다
  const deckShare = (g, t) => g.deckN ? ((g.deckT || {})[t] || 0) / g.deckN : 0;
  // 꼬리표마다 문턱: 평소처럼 노는 판(봇 150판)의 덱 몫 97% 지점보다 조금 위. 일부러 모아야 넘는다
  const FTHR = { maw: 0.78, spore: 0.76, eye: 0.8, water: 0.79, bone: 0.32, tent: 0.22, egg: 0.75, spike: 0.1, face: 0.82, gut: 0.66, shadow: 0.69, star: 0.82, trap: 0.58, alone: 0.18, swarm: 0.44, shell: 0.25, wing: 0.25, glow: 0.27, root: 0.5, mirror: 0.22, tongue: 0.3, horn: 0.24 };
  const focusOk = (g, l) => { if (g.stage < 3) return false; const top = topTags(g, 6); if (!l.f.every(t => top.includes(t))) return false; const k = l.f.length === 1 ? 1 : 0.92; return l.f.reduce((a, t) => a + deckShare(g, t) / (FTHR[t] || 0.5), 0) / l.f.length >= k * LM_K && (!l.fx || l.fx(g)); };
  function landmarkOf(g) { for (const l of LANDMARKS) { try { if (g.norm && l.f ? focusOk(g, l) : l.when(g)) return l; } catch (e) { /* 조건이 아직 셀 수 없는 것 */ } } return null; }
  const landmarkOk = (g, l) => { try { return g.norm && l.f ? focusOk(g, l) : !!l.when(g); } catch (e) { return false; } };
  const PICKN = typeof process !== 'undefined' && process.env && process.env.PICKN ? +process.env.PICKN : 0.7;
  const pickBy = (tbl, rnd) => { const ks = Object.keys(tbl); let best = ks[0], bv = -1; for (const k of ks) { const v = tbl[k] + rnd() * PICKN; if (v > bv) { bv = v; best = k; } } return best; };
  function classOf(g) {
    const r = rng(hash('cls' + g.seed + g.aspect)), lo = {}, po = {}, sy = {};
    Object.keys(LOCO).forEach(k => { lo[k] = 0; }); Object.keys(POST).forEach(k => { po[k] = 0; }); Object.keys(SYM).forEach(k => { sy[k] = 0; });
    const add = (o, src, m) => { for (const k in src) o[k] = (o[k] || 0) + src[k] * m; };
    add(lo, ASP_LOCO[g.aspect] || {}, 1); add(po, ASP_POST[g.aspect] || {}, 1); add(sy, ASP_SYM[g.aspect] || {}, 1);
    const s = sum(g.tags) || 1;
    for (const t of topTags(g, 4)) { const m = 2.4 * (g.tags[t] / s) + 0.4; add(lo, TAGS[t].loco || {}, m); add(po, TAGS[t].post || {}, m); add(sy, TAGS[t].sym || {}, m); }
    const loco = pickBy(lo, r), post = pickBy(po, r), pl = { blob: 0.5, seg: 0, neck: 0, pear: 0 };
    if (['many', 'slither', 'l6'].includes(loco)) pl.seg += 1; if (['l4', 'l2'].includes(loco)) pl.neck += 0.8; if (post === 'up' || post === 'sag') pl.pear += 0.8;
    for (const t of topTags(g, 3)) { if (['swarm', 'tent', 'egg', 'spike'].includes(t)) pl.seg += 0.5; if (['horn', 'tongue', 'face', 'eye'].includes(t)) pl.neck += 0.5; if (['gut', 'maw', 'spore'].includes(t)) pl.pear += 0.5; if (['shell', 'star', 'glow'].includes(t)) pl.blob += 0.5; }
    return { size: g.stage, loco, post, sym: pickBy(sy, r), plan: pickBy(pl, r) };
  }

  // ---- 이름 ----
  const ADJ = { maw: ['입 벌린', '이빨 난'], spore: ['포자 핀', '곰팡 슨'], eye: ['눈 달린', '깜빡이는'], water: ['젖은', '물 머금은'], bone: ['뼈 박힌', '마른'], tent: ['늘어진', '휘감는'], egg: ['알 밴', '부푼'], spike: ['가시 돋은', '날 선'], face: ['웃는', '사람 닮은'], gut: ['배부른', '삭이는'], shadow: ['그늘진', '검은'], star: ['별 박힌', '반짝이는'], trap: ['물어뜯는', '숨어 있는'], alone: ['외로운', '홀로 남은'], swarm: ['우글거리는', '떼 지은'], shell: ['껍데기 진', '단단한'], wing: ['막 펼친', '떠는'], glow: ['빛나는', '어슴푸레한'], root: ['뿌리 내린', '박힌'], mirror: ['비치는', '번들거리는'], tongue: ['핥는', '혀 늘어진'], horn: ['뿔 난', '들이받는'] };
  const GEN = { maw: '아가리의', spore: '포자의', eye: '눈의', water: '물의', bone: '뼈의', tent: '팔의', egg: '알의', spike: '가시의', face: '얼굴의', gut: '배의', shadow: '그늘의', star: '별의', trap: '덫의', alone: '외톨이의', swarm: '떼의', shell: '껍질의', wing: '막의', glow: '빛의', root: '뿌리의', mirror: '거울의', tongue: '혀의', horn: '뿔의' };
  const HEAD = { maw: ['아귀', '큰입'], spore: ['포자어미', '포자덩이'], eye: ['눈덩이', '눈무리'], water: ['물주머니', '물살이'], bone: ['뼈탑', '뼈껍질'], tent: ['촉수뭉치', '팔무리'], egg: ['알집', '알어미'], spike: ['가시등', '가시덩이'], face: ['얼굴가죽', '탈'], gut: ['위장', '배주머니'], shadow: ['그늘', '그림자살'], star: ['별무리', '별살이'], trap: ['덫주둥이', '굴입'], alone: ['외톨이', '홀몸'], swarm: ['무리', '떼살'], shell: ['껍데기', '갑주'], wing: ['막날개', '날막'], glow: ['빛주머니', '등불살'], root: ['뿌리살', '뿌리덩이'], mirror: ['거울살', '비침'], tongue: ['혓바닥', '긴혀'], horn: ['뿔짐승', '뿔덩이'] };
  const LOCN = { crawl: '기는 ', l2: '걷는 ', l4: '', l6: '', many: '', float: '떠도는 ', root: '', slither: '미끄러지는 ' };
  function nameOf(g) {
    const top = topTags(g, 3), lm = landmarkOf(g);
    if (!top.length) return { name: ['', '작은 방울', '기는 방울', '파고드는 것', '삼키는 것', '다 자란 것'][Math.min(5, g.stage)] || '한 방울', title: null };
    const r = rng(hash('nm' + g.seed + top.join())), pick = a => a[Math.floor(r() * a.length)], cls = classOf(g);
    const head = pick(HEAD[top[0]]), parts = [];
    if (top[1]) parts.push(pick(ADJ[top[1]]));
    if (top[2] && r() < 0.75) parts.push(GEN[top[2]]);
    else if (LOCN[cls.loco]) parts.push(LOCN[cls.loco].trim());
    const cb = combosOf(g)[0];
    let name = parts.concat([head]).join(' ');
    if (cb && r() < 0.5) name = cb.name + ' ' + head;
    return { name, title: lm ? lm.name : (cb ? cb.name : null) };
  }
  function describe(g) {
    const out = [];
    for (const t of topTags(g, 3)) { const f = (g.feed[t] || [])[0]; if (f && f[0].indexOf('look:') === 0) out.push('처음 받은 몸 → ' + TAGS[t].name); else if (f && f[0].indexOf('pro:') === 0) out.push('한 방울 때 얻은 것 → ' + TAGS[t].name); else if (f) out.push((f[0].indexOf('tag:') === 0 ? TAGS[f[0].slice(4)].name + ' 카드를 냄' : COUNTERS[f[0]]) + ' ' + f[1] + ' → ' + TAGS[t].name); else out.push('물려받은 것 → ' + TAGS[t].name); }
    return out;
  }
  // 판의 결과로 다음 판에 남길 것: 위쪽 형질 셋의 무게
  function inherit(g) { const t = {}; topTags(g, 3).forEach(k => { t[k] = g.tags[k]; }); return { tags: t, aspect: g.aspect, name: nameOf(g).name }; }
  function summary(g) { const c = classOf(g), n = nameOf(g), lm = landmarkOf(g); return { name: n.name, title: n.title, cls: c, clsText: [POST[c.post], LOCO[c.loco], PLAN[c.plan], SYM[c.sym]].join(' · '), top: topTags(g, 3).map(t => TAGS[t].name), combos: combosOf(g).map(x => x.name), landmark: lm ? lm.name : null, lines: describe(g), hints: topTags(g, 3).map(t => TAGS[t].hint) }; }

  return { LOOKSEED, tell, narrate, grewMost, ASPS, ASPN, COUNTERS, TAGS, TAG_IDS, LOCO, POST, SYM, PLAN, COMBOS, LANDMARKS, newGenome, addBehaviour, topTags, combosOf, landmarkOf, landmarkOk, classOf, nameOf, describe, inherit, summary, share, hash, rng };
})();
if (typeof module !== 'undefined') module.exports = TRAITS;
