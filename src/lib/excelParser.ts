import type { AppMessage, LabelModel, ParseWorkbookSuccess, RawLabelRow } from '../types'

const EXPECTED_COLUMNS = {
  obra: ['obra'],
  medidas: ['medidas', 'medida'],
  medidas1: ['medidas1', 'medida1'],
  medidas2: ['medidas2', 'medida2'],
  cantidad: ['cant', 'cantidad'],
  vidrio1: ['vidrio1', 'vidrio'],
  camara: ['camara', 'camaradeaire'],
  vidrio2: ['vidrio2'],
  mts2: ['mts2', 'm2', 'mts'],
  observaciones: ['observaciones', 'observacion', 'obs'],
} as const

type ColumnKey = keyof typeof EXPECTED_COLUMNS
type SheetRow = Array<string | number | boolean | null | undefined>
type HeaderMap = Record<ColumnKey, number>
type QuantityMode = 'single-per-row' | 'repeat-by-quantity'
type BaseRequiredColumnKey =
  | 'obra'
  | 'cantidad'
  | 'vidrio1'
  | 'camara'
  | 'vidrio2'
  | 'mts2'
  | 'observaciones'

const DEFAULT_QUANTITY_MODE: QuantityMode = 'single-per-row'
const BASE_REQUIRED_COLUMN_KEYS: BaseRequiredColumnKey[] = [
  'obra',
  'cantidad',
  'vidrio1',
  'camara',
  'vidrio2',
  'mts2',
  'observaciones',
]

function normalizeHeaderName(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function toCellText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }

  return String(value).trim()
}

function isRowCompletelyEmpty(row: SheetRow): boolean {
  return row.every((cell) => toCellText(cell) === '')
}

function countHeaderMatches(row: SheetRow): number {
  const normalizedCells = row.map(normalizeHeaderName)

  const baseMatches = BASE_REQUIRED_COLUMN_KEYS.reduce((score, key) => {
    const hasMatch = EXPECTED_COLUMNS[key].some((alias) =>
      normalizedCells.includes(alias),
    )

    return hasMatch ? score + 1 : score
  }, 0)

  const hasLegacyMeasures = EXPECTED_COLUMNS.medidas.some((alias) =>
    normalizedCells.includes(alias),
  )
  const hasSplitMeasures =
    EXPECTED_COLUMNS.medidas1.some((alias) => normalizedCells.includes(alias)) &&
    EXPECTED_COLUMNS.medidas2.some((alias) => normalizedCells.includes(alias))

  return baseMatches + (hasLegacyMeasures || hasSplitMeasures ? 1 : 0)
}

function detectHeaderRow(rows: SheetRow[]): number {
  let bestIndex = -1
  let bestScore = 0
  const searchWindow = Math.min(rows.length, 25)

  for (let index = 0; index < searchWindow; index += 1) {
    const score = countHeaderMatches(rows[index] ?? [])
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  return bestScore >= 3 ? bestIndex : -1
}

function buildHeaderMap(headerRow: SheetRow): Partial<HeaderMap> {
  const normalizedCells = headerRow.map(normalizeHeaderName)

  return (Object.keys(EXPECTED_COLUMNS) as ColumnKey[]).reduce<Partial<HeaderMap>>(
    (map, key) => {
      const aliases = [...EXPECTED_COLUMNS[key]]
      const columnIndex = normalizedCells.findIndex((cell) =>
        aliases.some((alias) => alias === cell),
      )

      if (columnIndex >= 0) {
        map[key] = columnIndex
      }

      return map
    },
    {},
  )
}

function getMissingColumns(headerMap: Partial<HeaderMap>): string[] {
  const labels: Record<ColumnKey, string> = {
    obra: 'Obra',
    medidas: 'Medidas',
    medidas1: 'Medidas 1',
    medidas2: 'Medidas 2',
    cantidad: 'Cant.',
    vidrio1: 'Vidrio 1',
    camara: 'C\u00E1mara',
    vidrio2: 'Vidrio 2',
    mts2: 'Mts.2',
    observaciones: 'OBSERVACIONES',
  }

  const missingColumns = BASE_REQUIRED_COLUMN_KEYS.filter(
    (key) => headerMap[key] === undefined,
  ).map((key) => labels[key])

  const hasLegacyMeasures = headerMap.medidas !== undefined
  const hasSplitMeasures =
    headerMap.medidas1 !== undefined && headerMap.medidas2 !== undefined

  if (!hasLegacyMeasures && !hasSplitMeasures) {
    missingColumns.push('Medidas / Medidas 1 y Medidas 2')
  }

  return missingColumns
}

function readCellByColumn(
  row: SheetRow,
  headerMap: Partial<HeaderMap>,
  key: ColumnKey,
): string {
  const cellIndex = headerMap[key]
  return cellIndex === undefined ? '' : toCellText(row[cellIndex])
}

function isValidDataRow(row: RawLabelRow): boolean {
  return [
    row.obra,
    row.medidas,
    row.medidas1,
    row.medidas2,
    row.cantidad,
    row.vidrio1,
    row.camara,
    row.vidrio2,
    row.mts2,
    row.observaciones,
  ].some((value) => value !== '')
}

function resolveMeasures(row: SheetRow, headerMap: Partial<HeaderMap>) {
  const legacyMeasures = readCellByColumn(row, headerMap, 'medidas')
  const medidas1 = readCellByColumn(row, headerMap, 'medidas1')
  const medidas2 = readCellByColumn(row, headerMap, 'medidas2')
  const combinedMeasures =
    [medidas1, medidas2].filter(Boolean).join(' x ') || legacyMeasures

  return {
    medidas: combinedMeasures,
    medidas1,
    medidas2,
  }
}

function normalizeDataRows(
  rows: SheetRow[],
  headerMap: Partial<HeaderMap>,
): { normalizedRows: RawLabelRow[]; ignoredEmptyRows: number } {
  const normalizedRows: RawLabelRow[] = []
  let ignoredEmptyRows = 0

  rows.forEach((row, index) => {
    if (isRowCompletelyEmpty(row)) {
      ignoredEmptyRows += 1
      return
    }

    const measures = resolveMeasures(row, headerMap)

    const normalizedRow: RawLabelRow = {
      rowNumber: index + 1,
      obra: readCellByColumn(row, headerMap, 'obra'),
      medidas: measures.medidas,
      medidas1: measures.medidas1,
      medidas2: measures.medidas2,
      cantidad: readCellByColumn(row, headerMap, 'cantidad'),
      vidrio1: readCellByColumn(row, headerMap, 'vidrio1'),
      camara: readCellByColumn(row, headerMap, 'camara'),
      vidrio2: readCellByColumn(row, headerMap, 'vidrio2'),
      mts2: readCellByColumn(row, headerMap, 'mts2'),
      observaciones: readCellByColumn(row, headerMap, 'observaciones'),
    }

    if (isValidDataRow(normalizedRow)) {
      normalizedRows.push(normalizedRow)
    }
  })

  return { normalizedRows, ignoredEmptyRows }
}

function buildDVHComposition(row: RawLabelRow): string {
  return [row.vidrio1, row.camara, row.vidrio2].filter(Boolean).join(' / ')
}

function createBaseLabels(rows: RawLabelRow[]): LabelModel[] {
  return rows.map((row, index) => ({
    ...row,
    id: `${row.rowNumber}-${index}`,
    composicionDVH: buildDVHComposition(row),
    selected: false,
  }))
}

function parseQuantityValue(quantityText: string): number {
  const normalized = Number.parseInt(quantityText, 10)
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 1
}

function resolveLabelsForQuantityMode(
  labels: LabelModel[],
  quantityMode: QuantityMode = DEFAULT_QUANTITY_MODE,
): LabelModel[] {
  // Cambiar esta funcion si mas adelante se decide repetir etiquetas por "Cant.".
  if (quantityMode === 'single-per-row') {
    return labels
  }

  return labels.flatMap((label) => {
    const repetitions = parseQuantityValue(label.cantidad)

    return Array.from({ length: repetitions }, (_, copyIndex) => ({
      ...label,
      id: `${label.id}-copy-${copyIndex + 1}`,
    }))
  })
}

export async function parseWorkbookFile(file: File): Promise<ParseWorkbookSuccess> {
  const buffer = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    throw new Error('El archivo no contiene hojas para procesar.')
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, {
    header: 1,
    blankrows: true,
    raw: false,
    defval: '',
  })

  const headerRowIndex = detectHeaderRow(rows)
  if (headerRowIndex < 0) {
    throw new Error(
      'No se pudieron detectar los encabezados esperados en el archivo.',
    )
  }

  const headerMap = buildHeaderMap(rows[headerRowIndex] ?? [])
  const missingColumns = getMissingColumns(headerMap)

  if (missingColumns.length > 0) {
    throw new Error(`Falta la columna ${missingColumns[0]}.`)
  }

  const { normalizedRows, ignoredEmptyRows } = normalizeDataRows(
    rows.slice(headerRowIndex + 1),
    headerMap,
  )

  if (normalizedRows.length === 0) {
    throw new Error('No se encontraron registros v\u00E1lidos.')
  }

  const labels = resolveLabelsForQuantityMode(createBaseLabels(normalizedRows))
  const messages: AppMessage[] = [
    { kind: 'success', text: 'Archivo cargado correctamente.' },
  ]

  if (ignoredEmptyRows > 0) {
    messages.push({
      kind: 'warning',
      text: 'Se detectaron filas vac\u00EDas y fueron ignoradas.',
    })
  }

  return { labels, messages }
}

export const quantityModeNotes = {
  defaultMode: DEFAULT_QUANTITY_MODE,
  changePoint:
    'Modificar la constante DEFAULT_QUANTITY_MODE o la funci\u00F3n resolveLabelsForQuantityMode en src/lib/excelParser.ts.',
}
