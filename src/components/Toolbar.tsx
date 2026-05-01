interface ToolbarProps {
  hasLabels: boolean
  totalCount: number
  selectedCount: number
  settingsSummary: string
  showQR: boolean
  onToggleQR: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onPrintAllWithZebra: () => void
  onPrintSelectedWithZebra: () => void
  onDownloadAllZpl: () => void
  onDownloadSelectedZpl: () => void
  onCopyAllZpl: () => void
  onCopySelectedZpl: () => void
}

export function Toolbar({
  hasLabels,
  totalCount,
  selectedCount,
  settingsSummary,
  showQR,
  onToggleQR,
  onSelectAll,
  onClearSelection,
  onPrintAllWithZebra,
  onPrintSelectedWithZebra,
  onDownloadAllZpl,
  onDownloadSelectedZpl,
  onCopyAllZpl,
  onCopySelectedZpl,
}: ToolbarProps) {
  return (
    <div className="toolbar no-print">
      <div className="toolbar__summary">
        <h2 className="toolbar__title">2. Revisar etiquetas</h2>
        <span className="toolbar__detail">
          {hasLabels
            ? `${totalCount} etiquetas generadas. ${selectedCount} seleccionadas para salida parcial por Zebra. Formato activo: ${settingsSummary}.`
            : 'Carga un archivo para ver la vista previa.'}
        </span>
      </div>

      <div className="toolbar__actions">
        <button
          type="button"
          className={`toolbar__button ${showQR ? 'toolbar__button--qr-active' : 'toolbar__button--ghost'}`}
          onClick={onToggleQR}
          disabled={!hasLabels}
          aria-pressed={showQR}
        >
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--ghost"
          onClick={onSelectAll}
          disabled={!hasLabels}
        >
          Seleccionar todas
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--ghost"
          onClick={onClearSelection}
          disabled={!hasLabels}
        >
          Limpiar seleccion
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--secondary"
          onClick={onPrintSelectedWithZebra}
          disabled={!hasLabels}
        >
          Imprimir seleccionadas con Zebra
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--primary"
          onClick={onPrintAllWithZebra}
          disabled={!hasLabels}
        >
          Imprimir todas con Zebra
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--ghost"
          onClick={onDownloadSelectedZpl}
          disabled={!hasLabels}
        >
          Descargar ZPL seleccionadas
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--ghost"
          onClick={onDownloadAllZpl}
          disabled={!hasLabels}
        >
          Descargar ZPL todas
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--ghost"
          onClick={onCopySelectedZpl}
          disabled={!hasLabels}
        >
          Copiar ZPL seleccionadas
        </button>
        <button
          type="button"
          className="toolbar__button toolbar__button--ghost"
          onClick={onCopyAllZpl}
          disabled={!hasLabels}
        >
          Copiar ZPL todas
        </button>
      </div>
    </div>
  )
}
