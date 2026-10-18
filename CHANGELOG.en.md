# Changelog

[한국어](CHANGELOG.md) · **English**

Each [release](https://github.com/jckim0721/LiteMD/releases) has one runnable file attached (`LiteMD-v<version>.html`). Download it and open it in Chrome or Edge — no install, no server, no internet.

## Comparison

| | v1.0 (build #0) | v2.0 (build #1) | v3.0 (build #2) |
|---|---|---|---|
| Editor | textarea | CodeMirror 6 | CodeMirror 6 |
| File size | 16.5 KB | 370 KB | 381 KB |
| External libraries | none | CodeMirror, Lezer (bundled in the file) | same |
| Open, save, save as, unsaved mark | ✓ | ✓ | ✓ |
| List continuation, Tab indent | ✓ | ✓ | ✓ |
| Folder explorer | ✓ | ✓ | ✓ |
| Heading folding, fold to level | — | ✓ | ✓ |
| Find and replace (Ctrl+F) | browser's find | ✓ | ✓ |
| Basic highlighting (heading sizes, dimmed marks) | — | ✓ | ✓ |
| Live preview | — | — | ✓ |
| Reading view (Ctrl+E) | — | — | ✓ |
| Clickable checkboxes, Ctrl+click links | — | — | ✓ |
| Browser | Chrome/Edge 86+ | Chrome/Edge 110+ recommended | Chrome/Edge 110+ recommended |

All versions: a single HTML file, zero network requests at runtime, no key interception during IME composition, CRLF files saved as CRLF, and in browsers without the File System Access API (phones, Firefox, Safari) files open through a file picker and save as downloads.

## v3.0 — Build #2: live preview + reading view (2026-10-18)

**Changes since v2.0**

- New: **live preview** (on by default). Lines touched by the cursor or selection stay raw; other lines hide `#`, `**`, `~~`, backticks, a link's `[` and `](url)`, and the quote `>`, while tasks `- [ ]` become checkboxes, bullets `-` become `•`, and horizontal rules become lines. The line you are composing in an IME is always the cursor line, so the screen doesn't shift mid-composition
- New: the [라이브] (Live) button turns it off and on (off shows everything raw, as in v2)
- New: click a checkbox to toggle `[ ]`↔`[x]` (Ctrl+Z undoes it); Ctrl+click opens a link in a new tab (a plain click edits)
- New: **reading view** — Ctrl+E or [읽기] (Read) shows a fully rendered page, tables and images included. HTML is shown as text instead of running, and dangerous URLs such as `javascript:` are blocked. Ctrl+S still saves while reading
- New: the favicon is embedded in the file, which removes even the `/favicon.ico` request browsers used to send
- Changed: the dimmed text color in light mode is a little darker (reading-view quote contrast 4.4:1 → 5.9:1)
- Size: 370 KB → 381 KB

278 of 279 automated tests passed (Chrome, Edge), 1 skipped; manual checks W01–W05 passed (Chrome).

## v2.0 — Build #1: heading folding (2026-10-18)

**Changes since v1.0**

- Changed: the editor engine moved from a textarea to **CodeMirror 6**, bundled into the file — still one HTML file, zero network requests, works offline
- New: **heading folding** — click `▾` left of a heading to fold its section, shown as `⋯` (like VS Code's `#region`). A section runs until the next heading of the same or a higher level, minus trailing blank lines. `#` inside code blocks and `#tags` are not headings
- New: [H1] [H2] [H3] [펼침] (Unfold all) — show only headings up to level n. Ctrl+Shift+[ folds the innermost section at the cursor (press again for the next level out); Ctrl+Shift+] unfolds
- New: find and replace (Ctrl+F, Korean labels). A match inside a fold unfolds it
- New: basic highlighting — headings larger and bold, Markdown marks dimmed. Lists with sub-items and code blocks fold too
- Unchanged: v1's rules for list continuation, indenting, open/save and the explorer (the same 52 test vectors pass)
- Fixed: unreadable search panel text in dark mode (found by the user)
- Size: 16.5 KB → 370 KB

220 of 221 automated tests passed, 1 skipped; manual checks V01–V04 passed (Chrome).

## v1.0 — Build #0: a plain textarea (2026-10-18)

The first version — build #0 of "one thing a month".

- A single HTML file (16.5 KB), no external libraries
- Open and save (Ctrl+O / Ctrl+S; saving overwrites the opened file), save as (Shift+click [저장] (Save); Chrome also takes Ctrl+Shift+S)
- Unsaved changes marked with `•`; closing or opening another file in that state asks first
- Enter continues lists (`-` `*` `+` `1.` `1)` `- [ ]`; a checked task continues as an empty one). Enter on an empty item outdents if nested or ends the list if top-level; Shift+Enter is a plain line break
- Tab / Shift+Tab indent and outdent (2 spaces, multi-line selection)
- Enter and Tab are not intercepted during IME composition; automatically inserted text undoes with one Ctrl+Z
- Folder explorer: [폴더] (Folder) → a tree on the left (only `.md`, `.markdown`, `.txt`; names starting with a dot hidden; sorted by name in Korean order), click to open
- CRLF preserved; on phones and Firefox, a file picker and downloads instead

187 of 188 automated tests passed, 1 skipped; manual checks M01–M08 passed (Chrome).
