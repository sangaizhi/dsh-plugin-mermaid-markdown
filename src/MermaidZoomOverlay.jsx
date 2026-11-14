import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const STEP = 0.25

/** Clamp a zoom value into the supported range and kill float noise. */
function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))
}

/**
 * Full-viewport preview of one rendered diagram with zoom controls. Portals to
 * document.body so the sidebar's clipping never cuts it off. Closes on Esc,
 * backdrop click, or the toolbar's close button.
 */
export function MermaidZoomOverlay({ svg, onClose }) {
  const [zoom, setZoom] = useState(1)
  const closeRef = useRef(null)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key === '+' || event.key === '=') setZoom((z) => clampZoom(z + STEP))
      else if (event.key === '-' || event.key === '_') setZoom((z) => clampZoom(z - STEP))
      else if (event.key === '0') setZoom(1)
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return createPortal(
    <div
      className="mmd-zoom-backdrop"
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="mmd-zoom-stage" role="dialog" aria-modal="true" aria-label="Mermaid diagram preview">
        <div className="mmd-zoom-canvas" style={{ zoom }} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      <div className="mmd-zoom-toolbar">
        <button type="button" onClick={() => setZoom((z) => clampZoom(z - STEP))} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">−</button>
        <span className="mmd-zoom-readout" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((z) => clampZoom(z + STEP))} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setZoom(1)} disabled={zoom === 1}>重置</button>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview">✕</button>
      </div>
    </div>,
    document.body,
  )
}
