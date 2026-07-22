import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Operation, Part, Quote, QuoteStatus } from '../types'
import { costPart, costQuote, fmtHours, fmtMoney } from '../engine/costEngine'
import { extractFromDrawing, extractionToPart, uid } from '../engine/extraction'
import { machineForTemplate } from '../engine/defaults'
import { newBlankPart, useStore } from '../store'

const BASIS_LABEL: Record<Operation['basis'], string> = {
  'per-part-min': 'min / part',
  'per-hole': 'min / hole',
  'per-bend': 'min / bend',
  'per-weld-m': 'min / metre',
  'per-cut-m': 'min / metre',
  'flat-min': 'min flat',
}

const FACTOR_LABEL: Record<Operation['basis'], string> = {
  'per-part-min': '×',
  'per-hole': 'holes',
  'per-bend': 'bends',
  'per-weld-m': 'metres',
  'per-cut-m': 'metres',
  'flat-min': '—',
}

export function QuoteEditor({
  quoteId,
  onBack,
  onPreview,
}: {
  quoteId: string
  onBack: () => void
  onPreview: () => void
}) {
  const { state, dispatch } = useStore()
  const quote = state.quotes.find((q) => q.id === quoteId)
  const [extracting, setExtracting] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!quote) {
    return (
      <div className="empty-state">
        <h3>Quote not found</h3>
        <button className="btn btn-tinted" onClick={onBack}>Back to quotes</button>
      </div>
    )
  }

  const update = (patch: Partial<Quote>) => dispatch({ type: 'updateQuote', quote: { ...quote, ...patch } })
  const updatePart = (part: Part) =>
    update({ parts: quote.parts.map((p) => (p.id === part.id ? part : p)) })

  async function ingestFiles(files: FileList | File[]) {
    if (!quote) return
    const newParts: Part[] = []
    for (const file of Array.from(files)) {
      setExtracting(file.name)
      const ex = await extractFromDrawing(file.name)
      newParts.push(extractionToPart(ex, state))
    }
    dispatch({ type: 'updateQuote', quote: { ...quote, parts: [...quote.parts, ...newParts] } })
    setExtracting(null)
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void ingestFiles(e.target.files)
    e.target.value = ''
  }

  const cost = costQuote(quote, state)
  const cur = state.settings.currency

  return (
    <>
      <div className="back-row no-print">
        <button className="btn-plain btn" onClick={onBack}>‹ Quotes</button>
      </div>

      <div className="toolbar">
        <div className="large-title" style={{ marginBottom: 0, flex: 1 }}>{quote.number}</div>
        <div className="segmented">
          {(['draft', 'sent', 'won', 'lost'] as QuoteStatus[]).map((s) => (
            <button key={s} className={quote.status === s ? 'on' : ''} onClick={() => update({ status: s })}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-green" onClick={onPreview} disabled={quote.parts.length === 0}>
          📄 Preview Quote
        </button>
      </div>

      <div className="editor-layout">
        <div className="editor-main">
          <div className="card">
            <div className="card-header"><h3>Customer</h3></div>
            <div className="form-row cols-2">
              <div className="field">
                <label>Company / Customer</label>
                <input
                  value={quote.customer}
                  placeholder="e.g. Meridian Engineering Ltd."
                  onChange={(e) => update({ customer: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Contact</label>
                <input
                  value={quote.contact}
                  placeholder="Name / email"
                  onChange={(e) => update({ contact: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Parts</h3>
              <span className="hint">Drop a drawing to pre-fill, or add a blank part</span>
            </div>
            <div
              className={`dropzone ${drag ? 'drag' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDrag(false)
                if (e.dataTransfer.files.length) void ingestFiles(e.dataTransfer.files)
              }}
            >
              📐 Drop a 2D drawing here (PDF, PNG, DXF)
              <span className="sub">
                The assistant reads the title block, dimensions, holes, welds &amp; tolerances and
                pre-fills the part — you review every value before it prices.
              </span>
            </div>
            <input ref={fileRef} type="file" hidden multiple accept=".pdf,.png,.jpg,.jpeg,.dxf" onChange={onFileInput} />
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-tinted"
                onClick={() => update({ parts: [...quote.parts, newBlankPart(state)] })}
              >
                ＋ Add blank part
              </button>
            </div>
          </div>

          {quote.parts.map((part) => (
            <PartEditor
              key={part.id}
              part={part}
              onChange={updatePart}
              onDelete={() => update({ parts: quote.parts.filter((p) => p.id !== part.id) })}
            />
          ))}
        </div>

        <div className="summary-panel">
          <div className="card">
            <div className="card-header"><h3>Price Summary</h3></div>
            {cost.parts.map((pc) => (
              <div className="summary-row" key={pc.part.id}>
                <span className="lbl">{pc.part.name} × {pc.part.quantity}</span>
                <span>{fmtMoney(pc.totalBatch, cur)}</span>
              </div>
            ))}
            <div className="summary-row">
              <span className="lbl">Subtotal (cost)</span>
              <span>{fmtMoney(cost.subtotal, cur)}</span>
            </div>
            <div className="summary-row">
              <span className="lbl">Margin</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={quote.marginPct}
                  style={{ width: 64, textAlign: 'right', background: 'var(--card-inset)', border: 'none', borderRadius: 8, padding: '4px 8px' }}
                  onChange={(e) => update({ marginPct: Number(e.target.value) })}
                /> %
              </span>
            </div>
            <div className="summary-row">
              <span className="lbl">Discount</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  value={quote.discountPct}
                  style={{ width: 64, textAlign: 'right', background: 'var(--card-inset)', border: 'none', borderRadius: 8, padding: '4px 8px' }}
                  onChange={(e) => update({ discountPct: Number(e.target.value) })}
                /> %
              </span>
            </div>
            <div className="summary-row">
              <span className="lbl">Shop time</span>
              <span>{cost.totalHours.toFixed(1)} h</span>
            </div>
            <div className="summary-row total">
              <span className="lbl">Total</span>
              <span>{fmtMoney(cost.total, cur)}</span>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Notes</h3></div>
            <div className="field">
              <textarea
                value={quote.notes}
                placeholder="Delivery time, payment terms, validity…"
                onChange={(e) => update({ notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {extracting && (
        <div className="extract-overlay">
          <div className="extract-card">
            <div className="spinner" />
            <h3>Reading {extracting}…</h3>
            <p>
              Extracting title block, material, dimensions, holes, threads, welds and tolerances.
              (Demo mode — sample data will be pre-filled.)
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// ── Part editor ──────────────────────────────────────────────────────────────

function PartEditor({
  part,
  onChange,
  onDelete,
}: {
  part: Part
  onChange: (p: Part) => void
  onDelete: () => void
}) {
  const { state } = useStore()
  const cur = state.settings.currency
  const pc = costPart(part, state)
  const reviewCount = part.operations.filter((o) => o.needsReview).length
  const [addTemplate, setAddTemplate] = useState('')

  const set = (patch: Partial<Part>) => onChange({ ...part, ...patch })
  const setOp = (op: Operation) =>
    set({ operations: part.operations.map((o) => (o.id === op.id ? op : o)) })

  function addOperation(templateId: string) {
    const t = state.templates.find((tp) => tp.id === templateId)
    if (!t) return
    const machine = machineForTemplate(state.machines, t)
    set({
      operations: [
        ...part.operations,
        {
          id: uid('op'),
          templateId: t.id,
          name: t.name,
          kind: t.kind,
          machineId: machine.id,
          basis: t.basis,
          setupMin: t.defaultSetupMin,
          runValue: t.defaultRunValue,
          quantityFactor: 1,
        },
      ],
    })
    setAddTemplate('')
  }

  return (
    <div className="card part-block">
      <div className="part-title-row">
        <input
          className="part-name"
          value={part.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <span className="pill sent">
          {fmtMoney(pc.totalPerPart, cur)} / part
        </span>
        <button className="btn btn-danger-plain" onClick={onDelete}>Remove</button>
      </div>

      {reviewCount > 0 && (
        <div className="review-banner">
          ⚠️ {reviewCount} operation{reviewCount === 1 ? '' : 's'} suggested from the drawing —
          check times &amp; counts, then confirm.
          <button
            className="btn btn-plain"
            style={{ marginLeft: 'auto', padding: '2px 8px' }}
            onClick={() =>
              set({ operations: part.operations.map((o) => ({ ...o, needsReview: false })) })
            }
          >
            Confirm all
          </button>
        </div>
      )}

      <div className="form-row cols-4">
        <div className="field">
          <label>Drawing ref.</label>
          <input value={part.drawingRef} placeholder="DRW-001 rev B" onChange={(e) => set({ drawingRef: e.target.value })} />
        </div>
        <div className="field">
          <label>Quantity</label>
          <input
            type="number" min={1}
            value={part.quantity}
            onChange={(e) => set({ quantity: Math.max(1, Number(e.target.value)) })}
          />
        </div>
        <div className="field">
          <label>Material</label>
          <select value={part.materialId} onChange={(e) => set({ materialId: e.target.value })}>
            {state.materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Finish</label>
          <select value={part.finish} onChange={(e) => set({ finish: e.target.value as Part['finish'] })}>
            <option value="none">None</option>
            <option value="deburr">Deburr</option>
            <option value="anodize">Anodize</option>
            <option value="paint">Paint</option>
            <option value="galvanize">Galvanize</option>
          </select>
        </div>
      </div>

      <div className="form-row cols-4" style={{ alignItems: 'end' }}>
        <div className="field">
          <label>Stock shape</label>
          <select
            value={part.stock.shape}
            onChange={(e) => set({ stock: { ...part.stock, shape: e.target.value as Part['stock']['shape'] } })}
          >
            <option value="block">Block</option>
            <option value="plate">Plate</option>
            <option value="round">Round bar</option>
            <option value="tube">Tube</option>
            <option value="profile">Profile</option>
          </select>
        </div>
        <div className="field">
          <label>{part.stock.shape === 'round' || part.stock.shape === 'tube' ? 'Length (mm)' : 'X (mm)'}</label>
          <input type="number" value={part.stock.x} onChange={(e) => set({ stock: { ...part.stock, x: Number(e.target.value) } })} />
        </div>
        <div className="field">
          <label>{part.stock.shape === 'round' || part.stock.shape === 'tube' ? 'Ø (mm)' : 'Y (mm)'}</label>
          <input type="number" value={part.stock.y} onChange={(e) => set({ stock: { ...part.stock, y: Number(e.target.value) } })} />
        </div>
        <div className="field">
          <label>{part.stock.shape === 'tube' ? 'Wall (mm)' : 'Z (mm)'}</label>
          <input type="number" value={part.stock.z} onChange={(e) => set({ stock: { ...part.stock, z: Number(e.target.value) } })} />
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <label style={{ margin: 0 }}>Tolerance</label>
          <div className="segmented">
            {(['standard', 'fine', 'very-fine'] as const).map((t) => (
              <button key={t} className={part.toleranceClass === t ? 'on' : ''} onClick={() => set({ toleranceClass: t })}>
                {t === 'standard' ? 'Standard' : t === 'fine' ? 'Fine' : 'Very fine'}
              </button>
            ))}
          </div>
        </div>
        <span className="subtle" style={{ color: 'var(--label-3)', fontSize: 12 }}>
          Stock ≈ {pc.stockMassKg.toFixed(2)} kg → material {fmtMoney(pc.materialCostPerPart, cur)}/part
        </span>
      </div>

      <div className="table-scroll" style={{ marginTop: 18, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Operation</th>
              <th>Machine</th>
              <th className="num">Setup</th>
              <th className="num">Run</th>
              <th className="num">Count</th>
              <th className="num">Batch time</th>
              <th className="num">Cost</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pc.operations.map((oc) => {
              const op = oc.operation
              return (
                <tr key={op.id}>
                  <td className="op-name">
                    {op.name}
                    {op.needsReview && (
                      <>
                        {' '}<span className="pill review" title={op.note}>AI</span>
                      </>
                    )}
                    {op.note && <div className="subtle">{op.note}</div>}
                  </td>
                  <td>
                    <select value={op.machineId} onChange={(e) => setOp({ ...op, machineId: e.target.value })}>
                      {state.machines.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="num" style={{ minWidth: 90 }}>
                    <input
                      type="number"
                      value={op.setupMin}
                      onChange={(e) => setOp({ ...op, setupMin: Number(e.target.value), needsReview: false })}
                    />
                    <div className="subtle">min</div>
                  </td>
                  <td className="num" style={{ minWidth: 100 }}>
                    <input
                      type="number"
                      value={op.runValue}
                      onChange={(e) => setOp({ ...op, runValue: Number(e.target.value), needsReview: false })}
                    />
                    <div className="subtle">{BASIS_LABEL[op.basis]}</div>
                  </td>
                  <td className="num" style={{ minWidth: 80 }}>
                    {op.basis === 'per-part-min' || op.basis === 'flat-min' ? (
                      <span className="subtle">—</span>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={op.quantityFactor}
                          onChange={(e) => setOp({ ...op, quantityFactor: Number(e.target.value), needsReview: false })}
                        />
                        <div className="subtle">{FACTOR_LABEL[op.basis]}</div>
                      </>
                    )}
                  </td>
                  <td className="num">{fmtHours(oc.totalMin)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(oc.cost, cur)}</td>
                  <td>
                    <button
                      className="btn-danger-plain btn"
                      style={{ padding: '4px 8px' }}
                      onClick={() => set({ operations: part.operations.filter((o) => o.id !== op.id) })}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
            {part.operations.length === 0 && (
              <tr>
                <td colSpan={8} className="subtle" style={{ textAlign: 'center', padding: 18 }}>
                  No operations yet — add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="field" style={{ maxWidth: 280 }}>
          <select value={addTemplate} onChange={(e) => addOperation(e.target.value)}>
            <option value="">＋ Add operation…</option>
            {state.templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {part.notes && (
        <div className="field" style={{ marginTop: 14 }}>
          <label>Part notes</label>
          <textarea value={part.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
      )}
    </div>
  )
}
