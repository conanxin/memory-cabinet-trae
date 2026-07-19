// MANUAL_REIMPLEMENTATION_FROM_DOCUMENT_CONTRACT
import { db } from '@/db/database'
import { createMemoryItem, type MemoryItem } from '@/models/memory-item'

export const memoryItemRepository = {
  async create(
    data: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MemoryItem> {
    const item = createMemoryItem(data as any)
    await db.memoryItems.add(item)
    return item
  },

  async getById(id: string): Promise<MemoryItem | null> {
    const result = await db.memoryItems.get(id)
    return result ?? null
  },

  async listByProjectId(projectId: string): Promise<MemoryItem[]> {
    return db.memoryItems.where('projectId').equals(projectId).reverse().sortBy('updatedAt')
  },

  async listByInterviewSessionId(interviewSessionId: string): Promise<MemoryItem[]> {
    return db.memoryItems.where('interviewSessionId').equals(interviewSessionId).reverse().sortBy('updatedAt')
  },

  async countByProjectId(projectId: string): Promise<number> {
    return db.memoryItems.where('projectId').equals(projectId).count()
  },

  async countByInterviewSessionId(interviewSessionId: string): Promise<number> {
    return db.memoryItems.where('interviewSessionId').equals(interviewSessionId).count()
  },

  async update(id: string, updates: Partial<MemoryItem>): Promise<MemoryItem | null> {
    const existing = await db.memoryItems.get(id)
    if (!existing) return null

    const updated: MemoryItem = {
      ...existing,
      ...updates,
      id: existing.id,
      projectId: existing.projectId,
      interviewSessionId: existing.interviewSessionId,
      sourceId: existing.sourceId,
      originalText: existing.originalText,
      sourceStart: existing.sourceStart,
      sourceEnd: existing.sourceEnd,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }
    await db.memoryItems.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    await db.memoryItems.delete(id)
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    await db.memoryItems.where('projectId').equals(projectId).delete()
  },

  async deleteByInterviewSessionId(interviewSessionId: string): Promise<void> {
    await db.memoryItems.where('interviewSessionId').equals(interviewSessionId).delete()
  },
}