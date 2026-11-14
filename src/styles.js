/**
 * Plugin-owned stylesheet, injected as a tagged <style> element (the harness
 * compiles its own *.module.css, which an out-of-tree package cannot reuse).
 * The document body needs the builtin Markdown renderer's padding and prose
 * typography; without it the preview renders flush to the edges.
 */

const PLUGIN_ID = '@local/mermaid-markdown'

const CSS = `
.mmd-document {
  min-width: 0;
  padding: 10px 12px;
  box-sizing: border-box;
  font-family: var(--dsw-font, inherit);
  font-size: 14px;
  line-height: 1.6;
  color: var(--dsw-alias-label-primary, inherit);
  white-space: normal;
  overflow-wrap: anywhere;
}
.mmd-document h1, .mmd-document h2, .mmd-document h3,
.mmd-document h4, .mmd-document h5, .mmd-document h6 {
  margin: 1.1em 0 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: var(--dsw-alias-label-primary, inherit);
}
.mmd-document h1 { font-size: 1.5em; }
.mmd-document h2 { font-size: 1.3em; }
.mmd-document h3 { font-size: 1.15em; }
.mmd-document h4 { font-size: 1.05em; }
.mmd-document h1:first-child, .mmd-document h2:first-child, .mmd-document h3:first-child { margin-top: 0; }
.mmd-document p { margin: 0.5em 0; }
.mmd-document ul, .mmd-document ol { margin: 0.5em 0; padding-left: 1.6em; }
.mmd-document li { margin: 0.25em 0; }
.mmd-document li > p { margin: 0.2em 0; }
.mmd-document a { color: var(--dsw-alias-brand-primary, #247bbf); text-decoration: none; }
.mmd-document a:hover { text-decoration: underline; }
.mmd-document blockquote {
  margin: 0.75em 0;
  padding: 0 0 0 12px;
  border-left: 3px solid var(--dsw-alias-border-l2, #ddd);
  color: var(--dsw-alias-label-secondary, #666);
}
.mmd-document code {
  font-family: var(--ds-font-family-code, monospace);
  font-size: 0.9em;
}
.mmd-document :not(pre) > code {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.12));
}
.mmd-document pre {
  margin: 0.75em 0;
  padding: 10px 12px;
  border-radius: var(--dsw-radius-md, 6px);
  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.08));
  overflow: auto;
}
.mmd-document pre > code { font-size: 12px; line-height: 1.5; }
.mmd-document table { border-collapse: collapse; margin: 0.75em 0; max-width: 100%; }
.mmd-document th, .mmd-document td {
  border: 1px solid var(--dsw-alias-border-l2, #ddd);
  padding: 4px 8px;
  text-align: left;
}
.mmd-document th { background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.06)); }
.mmd-document img { max-width: 100%; height: auto; }
.mmd-document hr { border: none; border-top: 1px solid var(--dsw-alias-border-l2, #ddd); margin: 1em 0; }
.mmd-document .mmd-frontmatter {
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
.mmd-document .mmd-frontmatter:empty { display: none; }
.mmd-document .mmd-diagram { margin: 0.75em 0; }
.mmd-document .mmd-diagram > svg { display: block; max-width: 100%; height: auto; }
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
