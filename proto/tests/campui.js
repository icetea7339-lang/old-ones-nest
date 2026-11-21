// 이야기(카드 판 위의 일곱 장) 화면 시험: 처음 화면 → 이야기 → 장 고르기 → 1장 첫 장면 → 판(목표 단추·목표 창) → 첫 밤 → 말하는 이마다 한 줄 → 장 넘김 화면 → 5장 끝의 선택
// node tests/campui.js [기기: 비우면 PC | "iPhone 14" | a360]
const pw = require('playwright'), fs = require('fs'), path = require('path'), FZM = require('./_fz.js');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const dev = process.argv[2] || '', tag = (dev ? dev.replace(/\s+/g, '') : 'pc') + (FZM.FZ ? '_fz' + FZM.FZ : ''), out = path.join(__dirname, 'campui_' + tag); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), errs = [], bad = []; p.setDefaultTimeout(9000);
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  if (FZM.FZ) await p.addInitScript(FZM.initScript(FZM.FZ));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400);
  const LEAK = /을\(를\)|이\(가\)|공포 [+−-]\d|포교|포로 자리|정신력|정신 [−-]\d|포로 밥값|\d라운드|진액 방울|정수|익숙해짐/;
  let n = 0; const shot = async label => { await p.waitForTimeout(380); n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + label + '.png') }); { const m = await p.evaluate(re => { const t = document.body.innerText.match(new RegExp(re)); return t ? t[0] : null; }, LEAK.source); if (m) bad.push(label + ': 옛 글 「' + m + '」'); } const cl = await p.evaluate(FZM.clipScript); const over = await p.evaluate(() => { const o = []; if (document.scrollingElement.scrollWidth > innerWidth + 1) o.push('옆으로 넘침'); return o; }); cl.concat(over).forEach(s => bad.push(label + ': ' + s)); };
  const tap = async sel => { const el = await p.$(sel); if (!el) throw new Error('없음: ' + sel); await el.click(); await p.waitForTimeout(160); };
  const sceneOn = () => p.evaluate(() => !document.getElementById('scene').hidden);
  const skipScene = async () => { for (let k = 0; k < 40 && await sceneOn(); k++) { await p.keyboard.press('Space'); await p.waitForTimeout(90); } };
  const ok = (c, m) => { if (!c) bad.push(m); };

  await shot('title');
  ok(!!(await p.$('[data-a="story"]')), '처음 화면에 이야기 단추가 없다');
  await tap('[data-a="story"]'); await shot('select');
  ok(await p.evaluate(() => document.querySelectorAll('[data-cp="ch"]').length === 8), '장 고르기에 여는 이야기 + 일곱 장이 없다');
  ok(await p.evaluate(() => document.querySelector('[data-cp="ch"][data-v="2"]').disabled), '2장이 처음부터 열려 있다');
  // 1장: 첫 장면
  await tap('[data-cp="ch"][data-v="1"]'); await p.waitForTimeout(500); ok(await sceneOn(), '1장 첫 장면이 안 나온다'); await shot('ch1_scene');
  await p.keyboard.press('Space'); await p.waitForTimeout(200); await p.keyboard.press('Space'); await p.waitForTimeout(400); await shot('ch1_scene2');
  await skipScene(); await p.waitForTimeout(600); await shot('ch1_day');
  ok(await p.evaluate(() => !!(window.__card.run && window.__card.run.camp && window.__card.run.camp.ch === 1)), '1장 판이 열리지 않았다');
  ok(await p.evaluate(() => { const el = document.getElementById('camp-goal'); return !!el && !el.hidden; }), '목표 단추가 없다');
  await tap('#camp-goal'); await shot('ch1_goal'); ok(await p.evaluate(() => document.querySelectorAll('.cp-goals p').length >= 3), '목표 창에 목표가 없다');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); await p.evaluate(() => window.__card.render());
  // 첫 밤 (조용한 밤): 밤 뒤의 대사가 나온다
  await p.evaluate(() => { window.__card.META.pause = 'never'; });
  await p.evaluate(() => { window.__card.night([]); }); for (let k = 0; k < 60; k++) { await p.waitForTimeout(250); if (await sceneOn()) break; if (await p.evaluate(() => !document.getElementById('modal').hidden)) await tap('#modal [data-a="close"]'); }
  ok(await sceneOn(), '1장 첫 밤 뒤의 대사가 안 나온다'); await shot('ch1_night_line'); await skipScene();
  for (let k = 0; k < 20; k++) { await p.waitForTimeout(200); if (await p.evaluate(() => !document.getElementById('modal').hidden)) await tap('#modal [data-a="close"]'); if (await p.$('#cm-ov [data-c="rskip"]')) await tap('#cm-ov [data-c="rskip"]'); }
  ok(await p.evaluate(() => window.__card.run.G.day === 2), '첫 밤 뒤 2일째가 아니다');
  // 말하는 이마다 한 줄 (서술·잔향·꿈·책을 쫓는 자·일지·사람)
  for (const [s, t, lab] of [['n', '흙은 차고 무거웠다.', 'line_narr'], ['e', '흙을 밀어내고 굴을 늘이라.', 'line_echo'], ['d', '거꾸로 자란 탑들 사이로 숨소리가 지나간다.', 'line_dream'], ['s', '이 벽은 숨을 쉰다. 장부에 적힌 대로다.', 'line_seeker'], ['j', '스무날. 구멍의 입구는 숨을 쉰다.', 'line_journal'], ['c', '구멍이다. 어제는 없던 구멍이야.', 'line_voice']]) {
    p.evaluate(([s, t]) => { window.__camp.line({ s, t }, 3); }, [s, t]); await p.waitForTimeout(1100); ok(await sceneOn(), lab + ' 장면이 안 보인다'); await shot(lab); await skipScene();
  }
  // 장을 넘긴다 (시험용으로 바로) → 넘긴 화면: 바늘·열린 카드·알
  await p.evaluate(() => { window.__camp.win(); window.__card.finish(); return 1; }); await p.waitForTimeout(500); await shot('ch1_end_scene'); await skipScene(); await p.waitForTimeout(500); await shot('ch1_clear');
  ok(await p.evaluate(() => !!document.querySelector('[data-cp="ch"][data-v="2"]')), '넘긴 화면에 2장으로 가는 단추가 없다');
  ok(await p.evaluate(() => window.__card.META.cards.camp.clear[1] === 1), '1장 넘김이 기록되지 않았다');
  ok(await p.evaluate(() => document.querySelectorAll('.cp-opened .dkc').length >= 3), '본편에 열린 카드가 보이지 않는다');
  await tap('[data-cp="menu"]'); await shot('select_after');
  ok(await p.evaluate(() => !document.querySelector('[data-cp="ch"][data-v="2"]').disabled), '1장을 넘겼는데 2장이 안 열렸다');
  // 5장 끝의 선택: 4장까지 넘긴 것으로 두고 5장을 열어 바로 넘긴다
  await p.evaluate(() => { const c = window.__card.META.cards.camp; [1, 2, 3, 4].forEach(k => { c.clear[k] = 1; }); }); await tap('[data-cp="menu"]').catch(() => {}); await p.evaluate(() => window.__camp.open());
  await tap('[data-cp="ch"][data-v="5"]'); await p.waitForTimeout(400); await skipScene(); await p.waitForTimeout(500); await shot('ch5_day');
  ok(await p.evaluate(() => window.__card.run.G.slime.stage >= 1), '5장이 허물 벗은 몸으로 시작하지 않는다');
  await p.evaluate(() => { window.__camp.win(); window.__card.finish(); return 1; }); await p.waitForTimeout(400); await skipScene(); await p.waitForTimeout(400); await shot('ch5_choice');
  ok(!!(await p.$('[data-cp="choose"][data-v="release"]')), '5장 끝에 선택이 없다');
  await tap('[data-cp="choose"][data-v="release"]'); await p.waitForTimeout(400); await skipScene(); await p.waitForTimeout(500); await shot('ch5_clear');
  ok(await p.evaluate(() => window.__card.META.cards.camp.choice5 === 'release'), '5장 선택이 기록되지 않았다');
  await tap('[data-cp="home"]'); await shot('back_title');
  console.log(tag, '화면 ' + n + ' 개 · ' + (bad.length ? '문제 ' + bad.length + ': ' + bad.slice(0, 8).join(' | ') : '잘린 글 없음') + (errs.length ? ' · 오류 ' + errs.slice(0, 3).join(' | ') : ' · no errors'));
  await b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})().catch(e => { console.error('실패', e.message); process.exit(1); });
