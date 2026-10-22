// 코드 블록 공용 — 편집 화면(codeblock.js·livepreview.js)과 읽기 화면(render.js)이 같이 쓴다. 순수 함수(DOM·CodeMirror 없음).
// 색칠은 문법 분석이 아니라 글자 규칙(주석 기호·따옴표·숫자 모양·키워드 목록)으로 키워드(k)·문자열(s)·주석(c)·숫자(n)만 가린다.
// 언어 팩(정식 문법 분석기)은 400KB 예산을 넘어서 쓰지 않는다 — 그래서 C++ R"(...)", 셸 heredoc 같은 건 틀릴 수 있다.

// 정보 글(```js title="x")의 첫 단어. 없으면 ''
export function codeLang(info) {
  return info.trim().split(/\s+/)[0];
}

// 코드 글 조각. 인용·목록 안의 블록은 줄마다 앞 표시(>·들여쓰기)가 빠진 CodeText 여러 개로 나뉜다
export function codeSegments(node) {
  const out = [];
  for (let c = node.firstChild; c; c = c.nextSibling) {
    if (c.name === 'CodeText') out.push({ from: c.from, to: c.to });
  }
  return out;
}

const C = 'auto break case char const continue default do double else enum extern float for goto if inline int long register '
  + 'restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL';
const CPP = C + ' alignas alignof and asm catch class concept consteval constexpr constinit const_cast co_await co_return co_yield '
  + 'decltype delete dynamic_cast explicit export final friend mutable namespace new noexcept not nullptr operator or override '
  + 'private protected public reinterpret_cast requires static_assert static_cast template this thread_local throw try typeid '
  + 'typename using virtual wchar_t char8_t char16_t char32_t xor __fastcall __property __published __closure'; // 끝 넷은 C++Builder
const CS = 'abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else '
  + 'enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long '
  + 'namespace new null object operator out override params private protected public readonly ref return sbyte sealed short '
  + 'sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual '
  + 'void volatile while async await dynamic get init let nameof partial record required set value var when where with yield';
const JAVA = 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final '
  + 'finally float for goto if implements import instanceof int interface long native new null package private protected public '
  + 'return short static super switch synchronized this throw throws transient true false try var void volatile while record yield';
const JS = 'async await break case catch class const continue debugger default delete do else export extends false finally for '
  + 'function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void '
  + 'while with yield';
const TS = JS + ' abstract any as asserts bigint boolean declare enum implements infer interface is keyof module namespace never '
  + 'number object private protected public readonly satisfies string symbol type unique unknown';
const PY = 'False None True and as assert async await break class continue def del elif else except finally for from global if '
  + 'import in is lambda nonlocal not or pass raise return try while with yield match case';
const SQL = 'select from where and or not insert into values update set delete create alter drop table view index procedure '
  + 'function trigger database join inner left right full outer cross on as group by order having limit offset top distinct union '
  + 'all exists in is null like between case when then else end begin commit rollback transaction declare return returns if while '
  + 'exec execute with asc desc primary key foreign references default constraint unique check int integer bigint varchar '
  + 'nvarchar char text date datetime decimal float bit true false';
const SH = 'if then else elif fi for while until do done case esac in function select return exit break continue local export '
  + 'readonly declare unset source alias echo printf cd set shift trap eval exec test';
const PS = 'begin break catch class continue data do dynamicparam else elseif end enum exit filter finally for foreach from '
  + 'function if in param process return switch throw trap try until using while $true $false $null';

// line·block: 주석 기호, hash: '#' 주석('any' 어디서나 | 'word' 단어 첫머리), pre: 줄 첫머리 #지시어는 키워드,
// quotes: 문자열 따옴표, multi: 여러 줄에 걸칠 수 있는 따옴표, raw: 이스케이프 없는 따옴표, esc: 이스케이프 글자,
// doubled: 따옴표 두 개('')는 글자 하나, triple: """·''', verbatim: C#의 @"...", ci: 키워드 대소문자 무시
const C_LIKE = { line: '//', block: ['/*', '*/'], quotes: '"\'' };
const RULES = {
  c: { ...C_LIKE, kw: C, pre: true },
  cpp: { ...C_LIKE, kw: CPP, pre: true },
  cs: { ...C_LIKE, kw: CS, pre: true, verbatim: true },
  java: { ...C_LIKE, kw: JAVA },
  js: { ...C_LIKE, kw: JS, quotes: '"\'`', multi: '`' },
  ts: { ...C_LIKE, kw: TS, quotes: '"\'`', multi: '`' },
  py: { kw: PY, hash: 'any', quotes: '"\'', triple: true },
  sql: { line: '--', block: ['/*', '*/'], kw: SQL, ci: true, quotes: '\'"', multi: '\'"', esc: '', doubled: true },
  sh: { kw: SH, hash: 'word', quotes: '"\'`', multi: '"\'`', raw: '\'' },
  ps: { block: ['<#', '#>'], kw: PS, ci: true, hash: 'any', quotes: '"\'', multi: '"\'', esc: '`', doubled: true },
  json: { ...C_LIKE, kw: 'true false null', quotes: '"' },
  yaml: { kw: 'true false null yes no', ci: true, hash: 'word', quotes: '"\'', doubled: true },
  xml: { xml: true },
};
for (const r of Object.values(RULES)) {
  if (r.kw) r.kw = new Set((r.ci ? r.kw.toLowerCase() : r.kw).split(' '));
}
const ALIAS = {
  h: 'cpp', 'c++': 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', csharp: 'cs', 'c#': 'cs', javascript: 'js', jsx: 'js', mjs: 'js',
  typescript: 'ts', tsx: 'ts', python: 'py', bash: 'sh', shell: 'sh', zsh: 'sh', ps1: 'ps', powershell: 'ps', pwsh: 'ps',
  jsonc: 'json', html: 'xml', htm: 'xml', xaml: 'xml', svg: 'xml', yml: 'yaml',
};

const WORD = /[A-Za-z_$][\w$]*/y;
const NUM = /0[xX][\da-fA-F_]+[a-zA-Z]*|0[bB][01_]+[a-zA-Z]*|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?[a-zA-Z]*/y;
const PRE = /#[ \t]*[A-Za-z]+/y;
const TAG = /<\/?[A-Za-z_?!][\w:.-]*/y;
const isWord = ch => ch !== undefined && /[\w$]/.test(ch);

function sticky(re, code, i) {
  re.lastIndex = i;
  return re.exec(code) ? re.lastIndex : i;
}

function until(code, i, close) {
  const j = code.indexOf(close, i);
  return j < 0 ? code.length : j + close.length;
}

// i의 따옴표로 시작한 문자열의 끝(닫는 따옴표 뒤). 여러 줄이 안 되는 따옴표는 줄 끝에서 멈춘다(닫히지 않음)
function stringEnd(code, i, r) {
  const q = code[i];
  if (r.triple && code.startsWith(q + q + q, i)) return until(code, i + 3, q + q + q);
  const esc = r.raw && r.raw.includes(q) ? '' : r.esc ?? '\\';
  const multi = Boolean(r.multi && r.multi.includes(q));
  for (let j = i + 1; j < code.length; j++) {
    const ch = code[j];
    if (esc && ch === esc) j++;
    else if (ch === '\n' && !multi) return j;
    else if (ch === q) {
      if (!(r.doubled && code[j + 1] === q)) return j + 1;
      j++;
    }
  }
  return code.length;
}

// C#의 @"..." — 이스케이프 없음, ""는 따옴표 하나, 여러 줄
function verbatimEnd(code, i) {
  for (let j = i + 2; j < code.length; j++) {
    if (code[j] !== '"') continue;
    if (code[j + 1] !== '"') return j + 1;
    j++;
  }
  return code.length;
}

function xmlTokens(code) {
  const out = [];
  let tag = false;
  for (let i = 0; i < code.length;) {
    let j = i, type = '';
    if (code.startsWith('<!--', i)) [j, type] = [until(code, i + 4, '-->'), 'c'];
    else if (!tag && code[i] === '<' && (j = sticky(TAG, code, i)) > i) [type, tag] = ['k', true];
    else if (tag && code[i] === '>') tag = false;
    else if (tag && (code[i] === '"' || code[i] === '\'')) [j, type] = [until(code, i + 1, code[i]), 's'];
    if (type) out.push({ from: i, to: j, type });
    i = Math.max(j, i + 1);
  }
  return out;
}

// 코드 글 → 칠할 토큰들(from 순, 겹치지 않음). 모르는 언어면 []
export function codeTokens(lang, code) {
  const key = lang.toLowerCase();
  const name = Object.hasOwn(ALIAS, key) ? ALIAS[key] : key;
  const r = Object.hasOwn(RULES, name) ? RULES[name] : null; // 'constructor' 같은 이름이 객체 기본 속성을 집지 않게
  if (!r || !code) return [];
  if (r.xml) return xmlTokens(code);
  const out = [];
  const lineHead = i => {
    let j = i;
    while (j > 0 && (code[j - 1] === ' ' || code[j - 1] === '\t')) j--;
    return j === 0 || code[j - 1] === '\n';
  };
  for (let i = 0; i < code.length;) {
    const ch = code[i];
    let j = i, type = '';
    if (r.block && code.startsWith(r.block[0], i)) [j, type] = [until(code, i + r.block[0].length, r.block[1]), 'c'];
    else if ((r.line && code.startsWith(r.line, i)) || (ch === '#' && (r.hash === 'any' || (r.hash === 'word' && !/\S/.test(code[i - 1] ?? ' '))))) {
      j = code.indexOf('\n', i);
      [j, type] = [j < 0 ? code.length : j, 'c'];
    } else if (ch === '#' && r.pre && lineHead(i)) {
      j = sticky(PRE, code, i);
      type = 'k';
    } else if (r.verbatim && ch === '@' && code[i + 1] === '"') [j, type] = [verbatimEnd(code, i), 's'];
    else if (r.quotes.includes(ch)) [j, type] = [stringEnd(code, i, r), 's'];
    else if (/[\d.]/.test(ch) && !isWord(code[i - 1]) && (j = sticky(NUM, code, i)) > i) type = 'n';
    else if ((j = sticky(WORD, code, i)) > i) {
      const word = code.slice(i, j);
      if (r.kw.has(r.ci ? word.toLowerCase() : word)) type = 'k';
    }
    if (type) out.push({ from: i, to: j, type });
    i = Math.max(j, i + 1);
  }
  return out;
}
