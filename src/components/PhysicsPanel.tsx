import { useEffect, useRef, useState } from 'react'
import { makeRng } from '../lib/rng'
import { record } from '../lib/stats'

interface Props {
  seed: number
}

const STATIONS = [
  { id: 'stairs', label: 'Station 4 — Penrose Stairs, Exit B', note: 'Ascending since 1962.' },
  { id: 'couch', label: 'Station 9 — Infinite Couch', note: 'Reserved. Always reserved.' },
  { id: 'bridge', label: 'Station 21 — Möbius Bridge', note: 'Crossing keeps the crossing.' },
  { id: 'window', label: 'Station 33 — Window to Tuesday', note: 'Look away and it is a wall.' },
  { id: 'elevator', label: 'Station 47 — Elevator to This Floor', note: 'Do not board while looking at it.' },
] as const

export function PhysicsPanel({ seed }: Props) {
  const [tilt, setTilt] = useState(0)
  const [drift, setDrift] = useState({ x: 0, y: 0 })
  const [station, setStation] = useState<string>(STATIONS[0].label)
  const [escapees, setEscapees] = useState(0)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const rngRef = useRef(makeRng(`physics:${seed}`))

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const node = frameRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const relX = (event.clientX - rect.left) / rect.width - 0.5
      const relY = (event.clientY - rect.top) / rect.height - 0.5
      setTilt(Math.max(-14, Math.min(14, relY * -22)))
      setDrift({ x: relX * 18, y: relY * 12 })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const nudge = () => {
    const rng = rngRef.current
    setStation(STATIONS[Math.floor(rng() * STATIONS.length) % STATIONS.length].label)
    setEscapees((prev) => prev + 1)
    record('contradictions')
  }

  return (
    <section className="panel panel--physics" id="physics">
      <div className="panel__head">
        <h2 className="panel__title">Local Physics</h2>
        <p className="panel__sub">Down is a suggestion. The floor has been notified and declines to comment.</p>
      </div>

      <div className="physics">
        <div
          ref={frameRef}
          className="physics__frame"
          style={{ transform: `perspective(900px) rotateX(${tilt}deg) translate(${drift.x}px, ${drift.y}px)` }}
        >
          <div className="physics__box physics__box--a">
            <span>This box is above that box</span>
          </div>
          <div className="physics__box physics__box--b">
            <span>Also the other box</span>
          </div>
          <div className="physics__gravity" aria-hidden="true" />
          <div className="physics__reader">
            <p className="physics__station">{station}</p>
            <button type="button" className="btn btn--ghost" onClick={nudge}>
              Consult the timetable
            </button>
            <p className="physics__meta">Gravity consultations: {escapees}</p>
          </div>
        </div>
      </div>
    </section>
  )
}