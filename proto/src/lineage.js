// 옛 것의 둥지 — 본체의 계통. 허물을 벗을 때마다 꼴은 크게 바뀌지만, 한 종이 자라는 것으로 읽혀야 한다.
// 징조마다 끝까지 따라가는 표지가 있다.
//   심연: 등불과 노란 세로눈, 이빨 가득한 입  (올챙이 → 아귀 → 긴꼬리 아귀 → 해구의 주인)
//   성운: 노란 외눈과 수정                      (눈 뜬 씨앗 → 눈 품은 수정 → 고리 두른 눈 → 틈을 여는 눈)
//   번식: 흰 자루의 얼굴과 초록 갓, 알           (새끼 버섯 → 걷는 버섯 → 알 밴 버섯 → 낳는 숲)
//   황혼: 흰 가면과 눈알 무늬                    (가면 애벌레 → 가면 고치 → 막 두른 나방 → 연출가 나방)
//   기아: 둥근 이빨 고리 입과 뼈 가시            (씹는 구더기 → 이빨 유충 → 목구멍 벌레 → 마지막 한 입)
// monsters.js 바로 뒤에 붙는다. 여기서 다시 정하지 않은 모습(심연 2, 성운 1·2, 번식 2, 황혼 3)은 monsters.js 의 것을 그대로 쓴다.
const LURE_R = ['#3a2a10', '#ffd23a', '#fff3a0', '#c8901a'], STK_R = P => [P[0], '#e4e0c4', '#ffffff', '#aaa482'], STR_C = '#d8c8a8';
const mawRing = (K, hx, hy, R, fr, P) => {      // 기아의 입: 이빨이 고리로 돋은 목구멍
  K.flat(K.el(hx, hy, R, R), '#1a0508', P[0]); K.flat(K.el(hx, hy, R * 0.76, R * 0.76), '#6a1018'); K.flat(K.el(hx, hy, R * 0.37, R * 0.37), '#1a0508'); K.px(hx, hy, '#ffb347');
  const n1 = Math.max(8, Math.round(R * 1.6)), n2 = Math.max(5, Math.round(R * 0.9));
  for (let k = 0; k < n1; k++) { const a = k * 6.2832 / n1 + fr * 0.13; K.px(hx + Math.cos(a) * (R - 1), hy + Math.sin(a) * (R - 1), '#fbf7ea'); if (R > 5) K.px(hx + Math.cos(a) * (R - 2.2), hy + Math.sin(a) * (R - 2.2), '#cfc8b4'); }
  for (let k = 0; k < n2; k++) { const a = k * 6.2832 / n2 - fr * 0.2; K.px(hx + Math.cos(a) * R * 0.5, hy + Math.sin(a) * R * 0.5, '#fbf7ea'); }
};
const boneSpine = (K, cx, cy, ox, oy, r, len) => K.G([[cx + ox * r * 0.7 - oy * r * 0.36, cy + oy * r * 0.7 + ox * r * 0.36], [cx + ox * (r * 0.7 + len), cy + oy * (r * 0.7 + len)], [cx + ox * r * 0.7 + oy * r * 0.36, cy + oy * r * 0.7 - ox * r * 0.36]], BONE_R);
const eyeSpot = (K, cx, cy, r, col, lid) => { K.flat(K.el(cx, cy, r + 1, r + 1), INKY); K.flat(K.el(cx, cy, r, r), '#f2ecd8'); K.flat(K.el(cx, cy, r * 0.6, r * 0.6), col); K.flat(K.el(cx, cy, Math.max(0.5, r * 0.28), Math.max(0.5, r * 0.28)), INKY); K.px(cx - r * 0.4, cy - r * 0.4, '#ffffff'); if (lid) K.rect(Math.round(cx - r), Math.round(cy - r), Math.round(r * 2) + 1, Math.max(1, Math.round(r)), INKY); };
const capOf = (K, cx, cy, rx, ry, P) => K.ball(K.cut(K.el(cx, cy, rx, ry), (x, y) => y <= cy), cx, cy, rx, ry, P);
const shroomFace = (K, cx, cy, k) => {         // 번식의 얼굴: 검은 눈구멍에 노란 불빛, 이빨 난 입
  K.flat(K.el(cx - 3.5 * k, cy, 1.7 * k, 2.3 * k), INKY); K.flat(K.el(cx + 3.5 * k, cy, 1.7 * k, 2.3 * k), INKY); K.px(cx - 3.5 * k, cy - 1, '#f0e060'); K.px(cx + 3.5 * k, cy - 1, '#f0e060');
};

// ---------- 심연: 등불 달린 것 ----------
FORMS.abyss1 = (K, st, P, Q, fr) => {          // 등불 올챙이: 눈만 큰 올챙이. 이마에 등불의 싹이 돋았다
  const s = SW(fr); K.shadow(15, 11);
  K.G([[21, 19], [27, 12 + s], [31, 5 + s], [29, 15 + s], [24, 24]], [P[0], P[3], Q[1], mixh(P[3], P[0], 0.4)]);                // 꼬리 지느러미
  K.L([[20, 23], [25, 20], [28, 14 + s], [29, 8 + s]], 3.4, 1, P);
  K.B(13, 22, 9, 7, P); K.flat(K.cut(K.el(13, 25, 7, 3.4), (x, y) => y > 25), mixh(P[2], '#ffffff', 0.2));                  // 배
  K.eye(10, 20, 4, '#f0d060', true);
  K.rect(14, 26, 5, 1, P[0]); K.px(19, 25, P[0]); K.px(15, 27, '#fbf7ea'); K.px(17, 27, '#fbf7ea');                           // 벌써 이빨이 둘
  K.L([[14, 15], [11, 9], [7, 8 + s]], 1, 0.7, P); K.B(5.5, 9 + s, 1.8, 1.8, LURE_R); K.spark(5, 9 + s, '#fff3a0', fr % 2 === 0);   // 등불의 싹
  K.B(9, 29, 2.4, 1.6, P); K.B(18, 29.4, 2.2, 1.4, P);
  return { cx: 13, cy: 22, R: 8, top: 14, bot: 29, head: [13, 12], back: [[17, 16], [22, 19], [13, 15]], belly: [14, 26], side: [20, 22], under: [[8, 30], [14, 30], [20, 30]] };
};
FORMS.abyss3 = (K, st, P, Q, fr) => {          // 긴꼬리 아귀: 입은 그대로 크고, 몸이 길어져 꼬리가 말려 올라간다. 등불이 둘
  const s = SW(fr), FN = [P[0], P[3], Q[1], mixh(P[3], P[0], 0.4)], SP = [P[0], Q[1], Q[2], P[3]], GL = '#ffd23a'; K.shadow(24, 20);
  K.G([[41, 12 + s], [35, 5 + s], [39, 1 + s], [42, 7 + s], [46, 1 + s], [47, 8 + s], [44, 13 + s]], FN);                                                              // 꼬리 지느러미
  K.L([[28, 31], [37, 34], [43, 30], [45, 21 + s], [43, 12 + s]], 7, 1.2, P);                                                 // 길어진 몸
  for (let k = 0; k < 3; k++) K.G([[39 + k * 2.4, 26 - k * 5], [46 + k, 22 - k * 5 + s * (k % 2)], [40 + k * 2, 20 - k * 5]], SP);   // 꼬리 가시
  for (let k = 0; k < 5; k++) K.G([[13 + k * 4.6, 19], [15.4 + k * 4.6, 10 + (k % 2) * 2], [18 + k * 4.6, 19]], SP);              // 등 가시
  K.B(19, 30, 16, 12, P);
  K.G([[28, 34], [37, 36 + s], [33, 43]], FN);                                                                               // 가슴지느러미
  K.flat(K.el(15, 35, 13, 6.2), '#1a0508', P[0]); K.flat(K.el(15, 36, 9, 3.4), '#5a0c14');                                  // 입 안
  K.fangs(4, 26, 30, 1, 6, 3); K.fangs(5, 25, 40, -1, 5, 3);
  K.L([[6, 42], [15, 44.4], [25, 42]], 1.8, 1.8, P);                                                                         // 아랫입술
  K.eye(27, 22, 3, GL, true); K.eye(20.5, 20.5, 1.5, GL);
  [[33, 31], [38, 31], [42, 27], [43, 21]].forEach(([lx, ly], k) => { K.px(lx, ly, '#9fe8f0'); if ((fr + k) % 4 === 0) K.px(lx, ly, '#ffffff'); });   // 옆줄의 빛
  K.L([[23, 19], [27, 12], [31, 11 - s]], 1, 0.6, P); K.B(33, 12 - s, 2.2, 2.2, LURE_R);                                        // 둘째 등불
  K.L([[16, 19], [10, 9], [13, 3 + s], [20, 3 + s]], 1.4, 0.8, P); K.B(23, 6 + s, 3.4, 3.4, LURE_R); K.spark(23, 6 + s, '#fff3a0', fr % 2 === 0);  // 등불
  K.B(11, 45.6, 3.4, 1.7, P); K.B(26, 45.6, 3.4, 1.7, P);
  return { cx: 20, cy: 30, R: 13, top: 17, bot: 46, head: [19, 12], back: [[31, 22], [12, 20], [39, 27]], belly: [30, 38], side: [37, 31], under: [[10, 47], [22, 47], [36, 47]] };
};
FORMS.abyss4 = (K, st, P, Q, fr) => {          // 해구의 주인: 똬리를 튼 긴 몸 위에 아귀의 머리. 등불이 길을 비춘다
  const s = SW(fr), BL = [P[0], mixh(P[2], '#ffffff', 0.15), '#ffffff', P[1]], FN = [P[0], Q[1], Q[2], Q[3]], GL = '#ffd23a'; K.shadow(27, 23);
  K.L([[42, 44], [49, 38], [48, 30 + s], [44, 26 + s]], 3.4, 1, P); K.G([[44, 27 + s], [50, 20 + s], [47, 30 + s]], FN);                // 꼬리
  K.B(34, 41, 17, 9, P); K.flat(K.cut(K.el(34, 44, 14, 5), (x, y) => y > 44 && (x + y) % 3 !== 0), BL[1]);                       // 뒤 똬리
  K.B(17, 44, 13, 7, P); K.flat(K.cut(K.el(17, 46, 10, 4), (x, y) => y > 46 && (x + y) % 3 !== 0), BL[1]);                        // 앞 똬리
  [[24, 40], [31, 37], [40, 38], [45, 42], [11, 41]].forEach(([lx, ly], k) => K.px(lx, ly, (fr + k) % 4 === 0 ? '#ffffff' : '#9fe8f0'));   // 옆줄의 빛
  const neck = [[31, 38], [39, 31], [38, 23], [31, 18], [23, 17]];
  for (let k = 0; k < 5; k++) { const f = k / 4, px0 = 40 - f * 9, py0 = 32 - f * 15; K.G([[px0 + 3, py0 + 2], [px0 + 10 - f * 3, py0 - 5 + s * (k % 2)], [px0 + 1, py0 - 5]], FN); }   // 등지느러미
  K.L(neck, 7.2, 6, P);
  K.commit(K.cut(K.path(neck, 7.2, 6), (x, y) => { let best = 99; for (let i = 0; i < 40; i++) { const f = i / 39, a = neck[Math.min(3, Math.floor(f * 4))], b = neck[Math.min(4, Math.floor(f * 4) + 1)], g = f * 4 - Math.floor(f * 4), cx = a[0] + (b[0] - a[0]) * g - 3.2, cy = a[1] + (b[1] - a[1]) * g + 2.6, d = Math.hypot(x - cx, y - cy); if (d < best) best = d; } return best < 3.1 && (x + y * 2) % 4 !== 0; }), () => BL[1]);   // 배 비늘
  [[36, 26], [38, 32]].forEach(([ex, ey], k) => K.eye(ex, ey, 1.6, GL, false, (fr + k) % 4 === 0 ? 1 : 0));                    // 목의 눈
  K.G([[21, 9], [25, 1], [27, 10]], FN); K.G([[26, 11], [31, 5], [31, 13]], FN);                                               // 볏
  K.B(15, 16, 12, 9, P);                                                                                                     // 아귀의 머리
  K.flat(K.el(11, 20, 10, 5), '#1a0508', P[0]); K.flat(K.el(11, 21, 7, 2.6), '#5a0c14');
  K.fangs(2, 20, 16, 1, 5, 3); K.fangs(3, 19, 24, -1, 4, 3);
  K.L([[3, 25.4], [11, 27], [20, 25]], 1.5, 1.5, P);
  K.eye(22, 11.5, 2.8, GL, true); K.eye(16, 10, 1.4, GL);
  K.L([[22, 8], [28, 3], [33, 3 - s]], 1, 0.6, P); K.B(35, 4 - s, 2.2, 2.2, LURE_R);                                           // 둘째 등불
  K.L([[18, 8], [14, 2], [8, 1 + s]], 1.3, 0.7, P); K.B(5.4, 3.4 + s, 3, 3, LURE_R); K.spark(5, 3 + s, '#fff3a0', fr % 2 === 0);     // 등불
  K.L([[7, 28], [5, 33], [7, 37 + s]], 1, 0.6, [P[0], Q[2], Q[2], Q[1]]); K.px(7, 38 + s, '#fff3a0'); K.L([[14, 28], [13, 33], [15, 37 - s]], 1, 0.6, [P[0], Q[2], Q[2], Q[1]]); K.px(15, 38 - s, '#fff3a0');   // 수염 끝에도 불
  return { cx: 28, cy: 31, R: 15, top: 6, bot: 49, head: [22, 3], back: [[41, 33], [44, 41], [30, 37]], belly: [22, 44], side: [42, 26], under: [[10, 50], [26, 50], [42, 50]] };
};

// ---------- 성운: 외눈과 수정 ----------
FORMS.nebula3 = (K, st, P, Q, fr) => {         // 고리 두른 눈: 수정은 그대로 눈을 품고, 둘레에 고리가 돈다
  const s = SW(fr), cy = 23 + s, QR = [P[0], Q[1], Q[2], Q[3]]; K.shadow(24, 15);
  [[5, 4], [43, 4], [5, 42], [43, 42]].forEach(([tx, ty]) => K.flat(K.poly([[tx, ty + s], [24 + (tx < 24 ? -3 : 3), cy], [24, cy + (ty < 24 ? -3 : 3)]]), mixh(P[3], P[0], 0.35)));
  K.lit(ringM(K, 24, cy, 21.4, 21.4, 2.6), P);
  K.lit(K.cut(ringM(K, 24, cy, 21, 7.4, 2.2), (x, y) => y < cy), GOLD_R); K.lit(K.cut(ringM(K, 24, cy, 7.4, 21, 2.2), (x, y) => x < 24), QR);
  gem(K, [[24, cy - 13], [32, cy - 6], [32, cy + 6], [24, cy + 13], [16, cy + 6], [16, cy - 6]], 24, P);                          // 눈을 품은 수정
  K.eye(24, cy, 5.2, '#ffd23a', true);
  K.lit(K.cut(ringM(K, 24, cy, 21, 7.4, 2.2), (x, y) => y >= cy + 4 && (x < 15 || x > 33)), GOLD_R); K.lit(K.cut(ringM(K, 24, cy, 7.4, 21, 2.2), (x, y) => x >= 28 && (y < cy - 10 || y > cy + 10)), QR);
  for (let k = 0; k < 6; k++) { const a = k * 1.047 + 0.52; K.eye(24 + Math.cos(a) * 20.4, cy + Math.sin(a) * 20.4, 1.8, k % 2 ? '#fff3a0' : Q[2], false, (fr + k) % 4 === 0 ? 1 : 0); }
  K.spark(21, cy - 9, '#ffffff', fr % 2 === 0);
  return { cx: 24, cy: 23, R: 12, top: 2, bot: 45, head: [24, 4], back: [[36, 9], [12, 9], [41, 20]], belly: [24, 33], side: [39, 26], under: [[14, 44], [24, 46], [34, 44]] };
};
FORMS.nebula4 = (K, st, P, Q, fr) => {         // 틈을 여는 눈: 수정이 꽃잎처럼 벌어지고, 눈동자가 밤하늘로 찢어졌다
  const s = SW(fr), cy = 27 + s, QR = [P[0], Q[1], Q[2], Q[3]], VOID = '#0a0618'; K.shadow(26, 18);
  [[4, 5], [48, 5], [4, 49], [48, 49]].forEach(([tx, ty]) => K.flat(K.poly([[tx, ty + s], [26 + (tx < 26 ? -4 : 4), cy], [26, cy + (ty < 26 ? -4 : 4)]]), mixh(P[3], P[0], 0.35)));
  K.lit(K.cut(ringM(K, 26, cy, 25, 8.6, 2.4), (x, y) => y < cy), GOLD_R);                                                     // 고리의 뒤쪽
  gem(K, [[26, 0 + s], [32, 8 + s], [30, 17 + s], [22, 17 + s], [20, 8 + s]], 26, P);                                            // 벌어진 수정 넷
  gem(K, [[26, 52 + s], [32, 45 + s], [30, 37 + s], [22, 37 + s], [20, 45 + s]], 26, P);
  gem(K, [[7, cy - 14], [13, cy - 8], [14, cy + 8], [8, cy + 15], [3, cy + 8], [2, cy - 7]], 8, QR);
  gem(K, [[45, cy - 14], [50, cy - 7], [49, cy + 8], [44, cy + 15], [38, cy + 8], [39, cy - 8]], 44, QR);
  K.B(26, cy, 13.4, 13.4, P);
  K.flat(K.el(26, cy, 10.6, 10.6), INKY); K.flat(K.el(26, cy, 9.6, 9.6), '#f2ecd8'); K.flat(K.el(26, cy, 7.4, 7.4), '#ffd23a'); K.commit(ringM(K, 26, cy, 7.4, 7.4, 1.2), () => '#c8901a');
  const rift = K.poly([[26, cy - 10], [30, cy], [26, cy + 10], [22, cy]]);                                                    // 눈동자: 틈
  K.commit(rift, (x, y) => { const h = ((x * 73856093) ^ (y * 19349663)) >>> 0; return h % 7 === 0 ? ((h + fr) % 3 ? '#ffffff' : '#fff3a0') : h % 5 === 0 ? '#2a1c50' : VOID; }, '#fff3a0');
  K.px(22, cy - 5, '#ffffff'); K.px(21, cy - 4, '#ffffff'); K.spark(26, cy, '#ffffff', fr % 2 === 0);
  K.lit(K.cut(ringM(K, 26, cy, 25, 8.6, 2.4), (x, y) => y >= cy + 3 && (x < 13 || x > 39)), GOLD_R);                           // 고리의 앞쪽
  for (let k = 0; k < 4; k++) { const a = [0.62, 2.52, 3.76, 5.66][k]; K.eye(26 + Math.cos(a) * 20, cy + Math.sin(a) * 17, 1.8, k % 2 ? '#fff3a0' : Q[2], false, (fr + k) % 4 === 0 ? 1 : 0); }
  K.spark(15, 4, P[2], fr % 2 === 0); K.spark(40, 48, '#fff3a0', fr % 2 === 1); K.px(11, 47, P[2]); K.px(43, 6, '#ffffff');
  return { cx: 26, cy: 27, R: 14, top: 1, bot: 50, head: [26, 2], back: [[38, 12], [14, 12], [44, 20]], belly: [26, 41], side: [41, 31], under: [[14, 49], [26, 51], [38, 49]] };
};

// ---------- 번식: 버섯 ----------
FORMS.brood1 = (K, st, P, Q, fr) => {          // 새끼 버섯: 갓이 막 돋은 흰 알뿌리. 얼굴은 벌써 어미를 닮았다
  const s = SW(fr), STK = STK_R(P), SPOT = mixh(P[2], '#ffffff', 0.3); K.shadow(16, 10);
  K.L([[11, 27], [8, 29], [5, 30]], 1.6, 0.8, ROOT_R); K.L([[16, 28], [16, 30]], 1.6, 1, ROOT_R); K.L([[21, 27], [24, 29], [27, 30]], 1.6, 0.8, ROOT_R);
  K.B(26, 26.4, 2.4, 2.4, EGG_R);
  K.B(16, 22, 7.6, 6.6, STK);
  shroomFace(K, 16, 21, 0.86); K.flat(K.el(16, 25.4, 2.2, 1.1), INKY); K.px(15, 25, '#fbf7ea'); K.px(17, 25, '#fbf7ea');
  K.flat(K.el(16, 15.6, 9, 2.2), mixh(P[3], P[0], 0.45), P[0]); for (let gx = 8; gx < 25; gx += 2) K.px(gx, 16, P[0]);
  capOf(K, 16, 15, 10.6, 8.4, P);
  [[12, 11, 1.9, 1.3], [19, 9, 1.6, 1.1], [22, 13, 1.2, 0.9]].forEach(([a, b, c, d]) => K.flat(K.el(a, b, c, d), SPOT));
  K.L([[16, 7], [17, 4], [15, 2 + s]], 1, 0.6, P); K.px(14, 2 + s, P[2]);                                                       // 한 방울의 꼭지가 아직 남았다
  K.spark(4, 8 + s, '#d0f08a', fr % 2 === 0); K.px(28, 6 - s, '#d0f08a');
  return { cx: 16, cy: 20, R: 8, top: 6, bot: 30, head: [16, 3], back: [[23, 10], [9, 10], [16, 7]], belly: [16, 27], side: [23, 22], under: [[10, 31], [16, 31], [22, 31]] };
};
FORMS.brood3 = (K, st, P, Q, fr) => {          // 알 밴 버섯: 갓이 활짝 펴지고, 자루 아래가 알로 불룩하다. 갓 끝마다 알주머니
  const s = SW(fr), STK = STK_R(P), SPOT = mixh(Q[2], '#ffffff', 0.3), EG = [Q[0], Q[1], Q[2], Q[3]]; K.shadow(24, 20);
  K.L([[16, 41], [10, 44], [5, 46]], 2.2, 1, ROOT_R); K.L([[20, 43], [18, 46]], 2, 1.2, ROOT_R); K.L([[28, 43], [30, 46]], 2, 1.2, ROOT_R); K.L([[32, 41], [38, 44], [43, 46]], 2.2, 1, ROOT_R);
  K.L([[5, 41], [5, 35]], 1.4, 1.4, STK); capOf(K, 5, 35, 4.6, 4, P); K.L([[43, 42], [43, 37]], 1.4, 1.4, STK); capOf(K, 43, 37, 4.2, 3.6, P);   // 새끼들
  K.B(24, 35.4, 12.4, 9, STK);                                                                                               // 알 밴 배
  K.flat(K.el(24, 37, 9, 5.6), mixh('#e4e0c4', '#f0e060', 0.4), '#aaa482');
  [[19, 36, 2.4], [24.5, 38.4, 2.6], [29.4, 36, 2.3], [24, 34, 2]].forEach(([ex, ey, r], k) => { K.B(ex, ey, r, r, EG); K.px(ex, ey + ((fr + k) % 2), INKY); });
  [[7, 19, 25], [14, 20, 23], [34, 20, 24], [41, 19, 26]].forEach(([hx, y0, y1], k) => { const yy = y1 + (k % 2 ? s : -s); for (let y = y0; y < yy; y++) K.px(hx, y, '#3a3410'); K.B(hx, yy + 2, 2.3, 2.9, EG); K.px(hx, yy + 3, INKY); });   // 갓 끝의 알주머니
  K.B(24, 25, 7.6, 7, STK);                                                                                                  // 얼굴
  shroomFace(K, 24, 24, 1); K.flat(K.el(24, 29, 4.4, 1.8), INKY); K.fangs(21, 27, 28, 1, 2, 2);
  K.flat(K.el(24, 17, 21, 3.8), mixh(P[3], P[0], 0.45), P[0]); for (let gx = 5; gx < 44; gx += 2) K.px(gx, 18, P[0]);
  capOf(K, 24, 16, 23, 14.4, P);
  [[14, 8, 3.4, 2.2], [29, 5, 3.6, 2.3], [38, 12, 2.4, 1.6], [6, 13, 2, 1.4], [22, 12, 1.8, 1.2], [33, 10, 1.4, 1]].forEach(([a, b, c, d]) => K.flat(K.el(a, b, c, d), SPOT));
  K.spark(3, 4 + s, '#d0f08a', fr % 2 === 0); K.px(45, 6 - s, '#d0f08a'); K.px(40, 1 + s, '#f0e060');
  return { cx: 24, cy: 28, R: 13, top: 2, bot: 46, head: [24, 1], back: [[36, 6], [12, 6], [24, 3]], belly: [24, 42.4], side: [35, 31], under: [[10, 47], [24, 47], [38, 47]] };
};
FORMS.brood4 = (K, st, P, Q, fr) => {          // 낳는 숲: 새끼들이 곁에서 다 자라 한 몸의 숲이 됐다. 입에서 알이 나온다
  const s = SW(fr), STK = STK_R(P), OLD = [P[0], '#cfc9a4', '#f4f0d8', '#8f8862'], SPOT = mixh(Q[2], '#ffffff', 0.3), EG = [Q[0], Q[1], Q[2], Q[3]]; K.shadow(27, 24);
  K.L([[20, 46], [12, 49], [3, 50]], 2.6, 1, ROOT_R); K.L([[23, 48], [20, 51]], 2, 1.2, ROOT_R); K.L([[30, 48], [33, 51]], 2, 1.2, ROOT_R); K.L([[33, 46], [41, 49], [50, 50]], 2.6, 1, ROOT_R);
  K.B(8, 48.6, 2.4, 2, EGG_R); K.B(44, 49, 2.2, 1.8, EGG_R); K.L([[14, 50], [14, 46]], 1, 1, STK); capOf(K, 14, 46, 3, 2.6, P); K.L([[39, 50], [39, 47]], 1, 1, STK); capOf(K, 39, 47, 2.6, 2.2, P);   // 발치의 알과 싹
  K.L([[21, 36], [12, 31], [9, 23]], 3, 2.2, OLD); K.L([[31, 36], [41, 32], [44, 25]], 3, 2.2, OLD);                           // 곁자루
  [[3, 25, 30], [15, 25, 28], [39, 27, 31], [50, 27, 32]].forEach(([hx, y0, y1], k) => { const yy = y1 + (k % 2 ? s : -s); for (let y = y0; y < yy; y++) K.px(hx, y, '#3a3410'); K.B(hx, yy + 2, 2.3, 2.9, EG); K.px(hx, yy + 3, INKY); });
  K.flat(K.el(9, 23, 8, 2), mixh(P[3], P[0], 0.45), P[0]); capOf(K, 9, 22, 9, 6.6, P); K.flat(K.el(44, 25, 7.4, 1.9), mixh(P[3], P[0], 0.45), P[0]); capOf(K, 44, 24, 8.2, 6, P);
  K.flat(K.el(7, 19, 1.6, 1), SPOT); K.flat(K.el(12, 21, 1.1, 0.8), SPOT); K.flat(K.el(46, 21, 1.5, 1), SPOT);
  const trunk = K.G([[17, 48], [20, 35], [18, 22], [34, 22], [32, 35], [35, 48]], OLD); K.commit(trunk, (x, y) => (x * 7 + (y >> 2)) % 6 === 0 && x > 20 && x < 33 && y > 30 ? OLD[3] : null);   // 굵어진 자루
  shroomFace(K, 26, 28, 1.2);
  K.flat(K.el(26, 38, 5, 6.2), '#0a0806', P[0]); K.fangs(23, 29, 32, 1, 3, 2); K.fangs(24, 28, 44, -1, 2, 2);                    // 벌린 입
  K.B(26, 40 + (fr % 2), 2.6, 2.8, EG); K.px(26, 41 + (fr % 2), INKY);                                                         // 나오는 알
  [[14, 23, 27], [38, 23, 28]].forEach(([hx, y0, y1], k) => { const yy = y1 + (k % 2 ? s : -s); for (let y = y0; y < yy; y++) K.px(hx, y, '#3a3410'); K.B(hx, yy + 2, 2.6, 3.2, EG); K.px(hx, yy + 3, INKY); });
  K.flat(K.el(26, 20, 20, 3.6), mixh(P[3], P[0], 0.45), P[0]); for (let gx = 8; gx < 45; gx += 2) K.px(gx, 21, P[0]);
  capOf(K, 26, 19, 22, 16, P);
  [[16, 10, 3.6, 2.3], [31, 7, 3.8, 2.4], [40, 14, 2.4, 1.6], [9, 15, 2, 1.4], [24, 14, 1.9, 1.3], [35, 12, 1.4, 1]].forEach(([a, b, c, d]) => K.flat(K.el(a, b, c, d), SPOT));
  K.spark(4, 6 + s, '#d0f08a', fr % 2 === 0); K.px(47, 9 - s, '#d0f08a'); K.px(42, 2 + s, '#f0e060'); K.px(2, 44 + s, P[2]); K.px(50, 43 - s, P[2]);
  return { cx: 26, cy: 34, R: 12, top: 3, bot: 50, head: [26, 2], back: [[38, 8], [14, 8], [44, 20]], belly: [26, 46.6], side: [36, 36], under: [[8, 51], [26, 51], [44, 51]] };
};

// ---------- 황혼: 가면 쓴 나방 ----------
FORMS.dusk1 = (K, st, P, Q, fr) => {           // 가면 애벌레: 흰 가면을 쓴 애벌레. 등에는 벌써 눈알 무늬가 있다
  const s = SW(fr), D = [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)]; K.shadow(17, 11);
  for (let y = 0; y < 21; y += 2) K.px(28, y, STR_C);                                                                         // 실 한 가닥
  [[11, 30], [15, 30.4], [19, 30.4], [23, 30], [26, 29.4]].forEach(([lx, ly], k) => K.B(lx + ((fr + k) % 2 ? 0.5 : 0), ly, 1.5, 1.2, D));   // 배다리
  K.B(26.4, 25, 3.4, 3.6, P); K.B(22.4, 25.4, 4.2, 4.4, D); K.B(18, 25, 4.6, 4.8, P); K.B(13.6, 23.4, 4.8, 5, D); K.B(11.6, 19, 5, 5.2, P);
  eyeSpot(K, 22.4, 23.6, 1.5, Q[1]); eyeSpot(K, 15, 21, 1.5, Q[1]);                                                           // 눈알 무늬
  K.L([[27, 22], [29, 20 + s]], 0.9, 0.6, P); K.B(29.4, 23.4 - s, 1.5, 1.7, GOLD_R); K.px(29, 23 - s, '#fff3a0');               // 꼬리의 방울
  K.L([[9, 7], [6, 3], [4, 2 + s]], 0.8, 0.6, P); K.L([[15, 6], [17, 2], [20, 1 + s]], 0.8, 0.6, P); K.px(4, 1 + s, '#ffd23a'); K.px(20, 0 + s, '#ffd23a');
  K.B(12, 12, 6.6, 6.4, P); K.flat(K.el(12, 13, 4.8, 5.2), '#1a0a14');
  drawMask(K, 12, 13.4, 3.6, 4.6, 0);
  return { cx: 17, cy: 21, R: 8, top: 5, bot: 30, head: [12, 4], back: [[20, 20], [25, 21], [16, 17]], belly: [19, 27], side: [24, 25], under: [[10, 31], [17, 31], [24, 31]] };
};
FORMS.dusk2 = (K, st, P, Q, fr) => {           // 가면 고치: 실에 매달려 잠들었다. 접힌 날개의 눈알 무늬가 비친다
  const s = SW(fr), D = [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)], sw = s * 0.5; K.shadow(20, 8);
  for (let y = 0; y < 5; y++) K.px(20, y, STR_C);
  for (let i = 0; i < 6; i++) { K.px(13 - i * 2, 9 - i * 1.6 + (i % 2 ? sw : 0), STR_C); K.px(27 + i * 2, 9 - i * 1.6 - (i % 2 ? sw : 0), STR_C); }
  K.L([[20, 30], [20, 34], [20 + s, 37]], 2.4, 0.8, D); K.px(20 + s, 38, '#ffd23a');                                           // 고치 끝
  K.ball(K.path([[20, 13], [20, 22], [20, 31]], 9.4, 4), 20, 20, 11, 14, P);                                                 // 고치
  for (const yy of [26, 29, 32]) for (let x = 14; x < 27; x++) { const m = Math.abs(x - 20) < (36 - yy) * 0.62; if (m) K.px(x, yy, P[0]); }
  const lw = [[13, 12], [8, 15], [6, 23], [9, 30], [15, 31], [16, 19]], mir = pts => pts.map(q => [40 - q[0], q[1]]);              // 접힌 날개
  [lw, mir(lw)].forEach(w => { const m = K.G(w, D); K.commit(m, (x, y) => x % 3 === 1 ? mixh(P[3], P[0], 0.3) : null); });
  eyeSpot(K, 10.6, 22, 2.4, Q[1], fr !== 3); eyeSpot(K, 29.4, 22, 2.4, Q[1], fr !== 3);                                        // 아직 덜 뜬 눈알 무늬
  for (let x = 9; x < 32; x++) { if (x % 3) K.px(x, 17 + ((x >> 1) % 2), STR_C); if (x % 4 && x > 11 && x < 29) K.px(x, 25 - ((x >> 1) % 2), STR_C); }   // 감긴 실
  K.L([[17, 5], [13, 4], [10, 7 + s]], 0.8, 0.6, P); K.L([[23, 5], [27, 4], [30, 7 + s]], 0.8, 0.6, P); K.px(10, 8 + s, '#ffd23a'); K.px(30, 8 + s, '#ffd23a');
  K.B(20, 9, 6.2, 6, P); K.flat(K.el(20, 10, 4.8, 5.2), '#1a0a14');
  drawMask(K, 20, 10.4, 4, 5, 2);
  return { cx: 20, cy: 21, R: 9, top: 3, bot: 37, head: [20, 2], back: [[28, 12], [12, 12], [31, 20]], belly: [20, 29], side: [27, 28], under: [[14, 38], [20, 39], [26, 38]] };
};
FORMS.dusk4 = (K, st, P, Q, fr) => {           // 연출가 나방: 날개가 무대의 막이 됐다. 막 끝에는 금술, 날개 끝에는 줄 인형
  const s = SW(fr), D = [P[0], P[3], P[1], mixh(P[3], P[0], 0.5)], mir = pts => pts.map(q => [52 - q[0], q[1]]); K.shadow(26, 18);
  for (let y = 33; y < 42; y += 2) { K.px(3, y, STR_C); K.px(49, y, STR_C); }
  [[3, 42 + s], [49, 42 - s]].forEach(([hx, hy]) => { K.rect(hx - 1, hy, 3, 3, '#e8b890'); K.rect(hx - 1, hy + 3, 3, 4, '#3f6b46'); K.px(hx - 2, hy + 4, '#e8b890'); K.px(hx + 2, hy + 3, '#e8b890'); K.px(hx - 1, hy + 7, INKY); K.px(hx + 1, hy + 7, INKY); K.px(hx, hy + 1, INKY); });   // 줄 인형
  const lw = [[23, 31], [12, 35], [8, 43 + s], [14, 49 + s], [21, 44], [25, 37]], uw = [[24, 25], [18, 8 - s], [9, 2 - s], [2, 5], [0, 14], [1, 27], [4, 36], [8, 31], [12, 35], [16, 30], [20, 33], [23, 30]];
  K.G(lw, D); K.G(mir(lw), D);
  [uw, mir(uw)].forEach(w => { const m = K.G(w, P), N = K.N;
    K.commit(m, (x, y) => x % 5 === 1 ? P[3] : x % 5 === 2 ? mixh(P[3], P[0], 0.5) : null);                                      // 막의 주름
    K.commit(m, (x, y) => (y > 0 && !m[(y - 1) * N + x]) ? '#ffd23a' : null);
    K.commit(m, (x, y) => (y > 24 && y < N - 1 && !m[(y + 1) * N + x]) ? ((x % 4 < 2) ? '#ffd23a' : '#a87e14') : (y > 25 && y < N - 2 && !m[(y + 2) * N + x] && x % 2 ? '#ffd23a' : null)); });   // 금술
  eyeSpot(K, 10, 15 - s, 4.6, Q[1]); eyeSpot(K, 42, 15 - s, 4.6, Q[1]); eyeSpot(K, 16, 27, 2, Q[1]); eyeSpot(K, 36, 27, 2, Q[1]);
  eyeSpot(K, 13, 42 + s, 1.8, Q[1]); eyeSpot(K, 39, 42 + s, 1.8, Q[1]);
  K.L([[23, 31], [20, 37]], 0.7, 0.6, P); K.L([[29, 31], [32, 37]], 0.7, 0.6, P);
  K.L([[26, 32], [26, 41], [26, 49 + s]], 3.6, 1.3, P); for (const yy of [36, 40, 44]) K.rect(24, yy, 5, 1, P[0]);
  K.B(26, 28, 5, 5.8, P); K.px(24, 26, P[2]); K.px(27, 25, P[2]);
  K.G([[19, 22], [26, 27], [33, 22], [30, 19], [22, 19]], BONE_R);                                                            // 깃
  K.L([[23, 12], [18, 6], [13, 3 + s]], 0.9, 0.6, P); K.L([[29, 12], [34, 6], [39, 3 + s]], 0.9, 0.6, P); for (let k = 0; k < 4; k++) { K.px(21 - k * 2, 7 - k + s, P[2]); K.px(20 - k * 2, 10 - k + s, P[2]); K.px(31 + k * 2, 7 - k + s, P[2]); K.px(32 + k * 2, 10 - k + s, P[2]); }
  K.B(26, 15, 5.6, 6.6, P); K.flat(K.el(26, 16, 4.6, 5.8), '#1a0a14');
  drawMask(K, 26, 16, 4.4, 5.6, 0);
  K.G([[21, 9], [22, 4], [25, 8]], GOLD_R); K.G([[24, 8], [26, 2], [28, 8]], GOLD_R); K.G([[27, 8], [30, 4], [31, 9]], GOLD_R);   // 관
  return { cx: 26, cy: 27, R: 11, top: 2, bot: 49, head: [26, 3], back: [[38, 8], [14, 8], [46, 20]], belly: [26, 41], side: [40, 30], under: [[14, 50], [26, 51], [38, 50]] };
};

// ---------- 기아: 이빨 고리 입의 벌레 ----------
FORMS.hunger1 = (K, st, P, Q, fr) => {         // 씹는 구더기: 짧고 통통한 몸, 앞쪽은 전부 입
  const s = SW(fr); K.shadow(17, 11);
  K.G([[27, 20], [30, 15 + s], [29, 22]], BONE_R); K.G([[19, 16], [21, 10 + s], [23, 15]], BONE_R);                              // 뼈 가시의 싹
  K.B(11, 30, 2.6, 1.4, P); K.B(19, 29.6, 2.2, 1.4, P); K.B(25, 29, 2, 1.3, P);
  K.B(25.6, 24, 4, 4.6, P); K.B(20.4, 22.4, 6, 6.6, P);
  K.B(12, 19, 9.4, 9.4, P);
  mawRing(K, 11, 20.4, 6.4, fr, P);
  K.eye(7.4, 10.6, 1.7, '#ffd23a'); K.eye(15, 9.6, 2.2, '#ffd23a', true); K.rect(5, 8, 3, 1, P[0]); K.rect(14, 6, 4, 1, P[0]);
  K.px(8, 28, '#bfe8ff'); K.px(8, 30 + (fr % 2), '#bfe8ff');
  return { cx: 16, cy: 20, R: 9, top: 9, bot: 30, head: [13, 7], back: [[21, 15], [26, 20], [16, 11]], belly: [22, 26], side: [26, 23], under: [[10, 31], [17, 31], [24, 31]] };
};
FORMS.hunger2 = (K, st, P, Q, fr) => {         // 이빨 유충: 등을 굽혀 기는 긴 몸. 마디마다 뼈 가시, 꼬리 끝에도 작은 입
  const s = SW(fr), seg = [[34, 31, 4.8], [33, 24, 5.4], [28, 18, 6.2], [21, 17, 6.8], [15, 21, 7.4]]; K.shadow(21, 17);
  K.L([[35, 29], [38, 25], [37, 19 + s]], 2, 1.3, P); K.B(36.4, 16 + s, 3, 2.8, P); K.flat(K.el(35.2, 17 + s, 2.2, 1.1), '#1a0508'); K.px(34, 16 + s, '#fbf7ea'); K.px(36, 16 + s, '#fbf7ea'); K.px(38, 15 + s, '#ffd23a');   // 꼬리의 입
  K.B(32, 36.8, 2.6, 1.5, P); K.B(37, 36.4, 2.2, 1.4, P);
  seg.forEach(([cx, cy, r], k) => { const a = Math.atan2(cy - 32, cx - 24), ox = Math.cos(a), oy = Math.sin(a); if (k > 0) boneSpine(K, cx, cy, ox, oy, r, 5 + (k % 2)); K.B(cx, cy, r, r, P); });
  K.L([[15, 32], [13, 36], [14, 38]], 2, 1.1, P); K.px(12, 38, '#fbf7ea'); K.px(14, 39, '#fbf7ea'); K.L([[7, 33], [5, 36], [6, 38]], 2, 1.1, P); K.px(4, 38, '#fbf7ea'); K.px(6, 39, '#fbf7ea');
  K.B(11, 25, 9.8, 9.8, P);
  mawRing(K, 10, 26, 7.2, fr, P);
  K.eye(5.4, 16.4, 1.6, '#ffd23a'); K.eye(13.6, 15, 2.2, '#ffd23a', true); K.eye(19.4, 19.4, 1.3, '#ffd23a'); K.rect(12, 12, 4, 1, P[0]);
  K.px(6, 35, '#bfe8ff'); K.px(10, 36 + (fr % 2), '#bfe8ff');
  return { cx: 22, cy: 24, R: 10, top: 9, bot: 38, head: [12, 12], back: [[28, 11], [21, 9], [35, 19]], belly: [26, 23], side: [37, 28], under: [[9, 39], [22, 39], [34, 39]] };
};
{ const old3 = FORMS.hunger3;
  FORMS.hunger3 = (K, st, P, Q, fr) => {       // 목구멍 벌레: 구멍에서 몸을 세웠다. 다리는 버렸지만 눈은 남았다
    const A = old3(K, st, P, Q, fr), s = SW(fr);
    K.eye(18.6, 8.4 + s, 1.4, '#ffd23a'); K.eye(9.4, 8.6 + s, 1.2, '#ffd23a'); K.eye(22.8, 13.6 + s, 1.2, '#ffd23a');
    return A; }; }
FORMS.hunger4 = (K, st, P, Q, fr) => {         // 마지막 한 입: 구멍을 다 빠져나온 벌레. 머리가 곧 입이고, 입 안에 입이 또 있다
  const s = SW(fr), RK = ['#141018', '#4a4458', '#6a6478', '#2a2634'], IN = ['#2a0a0e', '#e8505a', '#ff9a8a', '#8a1c26'], hx = 23, hy = 28 + s * 0.5, seg = [[44, 43, 7], [47, 34, 7.6], [46, 25, 8.2], [41, 16, 8.8], [33, 10, 9.4]]; K.shadow(27, 24);
  K.L([[4, 49], [3, 44], [5, 40 + s]], 2.4, 2, P); K.flat(K.el(5, 39 + s, 1.9, 1.5), '#1a0508'); K.px(4, 38 + s, '#fbf7ea'); K.px(6, 38 + s, '#fbf7ea');   // 곁입
  K.B(40, 49, 10, 2.6, RK); K.B(24, 49.6, 6, 2.2, RK); K.B(10, 49.8, 4, 1.8, RK); K.B(49, 49.6, 2.6, 1.8, RK);
  seg.forEach(([cx, cy, r], k) => { const a = Math.atan2(cy - 30, cx - 26), ox = Math.cos(a), oy = Math.sin(a); boneSpine(K, cx, cy, ox, oy, r, 6 + (k % 2)); K.B(cx, cy, r, r, P); });
  for (let k = 0; k < 9; k++) { const a = -2.5 + k * 0.52, ox = Math.cos(a), oy = Math.sin(a); if (a > -0.2 && a < 1.1) continue; K.G([[hx + ox * 15 - oy * 2.6, hy + oy * 15 + ox * 2.6], [hx + ox * (21 + (k % 2) * 2), hy + oy * (21 + (k % 2) * 2)], [hx + ox * 15 + oy * 2.6, hy + oy * 15 - ox * 2.6]], BONE_R); }   // 머리 둘레의 뼈 가시
  K.B(hx, hy, 17.4, 17.4, P);
  for (let k = 0; k < 8; k++) { const a = k * 0.7854 + 0.39; K.eye(hx + Math.cos(a) * 15, hy + Math.sin(a) * 15, k % 2 ? 1.3 : 1.7, '#ffd23a', false, (fr + k) % 4 === 0 ? 1 : 0); }   // 입 둘레의 눈
  K.flat(K.el(hx, hy, 13, 13), '#7a121c', P[0]); K.flat(K.el(hx, hy, 11.8, 11.8), '#1a0508');
  for (let k = 0; k < 14; k++) { const a = k * 0.4488 + fr * 0.11, ox = Math.cos(a), oy = Math.sin(a); K.G([[hx + ox * 12 - oy * 1.6, hy + oy * 12 + ox * 1.6], [hx + ox * (8 + (k % 2)), hy + oy * (8 + (k % 2))], [hx + ox * 12 + oy * 1.6, hy + oy * 12 - ox * 1.6]], BONE_R); }   // 바깥 이빨 고리
  K.flat(K.el(hx, hy, 7.4, 7.4), '#6a1018');
  for (let k = 0; k < 10; k++) { const a = k * 0.6283 - fr * 0.17; K.px(hx + Math.cos(a) * 6.6, hy + Math.sin(a) * 6.6, '#fbf7ea'); K.px(hx + Math.cos(a) * 5.6, hy + Math.sin(a) * 5.6, '#cfc8b4'); }   // 안쪽 이빨 고리
  K.B(hx, hy, 4, 4, IN); K.flat(K.el(hx, hy + 0.6, 2.8, 2), '#1a0508'); K.fangs(hx - 2, hx + 2, Math.round(hy - 1), 1, 2, 2); K.px(hx, hy + 1, '#ffb347');   // 입 안의 입
  K.px(14, 46, '#bfe8ff'); K.px(14, 48 + (fr % 2), '#bfe8ff'); K.px(30, 47, '#bfe8ff');
  return { cx: 26, cy: 28, R: 17, top: 4, bot: 49, head: [23, 6], back: [[42, 11], [47, 26], [34, 5]], belly: [42, 40], side: [46, 36], under: [[10, 50], [26, 50], [42, 50]] };
};
