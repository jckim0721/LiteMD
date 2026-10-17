// README용 스크린샷 — 가짜 폴더로 탐색기를 열고 헤딩 하나를 접은 화면을 docs/screenshot.png로 저장한다.
// 실행: npm run build 다음에 node tools/screenshot.mjs (크롬 경로가 다르면 CHROME_PATH)
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from '../tests/cdp.mjs';

const exe = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const page = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const out = fileURLToPath(new URL('../docs/screenshot.png', import.meta.url));

const demo = `# 10월 회고

이번 달은 매달 하나 만들기 0호를 끝냈다.

## 만든 것

- [x] LiteMD v1 — textarea 한 장
- [x] 폴더 탐색기
- [ ] GitHub 공개

## 배운 것

### 한글 조합
조합 중 Enter는 keyCode 229로 먼저 온다.

### Ctrl+Z
execCommand로 넣어야 기록이 남는다.

## 다음 달

- LiteMD v2 — **헤딩 접기**
`;

const b = await launch(exe);
try {
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 640, deviceScaleFactor: 1, mobile: false });
  await b.open(page);
  await b.eval(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const file = (name, text) => ({ kind: 'file', name, async getFile() { return new File([text], name); } });
    const dir = (name, children) => ({ kind: 'directory', name, children, async *values() { yield* children; } });
    const note = file('10월 회고.md', ${JSON.stringify(demo)});
    const notes = dir('노트', [
      dir('개발', [file('LiteMD 아이디어.md', ''), file('설계 메모.md', '')]),
      dir('생활', []),
      note,
      file('읽을거리.md', ''),
    ]);
    notes.resolve = async h => (h === note ? ['10월 회고.md'] : null);
    window.showDirectoryPicker = async () => notes;
    document.getElementById('folder').click();
    await wait(200);
    document.querySelector('[data-path="/개발"]').click();
    await wait(200);
    document.querySelector('[data-path="/10월 회고.md"]').click();
    await wait(200);
    // '## 배운 것' 섹션 안에 커서를 두고 Ctrl+Shift+[ 를 두 번(안쪽 → 한 단계 바깥)
    lite.view.dispatch({ selection: { anchor: lite.view.state.doc.toString().indexOf('조합 중 Enter') } });
    lite.view.focus();
  })()`);
  await b.press('{', { ctrl: true, shift: true });
  await b.press('{', { ctrl: true, shift: true });
  await b.eval(`lite.view.dispatch({ selection: { anchor: lite.view.state.doc.toString().indexOf('GitHub 공개') + 9 } })`);
  mkdirSync(fileURLToPath(new URL('../docs/', import.meta.url)), { recursive: true });
  writeFileSync(out, await b.screenshot());
  console.log('저장:', out);
} finally {
  await b.close();
}
