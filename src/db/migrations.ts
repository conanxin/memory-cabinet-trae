import type { Dexie } from 'dexie'
import { DB_VERSION, STORES_V1, STORES_V2 } from './schema'

export function applyMigrations(db: Dexie): void {
  db.version(1).stores(STORES_V1)
  db.version(2).stores(STORES_V2)
}
