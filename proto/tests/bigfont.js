// 큰 글씨 검사: 휴대폰에서 글자를 키운 채로(카카오톡 안 브라우저의 "가가" 같은) 화면마다 잘리거나 겹친 글을 찾는다.
// node tests/bigfont.js [배율=1.3] [기기들=a360,a412,iPhone 14]
//   ux.js 와 story.js 를 FZ=배율 로 돌리고, 한 방울(첫 카드·윗줄·부위 달기·끝 카드)과 도움말의 「처음 하는 법」은 여기서 직접 찍는다.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), pw = require('playwright'), FZM = require('./_fz.js');
const K = +(process.argv[2] || 1.3), DEVS = (process.argv[3] || 'a360,a412,iPhone 14').split(','), html = fs.readFileSync(path.join(__dirname, '..', '..', 'PLAY-GAME.html'), 'utf8');
const run = (file, dev) => new Promise(res => { const c = spawn('node', [path.join(__dirname, file), dev], { env: Object.assign({}, process.env, { FZ: String(K) }) }); let out = ''; c.stdout.on('data', d => { out += d; }); c.stderr.on('data', d => { out += d; }); c.on('close', code => res({ file, dev, code, out })); });
async function own(dev) {
  const b = await pw.chromium.launch(), ctx = await FZM.context(b, dev), p = await ctx.newPage(), bad = [], errs = [], dir = path.join(__dirname, 'bigfont_' + dev.replace(/\s+/g, '') + '_' + K); fs.mkdirSync(dir, { recursive: true });
  p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(FZM.initScript(K));
  await p.route('http://nest.test/', r => r.fulfill({ contentType: 'text/html', body: html })); await p.route(/fonts\./, r => r.abort());
  await p.goto('http://nest.test/'); await p.waitForTimeout(400); let n = 0;
  const shot = async label => { await p.waitForTimeout(300); const cl = await p.evaluate(FZM.clipScript); n++; await p.screenshot({ path: path.join(dir, String(n).padStart(2, '0') + '_' + label + '.png') }); if (cl.length) bad.push(label + ' 잘린 글 ' + cl.length + ': ' + cl.slice(0, 6).join(' / ')); };
  await shot('title');
  await p.evaluate(() => document.querySelector('[data-a="help"]').click()); await shot('help_howto'); await p.evaluate(() => document.querySelector('#modal [data-a="close"]').click());
  // 한 방울
  await p.evaluate(() => { __nest.META.howto = {}; window.__r = null; runPrologue({ asp: 'abyss', seed: 48, look: 'twin' }).then(r => { window.__r = r; }); }); await shot('pro_intro');
  await p.evaluate(() => { const g = document.querySelector('#pro-in-go'); if (g) g.click(); __pro.manual = true; __pro.step(20); }); await shot('pro_hud');
  await p.evaluate(() => { const s = __pro.sim; s.S.purse.abyss = 9; s.S.purse.dusk = 5; __pro.openShop(); }); await shot('pro_shop');
  await p.evaluate(() => { const x = document.querySelector('#pro-shop [data-x="close"], #pro-shop [data-x="x"]'); if (x) x.click(); __pro.end('grown'); }); await shot('pro_end');
  await b.close(); return { dev, bad, errs };
}
(async () => {
  const jobs = []; if (!process.env.OWNONLY) for (const d of DEVS) { jobs.push(run('ux.js', d)); jobs.push(run('story.js', d)); }
  const res = await Promise.all(jobs); let fail = 0;
  for (const r of res) { const tail = r.out.trim().split('\n'), i = tail.findIndex(l => /· 화면 \d+ 개/.test(l)); const body = i >= 0 ? tail.slice(i).filter(l => !/←/.test(l) && !/^말줄임/.test(l)).join('\n') : tail.slice(-8).join('\n'); const ok = /잘린 화면 없음/.test(body) && !/오류|Error/.test(body); if (!ok) fail++; console.log((ok ? '통과 ' : '실패 ') + r.file + ' ' + r.dev + '\n' + (ok ? '' : body + '\n')); }
  for (const d of DEVS) { const r = await own(d); if (r.bad.length || r.errs.length) fail++; console.log((r.bad.length || r.errs.length ? '실패 ' : '통과 ') + '한 방울·도움말 ' + d + (r.bad.length ? '\n  ' + r.bad.join('\n  ') : '') + (r.errs.length ? '\n  오류 ' + r.errs.join(' / ') : '')); }
  console.log(fail ? '큰 글씨 ' + K + '배: 실패 ' + fail : '큰 글씨 ' + K + '배: 모두 통과'); process.exitCode = fail ? 1 : 0;
})();
