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
  { id: 'E10', key: 'Enter', before: '- 상위⏎⇥- 탭 하위▮', after: '- 상위⏎⇥- 탭 하위⏎⇥- ▮', note: '탭 들여쓰기 유지(v5: 부모 항목을 붙임 — 부모 없는 탭 줄은 코드 블록)' },
  { id: 'E11', key: 'Enter', before: '- 기저▮귀', after: '- 기저⏎- ▮귀', note: '줄 중간: 뒷부분이 새 항목으로' },
  { id: 'E12', key: 'Enter', before: '- 가▮나다▮라', after: '- 가⏎- ▮라', note: '선택은 지우고 이어쓰기' },
  { id: 'E13', key: 'Enter', before: '- ▮', after: '▮', note: '빈 최상위 항목: 기호 지우고 목록 끝' },
  { id: 'E14', key: 'Enter', before: '  - ▮', after: '- ▮', note: '빈 하위 항목: 한 단계 내어쓰기' },
  { id: 'E15', key: 'Enter', before: '- 상위⏎⇥- ▮', after: '- 상위⏎- ▮', note: '빈 하위 항목(탭, v5: 부모 항목을 붙임)' },
  { id: 'E16', key: 'Enter', before: '- [ ] ▮', after: '▮', note: '빈 할 일 항목' },
  { id: 'E17', key: 'Enter', before: '1. ▮', after: '▮', note: '빈 번호 항목' },
  { id: 'E18', key: 'Enter', before: '제목⏎- 첫째▮⏎- 셋째', after: '제목⏎- 첫째⏎- ▮⏎- 셋째', note: '문서 중간 줄' },
  { id: 'E19', key: 'Enter', before: '일반 문장▮', after: null, note: '목록이 아니면 기본 줄바꿈' },
  { id: 'E20', key: 'Enter', before: '▮- 항목', after: null, note: '커서가 기호 앞' },
  { id: 'E21', key: 'Enter', before: '-▮ 항목', after: null, note: '커서가 기호 안쪽' },
  { id: 'E22', key: 'Enter', before: '-항목▮', after: null, note: '기호 뒤 공백 없음' },
  { id: 'E23', key: 'Enter', before: '- - -▮', after: null, note: '수평선은 목록 아님' },
  { id: 'E24', key: 'Enter', before: '**굵게** 시작▮', after: null, note: '**는 목록 아님' },
  { id: 'E25', key: 'Enter', before: '- 상위⏎  ⇥- ▮', after: '- 상위⏎  - ▮', note: '빈 하위 항목: 끝의 탭을 뺀다(v5.1)' },

  { id: 'T01', key: 'Tab', before: '- 항▮목', after: '  - 항▮목', note: '커서 위치와 상관없이 줄 전체' },
  { id: 'T02', key: 'Tab', before: '▮- 첫째⏎- 둘째▮', after: '  ▮- 첫째⏎  - 둘째▮', note: '여러 줄 선택' },
  { id: 'T03', key: 'Tab', before: '▮- 첫째⏎▮- 둘째', after: '  ▮- 첫째⏎▮- 둘째', note: '다음 줄 맨 앞에서 끝난 선택은 그 줄 제외' },
  { id: 'T04', key: 'Tab', before: '▮- 첫째⏎⏎- 셋째▮', after: '  ▮- 첫째⏎⏎  - 셋째▮', note: '여러 줄일 때 빈 줄은 건너뜀' },
  { id: 'T05', key: 'Tab', before: '▮', after: '  ▮', note: '빈 문서' },
  { id: 'T06', key: 'Tab', before: '▮⏎- 항목', after: '  ▮⏎- 항목', note: '맨 앞 빈 줄(오프셋 0 경계)' },
  { id: 'T07', key: 'Tab', before: '▮⏎⏎▮', after: null, note: '여러 줄이 모두 빈 줄이면 그대로' },
  // v5.1 — 들여쓰기 끝에 넣는다. 탭으로 끝나면 탭(공백을 탭 앞에 붙이면 마크다운 깊이가 그대로라 읽기 화면에서 안 들어갔다)
  { id: 'T08', key: 'Tab', before: '- 상위⏎⇥- 하▮위', after: '- 상위⏎⇥⇥- 하▮위', note: '탭으로 끝나면 탭' },
  { id: 'T09', key: 'Tab', before: '- 상위⏎  ⇥- 섞▮임', after: '- 상위⏎  ⇥⇥- 섞▮임', note: '공백2+탭도 탭으로 끝난다' },
  { id: 'T10', key: 'Tab', before: '- 상위⏎⇥  - 섞▮임', after: '- 상위⏎⇥    - 섞▮임', note: '공백으로 끝나면 공백 2칸(들여쓰기 끝에)' },
  { id: 'T11', key: 'Tab', before: '▮- 상위⏎⇥- 하위▮', after: '  ▮- 상위⏎⇥⇥- 하위▮', note: '여러 줄: 줄마다 제 들여쓰기대로' },

  { id: 'S01', key: 'Shift+Tab', before: '  - 항▮목', after: '- 항▮목', note: '공백 2칸 제거' },
  { id: 'S02', key: 'Shift+Tab', before: '- 항목▮', after: null, note: '지울 게 없으면 그대로' },
  { id: 'S03', key: 'Shift+Tab', before: '⇥- 탭▮', after: '- 탭▮', note: '탭 1개 제거' },
  { id: 'S04', key: 'Shift+Tab', before: ' - 한 칸▮', after: '- 한 칸▮', note: '1칸만 있으면 1칸' },
  { id: 'S05', key: 'Shift+Tab', before: '    - 네 칸▮', after: '  - 네 칸▮', note: '한 번에 2칸만' },
  { id: 'S06', key: 'Shift+Tab', before: ' ▮ - 커서가 들여쓰기 안', after: '▮- 커서가 들여쓰기 안', note: '지운 칸 안의 커서는 줄 맨 앞으로' },
  { id: 'S07', key: 'Shift+Tab', before: '▮  - 첫째⏎- 둘째⏎    - 셋째▮', after: '▮- 첫째⏎- 둘째⏎  - 셋째▮', note: '여러 줄: 줄마다 따로' },
  // v5.1 — 들여쓰기 끝에서 뺀다. 탭으로 끝나면 탭 1개, 아니면 끝의 공백 최대 2칸
  { id: 'S08', key: 'Shift+Tab', before: '- 상위⏎  ⇥- 섞▮임', after: '- 상위⏎  - 섞▮임', note: '끝의 탭을 뺀다(v5까지는 앞 공백 2칸 → 같은 깊이)' },
  { id: 'S09', key: 'Shift+Tab', before: '- 상위⏎⇥  - 섞▮임', after: '- 상위⏎⇥- 섞▮임', note: '끝의 공백 2칸' },
  { id: 'S10', key: 'Shift+Tab', before: '- 상위⏎⇥- 중간⏎⇥⇥- 하▮위', after: '- 상위⏎⇥- 중간⏎⇥- 하▮위', note: '탭 두 개 → 하나' },
  { id: 'S11', key: 'Shift+Tab', before: '- 상위⏎⇥ ▮ - 가', after: '- 상위⏎⇥▮- 가', note: '지운 칸 안의 커서는 지운 자리로' },

  // v5 코드 블록 안 Enter·인용 Enter·인용 Tab — 볼트 `LiteMD_v5_작업계획서` §6 CE·QE·QT 표와 같아야 한다
  { id: 'CE01', key: 'Enter', before: '```js▮', after: '```js⏎▮⏎```', note: '닫히지 않은 블록: 닫는 울타리' },
  { id: 'CE02', key: 'Enter', before: '```js▮⏎a⏎```', after: '```js⏎▮⏎a⏎```', note: '닫힌 블록의 여는 줄: 줄만 바꿈' },
  { id: 'CE03', key: 'Enter', before: '```⏎  if (a) {▮⏎```', after: '```⏎  if (a) {⏎  ▮⏎```', note: '들여쓰기 이어가기' },
  { id: 'CE04', key: 'Enter', before: '```⏎- 항목▮⏎```', after: '```⏎- 항목⏎▮⏎```', note: '코드 속 - 는 목록 아님' },
  { id: 'CE05', key: 'Enter', before: '```⏎> 글▮⏎```', after: '```⏎> 글⏎▮⏎```', note: '코드 속 > 는 인용 아님' },
  { id: 'CE06', key: 'Enter', before: '```⏎  ▮  a⏎```', after: '```⏎  ⏎  ▮  a⏎```', note: '커서가 들여쓰기 안: 커서 앞까지만' },
  { id: 'CE07', key: 'Enter', before: '```⏎a▮b⏎```', after: '```⏎a⏎▮b⏎```', note: '코드 줄 중간' },
  { id: 'CE08', key: 'Enter', before: '```⏎⇥x▮⏎```', after: '```⏎⇥x⏎⇥▮⏎```', note: '탭 들여쓰기' },
  { id: 'CE09', key: 'Enter', before: '```⏎a⏎```▮', after: null, note: '닫는 울타리 줄은 블록 밖 규칙' },
  { id: 'CE10', key: 'Enter', before: '~~~▮', after: '~~~⏎▮⏎~~~', note: '물결 울타리' },
  { id: 'CE11', key: 'Enter', before: '````md▮', after: '````md⏎▮⏎````', note: '네 개면 네 개로 닫음' },
  { id: 'CE12', key: 'Enter', before: '- 항목⏎  ```py▮', after: '- 항목⏎  ```py⏎  ▮⏎  ```', note: '목록 안: 울타리 앞 들여쓰기까지' },
  { id: 'CE13', key: 'Enter', before: '> ```js▮', after: '> ```js⏎> ▮⏎> ```', note: '인용 안: 울타리 앞 표시까지' },
  { id: 'CE14', key: 'Enter', before: '> ```js⏎>   a▮⏎> ```', after: '> ```js⏎>   a⏎>   ▮⏎> ```', note: '인용 안 코드 줄' },
  { id: 'CE15', key: 'Enter', before: '```js▮⏎글⏎```py⏎b⏎```', after: '```js⏎▮⏎```⏎글⏎```py⏎b⏎```', note: '다른 블록 위에 새 블록' },
  { id: 'CE16', key: 'Enter', before: '    a▮', after: '    a⏎    ▮', note: '들여쓴 코드 블록' },
  { id: 'CE17', key: 'Enter', before: '    - a▮', after: '    - a⏎    ▮', note: '들여쓴 코드 속 - 도 목록 아님' },
  { id: 'CE18', key: 'Enter', before: '```⏎a▮b▮c⏎```', after: '```⏎a⏎▮c⏎```', note: '코드 안 선택은 지우고' },
  { id: 'CE19', key: 'Enter', before: '```js▮x', after: '```js⏎▮x', note: '여는 줄 끝이 아니면 닫지 않는다' },

  { id: 'QE01', key: 'Enter', before: '> 인용▮', after: '> 인용⏎> ▮', note: '인용 이어쓰기' },
  { id: 'QE02', key: 'Enter', before: '> > 겹침▮', after: '> > 겹침⏎> > ▮', note: '겹친 인용' },
  { id: 'QE03', key: 'Enter', before: '>붙임▮', after: '>붙임⏎>▮', note: '인용 표시는 쓴 그대로' },
  { id: 'QE04', key: 'Enter', before: '> ▮', after: '▮', note: '빈 인용 줄: 인용 끝' },
  { id: 'QE05', key: 'Enter', before: '> > ▮', after: '> ▮', note: '빈 겹친 인용: 한 단계만' },
  { id: 'QE06', key: 'Enter', before: '>▮', after: '▮', note: '공백 없는 빈 인용' },
  { id: 'QE07', key: 'Enter', before: '> - 항목▮', after: '> - 항목⏎> - ▮', note: '인용 안 목록' },
  { id: 'QE08', key: 'Enter', before: '> 1. 첫째▮', after: '> 1. 첫째⏎> 2. ▮', note: '인용 안 번호 +1' },
  { id: 'QE09', key: 'Enter', before: '> - [x] 끝▮', after: '> - [x] 끝⏎> - [ ] ▮', note: '인용 안 할 일은 빈 칸으로' },
  { id: 'QE10', key: 'Enter', before: '> - ▮', after: '> ▮', note: '인용 안 빈 항목: 기호만 지움' },
  { id: 'QE11', key: 'Enter', before: '>   - ▮', after: '> - ▮', note: '인용 안 빈 하위 항목: 내어쓰기' },
  { id: 'QE12', key: 'Enter', before: '> - [ ] ▮', after: '> ▮', note: '인용 안 빈 할 일' },
  { id: 'QE13', key: 'Enter', before: '> 가▮나', after: '> 가⏎> ▮나', note: '인용 줄 중간' },
  { id: 'QE14', key: 'Enter', before: '> 가▮나다▮라', after: '> 가⏎> ▮라', note: '인용 줄 선택' },
  { id: 'QE15', key: 'Enter', before: '▮> 인용', after: null, note: '인용 표시 앞' },
  { id: 'QE16', key: 'Enter', before: '>▮ 인용', after: null, note: '인용 표시 안' },
  { id: 'QE17', key: 'Enter', before: '글⏎> 가▮⏎> 나', after: '글⏎> 가⏎> ▮⏎> 나', note: '문서 중간 인용' },
  { id: 'QE18', key: 'Enter', before: '> ---▮', after: '> ---⏎> ▮', note: '인용 안 가로줄은 목록 아님' },

  { id: 'QT01', key: 'Tab', before: '> - 항▮목', after: '>   - 항▮목', note: '인용 표시 뒤를 들여쓴다' },
  { id: 'QT02', key: 'Shift+Tab', before: '>   - 하위▮', after: '> - 하위▮', note: '인용 표시 뒤를 내어쓴다' },
  { id: 'QT03', key: 'Shift+Tab', before: '> - 항목▮', after: null, note: '인용 표시는 안 지운다' },
  { id: 'QT04', key: 'Tab', before: '▮> 가⏎> 나▮', after: '▮>   가⏎>   나▮', note: '여러 인용 줄, 표시 앞 커서는 그대로' },
  { id: 'QT05', key: 'Tab', before: '▮> 가⏎>⏎> 나▮', after: '▮>   가⏎>⏎>   나▮', note: '여러 줄일 때 빈 인용 줄은 건너뜀' },
  { id: 'QT06', key: 'Shift+Tab', before: '>  ▮ - 가', after: '> ▮- 가', note: '지운 칸 안의 커서는 인용 표시 뒤로' },
  { id: 'QT07', key: 'Tab', before: '> - 상위⏎> ⇥- 하▮위', after: '> - 상위⏎> ⇥⇥- 하▮위', note: '인용 안: 표시 뒤 들여쓰기 끝에(v5.1)' },
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

// v3 라이브 프리뷰 — 볼트 `LiteMD_v3_작업계획서` §6 LP 표와 같아야 한다(LP18~는 v5 표).
// expect: 줄마다 보이는 글을 ' ⏎ '로 이은 것. ☐·☑ = 체크박스, • = 글머리, ─── = 가로선, ⟨js⟩ = 여는 울타리 자리
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
  { id: 'LP11', doc: '```⏎# 코드 속⏎```⏎▮', expect: '⟨⟩ ⏎ # 코드 속 ⏎  ⏎ ', note: '코드 블록 안은 안 건드림(v5: 울타리는 숨김)' },
  { id: 'LP12', doc: '#태그 글⏎▮', expect: '#태그 글 ⏎ ', note: '태그는 헤딩 아님' },
  { id: 'LP13', doc: '▮# 가⏎# 나▮⏎# 다', expect: '# 가 ⏎ # 나 ⏎ 다', note: '선택이 걸친 줄은 다 원문' },
  { id: 'LP14', doc: '![그림](a.png)⏎▮', expect: '![그림](a.png) ⏎ ', note: '이미지는 그대로' },
  { id: 'LP15', doc: '## **굵은** 제목⏎▮', expect: '굵은 제목 ⏎ ', note: '헤딩 안 강조' },
  { id: 'LP16', doc: '\\*별\\*⏎▮', expect: '*별* ⏎ ', note: '이스케이프' },
  { id: 'LP17', doc: '- [ ] **중요** 할 일⏎▮', expect: '☐ 중요 할 일 ⏎ ', note: '할 일 안 강조' },
  { id: 'LP18', doc: '```js⏎a⏎```⏎▮', expect: '⟨js⟩ ⏎ a ⏎  ⏎ ', note: '울타리 숨김' },
  { id: 'LP19', doc: '```js⏎a▮⏎```', expect: '⟨js⟩ ⏎ a ⏎ ', note: '커서가 코드 줄: 울타리는 숨긴 채' },
  { id: 'LP20', doc: '```js▮⏎a⏎```', expect: '```js ⏎ a ⏎ ', note: '여는 줄에 커서: 원문' },
  { id: 'LP21', doc: '~~~⏎a⏎~~~⏎▮', expect: '⟨⟩ ⏎ a ⏎  ⏎ ', note: '물결·언어 없음' },
  { id: 'LP22', doc: '```py⏎a▮', expect: '⟨py⟩ ⏎ a', note: '닫히지 않은 블록' },
  { id: 'LP23', doc: '- 항목⏎  ```js⏎  a⏎  ```⏎▮', expect: '• 항목 ⏎   ⟨js⟩ ⏎   a ⏎    ⏎ ', note: '목록 안 코드' },
  { id: 'LP24', doc: '> ```js⏎> a⏎> ```⏎▮', expect: '⟨js⟩ ⏎ a ⏎  ⏎ ', note: '인용 안 코드: 인용 표시도 숨김' },
  { id: 'LP25', doc: '```js title⏎a⏎```⏎▮', expect: '⟨js⟩ ⏎ a ⏎  ⏎ ', note: '정보 글 첫 단어' },
  { id: 'LP26', doc: '- [ ] 할 일▮', expect: '☐ 할 일', note: '커서 줄도 체크박스' },
  { id: 'LP27', doc: '▮- [ ] 할 일', expect: '- [ ] 할 일', note: '표시 바로 앞: 원문' },
  { id: 'LP28', doc: '  - 하위▮', expect: '  • 하위', note: '커서 줄도 글머리' },
  { id: 'LP29', doc: '> 인용▮', expect: '인용', note: '커서 줄도 인용 표시 숨김' },
  { id: 'LP30', doc: '▮> 인용', expect: '> 인용', note: '인용 표시 앞' },
  { id: 'LP31', doc: '> > 겹침▮', expect: '겹침', note: '겹친 인용' },
  { id: 'LP32', doc: '- [ ] **굵게**▮', expect: '☐ **굵게**', note: '다른 기호는 커서 줄 원문 그대로' },
  { id: 'LP33', doc: '▮- [ ] 가⏎- [ ] 나▮', expect: '- [ ] 가 ⏎ - [ ] 나', note: '선택이 표시에 걸친 줄' },
  { id: 'LP34', doc: '- [ ] 가▮나▮', expect: '☐ 가나', note: '선택이 글에만' },
  { id: 'LP35', doc: '  ▮- 하위', expect: '  - 하위', note: '들여쓴 항목의 표시 바로 앞' },
  { id: 'LP36', doc: '▮  - 하위', expect: '  • 하위', note: '들여쓰기 앞은 표시에 안 닿음' },
  { id: 'LP37', doc: '> - [ ] 할 일▮', expect: '☐ 할 일', note: '인용 안 할 일' },
  { id: 'LP38', doc: '- ▮', expect: '• ', note: '빈 항목' },
  // v5.1 줄 앞부분 탭 칸 — 볼트 `LiteMD_v5.1_작업계획서` §6. · = 탭 칸 한 칸, ⇥ = 그대로 둔 탭
  { id: 'LP39', doc: '- [ ] 부모⏎⇥- [ ] 탭 하위⏎▮', expect: '☐ 부모 ⏎ ··☐ 탭 하위 ⏎ ', note: '줄 앞 탭은 2칸짜리 칸' },
  { id: 'LP40', doc: '- [ ] 부모⏎⇥- [ ] 탭▮ 하위', expect: '☐ 부모 ⏎ ··☐ 탭 하위', note: '커서 줄에서도' },
  { id: 'LP41', doc: '- 부모⏎  ⇥- 섞임⏎▮', expect: '• 부모 ⏎   ··• 섞임 ⏎ ', note: '공백 2칸 뒤 탭 = 2칸' },
  { id: 'LP42', doc: '- 부모⏎ ⇥- 홀수⏎▮', expect: '• 부모 ⏎  ·• 홀수 ⏎ ', note: '공백 1칸 뒤 탭 = 1칸' },
  { id: 'LP43', doc: '```⏎⇥a⏎```⏎▮', expect: '⟨⟩ ⏎ ··a ⏎  ⏎ ', note: '코드 줄 앞 탭도' },
  { id: 'LP44', doc: '- 가⇥나⏎▮', expect: '• 가⇥나 ⏎ ', note: '글 가운데 탭은 그대로' },
  { id: 'LP45', doc: '- 부모⏎▮⇥- [ ] 할 일', expect: '• 부모 ⏎ ··☐ 할 일', note: '탭 앞 커서: 표시에 안 닿음' },
  { id: 'LP46', doc: '- 부모⏎⇥▮- [ ] 할 일', expect: '• 부모 ⏎ ··- [ ] 할 일', note: '표시에 닿으면 표시만 원문, 탭 칸은 그대로' },
  { id: 'LP47', doc: '-⇥[ ] 할 일⏎▮', expect: '☐ 할 일 ⏎ ', note: '할 일 표시 안의 탭은 표시가 덮는다' },
  { id: 'LP48', doc: '- [ ]⇥할 일⏎▮', expect: '☐ ·할 일 ⏎ ', note: '할 일 칸 뒤 탭(5칸 뒤 → 1칸)' },
];

// v5 코드 상자 줄 모양 — 볼트 `LiteMD_v5_작업계획서` §6 CB 표. f 울타리 줄, c 내용 줄, ^ 위 모서리, _ 아래 모서리, - 코드 아님
export const boxVectors = [
  { id: 'CB01', doc: '```js⏎a⏎b⏎```', expect: 'f^ c c f_' },
  { id: 'CB02', doc: '```js⏎a', expect: 'f^ c_' },
  { id: 'CB03', doc: '    a⏎    b', expect: 'c^ c_' },
  { id: 'CB04', doc: '    a', expect: 'c^_' },
  { id: 'CB05', doc: '글⏎```⏎```⏎끝', expect: '- f^ f_ -' },
  { id: 'CB06', doc: '> ```js⏎> a⏎> ```', expect: 'f^ c f_' },
  { id: 'CB07', doc: '```js', expect: 'f^_' },
];

// v5 인용 깊이 — 볼트 `LiteMD_v5_작업계획서` §6 QD 표. 줄마다 막대 수
export const depthVectors = [
  { id: 'QD01', doc: '> a⏎> > b⏎c', expect: '1 2 0' },
  { id: 'QD02', doc: '> a⏎>⏎> b', expect: '1 1 1' },
  { id: 'QD03', doc: '> > > 셋', expect: '3' },
  { id: 'QD04', doc: '> a⏎계속', expect: '1 0' },
  { id: 'QD05', doc: '> ```js⏎> a⏎> ```', expect: '1 1 1' },
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

// v5.1 줄 앞부분 탭 칸 — 볼트 `LiteMD_v5.1_작업계획서` §6 TB 표. prefixTabs(줄, 2)의 '위치:칸 수'를 띄어 쓴 것, 없으면 '없음'
export const tabVectors = [
  { id: 'TB01', line: '⇥- [ ] 할 일', expect: '0:2', note: '줄 맨 앞 탭 = 2칸' },
  { id: 'TB02', line: '  ⇥- 섞임', expect: '2:2', note: '공백 2칸 뒤' },
  { id: 'TB03', line: ' ⇥- 홀수', expect: '1:1', note: '공백 1칸 뒤 = 1칸' },
  { id: 'TB04', line: '⇥⇥- 두 단계', expect: '0:2 1:2', note: '탭 둘' },
  { id: 'TB05', line: '⇥1. 번호', expect: '0:2', note: '번호 목록' },
  { id: 'TB06', line: '⇥코드', expect: '0:2', note: '목록 아닌 들여쓴 줄' },
  { id: 'TB07', line: '- [ ]⇥할 일', expect: '5:1', note: '할 일 칸 뒤' },
  { id: 'TB08', line: '- 가⇥나', expect: '없음', note: '글 가운데 탭' },
  { id: 'TB09', line: '⇥', expect: '0:2', note: '탭만 있는 줄' },
  { id: 'TB10', line: '> ⇥- 인용', expect: '없음', note: '인용 줄은 맞춤 대상이 아니다' },
];

// v5 색칠 토큰 — 볼트 `LiteMD_v5_작업계획서` §6 HL 표와 같아야 한다.
// expect: {k|키워드} {s|문자열} {c|주석} {n|숫자}로 감싼 코드, ⏎ = 줄바꿈
export const highlightVectors = [
  { id: 'HL01', lang: 'js', code: 'const a = "글"; // 끝', expect: '{k|const} a = {s|"글"}; {c|// 끝}' },
  { id: 'HL02', lang: 'js', code: 'let t = `a${b}`;⏎x = 0x1F + 1.5e3', expect: '{k|let} t = {s|`a${b}`};⏎x = {n|0x1F} + {n|1.5e3}' },
  { id: 'HL03', lang: 'js', code: 'a1 + 2', expect: 'a1 + {n|2}' },
  { id: 'HL04', lang: 'js', code: '"a\\"b" c', expect: '{s|"a\\"b"} c' },
  { id: 'HL05', lang: 'js', code: '"끝없음⏎x', expect: '{s|"끝없음}⏎x' },
  { id: 'HL06', lang: 'cpp', code: '#include "a.h"⏎int main() { return 0; }', expect: '{k|#include} {s|"a.h"}⏎{k|int} main() { {k|return} {n|0}; }' },
  { id: 'HL07', lang: 'cpp', code: '/* 여러⏎줄 */ x', expect: '{c|/* 여러⏎줄 */} x' },
  { id: 'HL08', lang: 'cpp', code: 'void __fastcall TForm1::Go(TObject *Sender)', expect: '{k|void} {k|__fastcall} TForm1::Go(TObject *Sender)' },
  { id: 'HL09', lang: 'cs', code: 'var p = @"C:\\";', expect: '{k|var} p = {s|@"C:\\"};' },
  { id: 'HL10', lang: 'cs', code: '#region 이름', expect: '{k|#region} 이름' },
  { id: 'HL11', lang: 'java', code: 'public static void main(String[] a) {}', expect: '{k|public} {k|static} {k|void} main(String[] a) {}' },
  { id: 'HL12', lang: 'ts', code: 'let n: number = 1;', expect: '{k|let} n: {k|number} = {n|1};' },
  { id: 'HL13', lang: 'py', code: 'def f():⏎    """설명"""  # 주석', expect: '{k|def} f():⏎    {s|"""설명"""}  {c|# 주석}' },
  { id: 'HL14', lang: 'py', code: 'x = None if a else True', expect: 'x = {k|None} {k|if} a {k|else} {k|True}' },
  { id: 'HL15', lang: 'sql', code: "SELECT * FROM t WHERE a = 'it''s' -- 끝", expect: "{k|SELECT} * {k|FROM} t {k|WHERE} a = {s|'it''s'} {c|-- 끝}" },
  { id: 'HL16', lang: 'sh', code: 'echo "$HOME" # 주석⏎a#b', expect: '{k|echo} {s|"$HOME"} {c|# 주석}⏎a#b' },
  { id: 'HL17', lang: 'powershell', code: "if ($a -eq $true) { 'y' } # c", expect: "{k|if} ($a -eq {k|$true}) { {s|'y'} } {c|# c}" },
  { id: 'HL18', lang: 'json', code: '{"a": 1, "b": [true, null]}', expect: '{{s|"a"}: {n|1}, {s|"b"}: [{k|true}, {k|null}]}' },
  { id: 'HL19', lang: 'xml', code: '<a href="x">글</a><!-- c -->', expect: '{k|<a} href={s|"x"}>글{k|</a}>{c|<!-- c -->}' },
  { id: 'HL20', lang: 'html', code: "<p>it's</p>", expect: "{k|<p}>it's{k|</p}>" },
  { id: 'HL21', lang: 'yaml', code: 'on: true # c⏎name: "x"', expect: 'on: {k|true} {c|# c}⏎name: {s|"x"}' },
  { id: 'HL22', lang: 'C++', code: 'int x', expect: '{k|int} x' },
  { id: 'HL23', lang: 'C#', code: 'string s', expect: '{k|string} s' },
  { id: 'HL24', lang: 'text', code: 'if 1', expect: 'if 1' },
  { id: 'HL25', lang: '', code: 'if 1', expect: 'if 1' },
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
  { id: 'R10', md: '```js⏎x < 1⏎```', html: '<pre><code class="language-js">x &lt; <span class="tk-n">1</span></code></pre>' }, // v5: 색칠
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
  // v5 — 볼트 `LiteMD_v5_작업계획서` §6 R 표
  {
    id: 'R21', md: '- 항목⏎  ```py⏎  def f():⏎      pass⏎  ```',
    html: '<ul><li>항목<pre><code class="language-py"><span class="tk-k">def</span> f():\n    <span class="tk-k">pass</span></code></pre></li></ul>',
  },
  { id: 'R22', md: '> ```js⏎> let a⏎> ```', html: '<blockquote><pre><code class="language-js"><span class="tk-k">let</span> a</code></pre></blockquote>' },
  { id: 'R23', md: '```js title="x"⏎a⏎```', html: '<pre><code class="language-js">a</code></pre>' },
  { id: 'R24', md: '```text⏎if 1⏎```', html: '<pre><code class="language-text">if 1</code></pre>' },
  { id: 'R25', md: '```js⏎"<b>"⏎```', html: '<pre><code class="language-js"><span class="tk-s">&quot;&lt;b&gt;&quot;</span></code></pre>' },
  { id: 'R26', md: '> a⏎> > b', html: '<blockquote><p>a</p><blockquote><p>b</p></blockquote></blockquote>' },
  { id: 'R27', md: '    a⏎⏎    b', html: '<pre><code>a\n\nb</code></pre>' },
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
