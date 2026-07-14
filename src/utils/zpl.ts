import type { CompanySettings, LabelModel, LabelSettings, PrintQuantityMode } from '../types'
import { getDefaultCompanySettings } from './companySettings'
import { DEFAULT_LABEL_SETTINGS } from './labelSettings'
import { buildQRData } from './qrGenerator'

const BASE_LAYOUT = {
  widthDots: 812,
  heightDots: 1218,
  leftMargin: 40,
  separatorX: 35,
  separatorWidth: 742,
  separatorThickness: 2,
  contentWidth: 732,
  separatorY: [128, 244, 386, 564, 706, 870, 984],
  labelY: [150, 266, 408, 586, 728, 892, 1006],
  valueY: [182, 298, 444, 614, 762, 926, 1038],
  headerTitle: { x: 40, y: 36, h: 42, w: 42 },
  headerSubtitle: { x: 40, y: 88, h: 28, w: 28 },
  fieldLabelFont: { h: 28, w: 28 },
  fieldValue: {
    nombre: { h: 36, w: 34, maxLines: 1 },
    obra: { h: 36, w: 34, maxLines: 2 },
    medidas: { h: 74, w: 72, maxLines: 1 },
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
      nombre: {
        h: scaleFont(BASE_LAYOUT.fieldValue.nombre.h),
        w: scaleFont(BASE_LAYOUT.fieldValue.nombre.w),
        maxLines: BASE_LAYOUT.fieldValue.nombre.maxLines,
      },
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

function buildZplQRLines(
  label: LabelModel,
  widthDots: number,
  headerY: number,
  dpi: number,
): string[] {
  const magnification = 3
  // Estimate: ~35 modules for medium data QR at M error correction → 105 dots
  const estimatedQrDots = magnification * 35
  const rightMarginDots = mmToDots(3, dpi)
  const qrX = Math.max(0, widthDots - estimatedQrDots - rightMarginDots)
  const qrY = headerY
  const qrData = sanitizeZplText(buildQRData(label))
  return [
    `^FO${qrX},${qrY}`,
    `^BQN,2,${magnification}`,
    `^FDQA,${qrData}^FS`,
  ]
}

function buildStandardBrandingLines(
  companySettings: CompanySettings,
  x: number,
  y: number,
  contentWidth: number,
): string[] {
  if (!companySettings.showCompanyName) {
    return [
      `^FO${x},${y}^A0N,42,42^FDETIQUETA DE CORTE^FS`,
      `^FO${x},${y + 52}^A0N,28,28^FDDVH listo para produccion^FS`,
    ]
  }

  return [
    `^FO${x},${y}^A0N,40,38^FB${contentWidth},1,8,L,0^FD${sanitizeZplText(companySettings.companyName)}^FS`,
    `^FO${x},${y + 46}^A0N,26,25^FB${contentWidth},1,6,L,0^FD${sanitizeZplText(companySettings.companySubtitle)}^FS`,
  ]
}


export function getPrintQuantity(label: LabelModel, quantityMode: PrintQuantityMode = 'quantity'): number {
  if (quantityMode === 'single') {
    return 1
  }

  const quantity = Number.parseInt(label.cantidad, 10)

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 1
  }

  return quantity
}

export function buildZplForLabel(
  label: LabelModel,
  settings: LabelSettings = DEFAULT_LABEL_SETTINGS,
  showQR = false,
  companySettings: CompanySettings = getDefaultCompanySettings(),
): string {
  const layout = getZplLayout(settings)
  const nombre = sanitizeZplText(label.nombre)
  const obra = sanitizeZplText(label.obra)
  const medidas = sanitizeZplText(label.medidas)
  const cantidad = sanitizeZplText(label.cantidad)
  const composicion = sanitizeZplText(label.composicionDVH)
  const mts2 = sanitizeZplText(label.mts2)
  const observaciones = sanitizeZplText(label.observaciones)

  if (layout.mode === 'compact') {
    const hasNombre = nombre !== '-'

    const headerLines: string[] = []
    let compactOffset: number

    if (companySettings.showCompanyName && hasNombre) {
      // Company line plus a compact, labeled customer name row.
      headerLines.push(
        `^FO${layout.leftMargin},14^A0N,28,26^FB${layout.contentWidth},1,2,L,0^FD${sanitizeZplText(companySettings.companyName)}^FS`,
        `^FO${layout.leftMargin},46^A0N,16,15^FDNOMBRE^FS`,
        `^FO${layout.leftMargin + 86},44^A0N,20,19^FB${layout.contentWidth - 86},1,2,L,0^FD${nombre}^FS`,
      )
      compactOffset = 64
    } else if (companySettings.showCompanyName) {
      headerLines.push(
        `^FO${layout.leftMargin},18^A0N,28,26^FB${layout.contentWidth},1,2,L,0^FD${sanitizeZplText(companySettings.companyName)}^FS`,
      )
      compactOffset = 46
    } else if (hasNombre) {
      headerLines.push(
        `^FO${layout.leftMargin},18^A0N,17,16^FDNOMBRE^FS`,
        `^FO${layout.leftMargin},40^A0N,24,22^FB${layout.contentWidth},1,2,L,0^FD${nombre}^FS`,
      )
      compactOffset = 58
    } else {
      compactOffset = 0
    }

    const compactMedidas = medidas.length > 15 ? medidas.replace(' x ', 'x') : medidas
    const compactObra = obra.length > 34 ? `${obra.slice(0, 34)}...` : obra
    const compactComposicion =
      composicion.length > 28 ? `${composicion.slice(0, 28)}...` : composicion
    const compactObs =
      observaciones.length > 28 ? `${observaciones.slice(0, 28)}...` : observaciones

    const hasCompactHeader = compactOffset >= 58
    const obsSepOffset = hasCompactHeader ? compactOffset - 20 : compactOffset
    const obsLineOffset = hasCompactHeader ? compactOffset - 26 : compactOffset
    const obsLabelFont = hasCompactHeader ? { h: 18, w: 17 } : { h: 22, w: 20 }
    const obsValueFont = hasCompactHeader ? { h: 18, w: 17 } : { h: 24, w: 22 }
    const obsMaxLines = hasCompactHeader ? 1 : 2

    return [
      '^XA',
      '^CI28',
      '^MTD',
      `^PW${layout.widthDots}`,
      `^LL${layout.heightDots}`,
      '^LH0,0',
      ...headerLines,
      `^FO${layout.leftMargin},${18 + compactOffset}^A0N,24,22^FDOBRA^FS`,
      fieldValue(layout.leftMargin, layout.contentWidth - 110, 48 + compactOffset, compactObra, 28, 26, 1),
      `^FO${layout.widthDots - 120},${18 + compactOffset}^A0N,24,22^FDCANT^FS`,
      fieldValueNoWrap(layout.widthDots - 106, 46 + compactOffset, cantidad, 54, 48),
      `^FO${layout.leftMargin},${92 + compactOffset}^GB${layout.contentWidth},2,2^FS`,
      `^FO${layout.leftMargin},${106 + compactOffset}^A0N,24,22^FDMEDIDAS^FS`,
      fieldValue(layout.leftMargin, layout.contentWidth, 136 + compactOffset, compactMedidas, 72, 64, 1),
      `^FO${layout.leftMargin},${218 + compactOffset}^GB${layout.contentWidth},2,2^FS`,
      `^FO${layout.leftMargin},${234 + compactOffset}^A0N,24,22^FDDVH^FS`,
      fieldValue(layout.leftMargin, layout.contentWidth - 120, 262 + compactOffset, compactComposicion, 32, 30, 1),
      `^FO${layout.widthDots - 120},${234 + compactOffset}^A0N,24,22^FDM2^FS`,
      fieldValueNoWrap(layout.widthDots - 112, 264 + compactOffset, mts2, 32, 30),
      `^FO${layout.leftMargin},${316 + obsSepOffset}^GB${layout.contentWidth},2,2^FS`,
      `^FO${layout.leftMargin},${332 + obsLineOffset}^A0N,${obsLabelFont.h},${obsLabelFont.w}^FDOBS^FS`,
      fieldValue(layout.leftMargin + 58, layout.contentWidth - 58, 330 + obsLineOffset, compactObs, obsValueFont.h, obsValueFont.w, obsMaxLines),
      '^XZ',
    ].join('\n')
  }

  const standardFields = [
    { title: 'NOMBRE', value: nombre, font: layout.fieldValue.nombre },
    { title: 'OBRA', value: obra, font: layout.fieldValue.obra },
    { title: 'MEDIDAS', value: medidas, font: layout.fieldValue.medidas },
    { title: 'CANTIDAD', value: cantidad, font: layout.fieldValue.cantidad },
    { title: 'COMPOSICION DVH', value: composicion, font: layout.fieldValue.composicion },
    { title: 'MTS.2', value: mts2, font: layout.fieldValue.mts2 },
    { title: 'OBSERVACIONES', value: observaciones, font: layout.fieldValue.observaciones },
  ]

  return [
    '^XA',
    '^CI28',
    `^PW${layout.widthDots}`,
    `^LL${layout.heightDots}`,
    '^LH0,0',
    ...buildStandardBrandingLines(
      companySettings,
      layout.headerTitle.x,
      layout.headerTitle.y,
      showQR ? Math.max(220, layout.contentWidth - 128) : layout.contentWidth,
    ),
    ...standardFields.flatMap((field, index) => [
      fieldSeparator(
        layout.separatorY[index],
        layout.separatorX,
        layout.separatorWidth,
        layout.separatorThickness,
      ),
      fieldLabel(
        layout.leftMargin,
        layout.labelY[index],
        field.title,
        layout.fieldLabelFont.h,
        layout.fieldLabelFont.w,
      ),
      fieldValue(
        layout.leftMargin,
        layout.contentWidth,
        layout.valueY[index],
        field.value,
        field.font.h,
        field.font.w,
        field.font.maxLines,
      ),
    ]),
    ...(showQR ? buildZplQRLines(label, layout.widthDots, layout.headerTitle.y, settings.dpi) : []),
    '^XZ',
  ].join('\n')
}

export function buildZplForLabels(
  labels: LabelModel[],
  settings: LabelSettings = DEFAULT_LABEL_SETTINGS,
  showQR = false,
  companySettings: CompanySettings = getDefaultCompanySettings(),
  quantityMode: PrintQuantityMode = 'quantity',
): string {
  return labels
    .flatMap((label) =>
      Array.from({ length: getPrintQuantity(label, quantityMode) }, () =>
        buildZplForLabel(label, settings, showQR, companySettings),
      ),
    )
    .join('\n')
}
