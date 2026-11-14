import { useEffect, useState, useSyncExternalStore } from 'react'
import { initMermaid, renderMermaid } from './mermaid.js'
import { getColorScheme, subscribeColorScheme } from './theme.js'

let idCounter = 0

/** Renders one mermaid diagram as SVG; falls back to source plus an error line. */
export function MermaidDiagram({ code }) {
  const colorScheme = useSyncExternalStore(subscribeColorScheme, getColorScheme)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [id] = useState(() => `mmd-${++idCounter}`)

  useEffect(() => {
    let alive = true
    setSvg('')
    setError('')
    const timer = setTimeout(() => {
      initMermaid(colorScheme)
      renderMermaid(id, code)
        .then((s) => { if (alive) setSvg(s) })
        .catch((e) => { if (alive) setError(String((e && e.message) || e)) })
    }, 50)
    return () => { alive = false; clearTimeout(timer) }
  }, [id, code, colorScheme])

  if (error) {
    return (
      <div className="mmd-diagram">
        <pre>{code}</pre>
        <div className="mmd-error" role="alert">{error}</div>
      </div>
    )
  }
  if (!svg) return <div className="mmd-diagram" aria-label="rendering">rendering…</div>
  return <div className="mmd-diagram" dangerouslySetInnerHTML={{ __html: svg }} />
}
