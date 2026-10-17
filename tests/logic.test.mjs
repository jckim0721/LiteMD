// 단위 테스트(U) — src/logic.js(순수 함수)와 src/folding.js(헤딩 섹션)를 Node에서 그대로 불러 쓴다. 브라우저 없음.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { EditorState } from '@codemirror/state';
import { markdownLanguage } from '@codemirror/lang-markdown';
import * as logic from '../src/logic.js';
import { headingSections } from '../src/folding.js';
import { vectors, helpers, headingVectors, levelDoc, levelVectors, parse, show } from './vectors.mjs';

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
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|<(img|iframe|object|embed)\b/i);
  assert.doesNotMatch(style, /@import|url\(/i);
});

test('C03 index.html이 src/보다 새것(빌드를 잊고 커밋하지 않게)', () => {
  const built = statSync(PAGE).mtimeMs;
  const srcDir = new URL('../src/', import.meta.url);
  for (const f of readdirSync(srcDir)) {
    assert.ok(statSync(new URL(f, srcDir)).mtimeMs <= built, `src/${f}이 index.html보다 새것 — npm run build`);
  }
});
