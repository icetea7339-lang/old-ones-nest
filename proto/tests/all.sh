#!/bin/sh
# 짓고, 지은 판(../PLAY-GAME.html)에 대한 시험을 모두 돌린다. 시험마다 한 줄씩 적고, 하나라도 실패하면 1 로 끝난다.
#   sh tests/all.sh        자세한 출력은 tests/_log/<이름>.log
cd "$(dirname "$0")/.."
LOG=tests/_log; mkdir -p "$LOG"; : > "$LOG/failed"; : > "$LOG/count"
run() { name="$1"; shift; echo "$name" >> "$LOG/count"; if timeout 320 "$@" > "$LOG/$name.log" 2>&1; then echo "통과  $name"; else echo "실패  $name  ($LOG/$name.log)"; echo "$name" >> "$LOG/failed"; fi; }
run build sh build.sh
run lint sh tests/lint.sh
run voice node tests/voice.js
run lairrules node tests/lairrules.js
# 화면 시험은 기기별로 나란히 돌린다
run lairui_pc node tests/lairui.js &
run lairui_iphone14 node tests/lairui.js "iPhone 14" &
run lairui_a360 node tests/lairui.js a360 &
run lairui_a360_fz13 env FZ=1.3 node tests/lairui.js a360 &
wait
run shell_pc node tests/shell.js &
run shell_iphone14 node tests/shell.js "iPhone 14" &
run shell_a360 node tests/shell.js a360 &
run shell_a360_fz13 env FZ=1.3 node tests/shell.js a360 &
run intro_pc node tests/intro.js &
run intro_iphone14 node tests/intro.js "iPhone 14" &
wait
# 빠르기 시험은 혼자 돌린다
run lairperf node tests/lairperf.js
N=$(wc -l < "$LOG/count"); B=$(wc -l < "$LOG/failed")
if [ "$B" -eq 0 ]; then echo "모두 통과 ($N)"; else echo "실패 $B / $N"; exit 1; fi
