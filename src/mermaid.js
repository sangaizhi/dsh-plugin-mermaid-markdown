import mermaid from 'mermaid'

let initialized = false

/** Configure mermaid once (or when the color scheme flips). */
export function initMermaid(colorScheme) {
  mermaid.initialize({
    startOnLoad: false,
    theme: colorScheme === 'dark' ? 'dark' : 'default',
    securityLevel: 'strict',
  })
  initialized = true
}

/** Render one diagram to an SVG string; rejects on parse/render errors. */
export async function renderMermaid(id, code) {
  if (!initialized) initMermaid('light')
  const { svg } = await mermaid.render(id, code)
  return svg
}
