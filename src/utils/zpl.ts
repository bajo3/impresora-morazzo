import type { LabelModel, LabelSettings } from '../types'
import { DEFAULT_LABEL_SETTINGS } from './labelSettings'

const BASE_LAYOUT = {
  widthDots: 812,
  heightDots: 1218,
  leftMargin: 40,
  separatorX: 35,
  separatorWidth: 742,
  separatorThickness: 2,
  contentWidth: 732,
  separatorY: [128, 288, 484, 674, 842, 990],
  labelY: [154, 320, 520, 706, 874, 1020],
  valueY: [188, 356, 556, 742, 910, 1054],
  headerTitle: { x: 40, y: 36, h: 42, w: 42 },
  headerSubtitle: { x: 40, y: 88, h: 28, w: 28 },
  fieldLabelFont: { h: 28, w: 28 },
  fieldValue: {
    obra: { h: 36, w: 34, maxLines: 2 },
    medidas: { h: 74, w: 72, maxLines: 2 },
    cantidad: { h: 88, w: 82, maxLines: 1 },
    composicion: { h: 46, w: 42, maxLines: 2 },
    mts2: { h: 44, w: 40, maxLines: 1 },
    observaciones: { h: 28, w: 28, maxLines: 4 },
  },
} as const

function mmToDots(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm * dpi) / 25.4))
}

function getZplLayout(settings: LabelSettings) {
  if (settings.id === '80x50') {
    const widthDots = mmToDots(settings.widthMm, settings.dpi)
    const heightDots = mmToDots(settings.heightMm, settings.dpi)
    const marginDots = mmToDots(settings.marginMm, settings.dpi)
    const contentWidth = widthDots - marginDots * 2

    return {
      mode: 'compact' as const,
      widthDots,
      heightDots,
      leftMargin: marginDots,
      contentWidth,
    }
  }

  const widthDots = mmToDots(settings.widthMm, settings.dpi)
  const heightDots = mmToDots(settings.heightMm, settings.dpi)
  const marginDots = mmToDots(settings.marginMm, settings.dpi)
  const scaleX = widthDots / BASE_LAYOUT.widthDots
  const scaleY = heightDots / BASE_LAYOUT.heightDots
  const fontScale = Math.min(scaleX, scaleY)
  const scaleHorizontal = (value: number) => Math.max(1, Math.round(value * scaleX))
  const scaleVertical = (value: number) => Math.max(1, Math.round(value * scaleY))
  const scaleFont = (value: number) => Math.max(18, Math.round(value * fontScale))
  const contentWidth = Math.max(widthDots - marginDots * 2, scaleHorizontal(280))

  return {
    mode: 'standard' as const,
    widthDots,
    heightDots,
    leftMargin: marginDots,
    separatorX: Math.max(0, marginDots - scaleHorizontal(5)),
    separatorWidth: Math.min(widthDots, contentWidth + scaleHorizontal(10)),
    separatorThickness: Math.max(1, Math.round(BASE_LAYOUT.separatorThickness * fontScale)),
    contentWidth,
    separatorY: BASE_LAYOUT.separatorY.map(scaleVertical),
    labelY: BASE_LAYOUT.labelY.map(scaleVertical),
    valueY: BASE_LAYOUT.valueY.map(scaleVertical),
    headerTitle: {
      x: marginDots,
      y: scaleVertical(BASE_LAYOUT.headerTitle.y),
      h: scaleFont(BASE_LAYOUT.headerTitle.h),
      w: scaleFont(BASE_LAYOUT.headerTitle.w),
    },
    headerSubtitle: {
      x: marginDots,
      y: scaleVertical(BASE_LAYOUT.headerSubtitle.y),
      h: scaleFont(BASE_LAYOUT.headerSubtitle.h),
      w: scaleFont(BASE_LAYOUT.headerSubtitle.w),
    },
    fieldLabelFont: {
      h: scaleFont(BASE_LAYOUT.fieldLabelFont.h),
      w: scaleFont(BASE_LAYOUT.fieldLabelFont.w),
    },
    fieldValue: {
      obra: {
        h: scaleFont(BASE_LAYOUT.fieldValue.obra.h),
        w: scaleFont(BASE_LAYOUT.fieldValue.obra.w),
        maxLines: BASE_LAYOUT.fieldValue.obra.maxLines,
      },
      medidas: {
        h: scaleFont(BASE_LAYOUT.fieldValue.medidas.h),
        w: scaleFont(BASE_LAYOUT.fieldValue.medidas.w),
        maxLines: BASE_LAYOUT.fieldValue.medidas.maxLines,
      },
      cantidad: {
        h: scaleFont(BASE_LAYOUT.fieldValue.cantidad.h),
        w: scaleFont(BASE_LAYOUT.fieldValue.cantidad.w),
        maxLines: BASE_LAYOUT.fieldValue.cantidad.maxLines,
      },
      composicion: {
        h: scaleFont(BASE_LAYOUT.fieldValue.composicion.h),
        w: scaleFont(BASE_LAYOUT.fieldValue.composicion.w),
        maxLines: BASE_LAYOUT.fieldValue.composicion.maxLines,
      },
      mts2: {
        h: scaleFont(BASE_LAYOUT.fieldValue.mts2.h),
        w: scaleFont(BASE_LAYOUT.fieldValue.mts2.w),
        maxLines: BASE_LAYOUT.fieldValue.mts2.maxLines,
      },
      observaciones: {
        h: scaleFont(BASE_LAYOUT.fieldValue.observaciones.h),
        w: scaleFont(BASE_LAYOUT.fieldValue.observaciones.w),
        maxLines: BASE_LAYOUT.fieldValue.observaciones.maxLines,
      },
    },
  }
}

function fieldSeparator(y: number, separatorX: number, separatorWidth: number, thickness: number): string {
  return `^FO${separatorX},${y}^GB${separatorWidth},${thickness},${thickness}^FS`
}

function fieldLabel(
  x: number,
  y: number,
  title: string,
  fontHeight: number,
  fontWidth: number,
): string {
  return `^FO${x},${y}^A0N,${fontHeight},${fontWidth}^FD${sanitizeZplText(title)}^FS`
}

function fieldValue(
  x: number,
  contentWidth: number,
  y: number,
  value: string,
  fontHeight: number,
  fontWidth: number,
  maxLines: number,
): string {
  return `^FO${x},${y}^A0N,${fontHeight},${fontWidth}^FB${contentWidth},${maxLines},8,L,0^FD${sanitizeZplText(value)}^FS`
}

function fieldValueNoWrap(
  x: number,
  y: number,
  value: string,
  fontHeight: number,
  fontWidth: number,
): string {
  return `^FO${x},${y}^A0N,${fontHeight},${fontWidth}^FD${sanitizeZplText(value)}^FS`
}

export function sanitizeZplText(value: string | null | undefined): string {
  const fallback = value === null || value === undefined ? '-' : String(value)

  return fallback
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\^~\\]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim() || '-'
}

export function buildZplForLabel(
  label: LabelModel,
  settings: LabelSettings = DEFAULT_LABEL_SETTINGS,
): string {
  const layout = getZplLayout(settings)
  const obra = sanitizeZplText(label.obra)
  const medidas = sanitizeZplText(label.medidas)
  const cantidad = sanitizeZplText(label.cantidad)
  const composicion = sanitizeZplText(label.composicionDVH)
  const mts2 = sanitizeZplText(label.mts2)
  const observaciones = sanitizeZplText(label.observaciones)

  if (layout.mode === 'compact') {
    const compactMedidas = medidas.length > 15 ? medidas.replace(' x ', 'x') : medidas
    const compactObra = obra.length > 34 ? `${obra.slice(0, 34)}...` : obra
    const compactComposicion =
      composicion.length > 28 ? `${composicion.slice(0, 28)}...` : composicion
    const compactObs =
      observaciones.length > 28 ? `${observaciones.slice(0, 28)}...` : observaciones

    return [
      '^XA',
      '^CI28',
      `^PW${layout.widthDots}`,
      `^LL${layout.heightDots}`,
      '^LH0,0',
      `^FO${layout.leftMargin},18^A0N,24,22^FDOBRA^FS`,
      fieldValue(layout.leftMargin, layout.contentWidth - 110, 48, compactObra, 28, 26, 1),
      `^FO${layout.widthDots - 120},18^A0N,24,22^FDCANT^FS`,
      fieldValueNoWrap(layout.widthDots - 106, 46, cantidad, 54, 48),
      `^FO${layout.leftMargin},92^GB${layout.contentWidth},2,2^FS`,
      `^FO${layout.leftMargin},106^A0N,24,22^FDMEDIDAS^FS`,
      fieldValue(layout.leftMargin, layout.contentWidth, 136, compactMedidas, 72, 64, 1),
      `^FO${layout.leftMargin},218^GB${layout.contentWidth},2,2^FS`,
      `^FO${layout.leftMargin},234^A0N,24,22^FDDVH^FS`,
      fieldValue(layout.leftMargin, layout.contentWidth - 120, 262, compactComposicion, 32, 30, 1),
      `^FO${layout.widthDots - 120},234^A0N,24,22^FDM2^FS`,
      fieldValueNoWrap(layout.widthDots - 112, 264, mts2, 32, 30),
      `^FO${layout.leftMargin},316^GB${layout.contentWidth},2,2^FS`,
      `^FO${layout.leftMargin},332^A0N,22,20^FDOBS^FS`,
      fieldValue(layout.leftMargin + 58, layout.contentWidth - 58, 330, compactObs, 24, 22, 2),
      '^XZ',
    ].join('\n')
  }

  return [
    '^XA',
    '^CI28',
    `^PW${layout.widthDots}`,
    `^LL${layout.heightDots}`,
    '^LH0,0',
    `^FO${layout.headerTitle.x},${layout.headerTitle.y}^A0N,${layout.headerTitle.h},${layout.headerTitle.w}^FDETIQUETA DE CORTE^FS`,
    `^FO${layout.headerSubtitle.x},${layout.headerSubtitle.y}^A0N,${layout.headerSubtitle.h},${layout.headerSubtitle.w}^FDDVH listo para produccion^FS`,
    fieldSeparator(
      layout.separatorY[0],
      layout.separatorX,
      layout.separatorWidth,
      layout.separatorThickness,
    ),
    fieldLabel(
      layout.leftMargin,
      layout.labelY[0],
      'OBRA',
      layout.fieldLabelFont.h,
      layout.fieldLabelFont.w,
    ),
    fieldValue(
      layout.leftMargin,
      layout.contentWidth,
      layout.valueY[0],
      obra,
      layout.fieldValue.obra.h,
      layout.fieldValue.obra.w,
      layout.fieldValue.obra.maxLines,
    ),
    fieldSeparator(
      layout.separatorY[1],
      layout.separatorX,
      layout.separatorWidth,
      layout.separatorThickness,
    ),
    fieldLabel(
      layout.leftMargin,
      layout.labelY[1],
      'MEDIDAS',
      layout.fieldLabelFont.h,
      layout.fieldLabelFont.w,
    ),
    fieldValue(
      layout.leftMargin,
      layout.contentWidth,
      layout.valueY[1],
      medidas,
      layout.fieldValue.medidas.h,
      layout.fieldValue.medidas.w,
      layout.fieldValue.medidas.maxLines,
    ),
    fieldSeparator(
      layout.separatorY[2],
      layout.separatorX,
      layout.separatorWidth,
      layout.separatorThickness,
    ),
    fieldLabel(
      layout.leftMargin,
      layout.labelY[2],
      'CANTIDAD',
      layout.fieldLabelFont.h,
      layout.fieldLabelFont.w,
    ),
    fieldValue(
      layout.leftMargin,
      layout.contentWidth,
      layout.valueY[2],
      cantidad,
      layout.fieldValue.cantidad.h,
      layout.fieldValue.cantidad.w,
      layout.fieldValue.cantidad.maxLines,
    ),
    fieldSeparator(
      layout.separatorY[3],
      layout.separatorX,
      layout.separatorWidth,
      layout.separatorThickness,
    ),
    fieldLabel(
      layout.leftMargin,
      layout.labelY[3],
      'COMPOSICION DVH',
      layout.fieldLabelFont.h,
      layout.fieldLabelFont.w,
    ),
    fieldValue(
      layout.leftMargin,
      layout.contentWidth,
      layout.valueY[3],
      composicion,
      layout.fieldValue.composicion.h,
      layout.fieldValue.composicion.w,
      layout.fieldValue.composicion.maxLines,
    ),
    fieldSeparator(
      layout.separatorY[4],
      layout.separatorX,
      layout.separatorWidth,
      layout.separatorThickness,
    ),
    fieldLabel(
      layout.leftMargin,
      layout.labelY[4],
      'MTS.2',
      layout.fieldLabelFont.h,
      layout.fieldLabelFont.w,
    ),
    fieldValue(
      layout.leftMargin,
      layout.contentWidth,
      layout.valueY[4],
      mts2,
      layout.fieldValue.mts2.h,
      layout.fieldValue.mts2.w,
      layout.fieldValue.mts2.maxLines,
    ),
    fieldSeparator(
      layout.separatorY[5],
      layout.separatorX,
      layout.separatorWidth,
      layout.separatorThickness,
    ),
    fieldLabel(
      layout.leftMargin,
      layout.labelY[5],
      'OBSERVACIONES',
      layout.fieldLabelFont.h,
      layout.fieldLabelFont.w,
    ),
    fieldValue(
      layout.leftMargin,
      layout.contentWidth,
      layout.valueY[5],
      observaciones,
      layout.fieldValue.observaciones.h,
      layout.fieldValue.observaciones.w,
      layout.fieldValue.observaciones.maxLines,
    ),
    '^XZ',
  ].join('\n')
}

export function buildZplForLabels(
  labels: LabelModel[],
  settings: LabelSettings = DEFAULT_LABEL_SETTINGS,
): string {
  return labels.map((label) => buildZplForLabel(label, settings)).join('\n')
}
