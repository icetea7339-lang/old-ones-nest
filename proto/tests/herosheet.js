// 침입자 그림 시트: 세계마다 종류마다 옛 16×16 과 새 24×24 를 4배로, 그리고 책을 쫓는 자 세 단계 (32×32, 얼굴 64×64)
const { chromium } = require('playwright'), path = require('path');
const GAME = 'file://' + path.resolve(__dirname, '../../PLAY-GAME.html'), OUT = path.resolve(__dirname, '../..');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(GAME); await p.waitForTimeout(800);
  for (const bg of ['#14121c', '#4a4a5a']) {
    const url = await p.evaluate(bg => {
      const H = window.__heroart, worlds = ['fantasy', 'wuxia', 'modern', 'future'], kinds = Object.keys(H.WLOOK.fantasy).concat(['firemage', 'banner', 'master', 'shadow', 'crowd', 'lightcrew', 'sentry', 'shielder']).filter((k, i, a) => a.indexOf(k) === i);
      const cw = 4 * 16 + 4 * 24 + 18, ch = 4 * 24 + 8, cols = 4, c = document.createElement('canvas'); c.width = cols * cw * 2 + 20; c.height = Math.ceil(kinds.length / 2) * ch + 40 + 300;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.font = '11px sans-serif';
      kinds.forEach((k, i) => { const col0 = (i % 2) * cols * cw, row = Math.floor(i / 2); worlds.forEach((w, j) => {
        if (!H.WLOOK[w][k] && !['villager'].includes(k) && Object.keys(H.WLOOK[w]).indexOf(k) < 0) { x.fillStyle = '#ffffff22'; x.fillRect(col0 + j * cw + 4, row * ch + 4, cw - 8, ch - 8); return; }
        const ox = col0 + j * cw + 6, oy = row * ch + 4; x.drawImage(H.invCanvas16(w, k), ox, oy + 32, 64, 64); x.drawImage(H.invCanvasW(w, k), ox + 70, oy, 96, 96);
        x.fillStyle = '#e8e0d0'; x.fillText(w.slice(0, 3) + ':' + k, ox, oy + 12); }); });
      const sy = Math.ceil(kinds.length / 2) * ch + 20; for (let s = 0; s < 3; s++) { x.drawImage(H.HEROART.seeker(s), 20 + s * 300, sy, 128, 128); x.drawImage(H.HEROART.seekerFace(s), 150 + s * 300, sy, 128, 128); x.drawImage(H.HEROART.seeker(s), 20 + s * 300, sy + 140, 64, 64); x.drawImage(H.HEROART.seekerFace(s), 90 + s * 300, sy + 140, 64, 64); }
      return c.toDataURL();
    }, bg);
    require('fs').writeFileSync(path.join(OUT, 'herosheet_' + (bg === '#14121c' ? 'dark' : 'mid') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(errs.length ? '오류 ' + errs.slice(0, 3).join(' | ') : '오류 없음'); await b.close();
})();
