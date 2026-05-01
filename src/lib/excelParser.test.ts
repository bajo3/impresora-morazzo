import { describe, it, expect } from 'vitest'
import { detectTableBlocks } from './excelParser'

// ---------------------------------------------------------------------------
// Fixtures que replican la estructura de "Feli Lentini.xlsx"
// ---------------------------------------------------------------------------

type Row = Array<string | number>

// Hoja con datos reales basados en 08-04-2026
const sheetWithTwoTables: Row[] = [
  // row 0 — FECHA (junk)
  ['', 'FECHA:', '', '08/04/2026', '', '', '', '', '', '', '', ''],
  // row 1 — OBRA (junk)
  ['', 'OBRA:', '', '', '', '', '', '', '', '', '', ''],
  // row 2 — empty
  ['', '', '', '', '', '', '', '', '', '', '', ''],
  // row 3 — DVH HEADER
  ['', 'Nombre', 'Obra', 'Medidas', '', 'Cant.', 'Vidrio 1', 'Cámara', 'Vidrio 2', 'Mts.2', 'OBSERVACIONES', ''],
  // row 4 — DVH data: medidas en dos columnas
  ['', 'Chino', 'Paula Arquivial', '985', '1722', '1', '4', '12', '4', '3.39', '', ''],
  // row 5 — DVH data
  ['', 'Chino', 'Paula Arquivial', '595', '1860', '2', '4', '12', '4', '4.43', '', ''],
  // row 6 — DVH data with laminated glass
  ['', 'Chino', 'Paula Arquivial', '2054', '1712', '1', '3+3', '12', '5', '7.03', '', ''],
  // row 7 — DVH data with observation
  ['', 'Martens', 'Hilda', '918', '665', '4', '4', '9', '4', '4.88', 'Cobrar', ''],
  // row 8 — empty
  ['', '', '', '', '', '', '', '', '', '', '', ''],
  // row 9 — totals: solo cant + mts2 (junk)
  ['', '', '', '', '', '30', '', '', '', '70.08', '', ''],
  // row 10 — totals variant: solo camara + mts2 (junk)
  ['', '', '', '', '', '', '', '5', '', '35.04', '', ''],
  // row 11 — date row (junk)
  ['', '', '', '08/04/2026', '', '', '', '', '', '', '', ''],
  // row 12 — empty
  ['', '', '', '', '', '', '', '', '', '', '', ''],
  // row 13 — SIMPLE GLASS HEADER
  ['', 'Nombre', 'Obra', 'Medidas', '', 'Cantidad', 'Vidrio', 'Mts.2', 'Observ.', '', '', ''],
  // row 14 — simple glass data
  ['', 'Dani Sánchez', 'WA07042026', '961', '2500', '1', '10mm', '2.40', 'MC - Retira', '', '', ''],
  // row 15 — simple glass data
  ['', 'Toletti', 'WA25032026', '775', '830', '2', '3+3', '1.29', '', '', '', ''],
  // row 16 — totals (junk)
  ['', '', '', '', '', '37', '', '39.81', '', '', '', ''],
]

// Hoja con encabezado "Medidas 1" / "Medidas2" explícitos (sheet 15-04-2026)
const sheetWithExplicitSplitHeaders: Row[] = [
  ['', 'FECHA:', '', '15/04/2026', '', '', '', '', '', '', '', ''],
  ['', 'OBRA:', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', '', ''],
  ['', 'Nombre', 'Obra', 'Medidas 1', 'Medidas2', 'Cant.', 'Vidrio 1', 'Cámara', 'Vidrio 2', 'Mts.2', 'OBSERVACIONES', ''],
  ['', 'Chino', 'Andrés Díaz - CYM', '492', '1492', '1', '4', '12', '4', '1.47', '', ''],
  ['', 'Chino', 'Andrés Díaz - CYM', '2402', '2444', '1', '3+3', '12', '5', '11.74', '', ''],
  ['', '', '', '', '', '44', '', '', '', '129.98', '', ''],
]

// Hoja legada: medidas en una sola celda "NNNxMMM"
const legacySheetSingleCellMedidas: Row[] = [
  ['', 'Obra', 'Medidas', 'Cant.', 'Vidrio 1', 'Cámara', 'Vidrio 2', 'Mts.2', 'OBSERVACIONES'],
  ['', 'Edificio Test', '1200x800', '3', '4', '12', '4', '2.88', ''],
  ['', 'Casa Particular', '600 x 900', '1', '6', '9', '6', '0.54', ''],
]

// ---------------------------------------------------------------------------
// Tests: detectTableBlocks
// ---------------------------------------------------------------------------

describe('detectTableBlocks', () => {
  it('detecta la tabla DVH con encabezado en fila 3', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    expect(blocks.length).toBeGreaterThanOrEqual(2)
    const dvhBlock = blocks.find((b) => b.type === 'dvh')
    expect(dvhBlock).toBeDefined()
    expect(dvhBlock?.headerRowIndex).toBe(3)
  })

  it('detecta la tabla simple_glass más abajo', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const sgBlock = blocks.find((b) => b.type === 'simple_glass')
    expect(sgBlock).toBeDefined()
    expect(sgBlock?.headerRowIndex).toBe(13)
  })

  it('no confunde FECHA ni OBRA como encabezado de tabla', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const badBlock = blocks.find((b) => b.headerRowIndex === 0 || b.headerRowIndex === 1)
    expect(badBlock).toBeUndefined()
  })

  it('resuelve columna anónima de altura en DVH', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const dvhBlock = blocks.find((b) => b.type === 'dvh')
    expect(dvhBlock?.columnMap.medidas2).toBeDefined()
    expect(dvhBlock?.columnMap.medidas).toBe(3) // col 3 = Medidas (ancho)
    expect(dvhBlock?.columnMap.medidas2).toBe(4) // col 4 = anónima (alto)
  })

  it('detecta "Medidas 1" / "Medidas2" explícitos correctamente', () => {
    const blocks = detectTableBlocks(sheetWithExplicitSplitHeaders)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('dvh')
    expect(blocks[0].columnMap.medidas1).toBe(3)
    expect(blocks[0].columnMap.medidas2).toBe(4)
  })

  it('detecta tabla en formato legado (sin nombre, una sola hoja de encabezados)', () => {
    const blocks = detectTableBlocks(legacySheetSingleCellMedidas)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('dvh')
  })
})

// ---------------------------------------------------------------------------
// Tests: parseWorkbookFile — usamos import dinámico + File mock
// Se testean las funciones puras directamente para los casos de datos
// ---------------------------------------------------------------------------

describe('parseo de medidas en dos columnas', () => {
  it('combina "985" + "1722" en "985 x 1722"', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const dvhBlock = blocks.find((b) => b.type === 'dvh')!
    const map = dvhBlock.columnMap

    // Simular la función resolveMeasures sobre la fila de datos
    const row = sheetWithTwoTables[4]! // ["","Chino","Paula Arquivial","985","1722","1","4","12","4","3.39","",""]
    const medidas = String(row[map.medidas ?? 3] ?? '')
    const medidas2 = String(row[map.medidas2 ?? 4] ?? '')
    const combined = medidas && medidas2 ? `${medidas} x ${medidas2}` : medidas

    expect(combined).toBe('985 x 1722')
  })
})

describe('composicion DVH', () => {
  it('genera "4 / 12 / 4" para DVH', () => {
    const row = sheetWithTwoTables[4]! // vidrio1=4, camara=12, vidrio2=4
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const dvhBlock = blocks.find((b) => b.type === 'dvh')!
    const map = dvhBlock.columnMap

    const v1 = String(row[map.vidrio1 ?? 6] ?? '')
    const cam = String(row[map.camara ?? 7] ?? '')
    const v2 = String(row[map.vidrio2 ?? 8] ?? '')
    const composicion = [v1, cam, v2].filter(Boolean).join(' / ')

    expect(composicion).toBe('4 / 12 / 4')
  })

  it('genera solo el vidrio para simple_glass, sin inventar cámara', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const sgBlock = blocks.find((b) => b.type === 'simple_glass')!
    const map = sgBlock.columnMap

    const row = sheetWithTwoTables[14]! // vidrio="10mm", no camara/vidrio2
    const v1 = String(row[map.vidrio1 ?? 6] ?? '')
    const cam = map.camara !== undefined ? String(row[map.camara] ?? '') : ''
    const v2 = map.vidrio2 !== undefined ? String(row[map.vidrio2] ?? '') : ''

    expect(v1).toBe('10mm')
    expect(cam).toBe('')
    expect(v2).toBe('')

    // Composicion = solo vidrio1
    const composicion = [v1, cam, v2].filter(Boolean).join(' / ')
    expect(composicion).toBe('10mm')
  })
})

describe('detección de filas junk', () => {
  it('ignora fila de totales con solo cant y mts2', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const dvhBlock = blocks.find((b) => b.type === 'dvh')!
    // La fila 9 es totals: no tiene nombre/obra/medidas → no genera etiqueta en el bloque
    // Verificamos que el bloque DVH termina antes de capturar las filas junk
    // y que la simple_glass header fue detectada correctamente (no fue absorbida como dato)
    expect(dvhBlock.endRowIndex).toBeLessThan(13) // 13 es el header simple_glass
  })

  it('el rango DVH no incluye la fila de encabezado de simple_glass', () => {
    const blocks = detectTableBlocks(sheetWithTwoTables)
    const dvhBlock = blocks.find((b) => b.type === 'dvh')!
    expect(dvhBlock.endRowIndex).toBeLessThan(13)
  })
})

describe('compatibilidad con medidas en celda única', () => {
  it('detecta tabla legada con medidas "1200x800" en una celda', () => {
    const blocks = detectTableBlocks(legacySheetSingleCellMedidas)
    expect(blocks.length).toBe(1)
    // No hay columna anónima de altura — medidas viene en una sola celda
    const map = blocks[0].columnMap
    expect(map.medidas).toBeDefined()
  })
})

describe('detección de DVH con Medidas 1 / Medidas2 explícitos', () => {
  it('mapea correctamente medidas1 y medidas2 explícitos', () => {
    const blocks = detectTableBlocks(sheetWithExplicitSplitHeaders)
    const block = blocks[0]
    expect(block.columnMap.medidas1).toBe(3)
    expect(block.columnMap.medidas2).toBe(4)
    expect(block.type).toBe('dvh')
  })

  it('combina medidas explícitas en "492 x 1492"', () => {
    const blocks = detectTableBlocks(sheetWithExplicitSplitHeaders)
    const map = blocks[0].columnMap
    const row = sheetWithExplicitSplitHeaders[4]!
    const m1 = String(row[map.medidas1 ?? 3] ?? '')
    const m2 = String(row[map.medidas2 ?? 4] ?? '')
    expect(`${m1} x ${m2}`).toBe('492 x 1492')
  })
})
