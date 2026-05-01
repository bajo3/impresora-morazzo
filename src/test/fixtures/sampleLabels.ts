import type { LabelModel } from '../../types'

export const sampleLabel: LabelModel = {
  id: 'test-1-0',
  rowNumber: 1,
  nombre: '',
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
  tableType: 'dvh',
  validationStatus: 'valid',
  validationIssues: [],
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

export const sampleSimpleGlassLabel: LabelModel = {
  id: 'test-sg-1',
  rowNumber: 33,
  nombre: 'Dani Sánchez',
  obra: 'WA07042026',
  medidas: '961 x 2500',
  medidas1: '961',
  medidas2: '2500',
  cantidad: '1',
  vidrio1: '10mm',
  camara: '',
  vidrio2: '',
  mts2: '2.40',
  observaciones: 'MC - Retira Miércoles de tarde',
  composicionDVH: '10mm',
  selected: false,
  tableType: 'simple_glass',
  validationStatus: 'valid',
  validationIssues: [],
}
