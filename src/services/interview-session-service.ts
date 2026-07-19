import { interviewSessionRepository } from '@/repositories/interview-session-repository'
import type { InterviewSession } from '@/models/interview-session'
import { db } from '@/db/database'
import { memoryItemRepository } from '@/repositories/memory-item-repository'

export interface CreateInterviewInput {
  projectId: string
  title: string
  interviewDate?: string
  location?: string
  interviewerName?: string
  originalText?: string
  notes?: string
}

export const interviewSessionService = {
  async createInterview(input: CreateInterviewInput): Promise<InterviewSession> {
    return interviewSessionRepository.create({
      projectId: input.projectId,
      title: input.title,
      interviewDate: input.interviewDate ?? new Date().toISOString(),
      location: input.location ?? '',
      interviewerName: input.interviewerName ?? '',
      originalText: input.originalText ?? '',
      notes: input.notes ?? '',
    })
  },

  async getInterview(id: string): Promise<InterviewSession | null> {
    return interviewSessionRepository.getById(id)
  },

  async listInterviews(projectId: string): Promise<InterviewSession[]> {
    const list = await interviewSessionRepository.listByProjectId(projectId)
    // Sort by interviewDate descending, then updatedAt descending
    return list.sort((a, b) => {
      const dateCmp = b.interviewDate.localeCompare(a.interviewDate)
      if (dateCmp !== 0) return dateCmp
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  },

  async countInterviews(projectId: string): Promise<number> {
    return interviewSessionRepository.countByProjectId(projectId)
  },

  async updateInterview(
    id: string,
    updates: Partial<Omit<InterviewSession, 'id' | 'projectId' | 'createdAt'>>,
  ): Promise<InterviewSession | null> {
    return interviewSessionRepository.update(id, updates)
  },

  async deleteInterview(id: string): Promise<void> {
    await db.transaction(
      'rw',
      [db.interviews, db.memoryItems],
      async () => {
        await memoryItemRepository.deleteByInterviewSessionId(id)
        await interviewSessionRepository.delete(id)
      },
    )
  },
}
