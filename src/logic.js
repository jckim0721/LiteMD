// 순수 함수 — DOM도 CodeMirror도 쓰지 않는다. tests/logic.test.mjs가 Node에서 그대로 불러 쓴다.
// v1(index.html의 logic 블록)에서 옮겨 왔고 동작은 같다. 오프셋은 UTF-16 단위(CodeMirror 문서 오프셋과 같다).

// 줄 앞 공백 · 글머리표(- * +) 또는 번호(1. 1)) · 공백 · (있으면) 할 일 칸 [ ] [x]
const LIST_RE = /^([ \t]*)(?:([-*+])|(\d{1,9})([.)]))([ \t]+)(\[[ xX]\](?:[ \t]+|$))?/;
// 수평선(- - - · *** · ___)은 목록으로 보지 않는다
const HR_RE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;

export function parseItem(line) {
  if (HR_RE.test(line)) return null;
  const m = LIST_RE.exec(line);
  if (!m) return null;
  return { indent: m[1], bullet: m[2] || '', num: m[3] || '', delim: m[4] || '', space: m[5], box: m[6] || '', end: m[0].length };
}

function lineStartOf(text, pos) {
  return pos <= 0 ? 0 : text.lastIndexOf('\n', pos - 1) + 1;
}

function lineEndOf(text, pos) {
  const i = text.indexOf('\n', pos);
  return i < 0 ? text.length : i;
}

// 줄 앞에서 한 번에 지울 칸 수: 탭 1개 또는 공백 최대 2칸
function outdentWidth(line) {
  if (line[0] === '\t') return 1;
  let n = 0;
  while (n < 2 && line[n] === ' ') n++;
  return n;
}

export function listEnter(text, s, e) {
  const ls = lineStartOf(text, s);
  const line = text.slice(ls, lineEndOf(text, s));
  const it = parseItem(line);
  if (!it || s - ls < it.end) return null;
  if (s === e && line.slice(it.end).trim() === '') {
    // 빈 항목: 들여쓴 항목은 한 단계 내어쓰고, 최상위 항목은 기호를 지워 목록을 끝낸다
    const n = it.indent ? outdentWidth(line) : line.length;
    const at = it.indent ? s - n : ls;
    return { from: ls, to: ls + n, insert: '', selStart: at, selEnd: at };
  }
  const marker = it.bullet || (Number(it.num) + 1) + it.delim;
  const prefix = '\n' + it.indent + marker + it.space + (it.box ? '[ ] ' : '');
  const at = s + prefix.length;
  return { from: s, to: e, insert: prefix, selStart: at, selEnd: at };
}

// 선택이 걸친 줄 범위. 선택이 다음 줄 맨 앞에서 끝나면 그 줄은 뺀다.
function lineSpan(text, s, e) {
  const last = e > s && lineStartOf(text, e) === e ? e - 1 : e;
  return { from: lineStartOf(text, s), to: lineEndOf(text, last) };
}

// 줄마다 fn을 적용하고, 줄 앞에서 늘거나 준 칸만큼 선택 위치를 보정한다. 바뀐 줄이 없으면 null.
function mapLines(text, s, e, fn) {
  const { from, to } = lineSpan(text, s, e);
  const lines = text.slice(from, to).split('\n');
  const shifts = []; // [원래 글에서 줄 시작 위치, 늘어난 칸 수(지웠으면 음수)]
  let at = from;
  const out = lines.map(line => {
    const next = fn(line, lines.length);
    shifts.push([at, next.length - line.length]);
    at += line.length + 1;
    return next;
  });
  if (shifts.every(([, d]) => d === 0)) return null;
  const move = p => {
    let q = p;
    for (const [start, d] of shifts) {
      if (start > p) break;
      q += d > 0 ? d : -Math.min(-d, p - start); // 지운 칸 안에 있던 위치는 줄 맨 앞으로
    }
    return q;
  };
  return { from, to, insert: out.join('\n'), selStart: move(s), selEnd: move(e) };
}

export function indentLines(text, s, e) {
  return mapLines(text, s, e, (line, count) => (count > 1 && line === '' ? line : '  ' + line));
}

export function outdentLines(text, s, e) {
  return mapLines(text, s, e, line => line.slice(outdentWidth(line)));
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
