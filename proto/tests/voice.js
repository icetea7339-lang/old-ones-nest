// 문체 검사 (scratchpad style_voice.md): 게임 글에서 수다스러운 반말·느낌표·옛 낱말을 찾는다.  node tests/voice.js
// 글자 묶음(따옴표 안의 한글)만 본다. 주석은 보지 않는다. 사람(포로·마을 사람)의 말은 큰따옴표 “…” 또는 "…" 안에 두면 넘어간다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
// 짓는 파일(build.list)만 본다. 소리와 그림만 있는 파일은 건너뛴다
const BUILT = (fs.readFileSync(path.join(ROOT, 'build.list'), 'utf8').match(/src\/[A-Za-z0-9_]+\.js/g) || []).map(f => f.slice(4));
const SKIP = new Set(['audio.js']);
const RULES = [
  [/그래[.,]/, '그래'], [/괜찮아/, '괜찮아'], [/들었지/, '들었지'], [/[가-힣]거든[.?]/, '~거든.'], [/잖아/, '~잖아'],
  [/해 ?봐|눌러 봐|가 봐[.']|올라가 봐/, '~해 봐'], [/돋운다|돋워|돋운 /, '돋운다'],
  [/[가-힣](?:거야|이야|잖아)[.?…]/, '반말 끝맺음(~거야/~이야)'], [/[가-힣](?:야|어|아|지|네)[.?](?:\s|$)/, '반말 끝맺음'],
  [/[가-힣]!/, '느낌표'], [/배고프지\?/, '배고프지?'], [/짜잔|ㅋ/, '장난말'],
];
// 반말 끝맺음 규칙에 걸리지만 문어로 맞는 것 (예: "-하리라" 아님, 사람 이름 등)
const ALLOW = [/꿈에서 들은 그 물소리/, /너, 너였구나/, /^\s*$/];
const strip = t => t.replace(/\$\{[^}]*\}/g, ' ').replace(/<[^>]+>/g, ' ').replace(/"[^"]*"|“[^”]*”/g, ' ');
let bad = 0;
for (const f of BUILT.filter(x => !SKIP.has(x))) {
  const src = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').split('\n').map(l => /^\s*\/\//.test(l) ? '' : l.replace(/\s\/\/ [^'`"]*$/, '')).join('\n');
  const strs = src.match(/'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || [];
  for (const raw of strs) {
    if (!/[가-힣]/.test(raw)) continue;
    const t = strip(raw);
    if (ALLOW.some(a => a.test(t))) continue;
    for (const [re, why] of RULES) if (re.test(t)) { bad++; if (bad <= 40) console.log(f + ' · ' + why + ' · ' + t.slice(0, 90).replace(/\s+/g, ' ')); break; }
  }
}
console.log(bad ? '문체 어긋남 ' + bad : '문체 검사 통과 (' + BUILT.length + '개 파일)');
process.exit(bad ? 1 : 0);
