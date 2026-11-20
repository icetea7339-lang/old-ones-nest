#!/bin/sh
# src/ 의 규칙·화면·스타일을 한 파일로 합친다.
#   index.html      틀 없는 조각 (아티팩트 게시용)
#   ../PLAY-GAME.html  더블클릭으로 여는 완성 파일
cd "$(dirname "$0")"
{
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  echo '<title>옛 것의 둥지</title>'
  echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=IBM+Plex+Sans+KR:wght@400;600&display=swap">'
  echo '<style>'
  printf '@font-face { font-family: "NestPix"; font-weight: 400; font-display: swap; src: url(data:font/woff2;base64,'; base64 -w0 fonts/NestPix.woff2; echo ') format("woff2"); }'
  cat src/style.css; echo '</style>'
  cat <<'HTML'
<div id="title" class="screen">
  <canvas id="tcv" class="px" width="320" height="150" role="img" aria-label="별이 떨어지는 밤, 동굴 앞의 점액 한 방울"></canvas>
  <h1>옛 것의 둥지</h1>
  <p class="tag small">별에서 떨어진 것이, 먹은 것대로 변해 옛 것이 된다. 40일 뒤 별이 서는 밤까지.</p>
  <nav id="menu"></nav>
  <p id="nojs" class="tag small">버튼이 보이지 않나요? 지금 보는 화면은 파일 미리보기라서 게임이 실행되지 않습니다. 보낸 사람에게 인터넷 주소(링크)를 받아 사파리나 크롬에서 열어 주세요.</p>
  <p class="small mute" id="trec"></p>
</div>
<div id="game" class="screen" hidden>
  <header id="hud"></header>
  <div id="main">
    <section id="left">
      <div id="stagewrap">
        <canvas id="stage" width="960" height="550" role="img" aria-label="둥지 지도. 지하의 칸, 지상의 마을과 길목을 누르면 할 수 있는 일이 나옵니다."></canvas>
        <div id="viewsw"><button class="btn sm" id="corebtn" data-a="core" title="본체 방을 연다">본체</button><button class="btn sm" data-a="view" data-v="surface" aria-pressed="false">지상</button><button class="btn sm" data-a="view" data-v="under" aria-pressed="true">지하</button></div>
      </div>
      <div class="card" id="coach" hidden></div>
      <p class="small mute" id="stagetip"></p>
      <div id="tray" class="row"></div>
      <div id="fore"></div>
      <div class="card" id="recent"></div>
    </section>
    <section id="right">
      <div class="card" id="coach2" hidden></div>
      <main id="view"></main>
      <footer id="foot"></footer>
      <section id="night" class="card" hidden>
        <div class="row nw"><h3 class="grow" id="ntitle">밤</h3>
          <button class="chip on" data-a="speed" data-v="1">1배</button><button class="chip" data-a="speed" data-v="2">2배</button><button class="chip" data-a="speed" data-v="4">4배</button><button class="btn sm" data-a="skip">건너뛰기 <kbd>S</kbd></button></div>
        <div id="nparty" class="row"></div>
        <div id="hand" class="card" hidden></div>
        <div id="nlog"></div>
      </section>
    </section>
  </div>
  <nav id="mnav"></nav>
</div>
<div id="toast"></div>
<div id="rotate">휴대폰을 세로로 돌려 주세요</div>
<div id="scene" hidden></div>
<div id="modal" hidden></div>
HTML
  echo "<script>window.onerror = function (m, src, line) { var e = document.getElementById('nojs'); if (e) e.textContent = '이 브라우저에서 게임을 시작하지 못했습니다 (' + m + ', ' + line + '줄). 이 문구를 보낸 사람에게 알려 주세요.'; };</script>"
  echo '<script>'; cat src/logic.js src/steward.js; echo '</script>'
  echo '<script>(function () {'; echo "'use strict';"; cat src/art.js src/audio.js src/monsters.js src/lineage.js src/seeds.js src/kinart.js src/kinart3.js src/worldart.js src/heroart.js src/worldscene.js src/stage.js src/prologue.js src/prologue2.js src/ui.js; echo '})();</script>'
} > index.html
{ echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"><meta name="theme-color" content="#14172a"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">'; cat index.html | sed -n '1,/<\/style>/p'; echo '</head><body style="margin:0">'; sed -n '/<\/style>/,$p' index.html | sed '1d'; echo '</body></html>'; } > ../PLAY-GAME.html
cp index.html nest.html
wc -c index.html ../PLAY-GAME.html
