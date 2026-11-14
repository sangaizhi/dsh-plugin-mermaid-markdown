import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitFrontmatter, isMermaidLanguage, splitMarkdownSegments } from '../src/markdown.js'

test('splitFrontmatter splits a leading YAML block', () => {
  const r = splitFrontmatter('---\na: 1\n---\n# Hi')
  assert.equal(r.frontmatter, 'a: 1')
  assert.equal(r.body, '# Hi')
})

test('splitFrontmatter returns null frontmatter when none present', () => {
  const text = '# Just a heading\n\nbody'
  const r = splitFrontmatter(text)
  assert.equal(r.frontmatter, null)
  assert.equal(r.body, text)
})

test('isMermaidLanguage recognizes mermaid and mmd case-insensitively', () => {
  assert.equal(isMermaidLanguage('mermaid'), true)
  assert.equal(isMermaidLanguage('Mermaid'), true)
  assert.equal(isMermaidLanguage('mmd'), true)
  assert.equal(isMermaidLanguage('python'), false)
  assert.equal(isMermaidLanguage('mermaidx'), false)
})

test('splitMarkdownSegments splits one mermaid fence from surrounding markdown', () => {
  const segs = splitMarkdownSegments('# T\n\n```mermaid\ngraph TD; A-->B\n```\n\n- item')
  assert.equal(segs.length, 3)
  assert.equal(segs[0].kind, 'markdown')
  assert.match(segs[0].markdown, /# T/)
  assert.equal(segs[1].kind, 'mermaid')
  assert.equal(segs[1].code, 'graph TD; A-->B')
  assert.equal(segs[2].kind, 'markdown')
  assert.match(segs[2].markdown, /- item/)
})

test('splitMarkdownSegments handles multiple mermaid blocks in order', () => {
  const src = '```mermaid\ngraph TD; A-->B\n```\n\nmiddle\n\n```mermaid\nflowchart LR; C-->D\n```'
  const segs = splitMarkdownSegments(src)
  const mermaid = segs.filter((s) => s.kind === 'mermaid')
  assert.equal(mermaid.length, 2)
  assert.equal(mermaid[0].code, 'graph TD; A-->B')
  assert.equal(mermaid[1].code, 'flowchart LR; C-->D')
  assert.equal(segs[0].kind, 'mermaid')
  assert.equal(segs[1].kind, 'markdown')
  assert.equal(segs[2].kind, 'mermaid')
})

test('splitMarkdownSegments treats an unclosed mermaid fence as markdown source', () => {
  const src = '```mermaid\ngraph TD; A-->B\n(no closing fence)'
  const segs = splitMarkdownSegments(src)
  assert.equal(segs.filter((s) => s.kind === 'mermaid').length, 0)
  assert.equal(segs.length, 1)
  assert.equal(segs[0].kind, 'markdown')
  assert.match(segs[0].markdown, /graph TD; A-->B/)
})

test('splitMarkdownSegments ignores non-mermaid fences', () => {
  const src = '```python\nprint(1)\n```'
  const segs = splitMarkdownSegments(src)
  assert.equal(segs.filter((s) => s.kind === 'mermaid').length, 0)
  assert.equal(segs.length, 1)
  assert.equal(segs[0].kind, 'markdown')
})

test('splitMarkdownSegments tolerates shortcut reference brackets and task checkboxes', () => {
  // Regression: markdown-it throws "Cannot read properties of undefined
  // (reading 'references')" when md.parse runs without an env object and the
  // source contains shortcut references ("[label]") or "- [ ]" task items.
  const src = '- [未拍板项被当成事实] → 用 [ASSUMPTION-01]\n\n- [ ] 1.1 任务'
  const segs = splitMarkdownSegments(src)
  assert.equal(segs.length, 1)
  assert.equal(segs[0].kind, 'markdown')
  assert.match(segs[0].markdown, /ASSUMPTION-01/)
})
