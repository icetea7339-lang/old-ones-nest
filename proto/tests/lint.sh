#!/bin/sh
# 줄 끝 주석이 뒤의 코드를 삼킨 곳을 찾는다 (같은 실수를 세 번 했다): 주석 안에 문장처럼 보이는 코드가 이어지는 줄
# 짓는 파일(build.list)만 본다. src/old/ 는 보지 않는다.
cd "$(dirname "$0")/.."
. ./build.list
# 문법 검사: 짓는 파일 하나라도 문법이 깨지면 실패
for f in $RULES $UI src/maze.js src/mazeui.js; do node --check "$f" 2>&1 | head -3 && node --check "$f" >/dev/null 2>&1 || { echo "문법 오류: $f"; exit 1; }; done
PAT="//[^'\"]*[가-힣][^'\"]* (for \(|if \(|const [a-zA-Z_]+ =|let [a-zA-Z_]+ =|return [a-zA-Z_(]|[A-Za-z_.]+\(G[,)]|[A-Za-z_.\[\]]+ = [A-Za-z_(]|[A-Za-z_]+\+\+;)"
grep -nE "$PAT" $RULES $UI src/maze.js src/mazeui.js | cut -c1-220
N=$(cat $RULES $UI src/maze.js src/mazeui.js | grep -cE "$PAT")
echo "주석이 삼킨 것으로 보이는 줄: $N"
[ "$N" -eq 0 ]
