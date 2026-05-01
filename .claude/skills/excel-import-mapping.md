# Skill: excel-import-mapping

## Cuándo usar
Cuando se trabaja con: parseo de archivos Excel, detección de encabezados, mapeo de columnas, normalización de filas, manejo de formatos de celda, múltiples hojas.

## Archivos relevantes
- `src/lib/excelParser.ts` — toda la lógica de parseo
- `src/types.ts` — `RawLabelRow`, `LabelModel`, `ParseWorkbookSuccess`
- `package.json` — dependencia `xlsx` (SheetJS)

## Arquitectura del parser

```
parseWorkbookFile(file, sheetName?)
  → detectHeaderRow(rows)       ← busca la fila con más coincidencias (mín. 3)
  → buildHeaderMap(headerRow)   ← mapea ColumnKey → índice de columna
  → getMissingColumns(headerMap)← valida que estén las columnas obligatorias
  → normalizeDataRows(rows, map)← convierte cada fila en RawLabelRow
  → createBaseLabels(rows)      ← agrega id, composicionDVH, selected
  → resolveLabelsForQuantityMode← expande por cantidad (actualmente desactivado)
```

## Aliases de columnas aceptados

| Campo | Aliases normalizados |
|-------|---------------------|
| obra | `obra` |
| medidas | `medidas`, `medida` |
| medidas1 | `medidas1`, `medida1` |
| medidas2 | `medidas2`, `medida2` |
| cantidad | `cant`, `cantidad` |
| vidrio1 | `vidrio1`, `vidrio` |
| camara | `camara`, `camaradeaire` |
| vidrio2 | `vidrio2` |
| mts2 | `mts2`, `m2`, `mts` |
| observaciones | `observaciones`, `observacion`, `obs` |

La normalización elimina tildes, espacios y caracteres no alfanuméricos antes de comparar.

## Reglas técnicas

1. **`normalizeHeaderName`** — siempre usar para comparar encabezados: convierte a lowercase, elimina tildes y caracteres especiales.
2. **`toCellText`** — siempre usar para convertir valores de celda: maneja null/undefined, números enteros vs decimales.
3. **Detección automática** — busca en las primeras 25 filas; la fila con más coincidencias (mín. 3) es el encabezado.
4. **Medidas**: acepta formato legacy (`medidas`) o split (`medidas1` + `medidas2`). Si hay split, los combina como `"{medidas1} x {medidas2}"`.
5. **Filas vacías** — `isRowCompletelyEmpty` las descarta sin lanzar error; se reporta la cantidad como warning.
6. **Modo de cantidad** — por defecto `'single-per-row'` (una etiqueta por fila). Para activar `'repeat-by-quantity'`, cambiar `DEFAULT_QUANTITY_MODE` en `excelParser.ts`.

## Agregar un nuevo alias de columna

```ts
// En EXPECTED_COLUMNS, agregar el alias al array correspondiente:
const EXPECTED_COLUMNS = {
  obra: ['obra', 'proyecto'],  // ← agregar 'proyecto'
  // ...
}
```

## Agregar una nueva columna al modelo

1. Agregar al objeto `EXPECTED_COLUMNS` con sus aliases
2. Agregar la key a `BASE_REQUIRED_COLUMN_KEYS` si es obligatoria
3. Agregar el campo a `RawLabelRow` en `types.ts`
4. Leer el valor en `normalizeDataRows` con `readCellByColumn`
5. Actualizar `getMissingColumns` con el label en español

## Comandos de validación

```bash
npm run build          # debe compilar sin errores
npm run lint           # sin warnings de ESLint
```

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "No se pudieron detectar los encabezados" | El Excel tiene menos de 3 columnas reconocidas | Revisar aliases en `EXPECTED_COLUMNS` |
| "Falta la columna X" | Columna obligatoria no encontrada | Agregar el alias que usa el cliente |
| "No se encontraron registros válidos" | Todas las filas son vacías o el header está mal detectado | Revisar `detectHeaderRow` y `isValidDataRow` |
| Números con decimales incorrectos | `raw: false` en SheetJS convierte todo a string | Ajustar `toCellText` para el tipo de dato |

## Criterio de "done"

- [ ] `parseWorkbookFile` retorna `LabelModel[]` correctos para el Excel del cliente
- [ ] Filas vacías ignoradas con warning
- [ ] Errores descriptivos en español si faltan columnas
- [ ] Sin errores de TypeScript (`npm run build`)
- [ ] El cambio no rompe el preset existente de columnas
