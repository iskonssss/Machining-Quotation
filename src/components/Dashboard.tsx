import { useState } from 'react'
import { costQuote, fmtMoney } from '../engine/costEngine'
import { newQuote, useStore } from '../store'

export function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')

  const quotes = state.quotes.filter((q) => {
    const s = `${q.number} ${q.customer} ${q.parts.map((p) => p.name).join(' ')}`.toLowerCase()
    return s.includes(query.toLowerCase())
  })

  function createQuote() {
    const q = newQuote(state.quotes.length)
    dispatch({ type: 'addQuote', quote: q })
    onOpen(q.id)
  }

  return (
    <>
      <div className="large-title">Quotes</div>
      <div className="subtitle">Create a quote from a 2D drawing or build one by hand.</div>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={createQuote}>
          ＋ New Quote
        </button>
        <div className="field" style={{ flex: 1, maxWidth: 360 }}>
          <input
            placeholder="🔍  Search customer, quote № or part…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state">
          <div className="big">🛠️</div>
          <h3>{state.quotes.length === 0 ? 'No quotes yet' : 'No matches'}</h3>
          <p>
            {state.quotes.length === 0
              ? 'Tap “New Quote”, then drop in a customer drawing — the assistant pre-fills the part for review.'
              : 'Try a different search.'}
          </p>
        </div>
      ) : (
        <div className="quote-grid">
          {quotes.map((q) => {
            const cost = costQuote(q, state)
            const needsReview = q.parts.some((p) => p.operations.some((o) => o.needsReview))
            return (
              <button key={q.id} className="quote-card" onClick={() => onOpen(q.id)}>
                <span className="qnum">{q.number}</span>
                <span className="qcustomer">{q.customer || 'Untitled customer'}</span>
                <span className="qmeta">
                  {q.parts.length} part{q.parts.length === 1 ? '' : 's'} ·{' '}
                  {new Date(q.createdAt).toLocaleDateString()}
                </span>
                <span className="qtotal">{fmtMoney(cost.total, state.settings.currency)}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <span className={`pill ${q.status}`}>{q.status.toUpperCase()}</span>
                  {needsReview && <span className="pill review">NEEDS REVIEW</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
