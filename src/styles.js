/**
 * Plugin-owned stylesheet, injected as a tagged <style> element (the harness
 * compiles its own *.module.css, which an out-of-tree package cannot reuse).
 * Markdown typography is left to the host's MarkdownText; this file only adds
 * the document padding the builtin body supplies, the frontmatter box, and the
 * mermaid diagram spacing.
 */

const PLUGIN_ID = '@local/mermaid-markdown'

const CSS = `
.mmd-document {
  min-width: 0;
  padding: 10px 12px;
  box-sizing: border-box;
  font-family: var(--dsw-font, inherit);
  white-space: normal;
}
.mmd-frontmatter {
  margin: 0 0 16px;
  padding: 10px 12px;
  border: 0.5px solid var(--dsw-alias-border-l2, #ddd);
  border-radius: var(--dsw-radius-md, 6px);
  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.06));
  font-family: var(--ds-font-family-code, monospace);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.mmd-frontmatter:empty { display: none; }
.mmd-diagram { margin: 0.75em 0; }
.mmd-diagram > svg { display: block; max-width: 100%; height: auto; }
.mmd-document .mmd-error { color: var(--dsw-alias-state-error-primary, #d14); white-space: pre-wrap; }
`

/** Inject this plugin's stylesheet once per document; the returned disposer removes it. */
export function installStyles() {
  if (typeof document === 'undefined') return () => {}
  const selector = `style[data-plugin-css="${PLUGIN_ID}"]`
  if (document.querySelector(selector) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = PLUGIN_ID
  tag.dataset.pluginCss = PLUGIN_ID
  tag.textContent = CSS
  document.head.append(tag)
  return () => { tag.remove() }
}
