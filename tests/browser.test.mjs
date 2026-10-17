// 브라우저 테스트(B·X·F) — 크롬·엣지 headless에 실제 키·마우스 이벤트를 보내 화면 동작을 확인한다(v2, CodeMirror).
// 편집기 상태는 앱이 열어 둔 window.lite로 읽고 초기화한다. 파일 대화상자는 띄울 수 없으니
// showOpenFilePicker·showSaveFilePicker·showDirectoryPicker를 페이지 안에서 가짜로 바꿔 끼운다.
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { launch } from './cdp.mjs';
import { vectors, levelDoc, parse, show, expectedOnScreen } from './vectors.mjs';

const BROWSERS = [
  ['Chrome', process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
  ['Edge', process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
];
const PAGE = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;

for (const [label, exe] of BROWSERS) {
  describe(label, { skip: !existsSync(exe) && `${exe} 없음` }, () => {
    let b;

    before(async () => {
      b = await launch(exe);
      await b.open(PAGE);
      b.initial = await b.eval(`({ title: document.title, focused: document.activeElement === lite.view.contentDOM,
        fsa: typeof window.showOpenFilePicker, folderButton: !document.getElementById('folder').hidden })`);
      // keydown 기록기 — 앱 핸들러가 끝난 뒤(버블 단계, window)의 상태를 본다
      await b.eval(`window.__keys = []; addEventListener('keydown', e =>
        __keys.push({ key: e.key, keyCode: e.keyCode, isComposing: e.isComposing, prevented: e.defaultPrevented })); 0`);
    });
    after(() => b?.close());

    // 편집기를 주어진 상태로 초기화한다(새 상태라 되돌리기 기록·접기도 지워진다)
    const setDoc = display => {
      const { text, s, e } = parse(display);
      return b.eval(`lite.reset(${JSON.stringify(text)}, ${s}, ${e})`);
    };
    const screen = async () => {
      const r = await b.eval('lite.snapshot()');
      return show(r.v, r.s, r.e);
    };
    const value = () => b.eval('lite.snapshot().v');
    const focused = () => b.eval('document.activeElement === lite.view.contentDOM');
    const type = text => b.send('Input.insertText', { text });

    // 가짜 파일 핸들·대화상자. 쓴 내용은 __fs.writes에 쌓인다
    const stubFiles = () => b.eval(`(() => {
      const fs = window.__fs = { writes: [], opened: 0, saveAs: [], alerts: [], confirms: [], downloads: [],
        confirmAnswer: true, abort: false, openName: 'a.md', openText: '# 제목\\r\\n- 기저귀\\r\\n', saveName: null };
      const handle = (name, text) => ({
        name,
        async getFile() { return new File([text], name); },
        async createWritable() {
          const parts = [];
          return { async write(t) { parts.push(t); }, async close() { fs.writes.push({ name, text: parts.join('') }); } };
        },
      });
      window.showOpenFilePicker = async () => {
        fs.opened++;
        if (fs.abort) throw new DOMException('취소', 'AbortError');
        return [handle(fs.openName, fs.openText)];
      };
      window.showSaveFilePicker = async o => {
        fs.saveAs.push(o.suggestedName);
        if (fs.abort) throw new DOMException('취소', 'AbortError');
        return handle(fs.saveName || o.suggestedName, '');
      };
      window.alert = m => fs.alerts.push(m);
      window.confirm = m => (fs.confirms.push(m), fs.confirmAnswer);
      return true;
    })()`);

    test('B01 첫 화면: "제목 없음", 편집창에 포커스, 페이지 말고는 요청 없음', t => {
      t.diagnostic(`${b.name} · file://에서 showOpenFilePicker: ${b.initial.fsa} · 요청: ${JSON.stringify(b.requests)}`);
      assert.equal(b.initial.title, '제목 없음 — LiteMD');
      assert.equal(b.initial.focused, true, '편집창에 포커스');
      assert.equal(b.initial.folderButton, true, '폴더 열기를 지원하면 [폴더] 버튼이 보인다');
      assert.ok(b.requests.every(url => url === PAGE), '외부 요청이 없어야 한다');
    });

    for (const v of vectors) {
      test(`B02 ${v.id} ${v.key} — ${v.note}`, async () => {
        await setDoc(v.before);
        await b.press(v.key === 'Enter' ? 'Enter' : 'Tab', { shift: v.key === 'Shift+Tab' });
        assert.equal(await screen(), expectedOnScreen(v));
        assert.equal(await focused(), true, '포커스가 편집창에 남아야 한다');
      });
    }

    test('B03 Shift+Enter는 이어쓰기 없이 줄바꿈', async () => {
      await setDoc('- 기저귀▮');
      await b.press('Enter', { shift: true });
      assert.equal(await screen(), '- 기저귀⏎▮');
    });

    test('B04 Enter 이어쓰기 뒤 Ctrl+Z 한 번이면 원래대로(커서까지)', async () => {
      await setDoc('- 기저귀▮');
      await b.press('Enter');
      assert.equal(await screen(), '- 기저귀⏎- ▮');
      await b.press('z', { ctrl: true });
      assert.equal(await screen(), '- 기저귀▮');
    });

    test('B05 Tab 뒤 Ctrl+Z 한 번이면 원래 글', async t => {
      await setDoc('- 항▮목');
      await b.press('Tab');
      await b.press('z', { ctrl: true });
      t.diagnostic('되돌린 뒤 화면: ' + await screen());
      assert.equal(await value(), '- 항목');
    });

    test('B06 빈 항목을 지운 뒤 Ctrl+Z 한 번이면 기호가 돌아온다', async () => {
      await setDoc('- 첫째⏎- ▮');
      await b.press('Enter');
      assert.equal(await screen(), '- 첫째⏎▮');
      await b.press('z', { ctrl: true });
      assert.equal(await value(), '- 첫째\n- ');
    });

    test('B07 타이핑 → Enter → Ctrl+Z: 이어쓰기만 취소되고 친 글은 남는다', async () => {
      await setDoc('- ▮');
      await type('분유');
      await b.press('Enter');
      assert.equal(await screen(), '- 분유⏎- ▮');
      await b.press('z', { ctrl: true });
      assert.equal(await screen(), '- 분유▮');
    });

    test('B08 한글 조합 중 Enter(keyCode 229)는 건너뛰고, 조합이 확정된 뒤 Enter로 한 번만 이어쓴다', async t => {
      await setDoc('- 기저▮');
      await b.eval('__keys.length = 0');
      await b.send('Input.imeSetComposition', { text: '귀', selectionStart: 1, selectionEnd: 1 });
      await b.press('Process'); // 실제 IME에서 조합 중 Enter는 이렇게 먼저 온다
      const during = await value();
      await type('귀'); // 조합 확정
      await b.press('Enter'); // 확정 뒤 진짜 Enter
      t.diagnostic(`조합 중 값: ${JSON.stringify(during)} · keydown 기록: ${JSON.stringify(await b.eval('__keys'))}`);
      assert.ok(!during.includes('\n'), '조합 중에는 줄바꿈이 없어야 한다');
      assert.equal(await screen(), '- 기저귀⏎- ▮');
    });

    test('B10 Ctrl+O: 파일 내용이 뜨고(CRLF→LF), 이름이 보이고, 수정 표시 없음', async () => {
      await setDoc('▮');
      await stubFiles();
      await b.press('o', { ctrl: true });
      await b.waitFor('__fs.opened === 1 && lite.snapshot().v !== ""');
      const r = await b.eval(`({ v: lite.snapshot().v, title: document.title, name: document.getElementById('name').textContent,
        dirty: document.getElementById('name').classList.contains('dirty'), eol: lite.doc.eol })`);
      assert.deepEqual(r, { v: '# 제목\n- 기저귀\n', title: 'a.md — LiteMD', name: 'a.md', dirty: false, eol: '\r\n' });
    });

    test('B11 타이핑하면 탭 제목과 상단 바에 •, 되돌려서 같아지면 사라짐', async () => {
      const state = () => b.eval(`[document.title, document.getElementById('name').classList.contains('dirty')]`);
      await type('추가 ');
      assert.deepEqual(await state(), ['• a.md — LiteMD', true]);
      await b.press('z', { ctrl: true });
      assert.deepEqual(await state(), ['a.md — LiteMD', false]);
      await type('추가 ');
    });

    test('B12 Ctrl+S: 연 파일에 바로 덮어쓰고(CRLF 유지), • 가 사라짐', async () => {
      await b.press('s', { ctrl: true });
      await b.waitFor('__fs.writes.length === 1');
      const r = await b.eval(`({ w: __fs.writes[0], saveAs: __fs.saveAs.length, title: document.title })`);
      assert.deepEqual(r, { w: { name: 'a.md', text: '추가 # 제목\r\n- 기저귀\r\n' }, saveAs: 0, title: 'a.md — LiteMD' });
    });

    // 엣지는 Ctrl+Shift+S를 '웹 캡처'로 먼저 가져가서 페이지에 키가 오지 않는다(이후 키 입력도 막힌다) → B21로 대신
    test('B13 Ctrl+Shift+S: 다른 이름으로 저장 → 새 이름으로 바뀜', { skip: label === 'Edge' && '엣지는 웹 캡처 단축키' }, async () => {
      await b.eval(`__fs.saveName = 'b.md'`);
      await b.press('s', { ctrl: true, shift: true });
      await b.waitFor('__fs.writes.length === 2');
      const r = await b.eval(`({ suggested: __fs.saveAs[0], wrote: __fs.writes[1].name, title: document.title })`);
      assert.deepEqual(r, { suggested: 'a.md', wrote: 'b.md', title: 'b.md — LiteMD' });
    });

    test('B14 새 문서 Ctrl+S: "제목 없음.md"로 저장 위치를 묻는다', async () => {
      await setDoc('새 글▮');
      await stubFiles();
      await b.press('s', { ctrl: true });
      await b.waitFor('__fs.writes.length === 1');
      const r = await b.eval(`({ suggested: __fs.saveAs[0], w: __fs.writes[0], title: document.title })`);
      assert.deepEqual(r, { suggested: '제목 없음.md', w: { name: '제목 없음.md', text: '새 글' }, title: '제목 없음.md — LiteMD' });
    });

    test('B15 한글 입력 모드의 Ctrl+S(key "ㄴ", code KeyS)도 저장', async () => {
      await setDoc('한글 모드▮');
      await stubFiles();
      await b.press('ㄴ', { ctrl: true });
      await b.waitFor('__fs.writes.length === 1');
    });

    test('B16 저장 안 한 채 Ctrl+O: 확인창, 취소하면 열지 않는다', async () => {
      await setDoc('▮');
      await stubFiles();
      await type('안 저장한 글');
      await b.eval('__fs.confirmAnswer = false');
      await b.press('o', { ctrl: true });
      const r = await b.eval('({ confirms: __fs.confirms.length, opened: __fs.opened, v: lite.snapshot().v })');
      assert.deepEqual(r, { confirms: 1, opened: 0, v: '안 저장한 글' });
    });

    test('B17 대화상자 취소(AbortError)는 알림 없이 넘어간다', async () => {
      await setDoc('▮');
      await stubFiles();
      await b.eval('__fs.abort = true');
      await b.press('o', { ctrl: true });
      await b.press('s', { ctrl: true });
      await b.waitFor('__fs.opened === 1 && __fs.saveAs.length === 1');
      await sleep(50);
      assert.equal(await b.eval('__fs.alerts.length'), 0);
    });

    test('B18 저장 안 한 변경이 있으면 탭 닫기를 막고, 없으면 막지 않는다', async () => {
      const fire = () => b.eval(`(() => {
        const ev = new Event('beforeunload', { cancelable: true });
        dispatchEvent(ev);
        return ev.defaultPrevented;
      })()`);
      await setDoc('▮');
      assert.equal(await fire(), false);
      await type('변경');
      assert.equal(await fire(), true);
    });

    test('B21 Shift+[저장] 클릭: 다른 이름으로 저장, 편집창 포커스·커서 그대로', async () => {
      await setDoc('버튼으로▮ 저장');
      await stubFiles();
      await b.eval(`__fs.saveName = 'c.md'`);
      await b.click('#save', { shift: true });
      await b.waitFor('__fs.writes.length === 1');
      const r = await b.eval(`({ suggested: __fs.saveAs[0], wrote: __fs.writes[0].name, title: document.title,
        focused: document.activeElement === lite.view.contentDOM })`);
      assert.deepEqual(r, { suggested: '제목 없음.md', wrote: 'c.md', title: 'c.md — LiteMD', focused: true });
      assert.equal(await screen(), '버튼으로▮ 저장');
    });

    // ── 헤딩 접기(F) ──

    const foldedHeads = () => b.eval('lite.folded().map(([from]) => lite.view.state.doc.lineAt(from).text)');
    const contentText = () => b.eval('lite.view.contentDOM.textContent');
    // CodeMirror는 다음 프레임에 줄 높이를 재고, 헤딩 글꼴(강조)도 그사이 붙는다. 좌표로 누르기 전엔 자리 잡기를 기다린다
    const settle = () => b.eval('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(0))))');

    test('F01 접기 거터의 ▾를 누르면 그 섹션이 접히고 ⋯가 보인다', async () => {
      await setDoc('▮' + levelDoc);
      await settle();
      const p = await b.eval(`(() => {
        const marks = [...document.querySelectorAll('.cm-foldGutter .cm-gutterElement')].filter(el => el.textContent === '▾');
        const r = marks[0].getBoundingClientRect();
        return { n: marks.length, x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
      assert.equal(p.n, 6, '본문이 있는 헤딩 6개에 ▾');
      await b.clickAt(p.x, p.y);
      await b.waitFor('lite.folded().length === 1');
      assert.deepEqual(await foldedHeads(), ['# A']);
      assert.equal(await b.eval(`!!document.querySelector('.cm-foldPlaceholder')`), true);
      assert.doesNotMatch(await contentText(), /a1x/);
    });

    test('F02 ⋯를 누르면 편다', async () => {
      await settle();
      await b.click('.cm-foldPlaceholder');
      await b.waitFor('lite.folded().length === 0');
      assert.match(await contentText(), /a1x/);
    });

    test('F03 [H2]: H1·H2 헤딩만 보이게 — a1·a2·b-x 섹션이 접히고 포커스는 편집창에', async () => {
      await setDoc('▮' + levelDoc);
      await b.click('[data-level="2"]');
      assert.deepEqual(await foldedHeads(), ['## a1', '## a2', '### b-x']);
      assert.equal(await focused(), true);
    });

    test('F04 [H1]·[H3]·[펼침]', async () => {
      await b.click('[data-level="1"]');
      assert.deepEqual(await foldedHeads(), ['# A', '# B']);
      await b.click('[data-level="3"]');
      assert.deepEqual(await foldedHeads(), ['### a1x', '### b-x']);
      await b.click('[data-level="0"]');
      assert.deepEqual(await foldedHeads(), []);
    });

    test('F05 Ctrl+Shift+[: 커서를 품은 가장 안쪽부터, 다시 누르면 한 단계 바깥 / Ctrl+Shift+]: 편다', async () => {
      await setDoc('# A⏎## a1⏎### a1x⏎x▮⏎## a2⏎y⏎# B⏎### b-x⏎z');
      await b.press('{', { ctrl: true, shift: true });
      assert.deepEqual(await foldedHeads(), ['### a1x']);
      await b.press('{', { ctrl: true, shift: true });
      assert.ok((await foldedHeads()).includes('## a1'), '두 번째는 a1');
      await b.press('}', { ctrl: true, shift: true });
      assert.ok(!(await foldedHeads()).includes('## a1'), 'a1이 펴진다');
    });

    test('F06 접힌 채 저장해도 전체 글이 저장된다', async () => {
      await setDoc('▮' + levelDoc);
      await stubFiles();
      await b.click('[data-level="1"]');
      await b.press('s', { ctrl: true });
      await b.waitFor('__fs.writes.length === 1');
      assert.equal(await b.eval('__fs.writes[0].text'), parse(levelDoc).text);
    });

    test('F07 접힌 채 다른 곳을 고쳐도 접기는 그대로', async () => {
      await setDoc('# A▮⏎## a1⏎### a1x⏎x⏎## a2⏎y⏎# B⏎### b-x⏎z');
      await b.click('[data-level="2"]');
      await type(' 제목');
      assert.deepEqual(await foldedHeads(), ['## a1', '## a2', '### b-x']);
      assert.equal((await value()).split('\n')[0], '# A 제목');
    });

    test('F08 Ctrl+F: 한국어 검색 패널, 접힌 곳의 글을 찾으면 그 부분이 펴진다, Esc로 닫힘', async () => {
      await setDoc('▮' + levelDoc);
      await b.click('[data-level="1"]');
      await b.press('f', { ctrl: true });
      await b.waitFor(`!!document.querySelector('.cm-search input[main-field]')`);
      assert.equal(await b.eval(`document.querySelector('.cm-search input[main-field]').placeholder`), '찾기');
      await b.typeKeys('a1x'); // 검색창은 keyup 때 검색어를 확정한다
      await b.press('Enter');
      await b.waitFor(`(() => { const r = lite.view.state.selection.main; return lite.view.state.sliceDoc(r.from, r.to) === 'a1x'; })()`);
      assert.ok(!(await foldedHeads()).includes('# A'), '찾은 글을 품은 접기는 풀린다');
      await b.press('Escape');
      assert.equal(await b.eval(`!!document.querySelector('.cm-search')`), false);
    });

    test('F10 글을 고치고 레벨 접기·펼침을 오가도 헤딩마다 접기 표시가 붙는다', async () => {
      await setDoc('# 회고⏎⏎## 만든 것⏎⏎- [ ] 공개▮⏎⏎## 배운 것⏎⏎### 한글 조합⏎조합 중 Enter.⏎⏎### Ctrl+Z⏎execCommand.');
      const heads = ['# 회고', '## 만든 것', '## 배운 것', '### 한글 조합', '### Ctrl+Z'];
      const marked = async () => (await b.eval('lite.foldableLines()')).filter(t => t.startsWith('#'));
      assert.deepEqual(await marked(), heads);
      await b.press('Enter');
      await type('데모');
      await b.press('Enter');
      await b.press('Tab');
      await type('하위');
      await b.press('Enter');
      await b.press('Enter');
      await b.press('Enter');
      await b.click('[data-level="2"]');
      await b.click('[data-level="0"]');
      await b.waitFor('lite.folded().length === 0');
      assert.deepEqual(await marked(), heads);
    });

    // 사용자가 다크 모드에서 찾은 버그(10/18): 검색칸·버튼이 밝은 바탕에 밝은 글자라 안 보였다
    for (const scheme of ['light', 'dark']) {
      test(`F09 검색 패널 글자가 배경과 구분된다(${scheme}, 대비 4.5:1 이상)`, async t => {
        await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
        await setDoc('▮본문');
        await b.press('f', { ctrl: true });
        await b.waitFor(`!!document.querySelector('.cm-search input[main-field]')`);
        await b.typeKeys('abc');
        const ratios = await b.eval(`(() => {
          const rgb = s => s.match(/[\\d.]+/g).map(Number);
          const lum = c => {
            const f = v => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
            return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
          };
          // 실제로 칠해진 배경: 투명이면 부모로 올라간다. 그라데이션이면 셀 수 없으니 실패로 본다
          const bgOf = el => {
            for (; el; el = el.parentElement) {
              const s = getComputedStyle(el);
              if (s.backgroundImage !== 'none') return null;
              const c = rgb(s.backgroundColor);
              if (c.length < 4 || c[3] > 0) return c;
            }
            return [255, 255, 255];
          };
          const ratio = el => {
            const bg = bgOf(el);
            if (!bg) return 0;
            const [hi, lo] = [lum(rgb(getComputedStyle(el).color)), lum(bg)].sort((x, y) => y - x);
            return Math.round(((hi + 0.05) / (lo + 0.05)) * 10) / 10;
          };
          return [...document.querySelectorAll('.cm-search .cm-textfield, .cm-search .cm-button, .cm-search label')]
            .map(el => [(el.name || el.textContent || el.className).trim(), ratio(el)]);
        })()`);
        await b.press('Escape');
        await b.send('Emulation.setEmulatedMedia', { features: [] });
        t.diagnostic(JSON.stringify(ratios));
        assert.deepEqual(ratios.filter(([, r]) => r < 4.5), []);
      });
    }

    // ── 폴더 탐색기(X) ──

    // 가짜 폴더: 숨길 것(.obsidian, 사진.png)과 정렬을 확인할 이름들. stubFiles() 다음에 부른다
    const stubFolder = () => b.eval(`(() => {
      const fs = window.__fs;
      const file = (name, text) => ({
        kind: 'file', name, text,
        async getFile() { return new File([this.text], this.name); },
        async createWritable() {
          const f = this, parts = [];
          return { async write(t) { parts.push(t); }, async close() { f.text = parts.join(''); fs.writes.push({ name: f.name, text: f.text }); } };
        },
      });
      const dir = (name, children) => ({
        kind: 'directory', name, children,
        async *values() { yield* this.children; },
        async resolve(target) {
          const walk = (d, path) => {
            for (const c of d.children) {
              if (c === target) return [...path, c.name];
              const found = c.kind === 'directory' && walk(c, [...path, c.name]);
              if (found) return found;
            }
            return null;
          };
          return walk(this, []);
        },
      });
      const rootDir = fs.root = dir('노트', [
        dir('.obsidian', [file('app.json', '{}')]),
        dir('b', [file('하위.md', '# 하위\\n')]),
        dir('A', []),
        dir('나', []),
        file('10.md', '열'), file('2.md', '둘'), file('사진.png', 'x'), file('가.md', '# 가\\r\\n본문\\r\\n'), file('Z.md', 'z'),
      ]);
      window.showDirectoryPicker = async opts => {
        fs.dirOpts = opts;
        if (fs.abort) throw new DOMException('취소', 'AbortError');
        return rootDir;
      };
      window.showSaveFilePicker = async o => {
        fs.saveAs.push(o.suggestedName);
        fs.startIn = o.startIn;
        const f = file(fs.saveName || o.suggestedName, '');
        rootDir.children.push(f);
        return f;
      };
      return true;
    })()`);
    const rows = () => b.eval(`[...document.getElementById('tree').children].map(r => r.textContent)`);
    const current = () => b.eval(`[...document.querySelectorAll('#tree .current')].map(r => r.dataset.path)`);

    test('X01 [폴더]: 폴더 이름과 트리 — 폴더 먼저·한국어 이름순, .md·.txt만, 점으로 시작하는 건 숨김', async () => {
      await setDoc('▮');
      await stubFiles();
      await stubFolder();
      await b.click('#folder');
      await b.waitFor(`document.getElementById('tree').children.length > 0`);
      const r = await b.eval(`({ shown: !document.getElementById('side').hidden,
        name: document.getElementById('folder-name').textContent, mode: __fs.dirOpts.mode })`);
      assert.deepEqual(r, { shown: true, name: '노트', mode: 'readwrite' });
      assert.deepEqual(await rows(), ['▸ 나', '▸ A', '▸ b', '2.md', '10.md', '가.md', 'Z.md']);
    });

    test('X02 하위 폴더를 누르면 펼치고(한 단계 들여쓰기), 다시 누르면 접는다', async () => {
      await b.click('[data-path="/b"]');
      await b.waitFor(`document.getElementById('tree').children.length === 8`);
      assert.deepEqual(await rows(), ['▸ 나', '▸ A', '▾ b', '하위.md', '2.md', '10.md', '가.md', 'Z.md']);
      assert.equal(await b.eval(`document.querySelector('[data-path="/b/하위.md"]').style.paddingLeft`), '26px');
      await b.click('[data-path="/b"]');
      await b.waitFor(`document.getElementById('tree').children.length === 7`);
      assert.equal((await rows())[2], '▸ b');
    });

    test('X03 파일을 누르면 열리고(CRLF→LF), 트리에서 강조, 편집창 포커스', async () => {
      await b.click('[data-path="/가.md"]');
      await b.waitFor('lite.doc.path === "/가.md"');
      const r = await b.eval(`({ v: lite.snapshot().v, title: document.title, eol: lite.doc.eol,
        focused: document.activeElement === lite.view.contentDOM })`);
      assert.deepEqual(r, { v: '# 가\n본문\n', title: '가.md — LiteMD', eol: '\r\n', focused: true });
      assert.deepEqual(await current(), ['/가.md']);
    });

    test('X04 고친 채 다른 파일을 누르면 확인창, 취소하면 그대로', async () => {
      await type('수정');
      await b.eval('__fs.confirmAnswer = false');
      await b.click('[data-path="/2.md"]');
      const r = await b.eval('({ confirms: __fs.confirms.length, path: lite.doc.path, v: lite.snapshot().v })');
      assert.deepEqual(r, { confirms: 1, path: '/가.md', v: '수정# 가\n본문\n' });
    });

    test('X05 Ctrl+S: 트리에서 연 파일에 대화상자 없이 덮어쓰기(CRLF 유지)', async () => {
      await b.press('s', { ctrl: true });
      await b.waitFor('__fs.writes.length === 1');
      const r = await b.eval('({ w: __fs.writes[0], saveAs: __fs.saveAs.length, title: document.title })');
      assert.deepEqual(r, { w: { name: '가.md', text: '수정# 가\r\n본문\r\n' }, saveAs: 0, title: '가.md — LiteMD' });
    });

    test('X06 새 문서 Ctrl+S: 대화상자가 열린 폴더에서 시작, 저장하면 트리에 새 파일이 강조돼 보인다', async () => {
      await setDoc('새 노트 내용▮');
      await b.eval(`__fs.saveName = '새 노트.md'`);
      await b.press('s', { ctrl: true });
      await b.waitFor(`[...document.getElementById('tree').children].some(r => r.dataset.path === "/새 노트.md")`);
      const r = await b.eval('({ startInIsFolder: __fs.startIn === __fs.root, path: lite.doc.path })');
      assert.deepEqual(r, { startInIsFolder: true, path: '/새 노트.md' });
      assert.deepEqual(await current(), ['/새 노트.md']);
    });

    test('X07 [×]: 폴더만 닫고 열린 문서는 그대로', async () => {
      await b.click('#close-folder');
      const r = await b.eval(`({ hidden: document.getElementById('side').hidden, rows: document.getElementById('tree').children.length,
        name: lite.doc.name, v: lite.snapshot().v })`);
      assert.deepEqual(r, { hidden: true, rows: 0, name: '새 노트.md', v: '새 노트 내용' });
    });

    test('X08 폴더 선택을 취소하면 알림 없이 그대로', async () => {
      await b.eval('__fs.abort = true');
      await b.click('#folder');
      await sleep(50);
      const r = await b.eval(`({ hidden: document.getElementById('side').hidden, alerts: __fs.alerts.length })`);
      assert.deepEqual(r, { hidden: true, alerts: 0 });
    });

    // 여기부터는 File System Access API를 없앤다 — 뒤에 다른 테스트를 붙이려면 stubFiles()부터
    test('B19 File System Access API가 없으면 파일 선택으로 연다', async () => {
      await setDoc('▮');
      await stubFiles();
      await b.eval(`(() => {
        window.showOpenFilePicker = undefined;
        window.showSaveFilePicker = undefined;
        const picker = document.getElementById('file');
        picker.click = () => {
          const dt = new DataTransfer();
          dt.items.add(new File(['폰에서 연 글\\r\\n'], 'm.md'));
          picker.files = dt.files;
          picker.dispatchEvent(new Event('change'));
        };
      })()`);
      await b.press('o', { ctrl: true });
      await b.waitFor('lite.snapshot().v !== ""');
      const r = await b.eval('({ v: lite.snapshot().v, name: lite.doc.name, handle: lite.doc.handle, eol: lite.doc.eol })');
      assert.deepEqual(r, { v: '폰에서 연 글\n', name: 'm.md', handle: null, eol: '\r\n' });
    });

    test('B20 File System Access API가 없으면 다운로드로 저장(CRLF 유지)', async () => {
      await type('추가 ');
      await b.eval(`(() => {
        URL.createObjectURL = blob => (__fs.blob = blob, 'blob:fake');
        URL.revokeObjectURL = () => {};
        HTMLAnchorElement.prototype.click = function () { __fs.downloads.push(this.download); };
      })()`);
      await b.press('s', { ctrl: true });
      await b.waitFor('__fs.downloads.length === 1');
      const r = await b.eval(`(async () => ({ name: __fs.downloads[0], text: await __fs.blob.text(), title: document.title }))()`);
      assert.deepEqual(r, { name: 'm.md', text: '추가 폰에서 연 글\r\n', title: 'm.md — LiteMD' });
    });

    // 페이지를 새로 여니까 맨 마지막에 둔다
    test('X09 showDirectoryPicker가 없는 브라우저에서는 [폴더] 버튼을 숨긴다', async () => {
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.showDirectoryPicker = undefined;' });
      await b.open(PAGE);
      assert.equal(await b.eval(`document.getElementById('folder').hidden`), true);
    });
  });
}
