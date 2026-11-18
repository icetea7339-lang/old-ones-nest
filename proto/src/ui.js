// 옛 것의 둥지 — 화면 3/3: 글, 패널, 창, 낮과 밤의 흐름, 입력
// ---------- 글 ----------
const N_ = text => ({ narr: true, text }), E_ = text => ({ text });
const STORY = {
  intro: [N_('별 하나가 떨어졌다. 떨어진 자리에는 손바닥만 한 점액 한 방울과, 구덩이에 흩어진 누군가의 금화 삼백 닢이 남았다.'), E_('…들리나? 좋아. 나는 잔향이야. 네가 예전에 얼마나 컸는지 기억하는 마지막 메아리지.'), E_('지금 넌 한 방울이야. 30일 뒤, 별들이 한 줄로 서는 밤까지 살아남으면 다시 깨어나.'), E_('굴을 파고, 찾아오는 것들을 거두고, 밤마다 쳐들어오는 인간을 막아. 쓰러뜨린 인간은 먹이고, 겁에 질려 무릎 꿇은 인간은… 쓸모가 많지.'), E_('먹은 대로 변한다는 것만 기억해. 그리고 금화를 쌓아 두면 냄새를 맡고 더 많이 온다는 것도.'), E_('우선 문 앞에 서성이는 것들부터 들여. 혼자서는 첫 주도 못 넘겨.')],
  act2: [E_('첫 허물을 벗었네. 이제 지상으로 손을 뻗을 수 있어. Tab으로 올라가서 마을을 봐.'), E_('겁만 줄지, 털지, 지도에서 지울지는 네 마음이야. 다만 무서운 소문은 더 무서운 인간을 데려와.')],
  act3: [E_('인간들이 널 부르는 이름이 생겼어. 좋은 뜻은 아니야.'), E_('이제 사냥꾼과 학자가 온다. 학자는 네 능력을 봉하고, 성직자는 겁먹은 자를 다독여. 누구부터 치울지 생각해.')],
  act4: [E_('세 번째 허물이야. 이제 네 몸은 굴 하나로는 다 안 보여.'), E_('인간들이 군대를 보내기 시작했어. 병사는 벽을 뚫고 들어오고, 종군 사제는 겁먹은 자들을 붙든다. 아직 열두 밤이 남았어.')],
  act5: [E_('여섯 밤 남았어. 인간들도 그걸 알아.'), E_('마지막 밤엔 봉인자가 온다. 함정은 절반만 듣고, 한 번에 두 번 친다. 쓸 수 있는 건 전부 써.')],
  last: [E_('오늘 밤 별이 선다. 넘기면 깨어나고, 못 넘기면 다시 한 방울이야.')],
  spared: [E_('방금 건 내가 막았어. 금고 절반은 수업료로 쳐.'), E_('두 번은 없어. 본체 방에 호위를 세우고, 길 위에 싸울 자리를 더 만들어.')],
  core: [N_('동굴은 다시 조용해졌다. 바닥에는 마른 얼룩 하나만 남았다.'), E_('…괜찮아. 별은 또 떨어져.')],
  broke: [N_('금고가 비자 권속들이 하나둘 떠났다. 빈 굴에는 바람 소리만 남았다.'), E_('굶는 신을 믿는 자는 없어. 다음엔 장부부터 봐.')],
  win: [N_('별들이 한 줄로 섰다. 동굴 깊은 곳에서 무언가가 아주 오랜만에 눈을 떴다.')],
};
const ENDING = {
  abyss: '해안선이 조금씩 안쪽으로 옮겨 갔다. 어부들은 이제 그물을 던지기 전에 먼저 절을 한다.',
  nebula: '밤하늘에 못 보던 별자리가 하나 생겼다. 학자들은 이름을 붙이려다 그만두었다. 부르면 돌아본다는 소문 때문에.',
  brood: '숲이 마을 쪽으로 걸어오고 있다. 하루에 한 뼘씩. 서두르지 않는다.',
  dusk: '마을마다 같은 꿈을 꾼다. 막이 오르고, 다들 박수를 친다. 아침에 깨면 손바닥이 얼얼하다.',
  hunger: '지도에서 마을 몇 개가 지워졌다. 지도 제작자는 실수라고 했다. 그 뒤로는 지도 제작자도 보이지 않는다.',
  none: '별은 섰지만 몸은 그대로였다. 한 방울은 한 방울인 채로 조금 더 오래 살아남았다.',
  h_abyss: '물 한 방울 고이게 한 적 없이 깊어졌다. 바다는 그 자리에 그대로 있는데, 어부들은 이제 그물 대신 두레박을 내린다. 올라오는 것은 없다.',
  h_nebula: '한 번도 손을 대지 않고 지켜보기만 했다. 별은 섰고, 그것은 끝내 눈을 뜨지 않았다. 점성가들은 그 자리를 비워 두고 별자리를 다시 그렸다.',
  h_brood: '불어나는 것이 불어나지 않았다. 숲은 자라지 않았고, 그 한가운데 나무 한 그루만 하늘에 닿았다.',
  h_dusk: '죽은 자가 거의 없었다. 다들 제 발로 걸어 나가 제 입으로 이야기했다. 막은 아직 내려오지 않았다.',
  h_hunger: '먹지 않고 다 자랐다. 인간들은 그것을 무서워해야 할지 본받아야 할지 정하지 못했고, 그 사이 접시는 계속 비어 있다.',
  child: '아무도 바치지 않았고, 길 잃은 아이는 빵을 다 먹고 집에 갔다. 스무 해 뒤 그 아이가 동굴 앞에 첫 돌을 놓았다. 제단이 아니라 식탁이었다.',
  pure: '아무도 바치지 않고 깨어났다. 인간들은 그것을 뭐라 불러야 할지 아직 정하지 못했다. 신이라기엔 얌전하고, 괴물이라기엔 예의가 바르다.',
};
// 최종 모습마다 세 갈래: 점수 등급이 낮으면 조짐, 중간이면 번짐, 높으면 끝
const ENDING3 = {
  abyss: [['젖은 발자국', '갯마을 사람들은 아침마다 문 앞에서 젖은 발자국을 본다. 바다 쪽에서 와서 바다 쪽으로 돌아간 발자국이다. 아무도 누구 것인지 묻지 않는다. 묻지 않는 한, 아직은 모르는 일이니까.'],
    ['밀려오는 것', '밀물이 썰물보다 조금씩 길어졌다. 우물에서 짠맛이 나고, 아이들은 가르친 적 없는 노래를 부른다. 어른들은 가사를 알아듣지 못한다. 알아들은 이들은 밤에 물가로 걸어 나갔다.'],
    ['가라앉은 세계', '지도 제작자들은 해안선을 다시 그리다가 붓을 놓았다. 육지라 부르던 것이 사실은 아주 오래 드러나 있던 바닥이었음을, 모두가 같은 밤에 알게 되었다. 물은 서두르지 않는다. 가라앉은 도시의 창마다 불이 켜져 있고, 그 안에서 무언가가 여전히 저녁을 차린다.']],
  nebula: [['낯선 별', '하늘에 별이 하나 늘었다. 점성가들은 장부에 적고 넘어갔다. 그 별이 밤마다 조금씩 자리를 옮긴다는 것을 눈치챈 사람은 양치기 하나뿐이었고, 그는 그 뒤로 위를 보지 않는다.'],
    ['열린 하늘', '별자리가 맞지 않게 되었다. 뱃사람들은 길을 잃었고 달력은 하루씩 어긋났다. 학술원은 관측을 금했다. 금지령이 닿기 전에 이미 본 사람들은 지금도 같은 쪽을 보고 서 있다. 먹지도 자지도 않고.'],
    ['별 사이', '어느 밤 하늘이 접혔다. 종이처럼, 소리 없이. 접힌 틈으로 보이는 것은 어둠이 아니었다. 사람들은 그제야 밤하늘이 무언가를 가리는 덮개였음을 알았다. 지금 도시들은 조금씩 떠오르고 있다. 떨어지는 것인지도 모른다. 위아래를 정해 주던 것이 사라졌으므로.']],
  brood: [['이끼', '너른들의 담장에 못 보던 이끼가 꼈다. 긁어내면 다음 날 다시 있다. 촌장은 별일 아니라고 했다. 촌장의 손톱 밑이 초록색인 것을 본 사람은 아무 말도 하지 않았다.'],
    ['걸어 다니는 밭', '병이 돈다고들 했다. 병이 아니었다. 앓고 일어난 사람들은 전보다 건강했고, 말수가 줄었고, 해가 지면 다 같이 밭에 나가 서 있었다. 뿌리를 내리는 것처럼. 아침이면 돌아와 식구들에게 웃어 보였다. 웃는 법이 모두 똑같았다.'],
    ['끝없이 낳는 숲', '마지막까지 남은 도시는 성문을 걸어 잠갔다. 성 밖에서는 이웃이었던 것들이 천천히, 아주 참을성 있게 걸어온다. 썩지 않는다. 오히려 피어 있다. 그들은 문을 두드리지 않는다. 기다릴 뿐이다. 성 안의 누군가가 기침을 하고, 손등에 돋은 싹을 소매로 가릴 때까지.']],
  dusk: [['같은 꿈', '마을마다 같은 꿈을 꾼다. 막이 오르고, 다들 박수를 친다. 아침에 깨면 손바닥이 얼얼하다. 무대에 무엇이 있었는지는 아무도 기억하지 못한다.'],
    ['가면', '사람들이 얼굴을 가리기 시작했다. 처음엔 부끄러워서라고 했다. 가면 아래를 본 이발사는 가게 문을 닫았다. 그는 말한다. 아래에 아무것도 없는 게 아니었다고. 아래에도 가면이 있었다고.'],
    ['마지막 막', '어느 저녁 온 세상의 종이 한꺼번에 울렸다. 사람들은 하던 일을 놓고 줄지어 앉았다. 들판에, 지붕에, 바다 위에. 같은 쪽을 보고서. 무대는 보이지 않는다. 박수 소리만 들린다. 박수는 그치지 않고 아무도 일어서지 않는다. 막이 내리면 무엇이 끝나는지 다들 알기 때문이다.']],
  hunger: [['빈 접시', '식탁에 차린 것이 자꾸 모자란다. 세어 보면 맞는데, 먹고 나면 모자란다. 사람들은 조금씩 야위어 가고, 누구도 그 까닭을 입 밖에 내지 않는다. 말이 씨가 될까 봐서가 아니다. 말도 먹힐까 봐서다.'],
    ['지워진 마을', '지도에서 마을 몇 개가 지워졌다. 지도 제작자는 실수라고 했다. 그 뒤로는 지도 제작자도 보이지 않는다. 그 마을에 친척이 있던 사람들은 친척의 이름을 떠올리지 못한다. 이름이 있던 자리만 혀끝에 남아 있다.'],
    ['마지막 한 입', '달이 한쪽부터 줄어들었다. 그믐이 아니었다. 잇자국이 보였다. 산이 사라진 자리에는 구덩이가 아니라 아무것도 없었다. 사람들은 이제 안다. 세상이 둥근 것은 무언가의 입안에 들어 있기 때문이라는 것을. 그리고 그 입이 아주 천천히 닫히는 중이라는 것을.']],
};
const endTier = g => ['D', 'C'].includes(g) ? 0 : ['B', 'A'].includes(g) ? 1 : 2;
function startEnding(sc) {
  const c = $('endcv'); if (!c || !G || !G.slime.main) return; const key = G.slime.main, tier = endTier(sc.grade), sl = JSON.parse(JSON.stringify(G.slime)); let fr = 0;
  const tick = () => { if (!document.body.contains(c)) return clearInterval(iv); try { endingScene(c, key, tier, sl, fr++); } catch (e) { clearInterval(iv); } }, iv = setInterval(tick, 260); tick();
}
const GRADE_SAY = { SSS: '별들이 줄을 서서 구경했어. 이 정도면 나도 필요 없겠다.', SS: '예전의 너와 거의 같아. 거의.', S: '훌륭해. 인간들이 지도를 다시 그려야겠네.', A: '무난하게 깨어났어. 다음엔 더 크게.', B: '깨어나긴 했어. 하품부터 하고 있지만.', C: '간신히. 별이 조금만 덜 섰어도 못 깼을 거야.', D: '…다음 별을 기다리자.' };
const STAGE_NAME = ['한 방울', '첫 허물', '두 번째 허물', '세 번째 허물', '성체'];
function guideLine() {
  const d = G.day, bench = G.kin.filter(m => m.loc === null).length;
  if (G.spot && G.ap > 0 && d > 3) return '지상에 ' + NEST.SPOT[G.spot.type].name + '이(가) 보여. 이틀이면 사라져. 행동 하나를 쓸 만한지 봐.';
  if (G.omen && G.omen.tier !== 'boon' && !G.omen.calmed && G.faith >= NEST.CALM_COST) return '오늘 징조에는 나쁜 쪽이 붙어 있어. 신앙 ' + NEST.CALM_COST + '을 바치면 달랠 수 있어. 아래 "징조"를 눌러.';
  if (G.guest) return '오늘 밤은 싸우러 오는 게 아니야. ' + NEST.GUEST[G.guest.type].name + '이(가) 온다. 아래 "손님"을 눌러 어떻게 맞을지 정해.';
  { const e = NEST.estimate(G, 'tonight') || NEST.estimate(G, 'tomorrow'); if (e && e.boss && e.boss !== 'captain' && d < NEST.K.days) return '곧 올 무리의 우두머리는 ' + NEST.INV[e.boss].name + '. ' + NEST.INV[e.boss].boss + '. 거기 맞춰 자리를 바꿔.'; }
  if (bench) return '자리 없이 서성이는 권속이 ' + bench + '명 있어. 초소나 대기실을 지어서 세워.';
  if (d === 1) return '아래 "지원자"를 눌러 권속을 들이고, 길 위 빈 굴을 눌러 초소나 함정방을 지어. 건설 행동 한 번에 작업 세 번이야.';
  if (d === 2) return '점선이 인간들이 걸어올 길이야. 길 위에 싸울 자리를 만들어. 내일 밤 처음으로 온다.';
  if (d === 3) return (TOUCH ? "지도 위 '지상' 버튼을 눌러 봐." : 'Tab으로 지상에 올라가 봐.') + ' 오늘 밤 누가 얼마나 오는지 보여.';
  if (G.corpses.length >= 3) return '먹이가 쌓였어. 본체 방을 눌러 포식해. 먹은 것의 징조가 쌓인다.';
  if (G.prison.length) return '포로가 있어. 풀어 주고 몸값을 받을지, 바칠지, 믿게 할지 정해.';
  if (d < 6 && NEST.sideRooms(G).length === 0) return '길에서 벗어난 칸을 파면 적이 지나가지 않는 곁방이 돼. 감옥이나 예배당은 거기에 지어.';
  if (NEST.isSettle(G)) return '오늘은 달이 기우는 밤이야. 평소보다 큰 무리가 오고, 넘기면 정수에 따라 허물을 벗는다. 밤에 손을 쓸 수 있어.';
  if (G.gold > 500 * NEST.cm(G)) return '금고가 묵직해. 냄새를 맡고 더 많이 올 거야. 권속이 있는 방을 눌러 훈련시키거나 함정을 강화해.';
  if (NEST.actOf(G) >= 2 && !Object.values(G.vill).some(s => s.tribute || s.razed)) return '지상의 마을을 눌러 봐. 위협하면 공물을 바치고, 털면 한몫 잡지만 그 마을이 벼른다.';
  return '먹은 대로 변해. 본체 방에서 어떤 징조가 앞서는지 봐.';
}

// ---------- 흔적: 한 일이 무언가를 연다 ----------
const FEATS = [
  ['first_night', '첫 밤', '침입을 한 번 격퇴한다', '매복굴', () => G.stats.repels >= 1],
  ['first_captive', '첫 포로', '포로를 한 명 잡는다', '설득실', () => G.stats.captives >= 1 || G.prison.length > 0],
  ['first_ransom', '첫 몸값', '몸값을 받고 풀어 준다', '미끼 방', () => G.stats.ransoms >= 1],
  ['first_sacrifice', '첫 제물', '포로를 제물로 바친다', '의식실', () => G.sacrifices >= 1],
  ['first_convert', '첫 신도', '포로를 개종시킨다', '환각 안개', () => G.stats.converts >= 1],
  ['first_evo', '첫 허물', '한 번 진화한다', '제단, 징조 전용 두 번째 시설', () => G.slime.stage >= 1],
  ['first_raid', '지상에 손을 뻗다', '마을을 습격한다', '야영지, 망루', () => (G.stats.raids || 0) >= 1],
  ['hands3', '손을 쓰다', '한 판에 밤 개입을 3번 한다', '산성 웅덩이', () => (G.stats.hands || 0) >= 3],
  ['day12', '열두 밤', '12일째에 닿는다', '큰 대기실, 상점', () => G.day >= 12],
  ['dig3', '굴 파는 것', '한 판에 3칸을 판다', '별가루', () => (G.stats.dug || 0) >= 3],
  ['found1', '묻힌 것', '굴을 파다 무언가를 찾는다', '별가루', () => (G.stats.found || 0) >= 1],
  ['combo1', '맞붙여 짓다', '방 조합을 하나 찾는다', '별가루', () => Object.keys(META.codex.combos).length >= 1],
  ['guest1', '밤 손님', '밤 손님을 맞는다', '별가루', () => (G.stats.guests || 0) >= 1],
  ['calm1', '달래는 법', '징조의 나쁜 쪽을 달랜다', '별가루', () => (G.stats.calms || 0) >= 1],
  ['kinevo1', '자라는 식구', '권속을 한 번 진화시킨다', '별가루', () => (G.stats.kinEvo || 0) >= 1],
  ['first_loss', '한 방울로 돌아가다', '처음으로 쓰러진다', '별가루', () => !!G.over && !G.over.win],
  ['first_win', '깨어난 것', '처음으로 깨어난다', '황혼의 조각, 깊은 각성', () => !!G.over && G.over.win],
  ['heretic1', '어긋난 얼굴', '이단 화신으로 깨어난다', '별가루', () => !!G.over && G.over.win && NEST.endKey(G).startsWith('h_')],
];
const LOCK = { ambush: 'first_night', persuade: 'first_captive', decoy: 'first_ransom', ritual: 'first_sacrifice', mist: 'first_convert', altar: 'first_evo', sluice: 'first_evo', warp: 'first_evo', fleshwall: 'first_evo', mirror: 'first_evo', table: 'first_evo', camp: 'first_raid', tower: 'first_raid', acid: 'hands3', bighall: 'day12', shop: 'day12' };
if (!META.feats) { META.feats = {}; if (META.runs > 0) Object.values(LOCK).forEach(id => { META.feats[id] = 1; }); }  // 이미 해 본 사람은 배우는 흔적을 연 채로 시작
FEATS.forEach(f => { f[3] = '별가루'; });   // 흔적은 이제 무엇도 잠그지 않는다. 기록과 별가루만 준다
const locked = k => false;
const lockText = k => { const f = FEATS.find(x => x[0] === LOCK[k]); return '잠김 — 흔적 「' + f[1] + '」: ' + f[2]; };
function checkFeats() {
  if (!G) return; const got = FEATS.filter(f => !META.feats[f[0]] && f[4]()); if (!got.length) return;
  got.forEach(f => { META.feats[f[0]] = 1; META.dust += 15; }); saveMeta(); sfx('up');
  UI.featNew = (UI.featNew || []).concat(got); UI.featMsg = got.map(f => '흔적 「' + f[1] + '」 — ' + f[3] + (f[3] === '별가루' ? ' +15' : ' 열림')).join(' · ');
}

// ---------- 길잡이(튜토리얼): 한 일을 확인하고 다음 할 일을 짚어 준다 ----------
const tutEmpty = () => NEST.paths(G)[0].find(i => i !== NEST.VAULT && i !== NEST.ENT && G.cells[i].type === 'empty');
const TUT = [
  { t: () => modalKind === 'applicants' ? '마음에 드는 권속을 들여. 둘쯤이면 좋아. 행동은 들지 않아. 다 들였으면 "나중에"를 눌러 창을 닫아.' : '아래 띠에서 "지원자"를 눌러 봐. 문 앞에 찾아온 것들이야.', sel: '[data-a="open"][data-v="applicants"], #modal [data-a="accept"], #modal [data-a="close"]', done: () => G.kin.length >= 1 && $('modal').hidden },
  { t: () => '이제 싸울 자리를 만들자. 지도의 점선이 인간들이 걸어올 길이야. 깜빡이는 빈 굴을 눌러.', cell: tutEmpty, done: () => G.cells.some(c => c.type === 'post' || c.type === 'hall') || (UI.sel && UI.sel.t === 'cell' && G.cells[UI.sel.i].dug && G.cells[UI.sel.i].type === 'empty') },
  { t: () => (isMobile() ? '아래 패널이 좁으면 "넓게"를 누르고, ' : '오른쪽 패널에서 ') + '"초소"를 지어. 건설 행동 한 번이면 파기·짓기·옮기기 같은 작업을 세 번 할 수 있어.', sel: '[data-a="build"][data-v="post"], #sheetbtn', done: () => G.cells.some(c => c.type === 'post' || c.type === 'hall') },
  { t: () => '초소에 권속을 세우자. 띠의 "권속"을 누르고, 한 명을 고른 뒤 "옮기기"에서 초소를 눌러.', sel: '#sheetclose, [data-a="open"][data-v="roster"], #modal [data-a="kin"], #modal [data-a="place"]', done: () => G.kin.some(m => typeof m.loc === 'number') },
  { t: () => '좋아. 창을 닫고 지도 오른쪽 위의 "지상"을 눌러. 오늘 밤 누가 오는지 보여.', sel: '#modal [data-a="close"], [data-a="view"][data-v="surface"]', done: () => ST.screen === 'surface' && $('modal').hidden },
  { t: () => '붉은 표시가 오늘 밤 올 무리야. 마을과 길목도 눌러 볼 수 있어. 다 봤으면 "지하"로 돌아와.', sel: '[data-a="view"][data-v="under"]', done: () => ST.screen === 'under' },
  { t: () => '준비 끝. "밤을 맞는다"를 눌러. 행동이 남았으면 한 번 더 누르면 돼. 싸움은 권속과 함정이 알아서 해.', sel: '[data-a="endday"]', done: () => G.day >= 2 },
  { t: () => '첫 밤을 넘겼어. 쓰러뜨린 인간은 먹이가 돼. 지도 맨 아래 오른쪽, 깜빡이는 본체 방을 눌러.', cell: () => NEST.CORE, done: () => !G.corpses.length || (G.stats.eats || 0) >= 1 || (UI.sel && UI.sel.t === 'cell' && UI.sel.i === NEST.CORE) },
  { t: () => '"포식"을 눌러. 먹은 것의 징조가 쌓이고, 6일째 밤에 정수가 36을 넘으면 그 징조로 진화해.', sel: '[data-a="eat"], #sheetbtn', done: () => !G.corpses.length || (G.stats.eats || 0) >= 1 },
  { t: () => '여기까지가 기본이야. 무릎 꿇은 인간은 띠의 "포로"에서 처분하고, 바위를 눌러 굴을 넓히고, 위쪽 숫자를 누르면 뜻이 나와. 나머지는 그때그때 말해 줄게.', end: true, done: () => false },
];
function coach() {
  const on = !!G && G.tut != null && !G.over; ['coach', 'coach2'].forEach(id => { $(id).hidden = !on; });
  document.querySelectorAll('.tut-glow').forEach(e => e.classList.remove('tut-glow')); ST.tutCell = null; $('recent').style.display = on ? 'none' : '';
  if (!on) return;
  let guard = 0; while (G.tut < TUT.length - 1 && TUT[G.tut].done() && guard++ < 20) { G.tut++; sfx('up'); }
  const st = TUT[G.tut], html = `<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${echoImg(40)}<p class="grow"><b class="coin h3">잔향</b> <small class="mute">길잡이 ${G.tut + 1}/${TUT.length}</small><br>${esc(st.t())}</p>${btn('tutend', null, st.end ? '알겠어' : '그만 보기', 'sm' + (st.end ? ' pri' : ''))}</div>`;
  ['coach', 'coach2'].forEach(id => { if ($(id).dataset.h !== html) { $(id).innerHTML = html; $(id).dataset.h = html; } });
  if (st.sel && ST.mode === 'day') document.querySelectorAll(st.sel).forEach(e => { if (!e.disabled) e.classList.add('tut-glow'); });
  if (st.cell && ST.screen === 'under') ST.tutCell = st.cell();
}
setInterval(() => { if (G && G.tut != null) coach(); }, 400);

// ---------- 작은 도구 ----------
const attrs = o => Object.keys(o || {}).map(k => ` data-${k}="${esc(o[k])}"`).join('');
const btn = (a, o, label, cls, dis) => `<button class="btn ${cls || ''}" data-a="${a}"${attrs(o)}${dis ? ' disabled' : ''}>${label}</button>`;
const opt = (a, o, name, cost, desc, dis) => `<button class="btn opt" data-a="${a}"${attrs(o)}${dis ? ' disabled' : ''}><b>${esc(name)}${cost ? ` <span class="coin num">${R(cost)}G</span>` : ''}</b><span class="small mute">${esc(desc)}</span></button>`;
const aspChip = (a, s) => `<span class="chip" style="border-color:${ASPCOL[a]};color:${ASPCOL[a]}">${esc(s || NEST.ASP[a])}</span>`;
const bar = (f, col) => `<span class="bar"><i style="width:${Math.max(0, Math.min(100, f * 100))}%;${col ? 'background:' + col : ''}"></i></span>`;
const coord = i => 'ABCDE'[i % 5] + (Math.floor(i / 5) + 1);
const locName = loc => loc === 'core' ? '본체 방' : loc === null ? '대기' : NEST.ROOM[G.cells[loc].type].name + ' ' + coord(loc);
const kinChip = m => `<button class="unit${m.rare ? ' rare' : ''}${m.hurt || m.strike ? ' off' : ''}" data-a="kin" data-id="${m.id}">${kinImg(m.kind, 32, m.evo)}<span>${esc(m.name)} <small class="mute">Lv${m.lv}${m.evo ? ' ★' : ''}${m.hurt ? ' 부상' : m.strike ? ' 파업' : ''}</small></span></button>`;
let toastT = 0;
function toast(r) {
  const t = $('toast'); if (!t) return; clearTimeout(toastT);
  if (UI.featMsg) { r = { ok: true, msg: (r && r.msg ? r.msg + ' · ' : '') + UI.featMsg }; UI.featMsg = ''; }
  if (!r || !r.msg) { t.textContent = ''; UI.lastToast = null; return; }
  UI.lastToast = { msg: r.msg, ok: r.ok, at: Date.now() }; t.textContent = r.msg; t.className = r.ok ? '' : 'err';
  toastT = setTimeout(() => { UI.lastToast = null; const e = $('toast'); if (e) e.textContent = ''; }, 3200);
}
function setSheet(on) { $('right').classList.toggle('open', !!on); $('sheetbtn').setAttribute('aria-expanded', !!on); }
function act(fn, ...a) { const r = fn(G, ...a); UI.confirmEnd = false; render(); toast(r); if (r && r.ok) { sfx('click'); saveRun(); } else sfx('down'); refreshModal(); return r; }

// ---------- 낮 화면 ----------
function hud() {
  const h = ST.hud || G, need = NEST.K.thresh[G.slime.stage + 1], fg = NEST.fearGrade(G);
  const stat = (lb, val, sub, tip, cls, style) => `<button class="stat" data-a="stat" title="${esc(tip)}"><span class="lb">${lb}</span> <span class="v"><b class="num ${cls || ''}"${style ? ` style="${style}"` : ''}>${val}</b>${sub || ''}</span></button>`;
  $('hud').innerHTML = `<div class="hud-top"><span class="hud-turn">${G.day}일 <small class="mute">/ ${NEST.K.days} · ${NEST.actOf(G)}막${NEST.isSettle(G) ? '<span class="only-pc"> · 달이 기우는 밤</span>' : ''}</small>${NEST.isSettle(G) ? '<span class="only-m moon"> ◐</span>' : ''}</span>
    <span class="hud-ap"><span class="only-pc">행동 </span><span class="pips">${Array.from({ length: NEST.K.ap }, (_, i) => `<i class="pip${i < G.ap ? '' : ' off'}"></i>`).join('')}</span>${G.d.buildOps ? ` <small class="mute">작업 ${G.d.buildOps}</small>` : ''}</span>
    <span id="toast"></span>
    <span class="row hud-btns">${btn('help', null, '도움말', 'sm only-pc')}${btn('settings', null, '설정', 'sm only-pc')}${btn('quit', null, '나가기', 'sm only-pc')}${btn('menu', null, '메뉴', 'sm only-m')}</span></div>
    <div class="stats">${stat('재물', R(h.gold), '', '재물: 많이 쌓아 둘수록 침입이 잦고 커진다', 'coin')}
    ${stat('신앙', Math.floor(h.faith), `<small class="mute">/${NEST.faithCap(G)}</small>`, '신앙: 밤의 손 주문에 쓴다. 신도와 예배당, 광란한 적에게서 얻는다', '', 'color:#c8a8ff')}
    ${stat('공포', Math.round(h.fear), ` <small class="mute gname">${NEST.GRADE_NAME[fg]}</small>`, '공포 ' + Math.round(h.fear) + ': 지금은 ' + NEST.GRADE_NAME[fg] + '이 온다. 오를수록 더 강한 인간이 오고, 매일 2씩 가라앉는다', 'up')}
    ${stat('정수', NEST.essTotal(G), need ? `<small class="mute">/${need}</small>` : '', '정수: 달이 기우는 밤에 기준을 넘으면 진화한다', '')}
    ${stat('먹이', G.corpses.length, `<small class="mute">/${NEST.corpseCap(G)}</small>`, '먹이: 쓰러뜨린 침입자. 본체 방에서 포식하면 정수가 된다', '')}</div>`;
  if (UI.lastToast && Date.now() - UI.lastToast.at < 3200) { const t = $('toast'); t.textContent = UI.lastToast.msg; t.className = UI.lastToast.ok ? '' : 'err'; }
  if (isMobile()) document.documentElement.style.setProperty('--hud-h', $('hud').offsetHeight + 'px');
}
function forecastText(when) { if (when === 'tonight' && G.guest) return '손님 · ' + NEST.GUEST[G.guest.type].name; const e = NEST.estimate(G, when); if (!e) return '조용할 것 같다'; if (e.boss && e.boss !== 'sealer') return `${NEST.VILL[e.vill].name} · ${NEST.INV[e.boss].name} 외 ${e.count - 1}명 (큰 무리)`; return `${NEST.VILL[e.vill].name} · ${NEST.GRADE_NAME[e.grade]} ${e.kinds ? '' : '약 '}${e.count}명${e.settle ? ' (큰 무리)' : ''}`; }
function tray() {
  const out = [], bench = G.kin.filter(m => m.loc === null).length;
  if (G.event) out.push(`<button class="chip todo" data-a="open" data-v="event">사건: ${esc(NEST.EVENTS[G.event.id].title)}</button>`);
  if (G.omen) { const live = G.omen.tier !== 'boon' && !G.omen.calmed; out.push(`<button class="chip${live ? ' todo' : ''}" data-a="open" data-v="elder"><span style="color:${ASPCOL[G.eld.id]}">징조</span> ${NEST.OMEN[G.omen.id].name}</button>`); }
  if (G.guest) out.push(`<button class="chip todo" data-a="open" data-v="guest">손님: ${NEST.GUEST[G.guest.type].name}</button>`);
  if (G.spot) out.push(`<button class="chip todo" data-a="gospot">지상: ${NEST.SPOT[G.spot.type].name} (${G.spot.left}일)</button>`);
  if (G.applicants.length) out.push(`<button class="chip todo" data-a="open" data-v="applicants">지원자 ${G.applicants.length}</button>`);
  if (G.prison.length) out.push(`<button class="chip todo" data-a="open" data-v="captives">포로 ${G.prison.length}/${NEST.prisonCap(G)}</button>`);
  if (bench) out.push(`<button class="chip todo" data-a="open" data-v="roster">대기 중인 권속 ${bench}</button>`);
  out.push(`<button class="chip" data-a="open" data-v="roster">권속 ${G.kin.length}</button>`);
  out.push(`<button class="chip" data-a="view" data-v="surface"><span class="up">오늘 밤</span> ${esc(forecastText('tonight'))}</button>`);
  if (G.day < NEST.K.days) out.push(`<button class="chip" data-a="view" data-v="surface"><span class="warnc">내일 밤</span> ${esc(forecastText('tomorrow'))}</button>`);
  $('tray').innerHTML = out.join('');
  $('recent').innerHTML = `<div class="row">${echoImg(40)}<p class="grow"><b class="h3 coin">잔향</b><br>${esc(guideLine())}</p></div>` + (G.log.length ? `<details><summary class="small mute">지난 일 ${Math.min(8, G.log.length)}건</summary>${G.log.slice(-8).reverse().map(s => `<p class="small mute">${esc(s)}</p>`).join('')}</details>` : '');
}
function slimePanel() {
  const sl = G.slime, s = NEST.slimeStats(G), need = NEST.K.thresh[sl.stage + 1], tot = NEST.essTotal(G), max = Math.max(1, ...NEST.ASPECTS.map(a => sl.ess[a]), need ? need / 2 : 1);
  const lines = [];
  if (sl.stage >= 1) { lines.push(`<p><b>${NEST.FORM1[sl.main].name}</b> — ${esc(sl.stage >= 2 ? NEST.FORM2UP[sl.main] : NEST.FORM1[sl.main].skill)}</p>`); const sp = NEST.FORM1[sl.main].spell; lines.push(`<p><b>손 주문 「${sp[0]}」</b> <small style="color:#c8a8ff">신앙 ${NEST.spellCost(G)}</small> — ${esc(sp[2])}</p>`); }
  if (sl.stage >= 2) lines.push(`<p>${aspChip(sl.sub, NEST.ASP[sl.sub] + ' 섞임')} ${esc(NEST.SUBTRAIT[sl.sub])}</p>`);
  const guards = G.kin.filter(m => m.loc === 'core'), bench = G.kin.filter(m => m.loc === null);
  return `<div class="slime-top">${slimeImg(sl, 96, NEST.formName(G))}<div class="stack"><h2>${esc(NEST.formName(G))}</h2><p class="small mute">${STAGE_NAME[sl.stage]} · 체력 ${R(sl.hp)}/${R(s.hp)} · 공격 ${R(s.atk)} · 방어 ${R(s.df)}</p>${bar(sl.hp / s.hp)}</div></div>
    ${lines.length ? `<div class="card">${lines.join('')}</div>` : '<p class="mute small">아직 형체가 없다. 6일째 밤에 정수 합이 36을 넘으면 가장 많이 먹은 징조로 첫 허물을 벗는다.</p>'}
    <h2>정수 <small class="mute">${tot}${need ? ' / 다음 허물 ' + need : ''}</small></h2>
    <div class="pts">${NEST.ASPECTS.map(a => `<span style="color:${ASPCOL[a]}">${NEST.ASP[a]}</span>${bar(sl.ess[a] / max, ASPCOL[a])}<span class="num">${sl.ess[a]}</span>`).join('')}</div>
    <p class="small mute">${sl.stage === 0 ? '가장 많은 징조가 몸의 색과 능력을 정한다.' : sl.stage === 1 ? '12일째 밤, 두 번째로 많은 징조가 섞인다.' : sl.stage === 2 ? '18일째 밤에 기준을 넘으면 세 번째 허물을 벗는다.' : sl.stage === 3 ? '24일째 밤에 기준을 넘으면 성체가 된다.' : '다 자랐다. 별이 서기를 기다린다.'}</p>
    <h2>먹이 <small class="mute">${G.corpses.length}/${NEST.corpseCap(G)}</small></h2>
    <div class="row">${G.corpses.map(c => aspChip(NEST.INV[c.kind].asp, NEST.INV[c.kind].name + ' +' + NEST.corpsePts(G, c.kind))).join('') || '<span class="mute small">없음. 쓰러뜨린 침입자가 먹이가 된다.</span>'}</div>
    <div class="row">${btn('eat', null, `포식 (행동 1, ${G.slime.muts.includes('mouth') ? 6 : 3}구)`, 'pri', !G.corpses.length)}${btn('rest', null, '휴식 (행동 1, 본체 회복·부상 복귀)')}</div>
    ${sl.muts.length ? `<h2>변이 <small class="mute">${sl.muts.length}/6</small></h2><div class="stack">${sl.muts.map(m => `<p>${aspChip(NEST.MUT[m].asp, NEST.MUT[m].name)} <span class="small">${esc(NEST.MUT[m].desc)}</span></p>`).join('')}</div>` : ''}
    <h2>호위 <small class="mute">${guards.filter(m => m.kind !== 'spawn').length}/2</small></h2><div class="units">${guards.map(kinChip).join('') || '<span class="mute small">없음</span>'}</div>
    ${bench.length ? `<div class="row"><span class="small mute">여기에 세우기:</span>${bench.map(m => btn('place', { id: m.id, loc: 'core' }, esc(m.name), 'sm')).join('')}</div>` : ''}`;
}
function cellPanel(i) {
  const c = G.cells[i], cmx = NEST.cm(G);
  if (!c.dug) { const why = NEST.canDig(G, i), pv = NEST.digPreview(G, i), say = { side: ['곁방이 된다', '적이 지나가지 않는다. 감옥·예배당 같은 살림을 두기 좋다.', 'okc'], split: ['길이 갈라진다', '이 칸을 지나는 같은 길이의 길이 하나 더 생긴다. 무리가 나뉘어 들어온다. 적은 흩어지지만 지킬 곳도 늘어난다.', 'warnc'], short: ['지름길이 뚫린다', '금고까지 길이 짧아진다. 적은 새 길로만 오고, 지금 길 위의 시설 일부는 곁방이 된다.', 'up'] }[pv]; return `<h2>단단한 바위 <small class="mute">${coord(i)}</small></h2>${!why && G.buried && G.buried[i] ? '<p class="coin"><b>무언가 묻혀 있다.</b> 파 봐야 무엇인지 안다.</p>' : ''}${why ? `<p class="mute">${esc(why)}</p>` : `<p><b class="${say[2]}">${say[0]}.</b> ${say[1]}</p>`}${why ? '' : `<div class="row">${btn('dig', { i }, `파기 (${40 * cmx}G · 작업 1)`, 'pri')}</div>`}`; }
  if (i === NEST.CORE) return slimePanel();
  const d = NEST.ROOM[c.type], side = NEST.sideRooms(G).includes(i);
  let h = `<h2>${i === NEST.ENT ? '입구 · ' : ''}${d.name} <small class="mute">${coord(i)} · Lv${c.lv}</small></h2><p class="small"><span class="chip ${side ? '' : 'on'}">${side ? '곁방 (적이 지나가지 않음)' : '길 위 (적이 지나감)'}</span></p><p class="mute small">${esc(d.desc)}</p>`;
  NEST.combos(G).filter(c => c.cells.includes(i)).forEach(c => { h += `<p class="small"><span class="chip on">조합 「${c.name}」</span> ${esc(c.desc)}</p>`; });
  if (i === NEST.VAULT) return h + `<p>금고에 닿은 침입자는 한 명당 ${NEST.K.steal * cmx}G를 챙긴다. 살아서 나가면 그만큼 털리고, 무리가 절반 이상 남아 있으면 본체 방까지 들어온다.</p>`;
  if (d.def) {
    const here = G.kin.filter(m => m.loc === i), bench = G.kin.filter(m => m.loc === null), full = here.filter(m => m.kind !== 'spawn').length >= d.def;
    h += `<h2>주둔 <small class="mute">${here.filter(m => m.kind !== 'spawn').length}/${d.def}</small></h2><div class="units">${here.map(kinChip).join('') || '<span class="mute small">비어 있다. 권속이 없으면 적이 그냥 지나간다.</span>'}</div>`;
    if (bench.length && !full) h += `<div class="row"><span class="small mute">여기에 세우기:</span>${bench.map(m => btn('place', { id: m.id, loc: i }, esc(m.name), 'sm')).join('')}</div>`;
    if (here.length && G.day >= 4) h += `<div class="row"><span class="small mute">이 방 훈련 (행동 1):</span>${[30, 60, 120].map(a => btn('train', { loc: i, amt: a * cmx }, a * cmx + 'G', 'sm', G.gold < a * cmx)).join('')}</div>`;
  }
  if (d.traps) {
    h += `<h2>함정 <small class="mute">${c.traps.length}/${d.traps}</small></h2><div class="stack">${c.traps.map((t, j) => `<div class="row"><span class="grow">${NEST.TRAP[t.kind].name} Lv${t.lv}</span>${t.lv < 3 ? btn('uptrap', { i, j }, `강화 ${NEST.trapUpCost(G, t)}G`, 'sm') : '<span class="small mute">최고</span>'}</div>`).join('')}</div>`;
    if (c.traps.length < d.traps) h += `<div class="opts">${Object.keys(NEST.TRAP).map(k => locked(k) ? opt('trap', { i, v: k }, NEST.TRAP[k].name, 0, lockText(k), true) : opt('trap', { i, v: k }, NEST.TRAP[k].name, NEST.TRAP[k].cost * cmx, NEST.TRAP[k].desc)).join('')}</div>`;
  }
  if (G.slime.main && !c.zone) h += `<div class="row">${btn('zone', { i }, `${NEST.ZONE[G.slime.main][0]} 영역 깔기 (${30 * cmx}G)`, 'sm')}<span class="small mute">${esc(NEST.ZONE[G.slime.main][1])}</span></div>`;
  if (c.zone && G.slime.main) h += `<p class="small">${aspChip(G.slime.main, NEST.ZONE[G.slime.main][0] + ' 영역')} ${esc(NEST.ZONE[G.slime.main][1])}</p>`;
  const groups = [['싸울 자리', ['post', 'hall', 'bighall', 'ambush', 'trap']], ['길 위의 꾀', ['decoy', 'shop'].concat(Object.keys(NEST.ROOM).filter(k => NEST.ROOM[k].asp && !NEST.ROOM[k].side))], ['살림 (곁방에 지어야 안전하다)', ['prison', 'chapel', 'ritual', 'persuade', 'altar'].concat(Object.keys(NEST.ROOM).filter(k => NEST.ROOM[k].asp && NEST.ROOM[k].side))]];
  h += `<h2>${c.type === 'empty' ? '짓기' : '바꾸기'} <small class="mute">작업 1</small></h2>`;
  groups.forEach(([title, list]) => {
    const items = list.filter(t => t !== c.type).map(t => { const why = NEST.canBuild(G, i, t), r = NEST.ROOM[t]; if (why && r.asp && !why.includes('이미')) return ''; if (locked(t)) return opt('build', { i, v: t }, r.name, 0, lockText(t), true); return opt('build', { i, v: t }, r.name, NEST.buildCost(G, i, t), why || r.desc + comboHint(i, t), !!why); }).join('');
    if (items) h += `<p class="small mute">${title}</p><div class="opts">${items}</div>`;
  });
  h += `<div class="row">${c.type !== 'empty' ? btn('build', { i, v: 'empty' }, '철거', 'sm bad') : ''}${i !== NEST.ENT ? btn('block', { i }, c.block ? '막은 것 트기' : `길 막기 (${20 * cmx}G)`, 'sm') : ''}</div>`;
  return h;
}
function villPanel(v) {
  const d = NEST.VILL[v], s = G.vill[v], open = NEST.actOf(G) >= 2, done = G.d.raided && G.d.raided[v];
  let h = `<h2>${d.name} <small class="mute">${villState(v)}</small></h2><p>${aspChip(d.asp)} <span class="small mute">길목 ${d.plot + 1}을 지나 온다. 보내는 자: ${d.x.map(k => NEST.INV[k].name).filter((x, k, a) => a.indexOf(x) === k).join(', ')}</span></p>
    <p class="small"><b class="h3">${d.chief[0]}</b> <span class="mute">이 마을의 대표.</span> ${esc(d.chief[1])}</p>
    <div class="row"><span class="small">적의</span>${bar(s.host / 100, '#ff5f57')}<span class="num small">${Math.round(s.host)}</span></div><p class="small mute">적의가 높은 마을에서 침입자가 더 자주 온다. 매일 3씩 가라앉고, 포로를 몸값 받고 돌려보내면 5 내린다. 적의가 15보다 낮은 마을과는 조용히 교역해 매일 ${3 * NEST.cm(G)}G가 들어온다.</p>`;
  if (s.razed) return h + '<p class="mute">남은 것이 없다.</p>';
  if (s.tribute) h += `<p class="coin">매일 공물 ${R(s.tribute * (1 + 0.25 * (NEST.fearGrade(G) - 1)))}G${s.pause ? ` (약탈 뒤 ${s.pause}일 동안 끊김)` : ''}</p>`;
  if (!open) return h + '<p class="mute">습격은 첫 허물을 벗은 뒤(2막)부터 할 수 있다.</p>';
  h += `<h2>습격 <small class="mute">행동 1 · 그날 밤 본체 방어 −20%</small></h2><div class="opts">${[0, 1, 2].map(l => { const r = NEST.raidInfo(G, v, l); return opt('raid', { v, l }, ['위협', '약탈', '초토화'][l], 0, `+${R(r.gold)}G, ${NEST.ASP[d.asp]} 정수 +${r.ess}, 공포 +${r.fear}. ` + ['매일 공물 ' + R(r.tribute) + 'G를 바치게 된다. 적의 +15', '공물이 3일 끊기고, 오늘 밤 이 마을에서 온다. 적의 +35', '마을이 사라진다. 오늘 밤 30% 더 많이 온다'][l], done); }).join('')}</div>`;
  return h;
}
function plotPanel(p) {
  const cur = G.plots[p], c = NEST.cm(G), from = NEST.VIDS.filter(v => NEST.VILL[v].plot === p).map(v => NEST.VILL[v].name).join(', ');
  return `<h2>길목 ${p + 1} <small class="mute">${NEST.PLOT[cur].name}</small></h2><p class="small mute">${from}에서 오는 무리가 이곳을 지난다.</p><h2>짓기 <small class="mute">작업 1</small></h2><div class="opts">${Object.keys(NEST.PLOT).filter(k => k !== cur).map(k => locked(k) ? opt('plot', { p, v: k }, NEST.PLOT[k].name, 0, lockText(k), true) : opt('plot', { p, v: k }, NEST.PLOT[k].name, NEST.PLOT[k].cost * c, NEST.PLOT[k].desc + (k === 'garden' ? ` (${8 * c}G)` : ''))).join('')}</div>`;
}
function spotPanel() {
  const sp = G.spot; if (!sp) return '<p class="mute">이미 사라졌다.</p>';
  return `<h2>${NEST.SPOT[sp.type].name} <small class="mute">${sp.left}일 뒤 사라진다 · 행동 1</small></h2><p>${esc(NEST.SPOT[sp.type].text)}</p><div class="opts">${NEST.spotOptions(G).map((o, i) => opt('spot', { i }, o.label, 0, o.desc, G.ap <= 0)).join('')}</div>${G.ap <= 0 ? '<p class="small warnc">오늘은 행동이 남지 않았다.</p>' : ''}`;
}
function overview() {
  const by = {}; G.kin.forEach(m => { const k = m.loc === null ? 'bench' : m.loc; (by[k] = by[k] || []).push(m); });
  const keys = Object.keys(by).sort((a, b) => (a === 'bench' ? -1 : b === 'bench' ? 1 : 0));
  const starLine = G.star && G.star !== 'none' ? `<p class="small"><span class="chip on">${NEST.STAR[G.star].name}</span> ${esc(NEST.STAR[G.star].desc)}</p>` : '';
  return `<h2>둥지</h2>${starLine}${G.tut == null ? `<div class="row only-m guide">${echoImg(32)}<p class="grow small"><b class="coin">잔향</b> ${esc(guideLine())}</p></div>` : ''}<p class="small mute only-pc">지도에서 칸, 마을, 길목을 누르면 여기에 할 수 있는 일이 나온다. <kbd>Tab</kbd> 지상·지하 전환, <kbd>E</kbd> 밤 맞기, <kbd>Esc</kbd> 선택 해제.</p><p class="small mute only-m">지도의 칸·마을·길목을 누르면 여기에 할 일이 나온다. 지도는 좌우로 밀어서 본다.</p>
    <div class="card"><div class="slime-top sm">${slimeImg(G.slime, 64)}<div class="stack"><p class="h3">${esc(NEST.formName(G))} <small class="mute">${STAGE_NAME[G.slime.stage]}</small></p>${bar(G.slime.hp / NEST.slimeStats(G).hp)}<div class="row">${NEST.ASPECTS.filter(a => G.slime.ess[a] > 0).map(a => aspChip(a, NEST.ASP[a] + ' ' + G.slime.ess[a])).join('')}</div><div class="row">${btn('sel', { t: 'cell', i: NEST.CORE }, '본체 보기', 'sm')}</div></div></div></div>
    <h2>권속 <small class="mute">${G.kin.length}명 · 하루 급여 ${R(G.kin.reduce((a, m) => a + NEST.salary(G, m), 0))}G · 시설 유지 ${R(NEST.upkeep(G))}G</small></h2>
    ${keys.map(k => `<p class="small ${k === 'bench' ? 'warnc' : 'mute'}">${k === 'bench' ? '대기 (싸우지 않는다)' : esc(locName(k === 'core' ? 'core' : +k))}</p><div class="units">${by[k].map(kinChip).join('')}</div>`).join('') || '<p class="mute small">아직 아무도 없다. 아침마다 지원자가 찾아온다.</p>'}`;
}
function view() {
  const s = UI.sel; let h;
  if (!s) h = overview(); else if (s.t === 'cell') h = cellPanel(s.i); else if (s.t === 'vill') h = villPanel(s.v); else if (s.t === 'spot') h = spotPanel(); else h = plotPanel(s.p);
  $('view').innerHTML = h;
  $('foot').innerHTML = `${UI.confirmEnd ? `<p class="small warnc">행동이 ${G.ap} 남았다. 남기면 본체가 그만큼 쉰다. 한 번 더 누르면 밤이 된다.</p>` : ''}<button class="btn pri big" data-a="endday">${NEST.isSettle(G) ? '달이 기우는 밤을 맞는다' : '밤을 맞는다'} <kbd>E</kbd></button>`;
}
function render() {
  if (!G) return; checkFeats(); hud(); tray(); view(); coach(); if (UI.featMsg && ST.mode === 'day' && $('modal').hidden) toast(null);
  META.codex.forms[NEST.formId(G)] = 1; G.slime.muts.forEach(m => { META.codex.muts[m] = 1; });
  document.documentElement.style.setProperty('--route', G.slime.main ? ASPCOL[G.slime.main] : '#e8c030');
}

// ---------- 창 ----------
let modalRes = null, modalKind = null;
function modal(html, wide, kind) { modalKind = kind || null; $('modal').innerHTML = `<div class="sheet${wide ? ' wide' : ''}">${html}</div>`; $('modal').hidden = false; $('modal').scrollTop = 0; return new Promise(res => { modalRes = res; }); }
function closeModal(v) { $('modal').hidden = true; $('modal').innerHTML = ''; modalKind = null; const r = modalRes; modalRes = null; if (r) r(v); }
const closeBtn = label => `<div class="row end">${btn('close', null, label || '닫기')}</div>`;
function applicantsHtml() {
  if (!G.applicants.length) return `<h2>지원자</h2><p class="mute">오늘은 더 없다. 내일 아침 새 얼굴이 온다.</p>${closeBtn()}`;
  return `<h2>둥지를 찾아온 것들</h2><p class="small mute">들이는 데 행동은 들지 않는다. 지은 시설에 따라 찾아오는 얼굴이 달라진다. 안 들인 지원자는 내일 떠난다.</p><div class="pick3">${G.applicants.map((a, i) => {
    const d = NEST.KIN[a.kind], cost = NEST.acceptCost(G, a), slot = NEST.freeSlot(G, a.kind), lv = Math.max(1, NEST.actOf(G) * 3 - 2) + (a.rare ? 2 : 0), g = Math.pow(NEST.K.lvGrowth, lv - 1) * (a.rare ? 1.4 : 1);
    return `<div class="card pcard${a.rare ? ' rare' : ''}">${kinImg(a.kind, 64)}<b class="h3">${a.rare ? '희귀 ' : ''}${d.name}</b><span class="small mute">"${esc(a.name)}" · Lv${lv}</span><span class="small">체력 ${R(d.hp * g)} · 공격 ${R(d.atk * g)} · 방어 ${R(d.df * g)}${d.satk ? ' · 정신 ' + R(d.satk * g) : ''}</span><span class="small mute">${esc(d.note || '평범하게 싸운다')}</span><span class="small mute">급여 하루 ${R(d.pay * NEST.cm(G) * (1 + 0.1 * lv))}G${d.eat ? ' + 먹이' : ''}</span><span class="small ${slot === null ? 'warnc' : 'okc'}">${slot === null ? '자리가 없어 대기하게 된다' : '→ ' + esc(locName(slot))}</span>${btn('accept', { i }, `들인다 (${cost}G)`, 'pri', G.gold < cost)}</div>`;
  }).join('')}</div>${closeBtn('나중에')}`;
}
function captivesHtml() {
  if (!G.prison.length) return `<h2>포로</h2><p class="mute">남은 포로가 없다.</p>${closeBtn()}`;
  return `<h2>포로 <small class="mute">${G.prison.length}/${NEST.prisonCap(G)} · 하루 밥값 한 명당 ${NEST.cm(G)}G</small></h2><p class="small mute">정신이 꺾여 무릎 꿇은 자들이다. 처분에 행동은 들지 않는다.</p><div class="stack">${G.prison.map((p, i) => {
    const d = NEST.INV[p.kind];
    return `<div class="card cap">${invImg(p.kind, 48)}<div class="stack grow"><p><b class="h3">${d.name}</b> ${aspChip(d.asp)} <small class="mute">${p.vill ? NEST.VILL[p.vill].name : ''}</small></p><div class="opts">${opt('dispose', { i, how: 'ransom' }, '몸값', 0, `+${NEST.ransomOf(G, p.kind, (p.bonus || 1) * (p.vill === 'gaet' ? 1.5 : 1))}G. 그 마을의 적의 −5`)}${opt('dispose', { i, how: 'sacrifice' }, '제물', 0, `${NEST.ASP[d.asp]} 정수 +${NEST.sacEss(G, p.kind)}, 신앙 +${d.g}, 변이 ${Math.round(NEST.mutChance(G, p.kind) * 100)}%, 공포 +${d.g * 2}`)}${opt('dispose', { i, how: 'convert' }, '개종', 0, `성공 ${Math.round(NEST.convertChance(G, p.kind) * 100)}%: ${NEST.KIN[NEST.convertKind(p.kind)].name}이(가) 된다. 실패하면 달아난다`)}</div></div></div>`;
  }).join('')}</div>${closeBtn()}`;
}
function guestHtml() {
  const g = NEST.GUEST[G.guest.type], o = NEST.guestOptions(G);
  return `<h2>오늘 밤 손님 · ${esc(g.name)}</h2><p>${esc(g.text)}</p><p class="small mute">오늘 밤은 침입이 없다. 고르지 않고 밤을 맞으면 맨 아래 것으로 정해진다. 행동은 들지 않는다.</p><div class="stack">${o.map((x, i) => `<button class="btn opt" data-a="guest" data-i="${i}"${x.why || x.cost > G.gold ? ' disabled' : ''}><b>${esc(x.label)}${x.cost ? ` <span class="coin">${x.cost}G</span>` : ''}</b><span class="small mute">${esc(x.why || x.desc)}</span></button>`).join('')}</div>${closeBtn('나중에')}`;
}
const comboHint = (i, t) => { for (const id in NEST.COMBO) { const c = NEST.COMBO[id], near = k => NEST.nbrs(i).some(j => j !== i && G.cells[j].dug && G.cells[j].type === k); if ((c.a === t && near(c.b)) || (c.b === t && near(c.a))) return META.codex.combos[id] ? ' ★ 조합 「' + c.name + '」: ' + c.desc : ' ★ 옆 시설과 맞물려 무언가가 된다'; } return ''; };
function eventHtml() {
  const e = NEST.EVENTS[G.event.id], o = NEST.eventOptions(G);
  return `<h2>${esc(e.title)}</h2><p>${esc(e.text)}</p><div class="stack">${o.map((x, i) => `<button class="btn opt" data-a="event" data-i="${i}"${x.why || x.cost > G.gold ? ' disabled' : ''}><b>${esc(x.label)}${x.cost ? ` <span class="coin">${x.cost}G</span>` : ''}</b>${x.why ? `<span class="small mute">${esc(x.why)}</span>` : ''}</button>`).join('')}</div>`;
}
function kinHtml(id) {
  const m = G.kin.find(x => x.id === id); if (!m) return `<p class="mute">떠난 권속이다.</p>${closeBtn()}`;
  const d = NEST.KIN[m.kind], s = NEST.kinStats(G, m), cap = NEST.capacity(G);
  const slots = Object.keys(cap).map(k => k === 'core' ? k : +k).filter(k => k !== m.loc && (m.kind === 'spawn' || G.kin.filter(x => x.loc === k && x.kind !== 'spawn').length < cap[k]));
  return `<div class="merc${m.rare ? ' rare' : ''}">${kinImg(m.kind, 64, m.evo)}<div class="body"><h2>${esc(m.name)} <small class="mute">${m.rare ? '희귀 ' : ''}${NEST.kinName(m)} · Lv${m.lv}${m.legacy ? ' · 지난 판에서 옴' : ''}</small></h2><div class="xp"><i style="width:${Math.min(100, m.exp / NEST.expNeed(m.lv) * 100)}%"></i></div><p class="small">체력 ${R(s.hp)} · 공격 ${R(s.atk)} · 방어 ${R(s.df)}${s.satk ? ' · 정신 공격 ' + R(s.satk) : ''} · 급여 ${R(NEST.salary(G, m))}G${d.eat ? ' + 먹이' : ''}</p><p class="small mute">${esc(d.note || '')}</p><p class="small">지금: <b>${esc(locName(m.loc))}</b>${m.hurt ? ' · <span class="up">부상 (' + m.hurt + '일 쉼, 휴식하면 바로 복귀)</span>' : ''}${m.strike ? ' · <span class="warnc">급여를 못 받아 오늘 밤 쉰다</span>' : ''}</p></div></div>
    ${d.skills.length ? '<h2>스킬 <small class="mute">하나만 쓴다</small></h2>' : ''}<div class="opts">${d.skills.map((k, i) => `<button class="btn opt${m.skill === i ? ' on' : ''}" data-a="skill" data-id="${m.id}" data-i="${i}"${m.lv < NEST.SKILL_LV[i] ? ' disabled' : ''}><b>${esc(k[0])} <small class="mute">Lv${NEST.SKILL_LV[i]}</small></b><span class="small mute">${esc(k[1])}</span></button>`).join('')}</div>
    ${m.kind !== 'spawn' ? `<h2>방침</h2><div class="row">${btn('stance', { id: m.id, v: 'careful' }, '신중 (체력 30%에서 물러남)', 'sm' + (m.stance !== 'hold' ? ' on' : ''))}${btn('stance', { id: m.id, v: 'hold' }, '사수 (끝까지 싸움)', 'sm' + (m.stance === 'hold' ? ' on' : ''))}</div>` : ''}
    ${m.kind === 'spawn' ? `<h2>진화</h2><p class="small ${m.evo ? 'okc' : 'mute'}">${m.evo ? '큰 움으로 자랐다. 능력치 1.5배.' : '나흘을 살아남으면 저절로 큰 움으로 자란다. 지금 ' + (m.age || 0) + '일째.'}</p>` : NEST.EVO[m.kind] ? `<h2>진화</h2>${m.evo ? `<p class="small okc"><b>${NEST.EVO[m.kind]}</b> — ${esc(NEST.EVO_DESC[m.kind])}. 능력치·급여 1.5배.</p>` : `<div class="row">${btn('kinevo', { id: m.id }, `${NEST.EVO[m.kind]}(으)로 진화 (${NEST.evoCost(G)}G)`, 'sm pri', m.lv < 5 || G.gold < NEST.evoCost(G))}${kinImg(m.kind, 42, true)}<span class="small mute">${m.lv < 5 ? '레벨 5부터. 지금 Lv' + m.lv : '<b class="okc">' + esc(NEST.EVO_DESC[m.kind]) + '.</b> 능력치와 급여도 1.5배가 된다. 행동은 들지 않는다'}</span></div>`}` : ''}
    <h2>옮기기 <small class="mute">작업 1</small></h2><div class="row">${slots.map(k => btn('place', { id: m.id, loc: k }, esc(locName(k)), 'sm')).join('') || '<span class="small mute">빈 자리가 없다. 초소나 대기실을 지어야 한다.</span>'}${m.loc !== null ? btn('place', { id: m.id, loc: 'bench' }, '대기로 빼기', 'sm') : ''}</div>
    <div class="row end">${btn('dismiss', { id: m.id }, '내보낸다', 'sm bad')}${btn('close', null, '닫기')}</div>`;
}
function rosterHtml() { return `<h2>권속 ${G.kin.length}명</h2><p class="small mute">눌러서 스킬, 방침, 자리를 바꾼다.</p><div class="units">${G.kin.map(m => kinChip(m).replace('</span></button>', ` · ${esc(locName(m.loc))}</span></button>`)).join('') || '<span class="mute">없음</span>'}</div>${closeBtn()}`; }
const omenLines = om => `${om.tier !== 'bane' ? `<p class="okc small">＋ ${esc(NEST.OMEN[om.id].boon)}</p>` : ''}${om.tier !== 'boon' ? `<p class="${om.calmed ? 'mute' : 'up'} small">－ ${esc(NEST.OMEN[om.id].bane)}${om.calmed ? ' (달랬다)' : ''}</p>` : ''}`;
function elderHtml() {
  const e = NEST.ELDER[G.eld.id], f = G.eld.favor, col = ASPCOL[G.eld.id], om = G.omen, live = om && om.tier !== 'boon' && !om.calmed, tl = G.eld.tally;
  return `<h2 style="color:${col}">「${e.name}」 <small class="mute">이번 판을 지켜보는 옛 것</small></h2><p class="mute">${esc(e.text)} 밤이 지날 때마다 뒤척이고, 그 바람에 다음 날의 규칙이 하나 바뀐다.</p>
    <div class="row"><span>눈길</span><span class="favor">${[-3, -2, -1, 0, 1, 2, 3].map(v => `<i class="${v === f ? 'now' : ''}${v <= -2 ? ' bad' : v >= 2 ? ' good' : ''}"></i>`).join('')}</span><span class="small ${f >= 2 ? 'okc' : f <= -2 ? 'up' : 'mute'}">${f >= 2 ? '마음에 들어 한다 — 징조의 좋은 쪽만 온다' : f <= -2 ? '눈 밖에 났다 — 나쁜 쪽만 온다' : '지켜보는 중 — 좋은 쪽과 나쁜 쪽이 함께 온다'}</span></div>
    <p class="small">좋아하는 짓: ${e.likes.map(a => `<span class="chip good">${NEST.ACT_NAME[a]}</span>`).join(' ')}</p><p class="small">싫어하는 짓: ${e.hates.map(a => `<span class="chip fake">${NEST.ACT_NAME[a]}</span>`).join(' ')}</p>
    <p class="small mute">눈길은 하루에 한 칸만 움직인다. 오늘 한 짓: ${tl > 0 ? '<span class="okc">좋게 보고 있다</span>' : tl < 0 ? '<span class="up">못마땅해한다</span>' : '아직 별 반응이 없다'}. 마지막 밤, 눈길이 끝에 가 있으면 그것이 네 편을 들거나 봉인단 편을 든다.</p>
    ${om ? `<div class="card" style="background:var(--panel2)"><p class="h3">오늘의 징조 · ${NEST.OMEN[om.id].name}</p>${omenLines(om)}${live ? `<div class="row">${btn('calm', null, `신앙 ${NEST.CALM_COST}을 바쳐 나쁜 쪽을 달랜다`, 'pri', G.faith < NEST.CALM_COST)}<span class="small mute">지금 신앙 ${Math.floor(G.faith)}</span></div>` : ''}</div>` : '<p class="mute">오늘은 조용하다.</p>'}${closeBtn()}`;
}
function openModal(kind) {
  if (kind === 'elder') return modal(elderHtml(), false, kind);
  if (kind === 'guest') return G.guest ? modal(guestHtml(), false, kind) : Promise.resolve();
  const html = kind === 'applicants' ? applicantsHtml() : kind === 'captives' ? captivesHtml() : kind === 'event' ? eventHtml() : kind === 'roster' ? rosterHtml() : kind.startsWith('kin:') ? kinHtml(+kind.slice(4)) : '';
  return modal(html, kind === 'applicants' || kind === 'captives' || kind === 'roster', kind);
}
function refreshModal() { if (!modalKind || $('modal').hidden) return; const k = modalKind, r = modalRes; if ((k === 'event' && !G.event) || (k === 'guest' && !G.guest)) return closeModal(); const top = $('modal').scrollTop; openModal(k); modalRes = r; $('modal').scrollTop = top; }
function settleHtml(b, st, day) {
  const L = st.ledger || {}, rows = Object.keys(L).filter(k => Math.round(L[k])).map(k => `<span>${esc(k)}</span><span class="num ${L[k] >= 0 ? 'coin' : 'up'}">${L[k] >= 0 ? '+' : ''}${R(L[k])}</span>`).join(''), tot = Object.values(L).reduce((a, x) => a + x, 0);
  let h = `<h2>${day}일째 밤이 지났다</h2>`;
  if (b) h += `<div class="card"><p class="h3 ${b.result === 'repel' ? 'okc' : 'up'}">${{ repel: '격퇴', stolen: b.spared ? '잔향이 막아 주었다' : '금고를 털렸다', core: '본체가 쓰러졌다' }[b.result]} <small class="mute">${NEST.VILL[b.vill].name} · ${b.gname} ${b.count}명</small></p><p class="small">쓰러뜨림 ${b.kills} · 무릎 꿇음 <b style="color:#c8a8ff">${b.captives.length}</b> · 미쳐 달아남 ${b.fled}${b.gold ? ` · 소지금 <span class="coin">+${R(b.gold)}G</span>` : ''}${b.loot ? ` · <span class="up">털림 −${R(b.loot)}G</span>` : ''}</p>${b.hurt.length ? `<p class="small up">부상: ${esc(b.hurt.join(', '))} (이틀 쉼)</p>` : ''}${b.off.length ? `<p class="small warnc">뒤집힌 곁방: ${b.off.map(i => NEST.ROOM[G.cells[i].type].name).join(', ')}</p>` : ''}</div>`;
  else h += '<p class="mute">아무도 오지 않았다.</p>';
  h += `<div class="ledger">${rows || '<span class="mute">드나든 재물 없음</span><span></span>'}<span class="tot">하루 합계</span><span class="tot num ${tot >= 0 ? 'coin' : 'up'}">${tot >= 0 ? '+' : ''}${R(tot)}G</span></div>`;
  if (st.faith) h += `<p class="small" style="color:#c8a8ff">신앙 +${st.faith}</p>`;
  if (Object.keys(st.ess || {}).length) h += `<p class="small">시설에서 정수: ${Object.keys(st.ess).map(a => aspChip(a, NEST.ASP[a] + ' +' + st.ess[a])).join(' ')}</p>`;
  if (st.omen && G.eld) h += `<div class="card" style="background:var(--panel2)"><p class="h3" style="color:${ASPCOL[G.eld.id]}">「${NEST.ELDER[G.eld.id].name}」이(가) 뒤척인다${st.favor > 0 ? ' <small class="okc">눈길 +1</small>' : st.favor < 0 ? ' <small class="up">눈길 −1</small>' : ''}</p><p>내일의 징조 · <b>${NEST.OMEN[st.omen.id].name}</b></p>${omenLines(st.omen)}</div>`;
  if (UI.featNew && UI.featNew.length) { h += `<div class="stack">${UI.featNew.map(f => `<p class="okc small">새 흔적 「${f[1]}」 — ${f[3]}${f[3] === '별가루' ? ' +15' : ' 열림'}</p>`).join('')}</div>`; UI.featNew = []; UI.featMsg = ''; }
  if (st.notes.length) h += `<div class="stack">${st.notes.map(n => `<p class="small warnc">${esc(n)}</p>`).join('')}</div>`;
  if (st.evoCheck) h += `<div class="card"><p class="h3">달이 기울었다</p>${st.evoCheck.ate ? `<p class="small">남은 먹이를 모두 삼켰다: ${esc(st.evoCheck.ate)}</p>` : ''}<p>정수 ${st.evoCheck.tot} / ${st.evoCheck.need} — ${st.evolved ? '<b class="okc">허물을 벗는다!</b>' : '<span class="up">모자라다. 이번에는 변하지 못했다.</span>'}</p></div>`;
  return h + `<div class="row end">${btn('close', null, G.over ? '계속' : st.evolved ? '변한다' : '아침을 맞는다', 'pri big')}</div>`;
}
function evoHtml(st, before) {
  const sl = G.slime, lines = [];
  if (sl.stage === 1) { lines.push(NEST.FORM1[sl.main].skill); lines.push('손 주문 「' + NEST.FORM1[sl.main].spell[0] + '」: ' + NEST.FORM1[sl.main].spell[2]); lines.push(NEST.ASP[sl.main] + ' 징조 전용 시설과 영역을 지을 수 있다'); }
  if (sl.stage === 2) { lines.push(NEST.FORM2UP[sl.main]); lines.push(NEST.ASP[sl.sub] + ' 섞임: ' + NEST.SUBTRAIT[sl.sub]); }
  if (sl.stage === 3) lines.push('몸 밖으로 무언가가 뻗어 나온다. 체력·공격·방어가 크게 오른다');
  if (sl.stage === 4) lines.push('다 자랐다. 굴 하나가 몸으로 가득 찬다. 체력·공격·방어가 다시 크게 오른다');
  return `<div class="evo stack" style="align-items:center;text-align:center"><p class="mute">${STAGE_NAME[sl.stage]}</p><div class="row" style="justify-content:center;gap:24px">${slimeImg(before, 64, '이전 모습')}<span class="h3 mute">→</span>${slimeImg(sl, 128, NEST.formName(G))}</div><h2 style="font-size:32px;color:${ASPCOL[sl.main]}">${esc(NEST.formName(G))}</h2><div class="row" style="justify-content:center">${aspChip(sl.main, '주 ' + NEST.ASP[sl.main])}${sl.sub ? aspChip(sl.sub, '부 ' + NEST.ASP[sl.sub]) : ''}</div><div class="stack">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>${st.mut ? `<p>${aspChip(NEST.MUT[st.mut].asp, '변이: ' + NEST.MUT[st.mut].name)} <span class="small">${esc(NEST.MUT[st.mut].desc)}</span></p>` : ''}<p class="small up">인간들 사이에 소문이 돈다. 공포 +10</p></div><div class="row end">${btn('close', null, '좋다', 'pri big')}</div>`;
}
function resultHtml(sc, unlocked) {
  const win = G.over.win, av = NEST.avatarOf(G), key = !win ? null : NEST.endKey(G), tier = endTier(sc.grade), e3 = win && ENDING3[key] ? ENDING3[key][tier] : null;
  const endText = !win ? '' : e3 ? `<p class="h3 coin">결말 · ${e3[0]}</p><p class="endtxt">${esc(e3[1])}</p><p class="small mute">${['점수가 더 높으면 이 일은 더 멀리 번진다.', '점수가 더 높으면 이 일은 끝까지 간다.', '이 모습으로 갈 수 있는 가장 먼 곳.'][tier]}</p>` : `<p class="endtxt">${esc(ENDING[key])}</p>`;
  return `<div class="stack" style="align-items:center;text-align:center"><p class="mute">${win ? '별이 서는 밤을 넘겼다' : esc(G.over.why)} · ${G.day}일 · ${NEST.DIFF[G.diff].name}</p>${win && G.slime.main ? '<canvas id="endcv" class="px" width="192" height="108"></canvas>' : slimeImg(G.slime, 128)}<h2 style="font-size:30px">${win ? esc(av) : esc(NEST.formName(G))}</h2>${endText}<div class="grade">${sc.grade}</div><p class="coin h3">${R(sc.total)}점</p><div class="row">${echoImg(40)}<p>${esc(GRADE_SAY[sc.grade])}</p></div></div>
    <div class="ledger">${sc.parts.filter(p => p[1]).map(p => `<span>${p[0]}</span><span class="num">${R(p[1])}</span>`).join('')}<span class="tot">배수 (${NEST.DIFF[G.diff].name}${win ? '' : ' · 실패'})</span><span class="tot num">×${sc.mult.toFixed(2)}</span></div>
    <p class="coin">별가루 +${UI.dustGain || 0} <small class="mute">(타이틀의 명부에서 권속을 부르는 데 쓴다)</small></p>${(UI.grown || []).map(g => `<p class="okc small">명부의 권속이 자랐다: ${esc(g)}</p>`).join('')}${unlocked.map(u => `<p class="okc">새로 열림: ${esc(u)}</p>`).join('')}<div class="row end">${btn('share', { v: `옛 것의 둥지 · ${win ? av : NEST.formName(G)} · ${sc.grade} ${R(sc.total)}점 · ${G.day}일` }, '기록 복사')}${btn('close', null, '다음', 'pri big')}</div>`;
}
function legacyHtml(pickd) {
  const ks = G.kin.filter(m => m.kind !== 'spawn' && !m.rid);
  return `<h2>명부에 올릴 권속</h2><p class="small mute">${UI.legacyMax}명까지 명부에 올린다 (명부 ${META.roster.length}/${ROSTER_MAX}). 레벨은 절반이 되고, 다음 판부터 데려갈 수 있다.</p><div class="units">${ks.map(m => `<button class="unit${pickd.includes(m.id) ? ' on' : ''}" data-a="legacy" data-id="${m.id}">${kinImg(m.kind, 32)}<span>${esc(m.name)} <small class="mute">${NEST.KIN[m.kind].name} Lv${m.lv} → ${Math.min(ROSTER_LV, Math.max(1, Math.ceil(m.lv / 2)))}</small></span></button>`).join('')}</div><div class="row end">${btn('close', null, pickd.length ? '이들을 올린다' : '아무도 올리지 않는다', 'pri')}</div>`;
}
// ---------- 명부, 별똥별, 기록 ----------
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const TIER = { N: '일반', R: '희귀', L: '전설' }, ROSTER_MAX = 12, ROSTER_LV = 8, DRAW_COST = 100;
const TITLES = ['목쉰', '외눈', '웃는', '말 없는', '늙은', '굶주린', '두 번 죽은', '맨 처음의'], RNAMES = ['구르', '뼈다귀', '삐약', '덜컹', '쿵쿵', '모락', '찰랑', '반짝', '투덜', '꼬물', '바삭', '철컥', '낼름', '휘릭', '뚱땅', '사각'];
const rosterName = r => (r.title ? r.title + ' ' : '') + r.name, rnd = a => a[Math.floor(Math.random() * a.length)];
function drawOnce(free) {
  const r = Math.random(), full = META.roster.length >= ROSTER_MAX;
  if ((free && r < 0.5) || full) { const d = 30 + Math.floor(Math.random() * 31); META.dust += d; return { dust: d }; }
  const q = free ? (r - 0.5) * 2 : r, tier = q < 0.03 ? 'L' : q < 0.25 ? 'R' : 'N', lv = { N: 2, R: 4, L: 6 }[tier];
  const pool = tier === 'N' ? ['goblin', 'skeleton', 'cultist'] : tier === 'R' ? ['goblin', 'skeleton', 'cultist', 'scale', 'scribe', 'mask', 'hunger'] : ['scale', 'scribe', 'mask', 'hunger'];
  const k = { rid: META.rid++, name: rnd(RNAMES), kind: rnd(pool), lv, rare: tier !== 'N', tier, title: tier === 'L' ? rnd(TITLES) : '', skill: lv >= 4 ? 1 : 0, stance: 'careful', runs: 0 };
  META.roster.push(k); return k;
}
function barracksHtml(res) {
  const free = META.lastDraw !== today(), full = META.roster.length >= ROSTER_MAX;
  return `<h2>명부 <small class="mute">${META.roster.length}/${ROSTER_MAX} · 별가루 <b class="coin">${R(META.dust)}</b></small></h2>
    <p class="small mute">명부의 권속은 판이 끝나도 남는다. 새 판에 둘까지 데려갈 수 있고, 살아 돌아오면 자란다(최대 Lv${ROSTER_LV}). 판을 끝낼 때 살아남은 권속을 명부에 올릴 수 있다. 별가루는 판을 끝낼 때마다 점수에 따라 받는다.</p>
    ${res ? `<div class="card evo" style="align-items:center;text-align:center">${res.dust ? `<p class="h3 coin">별가루 +${res.dust}</p>` : `${kinImg(res.kind, 64)}<p class="h3"><span class="chip ${res.tier === 'L' ? 'on' : ''}">${TIER[res.tier]}</span> ${esc(rosterName(res))}</p><p class="small mute">${NEST.KIN[res.kind].name} · Lv${res.lv}</p>`}</div>` : ''}
    <div class="row">${btn('draw', { v: 'free' }, free ? '오늘의 별똥별 (하루 한 번, 무료)' : '오늘의 별똥별은 이미 받았다', 'pri', !free)}${btn('draw', { v: 'dust' }, `별가루로 부른다 (${DRAW_COST})`, '', META.dust < DRAW_COST || full)}</div>
    <p class="small mute">오늘의 별똥별: 별가루 50% · 일반 37.5% · 희귀 11% · 전설 1.5%. 별가루로 부르기: 일반 75% · 희귀 22% · 전설 3%.${full ? ' 명부가 가득 차서 지금은 권속 대신 별가루가 나온다.' : ''}</p>
    <div class="stack">${META.roster.map(r => `<div class="row rrow">${kinImg(r.kind, 40, r.evo)}<span class="grow"><b class="h3">${esc(rosterName(r))}${r.evo ? ' ★' : ''}</b> <span class="chip ${r.tier === 'L' ? 'on' : ''}">${TIER[r.tier || 'N']}</span><br><small class="mute">${NEST.KIN[r.kind].name} · Lv${r.lv} · 함께한 판 ${r.runs || 0}</small></span>${btn('release', { id: r.rid }, '보낸다 (+20)', 'sm')}</div>`).join('') || '<p class="mute">아직 아무도 없다. 오늘의 별똥별을 받아 보거나, 판을 끝낼 때 살아남은 권속을 올린다.</p>'}</div>${closeBtn()}`;
}
// 함께 보는 순위: 게시된 링크에서 로그인한 사람끼리만 (파일로 열면 꺼진다)
let CLOUD = null;
async function initCloud() { try { if (!window.claude || !window.claude.use) return; const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); if (!db || !user) return; const uid = await user.id(); if (uid) CLOUD = { db, user, uid }; } catch (e) { /* 연결 없음 */ } }
async function cloudSubmit(sc, win) {
  if (!CLOUD) return;
  try { const ref = CLOUD.db.doc('scores/' + CLOUD.uid), cur = await ref.get(), old = cur.exists ? cur.data() : null; if (!old || sc.total > (+old.score || 0)) await ref.set({ score: sc.total, grade: sc.grade, form: win ? NEST.avatarOf(G) : NEST.formName(G), day: G.day, diff: G.diff, win: !!win, at: Date.now() }); } catch (e) { /* 못 올려도 게임은 계속 */ }
}
async function fillCloudBoard() {
  const el = $('cloudboard'); if (!el || !CLOUD) return; const timer = setTimeout(() => { const e = $('cloudboard'); if (e && e.dataset.wait) e.innerHTML = '<span class="mute">불러오지 못했다.</span>'; }, 10000); el.dataset.wait = 1;
  try {
    const snap = await CLOUD.db.collection('scores').orderBy('score', 'desc').limit(20).get(), rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data())), ps = await CLOUD.user.profiles(rows.map(r => r.id));
    clearTimeout(timer); const e = $('cloudboard'); if (!e) return; delete e.dataset.wait;
    e.innerHTML = rows.map((r, i) => `<span class="num">${i + 1}</span><span>${r.id === CLOUD.uid ? '<b class="coin">나</b> ' : ''}${esc((ps[r.id] && ps[r.id].name) || '누군가')} <small class="mute">${esc(String(r.form || '').slice(0, 24))} · ${+r.day || 0}일${r.win ? '' : ' · 실패'}</small></span><b class="coin">${esc(String(r.grade || '').slice(0, 3))}</b><span class="num">${R(+r.score || 0)}</span>`).join('') || '<span class="mute">아직 아무도 올리지 않았다. 한 판을 끝내면 최고 점수가 올라간다.</span>';
  } catch (err) { clearTimeout(timer); const e = $('cloudboard'); if (e) e.innerHTML = '<span class="mute">불러오지 못했다.</span>'; }
}
function recordsHtml() {
  return `<h2>내 기록 <small class="mute">판 ${META.runs} · 깨어남 ${META.clears}</small></h2><div class="board">${META.board.map((b, i) => `<span class="num">${i + 1}</span><span>${esc(b.form)} <small class="mute">${b.day}일 · ${NEST.DIFF[b.diff].name}${b.win ? '' : ' · 실패'}</small></span><b class="coin">${b.grade}</b><span class="num">${R(b.total)}</span>`).join('') || '<span class="mute">아직 기록이 없다.</span>'}</div>
    <h2>흔적 <small class="mute">${FEATS.filter(f => META.feats[f[0]]).length}/${FEATS.length} · 하나에 별가루 +15</small></h2><div class="stack">${FEATS.map(f => META.feats[f[0]] ? `<p class="small"><span class="chip on">${f[1]}</span> ${f[3]}</p>` : `<p class="small mute"><span class="chip">${f[1]}</span> ${f[2]} → ${f[3]}</p>`).join('')}</div>
    <h2>함께 보는 순위</h2><div id="cloudboard" class="board"><span class="mute">${CLOUD ? '불러오는 중…' : '게시된 링크를 공유받아 로그인한 사람들끼리 최고 점수를 겨룬다. 지금은 연결되지 않았다(파일로 열었거나 로그인하지 않았다).'}</span></div>${closeBtn()}`;
}
const SHARD_NEED = { abyss: 0, brood: 0, hunger: 0, dusk: 0, nebula: 0 };
function setupHtml(o) {
  return `<h2>새로운 낙하</h2><p class="small mute">떨어질 때 품고 있던 조각 하나를 고른다. 그 징조의 정수 12로 시작한다. 무엇이 될지는 결국 먹는 것이 정한다.</p><div class="pick5">${NEST.ASPECTS.map(a => { const lock = META.clears < SHARD_NEED[a]; return `<button class="btn card pcard${o.asp === a ? ' on' : ''}" data-a="setup" data-k="asp" data-v="${a}"${lock ? ' disabled' : ''}>${slimeImg({ main: a, stage: 1, muts: [] }, 48)}<b class="h3" style="color:${ASPCOL[a]}">${NEST.ASP[a]}</b><span class="small mute">${lock ? SHARD_NEED[a] + '번 깨어나면 열림' : esc(NEST.FORM1[a].skill)}</span></button>`; }).join('')}</div>
    <h2>깊이</h2><div class="row">${[1, 2, 3].map(d => btn('setup', { k: 'diff', v: d }, `${NEST.DIFF[d].name}${d > 1 ? ' (침입 ×' + NEST.DIFF[d].mult + ')' : ''}`, o.diff === d ? 'on' : '', false)).join('')}</div><p class="small mute">첫 각성에서는 12일째까지 본체가 한 번 쓰러져도 잔향이 막아 준다.</p>
    <h2>데려갈 권속 <small class="mute">${o.bring.length}/2</small></h2>${META.roster.length ? `<div class="units">${META.roster.map(r => `<button class="unit${o.bring.includes(r.rid) ? ' on' : ''}" data-a="setup" data-k="bring" data-v="${r.rid}">${kinImg(r.kind, 32)}<span>${esc(rosterName(r))} <small class="mute">${TIER[r.tier || 'N']} Lv${r.lv}</small></span></button>`).join('')}</div>` : '<p class="small mute">명부가 비어 있다. 타이틀의 "명부"에서 하루 한 번 별똥별을 받거나, 판을 끝낼 때 살아남은 권속을 올리면 여기서 둘까지 데려갈 수 있다.</p>'}
    <h2>별자리 <small class="mute">판의 규칙 하나를 바꾼다</small></h2>${true ? `<div class="opts">${Object.keys(NEST.STAR).map(k => `<button class="btn opt${o.star === k ? ' on' : ''}" data-a="setup" data-k="star" data-v="${k}"><b>${NEST.STAR[k].name}</b><span class="small mute">${esc(NEST.STAR[k].desc)}</span></button>`).join('')}</div>` : '<p class="small mute">한 판을 끝까지 하면(이기든 지든) 별자리 여섯이 열린다.</p>'}
    <div class="row">${btn('setup', { k: 'tut', v: 1 }, '길잡이 보기: ' + (o.tut ? '켬' : '끔'), o.tut ? 'on' : '')}<span class="small mute grow">켜면 첫 이틀 동안 잔향이 할 일을 하나씩 짚어 준다. 첫 밤에 작은 무리가 온다.</span></div>
    <div class="row end">${btn('close', { v: '' }, '돌아가기')}${btn('close', { v: 'go' }, '떨어진다', 'pri big')}</div>`;
}
function codexHtml() {
  const seen = META.codex.forms, node = (id, sl, name) => `<div class="node${seen[id] ? '' : ' unk'}">${slimeImg(sl, 48)}<span>${seen[id] ? esc(name) : '???'}</span></div>`;
  let h = `<h2>도감</h2><p class="small mute">본 형태 ${Object.keys(seen).length}/26 · 변이 ${Object.keys(META.codex.muts).length}/${Object.keys(NEST.MUT).length} · 깨어난 횟수 ${META.clears}</p><div class="codex">${node('base', { stage: 0, muts: [] }, '무형의 점액')}${NEST.ASPECTS.map(a => node(a, { main: a, stage: 1, muts: [] }, NEST.FORM1[a].name)).join('')}</div>`;
  NEST.ASPECTS.forEach(a => { h += `<p class="small" style="color:${ASPCOL[a]}">${NEST.ASP[a]}에서 갈라진 것</p><div class="codex">${NEST.ASPECTS.filter(b => b !== a).map(b => node(a + '_' + b, { main: a, sub: b, stage: 2, muts: [] }, NEST.FORM2[a + '_' + b])).join('')}</div>`; });
  h += `<h2>변이</h2><div class="row">${Object.keys(NEST.MUT).map(m => META.codex.muts[m] ? aspChip(NEST.MUT[m].asp, NEST.MUT[m].name) : '<span class="chip mute">???</span>').join('')}</div><h2>방 조합</h2><div class="row">${Object.keys(NEST.COMBO).map(k => META.codex.combos[k] ? `<span class="chip on">${NEST.COMBO[k].name}</span>` : '<span class="chip mute">???</span>').join('')}</div><h2>결말 <small class="mute">같은 모습이라도 점수에 따라 셋으로 갈린다</small></h2>${NEST.ASPECTS.map(a => `<p class="small"><span style="color:${ASPCOL[a]}">${NEST.ASP[a]}</span> ${ENDING3[a].map((e, i) => META.codex.ends[a + i] ? `<span class="chip on">${e[0]}</span>` : '<span class="chip mute">???</span>').join(' ')}</p>`).join('')}<h2>깨어난 모습</h2><div class="row">${Object.keys(NEST.AVATAR).map(k => META.codex.ends[k] ? `<span class="chip on">${NEST.AVATAR[k]}</span>` : '<span class="chip mute">???</span>').join('')}</div>`;
  return h + closeBtn();
}
const HELP = `<h2>어떻게 하나</h2><div class="stack">
<p><b>목표.</b> 30일 동안 본체를 지킨다. 6일마다 "달이 기우는 밤"에 큰 무리가 오고, 넘기면 모은 정수에 따라 허물을 벗는다(네 번까지). 권속도 레벨 5가 되면 재물을 들여 한 번 진화시킬 수 있다.</p>
<p><b>낮.</b> 행동은 하루 두 번. 건설 행동 한 번이면 파기·짓기·함정·옮기기 같은 작업을 세 번 한다. 포식, 휴식, 훈련, 습격은 행동 하나씩. 지원자 들이기와 포로 처분은 행동이 들지 않는다.</p>
<p><b>지하.</b> 인간은 입구에서 금고까지 가장 짧은 길(점선)로 온다. 길 위에는 싸울 자리와 함정을, 길에서 벗어난 곁방에는 감옥·예배당 같은 살림을 둔다. 칸을 파서 길을 바꿀 수 있다.</p>
<p><b>지상.</b> 다섯 마을이 길목 셋을 지나 둥지로 온다. 오늘 밤과 내일 밤 올 무리가 지도에 보인다. 2막부터 마을을 습격할 수 있다.</p>
<p><b>정신력.</b> 침입자에게는 체력(빨강)과 정신력(보라)이 있다. 정신력이 바닥나면 달아나거나, 자기 편을 치거나, 무릎을 꿇는다. 무릎 꿇은 자는 포로가 된다: 몸값, 제물, 개종.</p>
<p><b>흔적.</b> 처음 해 보는 일(첫 포로, 첫 진화…)마다 기록에 남고 별가루를 받는다. 잠긴 것은 없다. 굴을 파다 보면 묻힌 것이 나오기도 한다.</p>
<p><b>조합과 손님.</b> 어떤 시설은 맞닿게 지으면 하나처럼 움직인다(건설 목록의 ★). 가끔은 싸우러 오지 않는 밤 손님이 온다. 큰 밤의 우두머리는 판마다 다르고, 미리 보인다.</p>
<p><b>공포와 재물.</b> 둘 다 더 많고 더 강한 인간을 부른다. 강한 인간은 더 좋은 먹이이기도 하다.</p>
<p><b>징조.</b> 7일째부터 다 자란 옛 것 하나가 지켜본다. 밤이 지나면 내일의 징조가 정해져 정산 창에 뜬다. 징조는 좋은 쪽과 나쁜 쪽이 한 쌍이고, 그것이 좋아하는 짓을 하면 좋은 쪽만, 싫어하는 짓을 하면 나쁜 쪽만 온다. 나쁜 쪽은 신앙 6으로 달랠 수 있다.</p>
<p><b>밤.</b> 싸움은 알아서 한다. 달이 기우는 밤에는 싸움 직전에 멈추고 손을 쓸 수 있다: 채찍, 옮기기, 손 주문(신앙 소모). 설정에서 멈추는 때를 바꾼다.</p>
<p class="only-m"><b>휴대폰.</b> 지도는 좌우로 밀어서 보고, 지도 오른쪽 위 버튼으로 지상과 지하를 오간다. 아래 패널이 좁으면 "넓게"를 누른다. 위쪽 숫자(재물·신앙·공포…)를 누르면 뜻이 나온다.</p>
<p class="small mute only-pc">단축키: <kbd>Tab</kbd> 지상·지하 · <kbd>E</kbd> 밤 맞기 · <kbd>Esc</kbd> 닫기 · 밤에 <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 속도, <kbd>S</kbd> 건너뛰기, <kbd>Space</kbd> 그냥 둔다</p></div>`;
function settingsHtml() {
  return `<h2>설정</h2><div class="stack"><div class="row"><span class="grow">소리</span>${btn('set', { k: 'sound', v: 1 }, '켬', 'sm' + (META.sound ? ' on' : ''))}${btn('set', { k: 'sound', v: 0 }, '끔', 'sm' + (META.sound ? '' : ' on'))}</div>
    <div class="row"><span class="grow">밤에 멈춰서 손을 쓸 때</span>${[['settle', '달이 기우는 밤만'], ['always', '매일 밤'], ['never', '멈추지 않음']].map(([k, l]) => btn('set', { k: 'pause', v: k }, l, 'sm' + (META.pause === k ? ' on' : ''))).join('')}</div>
    <div class="row"><span class="grow">기록 (판 ${META.runs} · 깨어남 ${META.clears})</span>${btn('wipe', null, '모두 지우기', 'sm bad')}</div></div>${closeBtn()}`;
}

// ---------- 대사 장면 ----------
let sceneNext = null;
function scene(lines) {
  return new Promise(done => {
    let i = 0, timer = null, full = false;
    const show = () => {
      const L = lines[i], narr = L.narr;
      $('scene').innerHTML = `<div class="box${narr ? ' narr' : ''}">${narr ? '' : echoImg(96)}<div class="stack"><span class="who">${narr ? '' : '잔향'}</span><p class="txt" id="stxt"></p><p class="small mute">클릭 또는 <kbd>Space</kbd> · <button class="btn sm" data-a="sceneskip">건너뛰기</button></p></div></div>`;
      $('scene').hidden = false; let n = 0; full = false; clearInterval(timer);
      if (TOUCH) L.text = L.text.replace('Tab으로 올라가서', "지도 위 '지상' 버튼으로 올라가서");
      timer = setInterval(() => { n += 2; const el = $('stxt'); if (el) el.textContent = L.text.slice(0, n); if (n % 6 === 0) sfx('talk'); if (n >= L.text.length) { full = true; clearInterval(timer); } }, 22);
    };
    const end = () => { clearInterval(timer); $('scene').hidden = true; sceneNext = null; done(); };
    sceneNext = skipAll => { if (skipAll) return end(); if (!full) { clearInterval(timer); $('stxt').textContent = lines[i].text; full = true; return; } i++; if (i >= lines.length) end(); else show(); };
    show();
  });
}

// ---------- 흐름 ----------
let busy = false, handRes = null;
function showTitle() {
  G = null; busy = false; $('game').hidden = true; $('title').hidden = false; const run = store.get('run'), free = META.lastDraw !== today();
  $('menu').innerHTML = (run ? btn('continue', null, `이어하기 (${run.day}일째)`, 'pri') : '') + btn('new', null, '새로 떨어진다', run ? '' : 'pri') + btn('barracks', null, '명부 · 별똥별' + (free ? ' <span class="coin">●</span>' : '')) + btn('records', null, '기록 · 순위') + btn('codex', null, '도감') + btn('help', null, '도움말') + btn('settings', null, '설정');
  $('trec').textContent = META.best ? `최고 기록 ${META.best.grade} ${R(META.best.total)}점 · ${META.best.form} · 깨어남 ${META.clears}회` : '아직 기록이 없다';
}
function showGame() { $('title').hidden = true; $('game').hidden = false; ST.mode = 'day'; ST.ents = null; ST.hud = null; ST.screen = 'surface'; setScreen('under'); ST.p = 1; ST.cam = { x: 0, tx: 0 }; ST.camMem = { surface: 240, under: 0 }; UI.sel = null; setSheet(false); setNight(false); render(); }
function setNight(on) { ST.mode = on ? 'night' : 'day'; $('night').hidden = !on; $('view').hidden = on; $('foot').hidden = on; $('tray').hidden = on; $('recent').hidden = on; $('viewsw').hidden = on; if (on) { setSheet(false); $('nlog').innerHTML = ''; $('nparty').innerHTML = ''; $('hand').hidden = true; $('ntitle').textContent = G.day + '일째 밤' + (NEST.isSettle(G) ? ' · 달이 기운다' : ''); setSpeed(META.speed || 1); } }
function setSpeed(v) { ST.speed = v; META.speed = v; document.querySelectorAll('[data-a="speed"]').forEach(b => b.classList.toggle('on', +b.dataset.v === v)); }
async function newRun() {
  const o = { asp: 'abyss', diff: 1, bring: [], star: 'none', tut: !META.tutDone && !META.board.length };
  for (;;) { const p = modal(setupHtml(o), true, null); modalKind = 'setup'; UI.setup = o; const v = await p; if (v === 'go') break; if (v === 'redraw') continue; return; }
  const legacy = META.roster.filter(r => o.bring.includes(r.rid)).map(r => ({ name: rosterName(r), kind: r.kind, lv: r.lv, skill: r.skill, rare: r.rare, stance: r.stance, rid: r.rid, evo: r.evo }));
  G = NEST.newGame((Date.now() ^ (Math.random() * 1e9)) >>> 0, o.asp, { diff: o.diff, legacy, star: o.star }); if (o.tut) { G.tut = 0; G.guest = null; G.march.tonight = { vill: 'field', settle: false, thin: true }; } META.runs++; saveMeta(); store.del('run');
  showGame(); await scene(STORY.intro); morningFlow();
}
async function morningFlow() {
  busy = true; render();
  const sc = { 7: 'act2', 13: 'act3', 19: 'act4', 25: 'act5', 30: 'last' }[G.day]; if (sc && G.sceneDay !== G.day) { G.sceneDay = G.day; await scene(STORY[sc].concat(G.day === NEST.OMEN_DAY && G.eld ? [E_('그리고 하나 더. 네가 허물 벗는 걸 「' + NEST.ELDER[G.eld.id].name + '」이(가) 봤어. 너보다 훨씬 먼저 다 자란 옛 것이야.'), E_('밤마다 그것이 뒤척이면 다음 날의 규칙이 하나 바뀐다. 좋아하는 짓을 하면 좋은 쪽만, 싫어하는 짓을 하면 나쁜 쪽만 와. 나쁜 쪽은 신앙을 바치면 달랠 수 있어.')] : [])); }
  saveRun(); busy = false; render();
  if (G.event) await openModal('event');
  if (G.day === 1 && G.applicants.length === 3 && !G.kin.length && G.tut == null) openModal('applicants');
}
function askHand(ctx) {
  const mode = META.pause; if (ST.skip || mode === 'never' || (mode === 'settle' && !ctx.settle)) return Promise.resolve({ k: 'none' });
  ST.focus = locIdx(ctx.cell); camTo(cellRect(ST.focus).x + CW / 2); const sp = ctx.spell;
  $('hand').innerHTML = `<p class="h3">손을 쓸까? <small class="mute">남은 개입 ${ctx.hands} · 신앙 ${Math.floor(ctx.faith)}</small></p><p class="small mute">${esc(locName(ctx.cell))} · 적 ${ctx.enemies}명이 들어섰다</p><div class="stack">${btn('hand', { k: 'whip' }, '채찍 — 이 방 아군 공격 +30%')}${sp ? btn('hand', { k: 'spell' }, `주문 「${sp.name}」 — 신앙 ${sp.cost}`, '', !sp.ok) : ''}${ctx.from.map(f => btn('hand', { k: 'move', from: f }, `옮기기 — ${esc(locName(f))}의 권속을 이 방으로`)).join('')}${btn('hand', { k: 'none' }, '그냥 둔다 <kbd>Space</kbd>', 'pri')}</div>`;
  $('hand').hidden = false; sfx('talk');
  return new Promise(res => { handRes = v => { handRes = null; $('hand').hidden = true; ST.focus = null; res(v); }; });
}
async function endDay() {
  if (busy || !G || G.over) return;
  if (G.ap > 0 && !UI.confirmEnd) { UI.confirmEnd = true; render(); return; }
  busy = true; UI.confirmEnd = false; UI.sel = null; if (!$('modal').hidden) closeModal(); toast(null);
  const day = G.day, tonight = G.march.tonight, before = { main: G.slime.main, sub: G.slime.sub, stage: G.slime.stage, muts: G.slime.muts.slice() };
  ST.hud = { gold: G.gold, faith: G.faith, fear: G.fear }; ST.skip = false; setNight(true); hud();
  const it = NEST.beginNight(G); prepareNight(); let rep = null;
  if (!tonight) { it.next(); nlog('아무도 오지 않았다.'); ST.label = '조용한 밤'; await wait(1100); ST.label = ''; }
  else {
    let r = it.next(), played = 0;
    while (!r.done) { played = await playEvents(r.value.ev, played); const ans = await askHand(r.value); r = it.next(ans); }
    rep = r.value; await playEvents(rep.ev, played); await wait(300);
  }
  const st = NEST.settle(G, rep); checkFeats();
  ST.ents = null; ST.hud = null; ST.skip = false; ST.focus = null; setNight(false); setScreen('under'); render();
  sfx(rep && rep.result !== 'repel' ? 'down' : 'coin');
  await modal(settleHtml(rep, st, day));
  if (st.evolved) { sfx('evo'); ST.flash = now() + 300; await modal(evoHtml(st, before)); }
  if (rep && rep.spared) await scene(STORY.spared);
  if (G.over) return finishRun();
  busy = false; saveRun(); morningFlow();
}
async function finishRun() {
  busy = true; store.del('run'); const win = G.over.win, sc = NEST.score(G), unlocked = [];
  await scene(win ? STORY.win : G.over.why.includes('본체') ? STORY.core : STORY.broke);
  if (win) {
    META.clears++;
    META.codex.ends[NEST.endKey(G)] = 1; if (ENDING3[NEST.endKey(G)]) META.codex.ends[NEST.endKey(G) + endTier(sc.grade)] = 1;
  }
  const form = win ? NEST.avatarOf(G) : NEST.formName(G);
  if (!META.best || sc.total > META.best.total) META.best = { total: sc.total, grade: sc.grade, form };
  META.board.push({ total: sc.total, grade: sc.grade, form, day: G.day, diff: G.diff, win, at: Date.now() }); META.board.sort((a, b) => b.total - a.total); META.board = META.board.slice(0, 10);
  UI.dustGain = Math.floor(sc.total / 100) + (win ? 20 : 0); META.dust += UI.dustGain; UI.grown = [];
  G.kin.forEach(m => { const r = m.rid && META.roster.find(x => x.rid === m.rid); if (!r) return; const lv = Math.min(ROSTER_LV, Math.max(r.lv, Math.floor((r.lv + m.lv) / 2))); if (lv > r.lv) UI.grown.push(rosterName(r) + ' Lv' + r.lv + ' → ' + lv); r.lv = lv; r.skill = m.skill; r.stance = m.stance; r.evo = r.evo || !!m.evo; r.runs = (r.runs || 0) + 1; });
  checkFeats(); (UI.featNew || []).forEach(f => unlocked.push('흔적 「' + f[1] + '」 — ' + f[3])); UI.featNew = []; UI.featMsg = '';
  saveMeta(); cloudSubmit(sc, win); sfx(win ? 'evo' : 'down');
  { const pr = modal(resultHtml(sc, unlocked), true); startEnding(sc); await pr; }
  const ks = G.kin.filter(m => m.kind !== 'spawn' && !m.rid), room = Math.min(2, ROSTER_MAX - META.roster.length);
  if (ks.length && room > 0) {
    const pickd = []; UI.legacy = pickd; UI.legacyMax = room; for (;;) { const p = modal(legacyHtml(pickd), true); modalKind = 'legacy'; const v = await p; if (v !== 'redraw') break; }
    ks.filter(m => pickd.includes(m.id)).forEach(m => { const lv = Math.min(ROSTER_LV, Math.max(1, Math.ceil(m.lv / 2))); META.roster.push({ rid: META.rid++, name: m.name, kind: m.kind, lv, skill: lv >= 7 ? 2 : lv >= 4 ? 1 : lv >= 2 ? 0 : -1, rare: !!m.rare, tier: m.rare ? 'R' : 'N', title: '', stance: m.stance, runs: 1, evo: !!m.evo }); });
    saveMeta();
  }
  showTitle();
}

// ---------- 입력 ----------
function onAction(el) {
  const a = el.dataset.a, d = el.dataset, num = k => +d[k];
  if (a === 'sceneskip') { if (sceneNext) sceneNext(true); return; }
  if (a === 'tutend') { if (G) { G.tut = null; saveRun(); } META.tutDone = true; saveMeta(); sfx('click'); return coach(); }
  if (a === 'sheet') return setSheet(!$('right').classList.contains('open'));
  if (a === 'stat') return toast({ ok: true, msg: el.title });
  if (a === 'close') return closeModal(d.v);
  if (a === 'menu') return void modal(`<h2>메뉴</h2><div class="stack">${btn('help', null, '도움말')}${btn('settings', null, '설정')}${btn('quit', null, '타이틀로 나가기 (자동 저장)')}</div>${closeBtn()}`, false);
  if (a === 'help') return void modal(HELP + closeBtn(), true);
  if (a === 'codex') return void modal(codexHtml(), true);
  if (a === 'barracks') return void modal(barracksHtml(null), true);
  if (a === 'records') { modal(recordsHtml(), true); fillCloudBoard(); return; }
  if (a === 'draw') { let res; if (d.v === 'free') { if (META.lastDraw === today()) return; META.lastDraw = today(); res = drawOnce(true); } else { if (META.dust < DRAW_COST) return; META.dust -= DRAW_COST; res = drawOnce(false); } saveMeta(); sfx(res.tier === 'L' ? 'evo' : res.dust ? 'coin' : 'up'); $('modal').innerHTML = `<div class="sheet wide">${barracksHtml(res)}</div>`; $('modal').scrollTop = 0; if (!G) showTitle(); return; }
  if (a === 'release') { if (!el.dataset.sure) { el.dataset.sure = 1; el.textContent = '정말 보낸다'; return; } META.roster = META.roster.filter(r => r.rid !== num('id')); META.dust += 20; saveMeta(); $('modal').innerHTML = `<div class="sheet wide">${barracksHtml(null)}</div>`; return; }
  if (a === 'share') { try { navigator.clipboard.writeText(d.v).then(() => { el.textContent = '복사했다'; }, () => { el.textContent = '복사하지 못했다'; }); } catch (e) { el.textContent = '복사하지 못했다'; } return; }
  if (a === 'settings') return void modal(settingsHtml(), false);
  if (a === 'set') { if (d.k === 'sound') META.sound = d.v === '1'; if (d.k === 'pause') META.pause = d.v; if (d.k === 'open') { META.openAll = d.v === '1'; if (G) render(); } saveMeta(); sfx('click'); $('modal').innerHTML = `<div class="sheet">${settingsHtml()}</div>`; return; }
  if (a === 'wipe') { if (el.dataset.sure) { store.del('meta'); store.del('run'); META = META0(); closeModal(); if (!G) showTitle(); } else { el.dataset.sure = 1; el.textContent = '정말 지운다'; } return; }
  if (a === 'new') return void newRun();
  if (a === 'continue') { const run = store.get('run'); if (run) { G = run; if (!G.eld) G.eld = { id: G.startAsp, favor: 0, tally: 0 }; showGame(); morningFlow(); } return; }
  if (a === 'setup') { const o = UI.setup; if (d.k === 'asp') o.asp = d.v; else if (d.k === 'bring') { const k = o.bring.indexOf(+d.v); if (k >= 0) o.bring.splice(k, 1); else if (o.bring.length < 2) o.bring.push(+d.v); } else if (d.k === 'star') o.star = d.v; else if (d.k === 'tut') o.tut = !o.tut; else o.diff = +d.v; sfx('click'); return closeModal('redraw'); }
  if (a === 'legacy') { const p = UI.legacy, id = num('id'), i = p.indexOf(id); if (i >= 0) p.splice(i, 1); else if (p.length < (UI.legacyMax || 2)) p.push(id); sfx('click'); return closeModal('redraw'); }
  if (a === 'speed') return setSpeed(num('v'));
  if (a === 'skip') { ST.skip = true; if (handRes) handRes({ k: 'none' }); return; }
  if (a === 'hand') { if (handRes) handRes({ k: d.k, from: d.from === 'core' ? 'core' : d.from != null ? +d.from : null }); return; }
  if (!G || busy) return;
  if (a === 'quit') { saveRun(); if (!$('modal').hidden) closeModal(); return showTitle(); }
  if (a === 'view') { setSheet(false); if (ST.screen !== d.v && UI.sel) { UI.sel = null; render(); } return setScreen(d.v); }
  if (a === 'sel') { UI.sel = { t: d.t, i: num('i') }; setSheet(false); setScreen('under'); camTo(cellRect(num('i')).x + CW / 2); return render(); }
  if (a === 'gospot') { setSheet(false); setScreen('surface'); UI.sel = G.spot ? { t: 'spot' } : null; if (G.spot) camTo(SPOS[G.spot.pos].x); return render(); }
  if (a === 'spot') { const r = act(NEST.resolveSpot, num('i')); if (r.ok) { UI.sel = null; sfx('coin'); render(); toast(r); } return; }
  if (a === 'calm') { const r = act(NEST.calm); if (r.ok) sfx('spell'); return; }
  if (a === 'open') return void openModal(d.v);
  if (a === 'kin') return void openModal('kin:' + d.id);
  if (a === 'endday') return void endDay();
  if (a === 'dig') { const r = act(NEST.dig, num('i')); if (r.ok) { sfx(r.found ? 'evo' : 'dig'); if (r.found) ST.flash = now() + 200; } return; }
  if (a === 'block') return void act(NEST.toggleBlock, num('i'));
  if (a === 'build') { const before = NEST.combos(G).map(c => c.id), r = act(NEST.build, num('i'), d.v); if (r.ok) NEST.combos(G).filter(c => !before.includes(c.id)).forEach(c => { const first = !META.codex.combos[c.id]; META.codex.combos[c.id] = 1; saveMeta(); sfx('evo'); ST.flash = now() + 150; toast({ ok: true, msg: (first ? '조합 발견! ' : '조합 ') + '「' + c.name + '」 — ' + c.desc }); }); return; }
  if (a === 'guest') { const r = act(NEST.resolveGuest, num('i')); if (r.ok) { closeModal(); toast(r); } return; }
  if (a === 'trap') return void act(NEST.addTrap, num('i'), d.v);
  if (a === 'uptrap') return void act(NEST.upTrap, num('i'), num('j'));
  if (a === 'zone') return void act(NEST.setZone, num('i'));
  if (a === 'plot') return void act(NEST.setPlot, num('p'), d.v);
  if (a === 'accept') return void act(NEST.accept, num('i'));
  if (a === 'dismiss') { if (el.dataset.sure) { act(NEST.dismiss, num('id')); closeModal(); } else { el.dataset.sure = 1; el.textContent = '정말 내보낸다'; } return; }
  if (a === 'place') return void act(NEST.moveKin, num('id'), d.loc === 'bench' ? null : d.loc === 'core' ? 'core' : +d.loc);
  if (a === 'kinevo') { const r = act(NEST.evolveKin, num('id')); if (r.ok) { sfx('evo'); ST.flash = now() + 200; } return; }
  if (a === 'skill') return void act(NEST.setSkill, num('id'), num('i'));
  if (a === 'stance') return void act(NEST.setStance, num('id'), d.v);
  if (a === 'train') return void act(NEST.train, d.loc === 'core' ? 'core' : +d.loc, num('amt'));
  if (a === 'eat') return void act(NEST.eat);
  if (a === 'rest') return void act(NEST.rest);
  if (a === 'dispose') { const r = act(NEST.dispose, num('i'), d.how); if (r.mut) { sfx('evo'); ST.flash = now() + 200; } return; }
  if (a === 'raid') { const r = act(NEST.raid, d.v, num('l')); if (r.ok) { ST.shake = now() + 300; sfx('trap'); } return; }
  if (a === 'event') { const r = act(NEST.resolveEvent, num('i')); if (r.ok) closeModal(); return; }
}
function stagePoint(e) { const b = $('stage').getBoundingClientRect(), u = b.height / H; return [(e.clientX - b.left) / u - ST.ox + ST.cam.x, (e.clientY - b.top) / u]; }
function tipFor(h) {
  if (!h || !G) return '';
  if (h.t === 'cell') { const c = G.cells[h.i]; return c.dug ? NEST.ROOM[c.type].name + ' — ' + NEST.ROOM[c.type].desc : (NEST.canDig(G, h.i) ? '바위' : '바위 — 눌러서 판다'); }
  if (h.t === 'vill') return NEST.VILL[h.v].name + ' — ' + villState(h.v) + ' · 적의 ' + Math.round(G.vill[h.v].host);
  if (h.t === 'spot') return G.spot ? NEST.SPOT[G.spot.type].name + ' — 눌러서 살핀다 (행동 1)' : '';
  if (h.t === 'plot') return '길목 ' + (h.p + 1) + ' — ' + NEST.PLOT[G.plots[h.p]].desc;
  return h.t === 'up' ? '지상으로' : '둥지로';
}
function boot() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (el && !el.disabled) return onAction(el);
    if (!$('scene').hidden && sceneNext) return sceneNext();
  });
  // 좁은 화면: 지도를 좌우로 밀어서 본다
  let drag = null, dragged = false; const stg = $('stage');
  stg.addEventListener('pointerdown', e => { drag = { x: e.clientX, cam: ST.cam.tx }; dragged = false; });
  stg.addEventListener('pointermove', e => { if (!drag || !G) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 8) dragged = true; if (dragged && ST.viewW < W) camTo(drag.cam - dx / (stg.getBoundingClientRect().height / H) + ST.viewW / 2, true); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => stg.addEventListener(n, () => { drag = null; }));
  $('stage').addEventListener('click', e => {
    if (dragged) { dragged = false; return; }
    if (!G || busy || ST.mode !== 'day') return; const h = hitTest(...stagePoint(e));
    if (h && (h.t === 'up' || h.t === 'down')) return setScreen(h.t === 'up' ? 'surface' : 'under');
    UI.sel = h; UI.confirmEnd = false; sfx('click'); render(); $('view').scrollTop = 0;
  });
  $('stage').addEventListener('mousemove', e => { if (!G) return; ST.hover = ST.mode === 'day' ? hitTest(...stagePoint(e)) : null; $('stagetip').textContent = tipFor(ST.hover); });
  $('stage').addEventListener('mouseleave', () => { ST.hover = null; });
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (!$('scene').hidden) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (sceneNext) sceneNext(); } return; }
    if (e.key === 'Escape') { if (!$('modal').hidden && modalKind && !['setup', 'legacy', 'event'].includes(modalKind)) closeModal(); else if (G && UI.sel) { UI.sel = null; render(); } return; }
    if (!G || $('game').hidden) return;
    if (ST.mode === 'night') { if (['1', '2', '3'].includes(e.key)) setSpeed([1, 2, 4][+e.key - 1]); if (e.key === 's' || e.key === 'S') { ST.skip = true; if (handRes) handRes({ k: 'none' }); } if (e.key === ' ' && handRes) { e.preventDefault(); handRes({ k: 'none' }); } return; }
    if (!$('modal').hidden || busy) return;
    if (e.key === 'Tab') { e.preventDefault(); setScreen(ST.screen === 'under' ? 'surface' : 'under'); }
    if (e.key === 'e' || e.key === 'E' || e.key === 'ㄷ') endDay();
  });
  window.__nest = { get G() { return G; }, NEST, ST, get META() { return META; }, endingScene, slimeCanvas, kinCanvas };
  if (window.claude && window.claude.hot) try { window.claude.hot.onSnapshot && window.claude.hot.onSnapshot(() => ({ run: G })); } catch (e) { /* 무시 */ }
  initCloud(); showTitle(); requestAnimationFrame(loop);
  const nj = $('nojs'); if (nj) nj.remove();  // 여기까지 왔으면 정상 실행
}
boot();
