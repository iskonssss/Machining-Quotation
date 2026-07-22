// ── Core data model ──────────────────────────────────────────────────────────
// Everything the cost engine needs lives here. The AI-extraction layer only
// ever *pre-fills* these structures — a human confirms before a quote goes out.

export type ProcessKind =
  | 'milling'
  | 'turning'
  | 'drilling'
  | 'welding'
  | 'bending'
  | 'pipe-bending'
  | 'cutting'
  | 'finishing'
  | 'assembly'

export interface Machine {
  id: string
  name: string
  kind: ProcessKind
  hourlyRate: number // €/h machine + operator
  setupRate: number // €/h during setup
}

export interface Material {
  id: string
  name: string
  density: number // g/cm³
  pricePerKg: number // €
  markupPct: number // % on top of purchase price
}

/** How an operation's run time scales. */
export type OpBasis =
  | 'per-part-min' // minutes per part
  | 'per-hole' // minutes per hole × count
  | 'per-bend' // minutes per bend × count
  | 'per-weld-m' // minutes per metre of weld × metres
  | 'flat-min' // one-off minutes for the batch

export interface OperationTemplate {
  id: string
  name: string
  kind: ProcessKind
  basis: OpBasis
  defaultSetupMin: number
  defaultRunValue: number // minutes per unit of `basis`
}

export interface Operation {
  id: string
  templateId: string
  name: string
  kind: ProcessKind
  machineId: string
  basis: OpBasis
  setupMin: number
  runValue: number // min per unit
  quantityFactor: number // holes, bends, weld metres… 1 for per-part
  note?: string
  /** true when this op was suggested by drawing extraction and not yet confirmed */
  needsReview?: boolean
}

export interface StockDims {
  shape: 'block' | 'round' | 'plate' | 'tube' | 'profile'
  x: number // mm — length
  y: number // mm — width / diameter
  z: number // mm — height / wall
}

export interface Part {
  id: string
  name: string
  drawingRef: string
  quantity: number
  materialId: string
  stock: StockDims
  toleranceClass: 'standard' | 'fine' | 'very-fine'
  finish: 'none' | 'deburr' | 'anodize' | 'paint' | 'galvanize'
  operations: Operation[]
  notes: string
}

export type QuoteStatus = 'draft' | 'sent' | 'won' | 'lost'

export interface Quote {
  id: string
  number: string
  customer: string
  contact: string
  createdAt: string // ISO date
  status: QuoteStatus
  parts: Part[]
  marginPct: number
  discountPct: number
  notes: string
}

export interface ShopSettings {
  shopName: string
  currency: string
  defaultMarginPct: number
  /** multipliers applied to machining time for tolerance classes */
  toleranceFactors: { standard: number; fine: number; 'very-fine': number }
  /** flat cost per part for finishes */
  finishCosts: { none: number; deburr: number; anodize: number; paint: number; galvanize: number }
}

export interface AppState {
  settings: ShopSettings
  machines: Machine[]
  materials: Material[]
  templates: OperationTemplate[]
  quotes: Quote[]
}

// ── Extraction (AI pre-fill) ────────────────────────────────────────────────

export interface ExtractedField<T> {
  value: T
  confidence: number // 0–1
}

/** Structured result of reading a 2D drawing. This is the contract a real
 *  vision-model backend will fulfil later; today it is mocked. */
export interface DrawingExtraction {
  fileName: string
  partName: ExtractedField<string>
  material: ExtractedField<string>
  stock: ExtractedField<StockDims>
  quantity: ExtractedField<number>
  holeCount: ExtractedField<number>
  threadCount: ExtractedField<number>
  bendCount: ExtractedField<number>
  weldMetres: ExtractedField<number>
  tightestTolerance: ExtractedField<string>
  surfaceFinish: ExtractedField<string>
  suggestedOps: { templateId: string; quantityFactor: number; reason: string }[]
  warnings: string[]
}
