# Skill: testing-quality

## Cuándo usar
Cuando se escribe tests unitarios o de integración, se verifica comportamiento del parser Excel, del generador ZPL, o se agrega coverage a funciones utilitarias.

## Estado actual
**Sin tests configurados.** Vitest instalado como dev dependency.

## Setup de Vitest

Agregar a `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Crear `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Instalar dependencias:
```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

Agregar scripts a `package.json`:
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

## Qué testear primero

### Alta prioridad (lógica pura, sin DOM)

1. **`excelParser.ts`** — normalizeHeaderName, detectHeaderRow, buildHeaderMap, getMissingColumns, resolveMeasures
2. **`zpl.ts`** — sanitizeZplText, mmToDots, buildZplForLabel con fixtures de LabelModel
3. **`labelSettings.ts`** — getLabelPresetById

### Media prioridad (con mocks)

4. **`parseWorkbookFile`** — mockear XLSX.read con datos de prueba
5. **`zebraBrowserPrint.ts`** — mockear fetch, verificar payload enviado

### Baja prioridad (integración UI)

6. Componentes con React Testing Library (solo si hay lógica compleja, no para renderizado puro)

## Estructura de carpetas

```
src/
  test/
    setup.ts
    fixtures/
      sampleLabels.ts    ← LabelModel[] de prueba
      sampleSettings.ts  ← LabelSettings de prueba
  lib/
    excelParser.test.ts
  utils/
    zpl.test.ts
    labelSettings.test.ts
```

## Ejemplos de tests

### sanitizeZplText
```ts
import { describe, it, expect } from 'vitest'
import { sanitizeZplText } from '../utils/zpl'

describe('sanitizeZplText', () => {
  it('elimina caracteres ZPL especiales', () => {
    expect(sanitizeZplText('Obra^Test')).toBe('Obra Test')
    expect(sanitizeZplText('Test~ZPL')).toBe('Test ZPL')
  })

  it('retorna guión para valores vacíos', () => {
    expect(sanitizeZplText('')).toBe('-')
    expect(sanitizeZplText(null)).toBe('-')
    expect(sanitizeZplText(undefined)).toBe('-')
  })

  it('normaliza whitespace múltiple', () => {
    expect(sanitizeZplText('texto  con   espacios')).toBe('texto con espacios')
  })
})
```

### normalizeHeaderName
```ts
import { describe, it, expect } from 'vitest'
// Si la función no está exportada, exportarla o crear un test del parser completo

describe('normalizeHeaderName', () => {
  it('elimina tildes y pasa a lowercase', () => {
    // 'Observación' → 'observacion'
    // 'Cámara de Aire' → 'camaradeaire'
  })
})
```

### detectHeaderRow
```ts
describe('detectHeaderRow', () => {
  it('detecta la fila correcta cuando hay filas de título arriba', () => {
    const rows = [
      ['Empresa DVH S.A.'],   // título
      [],                      // vacía
      ['Obra', 'Medidas', 'Cant.', 'Vidrio1', 'Cámara', 'Vidrio2', 'Mts2', 'Obs'],  // header
      ['Edificio Sur', '600x800', '5', '4mm', '12mm', '4mm', '0.48', ''],
    ]
    // Debe retornar índice 2
  })
})
```

## Fixtures de prueba

```ts
// src/test/fixtures/sampleLabels.ts
import type { LabelModel } from '../../types'

export const sampleLabel: LabelModel = {
  id: 'test-1',
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
```

## Comandos

```bash
npm run test              # correr tests en watch mode
npm run test:ui           # UI interactiva de Vitest
npm run test:coverage     # coverage report
npm run build             # siempre verificar que el build pasa
```

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `ReferenceError: document is not defined` | Test de componente sin jsdom | Verificar `environment: 'jsdom'` en vite.config.ts |
| Mock de XLSX no funciona | XLSX usa dynamic import | Usar `vi.mock('xlsx')` con factory |
| `Cannot find module '@testing-library/jest-dom'` | Falta instalar | `npm install --save-dev @testing-library/jest-dom` |
| Test pasa localmente pero falla en CI | Diferencias de locale/timezone | Fijar locale en setup.ts si aplica |

## Criterio de "done"

- [ ] `npm run test` corre sin errores
- [ ] `sanitizeZplText` tiene 100% coverage de ramas
- [ ] `detectHeaderRow` testea el caso de header en fila no-cero
- [ ] `getMissingColumns` testea los casos de columnas faltantes
- [ ] `npm run build` sigue pasando después de agregar tests
