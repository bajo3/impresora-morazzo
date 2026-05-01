# AGENTS — Coordinación de agentes en GlassFlow

## Cuándo usar agentes especializados

### Explore
Usar para búsquedas amplias: encontrar dónde está definido un tipo, qué componentes usan cierta prop, listar todos los archivos de un patrón.

### Plan
Usar antes de cambios grandes: agregar QR a etiquetas, nuevo preset de etiqueta, sistema de historial. Siempre planificar antes de implementar.

### general-purpose
Usar para: instalar dependencias, correr builds, investigar APIs externas (Zebra BrowserPrint, jsPDF).

## Contexto que todo agente debe conocer

- No hay backend. Todo es cliente React + localStorage/IndexedDB para persistencia.
- El flujo principal es: Excel → parseWorkbookFile → LabelModel[] → buildZplForLabel → Zebra/PDF/ZPL file.
- Los cambios al ZPL layout deben verificarse en una impresora real o en Labelary (labelary.com/viewer.html).
- El estado principal vive en `App.tsx`. No crear estado global adicional (Context, Redux) sin discutirlo.

## División de responsabilidades por dominio

| Dominio | Archivos clave | Skill |
|---------|---------------|-------|
| Parseo Excel | `src/lib/excelParser.ts` | `excel-import-mapping.md` |
| Generación ZPL | `src/utils/zpl.ts`, `src/utils/labelSettings.ts` | `zebra-zpl-printing.md` |
| UI React | `src/components/*`, `src/App.tsx`, `src/App.css` | `frontend-react-ui.md` |
| PDF export | (pendiente) | `pdf-export.md` |
| QR / barcode | (pendiente) | `qr-barcode-labels.md` |
| Historial/persistencia | (pendiente) | `local-storage-indexeddb.md` |
| Testing | (pendiente) | `testing-quality.md` |

## Reglas para todos los agentes

1. Verificar TypeScript: `npm run build` o `tsc --noEmit` antes de reportar el trabajo como listo.
2. No romper el flujo principal: cargar Excel → ver etiquetas → imprimir/descargar ZPL.
3. No agregar dependencias pesadas sin justificación explícita.
4. Mensajes de error al usuario: siempre en español, descriptivos, sin stack trace.
5. No crear archivos de backup, tipos duplicados, ni exports innecesarios.
