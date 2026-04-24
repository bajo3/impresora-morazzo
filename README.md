# App de etiquetas DVH

Aplicacion web simple para empresas de doble vidriado hermetico. Permite subir un archivo Excel `.xlsx`, detectar automaticamente la fila real de encabezados, generar etiquetas de corte de vidrio en formato `100 x 150 mm`, previsualizarlas y generar ZPL para Zebra ZD220.

## Stack

- React
- Vite
- TypeScript
- SheetJS / `xlsx`
- CSS simple para preview
- ZPL para impresion Zebra

## Como instalar

```bash
npm install
```

## Como correr en desarrollo

```bash
npm run dev
```

## Como generar produccion

```bash
npm run build
```

El build queda en `dist/`.

## Formato esperado del Excel

La app detecta automaticamente la fila de encabezados aunque haya filas vacias arriba. Las columnas requeridas son:

- `Obra`
- `Medidas`
- `Cant.`
- `Vidrio 1`
- `Camara`
- `Vidrio 2`
- `Mts.2`
- `OBSERVACIONES`

Si falta alguna, se muestra un mensaje claro como `Falta la columna Medidas`.

## Flujo de uso

1. Subir un archivo `.xlsx`.
2. Revisar la vista previa de las etiquetas.
3. Seleccionar algunas si hace falta.
4. Usar Zebra Browser Print, descargar `.zpl` o copiar el ZPL generado.

## Impresion por ZPL

La impresion HTML/CSS desde navegador puede fallar con Zebra porque el driver interpreta mal orientacion, area util y posicionamiento fisico de la etiqueta. Por eso la salida confiable ahora es ZPL.

### Medida asumida

- Zebra ZD220
- 203 dpi
- ancho: `812 dots`
- alto: `1218 dots`

### Archivos clave

- [src/utils/zpl.ts](/C:/Users/felip/OneDrive/Escritorio/Feli%20Web/Nueva%20carpeta/src/utils/zpl.ts): genera el ZPL de cada etiqueta y del lote completo.
- [src/utils/zebraBrowserPrint.ts](/C:/Users/felip/OneDrive/Escritorio/Feli%20Web/Nueva%20carpeta/src/utils/zebraBrowserPrint.ts): deteccion de Browser Print y envio a impresora Zebra.

### Opciones disponibles

- `Imprimir seleccionadas con Zebra`
- `Imprimir todas con Zebra`
- `Descargar ZPL seleccionadas`
- `Descargar ZPL todas`
- `Copiar ZPL seleccionadas`
- `Copiar ZPL todas`

### Browser Print

Para imprimir directo desde la web con Zebra Browser Print:

1. Instala Zebra Browser Print para Windows desde la pagina oficial de Zebra:
   [Browser Print Support](https://www.zebra.com/us/en/support-downloads/software/printer-software/browser-print.html)
2. Descarga tambien la libreria JavaScript oficial de Browser Print.
3. Copia el archivo JS a esta ruta del proyecto:
   `public/vendor/zebra/BrowserPrint.min.js`
4. Asegurate de que Browser Print quede corriendo en la PC.
5. Asegurate de que la impresora Zebra este instalada en Windows.
6. Abri esta URL en la misma PC y acepta el certificado:
   [https://localhost:9101/ssl_support](https://localhost:9101/ssl_support)
7. Reinicia Chrome.
8. Abri la app y proba `Imprimir todas con Zebra` o `Imprimir seleccionadas con Zebra`.

La app carga la libreria desde:

- `/vendor/zebra/BrowserPrint.min.js`

Si Browser Print esta instalado en la misma PC, la libreria JavaScript esta copiada en esa ruta y el certificado fue aceptado:

1. Abrir la app en ese equipo.
2. Cargar el Excel.
3. Revisar la preview.
4. Hacer clic en `Imprimir todas con Zebra` o `Imprimir seleccionadas con Zebra`.

Errores esperados:

- `No se encontró la librería JavaScript de Zebra Browser Print en /vendor/zebra/BrowserPrint.min.js`
- `Zebra Browser Print está instalado como librería, pero el servicio local no está corriendo.`
- `No se encontró una impresora Zebra`
- `No hay etiquetas seleccionadas`

Importante:

- Desde una web online no se puede imprimir RAW por USB directamente sin Zebra Browser Print, QZ Tray u otro puente local.
- Si Browser Print no esta instalado o no esta corriendo, la app no imprime directo pero sigue permitiendo descargar el archivo `.zpl`.

### Descarga manual de ZPL

Si Browser Print no esta instalado:

1. Generar `Descargar ZPL todas` o `Descargar ZPL seleccionadas`.
2. Guardar el archivo `.zpl`.
3. Enviarlo manualmente a la Zebra desde la herramienta que usen en planta o desde un spooler compatible.

## Logica de cantidad

La app ya quedo preparada para soportar dos modos:

- una fila = una etiqueta
- repetir la misma etiqueta segun el valor de `Cant.`

Por defecto esta activo `una fila = una etiqueta`.

Punto de cambio:

- [src/lib/excelParser.ts](/C:/Users/felip/OneDrive/Escritorio/Feli%20Web/Nueva%20carpeta/src/lib/excelParser.ts)
- Constante: `DEFAULT_QUANTITY_MODE`
- Funcion: `resolveLabelsForQuantityMode`

## Estructura

- `src/App.tsx`: estado principal, mensajes, seleccion y acciones de ZPL.
- `src/components/`: UI simple y separada por responsabilidad.
- `src/lib/excelParser.ts`: parsing, deteccion de encabezados, validacion y armado de etiquetas.
- `src/utils/zpl.ts`: construccion de etiquetas ZPL.
- `src/utils/zebraBrowserPrint.ts`: integracion opcional con Zebra Browser Print.
- `src/types.ts`: tipos compartidos.

## Archivo de ejemplo

Hay un ejemplo listo en `public/examples/dvh-ejemplo.xlsx`.
