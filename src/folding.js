// 헤딩 접기 — 마크다운 구문 트리에서 헤딩 섹션을 찾는다.
// 규칙은 @codemirror/lang-markdown의 headerIndent와 같다: 섹션은 헤딩 다음부터, 같은 레벨이거나 더 높은 레벨
// 헤딩이 나오기 직전 블록의 끝까지(블록 사이 빈 줄은 노드가 아니라서 끝의 빈 줄은 자연히 빠진다).
// markdown() 대신 markdownLanguage만 쓰면 HTML 언어팩이 안 딸려 와서(번들 538KB → 345KB) 접기를 여기서 직접 붙인다.
import { syntaxTree, ensureSyntaxTree, foldService, foldEffect, unfoldEffect, foldedRanges } from '@codemirror/language';
import { EditorSelection } from '@codemirror/state';
import { levelFoldTargets } from './logic.js';

const HEADING = /^(?:ATX|Setext)Heading(\d)$/;

function levelOf(type) {
  const m = HEADING.exec(type.name);
  return m ? Number(m[1]) : 0;
}

function sectionEnd(node, level) {
  let last = node;
  for (let next = node.nextSibling; next; next = next.nextSibling) {
    const l = levelOf(next.type);
    if (l && l <= level) break;
    last = next;
  }
  return last.to;
}

// 문서 순서로, 본문이 있는 헤딩만: { level, pos(헤딩 첫 줄 시작), from(첫 줄 끝 = 접기 시작), to(섹션 끝) }
export function headingSections(state) {
  const tree = ensureSyntaxTree(state, state.doc.length, 1000) || syntaxTree(state);
  const out = [];
  tree.iterate({
    enter(ref) {
      const level = levelOf(ref.type);
      if (!level) return undefined; // 인용문·목록 안의 헤딩도 찾도록 안으로 내려간다
      const line = state.doc.lineAt(ref.from);
      const to = sectionEnd(ref.node, level);
      if (to > line.to) out.push({ level, pos: line.from, from: line.to, to });
      return false;
    },
  });
  return out;
}

// 접기 거터·Ctrl+Shift+[ 가 묻는 "이 줄을 어디까지 접을 수 있나"
export const headingFold = foldService.of((state, lineStart, lineEnd) => {
  for (let node = syntaxTree(state).resolveInner(lineEnd, -1); node; node = node.parent) {
    if (node.from < lineStart) break;
    const level = levelOf(node.type);
    if (!level) continue;
    const to = sectionEnd(node, level);
    return to > lineEnd ? { from: lineEnd, to } : null;
  }
  return null;
});

function foldedList(state) {
  const out = [];
  foldedRanges(state).between(0, state.doc.length, (from, to) => {
    out.push({ from, to });
  });
  return out;
}

// 커서가 접힌 범위 안에 있으면 그 범위의 시작(헤딩 줄 끝)으로 뺀다. 안에 두면 CodeMirror가 다음 선택 변경 때 접기를 풀어 버린다.
function cursorOutside(state, folds) {
  const head = state.selection.main.head;
  const hit = folds.find(f => f.from < head && head <= f.to);
  return hit ? EditorSelection.cursor(hit.from) : undefined;
}

export function unfoldEverything(view) {
  const effects = foldedList(view.state).map(f => unfoldEffect.of(f));
  if (effects.length) view.dispatch({ effects });
}

export function foldToLevel(view, n) {
  unfoldEverything(view);
  const targets = levelFoldTargets(headingSections(view.state), n).map(h => ({ from: h.from, to: h.to }));
  if (!targets.length) return;
  view.dispatch({ effects: targets.map(f => foldEffect.of(f)), selection: cursorOutside(view.state, targets) });
}

// Ctrl+Shift+[: 커서를 품은 섹션 중 아직 안 접힌 가장 안쪽을 접는다(헤딩 줄 위가 아니어도).
// 다시 누르면 한 단계 바깥이 접힌다 — VS Code와 같은 감각
export function foldHere(view) {
  const head = view.state.selection.main.head;
  const folds = foldedList(view.state);
  const open = h => !folds.some(f => f.from === h.from && f.to === h.to);
  const inner = headingSections(view.state).filter(h => h.pos <= head && head <= h.to && open(h)).pop();
  if (!inner) return false;
  const f = { from: inner.from, to: inner.to };
  view.dispatch({ effects: foldEffect.of(f), selection: cursorOutside(view.state, [f]) });
  return true;
}
