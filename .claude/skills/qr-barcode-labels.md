# Skill: qr-barcode-labels

## Cuándo usar
Cuando se agrega QR o código de barras a las etiquetas: tanto en la preview visual como en el ZPL para la Zebra.

## Estado actual
**No implementado.** Feature pendiente — ver `PLANS.md`.

## Dependencia recomendada

```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

## Datos del QR

El QR debe contener los datos clave de la pieza en texto plano:

```
OBRA: {label.obra}
MEDIDAS: {label.medidas}
DVH: {label.composicionDVH}
CANT: {label.cantidad}
MTS2: {label.mts2}
```

## Archivos a crear/modificar

- `src/utils/qrGenerator.ts` — genera QR como string base64 PNG
- `src/utils/zpl.ts` — integrar QR en `buildZplForLabel` (comando `^BQ`)
- `src/components/LabelCard.tsx` — mostrar QR en la preview visual

## Generar QR como base64 (para preview y PDF)

```ts
import QRCode from 'qrcode'

export async function generateQRBase64(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 150,
  })
}

export function buildQRData(label: LabelModel): string {
  return [
    `OBRA: ${label.obra}`,
    `MEDIDAS: ${label.medidas}`,
    `DVH: ${label.composicionDVH}`,
    `CANT: ${label.cantidad}`,
    `MTS2: ${label.mts2}`,
  ].join('\n')
}
```

## QR en ZPL (para Zebra)

El comando ZPL `^BQ` genera QR nativo en la impresora (no necesita imagen):

```zpl
^FO{x},{y}
^BQN,2,{scale}
^FDQA,{datos}^FS
```

- `N` = normal orientation
- `2` = nivel de corrección Q (Medium)
- `{scale}` = 3 a 6 para etiquetas estándar
- `{datos}` debe estar sanitizado con `sanitizeZplText` (sin `^`, `~`, `\`)
- El prefijo `QA,` es parte del protocolo del comando `^BQ`

Ejemplo para etiqueta 100×150:
```zpl
^FO600,900
^BQN,2,4
^FDQA,OBRA: Edificio Sur\nMEDIDAS: 600x800^FS
```

## QR en la preview visual (LabelCard)

Opción A — `<img>` con base64:
```tsx
const [qrSrc, setQrSrc] = useState('')
useEffect(() => {
  generateQRBase64(buildQRData(label)).then(setQrSrc)
}, [label])
// <img src={qrSrc} alt="QR" width={80} height={80} />
```

Opción B — `<canvas>` con QRCode.toCanvas (sin estado async):
```tsx
const canvasRef = useRef<HTMLCanvasElement>(null)
useEffect(() => {
  if (canvasRef.current) {
    QRCode.toCanvas(canvasRef.current, buildQRData(label), { width: 80 })
  }
}, [label])
// <canvas ref={canvasRef} />
```

## Código de barras lineal (Code128) — alternativa

Librería: `jsbarcode`
```bash
npm install jsbarcode
npm install --save-dev @types/jsbarcode
```

Para incrustar en ZPL, usar el comando `^BC` (Code128):
```zpl
^FO{x},{y}^BCN,50,Y,N,N
^FD{datos}^FS
```

## Errores comunes esperados

| Error | Causa | Solución |
|-------|-------|----------|
| QR no aparece en Zebra | Datos contienen caracteres ZPL especiales | Aplicar `sanitizeZplText` a los datos del QR |
| QR muy pequeño/grande | `scale` incorrecto en `^BQ` | Ajustar el parámetro de escala (3-6 para 203 DPI) |
| Preview asíncrona lenta | `generateQRBase64` por cada render | Cachear el resultado o usar `useMemo` |
| QR no escaneable | Datos muy largos | Limitar el contenido del QR a los campos esenciales |

## Criterio de "done"

- [ ] QR visible en la preview de LabelCard
- [ ] QR incluido en el ZPL (verificar en Labelary que escanea)
- [ ] `buildQRData` sanitiza el texto correctamente
- [ ] Sin errores de TypeScript
- [ ] El QR no rompe el layout de la etiqueta (posición correcta para cada preset)
- [ ] Funciona para presets 100×150 y 80×50
