// 옛 것의 둥지 — 처음 받는 몸 열다섯. 별에서 떨어진 것은 판마다 꼴이 다르다. 아직 아무것도 아닌 작은 것들이다.
// SEEDS[id] = { name, say, mod, top }
//   say: 타고난 것을 한 줄로.  top: 머리 위에 돋는 부위(등불, 더듬이)가 붙는 자리 [x, y] (방울은 [16, 13])
//   mod: 땅속의 한 방울(prologue.js)이 읽는 타고난 것. 부위와 겹치는 법:
//     sp(빠르기)·light(밝은 둘레)·see(들키는 거리)·eat(한 입의 값)·ess(남긴 것의 정수)·bead(진액 방울) 은 부위의 효과에 곱한다
//     hp(버팀) 는 더한다.  pull(끌려 오는 둘레)·mouth(입의 힘)·stun(문 것이 굳는 초) 은 부위와 견주어 큰 쪽을 쓴다
//     drop(물리면 흘리는 수)·mend(상처가 아무는 초) 은 그 일을 하는 부위(닻주머니·가시, 이끼)가 있으면 부위의 값을 쓴다
//     act(타고난 재주) 는 발을 돋우면 그 발의 재주로 바뀐다.  fit(틈에 숨는 몸)·buried(묻힌 것이 보임)·keepPart 는 늘 그대로다
// 그림은 FORMS.seed_<id>: 32×32, FORMS.base 와 같은 약속(P = 바탕 빛깔, fr = 0..3). 징조의 빛깔은 넣지 않는다(첫 허물 뒤에 물든다).
const SEEDS = {
  drop: { name: '방울', say: '고르다. 쓰러져도 돋운 것을 잃지 않는다', mod: { keepPart: true }, top: [16, 13] },
  sliver: { name: '별조각', say: '빠르다. 대신 둘레가 어둡다', mod: { sp: 1.08, light: 0.85 }, top: [15, 11] },
  bead: { name: '구슬', say: '한 번 더 버틴다. 대신 느리다', mod: { hp: 1, sp: 0.84 }, top: [16, 17] },
  husk: { name: '빈껍질', say: '물려도 하나만 흘린다. 대신 조금 굼뜨다', mod: { drop: 1, sp: 0.98 }, top: [16, 17] },
  mote: { name: '티끌', say: '작아서 덜 들킨다. 대신 진액을 적게 줍는다', mod: { see: 0.86, bead: 0.75 }, top: [16, 20] },
  coil: { name: '똬리', say: '처음부터 튕겨 달아난다. 대신 평소엔 굼뜨다', mod: { act: true, sp: 0.98 }, top: [17, 17] },
  eye: { name: '눈방울', say: '둘레가 밝다. 대신 느리다', mod: { light: 1.3, sp: 0.97 }, top: [17, 16] },
  twin: { name: '쌍눈', say: '묻힌 것이 보인다. 대신 멀리서도 들킨다', mod: { buried: true, see: 1.04 }, top: [16, 17] },
  horn: { name: '뿔씨', say: '단단한 씨를 처음부터 깬다. 대신 긁는 소리에 들킨다', mod: { mouth: 1, see: 1.06 }, top: [13, 18] },
  sticky: { name: '끈끈이', say: '가까운 알갱이가 붙어 온다. 대신 물리면 더 흘린다', mod: { pull: 20, drop: 4 }, top: [16, 14] },
  flat: { name: '납작이', say: '틈에 한 몸 더 오래 숨는다. 대신 어둡고 굼뜨다', mod: { fit: 1, light: 0.88, sp: 0.97 }, top: [15, 22] },
  glow: { name: '빛씨', say: '진액 방울을 더 얻는다. 대신 빛나서 들킨다', mod: { bead: 1.5, light: 1.12, see: 1.03 }, top: [16, 16] },
  spore: { name: '홀씨', say: '가만두면 상처가 아문다. 대신 한 입이 작다', mod: { mend: 40, eat: 0.95 }, top: [16, 13] },
  pod: { name: '알씨', say: '남긴 것을 더 가져간다. 대신 굼뜨다', mod: { ess: 0.15, sp: 0.94 }, top: [16, 14] },
  thorn: { name: '가시알', say: '나를 문 것이 잠깐 굳는다. 대신 굼뜨다', mod: { stun: 1, sp: 0.93 }, top: [16, 16] },
};
if (typeof FORMS !== 'undefined') (function () {
  const dot = (K, x, y) => { K.flat(K.el(x, y, 1.4, 2), INKY); K.px(x, y - 1, '#ffffff'); };
  const boneOf = P => [P[0], mixh(P[2], '#ffffff', 0.45), '#ffffff', mixh(P[1], P[3], 0.45)];
  // 방울: 지금까지의 한 방울 그대로
  FORMS.seed_drop = (K, st, P, Q, fr) => { const a = FORMS.base(K, st, P, Q, fr); return Object.assign({ top: 13, bot: 28 }, a); };
  // 별조각: 비스듬히 선 가늘고 모난 조각
  FORMS.seed_sliver = (K, st, P, Q, fr) => {
    const b = fr % 2; K.shadow(16, 5);
    K.G([[13, 29], [10.5, 23], [14.5, 10 - b], [18, 14], [21.5, 24], [18.5, 29]], P);
    for (let y = 14; y <= 27; y++) K.px(15 + (y - 14) * 0.1, y, mixh(P[1], P[2], 0.65));
    K.px(13, 20, P[2]); K.px(19, 22, P[3]); dot(K, 13.5, 24); K.spark(15, 11 - b, P[2], fr === 1);
    return { cx: 16, cy: 23, R: 5, top: 10, bot: 29 };
  };
  // 구슬: 꿴 구멍이 난 둥근 알
  FORMS.seed_bead = (K, st, P, Q, fr) => {
    const b = fr % 2; K.shadow(16, 7.5);
    K.B(16, 23 + b * 0.5, 7, 6.5 - b * 0.5, P); K.rect(15, 17 + b, 3, 1, P[0]); K.px(16, 18 + b, mixh(P[3], P[0], 0.5));
    K.px(12, 20 + b, '#ffffff'); K.px(11, 21 + b, '#ffffff'); K.px(20, 27, P[2]); dot(K, 13.5, 24);
    return { cx: 16, cy: 23, R: 6, top: 17, bot: 29 };
  };
  // 빈껍질: 위가 깨져 나간 껍데기. 어두운 것이 안에서 내다본다
  FORMS.seed_husk = (K, st, P, Q, fr) => {
    const b = fr % 2, zig = [1, 2, 0, 2, 1, 0, 2, 1, 0, 2, 0, 1, 2, 0, 1], dk = mixh(P[3], P[0], 0.85); K.shadow(16, 7.5);
    K.flat(K.el(16, 20.5 - b * 0.5, 4.6, 3.4), dk, P[0]);
    K.flat(K.el(16, 22, 6.2, 2.4), dk, P[0]);
    K.ball(K.cut(K.el(16, 24, 7, 5.6), (x, y) => y >= 21 + zig[(x + 6) % 15]), 16, 24, 7, 5.6, P);
    K.rect(13, 19 - b, 2, 2, '#ffffff'); K.px(14, 20 - b, INKY); K.rect(17, 19 - b, 2, 2, '#ffffff'); K.px(18, 20 - b, INKY);
    K.px(18, 25, P[0]); K.px(19, 26, P[0]); K.px(18, 27, P[0]); K.px(12, 26, P[2]);
    K.G([[24, 29.5], [25, 26.5], [27.5, 28.5]], P);
    return { cx: 16, cy: 24, R: 6, top: 17, bot: 29 };
  };
  // 티끌: 아주 작은 알과 곁을 떠도는 먼지
  FORMS.seed_mote = (K, st, P, Q, fr) => {
    const b = fr % 2; K.shadow(16, 4.5);
    K.B(16, 25.5 + b * 0.5, 4.4, 3.9 - b * 0.3, P); K.flat(K.el(15, 25.5, 1, 1.5), INKY); K.px(15, 24.5, '#ffffff');
    [[9, 21], [23, 19], [19, 14], [12, 15], [25, 25], [7, 27]].forEach((q, i) => { const up = (fr + i) % 4 < 2 ? 0 : -1; if (i < 2) { K.rect(q[0], q[1] + up, 2, 2, P[0]); K.px(q[0], q[1] + up, P[2]); K.px(q[0] + 1, q[1] + 1 + up, P[1]); } else K.px(q[0], q[1] + up, i % 2 ? P[2] : P[1]); });
    return { cx: 16, cy: 25.5, R: 4, top: 21, bot: 29 };
  };
  // 똬리: 돌돌 감긴 채 떨어진 것. 고개만 내밀고, 튕기듯 늘었다 준다
  FORMS.seed_coil = (K, st, P, Q, fr) => {
    const s = [0, 1, 2, 1][fr], hx = 7 - s * 0.6, hy = 22.6 - s * 0.3, line = mixh(P[3], P[0], 0.4); K.shadow(16, 8);
    K.L([[12, 27], [8.6 - s * 0.4, 26], [hx, hy]], 2, 1.6, P);
    K.B(17, 23.5, 6.3, 5.8, P);
    for (let a = 0; a < 13.4; a += 0.16) { const r = 0.7 + a * 0.36; K.px(17 + Math.cos(a + 1) * r, 23.5 + Math.sin(a + 1) * r * 0.93, line); }
    K.px(14, 20, '#ffffff'); K.flat(K.el(hx + 0.2, hy, 0.9, 1.2), INKY); K.px(hx + 0.2, hy - 1, '#ffffff');
    return { cx: 16, cy: 23.5, R: 6, top: 17, bot: 29 };
  };
  // 눈방울: 몸의 거의 전부가 눈 하나
  FORMS.seed_eye = (K, st, P, Q, fr) => {
    const b = fr % 2; K.shadow(16, 7);
    K.L([[19, 19], [21.5, 15.5], [20.5, 12.5 - b]], 1.8, 0.7, P);
    K.B(16, 23.5 + b * 0.4, 6.6, 6 - b * 0.4, P); K.eye(15 + (fr === 2 ? 1 : 0), 23.5, 3.6, mixh(P[3], P[0], 0.3), false, 0);
    return { cx: 16, cy: 23.5, R: 6, top: 12, bot: 29 };
  };
  // 쌍눈: 실 한 가닥으로 이어진 두 알
  FORMS.seed_twin = (K, st, P, Q, fr) => {
    const b = fr % 2; K.shadow(16, 9);
    K.L([[11.5, 20.5], [16, 17 - b], [20.5, 21]], 0.8, 0.8, P);
    K.B(20.8, 24.9 - b * 0.4, 4.2, 4.1, P); K.B(11.6, 24.2 + b * 0.4, 4.9, 4.7, P);
    dot(K, 10.6 + (fr === 2 ? 1 : 0), 24.4 + b * 0.4); K.flat(K.el(20.4 + (fr === 2 ? 1 : 0), 25 - b * 0.4, 1.2, 1.7), INKY); K.px(20.4 + (fr === 2 ? 1 : 0), 24 - b * 0.4, '#ffffff');
    return { cx: 16, cy: 24.5, R: 6, top: 17, bot: 29 };
  };
  // 뿔씨: 앞으로 뻗은 단단한 뿔 하나
  FORMS.seed_horn = (K, st, P, Q, fr) => {
    const b = fr % 2, bone = boneOf(P); K.shadow(15.5, 6.5);
    K.B(14.5, 24.5 + b * 0.4, 5.6, 4.8 - b * 0.4, P);
    K.L([[17, 22], [21.5, 18], [25.5, 12.5 - b]], 2.2, 0.6, bone); K.px(20, 20, bone[3]); K.px(22, 17, bone[3]); K.px(24, 14, bone[3]);
    dot(K, 12.5, 24.6);
    return { cx: 15, cy: 24.5, R: 5, top: 12, bot: 29 };
  };
  // 끈끈이: 진득한 덩이에서 끈이 늘어나고 끝마다 방울이 맺혔다
  FORMS.seed_sticky = (K, st, P, Q, fr) => {
    K.shadow(16, 8.5);
    [[12, 23, 9.5, 17.5], [16, 22, 16, 13.5], [20, 23, 23, 18]].forEach((q, i) => { const up = i === fr % 3 ? -1 : 0; K.L([[q[0], q[1]], [q[2], q[3] + up]], 1, 0.6, P); K.B(q[2], q[3] + up, 1.7, 1.7, P); K.px(q[2] - 1, q[3] - 1 + up, '#ffffff'); });
    K.B(16, 25.6, 7.5, 4.1, P); K.px(10, 29, P[1]); K.px(10, 30, P[3]); K.px(22, 29, P[3]); dot(K, 13.6, 25.6);
    return { cx: 16, cy: 25.5, R: 6, top: 13, bot: 29 };
  };
  // 납작이: 바닥에 퍼진 얇은 것. 한쪽 끝이 말려 올라갔다
  FORMS.seed_flat = (K, st, P, Q, fr) => {
    const b = fr % 2; K.shadow(16, 11);
    K.L([[23.5, 26.8], [26.2, 25.2], [25.6, 23.4 - b]], 1.2, 0.6, P);
    K.B(16, 27.2, 10, 2.5, P); K.B(15, 25.4 - b * 0.3, 5.4, 2.5, P);
    K.flat(K.el(13.5, 25.2 - b * 0.3, 1.3, 1.4), INKY); K.px(13.5, 24.4 - b * 0.3, '#ffffff'); K.px(8, 27, P[2]);
    return { cx: 16, cy: 26, R: 5, top: 23, bot: 29 };
  };
  // 빛씨: 속에 불씨를 품은 알. 빛이 새어 나온다
  FORMS.seed_glow = (K, st, P, Q, fr) => {
    const lit = mixh(P[4], '#ffffff', 0.35); K.shadow(16, 6);
    for (let i = 0; i < 8; i++) { const a = i * 0.7854 + 0.2, long = (i + fr) % 2 === 0, r0 = 6.6, r1 = long ? 9.4 : 7.8; if (Math.sin(a) > 0.75) continue; for (let r = r0; r <= r1; r += 0.9) K.px(16 + Math.cos(a) * r, 23.5 + Math.sin(a) * r * 0.95, r > 8.4 ? P[4] : lit); }
    K.B(16, 23.5, 5, 5, P); K.flat(K.el(17.6, 23.6, 2, 2.2), P[4], mixh(P[1], P[4], 0.5)); K.px(17, 23, '#ffffff'); K.px(18, 23, lit); K.px(17, 24, lit);
    K.flat(K.el(13, 24, 1, 1.6), INKY); K.px(13, 23, '#ffffff');
    return { cx: 16, cy: 23.5, R: 5, top: 15, bot: 29 };
  };
  // 홀씨: 가는 자루 끝에 솜털이 핀 씨
  FORMS.seed_spore = (K, st, P, Q, fr) => {
    const b = fr % 2, ty = 14 - b, fl = [P[0], mixh(P[2], '#ffffff', 0.3), '#ffffff', P[2]]; K.shadow(16, 4.5);
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (1 + i / 8), ex = 16 + Math.cos(a) * 6.6, ey = ty + Math.sin(a) * 5.6 - (i % 2 ? 0 : 0.6); K.L([[16, ty], [ex, ey]], 0.5, 0.5, fl, null); K.px(ex, ey, '#ffffff'); }
    K.L([[16, 24], [16.6, 19], [16, ty]], 0.7, 0.6, P);
    K.B(16, 26.4, 3.7, 3.2, P); K.flat(K.el(15, 26.4, 1, 1.5), INKY); K.px(15, 25.4, '#ffffff');
    return { cx: 16, cy: 26, R: 4, top: 8, bot: 29 };
  };
  // 알씨: 꼭지 위에 선 길쭉한 알
  FORMS.seed_pod = (K, st, P, Q, fr) => {
    const b = fr % 2; K.shadow(16, 6);
    K.G([[10.5, 28.5], [12.5, 26.3], [14.5, 28.6], [16, 26.3], [17.5, 28.6], [19.5, 26.3], [21.5, 28.5], [16, 30.5]], [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)]);
    K.B(16, 21.6 + b * 0.4, 5, 7 - b * 0.4, P); K.px(18, 18 + b, P[3]); K.px(19, 24, P[3]); K.px(13, 26, P[3]); K.px(17, 21, P[2]); K.px(14, 17 + b, P[2]);
    dot(K, 14, 22.4);
    return { cx: 16, cy: 22, R: 5, top: 14, bot: 30 };
  };
  // 가시알: 온몸에 가시가 돋은 밤송이
  FORMS.seed_thorn = (K, st, P, Q, fr) => {
    const bone = boneOf(P); K.shadow(16, 7.5);
    for (let i = 0; i < 10; i++) { const a = i * 0.6283 + 0.15, ca = Math.cos(a), sa = Math.sin(a); if (sa > 0.72) continue; const L = 8.6 + ((i + fr) % 2) * 0.7; K.L([[16 + ca * 3.6, 24 + sa * 3.2], [16 + ca * L, 24 + sa * L * 0.92]], 1.1, 0.4, bone); }
    K.B(16, 24, 5, 4.6, P); dot(K, 14, 24.2); K.px(18, 22, P[2]); K.px(19, 26, P[3]);
    return { cx: 16, cy: 24, R: 5, top: 15, bot: 29 };
  };
})();
if (typeof module !== 'undefined') module.exports = SEEDS;
