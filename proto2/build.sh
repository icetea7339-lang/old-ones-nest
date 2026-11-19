#!/bin/sh
# 새 판 시험 "땅속 한 칸"을 한 파일로 묶는다.
#   burrow.html          틀 없는 조각 (아티팩트 게시용)
#   ../PLAY-BURROW.html  더블클릭으로 여는 완성 파일
# 본체 그림은 원래 게임의 조각 도구(../proto/src/monsters.js)를 그대로 쓴다.
cd "$(dirname "$0")"
{
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  echo '<title>땅속 한 칸</title>'
  echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;600&display=swap">'
  echo '<style>'
  printf '@font-face { font-family: "NestPix"; font-weight: 400; font-display: swap; src: url(data:font/woff2;base64,'; base64 -w0 ../proto/fonts/NestPix.woff2; echo ') format("woff2"); }'
  cat src/style.css; echo '</style>'
  cat <<'HTML'
<div id="bw">
  <header id="bw-hud"></header>
  <canvas id="bw-cv" role="img" aria-label="땅의 단면. 본체와 권속들이 판 굴이 보인다. 끌어서 둘러보고, 흙을 누르면 권속들이 그쪽을 판다."></canvas>
  <p id="bw-log" aria-live="polite"></p>
  <nav id="bw-ctl"></nav>
</div>
<div id="bw-modal" hidden></div>
HTML
  echo '<script>(function () {'; echo "'use strict';"; cat src/pal.js ../proto/src/monsters.js src/sim.js src/view.js; echo '})();</script>'
} > burrow.html
{ echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"><meta name="theme-color" content="#0d0a12"></head><body>'; cat burrow.html; echo '</body></html>'; } > ../PLAY-BURROW.html
wc -c burrow.html
