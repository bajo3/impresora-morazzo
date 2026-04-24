interface BrowserPrintDevice {
  name?: string
  uid?: string
  connection?: string
  deviceType?: string
  send: (
    data: string,
    successCallback?: () => void,
    errorCallback?: (error: string) => void,
  ) => void
}

interface BrowserPrintApi {
  getDefaultDevice?: (
    deviceType: 'printer',
    successCallback: (device: BrowserPrintDevice | null) => void,
    errorCallback: (error: string) => void,
  ) => void
  getLocalDevices?: (
    successCallback: (devices: BrowserPrintDevice[]) => void,
    errorCallback: (error: string) => void,
    deviceType?: 'printer',
  ) => void
}

declare global {
  interface Window {
    BrowserPrint?: BrowserPrintApi
  }
}

const BROWSER_PRINT_SCRIPT_PATH = '/vendor/zebra/BrowserPrint.min.js'
const MISSING_LIBRARY_ERROR =
  'No se encontró la librería JavaScript de Zebra Browser Print en /vendor/zebra/BrowserPrint.min.js'
const SERVICE_NOT_RUNNING_ERROR =
  'Zebra Browser Print está instalado como librería, pero el servicio local no está corriendo.'

let browserPrintLoader: Promise<boolean> | null = null

function isZebraDevice(device: BrowserPrintDevice | null | undefined): boolean {
  const identity = `${device?.name ?? ''} ${device?.uid ?? ''} ${device?.connection ?? ''}`
  const normalized = identity.toLowerCase()

  return ['zebra', 'zdesigner', 'zd220', 'zd', 'zpl'].some((token) =>
    normalized.includes(token),
  )
}

function isPrinterDevice(device: BrowserPrintDevice | null | undefined): boolean {
  return (device?.deviceType ?? 'printer').toLowerCase() === 'printer'
}

function formatDetectedPrinters(devices: BrowserPrintDevice[]): string {
  if (devices.length === 0) {
    return 'No se detectaron impresoras locales.'
  }

  const details = devices.map((device) => {
    const name = device.name?.trim() || '(sin nombre)'
    const uid = device.uid?.trim() || '(sin uid)'
    return `${name} [${uid}]`
  })

  return `Impresoras detectadas: ${details.join(', ')}`
}

function loadScriptTag(src: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-browser-print-src="${src}"]`,
    )

    if (existingScript) {
      if (window.BrowserPrint) {
        resolve(true)
        return
      }

      existingScript.addEventListener('load', () => resolve(Boolean(window.BrowserPrint)), {
        once: true,
      })
      existingScript.addEventListener('error', () => reject(new Error(MISSING_LIBRARY_ERROR)), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.dataset.browserPrintSrc = src
    script.onload = () => resolve(Boolean(window.BrowserPrint))
    script.onerror = () => reject(new Error(MISSING_LIBRARY_ERROR))
    document.head.appendChild(script)
  })
}

export async function loadBrowserPrintScript(): Promise<boolean> {
  if (window.BrowserPrint) {
    return true
  }

  if (!browserPrintLoader) {
    browserPrintLoader = loadScriptTag(BROWSER_PRINT_SCRIPT_PATH)
  }

  return browserPrintLoader
}

function getBrowserPrintApi(): BrowserPrintApi {
  if (!window.BrowserPrint) {
    throw new Error(MISSING_LIBRARY_ERROR)
  }

  return window.BrowserPrint
}

function getDefaultPrinter(api: BrowserPrintApi): Promise<BrowserPrintDevice | null> {
  if (!api.getDefaultDevice) {
    throw new Error(SERVICE_NOT_RUNNING_ERROR)
  }

  return new Promise((resolve, reject) => {
    api.getDefaultDevice!(
      'printer',
      (device) => resolve(device),
      () => reject(new Error(SERVICE_NOT_RUNNING_ERROR)),
    )
  })
}

function getLocalPrinters(api: BrowserPrintApi): Promise<BrowserPrintDevice[]> {
  if (!api.getLocalDevices) {
    throw new Error(SERVICE_NOT_RUNNING_ERROR)
  }

  return new Promise((resolve, reject) => {
    api.getLocalDevices!(
      (devices) => resolve(devices),
      () => reject(new Error(SERVICE_NOT_RUNNING_ERROR)),
      'printer',
    )
  })
}

export async function isBrowserPrintAvailable(): Promise<boolean> {
  try {
    const loaded = await loadBrowserPrintScript()
    if (!loaded || !window.BrowserPrint) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function getDefaultZebraPrinter(): Promise<BrowserPrintDevice> {
  const loaded = await loadBrowserPrintScript()
  if (!loaded || !window.BrowserPrint) {
    throw new Error(MISSING_LIBRARY_ERROR)
  }

  const api = getBrowserPrintApi()
  const defaultPrinter = await getDefaultPrinter(api)

  if (defaultPrinter && isPrinterDevice(defaultPrinter)) {
    return defaultPrinter as BrowserPrintDevice
  }

  const devices = await getLocalPrinters(api)
  const printerDevices = devices.filter((device) => isPrinterDevice(device))
  const zebraPrinter = printerDevices.find((device) => isZebraDevice(device))

  if (!zebraPrinter) {
    throw new Error(`No se encontró una impresora Zebra. ${formatDetectedPrinters(printerDevices)}`)
  }

  return zebraPrinter
}

export async function sendZplToZebra(zpl: string): Promise<void> {
  const printer = await getDefaultZebraPrinter()

  return new Promise((resolve, reject) => {
    printer.send(
      zpl,
      () => resolve(),
      () => reject(new Error('No se pudo enviar el ZPL a la impresora Zebra.')),
    )
  })
}
