import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { initMermaid, renderMermaid } from './mermaid.js'
import { getColorScheme, subscribeColorScheme } from './theme.js'

let idCounter = 0

/** Renders one mermaid diagram as SVG; falls back to source plus an error line. */
export function MermaidDiagram({ code }) {
  const colorScheme = useSyncExternalStore(subscribeColorScheme, getColorScheme)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const idRef = useRef(`mmd-${++idCounter}`)

  useEffect(() => {
    let alive = true
    setSvg('')
    setError('')
    const timer = setTimeout(() => {
      initMermaid(colorScheme)
      renderMermaid(idRef.current, code)
        .then((s) => { if (alive) setSvg(s) })
        .catch((e) => { if (alive) setError(String((e && e.message) || e)) })
    }, 50)
    return () => { alive = false; clearTimeout(timer) }
  }, [code, colorScheme])

  if (error) {
    return (
      <div>
        <pre>{code}</pre>
        <div role="alert" style={{ color: 'var(--dsw-alias-danger, #d14)' }}>{error}</div>
      </div>
    )
  }
  if (!svg) return <div aria-label="rendering">rendering…</div>
  return <div className="mmd-svg" dangerouslySetInnerHTML={{ __html: svg }} />
}
