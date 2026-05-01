# UI_RULES — Reglas de interfaz para GlassFlow

## Principios generales

- La UI es para operarios de producción, no para desarrolladores: simple, directa, sin jerga técnica.
- Todo el texto visible al usuario va en **español argentino** (vos, hacé, subí, elegí).
- Los errores deben ser descriptivos y accionables: decir qué pasó y cómo resolverlo.
- Sin modales innecesarios. Las acciones destructivas o irreversibles sí las piden confirmación.

## Estructura de layout

```
app-shell
  hero-panel (no-print)    ← logo/título + UploadPanel
  status-panel (no-print)  ← mensajes de error/éxito/warning
  workspace                ← SheetSelector + LabelPresetSelector + Toolbar + LabelPreviewList
```

- La clase `no-print` oculta el elemento al imprimir por CSS.
- `data-print-scope` en `app-shell` controla qué se imprime (para posible print CSS en el futuro).

## Componentes

### UploadPanel
- Soporta drag & drop y click para seleccionar archivo
- Acepta `.xlsx` y `.xls`
- Muestra el nombre del archivo actual
- Estado de carga con feedback visual (isProcessing)

### SheetSelector
- Solo se muestra si el workbook tiene más de una hoja
- Selector de tipo `<select>`, no tabs ni botones
- Deshabilitado mientras `isProcessing`

### LabelPresetSelector
- Muestra los presets disponibles como opciones
- El preset seleccionado afecta el ZPL generado y el tamaño de la preview

### Toolbar
- Botones de acción agrupados: Selección | Zebra | Descargar | Copiar
- Los botones de "seleccionadas" se deshabilitan si no hay ninguna seleccionada
- `settingsSummary` muestra el preset activo como texto informativo

### LabelCard
- Checkbox de selección visible
- Preview que respeta las dimensiones del preset (`--label-width-mm`, `--label-height-mm`)
- Los campos vacíos se muestran como `-` (no se ocultan)

### ErrorMessage / EmptyState
- ErrorMessage: fondo rojo claro, ícono de error, texto descriptivo
- EmptyState: estado cuando no hay etiquetas cargadas, invita a subir un Excel

## CSS y variables

Variables CSS definidas por JavaScript en `App.tsx`:
```css
--label-width-mm   /* ancho del preset activo */
--label-height-mm  /* alto del preset activo */
--label-height-ratio /* relación alto/ancho para mantener proporción */
```

Clases de mensaje:
```css
.message-card--success  /* verde */
.message-card--warning  /* amarillo/naranja */
```

## Mensajes al usuario

| Situación | Tipo | Texto |
|-----------|------|-------|
| Hoja cargada OK | success | `Hoja "{nombre}" cargada correctamente.` |
| Múltiples hojas | warning | `El archivo tiene N hojas. Podes cambiar la hoja desde el selector.` |
| Filas vacías ignoradas | warning | `Se detectaron filas vacías y fueron ignoradas.` |
| Sin etiquetas seleccionadas | error | `No hay etiquetas seleccionadas` |
| Error al copiar ZPL | error | `No se pudo copiar el ZPL al portapapeles.` |
| Error Zebra | error | mensaje del Error de BrowserPrint |

## Reglas de accesibilidad mínima

- Todo botón tiene texto visible o `aria-label`
- `aria-live="polite"` en la lista de mensajes
- Los inputs de archivo tienen label asociado
- No usar color como único indicador de estado

## Errores comunes a evitar

- No mostrar stack traces al usuario
- No usar `alert()` o `confirm()` del navegador
- No ocultar estados de carga (siempre dar feedback)
- No deshabilitar el scroll en la lista de etiquetas
