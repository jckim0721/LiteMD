// 읽기 프리뷰 — 편집기와 같은 마크다운 파서(@lezer/markdown)의 구문 트리를 HTML 문자열로 그린다.
// DOM을 쓰지 않아서 Node 테스트가 그대로 부른다. 안전: HTML은 실행하지 않고 글자로 보여 주고, 주소는 safeUrl로 거른다.
import { markdownLanguage } from '@codemirror/lang-markdown';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = s => s.replace(/[&<>"]/g, c => ESC[c]);
const NEW_TAB = ' target="_blank" rel="noopener noreferrer"';
const MARKS = new Set(['EmphasisMark', 'StrikethroughMark', 'CodeMark', 'LinkMark', 'HeaderMark', 'QuoteMark', 'ListMark', 'TaskMarker']);

// http·https·mailto·상대 경로·#만 통과. 그 밖의 스킴(javascript: 등)은 '#'. 브라우저처럼 공백·제어 문자를 빼고 판단한다
export function safeUrl(url) {
  const probe = url.replace(/[\u0000- \u007f]/g, '');
  if (/^(https?:|mailto:)/i.test(probe) || probe.startsWith('#')) return url.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(probe) ? '#' : url.trim();
}

function childrenOf(node) {
  const out = [];
  for (let c = node.firstChild; c; c = c.nextSibling) out.push(c);
  return out;
}

export function renderMarkdown(text) {
  const tree = markdownLanguage.parser.parse(text);
  const src = (from, to) => text.slice(from, to);

  // [from, to) 안의 글: 자식 노드 사이 글자는 이스케이프해서 그대로, 자식 노드는 inline으로
  const inlineRange = (node, from, to) => {
    let out = '';
    let pos = from;
    for (const c of childrenOf(node)) {
      if (c.to <= from || c.from >= to) continue;
      if (c.from > pos) out += esc(src(pos, c.from));
      out += inline(c);
      pos = c.to;
    }
    return out + (pos < to ? esc(src(pos, to)) : '');
  };
  const inner = node => inlineRange(node, node.from, node.to);

  // 링크·이미지: [글](주소 "제목") — 여는 [ 와 ] 사이가 글, 그 뒤 URL·LinkTitle
  const linkParts = node => {
    const kids = childrenOf(node);
    const open = kids.find(c => c.name === 'LinkMark');
    const close = kids.find(c => c.name === 'LinkMark' && src(c.from, c.to) === ']');
    const url = kids.find(c => c.name === 'URL');
    const title = kids.find(c => c.name === 'LinkTitle');
    return {
      label: open && close ? [open.to, close.from] : [node.from, node.to],
      url: url ? src(url.from, url.to) : null,
      title: title ? src(title.from + 1, title.to - 1) : null,
    };
  };

  const inline = node => {
    if (MARKS.has(node.name)) return '';
    switch (node.name) {
      case 'Emphasis': return `<em>${inner(node)}</em>`;
      case 'StrongEmphasis': return `<strong>${inner(node)}</strong>`;
      case 'Strikethrough': return `<del>${inner(node)}</del>`;
      case 'InlineCode': {
        const marks = childrenOf(node).filter(c => c.name === 'CodeMark');
        return `<code>${esc(src(marks[0].to, marks[marks.length - 1].from))}</code>`;
      }
      case 'Link': {
        const { label, url, title } = linkParts(node);
        const body = inlineRange(node, label[0], label[1]);
        if (url === null) return body; // 참조 링크([글][이름])는 정의를 안 찾으니 글만
        return `<a href="${esc(safeUrl(url))}"${title ? ` title="${esc(title)}"` : ''}${NEW_TAB}>${body}</a>`;
      }
      case 'Image': {
        const { label, url } = linkParts(node);
        return `<img src="${esc(safeUrl(url || ''))}" alt="${esc(src(label[0], label[1]))}">`;
      }
      case 'URL': // 그냥 쓴 주소(GFM 자동 링크)
      case 'Autolink': {
        const raw = node.name === 'URL' ? src(node.from, node.to) : src(node.from + 1, node.to - 1);
        return `<a href="${esc(safeUrl(raw))}"${NEW_TAB}>${esc(raw)}</a>`;
      }
      case 'HardBreak': return '<br>';
      case 'Escape': return esc(src(node.from + 1, node.to));
      case 'Entity': return src(node.from, node.to); // 파서가 엔티티로 인정한 것만 이 노드가 된다
      case 'HTMLTag':
      case 'Comment':
      case 'ProcessingInstruction': return esc(src(node.from, node.to)); // HTML은 글자로
      default: return inner(node);
    }
  };

  const listItem = item => {
    let out = '';
    let first = true;
    let task = null;
    for (const c of childrenOf(item)) {
      if (c.name === 'ListMark') continue;
      if (c.name === 'Task') {
        const marker = c.getChild('TaskMarker');
        task = /x/i.test(src(marker.from, marker.to));
        out += inlineRange(c, marker.to, c.to);
      } else if (c.name === 'Paragraph') {
        out += first ? inner(c) : `<p>${inner(c)}</p>`; // 목록 안 첫 문단은 <p> 없이(좁은 목록)
      } else {
        out += block(c);
      }
      first = false;
    }
    if (task === null) return `<li>${out}</li>`;
    return `<li class="task"><input type="checkbox" disabled${task ? ' checked' : ''}>${out}</li>`;
  };

  const tableRow = (row, cell) =>
    `<tr>${childrenOf(row).filter(c => c.name === 'TableCell').map(c => `<${cell}>${inner(c)}</${cell}>`).join('')}</tr>`;

  const block = node => {
    if (MARKS.has(node.name)) return '';
    const heading = /^(?:ATX|Setext)Heading(\d)$/.exec(node.name);
    if (heading) return `<h${heading[1]}>${inner(node).trim()}</h${heading[1]}>`;
    switch (node.name) {
      case 'Document': return blocks(node);
      case 'Paragraph': return `<p>${inner(node)}</p>`;
      case 'Blockquote': return `<blockquote>${blocks(node)}</blockquote>`;
      case 'BulletList': return `<ul>${childrenOf(node).map(listItem).join('')}</ul>`;
      case 'OrderedList': {
        const mark = node.firstChild && node.firstChild.getChild('ListMark');
        const start = mark ? parseInt(src(mark.from, mark.to), 10) : 1;
        return `<ol${start !== 1 ? ` start="${start}"` : ''}>${childrenOf(node).map(listItem).join('')}</ol>`;
      }
      case 'HorizontalRule': return '<hr>';
      case 'FencedCode': {
        const info = node.getChild('CodeInfo');
        const code = node.getChild('CodeText');
        const lang = info ? ` class="language-${esc(src(info.from, info.to))}"` : '';
        return `<pre><code${lang}>${code ? esc(src(code.from, code.to)) : ''}</code></pre>`;
      }
      case 'CodeBlock': { // 4칸 들여쓴 코드: 줄마다 들여쓰기를 걷어 낸다
        const code = src(node.from, node.to).split('\n').map(l => l.replace(/^(?: {1,4}|\t)/, '')).join('\n');
        return `<pre><code>${esc(code)}</code></pre>`;
      }
      case 'Table': {
        const head = node.getChild('TableHeader');
        const rows = childrenOf(node).filter(c => c.name === 'TableRow');
        return `<table>${head ? `<thead>${tableRow(head, 'th')}</thead>` : ''}<tbody>${rows.map(r => tableRow(r, 'td')).join('')}</tbody></table>`;
      }
      case 'HTMLBlock': return `<p>${esc(src(node.from, node.to))}</p>`;
      case 'LinkReference':
      case 'CommentBlock': return '';
      default: return `<p>${esc(src(node.from, node.to))}</p>`;
    }
  };
  const blocks = node => childrenOf(node).map(block).join('');

  return block(tree.topNode);
}
