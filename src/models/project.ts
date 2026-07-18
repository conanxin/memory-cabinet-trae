export interface Project {
  id: string
  title: string
  description: string
  narratorId: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

export function createProject(partial: Partial<Project> & { title: string; narratorId: string }): Project {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: partial.title,
    description: partial.description ?? '',
    narratorId: partial.narratorId,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}
