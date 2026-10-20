// 검증 예시 — 볼트 `LiteMD_작업계획서` §6 표와 같아야 한다.
// ▮ = 커서(두 개면 선택 시작·끝), ⏎ = 줄바꿈, ⇥ = 탭 문자.
// after가 null이면 '손대지 않음'(Enter는 브라우저 기본 줄바꿈).

export const vectors = [
  { id: 'E01', key: 'Enter', before: '- 기저귀▮', after: '- 기저귀⏎- ▮', note: '글머리표 이어쓰기' },
  { id: 'E02', key: 'Enter', before: '* 분유▮', after: '* 분유⏎* ▮', note: '* 유지' },
  { id: 'E03', key: 'Enter', before: '+ 물티슈▮', after: '+ 물티슈⏎+ ▮', note: '+ 유지' },
  { id: 'E04', key: 'Enter', before: '1. 첫째▮', after: '1. 첫째⏎2. ▮', note: '번호 +1' },
  { id: 'E05', key: 'Enter', before: '9) 아홉▮', after: '9) 아홉⏎10) ▮', note: ') 구분자, 자릿수 증가' },
  { id: 'E06', key: 'Enter', before: '- [x] 끝난 일▮', after: '- [x] 끝난 일⏎- [ ] ▮', note: '체크된 할 일도 빈 칸으로' },
  { id: 'E07', key: 'Enter', before: '- [ ] 할 일▮', after: '- [ ] 할 일⏎- [ ] ▮', note: '할 일 이어쓰기' },
  { id: 'E08', key: 'Enter', before: '1. [ ] 번호 할 일▮', after: '1. [ ] 번호 할 일⏎2. [ ] ▮', note: '번호 + 할 일' },
  { id: 'E09', key: 'Enter', before: '  - 하위▮', after: '  - 하위⏎  - ▮', note: '공백 들여쓰기 유지' },
  { id: 'E10', key: 'Enter', before: '⇥- 탭 하위▮', after: '⇥- 탭 하위⏎⇥- ▮', note: '탭 들여쓰기 유지' },
  { id: 'E11', key: 'Enter', before: '- 기저▮귀', after: '- 기저⏎- ▮귀', note: '줄 중간: 뒷부분이 새 항목으로' },
  { id: 'E12', key: 'Enter', before: '- 가▮나다▮라', after: '- 가⏎- ▮라', note: '선택은 지우고 이어쓰기' },
  { id: 'E13', key: 'Enter', before: '- ▮', after: '▮', note: '빈 최상위 항목: 기호 지우고 목록 끝' },
  { id: 'E14', key: 'Enter', before: '  - ▮', after: '- ▮', note: '빈 하위 항목: 한 단계 내어쓰기' },
  { id: 'E15', key: 'Enter', before: '⇥- ▮', after: '- ▮', note: '빈 하위 항목(탭)' },
  { id: 'E16', key: 'Enter', before: '- [ ] ▮', after: '▮', note: '빈 할 일 항목' },
  { id: 'E17', key: 'Enter', before: '1. ▮', after: '▮', note: '빈 번호 항목' },
  { id: 'E18', key: 'Enter', before: '제목⏎- 첫째▮⏎- 셋째', after: '제목⏎- 첫째⏎- ▮⏎- 셋째', note: '문서 중간 줄' },
  { id: 'E19', key: 'Enter', before: '일반 문장▮', after: null, note: '목록이 아니면 기본 줄바꿈' },
  { id: 'E20', key: 'Enter', before: '▮- 항목', after: null, note: '커서가 기호 앞' },
  { id: 'E21', key: 'Enter', before: '-▮ 항목', after: null, note: '커서가 기호 안쪽' },
  { id: 'E22', key: 'Enter', before: '-항목▮', after: null, note: '기호 뒤 공백 없음' },
  { id: 'E23', key: 'Enter', before: '- - -▮', after: null, note: '수평선은 목록 아님' },
  { id: 'E24', key: 'Enter', before: '**굵게** 시작▮', after: null, note: '**는 목록 아님' },

  { id: 'T01', key: 'Tab', before: '- 항▮목', after: '  - 항▮목', note: '커서 위치와 상관없이 줄 전체' },
  { id: 'T02', key: 'Tab', before: '▮- 첫째⏎- 둘째▮', after: '  ▮- 첫째⏎  - 둘째▮', note: '여러 줄 선택' },
  { id: 'T03', key: 'Tab', before: '▮- 첫째⏎▮- 둘째', after: '  ▮- 첫째⏎▮- 둘째', note: '다음 줄 맨 앞에서 끝난 선택은 그 줄 제외' },
  { id: 'T04', key: 'Tab', before: '▮- 첫째⏎⏎- 셋째▮', after: '  ▮- 첫째⏎⏎  - 셋째▮', note: '여러 줄일 때 빈 줄은 건너뜀' },
  { id: 'T05', key: 'Tab', before: '▮', after: '  ▮', note: '빈 문서' },
  { id: 'T06', key: 'Tab', before: '▮⏎- 항목', after: '  ▮⏎- 항목', note: '맨 앞 빈 줄(오프셋 0 경계)' },
  { id: 'T07', key: 'Tab', before: '▮⏎⏎▮', after: null, note: '여러 줄이 모두 빈 줄이면 그대로' },

  { id: 'S01', key: 'Shift+Tab', before: '  - 항▮목', after: '- 항▮목', note: '공백 2칸 제거' },
  { id: 'S02', key: 'Shift+Tab', before: '- 항목▮', after: null, note: '지울 게 없으면 그대로' },
  { id: 'S03', key: 'Shift+Tab', before: '⇥- 탭▮', after: '- 탭▮', note: '탭 1개 제거' },
  { id: 'S04', key: 'Shift+Tab', before: ' - 한 칸▮', after: '- 한 칸▮', note: '1칸만 있으면 1칸' },
  { id: 'S05', key: 'Shift+Tab', before: '    - 네 칸▮', after: '  - 네 칸▮', note: '한 번에 2칸만' },
  { id: 'S06', key: 'Shift+Tab', before: ' ▮ - 커서가 들여쓰기 안', after: '▮- 커서가 들여쓰기 안', note: '지운 칸 안의 커서는 줄 맨 앞으로' },
  { id: 'S07', key: 'Shift+Tab', before: '▮  - 첫째⏎- 둘째⏎    - 셋째▮', after: '▮- 첫째⏎- 둘째⏎  - 셋째▮', note: '여러 줄: 줄마다 따로' },
];

// 보조 함수 — call은 logic 블록 안에서 그대로 실행되는 식이다
export const helpers = [
  { id: 'P01', call: String.raw`detectEol('a\r\nb')`, expect: '\r\n' },
  { id: 'P02', call: String.raw`detectEol('a\nb')`, expect: '\n' },
  { id: 'P03', call: String.raw`normalizeEol('a\r\nb\rc')`, expect: 'a\nb\nc' },
  { id: 'P04', call: String.raw`toEol('a\nb', '\r\n')`, expect: 'a\r\nb' },
  { id: 'P05', call: `shortcutKey('ㄴ', 'KeyS')`, expect: 's' },
  { id: 'P06', call: `shortcutKey('s', 'KeyS')`, expect: 's' },
  { id: 'P07', call: `shortcutKey('r', 'KeyO')`, expect: 'r' },
  { id: 'P08', call: `shortcutKey('Enter', 'Enter')`, expect: '' },
  { id: 'P09', call: `isListed('노트.md', 'file')`, expect: true },
  { id: 'P10', call: `isListed('README.MD', 'file')`, expect: true },
  { id: 'P11', call: `isListed('사진.png', 'file')`, expect: false },
  { id: 'P12', call: `isListed('.obsidian', 'directory')`, expect: false },
  { id: 'P13', call: `isListed('Projects', 'directory')`, expect: true },
  {
    id: 'P14',
    call: `[['b', 'directory'], ['A', 'directory'], ['나', 'directory'], ['10.md', 'file'], ['2.md', 'file'], ['Z.md', 'file'], ['가.md', 'file']]
      .map(([name, kind]) => ({ name, kind })).sort(compareEntries).map(e => e.name).join(', ')`,
    expect: '나, A, b, 2.md, 10.md, 가.md, Z.md',
  },
];

// v2 헤딩 접기 — 볼트 `LiteMD_v2_작업계획서` §6 표와 같아야 한다.
// expect는 "헤딩(레벨): 숨는 줄 범위"(1부터 센 줄 번호)를 ' · '로 이은 것, 없으면 '없음'
export const headingVectors = [
  { id: 'H01', doc: '# 가⏎본문⏎# 나⏎본문2', expect: '가(1): 2~2 · 나(1): 4~4', note: '같은 레벨에서 끊김' },
  { id: 'H02', doc: '# A⏎## a1⏎x⏎## a2⏎y⏎# B', expect: 'A(1): 2~5 · a1(2): 3~3 · a2(2): 5~5', note: '하위 헤딩 포함, 본문 없는 B는 빠짐' },
  { id: 'H03', doc: '# A⏎```⏎# 코드 주석⏎```⏎끝', expect: 'A(1): 2~5', note: '코드 블록 안 #는 헤딩 아님' },
  { id: 'H04', doc: '#태그⏎본문', expect: '없음', note: '띄어쓰기 없는 #' },
  { id: 'H05', doc: '## A⏎본문⏎⏎⏎## B⏎x', expect: 'A(2): 2~2 · B(2): 6~6', note: '섹션 끝의 빈 줄은 안 접음' },
  { id: 'H06', doc: '# A⏎# B', expect: '없음', note: '본문 없는 헤딩' },
  { id: 'H07', doc: '    # 코드⏎본문', expect: '없음', note: '4칸 들여쓰면 코드' },
  { id: 'H08', doc: '제목⏎===⏎본문', expect: '제목(1): 2~3', note: '밑줄 헤딩 — 밑줄 줄부터 접힌다' },
  { id: 'H09', doc: '## 제목 ##⏎본문', expect: '제목(2): 2~2', note: '닫는 #가 있어도 헤딩' },
];

// 레벨 접기 — 이 문서의 헤딩: A(1) 2~6 · a1(2) 3~4 · a1x(3) 4~4 · a2(2) 6~6 · B(1) 8~9 · b-x(3) 9~9
export const levelDoc = '# A⏎## a1⏎### a1x⏎x⏎## a2⏎y⏎# B⏎### b-x⏎z';
export const levelVectors = [
  { id: 'L01', n: 1, expect: 'A, B', note: 'H1만 보인다' },
  { id: 'L02', n: 2, expect: 'a1, a2, b-x', note: '부모 H2가 없는 H3(b-x)도 접는다' },
  { id: 'L03', n: 3, expect: 'a1x, b-x', note: 'H3 섹션만' },
];

// v3 라이브 프리뷰 — 볼트 `LiteMD_v3_작업계획서` §6 LP 표와 같아야 한다.
// expect: 줄마다 보이는 글을 ' ⏎ '로 이은 것. ☐·☑ = 체크박스, • = 글머리, ─── = 가로선
export const liveVectors = [
  { id: 'LP01', doc: '# 제목⏎본문▮', expect: '제목 ⏎ 본문', note: '커서 없는 줄의 헤딩 기호' },
  { id: 'LP02', doc: '▮# 제목⏎본문', expect: '# 제목 ⏎ 본문', note: '커서 줄은 원문' },
  { id: 'LP03', doc: '**굵게** 와 *기울임* ~~취소~~⏎▮', expect: '굵게 와 기울임 취소 ⏎ ', note: '강조 기호' },
  { id: 'LP04', doc: '- [ ] 할 일⏎- [x] 끝⏎▮', expect: '☐ 할 일 ⏎ ☑ 끝 ⏎ ', note: '할 일' },
  { id: 'LP05', doc: '- 사과⏎  - 배⏎▮', expect: '• 사과 ⏎   • 배 ⏎ ', note: '글머리표, 들여쓰기 유지' },
  { id: 'LP06', doc: '[링크](https://a.b)⏎▮', expect: '링크 ⏎ ', note: '링크는 글만' },
  { id: 'LP07', doc: '`코드` 글⏎▮', expect: '코드 글 ⏎ ', note: '인라인 코드' },
  { id: 'LP08', doc: '> 인용⏎▮', expect: '인용 ⏎ ', note: '인용 기호' },
  { id: 'LP09', doc: '---⏎▮', expect: '─── ⏎ ', note: '수평선' },
  { id: 'LP10', doc: '1. 첫째⏎▮', expect: '1. 첫째 ⏎ ', note: '번호 목록은 그대로' },
  { id: 'LP11', doc: '```⏎# 코드 속⏎```⏎▮', expect: '``` ⏎ # 코드 속 ⏎ ``` ⏎ ', note: '코드 블록 안은 안 건드림' },
  { id: 'LP12', doc: '#태그 글⏎▮', expect: '#태그 글 ⏎ ', note: '태그는 헤딩 아님' },
  { id: 'LP13', doc: '▮# 가⏎# 나▮⏎# 다', expect: '# 가 ⏎ # 나 ⏎ 다', note: '선택이 걸친 줄은 다 원문' },
  { id: 'LP14', doc: '![그림](a.png)⏎▮', expect: '![그림](a.png) ⏎ ', note: '이미지는 그대로' },
  { id: 'LP15', doc: '## **굵은** 제목⏎▮', expect: '굵은 제목 ⏎ ', note: '헤딩 안 강조' },
  { id: 'LP16', doc: '\\*별\\*⏎▮', expect: '*별* ⏎ ', note: '이스케이프' },
  { id: 'LP17', doc: '- [ ] **중요** 할 일⏎▮', expect: '☐ 중요 할 일 ⏎ ', note: '할 일 안 강조' },
];

// v4 꺾인 줄 맞춤 — 볼트 `LiteMD_v4_작업계획서` §6 HP 표와 같아야 한다. ⇥ = 탭
export const hangVectors = [
  { id: 'HP01', line: '그냥 글', expect: 0, note: '들여쓰기 없음' },
  { id: 'HP02', line: '  들여쓴 글', expect: 2, note: '공백' },
  { id: 'HP03', line: '⇥탭 글', expect: 1, note: '탭' },
  { id: 'HP04', line: '- 항목', expect: 2, note: '글머리' },
  { id: 'HP05', line: '    - 하위', expect: 6, note: '들여쓴 글머리' },
  { id: 'HP06', line: '12. 번호', expect: 4, note: '번호' },
  { id: 'HP07', line: '3) 번호', expect: 3, note: '괄호 번호' },
  { id: 'HP08', line: '- [ ] 할 일', expect: 6, note: '할 일 칸' },
  { id: 'HP09', line: '  * [x] 끝', expect: 8, note: '들여쓴 끝난 할 일' },
  { id: 'HP10', line: '-붙임', expect: 0, note: '표시 뒤 공백이 없으면 목록 아님' },
  { id: 'HP11', line: '- - -', expect: 0, note: '수평선' },
  { id: 'HP12', line: '> 인용', expect: 0, note: '인용은 범위 밖' },
  { id: 'HP13', line: '# 제목', expect: 0, note: '헤딩' },
  { id: 'HP14', line: '-   여러 칸', expect: 4, note: '표시 뒤 공백 여러 개' },
  { id: 'HP15', line: '  ⇥섞임', expect: 3, note: '공백·탭이 섞인 들여쓰기' },
];

// v3 읽기 프리뷰 — 볼트 `LiteMD_v3_작업계획서` §6 R 표와 같아야 한다
const A = ' target="_blank" rel="noopener noreferrer"';
export const renderVectors = [
  { id: 'R01', md: '# 제목', html: '<h1>제목</h1>' },
  { id: 'R02', md: '**굵게** *기울임* ~~취소~~ `코드`', html: '<p><strong>굵게</strong> <em>기울임</em> <del>취소</del> <code>코드</code></p>' },
  { id: 'R03', md: '[링크](https://a.b)', html: `<p><a href="https://a.b"${A}>링크</a></p>` },
  { id: 'R04', md: '[나쁜](javascript:alert(1))', html: `<p><a href="#"${A}>나쁜</a></p>` },
  {
    id: 'R05', md: '- [ ] 할 일⏎- [x] 끝',
    html: '<ul><li class="task"><input type="checkbox" disabled> 할 일</li><li class="task"><input type="checkbox" disabled checked> 끝</li></ul>',
  },
  { id: 'R06', md: '- 사과⏎  - 배', html: '<ul><li>사과<ul><li>배</li></ul></li></ul>' },
  { id: 'R07', md: '3. 셋⏎4. 넷', html: '<ol start="3"><li>셋</li><li>넷</li></ol>' },
  { id: 'R08', md: '> 인용', html: '<blockquote><p>인용</p></blockquote>' },
  { id: 'R09', md: '---', html: '<hr>' },
  { id: 'R10', md: '```js⏎x < 1⏎```', html: '<pre><code class="language-js">x &lt; 1</code></pre>' },
  {
    id: 'R11', md: '| a | b |⏎|---|---|⏎| 1 | 2 |',
    html: '<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
  },
  { id: 'R12', md: '<b>굵게</b> <script>x</script>', html: '<p>&lt;b&gt;굵게&lt;/b&gt; &lt;script&gt;x&lt;/script&gt;</p>' },
  { id: 'R13', md: '\\*별\\*', html: '<p>*별*</p>' },
  { id: 'R14', md: '![그림](https://a.b/c.png)', html: '<p><img src="https://a.b/c.png" alt="그림"></p>' },
  { id: 'R15', md: 'https://a.b', html: `<p><a href="https://a.b"${A}>https://a.b</a></p>` },
  { id: 'R16', md: '## **굵은** 제목', html: '<h2><strong>굵은</strong> 제목</h2>' },
  { id: 'R17', md: 'a & b < c', html: '<p>a &amp; b &lt; c</p>' },
  { id: 'R18', md: '첫 줄  ⏎다음', html: '<p>첫 줄<br>다음</p>' },
  { id: 'R19', md: '&amp;', html: '<p>&amp;</p>' },
  { id: 'R20', md: '제목⏎===⏎본문', html: '<h1>제목</h1><p>본문</p>' },
];

// safeUrl 계약(spec §5): 통과하는 것과 '#'로 바뀌는 것
export const urlVectors = [
  ['https://a.b', 'https://a.b'],
  ['mailto:a@b.c', 'mailto:a@b.c'],
  ['노트.md', '노트.md'],
  ['#제목', '#제목'],
  ['JavaScript:alert(1)', '#'],
  [' java\tscript:x', '#'],
  ['data:text/html,x', '#'],
];

// '- 기저귀▮' → { text, s, e }
export function parse(display) {
  const raw = display.replaceAll('⏎', '\n').replaceAll('⇥', '\t');
  const s = raw.indexOf('▮');
  const second = raw.indexOf('▮', s + 1);
  return { text: raw.replaceAll('▮', ''), s, e: second < 0 ? s : second - 1 };
}

// { text, s, e } → '- 기저귀▮'
export function show(text, s, e) {
  const marked = s === e
    ? text.slice(0, s) + '▮' + text.slice(s)
    : text.slice(0, s) + '▮' + text.slice(s, e) + '▮' + text.slice(e);
  return marked.replaceAll('\n', '⏎').replaceAll('\t', '⇥');
}

// 브라우저에서 키를 눌렀을 때 보여야 할 최종 상태. null이면 기본 동작 결과로 바꿔 계산한다.
export function expectedOnScreen(v) {
  if (v.after !== null) return v.after;
  if (v.key !== 'Enter') return v.before; // Tab·Shift+Tab: 그대로(포커스도 안 나감)
  const { text, s, e } = parse(v.before);
  return show(text.slice(0, s) + '\n' + text.slice(e), s + 1, s + 1);
}
