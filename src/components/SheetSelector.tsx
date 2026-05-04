interface SheetSelectorProps {
  sheetNames: string[]
  selectedSheetName: string
  isProcessing: boolean
  onSelectSheet: (sheetName: string) => void
}

export function SheetSelector({
  sheetNames,
  selectedSheetName,
  isProcessing,
  onSelectSheet,
}: SheetSelectorProps) {
  if (sheetNames.length <= 1) {
    return null
  }

  return (
    <div className="sheet-selector no-print">
      <div className="sheet-selector__copy">
        <h2>Hoja del Excel</h2>
        <p>Elegí qué pestaña interna del archivo querés usar para generar etiquetas.</p>
      </div>

      <label className="sheet-selector__field">
        <span>Hoja activa</span>
        <select
          value={selectedSheetName}
          disabled={isProcessing}
          onChange={(event) => onSelectSheet(event.currentTarget.value)}
        >
          {sheetNames.map((sheetName) => (
            <option key={sheetName} value={sheetName}>
              {sheetName}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
