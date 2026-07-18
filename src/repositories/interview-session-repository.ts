import { db } from '@/db/database'
import { createInterviewSession, type InterviewSession } from '@/models/interview-session'

export const interviewSessionRepository = {
  async create(
    data: Omit<InterviewSession, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<InterviewSession> {
    const session = createInterviewSession(data)
    await db.interviews.add(session)
    return session
  },

  async getById(id: string): Promise<InterviewSession | null> {
    const result = await db.interviews.get(id)
    return result ?? null
  },

  async listByProjectId(projectId: string): Promise<InterviewSession[]> {
    return db.interviews.where('projectId').equals(projectId).toArray()
  },

  async countByProjectId(projectId: string): Promise<number> {
    return db.interviews.where('projectId').equals(projectId).count()
  },

  async update(id: string, updates: Partial<InterviewSession>): Promise<InterviewSession | null> {
    const existing = await db.interviews.get(id)
    if (!existing) return null

    const updated: InterviewSession = {
      ...existing,
      ...updates,
      id: existing.id,
      projectId: existing.projectId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }
    await db.interviews.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    await db.interviews.delete(id)
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    await db.interviews.where('projectId').equals(projectId).delete()
  },
}
