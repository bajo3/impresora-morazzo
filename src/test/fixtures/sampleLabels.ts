import type { LabelModel } from '../../types'

export const sampleLabel: LabelModel = {
  id: 'test-1-0',
  rowNumber: 1,
  obra: 'Edificio Test',
  medidas: '600 x 800',
  medidas1: '600',
  medidas2: '800',
  cantidad: '5',
  vidrio1: '4mm incoloro',
  camara: '12mm',
  vidrio2: '4mm incoloro',
  mts2: '0.48',
  observaciones: 'Sin observaciones',
  composicionDVH: '4mm incoloro / 12mm / 4mm incoloro',
  selected: false,
}

export const sampleLabels: LabelModel[] = [
  sampleLabel,
  {
    ...sampleLabel,
    id: 'test-2-1',
    rowNumber: 2,
    obra: 'Casa Particular',
    medidas: '400 x 600',
    medidas1: '400',
    medidas2: '600',
    cantidad: '2',
    mts2: '0.24',
    observaciones: '',
  },
]
