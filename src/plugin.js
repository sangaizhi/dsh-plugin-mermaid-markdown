import { MermaidMarkdownDocument } from './document.jsx'
import { setColorScheme } from './theme.js'

const NS = 'mermaidMarkdown'
const DOCUMENT_ID = '@local/mermaid-markdown/document'

export const inject = ['slots', 'locale']

export function apply(ctx) {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, {
    en: { 'viewer.label': 'Mermaid Markdown' },
    zh: { 'viewer.label': 'Mermaid 图表' },
  }), 'mermaid-markdown: locale')

  const theme = ctx.get('theme')
  if (theme) {
    setColorScheme(theme.getTheme().active.colorScheme)
    ctx.effect(() => ctx.on('theme/change', (snapshot) => {
      setColorScheme(snapshot.active.colorScheme)
    }), 'mermaid-markdown: theme sync')
  }

  const previews = ctx.documentPreviews
  if (previews) {
    ctx.effect(() => previews.register({
      id: DOCUMENT_ID,
      extensions: ['md', 'markdown'],
      priority: 'extension',
      title: () => t('viewer.label'),
      loading: 'text-pages',
      wrap: false,
    }), 'mermaid-markdown: document metadata')

    ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({
      name: 'sidebar.right.tab.document', key: DOCUMENT_ID, locale: NS,
    }, MermaidMarkdownDocument)), 'mermaid-markdown: document body')
  }
}
