// 꺾인 줄 맞춤 — 들여쓴 줄·목록 항목이 화면 끝에서 꺾이면, 꺾인 부분을 그 줄의 글 시작 위치에 맞춘다(보기만 바꾼다).
// 글 시작까지 몇 글자인지는 hangPrefix(순수)가 정하고, 그 폭은 화면에서 잰다: 라이브의 체크박스는 원문 `- [ ]`보다 좁아서
// 글자 수(ch)로 맞추면 어긋난다. 잰 폭은 padding-left + 같은 크기의 음수 text-indent로 건다 → 첫 줄은 제자리, 꺾인 줄만 들어간다.
// 줄 앞부분의 탭은 폭을 고정한 칸으로 그린다(v5.1): CSS 탭은 padding 안쪽부터 탭 자리를 세서, 맞춤 값이 바뀌면 탭 폭도 바뀌고
// 다시 재면 맞춤 값이 또 바뀌었다(커서를 옮길 때마다 출렁). 맞춤은 라이브를 꺼도 걸리니 탭 칸도 늘 그린다.
import { StateEffect } from '@codemirror/state';
import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { hangPrefix, prefixTabs } from './logic.js';

const remeasured = StateEffect.define(); // 값: 새로 잰 [줄 시작 오프셋, px][]

// 보이는 줄마다 [줄 시작 오프셋, 글 시작까지의 폭(px)]
function measure(view) {
  const widths = [];
  const limit = view.contentDOM.clientWidth / 2; // 이보다 넓게 맞추면 꺾인 줄에 글이 한두 글자씩만 남는다
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      const line = view.state.doc.lineAt(pos);
      const n = hangPrefix(line.text);
      if (n > 0 && n < line.length) {
        const a = view.coordsAtPos(line.from, 1);
        const b = view.coordsAtPos(line.from + n, 1);
        // 같은 화면 줄인지는 위아래가 겹치는지로 본다: 줄 첫머리 체크박스는 세로 가운데라 위쪽 끝이 글자와 다르다
        if (a && b && b.top < a.bottom && a.top < b.bottom) {
          const w = Math.round(b.left - a.left);
          if (w > 0 && w <= limit) widths.push([line.from, w]);
        }
      }
      pos = line.to + 1;
    }
  }
  return { doc: view.state.doc, widths };
}

const same = (a, b) => a.length === b.length && a.every(([p, w], i) => p === b[i][0] && w === b[i][1]);

const decorate = widths => Decoration.set(
  widths.map(([p, w]) => Decoration.line({ class: 'cm-hang', attributes: { style: `--hang: ${w}px` } }).range(p)),
);

const hang = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.widths = [];
      this.decorations = Decoration.none;
      this.schedule(view);
    }

    update(u) {
      let mine = false;
      for (const tr of u.transactions) {
        for (const e of tr.effects) {
          if (e.is(remeasured)) {
            this.widths = e.value;
            mine = true;
          }
        }
      }
      if (u.docChanged) {
        // 다시 잴 때까지는 옮긴 자리에 둔다(줄 시작이 아니게 된 것·겹친 것은 버린다)
        const doc = u.state.doc;
        this.widths = this.widths
          .map(([p, w]) => [u.changes.mapPos(p), w])
          .filter(([p], i, all) => doc.lineAt(p).from === p && (i === 0 || all[i - 1][0] !== p));
      }
      if (mine || u.docChanged) this.decorations = decorate(this.widths);
      if (!mine) this.schedule(u.view); // 우리가 보낸 것으로는 다시 재지 않는다(그려진 뒤 모양이 바뀌면 그 갱신이 다시 잰다)
    }

    schedule(view) {
      view.requestMeasure({
        key: this,
        read: measure,
        write: (m, v) => {
          // 한글 조합 중에는 꾸밈을 바꾸지 않는다 — 조합이 끝나면 그 갱신이 다시 잰다
          if (v.composing || m.doc !== v.state.doc || same(m.widths, this.widths)) return;
          // 재는 중에는 dispatch할 수 없어서 바로 다음으로 미룬다. 그사이 글이 바뀌었으면 버린다(그 변경이 다시 잰다)
          queueMicrotask(() => {
            if (v.state.doc === m.doc) v.dispatch({ effects: remeasured.of(m.widths) });
          });
        },
      });
    }
  },
  { decorations: p => p.decorations },
);

// 탭 칸: 칸 수만큼 폭을 고정한 빈칸(CodeMirror 기본 테마의 .cm-tab — inline-block, 넘치면 숨김). 폭은 맞춤이 없을 때 CSS 탭과 같다
class TabCell extends WidgetType {
  constructor(cols) {
    super();
    this.cols = cols;
  }
  eq(other) {
    return other.cols === this.cols;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-tab';
    span.textContent = '\t';
    span.style.width = `${this.cols}ch`;
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

// 화면 범위 줄마다 앞부분 탭 → 탭 칸. 라이브의 줄 앞 표시가 덮는 탭(`-⇥[ ]`)은 CodeMirror가 먼저 시작한 표시를 그린다
function tabCells(view) {
  const { doc, tabSize } = view.state;
  const cells = [];
  for (let pos = view.viewport.from; pos <= view.viewport.to;) {
    const line = doc.lineAt(pos);
    for (const [i, cols] of prefixTabs(line.text, tabSize)) {
      cells.push(Decoration.replace({ widget: new TabCell(cols) }).range(line.from + i, line.from + i + 1));
    }
    pos = line.to + 1;
  }
  return Decoration.set(cells);
}

const tabs = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = tabCells(view);
    }
    update(u) {
      if (u.docChanged || u.viewportChanged) this.decorations = tabCells(u.view);
    }
  },
  { decorations: p => p.decorations },
);

export const wrapIndent = [hang, tabs];
