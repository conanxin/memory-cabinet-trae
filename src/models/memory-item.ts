// MANUAL_REIMPLEMENTATION_FROM_DOCUMENT_CONTRACT
// Based on DATA-MODEL.md §4.5 from session 6a5631

export type MemoryItemType =
  | 'event'
  | 'person'
  | 'place'
  | 'object'
  | 'quote'
  | 'theme'

export type SourceType =
  | 'first_hand'
  | 'family_retelling'
  | 'document'
  | 'photo'
  | 'uncertain'

export type Certainty =
  | 'certain'
  | 'approximate'
  | 'uncertain'
  | 'needs_verification'

export type Visibility =
  | 'private'
  | 'family'
  | 'public'

export type ReviewStatus =
  | 'draft'
  | 'confirmed'
  | 'excluded'

export const MEMORY_ITEM_TYPES: readonly MemoryItemType[] = ['event', 'person', 'place', 'object', 'quote', 'theme']
export const SOURCE_TYPES: readonly SourceType[] = ['first_hand', 'family_retelling', 'document', 'photo', 'uncertain']
export const CERTAINTY_LEVELS: readonly Certainty[] = ['certain', 'approximate', 'uncertain', 'needs_verification']
export const VISIBILITY_LEVELS: readonly Visibility[] = ['private', 'family', 'public']
export const REVIEW_STATUSES: readonly ReviewStatus[] = ['draft', 'confirmed', 'excluded']

export function isValidMemoryItemType(v: unknown): v is MemoryItemType {
  return MEMORY_ITEM_TYPES.includes(v as MemoryItemType)
}
export function isValidSourceType(v: unknown): v is SourceType {
  return SOURCE_TYPES.includes(v as SourceType)
}
export function isValidCertainty(v: unknown): v is Certainty {
  return CERTAINTY_LEVELS.includes(v as Certainty)
}
export function isValidVisibility(v: unknown): v is Visibility {
  return VISIBILITY_LEVELS.includes(v as Visibility)
}
export function isValidReviewStatus(v: unknown): v is ReviewStatus {
  return REVIEW_STATUSES.includes(v as ReviewStatus)
}

export interface MemoryItem {
  id: string
  projectId: string
  interviewSessionId: string
  sourceId: string
  type: MemoryItemType
  title: string
  originalText: string
  editedText: string
  sourceStart: number | null
  sourceEnd: number | null
  sourceType: SourceType
  certainty: Certainty
  visibility: Visibility
  reviewStatus: ReviewStatus
  createdAt: string
  updatedAt: string
}

export function createMemoryItem(
  partial: Partial<MemoryItem> & {
    projectId: string
    interviewSessionId: string
    title: string
    originalText: string
    type: MemoryItemType
  },
): MemoryItem {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    projectId: partial.projectId,
    interviewSessionId: partial.interviewSessionId,
    sourceId: partial.sourceId ?? partial.interviewSessionId,
    type: partial.type,
    title: partial.title.trim(),
    originalText: partial.originalText,
    editedText: partial.editedText ?? partial.originalText,
    sourceStart: partial.sourceStart ?? null,
    sourceEnd: partial.sourceEnd ?? null,
    sourceType: partial.sourceType ?? 'first_hand',
    certainty: partial.certainty ?? 'approximate',
    visibility: partial.visibility ?? 'private',
    reviewStatus: partial.reviewStatus ?? 'draft',
    createdAt: now,
    updatedAt: now,
  }
}