import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true })

/**
 * Split a leading YAML frontmatter block (`---` ... `---`/`...`) from the body.
 * Returns the original text with a null frontmatter when there is none.
 */
export function splitFrontmatter(text) {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') return { body: text, frontmatter: null }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '---' || line === '...') {
      return { body: lines.slice(i + 1).join('\n'), frontmatter: lines.slice(1, i).join('\n') }
    }
  }
  return { body: text, frontmatter: null }
}

/** Whether a fence info string names a mermaid diagram (mermaid or mmd). */
export function isMermaidLanguage(info) {
  const lang = String(info || '').trim().toLowerCase()
  return lang === 'mermaid' || lang === 'mmd'
}

/** Character offset of the start of every line, for slicing by token line ranges. */
function computeLineOffsets(body) {
  const offsets = [0]
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\n') offsets.push(i + 1)
  }
  return offsets
}

/**
 * Split a Markdown body into ordered segments: rendered Markdown HTML chunks
 * and mermaid diagram code. Only CLOSED mermaid fences become diagrams; an
 * unclosed fence (still streaming) stays Markdown so it renders as source.
 */
export function splitMarkdownSegments(body) {
  const tokens = md.parse(body, {})
  const lineOffsets = computeLineOffsets(body)
  const segments = []
  let cursor = 0
  for (const token of tokens) {
    if (token.type === 'fence' && isMermaidLanguage(token.info) && token.content.endsWith('\n')) {
      const start = lineOffsets[token.map[0]] ?? 0
      const end = lineOffsets[token.map[1]] ?? body.length
      if (start > cursor) {
        const html = md.render(body.slice(cursor, start))
        if (html.trim()) segments.push({ kind: 'markdown', html })
      }
      segments.push({ kind: 'mermaid', code: token.content.replace(/\n$/, '') })
      cursor = end
    }
  }
  if (cursor < body.length) {
    const html = md.render(body.slice(cursor))
    if (html.trim()) segments.push({ kind: 'markdown', html })
  }
  if (segments.length === 0 && body.trim()) {
    segments.push({ kind: 'markdown', html: md.render(body) })
  }
  return segments
}
