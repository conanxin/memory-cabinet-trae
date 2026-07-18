import type { Dexie } from 'dexie'
import { DB_VERSION, STORES } from './schema'

export function applyMigrations(db: Dexie): void {
  db.version(DB_VERSION).stores(STORES)
}
