import type { CompanySettings } from '../types'

const STORAGE_KEY = 'glassflow.companySettings'
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])

export interface LogoValidationResult {
  valid: boolean
  errorMessage: string | null
}

export function getDefaultCompanySettings(): CompanySettings {
  return {
    companyName: 'Facundo Morazzo',
    companySubtitle: 'Vidriería y Aberturas',
    companyLogoDataUrl: null,
    showLogo: true,
    showCompanyName: true,
  }
}

function normalizeCompanySettings(value: Partial<CompanySettings>): CompanySettings {
  const defaults = getDefaultCompanySettings()

  return {
    companyName:
      typeof value.companyName === 'string' && value.companyName.trim()
        ? value.companyName
        : defaults.companyName,
    companySubtitle:
      typeof value.companySubtitle === 'string'
        ? value.companySubtitle
        : defaults.companySubtitle,
    companyLogoDataUrl:
      typeof value.companyLogoDataUrl === 'string' && value.companyLogoDataUrl
        ? value.companyLogoDataUrl
        : null,
    showLogo:
      typeof value.showLogo === 'boolean' ? value.showLogo : defaults.showLogo,
    showCompanyName:
      typeof value.showCompanyName === 'boolean'
        ? value.showCompanyName
        : defaults.showCompanyName,
  }
}

export function loadCompanySettings(): CompanySettings {
  if (typeof window === 'undefined') {
    return getDefaultCompanySettings()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return getDefaultCompanySettings()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CompanySettings>
    return normalizeCompanySettings(parsed)
  } catch {
    return getDefaultCompanySettings()
  }
}

export function saveCompanySettings(settings: CompanySettings): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeCompanySettings(settings)),
  )
}

export function validateLogoFile(file: File): LogoValidationResult {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return {
      valid: false,
      errorMessage: 'El logo debe ser PNG, JPG, WebP o SVG.',
    }
  }

  if (file.size > MAX_LOGO_BYTES) {
    return {
      valid: false,
      errorMessage: 'El logo no puede pesar más de 2 MB.',
    }
  }

  return { valid: true, errorMessage: null }
}

export function shouldShowCompanyLogo(settings: CompanySettings): boolean {
  return settings.showLogo && Boolean(settings.companyLogoDataUrl)
}

export function shouldShowCompanyBranding(settings: CompanySettings): boolean {
  return shouldShowCompanyLogo(settings) || settings.showCompanyName
}
