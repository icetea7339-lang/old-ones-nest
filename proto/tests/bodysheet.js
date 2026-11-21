// 몸 견본 시트: 무작위 200 + 이름 붙은 형태 + "조금만 달리 논" 줄.  node tests/bodysheet.js [배율]
const pw = require('playwright'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', '..'), html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const T = require('../src/traits.js'), { profiles } = require('./bodyprof.js');
const SC = +(process.argv[2] || 2);
// 이름 붙은 형태마다 거기에 닿는 셈
const LM = {
  forest: { infections: 80, risen: 30, organsPlaced: 20 }, allfaces: { wordsLearned: 40, converts: 10 }, lastone: { kinLost: 30, nightsAlone: 12 }, pit: { swallows: 60, coreKills: 20 },
  thousandeyes: { madness: 60, combos: 10 }, trench: { waterKills: 60, captives: 30 }, ossuary: { eaten: 90, bossKills: 25 }, queen: { spawns: 60, kinMade: 40 },
  constel: { skillsUsed: 70, combos: 30, ess_nebula: 80 }, pitfall: { trapKills: 70, organsPlaced: 30 }, hedgehog: { coreDamage: 700, coreKills: 30 }, nomad: { nightsDark: 25, routs: 40 },
  mimic: { wordsLearned: 30, madness: 15, converts: 25 }, gourmand: { digestKills: 60, eaten: 40, swallows: 20 }, tongue: { pulled: 50, eaten: 20 }, crowned: { bossKills: 12, kinKills: 30 },
  lantern: { combos: 60, madness: 10 }, shellmind: { coreDamage: 900, nightsAlone: 4 }, veil: { madness: 40, converts: 40 }, swarmone: { kinMade: 120 },
  drowned: { waterKills: 40, organsPlaced: 40, infections: 30 }, chorus: { swallows: 40, wordsLearned: 30, converts: 15 }, skywound: { routs: 40, skillsUsed: 40, shapesPlaced: 20 },
  patient: { organsPlaced: 60, trapKills: 40, swallows: 20 }, plague: { infections: 160, risen: 14 }, madlight: { madness: 40, combos: 50, converts: 15 }, scarred: { coreDamage: 2600, coreKills: 44, eaten: 10 },
  echo: { trapKills: 9, kinKills: 9, infections: 9, swallows: 9, madness: 9, wordsLearned: 9, waterKills: 9, eaten: 9, skillsUsed: 9, organsPlaced: 9, coreDamage: 80, kinMade: 9, routs: 9, nightsDark: 4, spawns: 9 },
  tiny: { bossKills: 9, coreKills: 5 }, hollow: { digestKills: 40, nightsAlone: 10, kinLost: 10 }
};
const LMASP = { forest: 'brood', allfaces: 'dusk', lastone: 'hunger', pit: 'hunger', thousandeyes: 'nebula', trench: 'abyss', ossuary: 'hunger', queen: 'brood', constel: 'nebula', pitfall: 'abyss', hedgehog: 'hunger', nomad: 'dusk', mimic: 'dusk', gourmand: 'hunger', tongue: 'brood', crowned: 'hunger', lantern: 'nebula', shellmind: 'abyss', veil: 'dusk', swarmone: 'brood', drowned: 'abyss', chorus: 'dusk', skywound: 'nebula', patient: 'brood', plague: 'brood', madlight: 'nebula', scarred: 'hunger', echo: 'abyss', tiny: 'abyss', hollow: 'hunger' };
function landmarkGenomes() { return T.LANDMARKS.map((l, i) => { const g = T.newGenome({ aspect: LMASP[l.id] || 'abyss', stage: l.id === 'tiny' ? 2 : 5, seed: 500 + i * 31 }); T.addBehaviour(g, LM[l.id] || {}); const got = T.landmarkOf(g); return { g, want: l.id, got: got ? got.id : null }; }); }
// 같은 시작에서 셈 하나만 조금씩 달리
function strips() { const base = { kinKills: 12, trapKills: 10, eaten: 8, infections: 6, skillsUsed: 6 }, ks = ['trapKills', 'infections', 'wordsLearned', 'swallows', 'waterKills', 'kinLost', 'madness', 'skillsUsed', 'eaten', 'spawns']; return ks.map((k, i) => { const c = Object.assign({}, base); c[k] = (c[k] || 0) + 14; const g = T.newGenome({ aspect: 'abyss', stage: 4, seed: 42 }); T.addBehaviour(g, c); return { g, label: k + '+14' }; }); }
if (require.main === module) (async () => {
  const b = await pw.chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })).newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(300);
  const sheet = async (name, items, cols, bg) => {
    const data = await p.evaluate(([items, cols, SC, bg]) => {
      const T = window.__body.TRAITS, cw = 64 * SC + 16, chh = 64 * SC + 40, rows = Math.ceil(items.length / cols), c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * chh; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false;
      items.forEach((it, i) => { const g = it.g, cv = window.__body.build(g), px = (i % cols) * cw + 8, py = Math.floor(i / cols) * chh + 4, s = cv.width * SC; x.drawImage(cv, px + (64 * SC - s) / 2, py + 64 * SC - s, s, s); const sm = T.summary(g); x.fillStyle = '#ece6d6'; x.font = '11px sans-serif'; x.fillText((it.label ? it.label + ' ' : '') + sm.name, px, py + 64 * SC + 13); x.fillStyle = '#a59cb4'; x.fillText((sm.landmark ? '★' + sm.landmark + ' ' : '') + g.aspect + ' ' + g.stage + ' · ' + sm.clsText, px, py + 64 * SC + 27); });
      return c.toDataURL('image/png');
    }, [items, cols, SC, bg]);
    fs.writeFileSync(path.join(OUT, name), Buffer.from(data.split(',')[1], 'base64'));
  };
  const pr = profiles(T, 200, 0).map(x => ({ g: x.g }));
  await sheet('body_rand1.png', pr.slice(0, 100), 10, '#0c0a14'); await sheet('body_rand2.png', pr.slice(100), 10, '#3a3a48');
  const lms = landmarkGenomes(); await sheet('body_landmarks.png', lms.map(x => ({ g: x.g, label: x.got === x.want ? '' : '(x)' })), 10, '#0c0a14');
  await sheet('body_strip.png', strips(), 10, '#0c0a14');
  const small = pr.slice(0, 40); await p.evaluate(() => 0); await sheet('body_small48.png', small, 20, '#14172a');
  const same = await p.evaluate(g => { const a = window.__body.build(g).toDataURL(), c = JSON.parse(JSON.stringify(g)); return a === window.__body.build(c).toDataURL(); }, pr[7].g); console.log('같은 유전자 같은 그림', same);
  console.log('랜드마크 닿음', lms.filter(x => x.got === x.want).length + '/' + lms.length, lms.filter(x => x.got !== x.want).map(x => x.want + '→' + x.got).join(' '));
  console.log(errs.length ? '오류 ' + errs.join(' | ') : 'no errors'); await b.close();
})();
module.exports = { LM, LMASP, landmarkGenomes, strips };
