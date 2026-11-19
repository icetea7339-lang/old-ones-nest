// 옛 것의 둥지 — 새 판 시험 "땅속 한 칸". 시간이 흐르는 둥지.
// 본체는 땅속 한 칸에서 시작한다. 권속은 본체의 몸에서 돋아나 걸어 다닌다.
// 방을 지으면 그 방에 맞는 권속이 돋는다. 권속은 제 방에서 살며 제 일을 한다. 허물을 벗을 때 고른 징조가 새 방을 연다.
// 플레이어가 정하는 것: 어떤 방을 지을지, 부름(여기를 파라), 허물의 방향, 밖으로 뚫을 때.
// 이 파일은 화면 없이 돈다(node 로 시험). 화면은 view.js.
const BURROW = (function () {
  const W = 64, H = 100, SKY = 10, DT = 0.1;
  const T = { AIR: 0, SOIL: 1, ROCK: 2, BED: 3, FOOD: 4, GEM: 5, SKY: 6, GRASS: 7 };
  const ASPECTS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'], ASP = { abyss: '심연', nebula: '성운', brood: '번식', dusk: '황혼', hunger: '기아' };
  // 권속: 값(살), 체력, 하는 일
  const KIN = {
    w: { name: '일움', cost: 10, hp: 6, text: '굴을 파고 먹이를 물어 온다' },
    s: { name: '이빨움', cost: 16, hp: 20, text: '들어온 것을 문다' },
    h: { name: '젖움', cost: 16, hp: 12, text: '다친 권속과 본체를 핥아 낫게 한다' },
    e: { name: '눈움', cost: 18, hp: 8, text: '멀리서 쏜다. 묻힌 먹이를 멀리서도 알아본다' },
    g: { name: '알움', cost: 22, hp: 10, text: '방에 들어앉아 일움을 낳는다. 살이 들지 않는다' },
    p: { name: '속삭움', cost: 18, hp: 8, text: '방에서 의식을 치러 허물을 앞당긴다. 굴에 든 것을 홀려 제 발로 먹히게 한다' },
    b: { name: '큰입움', cost: 30, hp: 40, text: '느리지만 세다. 쓰러진 것을 그 자리에서 먹는다' },
  };
  // 방: 그 방이 있어야 그 권속이 돋는다. 방 하나가 몇을 품는지
  const ROOM = {
    w: { name: '움터', kin: 'w', cap: 3, cost: 12 }, s: { name: '송곳니 굴', kin: 's', cap: 4, cost: 20 },
    abyss: { name: '젖은 굴', kin: 'h', cap: 3, cost: 30, asp: 'abyss' }, nebula: { name: '눈구멍', kin: 'e', cap: 3, cost: 30, asp: 'nebula' }, brood: { name: '알방', kin: 'g', cap: 2, cost: 30, asp: 'brood' },
    dusk: { name: '속삭임 굴', kin: 'p', cap: 3, cost: 30, asp: 'dusk' }, hunger: { name: '되새김 굴', kin: 'b', cap: 2, cost: 30, asp: 'hunger' },
  };
  const K = { food: 4, gem: 15, corpse: 8, bud: 3.5, molt: [40, 140, 360, 800], digT: { 1: 0.9, 7: 0.9, 2: 3.5, 4: 1.0, 5: 1.4 }, speed: { w: 4, s: 3.8, h: 3.4, e: 3.4, g: 2, p: 3.2, b: 2.6, f: 2.6 }, wave: 45, ready: 160, core: 4, lay: 22, rite: 0.12 };
  const STAGE = ['한 방울', '첫 허물', '두 번째 허물', '세 번째 허물', '성체'];
  function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const idx = (x, y) => y * W + x, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function newWorld(seed) {
    const r = rngOf(seed), g = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[idx(x, y)] = y < SKY ? T.SKY : y === SKY ? T.GRASS : (x === 0 || x === W - 1 || y === H - 1) ? T.BED : T.SOIL;
    const blob = (cx, cy, rx, ry, t) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { if (!inb(x, y) || y <= SKY + 1) continue; const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1 && g[idx(x, y)] === T.SOIL) g[idx(x, y)] = t; } };
    const hx = 32, hy = 80;
    for (let k = 0; k < 26; k++) { const cx = 3 + r() * (W - 6), cy = SKY + 8 + r() * (H - SKY - 12); if (Math.hypot(cx - hx, cy - hy) < 14) continue; blob(cx, cy, 2 + r() * 4, 1.5 + r() * 2.5, T.ROCK); }
    for (let k = 0; k < 44; k++) { const cx = 3 + r() * (W - 6), cy = SKY + 5 + r() * (H - SKY - 9); if (Math.hypot(cx - hx, cy - hy) < 5) continue; blob(cx, cy, 0.6 + r() * 0.8, 0.5 + r() * 0.6, T.FOOD); }
    [[-8, -2], [7, 3], [3, -8], [-5, 7]].forEach(([dx, dy]) => blob(hx + dx + r() * 2, hy + dy + r() * 2, 1.4, 1, T.FOOD));
    for (let k = 0; k < 14; k++) { const x = 3 + Math.floor(r() * (W - 6)), y = SKY + 20 + Math.floor(r() * (H - SKY - 24)); if (g[idx(x, y)] === T.SOIL) g[idx(x, y)] = T.GEM; }
    for (let y = hy - 3; y <= hy + 2; y++) for (let x = hx - 4; x <= hx + 4; x++) { const dx = (x - hx) / 4.4, dy = (y - hy + 0.5) / 3; if (dx * dx + dy * dy <= 1) g[idx(x, y)] = T.AIR; }
    const S = { seed: seed >>> 0, t: 0, g, want: new Uint8Array(W * H), claim: new Int32Array(W * H), seen: new Uint8Array(W * H), dirty: [], r,
      hero: { x: hx, y: hy, stage: 0, main: null, sub: null, bio: 20, eaten: 0, hp: 60, mhp: 60, budT: 1, biteT: 0 },
      kin: [], foes: [], items: [], chambers: [{ x: hx, y: hy, rx: 4, ry: 3, kind: 'core', open: true }], ends: [], marks: [], log: [], fx: [],
      breach: 0, entrance: null, wave: 0, waveT: 0, nextId: 1, molt: null, over: null, dug: 0, planT: 0, scanT: 0, stats: { born: 0, lost: 0, slain: 0, food: 0, charmed: 0, laid: 0 } };
    say(S, '땅속 한 칸. 몸이 근질거린다.');
    return S;
  }
  function say(S, s) { S.log.unshift({ t: S.t, s }); if (S.log.length > 30) S.log.length = 30; }
  const josa = (w, a, b) => w + ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? a : b);
  const solid = t => t !== T.AIR && t !== T.SKY;
  const diggable = (S, t) => t === T.SOIL || t === T.ROCK || t === T.FOOD || t === T.GEM || (t === T.GRASS && S.breach >= 1);
  const count = (S, k) => { let n = 0; for (const m of S.kin) if (m.kind === k) n++; return n; };
  const rooms = (S, key, any) => S.chambers.filter(c => c.kind === key && (any || c.open)).length;
  const unlocked = S => ['w', 's'].concat(S.hero.main ? [S.hero.main] : []).concat(S.hero.sub ? [S.hero.sub] : []);
  const roomOfKin = k => Object.keys(ROOM).find(r => ROOM[r].kin === k);
  // 그 권속을 몇까지 거느릴 수 있나: 방마다 품는 수. 일움은 본체 방이 넷을 품고, 알움 하나가 둘을 더 품는다
  const capOf = (S, k) => (k === 'w' ? K.core + 2 * count(S, 'g') : 0) + ROOM[roomOfKin(k)].cap * rooms(S, roomOfKin(k));
  const costOf = (S, k) => Math.round(KIN[k].cost * (S.hero.main === 'brood' || S.hero.sub === 'brood' ? 0.85 : 1));
  const ready = S => S.breach === 0 && S.hero.stage >= 1 && S.dug >= K.ready;

  const prev = new Int32Array(W * H), que = new Int32Array(W * H);
  function bfs(S, from, goal, limit) {
    prev.fill(-2); let qh = 0, qt = 0; que[qt++] = from; prev[from] = -1; const lim = limit || 4000;
    while (qh < qt && qh < lim) { const c = que[qh++]; if (goal(c)) { const p = []; for (let k = c; k !== from; k = prev[k]) p.push(k); return p.reverse(); } const cx = c % W, cy = (c - cx) / W; for (const [dx, dy] of N4) { const nx = cx + dx, ny = cy + dy; if (!inb(nx, ny)) continue; const n = idx(nx, ny); if (prev[n] !== -2) continue; const t = S.g[n]; if (t !== T.AIR && !(t === T.SKY && ny === SKY - 1)) continue; prev[n] = c; que[qt++] = n; } }
    return null;
  }
  function setTile(S, i, t) { S.g[i] = t; S.dirty.push(i); }

  // ---- 둥지의 본능: 굴은 권속들이 알아서 낸다. 방은 본체가 정한다 ----
  function wantLine(S, ax, ay, bx, by, wide) {
    let x = ax, y = ay, n = 0; const out = [];
    while ((x !== bx || y !== by) && n++ < 90) { const dx = bx - x, dy = by - y; if (S.r() < 0.16 && n > 1) { if (S.r() < 0.5) { if (x > 2 && x < W - 3) x += S.r() < 0.5 ? 1 : -1; } else if (y > SKY + 2 && y < H - 3) y += S.r() < 0.5 ? 1 : -1; } else if (Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && S.r() < 0.5)) x += Math.sign(dx); else y += Math.sign(dy); out.push([x, y]); if (wide && S.r() < 0.4) out.push([x, y + 1]); }
    let m = 0; out.forEach(([px, py]) => { if (!inb(px, py)) return; const i = idx(px, py); if (diggable(S, S.g[i]) && !S.want[i]) { S.want[i] = 1; m++; } }); return m;
  }
  const inRoom = (c, x, y) => { const dx = (x - c.x) / (c.rx + 0.3), dy = (y - c.y) / (c.ry + 0.3); return dx * dx + dy * dy <= 1; };
  function wantRoom(S, cx, cy, rx, ry, kind) { const c = { x: cx, y: cy, rx, ry, kind, open: false }; for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) { if (!inb(x, y) || y <= SKY + 2) continue; const i = idx(x, y); if (inRoom(c, x, y) && diggable(S, S.g[i])) S.want[i] = 1; } S.chambers.push(c); return c; }
  function nearestAir(S, x, y) { let best = -1, bd = 1e9; for (let i = 0; i < W * H; i++) if (S.g[i] === T.AIR) { const d = Math.abs(i % W - x) + Math.abs(Math.floor(i / W) - y); if (d < bd) { bd = d; best = i; } } return best; }
  // 방 자리: 이미 있는 방 둘레에서, 온통 흙인 곳 가운데 본체에 가장 가까운 곳
  function siteFor(S, rx, ry, near) {
    let best = null, bd = 1e9; const src = near ? [near] : S.chambers;
    for (const c of src) for (let a = 0; a < 16; a++) for (const dist of near ? [0, 2, 4] : [7, 9, 11, 14, 18, 23]) { const ang = a * Math.PI / 8, cx = Math.round(c.x + Math.cos(ang) * dist), cy = Math.round(c.y + Math.sin(ang) * dist * 0.75); if (cx - rx < 2 || cx + rx > W - 3 || cy - ry < SKY + 5 || cy + ry > H - 3) continue;
      let ok = !S.chambers.some(q => Math.abs(cx - q.x) < rx + q.rx + 2 && Math.abs(cy - q.y) < ry + q.ry + 2), air = 0; for (let y = cy - ry; y <= cy + ry && ok; y++) for (let x = cx - rx; x <= cx + rx; x++) { const t = S.g[idx(x, y)]; if (t === T.BED || t === T.ROCK) { ok = false; break; } if (t === T.AIR) air++; } if (air > 12) ok = false;
      if (!ok) continue; const d = Math.abs(cx - S.hero.x) + Math.abs(cy - S.hero.y) * 1.3 + (near ? Math.hypot(cx - near.x, cy - near.y) * 3 : 0); if (d < bd) { bd = d; best = { x: cx, y: cy }; } }
    return best;
  }
  // 방을 짓는다. near 를 주면 그 언저리에(부른 자리), 아니면 권속들이 자리를 잡는다
  function buildRoom(S, key, near) {
    const R = ROOM[key]; if (!R || !unlocked(S).includes(key)) return { ok: false, msg: '아직 지을 수 없는 방이다' };
    if (S.chambers.filter(c => !c.open).length >= 2) return { ok: false, msg: '파는 중인 방이 둘이다. 하나가 끝나면' };
    if (S.hero.bio < R.cost) return { ok: false, msg: '살이 모자란다 (' + R.cost + ')' };
    const rx = 3, ry = 2, at = siteFor(S, rx, ry, near || null) || (near ? siteFor(S, rx, ry, null) : null); if (!at) return { ok: false, msg: '방을 낼 자리가 없다' };
    S.hero.bio -= R.cost; const a = nearestAir(S, at.x, at.y); wantLine(S, a % W, Math.floor(a / W), at.x, at.y, false); wantRoom(S, at.x, at.y, rx, ry, key); say(S, josa(R.name, '을', '를') + ' 판다.'); return { ok: true, at };
  }
  function director(S) {
    const workers = count(S, 'w'); let open = 0; for (let i = 0; i < W * H; i++) if (S.want[i]) open++;
    if (S.dug !== S.lastDug) { S.lastDug = S.dug; S.stuckT = S.t; } else if (open && S.t - (S.stuckT || 0) > 25) { for (let i = 0; i < W * H; i++) if (S.want[i]) { const x = i % W, y = (i - x) / W; if (!S.chambers.some(c => !c.open && inRoom(c, x, y))) S.want[i] = 0; } S.claim.fill(0); S.kin.forEach(m => { m.job = null; }); S.chambers.filter(c => !c.open).forEach(c => { const a = nearestAir(S, c.x, c.y); wantLine(S, a % W, Math.floor(a / W), c.x, c.y, false); }); S.stuckT = S.t; return; }
    if (S.breach === 1) { let top = -1; for (let i = 0; i < W * H && top < 0; i++) if (S.g[i] === T.AIR) top = i; if (top >= 0) { const tx = top % W, ty = Math.floor(top / W); for (let y = ty - 1; y >= SKY; y--) { const i = idx(tx, y); if (!diggable(S, S.g[i])) continue; if (!S.want[i]) S.want[i] = 1; else open--; } } }
    if (open > workers * 4 + 6) return;
    if (S.marks.length) { const mk = S.marks.shift(), a = nearestAir(S, mk.x, mk.y); if (a >= 0) { wantLine(S, a % W, Math.floor(a / W), mk.x, mk.y, false); S.ends.push({ x: mk.x, y: mk.y }); say(S, '부름을 들었다. 그쪽으로 판다.'); } return; }
    let best = -1, bd = 1e9; for (let i = 0; i < W * H; i++) if (S.seen[i] && !S.want[i] && (S.g[i] === T.FOOD || S.g[i] === T.GEM)) { const d = Math.abs(i % W - S.hero.x) + Math.abs(Math.floor(i / W) - S.hero.y); if (d < bd) { bd = d; best = i; } }
    if (best >= 0) { const bx = best % W, by = Math.floor(best / W), a = nearestAir(S, bx, by); wantLine(S, a % W, Math.floor(a / W), bx, by, false); S.want[best] = 1; return; }
    // 먹이가 안 보이면 더듬어 나간다
    const nodes = S.chambers.filter(c => c.open).concat(S.ends.slice(-6)), nd = nodes[Math.floor(S.r() * nodes.length)], DIRS = [[1, 0, 3], [-1, 0, 3], [1, -1, 2], [-1, -1, 2], [1, 1, 2], [-1, 1, 2], [0, -1, 1.5], [0, 1, 1.5]];
    let tot = DIRS.reduce((a, d) => a + d[2], 0), pick = S.r() * tot, d = DIRS[0]; for (const q of DIRS) { if (pick < q[2]) { d = q; break; } pick -= q[2]; }
    const len = 5 + Math.floor(S.r() * 7), ex = Math.max(3, Math.min(W - 4, nd.x + d[0] * len)), ey = Math.max(SKY + 5, Math.min(H - 4, nd.y + d[1] * len));
    if (S.g[idx(ex, ey)] === T.AIR) return; let near = 0; for (let y = ey - 2; y <= ey + 2; y++) for (let x = ex - 3; x <= ex + 3; x++) if (inb(x, y) && (S.g[idx(x, y)] === T.AIR || S.want[idx(x, y)])) near++; if (near > 4) return;
    const a = nearestAir(S, nd.x, nd.y); wantLine(S, a % W, Math.floor(a / W), ex, ey, S.r() < 0.3); S.ends.push({ x: ex, y: ey });
  }
  function scan(S) { const far = count(S, 'e') ? 6 : 3; for (let i = 0; i < W * H; i++) { const t = S.g[i]; if ((t !== T.FOOD && t !== T.GEM) || S.seen[i]) continue; const x = i % W, y = Math.floor(i / W); let near = false; for (let dy = -far; dy <= far && !near; dy++) for (let dx = -far; dx <= far; dx++) if (inb(x + dx, y + dy) && S.g[idx(x + dx, y + dy)] === T.AIR) { near = true; break; } if (near) { S.seen[i] = 1; S.dirty.push(i); } } }

  // ---- 움직이는 것들 ----
  function homeOf(S, kind) { const key = roomOfKin(kind), cs = S.chambers.filter(c => c.open && c.kind === key); if (!cs.length) return S.chambers[0]; let best = cs[0], bn = 1e9; for (const c of cs) { const n = S.kin.filter(m => m.home === c).length; if (n < bn) { bn = n; best = c; } } return best; }
  function spawnKin(S, kind, at) { const h = S.hero, st = h.stage, p = at || h, m = { id: S.nextId++, kind, x: p.x, y: p.y, fx: p.x, fy: p.y, mt: 1, path: [], job: null, carry: 0, hp: 0, cd: 0, t0: S.r() * 20, home: homeOf(S, kind) }; m.mhp = KIN[kind].hp + (kind === 'w' || kind === 'g' ? 0 : st * (kind === 'b' ? 10 : 4)); m.hp = m.mhp; S.kin.push(m); S.stats.born++; S.fx.push({ k: 'bud', x: p.x, y: p.y, t: S.t }); return m; }
  function stepMove(S, e, speed) { if (e.mt < 1) { e.mt = Math.min(1, e.mt + speed * DT); return true; } if (!e.path || !e.path.length) return false; const n = e.path.shift(); if (solid(S.g[n])) { e.path = []; return false; } e.fx = e.x; e.fy = e.y; e.x = n % W; e.y = Math.floor(n / W); e.mt = Math.min(1, speed * DT); return true; }
  const here = e => idx(e.x, e.y), nearHero = (S, i) => Math.abs(i % W - S.hero.x) <= 2 && Math.abs(Math.floor(i / W) - S.hero.y) <= 2, dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const speedOf = (S, k) => K.speed[k] * (S.hero.main === 'nebula' || S.hero.sub === 'nebula' ? 1.15 : 1);
  const enemies = S => S.foes.filter(f => !f.charm);
  function goTo(S, m, tx, ty, r) { const p = bfs(S, here(m), i => Math.abs(i % W - tx) + Math.abs(Math.floor(i / W) - ty) <= (r || 0), 5000); if (p) m.path = p; return !!p; }
  // 할 일이 없으면 제 방으로 돌아가 어슬렁거린다
  function loiter(S, m) { const c = m.home || S.chambers[0]; if (dist(m, c) > c.rx + 1) { if (S.r() < 0.3) goTo(S, m, c.x, c.y, 1); return; } if (S.r() < 0.1) { const [dx, dy] = N4[Math.floor(S.r() * 4)], n = idx(m.x + dx, m.y + dy); if (inb(m.x + dx, m.y + dy) && S.g[n] === T.AIR) m.path = [n]; } }
  function worker(S, m) {
    if (stepMove(S, m, speedOf(S, 'w'))) return;
    const foe = enemies(S).find(f => dist(f, m) <= 3);
    if (foe && !m.flee) { m.flee = 1; if (m.job) { S.claim[m.job.dig] = 0; m.job = null; } goTo(S, m, S.hero.x, S.hero.y, 2); return; } if (!foe) m.flee = 0;
    if (m.carry) { if (nearHero(S, here(m))) { const v = m.carry * (S.hero.main === 'hunger' || S.hero.sub === 'hunger' ? 1.25 : 1); S.hero.bio += v; S.hero.eaten += v; S.stats.food += v; m.carry = 0; m.idle = 1; S.fx.push({ k: 'eat', x: S.hero.x, y: S.hero.y, t: S.t }); return; } if (!goTo(S, m, S.hero.x, S.hero.y, 2)) m.carry = 0; return; }
    if (m.job) { const j = m.job; if (!S.want[j.dig] || !solid(S.g[j.dig])) { S.claim[j.dig] = 0; m.job = null; return; } if (here(m) !== j.at) { const p = bfs(S, here(m), i => i === j.at, 6000); if (p) m.path = p; else { S.claim[j.dig] = 0; m.job = null; } return; }
      j.p += DT / (K.digT[S.g[j.dig]] || 0.9); m.dig = S.t; if (j.p >= 1) { const t = S.g[j.dig]; setTile(S, j.dig, T.AIR); S.want[j.dig] = 0; S.claim[j.dig] = 0; S.dug++; S.fx.push({ k: 'dig', x: j.dig % W, y: Math.floor(j.dig / W), t: S.t }); if (t === T.FOOD) m.carry = K.food; if (t === T.GEM) { m.carry = K.gem; say(S, '굳은 별 조각을 캤다.'); } if (t === T.GRASS && S.breach === 1) { S.breach = 2; S.entrance = { x: j.dig % W, y: SKY }; S.waveT = 16; say(S, '바깥 공기가 쏟아져 들어온다. 굴이 땅 위로 뚫렸다.'); } m.job = null; if (!m.carry) m.idle = 1; } return; }
    const it = S.items.find(o => !o.by); if (it && !m.fetch) { const p = bfs(S, here(m), i => i === idx(it.x, it.y), 6000); if (p) { it.by = m.id; m.path = p; m.fetch = it; return; } }
    if (m.fetch) { const o = m.fetch; m.fetch = null; if (S.items.includes(o) && o.x === m.x && o.y === m.y) { m.carry = o.v; S.items = S.items.filter(q => q !== o); return; } o.by = 0; }
    m.idle = 1; loiter(S, m);
  }
  function assign(S) {
    const at = new Map(); let n = 0; for (const m of S.kin) if (m.kind === 'w' && m.idle && !m.job && !m.carry && !m.flee && !m.fetch) { if (!at.has(here(m))) at.set(here(m), m); n++; } if (!n) return;
    // 방 파는 일이 먼저다. 그다음 위에서부터
    let done = 0; const tryTile = i => { if (!S.want[i] || S.claim[i] || !diggable(S, S.g[i])) return; const x = i % W, y = (i - x) / W; let a = -1; for (const [dx, dy] of N4) if (inb(x + dx, y + dy) && S.g[idx(x + dx, y + dy)] === T.AIR) { a = idx(x + dx, y + dy); break; } if (a < 0) return; done++;
      let who = at.get(a) || null; if (!who) { const p = bfs(S, a, c => at.has(c), 2500); if (!p) return; who = at.get(p[p.length - 1]); }
      const path = here(who) === a ? [] : bfs(S, here(who), c => c === a, 4000); if (!path) return; at.delete(here(who)); who.idle = 0; S.claim[i] = who.id; who.job = { dig: i, at: a, p: 0 }; who.path = path; };
    if (S.breach === 1) for (let i = 0; i < W * H && done < 3 && at.size; i++) tryTile(i);
    for (const c of S.chambers) { if (c.open) continue; for (let y = c.y - c.ry; y <= c.y + c.ry; y++) for (let x = c.x - c.rx; x <= c.x + c.rx; x++) if (at.size && inb(x, y)) tryTile(idx(x, y)); }
    for (let i = 0; i < W * H && done < 60 && at.size; i++) tryTile(i);
  }
  function hit(S, f, d, by) { f.hp -= d; S.fx.push({ k: by && by.kind === 'e' ? 'beam' : 'hit', x: f.x, y: f.y, t: S.t, ax: by ? by.x : f.x, ay: by ? by.y : f.y }); }
  function fighter(S, m) {   // 이빨움, 큰입움: 다가가서 문다
    if (m.cd > 0) m.cd -= DT; const big = m.kind === 'b', es = enemies(S), adj = es.find(f => dist(f, m) <= 1);
    if (adj) { if (m.cd <= 0) { hit(S, adj, (big ? 9 : 4) + S.hero.stage * (big ? 3 : 1.5), m); m.cd = big ? 0.8 : 0.5; } return; }
    if (big) { const it = S.items.find(o => dist(o, m) <= 1); if (it) { const v = it.v * 0.9; S.hero.bio += v; S.hero.eaten += v; S.stats.food += v; S.items = S.items.filter(q => q !== it); S.fx.push({ k: 'eat', x: m.x, y: m.y, t: S.t }); return; } }
    if (stepMove(S, m, speedOf(S, m.kind))) return;
    if (es.length) { const p = bfs(S, here(m), i => es.some(f => Math.abs(f.x - i % W) + Math.abs(f.y - Math.floor(i / W)) <= 1), 5000); if (p) { m.path = p.slice(0, 4); return; } }
    if (big && S.items.length) { const o = S.items[0]; if (goTo(S, m, o.x, o.y, 1)) return; }
    loiter(S, m);
  }
  function seer(S, m) {      // 눈움: 떨어져서 쏜다
    if (m.cd > 0) m.cd -= DT; const es = enemies(S), tgt = es.find(f => dist(f, m) <= 5);
    if (tgt) { if (m.cd <= 0) { hit(S, tgt, 3 + S.hero.stage, m); m.cd = 0.8; } return; }
    if (stepMove(S, m, speedOf(S, 'e'))) return;
    if (es.length) { const p = bfs(S, here(m), i => es.some(f => Math.abs(f.x - i % W) + Math.abs(f.y - Math.floor(i / W)) <= 4), 5000); if (p) { m.path = p.slice(0, 3); return; } }
    loiter(S, m);
  }
  function healer(S, m) {    // 젖움: 가까운 다친 것을 핥는다
    if (m.cd > 0) m.cd -= DT; const hurt = S.kin.filter(k => k.hp < k.mhp && k !== m).sort((a, b) => dist(a, m) - dist(b, m))[0], h = S.hero;
    if (hurt && dist(hurt, m) <= 2) { if (m.cd <= 0) { hurt.hp = Math.min(hurt.mhp, hurt.hp + 5); m.cd = 0.6; S.fx.push({ k: 'heal', x: hurt.x, y: hurt.y, t: S.t }); } return; }
    if (h.hp < h.mhp && Math.abs(m.x - h.x) <= 4 && Math.abs(m.y - h.y) <= 3) { if (m.cd <= 0) { h.hp = Math.min(h.mhp, h.hp + 2.5); m.cd = 0.8; S.fx.push({ k: 'heal', x: h.x, y: h.y, t: S.t }); } return; }
    if (stepMove(S, m, speedOf(S, 'h'))) return;
    if (hurt) { if (goTo(S, m, hurt.x, hurt.y, 1)) { m.path = m.path.slice(0, 5); return; } } else if (h.hp < h.mhp) { if (goTo(S, m, h.x, h.y, 3)) return; }
    loiter(S, m);
  }
  function layer(S, m) {     // 알움: 제 방에 앉아 일움을 낳는다
    if (stepMove(S, m, speedOf(S, 'g'))) return; const c = m.home; if (c && dist(m, c) > 1) { goTo(S, m, c.x, c.y, 1); return; }
    m.lay = (m.lay || K.lay * 0.6) - DT; if (m.lay <= 0) { m.lay = K.lay; if (count(S, 'w') < capOf(S, 'w')) { spawnKin(S, 'w', m); S.stats.laid++; } }
  }
  function preacher(S, m) {  // 속삭움: 제 방에서 의식을 치러 허물을 앞당긴다. 속삭임은 굴을 타고 울려, 굴에 든 것을 홀린다
    if (m.cd > 0) m.cd -= DT; const atHome = m.home && dist(m, m.home) <= m.home.rx + 1;
    if (atHome && m.cd <= 0) { const f = S.foes.find(q => !q.charm && !q.tried && q.y > SKY + 2); if (f) { f.tried = 1; m.cd = 9; m.sing = S.t; if (S.r() < 0.4) { f.charm = 1; f.path = []; S.stats.charmed++; S.fx.push({ k: 'charm', x: f.x, y: f.y, t: S.t }); } } }
    if (stepMove(S, m, speedOf(S, 'p'))) return;
    if (atHome && S.hero.stage < 4) { const v = K.rite * DT; S.hero.eaten += v; S.stats.rite = (S.stats.rite || 0) + v; m.rite = S.t; }
    loiter(S, m);
  }
  const ACT = { w: worker, s: fighter, b: fighter, e: seer, h: healer, g: layer, p: preacher };
  function foeStep(S, f) {
    const h = S.hero;
    if (f.charm) { if (Math.abs(f.x - h.x) <= 2 && Math.abs(f.y - h.y) <= 2) { f.hp = 0; f.eaten = 1; h.bio += K.corpse; h.eaten += K.corpse; S.stats.food += K.corpse; S.fx.push({ k: 'eat', x: h.x, y: h.y, t: S.t }); h.bite = S.t; return; } if (stepMove(S, f, K.speed.f)) return; const p = bfs(S, here(f), i => Math.abs(i % W - h.x) <= 2 && Math.abs(Math.floor(i / W) - h.y) <= 2, 8000); if (p) f.path = p.slice(0, 8); return; }
    if (f.cd > 0) f.cd -= DT; const weak = h.main === 'dusk' || h.sub === 'dusk' ? 0.75 : 1;
    const k = S.kin.find(m => dist(m, f) <= 1);
    if (k) { if (f.cd <= 0) { k.hp -= f.dmg * weak; f.cd = 0.6; S.fx.push({ k: 'hit', x: k.x, y: k.y, t: S.t }); } return; }
    if (Math.abs(f.x - h.x) <= 3 && Math.abs(f.y - h.y) <= 2) { if (f.cd <= 0) { h.hp -= f.dmg * weak; f.cd = 0.6; h.hurt = S.t; } return; }
    if (stepMove(S, f, K.speed.f)) return;
    const p = bfs(S, here(f), i => Math.abs(i % W - h.x) <= 2 && Math.abs(Math.floor(i / W) - h.y) <= 1, 8000); if (p) f.path = p.slice(0, 6);
  }

  function tick(S) {
    if (S.over || S.molt) return; S.t += DT; const h = S.hero;
    if (h.stage < 4 && h.eaten >= K.molt[h.stage]) { const pool = h.stage === 0 ? ASPECTS.slice() : ASPECTS.filter(a => a !== h.main), ch = []; while (ch.length < 3 && pool.length) ch.push(pool.splice(Math.floor(S.r() * pool.length), 1)[0]); S.molt = { stage: h.stage + 1, choices: h.stage <= 1 ? ch : null }; if (!S.molt.choices) applyMolt(S, null); return; }
    // 본체: 품을 수 있는 권속 가운데 가장 덜 찬 것부터 돋운다
    h.budT -= DT; if (h.budT <= 0) { let pick = null, pr = 2; for (const k in KIN) { const cap = capOf(S, k); if (!cap) continue; const n = count(S, k); if (n >= cap) continue; const fill = k === 'w' && n < 3 ? -1 : n / cap; if (fill < pr) { pr = fill; pick = k; } } if (pick && h.bio >= costOf(S, pick)) { h.bio -= costOf(S, pick); spawnKin(S, pick); h.budT = K.bud; } else if (count(S, 'w') < 2 && h.bio < costOf(S, 'w') && h.hp > 20) { h.hp -= 8; spawnKin(S, 'w'); h.budT = 9; say(S, '살이 없다. 제 살을 뜯어 일움을 돋운다.'); } else h.budT = 0.5; }
    if (h.biteT > 0) h.biteT -= DT; const near = enemies(S).filter(f => Math.abs(f.x - h.x) <= 3 && Math.abs(f.y - h.y) <= 2);
    if (near.length && h.biteT <= 0) { hit(S, near[0], (5 + 4 * h.stage) * (h.main === 'hunger' ? 1.5 : 1), null); h.biteT = 0.5; h.bite = S.t; }
    if (!near.length && h.hp < h.mhp) h.hp = Math.min(h.mhp, h.hp + 0.6 * DT);
    if (h.hp <= 0) { S.over = { t: S.t, why: '본체가 쓰러졌다' }; say(S, '본체가 쓰러졌다.'); return; }
    S.planT -= DT; if (S.planT <= 0) { S.planT = 1.2; director(S); } S.scanT -= DT; if (S.scanT <= 0) { S.scanT = 1.5; scan(S); }
    S.asgT = (S.asgT || 0) - DT; if (S.asgT <= 0) { S.asgT = 0.3; assign(S); }
    for (const m of S.kin.slice()) ACT[m.kind](S, m);
    for (const f of S.foes) foeStep(S, f);
    const deadK = S.kin.filter(m => m.hp <= 0); if (deadK.length) { deadK.forEach(m => { if (m.job) S.claim[m.job.dig] = 0; if (m.fetch) m.fetch.by = 0; S.stats.lost++; S.fx.push({ k: 'die', x: m.x, y: m.y, t: S.t }); }); S.kin = S.kin.filter(m => m.hp > 0); }
    const deadF = S.foes.filter(f => f.hp <= 0); if (deadF.length) { deadF.forEach(f => { if (!f.eaten) { S.items.push({ x: f.x, y: f.y, v: K.corpse, by: 0 }); S.stats.slain++; S.fx.push({ k: 'die', x: f.x, y: f.y, t: S.t }); } }); S.foes = S.foes.filter(f => f.hp > 0); }
    S.chambers.forEach(c => { if (!c.open && S.g[idx(c.x, c.y)] === T.AIR) { let left = 0; for (let y = c.y - c.ry; y <= c.y + c.ry; y++) for (let x = c.x - c.rx; x <= c.x + c.rx; x++) if (inb(x, y) && inRoom(c, x, y) && S.want[idx(x, y)]) left++; if (left <= 2) { c.open = true; const R = ROOM[c.kind]; say(S, josa(R.name, '이', '가') + ' 생겼다. ' + josa(KIN[R.kin].name, '이', '가') + ' 돋을 수 있다.'); } } });
    if (S.breach === 2) { S.waveT -= DT; if (S.waveT <= 0) { S.wave++; S.waveT = K.wave; const n = Math.min(7, 2 + Math.floor(S.wave * 0.4)); for (let k = 0; k < n; k++) { const fx0 = Math.max(1, Math.min(W - 2, S.entrance.x - 2 - k)); S.foes.push({ id: S.nextId++, x: fx0, y: SKY - 1, fx: fx0, fy: SKY - 1, mt: 1, path: [], hp: 7 + 1.2 * Math.min(20, S.wave), mhp: 7 + 1.2 * Math.min(20, S.wave), dmg: 2 + Math.floor(Math.min(20, S.wave) / 5), cd: 0 }); } say(S, '땅 위에서 ' + n + '명이 굴로 내려온다.'); } }
    if (S.fx.length > 80) S.fx.splice(0, S.fx.length - 80);
  }
  function applyMolt(S, asp) {
    const h = S.hero, m = S.molt; if (!m) return; if (m.choices) { if (!m.choices.includes(asp)) return; if (m.stage === 1) h.main = asp; else h.sub = asp; }
    h.stage = m.stage; h.mhp = Math.round(60 * (1 + h.stage * 0.8) * (h.main === 'abyss' ? 1.5 : 1)); h.hp = h.mhp; S.molt = null; S.fx.push({ k: 'molt', x: h.x, y: h.y, t: S.t });
    // 허물을 벗으며 방이 터져 넓어진다
    { const rx = 4.4 + h.stage * 0.9, ry = 3 + h.stage * 0.7; S.chambers[0].rx = Math.round(rx); S.chambers[0].ry = Math.round(ry); for (let y = Math.floor(h.y - ry - 1); y <= h.y + 2; y++) for (let x = Math.floor(h.x - rx); x <= h.x + rx; x++) { if (!inb(x, y) || y <= SKY + 2) continue; const dx = (x - h.x) / rx, dy = (y - h.y + 0.5) / (y > h.y ? 3 : ry + 1), i = idx(x, y); if (dx * dx + dy * dy <= 1 && solid(S.g[i]) && S.g[i] !== T.BED) { setTile(S, i, T.AIR); S.want[i] = 0; S.claim[i] = 0; S.dug++; } } }
    say(S, '허물을 벗었다: ' + STAGE[h.stage] + (asp ? '. ' + josa(ROOM[asp].name, '을', '를') + ' 지을 수 있다.' : ''));
  }
  function mark(S, x, y) { if (!inb(x, y) || y <= SKY + 1 || S.g[idx(x, y)] === T.BED) return false; if (S.marks.length >= 3) S.marks.shift(); S.marks.push({ x, y }); return true; }
  function openUp(S) { if (!ready(S)) return false; S.breach = 1; say(S, '위로. 땅 위까지 굴을 뚫는다.'); return true; }
  return { W, H, SKY, DT, T, K, KIN, ROOM, ASPECTS, ASP, STAGE, newWorld, tick, applyMolt, mark, openUp, buildRoom, ready, capOf, count, costOf, unlocked, rooms, roomOfKin, idx };
})();
if (typeof module !== 'undefined') module.exports = BURROW;
