import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getDefaultCompanySettings,
  loadCompanySettings,
  saveCompanySettings,
  shouldShowCompanyBranding,
  shouldShowCompanyLogo,
  validateLogoFile,
} from './companySettings'

const STORAGE_KEY = 'glassflow.companySettings'

function makeLocalStorageMock() {
  const storage = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key)
    }),
    clear: vi.fn(() => {
      storage.clear()
    }),
  }
}

function makeFile(type: string, size: number): File {
  return { type, size } as File
}

describe('companySettings', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carga defaults si no hay configuracion guardada', () => {
    vi.stubGlobal('window', { localStorage: makeLocalStorageMock() })

    expect(loadCompanySettings()).toEqual(getDefaultCompanySettings())
  })

  it('guarda y carga la configuracion desde localStorage', () => {
    const localStorage = makeLocalStorageMock()
    vi.stubGlobal('window', { localStorage })
    const settings = {
      ...getDefaultCompanySettings(),
      companyName: 'Marca Test',
      companyLogoDataUrl: 'data:image/png;base64,test',
      showLogo: false,
    }

    saveCompanySettings(settings)

    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('Marca Test'),
    )
    expect(loadCompanySettings()).toEqual(settings)
  })

  it('acepta PNG, JPG, WebP y SVG validos', () => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

    validTypes.forEach((type) => {
      expect(validateLogoFile(makeFile(type, 1024))).toEqual({
        valid: true,
        errorMessage: null,
      })
    })
  })

  it('rechaza archivos demasiado grandes', () => {
    expect(validateLogoFile(makeFile('image/png', 2 * 1024 * 1024 + 1))).toEqual({
      valid: false,
      errorMessage: 'El logo no puede pesar más de 2 MB.',
    })
  })

  it('no muestra logo si showLogo=false', () => {
    const settings = {
      ...getDefaultCompanySettings(),
      companyLogoDataUrl: 'data:image/png;base64,test',
      showLogo: false,
    }

    expect(shouldShowCompanyLogo(settings)).toBe(false)
  })

  it('mantiene branding textual si showCompanyName=true', () => {
    const settings = {
      ...getDefaultCompanySettings(),
      companyLogoDataUrl: null,
      showLogo: false,
      showCompanyName: true,
    }

    expect(shouldShowCompanyBranding(settings)).toBe(true)
  })
})
