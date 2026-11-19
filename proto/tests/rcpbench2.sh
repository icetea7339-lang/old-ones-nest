#!/bin/sh
# 돈·포로·신앙 쪽 조합: 클리어율 대신 재물, 점수, 포로 수로 견준다
cd /home/user/slime-ipo-design/proto
N=${1:-600}; D=${2:-1}
for r in $3; do
  for off in "" 1; do
    out=$(GIVE=$r NORCP=$off node src/bot.js $N mix $D)
    a=$(echo "$out" | grep -o '클리어 [0-9]*% | 평균 재물 [0-9]* 점수 [0-9]*')
    b=$(echo "$out" | grep -o '포로 [0-9.]* 개종 [0-9.]*')
    echo "$r ${off:+끔}${off:-켬}: $a | $b"
  done
done
