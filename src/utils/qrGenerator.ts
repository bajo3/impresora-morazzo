import QRCode from 'qrcode'
import type { LabelModel } from '../types'

export function buildQRData(label: LabelModel): string {
  const fields: Array<[string, string]> = [
    ['OBRA', label.obra],
    ['MEDIDAS', label.medidas],
    ['DVH', label.composicionDVH],
    ['CANT', label.cantidad],
    ['MTS2', label.mts2],
    ['OBS', label.observaciones],
  ]
  const lines = fields
    .filter(([, v]) => v && v.trim() !== '' && v !== '-')
    .map(([k, v]) => `${k}: ${v}`)
  return lines.join('\n') || label.id
}

export function renderQRToCanvas(canvas: HTMLCanvasElement, data: string): Promise<void> {
  return QRCode.toCanvas(canvas, data, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 72,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
