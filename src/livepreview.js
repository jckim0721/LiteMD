// 라이브 프리뷰 — 커서·선택이 걸친 줄은 원문, 나머지 줄은 마크다운 기호를 숨기거나 바꿔서 렌더링처럼 보인다.
// previewSpans(순수: EditorState만 본다)가 무엇을 꾸밀지 정하고, ViewPlugin이 그걸 CodeMirror 꾸밈으로 바꾼다.
// 한글 조합 중인 줄은 커서 줄이라 늘 원문이다 → 조합 중에 꾸밈이 바뀌지 않는다.
import { syntaxTree } from '@codemirror/language';
import { Decoration, ViewPlugin, WidgetType, EditorView } from '@codemirror/view';
import { safeUrl } from './render.js';

function rawLines(state) {
  const lines = new Set();
  for (const r of state.selection.ranges) {
    const last = state.doc.lineAt(r.to).number;
    for (let n = state.doc.lineAt(r.from).number; n <= last; n++) lines.add(n);
  }
  return lines;
}

// { spans: [{from, to, kind: 'hide'|'bullet'|'task'|'hr', checked?}], quoteLines, codeLines }
export function previewSpans(state, from = 0, to = state.doc.length) {
  const doc = state.doc;
  const raw = rawLines(state);
  const spans = [];
  const quoteLines = new Set();
  const codeLines = new Set();
  const add = (a, b, kind, extra) => {
    if (a < b && !raw.has(doc.lineAt(a).number)) spans.push({ from: a, to: b, kind, ...extra });
  };
  const spacesAfter = pos => {
    let e = pos;
    while (doc.sliceString(e, e + 1) === ' ') e++;
    return e;
  };

  syntaxTree(state).iterate({
    from,
    to,
    enter(ref) {
      const node = ref.node;
      switch (ref.name) {
        case 'FencedCode':
        case 'CodeBlock':
          for (let n = doc.lineAt(ref.from).number; n <= doc.lineAt(ref.to).number; n++) codeLines.add(n);
          return false; // 코드 안은 건드리지 않는다
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
        case 'ListMark': {
          const item = node.parent;
          if (!item || !item.parent || item.parent.name !== 'BulletList') return undefined; // 번호는 그대로
          const marker = item.getChild('Task') && item.getChild('Task').getChild('TaskMarker');
          if (marker) add(ref.from, marker.to, 'task', { checked: /x/i.test(doc.sliceString(marker.from, marker.to)) });
          else add(ref.from, ref.to, 'bullet');
          return undefined;
        }
        case 'QuoteMark':
          add(ref.from, Math.min(ref.to + 1, spacesAfter(ref.to)), 'hide'); // >와 공백 한 칸
          quoteLines.add(doc.lineAt(ref.from).number);
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

  spans.sort((a, b) => a.from - b.from || a.to - b.to);
  return { spans, quoteLines: [...quoteLines].sort((a, b) => a - b), codeLines: [...codeLines].sort((a, b) => a - b) };
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
const bullet = Decoration.replace({ widget: new TextWidget('•', 'cm-lp-bullet') });
const rule = Decoration.replace({ widget: new TextWidget('', 'cm-lp-hr') });
const checkbox = checked => Decoration.replace({ widget: new CheckboxWidget(checked) });
const quoteLine = Decoration.line({ class: 'cm-lp-quote' });
const codeLine = Decoration.line({ class: 'cm-lp-code' });

function build(view) {
  const { from, to } = view.viewport;
  const { spans, quoteLines, codeLines } = previewSpans(view.state, from, to);
  const doc = view.state.doc;
  const ranges = spans.map(s => {
    const deco = s.kind === 'hide' ? hidden : s.kind === 'bullet' ? bullet : s.kind === 'hr' ? rule : checkbox(s.checked);
    return deco.range(s.from, s.to);
  });
  for (const n of quoteLines) ranges.push(quoteLine.range(doc.line(n).from));
  for (const n of codeLines) ranges.push(codeLine.range(doc.line(n).from));
  return Decoration.set(ranges, true);
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
