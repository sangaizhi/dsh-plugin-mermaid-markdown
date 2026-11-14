import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 8
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8]

/** Next rung above the current zoom, or the maximum when already there. */
function zoomInFrom(current) {
  return ZOOM_STEPS.find((step) => step > current + 1e-6) ?? MAX_ZOOM
}

/** Next rung below the current zoom, or the minimum when already there. */
function zoomOutFrom(current) {
  const below = ZOOM_STEPS.filter((step) => step < current - 1e-6)
  return below.length === 0 ? MIN_ZOOM : below[below.length - 1]
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
      if (event.key === '+' || event.key === '=') setZoom((z) => zoomInFrom(z))
      else if (event.key === '-' || event.key === '_') setZoom((z) => zoomOutFrom(z))
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
        <button type="button" onClick={() => setZoom((z) => zoomOutFrom(z))} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">−</button>
        <span className="mmd-zoom-readout" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((z) => zoomInFrom(z))} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setZoom(1)} disabled={zoom === 1}>重置</button>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview">✕</button>
      </div>
    </div>,
    document.body,
  )
}
