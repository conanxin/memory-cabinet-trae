// MANUAL_PATCH_FROM_DOCUMENT_CONTRACT
// Added memoryItems table

import Dexie from 'dexie'
import { DB_NAME } from './schema'
import { applyMigrations } from './migrations'

class MemoryCabinetDatabase extends Dexie {
  projects!: Dexie.Table<import('@/models/project').Project, string>
  narrators!: Dexie.Table<import('@/models/narrator').Narrator, string>
  consents!: Dexie.Table<import('@/models/consent').Consent, string>
  interviews!: Dexie.Table<import('@/models/interview-session').InterviewSession, string>
  memoryItems!: Dexie.Table<import('@/models/memory-item').MemoryItem, string>

  constructor() {
    super(DB_NAME)
    applyMigrations(this)
  }
}

export const db = new MemoryCabinetDatabase()