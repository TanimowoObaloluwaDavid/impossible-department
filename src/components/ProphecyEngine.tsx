import { useState } from 'react'
import { buildProphecy, type Prophecy } from '../data/bureau'
import { makeRng } from '../lib/rng'
import { record } from '../lib/stats'
import { pick } from '../lib/rng'

interface Props {
  seed: number
}

const VOICES = [
  'Recorded by a clerk who has since been reclassified as furniture.',
  'Read aloud once, in a corridor, to nobody in particular.',
  'Certified by the Office of Things Almost Said.',
  'Witnessed by a pigeon employed since 1974.',
] as const

const empty: Prophecy = {
  subject: 'Nothing yet',
  claim: 'has been prophesied. This is the safest possible outcome.',
  caveat: 'No caveats have been waived.',
}

export function ProphecyEngine({ seed }: Props) {
  const [prophecy, setProphecy] = useState<Prophecy>(empty)
  const [issued, setIssued] = useState(0)
  const [nonce, setNonce] = useState(1)

  const divine = () => {
    const rng = makeRng(`prophecy:${seed}:${nonce}`)
    setProphecy(buildProphecy(rng, pick))
    setIssued((prev) => prev + 1)
    setNonce((prev) => prev + 1)
    record('prophecies')
  }

  return (
    <section className="panel panel--dark" id="prophecy">
      <div className="panel__head">
        <h2 className="panel__title">Prophecy Engine (Mark IV)</h2>
        <p className="panel__sub">
          Predictive apparatus. Forecasts are issued for events that have already been reported.
        </p>
      </div>

      <div className="oracle">
        <div className="oracle__screen" aria-live="polite">
          <p className="oracle__subject">{prophecy.subject}</p>
          <p className="oracle__claim">{prophecy.claim}</p>
          <p className="oracle__caveat">Caveat: {prophecy.caveat}</p>
          <p className="oracle__voice">{issued === 0 ? 'The chamber is warming up. Or cooling. Unclear.' : pick(makeRng(`voice:${issued}`), VOICES)}</p>
        </div>
        <div className="oracle__controls">
          <button type="button" className="btn btn--primary" onClick={divine}>
            Consult the Engine
          </button>
          <p className="oracle__count">Prophecies issued this session: {issued}</p>
        </div>
      </div>
    </section>
  )
}