import { useId, useMemo, useState } from 'react'
import { NAME_RULES, PARADOX_ERRORS, REJECTION_REASONS } from '../data/bureau'
import { makeRng, pick, shuffle } from '../lib/rng'
import { record } from '../lib/stats'
import { SUMMONED_VOWEL, inspectName } from '../lib/validate'

interface PetitionFormProps {
  seed: number
}

interface Outcome {
  code: string
  message: string
  stamp: 'APPROVED' | 'DENIED' | 'BOTH'
}

export function PetitionForm({ seed }: PetitionFormProps) {
  const id = useId()
  const [name, setName] = useState('')
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0])
  const [sworn, setSworn] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const verdict = useMemo(() => inspectName(name), [name])

  const rules = useMemo(() => {
    const rng = makeRng(`rules:${seed}:${SUMMONED_VOWEL}`)
    return shuffle(rng, NAME_RULES)
  }, [seed])

  const toggleSworn = () => {
    setSworn((prev) => !prev)
    record('contradictions')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setAttempted(true)
    const rng = makeRng(`outcome:${seed}:${name}:${reason}:${sworn}:${Date.now()}`)
    const paradox = pick(rng, PARADOX_ERRORS)
    const stampRoll = rng()
    setOutcome({
      code: paradox.code,
      message: paradox.message,
      stamp: stampRoll < 0.34 ? 'BOTH' : stampRoll < 0.67 ? 'APPROVED' : 'DENIED',
    })
    record('petitions')
    if (verdict.valid) record('approvals')
    else record('denials')
  }

  return (
    <section className="panel" id="petition">
      <div className="panel__head">
        <h2 className="panel__title">Form 7-B — Petition for Something</h2>
        <p className="panel__sub">
          All fields are validated in reverse. Correct answers are grounds for immediate denial.
        </p>
      </div>

      <form className="form" onSubmit={submit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor={`${id}-name`}>
            Name, as it appears on the document that does not exist
          </label>
          <input
            id={`${id}-name`}
            className={`field__input ${attempted ? (verdict.valid ? 'is-valid' : 'is-invalid') : ''}`}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setOutcome(null)
            }}
            placeholder="e.g. Xkcdbr7a"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="field__meta">
            Validation runs live. Current verdict: <strong>{verdict.headline}</strong>
          </p>
          <ul className="rules">
            {rules.map((rule) => (
              <li key={rule} className="rules__item">
                {rule}
              </li>
            ))}
          </ul>
          {verdict.errors.length > 0 && (
            <ul className="errors">
              {verdict.errors.map((error) => (
                <li key={error.rule} className="errors__item">
                  <span className="errors__rule">{error.rule}</span>
                  <span className="errors__detail">{error.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={`${id}-reason`}>
            Reason for denial
          </label>
          <select
            id={`${id}-reason`}
            className="field__input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            {REJECTION_REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="field__meta">Selecting a reason here will not change the outcome.</p>
        </div>

        <label className="swear">
          <input type="checkbox" className="swear__box" checked={sworn} onChange={toggleSworn} />
          <span className="swear__text">
            I swear that this declaration is true, which is impossible, and therefore binding.
          </span>
        </label>

        <div className="form__actions">
          <button type="submit" className="btn btn--primary">
            Submit Petition
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setName('')
              setReason(REJECTION_REASONS[0])
              setSworn(false)
              setAttempted(false)
              setOutcome(null)
            }}
          >
            Reset (this does not reset anything)
          </button>
        </div>
      </form>

      {outcome && (
        <div className={`outcome outcome--${outcome.stamp.toLowerCase()}`} role="status">
          <span className={`outcome__stamp outcome__stamp--${outcome.stamp.toLowerCase()}`}>{outcome.stamp}</span>
          <div className="outcome__body">
            <p className="outcome__code">{outcome.code}</p>
            <p className="outcome__message">{outcome.message}</p>
            <p className="outcome__meta">
              Petition logged under reference {seed}7-B/{name.trim().length || 0}. Retention: until further
              review, which is scheduled for a moment that has not occurred.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}