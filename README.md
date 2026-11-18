# 옛 것의 둥지 (가제)

별에서 떨어진 점액 한 방울이, 먹은 것대로 변해 옛 신이 되는 둥지 경영 로그라이트. 웹 프로토타입.

**플레이: https://icetea7339-lang.github.io/old-ones-nest/**

PC와 휴대폰(세로 화면) 브라우저에서 열린다. 진행은 그 브라우저에 자동 저장된다.

## 구성

- `index.html` — 게임 전체가 들어 있는 한 파일. 위 주소가 이 파일을 연다.
- `proto/src/` — 소스. `logic.js`(규칙), `art.js`·`stage.js`·`ui.js`(화면), `style.css`, `bot.js`(자동 플레이어).
- `proto/build.sh` — 소스를 한 파일로 묶는다. 묶은 뒤 `PLAY-GAME.html`을 `index.html`로 복사한다.

```bash
cd proto && ./build.sh && cp ../PLAY-GAME.html ../index.html
node src/bot.js 300
```
