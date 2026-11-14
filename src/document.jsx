import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { splitFrontmatter, splitMarkdownSegments } from './markdown.js'
import { MermaidDiagram } from './MermaidDiagram.jsx'

function sanitize(html) {
  return DOMPurify.sanitize(html)
}

/** Workspace Markdown preview: frontmatter, rendered Markdown, and mermaid diagrams. */
export function MermaidMarkdownDocument({ content }) {
  const text = content && content.kind === 'text' ? content.text : ''
  const split = useMemo(() => splitFrontmatter(text), [text])
  const segments = useMemo(() => splitMarkdownSegments(split.body), [split.body])

  if (!content || content.kind !== 'text') return null

  return (
    <div data-document-markdown>
      {split.frontmatter != null ? <pre data-document-frontmatter>{split.frontmatter}</pre> : null}
      {segments.map((seg, i) => seg.kind === 'mermaid'
        ? <MermaidDiagram key={`m${i}`} code={seg.code} />
        : <div key={`h${i}`} dangerouslySetInnerHTML={{ __html: sanitize(seg.html) }} />)}
    </div>
  )
}
