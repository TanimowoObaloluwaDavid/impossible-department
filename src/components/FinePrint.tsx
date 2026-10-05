import { useMemo } from 'react'
import { CLAUSE_MERITS } from '../data/bureau'
import { makeRng, pick, shuffle } from '../lib/rng'
import { useStats } from '../lib/stats'

interface Props {
  seed: number
}

export function FinePrint({ seed }: Props) {
  const stats = useStats()
  const clauses = useMemo(() => shuffle(makeRng(`clauses:${seed}`), CLAUSE_MERITS), [seed])
  const verdict = useMemo(() => {
    if (stats.petitions === 0) return 'No petition filed. The queue regards this as cowardice.'
    if (stats.approvals > stats.denials) return `Petition upheld by a court that does not sit (docket ${seed}).`
    if (stats.denials > stats.approvals) return 'Petition denied for the third time it was filed.'
    return 'Petition simultaneously upheld and denied. Both rulings stand.'
  }, [seed, stats.approvals, stats.denials, stats.petitions])

  const banner = useMemo(
    () => pick(makeRng(`banner:${stats.prophecies}:${stats.queueReached}`), [
      'No guarantee is expressed or implied.',
      'Figures are provisional and also final.',
      'Terms subject to terms.',
      'Availability is theoretical.',
      'Nothing in this footer constitutes a footer.',
    ]),
    [stats.prophecies, stats.queueReached],
  )

  return (
    <section className="panel" id="fine-print">
      <div className="panel__head">
        <h2 className="panel__title">Terms, Conditions &amp; Other Clauses</h2>
        <p className="panel__sub">Read all {clauses.length} of them. Nobody has. That is the point.</p>
      </div>

      <ol className="clauses">
        {clauses.map((clause, index) => (
          <li key={clause} className="clauses__item">
            <span className="clauses__num">{String(index + 1).padStart(2, '0')}</span>
            <span>{clause}</span>
          </li>
        ))}
      </ol>

      <div className="tally">
        <div className="tally__row">
          <span>Petitions filed</span>
          <strong>{stats.petitions}</strong>
        </div>
        <div className="tally__row">
          <span>Approvals</span>
          <strong>{stats.approvals}</strong>
        </div>
        <div className="tally__row">
          <span>Denials</span>
          <strong>{stats.denials}</strong>
        </div>
        <div className="tally__row">
          <span>Contradictions recorded</span>
          <strong>{stats.contradictions}</strong>
        </div>
        <div className="tally__row">
          <span>Prophecies issued</span>
          <strong>{stats.prophecies}</strong>
        </div>
        <div className="tally__row">
          <span>Queue items reached</span>
          <strong>{stats.queueReached}</strong>
        </div>
      </div>

      <p className="verdict">{verdict}</p>
      <p className="banner">{banner}</p>
    </section>
  )
}