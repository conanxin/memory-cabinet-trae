export const DB_NAME = 'memory-cabinet-v02'
export const DB_VERSION = 1

export const STORES = {
  projects: 'id, title, updatedAt',
  narrators: 'id, &projectId',
  consents: 'id, &projectId',
} as const
