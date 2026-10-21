// README용 움직이는 데모 — 가짜 폴더로 실제 조작(목록 이어쓰기·체크박스·접기·읽기 화면·탐색기 접기·넓게)을 하며 화면을 찍어
// APNG(움직이는 PNG) 한 장으로 묶는다: docs/demo.png. GIF와 달리 색을 줄이지 않고 PNG 프레임을 그대로 잇는다.
// 실행: npm run build 다음에 node tools/demo.mjs (크롬 경로가 다르면 CHROME_PATH)
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';
import { launch } from '../tests/cdp.mjs';

const exe = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const page = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const out = fileURLToPath(new URL('../docs/demo.png', import.meta.url));

const note = `# 10월 회고

## 만든 것

- [x] LiteMD v1 — textarea 한 장
- [x] 폴더 탐색기
  - 점으로 시작하는 폴더(.git, .obsidian)는 숨기고, 마크다운과 텍스트 파일만 한국어 이름순으로 보여 준다. 누르면 바로 열린다
- [ ] GitHub 공개

## 배운 것

### 한글 조합
조합 중 Enter는 keyCode 229로 먼저 온다.

### Ctrl+Z
execCommand로 넣어야 기록이 남는다.

## 다음 달

- 라이브 프리뷰
`;

// ── APNG 만들기: 프레임 PNG들의 IDAT를 fdAT로 옮겨 담는다 ──

function readChunks(png) {
  const chunks = [];
  for (let i = 8; i < png.length;) {
    const len = png.readUInt32BE(i);
    chunks.push({ type: png.toString('ascii', i + 4, i + 8), data: png.subarray(i + 8, i + 8 + len) });
    i += 12 + len;
  }
  return chunks;
}

function chunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  return Buffer.concat([head, body, crc]);
}

function apng(frames) {
  const parsed = frames.map(f => readChunks(f.png));
  const ihdr = parsed[0].find(c => c.type === 'IHDR').data;
  if (parsed.some(p => !p.find(c => c.type === 'IHDR').data.equals(ihdr))) throw new Error('프레임 크기·형식이 다르다');
  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr)];
  // 첫 프레임의 색 정보 같은 보조 청크는 IDAT보다 앞에 둔다
  for (const c of parsed[0]) if (!['IHDR', 'IDAT', 'IEND'].includes(c.type)) parts.push(chunk(c.type, c.data));
  const actl = Buffer.alloc(8);
  actl.writeUInt32BE(frames.length, 0); // 프레임 수, 반복 0 = 무한
  parts.push(chunk('acTL', actl));
  let seq = 0;
  frames.forEach((f, k) => {
    const fctl = Buffer.alloc(26);
    fctl.writeUInt32BE(seq++, 0);
    fctl.writeUInt32BE(ihdr.readUInt32BE(0), 4);
    fctl.writeUInt32BE(ihdr.readUInt32BE(4), 8);
    fctl.writeUInt16BE(f.ms, 20); // 표시 시간 = ms/1000초
    fctl.writeUInt16BE(1000, 22);
    parts.push(chunk('fcTL', fctl));
    for (const c of parsed[k].filter(c => c.type === 'IDAT')) {
      if (k === 0) {
        parts.push(chunk('IDAT', c.data));
      } else {
        const s = Buffer.alloc(4);
        s.writeUInt32BE(seq++);
        parts.push(chunk('fdAT', Buffer.concat([s, c.data])));
      }
    }
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

// ── 조작하며 찍기 ──

const b = await launch(exe);
const frames = [];
const shot = async (ms = 900) => {
  await b.eval('new Promise(r => setTimeout(() => requestAnimationFrame(() => r(0)), 400))'); // 고친 뒤 구문 해석·거터 갱신이 끝나도록
  frames.push({ png: await b.screenshot(), ms });
};
try {
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 600, deviceScaleFactor: 1, mobile: false });
  await b.open(page);
  await shot(1200);
  await b.eval(`(() => {
    const file = (name, text) => ({ kind: 'file', name, async getFile() { return new File([text], name); } });
    const dir = (name, children) => ({ kind: 'directory', name, children, async *values() { yield* children; } });
    const retro = file('10월 회고.md', ${JSON.stringify(note)});
    const notes = dir('노트', [dir('개발', [file('LiteMD 아이디어.md', '')]), dir('생활', []), retro, file('읽을거리.md', '')]);
    notes.resolve = async h => (h === retro ? ['10월 회고.md'] : null);
    window.showDirectoryPicker = async () => notes;
    return 0;
  })()`);
  await b.click('#folder');
  await b.waitFor(`document.getElementById('tree').children.length > 0`);
  await shot();
  await b.click('[data-path="/10월 회고.md"]');
  await b.waitFor('lite.doc.path === "/10월 회고.md"');
  // 커서를 문서 끝에 두면 다른 줄은 다 라이브 프리뷰로 보인다
  await b.eval('lite.view.dispatch({ selection: { anchor: lite.view.state.doc.length } })');
  await shot(1400);
  // '- [ ] GitHub 공개' 끝에서 Enter → 할 일이 이어진다
  await b.eval(`lite.view.dispatch({ selection: { anchor: lite.view.state.doc.toString().indexOf('GitHub 공개') + 9 } })`);
  await b.press('Enter');
  await b.send('Input.insertText', { text: 'README 데모' });
  await shot();
  await b.eval('lite.view.dispatch({ selection: { anchor: lite.view.state.doc.length } })');
  await shot();
  // 체크박스를 눌러 끝낸 일로
  await b.eval(`(() => { const box = [...document.querySelectorAll('.cm-lp-task')][2]; box.scrollIntoView({ block: 'center' }); return 0; })()`);
  const box = await b.eval(`(() => { const r = [...document.querySelectorAll('.cm-lp-task')][2].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await b.clickAt(box.x, box.y);
  await shot(1200);
  await b.click('[data-level="2"]'); // H1·H2만 보이게
  await shot(1400);
  await b.click('[data-level="0"]');
  await b.press('e', { ctrl: true }); // 읽기 프리뷰
  await shot(2000);
  await b.press('e', { ctrl: true });
  await shot(1500);
  await b.click('#collapse'); // 탐색기 접기 — 꺾인 줄은 넓어진 폭에 맞춰 다시 맞춘다
  await shot(1200);
  await b.click('#wide'); // 넓게: 가운데 기둥 대신 창 너비를 다 쓴다
  await shot(2000);
  writeFileSync(out, apng(frames));
  writeFileSync(out.replace(/\.png$/, '-last.png'), frames.at(-1).png); // 마지막 장면 확인용(커밋 안 함)
  console.log(`저장: ${out} (${frames.length}장)`);
} finally {
  await b.close();
}
