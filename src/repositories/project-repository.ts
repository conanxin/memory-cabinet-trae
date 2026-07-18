import { db } from '@/db/database'
import type { Project } from '@/models/project'

export const projectRepository = {
  async getAll(): Promise<Project[]> {
    return db.projects.orderBy('updatedAt').reverse().toArray()
  },

  async getById(id: string): Promise<Project | undefined> {
    return db.projects.get(id)
  },

  async create(project: Project): Promise<string> {
    return db.projects.add(project) as unknown as string
  },

  async update(id: string, changes: Partial<Project>): Promise<void> {
    await db.projects.update(id, { ...changes, updatedAt: new Date().toISOString() })
  },

  async delete(id: string): Promise<void> {
    await db.projects.delete(id)
  },

  async existsByTitle(title: string): Promise<boolean> {
    const count = await db.projects.where('title').equals(title).count()
    return count > 0
  },
}
