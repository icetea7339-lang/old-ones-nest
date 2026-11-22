// 자동 플레이어. 규칙을 바꾸면 반드시 돌린다.
//   node src/bot.js 300            기본 전략 300판
//   node src/bot.js 300 all        전략 비교표
//   node src/bot.js 1 trace        한 판을 날짜별로 출력
const S = require('./logic.js'), STEWARD = require('./steward.js');
if (process.env.BANSP) setTimeout(() => 0, 0);
const N = +process.argv[2] || 200, MODE = process.argv[3] || 'mix';
if (process.env.KSET) { const o = JSON.parse(process.env.KSET); for (const k in o) S.K[k] = typeof o[k] === 'object' ? Object.assign({}, S.K[k], o[k]) : o[k]; }   // 실험: 상수 바꿔 끼우기

// 재기만 하는 스위치: ANYROOM=1 징조 전용 방도 아무 판에서나 짓게, FORCE_KNOW=id,id 그 주문을 첫날부터 안다
if (process.env.ANYROOM) S.K.anyRoom = true;
if (process.env.ROOMSET) { const o = JSON.parse(process.env.ROOMSET); for (const k in o) Object.assign(S.ROOM[k], o[k]); }   // 실험: 방 표 바꿔 끼우기
if (process.env.FORCE_KNOW) S.K.know = process.env.FORCE_KNOW.split(',');
const STRATS = {
  mix: { captive: 'mix', raid: 1, spend: 1 },        // 사람이 할 법한 평범한 운영
  ransom: { captive: 'ransom', raid: 1, spend: 1 },  // 포로는 전부 몸값
  sacrifice: { captive: 'sacrifice', raid: 1, spend: 1 },
  convert: { captive: 'convert', raid: 1, spend: 1 },
  raider: { captive: 'mix', raid: 3, spend: 1 },     // 매일 습격
  peace: { captive: 'mix', raid: 0, spend: 1 },      // 습격 안 함
  hoard: { captive: 'ransom', raid: 0, spend: 0.4 }, // 진액을 쌓아 둔다
  idle: { captive: 'none', raid: 0, spend: 0 },      // 아무것도 안 한다
  tspike: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'spike' },   // 권속 없이 함정만
  tmist: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'mist' },
  trock: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'rock' },
  tacid: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'acid+spike' },
  tmix: { captive: 'ransom', raid: 0, spend: 1, trapOnly: 'mist+spike' },
  nohand: { captive: 'mix', raid: 1, spend: 1, nohand: true },
  only: { captive: 'mix', raid: 1, spend: 1, only: process.env.SPELL || 'whip' },   // 실험: 주문 하나만 쓴다
  nocalm: { captive: 'mix', raid: 1, spend: 1, nocalm: true },
};

function play(seed, st, diff, trace, force) {
  if (process.env.BANSP) st = Object.assign({}, st, { banSp: process.env.BANSP.split(',') });
  const asp = S.ASPECTS[seed % 5], G = S.newGame(seed, asp, { diff: diff || 1, forceOmen: force || null, open: !!process.env.OPEN, prologue: process.env.PRO === 'none' ? null : S.proResult(asp, process.env.PRO || 'avg'), origin: process.env.ORIGIN || 'drop', layout: process.env.LAYOUT || null, star: process.env.STAR || 'none' });
  const info = { reps: [], digs: 0 };
  let guard = 0;
  while (!G.over && guard++ < 60) {
    const c = S.cm(G);
    let st2 = st; if (process.env.EDICT) { const ch = S.edictChoices(G), want = process.env.EDICT, pick = ch.includes(want) ? want : ch[0]; S.setEdict(G, pick); st2 = Object.assign({}, st, S.EDICT[pick].st); }   // 교시: 아침마다 셋 중 하나. EDICT=이름 이면 나올 때마다 그것, 아니면 첫 번째
    STEWARD.tasks(S, G, st2, { seed, pin: !!process.env.PIN, force: process.env.FORCE || null, ban: process.env.BAN ? process.env.BAN.split(',') : [], secret: process.env.SECRET !== '0', nohoard: !!process.env.NOHOARD, hoardOnly: process.env.ONLY ? process.env.ONLY.split(',') : null, onDig: () => { info.digs++; }, onHoard: () => { info.hoard = (info.hoard || 0) + 1; } }).forEach(t => t());
    if (G.sealed && S.paths(G).length && (G.under || 0) >= +(process.env.BREACH || 0)) S.breach(G);   // BREACH=n: 땅속에서 n밤을 보낸 뒤 뚫는다 (들키면 그 전에 뚫린다)
    const day = G.day, gold0 = G.gold;
    const r = S.endDay(G, STEWARD.decide(st2));
    if (r.battle) info.reps.push(Object.assign({ day }, r.battle));
    if (trace) console.log(`${String(day).padStart(2)}일 진액 ${Math.round(gold0)}→${Math.round(G.gold)} 공포 ${Math.round(G.fear)} 신앙 ${G.faith} 정수 ${S.essTotal(G)} 권속 ${G.kin.length} 포로 ${G.prison.length} | ${r.battle ? `${S.VILL[r.battle.vill].name} ${r.battle.gname} ${r.battle.count}명 → ${r.battle.result} 처치 ${r.battle.kills} 포로 ${r.battle.captives.length} 도주 ${r.battle.fled}` : '조용한 밤'}${r.settle.evolved ? ' ★진화 ' + S.formName(G) : ''}${r.settle.notes.length ? ' ! ' + r.settle.notes.join('; ') : ''}`);
  }
  return { G, info };
}

function run(name, n, diff, force) {
  const st = STRATS[name]; const o = { win: 0, dieDay: {}, why: {}, gold: 0, score: 0, grades: {}, stage: [0, 0, 0, 0, 0], forms: {}, inc: {}, kills: 0, caps: 0, conv: 0, battles: 0, repel: 0, stolen: 0, fear: 0, dug: 0, kin: 0, muts: 0, err: 0, evoDay: { 6: 0, 12: 0, 18: 0 } };
  for (let s = 1; s <= n; s++) {
    let r; try { r = play(s * 7919 + 13, st, diff, false, force); } catch (e) { o.err++; if (o.err <= 2) console.log('오류 seed', s, e.stack.split('\n').slice(0, 4).join('\n')); continue; }
    const G = r.G, sc = S.score(G);
    if (G.over && G.over.win) o.win++; else { o.dieDay[G.day] = (o.dieDay[G.day] || 0) + 1; const w = G.over ? G.over.why : '끝나지 않음'; o.why[w] = (o.why[w] || 0) + 1; }
    o.gold += G.gold; o.score += sc.total; o.grades[sc.grade] = (o.grades[sc.grade] || 0) + 1; o.stage[G.slime.stage]++; o.forms[S.formName(G)] = 1;
    for (const k in G.stats.income) o.inc[k] = (o.inc[k] || 0) + G.stats.income[k];
    ['gifts', 'banes', 'bred', 'preached', 'rites'].forEach(k => { o['x_' + k] = (o['x_' + k] || 0) + (G.stats[k] || 0); }); o.godsum = o.godsum || {}; for (const g in (G.gods || {})) o.godsum[g] = (o.godsum[g] || 0) + G.gods[g];
    o.rm = o.rm || {}; o.rmw = o.rmw || {}; new Set(G.cells.filter(x => x.dug).map(x => x.type)).forEach(t => { o.rm[t] = (o.rm[t] || 0) + 1; if (G.over && G.over.win) o.rmw[t] = (o.rmw[t] || 0) + 1; });
    o.sp = o.sp || {}; for (const k in (G.stats.spells || {})) o.sp[k] = (o.sp[k] || 0) + G.stats.spells[k];
    o.kills += G.stats.kills; o.caps += G.stats.captives; o.conv += G.stats.converts; o.battles += G.stats.battles; o.repel += G.stats.repels; o.stolen += G.stats.stolen; o.falls = (o.falls || 0) + (G.falls || 0); o.fz = (o.fz || 0) + (G.stats.secrets || 0); o.kst = o.kst || [0, 0, 0]; G.kin.forEach(k => { if (k.kind !== 'spawn') o.kst[S.stageOf(k)]++; }); o.bd = o.bd || {}; o.bdw = o.bdw || {}; { const bk = G.slime.body || (G.slime.main ? '평범' : '허물 전'); o.bd[bk] = (o.bd[bk] || 0) + 1; if (G.over && G.over.win) o.bdw[bk] = (o.bdw[bk] || 0) + 1; } o.tr = o.tr || {}; o.tr[G.origin || 'drop'] = (o.tr[G.origin || 'drop'] || 0) + 1; o.trw = o.trw || {}; if (G.over && G.over.win) o.trw[G.origin || 'drop'] = (o.trw[G.origin || 'drop'] || 0) + 1; o.fellRuns = (o.fellRuns || 0) + (G.falls ? 1 : 0); o.fear += G.fear; o.dug += G.cells.filter(c => c.dug).length; o.kin += G.kin.length; o.muts += G.slime.muts.length;
  }
  if (process.env.ROOMSTAT) console.log('방(판끝): ' + Object.keys(o.rm).sort((x, y) => o.rm[y] - o.rm[x]).map(k => S.ROOM[k].name + ' ' + o.rm[k] + '판(클리어 ' + Math.round((o.rmw[k] || 0) / o.rm[k] * 100) + '%)').join(' · '));
  if (process.env.SPSTAT) console.log('손: ' + Object.keys(o.sp).sort((x, y) => o.sp[y] - o.sp[x]).map(k => S.SPELL[k].name + ' ' + (o.sp[k] / n).toFixed(1)).join(' · '));
  return o;
}
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0) + '%';
function report(name, n, diff) {
  const o = run(name, n, diff), m = n - o.err, tot = Object.values(o.inc).reduce((a, b) => a + b, 0);
  const inv = (o.inc['지닌 것'] || 0) + (o.inc['몸값'] || 0);
  console.log(`\n== ${name} (난이도 ${diff || 1}, ${n}판) 오류 ${o.err}`);
  console.log(`클리어 ${pct(o.win, m)} | 평균 진액 ${Math.round(o.gold / m)} 점수 ${Math.round(o.score / m)} 공포 ${Math.round(o.fear / m)} | 등급 ${Object.entries(o.grades).map(e => e.join(':')).join(' ')}`);
  console.log(`진화 단계 0/1/2/3/4: ${o.stage.map(x => pct(x, m)).join(' / ')} | 본 형태 ${Object.keys(o.forms).length}종 | 변이 ${(o.muts / m).toFixed(1)}`);
  console.log(`수입 비중: ${Object.entries(o.inc).sort((a, b) => b[1] - a[1]).map(e => e[0] + ' ' + pct(e[1], tot)).join(', ')} | 침입자 몫 ${pct(inv, tot)}`);
  console.log('판당 비밀 진화 ' + ((o.fz || 0) / m).toFixed(2) + '회 | 판끝 권속 단계 0/1/2: ' + (o.kst || [0, 0, 0]).map(x => (x / m).toFixed(1)).join(' / '));
  console.log('판당 선물 ' + ((o.x_gifts || 0) / m).toFixed(1) + ' 벌 ' + ((o.x_banes || 0) / m).toFixed(1) + ' | 번식 ' + ((o.x_bred || 0) / m).toFixed(1) + ' 포교 ' + ((o.x_preached || 0) / m).toFixed(1) + ' 의식 정수 ' + ((o.x_rites || 0) / m).toFixed(1) + ' | 끝날 때 신격 ' + Object.keys(o.godsum || {}).map(g => g + ' ' + (o.godsum[g] / m).toFixed(1)).join(', '));
  console.log('본체: ' + Object.keys(o.bd || {}).map(k => k + ' ' + o.bd[k] + '판(클리어 ' + Math.round(((o.bdw || {})[k] || 0) / o.bd[k] * 100) + '%)').join(', '));
  console.log('형질: ' + Object.keys(o.tr || {}).map(k => k + ' ' + o.tr[k] + '판(클리어 ' + Math.round(((o.trw || {})[k] || 0) / o.tr[k] * 100) + '%)').join(', '));
  console.log(`판당 전투 ${(o.battles / m).toFixed(1)} 격퇴 ${(o.repel / m).toFixed(1)} 처치 ${(o.kills / m).toFixed(1)} 포로 ${(o.caps / m).toFixed(1)} 개종 ${(o.conv / m).toFixed(1)} 털림 ${Math.round(o.stolen / m)}방울 쓰러짐 ${((o.falls || 0) / m).toFixed(2)}회 (쓰러진 판 ${Math.round((o.fellRuns || 0) / m * 100)}%) | 판 칸 ${(o.dug / m).toFixed(1)} 권속 ${(o.kin / m).toFixed(1)}`);
  if (m - o.win) console.log(`패배: ${Object.entries(o.why).map(e => e.join(' ')).join(', ')} | 날짜 ${Object.entries(o.dieDay).map(e => e[0] + '일:' + e[1]).join(' ')}`);
  return o;
}
if (MODE === 'trace') { const r = play(N * 7919 + 13, STRATS[process.argv[4] || 'mix'], 1, true); console.log(r.G.over, S.score(r.G).total, S.score(r.G).grade, S.formName(r.G)); }
else if (MODE === 'omens') { const b = run('nocalm', N, 1, null); console.log('징조별 클리어율 (그 징조만 매일 나올 때, 달래지 않음). 기준 ' + pct(b.win, N)); for (const id of S.OMEN_IDS) { const o = run('nocalm', N, 1, id); console.log(('  ' + S.OMEN[id].name).padEnd(10) + pct(o.win, N - o.err).padStart(5) + '  오류 ' + o.err); } }
else if (MODE === 'all') { for (const k in STRATS) report(k, N, 1); report('mix', N, 2); report('mix', N, 3); }
else report(MODE in STRATS ? MODE : 'mix', N, +process.argv[4] || 1);
