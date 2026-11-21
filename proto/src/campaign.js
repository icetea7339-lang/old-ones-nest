// 옛 것의 둥지 — 이야기 (카드로 짓는 판 위의 일곱 장). 화면이 없다(node 에서도 돈다).
// 한 장은 카드 판 하나다. 다만 처음 덱이 정해져 있고, 보상으로 나오는 카드 종류가 장마다 하나씩 늘고, 밤마다 누가 오는지 정해져 있다.
// 장을 넘기면 본편에 카드·알(처음 몸)이 열린다. 기록은 카드 판의 기록(meta) 안 meta.camp 에 둔다.
// 대사 한 줄은 { s, t }: s 는 n(서술) e(잔향) d(꿈) s(책을 쫓는 자) j(에녹의 일지) c(사람 목소리).
const CAMPAIGN = (function () {
  const N = typeof NEST !== 'undefined' ? NEST : require('./logic.js');
  const CM = typeof CARDMODE !== 'undefined' ? CARDMODE : require('./cardmode.js');
  const CD = typeof CARDS2 !== 'undefined' ? CARDS2 : require('./cards2.js');
  const ASPS = CD.ASPS;

  // ---- 책을 쫓는 자: 이야기에서만 나오는 적. 세상 이름 바꾸기(applyWorld)가 훑지 않도록 숨긴 칸에 둔다 ----
  const SEEKER = {
    seeker0: { name: '책을 쫓는 자', g: 3, b: 0, hp: 150, atk: 9, df: 6, san: 90, gold: 60, asp: 'nebula', boss: '함정을 읽는다: 함정이 절반만 문다', flood: true, trapHalf: true, tip: '서 있는 동안 함정이 절반만 문다' },
    seeker1: { name: '책을 쫓는 자', g: 4, b: 0, hp: 260, atk: 15, df: 8, san: 120, gold: 90, asp: 'nebula', boss: '책을 읽어 무리를 몰아세운다', rally: 1.2, trapHalf: true, ward: 0.3, tip: '서 있는 동안 무리가 세지고 물러나지 않는다' },
    seeker2: { name: '책을 쫓는 자', g: 5, b: 0, hp: 520, atk: 24, df: 12, san: 999, gold: 140, asp: 'nebula', boss: '책이 그를 읽는다: 정신이 없다', nomind: true, shield: 10, bombard: 1.6, trapHalf: true, tip: '정신이 없다. 방에 들면 권속을 불태운다' },
  };
  for (const k in SEEKER) if (!Object.prototype.hasOwnProperty.call(N.INV, k)) Object.defineProperty(N.INV, k, { value: SEEKER[k], enumerable: false, writable: true, configurable: true });

  // 덱 적기: '@' 는 고른 빛깔로 바뀐다 (og_post_@ → og_post_brood). 빛깔 카드가 없으면 무색으로
  const pick = (id, a) => { if (id.indexOf('@') < 0) return id; const t = id.replace('@', a); if (CD.BY[t]) return t; const b = id.replace('_@', ''); return CD.BY[b] ? b : null; };
  const rep = (id, n) => Array.from({ length: n }, () => id);
  const L = (s, t) => ({ s, t });

  // ---- 일곱 장 ----
  // types: 보상·상점에 나오는 카드 종류. nights: 밤마다 오는 것 (없으면 조용한 밤, 'auto' 면 보통 판처럼). goal: 넘기는 조건
  const CH = {
    1: {
      title: '고인 자리', brief: '굴 카드로 둥지를 넓히고 권속을 들인다. 땅속 짐승을 여섯 밤 막는다.', teach: '굴 카드와 권속',
      types: ['shape', 'kin'], world: 'fantasy', gold: 120, under: true,
      deck: ['sh_two', 'sh_two', 'sh_bend', 'sh_bend', 'sh_one', 'sh_dead', 'og_post_@', 'kn_goblin', 'kn_goblin', 'kn_skeleton', 'bl_ess'],
      nights: { 2: ['hound'], 3: ['hound', 'hound'], 4: ['hound', 'hound'], 5: ['hound', 'hound', 'hound'], 6: ['hound', 'hound', 'handler'] },
      goal: { nights: 6, dug: 8, kin: 3 }, molt: 4,
      unlock: { cards: ['sh_fork', 'sh_snake', 'sh_big', 'sh_longl', 'sh_u', 'sh_short'], egg: { name: '고인 것', aspect: null, tags: { 뿌리: 0.6, 껍질: 0.4 } } },
      lines: {
        start: [L('n', '방울은 바위틈에 고였다. 흙은 차고 무거웠으며, 그 무게는 오래전 다른 바다의 물을 닮아 있었다.'), L('e', '여기에 자리를 틀라. 흙을 밀어내고 굴을 늘이라. 굴이 길어질수록 너는 덜 작아지리라.'), L('e', '네 살을 떼어 내라. 떨어져 나간 살은 눈을 뜨고, 너를 지키리라.')],
        night: {
          1: [L('n', '첫 밤은 고요하였다. 흙 속의 벌레들조차 그것이 무엇인지 알지 못하였다.')],
          2: [L('n', '둘째 밤, 굴 끝에서 무언가가 흙을 긁었다. 굶주린 짐승의 냄새가 났다.'), L('e', '땅속에도 배고픈 것들이 있다. 그것들은 너를 먹이로 여기리라. 그것은 잘못이다.')],
          4: [L('d', '물이 무겁다. 거꾸로 자란 탑들 사이로 숨소리가 지나간다. 누군가 아주 오래 잠들어 있다.'), L('e', '그것은 너의 꿈이 아니다. 아래에서 잠든 이의 꿈이 새어 나왔을 뿐이다.')],
        },
        end: [L('n', '여섯째 밤이 지나자 굴은 짐승들의 뼈로 단단해졌다. 방울은 더 이상 방울이라 부를 수 없는 것이 되어 있었다.'), L('e', '위를 보라. 흙 너머에 따뜻한 것들이 산다. 그들은 요즘 같은 꿈을 꾼다.'), L('n', '첫째 바늘이 이 세상 쪽으로 조금 기울었다. 아무도 그것을 보지 못하였다.')],
        fail: [L('n', '짐승들의 이빨이 마지막 살을 찢었다. 그러나 흙 속에는 아직 축축한 것이 남아 있었다.'), L('e', '다시 고이라. 이번에는 굴을 더 깊게.')],
      },
    },
    2: {
      title: '물레골', brief: '땅 위의 사람들이 내려온다. 기관 카드로 방에 쓰임을 붙이고, 여덟 밤을 버틴다.', teach: '기관 카드와 사람의 말',
      types: ['shape', 'kin', 'organ'], world: 'fantasy', gold: 150,
      deck: ['sh_two', 'sh_two', 'sh_bend', 'sh_bend', 'sh_one', 'og_post_@', 'og_trap', 'og_hatchery', 'og_pool', 'kn_goblin', 'kn_skeleton', 'kn_skeleton', 'bl_ess'],
      nights: { 1: ['villager', 'villager'], 2: ['villager', 'fisher', 'villager'], 3: ['villager', 'villager', 'militia'], 4: ['fisher', 'villager', 'villager', 'militia'], 5: ['militia', 'villager', 'villager', 'fisher'], 6: ['militia', 'militia', 'villager', 'villager'], 7: ['militia', 'villager', 'villager', 'villager', 'fisher'], 8: ['priest', 'militia', 'villager', 'villager'] },
      goal: { nights: 8, organs: 3 },
      unlock: { cards: ['og_hall', 'og_ambush', 'og_decoy', 'og_altar', 'og_sluice', 'og_warp', 'og_fleshwall', 'og_abattoir'], egg: { name: '물레골의 기억', tags: { 얼굴: 0.6, 혀: 0.4 } } },
      lines: {
        start: [L('n', '흙 천장이 무너지자 빛이 들었다. 땅 위는 생각보다 시끄러웠고, 시끄러운 것들은 모두 따뜻하였다.'), L('e', '그들은 스스로를 사람이라 부른다. 아직 너는 그 말을 모른다. 먹으면 알게 되리라.'), L('e', '방에 쓰임을 주라. 삼키는 방, 기다리는 방, 알을 품는 방. 둥지는 몸이고, 몸에는 기관이 있다.')],
        night: {
          1: [L('c', '"구멍이다. 어제는 없던 구멍이야. 물소리가… 저 안에서 물소리가 나."')],
          3: [L('n', '붙잡힌 자는 울지 않았다. 다만 같은 말을 되풀이하였다. 천장 없는 도시, 거꾸로 선 탑, 숨 쉬는 물.'), L('e', '저자도 꿈을 꾸었다. 우리의 꿈이 위로 번지고 있다.')],
          5: [L('j', '물레골 서고, 열하룻날. 마을 아이들이 같은 그림을 그린다. 거꾸로 선 탑. 나는 이 그림을 어디서 보았는지 안다. 장부의 셋째 장이다.')],
          7: [L('d', '바늘 하나가 하늘에서 떨린다. 실이 당겨지는 소리가 들린다.')],
        },
        end: [L('n', '여덟째 밤, 빛을 두른 자마저 굴 속에서 꺼졌다. 물레골의 종은 그날 이후 울리지 않았다.'), L('j', '서고, 열엿샛날. 장부의 나머지 쪽은 땅 밑에 있다. 물소리가 그것을 가리킨다. 나는 내려가야 한다.'), L('n', '둘째 바늘이 기울었다.')],
        fail: [L('n', '사람들은 횃불을 구멍 속에 던져 넣고 흙으로 덮었다. 그러나 흙은 다시 축축해지기 시작하였다.'), L('e', '다시. 방마다 쓰임을 주라.')],
      },
    },
    3: {
      title: '서고지기', brief: '함정을 읽는 자가 내려온다. 괴물 함정과 배치 족보로 그를 세 번 몰아낸다.', teach: '부위 함정과 배치 족보',
      types: ['shape', 'kin', 'organ', 'trap'], world: 'fantasy', gold: 170,
      deck: ['sh_two', 'sh_two', 'sh_bend', 'sh_bend', 'sh_one', 'og_post_@', 'og_trap', 'og_trap_@', 'tr_maw', 'tr_spore', 'tr_eye', 'tr_digest', 'kn_goblin', 'kn_skeleton', 'kn_scale', 'bl_ess'],
      nights: { 1: ['villager', 'villager', 'militia'], 2: ['militia', 'villager', 'villager', 'detective'], 3: ['seeker0', 'villager', 'villager', 'militia'], 4: ['militia', 'militia', 'fisher', 'villager'], 5: ['seeker0', 'militia', 'detective', 'villager', 'villager'], 6: ['warrior', 'militia', 'villager', 'villager'], 7: ['militia', 'militia', 'detective', 'villager', 'villager'], 8: ['seeker0', 'warrior', 'militia', 'villager', 'villager'] },
      goal: { nights: 8, seeker: 3, traps: 4 },
      unlock: { cards: ['tr_maw_abyss', 'tr_spore_nebula', 'tr_eye_dusk', 'tr_whisper_brood', 'tr_digest_dusk', 'tr_limb_hunger', 'tr_eggsac_abyss', 'tr_drown_brood'], egg: { name: '덫을 품은 살', tags: { 덫기관: 0.7, 아가리: 0.3 } } },
      lines: {
        start: [L('j', '스무날. 구멍의 입구는 숨을 쉰다. 들이쉴 때 흙이 안으로 기울고, 내쉴 때 짠 냄새가 난다. 등불 하나와 장부의 앞쪽 스물두 장을 가지고 내려간다.'), L('e', '책을 든 자가 온다. 그는 덫을 읽는다. 읽힌 덫은 반만 문다.'), L('e', '덫을 길 위에 줄지어 놓으라. 기관 곁에 그 빛깔의 덫을 두라. 몸이 몸을 도우리라.')],
        night: {
          3: [L('s', '"이 벽은 숨을 쉰다. 이 바닥은 삼킨다. 장부에 적힌 대로다." 그는 등불을 들어 함정 하나하나를 비추었다.')],
          5: [L('j', '스무사흗날. 두 번 쫓겨났다. 그것은 나를 죽이지 않는다. 어째서인가. 어쩌면 그것도 나를 읽고 있는지 모른다.')],
          8: [L('s', '"마지막 쪽이 여기에 있다. 나는 안다." 그의 목소리는 이제 굴의 울림과 구별되지 않았다.')],
        },
        end: [L('n', '세 번째로 쫓겨날 때, 에녹 하르는 등불을 두고 갔다. 등불은 사흘 동안 꺼지지 않았다.'), L('j', '스무엿샛날. 앞의 스물두 장으로는 모자라다. 찢긴 쪽을 찾았다. 거기에 적힌 말을 소리 내어 읽자 손바닥이 따뜻해졌다.'), L('n', '셋째 바늘이 기울었다.')],
        fail: [L('n', '그는 본체가 앉은 방에 이르러 장부의 한 줄을 읽었다. 굴 전체가 한동안 숨을 멈추었다.'), L('e', '덫을 더 깊이. 그가 읽지 못할 만큼.')],
      },
    },
    4: {
      title: '장부의 찢긴 쪽', brief: '밤에 무리가 방에서 멈출 때 기술 카드로 끼어든다. 책을 손에 붙인 자가 무리를 이끈다.', teach: '기술 카드와 끼어들기',
      types: ['shape', 'kin', 'organ', 'trap', 'skill'], world: 'fantasy', gold: 190, stage: 1, mul: 1.9,
      deck: ['sh_two', 'sh_two', 'sh_bend', 'sh_one', 'og_post_@', 'og_trap_@', 'tr_maw', 'tr_spore', 'tr_eye', 'kn_goblin', 'kn_skeleton', 'kn_cultist', 'sk_rock', 'sk_wave', 'sk_hatch', 'sk_mark', 'bl_faith', 'bl_ess'],
      nights: { 1: ['militia', 'villager', 'villager', 'detective'], 2: ['militia', 'militia', 'apprentice', 'villager'], 3: ['warrior', 'militia', 'villager', 'villager', 'villager'], 4: ['seeker1', 'militia', 'militia', 'villager', 'villager'], 5: ['warrior', 'apprentice', 'militia', 'villager'], 6: ['militia', 'militia', 'priest', 'villager', 'villager'], 7: ['warrior', 'warrior', 'militia', 'villager'], 8: ['seeker1', 'warrior', 'militia', 'militia', 'villager', 'villager'] },
      goal: { nights: 8, skills: 4, seeker: 2 },
      unlock: { cards: ['sk_phantom', 'sk_bite', 'sk_halo', 'sk_charm', 'sk_wave_deep', 'sk_rift_deep', 'sk_hatch_deep', 'sk_call_deep'], egg: { name: '찢긴 쪽을 삼킨 것', tags: { 별: 0.6, 눈: 0.4 } } },
      lines: {
        start: [L('j', '스무아흐렛날. 손바닥과 장부가 붙어 떨어지지 않는다. 아프지 않다. 오히려 글자가 손금 사이로 흘러들어 오는 것이 느껴진다.'), L('e', '밤이 오면 기다리라. 무리가 방에 들어서는 순간, 쥔 것을 쓰라. 쓰지 않은 손은 썩는다.'), L('e', '믿음을 모으라. 기술은 믿음을 먹는다.')],
        night: {
          2: [L('n', '무리 가운데 누군가가 낯선 말로 노래하였다. 그 노래는 장부의 첫 장과 같은 운율이었다.')],
          4: [L('s', '"따라오라. 물소리는 길을 안다." 그가 장부를 펼친 손을 들자, 사람들은 두려움을 잊었다.'), L('e', '저자는 이제 반쯤 우리의 것이다. 그러나 아직 그의 다리는 그의 것이다.')],
          6: [L('d', '거꾸로 선 탑의 꼭대기에서, 눈꺼풀 하나가 아주 조금 열린다.')],
        },
        end: [L('n', '두 번째로 물러날 때, 에녹 하르는 사람들을 버려두고 혼자 위로 기어 올라갔다. 그의 그림자는 그보다 늦게 움직였다.'), L('j', '서른나흗날(?). 날을 세는 것이 무의미하다. 장부가 나를 넘긴다. 이제 나는 내가 어느 쪽에 적혀 있는지 안다.'), L('n', '넷째 바늘이 기울었다.')],
        fail: [L('n', '찢긴 쪽의 말이 굴을 채웠다. 권속들은 그 말을 듣고 서로를 물었다.'), L('e', '쥔 것을 아끼지 말라. 다시.')],
      },
    },
    5: {
      title: '허물', brief: '몸이 바뀌면 카드가 바뀐다. 열 밤 동안 허물을 두 번 벗는다. 끝에 그를 어떻게 할지 정한다.', teach: '덱 = 유전자',
      types: ['shape', 'kin', 'organ', 'trap', 'skill', 'boon'], world: 'fantasy', gold: 220, stage: 1, mul: 2.4,
      deck: ['sh_two', 'sh_two', 'sh_bend', 'sh_one', 'og_post_@', 'og_trap_@', 'og_hatchery', 'tr_maw', 'tr_spore', 'tr_eye', 'tr_digest_@', 'kn_goblin', 'kn_skeleton', 'kn_cultist', 'kn_scale', 'sk_rock', 'sk_wave', 'sk_mark', 'bl_ess', 'bl_faith'],
      nights: { 1: ['militia', 'militia', 'villager', 'detective'], 2: ['warrior', 'militia', 'villager', 'villager'], 3: ['militia', 'apprentice', 'scholar', 'villager', 'villager'], 4: ['warrior', 'militia', 'militia', 'villager', 'villager'], 5: ['captain', 'militia', 'militia', 'villager', 'villager'], 6: ['warrior', 'scholar', 'militia', 'villager', 'villager'], 7: ['warrior', 'warrior', 'priest', 'militia'], 8: ['soldier', 'militia', 'militia', 'villager', 'villager'], 9: ['warrior', 'warrior', 'scholar', 'militia', 'villager'], 10: ['seeker1', 'soldier', 'warrior', 'militia', 'villager', 'villager'] },
      goal: { nights: 10, molts: 2, seeker: 1 }, molt: [3, 7], choice: true,
      unlock: { cards: ['bl_draw3', 'bl_retain', 'bl_exp', 'bl_essence', 'bl_copy', 'bl_trapup', 'kn_scribe', 'kn_hunger'], egg: { name: '두 번 허물 벗은 것', tags: { 껍질: 0.5, 뿔: 0.5 } } },
      lines: {
        start: [L('e', '들으라. 너의 살은 네가 한 일을 기억한다. 덫으로 죽인 것은 덫이 되고, 삼킨 것은 아가리가 된다.'), L('e', '허물을 벗으면 쥔 것들도 바뀌리라. 그것은 잃는 것이 아니다. 몸이 손을 고쳐 쥐는 것이다.')],
        night: {
          3: [L('n', '허물이 벗겨진 자리는 오래 축축하였다. 그 안에서 새로 돋은 것은 전과 같은 손을 원하지 않았다.')],
          5: [L('d', '위대한 것이 이쪽을 본다. 처음으로. 그 눈길은 빛이 아니라 무게였다.')],
          7: [L('j', '날짜 없음. 굴의 벽에 장부의 글자가 돋아 있다. 내가 쓴 것이 아니다. 아니, 내가 쓴 것이다. 손이 기억하지 못할 뿐.')],
          9: [L('s', '"마지막 장은 너의 몸에 적혀 있다. 그렇지 않은가?"')],
        },
        end: [L('n', '열째 밤, 그는 본체가 앉은 방 앞에서 무릎을 꿇었다. 장부를 붙인 손은 이제 손이라 부를 수 없었다.'), L('e', '그를 어떻게 하겠느냐. 붙잡아 우리의 것으로 삼을 수도 있고, 삼켜 그가 읽은 것을 가질 수도 있다. 혹은 놓아줄 수도 있다. 놓아준 것은 돌아오리라.')],
        fail: [L('n', '새 살은 아직 여물지 않았고, 무리는 그 틈을 찔렀다.'), L('e', '다시 벗으라.')],
      },
    },
    6: {
      title: '바늘 점', brief: '하늘의 바늘이 흔들린다. 제단에서 바늘 점을 치고, 저주와 축복을 바꿔 쥔다.', teach: '바늘 점과 저주',
      types: ['shape', 'kin', 'organ', 'trap', 'skill', 'boon'], world: 'fantasy', gold: 230, stage: 2, mul: 2.3, needle: [1, 3, 5, 7],
      deck: ['sh_two', 'sh_two', 'sh_bend', 'sh_one', 'og_post_@', 'og_trap_@', 'og_altar', 'tr_maw', 'tr_spore', 'tr_eye', 'tr_digest_@', 'kn_goblin', 'kn_skeleton', 'kn_cultist', 'kn_mask', 'sk_rock', 'sk_wave', 'sk_scream', 'bl_ess', 'bl_needle', 'cu_debt'],
      nights: { 1: ['militia', 'militia', 'apprentice', 'villager'], 2: ['warrior', 'detective', 'militia', 'villager', 'villager'], 3: ['torch', 'militia', 'militia', 'villager', 'villager'], 4: ['warrior', 'warrior', 'priest', 'villager'], 5: ['captain', 'torch', 'militia', 'militia', 'villager'], 6: ['soldier', 'warrior', 'militia', 'villager', 'villager'], 7: ['torch', 'torch', 'warrior', 'militia', 'villager'], 8: ['sealer', 'soldier', 'warrior', 'militia', 'villager'] },
      goal: { nights: 8, needles: 2 },
      unlock: { cards: ['bl_needle', 'sk_eclipse_deep', 'sk_guard_deep', 'sk_grip_deep', 'sk_rock_deep', 'sk_mark_deep'], egg: { name: '바늘을 맛본 것', tags: { 별: 0.5, 빛: 0.5 } } },
      lines: {
        start: [L('n', '그 무렵 물레골 위의 하늘에는 별 하나가 실처럼 늘어져 있었다. 점성가들은 그것을 보지 않으려고 눈을 감았다.'), L('e', '바늘이 흔들릴 때 점을 치라. 걸면 얻고, 걸면 잃는다. 바다는 공평하지 않다.'), L('e', '저주도 쥐어 보라. 썩은 살도 살이다.')],
        night: {
          2: [L('d', '일곱 개의 바늘 가운데 여섯이 이쪽으로 기울어 있다. 하나만이 아직 문을 꿰매고 있다.')],
          5: [L('c', '"빚진 것은 갚아야지. 저 아래 것에게도." 붙잡힌 노인은 그렇게 말하고 웃었다.')],
          7: [L('n', '꿰매는 자들이 내려오고 있다는 소문이 돌았다. 그들은 별과 별 사이를 다시 꿰매는 일을 한다고 했다.')],
        },
        end: [L('n', '꿰매는 자의 바늘은 둥지의 벽에 박힌 채 부러졌다. 그 조각은 따뜻하였다.'), L('e', '여섯이 기울었다. 하나가 남았다.'), L('n', '여섯째 바늘이 기울었다.')],
        fail: [L('n', '점괘는 끝내 나쁘게 나왔고, 둥지는 그 빚을 갚지 못하였다.'), L('e', '다시 걸라. 바다는 같은 물을 두 번 주지 않는다.')],
      },
    },
    7: {
      title: '일곱째 바늘', brief: '두 세상이 겹친다. 모든 것을 써서 열두 밤을 버티면, 마지막 바늘이 돌아선다.', teach: '모든 것',
      types: ['shape', 'kin', 'organ', 'trap', 'skill', 'boon', 'curse'], world: 'fantasy', bleed: 'wuxia', gold: 300, stage: 1, mul: 1.35, needle: [4, 9],
      deck: ['sh_two', 'sh_two', 'sh_bend', 'sh_fork', 'sh_one', 'og_post_@', 'og_trap_@', 'og_hatchery', 'og_hall', 'tr_maw', 'tr_spore', 'tr_eye', 'tr_digest_@', 'tr_eggsac', 'kn_goblin', 'kn_skeleton', 'kn_cultist', 'kn_scale', 'sk_rock', 'sk_wave', 'sk_mark', 'sk_hatch', 'bl_ess', 'bl_faith'],
      nights: { 1: ['militia', 'villager', 'villager'], 2: ['shadow', 'militia', 'villager'], 3: ['warrior', 'militia', 'villager', 'villager'], 4: ['master', 'militia', 'villager', 'villager'], 5: ['warrior', 'torch', 'militia', 'villager'], 6: ['captain', 'shadow', 'militia', 'villager'], 7: ['master', 'warrior', 'warrior', 'priest', 'militia'], 8: ['sealer', 'soldier', 'shadow', 'militia', 'villager'], 9: ['soldier', 'soldier', 'master', 'warrior', 'villager'], 10: ['warrior', 'warrior', 'shadow', 'shadow', 'chaplain', 'militia'], 11: ['master', 'soldier', 'sealer', 'warrior', 'militia'], 12: ['@final', 'soldier', 'warrior', 'shadow', 'militia', 'villager'] },
      goal: { nights: 12 },
      unlock: { cards: ['tr_maw_great', 'tr_drown_great', 'tr_eye_great', 'tr_spore_great', 'sh_star', 'sh_gut'], egg: { name: '위대한 것의 메아리', tags: { 촉수: 0.4, 물: 0.3, 눈: 0.3 } } },
      lines: {
        start: [L('n', '그해 겨울, 물레골의 밤하늘에는 낯선 별자리가 겹쳐 떴다. 사람들은 동쪽에서 온 칼잡이들이 같은 꿈을 꾸고 길을 잃었다고 수군거렸다.'), L('e', '마지막 바늘이다. 두 세상이 겹쳤다. 겹친 곳에서는 무엇이든 건너온다.'), L('e', '모든 것을 쓰라. 몸도, 덫도, 믿음도, 빚도.')],
        night: {
          4: [L('n', '고요한 자가 칼을 뽑지 않은 채 굴 안을 걸었다. 그의 발이 닿는 곳마다 덫이 숨을 죽였다.')],
          8: [L('d', '문을 꿰맨 마지막 실이 한 올씩 풀린다. 풀린 실은 물속에서 머리카락처럼 흔들린다.')],
          11: [L('e', '내일 밤이다. 그 밤만 넘기라.')],
        },
        end: [L('n', '열두째 밤의 새벽, 일곱째 바늘이 돌아섰다. 별 사이 바다의 물이 이 세상의 하늘로 스며들었고, 하늘은 아주 잠시 물빛이 되었다.'), L('n', '물레골은 그날 밤 같은 꿈에서 깨지 못하였다. 위대한 것에게 그것은 아무 일도 아니었다.'), L('e', '잘하였다. 이제 우리는 하나다. 아니, 처음부터 하나였다.')],
        fail: [L('n', '마지막 실은 끝내 풀리지 않았다. 바늘은 이 세상을 등진 채 문을 꿰매고 있었다.'), L('e', '실은 풀리기 위해 있는 것이다. 다시.')],
      },
    },
  };
  // 맞추기용: CAMPTUNE='{"7":{"stage":1,"mul":2}}'
  if (typeof process !== 'undefined' && process.env && process.env.CAMPTUNE) { const t = JSON.parse(process.env.CAMPTUNE); for (const k in t) Object.assign(CH[k], t[k]); }
  // 5장 끝의 선택이 7장을 바꾼다
  const CHOICE = {
    capture: { label: '붙잡는다', text: '그를 고치에 싸 둥지에 둔다. 7장에서 그는 「기록하는 자」가 되어 너의 편에 선다.', final: 'sealer', deck: ['kn_fallen_r', 'sk_halo'], line: L('n', '고치 속에서 그는 오래 중얼거렸다. 이윽고 중얼거림은 기도가 되었다.') },
    eat: { label: '삼킨다', text: '그를 삼켜 그가 읽은 것을 가진다. 7장은 눈이 많은 몸으로 시작한다.', final: 'sealer', deck: ['tr_eye_great', 'bl_copy'], tags: { 눈: 1, 별: 0.6 }, line: L('n', '그가 읽은 모든 쪽이 한꺼번에 몸속으로 들어왔다. 한동안 둥지의 모든 눈이 글자를 보았다.') },
    release: { label: '놓아준다', text: '그를 놓아준다. 7장의 마지막 밤, 장부에 다 먹힌 그가 돌아온다. 더 어렵지만 더 많이 열린다.', final: 'seeker2', deck: [], bonus: ['sk_halo_deep', 'sk_charm_deep'], line: L('n', '그는 뒤도 돌아보지 않고 기어 나갔다. 굴 밖의 눈 위에 손바닥 모양의 글자가 찍혀 있었다.') },
  };
  const IDS = [1, 2, 3, 4, 5, 6, 7];

  // ---- 기록 ----
  function campMeta(meta) {
    const m = meta.camp = meta.camp || {}; m.clear = m.clear || {}; m.best = m.best || {}; m.opened = m.opened || []; return m;
  }
  const isOpen = (meta, ch) => ch === 1 ? true : !!campMeta(meta).clear[ch - 1];
  const next = meta => { const c = campMeta(meta).clear; let n = 1; while (c[n] && n < 7) n++; return n; };

  // ---- 한 장 시작: 카드 판을 열고 덱·기록을 장에 맞춘다 ----
  function newRun(ch, seed, o) {
    o = o || {}; const C = CH[ch]; if (!C) return null;
    const meta = o.meta || CM.newMeta(), cm = campMeta(meta), ps = o.proSeed || cm.seed || null;
    const aspect = ASPS.includes(o.aspect) ? o.aspect : ps && ASPS.includes(ps.aspect) ? ps.aspect : 'brood';
    const R = CM.newRun(seed >>> 0, { aspect, meta, world: C.world, diff: 1, look: o.look || (ps && ps.look) || undefined, proSeed: ps || undefined, ease: 1, camp: { ch } });
    const G = R.G;
    // 덱을 장의 처음 덱으로 바꾼다
    R.deck = []; R.drawP = []; R.hand = []; R.disc = []; R.nextUid = 1;
    const ids = C.deck.map(id => pick(id, aspect)).filter(Boolean);
    if (ch === 7) { const k = cm.choice5 && CHOICE[cm.choice5]; if (k) ids.push(...k.deck.filter(id => CD.BY[id])); }
    ids.forEach(id => { if (CD.BY[id]) R.deck.push({ uid: R.nextUid++, id, up: 0 }); });
    R.camp = { ch, said: {}, seeker: 0, skills0: 0, needles: 0, molt0: 0, choice: ch === 7 ? cm.choice5 || null : null, title: C.title };
    G.gold = C.gold; G.campCh = ch;
    // 뒤의 장은 이미 허물을 벗은 몸으로 시작한다 (덱도 그 몸에 맞게 다시 쓰인다)
    { const gm = typeof GENOME !== 'undefined' ? GENOME : require('./genome.js'); for (let k = 0; k < (C.stage || 0) && R.genome; k++) { const need = gm.moltNeed(R); if (need == null) break; R.genome.evo = Math.max(R.genome.evo || 0, need); if (!gm.ripe(R)) break; gm.molt(R); } }
    R.camp.molt0 = (R.molts || []).length;
    if (ch === 7 && cm.choice5 === 'eat' && R.genome) { const t = CHOICE.eat.tags; for (const k in t) R.genome.tags[k] = (R.genome.tags[k] || 0) + t[k]; }
    // 첫 아침을 다시 받는다 (권속과 굴이 먼저)
    const first = R.deck.filter(c => CD.BY[c.id].type === 'kin').slice(0, 2).concat(R.deck.filter(c => CD.BY[c.id].type === 'shape').slice(0, 2)).map(c => c.uid);
    const rest = R.deck.map(c => c.uid).filter(u => !first.includes(u)); for (let i = rest.length - 1; i > 0; i--) { const j = (seed * 31 + i * 17) % (i + 1); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    R.drawP = first.concat(rest); R.hand = []; R.disc = [];
    CM.reMorning(R);
    return R;
  }

  // ---- 아침마다 (cardmode.morning 이 부른다): 오늘 밤 누가 오는가, 바늘 점이 열리는가 ----
  function morning(R) {
    const C = CH[R.camp.ch], G = R.G, d = G.day; if (!C) return;
    const last = Math.max.apply(null, Object.keys(C.nights).map(Number)), list = C.nights[d] || (d > last && !goalDone(R) ? C.nights[last] : null);
    if (list === 'auto') return;
    if (!list) { G.march.tonight = null; }
    else {
      const base = list.map(k => k === '@final' ? ((R.camp.choice && CHOICE[R.camp.choice] && CHOICE[R.camp.choice].final) || 'sealer') : k);
      // 장의 세기(mul): 우두머리가 아닌 것을 돌려 가며 더 데려온다
      const kinds = base.slice(), plain = base.filter(k => !N.INV[k] || !N.INV[k].boss), want = Math.round(base.length * (C.mul || 1));
      for (let i = 0; kinds.length < want && plain.length; i++) kinds.push(plain[i % plain.length]);
      G.march.tonight = { vill: 'field', settle: false, kinds, camp: true, beast: !!C.under };
    }
    const nx = C.nights[d + 1]; G.march.tomorrow = nx && nx !== 'auto' ? { vill: 'field', settle: false, kinds: nx.map(k => k === '@final' ? 'sealer' : k) } : null;
    if (C.needle && C.needle.includes(d)) R.needleOffer = true;
  }
  // 보상·상점에 나오는 카드: 장이 가르치는 종류까지, 흔한 것과 열린 것
  function poolOk(R, d) { const C = CH[R.camp.ch]; return !!C && C.types.includes(d.type) && (d.rar !== 'r' || R.camp.ch >= 5) && d.type !== 'curse'; }

  // ---- 밤 뒤 (cardmode.nightEnd 가 부른다): 허물 보장, 셈, 넘겼나 ----
  function afterNight(R, r) {
    const C = CH[R.camp.ch], G = R.G, cp = R.camp, b = r && r.battle; if (!C) return;
    if (b && !G.over && b.party.some(u => String(u.kind).indexOf('seeker') === 0)) cp.seeker++;
    // 장이 약속한 허물: 그날 밤까지 허물을 못 벗었으면 익혀 둔다
    const ms = [].concat(C.molt || []), done = (R.molts || []).length + (R.moltQ || 0) - (cp.molt0 || 0), GEN = typeof GENOME !== 'undefined' ? GENOME : null;
    ms.forEach((day, k) => { if (G.day - 1 >= day && done <= k && R.genome && !G.over) { const gm = GEN || require('./genome.js'); const need = gm.moltNeed(R); if (need != null) { R.genome.evo = Math.max(R.genome.evo || 0, need); gm.ripe(R); } } });
    if (!G.over && goalDone(R)) { G.over = { win: true, why: '「' + C.title + '」을(를) 넘겼다', camp: true }; R.offer = null; R.phase = 'over'; }
  }
  // 목표: 화면에 보일 줄과 다 되었나
  function goals(R) {
    const C = CH[R.camp.ch], G = R.G, g = C.goal, cp = R.camp, out = [];
    const dug = G.cells.filter(c => c.dug).length, kin = G.kin.filter(m => m.kind !== 'spawn').length, organs = G.cells.filter((c, i) => c.dug && c.type !== 'empty' && i !== G.core).length;
    const traps = G.cells.reduce((a, c) => a + c.traps.length, 0), skills = (G.stats.skills || 0), molts = (R.molts || []).length + (R.moltQ || 0) - (cp.molt0 || 0), nights = Math.max(0, G.day - 1);
    const it = (k, label, cur, need) => out.push({ k, label, cur: Math.min(cur, need), need, done: cur >= need });
    if (g.dug) it('dug', '굴 ' + g.dug + '칸', dug, g.dug);
    if (g.kin) it('kin', '권속 ' + g.kin, kin, g.kin);
    if (g.organs) it('organs', '기관 ' + g.organs, organs, g.organs);
    if (g.traps) it('traps', '함정 ' + g.traps, traps, g.traps);
    if (g.seeker) it('seeker', '책을 쫓는 자를 몰아냄', cp.seeker, g.seeker);
    if (g.skills) it('skills', '기술 카드 쓰기', skills, g.skills);
    if (g.molts) it('molts', '허물', molts, g.molts);
    if (g.needles) it('needles', '바늘 점', cp.needles, g.needles);
    it('nights', g.nights + '밤 버티기', nights, g.nights);
    return out;
  }
  const goalDone = R => { const gs = goals(R), nt = gs.find(x => x.k === 'nights'); return gs.every(x => x.done) || (!!nt && nt.done && R.G.day - 1 >= CH[R.camp.ch].goal.nights + 3); };

  // ---- 장이 끝났을 때 (cardmode.endRun 이 부른다): 넘겼으면 기록하고 본편에 연다 ----
  function onEnd(R) {
    const ch = R.camp.ch, C = CH[ch], meta = R.meta, cm = campMeta(meta), win = !!(R.G.over && R.G.over.win);
    const res = { ch, win, title: C.title, opened: [], egg: null, first: false };
    if (win) {
      res.first = !cm.clear[ch]; cm.clear[ch] = 1; cm.best[ch] = Math.max(cm.best[ch] || 0, R.G.day);
      if (res.first) {
        meta.unlocked = meta.unlocked || {};
        let ids = C.unlock.cards.slice(); if (ch === 7 && cm.choice5 === 'release') ids = ids.concat(CHOICE.release.bonus);
        ids.forEach(id => { const d = CD.BY[id]; if (!d) return; if (d.unlock) meta.unlocked[d.unlock] = 1; res.opened.push(id); });
        cm.opened = [...new Set(cm.opened.concat(res.opened))];
        const e = C.unlock.egg; if (e) { const egg = { name: e.name, aspect: e.aspect || R.aspect, tags: Object.assign({}, e.tags), from: 'camp' + ch, at: 0 }; meta.eggs = meta.eggs || []; meta.eggs.push(egg); meta.eggs = meta.eggs.slice(-6); res.egg = egg; }
      }
    }
    cm.last = { ch, win, day: R.G.day };
    return res;
  }
  // 5장 끝의 선택
  function choose(meta, k) { if (!CHOICE[k]) return false; campMeta(meta).choice5 = k; return true; }
  // 바늘 점을 쳤다 (cardmode.needleResult 가 부른다)
  function onNeedle(R, res) { if (R.camp) R.camp.needles++; }

  // ---- 대사: 장 시작·밤 뒤·끝. 한 번 나온 줄은 다시 안 나온다 ----
  function linesAt(R, when) {
    const C = CH[R.camp.ch], cp = R.camp, key = when === 'night' ? 'n' + (R.G.day - 1) : when;
    if (!C || cp.said[key]) return []; cp.said[key] = 1;
    if (when === 'night') return (C.lines.night[R.G.day - 1] || []).slice();
    if (when === 'end' && R.camp.ch === 5) return C.lines.end.slice();
    if (when === 'end' && R.camp.ch === 7 && cp.choice && CHOICE[cp.choice]) return [CHOICE[cp.choice].line].concat(C.lines.end);
    return (C.lines[when] || []).slice();
  }

  return { CH, CHOICE, IDS, SEEKER, campMeta, isOpen, next, newRun, morning, poolOk, afterNight, goals, goalDone, onEnd, choose, onNeedle, linesAt };
})();
if (typeof module !== 'undefined') module.exports = CAMPAIGN;
