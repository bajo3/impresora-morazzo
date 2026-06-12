export type MessageKind = 'success' | 'warning'

export interface AppMessage {
  kind: MessageKind
  text: string
}

export type TableType = 'dvh' | 'simple_glass'
export type LabelStatus = 'valid' | 'warning' | 'error' | 'ignored'

export interface ValidationIssue {
  field: string
  code: string
  message: string
}

export interface RawLabelRow {
  rowNumber: number
  nombre: string
  obra: string
  medidas: string
  medidas1: string
  medidas2: string
  cantidad: string
  vidrio1: string
  camara: string
  vidrio2: string
  mts2: string
  observaciones: string
}

export interface LabelModel extends RawLabelRow {
  id: string
  composicionDVH: string
  selected: boolean
  tableType: TableType
  validationStatus: LabelStatus
  validationIssues: ValidationIssue[]
}

export interface TableSummary {
  type: TableType
  headerRowIndex: number
  rowsProcessed: number
  rowsIgnored: number
  labelsValid: number
  labelsWithWarnings: number
  labelsWithErrors: number
}

export interface ImportSummary {
  tables: TableSummary[]
  totalValid: number
  totalWarnings: number
  totalErrors: number
  totalIgnored: number
}

export interface ParseWorkbookSuccess {
  labels: LabelModel[]
  messages: AppMessage[]
  sheetNames: string[]
  selectedSheetName: string
  importSummary: ImportSummary
}

export type PrintScope = 'all' | 'selected'
export type PrintQuantityMode = 'quantity' | 'single'
export type LabelPresetId = '100x150' | '80x50'

export interface LabelSettings {
  id: LabelPresetId
  name: string
  widthMm: number
  heightMm: number
  dpi: number
  marginMm: number
}

export interface CompanySettings {
  companyName: string
  companySubtitle: string
  companyLogoDataUrl: string | null
  showLogo: boolean
  showCompanyName: boolean
}
