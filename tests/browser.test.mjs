// 브라우저 테스트(B) — 크롬·엣지 headless에 실제 키 이벤트를 보내 화면 동작을 확인한다.
// 파일 대화상자는 띄울 수 없으니 showOpenFilePicker·showSaveFilePicker를 페이지 안에서 가짜로 바꿔 끼운다.
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { launch } from './cdp.mjs';
import { vectors, parse, show, expectedOnScreen } from './vectors.mjs';

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
      b.initial = await b.eval(`({ title: document.title, focused: document.activeElement === ta,
        fsa: typeof window.showOpenFilePicker })`);
      // keydown 기록기 — 앱 핸들러가 끝난 뒤(버블 단계, window)의 상태를 본다
      await b.eval(`window.__keys = []; addEventListener('keydown', e =>
        __keys.push({ key: e.key, keyCode: e.keyCode, isComposing: e.isComposing, prevented: e.defaultPrevented })); 0`);
    });
    after(() => b?.close());

    // 편집창을 주어진 상태로 초기화한다(값을 대입하므로 Ctrl+Z 기록도 지워진다)
    const setDoc = display => {
      const { text, s, e } = parse(display);
      return b.eval(`(() => {
        ta.value = ${JSON.stringify(text)};
        doc = { handle: null, name: '', saved: ta.value, eol: '\\n' };
        ta.focus();
        ta.setSelectionRange(${s}, ${e});
        refresh();
      })()`);
    };
    const screen = async () => {
      const r = await b.eval('({ v: ta.value, s: ta.selectionStart, e: ta.selectionEnd })');
      return show(r.v, r.s, r.e);
    };
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
      assert.ok(b.requests.every(url => url === PAGE), '외부 요청이 없어야 한다');
    });

    for (const v of vectors) {
      test(`B02 ${v.id} ${v.key} — ${v.note}`, async () => {
        await setDoc(v.before);
        await b.press(v.key === 'Enter' ? 'Enter' : 'Tab', { shift: v.key === 'Shift+Tab' });
        assert.equal(await screen(), expectedOnScreen(v));
        assert.equal(await b.eval('document.activeElement === ta'), true, '포커스가 편집창에 남아야 한다');
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
      assert.equal(await b.eval('ta.value'), '- 항목');
    });

    test('B06 빈 항목을 지운 뒤 Ctrl+Z 한 번이면 기호가 돌아온다', async () => {
      await setDoc('- 첫째⏎- ▮');
      await b.press('Enter');
      assert.equal(await screen(), '- 첫째⏎▮');
      await b.press('z', { ctrl: true });
      assert.equal(await b.eval('ta.value'), '- 첫째\n- ');
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
      const during = await b.eval('ta.value');
      await type('귀'); // 조합 확정
      await b.press('Enter'); // 확정 뒤 진짜 Enter
      t.diagnostic('keydown 기록: ' + JSON.stringify(await b.eval('__keys')));
      assert.equal(during, '- 기저귀', '조합 중에는 줄바꿈이 없어야 한다');
      assert.equal(await screen(), '- 기저귀⏎- ▮');
    });

    test('B09 isComposing인 keydown은 앱이 손대지 않는다(합성 이벤트로 가드만 확인)', async () => {
      await setDoc('- 기저귀▮');
      const r = await b.eval(`(() => {
        const fire = isComposing => {
          const ev = new KeyboardEvent('keydown', { key: 'Enter', isComposing, bubbles: true, cancelable: true });
          ta.dispatchEvent(ev);
          return ev.defaultPrevented;
        };
        const composing = fire(true), whileComposing = ta.value;
        const normal = fire(false);
        return { composing, whileComposing, normal, after: ta.value };
      })()`);
      assert.deepEqual(r, { composing: false, whileComposing: '- 기저귀', normal: true, after: '- 기저귀\n- ' });
    });

    test('B10 Ctrl+O: 파일 내용이 뜨고(CRLF→LF), 이름이 보이고, 수정 표시 없음', async () => {
      await setDoc('▮');
      await stubFiles();
      await b.press('o', { ctrl: true });
      await b.waitFor('__fs.opened === 1 && ta.value !== ""');
      const r = await b.eval(`({ v: ta.value, title: document.title, name: nameEl.textContent,
        dirty: nameEl.classList.contains('dirty'), eol: doc.eol })`);
      assert.deepEqual(r, { v: '# 제목\n- 기저귀\n', title: 'a.md — LiteMD', name: 'a.md', dirty: false, eol: '\r\n' });
    });

    test('B11 타이핑하면 탭 제목과 상단 바에 •, 되돌려서 같아지면 사라짐', async () => {
      const state = () => b.eval(`[document.title, nameEl.classList.contains('dirty')]`);
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
      const r = await b.eval('({ confirms: __fs.confirms.length, opened: __fs.opened, v: ta.value })');
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
        focused: document.activeElement === ta })`);
      assert.deepEqual(r, { suggested: '제목 없음.md', wrote: 'c.md', title: 'c.md — LiteMD', focused: true });
      assert.equal(await screen(), '버튼으로▮ 저장');
    });

    // 여기부터는 File System Access API를 없앤다 — 뒤에 다른 테스트를 붙이려면 stubFiles()부터
    test('B19 File System Access API가 없으면 파일 선택으로 연다', async () => {
      await setDoc('▮');
      await stubFiles();
      await b.eval(`(() => {
        window.showOpenFilePicker = undefined;
        window.showSaveFilePicker = undefined;
        picker.click = () => {
          const dt = new DataTransfer();
          dt.items.add(new File(['폰에서 연 글\\r\\n'], 'm.md'));
          picker.files = dt.files;
          picker.dispatchEvent(new Event('change'));
        };
      })()`);
      await b.press('o', { ctrl: true });
      await b.waitFor('ta.value !== ""');
      const r = await b.eval('({ v: ta.value, name: doc.name, handle: doc.handle, eol: doc.eol })');
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
  });
}
