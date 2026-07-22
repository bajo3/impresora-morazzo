import type { PrintQuantityMode } from '../types'

interface ToolbarProps {
  hasLabels: boolean
  totalCount: number
  selectedCount: number
  settingsSummary: string
  showQR: boolean
  printQuantityMode: PrintQuantityMode
  onChangePrintQuantityMode: (mode: PrintQuantityMode) => void
  onToggleQR: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onPrintAllWithZebra: () => void
  onPrintSelectedWithZebra: () => void
  onPrintSelectedWithoutCompanyName: () => void
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
  printQuantityMode,
  onChangePrintQuantityMode,
  onToggleQR,
  onSelectAll,
  onClearSelection,
  onPrintAllWithZebra,
  onPrintSelectedWithZebra,
  onPrintSelectedWithoutCompanyName,
  onDownloadAllZpl,
  onDownloadSelectedZpl,
  onCopyAllZpl,
  onCopySelectedZpl,
}: ToolbarProps) {
  const quantityModeText =
    printQuantityMode === 'quantity' ? 'cantidad del Excel' : '1 por vidrio'

  return (
    <div className="toolbar no-print">
      <div className="toolbar__summary">
        <h2 className="toolbar__title">2. Revisar etiquetas</h2>
        <span className="toolbar__detail">
          {hasLabels
            ? `${totalCount} etiquetas para imprimir. ${selectedCount} seleccionadas para salida parcial por Zebra. Modo: ${quantityModeText}. Formato activo: ${settingsSummary}.`
            : 'Carga un archivo para ver la vista previa.'}
        </span>
      </div>

      <div className="toolbar__actions">
        <div className="toolbar__quantity-mode" role="group" aria-label="Cantidad a imprimir">
          <button
            type="button"
            className={`toolbar__mode-button ${printQuantityMode === 'single' ? 'toolbar__mode-button--active' : ''}`.trim()}
            onClick={() => onChangePrintQuantityMode('single')}
            disabled={!hasLabels}
            aria-pressed={printQuantityMode === 'single'}
          >
            1 por vidrio
          </button>
          <button
            type="button"
            className={`toolbar__mode-button ${printQuantityMode === 'quantity' ? 'toolbar__mode-button--active' : ''}`.trim()}
            onClick={() => onChangePrintQuantityMode('quantity')}
            disabled={!hasLabels}
            aria-pressed={printQuantityMode === 'quantity'}
          >
            Cantidad Excel
          </button>
        </div>
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
          className="toolbar__button toolbar__button--secondary"
          onClick={onPrintSelectedWithoutCompanyName}
          disabled={!hasLabels}
        >
          Imprimir seleccionadas sin Facundo Morazzo
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
