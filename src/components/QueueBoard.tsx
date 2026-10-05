import { useCallback, useEffect, useRef, useState } from 'react'
import { buildQueueItem, type QueueItem } from '../data/bureau'
import { makeRng, pick } from '../lib/rng'
import { record, useStats } from '../lib/stats'

const PAGE = 12
const LOAD_MS = 620

interface Props {
  seed: number
}

export function QueueBoard({ seed }: Props) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pages, setPages] = useState(0)
  const [progress, setProgress] = useState(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const { queueReached } = useStats()

  const addPage = useCallback(() => {
    setLoading(true)
    const start = performance.now()

    const tick = () => {
      const elapsed = performance.now() - start
      const raw = Math.min(100, (elapsed / LOAD_MS) * 100)
      setProgress(raw < 97 ? raw : 97 + Math.sin(elapsed / 90) * 3)
      if (elapsed < LOAD_MS) {
        timerRef.current = window.setTimeout(tick, 60)
        return
      }
      setProgress(0)
      setPages((prev) => prev + 1)
      setItems((prev) => {
        const next = prev.length
        return [
          ...prev,
          ...Array.from({ length: PAGE }, (_, i) =>
            buildQueueItem(makeRng(`queue:${seed}:${pages}:${next + i}`), next + i + 1, pick),
          ),
        ]
      })
      setLoading(false)
      timerRef.current = null
    }

    timerRef.current = window.setTimeout(tick, 60)
  }, [pages, seed])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loading) addPage()
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [addPage, loading])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    record('queueReached', items.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  return (
    <section className="panel" id="queue">
      <div className="panel__head">
        <h2 className="panel__title">The Queue</h2>
        <p className="panel__sub">
          A finite, loadable, self-extending queue. {queueReached} items have been reached. The queue has reached
          them.
        </p>
      </div>

      <div className="queue">
        <table className="queue__table">
          <thead>
            <tr>
              <th scope="col">Ref</th>
              <th scope="col">Subject</th>
              <th scope="col">Age</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="queue__row">
                <td className="queue__ref">{item.ref}</td>
                <td className="queue__subject">
                  {item.subject}
                  <span className="queue__note">{item.note}</span>
                </td>
                <td className="queue__age">{item.age}</td>
                <td className="queue__status">
                  <span className="tag" data-status={item.status}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div ref={sentinelRef} className="queue__sentinel">
          {items.length === 0 && !loading && (
            <button type="button" className="btn btn--ghost" onClick={addPage}>
              Load the queue
            </button>
          )}
          {loading && (
            <div className="loader">
              <div className="loader__bar">
                <span className="loader__fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="loader__label">Retrieving queue position 0… {Math.round(progress)}%</p>
            </div>
          )}
          {!loading && items.length > 0 && <p className="queue__more">Scroll for more. There is more.</p>}
        </div>
      </div>
    </section>
  )
}