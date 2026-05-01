# Skill: zebra-zpl-printing

## Cuándo usar
Cuando se trabaja con: generación de ZPL, layout de etiquetas, presets de tamaño, envío a impresora Zebra via BrowserPrint, conversión mm→dots, sanitización de texto para ZPL.

## Archivos relevantes
- `src/utils/zpl.ts` — generación de ZPL completa
- `src/utils/labelSettings.ts` — presets de etiqueta (`LabelSettings`, `LABEL_PRESETS`)
- `src/utils/zebraBrowserPrint.ts` — envío a Zebra via BrowserPrint SDK
- `src/types.ts` — `LabelSettings`, `LabelPresetId`
- `public/vendor/zebra/` — SDK BrowserPrint (no modificar)

## Conceptos ZPL clave

```
^XA                        inicio de etiqueta
^XZ                        fin de etiqueta
^CI28                      encoding UTF-8
^PW{dots}                  ancho de etiqueta en dots
^LL{dots}                  largo de etiqueta en dots
^LH0,0                     origen (home position)
^FO{x},{y}                 posición del elemento (Field Origin)
^A0N,{h},{w}               fuente vectorial (altura, ancho)
^FD{texto}^FS              campo de texto (Field Data / Field Separator)
^FB{w},{lines},8,L,0       field block: ancho, líneas, espacio, alineación
^GB{w},{h},{thickness}^FS  caja/línea (Graphic Box)
^BQ,2,{scale}              QR code (nivel 2, escala)
```

## Conversión mm → dots

```ts
function mmToDots(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm * dpi) / 25.4))
}
```

Para 203 DPI: 1mm ≈ 8 dots. Para 300 DPI: 1mm ≈ 11.8 dots.

## Arquitectura del layout

### Modo standard (100×150 y similares)
- Escala a partir de `BASE_LAYOUT` (812×1218 dots de referencia)
- `scaleX`, `scaleY`, `fontScale` calculados desde las dimensiones del preset
- 6 campos: OBRA, MEDIDAS, CANTIDAD, COMPOSICIÓN DVH, MTS.2, OBSERVACIONES
- Separadores horizontales entre campos

### Modo compact (80×50)
- Layout separado con posiciones hardcodeadas
- Trunca texto largo con `...`
- Campos: OBRA + CANT, MEDIDAS, DVH + M2, OBS

## Agregar un nuevo preset de etiqueta

1. Agregar entrada a `LABEL_PRESETS` en `labelSettings.ts`
2. Agregar el ID a `LabelPresetId` en `types.ts`
3. En `getZplLayout` de `zpl.ts`: si el preset necesita layout especial, agregar una rama; si escala igual que standard, no hace falta cambio
4. Actualizar `LabelPresetSelector` para mostrar el nuevo preset

## Sanitización de texto ZPL — OBLIGATORIO

```ts
export function sanitizeZplText(value: string | null | undefined): string {
  // elimina ^ ~ \ y newlines que romperían el ZPL
  // retorna '-' si el valor está vacío
}
```

**Siempre** llamar a `sanitizeZplText` antes de insertar cualquier valor en ZPL. Los caracteres `^`, `~` y `\` son delimitadores ZPL y rompen el formato.

## Agregar QR al ZPL

```zpl
^FO{x},{y}
^BQN,2,{scale}
^FDQA,{datos}^FS
```

- `{datos}` debe estar sanitizado
- El modo `N` es normal; `2` es nivel de corrección Q; `{scale}` es el tamaño del módulo (1-10)
- Para incluirlo como imagen PNG primero (vía `qrcode` npm), usar el comando `^GFA` con datos binarios

## BrowserPrint (envío a Zebra)

```ts
// src/utils/zebraBrowserPrint.ts
export async function sendZplToZebra(zpl: string): Promise<void>
```

- Requiere la app **Zebra Browser Print** instalada en la PC del usuario
- Escucha en `localhost:9101` (HTTP) o `localhost:9102` (HTTPS)
- Si falla la conexión, lanza `Error` con mensaje descriptivo
- No funciona en producción sin configuración de la app Zebra

## Verificar ZPL generado

Herramienta online: **Labelary Viewer** — `labelary.com/viewer.html`
- Pegar el ZPL completo (un `^XA...^XZ`)
- Seleccionar DPI y tamaño
- Ver preview antes de enviar a la impresora real

## Comandos de validación

```bash
npm run build   # sin errores TypeScript
npm run lint    # sin warnings
```

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Texto cortado en etiqueta | Caracteres especiales no sanitizados | Usar `sanitizeZplText` |
| Texto fuera del área | Font scale demasiado grande | Bajar `h` y `w` en la fuente |
| Error "No device found" | BrowserPrint no está corriendo | El usuario debe abrir la app Zebra |
| Etiqueta en blanco | `^PW` o `^LL` incorrecto | Verificar mmToDots con el DPI correcto |
| Overflow de texto | `maxLines` muy bajo | Ajustar `maxLines` en el layout o truncar el texto |

## Criterio de "done"

- [ ] ZPL generado se ve correcto en Labelary para los presets existentes (100×150 y 80×50)
- [ ] `sanitizeZplText` aplicado a todos los campos de texto
- [ ] `buildZplForLabel` y `buildZplForLabels` exportan correctamente
- [ ] Sin errores de TypeScript
- [ ] El flujo de impresión desde la UI sigue funcionando
