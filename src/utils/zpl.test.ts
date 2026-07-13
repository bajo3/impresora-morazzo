import { describe, it, expect } from 'vitest'
import { sanitizeZplText, buildZplForLabel, buildZplForLabels, getPrintQuantity } from './zpl'
import { DEFAULT_LABEL_SETTINGS, getLabelPresetById } from './labelSettings'
import { getDefaultCompanySettings } from './companySettings'
import { sampleLabel } from '../test/fixtures/sampleLabels'

describe('sanitizeZplText', () => {
  it('retorna guión para string vacío', () => {
    expect(sanitizeZplText('')).toBe('-')
  })

  it('retorna guión para null', () => {
    expect(sanitizeZplText(null)).toBe('-')
  })

  it('retorna guión para undefined', () => {
    expect(sanitizeZplText(undefined)).toBe('-')
  })

  it('retorna guión para string solo de espacios', () => {
    expect(sanitizeZplText('   ')).toBe('-')
  })

  it('elimina ^ que rompería el parser ZPL', () => {
    expect(sanitizeZplText('Obra^Test')).toBe('Obra Test')
  })

  it('elimina ~ que rompería el parser ZPL', () => {
    expect(sanitizeZplText('Test~ZPL')).toBe('Test ZPL')
  })

  it('elimina \\ que rompería el parser ZPL', () => {
    expect(sanitizeZplText('path\\value')).toBe('path value')
  })

  it('reemplaza \\n con espacio', () => {
    expect(sanitizeZplText('linea1\nlinea2')).toBe('linea1 linea2')
  })

  it('reemplaza \\r\\n con espacio', () => {
    expect(sanitizeZplText('linea1\r\nlinea2')).toBe('linea1 linea2')
  })

  it('normaliza múltiples espacios consecutivos', () => {
    expect(sanitizeZplText('texto  con   espacios')).toBe('texto con espacios')
  })

  it('preserva texto normal sin cambios', () => {
    expect(sanitizeZplText('Edificio Sur')).toBe('Edificio Sur')
    expect(sanitizeZplText('600 x 800')).toBe('600 x 800')
    expect(sanitizeZplText('4mm / 12mm / 4mm')).toBe('4mm / 12mm / 4mm')
  })

  it('hace trim del texto resultante', () => {
    expect(sanitizeZplText('  texto  ')).toBe('texto')
  })
})

describe('buildZplForLabel', () => {
  it('genera un bloque ZPL válido con ^XA y ^XZ', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS)
    expect(zpl).toContain('^XA')
    expect(zpl).toContain('^XZ')
  })

  it('no incluye ^BQ cuando showQR es false (default)', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS)
    expect(zpl).not.toContain('^BQN,2,')
  })

  it('no incluye ^BQ cuando showQR es false explícito', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS, false)
    expect(zpl).not.toContain('^BQN,2,')
  })

  it('incluye ^BQN,2, y ^FDQA, cuando showQR es true en preset standard', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS, true)
    expect(zpl).toContain('^BQN,2,')
    expect(zpl).toContain('^FDQA,')
  })

  it('incluye Facundo Morazzo cuando showCompanyName es true', () => {
    const zpl = buildZplForLabel(
      sampleLabel,
      DEFAULT_LABEL_SETTINGS,
      false,
      getDefaultCompanySettings(),
    )

    expect(zpl).toContain('Facundo Morazzo')
  })

  it('no incluye branding de empresa cuando showCompanyName es false', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS, false, {
      ...getDefaultCompanySettings(),
      showCompanyName: false,
    })

    expect(zpl).not.toContain('Facundo Morazzo')
    expect(zpl).toContain('ETIQUETA DE CORTE')
  })

  it('no incluye ^BQ en modo compact (80x50) aunque showQR sea true', () => {
    const compactSettings = {
      id: '80x50' as const,
      name: '80 x 50',
      widthMm: 80,
      heightMm: 50,
      dpi: 203,
      marginMm: 3,
    }
    const zpl = buildZplForLabel(sampleLabel, compactSettings, true)
    expect(zpl).not.toContain('^BQN,2,')
  })

  it('incluye el valor de obra en el ZPL', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS)
    expect(zpl).toContain('Edificio Test')
  })

  it('incluye el nombre como campo en el preset standard', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS)
    expect(zpl).toContain('NOMBRE')
    expect(zpl).toContain('Cliente Test')
  })

  it('incluye el nombre identificado en el preset compact', () => {
    const compactSettings = {
      id: '80x50' as const,
      name: '80 x 50',
      widthMm: 80,
      heightMm: 50,
      dpi: 203,
      marginMm: 3,
    }
    const zpl = buildZplForLabel(sampleLabel, compactSettings)
    expect(zpl).toContain('NOMBRE')
    expect(zpl).toContain('Cliente Test')
  })

  it('incluye las medidas en el ZPL', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS)
    expect(zpl).toContain('600 x 800')
  })

  it('configura ^PW con los dots correctos para 100x150 a 203 DPI', () => {
    const zpl = buildZplForLabel(sampleLabel, DEFAULT_LABEL_SETTINGS)
    // 100mm * 203/25.4 ≈ 799 dots
    expect(zpl).toMatch(/\^PW7[89]\d/)
  })

  it('usa el layout standard para el preset 100x100', () => {
    const settings = getLabelPresetById('100x100')
    const zpl = buildZplForLabel(sampleLabel, settings)
    // Mismo ancho que 100x150 (100mm ≈ 799 dots) y alto ≈ 799 dots (100mm)
    expect(zpl).toMatch(/\^PW7[89]\d/)
    expect(zpl).toMatch(/\^LL7[89]\d/)
    // Layout standard: incluye los campos completos, no el modo compact
    expect(zpl).toContain('COMPOSICION DVH')
    expect(zpl).toContain('Cliente Test')
  })

  it('incluye ^BQ cuando showQR es true en preset 100x100', () => {
    const zpl = buildZplForLabel(sampleLabel, getLabelPresetById('100x100'), true)
    expect(zpl).toContain('^BQN,2,')
    expect(zpl).toContain('^FDQA,')
  })
})

describe('buildZplForLabels', () => {
  it('calcula una etiqueta cuando el modo es single', () => {
    expect(getPrintQuantity({ ...sampleLabel, cantidad: '40' }, 'single')).toBe(1)
  })

  it('genera tantas etiquetas como indique cantidad', () => {
    const zpl = buildZplForLabels([{ ...sampleLabel, cantidad: '4' }], DEFAULT_LABEL_SETTINGS)

    expect(zpl.match(/\^XA/g) ?? []).toHaveLength(4)
    expect(zpl.match(/\^XZ/g) ?? []).toHaveLength(4)
  })

  it('genera una etiqueta por vidrio cuando el modo es single', () => {
    const zpl = buildZplForLabels(
      [{ ...sampleLabel, cantidad: '4' }],
      DEFAULT_LABEL_SETTINGS,
      false,
      undefined,
      'single',
    )

    expect(zpl.match(/\^XA/g) ?? []).toHaveLength(1)
    expect(zpl.match(/\^XZ/g) ?? []).toHaveLength(1)
  })

  it('usa una etiqueta cuando cantidad no es valida', () => {
    const zpl = buildZplForLabels([{ ...sampleLabel, cantidad: '' }], DEFAULT_LABEL_SETTINGS)

    expect(zpl.match(/\^XA/g) ?? []).toHaveLength(1)
    expect(zpl.match(/\^XZ/g) ?? []).toHaveLength(1)
  })
})
