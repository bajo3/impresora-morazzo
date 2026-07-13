import type { LabelPresetId, LabelSettings } from '../types'

interface LabelPresetSelectorProps {
  presets: LabelSettings[]
  selectedPresetId: LabelPresetId
  onSelectPreset: (presetId: LabelPresetId) => void
}

export function LabelPresetSelector({
  presets,
  selectedPresetId,
  onSelectPreset,
}: LabelPresetSelectorProps) {
  return (
    <div className="preset-selector no-print">
      <div className="preset-selector__copy">
        <h2>2. Formato de etiqueta</h2>
        <p>Usa uno de los tamaños fijos preparados para el rollo.</p>
      </div>

      <div className="preset-selector__actions">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`preset-selector__button ${selectedPresetId === preset.id ? 'preset-selector__button--active' : ''}`.trim()}
            onClick={() => onSelectPreset(preset.id)}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}
