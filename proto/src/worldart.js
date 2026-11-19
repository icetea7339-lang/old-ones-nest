// 침입자 그림: 땅 위가 어떤 세계인지에 따라 같은 역할이 다른 옷과 무기를 든다. 16×16.
// 몸은 한 틀(wman)이고, 머리·손에 든 것·몸집을 세계마다 다르게 끼운다. 판타지는 챙 모자와 쇠, 무협은 삿갓과 긴 옷, 현대는 조끼와 제복, 미래는 얼굴 없는 투구와 빛나는 줄.
const W_OL = '#1b1d2a', W_SK = '#e8b890', W_ST = '#a0a8c0', W_STH = '#d8dcec', W_STD = '#5a6078', W_GD = '#e8c030', W_WD = '#7a5a3a', W_WH = '#f5f5f5', W_RD = '#c8303a', W_CY = '#5fe8f0', W_OR = '#ff8a2a', W_YL = '#ffd23a', W_BK = '#2a2430';
// ---- 머리 ----  (q, 색1, 색2, 색3, 살색)
const WHEAD = {
  hair(q, a) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); },
  bald(q, a, b, c, sk) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, sk); q(6, 2, 2, 1, '#f6d8b8'); if (a) { q(7, 3, 1, 1, a); q(9, 3, 1, 1, a); } },
  straw(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 2, W_OL); q(5, 1, 6, 2, a); q(5, 2, 6, 1, b || a); q(1, 3, 14, 1, W_OL); q(2, 3, 12, 1, a); q(3, 3, 3, 1, '#fff3a0'); },
  floppy(q, a, b) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 1, W_OL); q(5, 2, 6, 1, a); q(2, 3, 12, 1, W_OL); q(3, 3, 10, 1, a); q(3, 4, 1, 1, a); q(12, 4, 1, 1, a); if (b) q(8, 2, 1, 1, b); },
  cap(q, a, b) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); q(11, 3, 3, 1, W_OL); q(11, 3, 2, 1, b || a); if (b) q(7, 2, 2, 1, b); },
  leather(q, a, b) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); q(5, 3, 6, 1, b || a); q(4, 4, 1, 2, a); q(11, 4, 1, 2, a); },
  hood(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 1, W_OL); q(3, 2, 10, 6, W_OL); q(5, 1, 6, 1, a); q(4, 2, 8, 2, a); q(4, 4, 1, 4, a); q(11, 4, 1, 4, a); q(5, 4, 6, 3, '#e8b890'); q(6, 7, 4, 1, '#e8b890'); q(6, 5, 1, 1, W_OL); q(9, 5, 1, 1, W_OL); q(5, 4, 6, 1, b || '#3a2a30'); },
  helm(q, a, b, c) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 3, W_OL); q(5, 1, 6, 3, a); q(5, 1, 3, 1, b || W_STH); q(5, 4, 6, 4, a); q(5, 5, 6, 1, W_OL); q(8, 6, 1, 2, W_OL); if (c) { q(7, 0, 2, 1, c); q(8, 0, 3, 1, c); q(10, 1, 2, 1, c); q(11, 2, 1, 1, c); } },
  kettle(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 2, W_OL); q(5, 1, 6, 2, a); q(5, 1, 2, 1, b || W_STH); q(2, 3, 12, 1, W_OL); q(3, 3, 10, 1, a); },
  wizard(q, a, b) { q(7, 0, 3, 1, W_OL); q(8, 0, 1, 1, a); q(5, 1, 6, 2, W_OL); q(6, 1, 4, 2, a); q(1, 3, 14, 1, W_OL); q(2, 3, 12, 1, a); q(6, 2, 4, 1, b || W_GD); },
  mitre(q, a, b) { q(5, 0, 6, 4, W_OL); q(6, 0, 4, 3, a); q(7, 0, 2, 3, b || W_GD); q(4, 3, 8, 1, W_OL); q(5, 3, 6, 1, a); },
  wreath(q, a, b) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); q(4, 4, 1, 3, a); q(11, 4, 1, 3, a); q(5, 2, 1, 1, b); q(7, 1, 1, 1, b); q(9, 2, 1, 1, b); q(10, 1, 1, 1, '#fff3a0'); },
  beardcap(q, a, b) { q(5, 0, 6, 1, W_OL); q(3, 1, 10, 3, W_OL); q(4, 1, 8, 2, a); q(4, 3, 8, 1, b || W_GD); q(4, 1, 2, 1, W_STH); },
  // 무협
  cone(q, a, b) { q(7, 0, 2, 1, W_OL); q(5, 1, 6, 1, W_OL); q(6, 1, 4, 1, a); q(3, 2, 10, 1, W_OL); q(4, 2, 8, 1, a); q(1, 3, 14, 1, W_OL); q(2, 3, 12, 1, a); q(0, 4, 2, 1, W_OL); q(14, 4, 2, 1, W_OL); q(5, 2, 2, 1, b || '#fff3a0'); q(3, 3, 3, 1, b || '#fff3a0'); },
  topknot(q, a, b) { q(6, 0, 4, 2, W_OL); q(7, 0, 2, 2, a); q(5, 1, 1, 1, b || W_GD); q(10, 1, 1, 1, b || W_GD); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); },
  band(q, a, b) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 1, a); q(4, 3, 8, 1, b); q(12, 3, 2, 1, b); q(13, 4, 1, 2, b); },
  longhair(q, a, b) { q(6, 0, 4, 1, W_OL); q(7, 0, 2, 1, b || a); q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 1, 6, 1, a); q(5, 2, 6, 2, a); q(3, 4, 1, 6, W_OL); q(12, 4, 1, 6, W_OL); q(4, 4, 1, 5, a); q(11, 4, 1, 5, a); },
  taocap(q, a, b) { q(5, 0, 6, 3, W_OL); q(6, 0, 4, 2, a); q(7, 1, 2, 1, b || W_GD); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); q(5, 3, 6, 1, '#3a3440'); },
  gat(q, a, b) { q(6, 0, 4, 1, W_OL); q(5, 1, 6, 2, W_OL); q(6, 1, 4, 2, a); q(1, 3, 14, 1, W_OL); q(2, 3, 12, 1, a); q(10, 1, 1, 3, b || W_RD); q(11, 4, 1, 1, b || W_RD); },
  elder(q, a) { q(6, 0, 4, 2, W_OL); q(7, 0, 2, 2, a); q(5, 1, 1, 1, W_GD); q(10, 1, 1, 1, W_GD); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); q(3, 4, 1, 6, W_OL); q(12, 4, 1, 6, W_OL); q(4, 4, 1, 5, a); q(11, 4, 1, 5, a); q(5, 7, 6, 4, W_OL); q(6, 6, 4, 1, a); q(6, 7, 4, 3, a); q(7, 10, 2, 1, a); },
  furhat(q, a, b) { q(4, 0, 8, 1, W_OL); q(3, 1, 10, 3, W_OL); q(4, 1, 8, 3, a); q(5, 1, 1, 1, b); q(8, 2, 1, 1, b); q(10, 1, 1, 1, b); q(6, 3, 1, 1, b); },
  tassel(q, a, b, c) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 3, W_OL); q(5, 1, 6, 3, a); q(5, 1, 2, 1, W_STH); q(4, 4, 1, 3, a); q(11, 4, 1, 3, a); q(7, 0, 2, 1, c || W_RD); q(9, 0, 1, 2, c || W_RD); q(5, 3, 6, 1, b || W_GD); },
  // 현대
  fedora(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 2, W_OL); q(5, 1, 6, 2, a); q(5, 2, 6, 1, b || W_BK); q(2, 3, 12, 1, W_OL); q(3, 3, 10, 1, a); },
  beanie(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 3, W_OL); q(5, 1, 6, 3, a); q(5, 3, 6, 1, b || a); },
  bucket(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 2, W_OL); q(5, 1, 6, 2, a); q(3, 3, 10, 1, W_OL); q(4, 3, 8, 1, b || a); q(3, 4, 1, 1, W_OL); q(12, 4, 1, 1, W_OL); },
  hardhat(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 2, W_OL); q(5, 1, 6, 2, a); q(7, 1, 2, 1, b || W_WH); q(3, 3, 11, 1, W_OL); q(4, 3, 9, 1, a); },
  army(q, a, b) { q(5, 0, 6, 1, W_OL); q(3, 1, 10, 3, W_OL); q(4, 1, 8, 3, a); q(5, 1, 2, 1, b); q(9, 2, 2, 1, b); q(6, 3, 1, 1, b); q(4, 4, 1, 3, W_OL); q(11, 4, 1, 3, W_OL); },
  riot(q, a, b) { q(5, 0, 6, 1, W_OL); q(3, 1, 10, 3, W_OL); q(4, 1, 8, 3, a); q(5, 1, 3, 1, '#6a7aa8'); q(4, 4, 8, 3, W_OL); q(5, 4, 6, 3, b || '#9fd8f0'); q(6, 5, 1, 1, W_OL); q(9, 5, 1, 1, W_OL); q(5, 4, 2, 1, W_WH); },
  weld(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 2, W_OL); q(5, 1, 6, 2, a); q(3, 3, 10, 5, W_OL); q(4, 3, 8, 4, a); q(5, 5, 6, 1, b || '#5f8fe0'); q(5, 5, 2, 1, W_WH); q(5, 7, 6, 1, a); },
  bomb(q, a, b) { q(4, 0, 8, 1, W_OL); q(2, 1, 12, 7, W_OL); q(3, 1, 10, 6, a); q(4, 1, 3, 1, b || a); q(5, 4, 6, 2, '#1a2a30'); q(5, 4, 2, 1, '#6fa8b0'); q(4, 7, 8, 1, a); },
  hazmat(q, a, b) { q(4, 0, 8, 1, W_OL); q(3, 1, 10, 7, W_OL); q(4, 1, 8, 6, a); q(5, 1, 2, 1, W_WH); q(5, 3, 6, 3, W_OL); q(5, 4, 6, 2, b || '#2a3a40'); q(5, 4, 2, 1, '#9fe8f0'); q(6, 7, 1, 1, W_STD); q(9, 7, 1, 1, W_STD); },
  // 미래
  visor(q, a, b, c) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 3, W_OL); q(5, 1, 6, 3, a); q(5, 1, 3, 1, W_WH); q(5, 4, 6, 3, a); q(6, 7, 4, 1, a); q(4, 5, 8, 1, W_OL); q(5, 5, 6, 1, b || W_CY); q(5, 5, 1, 1, W_WH); if (c) { q(11, 0, 1, 3, c); q(11, 0, 1, 1, b || W_CY); } },
  dome(q, a, b, c) { q(5, 0, 6, 1, W_OL); q(3, 1, 10, 7, W_OL); q(4, 1, 8, 6, a); q(5, 2, 6, 4, '#16202e'); q(5, 2, 3, 1, b || W_CY); q(5, 3, 1, 1, b || W_CY); q(7, 4, 1, 1, b || W_CY); q(9, 4, 1, 1, b || W_CY); if (c) q(7, 0, 2, 1, c); },
  halo(q, a, b, c) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); q(5, 4, 6, 3, a); q(6, 7, 4, 1, a); q(4, 5, 8, 1, W_OL); q(5, 5, 6, 1, b || W_CY); q(5, 0, 6, 1, c || W_GD); q(3, 1, 2, 1, c || W_GD); q(11, 1, 2, 1, c || W_GD); q(6, 0, 2, 1, '#fff3a0'); },
  dish(q, a, b, c) { q(5, 1, 6, 1, W_OL); q(4, 2, 8, 2, W_OL); q(5, 2, 6, 2, a); q(5, 4, 6, 3, a); q(6, 7, 4, 1, a); q(4, 5, 8, 1, W_OL); q(5, 5, 6, 1, b || W_CY); q(1, 0, 4, 1, W_OL); q(0, 1, 5, 2, W_OL); q(1, 1, 3, 1, c || W_WH); q(2, 2, 1, 1, c || W_WH); q(3, 3, 1, 1, W_OL); },
  cyhood(q, a, b) { q(5, 0, 6, 1, W_OL); q(4, 1, 8, 1, W_OL); q(3, 2, 10, 6, W_OL); q(5, 1, 6, 1, a); q(4, 2, 8, 2, a); q(4, 4, 1, 4, a); q(11, 4, 1, 4, a); q(5, 4, 6, 4, '#101018'); q(6, 5, 1, 1, b || '#7fff6a'); q(9, 5, 1, 1, b || '#7fff6a'); q(6, 7, 4, 1, b || '#7fff6a'); },
};
// ---- 오른손에 든 것 ---- (x 12~15)
const WITEM = {
  fork(q, a) { q(13, 3, 1, 11, W_WD); q(12, 1, 1, 3, a || W_ST); q(14, 1, 1, 3, a || W_ST); q(13, 2, 1, 2, a || W_ST); },
  hoe(q, a) { q(13, 2, 1, 12, W_WD); q(13, 1, 3, 1, a || W_ST); q(15, 2, 1, 2, a || W_ST); },
  spear(q, a) { q(13, 3, 1, 11, W_WD); q(13, 0, 1, 3, a || W_ST); q(12, 2, 3, 1, a || W_ST); },
  rod(q, a) { q(13, 6, 1, 6, W_WD); q(14, 3, 1, 3, W_WD); q(15, 1, 1, 2, W_WD); q(15, 3, 1, 6, '#c8c8d0'); q(14, 9, 2, 2, a || '#5fa8d0'); },
  pole(q, a) { q(13, 0, 1, 14, a || W_WD); q(13, 0, 1, 1, '#a8845a'); },
  sword(q, a) { q(13, 4, 1, 6, a || W_STH); q(13, 3, 1, 1, W_WH); q(12, 10, 3, 1, W_GD); q(13, 11, 1, 2, W_WD); },
  great(q, a) { q(12, 0, 3, 1, W_OL); q(13, 1, 2, 9, a || W_ST); q(13, 1, 1, 9, W_STH); q(13, 0, 1, 1, W_WH); q(12, 10, 4, 1, W_GD); q(13, 11, 1, 2, W_WD); },
  jian(q, a) { q(13, 2, 1, 8, a || W_STH); q(13, 1, 1, 1, W_WH); q(12, 10, 3, 1, W_GD); q(13, 11, 1, 1, W_WD); q(13, 12, 1, 2, W_RD); },
  dao(q, a) { q(13, 4, 2, 6, a || W_ST); q(14, 2, 1, 2, a || W_ST); q(13, 4, 1, 6, W_STH); q(15, 3, 1, 4, a || W_ST); q(12, 10, 3, 1, W_GD); q(13, 11, 1, 2, W_WD); q(12, 13, 1, 1, W_RD); },
  dagger(q, a) { q(13, 8, 1, 3, a || W_STH); q(12, 11, 3, 1, W_STD); },
  mace(q, a) { q(13, 6, 1, 8, W_WD); q(12, 3, 3, 3, a || W_ST); q(12, 3, 1, 1, W_STH); q(11, 4, 1, 1, a || W_ST); q(15, 4, 1, 1, a || W_ST); },
  hammer(q, a) { q(13, 5, 1, 9, W_WD); q(11, 3, 5, 2, a || W_ST); q(11, 3, 5, 1, W_STH); },
  pick(q, a) { q(13, 4, 1, 10, W_WD); q(11, 3, 5, 1, a || W_ST); q(11, 4, 1, 1, a || W_ST); q(15, 4, 1, 1, a || W_ST); },
  wand(q, a) { q(13, 8, 1, 4, W_WD); q(13, 6, 1, 2, a || W_YL); q(12, 7, 3, 1, a || W_YL); q(13, 7, 1, 1, W_WH); },
  orb(q, a) { q(13, 4, 1, 10, W_WD); q(12, 1, 3, 3, W_OL); q(12, 1, 3, 2, a || W_CY); q(13, 0, 1, 1, a || W_CY); q(12, 1, 1, 1, W_WH); },
  holy(q, a) { q(13, 4, 1, 10, a || W_GD); q(12, 0, 3, 3, a || W_GD); q(13, 1, 1, 1, W_WH); q(11, 1, 1, 1, a || W_GD); q(15, 1, 1, 1, a || W_GD); },
  bigstaff(q, a) { q(13, 3, 1, 11, W_BK); q(11, 0, 5, 1, W_GD); q(11, 1, 1, 2, W_GD); q(15, 1, 1, 2, W_GD); q(12, 1, 3, 2, a || '#b08fff'); q(13, 1, 1, 1, W_WH); },
  torch(q, a) { q(13, 4, 1, 9, W_WD); q(12, 1, 3, 3, a || W_OR); q(13, 0, 1, 2, W_YL); q(13, 2, 1, 1, W_WH); q(12, 3, 3, 1, '#7a2a10'); },
  sickle(q, a) { q(13, 9, 1, 4, W_WD); q(12, 6, 3, 1, a || W_ST); q(14, 7, 1, 2, a || W_ST); q(12, 7, 1, 1, a || W_ST); },
  basket(q, a) { q(12, 9, 3, 1, W_WD); q(11, 10, 5, 3, W_OL); q(12, 10, 3, 2, '#a8845a'); q(12, 9, 1, 1, a || '#6fbf3f'); q(14, 9, 1, 1, a || '#6fbf3f'); q(13, 8, 1, 2, a || '#6fbf3f'); },
  lantern(q, a) { q(13, 7, 1, 2, W_STD); q(12, 9, 3, 4, W_OL); q(12, 10, 3, 2, a || W_YL); q(13, 10, 1, 1, W_WH); },
  leash(q, a) { q(13, 10, 1, 1, W_WD); q(14, 11, 1, 1, W_WD); q(15, 12, 1, 2, W_WD); q(12, 8, 2, 1, a || W_GD); },
  monk(q, a) { q(13, 2, 1, 12, W_WD); q(11, 0, 1, 2, a || W_GD); q(15, 0, 1, 2, a || W_GD); q(12, 1, 3, 1, a || W_GD); q(12, 13, 3, 1, a || W_GD); },
  beads(q, a) { q(13, 3, 1, 11, W_WD); q(12, 2, 3, 1, a || W_GD); q(12, 4, 1, 1, a || W_GD); q(14, 4, 1, 1, a || W_GD); q(12, 6, 1, 1, a || W_GD); q(14, 6, 1, 1, a || W_GD); },
  whisk(q, a) { q(13, 6, 1, 7, W_WD); q(13, 5, 1, 1, W_RD); q(13, 3, 2, 2, a || W_WH); q(14, 4, 1, 6, a || W_WH); q(15, 5, 1, 6, a || W_WH); q(15, 5, 1, 1, '#c8c8d0'); },
  talisman(q, a) { q(12, 6, 3, 5, W_OL); q(12, 6, 3, 4, a || W_YL); q(13, 7, 1, 2, W_RD); },
  fan(q, a) { q(11, 6, 5, 1, W_OL); q(11, 7, 5, 3, a || W_WH); q(12, 10, 3, 1, a || W_WH); q(13, 11, 1, 1, W_WD); q(12, 7, 1, 2, W_RD); q(14, 7, 1, 2, W_RD); },
  box(q, a, b) { q(12, 8, 3, 1, W_WD); q(11, 9, 5, 4, W_OL); q(12, 9, 3, 3, a || W_WD); q(13, 10, 1, 1, b || W_GD); },
  halberd(q, a) { q(13, 1, 1, 13, W_WD); q(13, 0, 1, 2, W_STH); q(14, 2, 2, 3, a || W_ST); q(14, 2, 1, 1, W_STH); q(12, 3, 1, 1, W_RD); q(12, 4, 1, 2, W_RD); },
  hawk(q, a, b) { q(12, 10, 3, 1, '#5a4630'); q(12, 5, 3, 5, W_OL); q(13, 4, 1, 1, W_OL); q(12, 6, 3, 3, a || '#8a6a4a'); q(13, 5, 1, 1, a || '#8a6a4a'); q(13, 7, 1, 1, b || '#e8dcc0'); q(14, 5, 1, 1, W_YL); q(12, 9, 1, 1, W_YL); },
  // 현대
  bat(q, a) { q(13, 9, 1, 4, W_WD); q(13, 3, 2, 6, a || '#c8a878'); q(13, 3, 1, 6, '#e8d0a8'); },
  baton(q, a) { q(13, 5, 1, 8, a || '#6a6a7a'); q(13, 5, 1, 1, W_WH); q(12, 10, 1, 1, a || '#6a6a7a'); },
  flash(q, a) { q(12, 10, 2, 1, W_STD); q(14, 9, 1, 3, W_YL); q(15, 8, 1, 5, '#fff3a0'); },
  mega(q, a) { q(12, 9, 1, 2, W_WH); q(13, 8, 1, 4, a || W_RD); q(14, 7, 1, 6, a || W_RD); q(15, 7, 1, 6, W_WH); },
  pistol(q, a) { q(12, 9, 4, 1, a || W_BK); q(12, 10, 1, 2, a || W_BK); q(15, 9, 1, 1, W_STD); },
  shotgun(q, a) { q(13, 3, 1, 7, a || W_ST); q(14, 3, 1, 5, W_STD); q(13, 10, 1, 3, W_WD); },
  rifle(q, a) { q(13, 2, 1, 8, a || W_STD); q(13, 1, 1, 1, W_ST); q(14, 6, 1, 3, a || W_STD); q(13, 10, 2, 2, W_WD); },
  clip(q, a) { q(11, 8, 5, 5, W_OL); q(12, 8, 3, 4, a || W_WH); q(13, 8, 1, 1, W_STD); q(12, 10, 2, 1, W_STD); q(12, 11, 3, 1, W_STD); },
  book(q, a) { q(11, 8, 5, 5, W_OL); q(12, 9, 3, 3, a || '#8a2a2a'); q(12, 9, 1, 3, W_GD); q(14, 9, 1, 3, W_WH); },
  medkit(q, a) { q(12, 8, 3, 1, W_STD); q(11, 9, 5, 4, W_OL); q(12, 9, 3, 3, a || W_WH); q(13, 9, 1, 3, W_RD); q(12, 10, 3, 1, W_RD); },
  bag(q, a) { q(12, 8, 3, 1, W_OL); q(11, 9, 5, 5, W_OL); q(12, 9, 3, 4, a || W_WH); q(13, 10, 1, 2, '#3fae5a'); q(12, 11, 3, 1, '#3fae5a'); },
  crowbar(q, a) { q(13, 5, 1, 8, a || W_RD); q(14, 4, 1, 2, a || W_RD); q(12, 13, 1, 1, a || W_RD); },
  bell(q, a) { q(13, 6, 1, 2, W_WD); q(12, 8, 3, 3, W_OL); q(12, 8, 3, 2, a || W_GD); q(11, 10, 5, 1, a || W_GD); q(13, 11, 1, 1, W_STD); q(12, 8, 1, 1, '#fff3a0'); },
  welder(q, a) { q(12, 10, 2, 1, W_STD); q(14, 9, 1, 2, W_STD); q(14, 6, 1, 3, a || '#5f8fe0'); q(14, 5, 1, 1, W_WH); q(13, 6, 1, 1, W_CY); q(15, 7, 1, 1, W_CY); },
  cutter(q, a) { q(12, 10, 1, 1, a || W_RD); q(13, 9, 1, 1, a || W_RD); q(13, 11, 1, 1, a || W_RD); q(14, 8, 1, 1, W_ST); q(14, 12, 1, 1, W_ST); q(15, 7, 1, 1, W_STH); q(15, 13, 1, 1, W_STH); },
  spray(q, a) { q(12, 9, 3, 2, W_STD); q(13, 11, 1, 2, W_STD); q(15, 8, 1, 4, a || W_CY); q(14, 9, 1, 2, W_WH); },
  // 미래
  eblade(q, a) { q(13, 1, 1, 9, a || W_CY); q(13, 2, 1, 6, W_WH); q(12, 3, 1, 6, (a || W_CY) + '55'); q(14, 3, 1, 6, (a || W_CY) + '55'); q(12, 10, 3, 1, W_STD); q(13, 11, 1, 2, W_BK); },
  stun(q, a) { q(13, 5, 1, 8, W_BK); q(13, 3, 1, 2, a || W_CY); q(12, 4, 1, 1, a || W_CY); q(14, 3, 1, 1, W_WH); },
  blaster(q, a) { q(12, 9, 4, 2, W_STD); q(12, 11, 1, 2, W_BK); q(15, 9, 1, 1, a || W_OR); q(13, 9, 2, 1, a || W_OR); },
  railgun(q, a) { q(13, 1, 1, 10, W_STD); q(14, 3, 1, 6, W_BK); q(13, 1, 1, 2, a || W_CY); q(13, 5, 1, 1, a || W_CY); q(13, 8, 1, 1, a || W_CY); q(13, 11, 2, 2, W_BK); },
  wrench(q, a) { q(13, 5, 1, 8, a || W_ST); q(12, 3, 1, 2, a || W_ST); q(14, 3, 1, 2, a || W_ST); q(12, 5, 3, 1, a || W_ST); },
  netpole(q, a) { q(13, 4, 1, 10, W_STD); q(12, 0, 3, 4, a || W_CY); q(13, 1, 1, 2, W_OL); q(12, 0, 1, 1, W_WH); },
  pad(q, a) { q(11, 8, 5, 5, W_OL); q(12, 9, 3, 3, '#16202e'); q(12, 9, 2, 1, a || W_CY); q(13, 11, 2, 1, a || W_CY); },
  scan(q, a) { q(12, 10, 2, 2, W_STD); q(14, 10, 2, 1, a || '#7fff6a'); q(14, 8, 1, 1, (a || '#7fff6a') + '88'); q(15, 7, 1, 1, (a || '#7fff6a') + '88'); q(14, 12, 1, 1, (a || '#7fff6a') + '88'); q(15, 13, 1, 1, (a || '#7fff6a') + '88'); },
  deck(q, a) { q(11, 9, 5, 4, W_OL); q(12, 9, 3, 3, '#101018'); q(12, 9, 1, 1, a || '#7fff6a'); q(14, 10, 1, 1, a || '#7fff6a'); q(13, 11, 1, 1, a || '#7fff6a'); q(13, 6, 1, 2, (a || '#7fff6a') + '88'); },
  holo(q, a) { q(13, 9, 1, 4, W_STD); q(12, 4, 3, 4, (a || '#b08fff') + '77'); q(13, 5, 1, 2, W_WH); q(12, 3, 3, 1, a || '#b08fff'); q(12, 8, 3, 1, a || '#b08fff'); },
  inject(q, a) { q(13, 7, 1, 6, W_WH); q(13, 5, 1, 2, W_STD); q(13, 8, 1, 3, a || '#6fe08c'); q(12, 12, 3, 1, W_STD); },
  paddle(q, a) { q(12, 8, 1, 4, W_STD); q(14, 8, 1, 4, W_STD); q(11, 6, 2, 2, a || '#6fe08c'); q(14, 6, 2, 2, a || '#6fe08c'); q(13, 5, 1, 1, W_YL); q(13, 7, 1, 1, W_YL); },
  ram(q, a) { q(11, 8, 5, 4, W_OL); q(12, 8, 4, 3, a || W_STD); q(15, 8, 1, 3, W_YL); q(12, 8, 3, 1, W_STH); },
  lance(q, a) { q(13, 0, 1, 14, W_BK); q(12, 0, 3, 1, a || W_GD); q(12, 2, 1, 3, a || W_GD); q(14, 2, 1, 3, a || W_GD); q(13, 1, 1, 3, W_WH); q(12, 6, 3, 1, a || W_GD); },
  remote(q, a) { q(12, 10, 3, 2, W_STD); q(14, 7, 1, 3, W_STD); q(14, 6, 1, 1, a || W_RD); q(11, 1, 5, 2, W_OL); q(12, 1, 3, 1, W_ST); q(13, 2, 1, 1, a || W_RD); q(11, 0, 1, 1, W_ST); q(15, 0, 1, 1, W_ST); },
  flamer(q, a) { q(11, 9, 4, 2, W_STD); q(12, 11, 1, 2, W_BK); q(15, 8, 1, 4, a || '#5f8fe0'); q(15, 9, 1, 2, W_WH); q(14, 8, 1, 1, W_CY); },
  tool(q, a) { q(13, 6, 1, 7, W_STD); q(12, 3, 3, 3, W_OL); q(12, 4, 3, 1, a || W_YL); q(13, 3, 1, 3, a || W_YL); q(13, 4, 1, 1, W_WH); },
};
// ---- 왼손·등에 진 것 ---- (x 0~3)
const WLEFT = {
  round(q, a, b) { q(0, 8, 4, 5, W_OL); q(1, 7, 2, 7, W_OL); q(1, 8, 2, 5, a || W_WD); q(0, 9, 4, 3, a || W_WD); q(1, 10, 2, 1, b || W_ST); },
  tower(q, a, b) { q(0, 6, 4, 9, W_OL); q(1, 7, 2, 7, a || W_ST); q(1, 7, 1, 7, W_STH); q(1, 9, 2, 2, b || W_RD); },
  kite(q, a, b) { q(0, 7, 4, 6, W_OL); q(1, 13, 2, 1, W_OL); q(1, 8, 2, 5, a || W_WH); q(1, 9, 2, 2, b || W_RD); },
  sack(q, a) { q(0, 8, 4, 6, W_OL); q(1, 9, 2, 4, a || '#8a7a5a'); q(1, 8, 2, 1, '#5a4630'); q(1, 10, 1, 1, '#b8a888'); },
  pack(q, a, b) { q(1, 7, 3, 6, W_OL); q(2, 8, 2, 4, a || W_WD); q(2, 8, 2, 1, b || W_STD); },
  lamp(q, a) { q(1, 8, 1, 2, W_STD); q(0, 10, 3, 4, W_OL); q(0, 11, 3, 2, a || W_YL); q(1, 11, 1, 1, W_WH); },
  gourd(q, a) { q(1, 9, 2, 1, W_OL); q(0, 10, 4, 4, W_OL); q(1, 10, 2, 3, a || '#c89a4a'); q(1, 10, 1, 1, '#f0d090'); q(2, 9, 1, 1, W_RD); },
  riot(q, a) { q(0, 5, 4, 10, W_OL); q(1, 6, 2, 8, a || '#9fd8f0'); q(1, 6, 1, 4, W_WH); q(1, 12, 2, 1, W_BK); },
  case(q, a) { q(1, 9, 2, 2, W_OL); q(0, 10, 4, 4, W_OL); q(1, 11, 2, 2, a || W_WD); q(1, 11, 2, 1, W_GD); },
  tank(q, a, b) { q(1, 6, 3, 7, W_OL); q(2, 7, 2, 5, a || W_RD); q(2, 7, 1, 2, W_WH); q(2, 6, 1, 1, W_STD); },
  eshield(q, a) { q(0, 6, 1, 8, (a || W_CY) + '88'); q(1, 5, 2, 10, a || W_CY); q(1, 6, 1, 8, W_WH); q(3, 6, 1, 8, (a || W_CY) + '88'); },
  cone(q, a) { q(1, 9, 2, 1, W_OL); q(0, 10, 4, 4, W_OL); q(1, 10, 2, 3, a || W_OR); q(1, 11, 2, 1, W_WH); },
};
// ---- 몸 ----
function wman(q, d) {
  const sk = d.sk || W_SK, c = d.c, l = d.l || c, b = d.b || 'tunic', t = d.t;
  if (b === 'bulk') {   // 몸집이 큰 것: 팔과 몸통이 한 덩어리
    q(2, 8, 12, 4, W_OL); q(3, 8, 10, 1, c); q(3, 9, 2, 2, c); q(11, 9, 2, 2, c); q(6, 9, 4, 3, c); q(3, 11, 2, 1, d.g || sk); q(11, 11, 2, 1, d.g || sk);
    q(4, 12, 8, 2, W_OL); q(5, 12, 2, 2, l); q(9, 12, 2, 2, l); q(3, 14, 5, 1, W_OL); q(8, 14, 5, 1, W_OL); if (t) { q(3, 8, 2, 1, t); q(11, 8, 2, 1, t); q(7, 9, 2, 1, t); }
  } else {
    q(3, 8, 10, 4, W_OL); q(4, 8, 8, 1, c); q(4, 9, 1, 2, c); q(11, 9, 1, 2, c); q(6, 9, 4, 3, c); q(4, 11, 1, 1, d.g || sk); q(11, 11, 1, 1, d.g || sk);
    if (b === 'robe') { q(4, 12, 8, 3, W_OL); q(5, 12, 6, 2, c); if (d.hem) q(5, 13, 6, 1, d.hem); if (t) q(6, 11, 4, 1, t); if (d.col) { q(7, 8, 2, 1, d.col); q(8, 9, 1, 2, d.col); } }
    else { q(5, 12, 6, 2, W_OL); q(6, 12, 1, 2, l); q(9, 12, 1, 2, l); q(4, 14, 3, 1, W_OL); q(9, 14, 3, 1, W_OL);
      if (b === 'coat') { q(5, 12, 6, 1, c); q(8, 9, 1, 4, d.col || W_OL); if (t) q(7, 8, 2, 1, t); }
      else if (b === 'armor') { q(3, 8, 2, 1, t || W_STH); q(11, 8, 2, 1, t || W_STH); q(6, 9, 2, 1, t || W_STH); q(6, 11, 4, 1, d.belt || W_STD); }
      else if (b === 'vest') { q(6, 9, 4, 2, t || W_YL); q(6, 10, 4, 1, d.col || W_ST); }
      else if (b === 'suit') { q(8, 9, 1, 3, t || W_CY); q(4, 8, 1, 1, t || W_CY); q(11, 8, 1, 1, t || W_CY); q(6, 13, 1, 1, t || W_CY); q(9, 13, 1, 1, t || W_CY); }
      else if (t) q(6, 11, 4, 1, t); }
  }
  // 얼굴
  q(4, 4, 8, 3, W_OL); q(5, 7, 6, 1, W_OL); q(5, 4, 6, 3, sk); q(6, 7, 4, 1, sk); q(6, 5, 1, 1, W_OL); q(9, 5, 1, 1, W_OL);
  if (d.lf) WLEFT[d.lf[0]](q, d.lf[1], d.lf[2]);
  WHEAD[d.h[0]](q, d.h[1], d.h[2], d.h[3], sk);
  if (d.f === 'beard') { q(5, 6, 6, 2, d.fc || '#8a5a2a'); q(6, 8, 4, 2, d.fc || '#8a5a2a'); q(7, 10, 2, 1, d.fc || '#8a5a2a'); q(7, 6, 2, 1, sk); }
  if (d.f === 'mask') { q(5, 6, 6, 1, d.fc || W_BK); q(6, 7, 4, 1, d.fc || W_BK); }
  if (d.f === 'glass') { q(5, 5, 2, 1, '#cfe8ff'); q(8, 5, 2, 1, '#cfe8ff'); q(7, 5, 1, 1, W_OL); q(10, 5, 1, 1, W_OL); }
  if (d.f === 'stache') { q(6, 6, 4, 1, d.fc || '#3a2a20'); }
  if (d.r) WITEM[d.r[0]](q, d.r[1], d.r[2]);
  if (d.x) d.x.forEach(e => q(e[0], e[1], e[2], e[3], e[4]));
}
// ---- 짐승과 기계 ----
const WDOG = ['................', '................', '................', '................', '.........oo..o..', '........obbooo..', '..o....obbbbeo..', '.obo..obbbbbbbo.', '.obbooobbbbbwwo.', '..obbbbbbbbbooo.', '..obbbbbbbbbo...', '..obbbsbbbbso...', '..obo.obo.obo...', '..obo.obo.obo...', '..oo..oo..oo....', '................'];
const WBEAST = {
  dog(q, d) { const m = { o: W_OL, b: d.c, s: d.l || d.c, e: W_OL, w: d.w || W_WH }; WDOG.forEach((row, y) => { for (let i = 0; i < 16; i++) if (m[row[i]]) q(i, y, 1, 1, m[row[i]]); }); if (d.x) d.x.forEach(e => q(e[0], e[1], e[2], e[3], e[4])); },
  hawk(q, d) { const a = d.c, b = d.l;   // 날개를 편 매
    q(0, 5, 16, 1, W_OL); q(0, 6, 16, 3, W_OL); q(2, 9, 12, 1, W_OL); q(5, 3, 6, 9, W_OL); q(6, 12, 4, 2, W_OL);
    q(1, 6, 5, 2, a); q(10, 6, 5, 2, a); q(1, 6, 4, 1, b); q(11, 6, 4, 1, b); q(3, 8, 3, 1, a); q(10, 8, 3, 1, a); q(0, 6, 1, 1, W_OL); q(15, 6, 1, 1, W_OL);
    q(6, 4, 4, 7, a); q(7, 7, 2, 4, b); q(6, 4, 4, 2, b); q(6, 5, 1, 1, W_OL); q(9, 5, 1, 1, W_OL); q(7, 6, 2, 1, W_YL); q(7, 12, 2, 1, a); q(6, 13, 1, 1, W_YL); q(9, 13, 1, 1, W_YL); },
  drone(q, d) { const a = d.c, t = d.t || W_RD;   // 떠 있는 기계
    q(1, 3, 4, 1, W_STD); q(11, 3, 4, 1, W_STD); q(3, 4, 1, 2, W_STD); q(12, 4, 1, 2, W_STD); q(0, 3, 1, 1, W_STH); q(15, 3, 1, 1, W_STH);
    q(3, 5, 10, 6, W_OL); q(2, 6, 12, 4, W_OL); q(4, 6, 8, 4, a); q(3, 7, 10, 2, a); q(4, 6, 3, 1, W_WH); q(6, 7, 4, 2, W_OL); q(7, 7, 2, 2, t); q(7, 7, 1, 1, W_WH);
    q(5, 11, 1, 2, W_STD); q(10, 11, 1, 2, W_STD); q(7, 11, 2, 1, W_STD); q(7, 13, 2, 1, t + '88'); q(6, 14, 4, 1, t + '44'); },
};
// ---- 세계마다의 차림 ----  c 옷, l 다리, b 몸틀, t 띠·줄, h 머리, r 오른손, lf 왼손, f 얼굴
const WLOOK = {
  fantasy: {
    villager: { c: '#8a6a3a', l: '#5a4630', h: ['straw', '#d8b050', '#b88a30'], r: ['fork'] },
    fisher: { c: '#3a6a9a', l: '#2a4a6a', h: ['floppy', '#c8b060'], r: ['rod'] },
    militia: { c: '#3f6b46', l: '#5a4630', t: '#7a5a2a', h: ['leather', '#7a5a2a', '#5a4020'], r: ['spear'], lf: ['round', '#7a5a3a'] },
    captain: { c: '#8a2a2a', l: '#4a3a3a', b: 'armor', h: ['helm', W_ST, W_STH, W_RD], r: ['sword'], lf: ['kite', W_WH, W_RD] },
    detective: { c: '#5a5a48', l: '#3a3a30', t: '#2a2a20', h: ['hood', '#4a5a3a'], r: ['lantern'] },
    apprentice: { c: '#6aa0d0', b: 'robe', t: '#fff3a0', h: ['wizard', '#4a78b0', '#fff3a0'], r: ['wand'] },
    warrior: { c: '#707890', l: '#4a5068', b: 'armor', h: ['helm', '#8a92aa', W_STH], r: ['great'] },
    smuggler: { c: '#3a2a4a', l: '#2a2030', h: ['hood', '#2a2030'], f: 'mask', r: ['dagger'], lf: ['sack'] },
    priest: { c: '#e8e8f0', b: 'robe', t: W_GD, hem: '#c8c8d8', col: W_GD, h: ['mitre', '#f0f0f8', W_GD], r: ['holy'] },
    scholar: { c: '#2a3a8a', b: 'robe', t: '#b08fff', hem: '#1a2460', h: ['wizard', '#2a3a8a', '#b08fff'], f: 'beard', fc: '#d8d8e0', r: ['orb', '#b08fff'] },
    herbalist: { c: '#4a8a4a', l: '#6a5a3a', t: '#e8d8a0', h: ['wreath', '#a85a30', '#e890b0'], r: ['basket'] },
    soldier: { c: '#2a3a6a', l: '#1a2448', b: 'bulk', t: W_ST, g: W_STD, h: ['helm', '#4a5a8a', W_STH], r: ['hammer'], lf: ['tower', '#3a4a7a', W_GD] },
    chaplain: { c: '#f0e8e0', l: '#a8a0a0', b: 'armor', t: W_GD, belt: W_RD, h: ['helm', '#e8e8f0', W_WH, W_GD], r: ['mace', W_GD], x: [[7, 9, 2, 2, W_RD]] },
    sealer: { c: '#1a1a2a', b: 'robe', t: W_GD, hem: '#3a2a5a', col: W_GD, sk: '#ffe0c0', h: ['wizard', '#1a1a2a', W_GD], f: 'beard', fc: W_WH, r: ['bigstaff'] },
    hound: { beast: 'dog', c: '#8a6a4a', l: '#5a4630' },
    handler: { c: '#5a4630', l: '#3a2a20', t: '#3f6b46', h: ['floppy', '#3f6b46', W_RD], r: ['leash'] },
    sapper: { c: '#6a5a2a', l: '#3a3020', b: 'bulk', t: '#a89040', h: ['beardcap', '#8a8a96', W_GD], f: 'beard', fc: '#c86a2a', r: ['pick'] },
    torch: { c: '#6a3a2a', l: '#3a2a20', h: ['cap', '#8a2a2a'], r: ['torch'] },
  },
  wuxia: {
    villager: { c: '#8a7a5a', b: 'robe', t: '#5a4a30', hem: '#6a5a3a', h: ['cone', '#c8a860', '#e8d090'], r: ['hoe'] },
    fisher: { c: '#4a7a8a', b: 'robe', t: '#2a4a5a', h: ['cone', '#a89050', '#c8b070'], r: ['pole', '#8a9a4a'] },
    militia: { c: '#3a5a7a', l: '#2a2a3a', t: W_RD, h: ['band', '#34303e', W_RD], r: ['dao'] },
    captain: { c: '#8a2a2a', b: 'robe', t: W_GD, hem: '#5a1a1a', col: W_GD, h: ['topknot', '#34303e', W_GD], f: 'stache', r: ['dao', '#c0c8e0'], lf: ['gourd'] },
    detective: { c: '#3a3a4a', b: 'robe', t: W_RD, hem: '#2a2a34', h: ['gat', '#34303e', W_RD], r: ['baton', '#7a2a2a'] },
    apprentice: { c: '#8ab0d8', b: 'robe', t: W_WH, hem: '#5a80b0', h: ['topknot', '#34303e', '#8ab0d8'], r: ['talisman'] },
    warrior: { c: '#e8e8f0', b: 'robe', t: '#3a5a9a', hem: '#b8b8c8', col: '#3a5a9a', h: ['longhair', '#34303e', W_WH], r: ['jian'] },
    smuggler: { c: '#22202a', b: 'robe', t: '#3a3440', h: ['hood', '#22202a', '#22202a'], f: 'mask', fc: '#22202a', r: ['dagger'], lf: ['sack', '#4a4450'] },
    priest: { c: '#e09a3a', b: 'robe', t: '#8a4a1a', hem: '#b87a2a', col: '#8a4a1a', h: ['bald', '#c88a60'], r: ['beads'], x: [[6, 9, 1, 1, '#5a3a20'], [7, 10, 2, 1, '#5a3a20'], [9, 9, 1, 1, '#5a3a20']] },
    scholar: { c: '#2a3a6a', b: 'robe', t: W_WH, hem: '#e8e8f0', col: W_WH, h: ['taocap', '#34303e', W_GD], f: 'beard', fc: '#2a2430', r: ['whisk'] },
    herbalist: { c: '#5a9a6a', b: 'robe', t: '#e8e0c0', hem: '#3a7a4a', h: ['taocap', '#3a5a4a', '#e8e0c0'], r: ['box', '#8a5a3a', W_RD] },
    soldier: { c: '#6a3a2a', l: '#3a2a2a', b: 'bulk', t: W_GD, g: W_STD, h: ['tassel', '#8a8a96', W_GD, W_RD], r: ['halberd'], lf: ['round', '#8a2a2a', W_GD] },
    chaplain: { c: '#b8601a', b: 'bulk', t: W_GD, l: '#7a3a10', h: ['bald', '#a86a40'], r: ['monk'], x: [[6, 10, 4, 1, '#3a2a20'], [6, 9, 1, 1, '#3a2a20'], [9, 9, 1, 1, '#3a2a20']] },
    sealer: { c: '#f0f0f8', b: 'robe', t: W_GD, hem: '#c8c8e0', col: '#8a5fe0', sk: '#ffe0c0', h: ['elder', W_WH], r: ['jian', '#e0c8ff'], lf: ['gourd', '#8a5fe0'], x: [[1, 3, 2, 3, W_YL], [1, 4, 2, 1, W_RD]] },
    hound: { beast: 'hawk', c: '#7a5a3a', l: '#e8dcc0' },
    handler: { c: '#6a5a3a', l: '#3a3020', t: '#a8845a', h: ['furhat', '#7a5a3a', '#b89a7a'], r: ['hawk'] },
    sapper: { c: '#4a5a4a', l: '#2a3a2a', b: 'bulk', t: '#a8a040', h: ['band', '#34303e', W_YL], f: 'stache', r: ['hammer', '#8a8a96'], lf: ['pack', '#7a5a3a', W_ST] },
    torch: { c: '#7a3a2a', b: 'robe', t: '#3a2a20', h: ['band', '#34303e', W_OR], r: ['torch'] },
  },
  modern: {
    villager: { c: '#5a8ab0', l: '#3a4a6a', b: 'tunic', h: ['cap', '#c83030', W_WH], r: ['bat'] },
    fisher: { c: '#d86a2a', l: '#4a5a3a', b: 'vest', t: '#e8b040', col: '#8a4a1a', h: ['bucket', '#8a9a5a', '#6a7a40'], r: ['rod', W_RD] },
    militia: { c: '#2a3a5a', l: '#2a2a3a', b: 'vest', t: '#d8f030', h: ['cap', '#2a3a5a', '#d8f030'], r: ['baton'], lf: ['lamp'] },
    captain: { c: '#2a3a5a', l: '#2a2a3a', b: 'vest', t: W_OR, h: ['cap', W_RD, W_WH], f: 'stache', r: ['mega'] },
    detective: { c: '#a8845a', l: '#3a3a44', b: 'coat', col: '#7a5a3a', t: W_WH, h: ['fedora', '#7a5a3a', '#3a2a20'], r: ['flash'] },
    apprentice: { c: '#e8e8f0', l: '#4a6a9a', b: 'coat', col: '#b8b8c8', t: '#5a8ab0', h: ['hair', '#3a2a20'], f: 'glass', r: ['clip'] },
    warrior: { c: '#34343e', l: '#26262e', b: 'armor', t: '#5a5a66', belt: '#6a5a3a', h: ['beanie', '#26262e', '#4a4a56'], f: 'mask', fc: '#26262e', r: ['shotgun'] },
    smuggler: { c: '#3a3a44', l: '#2a2a30', h: ['beanie', '#2a2a30', '#5a5a64'], f: 'mask', fc: W_WH, r: ['crowbar'], lf: ['sack', '#5a6a8a'], x: [[5, 9, 6, 1, W_WH]] },
    priest: { c: W_WH, l: '#d86a2a', b: 'vest', t: '#d86a2a', col: W_WH, h: ['cap', '#d86a2a', W_WH], r: ['medkit'] },
    scholar: { c: '#6a5a4a', l: '#3a3a44', b: 'coat', col: '#4a3a30', t: W_RD, h: ['hair', '#b8b8c0'], f: 'glass', r: ['book'], x: [[4, 3, 1, 2, '#b8b8c0'], [11, 3, 1, 2, '#b8b8c0']] },
    herbalist: { c: '#e8f0e8', l: '#4a7a5a', b: 'coat', col: '#b8c8b8', t: '#3fae5a', h: ['hair', '#5a3a20'], r: ['bag'], x: [[6, 9, 1, 1, '#3fae5a']] },
    soldier: { c: '#5a6a3a', l: '#4a5a30', b: 'bulk', t: '#3a4a24', g: '#3a4a24', h: ['army', '#5a6a3a', '#3a4a24'], r: ['rifle'], x: [[6, 10, 4, 1, '#3a4a24'], [4, 9, 1, 1, '#7a8a4a'], [10, 12, 1, 1, '#7a8a4a']] },
    chaplain: { c: '#1e1e24', l: '#1e1e24', b: 'coat', col: '#3a3a44', t: W_WH, h: ['fedora', '#1e1e24', W_RD], r: ['bell'], lf: ['case', '#3a2a20'], x: [[7, 9, 1, 2, W_RD]] },
    sealer: { c: '#e8d83a', l: '#c8b82a', b: 'bulk', t: W_BK, g: '#3a3a44', h: ['hazmat', '#e8d83a'], r: ['spray', '#b08fff'], lf: ['tank', W_OR], x: [[6, 10, 4, 1, W_BK], [7, 9, 2, 1, W_BK]] },
    hound: { beast: 'dog', c: '#3a3028', l: '#b8884a', x: [[5, 9, 4, 2, '#2a3a5a'], [6, 9, 2, 1, W_WH], [2, 6, 1, 1, '#3a3028']] },
    handler: { c: '#2a3a5a', l: '#2a2a3a', b: 'armor', t: '#4a5a7a', belt: W_BK, h: ['cap', '#2a3a5a', W_GD], r: ['leash', W_ST] },
    sapper: { c: '#5a6a4a', l: '#4a5a3a', b: 'bulk', t: '#3a4a2a', g: '#3a4a2a', h: ['bomb', '#5a6a4a', '#7a8a6a'], r: ['cutter'], x: [[6, 10, 4, 2, '#3a4a2a']] },
    torch: { c: '#4a5a8a', l: '#3a4a6a', b: 'tunic', t: '#6a5a3a', g: '#8a6a3a', h: ['weld', '#5a5a64'], r: ['welder'], lf: ['tank', '#5a7ab0'] },
  },
  future: {
    villager: { c: '#d8782a', l: '#a85a1a', b: 'suit', t: W_WH, h: ['visor', '#e8e0d0', W_OR], r: ['wrench'] },
    fisher: { c: '#2a8a8a', l: '#1a6a6a', b: 'suit', t: '#9ff0e0', h: ['visor', '#2a8a8a', '#9ff0e0'], r: ['netpole'] },
    militia: { c: '#6a7088', l: '#4a5068', b: 'suit', t: W_CY, h: ['visor', '#8a90a8', W_CY], r: ['stun'] },
    captain: { c: '#6a7088', l: '#4a5068', b: 'armor', t: W_RD, belt: W_RD, h: ['visor', '#8a90a8', W_RD, '#8a90a8'], r: ['blaster', W_RD], x: [[8, 9, 1, 2, W_RD]] },
    detective: { c: '#3e3e54', l: '#30303f', b: 'coat', col: '#7fff6a', h: ['visor', '#3e3e54', '#7fff6a'], r: ['scan'] },
    apprentice: { c: '#f0f0f8', l: '#c8c8d8', b: 'suit', t: '#b08fff', h: ['visor', '#f0f0f8', '#b08fff'], r: ['pad', '#b08fff'] },
    warrior: { c: '#3a3a4a', l: '#2a2a38', b: 'bulk', t: W_OR, g: '#2a2a38', h: ['visor', '#3a3a4a', W_OR], r: ['eblade', W_OR], x: [[4, 10, 1, 1, W_OR], [11, 10, 1, 1, W_OR], [5, 13, 2, 1, W_OR], [9, 13, 2, 1, W_OR]] },
    smuggler: { c: '#2c2c3c', l: '#22222e', b: 'suit', t: '#7fff6a', h: ['cyhood', '#2c2c3c', '#7fff6a'], r: ['deck'] },
    priest: { c: '#f0f0f8', l: '#d0d8e0', b: 'suit', t: '#6fe08c', h: ['visor', '#f0f0f8', '#6fe08c'], r: ['inject'], x: [[6, 9, 3, 1, '#6fe08c'], [7, 8, 1, 3, '#6fe08c']] },
    scholar: { c: '#d8d8e8', b: 'robe', t: '#b08fff', hem: '#a8a8c0', col: '#b08fff', h: ['dome', '#d8d8e8', '#b08fff'], r: ['holo'] },
    herbalist: { c: '#3a8a5a', l: '#2a6a44', b: 'suit', t: W_YL, h: ['visor', '#3a8a5a', W_YL], r: ['paddle'], lf: ['pack', '#2a6a44', W_YL] },
    soldier: { c: '#4a5a7a', l: '#34405a', b: 'bulk', t: W_YL, g: W_STD, h: ['dome', '#4a5a7a', W_YL, W_YL], r: ['ram'], lf: ['eshield', W_YL], x: [[2, 7, 3, 1, W_OL], [11, 7, 3, 1, W_OL], [3, 7, 1, 1, W_YL], [12, 7, 1, 1, W_YL]] },
    chaplain: { c: '#e8e0e0', l: '#b8a8a8', b: 'armor', t: W_RD, belt: W_RD, h: ['dish', '#e8e0e0', W_RD, W_WH], r: ['tool', W_RD], lf: ['eshield', '#ff8a8a'] },
    sealer: { c: '#22202e', b: 'robe', t: W_GD, hem: '#3a2a5a', col: W_GD, h: ['halo', '#22202e', W_GD, W_GD], r: ['lance'], x: [[4, 8, 1, 1, W_GD], [11, 8, 1, 1, W_GD], [1, 9, 2, 2, '#b08fff'], [1, 9, 1, 1, W_WH]] },
    hound: { beast: 'drone', c: '#8a90a8', t: W_RD },
    handler: { c: '#4a5a4a', l: '#3a4a3a', b: 'suit', t: W_RD, h: ['visor', '#4a5a4a', W_RD, '#4a5a4a'], r: ['remote'] },
    sapper: { c: '#a8882a', l: '#7a6220', b: 'bulk', t: W_BK, g: W_STD, h: ['dome', '#a8882a', W_YL], r: ['tool', W_YL], lf: ['pack', '#3a3a44', W_YL], x: [[6, 10, 4, 1, W_BK]] },
    torch: { c: '#8a3a2a', l: '#5a2a20', b: 'suit', t: '#5f8fe0', h: ['visor', '#8a3a2a', '#5f8fe0'], r: ['flamer'], lf: ['tank', '#5f8fe0'] },
  },
};
const _wcv = {};
function invCanvasW(world, kind) {
  const w = WLOOK[world] ? world : 'fantasy', key = w + ':' + kind; if (_wcv[key]) return _wcv[key];
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'), q = (a, b, ww, h, col) => { x.fillStyle = col; x.fillRect(a, b, ww, h); };
  const d = WLOOK[w][kind] || WLOOK.fantasy[kind] || WLOOK.fantasy.villager; if (d.beast) WBEAST[d.beast](q, d); else wman(q, d);
  return (_wcv[key] = c);
}
