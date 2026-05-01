# PLANS — Planes de implementación

## Plan activo: Setup inicial de skills y documentación

**Estado:** completado  
**Objetivo:** dejar el entorno listo para trabajar con Claude en este proyecto.

---

## Plan pendiente: QR en etiquetas

**Dependencia:** `qrcode` (npm install qrcode @types/qrcode)

**Archivos a crear/modificar:**
- `src/utils/qrGenerator.ts` — genera QR como base64 o SVG desde `LabelModel`
- `src/utils/zpl.ts` — agregar campo QR en `buildZplForLabel` (comando `^BQ`)
- `src/components/LabelCard.tsx` — mostrar QR en preview

**Datos para el QR:**
```
OBRA: {obra}
MEDIDAS: {medidas}
DVH: {composicionDVH}
CANT: {cantidad}
MTS2: {mts2}
```

**Criterio de done:**
- QR visible en la preview del LabelCard
- QR incluido en el ZPL (verificar en Labelary)
- Sin errores de TypeScript

---

## Plan pendiente: Exportación PDF

**Dependencia:** `jspdf` o `pdf-lib`

**Archivos a crear/modificar:**
- `src/utils/pdfExport.ts` — genera PDF con canvas o SVG por etiqueta
- `src/App.tsx` — agregar handlers `downloadPdf('all')` y `downloadPdf('selected')`
- `src/components/Toolbar.tsx` — agregar botón "Descargar PDF"

**Consideraciones:**
- jsPDF es más simple para texto; pdf-lib es más potente para layouts exactos
- El PDF debe respetar las mismas dimensiones que el preset seleccionado
- Una etiqueta por página o varias por página (configurable)

**Criterio de done:**
- PDF descargable con todas/seleccionadas las etiquetas
- Dimensiones correctas (100×150 o 80×50 mm)
- Sin errores de TypeScript

---

## Plan pendiente: Historial de impresión

**Dependencia:** ninguna (usar IndexedDB nativo o localStorage)

**Archivos a crear/modificar:**
- `src/lib/printHistory.ts` — CRUD de historial en IndexedDB
- `src/components/PrintHistoryPanel.tsx` — lista de impresiones pasadas
- `src/App.tsx` — guardar entrada en historial al imprimir

**Estructura de registro:**
```ts
interface PrintHistoryEntry {
  id: string
  timestamp: number
  fileName: string
  sheetName: string
  labelCount: number
  presetId: LabelPresetId
  labels: LabelModel[]
}
```

**Criterio de done:**
- Al imprimir, se guarda el registro automáticamente
- Panel lateral o modal con historial de últimas N impresiones
- Botón "Reimprimir" que carga los labels del historial y los envía a Zebra

---

## Plan pendiente: Mapeo manual de columnas

**Cuándo:** cuando un cliente usa nombres de columna que no coinciden con los aliases actuales.

**Archivos a crear/modificar:**
- `src/components/ColumnMapperModal.tsx` — UI para mapear columna Excel → campo de etiqueta
- `src/lib/excelParser.ts` — aceptar un `customHeaderMap` externo

**Criterio de done:**
- Si la detección falla, se abre el mapper modal
- El usuario puede asignar manualmente cada campo
- El parser usa el mapa personalizado para generar los LabelModel
