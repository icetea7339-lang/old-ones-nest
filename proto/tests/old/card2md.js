// cards2.md 를 만든다: 카드 목록, 여는 조건, 배치 족보, 괴물 몸 함정, 바늘 점.  node tests/card2md.js [출력 경로]
const fs = require('fs'), S = require('../src/logic.js'), CM = require('../src/cardmode.js'), CD = require('../src/cards2.js');
const out = process.argv[2] || '/tmp/claude-0/-home-user-old-ones-nest/3f27d994-873b-53a8-8dbc-9e7b2cfe68eb/scratchpad/cards2.md';
const L = [];
L.push('# 카드로 짓는 판 — 카드 목록', '', '총 ' + CD.LIST.length + '장. 희귀: 처음/보통/드묾/옛것급/저주. 값은 진액(판의 세기를 곱한다). 기술은 밤에 신앙으로 쓴다.', '');
const by = (k, f) => { const o = {}; CD.LIST.forEach(d => { const v = f(d); o[v] = (o[v] || 0) + 1; }); return Object.keys(o).map(x => x + ' ' + o[x]).join(' · '); };
L.push('- 종류: ' + by('t', d => CD.TYPEN[d.type]), '- 빛깔: ' + by('a', d => CD.ASPN[d.asp]), '- 희귀: ' + by('r', d => CD.RARN[d.rar]), '- 처음부터 열림: ' + CD.LIST.filter(d => !d.unlock && d.type !== 'curse').length + '장 · 조건 ' + Object.keys(CD.UNLOCK).length + '가지 (도전 ' + Object.values(CD.UNLOCK).filter(u => u.hard).length + ')', '');
L.push('## 처음 덱', ''); CD.ASPS.forEach(a => L.push('- ' + CD.ASPN[a] + ': ' + CD.START[a].map(id => CD.BY[id].name).join(', '))); L.push('');
L.push('## 꼬리표 (' + CD.TAGS.length + ')', '', CD.TAGS.map(t => t + ' ' + CD.tagged(t).length).join(' · '), '');
L.push('## 배치 족보', ''); for (const k in S.CMB) L.push('- **' + S.CMB[k].name + '**: ' + S.CMB[k].desc); L.push('');
L.push('## 괴물 몸 함정 (부위)', ''); Object.keys(S.TRAP).filter(k => S.TRAP[k].card).forEach(k => L.push('- **' + S.TRAP[k].name + '**: ' + S.TRAP[k].desc)); L.push('');
L.push('## 카드', '', '| id | 이름 | 종류 | 빛깔 | 값 | 희귀 | 효과 | 꼬리표 | 열리는 조건 |', '|---|---|---|---|---|---|---|---|---|');
CD.LIST.forEach(d => L.push('| ' + d.id + ' | ' + d.name + ' | ' + CD.TYPEN[d.type] + ' | ' + CD.ASPN[d.asp] + ' | ' + d.cost + ' | ' + CD.RARN[d.rar] + ' | ' + d.text + ' | ' + d.tags.join(' ') + ' | ' + (d.unlock ? CD.UNLOCK[d.unlock].text + (CD.UNLOCK[d.unlock].hard ? ' (도전)' : '') : '처음부터') + ' |'));
L.push('', '## 강화', '', '- 굴·기관·부위·축복: 값 ×0.75, 부위는 레벨 +1, 기관은 레벨 2로 돋는다, 축복은 ×1.5', '- 권속: 레벨 +2로 든다', '- 기술: 세기 ×1.3, 신앙 ×0.8', '');
L.push('## 바늘 점', '', '별 다섯(빛깔 × 별자리 ' + CM.SIGNS.length + ')을 셋·하나·하나로 열고, 덮인 바늘 둘과 합쳐 일곱 장 중 다섯으로 본다. 걸 것: 진액 · 신앙 · 권속 카드.', '', '| 별 | 몫 | 덤 |', '|---|---|---|');
CM.NHANDS.forEach(h => L.push('| ' + h.name + ' | ×' + h.pay + ' | ' + (h.extra || '') + ' |'));
fs.writeFileSync(out, L.join('\n') + '\n'); console.log('wrote ' + out + ' (' + L.length + ' lines)');
