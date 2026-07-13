import type { LabelPresetId, LabelSettings } from '../types'

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  id: '100x150',
  name: '100 x 150',
  widthMm: 100,
  heightMm: 150,
  dpi: 203,
  marginMm: 5,
}

export const LABEL_PRESETS: LabelSettings[] = [
  DEFAULT_LABEL_SETTINGS,
  {
    id: '100x100',
    name: '100 x 100',
    widthMm: 100,
    heightMm: 100,
    dpi: 203,
    marginMm: 5,
  },
  {
    id: '80x50',
    name: '80 x 50',
    widthMm: 80,
    heightMm: 50,
    dpi: 203,
    marginMm: 3,
  },
]

export function getLabelPresetById(id: LabelPresetId): LabelSettings {
  return LABEL_PRESETS.find((preset) => preset.id === id) ?? DEFAULT_LABEL_SETTINGS
}
