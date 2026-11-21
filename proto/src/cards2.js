// 옛 것의 둥지 — 카드로 짓는 판의 카드 (규칙은 cardmode.js)
// 낮마다 다섯 장을 받아 지도에 놓는다. 굴(모양) · 기관(방) · 부위(함정) · 권속 · 기술(밤에 쓴다) · 축복 · 저주.
// 희귀: s 처음 덱 · c 보통 · u 드묾 · r 옛것급 · x 저주. 값은 진액(판의 세기 cm 를 곱한다).
const CARDS2 = (function () {
  const N = typeof NEST !== 'undefined' ? NEST : require('./logic.js');
  const ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
  const ASPN = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아', none: '무색' };
  const RARN = { s: '처음', c: '보통', u: '드묾', r: '옛것급', x: '저주' };
  const TYPEN = { shape: '굴', organ: '기관', trap: '부위', kin: '권속', skill: '기술', boon: '축복', curse: '저주' };
  const LIST = [], BY = {};
  const add = d => { d.asp = d.asp || 'none'; d.rar = d.rar || 'c'; d.cost = d.cost || 0; d.unlock = null; d.more = d.more || d.text; if (BY[d.id]) throw new Error('dup card ' + d.id); LIST.push(d); BY[d.id] = d; return d; };

  // ---------- 굴: 모양이 정해진 굴. 첫 칸(누른 칸)을 기준으로 놓고 돌릴 수 있다 ----------
  const SHAPES = [
    ['sh_one', '한 칸 굴', 'c', 4, [[0, 0]], '한 칸을 판다'],
    ['sh_two', '곧은 굴', 'c', 6, [[0, 0], [1, 0]], '곧게 두 칸'],
    ['sh_three', '긴 굴', 'c', 9, [[0, 0], [1, 0], [2, 0]], '곧게 세 칸'],
    ['sh_bend', '꺾인 굴', 'c', 8, [[0, 0], [1, 0], [1, 1]], 'ㄱ자로 세 칸'],
    ['sh_neck', '굽은 목', 'c', 8, [[0, 0], [0, 1], [1, 1]], 'ㄴ자로 세 칸'],
    ['sh_dead', '막다른 방', 'c', 5, [[0, 0], [0, 1]], '끝이 막힌 두 칸'],
    ['sh_fork', '갈림길', 'u', 12, [[0, 0], [-1, 0], [1, 0], [0, 1]], 'ㅜ자로 네 칸'],
    ['sh_snake', '뱀 굴', 'u', 11, [[0, 0], [1, 0], [1, 1], [2, 1]], '구불구불 네 칸'],
    ['sh_longl', '긴 꺾임', 'u', 11, [[0, 0], [0, 1], [0, 2], [1, 2]], '길게 꺾인 네 칸'],
    ['sh_big', '큰 방', 'r', 14, [[0, 0], [1, 0], [0, 1], [1, 1]], '네 칸짜리 큰 방'],
    ['sh_cross', '갈림길 셋', 'r', 15, [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], '열십자로 다섯 칸'],
    ['sh_u', '휘감긴 굴', 'r', 15, [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]], 'ㄷ자로 다섯 칸'],
    ['sh_short', '지름길', 'u', 0, [[0, 0]], '판 칸 둘 사이를 잇는 한 칸 (공짜)', { bridge: true }],
    ['sh_wall', '흙벽', 'c', 0, null, '판 칸 하나를 막아 길을 돌린다', { op: 'block' }],
    ['sh_open', '틈 내기', 'c', 0, null, '막힌 칸을 다시 튼다', { op: 'unblock' }],
    ['sh_deep', '깊은 굴', 'u', 10, null, '판 칸 하나를 깊게 판다 (방 레벨 +1)', { op: 'deepen' }],
  ];
  SHAPES.forEach(([id, name, rar, cost, cells, text, x]) => add(Object.assign({ id, name, type: 'shape', rar, cost, cells, text }, x || {})));
  // 빛깔 굴: 파면서 그 빛깔 부위가 하나 딸려 온다
  [['sh_water', '물길', 'abyss', [[0, 0], [1, 0]], 'drown'], ['sh_star', '별자리 굴', 'nebula', [[0, 0], [1, 0], [1, 1], [2, 1]], 'eye'], ['sh_nursery', '산란실', 'brood', [[0, 0], [0, 1]], 'eggsac'], ['sh_whisper', '속삭이는 회랑', 'dusk', [[0, 0], [1, 0], [2, 0]], 'whisper'], ['sh_gut', '위장 줄기', 'hunger', [[0, 0], [1, 0], [1, 1]], 'digest']]
    .forEach(([id, name, asp, cells, trap]) => add({ id, name, type: 'shape', asp, rar: 'u', cost: 12, cells, gift: trap, text: '파고, 첫 칸에 ' + N.TRAP[trap].name }));

  // ---------- 기관: 판 칸에 방의 기능을 붙인다 ----------
  const ORG = {
    trap: ['이빨 굴', 18, 'c', '함정을 셋까지 단다'],
    post: ['목구멍 문턱', 16, 'c', '권속 2가 적 몇을 막는다'],
    hall: ['위장 싸움터', 34, 'u', '권속 4가 적 전원과 싸운다'],
    ambush: ['숨은 아가리', 30, 'u', '함정이 터진 뒤 권속이 덮친다'],
    bighall: ['큰 위장', 70, 'r', '권속 6이 적 전원과 싸운다'],
    decoy: ['반짝이는 혹', 28, 'u', '적 몇이 진액을 들고 돌아간다'],
    shop: ['빨판 벽', 24, 'c', '지나는 적의 힘을 빤다'],
    prison: ['고치 주머니', 24, 'c', '고치 자리 +4'],
    chapel: ['기도하는 혀', 32, 'c', '매일 신앙 +3'],
    altar: ['달 삼킨 굴', 44, 'u', '정수가 차오른다'],
    pool: ['고인 체액', 34, 'c', '곁의 권속을 낫게 한다'],
    sluice: ['물목', 38, 'u', '지나는 무리를 휩쓴다'],
    library: ['별 보는 주름', 34, 'c', '기술이 세지고 하나 더'],
    warp: ['뒤틀린 내장', 40, 'u', '적 넷 중 하나를 되돌린다'],
    hatchery: ['알집', 34, 'c', '매일 움 둘'],
    fleshwall: ['살의 벽', 40, 'u', '무리를 붙잡고 되친다'],
    stage: ['웃는 주름', 34, 'c', '지나는 적의 정신을 깎는다'],
    abattoir: ['되새김 위', 34, 'u', '먹이로 본체를 낫게 한다'],
  };
  for (const t in ORG) { const [name, cost, rar, text] = ORG[t]; add({ id: 'og_' + t, name, type: 'organ', room: t, asp: N.ROOM[t].asp || 'none', rar, cost, text }); }
  // 빛깔 기관: 같은 기능에 빛깔이 묻는다 (한 빛깔의 의식에 센다)
  const OPRE = { abyss: '젖은', nebula: '별빛', brood: '이끼 낀', dusk: '그늘진', hunger: '굶은' };
  ASPS.forEach(a => ['post', 'trap', 'hall', 'ambush'].forEach(t => add({ id: 'og_' + t + '_' + a, name: OPRE[a] + ' ' + ORG[t][0], type: 'organ', room: t, asp: a, rar: t === 'hall' || t === 'ambush' ? 'u' : 'c', cost: ORG[t][1] + 4, text: ORG[t][3] + ' · ' + ASPN[a] })));

  // ---------- 부위: 괴물 몸 함정. 같은 부위도 빛깔마다 조금 다르다 ----------
  const TR = { maw: ['아가리', 'hunger', 22], drown: ['물', 'abyss', 16], eye: ['눈', 'nebula', 18], spore: ['포자', 'brood', 14], eggsac: ['알주머니', 'brood', 18], whisper: ['속삭임', 'dusk', 20], digest: ['소화액', 'hunger', 18], limb: ['부위', 'none', 24] };
  const TPRE = { abyss: '깊은', nebula: '별 박힌', brood: '번지는', dusk: '홀리는', hunger: '굶주린' };
  for (const k in TR) {
    const [short, home, cost] = TR[k];
    add({ id: 'tr_' + k, name: N.TRAP[k].name, type: 'trap', trap: k, asp: home === 'none' ? 'none' : home, rar: 'c', cost, pow: 1, text: N.TRAP[k].desc.split('.')[0] });
    ASPS.filter(a => a !== home).forEach(a => add({ id: 'tr_' + k + '_' + a, name: TPRE[a] + ' ' + short, type: 'trap', trap: k, asp: a, rar: 'u', cost: cost + 4, pow: 1.15, text: N.TRAP[k].name + ' ×1.15 · ' + ASPN[a] }));
  }
  ['maw', 'drown', 'eye', 'spore'].forEach(k => add({ id: 'tr_' + k + '_great', name: '큰 ' + TR[k][0], type: 'trap', trap: k, asp: TR[k][1], rar: 'r', cost: TR[k][2] + 14, pow: 1.4, lv: 2, text: N.TRAP[k].name + ' Lv2 ×1.4' }));
  // 뻗어 온 부위: 한 방울에서 단 부위가 둥지로 뻗어 온다
  const PARTNAME = { mouth_abyss: '빨판', mouth_nebula: '빛입', mouth_brood: '포자입', mouth_dusk: '속삭입', mouth_hunger: '톱니입', eye_abyss: '등불', eye_nebula: '셋째눈', eye_brood: '더듬이', eye_dusk: '가면눈', eye_hunger: '피눈', leg_abyss: '물살발', leg_nebula: '별뜀', leg_brood: '뿌리발', leg_dusk: '실발', leg_hunger: '덮침발', skin_abyss: '비늘', skin_nebula: '수정껍질', skin_brood: '이끼', skin_dusk: '막', skin_hunger: '가시', core_abyss: '닻주머니', core_nebula: '고리', core_brood: '알주머니', core_dusk: '울림통', core_hunger: '강철위' };
  const SLOTPOW = { mouth: 1.25, eye: 0.9, leg: 1.05, skin: 0.95, core: 1.15 };
  for (const pid in PARTNAME) { const [slot, a] = pid.split('_'); add({ id: 'lb_' + pid, name: PARTNAME[pid] + ' 뻗기', type: 'trap', trap: 'limb', asp: a, rar: 'u', cost: 20, pow: SLOTPOW[slot], part: pid, text: '뻗어 온 부위 ×' + SLOTPOW[slot] }); }

  // ---------- 권속: 들이면 둥지에 산다 ----------
  const KASP = N.KASP || {};
  Object.keys(N.KIN).filter(k => k !== 'spawn').forEach(k => {
    const kd = N.KIN[k], base = Math.round(((kd.cost || 30) * 0.7 + 12) / 2) * 2;
    add({ id: 'kn_' + k, name: kd.name, type: 'kin', kin: k, asp: KASP[k] || 'none', rar: (kd.cost || 0) >= 50 ? 'u' : 'c', cost: base, text: kd.name + ' 하나가 둥지에 든다' });
    add({ id: 'kn_' + k + '_r', name: '늙은 ' + kd.name, type: 'kin', kin: k, asp: KASP[k] || 'none', rar: 'r', cost: base + 20, lv: 3, rare: true, text: '레벨 +3 희귀 ' + kd.name });
  });
  add({ id: 'kn_spawn3', name: '움 셋', type: 'kin', kin: 'spawn', asp: 'brood', rar: 'c', cost: 10, n: 3, text: '움 셋이 돋는다' });

  // ---------- 기술: 밤에 쥐고 있다가 무리가 방에 들 때 쓴다 (값은 신앙) ----------
  const XS = [{ draw: 1 }, { ess: 6 }, { faith: 2 }, { heal: 0.15 }];
  const XT = { draw: '내일 한 장 더', ess: '진액 +6', faith: '신앙 +2', heal: '본체 체력 +15%' };
  N.SPELL_IDS.filter(id => !N.SPELL[id].free).forEach((id, n) => {
  const SKFACE = { wave: '앞 칸으로 밀고 체력 10% 깎기', bite: '본체가 하나를 문다 (공격 4배)', call: '이 방 권속 공격 +80%', tide: '모든 권속 체력 60% 회복', star: '다음 함정이 두 번 터진다', charm: '하나를 홀려 제 편을 치게', scream: '약해진 적을 쫓아낸다', cocoon: '적 하나를 산 채로 싼다', eclipse: '이 방 적 한 라운드 멈춤', guard: '이 방 권속 피해 −55%', grip: '앞의 넷을 3라운드 붙든다', rock: '이 방 적 체력 −8% (맨 앞 두 배)', mark: '셋에게 낙인: 피해 +50%' };
    const s = N.SPELL[id], a = s.asp || 'none';
    add({ id: 'sk_' + id, name: s.name, type: 'skill', spell: id, asp: a, rar: s.cost >= 5 ? 'u' : 'c', cost: 0, pow: 1, cmul: 1, text: SKFACE[id] || (s.desc.length > 22 ? s.desc.slice(0, 21) + '…' : s.desc), more: s.desc });
    add({ id: 'sk_' + id + '_deep', name: '깊은 ' + s.name, type: 'skill', spell: id, asp: a, rar: 'r', cost: 0, pow: 1.6, cmul: 1.3, text: s.name + ' ×1.6 (신앙 ×1.3)', more: s.desc });
    const x = XS[n % XS.length], xk = Object.keys(x)[0];
    add({ id: 'sk_' + id + '_lite', name: '옅은 ' + s.name, type: 'skill', spell: id, asp: a, rar: 'u', cost: 0, pow: 0.8, cmul: 0.5, x, text: s.name + ' ×0.8, 신앙 반 · ' + XT[xk], more: s.desc });
  });

  // ---------- 축복: 낮에 바로 쓴다 ----------
  [['bl_draw', '더듬는 촉수', 'c', 0, { draw: 2 }, '카드 두 장 더'],
    ['bl_draw3', '여러 갈래 촉수', 'u', 0, { draw: 3 }, '카드 세 장 더'],
    ['bl_ess', '진액 맥', 'c', 0, { ess: 30 }, '진액 +30'],
    ['bl_ess2', '깊은 진액 맥', 'u', 0, { ess: 60 }, '진액 +60'],
    ['bl_faith', '중얼거림', 'c', 0, { faith: 8 }, '신앙 +8'],
    ['bl_faith2', '긴 기도', 'u', 0, { faith: 16 }, '신앙 +16'],
    ['bl_heal', '살 붙이기', 'c', 0, { heal: 0.4 }, '본체 체력 +40%'],
    ['bl_retain', '기억하는 살', 'u', 0, { retain: 1 }, '이번 판 남기는 카드 +1'],
    ['bl_reroll', '뒤척임', 'c', 0, { reroll: 1 }, '손을 버리고 그만큼 새로 받는다'],
    ['bl_kinheal', '핥아 주기', 'c', 0, { kinHeal: 1 }, '다친 권속이 모두 낫는다'],
    ['bl_exp', '꿈 나눠 주기', 'u', 0, { kinExp: 12 }, '권속 모두 경험 +12'],
    ['bl_essence', '짙은 한 방울', 'u', 0, { essAsp: 4 }, '본체의 빛깔이 한층 짙어진다'],
    ['bl_unearth', '냄새 맡기', 'c', 0, { reveal: 1 }, '묻힌 것 하나가 드러난다'],
    ['bl_copy', '메아리 살', 'r', 0, { copy: 1 }, '손의 다른 카드 하나를 덱에 복사'],
    ['bl_trapup', '돋친 가시', 'u', 0, { trapUp: 1 }, '함정 하나 레벨 +1'],
    ['bl_needle', '바늘 냄새', 'r', 0, { needle: 1 }, '바늘 점을 연다'],
  ].forEach(([id, name, rar, cost, fx, text]) => add({ id, name, type: 'boon', rar, cost, fx, text }));

  // ---------- 저주: 쓸 수 없다. 손에 있으면 일이 생긴다 ----------
  [['cu_found', '들킴', '손에 있으면 오늘 밤 적이 더 온다', { angry: 1 }],
    ['cu_hunger', '굶주림', '손에 있으면 아침마다 진액 −15', { tax: 15 }],
    ['cu_cavein', '무너짐', '받는 순간 굴 한 칸이 무너진다', { cavein: 1 }],
    ['cu_blind', '눈먼 밤', '손에 있으면 기술 신앙 +2', { skillTax: 2 }],
    ['cu_rot', '썩은 살', '받는 순간 권속 하나가 다친다', { hurt: 1 }],
    ['cu_noise', '헛소리', '아무 일도 못 하고 자리만 차지한다', {}],
    ['cu_leech', '거머리', '손에 있으면 아침마다 신앙 −3', { faithTax: 3 }],
    ['cu_fog', '안개 낀 머리', '받는 날 카드 한 장 덜 받는다', { drawLess: 1 }],
    ['cu_debt', '빚', '손에 있으면 밤마다 진액 −20', { nightTax: 20 }],
    ['cu_mark', '책의 표식', '손에 있으면 책을 쫓는 자가 더 세다', { seekerUp: 1 }],
  ].forEach(([id, name, text, fx]) => add({ id, name, type: 'curse', rar: 'x', cost: 0, fx, text, burn: 15 }));

  // ---------- 처음 덱 (빛깔마다 열두 장) ----------
  const SK1 = { abyss: 'wave', nebula: 'rift', brood: 'hatch', dusk: 'phantom', hunger: 'bite' };
  const KIN2 = { abyss: ['scale', 'netter'], nebula: ['spitter', 'skeleton', 'skeleton'], brood: ['goblin', 'goblin'], dusk: ['cultist', 'skeleton', 'skeleton'], hunger: ['goblin', 'skeleton', 'cultist'] };
  // 빛깔마다 마지막 한 장이 다르다 (빛깔의 버릇)
  const LAST = { abyss: null, nebula: null, brood: null, dusk: 'tr_eye_dusk', hunger: null };
  const HOME = { abyss: 'drown', nebula: 'eye', brood: 'spore', dusk: 'whisper', hunger: 'maw' };
  const START = {};
  ASPS.forEach(a => { START[a] = ['sh_two', 'sh_bend', 'sh_one', 'og_post_' + a, 'og_trap', 'tr_' + HOME[a], (a === 'hunger' ? 'tr_digest' : 'tr_digest_' + a), 'kn_' + KIN2[a][0], 'kn_' + KIN2[a][1]].concat(KIN2[a][2] ? ['kn_' + KIN2[a][2]] : []).concat(['sk_' + SK1[a], 'sk_rock', 'bl_ess']).concat(LAST[a] ? [LAST[a]] : []); });
  Object.values(START).forEach(ids => ids.forEach(id => { if (!BY[id]) throw new Error('start card missing ' + id); }));

  // ---------- 여는 조건: 판을 넘어 쌓인다 (meta.tot). hard = 일부러 노려야 하는 도전 ----------
  const tot = (m, k) => ((m && m.tot) || {})[k] || 0, act = (m, a) => ((m && m.actBy) || {})[a] || 0, win = (m, a) => ((m && m.winBy) || {})[a] || 0;
  const UNLOCK = {};
  const U = (id, text, check, hard) => { UNLOCK[id] = { text, check, hard: !!hard }; };
  ASPS.forEach(a => {
    U('act2_' + a, ASPN[a] + ' 덱으로 9일째까지 버티기', (st, m) => act(m, a) >= 2);
    U('act3_' + a, ASPN[a] + ' 덱으로 17일째까지 버티기', (st, m) => act(m, a) >= 3);
    U('act4_' + a, ASPN[a] + ' 덱으로 25일째까지 버티기', (st, m) => act(m, a) >= 4);
    U('win_' + a, ASPN[a] + ' 덱으로 별이 서는 밤 넘기기', (st, m) => win(m, a) >= 1);
  });
  [['swallow', '바닥 아가리로 모두 합쳐 {n}명 삼키기', [20, 80]], ['infRise', '감염체를 모두 합쳐 {n} 일으키기', [5, 20]], ['spawned', '알주머니 새끼 모두 합쳐 {n}', [60, 240]], ['skills', '기술 카드를 모두 합쳐 {n}번 쓰기', [60, 250, 600]], ['nightsWon', '밤을 모두 합쳐 {n}번 넘기기', [40, 150, 400]], ['kills', '적을 모두 합쳐 {n} 쓰러뜨리기', [500, 2000]], ['captives', '포로를 모두 합쳐 {n} 잡기', [8, 30]], ['kinEvo', '권속 진화 모두 합쳐 {n}번', [4, 15]], ['secrets', '비밀 진화 모두 합쳐 {n}번', [1, 4]], ['digs', '굴 카드로 모두 합쳐 {n}칸 파기', [150, 600]], ['shapes', '굴 카드 모두 합쳐 {n}장 놓기', [80, 300]], ['organs', '기관 모두 합쳐 {n}개 놓기', [50, 200]], ['traps', '부위 모두 합쳐 {n}개 달기', [60, 250]], ['digestEss', '소화액으로 진액 모두 합쳐 {n}', [300, 1200]], ['needleWins', '바늘 점에서 모두 합쳐 {n}번 따기', [2, 6]], ['blocks', '흙벽으로 길을 모두 합쳐 {n}번 돌리기', [5, 20]]]
    .forEach(([k, t, ns]) => ns.forEach((n, i) => U(k + '_' + i, t.replace('{n}', n), (st, m) => tot(m, k) >= n)));
  ['ritual', 'onebody', 'chain', 'swarm', 'long', 'awaken'].forEach(c => U('cmb_' + c, '「' + N.CMB[c].name + '」을(를) 모두 합쳐 ' + (c === 'ritual' || c === 'awaken' ? 10 : 25) + '번 이루기', (st, m) => tot(m, 'cmb_' + c) >= (c === 'ritual' || c === 'awaken' ? 10 : 25)));
  U('cmb_rainbow', '「무지개 아가리」를 한 번 이루기', (st, m) => tot(m, 'cmb_rainbow') >= 1, true);
  U('runs_1', '첫 판을 끝내기', (st, m) => (m.runs || 0) >= 1);
  U('nights_5', '밤을 모두 합쳐 다섯 번 넘기기', (st, m) => tot(m, 'nightsWon') >= 5);
  U('runs_3', '판을 세 번 하기', (st, m) => (m.runs || 0) >= 3);
  U('runs_10', '판을 열 번 하기', (st, m) => (m.runs || 0) >= 10);
  U('runs_25', '판을 스물다섯 번 하기', (st, m) => (m.runs || 0) >= 25);
  U('thin_win', '덱 열다섯 장 이하로 이기기', st => st.win && st.deckN <= 15, true);
  U('fat_win', '덱 마흔 장 넘게 이기기', st => st.win && st.deckN >= 40, true);
  U('noskill_win', '기술 카드를 한 번도 안 쓰고 25일째까지', st => st.day >= 25 && !st.skills, true);
  U('curse_win', '저주 셋을 든 채 이기기', st => st.win && st.curses >= 3, true);
  U('poor_win', '진액을 200 넘게 쌓지 않고 17일째까지', st => st.day >= 17 && st.maxGold <= 200, true);
  U('needle_big', '바늘 점에서 「네 바늘」 넘게 따기', (st, m) => tot(m, 'needleBig') >= 1, true);
  U('seeker3', '책을 쫓는 자를 모두 합쳐 세 번 물리치기', (st, m) => tot(m, 'bossWon') >= 3);
  U('worlds4', '네 세계를 모두 만나기', (st, m) => Object.keys((m && m.worlds) || {}).length >= 4);

  // 처음 몇 판: 일찍 쓰러져도 서넛은 열린다 (모두 합쳐 세는 작은 첫걸음들), 몸(게놈)에 대한 것
  const cmbSum = m => Object.keys((m && m.tot) || {}).filter(k => k.indexOf('cmb_') === 0).reduce((a, k) => a + m.tot[k], 0);
  const EARLY = [
    ['e_shapes', '굴 카드를 모두 합쳐 여섯 장 놓기', (st, m) => tot(m, 'shapes') >= 6],
    ['e_traps', '부위를 모두 합쳐 넷 달기', (st, m) => tot(m, 'traps') >= 4],
    ['e_combo', '배치 족보를 처음 이루기', (st, m) => cmbSum(m) >= 1],
    ['e_night', '처음 쳐들어온 무리를 막아 내기', (st, m) => tot(m, 'nightsWon') >= 1],
    ['e_skill', '기술 카드를 모두 합쳐 세 번 쓰기', (st, m) => tot(m, 'skills') >= 3],
    ['e_molt', '처음으로 허물 벗기', (st, m) => tot(m, 'molts') >= 1],
    ['e_forms', '도감에 몸 셋 남기기', (st, m) => Object.keys(((m && m.codex) || {}).forms || {}).length >= 3],
    ['e_egg', '알에서 판을 시작하기', (st, m) => tot(m, 'eggRun') >= 1],
    ['e_gene', '덱의 카드가 모두 합쳐 열 장 다시 쓰이기', (st, m) => tot(m, 'geneCards') >= 10],
    ['e_landmark', '이름 붙은 몸 하나 만나기', (st, m) => tot(m, 'landmarks') >= 1],
    ['e_forms12', '도감에 몸 열둘 남기기', (st, m) => Object.keys(((m && m.codex) || {}).forms || {}).length >= 12],
    ['e_landmark5', '이름 붙은 몸 다섯 가지 만나기', (st, m) => Object.keys(((m && m.codex) || {}).landmarks || {}).length >= 5, true],
  ];
  EARLY.forEach(([id, text, check, hard]) => U(id, text, check, hard));
  // 잠긴 카드를 조건에 나눠 건다: 빛깔 카드는 그 빛깔 조건에, 무색 카드는 둘레 조건에
  const lockable = LIST.filter(d => (d.rar === 'u' || d.rar === 'r') && !d.part);
  const asp4 = a => ['act2_' + a, 'act3_' + a, 'act4_' + a, 'win_' + a];
  const general = Object.keys(UNLOCK).filter(id => !/^(act2|act3|act4|win|e)_/.test(id));
  const byAsp = {}; ASPS.concat(['none']).forEach(a => { byAsp[a] = lockable.filter(d => d.asp === a); });
  ASPS.forEach(a => { const ls = byAsp[a], cs = asp4(a); ls.forEach((d, i) => { d.unlock = d.rar === 'r' ? cs[2 + (i % 2)] : cs[i % 2]; }); });
  byAsp.none.forEach((d, i) => { d.unlock = general[i % general.length]; });
  // 부위 카드는 한 방울에서 단 적이 있거나 「뻗어 온 부위」 조건으로 열린다
  U('limbs', '한 방울에서 단 부위가 둥지로 뻗어 온다 (이야기) · 또는 부위로 모두 합쳐 40명 쓰러뜨리기', (st, m) => tot(m, 'limbKills') >= 40);
  LIST.filter(d => d.part).forEach(d => { d.unlock = 'limbs'; });
  // 첫걸음 조건은 빛깔마다 드문 카드 한 장씩을 나눠 받는다 (다섯 빛깔을 돌아가며)
  { const pool = ASPS.map(a => LIST.filter(d => d.asp === a && d.rar === 'u' && d.unlock && /^act2_/.test(d.unlock))); let k = 0; EARLY.forEach(([id]) => { for (let t = 0; t < 5; t++) { const ls = pool[(k + t) % 5]; if (ls.length > 1) { ls.shift().unlock = id; break; } } k++; }); }
  // 조건마다 적어도 한 장은 건다 (빈 조건은 남는 무색 카드를 받는다)
  const used = new Set(LIST.map(d => d.unlock).filter(Boolean));
  const spare = LIST.filter(d => d.unlock && d.asp === 'none' && d.type !== 'curse');
  let si = 0; Object.keys(UNLOCK).forEach(id => { if (!used.has(id) && spare.length) { spare[si % spare.length].unlock = id; si++; } });

  // ---------- 꼬리표: 몸과 주제. 게놈 단계가 덱을 다시 쓸 때 쓴다 ----------
  const ATAG = { abyss: ['물'], nebula: ['별', '눈'], brood: ['알', '포자'], dusk: ['그림자', '얼굴'], hunger: ['이빨', '소화'], none: [] };
  const TTAG = { maw: ['아가리', '이빨'], drown: ['물'], eye: ['눈'], spore: ['포자'], eggsac: ['알'], whisper: ['그림자', '목소리'], digest: ['소화'], limb: ['촉수', '살'] };
  const RTAG = { trap: ['이빨'], post: ['아가리', '목구멍'], hall: ['위장', '살'], ambush: ['아가리', '그림자'], bighall: ['위장', '살'], decoy: ['혹', '빛'], shop: ['빨판'], prison: ['고치', '실'], chapel: ['혀', '목소리'], altar: ['달', '별'], pool: ['물', '체액'], sluice: ['물'], library: ['별', '눈'], warp: ['내장', '별'], hatchery: ['알'], fleshwall: ['살'], stage: ['얼굴', '그림자'], abattoir: ['위장', '소화'] };
  const KTAG = { goblin: ['이빨'], skeleton: ['뼈'], cultist: ['얼굴', '목소리'], scale: ['비늘', '물'], scribe: ['눈', '별'], spawn: ['알'], mask: ['얼굴'], hunger: ['이빨', '소화'], netter: ['실'], warden: ['뼈'], turncoat: ['얼굴', '살'], fallen: ['얼굴', '빛'], digger: ['발톱'], clerk: ['손'], licker: ['혀', '포자'], spitter: ['가시', '별'], eyeheap: ['눈'], tangle: ['촉수', '물'] };
  const STAG = { wave: ['물'], rift: ['별'], hatch: ['알'], phantom: ['그림자'], bite: ['이빨'], call: ['목소리'], halo: ['빛'], flip: ['얼굴'], tide: ['물', '체액'], star: ['별'], flesh: ['살'], charm: ['얼굴', '목소리'], rise: ['뼈', '살'], scream: ['목소리'], cocoon: ['고치', '실'], eclipse: ['달'], guard: ['껍질'], grip: ['촉수'], rock: ['돌'], mark: ['피'] };
  const PTAG = { mouth: ['아가리'], eye: ['눈'], leg: ['발톱'], skin: ['껍질'], core: ['살'] };
  const uniq = a => [...new Set(a)];
  LIST.forEach(d => {
    let t = [];
    if (d.type === 'shape') t = ['굴'].concat(d.gift ? TTAG[d.gift] : []).concat(d.op === 'block' ? ['흙'] : d.op === 'deepen' ? ['깊이'] : []);
    if (d.type === 'organ') t = ['기관'].concat(RTAG[d.room] || []);
    if (d.type === 'trap') t = ['부위'].concat(TTAG[d.trap] || []).concat(d.part ? PTAG[d.part.split('_')[0]] : []);
    if (d.type === 'kin') t = ['권속'].concat(KTAG[d.kin] || []);
    if (d.type === 'skill') t = ['기술'].concat(STAG[d.spell] || []);
    if (d.type === 'boon') t = ['축복'].concat(d.fx.draw ? ['촉수'] : d.fx.ess ? ['체액'] : d.fx.faith ? ['목소리'] : d.fx.heal ? ['살'] : d.fx.kinExp ? ['꿈'] : d.fx.needle ? ['바늘', '별'] : d.fx.trapUp ? ['가시'] : []);
    if (d.type === 'curse') t = ['저주'].concat(d.fx.cavein ? ['흙'] : d.fx.hurt ? ['살'] : d.fx.seekerUp ? ['책'] : d.fx.angry ? ['빛'] : []);
    const EXTRA = { bl_retain: ['살'], bl_reroll: ['촉수'], bl_kinheal: ['혀'], bl_essence: ['체액'], bl_unearth: ['코'], bl_copy: ['메아리'], cu_hunger: ['소화'], cu_blind: ['눈'], cu_noise: ['목소리'], cu_leech: ['피'], cu_fog: ['꿈'], cu_debt: ['체액'], sh_big: ['위장'], sh_u: ['촉수'], sh_snake: ['촉수'], sh_short: ['지름길'] };
    d.tags = uniq(t.concat(EXTRA[d.id] || []).concat(ATAG[d.asp] || []));
  });
  // 몸 생성기(traits.js)의 꼬리표 22가지로 옮긴다. 거기 없는 낱말은 버리고, 하나도 안 남으면 빛깔로 채운다
  const TMAP = { 아가리: 'maw', 이빨: 'maw', 목구멍: 'maw', 포자: 'spore', 눈: 'eye', 코: 'eye', 물: 'water', 체액: 'water', 뼈: 'bone', 책: 'bone', 촉수: 'tent', 실: 'tent', 알: 'egg', 가시: 'spike', 발톱: 'spike', 얼굴: 'face', 소화: 'gut', 위장: 'gut', 내장: 'gut', 그림자: 'shadow', 별: 'star', 달: 'star', 꿈: 'star', 바늘: 'star', 부위: 'trap', 껍질: 'shell', 비늘: 'shell', 고치: 'shell', 빛: 'glow', 혹: 'glow', 흙: 'root', 굴: 'root', 깊이: 'root', 손: 'root', 지름길: 'root', 혀: 'tongue', 목소리: 'tongue', 빨판: 'tongue', 돌: 'horn', 피: 'horn', 살: 'mirror', 메아리: 'mirror' };
  const AFALL = { abyss: 'water', nebula: 'star', brood: 'egg', dusk: 'shadow', hunger: 'gut', none: 'bone' };
  const SWARM = ['kn_spawn3', 'og_hatchery', 'sk_hatch', 'sk_hatch_deep', 'sk_hatch_lite', 'sk_rise', 'sk_rise_deep', 'sk_rise_lite', 'kn_goblin'];
  const ALONE = ['bl_heal', 'sk_bite', 'sk_bite_deep', 'sk_bite_lite', 'tr_limb'];
  const WING = ['kn_fallen', 'kn_fallen_r', 'kn_spitter', 'kn_spitter_r', 'sk_halo', 'sk_halo_deep', 'sk_halo_lite'];
  const HORN = ['sk_guard', 'sk_guard_deep', 'sk_guard_lite', 'kn_scale', 'kn_scale_r', 'og_fleshwall'];
  LIST.forEach(d => {
    const t = d.tags.map(x => TMAP[x]).filter(Boolean);
    if (d.type === 'organ' && d.room === 'trap') t.push('trap');
    if (SWARM.includes(d.id) || (d.trap === 'eggsac')) t.push('swarm');
    if (ALONE.includes(d.id) || d.part || d.trap === 'limb') t.push('alone');
    if (WING.includes(d.id)) t.push('wing');
    if (HORN.includes(d.id)) t.push('horn');
    if (d.type === 'kin' && d.kin === 'skeleton') t.push('bone');
    d.kw = d.tags; d.tags = uniq(t.length ? t : [AFALL[d.asp]]);
  });
  // 드문 형질도 일부러 노릴 수 있게: 꼬리표가 15장이 안 되는 형질은 그 형질과 맞는 빛깔의 카드(꼬리표 둘 이하)에 덧붙인다. 굴 카드는 빼고, 고르는 것은 id 로 정해진다
  { const AFF = { glow: ['nebula', 'abyss'], bone: ['hunger', 'dusk'], wing: ['nebula', 'dusk'], root: ['brood', 'abyss'], spike: ['hunger', 'brood'], shell: ['abyss', 'hunger'], swarm: ['brood', 'hunger'], horn: ['hunger', 'nebula'], tongue: ['hunger', 'brood'] }, hsh = id => { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
    Object.keys(AFF).forEach(t => { const have = LIST.filter(d => d.type !== 'shape' && d.tags.includes(t)).length; if (have >= 15) return;
      LIST.filter(d => d.type !== 'shape' && d.type !== 'curse' && AFF[t].includes(d.asp) && !d.tags.includes(t) && d.tags.length <= 2).sort((x, y) => (hsh(x.id + t) % 997) - (hsh(y.id + t) % 997)).slice(0, 15 - have).forEach(d => { d.tags.push(t); }); }); }
  const TAGS = uniq(LIST.reduce((a, d) => a.concat(d.tags), []));
  const tagged = tag => LIST.filter(d => d.tags.includes(tag));

  // 길게 누르면 나오는 한 줄 (규칙이 아니라 이야기). 색이 붙은 변형은 바탕 카드의 줄을 쓴다
  const LORE = {
    og_trap: '굴 벽에 박힌 이빨은 누구의 것이었는지 아무도 묻지 않았다.', og_post: '목구멍은 들어오는 것만 알고, 나가는 것은 모른다.', og_hall: '그 방의 바닥은 늘 따뜻했고, 들어간 자들은 다시 차가워지지 않았다.',
    og_ambush: '벽인 줄 알았던 것이 숨을 쉬었다.', og_bighall: '물레골 사람들은 그 동굴을 「배」라고 불렀다. 들어갔다 나온 사람이 없어서였다.', og_decoy: '반짝이는 것을 줍는 손은 늘 마지막에 떨렸다.',
    og_shop: '벽에 붙은 빨판은 진액을 머금었다가, 밤이 되면 천천히 뱉었다.', og_prison: '고치 속에서 들리는 소리는 처음에는 비명이었고, 나중에는 노래였다.', og_chapel: '그 혀는 기도를 대신 외웠다. 무엇에게 바치는 기도인지는 외우는 자도 몰랐다.',
    og_altar: '그 굴에 달이 비치는 밤이면, 달은 조금 작아져서 떠올랐다.', og_pool: '고인 체액은 마르지 않았다. 상처 입은 것들은 그 가장자리로 기어 왔다.', og_sluice: '좁은 목에서는 물도 사람도 차례를 기다려야 했다.',
    og_library: '주름마다 별자리가 새겨져 있었다. 읽으려 한 자는 주름이 늘었다.', og_warp: '그 굴을 지난 자들은 들어간 문과 다른 문으로 나왔다. 몇은 나오지 않았다.', og_hatchery: '알집은 밤마다 무게가 늘었다. 그리고 아침마다 조금 가벼워졌다.',
    og_fleshwall: '살의 벽에 칼을 댄 자는, 벽이 칼을 기억한다는 것을 알게 되었다.', og_stage: '주름이 웃는 얼굴을 지었다. 보는 자는 따라 웃지 않을 수 없었다.', og_abattoir: '되새김질은 느렸고, 남기는 것이 없었다.',
    tr_maw: '바닥이 입을 벌렸을 때, 비명은 아래쪽에서 들려왔다.', tr_drown: '굴 바닥에 물이 차오르는 소리는 숨을 고르는 소리와 닮았다.', tr_eye: '벽의 눈과 마주친 자는 그날 밤 제 이름을 잊었다.',
    tr_spore: '포자를 마신 자는 사흘 동안 기침을 했고, 나흘째 굴로 돌아왔다.', tr_eggsac: '알주머니는 발걸음 소리에 맞추어 떨었다.', tr_whisper: '벽은 그들의 어머니 목소리로 말했다. 돌아가라고.',
    tr_digest: '웅덩이에 빠진 갑옷은 이튿날 비어 있었다.', tr_limb: '어둠 속에서 뻗어 온 것은 팔이라 부르기에는 너무 길었다.',
    lb_mouth: '그것의 입은 몸을 떠나서도 배가 고팠다.', lb_eye: '떼어 낸 눈은 굴 벽에 붙어서도 감기지 않았다.', lb_leg: '발 하나가 혼자서 길목을 지켰다. 어디로 가지도 않고.',
    lb_skin: '벗겨 둔 살갗이 굴 입구를 덮었다. 그 아래로 지나가는 것은 무엇이든 소름이 돋았다.', lb_core: '몸 안쪽의 주머니가 굴 바닥에 놓였다. 그것은 아직 따뜻했고, 뛰었다.',
    sk_wave: '굴 깊은 곳에서 물이 밀려왔다. 바다가 없는 땅이었다.', sk_rift: '틈은 소리 없이 벌어졌고, 무리는 둘로 나뉘었다.', sk_hatch: '벽 속에서 무언가가 껍질을 깼다. 하나가 아니었다.',
    sk_phantom: '그들은 보았다고 했다. 무엇을 보았는지는 끝내 말하지 못했다.', sk_bite: '그것이 몸소 움직인 것은 그 밤 단 한 번이었다.', sk_call: '부르는 소리는 낮았고, 권속들은 그 소리에 이빨을 드러냈다.',
    sk_halo: '빛을 본 자들은 무릎을 꿇었다. 빛을 두른 것은 그들 쪽이 아니었다.', sk_flip: '그날 밤 그들은 서로의 얼굴을 알아보지 못했다.', sk_tide: '물이 들어오자 상처가 닫혔다. 물이 빠지자 흉터만 남았다.',
    sk_star: '하늘의 바늘 하나가 아주 잠깐 이쪽을 가리켰다.', sk_flesh: '굴이 살을 내어 길을 막았다. 살은 피를 흘렸으나 비키지 않았다.', sk_charm: '그는 웃으며 동료의 등에 칼을 꽂았다. 왜 웃었는지 그는 알지 못했다.',
    sk_rise: '먹다 남긴 것들이 일어섰다. 그들은 아직 배가 고팠다.', sk_scream: '그 비명은 귀가 아니라 이 사이로 들어왔다.', sk_cocoon: '고치는 따뜻했다. 안에 든 자는 처음으로 잠을 잘 잤다.',
    sk_eclipse: '달이 가려지자 그들의 주문은 입 안에서 썩었다.', sk_guard: '권속들은 버텼다. 그들에게는 물러설 곳이 없었다.', sk_grip: '촉수가 발목을 감았다. 오래, 다정하게.',
    sk_rock: '천장은 오래 참았고, 마침내 참지 않았다.', sk_mark: '낙인이 찍힌 자는 어디로 도망쳐도 굴의 냄새를 풍겼다.',
    cu_found: '굴 입구에 누군가 표시를 남겼다. 같은 표시가 물레골 대문에도 있었다.', cu_hunger: '굶주림은 소리 없이 와서, 소리 없이 떠나지 않았다.', cu_cavein: '흙은 기억력이 나쁘다. 파낸 길을 곧잘 잊는다.',
    cu_blind: '그 밤에는 어떤 눈도 뜨이지 않았다.', cu_rot: '썩은 살에서도 무언가가 자랐다. 반가운 것은 아니었다.', cu_noise: '굴 안이 웅얼거림으로 가득 찼다. 아무도 말하지 않았는데.',
    cu_leech: '거머리는 진액을 빨면서도 감사할 줄 몰랐다.', cu_fog: '생각이 안개처럼 흩어졌다. 붙잡으려 할수록 더 멀어졌다.', cu_debt: '갚을 것은 늘 갚을 수 있는 것보다 많았다.',
    cu_mark: '「물 아래의 장부」 한 귀퉁이에 둥지의 위치가 적혀 있었다. 누가 적었는지는 알 수 없었다.',
    bl_draw: '촉수는 어둠 속을 더듬어, 필요한 것을 먼저 찾아냈다.', bl_ess: '흙 속의 진액 맥은 오래된 상처처럼 붉었다.', bl_faith: '중얼거림은 신도들의 입에서 시작해 굴 전체로 번졌다.',
    bl_heal: '떨어져 나간 살이 다시 붙었다. 자국은 남지 않았다.', bl_retain: '살은 어제 일을 기억했다. 사람보다 오래.', bl_reroll: '그것이 잠결에 뒤척이자 굴의 모양이 조금 바뀌었다.',
    bl_kinheal: '권속들은 서로의 상처를 핥았다. 그것이 가르친 적은 없었다.', bl_exp: '그것의 꿈이 권속들에게 흘러들었다. 그들은 꿈에서 깨어나 조금 커져 있었다.', bl_essence: '정수 한 방울에는 별 사이 바다의 맛이 났다.',
    bl_unearth: '흙 아래 묻힌 것의 냄새가 굴까지 올라왔다.', bl_copy: '같은 살이 두 번 돋았다. 두 번째 것이 조금 더 굶주려 있었다.', bl_trapup: '가시는 밤사이 한 마디씩 자랐다.', bl_needle: '바늘 하나가 아주 멀리서 삐걱였다. 그 소리를 들은 것은 그것뿐이었다.' };
  const loreOf = id => LORE[id] || LORE[id.replace(/_(abyss|nebula|brood|dusk|hunger|great|deep|lite)$/, '')] || LORE[id.replace(/_(abyss|nebula|brood|dusk|hunger)$/, '')] || (id.indexOf('lb_') === 0 ? LORE[id.split('_').slice(0, 2).join('_')] : '') || (id === 'bl_draw3' ? LORE.bl_draw : id === 'bl_ess2' ? LORE.bl_ess : id === 'bl_faith2' ? LORE.bl_faith : '');
  LIST.forEach(d => { d.lore = loreOf(d.id) || ''; });

  // 주제가 맞는 카드를 몇 조건에 바로 건다
  [['tr_maw_great', 'swallow_1'], ['sk_bite_deep', 'swallow_0'], ['tr_spore_great', 'infRise_0'], ['tr_spore_nebula', 'infRise_1'], ['tr_eggsac_abyss', 'spawned_0']].forEach(([id, c]) => { if (BY[id] && UNLOCK[c]) BY[id].unlock = c; });
  const isOpen = (d, meta) => !d.unlock || !!(meta && meta.unlocked && meta.unlocked[d.unlock]) || (d.part && meta && meta.parts && meta.parts[d.part]);
  return { LIST, BY, ASPS, ASPN, RARN, TYPEN, START, UNLOCK, isOpen, TAGS, tagged };
})();
if (typeof module !== 'undefined') module.exports = CARDS2;
