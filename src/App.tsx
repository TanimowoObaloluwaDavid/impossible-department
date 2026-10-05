import { useState } from 'react'
import './App.css'
import { FinePrint } from './components/FinePrint'
import { Hero } from './components/Hero'
import { PetitionForm } from './components/PetitionForm'
import { PhysicsPanel } from './components/PhysicsPanel'
import { ProphecyEngine } from './components/ProphecyEngine'
import { QueueBoard } from './components/QueueBoard'
import { makeRng } from './lib/rng'

const SEED = makeRng('impossible-department')()

const NAV = [
  { href: '#petition', label: 'Petition' },
  { href: '#prophecy', label: 'Prophecy' },
  { href: '#queue', label: 'Queue' },
  { href: '#physics', label: 'Physics' },
  { href: '#fine-print', label: 'Fine Print' },
]

export default function App() {
  const [tilt, setTilt] = useState(0)

  return (
    <div className="app" style={{ ['--tilt' as string]: `${tilt}deg` }}>
      <nav className="nav">
        <span className="nav__brand">IMD</span>
        <ul className="nav__list">
          {NAV.map((item) => (
            <li key={item.href}>
              <a className="nav__link" href={item.href}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <button type="button" className="nav__tilt" onClick={() => setTilt((prev) => (prev === 0 ? -1.4 : 0))}>
          {tilt === 0 ? 'Tilt the building' : 'Straighten the building'}
        </button>
      </nav>

      <Hero onPetition={() => setTilt(0)} />

      <main className="main">
        <PetitionForm seed={SEED} />
        <ProphecyEngine seed={SEED} />
        <QueueBoard seed={SEED} />
        <PhysicsPanel seed={SEED} />
        <FinePrint seed={SEED} />
      </main>

      <footer className="footer">
        <p>
          The Impossible Department — an office that cannot be reached, cannot be closed, and cannot be removed from
          the record.
        </p>
        <p className="footer__fine">
          This site has no legal standing, no uptime, and no appeal process. Refreshing will not help, but it will
          continue.
        </p>
      </footer>
    </div>
  )
}