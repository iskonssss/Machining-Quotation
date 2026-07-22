import { createContext, useContext, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { AppState, Part, Quote } from './types'
import { initialState } from './engine/defaults'
import { uid } from './engine/extraction'

const STORAGE_KEY = 'shopquote-state-v1'

type Action =
  | { type: 'load'; state: AppState }
  | { type: 'updateSettings'; settings: AppState['settings'] }
  | { type: 'updateMachines'; machines: AppState['machines'] }
  | { type: 'updateMaterials'; materials: AppState['materials'] }
  | { type: 'addQuote'; quote: Quote }
  | { type: 'updateQuote'; quote: Quote }
  | { type: 'deleteQuote'; id: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'load':
      return action.state
    case 'updateSettings':
      return { ...state, settings: action.settings }
    case 'updateMachines':
      return { ...state, machines: action.machines }
    case 'updateMaterials':
      return { ...state, materials: action.materials }
    case 'addQuote':
      return { ...state, quotes: [action.quote, ...state.quotes] }
    case 'updateQuote':
      return { ...state, quotes: state.quotes.map((q) => (q.id === action.quote.id ? action.quote : q)) }
    case 'deleteQuote':
      return { ...state, quotes: state.quotes.filter((q) => q.id !== action.id) }
  }
}

function loadPersisted(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      // Merge with defaults so new seed fields survive schema evolution.
      const base = initialState()
      return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } }
    }
  } catch {
    /* corrupted storage — start fresh */
  }
  return initialState()
}

const StoreContext = createContext<{ state: AppState; dispatch: (a: Action) => void } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersisted)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

export function newQuote(existingCount: number): Quote {
  const year = new Date().getFullYear()
  return {
    id: uid('q'),
    number: `Q-${year}-${String(existingCount + 1).padStart(3, '0')}`,
    customer: '',
    contact: '',
    createdAt: new Date().toISOString(),
    status: 'draft',
    parts: [],
    marginPct: 25,
    discountPct: 0,
    notes: '',
  }
}

export function newBlankPart(state: AppState): Part {
  return {
    id: uid('part'),
    name: 'New Part',
    drawingRef: '',
    quantity: 1,
    materialId: state.materials[0]?.id ?? '',
    stock: { shape: 'block', x: 100, y: 100, z: 20 },
    toleranceClass: 'standard',
    finish: 'none',
    operations: [],
    notes: '',
  }
}
