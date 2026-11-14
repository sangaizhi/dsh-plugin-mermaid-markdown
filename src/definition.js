/** Shared registration constants and the document-preview definition, kept pure for testability. */
export const NS = 'mermaidMarkdown'
export const DOCUMENT_ID = 'dsh-plugin-mermaid-markdown/document'

/** Hard client-service dependencies; `documentPreviews` must be here or `ctx.documentPreviews` throws. */
export const inject = ['slots', 'locale', 'documentPreviews', 'theme']

/** Describe the Markdown implementation; `extension` priority outranks the builtin Markdown renderer. */
export function markdownDefinition(title) {
  return {
    id: DOCUMENT_ID,
    extensions: ['md', 'markdown'],
    priority: 'extension',
    title,
    loading: 'text-pages',
    wrap: false,
  }
}
