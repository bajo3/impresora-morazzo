import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { EmptyState } from './components/EmptyState'
import { ErrorMessage } from './components/ErrorMessage'
import { LabelPresetSelector } from './components/LabelPresetSelector'
import { LabelPreviewList } from './components/LabelPreviewList'
import { SheetSelector } from './components/SheetSelector'
import { Toolbar } from './components/Toolbar'
import { UploadPanel } from './components/UploadPanel'
import { parseWorkbookFile } from './lib/excelParser'
import type { AppMessage, LabelModel, LabelPresetId, LabelSettings, PrintScope } from './types'
import { DEFAULT_LABEL_SETTINGS, getLabelPresetById, LABEL_PRESETS } from './utils/labelSettings'
import { buildZplForLabels } from './utils/zpl'
import { sendZplToZebra } from './utils/zebraBrowserPrint'

function App() {
  const [labels, setLabels] = useState<LabelModel[]>([])
  const [messages, setMessages] = useState<AppMessage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheetName, setSelectedSheetName] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPresetId, setSelectedPresetId] =
    useState<LabelPresetId>(DEFAULT_LABEL_SETTINGS.id)
  const [showQR, setShowQR] = useState(false)
  const printScope: PrintScope = 'all'
  const labelSettings: LabelSettings = useMemo(
    () => getLabelPresetById(selectedPresetId),
    [selectedPresetId],
  )

  const settingsSummary = `${labelSettings.name}, ${labelSettings.dpi} DPI`

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--label-width-mm',
      `${labelSettings.widthMm}mm`,
    )
    document.documentElement.style.setProperty(
      '--label-height-mm',
      `${labelSettings.heightMm}mm`,
    )
    document.documentElement.style.setProperty(
      '--label-height-ratio',
      String(labelSettings.heightMm / labelSettings.widthMm),
    )
  }, [labelSettings])

  const selectedCount = useMemo(
    () => labels.filter((label) => label.selected).length,
    [labels],
  )

  const loadWorkbookSheet = async (file: File, sheetName?: string) => {
    setIsProcessing(true)
    setErrorMessage(null)
    setMessages([])

    try {
      const result = await parseWorkbookFile(file, sheetName)
      setLabels(result.labels)
      setMessages(result.messages)
      setFileName(file.name)
      setCurrentFile(file)
      setSheetNames(result.sheetNames)
      setSelectedSheetName(result.selectedSheetName)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo procesar el archivo seleccionado.'
      setLabels([])
      setErrorMessage(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return
    }

    setFileName(file.name)
    setCurrentFile(file)
    setSheetNames([])
    setSelectedSheetName('')
    await loadWorkbookSheet(file)
  }

  const handleSheetChange = async (sheetName: string) => {
    if (!currentFile) {
      return
    }

    setSelectedSheetName(sheetName)
    await loadWorkbookSheet(currentFile, sheetName)
  }

  const updateLabelSelection = (id: string, selected: boolean) => {
    setLabels((current) =>
      current.map((label) => (label.id === id ? { ...label, selected } : label)),
    )
  }

  const setAllSelections = (selected: boolean) => {
    setLabels((current) => current.map((label) => ({ ...label, selected })))
  }

  const showSuccessMessage = (text: string) => {
    setErrorMessage(null)
    setMessages([{ kind: 'success', text }])
  }

  const resolveLabelsForScope = (scope: PrintScope): LabelModel[] | null => {
    if (labels.length === 0) {
      return null
    }

    if (scope === 'all') {
      return labels
    }

    const selectedLabels = labels.filter((label) => label.selected)
    if (selectedLabels.length === 0) {
      setErrorMessage('No hay etiquetas seleccionadas')
      return null
    }

    return selectedLabels
  }

  const buildZplForScope = (scope: PrintScope): string | null => {
    const scopedLabels = resolveLabelsForScope(scope)
    if (!scopedLabels) {
      return null
    }

    setErrorMessage(null)
    return buildZplForLabels(scopedLabels, labelSettings, showQR)
  }

  const downloadZpl = (scope: PrintScope) => {
    const zpl = buildZplForScope(scope)
    if (!zpl) {
      return
    }

    const blob = new Blob([zpl], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const suffix = scope === 'selected' ? 'seleccionadas' : 'todas'
    link.href = url
    link.download = `etiquetas-dvh-${labelSettings.widthMm}x${labelSettings.heightMm}-${suffix}.zpl`
    link.click()
    URL.revokeObjectURL(url)
    showSuccessMessage('ZPL generado correctamente')
  }

  const copyZpl = async (scope: PrintScope) => {
    const zpl = buildZplForScope(scope)
    if (!zpl) {
      return
    }

    try {
      await navigator.clipboard.writeText(zpl)
      showSuccessMessage('ZPL generado correctamente')
    } catch {
      setErrorMessage('No se pudo copiar el ZPL al portapapeles.')
    }
  }

  const printWithZebra = async (scope: PrintScope) => {
    const zpl = buildZplForScope(scope)
    if (!zpl) {
      return
    }

    try {
      await sendZplToZebra(zpl)
      showSuccessMessage('ZPL generado correctamente')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el ZPL a la impresora Zebra.'
      setErrorMessage(message)
    }
  }

  return (
    <main className="app-shell" data-print-scope={printScope}>
      <section className="hero-panel no-print">
        <div className="hero-copy">
          <span className="eyebrow">Etiquetas de corte DVH</span>
          <h1>Subi el Excel y deja las etiquetas listas para imprimir.</h1>
          <p>
            La app detecta los encabezados, ignora filas vacias y genera las
            etiquetas con el formato que configures para revisar en pantalla y
            enviar por ZPL a Zebra.
          </p>
        </div>

        <UploadPanel
          fileName={fileName}
          isProcessing={isProcessing}
          onFileSelect={handleFileChange}
        />
      </section>

      <section className="status-panel no-print">
        {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

        {messages.length > 0 ? (
          <div className="message-list" aria-live="polite">
            {messages.map((message) => (
              <div
                key={`${message.kind}-${message.text}`}
                className={`message-card message-card--${message.kind}`}
              >
                {message.text}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="workspace">
        <SheetSelector
          sheetNames={sheetNames}
          selectedSheetName={selectedSheetName}
          isProcessing={isProcessing}
          onSelectSheet={handleSheetChange}
        />

        <LabelPresetSelector
          presets={LABEL_PRESETS}
          selectedPresetId={selectedPresetId}
          onSelectPreset={setSelectedPresetId}
        />

        <Toolbar
          hasLabels={labels.length > 0}
          totalCount={labels.length}
          selectedCount={selectedCount}
          settingsSummary={settingsSummary}
          showQR={showQR}
          onToggleQR={() => setShowQR((v) => !v)}
          onSelectAll={() => setAllSelections(true)}
          onClearSelection={() => setAllSelections(false)}
          onPrintAllWithZebra={() => void printWithZebra('all')}
          onPrintSelectedWithZebra={() => void printWithZebra('selected')}
          onDownloadAllZpl={() => downloadZpl('all')}
          onDownloadSelectedZpl={() => downloadZpl('selected')}
          onCopyAllZpl={() => void copyZpl('all')}
          onCopySelectedZpl={() => void copyZpl('selected')}
        />

        {labels.length === 0 ? (
          <EmptyState />
        ) : (
          <LabelPreviewList
            labels={labels}
            settings={labelSettings}
            printScope={printScope}
            showQR={showQR}
            onToggleSelection={updateLabelSelection}
          />
        )}
      </section>
    </main>
  )
}

export default App
