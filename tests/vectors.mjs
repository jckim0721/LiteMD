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
