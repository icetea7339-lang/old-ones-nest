#!/bin/sh
# 조합별 세기: 같은 합체 권속을 쥐여 주고, 조합 효과를 켠 판과 끈 판의 클리어율을 견준다
cd /home/user/slime-ipo-design/proto
N=${1:-400}; D=${2:-2}; S=${3:-mix}
echo "기준(아무것도 안 줌): $(node src/bot.js $N $S $D | grep -o '클리어 [0-9]*%')"
for r in pray read wall fist choir bud bind briar twice ledger record brawl; do
  on=$(GIVE=$r node src/bot.js $N $S $D | grep -o '클리어 [0-9]*%' | head -1)
  off=$(GIVE=$r NORCP=1 node src/bot.js $N $S $D | grep -o '클리어 [0-9]*%' | head -1)
  echo "$r  켬 $on  끔 $off"
done
