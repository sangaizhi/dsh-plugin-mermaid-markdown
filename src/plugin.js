import { MermaidMarkdownDocument } from './document.jsx'
import { setColorScheme } from './theme.js'
import { installStyles } from './styles.js'
import { NS, DOCUMENT_ID, inject, markdownDefinition } from './definition.js'

export { inject }

export function apply(ctx) {
  ctx.effect(installStyles, 'mermaid-markdown: styles')

  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, {
    en: { 'viewer.label': 'Mermaid Markdown' },
    zh: { 'viewer.label': 'Mermaid 图表' },
  }), 'mermaid-markdown: locale')

  setColorScheme(ctx.theme.getTheme().active.colorScheme)
  ctx.effect(() => ctx.on('theme/change', (snapshot) => {
    setColorScheme(snapshot.active.colorScheme)
  }), 'mermaid-markdown: theme sync')

  ctx.effect(() => ctx.documentPreviews.register(markdownDefinition(() => t('viewer.label'))),
    'mermaid-markdown: document metadata')

  ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({
    name: 'sidebar.right.tab.document', key: DOCUMENT_ID, locale: NS,
  }, MermaidMarkdownDocument)), 'mermaid-markdown: document body')
}
