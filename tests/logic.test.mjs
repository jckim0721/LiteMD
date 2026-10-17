// 순수 함수 단위 테스트(U) — index.html의 <script id="logic"> 블록만 떼어 Node vm에서 돌린다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import vm from 'node:vm';
import { vectors, helpers, parse, show } from './vectors.mjs';

const PAGE = new URL('../index.html', import.meta.url);
const html = readFileSync(PAGE, 'utf8');
const logic = html.match(/<script id="logic">([\s\S]*?)<\/script>/)[1];
const ctx = vm.createContext({});
vm.runInContext(logic, ctx);

const FN = { Enter: 'listEnter', Tab: 'indentLines', 'Shift+Tab': 'outdentLines' };
const apply = (text, ed) => text.slice(0, ed.from) + ed.insert + text.slice(ed.to);

for (const v of vectors) {
  test(`${v.id} ${v.key} — ${v.note}`, () => {
    const { text, s, e } = parse(v.before);
    const ed = ctx[FN[v.key]](text, s, e);
    if (v.after === null) return assert.equal(ed, null);
    assert.ok(ed, 'Edit가 나와야 한다');
    const result = apply(text, ed);
    assert.equal(show(result, ed.selStart, ed.selEnd), v.after);
    // 바뀐 부분만 남긴 Edit를 적용해도 결과가 같아야 한다
    assert.equal(apply(text, ctx.trimEdit(text, ed)), result);
  });
}

for (const h of helpers) {
  test(`${h.id} ${h.call}`, () => {
    assert.equal(vm.runInContext(h.call, ctx), h.expect);
  });
}

test('C01 index.html 20KB(20,480바이트) 이하', t => {
  const size = statSync(PAGE).size;
  t.diagnostic(`${size} bytes`);
  assert.ok(size <= 20480, `${size} bytes`);
});

test('C02 외부 리소스 없음(script src·link·img 등, CSS @import·url(), http 주소)', () => {
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|<(img|iframe|object|embed)\b/i);
  assert.doesNotMatch(style, /@import|url\(/i); // CSS만 본다(스크립트의 URL.createObjectURL은 해당 없음)
  assert.doesNotMatch(html, /https?:\/\//i);
});
