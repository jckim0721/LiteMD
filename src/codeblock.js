// 코드 블록 편집 — Enter(들여쓰기 이어가기·닫는 울타리), 편집 화면 색칠, [복사].
// Enter 규칙은 순수 함수 codeEnter(글·선택 → Edit)라 Node 테스트가 그대로 부른다. 코드 블록인지는 마크다운 구문 트리로 정한다
// (울타리 안의 `- `·`>`는 목록·인용이 아니고, 4칸 들여쓴 줄은 목록 안이면 코드가 아니다 — 글자만 봐서는 못 가린다).
import { markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxTree } from '@codemirror/language';
import { Decoration, ViewPlugin } from '@codemirror/view';
import { codeLang, codeSegments, codeTokens } from './code.js';

// 인용 표시 depth개(앞 공백 0~3칸, 뒤 공백 한 칸까지)
const quotes = depth => new RegExp(`^(?: {0,3}>[ ]?){0,${depth}}`);

// pos가 든 줄의 [시작, 끝)
function lineAt(text, pos) {
  const from = text.lastIndexOf('\n', pos - 1) + 1;
  const end = text.indexOf('\n', pos);
  return { from, to: end < 0 ? text.length : end };
}

// 줄을 덮는 코드 블록(FencedCode·CodeBlock) 노드
function blockAt(tree, line) {
  let block = null;
  tree.iterate({
    from: line.from,
    to: line.to,
    enter(n) {
      if (block) return false;
      if (n.name !== 'FencedCode' && n.name !== 'CodeBlock') return undefined;
      if (n.from <= line.to && n.to >= line.from) block = n.node;
      return false;
    },
  });
  return block;
}

function quoteDepth(node) {
  let d = 0;
  for (let p = node.parent; p; p = p.parent) if (p.name === 'Blockquote') d++;
  return d;
}

// 여는 울타리 블록이 닫히지 않았나: 닫는 울타리가 없거나, 닫는 울타리 전에 언어가 붙은 여는 울타리 줄이 끼어 있다
// (다른 블록 위에 새 블록을 쓰면 아래 블록의 울타리가 이 블록을 닫아 버린다)
function unclosed(text, block, open, close, depth) {
  if (!close) return true;
  const fence = text.slice(open.from, open.to);
  const inner = new RegExp(`^[ \\t]*[${fence[0]}]{${fence.length},}[ \\t]*\\S`);
  const strip = quotes(depth);
  const body = text.slice(lineAt(text, open.from).to + 1, close.from);
  return body.split('\n').some(l => inner.test(l.replace(strip, '')));
}

// 코드 블록 안 Enter. 여는 울타리 줄·내용 줄이면 늘 Edit(그냥 줄바꿈이어도 — 목록·인용 이어쓰기로 넘어가지 않게),
// 코드 밖이나 닫는 울타리 줄이면 null. tree가 없으면 text를 직접 파싱한다
export function codeEnter(text, s, e, tree = markdownLanguage.parser.parse(text)) {
  const line = lineAt(text, s);
  const block = blockAt(tree, line);
  if (!block) return null;
  const marks = block.name === 'FencedCode' ? block.getChildren('CodeMark') : [];
  const open = marks[0] || null;
  const close = marks.length > 1 ? marks[marks.length - 1] : null;
  if (close && close.from >= line.from && close.from <= line.to) return null; // 닫는 울타리 줄은 블록 밖 규칙
  const depth = quoteDepth(block);
  const opening = open && open.from >= line.from && open.from <= line.to;
  // 이어 줄 들여쓰기: 여는 줄은 울타리 앞(목록 기호는 공백으로), 내용 줄은 인용 표시 + 줄 앞 공백·탭
  const lead = opening
    ? text.slice(line.from, open.from).replace(/[^ \t>]/g, ' ')
    : text.slice(line.from, line.to).match(new RegExp(`${quotes(depth).source}[ \\t]*`))[0];
  const keep = lead.slice(0, Math.max(0, s - line.from));
  if (opening && s === e && /^[ \t]*$/.test(text.slice(s, line.to)) && unclosed(text, block, open, close, depth)) {
    const insert = `\n${lead}\n${lead}${text.slice(open.from, open.to)}`;
    return { from: s, to: e, insert, selStart: s + 1 + lead.length, selEnd: s + 1 + lead.length };
  }
  return { from: s, to: e, insert: '\n' + keep, selStart: s + 1 + keep.length, selEnd: s + 1 + keep.length };
}

// ── 색칠(편집 화면) ──
// 읽기 화면과 같은 codeTokens로 칠한다. 인용·목록 안 블록은 코드 글이 조각나 있어서 토큰을 조각마다 나눠 단다

const TOKEN_MARK = Object.fromEntries(['k', 's', 'c', 'n'].map(t => [t, Decoration.mark({ class: `tk-${t}` })]));

function highlightBlocks(view) {
  const doc = view.state.doc;
  const marks = [];
  syntaxTree(view.state).iterate({
    from: view.viewport.from,
    to: view.viewport.to,
    enter(n) {
      if (n.name === 'CodeBlock') return false; // 들여쓴 코드는 언어가 없다
      if (n.name !== 'FencedCode') return undefined;
      const info = n.node.getChild('CodeInfo');
      const segs = codeSegments(n.node);
      if (!info || !segs.length) return false;
      const tokens = codeTokens(codeLang(doc.sliceString(info.from, info.to)), segs.map(s => doc.sliceString(s.from, s.to)).join(''));
      let i = 0; // 토큰이 시작하는 조각, o = 그 조각의 코드 글 오프셋
      let o = 0;
      for (const t of tokens) {
        while (i < segs.length && o + segs[i].to - segs[i].from <= t.from) o += segs[i].to - segs[i++].from;
        for (let j = i, oj = o; j < segs.length && oj < t.to; oj += segs[j].to - segs[j].from, j++) {
          const a = Math.max(t.from, oj);
          const b = Math.min(t.to, oj + segs[j].to - segs[j].from);
          if (a < b) marks.push(TOKEN_MARK[t.type].range(segs[j].from + a - oj, segs[j].from + b - oj));
        }
      }
      return false;
    },
  });
  return Decoration.set(marks, true);
}

export const codeHighlight = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = highlightBlocks(view);
      this.stale = false;
    }
    update(u) {
      // 한글 조합 중에는 다시 칠하지 않고 옮기기만 한다 — 조합이 끝난 뒤 첫 갱신에서 다시 칠한다
      if (u.view.composing) {
        this.decorations = this.decorations.map(u.changes);
        this.stale = true;
      } else if (this.stale || u.docChanged || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) {
        this.stale = false;
        this.decorations = highlightBlocks(u.view);
      }
    }
  },
  {
    decorations: p => p.decorations,
    eventHandlers: {
      // 조합이 끝나도 CodeMirror가 갱신을 따로 안 보낼 때가 있다 → 빈 트랜잭션으로 한 번 다시 칠하게 한다
      compositionend(e, view) {
        setTimeout(() => {
          if (this.stale && !view.composing) view.dispatch({});
        });
      },
    },
  },
);

// ── [복사] ──

// 클립보드에 넣는다. 클립보드 API가 없거나 막혔으면 예전 방식(execCommand). 포커스는 그대로 돌려 둔다
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const back = document.activeElement;
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position: fixed; top: 0; opacity: 0';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    if (back instanceof HTMLElement) back.focus();
    return ok;
  }
}

// [복사] 버튼: 복사하고 1.5초 동안 결과를 버튼 글자로 보여 준다
export async function copyInto(button, text) {
  const ok = await copyText(text);
  button.textContent = ok ? '복사됨' : '복사 못 함';
  setTimeout(() => {
    button.textContent = '복사';
  }, 1500);
}
