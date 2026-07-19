// MANUAL_REIMPLEMENTATION_FROM_DOCUMENT_CONTRACT
import { memoryItemRepository } from '@/repositories/memory-item-repository'
import { projectService } from './project-service'
import { interviewSessionService } from './interview-session-service'
import type { MemoryItem, MemoryItemType, SourceType, Certainty, Visibility, ReviewStatus } from '@/models/memory-item'
import {
  isValidMemoryItemType, isValidSourceType, isValidCertainty,
  isValidVisibility, isValidReviewStatus,
} from '@/models/memory-item'

export interface CreateMemoryItemInput {
  projectId: string
  interviewSessionId: string
  type: MemoryItemType
  title: string
  originalText: string
  editedText?: string
  sourceStart?: number | null
  sourceEnd?: number | null
  sourceType?: SourceType
  certainty?: Certainty
  visibility?: Visibility
  reviewStatus?: ReviewStatus
}

export type UpdateMemoryItemInput = Partial<Omit<MemoryItem,
  'id' | 'projectId' | 'interviewSessionId' | 'sourceId' |
  'originalText' | 'sourceStart' | 'sourceEnd' | 'createdAt'
>>

function validateEnums(input: CreateMemoryItemInput | UpdateMemoryItemInput): void {
  if (input.type !== undefined && !isValidMemoryItemType(input.type)) {
    throw new Error(`Invalid MemoryItem type: ${input.type}`)
  }
  if ((input as any).sourceType !== undefined && !isValidSourceType((input as any).sourceType)) {
    throw new Error(`Invalid sourceType: ${(input as any).sourceType}`)
  }
  if (input.certainty !== undefined && !isValidCertainty(input.certainty)) {
    throw new Error(`Invalid certainty: ${input.certainty}`)
  }
  if (input.visibility !== undefined && !isValidVisibility(input.visibility)) {
    throw new Error(`Invalid visibility: ${input.visibility}`)
  }
  if (input.reviewStatus !== undefined && !isValidReviewStatus(input.reviewStatus)) {
    throw new Error(`Invalid reviewStatus: ${input.reviewStatus}`)
  }
}

export const memoryItemService = {
  async createMemoryItem(input: CreateMemoryItemInput): Promise<MemoryItem> {
    // Validate project exists
    const project = await projectService.getProjectDetail(input.projectId)
    if (!project) throw new Error('Project not found')

    // Validate interview exists and belongs to project
    const interview = await interviewSessionService.getInterview(input.interviewSessionId)
    if (!interview) throw new Error('Interview session not found')
    if (interview.projectId !== input.projectId) {
      throw new Error('Interview session does not belong to this project')
    }

    // Validate enums
    validateEnums(input)

    // Validate title
    const title = input.title.trim()
    if (title.length === 0) throw new Error('Title cannot be empty')

    // Validate source range: both null or both valid numbers
    const hasStart = input.sourceStart !== undefined && input.sourceStart !== null
    const hasEnd = input.sourceEnd !== undefined && input.sourceEnd !== null
    if (hasStart !== hasEnd) {
      throw new Error('sourceStart and sourceEnd must both be provided or both be null')
    }
    if (hasStart && hasEnd) {
      const s = input.sourceStart as number
      const e = input.sourceEnd as number
      if (s < 0) throw new Error('sourceStart must be >= 0')
      if (e <= s) throw new Error('sourceEnd must be > sourceStart')
      if (e > interview.originalText.length) {
        throw new Error('sourceEnd exceeds interview originalText length')
      }
      const substring = interview.originalText.substring(s, e)
      if (substring !== input.originalText) {
        throw new Error('originalText does not match interview substring at source range')
      }
    }

    return memoryItemRepository.create({
      projectId: input.projectId,
      interviewSessionId: input.interviewSessionId,
      type: input.type,
      title,
      originalText: input.originalText,
      editedText: input.editedText ?? input.originalText,
      sourceStart: hasStart ? (input.sourceStart as number) : null,
      sourceEnd: hasEnd ? (input.sourceEnd as number) : null,
      sourceType: input.sourceType ?? 'first_hand',
      certainty: input.certainty ?? 'approximate',
      visibility: input.visibility ?? 'private',
      reviewStatus: input.reviewStatus ?? 'draft',
      sourceId: input.interviewSessionId,
    })
  },

  async getMemoryItem(id: string): Promise<MemoryItem | null> {
    return memoryItemRepository.getById(id)
  },

  async listByProjectId(projectId: string): Promise<MemoryItem[]> {
    return memoryItemRepository.listByProjectId(projectId)
  },

  async listByInterviewSessionId(interviewSessionId: string): Promise<MemoryItem[]> {
    return memoryItemRepository.listByInterviewSessionId(interviewSessionId)
  },

  async countByProjectId(projectId: string): Promise<number> {
    return memoryItemRepository.countByProjectId(projectId)
  },

  async countByInterviewSessionId(interviewSessionId: string): Promise<number> {
    return memoryItemRepository.countByInterviewSessionId(interviewSessionId)
  },

  async updateMemoryItem(id: string, updates: UpdateMemoryItemInput): Promise<MemoryItem | null> {
    validateEnums(updates as any)
    if (updates.title !== undefined) {
      const t = updates.title.trim()
      if (t.length === 0) throw new Error('Title cannot be empty')
      updates = { ...updates, title: t }
    }
    return memoryItemRepository.update(id, updates)
  },

  async deleteMemoryItem(id: string): Promise<void> {
    await memoryItemRepository.delete(id)
  },
}