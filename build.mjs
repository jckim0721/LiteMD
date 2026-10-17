// src/를 묶어 루트 index.html 한 장을 만든다(npm run build).
// app.js와 CodeMirror를 esbuild로 스크립트 하나로 묶어 틀의 /*BUNDLE*/ 자리에 넣고,
// 번들에 들어간 라이브러리의 라이선스 전문을 머리말 주석으로 붙인다(MIT는 사본에 고지문을 요구한다).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const result = await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['chrome110', 'edge110', 'firefox115', 'safari16'],
  legalComments: 'none',
  metafile: true,
  write: false,
});

// 번들에 실제로 들어간 패키지 → 버전과 라이선스 전문. metafile.inputs는 읽기만 한 파일(트리 셰이킹으로 빠진 것)까지
// 들어 있어서, 출력에 바이트를 남긴 입력만 센다
const packages = new Map();
const [output] = Object.values(result.metafile.outputs);
const used = Object.entries(output.inputs).filter(([, info]) => info.bytesInOutput > 0).map(([path]) => path);
for (const input of used) {
  const m = input.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)\//);
  if (!m || packages.has(m[1])) continue;
  const dir = join('node_modules', m[1]);
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const file = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].map(f => join(dir, f)).find(existsSync);
  if (!file) throw new Error(`${m[1]}에 라이선스 파일이 없다`);
  packages.set(m[1], { version: pkg.version, text: readFileSync(file, 'utf8').trim() });
}

// 같은 전문은 한 번만 적고 그 아래 패키지 이름을 모은다
const byText = new Map();
for (const [name, p] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
  byText.set(p.text, [...(byText.get(p.text) || []), `${name}@${p.version}`]);
}
const notice = [...byText].map(([text, names]) => `${names.join(', ')}\n\n${text}`).join('\n\n----\n\n');

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
let html = readFileSync('src/index.html', 'utf8');
for (const mark of ['/*BUNDLE*/', '<!--LICENSES-->']) {
  if (!html.includes(mark)) throw new Error(`src/index.html에 ${mark} 자리가 없다`);
}
// HTML 주석 안에 "--"가 있으면 안 되므로 띄워 쓴다. 치환 문자열의 $ 패턴이 해석되지 않게 함수로 넘긴다
html = html.replace('<!--LICENSES-->', () => `<!--\nLiteMD에 묶여 들어간 라이브러리와 라이선스\n\n${notice.replace(/--/g, '- -')}\n-->`);
html = html.replace('/*BUNDLE*/', () => js);
writeFileSync('index.html', html);
console.log(`index.html ${Buffer.byteLength(html)}바이트 · 라이브러리 ${packages.size}개: ${[...packages.keys()].join(', ')}`);
