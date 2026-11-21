// 옛 것의 둥지 — 카드. 둥지는 이 세상에 돋아난 「위대한 것」의 작은 몸이고, 카드는 그 몸의 부위다.
// 종류: organ 기관(칸에 영구히 자리 잡는다) / trap 부위(칸에 돋아 밤 동안 몇 번 터진다) / kin 권속(방에 세운다, 쓰러지면 다음 밤 덱으로) / spell 주문 / curse 저주
// 효과는 작은 낱말(ops)로 적고 deck.js 가 읽는다. ['dmg', 6, 'cell'] = 그 칸의 적 모두 6 피해. 강화(up)를 안 적으면 숫자를 1.5배 한다.
// 이 파일에는 화면이 없다(node 에서도 돈다).
const CARDS = (function () {
  const N = typeof NEST !== 'undefined' ? NEST : require('./logic.js');
  const ASPS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
  const ASPN = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아', none: '무색' };
  const RARN = { c: '보통', u: '드묾', r: '옛것급', x: '저주', s: '처음' };
  const TYPEN = { organ: '기관', trap: '부위', kin: '권속', spell: '주문', curse: '저주' };

  // ---- 효과 글: ops 를 짧은 한국어로 ----
  const AREA = { one: '적 하나', cell: '칸 전체', all: '모든 적', front: '맨 앞 적', core: '본체 방 적', enter: '들어온 적', rand: '아무 적' };
  const kinN = k => (N.KIN[k] && N.KIN[k].name) || (k === 'infected' ? '감염체' : k);
  const PER = { handN: '이 밤 족보', corpse: '주검', inf: '감염', organ: '기관', kin: '권속', enemy: '적', asp: '같은 색 카드', hand: '손패', curse: '저주' };
  function opText(o) {
    const [k, a, b, c] = o, ar = AREA[b] || '';
    switch (k) {
      case 'dmg': return (ar || '적 하나') + ' ' + a + ' 피해';
      case 'mind': return (ar || '적 하나') + ' 정신 −' + a;
      case 'inf': return (ar || '적 하나') + ' 감염 ' + a;
      case 'mark': return (ar || '적 하나') + ' 표식 +' + a + '%';
      case 'hold': return (ar || '칸 전체') + ' ' + a + '턴 붙듦';
      case 'push': return (ar || '칸 전체') + ' ' + a + '칸 밀어냄';
      case 'swallow': return (b === 'enter' ? '들어온 적이 ' : '') + '체력 ' + a + ' 이하면 삼킴';
      case 'mad': return (ar || '적 하나') + ' ' + a + '턴 광기';
      case 'spawn': return '움 ' + a + ' 돋움';
      case 'kin': return kinN(a) + (b > 1 ? ' ' + b : '') + ' 세움';
      case 'heal': return '본체 체력 +' + a;
      case 'healKin': return '권속 체력 +' + a;
      case 'buff': return '권속 공격 +' + a + (b ? ' 체력 +' + b : '');
      case 'block': return '막기 ' + a;
      case 'draw': return a + '장 뽑기';
      case 'energy': return '기운 +' + a;
      case 'ess': return '진액 +' + a;
      case 'eat': return '주검마다 진액 +' + a;
      case 'rise': return '주검 ' + a + ' 일으킴';
      case 'dmgPer': return (AREA[c] || '적 하나') + ' ' + (PER[b] || b) + '마다 ' + a + ' 피해';
      case 'mindPer': return (AREA[c] || '적 하나') + ' ' + (PER[b] || b) + '마다 정신 −' + a;
      case 'self': return '본체 체력 −' + a;
      case 'curse': return '저주 「' + a + '」 받음';
      case 'pull': return (ar || '적 하나') + ' ' + a + '칸 끌어옴';
      case 'thin': return '손패 ' + a + '장 버림';
      case 'cap': return '권속 자리 +' + a;
      case 'charge': return '이 칸 부위 +' + a + '번';
      case 'infect2': return '감염된 적 감염 ×2';
      case 'convert': return '정신 꺾인 적이 신도로';
      default: return k;
    }
  }
  // 이어지는 효과가 같은 대상이면 대상 말을 한 번만 쓴다
  function opsText(ops) { let prev = null; return ops.map(o => { let t = opText(o); const ar = typeof o[2] === 'string' && AREA[o[2]] ? o[2] : null; if (ar && ar === prev && t.indexOf(AREA[ar] + ' ') === 0) t = t.slice(AREA[ar].length + 1); prev = ar; return t; }).join(', '); }
  const HOOK = { hand: '족보가 나오면: ', turn: '매 턴: ', kill: '여기서 죽이면: ', night: '밤마다: ', day: '낮마다: ', enter: '들어오면: ', end: '턴 끝: ', draw: '뽑히면: ' };
  function textOf(c, up) {
    const d = up ? Object.assign({}, c, c.upd) : c, parts = [];
    if (d.type === 'trap') parts.push(d.charges + '번: ' + opsText(d.ops));
    else if (d.type === 'organ') { for (const h in d.hooks) parts.push(HOOK[h] + opsText(d.hooks[h])); if (d.cap) parts.push('권속 자리 +' + d.cap); }
    else if (d.type === 'curse') { parts.push('쓸 수 없다'); for (const h in (d.hooks || {})) parts.push(HOOK[h] + opsText(d.hooks[h])); }
    else parts.push(opsText(d.ops));
    if (d.kw && d.kw.exhaust) parts.push('사라짐');
    if (d.kw && d.kw.retain) parts.push('남음');
    return parts.join(' · ');
  }
  // 강화: 정한 것이 없으면 숫자 효과를 1.5배
  const SCALE = new Set(['dmg', 'mind', 'inf', 'heal', 'healKin', 'block', 'ess', 'swallow', 'dmgPer', 'mindPer', 'mark', 'eat']);
  const upOps = ops => ops.map(o => SCALE.has(o[0]) ? [o[0], Math.ceil(o[1] * 1.5)].concat(o.slice(2)) : o.slice());

  const LIST = [];
  // c(아이디, 이름, 종류, 색, 비용, 희귀, 대상, 효과, 덧붙임)
  function c(id, name, type, asp, cost, rar, tgt, ops, x) {
    x = x || {};
    const d = { id, name, type, asp, cost, rar, tgt, ops: ops || [], unlock: x.unlock || null, kw: x.kw || {}, hooks: x.hooks || null, charges: x.charges || 0, cap: x.cap || 0, kin: x.kin || null, n: x.n || 1, lore: x.lore || '' };
    const up = x.up || {};
    d.upd = { cost: up.cost != null ? up.cost : cost, ops: up.ops || upOps(d.ops), charges: up.charges != null ? up.charges : d.charges + (type === 'trap' ? 1 : 0), hooks: up.hooks || (d.hooks ? Object.fromEntries(Object.entries(d.hooks).map(([h, v]) => [h, upOps(v)])) : null), cap: up.cap != null ? up.cap : d.cap, kw: up.kw || d.kw };
    d.text = x.text || textOf(d, false); d.textUp = x.textUp || textOf(d, true);
    d.more = x.more || '';
    LIST.push(d); return d;
  }
  // 줄임: 권속 카드
  const kin = (id, name, asp, cost, rar, kind, n, more, x) => c(id, name, 'kin', asp, cost, rar, 'room', [['kin', kind, n]].concat((x && x.extra) || []), Object.assign({ kin: kind, n, more }, x || {}));
  const trap = (id, name, asp, cost, rar, charges, ops, x) => c(id, name, 'trap', asp, cost, rar, 'cell', ops, Object.assign({ charges }, x || {}));
  const organ = (id, name, asp, cost, rar, hooks, x) => c(id, name, 'organ', asp, cost, rar, 'cell', [], Object.assign({ hooks }, x || {}));
  const spell = (id, name, asp, cost, rar, tgt, ops, x) => c(id, name, 'spell', asp, cost, rar, tgt, ops, x);
  const curse = (id, name, hooks, more) => c(id, name, 'curse', 'none', 0, 'x', 'none', [], { hooks, kw: { unplayable: true }, more });
  const U = id => ({ unlock: id });

  // ================= 무색 (처음 덱과 어디서나 나오는 것) =================
  spell('bite', '물어뜯기', 'none', 1, 's', 'cell', [['dmg', 6, 'front']], { more: '그 칸 맨 앞의 적을 문다.' });
  spell('harden', '굳은 살', 'none', 1, 's', 'none', [['block', 7]], { more: '본체가 받을 피해를 막는다. 턴이 끝나면 사라진다.' });
  spell('lash', '휘두르기', 'none', 1, 'c', 'cell', [['dmg', 4, 'cell']]);
  spell('gnaw', '갉아먹기', 'none', 0, 'c', 'cell', [['dmg', 3, 'front'], ['draw', 1]]);
  spell('swell', '부풀기', 'none', 1, 'c', 'none', [['block', 5], ['draw', 1]]);
  spell('ooze', '진액 짜내기', 'none', 0, 'c', 'none', [['ess', 6], ['self', 2]], { kw: { exhaust: true } });
  spell('twitch', '꿈틀', 'none', 0, 'c', 'none', [['energy', 1]], { kw: { exhaust: true } });
  spell('grasp', '움켜쥐기', 'none', 1, 'c', 'cell', [['hold', 1, 'front'], ['dmg', 3, 'front']]);
  spell('shove', '떠밀기', 'none', 1, 'c', 'cell', [['push', 1, 'cell']]);
  spell('regrow', '다시 돋기', 'none', 1, 'c', 'none', [['heal', 6]], { kw: { exhaust: true } });
  spell('thrash', '마구 치기', 'none', 2, 'c', 'cell', [['dmg', 9, 'cell']]);
  spell('feelers', '더듬기', 'none', 1, 'c', 'none', [['draw', 2]]);
  spell('deepbreath', '깊은 숨', 'none', 1, 'u', 'none', [['energy', 2]], { kw: { exhaust: true } });
  spell('husk', '껍질 덮기', 'none', 2, 'u', 'none', [['block', 14]]);
  spell('crush', '짓누르기', 'none', 2, 'u', 'cell', [['dmg', 14, 'front'], ['hold', 1, 'front']]);
  spell('gather', '살 모으기', 'none', 1, 'u', 'room', [['healKin', 10, 'cell'], ['buff', 2, 0, 'cell']]);
  spell('quake', '굴 흔들기', 'none', 2, 'u', 'none', [['dmg', 5, 'all']], U('runs3'));
  spell('lure', '끌어들이기', 'none', 1, 'u', 'cell', [['pull', 1, 'cell']], U('runs3'));
  spell('feast', '잔치', 'none', 2, 'r', 'none', [['heal', 10], ['ess', 15]], Object.assign(U('ess600'), { kw: { exhaust: true } }));
  spell('dream', '꿈 새어 나옴', 'none', 1, 'r', 'none', [['mind', 8, 'all'], ['draw', 1]], U('words10'));
  spell('needle', '바늘 하나', 'none', 3, 'r', 'none', [['dmg', 12, 'all'], ['mind', 12, 'all']], Object.assign(U('win1'), { kw: { exhaust: true } }));
  kin('k_skeleton', '뼈껍질', 'none', 1, 's', 'skeleton', 1, '단단한 등껍질. 앞을 막는다.');
  kin('k_digger', '굴파개', 'none', 1, 'c', 'digger', 1, '낮에 판 칸마다 진액을 조금 캔다.', { extra: [['ess', 3]] });
  kin('k_warden', '갈비우리', 'none', 2, 'c', 'warden', 1, '갈비로 짠 우리. 적을 붙든다.', { extra: [['hold', 1, 'cell']] });
  kin('k_netter', '실뽑이', 'none', 2, 'u', 'netter', 1, '실을 뽑아 길을 막는다.', { extra: [['hold', 1, 'cell']] });
  kin('k_clerk', '세는 손', 'none', 1, 'u', 'clerk', 1, '죽은 것을 센다. 진액이 더 들어온다.', Object.assign(U('runs5'), { extra: [['ess', 8]] }));
  organ('o_maw', '아가리 굴', 'none', 1, 's', { enter: [['dmg', 3, 'enter']] }, { more: '칸 바닥 전체가 입이다. 들어오는 것마다 문다.' });
  organ('o_stomach', '위장', 'none', 2, 'c', { kill: [['ess', 4]] }, { more: '여기서 죽은 것은 진액이 된다.' });
  organ('o_burrow', '둥지 방', 'none', 1, 'c', {}, { cap: 2, more: '권속이 더 설 수 있다.' });
  organ('o_heart', '작은 심장', 'none', 3, 'r', { night: [['energy', 1]] }, Object.assign(U('act2any'), { more: '밤마다 첫 턴에 기운 +1.' }));
  trap('t_claw', '튀어나온 발톱', 'none', 1, 's', 2, [['dmg', 7, 'enter']]);
  trap('t_teeth', '이빨 바닥', 'none', 1, 'c', 3, [['dmg', 5, 'enter']]);
  trap('t_gullet', '목구멍 함정', 'none', 2, 'u', 1, [['swallow', 30, 'enter']]);

  // ================= 심연: 삼킴, 물, 밀어냄, 붙듦 =================
  const A = 'abyss';
  spell('a_tide', '해일', A, 1, 's', 'cell', [['push', 1, 'front'], ['dmg', 5, 'cell']]);
  spell('a_undertow', '물밑 끌림', A, 1, 'c', 'cell', [['hold', 2, 'front'], ['dmg', 4, 'front']]);
  spell('a_drown', '숨 막힘', A, 1, 'c', 'cell', [['dmg', 6, 'cell'], ['hold', 1, 'front']]);
  spell('a_pressure', '깊은 물의 무게', A, 2, 'c', 'cell', [['dmg', 10, 'cell'], ['hold', 1, 'front']]);
  spell('a_brine', '짠물 덮기', A, 1, 'c', 'none', [['block', 8], ['heal', 2]]);
  spell('a_ebb', '썰물', A, 1, 'c', 'cell', [['push', 1, 'front']]);
  spell('a_whirl', '소용돌이', A, 1, 'u', 'cell', [['push', 1, 'cell'], ['dmg', 6, 'cell']]);
  spell('a_gulp', '한 모금', A, 2, 'u', 'cell', [['swallow', 35, 'cell']]);
  spell('a_flood', '물 차오름', A, 2, 'u', 'none', [['hold', 1, 'all'], ['dmg', 2, 'all']]);
  spell('a_shell', '조개 닫기', A, 1, 'u', 'none', [['block', 12]], U('a_act2'));
  spell('a_abysscall', '심연의 부름', A, 1, 'u', 'cell', [['pull', 2, 'cell'], ['mark', 30, 'cell']], U('a_swallow10'));
  spell('a_tidecall', '밀물 부르기', A, 2, 'u', 'none', [['healKin', 10, 'all'], ['heal', 5]], U('a_act2'));
  spell('a_maelstrom', '큰 소용돌이', A, 3, 'r', 'none', [['push', 1, 'all'], ['dmg', 8, 'all']], U('a_win'));
  spell('a_leviathan', '바다 밑의 입', A, 3, 'r', 'cell', [['swallow', 65, 'cell'], ['swallow', 65, 'cell']], Object.assign(U('a_swallow25'), { kw: { exhaust: true } }));
  spell('a_silt', '진흙 가라앉음', A, 1, 'c', 'cell', [['hold', 1, 'front'], ['mark', 25, 'cell']]);
  spell('a_coldcurrent', '찬 물살', A, 1, 'u', 'none', [['dmg', 3, 'all'], ['draw', 1]], U('a_nodmg'));
  trap('a_t_mawfloor', '바닥 아가리', A, 2, 's', 2, [['swallow', 26, 'enter']], { more: '바닥이 통째로 입이다. 하나를 삼키면 닫힌다.' });
  trap('a_t_rising', '차오르는 물', A, 1, 'c', 3, [['dmg', 4, 'enter'], ['hold', 1, 'enter']]);
  trap('a_t_suction', '빨판 벽', A, 1, 'c', 3, [['hold', 1, 'enter'], ['mark', 20, 'enter']]);
  trap('a_t_sinkhole', '꺼지는 바닥', A, 1, 'c', 2, [['push', 1, 'enter'], ['dmg', 3, 'enter']]);
  trap('a_t_eel', '물뱀 굴', A, 1, 'c', 3, [['dmg', 8, 'enter']]);
  trap('a_t_jaws', '겹 아가리', A, 3, 'u', 2, [['swallow', 45, 'enter']], U('a_swallow10'));
  trap('a_t_brinepool', '짠물 웅덩이', A, 1, 'u', 4, [['dmg', 3, 'enter'], ['mark', 15, 'enter']]);
  trap('a_t_drag', '끌어내리는 촉수', A, 2, 'u', 2, [['hold', 2, 'enter'], ['dmg', 5, 'enter']], U('a_act2'));
  trap('a_t_trench', '해구', A, 2, 'r', 2, [['swallow', 45, 'enter']], U('a_win'));
  trap('a_t_pearl', '진주 미끼', A, 1, 'u', 2, [['pull', 1, 'cell'], ['ess', 5]], U('a_nodmg'));
  organ('a_o_pool', '고인 웅덩이', A, 2, 's', { turn: [['healKin', 4, 'cell']] }, { more: '칸의 권속이 매 턴 조금씩 아문다.' });
  organ('a_o_gills', '아가미 방', A, 1, 'c', { turn: [['block', 3]] });
  organ('a_o_sluice', '물목', A, 2, 'c', { enter: [['dmg', 3, 'enter'], ['hold', 1, 'enter']] });
  organ('a_o_reef', '산호 뼈', A, 2, 'u', { turn: [['dmg', 3, 'cell']] }, U('a_act2'));
  organ('a_o_drowned', '가라앉은 방', A, 2, 'u', { kill: [['heal', 2]] });
  organ('a_o_deep', '깊은 굴', A, 3, 'u', { enter: [['mark', 30, 'enter']] }, U('a_swallow10'));
  organ('a_o_womb', '물의 자궁', A, 3, 'r', { night: [['kin', 'scale', 1]] }, U('a_win'));
  organ('a_o_tidegate', '물의 문', A, 2, 'c', {}, { cap: 1, hooks: { turn: [['healKin', 3, 'cell']] } });
  kin('a_k_scale', '비늘지기', A, 1, 's', 'scale', 1, '등딱지로 막고 다친 동료를 감싼다.');
  kin('a_k_tangle', '촉수 뭉치', A, 2, 'c', 'tangle', 1, '촉수로 휘감는다.', { extra: [['hold', 1, 'cell']] });
  kin('a_k_scale2', '비늘 떼', A, 2, 'u', 'scale', 2, '비늘지기 둘.');
  kin('a_k_tangle2', '엉킨 것들', A, 3, 'u', 'tangle', 2, '촉수 뭉치 둘.', U('a_act2'));
  kin('a_k_netter', '물실뽑이', A, 1, 'c', 'netter', 1, '물속에 실을 친다.', { extra: [['mark', 15, 'cell']] });
  kin('a_k_deepscale', '심해 비늘', A, 2, 'u', 'scale', 1, '깊은 데서 올라온 비늘.', { extra: [['block', 6]] });
  kin('a_k_drowner', '익사시키는 것', A, 3, 'r', 'tangle', 1, '휘감아 물속으로 끈다.', Object.assign(U('a_swallow25'), { extra: [['swallow', 40, 'cell']] }));
  kin('a_k_shellwall', '조개 성벽', A, 2, 'u', 'scale', 1, '움직이는 벽.', Object.assign(U('a_nodmg'), { extra: [['block', 10]] }));

  // ================= 성운: 눈, 별, 정신, 광기, 뽑기 =================
  const B = 'nebula';
  spell('n_gaze', '들여다보기', B, 1, 's', 'cell', [['mind', 11, 'front'], ['draw', 1]]);
  spell('n_starlight', '별빛 바늘', B, 1, 'c', 'cell', [['dmg', 7, 'front'], ['mark', 20, 'front']]);
  spell('n_whisperstar', '별의 소리', B, 1, 'c', 'cell', [['mind', 8, 'cell']]);
  spell('n_foresee', '앞날 보기', B, 0, 'c', 'none', [['draw', 2]], { kw: { exhaust: true } });
  spell('n_madden', '미치게 하기', B, 1, 'c', 'cell', [['mad', 2, 'front']]);
  spell('n_constel', '별자리 잇기', B, 1, 'c', 'none', [['draw', 1], ['energy', 1]], { kw: { exhaust: true } });
  spell('n_rift', '틈', B, 1, 'u', 'cell', [['push', 3, 'front']]);
  spell('n_eclipse', '달가림', B, 2, 'u', 'none', [['hold', 1, 'all']]);
  spell('n_vertigo', '어지럼', B, 2, 'u', 'cell', [['mad', 2, 'cell']], U('n_mad10'));
  spell('n_comet', '꼬리별', B, 2, 'u', 'cell', [['dmg', 9, 'cell'], ['mind', 6, 'cell']]);
  spell('n_thirdeye', '셋째 눈 뜨기', B, 1, 'u', 'none', [['draw', 3]], U('n_act2'));
  spell('n_truth', '보아서는 안 될 것', B, 2, 'u', 'none', [['mind', 12, 'all']], U('n_mad10'));
  spell('n_supernova', '터지는 별', B, 3, 'r', 'none', [['dmg', 14, 'all']], Object.assign(U('n_win'), { kw: { exhaust: true } }));
  spell('n_beyond', '별 너머', B, 3, 'r', 'none', [['mad', 2, 'all'], ['mind', 6, 'all']], U('n_mad25'));
  spell('n_orbit', '돌고 도는 눈', B, 1, 'c', 'cell', [['mindPer', 2, 'organ', 'cell']]);
  spell('n_lens', '수정 렌즈', B, 1, 'u', 'cell', [['mark', 40, 'cell']], U('n_act2'));
  trap('n_t_walleye', '벽의 눈', B, 1, 's', 3, [['mind', 10, 'enter']], { more: '마주친 것은 정신이 깎인다.' });
  trap('n_t_mirror', '비추는 눈', B, 2, 'c', 2, [['mad', 2, 'enter']]);
  trap('n_t_starneedle', '별바늘 천장', B, 1, 'c', 3, [['dmg', 4, 'enter'], ['mark', 20, 'enter']]);
  trap('n_t_stare', '응시하는 덩이', B, 1, 'c', 4, [['mind', 7, 'enter']]);
  trap('n_t_warp', '뒤틀린 칸', B, 2, 'c', 2, [['push', 2, 'enter']]);
  trap('n_t_halo', '빛무리 함정', B, 2, 'u', 2, [['hold', 2, 'enter']], U('n_act2'));
  trap('n_t_maze', '눈의 미로', B, 2, 'u', 3, [['mad', 1, 'enter'], ['mind', 4, 'enter']], U('n_mad10'));
  trap('n_t_lenses', '겹눈 벽', B, 1, 'u', 4, [['mark', 25, 'enter']]);
  trap('n_t_void', '별 사이 구멍', B, 3, 'r', 2, [['mind', 30, 'enter']], U('n_win'));
  trap('n_t_chorus', '별의 합창', B, 2, 'u', 3, [['mind', 6, 'enter'], ['draw', 1]], U('n_draw40'));
  organ('n_o_observatory', '별자리 굴', B, 2, 's', { night: [['draw', 1]] }, { more: '밤마다 첫 턴에 한 장 더 뽑는다.' });
  organ('n_o_eye', '큰 눈 방', B, 2, 'c', { turn: [['mind', 4, 'cell']] });
  organ('n_o_lens', '렌즈 굴', B, 1, 'c', { enter: [['mark', 20, 'enter']] });
  organ('n_o_dreamwell', '꿈 우물', B, 2, 'u', { turn: [['mind', 3, 'all']] }, U('n_mad10'));
  organ('n_o_starwomb', '별의 자궁', B, 3, 'u', { night: [['energy', 1]] }, U('n_act2'));
  organ('n_o_library', '받아 적는 방', B, 2, 'c', { kill: [['draw', 1]] });
  organ('n_o_crown', '눈의 관', B, 3, 'r', { turn: [['mad', 1, 'front'], ['mind', 3, 'cell']] }, U('n_win'));
  organ('n_o_spire', '거꾸로 탑', B, 2, 'u', { turn: [['dmg', 4, 'front']] }, U('n_draw40'));
  kin('n_k_scribe', '별보는 눈', B, 1, 's', 'scribe', 1, '정신을 찌르는 눈.');
  kin('n_k_eyeheap', '눈 무더기', B, 2, 'c', 'eyeheap', 1, '모두를 본다.', { extra: [['mind', 4, 'cell']] });
  kin('n_k_spitter', '가시쏘개', B, 1, 'c', 'spitter', 1, '멀리서 가시를 쏜다.');
  kin('n_k_spitter2', '가시 무리', B, 2, 'u', 'spitter', 2, '가시쏘개 둘.', U('n_act2'));
  kin('n_k_scribe2', '눈 둘', B, 2, 'u', 'scribe', 2, '별보는 눈 둘.');
  kin('n_k_seer', '앞을 보는 눈', B, 1, 'u', 'scribe', 1, '세우면 한 장 뽑는다.', { extra: [['draw', 1]] });
  kin('n_k_starheap', '별 무더기', B, 3, 'r', 'eyeheap', 2, '눈 무더기 둘.', U('n_mad25'));
  kin('n_k_gazer', '응시자', B, 2, 'u', 'eyeheap', 1, '적을 미치게 한다.', Object.assign(U('n_mad10'), { extra: [['mad', 1, 'front']] }));

  // ================= 번식: 움, 감염, 떼, 알 =================
  const C = 'brood';
  spell('b_sprout', '움 틔우기', C, 1, 's', 'room', [['spawn', 2]]);
  spell('b_spore', '포자 뿌리기', C, 1, 'c', 'cell', [['inf', 3, 'cell']]);
  spell('b_swarm', '떼 짓기', C, 1, 'c', 'room', [['buff', 3, 0, 'cell']]);
  spell('b_bloom', '피어나기', C, 2, 'c', 'room', [['spawn', 3]]);
  spell('b_fever', '열병', C, 1, 'c', 'cell', [['inf', 3, 'front'], ['dmg', 4, 'front']]);
  spell('b_bud', '곁가지', C, 0, 'c', 'room', [['spawn', 1]]);
  spell('b_contagion', '번지기', C, 2, 'u', 'none', [['inf', 3, 'all']], U('b_inf5'));
  spell('b_hatch', '부화', C, 2, 'u', 'room', [['spawn', 4]], U('b_act2'));
  spell('b_ripen', '무르익음', C, 1, 'u', 'none', [['infect2', 1]], U('b_inf5'));
  spell('b_tide', '떼의 물결', C, 2, 'u', 'none', [['buff', 3, 5, 'all']]);
  spell('b_mother', '어미의 부름', C, 2, 'u', 'none', [['healKin', 8, 'all'], ['spawn', 1]], U('b_act2'));
  spell('b_plague', '역병', C, 3, 'r', 'none', [['inf', 4, 'all']], U('b_inf20'));
  spell('b_brood', '한배', C, 3, 'r', 'room', [['spawn', 5]], Object.assign(U('b_win'), { kw: { exhaust: true } }));
  spell('b_rot', '썩히기', C, 1, 'c', 'cell', [['dmgPer', 2, 'inf', 'front']]);
  spell('b_rise', '시체떼', C, 2, 'u', 'room', [['rise', 3]], U('b_inf5'));
  spell('b_lichen', '이끼 덮기', C, 1, 'c', 'none', [['block', 6], ['spawn', 1]]);
  trap('b_t_spore', '감염 포자', C, 1, 's', 3, [['inf', 3, 'enter']], { more: '감염된 것은 매 턴 썩고, 죽으면 감염체로 일어난다.' });
  trap('b_t_eggsac', '알주머니', C, 1, 'c', 1, [['spawn', 3]], { more: '밟으면 터져 움이 나온다.' });
  trap('b_t_mold', '곰팡이 벽', C, 1, 'c', 4, [['inf', 2, 'enter']]);
  trap('b_t_nettle', '쐐기 털', C, 1, 'c', 3, [['dmg', 4, 'enter'], ['inf', 1, 'enter']]);
  trap('b_t_roots', '얽힌 뿌리', C, 1, 'c', 3, [['hold', 1, 'enter']]);
  trap('b_t_nest', '알 무더기', C, 2, 'u', 2, [['spawn', 3]], U('b_act2'));
  trap('b_t_bloomer', '터지는 꽃', C, 2, 'u', 2, [['inf', 6, 'enter'], ['dmg', 4, 'enter']], U('b_inf5'));
  trap('b_t_hive', '벌집 벽', C, 2, 'u', 3, [['inf', 3, 'enter'], ['spawn', 1]], U('b_spawn30'));
  trap('b_t_motherlode', '어미 포자낭', C, 3, 'r', 3, [['inf', 7, 'enter']], U('b_inf20'));
  trap('b_t_creeper', '기는 덩굴', C, 1, 'u', 4, [['hold', 1, 'enter'], ['inf', 2, 'enter']], U('b_spawn30'));
  organ('b_o_hatchery', '알 굴', C, 2, 's', { night: [['spawn', 2]] }, { more: '밤마다 움 둘이 이 칸에 돋는다.' });
  organ('b_o_spores', '포자 방', C, 2, 'c', { turn: [['inf', 1, 'cell']] });
  organ('b_o_womb', '자궁 방', C, 3, 'u', { night: [['spawn', 3]] }, U('b_act2'));
  organ('b_o_compost', '썩은 둥지', C, 1, 'c', { kill: [['spawn', 1]] });
  organ('b_o_nursery', '젖 굴', C, 2, 'c', { turn: [['healKin', 3, 'cell']] }, { cap: 1 });
  organ('b_o_colony', '군락', C, 2, 'u', {}, Object.assign(U('b_spawn30'), { cap: 3 }));
  organ('b_o_queen', '여왕 방', C, 3, 'r', { turn: [['buff', 1, 0, 'cell']] }, U('b_win'));
  organ('b_o_rotpit', '썩는 구덩이', C, 2, 'u', { enter: [['inf', 3, 'enter']] }, U('b_inf5'));
  kin('b_k_goblin', '깨물이', C, 1, 's', 'goblin', 1, '몸의 절반이 입이다.');
  kin('b_k_goblin2', '깨물이 둘', C, 2, 'c', 'goblin', 2, '깨물이 둘.');
  kin('b_k_licker', '핥는 것', C, 1, 'c', 'licker', 1, '다친 동료를 핥아 아물린다.', { extra: [['healKin', 5, 'cell']] });
  kin('b_k_goblin3', '깨물이 떼', C, 3, 'u', 'goblin', 3, '깨물이 셋.', U('b_act2'));
  kin('b_k_spawner', '움 품은 것', C, 2, 'u', 'goblin', 1, '세우면 움 둘이 따라 나온다.', { extra: [['spawn', 2]] });
  kin('b_k_licker2', '핥는 것 둘', C, 2, 'u', 'licker', 2, '핥는 것 둘.', U('b_spawn30'));
  kin('b_k_carrier', '포자 나르는 것', C, 2, 'u', 'licker', 1, '세우면 칸의 적을 감염시킨다.', Object.assign(U('b_inf5'), { extra: [['inf', 4, 'cell']] }));
  kin('b_k_horde', '한 무리', C, 3, 'r', 'goblin', 3, '깨물이 셋, 강화하면 더 세진다.', U('b_win'));

  // ================= 황혼: 속삭임, 신도, 두려움, 돌려세움 =================
  const D = 'dusk';
  spell('d_whisper', '속삭임', D, 1, 's', 'cell', [['mind', 8, 'cell']]);
  spell('d_dread', '두려움', D, 1, 'c', 'cell', [['mind', 6, 'front'], ['push', 1, 'front']]);
  spell('d_veil', '그림자 덮기', D, 1, 'c', 'none', [['block', 6], ['mind', 3, 'all']]);
  spell('d_mask', '가면 씌우기', D, 1, 'c', 'cell', [['mad', 1, 'front'], ['mind', 3, 'front']]);
  spell('d_lull', '잠재우기', D, 1, 'c', 'cell', [['hold', 1, 'front'], ['mind', 4, 'front']]);
  spell('d_hymn', '찬가', D, 1, 'c', 'none', [['buff', 2, 0, 'all']]);
  spell('d_convert', '돌려세움', D, 2, 'u', 'cell', [['mind', 8, 'cell'], ['convert', 1]], U('d_rout15'));
  spell('d_nightmare', '악몽', D, 2, 'u', 'none', [['mind', 8, 'all']], U('d_act2'));
  spell('d_scream', '비명', D, 1, 'u', 'cell', [['mindPer', 3, 'enemy', 'cell']]);
  spell('d_procession', '행렬', D, 2, 'u', 'room', [['kin', 'cultist', 2]], U('d_act2'));
  spell('d_shadowstep', '그림자 걸음', D, 0, 'c', 'none', [['draw', 1], ['block', 3]]);
  spell('d_dusk', '해 질 녘', D, 3, 'u', 'none', [['hold', 1, 'all'], ['mind', 3, 'all']], U('d_rout15'));
  spell('d_eclipsehymn', '검은 찬가', D, 3, 'r', 'none', [['mind', 12, 'all'], ['convert', 1]], U('d_win'));
  spell('d_puppet', '꼭두각시', D, 2, 'r', 'cell', [['mad', 2, 'cell']], U('d_rout40'));
  spell('d_mourning', '곡소리', D, 1, 'c', 'cell', [['mind', 4, 'cell'], ['draw', 1]]);
  spell('d_offering', '바침', D, 0, 'u', 'none', [['ess', 10], ['energy', 1]], Object.assign(U('d_act2'), { kw: { exhaust: true } }));
  trap('d_t_whisperwall', '속삭이는 벽', D, 1, 's', 3, [['push', 1, 'enter'], ['mind', 3, 'enter']], { more: '길을 잃게 해 뒤로 돌려보낸다.' });
  trap('d_t_maskwall', '가면 벽', D, 1, 'c', 3, [['mind', 6, 'enter']]);
  trap('d_t_shadow', '그림자 손', D, 1, 'c', 3, [['hold', 1, 'enter'], ['mind', 2, 'enter']]);
  trap('d_t_bell', '울리는 종', D, 2, 'c', 2, [['mind', 5, 'cell']]);
  trap('d_t_effigy', '허수아비 신', D, 1, 'c', 2, [['mad', 1, 'enter']]);
  trap('d_t_choir', '벽 속 합창', D, 2, 'u', 3, [['mind', 8, 'enter']], U('d_act2'));
  trap('d_t_altar', '피 묻은 제단', D, 2, 'u', 2, [['mind', 6, 'enter'], ['convert', 1]], U('d_rout15'));
  trap('d_t_lostpath', '헤매는 길', D, 2, 'u', 2, [['push', 2, 'enter']], U('d_rout15'));
  trap('d_t_nightmare', '꿈 구멍', D, 3, 'r', 3, [['mad', 2, 'enter'], ['mind', 6, 'enter']], U('d_win'));
  trap('d_t_veil', '장막', D, 1, 'u', 4, [['mark', 20, 'enter'], ['mind', 2, 'enter']], U('d_rout40'));
  organ('d_o_chapel', '기도 굴', D, 2, 's', { night: [['kin', 'cultist', 1]] }, { more: '밤마다 신도 하나가 이 칸에 선다.' });
  organ('d_o_stage', '무대', D, 2, 'c', { turn: [['mind', 3, 'cell']] });
  organ('d_o_confession', '참회 굴', D, 2, 'c', { enter: [['mind', 5, 'enter']] });
  organ('d_o_moon', '달맞이 굴', D, 2, 'u', { night: [['block', 10]] }, U('d_act2'));
  organ('d_o_masks', '가면 방', D, 3, 'r', { turn: [['mad', 1, 'front']] }, U('d_rout40'));
  organ('d_o_sermon', '설교단', D, 1, 'c', { kill: [['mind', 4, 'cell']] });
  organ('d_o_cathedral', '거꾸로 성당', D, 3, 'r', { turn: [['mind', 2, 'all']] }, U('d_win'));
  organ('d_o_cells', '돌려세운 자의 방', D, 2, 'u', {}, Object.assign(U('d_rout15'), { cap: 2, hooks: { kill: [['convert', 1]] } }));
  kin('d_k_cultist', '신도', D, 1, 's', 'cultist', 1, '두건 속에 눈 하나.');
  kin('d_k_cultist2', '신도 둘', D, 1, 'c', 'cultist', 2, '신도 둘.');
  kin('d_k_mask', '가면 쓴 것', D, 2, 'c', 'mask', 1, '마주친 것의 정신을 깎는다.', { extra: [['mind', 5, 'cell']] });
  kin('d_k_fallen', '꺾인 믿음', D, 2, 'u', 'fallen', 1, '동료를 낫게 한다.', Object.assign(U('d_rout15'), { extra: [['healKin', 6, 'cell']] }));
  kin('d_k_mask2', '가면 둘', D, 3, 'u', 'mask', 2, '가면 쓴 것 둘.', U('d_act2'));
  kin('d_k_choir', '작은 무리', D, 2, 'u', 'cultist', 3, '신도 셋.');
  kin('d_k_prophet', '예언자', D, 2, 'r', 'cultist', 1, '세우면 모든 적 정신 −6.', Object.assign(U('d_win'), { extra: [['mind', 6, 'all']] }));
  kin('d_k_turned', '돌아선 자', D, 2, 'u', 'turncoat', 1, '한때 저쪽이었다.', U('d_rout40'));

  // ================= 기아: 이빨, 먹기, 주검, 진액, 대가 =================
  const E = 'hunger';
  spell('h_maul', '물어 찢기', E, 1, 's', 'cell', [['dmg', 11, 'front'], ['heal', 2]]);
  spell('h_devour', '먹어 치우기', E, 1, 'c', 'cell', [['dmg', 6, 'front'], ['eat', 4]]);
  spell('h_frenzy', '광포', E, 1, 'c', 'cell', [['dmg', 14, 'front'], ['self', 2]]);
  spell('h_gnash', '이 갈기', E, 0, 'c', 'cell', [['dmg', 5, 'front']]);
  spell('h_bloodlust', '피 냄새', E, 1, 'c', 'room', [['buff', 4, 0, 'cell']]);
  spell('h_carrion', '주검 뜯기', E, 1, 'c', 'cell', [['dmgPer', 4, 'corpse', 'front']]);
  spell('h_gorge', '배 채우기', E, 2, 'u', 'none', [['heal', 6], ['dmg', 8, 'all']], U('h_act2'));
  spell('h_rend', '갈가리', E, 2, 'u', 'cell', [['dmg', 8, 'cell'], ['mark', 25, 'cell']]);
  spell('h_sacrifice', '살 바치기', E, 0, 'u', 'none', [['self', 4], ['energy', 2]], Object.assign(U('h_ess600'), { kw: { exhaust: true } }));
  spell('h_bonecrack', '뼈 부수기', E, 2, 'u', 'cell', [['dmg', 22, 'front'], ['hold', 1, 'front']], U('h_act2'));
  spell('h_hungerpang', '허기', E, 1, 'u', 'none', [['draw', 2], ['self', 2]]);
  spell('h_bottomless', '끝없는 배', E, 2, 'r', 'cell', [['swallow', 80, 'cell'], ['heal', 10]], U('h_win'));
  spell('h_feeding', '먹이 시간', E, 3, 'r', 'none', [['dmg', 10, 'all'], ['eat', 3]], U('h_eat20'));
  spell('h_chew', '씹기', E, 1, 'c', 'cell', [['dmg', 8, 'front'], ['ess', 3]]);
  spell('h_tithe', '살 세금', E, 1, 'u', 'none', [['ess', 15], ['energy', 1]], U('h_ess600'));
  spell('h_teeth', '이빨 비', E, 2, 'u', 'none', [['dmg', 7, 'all'], ['mark', 15, 'all']], U('h_eat20'));
  trap('h_t_teethfloor', '톱니 바닥', E, 1, 's', 3, [['dmg', 8, 'enter']]);
  trap('h_t_digest', '소화액 웅덩이', E, 1, 'c', 3, [['dmg', 7, 'enter'], ['eat', 2]], { more: '쓰러진 것은 바로 녹아 진액이 된다.' });
  trap('h_t_jaw', '덫 아가리', E, 1, 'c', 2, [['dmg', 10, 'enter'], ['hold', 1, 'enter']]);
  trap('h_t_bonerake', '뼈 갈퀴', E, 1, 'c', 3, [['dmg', 4, 'enter'], ['mark', 15, 'enter']]);
  trap('h_t_gut', '내장 덫', E, 2, 'c', 2, [['dmg', 12, 'enter']]);
  trap('h_t_grinder', '맷돌 이빨', E, 2, 'u', 4, [['dmg', 8, 'enter']], U('h_act2'));
  trap('h_t_lure', '고기 미끼', E, 1, 'u', 3, [['hold', 1, 'enter'], ['dmg', 6, 'enter']], U('h_eat20'));
  trap('h_t_stomach', '삼키는 위', E, 3, 'r', 2, [['swallow', 70, 'enter'], ['ess', 10]], U('h_win'));
  trap('h_t_marrow', '골수 빨대', E, 2, 'u', 3, [['dmg', 9, 'enter'], ['heal', 2]], U('h_ess600'));
  trap('h_t_frenzy', '굶주린 벽', E, 2, 'u', 4, [['dmg', 6, 'enter'], ['ess', 2]], U('h_eat20'));
  organ('h_o_larder', '되새김 굴', E, 2, 's', { kill: [['ess', 5], ['heal', 1]] }, { more: '여기서 죽은 것은 되새겨 진액이 된다.' });
  organ('h_o_teeth', '이빨 방', E, 1, 'c', { enter: [['dmg', 4, 'enter']] });
  organ('h_o_abattoir', '도살장', E, 2, 'c', { turn: [['dmg', 3, 'cell']] });
  organ('h_o_bloodpool', '피 웅덩이', E, 2, 'u', { kill: [['heal', 2]] }, U('h_act2'));
  organ('h_o_gizzard', '모래주머니', E, 3, 'u', { turn: [['dmg', 6, 'front']] }, U('h_eat20'));
  organ('h_o_tithe', '세금 굴', E, 2, 'c', { day: [['ess', 10]], turn: [['dmg', 2, 'cell']] });
  organ('h_o_maw', '끝없는 아가리', E, 3, 'r', { enter: [['dmg', 10, 'enter']] }, U('h_win'));
  organ('h_o_pantry', '광', E, 2, 'u', { night: [['ess', 8], ['block', 6]] }, U('h_ess600'));
  kin('h_k_hunger', '허기', E, 1, 's', 'hunger', 1, '두 번 무는 것.');
  kin('h_k_turncoat', '돌아선 자', E, 2, 'c', 'turncoat', 1, '배신한 칼.');
  kin('h_k_hunger2', '허기 둘', E, 2, 'u', 'hunger', 2, '허기 둘.', U('h_act2'));
  kin('h_k_starved', '굶은 것', E, 1, 'c', 'hunger', 1, '약하지만 싸다.', { extra: [['self', 2]] });
  kin('h_k_butcher', '도살자', E, 2, 'u', 'turncoat', 1, '세우면 칸 맨 앞 적 8 피해.', Object.assign(U('h_eat20'), { extra: [['dmg', 8, 'front']] }));
  kin('h_k_glutton', '먹보', E, 2, 'u', 'hunger', 1, '세우면 주검을 먹는다.', { extra: [['eat', 3]] });
  kin('h_k_ravener', '게걸', E, 3, 'r', 'hunger', 1, '더 큰 허기.', Object.assign(U('h_win'), { extra: [['buff', 6, 10, 'cell']] }));
  kin('h_k_jackal', '뼈 핥개', E, 1, 'u', 'turncoat', 1, '싼 칼.', U('h_ess600'));

  // ================= 저주 =================
  curse('x_hunger', '굶주림', { end: [['self', 2]] }, '턴 끝에 손에 있으면 본체 체력 −2.');
  curse('x_rot', '썩은 살', {}, '손을 막는다.');
  curse('x_noticed', '들킴', { end: [['self', 1]] }, '저들이 냄새를 맡았다.');
  curse('x_doubt', '의심', { draw: [['thin', 1]] }, '뽑히면 손패 한 장을 버린다.');
  curse('x_infection', '거꾸로 감염', { end: [['self', 3]] }, '제 몸이 썩는다.');
  curse('x_dream', '깨지 않는 꿈', {}, '손을 막는다. 쓸 수 없다.');
  curse('x_weight', '무거운 몸', { draw: [['energy', -1]] }, '뽑히면 기운 −1.');
  curse('x_whisper', '귓속의 소리', { end: [['self', 1]] }, '누군가 계속 말한다.');
  curse('x_scar', '흉터', {}, '손을 막는다.');
  curse('x_debt', '빚진 살', { draw: [['ess', -5]] }, '뽑히면 진액 −5.');
  curse('x_blind', '먼 눈', { draw: [['thin', 1]] }, '뽑히면 한 장 버린다.');
  curse('x_needle', '바늘 자국', { end: [['self', 2]] }, '바늘이 몸을 꿰맸던 자리.');

  // ================= 뻗어 온 부위: 한 방울에서 단 부위 (25) =================
  const PRO = typeof window === 'undefined' && typeof require !== 'undefined' ? (() => { try { return require('./prologue.js'); } catch (e) { return null; } })() : (typeof PRO_ !== 'undefined' ? PRO_ : null);
  const LIMB = {
    mouth: { type: 'spell', tgt: 'cell', ops: { abyss: [['swallow', 28, 'cell']], nebula: [['mind', 10, 'front']], brood: [['inf', 5, 'front']], dusk: [['mind', 5, 'cell']], hunger: [['dmg', 11, 'front']] } },
    eye: { type: 'spell', tgt: 'none', ops: { abyss: [['draw', 1], ['block', 4]], nebula: [['draw', 2]], brood: [['draw', 1], ['spawn', 1]], dusk: [['draw', 1], ['mind', 3, 'all']], hunger: [['draw', 1], ['mark', 20, 'all']] } },
    leg: { type: 'trap', tgt: 'cell', ops: { abyss: [['push', 1, 'enter']], nebula: [['dmg', 4, 'enter'], ['mark', 15, 'enter']], brood: [['hold', 1, 'enter']], dusk: [['hold', 1, 'enter'], ['mind', 3, 'enter']], hunger: [['dmg', 8, 'enter']] } },
    skin: { type: 'spell', tgt: 'none', ops: { abyss: [['block', 10]], nebula: [['block', 6], ['mind', 3, 'all']], brood: [['block', 6], ['spawn', 1]], dusk: [['block', 7], ['draw', 1]], hunger: [['block', 6], ['dmg', 3, 'all']] } },
    core: { type: 'spell', tgt: 'none', ops: { abyss: [['heal', 6], ['block', 4]], nebula: [['energy', 1], ['draw', 1]], brood: [['spawn', 2]], dusk: [['mind', 6, 'all']], hunger: [['ess', 10], ['heal', 3]] } },
  };
  const PARTNAME = { mouth_abyss: '빨판', mouth_nebula: '빛입', mouth_brood: '포자입', mouth_dusk: '속삭입', mouth_hunger: '톱니입', eye_abyss: '등불', eye_nebula: '셋째눈', eye_brood: '더듬이', eye_dusk: '가면눈', eye_hunger: '피눈', leg_abyss: '물살발', leg_nebula: '별뜀', leg_brood: '뿌리발', leg_dusk: '실발', leg_hunger: '덮침발', skin_abyss: '비늘', skin_nebula: '수정껍질', skin_brood: '이끼', skin_dusk: '막', skin_hunger: '가시', core_abyss: '닻주머니', core_nebula: '고리', core_brood: '알주머니', core_dusk: '울림통', core_hunger: '강철위' };
  for (const slot of ['mouth', 'eye', 'leg', 'skin', 'core']) for (const a of ASPS) {
    const id = slot + '_' + a, L = LIMB[slot], nm = (PRO && PRO.PART && PRO.PART[id] && PRO.PART[id].name) || PARTNAME[id];
    if (L.type === 'trap') trap('l_' + id, '뻗어 온 ' + nm, a, 1, 'u', 3, L.ops[a], { unlock: 'part:' + id, more: '한 방울 때 단 부위가 둥지까지 뻗어 왔다.' });
    else spell('l_' + id, '뻗어 온 ' + nm, a, slot === 'core' ? 1 : 1, 'u', L.tgt, L.ops[a], { unlock: 'part:' + id, more: '한 방울 때 단 부위가 둥지까지 뻗어 왔다.' });
  }

  // ================= 허물 (판 내내 붙는 것) =================
  const MOLT = {
    m_core: { name: '굳은 핵', text: '본체 최대 체력 +20', fx: { maxHp: 20 } },
    m_lung: { name: '두 번째 숨', text: '밤마다 기운 +1', fx: { energy: 1 } },
    m_eyes: { name: '겹눈', text: '매 턴 한 장 더 뽑는다', fx: { draw: 1 } },
    m_brood: { name: '알 품은 등', text: '밤마다 본체 방에 움 하나', fx: { nightSpawn: 1 } },
    m_teeth: { name: '이빨 껍질', text: '본체 공격 +6', fx: { atk: 6 } },
    m_scale: { name: '비늘 갑옷', text: '본체가 받는 피해 −2', fx: { armor: 2 } },
    m_mind: { name: '울리는 머리', text: '정신 피해 +30%', fx: { mindMul: 0.3 } },
    m_trap: { name: '돋는 살', text: '부위 카드 +1번', fx: { charges: 1 } },
    m_kin: { name: '젖줄', text: '권속 체력 +25%', fx: { kinHp: 0.25 } },
    m_gold: { name: '진액 주머니', text: '낮마다 진액 +15', fx: { dayEss: 15 } },
    m_hand: { name: '긴 팔', text: '손패 한도 +2, 첫 턴 한 장 더', fx: { firstDraw: 1 } },
    m_regen: { name: '아무는 살', text: '밤이 끝나면 본체 체력 +8', fx: { nightHeal: 8 } },
    m_inf: { name: '썩은 피', text: '감염이 두 배로 번진다', fx: { infMul: 1 } },
    m_swallow: { name: '늘어나는 목', text: '삼킴 기준 +15', fx: { swallow: 15 } },
    m_thorn: { name: '가시 껍질', text: '본체를 친 적 4 피해', fx: { thorns: 4 } },
  };

  // ================= 열리는 조건 (판이 끝날 때 메타 기록으로 본다) =================
  // st: 이번 판 기록, m: 쌓인 기록
  const UNLOCK = {};
  // 판을 넘어 쌓인 합계
  const T = (m, k) => (m.tot && m.tot[k]) || 0;
  const u = (id, text, check) => { UNLOCK[id] = { id, text, check }; };
  const AK = { a: 'abyss', n: 'nebula', b: 'brood', d: 'dusk', h: 'hunger' };
  for (const k in AK) {
    const a = AK[k];
    u(k + '_act2', ASPN[a] + ' 덱으로 2막 넘기기', (st, m) => (m.actBy[a] || 0) >= 3);
    u(k + '_win', ASPN[a] + ' 덱으로 끝까지 버티기', (st, m) => (m.winBy[a] || 0) >= 1);
  }
  u('a_swallow10', '모두 합쳐 60번 삼키기', (st, m) => T(m, 'swallow') >= 60);
  u('a_swallow25', '모두 합쳐 120번 삼키기', (st, m) => T(m, 'swallow') >= 120);
  u('a_nodmg', '3막에서 본체가 다치지 않고 밤 셋 넘기기', st => (st.cleanLate || 0) >= 3);
  u('n_mad10', '모두 합쳐 광기로 80번 같은 편 치게 하기', (st, m) => T(m, 'madHits') >= 80);
  u('n_mad25', '모두 합쳐 광기로 140번 같은 편 치게 하기', (st, m) => T(m, 'madHits') >= 140);
  u('n_draw40', '한 밤에 카드 효과로 12장 더 뽑기', st => (st.maxExtraDraw || 0) >= 12);
  u('b_inf5', '한 밤에 감염체 6 만들기', st => st.maxInfNight >= 6);
  u('b_inf20', '모두 합쳐 감염체 100 만들기', (st, m) => T(m, 'infRise') >= 100);
  u('b_spawn30', '모두 합쳐 움 200 돋우기', (st, m) => T(m, 'spawned') >= 200);
  u('d_rout15', '모두 합쳐 120명을 정신으로 쫓아내기', (st, m) => T(m, 'routs') >= 120);
  u('d_rout40', '모두 합쳐 300명을 정신으로 쫓아내기', (st, m) => T(m, 'routs') >= 300);
  u('h_ess600', '모두 합쳐 진액 4000 모으기', (st, m) => T(m, 'essGot') >= 4000);
  u('h_eat20', '모두 합쳐 주검 120 먹기', (st, m) => T(m, 'eaten') >= 120);
  u('ess600', '한 판에 진액 1000 모으기 (아무 덱)', st => st.essGot >= 1000);
  u('runs3', '판을 세 번 하기', (st, m) => m.runs >= 3);
  u('runs5', '판을 다섯 번 하기', (st, m) => m.runs >= 5);
  u('runs10', '판을 열 번 하기', (st, m) => m.runs >= 10);
  u('act2any', '아무 덱으로 1막 넘기기', (st, m) => Object.values(m.actBy).some(v => v >= 2));
  u('win1', '한 번 끝까지 버티기', (st, m) => Object.values(m.winBy).some(v => v >= 1));
  u('words10', '스물두 가지 적의 이름을 배우기', (st, m) => Object.values(m.words || {}).filter(v => v >= 3).length >= 22);
  u('secret1', '비밀 진화 한 번', (st, m) => (m.secrets || 0) >= 1);
  u('secret3', '비밀 진화 세 번', (st, m) => (m.secrets || 0) >= 3);
  u('trapboss', '부위 카드만으로 우두머리 쓰러뜨리기', st => st.bossByTrap >= 1);
  u('cursed4', '저주 둘을 품고 우두머리 잡기', st => st.curseAct >= 2);
  u('thin12', '덱 15장 이하로 우두머리 잡기', st => st.thinBoss >= 1);
  u('fat35', '덱 32장 이상으로 우두머리 잡기', st => st.fatBoss >= 1);
  u('organ6', '한 판에 기관 여섯 짓기', st => st.organs >= 6);
  u('dig15', '모두 합쳐 50칸 파기', (st, m) => T(m, 'digs') >= 50);
  u('altar3', '모두 합쳐 제단 일곱 번 찾기', (st, m) => T(m, 'altar') >= 7);
  u('kin2x3', '권속 카드 셋을 다 자란 것까지 키우기', st => st.fullKin >= 3);
  u('worlds4', '네 세상 모두에서 해 보기', (st, m) => Object.keys(m.worlds || {}).length >= 4);
  u('boss3', '책을 쫓는 자를 세 번 쓰러뜨리기', (st, m) => (m.seekerKills || 0) >= 3);
  u('kills300', '모두 합쳐 2000 쓰러뜨리기', (st, m) => T(m, 'kills') >= 2000);
  // 더 좋은 무색 카드와 비밀 진화를 여는 조건이 이어진다
  u('secretcard', '비밀 진화 한 번 (카드 해금)', (st, m) => (m.secrets || 0) >= 1);
  const extraU = [
    ['x_noloss', '2막부터 권속을 잃지 않고 밤 다섯 넘기기', st => st.noKinLossNights >= 5],
    ['x_onecard', '한 턴에 카드 여덟 장 쓰기', st => st.maxPlaysTurn >= 8],
    ['x_bigswing', '한 장으로 50 넘는 피해 주기', st => st.maxHit >= 50],
    ['x_curses0', '저주 없이 2막 넘기기', st => st.noCurseAct2 >= 1],
    ['x_seekerhit', '책을 쫓는 자를 첫 밤에 쓰러뜨리기', st => st.seekerFast >= 1],
    ['x_spawn10', '한 밤에 움 열 돋우기', st => st.maxSpawnNight >= 10],
    ['x_hold', '모두 합쳐 600번 붙들기', (st, m) => T(m, 'holds') >= 600],
    ['x_push', '모두 합쳐 300칸 밀어내기', (st, m) => T(m, 'pushes') >= 300],
    ['x_mark', '모두 합쳐 표식이 붙은 적 400 쓰러뜨리기', (st, m) => T(m, 'markedKills') >= 400],
    ['x_heal', '모두 합쳐 본체 체력 220 아물리기', (st, m) => T(m, 'healed') >= 220],
    ['x_block', '모두 합쳐 2500 막기', (st, m) => T(m, 'blocked') >= 2500],
    ['x_rich', '진액 250 을 쥔 채로 밤 맞기', st => st.richNight >= 1],
    ['x_poor', '진액 50 이하로 우두머리 잡기', st => st.poorBoss >= 1],
    ['x_lowhp', '본체 체력 10 이하로 밤 넘기기', st => st.lowHpNight >= 1],
    ['x_kin8', '한 밤에 권속 열둘 세우기', st => st.maxKinNight >= 12],
    ['x_organs', '기관 셋을 서로 닿게 놓기', st => st.organChain >= 3],
    ['x_learn5', '한 판에 적 이름 여덟 배우기', st => st.learned >= 8],
    ['x_act3', '아무 덱으로 3막 가기', (st, m) => Object.values(m.actBy).some(v => v >= 3)],
    ['x_runs20', '판을 스무 번 하기', (st, m) => m.runs >= 20],
  ];
  extraU.forEach(([id, t, f]) => u(id, t, f));
  // 족보를 아끼는 카드가 열리는 조건
  u('hands20', '모두 합쳐 족보 300번', (st, m) => T(m, 'handTotal') >= 300);
  u('awaken3', '모두 합쳐 「깨어나는 살」 열 번', (st, m) => ((m.hands || {}).awaken || 0) >= 10);
  u('rite5', '모두 합쳐 「한 빛깔의 의식」 40번', (st, m) => ((m.hands || {}).rite || 0) >= 40);
  u('rainbow1', '「무지개 아가리」 한 번', st => ((st.hands || {}).rainbow || 0) >= 1);
  u('profane3', '모두 합쳐 「불경한 짝」 세 번', (st, m) => ((m.hands || {}).profane || 0) >= 3);
  u('needle7', '바늘 점에서 「깨어나는 살」 이상', (st, m) => T(m, 'needleBig') >= 1);
  organ('o_echo', '울림 방', 'none', 2, 'u', { hand: [['draw', 1]] }, { unlock: 'hands20', more: '족보가 맞을 때마다 한 장 뽑는다.' });
  organ('a_o_tidehand', '맞물린 물결', 'abyss', 2, 'u', { hand: [['block', 5]] }, { unlock: 'rite5' });
  organ('d_o_chorushand', '함께 부르는 굴', 'dusk', 2, 'u', { hand: [['mind', 4, 'all']] }, { unlock: 'hands20' });
  spell('n_ritual', '의식 끝맺음', 'nebula', 1, 'u', 'none', [['mindPer', 4, 'handN', 'all']], { unlock: 'rite5' });
  spell('h_ritefeast', '의식의 잔치', 'hunger', 2, 'r', 'none', [['dmgPer', 3, 'handN', 'all']], { unlock: 'awaken3' });
  spell('b_awakenbrood', '깨어나는 떼', 'brood', 1, 'u', 'room', [['spawn', 2], ['draw', 1]], { unlock: 'awaken3' });
  spell('nn_prism', '다섯 빛 아가리', 'none', 2, 'r', 'none', [['dmg', 8, 'all'], ['mind', 8, 'all'], ['draw', 1]], { unlock: 'rainbow1' });
  spell('nn_blasphemy', '불경', 'none', 1, 'r', 'none', [['dmgPer', 5, 'curse', 'all']], { unlock: 'profane3' });
  spell('nn_needlegift', '바늘이 준 것', 'none', 0, 'r', 'none', [['energy', 1], ['draw', 2]], { unlock: 'needle7', kw: { exhaust: true } });
  // 도전: 특정한 판짜기를 노려야 열리는 것 (화면에서 따로 보여 준다)
  ['thin12', 'fat35', 'cursed4', 'x_poor', 'x_rich', 'x_lowhp', 'rainbow1', 'profane3', 'needle7', 'x_onecard', 'x_seekerhit', 'x_bigswing'].forEach(id => { if (UNLOCK[id]) UNLOCK[id].hard = true; });
  // 해금을 기다리는 무색 고급 카드 (조건마다 한두 장)
  const more = [
    ['x_noloss', 'nn_bond', '살로 잇기', 1, 'u', 'none', [['healKin', 6, 'all'], ['draw', 1]]],
    ['x_onecard', 'nn_flurry', '마구 뻗기', 0, 'u', 'cell', [['dmg', 3, 'front'], ['dmg', 3, 'front']]],
    ['x_bigswing', 'nn_crater', '구덩이 내기', 3, 'r', 'cell', [['dmg', 30, 'front']]],
    ['x_curses0', 'nn_pure', '맑은 살', 1, 'u', 'none', [['heal', 5], ['draw', 1]]],
    ['x_seekerhit', 'nn_pageeater', '쪽 삼키기', 1, 'r', 'cell', [['dmg', 8, 'front'], ['mind', 8, 'front']]],
    ['x_spawn10', 'nn_teem', '들끓음', 2, 'r', 'room', [['spawn', 5]]],
    ['x_hold', 'nn_coil', '똬리', 1, 'u', 'cell', [['hold', 2, 'cell']]],
    ['x_push', 'nn_exhale', '내쉬기', 1, 'u', 'none', [['push', 1, 'all']]],
    ['x_mark', 'nn_brand', '낙인', 0, 'u', 'cell', [['mark', 50, 'front']]],
    ['x_heal', 'nn_mend', '꿰매기', 1, 'u', 'none', [['heal', 9]]],
    ['x_block', 'nn_carapace', '두꺼운 등', 2, 'r', 'none', [['block', 22]]],
    ['x_rich', 'nn_hoard', '쌓아 둔 것', 1, 'r', 'none', [['dmgPer', 1, 'ess10', 'all']]],
    ['x_poor', 'nn_lean', '마른 몸', 0, 'u', 'none', [['energy', 1], ['draw', 1]]],
    ['x_lowhp', 'nn_lastgasp', '마지막 숨', 1, 'r', 'none', [['heal', 15]]],
    ['x_kin8', 'nn_legion', '살의 군대', 2, 'r', 'none', [['buff', 4, 8, 'all']]],
    ['x_organs', 'nn_vein', '굵은 핏줄', 1, 'u', 'none', [['dmgPer', 2, 'organ', 'all']]],
    ['x_learn5', 'nn_tongue', '사람의 혀', 1, 'u', 'cell', [['mind', 12, 'front']]],
    ['x_act3', 'nn_witness', '바늘을 보는 것', 2, 'r', 'none', [['mind', 10, 'all'], ['draw', 2]]],
    ['x_runs20', 'nn_awaken', '반쯤 뜬 눈', 3, 'r', 'none', [['dmg', 10, 'all'], ['hold', 1, 'all'], ['draw', 1]]],
    ['runs10', 'nn_patience', '기다림', 1, 'u', 'none', [['block', 8], ['energy', 1]]],
    ['secret1', 'nn_pair', '짝 부르기', 1, 'u', 'room', [['buff', 3, 6, 'cell']]],
    ['secret3', 'nn_twin', '둘이 하나', 2, 'r', 'room', [['buff', 6, 12, 'cell']]],
    ['trapboss', 'nn_bodytrap', '온몸이 덫', 2, 'r', 'none', [['charge', 1]]],
    ['cursed4', 'nn_cursefeed', '저주 먹기', 1, 'r', 'none', [['dmgPer', 4, 'curse', 'all']]],
    ['thin12', 'nn_sharp', '날 선 살', 0, 'r', 'cell', [['dmg', 9, 'front']]],
    ['fat35', 'nn_mass', '덩어리', 2, 'r', 'none', [['block', 4], ['dmgPer', 1, 'hand', 'all']]],
    ['organ6', 'nn_organs', '기관 울림', 1, 'u', 'none', [['mindPer', 3, 'organ', 'all']]],
    ['dig15', 'nn_burrow', '굴 속 기습', 1, 'u', 'cell', [['dmg', 7, 'cell']]],
    ['altar3', 'nn_altar', '제물의 몫', 0, 'r', 'none', [['ess', 20]]],
    ['kin2x3', 'nn_elder', '오래 산 살', 2, 'r', 'room', [['kin', 'hunger', 1], ['buff', 4, 10, 'cell']]],
    ['worlds4', 'nn_worlds', '네 세상의 꿈', 2, 'r', 'none', [['mind', 7, 'all'], ['dmg', 7, 'all']]],
    ['boss3', 'nn_seekerbook', '찢긴 쪽', 1, 'r', 'none', [['draw', 3], ['energy', 1]]],
    ['kills300', 'nn_slaughter', '도살', 2, 'r', 'cell', [['dmg', 16, 'cell']]],
    ['secretcard', 'nn_hidden', '숨은 갈래', 1, 'r', 'room', [['buff', 5, 5, 'cell'], ['draw', 1]]],
  ];
  more.forEach(([cond, id, name, cost, rar, tgt, ops]) => spell(id, name, 'none', cost, rar, tgt, ops, { unlock: cond, kw: (cost === 0 && rar === 'r') ? { exhaust: true } : {} }));

  // ---- 처음 덱 (성향마다 10장) ----
  const START = {
    abyss: ['bite', 'bite', 'bite', 'harden', 'harden', 'a_k_scale', 'k_skeleton', 'a_t_mawfloor', 'a_tide', 'o_maw'],
    nebula: ['bite', 'bite', 'bite', 'harden', 'harden', 'n_k_scribe', 'k_skeleton', 'n_t_walleye', 'n_gaze', 'o_maw'],
    brood: ['bite', 'bite', 'bite', 'harden', 'harden', 'b_k_goblin', 'b_k_goblin', 'b_t_spore', 'b_sprout', 'o_maw'],
    dusk: ['bite', 'bite', 'bite', 'harden', 'harden', 'd_k_cultist', 'k_skeleton', 'd_t_whisperwall', 'd_whisper', 'o_maw'],
    hunger: ['bite', 'bite', 'bite', 'harden', 'harden', 'h_k_hunger', 'h_k_turncoat', 'h_t_teethfloor', 'h_maul', 'o_maw'],
  };
  // 겉면 글이 긴 것은 손으로 줄인다 (길게 누르면 자세한 글)
  const SHORT = { a_leviathan: '체력 65 이하 둘 삼킴 · 사라짐', d_eclipsehymn: '모든 적 정신 −16, 꺾이면 신도로', d_t_altar: '2번: 정신 −6, 꺾이면 신도로', d_o_cells: '죽인 자리: 꺾이면 신도로 · 자리 +2', h_t_digest: '3번: 5 피해, 주검마다 진액 +2', h_t_lure: '3번: 끌어오고 4 피해', h_t_stomach: '2번: 체력 70 이하 삼킴, 진액 +10' };
  LIST.forEach(d => { if (SHORT[d.id]) { d.more = d.more || d.text; d.text = SHORT[d.id]; } if (!d.more) d.more = d.text; });
  const BY = {}; LIST.forEach(d => { BY[d.id] = d; });
  // 처음부터 열린 것: unlock 이 없는 카드. 처음 덱 전용(s)은 보상으로는 안 나온다
  const isOpen = (d, meta) => !d.unlock || (meta && meta.unlocked && meta.unlocked[d.unlock]) || (d.unlock.indexOf('part:') === 0 && meta && meta.parts && meta.parts[d.unlock.slice(5)]);
  return { LIST, BY, ASPS, ASPN, RARN, TYPEN, START, MOLT, UNLOCK, isOpen, opText, textOf, kinN };
})();
if (typeof module !== 'undefined') module.exports = CARDS;
