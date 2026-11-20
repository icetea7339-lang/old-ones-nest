// 굴의 모습 점검: 새 판의 동굴 한 칸, 무른 흙을 판 뒤, 허물 단계·징조마다의 둥지.  node cavelook.js [기기] [only: 예) s0,dusk4]
const pw = require('playwright'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync('/home/user/slime-ipo-design/PLAY-GAME.html', 'utf8');
const devName = process.argv[2] || '', only = (process.argv[3] || '').split(',').filter(Boolean), OUT = path.join(__dirname, '..', '..');
(async () => {
  const b = await pw.chromium.launch(); let ctx;
  if (devName) { const dev = Object.assign({}, pw.devices[devName]); delete dev.defaultBrowserType; ctx = await b.newContext(dev); } else ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(), errs = []; p.setDefaultTimeout(7000); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400); await p.evaluate(() => { __nest.META.tutDone = true; });
  const want = n => !only.length || only.includes(n);
  const shot = async n => { if (!want(n)) return; await p.waitForTimeout(350); if (devName) await p.screenshot({ path: path.join(OUT, 'cave_m_' + n + '.png') }); else await p.locator('#stage').screenshot({ path: path.join(OUT, 'cave_' + n + '.png') }); };
  const click = async s => { await p.locator(s).locator('visible=true').first().evaluate(e => e.click()); await p.waitForTimeout(200); };
  const has = async s => (await p.locator(s).locator('visible=true').count()) > 0;
  await click('[data-a="new"]'); await click('[data-a="close"][data-v="go"]'); await p.waitForTimeout(250); await click('[data-a="sceneskip"]'); await p.waitForTimeout(250); if (await has('#modal [data-a="close"]')) await click('#modal [data-a="close"]');
  await shot('a_start');
  console.log('무른 흙 파기:', await p.evaluate(() => { const G = __nest.G, S = __nest.NEST; G.ap = 99; G.d.buildOps = 99; return [13, 12, 7].map(i => S.dig(G, i).msg).join(' / '); }));
  await shot('b_dig3');
  const setup = async (main, st, sub) => { await p.evaluate(([main, st, sub]) => { const G = __nest.G, S = __nest.NEST; G.gold = 900; G.day = 12; G.sealed = false; G.world = G.world || S.applyWorld('fantasy'); G.slime.main = main; G.slime.stage = st; G.slime.sub = sub; if (main) { G.slime.ess[main] = 200; G.startAsp = main; } G.ap = 99; G.d.buildOps = 99; G.faith = 14; G.fear = 42;
      if (G._set) return; G._set = 1; const dig = i => { if (!G.cells[i].dug) { G.cells[i].dug = true; G.cells[i].type = 'empty'; } };
      [0, 1, 2, 6, 7, 8, 12, 13, 14, 18, 11, 17, 3].forEach(dig);
      const put = (i, t) => { G.cells[i].type = t; G.cells[i].traps = G.cells[i].traps || []; };
      put(0, 'trap'); G.cells[0].traps = [{ kind: 'spike', lv: 2 }, { kind: 'rock', lv: 1 }]; put(1, 'post'); put(2, 'library'); put(6, 'prison'); put(7, 'hall'); put(8, 'chapel'); put(12, 'shop'); put(13, 'pool'); put(11, 'altar'); put(3, 'abattoir'); G.cells[14].block = true;
      G.kin = []; const add = (name, kind, lv, loc, evo, parts) => G.kin.push({ id: G.nextId++, name, kind, lv, exp: 0, loc, hurt: 0, skill: 0, age: 3, unpaid: 0, stance: 'hold', evo, parts, pin: true });
      add('뼈돌', 'skeleton', 4, 1); add('고블', 'goblin', 3, 1); add('솔', 'cultist', 3, 8); add('비늘', 'scale', 5, 7, true); add('허기', 'hunger', 3, 7); add('그물', 'netter', 2, 7); add('글', 'scribe', 2, 2); add('호위', 'skeleton', 2, 'core');
      G.prison = [{ kind: 'militia', vill: 'gaet' }, { kind: 'priest', vill: 'bell' }]; }, [main, st, sub]); await p.evaluate(() => { __nest.ST.roam = {}; }); await p.waitForTimeout(250); };
  await setup(null, 0, null); await shot('c_s0');
  const AS = ['abyss', 'nebula', 'brood', 'dusk', 'hunger'];
  // 방 종류를 전부 한 번씩: 두 장으로 나눠 찍는다
  const allRooms = async (types, main, st) => { await p.evaluate(([types, main, st]) => { const G = __nest.G, S = __nest.NEST; G.slime.main = main; G.slime.stage = st; G.slime.sub = null; G.sealed = false; G.cells.forEach((c, i) => { if (i !== S.CORE) { c.dug = true; c.type = 'empty'; c.traps = []; c.block = false; } });
      const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19]; types.forEach((t, k) => { const c = G.cells[order[k]]; c.type = t; if (t === 'trap' || t === 'ambush') c.traps = [{ kind: 'spike', lv: 1 }]; });
      G.kin = G.kin.slice(0, 3); G.kin.forEach((m, k) => { m.loc = order[k + 1]; m.pin = true; }); G.prison = [{ kind: 'militia', vill: 'gaet' }, { kind: 'priest', vill: 'bell' }]; G.corpses = [{ kind: 'villager' }, { kind: 'militia' }, { kind: 'villager' }]; __nest.ST.roam = {}; }, [types, main, st]); await p.waitForTimeout(300); };
  if (want('r1')) { await allRooms(['trap', 'post', 'hall', 'bighall', 'ambush', 'decoy', 'shop', 'prison', 'chapel', 'altar'], null, 0); await shot('r1'); }
  if (want('r2')) { await allRooms(['pool', 'sluice', 'library', 'warp', 'hatchery', 'fleshwall', 'stage', 'abattoir', 'prison', 'chapel'], null, 0); await shot('r2'); }
  if (want('r3')) { await allRooms(['trap', 'post', 'hall', 'bighall', 'ambush', 'decoy', 'shop', 'prison', 'chapel', 'altar'], 'dusk', 3); await shot('r3'); }
  if (want('r4')) { await allRooms(['pool', 'sluice', 'library', 'warp', 'hatchery', 'fleshwall', 'stage', 'abattoir', 'prison', 'chapel'], 'abyss', 3); await shot('r4'); }

  for (let k = 0; k < 5; k++) for (const st of [1, 2, 4]) { const n = AS[k] + st; if (!want(n)) continue; await setup(AS[k], st, st >= 2 ? AS[(k + 2) % 5] : null); await shot(n); }
  console.log(devName || 'pc', errs.length ? '오류: ' + [...new Set(errs)].slice(0, 4).join(' / ') : 'no errors'); await b.close();
})();
