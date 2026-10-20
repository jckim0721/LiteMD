// 화면 — CodeMirror 편집기, 파일 입출력, 탐색기, 헤딩 접기, 단축키.
// v1(textarea)의 화면 스크립트를 옮겨 왔다. 글 변경 규칙(목록·Tab)은 logic.js의 v1 순수 함수 그대로다.
import { EditorState, EditorSelection, Compartment } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap, insertNewline, isolateHistory } from '@codemirror/commands';
import {
  foldGutter, codeFolding, foldKeymap, unfoldCode, syntaxHighlighting, HighlightStyle, indentUnit, foldedRanges, foldable,
} from '@codemirror/language';
import { search, searchKeymap } from '@codemirror/search';
import { markdownLanguage } from '@codemirror/lang-markdown';
import { tags as t } from '@lezer/highlight';
import {
  listEnter, indentLines, outdentLines, trimEdit, detectEol, normalizeEol, toEol, shortcutKey, isListed, compareEntries, hangPrefix,
} from './logic.js';
import { headingFold, headingSections, foldToLevel, unfoldEverything, foldHere } from './folding.js';
import { livePreview, previewSpans } from './livepreview.js';
import { renderMarkdown } from './render.js';
import { wrapIndent } from './wrapindent.js';

const nameEl = document.getElementById('name');
const picker = document.getElementById('file');
const side = document.getElementById('side');
const tree = document.getElementById('tree');
const UNTITLED = '제목 없음';
const TYPES = [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }];
// saved: CodeMirror Text. startIn: 새 파일의 저장 창이 처음 열릴 곳(보던 파일 또는 연 폴더의 손잡이)
let doc = { handle: null, name: '', saved: null, eol: '\n', path: '', startIn: null };
let root = null; // 열린 폴더: { handle, open: 펼쳐 둔 하위 폴더 경로들 }
let renderSeq = 0;

// ── 편집기 ──

// v1 순수 함수의 Edit를 CodeMirror 트랜잭션으로 적용한다. 한글 조합 중 키는 CodeMirror가 키맵 전에 걸러 낸다.
function applyEdit(view, ed, isolate) {
  const text = view.state.doc.toString();
  ed = trimEdit(text, ed);
  view.dispatch({
    changes: { from: ed.from, to: ed.to, insert: ed.insert },
    selection: EditorSelection.single(ed.selStart, ed.selEnd),
    scrollIntoView: true,
    userEvent: 'input',
    annotations: isolate ? isolateHistory.of('before') : undefined, // 이어쓰기는 앞서 친 글과 따로 되돌린다
  });
}

function selectionArgs(view) {
  const { from, to } = view.state.selection.main;
  return [view.state.doc.toString(), from, to];
}

const enterCmd = view => {
  const ed = listEnter(...selectionArgs(view));
  if (!ed) return insertNewline(view); // 목록이 아니면 v1처럼 그냥 줄바꿈(자동 들여쓰기 없음)
  applyEdit(view, ed, true);
  return true;
};

const tabCmd = fn => view => {
  const ed = fn(...selectionArgs(view));
  if (ed) applyEdit(view, ed, false);
  return true; // 바꿀 게 없어도 Tab은 삼킨다(포커스가 편집창 밖으로 나가지 않게)
};

const highlight = HighlightStyle.define([
  // 헤딩은 단계마다 1.15배 이상 차이 난다(v4): 라이브에서 #가 숨으면 크기만이 단계를 알려 준다
  { tag: t.heading1, fontSize: '1.75em', fontWeight: '700', lineHeight: '1.35' },
  { tag: t.heading2, fontSize: '1.45em', fontWeight: '700', lineHeight: '1.35' },
  { tag: t.heading3, fontSize: '1.2em', fontWeight: '700', lineHeight: '1.35' },
  { tag: t.heading4, fontSize: '1.05em', fontWeight: '700' },
  { tag: [t.heading5, t.heading6], fontWeight: '700' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.monospace, backgroundColor: 'var(--code)' },
  { tag: t.link, color: 'var(--accent)' },
  { tag: t.url, color: 'var(--muted)' },
  { tag: [t.processingInstruction, t.contentSeparator], color: 'var(--muted)' }, // # ** ` > - 같은 기호
  { tag: t.quote, color: 'var(--muted)' },
]);

const theme = EditorView.theme({
  '&': { height: '100%', color: 'var(--fg)', backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: '"Cascadia Mono", Consolas, "D2Coding", ui-monospace, "Malgun Gothic", monospace',
    fontSize: '16px', lineHeight: '1.7',
  },
  '.cm-content': { padding: '24px 16px 40vh 4px', caretColor: 'var(--fg)' },
  '.cm-cursor': { borderLeftColor: 'var(--fg)' },
  // 거터에 paddingTop을 따로 주면 접기 표시가 글 줄보다 아래로 밀린다(CodeMirror가 본문 위 여백에 맞춰 이미 내려 그린다)
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: 'var(--muted)' },
  '.cm-foldGutter .cm-gutterElement': { padding: '0 4px', cursor: 'pointer', opacity: '0.6' },
  '.cm-foldGutter .cm-gutterElement:hover': { opacity: '1', color: 'var(--fg)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--line)', border: 'none', color: 'var(--muted)', borderRadius: '4px', padding: '0 6px', margin: '0 4px',
  },
  '.cm-placeholder': { color: 'var(--muted)' },
  '.cm-panels': { backgroundColor: 'var(--bg)', color: 'var(--fg)' },
  '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--line)' },
  // 검색 패널의 입력칸·버튼: CodeMirror 기본 스타일은 '다크 테마로 선언된' 편집기에서만 어두워진다.
  // 여기선 색을 CSS 변수로 바꾸니 기본값(흰 칸·밝은 그라데이션)을 덮어야 다크 모드에서 글자가 보인다
  '.cm-textfield': {
    backgroundColor: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--line)', borderRadius: '4px',
  },
  '.cm-textfield:focus': { outline: 'none', borderColor: 'var(--accent)' },
  '.cm-button': {
    backgroundImage: 'none', backgroundColor: 'var(--code)', color: 'var(--fg)', border: '1px solid var(--line)', borderRadius: '4px',
  },
  '.cm-button:active': { backgroundImage: 'none', backgroundColor: 'var(--line)' },
  '.cm-panel.cm-search [name=close]': { color: 'var(--muted)' },
  // 라이브 프리뷰 꾸밈
  '.cm-lp-task': { margin: '0 0.4em 0 0', verticalAlign: 'middle', cursor: 'pointer', accentColor: 'var(--accent)' },
  '.cm-lp-bullet': { color: 'var(--muted)' },
  '.cm-lp-hr': { display: 'inline-block', width: '100%', verticalAlign: 'middle', borderTop: '1px solid var(--line)' },
  '.cm-lp-quote': { borderLeft: '3px solid var(--line)', paddingLeft: '10px' },
  '.cm-lp-code': { backgroundColor: 'var(--code)' },
  // 꺾인 줄 맞춤: 첫 줄은 제자리(기본 왼쪽 여백 6px, 인용 줄은 10px), 꺾인 줄만 --hang만큼 들어간다.
  // 안쪽 inline-block(접힘 표시 ⋯ 등)은 음수 들여쓰기를 물려받으면 글자가 상자 밖으로 나가서 0으로 되돌린다
  '.cm-line.cm-hang': { paddingLeft: 'calc(6px + var(--hang))', textIndent: 'calc(-1 * var(--hang))' },
  '.cm-line.cm-lp-quote.cm-hang': { paddingLeft: 'calc(10px + var(--hang))' },
  '.cm-hang *': { textIndent: '0' },
  '.cm-searchMatch': { backgroundColor: 'var(--match)' },
  '.cm-searchMatch-selected': { backgroundColor: 'var(--accent)', color: 'var(--bg)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'var(--select)' },
});

const phrases = EditorState.phrases.of({
  'Find': '찾기', 'Replace': '바꿀 글', 'next': '다음', 'previous': '이전', 'all': '모두',
  'match case': '대소문자', 'by word': '단어 단위', 'regexp': '정규식', 'replace': '바꾸기', 'replace all': '모두 바꾸기',
  'close': '닫기', 'current match': '현재', 'on line': '줄', 'replaced match on line $': '$번째 줄을 바꿈',
  'replaced $ matches': '$개 바꿈', 'Go to line': '줄로 이동', 'go': '이동',
  'Fold line': '접기', 'Unfold line': '펴기', 'folded code': '접힌 내용', 'unfold': '펴기',
});

const liveSlot = new Compartment(); // 라이브 프리뷰 켬/끔
let liveOn = true;

const extensions = [
  history(),
  markdownLanguage,
  headingFold,
  codeFolding({ placeholderText: '⋯' }),
  foldGutter({ openText: '▾', closedText: '▸' }),
  syntaxHighlighting(highlight),
  search({ top: false }),
  indentUnit.of('  '),
  EditorState.tabSize.of(2),
  EditorView.lineWrapping,
  wrapIndent,
  placeholder('여기에 쓰세요.\n\nCtrl+O 열기 · Ctrl+S 저장 · Enter 목록 이어쓰기 · Tab 들여쓰기 · H1~H3 버튼으로 접기'),
  EditorView.contentAttributes.of({ spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off', 'aria-label': '편집창' }),
  phrases,
  theme,
  keymap.of([
    { key: 'Enter', run: enterCmd },
    { key: 'Shift-Enter', run: insertNewline },
    { key: 'Tab', run: tabCmd(indentLines), shift: tabCmd(outdentLines) },
    { key: 'Mod-Shift-[', run: foldHere },
    { key: 'Mod-Shift-]', run: unfoldCode },
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...defaultKeymap,
  ]),
  EditorView.updateListener.of(u => {
    if (u.docChanged) refresh();
  }),
];

function createState(text, s = 0, e = s) {
  return EditorState.create({
    doc: text, selection: EditorSelection.single(s, e), extensions: [extensions, liveSlot.of(liveOn ? livePreview : [])],
  });
}

const view = new EditorView({ state: createState(''), parent: document.getElementById('editor') });
doc.saved = view.state.doc;

// ── 문서 상태 ──

function isDirty() {
  return !view.state.doc.eq(doc.saved);
}

function confirmDiscard(what = '열까요') {
  return !isDirty() || confirm(`저장하지 않은 변경이 있어요. 버리고 ${what}?`);
}

function refresh() {
  const dirty = isDirty(), name = doc.name || UNTITLED;
  nameEl.textContent = name;
  nameEl.classList.toggle('dirty', dirty);
  document.title = (dirty ? '• ' : '') + name + ' — LiteMD';
}

// 새 상태로 갈아 끼운다 → 되돌리기 기록과 접기가 초기화된다(v1에서 value 대입과 같은 효과)
function load(handle, name, raw, path = '') {
  view.setState(createState(normalizeEol(raw)));
  doc = { handle, name, saved: view.state.doc, eol: detectEol(raw), path };
  view.scrollDOM.scrollTop = 0;
  if (reading) renderPreview();
  else view.focus();
  refresh();
  markCurrent();
}

// ── 라이브·읽기 프리뷰 ──

const preview = document.getElementById('preview');
const liveButton = document.getElementById('live');
const readButton = document.getElementById('read');
let reading = false;

function setLive(on) {
  liveOn = on;
  view.dispatch({ effects: liveSlot.reconfigure(on ? livePreview : []) });
  liveButton.setAttribute('aria-pressed', String(on));
}

function renderPreview() {
  // 안전: renderMarkdown이 HTML을 글자로 바꾸고 주소를 거른다
  preview.innerHTML = `<div class="page">${renderMarkdown(view.state.doc.toString())}</div>`;
  preview.scrollTop = 0;
}

// 읽기 화면 ↔ 편집 화면. 읽는 동안에도 문서는 편집기에 그대로 있어서 저장·열기는 똑같이 된다
function setReading(on) {
  reading = on;
  if (on) renderPreview();
  preview.hidden = !on;
  document.getElementById('editor').hidden = on;
  readButton.textContent = on ? '편집' : '읽기';
  readButton.setAttribute('aria-pressed', String(on));
  if (on) preview.focus();
  else view.focus();
}

// 열린 폴더 안의 파일이면 트리 경로('/하위/파일.md'), 아니면 ''
async function locate(handle) {
  const parts = root && handle ? await root.handle.resolve(handle) : null;
  return parts ? '/' + parts.join('/') : '';
}

// 열기·저장 창이 처음 열릴 곳: 지금 파일 → 새 파일이면 보던 파일 → 연 폴더 (파일 손잡이면 그 파일의 폴더에서 열린다)
const startDir = () => doc.handle || doc.startIn || root?.handle;

// 빈 '제목 없음' 문서. 디스크에는 처음 저장할 때 만든다 — 저장 창은 보던 파일의 폴더(없으면 연 폴더)에서 열린다
function newFile() {
  if (!confirmDiscard('새 파일을 만들까요')) return;
  const startIn = startDir() || null;
  if (reading) setReading(false);
  load(null, '', '');
  doc.startIn = startIn;
}

async function openFile() {
  if (!confirmDiscard()) return;
  if (!window.showOpenFilePicker) return picker.click();
  try {
    const [handle] = await window.showOpenFilePicker({ types: TYPES, startIn: startDir() });
    const file = await handle.getFile();
    load(handle, file.name, await file.text(), await locate(handle));
  } catch (err) {
    if (err.name !== 'AbortError') alert('열지 못했어요: ' + err.message);
  }
}

picker.addEventListener('change', async () => {
  const file = picker.files[0];
  picker.value = ''; // 같은 파일을 다시 고를 수 있게
  if (file) load(null, file.name, await file.text());
});

async function write(handle, text) {
  const w = await handle.createWritable();
  await w.write(text);
  await w.close();
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

async function save(as) {
  const snapshot = view.state.doc; // 쓰는 동안 친 글은 '수정됨'으로 남도록 시작 시점 내용을 기록한다
  const text = toEol(snapshot.toString(), doc.eol); // 접혀 있어도 문서 전체를 쓴다(접기는 보기만 바꾼다)
  try {
    if (doc.handle && !as) {
      await write(doc.handle, text);
    } else if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: doc.name || UNTITLED + '.md', types: TYPES, startIn: startDir(),
      });
      await write(handle, text);
      doc.handle = handle;
      doc.name = handle.name;
      doc.startIn = null;
      doc.path = await locate(handle);
      reveal(doc.path);
      renderTree(); // 새로 만든 파일이 트리에 보이게
    } else {
      doc.name = doc.name || UNTITLED + '.md';
      download(doc.name, text);
    }
    doc.saved = snapshot;
    refresh();
  } catch (err) {
    if (err.name !== 'AbortError') alert('저장하지 못했어요: ' + err.message);
  }
}

// ── 탐색기 ──

async function openFolder() {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    root = { handle, open: new Set() };
    document.getElementById('folder-name').textContent = handle.name;
    side.hidden = false;
    setSideCollapsed(false);
    doc.path = await locate(doc.handle);
    await renderTree();
  } catch (err) {
    if (err.name !== 'AbortError') alert('폴더를 열지 못했어요: ' + err.message);
  }
}

function closeFolder() {
  root = null;
  side.hidden = true;
  setSideCollapsed(false);
  tree.replaceChildren();
  doc.path = '';
}

// 탐색기를 [›]만 남은 좁은 띠로 접고 편다. 폴더는 열린 채라 펴면 트리가 그대로다
const collapseButton = document.getElementById('collapse');
function setSideCollapsed(on) {
  side.classList.toggle('collapsed', on);
  collapseButton.textContent = on ? '›' : '‹';
  collapseButton.title = on ? '탐색기 펼치기' : '탐색기 접기';
  collapseButton.setAttribute('aria-expanded', String(!on));
}

// 트리에서 그 파일이 보이게 상위 폴더를 편다('/a/b/c.md' → '/a', '/a/b')
function reveal(path) {
  if (!root || !path) return;
  const parts = path.split('/').slice(1, -1);
  parts.forEach((_, i) => root.open.add('/' + parts.slice(0, i + 1).join('/')));
}

// 펼쳐 둔 폴더까지 다시 읽어 트리 전체를 새로 그린다. 늦게 끝난 옛 그리기는 버린다.
async function renderTree() {
  if (!root) return;
  const seq = ++renderSeq;
  try {
    const rows = await listRows(root.handle, '', 0);
    if (seq !== renderSeq) return;
    tree.replaceChildren(...rows);
    markCurrent();
  } catch (err) {
    alert('폴더를 읽지 못했어요: ' + err.message);
  }
}

async function listRows(dir, path, depth) {
  const entries = [];
  for await (const entry of dir.values()) {
    if (isListed(entry.name, entry.kind)) entries.push(entry);
  }
  entries.sort(compareEntries);
  const rows = [];
  for (const entry of entries) {
    const p = path + '/' + entry.name;
    const isDir = entry.kind === 'directory';
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'row';
    row.dataset.path = p;
    row.title = p.slice(1);
    row.style.paddingLeft = 12 + depth * 14 + 'px'; // 12px = 사이드바 머리글과 같은 시작선
    row.textContent = (isDir ? (root.open.has(p) ? '▾ ' : '▸ ') : '') + entry.name;
    row.addEventListener('click', () => (isDir ? toggleDir(p) : openEntry(entry, p)));
    rows.push(row);
    if (isDir && root.open.has(p)) rows.push(...(await listRows(entry, p, depth + 1)));
  }
  return rows;
}

function toggleDir(path) {
  if (!root.open.delete(path)) root.open.add(path);
  renderTree();
}

async function openEntry(handle, path) {
  if (!confirmDiscard()) return;
  try {
    const file = await handle.getFile();
    load(handle, file.name, await file.text(), path);
  } catch (err) {
    alert('열지 못했어요: ' + err.message);
  }
}

function markCurrent() {
  for (const row of tree.children) row.classList.toggle('current', row.dataset.path === doc.path);
}

// ── 넓게(노션의 '전체 너비') ──
// 켬/끔은 이 브라우저에 기억한다. 저장소를 못 쓰는 환경(막힌 저장소 등)이면 기억만 안 된다

const wideButton = document.getElementById('wide');

function setWide(on) {
  document.body.classList.toggle('wide', on);
  wideButton.setAttribute('aria-pressed', String(on));
  try {
    localStorage.setItem('litemd.wide', on ? '1' : '0');
  } catch {
    // 기억만 못 한다
  }
}

function rememberedWide() {
  try {
    return localStorage.getItem('litemd.wide') === '1';
  } catch {
    return false;
  }
}

// ── 키·버튼 ──

addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = shortcutKey(e.key, e.code);
  if (k !== 'o' && k !== 's' && k !== 'e') return;
  e.preventDefault();
  if (k === 'o') openFile();
  else if (k === 'e') setReading(!reading);
  else save(e.shiftKey);
});

addEventListener('beforeunload', e => {
  if (!isDirty()) return;
  e.preventDefault();
  e.returnValue = '';
});

// 버튼(위·트리)을 눌러도 편집창 포커스·커서가 그대로
document.addEventListener('mousedown', e => {
  if (e.target.closest('button')) e.preventDefault();
});
for (const button of document.querySelectorAll('[data-level]')) {
  button.addEventListener('click', () => {
    const n = Number(button.dataset.level);
    if (n) foldToLevel(view, n);
    else unfoldEverything(view);
    view.focus();
  });
}
liveButton.addEventListener('click', () => setLive(!liveOn));
readButton.addEventListener('click', () => setReading(!reading));
wideButton.addEventListener('click', () => setWide(!document.body.classList.contains('wide')));
document.getElementById('folder').addEventListener('click', openFolder);
document.getElementById('close-folder').addEventListener('click', closeFolder);
collapseButton.addEventListener('click', () => setSideCollapsed(!side.classList.contains('collapsed')));
document.getElementById('new').addEventListener('click', newFile);
document.getElementById('new-here').addEventListener('click', newFile);
document.getElementById('open').addEventListener('click', openFile);
document.getElementById('save').addEventListener('click', e => save(e.shiftKey));
document.getElementById('folder').hidden = !window.showDirectoryPicker; // 폰·파이어폭스·사파리엔 없다
setWide(rememberedWide());
refresh();
view.focus();

// 브라우저 테스트용 손잡이(기능 아님): 편집기 상태를 꺼내고, 새 문서로 초기화한다
window.lite = {
  view,
  get doc() {
    return doc;
  },
  reset(text, s = 0, e = s) {
    view.setState(createState(text, s, e));
    doc = { handle: null, name: '', saved: view.state.doc, eol: '\n', path: '' };
    view.focus();
    refresh();
    markCurrent();
  },
  snapshot() {
    const { from, to } = view.state.selection.main;
    return { v: view.state.doc.toString(), s: from, e: to };
  },
  folded() {
    const out = [];
    foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
      out.push([from, to]);
    });
    return out;
  },
  headings: () => headingSections(view.state),
  spans: () => previewSpans(view.state),
  // 꺾인 줄 맞춤 확인: n번째 줄의 글 시작과 꺾인 둘째 줄 시작의 x(줄 첫 글자 기준, px). 안 꺾였으면 wrap: null
  wrap(n) {
    const line = view.state.doc.line(n);
    const k = line.from + hangPrefix(line.text);
    const left = view.coordsAtPos(line.from, 1).left;
    const start = view.coordsAtPos(k, 1);
    const text = Math.round(start.left - left);
    for (let p = k + 1; p < line.to; p++) {
      const c = view.coordsAtPos(p, 1);
      if (c && c.top > start.top + 2) return { text, wrap: Math.round(c.left - left) };
    }
    return { text, wrap: null };
  },
  get reading() {
    return reading;
  },
  // 접기 거터에 ▾가 붙는 줄(= CodeMirror가 접을 수 있다고 보는 줄)의 글
  foldableLines() {
    const out = [];
    for (let n = 1; n <= view.state.doc.lines; n++) {
      const line = view.state.doc.line(n);
      if (foldable(view.state, line.from, line.to)) out.push(line.text);
    }
    return out;
  },
};
