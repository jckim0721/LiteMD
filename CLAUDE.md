# CLAUDE.md — LiteMD

HTML 파일 한 장으로 된 마크다운 에디터. CodeMirror 6을 번들한다. v3(2호, 태그 `v3.0`, `main`·Pages 루트)는 라이브 프리뷰·읽기 프리뷰, v2(1호, 태그 `v2.0`)는 헤딩 접기·찾기, v1(0호, 태그 `v1.0`, Pages `/v1/`)은 textarea 한 장이었다. GitHub `jckim0721/LiteMD`(MIT), 판마다 릴리스.

## 단일 진실원 (스펙·트래커)

스펙과 진척은 **Obsidian 볼트 노트가 기준**이다 (이 레포 밖, 사용자 볼트 `1_Projects/Programming/LiteMD/`):

- `LiteMD_v3_작업계획서` — v3 spec: 라이브(LP)·읽기(R) 프리뷰 검증 예시
- `LiteMD_v2_작업계획서` — v2 spec: 달라지는 것(엔진·헤딩 접기·찾기)·검증 예시 H·L
- `LiteMD_작업계획서` — v1 spec: 목록·Tab·파일·탐색기 규칙과 검증 예시 E·T·S·P(v2도 그대로 지킨다)
- `LiteMD_작업내용` — 작업 로그·구현 피드백 로그(검증 실패가 spec을 바꾼 흔적)
- `LiteMD_v3_테스트` / `LiteMD_v2_테스트` / `LiteMD_테스트` — 테스트 케이스와 실행 결과

완성 기준(DoD)은 볼트 `1_Projects/Programming/장비SW현대화_라인업` §4. 작업 시작 시 spec을 읽고, 끝나면 작업내용에 한 줄, 테스트를 다시 돌려 결과를 갱신한다.

## 구조

```
src/index.html          화면 틀. /*BUNDLE*/ 자리에 번들, <!--LICENSES--> 자리에 라이선스 고지가 들어간다
src/app.js              편집기(CodeMirror)·파일 입출력·탐색기·단축키. window.lite = 브라우저 테스트용 손잡이
src/logic.js            순수 함수(DOM·CodeMirror 없음) — v1 logic 블록 그대로 + levelFoldTargets
src/folding.js          헤딩 섹션(구문 트리)·foldService·레벨 접기·Ctrl+Shift+[
src/livepreview.js      previewSpans(순수) → ViewPlugin 꾸밈, 체크박스 토글, 링크 Ctrl+클릭
src/render.js           renderMarkdown(순수) → 읽기 화면 HTML, safeUrl
build.mjs               esbuild로 묶어 루트 index.html 생성(번들에 바이트를 남긴 패키지의 라이선스만 고지)
index.html              빌드 결과물. 커밋한다(GitHub Pages가 그대로 서빙)
tests/vectors.mjs       검증 예시 — 볼트 spec §6 표와 같아야 한다
tests/logic.test.mjs    U: src/를 Node에서 바로 불러 테스트 + C01 크기(400KB)·C02 외부 리소스·C03 빌드 최신
tests/browser.test.mjs  B·F·X: 크롬·엣지 headless에 실제 키·마우스(CDP)
tests/cdp.mjs           CDP 클라이언트(Node 22 내장 WebSocket·fetch)
```

## 실행

- 앱: 루트 `index.html`을 크롬·엣지로 연다
- 빌드: `npm run build` — src/를 고쳤으면 반드시. 안 하면 C03이 실패한다
- 테스트: `npm test` (= `node --test "tests/*.test.mjs"`, Node 22+. 디렉터리만 주면 실패하니 glob으로)
- 이 PC(WSL)에는 node·npm이 없다 → `cmd.exe /c "npm run build"`, 테스트는 `"/mnt/c/Program Files/nodejs/node.exe" --test "tests/*.test.mjs"`

## 지킬 것

- 런타임 외부 요청 0, `index.html` 400KB 이하 — C01·C02·B01이 막는다
- `markdown()` 대신 `markdownLanguage`만 쓴다(`markdown()`은 HTML 언어팩까지 끌고 와서 538KB가 된다). 헤딩 접기는 `folding.js`가 직접 붙인다
- 글 변경 규칙(목록·Tab)은 `logic.js`의 순수 함수로만. 동작을 바꾸면 spec §6 → `tests/vectors.mjs` → 구현 순서(spec이 먼저)
- 한글 조합 중 키는 CodeMirror가 키맵 전에 걸러 낸다(`ignoreDuringComposition`). 그래서 명령 쪽에서 따로 막지 않는다 — B08이 확인
- 접을 때는 커서를 접힌 범위 밖(헤딩 줄 끝)으로 뺀다. 안에 두면 CodeMirror가 다음 선택 변경 때 접기를 풀어 버린다
- 라이브 프리뷰는 줄 단위: 커서·선택이 걸친 줄은 꾸미지 않는다. 그래서 한글 조합 중인 줄은 늘 원문이다 — 이 규칙을 깨면 조합이 망가질 수 있다
- 읽기 화면 HTML은 `renderMarkdown`만 만든다(글자는 전부 이스케이프, 주소는 `safeUrl`). `innerHTML`에 다른 걸 넣지 않는다
- 색은 CSS 변수로. 글자 대비는 라이트·다크 둘 다 4.5:1 이상(F09·P08이 잰다)

## 문서·릴리스

- 사람이 읽는 문서는 한국어·영어 두 벌이다: `README.md`↔`README.en.md`, `CHANGELOG.md`↔`CHANGELOG.en.md`. 하나를 고치면 짝도 같이 고친다
- 새 판: 두 CHANGELOG에 그 판 구간과 비교표 열을 쓴다 → 태그 `vX.Y` → 빌드한 `index.html`을 `LiteMD-vX.Y.html`로 붙여 `gh release create`. 본문은 실행 안내(한·영 한 줄씩) + 한국어 CHANGELOG의 그 판 구간·비교표 + `---` + 영어 같은 구간, 제목은 `vX.Y — N호: … · Build #N: …`
- 받은 파일 하나로 돌아야 한다(폐쇄망에서 쓴다). 올린 뒤 내려받아 해시가 빌드와 같은지, 오프라인으로 열어 도는지 본다
