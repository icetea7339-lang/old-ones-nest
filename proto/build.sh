#!/bin/sh
# src/ 의 규칙·화면·스타일을 한 파일로 합친다. 짓는 파일과 순서는 build.list 에 있다.
#   index.html      틀 없는 조각 (아티팩트 게시용)
#   ../PLAY-GAME.html  더블클릭으로 여는 완성 파일
# 내린 옛 판(카드 판·이야기·자유 판·한 방울·흐름 판)의 파일은 src/old/ 와 tests/old/ 에 있고 짓지 않는다.
cd "$(dirname "$0")"
. ./build.list
{
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  echo '<title>옛 것의 둥지</title>'
  echo '<style>'
  printf '@font-face { font-family: "Nest Sans"; font-weight: 400; font-display: swap; src: url(data:font/woff2;base64,'; base64 -w0 fonts/NestSans-Regular.woff2; echo ') format("woff2"); }'
  printf '@font-face { font-family: "Nest Sans"; font-weight: 600 900; font-display: swap; src: url(data:font/woff2;base64,'; base64 -w0 fonts/NestSans-Bold.woff2; echo ') format("woff2"); }'
  cat src/style.css src/flow.css; echo '</style>'
  cat <<'HTML'
<div id="title" class="screen">
  <canvas id="tcv" class="px" width="384" height="173" role="img" aria-label="둥지의 안쪽. 본체와 권속 몇이 숨을 쉰다."></canvas>
  <h1>옛 것의 둥지</h1>
  <nav id="menu"></nav>
  <p id="nojs">버튼이 보이지 않나요? 지금 보는 화면은 파일 미리보기라서 게임이 실행되지 않습니다. 보낸 사람에게 인터넷 주소(링크)를 받아 사파리나 크롬에서 열어 주세요.</p>
</div>
<div id="toast" hidden></div>
<div id="rotate">휴대폰을 세로로 돌려 주세요</div>
<div id="modal" hidden></div>
HTML
  echo "<script>window.onerror = function (m, src, line) { var e = document.getElementById('nojs'); if (e) { e.hidden = false; e.textContent = '이 브라우저에서 게임을 시작하지 못했습니다 (' + m + ', ' + line + '줄). 이 문구를 보낸 사람에게 알려 주세요.'; } };</script>"
  echo '<script>'; cat $RULES; echo '</script>'
  echo '<script>(function () {'; echo "'use strict';"; cat $UI; echo '})();</script>'
} > index.html
{ echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"><meta name="theme-color" content="#14172a"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">'; cat index.html | sed -n '1,/<\/style>/p'; echo '</head><body style="margin:0">'; sed -n '/<\/style>/,$p' index.html | sed '1d'; echo '</body></html>'; } > ../PLAY-GAME.html
cp index.html nest.html
# 굴 짓기 맛보기: 같은 글꼴, 첫 화면 틀만 쓰고 규칙·화면은 maze 쪽
{
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  echo '<title>굴 짓기</title>'
  echo '<style>'
  printf '@font-face { font-family: "Nest Sans"; font-weight: 400; font-display: swap; src: url(data:font/woff2;base64,'; base64 -w0 fonts/NestSans-Regular.woff2; echo ') format("woff2"); }'
  printf '@font-face { font-family: "Nest Sans"; font-weight: 600 900; font-display: swap; src: url(data:font/woff2;base64,'; base64 -w0 fonts/NestSans-Bold.woff2; echo ') format("woff2"); }'
  cat $MAZE_CSS; echo '</style>'
  cat <<'HTML'
<div id="title" class="screen">
  <h1>굴 짓기</h1>
  <nav id="menu"></nav>
  <p id="nojs">버튼이 보이지 않나요? 지금 보는 화면은 파일 미리보기라서 게임이 실행되지 않습니다. 보낸 사람에게 인터넷 주소(링크)를 받아 사파리나 크롬에서 열어 주세요.</p>
</div>
<div id="toast" hidden></div>
<div id="rotate">휴대폰을 세로로 돌려 주세요</div>
<div id="modal" hidden></div>
HTML
  echo "<script>window.onerror = function (m, src, line) { var e = document.getElementById('nojs'); if (e) { e.hidden = false; e.textContent = '이 브라우저에서 게임을 시작하지 못했습니다 (' + m + ', ' + line + '줄). 이 문구를 보낸 사람에게 알려 주세요.'; } };</script>"
  echo '<script>'; cat $MAZE_RULES; echo '</script>'
  echo '<script>(function () {'; echo "'use strict';"; cat $MAZE_UI; echo '})();</script>'
} > maze.html
{ echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"><meta name="theme-color" content="#14172a"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">'; sed -n '1,/<\/style>/p' maze.html; echo '</head><body style="margin:0">'; sed -n '/<\/style>/,$p' maze.html | sed '1d'; echo '</body></html>'; } > ../PLAY-MAZE.html
wc -c index.html ../PLAY-GAME.html maze.html ../PLAY-MAZE.html
