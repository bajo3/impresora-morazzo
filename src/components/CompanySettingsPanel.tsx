import type { ChangeEvent } from 'react'
import type { CompanySettings } from '../types'

interface CompanySettingsPanelProps {
  settings: CompanySettings
  errorMessage: string | null
  onChange: (settings: CompanySettings) => void
  onLogoFileSelect: (file: File | null) => void
  onClearLogo: () => void
}

export function CompanySettingsPanel({
  settings,
  errorMessage,
  onChange,
  onLogoFileSelect,
  onClearLogo,
}: CompanySettingsPanelProps) {
  const update = (patch: Partial<CompanySettings>) => {
    onChange({ ...settings, ...patch })
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    onLogoFileSelect(event.currentTarget.files?.[0] ?? null)
    event.currentTarget.value = ''
  }

  return (
    <section className="company-settings no-print" aria-labelledby="company-settings-title">
      <div className="company-settings__copy">
        <h2 id="company-settings-title">Logo de empresa</h2>
        <p>Configurá la marca que aparece en la vista previa y en el ZPL.</p>
      </div>

      <div className="company-settings__grid">
        <label className="company-settings__field">
          Nombre empresa
          <input
            type="text"
            value={settings.companyName}
            onChange={(event) => update({ companyName: event.currentTarget.value })}
          />
        </label>

        <label className="company-settings__field">
          Subtítulo
          <input
            type="text"
            value={settings.companySubtitle}
            onChange={(event) =>
              update({ companySubtitle: event.currentTarget.value })
            }
          />
        </label>

        <div className="company-settings__toggles" aria-label="Opciones de marca">
          <label>
            <input
              type="checkbox"
              checked={settings.showLogo}
              onChange={(event) => update({ showLogo: event.currentTarget.checked })}
            />
            Mostrar logo
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.showCompanyName}
              onChange={(event) =>
                update({ showCompanyName: event.currentTarget.checked })
              }
            />
            Mostrar nombre
          </label>
        </div>

        <div className="company-settings__logo-actions">
          <label className="company-settings__upload-button">
            Subir logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
            />
          </label>
          <button
            type="button"
            className="company-settings__clear-button"
            onClick={onClearLogo}
            disabled={!settings.companyLogoDataUrl}
          >
            Borrar logo
          </button>
        </div>

        <div className="company-settings__preview" aria-label="Preview del logo">
          {settings.companyLogoDataUrl ? (
            <img src={settings.companyLogoDataUrl} alt="Logo cargado" />
          ) : (
            <span>Sin logo cargado</span>
          )}
        </div>
      </div>

      {errorMessage ? (
        <p className="company-settings__error" role="status">
          {errorMessage}
        </p>
      ) : null}
    </section>
  )
}
