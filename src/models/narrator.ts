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
    relationshipToInterviewer: '',
    birthYear: null,
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}