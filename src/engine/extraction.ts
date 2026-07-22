import type { DrawingExtraction, Operation, Part } from '../types'
import { machineForTemplate } from './defaults'
import type { AppState } from '../types'

// ── Drawing extraction (STUB) ───────────────────────────────────────────────
// This module fakes what a vision-language-model backend will do: read a 2D
// engineering drawing (PDF/image) and return structured quote drivers with
// confidence scores. The UI treats every extracted value as a *suggestion*
// that the estimator must confirm — that contract stays identical when the
// real model is plugged in behind `extractFromDrawing`.

const SAMPLE_EXTRACTIONS: Omit<DrawingExtraction, 'fileName'>[] = [
  {
    partName: { value: 'Bearing Housing', confidence: 0.94 },
    material: { value: 'Aluminium 6061', confidence: 0.9 },
    stock: { value: { shape: 'block', x: 120, y: 80, z: 40 }, confidence: 0.82 },
    quantity: { value: 10, confidence: 0.7 },
    holeCount: { value: 8, confidence: 0.85 },
    threadCount: { value: 4, confidence: 0.8 },
    bendCount: { value: 0, confidence: 0.95 },
    weldMetres: { value: 0, confidence: 0.95 },
    tightestTolerance: { value: '±0.02 mm (bore Ø35 H7)', confidence: 0.75 },
    surfaceFinish: { value: 'Ra 1.6 on bore', confidence: 0.7 },
    suggestedOps: [
      { templateId: 'op-face', quantityFactor: 1, reason: 'Rectangular billet — squaring required' },
      { templateId: 'op-pocket', quantityFactor: 1, reason: 'Central pocket visible in section A-A' },
      { templateId: 'op-drill', quantityFactor: 8, reason: '8× Ø6.6 through holes on bolt circle' },
      { templateId: 'op-tap', quantityFactor: 4, reason: '4× M8 tapped holes noted' },
      { templateId: 'op-chamfer', quantityFactor: 1, reason: 'General note: break all edges 0.5×45°' },
    ],
    warnings: ['H7 bore tolerance may need reaming or boring — verify machine capability.'],
  },
  {
    partName: { value: 'Support Bracket', confidence: 0.9 },
    material: { value: 'Steel S235 (Mild)', confidence: 0.88 },
    stock: { value: { shape: 'plate', x: 250, y: 150, z: 5 }, confidence: 0.85 },
    quantity: { value: 25, confidence: 0.65 },
    holeCount: { value: 6, confidence: 0.9 },
    threadCount: { value: 0, confidence: 0.9 },
    bendCount: { value: 2, confidence: 0.8 },
    weldMetres: { value: 0.4, confidence: 0.6 },
    tightestTolerance: { value: '±0.2 mm general', confidence: 0.8 },
    surfaceFinish: { value: 'Painted RAL 7035', confidence: 0.75 },
    suggestedOps: [
      { templateId: 'op-cut', quantityFactor: 1, reason: 'Blank cut from 5 mm plate' },
      { templateId: 'op-drill', quantityFactor: 6, reason: '6× Ø9 holes' },
      { templateId: 'op-bend', quantityFactor: 2, reason: 'Two 90° bends shown in side view' },
      { templateId: 'op-weld-fillet', quantityFactor: 0.4, reason: 'Gusset welded, ~400 mm fillet weld' },
      { templateId: 'op-finish', quantityFactor: 1, reason: 'Deburr before paint' },
    ],
    warnings: ['Weld length estimated from view scale — confirm with customer.', 'Paint spec RAL 7035 assumed external.'],
  },
  {
    partName: { value: 'Drive Shaft', confidence: 0.92 },
    material: { value: 'Stainless 304', confidence: 0.85 },
    stock: { value: { shape: 'round', x: 220, y: 40, z: 0 }, confidence: 0.88 },
    quantity: { value: 5, confidence: 0.7 },
    holeCount: { value: 1, confidence: 0.8 },
    threadCount: { value: 1, confidence: 0.85 },
    bendCount: { value: 0, confidence: 0.95 },
    weldMetres: { value: 0, confidence: 0.95 },
    tightestTolerance: { value: 'Ø30 g6 bearing seat', confidence: 0.8 },
    surfaceFinish: { value: 'Ra 0.8 on bearing seats', confidence: 0.75 },
    suggestedOps: [
      { templateId: 'op-turn', quantityFactor: 1, reason: 'Stepped shaft — OD turning both ends' },
      { templateId: 'op-thread-turn', quantityFactor: 1, reason: 'M20×1.5 external thread' },
      { templateId: 'op-drill', quantityFactor: 1, reason: 'Cross hole Ø5' },
      { templateId: 'op-inspect', quantityFactor: 1, reason: 'g6 seats require inspection' },
    ],
    warnings: ['g6 tolerance requires grinding or careful finish turning — priced as fine tolerance.'],
  },
]

let sampleCursor = 0

/** Simulates a backend call. Swap the body for a real API call later. */
export function extractFromDrawing(fileName: string): Promise<DrawingExtraction> {
  const sample = SAMPLE_EXTRACTIONS[sampleCursor % SAMPLE_EXTRACTIONS.length]
  sampleCursor += 1
  return new Promise((resolve) =>
    setTimeout(() => resolve({ fileName, ...sample }), 1400 + Math.random() * 900),
  )
}

let idCounter = 0
export function uid(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

/** Convert an extraction result into a pre-filled Part the estimator reviews. */
export function extractionToPart(ex: DrawingExtraction, state: AppState): Part {
  const material =
    state.materials.find((m) => m.name.toLowerCase() === ex.material.value.toLowerCase()) ??
    state.materials[0]

  const operations: Operation[] = ex.suggestedOps.map((s) => {
    const t = state.templates.find((tp) => tp.id === s.templateId) ?? state.templates[0]
    const machine = machineForTemplate(state.machines, t)
    return {
      id: uid('op'),
      templateId: t.id,
      name: t.name,
      kind: t.kind,
      machineId: machine.id,
      basis: t.basis,
      setupMin: t.defaultSetupMin,
      runValue: t.defaultRunValue,
      quantityFactor: s.quantityFactor,
      note: s.reason,
      needsReview: true,
    }
  })

  const fine = /h7|g6|±0\.0[0-5]|ra 0\.8/i.test(ex.tightestTolerance.value)

  return {
    id: uid('part'),
    name: ex.partName.value,
    drawingRef: ex.fileName,
    quantity: ex.quantity.value,
    materialId: material.id,
    stock: ex.stock.value,
    toleranceClass: fine ? 'fine' : 'standard',
    finish: /paint/i.test(ex.surfaceFinish.value) ? 'paint' : 'deburr',
    operations,
    notes: [
      `Extracted from ${ex.fileName} — review before sending.`,
      `Tightest tolerance: ${ex.tightestTolerance.value}`,
      ...ex.warnings.map((w) => `⚠ ${w}`),
    ].join('\n'),
  }
}
