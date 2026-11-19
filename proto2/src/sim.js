// 옛 것의 둥지 — 새 판 시험 "땅속 한 칸". 시간이 흐르는 둥지.
// 본체는 땅속 한 칸에서 시작한다. 권속은 본체의 몸에서 돋아나 걸어 다니며 땅을 파고 먹이를 나른다.
// 플레이어는 하나하나 시키지 않는다. 기울기(파기/고르게/지키기), 부름(여기를 파라), 허물의 방향, 밖으로 뚫을 때만 정한다.
// 이 파일은 화면 없이 돈다(node 로 시험). 화면은 view.js.
const BURROW = (function () {
  const W = 64, H = 100, SKY = 10, DT = 0.1;
  const T = { AIR: 0, SOIL: 1, ROCK: 2, BED: 3, FOOD: 4, GEM: 5, SKY: 6, GRASS: 7 };
  const ASPECTS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'], ASP = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' };
  // 징조마다 본체와 권속이 달라지는 점
  const GIFT = { abyss: '본체가 훨씬 질기다 (체력 +60%)', nebula: '권속이 빨리 움직인다 (+25%)', brood: '권속이 싸게 돋고 더 많이 거느린다', dusk: '들어온 것들이 겁먹어 약하게 친다 (−35%)', hunger: '먹이에서 더 많이 얻고, 본체가 세게 문다' };
  const K = { food: 4, gem: 15, corpse: 8, cost: { w: 10, s: 16 }, bud: 4, molt: [40, 140, 360, 800], digT: { 1: 0.9, 7: 0.9, 2: 3.5, 4: 1.0, 5: 1.4 }, speed: { w: 4, s: 3.8, f: 2.6 }, hp: { w: 6, s: 16 }, wave: 40, ready: 160, capBase: 4 };
  const STAGE = ['한 방울', '첫 허물', '두 번째 허물', '세 번째 허물', '성체'];
  function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const idx = (x, y) => y * W + x, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function newWorld(seed) {
    const r = rngOf(seed), g = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[idx(x, y)] = y < SKY ? T.SKY : y === SKY ? T.GRASS : (x === 0 || x === W - 1 || y === H - 1) ? T.BED : T.SOIL;
    const blob = (cx, cy, rx, ry, t, only) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { if (!inb(x, y) || y <= SKY + 1) continue; const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1 && g[idx(x, y)] === (only || T.SOIL)) g[idx(x, y)] = t; } };
    const hx = 32, hy = 80;
    for (let k = 0; k < 30; k++) { const cx = 3 + r() * (W - 6), cy = SKY + 8 + r() * (H - SKY - 12); if (Math.hypot(cx - hx, cy - hy) < 11) continue; blob(cx, cy, 2 + r() * 4, 1.5 + r() * 2.5, T.ROCK); }
    for (let k = 0; k < 44; k++) { const cx = 3 + r() * (W - 6), cy = SKY + 5 + r() * (H - SKY - 9); if (Math.hypot(cx - hx, cy - hy) < 5) continue; blob(cx, cy, 0.6 + r() * 0.8, 0.5 + r() * 0.6, T.FOOD); }
    [[-8, -2], [7, 3], [3, -8], [-5, 7]].forEach(([dx, dy]) => blob(hx + dx + r() * 2, hy + dy + r() * 2, 1.4, 1, T.FOOD));
    for (let k = 0; k < 14; k++) { const x = 3 + Math.floor(r() * (W - 6)), y = SKY + 20 + Math.floor(r() * (H - SKY - 24)); if (g[idx(x, y)] === T.SOIL) g[idx(x, y)] = T.GEM; }
    for (let y = hy - 3; y <= hy + 2; y++) for (let x = hx - 4; x <= hx + 4; x++) { const dx = (x - hx) / 4.4, dy = (y - hy + 0.5) / 3; if (dx * dx + dy * dy <= 1) g[idx(x, y)] = T.AIR; }
    const S = { seed: seed >>> 0, t: 0, g, want: new Uint8Array(W * H), claim: new Int32Array(W * H), seen: new Uint8Array(W * H), dirty: [], r,
      hero: { x: hx, y: hy, stage: 0, main: null, sub: null, bio: 18, eaten: 0, hp: 60, mhp: 60, budT: 1, biteT: 0 },
      kin: [], foes: [], items: [], chambers: [{ x: hx, y: hy, kind: '본체 방' }], ends: [], marks: [], log: [], fx: [],
      lean: 1, breach: 0, entrance: null, wave: 0, waveT: 0, nextId: 1, molt: null, over: null, dug: 0, planT: 0, scanT: 0, stats: { born: 0, lost: 0, slain: 0, food: 0 } };
    say(S, '땅속 한 칸. 몸이 근질거린다.');
    return S;
  }
  function say(S, s) { S.log.unshift({ t: S.t, s }); if (S.log.length > 30) S.log.length = 30; }
  const solid = t => t !== T.AIR && t !== T.SKY;
  const diggable = (S, t) => t === T.SOIL || t === T.ROCK || t === T.FOOD || t === T.GEM || (t === T.GRASS && S.breach >= 1);
  const kinCap = S => Math.min(44, Math.floor(K.capBase + S.hero.stage * 4 + S.chambers.filter(c => c.open).length * 1.5 + (S.hero.main === 'brood' ? 6 : 0)));
  const costOf = (S, k) => Math.round(K.cost[k] * (S.hero.main === 'brood' ? 0.7 : 1));
  const count = (S, k) => S.kin.filter(m => m.kind === k).length;
  const ready = S => S.breach === 0 && S.hero.stage >= 1 && S.dug >= K.ready;

  // 너비 우선 탐색: 빈 칸만 걸어서 goal(칸)을 만족하는 가장 가까운 칸까지의 길
  const prev = new Int32Array(W * H), que = new Int32Array(W * H);
  function bfs(S, from, goal, limit) {
    prev.fill(-2); let qh = 0, qt = 0; que[qt++] = from; prev[from] = -1; const lim = limit || 4000;
    while (qh < qt && qh < lim) { const c = que[qh++]; if (goal(c)) { const p = []; for (let k = c; k !== from; k = prev[k]) p.push(k); return p.reverse(); } const cx = c % W, cy = (c - cx) / W; for (const [dx, dy] of N4) { const nx = cx + dx, ny = cy + dy; if (!inb(nx, ny)) continue; const n = idx(nx, ny); if (prev[n] !== -2) continue; const t = S.g[n]; if (t !== T.AIR && !(t === T.SKY && ny === SKY - 1)) continue; prev[n] = c; que[qt++] = n; } }
    return null;
  }
  function setTile(S, i, t) { S.g[i] = t; S.dirty.push(i); }

  // ---- 둥지의 본능: 어디를 팔지 정한다 ----
  function wantLine(S, ax, ay, bx, by, wide) {
    let x = ax, y = ay, n = 0; const out = [];
    while ((x !== bx || y !== by) && n++ < 90) { const dx = bx - x, dy = by - y; if (S.r() < 0.16 && n > 1) { if (S.r() < 0.5) { if (x > 2 && x < W - 3) x += S.r() < 0.5 ? 1 : -1; } else if (y > SKY + 2 && y < H - 3) y += S.r() < 0.5 ? 1 : -1; } else if (Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && S.r() < 0.5)) x += Math.sign(dx); else y += Math.sign(dy); out.push([x, y]); if (wide && S.r() < 0.4) out.push([x, y + 1]); }
    let m = 0; out.forEach(([px, py]) => { if (!inb(px, py)) return; const i = idx(px, py); if (diggable(S, S.g[i]) && !S.want[i]) { S.want[i] = 1; m++; } }); return m;
  }
  function wantRoom(S, cx, cy, rx, ry, kind) { let m = 0; for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) { if (!inb(x, y) || y <= SKY + 2) continue; const dx = (x - cx) / (rx + 0.3), dy = (y - cy) / (ry + 0.3); const i = idx(x, y); if (dx * dx + dy * dy <= 1 && diggable(S, S.g[i]) && !S.want[i]) { S.want[i] = 1; m++; } } S.chambers.push({ x: cx, y: cy, kind, open: false }); return m; }
  function nearestAir(S, x, y) { let best = -1, bd = 1e9; for (let i = 0; i < W * H; i++) if (S.g[i] === T.AIR) { const d = Math.abs(i % W - x) + Math.abs(Math.floor(i / W) - y); if (d < bd) { bd = d; best = i; } } return best; }
  const ROOMS = ['곳간', '알방', '쉼터', '병영', '곳간', '알방'];
  function director(S) {
    const workers = count(S, 'w'); let open = 0; for (let i = 0; i < W * H; i++) if (S.want[i]) open++;
    if (S.dug !== S.lastDug) { S.lastDug = S.dug; S.stuckT = S.t; } else if (open && S.t - (S.stuckT || 0) > 25) { S.want.fill(0); S.claim.fill(0); S.kin.forEach(m => { m.job = null; }); S.stuckT = S.t; open = 0; }
    if (open > workers * 4 + 6) return;
    if (S.marks.length) { const mk = S.marks.shift(), a = nearestAir(S, mk.x, mk.y); if (a >= 0) { wantLine(S, a % W, Math.floor(a / W), mk.x, mk.y, false); wantRoom(S, mk.x, mk.y, 2, 1, '부른 자리'); say(S, '부름을 들었다. 그쪽으로 판다.'); } return; }
    if (S.breach === 1) { let top = -1; for (let i = 0; i < W * H && top < 0; i++) if (S.g[i] === T.AIR) top = i; if (top >= 0) { const tx = top % W, ty = Math.floor(top / W); let any = 0; for (let y = ty - 1; y >= SKY; y--) { const i = idx(tx, y); if (diggable(S, S.g[i]) && !S.want[i]) { S.want[i] = 1; any++; } } } return; }
    // 가까이 보이는 먹이부터
    let best = -1, bd = 1e9; for (let i = 0; i < W * H; i++) if (S.seen[i] && !S.want[i] && (S.g[i] === T.FOOD || S.g[i] === T.GEM)) { const d = Math.abs(i % W - S.hero.x) + Math.abs(Math.floor(i / W) - S.hero.y); if (d < bd) { bd = d; best = i; } }
    if (best >= 0) { const bx = best % W, by = Math.floor(best / W), a = nearestAir(S, bx, by); wantLine(S, a % W, Math.floor(a / W), bx, by, false); S.want[best] = 1; return; }
    // 뻗어 나간다: 방이나 굴 끝에서 새 굴, 가끔 그 끝에 방
    const nodes = S.chambers.concat(S.ends.slice(-6)), nd = nodes[Math.floor(S.r() * nodes.length)], DIRS = [[1, 0, 3], [-1, 0, 3], [1, -1, 2], [-1, -1, 2], [1, 1, 2], [-1, 1, 2], [0, -1, 1.5], [0, 1, 1.5]];
    let tot = DIRS.reduce((a, d) => a + d[2], 0), pick = S.r() * tot, d = DIRS[0]; for (const q of DIRS) { if (pick < q[2]) { d = q; break; } pick -= q[2]; }
    const len = 5 + Math.floor(S.r() * 7), ex = Math.max(3, Math.min(W - 4, nd.x + d[0] * len)), ey = Math.max(SKY + 5, Math.min(H - 4, nd.y + d[1] * len));
    if (S.g[idx(ex, ey)] === T.AIR) return; let near = 0; for (let y = ey - 2; y <= ey + 2; y++) for (let x = ex - 3; x <= ex + 3; x++) if (inb(x, y) && (S.g[idx(x, y)] === T.AIR || S.want[idx(x, y)])) near++; if (near > 4) return;
    const a = nearestAir(S, nd.x, nd.y); wantLine(S, a % W, Math.floor(a / W), ex, ey, S.r() < 0.3);
    if (S.r() < 0.55) wantRoom(S, ex, ey, 2 + Math.floor(S.r() * 2), 1 + Math.floor(S.r() * 2), ROOMS[S.chambers.length % ROOMS.length]); else S.ends.push({ x: ex, y: ey });
  }
  function scan(S) { for (let i = 0; i < W * H; i++) { const t = S.g[i]; if ((t !== T.FOOD && t !== T.GEM) || S.seen[i]) continue; const x = i % W, y = Math.floor(i / W); let near = false; for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) if (inb(x + dx, y + dy) && S.g[idx(x + dx, y + dy)] === T.AIR) { near = true; break; } if (near) { S.seen[i] = 1; S.dirty.push(i); } } }

  // ---- 움직이는 것들 ----
  function spawnKin(S, kind) { const h = S.hero, m = { id: S.nextId++, kind, x: h.x, y: h.y, fx: h.x, fy: h.y, mt: 1, path: [], job: null, carry: 0, hp: K.hp[kind] + (kind === 's' ? h.stage * 5 : 0), cd: 0, born: S.t }; S.kin.push(m); S.stats.born++; S.fx.push({ k: 'bud', x: h.x, y: h.y, t: S.t }); return m; }
  function stepMove(S, e, speed) { if (e.mt < 1) { e.mt = Math.min(1, e.mt + speed * DT); return true; } if (!e.path || !e.path.length) return false; const n = e.path.shift(); if (solid(S.g[n]) && !(S.g[n] === T.SKY)) { e.path = []; return false; } e.fx = e.x; e.fy = e.y; e.x = n % W; e.y = Math.floor(n / W); e.mt = Math.min(1, speed * DT); return true; }
  const here = e => idx(e.x, e.y), nearHero = (S, i) => Math.abs(i % W - S.hero.x) <= 2 && Math.abs(Math.floor(i / W) - S.hero.y) <= 2;
  function worker(S, m) {
    const sp = K.speed.w * (S.hero.main === 'nebula' ? 1.25 : 1);
    if (stepMove(S, m, sp)) return;
    const foe = S.foes.find(f => Math.abs(f.x - m.x) + Math.abs(f.y - m.y) <= 3);
    if (foe && !m.flee) { m.flee = 1; m.job = null; const p = bfs(S, here(m), i => nearHero(S, i), 3000); if (p) m.path = p; return; } if (!foe) m.flee = 0;
    if (m.carry) { if (nearHero(S, here(m))) { const v = m.carry * (S.hero.main === 'hunger' ? 1.3 : 1); S.hero.bio += v; S.hero.eaten += v; S.stats.food += v; m.carry = 0; S.fx.push({ k: 'eat', x: S.hero.x, y: S.hero.y, t: S.t }); return; } const p = bfs(S, here(m), i => nearHero(S, i), 6000); if (p) m.path = p; else m.carry = 0; return; }
    if (m.job) { const j = m.job; if (!S.want[j.dig] && !solid(S.g[j.dig])) { S.claim[j.dig] = 0; m.job = null; return; } if (here(m) !== j.at) { const p = bfs(S, here(m), i => i === j.at, 6000); if (p) m.path = p; else { S.claim[j.dig] = 0; m.job = null; } return; }
      j.p += DT / (K.digT[S.g[j.dig]] || 0.5); m.dig = S.t; if (j.p >= 1) { const t = S.g[j.dig]; setTile(S, j.dig, T.AIR); S.want[j.dig] = 0; S.claim[j.dig] = 0; S.dug++; S.fx.push({ k: 'dig', x: j.dig % W, y: Math.floor(j.dig / W), t: S.t }); if (t === T.FOOD) m.carry = K.food; if (t === T.GEM) { m.carry = K.gem; say(S, '굳은 별 조각을 캤다.'); } if (t === T.GRASS && S.breach === 1) { S.breach = 2; S.entrance = { x: j.dig % W, y: SKY }; S.waveT = 14; say(S, '바깥 공기가 쏟아져 들어온다. 굴이 땅 위로 뚫렸다.'); } m.job = null; } return; }
    const it = S.items.find(o => !o.by); if (it) { const p = bfs(S, here(m), i => i === idx(it.x, it.y), 6000); if (p) { it.by = m.id; m.path = p; m.fetch = it; return; } }
    if (m.fetch) { const o = m.fetch; m.fetch = null; if (o.x === m.x && o.y === m.y) { m.carry = o.v; S.items = S.items.filter(q => q !== o); return; } o.by = 0; }
    m.idle = 1;   // 할 일은 assign 이 가까운 일움에게 나눠 준다
    if (S.r() < 0.12) { const [dx, dy] = N4[Math.floor(S.r() * 4)], n = idx(m.x + dx, m.y + dy); if (inb(m.x + dx, m.y + dy) && S.g[n] === T.AIR) m.path = [n]; }
  }
  // 팔 칸마다 가장 가까이 있는 한가한 일움을 보낸다 (멀리 있는 것이 먼저 맡으면 굴 하나를 한참 걸려 판다)
  function assign(S) {
    const at = new Map(); let n = 0; for (const m of S.kin) if (m.kind === 'w' && m.idle && !m.job && !m.carry && !m.flee && !m.fetch && m.mt >= 1 && !(m.path && m.path.length)) { if (!at.has(here(m))) at.set(here(m), m); n++; } if (!n) return;
    let done = 0; for (let i = 0; i < W * H && done < 40 && at.size; i++) { if (!S.want[i] || S.claim[i] || !diggable(S, S.g[i])) continue; const x = i % W, y = (i - x) / W; let a = -1; for (const [dx, dy] of N4) if (inb(x + dx, y + dy) && S.g[idx(x + dx, y + dy)] === T.AIR) { a = idx(x + dx, y + dy); break; } if (a < 0) continue; done++;
      let who = at.get(a) || null; if (!who) { const p = bfs(S, a, c => at.has(c), 2500); if (!p) continue; who = at.get(p[p.length - 1]); }
      const path = here(who) === a ? [] : bfs(S, here(who), c => c === a, 4000); if (!path) continue; at.delete(here(who)); who.idle = 0; S.claim[i] = who.id; who.job = { dig: i, at: a, p: 0 }; who.path = path; }
  }
  function soldier(S, m) {
    if (m.cd > 0) m.cd -= DT;
    const adj = S.foes.find(f => Math.abs(f.x - m.x) + Math.abs(f.y - m.y) <= 1);
    if (adj) { if (m.cd <= 0) { adj.hp -= 4 + S.hero.stage * 1.5; m.cd = 0.5; m.hit = S.t; S.fx.push({ k: 'hit', x: adj.x, y: adj.y, t: S.t }); } return; }
    if (stepMove(S, m, K.speed.s * (S.hero.main === 'nebula' ? 1.25 : 1))) return;
    if (S.foes.length) { const p = bfs(S, here(m), i => S.foes.some(f => Math.abs(f.x - i % W) + Math.abs(f.y - Math.floor(i / W)) <= 1), 5000); if (p) { m.path = p.slice(0, 4); return; } }
    const post = S.entrance && m.id % 2 ? { x: S.entrance.x, y: SKY + 4 } : S.hero; if (Math.abs(m.x - post.x) + Math.abs(m.y - post.y) > 5) { const p = bfs(S, here(m), i => Math.abs(i % W - post.x) + Math.abs(Math.floor(i / W) - post.y) <= 3, 5000); if (p) { m.path = p; return; } }
    if (S.r() < 0.25) { const [dx, dy] = N4[Math.floor(S.r() * 4)], n = idx(m.x + dx, m.y + dy); if (inb(m.x + dx, m.y + dy) && S.g[n] === T.AIR) m.path = [n]; }
  }
  function foeStep(S, f) {
    if (f.cd > 0) f.cd -= DT; const h = S.hero, weak = h.main === 'dusk' ? 0.65 : 1;
    const k = S.kin.find(m => Math.abs(m.x - f.x) + Math.abs(m.y - f.y) <= 1);
    if (k) { if (f.cd <= 0) { k.hp -= f.dmg * weak; f.cd = 0.6; S.fx.push({ k: 'hit', x: k.x, y: k.y, t: S.t }); } return; }
    if (Math.abs(f.x - h.x) <= 3 && Math.abs(f.y - h.y) <= 2) { if (f.cd <= 0) { h.hp -= f.dmg * weak; f.cd = 0.6; h.hurt = S.t; } return; }
    if (stepMove(S, f, K.speed.f)) return;
    const p = bfs(S, here(f), i => Math.abs(i % W - h.x) <= 2 && Math.abs(Math.floor(i / W) - h.y) <= 1, 8000); if (p) f.path = p.slice(0, 6);
  }

  function tick(S) {
    if (S.over || S.molt) return; S.t += DT; const h = S.hero;
    // 본체: 먹고, 낳고, 물고, 허물을 벗는다
    if (h.stage < 4 && h.eaten >= K.molt[h.stage]) { const pool = h.stage === 0 ? ASPECTS.slice() : ASPECTS.filter(a => a !== h.main), ch = []; while (ch.length < 3 && pool.length) ch.push(pool.splice(Math.floor(S.r() * pool.length), 1)[0]); S.molt = { stage: h.stage + 1, choices: h.stage === 0 || h.stage === 1 ? ch : null }; if (!S.molt.choices) applyMolt(S, null); return; }
    h.budT -= DT; if (h.budT <= 0 && S.kin.length < kinCap(S)) { const w = count(S, 'w'), s = count(S, 's'), wantS = S.lean === 0 ? 0.12 : S.lean === 2 ? 0.5 : 0.3, kind = (w >= 2 && s < (w + s + 1) * wantS * (S.breach === 2 ? 1.4 : 1)) ? 's' : 'w'; if (h.bio >= costOf(S, kind)) { h.bio -= costOf(S, kind); spawnKin(S, kind); h.budT = K.bud; } }
    if (h.biteT > 0) h.biteT -= DT; const near = S.foes.filter(f => Math.abs(f.x - h.x) <= 3 && Math.abs(f.y - h.y) <= 2);
    if (near.length && h.biteT <= 0) { near[0].hp -= (5 + 4 * h.stage) * (h.main === 'hunger' ? 1.5 : 1); h.biteT = 0.5; h.bite = S.t; S.fx.push({ k: 'hit', x: near[0].x, y: near[0].y, t: S.t }); }
    if (!S.foes.length && h.hp < h.mhp) h.hp = Math.min(h.mhp, h.hp + 0.6 * DT);
    if (h.hp <= 0) { S.over = { t: S.t, why: '본체가 쓰러졌다' }; say(S, '본체가 쓰러졌다.'); return; }
    S.planT -= DT; if (S.planT <= 0) { S.planT = 1.2; director(S); } S.scanT -= DT; if (S.scanT <= 0) { S.scanT = 1.5; scan(S); }
    S.asgT = (S.asgT || 0) - DT; if (S.asgT <= 0) { S.asgT = 0.3; assign(S); }
    for (const m of S.kin) (m.kind === 'w' ? worker : soldier)(S, m);
    for (const f of S.foes) foeStep(S, f);
    const deadK = S.kin.filter(m => m.hp <= 0); if (deadK.length) { deadK.forEach(m => { if (m.job) S.claim[m.job.dig] = 0; if (m.fetch) m.fetch.by = 0; S.stats.lost++; S.fx.push({ k: 'die', x: m.x, y: m.y, t: S.t }); }); S.kin = S.kin.filter(m => m.hp > 0); }
    const deadF = S.foes.filter(f => f.hp <= 0); if (deadF.length) { deadF.forEach(f => { S.items.push({ x: f.x, y: f.y, v: K.corpse, by: 0 }); S.stats.slain++; S.fx.push({ k: 'die', x: f.x, y: f.y, t: S.t }); }); S.foes = S.foes.filter(f => f.hp > 0); }
    // 방이 다 파였는지
    S.chambers.forEach(c => { if (c.open === false && S.g[idx(c.x, c.y)] === T.AIR) { c.open = true; say(S, c.kind + '이(가) 생겼다.'.replace('이(가)', /[가-힣]$/.test(c.kind) && (c.kind.charCodeAt(c.kind.length - 1) - 0xAC00) % 28 ? '이' : '가')); } });
    // 밖이 뚫린 뒤: 땅 위의 것들이 들어온다
    if (S.breach === 2) { S.waveT -= DT; if (S.waveT <= 0) { S.wave++; S.waveT = K.wave; const n = Math.min(8, 2 + Math.floor(S.wave * 0.5)); for (let k = 0; k < n; k++) S.foes.push({ id: S.nextId++, x: Math.max(1, Math.min(W - 2, S.entrance.x - 2 - k)), y: SKY - 1, fx: S.entrance.x - 2 - k, fy: SKY - 1, mt: 1, path: [], hp: 7 + 1.5 * S.wave, mhp: 7 + 1.5 * S.wave, dmg: 2 + Math.floor(S.wave / 4), cd: 0 }); say(S, '땅 위에서 ' + n + '명이 굴로 내려온다.'); } }
    if (S.fx.length > 60) S.fx.splice(0, S.fx.length - 60);
  }
  function applyMolt(S, asp) { const h = S.hero, m = S.molt; if (!m) return; if (m.choices) { if (!m.choices.includes(asp)) return; if (m.stage === 1) h.main = asp; else h.sub = asp; } h.stage = m.stage; h.mhp = Math.round(60 * (1 + h.stage * 0.8) * (h.main === 'abyss' ? 1.6 : 1)); h.hp = h.mhp; S.molt = null; S.fx.push({ k: 'molt', x: h.x, y: h.y, t: S.t });
    // 허물을 벗으며 방이 터져 넓어진다
    { const rx = 4.4 + h.stage * 0.9, ry = 3 + h.stage * 0.7; for (let y = Math.floor(h.y - ry - 1); y <= h.y + 2; y++) for (let x = Math.floor(h.x - rx); x <= h.x + rx; x++) { if (!inb(x, y) || y <= SKY + 2) continue; const dx = (x - h.x) / rx, dy = (y - h.y + 0.5) / (y > h.y ? 3 : ry + 1), i = idx(x, y); if (dx * dx + dy * dy <= 1 && solid(S.g[i]) && S.g[i] !== T.BED) { setTile(S, i, T.AIR); S.want[i] = 0; S.claim[i] = 0; S.dug++; } } }
    say(S, '허물을 벗었다: ' + STAGE[h.stage] + (asp ? ' (' + ASP[asp] + ')' : '')); }
  function mark(S, x, y) { if (!inb(x, y) || y <= SKY + 1 || S.g[idx(x, y)] === T.BED) return false; if (S.marks.length >= 3) S.marks.shift(); S.marks.push({ x, y }); return true; }
  function openUp(S) { if (!ready(S)) return false; S.breach = 1; say(S, '위로. 땅 위까지 굴을 뚫는다.'); return true; }
  return { W, H, SKY, DT, T, K, ASPECTS, ASP, GIFT, STAGE, newWorld, tick, applyMolt, mark, openUp, ready, kinCap, count, costOf, idx };
})();
if (typeof module !== 'undefined') module.exports = BURROW;
