interface UploadPanelProps {
  fileName: string
  isProcessing: boolean
  onFileSelect: (file: File | null) => void
}

export function UploadPanel({
  fileName,
  isProcessing,
  onFileSelect,
}: UploadPanelProps) {
  return (
    <div className="upload-panel">
      <h2>1. Subir Excel</h2>
      <p>
        Acepta archivos <strong>.xlsx</strong> con el formato habitual de corte
        DVH.
      </p>

      <label className="upload-button">
        {isProcessing ? 'Procesando archivo...' : 'Seleccionar archivo Excel'}
        <input
          type="file"
          accept=".xlsx"
          hidden
          disabled={isProcessing}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            onFileSelect(file)
            event.currentTarget.value = ''
          }}
        />
      </label>

      <div className="upload-panel__meta">
        <span>La detección de encabezados es automática.</span>
        <span className="upload-panel__filename">
          {fileName ? `Archivo actual: ${fileName}` : 'Todavía no se cargó ningún archivo.'}
        </span>
      </div>
    </div>
  )
}
