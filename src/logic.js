// 순수 함수 — DOM도 CodeMirror도 쓰지 않는다. tests/logic.test.mjs가 Node에서 그대로 불러 쓴다.
// v1(index.html의 logic 블록)에서 옮겨 왔고 동작은 같다. 오프셋은 UTF-16 단위(CodeMirror 문서 오프셋과 같다).

// 줄 앞 공백 · 글머리표(- * +) 또는 번호(1. 1)) · 공백 · (있으면) 할 일 칸 [ ] [x]
const LIST_RE = /^([ \t]*)(?:([-*+])|(\d{1,9})([.)]))([ \t]+)(\[[ xX]\](?:[ \t]+|$))?/;
// 수평선(- - - · *** · ___)은 목록으로 보지 않는다
const HR_RE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
// 인용 표시 하나: > 앞 공백 0~3칸, 뒤 공백 한 칸까지
const QUOTE_MARK = / {0,3}>[ ]?/y;

export function parseItem(line) {
  if (HR_RE.test(line)) return null;
  const m = LIST_RE.exec(line);
  if (!m) return null;
  return { indent: m[1], bullet: m[2] || '', num: m[3] || '', delim: m[4] || '', space: m[5], box: m[6] || '', end: m[0].length };
}

// 줄 앞 인용 표시(> 여러 개)와 그 마지막 표시가 시작하는 곳. 인용이 아니면 q는 ''
export function quotePrefix(line) {
  let end = 0;
  let last = 0;
  QUOTE_MARK.lastIndex = 0;
  while (QUOTE_MARK.exec(line)) {
    last = end;
    end = QUOTE_MARK.lastIndex;
  }
  return { q: line.slice(0, end), last };
}

// 화면에서 꺾인 줄을 맞출 글 시작 위치(글자 수): 줄 앞 공백·탭 + 목록 표시·공백·할 일 칸. 없으면 0(수평선 포함)
export function hangPrefix(line) {
  const it = parseItem(line);
  if (it) return it.end;
  return HR_RE.test(line) ? 0 : indentOf(line).length;
}

// 줄 앞부분(hangPrefix)의 탭마다 [글자 위치, 칸 수](v5.1). 칸 수 = 다음 탭 자리(size칸마다)까지, 줄 맨 앞부터 센다.
// 화면은 이 칸 수로 폭을 고정해 그린다 — CSS 탭은 꺾인 줄 맞춤의 padding을 따라 폭이 바뀌어 잴 때마다 출렁였다
export function prefixTabs(line, size) {
  const out = [];
  const n = hangPrefix(line);
  for (let i = 0, col = 0; i < n; i++) {
    if (line[i] !== '\t') {
      col++;
      continue;
    }
    const cols = size - (col % size);
    out.push([i, cols]);
    col += cols;
  }
  return out;
}

// 줄 앞 들여쓰기(공백·탭)
function indentOf(line) {
  return /^[ \t]*/.exec(line)[0];
}

function lineStartOf(text, pos) {
  return pos <= 0 ? 0 : text.lastIndexOf('\n', pos - 1) + 1;
}

function lineEndOf(text, pos) {
  const i = text.indexOf('\n', pos);
  return i < 0 ? text.length : i;
}

// 들여쓰기 한 단계(v5.1): 들여쓰기 끝에 넣고 끝에서 뺀다. 탭으로 끝나면 탭 1개, 아니면 공백 2칸(빼기는 끝의 공백 최대 2칸).
// v5까지는 줄 맨 앞에서 넣고 뺐는데, 탭 앞의 공백은 탭에 묻혀서 마크다운 깊이(탭 = 4칸 단위)가 그대로였다
const indentUnit = indent => (indent.endsWith('\t') ? '\t' : '  ');

// 들여쓰기 안에서 지울 칸 [시작, 끝)
function outdentRange(indent) {
  const end = indent.length;
  if (indent.endsWith('\t')) return [end - 1, end];
  let start = end;
  while (start > end - 2 && indent[start - 1] === ' ') start--;
  return [start, end];
}

// 목록·인용 이어쓰기(v5부터 인용도). 인용 줄은 표시(> )를 떼고 나머지에 목록 규칙을 쓴 뒤 표시를 다시 붙인다
export function listEnter(text, s, e) {
  const ls = lineStartOf(text, s);
  const line = text.slice(ls, lineEndOf(text, s));
  const { q, last } = quotePrefix(line);
  const rest = line.slice(q.length);
  const it = parseItem(rest);
  const at = ls + q.length; // 인용 표시 뒤
  if ((!q && !it) || s < at + (it ? it.end : 0)) return null; // 목록·인용이 아니거나 커서가 표시 앞·안
  if (s === e && rest.slice(it ? it.end : 0).trim() === '') {
    if (!it) {
      // 빈 인용 줄: 인용 한 단계를 뗀다
      const keep = q.slice(0, last);
      return { from: ls, to: ls + line.length, insert: keep, selStart: ls + keep.length, selEnd: ls + keep.length };
    }
    // 빈 항목: 들여쓴 항목은 한 단계 내어쓰고(Shift+Tab과 같은 칸), 최상위 항목은 기호를 지워 목록을 끝낸다(인용 표시는 남긴다)
    if (!it.indent) return { from: at, to: at + rest.length, insert: '', selStart: at, selEnd: at };
    const [a, b] = outdentRange(it.indent);
    return { from: at + a, to: at + b, insert: '', selStart: s - (b - a), selEnd: s - (b - a) };
  }
  const marker = it ? it.indent + (it.bullet || (Number(it.num) + 1) + it.delim) + it.space + (it.box ? '[ ] ' : '') : '';
  const prefix = '\n' + q + marker;
  const pos = s + prefix.length;
  return { from: s, to: e, insert: prefix, selStart: pos, selEnd: pos };
}

// 선택이 걸친 줄 범위. 선택이 다음 줄 맨 앞에서 끝나면 그 줄은 뺀다.
function lineSpan(text, s, e) {
  const last = e > s && lineStartOf(text, e) === e ? e - 1 : e;
  return { from: lineStartOf(text, s), to: lineEndOf(text, last) };
}

// 줄마다 fn을 적용하고, 늘거나 준 칸만큼 선택 위치를 보정한다. 바뀐 줄이 없으면 null.
// 인용 줄은 표시(> ) 뒤에 적용한다(v5) — fn은 표시를 뗀 나머지를 받는다
function mapLines(text, s, e, fn) {
  const { from, to } = lineSpan(text, s, e);
  const lines = text.slice(from, to).split('\n');
  const shifts = []; // [원래 글에서 바뀐 자리, 늘어난 칸 수(지웠으면 음수)]
  let at = from;
  const out = lines.map(line => {
    const { q } = quotePrefix(line);
    const rest = line.slice(q.length);
    const next = fn(rest, lines.length);
    let k = 0; // 바뀐 자리 = 앞에서부터 같은 글자 수(들여쓰기 끝, v5.1)
    while (k < rest.length && rest[k] === next[k]) k++;
    shifts.push([at + q.length + k, next.length - rest.length]);
    at += line.length + 1;
    return q + next;
  });
  if (shifts.every(([, d]) => d === 0)) return null;
  const move = p => {
    let q = p;
    for (const [start, d] of shifts) {
      if (start > p) break;
      q += d > 0 ? d : -Math.min(-d, p - start); // 지운 칸 안에 있던 위치는 줄 맨 앞(인용 줄은 표시 뒤)으로
    }
    return q;
  };
  return { from, to, insert: out.join('\n'), selStart: move(s), selEnd: move(e) };
}

export function indentLines(text, s, e) {
  return mapLines(text, s, e, (line, count) => {
    if (count > 1 && line === '') return line;
    const indent = indentOf(line);
    return indent + indentUnit(indent) + line.slice(indent.length);
  });
}

export function outdentLines(text, s, e) {
  return mapLines(text, s, e, line => {
    const [a, b] = outdentRange(indentOf(line));
    return line.slice(0, a) + line.slice(b);
  });
}

// 앞뒤 공통 글자를 잘라 실제로 바뀐 부분만 남긴다(Ctrl+Z 뒤 커서가 덜 튄다). 서로게이트 쌍은 쪼개지 않는다.
export function trimEdit(text, ed) {
  const old = text.slice(ed.from, ed.to), ins = ed.insert;
  let a = 0;
  while (a < old.length && a < ins.length && old[a] === ins[a]) a++;
  if (a && /[\uD800-\uDBFF]/.test(old[a - 1])) a--;
  let b = 0;
  while (b < old.length - a && b < ins.length - a && old[old.length - 1 - b] === ins[ins.length - 1 - b]) b++;
  if (b && /[\uDC00-\uDFFF]/.test(old[old.length - b])) b--;
  return { ...ed, from: ed.from + a, to: ed.to - b, insert: ins.slice(a, ins.length - b) };
}

export function detectEol(raw) {
  return raw.includes('\r\n') ? '\r\n' : '\n';
}

export function normalizeEol(raw) {
  return raw.replace(/\r\n?/g, '\n');
}

export function toEol(text, eol) {
  return eol === '\n' ? text : text.replace(/\n/g, eol);
}

// 단축키 글자. 라틴 글자면 key를 쓰고(드보락 등), 한글 입력 모드처럼 아니면 물리 키(code)로 읽는다.
export function shortcutKey(key, code) {
  if (/^[a-z]$/i.test(key)) return key.toLowerCase();
  return /^Key[A-Z]$/.test(code) ? code.slice(3).toLowerCase() : '';
}

// 탐색기에 보일 항목: 점으로 시작하지 않고, 폴더이거나 마크다운·텍스트 파일
export function isListed(name, kind) {
  if (name.startsWith('.')) return false;
  return kind === 'directory' || /\.(md|markdown|txt)$/i.test(name);
}

// 폴더 먼저, 그다음 한국어 이름순(숫자는 크기대로, 대소문자 무시)
export function compareEntries(a, b) {
  if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
  return a.name.localeCompare(b.name, 'ko', { numeric: true, sensitivity: 'base' });
}

// 레벨 접기 대상: 레벨 n 이상인 헤딩을 위에서부터 고르되, 앞서 고른 섹션 안에 든 헤딩은 건너뛴다.
// headings는 문서 순서. 섹션은 서로 겹치지 않거나 포함 관계뿐이라 마지막으로 고른 섹션 끝만 보면 된다.
export function levelFoldTargets(headings, n) {
  const out = [];
  let coveredTo = -1;
  for (const h of headings) {
    if (h.pos <= coveredTo || h.level < n) continue;
    out.push(h);
    coveredTo = h.to;
  }
  return out;
}
