// 화면 — CodeMirror 편집기, 파일 입출력, 탐색기, 헤딩 접기, 단축키.
// v1(textarea)의 화면 스크립트를 옮겨 왔다. 글 변경 규칙(목록·Tab)은 logic.js의 v1 순수 함수 그대로다.
import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap, insertNewline, isolateHistory } from '@codemirror/commands';
import {
  foldGutter, codeFolding, foldKeymap, unfoldCode, syntaxHighlighting, HighlightStyle, indentUnit, foldedRanges,
} from '@codemirror/language';
import { search, searchKeymap } from '@codemirror/search';
import { markdownLanguage } from '@codemirror/lang-markdown';
import { tags as t } from '@lezer/highlight';
import {
  listEnter, indentLines, outdentLines, trimEdit, detectEol, normalizeEol, toEol, shortcutKey, isListed, compareEntries,
} from './logic.js';
import { headingFold, headingSections, foldToLevel, unfoldEverything, foldHere } from './folding.js';

const nameEl = document.getElementById('name');
const picker = document.getElementById('file');
const side = document.getElementById('side');
const tree = document.getElementById('tree');
const UNTITLED = '제목 없음';
const TYPES = [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }];
let doc = { handle: null, name: '', saved: null, eol: '\n', path: '' }; // saved: CodeMirror Text
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
  { tag: t.heading1, fontSize: '1.3em', fontWeight: '700' },
  { tag: t.heading2, fontSize: '1.15em', fontWeight: '700' },
  { tag: t.heading3, fontSize: '1.05em', fontWeight: '700' },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: '700' },
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
  return EditorState.create({ doc: text, selection: EditorSelection.single(s, e), extensions });
}

const view = new EditorView({ state: createState(''), parent: document.getElementById('editor') });
doc.saved = view.state.doc;

// ── 문서 상태 ──

function isDirty() {
  return !view.state.doc.eq(doc.saved);
}

function confirmDiscard() {
  return !isDirty() || confirm('저장하지 않은 변경이 있어요. 버리고 열까요?');
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
  view.focus();
  refresh();
  markCurrent();
}

// 열린 폴더 안의 파일이면 트리 경로('/하위/파일.md'), 아니면 ''
async function locate(handle) {
  const parts = root && handle ? await root.handle.resolve(handle) : null;
  return parts ? '/' + parts.join('/') : '';
}

async function openFile() {
  if (!confirmDiscard()) return;
  if (!window.showOpenFilePicker) return picker.click();
  try {
    const [handle] = await window.showOpenFilePicker({ types: TYPES, startIn: doc.handle || root?.handle });
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
        suggestedName: doc.name || UNTITLED + '.md', types: TYPES, startIn: doc.handle || root?.handle,
      });
      await write(handle, text);
      doc.handle = handle;
      doc.name = handle.name;
      doc.path = await locate(handle);
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
    doc.path = await locate(doc.handle);
    await renderTree();
  } catch (err) {
    if (err.name !== 'AbortError') alert('폴더를 열지 못했어요: ' + err.message);
  }
}

function closeFolder() {
  root = null;
  side.hidden = true;
  tree.replaceChildren();
  doc.path = '';
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

// ── 키·버튼 ──

addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = shortcutKey(e.key, e.code);
  if (k !== 'o' && k !== 's') return;
  e.preventDefault();
  if (k === 'o') openFile();
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
document.getElementById('folder').addEventListener('click', openFolder);
document.getElementById('close-folder').addEventListener('click', closeFolder);
document.getElementById('open').addEventListener('click', openFile);
document.getElementById('save').addEventListener('click', e => save(e.shiftKey));
document.getElementById('folder').hidden = !window.showDirectoryPicker; // 폰·파이어폭스·사파리엔 없다
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
};
