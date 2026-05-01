import type {
  AppMessage,
  ImportSummary,
  LabelModel,
  LabelStatus,
  ParseWorkbookSuccess,
  RawLabelRow,
  TableSummary,
  TableType,
  ValidationIssue,
} from '../types'

// ---------------------------------------------------------------------------
// Column aliases
// ---------------------------------------------------------------------------

const EXPECTED_COLUMNS = {
  nombre: ['nombre', 'name'],
  obra: ['obra'],
  medidas: ['medidas', 'medida'],
  medidas1: ['medidas1', 'medida1'],
  medidas2: ['medidas2', 'medida2'],
  cantidad: ['cant', 'cantidad'],
  vidrio1: ['vidrio1', 'vidrio'],
  camara: ['camara', 'camaradeaire'],
  vidrio2: ['vidrio2'],
  mts2: ['mts2', 'm2', 'mts'],
  observaciones: ['observaciones', 'observacion', 'obs', 'observ'],
} as const

type ColumnKey = keyof typeof EXPECTED_COLUMNS
type SheetRow = Array<string | number | boolean | null | undefined>
type HeaderMap = Record<ColumnKey, number>

// ---------------------------------------------------------------------------
// Internal block descriptor
// ---------------------------------------------------------------------------

interface DetectedTableBlock {
  headerRowIndex: number
  startRowIndex: number
  endRowIndex: number // inclusive
  type: TableType
  columnMap: Partial<HeaderMap>
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function normalizeHeaderName(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function toCellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }
  return String(value).trim()
}

function isRowCompletelyEmpty(row: SheetRow): boolean {
  return row.every((cell) => toCellText(cell) === '')
}

function countHeaderMatches(row: SheetRow): number {
  const normalized = row.map(normalizeHeaderName)
  return (Object.keys(EXPECTED_COLUMNS) as ColumnKey[]).reduce((score, key) => {
    const aliases = EXPECTED_COLUMNS[key] as readonly string[]
    return aliases.some((a) => normalized.includes(a)) ? score + 1 : score
  }, 0)
}

function buildHeaderMap(headerRow: SheetRow): Partial<HeaderMap> {
  const normalized = headerRow.map(normalizeHeaderName)
  return (Object.keys(EXPECTED_COLUMNS) as ColumnKey[]).reduce<Partial<HeaderMap>>(
    (map, key) => {
      const aliases = EXPECTED_COLUMNS[key] as readonly string[]
      const idx = normalized.findIndex((cell) => aliases.some((a) => a === cell))
      if (idx >= 0) map[key] = idx
      return map
    },
    {},
  )
}

function readCellByColumn(
  row: SheetRow,
  map: Partial<HeaderMap>,
  key: ColumnKey,
): string {
  const idx = map[key]
  return idx === undefined ? '' : toCellText(row[idx])
}

// ---------------------------------------------------------------------------
// Anonymous measure column resolution
// Handles: "Medidas" at col N, col N+1 has no header but contains heights
// ---------------------------------------------------------------------------

function resolveAnonymousMeasureCol(
  rows: SheetRow[],
  headerMap: Partial<HeaderMap>,
  dataStart: number,
  dataEnd: number,
): Partial<HeaderMap> {
  // Already has split measures explicitly
  if (headerMap.medidas1 !== undefined && headerMap.medidas2 !== undefined) {
    return headerMap
  }
  // medidas2 already found explicitly
  if (headerMap.medidas !== undefined && headerMap.medidas2 !== undefined) {
    return headerMap
  }
  // Nothing to resolve
  if (headerMap.medidas === undefined) return headerMap

  const medasCol = headerMap.medidas
  const candidate = medasCol + 1

  // Skip if candidate column is already mapped to something
  if (Object.values(headerMap).includes(candidate)) return headerMap

  // Sample up to 8 data rows to verify candidate has numeric values
  let numeric = 0
  let checked = 0
  for (let i = dataStart; i < Math.min(dataStart + 8, dataEnd + 1); i++) {
    const row = rows[i] ?? []
    const val = toCellText(row[candidate])
    if (val !== '') {
      checked++
      const n = parseFloat(val)
      if (Number.isFinite(n) && n > 0) numeric++
    }
  }

  if (checked >= 1 && numeric / checked >= 0.5) {
    return { ...headerMap, medidas2: candidate }
  }

  return headerMap
}

// ---------------------------------------------------------------------------
// Table type detection
// ---------------------------------------------------------------------------

function determineTableType(map: Partial<HeaderMap>): TableType {
  const hasDVH =
    map.vidrio1 !== undefined &&
    map.camara !== undefined &&
    map.vidrio2 !== undefined
  return hasDVH ? 'dvh' : 'simple_glass'
}

// ---------------------------------------------------------------------------
// Detect all table blocks in a sheet
// ---------------------------------------------------------------------------

export function detectTableBlocks(rows: SheetRow[]): DetectedTableBlock[] {
  // Pass 1: locate every row that looks like a header
  const headerPositions: number[] = []
  for (let i = 0; i < rows.length; i++) {
    if (countHeaderMatches(rows[i] ?? []) >= 3) {
      headerPositions.push(i)
    }
  }

  if (headerPositions.length === 0) return []

  const blocks: DetectedTableBlock[] = []

  for (let h = 0; h < headerPositions.length; h++) {
    const headerIdx = headerPositions[h]
    const nextHeaderIdx = headerPositions[h + 1] ?? rows.length

    const rawMap = buildHeaderMap(rows[headerIdx] ?? [])
    const resolvedMap = resolveAnonymousMeasureCol(
      rows,
      rawMap,
      headerIdx + 1,
      nextHeaderIdx - 1,
    )
    const type = determineTableType(resolvedMap)

    blocks.push({
      headerRowIndex: headerIdx,
      startRowIndex: headerIdx + 1,
      endRowIndex: nextHeaderIdx - 1,
      type,
      columnMap: resolvedMap,
    })
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Junk-row detection (within a table block)
// ---------------------------------------------------------------------------

const JUNK_KEYWORDS = /^(fecha|obra|total|subtotal|totales|fecha:$|obra:$)/i

function isJunkRow(row: SheetRow, map: Partial<HeaderMap>): boolean {
  if (isRowCompletelyEmpty(row)) return true

  // FECHA/OBRA/TOTAL keywords anywhere in the row
  for (const cell of row) {
    const t = toCellText(cell).trim()
    if (JUNK_KEYWORDS.test(t)) return true
    // A lone date string (e.g. "08/04/2026") in the medidas column is also junk
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return true
  }

  // No nombre, obra, or medidas → no label data
  const nombre = readCellByColumn(row, map, 'nombre')
  const obra = readCellByColumn(row, map, 'obra')
  const medidas = readCellByColumn(row, map, 'medidas')
  const medidas1 = readCellByColumn(row, map, 'medidas1')
  const medidas2 = readCellByColumn(row, map, 'medidas2')

  const hasNombreOrObra = nombre !== '' || obra !== ''
  const hasMedidas = medidas !== '' || medidas1 !== '' || medidas2 !== ''

  if (!hasNombreOrObra && !hasMedidas) return true

  return false
}

// ---------------------------------------------------------------------------
// Measure resolution (handles split columns + legacy single-cell)
// ---------------------------------------------------------------------------

function resolveMeasures(row: SheetRow, map: Partial<HeaderMap>) {
  const legacyMedidas = readCellByColumn(row, map, 'medidas')
  const rawMedidas1 = readCellByColumn(row, map, 'medidas1')
  const rawMedidas2 = readCellByColumn(row, map, 'medidas2')

  // Prefer explicit medidas1; fall back to legacy medidas column as width
  const effectiveMedidas1 = rawMedidas1 || legacyMedidas

  let combinedMedidas: string
  if (effectiveMedidas1 && rawMedidas2) {
    combinedMedidas = `${effectiveMedidas1} x ${rawMedidas2}`
  } else {
    combinedMedidas = effectiveMedidas1 || legacyMedidas
  }

  return {
    medidas: combinedMedidas,
    medidas1: effectiveMedidas1,
    medidas2: rawMedidas2,
  }
}

// ---------------------------------------------------------------------------
// Per-row validation
// ---------------------------------------------------------------------------

function isValidNumber(val: string): boolean {
  if (val === '') return false
  const n = parseFloat(val.replace(',', '.'))
  return Number.isFinite(n) && n > 0
}

function validateRow(
  raw: RawLabelRow,
  tableType: TableType,
): { status: LabelStatus; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []

  // --- Blocking errors ---

  // Both measure parts must be present for split-column format
  const hasMedidas1 = raw.medidas1 !== '' && isValidNumber(raw.medidas1)
  const hasMedidas2 = raw.medidas2 !== '' && isValidNumber(raw.medidas2)
  const hasCombined = raw.medidas !== '' && raw.medidas !== raw.medidas1 // single-cell "NNNxMMM"

  if (!raw.medidas || raw.medidas === '') {
    issues.push({ field: 'medidas', code: 'MISSING_MEDIDAS', message: 'Falta la medida' })
  } else if (!hasMedidas1 && !hasCombined && !hasMedidas2) {
    issues.push({ field: 'medidas', code: 'INVALID_MEDIDAS', message: `Medida inválida: "${raw.medidas}"` })
  }

  // Only flag as error when we have both split columns and one is non-numeric
  if (raw.medidas1 !== '' && raw.medidas2 !== '') {
    if (!isValidNumber(raw.medidas1)) {
      issues.push({ field: 'medidas1', code: 'INVALID_MEDIDAS1', message: `Ancho inválido: "${raw.medidas1}"` })
    }
    if (!isValidNumber(raw.medidas2)) {
      issues.push({ field: 'medidas2', code: 'INVALID_MEDIDAS2', message: `Alto inválido: "${raw.medidas2}"` })
    }
  }

  let cantidadFinal = raw.cantidad
  if (raw.cantidad === '' || raw.cantidad === '0') {
    // Default to 1 — warning only
    cantidadFinal = '1'
    issues.push({ field: 'cantidad', code: 'CANTIDAD_DEFAULTED', message: 'Cantidad vacía, se usa 1' })
  } else {
    const cantNum = parseInt(raw.cantidad, 10)
    if (!Number.isFinite(cantNum) || cantNum <= 0) {
      issues.push({ field: 'cantidad', code: 'INVALID_CANTIDAD', message: `Cantidad inválida: "${raw.cantidad}"` })
    }
  }

  if (tableType === 'dvh') {
    if (!raw.vidrio1) {
      issues.push({ field: 'vidrio1', code: 'MISSING_VIDRIO1', message: 'Falta Vidrio 1' })
    }
    if (!raw.camara) {
      issues.push({ field: 'camara', code: 'MISSING_CAMARA', message: 'Falta Cámara' })
    }
    if (!raw.vidrio2) {
      issues.push({ field: 'vidrio2', code: 'MISSING_VIDRIO2', message: 'Falta Vidrio 2' })
    }
  } else {
    if (!raw.vidrio1) {
      issues.push({ field: 'vidrio1', code: 'MISSING_VIDRIO', message: 'Falta Vidrio' })
    }
  }

  // --- Warnings ---
  if (!raw.obra) {
    issues.push({ field: 'obra', code: 'OBRA_EMPTY', message: 'Obra vacía' })
  }
  if (!raw.nombre) {
    issues.push({ field: 'nombre', code: 'NOMBRE_EMPTY', message: 'Nombre vacío' })
  }

  // Determine status
  const blockingCodes = [
    'MISSING_MEDIDAS', 'INVALID_MEDIDAS', 'INVALID_MEDIDAS1', 'INVALID_MEDIDAS2',
    'INVALID_CANTIDAD',
  ]
  const hasBlockingError = issues.some((i) => blockingCodes.includes(i.code))

  if (hasBlockingError) {
    return { status: 'error', issues }
  }

  const warnOnlyCodes = ['CANTIDAD_DEFAULTED', 'OBRA_EMPTY', 'NOMBRE_EMPTY']
  const hasWarnOnly = issues.every((i) => warnOnlyCodes.includes(i.code))

  if (issues.length > 0 && hasWarnOnly) {
    return { status: 'warning', issues }
  }

  if (issues.length === 0) {
    // patch: cantidad was adjusted without issue
    if (cantidadFinal !== raw.cantidad) {
      return { status: 'warning', issues: [{ field: 'cantidad', code: 'CANTIDAD_DEFAULTED', message: 'Cantidad vacía, se usa 1' }] }
    }
    return { status: 'valid', issues: [] }
  }

  return { status: 'warning', issues }
}

// ---------------------------------------------------------------------------
// Build composition string
// ---------------------------------------------------------------------------

function buildComposicion(row: RawLabelRow, tableType: TableType): string {
  if (tableType === 'dvh') {
    return [row.vidrio1, row.camara, row.vidrio2].filter(Boolean).join(' / ')
  }
  // simple_glass: just the vidrio value
  return row.vidrio1
}

// ---------------------------------------------------------------------------
// Parse one table block into LabelModel[]
// ---------------------------------------------------------------------------

function parseTableBlock(
  rows: SheetRow[],
  block: DetectedTableBlock,
  blockIndex: number,
): { labels: LabelModel[]; summary: TableSummary } {
  const { columnMap: map, type, headerRowIndex, startRowIndex, endRowIndex } = block
  const labels: LabelModel[] = []
  let rowsIgnored = 0

  for (let i = startRowIndex; i <= endRowIndex; i++) {
    const row = rows[i] ?? []

    // Skip header-repeat rows
    if (countHeaderMatches(row) >= 3) {
      rowsIgnored++
      continue
    }

    if (isJunkRow(row, map)) {
      rowsIgnored++
      continue
    }

    const measures = resolveMeasures(row, map)
    const rawRow: RawLabelRow = {
      rowNumber: i + 1,
      nombre: readCellByColumn(row, map, 'nombre'),
      obra: readCellByColumn(row, map, 'obra'),
      medidas: measures.medidas,
      medidas1: measures.medidas1,
      medidas2: measures.medidas2,
      cantidad: readCellByColumn(row, map, 'cantidad'),
      vidrio1: readCellByColumn(row, map, 'vidrio1'),
      camara: readCellByColumn(row, map, 'camara'),
      vidrio2: readCellByColumn(row, map, 'vidrio2'),
      mts2: readCellByColumn(row, map, 'mts2'),
      observaciones: readCellByColumn(row, map, 'observaciones'),
    }

    const { status, issues } = validateRow(rawRow, type)

    labels.push({
      ...rawRow,
      id: `b${blockIndex}-r${i}`,
      composicionDVH: buildComposicion(rawRow, type),
      selected: false,
      tableType: type,
      validationStatus: status,
      validationIssues: issues,
    })
  }

  const labelsValid = labels.filter((l) => l.validationStatus === 'valid').length
  const labelsWithWarnings = labels.filter((l) => l.validationStatus === 'warning').length
  const labelsWithErrors = labels.filter((l) => l.validationStatus === 'error').length

  const summary: TableSummary = {
    type,
    headerRowIndex,
    rowsProcessed: endRowIndex - startRowIndex + 1,
    rowsIgnored,
    labelsValid,
    labelsWithWarnings,
    labelsWithErrors,
  }

  return { labels, summary }
}

// ---------------------------------------------------------------------------
// Build import summary from table summaries
// ---------------------------------------------------------------------------

function buildImportSummary(tableSummaries: TableSummary[]): ImportSummary {
  return {
    tables: tableSummaries,
    totalValid: tableSummaries.reduce((s, t) => s + t.labelsValid, 0),
    totalWarnings: tableSummaries.reduce((s, t) => s + t.labelsWithWarnings, 0),
    totalErrors: tableSummaries.reduce((s, t) => s + t.labelsWithErrors, 0),
    totalIgnored: tableSummaries.reduce((s, t) => s + t.rowsIgnored, 0),
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function parseWorkbookFile(
  file: File,
  selectedSheetName?: string,
): Promise<ParseWorkbookSuccess> {
  const buffer = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetNames = workbook.SheetNames.filter(Boolean)
  const sheetName = selectedSheetName ?? sheetNames[0]

  if (sheetNames.length === 0 || !sheetName) {
    throw new Error('El archivo no contiene hojas para procesar.')
  }
  if (!sheetNames.includes(sheetName)) {
    throw new Error(`La hoja "${sheetName}" no existe en el archivo.`)
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, {
    header: 1,
    blankrows: true,
    raw: false,
    defval: '',
  })

  const blocks = detectTableBlocks(rows)

  if (blocks.length === 0) {
    throw new Error(
      `No se pudieron detectar tablas válidas en la hoja "${sheetName}". ` +
      'Verificá que la hoja tenga columnas como Obra, Medidas, Cant., Vidrio.',
    )
  }

  const allLabels: LabelModel[] = []
  const allSummaries: TableSummary[] = []

  blocks.forEach((block, idx) => {
    const { labels, summary } = parseTableBlock(rows, block, idx)
    allLabels.push(...labels)
    allSummaries.push(summary)
  })

  // Filter out ignored-status labels (they're not useful in the list)
  const printableLabels = allLabels.filter((l) => l.validationStatus !== 'ignored')

  if (printableLabels.length === 0) {
    throw new Error(
      `No se encontraron registros válidos en la hoja "${sheetName}".`,
    )
  }

  const importSummary = buildImportSummary(allSummaries)
  const messages: AppMessage[] = buildMessages(sheetName, sheetNames, importSummary)

  return {
    labels: printableLabels,
    messages,
    sheetNames,
    selectedSheetName: sheetName,
    importSummary,
  }
}

function buildMessages(
  sheetName: string,
  sheetNames: string[],
  summary: ImportSummary,
): AppMessage[] {
  const msgs: AppMessage[] = [
    { kind: 'success', text: `Hoja "${sheetName}" cargada. ${summary.totalValid + summary.totalWarnings} etiquetas listas.` },
  ]

  if (sheetNames.length > 1) {
    msgs.push({
      kind: 'warning',
      text: `El archivo tiene ${sheetNames.length} hojas. Podés cambiar la hoja desde el selector.`,
    })
  }

  if (summary.totalIgnored > 0) {
    msgs.push({
      kind: 'warning',
      text: `Se ignoraron ${summary.totalIgnored} filas (vacías, totales o encabezados).`,
    })
  }

  if (summary.totalErrors > 0) {
    msgs.push({
      kind: 'warning',
      text: `${summary.totalErrors} etiqueta(s) con errores no se incluirán en la impresión.`,
    })
  }

  return msgs
}

// Kept for backward compat export (used in tests that reference the old export)
export const quantityModeNotes = {
  defaultMode: 'single-per-row',
  changePoint: 'Modificar resolveAnonymousMeasureCol y parseTableBlock en src/lib/excelParser.ts.',
}
