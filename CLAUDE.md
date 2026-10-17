# CLAUDE.md — LiteMD

HTML 파일 한 장짜리 초경량 마크다운 에디터. 외부 라이브러리 없이 `index.html` 하나(20KB 이하)로 열기·저장, 목록 이어쓰기, 들여쓰기만 한다. "매달 하나 만들기"의 0호(2026-10, 마감 10/31). 이름은 가칭.

## 단일 진실원 (스펙·트래커)

스펙과 진척은 **Obsidian 볼트 노트가 기준**이다 (이 레포 밖, 사용자 볼트 `1_Projects/Programming/LiteMD/`):

- `LiteMD_작업계획서` — spec: 범위·데이터 모델·함수 계약·검증 예시(§6)·Claude가 정한 것
- `LiteMD_작업내용` — 작업 로그·구현 피드백 로그(검증 실패가 spec을 바꾼 흔적)
- `LiteMD_테스트` — 테스트 케이스(U·B·M)와 실행 결과

완성 기준(DoD) 체크리스트는 볼트 `1_Projects/Programming/장비SW현대화_라인업` §4. 작업 시작 시 작업계획서를 읽고, 끝나면 작업내용에 한 줄, 테스트를 다시 돌려 결과를 갱신한다.

## 구조

```
index.html              앱 전부
  <script id="logic">   순수 함수(목록 이어쓰기·들여쓰기·줄바꿈·단축키 판별). DOM을 쓰지 않는다
  <script>              화면: 편집창·파일 입출력·단축키·수정 표시
tests/vectors.mjs       검증 예시 — 볼트 spec §6 표와 같아야 한다
tests/logic.test.mjs    U: logic 블록만 떼어 Node vm에서 돌리는 단위 테스트 + 크기·외부 리소스 검사
tests/browser.test.mjs  B: 크롬·엣지 headless에 실제 키 이벤트(CDP)
tests/cdp.mjs           CDP 클라이언트(Node 22 내장 WebSocket·fetch, npm 의존성 0)
```

## 실행

- 앱: `index.html`을 크롬·엣지로 연다. 빌드 단계 없음
- 테스트: `node --test "tests/*.test.mjs"` (Node 22+. 디렉터리만 주면 모듈로 읽어서 실패한다 — glob으로). 브라우저 테스트는 크롬·엣지가 기본 설치 경로에 있으면 임시 프로필로 띄운다. 다른 경로면 `CHROME_PATH`·`EDGE_PATH`
- 이 PC(WSL)에는 node가 없다 → `"/mnt/c/Program Files/nodejs/node.exe" --test "tests/*.test.mjs"`

## 지킬 것

- `index.html`은 외부 리소스 0, 20KB 이하 — C01·C02 테스트가 막는다
- logic 블록은 DOM을 건드리지 않는다. 함수는 `function` 선언으로(Node vm에서 전역으로 보이게)
- 글 변경은 `applyEdit`(execCommand)로만 한다. `value` 대입은 Ctrl+Z 기록을 지운다 — 파일을 열 때만 예외
- keydown에서 `isComposing`·`keyCode 229`는 건너뛴다. 한글 조합 중에 가로채면 마지막 글자가 겹친다
- 동작을 바꾸면 spec §6 → `tests/vectors.mjs` 순서로 고친다(spec이 먼저)
