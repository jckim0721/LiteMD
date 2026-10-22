// 라이브 프리뷰 — 커서·선택이 걸친 줄은 원문, 나머지 줄은 마크다운 기호를 숨기거나 바꿔서 렌더링처럼 보인다.
// 줄 앞 표시(글머리·체크박스·인용 >)만 예외(v5): 커서 줄에서도 그리고, 커서·선택이 그 표시에 닿을 때만 원문이다.
// 커서 줄의 원문 `- [ ] `가 체크박스보다 넓어서 줄을 옮길 때마다 글이 튀고 꺾인 줄 수가 바뀌었다.
// previewSpans(순수: EditorState만 본다)가 무엇을 꾸밀지 정하고, ViewPlugin이 그걸 CodeMirror 꾸밈으로 바꾼다.
// 한글 조합은 커서 줄(원문)이나 줄 앞 표시 뒤의 글에서 일어나고, 표시 꾸밈은 그대로라 조합 중에 바뀌지 않는다.
import { syntaxTree } from '@codemirror/language';
import { Decoration, ViewPlugin, WidgetType, EditorView } from '@codemirror/view';
import { safeUrl } from './render.js';
import { codeLang, codeSegments } from './code.js';
import { copyInto } from './codeblock.js';

function rawLines(state) {
  const lines = new Set();
  for (const r of state.selection.ranges) {
    const last = state.doc.lineAt(r.to).number;
    for (let n = state.doc.lineAt(r.from).number; n <= last; n++) lines.add(n);
  }
  return lines;
}

// { spans: [{from, to, kind: 'hide'|'bullet'|'task'|'hr'|'fence', checked?, lang?}],
//   quotes: [줄 번호, 깊이][], code: [줄 번호, { top, bottom, fence }][] }
export function previewSpans(state, from = 0, to = state.doc.length) {
  const doc = state.doc;
  const raw = rawLines(state);
  const ranges = state.selection.ranges;
  const spans = [];
  const quoteMarks = new Map(); // 줄 번호 → 그 줄 인용 표시들의 [시작, 끝)
  const code = [];
  // 줄 단위 규칙: 커서·선택이 걸친 줄은 원문
  const add = (a, b, kind, extra) => {
    if (a < b && !raw.has(doc.lineAt(a).number)) spans.push({ from: a, to: b, kind, ...extra });
  };
  // 줄 앞 표시 규칙: 빈 커서가 [a, b) 안에 있거나 선택이 겹치면 닿았다
  const touched = (a, b) => ranges.some(r => (r.empty ? r.from >= a && r.from < b : r.from < b && r.to > a));
  const marker = (a, b, kind, extra) => {
    if (a < b && !touched(a, b)) spans.push({ from: a, to: b, kind, ...extra });
  };
  const spacesAfter = pos => {
    let e = pos;
    while (doc.sliceString(e, e + 1) === ' ') e++;
    return e;
  };
  const quoteMark = (a, b) => { // >와 공백 한 칸
    const n = doc.lineAt(a).number;
    if (!quoteMarks.has(n)) quoteMarks.set(n, []);
    quoteMarks.get(n).push([a, Math.min(b + 1, spacesAfter(b))]);
  };

  syntaxTree(state).iterate({
    from,
    to,
    enter(ref) {
      const node = ref.node;
      switch (ref.name) {
        case 'FencedCode':
        case 'CodeBlock': { // 코드 안은 건드리지 않고, 줄마다 상자 모양만 정한다
          const first = doc.lineAt(ref.from).number;
          const last = doc.lineAt(ref.to).number;
          const marks = node.getChildren('CodeMark');
          const close = marks.length > 1 ? marks[marks.length - 1] : null;
          if (marks.length) {
            const info = node.getChild('CodeInfo');
            const lang = info ? codeLang(doc.sliceString(info.from, info.to)) : '';
            add(marks[0].from, doc.lineAt(marks[0].from).to, 'fence', { lang }); // 여는 울타리 → 언어 이름·[복사]
          }
          if (close) add(close.from, doc.lineAt(close.from).to, 'hide');
          for (const q of node.getChildren('QuoteMark')) quoteMark(q.from, q.to); // 인용 안 코드 줄의 >
          for (let n = first; n <= last; n++) {
            const fence = marks.length > 0 && (n === first || (close !== null && n === last));
            code.push([n, { top: n === first, bottom: n === last, fence }]);
          }
          return false;
        }
        case 'Image':
          return false; // 이미지는 원문 그대로(읽기 프리뷰가 그린다)
        case 'HeaderMark': {
          const h = node.parent;
          if (!h || !/^ATXHeading/.test(h.name)) return undefined; // 밑줄 헤딩의 ===는 그대로
          if (ref.from === h.from) {
            add(ref.from, spacesAfter(ref.to), 'hide'); // 여는 #와 뒤 공백
          } else {
            let s = ref.from; // 닫는 #와 앞 공백
            while (s > h.from && doc.sliceString(s - 1, s) === ' ') s--;
            add(s, ref.to, 'hide');
          }
          return undefined;
        }
        case 'EmphasisMark':
        case 'StrikethroughMark':
          add(ref.from, ref.to, 'hide');
          return undefined;
        case 'CodeMark':
          if (node.parent && node.parent.name === 'InlineCode') add(ref.from, ref.to, 'hide');
          return undefined;
        case 'Link': {
          const marks = node.getChildren('LinkMark');
          const close = marks.find(m => doc.sliceString(m.from, m.to) === ']');
          if (!node.getChild('URL') || !close) return undefined; // 참조 링크는 그대로
          add(marks[0].from, marks[0].to, 'hide'); // [
          add(close.from, ref.to, 'hide'); // ](주소 "제목")
          return undefined; // 글 안의 강조는 계속 찾는다
        }
        case 'ListMark': { // 글머리·할 일 칸은 뒤 공백까지 한 덩어리(글 첫머리 Backspace가 표시째 지운다)
          const item = node.parent;
          if (!item || !item.parent || item.parent.name !== 'BulletList') return undefined; // 번호는 그대로
          const tm = item.getChild('Task') && item.getChild('Task').getChild('TaskMarker');
          if (tm) marker(ref.from, spacesAfter(tm.to), 'task', { checked: /x/i.test(doc.sliceString(tm.from, tm.to)) });
          else marker(ref.from, spacesAfter(ref.to), 'bullet');
          return undefined;
        }
        case 'QuoteMark':
          quoteMark(ref.from, ref.to);
          return undefined;
        case 'HorizontalRule':
          add(ref.from, ref.to, 'hr');
          return false;
        case 'Escape':
          add(ref.from, ref.from + 1, 'hide'); // \
          return undefined;
        default:
          return undefined;
      }
    },
  });

  // 한 줄의 인용 표시들(> > )은 한 묶음: 하나라도 닿으면 그 줄의 표시를 다 원문으로
  const quotes = [];
  for (const [n, marks] of quoteMarks) {
    marks.sort((a, b) => a[0] - b[0]);
    quotes.push([n, marks.length]);
    if (!touched(marks[0][0], marks[marks.length - 1][1])) {
      for (const [a, b] of marks) if (a < b) spans.push({ from: a, to: b, kind: 'hide' });
    }
  }
  spans.sort((a, b) => a.from - b.from || a.to - b.to);
  return { spans, quotes: quotes.sort((a, b) => a[0] - b[0]), code };
}

// [ ]↔[x] 바꾸기. pos는 그 줄 안 아무 데나
export function toggleTask(view, pos) {
  const line = view.state.doc.lineAt(pos);
  const m = /^(\s*[-*+][ \t]+)\[([ xX])\]/.exec(line.text);
  if (!m) return false;
  const at = line.from + m[1].length + 1;
  view.dispatch({ changes: { from: at, to: at + 1, insert: m[2] === ' ' ? 'x' : ' ' }, userEvent: 'input.toggle' });
  return true;
}

// 클릭한 자리의 링크 주소(Link의 URL 또는 그냥 쓴 주소)
function linkAt(state, pos) {
  for (let node = syntaxTree(state).resolveInner(pos, 1); node; node = node.parent) {
    if (node.name === 'URL' && node.parent && node.parent.name !== 'Image') return state.doc.sliceString(node.from, node.to);
    if (node.name === 'Link') {
      const url = node.getChild('URL');
      return url ? state.doc.sliceString(url.from, url.to) : null;
    }
  }
  return null;
}

class TextWidget extends WidgetType {
  constructor(text, cls) {
    super();
    this.text = text;
    this.cls = cls;
  }
  eq(other) {
    return other.text === this.text && other.cls === this.cls;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = this.cls;
    span.textContent = this.text;
    return span;
  }
}

// 여는 울타리 자리: 오른쪽에 언어 이름과 [복사]. 누르는 건 편집기가 받아서 아래 mousedown에서 복사한다
class FenceWidget extends WidgetType {
  constructor(lang) {
    super();
    this.lang = lang;
  }
  eq(other) {
    return other.lang === this.lang;
  }
  toDOM() {
    const bar = document.createElement('span');
    bar.className = 'cm-lp-fence';
    const name = document.createElement('span');
    name.className = 'cm-lp-lang';
    name.textContent = this.lang;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'cm-lp-copy';
    copy.textContent = '복사';
    copy.title = '코드 복사';
    bar.append(name, copy);
    return bar;
  }
  ignoreEvent() {
    return false;
  }
}

class CheckboxWidget extends WidgetType {
  constructor(checked) {
    super();
    this.checked = checked;
  }
  eq(other) {
    return other.checked === this.checked;
  }
  toDOM() {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'cm-lp-task';
    box.checked = this.checked;
    box.setAttribute('aria-label', this.checked ? '끝난 할 일' : '할 일');
    return box;
  }
  ignoreEvent() {
    return false; // 누르는 건 편집기가 받아서 아래 mousedown에서 바꾼다
  }
}

const hidden = Decoration.replace({});
const bullet = Decoration.replace({ widget: new TextWidget('• ', 'cm-lp-bullet') });
const rule = Decoration.replace({ widget: new TextWidget('', 'cm-lp-hr') });
const checkbox = checked => Decoration.replace({ widget: new CheckboxWidget(checked) });
const fence = lang => Decoration.replace({ widget: new FenceWidget(lang) });
// 인용 줄: 깊이만큼 막대(CSS가 --depth로 그린다). 코드 줄: 상자 위·아래 모서리, 울타리 줄
const quoteLine = depth => Decoration.line({ class: 'cm-lp-quote', attributes: { style: `--depth: ${depth}` } });
const codeLine = ({ top, bottom, fence: f }) => Decoration.line({
  class: 'cm-lp-code' + (top ? ' cm-lp-code-top' : '') + (bottom ? ' cm-lp-code-bottom' : '') + (f ? ' cm-lp-fence-line' : ''),
});
const DECO = { hide: () => hidden, bullet: () => bullet, hr: () => rule, task: s => checkbox(s.checked), fence: s => fence(s.lang) };

function build(view) {
  const { from, to } = view.viewport;
  const { spans, quotes, code } = previewSpans(view.state, from, to);
  const doc = view.state.doc;
  const ranges = spans.map(s => DECO[s.kind](s).range(s.from, s.to));
  for (const [n, depth] of quotes) ranges.push(quoteLine(depth).range(doc.line(n).from));
  for (const [n, shape] of code) ranges.push(codeLine(shape).range(doc.line(n).from));
  return Decoration.set(ranges, true);
}

// [복사]를 누른 울타리의 코드 글(인용 표시·목록 들여쓰기 뺀 것)
function codeOf(view, pos) {
  for (let n = syntaxTree(view.state).resolveInner(pos, 1); n; n = n.parent) {
    if (n.name === 'FencedCode') return codeSegments(n).map(s => view.state.doc.sliceString(s.from, s.to)).join('');
  }
  return '';
}

const plugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = build(view);
    }
    update(u) {
      if (u.docChanged || u.selectionSet || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) {
        this.decorations = build(u.view);
      }
    }
  },
  { decorations: v => v.decorations },
);

export const livePreview = [
  plugin,
  // 숨긴 기호·바꾼 표시는 커서가 한 덩어리로 건너뛴다(줄 꾸밈은 길이가 0이라 해당 없음)
  EditorView.atomicRanges.of(view => (view.plugin(plugin) ? view.plugin(plugin).decorations : Decoration.none)),
  EditorView.domEventHandlers({
    mousedown(e, view) {
      if (e.target instanceof HTMLInputElement && e.target.classList.contains('cm-lp-task')) {
        e.preventDefault();
        return toggleTask(view, view.posAtDOM(e.target));
      }
      if (e.target instanceof HTMLButtonElement && e.target.classList.contains('cm-lp-copy')) {
        e.preventDefault(); // 커서가 울타리 줄로 가지 않게(가면 원문이 되어 버튼이 사라진다)
        copyInto(e.target, codeOf(view, view.posAtDOM(e.target)));
        return true;
      }
      if (e.ctrlKey || e.metaKey) {
        const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
        const url = pos === null ? null : linkAt(view.state, pos);
        if (url) {
          e.preventDefault();
          const safe = safeUrl(url);
          if (safe !== '#') window.open(safe, '_blank', 'noopener,noreferrer');
          return true;
        }
      }
      return false;
    },
  }),
];
