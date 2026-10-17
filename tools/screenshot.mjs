// README용 스크린샷 — 가짜 폴더로 탐색기를 연 화면을 docs/screenshot.png로 저장한다.
// 실행: node tools/screenshot.mjs (크롬 경로가 다르면 CHROME_PATH)
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from '../tests/cdp.mjs';

const exe = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const page = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const out = fileURLToPath(new URL('../docs/screenshot.png', import.meta.url));

const demo = `# 이번 주

- [x] 장보기
- [ ] 분유 주문
  - 단계 확인
- [ ] 세탁기 필터

1. 블로그 초안
2. LiteMD 테스트
`;

const b = await launch(exe);
try {
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 620, deviceScaleFactor: 1, mobile: false });
  await b.open(page);
  await b.eval(`(async () => {
    const file = (name, text) => ({ kind: 'file', name, async getFile() { return new File([text], name); } });
    const dir = (name, children) => ({ kind: 'directory', name, children, async *values() { yield* children; } });
    const week = file('이번 주.md', ${JSON.stringify(demo)});
    const notes = dir('노트', [
      dir('개발', [file('LiteMD 아이디어.md', ''), file('회고.md', '')]),
      dir('생활', []),
      week,
      file('읽을거리.md', ''),
    ]);
    notes.resolve = async h => (h === week ? ['이번 주.md'] : null);
    window.showDirectoryPicker = async () => notes;
    await openFolder();
    toggleDir('/개발');
    await new Promise(r => setTimeout(r, 100));
    await openEntry(week, '/이번 주.md');
    ta.setSelectionRange(ta.value.indexOf('단계 확인') + 5, ta.value.indexOf('단계 확인') + 5);
  })()`);
  mkdirSync(fileURLToPath(new URL('../docs/', import.meta.url)), { recursive: true });
  writeFileSync(out, await b.screenshot());
  console.log('저장:', out);
} finally {
  await b.close();
}
