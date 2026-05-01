# Skill: pdf-export

## Cuándo usar
Cuando se implementa la exportación de etiquetas a PDF para imprimir desde cualquier impresora (no solo Zebra).

## Estado actual
**No implementado.** Feature pendiente — ver `PLANS.md`.

## Dependencia recomendada

```bash
npm install jspdf
npm install --save-dev @types/jspdf  # si no incluye tipos
```

**Alternativa:** `pdf-lib` si se necesita más control sobre el layout (embeber imágenes, fonts custom).

## Archivos a crear

- `src/utils/pdfExport.ts` — función principal de generación
- `src/App.tsx` — agregar handlers `downloadPdf('all')` y `downloadPdf('selected')`
- `src/components/Toolbar.tsx` — agregar botones PDF

## API básica con jsPDF

```ts
import jsPDF from 'jspdf'

export function generateLabelsPdf(labels: LabelModel[], settings: LabelSettings): Blob {
  const doc = new jsPDF({
    orientation: settings.widthMm > settings.heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [settings.widthMm, settings.heightMm],
  })

  labels.forEach((label, index) => {
    if (index > 0) doc.addPage()
    renderLabelPage(doc, label, settings)
  })

  return doc.output('blob')
}
```

## Consideraciones de layout

- Una etiqueta por página (las dimensiones de página = dimensiones del preset)
- Respetar el mismo orden de campos que la etiqueta ZPL: OBRA, MEDIDAS, CANTIDAD, DVH, MTS², OBS
- Fuente: Helvetica o sans-serif embebida en jsPDF
- Si se agrega QR: generarlo como base64 PNG con `qrcode` y embeber con `doc.addImage`

## Integración con el flujo existente

```ts
// En App.tsx, análogo a downloadZpl:
const downloadPdf = (scope: PrintScope) => {
  const scopedLabels = resolveLabelsForScope(scope)
  if (!scopedLabels) return

  const blob = generateLabelsPdf(scopedLabels, labelSettings)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `etiquetas-dvh-${labelSettings.widthMm}x${labelSettings.heightMm}.pdf`
  link.click()
  URL.revokeObjectURL(url)
  showSuccessMessage('PDF generado correctamente')
}
```

## Errores comunes esperados

| Error | Causa | Solución |
|-------|-------|----------|
| Texto cortado | jsPDF no hace word-wrap automático | Usar `doc.splitTextToSize` |
| Fuentes con tildes rotas | Encoding de jsPDF | Usar `doc.addFont` con una fuente UTF-8 |
| QR no renderiza | `addImage` necesita base64 con prefijo | Usar `"data:image/png;base64,{datos}"` |
| Tamaño de página incorrecto | `format` en mm | Verificar que el preset esté en mm |

## Criterio de "done"

- [ ] PDF descargable desde el botón en Toolbar
- [ ] Una etiqueta por página con las dimensiones del preset
- [ ] Todos los campos de `LabelModel` presentes en el PDF
- [ ] Sin errores de TypeScript
- [ ] El flujo principal (ZPL/Zebra) no se rompe
- [ ] Probado con preset 100×150 y 80×50
