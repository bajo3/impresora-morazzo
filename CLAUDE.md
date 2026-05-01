# GlassFlow — Guía para Claude

## Proyecto

App web para vidrierías que importa Excel con datos de corte DVH, genera etiquetas y las envía a impresoras Zebra vía ZPL o las exporta como PDF.

Stack: React 19, TypeScript, Vite, xlsx (sin backend — todo corre en el navegador).

## Comandos

```bash
npm run dev       # servidor de desarrollo (localhost:5173)
npm run build     # compilar para producción
npm run lint      # ESLint
npm run test      # vitest (cuando esté configurado)
npm run typecheck # tsc --noEmit
```

## Arquitectura

```
src/
  App.tsx                  # estado global, orquesta todo
  types.ts                 # interfaces compartidas (LabelModel, LabelSettings, etc.)
  lib/
    excelParser.ts         # parseo de Excel → LabelModel[]
  utils/
    labelSettings.ts       # presets de etiqueta (100x150, 80x50)
    zpl.ts                 # generación de ZPL (buildZplForLabel / buildZplForLabels)
    zebraBrowserPrint.ts   # envío a impresora Zebra vía BrowserPrint
  components/
    UploadPanel.tsx        # drag & drop de archivo Excel
    SheetSelector.tsx      # selector de hoja del workbook
    LabelPresetSelector.tsx # selector de preset de etiqueta
    LabelPreviewList.tsx   # lista de previews de etiquetas
    LabelCard.tsx          # tarjeta individual de etiqueta
    Toolbar.tsx            # acciones: imprimir, descargar ZPL, copiar ZPL
    EmptyState.tsx         # estado vacío cuando no hay etiquetas
    ErrorMessage.tsx       # mensaje de error
public/
  vendor/zebra/            # BrowserPrint SDK (Zebra, no modificar)
```

## Tipos clave

- `LabelModel` — una fila del Excel, con `id`, `composicionDVH`, `selected`
- `LabelSettings` — preset de etiqueta: `id`, `widthMm`, `heightMm`, `dpi`, `marginMm`
- `PrintScope` — `'all'` | `'selected'`
- `LabelPresetId` — `'100x150'` | `'80x50'`

## Reglas de trabajo

- No hay backend ni base de datos. Todo es estado React + archivos del usuario.
- El Excel se procesa en el navegador (FileReader / ArrayBuffer).
- La detección de encabezados es automática (busca en las primeras 25 filas).
- ZPL: el layout para 100x150 escala desde `BASE_LAYOUT` en `zpl.ts`. El layout compacto 80x50 tiene lógica separada.
- `sanitizeZplText` elimina `^`, `~`, `\` y newlines — siempre usarla al insertar texto en ZPL.
- Zebra BrowserPrint requiere la app Zebra instalada localmente; no funciona en producción remota sin configuración adicional.

## Skills disponibles

Ver `.claude/skills/` para guías específicas por dominio:
- `excel-import-mapping.md` — parseo y mapeo de columnas Excel
- `zebra-zpl-printing.md` — generación ZPL e integración Zebra
- `frontend-react-ui.md` — componentes React, CSS, UX
- `pdf-export.md` — exportación PDF (feature pendiente)
- `qr-barcode-labels.md` — QR y códigos de barra en etiquetas
- `local-storage-indexeddb.md` — historial y persistencia local
- `testing-quality.md` — tests con Vitest

## Convenciones

- Idioma de UI: español argentino
- Errores al usuario: mensajes descriptivos en español, sin stack traces
- No usar `any` en TypeScript
- Imports con `import type` para tipos puros
- Sin comentarios obvios; solo si hay un comportamiento no evidente
