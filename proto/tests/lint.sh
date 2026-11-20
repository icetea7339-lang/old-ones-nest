#!/bin/sh
# 줄 끝 주석이 뒤의 코드를 삼킨 곳을 찾는다 (같은 실수를 세 번 했다): 주석 안에 문장처럼 보이는 코드가 이어지는 줄
cd "$(dirname "$0")/.."
grep -nE "//[^'\"]*[가-힣][^'\"]* (for \(|if \(|const [a-zA-Z_]+ =|let [a-zA-Z_]+ =|return [a-zA-Z_(]|[A-Za-z_.]+\(G[,)]|[A-Za-z_.\[\]]+ = [A-Za-z_(]|[A-Za-z_]+\+\+;)" src/*.js | cut -c1-220
echo "주석이 삼킨 것으로 보이는 줄: $(grep -cE "//[^'\"]*[가-힣][^'\"]* (for \(|if \(|const [a-zA-Z_]+ =|let [a-zA-Z_]+ =|return [a-zA-Z_(]|[A-Za-z_.]+\(G[,)]|[A-Za-z_.\[\]]+ = [A-Za-z_(]|[A-Za-z_]+\+\+;)" src/*.js | awk -F: '{s+=$2} END {print s}')"
