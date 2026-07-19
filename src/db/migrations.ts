// MANUAL_PATCH_FROM_DOCUMENT_CONTRACT
// Added v3 migration for memoryItems table

import type { Dexie } from 'dexie'
import { STORES_V1, STORES_V2, STORES_V3 } from './schema'

export function applyMigrations(db: Dexie): void {
  db.version(1).stores(STORES_V1)
  db.version(2).stores(STORES_V2)
  db.version(3).stores(STORES_V3)
}