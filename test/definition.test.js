import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NS, DOCUMENT_ID, inject, markdownDefinition } from '../src/definition.js'

test('inject declares documentPreviews and theme as hard dependencies', () => {
  assert.ok(inject.includes('documentPreviews'), 'documentPreviews must be injectable or ctx.documentPreviews throws')
  assert.ok(inject.includes('theme'))
})

test('markdownDefinition has the extension-priority preview shape', () => {
  const title = () => 'Mermaid Markdown'
  const def = markdownDefinition(title)
  assert.equal(def.id, DOCUMENT_ID)
  assert.deepEqual(def.extensions, ['md', 'markdown'])
  assert.equal(def.priority, 'extension')
  assert.equal(def.loading, 'text-pages')
  assert.equal(def.wrap, false)
  assert.equal(def.title, title)
  assert.equal(NS, 'mermaidMarkdown')
})
