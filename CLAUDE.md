# CLAUDE.md — LiteMD

HTML 파일 한 장으로 된 마크다운 에디터. CodeMirror 6을 번들한다. v5(5호, 태그 `v5.0`, `main`·Pages 루트)는 코드블럭(상자·Enter 들여쓰기·닫는 울타리·색칠·복사)·인용(Enter 이어쓰기·겹친 막대)·줄 앞 표시 떨림 고침, v4(3호, 태그 `v4.0`)는 꺾인 줄 맞춤·넓게·탐색기 접기·새 파일·헤딩 크기, v3(2호, 태그 `v3.0`)는 라이브 프리뷰·읽기 프리뷰, v2(1호, 태그 `v2.0`)는 헤딩 접기·찾기, v1(0호, 태그 `v1.0`, Pages `/v1/`)은 textarea 한 장이었다. GitHub `jckim0721/LiteMD`(MIT), 판마다 릴리스.

## 단일 진실원 (스펙·트래커)

스펙과 진척은 **Obsidian 볼트 노트가 기준**이다 (이 레포 밖, 사용자 볼트 `1_Projects/Programming/LiteMD/`):

- `LiteMD_v5.1_작업계획서` — v5.1 spec: 줄 앞부분 탭 칸(TB)·탭 줄 Tab·Shift+Tab(T08~·S08~·E25·QT07)·라이브(LP39~) 검증 예시
- `LiteMD_v5_작업계획서` — v5 spec: 코드 블록 Enter(CE)·인용 Enter·Tab(QE·QT)·라이브(LP18~)·상자 모양(CB)·인용 깊이(QD)·색칠(HL)·읽기(R) 검증 예시
- `LiteMD_v4_작업계획서` — v4 spec: 꺾인 줄 맞춤(HP) 검증 예시, 새 파일 저장 위치 규칙
- `LiteMD_v3_작업계획서` — v3 spec: 라이브(LP)·읽기(R) 프리뷰 검증 예시
- `LiteMD_v2_작업계획서` — v2 spec: 달라지는 것(엔진·헤딩 접기·찾기)·검증 예시 H·L
- `LiteMD_작업계획서` — v1 spec: 목록·Tab·파일·탐색기 규칙과 검증 예시 E·T·S·P(v2도 그대로 지킨다)
- `LiteMD_작업내용` — 작업 로그·구현 피드백 로그(검증 실패가 spec을 바꾼 흔적)
- `LiteMD_v5_테스트` / `LiteMD_v4_테스트` / `LiteMD_v3_테스트` / `LiteMD_v2_테스트` / `LiteMD_테스트` — 테스트 케이스와 실행 결과

완성 기준(DoD)은 볼트 `1_Projects/Programming/장비SW현대화_라인업` §4. 작업 시작 시 spec을 읽고, 끝나면 작업내용에 한 줄, 테스트를 다시 돌려 결과를 갱신한다.

## 구조

```
src/index.html          화면 틀. /*BUNDLE*/ 자리에 번들, <!--LICENSES--> 자리에 라이선스 고지가 들어간다
src/app.js              편집기(CodeMirror)·파일 입출력·탐색기·단축키. window.lite = 브라우저 테스트용 손잡이
src/logic.js            순수 함수(DOM·CodeMirror 없음) — v1 logic 블록 그대로 + levelFoldTargets·hangPrefix·prefixTabs
src/folding.js          헤딩 섹션(구문 트리)·foldService·레벨 접기·Ctrl+Shift+[
src/livepreview.js      previewSpans(순수) → ViewPlugin 꾸밈, 체크박스 토글, 링크 Ctrl+클릭, 코드 상자·울타리 위젯·[복사], 인용 막대
src/render.js           renderMarkdown(순수) → 읽기 화면 HTML, safeUrl
src/code.js             코드 블록 공용(순수): codeLang(정보 글 첫 단어)·codeSegments(CodeText 조각)·codeTokens(색칠 글자 규칙, 13개 언어)
src/codeblock.js        codeEnter(순수, 구문 트리로 코드 블록 판단)·편집 화면 색칠 플러그인·copyText/copyInto([복사])
src/wrapindent.js       꺾인 줄 맞춤: hangPrefix(순수)까지의 화면 폭을 재서(requestMeasure) padding-left + 음수 text-indent, 줄 앞부분 탭 칸(고정 폭)
build.mjs               esbuild로 묶어 루트 index.html 생성(번들에 바이트를 남긴 패키지의 라이선스만 고지)
index.html              빌드 결과물. 커밋한다(GitHub Pages가 그대로 서빙)
tests/vectors.mjs       검증 예시 — 볼트 spec §6 표와 같아야 한다
tests/logic.test.mjs    U: src/를 Node에서 바로 불러 테스트 + C01 크기(400KB)·C02 외부 리소스·C03 빌드 최신
tests/browser.test.mjs  B·F·X·P·D·N·K·Q·J: 크롬·엣지 headless에 실제 키·마우스(CDP)
tests/cdp.mjs           CDP 클라이언트(Node 22 내장 WebSocket·fetch)
```

## 실행

- 앱: 루트 `index.html`을 크롬·엣지로 연다
- 빌드: `npm run build` — src/를 고쳤으면 반드시. 안 하면 C03이 실패한다
- 테스트: `npm test` (= `node --test "tests/*.test.mjs"`, Node 22+. 디렉터리만 주면 실패하니 glob으로)
- 이 PC(WSL)에는 node·npm이 없다 → `cmd.exe /c "npm run build"`, 테스트는 `"/mnt/c/Program Files/nodejs/node.exe" --test "tests/*.test.mjs"`

## 지킬 것

- 런타임 외부 요청 0, `index.html` 400KB 이하 — C01·C02·B01이 막는다. v5.1에서 401,128바이트라 남은 건 8.5KB다(언어 팩 같은 큰 의존성은 못 넣는다)
- `markdown()` 대신 `markdownLanguage`만 쓴다(`markdown()`은 HTML 언어팩까지 끌고 와서 538KB가 된다). 헤딩 접기는 `folding.js`가 직접 붙인다
- 글 변경 규칙(목록·Tab)은 `logic.js`의 순수 함수로만. 동작을 바꾸면 spec §6 → `tests/vectors.mjs` → 구현 순서(spec이 먼저)
- 한글 조합 중 키는 CodeMirror가 키맵 전에 걸러 낸다(`ignoreDuringComposition`). 그래서 명령 쪽에서 따로 막지 않는다 — B08이 확인
- 접을 때는 커서를 접힌 범위 밖(헤딩 줄 끝)으로 뺀다. 안에 두면 CodeMirror가 다음 선택 변경 때 접기를 풀어 버린다
- 라이브 프리뷰는 줄 단위: 커서·선택이 걸친 줄은 꾸미지 않는다. 그래서 한글 조합 중인 줄은 늘 원문이다 — 이 규칙을 깨면 조합이 망가질 수 있다
- 예외는 줄 앞 표시(글머리·체크박스·인용 `>`, v5): 커서 줄에서도 그리고, 커서·선택이 표시에 닿을 때만 원문. 원문 `- [ ] `가 체크박스보다 넓어 줄을 옮길 때마다 글이 튀고 꺾인 줄 수가 바뀌었다(사용자 신고 → J01). 조합은 표시 뒤 글에서 일어나고 표시 꾸밈은 안 바뀌어서 안전하다(J03·Q02). 표시 범위는 뒤 공백까지라 글 첫머리 Backspace가 표시째 지운다
- 코드 블록인지는 글자가 아니라 구문 트리로 판단한다(`codeEnter`): 울타리 안의 `- `·`>`는 목록·인용이 아니고, 부모 없이 탭·4칸 들여쓴 줄은 코드 블록이다
- 색칠 플러그인은 `Prec.highest`로 문법 강조 칸 안쪽에 둔다 — 바깥이면 인용 글의 흐린 색이 안쪽에서 이긴다(K11). 한글 조합 중엔 다시 칠하지 않고, 조합이 끝나면 빈 트랜잭션으로 다시 칠한다(CodeMirror가 갱신을 안 보낼 때가 있다 — K08)
- 읽기 화면 HTML은 `renderMarkdown`만 만든다(글자는 전부 이스케이프, 주소는 `safeUrl`). `innerHTML`에 다른 걸 넣지 않는다
- 색은 CSS 변수로. 글자 대비는 라이트·다크 둘 다 4.5:1 이상(F09·P08이 잰다)
- 꺾인 줄 맞춤은 글자 수(ch)가 아니라 화면에서 잰 폭으로 건다(라이브 체크박스가 원문 `- [ ]`보다 좁다). 재기는 `requestMeasure`, 반영은 마이크로태스크로 미룬 dispatch(재는 중엔 dispatch가 막힌다), 한글 조합 중엔 꾸밈을 안 바꾼다. 같은 화면 줄인지는 위아래가 겹치는지로 본다(체크박스는 세로 가운데라 위쪽 끝이 글자와 다르다)
- 줄 앞부분(`hangPrefix`)의 탭은 CSS 탭으로 두지 않고 `wrapindent.js`의 탭 칸(폭 = 다음 탭 자리까지, `prefixTabs`)으로 그린다. CSS 탭은 padding 안쪽부터 탭 자리를 세서 맞춤 값을 따라 폭이 바뀌고, 다시 재면 맞춤 값이 또 바뀌어 커서를 옮길 때마다 출렁였다(v5.1 사용자 신고 → J07~J10). 맞춤은 라이브를 꺼도 걸리니 탭 칸도 라이브와 따로 늘 켠다
- Tab·Shift+Tab·빈 하위 항목 Enter는 들여쓰기 끝에서 넣고 뺀다. 탭으로 끝나면 탭 1개, 아니면 공백 2칸. 탭 앞에 붙인 공백은 마크다운 깊이(탭 = 4칸 단위)를 안 바꿔서 읽기 화면에서 안 들어갔다(v5.1). 편집기 탭 폭은 2칸 그대로(사용자 결정)
- 열기·저장 창의 시작 위치는 `startDir()` 한 곳: 지금 파일 → 새 파일이면 보던 파일(`doc.startIn`) → 연 폴더

## 문서·릴리스

- 사람이 읽는 문서는 한국어·영어 두 벌이다: `README.md`(영어 — GitHub 첫 화면)↔`README.ko.md`, `CHANGELOG.md`(한국어)↔`CHANGELOG.en.md`. 하나를 고치면 짝도 같이 고친다
- 새 판: 두 CHANGELOG에 그 판 구간과 비교표 열을 쓴다 → 태그 `vX.Y` → 빌드한 `index.html`을 `LiteMD-vX.Y.html`로 붙여 `gh release create`. 본문은 실행 안내(한·영 한 줄씩) + 한국어 CHANGELOG의 그 판 구간·비교표 + `---` + 영어 같은 구간, 제목은 `vX.Y — N호: … · Build #N: …`
- 받은 파일 하나로 돌아야 한다(폐쇄망에서 쓴다). 올린 뒤 내려받아 해시가 빌드와 같은지, 오프라인으로 열어 도는지 본다
- 공개 전 판은 `main`의 `beta/index.html`(Pages `/beta/`)로 미리 올릴 수 있다 — 사용자가 PC 없이 폰으로 볼 때(v5, 10/22). 판 브랜치의 빌드를 그대로 복사하고 해시를 맞춘다. 정식 공개 때 루트로 옮기고 `beta/`는 지우거나 다음 미리보기로 쓴다. 공개를 확인할 주소는 루트·`/v1/`·`/beta/` 셋
