// 크롬·엣지를 headless로 띄워 CDP로 조종하는 최소 클라이언트.
// npm 의존성 없음 — Node 22 내장 WebSocket·fetch만 쓴다. 사용자의 크롬 프로필은 건드리지 않고 임시 프로필로 띄운다.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

// Input.dispatchKeyEvent에 넣을 키 정의. text가 있으면 글자 입력(기본 동작)까지 일어난다.
const KEYS = {
  Enter: { key: 'Enter', code: 'Enter', vk: 13, text: '\r' },
  Tab: { key: 'Tab', code: 'Tab', vk: 9 },
  Process: { key: 'Process', code: 'Enter', vk: 229 }, // 한글 조합 중 Enter가 앱에 도착하는 모습(keyCode 229)
  z: { key: 'z', code: 'KeyZ', vk: 90 },
  o: { key: 'o', code: 'KeyO', vk: 79 },
  s: { key: 's', code: 'KeyS', vk: 83 },
  'ㄴ': { key: 'ㄴ', code: 'KeyS', vk: 83 }, // 한글 입력 모드에서 S 자리
};

const modBits = mods => (mods.alt ? 1 : 0) | (mods.ctrl ? 2 : 0) | (mods.meta ? 4 : 0) | (mods.shift ? 8 : 0);

export async function launch(exe) {
  const profile = mkdtempSync(join(tmpdir(), 'litemd-'));
  const proc = spawn(exe, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', 'about:blank',
  ], { stdio: 'ignore' });

  // 포트 0으로 띄우면 브라우저가 고른 포트를 프로필 폴더의 DevToolsActivePort에 적는다
  const portFile = join(profile, 'DevToolsActivePort');
  let port = '';
  for (let i = 0; !port; i++) {
    if (i > 200) throw new Error('브라우저가 디버그 포트를 열지 않았다: ' + exe);
    await sleep(100);
    if (existsSync(portFile)) port = readFileSync(portFile, 'utf8').split('\n')[0].trim();
  }
  const base = `http://127.0.0.1:${port}`;
  const version = await (await fetch(`${base}/json/version`)).json();
  const target = (await (await fetch(`${base}/json/list`)).json()).find(t => t.type === 'page');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('CDP 연결 실패'));
  });
  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (!msg.id) return listeners.forEach(fn => fn(msg));
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`));
    else p.resolve(msg.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const once = method => new Promise(resolve => {
    const fn = msg => {
      if (msg.method !== method) return;
      listeners.delete(fn);
      resolve(msg.params);
    };
    listeners.add(fn);
  });

  const requests = [];
  listeners.add(msg => {
    if (msg.method === 'Network.requestWillBeSent') requests.push(msg.params.request.url);
  });

  const browser = {
    name: version.Browser,
    requests,
    send,

    async open(url) {
      await send('Page.enable');
      await send('Network.enable');
      await send('Emulation.setFocusEmulationEnabled', { enabled: true }); // headless에서도 포커스가 있는 것처럼
      requests.length = 0;
      const loaded = once('Page.loadEventFired');
      await send('Page.navigate', { url });
      await loaded;
    },

    async eval(expression) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      }
      return r.result.value;
    },

    async waitFor(expression, timeout = 3000) {
      const start = Date.now();
      while (!(await browser.eval(expression))) {
        if (Date.now() - start > timeout) throw new Error('시간 초과: ' + expression);
        await sleep(20);
      }
    },

    // 실제 키 입력. mods: { shift, ctrl, alt, meta }
    async press(name, mods = {}) {
      const k = KEYS[name];
      const modifiers = modBits(mods);
      const typed = Boolean(k.text) && !mods.ctrl && !mods.alt && !mods.meta;
      const key = mods.shift && k.key.length === 1 ? k.key.toUpperCase() : k.key;
      const common = { modifiers, key, code: k.code, windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk };
      await send('Input.dispatchKeyEvent', {
        type: typed ? 'keyDown' : 'rawKeyDown', ...common, ...(typed ? { text: k.text, unmodifiedText: k.text } : {}),
      });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...common });
    },

    // 실제 마우스 클릭(요소 가운데). mods는 press와 같다
    async click(selector, mods = {}) {
      const { x, y } = await browser.eval(`(() => {
        const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, modifiers: modBits(mods) });
      }
    },

    async screenshot() {
      return Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
    },

    async close() {
      ws.close();
      proc.kill();
      await sleep(500);
      try {
        rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
      } catch {
        // 임시 폴더라 못 지워도 테스트 결과에는 영향 없다
      }
    },
  };
  return browser;
}
