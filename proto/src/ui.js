// 옛 것의 둥지 — 화면 3/3: 글, 패널, 창, 낮과 밤의 흐름, 입력
// ---------- 글 ----------
const N_ = text => ({ narr: true, text }), E_ = text => ({ text: NEST.fj(text) });
const STORY = {
  intro: [N_('떨어진 자리에는 손바닥만 한 무언가와, 그 밑에 고인 끈적한 진액 한 줌이 남았다.'), E_('…들리나? 좋아. 나는 잔향이야. 네가 예전에 얼마나 컸는지 기억하는 마지막 메아리지.'), E_('지금 네 이름은 「옛 것?」이야. 물음표가 붙었지. 네가 정말 그것이었는지 아무도 몰라. ' + NEST.K.days + '일 뒤, 별들이 한 줄로 서는 밤까지 살아남으면 물음표가 떨어져.'), E_('굴을 파 올라가고, 몸에서 돋는 것들을 거느리고, 굴이 열리면 밤마다 내려오는 것들을 막아. 쓰러뜨린 것은 먹이고, 겁에 질려 무릎 꿇은 것은… 쓸모가 많지.'), E_('먹은 대로 변한다는 것만 기억해. 그리고 진액. 네 몸에서 배어 나와 둥지를 돌리는 피야. 땅 위의 것들에게는 그게 약이고 보물이라, 많이 고일수록 냄새를 맡고 더 많이 와.'), E_('우선 몸에서 돋으려는 것들부터 돋워. 혼자서는 첫 주도 못 넘겨.')],
  act2: [E_('첫 허물을 벗었네. 이제 지상으로 손을 뻗을 수 있어. Tab으로 올라가서 {마을}을(를) 봐.'), E_('겁만 줄지, 털지, 지도에서 지울지는 네 마음이야. 다만 무서운 소문은 더 무서운 인간을 데려와.')],
  get act3() { return [E_('인간들이 널 부르는 이름이 생겼어. 좋은 뜻은 아니야.'), E_('이제 ' + NEST.GRADE_NAME[3] + '이(가) 온다. ' + NEST.INV.scholar.name + '은(는) 네 능력을 봉하고, ' + NEST.INV.priest.name + '은(는) 겁먹은 자를 다독여. 누구부터 치울지 생각해.')]; },
  get act4() { return [E_('세 번째 허물이야. 이제 네 몸은 굴 하나로는 다 안 보여.'), E_('저들이 ' + NEST.GRADE_NAME[4] + '을(를) 보내기 시작했어. ' + NEST.INV.soldier.name + '은(는) 벽을 뚫고 들어오고, ' + NEST.INV.chaplain.name + '은(는) 겁먹은 자들을 붙든다. 아직 밤이 ' + NEST.K.act * 2 + '번 남았어.')]; },
  get act5() { return [E_('밤이 ' + NEST.K.act + '번 남았어. 인간들도 그걸 알아.'), E_('마지막 밤엔 ' + NEST.INV.sealer.name + '이(가) 온다. 함정은 절반만 듣고, 한 번에 두 번 친다. 쓸 수 있는 건 전부 써.')]; },
  last: [E_('오늘 밤 별이 선다. 넘기면 깨어나고, 못 넘기면 다시 한 방울이야.')],
  fell: [N_('눈을 뜨자 깔고 앉아 있던 진액 더미가 반으로 줄어 있었다.'), E_('쓰러진 널 밟고 가져갔어. 몸은 내가 다시 일으켰지만, 이것도 몇 번이지.'), E_('본체 방에 호위를 세우고, 길 위에 싸울 자리를 더 만들어. 그리고 마지막 밤에 오는 것들은 진액이 아니라 너를 가지러 와.')],
  fell2: [E_('다음에 쓰러지면 나도 못 일으켜. 남은 진액으로 지킬 것부터 세워.')],
  core: [N_('동굴은 다시 조용해졌다. 바닥에는 마른 얼룩 하나만 남았다.'), E_('…괜찮아. 별은 또 떨어져.')],
  broke: [N_('진액이 바닥나자 권속들이 하나둘 말라 떨어졌다. 빈 굴에는 바람 소리만 남았다.'), E_('굶는 신을 믿는 자는 없어. 다음엔 들고 나는 것부터 세어 봐.')],
  win: [N_('별들이 한 줄로 섰다. 동굴 깊은 곳에서 무언가가 아주 오랜만에 눈을 떴다.')],
};
const ENDING = {
  abyss: '해안선이 조금씩 안쪽으로 옮겨 갔다. 물가 사람들은 이제 물에 손을 담그기 전에 먼저 절을 한다.',
  nebula: '밤하늘에 못 보던 별자리가 하나 생겼다. 아는 자들은 이름을 붙이려다 그만두었다. 부르면 돌아본다는 소문 때문에.',
  brood: '숲이 {마을} 쪽으로 걸어오고 있다. 하루에 한 뼘씩. 서두르지 않는다.',
  dusk: '{마을}마다 같은 꿈을 꾼다. 막이 오르고, 다들 박수를 친다. 아침에 깨면 손바닥이 얼얼하다.',
  hunger: '지도에서 {마을} 몇 곳이 지워졌다. 지도 제작자는 실수라고 했다. 그 뒤로는 지도 제작자도 보이지 않는다.',
  none: '별은 섰지만 몸은 그대로였다. 한 방울은 한 방울인 채로 조금 더 오래 살아남았다.',
  h_abyss: '물 한 방울 고이게 한 적 없이 깊어졌다. 바다는 그 자리에 그대로 있는데, 물가 사람들은 이제 그물 대신 빈 통을 내린다. 올라오는 것은 없다.',
  h_nebula: '한 번도 손을 대지 않고 지켜보기만 했다. 별은 섰고, 그것은 끝내 눈을 뜨지 않았다. 별을 세는 자들은 그 자리를 비워 두고 별자리를 다시 그렸다.',
  h_brood: '불어나는 것이 불어나지 않았다. 숲은 자라지 않았고, 그 한가운데 나무 한 그루만 하늘에 닿았다.',
  h_dusk: '죽은 자가 거의 없었다. 다들 제 발로 걸어 나가 제 입으로 이야기했다. 막은 아직 내려오지 않았다.',
  h_hunger: '먹지 않고 다 자랐다. 인간들은 그것을 무서워해야 할지 본받아야 할지 정하지 못했고, 그 사이 접시는 계속 비어 있다.',
  child: '아무도 바치지 않았고, 길 잃은 아이는 {빵}을(를) 다 먹고 집에 갔다. 스무 해 뒤 그 아이가 동굴 앞에 첫 돌을 놓았다. 제단이 아니라 식탁이었다.',
  pure: '아무도 바치지 않고 깨어났다. 인간들은 그것을 뭐라 불러야 할지 아직 정하지 못했다. 신이라기엔 얌전하고, 괴물이라기엔 예의가 바르다.',
};
// 최종 모습마다 세 갈래: 점수 등급이 낮으면 조짐, 중간이면 번짐, 높으면 끝
const ENDING3 = {
  hive: [['하나 더', '사람들은 저녁마다 식구 수를 센다. 셀 때마다 하나가 많다. 누가 남는 하나인지는 아무도 짚지 못한다. 그래서 밥은 늘 모자라지 않게 짓는다.'],
    ['같은 대답', '장터에서 누군가를 부르면 여럿이 돌아본다. 서로 다른 얼굴들이 같은 순간에, 같은 각도로. 사람들은 이름 부르기를 그만두었다. 그래도 밤이면 온 {마을}이(가) 한 사람처럼 숨 쉬는 소리가 난다.'],
    ['우리', '어느 아침부터 아무도 "나"라고 말하지 않았다. 말하려 하면 혀가 다른 낱말을 찾았다. 도시들은 서로의 꿈을 꾸고, 한 곳에서 다친 손가락을 대륙 저편에서 감싸 쥔다. 외로운 사람은 이제 없다. 혼자였던 적이 있다는 것을 기억하는 것은, 굴 깊은 곳에서 돌고 있는 빈 가운데뿐이다.']],
  idol: [['돌 하나', '갈림길에 못 보던 돌이 서 있다. 누가 세웠는지 아는 사람이 없다. 지나가는 이들은 까닭 없이 걸음을 늦추고, 몇몇은 돌 앞에 가진 것을 조금 내려놓는다. 다음 날이면 내려놓은 것은 없다.'],
    ['무릎', '집집마다 한 귀퉁이가 비워졌다. 무엇을 모시느냐고 물으면 사람들은 웃으며 비워 둔 자리를 본다. 종은 치는 사람 없이 울리고, 그때마다 온 {마을}의 무릎이 같은 쪽으로 꺾인다. 아이들은 걷기 전에 엎드리는 법부터 배운다.'],
    ['올려다보는 세계', '사람들은 더는 일하지 않는다. 씨 뿌릴 밭도 지킬 문도 그대로 두고, 모두가 한 방향을 향해 앉아 있다. 굶어 쓰러지는 이들조차 고개는 떨구지 않는다. 그들이 보는 곳에는 아무것도 없다. 다만 하늘의 그 자리에만 별이 뜨지 않고, 그 자리는 해마다 조금씩 넓어진다.']],
  mix: [['어긋난 것들', '둥지 가까운 숲에서 뿔 달린 토끼가 잡혔다. 다음 달에는 깃털 난 물고기가 잡혔다. 잡은 이들은 웃으며 술안주로 삼았다. 그 고기를 먹은 이들의 손톱이 조금 다른 빛깔로 자라기 전까지는.'],
    ['이음매', '{마을}의 담이 나무와 붙어 자란다. 문고리는 따뜻하고, 바닥에서는 맥이 뛴다. 사람들은 자는 사이 옆 사람과 손이 붙지 않도록 떨어져 눕지만, 아침마다 누군가는 이불에서 팔을 떼어 내느라 운다.'],
    ['하나의 살', '이제 숲과 짐승과 사람을 가르는 낱말은 쓰이지 않는다. 가리킬 것이 남지 않았기 때문이다. 산등성이는 천천히 숨을 쉬고, 강은 핏줄처럼 갈라져 그것을 먹인다. 무엇이든 될 수 있던 것이 마침내 전부가 되었다. 그 한가운데에, 처음 떨어진 한 방울만이 아직 어느 것과도 섞이지 않은 채 남아 있다.']],
  get abyss() { return [['젖은 발자국', NEST.VILL.gaet.name + ' 사람들은 아침마다 문 앞에서 젖은 발자국을 본다. 바다 쪽에서 와서 바다 쪽으로 돌아간 발자국이다. 아무도 누구 것인지 묻지 않는다. 묻지 않는 한, 아직은 모르는 일이니까.'],
    ['밀려오는 것', '밀물이 썰물보다 조금씩 길어졌다. 마시는 물에서 짠맛이 나고, 아이들은 가르친 적 없는 노래를 부른다. 어른들은 가사를 알아듣지 못한다. 알아들은 이들은 밤에 물가로 걸어 나갔다.'],
    ['가라앉은 세계', '지도 제작자들은 해안선을 다시 그리다가 손을 놓았다. 육지라 부르던 것이 사실은 아주 오래 드러나 있던 바닥이었음을, 모두가 같은 밤에 알게 되었다. 물은 서두르지 않는다. 가라앉은 도시의 창마다 불이 켜져 있고, 그 안에서 무언가가 여전히 저녁을 차린다.']]; },
  get nebula() { return [['낯선 별', '하늘에 별이 하나 늘었다. 별을 세는 자들은 기록에 적고 넘어갔다. 그 별이 밤마다 조금씩 자리를 옮긴다는 것을 눈치챈 사람은 밤길을 걷던 이 하나뿐이었고, 그는 그 뒤로 위를 보지 않는다.'],
    ['열린 하늘', '별자리가 맞지 않게 되었다. 뱃사람들은 길을 잃었고 달력은 하루씩 어긋났다. ' + NEST.VILL.school.name + '에서는 관측을 금했다. 금지령이 닿기 전에 이미 본 사람들은 지금도 같은 쪽을 보고 서 있다. 먹지도 자지도 않고.'],
    ['별 사이', '어느 밤 하늘이 접혔다. 종이처럼, 소리 없이. 접힌 틈으로 보이는 것은 어둠이 아니었다. 사람들은 그제야 밤하늘이 무언가를 가리는 덮개였음을 알았다. 지금 도시들은 조금씩 떠오르고 있다. 떨어지는 것인지도 모른다. 위아래를 정해 주던 것이 사라졌으므로.']]; },
  get brood() { return [['이끼', NEST.VILL.field.name + '의 담장에 못 보던 이끼가 꼈다. 긁어내면 다음 날 다시 있다. ' + NEST.VILL.field.chief[0] + '의 말로는 별일 아니라고 했다. ' + NEST.VILL.field.chief[0] + '의 손톱 밑이 초록색인 것을 본 사람은 아무 말도 하지 않았다.'],
    ['걸어 다니는 밭', '병이 돈다고들 했다. 병이 아니었다. 앓고 일어난 사람들은 전보다 건강했고, 말수가 줄었고, 해가 지면 다 같이 밭에 나가 서 있었다. 뿌리를 내리는 것처럼. 아침이면 돌아와 식구들에게 웃어 보였다. 웃는 법이 모두 똑같았다.'],
    ['끝없이 낳는 숲', '마지막까지 남은 도시는 문을 걸어 잠갔다. 담 밖에서는 이웃이었던 것들이 천천히, 아주 참을성 있게 걸어온다. 썩지 않는다. 오히려 피어 있다. 그들은 문을 두드리지 않는다. 기다릴 뿐이다. 담 안의 누군가가 기침을 하고, 손등에 돋은 싹을 소매로 가릴 때까지.']]; },
  dusk: [['같은 꿈', '{마을}마다 같은 꿈을 꾼다. 막이 오르고, 다들 박수를 친다. 아침에 깨면 손바닥이 얼얼하다. 무대에 무엇이 있었는지는 아무도 기억하지 못한다.'],
    ['가면', '사람들이 얼굴을 가리기 시작했다. 처음엔 부끄러워서라고 했다. 가면 아래를 본 이는 그날로 문을 닫아걸었다. 그는 말한다. 아래에 아무것도 없는 게 아니었다고. 아래에도 가면이 있었다고.'],
    ['마지막 막', '어느 저녁 온 세상의 종이 한꺼번에 울렸다. 사람들은 하던 일을 놓고 줄지어 앉았다. 들판에, 지붕에, 바다 위에. 같은 쪽을 보고서. 무대는 보이지 않는다. 박수 소리만 들린다. 박수는 그치지 않고 아무도 일어서지 않는다. 막이 내리면 무엇이 끝나는지 다들 알기 때문이다.']],
  hunger: [['빈 접시', '식탁에 차린 것이 자꾸 모자란다. 세어 보면 맞는데, 먹고 나면 모자란다. 사람들은 조금씩 야위어 가고, 누구도 그 까닭을 입 밖에 내지 않는다. 말이 씨가 될까 봐서가 아니다. 말도 먹힐까 봐서다.'],
    ['지워진 {마을}', '지도에서 {마을} 몇 곳이 지워졌다. 지도 제작자는 실수라고 했다. 그 뒤로는 지도 제작자도 보이지 않는다. 그 {마을}에 친척이 있던 사람들은 친척의 이름을 떠올리지 못한다. 이름이 있던 자리만 혀끝에 남아 있다.'],
    ['마지막 한 입', '달이 한쪽부터 줄어들었다. 그믐이 아니었다. 잇자국이 보였다. 산이 사라진 자리에는 구덩이가 아니라 아무것도 없었다. 사람들은 이제 안다. 세상이 둥근 것은 무언가의 입안에 들어 있기 때문이라는 것을. 그리고 그 입이 아주 천천히 닫히는 중이라는 것을.']],
};
const endTier = g => ['D', 'C'].includes(g) ? 0 : ['B', 'A'].includes(g) ? 1 : 2;
function startEnding(sc) {
  const c = $('endcv'); if (!c || !G || !G.slime.main) return; const key = G.slime.main, tier = endTier(sc.grade), sl = JSON.parse(JSON.stringify(G.slime)); let fr = 0;
  const tick = () => { if (!document.body.contains(c)) return clearInterval(iv); try { endingScene(c, key, tier, sl, fr++); } catch (e) { clearInterval(iv); } }, iv = setInterval(tick, 260); tick();
}
const GRADE_SAY = { SSS: '별들이 줄을 서서 구경했어. 이 정도면 나도 필요 없겠다.', SS: '예전의 너와 거의 같아. 거의.', S: '훌륭해. 인간들이 지도를 다시 그려야겠네.', A: '무난하게 깨어났어. 다음엔 더 크게.', B: '깨어나긴 했어. 하품부터 하고 있지만.', C: '간신히. 별이 조금만 덜 섰어도 못 깼을 거야.', D: '…다음 별을 기다리자.' };
const STAGE_NAME = ['한 방울', '첫 허물', '두 번째 허물', '세 번째 허물', '성체'];
const guideLine = () => NEST.lx(guideLine0());
function guideLine0() {
  const d = G.day, bench = G.kin.filter(m => m.loc === null).length;
  if (G.sealed && !NEST.paths(G).length) return !G.kin.length ? '여기는 땅속 깊은 동굴 한 칸이야. 먼저 "돋는 것"을 눌러 권속을 돋워. 그다음 위로 파 올라가자.' : '금이 간 무른 흙을 눌러서 파. 진액은 안 들어. 맨 위 왼쪽 칸까지 ' + NEST.trailLeft(G) + '칸 남았어. 닿아야 땅 위로 뚫을 수 있어.';
  if (G.sealed) return !G.kin.length ? '굴은 아직 막혀 있어. 아무도 여기를 몰라. 먼저 "돋는 것"을 눌러 권속을 돋워.' : G.under >= 1 ? '숨어 있는 밤마다 조금씩 자라지만 날은 흘러가고, 오늘 밤 들킬 위험이 ' + Math.round(NEST.underRisk(G) * 100) + '%야. 들키면 그 밤에 바로 내려와.' : '준비가 됐으면 "땅 위로 뚫는다"를 눌러. 뚫어야 먹이가 오고, 어떤 세상인지도 그때 알게 돼.';
  if (G.spot && G.ap > 0 && d > 3) return '지상에 ' + NEST.SPOT[G.spot.type].name + '이(가) 보여. 이틀이면 사라져. 행동 하나를 쓸 만한지 봐.';
  if (G.omen && G.omen.tier !== 'boon' && !G.omen.calmed && G.faith >= NEST.CALM_COST) return '오늘 징조에는 나쁜 쪽이 붙어 있어. 신앙 ' + NEST.CALM_COST + '을 바치면 달랠 수 있어. 아래 "징조"를 눌러.';
  if (G.guest) return '오늘 밤은 싸우러 오는 게 아니야. ' + NEST.GUEST[G.guest.type].name + '이(가) 온다. 아래 "손님"을 눌러 어떻게 맞을지 정해.';
  { const e = NEST.estimate(G, 'tonight') || NEST.estimate(G, 'tomorrow'); if (e && e.boss && e.boss !== 'captain' && d < NEST.K.days) return '우두머리는 ' + NEST.INV[e.boss].name + '. ' + NEST.INV[e.boss].boss + '.'; }
  if (bench) return '자리 없이 서성이는 권속이 ' + bench + '명 있어. 문턱이나 싸움 굴을 지어서 세워.';
  if (d === 1) return '"돋는 것"을 눌러 권속을 돋우고, 길 위 빈 굴에 문턱이나 함정 굴을 지어. 건설 한 번에 작업이 셋이야.';
  if (d === 2) return '점선이 인간들이 걸어올 길이야. 길 위에 싸울 자리를 만들어. 내일 밤 처음으로 온다.';
  if (d === 3) return (TOUCH ? "지도 위 '지상' 버튼을 눌러 봐." : 'Tab으로 지상에 올라가 봐.') + ' 오늘 밤 누가 얼마나 오는지 보여.';
  if (G.corpses.length >= 3) return '먹이가 쌓였어. 본체 방을 눌러 포식해. 먹은 것의 징조가 쌓인다.';
  if (G.prison.length) return '포로가 있어. 풀어 주고 몸값을 받을지, 바칠지, 믿게 할지 정해.';
  if (d < 6 && NEST.sideRooms(G).length === 0) return '길에서 벗어난 칸을 파면 적이 지나가지 않는 곁방이 돼. 고치 굴이나 기도 굴은 거기에 지어.';
  if (NEST.isSettle(G)) return '달이 기우는 밤이야. 큰 무리가 오고, 넘기면 정수대로 허물을 벗어. 밤에 손도 쓸 수 있어.';
  if (G.gold > 500 * NEST.cm(G)) return '진액 냄새를 맡고 더 많이 올 거야. "본체"의 탐식으로 삼키면 몸이 불고, 털리지도 않아.';
  if (NEST.actOf(G) >= 2 && !Object.values(G.vill).some(s => s.tribute || s.razed)) return '지상의 {마을}을(를) 눌러 봐. 위협하면 공물을 바치고, 털면 한몫 잡지만 그 {마을}이(가) 벼른다.';
  return '먹은 대로 변해. 본체 방에서 어떤 징조가 앞서는지 봐.';
}

// ---------- 흔적: 한 일이 무언가를 연다 ----------
const FEATS = [
  ['first_night', '첫 밤', '침입을 한 번 격퇴한다', '매복굴', () => G.stats.repels >= 1],
  ['first_captive', '첫 포로', '포로를 한 명 잡는다', '속삭임 굴', () => G.stats.captives >= 1 || G.prison.length > 0],
  ['first_ransom', '첫 몸값', '몸값을 받고 풀어 준다', '미끼 굴', () => G.stats.ransoms >= 1],
  ['first_sacrifice', '첫 제물', '포로를 제물로 바친다', '제물 굴', () => G.sacrifices >= 1],
  ['first_convert', '첫 신도', '포로를 개종시킨다', '환각 안개', () => G.stats.converts >= 1],
  ['first_evo', '첫 허물', '첫 허물을 벗는다', '달맞이 굴·징조의 방', () => G.slime.stage >= 1],
  ['first_raid', '지상에 손을 뻗다', '{마을}을(를) 습격한다', '미끼 둔덕, 눈자루', () => (G.stats.raids || 0) >= 1],
  ['hands3', '손을 쓰다', '한 판에 세 번 개입한다', '산성 웅덩이', () => (G.stats.hands || 0) >= 3],
  ['day12', '열두 밤', '12일째에 닿는다', '큰 싸움 굴, 빨판 굴', () => G.day >= 12],
  ['first_end', '첫 낙하의 끝', '한 판을 끝까지 한다 (이기든 지든)', '별자리 셋 (닻, 주머니, 솥)', () => !!G.over],
  ['first_win', '깨어난 것', '처음으로 깨어난다', '황혼의 별자리 둘, 깊은 각성', () => !!G.over && G.over.win],
  ['win2', '두 번째 물음표', '두 번 깨어난다', '성운의 별자리 둘, 끝없는 밤', () => !!G.over && G.over.win && META.clears >= 1],
  ['body1', '낯선 허물', '숨은 본체로 첫 허물을 벗는다', '별가루', () => !!G.slime.body],
  ['fuse1', '한 몸', '권속 둘을 합친다', '별가루', () => (G.stats.fuses || 0) >= 1],
  ['rcp1', '맞물린 살', '특별한 합체를 하나 찾는다', '별가루', () => (G.stats.recipes || 0) >= 1],
  ['trait1', '덧난 것', '몸에 형질이 하나 돋는다', '별가루', () => !!G.origin && G.origin !== 'drop'],
  ['trait5', '여덟 갈래', '형질 여덟을 모두 겪는다', '별가루', () => Object.keys(META.codex.traits || {}).length >= NEST.TRAITS.length],
  ['dig8', '개미굴', '한 판에 8칸을 판다', '별가루', () => (G.stats.dug || 0) >= 8],
  ['kills60', '산더미', '한 판에 60명을 쓰러뜨린다', '별가루', () => G.stats.kills >= 60],
  ['dig3', '굴 파는 것', '한 판에 3칸을 판다', '별가루', () => (G.stats.dug || 0) >= 3],
  ['found1', '묻힌 것', '굴을 파다 무언가를 찾는다', '별가루', () => (G.stats.found || 0) >= 1],
  ['combo1', '맞붙여 짓다', '방 조합을 하나 찾는다', '별가루', () => Object.keys(META.codex.combos).length >= 1],
  ['guest1', '밤 손님', '밤 손님을 맞는다', '별가루', () => (G.stats.guests || 0) >= 1],
  ['calm1', '달래는 법', '징조의 나쁜 쪽을 달랜다', '별가루', () => (G.stats.calms || 0) >= 1],
  ['kinevo1', '자라는 식구', '권속을 한 번 진화시킨다', '별가루', () => (G.stats.kinEvo || 0) >= 1],
  ['gulp1', '첫 한 입', '진액을 삼킨다', '별가루', () => NEST.hoardN(G, 'gulp') >= 1],
  ['first_loss', '한 방울으로 돌아가다', '처음으로 쓰러진다', '별가루', () => !!G.over && !G.over.win],
  ['heretic1', '어긋난 얼굴', '이단 화신으로 깨어난다', '별가루', () => !!G.over && G.over.win && NEST.endKey(G).startsWith('h_')],
];
const LOCK = { ambush: 'first_night', persuade: 'first_captive', decoy: 'first_ransom', ritual: 'first_sacrifice', mist: 'first_convert', altar: 'first_evo', sluice: 'first_evo', warp: 'first_evo', fleshwall: 'first_evo', mirror: 'first_evo', table: 'first_evo', camp: 'first_raid', tower: 'first_raid', acid: 'hands3', bighall: 'day12', shop: 'day12' };
META.codex.traits = META.codex.traits || {};
META.codex.fuse = META.codex.fuse || {}; META.codex.rcp = META.codex.rcp || {};
META.codex.sp = META.codex.sp || {}; Object.keys(META.codex.forms || {}).forEach(k => { if (k === 'base') return; const m = k.split('_')[0]; META.codex.sp[m + 1] = 1; if (k.includes('_')) META.codex.sp[m + 2] = 1; });   // 본 모습: 몸 + 단계
if (!META.feats) { META.feats = {}; if (META.runs > 0) Object.values(LOCK).forEach(id => { META.feats[id] = 1; }); }  // 이미 해 본 사람은 배우는 흔적을 연 채로 시작
const locked = k => !META.openAll && !!LOCK[k] && !META.feats[LOCK[k]];
const lockText = k => { const f = FEATS.find(x => x[0] === LOCK[k]); return '잠김 — 흔적 「' + f[1] + '」: ' + f[2]; };
const featGain = f => f[3] === '별가루' ? '별가루 +15' : f[3] + ' 열림';
function checkFeats() {
  if (!G) return; const got = FEATS.filter(f => !META.feats[f[0]] && f[4]()); if (!got.length) return;
  got.forEach(f => { META.feats[f[0]] = 1; META.dust += 15; }); saveMeta(); sfx('up');
  UI.featNew = (UI.featNew || []).concat(got); UI.featMsg = '새 흔적 「' + got[0][1] + '」 — ' + featGain(got[0]) + (got.length > 1 ? ' 외 ' + (got.length - 1) : '');
}

// ---------- 길잡이(튜토리얼): 한 일을 확인하고 다음 할 일을 짚어 준다 ----------
const nextSoft = () => { const i = NEST.START.slice().reverse().find(j => !G.cells[j].dug && !NEST.canDig(G, j)); return i == null ? null : i; };
const tutEmpty = () => (NEST.paths(G)[0] || []).find(i => i !== NEST.CORE && i !== NEST.ENT && G.cells[i].type === 'empty');
const TUT = [
  { t: () => modalKind === 'applicants' ? '마음에 드는 것을 돋워. 둘쯤이면 좋아. 행동은 들지 않아. 다 돋웠으면 "나중에"를 눌러 창을 닫아.' : '아래 띠에서 "돋는 것"을 눌러 봐. 네 몸에서 돋으려는 것들이야.', sel: '[data-a="open"][data-v="applicants"], #modal [data-a="accept"], #modal [data-a="close"]', done: () => G.kin.length >= 1 && $('modal').hidden },
  { t: () => '이제 싸울 자리를 만들자. 지도의 점선이 땅 위의 것들이 걸어 내려올 길이야. 깜빡이는 빈 굴을 눌러.', cell: tutEmpty, done: () => G.cells.some(c => c.type === 'post' || c.type === 'hall') || (UI.sel && UI.sel.t === 'cell' && G.cells[UI.sel.i].dug && G.cells[UI.sel.i].type === 'empty') },
  { t: () => (isMobile() ? '올라온 창의 ' : '오른쪽 패널의 ') + '"추천"에서 "문턱"을 지어. 건설 행동 한 번이면 파기·짓기·함정 같은 작업을 세 번 할 수 있어.', sel: '[data-a="build"][data-v="post"]', done: () => G.cells.some(c => c.type === 'post' || c.type === 'hall') },
  { t: () => '권속은 제 자리를 알아서 찾아. 먼저 돋은 것들은 본체 곁을 지키고, 나머지는 길목 앞에서부터 서. 지금 문턱은 비어 있으니 하나를 불러 세우자. 방금 지은 문턱을 누르고 "여기를 지켜라" 옆의 이름을 눌러.', cell: () => G.cells.findIndex(c => c.type === 'post' || c.type === 'hall'), sel: '[data-a="place"]', done: () => G.kin.some(m => m.pin && typeof m.loc === 'number') },
  { t: () => '좋아. 지키라고 한 권속은 깃발을 달고 그 자리에 뿌리를 내려. 거기서 보낸 밤마다 조금씩 세져. 대신 붙들어 둘 수 있는 수는 정해져 있어. 이제 굴을 열자. ' + (isMobile() ? '✕로 창을 닫고 아래의 "뚫기"를 눌러.' : '오른쪽 아래 "땅 위로 뚫는다"를 눌러.'), sel: '#sheetclose, [data-a="breach"], #modal [data-a="close"]', done: () => !G.sealed && $('modal').hidden && $('scene').hidden && !busy },
  { t: () => '굴이 뚫렸어. 여기가 땅 위야. 붉은 표시가 오늘 밤 올 무리고, {마을}와(과) 길목도 눌러 볼 수 있어. 다 봤으면 "지하"로 돌아와.', sel: '[data-a="view"][data-v="under"]', done: () => ST.screen === 'under' },
  { t: () => '준비 끝. "밤을 맞는다"를 눌러. 행동이 남았으면 한 번 더 누르면 돼. 싸움은 권속과 함정이 알아서 해.', sel: '[data-a="endday"]', done: () => G.day >= 2 },
  { t: () => '첫 밤을 넘겼어. 쓰러뜨린 것은 먹이가 돼. "본체" 단추를 누르거나, 지도에서 깜빡이는 본체 방을 눌러.', cell: () => NEST.CORE, done: () => !G.corpses.length || (G.stats.eats || 0) >= 1 || (UI.sel && UI.sel.t === 'cell' && UI.sel.i === NEST.CORE) },
  { t: () => '"포식"을 눌러. 먹은 것의 징조가 쌓이고, ' + NEST.K.act + '일째 밤에 정수가 ' + NEST.K.thresh[1] + '을 넘으면 그 징조의 몸으로 허물을 벗어.', sel: '[data-a="eat"], [data-a="core"]', done: () => !G.corpses.length || (G.stats.eats || 0) >= 1 },
  { t: () => '기본은 여기까지야. 권속은 "돋는 것"에서 더 돋우고, 꿇은 것은 "포로"에서 처분해. 위쪽 숫자를 누르면 뜻이 나와.', end: true, done: () => false },
];
function coach() {
  const on = !!G && G.tut != null && !G.over; ['coach', 'coach2'].forEach(id => { $(id).hidden = !on; });
  document.querySelectorAll('.tut-glow').forEach(e => e.classList.remove('tut-glow')); ST.tutCell = null; $('recent').style.display = on ? 'none' : '';
  if (!on) return;
  let guard = 0; while (G.tut < TUT.length - 1 && TUT[G.tut].done() && guard++ < 20) { G.tut++; sfx('up'); }
  const st = TUT[G.tut], html = `<div class="row nw">${echoImg(28)}<span class="grow"><b class="coin h3">잔향</b> <small class="mute">길잡이 ${G.tut + 1}/${TUT.length}</small></span>${btn('tutend', null, st.end ? '알겠어' : '그만 보기', 'sm' + (st.end ? ' pri' : ''))}</div><p>${esc(NEST.lx(st.t()))}</p>`;
  ['coach', 'coach2'].forEach(id => { if ($(id).dataset.h !== html) { $(id).innerHTML = html; $(id).dataset.h = html; } });
  if (st.sel && ST.mode === 'day') document.querySelectorAll(st.sel).forEach(e => { if (!e.disabled) e.classList.add('tut-glow'); });
  if (st.cell && ST.screen === 'under') ST.tutCell = st.cell();
}
setInterval(() => { if (G && G.tut != null) coach(); }, 400);

// ---------- 작은 도구 ----------
const attrs = o => Object.keys(o || {}).map(k => ` data-${k}="${esc(o[k])}"`).join('');
const btn = (a, o, label, cls, dis) => `<button class="btn ${cls || ''}" data-a="${a}"${attrs(o)}${dis ? ' disabled' : ''}>${label}</button>`;
const opt = (a, o, name, cost, desc, dis, cls) => `<button class="btn opt${cls ? ' ' + cls : ''}" data-a="${a}"${attrs(o)}${dis ? ' disabled' : ''}><b>${esc(name)}${cost ? ` <span class="coin num">${R(cost)}방울</span>` : ''}</b><span class="small mute">${esc(desc)}</span></button>`;
const aspChip = (a, s) => `<span class="chip" style="border-color:${ASPCOL[a]};color:${ASPCOL[a]}">${esc(s || NEST.ASP[a])}</span>`;
const bar = (f, col) => `<span class="bar"><i style="width:${Math.max(0, Math.min(100, f * 100))}%;${col ? 'background:' + col : ''}"></i></span>`;
const coord = i => 'ABCDE'[i % 5] + (Math.floor(i / 5) + 1);
const locName = loc => loc === 'core' ? '본체 방' : loc === null ? '대기' : NEST.ROOM[G.cells[loc].type].name + ' ' + coord(loc);
const kinChip = m => `<button class="unit${m.rare ? ' rare' : ''}${m.hurt || m.strike ? ' off' : ''}" data-a="kin" data-id="${m.id}">${kinImgM(m, 32)}<span>${esc(m.name)} <small class="mute">Lv${m.lv}${m.evo ? '★' : ''}${m.hurt ? ' 부상' : m.strike ? ' 파업' : ''}</small></span></button>`;
const kinMini = m => `<button class="unit mini${m.rare ? ' rare' : ''}${m.hurt || m.strike ? ' off' : ''}" data-a="kin" data-id="${m.id}" title="${esc(m.name)} · ${NEST.kinName(m)} Lv${m.lv}">${kinImgM(m, 28)}<small class="mute">${m.lv}</small></button>`;
UI.tab = {}; UI.page = {};
// 탭과 쪽 넘김: 긴 내용을 아래로 늘이지 않는다
const tabsHtml = (g, list, cur, wrap) => `<div class="tabs${wrap ? ' wrap' : ''}">${list.map(t => `<button class="tab${t[0] === cur ? ' on' : ''}" data-a="tab" data-g="${g}" data-v="${t[0]}">${t[1]}${t[2] != null ? ` <small>${t[2]}</small>` : ''}</button>`).join('')}</div>`;
const curTab = (g, list) => { const t = UI.tab[g]; return list.some(x => x[0] === t) ? t : list[0][0]; };
const pager = (g, items, per, draw) => { const n = Math.max(1, Math.ceil(items.length / per)), pg = Math.min(n - 1, Math.max(0, UI.page[g] || 0)); UI.page[g] = pg; return draw(items.slice(pg * per, pg * per + per)) + (n > 1 ? `<div class="pager">${btn('page', { g, v: -1 }, '◀', 'sm', pg === 0)}<span class="small mute">${pg + 1} / ${n}</span>${btn('page', { g, v: 1 }, '▶', 'sm', pg >= n - 1)}</div>` : ''); };
const phead = (title, sub, extra) => `<div class="ph"><h2>${title}${sub ? ` <small class="mute">${sub}</small>` : ''}</h2>${extra || ''}<button class="btn sm xbtn" id="sheetclose" data-a="sheet" aria-label="닫기" title="닫기 (Esc)">✕</button></div>`;
const M = (title, body, foot) => `<div class="mhead"><h2>${title}</h2></div><div class="mbody">${body}</div>${foot ? `<div class="mfoot">${foot}</div>` : ''}`;
let toastT = 0;
function toast(r) {
  const t = $('toast'); if (!t) return; clearTimeout(toastT);
  if (UI.featMsg) { r = { ok: true, msg: (r && r.msg ? r.msg + ' · ' : '') + UI.featMsg }; UI.featMsg = ''; }
  if (!r || !r.msg) { t.textContent = ''; return; }
  t.textContent = r.msg; t.className = r.ok ? '' : 'err';
  toastT = setTimeout(() => { const e = $('toast'); if (e) e.textContent = ''; }, 3200);
}
function setSheet(on) { if (!on && UI.sel && isMobile()) UI.sel = null; $('right').classList.toggle('open', !!on && isMobile()); }
function act(fn, ...a) { const r = fn(G, ...a); UI.confirmEnd = false; render(); toast(r); if (r && r.ok) { sfx('click'); saveRun(); } else sfx('down'); refreshModal(); return r; }

// ---------- 낮 화면 ----------
function hud() {
  const h = ST.hud || G, need = NEST.K.thresh[G.slime.stage + 1], fg = NEST.fearGrade(G);
  const IC = { '진액': 'gold', '신앙': 'faith', '공포': 'fear', '정수': 'ess', '먹이': 'food' };
  const stat = (lb, val, sub, tip, cls, style) => `<button class="stat" data-a="stat" title="${esc(tip)}"><span class="lb">${IC[lb] ? iconImg(IC[lb]) : ''}<span class="lbt">${lb}</span></span> <span class="v"><b class="num ${cls || ''}"${style ? ` style="${style}"` : ''}>${val}</b>${sub || ''}</span></button>`;
  $('hud').innerHTML = `<div class="hud-top"><span class="hud-turn">${G.day}일 <small class="mute">/ ${NEST.K.days} · ${G.sealed ? '땅속' : NEST.actOf(G) + '막'}</small>${NEST.isSettle(G) ? '<span class="moon"> ◐<small class="only-pc moontxt"> 달이 기우는 밤</small></span>' : ''}</span>
    <span class="hud-ap"><span class="only-pc">행동 </span><span class="pips">${Array.from({ length: NEST.K.ap }, (_, i) => `<i class="pip${i < G.ap ? '' : ' off'}"></i>`).join('')}</span>${G.d.buildOps ? ` <small class="mute">작업 ${G.d.buildOps}</small>` : ''}</span>
    <span class="row hud-btns only-m">${btn('menu', null, '메뉴', 'sm')}</span></div>
    <div class="stats">${stat('진액', R(h.gold), '', '진액: 둥지를 돌리는 피. 방을 짓고 권속을 돋우고 먹이는 데 쓴다. 땅 위의 것들에게는 약이자 보물이라, 많이 고일수록 침입이 잦고 커진다', 'coin')}
    ${stat('신앙', Math.floor(h.faith), `<small class="mute">/${NEST.faithCap(G)}</small>`, '신앙: 밤의 손 주문과 징조 달래기에 쓴다. 신도와 기도 굴, 광란한 적에게서 얻는다', '', 'color:#c8a8ff')}
    ${stat('공포', Math.round(h.fear), ` <small class="mute gname">${NEST.GRADE_NAME[fg]}</small>`, '공포 ' + Math.round(h.fear) + ': 지금은 ' + NEST.GRADE_NAME[fg] + '이 온다. 오를수록 더 강한 인간이 오고, 매일 2씩 가라앉는다', 'up')}
    ${stat('정수', NEST.essTotal(G), need ? `<small class="mute">/${need}</small>` : '', '정수: 달이 기우는 밤에 기준을 넘으면 진화한다', '')}
    ${stat('목숨', lifePips(), '', '목숨: 본체가 쓰러지면 진액 절반을 털리고 하나 줄어든다. 하나 남았을 때 쓰러지면 끝. 마지막 밤에는 쓰러지면 바로 끝', '')}
    ${stat('먹이', G.corpses.length, `<small class="mute">/${NEST.corpseCap(G)}</small>`, '먹이: 쓰러뜨린 침입자. 본체 창에서 포식하면 정수가 된다', '')}</div>
    <span class="row hud-btns only-pc">${btn('help', null, '도움말', 'sm')}${btn('settings', null, '설정', 'sm')}${btn('quit', null, '나가기', 'sm')}</span>`;
  document.documentElement.style.setProperty('--hud-h', $('hud').offsetHeight + 'px');
}
// 세상의 박자와 그 세상에만 있는 것: 둥지 창과 도움말이 같이 쓴다
function worldMore(w) { return `<p class="small"><span class="chip">${esc(w.beat[0])}</span> ${esc(w.beat[1])}</p><p class="small mute">이 세상에만 있는 것</p>` + w.only.map(k => `<p class="small"><span class="chip fake">${esc(NEST.INV[k].name)}</span> ${esc(NEST.INV[k].tip)}</p>`).join(''); }
function onlyTail(e) { if (!e.only || !e.only.length) return ''; return ' · ' + NEST.INV[e.only[0]].name + (e.only.length > 1 ? ' 등' : ''); }
function forecastText(when) { if (G.sealed) return when === 'tonight' ? '굴이 막혀 있다' + (NEST.underRisk(G) ? ' · 들킬 위험 ' + Math.round(NEST.underRisk(G) * 100) + '%' : '') : '뚫기 전에는 아무도 모른다'; if (when === 'tonight' && G.guest) return '손님 · ' + NEST.GUEST[G.guest.type].name; const e = NEST.estimate(G, when); if (!e) return '조용할 것 같다'; if (e.duel) return `${NEST.VILL[e.vill].name} · 비무 · ${NEST.INV.master.name} ${e.count}명`; if (e.boss && e.boss !== 'sealer') return `${NEST.VILL[e.vill].name} · ${NEST.INV[e.boss].name} 외 ${e.count - 1}명 (큰 무리)${onlyTail(e)}`; return `${NEST.VILL[e.vill].name} · ${NEST.GRADE_NAME[e.grade]} ${e.kinds ? '' : '약 '}${e.count}명${e.settle ? ' (큰 무리)' : ''}${onlyTail(e)}`; }
function tray() {
  const out = [], bench = G.kin.filter(m => m.loc === null).length, tm = G.day < NEST.K.days;
  if (G.event) out.push(`<button class="chip todo" data-a="open" data-v="event">사건</button>`);
  if (G.omen) { const live = G.omen.tier !== 'boon' && !G.omen.calmed; out.push(`<button class="chip${live ? ' todo' : ''}" data-a="open" data-v="elder"><span style="color:${ASPCOL[G.eld.id]}">징조</span><span class="tn"> ${NEST.OMEN[G.omen.id].name}</span></button>`); }
  if (G.guest) out.push(`<button class="chip todo" data-a="open" data-v="guest">손님</button>`);
  if (G.spot) out.push(`<button class="chip todo" data-a="gospot">지상<span class="tn"> ${NEST.SPOT[G.spot.type].name}</span></button>`);
  if (G.applicants.length) out.push(`<button class="chip todo" data-a="open" data-v="applicants">돋는 것 ${G.applicants.length}</button>`);
  if (G.prison.length) out.push(`<button class="chip todo" data-a="open" data-v="captives">포로 ${G.prison.length}</button>`);
  if (bench) out.push(`<button class="chip todo" data-a="open" data-v="roster">대기 ${bench}</button>`);
  out.push(`<button class="chip only-pc" data-a="open" data-v="roster">권속 ${G.kin.length}</button>`);
  out.push(`<button class="chip only-pc" data-a="view" data-v="surface"><span class="up">오늘 밤</span> ${esc(forecastText('tonight'))}</button>`);
  if (tm) out.push(`<button class="chip only-pc" data-a="view" data-v="surface"><span class="warnc">내일</span> ${esc(forecastText('tomorrow'))}</button>`);
  $('tray').classList.toggle('tight', out.filter(x => !x.includes('only-pc')).length > 3); $('tray').innerHTML = out.join('');
  $('fore').innerHTML = `<span class="up">오늘 밤</span><span>${esc(forecastText('tonight'))}</span>${tm ? `<span class="warnc">내일 밤</span><span class="mute">${esc(forecastText('tomorrow'))}</span>` : ''}`;
  $('recent').innerHTML = G.auto && AUTO.log.length ? `<div class="row nw" style="align-items:flex-start">${echoImg(40)}<p class="grow"><b class="h3 coin">권속들</b> ${esc(AUTO.log.slice(0, 2).join(' · '))}</p></div>` : `<div class="row nw" style="align-items:flex-start">${echoImg(40)}<p class="grow"><b class="h3 coin">잔향</b> ${esc(G.auto ? '권속들이 일하고 있어. 궁금한 방은 눌러 봐. 급하면 멈추고 직접 시켜도 돼.' : guideLine())}</p></div>`;
  const pr = v => ` aria-pressed="${ST.screen === v}"`;
  $('mnav').innerHTML = `<span class="seg"><button class="btn" data-a="view" data-v="under"${pr('under')}>지하</button>${G.sealed ? '<button class="btn" data-a="breach">뚫기</button>' : `<button class="btn" data-a="view" data-v="surface"${pr('surface')}>지상</button>`}</span>${btn('core', null, '본체')}${btn('open', { v: 'roster' }, '권속 ' + G.kin.length)}${G.auto ? `<button class="btn pri end" data-a="autopause">${AUTO.paused ? '▶ 계속' : '⏸ 멈춤'}</button><button class="btn" data-a="autospeed" data-v="next">${AUTO.speed}배</button>` : `<button class="btn pri end${UI.confirmEnd ? ' warn' : ''}" data-a="endday">${UI.confirmEnd ? `행동 ${G.ap} 남음 · 한 번 더` : (NEST.isSettle(G) ? '◐ ' : '') + '밤 맞기'}</button>`}`;
}
const lifePips = () => { const n = NEST.lives(G), t = NEST.livesMax(G); return '<span class="hearts" role="img" aria-label="목숨 ' + n + ' / ' + t + '">' + iconImg('life', 18).repeat(n) + iconImg('dead', 18).repeat(Math.max(0, t - n)) + '</span>'; };
// 지금 이대로 달이 기울면 무엇이 되는가. 겪어 보지 못한 숨은 본체는 이름을 가린다
const partName = p => (typeof PRO !== 'undefined' && PRO.PART && PRO.PART[p.id] ? PRO.PART[p.id].name : NEST.BODYFX[p.slot].name);
// 몸에 남은 것: 땅속에서 돋운 부위가 둥지에서 하는 일
function bodyHtml() {
  const B = G.body || [], sd = G.slime.look && NEST.SEEDN[G.slime.look], nm = G.slime.look && typeof SEEDS !== 'undefined' && SEEDS[G.slime.look] ? SEEDS[G.slime.look].name : '';
  if (!B.length && !sd) return '';
  return `<div class="sec">몸에 남은 것 <small>땅속에서 돋운 것</small></div><div class="kv small">${B.map(p => `${aspChip(p.asp, NEST.BODYFX[p.slot].name + ' ' + partName(p) + ' ' + p.lv)}<span>${esc(NEST.BODYFX[p.slot].text(p.lv))}</span>`).join('')}${sd ? `<span class="chip">${esc(nm || '처음 몸')}</span><span>${esc(sd.text)}</span>` : ''}</div>`;
}
function cameHtml() {
  const pr = G.pro || {}, L = NEST.moltLean(G), top = NEST.moltOrder(G)[0], kl = (pr.kinLean || []).map(k => NEST.KIN[k].name), mut = pr.mut && NEST.MUT[pr.mut];
  return M(`함께 온 것 <small class="mute">${['', '첫째', '둘째', '셋째', '넷째', '다섯째'][pr.size || 1]} 몸까지 자랐다</small>`, `${bodyHtml() || '<p class="small mute">몸에 남은 것이 없다.</p>'}
    ${mut ? `<p class="small"><span class="chip on">변이 ${mut.name}</span> ${esc(mut.desc)}</p>` : ''}
    <p class="small">첫 허물은 <b style="color:${ASPCOL[top]}">${NEST.ASP[top]}</b> 쪽으로 기운다${L[top] ? ` <span class="mute">(몸에 남은 것이 ${L[top]}만큼 민다)</span>` : ''}.</p>
    ${kl.length ? `<p class="small">삼킨 것들을 닮아 처음 나흘 동안 <b>${esc(kl.join(', ') + '이(가)')}</b> 자주 돋는다.</p>` : ''}`, closeBtn('둥지를 튼다'));
}
function moltGuess() { const asp = NEST.moltOrder(G)[0], b = NEST.bodyOf(G); return { asp, name: b ? (META.codex.forms[b] ? NEST.FORM1[b].name : '낯선 무언가') : NEST.FORM1[asp].name }; }
function slimePanel() {
  const sl = G.slime, s = NEST.slimeStats(G), need = NEST.K.thresh[sl.stage + 1], tot = NEST.essTotal(G), max = Math.max(1, ...NEST.ASPECTS.map(a => sl.ess[a]), need ? need / 2 : 1), O = NEST.ORIGIN[G.origin || 'drop'];
  const guards = G.kin.filter(m => m.loc === 'core'), bench = G.kin.filter(m => m.loc === null), cap = NEST.capacity(G).core, A = NEST.K.act;
  const list = [['ess', '정수'], ['pow', '능력', sl.muts.length ? '변이 ' + sl.muts.length : null], ['hoard', '탐식'], ['guard', '호위', guards.filter(m => m.kind !== 'spawn').length + '/' + cap]], tab = curTab('core', list);
  let h = phead(esc(NEST.formName(G)), (NEST.formTitle(G) ? '「' + NEST.formTitle(G) + '」 · ' : '') + STAGE_NAME[sl.stage]) + `<div class="slime-top">${slimeImg(sl, 72, NEST.formName(G))}<div class="stack"><p class="small">체력 ${R(sl.hp)}/${R(s.hp)} · 공격 ${R(s.atk)} · 방어 ${R(s.df)}</p>${bar(sl.hp / s.hp)}<p class="small"><span class="only-pc">목숨 ${lifePips()}</span>${G.origin && G.origin !== 'drop' ? ` <span class="chip on">${O.name}</span>` : ''}</p></div></div>
    <div class="row nw">${btn('eat', null, `포식 <small>행동 1 · 먹이 ${G.corpses.length}/${NEST.corpseCap(G)}</small>`, 'pri grow', !G.corpses.length)}${btn('rest', null, '휴식 <small>행동 1</small>', 'grow')}</div>${tabsHtml('core', list, tab)}<div class="tb">`;
  if (tab === 'ess') h += `<div class="pts">${NEST.ASPECTS.map(a => `<span style="color:${ASPCOL[a]}">${NEST.ASP[a]}</span>${bar(sl.ess[a] / max, ASPCOL[a])}<span class="num">${sl.ess[a]}</span>`).join('')}</div>
    <p class="small"><b>합 ${tot}${need ? ' / ' + need : ''}</b> <span class="mute">${sl.stage === 0 ? A + '일째 밤 첫 허물 → <b style="color:' + ASPCOL[moltGuess().asp] + '">「' + moltGuess().name + '」</b>' + (NEST.moltLean(G)[moltGuess().asp] ? ' <small>몸이 +' + NEST.moltLean(G)[moltGuess().asp] + '</small>' : '') : sl.stage === 1 ? A * 2 + '일째 밤, 두 번째로 많은 징조가 섞인다.' : sl.stage === 2 ? A * 3 + '일째 밤에 기준을 넘으면 세 번째 허물을 벗는다.' : sl.stage === 3 ? A * 4 + '일째 밤에 기준을 넘으면 성체가 된다.' : '다 자랐다. 별이 서기를 기다린다.'}</span></p>
    <div class="sec">먹이 <small>포식하면 ${sl.muts.includes('mouth') ? 6 : 3}구씩 정수가 된다</small></div><div class="row">${G.corpses.slice(0, isMobile() ? 4 : 8).map(c => aspChip(NEST.INV[c.kind].asp, NEST.INV[c.kind].name + ' +' + NEST.corpsePts(G, c.kind))).join('') || '<span class="mute small">없음. 쓰러뜨린 침입자가 먹이가 된다.</span>'}${G.corpses.length > (isMobile() ? 4 : 8) ? `<span class="small mute">외 ${G.corpses.length - (isMobile() ? 4 : 8)}</span>` : ''}</div>`;
  if (tab === 'pow') {
    h += bodyHtml();
    h += `<div class="kv small">${G.origin && G.origin !== 'drop' ? `<span class="chip on">${O.name}</span><span><span class="okc">${esc(O.good)}</span> · <span class="up">${esc(O.bad)}</span></span>` : '<span class="chip">형질 없음</span><span class="mute">하는 짓에 따라 몸에 무언가 돋을 수 있다. 한 판에 하나.</span>'}`;
    if (sl.stage >= 1) { const bk = NEST.pk(G), sp = NEST.FORM1[bk].spell; h += `${aspChip(sl.main, NEST.FORM1[bk].name)}<span>${esc(NEST.FORM1[bk].skill)}${sl.stage >= 2 ? ' · <b>' + esc(NEST.FORM2UP[bk]) + '</b>' : ''}</span><span class="chip" style="border-color:#c8a8ff;color:#c8a8ff">주문 ${sp[0]}</span><span>${esc(sp[2])} <span class="mute">(신앙 ${NEST.spellCost(G)})</span></span>`; }
    if (sl.stage >= 2) h += `${aspChip(sl.sub, NEST.ASP[sl.sub] + ' 섞임')}<span>${esc(NEST.SUBTRAIT[sl.sub])}</span>`;
    h += sl.muts.map(m => `${aspChip(NEST.MUT[m].asp, NEST.MUT[m].name)}<span>${esc(NEST.MUT[m].desc)}</span>`).join('') + '</div>';
    if (sl.stage === 0) h += '<p class="small mute">아직 형체가 없다. 허물을 벗으면 능력과 손 주문이 생기고, 그때마다 변이가 하나씩 돋는다.</p>';
  }
  if (tab === 'hoard') h += `<p class="small mute">깔고 앉은 진액을 쓴다. 행동은 들지 않는다. 삼킨 진액은 털리지 않는다.</p><div class="opts">${Object.keys(NEST.HOARD).map(k => { const d = NEST.HOARD[k], n = NEST.hoardN(G, k), why = NEST.hoardWhy(G, k), full = n >= d.max; return opt('hoard', { k }, d.name + (n ? (d.max > 2 ? ' ×' + n : ' ' + n + '/' + d.max) : ''), full ? 0 : NEST.hoardCost(G, k), full ? '다 했다' : why && !why.includes('부족') ? why : d.desc, !!why); }).join('')}</div>`;
  if (tab === 'guard') h += `<div class="units">${guards.map(kinChip).join('') || '<span class="mute small">호위가 없다. 권속이 돋으면 먼저 돋은 것부터 여기를 지킨다.</span>'}</div>${bench.length ? `<div class="row"><span class="small mute">세우기</span>${bench.slice(0, 8).map(m => btn('place', { id: m.id, loc: 'core' }, esc(m.name), 'sm')).join('')}</div>` : ''}${guards.length && G.day >= 4 ? `<div class="row"><span class="small mute">훈련 <small>행동 1</small></span>${[30, 60, 120].map(a => btn('train', { loc: 'core', amt: a * NEST.cm(G) }, a * NEST.cm(G) + '방울', 'sm', G.gold < a * NEST.cm(G))).join('')}</div>` : guards.length ? '<p class="small mute">훈련은 4일째부터.</p>' : ''}
    <p class="small mute">진액은 본체가 깔고 앉아 있다. 여기까지 온 무리는 본체·호위와 싸우고, 본체가 쓰러지면 진액 ${Math.round(NEST.K.rob * (G.origin === 'coin' ? 1.6 : 1) * 100)}%를 들고 간다. ${G.day >= NEST.K.days ? '<b class="up">오늘 밤은 쓰러지면 끝이다.</b>' : NEST.lives(G) > 1 ? '목숨이 하나 남으면 그다음은 끝이다.' : '<b class="up">다음에 쓰러지면 끝이다.</b>'}</p>`;
  return h + '</div>';
}
const ROOM_GROUPS = () => ({ fight: ['post', 'hall', 'bighall', 'ambush', 'trap'], trick: ['decoy', 'shop'].concat(Object.keys(NEST.ROOM).filter(k => NEST.ROOM[k].asp && !NEST.ROOM[k].side)), home: ['prison', 'chapel', 'ritual', 'persuade', 'altar'].concat(Object.keys(NEST.ROOM).filter(k => NEST.ROOM[k].asp && NEST.ROOM[k].side)) });
function cellPanel(i) {
  const c = G.cells[i], cmx = NEST.cm(G);
  if (!c.dug) { const why = NEST.canDig(G, i), pv = NEST.digPreview(G, i), say = { trail: ['떨어지며 지나온 자국이다', '흙이 물러 진액 없이 판다. 이 자국을 따라 맨 위 칸까지 가면 땅 위로 뚫을 수 있다.', 'okc'], side: ['곁방이 된다', '적이 지나가지 않는다. 고치 굴·기도 굴 같은 살림을 두기 좋다.', 'okc'], split: ['길이 갈라진다', '이 칸을 지나는 같은 길이의 길이 하나 더 생긴다. 무리가 나뉘어 들어온다. 적은 흩어지지만 지킬 곳도 늘어난다.', 'warnc'], short: ['지름길이 뚫린다', '본체 방까지 길이 짧아진다. 적은 새 길로만 오고, 지금 길 위의 시설 일부는 곁방이 된다.', 'up'] }[pv]; return phead('단단한 바위', coord(i)) + `${!why && G.buried && G.buried[i] ? '<p class="coin"><b>무언가 묻혀 있다.</b> 파 봐야 무엇인지 안다.</p>' : ''}${why ? `<p class="mute">${esc(why)}</p>` : `<p><b class="${say[2]}">${say[0]}.</b> ${say[1]}</p><div class="row">${btn('dig', { i }, G.cells[i].soft ? '파기 <small>무른 흙 · 진액 안 듦 · 작업 1</small>' : `파기 ${NEST.digCost(G)}방울 <small>작업 1</small>`, 'pri big')}</div>`}`; }
  if (i === NEST.CORE) return slimePanel();
  const d = NEST.ROOM[c.type], side = NEST.sideRooms(G).includes(i), empty = c.type === 'empty', GR = ROOM_GROUPS();
  const here = G.kin.filter(m => m.loc === i), list = [empty ? ['rec', '추천'] : ['here', d.def ? '주둔' : d.traps ? '함정' : '여기', d.def ? here.filter(m => m.kind !== 'spawn').length + '/' + d.def : d.traps ? c.traps.length + '/' + d.traps : null], ['fight', '싸울 자리'], ['trick', '꾀'], ['home', '살림']], tab = curTab('cell', list);
  let h = phead((i === NEST.ENT ? '입구 · ' : '') + d.name, coord(i) + (empty ? '' : ' · Lv' + c.lv), `<span class="chip ${side ? '' : 'on'}" title="${side ? '적이 지나가지 않는다' : '적이 지나간다'}">${side ? '곁방' : '길 위'}</span>`) + tabsHtml('cell', list, tab) + '<div class="tb">';
  const tools = `<div class="row end">${c.type !== 'empty' ? btn('build', { i, v: 'empty' }, '철거', 'sm bad') : ''}${i !== NEST.ENT ? btn('block', { i }, c.block ? '막은 것 트기' : `길 막기 ${20 * cmx}방울`, 'sm') : ''}</div>`;
  const card = (t, why2) => { const r = NEST.ROOM[t]; if (r.asp && r.asp !== (G.slime.main || G.startAsp)) return ''; if (locked(t)) return opt('build', { i, v: t }, r.name, 0, lockText(t), true, 'lockd'); const why = NEST.canBuild(G, i, t); if (why && r.asp && !why.includes('이미')) return ''; return opt('build', { i, v: t }, r.name, NEST.buildCost(G, i, t), why || (why2 || r.desc) + comboHint(i, t), !!why); };
  if (tab === 'here') {
    h += `<p class="small mute clamp2">${esc(d.desc)}</p>`;
    NEST.combos(G).filter(x => x.cells.includes(i)).forEach(x => { h += `<p class="small clamp2"><span class="chip on">조합 ${x.name}</span> ${esc(x.desc)}</p>`; });
    if (d.def) {
      const bench = G.kin.filter(m => m.loc === null), full = here.filter(m => m.kind !== 'spawn').length >= d.def;
      h += `<div class="units">${here.map(kinChip).join('') || '<span class="mute small">비어 있다. 권속이 없으면 적이 그냥 지나간다.</span>'}</div>`;
      if (!full) { const others = G.kin.filter(m => m.loc !== null && m.loc !== i && m.kind !== 'spawn'), pick = bench.concat(others).slice(0, 6); if (pick.length) h += `<div class="row"><span class="small mute">여기를 지켜라</span>${pick.map(m => btn('place', { id: m.id, loc: i }, esc(m.name) + (m.loc === null ? '' : ` <small>← ${m.loc === 'core' ? '본체' : coord(m.loc)}</small>`), 'sm')).join('')}</div>`; }
      if (here.length && G.day >= 4) h += `<div class="row"><span class="small mute">훈련 <small>행동 1</small></span>${[30, 60, 120].map(a => btn('train', { loc: i, amt: a * cmx }, a * cmx + '방울', 'sm', G.gold < a * cmx)).join('')}</div>`;
    }
    if (d.traps) {
      if (d.def) h += `<div class="sec">함정 <small>${c.traps.length}/${d.traps}</small></div>`;
      h += c.traps.map((t, j) => `<div class="row nw"><span class="grow">${NEST.TRAP[t.kind].name} <small class="mute">Lv${t.lv} · ${esc(NEST.TRAP[t.kind].desc)}</small></span>${t.lv < 3 ? btn('uptrap', { i, j }, `강화 ${NEST.trapUpCost(G, t)}방울`, 'sm') : '<span class="small mute">최고</span>'}</div>`).join('');
      if (c.traps.length < d.traps) h += `<div class="opts">${Object.keys(NEST.TRAP).map(k => locked(k) ? opt('trap', { i, v: k }, NEST.TRAP[k].name, 0, lockText(k), true, 'lockd') : opt('trap', { i, v: k }, NEST.TRAP[k].name, NEST.TRAP[k].cost * cmx, NEST.TRAP[k].desc)).join('')}</div><p class="small mute">같은 종류는 하룻밤에 터질 때마다 절반씩 약해진다. 섞어 깔아라.</p>`;
    }
    if (G.slime.main && !c.zone) h += `<div class="row nw">${btn('zone', { i }, `${NEST.ZONE[G.slime.main][0]} 영역 ${30 * cmx}방울`, 'sm')}<span class="small mute clamp2">${esc(NEST.ZONE[G.slime.main][1])}</span></div>`;
    if (c.zone && G.slime.main) h += `<p class="small">${aspChip(G.slime.main, NEST.ZONE[G.slime.main][0] + ' 영역')} ${esc(NEST.ZONE[G.slime.main][1])}</p>`;
    h += tools;
  } else if (tab === 'rec') {
    const have = t => G.cells.some(x => x.dug && x.type === t), guards = G.cells.filter(x => x.dug && NEST.ROOM[x.type].def && x.type !== 'core').length, recs = [];
    if (side) { if (!have('prison')) recs.push(['prison', '무릎 꿇은 것을 고치에 싸 둘 자리가 는다']); if (!have('chapel')) recs.push(['chapel', '신앙이 쌓여 징조를 달래고 주문을 쓴다']); const er = Object.keys(NEST.ROOM).find(k => NEST.ROOM[k].ess && NEST.ROOM[k].side && !locked(k) && !NEST.canBuild(G, i, k) && !have(k)); if (er) recs.push([er, '매일 정수가 고이고, 그 징조의 권속이 돋는다']); if (!recs.length) recs.push(['prison', '포로 자리 +4']); }
    else { if (!guards) recs.push(['post', '가장 싸다. 권속 둘이 길을 막는다']); else recs.push(['hall', '권속 셋이 들어온 적 전원과 싸운다']); if (G.cells.filter(x => x.type === 'trap').length < 2) recs.push(['trap', '권속이 닿기 전에 적을 깎아 둔다']); if (guards) recs.push(['ambush', '함정이 터진 뒤 권속 둘이 덮친다']); }
    const ok = recs.filter(r => !locked(r[0]) && !NEST.canBuild(G, i, r[0])).slice(0, 3);
    h += `<p class="small mute">${side ? '곁방이다. 적이 지나가지 않으니 살림을 두기 좋다.' : '길 위다. 적이 지나가니 싸울 자리나 함정을 둔다.'} <span class="mute">짓는 데 작업 1.</span></p><div class="opts c1">${ok.map(r => card(r[0], r[1])).join('') || '<p class="small warnc">지금 진액으로 지을 만한 것이 없다. 다른 탭에서 전체를 본다.</p>'}</div>${tools}`;
  } else h += `<div class="opts">${GR[tab].filter(t => t !== c.type).map(t => card(t)).join('')}</div>${tab === 'home' && !side ? '<p class="small warnc">살림은 곁방에 지어야 안전하다. 여기는 적이 지나간다.</p>' : ''}`;
  return h + '</div>';
}
function villPanel(v) {
  const d = NEST.VILL[v], s = G.vill[v], open = NEST.actOf(G) >= 2, done = G.d.raided && G.d.raided[v], list = [['info', NEST.folk(G)], ['raid', '습격']], tab = curTab('vill', list), cap = NEST.trustCap(G);
  let h = phead(d.name, villState(v), aspChip(d.asp)) + tabsHtml('vill', list, tab) + '<div class="tb">';
  if (tab === 'info') {
    h += `<p class="small mute">길목 ${d.plot + 1}을 지나 온다 · 보내는 자: ${d.x.map(k => NEST.INV[k].name).filter((x, k, a) => a.indexOf(x) === k).join(', ')}</p><p class="small"><b class="h3">${d.chief[0]}</b> ${esc(d.chief[1])}</p>`;
    if (s.razed) return h + '<p class="mute">남은 것이 없다.</p></div>';
    h += `<div class="kv"><span class="small">적의</span><span class="row nw">${bar(s.host / 100, '#ff5f57')}<span class="num small">${Math.round(s.host)}</span></span>
      <span class="small">섬김</span><span class="row"><b class="coin">${'●'.repeat(s.trust || 0)}</b><span class="mute">${'○'.repeat(Math.max(0, cap - (s.trust || 0)))}</span><span class="mute" style="opacity:.35">${'×'.repeat(NEST.K.trustMax - Math.max(cap, s.trust || 0))}</span><span class="small ${NEST.trading(G, v) ? 'coin' : 'mute'}">${NEST.trading(G, v) ? '오늘 밤 +' + R(NEST.tradeOf(G, v)) + '방울' : s.tribute ? '공물 중에는 쉰다' : '끊김'}</span></span>
      ${s.tribute ? `<span class="small">공물</span><span class="coin small">매일 ${R(s.tribute * (1 + 0.25 * (NEST.fearGrade(G) - 1)))}방울${s.pause ? ` (${s.pause}일 끊김)` : ''}</span>` : ''}</div>
      <p class="small mute">적의가 높은 ${NEST.folk(G)}에서 더 자주 온다(매일 −3, 몸값 받고 돌려보내면 −5). 적의 15 미만이면 날마다 섬김 신뢰가 쌓여 수입이 ${Math.round(NEST.K.trustGain * 100)}%씩 커진다. 하룻밤에 이 ${NEST.folk(G)} 사람 ${NEST.K.trustKills}명 이상을 죽이거나 습격하면 처음부터. 공포가 높을수록 쌓을 수 있는 칸(○)이 준다.</p>`;
  } else {
    if (s.razed) h += '<p class="mute">남은 것이 없다.</p>';
    else if (!open) h += '<p class="mute">습격은 첫 허물을 벗은 뒤(2막)부터 할 수 있다.</p>';
    else h += `<p class="small mute">행동 1 · 그날 밤 본체 방어 −20%${done ? ' · <span class="warnc">오늘은 이미 다녀왔다</span>' : ''}</p><div class="opts c1">${[0, 1, 2].map(l => { const r = NEST.raidInfo(G, v, l); return opt('raid', { v, l }, ['위협', '약탈', '초토화'][l] + ` +${R(r.gold)}방울`, 0, `${NEST.ASP[d.asp]} 정수 +${r.ess}, 공포 +${r.fear}. ` + ['매일 공물 ' + R(r.tribute) + '방울을 바치게 된다. 적의 +15', '공물이 3일 끊기고, 오늘 밤 이 ' + NEST.folk(G) + '에서 온다. 적의 +35', NEST.lx('{마을}이(가) 사라진다. 오늘 밤 30% 더 많이 온다')][l], done); }).join('')}</div>`;
  }
  return h + '</div>';
}
function plotPanel(p) {
  const cur = G.plots[p], c = NEST.cm(G), from = NEST.VIDS.filter(v => NEST.VILL[v].plot === p).map(v => NEST.VILL[v].name).join(', ');
  return phead('길목 ' + (p + 1), NEST.PLOT[cur].name) + `<p class="small mute">${from}에서 오는 무리가 이곳을 지난다. 짓는 데 작업 1.</p><div class="opts">${Object.keys(NEST.PLOT).filter(k => k !== cur).map(k => locked(k) ? opt('plot', { p, v: k }, NEST.PLOT[k].name, 0, lockText(k), true, 'lockd') : opt('plot', { p, v: k }, NEST.PLOT[k].name, NEST.PLOT[k].cost * c, NEST.PLOT[k].desc + (k === 'garden' ? ` (${8 * c}방울)` : ''))).join('')}</div>`;
}
function spotPanel() {
  const sp = G.spot; if (!sp) return phead('지상', '') + '<p class="mute">이미 사라졌다.</p>';
  return phead(NEST.SPOT[sp.type].name, `${sp.left}일 뒤 사라진다 · 행동 1`) + `<p>${esc(NEST.SPOT[sp.type].text)}</p><div class="opts c1">${NEST.spotOptions(G).map((o, i) => opt('spot', { i }, o.label, 0, o.desc, G.ap <= 0)).join('')}</div>${G.ap <= 0 ? '<p class="small warnc">오늘은 행동이 남지 않았다.</p>' : ''}`;
}
function overview() {
  const by = {}; G.kin.forEach(m => { const k = m.loc === null ? 'bench' : m.loc; (by[k] = by[k] || []).push(m); });
  const keys = Object.keys(by).sort((a, b) => (a === 'bench' ? -1 : b === 'bench' ? 1 : 0)), O = NEST.ORIGIN[G.origin || 'drop'];
  return `<div class="ph"><h2>둥지</h2>${btn('log', null, '지난 일', 'sm')}</div>
    <div class="card"><div class="slime-top sm">${slimeImg(G.slime, 56)}<div class="stack"><p class="h3">${esc(NEST.formName(G))} <small class="mute">${STAGE_NAME[G.slime.stage]}${G.slime.look && typeof SEEDS !== 'undefined' && SEEDS[G.slime.look] ? ` · <span title="${esc(NEST.SEEDN[G.slime.look] ? NEST.SEEDN[G.slime.look].text : '')}">${esc(SEEDS[G.slime.look].name)}</span>` : ''}${G.origin && G.origin !== 'drop' ? ' · ' + O.name : ''}</small></p>${bar(G.slime.hp / NEST.slimeStats(G).hp)}<div class="row">${NEST.ASPECTS.filter(a => G.slime.ess[a] > 0).map(a => aspChip(a, NEST.ASP[a] + ' ' + G.slime.ess[a])).join('')}${btn('core', null, '본체 열기', 'sm')}</div></div></div></div>
    ${G.sign && NEST.SIGN[G.sign] ? `<p class="small clamp2"><span class="chip" style="border-color:${ASPCOL[NEST.SIGN[G.sign].asp]};color:${ASPCOL[NEST.SIGN[G.sign].asp]}">${NEST.SIGN[G.sign].name}</span> ${esc(NEST.STAR[G.star].name + ': ' + NEST.STAR[G.star].desc)}</p>` : G.star && G.star !== 'none' ? `<p class="small clamp2"><span class="chip on">${NEST.STAR[G.star].name}</span> ${esc(NEST.STAR[G.star].desc)}</p>` : ''}
    ${G.world && NEST.WORLD[G.world] ? `<p class="small clamp2"><span class="chip on">${NEST.WORLD[G.world].name} · ${NEST.WORLD[G.world].rule.name}</span> ${esc(NEST.WORLD[G.world].rule.bane + ' · ' + NEST.WORLD[G.world].rule.boon)}</p>${worldMore(NEST.WORLD[G.world])}` : ''}
    ${G.gods || G.auto ? godsRow() : ''}
    <div class="sec">권속 ${G.kin.length}명 <small>하루 끼니 ${R(G.kin.reduce((a, m) => a + NEST.salary(G, m), 0))}방울 · 방 유지 ${R(NEST.upkeep(G))}방울</small></div>
    <div class="rooms">${keys.map(k => `<span class="small ${k === 'bench' ? 'warnc' : 'mute'}">${k === 'bench' ? '대기 (안 싸움)' : esc(locName(k === 'core' ? 'core' : +k))}</span><div class="units">${by[k].map(kinMini).join('')}</div>`).join('') || '<span class="mute small" style="grid-column:1/-1">아직 아무도 없다. 아침마다 몸에서 돋으려는 것이 생긴다.</span>'}</div>
    <p class="small mute">지도에서 칸·${G.sealed ? '땅 위' : NEST.folk(G)}·길목을 누르면 여기에 할 일이 나온다. <kbd>Tab</kbd> 지상·지하 · <kbd>E</kbd> 밤 맞기 · <kbd>Esc</kbd> 선택 해제</p>`;
}
function view() {
  const s = UI.sel; let h;
  if (!s) h = overview(); else if (s.t === 'cell') h = cellPanel(s.i); else if (s.t === 'vill') h = villPanel(s.v); else if (s.t === 'spot') h = spotPanel(); else h = plotPanel(s.p);
  $('view').innerHTML = h;
  if (G.auto) $('foot').innerHTML = `<p class="small mute">교시 <b style="color:${G.edict ? ASPCOL[NEST.EDICT[G.edict].god] : 'inherit'}">「${G.edict ? NEST.EDICT[G.edict].name : '아직'}」</b> · ${AUTO.paused ? '멈춰 있다' : '권속들이 일하는 중'}</p><span class="bar"><i style="width:${Math.round(100 * AUTO.i / Math.max(1, AUTO.n))}%;background:var(--coin)"></i></span><div class="row nw"><button class="btn pri big grow" data-a="autopause">${AUTO.paused ? '▶ 다시 흐르게' : '⏸ 멈춤'} <kbd>E</kbd></button>${[1, 2, 4].map(v => btn('autospeed', { v }, v + '배', AUTO.speed === v ? 'on' : '')).join('')}</div>`;
  else $('foot').innerHTML = `${G.sealed ? `<p class="small mute">${NEST.paths(G).length ? '굴이 막혀 있다. 아무도 오지 않지만 먹이도 없다.' : '땅 밑에 갇혀 있다. 무른 흙을 따라 ' + NEST.trailLeft(G) + '칸 더 파 올라가야 뚫을 수 있다.'} 숨은 밤마다 정수 +${NEST.K.deep.ess}${NEST.underRisk(G) ? ` · <span class="warnc">오늘 밤 들킬 위험 ${Math.round(NEST.underRisk(G) * 100)}%</span>` : ''}</p><button class="btn big" data-a="breach">땅 위로 뚫는다</button>` : ''}${UI.confirmEnd ? `<p class="small warnc">행동이 ${G.ap} 남았다. 남기면 본체가 그만큼 쉰다. 한 번 더 누르면 밤이 된다.</p>` : ''}<button class="btn pri big" data-a="endday">${G.sealed ? '땅속에서 밤을 보낸다' : NEST.isSettle(G) ? '달이 기우는 밤을 맞는다' : '밤을 맞는다'} <kbd>E</kbd></button>`;
  const open = isMobile() && !!s && ST.mode === 'day'; $('right').classList.toggle('open', open);
  if (!open) ST.cover = 0; else requestAnimationFrame(() => { const a = $('stage').getBoundingClientRect(), r = $('right').getBoundingClientRect(); ST.cover = $('right').classList.contains('open') ? Math.max(0, a.bottom - r.top) : 0; });
}
function render() {
  if (!G) return; checkFeats(); hud(); tray(); view(); coach(); if (UI.featMsg && ST.mode === 'day' && $('modal').hidden) toast(null);
  META.codex.forms[NEST.formId(G)] = 1; if (G.slime.stage >= 1) for (let q = 1; q <= G.slime.stage; q++) META.codex.sp[NEST.pk(G) + q] = 1; G.slime.muts.forEach(m => { META.codex.muts[m] = 1; });
  document.documentElement.style.setProperty('--route', G.slime.main ? ASPCOL[G.slime.main] : '#e8c030');
}

// ---------- 창 ----------
let modalRes = null, modalKind = null;
function modal(html, wide, kind) { modalKind = kind || null; $('modal').innerHTML = `<div class="sheet${wide ? ' wide' : ''}">${html}</div>`; $('modal').hidden = false; return new Promise(res => { modalRes = res; }); }
function closeModal(v) { $('modal').hidden = true; $('modal').innerHTML = ''; modalKind = null; UI.mfn = null; const r = modalRes; modalRes = null; if (r) r(v); }
// 판과 상관없는 창(도감, 기록…): 탭을 바꾸면 같은 창을 다시 그린다
function openM(fn, wide) { UI.mfn = { fn, wide }; const p = modal(fn(), wide, 'static'); UI.mfn = { fn, wide }; return p; }
function redrawM() { if (UI.mfn && !$('modal').hidden) { $('modal').innerHTML = `<div class="sheet${UI.mfn.wide ? ' wide' : ''}">${UI.mfn.fn()}</div>`; if ($('cloudboard')) fillCloudBoard(); } }
const closeBtn = label => btn('close', null, label || '닫기');
function applicantsHtml() {
  if (!G.applicants.length) return M('돋는 것', '<p class="mute">오늘은 더 없다. 내일 아침 또 돋는다.</p>', closeBtn());
  return M('몸에서 돋으려는 것들 <small class="mute">행동은 들지 않는다 · 안 돋우면 내일 사라진다</small>', `<div class="pick3">${G.applicants.map((a, i) => {
    const d = NEST.KIN[a.kind], cost = NEST.acceptCost(G, a), slot = NEST.freeSlot(G, a.kind), lv = Math.max(1, NEST.actOf(G) * 3 - 2) + (a.rare ? 2 : 0), g = Math.pow(NEST.K.lvGrowth, lv - 1) * (a.rare ? 1.4 : 1);
    return `<div class="card pcard${a.rare ? ' rare' : ''}">${kinImg(a.kind, 64)}<b class="h3">${a.rare ? '희귀 ' : ''}${d.name} <small class="mute">"${esc(a.name)}" Lv${lv}</small>${d.satk || a.kind === 'netter' ? ' <span class="chip good" title="적을 죽이지 않고 꺾어 포로로 만든다">생포</span>' : ''}${NEST.KASP[a.kind] ? ' ' + aspChip(NEST.KASP[a.kind], NEST.ASP[NEST.KASP[a.kind]]) : ''}</b><span class="small">체력 ${R(d.hp * g)} · 공격 ${R(d.atk * g)} · 방어 ${R(d.df * g)}${d.satk ? ' · 정신 ' + R(d.satk * g) : ''}</span><span class="small mute clamp2">${esc(d.note || '평범하게 싸운다')}</span><span class="small mute">끼니 ${R(NEST.salary(G, { kind: a.kind, lv }))}방울${d.eat ? ' + 먹이' : ''} · <span class="${slot === null ? 'warnc' : 'okc'}">${slot === null ? '설 자리 없음 (대기)' : '설 자리 있음'}</span></span>${btn('accept', { i }, `돋운다 ${cost}방울`, 'pri', G.gold < cost)}</div>`;
  }).join('')}</div>`, closeBtn('나중에'));
}
function captivesHtml() {
  if (!G.prison.length) return M('포로', '<p class="mute">남은 포로가 없다.</p>', closeBtn());
  return M(`포로 <small class="mute">${G.prison.length}/${NEST.prisonCap(G)} · 밥값 하루 한 명당 ${NEST.cm(G)}방울 · 처분에 행동은 들지 않는다</small>`,
    `<p class="small mute"><b class="coin">몸값</b> 진액을 받고 그 ${NEST.folk(G)}의 적의 −5, 섬김 신뢰 +1 · <b style="color:#c8a8ff">제물</b> 정수·신앙·공포, 변이 기회 · <b class="okc">개종</b> 성공하면 권속이 되고 실패하면 달아난다</p>` +
    pager('cap', G.prison.map((p, i) => [p, i]), isMobile() ? 7 : 9, items => `<div class="stack" style="gap:4px">${items.map(([p, i]) => { const d = NEST.INV[p.kind]; return `<div class="caprow">${invImg(p.kind, 32)}<span class="clamp1"><b class="h3">${d.name}</b> <small class="only-pc" style="color:${ASPCOL[d.asp]}">${NEST.ASP[d.asp]}</small> <small class="mute only-pc">${p.vill ? NEST.VILL[p.vill].name : ''}</small></span>${btn('dispose', { i, how: 'ransom' }, `<span class="coin">+${NEST.ransomOf(G, p.kind, (p.bonus || 1) * (p.vill === 'gaet' ? 1.5 : 1))}방울</span>`, '')}${btn('dispose', { i, how: 'sacrifice' }, `<span style="color:${ASPCOL[d.asp]}">제물<span class="only-pc"> ${NEST.ASP[d.asp]} +${NEST.sacEss(G, p.kind)}</span></span>`, '')}${btn('dispose', { i, how: 'convert' }, `<span class="okc">개종 ${Math.round(NEST.convertChance(G, p.kind) * 100)}%</span>`, '')}</div>`; }).join('')}</div>`),
    btn('disposeall', null, '전부 몸값 받고 풀어 준다', '') + closeBtn());
}
function guestHtml() {
  const g = NEST.GUEST[G.guest.type], o = NEST.guestOptions(G);
  return M('오늘 밤 손님 · ' + esc(g.name), `<p>${esc(g.text)}</p><p class="small mute">오늘 밤은 침입이 없다. 고르지 않고 밤을 맞으면 맨 아래 것으로 정해진다. 행동은 들지 않는다.</p><div class="opts c1">${o.map((x, i) => `<button class="btn opt" data-a="guest" data-i="${i}"${x.why || x.cost > G.gold ? ' disabled' : ''}><b>${esc(x.label)}${x.cost ? ` <span class="coin">${x.cost}방울</span>` : ''}</b><span class="small mute">${esc(x.why || x.desc)}</span></button>`).join('')}</div>`, closeBtn('나중에'));
}
const comboHint = (i, t) => { for (const id in NEST.COMBO) { const c = NEST.COMBO[id], near = k => NEST.nbrs(i).some(j => j !== i && G.cells[j].dug && G.cells[j].type === k); if ((c.a === t && near(c.b)) || (c.b === t && near(c.a))) return META.codex.combos[id] ? ' ★ 조합 「' + c.name + '」' : ' ★ 옆 시설과 맞물린다'; } return ''; };
function eventHtml() {
  const e = NEST.eventInfo(G), o = NEST.eventOptions(G);
  return M(esc(e.title), `<p>${esc(e.text)}</p><div class="opts c1">${o.map((x, i) => `<button class="btn opt" data-a="event" data-i="${i}"${x.why || x.cost > G.gold ? ' disabled' : ''}><b>${esc(x.label)}${x.cost ? ` <span class="coin">${x.cost}방울</span>` : ''}</b>${x.why || x.desc ? `<span class="small mute">${esc(x.why || x.desc)}</span>` : ''}</button>`).join('')}</div>`);
}
function kinHtml(id) {
  const m = G.kin.find(x => x.id === id); if (!m) return M('권속', '<p class="mute">떠난 권속이다.</p>', closeBtn());
  const d = NEST.KIN[m.kind], s = NEST.kinStats(G, m), cap = NEST.capacity(G);
  const slots = Object.keys(cap).map(k => k === 'core' ? k : +k).filter(k => !(m.pin && k === m.loc) && G.kin.filter(x => x !== m && x.loc === k && x.kind !== 'spawn' && x.pin).length < cap[k]);
  const list = [['move', '자리'], ['skill', '기술·방침'], ['evo', '진화'], ['fuse', '합체', (m.parts || []).length + '/' + NEST.K.fuse.max]], tab = curTab('kin', list);
  let b = `<div class="slime-top sm">${kinImgM(m, 56)}<div class="stack" style="gap:3px"><div class="xp"><i style="width:${Math.min(100, m.exp / NEST.expNeed(m.lv) * 100)}%"></i></div><p class="small">체력 ${R(s.hp)} · 공격 ${R(s.atk)} · 방어 ${R(s.df)}${s.satk ? ' · 정신 ' + R(s.satk) : ''} · 끼니 ${R(NEST.salary(G, m))}방울${d.eat ? ' + 먹이' : ''}</p><p class="small mute clamp2">${esc(d.note || '')}</p>${NEST.recipesOf(m).map(r => `<p class="small"><span class="chip on">★ ${NEST.RECIPE[r].name}</span> ${esc(NEST.RECIPE[r].desc)}</p>`).join('')}<p class="small">지금 <b>${esc(locName(m.loc))}</b>${m.kind === 'spawn' ? '' : m.pin ? ` <span class="chip on">지킴${m.loc !== null && NEST.holdBonus(m) ? ' +' + Math.round(NEST.holdBonus(m) * 100) + '%' : ''}</span>` : ' <span class="chip">제멋대로</span>'}${m.hurt ? ' · <span class="up">부상 ' + m.hurt + '일 (휴식하면 복귀)</span>' : ''}${m.strike ? ' · <span class="warnc">끼니를 못 받아 오늘 밤 쉰다</span>' : ''}</p></div></div>${tabsHtml('kin', list, tab)}<div class="tb">`;
  if (tab === 'move') b += m.kind === 'spawn' ? '<p class="small mute">움은 본체 곁에 붙어 있다. 시킬 수 없다.</p>' : `<p class="small ${m.pin ? 'coin' : 'mute'}">${m.pin ? (m.loc === null ? '쉬라고 해 두었다. 싸우지 않는다.' : `지키라고 한 자리에 뿌리를 내렸다. 뿌리내림 ${Math.min(NEST.K.hold.max, m.hold || 0)}/${NEST.K.hold.max} · 능력 +${Math.round(NEST.holdBonus(m) * 100)}%. 밤마다 +${Math.round(NEST.K.hold.per * 100)}%씩, 옮기거나 풀어 주면 처음부터다.`) : `제 마음대로 다닌다. 밤이 오면 스스로 자리를 잡는다. 지키라고 시키면 그 자리에 뿌리를 내려 밤마다 +${Math.round(NEST.K.hold.per * 100)}%씩 세진다 (최대 +${Math.round(NEST.K.hold.per * NEST.K.hold.max * 100)}%). 붙들어 둔 권속 ${NEST.pinned(G)}/${NEST.pinCap(G)}.`}</p><div class="opts">${m.pin ? btn('release', { id: m.id }, '풀어 준다 <small>제 자리를 찾아간다</small>', 'on') : ''}${slots.map(k => btn('place', { id: m.id, loc: k }, '지켜라 · ' + esc(locName(k)), '')).join('')}${m.pin && m.loc === null ? '' : btn('place', { id: m.id, loc: 'bench' }, '쉬어라', '')}</div>`;
  if (tab === 'skill') b += `${d.skills.length ? `<div class="opts c1">${d.skills.map((k, i) => `<button class="btn opt${m.skill === i ? ' on' : ''}" data-a="skill" data-id="${m.id}" data-i="${i}"${m.lv < NEST.SKILL_LV[i] ? ' disabled' : ''}><b>${esc(k[0])} <small class="mute">Lv${NEST.SKILL_LV[i]}부터</small></b><span class="small mute">${esc(k[1])}</span></button>`).join('')}</div>` : '<p class="small mute">기술이 없다.</p>'}${m.kind !== 'spawn' ? `<div class="row nw">${btn('stance', { id: m.id, v: 'careful' }, '신중 <small>체력 30%에 물러남</small>', 'grow' + (m.stance !== 'hold' ? ' on' : ''))}${btn('stance', { id: m.id, v: 'hold' }, '사수 <small>끝까지</small>', 'grow' + (m.stance === 'hold' ? ' on' : ''))}</div>` : ''}`;
  if (tab === 'evo') b += m.kind === 'spawn' ? `<p class="${m.evo ? 'okc' : 'mute'}">${m.evo ? '큰 움으로 자랐다. 능력치 1.5배.' : '나흘을 살아남으면 저절로 큰 움으로 자란다. 지금 ' + (m.age || 0) + '일째.'}</p>` : !NEST.EVO[m.kind] ? '<p class="mute">더 자라지 않는다.</p>' : m.evo ? `<p class="okc"><b>${NEST.EVO[m.kind]}</b> — ${esc(NEST.EVO_DESC[m.kind])}. 능력치·끼니 1.5배.</p>` : `<div class="row nw">${kinImg(m.kind, 56, true)}<p class="grow"><b class="h3">${NEST.EVO[m.kind]}</b><br><span class="small ${m.lv < 5 ? 'mute' : 'okc'}">${esc(NEST.EVO_DESC[m.kind])}. 능력치와 끼니 1.5배.</span></p></div><div class="row">${btn('kinevo', { id: m.id }, `진화시킨다 ${NEST.evoCost(G)}방울`, 'pri', m.lv < 5 || G.gold < NEST.evoCost(G))}<span class="small mute">${m.lv < 5 ? '레벨 5부터. 지금 Lv' + m.lv : '행동은 들지 않는다'}</span></div>`;
  if (tab === 'fuse') {
    const full = (m.parts || []).length >= NEST.K.fuse.max, mats = G.kin.filter(x => x !== m && !(x.parts && x.parts.length)).sort((p, q) => (p.loc === null ? 0 : 1) - (q.loc === null ? 0 : 1) || q.lv - p.lv), sh = NEST.K.fuse.share;
    b += `${(m.parts || []).length ? `<p class="small">붙은 것: ${m.parts.map(p => `<span class="chip on">${esc(p.name)} · ${NEST.KIN[p.kind].name} Lv${p.lv}</span>`).join(' ')}</p>` : ''}<p class="small mute">다른 권속을 이 몸에 붙인다. 붙은 쪽은 사라지고 그 능력의 ${Math.round(sh * 100)}%가 남는다(끼니도 그만큼). ${NEST.fuseCost(G)}방울 · 행동은 들지 않는다 · 되돌릴 수 없다.</p><p class="small">한 번에 붙잡는 적 <b>${2 + (m.parts || []).length}명</b>${full ? '' : ' → 붙이면 <b class="okc">' + (3 + (m.parts || []).length) + '명</b>'} <span class="mute">(권속 한 명은 둘, 붙은 것 하나마다 +1. 따로 세워 두면 한 명당 둘씩이니, 자리가 남으면 따로 두는 쪽이 더 많이 붙잡는다)</span></p>`;
    if (m.kind === 'spawn') b += '<p class="small warnc">움은 다른 것을 붙이지 못한다. 재료는 될 수 있다.</p>';
    else if (full) b += '<p class="small okc">더는 붙일 자리가 없다.</p>';
    else b += pager('fuse', mats, 6, items => `<div class="opts">${items.map(x => { const d2 = NEST.KIN[x.kind], g2 = Math.pow(NEST.K.lvGrowth, x.lv - 1) * (x.rare ? 1.4 : 1) * (x.evo ? 1.5 : 1) * sh; return `<button class="btn opt" data-a="fuse" data-id="${m.id}" data-b="${x.id}"${NEST.fuseWhy(G, m.id, x.id) ? ' disabled' : ''}><b>${esc(x.name)} <small class="mute">${NEST.baseName(x)} Lv${x.lv}</small></b><span class="small mute">체력 +${R(d2.hp * g2)} · 공격 +${R(d2.atk * g2)}${d2.satk ? ' · 정신 +' + R(d2.satk * g2) : ''}${x.loc !== null ? ' · <span class="warnc">' + esc(locName(x.loc)) + '의 자리가 빈다</span>' : ''}${NEST.fusePreview(G, m.id, x.id).map(r => META.codex.rcp[r] ? ' <b class="coin">★ ' + NEST.RECIPE[r].name + '</b>' : ' <b class="coin">★ 무언가 특별한 것이 될 것 같다</b>').join('')}</span></button>`; }).join('') || '<span class="small mute">붙일 권속이 없다.</span>'}</div>`);
  }
  return M(`${esc(m.name)} <small class="mute">${m.rare ? '희귀 ' : ''}${NEST.kinName(m)} · Lv${m.lv}${m.legacy ? ' · 명부' : ''}</small>`, b + '</div>', btn('dismiss', { id: m.id }, '도로 삼킨다', 'sm bad') + btn('open', { v: 'roster' }, '권속 목록') + closeBtn());
}
function rosterHtml() { return M(`권속 ${G.kin.length}명 <small class="mute">알아서 자리를 잡는다 · 눌러서 지킬 곳을 시킨다</small>`, pager('roster', G.kin, isMobile() ? 14 : 18, items => `<div class="units ${isMobile() ? 'g2' : 'g3'}">${items.map(m => kinChip(m).replace('</small></span></button>', ` · ${esc(m.loc === null ? '대기' : m.loc === 'core' ? '본체' : coord(m.loc))}${m.pin ? ' 지킴' : ''}</small></span></button>`)).join('') || '<span class="mute">아직 아무도 없다.</span>'}</div>`), closeBtn()); }
const omenLines = om => `${om.tier !== 'bane' ? `<p class="okc small">＋ ${esc(NEST.OMEN[om.id].boon)}</p>` : ''}${om.tier !== 'boon' ? `<p class="${om.calmed ? 'mute' : 'up'} small">－ ${esc(NEST.OMEN[om.id].bane)}${om.calmed ? ' (달랬다)' : ''}</p>` : ''}`;
function elderHtml() {
  const e = NEST.ELDER[G.eld.id], f = G.eld.favor, col = ASPCOL[G.eld.id], om = G.omen, live = om && om.tier !== 'boon' && !om.calmed, tl = G.eld.tally;
  return M(`<span style="color:${col}">「${e.name}」</span> <small class="mute">이번 판을 지켜보는 옛 것</small>`, `${om ? `<div class="card in"><p class="h3">오늘의 징조 · ${NEST.OMEN[om.id].name}</p>${omenLines(om)}${live ? `<div class="row">${btn('calm', null, `신앙 ${NEST.CALM_COST}을 바쳐 나쁜 쪽을 달랜다`, 'pri', G.faith < NEST.CALM_COST)}<span class="small mute">지금 신앙 ${Math.floor(G.faith)}</span></div>` : ''}</div>` : '<p class="mute">오늘은 조용하다.</p>'}
    <div class="row"><span>눈길</span><span class="favor">${[-3, -2, -1, 0, 1, 2, 3].map(v => `<i class="${v === f ? 'now' : ''}${v <= -2 ? ' bad' : v >= 2 ? ' good' : ''}"></i>`).join('')}</span><span class="small ${f >= 2 ? 'okc' : f <= -2 ? 'up' : 'mute'}">${f >= 2 ? '마음에 들어 한다 — 좋은 쪽만 온다' : f <= -2 ? '눈 밖에 났다 — 나쁜 쪽만 온다' : '지켜보는 중 — 둘 다 온다'}</span></div>
    <p class="small">좋아하는 짓 ${e.likes.map(a => `<span class="chip good">${NEST.ACT_NAME[a]}</span>`).join(' ')}</p><p class="small">싫어하는 짓 ${e.hates.map(a => `<span class="chip fake">${NEST.ACT_NAME[a]}</span>`).join(' ')}</p>
    <p class="small mute">${esc(e.text)} 눈길은 하루에 한 칸만 움직인다. 오늘 한 짓: ${tl > 0 ? '<span class="okc">좋게 보고 있다</span>' : tl < 0 ? '<span class="up">못마땅해한다</span>' : '아직 별 반응이 없다'}. 마지막 밤, 눈길이 끝에 가 있으면 네 편을 들거나 봉인단 편을 든다.</p>`, closeBtn());
}
function logHtml() { return M('지난 일', `<div class="stack" style="gap:3px">${G.log.slice(-12).reverse().map(s => `<p class="small">${esc(s)}</p>`).join('') || '<p class="mute">아직 아무 일도 없었다.</p>'}</div>`, closeBtn()); }
function openModal(kind) {
  if (kind === 'elder') return modal(elderHtml(), false, kind);
  if (kind === 'log') return modal(logHtml(), false, kind);
  if (kind === 'guest') return G.guest ? modal(guestHtml(), false, kind) : Promise.resolve();
  const html = kind === 'applicants' ? applicantsHtml() : kind === 'captives' ? captivesHtml() : kind === 'event' ? eventHtml() : kind === 'roster' ? rosterHtml() : kind.startsWith('kin:') ? kinHtml(+kind.slice(4)) : '';
  return modal(html, kind === 'applicants' || kind === 'captives' || kind === 'roster', kind);
}
function refreshModal() { if (!modalKind || modalKind === 'static' || $('modal').hidden) return; const k = modalKind, r = modalRes; if ((k === 'event' && !G.event) || (k === 'guest' && !G.guest)) return closeModal(); if (!G || ['setup', 'legacy', 'result'].includes(k)) return; openModal(k); modalRes = r; }
function settleHtml(b, st, day) {
  const L = st.ledger || {}, rows = Object.keys(L).filter(k => Math.round(L[k])).map(k => `<span>${esc(k)}</span><span class="num ${L[k] >= 0 ? 'coin' : 'up'}">${L[k] >= 0 ? '+' : ''}${R(L[k])}</span>`), tot = Object.values(L).reduce((a, x) => a + x, 0);
  let h = '';
  if (b) h += `<div class="card"><p class="h3 ${b.result === 'repel' ? 'okc' : 'up'}">${{ repel: '격퇴', stolen: '본체가 쓰러져 진액을 털렸다', core: '본체가 쓰러졌다' }[b.result]} <small class="mute">${NEST.VILL[b.vill].name} · ${b.gname} ${b.count}명</small></p><p class="small">쓰러뜨림 ${b.kills} · 무릎 꿇음 <b style="color:#c8a8ff">${b.captives.length}</b> · 달아남 ${b.fled}${b.gold ? ` · 지닌 것 <span class="coin">+${R(b.gold)}방울</span>` : ''}${b.loot ? ` · <span class="up">털림 −${R(b.loot)}방울</span>` : ''}</p>${b.result === 'stolen' ? `<p class="small warnc">본체는 체력 30%로 다시 일어났다. ${b.lives > 1 ? '앞으로 ' + (b.lives - 1) + '번은 더 일어날 수 있다.' : '다음에 쓰러지면 끝이다.'}</p>` : ''}${(b.trustLost || []).map(t => `<p class="small warnc">${NEST.VILL[t.v].name}의 섬김 신뢰가 끊겼다 (${t.n}명이 돌아오지 못했다).</p>`).join('')}${b.hurt.length ? `<p class="small up clamp2">부상: ${esc(b.hurt.join(', '))} (이틀 쉼)</p>` : ''}${b.off.length ? `<p class="small warnc">뒤집힌 곁방: ${b.off.map(i => NEST.ROOM[G.cells[i].type].name).join(', ')}</p>` : ''}</div>`;
  else h += '<p class="mute">아무도 오지 않았다.</p>';
  if (rows.length % 2) rows.push('<span></span><span></span>');
  h += `<div class="ledger">${rows.join('') || '<span class="mute">드나든 진액 없음</span><span></span><span></span><span></span>'}<span class="tot l">하루 합계</span><span class="tot num ${tot >= 0 ? 'coin' : 'up'}">${tot >= 0 ? '+' : ''}${R(tot)}방울</span></div>`;
  const bits = []; if (st.faith) bits.push(`<span style="color:#c8a8ff">신앙 +${st.faith}</span>`); Object.keys(st.ess || {}).forEach(a => bits.push(aspChip(a, NEST.ASP[a] + ' +' + st.ess[a])));
  if (bits.length) h += `<p class="small row">${bits.join(' ')}</p>`;
  if (st.omen && G.eld) h += `<div class="card in"><p class="h3"><span style="color:${ASPCOL[G.eld.id]}">내일의 징조</span> · ${NEST.OMEN[st.omen.id].name}${st.favor > 0 ? ' <small class="okc">눈길 +1</small>' : st.favor < 0 ? ' <small class="up">눈길 −1</small>' : ''}</p>${omenLines(st.omen)}</div>`;
  if (UI.featNew && UI.featNew.length) { h += `<div class="stack" style="gap:2px">${UI.featNew.map(f => `<p class="okc small">새 흔적 「${f[1]}」 — ${featGain(f)}</p>`).join('')}</div>`; UI.featNew = []; UI.featMsg = ''; }
  if (st.notes.length) h += `<div class="stack" style="gap:2px">${st.notes.slice(0, 4).map(n => `<p class="small warnc">${esc(n)}</p>`).join('')}</div>`;
  if (st.evoCheck) h += `<div class="card"><p><b class="h3">달이 기울었다</b> 정수 ${st.evoCheck.tot} / ${st.evoCheck.need} — ${st.evolved ? '<b class="okc">허물을 벗는다!</b>' : '<span class="up">모자라다. 이번에는 변하지 못했다.</span>'}</p>${st.evoCheck.ate ? `<p class="small mute clamp1">남은 먹이를 모두 삼켰다: ${esc(st.evoCheck.ate)}</p>` : ''}</div>`;
  return M(day + '일째 밤이 지났다', h, btn('close', null, G.over ? '계속' : st.evolved ? '변한다' : '아침을 맞는다', 'pri big'));
}
function evoHtml(st, before) {
  const sl = G.slime, lines = [];
  const bk = NEST.pk(G);
  if (sl.stage === 1) { if (sl.body) lines.push('평범한 허물이 아니다. ' + NEST.BODY[sl.body].hint + ' 이렇게 된다'); lines.push(NEST.FORM1[bk].skill); lines.push('손 주문 「' + NEST.FORM1[bk].spell[0] + '」: ' + NEST.FORM1[bk].spell[2]); lines.push(NEST.ASP[sl.main] + ' 징조 전용 시설과 영역을 지을 수 있다'); }
  if (sl.stage === 2) { lines.push(NEST.FORM2UP[bk]); lines.push(NEST.ASP[sl.sub] + ' 섞임: ' + NEST.SUBTRAIT[sl.sub]); }
  if (sl.stage === 3) lines.push('허물 속에서 나온 것은 아까의 그것이 아니다. 체력·공격·방어가 크게 오른다');
  if (sl.stage === 4) lines.push('다 자랐다. 굴 하나가 몸으로 가득 찬다. 체력·공격·방어가 다시 크게 오른다');
  return `<div class="mbody evo" style="align-items:center;text-align:center"><p class="mute">${STAGE_NAME[sl.stage]}</p><div class="row" style="justify-content:center;gap:20px">${slimeImg(before, isMobile() ? 80 : 96, '이전 모습')}<span class="h3 mute">→</span>${slimeImg(sl, isMobile() ? 112 : 128, NEST.formName(G))}</div><h2 style="font-size:var(--d2);color:${ASPCOL[sl.main]}">${esc(NEST.formName(G))}</h2>${NEST.formTitle(G) ? `<p class="small mute">「${esc(NEST.formTitle(G))}」</p>` : ''}<div class="row" style="justify-content:center">${aspChip(sl.main, '주 ' + NEST.ASP[sl.main])}${sl.sub ? aspChip(sl.sub, '부 ' + NEST.ASP[sl.sub]) : ''}</div>${lines.map(l => `<p class="small">${esc(l)}</p>`).join('')}${st.mut ? `<p class="small">${aspChip(NEST.MUT[st.mut].asp, '변이: ' + NEST.MUT[st.mut].name)} ${esc(NEST.MUT[st.mut].desc)}</p>` : ''}<p class="small up">인간들 사이에 소문이 돈다. 공포 +10</p></div><div class="mfoot">${btn('close', null, '좋다', 'pri big')}</div>`;
}
function resultHtml(sc, unlocked) {
  const win = G.over.win, av = NEST.avatarOf(G), key = !win ? null : NEST.endKey(G), tier = endTier(sc.grade), e3 = win && ENDING3[key] ? ENDING3[key][tier].map(NEST.lx) : null;
  const list = win ? [['end', '결말'], ['score', '점수']] : [['score', '점수']], tab = curTab('result', list);
  const wl = G.world && NEST.WORLD[G.world] ? `<p class="small mute">${esc(NEST.WORLD[G.world].end[win ? 0 : 1])}</p>` : '';
  let b = (win ? tabsHtml('result', list, tab) : '') + '<div class="tb" style="align-items:center;text-align:center">';
  if (tab === 'end') b += `${G.slime.main ? '<canvas id="endcv" class="px" width="192" height="108"></canvas>' : slimeImg(G.slime, 128)}<h2 style="font-size:var(--d2)">${esc(av)}</h2>${e3 ? `<p class="h3 coin">결말 · ${e3[0]}</p><p class="endtxt small">${esc(e3[1])}</p>${wl}<p class="small mute">${['점수가 더 높으면 이 일은 더 멀리 번진다.', '점수가 더 높으면 이 일은 끝까지 간다.', '이 모습으로 갈 수 있는 가장 먼 곳.'][tier]}</p>` : `<p class="endtxt small">${esc(ENDING[key])}</p>${wl}`}`;
  else b += `<div class="row nw" style="gap:14px;justify-content:center">${win ? '' : slimeImg(G.slime, 96)}<div><div class="grade">${sc.grade}</div><p class="coin h3">${R(sc.total)}점</p></div></div><p class="small mute">${win ? '별이 서는 밤을 넘겼다' : esc(G.over.why)} · ${G.day}일 · ${NEST.DIFF[G.diff].name}${G.sign && NEST.SIGN[G.sign] ? ' · ' + NEST.SIGN[G.sign].name : ''}</p><div class="row nw" style="align-items:flex-start;text-align:left">${echoImg(32)}<p class="small">${esc(GRADE_SAY[sc.grade])}</p></div>${win ? '' : wl}
    <div class="ledger" style="width:100%;text-align:left">${(() => { const r = sc.parts.filter(p => p[1]).map(p => `<span>${p[0]}</span><span class="num">${R(p[1])}</span>`); if (r.length % 2) r.push('<span></span><span></span>'); return r.join(''); })()}<span class="tot l">배수 (${NEST.DIFF[G.diff].name}${win ? '' : ' · 실패'})</span><span class="tot num">×${sc.mult.toFixed(2)}</span></div>
    <p class="small"><span class="coin">별가루 +${UI.dustGain || 0}</span>${(UI.grown || []).slice(0, 2).map(g => ` · <span class="okc">${esc(g)}</span>`).join('')}</p>${unlocked.slice(0, 5).map(u => `<p class="okc small">새로 열림: ${esc(u)}</p>`).join('')}`;
  return M(win ? '깨어났다' : '한 방울으로 돌아갔다', b + '</div>', btn('share', { v: `옛 것의 둥지 · ${win ? av : NEST.formName(G)} · ${sc.grade} ${R(sc.total)}점 · ${G.day}일` }, '기록 복사') + (win && tab === 'end' ? btn('tab', { g: 'result', v: 'score' }, '점수 보기', 'pri big') : btn('close', null, '다음', 'pri big')));
}
function legacyHtml(pickd) {
  const ks = G.kin.filter(m => m.kind !== 'spawn' && !m.rid);
  return M('명부에 올릴 권속', `<p class="small mute">${UI.legacyMax}명까지 명부에 올린다 (명부 ${META.roster.length}/${ROSTER_MAX}). 레벨은 절반이 되고, 다음 판부터 데려갈 수 있다.</p><div class="units ${isMobile() ? 'g2' : 'g3'}">${ks.slice(0, 18).map(m => `<button class="unit${pickd.includes(m.id) ? ' on' : ''}" data-a="legacy" data-id="${m.id}">${kinImg(m.kind, 32)}<span>${esc(m.name)} <small class="mute">Lv${m.lv}→${Math.min(ROSTER_LV, Math.max(1, Math.ceil(m.lv / 2)))}</small></span></button>`).join('')}</div>`, btn('close', null, pickd.length ? '이들을 올린다' : '아무도 올리지 않는다', 'pri'));
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
  const free = META.lastDraw !== today(), full = META.roster.length >= ROSTER_MAX, list = [['draw', '별똥별'], ['list', '명부', META.roster.length + '/' + ROSTER_MAX]], tab = curTab('barracks', list);
  let b = tabsHtml('barracks', list, tab) + '<div class="tb">';
  if (tab === 'draw') b += `${res ? `<div class="card evo in" style="align-items:center;text-align:center">${res.dust ? `<p class="h3 coin">별가루 +${res.dust}</p>` : `${kinImg(res.kind, 64)}<p class="h3"><span class="chip ${res.tier === 'L' ? 'on' : ''}">${TIER[res.tier]}</span> ${esc(rosterName(res))}</p><p class="small mute">${NEST.KIN[res.kind].name} · Lv${res.lv}</p>`}</div>` : ''}
    <div class="row">${btn('draw', { v: 'free' }, free ? '오늘의 별똥별 <small>하루 한 번, 무료</small>' : '오늘의 별똥별은 이미 받았다', 'pri', !free)}${btn('draw', { v: 'dust' }, `별가루로 부른다 <small>${DRAW_COST}</small>`, '', META.dust < DRAW_COST || full)}</div>
    <p class="small mute">명부의 권속은 판이 끝나도 남는다. 새 판에 둘까지 데려갈 수 있고, 살아 돌아오면 자란다(최대 Lv${ROSTER_LV}). 판을 끝낼 때 살아남은 권속을 올릴 수도 있다. 별가루는 판을 끝낼 때 점수에 따라, 흔적 하나에 15씩 받는다.</p>
    <p class="small mute">오늘의 별똥별: 별가루 50% · 일반 37.5% · 희귀 11% · 전설 1.5%. 별가루로 부르기: 일반 75% · 희귀 22% · 전설 3%.${full ? ' 명부가 가득 차서 지금은 권속 대신 별가루가 나온다.' : ''}</p>`;
  else b += pager('barr', META.roster, 8, items => `<div class="rgrid">${items.map(r => `<div class="row rrow">${kinImgM(r, 36)}<span class="grow clamp2"><b class="h3">${esc(rosterName(r))}${r.evo ? '★' : ''}</b><br><small class="mute">${TIER[r.tier || 'N']} ${NEST.KIN[r.kind].name} Lv${r.lv}</small></span>${btn('release', { id: r.rid }, '✕', 'sm')}</div>`).join('') || '<p class="mute" style="grid-column:1/-1">아직 아무도 없다. 오늘의 별똥별을 받아 보거나, 판을 끝낼 때 살아남은 권속을 올린다.</p>'}</div>`) + '<p class="small mute">✕ 보낸다 (별가루 +20). 한 번 더 눌러야 보낸다.</p>';
  return M(`명부 <small class="mute">별가루 <b class="coin">${R(META.dust)}</b></small>`, b + '</div>', closeBtn());
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
  const list = [['mine', '내 기록'], ['feats', '흔적', FEATS.filter(f => META.feats[f[0]]).length + '/' + FEATS.length], ['cloud', '함께 보는 순위']], tab = curTab('records', list);
  let b = tabsHtml('records', list, tab) + '<div class="tb">';
  if (tab === 'mine') b += `<div class="board">${META.board.map((x, i) => `<span class="num">${i + 1}</span><span>${esc(x.form)} <small class="mute">${x.day}일 · ${NEST.DIFF[x.diff].name}${x.win ? '' : ' · 실패'}</small></span><b class="coin">${x.grade}</b><span class="num">${R(x.total)}</span>`).join('') || '<span class="mute">아직 기록이 없다.</span>'}</div>`;
  if (tab === 'feats') b += '<p class="small mute">처음 해 보는 일이 새 시설과 함정, 별자리를 연다. 하나에 별가루 +15.</p>' + pager('feats', FEATS.slice().sort((x, y) => (META.feats[x[0]] ? 1 : 0) - (META.feats[y[0]] ? 1 : 0)), isMobile() ? 9 : 11, items => `<div class="frow small">${items.map(f => META.feats[f[0]] ? `<span class="chip on">${f[1]}</span><span>${f[3]}</span>` : `<span class="chip">${f[1]}</span><span class="mute">${f[2]} → <b class="coin">${f[3]}</b></span>`).join('')}</div>`);
  if (tab === 'cloud') b += `<div id="cloudboard" class="board"><span class="mute">${CLOUD ? '불러오는 중…' : '게시된 링크를 공유받아 로그인한 사람들끼리 최고 점수를 겨룬다. 지금은 연결되지 않았다(파일로 열었거나 로그인하지 않았다).'}</span></div>`;
  return M(`기록 <small class="mute">판 ${META.runs} · 깨어남 ${META.clears}</small>`, b + '</div>', closeBtn());
}
// ---------- 해금: 처음엔 잠겨 있고, 해낸 일이 연다 ----------
const openAll = () => !!META.openAll, REROLL = 30;
const diffLock = d => !openAll() && META.clears < d - 1 ? NEST.DIFF[d - 1].name + '에서 깨어나면 열린다' : '';
const SIGN_NEED = ['', '한 판을 끝까지 하면 뜬다', '한 번 깨어나면 뜬다', '두 번 깨어나면 뜬다'];
const signOpen = k => openAll() || [true, META.board.length > 0, META.clears >= 1, META.clears >= 2][NEST.SIGN[k].need];
const signPool = () => Object.keys(NEST.SIGN).filter(signOpen);
// 다음에 떨어질 별자리는 미리 정해져 있다. 판을 끝내야(또는 별가루를 써야) 바뀐다 — 마음에 안 든다고 나갔다 들어와도 그대로다
function rollSign() { const all = signPool(), pool = all.length > 1 ? all.filter(k => k !== META.nextSign) : all; META.nextSign = pool[Math.floor(Math.random() * pool.length)]; saveMeta(); return META.nextSign; }
function curSign() { if (!META.nextSign || !NEST.SIGN[META.nextSign] || !signOpen(META.nextSign)) { if (META.runs === 0) { META.nextSign = 'well'; saveMeta(); } else rollSign(); } return META.nextSign; }
const signSvg = (k, w) => { const sg = NEST.SIGN[k], c = ASPCOL[sg.asp], p = sg.pts; return `<svg viewBox="0 0 100 60" width="${w}" height="${Math.round(w * 0.6)}" role="img" aria-label="${sg.name}" style="background:#0b0c1a;border:1px solid var(--line);flex:none;display:block"><polyline points="${p.map(q => q.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-opacity=".5" stroke-width="1"/>${p.map((q, i) => { const z = i % 3 === 0 ? 4 : 2; return `<rect x="${q[0] - z / 2}" y="${q[1] - z / 2}" width="${z}" height="${z}" fill="${i % 3 === 0 ? '#fff3a0' : c}"/>`; }).join('')}</svg>`; };
function setupHtml(o) {
  const k = curSign(), sg = NEST.SIGN[k], st = NEST.STAR[sg.star], pool = signPool(), col = ASPCOL[sg.asp];
  const list = [['who', '하늘'], ['rule', '깊이'], ['bring', '권속', o.bring.length + '/2']], tab = list.some(x => x[0] === o.tab) ? o.tab : 'who';
  let b = tabsHtml('setup', list, tab) + '<div class="tb">';
  if (tab === 'who') b += `<div class="card in"><div class="row nw" style="align-items:flex-start;gap:10px">${signSvg(k, 150)}<div class="stack grow" style="gap:3px"><p class="h3" style="color:${col}">${sg.name}</p><p class="small mute">${esc(sg.text)}</p></div></div>
      <div class="kv small"><span class="chip" style="border-color:${col};color:${col}">${NEST.ASP[sg.asp]} 조각</span><span>${NEST.ASP[sg.asp]} 정수 12를 품고 떨어진다. 그쪽으로 자라기 쉽지만, 무엇이 될지는 결국 먹는 것이 정한다.</span><span class="chip on">${st.name}</span><span>${esc(st.desc)}</span></div></div>
    <p class="small mute">어느 별자리에서 떨어질지는 고르지 못한다. 한 판을 끝내면 하늘이 바뀐다. 처음에는 누구나 「옛 것?」이고, 껍데기나 입 같은 것은 판을 하다가 하는 짓에 따라 몸에 돋는다.</p>
    <div class="row nw">${btn('reroll', null, `다른 별자리를 기다린다 <small>별가루 ${REROLL}</small>`, '', META.dust < REROLL || pool.length < 2)}<span class="small mute grow">별가루 ${R(META.dust)} · 뜰 수 있는 별자리 ${pool.length}/${Object.keys(NEST.SIGN).length}</span></div>`;
  if (tab === 'rule') b += `<div class="row">${[1, 2, 3].map(d => btn('setup', { k: 'diff', v: d }, `${NEST.DIFF[d].name}${d > 1 ? ' <small>침입 ×' + NEST.DIFF[d].mult + '</small>' : ''}`, o.diff === d ? 'on' : '', !!diffLock(d))).join('')}</div>${[2, 3].filter(d => diffLock(d)).map(d => `<p class="small warnc">${NEST.DIFF[d].name}: ${diffLock(d)}</p>`).join('')}
    <p class="small mute">깊을수록 더 많은 인간이 오고 점수 배수가 오른다. 목숨은 어느 깊이에서나 둘이다.</p>
    <div class="row nw">${btn('setup', { k: 'tut', v: 1 }, '길잡이 ' + (o.tut ? '켬' : '끔'), o.tut ? 'on' : '')}<span class="small mute grow">켜면 첫 이틀 동안 잔향이 할 일을 하나씩 짚어 준다.</span></div>`;
  if (tab === 'bring') b += META.roster.length ? `<p class="small mute">명부에서 둘까지 데려간다.</p><div class="units g2">${META.roster.map(r => `<button class="unit${o.bring.includes(r.rid) ? ' on' : ''}" data-a="setup" data-k="bring" data-v="${r.rid}">${kinImgM(r, 32)}<span>${esc(rosterName(r))} <small class="mute">${TIER[r.tier || 'N']} Lv${r.lv}</small></span></button>`).join('')}</div>` : '<p class="small mute">명부가 비어 있다. 타이틀의 "명부"에서 하루 한 번 별똥별을 받거나, 판을 끝낼 때 살아남은 권속을 올리면 여기서 둘까지 데려갈 수 있다.</p>';
  return M('새로운 낙하', b + '</div>', `<span class="small mute msum"><span style="color:${col}">${sg.name}</span> · ${NEST.DIFF[o.diff].name}</span>${btn('close', { v: '' }, '돌아가기')}${btn('close', { v: 'go' }, '떨어진다', 'pri big')}`);
}
function fuseHtml(m, bm, made) {
  const s2 = NEST.kinStats(G, m), mk = (made || []).map(r => `<p class="h3 coin">★ 특별한 합체 「${NEST.RECIPE[r].name}」</p><p class="small">${esc(NEST.RECIPE[r].desc)}</p>`).join('');
  return `<div class="mbody evo" style="align-items:center;text-align:center"><p class="mute">두 몸이 하나가 되었다</p><div class="row" style="justify-content:center;gap:14px">${kinImg(bm.kind, 48, bm.evo)}<span class="h3 mute">+</span>${kinImg(m.kind, 48, m.evo)}<span class="h3 mute">→</span>${kinImgM(m, 120)}</div><h2 style="font-size:var(--d2)">${esc(NEST.kinName(m))}</h2>${mk}<p class="small mute">${NEST.fj(esc(m.name) + '이(가) ' + esc(bm.name) + '을(를)')} 몸에 붙였다.</p><p class="small okc">체력 ${R(s2.hp)} · 공격 ${R(s2.atk)} · 방어 ${R(s2.df)}${s2.satk ? ' · 정신 ' + R(s2.satk) : ''}</p><p class="small mute">붙은 것 ${m.parts.length}/${NEST.K.fuse.max} · 한 번에 붙잡는 적 ${2 + m.parts.length}명</p></div><div class="mfoot">${btn('kin', { id: m.id }, '권속 창으로')}${btn('close', null, '좋다', 'pri big')}</div>`;
}
function traitHtml(before) {
  const O = NEST.ORIGIN[G.origin];
  return `<div class="mbody evo" style="align-items:center;text-align:center"><p class="mute">몸에 무언가 돋았다</p><div class="row" style="justify-content:center;gap:20px">${slimeImg(before, 64, '이전 모습')}<span class="h3 mute">→</span>${slimeImg(G.slime, 128, O.name)}</div><h2 style="font-size:var(--d2)">${O.name}</h2><p class="small mute">${esc(O.text)}</p><p class="small okc">＋ ${esc(O.good)}</p><p class="small up">－ ${esc(O.bad)}</p><p class="small mute">형질은 한 판에 하나만 돋는다. 어떤 모습으로 자라도 남는다.</p></div><div class="mfoot">${btn('close', null, '좋다', 'pri big')}</div>`;
}
function codexHtml() {
  const seen = META.codex.forms, node = (id, sl, name) => `<div class="node${seen[id] ? '' : ' unk'}">${slimeImg(sl, 48)}<span>${seen[id] ? esc(name) : '???'}</span></div>`, tr = META.codex.traits || {};
  const list = [['sign', '별자리'], ['form', '모습'], ['trait', '형질'], ['mut', '변이'], ['end', '결말']], tab = curTab('codex', list), ca = NEST.ASPECTS.includes(UI.tab.codexAsp) || UI.tab.codexAsp === 'hid' ? UI.tab.codexAsp : NEST.ASPECTS[0], HB = Object.keys(NEST.BODY);
  let b = tabsHtml('codex', list, tab) + '<div class="tb">';
  if (tab === 'sign') b += pager('signs', Object.keys(NEST.SIGN), isMobile() ? 6 : 10, items => `<div class="codex">${items.map(k => { const sg = NEST.SIGN[k], op = signOpen(k); return `<div class="node${op ? '' : ' lockd'}" title="${esc(NEST.STAR[sg.star].desc)}">${signSvg(k, 84)}<span${op ? ` style="color:${ASPCOL[sg.asp]}"` : ''}>${op ? sg.name : '???'}</span><span class="mute">${op ? NEST.STAR[sg.star].name : SIGN_NEED[sg.need]}</span></div>`; }).join('')}</div>`) + `<p class="small mute">뜬 별자리 ${signPool().length}/${Object.keys(NEST.SIGN).length}. 어느 별자리에서 떨어질지는 고르지 못한다. 별자리마다 품고 오는 조각과 규칙이 다르다.</p>`;
  if (tab === 'form') { const sp = META.codex.sp || {}, STG = ['', '첫 허물', '두 번째', '세 번째', '성체'], hb = HB.includes(UI.tab.codexHid) ? UI.tab.codexHid : HB[0], line = (key, main, body) => [1, 2, 3, 4].map(q => { const on = sp[key + q]; return `<div class="node${on ? '' : ' unk'}">${slimeImg({ main, body, sub: null, stage: q, muts: [] }, 56)}<span>${on ? esc(NEST.SPECIES[key][q]) : '???'}</span><span class="mute">${STG[q]}</span></div>`; }).join('');
    b += tabsHtml('codexAsp', NEST.ASPECTS.map(a => [a, `<span style="color:${ASPCOL[a]}">${NEST.ASP[a]}</span>`]).concat([['hid', '숨은 것']]), ca, true);
    if (ca === 'hid') b += tabsHtml('codexHid', HB.map(k => [k, seen[k] ? NEST.FORM1[k].name : '???']), hb, true) + `<div class="codex c4">${line(hb, NEST.ASPECTS[(HB.indexOf(hb) * 2) % 5], hb)}</div><p class="small">${seen[hb] ? esc(NEST.BODY[hb].hint) + ' · <span class="okc">' + esc(NEST.FORM1[hb].skill) + '</span>' : '<span class="mute">아직 이 몸으로 허물을 벗어 본 적이 없다</span>'}</p><p class="small mute">징조가 아니라 첫 허물을 벗을 때의 형편이 정하는 몸. 색은 가장 많이 먹은 징조를 따른다.</p>`;
    else b += `<div class="codex c4">${line(ca, ca, null)}</div><div class="row"><span class="small mute">섞인 징조의 이명</span>${NEST.ASPECTS.filter(x => x !== ca).map(x => seen[ca + '_' + x] ? aspChip(x, NEST.FORM2[ca + '_' + x]) : '<span class="chip mute">???</span>').join('')}</div><p class="small mute">허물을 벗을 때마다 다른 것이 된다. 첫 허물은 가장 많이 먹은 징조가 정하고, 두 번째부터는 그다음으로 많은 징조가 몸 한 군데에 돋는다.</p>`; }
  if (tab === 'mut') b += `<div class="sec">변이 <small>${Object.keys(META.codex.muts).length}/${Object.keys(NEST.MUT).length}</small></div><div class="row">${Object.keys(NEST.MUT).map(m => META.codex.muts[m] ? aspChip(NEST.MUT[m].asp, NEST.MUT[m].name) : '<span class="chip mute">???</span>').join('')}</div><div class="sec">특별한 합체 <small>${Object.keys(META.codex.rcp || {}).length}/${Object.keys(NEST.RECIPE).length}</small></div><div class="row">${Object.keys(NEST.RECIPE).map(k => META.codex.rcp[k] ? `<span class="chip on" title="${esc(NEST.RECIPE[k].desc)}">${NEST.RECIPE[k].name}</span>` : '<span class="chip mute">???</span>').join('')}</div><div class="sec">합체 <small>${Object.keys(META.codex.fuse || {}).length}가지를 만들어 봤다</small></div><div class="row">${Object.keys(META.codex.fuse || {}).slice(-10).map(k => { const [a2, b2] = k.split('+'); return `<span class="chip">${NEST.FUSE_PRE[b2]} ${NEST.KIN[a2].name}</span>`; }).join('') || '<span class="small mute">아직 없다. 권속 창의 합체 탭에서 둘을 합친다.</span>'}</div><div class="sec">방 조합</div><div class="row">${Object.keys(NEST.COMBO).map(k => META.codex.combos[k] ? `<span class="chip on">${NEST.COMBO[k].name}</span>` : '<span class="chip mute">???</span>').join('')}</div>`;
  if (tab === 'end') b += `<p class="small mute">같은 모습이라도 점수에 따라 결말이 셋으로 갈린다.</p>${NEST.ASPECTS.map(a => `<p class="small row"><span style="color:${ASPCOL[a]}">${NEST.ASP[a]}</span> ${ENDING3[a].map((e, i) => META.codex.ends[a + i] ? `<span class="chip on">${NEST.lx(e[0])}</span>` : '<span class="chip mute">???</span>').join(' ')}</p>`).join('')}${Object.keys(NEST.BODY).map(k => `<p class="small row"><span class="mute">${META.codex.forms[k] ? NEST.FORM1[k].name : '숨은 몸'}</span> ${ENDING3[k].map((e, i) => META.codex.ends[k + i] ? `<span class="chip on">${NEST.lx(e[0])}</span>` : '<span class="chip mute">???</span>').join(' ')}</p>`).join('')}<div class="sec">깨어난 모습</div><div class="row">${Object.keys(NEST.AVATAR).map(k => META.codex.ends[k] ? `<span class="chip on">${NEST.AVATAR[k]}</span>` : '<span class="chip mute">???</span>').join('')}</div>`;
  return M(`도감 <small class="mute">깨어난 횟수 ${META.clears}</small>`, b + '</div>', closeBtn());
}
const HELP = [
  ['under', '땅속의 한 방울', '새 판은 「땅속의 한 방울」로 시작한다. 어두운 흙 속을 직접 움직이며 먹고 자란다. 몸은 다섯 번 자라고(한 방울 → 기는 것 → 파고드는 것 → 삼키는 것 → 다 자란 것), 자랄 때마다 굴이 넓어지고 새 것들이 나온다. 나보다 큰 것은 피하고, 더 커지면 그것이 먹이가 된다. 뒤에서 어른거리는 큰 그림자는 다음 몸에서 만날 것들이다. 저들은 저희끼리도 쫓고 먹고 자란다: 먹는 중인 놈은 한눈을 팔고, 남긴 주검은 가로챌 수 있다.'],
  ['parts', '부위와 쓰러짐', '먹은 알갱이로 부위를 돋우고 올린다(입·눈·발·겉·속). 입이 세야 먹을 수 있는 것, 눈이 있어야 보이는 것이 있다. 발 부위는 오른쪽 아래 단추로 쓰는 재주를 준다. 두 번 물리면 쓰러지고, 두 번까지는 틈에 숨어 그 몸에서 다시 시작한다(남긴 것 3분의 1과 부위 한 단계를 잃는다). 세 번째는 끝이다.'],
  ['grown', '자란 만큼', '둘째 몸부터 자리를 잡을 수 있지만 멀리 자랄수록 더 가져온다: 남긴 알갱이가 첫 정수가 되고, 셋째 몸부터는 부위 하나가 변이로 남고, 본체의 체력과 공격이 한 몸마다 7%씩 달라지며(셋째 몸이 기준), 다 자라면 목숨이 하나 더 붙는다. 권속은 굴을 튼 뒤에 돋는다.'],
  ['breach', '뚫기', '자리를 잡은 뒤에도 파지 않은 곳은 보이지 않는다. 뚫기 전에는 아무도 오지 않지만 먹이도 없다. "땅 위로 뚫는다"를 누르면 그때부터 밤마다 내려오고, 위가 어떤 세상인지(판타지·무협·현대·미래)도 그때 정해진다. 세상마다 규칙이 하나씩 다르다(둥지 창에 적힌다). 숨어 있는 밤마다 정수를 조금 얻지만 날은 흘러가고, 오래 숨을수록 먼저 들킬 위험이 커진다. 들키면 그 밤에 바로 온다.'],
  ['worlds', '세상 넷', '뚫을 때 세상이 정해진다. 세상마다 규칙, 오는 박자, 그 세상에만 있는 침입자 둘이 다르다. 뚫은 뒤 둥지 창에 자세히 적힌다.'],
  ['kin', '권속', '권속은 몸에서 돋는다. 제 자리는 제가 찾는다: 먼저 돋은 것이 본체 곁, 나머지는 길목 앞에서부터. 낮에는 굴을 돌아다니고 밤이 오면 자리로 간다. 권속을 눌러 "지켜라"고 시키면 그 자리에 뿌리를 내려, 거기서 보낸 밤마다 능력이 6%씩(최대 30%) 오른다. 옮기거나 풀어 주면 처음부터다. 붙들어 둘 수 있는 권속은 둘에서 시작해 허물을 벗을 때마다 하나씩 는다. "풀어 준다"를 누르면 다시 제멋대로 다닌다.'],
  ['goal', '목표', `${NEST.K.days}일 동안 본체를 지킨다. ${NEST.K.act}일마다 "달이 기우는 밤"에 큰 무리가 오고, 넘기면 모은 정수에 따라 허물을 벗는다(네 번까지). 마지막 밤에는 가장 센 무리가 우두머리를 앞세워 온다. 권속도 레벨 5가 되면 진액을 들여 한 번 진화시킬 수 있다.`],
  ['day', '낮', '행동은 하루 두 번. 건설 행동 한 번이면 파기·짓기·함정 같은 작업을 세 번 한다. 포식, 휴식, 훈련, 습격은 행동 하나씩. 돋는 것 들이기, 포로 처분, 탐식은 행동이 들지 않는다. 행동을 남기고 밤을 맞으면 본체가 그만큼 쉰다.'],
  ['under', '지하', '인간은 입구에서 본체 방까지 가장 짧은 길(점선)로 온다. 길 위에는 싸울 자리와 함정을, 길에서 벗어난 곁방에는 고치 굴·기도 굴 같은 살림을 둔다. 칸을 파서 길을 바꿀 수 있다. 진액은 둥지를 돌리는 피이고, 땅 위의 것들에게는 어느 세상에서든 약이자 보물이다. 그래서 많이 고일수록 냄새가 멀리 퍼져 더 많이 온다. 다만 본체가 깔고 앉아 있어서, 본체를 쓰러뜨리기 전에는 한 방울도 못 가져간다.'],
  ['life', '목숨', '본체가 쓰러지면 진액 절반을 털리고 체력 30%로 다시 일어난다. 일어날 수 있는 횟수가 목숨이다. 목숨이 하나 남았을 때 쓰러지면 끝이고, 마지막 밤에는 목숨과 상관없이 쓰러지면 끝이다.'],
  ['trap', '함정', '무리는 함정에 익숙해진다. 같은 종류의 함정은 그날 밤 터질 때마다 절반씩 약해진다(100% → 50% → 25%…). 종류를 섞어 깔고, 함정이 깎아 놓은 적은 권속이 마무리해야 한다. 함정만으로는 못 막는다.'],
  ['san', '정신력', '침입자에게는 체력(빨강)과 정신력(보라)이 있다. 정신력이 바닥나면 달아나거나, 자기 편을 치거나, 무릎을 꿇는다. 무릎 꿇은 자는 포로가 된다: 몸값, 제물, 개종 가운데 고른다. 개종시킨 신도는 매일 신앙을 올리고 제 것을 조금 바친다.'],
  ['surf', '지상', '{마을} 다섯 곳이 길목 셋을 지나 둥지로 온다. 오늘 밤과 내일 밤 올 무리가 지도에 보인다. 2막부터 {마을}을(를) 습격할 수 있다: 위협하면 공물을 바치고, 약탈하면 한몫 잡지만 그 {마을}이(가) 벼른다.'],
  ['trade', '섬김', '너를 두려워하면서도 미워하지 않는 {마을}은(는) 너를 섬기기 시작한다. 날마다 섬김(●)이 쌓이고, 쌓인 만큼 바치는 것이 커진다. 하룻밤에 그 {마을} 사람을 여럿 죽이거나 습격하면 처음부터다. 죽이는 대신 무릎 꿇리고, 미치게 해 쫓아내고, 몸값 받고 돌려보내면 싸우면서도 섬김이 자란다. 돋는 것 가운데 "생포"가 붙은 권속(신도, 가면 쓴 것, 별보는 눈, 실뽑이…)이 그런 싸움을 한다. 공포가 높을수록 쌓을 수 있는 신뢰가 준다. 죽여서 먹으면 빨리 자라고, 살려 보내면 진액이 고인다.'],
  ['hoard', '탐식', '본체 창에서 진액을 쓴다. 삼키면 본체가 불어나고(값이 매번 오른다), 호위 자리와 목숨을 살 수 있고, 4막부터는 마지막 밤의 무리를 약하게 만들 수 있다. 쌓아만 둔 진액은 인간을 부르고 쓰러지면 절반을 털린다.'],
  ['fuse', '합체', '권속 창의 "합체" 탭에서 권속 하나에 다른 권속을 붙인다. 붙은 쪽은 사라지고 그 능력의 절반이 남는다. 한 몸에 둘까지 붙는다. 방의 자리는 한정되어 있으니, 자리가 없어 서성이는 권속을 싸우는 권속에게 붙이면 한 자리에서 둘, 셋 몫을 싸운다. 정신 공격을 하는 권속을 붙이면 정신 공격도 옮겨 온다. 붙은 것 하나마다 적 하나를 더 붙잡는다. 어떤 둘은 한 몸이 되면 특별한 것이 된다(★). 무엇이 그런지는 해 봐야 알고, 찾은 것은 도감에 남는다. 명부에 올려도 붙은 채로 남는다. 되돌릴 수 없다.'],
  ['omen', '징조', `${NEST.OMEN_DAY}일째부터 다 자란 옛 것 하나가 지켜본다. 밤이 지나면 내일의 징조가 정해진다. 징조는 좋은 쪽과 나쁜 쪽이 한 쌍이고, 그것이 좋아하는 짓을 하면 좋은 쪽만, 싫어하는 짓을 하면 나쁜 쪽만 온다. 나쁜 쪽은 신앙 6으로 달랠 수 있다.`],
  ['night', '밤', '싸움은 알아서 한다. 달이 기우는 밤에는 싸움 직전에 멈추고 손을 쓸 수 있다: 채찍, 옮기기, 손 주문(신앙 소모). 설정에서 멈추는 때를 바꾼다. 공포와 진액은 둘 다 더 많고 더 강한 인간을 부른다. 강한 인간은 더 좋은 먹이이기도 하다.'],
  ['sign', '별자리', '판을 시작하면 어느 별자리에서 떨어졌는지가 정해져 있다. 고르지 못한다. 별자리가 품고 오는 조각(징조)과 판의 규칙 하나를 정한다. 판을 끝내야 하늘이 바뀌고, 별가루로 다시 뽑을 수도 있다.'],
  ['who', '본체와 형질', '처음에는 누구나 「옛 것?」이다. 첫 허물은 보통 가장 많이 먹은 징조의 몸이 되지만, 그때의 형편에 따라 숨은 본체가 되기도 한다. 본체 창의 정수 탭에 "이대로면 무엇이 되는지"가 나온다. 또 판을 하다 보면 하는 짓에 따라 사건이 찾아와 몸에 형질이 돋는다(껍데기, 뿌리, 입, 등불, 굳은 방울, 가시, 사슬, 그림자). 형질마다 장점과 단점이 하나씩 있고, 한 판에 하나만 돋는다. 무엇이 어떻게 돋는지는 겪어 본 것만 도감에 적힌다.'],
  ['lock', '흔적과 해금', '처음에는 일부 시설·함정·별자리·깊이가 잠겨 있다. 처음 해 보는 일(첫 포로, 첫 진화…)이 흔적으로 남아 그것들을 연다. 무엇이 무엇을 여는지는 타이틀의 "기록 → 흔적"에 있다. 설정에서 전부 열어 둘 수도 있다.'],
  ['etc', '그 밖에', '어떤 시설은 맞닿게 지으면 하나처럼 움직인다(건설 목록의 ★). 굴을 파다 보면 묻힌 것이 나온다. 가끔은 싸우러 오지 않는 밤 손님이 온다. 큰 밤의 우두머리는 판마다 다르고, 미리 보인다. 위쪽 숫자(진액·신앙·공포…)를 누르면 뜻이 나온다.'],
];
[ENDING, ENDING3, FEATS, HELP].forEach(NEST.localize);   // 글 속의 {마을} 같은 자리표를 세계가 바뀔 때마다 다시 쓴다
function helpHtml() {
  const tab = HELP.some(x => x[0] === UI.tab.help) ? UI.tab.help : 'goal', cur = HELP.find(x => x[0] === tab);
  return M('어떻게 하나', tabsHtml('help', HELP.map(x => [x[0], x[1]]), tab, true) + `<div class="card in"><p class="h3 coin">${cur[1]}</p><p>${esc(cur[2])}</p>${tab === 'worlds' ? NEST.WORLD_IDS.map(id => { const w = NEST.WORLD[id]; return `<p class="small"><span class="chip on">${esc(w.name)}</span> ${esc(w.beat[0] + ' · ' + w.only.map(k => NEST.INV[k].name).join(', '))}</p>`; }).join('') : ''}</div><p class="small mute only-pc">단축키: <kbd>Tab</kbd> 지상·지하 · <kbd>E</kbd> 밤 맞기 · <kbd>Esc</kbd> 닫기 · 밤에 <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 속도, <kbd>S</kbd> 건너뛰기, <kbd>Space</kbd> 그냥 둔다</p><p class="small mute only-m">지도는 좌우로 밀어서 본다. 칸을 누르면 할 일이 올라오고, ✕로 닫는다.</p>`, closeBtn());
}
function settingsHtml() {
  return M('설정', `<div class="row"><span class="grow">소리</span>${btn('set', { k: 'sound', v: 1 }, '켬', 'sm' + (META.sound ? ' on' : ''))}${btn('set', { k: 'sound', v: 0 }, '끔', 'sm' + (META.sound ? '' : ' on'))}</div>
    <div class="row"><span class="grow">밤에 멈춰서 손을 쓸 때</span>${[['settle', '큰 밤만'], ['always', '매일'], ['never', '안 멈춤']].map(([k, l]) => btn('set', { k: 'pause', v: k }, l, 'sm' + (META.pause === k ? ' on' : ''))).join('')}</div>
    <div class="row"><span class="grow">해금</span>${btn('set', { k: 'open', v: 0 }, '흔적으로 연다', 'sm' + (META.openAll ? '' : ' on'))}${btn('set', { k: 'open', v: 1 }, '전부 열어 둔다', 'sm' + (META.openAll ? ' on' : ''))}</div>
    <div class="row"><span class="grow">기록 (판 ${META.runs} · 깨어남 ${META.clears})</span>${btn('wipe', null, '모두 지우기', 'sm bad')}</div>
    <p class="small mute">제목·단추 글꼴: Galmuri11 Bold © Lee Minseo (SIL OFL 1.1)</p>`, closeBtn());
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
      L.text = NEST.lx(L.text);
      timer = setInterval(() => { n += 2; const el = $('stxt'); if (el) el.textContent = L.text.slice(0, n); if (n % 6 === 0) sfx('talk'); if (n >= L.text.length) { full = true; clearInterval(timer); } }, 22);
    };
    const end = () => { clearInterval(timer); $('scene').hidden = true; sceneNext = null; done(); };
    sceneNext = skipAll => { if (skipAll) return end(); if (!full) { clearInterval(timer); $('stxt').textContent = lines[i].text; full = true; return; } i++; if (i >= lines.length) end(); else show(); };
    show();
  });
}

// ---------- 흐름 ----------
let busy = false, handRes = null;
// 맡김: 권속들이 하루 일을 하나씩 해 나간다. paused 멈춤, speed 빠르기, log 방금 한 일들, last 지난밤의 결과
const AUTO = { paused: false, speed: 1, gen: 0, log: [], last: null, i: 0, n: 1 };
META.auto = false;   // 맡김 방식은 v0.20 에서 없앴다. 권속은 늘 제 자리를 제가 찾고, 나머지는 직접 한다
function autoSay(msg, cell) {
  AUTO.log.unshift(msg); AUTO.log.length = Math.min(AUTO.log.length, 6);
  if (cell != null && ST.screen === 'under') { const r = cellRect(locIdx(cell)); ST.pulse = { i: cell, t0: now() }; ST.floats.push({ x: r.x + r.w / 2, y: r.y + r.h / 2 - 6, s: msg.replace(/\s*\(.*$/, '').slice(0, 14), col: '#fff3a0', t0: now() }); if (isMobile() && !UI.sel) camTo(r.x + CW / 2); }
  sfx('click');
}
function autoRun() {
  const gen = ++AUTO.gen, st = Object.assign({ captive: 'mix', raid: 1, spend: 1 }, NEST.EDICT[G.edict] ? NEST.EDICT[G.edict].st : {}), tasks = STEWARD.tasks(NEST, G, st, { seed: G.seed }); let i = 0; AUTO.n = tasks.length + 1; AUTO.i = 0;
  const step = () => {
    if (gen !== AUTO.gen || !G || !G.auto || G.over) return;
    if (AUTO.paused || busy || !$('modal').hidden || !$('scene').hidden) return void setTimeout(step, 250);
    if (i < tasks.length) { let r = null; try { r = tasks[i](); } catch (e) { console.error(e); } i++; AUTO.i = i; const did = r ? r.did : []; did.forEach(d => autoSay(d.msg, d.cell)); if (did.length) { checkFeats(); saveRun(); } render(); return void setTimeout(step, (did.length ? 1500 : 140) / AUTO.speed); }
    if (i === tasks.length) { i++; AUTO.i = i; render(); return void setTimeout(step, 1200 / AUTO.speed); }
    UI.confirmEnd = true; endDay();
  };
  render(); setTimeout(step, 900 / AUTO.speed);
}
const godPips = v => `<span class="gpips">${[-3, -2, -1, 1, 2, 3].map(k => `<i class="${v < 0 && k < 0 && k >= v ? 'neg' : v > 0 && k > 0 && k <= v ? 'pos' : ''}"></i>`).join('')}</span>`;
const godsRow = () => `<div class="gods">${NEST.ASPECTS.map(a => `<span title="${esc(NEST.ELDER[a].text)}"><span style="color:${ASPCOL[a]}">${NEST.ELDER[a].name}</span>${godPips((G.gods || {})[a] || 0)}</span>`).join('')}</div>`;
function edictHtml() {
  const L = AUTO.last, gods = G.gods || {}; let h = '';
  if (L) { const b = L.rep, notes = (L.st.notes || []).slice().sort((x, y) => (/선물|벌:/.test(y) ? 1 : 0) - (/선물|벌:/.test(x) ? 1 : 0)), tot = Math.round(Object.values(L.st.ledger || {}).reduce((a, x) => a + x, 0));
    h += `<div class="card"><p class="small"><b class="${!b || b.result === 'repel' ? 'okc' : 'up'}">지난밤 ${b ? { repel: '격퇴', stolen: '본체가 쓰러져 털렸다', core: '본체가 쓰러졌다' }[b.result] : '조용했다'}</b>${b ? ` · 쓰러뜨림 ${b.kills} · 꿇음 ${b.captives.length}` : ''} · 진액 <span class="${tot >= 0 ? 'coin' : 'up'}">${tot >= 0 ? '+' : ''}${R(tot)}</span></p>${notes.slice(0, 3).map(n => `<p class="small ${/벌:/.test(n) ? 'up' : /선물/.test(n) ? 'okc' : 'mute'} clamp2">${esc(n)}</p>`).join('')}</div>`; }
  h += `<p class="small mute">오늘 권속들에게 내릴 뜻. 그 뜻을 좋아하는 큰 것은 흡족해하고, 맞서는 큰 것은 언짢아한다.</p><div class="opts one">${(G.edictCh || []).map(id => { const e = NEST.EDICT[id], g = e.god, rv = NEST.RIVAL[g]; return `<button class="btn opt" data-a="close" data-v="${id}"><b style="color:${ASPCOL[g]}">${e.name}</b><span class="small">${esc(e.text)}</span><span class="small"><span style="color:${ASPCOL[g]}">▲ ${NEST.ELDER[g].name}</span> ${godPips(gods[g] || 0)} <span class="mute">·</span> <span style="color:${ASPCOL[rv]}">▼ ${NEST.ELDER[rv].name}</span></span></button>`; }).join('')}</div>${godsRow()}`;
  return M(`${G.day}일째 아침 <small class="mute">${STAGE_NAME[G.slime.stage]}</small>`, h, '');
}
async function autoMorning() {
  if (!G || G.over) return;
  while (G.edictDay !== G.day) { if (G.edictChDay !== G.day) { G.edictCh = NEST.edictChoices(G); G.edictChDay = G.day; saveRun(); } const v = await modal(edictHtml(), false, null); if (!G) return; if (NEST.EDICT[v]) { NEST.setEdict(G, v); sfx('talk'); saveRun(); } }
  AUTO.log = []; autoRun();
}
function showTitle() {
  { const er = store.get('err'); if (er && $('nojs')) { $('nojs').hidden = false; $('nojs').style.display = 'block'; $('nojs').textContent = '지난번에 문제가 있었습니다. 이 줄을 그대로 알려 주세요: ' + er; } }
  G = null; busy = false; $('game').hidden = true; $('title').hidden = false; const run = store.get('run'), free = META.lastDraw !== today();
  $('menu').innerHTML = (run ? btn('continue', null, `이어하기 <small>${run.day}일째${run.sign && NEST.SIGN[run.sign] ? ' · ' + NEST.SIGN[run.sign].name : ''}</small>`, 'pri w2') : '') + btn('new', null, '새로 떨어진다', run ? 'w2' : 'pri w2') + btn('barracks', null, '명부 · 별똥별' + (free ? ' <span class="coin">●</span>' : '')) + btn('records', null, '기록 · 순위') + btn('codex', null, '도감') + btn('help', null, '도움말') + btn('settings', null, '설정', 'w2');
  $('trec').textContent = META.best ? `최고 기록 ${META.best.grade} ${R(META.best.total)}점 · ${META.best.form} · 깨어남 ${META.clears}회` : '아직 기록이 없다';
}
function showGame() { $('title').hidden = true; $('game').hidden = false; $('game').classList.remove('night'); UI.tab = {}; UI.page = {}; ST.mode = 'day'; ST.ents = null; ST.roam = {}; ST.kinPos = {}; ST.hud = null; ST.screen = 'surface'; setScreen('under'); ST.p = 1; ST.cam = { x: 0, tx: 0 }; ST.camMem = { surface: 240, under: 0 }; UI.sel = null; setSheet(false); setNight(false); render(); }
function setNight(on) { ST.mode = on ? 'night' : 'day'; $('game').classList.toggle('night', on); $('right').classList.remove('open'); $('night').hidden = !on; $('view').hidden = on; $('foot').hidden = on; $('tray').hidden = on; $('recent').hidden = on; $('viewsw').hidden = on; if (on) { setSheet(false); $('nlog').innerHTML = ''; $('nparty').innerHTML = ''; $('hand').hidden = true; $('ntitle').textContent = G.day + '일째 밤' + (NEST.isSettle(G) ? ' · 달이 기운다' : ''); setSpeed(META.speed || 1); } }
function setSpeed(v) { ST.speed = v; META.speed = v; document.querySelectorAll('[data-a="speed"]').forEach(b => b.classList.toggle('on', +b.dataset.v === v)); }
async function newRun() {
  const L = META.last || {}, o = { diff: L.diff && !diffLock(L.diff) ? L.diff : 1, bring: [], tut: !META.tutDone && !META.board.length, tab: 'who', auto: false };
  for (;;) { const p = modal(setupHtml(o), true, null); modalKind = 'setup'; UI.setup = o; const v = await p; if (v === 'go') break; if (v === 'redraw') continue; return; }
  const legacy = META.roster.filter(r => o.bring.includes(r.rid)).map(r => ({ name: rosterName(r), kind: r.kind, lv: r.lv, skill: r.skill, rare: r.rare, stance: r.stance, rid: r.rid, evo: r.evo, parts: r.parts || [] }));
  const sk = curSign(), sg = NEST.SIGN[sk]; META.last = { diff: o.diff };
  // 땅속의 한 방울: 굴을 틀기 전에 직접 움직이며 먹고 자란다. 먹은 것이 첫 정수, 갈라져 나온 것이 첫 권속, 헤집은 자리가 굴이 된다.
  // (자동 시험에서는 건너뛰고 보통 결과를 쓴다. window.__forcePro 를 켜면 시험에서도 한다)
  const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0, played = typeof runPrologue === 'function' && !(navigator.webdriver && !window.__forcePro);
  let pr = NEST.proResult(sg.asp, 'avg'); if (played) { try { const r = await runPrologue({ asp: sg.asp, seed, tut: !!o.tut, speed: 1 }); if (r && !r.skipped) pr = r; else { pr.skipped = true; if (r && r.look) pr.look = r.look; } } catch (e) { console.error(e); } }   // 건너뛰면 보통 결과
  G = NEST.newGame(seed, sg.asp, { diff: o.diff, legacy, star: sg.star, sign: sk, prologue: pr }); G.auto = false; if (o.tut) G.tut = 0;
  META.runs++; saveMeta(); store.del('run');
  const kept = G.pro && G.pro.mut && NEST.MUT[G.pro.mut] ? NEST.MUT[G.pro.mut].name : '', after = !played || pr.skipped ? [] : [N_(pr.fell ? '쫓기던 한 방울은 겨우 바위틈에 숨었다. 상처가 깊고, 돋운 것들은 떨어져 나갔다.' : '한 방울은 헤집고 다닌 굴 끝에 자리를 잡았다.' + (kept ? ' 허물에 「' + kept + '」이(가) 새겨졌다.' : ''))];
  showGame(); await scene([N_(sg.name + '에서 별 하나가 떨어졌다. ' + sg.text)].concat(after, STORY.intro)); if (played && !pr.skipped && ((G.body || []).length || G.pro.mut || (G.pro.kinLean || []).length)) await modal(cameHtml()); morningFlow();
}
// 땅 위로 뚫는다: 되돌릴 수 없다. 어떤 세상인지 이때 처음 본다
const WHY = { fantasy: '무엇이든 낫게 하는 영약', wuxia: '내공을 끌어올리는 영단', modern: '값을 매길 수 없는 약의 원료', future: '바닥나지 않는 연료' };
async function revealWorld(found) {
  const w = NEST.WORLD[G.world]; if (!w) return; const names = ['villager', 'militia', 'warrior', 'scholar', 'priest'].map(k => NEST.INV[k].name).join(', ');
  sfx('evo'); ST.flash = now() + 300; setScreen('surface');
  await scene((found ? [N_('흙이 위에서부터 무너져 내렸다. 저들이 먼저 냄새를 맡았다.')] : [N_('마지막 흙 한 줌이 밀려 올라갔다. 처음으로 바깥 공기가 굴로 흘러든다.')]).concat([N_(w.reveal[0] + '. ' + w.reveal[1]), E_('여기는 이런 세상이구나. ' + names + ' 같은 것들이 내려올 거야.'), E_('저들이 내려오는 까닭은 네 진액이야. 둥지를 돌리는 그 피가 저들 눈에는 ' + (WHY[G.world] || '약이자 보물') + '(으)로 보여. 많이 고일수록 냄새가 멀리 퍼지고, 더 많이 와.'), E_('이 세상의 규칙은 「' + w.rule.name + '」. ' + w.rule.bane + '. 대신 ' + w.rule.boon + '.'), E_('오는 박자는 「' + w.beat[0] + '」. ' + w.beat[1] + '.'), E_('이 세상에만 있는 것도 있어. ' + w.only.map(k => NEST.INV[k].name + ': ' + NEST.INV[k].tip).join('. ') + '.'), E_(found ? '들켰으니 오늘 밤 바로 온다. 숨 돌릴 틈은 없어.' : '이제부터 밤마다 누가 올지 "지상"에서 볼 수 있어. 저들이 곧 먹이고, 먹어야 허물을 벗어.')]));
}
async function doBreach() {
  if (!G || !G.sealed || busy || ST.mode !== 'day') return; if (!NEST.paths(G).length) return void toast({ ok: false, msg: '굴이 아직 땅 밑에 갇혀 있다. 무른 흙을 따라 맨 위 칸까지 ' + NEST.trailLeft(G) + '칸 더 파야 한다' });
  if (!$('modal').hidden) closeModal(); setSheet(false);
  const v = await modal(M('땅 위로 뚫는다', `<p>굴을 열면 되돌릴 수 없다. 그때부터 땅 위의 것들이 밤마다 내려온다.</p><p class="small mute">저들이 먹이다. 먹지 못하면 허물을 벗지 못한다. 위가 어떤 세상인지는 뚫어 봐야 안다.</p><p class="small mute">더 숨어 있으면 밤마다 정수 +${NEST.K.deep.ess}을 얻고 권속을 더 돋울 수 있다. 대신 날은 흘러가고, 오래 숨을수록 먼저 들킬 위험이 커진다 (${NEST.K.deep.risk.map(r => Math.round(r * 100) + '%').join(' → ')}). 들키면 그 밤에 바로 내려온다.</p>`, btn('close', { v: 'go' }, '뚫는다', 'pri') + closeBtn('아직')));
  if (v !== 'go' || !G || !G.sealed) return;
  const r = NEST.breach(G); if (G.tut != null) { G.guest = null; G.march.tonight = { vill: 'field', settle: false, thin: true }; }
  UI.sel = null; UI.confirmEnd = false; busy = true; setScreen('surface'); render(); await revealWorld(false); busy = false; saveRun(); render(); toast(r);
}
async function morningFlow() {
  busy = true; render();
  const A = NEST.K.act, sc = { [A + 1]: 'act2', [2 * A + 1]: 'act3', [3 * A + 1]: 'act4', [4 * A + 1]: 'act5', [NEST.K.days]: 'last' }[G.day]; if (sc && G.sceneDay !== G.day) { G.sceneDay = G.day; await scene(STORY[sc].concat(G.day === NEST.OMEN_DAY && G.eld ? [E_('그리고 하나 더. 네가 허물 벗는 걸 「' + NEST.ELDER[G.eld.id].name + '」이(가) 봤어. 너보다 훨씬 먼저 다 자란 옛 것이야.'), E_('밤마다 그것이 뒤척이면 다음 날의 규칙이 하나 바뀐다. 좋아하는 짓을 하면 좋은 쪽만, 싫어하는 짓을 하면 나쁜 쪽만 와. 나쁜 쪽은 신앙을 바치면 달랠 수 있어.')] : [])); }
  saveRun(); busy = false; render();
  if (G.event) await openModal('event');
  if (G.auto) return autoMorning();
  if (G.day === 1 && G.applicants.length === 3 && !G.kin.length && G.tut == null) openModal('applicants');
}
function askHand(ctx) {
  const mode = META.pause; if (ST.skip || mode === 'never' || (mode === 'settle' && !ctx.settle)) return Promise.resolve(G.auto ? STEWARD.decide({ spend: 1 })(ctx) : { k: 'none' });   // 맡겼으면 묻지 않는 밤에는 권속들이 알아서 손을 쓴다
  ST.focus = locIdx(ctx.cell); camTo(cellRect(ST.focus).x + CW / 2); const sp = ctx.spell;
  $('hand').innerHTML = `<p class="h3">손을 쓸까? <small class="mute">남은 개입 ${ctx.hands} · 신앙 ${Math.floor(ctx.faith)}</small></p><p class="small mute">${esc(locName(ctx.cell))} · 적 ${ctx.enemies}명이 들어섰다</p><div class="stack">${btn('hand', { k: 'whip' }, '채찍 <small>이 방 공격 +30%</small>')}${sp ? btn('hand', { k: 'spell' }, `주문 「${sp.name}」 <small>신앙 ${sp.cost}</small>`, '', !sp.ok) : ''}${ctx.from.slice(0, isMobile() ? 3 : 6).map(f => btn('hand', { k: 'move', from: f }, `옮기기 <small>← ${esc(locName(f))}</small>`)).join('')}${btn('hand', { k: 'none' }, '그냥 둔다 <kbd>Space</kbd>', 'pri')}</div>`;
  $('hand').hidden = false; $('night').classList.add('asking'); sfx('talk');
  return new Promise(res => { handRes = v => { handRes = null; $('hand').hidden = true; $('night').classList.remove('asking'); ST.focus = null; res(v); }; });
}
async function endDay() {
  if (busy || !G || G.over) return;
  if (G.ap > 0 && !UI.confirmEnd) { UI.confirmEnd = true; render(); return; }
  busy = true; UI.confirmEnd = false; UI.sel = null; if (!$('modal').hidden) closeModal(); toast(null);
  const day = G.day, tonight = G.march.tonight, before = { origin: G.origin, body: G.slime.body, main: G.slime.main, sub: G.slime.sub, stage: G.slime.stage, muts: G.slime.muts.slice() };
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
  if (st.found && !G.over) await revealWorld(true);
  if (st.evolved) { sfx('evo'); ST.flash = now() + 300; await modal(evoHtml(st, before)); }
  if (rep && rep.result === 'stolen' && rep.fell) await scene(rep.lives > 1 ? (rep.fell === 1 ? STORY.fell : STORY.fell.slice(0, 2)) : rep.fell === 1 ? STORY.fell.slice(0, 2).concat(STORY.fell2) : STORY.fell2);
  if (G.over) return finishRun();
  busy = false; saveRun(); morningFlow();
}
async function finishRun() {
  busy = true; store.del('run'); const win = G.over.win, sc = NEST.score(G), unlocked = [];
  await scene(win ? STORY.win : G.over.why.includes('본체') ? STORY.core : STORY.broke);
  if (win) {
    META.clears++; if (META.clears === 1) unlocked.push('뒤집힌 가면자리, 눈먼 합창자리', '깊은 각성'); if (META.clears === 2) unlocked.push('외딴 등대자리, 유리 왕관자리', '끝없는 밤');
    META.codex.ends[NEST.endKey(G)] = 1; if (ENDING3[NEST.endKey(G)]) META.codex.ends[NEST.endKey(G) + endTier(sc.grade)] = 1;
  }
  if (META.board.length === 0) unlocked.push('가라앉은 닻자리, 빈 주머니자리, 끓는 솥자리');
  const form = win ? NEST.avatarOf(G) : NEST.formName(G);
  if (!META.best || sc.total > META.best.total) META.best = { total: sc.total, grade: sc.grade, form };
  META.board.push({ total: sc.total, grade: sc.grade, form, day: G.day, diff: G.diff, win, at: Date.now() }); META.board.sort((a, b) => b.total - a.total); META.board = META.board.slice(0, 10);
  UI.dustGain = Math.floor(sc.total / 100) + (win ? 20 : 0); META.dust += UI.dustGain; UI.grown = [];
  G.kin.forEach(m => { const r = m.rid && META.roster.find(x => x.rid === m.rid); if (!r) return; const lv = Math.min(ROSTER_LV, Math.max(r.lv, Math.floor((r.lv + m.lv) / 2))); if (lv > r.lv) UI.grown.push(rosterName(r) + ' Lv' + r.lv + ' → ' + lv); r.lv = lv; r.skill = m.skill; r.stance = m.stance; r.parts = (m.parts || []).map(p => Object.assign({}, p, { lv: Math.min(ROSTER_LV, p.lv) })); r.evo = r.evo || !!m.evo; r.runs = (r.runs || 0) + 1; });
  checkFeats(); (UI.featNew || []).forEach(f => { if (f[3] !== '별가루' && !f[3].includes('별자리')) unlocked.push(f[3] + ' (흔적 「' + f[1] + '」)'); }); UI.featNew = []; UI.featMsg = '';
  rollSign(); saveMeta(); cloudSubmit(sc, win); sfx(win ? 'evo' : 'down');
  { UI.tab.result = null; UI.endSc = sc; const pr = openM(() => resultHtml(sc, unlocked), true); modalKind = 'result'; startEnding(sc); await pr; UI.endSc = null; }
  const ks = G.kin.filter(m => m.kind !== 'spawn' && !m.rid), room = Math.min(2, ROSTER_MAX - META.roster.length);
  if (ks.length && room > 0) {
    const pickd = []; UI.legacy = pickd; UI.legacyMax = room; for (;;) { const p = modal(legacyHtml(pickd), true); modalKind = 'legacy'; const v = await p; if (v !== 'redraw') break; }
    ks.filter(m => pickd.includes(m.id)).forEach(m => { const lv = Math.min(ROSTER_LV, Math.max(1, Math.ceil(m.lv / 2))); META.roster.push({ parts: (m.parts || []).map(p => Object.assign({}, p, { lv: Math.min(ROSTER_LV, Math.max(1, Math.ceil(p.lv / 2))) })), rid: META.rid++, name: m.name, kind: m.kind, lv, skill: lv >= 7 ? 2 : lv >= 4 ? 1 : lv >= 2 ? 0 : -1, rare: !!m.rare, tier: m.rare ? 'R' : 'N', title: '', stance: m.stance, runs: 1, evo: !!m.evo }); });
    saveMeta();
  }
  showTitle();
}

// ---------- 입력 ----------
function onAction(el) {
  const a = el.dataset.a, d = el.dataset, num = k => +d[k];
  if (a === 'sceneskip') { if (sceneNext) sceneNext(true); return; }
  if (a === 'tutend') { if (G) { G.tut = null; saveRun(); } META.tutDone = true; saveMeta(); sfx('click'); return coach(); }
  if (a === 'tab' || a === 'page') {
    if (a === 'tab') { if (d.g === 'setup') UI.setup.tab = d.v; else UI.tab[d.g] = d.v; } else UI.page[d.g] = (UI.page[d.g] || 0) + num('v');
    sfx('click');
    if ($('modal').hidden) return render();
    if (modalKind === 'setup') return closeModal('redraw');
    if (UI.mfn) { const k = modalKind; redrawM(); modalKind = k; if (UI.endSc) startEnding(UI.endSc); return; }
    return refreshModal();
  }
  if (a === 'sheet') { UI.sel = null; UI.confirmEnd = false; sfx('click'); return G ? render() : null; }
  if (a === 'stat') return toast({ ok: true, msg: el.title });
  if (a === 'close') return closeModal(d.v);
  if (a === 'menu') return void modal(M('메뉴', `<div class="opts c1">${btn('help', null, '도움말')}${btn('log', null, '지난 일')}${btn('settings', null, '설정')}${btn('quit', null, '타이틀로 나가기 (자동 저장)')}</div>`, closeBtn()), false);
  if (a === 'help') return void openM(helpHtml, true);
  if (a === 'codex') return void openM(codexHtml, true);
  if (a === 'barracks') { UI.drawRes = null; return void openM(() => barracksHtml(UI.drawRes), true); }
  if (a === 'records') { openM(recordsHtml, true); fillCloudBoard(); return; }
  if (a === 'draw') { let res; if (d.v === 'free') { if (META.lastDraw === today()) return; META.lastDraw = today(); res = drawOnce(true); } else { if (META.dust < DRAW_COST) return; META.dust -= DRAW_COST; res = drawOnce(false); } saveMeta(); sfx(res.tier === 'L' ? 'evo' : res.dust ? 'coin' : 'up'); UI.drawRes = res; redrawM(); if (!G) showTitle(); return; }
  if (a === 'release') { if (!el.dataset.sure) { el.dataset.sure = 1; el.textContent = '정말 보낸다'; return; } META.roster = META.roster.filter(r => r.rid !== num('id')); META.dust += 20; saveMeta(); UI.drawRes = null; redrawM(); return; }
  if (a === 'share') { try { navigator.clipboard.writeText(d.v).then(() => { el.textContent = '복사했다'; }, () => { el.textContent = '복사하지 못했다'; }); } catch (e) { el.textContent = '복사하지 못했다'; } return; }
  if (a === 'settings') return void openM(settingsHtml, false);
  if (a === 'set') { if (d.k === 'sound') META.sound = d.v === '1'; if (d.k === 'pause') META.pause = d.v; if (d.k === 'open') { META.openAll = d.v === '1'; if (G) render(); } saveMeta(); sfx('click'); redrawM(); return; }
  if (a === 'wipe') { if (el.dataset.sure) { store.del('meta'); store.del('run'); META = META0(); closeModal(); if (!G) showTitle(); } else { el.dataset.sure = 1; el.textContent = '정말 지운다'; } return; }
  if (a === 'new') return void newRun();
  if (a === 'reroll') { if (META.dust < REROLL || signPool().length < 2) return; META.dust -= REROLL; rollSign(); sfx('spell'); return closeModal('redraw'); }
  if (a === 'continue') { const run = store.get('run'); if (run) { G = NEST.migrate(run); G.auto = false; NEST.applyWorld(G.world); showGame(); morningFlow(); } return; }
  if (a === 'setup') { const o = UI.setup; if (d.k === 'bring') { const k = o.bring.indexOf(+d.v); if (k >= 0) o.bring.splice(k, 1); else if (o.bring.length < 2) o.bring.push(+d.v); } else if (d.k === 'tut') o.tut = !o.tut; else if (d.k === 'auto') o.auto = d.v === '1'; else o.diff = +d.v; sfx('click'); return closeModal('redraw'); }
  if (a === 'legacy') { const p = UI.legacy, id = num('id'), i = p.indexOf(id); if (i >= 0) p.splice(i, 1); else if (p.length < (UI.legacyMax || 2)) p.push(id); sfx('click'); return closeModal('redraw'); }
  if (a === 'speed') return setSpeed(num('v'));
  if (a === 'skip') { ST.skip = true; if (handRes) handRes({ k: 'none' }); return; }
  if (a === 'hand') { if (handRes) handRes({ k: d.k, from: d.from === 'core' ? 'core' : d.from != null ? +d.from : null }); return; }
  if (!G || busy) return;
  if (a === 'quit') { saveRun(); if (!$('modal').hidden) closeModal(); return showTitle(); }
  if (a === 'hoard') { const r = act(NEST.hoardBuy, d.k); if (r && r.ok) { sfx('evo'); ST.flash = now() + 120; } return; }
  if (a === 'core') { if (ST.mode !== 'day') return; if (!$('modal').hidden) closeModal(); UI.sel = { t: 'cell', i: NEST.CORE }; UI.confirmEnd = false; setScreen('under'); camTo(cellRect(NEST.CORE).x + CW / 2); sfx('click'); render(); $('view').scrollTop = 0; return; }
  if (a === 'view') { if (d.v === 'surface' && G.sealed) return void toast({ ok: false, msg: '굴이 막혀 있어 땅 위가 보이지 않는다. 뚫어야 안다' }); if (UI.sel) UI.sel = null; setScreen(d.v); return render(); }
  if (a === 'breach') return void doBreach();
  if (a === 'release') return void act(NEST.release, num('id'));
  if (a === 'sel') { UI.sel = { t: d.t, i: num('i') }; UI.tab.cell = null; setScreen('under'); camTo(cellRect(num('i')).x + CW / 2); return render(); }
  if (a === 'gospot') { setScreen('surface'); UI.sel = G.spot ? { t: 'spot' } : null; if (G.spot) camTo(SPOS[G.spot.pos].x); return render(); }
  if (a === 'log') return void openModal('log');
  if (a === 'disposeall') { let n = 0, g0 = G.gold; for (let i = G.prison.length - 1; i >= 0; i--) if (NEST.dispose(G, i, 'ransom').ok) n++; UI.page.cap = 0; render(); saveRun(); refreshModal(); sfx('coin'); toast({ ok: true, msg: n + '명을 돌려보냈다. +' + R(G.gold - g0) + '방울' }); return; }
  if (a === 'spot') { const r = act(NEST.resolveSpot, num('i')); if (r.ok) { UI.sel = null; sfx('coin'); render(); toast(r); } return; }
  if (a === 'endday' && UI.sel && isMobile()) UI.sel = null;
  if (a === 'calm') { const r = act(NEST.calm); if (r.ok) sfx('spell'); return; }
  if (a === 'open') return void openModal(d.v);
  if (a === 'kin') return void openModal('kin:' + d.id);
  if (a === 'endday') return void (G && G.auto ? (AUTO.paused = !AUTO.paused, render()) : endDay());
  if (a === 'autopause') { AUTO.paused = !AUTO.paused; sfx('click'); return void render(); }
  if (a === 'autospeed') { AUTO.speed = d.v === 'next' ? ({ 1: 2, 2: 4, 4: 1 })[AUTO.speed] : +d.v; sfx('click'); return void render(); }
  if (a === 'dig') { UI.tab.cell = null; const r = act(NEST.dig, num('i')); if (r.ok) { sfx(r.found ? 'evo' : 'dig'); if (r.found) ST.flash = now() + 200; } return; }
  if (a === 'block') return void act(NEST.toggleBlock, num('i'));
  if (a === 'build') { UI.tab.cell = null; const before = NEST.combos(G).map(c => c.id), r = act(NEST.build, num('i'), d.v); if (r.ok) NEST.combos(G).filter(c => !before.includes(c.id)).forEach(c => { const first = !META.codex.combos[c.id]; META.codex.combos[c.id] = 1; saveMeta(); sfx('evo'); ST.flash = now() + 150; toast({ ok: true, msg: (first ? '조합 발견! ' : '조합 ') + '「' + c.name + '」 — ' + c.desc }); }); return; }
  if (a === 'guest') { const r = act(NEST.resolveGuest, num('i')); if (r.ok) { closeModal(); toast(r); } return; }
  if (a === 'trap') return void act(NEST.addTrap, num('i'), d.v);
  if (a === 'uptrap') return void act(NEST.upTrap, num('i'), num('j'));
  if (a === 'zone') return void act(NEST.setZone, num('i'));
  if (a === 'plot') { const r = act(NEST.setPlot, num('p'), d.v); if (r.ok && isMobile()) { UI.sel = null; render(); toast(r); } return; }
  if (a === 'accept') return void act(NEST.accept, num('i'));
  if (a === 'dismiss') { if (el.dataset.sure) { act(NEST.dismiss, num('id')); closeModal(); } else { el.dataset.sure = 1; el.textContent = '정말 삼킨다'; } return; }
  if (a === 'place') return void act(NEST.moveKin, num('id'), d.loc === 'bench' ? null : d.loc === 'core' ? 'core' : +d.loc);
  if (a === 'fuse') { const bm = G.kin.find(x => x.id === num('b')), r = act(NEST.fuseKin, num('id'), num('b')); if (r.ok) { const m = G.kin.find(x => x.id === num('id')); META.codex.fuse[m.kind + '+' + bm.kind] = 1; (r.made || []).forEach(k => { META.codex.rcp[k] = 1; }); saveMeta(); sfx('evo'); ST.flash = now() + ((r.made || []).length ? 450 : 220); UI.page.fuse = 0; modal(fuseHtml(m, bm, r.made), false, 'fused'); } return; }
  if (a === 'kinevo') { const r = act(NEST.evolveKin, num('id')); if (r.ok) { sfx('evo'); ST.flash = now() + 200; } return; }
  if (a === 'skill') return void act(NEST.setSkill, num('id'), num('i'));
  if (a === 'stance') return void act(NEST.setStance, num('id'), d.v);
  if (a === 'train') return void act(NEST.train, d.loc === 'core' ? 'core' : +d.loc, num('amt'));
  if (a === 'eat') return void act(NEST.eat);
  if (a === 'rest') return void act(NEST.rest);
  if (a === 'dispose') { const r = act(NEST.dispose, num('i'), d.how); if (r.mut) { sfx('evo'); ST.flash = now() + 200; } return; }
  if (a === 'raid') { const r = act(NEST.raid, d.v, num('l')); if (r.ok) { ST.shake = now() + 300; sfx('trap'); if (isMobile()) { UI.sel = null; render(); toast(r); } } return; }
  if (a === 'event') { const was = G.event ? G.event.id : '', o0 = G.origin, before = { origin: G.origin, body: G.slime.body, main: G.slime.main, sub: G.slime.sub, stage: G.slime.stage, muts: G.slime.muts.slice() }, r = act(NEST.resolveEvent, num('i')); if (r.ok) { closeModal(); if (was.startsWith('trait_') && G.origin !== o0) { META.codex.traits[G.origin] = 1; saveMeta(); sfx('evo'); ST.flash = now() + 250; modal(traitHtml(before), false, 'trait'); } } return; }
}
function stagePoint(e) { const b = $('stage').getBoundingClientRect(), u = b.height / H; return [(e.clientX - b.left) / u - ST.ox + ST.cam.x, (e.clientY - b.top) / u + (ST.cam.y || 0)]; }
function tipFor(h) {
  if (!h || !G) return '';
  if (h.t === 'cell') { const c = G.cells[h.i]; return c.dug ? NEST.ROOM[c.type].name + ' — ' + NEST.ROOM[c.type].desc : (NEST.canDig(G, h.i) ? '바위' : '바위 — 눌러서 판다'); }
  if (h.t === 'vill') return NEST.VILL[h.v].name + ' — ' + villState(h.v) + ' · 적의 ' + Math.round(G.vill[h.v].host);
  if (h.t === 'spot') return G.spot ? NEST.SPOT[G.spot.type].name + ' — 눌러서 살핀다 (행동 1)' : '';
  if (h.t === 'plot') return '길목 ' + (h.p + 1) + ' — ' + NEST.PLOT[G.plots[h.p]].desc;
  return h.t === 'up' ? '지상으로' : '둥지로';
}
function boot() {
  // 아이폰: 두 손가락 확대와 두 번 누르기 확대를 막는다
  ['gesturestart', 'gesturechange'].forEach(n => document.addEventListener(n, e => e.preventDefault()));
  document.addEventListener('dblclick', e => e.preventDefault());
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (el && !el.disabled) return onAction(el);
    if (!$('scene').hidden && sceneNext) return sceneNext();
  });
  // 좁은 화면: 지도를 좌우로 밀어서 본다.
  // 손가락은 touch 이벤트로 직접 받고 기본 동작을 막는다. (pointer 이벤트는 아이폰에서 조금만 비스듬히 밀어도 중간에 끊긴다)
  let drag = null, dragged = false, lastTouch = 0; const stg = $('stage');
  const scale = () => stg.getBoundingClientRect().height / H;
  const dragStart = (x, y) => { drag = { x, y, cam: ST.cam.tx, lx: x, lt: performance.now(), v: 0 }; dragged = false; };
  const dragMove = (x, y) => {
    if (!drag || !G) return false; const dx = x - drag.x;
    if (!dragged && Math.abs(dx) > 8) dragged = true; if (!dragged) return false;
    const t = performance.now(); if (t > drag.lt) drag.v = 0.5 * drag.v + 0.5 * (x - drag.lx) / (t - drag.lt); drag.lx = x; drag.lt = t;
    if (ST.viewW < W) { ST.camHold = now() + 3000; camTo(drag.cam - dx / scale() + ST.viewW / 2, true); }
    return true;
  };
  const dragEnd = () => { if (drag && dragged && ST.viewW < W && Math.abs(drag.v) > 0.3 && performance.now() - drag.lt < 90) camTo(ST.cam.tx - drag.v * 170 / scale() + ST.viewW / 2, 'fling'); drag = null; };
  stg.addEventListener('touchstart', e => { lastTouch = Date.now(); if (e.touches.length !== 1) { drag = null; return; } dragStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  stg.addEventListener('touchmove', e => { lastTouch = Date.now(); if (e.touches.length !== 1) return; if (dragMove(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault(); }, { passive: false });
  ['touchend', 'touchcancel'].forEach(n => stg.addEventListener(n, () => { lastTouch = Date.now(); dragEnd(); }));
  stg.addEventListener('mousedown', e => { if (Date.now() - lastTouch > 800) dragStart(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => { if (drag && Date.now() - lastTouch > 800) dragMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { if (Date.now() - lastTouch > 800) dragEnd(); });
  $('stage').addEventListener('click', e => {
    if (dragged) { dragged = false; return; }
    if (!G || busy || ST.mode !== 'day') return; const h = hitTest(...stagePoint(e));
    if (h && (h.t === 'up' || h.t === 'down')) return setScreen(h.t === 'up' ? 'surface' : 'under');
    UI.sel = h; UI.tab.cell = UI.tab.core = UI.tab.vill = null; UI.confirmEnd = false; sfx('click'); render(); $('view').scrollTop = 0;
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
    if (e.key === 'e' || e.key === 'E' || e.key === 'ㄷ') { if (G && G.auto) { AUTO.paused = !AUTO.paused; render(); } else endDay(); }
  });
  window.__nest = { get G() { return G; }, NEST, ST, get META() { return META; }, endingScene, slimeCanvas, kinCanvas, kinCanvasM, AUTO, invCanvasW };
  if (window.claude && window.claude.hot) try { window.claude.hot.onSnapshot && window.claude.hot.onSnapshot(() => ({ run: G })); } catch (e) { /* 무시 */ }
  initCloud(); showTitle(); requestAnimationFrame(loop);
  const nj = $('nojs'); if (nj) nj.remove();  // 여기까지 왔으면 정상 실행
}
boot();
