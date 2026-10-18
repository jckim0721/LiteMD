# LiteMD

**English** · [한국어](README.ko.md)

A Markdown editor in a single HTML file. Obsidian-style live preview that renders as you type, a fully rendered reading view, and folding by heading. CodeMirror 6 is bundled inside, so it runs offline with zero network requests (about 380 KB).

**Try it:** https://jckim0721.github.io/LiteMD/ · Build #0 (a plain textarea, 16.5 KB): https://jckim0721.github.io/LiteMD/v1/

![LiteMD demo — live preview, checkboxes, heading folding, reading view](docs/demo.png)

The interface is in Korean. The buttons, left to right:

| Button | Meaning |
|---|---|
| 라이브 | Live preview on/off |
| 읽기 / 편집 | Reading view / back to editing |
| H1 H2 H3 · 펼침 | Fold to heading level · Unfold all |
| 폴더 | Open folder (file tree) |
| 열기 | Open |
| 저장 | Save |

## Usage

Open the address above in Chrome or Edge, or download a release file and open it. Nothing to install; it works without internet.

| Key / button | Action |
|---|---|
| Ctrl+O / Ctrl+S | Open / Save (overwrites the file you opened) |
| Shift+click [저장] | Save as (Chrome also takes Ctrl+Shift+S; Edge uses that key for Web capture) |
| [폴더] | Open a folder and show its tree on the left. Click a file to open it |
| [라이브] | Live preview on/off (on by default): on lines without the cursor, marks such as `#`, `**` and link URLs are hidden, tasks become clickable checkboxes, and bullets become `•` |
| Ctrl+click | Open a link in a new tab (a plain click edits) |
| Ctrl+E · [읽기] | Switch between the reading view and the editor. Tables and images are rendered |
| ▾ / ▸ left of a heading, ⋯ where folded | Fold / unfold that heading's section |
| [H1] [H2] [H3] [펼침] | Fold so only headings up to level n show / unfold all |
| Ctrl+Shift+[ / Ctrl+Shift+] | Fold the section at the cursor (press again for the next level out) / unfold |
| Ctrl+F | Find and replace (a match inside a fold unfolds it) |
| Enter | Continue a list: `-` `*` `+` `1.` `1)` `- [ ]` (a checked task continues as an empty one) |
| Enter on an empty item | Outdent one level if nested; end the list if top-level |
| Shift+Enter | Line break without continuing the list |
| Tab / Shift+Tab | Indent / outdent (2 spaces, works on a multi-line selection) |

- Live preview works per line. Lines touched by the cursor or selection stay raw, so they are easy to edit, and the screen doesn't shift while you compose text with an IME (e.g. Korean)
- The reading view shows HTML as text instead of running it, and blocks dangerous URLs such as `javascript:`
- Folding only changes the view. Saving while folded still saves the full text
- Keys are never intercepted during IME composition (no doubled characters). Automatically inserted text undoes with a single Ctrl+Z
- Unsaved changes are marked with `•`; closing or opening another file in that state asks first
- CRLF files are saved as CRLF. A BOM is dropped on save
- The explorer shows only `.md`, `.markdown` and `.txt`, and hides names starting with a dot such as `.git` and `.obsidian`
- In browsers without the File System Access API (phones, Firefox, Safari), files open through a file picker and save as downloads. The folder explorer is hidden

## Offline and air-gapped use

Copy one file: the one attached to each [release](https://github.com/jckim0721/LiteMD/releases) (`LiteMD-v3.0.html` and so on, identical to `index.html`). The editor engine and the icon are inside it and it makes zero network requests, so no internet is needed. No install, no server.

- Browser: Chrome or Edge 110+ recommended (check with `edge://version`)
- If company policy blocks the file-access API, opening falls back to a file picker and saving to a download, automatically
- For a new version, just swap the file. On an old browser, use the lightweight build #0, `LiteMD-v1.0.html` (a plain textarea, 16.5 KB)

## Versions

Each [release](https://github.com/jckim0721/LiteMD/releases) has a single runnable file attached. Differences between versions: [CHANGELOG.en.md](CHANGELOG.en.md).

- **v3.0 (current):** live preview, reading view (Ctrl+E), checkboxes, Ctrl+click links
- **v2.0:** CodeMirror 6 — heading folding, fold to level, find, basic highlighting. Lists with sub-items and code blocks fold too (Markdown's built-in folding)
- **v1.0 (`/v1/`):** a plain textarea, no external libraries, 16.5 KB. List continuation, indenting, open/save, folder explorer

## Layout

```
src/index.html      page shell (HTML, CSS)
src/app.js          editor, file I/O, explorer, shortcuts
src/logic.js        pure functions: list continuation, indenting, line endings, shortcut keys, explorer sorting, fold-to-level targets
src/folding.js      heading sections (from the Markdown syntax tree) and fold commands
src/livepreview.js  live preview: per-line ranges to hide or replace (previewSpans) and their decorations, checkboxes, Ctrl+click
src/render.js       reading view: Markdown → HTML with the same parser, URL filtering (safeUrl)
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

Practice in finishing one thing every month. v1 is build #0 (October 2026), v2 is #1, v3 is #2.
