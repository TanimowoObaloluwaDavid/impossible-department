import { useCallback, useEffect, useRef, useState } from 'react'
import { AGENCY_NAMES, TAGLINES } from '../data/bureau'
import { makeRng, pick } from '../lib/rng'
import { record } from '../lib/stats'

interface HeroProps {
  onPetition: () => void
}

interface Dodge {
  x: number
  y: number
}

const MAX_DODGES = 8

const RNG_SEED = 'the-impossible-department'

export function Hero({ onPetition }: HeroProps) {
  const [line, setLine] = useState(0)
  const [agency] = useState(() => pick(makeRng(RNG_SEED), AGENCY_NAMES))
  const [dodges, setDodges] = useState<Dodge[]>([])
  const [caught, setCaught] = useState(false)
  const rngRef = useRef(makeRng(`${RNG_SEED}:hero`))

  useEffect(() => {
    const id = window.setInterval(() => {
      setLine((prev) => (prev + 1) % TAGLINES.length)
    }, 4200)
    return () => window.clearInterval(id)
  }, [])

  const flee = useCallback(() => {
    if (dodges.length >= MAX_DODGES || caught) return
    const rng = rngRef.current
    const angle = rng() * Math.PI * 2
    const distance = 60 + rng() * 90
    setDodges((prev) => [...prev, { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }])
  }, [caught, dodges.length])

  const surrender = useCallback(() => {
    setCaught(true)
    record('petitions')
    onPetition()
  }, [onPetition])

  return (
    <header className="hero">
      <div className="hero__stamp" aria-hidden="true">
        <span className="hero__stamp-ring" />
        <span className="hero__stamp-text">{agency}</span>
      </div>

      <p className="hero__kicker">Est. simultaneously before and after itself</p>

      <h1 className="hero__title">
        <span className="hero__title-line hero__title-line--a">The</span>
        <span className="hero__title-line hero__title-line--b">Impossible</span>
        <span className="hero__title-line hero__title-line--c">Department</span>
      </h1>

      <p className="hero__tagline" aria-live="polite">
        {TAGLINES[line]}
      </p>

      <div className="hero__cta">
        <button
          type="button"
          className="btn btn--primary hero__btn"
          style={{ transform: `translate(${dodges.at(-1)?.x ?? 0}px, ${dodges.at(-1)?.y ?? 0}px)` }}
          onMouseEnter={flee}
          onFocus={flee}
          onClick={surrender}
        >
          {caught ? 'Petition accepted (allegedly)' : 'Begin Petition'}
        </button>
        <p className="hero__hint">
          {caught
            ? 'The button has been located. It cost the Department its dignity.'
            : dodges.length === 0
              ? 'Approach with caution. The button is evasive.'
              : `Attempts to click: ${dodges.length}. Success is not guaranteed at any count.`}
        </p>
      </div>
    </header>
  )
}