import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { QuoteEditor } from './components/QuoteEditor'
import { Settings } from './components/Settings'
import { QuoteDocument } from './components/QuoteDocument'
import { useStore } from './store'

export type View =
  | { name: 'quotes' }
  | { name: 'editor'; quoteId: string }
  | { name: 'document'; quoteId: string }
  | { name: 'settings' }

export default function App() {
  const [view, setView] = useState<View>({ name: 'quotes' })
  const { state } = useStore()

  const navActive = view.name === 'settings' ? 'settings' : 'quotes'

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>
          Shop<span>Quote</span>
        </h1>
        <button
          className={`nav-item ${navActive === 'quotes' ? 'active' : ''}`}
          onClick={() => setView({ name: 'quotes' })}
        >
          <span className="icon">📄</span> Quotes
        </button>
        <button
          className={`nav-item ${navActive === 'settings' ? 'active' : ''}`}
          onClick={() => setView({ name: 'settings' })}
        >
          <span className="icon">⚙️</span> Shop Settings
        </button>
        <div className="sidebar-footer">
          {state.quotes.length} quote{state.quotes.length === 1 ? '' : 's'} · rates &amp; prices are
          editable in Shop Settings
        </div>
      </aside>
      <main className="main">
        {view.name === 'quotes' && <Dashboard onOpen={(id) => setView({ name: 'editor', quoteId: id })} />}
        {view.name === 'editor' && (
          <QuoteEditor
            quoteId={view.quoteId}
            onBack={() => setView({ name: 'quotes' })}
            onPreview={() => setView({ name: 'document', quoteId: view.quoteId })}
          />
        )}
        {view.name === 'document' && (
          <QuoteDocument quoteId={view.quoteId} onBack={() => setView({ name: 'editor', quoteId: view.quoteId })} />
        )}
        {view.name === 'settings' && <Settings />}
      </main>
    </div>
  )
}
