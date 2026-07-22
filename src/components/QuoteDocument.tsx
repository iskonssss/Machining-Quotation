import { costQuote, fmtMoney } from '../engine/costEngine'
import { useStore } from '../store'

export function QuoteDocument({ quoteId, onBack }: { quoteId: string; onBack: () => void }) {
  const { state } = useStore()
  const quote = state.quotes.find((q) => q.id === quoteId)
  if (!quote) return null

  const cost = costQuote(quote, state)
  const cur = state.settings.currency
  const validUntil = new Date(new Date(quote.createdAt).getTime() + 30 * 24 * 3600 * 1000)

  return (
    <>
      <div className="back-row no-print">
        <button className="btn-plain btn" onClick={onBack}>‹ Edit quote</button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>
          🖨️ Print / Save PDF
        </button>
      </div>

      <div className="doc">
        <div className="doc-head">
          <div>
            <h1>{state.settings.shopName}</h1>
            <div style={{ color: 'var(--label-2)', marginTop: 4 }}>CNC Machining &amp; Metal Fabrication</div>
          </div>
          <div className="meta">
            <strong>Quotation {quote.number}</strong>
            <br />
            Date: {new Date(quote.createdAt).toLocaleDateString()}
            <br />
            Valid until: {validUntil.toLocaleDateString()}
          </div>
        </div>

        <h2>Customer</h2>
        <div>
          <strong>{quote.customer || '—'}</strong>
          {quote.contact && <div style={{ color: 'var(--label-2)' }}>{quote.contact}</div>}
        </div>

        <h2>Items</h2>
        <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Part</th>
              <th>Drawing</th>
              <th>Material</th>
              <th className="num">Qty</th>
              <th className="num">Unit price</th>
              <th className="num">Line total</th>
            </tr>
          </thead>
          <tbody>
            {cost.parts.map((pc) => {
              const factor = cost.subtotal > 0 ? cost.total / cost.subtotal : 1
              const lineTotal = pc.totalBatch * factor
              const unit = pc.part.quantity > 0 ? lineTotal / pc.part.quantity : lineTotal
              return (
                <tr key={pc.part.id}>
                  <td style={{ fontWeight: 600 }}>{pc.part.name}</td>
                  <td className="subtle">{pc.part.drawingRef || '—'}</td>
                  <td>{pc.material?.name ?? '—'}</td>
                  <td className="num">{pc.part.quantity}</td>
                  <td className="num">{fmtMoney(unit, cur)}</td>
                  <td className="num">{fmtMoney(lineTotal, cur)}</td>
                </tr>
              )
            })}
            <tr className="doc-total-row">
              <td colSpan={5}>Total (excl. GST)</td>
              <td className="num">{fmtMoney(cost.total, cur)}</td>
            </tr>
          </tbody>
        </table>
        </div>

        {quote.notes && (
          <>
            <h2>Notes</h2>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--label-2)' }}>{quote.notes}</div>
          </>
        )}

        <div className="doc-footer">
          Prices exclude GST and shipping unless stated otherwise. Quotation valid 30 days.
          Lead time to be confirmed on order. Material certificates available on request.
        </div>
      </div>
    </>
  )
}
