import { db } from '@/db/database'
import type { Narrator } from '@/models/narrator'

export const narratorRepository = {
  async getByProjectId(projectId: string): Promise<Narrator | undefined> {
    return db.narrators.where('projectId').equals(projectId).first()
  },

  async create(narrator: Narrator): Promise<string> {
    return db.narrators.add(narrator) as unknown as string
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    await db.narrators.where('projectId').equals(projectId).delete()
  },
}
