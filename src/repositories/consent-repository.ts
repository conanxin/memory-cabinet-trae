import { db } from '@/db/database'
import type { Consent } from '@/models/consent'

export const consentRepository = {
  async getByProjectId(projectId: string): Promise<Consent | undefined> {
    return db.consents.where('projectId').equals(projectId).first()
  },

  async create(consent: Consent): Promise<string> {
    return db.consents.add(consent) as unknown as string
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    await db.consents.where('projectId').equals(projectId).delete()
  },
}
