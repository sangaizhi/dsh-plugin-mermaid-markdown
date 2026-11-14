import { useEffect, useState, useSyncExternalStore } from 'react'
import { initMermaid, renderMermaid } from './mermaid.js'
import { getColorScheme, subscribeColorScheme } from './theme.js'
import { MermaidZoomOverlay } from './MermaidZoomOverlay.jsx'

let idCounter = 0

/** Renders one mermaid diagram as SVG; click opens an enlarged, zoomable preview. */
export function MermaidDiagram({ code }) {
  const colorScheme = useSyncExternalStore(subscribeColorScheme, getColorScheme)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
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
  return (
    <>
      <div
        className="mmd-diagram"
        role="button"
        tabIndex={0}
        title="点击放大预览"
        aria-label="Mermaid diagram, click to enlarge"
        onClick={() => setExpanded(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpanded(true) }
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {expanded ? <MermaidZoomOverlay svg={svg} onClose={() => setExpanded(false)} /> : null}
    </>
  )
}
