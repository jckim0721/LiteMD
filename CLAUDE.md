# CLAUDE.md — LiteMD

HTML 파일 한 장으로 된 마크다운 에디터. v2(브랜치 `v2`)는 CodeMirror 6을 번들해서 헤딩 단위 접기·레벨 접기·찾기를 한다. v1(태그 `v1.0`)은 textarea 한 장·외부 라이브러리 0이었다. "매달 하나 만들기"의 0호(v1)·1호(v2). 이름은 가칭.

## 단일 진실원 (스펙·트래커)

스펙과 진척은 **Obsidian 볼트 노트가 기준**이다 (이 레포 밖, 사용자 볼트 `1_Projects/Programming/LiteMD/`):

- `LiteMD_v2_작업계획서` — v2 spec: 달라지는 것(엔진·헤딩 접기·찾기)·검증 예시 H·L
- `LiteMD_작업계획서` — v1 spec: 목록·Tab·파일·탐색기 규칙과 검증 예시 E·T·S·P(v2도 그대로 지킨다)
- `LiteMD_작업내용` — 작업 로그·구현 피드백 로그(검증 실패가 spec을 바꾼 흔적)
- `LiteMD_v2_테스트` / `LiteMD_테스트` — 테스트 케이스와 실행 결과

완성 기준(DoD)은 볼트 `1_Projects/Programming/장비SW현대화_라인업` §4. 작업 시작 시 spec을 읽고, 끝나면 작업내용에 한 줄, 테스트를 다시 돌려 결과를 갱신한다.

## 구조

```
src/index.html          화면 틀. /*BUNDLE*/ 자리에 번들, <!--LICENSES--> 자리에 라이선스 고지가 들어간다
src/app.js              편집기(CodeMirror)·파일 입출력·탐색기·단축키. window.lite = 브라우저 테스트용 손잡이
src/logic.js            순수 함수(DOM·CodeMirror 없음) — v1 logic 블록 그대로 + levelFoldTargets
src/folding.js          헤딩 섹션(구문 트리)·foldService·레벨 접기·Ctrl+Shift+[
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
