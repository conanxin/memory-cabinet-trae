export const DB_NAME = 'memory-cabinet-v02'
export const DB_VERSION = 2

export const STORES_V1 = {
  projects: 'id, title, updatedAt',
  narrators: 'id, &projectId',
  consents: 'id, &projectId',
} as const

export const STORES_V2 = {
  ...STORES_V1,
  interviews: 'id, projectId, interviewDate, updatedAt',
} as const

export const STORES = STORES_V2
