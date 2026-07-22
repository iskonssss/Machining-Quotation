import type { AppState, Material, Operation, Part, Quote, StockDims } from '../types'

// ── Cost engine ──────────────────────────────────────────────────────────────
// Deterministic, transparent pricing. No AI here — this is the part the shop
// owner must be able to audit line by line, because his margin lives in it.

export interface OperationCost {
  operation: Operation
  setupMin: number
  runMinPerPart: number
  runMinBatch: number
  totalMin: number
  cost: number
}

export interface PartCost {
  part: Part
  material: Material | undefined
  stockMassKg: number
  materialCostPerPart: number
  materialCostBatch: number
  finishCostBatch: number
  operations: OperationCost[]
  machiningCostBatch: number
  totalBatch: number
  totalPerPart: number
}

export interface QuoteCost {
  parts: PartCost[]
  subtotal: number
  marginAmount: number
  discountAmount: number
  total: number
  totalHours: number
}

export function stockVolumeCm3(s: StockDims): number {
  const { x, y, z } = s
  switch (s.shape) {
    case 'round':
      // y = diameter, x = length
      return (Math.PI * (y / 2) ** 2 * x) / 1000
    case 'tube': {
      // y = outer diameter, z = wall thickness, x = length
      const ro = y / 2
      const ri = Math.max(ro - z, 0)
      return (Math.PI * (ro * ro - ri * ri) * x) / 1000
    }
    default:
      // block / plate / profile approximated as rectangular prism
      return (x * y * z) / 1000
  }
}

export function stockMassKg(s: StockDims, material: Material | undefined): number {
  if (!material) return 0
  return (stockVolumeCm3(s) * material.density) / 1000
}

function runMinutesPerPart(op: Operation): number {
  switch (op.basis) {
    case 'per-part-min':
      return op.runValue * Math.max(op.quantityFactor, 1)
    case 'per-hole':
    case 'per-bend':
    case 'per-weld-m':
    case 'per-cut-m':
      return op.runValue * op.quantityFactor
    case 'flat-min':
      return 0 // handled as batch-level flat time
  }
}

export function costOperation(op: Operation, state: AppState, part: Part): OperationCost {
  const machine = state.machines.find((m) => m.id === op.machineId)
  const rate = machine?.hourlyRate ?? 50
  const setupRate = machine?.setupRate ?? rate

  const isMachining = op.kind === 'milling' || op.kind === 'turning' || op.kind === 'drilling'
  const tolFactor = isMachining ? state.settings.toleranceFactors[part.toleranceClass] : 1

  const perPart = runMinutesPerPart(op) * tolFactor
  const flat = op.basis === 'flat-min' ? op.runValue : 0
  const runBatch = perPart * part.quantity + flat
  const totalMin = op.setupMin + runBatch
  const cost = (op.setupMin / 60) * setupRate + (runBatch / 60) * rate

  return { operation: op, setupMin: op.setupMin, runMinPerPart: perPart, runMinBatch: runBatch, totalMin, cost }
}

export function costPart(part: Part, state: AppState): PartCost {
  const material = state.materials.find((m) => m.id === part.materialId)
  const massKg = stockMassKg(part.stock, material)
  const matPerPart = material ? massKg * material.pricePerKg * (1 + material.markupPct / 100) : 0
  const materialCostBatch = matPerPart * part.quantity
  const finishCostBatch = state.settings.finishCosts[part.finish] * part.quantity

  const operations = part.operations.map((op) => costOperation(op, state, part))
  const machiningCostBatch = operations.reduce((s, o) => s + o.cost, 0)

  const totalBatch = materialCostBatch + finishCostBatch + machiningCostBatch
  return {
    part,
    material,
    stockMassKg: massKg,
    materialCostPerPart: matPerPart,
    materialCostBatch,
    finishCostBatch,
    operations,
    machiningCostBatch,
    totalBatch,
    totalPerPart: part.quantity > 0 ? totalBatch / part.quantity : totalBatch,
  }
}

export function costQuote(quote: Quote, state: AppState): QuoteCost {
  const parts = quote.parts.map((p) => costPart(p, state))
  const subtotal = parts.reduce((s, p) => s + p.totalBatch, 0)
  const marginAmount = subtotal * (quote.marginPct / 100)
  const discountAmount = (subtotal + marginAmount) * (quote.discountPct / 100)
  const total = subtotal + marginAmount - discountAmount
  const totalMin = parts.reduce((s, p) => s + p.operations.reduce((a, o) => a + o.totalMin, 0), 0)
  return { parts, subtotal, marginAmount, discountAmount, total, totalHours: totalMin / 60 }
}

export function fmtMoney(v: number, currency: string): string {
  return `${currency}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtHours(min: number): string {
  if (min < 60) return `${Math.round(min)} min`
  return `${(min / 60).toFixed(1)} h`
}
