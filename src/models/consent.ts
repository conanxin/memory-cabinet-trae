export interface Consent {
  id: string
  projectId: string
  consentToRecord: boolean
  consentToStoreQuotes: boolean
  consentToStorePhotos: boolean
  consentToFamilyView: boolean
  consentToPublicDisplay: boolean
  confirmedAt: string
  confirmationMethod: string
  notes: string
  createdAt: string
  updatedAt: string
}

export function createConsent(partial: Partial<Consent> & { projectId: string }): Consent {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    consentToRecord: false,
    consentToStoreQuotes: false,
    consentToStorePhotos: false,
    consentToFamilyView: false,
    consentToPublicDisplay: false,
    confirmedAt: now,
    confirmationMethod: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}