import { useStore } from '../store'
import type { Machine, Material } from '../types'

export function Settings() {
  const { state, dispatch } = useStore()
  const s = state.settings

  const setSettings = (patch: Partial<typeof s>) =>
    dispatch({ type: 'updateSettings', settings: { ...s, ...patch } })

  const setMachine = (m: Machine) =>
    dispatch({ type: 'updateMachines', machines: state.machines.map((x) => (x.id === m.id ? m : x)) })

  const setMaterial = (m: Material) =>
    dispatch({ type: 'updateMaterials', materials: state.materials.map((x) => (x.id === m.id ? m : x)) })

  return (
    <>
      <div className="large-title">Shop Settings</div>
      <div className="subtitle">
        These numbers are the heart of every quote — fill them in with the shop's real rates.
      </div>

      <div className="settings-section">
        <div className="card">
          <div className="card-header"><h3>General</h3></div>
          <div className="form-row cols-3">
            <div className="field">
              <label>Shop name</label>
              <input value={s.shopName} onChange={(e) => setSettings({ shopName: e.target.value })} />
            </div>
            <div className="field">
              <label>Currency symbol</label>
              <input value={s.currency} onChange={(e) => setSettings({ currency: e.target.value })} />
            </div>
            <div className="field">
              <label>Default margin %</label>
              <input
                type="number"
                value={s.defaultMarginPct}
                onChange={(e) => setSettings({ defaultMarginPct: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="form-row cols-3" style={{ marginTop: 14 }}>
            <div className="field">
              <label>Fine tolerance time factor</label>
              <input
                type="number" step={0.05}
                value={s.toleranceFactors.fine}
                onChange={(e) =>
                  setSettings({ toleranceFactors: { ...s.toleranceFactors, fine: Number(e.target.value) } })
                }
              />
            </div>
            <div className="field">
              <label>Very fine tolerance factor</label>
              <input
                type="number" step={0.05}
                value={s.toleranceFactors['very-fine']}
                onChange={(e) =>
                  setSettings({ toleranceFactors: { ...s.toleranceFactors, 'very-fine': Number(e.target.value) } })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="card">
          <div className="card-header">
            <h3>Machines &amp; Hourly Rates</h3>
            <span className="hint">{s.currency}/hour including operator</span>
          </div>
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Process</th>
                <th className="num">Run rate ({s.currency}/h)</th>
                <th className="num">Setup rate ({s.currency}/h)</th>
              </tr>
            </thead>
            <tbody>
              {state.machines.map((m) => (
                <tr key={m.id}>
                  <td>
                    <input value={m.name} onChange={(e) => setMachine({ ...m, name: e.target.value })} />
                  </td>
                  <td className="subtle" style={{ fontSize: 13 }}>{m.kind}</td>
                  <td className="num">
                    <input
                      type="number"
                      value={m.hourlyRate}
                      onChange={(e) => setMachine({ ...m, hourlyRate: Number(e.target.value) })}
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      value={m.setupRate}
                      onChange={(e) => setMachine({ ...m, setupRate: Number(e.target.value) })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="card">
          <div className="card-header">
            <h3>Materials</h3>
            <span className="hint">purchase price + markup</span>
          </div>
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th className="num">Density (g/cm³)</th>
                <th className="num">Price ({s.currency}/kg)</th>
                <th className="num">Markup %</th>
              </tr>
            </thead>
            <tbody>
              {state.materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    <input value={m.name} onChange={(e) => setMaterial({ ...m, name: e.target.value })} />
                  </td>
                  <td className="num">
                    <input
                      type="number" step={0.01}
                      value={m.density}
                      onChange={(e) => setMaterial({ ...m, density: Number(e.target.value) })}
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number" step={0.1}
                      value={m.pricePerKg}
                      onChange={(e) => setMaterial({ ...m, pricePerKg: Number(e.target.value) })}
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      value={m.markupPct}
                      onChange={(e) => setMaterial({ ...m, markupPct: Number(e.target.value) })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  )
}
