// 단위 테스트(U) — src/logic.js(순수 함수)와 src/folding.js(헤딩 섹션)를 Node에서 그대로 불러 쓴다. 브라우저 없음.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { EditorState, EditorSelection } from '@codemirror/state';
import { markdownLanguage } from '@codemirror/lang-markdown';
import * as logic from '../src/logic.js';
import { headingSections } from '../src/folding.js';
import { previewSpans } from '../src/livepreview.js';
import { renderMarkdown, safeUrl } from '../src/render.js';
import {
  vectors, helpers, headingVectors, levelDoc, levelVectors, liveVectors, renderVectors, urlVectors, parse, show,
} from './vectors.mjs';

const FN = { Enter: logic.listEnter, Tab: logic.indentLines, 'Shift+Tab': logic.outdentLines };
const apply = (text, ed) => text.slice(0, ed.from) + ed.insert + text.slice(ed.to);
const ctx = vm.createContext({ ...logic }); // helpers의 call 식을 그대로 실행할 곳

for (const v of vectors) {
  test(`${v.id} ${v.key} — ${v.note}`, () => {
    const { text, s, e } = parse(v.before);
    const ed = FN[v.key](text, s, e);
    if (v.after === null) return assert.equal(ed, null);
    assert.ok(ed, 'Edit가 나와야 한다');
    const result = apply(text, ed);
    assert.equal(show(result, ed.selStart, ed.selEnd), v.after);
    // 바뀐 부분만 남긴 Edit를 적용해도 결과가 같아야 한다
    assert.equal(apply(text, logic.trimEdit(text, ed)), result);
  });
}

for (const h of helpers) {
  test(`${h.id} ${h.call.replace(/\s+/g, ' ').slice(0, 80)}`, () => {
    assert.equal(vm.runInContext(h.call, ctx), h.expect);
  });
}

// ── 헤딩 접기 ──

const stateOf = display => EditorState.create({ doc: display.replaceAll('⏎', '\n'), extensions: [markdownLanguage] });
const nameOf = (state, h) => state.doc.lineAt(h.pos).text
  .replace(/^ {0,3}#{1,6}[ \t]*/, '').replace(/[ \t]+#+[ \t]*$/, '').trim();
const describe = (state, list) => (list.length
  ? list.map(h => `${nameOf(state, h)}(${h.level}): ${state.doc.lineAt(h.from).number + 1}~${state.doc.lineAt(h.to).number}`).join(' · ')
  : '없음');

for (const v of headingVectors) {
  test(`${v.id} 헤딩 섹션 — ${v.note}`, () => {
    const state = stateOf(v.doc);
    assert.equal(describe(state, headingSections(state)), v.expect);
  });
}

for (const v of levelVectors) {
  test(`${v.id} H${v.n}까지 보기 — ${v.note}`, () => {
    const state = stateOf(levelDoc);
    const names = logic.levelFoldTargets(headingSections(state), v.n).map(h => nameOf(state, h));
    assert.equal(names.join(', '), v.expect);
  });
}

// ── 라이브 프리뷰: 줄마다 보이는 글 ──

const SHOWN = { hide: () => '', bullet: () => '•', hr: () => '───', task: s => (s.checked ? '☑' : '☐') };
function visibleText(state) {
  const { spans } = previewSpans(state);
  const lines = [];
  for (let n = 1; n <= state.doc.lines; n++) {
    const line = state.doc.line(n);
    let out = '';
    let pos = line.from;
    for (const s of spans.filter(x => x.from >= line.from && x.to <= line.to)) {
      out += state.doc.sliceString(pos, s.from) + SHOWN[s.kind](s);
      pos = s.to;
    }
    lines.push(out + state.doc.sliceString(pos, line.to));
  }
  return lines.join(' ⏎ ');
}

for (const v of liveVectors) {
  test(`${v.id} 라이브 — ${v.note}`, () => {
    const { text, s, e } = parse(v.doc);
    const state = EditorState.create({ doc: text, selection: EditorSelection.single(s, e), extensions: [markdownLanguage] });
    assert.equal(visibleText(state), v.expect);
  });
}

// ── 읽기 프리뷰 ──

for (const v of renderVectors) {
  test(`${v.id} 읽기 — ${v.md.slice(0, 30)}`, () => {
    assert.equal(renderMarkdown(v.md.replaceAll('⏎', '\n')), v.html);
  });
}

test('U-URL safeUrl: http·https·mailto·상대 경로·#만 통과', () => {
  assert.deepEqual(urlVectors.map(([url]) => safeUrl(url)), urlVectors.map(([, want]) => want));
});

// ── 빌드 결과물 ──

const PAGE = new URL('../index.html', import.meta.url);

test('C01 index.html 400KB(409,600바이트) 이하', t => {
  const size = statSync(PAGE).size;
  t.diagnostic(`${size} bytes`);
  assert.ok(size <= 409600, `${size} bytes`);
});

test('C02 외부 리소스를 불러오는 태그·CSS 없음(런타임 요청은 브라우저 테스트 B01이 본다)', () => {
  const html = readFileSync(PAGE, 'utf8');
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  // 태그 검사는 스크립트 바깥 마크업에만(번들 안의 '<img' 같은 문자열은 태그가 아니다)
  const markup = html.replace(/<script>[\s\S]*?<\/script>/g, '<script></script>');
  // 파비콘은 HTML 안의 data: 주소라 요청이 없다 — 그 밖의 link href는 안 된다
  assert.doesNotMatch(markup, /<script[^>]+src=|<link[^>]+href="(?!data:)|<(img|iframe|object|embed)\b/i);
  assert.doesNotMatch(style, /@import|url\(/i);
});

test('C03 index.html이 src/보다 새것(빌드를 잊고 커밋하지 않게)', () => {
  const built = statSync(PAGE).mtimeMs;
  const srcDir = new URL('../src/', import.meta.url);
  for (const f of readdirSync(srcDir)) {
    assert.ok(statSync(new URL(f, srcDir)).mtimeMs <= built, `src/${f}이 index.html보다 새것 — npm run build`);
  }
});
