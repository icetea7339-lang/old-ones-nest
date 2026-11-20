// ---------- 배경 음악 ----------
// 소리 파일 없이 WebAudio 로 그 자리에서 짓는다. 같은 곡도 돌 때마다 조금씩 다르다(씨앗이 다르다).
// 곡: title 아득함 · pro 흙 속의 한 방울 · day 낮의 둥지 · night 침입 · boss 우두머리 밤 · story 장면 · win/lose 짧은 끝맺음
// music(이름): 1.5초에 걸쳐 바꾼다. 같은 이름은 그대로 두고, null 이면 잦아든다. META.music 이 false 면 내지 않는다.
// 오디오는 사람이 처음 누를 때 깨어난다(브라우저 규칙). 그 전에 부른 곡은 기억해 두었다가 그때 튼다.
const MUS = { want: null, cur: null, live: null, armed: false, dead: false, vol: 0.8, timer: null, back: null, resume: null, seed: (Date.now() >>> 0) };
const musOn = () => !(typeof META !== 'undefined' && META && META.music === false);
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function musRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// 곡마다 같이 쓰는 것: 누르개(넘치지 않게), 울림(긴 동굴), 잡음 한 토막
function musBus(ctx) {
  if (ctx.__mbus) return ctx.__mbus;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 6; comp.ratio.value = 14; comp.attack.value = 0.004; comp.release.value = 0.3;
  const master = ctx.createGain(); master.gain.value = 0.45 * MUS.vol; master.connect(comp); comp.connect(ctx.destination);
  const rate = ctx.sampleRate, len = Math.floor(rate * 2.6), ir = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let s = 12345 + ch * 7777; for (let i = 0; i < len; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; d[i] = ((s / 4294967296) * 2 - 1) * Math.pow(1 - i / len, 3.2) * 0.5; } }
  const rev = ctx.createConvolver(); rev.normalize = true; rev.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.5; rev.connect(wet); wet.connect(master);
  const nl = rate * 2, nb = ctx.createBuffer(1, nl, rate), nd = nb.getChannelData(0); let s2 = 99; for (let i = 0; i < nl; i++) { s2 = (Math.imul(s2, 1664525) + 1013904223) >>> 0; nd[i] = (s2 / 4294967296) * 2 - 1; }
  return (ctx.__mbus = { comp, master, rev, noise: nb });
}

// 악기: 모두 (ctx, T, 시각, …). T 는 곡 하나의 출구(out, send)와 주사위(rng)
function musEnv(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function musWet(ctx, T, node, amt) { if (!amt) return; const s = ctx.createGain(); s.gain.value = amt; node.connect(s); s.connect(T.send); }
function musTone(ctx, T, type, f, t, a, peak, d, wet, det) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.setValueAtTime(det, t);
  musEnv(g, t, a, peak, d); o.connect(g); g.connect(T.out); musWet(ctx, T, g, wet); o.start(t); o.stop(t + a + d + 0.05); return o;
}
function musBell(ctx, T, m, t, peak, wet) { const f = mtof(m); musTone(ctx, T, 'sine', f, t, 0.004, peak, 3.2, wet); musTone(ctx, T, 'sine', f * 2.76, t, 0.003, peak * 0.35, 1.6, wet); musTone(ctx, T, 'sine', f * 5.4, t, 0.002, peak * 0.12, 0.7, wet); }
function musDrip(ctx, T, m, t, peak) { const o = ctx.createOscillator(), g = ctx.createGain(), f = mtof(m); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.9, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); musEnv(g, t, 0.003, peak, 0.22); o.connect(g); g.connect(T.out); musWet(ctx, T, g, 0.8); o.start(t); o.stop(t + 0.3); }
function musThump(ctx, T, t, peak, f0, f1) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0 || 110, t); o.frequency.exponentialRampToValueAtTime(f1 || 42, t + 0.16); musEnv(g, t, 0.004, peak, 0.34); o.connect(g); g.connect(T.out); musWet(ctx, T, g, 0.15); o.start(t); o.stop(t + 0.4); }
function musNoise(ctx, T, t, type, f, q, a, peak, d, wet, f2) {
  const B = musBus(ctx), n = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = B.noise; n.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d); fl.Q.value = q;
  musEnv(g, t, a, peak, d); n.connect(fl); fl.connect(g); g.connect(T.out); musWet(ctx, T, g, wet); const off = (T.rng() * 1.5); n.start(t, off); n.stop(t + a + d + 0.05);
}
// 겹소리: 셋 이상을 천천히 부풀렸다 놓는다. 걸러서 둥글게
function musPad(ctx, T, notes, t, a, peak, d, type, cut, wet) {
  const fl = ctx.createBiquadFilter(), g = ctx.createGain(); fl.type = 'lowpass'; fl.frequency.value = cut || 900; fl.Q.value = 0.7; musEnv(g, t, a, peak, d); fl.connect(g); g.connect(T.out); musWet(ctx, T, g, wet == null ? 0.8 : wet);
  notes.forEach((m, k) => { [-7, 7].forEach(det => { const o = ctx.createOscillator(); o.type = type || 'triangle'; o.frequency.value = mtof(m); o.detune.value = det + k * 2; o.connect(fl); o.start(t); o.stop(t + a + d + 0.1); }); });
}
// 무리의 노래: 톱니를 입 모양(두 띠)으로 거른다
function musChoir(ctx, T, notes, t, a, peak, d) {
  const g = ctx.createGain(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), mix = ctx.createGain(); f1.type = f2.type = 'bandpass'; f1.frequency.value = 650 + T.rng() * 150; f2.frequency.value = 1100 + T.rng() * 200; f1.Q.value = 5; f2.Q.value = 7; mix.gain.value = 1;
  mix.connect(f1); mix.connect(f2); f1.connect(g); f2.connect(g); musEnv(g, t, a, peak, d); g.connect(T.out); musWet(ctx, T, g, 0.9);
  notes.forEach(m => { [-9, 9].forEach(det => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; o.connect(mix); o.start(t); o.stop(t + a + d + 0.1); }); });
}
// 어긋난 덩어리가 부풀어 오른다 (밤)
function musSwell(ctx, T, notes, t, dur, peak) {
  const fl = ctx.createBiquadFilter(), g = ctx.createGain(); fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(260, t); fl.frequency.exponentialRampToValueAtTime(1900, t + dur * 0.9);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.92); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25); fl.connect(g); g.connect(T.out); musWet(ctx, T, g, 0.6);
  notes.forEach(m => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.connect(fl); o.start(t); o.stop(t + dur + 0.3); });
}
// 바닥에 깔리는 낮은 울림: 곡이 도는 동안 계속. 느린 흔들개가 거르개를 연다 닫는다
function musDrone(ctx, T, notes, type, cut, rate, peak) {
  const t = T.t0, fl = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(); fl.type = 'lowpass'; fl.frequency.value = cut; fl.Q.value = 1.2; lfo.frequency.value = rate; lg.gain.value = cut * 0.45; lfo.connect(lg); lg.connect(fl.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 2.5); fl.connect(g); g.connect(T.out); musWet(ctx, T, g, 0.35); lfo.start(t); T.hold.push(lfo);
  notes.forEach((m, k) => { [-5, 6].forEach(det => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = det + k; o.connect(fl); o.start(t); T.hold.push(o); }); });
}

// 곡: beat(k) 한 박의 길이, init 바닥 울림, step 박마다 무엇을 칠지
const PHRY = [0, 1, 3, 5, 7, 8, 10];
const scaleAt = (root, i) => root + PHRY[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
const MTRACK = {
  title: { beat: () => 0.5,
    init(c, T) { musDrone(c, T, [38, 45], 'sawtooth', 280, 0.045, 0.05); },
    step(c, T, t, k) {
      const r = T.rng; if (k % 16 === 0) { const ch = [[50, 53, 57], [49, 53, 56], [48, 51, 55], [50, 53, 58]][(k / 16 + T.off) % 4]; musPad(c, T, ch.map(m => m + (r() < 0.3 ? 12 : 0)), t, 3, 0.022, 5.5, 'triangle', 800); }
      if (r() < 0.06) musBell(c, T, scaleAt(74, Math.floor(r() * 9)), t, 0.03, 0.9);
      if (r() < 0.012) musNoise(c, T, t, 'bandpass', 900, 2.5, 1.5, 0.02, 2.5, 0.9, 2400);
    } },
  pro: { beat: () => 0.2,
    init(c, T) { musDrone(c, T, [41, 48], 'triangle', 420, 0.08, 0.035); },
    step(c, T, t, k) {
      const r = T.rng, ph = k % 8; if (ph === 0) musThump(c, T, t, 0.22, 90, 38); if (ph === 1) musThump(c, T, t, 0.12, 80, 36);
      if (r() < 0.16) musDrip(c, T, [84, 87, 89, 91, 94, 96][Math.floor(r() * 6)], t + r() * 0.1, 0.035);
      if (r() < 0.05) musTone(c, T, 'sine', mtof([72, 75, 77, 79, 82][Math.floor(r() * 5)]), t, 0.01, 0.025, 0.35, 0.5);
      if (k % 48 === 24 && r() < 0.6) musPad(c, T, [53, 60], t, 2, 0.015, 3, 'sine', 600);
    } },
  day: { beat: () => 0.5,
    init(c, T) { musDrone(c, T, [36, 43], 'sawtooth', 230, 0.03, 0.045); },
    step(c, T, t, k) {
      const r = T.rng; if (r() < 0.07) musBell(c, T, scaleAt(72, Math.floor(r() * 8)), t, 0.026, 0.85);
      if (r() < 0.045) musDrip(c, T, 86 + Math.floor(r() * 10), t, 0.025);
      if (k % 32 === 16) musPad(c, T, r() < 0.5 ? [48, 54, 63] : [48, 51, 55], t, 3, 0.016, 5, 'triangle', 700);
      if (r() < 0.007) musNoise(c, T, t, 'bandpass', 1200, 3, 1.2, 0.015, 2, 0.9, 2600);
    } },
  night: { beat: k => 60 / Math.min(124, 92 + k * 0.5),
    init(c, T) { musDrone(c, T, [38, 39], 'sawtooth', 380, 0.2, 0.04); },
    step(c, T, t, k) { musNight(c, T, t, k, false); } },
  boss: { beat: k => 60 / Math.min(140, 120 + k * 0.3),
    init(c, T) { musDrone(c, T, [26 + 12, 39, 45], 'sawtooth', 460, 0.35, 0.045); },
    step(c, T, t, k) { musNight(c, T, t, k, true); } },
  story: { beat: () => 1,
    init(c, T) { musDrone(c, T, [41, 48], 'triangle', 300, 0.05, 0.03); },
    step(c, T, t, k) {
      const r = T.rng; if (k % 6 === 0) { const ch = [[53, 57, 60], [52, 56, 59], [50, 53, 57], [49, 53, 56]][(k / 6 + T.off) % 4]; musChoir(c, T, ch, t, 2.5, 0.03, 4.5); }
      if (r() < 0.12) musNoise(c, T, t + r() * 0.5, 'bandpass', 700 + r() * 500, 4, 0.8, 0.018, 1.4, 0.9, 2200 + r() * 800);
      if (r() < 0.04) musBell(c, T, scaleAt(77, Math.floor(r() * 7)), t, 0.02, 0.95);
    } },
  win: { beat: () => 0.16, once: 30,
    init() {},
    step(c, T, t, k) {
      const up = [62, 66, 69, 73, 76, 78, 81]; if (k < up.length) musTone(c, T, 'triangle', mtof(up[k]), t, 0.01, 0.05, 0.9, 0.6);
      if (k === 7) { musPad(c, T, [50, 57, 62, 66, 69], t, 0.4, 0.05, 3.6, 'triangle', 1600); musBell(c, T, 86, t, 0.04, 0.9); }
      if (k === 14) musBell(c, T, 81, t, 0.025, 0.95);
    } },
  lose: { beat: () => 0.3, once: 18,
    init() {},
    step(c, T, t, k) {
      if (k === 0) { musThump(c, T, t, 0.35, 70, 28); musPad(c, T, [38, 39, 44], t, 0.2, 0.05, 4, 'sawtooth', 500, 0.5); }
      const dn = [74, 70, 67, 63, 62]; if (k >= 1 && k <= dn.length) musBell(c, T, dn[k - 1], t, 0.03, 0.85);
      if (k === 8) musNoise(c, T, t, 'bandpass', 900, 3, 1, 0.02, 2, 0.9, 400);
    } },
};
function musNight(c, T, t, k, boss) {
  const r = T.rng; musThump(c, T, t, boss ? 0.32 : 0.24, boss ? 120 : 100, 40);
  if (k % 2 === 0) { const o = [38, 39, 38, boss ? 45 : 44][(k / 2) % 4]; musTone(c, T, 'sawtooth', mtof(o), t, 0.01, boss ? 0.04 : 0.03, 0.35, 0.1); }
  if (k >= (boss ? 0 : 32)) musNoise(c, T, t + (60 / 220), 'highpass', 7000, 0.7, 0.002, boss ? 0.03 : 0.018, 0.05, 0.1);
  if (boss && (k % 4 === 0 || k % 8 === 3)) { musThump(c, T, t, 0.22, 170, 70); musNoise(c, T, t, 'bandpass', 300, 1, 0.002, 0.04, 0.12, 0.2); }
  if (k % (boss ? 12 : 16) === 8 && r() < 0.85) musSwell(c, T, [62, 63, 68].map(m => m - (r() < 0.5 ? 12 : 0)), t, boss ? 3 : 4, boss ? 0.028 : 0.022);
  if (k % 32 === 28) musNoise(c, T, t, 'bandpass', 400, 2, 1.8, 0.02, 0.2, 0.5, 3000);
}

// 곡 하나: 출구를 받고, tick(언제까지) 로 앞을 내다보며 박을 깔아 둔다
function musTrack(ctx, name, out, send, t0, seed) {
  const def = MTRACK[name], rng = musRng(seed), T = { name, out, send, rng, t0, next: t0, k: 0, hold: [], off: Math.floor(rng() * 4), done: false };
  def.init(ctx, T);
  T.tick = until => { let guard = 0; while (!T.done && T.next < until && guard++ < 400) { def.step(ctx, T, T.next, T.k); T.next += def.beat(T.k); T.k++; if (def.once && T.k >= def.once) T.done = true; } };
  T.stop = at => { T.done = true; T.hold.forEach(o => { try { o.stop(at); } catch (e) { /* 이미 멈춤 */ } }); T.hold = []; };
  return T;
}

function musStop() {
  if (MUS.timer) { clearInterval(MUS.timer); MUS.timer = null; }
  const L = MUS.live; MUS.live = null; MUS.cur = null; if (!L || !AC) return;
  const now = AC.currentTime; try { L.out.gain.cancelScheduledValues(now); L.out.gain.setValueAtTime(Math.max(0.0001, L.out.gain.value), now); L.out.gain.exponentialRampToValueAtTime(0.0001, now + 1.5); } catch (e) { /* 그냥 끊는다 */ }
  L.stop(now + 1.6); setTimeout(() => { try { L.out.disconnect(); L.send.disconnect(); } catch (e) { /* 이미 떨어짐 */ } }, 1800);
}
function musStart(name) {
  if (!MTRACK[name] || !AC) return;
  const B = musBus(AC), now = AC.currentTime, out = AC.createGain(), send = AC.createGain(); out.connect(B.master); send.connect(B.rev);
  out.gain.setValueAtTime(0.0001, now); out.gain.exponentialRampToValueAtTime(1, now + 1.5);
  MUS.seed = (MUS.seed + 0x9E3779B9) >>> 0; const T = musTrack(AC, name, out, send, now + 0.05, MUS.seed); MUS.live = T; MUS.cur = name;
  T.tick(now + 0.6); MUS.timer = setInterval(() => { if (!AC || MUS.live !== T) return; T.tick(AC.currentTime + 0.6); }, 150);
}
function music(name) {
  MUS.want = name || null;
  if (MUS.want === MUS.cur) return;
  if (!musOn() || !MUS.armed || !AC) { if (!MUS.want && MUS.live) musStop(); return; }
  try { musStop(); if (MUS.want) musStart(MUS.want); } catch (e) { MUS.cur = null; }
}
// 잠깐 다른 곡(장면)으로 갔다가 돌아온다
function musicTemp(name) { if (MUS.back == null) MUS.back = MUS.want || ''; music(name); }
function musicBack() { const b = MUS.back; MUS.back = null; if (b != null) music(b || null); }
function musicVol(v) { MUS.vol = Math.max(0, Math.min(1, +v || 0)); if (AC && AC.__mbus) AC.__mbus.master.gain.setTargetAtTime(0.45 * MUS.vol, AC.currentTime, 0.2); }
// 설정에서 켜고 끌 때: 꺼도 무엇을 틀어야 하는지는 기억한다
function musicSet(on) { if (!on) { const w = MUS.want; musStop(); MUS.want = w; return; } if (MUS.armed && MUS.want && MUS.cur !== MUS.want) { try { musStart(MUS.want); } catch (e) { /* 소리 없이 간다 */ } } }
function musArm() {
  if (MUS.armed || MUS.dead) return;
  try { const C = window.AudioContext || window.webkitAudioContext; if (!C) { MUS.dead = true; return; } AC = AC || new C(); if (AC.state === 'suspended') AC.resume(); MUS.armed = true; if (MUS.want && musOn() && MUS.cur !== MUS.want) musStart(MUS.want); } catch (e) { MUS.dead = true; }
}
if (typeof window !== 'undefined') {
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, musArm, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (MUS.cur) { MUS.resume = MUS.want; const w = MUS.want; musStop(); MUS.want = w; } } else if (MUS.resume) { const w = MUS.resume; MUS.resume = null; MUS.cur = null; music(w); } });
}
// 시험용: 곡 하나를 소리 없이 짧게 그려 보고 가장 큰 값과 평균 세기를 돌려준다
async function musRender(name, secs) {
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, rate = 22050, ctx = new OC(2, Math.floor(rate * secs), rate);
  const B = musBus(ctx), out = ctx.createGain(), send = ctx.createGain(); out.connect(B.master); send.connect(B.rev); const T = musTrack(ctx, name, out, send, 0.02, 7); T.tick(secs);
  const buf = await ctx.startRendering(); let peak = 0, sum = 0, n = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; n++; } }
  return { peak, rms: Math.sqrt(sum / n) };
}
if (typeof window !== 'undefined') window.__music = { get want() { return MUS.want; }, get cur() { return MUS.cur; }, get armed() { return MUS.armed; }, get on() { return musOn(); }, get ctx() { return AC ? AC.state : null; }, render: musRender, tracks: Object.keys(MTRACK) };
