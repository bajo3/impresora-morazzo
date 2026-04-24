export type MessageKind = 'success' | 'warning'

export interface AppMessage {
  kind: MessageKind
  text: string
}

export interface RawLabelRow {
  rowNumber: number
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
}

export interface ParseWorkbookSuccess {
  labels: LabelModel[]
  messages: AppMessage[]
}

export type PrintScope = 'all' | 'selected'
export type LabelPresetId = '100x150' | '80x50'

export interface LabelSettings {
  id: LabelPresetId
  name: string
  widthMm: number
  heightMm: number
  dpi: number
  marginMm: number
}
