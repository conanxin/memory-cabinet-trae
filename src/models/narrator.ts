export interface Narrator {
  id: string
  projectId: string
  name: string
  relationshipToInterviewer: string
  birthYear: number | null
  notes: string
  createdAt: string
  updatedAt: string
}

export function createNarrator(partial: Partial<Narrator> & { projectId: string; name: string }): Narrator {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    projectId: partial.projectId,
    name: partial.name,
    relationshipToInterviewer: partial.relationshipToInterviewer ?? '',
    birthYear: partial.birthYear ?? null,
    notes: partial.notes ?? '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}
