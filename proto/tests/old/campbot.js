// 이야기 장을 자동 플레이어로 해 본다: node tests/campbot.js [판 수] [장(1~7|all)]
const CM = require('../src/cardmode.js'), CP = require('../src/campaign.js'), BOT = require('../src/cardbot.js'), CD = require('../src/cards2.js');
const n = +(process.argv[2] || 40), which = process.argv[3] || 'all', chs = which === 'all' ? CP.IDS : [+which];
const out = {};
for (const ch of chs) {
  let win = 0, days = 0, why = {}, err = 0;
  for (let s = 1; s <= n; s++) {
    const seed = s * 7919 + ch * 101, a = CD.ASPS[s % 5];
    let R; try { R = BOT.play(seed, a, 1, '', null, null, (sd, asp, meta) => { const m = CM.newMeta(); if (ch === 7) CP.choose(m, ['capture', 'eat', 'release'][s % 3]); return CP.newRun(ch, sd, { meta: m, aspect: asp }); }); } catch (e) { err++; if (err < 3) console.log('오류', ch, seed, e.stack.split('\n').slice(0, 5).join('\n')); continue; }
    const w = !!(R.over && R.over.win); win += w; days += R.G.day; if (!w) { const k = (R.over && R.over.why) || '끝나지 않음'; why[k] = (why[k] || 0) + 1; }
  }
  out[ch] = { win: Math.round(100 * win / n), day: (days / n).toFixed(1), why, err };
  console.log(ch + '장 「' + CP.CH[ch].title + '」 ' + n + '판 · 넘김 ' + out[ch].win + '% · 끝난 날 ' + out[ch].day + (err ? ' · 오류 ' + err : '') + ' · ' + JSON.stringify(why).slice(0, 160));
}
module.exports = out;
