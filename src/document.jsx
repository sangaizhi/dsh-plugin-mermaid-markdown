import { useMemo } from 'react'
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import { splitFrontmatter, splitMarkdownSegments } from './markdown.js'
import { MermaidDiagram } from './MermaidDiagram.jsx'

const LABELS = {
  code: {
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    toolbarLabels: { codeLabel: 'Code', wrapLabel: 'Wrap', unwrapLabel: 'Unwrap' },
  },
  footnotes: 'Footnotes',
}

const PATH_IMAGES = { resolve: () => undefined }

/**
 * Workspace Markdown preview: reuse the host's own MarkdownText for every
 * Markdown chunk (so typography and code blocks stay exactly the builtin), and
 * render only the ```mermaid fences ourselves.
 */
export function MermaidMarkdownDocument({ content }) {
  const text = content && content.kind === 'text' ? content.text : ''
  const split = useMemo(() => splitFrontmatter(text), [text])
  const segments = useMemo(() => splitMarkdownSegments(split.body), [split.body])

  if (!content || content.kind !== 'text') return null
  const streaming = !content.eof

  return (
    <div className="mmd-document" data-document-markdown>
      {split.frontmatter != null ? <pre className="mmd-frontmatter" data-document-frontmatter>{split.frontmatter}</pre> : null}
      {segments.map((seg, i) => seg.kind === 'mermaid'
        ? <MermaidDiagram key={`m${i}`} code={seg.code} />
        : <MarkdownText key={`h${i}`} text={seg.markdown} streaming={streaming} labels={LABELS} pathImages={PATH_IMAGES} />)}
    </div>
  )
}
