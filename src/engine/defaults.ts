import type { AppState, Machine, Material, OperationTemplate, ShopSettings } from '../types'

// Seed data with sensible placeholder numbers. Every value here is meant to be
// replaced with the shop's real rates after the discovery meeting — that is
// exactly the point of the Settings screen.

export const defaultSettings: ShopSettings = {
  shopName: 'My Machine Shop',
  currency: '€',
  defaultMarginPct: 25,
  toleranceFactors: { standard: 1.0, fine: 1.25, 'very-fine': 1.6 },
  finishCosts: { none: 0, deburr: 1.5, anodize: 6, paint: 4, galvanize: 5 },
}

export const defaultMachines: Machine[] = [
  { id: 'm-mill3', name: '3-Axis Mill', kind: 'milling', hourlyRate: 65, setupRate: 55 },
  { id: 'm-lathe', name: 'CNC Lathe', kind: 'turning', hourlyRate: 60, setupRate: 50 },
  { id: 'm-drill', name: 'Drill Press / Mill Drilling', kind: 'drilling', hourlyRate: 45, setupRate: 40 },
  { id: 'm-weld', name: 'Welding Station (MIG/TIG)', kind: 'welding', hourlyRate: 55, setupRate: 45 },
  { id: 'm-brake', name: 'Press Brake', kind: 'bending', hourlyRate: 50, setupRate: 45 },
  { id: 'm-pipe', name: 'Pipe Bender', kind: 'pipe-bending', hourlyRate: 50, setupRate: 45 },
  { id: 'm-saw', name: 'Bandsaw / Cutting', kind: 'cutting', hourlyRate: 35, setupRate: 30 },
  { id: 'm-co2', name: 'CO₂ Laser', kind: 'cutting', hourlyRate: 60, setupRate: 45 },
  { id: 'm-fibre', name: 'Fibre Laser', kind: 'cutting', hourlyRate: 85, setupRate: 55 },
  { id: 'm-waterjet', name: 'Water Jet', kind: 'cutting', hourlyRate: 95, setupRate: 60 },
  { id: 'm-bench', name: 'Bench / Assembly', kind: 'assembly', hourlyRate: 40, setupRate: 40 },
]

export const defaultMaterials: Material[] = [
  { id: 'mat-al6061', name: 'Aluminium 6061', density: 2.7, pricePerKg: 6.5, markupPct: 20 },
  { id: 'mat-al7075', name: 'Aluminium 7075', density: 2.81, pricePerKg: 11, markupPct: 20 },
  { id: 'mat-s235', name: 'Steel S235 (Mild)', density: 7.85, pricePerKg: 1.8, markupPct: 25 },
  { id: 'mat-s355', name: 'Steel S355', density: 7.85, pricePerKg: 2.1, markupPct: 25 },
  { id: 'mat-ss304', name: 'Stainless 304', density: 8.0, pricePerKg: 5.5, markupPct: 20 },
  { id: 'mat-ss316', name: 'Stainless 316', density: 8.0, pricePerKg: 7.2, markupPct: 20 },
  { id: 'mat-brass', name: 'Brass CW614N', density: 8.5, pricePerKg: 8.8, markupPct: 20 },
  { id: 'mat-pom', name: 'POM / Delrin', density: 1.41, pricePerKg: 4.5, markupPct: 30 },
  { id: 'mat-acrylic-clear', name: 'Acrylic (Clear)', density: 1.19, pricePerKg: 4.8, markupPct: 30 },
  { id: 'mat-acrylic-col', name: 'Acrylic (Coloured)', density: 1.19, pricePerKg: 5.8, markupPct: 30 },
]

export const defaultTemplates: OperationTemplate[] = [
  { id: 'op-face', name: 'Facing / Squaring', kind: 'milling', basis: 'per-part-min', defaultSetupMin: 15, defaultRunValue: 6 },
  { id: 'op-contour', name: 'Contour Milling', kind: 'milling', basis: 'per-part-min', defaultSetupMin: 20, defaultRunValue: 10 },
  { id: 'op-pocket', name: 'Pocket Milling', kind: 'milling', basis: 'per-part-min', defaultSetupMin: 20, defaultRunValue: 12 },
  { id: 'op-chamfer', name: 'Chamfer / Deburr Edges', kind: 'milling', basis: 'per-part-min', defaultSetupMin: 5, defaultRunValue: 3 },
  { id: 'op-turn', name: 'Turning (OD/ID)', kind: 'turning', basis: 'per-part-min', defaultSetupMin: 25, defaultRunValue: 8 },
  { id: 'op-thread-turn', name: 'Thread Turning', kind: 'turning', basis: 'per-part-min', defaultSetupMin: 10, defaultRunValue: 4 },
  { id: 'op-drill', name: 'Drilling', kind: 'drilling', basis: 'per-hole', defaultSetupMin: 10, defaultRunValue: 1.5 },
  { id: 'op-tap', name: 'Tapping / Threading', kind: 'drilling', basis: 'per-hole', defaultSetupMin: 8, defaultRunValue: 2.5 },
  { id: 'op-cbore', name: 'Counterbore / Countersink', kind: 'drilling', basis: 'per-hole', defaultSetupMin: 8, defaultRunValue: 1.2 },
  { id: 'op-weld-fillet', name: 'Fillet Weld', kind: 'welding', basis: 'per-weld-m', defaultSetupMin: 15, defaultRunValue: 20 },
  { id: 'op-weld-butt', name: 'Butt Weld', kind: 'welding', basis: 'per-weld-m', defaultSetupMin: 15, defaultRunValue: 25 },
  { id: 'op-weld-tack', name: 'Tack & Fit-up', kind: 'welding', basis: 'per-part-min', defaultSetupMin: 10, defaultRunValue: 12 },
  { id: 'op-bend', name: 'Press Brake Bend', kind: 'bending', basis: 'per-bend', defaultSetupMin: 20, defaultRunValue: 1.5 },
  { id: 'op-pipebend', name: 'Pipe / Tube Bend', kind: 'pipe-bending', basis: 'per-bend', defaultSetupMin: 25, defaultRunValue: 3 },
  { id: 'op-cut', name: 'Saw Cutting to Length', kind: 'cutting', basis: 'per-part-min', defaultSetupMin: 5, defaultRunValue: 3, preferredMachineId: 'm-saw' },
  { id: 'op-laser-co2', name: 'CO₂ Laser Cutting', kind: 'cutting', basis: 'per-cut-m', defaultSetupMin: 10, defaultRunValue: 1, preferredMachineId: 'm-co2' },
  { id: 'op-laser-fibre', name: 'Fibre Laser Cutting', kind: 'cutting', basis: 'per-cut-m', defaultSetupMin: 10, defaultRunValue: 0.6, preferredMachineId: 'm-fibre' },
  { id: 'op-waterjet', name: 'Water Jet Cutting', kind: 'cutting', basis: 'per-cut-m', defaultSetupMin: 15, defaultRunValue: 3, preferredMachineId: 'm-waterjet' },
  { id: 'op-finish', name: 'Manual Finishing', kind: 'finishing', basis: 'per-part-min', defaultSetupMin: 0, defaultRunValue: 5 },
  { id: 'op-assy', name: 'Assembly', kind: 'assembly', basis: 'per-part-min', defaultSetupMin: 10, defaultRunValue: 10 },
  { id: 'op-inspect', name: 'Inspection / QC', kind: 'assembly', basis: 'per-part-min', defaultSetupMin: 5, defaultRunValue: 4 },
]

/** Pick the first machine matching an operation kind. */
export function machineForKind(machines: Machine[], kind: string): Machine {
  return machines.find((m) => m.kind === kind) ?? machines[0]
}

/** Resolve a template's machine: its pinned machine if set, else by kind. */
export function machineForTemplate(machines: Machine[], t: OperationTemplate): Machine {
  return machines.find((m) => m.id === t.preferredMachineId) ?? machineForKind(machines, t.kind)
}

export function initialState(): AppState {
  return {
    settings: defaultSettings,
    machines: defaultMachines,
    materials: defaultMaterials,
    templates: defaultTemplates,
    quotes: [],
  }
}
