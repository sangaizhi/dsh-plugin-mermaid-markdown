/**
 * Plugin-owned stylesheet, injected as a tagged <style> element (the harness
 * compiles its own *.module.css, which an out-of-tree package cannot reuse).
 * Markdown typography is left to the host's MarkdownText; this file only adds
 * the document padding the builtin body supplies, the frontmatter box, the
 * mermaid diagram spacing, and the click-to-enlarge preview.
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
.mmd-diagram { margin: 0.75em 0; cursor: zoom-in; }
.mmd-diagram > svg { display: block; max-width: 100%; height: auto; }
.mmd-document .mmd-error { color: var(--dsw-alias-state-error-primary, #d14); white-space: pre-wrap; }
.mmd-zoom-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 56px 32px 96px;
  background: rgba(0, 0, 0, 0.55);
}
.mmd-zoom-stage {
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 20px;
  box-sizing: border-box;
  border-radius: var(--dsw-radius-md, 10px);
  background: var(--dsw-alias-bg-overlay, #fff);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}
.mmd-zoom-canvas > svg { display: block; max-width: none; height: auto; }
.mmd-zoom-toolbar {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--dsw-alias-bg-overlay, #222);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}
.mmd-zoom-toolbar button {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-primary, inherit);
  font: inherit;
  cursor: pointer;
}
.mmd-zoom-toolbar button:hover:not(:disabled) { background: var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.2)); }
.mmd-zoom-toolbar button:disabled { opacity: 0.4; cursor: default; }
.mmd-zoom-readout {
  min-width: 46px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary, inherit);
}
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
