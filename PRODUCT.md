# GlassFlow — Especificación de Producto

## Descripción

App web para vidrierías que automatiza la generación de etiquetas de corte DVH (Doble Vidriado Hermético). El operario importa el Excel de pedidos, la app detecta los datos y genera etiquetas listas para imprimir en una Zebra.

## Usuarios objetivo

Operarios y supervisores de producción en vidrierías que trabajan con DVH (doble vidriado hermético). Sin conocimientos técnicos avanzados.

## Flujo principal

1. El usuario arrastra o selecciona un archivo Excel (.xlsx, .xls)
2. La app detecta automáticamente los encabezados (obra, medidas, vidrio1, cámara, vidrio2, mts², observaciones)
3. Si el Excel tiene múltiples hojas, el usuario puede elegir cuál usar
4. Se muestra una preview de todas las etiquetas con los datos del Excel
5. El usuario selecciona el preset de etiqueta (100×150 mm o 80×50 mm)
6. El usuario puede:
   - Imprimir todas las etiquetas directamente a la Zebra (BrowserPrint)
   - Imprimir solo las seleccionadas
   - Descargar el archivo .zpl
   - Copiar el ZPL al portapapeles

## Campos de etiqueta

| Campo | Fuente Excel | Notas |
|-------|-------------|-------|
| Obra | `obra` | Nombre del proyecto/cliente |
| Medidas | `medidas` o `medidas1` + `medidas2` | Dimensiones del vidrio |
| Cantidad | `cant` / `cantidad` | Cantidad de piezas |
| Composición DVH | `vidrio1` + `camara` + `vidrio2` | Ej: "4mm / 12mm / 4mm" |
| Mts² | `mts2` / `m2` / `mts` | Superficie en metros cuadrados |
| Observaciones | `observaciones` / `obs` | Notas adicionales |

## Presets de etiqueta

| Preset | Tamaño | DPI | Uso |
|--------|--------|-----|-----|
| 100×150 | 100×150 mm | 203 | Etiqueta estándar grande |
| 80×50 | 80×50 mm | 203 | Etiqueta compacta |

## Features pendientes (roadmap)

### Prioridad alta
- [ ] **QR code en etiqueta**: código QR con datos de la pieza para trazabilidad
- [ ] **Exportación PDF**: generar PDF con todas las etiquetas para imprimir desde cualquier impresora
- [ ] **Historial de impresión**: localStorage/IndexedDB para recordar los últimos archivos procesados y reimprimir

### Prioridad media
- [ ] **Mapeo manual de columnas**: UI para mapear columnas cuando los encabezados no coinciden con los aliases esperados
- [ ] **Modo repetir por cantidad**: expandir filas según el campo `cantidad` (ya existe `resolveLabelsForQuantityMode` en `excelParser.ts`)
- [ ] **Logo en etiqueta**: logo de la vidrería en el encabezado del ZPL
- [ ] **Nuevo preset de etiqueta**: soporte para agregar presets custom desde la UI

### Prioridad baja
- [ ] **Barcode lineal**: código de barras (Code128) como alternativa al QR
- [ ] **Modo offline**: PWA para funcionar sin internet

## Restricciones técnicas

- Todo corre en el navegador (sin servidor)
- Zebra BrowserPrint requiere la app Zebra Desktop instalada en la PC del usuario
- Los archivos Excel no se suben a ningún servidor
- El ZPL generado es para impresoras Zebra con firmware ZPL II
