import { useEffect, useRef, type CSSProperties } from 'react'
import type { CompanySettings, LabelModel } from '../types'
import type { LabelSettings } from '../types'
import { shouldShowCompanyBranding, shouldShowCompanyLogo } from '../utils/companySettings'
import { buildQRData, renderQRToCanvas } from '../utils/qrGenerator'

interface LabelCardProps {
  label: LabelModel
  settings: LabelSettings
  showQR: boolean
  companySettings: CompanySettings
  hiddenOnPrint: boolean
  onToggleSelection: (id: string, selected: boolean) => void
}

interface LabelFieldProps {
  name: string
  value: string
  modifier?: string
  fieldClassName?: string
}

function LabelField({ name, value, modifier, fieldClassName }: LabelFieldProps) {
  return (
    <div className={`label-field ${fieldClassName ?? ''}`.trim()}>
      <span className={`label-field__name ${modifier ?? ''}`.trim()}>{name}</span>
      <span className={`label-field__value ${modifier ?? ''}`.trim()}>
        {value || '-'}
      </span>
    </div>
  )
}

export function LabelCard({
  label,
  settings,
  showQR,
  companySettings,
  hiddenOnPrint,
  onToggleSelection,
}: LabelCardProps) {
  const isCompactFormat = settings.id === '80x50'
  const showBranding = shouldShowCompanyBranding(companySettings)
  const showLogo = shouldShowCompanyLogo(companySettings)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = qrCanvasRef.current
    if (!showQR || !canvas) return

    renderQRToCanvas(canvas, buildQRData(label)).catch(() => {
      // QR falla silenciosamente — la etiqueta sigue siendo usable
    })
  }, [label, showQR])

  return (
    <article
      className={`label-card ${hiddenOnPrint ? 'label-card--hide-on-print' : ''} ${isCompactFormat ? 'label-card--compact' : ''}`.trim()}
      style={
        {
          '--label-width-mm': `${settings.widthMm}mm`,
          '--label-height-mm': `${settings.heightMm}mm`,
          '--label-height-ratio': String(settings.heightMm / settings.widthMm),
        } as CSSProperties
      }
    >
      <label className="label-card__toggle">
        <input
          type="checkbox"
          checked={label.selected}
          onChange={(event) =>
            onToggleSelection(label.id, event.currentTarget.checked)
          }
        />
        Seleccionar
      </label>

      <div className="label-print-sheet label-print">
        <header className={`label-card__header ${showQR && !isCompactFormat ? 'label-card__header--with-qr' : ''}`.trim()}>
          <div className="label-card__brand-block">
            {showLogo ? (
              <img
                className="label-card__logo"
                src={companySettings.companyLogoDataUrl ?? undefined}
                alt=""
              />
            ) : null}
            <div className="label-card__header-text">
              {companySettings.showCompanyName ? (
                <>
                  <strong className="label-card__company-name">
                    {companySettings.companyName || 'Facundo Morazzo'}
                  </strong>
                  <span className="label-card__company-subtitle">
                    {companySettings.companySubtitle || 'Vidriería y Aberturas'}
                  </span>
                </>
              ) : null}
              {!showBranding ? (
                <>
                  <span className="label-card__eyebrow">Etiqueta de corte</span>
                  <h3 className="label-card__headline">DVH listo para produccion</h3>
                </>
              ) : (
                <span className="label-card__eyebrow">Etiqueta de corte</span>
              )}
            </div>
          </div>
          {showQR && !isCompactFormat && (
            <canvas
              ref={qrCanvasRef}
              className="label-card__qr-canvas"
              aria-label="Código QR de la etiqueta"
            />
          )}
        </header>

        <div
          className={`label-card__body ${(showBranding || label.nombre) && isCompactFormat ? 'label-card__body--with-brand' : ''}`.trim()}
        >
          {(showBranding || label.nombre) && isCompactFormat ? (
            <div className="label-card__compact-brand">
              {showLogo ? (
                <img
                  className="label-card__compact-logo"
                  src={companySettings.companyLogoDataUrl ?? undefined}
                  alt=""
                />
              ) : null}
              <div className="label-card__compact-brand-text">
                {companySettings.showCompanyName ? (
                  <span className="label-card__compact-company">
                    {companySettings.companyName}
                  </span>
                ) : null}
                {label.nombre ? (
                  <strong className="label-card__compact-nombre">
                    {label.nombre}
                  </strong>
                ) : null}
              </div>
            </div>
          ) : null}
          <LabelField
            name="Obra"
            value={label.obra}
            modifier="label-field__value--obra"
            fieldClassName="label-field--obra"
          />
          <LabelField
            name="Medidas"
            value={label.medidas}
            modifier="label-field__value--medidas"
            fieldClassName="label-field--medidas"
          />
          <LabelField
            name="Cantidad"
            value={label.cantidad}
            modifier="label-field__value--cantidad"
            fieldClassName="label-field--cantidad"
          />
          <LabelField
            name="Composicion DVH"
            value={label.composicionDVH}
            modifier="label-field__value--dvh"
            fieldClassName="label-field--dvh"
          />
          <LabelField name="Mts.2" value={label.mts2} fieldClassName="label-field--mts2" />
          <LabelField
            name="Observaciones"
            value={label.observaciones}
            modifier="label-field__value--notes"
            fieldClassName="label-field--notes"
          />
        </div>
      </div>
    </article>
  )
}
