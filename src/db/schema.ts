// MANUAL_PATCH_FROM_DOCUMENT_CONTRACT
// Added STORES_V3 with memoryItems table (DATA-MODEL.md §4.5)

export const DB_NAME = 'memory-cabinet-v02'
export const DB_VERSION = 3

export const STORES_V1 = {
  projects: 'id, title, updatedAt',
  narrators: 'id, &projectId',
  consents: 'id, &projectId',
} as const

export const STORES_V2 = {
  ...STORES_V1,
  interviews: 'id, projectId, interviewDate, updatedAt',
} as const

export const STORES_V3 = {
  ...STORES_V2,
  memoryItems: 'id, projectId, interviewSessionId, type, reviewStatus, updatedAt',
} as const

export const STORES = STORES_V3