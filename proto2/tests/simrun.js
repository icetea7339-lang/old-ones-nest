// 새 판 시험: 화면 없이 여러 씨앗으로 돌려 흐름을 잰다.  node simrun.js [분] [씨앗들]
const B = require('/home/user/slime-ipo-design/proto2/src/sim.js');
const MIN = +(process.argv[2] || 15), seeds = (process.argv[3] || '1,7,42,99,2024').split(',').map(Number);
for (const seed of seeds) { const S = B.newWorld(seed); const molt = []; let ready = 0, breach = 0, err = null;
  try { for (let i = 0; i < 600 * MIN && !S.over; i++) { B.tick(S); if (S.molt) { molt.push(Math.round(S.t)); B.applyMolt(S, S.molt.choices ? S.molt.choices[seed % S.molt.choices.length] : null); } if (!ready && B.ready(S)) { ready = Math.round(S.t); B.openUp(S); } if (!breach && S.breach === 2) breach = Math.round(S.t); } } catch (e) { err = e.stack.split('\n').slice(0, 3).join(' | '); }
  console.log('씨앗 ' + String(seed).padEnd(5), '허물 ' + (molt.join(',') || '-').padEnd(18), '준비 ' + String(ready).padEnd(4), '뚫림 ' + String(breach).padEnd(4), '단계 ' + S.hero.stage, '권속 ' + B.count(S, 'w') + '/' + B.count(S, 's'), '판 ' + S.dug, '방 ' + S.chambers.filter(c => c.open).length, '물결 ' + S.wave, '잃음 ' + S.stats.lost, '잡음 ' + S.stats.slain, S.over ? '끝 ' + Math.round(S.over.t) + 's' : '생존', err ? '오류 ' + err : ''); }
