import type { Project } from './project'
import type { Narrator } from './narrator'
import type { Consent } from './consent'

export interface ExportFormat {
  format: 'memory-cabinet-project'
  schemaVersion: 1
  appVersion: '0.2.0-alpha.1'
  exportedAt: string
  project: Project
  narrator: Narrator
  consent: Consent
}

export function isExportFormat(data: unknown): data is ExportFormat {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (obj.format !== 'memory-cabinet-project') return false
  if (obj.schemaVersion !== 1) return false
  if (!obj.project || !obj.narrator || !obj.consent) return false

  // Validate consent boolean fields
  const consent = obj.consent as Record<string, unknown>
  const boolFields = ['consentToRecord', 'consentToStoreQuotes', 'consentToStorePhotos', 'consentToFamilyView', 'consentToPublicDisplay']
  for (const field of boolFields) {
    if (typeof consent[field] !== 'boolean') return false
  }

  return true
}
