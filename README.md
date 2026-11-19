# 옛 것의 둥지 (가제)

별에서 떨어진 점액 한 방울이, 먹은 것대로 변해 옛 신이 되는 둥지 경영 로그라이트. 웹 프로토타입.

**플레이: https://icetea7339-lang.github.io/old-ones-nest/**

PC와 휴대폰(세로 화면) 브라우저에서 열린다. 진행은 그 브라우저에 자동 저장된다.

## 구성

- `index.html` — 게임 전체가 들어 있는 한 파일. 위 주소가 이 파일을 연다.
- `proto/src/` — 소스. `logic.js`(규칙), `art.js`·`monsters.js`·`lineage.js`·`kinart.js`·`worldart.js`·`worldscene.js`·`stage.js`·`ui.js`(화면. `lineage.js`는 본체가 계통마다 자라는 모습, `kinart.js`는 권속, `worldart.js`는 세계 넷의 침입자), `style.css`, `steward.js`(권속들의 판단. 맡김 방식과 자동 플레이어가 같이 쓴다), `bot.js`(자동 플레이어).
- `proto/build.sh` — 소스를 한 파일로 묶는다. 묶은 뒤 `PLAY-GAME.html`을 `index.html`로 복사한다.
- `proto/fonts/` — 제목·단추용 픽셀 글꼴. `NestPix.woff2`는 Galmuri11 Bold에서 게임에 쓰는 글자만 남긴 것이고, `build.sh`가 게임 파일 안에 넣는다. `subset.py`로 다시 만든다.

```bash
cd proto && ./build.sh && cp ../PLAY-GAME.html ../index.html
node src/bot.js 300
```

## 글꼴

제목·단추·숫자는 [Galmuri11 Bold](https://github.com/quiple/galmuri) (© Lee Minseo, SIL Open Font License 1.1)를 쓴다. 라이선스 전문은 `proto/fonts/OFL-Galmuri.md`. 설명글은 IBM Plex Sans KR(구글 폰트)이다.

## 새 판 시험 (v2)

`proto2/` 는 방향을 바꿔 보는 별도의 시험판 "땅속 한 칸"이다. 땅속 한 칸에서 시작해 본체의 몸에서 권속이 돋아 걸어 다니며 굴을 판다. https://icetea7339-lang.github.io/old-ones-nest/v2/ 에서 열린다. `cd proto2 && ./build.sh && cp ../PLAY-BURROW.html ../v2/index.html`
