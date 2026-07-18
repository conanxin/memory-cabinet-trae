export interface InterviewSession {
  id: string
  projectId: string
  title: string
  interviewDate: string
  location: string
  interviewerName: string
  originalText: string
  notes: string
  createdAt: string
  updatedAt: string
}

export function createInterviewSession(
  partial: Partial<InterviewSession> & { projectId: string; title: string },
): InterviewSession {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    projectId: partial.projectId,
    title: partial.title,
    interviewDate: partial.interviewDate ?? now,
    location: partial.location ?? '',
    interviewerName: partial.interviewerName ?? '',
    originalText: partial.originalText ?? '',
    notes: partial.notes ?? '',
    createdAt: now,
    updatedAt: now,
  }
}
