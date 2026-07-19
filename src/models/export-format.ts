// MANUAL_PATCH_FROM_DOCUMENT_CONTRACT
// Added ExportFormatV3 with memoryItems array

import type { Project } from './project'
import type { Narrator } from './narrator'
import type { Consent } from './consent'
import type { InterviewSession } from './interview-session'
import type { MemoryItem } from './memory-item'

export interface ExportFormatV1 {
  format: 'memory-cabinet-project'
  schemaVersion: 1
  appVersion: '0.2.0-alpha.1'
  exportedAt: string
  project: Project
  narrator: Narrator
  consent: Consent
}

export interface ExportFormatV2 {
  format: 'memory-cabinet-project'
  schemaVersion: 2
  appVersion: '0.2.0-alpha.2'
  exportedAt: string
  project: Project
  narrator: Narrator
  consent: Consent
  interviews: InterviewSession[]
}

export interface ExportFormatV3 {
  format: 'memory-cabinet-project'
  schemaVersion: 3
  appVersion: '0.2.0-alpha.3'
  exportedAt: string
  project: Project
  narrator: Narrator
  consent: Consent
  interviews: InterviewSession[]
  memoryItems: MemoryItem[]
}

export type ExportFormat = ExportFormatV1 | ExportFormatV2 | ExportFormatV3

export function isExportFormat(data: unknown): data is ExportFormat {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (obj.format !== 'memory-cabinet-project') return false
  if (obj.schemaVersion !== 1 && obj.schemaVersion !== 2 && obj.schemaVersion !== 3) return false
  if (!obj.project || !obj.narrator || !obj.consent) return false

  // Validate consent boolean fields
  const consent = obj.consent as Record<string, unknown>
  const boolFields = ['consentToRecord', 'consentToStoreQuotes', 'consentToStorePhotos', 'consentToFamilyView', 'consentToPublicDisplay']
  for (const field of boolFields) {
    if (typeof consent[field] !== 'boolean') return false
  }

  // Validate interviews array for v2/v3 - must be an array
  if (obj.schemaVersion === 2 || obj.schemaVersion === 3) {
    if (!Array.isArray(obj.interviews)) return false
  }

  // Validate memoryItems array for v3 - must be an array
  if (obj.schemaVersion === 3) {
    if (!Array.isArray(obj.memoryItems)) return false
  }

  return true
}