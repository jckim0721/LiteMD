# LiteMD

**English** · [한국어](README.ko.md)

A Markdown editor in a single HTML file. Obsidian-style live preview that renders as you type, code blocks with syntax colors and a copy button, a fully rendered reading view, and folding by heading. CodeMirror 6 is bundled inside, so it runs offline with zero network requests (about 400 KB).

**Try it:** https://jckim0721.github.io/LiteMD/ · Build #0 (a plain textarea, 16.5 KB): https://jckim0721.github.io/LiteMD/v1/

![LiteMD demo — live preview, checkboxes, a code block typed with Enter, syntax colors, quote continuation, heading folding, reading view, collapsible tree, full width](docs/demo.png)

The interface is in Korean. The buttons, left to right:

| Button | Meaning |
|---|---|
| 라이브 | Live preview on/off |
| 읽기 / 편집 | Reading view / back to editing |
| 넓게 | Full width on/off |
| H1 H2 H3 · 펼침 | Fold to heading level · Unfold all |
| 폴더 | Open folder (file tree) |
| 새 파일 | New file |
| 열기 | Open |
| 저장 | Save |

In the file tree header: [+] new file, [‹] / [›] collapse / expand the tree, [×] close the folder.

## Usage

Open the address above in Chrome or Edge, or download a release file and open it. Nothing to install; it works without internet.

| Key / button | Action |
|---|---|
| Ctrl+O / Ctrl+S | Open / Save (overwrites the file you opened) |
| Shift+click [저장] | Save as (Chrome also takes Ctrl+Shift+S; Edge uses that key for Web capture) |
| [폴더] | Open a folder and show its tree on the left. Click a file to open it |
| [새 파일] · [+] in the tree | New untitled file. Its location is chosen on the first save; the save dialog opens in the folder of the file you were viewing (otherwise the opened folder) |
| [‹] / [›] in the tree | Collapse the file tree to a thin strip / expand it again |
| [넓게] | Full width, like Notion's: the editor and the reading view use the whole window instead of a centered column. Remembered |
| [라이브] | Live preview on/off (on by default): on lines without the cursor, marks such as `#`, `**` and link URLs are hidden, tasks become clickable checkboxes, and bullets become `•` |
| Ctrl+click | Open a link in a new tab (a plain click edits) |
| Ctrl+E · [읽기] | Switch between the reading view and the editor. Tables and images are rendered |
| ▾ / ▸ left of a heading, ⋯ where folded | Fold / unfold that heading's section |
| [H1] [H2] [H3] [펼침] | Fold so only headings up to level n show / unfold all |
| Ctrl+Shift+[ / Ctrl+Shift+] | Fold the section at the cursor (press again for the next level out) / unfold |
| Ctrl+F | Find and replace (a match inside a fold unfolds it) |
| Enter | Continue a list: `-` `*` `+` `1.` `1)` `- [ ]` (a checked task continues as an empty one), or a quote `>` (lists inside quotes too) |
| Enter on an empty item | Outdent one level if nested; end the list if top-level. On an empty `>` line, remove one quote level |
| Enter in a code block | Keep the indentation of the line above (never continues lists). After an opening fence such as ```` ```js ````, the closing ```` ``` ```` is added too |
| [복사] on a code block | Copy only the code (no fences, no quote marks) |
| Shift+Enter | Line break without continuing the list |
| Tab / Shift+Tab | Indent / outdent (2 spaces, works on a multi-line selection). On quote lines, after the `>` |

- Long indented lines and list items wrap at their text start (after the bullet, number or checkbox) instead of the left edge. Only the view changes; the text is saved as is
- Live preview works per line. Lines touched by the cursor or selection stay raw, so they are easy to edit, and the screen doesn't shift while you compose text with an IME (e.g. Korean)
- Leading marks — bullets, checkboxes and quote `>` — stay drawn even on the cursor line, so nothing jumps as you move through a list. Put the cursor right before a mark (Home) to see it raw. Backspace at the start of an item's text removes the mark
- Code blocks: the fences hide into a rounded box with the language name and [복사] (Copy). Keywords, strings, comments and numbers are colored for C, C++ (C++Builder too), C#, Java, JavaScript, TypeScript, Python, SQL, shell, PowerShell, JSON, XML/HTML/XAML and YAML — by simple text rules, not a full parser
- The reading view shows HTML as text instead of running it, and blocks dangerous URLs such as `javascript:`
- Folding only changes the view. Saving while folded still saves the full text
- Keys are never intercepted during IME composition (no doubled characters). Automatically inserted text undoes with a single Ctrl+Z
- Unsaved changes are marked with `•`; closing or opening another file in that state asks first
- CRLF files are saved as CRLF. A BOM is dropped on save
- The explorer shows only `.md`, `.markdown` and `.txt`, and hides names starting with a dot such as `.git` and `.obsidian`
- In browsers without the File System Access API (phones, Firefox, Safari), files open through a file picker and save as downloads. The folder explorer is hidden

## Offline and air-gapped use

Copy one file: the one attached to each [release](https://github.com/jckim0721/LiteMD/releases) (`LiteMD-v5.0.html` and so on, identical to `index.html`). The editor engine and the icon are inside it and it makes zero network requests, so no internet is needed. No install, no server.

- Browser: Chrome or Edge 110+ recommended (check with `edge://version`)
- If company policy blocks the file-access API, opening falls back to a file picker and saving to a download, automatically
- For a new version, just swap the file. On an old browser, use the lightweight build #0, `LiteMD-v1.0.html` (a plain textarea, 16.5 KB)

## Versions

Each [release](https://github.com/jckim0721/LiteMD/releases) has a single runnable file attached. Differences between versions: [CHANGELOG.en.md](CHANGELOG.en.md).

- **v5.0 (current):** code blocks (rounded box, syntax colors, copy, Enter keeps the indentation and adds the closing fence), quotes (Enter continues `>`, nested bars), checkboxes and bullets stay put as you move between lines
- **v4.0:** wrapped lines align with the text start, full width, collapsible file tree, new file, larger heading sizes
- **v3.0:** live preview, reading view (Ctrl+E), checkboxes, Ctrl+click links
- **v2.0:** CodeMirror 6 — heading folding, fold to level, find, basic highlighting. Lists with sub-items and code blocks fold too (Markdown's built-in folding)
- **v1.0 (`/v1/`):** a plain textarea, no external libraries, 16.5 KB. List continuation, indenting, open/save, folder explorer

## Layout

```
src/index.html      page shell (HTML, CSS)
src/app.js          editor, file I/O, explorer, shortcuts
src/logic.js        pure functions: list continuation, indenting, line endings, shortcut keys, explorer sorting, fold-to-level targets
src/folding.js      heading sections (from the Markdown syntax tree) and fold commands
src/livepreview.js  live preview: per-line ranges to hide or replace (previewSpans) and their decorations, checkboxes, Ctrl+click, code block box and copy, quote bars
src/render.js       reading view: Markdown → HTML with the same parser, URL filtering (safeUrl)
src/wrapindent.js   wrapped-line alignment: measures each line's text start and indents the wrapped part (view only)
src/code.js         code blocks, shared by both views: language name, code text, syntax-color tokens (codeTokens)
src/codeblock.js    Enter in code blocks (codeEnter, uses the syntax tree), editor syntax colors, copy
build.mjs           bundles src/ into a single root index.html (license notices included)
index.html          build output — open this
tests/              unit tests (Node) + headless Chrome/Edge browser tests (CDP, no extra tools)
```

## Build and test

```
npm install
npm run build      # writes index.html
npm test           # node --test "tests/*.test.mjs"
```

Node 22+. The browser tests launch Chrome and Edge from their default install paths with a temporary profile (set `CHROME_PATH` / `EDGE_PATH` otherwise). File dialogs can't be driven in a test, so the page swaps in fake file and folder handles.

## License

MIT — [LICENSE](LICENSE). Notices for the bundled libraries (CodeMirror, Lezer and others, all MIT) are in the comment at the top of `index.html`.

`docs/demo.png` is an animated PNG (APNG). `node tools/demo.mjs` records it from real input.

## Why

Practice in finishing one thing every month. v1 is build #0 (October 2026), v2 is #1, v3 is #2, v4 is #3, v5 is #5 (#4 was another project).
